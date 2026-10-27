/** Uzbek mobile phone helpers: +998 XX XXX XX XX display, E.164 store. */

export const PHONE_INCOMPLETE_MSG = 'Telefon raqam to‘liq emas'
export const PHONE_PREFIX = '+998'

/** Strip to at most 9 national digits (after 998). Handles paste of +998/998/spaces/dashes. */
export function extractUzLocalDigits(raw) {
  let d = String(raw ?? '').replace(/\D/g, '')
  if (d.startsWith('998')) d = d.slice(3)
  if (d.startsWith('0') && d.length > 9) d = d.slice(1)
  return d.slice(0, 9)
}

/** Format as "+998 XX XXX XX XX" (trailing space after +998 when empty). */
export function formatUzPhoneDisplay(value) {
  const d = extractUzLocalDigits(value)
  const parts = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean)
  return parts.length ? `${PHONE_PREFIX} ${parts.join(' ')}` : `${PHONE_PREFIX} `
}

/** E.164 "+998XXXXXXXXX" or null if incomplete. */
export function toE164(value) {
  const d = extractUzLocalDigits(value)
  return d.length === 9 ? `${PHONE_PREFIX}${d}` : null
}

export function isCompleteUzPhone(value) {
  return extractUzLocalDigits(value).length === 9
}

/** Count digit characters before caret index in a formatted string. */
export function digitsBeforeCaret(formatted, caret) {
  let n = 0
  const limit = Math.max(0, Math.min(caret ?? 0, formatted.length))
  for (let i = 0; i < limit; i += 1) {
    if (/\d/.test(formatted[i])) n += 1
  }
  // Digits in "+998" prefix don't count toward national caret mapping
  const prefixDigits = 3 // 998
  return Math.max(0, n - prefixDigits)
}

/** Place caret after the Nth national digit in a formatted display string. */
export function caretAfterNationalDigits(formatted, nationalCount) {
  if (nationalCount <= 0) {
    // After "+998 "
    const idx = formatted.indexOf(' ')
    return idx >= 0 ? idx + 1 : formatted.length
  }
  let seen = 0
  let pastPrefix = false
  for (let i = 0; i < formatted.length; i += 1) {
    const ch = formatted[i]
    if (!pastPrefix) {
      if (ch === ' ') pastPrefix = true
      continue
    }
    if (/\d/.test(ch)) {
      seen += 1
      if (seen >= nationalCount) return i + 1
    }
  }
  return formatted.length
}
