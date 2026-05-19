import { QueueEntry, MatchedPair, MatchFilters, Gender } from './types';
import { v4 as uuidv4 } from 'uuid';
import logger from './logger';

const QUEUE_TIMEOUT_MS = 30_000; // 30 seconds before relaxing premium filters

export class MatchmakingService {
  private queue: Map<string, QueueEntry> = new Map(); // socketId -> entry
  private activeRooms: Map<string, [string, string]> = new Map(); // roomId -> [socketIdA, socketIdB]
  private socketToRoom: Map<string, string> = new Map(); // socketId -> roomId

  enqueue(entry: QueueEntry): void {
    this.queue.set(entry.socketId, entry);
    logger.info(`Enqueued ${entry.uid} (premium: ${entry.isPremium}), queue size: ${this.queue.size}`);
  }

  dequeue(socketId: string): void {
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
        this.queue.delete(socketId);
        this.queue.delete(candidateId);
        this.activeRooms.set(roomId, [socketId, candidateId]);
        this.socketToRoom.set(socketId, roomId);
        this.socketToRoom.set(candidateId, roomId);

        logger.info(`Matched ${seeker.uid} <-> ${candidate.uid} in room ${roomId}`);
        return { roomId, userA: seeker, userB: candidate };
      }
    }

    return null;
  }

  private isCompatible(a: QueueEntry, b: QueueEntry, relaxFilters: boolean): boolean {
    // Both users must pass each other's filters
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

  handleDisconnect(socketId: string): { roomId: string; peerSocketId: string } | null {
    this.queue.delete(socketId);

    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return null;

    const pair = this.endRoom(roomId);
    if (!pair) return null;

    const peerSocketId = pair[0] === socketId ? pair[1] : pair[0];
    return { roomId, peerSocketId };
  }

  getQueueSize(): number {
    return this.queue.size;
  }

  getActiveRoomCount(): number {
    return this.activeRooms.size;
  }
}
