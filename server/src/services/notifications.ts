import cron from 'node-cron';
import { getDB } from '../db/schema';
import { webpush } from './webpush';

export async function testNotification(userId: number): Promise<void> {
  const db = getDB();
  const subs = db.prepare(
    `SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?`
  ).all(userId) as Array<{ endpoint: string; p256dh: string; auth: string }>;

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ message: 'this is Welcome to Div Application' })
      );
    } catch (err) {
      console.error('[notifications] test push failed:', err);
    }
  }
}

export function startNotificationCron(): void {
  // 07:00 Bangkok time daily
  cron.schedule('0 7 * * *', () => { void sendXDNotifications(); }, { timezone: 'Asia/Bangkok' });
  console.log('[notifications] cron scheduled at 07:00 Bangkok time');
}

export async function sendXDNotifications(): Promise<void> {
  const db = getDB();
  const today = new Date().toISOString().slice(0, 10);
  const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const upcoming = db.prepare(
    `SELECT ticker, xd_date, cash_per_share FROM dividends WHERE xd_date >= ? AND xd_date <= ? ORDER BY xd_date ASC`
  ).all(today, future) as Array<{ ticker: string; xd_date: string; cash_per_share: number }>;

  for (const div of upcoming) {
    const watchers = db.prepare(
      `SELECT user_id FROM watchlist WHERE ticker = ?`
    ).all(div.ticker) as Array<{ user_id: number }>;

    for (const { user_id } of watchers) {
      const subs = db.prepare(
        `SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?`
      ).all(user_id) as Array<{ endpoint: string; p256dh: string; auth: string }>;

      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({ ticker: div.ticker, xdDate: div.xd_date, cashPerShare: div.cash_per_share })
          );
        } catch (err) {
          console.error(`[notifications] push failed for ${div.ticker} user ${user_id}:`, err);
        }
      }
    }
  }
}
