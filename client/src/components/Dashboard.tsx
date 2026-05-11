import { useState, useMemo, useRef } from 'react';
import { Colors } from '../design/colors';
import { DividendRecord } from '../services/api';
import { usePushNotification } from '../hooks/usePushNotification';

interface Holding {
  ticker: string;
  quantity: number;
}

interface EnrichedHolding {
  ticker: string;
  quantity: number;
  div: DividendRecord;
}

interface MonthBucket {
  key: string;
  date: Date;
  total: number;
}

interface Props {
  C: Colors;
  holdings: Holding[];
  dividends: DividendRecord[];
}

function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function sliceColor(i: number, total: number): string {
  const hue = (i * 360) / Math.max(1, total);
  return `oklch(0.66 0.13 ${hue.toFixed(1)})`;
}

function SectionHeader({ title, sub, C }: { title: string; sub: string; C: Colors }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
      <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.2 }}>{title}</div>
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, whiteSpace: 'nowrap' }}>{sub}</div>
    </div>
  );
}

function PortfolioDonut({ C, holdings, totalQty }: { C: Colors; holdings: EnrichedHolding[]; totalQty: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const size = 196, stroke = 26;
  const r = (size - stroke) / 2;
  const cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;

  let offset = 0;
  const arcs = holdings.map((h, i) => {
    const pct = totalQty > 0 ? h.quantity / totalQty : 0;
    const len = pct * circ;
    const arc = { sym: h.ticker, qty: h.quantity, pct, len, offset, color: sliceColor(i, holdings.length) };
    offset += len;
    return arc;
  });

  const focused = hover != null ? arcs[hover] : null;

  return (
    <div style={{
      background: C.surface, borderRadius: 18, border: `1px solid ${C.divider}`,
      padding: 16, marginBottom: 12,
    }}>
      <SectionHeader title="Current Portfolio" sub={`${holdings.length} positions · ${totalQty.toLocaleString()} sh`} C={C} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 14 }}>
        <div style={{ position: 'relative', flexShrink: 0, width: size, height: size }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
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

function MonthlyCashChart({ C, months, projTotal }: { C: Colors; months: MonthBucket[]; projTotal: number }) {
  const [hover, setHover] = useState<number | null>(null);
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
        sub={`Projected 12 mo · ฿${projTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        C={C}
      />

      <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>
            {focused ? focused.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Highest month'}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
            ฿{(focused ? focused.total : maxV).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textAlign: 'right' }}>
          Avg ฿{Math.round(projTotal / 12).toLocaleString()}/mo
        </div>
      </div>

      <div style={{ marginTop: 12, position: 'relative' }}>
        <svg
          width="100%" height={chartH + 22}
          viewBox={`0 0 ${months.length * (barW + gap)} ${chartH + 22}`}
          preserveAspectRatio="none"
        >
          <line x1="0" y1={chartH} x2={months.length * (barW + gap)} y2={chartH} stroke={C.divider} strokeWidth="1" />
          {months.map((m, i) => {
            const h = (m.total / maxV) * (chartH - 6);
            const x = i * (barW + gap) + gap / 2;
            const y = chartH - h;
            const isHover = hover === i;
            return (
              <g key={m.key}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: 'pointer' }}>
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
                  x={x + barW / 2} y={chartH + 14}
                  textAnchor="middle" fontSize="9"
                  fill={isHover ? C.text : C.muted}
                  fontWeight={isHover ? 700 : 600}
                  fontFamily="inherit"
                  style={{ pointerEvents: 'none' }}
                >
                  {m.date.toLocaleDateString('en-US', { month: 'short' }).slice(0, 3)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function NotificationsSection({ C }: { C: Colors }) {
  const push = usePushNotification();
  const [toast, setToast] = useState<{ title: string; body: string } | null>(null);
  const toastIdRef = useRef(0);

  async function handleTest() {
    const result = await push.test();
    if (result.ok) {
      const id = ++toastIdRef.current;
      setToast({ title: 'Test notification sent', body: 'Check your device notification panel.' });
      setTimeout(() => setToast(t => (t?.title ? null : t)), 3200);
      void id;
    }
  }

  return (
    <div style={{
      background: C.surface, borderRadius: 18, border: `1px solid ${C.divider}`,
      padding: 16, marginBottom: 12,
    }}>
      <SectionHeader title="Push notifications" sub={push.enabled ? 'On' : 'Off'} C={C} />

      <div style={{
        marginTop: 12, padding: '12px 14px',
        background: C.surface2, borderRadius: 12,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: push.enabled ? `${C.pay}1f` : C.surface,
          color: push.enabled ? C.pay : C.muted,
          border: `1px solid ${push.enabled ? `${C.pay}3a` : C.divider}`,
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
          <div style={{ fontSize: 11.5, color: C.muted, marginTop: 1 }}>Notify on XD &amp; payment days</div>
        </div>
        <button
          onClick={() => push.enabled ? push.disable() : push.enable()}
          disabled={push.loading || !push.isSupported}
          aria-pressed={push.enabled}
          aria-label={push.enabled ? 'Disable notifications' : 'Enable notifications'}
          style={{
            width: 42, height: 26, borderRadius: 999,
            appearance: 'none', border: 0, padding: 2,
            background: push.enabled ? C.pay : C.divider,
            cursor: push.isSupported ? 'pointer' : 'not-allowed',
            transition: 'background 180ms',
            display: 'flex', alignItems: 'center',
            justifyContent: push.enabled ? 'flex-end' : 'flex-start',
            fontFamily: 'inherit',
          }}>
          <span style={{
            width: 22, height: 22, borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
          }} />
        </button>
      </div>

      <div style={{ marginTop: 10 }}>
        <button
          onClick={handleTest}
          disabled={!push.enabled}
          style={{
            width: '100%', appearance: 'none', fontFamily: 'inherit',
            border: `1px solid ${push.enabled ? C.text : C.divider}`,
            background: push.enabled ? C.text : C.surface2,
            color: push.enabled ? C.bg : C.muted,
            borderRadius: 12, padding: '11px 14px',
            fontWeight: 600, fontSize: 13,
            cursor: push.enabled ? 'pointer' : 'not-allowed',
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

export default function Dashboard({ C, holdings, dividends }: Props) {
  const enrichedHoldings = useMemo<EnrichedHolding[]>(() => {
    const byTicker = new Map<string, DividendRecord>();
    for (const d of dividends) {
      if (!d.pay_date) continue;
      const key = d.ticker.toUpperCase();
      if (!byTicker.has(key)) byTicker.set(key, d);
    }
    return holdings
      .map(h => ({ ...h, div: byTicker.get(h.ticker.toUpperCase()) }))
      .filter((h): h is EnrichedHolding => !!h.div)
      .sort((a, b) => b.quantity - a.quantity);
  }, [holdings, dividends]);

  const totalQty = enrichedHoldings.reduce((s, h) => s + h.quantity, 0);

  const monthly = useMemo<MonthBucket[]>(() => {
    const now = new Date();
    const months: MonthBucket[] = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      return { key: `${d.getFullYear()}-${d.getMonth()}`, date: d, total: 0 };
    });
    enrichedHoldings.forEach(h => {
      const payDate = parseISO(h.div.pay_date);
      const cash = h.quantity * h.div.cash_per_share;
      for (let i = 0; i < 12; i++) {
        const m = months[i];
        const diff =
          (m.date.getFullYear() - payDate.getFullYear()) * 12 +
          (m.date.getMonth() - payDate.getMonth());
        if (diff >= 0 && diff % 6 === 0) m.total += cash;
      }
    });
    return months;
  }, [enrichedHoldings]);

  const projTotal = monthly.reduce((s, m) => s + m.total, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ padding: 'var(--screen-pad) var(--screen-pad) 8px', flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.2, color: C.muted, textTransform: 'uppercase' }}>
          Dashboard
        </div>
        <div style={{
          fontSize: 'clamp(22px, 6.5vw, 26px)', fontWeight: 700, letterSpacing: -0.6, marginTop: 2,
          fontFamily: '"SF Pro Display", -apple-system, system-ui',
        }}>
          Portfolio
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '6px var(--screen-pad) 84px' }}>
        {holdings.length === 0 ? (
          <div style={{
            padding: '40px 16px', textAlign: 'center', color: C.muted, fontSize: 13,
            background: C.surface, borderRadius: 18, border: `1px solid ${C.divider}`,
            marginBottom: 12,
          }}>
            Add holdings in Profile to see your portfolio breakdown.
          </div>
        ) : (
          <>
            <PortfolioDonut C={C} holdings={enrichedHoldings} totalQty={totalQty} />
            <MonthlyCashChart C={C} months={monthly} projTotal={projTotal} />
          </>
        )}
        <NotificationsSection C={C} />
      </div>
    </div>
  );
}
