import type { Server } from "socket.io";

// Placeholder wiring for the real-time duel engine (lobby, game state sync,
// chain/priority resolution). Fleshed out in later phases; for now this just
// establishes the connection and room-join handshake so the client can be
// built against a stable socket contract.
export function registerDuelHandlers(io: Server) {
  io.on("connection", (socket) => {
    socket.on("lobby:join", (matchId: string) => {
      socket.join(matchId);
      io.to(matchId).emit("lobby:playerJoined", { socketId: socket.id });
    });

    socket.on("disconnect", () => {
      // TODO: notify opponent, pause timer, allow reconnect grace period
    });
  });
}
