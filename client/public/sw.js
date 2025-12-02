/**
 * Service Worker - citizen-reports PWA
 * 
 * Estrategias:
 * - Cache First: Assets estáticos (CSS, JS, imágenes)
 * - Network First: API calls (con fallback a cache)
 * - Stale While Revalidate: Tiles del mapa
 * - Background Sync: Reportes creados offline
 */

const CACHE_VERSION = 'v3';
const STATIC_CACHE = `citizen-reports-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `citizen-reports-dynamic-${CACHE_VERSION}`;
const API_CACHE = `citizen-reports-api-${CACHE_VERSION}`;
const TILES_CACHE = `citizen-reports-tiles-${CACHE_VERSION}`;

// Assets estáticos para precache
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo-jantetelco.jpg',
  '/offline.html'
];

// Rutas de API que se pueden cachear
const CACHEABLE_API_ROUTES = [
  '/api/whitelabel/config',
  '/api/categorias',
  '/api/tipos',
  '/api/dependencias'
];

// ═══════════════════════════════════════════════════════════════
// INSTALL - Precache de assets estáticos
// ═══════════════════════════════════════════════════════════════
self.addEventListener('install', (event) => {
  console.log('🔧 SW: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 SW: Precaching static assets');
        return cache.addAll(PRECACHE_ASSETS).catch(err => {
          console.warn('⚠️ SW: Some assets failed to precache:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// ═══════════════════════════════════════════════════════════════
// ACTIVATE - Limpiar caches antiguos
// ═══════════════════════════════════════════════════════════════
self.addEventListener('activate', (event) => {
  console.log('✅ SW: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name.startsWith('citizen-reports-') && 
                     !name.includes(CACHE_VERSION);
            })
            .map((name) => {
              console.log('🗑️ SW: Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// ═══════════════════════════════════════════════════════════════
// FETCH - Estrategias de cache por tipo de recurso
// ═══════════════════════════════════════════════════════════════
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Solo manejar requests del mismo origen o tiles
  if (url.origin !== location.origin && !isTileRequest(url)) {
    return;
  }
  
  // Ignorar requests de desarrollo
  if (url.pathname.includes('hot-update') || 
      url.pathname.includes('__vite') ||
      url.pathname.includes('node_modules')) {
    return;
  }
  
  // Tiles del mapa - Stale While Revalidate
  if (isTileRequest(url)) {
    event.respondWith(staleWhileRevalidate(request, TILES_CACHE));
    return;
  }
  
  // API requests - Network First con fallback
  if (url.pathname.startsWith('/api/')) {
    // POST/PUT/DELETE - Intentar red, si falla encolar para sync
    if (request.method !== 'GET') {
      event.respondWith(handleMutationRequest(request));
      return;
    }
    
    // GET - Network first con cache fallback
    event.respondWith(networkFirstWithCache(request, API_CACHE));
    return;
  }
  
  // Assets estáticos - Cache First
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }
  
  // HTML navigation - Network first con offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirstWithCache(request, STATIC_CACHE)
        .catch(() => caches.match('/offline.html'))
    );
    return;
  }
  
  // Default - Network con cache fallback
  event.respondWith(networkFirstWithCache(request, DYNAMIC_CACHE));
});

// ═══════════════════════════════════════════════════════════════
// BACKGROUND SYNC - Sincronizar reportes offline
// ═══════════════════════════════════════════════════════════════
self.addEventListener('sync', (event) => {
  console.log('🔄 SW: Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-reports') {
    event.waitUntil(syncPendingReports());
  }
});

// ═══════════════════════════════════════════════════════════════
// PUSH NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════
self.addEventListener('push', (event) => {
  console.log('📬 SW: Push notification received');
  
  let data = { title: 'Nuevo reporte', body: 'Tienes una actualización' };
  
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    console.warn('⚠️ SW: Could not parse push data');
  }
  
  const options = {
    body: data.body || 'Tienes una nueva notificación',
    icon: '/logo-jantetelco.jpg',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: data.data || {},
    actions: [
      { action: 'open', title: 'Ver' },
      { action: 'close', title: 'Cerrar' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Reportes Ciudadanos', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Si ya hay una ventana abierta, enfocarla
        for (const client of clientList) {
          if (client.url.includes(location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Si no, abrir nueva ventana
        if (clients.openWindow) {
          const url = event.notification.data?.url || '/';
          return clients.openWindow(url);
        }
      })
    );
  }
});

// ═══════════════════════════════════════════════════════════════
// ESTRATEGIAS DE CACHE
// ═══════════════════════════════════════════════════════════════

/**
 * Cache First - Buscar en cache, si no existe ir a red
 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('⚠️ SW: Cache first failed:', error);
    throw error;
  }
}

/**
 * Network First - Intentar red, fallback a cache
 */
async function networkFirstWithCache(request, cacheName) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('📦 SW: Network failed, trying cache for:', request.url);
    const cached = await caches.match(request);
    
    if (cached) {
      return cached;
    }
    
    throw error;
  }
}

/**
 * Stale While Revalidate - Retornar cache inmediatamente, actualizar en background
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  // Fetch en background para actualizar cache
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);
  
  // Retornar cache inmediatamente si existe
  return cached || fetchPromise;
}

/**
 * Manejar requests de mutación (POST/PUT/DELETE)
 */
async function handleMutationRequest(request) {
  try {
    const response = await fetch(request.clone());
    return response;
  } catch (error) {
    // Offline - guardar para sincronizar después
    console.log('📴 SW: Offline, queuing request for sync');
    
    // Clonar request y guardar en IndexedDB
    const requestData = await serializeRequest(request);
    await saveToSyncQueue(requestData);
    
    // Registrar sync
    if ('sync' in self.registration) {
      await self.registration.sync.register('sync-reports');
    }
    
    // Retornar respuesta optimista
    return new Response(JSON.stringify({
      ok: true,
      offline: true,
      message: 'Guardado localmente. Se sincronizará cuando vuelva la conexión.'
    }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════

function isTileRequest(url) {
  return url.hostname.includes('tile') ||
         url.hostname.includes('basemaps') ||
         url.hostname.includes('openstreetmap') ||
         url.pathname.includes('/tiles/');
}

function isStaticAsset(pathname) {
  return /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i.test(pathname);
}

async function serializeRequest(request) {
  const body = await request.clone().text();
  return {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers),
    body: body,
    timestamp: Date.now()
  };
}

async function saveToSyncQueue(requestData) {
  // Usar IndexedDB para persistir
  const db = await openSyncDB();
  const tx = db.transaction('pending-requests', 'readwrite');
  await tx.objectStore('pending-requests').add(requestData);
}

async function syncPendingReports() {
  console.log('🔄 SW: Syncing pending reports...');
  
  try {
    const db = await openSyncDB();
    const tx = db.transaction('pending-requests', 'readonly');
    const store = tx.objectStore('pending-requests');
    const requests = await store.getAll();
    
    for (const req of requests) {
      try {
        const response = await fetch(req.url, {
          method: req.method,
          headers: req.headers,
          body: req.body
        });
        
        if (response.ok) {
          // Eliminar de la cola
          const deleteTx = db.transaction('pending-requests', 'readwrite');
          await deleteTx.objectStore('pending-requests').delete(req.id);
          console.log('✅ SW: Synced request:', req.url);
        }
      } catch (e) {
        console.error('❌ SW: Failed to sync:', req.url, e);
      }
    }
    
    // Notificar al usuario
    await self.registration.showNotification('Sincronización completa', {
      body: 'Tus reportes se han sincronizado correctamente',
      icon: '/logo-jantetelco.jpg'
    });
    
  } catch (error) {
    console.error('❌ SW: Sync failed:', error);
  }
}

function openSyncDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('citizen-reports-sync', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-requests')) {
        db.createObjectStore('pending-requests', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

console.log('🚀 Service Worker loaded - citizen-reports PWA');
