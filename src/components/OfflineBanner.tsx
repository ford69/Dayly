import { CloudOff, RefreshCw } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export function OfflineBanner() {
  const { online, pendingSync, syncing, flush } = useNetworkStatus();

  if (online && pendingSync === 0) return null;

  return (
    <div
      className={`sticky top-14 sm:top-16 z-30 px-3 sm:px-6 py-2 text-xs font-medium border-b ${
        online
          ? 'bg-amber-50 border-amber-200 text-amber-800'
          : 'bg-slate-900 border-slate-800 text-slate-100'
      }`}
      role="status"
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <CloudOff className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {online
              ? `${pendingSync} change${pendingSync === 1 ? '' : 's'} waiting to sync`
              : 'You’re offline. Your tasks are still available.'}
          </span>
        </div>
        {online && pendingSync > 0 && (
          <button
            type="button"
            onClick={() => void flush()}
            disabled={syncing}
            className="inline-flex items-center gap-1 shrink-0 underline underline-offset-2"
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
            Sync now
          </button>
        )}
      </div>
    </div>
  );
}
