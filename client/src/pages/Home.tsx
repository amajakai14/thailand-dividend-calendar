import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, clearToken, DividendRecord, DividendsResponse } from '../services/api';
import { colors, Colors } from '../design/colors';
import Calendar from '../components/Calendar';
import BottomSheet from '../components/BottomSheet';
import TabBar from '../components/TabBar';
import TickerDetail from '../components/TickerDetail';
import Dashboard from '../components/Dashboard';
import { usePushNotification } from '../hooks/usePushNotification';

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
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
      <span style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, minWidth: 0 }}>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: C.text }}>{label}</span>
        <span style={{
          fontSize: 10, color: C.muted, fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{sub}</span>
      </div>
    </div>
  );
}

function Section({ title, children, C }: { title: string; children: React.ReactNode; C: Colors }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted,
        textTransform: 'uppercase', marginBottom: 8,
      }}>{title}</div>
      {children}
    </div>
  );
}

function Empty({ children, C }: { children: React.ReactNode; C: Colors }) {
  return (
    <div style={{
      padding: '14px', textAlign: 'center', color: C.muted, fontSize: 12.5,
      background: C.surface2, borderRadius: 10,
    }}>{children}</div>
  );
}

function inputStyle(C: Colors): React.CSSProperties {
  return {
    appearance: 'none', border: `1px solid ${C.divider}`, background: C.surface,
    color: C.text, borderRadius: 10, padding: '10px 12px',
    fontSize: 13, fontFamily: 'inherit', outline: 'none',
  };
}

interface Holding {
  ticker: string;
  quantity: number;
}

type TabId = 'calendar' | 'dashboard' | 'profile';

