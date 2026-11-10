// Vakansiyalar ma’lumotlari. Ro‘yxat (jobs) — faqat foydalanuvchilar joylagan real vakansiyalar
// (catalog_items kind='job', 0069). Egasiz eski seed qatorlar bazada qoladi, lekin ko‘rsatilmaydi (recordSync).
const fmt = (n) => Number(n).toLocaleString('ru-RU').replace(/\u00a0/g, ' ')
export const som = (n) => `${fmt(n)} so‘m`
export const pay = (a, b) => `${fmt(a)} – ${fmt(b)} so‘m`

export const specs = [
  ['terapevt', 'Terapevt'],
  ['ortoped', 'Ortoped'],
  ['ortodont', 'Ortodont'],
  ['jarroh', 'Jarroh'],
  ['bolalar', 'Bolalar stomatologi'],
  ['gigiyenist', 'Gigiyenist'],
  ['texnik', 'Tish texnigi'],
  ['assistent', 'Assistent'],
  ['admin', 'Administrator'],
]
export const specName = Object.fromEntries(specs)

export const exps = [
  ['none', 'Tajriba talab qilinmaydi'],
  ['y1', '1–3 yil'],
  ['y3', '3–5 yil'],
  ['y5', '5+ yil'],
]
export const expName = Object.fromEntries(exps)

export const jobs = []

export function getJob(id) {
  return jobs.find((j) => j.id === id) || null
}
