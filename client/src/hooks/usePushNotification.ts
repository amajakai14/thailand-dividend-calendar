import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

interface TestResult {
  ok: boolean;
  results?: Array<{ ok: boolean; statusCode?: number; message?: string }>;
  error?: string;
}

export function usePushNotification() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSupported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;

  useEffect(() => {
    if (!isSupported) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setEnabled(!!sub))
      .catch(() => {});
  }, [isSupported]);

  const enable = useCallback(async (): Promise<void> => {
    if (!isSupported) {
      setError('Push not supported in this browser');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { publicKey } = await api.get<{ publicKey: string }>('/api/push/public-key');
      if (!publicKey) throw new Error('Server push not configured');

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') throw new Error('Notification permission denied');

      const reg = await navigator.serviceWorker.ready;

      // Force re-subscribe to avoid stale VAPID key mismatch on server rotation
      const existing = await reg.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as ArrayBuffer,
      });

      const json = sub.toJSON();
      const keys = json.keys as Record<string, string> | undefined;
      await api.post('/api/push/subscription', {
        endpoint: json.endpoint,
        p256dh: keys?.p256dh ?? '',
        auth: keys?.auth ?? '',
      });
      setEnabled(true);
    } catch (err) {
      setError((err as Error).message);
      setEnabled(false);
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  const disable = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await api.delete(`/api/push/subscription?endpoint=${encodeURIComponent(endpoint)}`);
      }
      setEnabled(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const test = useCallback(async (): Promise<TestResult> => {
    setError(null);
    try {
      return await api.post<TestResult>('/api/push/test', {});
    } catch (err) {
      const msg = (err as Error).message;
      setError(msg);
      return { ok: false, error: msg };
    }
  }, []);

  return { enabled, loading, error, isSupported, enable, disable, test };
}
