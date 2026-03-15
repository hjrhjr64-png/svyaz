const CACHE_NAME = 'svyaz-shell-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/globals.css',
  // Мы не кешируем динамические роуты /room/[id], 
  // но кешируем статику и главную страницу.
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Пропускаем запросы к LiveKit и API
  if (event.request.url.includes('/api/') || event.request.url.includes('.livekit.cloud')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        // Если сети нет и ресурса нет в кеше — возвращаем главную (shell)
        // только для навигационных запросов
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});
