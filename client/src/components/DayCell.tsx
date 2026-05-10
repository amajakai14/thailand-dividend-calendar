import { DividendRecord } from '../services/api';

interface Props {
  day: number;
  xdRecords: DividendRecord[];
  payRecords: DividendRecord[];
  onSelectTicker: (record: DividendRecord) => void;
  isToday: boolean;
}

const MAX_CHIPS = 4;

export default function DayCell({ day, xdRecords, payRecords, onSelectTicker, isToday }: Props) {
  if (day === 0) {
    return (
      <div
        style={{
          border: '1px solid transparent',
          minHeight: 80,
        }}
      />
    );
  }

  const allChips: Array<{ record: DividendRecord; type: 'xd' | 'pay' }> = [
    ...xdRecords.map(r => ({ record: r, type: 'xd' as const })),
    ...payRecords.map(r => ({ record: r, type: 'pay' as const })),
  ];

  const visible = allChips.slice(0, MAX_CHIPS);
  const overflow = allChips.length - MAX_CHIPS;

  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        minHeight: 80,
        padding: 4,
        position: 'relative',
        backgroundColor: isToday ? '#eff6ff' : '#fff',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 4,
          right: 6,
          fontSize: 12,
          color: isToday ? '#1d4ed8' : '#9ca3af',
          fontWeight: isToday ? 700 : 400,
        }}
      >
        {day}
      </div>

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {visible.map(({ record, type }, i) => (
          <button
            key={`${type}-${record.ticker}-${i}`}
            onClick={() => onSelectTicker(record)}
            style={{
              display: 'inline-block',
              padding: '1px 5px',
              borderRadius: 9999,
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer',
              border: 'none',
              textAlign: 'left',
              backgroundColor: type === 'xd' ? '#fee2e2' : '#dcfce7',
              color: type === 'xd' ? '#b91c1c' : '#15803d',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
            }}
          >
            {record.ticker}
          </button>
        ))}
        {overflow > 0 && (
          <span style={{ fontSize: 11, color: '#6b7280', paddingLeft: 2 }}>
            +{overflow} more
          </span>
        )}
      </div>
    </div>
  );
}
