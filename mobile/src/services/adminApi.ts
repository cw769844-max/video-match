import { getIdToken } from './firebase';
import { Config } from '../constants/config';
import { UserProfile } from '../types';

async function authFetch(path: string, method = 'GET', body?: object): Promise<Response> {
  const token = await getIdToken();
  return fetch(`${Config.API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function adminGetAllProfiles(
  limit = 50,
  startAfter?: string,
): Promise<{ profiles: UserProfile[]; lastUid?: string }> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (startAfter) params.append('startAfter', startAfter);

  const res = await authFetch(`/api/users/admin/all?${params}`);
  if (!res.ok) throw new Error('Failed to fetch profiles');
  return res.json();
}

export async function adminGetProfile(uid: string): Promise<UserProfile> {
  const res = await authFetch(`/api/users/admin/${uid}`);
  if (!res.ok) throw new Error('User not found');
  return res.json();
}

export async function adminSetBan(uid: string, isBanned: boolean): Promise<void> {
  const res = await authFetch(`/api/users/admin/${uid}/ban`, 'POST', { isBanned });
  if (!res.ok) throw new Error('Failed to update ban status');
}

export async function adminSetAdmin(uid: string, isAdmin: boolean): Promise<void> {
  const res = await authFetch(`/api/users/admin/${uid}/set-admin`, 'POST', { isAdmin });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update admin status');
  }
}
