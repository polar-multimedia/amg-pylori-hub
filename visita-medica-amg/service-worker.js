/* ═══════════════════════════════════════════════════════════════
   Visita Médica AMG · Service Worker
   Offline-first cache con actualización en background
   ═══════════════════════════════════════════════════════════════ */

const VERSION = 'vm-amg-v1-2026-04-23';
const CORE_CACHE = 'core-' + VERSION;
const ASSETS_CACHE = 'assets-' + VERSION;

/* ── Archivos locales críticos ── */
const CORE_FILES = [
  './',
  './index.html',
  './manifest.json',
  './css/rep-stack.css',
  './js/rep-engine.js',
  './data/ciclos.json',
  './componentes/calculadora-riesgo.html',
  './componentes/visor-3d.html',
  './componentes/comparador-kicab.html',
  './componentes/qr-seguimiento.html'
];

/* ── CDNs usadas por los interactivos (Three.js, QRCode) ── */
const CDN_FILES = [
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,700;0,800;0,900;1,400;1,900&family=Inter:wght@400;500;600;700&display=block'
];

/* ── Imágenes de la campaña AMG (pre-cache) ── */
const IMG_FILES = [
  '../HUB_AMG_PYLORI/brand_amg/hispanica_mujer_c1_gastritis.png',
  '../HUB_AMG_PYLORI/brand_amg/hispanico_hombre_c2_transmisio.png',
  '../HUB_AMG_PYLORI/brand_amg/hispanica_mujer_c3_auto.png',
  '../HUB_AMG_PYLORI/brand_amg/hispanico_hombre_c4_consulta.png',
  '../HUB_AMG_PYLORI/brand_amg/hispanica_mujer_c5_dispepsia.png',
  '../HUB_AMG_PYLORI/brand_amg/bacteria_c7_tratamiento.png',
  '../HUB_AMG_PYLORI/brand_amg/logo_amg_oscuro.png',
  '../HUB_AMG_PYLORI/brand_amg/franja.png'
];

/* ── INSTALL: cachear todo lo crítico ── */
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CORE_CACHE).then(cache => {
      // Core primero (sin internet puede fallar algún CDN, no bloqueamos)
      return cache.addAll(CORE_FILES)
        .then(() => console.info('[SW] Core cacheado'))
        .catch(err => console.warn('[SW] Algunos core falló:', err));
    }).then(() => caches.open(ASSETS_CACHE).then(cache => {
      // Assets (imágenes + CDNs) — best effort
      return Promise.allSettled([...CDN_FILES, ...IMG_FILES].map(url =>
        cache.add(url).catch(err => console.warn('[SW] skip:', url, err.message))
      ));
    }))
  );
});

/* ── ACTIVATE: limpiar caches viejos ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => !k.endsWith(VERSION)).map(k => {
        console.info('[SW] Eliminando cache viejo:', k);
        return caches.delete(k);
      })
    )).then(() => self.clients.claim())
  );
});

/* ── FETCH: cache-first con fallback a network ── */
self.addEventListener('fetch', event => {
  const req = event.request;
  // Solo GET
  if (req.method !== 'GET') return;
  // Ignorar Firebase (siempre online)
  if (req.url.includes('firebaseio.com') || req.url.includes('gstatic.com/firebasejs')) return;
  // Ignorar chrome-extension://
  if (!req.url.startsWith('http')) return;

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) {
        // Refresh en background (stale-while-revalidate)
        fetch(req).then(fresh => {
          if (fresh && fresh.ok) {
            const cacheName = req.url.includes('/HUB_AMG_PYLORI/') || req.url.includes('cdnjs.cloudflare.com') || req.url.includes('fonts.g')
              ? ASSETS_CACHE : CORE_CACHE;
            caches.open(cacheName).then(c => c.put(req, fresh.clone())).catch(() => {});
          }
        }).catch(() => {});
        return cached;
      }
      // No está en cache → network con fallback
      return fetch(req).then(fresh => {
        if (fresh && fresh.ok) {
          const cacheName = req.url.includes('/HUB_AMG_PYLORI/') || req.url.includes('cdnjs.cloudflare.com') || req.url.includes('fonts.g')
            ? ASSETS_CACHE : CORE_CACHE;
          caches.open(cacheName).then(c => c.put(req, fresh.clone())).catch(() => {});
        }
        return fresh;
      }).catch(() => {
        // Offline fallback
        if (req.destination === 'document') return caches.match('./index.html');
        return new Response('', { status: 504, statusText: 'Offline' });
      });
    })
  );
});

/* ── BACKGROUND SYNC: cuando vuelve online, sincronizar eventos ── */
self.addEventListener('sync', event => {
  if (event.tag === 'sync-vm-events') {
    event.waitUntil(syncEventsFromClient());
  }
});
async function syncEventsFromClient() {
  const clients = await self.clients.matchAll();
  clients.forEach(c => c.postMessage({ type: 'sync-events' }));
}
