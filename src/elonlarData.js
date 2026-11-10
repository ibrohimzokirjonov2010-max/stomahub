const img = (n) => `/images/${n}.jpg`

export const DEALS = [
  ['sale', 'Sotiladi'],
  ['rent', 'Ijaraga'],
  ['job', 'Ish o‘rni'],
]
export const dealName = Object.fromEntries(DEALS)

export const AD_CATS = [
  ['all', 'Barchasi'],
  ['uskuna', 'Uskunalar'],
  ['material', 'Materiallar'],
  ['klinika', 'Klinika'],
  ['ish', 'Ish o‘rni'],
  ['asbob', 'Asboblar'],
]
export const adCatName = Object.fromEntries(AD_CATS)
export const AD_CITIES = ['Toshkent', 'Samarqand', 'Andijon', 'Buxoro', 'Namangan']

export const som = (n) => `${Number(n).toLocaleString('ru-RU').replace(/\u00a0/g, ' ')} so‘m`
export const adPrice = (a) => (a.deal === 'job' ? `${som(a.price).replace(' so‘m', '')} – ${som(a.priceMax)}` : a.deal === 'rent' ? `${som(a.price)} / oy` : som(a.price))

export const SELLERS = {}

const ad = (a) => ({ cond: 'Yangi', original: true, views: 120, ...a })

export const ADS = []

/** Kartochka uchun ixcham narx: ish o‘rni oralig‘i «8 – 15 mln so‘m» (to‘liq raqam kartochkaga sig‘maydi). */
const mln = (n) => String(Math.round((Number(n) / 1e6) * 10) / 10).replace('.', ',')
export const adPriceShort = (a) => (a?.deal === 'job' && Number(a.price) >= 1e6 && Number(a.priceMax) >= 1e6
  ? `${mln(a.price)} – ${mln(a.priceMax)} mln so‘m`
  : adPrice(a))
