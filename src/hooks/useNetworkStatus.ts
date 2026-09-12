import { useEffect, useState } from 'react';
import { isOnline, syncQueuedMutations } from '../lib/api';
import { listMutations } from '../lib/offlineStore';

export function useNetworkStatus() {
  const [online, setOnline] = useState(isOnline());
  const [pendingSync, setPendingSync] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refreshPending = async () => {
    try {
      setPendingSync((await listMutations()).length);
    } catch {
      setPendingSync(0);
    }
  };

  const flush = async () => {
    if (!isOnline()) return;
    setSyncing(true);
    try {
      await syncQueuedMutations();
      await refreshPending();
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    void refreshPending();

    const onOnline = () => {
      setOnline(true);
      void flush();
    };
    const onOffline = () => setOnline(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'DAYLY_BACKGROUND_SYNC') void flush();
    };
    navigator.serviceWorker?.addEventListener('message', onMessage);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      navigator.serviceWorker?.removeEventListener('message', onMessage);
    };
  }, []);

  return { online, pendingSync, syncing, flush, refreshPending };
}
