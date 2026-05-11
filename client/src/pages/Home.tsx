import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, DividendRecord, DividendsResponse } from '../services/api';
import { colors, Colors } from '../design/colors';
import Calendar from '../components/Calendar';
import BottomSheet from '../components/BottomSheet';
import TabBar from '../components/TabBar';
import TickerDetail from '../components/TickerDetail';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function IconButton({ children, onClick, C }: { children: React.ReactNode; onClick: () => void; C: Colors }) {
  return (
    <button onClick={onClick} style={{
      width: 36, height: 36, borderRadius: 999,
      background: C.surface, border: `1px solid ${C.divider}`,
      color: C.text, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 0, appearance: 'none',
    }}>
      {children}
    </button>
  );
}

function SegBtn({ children, active, onClick, C }: { children: React.ReactNode; active: boolean; onClick: () => void; C: Colors }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, appearance: 'none', border: 0,
      padding: '9px 12px', borderRadius: 999,
      background: active ? C.text : 'transparent',
      color: active ? C.bg : C.muted,
      fontWeight: 600, fontSize: 13, cursor: 'pointer',
      fontFamily: 'inherit', transition: 'all 150ms',
    }}>
      {children}
    </button>
  );
}

function LegendDot({ color, label, sub, C }: { color: string; label: string; sub: string; C: Colors }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{label}</span>
        <span style={{ fontSize: 10.5, color: C.muted, fontVariantNumeric: 'tabular-nums' }}>{sub}</span>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const now = new Date();

  const [year, setYear] = useState(now.getFullYear());
  const [month0, setMonth0] = useState(now.getMonth());
  const [selected, setSelected] = useState<Date>(now);
  const [filter, setFilter] = useState<'all' | 'watchlist'>('all');
  const [tab, setTab] = useState<'xd' | 'pay'>('xd');
  const [sheet, setSheet] = useState<'peek' | 'expanded'>('peek');
  const [activeStock, setActiveStock] = useState<DividendRecord | null>(null);
  const [dividends, setDividends] = useState<DividendRecord[]>([]);
  const [watchlistTickers, setWatchlistTickers] = useState<Set<string>>(new Set());
  const [isFetching, setIsFetching] = useState(false);
  const [slideDir, setSlideDir] = useState<'up' | 'down' | null>(null);
  const [animKey, setAnimKey] = useState(0);
  const touchStartY = useRef<number>(0);

  const C = colors(false);

  useEffect(() => {
    let cancelled = false;
    setIsFetching(true);
    api.get<DividendsResponse>(`/api/dividends?month=${month0 + 1}&year=${year}`)
      .then(res => { if (!cancelled) { setDividends(res.data); setIsFetching(false); } })
      .catch(() => { if (!cancelled) setIsFetching(false); });
    return () => { cancelled = true; };
  }, [year, month0]);

  useEffect(() => {
    api.get<{ ticker: string }[]>('/api/watchlist')
      .then(data => setWatchlistTickers(new Set(data.map(w => w.ticker.toUpperCase()))))
      .catch(() => {});
  }, []);

  const xdMap = useMemo(() => {
    const map = new Map<string, DividendRecord[]>();
    for (const r of dividends) {
      if (!r.xd_date) continue;
      const arr = map.get(r.xd_date) ?? [];
      arr.push(r);
      map.set(r.xd_date, arr);
    }
    return map;
  }, [dividends]);

  const payMap = useMemo(() => {
    const map = new Map<string, DividendRecord[]>();
    for (const r of dividends) {
      const key = r.pay_date || r.approximate_pay_date;
      if (!key) continue;
      const arr = map.get(key) ?? [];
      arr.push(r);
      map.set(key, arr);
    }
    return map;
  }, [dividends]);

  const selISO = toISO(selected);

  const xdList = useMemo(() => {
    const raw = xdMap.get(selISO) ?? [];
    return filter === 'watchlist' ? raw.filter(r => watchlistTickers.has(r.ticker.toUpperCase())) : raw;
  }, [xdMap, selISO, filter, watchlistTickers]);

  const payList = useMemo(() => {
    const raw = payMap.get(selISO) ?? [];
    return filter === 'watchlist' ? raw.filter(r => watchlistTickers.has(r.ticker.toUpperCase())) : raw;
  }, [payMap, selISO, filter, watchlistTickers]);

  const monthStats = useMemo(() => {
    let xdCount = 0, payCount = 0;
    for (const [k, records] of xdMap) {
      const d = new Date(k + 'T00:00:00');
      if (d.getMonth() !== month0 || d.getFullYear() !== year) continue;
      xdCount += filter === 'watchlist' ? records.filter(r => watchlistTickers.has(r.ticker.toUpperCase())).length : records.length;
    }
    for (const [k, records] of payMap) {
      const d = new Date(k + 'T00:00:00');
      if (d.getMonth() !== month0 || d.getFullYear() !== year) continue;
      payCount += filter === 'watchlist' ? records.filter(r => watchlistTickers.has(r.ticker.toUpperCase())).length : records.length;
    }
    return { xdCount, payCount };
  }, [xdMap, payMap, month0, year, filter, watchlistTickers]);

  function nudgeMonth(delta: number) {
    setSlideDir(delta > 0 ? 'up' : 'down');
    setAnimKey(k => k + 1);
    const d = new Date(year, month0 + delta, 1);
    setYear(d.getFullYear());
    setMonth0(d.getMonth());
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(dy) < 40) return;
    nudgeMonth(dy > 0 ? 1 : -1);
  }

  const onSelectDate = useCallback((d: Date) => {
    setSelected(d);
    if (d.getMonth() !== month0) { setYear(d.getFullYear()); setMonth0(d.getMonth()); }
    const iso = toISO(d);
    const xc = (xdMap.get(iso) ?? []).length;
    const pc = (payMap.get(iso) ?? []).length;
    setTab(t => (t === 'xd' && xc === 0 && pc > 0) ? 'pay' : (t === 'pay' && pc === 0 && xc > 0) ? 'xd' : t);
    setSheet(xc > 0 || pc > 0 ? 'expanded' : 'peek');
  }, [month0, xdMap, payMap]);

  const toggleWatchlist = useCallback((ticker: string) => {
    const upper = ticker.toUpperCase();
    if (watchlistTickers.has(upper)) {
      api.delete(`/api/watchlist/${ticker}`)
        .then(() => setWatchlistTickers(prev => { const n = new Set(prev); n.delete(upper); return n; }))
        .catch(() => {});
    } else {
      api.post('/api/watchlist', { ticker })
        .then(() => setWatchlistTickers(prev => new Set([...prev, upper])))
        .catch(() => {});
    }
  }, [watchlistTickers]);

  return (
    <div style={{
      width: '100%', maxWidth: 430, margin: '0 auto',
      height: '100dvh', background: C.bg, color: C.text,
      fontFamily: "'Inter', -apple-system, 'SF Pro Text', system-ui, sans-serif",
      display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.2, color: C.muted, textTransform: 'uppercase' }}>
              SET · Dividend Calendar
            </div>
            <div style={{
              fontSize: 26, fontWeight: 700, letterSpacing: -0.6, marginTop: 2,
              fontFamily: '"SF Pro Display", -apple-system, system-ui',
            }}>
              {MONTHS[month0]} {year}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <IconButton C={C} onClick={() => nudgeMonth(-1)}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 2.5L4.5 7L9 11.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </IconButton>
            <IconButton C={C} onClick={() => nudgeMonth(1)}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 2.5L9.5 7L5 11.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </IconButton>
          </div>
        </div>

        {/* All / Watchlist toggle */}
        <div style={{
          display: 'flex', background: C.surface, borderRadius: 999,
          padding: 3, border: `1px solid ${C.divider}`,
        }}>
          <SegBtn active={filter === 'all'} onClick={() => setFilter('all')} C={C}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              All stocks
              <span style={{
                fontSize: 10.5, fontWeight: 700, padding: '1px 6px', borderRadius: 999,
                background: filter === 'all' ? 'rgba(255,255,255,0.22)' : C.surface2,
                color: filter === 'all' ? '#fff' : C.muted,
              }}>{dividends.length}</span>
            </span>
          </SegBtn>
          <SegBtn active={filter === 'watchlist'} onClick={() => setFilter('watchlist')} C={C}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <svg width="11" height="11" viewBox="0 0 12 12">
                <path d="M6 1l1.55 3.14L11 4.65 8.5 7.07 9.09 10.5 6 8.88 2.91 10.5 3.5 7.07 1 4.65l3.45-.51L6 1z" fill="currentColor"/>
              </svg>
              Watchlist
              <span style={{
                fontSize: 10.5, fontWeight: 700, padding: '1px 6px', borderRadius: 999,
                background: filter === 'watchlist' ? 'rgba(255,255,255,0.22)' : C.surface2,
                color: filter === 'watchlist' ? '#fff' : C.muted,
              }}>{watchlistTickers.size}</span>
            </span>
          </SegBtn>
        </div>
      </div>

      {/* Calendar — swipe up/down to change month */}
      <style>{`
        @keyframes calSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes calSlideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
      `}</style>
      <div
        style={{ marginTop: 14, flexShrink: 0, overflow: 'hidden' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          key={animKey}
          style={{
            opacity: isFetching ? 0.55 : 1,
            transition: 'opacity 200ms',
            animation: slideDir
              ? `${slideDir === 'up' ? 'calSlideUp' : 'calSlideDown'} 280ms cubic-bezier(.32,.72,.18,1) both`
              : 'none',
          }}
        >
          <Calendar
            year={year} month0={month0}
            selected={selected} today={now}
            xdMap={xdMap} payMap={payMap}
            filter={filter} watchlistTickers={watchlistTickers}
            onSelectDate={onSelectDate}
            C={C}
          />
        </div>
      </div>

      {/* Legend */}
      <div style={{
        margin: '4px 20px 0', padding: '10px 14px',
        display: 'flex', gap: 16, alignItems: 'center',
        background: C.surface, borderRadius: 12, border: `1px solid ${C.divider}`,
        flexShrink: 0,
      }}>
        <LegendDot color={C.xd} label="XD" sub={`${monthStats.xdCount} this month`} C={C} />
        <div style={{ width: 1, height: 22, background: C.divider }} />
        <LegendDot color={C.pay} label="Pay" sub={`${monthStats.payCount} this month`} C={C} />
        <div style={{ width: 1, height: 22, background: C.divider }} />
        <LegendDot color={C.today} label="Today" sub={now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} C={C} />
      </div>

      {/* Bottom sheet */}
      <BottomSheet
        C={C} state={sheet} setState={setSheet}
        dateLabel={selected.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        xdList={xdList} payList={payList}
        watchlistTickers={watchlistTickers}
        tab={tab} setTab={setTab}
        onPickStock={setActiveStock}
        bottomOffset={64}
      />

      {/* Tab bar */}
      <TabBar C={C} active="calendar" onNavigate={(id) => {
        if (id === 'dashboard') navigate('/portfolio');
      }} />

      {/* Stock detail modal */}
      {activeStock && (
        <TickerDetail
          record={activeStock} C={C}
          watchlistTickers={watchlistTickers}
          onClose={() => setActiveStock(null)}
          onWatchlistToggle={toggleWatchlist}
        />
      )}
    </div>
  );
}
