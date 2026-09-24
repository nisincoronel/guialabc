const CACHE_NAME = 'guialab-cache-v16';

const APP_ASSETS = [
  './',
  './index.html',
  './game.html',
  './style.css',
  './game.css',
  './script.js',
  './game.js',
  './determinaciones.json',
  './manifest.json',
  './logo-guialab.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_ASSETS)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

// Con conexión, prioriza siempre la versión publicada más reciente.
// Sin conexión, devuelve la última versión disponible en el dispositivo.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok && new URL(event.request.url).origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
  );
});
