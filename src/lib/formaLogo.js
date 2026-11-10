// Forma: logo tikish uchun xaridor yuklaydigan fayl (Supabase Storage, bucket 'forma-logos', 0066).
// Yo‘l: <xaridor uid>/<tasodifiy id>.<kengaytma> — RLS: yuklash faqat o‘z papkasiga; o‘qish — xaridor va
// shu logo biriktirilgan buyurtma sotuvchisi. Sof funksiyalar — tests/formaLogo.test.mjs.

export const LOGO_BUCKET = 'forma-logos'
export const LOGO_MAX_MB = 5
export const LOGO_MAX = LOGO_MAX_MB * 1024 * 1024
export const LOGO_TYPES = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/svg+xml': 'svg' }
export const LOGO_ACCEPT = 'image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg'
const EXT_TYPE = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml' }

/** Fayl turi (brauzer type bermasa — kengaytmadan). */
export function logoType(file) {
  const t = String(file?.type || '').toLowerCase()
  if (LOGO_TYPES[t]) return t
  const ext = String(file?.name || '').split('.').pop().toLowerCase()
  return EXT_TYPE[ext] || ''
}

/** Xato matni yoki '' (fayl mos). */
export function logoFileError(file) {
  if (!file) return 'Logo faylini yuklang'
  if (!logoType(file)) return 'Faqat PNG, JPG, WEBP yoki SVG fayl yuklang'
  if (!(Number(file.size) > 0)) return 'Fayl bo‘sh'
  if (Number(file.size) > LOGO_MAX) return `Fayl ${LOGO_MAX_MB} MB dan katta bo‘lmasin`
  return ''
}

const rid = () => (globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`).replace(/[^a-z0-9-]/gi, '')

/** Storage yo‘li (server ham shu shaklni tekshiradi). */
export function logoPath(uid, file, id = rid()) {
  return `${uid}/${id}.${LOGO_TYPES[logoType(file)] || 'png'}`
}

/** Server regex bilan bir xil: o‘z papkasi + xavfsiz nom + ruxsat etilgan kengaytma. */
export const isLogoPathOf = (uid, path) => !!uid && new RegExp(`^${uid}/[A-Za-z0-9_-]+\\.(png|jpg|jpeg|webp|svg)$`).test(String(path || ''))

export const logoFileName = (path, code = '') => `logo${code ? `-${code}` : ''}.${String(path || '').split('.').pop() || 'png'}`

export const fmtSize = (n) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)

/** Savatdagi logo tikish qatorlari (rasmiylashtirishda logo yuklanadi). */
export const logoItems = (items) => (items || []).filter((it) => it?.logoOn || it?.logo)

/** Logo hali yuklanmagan qatorlar (overrides: { [itemId]: { path } } — rasmiylashtirishda yuklangan). */
export function missingLogos(items, overrides = {}) {
  return logoItems(items).filter((it) => !(Object.prototype.hasOwnProperty.call(overrides, it.id) ? overrides[it.id]?.path : it.logo))
}

/** createOrder uchun: rasmiylashtirishda yuklangan/almashtirilgan logo savat qatoriga qo‘shiladi. */
export function withLogos(items, overrides = {}) {
  return (items || []).map((it) => (Object.prototype.hasOwnProperty.call(overrides, it.id) ? { ...it, logo: overrides[it.id]?.path || '' } : it))
}
