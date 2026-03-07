/**
 * KOLTYN OS — sw.js (Service Worker)
 *
 * Strategy:
 *   - App shell (HTML, CSS, JS, icons, manifest) → Cache First
 *     Serve instantly from cache; update in background on next visit.
 *   - Google Fonts → Cache First (stale-while-revalidate)
 *   - Anthropic API (recipe fetches) → Network Only, never cached
 *     (live AI responses should always be fresh)
 *
 * On install: pre-cache the entire app shell so it works 100% offline
 * immediately after the first online visit.
 */

const CACHE_NAME    = 'koltyn-os-v1';
const FONT_CACHE    = 'koltyn-fonts-v1';

/* Every file that makes up the app shell */
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './dashboard.js',
  './manifest.json',
  './nutrition/page.js',
  './workout/page.js',
  './business/page.js',
  './wealth/page.js',
  './creative/page.js',
  './vision/page.js',
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-128.png',
  './icons/icon-144.png',
  './icons/icon-152.png',
  './icons/icon-192.png',
  './icons/icon-384.png',
  './icons/icon-512.png',
];

/* ── Install: pre-cache app shell ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())   /* Activate immediately, don't wait */
  );
});

/* ── Activate: delete old caches ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== FONT_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())  /* Take control of open tabs immediately */
  );
});

/* ── Fetch: route every request ── */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  /* Anthropic API — always go to network, never cache */
  if (url.hostname === 'api.anthropic.com') {
    event.respondWith(fetch(event.request));
    return;
  }

  /* Google Fonts CSS — stale-while-revalidate */
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONT_CACHE).then(cache =>
        cache.match(event.request).then(cached => {
          const networkFetch = fetch(event.request).then(response => {
            cache.put(event.request, response.clone());
            return response;
          });
          return cached || networkFetch;
        })
      )
    );
    return;
  }

  /* Everything else (app shell) — cache first, fall back to network */
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      /* Not in cache yet — fetch, cache, return */
      return fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
