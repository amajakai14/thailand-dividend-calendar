/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

// Required by vite-plugin-pwa injectManifest — injects precache list at build time
// eslint-disable-next-line @typescript-eslint/no-explicit-any
void (self as any).__WB_MANIFEST;

self.addEventListener('install', () => self.skipWaiting());
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
