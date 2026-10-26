import { useCallback, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  AlertOctagon, ArrowDownRight, ArrowUpRight, BellRing, CalendarDays, ChevronDown, ChevronRight, Clock, CreditCard, ListChecks, Plus, Receipt, RotateCcw, Search, Share2, UserRound, Wallet,
} from 'lucide-react'
import { addClinicPayment, methodOf, METHODS, nextClinicReceipt, patchClinicPayment, useClinicPayments } from '../../tolovData'
import { debtOf, usePlans } from '../../rejaData'
import { todayIso, parts } from '../../uchrashuvData'
import { MobileToast } from './parts'
import MobileTabBar from './MobileTabBar'
import { BottomSheet } from './MobileSeminars'
import { HubTopBar } from './MobileKategoriyalar'
import { Face } from './bemorParts'

export const fmt = (n) => Math.round(Number(n) || 0).toLocaleString('ru-RU').replace(/\u00a0/g, ' ')
export const sum = (n) => `${fmt(n)} so‘m`
export const toIso = (dmy) => dmy.split('.').reverse().join('-')
const MON = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']
const MON_LOW = MON.map((m) => m.toLowerCase())
const MON_FULL = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']
const DAYS = ['Dsh', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak']
export const TODAY = todayIso()

export const useTolovlar = useClinicPayments
export const addTolov = addClinicPayment
export const patchTolov = patchClinicPayment
export const nextReceipt = nextClinicReceipt

export const PSTATUS = {
  Tolandi: ['To‘lov qabul qilindi', 'bg-[#e6f8ec] text-[#1c9a52]'],
  Qisman: ['Qisman to‘lov', 'bg-[#e6f4f3] text-[#0b6d73]'],
  Qaytarilgan: ['Qaytarilgan', 'bg-[#ffecee] text-[#e0475b]'],
}

const daysBetween = (a, b) => {
  const x = parts(a)
  const y = parts(b)
  return Math.round((new Date(y.y, y.m - 1, y.d) - new Date(x.y, x.m - 1, x.d)) / 86400000)
}
export function duesOf(plans) {
  return plans.map((plan) => {
    const debt = debtOf(plan)
    if (debt <= 0) return null
    let cum = 0
    let due = TODAY
    for (const s of plan.stages) {
      cum += s.price
      if (cum > plan.paid) { due = s.date || TODAY; break }
    }
    return { plan, debt, due, late: Math.max(0, daysBetween(due, TODAY)) }
  }).filter(Boolean)
}

const niceMax = (v) => {
  if (v <= 0) return 4
  const p = 10 ** Math.floor(Math.log10(v / 4))
  const step = [1, 2, 2.5, 5, 10].find((k) => k * p * 4 >= v) * p
  return step * 4
}
const short = (v) => (v >= 1e6 ? `${+(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${Math.round(v / 1e3)}K` : `${v}`)

export default function MobileTolovlar() {
  const all = useTolovlar()
  const plans = usePlans()
  const navigate = useNavigate()
  const location = useLocation()
  const [month, setMonth] = useState(TODAY.slice(0, 7))
  const [range, setRange] = useState('oy')
  const [pick, setPick] = useState(null)
  const [tab, setTab] = useState('last')
  const [sheet, setSheet] = useState(null)
  const [toast, setToast] = useState(() => location.state?.toast || '')
  const closeToast = useCallback(() => setToast(''), [])

  const past = useMemo(() => all.filter((r) => toIso(r.date) <= TODAY).map((r) => ({ ...r, iso: toIso(r.date) })).sort((a, b) => (b.iso + b.time).localeCompare(a.iso + a.time)), [all])
  const ok = (r) => r.status !== 'Qaytarilgan'
  const inMonth = past.filter((r) => r.iso.startsWith(month))
  const prevKey = (() => { const [y, m] = month.split('-').map(Number); return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}` })()
  const paid = inMonth.filter(ok).reduce((s, r) => s + r.amount, 0)
  const prevPaid = past.filter((r) => r.iso.startsWith(prevKey) && ok(r)).reduce((s, r) => s + r.amount, 0)
  const dues = useMemo(() => duesOf(plans), [plans])
  const late = dues.filter((d) => d.late > 0).sort((a, b) => b.late - a.late)
  const waiting = dues.filter((d) => d.late === 0)
  const waitSum = waiting.reduce((s, d) => s + d.debt, 0)
  const lateSum = late.reduce((s, d) => s + d.debt, 0)
  const delta = prevPaid ? Math.round(((paid - prevPaid) / prevPaid) * 100) : null

  const KPI = [
    { label: 'Jami tushum', value: paid + waitSum + lateSum, icon: Wallet, tint: 'bg-[#e6f4f3] text-[#0b8a95]', note: delta !== null ? [delta >= 0, `${delta >= 0 ? '+' : ''}${delta}%`, 'o‘tgan oyga nisbatan'] : [true, `${inMonth.filter(ok).length + waiting.length + late.length} ta`, 'to‘lov va qarz'] },
    { label: 'To‘langan', value: paid, icon: CreditCard, tint: 'bg-[#e6f4f3] text-[#0b8a95]', note: delta !== null ? [delta >= 0, `${delta >= 0 ? '+' : ''}${delta}%`, 'o‘tgan oyga nisbatan'] : [true, `${inMonth.filter(ok).length} ta`, 'to‘lov qabul qilingan'] },
    { label: 'Kutilayotgan', value: waitSum, icon: Clock, tint: 'bg-[#fff1e6] text-[#e07a2e]', note: [false, `${waiting.length} ta`, 'reja bo‘yicha'], tone: 'text-[#e07a2e]' },
    { label: 'Muddati o‘tgan', value: lateSum, icon: AlertOctagon, tint: 'bg-[#ffecee] text-[#e0475b]', note: [true, `${late.length} ta`, 'bemor kechikmoqda'], tone: 'text-[#e0475b]' },
  ]

  const bars = useMemo(() => {
    const byDay = (iso) => past.filter((r) => r.iso === iso && ok(r)).reduce((s, r) => s + r.amount, 0)
    const [y, m] = month.split('-').map(Number)
    if (range === 'yil') {
      return MON.map((l, i) => {
        const key = `${y}-${String(i + 1).padStart(2, '0')}`
        return { key, label: l, tip: `${MON_FULL[i]} ${y}`, v: past.filter((r) => r.iso.startsWith(key) && ok(r)).reduce((s, r) => s + r.amount, 0) }
      })
    }
    if (range === 'hafta') {
      const end = month === TODAY.slice(0, 7) ? TODAY : `${month}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`
      const e = parts(end)
      const wd = (new Date(e.y, e.m - 1, e.d).getDay() + 6) % 7
      return DAYS.map((l, i) => {
        const dt = new Date(e.y, e.m - 1, e.d - wd + i)
        const iso = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
        return { key: iso, label: l, tip: `${dt.getDate()} ${MON_LOW[dt.getMonth()]}`, v: iso <= TODAY ? byDay(iso) : 0 }
      })
    }
    const n = new Date(y, m, 0).getDate()
    return Array.from({ length: n }, (_, i) => {
      const iso = `${month}-${String(i + 1).padStart(2, '0')}`
      return { key: iso, label: [1, 8, 15, 22, 29].includes(i + 1) ? `${i + 1} ${MON_LOW[m - 1]}` : '', tip: `${i + 1} ${MON_LOW[m - 1]}`, v: byDay(iso) }
    })
  }, [past, month, range])
  const top = Math.max(...bars.map((b) => b.v))
  const max = niceMax(top)
  const sorted = bars.map((b) => b.v).filter(Boolean).sort((a, b) => a - b)
  const hi = sorted[Math.floor(sorted.length * 0.6)] || Infinity
  const active = bars.find((b) => b.key === pick) || bars.find((b) => b.v === top && top > 0)

  const [y, m] = month.split('-').map(Number)
  const shown = inMonth.slice(0, 4)

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef8f7_0%,#f6faf9_40%,#f6faf9_100%)] pb-[150px]">
      <div className="px-3.5 pt-3">
        <HubTopBar onBell={() => setToast('Yangi bildirishnomalar yo‘q')} />
        <div className="mt-3 flex items-center justify-between gap-2">
          <h1 className="text-[27px] font-extrabold leading-tight tracking-tight text-[#0d2a4a]">To‘lovlar</h1>
          <button type="button" onClick={() => setSheet('month')} className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-line/70 bg-white px-3 text-[12.5px] font-medium text-ink">
            <CalendarDays className="size-4 text-sea" /> {MON[m - 1]} {y} <ChevronDown className="size-3.5 text-muted" />
          </button>
        </div>
        <p className="text-[12.5px] text-[#7d8fa9]">Moliyaviy ko‘rsatkichlar va to‘lovlar tarixi</p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {KPI.map((k) => (
            <div key={k.label} className="rounded-2xl bg-white p-2.5 shadow-[0_1px_4px_rgb(11_31_58/0.06)]">
              <div className="flex items-center gap-2">
                <span className={`grid size-8 shrink-0 place-items-center rounded-xl ${k.tint}`}><k.icon className="size-[17px]" strokeWidth={1.8} /></span>
                <p className="min-w-0 truncate text-[11.5px] text-ink-2">{k.label}</p>
              </div>
              <b className="mt-1.5 block whitespace-nowrap text-[15.5px] font-extrabold leading-tight tracking-tight text-[#0d2a4a]">{sum(k.value)}</b>
              <p className="mt-1.5 flex items-center gap-1 text-[10px] text-muted">
                {k.note[0] ? <ArrowUpRight className={`size-3.5 shrink-0 ${k.tone || 'text-[#1c9a52]'}`} /> : <ArrowDownRight className={`size-3.5 shrink-0 ${k.tone || 'text-[#e07a2e]'}`} />}
                <b className={`font-semibold ${k.tone || 'text-[#1c9a52]'}`}>{k.note[1]}</b>
                <span className="truncate">{k.note[2]}</span>
              </p>
            </div>
          ))}
        </div>

        <section className="mt-3 rounded-2xl bg-white p-3 shadow-[0_1px_4px_rgb(11_31_58/0.06)]">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[15px] font-bold text-[#0d2a4a]">Tushumlar statistikasi</h2>
            <div className="flex rounded-lg border border-line/70 p-0.5">
              {[['hafta', 'Hafta'], ['oy', 'Oy'], ['yil', 'Yil']].map(([k, l]) => (
                <button key={k} type="button" aria-pressed={range === k} onClick={() => { setRange(k); setPick(null) }} className={`h-7 rounded-md px-3 text-[11.5px] font-medium ${range === k ? 'bg-[#0b8a95] text-white' : 'text-ink-2'}`}>{l}</button>
              ))}
            </div>
          </div>
          <div className="relative mt-3 grid grid-cols-[30px_1fr] gap-1">
            <div className="flex h-[132px] flex-col justify-between text-right text-[9.5px] text-muted">
              {[4, 3, 2, 1, 0].map((i) => <span key={i} className="-translate-y-1/2 leading-none first:translate-y-0 last:translate-y-0">{short((max / 4) * i)}</span>)}
            </div>
            <div className="relative">
              <div className="absolute inset-x-0 top-0 h-[132px] bg-[repeating-linear-gradient(to_bottom,#eef2f6_0_1px,transparent_1px_33px)]" />
              <div className="relative flex h-[132px] items-end gap-[3px] border-b border-line">
                {bars.map((b) => {
                  const on = active?.key === b.key && b.v > 0
                  return (
                    <button key={b.key} type="button" onClick={() => setPick(b.key)} aria-label={`${b.tip}: ${sum(b.v)}`} className="relative flex h-full min-w-0 flex-1 items-end justify-center">
                      <span className={`w-full rounded-t-[3px] transition-all ${on ? 'bg-[#0b6d73]' : b.v >= hi ? 'bg-[#2ba39b]' : 'bg-[#bfe5e0]'}`} style={{ height: `${(b.v / max) * 100}%`, minHeight: b.v ? 3 : 0 }} />
                    </button>
                  )
                })}
                {active && active.v > 0 && (() => {
                  const i = bars.indexOf(active)
                  const left = ((i + 0.5) / bars.length) * 100
                  return (
                    <div className="pointer-events-none absolute z-10 -translate-x-1/2" style={{ left: `clamp(48px, ${left}%, calc(100% - 48px))`, bottom: `calc(${(active.v / max) * 100}% + 8px)` }}>
                      <div className="whitespace-nowrap rounded-lg bg-[#0b6d73] px-2 py-1 text-center text-[10px] leading-tight text-white shadow">
                        <span className="block text-white/80">{active.tip}</span>
                        <b className="font-semibold">{sum(active.v)}</b>
                      </div>
                    </div>
                  )
                })()}
              </div>
              <div className="mt-1 flex gap-[3px]">
                {bars.map((b) => <span key={b.key} className="relative h-3 min-w-0 flex-1 text-center text-[9.5px] text-muted"><span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap">{b.label}</span></span>)}
              </div>
            </div>
          </div>
          {!top && <p className="mt-2 text-center text-[12px] text-muted">Bu davrda to‘lovlar yo‘q</p>}
        </section>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" aria-pressed={tab === 'last'} onClick={() => setTab('last')} className={`h-10 rounded-xl border text-[12.5px] font-medium ${tab === 'last' ? 'border-[#0b8a95] bg-[#0b8a95] text-white' : 'border-line/70 bg-white text-ink'}`}>So‘nggi to‘lovlar</button>
          <button type="button" aria-pressed={tab === 'late'} onClick={() => setTab('late')} className={`flex h-10 items-center justify-center gap-1.5 rounded-xl border text-[12.5px] font-medium ${tab === 'late' ? 'border-[#0b8a95] bg-[#0b8a95] text-white' : 'border-line/70 bg-white text-ink'}`}>
            Muddati o‘tganlar ({late.length}) {late.length > 0 && <span className="grid size-[18px] place-items-center rounded-full bg-[#e0475b] text-[10px] font-bold text-white">{late.length}</span>}
          </button>
        </div>
      </div>

      <div className="mx-3.5 mt-2 overflow-hidden rounded-2xl bg-white shadow-[0_1px_4px_rgb(11_31_58/0.06)]">
        {tab === 'last' ? (
          <>
            {shown.map((r) => <PayRow key={r.id} r={r} onClick={() => setSheet({ pay: r.id })} />)}
            {!shown.length && <p className="px-4 py-8 text-center text-[12.5px] text-muted">Bu oyda to‘lovlar yo‘q</p>}
          </>
        ) : (
          <>
            {late.map((d) => <LateRow key={d.plan.id} d={d} onRemind={() => setToast(`${d.plan.patient.name}ga eslatma yuborildi`)} onPay={() => navigate('/tolovlar/yangi', { state: { planId: d.plan.id } })} />)}
            {!late.length && <p className="px-4 py-8 text-center text-[12.5px] text-muted">Muddati o‘tgan to‘lovlar yo‘q</p>}
          </>
        )}
      </div>
      {tab === 'last' && inMonth.length > 0 && (
        <button type="button" onClick={() => setSheet('all')} className="mx-3.5 mt-2 flex h-12 w-[calc(100%-28px)] items-center gap-2.5 rounded-xl bg-white px-3 text-[13px] font-medium text-ink shadow-[0_1px_4px_rgb(11_31_58/0.06)]">
          <ListChecks className="size-5 text-sea" strokeWidth={1.7} /> <span className="flex-1 text-left">Barcha to‘lovlarni ko‘rish</span> <span className="text-[11.5px] text-muted">{inMonth.length} ta</span> <ChevronRight className="size-4 text-muted" />
        </button>
      )}

      <button type="button" onClick={() => navigate('/tolovlar/yangi')} className="fixed bottom-[76px] right-3.5 z-30 flex h-12 items-center gap-2 rounded-full bg-[#0b6d73] pl-4 pr-5 text-[14px] font-semibold text-white shadow-[0_8px_20px_rgb(11_109_115/0.4)] active:scale-95">
        <Plus className="size-5" /> To‘lov qo‘shish
      </button>

      {sheet === 'month' && <MonthSheet value={month} past={past} onClose={() => setSheet(null)} onPick={(k) => { setMonth(k); setPick(null); setSheet(null) }} />}
      {sheet === 'all' && <AllSheet rows={inMonth} title={`${MON_FULL[m - 1]} ${y}`} onClose={() => setSheet(null)} onOpen={(id) => setSheet({ pay: id })} />}
      {sheet?.pay && <PaySheet r={all.find((x) => x.id === sheet.pay)} onClose={() => setSheet(null)} onToast={(t) => { setSheet(null); setToast(t) }} />}

      <MobileToast text={toast} onClose={closeToast} />
      <MobileTabBar />
    </div>
  )
}

function PayRow({ r, onClick }) {
  const [label, cls] = PSTATUS[r.status] || PSTATUS.Tolandi
  const { d, m, y } = parts(toIso(r.date))
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-2.5 border-b border-line/60 px-3 py-2.5 text-left last:border-0 active:bg-page">
      <Face p={r} className="size-11" text="text-[13px]" />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <b className="min-w-0 flex-1 truncate text-[13px] font-bold text-[#0d2a4a]">{r.name}</b>
          <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${cls}`}>{label}</span>
        </span>
        <span className="mt-0.5 flex items-center gap-1.5">
          <span className="min-w-0 flex-1 truncate text-[11px] text-ink-2">{r.service}</span>
          <b className={`shrink-0 text-[13px] font-bold ${r.status === 'Qaytarilgan' ? 'text-muted line-through' : 'text-[#0d2a4a]'}`}>{sum(r.amount)}</b>
        </span>
        <span className="mt-0.5 flex items-center gap-1 text-[10.5px] text-muted"><CalendarDays className="size-3" /> {d} {MON_LOW[m - 1]} {y} <span className="mx-0.5">|</span> {r.time}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted" />
    </button>
  )
}

