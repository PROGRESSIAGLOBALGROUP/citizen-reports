const CACHE_NAME = 'mvp-heatmap-v2';
const ASSETS = ['/', '/index.html', '/manifest.json'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method === 'GET' && (url.origin === location.origin || url.pathname.startsWith('/api/'))) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
      const clone = resp.clone(); caches.open(CACHE_NAME).then(c => c.put(e.request, clone)).catch(()=>{});
      return resp;
    })));
  }
});