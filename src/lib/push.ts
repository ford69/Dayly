/** Optional Web Push registration when VITE_VAPID_PUBLIC_KEY is configured. */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  if (!vapidKey || !('serviceWorker' in navigator) || !('PushManager' in window)) return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;

  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });

  try {
    await fetch('/api/alerts/push-subscribe', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    });
  } catch {
    // Backend may not be configured yet — subscription still works locally via SW
  }

  return subscription;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}
