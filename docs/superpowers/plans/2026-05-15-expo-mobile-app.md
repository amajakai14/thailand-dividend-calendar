# Expo Mobile App — Thailand Dividend Calendar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an Expo iOS + Android mobile app connected to the existing Express API, with SQLite offline cache, mirroring the Thai Dividend Calendar design system.

**Architecture:** Expo Router v4 with `(auth)` and `(tabs)` route groups guards JWT auth via SecureStore; expo-sqlite v13 acts as a write-through offline cache (WAL mode, user_id isolation, transaction-wrapped bulk writes); expo-notifications handles native push replacing web-push, requiring a new server-side `expo_push_tokens` table and route; NativeWind v5 + Tailwind CSS v4 maps all DESIGN.md tokens to utility classes via `tailwind.config.js`.

**Tech Stack:** Expo SDK 52, Expo Router v4, NativeWind v5 (Tailwind CSS v4), TanStack React Query v5, expo-secure-store, expo-sqlite v13, expo-notifications, expo-server-sdk (server-side)

---

## File Map

### New submodule: `mobile/` (repo: `amajakai14/th-div-mobile`)

```
mobile/
  app/
    _layout.tsx                  ← QueryClient + AuthProvider + NavigationGuard + SplashScreen
    (auth)/
      login.tsx
      register.tsx
    (tabs)/
      _layout.tsx                ← Tabs navigator + TabBar
      index.tsx                  ← Calendar home screen
      portfolio.tsx              ← Portfolio + income summary
      profile.tsx                ← Watchlist + push toggle + logout
    modal/
      [ticker].tsx               ← Ticker detail modal (presentation: 'modal')
  components/
    CalendarGrid.tsx             ← Month grid (7 col)
    DayCell.tsx                  ← Single cell: date circle + XD/pay dots
    TickerCard.tsx               ← Stock card: ticker tile + name + DPS + dates
    HoldingCard.tsx              ← Portfolio row: ticker + qty + projected income
    OfflineBadge.tsx             ← "Offline · showing cached data" banner
    ErrorToast.tsx               ← Bottom toast for offline mutation block
    TabBar.tsx                   ← Custom 3-tab bar per DESIGN.md §5.4
  hooks/
    useAuth.ts                   ← AuthContext: token state + login/logout
    useTheme.ts                  ← useColorScheme wrapper returning C token object
    useNetworkStatus.ts          ← NetInfo online/offline state
  services/
    api.ts                       ← Typed fetch wrapper, SecureStore JWT injection
    db.ts                        ← expo-sqlite open, schema, WAL, CRUD helpers
  queries/
    useDividends.ts              ← React Query: fetch /api/dividends → SQLite fallback
    usePortfolio.ts              ← React Query: GET/POST/DELETE /api/portfolio
    useWatchlist.ts              ← React Query: GET/POST/DELETE /api/watchlist
    usePushToken.ts              ← Expo Notifications token registration + server POST
  constants/
    theme.ts                     ← All DESIGN.md tokens as typed TS constants
  tailwind.config.js             ← Extends Tailwind with theme tokens
  app.json                       ← Expo config: name, slug, EXPO_PUBLIC_API_URL
  babel.config.js
  tsconfig.json
  eas.json
  package.json
```

### Modified: main repo

```
server/src/db/schema.ts          ← Add expo_push_tokens table migration
server/src/routes/push.ts        ← Add POST/DELETE /api/push/expo-token
server/src/services/notifications.ts  ← Add Expo push send alongside web-push
package.json (root)              ← Add expo-server-sdk
ROADMAP.md                       ← Add Phase 3 mobile section
.gitmodules                      ← Submodule entry
```

---

## Task 1: Create GitHub Repo + Wire as Git Submodule

**Files:**
- Create: `mobile/` (via git submodule)
- Create: `.gitmodules`

- [ ] **Step 1: Create new GitHub repo**

```bash
gh repo create amajakai14/th-div-mobile --public --description "Thai Dividend Calendar — Expo mobile app"
```

Expected: repo URL printed, `https://github.com/amajakai14/th-div-mobile`

- [ ] **Step 2: Add as submodule at `mobile/` in main repo**

```bash
cd /Users/means/repository/th-div-calendar
git submodule add https://github.com/amajakai14/th-div-mobile.git mobile
```

Expected: `.gitmodules` created, `mobile/` directory appears (empty).

- [ ] **Step 3: Verify submodule wiring**

```bash
cat .gitmodules
```

Expected output:
```
[submodule "mobile"]
	path = mobile
	url = https://github.com/amajakai14/th-div-mobile.git
```

- [ ] **Step 4: Commit submodule registration**

```bash
git add .gitmodules mobile
git commit -m "feat: add th-div-mobile expo submodule at mobile/"
```

---

## Task 2: Initialize Expo Project in Submodule

**Files:**
- Create: `mobile/package.json`, `mobile/app.json`, `mobile/tsconfig.json`, `mobile/babel.config.js`

- [ ] **Step 1: Scaffold Expo project inside submodule**

```bash
cd mobile
npx create-expo-app@latest . --template blank-typescript
```

When prompted about directory not empty (git files exist): accept/yes.

- [ ] **Step 2: Install core dependencies**

```bash
npx expo install expo-router expo-secure-store expo-sqlite expo-notifications expo-splash-screen @react-native-community/netinfo
npm install @tanstack/react-query
```

- [ ] **Step 3: Set entry point in `package.json`**

In `mobile/package.json`, confirm `main` field is set to `expo-router/entry`:

```json
{
  "main": "expo-router/entry"
}
```

If missing, add it under the top-level keys.

- [ ] **Step 4: Configure `app.json`**

Replace `mobile/app.json` content with:

```json
{
  "expo": {
    "name": "TH Dividend Calendar",
    "slug": "th-div-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#F6F4EE"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.amajakai14.thdiv"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#F6F4EE"
      },
      "package": "com.amajakai14.thdiv"
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#2D6CDF"
        }
      ]
    ],
    "scheme": "thdiv",
    "extra": {
      "eas": {
        "projectId": "FILL_IN_AFTER_EAS_INIT"
      }
    }
  }
}
```

- [ ] **Step 5: Verify Expo starts**

```bash
npx expo start
```

Expected: QR code appears, Metro bundler running. Press `q` to quit.

- [ ] **Step 6: Commit initial scaffold**

```bash
git add .
git commit -m "init: scaffold Expo SDK 52 project"
git push origin master
```

---

## Task 3: NativeWind v5 + Design Tokens

**Files:**
- Create: `mobile/constants/theme.ts`
- Create: `mobile/tailwind.config.js`
- Modify: `mobile/babel.config.js`
- Modify: `mobile/app.json` (withNativeWind plugin)

> **Note for agentic workers:** Invoke the `expo:expo-tailwind-setup` skill at the start of this task for the authoritative NativeWind v5 + Tailwind CSS v4 setup steps. The steps below are the design-level spec; defer to the skill for exact package versions and config syntax.

- [ ] **Step 1: Install NativeWind v5 + Tailwind CSS v4**

```bash
cd mobile
npx expo install nativewind@^5.0.0 tailwindcss@^4.0.0 react-native-css-interop
```

- [ ] **Step 2: Create `mobile/constants/theme.ts`**

```typescript
export const LIGHT = {
  bg: '#F6F4EE',
  surface: '#FFFFFF',
  surface2: '#F0EDE6',
  text: '#15181D',
  muted: '#8A8478',
  outMonth: '#C9C3B5',
  weekend: '#B65A7B',
  divider: '#E7E2D6',
  selectedBg: '#EBE6D8',
  shellBg: '#EAE4D3',
} as const;

export const DARK = {
  bg: '#0E1116',
  surface: '#171B22',
  surface2: '#1F2530',
  text: '#ECEFF4',
  muted: '#8893A4',
  outMonth: '#3A4250',
  weekend: '#A4537A',
  divider: '#262C36',
  selectedBg: '#222A36',
  shellBg: '#0A0D11',
} as const;

export const ACCENT = {
  xd: '#E25241',
  pay: '#1F9D6B',
  today: '#2D6CDF',
  xdAlpha8: '#E2524114',
  xdAlpha20: '#E2524133',
  payAlpha8: '#1F9D6B14',
  payAlpha20: '#1F9D6B33',
  todayAlpha8: '#2D6CDF14',
  todayAlpha20: '#2D6CDF33',
} as const;

export const RADIUS = {
  sm: 8,
  md: 10,
  cell: 12,
  card: 14,
  sheet: 24,
  pill: 999,
} as const;

export const FONT_SIZE = {
  eyebrow: 11,
  caption: 11,
  body: 13,
  cardTitle: 15,
  sectionTitle: 18,
  display: 26,
} as const;

export type Theme = typeof LIGHT;
```

