import { Router, Response } from 'express';
import { z } from 'zod';
import Expo from 'expo-server-sdk';
import { getDB } from '../db/schema';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { VAPID_PUBLIC_KEY, sendPush, StoredSub } from '../services/webpush';

const expoClient = new Expo();

const router = Router();

const SubSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
});

function pruneSubscription(endpoint: string): void {
  getDB().prepare(`DELETE FROM push_subscriptions WHERE endpoint = ?`).run(endpoint);
  console.warn('[push] pruned stale endpoint:', endpoint.slice(0, 60));
}

router.get('/public-key', (_req, res: Response) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

router.post('/subscription', requireAuth, (req: AuthRequest, res: Response) => {
  const parse = SubSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten() });
    return;
  }
  const { endpoint, p256dh, auth } = parse.data;
  getDB().prepare(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET
       user_id = excluded.user_id,
       p256dh  = excluded.p256dh,
       auth    = excluded.auth`
  ).run(req.userId, endpoint, p256dh, auth);
  res.status(201).json({ ok: true });
});

router.delete('/subscription', requireAuth, (req: AuthRequest, res: Response) => {
  const endpoint =
    (typeof req.query.endpoint === 'string' && req.query.endpoint) ||
    (req.body && typeof req.body.endpoint === 'string' ? req.body.endpoint : '');
  const db = getDB();
  if (endpoint) {
    db.prepare(`DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?`)
      .run(req.userId, endpoint);
  } else {
    db.prepare(`DELETE FROM push_subscriptions WHERE user_id = ?`).run(req.userId);
  }
  res.json({ ok: true });
});

router.post('/test', requireAuth, async (req: AuthRequest, res: Response) => {
  const subs = getDB().prepare(
    `SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?`
  ).all(req.userId) as StoredSub[];

  if (subs.length === 0) {
    res.status(404).json({ ok: false, error: 'no subscriptions for user' });
    return;
  }

  const results = [];
  for (const sub of subs) {
    const outcome = await sendPush(sub, {
      title: 'TH Div Calendar',
      message: 'Test notification — push working',
    });
    if (outcome.ok) {
      console.log(`[push/test] sent user=${req.userId} status=${outcome.statusCode} endpoint=${sub.endpoint.slice(0, 60)}`);
    } else {
      console.error(
        `[push/test] FAILED user=${req.userId} status=${outcome.statusCode ?? '?'} gone=${outcome.gone} msg="${outcome.message}" body=${outcome.body ?? '-'} endpoint=${sub.endpoint.slice(0, 80)}`
      );
      if (outcome.gone) pruneSubscription(sub.endpoint);
    }
    results.push({ endpoint: sub.endpoint.slice(0, 60), ...outcome });
  }

  const anyFail = results.some((r) => !r.ok);
  res.status(anyFail ? 207 : 200).json({ ok: !anyFail, results });
});

// POST /api/push/expo-token
router.post('/expo-token', requireAuth, (req: AuthRequest, res: Response) => {
  const { token } = req.body;
  if (!token || typeof token !== 'string' || !Expo.isExpoPushToken(token)) {
    res.status(400).json({ error: 'Invalid Expo push token' });
    return;
  }
  try {
    getDB().prepare(
      'INSERT OR IGNORE INTO expo_push_tokens (user_id, token) VALUES (?, ?)'
    ).run(req.userId, token);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to store token' });
  }
});

// DELETE /api/push/expo-token
router.delete('/expo-token', requireAuth, (req: AuthRequest, res: Response) => {
  const { token } = req.body;
  if (!token) {
    res.status(400).json({ error: 'Token required' });
    return;
  }
  getDB().prepare('DELETE FROM expo_push_tokens WHERE user_id = ? AND token = ?').run(req.userId, token);
  res.json({ ok: true });
});

export default router;
