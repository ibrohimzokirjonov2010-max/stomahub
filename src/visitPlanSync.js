// Uchrashuv (qabul) -> Davolash rejasi avtomatik bog‘lanishi.
// uchrashuvData.setVisits har chaqirilganda ishlaydi, shuning uchun barcha kirish nuqtalari
// (Uchrashuvlar, Qabul jadvali, bemor profili, mobil) bir xil natija beradi.
//   - Qabulda tanlangan xizmatlar bemorning faol rejasiga bosqich bo‘lib qo‘shiladi (yo‘q bo‘lsa yangi reja).
//   - Bosqich visitId bilan bog‘lanadi: qayta saqlash/tahrirlashda dublikat bo‘lmaydi (upsert).
//   - Qabul bekor qilinsa yoki o‘chirilsa -> bosqich 'bekor'; yakunlansa -> 'bajarildi'.
import { getPlan, getPlans, nextPlanCode, savePlan } from './rejaData'
import { getBemor } from './bemorData'
import { getXizmatlar } from './xizmatData'
import { isFinal } from './visitStatus'


const parseTeeth = (s) => [...new Set(String(s || '').split(/[\s,;]+/).map(Number).filter((n) => n >= 11 && n <= 85 && n % 10 >= 1 && n % 10 <= 8))]

function artOf(name = '') {
  if (/implant/i.test(name)) return 'implant'
  if (/endo|kanal/i.test(name)) return 'endo'
  if (/shtift/i.test(name)) return 'post'
  if (/koronka|krona|toj|protez|vinir/i.test(name)) return 'crown'
  if (/plomba|kompozit|restavr/i.test(name)) return 'filling'
  if (/sug‘urish|sugurish|olib tashlash/i.test(name)) return 'missing'
  return null
}

/** Qabuldagi xizmatlar ro‘yxati: yangi `services` maydoni yoki eski bitta `service`/`serviceId`. */
export function visitServices(v) {
  const catalog = getXizmatlar()
  const priceOf = (id, name) => Number((catalog.find((x) => x.id === id) || catalog.find((x) => x.name === name))?.price) || 0
  if (Array.isArray(v.services) && v.services.length) {
    return v.services.filter((s) => s && s.name).map((s) => ({
      id: s.id || '', name: s.name, price: Number(s.price) || priceOf(s.id, s.name), tooth: s.tooth || v.tooth || '',
      ...(s.stageId ? { stageId: s.stageId } : {}),
    }))
  }
  if (!v.service || (!v.serviceId && !catalog.some((x) => x.name === v.service))) return []
  return [{ id: v.serviceId || '', name: v.service, price: Number(v.price) || priceOf(v.serviceId, v.service), tooth: v.tooth || '' }]
}

// Faqat shu sinxronizatsiya yaratgan bosqichlar (id: vs-<qabul>-<n>) boshqariladi; "Tugatish" yoki
// reja sahifasida qo‘lda qo‘shilgan bosqichlarga tegilmaydi.
const ownPrefix = (id) => `vs-${id}-`
const ownedBy = (s, id) => String(s.id || '').startsWith(ownPrefix(id)) && (!s.visitId || s.visitId === id)

const stageStatus = (v, prev) => {
  if (isFinal(v.status)) {
    // "Tugatish": faqat belgilangan bosqichlar bajarildi; belgilanmaganlari keyingi qabulga qoladi.
    if (Array.isArray(v.completedStages) && prev) {
      if (prev.status === 'bajarildi' || v.completedStages.includes(prev.id)) return 'bajarildi'
      return prev.status === 'jarayonda' || prev.status === 'bekor' ? 'rejada' : prev.status
    }
    return 'bajarildi'
  }
  if (v.status === 'bekor') return 'bekor'
  if (v.status === 'kelmadi') return prev && prev.status !== 'jarayonda' && prev.status !== 'bajarildi' ? prev.status : 'rejada'
  if (v.status === 'qabulda' || v.status === 'keldi' || v.status === 'davol') return 'jarayonda'
  if (!prev || prev.status === 'bekor' || prev.status === 'bajarildi') return 'rejada'
  return prev.status
}