- [ ] **Step 3: Create `mobile/tailwind.config.js`**

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Light theme
        bg: '#F6F4EE',
        surface: '#FFFFFF',
        surface2: '#F0EDE6',
        text: '#15181D',
        muted: '#8A8478',
        'out-month': '#C9C3B5',
        divider: '#E7E2D6',
        'selected-bg': '#EBE6D8',
        // Accents
        xd: '#E25241',
        pay: '#1F9D6B',
        today: '#2D6CDF',
        weekend: '#B65A7B',
      },
      borderRadius: {
        sm: '8px',
        md: '10px',
        cell: '12px',
        card: '14px',
        sheet: '24px',
        pill: '999px',
      },
      fontSize: {
        eyebrow: '11px',
        body: '13px',
        'card-title': '15px',
        section: '18px',
        display: '26px',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 4: Follow `expo:expo-tailwind-setup` skill to wire NativeWind into `babel.config.js` and `app.json`**

Invoke the skill: this step wires the config plugin and Babel preset correctly. The skill output supersedes any babel config shown here.

- [ ] **Step 5: Create `mobile/hooks/useTheme.ts`**

```typescript
import { useColorScheme } from 'react-native';
import { LIGHT, DARK, ACCENT, RADIUS, FONT_SIZE, Theme } from '../constants/theme';

export function useTheme(): { C: Theme; accent: typeof ACCENT; radius: typeof RADIUS; font: typeof FONT_SIZE; dark: boolean } {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  return {
    C: dark ? DARK : LIGHT,
    accent: ACCENT,
    radius: RADIUS,
    font: FONT_SIZE,
    dark,
  };
}
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: add NativeWind v5 + design token system"
git push origin master
```

---

## Task 4: expo-sqlite DB Layer

**Files:**
- Create: `mobile/services/db.ts`

- [ ] **Step 1: Create `mobile/services/db.ts`**

```typescript
import * as SQLite from 'expo-sqlite';

export interface DividendRow {
  ticker: string;
  company: string | null;
  xd_date: string;
  pay_date: string | null;
  cash_per_share: number | null;
  dividend_type: string | null;
  period_start: string | null;
  period_end: string | null;
  synced_at: string;
}

export interface PortfolioRow {
  ticker: string;
  quantity: number;
  user_id: string;
  synced_at: string;
}

export interface WatchlistRow {
  ticker: string;
  user_id: string;
  synced_at: string;
}

let _db: SQLite.SQLiteDatabase | null = null;

export async function openDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  const db = await SQLite.openDatabaseAsync('cache.db');
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS dividends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker TEXT NOT NULL,
      company TEXT,
      xd_date TEXT NOT NULL,
      pay_date TEXT,
      cash_per_share REAL,
      dividend_type TEXT,
      period_start TEXT,
      period_end TEXT,
      synced_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(ticker, xd_date)
    );
    CREATE TABLE IF NOT EXISTS portfolio (
      ticker TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      user_id TEXT NOT NULL,
      synced_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (ticker, user_id)
    );
    CREATE TABLE IF NOT EXISTS watchlist (
      ticker TEXT NOT NULL,
      user_id TEXT NOT NULL,
      synced_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (ticker, user_id)
    );
  `);
  _db = db;
  return db;
}

// Dividends

export async function upsertDividends(db: SQLite.SQLiteDatabase, records: DividendRow[]): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const r of records) {
      await db.runAsync(
        `INSERT OR REPLACE INTO dividends
          (ticker, company, xd_date, pay_date, cash_per_share, dividend_type, period_start, period_end, synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [r.ticker, r.company ?? null, r.xd_date, r.pay_date ?? null, r.cash_per_share ?? null,
         r.dividend_type ?? null, r.period_start ?? null, r.period_end ?? null]
      );
    }
  });
}

export async function getDividendsByMonth(
  db: SQLite.SQLiteDatabase,
  year: number,
  month: number
): Promise<DividendRow[]> {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return db.getAllAsync<DividendRow>(
    `SELECT * FROM dividends WHERE xd_date LIKE ? OR pay_date LIKE ? ORDER BY xd_date`,
    [`${prefix}%`, `${prefix}%`]
  );
}

// Portfolio

export async function upsertPortfolio(
  db: SQLite.SQLiteDatabase,
  userId: string,
  records: { ticker: string; quantity: number }[]
): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM portfolio WHERE user_id = ?', [userId]);
    for (const r of records) {
      await db.runAsync(
        `INSERT INTO portfolio (ticker, quantity, user_id, synced_at) VALUES (?, ?, ?, datetime('now'))`,
        [r.ticker, r.quantity, userId]
      );
    }
  });
}

export async function getPortfolio(db: SQLite.SQLiteDatabase, userId: string): Promise<PortfolioRow[]> {
  return db.getAllAsync<PortfolioRow>(
    'SELECT * FROM portfolio WHERE user_id = ? ORDER BY ticker',
    [userId]
  );
}

// Watchlist

export async function upsertWatchlist(
  db: SQLite.SQLiteDatabase,
  userId: string,
  tickers: string[]
): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM watchlist WHERE user_id = ?', [userId]);
    for (const ticker of tickers) {
      await db.runAsync(
        `INSERT INTO watchlist (ticker, user_id, synced_at) VALUES (?, ?, datetime('now'))`,
        [ticker, userId]
      );
    }
  });
}

export async function getWatchlist(db: SQLite.SQLiteDatabase, userId: string): Promise<WatchlistRow[]> {
  return db.getAllAsync<WatchlistRow>(
    'SELECT * FROM watchlist WHERE user_id = ? ORDER BY ticker',
    [userId]
  );
}

// Cleanup on logout

export async function clearUserData(db: SQLite.SQLiteDatabase, userId: string): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM portfolio WHERE user_id = ?', [userId]);
    await db.runAsync('DELETE FROM watchlist WHERE user_id = ?', [userId]);
  });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd mobile
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add services/db.ts
git commit -m "feat: expo-sqlite v13 db layer with WAL + user isolation"
git push origin master
```

---

## Task 5: API Service

**Files:**
- Create: `mobile/services/api.ts`

- [ ] **Step 1: Create `mobile/services/api.ts`**

```typescript
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export interface DividendRecord {
  ticker: string;
  company: string;
  xd_date: string;
  pay_date: string | null;
  cash_per_share: number | null;
  dividend_type: string | null;
  period_start: string | null;
  period_end: string | null;
}

export interface PortfolioItem {
  ticker: string;
  quantity: number;
}

export interface WatchlistItem {
  ticker: string;
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await SecureStore.getItemAsync('jwt');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, init);
  if (res.status === 401) throw new ApiError(401, 'Unauthorized');
  if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Auth

export async function login(email: string, password: string): Promise<{ token: string }> {
  return request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}

export async function register(email: string, password: string): Promise<{ token: string }> {
  return request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}

// Dividends

export async function getDividends(month: number, year: number): Promise<DividendRecord[]> {
  return request(`/api/dividends?month=${month}&year=${year}`);
}

// Portfolio

export async function getPortfolio(): Promise<PortfolioItem[]> {
  return request('/api/portfolio', { headers: await authHeaders() });
}

export async function addHolding(ticker: string, quantity: number): Promise<void> {
  await request('/api/portfolio', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ ticker, quantity }),
  });
}

export async function removeHolding(ticker: string): Promise<void> {
  await request(`/api/portfolio/${encodeURIComponent(ticker)}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
}

// Watchlist

export async function getWatchlist(): Promise<WatchlistItem[]> {
  return request('/api/watchlist', { headers: await authHeaders() });
}

export async function addToWatchlist(ticker: string): Promise<void> {
  await request('/api/watchlist', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ ticker }),
  });
}

