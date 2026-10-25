// Service worker: rende l'app disponibile offline.
// Cambia CACHE_VERSION a ogni aggiornamento dei file, cosi' l'app si aggiorna.
const CACHE_VERSION = 'scheda-allenamento-v2';
const FB = 'https://www.gstatic.com/firebasejs/10.12.2/';
const ASSETS = [
  './', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png',
  FB + 'firebase-app-compat.js', FB + 'firebase-auth-compat.js', FB + 'firebase-firestore-compat.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(async (cache) => {
      for (const url of ASSETS) { try { await cache.add(url); } catch (e) { /* ignora */ } }
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Gestisce solo i file dell'app e le librerie: le chiamate a Firebase (login, database) passano dirette.
function isCacheable(url) {
  return url.origin === self.location.origin
    || url.href.startsWith(FB)
    || url.hostname === 'cdnjs.cloudflare.com';
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (!isCacheable(url)) return;
  event.respondWith(
    fetch(event.request).then((resp) => {
      if (resp.ok) {
        const copy = resp.clone();
        caches.open(CACHE_VERSION).then((c) => c.put(event.request, copy)).catch(() => {});
      }
      return resp;
    }).catch(() => caches.match(event.request, { ignoreSearch: true })
      .then((r) => r || (event.request.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});
