// Yetkazib berish: kuzatuv linki va kuryer ma’lumotlari (0067).
// Server (delivery_tracking_url_ok / seller_set_delivery) bilan bir xil qoidalar — bu yerda faqat
// formada oldindan ko‘rsatish uchun; haqiqiy tekshiruv bazada.

export const DELIVERY_SERVICES = [
  ['yandex', 'Yandex (Go / Dostavka)'],
  ['boshqa', 'Boshqa xizmat'],
  ['ozim', 'O‘zim yetkazaman'],
]

/** Xaridorga ko‘rsatiladigan xizmat nomi. */
export const serviceLabel = (s) => ({ yandex: 'Yandex Dostavka / Yandex Go', boshqa: 'Yetkazib berish xizmati', ozim: 'Sotuvchining o‘z kuryeri' }[s] || '')

const YANDEX_HOST = /^([a-z0-9-]+\.)*(yandex\.(uz|ru|com|kz|by|com\.tr)|ya\.ru|ya\.cc|go\.yandex)$/
const HOST = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/

export const URL_MSG = {
  required: 'Kuzatuv linkini kiriting',
  https: 'Kuzatuv havolasi https:// bilan boshlanishi kerak',
  yandex: 'Faqat Yandex kuzatuv havolasi qabul qilinadi (yandex.uz, yandex.ru, yandex.com, go.yandex, ya.cc). Boshqa xizmat bo‘lsa, «Boshqa» ni tanlang',
}

/** https + to‘g‘ri host; Yandex uchun allow-list. true/false. */
export function trackingUrlOk(service, url) {
  const v = String(url ?? '').trim()
  if (!v) return true
  if (v.length > 500 || /[\s\p{Cc}<>"'\\`]/u.test(v)) return false
  const low = v.toLowerCase()
  if (!low.startsWith('https://')) return false
  const auth = (low.match(/^https:\/\/([^/?#]*)/) || [])[1] || ''
  if (!auth || auth.includes('@')) return false
  const host = auth.replace(/:[0-9]{1,5}$/, '')
  if (!HOST.test(host) || /^[0-9.]+$/.test(host)) return false
  if (service === 'yandex') return YANDEX_HOST.test(host)
  return true
}

/** Forma xatolari: { service, url, phone } — bo‘sh satr = xato yo‘q. */
export function deliveryErrors(v) {
  const service = String(v?.service || '')
  const url = String(v?.url || '').trim()
  const phone = String(v?.phone || '').trim()
  const e = { service: '', url: '', phone: '' }
  if (!['yandex', 'boshqa', 'ozim'].includes(service)) e.service = 'Yetkazib berish xizmatini tanlang'
  if (!url && service !== 'ozim') e.url = URL_MSG.required
  else if (url && !trackingUrlOk(service || 'yandex', url)) e.url = /^https:\/\//i.test(url) && service === 'yandex' ? URL_MSG.yandex : URL_MSG.https
  if (phone) {
    const digits = phone.replace(/\D/g, '').length
    if (!/^\+?[0-9 ()-]{7,20}$/.test(phone) || digits < 7 || digits > 15) e.phone = 'Kuryer telefoni noto‘g‘ri'
  }
  return e
}
export const hasErrors = (e) => !!(e.service || e.url || e.phone)

/** Xaridor tomonida faqat xavfsiz (https, to‘g‘ri host) havola ko‘rsatiladi. */
export const safeTrackingUrl = (url) => (url && trackingUrlOk('boshqa', url) ? String(url).trim() : '')
export const telHref = (phone) => { const d = String(phone || '').replace(/[^\d+]/g, ''); return d.replace(/\D/g, '').length >= 7 ? `tel:${d}` : '' }

/** Buyurtma (seller_orders qatori) → forma qiymati. */
export const deliveryFromOrder = (o) => ({
  service: o?.delivery_service || (o?.tracking_url ? 'yandex' : ''),
  url: o?.tracking_url || '',
  name: o?.courier_name || '',
  phone: o?.courier_phone || '',
  eta: o?.delivery_eta || '',
})
/** Olib ketish buyurtmasi — yetkazish formasi kerak emas. */
export const needsDeliveryForm = (o) => (o?.delivery_method || '') !== 'olib_ketish'
