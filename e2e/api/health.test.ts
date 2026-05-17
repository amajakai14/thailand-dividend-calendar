import { describe, it, expect } from 'vitest';
import { api } from './helpers/client';

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await api.get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
