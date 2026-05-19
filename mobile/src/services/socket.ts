import { io, Socket } from 'socket.io-client';
import { Config } from '../constants/config';
import { getIdToken } from './firebase';
import { MatchFilters, PeerInfo } from '../types';

type IceServer = { urls: string; username?: string; credential?: string };

export interface MatchFoundEvent {
  roomId: string;
  isInitiator: boolean;
  peerUid: string;
  peerGender: string;
  peerCountry: string;
}

export interface SignalEvent {
  signal: RTCSessionDescriptionInit | RTCIceCandidateInit;
}

let socket: Socket | null = null;

export async function connectSocket(): Promise<Socket> {
  if (socket?.connected) return socket;

  const token = await getIdToken();
  if (!token) throw new Error('Not authenticated');

  socket = io(Config.SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return new Promise((resolve, reject) => {
    socket!.on('connect', () => resolve(socket!));
    socket!.on('connect_error', (err) => reject(err));
  });
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function findMatch(filters?: MatchFilters): void {
  socket?.emit('find-match', { filters });
}

export function cancelMatch(): void {
  socket?.emit('cancel-match');
}

export function skipPeer(): void {
  socket?.emit('skip');
}

export function sendSignal(
  roomId: string,
  signal: RTCSessionDescriptionInit | RTCIceCandidateInit,
): void {
  socket?.emit('signal', { roomId, signal });
}

export function sendReport(payload: {
  reportedUid: string;
  roomId: string;
  reason: string;
  description?: string;
}): void {
  socket?.emit('report', payload);
}

export function onIceServers(cb: (data: { iceServers: IceServer[] }) => void) {
  socket?.on('ice-servers', cb);
  return () => socket?.off('ice-servers', cb);
}

export function onQueued(cb: (data: { position: number }) => void) {
  socket?.on('queued', cb);
  return () => socket?.off('queued', cb);
}

export function onMatchFound(cb: (data: MatchFoundEvent) => void) {
  socket?.on('match-found', cb);
  return () => socket?.off('match-found', cb);
}

export function onSignal(cb: (data: SignalEvent) => void) {
  socket?.on('signal', cb);
  return () => socket?.off('signal', cb);
}

export function onPeerDisconnected(cb: () => void) {
  socket?.on('peer-disconnected', cb);
  return () => socket?.off('peer-disconnected', cb);
}

export function offAll(...events: string[]) {
  events.forEach((e) => socket?.off(e));
}
