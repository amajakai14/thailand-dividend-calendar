# TH Dividend Calendar — Roadmap

---

## QA Checklists (run after each phase, before reporting to user)

### Phase 2A QA ✅ (completed 2026-05-09 — 9/9 pass)
- [x] `GET /health` → 200 `{"status":"ok"}`
- [x] `POST /auth/register` valid → 201 + JWT
- [x] `POST /auth/register` duplicate email → 409
- [x] `POST /auth/register` bad email → 400 + zod field error
- [x] `POST /auth/register` short password → 400 + zod field error
- [x] `POST /auth/login` valid → 200 + JWT
- [x] `POST /auth/login` wrong password → 401
- [x] `POST /auth/login` unknown email → 401 (same msg as wrong pw — no enumeration leak)

### Phase 2B QA ✅ (completed 2026-05-09 — 7/7 pass)
- [x] `GET /api/dividends` no params → 200 + array (defaults to current month, 221 records)
- [x] `GET /api/dividends?month=5&year=2026` → 200 + 221 records for May 2026
- [x] `GET /api/dividends?month=99` → 400 bad params
- [x] React app loads at `http://localhost:5173` — 200 HTML with `<div id="root">`
- [x] `npm run build` in `client/` → exit 0, 36 modules, PWA service worker generated
- [x] `tsc --noEmit` in `client/` → zero errors (use local `node_modules/.bin/tsc`)
- [x] First dividend record has `ticker`, `xd_date`, `cash_per_share` fields

### Phase 2C QA ✅ (completed 2026-05-09 — 5/5 pass)
- [x] Calendar renders current month grid (7 cols × ~5 rows)
- [x] Days with XD entries show ticker chips
- [x] Days with pay dates show different color indicator
- [x] Clicking ticker chip opens detail drawer with: amount, pay date, period, type
- [x] Month navigation (prev/next) loads correct month data

### Phase 2D QA ✅ (completed 2026-05-09 — 7/7 pass)
- [x] `GET /api/portfolio` without auth → 401
- [x] `POST /api/portfolio` add holding → 201
- [x] `GET /api/portfolio` with auth → 200 + holdings list
- [x] `DELETE /api/portfolio/:ticker` → 200
- [x] Portfolio page renders holdings table
- [x] Income summary shows correct calculation: quantity × cash_per_share per pay date
- [x] Add/remove holding reflects in income summary

### Phase 2E QA ✅ (completed 2026-05-09 — 7/7 pass)
- [x] VAPID keys generated and stored in env
- [x] Browser notification permission prompt appears
- [x] `POST /api/push/subscription` stores subscription in DB
- [x] `GET /api/watchlist` without auth → 401
- [x] `POST /api/watchlist` add ticker → 201
- [x] Notification cron triggers for XD dates within 3 days (test with seeded data)
- [x] Push arrives in browser

### Phase 2F QA (run after 2F done)
- [ ] `GET https://<domain>/health` → 200
- [ ] HTTPS cert valid (no browser warning)
- [ ] Scraper cron runs at 07:00 BKK on server
- [ ] Notification cron runs daily on server
- [ ] Server survives restart (systemd auto-start)

---

## Refined Requirements

### Phase 1: Data Scraper (Core)
Automate data collection from SET x-calendar API for Thai stock XD and dividend pay dates.

**Scope decisions:**
- Source: `https://www.set.or.th/th/market/stock-calendar/x-calendar`
- Stack: Node.js + TypeScript
- Scrape: Current month only
- Refresh: Daily cron at 07:00 Bangkok time
- Storage: SQLite (`data/dividends.db`)
- Error policy: Log + keep existing data on failure
- Output: SQLite only + `logs/scraper.log`

**Data fields per ticker:**
| Field | Source API key |
|-------|---------------|
| ticker | `symbol` |
| company name | `name` |
| XD date | `xdate` |
| book close date | `bookCloseDate` |
| record date | `recordDate` |
| pay date | `paymentDate` |
| dividend type | `dividendType` |
| cash per share (฿) | `dividend` |
| period start | `beginOperation` |
| period end | `endOperation` |
| dividend source | `sourceOfDividend` |

---

### Phase 2: Web UI + User Features
Progressive web app displaying XD and pay dates on a calendar.

