// Qidiruv normalizatsiyasi: apostrof turlari (‘ ’ ' ` ʻ ʼ ´) olib tashlanadi, kichik harf,
// kirill → lotin (o‘zbekcha). "qolqop" → "Nitril qo‘lqop" ni topadi, "қўлқоп" ham.
const CYR = {
  а: 'a', б: 'b', в: 'v', г: 'g', ғ: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'y', к: 'k', қ: 'q',
  л: 'l', м: 'm', н: 'n', о: 'o', ў: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ҳ: 'h', ц: 's',
  ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya',
}
export function normSearch(v) {
  return String(v ?? '')
    .toLowerCase()
    .replace(/[\u2018\u2019'`\u02bb\u02bc\u00b4]/g, '')
    .replace(/[\u0400-\u04ff]/g, (c) => CYR[c] ?? c)
    .replace(/\s+/g, ' ')
    .trim()
}
/** haystack (bir nechta maydon) ichida query bormi */
export const matchSearch = (query, ...fields) => {
  const q = normSearch(query)
  return !q || normSearch(fields.filter(Boolean).join(' ')).includes(q)
}
