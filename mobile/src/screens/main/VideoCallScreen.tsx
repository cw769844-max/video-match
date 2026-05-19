import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { RTCView } from 'react-native-webrtc';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useWebRTC } from '../../hooks/useWebRTC';
import { useCallStore } from '../../store/useCallStore';
import { useAuthStore } from '../../store/useAuthStore';
import ReportModal from '../../components/ReportModal';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants/theme';
import { COUNTRIES } from '../../constants/config';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function VideoCallScreen() {
  const navigation = useNavigation();
  const { profile } = useAuthStore();
  const {
    status,
    peer,
    roomId,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    duration,
  } = useCallStore();
  const { startCall, endCall, skip, toggleMute, toggleCamera, switchCamera } = useWebRTC();
  const [showReport, setShowReport] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    startCall();
    return () => {
      endCall();
    };
  }, []);

  useEffect(() => {
    if (status === 'idle' || status === 'ended') {
      navigation.goBack();
    }
  }, [status]);

  function resetHideTimer() {
    setControlsVisible(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => setControlsVisible(false), 4000);
  }

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, []);

  function handleSkip() {
    Alert.alert('Skip', 'Move to the next person?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Skip',
        style: 'destructive',
        onPress: () => {
          skip();
          navigation.goBack();
        },
      },
    ]);
  }

  function handleEnd() {
    endCall();
    navigation.goBack();
  }

  const peerCountry = COUNTRIES.find((c) => c.code === peer?.country)?.name ?? peer?.country;

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Remote video (full screen) */}
      {remoteStream ? (
        <RTCView
          streamURL={remoteStream.toURL()}
          style={styles.remoteVideo}
          objectFit="cover"
          mirror={false}
        />
      ) : (
        <View style={styles.waitingView}>
          <Icon name="videocam-off-outline" size={60} color={Colors.textMuted} />
          <Text style={styles.waitingText}>
            {status === 'connecting' ? 'Connecting...' : 'Waiting for video...'}
          </Text>
        </View>
      )}

      {/* Local video (PiP) */}
      <TouchableOpacity style={styles.localContainer} onPress={switchCamera} activeOpacity={0.9}>
        {localStream && !isCameraOff ? (
          <RTCView
            streamURL={localStream.toURL()}
            style={styles.localVideo}
            objectFit="cover"
            mirror
          />
        ) : (
          <View style={[styles.localVideo, styles.cameraOffPlaceholder]}>
            <Icon name="camera-off-outline" size={24} color={Colors.textMuted} />
          </View>
        )}
      </TouchableOpacity>

      {/* Tap to show controls */}
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        onPress={resetHideTimer}
        activeOpacity={1}
      />

      {/* Top bar */}
      {controlsVisible && (
        <SafeAreaView style={styles.topBar}>
          <View style={styles.peerInfo}>
            <View style={styles.peerInfoInner}>
              {peer && (
                <>
                  <Icon name="person-circle-outline" size={18} color={Colors.text} />
                  <Text style={styles.peerGender}>
                    {peer.gender?.replace('_', ' ')}
                  </Text>
                  {peerCountry && (
                    <Text style={styles.peerCountry}>· {peerCountry}</Text>
                  )}
                </>
              )}
            </View>
            {status === 'connected' && (
              <Text style={styles.duration}>{formatDuration(duration)}</Text>
            )}
          </View>

          <TouchableOpacity style={styles.reportBtn} onPress={() => setShowReport(true)}>
            <Icon name="flag-outline" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </SafeAreaView>
      )}

      {/* Bottom controls */}
      {controlsVisible && (
        <SafeAreaView style={styles.bottomBar}>
          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
              onPress={toggleMute}
            >
              <Icon
                name={isMuted ? 'mic-off' : 'mic-outline'}
                size={24}
                color={isMuted ? Colors.error : Colors.text}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.endBtn} onPress={handleEnd}>
              <Icon name="call" size={28} color={Colors.text} style={{ transform: [{ rotate: '135deg' }] }} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
              <Icon name="play-skip-forward" size={24} color={Colors.text} />
              <Text style={styles.skipText}>Next</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlBtn, isCameraOff && styles.controlBtnActive]}
              onPress={toggleCamera}
            >
              <Icon
                name={isCameraOff ? 'camera-off-outline' : 'camera-outline'}
                size={24}
                color={isCameraOff ? Colors.error : Colors.text}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}

      {roomId && peer?.uid && (
        <ReportModal
          visible={showReport}
          reportedUid={peer.uid}
          roomId={roomId}
          onClose={() => setShowReport(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  remoteVideo: { ...StyleSheet.absoluteFillObject },
  waitingView: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    gap: Spacing.md,
  },
  waitingText: { color: Colors.textSecondary, fontSize: FontSize.lg },
  localContainer: {
    position: 'absolute',
    top: 100,
    right: Spacing.md,
    width: 100,
    height: 140,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.surface,
    zIndex: 10,
  },
  localVideo: { width: '100%', height: '100%' },
  cameraOffPlaceholder: { backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  peerInfo: {
    backgroundColor: Colors.overlay,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  peerInfoInner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  peerGender: { color: Colors.text, fontSize: FontSize.sm, fontWeight: FontWeight.medium, textTransform: 'capitalize' },
  peerCountry: { color: Colors.textSecondary, fontSize: FontSize.sm },
  duration: { color: Colors.accent, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  reportBtn: {
    backgroundColor: Colors.overlay,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Spacing.xl,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  controlBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlBtnActive: { backgroundColor: Colors.surfaceLight },
  endBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipBtn: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
  },
  skipText: { fontSize: FontSize.xs, color: Colors.text },
});
