/* =========================================================
   Service Worker — Criador de Molduras IA
   Cache offline para PWA no GitHub Pages
   ========================================================= */

const CACHE_VERSION = 'v1.0.0';
const CACHE_STATIC = `molduras-static-${CACHE_VERSION}`;
const CACHE_DYNAMIC = `molduras-dynamic-${CACHE_VERSION}`;

// Arquivos essenciais (cacheados na instalação)
const PRECACHE = [
  './',
  './index.html',
  './offline.html',
  './manifest.json',
  './js/app.js',
  './js/ai.js',
  './js/camera.js',
  './js/editor.js',
  './js/frames.js',
  './js/gestures.js',
  './js/share.js',
  './js/toast.js',
  './js/utils.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

/* ---------- INSTALL ---------- */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => cache.addAll(PRECACHE).catch(err => {
        console.warn('[SW] Falha ao pré-cachear alguns itens:', err);
      }))
      .then(() => self.skipWaiting())
  );
});

/* ---------- ACTIVATE ---------- */
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

/* ---------- FETCH ---------- */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora métodos não-GET
  if (request.method !== 'GET') return;

  // Ignora requisições de CDN externos (deixa passar direto)
  if (url.origin !== self.location.origin) return;

  // Navegação (HTML) → network-first com fallback offline
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

  // Demais assets → cache-first
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        // Só cacheia respostas válidas
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_DYNAMIC).then(c => c.put(request, clone));
        return response;
      });
    })
  );
});

/* ---------- MESSAGE ---------- */
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