function LateRow({ d, onRemind, onPay }) {
  const p = d.plan.patient
  return (
    <div className="flex items-start gap-2.5 border-b border-line/60 px-3 py-2.5 last:border-0">
      <Face p={p} className="size-11" text="text-[13px]" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <b className="min-w-0 flex-1 truncate text-[13px] font-bold text-[#0d2a4a]">{p.name}</b>
          <b className="shrink-0 text-[13px] font-bold text-[#e0475b]">{sum(d.debt)}</b>
        </div>
        <p className="mt-0.5 truncate text-[11px] text-ink-2">{d.plan.title} · #{d.plan.code}</p>
        <p className="mt-0.5 text-[10.5px] font-medium text-[#e0475b]">{d.late} kun kechikdi</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button type="button" onClick={onRemind} className="flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#e6f4f3] text-[12px] font-semibold text-[#0b6d73]"><BellRing className="size-3.5" /> Eslatma</button>
          <button type="button" onClick={onPay} className="flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#0b8a95] text-[12px] font-semibold text-white"><Wallet className="size-3.5" /> To‘lov qabul</button>
        </div>
      </div>
    </div>
  )
}

function MonthSheet({ value, past, onClose, onPick }) {
  const [year, setYear] = useState(Number(value.slice(0, 4)))
  const curYear = Number(TODAY.slice(0, 4))
  return (
    <BottomSheet title="Oyni tanlang" onClose={onClose}>
      <div className="mt-2 flex items-center justify-between">
        <button type="button" onClick={() => setYear((v) => v - 1)} className="h-9 rounded-lg bg-page px-3 text-[13px] font-semibold text-ink">‹ {year - 1}</button>
        <b className="text-[15px] font-bold text-ink">{year}</b>
        <button type="button" disabled={year >= curYear} onClick={() => setYear((v) => v + 1)} className="h-9 rounded-lg bg-page px-3 text-[13px] font-semibold text-ink disabled:opacity-40">{year + 1} ›</button>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 pb-2">
        {MON_FULL.map((l, i) => {
          const key = `${year}-${String(i + 1).padStart(2, '0')}`
          const future = key > TODAY.slice(0, 7)
          const n = past.filter((r) => r.iso.startsWith(key)).length
          return (
            <button key={key} type="button" disabled={future} onClick={() => onPick(key)} className={`flex h-14 flex-col items-center justify-center rounded-xl border text-[13px] font-semibold ${key === value ? 'border-[#0b8a95] bg-[#0b8a95] text-white' : future ? 'border-line/60 text-[#b9c3cf]' : 'border-line text-ink'}`}>
              {l}
              <span className={`text-[10px] font-medium ${key === value ? 'text-white/85' : 'text-muted'}`}>{future ? '' : n ? `${n} ta to‘lov` : 'to‘lov yo‘q'}</span>
            </button>
          )
        })}
      </div>
    </BottomSheet>
  )
}

