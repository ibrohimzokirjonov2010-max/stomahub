// Matn normallashtirish: kichik harf, barcha apostrof turlari bitta ' ga, ortiqcha bo‘shliqlar yo‘q.
export function normText(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[‘’ʻʼ`´']/g, "'")
    .replace(/[ё]/g, 'е')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Mahsulotning qidiriladigan matni (nom, kategoriya, tur, tavsif, xususiyatlar). */
export function productText(p) {
  if (!p) return ''
  const specs = Array.isArray(p.specs) ? p.specs.map((x) => (Array.isArray(x) ? x.join(' ') : '')).join(' ') : ''
  return normText([p.name, p.rawCategory, p.category, p.type, p.brand, String(p.description || '').slice(0, 400), specs].filter(Boolean).join(' '))
}

/** stems ro‘yxatidan matnda uchraganlarini qaytaradi (har biri bir marta). */
export function hits(text, stems) {
  const t = normText(text)
  return stems.filter((s) => t.includes(normText(s)))
}

/** Faqat nom + kategoriya + tur (tavsifdagi tasodifiy so‘zlarsiz). */
export function productTitleText(p) {
  if (!p) return ''
  return normText([p.name, p.rawCategory, p.category, p.type].filter(Boolean).join(' '))
}
