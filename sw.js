const STATIC_CACHE = 'sb-mini-static-v1';
const RUNTIME_CACHE = 'sb-mini-runtime-v1';
const PRECACHE = [
  '/', '/index.html', '/view.html'
];

self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== STATIC_CACHE && k !== RUNTIME_CACHE).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', evt => {
  const reqUrl = new URL(evt.request.url);

  // runtime cache for scriptblox API and thumbnails
  if(reqUrl.origin === 'https://scriptblox.com' || reqUrl.origin === 'https://thumbnails.roblox.com'){
    evt.respondWith(
      caches.open(RUNTIME_CACHE).then(async cache => {
        try{
          const fresh = await fetch(evt.request);
          if(fresh && fresh.status === 200) cache.put(evt.request, fresh.clone());
          return fresh;
        }catch(err){
          const cached = await cache.match(evt.request);
          if(cached) return cached;
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        }
      })
    );
    return;
  }

  // default: cache first for other assets
  evt.respondWith(
    caches.match(evt.request).then(resp => resp || fetch(evt.request).catch(() => caches.match('/index.html')))
  );
});
