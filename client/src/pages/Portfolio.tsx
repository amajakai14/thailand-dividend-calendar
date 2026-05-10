import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import IncomeSummary from '../components/IncomeSummary';
import { usePushNotification } from '../hooks/usePushNotification';

interface Holding {
  ticker: string;
  quantity: number;
}

export default function Portfolio() {
  const navigate = useNavigate();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [tickerInput, setTickerInput] = useState('');
  const [qtyInput, setQtyInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [watchlist, setWatchlist] = useState<{ ticker: string }[]>([]);
  const [watchInput, setWatchInput] = useState('');
  const push = usePushNotification();

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
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>My Portfolio</h1>
        <a
          href="/"
          onClick={e => { e.preventDefault(); navigate('/'); }}
          style={{ color: '#2563eb', textDecoration: 'none' }}
        >
          ← Calendar
        </a>
      </div>

      <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
        <input
          type="text"
          value={tickerInput}
          onChange={e => setTickerInput(e.target.value.toUpperCase())}
          placeholder="TICKER"
          style={{ padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 4, width: 120, fontSize: 14 }}
        />
        <input
          type="number"
          value={qtyInput}
          onChange={e => setQtyInput(e.target.value)}
          placeholder="Qty"
          min={1}
          style={{ padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 4, width: 100, fontSize: 14 }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ padding: '7px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14 }}
        >
          Add
        </button>
      </form>

      {error && <p style={{ color: '#dc2626', marginBottom: 12, fontSize: 14 }}>{error}</p>}

      {holdings.length === 0 ? (
        <p style={{ color: '#6b7280' }}>No holdings yet. Add a ticker above.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, marginBottom: 8 }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Ticker</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', border: '1px solid #e5e7eb' }}>Quantity</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', border: '1px solid #e5e7eb' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h, i) => (
              <tr key={h.ticker} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                <td style={{ padding: '7px 10px', border: '1px solid #e5e7eb', fontWeight: 600 }}>{h.ticker}</td>
                <td style={{ padding: '7px 10px', border: '1px solid #e5e7eb', textAlign: 'right' }}>{h.quantity.toLocaleString()}</td>
                <td style={{ padding: '7px 10px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                  <button
                    onClick={() => handleRemove(h.ticker)}
                    style={{ padding: '4px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <IncomeSummary holdings={holdings} />

      {/* Watchlist section */}
      <div style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>XD Watchlist</h2>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
          Tickers on your watchlist will trigger push notifications before their XD date.
        </p>
        <form onSubmit={handleWatchAdd} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            type="text"
            value={watchInput}
            onChange={e => setWatchInput(e.target.value.toUpperCase())}
            placeholder="TICKER"
            style={{ padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 4, width: 120, fontSize: 14 }}
          />
          <button type="submit" style={{ padding: '7px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14 }}>
            Watch
          </button>
        </form>
        {watchlist.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: 14 }}>No tickers watched yet.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {watchlist.map(w => (
              <span key={w.ticker} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eff6ff', color: '#1d4ed8', padding: '4px 10px', borderRadius: 16, fontSize: 13, fontWeight: 600 }}>
                {w.ticker}
                <button
                  onClick={() => handleWatchRemove(w.ticker)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 0, fontSize: 14, lineHeight: 1 }}
                >×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Push Notifications section */}
      <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #e5e7eb' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Push Notifications</h2>
        {!push.isSupported ? (
          <p style={{ color: '#6b7280', fontSize: 14 }}>Not supported in this browser.</p>
        ) : push.enabled ? (
          <div>
            <p style={{ color: '#15803d', fontSize: 14, marginBottom: 8 }}>✓ Notifications enabled</p>
            <button
              onClick={() => push.disable()}
              disabled={push.loading}
              style={{ padding: '7px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14 }}
            >Disable</button>
          </div>
        ) : (
          <div>
            <button
              onClick={() => push.enable()}
              disabled={push.loading}
              style={{ padding: '7px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14 }}
            >Enable Notifications</button>
            {push.error && <p style={{ color: '#dc2626', fontSize: 13, marginTop: 8 }}>{push.error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
