/**
 * OUIDAH CONNECT - Service Worker pour mode hors-ligne
 */

const CACHE_NAME = 'ouidah-controle-v1';
const urlsToCache = [
  '/controle.html',
  '/css/controle.css',
  '/js/controle.js',
  'https://unpkg.com/html5-qrcode'
];

// Installation : mise en cache des fichiers essentiels
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Cache ouvert');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interception des requêtes : stratégie "Network First"
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si la requête réussit, on met en cache
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Si pas de réseau, on sert depuis le cache
        return caches.match(event.request);
      })
  );
});