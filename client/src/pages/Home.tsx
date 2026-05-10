import { useNavigate } from 'react-router-dom';
import { clearToken } from '../services/api';
import Calendar from '../components/Calendar';

export default function Home() {
  const navigate = useNavigate();
  function logout() { clearToken(); navigate('/login'); }
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>TH Dividend Calendar</h1>
        <div>
          <a href="/portfolio" style={{ marginRight: 12, color: '#2563eb', textDecoration: 'none', padding: '6px 0' }}>Portfolio →</a>
          <button onClick={logout} style={{ padding: '6px 14px', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>
      <Calendar />
    </div>
  );
}
