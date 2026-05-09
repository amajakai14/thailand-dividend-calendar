const MONTH_MAP: Record<string, number> = {
  'ม.ค.': 1, 'ก.พ.': 2, 'มี.ค.': 3, 'เม.ย.': 4,
  'พ.ค.': 5, 'มิ.ย.': 6, 'ก.ค.': 7, 'ส.ค.': 8,
  'ก.ย.': 9, 'ต.ค.': 10, 'พ.ย.': 11, 'ธ.ค.': 12,
};

export function parseThaiDate(raw: string): string | null {
  if (!raw || raw.trim() === '-') return null;
  // Strip parenthetical suffix e.g. "(วันที่โดยประมาณการ)"
  const cleaned = raw.replace(/\s*\(.*?\)\s*$/, '').trim();
  const parts = cleaned.split(/\s+/);
  if (parts.length < 3) return null;
  const [day, monthThai, yearBE] = parts;
  const month = MONTH_MAP[monthThai];
  if (!month) return null;
  const year = parseInt(yearBE, 10) - 543;
  const mm = String(month).padStart(2, '0');
  const dd = String(parseInt(day, 10)).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export function parseCashPerShare(raw: string): number | null {
  if (!raw || raw.trim() === '-') return null;
  const match = raw.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : null;
}

export interface DividendRecord {
  ticker: string;
  company_name: string | null;
  xd_date: string | null;
  book_close_date: string | null;
  record_date: string | null;
  pay_date: string | null;
  approximate_pay_date: string | null;
  dividend_type: string | null;
  cash_per_share: number | null;
  tentative_dividend: number | null;
  period_start: string | null;
  period_end: string | null;
  dividend_from: string | null;
  scraped_at: string;
}
