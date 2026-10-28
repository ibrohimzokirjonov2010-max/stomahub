const img = (name) => `/images/ishlar/${name}.jpg`

const fmt = (n) => Number(n).toLocaleString('ru-RU').replace(/\u00a0/g, ' ')
export const som = (n) => `${fmt(n)} so‘m`
export const pay = (a, b) => `${fmt(a)} – ${fmt(b)} so‘m`

export const cities = [
  ['toshkent', 'Toshkent'],
  ['samarqand', 'Samarqand'],
  ['buxoro', 'Buxoro'],
  ['andijon', 'Andijon'],
  ['fargona', 'Farg‘ona'],
  ['namangan', 'Namangan'],
  ['boshqa', 'Boshqa'],
]
export const cityName = Object.fromEntries(cities)

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

// "Masofaviy" faqat klinik bo‘lmagan lavozimlar (administrator) uchun mumkin
export const types = [
  ['full', 'To‘liq stavka'],
  ['part', 'Yarim stavka'],
  ['shift', 'Smenali'],
]
export const remoteSpecs = new Set(['admin'])
export const typeName = Object.fromEntries([...types, ['remote', 'Masofaviy']])
export const typesFor = (spec) => remoteSpecs.has(spec) ? [...types, ['remote', 'Masofaviy']] : types

export const sorts = { fresh: 'Eng yangi', pay: 'Maosh', exp: 'Tajriba' }
export const tips = [
  ['Rezyume qanday yoziladi?', 'Lavozim, klinika tajribasi va natijalarni qisqa yozing. Rasm va diplomni qo‘shing.'],
  ['Suhbatga tayyorgarlik', 'Klinika jihozlari va yo‘nalishi haqida oldindan o‘qing. Savollaringizni yozib boring.'],
  ['Maosh haqida maslahatlar', 'Shahar va tajriba oralig‘ini solishtiring. Stavka, smena va bonusni alohida so‘rang.'],
  ['Stomatologlar uchun karera imkoniyatlari', 'Terapiya, ortodontiya va implantologiya hozir eng ko‘p e’lon berayotgan yo‘nalishlar.'],
  ['Eng talabgir mutaxassisliklar', 'Terapevt, ortoped, jarroh-implantolog va bolalar stomatologi.'],
]
export const resumePhoto = img('ish-resume')

const gallery = [img('ish-reception'), img('ish-waiting'), img('ish-chair'), img('ish-hall')]

export const jobs = []

export const resumes = []

export function getJob(id) {
  return jobs.find((j) => j.id === id) || null
}

export function viewOf(j) {
  return {
    original: j.original || '',
    sourceUrl: j.sourceUrl || '',
    address: j.address || `${j.cityLabel}${j.district ? `, ${j.district}` : ''}`,
    gallery: j.gallery || [j.image, ...gallery.slice(1, 3)],
    // Faqat ish beruvchi kiritgan talablar/sharoitlar — umumiy shablon matn qo‘shilmaydi
    requirements: Array.isArray(j.requirements) ? j.requirements : [],
    benefits: Array.isArray(j.benefits) ? j.benefits : [],
    aboutClinic: j.aboutClinic || '',
  }
}

// Real vakansiyalar bo‘yicha eng ko‘p e’lon bergan klinikalar
export function popularClinics(limit = 5) {
  const m = new Map()
  for (const j of jobs) if (j.clinic) m.set(j.clinic, { name: j.clinic, city: j.cityLabel || '', count: (m.get(j.clinic)?.count || 0) + 1 })
  return [...m.values()].sort((a, b) => b.count - a.count).slice(0, limit)
}

export function clinicCount(name) {
  return jobs.filter((j) => j.clinic === name).length
}
