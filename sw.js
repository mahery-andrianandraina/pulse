const CACHE_NAME = 'pulse-cache-v1';
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
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
