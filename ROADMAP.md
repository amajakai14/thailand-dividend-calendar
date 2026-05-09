# TH Dividend Calendar — Roadmap

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

**Display:**
- Calendar view showing XD dates and dividend pay dates per day
- Per-ticker detail (amount, pay date, period)

**User features:**
- Subscribe to tickers → push notification when XD date approaches
- Portfolio input: user stores which tickers they hold + quantity
- Estimated dividend income calculation based on holdings

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

### 🔲 Left (Phase 2 — not started)

**Backend:**
- [ ] REST API layer (Express or Hapi) serving dividend data from SQLite
- [ ] User accounts — email/password or magic link auth
- [ ] User portfolio table — ticker + quantity per user
- [ ] Subscription table — user ↔ ticker watchlist
- [ ] Push notification system — Web Push API (VAPID keys), store push subscriptions
- [ ] Notification scheduler — daily check: if XD date is N days away, send push to subscribed users

**Frontend:**
- [ ] PWA setup — `manifest.json`, service worker, installable
- [ ] Calendar view component — render XD + pay dates per day
- [ ] Ticker detail popup/drawer
- [ ] Portfolio input UI — add/remove holdings with quantity
- [ ] Notification permission request + subscription flow
- [ ] Estimated income summary — holdings × cash_per_share per upcoming pay date

**Infrastructure:**
- [ ] Choose hosting (VPS / Railway / Fly.io)
- [ ] Move SQLite → PostgreSQL if multi-user load requires it
- [ ] HTTPS + domain
- [ ] Cron job on server (replace local `node-cron` with system crontab or hosted scheduler)
