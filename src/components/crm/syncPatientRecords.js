import { patchBemor } from '../../bemorData'
import { replaceClinicPayments } from '../../tolovData'

export function dotsFromIso(iso) {
  const s = String(iso || '')
  return s.includes('-') ? s.split('-').reverse().join('.') : s
}

/** Kalendarga yozilgan qabulni bemor profilidagi Tashriflar ro‘yxatiga qo‘shadi. */
export function recordPatientVisit(patient, visit) {
  if (!patient?.id || !visit) return
  const date = dotsFromIso(visit.date)
  patchBemor(patient.id, {
    visits: [{
      date,
      time: visit.start,
      kind: visit.service,
      doctor: visit.doctor,
      note: visit.note || '',
      done: false,
      visitId: visit.id,
    }, ...(patient.visits || [])],
    next: date,
  })
}

/** To‘lovlar bo‘limi bilan bir xil saqlash yo‘li. */
export function recordClinicPayment(payment) {
  replaceClinicPayments((list) => {
    const i = list.findIndex((r) => r.id === payment.id)
    if (i >= 0) {
      const next = list.slice()
      next[i] = { ...list[i], ...payment }
      return next
    }
    return [payment, ...list]
  })
}

/** Profil To‘lovlar tabi va qarz raqamlarini yangilaydi. */
export function recordPatientPayment(patient, payment) {
  if (!patient?.id || !payment) return
  const sum = Number(payment.amount) || 0
  if (!sum || payment.status === 'Qaytarilgan') return
  const prev = (patient.payments || []).find((x) => x.id === payment.id)
  const paid = (patient.paid || 0) - (prev?.sum || 0) + sum
  const row = { id: payment.id, date: payment.date, sum, method: payment.method, receipt: payment.receipt }
  patchBemor(patient.id, {
    paid,
    payments: prev
      ? (patient.payments || []).map((x) => (x.id === payment.id ? { ...x, ...row } : x))
      : [row, ...(patient.payments || [])],
  })
}
