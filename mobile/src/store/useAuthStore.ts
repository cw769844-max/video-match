import { create } from 'zustand';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { UserProfile } from '../types';

interface AuthState {
  user: FirebaseAuthTypes.User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isProfileComplete: boolean;
  setUser: (user: FirebaseAuthTypes.User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  isProfileComplete: false,

  setUser: (user) => set({ user }),

  setProfile: (raw) => {
    // Admins get effective premium status regardless of subscription
    const profile = raw
      ? {
          ...raw,
          isPremium: raw.isPremium || raw.isAdmin || raw.isSuperAdmin,
        }
      : null;

    set({
      profile,
      isProfileComplete: !!(
        profile?.displayName &&
        profile?.gender &&
        profile?.dateOfBirth &&
        profile?.country
      ),
    });
  },

  setLoading: (isLoading) => set({ isLoading }),

  reset: () =>
    set({ user: null, profile: null, isLoading: false, isProfileComplete: false }),
}));
