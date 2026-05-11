import { Router, Response } from 'express';
import { z } from 'zod';
import { getDB } from '../db/schema';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { VAPID_PUBLIC_KEY } from '../services/webpush';
import { testNotification } from '../services/notifications';

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
  await testNotification(req.userId!);
  res.json({ ok: true });
});

// POST /api/push/test-direct — no auth, send test push to given subscription (debug)
router.post('/test-direct', async (req, res: Response) => {
  const parse = SubSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten() });
    return;
  }
  const { endpoint, p256dh, auth } = parse.data;
  const { webpush } = await import('../services/webpush');
  try {
    await webpush.sendNotification(
      { endpoint, keys: { p256dh, auth } },
      JSON.stringify({ title: 'Push Debug', message: 'Test from TH Div Calendar — it works!' })
    );
    res.json({ ok: true });
  } catch (err) {
    const e = err as { statusCode?: number; message?: string; body?: string; headers?: Record<string, string> };
    res.status(500).json({
      error: e.message ?? 'send failed',
      statusCode: e.statusCode,
      body: e.body,
      headers: e.headers,
    });
  }
});

// DELETE /api/push/subscription — requireAuth
router.delete('/subscription', requireAuth, (req: AuthRequest, res: Response) => {
  const db = getDB();
  db.prepare(`DELETE FROM push_subscriptions WHERE user_id = ?`).run(req.userId);
  res.json({ ok: true });
});

export default router;
