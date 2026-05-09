const CACHE_NAME = 'pulse-cache-v2';
const urlsToCache = [
  './',
  './index.html',
  './css/main.css',
  './css/components.css',
  './css/animations.css',
  './css/filters.css',
  './css/pages.css',
  './css/admin.css',
  './js/firebase-config.js',
  './js/utils.js',
  './js/auth.js',
  './js/stories.js',
  './js/post.js',
  './js/feed.js',
  './js/profile.js',
  './js/explore.js',
  './js/messages.js',
  './js/notifications.js',
  './js/reels.js',
  './js/admin.js',
  './js/app.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Clearing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => {
        return caches.match(event.request);
    })
  );
});