function AllSheet({ rows: list, title, onClose, onOpen }) {
  const [q, setQ] = useState('')
  const [method, setMethod] = useState('')
  const [n, setN] = useState(20)
  const s = q.trim().toLowerCase()
  const rowsF = list.filter((r) => (!method || r.method === method) && (!s || `${r.name} ${r.service} ${r.receipt}`.toLowerCase().includes(s)))
  const total = rowsF.filter((r) => r.status !== 'Qaytarilgan').reduce((a, r) => a + r.amount, 0)
  return (
    <BottomSheet title={`To‘lovlar · ${title}`} onClose={onClose}>
      <label className="mt-2 flex h-11 items-center gap-2 rounded-xl border border-line px-3">
        <Search className="size-4 text-muted" />
        <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setN(20) }} placeholder="Bemor, xizmat yoki chek raqami" className="min-w-0 flex-1 bg-transparent text-[13.5px] outline-none" />
      </label>
      <div className="-mx-4 mt-2 flex gap-1.5 overflow-x-auto px-4 no-scrollbar">
        {[['', 'Barchasi'], ...METHODS.map((x) => [x.id, x.label])].map(([k, l]) => (
          <button key={l} type="button" aria-pressed={method === k} onClick={() => { setMethod(k); setN(20) }} className={`h-8 shrink-0 rounded-lg border px-3 text-[12px] font-medium ${method === k ? 'border-sea bg-sea-50 text-sea' : 'border-line text-ink'}`}>{l}</button>
        ))}
      </div>
      <p className="mt-2 text-[12px] text-muted">{rowsF.length} ta to‘lov · <b className="font-semibold text-ink">{sum(total)}</b></p>
      <div className="-mx-4 mt-1">
        {rowsF.slice(0, n).map((r) => <PayRow key={r.id} r={r} onClick={() => onOpen(r.id)} />)}
      </div>
      {rowsF.length > n && <button type="button" onClick={() => setN((x) => x + 20)} className="mb-2 mt-2 h-10 w-full rounded-xl bg-page text-[12.5px] font-semibold text-sea">Yana ko‘rsatish ({rowsF.length - n})</button>}
      {!rowsF.length && <p className="py-6 text-center text-[12.5px] text-muted">To‘lov topilmadi</p>}
    </BottomSheet>
  )
}

