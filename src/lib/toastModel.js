// Toast (snackbar) uchun sof yordamchilar — testlanadi.

/** Savat belgisi: jami dona soni, 99+ chegarasi. */
export const cartBadge = (count) => {
  const n = Math.max(0, Math.floor(Number(count) || 0))
  return n > 99 ? '99+' : String(n)
}

const CART_RE = /^(?:(\d+)\s*ta\s+)?(.*?)\s*savatga qo[‘'’`]shildi\.?$/i
const ERROR_RE = /(xato|xatolik|bo[‘'’`]lmadi|topilmadi|yuborilmadi|saqlanmadi|qo[‘'’`]shilmaydi|imkoni yo[‘'’`]q|ruxsat yo[‘'’`]q|muvaffaqiyatsiz)/i
const WARN_RE = /^(omborda faqat|diqqat|eslatma)/i

/**
 * Matndan toast turini aniqlaydi.
 * cart: "Filtek savatga qo‘shildi" / "2 ta Filtek savatga qo‘shildi" / "Savatga qo‘shildi"
 * → { kind: 'cart', title: 'Savatga qo‘shildi', name: 'Filtek', qty: 2 }
 */
export function parseToast(text, { warn = false, tone = '' } = {}) {
  const t = String(text ?? '').trim()
  if (tone) return { kind: tone, title: t, name: '', qty: 0 }
  const m = t.match(CART_RE)
  if (m && !warn) return { kind: 'cart', title: 'Savatga qo‘shildi', name: (m[2] || '').trim(), qty: m[1] ? Number(m[1]) : 0 }
  if (warn || WARN_RE.test(t)) return { kind: 'warn', title: t, name: '', qty: 0 }
  if (ERROR_RE.test(t)) return { kind: 'error', title: t, name: '', qty: 0 }
  return { kind: 'success', title: t, name: '', qty: 0 }
}

/** Toast ekranda qancha turadi (ms). */
export const toastDuration = (kind) => (kind === 'cart' ? 3000 : kind === 'error' || kind === 'warn' ? 4000 : 3000)

/**
 * Pastki tab bar (liquid glass) ustida turish uchun CSS `bottom`.
 * `bottom` — eski piksel qiymati (76 = faqat tab bar, 140 = tab bar + harakat paneli; < 76 — tab bar yo‘q, masalan desktop).
 */
export function toastBottom(bottom = 76) {
  const b = Number(bottom) || 0
  const safe = 'max(env(safe-area-inset-bottom, 0px), var(--safe-bottom-sim, 0px))'
  if (b < 76) return `calc(${Math.max(12, b)}px + ${safe})`
  return `calc(var(--bottom-nav-h, 58px) + var(--bottom-nav-float, 14px) + ${safe} + ${b - 76 + 10}px)`
}
