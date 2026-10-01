const CACHE_NAME = 'ats-optimizer-v3';

// Files that must NEVER be cached by the SW — they have their own cache-busting
const NEVER_CACHE = [
  '/pdf.worker.min.mjs',
  'pdf.worker',
];

const STATIC_ASSETS = [
  '/',
  '/resume',
  '/manifest.json',
];

// Install: cache static assets, skip waiting immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('SW: Some assets failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: delete ALL old caches, claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log('SW: Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first with cache fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension')) {
    return;
  }

  // Never cache pdfjs worker — bypass SW entirely so version-stamped URLs always hit network
  const url = event.request.url;
  if (NEVER_CACHE.some(pattern => url.includes(pattern))) {
    return; // Let browser handle directly — no SW interception
  }

  // Skip external API calls
  if (url.includes('api.groq.com') || url.includes('api.openai.com') || url.includes('api.anthropic.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});
