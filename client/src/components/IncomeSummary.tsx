import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { DividendsResponse } from '../services/api';

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

export default function IncomeSummary({ holdings }: { holdings: Holding[] }) {
  const [rows, setRows] = useState<IncomeRow[]>([]);
  const [loading, setLoading] = useState(false);

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

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Estimated Income</div>
      {holdings.length === 0 ? (
        <p style={{ color: '#6b7280' }}>No holdings yet.</p>
      ) : loading ? (
        <p>Loading income…</p>
      ) : rows.length === 0 ? (
        <p style={{ color: '#6b7280' }}>No upcoming pay dates for your holdings.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Pay Date</th>
              <th style={{ padding: '8px 10px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Ticker</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', border: '1px solid #e5e7eb' }}>Qty</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', border: '1px solid #e5e7eb' }}>฿/share</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', border: '1px solid #e5e7eb' }}>Est. Income</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                <td style={{ padding: '7px 10px', border: '1px solid #e5e7eb' }}>{r.pay_date}</td>
                <td style={{ padding: '7px 10px', border: '1px solid #e5e7eb' }}>{r.ticker}</td>
                <td style={{ padding: '7px 10px', border: '1px solid #e5e7eb', textAlign: 'right' }}>{r.quantity.toLocaleString()}</td>
                <td style={{ padding: '7px 10px', border: '1px solid #e5e7eb', textAlign: 'right' }}>{r.cash_per_share.toFixed(4)}</td>
                <td style={{ padding: '7px 10px', border: '1px solid #e5e7eb', textAlign: 'right' }}>{r.income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            ))}
            <tr style={{ fontWeight: 700, background: '#f3f4f6' }}>
              <td colSpan={4} style={{ padding: '8px 10px', border: '1px solid #e5e7eb', textAlign: 'right' }}>Total</td>
              <td style={{ padding: '8px 10px', border: '1px solid #e5e7eb', textAlign: 'right' }}>{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
