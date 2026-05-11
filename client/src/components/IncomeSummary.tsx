import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { DividendsResponse } from '../services/api';
import { colors } from '../design/colors';

interface Holding {
  ticker: string;
  quantity: number;
}

interface IncomeRow {
  pay_date: string;
  ticker: string;
  quantity: number;
  cash_per_share: number;
  income: number;
}

function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export default function IncomeSummary({ holdings }: { holdings: Holding[] }) {
  const [rows, setRows] = useState<IncomeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const C = colors(false);

  useEffect(() => {
    if (holdings.length === 0) { setRows([]); return; }
    setLoading(true);
    const now = new Date();
    const m1 = now.getMonth() + 1;
    const y1 = now.getFullYear();
    const m2 = m1 === 12 ? 1 : m1 + 1;
    const y2 = m1 === 12 ? y1 + 1 : y1;

    Promise.all([
      api.get<DividendsResponse>(`/api/dividends?month=${m1}&year=${y1}`),
      api.get<DividendsResponse>(`/api/dividends?month=${m2}&year=${y2}`),
    ]).then(([r1, r2]) => {
      const combined = [...r1.data, ...r2.data];
      const tickerSet = new Set(holdings.map(h => h.ticker.toUpperCase()));
      const matched: IncomeRow[] = [];
      for (const d of combined) {
        if (!d.pay_date) continue;
        const upper = d.ticker.toUpperCase();
        if (!tickerSet.has(upper)) continue;
        const holding = holdings.find(h => h.ticker.toUpperCase() === upper);
        if (!holding) continue;
        matched.push({
          pay_date: d.pay_date,
          ticker: d.ticker,
          quantity: holding.quantity,
          cash_per_share: d.cash_per_share,
          income: holding.quantity * d.cash_per_share,
        });
      }
      matched.sort((a, b) => a.pay_date.localeCompare(b.pay_date));
      setRows(matched);
    }).finally(() => setLoading(false));
  }, [holdings]);

  const total = rows.reduce((sum, r) => sum + r.income, 0);

  if (holdings.length === 0) {
    return (
      <div style={emptyStyle(C)}>No holdings yet.</div>
    );
  }
  if (loading) {
    return <div style={emptyStyle(C)}>Loading income…</div>;
  }
  if (rows.length === 0) {
    return <div style={emptyStyle(C)}>No upcoming pay dates.</div>;
  }

  return (
    <div>
      {/* Total hero */}
      <div style={{
        background: C.surface2, borderRadius: 14, padding: '14px 16px',
        marginBottom: 10,
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase',
          }}>Total est. income</div>
          <div style={{
            fontSize: 'clamp(20px, 6vw, 26px)', fontWeight: 700, marginTop: 2,
            fontVariantNumeric: 'tabular-nums', color: C.pay,
          }}>
            ฿{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>
          {rows.length} payment{rows.length === 1 ? '' : 's'}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rows.map((r, i) => {
          const d = parseISO(r.pay_date);
          const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return (
            <div key={i} style={{
              background: C.surface, border: `1px solid ${C.divider}`,
              borderRadius: 12, padding: '10px 12px',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                background: `${C.pay}14`, border: `1px solid ${C.pay}33`,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.pay, letterSpacing: 0.5 }}>PAY</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text, lineHeight: 1.1, marginTop: 1 }}>
                  {d.getDate()}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: 0.2 }}>{r.ticker}</span>
                  <span style={{
                    fontSize: 13.5, fontWeight: 700, color: C.pay, fontVariantNumeric: 'tabular-nums',
                  }}>
                    ฿{r.income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div style={{
                  fontSize: 11, color: C.muted, marginTop: 2, fontVariantNumeric: 'tabular-nums',
                }}>
                  {dateLabel} · {r.quantity.toLocaleString()} × ฿{r.cash_per_share.toFixed(4)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function emptyStyle(C: ReturnType<typeof colors>): React.CSSProperties {
  return {
    padding: '14px', textAlign: 'center', color: C.muted, fontSize: 12.5,
    background: C.surface2, borderRadius: 10,
  };
}