const patientRef = (v) => {
  const b = getBemor(v.patientId)
  const src = b || { id: v.patientId, name: v.name, phone: v.phone, photo: v.photo }
  return { id: src.id, name: src.name, phone: src.phone || '', age: src.age || '', gender: src.gender || '', city: src.city || '', photo: src.photo || '', code: src.code || '' }
}

const factorOf = (plan) => 1 - (Number(plan.discount) || 0) / 100

/** Bitta rejaga shu qabul bosqichlarini yozadi (mavjudlarini yangilaydi, ortiqchalarini olib tashlaydi). */
function applyVisit(plan, v, list) {
  const stageIds = list.map((_, i) => `vs-${v.id}-${i + 1}`)
  const old = plan.stages.filter((s) => ownedBy(s, v.id))
  const f = factorOf(plan)
  const stages = list.map((s, i) => {
    const id = stageIds[i]
    const prev = old.find((x) => x.id === id)
    const teeth = parseTeeth(s.tooth)
    return {
      ...(prev || {}),
      id,
      title: s.name,
      desc: teeth.length ? `${s.name} (${teeth.join(', ')})` : s.name,
      teeth,
      art: artOf(s.name) || prev?.art || null,
      price: Math.round(s.price * f),
      date: v.date,
      status: stageStatus(v, prev),
      duration: prev?.duration || '',
      visitId: v.id,
    }
  })
  const keep = plan.stages.filter((s) => !ownedBy(s, v.id))
  // Bosqichlar tartibi: shu qabul bosqichlari avvalgi joyida (yangi bo‘lsa — oxirida)
  const at = plan.stages.findIndex((s) => ownedBy(s, v.id))
  const nextStages = at >= 0 ? [...keep.slice(0, at), ...stages, ...keep.slice(at)] : [...keep, ...stages]
  // RejaDialog tahriri items/groups dan bosqich yasaydi — ularni ham sinxron tutamiz
  let items = plan.items
  let groups = plan.groups
  if (Array.isArray(plan.items)) {
    const rowIds = new Set(old.map((s) => `row-${s.id}`))
    items = [...plan.items.filter((r) => !rowIds.has(r.id)), ...stages.map((s, i) => ({ id: `row-${s.id}`, service: s.title, tooth: list[i].tooth ? parseTeeth(list[i].tooth).join(', ') : '', qty: 1, price: list[i].price }))]
    const gIds = new Set(old.map((s) => s.id))
    groups = [...(plan.groups || []).filter((g) => !gIds.has(g.id)), ...stages.map((s) => ({ id: s.id, title: s.title, rowIds: [`row-${s.id}`], duration: s.duration || '' }))]
  }
  const visitRow = { id: v.id, date: v.date, time: v.start || '', title: list.map((s) => s.name).join(', '), status: isFinal(v.status) ? 'bajarildi' : v.status === 'bekor' || v.status === 'kelmadi' ? v.status : 'rejada', visitId: v.id }
  const visits = [...(plan.visits || []).filter((x) => x.visitId !== v.id && x.id !== v.id), visitRow]
  return { ...plan, stages: nextStages, items, groups, visits }
}

function cancelVisit(plan, id) {
  if (!plan.stages.some((s) => ownedBy(s, id))) return plan
  return {
    ...plan,
    stages: plan.stages.map((s) => (ownedBy(s, id) && s.status !== 'bajarildi' ? { ...s, status: 'bekor' } : s)),
    visits: (plan.visits || []).map((x) => (x.visitId === id ? { ...x, status: 'bekor' } : x)),
  }
}

const sameVisit = (a, b) => a && b && a.date === b.date && a.start === b.start && a.status === b.status && a.tooth === b.tooth
  && JSON.stringify(a.completedStages || null) === JSON.stringify(b.completedStages || null)
  && a.patientId === b.patientId && JSON.stringify(visitServices(a)) === JSON.stringify(visitServices(b))

