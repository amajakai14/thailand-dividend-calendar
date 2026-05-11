import { DividendRecord } from '../services/api';
import { Colors } from '../design/colors';

interface Props {
  record: DividendRecord;
  C: Colors;
  watchlistTickers: Set<string>;
  onClose: () => void;
  onWatchlistToggle: (ticker: string) => void;
}

function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' });
}

function TimelineRow({ C, dotColor, label, date, note }: {
  C: Colors; dotColor: string; label: string; date: string; note: string;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
      borderRadius: 12, border: `1px solid ${C.divider}`,
    }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 11.5, color: C.muted, marginTop: 1 }}>{note}</div>
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: C.text, fontVariantNumeric: 'tabular-nums' }}>{date}</div>
    </div>
  );
}

export default function TickerDetail({ record, C, watchlistTickers, onClose, onWatchlistToggle }: Props) {
  const isWatchlisted = watchlistTickers.has(record.ticker.toUpperCase());
  const xdDate = record.xd_date ? parseISO(record.xd_date) : null;
  const payDateStr = record.pay_date || record.approximate_pay_date;
  const payDate = payDateStr ? parseISO(payDateStr) : null;
  const periodLabel = record.period_start && record.period_end
    ? `${record.period_start} – ${record.period_end}`
    : (record.dividend_type || '');

  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0, zIndex: 80,
        background: 'rgba(15,12,4,0.42)',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        animation: 'fadein 180ms ease-out',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: C.surface,
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          padding: '14px 20px 30px',
          animation: 'slideup 240ms cubic-bezier(.32,.72,.18,1)',
        }}
      >
        <div style={{ width: 40, height: 5, borderRadius: 999, background: C.divider, margin: '0 auto 14px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 50, height: 50, borderRadius: 12, flexShrink: 0,
            background: C.surface2, border: `1px solid ${C.divider}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 13, letterSpacing: 0.3, color: C.text,
          }}>
            {record.ticker.slice(0, 4)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                fontSize: 20, fontWeight: 700, letterSpacing: -0.2,
                fontFamily: '"SF Pro Display", -apple-system, system-ui',
              }}>
                {record.ticker}
              </div>
              {isWatchlisted && (
                <svg width="13" height="13" viewBox="0 0 12 12" style={{ color: C.today, flexShrink: 0 }}>
                  <path d="M6 1l1.55 3.14L11 4.65 8.5 7.07 9.09 10.5 6 8.88 2.91 10.5 3.5 7.07 1 4.65l3.45-.51L6 1z" fill="currentColor"/>
                </svg>
              )}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {record.company_name}
            </div>
          </div>
        </div>

        <div style={{
          marginTop: 16, padding: '14px 16px',
          background: C.surface2, borderRadius: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              Dividend / share
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
              ฿{(record.cash_per_share ?? 0).toFixed(4)}
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{periodLabel}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              Type
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4, color: C.pay }}>
              {record.dividend_type || '—'}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {xdDate && (
            <TimelineRow C={C} dotColor={C.xd} label="Ex-Dividend (XD)" date={fmtDate(xdDate)} note="Buy before this date to qualify" />
          )}
          {payDate && (
            <TimelineRow C={C} dotColor={C.pay} label="Payment" date={fmtDate(payDate)}
              note={payDateStr === record.approximate_pay_date ? 'Approximate date' : 'Confirmed pay date'} />
          )}
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, appearance: 'none', border: `1px solid ${C.divider}`,
            background: C.surface, color: C.text, fontFamily: 'inherit',
            borderRadius: 12, padding: '12px', fontWeight: 600, fontSize: 14, cursor: 'pointer',
          }}>
            Close
          </button>
          <button onClick={() => onWatchlistToggle(record.ticker)} style={{
            flex: 1.4, appearance: 'none', border: 0,
            background: C.text, color: C.bg, fontFamily: 'inherit',
            borderRadius: 12, padding: '12px', fontWeight: 600, fontSize: 14, cursor: 'pointer',
          }}>
            {isWatchlisted ? 'In watchlist ★' : 'Add to watchlist'}
          </button>
        </div>
      </div>
    </div>
  );
}
