import { useMemo, useState } from 'react'
import { Banknote, CalendarCheck, Download, Receipt, TrendingUp, Users, Wallet } from 'lucide-react'
import ShopLayout from '../components/market/ShopLayout'
import { useClinicPayments, methodOf, som } from '../tolovData'
import { useVisits } from '../uchrashuvData'
import { useBemorlar } from '../bemorData'
import { tashkentToday } from '../tashkentDate'

// Hisobotlar — faqat shifokorning o‘z ma’lumotlari (user_blobs: clinic_payments, visits, patients).
const PERIODS = [
  ['today', 'Bugun'],
  ['week', 'Hafta'],
  ['month', 'Oy'],
  ['year', 'Yil'],
  ['all', 'Barchasi'],
]
const MON = ['yan', 'fev', 'mar', 'apr', 'may', 'iyun', 'iyul', 'avg', 'sen', 'okt', 'noy', 'dek']

export function isoOf(date) {
  const s = String(date || '')
  const m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})/)
  return m ? `${m[3]}-${m[2]}-${m[1]}` : s.slice(0, 10)
}
const shiftIso = (iso, days) => {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  return dt.toISOString().slice(0, 10)
}
export function periodRange(period, today) {
  if (period === 'today') return [today, today]
  if (period === 'week') return [shiftIso(today, -6), today]
  if (period === 'month') return [`${today.slice(0, 7)}-01`, today]
  if (period === 'year') return [`${today.slice(0, 4)}-01-01`, today]
  return ['0000-00-00', '9999-12-31']
}

/** Pure aggregation, unit-testable. */
export function buildReport({ payments = [], visits = [], patients = [], period = 'month', today = tashkentToday() }) {
  const [from, to] = periodRange(period, today)
  const inRange = (d) => { const i = isoOf(d); return i >= from && i <= to }
  const live = payments.filter((p) => p && p.status !== 'Qaytarilgan' && inRange(p.date))
  const revenue = live.reduce((s, p) => s + (Number(p.amount) || 0), 0)
  const byMethod = {}
  live.forEach((p) => { byMethod[p.method || 'Naqd'] = (byMethod[p.method || 'Naqd'] || 0) + (Number(p.amount) || 0) })
  const services = {}
  live.forEach((p) => {
    const k = (p.service || 'Boshqa').trim() || 'Boshqa'
    services[k] = services[k] || { name: k, count: 0, sum: 0 }
    services[k].count += 1
    services[k].sum += Number(p.amount) || 0
  })
  const vis = visits.filter((v) => v && inRange(v.date))
  const done = vis.filter((v) => /bajar|keldi|done|yakun/i.test(String(v.status || ''))).length
  const cancelled = vis.filter((v) => /bekor|cancel|kelmadi/i.test(String(v.status || ''))).length
  const debts = patients
    .map((p) => ({ id: p.id, name: p.name, phone: p.phone, debt: Math.max(0, (Number(p.total) || 0) - (Number(p.paid) || 0)) }))
    .filter((p) => p.debt > 0)
    .sort((a, b) => b.debt - a.debt)
  // Daily (<= 31 days) or monthly series
  const series = []
  const span = period === 'year' || period === 'all' ? 'month' : 'day'
  const bucket = {}
  live.forEach((p) => { const k = span === 'day' ? isoOf(p.date) : isoOf(p.date).slice(0, 7); bucket[k] = (bucket[k] || 0) + (Number(p.amount) || 0) })
  if (span === 'day') {
    for (let d = from; d <= to; d = shiftIso(d, 1)) series.push({ k: d, label: `${Number(d.slice(8))} ${MON[Number(d.slice(5, 7)) - 1]}`, v: bucket[d] || 0 })
  } else {
    Object.keys(bucket).sort().forEach((k) => series.push({ k, label: `${MON[Number(k.slice(5, 7)) - 1]} ${k.slice(0, 4)}`, v: bucket[k] }))
  }
  return {
    from, to, revenue, count: live.length, avg: live.length ? Math.round(revenue / live.length) : 0,
    methods: Object.entries(byMethod).map(([id, sum]) => ({ id, sum })).sort((a, b) => b.sum - a.sum),
    services: Object.values(services).sort((a, b) => b.sum - a.sum).slice(0, 5),
    appointments: vis.length, done, cancelled,
    debts, debtTotal: debts.reduce((s, d) => s + d.debt, 0),
    series,
  }
}

