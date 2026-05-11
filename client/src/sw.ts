/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: unknown[] };

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(Promise.resolve(self.__WB_MANIFEST).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(self.clients.claim());
});

interface PushPayload {
  title?: string;
  message?: string;
  ticker?: string;
  xdDate?: string;
  cashPerShare?: number;
  url?: string;
}

function parsePayload(event: PushEvent): PushPayload {
  if (!event.data) return {};
  try {
    return event.data.json() as PushPayload;
  } catch {
    return { message: event.data.text() };
  }
}

self.addEventListener('push', (event: PushEvent) => {
  const payload = parsePayload(event);
  const title =
    payload.title ??
    (payload.ticker ? `XD Alert: ${payload.ticker}` : 'TH Div Calendar');
  const body =
    payload.message ??
    (payload.ticker && payload.xdDate
      ? `XD on ${payload.xdDate}${payload.cashPerShare != null ? ` · ฿${payload.cashPerShare}/share` : ''}`
      : 'New dividend update');

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: payload.ticker ? `xd-${payload.ticker}` : 'th-div',
      data: { url: payload.url ?? '/' },
    })
  );
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const target = (event.notification.data && (event.notification.data.url as string)) || '/';
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of all) {
      if ('focus' in client) {
        await client.focus();
        if ('navigate' in client && client.url !== target) {
          try { await (client as WindowClient).navigate(target); } catch { /* cross-origin */ }
        }
        return;
      }
    }
    await self.clients.openWindow(target);
  })());
});
