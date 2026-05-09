import { chromium } from 'playwright';
import { DividendRecord, parseThaiDate } from './parser';
import { logger } from './logger';

const PAGE_URL = 'https://www.set.or.th/th/market/stock-calendar/x-calendar';
const API_PATTERN = /\/api\/set\/stock-calendar\/\d+\/\d+\/x-calendar/;

interface ApiCorporateAction {
  symbol: string;
  name: string;
  xdate: string | null;
  bookCloseDate: string | null;
  recordDate: string | null;
  paymentDate: string | null;
  approximatePaymentDate: string | null;
  dividendType: string | null;
  dividend: number | null;
  tentativeDividendFlag: string | null;
  tentativeDividend: string | null;
  beginOperation: string | null;
  endOperation: string | null;
  sourceOfDividend: string | null;
}

interface ApiDay {
  date: string;
  types: Array<{
    type: string;
    corporateActions: ApiCorporateAction[];
  }>;
}

function toISO(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const s = dateStr.trim();
  // ISO datetime — strip time component
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.split('T')[0];
  // Thai date string (with or without parenthetical suffix)
  return parseThaiDate(s);
}

export async function scrape(): Promise<DividendRecord[]> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let apiData: ApiDay[] | null = null;

  page.on('response', async (response) => {
    if (API_PATTERN.test(response.url())) {
      try {
        apiData = await response.json();
        logger.info(`Captured API response from ${response.url()}`);
      } catch (err) {
        logger.warn(`Failed to parse API response: ${String(err)}`);
      }
    }
  });

  try {
    logger.info(`Loading ${PAGE_URL}`);
    await page.goto(PAGE_URL, { waitUntil: 'networkidle', timeout: 60000 });

    if (!apiData) {
      throw new Error('API response not captured — page may have changed');
    }

    const scrapedAt = new Date().toISOString();
    const records: DividendRecord[] = [];
    const days = apiData as ApiDay[];

    for (const day of days) {
      for (const typeGroup of day.types) {
        if (typeGroup.type !== 'XD') continue;
        for (const ca of typeGroup.corporateActions) {
          records.push({
            ticker: ca.symbol,
            company_name: ca.name || null,
            xd_date: toISO(ca.xdate),
            book_close_date: toISO(ca.bookCloseDate),
            record_date: toISO(ca.recordDate),
            pay_date: toISO(ca.paymentDate),
            approximate_pay_date: toISO(ca.approximatePaymentDate),
            dividend_type: ca.dividendType || null,
            cash_per_share: ca.dividend ?? null,
            tentative_dividend: ca.tentativeDividend ? parseFloat(ca.tentativeDividend) : null,
            period_start: toISO(ca.beginOperation),
            period_end: toISO(ca.endOperation),
            dividend_from: ca.sourceOfDividend || null,
            scraped_at: scrapedAt,
          });
        }
      }
    }

    logger.info(`Parsed ${records.length} XD records`);
    return records;

  } finally {
    await browser.close();
  }
}
