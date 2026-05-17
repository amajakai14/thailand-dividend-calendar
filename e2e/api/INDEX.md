# API E2E Tests

Run: `npm run test:e2e:api`

| File | Test | Endpoint | Expected |
|------|------|----------|----------|
| `health.test.ts` | GET /health returns 200 with status ok | `GET /health` | 200 `{ status: 'ok' }` |
| `auth.test.ts` | POST /auth/register returns 201 with a JWT token | `POST /auth/register` | 201 + `{ token: string }` |
| `auth.test.ts` | POST /auth/login returns 200 with a JWT token after registering | `POST /auth/login` | 200 + `{ token: string }` |
| `dividends.test.ts` | returns 200 with the expected shape (no params) | `GET /api/dividends` | 200 + `{ month, year, count, data: [] }` shape |
| `dividends.test.ts` | returns 200 with correct month/year when queried with ?month=5&year=2026 | `GET /api/dividends?month=5&year=2026` | 200 + `body.month === 5`, `body.year === 2026` |
| `portfolio.test.ts` | POST /api/portfolio adds a holding and returns 201 | `POST /api/portfolio` | 201 + `{ ticker: 'PTT', quantity: 100 }` |
| `portfolio.test.ts` | GET /api/portfolio returns 200 and includes the added holding | `GET /api/portfolio` | 200 + array containing `{ ticker: 'PTT', quantity: 100 }` |
| `portfolio.test.ts` | DELETE /api/portfolio/:ticker removes the holding and returns { ok: true } | `DELETE /api/portfolio/PTT` | 200 `{ ok: true }` |
| `watchlist.test.ts` | POST /api/watchlist adds a ticker and returns 201 | `POST /api/watchlist` | 201 + `{ ticker: 'KBANK' }` |
| `watchlist.test.ts` | GET /api/watchlist returns 200 and includes the added ticker | `GET /api/watchlist` | 200 + array containing `{ ticker: 'KBANK' }` |
| `watchlist.test.ts` | DELETE /api/watchlist/:ticker removes the ticker and returns { ok: true } | `DELETE /api/watchlist/KBANK` | 200 `{ ok: true }` |
