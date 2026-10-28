// Single source of truth for marketplace product taxonomy, shared by the seller form,
// the marketplace catalog and the public product page.

export const MARKET_CATEGORIES = [
  'Restavratsion materiallar', 'Estetik stomatologiya', 'Implantlar', 'Endodontik asboblar',
  'Qolip (ottisk) materiallari', 'Sterilizatsiya', 'Izolyatsiya materiallari', 'Yordamchi materiallar',
  'Sarflanadigan materiallar', 'Instrumentlar', 'Uskunalar', 'Himoya vositalari', 'Ortodontiya',
  'Gigiena vositalari', 'Boshqa',
]

// Legacy / alternative names already stored in seller_products.category
export const CATEGORY_ALIASES = {
  'O‘lchov materiallari': 'Qolip (ottisk) materiallari',
  "O'lchov materiallari": 'Qolip (ottisk) materiallari',
  'Qolip materiallari': 'Qolip (ottisk) materiallari',
  'Ottisk materiallari': 'Qolip (ottisk) materiallari',
  Implantologiya: 'Implantlar',
  Kompozitlar: 'Restavratsion materiallar',
  'Sarf materiallari': 'Sarflanadigan materiallar',
}
export const normCategory = (c) => CATEGORY_ALIASES[String(c || '').trim()] || String(c || '').trim()

// Options for a category <select>: canonical list + the product's current value if it is
// something custom, so editing never shows "— Tanlang —" and never wipes the category.
export const categoryOptions = (current) => {
  const c = normCategory(current)
  return c && !MARKET_CATEGORIES.includes(c) ? [...MARKET_CATEGORIES, c] : MARKET_CATEGORIES
}

export const BRANDS = [
  '3M', 'Dentsply Sirona', 'Dentsply Maillefer', 'Ivoclar', 'GC', 'Kerr', 'VOCO', 'Kulzer', 'Zhermack', 'Ultradent',
  'Tokuyama', 'Meta Biomed', 'Cerkamed', 'Coltene', 'Septodont', 'Straumann', 'Osstem', 'Nobel Biocare', 'Megagen',
  'Woodpecker', 'NSK', 'W&H', 'Mahalliy ishlab chiqaruvchi',
]

export const COUNTRIES = ['O‘zbekiston', 'Janubiy Koreya', 'Germaniya', 'AQSh', 'Shveytsariya', 'Yaponiya', 'Italiya', 'Xitoy', 'Turkiya', 'Rossiya', 'Isroil', 'Liechtenshteyn', 'Polsha', 'Fransiya', 'Boshqa']

// VITA classical A1–D4 + bleach shades
export const SHADES = ['A1', 'A2', 'A3', 'A3.5', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4', 'D2', 'D3', 'D4', 'BL1', 'BL2', 'BL3', 'BL4', 'Universal']
export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
export const ENDO_SIZES = ['#06', '#08', '#10', '#15', '#20', '#25', '#30', '#35', '#40', '#45', '#50', '#55', '#60', '#15-40']
export const ENDO_TAPERS = ['.02', '.04', '.06', '.08', 'Variable']
export const ENDO_LENGTHS = ['21 mm', '25 mm', '31 mm']

export const VARIANT_TYPES = [
  ['rang', 'Rang (VITA)'],
  ['olcham', 'O‘lcham (S/M/L/XL)'],
  ['endo', 'Endo fayl (# va taper)'],
  ['implant', 'Implant (diametr × uzunlik)'],
  ['custom', 'Boshqa (erkin)'],
]
export const VARIANT_TYPE_LABEL = { rang: 'Rang', olcham: 'O‘lcham', endo: 'Fayl o‘lchami', implant: 'Implant o‘lchami', custom: 'Variant' }

export const variantLabel = (v, type) => {
  if (!v) return ''
  const t = typeof type === 'string' ? type : ''
  if (v.label && !t) return v.label
  switch (t || v.type) {
    case 'rang': return v.color || ''
    case 'olcham': return v.size || ''
    case 'endo': return [v.size, v.taper && `taper ${v.taper}`, v.length].filter(Boolean).join(' · ')
    case 'implant': return v.diameter || v.length ? `Ø${v.diameter || '?'} × ${v.length || '?'} mm` : ''
    case 'custom': return v.name || ''
    default: return v.label || [v.color, v.size].filter((x) => x && x !== '—').join(', ')
  }
}

export const UOMS = ['dona', 'quti', 'to‘plam', 'ml', 'g', 'shprits', 'kapsula', 'juft']

export const DOC_TYPES = ['Ro‘yxatdan o‘tganlik guvohnomasi', 'Muvofiqlik sertifikati', 'Sifat sertifikati', 'Deklaratsiya', 'Yo‘riqnoma', 'Boshqa']

export const STORAGE_TEMPS = ['+2…+8 °C', '+5…+25 °C', '+15…+25 °C', '+25 °C dan past', 'Xona harorati']

export const SPEC_PRESETS = ['Brend', 'Kafolat', 'Ob/min', 'Kuchlanish', 'Quvvat', 'Hajmi', 'Og‘irligi', 'Qadoqda', 'Qotish turi', 'Sterillik', 'Material', 'Ishlab chiqarilgan']

export const REORDER_INTERVALS = [[7, 'Har hafta'], [14, 'Har 2 haftada'], [30, 'Har oy'], [60, 'Har 2 oyda'], [90, 'Har 3 oyda']]

// Wholesale tiers: [{ min_qty, price }]. Returns the unit price for a quantity.
export function tierPrice(base, tiers, qty) {
  let price = Number(base) || 0
  let best = 0
  for (const t of Array.isArray(tiers) ? tiers : []) {
    const m = Number(t?.min_qty) || 0
    const p = Number(t?.price) || 0
    if (m > 1 && p > 0 && qty >= m && m >= best) { best = m; price = p }
  }
  return price
}
export const cleanTiers = (tiers) => (Array.isArray(tiers) ? tiers : [])
  .map((t) => ({ min_qty: Math.round(Number(String(t.min_qty).replace(/\s/g, '')) || 0), price: Number(String(t.price).replace(/\s/g, '')) || 0 }))
  .filter((t) => t.min_qty > 1 && t.price > 0)
  .sort((a, b) => a.min_qty - b.min_qty)
