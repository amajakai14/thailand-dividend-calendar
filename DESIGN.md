# Dividend Pay Calendar — Design System

This file is the **single source of truth** for colors, typography, spacing, and component patterns used across the Dividend Pay Calendar app. When you change tokens here, mirror the change in `app.jsx` (`colors()` + `PALETTES`) and `Dividend Calendar.html` (root background, fonts).

---

## 1. Brand & Tone

A calm, paper-like financial utility for Thai retail investors. Warm neutral background (not stark white), muted ink text, two **functional accent colors** that carry the entire information hierarchy: **red = ex-dividend (XD)**, **green = payment**.

- Density: comfortable, not cramped — calendar cells should breathe
- Voice: factual, short labels (`XD`, `Pay`, `฿1.50/sh`)
- No decorative gradients, no glassmorphism in the calendar surface
- Currency always displayed with `฿` prefix, 2 decimals, tabular numerals

---

## 2. Color Tokens

### 2.1 Light theme (default)

| Token        | Hex       | Usage                                             |
| ------------ | --------- | ------------------------------------------------- |
| `bg`         | `#F6F4EE` | App background — warm off-white                   |
| `surface`    | `#FFFFFF` | Cards, sheet, tab bar, header buttons             |
| `surface2`   | `#F0EDE6` | Subtle inset surfaces (tab track, ticker tile bg) |
| `text`       | `#15181D` | Primary type                                      |
| `muted`      | `#8A8478` | Secondary type, captions                          |
| `outMonth`   | `#C9C3B5` | Out-of-month calendar dates                       |
| `weekend`    | `#B65A7B` | Sat/Sun column tint (subtle)                      |
| `divider`    | `#E7E2D6` | 1px borders                                       |
| `selectedBg` | `#EBE6D8` | Selected calendar cell background                 |

### 2.2 Dark theme

| Token        | Hex       |
| ------------ | --------- |
| `bg`         | `#0E1116` |
| `surface`    | `#171B22` |
| `surface2`   | `#1F2530` |
| `text`       | `#ECEFF4` |
| `muted`      | `#8893A4` |
| `outMonth`   | `#3A4250` |
| `weekend`    | `#A4537A` |
| `divider`    | `#262C36` |
| `selectedBg` | `#222A36` |

### 2.3 Functional accents (palettes)

The accent palette is selectable via Tweaks. **Never invent new accent values** — extend `PALETTES` in `app.jsx`.

| Palette   | XD (red)  | Pay (green) | Today (blue) |
| --------- | --------- | ----------- | ------------ |
| `default` | `#E25241` | `#1F9D6B`   | `#2D6CDF`    |
| `bold`    | `#FF6B3D` | `#0FB37A`   | `#5B5BF7`    |
| `mono`    | `#1A1A1A` | `#7A7A7A`   | `#000000`    |

**Semantic rules:**

- `xd` is **only** used for ex-dividend events. Never repurpose for errors/destructive actions.
- `pay` is **only** used for payment events and yield figures.
- `today` doubles as the brand/interactive accent (watchlist star, active tab icon, focused link).
- Tinted backgrounds use `${color}14` (~8% alpha) and `${color}33` (~20%) for borders.

---

## 3. Typography

- Font stack: `'Inter', -apple-system, "SF Pro Text", system-ui, sans-serif`
- Display font (month label, sheet date, modal ticker): `"SF Pro Display", -apple-system, system-ui`
- Numerals: always `font-variant-numeric: tabular-nums` for prices, dates, counts

| Role               | Size      | Weight | Letter-spacing  |
| ------------------ | --------- | ------ | --------------- |
| Eyebrow / overline | 11        | 600    | 1.2 / uppercase |
| Caption / muted    | 10.5–11.5 | 600    | 0               |
| Body               | 13        | 500    | 0               |
| Card title         | 15        | 700    | 0.2             |
| Section title      | 18        | 700    | -0.3            |
| Display (month)    | 26        | 700    | -0.6            |
| Hero figure (DPS)  | 26        | 700    | 0               |

