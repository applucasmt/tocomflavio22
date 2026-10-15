/* =========================================================
   Service Worker — Criador de Molduras IA
   ========================================================= */

const CACHE_VERSION = 'v1.2.0';
const CACHE_STATIC = 'molduras-static-' + CACHE_VERSION;
const CACHE_DYNAMIC = 'molduras-dynamic-' + CACHE_VERSION;

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

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(function(cache) {
        return Promise.all(
          PRECACHE.map(function(url) {
            return cache.add(url).catch(function(err) {
              console.warn('[SW] Falha ao cachear:', url, err.message);
            });
          })
        );
      })
      .then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys
          .filter(function(key) {
            return key !== CACHE_STATIC && key !== CACHE_DYNAMIC;
          })
          .map(function(key) { return caches.delete(key); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event) {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(function(response) {
          const clone = response.clone();
          caches.open(CACHE_DYNAMIC).then(function(c) { c.put(request, clone); });
          return response;
        })
        .catch(function() {
          return caches.match(request).then(function(r) {
            return r || caches.match('./offline.html');
          });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(function(cached) {
      if (cached) return cached;
      return fetch(request).then(function(response) {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_DYNAMIC).then(function(c) { c.put(request, clone); });
        return response;
      }).catch(function() {
        return new Response('', { status: 404 });
      });
    })
  );
});

self.addEventListener('message', function(event) {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
