/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: unknown[] };

self.addEventListener('install', (event: ExtendableEvent) => {
  // vite-plugin-pwa injectManifest injection point — must stay in compiled output
  event.waitUntil(Promise.resolve(self.__WB_MANIFEST).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;
  const payload = event.data.json() as { ticker: string; xdDate: string; cashPerShare: number };
  event.waitUntil(
    self.registration.showNotification(`XD Alert: ${payload.ticker}`, {
      body: `XD Date: ${payload.xdDate} · ฿${payload.cashPerShare}/share`,
      icon: '/icon-192.png',
      tag: `xd-${payload.ticker}`,
    })
  );
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow('/'));
});
