import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { getDB } from '../db/schema';
import { JWT_SECRET } from '../middleware/auth';

const router = Router();

const AuthBody = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

router.post('/register', (req: Request, res: Response): void => {
  const parsed = AuthBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { email, password } = parsed.data;
  const db = getDB();

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const password_hash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)')
    .run(email, password_hash);

  const token = jwt.sign({ userId: Number(result.lastInsertRowid) }, JWT_SECRET, {
    expiresIn: '30d',
  });
  res.status(201).json({ token });
});

router.post('/login', (req: Request, res: Response): void => {
  const parsed = AuthBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { email, password } = parsed.data;
  const db = getDB();

  const user = db
    .prepare('SELECT id, password_hash FROM users WHERE email = ?')
    .get(email) as { id: number; password_hash: string } | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token });
});

export default router;
