export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return reg;
  } catch (err) {
    console.warn('Service worker registration failed', err);
    return null;
  }
}

export function isStandaloneDisplay() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

export async function updateAppBadge(count: number) {
  try {
    if ('setAppBadge' in navigator) {
      if (count > 0) await (navigator as Navigator & { setAppBadge: (n?: number) => Promise<void> }).setAppBadge(count);
      else await (navigator as Navigator & { clearAppBadge: () => Promise<void> }).clearAppBadge();
    }
  } catch {
    // Badge API unsupported or permission denied
  }
}

export async function shareContent(data: ShareData): Promise<boolean> {
  if (!navigator.share) return false;
  try {
    await navigator.share(data);
    return true;
  } catch {
    return false;
  }
}

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};
