import { Router, Response } from 'express';
import admin from 'firebase-admin';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { UserProfile } from '../types';
import logger from '../logger';

const router = Router();
const db = () => admin.firestore();

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

    // Increment report count on the reported user
    await db().collection('users').doc(reportedUid).update({
      reportCount: admin.firestore.FieldValue.increment(1),
    });

    // Auto-ban users with >= 10 reports (can be refined with ML moderation)
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

export default router;
