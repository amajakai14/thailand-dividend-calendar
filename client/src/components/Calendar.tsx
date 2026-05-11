import { memo } from 'react';
import { DividendRecord } from '../services/api';
import { Colors } from '../design/colors';

const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function buildGrid(year: number, month0: number): Date[] {
  const first = new Date(year, month0, 1);
  const lead = first.getDay();
  const start = new Date(year, month0, 1 - lead);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

interface Props {
  year: number;
  month0: number;
  selected: Date;
  today: Date;
  xdMap: Map<string, DividendRecord[]>;
  payMap: Map<string, DividendRecord[]>;
  filter: 'all' | 'watchlist';
  watchlistTickers: Set<string>;
  onSelectDate: (d: Date) => void;
  C: Colors;
}

function CalendarInner({ year, month0, selected, today, xdMap, payMap, filter, watchlistTickers, onSelectDate, C }: Props) {
  const cells = buildGrid(year, month0);

  return (
    <div style={{ padding: '0 16px 8px' }}>
      {/* DOW header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
        {DOW.map((d, i) => (
          <div key={d} style={{
            textAlign: 'center', fontSize: 10.5, fontWeight: 600, letterSpacing: 0.6,
            color: (i === 0 || i === 6) ? C.weekend : C.muted,
            padding: '6px 0',
          }}>{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((d, i) => {
          const inMonth = d.getMonth() === month0;
          const iso = toISO(d);
          const rawXd = xdMap.get(iso) ?? [];
          const rawPay = payMap.get(iso) ?? [];
          const xd = filter === 'watchlist' ? rawXd.filter(r => watchlistTickers.has(r.ticker.toUpperCase())) : rawXd;
          const pay = filter === 'watchlist' ? rawPay.filter(r => watchlistTickers.has(r.ticker.toUpperCase())) : rawPay;
          const isSelected = sameDay(d, selected);
          const isToday = sameDay(d, today);
          const dow = d.getDay();
          const isWeekend = dow === 0 || dow === 6;

          return (
            <button
              key={i}
              onClick={() => onSelectDate(d)}
              style={{
                appearance: 'none', border: 0, padding: 0, cursor: 'pointer',
                fontFamily: 'inherit', aspectRatio: '1 / 1.18',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'flex-start', borderRadius: 12,
                background: isSelected ? C.selectedBg : 'transparent',
                transition: 'background 120ms',
              }}
            >
              <div style={{
                marginTop: 7, width: 28, height: 28, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15,
                fontWeight: isToday ? 700 : (isSelected ? 600 : 500),
                color: !inMonth ? C.outMonth : isToday ? '#fff' : isWeekend ? C.weekend : C.text,
                background: isToday ? C.today : 'transparent',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {d.getDate()}
              </div>

              <div style={{ marginTop: 4, display: 'flex', gap: 3, alignItems: 'center', height: 8 }}>
                {xd.length > 0 && (
                  <span style={{
                    width: xd.length > 1 ? 14 : 6, height: 6, borderRadius: 3,
                    background: C.xd,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 8, fontWeight: 700, color: '#fff', lineHeight: 1,
                  }}>
                    {xd.length > 1 ? xd.length : ''}
                  </span>
                )}
                {pay.length > 0 && (
                  <span style={{
                    width: pay.length > 1 ? 14 : 6, height: 6, borderRadius: 3,
                    background: C.pay,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 8, fontWeight: 700, color: '#fff', lineHeight: 1,
                  }}>
                    {pay.length > 1 ? pay.length : ''}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default memo(CalendarInner);
