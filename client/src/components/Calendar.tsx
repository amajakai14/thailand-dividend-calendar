import { useState, useEffect } from 'react';
import { api, DividendRecord, DividendsResponse } from '../services/api';
import DayCell from './DayCell';
import TickerDetail from './TickerDetail';

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function Calendar() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [dividends, setDividends] = useState<DividendRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<DividendRecord | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .get<DividendsResponse>(`/api/dividends?month=${month}&year=${year}`)
      .then(res => setDividends(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [month, year]);

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else { setMonth(m => m - 1); }
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else { setMonth(m => m + 1); }
  }

  const monthLabel = new Date(year, month - 1, 1).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const slots: number[] = [
    ...Array(firstDay).fill(0),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (slots.length % 7 !== 0) slots.push(0);

  const xdMap = new Map<string, DividendRecord[]>();
  const payMap = new Map<string, DividendRecord[]>();
  for (const r of dividends) {
    if (r.xd_date) {
      const arr = xdMap.get(r.xd_date) ?? [];
      arr.push(r);
      xdMap.set(r.xd_date, arr);
    }
    if (r.pay_date) {
      const arr = payMap.get(r.pay_date) ?? [];
      arr.push(r);
      payMap.set(r.pay_date, arr);
    }
  }

  const today = todayISO();

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Nav row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <button
          onClick={prevMonth}
          style={{
            padding: '6px 14px',
            cursor: 'pointer',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            background: '#fff',
            fontSize: 16,
          }}
        >
          ←
        </button>
        <span style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>{monthLabel}</span>
        <button
          onClick={nextMonth}
          style={{
            padding: '6px 14px',
            cursor: 'pointer',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            background: '#fff',
            fontSize: 16,
          }}
        >
          →
        </button>
      </div>

      {/* Day-of-week header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          marginBottom: 2,
        }}
      >
        {DOW_LABELS.map(d => (
          <div
            key={d}
            style={{
              textAlign: 'center',
              fontSize: 12,
              color: '#6b7280',
              fontWeight: 600,
              padding: '4px 0',
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Loading...</div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#b91c1c' }}>{error}</div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
          }}
        >
          {slots.map((day, i) => {
            const dateKey =
              day === 0
                ? ''
                : `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            return (
              <DayCell
                key={i}
                day={day}
                xdRecords={dateKey ? (xdMap.get(dateKey) ?? []) : []}
                payRecords={dateKey ? (payMap.get(dateKey) ?? []) : []}
                onSelectTicker={setSelected}
                isToday={dateKey === today}
              />
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: '#374151' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              display: 'inline-block',
              width: 12,
              height: 12,
              borderRadius: 9999,
              backgroundColor: '#fee2e2',
              border: '1px solid #fca5a5',
            }}
          />
          XD date
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              display: 'inline-block',
              width: 12,
              height: 12,
              borderRadius: 9999,
              backgroundColor: '#dcfce7',
              border: '1px solid #86efac',
            }}
          />
          Pay date
        </div>
      </div>

      <TickerDetail record={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
