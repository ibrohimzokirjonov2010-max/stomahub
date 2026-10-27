import { supabase } from '../../supabaseClient'
export const TEAL = 'var(--color-org-teal)'
export const TEAL_MOBILE = 'var(--color-org-teal)'

export const STEPS = [
  { id: 'info', title: 'Asosiy ma’lumotlar' },
  { id: 'when', title: 'Sana va joy' },
  { id: 'tickets', title: 'Chipta turlari' },
  { id: 'speakers', title: 'Ma’ruzachilar' },
  { id: 'cert', title: 'Sertifikat va dizayn' },
  { id: 'marketing', title: 'Marketing' },
  { id: 'review', title: 'Ko‘rib chiqish' },
]

export const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']

export const TOPICS = ['Implantologiya', 'Endodontiya', 'Ortodontiya', 'Jarrohlik', 'Estetika', 'Bolalar']
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
