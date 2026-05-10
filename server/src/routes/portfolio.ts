import { Router, Response } from 'express';
import { z } from 'zod';
import { getDB } from '../db/schema';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/portfolio — list user holdings
router.get('/', requireAuth, (req: AuthRequest, res: Response): void => {
  const db = getDB();
  const rows = db
    .prepare('SELECT ticker, quantity FROM portfolios WHERE user_id = ? ORDER BY ticker ASC')
    .all(req.userId);
  res.json(rows);
});

const AddSchema = z.object({
  ticker: z.string().min(1).max(20),
  quantity: z.coerce.number().positive(),
});

// POST /api/portfolio — add or update holding (upsert)
router.post('/', requireAuth, (req: AuthRequest, res: Response): void => {
  const parsed = AddSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const ticker = parsed.data.ticker.toUpperCase();
  const { quantity } = parsed.data;
  const db = getDB();
  db.prepare(
    `INSERT INTO portfolios (user_id, ticker, quantity) VALUES (?, ?, ?)
     ON CONFLICT(user_id, ticker) DO UPDATE SET quantity = excluded.quantity`
  ).run(req.userId, ticker, quantity);
  res.status(201).json({ ticker, quantity });
});

// DELETE /api/portfolio/:ticker — remove holding
router.delete('/:ticker', requireAuth, (req: AuthRequest, res: Response): void => {
  const ticker = req.params.ticker.toUpperCase();
  const db = getDB();
  db.prepare('DELETE FROM portfolios WHERE user_id = ? AND ticker = ?').run(req.userId, ticker);
  res.json({ ok: true });
});

export default router;
