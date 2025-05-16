// Progressive Web App Service Worker

// Cache names
const CACHE_NAME = 'e-com-v1';
const STATIC_CACHE_NAME = 'e-com-static-v1';
const DYNAMIC_CACHE_NAME = 'e-com-dynamic-v1';
const OFFLINE_PAGE = '/offline';

// Assets to precache
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/login',
  '/register',
  '/manifest.json',
  '/icons/icon-72x72.svg',
  '/icons/icon-96x96.svg',
  '/icons/icon-128x128.svg',
  '/icons/icon-144x144.svg',
  '/icons/icon-152x152.svg',
  '/icons/icon-192x192.svg',
  '/icons/icon-384x384.svg',
  '/icons/icon-512x512.svg',
];

// Install event - precache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker...');

  // Skip waiting to ensure the new service worker activates immediately
  self.skipWaiting();

  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Precaching App Shell');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('[Service Worker] Precaching failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker...');

  // Claim clients to ensure the service worker controls all clients immediately
  event.waitUntil(self.clients.claim());

  // Clean up old caches
  event.waitUntil(
    caches.keys()
      .then((keyList) => {
        return Promise.all(keyList.map((key) => {
          if (key !== STATIC_CACHE_NAME && key !== DYNAMIC_CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        }));
      })
  );

  return self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests and browser extensions
  if (event.request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Skip Firebase and analytics requests
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('gstatic') ||
    url.pathname.includes('analytics') ||
    url.pathname.includes('firebase')
  ) {
    return;
  }

  // Handle API requests differently - Network first, then offline fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response to store in cache
          const clonedResponse = response.clone();

          caches.open(DYNAMIC_CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, clonedResponse);
            });

          return response;
        })
        .catch(() => {
          // If offline, try to get from cache
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }

              // If not in cache, return offline JSON for API
              return new Response(
                JSON.stringify({
                  error: 'You are offline. Please check your connection.'
                }),
                {
                  status: 503,
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            });
        })
    );
    return;
  }

  // For page navigations - Cache first, then network with offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return fetch(event.request)
            .then((response) => {
              // Clone the response to store in cache
              const clonedResponse = response.clone();

              caches.open(DYNAMIC_CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, clonedResponse);
                });

              return response;
            })
            .catch(() => {
              // If offline and not in cache, show offline page
              return caches.match(OFFLINE_PAGE);
            });
        })
    );
    return;
  }

  // For other assets - Stale-while-revalidate strategy
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached response immediately
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            // Update the cache with the new response
            caches.open(DYNAMIC_CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, networkResponse.clone());
              });
            return networkResponse;
          })
          .catch(() => {
            // If fetch fails, we already returned the cached response or will fall back
            console.log('[Service Worker] Fetch failed, already returned cache or falling back');
          });

        return cachedResponse || fetchPromise;
      })
  );
});

// Handle push notifications (for compatibility with Firebase messaging)
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received');

  let data = {};
  if (event.data) {
    data = event.data.json();
  }

  const options = {
    body: data.notification?.body || 'New notification',
    icon: data.notification?.icon || '/icons/icon-192x192.svg',
    badge: '/icons/icon-72x72.svg',
    vibrate: [100, 50, 100],
    data: {
      url: data.notification?.click_action || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(
      data.notification?.title || 'New Notification',
      options
    )
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then((clientList) => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }

      // If no window/tab is already open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
