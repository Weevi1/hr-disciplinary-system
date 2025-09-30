// <File> by Fifo Service Worker - Online Only
// 🚀 Performance-focused caching without offline complexity
// ✅ Fast loading, installable app, but requires internet connection

const CACHE_VERSION = 'file-v1.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// App shell files to cache for faster loading
const STATIC_ASSETS = [
  '/',
  '/manifest.json'
];

// Files that should never be cached (always fresh from network)
const NEVER_CACHE = [
  /^\/api\//,
  /^\/auth\//,
  /firebase/,
  /\.hot-update\./,
  /sockjs/
];

// 🔧 INSTALL EVENT - Cache app shell for faster loading
self.addEventListener('install', (event) => {
  console.log('🔧 HR System Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Caching app shell for faster loading...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ App shell cached successfully');
        return self.skipWaiting();
      })
  );
});

// 🔄 ACTIVATE EVENT - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('✅ HR System Service Worker activated');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('hr-system-') && 
                cacheName !== STATIC_CACHE && 
                cacheName !== RUNTIME_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all pages
      self.clients.claim()
    ])
  );
});

// 🌐 FETCH EVENT - Handle requests with smart caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Never cache certain requests - always go to network
  if (NEVER_CACHE.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(
      fetch(request).catch(() => {
        // If network fails for API calls, return error
        return new Response(JSON.stringify({
          error: 'Network connection required',
          message: 'This HR system requires an internet connection to function.'
        }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }
  
  // App shell and static assets - serve from cache when available for speed
  if (STATIC_ASSETS.includes(url.pathname) || url.pathname === '/') {
    event.respondWith(handleAppShell(request));
    return;
  }
  
  // Vite assets (JS/CSS with hashes) - cache for performance
  if (url.pathname.includes('/assets/') || 
      url.pathname.match(/\.(js|css|woff2?|png|jpg|svg|ico)$/)) {
    event.respondWith(handleStaticAssets(request));
    return;
  }
  
  // Everything else - network first (fresh data)
  event.respondWith(handleNetworkFirst(request));
});

// 📱 App shell strategy - cache first for instant loading
async function handleAppShell(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      // Serve from cache immediately for speed
      // Update cache in background
      fetch(request).then(response => {
        if (response.ok) {
          cache.put(request, response.clone());
        }
      }).catch(() => {}); // Ignore background update errors
      
      return cached;
    }
    
    // Not in cache, get from network
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
    
  } catch (error) {
    // Network error - show connection required message
    return getConnectionRequiredPage();
  }
}

// 📦 Static assets strategy - cache first for performance
async function handleStaticAssets(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
    
  } catch (error) {
    // For missing assets, return empty response
    return new Response('', { 
      status: 404,
      statusText: 'Asset not found' 
    });
  }
}

// 🌐 Network first strategy - always try for fresh data
async function handleNetworkFirst(request) {
  try {
    const response = await fetch(request);
    
    // Cache successful responses for potential reuse
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
    
  } catch (error) {
    // Network failed - check if we have a cached version
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      // Return cached version with a warning header
      const response = cached.clone();
      response.headers.set('X-Served-From', 'cache');
      return response;
    }
    
    // No cache available - return connection error
    return getConnectionRequiredPage();
  }
}

// 📡 Connection required page
function getConnectionRequiredPage() {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>HR System - Connection Required</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          margin: 0;
          padding: 2rem;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          text-align: center;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        .container {
          max-width: 400px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border-radius: 1.5rem;
          padding: 2rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        h1 {
          margin-bottom: 1rem;
          font-size: 1.5rem;
        }
        p {
          opacity: 0.9;
          line-height: 1.6;
          margin-bottom: 2rem;
        }
        .retry-button {
          padding: 0.75rem 1.5rem;
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s;
        }
        .retry-button:hover {
          background: rgba(255,255,255,0.3);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">🌐</div>
        <h1>Connection Required</h1>
        <p>The HR Dignity System requires an active internet connection to function properly.</p>
        <p>Please check your connection and try again.</p>
        <button class="retry-button" onclick="window.location.reload()">
          Retry Connection
        </button>
      </div>
      
      <script>
        // Auto-retry when connection is restored
        window.addEventListener('online', () => {
          setTimeout(() => window.location.reload(), 1000);
        });
      </script>
    </body>
    </html>
  `;
  
  return new Response(html, {
    status: 503,
    headers: { 'Content-Type': 'text/html' }
  });
}

// 📊 Optional: Log cache hits for debugging
function logCacheHit(request, source) {
  console.log(`📊 Cache ${source}:`, request.url.split('/').pop());
}

console.log('🚀 HR System Service Worker loaded (Online-only mode)');
console.log('✅ App shell caching enabled for faster loading');
console.log('🌐 Requires internet connection for full functionality');