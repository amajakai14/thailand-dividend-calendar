import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, saveToken } from '../services/api';
import { colors } from '../design/colors';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const C = colors(false);

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
    <div style={{
      width: '100%', flex: 1, minHeight: 0,
      background: C.bg, color: C.text,
      fontFamily: "'Inter', -apple-system, 'SF Pro Text', system-ui, sans-serif",
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      padding: 'var(--screen-pad)',
      borderRadius: 'clamp(16px, 4vw, 22px)',
      boxShadow: '0 1px 2px rgba(20,18,12,0.04), 0 12px 30px rgba(20,18,12,0.07)',
      border: `1px solid ${C.divider}`,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.2, color: C.muted, textTransform: 'uppercase', marginBottom: 4 }}>
        SET · Dividend Calendar
      </div>
      <h1 style={{
        fontSize: 'clamp(24px, 7vw, 30px)', fontWeight: 700, letterSpacing: -0.6,
        fontFamily: '"SF Pro Display", -apple-system, system-ui', marginBottom: 22,
      }}>Sign in</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="Email" C={C}>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
            style={inputStyle(C)} />
        </Field>
        <Field label="Password" C={C}>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
            style={inputStyle(C)} />
        </Field>

        {error && <div style={{ color: C.xd, fontSize: 12.5, fontWeight: 600 }}>{error}</div>}

        <button type="submit" disabled={loading} style={{
          marginTop: 6, appearance: 'none', border: 0, fontFamily: 'inherit',
          background: C.text, color: C.bg, borderRadius: 12, padding: '13px',
          fontWeight: 700, fontSize: 14, cursor: 'pointer',
          opacity: loading ? 0.6 : 1,
        }}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p style={{ marginTop: 18, fontSize: 13, color: C.muted, textAlign: 'center' }}>
        No account? <Link to="/register" style={{ color: C.today, fontWeight: 600, textDecoration: 'none' }}>Register</Link>
      </p>
    </div>
  );
}

function Field({ label, C, children }: { label: string; C: ReturnType<typeof colors>; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</span>
      {children}
    </label>
  );
}

function inputStyle(C: ReturnType<typeof colors>): React.CSSProperties {
  return {
    appearance: 'none', border: `1px solid ${C.divider}`, background: C.surface,
    color: C.text, borderRadius: 10, padding: '11px 12px',
    fontSize: 14, fontFamily: 'inherit', outline: 'none', width: '100%',
  };
}
