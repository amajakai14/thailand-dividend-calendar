import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database | null = null;

export function resetDB(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function getDB(): Database.Database {
  if (db) return db;
  const dbPath = process.env.DB_PATH ?? path.resolve(__dirname, '../../../data/dividends.db');
  db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS portfolios (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ticker   TEXT NOT NULL,
      quantity REAL NOT NULL,
      UNIQUE(user_id, ticker)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS watchlist (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ticker  TEXT NOT NULL,
      UNIQUE(user_id, ticker)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      endpoint   TEXT NOT NULL UNIQUE,
      p256dh     TEXT NOT NULL,
      auth       TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS expo_push_tokens (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token      TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS dividends (
      id                   INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker               TEXT NOT NULL,
      company_name         TEXT,
      xd_date              TEXT NOT NULL,
      book_close_date      TEXT,
      record_date          TEXT,
      pay_date             TEXT,
      approximate_pay_date TEXT,
      dividend_type        TEXT,
      cash_per_share       REAL,
      tentative_dividend   REAL,
      period_start         TEXT,
      period_end           TEXT,
      dividend_from        TEXT,
      UNIQUE(ticker, xd_date)
    )
  `);

  return db;
}
