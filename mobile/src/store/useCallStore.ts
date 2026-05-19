import { create } from 'zustand';
import { MediaStream } from 'react-native-webrtc';
import { CallStatus, MatchFilters, PeerInfo } from '../types';

interface CallState {
  status: CallStatus;
  roomId: string | null;
  isInitiator: boolean;
  peer: PeerInfo | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  filters: MatchFilters;
  duration: number;

  setStatus: (status: CallStatus) => void;
  setRoom: (roomId: string, isInitiator: boolean, peer: PeerInfo) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  setMuted: (muted: boolean) => void;
  setCameraOff: (off: boolean) => void;
  setFilters: (filters: MatchFilters) => void;
  incrementDuration: () => void;
  reset: () => void;
}

export const useCallStore = create<CallState>((set) => ({
  status: 'idle',
  roomId: null,
  isInitiator: false,
  peer: null,
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isCameraOff: false,
  filters: {},
  duration: 0,

  setStatus: (status) => set({ status }),
  setRoom: (roomId, isInitiator, peer) => set({ roomId, isInitiator, peer }),
  setLocalStream: (localStream) => set({ localStream }),
  setRemoteStream: (remoteStream) => set({ remoteStream }),
  setMuted: (isMuted) => set({ isMuted }),
  setCameraOff: (isCameraOff) => set({ isCameraOff }),
  setFilters: (filters) => set({ filters }),
  incrementDuration: () => set((s) => ({ duration: s.duration + 1 })),
  reset: () =>
    set({
      status: 'idle',
      roomId: null,
      isInitiator: false,
      peer: null,
      localStream: null,
      remoteStream: null,
      isMuted: false,
      isCameraOff: false,
      duration: 0,
    }),
}));
