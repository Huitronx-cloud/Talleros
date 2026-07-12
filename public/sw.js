// ── Service worker de TallerOS ────────────────────────────────────────────────
// 1. Push notifications (lógica original)
// 2. Soporte offline CONSERVADOR:
//    - Navegaciones: red primero; si no hay conexión, página /offline.
//    - Estáticos de Next (/_next/static, con hash en el nombre): cache-first.
//    - Nada más se cachea. El HTML y los datos del dashboard SIEMPRE van a la
//      red — un taller nunca debe ver órdenes o pagos desactualizados.

const CACHE = 'talleros-v2'
const OFFLINE_URL = '/offline'
// /abriendo es la página puente de arranque de la PWA: estática, se sirve
// cache-first para que el splash pinte al instante del tap (su redirect es
// un script inline, no depende de chunks — seguro aunque quede cacheada
// una versión vieja tras un deploy).
const ABRIENDO_URL = '/abriendo'
const PRECACHE = [OFFLINE_URL, ABRIENDO_URL, '/icon-192.png', '/icon-512.png', '/manifest.json']

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', function(event) {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // Arranque de la PWA: cache-first + revalidación en segundo plano —
  // pinta el splash sin esperar a la red
  if (req.mode === 'navigate' && url.pathname === ABRIENDO_URL) {
    event.respondWith(
      caches.match(ABRIENDO_URL).then(hit => {
        const red = fetch(req).then(res => {
          if (res.ok) {
            const copia = res.clone()
            caches.open(CACHE).then(cache => cache.put(ABRIENDO_URL, copia))
          }
          return res
        })
        return hit ?? red.catch(() => caches.match(OFFLINE_URL).then(r => r ?? Response.error()))
      })
    )
    return
  }

  // Navegaciones: red primero, /offline como respaldo
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() =>
        caches.match(OFFLINE_URL).then(res => res ?? Response.error())
      )
    )
    return
  }

  // Estáticos con hash de Next + iconos precacheados: cache-first
  const esEstatico = url.pathname.startsWith('/_next/static/') || PRECACHE.includes(url.pathname)
  if (esEstatico) {
    event.respondWith(
      caches.match(req).then(hit => {
        if (hit) return hit
        return fetch(req).then(res => {
          if (res.ok) {
            const copia = res.clone()
            caches.open(CACHE).then(cache => cache.put(req, copia))
          }
          return res
        })
      })
    )
  }
  // Todo lo demás (API, datos, imágenes dinámicas): directo a la red
})

// ── Push notifications ────────────────────────────────────────────────────────

self.addEventListener('push', function(event) {
  if (!event.data) return

  const data = event.data.json()

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body,
      icon:    '/icon-192.png',
      badge:   '/icon-192.png',
      vibrate: [200, 100, 200],
      data:    { url: data.url || '/ordenes' },
      actions: [
        { action: 'ver', title: 'Ver orden' },
      ],
    })
  )
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()

  const url = event.notification.data?.url || '/ordenes'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})
