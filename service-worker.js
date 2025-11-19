// Service Worker for CityHealth Platform
// Provides offline caching and performance optimization

const CACHE_VERSION = 'cityhealth-v3';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/css/main.css',
  '/assets/css/components.css',
  '/assets/css/themes.css',
  '/assets/css/responsive.css',
  '/assets/css/homepage.css',
  '/assets/js/app.js',
  '/assets/js/router.js',
  '/assets/js/auth.js',
  '/assets/js/search.js',
  '/assets/js/profile.js',
  '/assets/js/i18n.js',
  '/assets/js/utils.js',
  '/assets/js/theme.js',
  '/assets/js/accessibility.js',
  '/assets/js/homepage.js',
  '/assets/locales/en.json',
  '/assets/locales/ar.json',
  '/assets/locales/fr.json',
  '/pages/home.html',
  '/pages/search-results.html',
  '/pages/emergency.html',
  '/components/navbar.html',
  '/components/footer.html',
  '/components/search-bar.html',
  '/components/chatbot-widget.html',
  '/components/provider-card.html'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName.startsWith('cityhealth-') && 
                     cacheName !== STATIC_CACHE && 
                     cacheName !== DYNAMIC_CACHE &&
                     cacheName !== IMAGE_CACHE &&
                     cacheName !== API_CACHE;
            })
            .map((cacheName) => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip Firebase Auth and Firestore requests (but cache Storage)
  if (url.origin.includes('firebase') && !url.origin.includes('firebasestorage')) {
    return;
  }
  
  if (url.origin.includes('googleapis') && !url.origin.includes('firebasestorage')) {
    return;
  }
  
  if (url.origin.includes('gstatic')) {
    return;
  }
  
  // Handle image requests with image cache
  if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
    event.respondWith(handleImageRequest(request));
    return;
  }
  
  // Handle static assets with cache-first strategy
  if (STATIC_ASSETS.some(asset => url.pathname.includes(asset))) {
    event.respondWith(handleStaticRequest(request));
    return;
  }
  
  // Handle CSS and JS with cache-first strategy
  if (url.pathname.match(/\.(css|js)$/)) {
    event.respondWith(handleStaticRequest(request));
    return;
  }
  
  // Handle dynamic content with network-first strategy
  event.respondWith(handleDynamicRequest(request));
});

// Cache-first strategy for static assets
async function handleStaticRequest(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Static request failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Network-first strategy for dynamic content with timeout
async function handleDynamicRequest(request) {
  try {
    // Add timeout to network request (3 seconds)
    const networkPromise = fetch(request);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Network timeout')), 3000)
    );
    
    const networkResponse = await Promise.race([networkPromise, timeoutPromise]);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[Service Worker] Serving from cache (network failed):', request.url);
      return cachedResponse;
    }
    return new Response('Offline', { status: 503 });
  }
}

// Image caching strategy with WebP support
async function handleImageRequest(request) {
  try {
    // Check cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fetch from network
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(IMAGE_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Try to return cached version
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return placeholder image
    return new Response('', { status: 404 });
  }
}

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});
