import { Router, Response } from 'express';
import { z } from 'zod';
import { getDB } from '../db/schema';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

const TickerSchema = z.object({
  ticker: z.string().min(1).max(20).transform((v) => v.toUpperCase()),
});

// GET /api/watchlist — requireAuth
router.get('/', requireAuth, (req: AuthRequest, res: Response) => {
  const db = getDB();
  const rows = db.prepare(
    `SELECT ticker FROM watchlist WHERE user_id = ? ORDER BY ticker ASC`
  ).all(req.userId) as Array<{ ticker: string }>;
  res.json(rows);
});

// POST /api/watchlist — requireAuth
router.post('/', requireAuth, (req: AuthRequest, res: Response) => {
  const parse = TickerSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten() });
    return;
  }

  const { ticker } = parse.data;
  const db = getDB();
  db.prepare(
    `INSERT OR IGNORE INTO watchlist (user_id, ticker) VALUES (?, ?)`
  ).run(req.userId, ticker);

  res.status(201).json({ ticker });
});

// DELETE /api/watchlist/:ticker — requireAuth
router.delete('/:ticker', requireAuth, (req: AuthRequest, res: Response) => {
  const ticker = req.params.ticker.toUpperCase();
  const db = getDB();
  db.prepare(
    `DELETE FROM watchlist WHERE user_id = ? AND ticker = ?`
  ).run(req.userId, ticker);
  res.json({ ok: true });
});

export default router;
