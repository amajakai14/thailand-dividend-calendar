import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, saveToken } from '../services/api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const out = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) out[i] = rawData.charCodeAt(i);
  return out;
}

function PushDebugPanel() {
  const [log, setLog] = useState<string[]>([]);
  const [sub, setSub] = useState<PushSubscription | null>(null);
  const [busy, setBusy] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  function addLog(msg: string) {
    setLog(prev => {
      const next = [...prev, `${new Date().toLocaleTimeString()} — ${msg}`];
      setTimeout(() => {
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
      }, 0);
      return next;
    });
  }

  async function subscribe() {
    setBusy(true);
    try {
      addLog('Requesting notification permission…');
      const perm = await Notification.requestPermission();
      addLog(`Permission: ${perm}`);
      if (perm !== 'granted') { addLog('Blocked — allow notifications in browser settings'); return; }

      addLog('Fetching VAPID public key…');
      const { publicKey } = await api.get<{ publicKey: string }>('/api/push/public-key');
      if (!publicKey) { addLog('ERROR: no public key from server'); return; }
      addLog(`Got key: ${publicKey.slice(0, 20)}…`);

      addLog('Waiting for service worker…');
      const reg = await navigator.serviceWorker.ready;
      addLog(`SW ready (scope: ${reg.scope})`);

      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        // Unsubscribe and re-subscribe to ensure keys match current VAPID config
        addLog('Clearing old subscription — re-subscribing with current VAPID key…');
        await existing.unsubscribe();
      }

      addLog('Subscribing to push…');
      const s = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as ArrayBuffer,
      });
      setSub(s);
      addLog(`Subscribed! Endpoint: ${s.endpoint.slice(0, 60)}…`);
    } catch (err) {
      addLog(`ERROR: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    if (!sub) { addLog('Subscribe first'); return; }
    setBusy(true);
    try {
      addLog('Sending test notification via server…');
      const json = sub.toJSON();
      const keys = json.keys as Record<string, string> | undefined;
      const res = await fetch('/api/push/test-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: json.endpoint,
          p256dh: keys?.p256dh ?? '',
          auth: keys?.auth ?? '',
        }),
      });
      const data = await res.json() as { ok?: boolean; error?: string; statusCode?: number; body?: string; headers?: Record<string, string> };
      if (data.ok) {
        addLog('Server sent! Watch for notification…');
      } else {
        addLog(`HTTP ${res.status} | push service status: ${data.statusCode ?? '?'}`);
        addLog(`Error: ${data.error ?? '(none)'}`);
        if (data.body) addLog(`Push service body: ${data.body}`);
        if (data.headers) addLog(`Push service headers: ${JSON.stringify(data.headers)}`);
        addLog(`Full response: ${JSON.stringify(data)}`);
      }
    } catch (err) {
      addLog(`ERROR: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function unsubscribe() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const s = await reg.pushManager.getSubscription();
      if (s) {
        await s.unsubscribe();
        setSub(null);
        addLog('Unsubscribed from push');
      } else {
        addLog('No active subscription found');
      }
    } catch (err) {
      addLog(`ERROR: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  const supported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;

  return (
    <div style={{ marginTop: 40, padding: '14px 16px', border: '1px solid #e0e0e0', borderRadius: 8, background: '#fafafa' }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: '#888', marginBottom: 10 }}>
        Push Notification Debug
      </div>
      {!supported && <p style={{ color: 'red', fontSize: 13 }}>Push not supported in this browser</p>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={subscribe} disabled={busy || !supported} style={btnStyle('#2D6CDF')}>
          Subscribe this device
        </button>
        <button onClick={sendTest} disabled={busy || !sub} style={btnStyle('#1F9D6B')}>
          Send notification
        </button>
        <button onClick={unsubscribe} disabled={busy || !sub} style={btnStyle('#E25241')}>
          Unsubscribe
        </button>
      </div>
      {sub && (
        <div style={{ marginTop: 8, fontSize: 11, color: '#666', wordBreak: 'break-all' }}>
          Subscribed: {sub.endpoint.slice(0, 70)}…
        </div>
      )}
      <div
        ref={logRef}
        style={{
          marginTop: 10, height: 120, overflowY: 'auto', background: '#111',
          color: '#0f0', fontFamily: 'monospace', fontSize: 11,
          padding: '8px 10px', borderRadius: 6, whiteSpace: 'pre-wrap',
        }}
      >
        {log.length === 0 ? <span style={{ color: '#555' }}>Log will appear here…</span> : log.join('\n')}
      </div>
    </div>
  );
}

function btnStyle(color: string): React.CSSProperties {
  return {
    background: color, color: '#fff', border: 'none', borderRadius: 6,
    padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  };
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token } = await api.post<{ token: string }>('/auth/login', { email, password });
      saveToken(token);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: '0 16px' }}>
      <h1>TH Dividend Calendar</h1>
      <h2>Sign in</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p>
        No account? <Link to="/register">Register</Link>
      </p>
      <PushDebugPanel />
    </div>
  );
}
