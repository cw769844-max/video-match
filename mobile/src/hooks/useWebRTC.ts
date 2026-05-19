import { useEffect, useCallback, useRef } from 'react';
import { RTCIceCandidate } from 'react-native-webrtc';
import { webrtcService } from '../services/webrtc';
import { sendSignal, onSignal, onPeerDisconnected, skipPeer, offAll } from '../services/socket';
import { useCallStore } from '../store/useCallStore';

export function useWebRTC() {
  const { roomId, isInitiator, setStatus, setRemoteStream, reset } = useCallStore();
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { incrementDuration } = useCallStore();

  const endCall = useCallback(() => {
    if (durationRef.current) clearInterval(durationRef.current);
    webrtcService.destroy();
    offAll('signal', 'peer-disconnected');
    reset();
  }, [reset]);

  const startCall = useCallback(async () => {
    if (!roomId) return;

    // WebRTC signaling
    const cleanupSignal = onSignal(async ({ signal }) => {
      try {
        if ('type' in signal && signal.type === 'offer') {
          const answer = await webrtcService.createAnswer(signal as RTCSessionDescriptionInit);
          sendSignal(roomId, answer);
        } else if ('type' in signal && signal.type === 'answer') {
          await webrtcService.handleAnswer(signal as RTCSessionDescriptionInit);
        } else if ('candidate' in signal) {
          await webrtcService.addIceCandidate(signal as RTCIceCandidateInit);
        }
      } catch (err) {
        console.error('Signal handling error:', err);
      }
    });

    const cleanupPeer = onPeerDisconnected(() => {
      endCall();
    });

    webrtcService.createPeerConnection(
      (candidate: RTCIceCandidate) => {
        sendSignal(roomId, candidate.toJSON());
      },
      (remoteStream) => {
        setRemoteStream(remoteStream);
        setStatus('connected');
        durationRef.current = setInterval(incrementDuration, 1000);
      },
      (state) => {
        if (state === 'failed' || state === 'disconnected') {
          endCall();
        }
      },
    );

    if (isInitiator) {
      const offer = await webrtcService.createOffer();
      sendSignal(roomId, offer);
    }

    return () => {
      cleanupSignal();
      cleanupPeer();
    };
  }, [roomId, isInitiator, setStatus, setRemoteStream, endCall, incrementDuration]);

  const skip = useCallback(() => {
    skipPeer();
    endCall();
  }, [endCall]);

  const toggleMute = useCallback(() => {
    const { isMuted, setMuted } = useCallStore.getState();
    webrtcService.toggleMute(!isMuted);
    setMuted(!isMuted);
  }, []);

  const toggleCamera = useCallback(() => {
    const { isCameraOff, setCameraOff } = useCallStore.getState();
    webrtcService.toggleCamera(isCameraOff);
    setCameraOff(!isCameraOff);
  }, []);

  const switchCamera = useCallback(() => {
    webrtcService.switchCamera();
  }, []);

  return { startCall, endCall, skip, toggleMute, toggleCamera, switchCamera };
}
