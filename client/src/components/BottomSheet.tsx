import { useRef, useState } from 'react';
import { DividendRecord } from '../services/api';
import { Colors } from '../design/colors';

const PEEK = 330;
const EXPANDED = 660;

function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function StockCard({ record, tab, C, watchlistTickers, onClick }: {
  record: DividendRecord;
  tab: 'xd' | 'pay';
  C: Colors;
  watchlistTickers: Set<string>;
  onClick: () => void;
}) {
  const isWatchlisted = watchlistTickers.has(record.ticker.toUpperCase());
  const activeDate = tab === 'xd' ? record.xd_date : (record.pay_date || record.approximate_pay_date || '');
  const otherDate = tab === 'xd' ? (record.pay_date || record.approximate_pay_date || '') : record.xd_date;
  const otherLabel = tab === 'xd' ? 'Pays' : 'XD';
  const accentColor = tab === 'xd' ? C.xd : C.pay;
  const dateNum = activeDate ? parseISO(activeDate).getDate() : '?';
  const otherFmt = otherDate
    ? parseISO(otherDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '—';

  return (
    <button
      onClick={onClick}
      style={{
        appearance: 'none', border: `1px solid ${C.divider}`, fontFamily: 'inherit',
        background: C.surface, borderRadius: 14, padding: '10px 12px',
        cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center',
        gap: 10, color: C.text, width: '100%', minWidth: 0,
        transition: 'transform 80ms ease',
      }}
    >
      {/* Ticker tile */}
      <div style={{
        width: 42, height: 42, borderRadius: 10, flexShrink: 0,
        background: `${accentColor}14`,
        border: `1px solid ${accentColor}33`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, color: accentColor }}>
          {tab === 'xd' ? 'XD' : 'PAY'}
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.text, lineHeight: 1.1, marginTop: 1 }}>
          {dateNum}
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: 0.2 }}>{record.ticker}</span>
          {isWatchlisted && (
            <svg width="10" height="10" viewBox="0 0 12 12" style={{ color: C.today }}>
              <path d="M6 1l1.55 3.14L11 4.65 8.5 7.07 9.09 10.5 6 8.88 2.91 10.5 3.5 7.07 1 4.65l3.45-.51L6 1z" fill="currentColor"/>
            </svg>
          )}
        </div>
        <div style={{
          fontSize: 11.5, color: C.muted, marginTop: 1,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {record.company_name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: accentColor, fontVariantNumeric: 'tabular-nums' }}>
            ฿{(record.cash_per_share ?? 0).toFixed(4)}/sh
          </span>
          <span style={{ fontSize: 10.5, color: C.muted, marginLeft: 'auto' }}>
            {otherLabel} {otherFmt}
          </span>
        </div>
      </div>
    </button>
  );
}

function EmptyState({ C, tab }: { C: Colors; tab: 'xd' | 'pay' }) {
  return (
    <div style={{ padding: '40px 20px', textAlign: 'center', color: C.muted, fontSize: 13 }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%', margin: '0 auto 12px',
        background: C.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="2.5" y="4" width="15" height="13" rx="2" stroke={C.muted} strokeWidth="1.5"/>
          <path d="M6 2v4M14 2v4M2.5 8.5h15" stroke={C.muted} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <div style={{ fontWeight: 600, color: C.text, marginBottom: 2 }}>
        No {tab === 'xd' ? 'ex-dividend' : 'payment'} events
      </div>
      <div>Try another date or switch tabs.</div>
    </div>
  );
}

interface Props {
  C: Colors;
  state: 'peek' | 'expanded';
  setState: (s: 'peek' | 'expanded') => void;
  dateLabel: string;
  xdList: DividendRecord[];
  payList: DividendRecord[];
  watchlistTickers: Set<string>;
  tab: 'xd' | 'pay';
  setTab: (t: 'xd' | 'pay') => void;
  onPickStock: (r: DividendRecord) => void;
  bottomOffset: number;
}

export default function BottomSheet({ C, state, setState, dateLabel, xdList, payList, watchlistTickers, tab, setTab, onPickStock, bottomOffset }: Props) {
  const startY = useRef<number | null>(null);
  const [drag, setDrag] = useState(0);

  const target = state === 'expanded' ? EXPANDED : PEEK;
  const height = Math.max(120, target - drag);
  const list = tab === 'xd' ? xdList : payList;
  const total = xdList.length + payList.length;

  function onPointerDown(e: React.PointerEvent) {
    startY.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (startY.current == null) return;
    setDrag(e.clientY - startY.current);
  }
  function onPointerUp() {
    if (Math.abs(drag) > 50) setState(drag < 0 ? 'expanded' : 'peek');
    startY.current = null;
    setDrag(0);
  }

  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: bottomOffset,
      height, background: C.surface,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      boxShadow: '0 -10px 30px rgba(20,18,12,0.10), 0 -2px 6px rgba(20,18,12,0.04)',
      transition: drag === 0 ? 'height 280ms cubic-bezier(.32,.72,.18,1)' : 'none',
      display: 'flex', flexDirection: 'column',
      zIndex: 30, overflow: 'hidden',
      borderTop: `1px solid ${C.divider}`,
    }}>
      {/* Drag handle */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={() => setState(state === 'peek' ? 'expanded' : 'peek')}
        style={{
          padding: '10px 0 6px', display: 'flex', justifyContent: 'center',
          cursor: 'grab', touchAction: 'none', flexShrink: 0,
        }}
      >
        <div style={{ width: 40, height: 5, borderRadius: 999, background: C.divider }} />
      </div>

      {/* Date title */}
      <div style={{ padding: '4px var(--screen-pad) 10px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{
            fontSize: 'clamp(15px, 4.5vw, 18px)', fontWeight: 700, letterSpacing: -0.3,
            fontFamily: '"SF Pro Display", -apple-system, system-ui',
            minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
          }}>
            {dateLabel}
          </div>
          <div style={{ fontSize: 11.5, color: C.muted, fontWeight: 600 }}>
            {total === 0 ? 'No events' : `${total} event${total === 1 ? '' : 's'}`}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        margin: '0 var(--screen-pad)', display: 'flex', gap: 6,
        background: C.surface2, padding: 3, borderRadius: 10, flexShrink: 0,
      }}>
        {(['xd', 'pay'] as const).map(t => {
          const active = tab === t;
          const count = t === 'xd' ? xdList.length : payList.length;
          const dot = t === 'xd' ? C.xd : C.pay;
          const label = t === 'xd' ? 'Ex-Dividend' : 'Payment';
          return (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '8px 10px', appearance: 'none', border: 0,
              borderRadius: 8, fontFamily: 'inherit',
              background: active ? C.surface : 'transparent',
              color: active ? C.text : C.muted, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontSize: 12, fontWeight: 600,
              boxShadow: active ? '0 1px 2px rgba(20,18,12,0.06)' : 'none',
              transition: 'all 150ms',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot }} />
              {label}
              <span style={{
                fontSize: 10.5, fontWeight: 700, padding: '1px 6px', borderRadius: 999,
                background: active ? C.surface2 : 'transparent',
                color: C.muted, fontVariantNumeric: 'tabular-nums',
              }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* List */}
      <div style={{ marginTop: 12, flex: 1, overflowY: 'auto', padding: '0 var(--screen-pad) 28px' }}>
        {list.length === 0 ? (
          <EmptyState C={C} tab={tab} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {list.map(r => (
              <StockCard
                key={r.ticker + tab}
                record={r} tab={tab} C={C}
                watchlistTickers={watchlistTickers}
                onClick={() => onPickStock(r)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
