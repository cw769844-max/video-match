import { Router, Response } from 'express';
import admin from 'firebase-admin';
import { requireAuth, requireAdmin, requireSuperAdmin, AuthRequest } from '../middleware/auth';
import { UserProfile } from '../types';
import logger from '../logger';

const router = Router();
const db = () => admin.firestore();

// ─── Own profile ─────────────────────────────────────────────────────────────

router.get('/me', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const doc = await db().collection('users').doc(req.uid!).get();
    if (!doc.exists) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }
    res.json(doc.data());
  } catch (err) {
    logger.error(`GET /users/me: ${err}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/me', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { displayName, gender, dateOfBirth, country, profilePhotoUrl } = req.body;

    const allowedFields: Partial<UserProfile> = {};
    if (displayName) allowedFields.displayName = displayName;
    if (gender) allowedFields.gender = gender;
    if (dateOfBirth) allowedFields.dateOfBirth = dateOfBirth;
    if (country) allowedFields.country = country;
    if (profilePhotoUrl) allowedFields.profilePhotoUrl = profilePhotoUrl;
    allowedFields.lastSeen = new Date().toISOString();

    await db().collection('users').doc(req.uid!).set(allowedFields, { merge: true });
    res.json({ success: true });
  } catch (err) {
    logger.error(`PUT /users/me: ${err}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Report ───────────────────────────────────────────────────────────────────

router.post('/report', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reportedUid, roomId, reason, description } = req.body;

    if (!reportedUid || !reason) {
      res.status(400).json({ error: 'reportedUid and reason are required' });
      return;
    }

    const report = {
      reporterUid: req.uid,
      reportedUid,
      roomId,
      reason,
      description: description || '',
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    await db().collection('reports').add(report);

    await db().collection('users').doc(reportedUid).update({
      reportCount: admin.firestore.FieldValue.increment(1),
    });

    const reportedUser = await db().collection('users').doc(reportedUid).get();
    const data = reportedUser.data();
    if (data && data.reportCount >= 10) {
      await db().collection('users').doc(reportedUid).update({ isBanned: true });
      logger.info(`Auto-banned user ${reportedUid} (10+ reports)`);
    }

    res.json({ success: true });
  } catch (err) {
    logger.error(`POST /users/report: ${err}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Admin — list all profiles ────────────────────────────────────────────────

router.get('/admin/all', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string || '100', 10), 500);
    const startAfter = req.query.startAfter as string | undefined;

    let query = db().collection('users').orderBy('createdAt', 'desc').limit(limit);
    if (startAfter) {
      const startDoc = await db().collection('users').doc(startAfter).get();
      if (startDoc.exists) query = query.startAfter(startDoc) as any;
    }

    const snapshot = await query.get();
    const profiles = snapshot.docs.map((d) => d.data());
    const lastUid = snapshot.docs[snapshot.docs.length - 1]?.id;

    res.json({ profiles, lastUid, total: snapshot.size });
  } catch (err) {
    logger.error(`GET /users/admin/all: ${err}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Admin — get single profile ───────────────────────────────────────────────

router.get('/admin/:uid', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const doc = await db().collection('users').doc(req.params.uid).get();
    if (!doc.exists) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(doc.data());
  } catch (err) {
    logger.error(`GET /users/admin/:uid: ${err}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Admin — ban / unban ─────────────────────────────────────────────────────

router.post('/admin/:uid/ban', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { isBanned } = req.body;
    await db().collection('users').doc(req.params.uid).update({ isBanned: !!isBanned });
    logger.info(`Admin ${req.uid} ${isBanned ? 'banned' : 'unbanned'} user ${req.params.uid}`);
    res.json({ success: true });
  } catch (err) {
    logger.error(`POST /users/admin/:uid/ban: ${err}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Super admin — grant / revoke admin ──────────────────────────────────────

router.post('/admin/:uid/set-admin', requireSuperAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { isAdmin } = req.body;
    const targetUid = req.params.uid;

    // Prevent removing super admin status via this endpoint
    const targetDoc = await db().collection('users').doc(targetUid).get();
    if (targetDoc.data()?.isSuperAdmin) {
      res.status(403).json({ error: 'Cannot modify super admin status' });
      return;
    }

    await db().collection('users').doc(targetUid).update({ isAdmin: !!isAdmin });
    logger.info(`Super admin ${req.uid} ${isAdmin ? 'granted' : 'revoked'} admin for ${targetUid}`);
    res.json({ success: true });
  } catch (err) {
    logger.error(`POST /users/admin/:uid/set-admin: ${err}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
