const BASE = '';

function getToken(): string | null {
  return localStorage.getItem('token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: authHeaders(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) {
    throw Object.assign(new Error(data.error ?? 'Request failed'), {
      status: res.status,
      data,
    });
  }
  return data as T;
}

export const api = {
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  get: <T>(path: string) => request<T>('GET', path),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

export function saveToken(token: string): void {
  localStorage.setItem('token', token);
}

export function clearToken(): void {
  localStorage.removeItem('token');
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export interface DividendRecord {
  ticker: string;
  company_name: string;
  xd_date: string;
  book_close_date: string;
  record_date: string;
  pay_date: string;
  approximate_pay_date: string | null;
  dividend_type: string;
  cash_per_share: number;
  tentative_dividend: number | null;
  period_start: string;
  period_end: string;
  dividend_from: string;
}

export interface DividendsResponse {
  month: number;
  year: number;
  count: number;
  data: DividendRecord[];
}
