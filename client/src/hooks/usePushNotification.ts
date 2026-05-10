import { useState } from 'react';
import { api } from '../services/api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

export function usePushNotification() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSupported = typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window;

  async function enable(): Promise<void> {
    if (!isSupported) { setError('Push notifications not supported in this browser.'); return; }
    setLoading(true);
    setError(null);
    try {
      console.log('[push] starting enable...');
      const { publicKey } = await api.get<{ publicKey: string }>('/api/push/public-key');
      console.log('[push] got publicKey:', publicKey ? 'yes' : 'no');
      if (!publicKey) throw new Error('Server push not configured');
      const permission = await Notification.requestPermission();
      console.log('[push] permission:', permission);
      if (permission !== 'granted') throw new Error('Notification permission denied');
      console.log('[push] waiting for SW...');
      const reg = await navigator.serviceWorker.ready;
      console.log('[push] SW ready, subscribing...');
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as ArrayBuffer,
      });
      console.log('[push] subscribed:', sub.endpoint.slice(0, 50));
      const json = sub.toJSON();
      const keys = json.keys as Record<string, string> | undefined;
      await api.post('/api/push/subscription', {
        endpoint: json.endpoint,
        p256dh: keys?.p256dh ?? '',
        auth: keys?.auth ?? '',
      });
      console.log('[push] subscription posted to server');
      setEnabled(true);
    } catch (err) {
      const msg = (err as Error).message;
      console.error('[push] error:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function disable(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      await api.delete('/api/push/subscription');
      setEnabled(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return { enabled, loading, error, isSupported, enable, disable };
}
