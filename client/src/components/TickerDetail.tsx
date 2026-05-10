import { DividendRecord } from '../services/api';

interface Props {
  record: DividendRecord | null;
  onClose: () => void;
}

export default function TickerDetail({ record, onClose }: Props) {
  if (!record) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: 24,
          maxWidth: 400,
          width: '90%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'none',
            border: 'none',
            fontSize: 20,
            cursor: 'pointer',
            color: '#6b7280',
            lineHeight: 1,
            padding: '4px 8px',
          }}
        >
          ×
        </button>

        <div style={{ marginBottom: 4 }}>
          <span style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>
            {record.ticker}
          </span>
        </div>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
          {record.company_name}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Row label="Cash Per Share">
            <span style={{ fontWeight: 600, color: '#111827' }}>
              ฿{record.cash_per_share.toFixed(4)}
            </span>
          </Row>
          <Row label="Pay Date">
            <span>{record.pay_date}</span>
          </Row>
          <Row label="XD Date">
            <span>{record.xd_date}</span>
          </Row>
          <Row label="Period">
            <span>{record.period_start} – {record.period_end}</span>
          </Row>
          <Row label="Type">
            <span>{record.dividend_type}</span>
          </Row>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
      <span style={{ color: '#6b7280', minWidth: 110 }}>{label}</span>
      <span style={{ color: '#111827', textAlign: 'right' }}>{children}</span>
    </div>
  );
}
