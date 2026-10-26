import { useClinicPayments } from './tolovData'
import { useVisits } from './uchrashuvData'
import { tashkentToday } from './tashkentDate'

export { tashkentToday }

// '20.10.2026' yoki '2026-10-20' -> '2026-10-20'
function isoOf(date) {
  const s = String(date || '')
  const m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})/)
  return m ? `${m[3]}-${m[2]}-${m[1]}` : s.slice(0, 10)
}

const counted = (row) => row && row.status !== 'Qaytarilgan'

// Barcha CRM ko‘rsatkichlari shu bitta funksiyadan hisoblanadi (Klinika, To‘lovlar, Uchrashuvlar, Bosh sahifa).
export function computeCrmStats({ payments = [], visits = [], today = tashkentToday() } = {}) {
  const month = today.slice(0, 7)
  const live = payments.filter(counted)
  const sum = (list) => list.reduce((s, r) => s + (Number(r.amount) || 0), 0)
  const todayVisits = visits.filter((v) => isoOf(v.date) === today)
  return {
    today,
    revenueTotal: sum(live),
    revenueMonth: sum(live.filter((r) => isoOf(r.date).slice(0, 7) === month)),
    paymentsCount: live.length,
    todayAppointments: todayVisits.length,
    todayVisits,
  }
}

export function useCrmStats() {
  const payments = useClinicPayments()
  const visits = useVisits()
  return computeCrmStats({ payments, visits })
}

export function mln(n) {
  const v = (Number(n) || 0) / 1e6
  return `${v.toLocaleString('ru-RU', { maximumFractionDigits: 1 }).replace(/\u00a0/g, ' ')} mln`
}
