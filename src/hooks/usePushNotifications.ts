import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) {
          reg.pushManager.getSubscription().then(sub => {
            setSubscribed(!!sub);
          });
        }
      });
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return;
    }
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return;

      const reg = await navigator.serviceWorker.ready;

      // VAPID public key must be set in env: VITE_VAPID_PUBLIC_KEY
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.warn('VITE_VAPID_PUBLIC_KEY not set — push disabled');
        return;
      }

      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        setSubscribed(true);
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      if (user) {
        await supabase.from('push_subscriptions').upsert({
          user_id: user.id,
          endpoint: sub.endpoint,
          subscription_json: JSON.stringify(sub.toJSON()),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      }

      setSubscribed(true);
    } catch (err) {
      console.error('Push subscription error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const unsubscribe = useCallback(async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        if (user) {
          await supabase.from('push_subscriptions').delete().eq('user_id', user.id);
        }
      }
      setSubscribed(false);
    } catch (err) {
      console.error('Unsubscribe error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  return { permission, subscribed, loading, subscribe, unsubscribe };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}
