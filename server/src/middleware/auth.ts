import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';

export interface AuthRequest extends Request {
  uid?: string;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
}

async function loadProfile(uid: string): Promise<Record<string, unknown> | null> {
  const doc = await admin.firestore().collection('users').doc(uid).get();
  return doc.exists ? (doc.data() as Record<string, unknown>) : null;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.uid = decoded.uid;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization header' });
    return;
  }

  try {
    const decoded = await admin.auth().verifyIdToken(authHeader.slice(7));
    req.uid = decoded.uid;

    const profile = await loadProfile(decoded.uid);
    if (!profile?.isAdmin && !profile?.isSuperAdmin) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    req.isAdmin = true;
    req.isSuperAdmin = !!profile.isSuperAdmin;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export async function requireSuperAdmin(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization header' });
    return;
  }

  try {
    const decoded = await admin.auth().verifyIdToken(authHeader.slice(7));
    req.uid = decoded.uid;

    const profile = await loadProfile(decoded.uid);
    if (!profile?.isSuperAdmin) {
      res.status(403).json({ error: 'Super admin access required' });
      return;
    }

    req.isAdmin = true;
    req.isSuperAdmin = true;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