export default function Home() {
  const navigate = useNavigate();
  const now = new Date();
  const C = colors(false);

  const [activeTab, setActiveTab] = useState<TabId>('calendar');

  // Calendar state
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

  // Portfolio state
  const [holdings, setHoldings] = useState<Holding[]>([]);

  // Profile state
  const [watchlistFull, setWatchlistFull] = useState<{ ticker: string }[]>([]);
  const [watchInput, setWatchInput] = useState('');
  const [watchError, setWatchError] = useState<string | null>(null);
  const push = usePushNotification();
  const [testPushStatus, setTestPushStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

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
      .then(data => {
        setWatchlistTickers(new Set(data.map(w => w.ticker.toUpperCase())));
        setWatchlistFull(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    api.get<Holding[]>('/api/portfolio')
      .then(setHoldings)
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
        .then(() => {
          setWatchlistTickers(prev => { const n = new Set(prev); n.delete(upper); return n; });
          setWatchlistFull(w => w.filter(x => x.ticker.toUpperCase() !== upper));
        })
        .catch(() => {});
    } else {
      api.post('/api/watchlist', { ticker })
        .then(() => {
          setWatchlistTickers(prev => new Set([...prev, upper]));
          setWatchlistFull(w => [...w, { ticker: upper }]);
        })
        .catch(() => {});
    }
  }, [watchlistTickers]);

  // Watchlist handlers
  async function handleWatchAdd(e: React.FormEvent) {
    e.preventDefault();
    setWatchError(null);
    if (!watchInput.trim()) return;
    try {
      await api.post('/api/watchlist', { ticker: watchInput.trim().toUpperCase() });
      const upper = watchInput.trim().toUpperCase();
      setWatchlistFull(w => [...w, { ticker: upper }]);
      setWatchlistTickers(prev => new Set([...prev, upper]));
      setWatchInput('');
    } catch (err: unknown) {
      setWatchError(err instanceof Error ? err.message : 'Failed to add.');
    }
  }

  async function handleWatchRemove(ticker: string) {
    try {
      await api.delete(`/api/watchlist/${ticker}`);
      setWatchlistFull(w => w.filter(x => x.ticker !== ticker));
      setWatchlistTickers(prev => { const n = new Set(prev); n.delete(ticker.toUpperCase()); return n; });
    } catch {}
  }

  async function handleTestPush() {
    setTestPushStatus('sending');
    const result = await push.test();
    setTestPushStatus(result.ok ? 'sent' : 'error');
    setTimeout(() => setTestPushStatus('idle'), 3000);
  }

  function handleSignOut() {
    clearToken();
    navigate('/login');
  }

  return (
    <div style={{
      width: '100%', flex: 1, minHeight: 0,
      background: C.bg, color: C.text,
      fontFamily: "'Inter', -apple-system, 'SF Pro Text', system-ui, sans-serif",
      display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
      borderRadius: 'clamp(16px, 4vw, 22px)',
      boxShadow: '0 1px 2px rgba(20,18,12,0.04), 0 12px 30px rgba(20,18,12,0.07)',
      border: `1px solid ${C.divider}`,
    }}>

      {/* ── CALENDAR TAB ─────────────────────────────────────────── */}
      {activeTab === 'calendar' && <>
        <div style={{ padding: 'var(--screen-pad) var(--screen-pad) 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.2, color: C.muted, textTransform: 'uppercase' }}>
                SET · Dividend Calendar
              </div>
              <div style={{
                fontSize: 'clamp(22px, 6.5vw, 26px)',
                fontWeight: 700, letterSpacing: -0.6, marginTop: 2,
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

        <div style={{
          margin: '4px var(--screen-pad) 0', padding: '9px 10px',
          display: 'flex', gap: 'clamp(6px, 2.5vw, 14px)', alignItems: 'center',
          background: C.surface, borderRadius: 12, border: `1px solid ${C.divider}`,
          flexShrink: 0, minWidth: 0,
        }}>
          <LegendDot color={C.xd} label="XD" sub={`${monthStats.xdCount} this mo`} C={C} />
          <div style={{ width: 1, height: 22, background: C.divider, flexShrink: 0 }} />
          <LegendDot color={C.pay} label="Pay" sub={`${monthStats.payCount} this mo`} C={C} />
          <div style={{ width: 1, height: 22, background: C.divider, flexShrink: 0 }} />
          <LegendDot color={C.today} label="Today" sub={now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} C={C} />
        </div>

        <BottomSheet
          C={C} state={sheet} setState={setSheet}
          dateLabel={selected.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          xdList={xdList} payList={payList}
          watchlistTickers={watchlistTickers}
          tab={tab} setTab={setTab}
          onPickStock={setActiveStock}
          bottomOffset={64}
        />
      </>}

      {/* ── DASHBOARD TAB ─────────────────────────────────────────── */}
      {activeTab === 'dashboard' && (
        <Dashboard C={C} holdings={holdings} dividends={dividends} />
      )}

      {/* ── PROFILE TAB ─────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={{ padding: 'var(--screen-pad) var(--screen-pad) 8px', flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.2, color: C.muted, textTransform: 'uppercase' }}>
              Account
            </div>
            <div style={{
              fontSize: 'clamp(22px, 6.5vw, 26px)', fontWeight: 700, letterSpacing: -0.6, marginTop: 2,
              fontFamily: '"SF Pro Display", -apple-system, system-ui',
            }}>
              Profile
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0 var(--screen-pad) 80px' }}>
            <Section title="XD Watchlist" C={C}>
              <p style={{ fontSize: 12, color: C.muted, marginBottom: 10, lineHeight: 1.4 }}>
                Watched tickers push notify before XD date.
              </p>
              <form onSubmit={handleWatchAdd} style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                <input type="text" value={watchInput}
                  onChange={e => setWatchInput(e.target.value.toUpperCase())}
                  placeholder="TICKER"
                  style={{ ...inputStyle(C), flex: 1, minWidth: 0 }} />
                <button type="submit" style={{
                  appearance: 'none', border: 0, fontFamily: 'inherit',
                  background: C.text, color: C.bg, borderRadius: 10, padding: '0 14px',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer',
                }}>Watch</button>
              </form>
              {watchError && <div style={{ color: C.xd, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{watchError}</div>}
              {watchlistFull.length === 0 ? (
                <Empty C={C}>No tickers watched.</Empty>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {watchlistFull.map(w => (
                    <span key={w.ticker} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: `${C.today}14`, color: C.today,
                      border: `1px solid ${C.today}33`,
                      padding: '4px 6px 4px 10px', borderRadius: 999,
                      fontSize: 12, fontWeight: 700,
                    }}>
                      {w.ticker}
                      <button onClick={() => handleWatchRemove(w.ticker)} style={{
                        appearance: 'none', background: 'none', border: 0,
                        cursor: 'pointer', color: C.today, padding: 0,
                        fontSize: 16, lineHeight: 1, width: 18, height: 18,
                      }}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </Section>

            <Section title="Push Notifications" C={C}>
              {!push.isSupported ? (
                <Empty C={C}>Not supported in this browser.</Empty>
              ) : push.enabled ? (
                <div>
                  <div style={{
                    fontSize: 12.5, color: C.pay, fontWeight: 700, marginBottom: 10,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.pay }} />
                    Notifications enabled
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => push.disable()} disabled={push.loading} style={{
                      flex: 1, appearance: 'none', border: `1px solid ${C.xd}33`,
                      background: `${C.xd}14`, color: C.xd, fontFamily: 'inherit',
                      borderRadius: 10, padding: '10px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                    }}>Disable</button>
                    <button onClick={handleTestPush} disabled={testPushStatus === 'sending'} style={{
                      flex: 1, appearance: 'none', border: `1px solid ${C.divider}`,
                      background: C.surface, color: C.text, fontFamily: 'inherit',
                      borderRadius: 10, padding: '10px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                    }}>
                      {testPushStatus === 'sending' ? 'Sending…' :
                        testPushStatus === 'sent' ? 'Sent!' :
                        testPushStatus === 'error' ? 'Failed' : 'Test'}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <button onClick={() => push.enable()} disabled={push.loading} style={{
                    width: '100%', appearance: 'none', border: 0, fontFamily: 'inherit',
                    background: C.text, color: C.bg, borderRadius: 10, padding: '11px',
                    fontWeight: 700, fontSize: 13, cursor: 'pointer',
                    opacity: push.loading ? 0.6 : 1,
                  }}>Enable Notifications</button>
                  {push.error && <p style={{ color: C.xd, fontSize: 12, marginTop: 8, fontWeight: 600 }}>{push.error}</p>}
                </div>
              )}
            </Section>

            <Section title="Account" C={C}>
              <button onClick={handleSignOut} style={{
                width: '100%', appearance: 'none', fontFamily: 'inherit',
                background: `${C.xd}14`, color: C.xd,
                border: `1px solid ${C.xd}33`,
                borderRadius: 10, padding: '11px',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}>Sign Out</button>
            </Section>
          </div>
        </div>
      )}

      {/* ── TAB BAR ─────────────────────────────────────────────── */}
      <TabBar C={C} active={activeTab} onNavigate={id => setActiveTab(id as TabId)} />

      {/* ── STOCK DETAIL MODAL ──────────────────────────────────── */}
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
