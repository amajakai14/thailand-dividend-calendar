import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { DividendRecord } from './parser';

const DB_PATH = path.resolve(__dirname, '../data/dividends.db');

export function initDB(): Database.Database {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS dividends (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker          TEXT NOT NULL,
      company_name    TEXT,
      xd_date         TEXT,
      book_close_date TEXT,
      record_date     TEXT,
      pay_date        TEXT,
      approximate_pay_date TEXT,
      dividend_type   TEXT,
      cash_per_share  REAL,
      tentative_dividend REAL,
      period_start    TEXT,
      period_end      TEXT,
      dividend_from   TEXT,
      scraped_at      TEXT NOT NULL,
      UNIQUE(ticker, xd_date)
    )
  `);
  try {
    db.exec(`ALTER TABLE dividends ADD COLUMN approximate_pay_date TEXT`);
  } catch {
    // column already exists
  }
  try {
    db.exec(`ALTER TABLE dividends ADD COLUMN tentative_dividend REAL`);
  } catch {
    // column already exists
  }
  return db;
}

export function upsertDividends(db: Database.Database, records: DividendRecord[]): number {
  const stmt = db.prepare(`
    INSERT INTO dividends
      (ticker, company_name, xd_date, book_close_date, record_date, pay_date, approximate_pay_date,
       dividend_type, cash_per_share, tentative_dividend, period_start, period_end, dividend_from, scraped_at)
    VALUES
      (@ticker, @company_name, @xd_date, @book_close_date, @record_date, @pay_date, @approximate_pay_date,
       @dividend_type, @cash_per_share, @tentative_dividend, @period_start, @period_end, @dividend_from, @scraped_at)
    ON CONFLICT(ticker, xd_date) DO UPDATE SET
      company_name    = excluded.company_name,
      book_close_date = excluded.book_close_date,
      record_date     = excluded.record_date,
      pay_date        = excluded.pay_date,
      approximate_pay_date = excluded.approximate_pay_date,
      dividend_type   = excluded.dividend_type,
      cash_per_share  = excluded.cash_per_share,
      tentative_dividend = excluded.tentative_dividend,
      period_start    = excluded.period_start,
      period_end      = excluded.period_end,
      dividend_from   = excluded.dividend_from,
      scraped_at      = excluded.scraped_at
  `);
  const upsertMany = db.transaction((recs: DividendRecord[]) => {
    for (const r of recs) stmt.run(r);
  });
  upsertMany(records);
  return records.length;
}
