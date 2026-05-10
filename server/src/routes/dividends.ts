import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getDB } from '../db/schema';

const router = Router();

const QuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

router.get('/', (req: Request, res: Response): void => {
  const parsed = QuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const now = new Date();
  const month = parsed.data.month ?? now.getMonth() + 1;
  const year = parsed.data.year ?? now.getFullYear();

  const monthStr = String(month).padStart(2, '0');
  const prefix = `${year}-${monthStr}`;

  const db = getDB();
  const rows = db
    .prepare(
      `SELECT ticker, company_name, xd_date, book_close_date, record_date, pay_date,
              approximate_pay_date, dividend_type, cash_per_share, tentative_dividend,
              period_start, period_end, dividend_from
       FROM dividends
       WHERE xd_date LIKE ?
       ORDER BY xd_date ASC, ticker ASC`
    )
    .all(`${prefix}%`);

  res.json({ month, year, count: rows.length, data: rows });
});

export default router;
