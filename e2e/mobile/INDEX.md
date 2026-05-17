# Mobile E2E Flows (Maestro)

Run single: `maestro test e2e/mobile/<flow>.yaml`
Run all:    `maestro test e2e/mobile/`

## Setup

1. Install Maestro: `curl -Ls "https://get.maestro.mobile.dev" | bash`
2. Start a simulator / connect a device
3. Build the Expo dev client and install it on the device
4. Ensure the backend server is reachable at the URL configured in `services/api.ts`
5. Seed the test account: `POST /auth/register` with `test@example.com` / `password123`

The `config.yaml` at the root of this directory sets `appId: com.amajakai14.thdiv`.

## Reusable helpers

| File | Purpose |
|------|---------|
| `helpers/login.yaml` | Signs in as `test@example.com` / `password123`. Import with `runFlow: helpers/login.yaml`. |

## Flow index

| Flow file | Scenario | Key assertions |
|-----------|----------|----------------|
| `auth-register.yaml` | Register a new account via the Create account screen | "Create account" form submits, lands on Calendar tab |
| `auth-login.yaml` | Login with known test account | "Sign in" form submits, Calendar tab visible |
| `calendar-load.yaml` | Calendar month grid renders after login | DOW headers (Sun–Sat), legend labels (XD date, Pay date) visible |
| `calendar-month-nav.yaml` | Tap › / ‹ buttons to change month | Month label changes from "May 2026" to "June 2026" and back |
| `calendar-ticker-modal.yaml` | Tap a day cell with XD events | DaySheet opens showing "Ex-Dividend" tab and Close button |
| `portfolio-add.yaml` | Add PTT holding (100 shares) via Portfolio tab | HoldingCard with "PTT" and "Qty: 100" appears |
| `portfolio-delete.yaml` | Delete PTT holding via × button | PTT card disappears, "No holdings yet" shown |
| `portfolio-income.yaml` | Holdings section visible after adding a position | HOLDINGS label, PTT card, and qty present |
| `watchlist-add.yaml` | Add KBANK to watchlist on Profile tab | TickerCard with "KBANK" visible |
| `watchlist-remove.yaml` | Remove KBANK via × button on TickerCard | KBANK gone, "No tickers on watchlist" shown |
| `offline-fallback.yaml` | Toggle airplane mode after load, reopen app | OfflineBadge "Offline · showing cached data" and grid still visible |
| `dark-mode.yaml` | Switch OS to dark mode via setDarkMode, relaunch | Calendar and legend labels still visible in dark scheme |
| `logout.yaml` | Tap Sign out on Profile screen | Redirected to login screen with "Sign in" heading |

## Notes

- No `testID` attributes exist in the current codebase — all selectors use visible text labels.
- `calendar-ticker-modal.yaml` taps date "9" which has XD events in the May 2026 dataset. If the dataset changes, update the date accordingly.
- `offline-fallback.yaml` requires `toggleAirplaneMode` (Maestro 1.29+) and a real device or simulator with network control support.
- `dark-mode.yaml` requires `setDarkMode` (Maestro 1.36+).
- Flows that depend on prior state chain with `runFlow` instead of repeating steps.
