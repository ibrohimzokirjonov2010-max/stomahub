// Qabul (uchrashuv) holatlari — YAGONA lug‘at. Saqlanadigan kalitlar o‘zgarmaydi (eski ma’lumotlar bilan mos):
//   tasdiq → Tasdiqlangan, kutil → Kutilmoqda, keldi → Keldi, qabulda → Qabulda,
//   yakun → Yakunlangan, kelmadi → Kelmadi, bekor → Bekor qilingan.
// Eski/yon kalitlar normStatus() orqali shu yettitaga keltiriladi: davol → qabulda, yakunlangan/bajarildi/done → yakun.
export const VISIT_STATUS_ORDER = ['tasdiq', 'kutil', 'keldi', 'qabulda', 'yakun', 'kelmadi', 'bekor']

export const VISIT_TONES = {
  tasdiq: { bg: '#e7f8ee', bd: '#b7e4c7', dot: '#3dbe74', text: '#1c7a45', label: 'Tasdiqlangan' },
  kutil: { bg: '#fff6dc', bd: '#f0dc9a', dot: '#f0b429', text: '#8a6200', label: 'Kutilmoqda' },
  keldi: { bg: '#e7f1ff', bd: '#c5daf6', dot: '#3b82f6', text: '#1d4ed8', label: 'Keldi' },
  qabulda: { bg: '#e3f4f5', bd: '#a9dade', dot: '#0b8a95', text: '#0b6d73', label: 'Qabulda' },
  yakun: { bg: '#f2f4f7', bd: '#dfe4ec', dot: '#98a2b3', text: '#475569', label: 'Yakunlangan' },
  kelmadi: { bg: '#fff1e8', bd: '#f6cfb5', dot: '#f97316', text: '#b45309', label: 'Kelmadi' },
  bekor: { bg: '#ffecee', bd: '#f6c9cf', dot: '#ef6b7b', text: '#be123c', label: 'Bekor qilingan' },
}

const ALIAS = { davol: 'qabulda', yakunlangan: 'yakun', bajarildi: 'yakun', done: 'yakun', tasdiqlangan: 'tasdiq', kutilmoqda: 'kutil' }

export function normStatus(s) {
  const k = String(s || '').trim()
  if (VISIT_TONES[k]) return k
  return ALIAS[k] || 'tasdiq'
}

export const isFinal = (s) => normStatus(s) === 'yakun'
export const isClosed = (s) => ['yakun', 'kelmadi', 'bekor'].includes(normStatus(s))
export const toneOf = (s) => VISIT_TONES[normStatus(s)]
export const statusLabel = (s) => toneOf(s).label

/** Ro‘yxatdagi qabullarning holatini yagona kalitlarga keltiradi (o‘zgarmagan bo‘lsa — o‘sha massiv). */
export function normVisits(list) {
  if (!Array.isArray(list)) return list
  let changed = false
  const out = list.map((v) => {
    if (!v || !v.status || VISIT_TONES[v.status]) return v
    changed = true
    return { ...v, status: normStatus(v.status) }
  })
  return changed ? out : list
}