function PaySheet({ r, onClose, onToast }) {
  const [confirm, setConfirm] = useState(false)
  if (!r) return null
  const [label, cls] = PSTATUS[r.status] || PSTATUS.Tolandi
  const m = methodOf(r.method)
  const { d, m: mo, y } = parts(toIso(r.date))
  const share = async () => {
    const text = `StomaHub · Chek ${r.receipt}\n${r.name}\n${r.service}\n${sum(r.amount)} · ${m.label}\n${r.date} ${r.time}`
    try {
      if (navigator.share) await navigator.share({ title: `Chek ${r.receipt}`, text })
      else { await navigator.clipboard.writeText(text); onToast('Chek nusxalandi') }
    } catch { /* bekor qilindi */ }
  }
  const info = [
    ['Chek raqami', r.receipt],
    ['Sana', `${d} ${MON_LOW[mo - 1]} ${y}, ${r.time}`],
    ['Xizmat', r.service],
    ['To‘lov usuli', m.label],
    ['Fiskal chek', r.chek ? 'Chiqarilgan' : 'Chiqarilmagan'],
    ...(r.note ? [['Izoh', r.note]] : []),
  ]
  return (
    <BottomSheet title="To‘lov tafsilotlari" onClose={onClose}>
      <div className="mt-2 rounded-2xl bg-[#f2f8f8] p-3 text-center">
        <Face p={r} className="mx-auto size-14" text="text-[16px]" />
        <p className="mt-1.5 text-[14px] font-bold text-ink">{r.name}</p>
        <b className={`mt-1 block text-[24px] font-extrabold ${r.status === 'Qaytarilgan' ? 'text-muted line-through' : 'text-[#0d2a4a]'}`}>{sum(r.amount)}</b>
        <span className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{label}</span>
      </div>
      <dl className="mt-3 divide-y divide-line/70">
        {info.map(([k, v]) => <div key={k} className="flex items-start justify-between gap-3 py-2.5 text-[13px]"><dt className="shrink-0 text-muted">{k}</dt><dd className="text-right font-medium text-ink">{v}</dd></div>)}
      </dl>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button type="button" onClick={share} className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[#e6f4f3] text-[13px] font-semibold text-[#0b6d73]"><Share2 className="size-4" /> Chekni ulashish</button>
        {r.patientId ? <Link to={`/bemorlar/${r.patientId}`} className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-line text-[13px] font-semibold text-ink"><UserRound className="size-4 text-sea" /> Bemor profili</Link> : <span />}
      </div>
      {r.status !== 'Qaytarilgan' && (confirm ? (
        <div className="mb-2 mt-2 flex gap-2">
          <button type="button" onClick={() => setConfirm(false)} className="h-11 flex-1 rounded-xl border border-line text-[13px] font-semibold text-ink">Bekor qilish</button>
          <button type="button" onClick={() => { patchTolov(r.id, { status: 'Qaytarilgan' }); onToast(`${r.receipt} qaytarildi`) }} className="h-11 flex-1 rounded-xl bg-sale text-[13px] font-semibold text-white">Ha, qaytarish</button>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirm(true)} className="mb-2 mt-2 flex h-11 w-full items-center justify-center gap-1.5 rounded-xl text-[13px] font-semibold text-sale"><RotateCcw className="size-4" /> To‘lovni qaytarish</button>
      ))}
      {r.status === 'Qaytarilgan' && <p className="mb-2 mt-3 flex items-center justify-center gap-1.5 text-[12px] text-muted"><Receipt className="size-4" /> Bu to‘lov qaytarilgan</p>}    </BottomSheet>
  )
}
