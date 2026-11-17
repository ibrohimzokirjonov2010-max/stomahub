/**
 * Realistik tish rasmlari — public/teeth/{kind}/{fdi}.webp
 * Manba: My Clinic CRM (src/utils/toothIllustration.js), WebP 320px balandlikka siqilgan.
 * Yuqori jag' rasmlarida toj pastda, pastki jag'da toj tepada — rasmlar FDI bo'yicha tayyor yo'naltirilgan.
 */

/** public/teeth rasmlari o'zgarsa oshiring (keshni yangilash uchun). */
export const TOOTH_ASSET_VERSION = '20261117a'

export const TOOTH_KINDS = [
  'healthy', 'caries', 'plomba', 'endo', 'shtift', 'implant', 'breket', 'metal-keramika',
  'sirkon', 'protez-syomniy', 'protez-implant', 'protez-babochka', 'missing',
]

/** Har bir rasm faylining eni (balandlik 320px; kalit — fayl raqami, artFdi orqali oling) — jag'da tishlar tabiiy nisbatda joylashadi. */
export const TOOTH_W = {
  11: 109, 12: 110, 13: 97, 14: 109, 15: 117, 16: 146, 17: 150, 18: 151,
  21: 134, 22: 110, 23: 97, 24: 109, 25: 117, 26: 150, 27: 148, 28: 150,
  31: 80, 32: 81, 33: 79, 34: 89, 35: 96, 36: 146, 37: 157, 38: 170,
  41: 80, 42: 81, 43: 79, 44: 89, 45: 89, 46: 145, 47: 161, 48: 169,
}
export const TOOTH_H = 320

/**
 * StomaHub'dagi saqlangan tish holatlari (bemor.teeth[n], reja.teeth[n]) → rasm turi.
 * Eski kalitlar o'zgarmaydi; yangilari (zirconia, braces, denture, implant_crown, butterfly) qo'shimcha.
 * mark — alohida rasmi yo'q holatlar uchun kichik belgi.
 */
export const STATUS_ART = {
  healthy: { kind: 'healthy' },
  caries: { kind: 'caries' },
  filling: { kind: 'plomba' },
  endo: { kind: 'endo' },
  post: { kind: 'shtift' },
  crown: { kind: 'metal-keramika' },
  zirconia: { kind: 'sirkon' },
  veneer: { kind: 'sirkon', mark: ['V', '#8b5cf6'] },
  bridge: { kind: 'sirkon', mark: ['K', '#2f80c9'] },
  implant: { kind: 'implant' },
  implant_crown: { kind: 'protez-implant' },
  denture: { kind: 'protez-syomniy' },
  butterfly: { kind: 'protez-babochka' },
  braces: { kind: 'breket' },
  perio: { kind: 'healthy', mark: ['P', '#e8743b'] },
  mobility: { kind: 'healthy', mark: ['Q', '#d97706'] },
  fracture: { kind: 'healthy', mark: ['!', '#dc2626'] },
  missing: { kind: 'missing' },
}

/** Holat nomlari (o'zbekcha) — barcha tish kartalari uchun bitta ro'yxat. */
export const TOOTH_STATUS_LABELS = {
  healthy: 'Sog‘lom tish',
  caries: 'Karies',
  filling: 'Plomba',
  endo: 'Endodontik davolash',
  post: 'Shtift',
  crown: 'Metall-keramika krona',
  zirconia: 'Sirkon krona',
  veneer: 'Vinir',
  bridge: 'Ko‘prik',
  implant: 'Implant',
  implant_crown: 'Implant ustida protez',
  denture: 'Olinadigan protez',
  butterfly: '“Babochka” protez',
  braces: 'Breket',
  perio: 'Parodontit',
  mobility: 'Qimirlovchi tish',
  fracture: 'Sinish / defekt',
  missing: 'Yo‘q tish',
}

