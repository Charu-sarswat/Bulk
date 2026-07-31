import { useState, useEffect } from 'react';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_PUBLIC_VAPID_KEY;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper to convert base64 key to Uint8Array required by PushManager
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications(token) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState(Notification.permission);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported && token) {
      checkExistingSubscription();
    }
  }, [token]);

  const checkExistingSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    } catch (err) {
      console.error('Error checking push subscription:', err);
    }
  };

  const subscribeUser = async () => {
    if (!isSupported || !token) return;
    setLoading(true);

    try {
      // 1. Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        throw new Error('Permission not granted for notifications');
      }

      // 2. Register Service Worker explicitly if not already active
      let registration = await navigator.serviceWorker.getRegistration('/sw.js');
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      }

      // Ensure ready
      await navigator.serviceWorker.ready;

      // 3. Subscribe user to PushManager
      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      };

      const newSub = await registration.pushManager.subscribe(subscribeOptions);
      setSubscription(newSub);

      // 4. Save to backend database
      await fetch(`${API_URL}/api/auth/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subscription: newSub })
      });

      return true;
    } catch (err) {
      console.error('Failed to subscribe user to push notifications:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const unsubscribeUser = async () => {
    if (!subscription || !token) return;
    setLoading(true);

    try {
      // Delete on backend
      await fetch(`${API_URL}/api/auth/push/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      });

      // Unsubscribe on browser
      await subscription.unsubscribe();
      setSubscription(null);
      return true;
    } catch (err) {
      console.error('Failed to unsubscribe user:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    isSupported,
    permission,
    subscription,
    subscribeUser,
    unsubscribeUser,
    loading
  };
}
