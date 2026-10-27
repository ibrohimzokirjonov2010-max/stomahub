/* StomaHub service worker — navigations always network-first; never cache-first for HTML. */
const CACHE = 'stomahub-v5'
const PRECACHE = ['/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

function isNavigationRequest(request) {
  if (request.mode === 'navigate') return true
  const accept = request.headers.get('accept') || ''
  return request.destination === 'document' || accept.includes('text/html')
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return
  // Let the browser fetch SW updates / bypass HTTP cache rules without SW interception.
  if (url.pathname === '/sw.js') return

  // index.html and all SPA navigations: network-first, never cache-first.
  // Offline only: fall back to a previously stored shell (keyed as '/').
  if (isNavigationRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(CACHE).then((cache) => {
              cache.put('/', copy)
              try {
                cache.put(request, response.clone())
              } catch {
                /* ignore opaque / unsupported */
              }
            })
          }
          return response
        })
        .catch(async () => {
          const cached = (await caches.match(request)) || (await caches.match('/'))
          return cached || new Response('Offline', { status: 503, statusText: 'Offline' })
        }),
    )
    return
  }

  // Static assets (hashed JS/CSS, icons): network-first, cache for offline.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy))
        }
        return response
      })
      .catch(async () => {
        const cached = await caches.match(request)
        return cached || new Response('', { status: 504 })
      }),
  )
})
