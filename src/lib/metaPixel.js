// Meta Pixel — faqat VITE_META_PIXEL_ID berilganda yuklanadi (async).
const PIXEL_ID = (import.meta.env.VITE_META_PIXEL_ID || '').trim()
let started = false

export function initMetaPixel() {
  if (started || !PIXEL_ID || typeof window === 'undefined') return
  started = true
  if (window.fbq) return
  const fbq = function () {
    fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments)
  }
  fbq.push = fbq
  fbq.loaded = true
  fbq.version = '2.0'
  fbq.queue = []
  window.fbq = fbq
  if (!window._fbq) window._fbq = fbq
  const s = document.createElement('script')
  s.async = true
  s.src = 'https://connect.facebook.net/en_US/fbevents.js'
  document.head.appendChild(s)
  window.fbq('init', PIXEL_ID)
}

export function trackPageView() {
  if (PIXEL_ID && window.fbq) window.fbq('track', 'PageView')
}

export function trackLead(params) {
  if (PIXEL_ID && window.fbq) window.fbq('track', 'Lead', params)
}
