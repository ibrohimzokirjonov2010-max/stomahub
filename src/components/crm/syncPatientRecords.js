import { getBemor, patchBemor } from '../../bemorData'
import { addPayment as addPlanPayment } from '../../rejaData'
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
  const row = { id: payment.id, date: payment.date, sum, method: payment.method, receipt: payment.receipt, clinic: true }
  patchBemor(patient.id, {
    paid,
    payments: prev
      ? (patient.payments || []).map((x) => (x.id === payment.id ? { ...x, ...row } : x))
      : [row, ...(patient.payments || [])],
  })
}

/**
 * Yagona saqlash yo‘li (PaymentForm → bemor profili / kalendar / To‘lovlar):
 *   1) clinic_payments (asosiy manba, /tolovlar ko‘radi) — id bo‘yicha upsert;
 *   2) bemor kartasidagi nusxa (receipt + clinic belgisi bilan — patientPayments ikki marta sanamaydi);
 *   3) planId bo‘lsa — davolash rejasining to‘langan summasi (faqat yangi to‘lovda, bir marta).
 */
export function savePatientPayment(row, { patient, planId = '', isNew = true } = {}) {
  if (!row) return null
  const payment = planId ? { ...row, planId } : row
  recordClinicPayment(payment)
  const p = (patient?.id && getBemor(patient.id)) || patient
  if (p?.id) recordPatientPayment(p, payment)
  const sum = Number(payment.amount) || 0
  if (planId && isNew && sum > 0 && payment.status !== 'Qaytarilgan') {
    addPlanPayment(planId, sum, payment.method, isoFromDots(payment.date))
  }
  return payment
}

function isoFromDots(s) {
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(String(s || '').trim())
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : String(s || '')
}
