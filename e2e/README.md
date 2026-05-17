# E2E Tests

## Suites

| Suite | Tool | Dir | Run |
|-------|------|-----|-----|
| API | Vitest + supertest | `e2e/api/` | `npm run test:e2e:api` |
| Mobile | Maestro | `e2e/mobile/` | `maestro test e2e/mobile/` |

## API — 11 tests

See [`e2e/api/INDEX.md`](api/INDEX.md) for full table.

Files: `health.test.ts`, `auth.test.ts`, `dividends.test.ts`, `portfolio.test.ts`, `watchlist.test.ts`

## Mobile — 13 flows

See [`e2e/mobile/INDEX.md`](mobile/INDEX.md) for full table.

Requires Maestro CLI installed + Expo dev client running on simulator/device.

Install Maestro: `curl -Ls "https://get.maestro.mobile.dev" | bash`
