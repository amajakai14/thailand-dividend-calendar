import cron from 'node-cron';
import { run } from './main';
import { logger } from './logger';

logger.info('Scheduler started. Fires daily at 07:00 Asia/Bangkok.');

cron.schedule('0 7 * * *', () => {
  run();
}, { timezone: 'Asia/Bangkok' });
