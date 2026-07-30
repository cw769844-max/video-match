import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import { createServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { authRouter } from "./routes/auth.js";
import { campaignsRouter } from "./routes/campaigns.js";
import { registerDuelHandlers } from "./duel/socket.js";

const PORT = Number(process.env.PORT ?? 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET ?? "dev-secret-change-me",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", maxAge: 1000 * 60 * 60 * 24 * 30 },
});
app.use(sessionMiddleware);

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);
app.use("/api/campaigns", campaignsRouter);

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: CLIENT_ORIGIN, credentials: true },
});
io.engine.use(sessionMiddleware);

registerDuelHandlers(io);

httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
