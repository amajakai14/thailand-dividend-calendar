import { Colors } from '../design/colors';

interface Props {
  C: Colors;
  active: 'calendar' | 'dashboard' | 'profile';
  onNavigate: (id: string) => void;
}

const ITEMS = [
  {
    id: 'calendar',
    label: 'Calendar',
    icon: (col: string) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="4.5" width="16" height="14.5" rx="2.6" stroke={col} strokeWidth="1.7"/>
        <path d="M3 9h16" stroke={col} strokeWidth="1.7" strokeLinecap="round"/>
        <path d="M7 2.5v3M15 2.5v3" stroke={col} strokeWidth="1.7" strokeLinecap="round"/>
        <circle cx="11" cy="13.5" r="1.4" fill={col}/>
      </svg>
    ),
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (col: string) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="11" width="4" height="8" rx="1.4" stroke={col} strokeWidth="1.7"/>
        <rect x="9" y="7" width="4" height="12" rx="1.4" stroke={col} strokeWidth="1.7"/>
        <rect x="15" y="3" width="4" height="16" rx="1.4" stroke={col} strokeWidth="1.7"/>
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: (col: string) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="8" r="3.6" stroke={col} strokeWidth="1.7"/>
        <path d="M3.8 19c1.1-3.6 4-5.7 7.2-5.7s6.1 2.1 7.2 5.7" stroke={col} strokeWidth="1.7" strokeLinecap="round"/>
      </svg>
    ),
  },
] as const;

export default function TabBar({ C, active, onNavigate }: Props) {
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, height: 64,
      background: C.surface, borderTop: `1px solid ${C.divider}`,
      display: 'flex', alignItems: 'stretch', justifyContent: 'space-around',
      zIndex: 40, paddingBottom: 6,
    }}>
      {ITEMS.map(({ id, label, icon }) => {
        const on = active === id;
        const col = on ? C.today : C.muted;
        return (
          <button key={id} onClick={() => onNavigate(id)} style={{
            flex: 1, appearance: 'none', border: 0, background: 'transparent',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 3, cursor: 'pointer', fontFamily: 'inherit', padding: 0,
          }}>
            {icon(col)}
            <span style={{ fontSize: 10.5, fontWeight: on ? 700 : 600, color: col, letterSpacing: 0.2 }}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
