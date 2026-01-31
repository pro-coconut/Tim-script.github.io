const CACHE_NAME = 'sb-mini-v5-static-v1';
const RUNTIME_CACHE = 'sb-mini-runtime-v1';
const PRECACHE_URLS = [
  '/', '/index.html'
];

self.addEventListener('install', (e)=>{
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e)=>{
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME && k !== RUNTIME_CACHE).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e)=>{
  const url = new URL(e.request.url);
  // cache API runtime responses (scriptblox, thumbnails)
  if(url.origin === 'https://scriptblox.com' || url.origin === 'https://thumbnails.roblox.com'){
    e.respondWith(
      caches.open(RUNTIME_CACHE).then(async cache => {
        try {
          const res = await fetch(e.request);
          if(res && res.status===200) cache.put(e.request, res.clone());
          return res;
        } catch(err){
          const cached = await cache.match(e.request);
          if(cached) return cached;
          return new Response('Offline', { status: 503, statusText:'Offline' });
        }
      })
    );
    return;
  }

  // else: default to cache-first for site assets
  e.respondWith(
    caches.match(e.request).then(resp => resp || fetch(e.request).catch(()=>caches.match('/index.html')))
  );
});
