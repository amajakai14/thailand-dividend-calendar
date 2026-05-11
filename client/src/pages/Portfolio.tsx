import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import IncomeSummary from '../components/IncomeSummary';
import { usePushNotification } from '../hooks/usePushNotification';
import { colors, Colors } from '../design/colors';
import TabBar from '../components/TabBar';

interface Holding {
  ticker: string;
  quantity: number;
}

export default function Portfolio() {
  const navigate = useNavigate();
  const C = colors(false);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [tickerInput, setTickerInput] = useState('');
  const [qtyInput, setQtyInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [watchlist, setWatchlist] = useState<{ ticker: string }[]>([]);
  const [watchInput, setWatchInput] = useState('');
  const push = usePushNotification();
  const [testPushStatus, setTestPushStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleTestPush() {
    setTestPushStatus('sending');
    const result = await push.test();
    setTestPushStatus(result.ok ? 'sent' : 'error');
    setTimeout(() => setTestPushStatus('idle'), 3000);
  }

  async function fetchHoldings() {
    const data = await api.get<Holding[]>('/api/portfolio');
    setHoldings(data);
  }

  async function fetchWatchlist() {
    const data = await api.get<{ ticker: string }[]>('/api/watchlist');
    setWatchlist(data);
  }

  useEffect(() => {
    fetchHoldings();
    api.get<{ ticker: string }[]>('/api/watchlist').then(setWatchlist).catch(() => {});
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!tickerInput.trim()) { setError('Ticker is required.'); return; }
    if (!qtyInput || Number(qtyInput) <= 0) { setError('Quantity must be greater than 0.'); return; }
    setLoading(true);
    try {
      await api.post('/api/portfolio', { ticker: tickerInput.trim().toUpperCase(), quantity: Number(qtyInput) });
      await fetchHoldings();
      setTickerInput('');
      setQtyInput('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add holding.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(ticker: string) {
    try {
      await api.delete(`/api/portfolio/${ticker}`);
      await fetchHoldings();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to remove holding.');
    }
  }

  async function handleWatchAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!watchInput.trim()) return;
    try {
      await api.post('/api/watchlist', { ticker: watchInput.trim().toUpperCase() });
      await fetchWatchlist();
      setWatchInput('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add to watchlist.');
    }
  }

  async function handleWatchRemove(ticker: string) {
    try {
      await api.delete(`/api/watchlist/${ticker}`);
      await fetchWatchlist();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to remove from watchlist.');
    }
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
      {/* Header */}
      <div style={{ padding: 'var(--screen-pad) var(--screen-pad) 8px', flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.2, color: C.muted, textTransform: 'uppercase' }}>
          Account
        </div>
        <div style={{
          fontSize: 'clamp(22px, 6.5vw, 26px)', fontWeight: 700, letterSpacing: -0.6, marginTop: 2,
          fontFamily: '"SF Pro Display", -apple-system, system-ui',
        }}>
          Portfolio
        </div>
      </div>

      {/* Scroll body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 var(--screen-pad) 80px' }}>
        {/* Add holding */}
        <Section title="Holdings" C={C}>
          <form onSubmit={handleAdd} style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            <input type="text" value={tickerInput}
              onChange={e => setTickerInput(e.target.value.toUpperCase())}
              placeholder="TICKER"
              style={{ ...inputStyle(C), flex: 1, minWidth: 0 }} />
            <input type="number" value={qtyInput}
              onChange={e => setQtyInput(e.target.value)}
              placeholder="Qty" min={1}
              style={{ ...inputStyle(C), width: 80 }} />
            <button type="submit" disabled={loading} style={{
              appearance: 'none', border: 0, fontFamily: 'inherit',
              background: C.text, color: C.bg, borderRadius: 10, padding: '0 14px',
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
              opacity: loading ? 0.6 : 1,
            }}>Add</button>
          </form>
          {error && <div style={{ color: C.xd, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{error}</div>}

          {holdings.length === 0 ? (
            <Empty C={C}>No holdings yet.</Empty>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {holdings.map(h => (
                <div key={h.ticker} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: C.surface, border: `1px solid ${C.divider}`,
                  borderRadius: 12, padding: '10px 12px',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 0.2 }}>{h.ticker}</div>
                    <div style={{ fontSize: 11.5, color: C.muted, fontVariantNumeric: 'tabular-nums', marginTop: 1 }}>
                      {h.quantity.toLocaleString()} shares
                    </div>
                  </div>
                  <button onClick={() => handleRemove(h.ticker)} style={{
                    appearance: 'none', border: `1px solid ${C.xd}33`,
                    background: `${C.xd}14`, color: C.xd, fontFamily: 'inherit',
                    borderRadius: 999, padding: '5px 12px',
                    fontWeight: 600, fontSize: 12, cursor: 'pointer',
                  }}>Remove</button>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Income */}
        <Section title="Estimated Income" C={C}>
          <IncomeSummary holdings={holdings} />
        </Section>

        {/* Watchlist */}
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
          {watchlist.length === 0 ? (
            <Empty C={C}>No tickers watched.</Empty>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {watchlist.map(w => (
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

        {/* Push */}
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
      </div>

      <TabBar C={C} active="dashboard" onNavigate={(id) => {
        if (id === 'calendar') navigate('/');
      }} />
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
