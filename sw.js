// Service worker: rende l'app disponibile offline.
// Aggiorna CACHE_VERSION ogni volta che cambi index.html, cosi' l'app si aggiorna.
const CACHE_VERSION = 'scheda-allenamento-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(async (cache) => {
      // Le librerie esterne sono opzionali: se non si scaricano, l'app funziona lo stesso.
      for (const url of ASSETS) {
        try { await cache.add(url); } catch (e) { /* ignora */ }
      }
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Strategia: prima la rete (per avere sempre l'ultima versione), se fallisce la cache.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).then((resp) => {
      const copy = resp.clone();
      caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy)).catch(() => {});
      return resp;
    }).catch(() => caches.match(event.request, { ignoreSearch: true }).then((r) => r || caches.match('./index.html')))
  );
});
