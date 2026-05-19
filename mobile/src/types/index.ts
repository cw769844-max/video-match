export type Gender = 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  gender: Gender;
  dateOfBirth: string;
  country: string;
  isPremium: boolean;
  premiumExpiry?: string;
  profilePhotoUrl?: string;
  createdAt: string;
  lastSeen: string;
  isVerified: boolean;
  reportCount: number;
  isBanned: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export interface MatchFilters {
  genders?: Gender[];
  ageRange?: { min: number; max: number };
  countries?: string[];
}

export interface PeerInfo {
  uid: string;
  gender: Gender;
  country: string;
}

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ProfileSetup: { isNewUser: boolean };
  Main: undefined;
  VideoCall: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Premium: undefined;
  Profile: undefined;
  Settings: undefined;
  Admin: undefined;
};

export type CallStatus =
  | 'idle'
  | 'searching'
  | 'connecting'
  | 'connected'
  | 'ended';
