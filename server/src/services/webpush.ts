import webpush, { PushSubscription, SendResult, WebPushError } from 'web-push';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY ?? '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? '';
const VAPID_EMAIL = process.env.VAPID_EMAIL ?? 'mailto:admin@example.com';

const configured = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);

if (configured) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log('[webpush] VAPID configured');
} else {
  console.warn('[webpush] VAPID keys missing — push disabled');
}

export interface StoredSub {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export type SendOutcome =
  | { ok: true; statusCode: number }
  | { ok: false; statusCode?: number; gone: boolean; message: string; body?: string };

export async function sendPush(sub: StoredSub, payload: unknown): Promise<SendOutcome> {
  if (!configured) {
    return { ok: false, gone: false, message: 'VAPID keys not configured' };
  }
  const subscription: PushSubscription = {
    endpoint: sub.endpoint,
    keys: { p256dh: sub.p256dh, auth: sub.auth },
  };
  try {
    const result: SendResult = await webpush.sendNotification(
      subscription,
      typeof payload === 'string' ? payload : JSON.stringify(payload)
    );
    return { ok: true, statusCode: result.statusCode };
  } catch (err) {
    if (err instanceof WebPushError) {
      const gone =
        err.statusCode === 404 ||
        err.statusCode === 410 ||
        err.statusCode === 403; // Apple Push: VAPID mismatch / bad JWT — sub no longer valid
      return {
        ok: false,
        statusCode: err.statusCode,
        gone,
        message: err.message,
        body: typeof err.body === 'string' ? err.body : undefined,
      };
    }
    const e = err as Error;
    return { ok: false, gone: false, message: e?.message ?? 'unknown error' };
  }
}

export { VAPID_PUBLIC_KEY, configured as vapidConfigured };
