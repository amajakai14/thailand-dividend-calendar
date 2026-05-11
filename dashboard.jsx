// Dashboard page: 3 stacked cards.
//  1) Portfolio donut weighted by stock quantity
//  2) Monthly dividend cash bar chart (next 12 months)
//  3) Reserved (placeholder for future widget)

const { useState: dbUseState, useMemo: dbUseMemo } = React;

// Distinct hues for slices — derived per-index so we don't depend on the accent palette.
function sliceColor(i, total) {
  const hue = (i * 360) / Math.max(1, total);
  return `oklch(0.66 0.13 ${hue.toFixed(1)})`;
}

function Dashboard({ C, t }) {
  // Join portfolio holdings with stock metadata
  const holdings = dbUseMemo(() => {
    const bySym = Object.fromEntries(STOCKS.map(s => [s.sym, s]));
    return (PORTFOLIO || [])
      .map(h => ({ ...h, stock: bySym[h.sym] }))
      .filter(h => h.stock)
      .sort((a, b) => b.qty - a.qty);
  }, []);
  const totalQty = holdings.reduce((s, h) => s + h.qty, 0);

  // Monthly dividend cash projection.
  // Each holding pays qty * amount on the stock's payment month. We project the
  // same DPS forward across the next 12 months by assuming quarterly cadence
  // for some stocks and annual for others — purely illustrative.
  const monthly = dbUseMemo(() => {
    const months = [];
    const now = TODAY;
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, date: d, total: 0 });
    }
    // For each holding, drop a payment in the stock's pay month, then again
    // 6 months later (semi-annual heuristic — Thai SET stocks commonly pay 2x/yr).
    holdings.forEach(h => {
      const payDate = parseISO(h.stock.pay);
      const cash = h.qty * h.stock.amount;
      for (let i = 0; i < 12; i++) {
        const m = months[i];
        const diff = (m.date.getFullYear() - payDate.getFullYear()) * 12 + (m.date.getMonth() - payDate.getMonth());
        if (diff >= 0 && diff % 6 === 0) m.total += cash;
      }
    });
    return months;
  }, [holdings]);

  const projTotal = monthly.reduce((s, m) => s + m.total, 0);

  return (
    <div data-screen-label="Dashboard" style={{
      width: '100%', height: '100%', background: C.bg, color: C.text,
      fontFamily: '-apple-system, "SF Pro Text", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '50px 20px 8px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.2, color: C.muted, textTransform: 'uppercase' }}>
          Dashboard
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.6, marginTop: 2, fontFamily: '"SF Pro Display", -apple-system, system-ui' }}>
          Portfolio
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 16px 84px' }}>
        <PortfolioDonut C={C} holdings={holdings} totalQty={totalQty} />
        <MonthlyCashChart C={C} months={monthly} projTotal={projTotal} />
        <NotificationsSection C={C} />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Section 1: Donut weighted by quantity
// ──────────────────────────────────────────────────────────────────────────────

