# Dev Log — Phase 1 Scraper

## Issue 1: TypeScript `lib` missing `dom`

**Problem:** `src/scraper.ts` used `document`, `HTMLElement` inside `page.evaluate()` callback. TypeScript complained these globals don't exist.

```
src/scraper.ts(36,31): error TS2584: Cannot find name 'document'.
src/scraper.ts(39,26): error TS2304: Cannot find name 'HTMLElement'.
```

**Fix:** Added `"DOM"` to `lib` array in `tsconfig.json`.

```json
"lib": ["ES2020", "DOM"]
```

**Status: ✅ Worked**

---

## Issue 2: `table` selector timeout — wrong scraping strategy

**Problem:** Scraper used `page.waitForSelector('table')` but the SET x-calendar page renders as a CSS calendar grid, not an HTML `<table>`. Timeout after 30s.

```
TimeoutError: page.waitForSelector: Timeout 30000ms exceeded.
```

**Investigation:** Took error screenshot + inspected DOM via plain JS script. Found:
- Zero `<table>` elements on page
- Calendar is div-based grid
- Inner text showed tickers per day but not full dividend details

**Fix attempted:** Switch to direct API call — discovered SET page calls:
```
GET https://www.set.or.th/api/set/stock-calendar/2026/5/x-calendar?symbols=&caTypes=&lang=th
```
Returns full structured JSON with all required fields (ISO dates, dividend amount, pay date, etc.)

**Status: ❌ Led to Issue 3**

---

## Issue 3: API returns 403 (Imperva/Incapsula WAF)

**Problem:** Direct `https.get()` to SET API returned `403` with Incapsula bot-protection HTML page. No cookies, no JS challenge solved.

```
SyntaxError: Unexpected token '<', "<html styl"... is not valid JSON
```

**Debug:** Printed response status + headers:
```
Status: 403
Headers: set-cookie: visid_incap_2046605=..., incap_ses_353_2046605=...
```

**Fix attempted 1:** Added browser-like headers (`User-Agent`, `Referer`, `Origin`, `Accept-Language`). ❌ Still 403.

**Fix that worked:** Playwright already handles Incapsula because it runs real Chromium — JS challenge solved, cookies set automatically. Instead of scraping DOM, intercept the API response that the page makes internally:

```typescript
page.on('response', async (response) => {
  if (API_PATTERN.test(response.url())) {
    apiData = await response.json();
  }
});
await page.goto(PAGE_URL, { waitUntil: 'networkidle' });
// apiData now contains the full JSON
```

**Status: ✅ Worked** — 224 XD records captured cleanly.

---

## Issue 4: TypeScript narrowing `apiData` to `never`

**Problem:** `apiData` was set inside async Playwright event callback. TypeScript can't track closure mutations for control flow, so it kept `apiData` typed as `null`. After `if (!apiData) throw`, TypeScript narrowed `null` → `never`.

```
error TS2488: Type 'never' must have a '[Symbol.iterator]()' method
```

**Fix:** Explicit cast after the null guard:

```typescript
const days = apiData as ApiDay[];
for (const day of days) { ... }
```

**Status: ✅ Worked**

---

## Final Architecture

Playwright loads the SET page → Incapsula JS challenge runs in real browser → cookies set → page JS calls internal API → Playwright response interceptor captures JSON → parse → SQLite upsert.

No DOM scraping. No Thai date parsing needed (API returns ISO dates). Playwright used purely to handle WAF, not for DOM extraction.
