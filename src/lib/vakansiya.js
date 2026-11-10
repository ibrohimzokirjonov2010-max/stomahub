// Vakansiyalar (catalog_items kind='job', 0069 job_guard) — sof funksiyalar, server qoidalari bilan bir xil.
import { normalizeTelegram, telegramUrl } from '../elonValidate.js'
import { formatUzPhoneDisplay } from './phoneUz.js'

export const JOB_TYPES = [['full', 'To‘liq stavka'], ['part', 'Yarim stavka'], ['shift', 'Smenali'], ['remote', 'Masofaviy']]
export const JOB_TYPE_NAME = Object.fromEntries(JOB_TYPES)
export const JOB_CITIES = [
  ['toshkent', 'Toshkent'], ['toshkent_v', 'Toshkent viloyati'], ['samarqand', 'Samarqand'], ['buxoro', 'Buxoro'],
  ['andijon', 'Andijon'], ['fargona', 'Farg‘ona'], ['namangan', 'Namangan'], ['qashqadaryo', 'Qashqadaryo'],
  ['surxondaryo', 'Surxondaryo'], ['xorazm', 'Xorazm'], ['navoiy', 'Navoiy'], ['jizzax', 'Jizzax'], ['sirdaryo', 'Sirdaryo'],
  ['qoraqalpogiston', 'Qoraqalpog‘iston'], ['boshqa', 'Boshqa'],
]
export const JOB_CITY_NAME = Object.fromEntries(JOB_CITIES)
export const MAX = { title: 80, clinic: 100, address: 160, requirements: 2000, about: 2000 }
const TG_RE = /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/

