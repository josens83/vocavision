// Phase 2-4: Service Worker for Offline Support
// Benchmarking: Netflix offline mode, Google Workbox strategies

const CACHE_VERSION = 'v1';
const CACHE_NAME = `vocavision-${CACHE_VERSION}`;

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
];

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',       // Check cache first, then network
  NETWORK_FIRST: 'network-first',   // Try network first, fallback to cache
  CACHE_ONLY: 'cache-only',         // Only use cache
  NETWORK_ONLY: 'network-only',     // Only use network
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate', // Return cache, update in background
};

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      console.log('[Service Worker] Installation complete');
      return self.skipWaiting(); // Activate immediately
    })
  );
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
    }).then(() => {
      console.log('[Service Worker] Activation complete');
      return self.clients.claim(); // Take control immediately
    })
  );
});

/**
 * Fetch event - handle network requests with caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Determine cache strategy based on request type
  let strategy = CACHE_STRATEGIES.NETWORK_FIRST;

  // Static assets - Cache First
  if (
    request.destination === 'image' ||
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font'
  ) {
    strategy = CACHE_STRATEGIES.CACHE_FIRST;
  }

  // API requests - Network First
  if (url.pathname.startsWith('/api/')) {
    strategy = CACHE_STRATEGIES.NETWORK_FIRST;
  }

  // HTML pages - Stale While Revalidate
  if (request.destination === 'document') {
    strategy = CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
  }

  event.respondWith(handleRequest(request, strategy));
});

/**
 * Handle request with specified strategy
 */
async function handleRequest(request, strategy) {
  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request);

    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request);

    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request);

    case CACHE_STRATEGIES.CACHE_ONLY:
      return cacheOnly(request);

    case CACHE_STRATEGIES.NETWORK_ONLY:
      return networkOnly(request);

    default:
      return networkFirst(request);
  }
}

/**
 * Cache First strategy
 * Check cache first, fallback to network
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[Service Worker] Cache First failed:', error);
    return offline Response();
  }
}

/**
 * Network First strategy
 * Try network first, fallback to cache
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.warn('[Service Worker] Network failed, checking cache:', error);
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return offlineResponse();
  }
}

/**
 * Stale While Revalidate strategy
 * Return cached version immediately, update in background
 */
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);

  // Update cache in background
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      const cache = caches.open(CACHE_NAME);
      cache.then((c) => c.put(request, response.clone()));
    }
    return response;
  });

  // Return cached version immediately if available
  return cached || fetchPromise;
}

/**
 * Cache Only strategy
 */
async function cacheOnly(request) {
  const cached = await caches.match(request);
  return cached || offlineResponse();
}

/**
 * Network Only strategy
 */
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (error) {
    return offlineResponse();
  }
}

/**
 * Offline fallback response
 */
function offlineResponse() {
  return new Response(
    JSON.stringify({
      error: 'Offline',
      message: '인터넷 연결을 확인해주세요.',
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Background sync for failed requests
 */
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);

  if (event.tag === 'sync-failed-requests') {
    event.waitUntil(syncFailedRequests());
  }
});

/**
 * Sync failed requests when back online
 */
async function syncFailedRequests() {
  // TODO Phase 2-5: Integrate with IndexedDB to store and retry failed requests
  console.log('[Service Worker] Syncing failed requests...');
}

/**
 * Push notifications (for future enhancement)
 */
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);

  const data = event.data ? event.data.json() : {};
  const title = data.title || 'VocaVision';
  const options = {
    body: data.body || '새로운 알림이 있습니다.',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: data.url,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/**
 * Notification click handler
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.notification.data) {
    event.waitUntil(
      clients.openWindow(event.notification.data)
    );
  }
});

console.log('[Service Worker] Loaded successfully');