function PortfolioDonut({ C, holdings, totalQty }) {
  const [hover, setHover] = dbUseState(null);
  const size = 196, stroke = 26;
  const r = (size - stroke) / 2;
  const cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;

  // Pre-compute arcs
  let offset = 0;
  const arcs = holdings.map((h, i) => {
    const pct = h.qty / totalQty;
    const len = pct * circ;
    const arc = { sym: h.sym, qty: h.qty, pct, len, offset, color: sliceColor(i, holdings.length) };
    offset += len;
    return arc;
  });

  const focused = hover != null ? arcs[hover] : null;
  const focusedHolding = hover != null ? holdings[hover] : null;

  return (
    <div style={{
      background: C.surface, borderRadius: 18, border: `1px solid ${C.divider}`,
      padding: 16, marginBottom: 12,
    }}>
      <SectionHeader title="Current Portfolio" sub={`${holdings.length} positions · ${totalQty.toLocaleString()} sh`} C={C} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 14 }}>
        {/* Donut */}
        <div style={{ position: 'relative', flexShrink: 0, width: size, height: size }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            {/* track */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.surface2} strokeWidth={stroke} />
            {arcs.map((a, i) => (
              <circle
                key={a.sym}
                cx={cx} cy={cy} r={r} fill="none"
                stroke={a.color}
                strokeWidth={hover === i ? stroke + 4 : stroke}
                strokeDasharray={`${a.len} ${circ - a.len}`}
                strokeDashoffset={-a.offset}
                style={{
                  cursor: 'pointer',
                  transition: 'stroke-width 150ms, opacity 150ms',
                  opacity: hover == null || hover === i ? 1 : 0.4,
                }}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onClick={() => setHover(hover === i ? null : i)}
              />
            ))}
          </svg>
          {/* Center label */}
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none', textAlign: 'center',
          }}>
            {focused ? (
              <>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: 0.4 }}>{focused.sym}</div>
                <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                  {(focused.pct * 100).toFixed(1)}%
                </div>
                <div style={{ fontSize: 10.5, color: C.muted, marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {focused.qty.toLocaleString()} sh
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 10.5, color: C.muted, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase' }}>Total</div>
                <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                  {totalQty.toLocaleString()}
                </div>
                <div style={{ fontSize: 10.5, color: C.muted, marginTop: 1 }}>shares</div>
              </>
            )}
          </div>
        </div>

        {/* Legend list */}
        <div style={{
          flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6,
          maxHeight: size, overflowY: 'auto', paddingRight: 4,
        }}>
          {arcs.map((a, i) => (
            <button
              key={a.sym}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onClick={() => setHover(hover === i ? null : i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                appearance: 'none', border: 0, background: hover === i ? C.surface2 : 'transparent',
                borderRadius: 8, padding: '5px 6px', cursor: 'pointer',
                color: C.text, fontFamily: 'inherit', textAlign: 'left',
                transition: 'background 120ms',
              }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: a.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.2, minWidth: 50 }}>{a.sym}</span>
              <span style={{ fontSize: 11, color: C.muted, fontVariantNumeric: 'tabular-nums', marginLeft: 'auto' }}>
                {(a.pct * 100).toFixed(1)}%
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Section 2: Monthly dividend cash
// ──────────────────────────────────────────────────────────────────────────────

function MonthlyCashChart({ C, months, projTotal }) {
  const [hover, setHover] = dbUseState(null);
  const maxV = Math.max(1, ...months.map(m => m.total));
  const chartH = 140;
  const barW = 18, gap = 6;

  const focused = hover != null ? months[hover] : null;

  return (
    <div style={{
      background: C.surface, borderRadius: 18, border: `1px solid ${C.divider}`,
      padding: 16, marginBottom: 12,
    }}>
      <SectionHeader
        title="Dividend cash by month"
        sub={`Projected 12 mo · ฿${projTotal.toLocaleString(undefined,{maximumFractionDigits:0})}`}
        C={C}
      />

      {/* Focused readout */}
      <div style={{
        marginTop: 10, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>
            {focused ? focused.date.toLocaleDateString('en-US',{month:'long',year:'numeric'}) : 'Highest month'}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
            ฿{(focused ? focused.total : maxV).toLocaleString(undefined,{maximumFractionDigits:0})}
          </div>
        </div>
        <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textAlign: 'right' }}>
          Avg ฿{Math.round(projTotal/12).toLocaleString()}/mo
        </div>
      </div>

      {/* Chart */}
      <div style={{ marginTop: 12, position: 'relative' }}>
        <svg width="100%" height={chartH + 22} viewBox={`0 0 ${months.length * (barW + gap)} ${chartH + 22}`} preserveAspectRatio="none">
          {/* baseline */}
          <line x1="0" y1={chartH} x2={months.length * (barW + gap)} y2={chartH} stroke={C.divider} strokeWidth="1" />
          {months.map((m, i) => {
            const h = (m.total / maxV) * (chartH - 6);
            const x = i * (barW + gap) + gap/2;
            const y = chartH - h;
            const isHover = hover === i;
            return (
              <g key={m.key}
                 onMouseEnter={() => setHover(i)}
                 onMouseLeave={() => setHover(null)}
                 style={{ cursor: 'pointer' }}>
                {/* hit area */}
                <rect x={x - 2} y={0} width={barW + 4} height={chartH} fill="transparent" />
                <rect
                  x={x} y={m.total === 0 ? chartH - 2 : y}
                  width={barW} height={m.total === 0 ? 2 : Math.max(2, h)}
                  rx="3"
                  fill={isHover ? C.pay : (m.total === 0 ? C.divider : C.text)}
                  opacity={hover == null || isHover ? 1 : 0.35}
                  style={{ transition: 'fill 120ms, opacity 120ms' }}
                />
                <text
                  x={x + barW/2} y={chartH + 14}
                  textAnchor="middle"
                  fontSize="9"
                  fill={isHover ? C.text : C.muted}
                  fontWeight={isHover ? 700 : 600}
                  fontFamily="inherit"
                  style={{ pointerEvents: 'none' }}
                >
                  {m.date.toLocaleDateString('en-US',{month:'short'}).slice(0,1).toUpperCase() +
                   m.date.toLocaleDateString('en-US',{month:'short'}).slice(1)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Section 3: Push notifications
// ──────────────────────────────────────────────────────────────────────────────

function NotificationsSection({ C }) {
  const [enabled, setEnabled] = dbUseState(true);
  const [toast, setToast] = dbUseState(null);
  const toastIdRef = React.useRef(0);

  const fireTest = () => {
    if (!enabled) return;
    const id = ++toastIdRef.current;
    setToast({ id, title: 'PTT · Ex-Dividend tomorrow', body: 'Buy by close today to qualify for ฿1.50/sh.' });
    setTimeout(() => {
      setToast(t => (t && t.id === id ? null : t));
    }, 3200);
  };

  return (
    <div style={{
      background: C.surface, borderRadius: 18, border: `1px solid ${C.divider}`,
      padding: 16, marginBottom: 12,
    }}>
      <SectionHeader title="Push notifications" sub={enabled ? 'On' : 'Off'} C={C} />

      {/* Enable toggle row */}
      <div style={{
        marginTop: 12, padding: '12px 14px',
        background: C.surface2, borderRadius: 12,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: enabled ? `${C.pay}1f` : C.surface,
          color: enabled ? C.pay : C.muted,
          border: `1px solid ${enabled ? `${C.pay}3a` : C.divider}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 180ms',
        }}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M5 8a5 5 0 1110 0v2.5l1.5 2.5h-13L5 10.5V8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
            <path d="M8.5 16a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>Dividend alerts</div>
          <div style={{ fontSize: 11.5, color: C.muted, marginTop: 1 }}>
            Notify on XD &amp; payment days
          </div>
        </div>
        {/* Switch */}
        <button
          onClick={() => setEnabled(v => !v)}
          aria-pressed={enabled}
          aria-label={enabled ? 'Disable notifications' : 'Enable notifications'}
          style={{
            width: 42, height: 26, borderRadius: 999,
            appearance: 'none', border: 0, padding: 2,
            background: enabled ? C.pay : C.divider,
            cursor: 'pointer', transition: 'background 180ms',
            display: 'flex', alignItems: 'center',
            justifyContent: enabled ? 'flex-end' : 'flex-start',
            fontFamily: 'inherit',
          }}>
          <span style={{
            width: 22, height: 22, borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
            transition: 'transform 180ms',
          }} />
        </button>
      </div>

      {/* Test row */}
      <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
        <button
          onClick={fireTest}
          disabled={!enabled}
          style={{
            flex: 1, appearance: 'none', fontFamily: 'inherit',
            border: `1px solid ${enabled ? C.text : C.divider}`,
            background: enabled ? C.text : C.surface2,
            color: enabled ? C.bg : C.muted,
            borderRadius: 12, padding: '11px 14px',
            fontWeight: 600, fontSize: 13,
            cursor: enabled ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 150ms',
          }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3.5 5.5a3.5 3.5 0 117 0v1.75l1.05 1.75h-9.1L3.5 7.25V5.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
            <path d="M6 11a1 1 0 002 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          Send test notification
        </button>
      </div>

      {/* In-app preview toast */}
      {toast && (
        <div style={{
          marginTop: 10, padding: '10px 12px',
          background: C.text, color: C.bg, borderRadius: 12,
          display: 'flex', alignItems: 'flex-start', gap: 10,
          animation: 'fadein 200ms ease-out',
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: 6, flexShrink: 0,
            background: C.pay, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginTop: 1,
          }}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M3.5 5.5a3.5 3.5 0 117 0v1.75l1.05 1.75h-9.1L3.5 7.25V5.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700 }}>{toast.title}</div>
            <div style={{ fontSize: 11, opacity: 0.82, marginTop: 1 }}>{toast.body}</div>
          </div>
          <span style={{ fontSize: 10, opacity: 0.6, marginTop: 1 }}>now</span>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ title, sub, C }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
      <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.2 }}>{title}</div>
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, whiteSpace: 'nowrap' }}>{sub}</div>
    </div>
  );
}

Object.assign(window, { Dashboard });
