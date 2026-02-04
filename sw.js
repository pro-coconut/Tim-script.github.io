const STATIC_CACHE = 'sb-static-v2';
const RUNTIME_CACHE = 'sb-runtime-v2';

const PRECACHE = [
  '/',
  '/index.html',
  '/view.html',
  '/downloads.html'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => ![STATIC_CACHE, RUNTIME_CACHE].includes(k))
            .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Cache HTML crawl từ allorigins (proxy)
  if (url.hostname.includes('allorigins.win')) {
    e.respondWith(
      caches.open(RUNTIME_CACHE).then(async cache => {
        try {
          const fresh = await fetch(e.request);
          cache.put(e.request, fresh.clone());
          return fresh;
        } catch {
          return cache.match(e.request);
        }
      })
    );
    return;
  }

  // Mặc định: cache-first cho file web
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
