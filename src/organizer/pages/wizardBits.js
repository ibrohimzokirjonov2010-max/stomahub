import { normalizeProgram, programError, splitRange } from '../../programDays'
import { tashkentToday } from '../../tashkentDate'
import { supabase } from '../../supabaseClient'
export const TEAL = 'var(--color-org-teal)'
export const TEAL_MOBILE = 'var(--color-org-teal)'

export const STEPS = [
  { id: 'info', title: 'Asosiy ma’lumotlar' },
  { id: 'when', title: 'Sana va joy' },
  { id: 'details', title: 'Dastur va tafsilotlar' },
  { id: 'tickets', title: 'Chipta turlari' },
  { id: 'speakers', title: 'Ma’ruzachilar' },
  { id: 'cert', title: 'Sertifikat va dizayn' },
  { id: 'marketing', title: 'Marketing' },
  { id: 'review', title: 'Ko‘rib chiqish' },
]

export const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']

export const TOPICS = ['Implantologiya', 'Endodontiya', 'Ortodontiya', 'Jarrohlik', 'Estetika', 'Bolalar', 'Ortopediya (protezlash)', 'Terapiya', 'Parodontologiya', 'Gigiyena', 'Klinika menejmenti']
// Format endi alohida tanlanmaydi — Manzil turidan kelib chiqadi
export const FORMAT_OF = { offline: 'Offline (joyida)', online: 'Onlayn (webinar)', hybrid: 'Gibrid (onlayn + offline)' }
export function placeTypeOf(format) {
  if (/gibrid/i.test(format || '')) return 'hybrid'
  if (/onlayn|online/i.test(format || '')) return 'online'
  return 'offline'
}
export const FORMATS = ['Offline (joyida)', 'Onlayn (webinar)', 'Gibrid (onlayn + offline)']
export const CATS = ['Tibbiy amaliy seminar', 'Master-klass', 'Konferensiya', 'Vebinar']

export const COVERS = [
  '/images/seminars/teeth.jpg',
  '/images/seminars/surgery.jpg',
  '/images/seminars/micro.jpg',
  '/images/seminars/smile.jpg',
]

export const ABOUT = 'Implantologiya sohasidagi zamonaviy yondashuvlar, jarrohlik amaliyoti va klinik holatlar tahlili.'

export const TICKET_COLORS = ['#f59e0b', '#eab308', '#a855f7', '#3b82f6', '#14b8a6', '#22c55e']

export function uzDate(iso, mode = 'dash') {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  const day = String(Number(d))
  const mon = MONTHS[Number(m) - 1] || ''
  if (mode === 'dot') return `${day.padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}`
  if (mode === 'words') return `${day} ${mon} ${y}`
  return `${day}-${mon} ${y}`
}

// Upload to public storage so other users see the image (blob: URLs only work in this tab).
export async function uploadImage(file, folder = 'seminars') {
  const { data: { user } = {} } = supabase ? await supabase.auth.getUser() : {}
  if (!supabase || !user) return URL.createObjectURL(file)
  if (file.size > 10 * 1024 * 1024) throw new Error('Fayl 10 MB dan katta')
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${user.id}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from('seller-media').upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw error
  return supabase.storage.from('seller-media').getPublicUrl(path).data.publicUrl
}

export function readImage(file, onOk, onBad) {
  if (!file) return
  if (!/^image\/(png|jpeg)$/.test(file.type)) { onBad?.(); return }
  uploadImage(file).then(onOk, () => onBad?.())
}

export const box = 'h-10 w-full rounded-xl border border-[#e3eeec] bg-white px-3 text-[13px] text-[#143044] outline-none placeholder:text-[#9aafb4] focus:border-org-teal'

const lines = (v) => (Array.isArray(v) ? v : String(v || '').split('\n')).map((x) => String(x).trim()).filter(Boolean)
export { lines as listLines }

// Har bir bosqich uchun tekshiruv: xato matni yoki '' qaytaradi
// Bosqich xatosi: { field, msg } — field inline xato va scroll uchun
const toMin = (t) => { const m = String(t || '').match(/^(\d{1,2}):(\d{2})/); return m ? Number(m[1]) * 60 + Number(m[2]) : null }
const addDays = (iso, n) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }

/** Dastur vaqtlari seminar soatlari ichida bo‘lishi kerak. */
export function programHoursError(program, startTime, endTime) {
  const a = toMin(startTime), b = toMin(endTime)
  if (a == null || b == null) return ''
  const days = normalizeProgram(program)
  for (let d = 0; d < days.length; d++) {
    for (let r = 0; r < days[d].items.length; r++) {
      const [x, y] = splitRange(String(days[d].items[r].time || ''))
      const xm = toMin(x), ym = toMin(y)
      if ((xm != null && xm < a) || (ym != null && ym > b)) return `Dasturdagi ${d + 1}-kun, ${r + 1}-qator vaqti seminar soatlaridan (${startTime} – ${endTime}) tashqarida`
    }
  }
  return ''
}

/** Ma’ruzachi tajribasi: 0–60 yil butun son. */
export function yearsError(v) {
  if (v === '' || v == null) return ''
  const n = Number(v)
  if (!Number.isInteger(n) || n < 0 || n > 60) return 'Ish tajribasi 0–60 yil oralig‘ida bo‘lsin'
  return ''
}