---

## 4. Spacing & Radius

- Base unit: **4px**. Use 4 / 6 / 8 / 10 / 12 / 14 / 16 / 20 / 24.
- Screen padding: `var(--screen-pad)` = `clamp(12px, 4.5vw, 20px)` — shrinks below 375px so the calendar grid still breathes at 300–360px
- Card padding: `10px 12px` (compact mobile) up to `12px 14px` at the design ceiling
- Sheet padding: `0 var(--screen-pad)` — uses the same shrink scale
- Outer shell padding (between viewport edge and the app card): `var(--outer-pad)` = `clamp(6px, 2.4vw, 14px)`, combined with `env(safe-area-inset-*)`. The body owns this padding; the app renders as a rounded card on top of `--shell-bg` (`#EAE4D3`)

| Radius | Where                                            |
| ------ | ------------------------------------------------ |
| 8      | Tab buttons, key tiles                           |
| 10     | Inset tracks (segmented), inputs                 |
| 12     | Calendar cells, modal buttons, timeline, list cards |
| 14     | Cards, modal hero panel                          |
| 16–22  | App card shell (`clamp(16px, 4vw, 22px)`)        |
| 24     | Bottom sheet, modal top corners                  |
| 999    | Pills, segmented toggles, dots, handles          |

### 4.1 Responsive scale (300–414px target band)

The app is laid out as a **single phone-shaped card** centered in the viewport. Internal paddings and font sizes are `clamp()`-driven so the same JSX renders comfortably from 300px (smallest folded display) up to 430px (the design ceiling).

| Token / spot      | Value                              | Min @ 300px | Max @ ≥430px |
| ----------------- | ---------------------------------- | ----------- | ------------ |
| `--outer-pad`     | `clamp(6px, 2.4vw, 14px)`          | 7.2px       | 14px         |
| `--screen-pad`    | `clamp(12px, 4.5vw, 20px)`         | 13.5px      | 20px         |
| `--card-pad-h`    | `clamp(10px, 3.8vw, 16px)`         | 11.4px      | 16px         |
| Calendar h-pad    | `clamp(8px, 2.5vw, 16px)`          | 8px         | 16px         |
| Date circle       | `clamp(22px, 7vw, 28px)`           | 22px        | 28px         |
| Date number       | `clamp(12.5px, 3.8vw, 15px)`       | 12.5px      | 15px         |
| Month title       | `clamp(22px, 6.5vw, 26px)`         | 22px        | 26px         |
| Sheet date title  | `clamp(15px, 4.5vw, 18px)`         | 15px        | 18px         |
| App card radius   | `clamp(16px, 4vw, 22px)`           | 16px        | 22px         |
| DOW header text   | `clamp(9px, 2.6vw, 10.5px)`        | 9px         | 10.5px       |

The CSS variables live in `client/index.html` (`:root` block) and are consumed via `var(--screen-pad)` / `var(--outer-pad)` inside JSX style props. Never re-hardcode `20px` horizontal padding inside components — read the variable so the whole app scales together.

---

## 5. Components

### 5.1 Calendar cell

- Aspect ratio `1 / 1.18`, transparent background; selected → `selectedBg`
- Date number in a `clamp(22px, 7vw, 28px)` circle (28 at design ceiling, 22 at 300px). Today → filled with `today` color, white text.
- Grid gap `1px`; cell padding scales with `--screen-pad`.
- Event markers below: 6px round dots (`xd`, `pay`); when count > 1 the dot widens to `14×6` with white count.
- Out-of-month dates use `outMonth`.

### 5.2 Bottom sheet

- Two anchors: peek `330px`, expanded `660px`.
- Drag handle: `40×5` rounded pill on `divider`.
- Tabs: `surface2` track with `surface` thumb + `0 1px 2px rgba(20,18,12,0.06)` shadow.
- Always sits **above** the tab bar (`bottomOffset = 64`).

