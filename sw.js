const STATIC_CACHE = 'sb-static-v3';

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
        keys.filter(k => k !== STATIC_CACHE)
            .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // ❌ TUYỆT ĐỐI không cache proxy crawl
  if (url.hostname.includes('allorigins.win')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // ❌ Không cache request tới scriptblox
  if (url.hostname.includes('scriptblox.com')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // ✅ Cache-first cho web của bạn
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
