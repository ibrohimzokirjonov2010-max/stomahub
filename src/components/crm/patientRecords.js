// Bemor profili uchun YAGONA manbalar:
//   Tashriflar  -> uchrashuvData 'visits' blob (kalendar). Eski p.visits faqat o‘qish uchun qo‘shiladi.
//   To‘lovlar   -> tolovData 'clinic_payments' blob. Eski p.paid / p.payments jamiga bir marta qo‘shiladi.
//   Rejalar     -> rejaData 'plans' blob (plan.patient.id).
//   Fayllar     -> Supabase Storage yopiq 'patient-files' bucket ({uid}/patients/{bemor}/...), signed URL bilan.
import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { currentUid } from '../../recordSync'
import { patchBemor } from '../../bemorData'
import { setVisits } from '../../uchrashuvData'
import { nextClinicReceipt, replaceClinicPayments } from '../../tolovData'
import { addPayment as addPlanPayment, totalOf } from '../../rejaData'
import { tashkentToday } from '../../tashkentDate'

export const PATIENT_BUCKET = 'patient-files'

const SHORT = ['yan', 'fev', 'mar', 'apr', 'may', 'iyun', 'iyul', 'avg', 'sen', 'okt', 'noy', 'dek']
const LONG = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']
const pad = (n) => String(n).padStart(2, '0')

