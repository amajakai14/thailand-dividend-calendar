import cron from 'node-cron';
import Expo, { ExpoPushMessage } from 'expo-server-sdk';
import { getDB } from '../db/schema';
import { sendPush, StoredSub } from './webpush';

const expoClient = new Expo();

const LOOKAHEAD_DAYS = 3;

async function sendExpoNotifications(
  ticker: string,
  xdDate: string,
  cashPerShare: number,
  daysUntil: number
): Promise<void> {
  const db = getDB();
  const rows = db.prepare(`
    SELECT ept.token
    FROM expo_push_tokens ept
    JOIN watchlist w ON w.user_id = ept.user_id
    WHERE w.ticker = ?
  `).all(ticker) as { token: string }[];

  const validTokens = rows.map(r => r.token).filter(t => Expo.isExpoPushToken(t));
  if (validTokens.length === 0) return;

  const messages: ExpoPushMessage[] = validTokens.map(to => ({
    to,
    sound: 'default' as const,
    title: `${ticker} XD in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
    body: `฿${cashPerShare.toFixed(2)}/share · XD date: ${xdDate}`,
    data: { ticker, xdDate, cashPerShare },
  }));

  const chunks = expoClient.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    const tickets = await expoClient.sendPushNotificationsAsync(chunk);
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      if (ticket.status === 'error') {
        console.error(`[notifications] expo push error for ${ticker}: ${ticket.message}`);
        if ((ticket as any).details?.error === 'DeviceNotRegistered') {
          db.prepare('DELETE FROM expo_push_tokens WHERE token = ?').run(validTokens[i]);
          console.warn('[notifications] pruned unregistered expo token:', validTokens[i].slice(0, 40));
        }
      }
    }
  }
  console.log(`[notifications] expo push sent ${ticker} to ${validTokens.length} device(s)`);
}

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
    const daysUntil = Math.ceil(
      (new Date(div.xd_date).getTime() - Date.now()) / 86400_000
    );

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

    await sendExpoNotifications(div.ticker, div.xd_date, div.cash_per_share, daysUntil);
  }
}
