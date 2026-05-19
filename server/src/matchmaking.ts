import { QueueEntry, MatchedPair, MatchFilters } from './types';
import { v4 as uuidv4 } from 'uuid';
import logger from './logger';

const QUEUE_TIMEOUT_MS = 30_000;

export class MatchmakingService {
  private queue: Map<string, QueueEntry> = new Map();           // socketId -> entry
  private activeRooms: Map<string, [string, string]> = new Map(); // roomId -> [socketIdA, socketIdB]
  private socketToRoom: Map<string, string> = new Map();          // socketId -> roomId
  private uidToSocket: Map<string, string> = new Map();           // uid -> socketId

  enqueue(entry: QueueEntry): void {
    this.queue.set(entry.socketId, entry);
    this.uidToSocket.set(entry.uid, entry.socketId);
    logger.info(`Enqueued ${entry.uid} (premium: ${entry.isPremium}), queue size: ${this.queue.size}`);
  }

  dequeue(socketId: string): void {
    const entry = this.queue.get(socketId);
    if (entry) this.uidToSocket.delete(entry.uid);
    this.queue.delete(socketId);
    logger.info(`Dequeued ${socketId}, queue size: ${this.queue.size}`);
  }

  findMatch(socketId: string): MatchedPair | null {
    const seeker = this.queue.get(socketId);
    if (!seeker) return null;

    const now = Date.now();
    const waitMs = now - seeker.joinedAt;
    const relaxFilters = waitMs > QUEUE_TIMEOUT_MS;

    for (const [candidateId, candidate] of this.queue) {
      if (candidateId === socketId) continue;

      if (this.isCompatible(seeker, candidate, relaxFilters)) {
        const roomId = uuidv4();
        this.dequeue(socketId);
        this.dequeue(candidateId);
        this.createRoom(roomId, socketId, candidateId);

        logger.info(`Matched ${seeker.uid} <-> ${candidate.uid} in room ${roomId}`);
        return { roomId, userA: seeker, userB: candidate };
      }
    }

    return null;
  }

  /** Directly wire two sockets into a room (admin force-match or internal use). */
  createRoom(roomId: string, socketIdA: string, socketIdB: string): void {
    this.activeRooms.set(roomId, [socketIdA, socketIdB]);
    this.socketToRoom.set(socketIdA, roomId);
    this.socketToRoom.set(socketIdB, roomId);
  }

  private isCompatible(a: QueueEntry, b: QueueEntry, relaxFilters: boolean): boolean {
    return (
      this.passesFilters(a, b, relaxFilters) &&
      this.passesFilters(b, a, relaxFilters)
    );
  }

  private passesFilters(seeker: QueueEntry, candidate: QueueEntry, relax: boolean): boolean {
    if (!seeker.isPremium || !seeker.filters || relax) return true;

    const { genders, ageRange, countries } = seeker.filters;

    if (genders && genders.length > 0) {
      if (!genders.includes(candidate.gender)) return false;
    }

    if (ageRange) {
      if (candidate.age < ageRange.min || candidate.age > ageRange.max) return false;
    }

    if (countries && countries.length > 0) {
      if (!countries.includes(candidate.country)) return false;
    }

    return true;
  }

  endRoom(roomId: string): [string, string] | null {
    const pair = this.activeRooms.get(roomId);
    if (!pair) return null;

    const [a, b] = pair;
    this.activeRooms.delete(roomId);
    this.socketToRoom.delete(a);
    this.socketToRoom.delete(b);
    return pair;
  }

  getRoomForSocket(socketId: string): string | undefined {
    return this.socketToRoom.get(socketId);
  }

  getPeerSocket(socketId: string): string | undefined {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return undefined;

    const pair = this.activeRooms.get(roomId);
    if (!pair) return undefined;

    return pair[0] === socketId ? pair[1] : pair[0];
  }

  /** Look up a currently-queued user's socket ID by their Firebase UID. */
  getSocketByUid(uid: string): string | undefined {
    return this.uidToSocket.get(uid);
  }

  handleDisconnect(socketId: string): { roomId: string; peerSocketId: string } | null {
    const entry = this.queue.get(socketId);
    if (entry) this.uidToSocket.delete(entry.uid);
    this.queue.delete(socketId);

    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return null;

    const pair = this.endRoom(roomId);
    if (!pair) return null;

    const peerSocketId = pair[0] === socketId ? pair[1] : pair[0];
    return { roomId, peerSocketId };
  }

  /** Return a snapshot of all currently-connected socket IDs and their UIDs. */
  getOnlineUsers(): Array<{ socketId: string; uid: string; isInQueue: boolean; roomId?: string }> {
    const result: Array<{ socketId: string; uid: string; isInQueue: boolean; roomId?: string }> = [];

    for (const [uid, socketId] of this.uidToSocket) {
      result.push({
        uid,
        socketId,
        isInQueue: this.queue.has(socketId),
        roomId: this.socketToRoom.get(socketId),
      });
    }

    return result;
  }

  getQueueSize(): number {
    return this.queue.size;
  }

  getActiveRoomCount(): number {
    return this.activeRooms.size;
  }
}
