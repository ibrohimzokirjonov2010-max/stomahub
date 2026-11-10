/**
 * Vaqtinchalik NAMUNA (demo) yozuvlar: catalog_items.is_demo = true va owner_id yo‘q.
 * loadCatalog() bunday qatorlarga payload.isDemo = true qo‘yadi. Bunday yozuvlarda:
 *  - kartochkada «Namuna» belgisi, savat tugmasi yo‘q;
 *  - batafsil sahifada aloqa (qo‘ng‘iroq/Telegram/xabar) va xarid o‘rniga «Namuna e’lon» yozuvi.
 */
export const DEMO_BADGE = 'Namuna'
export const DEMO_TITLE = 'Namuna e’lon'
export const DEMO_TEXT = 'Bu yozuv StomaHub ko‘rinishini ko‘rsatish uchun vaqtincha qo‘yilgan. Ma’lumotlar o‘ylab topilgan — aloqa va buyurtma o‘chirilgan.'

export const isDemoItem = (x) => Boolean(x && x.isDemo === true)

/** Katalog kartochkasi: namuna bo‘lsa «Namuna» belgisi, savat va chegirma olib tashlanadi. */
export function demoCard(item, card) {
  if (!isDemoItem(item) || !card) return card
  return { ...card, badge: { text: DEMO_BADGE, tone: 'demo' }, cart: null, oldPrice: 0, rating: null }
}

/** loadCatalog uchun: is_demo faqat egasi yo‘q qatorda haqiqiy. */
export function withDemoFlag(row) {
  const demo = Boolean(row?.is_demo) && !row?.owner_id
  const payload = row?.payload || {}
  if (demo) return { ...row, payload: { ...payload, isDemo: true } }
  if (payload.isDemo) {
    const { isDemo, ...rest } = payload // eslint-disable-line no-unused-vars
    return { ...row, payload: rest }
  }
  return row
}
