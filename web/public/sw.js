/**
 * VocaVision Service Worker
 *
 * Provides offline functionality and caching for PWA
 */

const CACHE_NAME = 'vocavision-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo-192.png',
  '/logo-512.png',
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  '/api/words',
  '/api/collections',
  '/api/achievements',
];

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.error('[Service Worker] Failed to cache static assets:', err);
      });
    })
  );

  // Force immediate activation
  self.skipWaiting();
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // Take control immediately
  event.waitUntil(self.clients.claim());
});

/**
 * Fetch event - serve from cache or network
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  event.respondWith(handleStaticRequest(request));
});

/**
 * Handle API requests - Network first, fallback to cache
 */
async function handleApiRequest(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    // Try network first
    const response = await fetch(request);

    // Cache successful responses
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Network failed, try cache
    console.log('[Service Worker] Network failed, trying cache:', request.url);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline response
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Offline',
        message: 'You are currently offline. Please check your connection.',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Handle static requests - Cache first, fallback to network
 */
async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME);

  // Try cache first
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    // Try network
    const response = await fetch(request);

    // Cache successful responses
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Network failed, return offline page
    console.log('[Service Worker] Offline, serving offline page');

    const url = new URL(request.url);

    // For HTML requests, serve offline page
    if (request.headers.get('accept').includes('text/html')) {
      return cache.match(OFFLINE_URL);
    }

    // For other requests, return error
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

/**
 * Background sync event
 */
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);

  if (event.tag === 'sync-progress') {
    event.waitUntil(syncProgress());
  }
});

/**
 * Sync user progress
 */
async function syncProgress() {
  try {
    // Get pending progress from IndexedDB
    const pending = await getPendingProgress();

    if (pending.length === 0) {
      return;
    }

    // Sync each item
    for (const item of pending) {
      try {
        const response = await fetch('/api/progress/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(item),
        });

        if (response.ok) {
          // Mark as synced
          await markAsSynced(item.id);
        }
      } catch (error) {
        console.error('[Service Worker] Failed to sync item:', error);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
  }
}

/**
 * Push notification event
 */
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');

  const data = event.data ? event.data.json() : {};
  const title = data.title || 'VocaVision AI';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/logo-192.png',
    badge: '/badge.png',
    vibrate: [200, 100, 200],
    data: data.data,
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/**
 * Notification click event
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');

  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});

/**
 * Message event - receive messages from clients
 */
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

// Helper functions (would normally use IndexedDB)
async function getPendingProgress() {
  // TODO: Implement with IndexedDB
  return [];
}

async function markAsSynced(id) {
  // TODO: Implement with IndexedDB
}

console.log('[Service Worker] Loaded');
