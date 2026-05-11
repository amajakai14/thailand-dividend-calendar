import { Router, Response } from 'express';
import { z } from 'zod';
import { getDB } from '../db/schema';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { VAPID_PUBLIC_KEY } from '../services/webpush';
import { testNotificationWithResult } from '../services/notifications';

const router = Router();

const SubSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
});

// GET /api/push/public-key — no auth
router.get('/public-key', (_req, res: Response) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

// POST /api/push/subscription — requireAuth
router.post('/subscription', requireAuth, (req: AuthRequest, res: Response) => {
  const parse = SubSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten() });
    return;
  }

  const { endpoint, p256dh, auth } = parse.data;
  const db = getDB();

  db.prepare(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET
       user_id = excluded.user_id,
       p256dh = excluded.p256dh,
       auth = excluded.auth`
  ).run(req.userId, endpoint, p256dh, auth);

  res.status(201).json({ ok: true });
});

// POST /api/push/test — send welcome push to calling user
router.post('/test', requireAuth, async (req: AuthRequest, res: Response) => {
  const results = await testNotificationWithResult(req.userId!);
  const failed = results.filter((r) => r.error);
  if (failed.length > 0) {
    res.status(207).json({ ok: false, results });
  } else {
    res.json({ ok: true, results });
  }
});

// DELETE /api/push/subscription — requireAuth, deletes specific endpoint or all if omitted
router.delete('/subscription', requireAuth, (req: AuthRequest, res: Response) => {
  const db = getDB();
  const { endpoint } = req.body as { endpoint?: string };
  if (endpoint) {
    db.prepare(`DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?`).run(req.userId, endpoint);
  } else {
    db.prepare(`DELETE FROM push_subscriptions WHERE user_id = ?`).run(req.userId);
  }
  res.json({ ok: true });
});

export default router;
