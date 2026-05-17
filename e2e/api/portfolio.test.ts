import { describe, it, expect, beforeAll } from 'vitest';
import { api } from './helpers/client';

let token: string;

describe('Portfolio', () => {
  beforeAll(async () => {
    const res = await api
      .post('/auth/register')
      .send({ email: 'portfolio-user@example.com', password: 'password123' });
    token = res.body.token as string;
  });

  it('POST /api/portfolio adds a holding and returns 201', async () => {
    const res = await api
      .post('/api/portfolio')
      .set('Authorization', `Bearer ${token}`)
      .send({ ticker: 'PTT', quantity: 100 });

    expect(res.status).toBe(201);
    expect(res.body.ticker).toBe('PTT');
    expect(res.body.quantity).toBe(100);
  });

  it('GET /api/portfolio returns 200 and includes the added holding', async () => {
    // Ensure holding exists
    await api
      .post('/api/portfolio')
      .set('Authorization', `Bearer ${token}`)
      .send({ ticker: 'PTT', quantity: 100 });

    const res = await api
      .get('/api/portfolio')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const holding = (res.body as Array<{ ticker: string; quantity: number }>).find(
      (h) => h.ticker === 'PTT'
    );
    expect(holding).toBeDefined();
    expect(holding?.quantity).toBe(100);
  });

  it('DELETE /api/portfolio/:ticker removes the holding and returns { ok: true }', async () => {
    // Ensure holding exists
    await api
      .post('/api/portfolio')
      .set('Authorization', `Bearer ${token}`)
      .send({ ticker: 'PTT', quantity: 100 });

    const res = await api
      .delete('/api/portfolio/PTT')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
