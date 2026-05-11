import cron from 'node-cron';
import { getDB } from '../db/schema';
import { sendPush, StoredSub } from './webpush';

const LOOKAHEAD_DAYS = 3;

function pruneSubscription(endpoint: string): void {
  getDB().prepare(`DELETE FROM push_subscriptions WHERE endpoint = ?`).run(endpoint);
  console.warn('[notifications] pruned stale endpoint:', endpoint.slice(0, 60));
}

export function startNotificationCron(): void {
  cron.schedule('0 7 * * *', () => { void sendXDNotifications(); }, { timezone: 'Asia/Bangkok' });
  console.log('[notifications] cron scheduled daily 07:00 Asia/Bangkok');
}

export async function sendXDNotifications(): Promise<void> {
  const db = getDB();
  const today = new Date().toISOString().slice(0, 10);
  const future = new Date(Date.now() + LOOKAHEAD_DAYS * 86400_000).toISOString().slice(0, 10);

  const upcoming = db.prepare(
    `SELECT ticker, xd_date, cash_per_share
       FROM dividends
      WHERE xd_date >= ? AND xd_date <= ?
      ORDER BY xd_date ASC`
  ).all(today, future) as Array<{ ticker: string; xd_date: string; cash_per_share: number }>;

  console.log(`[notifications] ${upcoming.length} upcoming XD events in next ${LOOKAHEAD_DAYS}d`);

  for (const div of upcoming) {
    const watchers = db.prepare(
      `SELECT user_id FROM watchlist WHERE ticker = ?`
    ).all(div.ticker) as Array<{ user_id: number }>;

    for (const { user_id } of watchers) {
      const subs = db.prepare(
        `SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?`
      ).all(user_id) as StoredSub[];

      const payload = {
        title: `XD Alert: ${div.ticker}`,
        message: `XD on ${div.xd_date} · ฿${div.cash_per_share.toFixed(2)}/share`,
        ticker: div.ticker,
        xdDate: div.xd_date,
        cashPerShare: div.cash_per_share,
        url: '/',
      };

      for (const sub of subs) {
        const outcome = await sendPush(sub, payload);
        if (outcome.ok) {
          console.log(`[notifications] sent ${div.ticker} user=${user_id}`);
        } else {
          console.error(
            `[notifications] failed ${div.ticker} user=${user_id} status=${outcome.statusCode ?? '?'} msg="${outcome.message}"`
          );
          if (outcome.gone) pruneSubscription(sub.endpoint);
        }
      }
    }
  }
}
