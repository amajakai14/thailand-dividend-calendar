import { describe, it, expect } from 'vitest';
import { api } from './helpers/client';

const TEST_EMAIL = 'test-auth@example.com';
const TEST_PASSWORD = 'password123';

describe('Auth', () => {
  it('POST /auth/register returns 201 with a JWT token', async () => {
    const res = await api
      .post('/auth/register')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(201);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(0);
  });

  it('POST /auth/login returns 200 with a JWT token after registering', async () => {
    // Register first
    await api
      .post('/auth/register')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    // Then login
    const res = await api
      .post('/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(0);
  });
});