/** prev -> next qabullar farqini rejalarga yozadi. */
export function syncVisitPlans(prev = [], next = []) {
  const before = new Map(prev.map((v) => [v.id, v]))
  const after = new Map(next.map((v) => [v.id, v]))
  const changed = next.filter((v) => v.patientId && !sameVisit(before.get(v.id), v))
  // Ommaviy tozalash (masalan, hammasi o‘chirildi) — rejalarga tegmaymiz
  const bulkReset = next.length === 0 && prev.length > 1
  const removed = bulkReset ? [] : prev.filter((v) => !after.has(v.id) && v.patientId)
  if (!changed.length && !removed.length) return

  for (const v of removed) {
    for (const plan of getPlans()) {
      const upd = cancelVisit(plan, v.id)
      if (upd !== plan) savePlan(upd)
    }
  }

  for (const v of changed) {
    let list = visitServices(v)
    // Mavjud bosqichni davom ettiruvchi xizmatlar (Kelmadi → boshqa kun, Keyingi uchrashuv): yangi bosqich
    // yaratilmaydi — o‘sha bosqich shu qabulga bog‘lanadi (dublikat yo‘q).
    const adoptIds = new Set(list.filter((s) => s.stageId).map((s) => s.stageId))
    if (adoptIds.size) {
      const host = getPlans().find((p) => p.patient?.id === v.patientId && p.stages.some((st) => adoptIds.has(st.id)))
      if (host) {
        const found = new Set(host.stages.filter((st) => adoptIds.has(st.id)).map((st) => st.id))
        const moved = host.stages.map((st) => (found.has(st.id) && st.status !== 'bajarildi' && (st.visitId !== v.id || st.date !== v.date)
          ? { ...st, visitId: v.id, date: v.date, status: st.status === 'bekor' || st.status === 'jarayonda' ? 'rejada' : st.status }
          : st))
        if (moved.some((st, i) => st !== host.stages[i])) savePlan({ ...host, stages: moved })
        list = list.filter((s) => !s.stageId || !found.has(s.stageId))
      }
    }
    const all = getPlans()
    const linked = all.find((p) => p.stages.some((s) => ownedBy(s, v.id)))
    if (!list.length) {
      // Xizmatlar olib tashlangan: bog‘langan bosqichlar ham olib tashlanadi
      if (linked) savePlan(applyVisit(linked, v, []))
      continue
    }
    if (linked) {
      // Bemor almashtirilgan bo‘lsa — eski rejadan olib, yangi bemorga yoziladi
      if (linked.patient?.id !== v.patientId) savePlan(applyVisit(linked, v, []))
      else { savePlan(applyVisit(getPlan(linked.id) || linked, v, list)); continue }
    }
    if (v.status === 'bekor') continue
    const active = getPlans()
      .filter((p) => p.patient?.id === v.patientId && p.status !== 'yakunlangan')
      .sort((a, b) => String(b.start || '').localeCompare(String(a.start || '')))[0]
    if (active) {
      const upd = applyVisit(active, v, list)
      savePlan(active.status === 'yakunlangan' ? { ...upd, status: 'jarayonda' } : upd)
      continue
    }
    const id = `dr-${Date.now().toString(36)}-${v.id}`
    savePlan(applyVisit({
      id,
      code: nextPlanCode(),
      patient: patientRef(v),
      doctor: 'me',
      title: 'Davolash rejasi',
      subtitle: list.slice(0, 2).map((s) => s.name).join(' + '),
      status: 'reja',
      start: v.date,
      chair: v.room || '',
      teeth: {},
      surfaces: {},
      items: [],
      groups: [],
      discount: 0,
      payMode: 'full',
      note: '',
      paid: 0,
      payments: [],
      visits: [],
      stages: [],
      source: 'visit',
    }, v, list))
  }
}
