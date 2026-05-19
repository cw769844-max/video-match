import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
  MediaStream,
} from 'react-native-webrtc';

export type IceServer = { urls: string; username?: string; credential?: string };

const DEFAULT_ICE_SERVERS: IceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export class WebRTCService {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private iceServers: IceServer[] = DEFAULT_ICE_SERVERS;

  setIceServers(servers: IceServer[]) {
    this.iceServers = servers;
  }

  async startLocalStream(videoEnabled = true): Promise<MediaStream> {
    const stream = await mediaDevices.getUserMedia({
      audio: true,
      video: videoEnabled
        ? {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          }
        : false,
    });
    this.localStream = stream as unknown as MediaStream;
    return this.localStream;
  }

  createPeerConnection(
    onIceCandidate: (candidate: RTCIceCandidate) => void,
    onRemoteStream: (stream: MediaStream) => void,
    onConnectionStateChange: (state: RTCPeerConnectionState) => void,
  ): RTCPeerConnection {
    this.pc = new RTCPeerConnection({ iceServers: this.iceServers });

    this.pc.addEventListener('icecandidate', (event) => {
      if (event.candidate) {
        onIceCandidate(event.candidate as RTCIceCandidate);
      }
    });

    this.pc.addEventListener('track', (event) => {
      if (event.streams?.[0]) {
        onRemoteStream(event.streams[0] as unknown as MediaStream);
      }
    });

    this.pc.addEventListener('connectionstatechange', () => {
      if (this.pc) {
        onConnectionStateChange(this.pc.connectionState as RTCPeerConnectionState);
      }
    });

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.pc!.addTrack(track, this.localStream!);
      });
    }

    return this.pc;
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.pc) throw new Error('No peer connection');
    const offer = await this.pc.createOffer({});
    await this.pc.setLocalDescription(new RTCSessionDescription(offer));
    return offer;
  }

  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.pc) throw new Error('No peer connection');
    await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(new RTCSessionDescription(answer));
    return answer;
  }

  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.pc) throw new Error('No peer connection');
    await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.pc) throw new Error('No peer connection');
    await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
  }

  toggleMute(muted: boolean): void {
    this.localStream?.getAudioTracks().forEach((t) => {
      t.enabled = !muted;
    });
  }

  toggleCamera(enabled: boolean): void {
    this.localStream?.getVideoTracks().forEach((t) => {
      t.enabled = enabled;
    });
  }

  async switchCamera(): Promise<void> {
    const videoTrack = this.localStream?.getVideoTracks()[0];
    if (videoTrack && '_switchCamera' in videoTrack) {
      (videoTrack as unknown as { _switchCamera: () => void })._switchCamera();
    }
  }

  destroy(): void {
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.localStream = null;
    this.pc?.close();
    this.pc = null;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getPeerConnection(): RTCPeerConnection | null {
    return this.pc;
  }
}

export const webrtcService = new WebRTCService();
