/* ==========================================
   SERVICE WORKER
   Enables offline functionality and caching
   ========================================== */

const CACHE_NAME = 'family-scheduler-v1';

// Files to cache for offline use
const urlsToCache = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/css/style.css',
  '/css/dashboard.css',
  '/js/auth.js',
  '/js/app.js',
  '/js/calendar.js',
  '/js/grocery.js',
  '/js/location.js'
];

/* ------------------------------------------
   INSTALL EVENT
   Runs when service worker is first installed
   ------------------------------------------ */

self.addEventListener('install', function(event) {
  // Wait until caching is complete
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(function() {
        // Force the waiting service worker to become active
        return self.skipWaiting();
      })
  );
});

/* ------------------------------------------
   ACTIVATE EVENT
   Runs when service worker becomes active
   ------------------------------------------ */

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          // Delete old caches
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

/* ------------------------------------------
   FETCH EVENT
   Intercepts network requests
   ------------------------------------------ */

self.addEventListener('fetch', function(event) {
  event.respondWith(
    // Try to get from cache first
    caches.match(event.request)
      .then(function(response) {
        // Return cached version if available
        if (response) {
          return response;
        }

        // Otherwise fetch from network
        return fetch(event.request).then(function(response) {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response (can only be used once)
          const responseToCache = response.clone();

          // Add to cache for future use
          caches.open(CACHE_NAME)
            .then(function(cache) {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(function() {
        // If both cache and network fail, show offline page
        // You could create an offline.html page for this
        console.log('Service Worker: Fetch failed');
      })
  );
});

/* ------------------------------------------
   BACKGROUND SYNC (Future Enhancement)
   Could be used for notifications
   ------------------------------------------ */

// This is for future enhancements
// You could use this to sync data or send notifications