**Stack decisions:**
- Frontend: React + Vite + `vite-plugin-pwa`
- Backend: Express + TypeScript (extends existing Node/TS project)
- Auth: Email + password — bcrypt hash, JWT sessions
- DB: SQLite (extend existing `data/dividends.db` with user tables)
- Push: Web Push API — VAPID keys, `web-push` npm package
- Hosting: VPS (DigitalOcean or Hetzner)

**Monorepo layout:**
```
th-div-calendar/
  src/                ← existing Phase 1 scraper
  server/             ← new: Express API
    src/
      app.ts
      routes/         auth.ts, dividends.ts, portfolio.ts, push.ts, watchlist.ts
      middleware/     auth.ts (JWT verify)
      db/             schema.ts, users.ts, portfolio.ts, push.ts
      services/       webpush.ts, notifications.ts
  client/             ← new: React PWA
    src/
      components/     Calendar.tsx, DayCell.tsx, TickerDetail.tsx, IncomeSummary.tsx
      pages/          Home.tsx, Login.tsx, Register.tsx, Portfolio.tsx
      hooks/          useAuth.ts, usePushNotification.ts
      services/       api.ts
    vite.config.ts
    manifest.json
```

**DB additions to `data/dividends.db`:**
| Table | Key columns |
|-------|-------------|
| `users` | id, email, password_hash, created_at |
| `portfolios` | id, user_id, ticker, quantity |
| `watchlist` | id, user_id, ticker |
| `push_subscriptions` | id, user_id, endpoint, p256dh, auth |

