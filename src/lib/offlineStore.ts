const DB_NAME = 'dayly-offline';
const DB_VERSION = 1;
const STORE_TASKS = 'tasks';
const STORE_QUEUE = 'mutation_queue';
const STORE_META = 'meta';

export type QueuedMutation = {
  id: string;
  method: 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: unknown;
  createdAt: number;
  label: string;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_TASKS)) db.createObjectStore(STORE_TASKS, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORE_QUEUE)) db.createObjectStore(STORE_QUEUE, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORE_META)) db.createObjectStore(STORE_META, { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function cacheTasks(tasks: unknown[]) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_TASKS, 'readwrite');
    const store = tx.objectStore(STORE_TASKS);
    store.clear();
    for (const task of tasks) store.put(task);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  await setMeta('tasks_cached_at', Date.now());
}

export async function readCachedTasks<T = unknown>(): Promise<T[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_TASKS, 'readonly');
    const req = tx.objectStore(STORE_TASKS).getAll();
    req.onsuccess = () => resolve((req.result as T[]) ?? []);
    req.onerror = () => reject(req.error);
  });
}

export async function upsertCachedTask(task: { id: string }) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_TASKS, 'readwrite');
    tx.objectStore(STORE_TASKS).put(task);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function removeCachedTask(id: string) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_TASKS, 'readwrite');
    tx.objectStore(STORE_TASKS).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function enqueueMutation(mutation: Omit<QueuedMutation, 'id' | 'createdAt'>) {
  const item: QueuedMutation = {
    ...mutation,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_QUEUE, 'readwrite');
    tx.objectStore(STORE_QUEUE).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  await requestBackgroundSync();
  return item;
}

export async function listMutations(): Promise<QueuedMutation[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_QUEUE, 'readonly');
    const req = tx.objectStore(STORE_QUEUE).getAll();
    req.onsuccess = () =>
      resolve(((req.result as QueuedMutation[]) ?? []).sort((a, b) => a.createdAt - b.createdAt));
    req.onerror = () => reject(req.error);
  });
}

export async function removeMutation(id: string) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_QUEUE, 'readwrite');
    tx.objectStore(STORE_QUEUE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function setMeta(key: string, value: unknown) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_META, 'readwrite');
    tx.objectStore(STORE_META).put({ key, value });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getMeta<T>(key: string): Promise<T | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_META, 'readonly');
    const req = tx.objectStore(STORE_META).get(key);
    req.onsuccess = () => resolve((req.result?.value as T) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function flushMutationQueue(
  send: (m: QueuedMutation) => Promise<void>
): Promise<{ flushed: number; remaining: number }> {
  const queue = await listMutations();
  let flushed = 0;
  for (const item of queue) {
    try {
      await send(item);
      await removeMutation(item.id);
      flushed++;
    } catch {
      break;
    }
  }
  const remaining = (await listMutations()).length;
  return { flushed, remaining };
}

async function requestBackgroundSync() {
  try {
    const reg = await navigator.serviceWorker?.ready;
    // @ts-expect-error SyncManager is not in all TS libs
    if (reg?.sync) await reg.sync.register('dayly-sync');
  } catch {
    // Background Sync not available — online listener will flush
  }
}