/** Early bird: narx asosiydan past, muddat bugundan seminar boshlanishidan oldingi kungacha. */
export function earlyBirdError(t, start, today = tashkentToday()) {
  const ep = Number(t?.earlyPrice) || 0
  const eu = String(t?.earlyUntil || '')
  if (!ep && !eu) return ''
  if (!ep || !eu) return 'Early bird narxi va muddati birga kiritilsin'
  if (ep >= Number(t.price)) return 'Early bird narxi asosiy narxdan past bo‘lsin'
  if (eu < today) return 'Early bird muddati o‘tgan sana bo‘lishi mumkin emas'
  if (start && eu > addDays(start, -1)) return 'Early bird muddati seminar boshlanishidan oldin tugashi kerak'
  return ''
}

// opts.origStart — tahrirlanayotgan seminarning saqlangan sanasi (o‘tgan sana bo‘lsa ham o‘zgarmasa ruxsat)
export function stepError(id, f, opts = {}) {
  const today = tashkentToday()
  if (id === 'info') {
    if (String(f.name || '').trim().length < 3) return { field: 'name', msg: 'Seminar nomini kiriting (kamida 3 belgi)' }
    if (String(f.about || '').trim().length < 10) return { field: 'about', msg: 'Qisqa tavsif kamida 10 belgi bo‘lsin' }
    if (!f.topic) return { field: 'topic', msg: 'Mavzuni tanlang' }
    if (!f.cover) return { field: 'cover', msg: 'Seminar posterini yuklang' }
    return null
  }
  if (id === 'when') {
    if (!f.start) return { field: 'start', msg: 'Boshlanish sanasini kiriting' }
    if (f.start < today && f.start !== opts.origStart) return { field: 'start', msg: 'Boshlanish sanasi o‘tgan kun bo‘lishi mumkin emas' }
    if (f.end && f.end < f.start) return { field: 'end', msg: 'Tugash sanasi boshlanishdan oldin bo‘lishi mumkin emas' }
    if ((!f.end || f.end === f.start) && f.endTime && f.startTime && f.endTime <= f.startTime) return { field: 'end', msg: 'Tugash vaqti boshlanishdan keyin bo‘lsin' }
    if (!String(f.place || '').trim()) return { field: 'place', msg: f.placeType === 'online' ? 'Webinar platformasi yoki havolasini kiriting' : 'Manzilni kiriting' }
    return null
  }
  if (id === 'details') {
    const pErr = programError(f.program)
    if (pErr) return { field: 'details', msg: pErr }
    const hErr = programHoursError(f.program, f.startTime, f.endTime)
    if (hErr) return { field: 'details', msg: hErr }
    if (f.cmeHours !== '' && f.cmeHours != null && (Number(f.cmeHours) < 0 || Number(f.cmeHours) > 200)) return { field: 'details', msg: 'CME soatlari 0–200 oralig‘ida bo‘lsin' }
    if (f.cmePoints !== '' && f.cmePoints != null && (Number(f.cmePoints) < 0 || Number(f.cmePoints) > 100)) return { field: 'details', msg: 'CME ballari 0–100 oralig‘ida bo‘lsin' }
    if (f.practice?.on && !f.practice.kind) return { field: 'details', msg: 'Amaliy qism turini tanlang' }
    if (f.practice?.on && f.practice.perPerson !== '' && f.practice.perPerson != null && (Number(f.practice.perPerson) < 0 || Number(f.practice.perPerson) > 50)) return { field: 'details', msg: 'Implantlar soni 0–50 oralig‘ida bo‘lsin' }
    if (f.liveSurgery?.on && String(f.liveSurgery.text || '').trim().length < 5) return { field: 'details', msg: 'Jonli jarrohlik haqida qisqacha yozing' }
    return null
  }
  if (id === 'tickets') {
    if (!(f.tickets || []).length) return { field: 'tickets', msg: 'Kamida bitta chipta turi qo‘shing' }
    for (const t of f.tickets) {
      if (!(Number(t.price) >= 0)) return { field: 'tickets', msg: `“${t.name}” narxi noto‘g‘ri` }
      const e = earlyBirdError(t, f.start, today)
      if (e) return { field: 'tickets', msg: `“${t.name}”: ${e}` }
    }
    return null
  }
  if (id === 'speakers') {
    const list = (f.speakers || []).filter((s) => String(s?.name || '').trim())
    if (!list.length) return { field: 'speakers', msg: 'Kamida bitta ma’ruzachi qo‘shing' }
    for (const s of list) {
      const e = yearsError(s.years)
      if (e) return { field: 'speakers', msg: `${s.name}: ${e}` }
    }
    return null
  }
  return null
}

export function validateStep(id, f, opts) {
  return stepError(id, f, opts)?.msg || ''
}

export const EMPTY_DETAILS = {
  program: [],
  learn: '',
  audience: '',
  includes: '',
  cmeHours: '',
  cmePoints: '',
  practice: { on: false, kind: 'model', perPerson: '', unit: 'implant', materials: 'tashkilotchi' },
  refundPolicy: '',
  liveSurgery: { on: false, text: '' },
  gallery: [],
  faq: [],
  venueNotes: '',
  certDesign: null,
  contactPhone: '',
  contactTelegram: '',
}

// Seminar sahifasida ko‘rinadigan qo‘shimcha maydonlar (form jsonb ichida saqlanadi)
export const EXTRA_KEYS = ['gallery', 'faq', 'venueNotes', 'certDesign', 'contactPhone', 'contactTelegram']
export function pickExtras(src = {}) {
  const out = {}
  for (const k of EXTRA_KEYS) out[k] = src?.[k] ?? EMPTY_DETAILS[k]
  out.faq = (out.faq || []).filter((r) => r && (String(r.q || '').trim() || String(r.a || '').trim()))
  return out
}