**API surface:**
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/auth/register` | — | create user |
| POST | `/auth/login` | — | returns JWT |
| GET | `/api/dividends` | — | `?month=&year=` public data |
| GET/POST/DELETE | `/api/portfolio` | JWT | manage holdings |
| GET/POST/DELETE | `/api/watchlist` | JWT | manage ticker watchlist |
| POST/DELETE | `/api/push/subscription` | JWT | store/remove push sub |

**Notification logic:**
- Cron runs daily (same time as scraper, 07:00 BKK)
- Query: XD dates within next N days (default 3)
- For each ticker: find watchlist users → fetch their push subscriptions → send Web Push
- Payload: `{ ticker, xdDate, cashPerShare }`

**Sub-phases:**
| # | Scope | Deliverable |
|---|-------|-------------|
| 2A | Backend foundation | Express app, DB schema migration, auth routes (register/login/JWT middleware) |
| 2B | Dividend API + frontend scaffold | `/api/dividends` endpoint, React+Vite+PWA bootstrap, login/register UI |
| 2C | Calendar + ticker detail | Calendar grid component, day cells with XD/pay markers, ticker detail drawer |
| 2D | Portfolio + income estimate | Portfolio CRUD UI + API, income summary (holdings × cash_per_share) |
| 2E | Push notifications | VAPID setup, push subscription flow, notification scheduler cron |
| 2F | VPS deployment | Nginx reverse proxy, systemd services, HTTPS (Let's Encrypt), domain |

---

## Status

### ✅ Done (Phase 1)

- [x] Project scaffold — `package.json`, `tsconfig.json`, `.gitignore`
- [x] `src/logger.ts` — file + console logger
- [x] `src/parser.ts` — `DividendRecord` interface, Thai date utils (unused now but available)
- [x] `src/db.ts` — SQLite init + upsert with `UNIQUE(ticker, xd_date)`
- [x] `src/scraper.ts` — Playwright loads SET page, intercepts internal API response (bypasses Incapsula WAF)
- [x] `src/main.ts` — orchestration entry (`npm run scrape`)
- [x] `src/schedule.ts` — daily cron via `node-cron` (`npm run schedule`)
- [x] Verified: 224 XD records for May 2026 scraped and stored

---

### 🔲 Left (Phase 1 completion)

- [ ] **Multi-month support** — currently hardcoded to current month. Add CLI arg or config to scrape N months ahead
- [ ] **Retry logic** — scraper fails fast on error; add 2–3 retries with backoff before giving up
- [ ] **Data freshness check** — skip re-scrape if last scrape was < X hours ago (avoid redundant Playwright launches)
- [ ] **Playwright install in CI/deploy** — `npx playwright install chromium` not yet scripted into setup
- [ ] **`npm run setup` script** — one-command install + playwright install for new environments

---

### ✅ Phase 2A — Backend foundation

- [x] `server/tsconfig.json`
- [x] `server/src/db/schema.ts` — migrations: users, portfolios, watchlist, push_subscriptions tables
- [x] `server/src/middleware/auth.ts` — JWT verify middleware (`requireAuth`)
- [x] `server/src/routes/auth.ts` — POST `/auth/register`, POST `/auth/login` (bcrypt + zod)
- [x] `server/src/app.ts` — Express setup, mounts auth router, `/health` endpoint
- [x] `npm run dev:server` script — `ts-node -P server/tsconfig.json server/src/app.ts`
- [x] New deps added to root `package.json`: express, bcryptjs, jsonwebtoken, cors, zod + @types

### ✅ Phase 2B — Dividend API + frontend scaffold

- [x] `server/src/routes/dividends.ts` — GET `/api/dividends?month=&year=`
- [x] `client/` — Vite + React + TypeScript scaffold
- [x] `client/vite.config.ts` — `vite-plugin-pwa` configured, proxy `/api`+`/auth` → port 3000
- [x] `client/public/manifest.json` — PWA manifest
- [x] `client/src/services/api.ts` — typed fetch wrapper with JWT header injection
- [x] `client/src/pages/Login.tsx` + `Register.tsx` — form + error display + token save

### ✅ Phase 2C — Calendar + ticker detail

- [x] `client/src/components/Calendar.tsx` — month grid
- [x] `client/src/components/DayCell.tsx` — XD (🔴) and pay date (🟢) indicators per ticker
- [x] `client/src/components/TickerDetail.tsx` — drawer/modal: amount, pay date, period, type

### ✅ Phase 2D — Portfolio + income estimate

- [x] `server/src/routes/portfolio.ts` — GET/POST/DELETE `/api/portfolio`
- [x] `client/src/pages/Portfolio.tsx` — add/remove ticker + quantity
- [x] `client/src/components/IncomeSummary.tsx` — upcoming pay dates × holdings = estimated income

### ✅ Phase 2E — Push notifications

- [x] VAPID key generation script
- [x] `server/src/services/webpush.ts` — init web-push with VAPID keys
- [x] `server/src/routes/push.ts` — POST/DELETE `/api/push/subscription`
- [x] `server/src/routes/watchlist.ts` — GET/POST/DELETE `/api/watchlist`
- [x] `server/src/services/notifications.ts` — daily cron: XD within 3 days → push
- [x] `client/src/hooks/usePushNotification.ts` — request permission, subscribe, POST to server

### 🔲 Phase 2F — VPS deployment

- [ ] Provision VPS (Ubuntu 22.04)
- [ ] Nginx config: reverse proxy port 3000 → `/api`, serve `client/dist` static
- [ ] systemd service: `th-div-server.service`
- [ ] systemd service: `th-div-scraper.service` (replace local node-cron with system timer)
- [ ] Let's Encrypt HTTPS via certbot
- [ ] Deploy script / GitHub Actions CI

---

### ✅ Phase 3 — Mobile App (Expo iOS + Android)

**Submodule:** `mobile/` → `https://github.com/amajakai14/th-div-mobile.git`
**Stack:** Expo SDK 54, Expo Router v6, NativeWind v5, React Query v5, expo-sqlite v13
**Completed:** 2026-05-17

**Features:**
- [x] Auth: JWT login/register with expo-secure-store, three-state loading guard
- [x] Calendar: monthly grid, XD + pay dots, ticker detail modal
- [x] Portfolio: holdings CRUD, income estimate (holdings × DPS)
- [x] Watchlist: add/remove tickers, push notification toggle
- [x] Push: Expo Push Notifications via expo-notifications + server-side expo-server-sdk
- [x] Offline: SQLite write-through cache; fallback to cached data on network error

**Build & Deploy:**
- [ ] `eas build --profile development` — dev client for physical device testing
- [ ] `eas build --profile preview` — APK for internal distribution
- [ ] `eas build --profile production` — store-ready build
- [ ] `eas submit` — App Store + Play Store submission
- [ ] OTA updates via `eas update` (expo-updates)

**Phase 3 QA checklist:**
- [ ] Login/register flow works on iOS simulator
- [ ] Calendar loads from API + falls back to SQLite offline
- [ ] Portfolio add/remove persists across app restarts
- [ ] Watchlist push toggle registers Expo token with server
- [ ] Push notification received on physical device (XD alert)
- [ ] Dark mode renders correct design tokens
- [ ] No raw hex colors in any component (all via useTheme())
