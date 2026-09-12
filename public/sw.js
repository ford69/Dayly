/* Dayly service worker — offline shell, API cache, sync, push */
const CACHE_VERSION = 'dayly-v1';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const DATA_CACHE = `${CACHE_VERSION}-data`;

const SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/dayly.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !k.startsWith(CACHE_VERSION)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

function isApiGet(request) {
  const url = new URL(request.url);
  return request.method === 'GET' && url.pathname.startsWith('/api/');
}

function isNavigation(request) {
  return request.mode === 'navigate';
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  if (isNavigation(request)) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put('/index.html', copy));
          return res;
        })
        .catch(async () => (await caches.match('/index.html')) || (await caches.match('/')))
    );
    return;
  }

  if (isApiGet(request)) {
    event.respondWith(networkFirstApi(request));
    return;
  }

  if (request.method === 'GET') {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetched = fetch(request)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
            }
            return res;
          })
          .catch(() => cached);
        return cached || fetched;
      })
    );
  }
});

async function networkFirstApi(request) {
  const cache = await caches.open(DATA_CACHE);
  try {
    const res = await fetch(request);
    if (res.ok) await cache.put(request, res.clone());
    return res;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'Offline', offline: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'dayly-sync') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        for (const client of clients) {
          client.postMessage({ type: 'DAYLY_BACKGROUND_SYNC' });
        }
      })
    );
  }
});

self.addEventListener('push', (event) => {
  let payload = {
    title: 'Dayly',
    body: 'You have an update',
    url: '/',
  };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    if (event.data) payload.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: payload.url || '/' },
      actions: payload.actions || [],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/';
  const action = event.action;

  let url = target;
  if (action === 'focus') url = '/?action=focus';
  if (action === 'plan') url = '/?action=today';
  if (action === 'replan') url = '/?action=today&replan=1';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.postMessage({ type: 'DAYLY_NOTIFICATION_CLICK', url });
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
