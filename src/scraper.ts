import { chromium } from 'playwright';
import { DividendRecord, parseThaiDate } from './parser';
import { logger } from './logger';
import { applyStealthPatches } from './stealth';

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
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 },
    locale: 'th-TH',
    timezoneId: 'Asia/Bangkok',
    extraHTTPHeaders: {
      'Accept-Language': 'th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7',
    },
  });
  await applyStealthPatches(context);
  const page = await context.newPage();

  try {
    logger.info(`Loading ${PAGE_URL}`);
    let apiResponse: Awaited<ReturnType<typeof page.waitForResponse>>;
    try {
      [apiResponse] = await Promise.all([
        page.waitForResponse(r => API_PATTERN.test(r.url()), { timeout: 90000 }),
        page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 90000 }),
      ]);
    } catch (err) {
      await page.screenshot({ path: 'logs/waf-block.png', fullPage: true }).catch(() => {});
      logger.error(`Page load or API intercept failed. Screenshot saved to logs/waf-block.png`);
      throw err;
    }

    let apiData: ApiDay[];
    try {
      apiData = await apiResponse.json();
      logger.info(`Captured API response from ${apiResponse.url()}`);
    } catch (err) {
      await page.screenshot({ path: 'logs/waf-block.png', fullPage: true }).catch(() => {});
      throw new Error(`API response not JSON — WAF may have blocked: ${String(err)}`);
    }

    const scrapedAt = new Date().toISOString();
    const records: DividendRecord[] = [];

    for (const day of apiData) {
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
