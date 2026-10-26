/** Karta tekshiruvi — Uzcard/Humo odatda CVV so‘ramaydi. */

export function luhnOk(digits) {
  if (!/^\d+$/.test(digits)) return false
  let sum = 0
  let alt = false
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = digits.charCodeAt(i) - 48
    if (alt) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
    alt = !alt
  }
  return sum % 10 === 0
}

export function cardBrand(digits) {
  const d = String(digits || '')
  if (d.startsWith('8600') || d.startsWith('5614')) return 'uzcard'
  if (d.startsWith('9860')) return 'humo'
  if (d.startsWith('4')) return 'visa'
  if (d.startsWith('5') || d.startsWith('2')) return 'mc'
  return 'other'
}

export function cvvRequired(digits) {
  const brand = cardBrand(String(digits || '').replace(/\D/g, ''))
  return brand === 'visa' || brand === 'mc'
}

export function validateCard({ num, exp, cvv }) {
  const digits = String(num || '').replace(/\D/g, '')
  const errs = {}
  if (digits.length !== 16) errs.num = 'Karta raqami 16 ta raqamdan iborat bo‘lishi kerak'
  else if (!luhnOk(digits)) errs.num = 'Karta raqami noto‘g‘ri'
  const raw = String(exp || '').trim()
  const m = raw.match(/^(\d{2})\/(\d{2})$/)
  if (!m) errs.exp = 'Amal qilish muddatini MM/YY ko‘rinishida kiriting'
  else {
    const mm = Number(m[1])
    const yy = Number(m[2])
    if (mm < 1 || mm > 12) errs.exp = 'Oy 01 dan 12 gacha bo‘lsin'
    else {
      const now = new Date()
      const expKey = (2000 + yy) * 12 + mm
      const curKey = now.getFullYear() * 12 + (now.getMonth() + 1)
      if (expKey < curKey) errs.exp = 'Karta muddati o‘tgan'
    }
  }
  if (cvvRequired(digits) && !/^\d{3}$/.test(String(cvv || ''))) errs.cvv = 'CVV 3 ta raqam bo‘lishi kerak'
  return errs
}
