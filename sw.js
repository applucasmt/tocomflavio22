/* =========================================================
   Service Worker — Criador de Molduras IA
   ========================================================= */

const CACHE_VERSION = 'v1.1.0';
const CACHE_STATIC = `molduras-static-${CACHE_VERSION}`;
const CACHE_DYNAMIC = `molduras-dynamic-${CACHE_VERSION}`;

const PRECACHE = [
  './',
  './index.html',
  './offline.html',
  './manifest.json',
  './css/style.css',
  './js/app.js',
  './js/ai.js',
  './js/camera.js',
  './js/editor.js',
  './js/frames.js',
  './js/generator.js',
  './js/gestures.js',
  './js/share.js',
  './js/toast.js',
  './js/utils.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => {
        // ✅ FIX: adiciona cada um individualmente, ignora falhas
        return Promise.all(
          PRECACHE.map(url =>
            cache.add(url).catch(err => {
              console.warn('[SW] Falha ao cachear:', url, err.message);
            })
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_STATIC && key !== CACHE_DYNAMIC)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // ✅ FIX: ignora CDNs externos (jsdelivr, pollinations, etc)
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_DYNAMIC).then(c => c.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then(r => r || caches.match('./offline.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_DYNAMIC).then(c => c.put(request, clone));
        return response;
      }).catch(() => {
        // Se falhar, retorna vazio em vez de quebrar
        return new Response('', { status: 404 });
      });
    })
  );
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
