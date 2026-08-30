/**
 * BNHS Nature Platform - Production Service Worker
 * Version: 1.0.0
 */

const CACHE_VERSION = 'bnhs-platform-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// Pre-cached App Shell resources
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/bnhs-logo-bird.png',
  '/bnhs-logo.png',
  '/bnhs-logo-full.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-512x512.png',
  '/icons/apple-touch-icon.png',
  '/favicon.png',
];

// Security Blacklist - NEVER cache or intercept sensitive auth/admin endpoints
const SENSITIVE_ENDPOINTS = [
  '/api/auth',
  '/api/admin',
  '/api/moderation',
  '/api/community/conversations',
  '/api/users/profile',
];

// 1. Install Event - Cache App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn('[BNHS SW] Pre-caching warning:', err);
      })
  );
});

// 2. Activate Event - Clean Up Stale Caches
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, RUNTIME_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!currentCaches.includes(cacheName)) {
              console.log('[BNHS SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Helper: Check if request is to a sensitive endpoint
function isSensitive(url) {
  return SENSITIVE_ENDPOINTS.some((endpoint) => url.pathname.startsWith(endpoint));
}

// 3. Fetch Event - Intelligent Caching Strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle HTTP/HTTPS GET requests
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Security Check: Never touch sensitive auth/admin/profile requests
  if (isSensitive(url)) {
    return;
  }

  // A. Navigation Requests (HTML pages / React Router deep links)
  // Strategy: Network-first, fallback to cached App Shell (/index.html)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put('/index.html', responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          const cachedAppShell = await caches.match('/index.html');
          if (cachedAppShell) {
            return cachedAppShell;
          }
          return new Response(
            `<!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8"><title>BNHS - Offline</title>
              <style>
                body { font-family: sans-serif; text-align: center; padding: 40px; color: #1e293b; }
                .card { max-width: 400px; margin: 40px auto; padding: 30px; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0; }
                h2 { color: #064e3b; margin-top: 10px; }
              </style>
            </head>
            <body>
              <div class="card">
                <h2>🌿 BNHS Nature Platform</h2>
                <p>You appear to be offline. Reconnect to the internet to access activities and field reports.</p>
              </div>
            </body></html>`,
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // B. Static Assets (JS, CSS, Fonts, Images, Icons)
  // Strategy: Cache-first with background network update
  const isStaticAsset =
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.webp') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cache immediately, fetch in background to update
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(RUNTIME_CACHE).then((cache) => {
                  cache.put(request, networkResponse);
                });
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        return fetch(request)
          .then((networkResponse) => {
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            const responseToCache = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
            return networkResponse;
          })
          .catch(() => {
            // Return empty fallback if asset unavailable offline
            return new Response('', { status: 408, statusText: 'Offline Asset Unavailable' });
          });
      })
    );
    return;
  }

  // C. Non-sensitive GET API Data (Activities list, Public feed)
  // Strategy: Network-first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedApiResponse = await caches.match(request);
          if (cachedApiResponse) {
            return cachedApiResponse;
          }
          return new Response(
            JSON.stringify({
              error: 'Offline',
              message: 'You are currently offline. Please reconnect to access live data.',
            }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
    );
  }
});
