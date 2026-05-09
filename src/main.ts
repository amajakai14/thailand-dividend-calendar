import { scrape } from './scraper';
import { initDB, upsertDividends } from './db';
import { logger } from './logger';

export async function run(): Promise<void> {
  logger.info('Scrape start');
  try {
    const raw = await scrape();
    logger.info(`Scraped ${raw.length} raw records`);
    const db = initDB();
    const count = upsertDividends(db, raw);
    db.close();
    logger.info(`Done. ${count} records upserted.`);
  } catch (err) {
    logger.error(`Scrape failed: ${String(err)}`);
    logger.warn('Existing DB data preserved.');
  }
}

run();
