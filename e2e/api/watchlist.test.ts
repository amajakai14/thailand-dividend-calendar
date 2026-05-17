import { describe, it, expect, beforeAll } from 'vitest';
import { api } from './helpers/client';

let token: string;

describe('Watchlist', () => {
  beforeAll(async () => {
    const res = await api
      .post('/auth/register')
      .send({ email: 'watchlist-user@example.com', password: 'password123' });
    token = res.body.token as string;
  });

  it('POST /api/watchlist adds a ticker and returns 201', async () => {
    const res = await api
      .post('/api/watchlist')
      .set('Authorization', `Bearer ${token}`)
      .send({ ticker: 'KBANK' });

    expect(res.status).toBe(201);
    expect(res.body.ticker).toBe('KBANK');
  });

  it('GET /api/watchlist returns 200 and includes the added ticker', async () => {
    // Ensure ticker exists
    await api
      .post('/api/watchlist')
      .set('Authorization', `Bearer ${token}`)
      .send({ ticker: 'KBANK' });

    const res = await api
      .get('/api/watchlist')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const item = (res.body as Array<{ ticker: string }>).find((w) => w.ticker === 'KBANK');
    expect(item).toBeDefined();
  });

  it('DELETE /api/watchlist/:ticker removes the ticker and returns { ok: true }', async () => {
    // Ensure ticker exists
    await api
      .post('/api/watchlist')
      .set('Authorization', `Bearer ${token}`)
      .send({ ticker: 'KBANK' });

    const res = await api
      .delete('/api/watchlist/KBANK')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