### 5.3 Stock card

- Left tile `42×42` (mobile-tight); tinted with the active accent (`xd` or `pay`) at 8% bg / 20% border.
- Padding `10px 12px`, gap `10px`, `min-width: 0` on the inner column so long company names truncate cleanly at 300px.
- Three-line layout: ticker + price · name + sector · DPS + yield + paired date.

### 5.4 Tab bar

- Height `64`, `surface` bg, top `1px` divider.
- Three items: Calendar / Dashboard / Profile.
- Active icon + label use `today`; inactive use `muted`.
- Icons are 22×22 stroke `1.7`, rounded line caps/joins.

### 5.5 Stock detail modal

- Slides up from bottom over a `rgba(15,12,4,0.42)` scrim.
- Hero panel uses `surface2`; yield value uses `pay` color.
- Primary action button: filled `text` on `bg`. Secondary: outlined on `surface`.

### 5.6 App shell (page card)

- The entire screen lives inside a centered card with `max-width: 430px`, `border-radius: clamp(16px, 4vw, 22px)`, `border: 1px solid divider`, and a soft drop shadow (`0 1px 2px rgba(20,18,12,0.04), 0 12px 30px rgba(20,18,12,0.07)`).
- The card always has visible breathing room from the viewport edge — the `<body>` carries `var(--outer-pad)` padding plus `env(safe-area-inset-*)`. Page bg outside the card is `--shell-bg` (`#EAE4D3`), one step warmer than the in-card `bg` (`#F6F4EE`).
- All top-level pages (Home, Login, Register, Portfolio) use this same shell. The `TabBar` and `BottomSheet` are `position: absolute` children of the card, so they pin to the card's bottom — not the viewport.
- Forms (Login, Register, Add holding, Add watchlist) use `surface` inputs with `1px divider` border, radius `10`, padding `10–11px 12px`. Field labels are 11px / 600 / uppercase / muted with `letter-spacing: 0.5`.
- Tabular data (holdings, income) is rendered as **stacked cards on mobile**, not HTML tables. Each row is a `surface` card with the same accent-tile pattern as Stock cards: 42×42 left tile in `xd`/`pay`/`today` tint + right column with min-width 0 for truncation.

---

## 6. Motion

- Sheet height transition: `280ms cubic-bezier(.32,.72,.18,1)` (disabled while dragging).
- Modal: `slideup 240ms` + scrim `fadein 180ms`.
- Buttons: `transform: scale(0.985)` on `:active`, 80ms ease.
- No bouncing, no parallax, no reveal-on-scroll — this is a utility app.

---

## 7. Iconography

- Stroked, 1.7px, rounded caps, 22×22 viewBox for tab bar; 14×14 for inline.
- Watchlist star is **filled** (it's a state indicator, not a button).
- Never use emoji.

---

## 8. Editing rules

1. Every color used in JSX **must** come from the `C` object returned by `colors(t)`. No raw hex inside components.
2. Don't add a fourth accent palette without also updating the Tweaks select in `Dividend Calendar.html`.
3. When adding a new screen, register it with `data-screen-label` on its root div.
4. Keep the warm neutral feel: avoid pure white surfaces in light mode (use `#FFFFFF` only for cards, never the page bg).
5. Horizontal padding **must** use `var(--screen-pad)` (or the matching clamp) — never a bare `20px`. Outer body padding **must** use `var(--outer-pad)` + `env(safe-area-inset-*)`.
6. Every new top-level page must wrap its content in the App shell (5.6): `flex: 1`, rounded border, drop shadow, divider border. Never let a page reach the viewport edge.
7. Never render a HTML `<table>` for data on mobile pages — convert to a vertical stack of `surface` cards with min-width 0 inner columns so long strings truncate.
