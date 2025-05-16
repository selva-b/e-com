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
      fetch(event.request.clone(), {
        // Add credentials to ensure cookies are sent with the request
        credentials: 'include',
        // Add cache control headers to prevent caching issues
        headers: {
          ...Object.fromEntries(event.request.headers.entries()),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      .then((response) => {
        // Only cache successful responses
        if (response.ok) {
          // Clone the response to store in cache
          const clonedResponse = response.clone();

          caches.open(DYNAMIC_CACHE_NAME)
            .then((cache) => {
              // Don't cache if response contains no-store in Cache-Control header
              const cacheControl = response.headers.get('Cache-Control') || '';
              if (!cacheControl.includes('no-store')) {
                cache.put(event.request, clonedResponse);
              }
            });
        }

        return response;
      })
      .catch((error) => {
        console.error('[Service Worker] API fetch error:', error);

        // Report the error to the client
        reportApiError(error);

        // If offline, try to get from cache
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              // Add a header to indicate this is from cache
              const headers = new Headers(cachedResponse.headers);
              headers.append('X-From-Service-Worker-Cache', 'true');

              // Create a new response with the modified headers
              return new Response(cachedResponse.body, {
                status: cachedResponse.status,
                statusText: cachedResponse.statusText,
                headers: headers
              });
            }

            // If not in cache, return offline JSON for API
            return new Response(
              JSON.stringify({
                error: 'You are offline. Please check your connection.',
                fromServiceWorker: true
              }),
              {
                status: 503,
                headers: {
                  'Content-Type': 'application/json',
                  'Cache-Control': 'no-store',
                  'X-From-Service-Worker': 'true'
                }
              }
            );
          });
      })
    );
    return;
  }

  // For page navigations - Network first, then cache fallback for better user experience
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response to store in cache
          const clonedResponse = response.clone();

          caches.open(DYNAMIC_CACHE_NAME)
            .then((cache) => {
              // Don't cache if response contains no-store in Cache-Control header
              const cacheControl = response.headers.get('Cache-Control') || '';
              if (!cacheControl.includes('no-store')) {
                cache.put(event.request, clonedResponse);
              }
            });

          return response;
        })
        .catch((error) => {
          console.error('[Service Worker] Navigation fetch error:', error);

          // If network request fails, try to get from cache
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }

              // If not in cache, show offline page
              return caches.match(OFFLINE_PAGE);
            });
        })
    );
    return;
  }

  // For other assets - Stale-while-revalidate strategy with improved error handling
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Create a fetch promise for the network request
        const fetchPromise = fetch(event.request.clone())
          .then((networkResponse) => {
            // Only cache successful responses
            if (networkResponse.ok) {
              // Update the cache with the new response
              caches.open(DYNAMIC_CACHE_NAME)
                .then((cache) => {
                  // Don't cache if response contains no-store in Cache-Control header
                  const cacheControl = networkResponse.headers.get('Cache-Control') || '';
                  if (!cacheControl.includes('no-store')) {
                    cache.put(event.request, networkResponse.clone());
                  }
                });
            }
            return networkResponse;
          })
          .catch((error) => {
            console.error('[Service Worker] Fetch failed:', error);
            // If fetch fails and we don't have a cached response, throw to trigger fallback
            if (!cachedResponse) {
              throw error;
            }
          });

        // Return cached response immediately if available, otherwise wait for network
        return cachedResponse || fetchPromise;
      })
      .catch((error) => {
        console.error('[Service Worker] Both cache and fetch failed:', error);
        // If both cache and network fail, return a simple error response
        return new Response('Network error occurred. Please try again later.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        });
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

// Handle messages from clients
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Received message:', event.data);

  if (event.data && event.data.type === 'PERIODIC_UPDATE') {
    // Clear certain caches to ensure fresh content
    caches.open(DYNAMIC_CACHE_NAME)
      .then((cache) => {
        // Get all cache keys
        return cache.keys()
          .then((requests) => {
            // Filter API requests
            const apiRequests = requests.filter(request =>
              request.url.includes('/api/')
            );

            // Delete API cache entries to ensure fresh data
            return Promise.all(
              apiRequests.map(request => cache.delete(request))
            );
          });
      })
      .catch(error => {
        console.error('[Service Worker] Cache cleanup error:', error);
      });
  }
});

// Report API errors to the client
const reportApiError = (error) => {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'API_ERROR',
        error: error.toString()
      });
    });
  });
};
