import { describe, it, expect } from 'vitest';
import { api } from './helpers/client';

describe('GET /api/dividends', () => {
  it('returns 200 with the expected shape (no params)', async () => {
    const res = await api.get('/api/dividends');

    expect(res.status).toBe(200);
    expect(typeof res.body.month).toBe('number');
    expect(typeof res.body.year).toBe('number');
    expect(typeof res.body.count).toBe('number');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('returns 200 with correct month/year when queried with ?month=5&year=2026', async () => {
    const res = await api.get('/api/dividends?month=5&year=2026');

    expect(res.status).toBe(200);
    expect(res.body.month).toBe(5);
    expect(res.body.year).toBe(2026);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