/** Har qanday tish raqamini (11, 36, sut tishi 51–85) kattalar FDI raqamiga keltiradi. */
export function normalizeFdi(raw) {
  const n = parseInt(String(raw ?? '').replace(/[^\d]/g, ''), 10)
  if (!Number.isFinite(n)) return null
  if (TOOTH_W[n]) return n
  const quad = Math.floor(n / 10)
  const pos = n % 10
  if (quad >= 5 && quad <= 8 && pos >= 1 && pos <= 5) return (quad - 4) * 10 + (pos <= 3 ? pos : pos + 2)
  return null
}

/**
 * Rasm fayli raqami. My Clinic CRM pastki jag'ni 38→31 | 41→48 tartibda chizadi (3-chorak ekranning chap tomonida),
 * StomaHub esa standart FDI: 48→41 | 31→38. Shuning uchun pastki jag' fayllari 3↔4 chorak almashtiriladi
 * (31↔41 … 38↔48), aks holda tishlar ko'zguda aks etgandek (ildizlar teskari tomonga egilgan) chiqadi.
 * Sut tishlari (71–75 / 81–85) ham shu orqali to'g'ri tomonga tushadi.
 */
export function artFdi(raw) {
  const fdi = normalizeFdi(raw)
  if (!fdi) return null
  const quad = Math.floor(fdi / 10)
  if (quad === 3) return fdi + 10
  if (quad === 4) return fdi - 10
  return fdi
}

export function artOfStatus(state) {
  if (state && TOOTH_KINDS.includes(state)) return { kind: state }
  return STATUS_ART[state] || STATUS_ART.healthy
}

export function toothSrc(n, kind = 'healthy') {
  const fdi = artFdi(n)
  if (!fdi) return null
  const folder = TOOTH_KINDS.includes(kind) ? kind : 'healthy'
  return `/teeth/${folder}/${fdi}.webp?v=${TOOTH_ASSET_VERSION}`
}

export const isLowerTooth = (n) => [3, 4, 7, 8].includes(Math.floor(Number(n) / 10))

/**
 * Xizmat / bosqich nomidan rasm turini topadi (My Clinic CRM mantig'idan ko'chirilgan).
 * Hech narsa topilmasa null qaytaradi.
 */
export function kindFromText(text) {
  const s = String(text || '').toLowerCase()
  if (!s.trim()) return null
  if (/babochka|butterfly|бабочк/.test(s)) return 'protez-babochka'
  const implant = /implant|имплант/.test(s)
  const prosth = /protez|prosthes|karonka|koronka|krona|\bcrown\b|\btoj\b|протез/.test(s)
  if (implant && prosth) return 'protez-implant'
  if (/syomniy|siyomniy|съ[её]мн|olinadigan|removable|denture|byugel|бюгель/.test(s)) return 'protez-syomniy'
  if (implant) return 'implant'
  if (/ko['’ʻ`‘]?prik|\bbridge\b|мост/.test(s)) return 'sirkon'
  if (/extract|ekstraks|sug['’ʻ`‘]?urish|olib tashla|tish olish|tish yo['’ʻ`‘]?q/.test(s)) return 'missing'
  if (/metal[- _]?keram|metallokeram|металлокерам/.test(s)) return 'metal-keramika'
  if (/sirkon|zirkon|tsirkon|zircon|цирко|vinir|veneer/.test(s)) return 'sirkon'
  if (/protez|prosthes|протез/.test(s)) return 'protez-syomniy'
  if (/karonka|koronka|krona|\bcrown\b|\btoj\b/.test(s)) return 'metal-keramika'
  if (/breket|braces|bracket|брекет/.test(s)) return 'breket'
  if (/shtift|штифт|post and core/.test(s)) return 'shtift'
  if (/endodont|kanal|root canal|pulpit|пульпит|depulp|\bendo\b|эндо/.test(s)) return 'endo'
  if (/plomba|пломб|filling|kompozit|композит|restavr|реставрац/.test(s)) return 'plomba'
  if (/karies|caries|кариес|decay/.test(s)) return 'caries'
  return null
}
