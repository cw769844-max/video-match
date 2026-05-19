import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import admin from 'firebase-admin';
import { MatchmakingService } from './matchmaking';
import { QueueEntry, MatchFilters, SignalData, ReportPayload } from './types';
import usersRouter from './routes/users';
import subscriptionsRouter from './routes/subscriptions';
import logger from './logger';

// ─── Firebase Admin Init ────────────────────────────────────────────────────
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const db = admin.firestore();

// ─── Express Setup ──────────────────────────────────────────────────────────
const app = express();
const httpServer = createServer(app);

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim());

app.use(cors({ origin: allowedOrigins, credentials: true }));

// Raw body for Stripe webhook — MUST come before express.json()
app.use('/api/subscriptions/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

app.use('/api/users', usersRouter);
app.use('/api/subscriptions', subscriptionsRouter);

app.get('/health', (_, res) => {
  res.json({
    status: 'ok',
    queueSize: matchmaking.getQueueSize(),
    activeRooms: matchmaking.getActiveRoomCount(),
  });
});

// ─── Socket.io ──────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: { origin: allowedOrigins, credentials: true },
  transports: ['websocket', 'polling'],
});

const matchmaking = new MatchmakingService();

// ICE server config sent to clients
const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  ...(process.env.TURN_URLS
    ? [
        {
          urls: process.env.TURN_URLS,
          username: process.env.TURN_USERNAME,
          credential: process.env.TURN_CREDENTIAL,
        },
      ]
    : []),
];

async function verifySocket(socket: Socket): Promise<admin.auth.DecodedIdToken | null> {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) return null;

  try {
    return await admin.auth().verifyIdToken(token);
  } catch {
    return null;
  }
}

async function getUserProfile(uid: string) {
  const doc = await db.collection('users').doc(uid).get();
  return doc.exists ? (doc.data() as Record<string, unknown>) : null;
}

function calcAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

io.use(async (socket, next) => {
  const decoded = await verifySocket(socket);
  if (!decoded) {
    return next(new Error('Authentication required'));
  }

  const profile = await getUserProfile(decoded.uid);
  if (!profile) {
    return next(new Error('Profile not found — complete registration first'));
  }

  if (profile.isBanned) {
    return next(new Error('Account suspended'));
  }

  (socket as Socket & { uid: string; profile: Record<string, unknown> }).uid = decoded.uid;
  (socket as Socket & { uid: string; profile: Record<string, unknown> }).profile = profile;
  next();
});

io.on('connection', (socket) => {
  const uid = (socket as Socket & { uid: string }).uid;
  const profile = (socket as Socket & { profile: Record<string, unknown> }).profile;

  logger.info(`Connected: ${uid} (${socket.id})`);

  // Send ICE config to the client
  socket.emit('ice-servers', { iceServers });

  // ── Find Match ───────────────────────────────────────────────────────────
  socket.on('find-match', (data: { filters?: MatchFilters }) => {
    const age = calcAge(profile.dateOfBirth as string);

    const entry: QueueEntry = {
      socketId: socket.id,
      uid,
      gender: profile.gender as QueueEntry['gender'],
      age,
      country: profile.country as string,
      isPremium: profile.isPremium as boolean,
      filters: profile.isPremium ? data?.filters : undefined,
      joinedAt: Date.now(),
    };

    matchmaking.enqueue(entry);
    socket.emit('queued', { position: matchmaking.getQueueSize() });

    // Try to match immediately and then poll
    tryMatch(socket.id);
  });

  function tryMatch(socketId: string) {
    const pair = matchmaking.findMatch(socketId);
    if (!pair) {
      // Retry after 1 second if still in queue
      setTimeout(() => {
        if (matchmaking.getQueueSize() > 1) {
          tryMatch(socketId);
        }
      }, 1000);
      return;
    }

    const { roomId, userA, userB } = pair;

    // Notify both users — userA sends the offer
    io.to(userA.socketId).emit('match-found', {
      roomId,
      isInitiator: true,
      peerGender: userB.gender,
      peerCountry: userB.country,
    });

    io.to(userB.socketId).emit('match-found', {
      roomId,
      isInitiator: false,
      peerGender: userA.gender,
      peerCountry: userA.country,
    });
  }

  // ── WebRTC Signaling ─────────────────────────────────────────────────────
  socket.on('signal', (data: { roomId: string; signal: SignalData }) => {
    const peer = matchmaking.getPeerSocket(socket.id);
    if (!peer) {
      socket.emit('error', { message: 'No peer connected' });
      return;
    }
    io.to(peer).emit('signal', { signal: data.signal });
  });

  // ── Skip / Next ──────────────────────────────────────────────────────────
  socket.on('skip', () => {
    const result = matchmaking.handleDisconnect(socket.id);
    if (result) {
      io.to(result.peerSocketId).emit('peer-disconnected');
    }
  });

  // ── Cancel Matchmaking ───────────────────────────────────────────────────
  socket.on('cancel-match', () => {
    matchmaking.dequeue(socket.id);
    socket.emit('match-cancelled');
  });

  // ── Report ───────────────────────────────────────────────────────────────
  socket.on('report', async (payload: ReportPayload) => {
    try {
      await db.collection('reports').add({
        ...payload,
        reporterUid: uid,
        reporterSocketId: socket.id,
        createdAt: new Date().toISOString(),
        status: 'pending',
      });

      await db.collection('users').doc(payload.reportedUid).update({
        reportCount: admin.firestore.FieldValue.increment(1),
      });

      socket.emit('report-submitted');
    } catch (err) {
      logger.error(`Report error: ${err}`);
    }
  });

  // ── Disconnect ───────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    logger.info(`Disconnected: ${uid} (${socket.id})`);

    const result = matchmaking.handleDisconnect(socket.id);
    if (result) {
      io.to(result.peerSocketId).emit('peer-disconnected');
    }
  });
});

// ─── Start ──────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3001', 10);
httpServer.listen(PORT, () => {
  logger.info(`VideoMatch server running on port ${PORT}`);
});

export default app;
