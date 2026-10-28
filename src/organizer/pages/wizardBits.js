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
export function validateStep(id, f) {
  if (id === 'info') {
    if (String(f.name || '').trim().length < 3) return 'Seminar nomini kiriting (kamida 3 belgi)'
    if (String(f.about || '').trim().length < 10) return 'Qisqa tavsif kamida 10 belgi bo‘lsin'
    if (!f.topic) return 'Mavzuni tanlang'
    return ''
  }
  if (id === 'when') {
    if (!f.start) return 'Boshlanish sanasini kiriting'
    if (f.end && f.end < f.start) return 'Tugash sanasi boshlanishdan oldin bo‘lishi mumkin emas'
    if ((!f.end || f.end === f.start) && f.endTime && f.startTime && f.endTime <= f.startTime) return 'Tugash vaqti boshlanishdan keyin bo‘lsin'
    if (!String(f.place || '').trim()) return f.placeType === 'online' ? 'Webinar platformasi yoki havolasini kiriting' : 'Manzilni kiriting'
    return ''
  }
  if (id === 'details') {
    const bad = (f.program || []).find((r) => (r.time || r.title) && !(r.time && r.title))
    if (bad) return 'Dasturdagi har bir qatorda vaqt va mavzu bo‘lsin'
    if (f.cmeHours !== '' && f.cmeHours != null && (Number(f.cmeHours) < 0 || Number(f.cmeHours) > 200)) return 'CME soatlari 0–200 oralig‘ida bo‘lsin'
    if (f.cmePoints !== '' && f.cmePoints != null && (Number(f.cmePoints) < 0 || Number(f.cmePoints) > 100)) return 'CME ballari 0–100 oralig‘ida bo‘lsin'
    if (f.practice?.on && !f.practice.kind) return 'Amaliy qism turini tanlang'
    if (f.practice?.on && f.practice.perPerson !== '' && f.practice.perPerson != null && (Number(f.practice.perPerson) < 0 || Number(f.practice.perPerson) > 50)) return 'Implantlar soni 0–50 oralig‘ida bo‘lsin'
    if (f.liveSurgery?.on && String(f.liveSurgery.text || '').trim().length < 5) return 'Jonli jarrohlik haqida qisqacha yozing'
    return ''
  }
  if (id === 'tickets') {
    if (!(f.tickets || []).length) return 'Kamida bitta chipta turi qo‘shing'
    return ''
  }
  return ''
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
}
