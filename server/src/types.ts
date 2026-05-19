export type Gender = 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';

export interface UserProfile {
  uid: string;
  displayName: string;
  gender: Gender;
  dateOfBirth: string; // ISO date string
  country: string;    // ISO 3166-1 alpha-2
  isPremium: boolean;
  premiumExpiry?: string;
  profilePhotoUrl?: string;
  createdAt: string;
  lastSeen: string;
  isVerified: boolean;
  reportCount: number;
  isBanned: boolean;
}

export interface MatchFilters {
  genders?: Gender[];          // desired partner genders
  ageRange?: { min: number; max: number };
  countries?: string[];         // desired partner countries
}

export interface QueueEntry {
  socketId: string;
  uid: string;
  gender: Gender;
  age: number;
  country: string;
  isPremium: boolean;
  filters?: MatchFilters;
  joinedAt: number;
}

export interface MatchedPair {
  roomId: string;
  userA: QueueEntry;
  userB: QueueEntry;
}

export interface IceCandidate {
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
}

export interface SignalData {
  type: 'offer' | 'answer' | 'ice-candidate';
  sdp?: string;
  candidate?: IceCandidate;
}

export interface ReportPayload {
  reportedUid: string;
  roomId: string;
  reason: 'nudity' | 'harassment' | 'spam' | 'underage' | 'other';
  description?: string;
}
