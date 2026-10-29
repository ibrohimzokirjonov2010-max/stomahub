import { useMemo } from 'react'
import { useBemorlar } from './bemorData'
import { useVisits } from './uchrashuvData'
import { tashkentToday } from './tashkentDate'

// Bemor qo‘shilgan vaqt: `created` maydoni yoki id ichidagi 13 xonali vaqt belgisi.
export function createdAt(p) {
  if (p.created) return Number(p.created) || Date.parse(p.created) || 0
  const m = /(\d{13})/.exec(String(p.id || ''))
  return m ? Number(m[1]) : 0
}

const dotsToIso = (s) => {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(s || '')
  return m ? `${m[3]}-${m[2]}-${m[1]}` : ''
}

// Faqat shu shifokorning o‘z ma’lumotlari (user_blobs RLS orqali) bo‘yicha hisoblanadi.
export function computeStats(patients, visits, today = tashkentToday()) {
  const month = today.slice(0, 7)
  const thisMonth = patients.filter((p) => {
    const t = createdAt(p)
    return t && tashkentToday(new Date(t)).slice(0, 7) === month
  }).length
  const todayVisits = (visits || []).filter((v) => v.date === today && v.status !== 'bekor')
  const names = new Set(todayVisits.map((v) => (v.name || '').trim().toLowerCase()))
  const extra = patients.filter((p) => dotsToIso(p.next) === today && !names.has(p.name.trim().toLowerCase())).length
  const debtors = patients.filter((p) => (p.debt || 0) > 0)
  return {
    total: patients.length,
    thisMonth,
    today: todayVisits.length + extra,
    debtors: debtors.length,
    debtSum: debtors.reduce((s, p) => s + (p.debt || 0), 0),
  }
}

export function useBemorStats() {
  const patients = useBemorlar()
  const visits = useVisits()
  return useMemo(() => computeStats(patients, visits), [patients, visits])
}