export async function removeFromWatchlist(ticker: string): Promise<void> {
  await request(`/api/watchlist/${encodeURIComponent(ticker)}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
}

// Push token

export async function registerExpoPushToken(token: string): Promise<void> {
  await request('/api/push/expo-token', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ token }),
  });
}

export async function unregisterExpoPushToken(token: string): Promise<void> {
  await request('/api/push/expo-token', {
    method: 'DELETE',
    headers: await authHeaders(),
    body: JSON.stringify({ token }),
  });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add services/api.ts
git commit -m "feat: typed API service with SecureStore JWT injection"
git push origin master
```

---

## Task 6: AuthProvider + Root Layout (Auth Guard + SplashScreen)

**Files:**
- Create: `mobile/hooks/useAuth.ts`
- Create: `mobile/hooks/useNetworkStatus.ts`
- Create: `mobile/app/_layout.tsx`

- [ ] **Step 1: Create `mobile/hooks/useAuth.ts`**

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';

interface AuthContextType {
  token: string | null | undefined; // undefined = still loading from SecureStore
  userId: string | null;
  signIn: (jwt: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function decodeUserId(jwt: string): string {
  try {
    const payload = JSON.parse(atob(jwt.split('.')[1]));
    return String(payload.userId ?? payload.sub ?? 'unknown');
  } catch {
    return 'unknown';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync('jwt').then((t) => {
      setToken(t);
      setUserId(t ? decodeUserId(t) : null);
    });
  }, []);

  async function signIn(jwt: string) {
    await SecureStore.setItemAsync('jwt', jwt);
    setToken(jwt);
    setUserId(decodeUserId(jwt));
  }

  async function signOut() {
    await SecureStore.deleteItemAsync('jwt');
    setToken(null);
    setUserId(null);
  }

  return (
    <AuthContext.Provider value={{ token, userId, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

- [ ] **Step 2: Create `mobile/hooks/useNetworkStatus.ts`**

```typescript
import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useNetworkStatus(): { isOnline: boolean } {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? true);
    });
    return unsub;
  }, []);

  return { isOnline };
}
```

- [ ] **Step 3: Create `mobile/app/_layout.tsx`**

```tsx
import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { ApiError } from '../services/api';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status === 401) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      onError: (error) => {
        if (error instanceof ApiError && error.status === 401) {
          queryClient.clear();
        }
      },
    },
  },
});

function NavigationGuard() {
  const { token } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (token === undefined) return; // still loading
    SplashScreen.hideAsync();
    const inAuthGroup = segments[0] === '(auth)';
    if (!token && !inAuthGroup) router.replace('/(auth)/login');
    if (token && inAuthGroup) router.replace('/(tabs)');
  }, [token, segments]);

  if (token === undefined) return null;
  return <Slot />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NavigationGuard />
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 5: Commit**

```bash
git add app/_layout.tsx hooks/useAuth.ts hooks/useNetworkStatus.ts
git commit -m "feat: AuthProvider + NavigationGuard + SplashScreen hold"
git push origin master
```

---

## Task 7: Login Screen

**Files:**
- Create: `mobile/app/(auth)/login.tsx`

- [ ] **Step 1: Create `mobile/app/(auth)/login.tsx`**

```tsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { login, ApiError } from '../../services/api';

export default function LoginScreen() {
  const { C, accent, radius, font } = useTheme();
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError('');
    setLoading(true);
    try {
      const { token } = await login(email.trim(), password);
      await signIn(token);
      router.replace('/(tabs)');
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setError('Invalid email or password.');
      } else {
        setError('Could not connect. Check your connection.');
      }
    } finally {
      setLoading(false);
    }
  }

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', paddingHorizontal: 20 },
    title: { fontSize: font.display, fontWeight: '700', color: C.text, marginBottom: 8 },
    subtitle: { fontSize: font.body, color: C.muted, marginBottom: 32 },
    label: { fontSize: font.eyebrow, fontWeight: '600', color: C.muted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
    input: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.divider, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 11, fontSize: font.body, color: C.text, marginBottom: 16 },
    error: { fontSize: font.caption, color: accent.xd, marginBottom: 16 },
    button: { backgroundColor: C.text, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
    buttonText: { fontSize: font.body, fontWeight: '700', color: C.bg },
    link: { fontSize: font.body, color: accent.today, textAlign: 'center' },
  });

  return (
    <View style={s.container}>
      <Text style={s.title}>Sign in</Text>
      <Text style={s.subtitle}>Thai Dividend Calendar</Text>
      <Text style={s.label}>Email</Text>
      <TextInput
        style={s.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        placeholderTextColor={C.muted}
        placeholder="you@example.com"
      />
      <Text style={s.label}>Password</Text>
      <TextInput
        style={s.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
        placeholderTextColor={C.muted}
        placeholder="••••••••"
      />
      {error ? <Text style={s.error}>{error}</Text> : null}
      <TouchableOpacity style={s.button} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
        {loading ? <ActivityIndicator color={C.bg} /> : <Text style={s.buttonText}>Sign in</Text>}
      </TouchableOpacity>
      <Link href="/(auth)/register" style={s.link}>Don't have an account? Register</Link>
    </View>
  );
}
```

- [ ] **Step 2: Test in Expo Go**

Start the dev server and verify:
- Login screen renders with email + password fields
- Wrong credentials shows error message
- Correct credentials navigates to `/(tabs)`

```bash
npx expo start
```

- [ ] **Step 3: Commit**

```bash
git add app/\(auth\)/login.tsx
git commit -m "feat: login screen with error handling"
git push origin master
```

---

## Task 8: Register Screen

**Files:**
- Create: `mobile/app/(auth)/register.tsx`

- [ ] **Step 1: Create `mobile/app/(auth)/register.tsx`**

```tsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { register, ApiError } from '../../services/api';

export default function RegisterScreen() {
  const { C, accent, radius, font } = useTheme();
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setError('');
    setLoading(true);
    try {
      const { token } = await register(email.trim(), password);
      await signIn(token);
      router.replace('/(tabs)');
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setError('Email already registered.');
      } else if (e instanceof ApiError && e.status === 400) {
        setError('Invalid email or password (min 8 characters).');
      } else {
        setError('Could not connect. Check your connection.');
      }
    } finally {
      setLoading(false);
    }
  }

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', paddingHorizontal: 20 },
    title: { fontSize: font.display, fontWeight: '700', color: C.text, marginBottom: 8 },
    subtitle: { fontSize: font.body, color: C.muted, marginBottom: 32 },
    label: { fontSize: font.eyebrow, fontWeight: '600', color: C.muted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
    input: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.divider, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 11, fontSize: font.body, color: C.text, marginBottom: 16 },
    error: { fontSize: font.caption, color: accent.xd, marginBottom: 16 },
    button: { backgroundColor: C.text, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
    buttonText: { fontSize: font.body, fontWeight: '700', color: C.bg },
    link: { fontSize: font.body, color: accent.today, textAlign: 'center' },
  });

  return (
    <View style={s.container}>
      <Text style={s.title}>Create account</Text>
      <Text style={s.subtitle}>Thai Dividend Calendar</Text>
      <Text style={s.label}>Email</Text>
      <TextInput
        style={s.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        placeholderTextColor={C.muted}
        placeholder="you@example.com"
      />
      <Text style={s.label}>Password</Text>
      <TextInput
        style={s.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        placeholderTextColor={C.muted}
        placeholder="Min 8 characters"
      />
      {error ? <Text style={s.error}>{error}</Text> : null}
      <TouchableOpacity style={s.button} onPress={handleRegister} disabled={loading} activeOpacity={0.8}>
        {loading ? <ActivityIndicator color={C.bg} /> : <Text style={s.buttonText}>Create account</Text>}
      </TouchableOpacity>
      <Link href="/(auth)/login" style={s.link}>Already have an account? Sign in</Link>
    </View>
  );
}
```

- [ ] **Step 2: Test in Expo Go**

Verify:
- Register with new email → navigates to tabs
- Duplicate email → "Email already registered." error
- Short password → "Invalid email or password" error

- [ ] **Step 3: Commit**

```bash
git add app/\(auth\)/register.tsx
git commit -m "feat: register screen"
git push origin master
```

---

## Task 9: Tab Layout + Custom TabBar

**Files:**
- Create: `mobile/components/TabBar.tsx`
- Create: `mobile/app/(tabs)/_layout.tsx`

- [ ] **Step 1: Create `mobile/components/TabBar.tsx`**

```tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Svg, Path, Circle } from 'react-native-svg';
import { useTheme } from '../hooks/useTheme';

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

function CalendarIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path d="M3 8h16M7 3v2m8-2v2M4 5h14a1 1 0 011 1v13a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z"
        stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChartIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path d="M4 16l4-4 4 3 4-6" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 19h16" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

function PersonIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Circle cx={11} cy={7} r={4} stroke={color} strokeWidth={1.7} />
      <Path d="M3 19c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

const ICONS = [CalendarIcon, ChartIcon, PersonIcon];
const LABELS = ['Calendar', 'Portfolio', 'Profile'];

export function TabBar({ state, navigation }: TabBarProps) {
  const { C, accent } = useTheme();

  const s = StyleSheet.create({
    bar: { flexDirection: 'row', height: 64, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.divider },
    tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
    label: { fontSize: 10.5, fontWeight: '600' },
  });

  return (
    <View style={s.bar}>
      {state.routes.map((route: any, i: number) => {
        const focused = state.index === i;
        const color = focused ? accent.today : C.muted;
        const Icon = ICONS[i];
        return (
          <TouchableOpacity
            key={route.key}
            style={s.tab}
            onPress={() => navigation.navigate(route.name)}
            activeOpacity={0.7}
          >
            <Icon color={color} />
            <Text style={[s.label, { color }]}>{LABELS[i]}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
```

- [ ] **Step 2: Install react-native-svg**

```bash
npx expo install react-native-svg
```

- [ ] **Step 3: Create `mobile/app/(tabs)/_layout.tsx`**

```tsx
import { Tabs } from 'expo-router';
import { TabBar } from '../../components/TabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="portfolio" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
```

- [ ] **Step 4: Create placeholder screens to verify tabs render**

Create `mobile/app/(tabs)/index.tsx`:
```tsx
import { View, Text } from 'react-native';
export default function CalendarScreen() {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>Calendar</Text></View>;
}
```

Create `mobile/app/(tabs)/portfolio.tsx`:
```tsx
import { View, Text } from 'react-native';
export default function PortfolioScreen() {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>Portfolio</Text></View>;
}
```

Create `mobile/app/(tabs)/profile.tsx`:
```tsx
import { View, Text } from 'react-native';
export default function ProfileScreen() {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>Profile</Text></View>;
}
```

- [ ] **Step 5: Test tab navigation in Expo Go**

Verify: 3 tabs render (Calendar / Portfolio / Profile), active tab icon + label use `#2D6CDF`, inactive use `#8A8478`.

- [ ] **Step 6: Commit**

```bash
git add components/TabBar.tsx app/\(tabs\)/_layout.tsx app/\(tabs\)/index.tsx app/\(tabs\)/portfolio.tsx app/\(tabs\)/profile.tsx
git commit -m "feat: tab layout + custom TabBar per design spec"
git push origin master
```

---

## Task 10: useDividends Query (React Query + SQLite Fallback)

**Files:**
- Create: `mobile/queries/useDividends.ts`

- [ ] **Step 1: Create `mobile/queries/useDividends.ts`**

```typescript
import { useQuery } from '@tanstack/react-query';
import { getDividends, DividendRecord } from '../services/api';
import { openDb, upsertDividends, getDividendsByMonth, DividendRow } from '../services/db';

function recordToRow(r: DividendRecord): DividendRow {
  return {
    ticker: r.ticker,
    company: r.company,
    xd_date: r.xd_date,
    pay_date: r.pay_date,
    cash_per_share: r.cash_per_share,
    dividend_type: r.dividend_type,
    period_start: r.period_start,
    period_end: r.period_end,
    synced_at: new Date().toISOString(),
  };
}

export function useDividends(month: number, year: number) {
  return useQuery<DividendRow[], Error>({
    queryKey: ['dividends', year, month],
    queryFn: async () => {
      const db = await openDb();
      try {
        const data = await getDividends(month, year);
        const rows = data.map(recordToRow);
        await upsertDividends(db, rows);
        return rows;
      } catch {
        // Server unreachable — return cached data
        return getDividendsByMonth(db, year, month);
      }
    },
  });
}

// Helper: group rows by calendar date key "YYYY-MM-DD"
export function groupByDate(rows: DividendRow[]): Record<string, { xd: DividendRow[]; pay: DividendRow[] }> {
  const result: Record<string, { xd: DividendRow[]; pay: DividendRow[] }> = {};
  for (const row of rows) {
    const addTo = (date: string | null, type: 'xd' | 'pay') => {
      if (!date) return;
      if (!result[date]) result[date] = { xd: [], pay: [] };
      result[date][type].push(row);
    };
    addTo(row.xd_date, 'xd');
    addTo(row.pay_date, 'pay');
  }
  return result;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add queries/useDividends.ts
git commit -m "feat: useDividends query with SQLite offline fallback"
git push origin master
```

---

## Task 11: CalendarGrid + DayCell Components

**Files:**
- Create: `mobile/components/DayCell.tsx`
- Create: `mobile/components/CalendarGrid.tsx`

- [ ] **Step 1: Create `mobile/components/DayCell.tsx`**

```tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { DividendRow } from '../services/db';

interface DayCellProps {
  date: Date | null;
  xdRows: DividendRow[];
  payRows: DividendRow[];
  isToday: boolean;
  isCurrentMonth: boolean;
  onPress?: (xdRows: DividendRow[], payRows: DividendRow[], date: Date) => void;
}

export function DayCell({ date, xdRows, payRows, isToday, isCurrentMonth, onPress }: DayCellProps) {
  const { C, accent, radius } = useTheme();

  if (!date) return <View style={styles.empty} />;

  const hasXd = xdRows.length > 0;
  const hasPay = payRows.length > 0;

  const s = StyleSheet.create({
    cell: { flex: 1, aspectRatio: 1 / 1.18, padding: 4, alignItems: 'center' },
    circle: {
      width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
      backgroundColor: isToday ? accent.today : 'transparent',
    },
    dateNum: {
      fontSize: 13, fontWeight: isToday ? '700' : '500',
      color: isToday ? '#FFFFFF' : isCurrentMonth ? C.text : C.outMonth,
    },
    dots: { flexDirection: 'row', gap: 3, marginTop: 3, height: 6 },
    dot: { width: 6, height: 6, borderRadius: 3 },
    dotWide: { width: 14, height: 6, borderRadius: 3 },
  });

  return (
    <TouchableOpacity
      style={s.cell}
      onPress={() => onPress?.(xdRows, payRows, date)}
      activeOpacity={0.7}
      disabled={!hasXd && !hasPay}
    >
      <View style={s.circle}>
        <Text style={s.dateNum}>{date.getDate()}</Text>
      </View>
      <View style={s.dots}>
        {hasXd && (
          <View style={[xdRows.length > 1 ? s.dotWide : s.dot, { backgroundColor: accent.xd }]} />
        )}
        {hasPay && (
          <View style={[payRows.length > 1 ? s.dotWide : s.dot, { backgroundColor: accent.pay }]} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, aspectRatio: 1 / 1.18 },
});
```

- [ ] **Step 2: Create `mobile/components/CalendarGrid.tsx`**

```tsx
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { DayCell } from './DayCell';
import { DividendRow } from '../services/db';

interface CalendarGridProps {
  year: number;
  month: number; // 1-12
  byDate: Record<string, { xd: DividendRow[]; pay: DividendRow[] }>;
  onDayPress: (xdRows: DividendRow[], payRows: DividendRow[], date: Date) => void;
}

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildCalendarDates(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month - 1, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function CalendarGrid({ year, month, byDate, onDayPress }: CalendarGridProps) {
  const { C, accent } = useTheme();
  const today = new Date();
  const cells = buildCalendarDates(year, month);

  const s = StyleSheet.create({
    dow: { flexDirection: 'row', paddingHorizontal: 8, marginBottom: 4 },
    dowLabel: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '600', color: C.muted, textTransform: 'uppercase' },
    dowSat: { color: accent.xd },
    dowSun: { color: accent.xd },
    week: { flexDirection: 'row', paddingHorizontal: 8 },
  });

  const dateKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <View>
      <View style={s.dow}>
        {DOW_LABELS.map((d, i) => (
          <Text key={d} style={[s.dowLabel, (i === 0 || i === 6) && { color: accent.xd }]}>
            {d}
          </Text>
        ))}
      </View>
      {weeks.map((week, wi) => (
        <View key={wi} style={s.week}>
          {week.map((date, di) => {
            const key = date ? dateKey(date) : `empty-${wi}-${di}`;
            const entry = date ? byDate[dateKey(date)] : null;
            const isToday = date
              ? date.getFullYear() === today.getFullYear() &&
                date.getMonth() === today.getMonth() &&
                date.getDate() === today.getDate()
              : false;
            return (
              <DayCell
                key={key}
                date={date}
                xdRows={entry?.xd ?? []}
                payRows={entry?.pay ?? []}
                isToday={isToday}
                isCurrentMonth={date ? date.getMonth() === month - 1 : false}
                onPress={onDayPress}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add components/DayCell.tsx components/CalendarGrid.tsx
git commit -m "feat: CalendarGrid + DayCell components"
git push origin master
```

---

## Task 12: Calendar Home Screen

**Files:**
- Modify: `mobile/app/(tabs)/index.tsx` (replace placeholder)
- Create: `mobile/components/OfflineBadge.tsx`

- [ ] **Step 1: Create `mobile/components/OfflineBadge.tsx`**

```tsx
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

export function OfflineBadge() {
  const { C, accent, radius } = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: accent.xdAlpha8, borderColor: accent.xdAlpha20 }]}>
      <Text style={[styles.text, { color: accent.xd }]}>Offline · showing cached data</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, alignSelf: 'center', marginBottom: 8 },
  text: { fontSize: 11, fontWeight: '600' },
});
```

- [ ] **Step 2: Replace `mobile/app/(tabs)/index.tsx` with full calendar screen**

```tsx
import { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useDividends, groupByDate } from '../../queries/useDividends';
import { CalendarGrid } from '../../components/CalendarGrid';
import { OfflineBadge } from '../../components/OfflineBadge';
import { DividendRow } from '../../services/db';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function CalendarScreen() {
  const { C, accent, font } = useTheme();
  const { isOnline } = useNetworkStatus();
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data = [], isPending, isError } = useDividends(month, year);
  const byDate = useMemo(() => groupByDate(data), [data]);

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  function onDayPress(xdRows: DividendRow[], payRows: DividendRow[], date: Date) {
    const allRows = [...xdRows, ...payRows];
    if (allRows.length === 0) return;
    // Navigate to modal with first ticker; modal can show all tickers for the day
    router.push({ pathname: '/modal/[ticker]', params: { ticker: allRows[0].ticker, date: date.toISOString() } });
  }

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
    monthLabel: { fontSize: font.display, fontWeight: '700', color: C.text, letterSpacing: -0.6 },
    navBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.surface, borderWidth: 1, borderColor: C.divider, alignItems: 'center', justifyContent: 'center' },
    navBtnText: { fontSize: 18, color: C.text, fontWeight: '600' },
    legend: { flexDirection: 'row', gap: 16, paddingHorizontal: 20, marginBottom: 12 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendLabel: { fontSize: 11, fontWeight: '600', color: C.muted },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.navBtn} onPress={prevMonth}>
          <Text style={s.navBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={s.monthLabel}>{MONTH_NAMES[month - 1]} {year}</Text>
        <TouchableOpacity style={s.navBtn} onPress={nextMonth}>
          <Text style={s.navBtnText}>›</Text>
        </TouchableOpacity>
      </View>
      {!isOnline && data.length > 0 && <OfflineBadge />}
      <View style={s.legend}>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: accent.xd }]} />
          <Text style={s.legendLabel}>XD date</Text>
        </View>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: accent.pay }]} />
          <Text style={s.legendLabel}>Pay date</Text>
        </View>
      </View>
      {isPending ? (
        <View style={s.loading}><ActivityIndicator color={accent.today} /></View>
      ) : (
        <ScrollView>
          <CalendarGrid year={year} month={month} byDate={byDate} onDayPress={onDayPress} />
        </ScrollView>
      )}
    </View>
  );
}
```

- [ ] **Step 3: Set `EXPO_PUBLIC_API_URL` in dev environment**

Create `mobile/.env.local`:
```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

Start server (`npm run dev:server` from main repo root) then test calendar loads dividend data.

- [ ] **Step 4: Test in Expo Go**

Verify: calendar grid renders, XD red dots + pay green dots visible on correct dates, month navigation works.

- [ ] **Step 5: Commit**

```bash
git add app/\(tabs\)/index.tsx components/OfflineBadge.tsx .env.local
git commit -m "feat: calendar home screen with dividend dots + month nav"
git push origin master
```

---

## Task 13: Ticker Detail Modal

**Files:**
- Create: `mobile/app/modal/[ticker].tsx`
- Modify: `mobile/app/_layout.tsx` (add Stack.Screen for modal)

- [ ] **Step 1: Update `mobile/app/_layout.tsx` to declare modal stack**

Replace the `return` in `RootLayout` with:

```tsx
export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="modal/[ticker]" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

Add import at top: `import { Stack } from 'expo-router';`
Replace `<NavigationGuard />` with `<Stack>` children wrapping it — use `NavigationGuard` as a wrapper component around the Stack, or move guard logic into root:

```tsx
// Full updated _layout.tsx
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { ApiError } from '../services/api';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status === 401) return false;
        return failureCount < 2;
      },
    },
  },
});

function NavigationGuard() {
  const { token } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (token === undefined) return;
    SplashScreen.hideAsync();
    const inAuthGroup = segments[0] === '(auth)';
    if (!token && !inAuthGroup) router.replace('/(auth)/login');
    if (token && inAuthGroup) router.replace('/(tabs)');
  }, [token, segments]);

  if (token === undefined) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="modal/[ticker]" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NavigationGuard />
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 2: Create `mobile/app/modal/[ticker].tsx`**

```tsx
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useDividends } from '../../queries/useDividends';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d} ${MONTH_NAMES[parseInt(m) - 1]} ${y}`;
}

export default function TickerModal() {
  const { C, accent, radius, font } = useTheme();
  const router = useRouter();
  const { ticker, date } = useLocalSearchParams<{ ticker: string; date: string }>();

  const targetDate = date ? new Date(date) : new Date();
  const { data = [] } = useDividends(targetDate.getMonth() + 1, targetDate.getFullYear());
  const row = data.find(r => r.ticker === ticker);

  const s = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,12,4,0.42)' },
    sheet: { backgroundColor: C.surface, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, paddingBottom: 32 },
    handle: { width: 40, height: 5, borderRadius: 2.5, backgroundColor: C.divider, alignSelf: 'center', marginTop: 12, marginBottom: 16 },
    hero: { backgroundColor: C.surface2, paddingHorizontal: 20, paddingBottom: 24, paddingTop: 8, marginBottom: 1, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet },
    ticker: { fontSize: font.display, fontWeight: '700', color: C.text, letterSpacing: 0.2 },
    company: { fontSize: font.body, color: C.muted, marginTop: 2 },
    dps: { fontSize: font.display, fontWeight: '700', color: accent.pay, marginTop: 16 },
    dpsLabel: { fontSize: font.eyebrow, fontWeight: '600', color: C.muted, letterSpacing: 1.2, textTransform: 'uppercase' },
    row: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.divider },
    rowLabel: { fontSize: font.body, color: C.muted, fontWeight: '500' },
    rowValue: { fontSize: font.body, color: C.text, fontWeight: '600' },
    closeBtn: { marginHorizontal: 20, marginTop: 20, backgroundColor: C.text, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
    closeBtnText: { fontSize: font.body, fontWeight: '700', color: C.bg },
  });

  if (!row) {
    return (
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.handle} />
          <Text style={[s.ticker, { paddingHorizontal: 20 }]}>Not found</Text>
          <TouchableOpacity style={s.closeBtn} onPress={() => router.back()}>
            <Text style={s.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={s.overlay}>
      <View style={s.sheet}>
        <View style={s.handle} />
        <ScrollView>
          <View style={s.hero}>
            <Text style={s.ticker}>{row.ticker}</Text>
            <Text style={s.company}>{row.company ?? '—'}</Text>
            <Text style={s.dpsLabel}>Dividend per share</Text>
            <Text style={s.dps}>฿{row.cash_per_share?.toFixed(2) ?? '—'}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>XD date</Text>
            <Text style={s.rowValue}>{formatDate(row.xd_date)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Pay date</Text>
            <Text style={s.rowValue}>{formatDate(row.pay_date)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Type</Text>
            <Text style={s.rowValue}>{row.dividend_type ?? '—'}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Period start</Text>
            <Text style={s.rowValue}>{formatDate(row.period_start)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Period end</Text>
            <Text style={s.rowValue}>{formatDate(row.period_end)}</Text>
          </View>
          <TouchableOpacity style={s.closeBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={s.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}
```

- [ ] **Step 3: Test in Expo Go**

Tap a day with XD/pay markers → modal slides up from bottom with ticker details.

- [ ] **Step 4: Commit**

```bash
git add app/_layout.tsx app/modal/
git commit -m "feat: ticker detail modal with DPS + dates"
git push origin master
```

---

## Task 14: Server — Expo Push Tokens (Server-Side Changes)

**Files (main repo):**
- Modify: `server/src/db/schema.ts`
- Modify: `server/src/routes/push.ts`
- Modify: `server/src/services/notifications.ts`
- Modify: `package.json` (root)

> **This task modifies the main repo, not the submodule. Run all commands from `/Users/means/repository/th-div-calendar`.**

- [ ] **Step 1: Install expo-server-sdk in main repo**

```bash
cd /Users/means/repository/th-div-calendar
npm install expo-server-sdk
```

- [ ] **Step 2: Add `expo_push_tokens` migration to `server/src/db/schema.ts`**

Read the file first, then add after the last existing `CREATE TABLE` block:

```typescript
db.exec(`
  CREATE TABLE IF NOT EXISTS expo_push_tokens (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);
```

- [ ] **Step 3: Add `/api/push/expo-token` routes to `server/src/routes/push.ts`**

Read the existing file, then append at the bottom before `export default router`:

```typescript
import Expo from 'expo-server-sdk';
const expoClient = new Expo();

// POST /api/push/expo-token
router.post('/expo-token', requireAuth, (req: AuthRequest, res: Response) => {
  const { token } = req.body;
  if (!token || typeof token !== 'string' || !Expo.isExpoPushToken(token)) {
    return res.status(400).json({ error: 'Invalid Expo push token' });
  }
  try {
    db.prepare(
      'INSERT OR IGNORE INTO expo_push_tokens (user_id, token) VALUES (?, ?)'
    ).run(req.userId, token);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to store token' });
  }
});

// DELETE /api/push/expo-token
router.delete('/expo-token', requireAuth, (req: AuthRequest, res: Response) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token required' });
  db.prepare('DELETE FROM expo_push_tokens WHERE user_id = ? AND token = ?').run(req.userId, token);
  res.json({ ok: true });
});
```

- [ ] **Step 4: Add Expo push sending to `server/src/services/notifications.ts`**

Read the file, then add a new function `sendExpoNotifications` and call it alongside the existing web-push send:

```typescript
import Expo, { ExpoPushMessage } from 'expo-server-sdk';

const expoClient = new Expo();

async function sendExpoNotifications(
  ticker: string,
  xdDate: string,
  cashPerShare: number,
  daysUntil: number
): Promise<void> {
  // Find all users watching this ticker who have expo push tokens
  const rows = db.prepare(`
    SELECT ept.token
    FROM expo_push_tokens ept
    JOIN watchlist w ON w.user_id = ept.user_id
    WHERE w.ticker = ?
  `).all(ticker) as { token: string }[];

  const validTokens = rows.map(r => r.token).filter(t => Expo.isExpoPushToken(t));
  if (validTokens.length === 0) return;

  const messages: ExpoPushMessage[] = validTokens.map(to => ({
    to,
    sound: 'default',
    title: `${ticker} XD in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
    body: `฿${cashPerShare.toFixed(2)}/share · Pay date: ${xdDate}`,
    data: { ticker, xdDate, cashPerShare },
  }));

  const chunks = expoClient.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    const tickets = await expoClient.sendPushNotificationsAsync(chunk);
    // Prune DeviceNotRegistered tokens
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
        db.prepare('DELETE FROM expo_push_tokens WHERE token = ?').run(validTokens[i]);
      }
    }
  }
}
```

Then in the existing notification cron loop, call `sendExpoNotifications(ticker, xdDate, cashPerShare, daysUntil)` alongside the existing web-push send.

- [ ] **Step 5: Mount new route in `server/src/app.ts`**

Verify the push router is already mounted. The new `/expo-token` routes are on the same `push` router, so no additional mount needed.

- [ ] **Step 6: Restart server and test new endpoint**

```bash
npm run dev:server &
# Get a JWT first
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"testpass123"}' | jq -r .token)

# POST a fake expo token
curl -X POST http://localhost:3000/api/push/expo-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"token":"ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"}'
```

Expected: `{"ok":true}`

- [ ] **Step 7: Commit (main repo)**

```bash
cd /Users/means/repository/th-div-calendar
git add package.json package-lock.json server/src/db/schema.ts server/src/routes/push.ts server/src/services/notifications.ts
git commit -m "feat: expo push token route + server-side Expo push send"
```

---

## Task 15: usePortfolio Query

**Files (submodule):**
- Create: `mobile/queries/usePortfolio.ts`

- [ ] **Step 1: Create `mobile/queries/usePortfolio.ts`**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPortfolio, addHolding, removeHolding, ApiError } from '../services/api';
import { openDb, upsertPortfolio, getPortfolio as dbGetPortfolio, PortfolioRow } from '../services/db';
import { useAuth } from '../hooks/useAuth';

export interface PortfolioHolding extends PortfolioRow {}

export function usePortfolio() {
  const { userId } = useAuth();

  return useQuery<PortfolioHolding[], Error>({
    queryKey: ['portfolio', userId],
    enabled: !!userId,
    queryFn: async () => {
      const db = await openDb();
      try {
        const data = await getPortfolio();
        await upsertPortfolio(db, userId!, data);
        return data.map(d => ({ ticker: d.ticker, quantity: d.quantity, user_id: userId!, synced_at: new Date().toISOString() }));
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) throw e;
        return dbGetPortfolio(db, userId!);
      }
    },
  });
}

export function useAddHolding() {
  const qc = useQueryClient();
  const { userId } = useAuth();
  return useMutation({
    mutationFn: ({ ticker, quantity }: { ticker: string; quantity: number }) =>
      addHolding(ticker, quantity),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portfolio', userId] }),
  });
}

export function useRemoveHolding() {
  const qc = useQueryClient();
  const { userId } = useAuth();
  return useMutation({
    mutationFn: (ticker: string) => removeHolding(ticker),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portfolio', userId] }),
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add queries/usePortfolio.ts
git commit -m "feat: usePortfolio query with SQLite offline fallback"
git push origin master
```

---

## Task 16: Portfolio Screen + ErrorToast

**Files:**
- Create: `mobile/components/ErrorToast.tsx`
- Create: `mobile/components/HoldingCard.tsx`
- Modify: `mobile/app/(tabs)/portfolio.tsx` (replace placeholder)

- [ ] **Step 1: Create `mobile/components/ErrorToast.tsx`**

```tsx
import { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface ErrorToastProps {
  message: string;
  visible: boolean;
}

export function ErrorToast({ message, visible }: ErrorToastProps) {
  const { C, accent, radius } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.delay(2500),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, message]);

  return (
    <Animated.View style={[styles.toast, { opacity, backgroundColor: C.surface, borderColor: C.divider }]}>
      <Text style={[styles.text, { color: accent.xd }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: { position: 'absolute', bottom: 80, alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  text: { fontSize: 13, fontWeight: '600' },
});
```

- [ ] **Step 2: Create `mobile/components/HoldingCard.tsx`**

```tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { PortfolioHolding } from '../queries/usePortfolio';

interface HoldingCardProps {
  holding: PortfolioHolding;
  projectedIncome?: number;
  onRemove: (ticker: string) => void;
}

export function HoldingCard({ holding, projectedIncome, onRemove }: HoldingCardProps) {
  const { C, accent, radius, font } = useTheme();

  const s = StyleSheet.create({
    card: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: radius.card, marginHorizontal: 16, marginBottom: 8, padding: 12, alignItems: 'center', minWidth: 0 },
    tile: { width: 42, height: 42, borderRadius: radius.sm, backgroundColor: accent.todayAlpha8, borderWidth: 1, borderColor: accent.todayAlpha20, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    tileText: { fontSize: 10, fontWeight: '700', color: accent.today },
    col: { flex: 1, minWidth: 0 },
    ticker: { fontSize: font.cardTitle, fontWeight: '700', color: C.text },
    qty: { fontSize: font.caption, color: C.muted, marginTop: 1 },
    income: { fontSize: font.caption, color: accent.pay, fontWeight: '600' },
    removeBtn: { paddingHorizontal: 8, paddingVertical: 4 },
    removeBtnText: { fontSize: font.caption, color: accent.xd, fontWeight: '600' },
  });

  return (
    <View style={s.card}>
      <View style={s.tile}>
        <Text style={s.tileText} numberOfLines={1}>{holding.ticker.slice(0, 4)}</Text>
      </View>
      <View style={s.col}>
        <Text style={s.ticker} numberOfLines={1}>{holding.ticker}</Text>
        <Text style={s.qty}>{holding.quantity.toLocaleString()} shares</Text>
        {projectedIncome != null && (
          <Text style={s.income}>฿{projectedIncome.toFixed(2)} projected</Text>
        )}
      </View>
      <TouchableOpacity style={s.removeBtn} onPress={() => onRemove(holding.ticker)} activeOpacity={0.7}>
        <Text style={s.removeBtnText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );
}
```

- [ ] **Step 3: Replace `mobile/app/(tabs)/portfolio.tsx` with full portfolio screen**

```tsx
import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { usePortfolio, useAddHolding, useRemoveHolding } from '../../queries/usePortfolio';
import { useDividends } from '../../queries/useDividends';
import { HoldingCard } from '../../components/HoldingCard';
import { OfflineBadge } from '../../components/OfflineBadge';
import { ErrorToast } from '../../components/ErrorToast';

export default function PortfolioScreen() {
  const { C, accent, radius, font } = useTheme();
  const { isOnline } = useNetworkStatus();
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const now = new Date();
  const { data: holdings = [], isPending } = usePortfolio();
  const { data: dividends = [] } = useDividends(now.getMonth() + 1, now.getFullYear());
  const addHolding = useAddHolding();
  const removeHolding = useRemoveHolding();

  function showToast(msg: string) {
    setToastMsg(msg);
    setToastVisible(false);
    setTimeout(() => setToastVisible(true), 10);
  }

  function handleAdd() {
    if (!isOnline) { showToast('No connection. Cannot add holding.'); return; }
    const sym = ticker.trim().toUpperCase();
    const qty = parseInt(quantity, 10);
    if (!sym || isNaN(qty) || qty <= 0) { showToast('Enter a valid ticker and quantity.'); return; }
    addHolding.mutate({ ticker: sym, quantity: qty });
    setTicker('');
    setQuantity('');
  }

  function handleRemove(sym: string) {
    if (!isOnline) { showToast('No connection. Cannot remove holding.'); return; }
    removeHolding.mutate(sym);
  }

  function projectedIncome(sym: string, qty: number): number {
    const divRow = dividends.find(d => d.ticker === sym);
    if (!divRow?.cash_per_share) return 0;
    return divRow.cash_per_share * qty;
  }

  const totalIncome = holdings.reduce((sum, h) => sum + projectedIncome(h.ticker, h.quantity), 0);

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
    title: { fontSize: font.display, fontWeight: '700', color: C.text, letterSpacing: -0.6 },
    summaryCard: { marginHorizontal: 16, marginBottom: 16, backgroundColor: C.surface, borderRadius: radius.card, padding: 14, borderWidth: 1, borderColor: C.divider },
    summaryLabel: { fontSize: font.eyebrow, fontWeight: '600', color: C.muted, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 },
    summaryValue: { fontSize: font.display, fontWeight: '700', color: accent.pay },
    addRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, gap: 8 },
    input: { flex: 2, backgroundColor: C.surface, borderWidth: 1, borderColor: C.divider, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: font.body, color: C.text },
    qtyInput: { flex: 1 },
    addBtn: { backgroundColor: accent.today, borderRadius: radius.md, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
    addBtnText: { color: '#fff', fontWeight: '700', fontSize: font.body },
    empty: { alignItems: 'center', paddingTop: 40, color: C.muted },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Portfolio</Text>
      </View>
      {!isOnline && holdings.length > 0 && <OfflineBadge />}
      <View style={s.summaryCard}>
        <Text style={s.summaryLabel}>Projected income this month</Text>
        <Text style={s.summaryValue}>฿{totalIncome.toFixed(2)}</Text>
      </View>
      <View style={s.addRow}>
        <TextInput style={s.input} value={ticker} onChangeText={setTicker} placeholder="Ticker" placeholderTextColor={C.muted} autoCapitalize="characters" />
        <TextInput style={[s.input, s.qtyInput]} value={quantity} onChangeText={setQuantity} placeholder="Qty" placeholderTextColor={C.muted} keyboardType="numeric" />
        <TouchableOpacity style={s.addBtn} onPress={handleAdd} activeOpacity={0.8}>
          <Text style={s.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>
      {isPending ? (
        <ActivityIndicator color={accent.today} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView>
          {holdings.length === 0 && (
            <Text style={{ color: C.muted, textAlign: 'center', marginTop: 40 }}>No holdings yet.</Text>
          )}
          {holdings.map(h => (
            <HoldingCard
              key={h.ticker}
              holding={h}
              projectedIncome={projectedIncome(h.ticker, h.quantity)}
              onRemove={handleRemove}
            />
          ))}
        </ScrollView>
      )}
      <ErrorToast message={toastMsg} visible={toastVisible} />
    </View>
  );
}
```

- [ ] **Step 4: Test in Expo Go**

Verify: holdings list renders, add holding works, remove works, income projected, offline shows toast.

- [ ] **Step 5: Commit**

```bash
git add components/ErrorToast.tsx components/HoldingCard.tsx app/\(tabs\)/portfolio.tsx
git commit -m "feat: portfolio screen + income summary + offline toast"
git push origin master
```

---

## Task 17: useWatchlist Query

**Files:**
- Create: `mobile/queries/useWatchlist.ts`

- [ ] **Step 1: Create `mobile/queries/useWatchlist.ts`**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWatchlist, addToWatchlist, removeFromWatchlist, ApiError } from '../services/api';
import { openDb, upsertWatchlist, getWatchlist as dbGetWatchlist, WatchlistRow } from '../services/db';
import { useAuth } from '../hooks/useAuth';

export function useWatchlist() {
  const { userId } = useAuth();

  return useQuery<WatchlistRow[], Error>({
    queryKey: ['watchlist', userId],
    enabled: !!userId,
    queryFn: async () => {
      const db = await openDb();
      try {
        const data = await getWatchlist();
        await upsertWatchlist(db, userId!, data.map(d => d.ticker));
        return data.map(d => ({ ticker: d.ticker, user_id: userId!, synced_at: new Date().toISOString() }));
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) throw e;
        return dbGetWatchlist(db, userId!);
      }
    },
  });
}

export function useAddToWatchlist() {
  const qc = useQueryClient();
  const { userId } = useAuth();
  return useMutation({
    mutationFn: (ticker: string) => addToWatchlist(ticker),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlist', userId] }),
  });
}

export function useRemoveFromWatchlist() {
  const qc = useQueryClient();
  const { userId } = useAuth();
  return useMutation({
    mutationFn: (ticker: string) => removeFromWatchlist(ticker),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlist', userId] }),
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add queries/useWatchlist.ts
git commit -m "feat: useWatchlist query with SQLite offline fallback"
git push origin master
```

---

## Task 18: usePushToken + Expo Notifications Registration

**Files:**
- Create: `mobile/queries/usePushToken.ts`

- [ ] **Step 1: Create `mobile/queries/usePushToken.ts`**

```typescript
import { useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { registerExpoPushToken, unregisterExpoPushToken } from '../services/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }),
});

export function usePushToken() {
  const [token, setToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>('undetermined');

  async function requestAndRegister(): Promise<void> {
    if (!Device.isDevice) throw new Error('Push only works on physical device');

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    setPermissionStatus(finalStatus);
    if (finalStatus !== 'granted') return;

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const pushToken = tokenData.data;
    await registerExpoPushToken(pushToken);
    setToken(pushToken);
  }

  async function unregister(): Promise<void> {
    if (!token) return;
    await unregisterExpoPushToken(token);
    setToken(null);
    setPermissionStatus('undetermined');
  }

  return { token, permissionStatus, requestAndRegister, unregister };
}
```

- [ ] **Step 2: Install expo-device (needed for `Device.isDevice`)**

```bash
npx expo install expo-device
```

- [ ] **Step 3: Commit**

```bash
git add queries/usePushToken.ts
git commit -m "feat: usePushToken hook for Expo Notifications registration"
git push origin master
```

---

## Task 19: Profile Screen

**Files:**
- Modify: `mobile/app/(tabs)/profile.tsx` (replace placeholder)

- [ ] **Step 1: Create `mobile/components/TickerCard.tsx`**

```tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface TickerCardProps {
  ticker: string;
  onRemove: (ticker: string) => void;
}

export function TickerCard({ ticker, onRemove }: TickerCardProps) {
  const { C, accent, radius, font } = useTheme();

  const s = StyleSheet.create({
    card: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: radius.card, marginHorizontal: 16, marginBottom: 8, padding: 12, alignItems: 'center' },
    tile: { width: 42, height: 42, borderRadius: radius.sm, backgroundColor: accent.payAlpha8, borderWidth: 1, borderColor: accent.payAlpha20, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    tileText: { fontSize: 10, fontWeight: '700', color: accent.pay },
    label: { flex: 1, fontSize: font.cardTitle, fontWeight: '700', color: C.text },
    removeBtn: { paddingHorizontal: 8, paddingVertical: 4 },
    removeBtnText: { fontSize: font.caption, color: accent.xd, fontWeight: '600' },
  });

  return (
    <View style={s.card}>
      <View style={s.tile}><Text style={s.tileText}>{ticker.slice(0, 4)}</Text></View>
      <Text style={s.label}>{ticker}</Text>
      <TouchableOpacity style={s.removeBtn} onPress={() => onRemove(ticker)} activeOpacity={0.7}>
        <Text style={s.removeBtnText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );
}
```

- [ ] **Step 2: Replace `mobile/app/(tabs)/profile.tsx` with full profile screen**

```tsx
import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Switch, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useAuth } from '../../hooks/useAuth';
import { useWatchlist, useAddToWatchlist, useRemoveFromWatchlist } from '../../queries/useWatchlist';
import { usePushToken } from '../../queries/usePushToken';
import { TickerCard } from '../../components/TickerCard';
import { ErrorToast } from '../../components/ErrorToast';
import { openDb, clearUserData } from '../../services/db';

export default function ProfileScreen() {
  const { C, accent, radius, font } = useTheme();
  const { isOnline } = useNetworkStatus();
  const { signOut, userId } = useAuth();
  const router = useRouter();
  const [ticker, setTicker] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const { data: watchlist = [], isPending } = useWatchlist();
  const addToWatchlist = useAddToWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();
  const { token: pushToken, permissionStatus, requestAndRegister, unregister } = usePushToken();

  function showToast(msg: string) {
    setToastMsg(msg);
    setToastVisible(false);
    setTimeout(() => setToastVisible(true), 10);
  }

  function handleAddWatch() {
    if (!isOnline) { showToast('No connection. Cannot update watchlist.'); return; }
    const sym = ticker.trim().toUpperCase();
    if (!sym) return;
    addToWatchlist.mutate(sym);
    setTicker('');
  }

  function handleRemoveWatch(sym: string) {
    if (!isOnline) { showToast('No connection. Cannot update watchlist.'); return; }
    removeFromWatchlist.mutate(sym);
  }

  async function handleLogout() {
    const db = await openDb();
    if (userId) await clearUserData(db, userId);
    await signOut();
    router.replace('/(auth)/login');
  }

  async function handlePushToggle(value: boolean) {
    if (!isOnline) { showToast('No connection.'); return; }
    if (value) {
      try { await requestAndRegister(); }
      catch (e: any) { showToast(e.message ?? 'Could not enable notifications.'); }
    } else {
      await unregister();
    }
  }

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
    title: { fontSize: font.display, fontWeight: '700', color: C.text, letterSpacing: -0.6 },
    sectionTitle: { fontSize: font.eyebrow, fontWeight: '600', color: C.muted, letterSpacing: 1.2, textTransform: 'uppercase', paddingHorizontal: 20, marginBottom: 8, marginTop: 16 },
    addRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, gap: 8 },
    input: { flex: 1, backgroundColor: C.surface, borderWidth: 1, borderColor: C.divider, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: font.body, color: C.text },
    addBtn: { backgroundColor: accent.today, borderRadius: radius.md, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
    addBtnText: { color: '#fff', fontWeight: '700', fontSize: font.body },
    settingsCard: { marginHorizontal: 16, marginBottom: 8, backgroundColor: C.surface, borderRadius: radius.card, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    settingsLabel: { fontSize: font.body, color: C.text, fontWeight: '500' },
    logoutBtn: { marginHorizontal: 16, marginTop: 24, marginBottom: 16, backgroundColor: C.surface, borderRadius: radius.card, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: accent.xdAlpha20 },
    logoutText: { fontSize: font.body, fontWeight: '700', color: accent.xd },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Profile</Text>
      </View>
      <ScrollView>
        <Text style={s.sectionTitle}>Notifications</Text>
        <View style={s.settingsCard}>
          <Text style={s.settingsLabel}>XD alerts</Text>
          <Switch
            value={!!pushToken}
            onValueChange={handlePushToggle}
            trackColor={{ true: accent.today }}
            thumbColor="#fff"
          />
        </View>
        {permissionStatus === 'denied' && (
          <Text style={{ color: accent.xd, paddingHorizontal: 20, fontSize: 11, marginBottom: 8 }}>
            Permission denied. Enable in device settings.
          </Text>
        )}

        <Text style={s.sectionTitle}>Watchlist</Text>
        <View style={s.addRow}>
          <TextInput style={s.input} value={ticker} onChangeText={setTicker} placeholder="Add ticker" placeholderTextColor={C.muted} autoCapitalize="characters" />
          <TouchableOpacity style={s.addBtn} onPress={handleAddWatch} activeOpacity={0.8}>
            <Text style={s.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
        {isPending ? (
          <ActivityIndicator color={accent.today} style={{ marginTop: 16 }} />
        ) : (
          watchlist.map(w => (
            <TickerCard key={w.ticker} ticker={w.ticker} onRemove={handleRemoveWatch} />
          ))
        )}
        {watchlist.length === 0 && !isPending && (
          <Text style={{ color: C.muted, textAlign: 'center', marginTop: 16 }}>No tickers watched.</Text>
        )}

        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={s.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
      <ErrorToast message={toastMsg} visible={toastVisible} />
    </View>
  );
}
```

- [ ] **Step 3: Test in Expo Go**

Verify: watchlist add/remove works, push toggle triggers permission prompt (physical device only), logout clears SQLite + redirects to login.

- [ ] **Step 4: Commit**

```bash
git add components/TickerCard.tsx app/\(tabs\)/profile.tsx
git commit -m "feat: profile screen — watchlist + push toggle + logout"
git push origin master
```

---

## Task 20: eas.json Config + ROADMAP Update

**Files:**
- Create: `mobile/eas.json`
- Modify: main repo `ROADMAP.md`

- [ ] **Step 1: Create `mobile/eas.json`**

```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true },
      "android": { "buildType": "apk" }
    },
    "preview": {
      "distribution": "internal",
      "ios": { "simulator": false },
      "android": { "buildType": "apk" }
    },
    "production": {
      "ios": { "simulator": false },
      "android": { "buildType": "app-bundle" }
    }
  },
  "submit": {
    "production": {}
  }
}
```

- [ ] **Step 2: Initialize EAS project (requires Expo account)**

```bash
npx eas-cli login
npx eas build:configure
```

This generates a `projectId` in `app.json` under `extra.eas`. Copy it and replace `FILL_IN_AFTER_EAS_INIT` in `app.json`.

- [ ] **Step 3: Update ROADMAP.md in main repo**

In `/Users/means/repository/th-div-calendar/ROADMAP.md`, add a new Phase 3 section after the Phase 2F section:

```markdown
### 🔲 Phase 3 — Expo Mobile App (iOS + Android)

Submodule: `mobile/` → `https://github.com/amajakai14/th-div-mobile`

**Tech:** Expo SDK 52, Expo Router v4, NativeWind v5, React Query v5, expo-sqlite v13, expo-notifications

**Sub-phases:**
| # | Scope | Deliverable |
|---|-------|-------------|
| 3A | Repo + scaffold | Submodule wired, Expo init, NativeWind + design tokens |
| 3B | Data layer | expo-sqlite offline cache, API service, auth guard |
| 3C | Auth screens | Login + Register |
| 3D | Calendar | Month grid, DayCell, ticker modal |
| 3E | Portfolio | Holdings CRUD, income summary |
| 3F | Server push | expo_push_tokens table, /api/push/expo-token route |
| 3G | Profile | Watchlist, push notification toggle, logout |
| 3H | EAS build | eas.json, provisioning (requires Apple/Google accounts) |

### Phase 3 QA (run after 3G done)
- [ ] App loads, SplashScreen hides after SecureStore check
- [ ] Login → calendar visible with XD/pay dots
- [ ] Register → new account created, navigates to calendar
- [ ] Calendar month nav fetches correct month data
- [ ] Offline: calendar shows cached data + OfflineBadge
- [ ] Tap XD dot → ticker modal slides up with correct data
- [ ] Portfolio: add holding → appears in list + income updates
- [ ] Portfolio: remove holding → disappears
- [ ] Portfolio offline: add/remove shows toast
- [ ] Profile: add/remove watchlist ticker
- [ ] Profile: push toggle triggers permission (physical device)
- [ ] Profile: sign out → login screen, SQLite user data cleared
```

- [ ] **Step 4: Commit ROADMAP in main repo**

```bash
cd /Users/means/repository/th-div-calendar
git add ROADMAP.md
git commit -m "docs: add Phase 3 Expo mobile app roadmap + QA checklist"
```

- [ ] **Step 5: Commit eas.json in submodule**

```bash
cd mobile
git add eas.json app.json
git commit -m "feat: EAS build config (accounts pending)"
git push origin master
```

- [ ] **Step 6: Update submodule pointer in main repo**

```bash
cd /Users/means/repository/th-div-calendar
git add mobile
git commit -m "chore: update mobile submodule pointer"
```

---

## Self-Review

### Spec coverage check

| Requirement | Task |
|-------------|------|
| iOS + Android targets | Task 2 (app.json), Task 20 (eas.json) |
| Connect to server API | Task 5 (api.ts) |
| SQLite offline cache, WAL, transactions | Task 4 (db.ts) |
| user_id isolation in SQLite | Task 4 (db.ts) |
| SplashScreen hold + undefined sentinel | Task 6 (_layout.tsx) |
| Auth guard Expo Router v4 pattern | Task 6 (NavigationGuard) |
| Login screen | Task 7 |
| Register screen | Task 8 |
| Tab bar (3 tabs, design tokens) | Task 9 |
| Calendar month grid + XD/pay dots | Tasks 11–12 |
| Month navigation | Task 12 (index.tsx) |
| Ticker detail modal (presentation: modal, [ticker].tsx) | Task 13 |
| Portfolio CRUD | Tasks 15–16 |
| Income summary (qty × cash_per_share) | Task 16 |
| Offline write block → toast | Task 16, 19 |
| OfflineBadge (stale data indicator) | Task 12, 16 |
| Server expo_push_tokens table | Task 14 |
| Server /api/push/expo-token route | Task 14 |
| Server Expo push send (expo-server-sdk) | Task 14 |
| Push toggle on Profile tab (post-login) | Task 19 |
| Watchlist CRUD | Tasks 17, 19 |
| Logout → clear SQLite + redirect | Task 19 |
| ROADMAP.md updated | Task 20 |
| NativeWind v5 + design tokens in tailwind.config.js | Task 3 |
| Git submodule at mobile/ | Task 1 |
| EAS config | Task 20 |

All requirements covered. No gaps found.

### Type consistency check

- `DividendRow` defined in `db.ts` (Task 4), used in `useDividends.ts` (Task 10), `CalendarGrid` (Task 11), `DayCell` (Task 11), `index.tsx` (Task 12), `[ticker].tsx` (Task 13) ✓
- `PortfolioRow` / `PortfolioHolding` defined in `db.ts` (Task 4) and `usePortfolio.ts` (Task 15), used in `HoldingCard` (Task 16) ✓
- `WatchlistRow` defined in `db.ts` (Task 4), used in `useWatchlist.ts` (Task 17), `profile.tsx` (Task 19) ✓
- `ApiError` defined in `api.ts` (Task 5), imported in `_layout.tsx` (Task 6), `login.tsx` (Task 7), `register.tsx` (Task 8), `usePortfolio.ts` (Task 15), `useWatchlist.ts` (Task 17) ✓
- `useAuth` returns `{ token, userId, signIn, signOut }` — `signIn`/`signOut` match login/register usage in Tasks 7–8; `userId` used in Tasks 15, 17, 19 ✓
- `groupByDate` defined in `useDividends.ts` (Task 10), imported in `index.tsx` (Task 12) ✓
- `clearUserData(db, userId)` defined in `db.ts` (Task 4), used in `profile.tsx` (Task 19) ✓
