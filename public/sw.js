const CACHE = 'cuotactrl-v1';
const PRECACHE_URLS = ['/', '/index.html', '/manifest.json', '/icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Push notification handler
self.addEventListener('push', (e) => {
  const data = e.data ? e.data.json() : {};
  const title = data.title ?? 'CuotaCtrl';
  const body = data.body ?? '';
  const url = data.url ?? '/';
  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      data: { url },
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = e.notification.data?.url ?? '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
      const c = cs.find((w) => w.url.includes(self.location.origin));
      if (c) return c.focus().then(w => w.navigate(url));
      return clients.openWindow(url);
    })
  );
});

self.addEventListener('fetch', (e) => {
  // Skip non-GET, Supabase API calls, and chrome-extension
  if (
    e.request.method !== 'GET' ||
    e.request.url.includes('supabase.co') ||
    e.request.url.startsWith('chrome-extension')
  ) return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') return response;
        const toCache = response.clone();
        caches.open(CACHE).then((c) => c.put(e.request, toCache));
        return response;
      });
    }).catch(() => caches.match('/index.html'))
  );
});
