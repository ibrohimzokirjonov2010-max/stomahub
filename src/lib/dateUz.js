// Brauzerda uz-UZ locale yo‘qligi uchun «2026 M11 8» chiqmasin deb qo‘lda formatlaymiz.
export const MONTHS_UZ = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr',
]

/** @returns {string} masalan «8-noyabr, 2026»; yaroqsiz sana uchun '' */
export function formatDateUz(input) {
  if (input == null || input === '') return ''
  const d = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getDate()}-${MONTHS_UZ[d.getMonth()]}, ${d.getFullYear()}`
}
