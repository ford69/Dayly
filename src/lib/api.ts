import {
  cacheTasks,
  enqueueMutation,
  flushMutationQueue,
  readCachedTasks,
  type QueuedMutation,
} from './offlineStore';

export class OfflineError extends Error {
  offline = true;
  constructor(message = 'You are offline. Changes will sync when you reconnect.') {
    super(message);
    this.name = 'OfflineError';
  }
}

export function isOnline() {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { json?: unknown; offlineQueue?: boolean; offlineLabel?: string } = {}
): Promise<T> {
  const { json, headers, offlineQueue, offlineLabel, ...rest } = init;
  const method = (rest.method ?? 'GET').toUpperCase();

  if (!isOnline() && method !== 'GET') {
    if (offlineQueue) {
      await enqueueMutation({
        method: method as QueuedMutation['method'],
        path,
        body: json,
        label: offlineLabel ?? `${method} ${path}`,
      });
      throw new OfflineError();
    }
    throw new OfflineError('You are offline. Try again when you reconnect.');
  }

  try {
    const res = await fetch(path, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(headers ?? {}),
      },
      body: json === undefined ? undefined : JSON.stringify(json),
      ...rest,
    });

    const text = await res.text();
    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          res.status === 404
            ? 'API not found — the backend may not be deployed.'
            : `Server returned an invalid response (${res.status}).`
        );
      }
    }

    if (!res.ok) {
      const offlinePayload =
        data && typeof data === 'object' && 'offline' in data && (data as { offline?: boolean }).offline;
      if (res.status === 503 && offlinePayload) {
        throw new OfflineError();
      }
      const message =
        data && typeof data === 'object' && 'error' in data && typeof (data as { error: unknown }).error === 'string'
          ? (data as { error: string }).error
          : `Request failed (${res.status})`;
      throw new Error(message);
    }

    return data as T;
  } catch (err) {
    if (err instanceof OfflineError) throw err;
    if (!isOnline() || (err instanceof TypeError && String(err.message).includes('fetch'))) {
      if (method === 'GET' && path.startsWith('/api/tasks')) {
        const cached = await readCachedTasks();
        if (cached.length) return { tasks: cached } as T;
      }
      if (offlineQueue && method !== 'GET') {
        await enqueueMutation({
          method: method as QueuedMutation['method'],
          path,
          body: json,
          label: offlineLabel ?? `${method} ${path}`,
        });
        throw new OfflineError();
      }
      throw new OfflineError();
    }
    throw err;
  }
}

export async function syncQueuedMutations() {
  if (!isOnline()) return { flushed: 0, remaining: 0 };
  return flushMutationQueue(async (item) => {
    const res = await fetch(item.path, {
      method: item.method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: item.body === undefined ? undefined : JSON.stringify(item.body),
    });
    if (!res.ok) throw new Error(`Sync failed (${res.status})`);
  });
}

export async function rememberTasksCache(tasks: unknown[]) {
  try {
    await cacheTasks(tasks);
  } catch {
    // IndexedDB may be unavailable in private mode
  }
}