/** ISO, "dd.mm.yyyy" yoki "17 noy 2026" -> "yyyy-mm-dd" ('' agar tushunarsiz). */
export function toIso(s) {
  const v = String(s || '').trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10)
  let m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(v)
  if (m) return `${m[3]}-${pad(m[2])}-${pad(m[1])}`
  m = /^(\d{1,2})\s+([a-zA-Z‘']+)\s+(\d{4})$/.exec(v)
  if (m) {
    const w = m[2].toLowerCase()
    const i = LONG.indexOf(w) >= 0 ? LONG.indexOf(w) : SHORT.indexOf(w)
    if (i >= 0) return `${m[3]}-${pad(i + 1)}-${pad(m[1])}`
  }
  return ''
}
export const isoToDots = (iso) => (iso ? iso.split('-').reverse().join('.') : '')
/** Ko‘rsatish uchun: "17 noyabr 2026" */
export function niceDate(s) {
  const iso = toIso(s)
  if (!iso) return String(s || '—')
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${LONG[m - 1]} ${y}`
}
export const todayIso = () => tashkentToday()

/* ---------------- Tashriflar ---------------- */

export const VISIT_STATUS = {
  tasdiq: { label: 'Tasdiqlangan', cls: 'bg-[#e7f8ee] text-[#1c9a52]' },
  kutil: { label: 'Kutilmoqda', cls: 'bg-[#fff6dc] text-[#a07400]' },
  davol: { label: 'Davolanmoqda', cls: 'bg-[#e7f1ff] text-[#3a6fd6]' },
  yakun: { label: 'Bajarildi', cls: 'bg-[#eef1f5] text-[#5b6b80]' },
  bekor: { label: 'Bekor qilingan', cls: 'bg-[#ffecee] text-[#d23b45]' },
  eski: { label: 'Eski yozuv', cls: 'bg-[#f3f6fb] text-[#6b7a90]' },
}

const ownsRow = (p, row) => (row.patientId ? row.patientId === p.id : row.name === p.name)

/**
 * Bemorning barcha tashriflari: kalendar (asosiy) + eski p.visits (faqat o‘qish).
 * Dublikatlar: visitId yoki sana+vaqt+xizmat bir xil bo‘lsa, eski yozuv tashlanadi.
 */
export function patientVisits(p, calendar = []) {
  if (!p) return []
  const cal = calendar.filter((v) => ownsRow(p, v)).map((v) => ({
    key: `c-${v.id}`,
    id: v.id,
    source: 'calendar',
    iso: v.date,
    time: v.start || '',
    kind: v.service || 'Qabul',
    doctor: v.doctor === 'me' ? '' : v.doctor || '',
    room: v.room || '',
    note: v.note || '',
    tooth: v.tooth || '',
    status: v.status || 'tasdiq',
    done: v.status === 'yakun',
    raw: v,
  }))
  const ids = new Set(cal.map((v) => v.id))
  const sig = new Set(cal.map((v) => `${v.iso}|${v.time}|${v.kind}`))
  const legacy = (p.visits || [])
    .filter((v) => !(v.visitId && ids.has(v.visitId)))
    .map((v, i) => ({
      key: `l-${i}`,
      id: '',
      source: 'legacy',
      iso: toIso(v.date),
      time: v.time || '',
      kind: v.kind || 'Tashrif',
      doctor: v.doctor || '',
      room: '',
      note: v.note || '',
      tooth: v.tooth ? String(v.tooth) : '',
      status: v.done === false ? 'kutil' : 'yakun',
      done: v.done !== false,
      readOnly: true,
      dateText: v.date,
    }))
    .filter((v) => !sig.has(`${v.iso}|${v.time}|${v.kind}`))
  return [...cal, ...legacy].sort((a, b) => `${b.iso} ${b.time}`.localeCompare(`${a.iso} ${a.time}`))
}

export const isUpcoming = (v) => v.status !== 'yakun' && v.status !== 'bekor' && (!v.iso || v.iso >= todayIso())

/** Profil yoki boshqa joydan yangi qabul -> kalendar. */
export function addCalendarVisit(p, { date, start, dur = 30, service, doctor = 'me', room = 'Kreslo 1', note = '', tooth = '', price = 0, serviceId = '' }) {
  const visit = {
    id: `n${Date.now()}`, date, start, dur, name: p.name, photo: p.photo || '', phone: p.phone || '', patientId: p.id,
    service, serviceId, price, status: 'tasdiq', doctor, room, note, tooth, isNew: p.status === 'Yangi',
  }
  setVisits((list) => [...list, visit])
  afterVisitSaved(p, visit)
  return visit
}

/** Qabul saqlangandan keyin bemor kartasidagi "keyingi tashrif" va holat. */
export function afterVisitSaved(p, visit) {
  const patch = {}
  if (visit.date >= todayIso()) patch.next = isoToDots(visit.date)
  if (p.status === 'Yangi' || p.status === 'Nofaol') patch.status = 'Davolanishda'
  if (Object.keys(patch).length) patchBemor(p.id, patch)
}

export function updateCalendarVisit(id, patch) {
  setVisits((list) => list.map((v) => (v.id === id ? { ...v, ...patch } : v)))
}

export function removeCalendarVisit(id) {
  setVisits((list) => list.filter((v) => v.id !== id))
}

export function markVisitDone(p, v, done) {
  updateCalendarVisit(v.id, { status: done ? 'yakun' : 'tasdiq' })
  if (done) patchBemor(p.id, { last: isoToDots(v.iso) })
}

/* ---------------- To‘lovlar ---------------- */

export const PAY_METHODS = [['Naqd', 'Naqd'], ['Karta', 'Karta'], ['Click', 'Click'], ['Payme', 'Payme'], ['Otkazma', 'O‘tkazma']]
export const methodLabel = (m) => (PAY_METHODS.find(([k]) => k === m)?.[1] || m || '—')

/**
 * clinic_payments (asosiy) + eski p.paid / p.payments. Ikki marta sanalmaydi:
 * p.payments ichidagi clinic_payments nusxalari (receipt/clinic belgisi yoki id mos) eski summadan ayiriladi.
 */
export function patientPayments(p, rows = [], plans = []) {
  if (!p) return { list: [], total: 0, paid: 0, debt: 0 }
  const mine = rows.filter((r) => ownsRow(p, r))
  const ids = new Set(mine.map((r) => r.id))
  const counted = mine.filter((r) => r.status !== 'Qaytarilgan')
  const clinicSum = counted.reduce((s, r) => s + (Number(r.amount) || 0), 0)
  const mirror = (x) => Boolean(x.clinic || x.receipt || (x.id && ids.has(x.id)))
  const own = p.payments || []
  const mirroredSum = own.filter(mirror).reduce((s, x) => s + (Number(x.sum) || 0), 0)
  const legacyRows = own.filter((x) => !mirror(x))
  const legacyPaid = Math.max(0, (Number(p.paid) || 0) - mirroredSum)
  const listedLegacy = legacyRows.reduce((s, x) => s + (Number(x.sum) || 0), 0)
  const list = [
    ...mine.map((r) => ({
      key: `c-${r.id}`, id: r.id, source: 'clinic', iso: toIso(r.date), time: r.time || '', sum: Number(r.amount) || 0,
      method: r.method, note: r.note || r.service || '', receipt: r.receipt || '', status: r.status || 'Tolandi',
    })),
    ...legacyRows.map((x, i) => ({
      key: `l-${i}`, source: 'legacy', iso: toIso(x.date), dateText: x.date, time: '', sum: Number(x.sum) || 0, method: x.method, note: x.note || '', status: 'Tolandi',
    })),
    ...(legacyPaid - listedLegacy > 0
      ? [{ key: 'l-rest', source: 'legacy', iso: toIso(p.last), dateText: p.last || '', time: '', sum: legacyPaid - listedLegacy, method: '', note: 'Avvalgi to‘lovlar (umumiy summa)', status: 'Tolandi' }]
      : []),
  ].sort((a, b) => `${b.iso} ${b.time}`.localeCompare(`${a.iso} ${a.time}`))
  const paid = clinicSum + legacyPaid
  const plansTotal = plans.reduce((s, x) => s + totalOf(x), 0)
  const total = Math.max(Number(p.total) || 0, plansTotal)
  return { list, total, paid, debt: Math.max(0, total - paid) }
}

/** Yangi to‘lov: clinic_payments ga yoziladi (/tolovlar ko‘radi) + bemor kartasidagi p.paid nusxasi (ro‘yxat sahifasi uchun). */
export function addClinicPaymentFor(p, { sum, method, date, note = '', planId = '', service = '' }) {
  const amount = Number(sum) || 0
  if (!p || amount <= 0) return null
  const row = {
    id: `tl-${Date.now()}`,
    receipt: nextClinicReceipt(),
    date: isoToDots(date || todayIso()),
    time: new Date().toTimeString().slice(0, 5),
    name: p.name,
    patientId: p.id,
    photo: p.photo || '',
    phone: p.phone || '',
    service: service || 'Davolash',
    amount,
    method,
    status: 'Tolandi',
    chek: true,
    note,
  }
  replaceClinicPayments((list) => [row, ...list])
  patchBemor(p.id, {
    paid: (Number(p.paid) || 0) + amount,
    payments: [{ id: row.id, receipt: row.receipt, clinic: true, date: row.date, sum: amount, method }, ...(p.payments || [])],
  })
  if (planId) addPlanPayment(planId, amount, method, date || todayIso())
  return row
}

/* ---------------- Rejalar ---------------- */

export const plansOf = (p, plans = []) => (p ? plans.filter((x) => x.patient?.id === p.id) : [])

/* ---------------- Fayllar (Storage) ---------------- */

const MAX_FILE = 25 * 1024 * 1024
const MAX_INLINE = 1.5 * 1024 * 1024
const OK_TYPES = /^(image\/(jpeg|png|webp|heic|heif)|application\/pdf)$/

export const isPdf = (d) => /pdf/i.test(d?.mime || '') || /\.pdf$/i.test(d?.name || '') || /^data:application\/pdf/.test(d?.image || '')

function readDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = () => reject(new Error('Faylni o‘qib bo‘lmadi'))
    r.readAsDataURL(file)
  })
}

const safeName = (s) => String(s || 'fayl').normalize('NFKD').replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').slice(-80)

/**
 * Faylni yopiq bucketga yuklaydi. Bucket hali yo‘q (0077 qo‘llanmagan) yoki backend yo‘q bo‘lsa —
 * kichik rasm (1,5 MB gacha) eski usulda (data URL) saqlanadi, aks holda tushunarli xato.
 * Natija: { path?, image?, mime, size }
 */
export async function storePatientFile(patientId, file, { kind = 'doc' } = {}) {
  if (!file) throw new Error('Fayl tanlanmadi')
  const mime = file.type || (/\.pdf$/i.test(file.name) ? 'application/pdf' : '')
  if (!OK_TYPES.test(mime)) throw new Error('Faqat rasm (JPG, PNG, WEBP, HEIC) yoki PDF yuklash mumkin')
  if (file.size > MAX_FILE) throw new Error('Fayl 25 MB dan katta')
  const uid = currentUid()
  if (supabase && uid) {
    const path = `${uid}/patients/${safeName(patientId)}/${kind}-${Date.now()}-${safeName(file.name)}`
    const { error } = await supabase.storage.from(PATIENT_BUCKET).upload(path, file, { contentType: mime, upsert: false, cacheControl: '3600' })
    if (!error) return { path, mime, size: file.size }
    const missing = /bucket not found|not found/i.test(error.message || '')
    if (!missing) throw new Error(`Yuklab bo‘lmadi: ${error.message}`)
  }
  if (mime.startsWith('image/') && file.size <= MAX_INLINE) return { image: await readDataUrl(file), mime, size: file.size }
  throw new Error('Fayl xotirasi hali yoqilmagan (0077 migratsiyasi kerak). Hozircha faqat 1,5 MB gacha rasm yuklash mumkin.')
}

export async function removePatientFile(path) {
  if (!path || !supabase) return
  await supabase.storage.from(PATIENT_BUCKET).remove([path]).catch(() => {})
}

const signedCache = new Map()
export async function signedUrl(path, ttl = 3600) {
  if (!path || !supabase) return ''
  const hit = signedCache.get(path)
  if (hit && hit.until > Date.now()) return hit.url
  const { data, error } = await supabase.storage.from(PATIENT_BUCKET).createSignedUrl(path, ttl)
  if (error || !data?.signedUrl) return ''
  signedCache.set(path, { url: data.signedUrl, until: Date.now() + (ttl - 120) * 1000 })
  return data.signedUrl
}

/** Hujjat yoki rasm uchun ko‘rish manzili: eski data URL / oddiy URL yoki path bo‘yicha signed URL. */
export function useFileUrl(doc) {
  const direct = doc?.image || ''
  const path = doc?.path || ''
  const [url, setUrl] = useState('')
  useEffect(() => {
    let off = false
    if (!direct && path) signedUrl(path).then((u) => { if (!off) setUrl(u) })
    return () => { off = true }
  }, [direct, path])
  return direct || url
}

export async function openPatientFile(doc) {
  const url = doc.image || (doc.path ? await signedUrl(doc.path, 600) : '')
  if (!url) throw new Error('Faylni ochib bo‘lmadi')
  if (url.startsWith('data:')) {
    const blob = await (await fetch(url)).blob()
    window.open(URL.createObjectURL(blob), '_blank', 'noopener')
  } else window.open(url, '_blank', 'noopener')
}

/** Yangi hujjat yozuvi (sana — haqiqiy ISO). */
export async function addPatientDoc(p, file) {
  const stored = await storePatientFile(p.id, file, { kind: 'doc' })
  const doc = {
    id: `doc-${Date.now()}`,
    name: file.name.replace(/\.[^.]+$/, '') || 'Hujjat',
    at: new Date().toISOString(),
    date: isoToDots(todayIso()),
    ...stored,
  }
  patchBemor(p.id, { docs: [doc, ...(p.docs || [])] })
  return doc
}

export async function removePatientDoc(p, doc) {
  const docs = (p.docs || []).filter((d) => d !== doc && !(doc.id && d.id === doc.id))
  patchBemor(p.id, { docs })
  if (doc.path) await removePatientFile(doc.path)
}

export const docDate = (d) => (d.at ? niceDate(d.at.slice(0, 10)) : toIso(d.date) ? niceDate(d.date) : d.date || '—')

/** Bemor rasmi: Storage (yopiq) — p.photoPath + uzoq muddatli signed URL; bucket yo‘q bo‘lsa eski data URL. */
export async function setPatientPhoto(p, file) {
  if (!file?.type?.startsWith('image/')) throw new Error('Faqat rasm yuklash mumkin')
  const stored = await storePatientFile(p.id, file, { kind: 'photo' })
  if (stored.path) {
    const url = await signedUrl(stored.path, 60 * 60 * 24 * 365)
    const old = p.photoPath
    patchBemor(p.id, { photo: url, photoPath: stored.path })
    if (old && old !== stored.path) removePatientFile(old)
    return
  }
  patchBemor(p.id, { photo: stored.image, photoPath: '' })
}

/** Rasm manzili: photoPath bo‘lsa yangi signed URL, aks holda p.photo. */
export function usePatientPhoto(p) {
  const path = p?.photoPath || ''
  const [url, setUrl] = useState('')
  useEffect(() => {
    let off = false
    if (path) signedUrl(path).then((u) => { if (!off) setUrl(u) })
    return () => { off = true }
  }, [path])
  return (path && url) || p?.photo || ''
}
