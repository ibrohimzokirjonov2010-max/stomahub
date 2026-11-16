// Yetkazish / olib ketish vaqtini tanlash mantig‘i (Toshkent vaqti). Sof funksiyalar — desktop, mobil va sotuvchi ko‘rinishi uchun umumiy.
export const ASAP = 'asap'
export const TIME_WINDOWS = ['09:00–12:00', '12:00–15:00', '15:00–18:00', '18:00–21:00']
const MON = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']
const WD = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']
const WD_SHORT = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan']
const pad = (n) => String(n).padStart(2, '0')

/** Toshkentdagi hozirgi sana va vaqt (qurilma zonasidan qat’i nazar). */
export function tashkentNow(date = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tashkent', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
    .formatToParts(date).map((x) => [x.type, x.value]))
  return { iso: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) % 24, minute: Number(p.minute) }
}
// Sana arifmetikasi UTC’da — qurilma zonasi va yozgi vaqt ta’sir qilmaydi
const utc = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)) }
const isoOf = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
export const addDays = (iso, n) => { const d = utc(iso); d.setUTCDate(d.getUTCDate() + n); return isoOf(d) }
export const weekday = (iso) => utc(iso).getUTCDay()
const isIso = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)

/** Eng erta sana: Toshkent / olib ketish — bugun; viloyatlar — kamida 2 kun keyin (yakshanba o‘tkaziladi). */
export function earliestISO(city, pickup, now = tashkentNow()) {
  if (pickup || !city || city === 'Toshkent') return now.iso
  let d = addDays(now.iso, 2)
  if (weekday(d) === 0) d = addDays(d, 1)
  return d
}

const toMin = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5))
/** Oraliq ochiqmi: o‘tgan kun — yo‘q; bugun — oraliq tugashiga kamida 1 soat qolgan bo‘lsa. */
export function slotOpen(iso, w, now = tashkentNow()) {
  if (!isIso(iso) || iso < now.iso) return false
  if (iso > now.iso) return true
  return toMin(w.slice(-5)) - (now.hour * 60 + now.minute) >= 60
}
export const openSlots = (iso, now = tashkentNow()) => TIME_WINDOWS.filter((w) => slotOpen(iso, w, now))

/** «Bugun», «Ertaga» va keyingi 5 kun (eng erta sanadan boshlab). Bugun bo‘sh oraliq qolmagan bo‘lsa — o‘chiq. */
export function dayChips(minISO, now = tashkentNow(), count = 7) {
  const start = minISO && minISO > now.iso ? minISO : now.iso
  return Array.from({ length: count }, (_, i) => {
    const iso = addDays(start, i)
    const [, m, d] = iso.split('-').map(Number)
    const rel = iso === now.iso ? 'Bugun' : iso === addDays(now.iso, 1) ? 'Ertaga' : ''
    return { iso, label: rel || WD_SHORT[weekday(iso)], date: `${d}-${MON[m - 1]}`, disabled: !openSlots(iso, now).length }
  })
}

/** Sukut: «Imkon qadar tezroq» — xaridor uchun eng sodda, sotuvchi eng yaqin vaqtni taklif qiladi. */
export const defaultWhen = () => ({ date: '', slot: ASAP })
export const isAsap = (w) => !w || w.slot === ASAP

/** Eskirgan tanlovni (o‘tgan kun / yopilgan oraliq / eng erta sanadan oldin) tuzatadi. */
export function normalizeWhen(w, minISO, now = tashkentNow()) {
  if (isAsap(w)) return defaultWhen()
  const min = minISO && minISO > now.iso ? minISO : now.iso
  let date = isIso(w.date) && w.date >= min ? w.date : ''
  if (!date) date = dayChips(min, now).find((c) => !c.disabled)?.iso || addDays(min, 1)
  const open = openSlots(date, now)
  if (!open.length) return defaultWhen()
  return { date, slot: open.includes(w.slot) ? w.slot : open[0] }
}

/** Yuborishdan oldin tekshiruv: '' — to‘g‘ri, aks holda xato matni. */
export function whenError(w, minISO, now = tashkentNow()) {
  if (isAsap(w)) return ''
  if (!isIso(w.date)) return 'Kun va vaqt oralig‘ini tanlang'
  if (w.date < now.iso) return 'Tanlangan kun o‘tib ketgan — boshqa kunni tanlang'
  if (minISO && w.date < minISO) return 'Bu manzilga eng erta yetkazish sanasidan oldingi kun tanlangan'
  if (!TIME_WINDOWS.includes(w.slot)) return 'Vaqt oralig‘ini tanlang'
  if (!slotOpen(w.date, w.slot, now)) return 'Tanlangan vaqt o‘tib ketgan — boshqa vaqtni tanlang'
  return ''
}

export function fmtDate(iso) {
  if (!isIso(iso)) return ''
  const [y, m, d] = iso.split('-').map(Number)
  return `${d}-${MON[m - 1]} ${y}, ${WD[weekday(iso)]}`
}
/** Xaridorga ko‘rsatiladigan qisqa matn: «Ertaga, 17-noyabr (seshanba), 09:00–12:00» yoki «Imkon qadar tezroq». */
export function whenLabel(w, now = tashkentNow()) {
  if (isAsap(w)) return 'Imkon qadar tezroq'
  const [, m, d] = w.date.split('-').map(Number)
  const rel = w.date === now.iso ? 'Bugun, ' : w.date === addDays(now.iso, 1) ? 'Ertaga, ' : ''
  return `${rel}${d}-${MON[m - 1]} (${WD[weekday(w.date)].toLowerCase()})${w.slot ? `, ${w.slot}` : ''}`
}

/** Sotuvchiga boradigan izoh qismi (eski format bilan mos). */
export function whenNote(w, pickup) {
  const what = pickup ? 'Olib ketish' : 'Yetkazish'
  if (isAsap(w)) return `${what} vaqti: imkon qadar tezroq`
  return `${what} sanasi: ${fmtDate(w.date)}${w.slot ? `, ${w.slot}` : ''}`
}

/** Sotuvchi ko‘rinishi: izohdan xaridor tanlagan vaqtni ajratib oladi. */
export function parseWhenNote(note = '') {
  const parts = String(note || '').split(' | ')
  const i = parts.findIndex((p) => /^(Yetkazish|Olib ketish) (sanasi|vaqti): /.test(p))
  if (i < 0) return { when: '', rest: String(note || '') }
  const m = parts[i].match(/^(Yetkazish|Olib ketish) (?:sanasi|vaqti): (.*)$/)
  const val = m[2] === 'imkon qadar tezroq' ? 'Imkon qadar tezroq' : m[2]
  return { kind: m[1], when: val, asap: m[2] === 'imkon qadar tezroq', rest: parts.filter((_, j) => j !== i).join(' | ') }
}
