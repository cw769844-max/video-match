import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Config } from '../constants/config';
import { UserProfile } from '../types';

GoogleSignin.configure({ webClientId: Config.GOOGLE_WEB_CLIENT_ID });

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function signInWithGoogle(): Promise<FirebaseAuthTypes.UserCredential> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const { idToken } = await GoogleSignin.signIn();
  const credential = auth.GoogleAuthProvider.credential(idToken);
  return auth().signInWithCredential(credential);
}

export async function signInWithApple(): Promise<FirebaseAuthTypes.UserCredential> {
  const appleAuthModule = require('@invertase/react-native-apple-authentication');
  const { appleAuth } = appleAuthModule;

  const appleAuthRequestResponse = await appleAuth.performRequest({
    requestedOperation: appleAuth.Operation.LOGIN,
    requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
  });

  const { identityToken, nonce } = appleAuthRequestResponse;
  if (!identityToken) throw new Error('Apple Sign-In failed: no identity token');

  const credential = auth.AppleAuthProvider.credential(identityToken, nonce);
  return auth().signInWithCredential(credential);
}

export async function signInWithEmail(email: string, password: string) {
  return auth().signInWithEmailAndPassword(email, password);
}

export async function registerWithEmail(email: string, password: string) {
  return auth().createUserWithEmailAndPassword(email, password);
}

export async function signOut() {
  try {
    await GoogleSignin.signOut();
  } catch { /* not signed in with Google */ }
  return auth().signOut();
}

export async function getIdToken(): Promise<string | null> {
  const user = auth().currentUser;
  if (!user) return null;
  return user.getIdToken();
}

// ─── Firestore ───────────────────────────────────────────────────────────────

async function shouldBeSuperAdmin(): Promise<boolean> {
  const configRef = firestore().collection('config').doc('appConfig');
  let granted = false;

  await firestore().runTransaction(async (tx) => {
    const configDoc = await tx.get(configRef);
    if (!configDoc.exists || !configDoc.data()?.firstUserCreated) {
      tx.set(configRef, { firstUserCreated: true }, { merge: true });
      granted = true;
    }
  });

  return granted;
}

export async function createUserProfile(
  uid: string,
  data: Partial<UserProfile>,
): Promise<void> {
  const now = new Date().toISOString();

  const existing = await firestore().collection('users').doc(uid).get();
  const isNew = !existing.exists;

  const isSuperAdmin = isNew ? await shouldBeSuperAdmin() : false;

  await firestore()
    .collection('users')
    .doc(uid)
    .set(
      {
        uid,
        isPremium: false,
        reportCount: 0,
        isBanned: false,
        isVerified: false,
        isAdmin: isSuperAdmin,
        isSuperAdmin,
        createdAt: now,
        lastSeen: now,
        ...data,
        ...(isNew ? {} : {
          isAdmin: existing.data()?.isAdmin ?? false,
          isSuperAdmin: existing.data()?.isSuperAdmin ?? false,
        }),
      },
      { merge: true },
    );
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const doc = await firestore().collection('users').doc(uid).get();
  if (!doc.exists) return null;
  return doc.data() as UserProfile;
}

export function subscribeToProfile(
  uid: string,
  callback: (profile: UserProfile | null) => void,
) {
  return firestore()
    .collection('users')
    .doc(uid)
    .onSnapshot((doc) => {
      callback(doc.exists ? (doc.data() as UserProfile) : null);
    });
}

export async function updateUserProfile(
  uid: string,
  data: Partial<UserProfile>,
): Promise<void> {
  await firestore()
    .collection('users')
    .doc(uid)
    .update({ ...data, lastSeen: new Date().toISOString() });
}

// ─── Admin helpers ────────────────────────────────────────────────────────────

export async function setAdminStatus(
  targetUid: string,
  isAdmin: boolean,
): Promise<void> {
  await firestore().collection('users').doc(targetUid).update({ isAdmin });
}

export async function setBanStatus(
  targetUid: string,
  isBanned: boolean,
): Promise<void> {
  await firestore().collection('users').doc(targetUid).update({ isBanned });
}

// ─── Age helper ──────────────────────────────────────────────────────────────

export function calcAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export { auth, firestore };
