import { useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import {
  connectSocket,
  findMatch,
  cancelMatch,
  onQueued,
  onMatchFound,
  onIceServers,
  disconnectSocket,
} from '../services/socket';
import { webrtcService } from '../services/webrtc';
import { useCallStore } from '../store/useCallStore';
import { useAuthStore } from '../store/useAuthStore';

export function useMatchmaking() {
  const { filters, setStatus, setRoom, setLocalStream } = useCallStore();
  const { profile } = useAuthStore();

  const startSearching = useCallback(async () => {
    try {
      setStatus('searching');

      const localStream = await webrtcService.startLocalStream();
      setLocalStream(localStream);

      const socket = await connectSocket();

      onIceServers(({ iceServers }) => {
        webrtcService.setIceServers(iceServers);
      });

      onQueued(({ position }) => {
        console.log(`In queue, position: ${position}`);
      });

      onMatchFound(({ roomId, isInitiator, peerUid, peerGender, peerCountry }) => {
        setStatus('connecting');
        setRoom(roomId, isInitiator, { uid: peerUid, gender: peerGender as any, country: peerCountry });
      });

      findMatch(profile?.isPremium ? filters : undefined);
    } catch (err: any) {
      setStatus('idle');
      Alert.alert('Connection Error', err.message || 'Could not connect to server');
    }
  }, [filters, profile?.isPremium, setStatus, setRoom, setLocalStream]);

  const stopSearching = useCallback(() => {
    cancelMatch();
    webrtcService.destroy();
    setLocalStream(null);
    setStatus('idle');
  }, [setStatus, setLocalStream]);

  return { startSearching, stopSearching };
}