const card = 'rounded-2xl bg-white p-4 shadow-card'

export default function Hisobotlar() {
  const payments = useClinicPayments()
  const visits = useVisits()
  const patients = useBemorlar()
  const [period, setPeriod] = useState('month')
  const r = useMemo(() => buildReport({ payments, visits, patients, period }), [payments, visits, patients, period])
  const max = Math.max(1, ...r.series.map((s) => s.v))
  const empty = !payments.length && !visits.length && !patients.length

  const exportCsv = () => {
    const lines = [
      `Hisobot davri,${r.from === '0000-00-00' ? 'Barchasi' : `${r.from} — ${r.to}`}`,
      `Daromad,${r.revenue}`, `To‘lovlar soni,${r.count}`, `Qabullar,${r.appointments}`, `Qarzdorlik,${r.debtTotal}`, '',
      'To‘lov usuli,Summa', ...r.methods.map((m) => `${methodOf(m.id).label},${m.sum}`), '',
      'Xizmat,Soni,Summa', ...r.services.map((s) => `"${s.name.replace(/"/g, '""')}",${s.count},${s.sum}`), '',
      'Qarzdor bemor,Telefon,Qarz', ...r.debts.map((d) => `"${d.name}",${d.phone || ''},${d.debt}`),
    ]
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' }))
    a.download = `hisobot-${r.to}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const kpis = [
    [Wallet, 'Daromad', som(r.revenue), '#e7f7f4', '#0f9b8e'],
    [CalendarCheck, 'Qabullar soni', String(r.appointments), '#e8f1ff', '#2f6fed'],
    [Receipt, 'O‘rtacha chek', som(r.avg), '#fff4d6', '#c28a00'],
    [Banknote, 'Qarzdorlik', som(r.debtTotal), '#fdecec', '#e11d48'],
  ]

  return (
    <ShopLayout active="hisobot">
      <div className="pb-6 pt-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[24px] font-extrabold">Hisobotlar</h1>
            <p className="text-[13px] text-muted">Klinikangiz faoliyati bo‘yicha statistika — faqat sizning ma’lumotlaringiz</p>
          </div>
          <button type="button" onClick={exportCsv} disabled={empty} className="inline-flex h-10 items-center gap-2 rounded-xl bg-sea px-4 text-[13px] font-semibold text-white disabled:opacity-50"><Download className="size-4" /> Excel (CSV) eksport</button>
        </div>

        <div className="mt-3 inline-flex flex-wrap gap-1 rounded-xl bg-white p-1 shadow-card" role="tablist" aria-label="Davr">
          {PERIODS.map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={period === id} onClick={() => setPeriod(id)} className={`h-9 rounded-lg px-3.5 text-[13px] font-semibold ${period === id ? 'bg-sea text-white' : 'text-ink-2'}`}>{label}</button>
          ))}
        </div>

        {empty && <p className="mt-4 rounded-2xl border border-dashed border-[#cfe3e3] bg-white px-4 py-6 text-center text-[13px] text-muted">Hali ma’lumot yo‘q. To‘lov, qabul yoki bemor qo‘shganingizda hisobot shu yerda paydo bo‘ladi.</p>}

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map(([Icon, label, value, tint, color]) => (
            <div key={label} className={`${card} flex items-center gap-3`}>
              <span className="grid size-11 shrink-0 place-items-center rounded-xl" style={{ background: tint, color }}><Icon className="size-5" /></span>
              <div className="min-w-0"><p className="text-[12px] text-muted">{label}</p><b className="block truncate text-[18px]">{value}</b></div>
            </div>
          ))}
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[1.4fr_1fr]">
          <section className={card}>
            <h2 className="flex items-center gap-2 text-[15px] font-bold"><TrendingUp className="size-4 text-sea" /> Daromad grafigi</h2>
            {r.series.some((s) => s.v) ? (
              <div className="mt-3 flex h-[180px] items-end gap-[3px] overflow-x-auto" aria-label="Daromad grafigi">
                {r.series.map((s) => (
                  <div key={s.k} className="flex min-w-[10px] flex-1 flex-col items-center justify-end" title={`${s.label}: ${som(s.v)}`}>
                    <div className="w-full rounded-t bg-sea/80" style={{ height: `${Math.max(2, (s.v / max) * 160)}px`, opacity: s.v ? 1 : 0.15 }} />
                  </div>
                ))}
              </div>
            ) : <p className="mt-6 text-center text-[13px] text-muted">Bu davrda to‘lov yo‘q</p>}
            {r.series.length > 0 && <div className="mt-1 flex justify-between text-[11px] text-muted"><span>{r.series[0].label}</span><span>{r.series[r.series.length - 1].label}</span></div>}
          </section>
          <section className={card}>
            <h2 className="text-[15px] font-bold">To‘lov usullari</h2>
            {r.methods.length ? (
              <ul className="mt-3 space-y-2.5">
                {r.methods.map((m) => {
                  const meta = methodOf(m.id)
                  const pct = Math.round((m.sum / (r.revenue || 1)) * 100)
                  return (
                    <li key={m.id}>
                      <div className="flex justify-between text-[12.5px]"><span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ background: meta.dot }} />{meta.label}</span><b>{som(m.sum)} · {pct}%</b></div>
                      <div className="mt-1 h-2 rounded-full bg-[#eef3f6]"><div className="h-2 rounded-full" style={{ width: `${pct}%`, background: meta.dot }} /></div>
                    </li>
                  )
                })}
              </ul>
            ) : <p className="mt-6 text-center text-[13px] text-muted">To‘lovlar yo‘q</p>}
          </section>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <section className={card}>
            <h2 className="text-[15px] font-bold">Eng ko‘p daromad keltirgan xizmatlar</h2>
            {r.services.length ? (
              <ol className="mt-3 space-y-2">
                {r.services.map((s, i) => (
                  <li key={s.name}>
                    <div className="flex justify-between gap-2 text-[12.5px]"><span className="truncate">{i + 1}. {s.name} <span className="text-muted">({s.count})</span></span><b className="whitespace-nowrap">{som(s.sum)}</b></div>
                    <div className="mt-1 h-2 rounded-full bg-[#eef3f6]"><div className="h-2 rounded-full bg-sea" style={{ width: `${Math.round((s.sum / (r.services[0].sum || 1)) * 100)}%` }} /></div>
                  </li>
                ))}
              </ol>
            ) : <p className="mt-6 text-center text-[13px] text-muted">Xizmatlar bo‘yicha ma’lumot yo‘q</p>}
          </section>
          <section className={card}>
            <h2 className="flex items-center gap-2 text-[15px] font-bold"><CalendarCheck className="size-4 text-sea" /> Qabullar</h2>
            <dl className="mt-3 space-y-2 text-[13px]">
              <div className="flex justify-between"><dt className="text-muted">Jami qabullar</dt><dd className="font-bold">{r.appointments}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Bajarilgan</dt><dd className="font-bold text-[#17803d]">{r.done}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Bekor / kelmagan</dt><dd className="font-bold text-[#e11d48]">{r.cancelled}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">To‘lovlar soni</dt><dd className="font-bold">{r.count}</dd></div>
            </dl>
          </section>
          <section className={card}>
            <h2 className="flex items-center gap-2 text-[15px] font-bold"><Users className="size-4 text-[#e11d48]" /> Qarzdor bemorlar</h2>
            {r.debts.length ? (
              <ul className="mt-2 divide-y divide-line">
                {r.debts.slice(0, 6).map((d) => (
                  <li key={d.id} className="flex justify-between gap-2 py-2 text-[12.5px]"><span className="truncate">{d.name}</span><b className="whitespace-nowrap text-[#e11d48]">{som(d.debt)}</b></li>
                ))}
              </ul>
            ) : <p className="mt-6 text-center text-[13px] text-muted">Qarzdorlik yo‘q</p>}
          </section>
        </div>
      </div>
    </ShopLayout>
  )
}
