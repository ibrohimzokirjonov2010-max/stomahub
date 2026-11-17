/**
 * Xizmat bajarilganda bemor tish kartasini avtomatik yangilash (sof funksiyalar, store importi yo'q).
 * Chaqiruvchilar: rejaData (bosqich "bajarildi"), bemorData (profil tashrifi done), uchrashuvData (kalendar "yakun"/"keldi").
 * Qoidalar: faqat "bajarilmagan → bajarildi" o'tishida; noma'lum xizmat — hech narsa;
 * qaytarilsa (bajarildi → boshqa) avvalgi holat tiklanadi, agar tish holati shu orada qo'lda o'zgarmagan bo'lsa.
 * Avvalgi holat yozuvning o'zida saqlanadi: item.autoTooth = { status, prev: { [tish]: eski holat } }.
 */

const AP = "['’ʻ`‘]?"

/** Xizmat / bosqich nomi → saqlanadigan tish holati (bemor.teeth qiymati) yoki null. */
export function statusFromService(text) {
  const s = String(text || '').toLowerCase()
  if (!s.trim()) return null
  const implant = /implant|имплант/.test(s)
  if (implant && /koronka|karonka|krona|protez|\bcrown\b|\btoj\b|коронк|протез/.test(s)) return 'implant_crown'
  if (implant) return 'implant'
  if (new RegExp(`olib tashla|ekstraks|extract|sug${AP}urish|tish olish|удален`).test(s)) return 'missing'
  if (new RegExp(`ko${AP}prik|\\bbridge\\b|мост`).test(s)) return 'bridge'
  if (/vinir|veneer|винир/.test(s)) return 'veneer'
  if (/sirkon|zirkon|tsirkon|zircon|цирко/.test(s)) return 'zirconia'
  if (/metall?[- _]?keram|metallokeram|металлокерам|koronka|karonka|krona|\bcrown\b|коронк/.test(s)) return 'crown'
  if (/protez|prosthes|denture|протез/.test(s)) return 'denture'
  if (/breket|braces|bracket|брекет/.test(s)) return 'braces'
  if (/shtift|штифт|post and core/.test(s)) return 'post'
  if (/kanal|endo|pulpit|root canal|пульпит|эндо/.test(s)) return 'endo'
  if (/plomba|restavr|kompozit|filling|пломб|реставр/.test(s)) return 'filling'
  if (/karies|caries|кариес/.test(s)) return 'filling'
  return null
}

const FDI = /^(?:[1-4][1-8]|[5-8][1-5])$/

/** "15, 24" | [15, 24] | 36 → [15, 24] (faqat to'g'ri FDI raqamlar). */
export function teethList(raw) {
  const list = Array.isArray(raw) ? raw : String(raw ?? '').split(/[^\d]+/)
  return [...new Set(list.map((x) => String(x).trim()).filter((x) => FDI.test(x)).map(Number))]
}

/** Tishlarga holat qo'yadi. { teeth, prev } — prev: avvalgi holatlar ('healthy' = belgisiz). */
export function applyStatus(teeth, nums, status) {
  const next = { ...(teeth || {}) }
  const prev = {}
  nums.forEach((n) => {
    prev[n] = next[n] || 'healthy'
    next[n] = status
  })
  return { teeth: next, prev }
}

/** Avvalgi holatni tiklaydi — faqat tish hali ham avtomatik qo'yilgan holatda bo'lsa. */
export function restoreStatus(teeth, auto) {
  const next = { ...(teeth || {}) }
  Object.entries(auto?.prev || {}).forEach(([n, old]) => {
    if (next[n] !== auto.status) return
    if (!old || old === 'healthy') delete next[n]
    else next[n] = old
  })
  return next
}

/**
 * Bitta yozuvning o'zgarishini ko'rib chiqadi.
 * opts: { wasDone, isDone, text, teeth } — prev/next yozuvlardan qiymat oluvchi funksiyalar.
 * Qaytaradi: { item, teeth, changed } — item (autoTooth yangilangan), teeth (bemor tish xaritasi).
 */
export function reconcile(prevItem, nextItem, patientTeeth, { wasDone, isDone, text, teeth }) {
  if (!prevItem || !nextItem) return { item: nextItem, teeth: patientTeeth, changed: false }
  const before = wasDone(prevItem)
  const after = isDone(nextItem)
  if (!before && after) {
    const status = statusFromService(text(nextItem))
    const nums = teethList(teeth(nextItem))
    if (!status || !nums.length) return { item: nextItem, teeth: patientTeeth, changed: false }
    const r = applyStatus(patientTeeth, nums, status)
    return { item: { ...nextItem, autoTooth: { status, prev: r.prev } }, teeth: r.teeth, changed: true }
  }
  if (before && !after && (nextItem.autoTooth || prevItem.autoTooth)) {
    const auto = nextItem.autoTooth || prevItem.autoTooth
    const item = { ...nextItem }
    delete item.autoTooth
    return { item, teeth: restoreStatus(patientTeeth, auto), changed: true }
  }
  // Tahrirlashda yozuv qayta tuzilsa ham (masalan, reja oynasi bosqichlarni yangidan yig'adi) avvalgi holat yo'qolmasin.
  if (before && after && prevItem.autoTooth && !nextItem.autoTooth) {
    return { item: { ...nextItem, autoTooth: prevItem.autoTooth }, teeth: patientTeeth, changed: true }
  }
  return { item: nextItem, teeth: patientTeeth, changed: false }
}

/** Ro'yxatlar uchun: prev/next ro'yxatini kalit bo'yicha solishtiradi. */
export function reconcileList(prevList, nextList, patientTeeth, keyOf, opts) {
  const byKey = new Map((prevList || []).map((x) => [keyOf(x), x]))
  let teeth = patientTeeth
  let changed = false
  const list = (nextList || []).map((item) => {
    const r = reconcile(byKey.get(keyOf(item)), item, teeth, opts)
    teeth = r.teeth
    changed = changed || r.changed
    return r.item
  })
  return { list, teeth, changed }
}

/* ── Manbalar bo'yicha sozlamalar ─────────────────────────────────────── */

/** Davolash rejasi bosqichi: status 'bajarildi'. */
export const STAGE_OPTS = {
  wasDone: (s) => s.status === 'bajarildi',
  isDone: (s) => s.status === 'bajarildi',
  text: (s) => s.title || s.desc || '',
  teeth: (s) => s.teeth,
}

/** Bemor profilidagi tashrif: done === false — rejada, boshqasi bajarilgan. */
export const PROFILE_VISIT_OPTS = {
  wasDone: (v) => v.done !== false,
  isDone: (v) => v.done !== false,
  text: (v) => v.kind || v.service || '',
  teeth: (v) => v.teeth || v.tooth,
}

/** Kalendar uchrashuvi: 'yakun' (bajarildi) yoki 'keldi'. */
const CAL_DONE = new Set(['yakun', 'keldi', 'bajarildi', 'done'])
export const CALENDAR_OPTS = {
  wasDone: (v) => CAL_DONE.has(v.status),
  isDone: (v) => CAL_DONE.has(v.status),
  text: (v) => [v.service, ...(Array.isArray(v.services) ? v.services.map((x) => x?.name || x) : [])].filter(Boolean).join(' '),
  teeth: (v) => v.teeth || v.tooth,
}

export const profileVisitKey = (v) => `${v.date || ''}|${v.time || ''}|${v.kind || ''}|${v.tooth || ''}`