/** Bir qatorli matn: <, > va boshqaruv belgilari olib tashlanadi (server job_clean bilan bir xil). */
export const clean1 = (s, max) => String(s ?? '').replace(/[<>\p{Cc}]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
/** Ko‘p qatorli: qator ko‘chishi saqlanadi. */
export const cleanMulti = (s, max) => String(s ?? '').replace(/\r/g, '').replace(/[<>\x01-\x09\x0b-\x1f\x7f]/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, max)
export const digits = (s) => String(s ?? '').replace(/\D/g, '')
export const salaryNum = (s) => { const d = digits(s).slice(0, 11); return d ? Number(d) : null }
export const fmtNum = (n) => Number(n).toLocaleString('ru-RU').replace(/\u00a0/g, ' ')

/** "8 000 000 – 15 000 000 so‘m", "8 000 000 so‘mdan", "15 000 000 so‘mgacha" yoki "Kelishiladi". */
export function salaryText(min, max) {
  const a = Number(min) || 0
  const b = Number(max) || 0
  if (a && b) return a === b ? `${fmtNum(a)} so‘m` : `${fmtNum(a)} – ${fmtNum(b)} so‘m`
  if (a) return `${fmtNum(a)} so‘mdan`
  if (b) return `${fmtNum(b)} so‘mgacha`
  return 'Kelishiladi'
}

/** Talablar: har qatorda bitta (ko‘pi bilan 20). */
export const reqList = (text) => String(text ?? '').split('\n').map((x) => clean1(x.replace(/^\s*[-•*]\s*/, ''), 200)).filter(Boolean).slice(0, 20)

/** tel: havola — faqat to‘liq +998 raqam. */
export function telHref(phone) {
  const d = digits(phone)
  return /^998\d{9}$/.test(d) ? `tel:+${d}` : null
}
export const phoneLabel = (phone) => (telHref(phone) ? formatUzPhoneDisplay(phone) : '')
export const tgHref = (u) => telegramUrl(u)

/**
 * Forma tekshiruvi. f: { title, clinic, city, address, min, max, type, requirements, about, phone, telegram }
 * Qaytaradi: { maydon: xabar }
 */
export function validateJob(f) {
  const e = {}
  const title = clean1(f.title, 200)
  const clinic = clean1(f.clinic, 200)
  if (title.length < 3) e.title = 'Lavozimni kiriting (kamida 3 belgi)'
  else if (title.length > MAX.title) e.title = `Lavozim ${MAX.title} belgidan oshmasin`
  if (clinic.length < 2) e.clinic = 'Klinika yoki ish beruvchi nomini kiriting'
  else if (clinic.length > MAX.clinic) e.clinic = `Nom ${MAX.clinic} belgidan oshmasin`
  if (!JOB_CITY_NAME[f.city]) e.city = 'Shaharni tanlang'
  if (String(f.address || '').length > MAX.address) e.address = `Manzil ${MAX.address} belgidan oshmasin`
  if (!JOB_TYPE_NAME[f.type]) e.type = 'Ish turini tanlang'
  const a = salaryNum(f.min)
  const b = salaryNum(f.max)
  if ((a && a > 1e10) || (b && b > 1e10)) e.salary = 'Maosh juda katta'
  else if (a && b && a > b) e.salary = 'Maoshning «dan» qiymati «gacha» qiymatidan katta bo‘lmasin'
  if (String(f.requirements || '').length > MAX.requirements) e.requirements = `Talablar ${MAX.requirements} belgidan oshmasin`
  if (String(f.about || '').length > MAX.about) e.about = `Tavsif ${MAX.about} belgidan oshmasin`
  const ph = digits(f.phone)
  const phoneGiven = ph.length > 3 // "+998" prefiksining o‘zi — bo‘sh
  const tg = normalizeTelegram(f.telegram)
  if (phoneGiven && !/^998\d{9}$/.test(ph)) e.phone = 'Telefon raqamini to‘liq kiriting (+998 XX XXX XX XX)'
  if (tg && !TG_RE.test(tg)) e.telegram = 'Telegram username noto‘g‘ri (5–32 belgi: harf, raqam, _)'
  if (!phoneGiven && !tg) e.contact = 'Telefon yoki Telegram username kiriting'
  return e
}

const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']
export const postedLabel = (d = new Date()) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`

/** Forma → catalog_items payload (server baribir qayta quradi). */
export function toPayload(f, id, prev = null) {
  const ph = digits(f.phone)
  return {
    id,
    title: clean1(f.title, MAX.title),
    clinic: clean1(f.clinic, MAX.clinic),
    city: f.city,
    cityLabel: JOB_CITY_NAME[f.city] || '',
    address: clean1(f.address, MAX.address),
    type: f.type,
    spec: f.spec || '',
    exp: f.exp || '',
    min: salaryNum(f.min),
    max: salaryNum(f.max),
    requirements: reqList(f.requirements),
    about: cleanMulti(f.about, MAX.about),
    phone: /^998\d{9}$/.test(ph) ? `+${ph}` : '',
    telegram: normalizeTelegram(f.telegram),
    posted: prev?.posted || postedLabel(),
    status: prev?.status || 'active',
  }
}

/** payload → forma (tahrirlash uchun). */
export const toForm = (j) => ({
  title: j.title || '', clinic: j.clinic || '', city: j.city || 'toshkent', address: j.address || '',
  min: j.min ? String(j.min) : '', max: j.max ? String(j.max) : '', type: j.type || 'full', spec: j.spec || '', exp: j.exp || '',
  requirements: (j.requirements || []).join('\n'), about: j.about || '', phone: j.phone || '+998 ', telegram: j.telegram || '',
})
export const emptyForm = () => ({ title: '', clinic: '', city: 'toshkent', address: '', min: '', max: '', type: 'full', spec: '', exp: '', requirements: '', about: '', phone: '+998 ', telegram: '' })

/** Faqat foydalanuvchilar joylagan (0069) va faol vakansiyalar ommaviy ro‘yxatda. */
export const isPublicJob = (j) => !!j && (j.status || 'active') === 'active' && !j._pending

/** Server xatolarini tushunarli qilish ("job_phone: ..." → "..."). */
export function jobError(e) {
  const m = String(e?.message || e || '')
  const hit = m.match(/job_[a-z]+:\s*(.+)$/)
  if (hit) return hit[1]
  return m || 'Vakansiyani saqlab bo‘lmadi. Qayta urinib ko‘ring.'
}

const short = (n) => {
  const v = Number(n) || 0
  if (v >= 1e6) return `${String(Math.round(v / 1e5) / 10).replace('.', ',')} mln`
  if (v >= 1e3) return `${Math.round(v / 1e3)} ming`
  return fmtNum(v)
}
/** Kartochka uchun qisqa: "8–15 mln so‘m", "3,5 mln so‘mdan". */
export function salaryShort(min, max) {
  const a = Number(min) || 0
  const b = Number(max) || 0
  if (a && b) {
    if (a === b) return `${short(a)} so‘m`
    const sa = short(a); const sb = short(b)
    return sa.endsWith(' mln') && sb.endsWith(' mln') ? `${sa.slice(0, -4)}–${sb} so‘m` : `${sa} – ${sb} so‘m`
  }
  if (a) return `${short(a)} so‘mdan`
  if (b) return `${short(b)} so‘mgacha`
  return 'Kelishiladi'
}
