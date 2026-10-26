import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Award, Banknote, Calendar, Check, ChevronDown, ChevronLeft, ChevronRight, Clock, CreditCard,
  Download, Eye, Filter, Home, Mail, MapPin, MoreHorizontal, Phone, RefreshCw,
  Search, Ticket, UserRound, Users, Wallet, X, XCircle,
} from 'lucide-react'
import { FACES, num, som } from '../data'
import { useOrg } from '../Shell'
import { downloadText, moneyOf, newestSeminar, refundPayment, useHub } from '../../hubStore'
import { Modal } from '../ui'

const TEAL = 'var(--color-org-teal)'
const INK = '#163044'
const MUTED = '#7d939a'

const MONTHS = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']
const METHOD_COLORS = {
  Payme: '#008089',
  Click: '#5caafd',
  Uzum: '#963beb',
  Paynet: '#ffaf42',
  Boshqa: '#d5dde6',
}

const STATE_META = {
  ok: { label: 'Muvaffaqiyatli', pill: 'bg-[#e8f8ef] text-[#16a34a]', dot: '#22c55e' },
  wait: { label: 'Kutilmoqda', pill: 'bg-[#fff6e0] text-[#d0890b]', dot: '#e8a317' },
  cancel: { label: 'Bekor qilingan', pill: 'bg-[#fdecef] text-[#e11d48]', dot: '#f43f5e' },
  refund: { label: 'Qaytarilgan', pill: 'bg-[#eef1f3] text-[#64748b]', dot: '#94a3b8' },
}

const TABS = [
  { id: 'all', label: 'Barcha to‘lovlar (1 030)' },
  { id: 'ok', label: 'Muvaffaqiyatli (950)' },
  { id: 'wait', label: 'Kutilayotgan (60)' },
  { id: 'cancel', label: 'Bekor qilingan (20)' },
  { id: 'refund', label: 'Qaytarilgan (15)' },
]

const DESIGN = [
  { id: 'ST2026-001', when: '24-noy 2026', time: '10:24', who: 'Aliyeva Mohira', clinic: 'Stoma Clinic', seminar: 'Implantologiya: nazariya va amaliyot', sum: 2500000, method: 'Payme', state: 'ok', phone: '+998 90 123 45 67', email: 'm.aliyeva@mail.uz', ticket: 'VIP chipta', face: 0 },
  { id: 'ST2026-002', when: '23-noy 2026', time: '18:11', who: 'Karimov Sardar', clinic: 'Dental Pro', seminar: 'Endodontiya: kanal davolash', sum: 1200000, method: 'Click', state: 'ok', phone: '+998 91 234 56 78', email: 's.karimov@mail.uz', ticket: 'Standart chipta', face: 1 },
  { id: 'ST2026-003', when: '22-noy 2026', time: '16:45', who: 'Ismoilova Dilnoza', clinic: 'City Dent', seminar: 'Oral jarrohlik: amaliy ko‘nikmalar', sum: 800000, method: 'Uzum', state: 'wait', phone: '+998 93 345 67 89', email: 'd.ismoilova@mail.uz', ticket: 'Student chipta', face: 2 },
  { id: 'ST2026-004', when: '21-noy 2026', time: '14:20', who: 'Raximov Behzod', clinic: 'Perfect Smile', seminar: 'Bolalar stomatologiyasi', sum: 1000000, method: 'Paynet', state: 'cancel', phone: '+998 94 456 78 90', email: 'b.rahimov@mail.uz', ticket: 'Guruh chipta', face: 3 },
  { id: 'ST2026-005', when: '20-noy 2026', time: '13:40', who: 'Yusupova Sevinch', clinic: 'Stomatolog+', seminar: 'Estetik stomatologiya', sum: 2500000, method: 'Payme', state: 'ok', phone: '+998 90 567 89 01', email: 's.yusupova@mail.uz', ticket: 'VIP chipta', face: 4 },
  { id: 'ST2026-006', when: '20-noy 2026', time: '11:05', who: 'Nodirov Jamshid', clinic: 'Smile Dent', seminar: 'Implantologiya: nazariya va amaliyot', sum: 1200000, method: 'Click', state: 'refund', phone: '+998 93 678 90 12', email: 'j.nodirov@mail.uz', ticket: 'Standart chipta', face: 5 },
  { id: 'ST2026-007', when: '19-noy 2026', time: '17:22', who: 'Tursunova Malika', clinic: 'Dental Care', seminar: 'Endodontiya: kanal davolash', sum: 800000, method: 'Uzum', state: 'ok', phone: '+998 91 789 01 23', email: 'm.tursunova@mail.uz', ticket: 'Student chipta', face: 6 },
  { id: 'ST2026-008', when: '18-noy 2026', time: '15:18', who: 'Mirzayev Azizbek', clinic: 'Regale Clinic', seminar: 'Oral jarrohlik: amaliy ko‘nikmalar', sum: 1000000, method: 'Paynet', state: 'ok', phone: '+998 94 890 12 34', email: 'a.mirzayev@mail.uz', ticket: 'Guruh chipta', face: 7 },
]

const MOBILE_ROWS = [
  { n: 1, init: 'AM', who: 'Aliyeva Mohira', phone: '+998 90 123 45 67', sum: 300000, via: 'Online', state: 'paid' },
  { n: 2, init: 'KB', who: 'Karimov Bekzod', phone: '+998 91 234 56 78', sum: 500000, via: 'Online', state: 'paid' },
  { n: 3, init: 'TD', who: 'Toirov Dilshod', phone: '+998 93 345 67 89', sum: 300000, via: 'Naqd / joyida', state: 'paid' },
  { n: 4, init: 'SM', who: 'Saydova Malika', phone: '+998 90 456 78 90', sum: 300000, via: 'Online', state: 'paid' },
  { n: 5, init: 'UJ', who: 'Usmonov Javohir', phone: '+998 91 567 89 01', sum: 500000, via: 'Online', state: 'wait' },
  { n: 6, init: 'RS', who: 'Raximova Sevara', phone: '+998 93 678 90 12', sum: 300000, via: 'Naqd / joyida', state: 'paid' },
  { n: 7, init: 'JA', who: 'Jalilov Akmal', phone: '+998 90 789 01 23', sum: 300000, via: 'Online', state: 'paid' },
  { n: 8, init: 'ED', who: 'Eshmatova Dildora', phone: '+998 91 890 12 34', sum: 500000, via: 'Online', state: 'paid' },
  { n: 9, init: 'NS', who: 'Normatov Sardor', phone: '+998 93 901 23 45', sum: 300000, via: 'Naqd / joyida', state: 'paid' },
  { n: 10, init: 'QN', who: 'Qodirova Nilufar', phone: '+998 90 012 34 56', sum: 300000, via: 'Online', state: 'wait' },
]

const SEMINARS = ['Implantologiya', 'Endodontiya', 'Oral jarrohlik', 'Bolalar', 'Estetik']

function MethodMark({ name, size = 16 }) {
  const spec = {
    Payme: { bg: '#00965f', glyph: 'P' },
    Click: { bg: '#0076ee', glyph: 'C' },
    Uzum: { bg: '#6c16e4', glyph: 'U' },
    Paynet: { bg: '#f08c14', glyph: 'P' },
  }[name] || { bg: '#94a3b8', glyph: '•' }
  return (
    <span className="inline-grid shrink-0 place-items-center rounded-[4px] font-bold leading-none text-white" style={{ width: size, height: size, background: spec.bg, fontSize: size * 0.62 }}>
      {spec.glyph}
    </span>
  )
}

function StatusPill({ state }) {
  const m = STATE_META[state]
  return (
    <span className={`inline-flex h-[22px] items-center gap-1 whitespace-nowrap rounded-full px-2 text-[11px] font-semibold ${m.pill}`}>
      <span className="size-1.5 rounded-full" style={{ background: m.dot }} />
      {m.label}
    </span>
  )
}

function Drop({ value, onChange, options, className = '', icon }) {
  const [open, setOpen] = useState(false)
  const current = options.find((o) => o.value === value) || options[0]
  return (
    <div className={`relative ${className}`} onMouseLeave={() => setOpen(false)}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex h-8 w-full items-center gap-1.5 rounded-lg border border-[#e5eeec] bg-white px-2.5 text-[12px] text-[#3e5960]">
        {icon}
        <span className="min-w-0 flex-1 truncate text-left">{current?.label}</span>
        <ChevronDown className="size-3.5 shrink-0 text-[#8aa4a8]" />
      </button>
      {open && (
        <ul className="absolute left-0 z-30 mt-1 max-h-56 w-full min-w-[160px] overflow-auto rounded-xl border border-[#e6eeec] bg-white py-1 shadow-lg">
          {options.map((o) => (
            <li key={o.value}>
              <button type="button" className={`block w-full px-3 py-1.5 text-left text-[12.5px] hover:bg-[#f4fbfa] ${o.value === value ? 'font-semibold text-[var(--color-org-teal)]' : ''}`} onClick={() => { onChange(o.value); setOpen(false) }}>{o.label}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Bars({ payments }) {
  const [tip, setTip] = useState(null)
  const grouped = new Map()
  payments.filter((payment) => payment.state === 'ok').forEach((payment) => {
    const label = payment.seminar || 'Boshqa'
    grouped.set(label, (grouped.get(label) || 0) + (Number(payment.sum) || 0))
  })
  const buckets = [...grouped.entries()].slice(0, 12).map(([label, value]) => ({ label, value }))
  const max = Math.max(...buckets.map((item) => item.value), 1)
  if (!buckets.length) {
    return <p className="py-8 text-center text-[13px] text-[#7e9398]">Hali muvaffaqiyatli to‘lov yo‘q.</p>
  }
  return (
    <div className="mt-2">
      <div className="flex gap-1" style={{ height: 78 }}>
        <div className="flex w-7 shrink-0 flex-col justify-between pb-px text-[10px] leading-none text-[#9aafb4]">
          <span>{Math.round(max / 1e6) || 0}M</span>
          <span>0</span>
        </div>
        <div className="relative flex min-w-0 flex-1 items-end gap-[9px] border-b border-[#e7eef0]" style={{ height: 78 }}>
          {[0, 1, 2, 3].map((i) => <span key={i} className="pointer-events-none absolute left-0 right-0 border-t border-[#f3f6f7]" style={{ bottom: `${(i + 1) * 25}%` }} />)}
          {buckets.map((item, i) => (
            <button key={item.label} type="button" className="relative z-[1] flex min-w-0 flex-1 items-end" style={{ height: 78 }} onMouseEnter={() => setTip(i)} onMouseLeave={() => setTip(null)}>
              {tip === i && <span className="absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#12324a] px-1.5 py-0.5 text-[10px] text-white">{item.label} · {som(item.value)}</span>}
              <span className="block w-full rounded-t-[3px]" style={{ height: Math.round((item.value / max) * 78), background: 'linear-gradient(180deg,#067e86 0%,#c5ebe6 100%)' }} />
            </button>
          ))}
        </div>
      </div>
      <div className="ml-8 mt-1.5 flex gap-[9px]">
        {buckets.map((item) => <span key={item.label} className="flex-1 truncate text-center text-[10px] leading-none text-[#8aa4a8]">{item.label}</span>)}
      </div>
    </div>
  )
}

function Donut({ payments }) {
  const ok = payments.filter((payment) => payment.state === 'ok')
  const grouped = new Map()
  ok.forEach((payment) => {
    const label = payment.method || 'Boshqa'
    grouped.set(label, (grouped.get(label) || 0) + (Number(payment.sum) || 0))
  })
  const total = [...grouped.values()].reduce((sum, value) => sum + value, 0)
  const slices = [...grouped.entries()].map(([label, sum]) => ({
    label,
    pct: total ? Math.round((sum / total) * 100) : 0,
    n: som(sum),
    color: METHOD_COLORS[label] || METHOD_COLORS.Boshqa,
  }))
  const r = 32
  const c = 2 * Math.PI * r
  let acc = 0
  const gap = 1.4
  if (!slices.length) return <p className="py-8 text-center text-[13px] text-[#7e9398]">Hali muvaffaqiyatli to‘lov yo‘q.</p>
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="relative size-[118px] shrink-0">
        <svg viewBox="0 0 100 100" className="size-full">
          <g transform="rotate(-90 50 50)">
            {slices.map((p) => {
              const len = Math.max(0, (p.pct / 100) * c - gap)
              const el = <circle key={p.label} cx="50" cy="50" r={r} fill="none" stroke={p.color} strokeWidth="16" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-acc} strokeLinecap="butt" />
              acc += (p.pct / 100) * c
              return el
            })}
          </g>
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="text-[13px] font-bold leading-none tracking-tight" style={{ color: INK }}>{som(total).replace(' so‘m', '')}</div>
            <div className="mt-0.5 text-[11px] text-[#7d939a]">so‘m</div>
          </div>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-[6px]">
        {slices.map((t) => (
          <li key={t.label} className="grid grid-cols-[8px_minmax(0,1fr)_28px_36px] items-center gap-1.5 text-[12px]">
            <span className="size-2 rounded-full" style={{ background: t.color }} />
            <span className="truncate text-[#3e5960]">{t.label}</span>
            <span className="text-right font-semibold" style={{ color: INK }}>{t.pct}%</span>
            <span className="text-right text-[#8aa0a4]">{t.n}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, foot, iconBg, iconColor }) {
  return (
    <article className="flex min-h-[76px] min-w-0 items-center gap-2.5 rounded-2xl border border-[#e7f1ef] bg-white px-3 py-2.5 shadow-[0_1px_2px_rgb(16_40_40/0.04)]">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl" style={{ background: iconBg, color: iconColor }}>
        <Icon className="size-5" strokeWidth={1.9} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[12px] leading-none text-[#7d939a]">{label}</p>
        <p className="mt-1.5 truncate text-[17px] font-bold leading-none tracking-tight" style={{ color: INK }}>{value}</p>
        <p className="mt-1 truncate text-[11.5px] leading-none">{foot}</p>
      </div>
    </article>
  )
}

function Up({ children, color }) {
  return <span className="mr-1 inline-flex items-center gap-0.5 font-semibold" style={{ color }}><span className="text-[10px]">↑</span>{children}</span>
}

export default function Payments() {
  const org = useOrg()
  const hub = useHub()
  const query = org?.query || ''
  const notify = org?.notify || (() => {})
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const [seminar, setSeminar] = useState('all')
  const [method, setMethod] = useState('all')
  const [state, setState] = useState('all')
  const [span, setSpan] = useState('all')
  const [page, setPage] = useState(1)
  const rows = hub.payments
  const [selected, setSelected] = useState(hub.payments[0]?.id)
  const [panel, setPanel] = useState(true)
  const [checked, setChecked] = useState({})
  const [range, setRange] = useState('year')
  const [unit, setUnit] = useState('som')
  const [mail, setMail] = useState(false)
  const [receipt, setReceipt] = useState(false)
  const [refund, setRefund] = useState(false)
  const [menu, setMenu] = useState(null)

  const filtered = useMemo(() => {
    const s = `${query} ${q}`.trim().toLowerCase()
    return rows.filter((p) => {
      if (tab !== 'all' && p.state !== tab) return false
      if (state !== 'all' && p.state !== state) return false
      if (seminar !== 'all' && p.seminarId !== seminar && !p.seminar.toLowerCase().includes(String(seminar).toLowerCase())) return false
      if (method !== 'all' && p.method !== method) return false
      if (span === 'nov' && !String(p.when).toLowerCase().includes('noy')) return false
      if (s && !`${p.who} ${p.seminar} ${p.id} ${p.clinic}`.toLowerCase().includes(s)) return false
      return true
    })
  }, [rows, query, q, tab, state, seminar, method, span])

  const per = 8
  const pages = Math.max(1, Math.ceil(filtered.length / per))
  const shown = filtered.slice((Math.min(page, pages) - 1) * per, Math.min(page, pages) * per)
  const pay = rows.find((p) => p.id === selected) || shown[0] || null
  const allChecked = shown.length > 0 && shown.every((p) => checked[p.id])

  const reset = () => { setQ(''); setSeminar('all'); setMethod('all'); setState('all'); setTab('all'); setSpan('all'); setPage(1) }
  const counts = {
    all: rows.length,
    ok: rows.filter((p) => p.state === 'ok').length,
    wait: rows.filter((p) => p.state === 'wait').length,
    cancel: rows.filter((p) => p.state === 'cancel').length,
    refund: rows.filter((p) => p.state === 'refund').length,
  }
  const revenue = rows.filter((p) => p.state === 'ok').reduce((n, p) => n + p.sum, 0)
  const doRefund = () => {
    if (!pay) return
    refundPayment(pay.id)
    setRefund(false)
    notify('To‘lov qaytarildi')
  }
  const receiptOf = (p) => {
    if (!p) return
    downloadText(`chek-${p.id}.txt`, `StomaHub chek\nID: ${p.id}\nIshtirokchi: ${p.who}\nSeminar: ${p.seminar}\nChipta: ${p.ticket}\nSumma: ${som(p.sum)}\nUsul: ${p.method}\nSana: ${p.when}\nHolat: ${p.state}\n`)
    notify('Chek yuklab olindi')
  }

  return (
    <>
      <div className="hidden h-[calc(100dvh-4rem)] flex-col md:-mx-5 md:-my-4 md:flex md:px-3 md:pb-1.5 md:pt-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[20px] font-bold leading-none tracking-tight" style={{ color: INK }}>To‘lovlar</h1>
            <p className="mt-1 text-[12.5px] leading-none text-[#6e868c]">Seminar to‘lovlarini boshqaring, tranzaksiyalarni kuzating va hisobotlar oling</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Drop
              value={range}
              onChange={setRange}
              className="w-[228px]"
              icon={<Calendar className="size-3.5 text-[var(--color-org-teal)]" />}
              options={[
                { value: 'year', label: '1-yan, 2026 — 31-dek, 2026' },
                { value: 'month', label: 'Shu oy' },
                { value: 'q', label: 'So‘nggi 90 kun' },
              ]}
            />
            <button type="button" onClick={() => { downloadText('tolovlar.csv', ['id,ism,seminar,summa,usul,holat', ...filtered.map((p) => `${p.id},${p.who},${p.seminar},${p.sum},${p.method},${p.state}`)].join('\n'), 'text/csv'); notify('Hisobot yuklab olindi') }} className="inline-flex h-[34px] items-center gap-1.5 rounded-lg px-3.5 text-[12.5px] font-semibold text-white shadow-[0_4px_10px_rgb(2_128_137/0.25)]" style={{ background: TEAL }}>
              <Download className="size-3.5" /> Hisobotni yuklab olish
            </button>
          </div>
        </div>

        <section className="mt-2 grid grid-cols-4 gap-2">
          <KpiCard icon={Wallet} label="Umumiy tushum" value={som(revenue)} iconBg="#e7f7f4" iconColor={TEAL} foot={<span className="text-[#7d939a]">muvaffaqiyatli</span>} />
          <KpiCard icon={Check} label="Muvaffaqiyatli to‘lovlar" value={String(counts.ok)} iconBg="#e7f7f4" iconColor={TEAL} foot={<Up color="#16a34a">{rows.length ? `${Math.round((counts.ok / rows.length) * 100)}%` : '0%'}</Up>} />
          <KpiCard icon={Clock} label="Kutilayotgan to‘lovlar" value={String(counts.wait)} iconBg="#e7f7f4" iconColor={TEAL} foot={<span className="font-semibold text-[#d0890b]">{rows.length ? `${Math.round((counts.wait / rows.length) * 100)}%` : '0%'}</span>} />
          <KpiCard icon={XCircle} label="Bekor qilingan to‘lovlar" value={String(counts.cancel + counts.refund)} iconBg="#fdecef" iconColor="#e11d48" foot={<span className="font-semibold text-[#e11d48]">qaytarilgan {counts.refund}</span>} />
        </section>

        <div className={`mt-2.5 grid min-h-0 flex-1 gap-2.5 ${panel ? 'grid-cols-[minmax(0,1fr)_220px]' : 'grid-cols-1'}`}>
          <div className="flex min-h-0 min-w-0 flex-col gap-1.5">
            <div className="mt-1 grid shrink-0 grid-cols-[minmax(0,1.22fr)_minmax(220px,0.86fr)] gap-2">
              <section className="rounded-2xl border border-[#e7f1ef] bg-white px-3 py-2 shadow-[0_1px_2px_rgb(16_40_40/0.03)]">
                <div className="flex items-center justify-between">
                  <h2 className="text-[13.5px] font-bold" style={{ color: INK }}>Tushumlar dinamikasi</h2>
                  <Drop value={unit} onChange={setUnit} className="w-[92px]" options={[{ value: 'som', label: 'So‘mda' }, { value: 'ming', label: 'Ming' }, { value: 'usd', label: 'Dollar' }]} />
                </div>
                <Bars payments={rows} />
              </section>
              <section className="rounded-2xl border border-[#e7f1ef] bg-white px-3 py-2 shadow-[0_1px_2px_rgb(16_40_40/0.03)]">
                <h2 className="mb-0.5 text-[13.5px] font-bold" style={{ color: INK }}>To‘lov usullari bo‘yicha</h2>
                <Donut payments={rows} />
              </section>
            </div>

            <div className="flex shrink-0 flex-nowrap gap-1.5">
              {[
                ['all', `Barcha to‘lovlar (${counts.all})`],
                ['ok', `Muvaffaqiyatli (${counts.ok})`],
                ['wait', `Kutilayotgan (${counts.wait})`],
                ['cancel', `Bekor qilingan (${counts.cancel})`],
                ['refund', `Qaytarilgan (${counts.refund})`],
              ].map(([id, label]) => (
                <button key={id} type="button" onClick={() => { setTab(id); setPage(1) }} className={`h-[24px] whitespace-nowrap rounded-full px-2.5 text-[11.5px] font-semibold ${tab === id ? 'text-white' : 'border border-[#e5eeec] bg-white text-[#3e5960]'}`} style={tab === id ? { background: TEAL } : undefined}>{label}</button>
              ))}
            </div>

            <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#e7f1ef] bg-white shadow-[0_1px_2px_rgb(16_40_40/0.03)]">
              <div className="flex shrink-0 items-center gap-1.5 px-2 py-1.5">
                <label className="flex h-8 min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-[#e5eeec] bg-white px-2.5">
                  <Search className="size-3.5 shrink-0 text-[#8aa4a8]" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ishtirokchi, seminar yoki tranzaksiya ID..." className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-[#9aafb4]" />
                </label>
                <Drop value={seminar} onChange={(v) => { setSeminar(v); setPage(1) }} className="w-[132px]" options={[{ value: 'all', label: 'Barcha seminarlar' }, ...hub.seminars.map((s) => ({ value: s.id, label: s.title }))]} />
                <Drop value={method} onChange={setMethod} className="w-[118px]" options={[{ value: 'all', label: 'Barcha usullar' }, ...['Payme', 'Click', 'Uzum', 'Paynet'].map((m) => ({ value: m, label: m }))]} />
                <Drop value={state} onChange={setState} className="w-[128px]" options={[{ value: 'all', label: 'Barcha holatlar' }, ...Object.entries(STATE_META).map(([value, m]) => ({ value, label: m.label }))]} />
                <Drop value={span} onChange={(v) => { setSpan(v); setPage(1) }} className="w-[124px]" icon={<Calendar className="size-3.5 text-[#8aa4a8]" />} options={[{ value: 'all', label: 'Sana oralig‘i' }, { value: 'nov', label: 'Noyabr 2026' }]} />
                <button type="button" onClick={reset} className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-[#b7e4de] bg-white px-2.5 text-[12px] font-semibold" style={{ color: TEAL }}>
                  <Filter className="size-3.5" /> Filtrlar
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-hidden">
                <table className="w-full table-fixed text-left">
                  <colgroup>
                    <col className="w-8" />
                    <col className="w-[92px]" />
                    <col className="w-[78px]" />
                    <col className="w-[148px]" />
                    <col />
                    <col className="w-[108px]" />
                    <col className="w-[92px]" />
                    <col className="w-[112px]" />
                    <col className="w-[52px]" />
                  </colgroup>
                  <thead>
                    <tr className="border-y border-[#eef3f2] text-[11px] font-medium text-[#8aa0a4]">
                      <th className="px-2 py-1.5"><input type="checkbox" aria-label="Hammasini belgilash" checked={allChecked} className="accent-[var(--color-org-teal)]" onChange={(e) => {
                        const next = { ...checked }
                        shown.forEach((p) => { next[p.id] = e.target.checked })
                        setChecked(next)
                      }} /></th>
                      {['#', 'Sana va vaqt', 'Ishtirokchi', 'Seminar', 'Summa', 'To‘lov usuli', 'Holat', 'Amallar'].map((h) => <th key={h} className="px-1.5 py-1.5 font-medium">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((p) => (
                      <tr key={p.id} onClick={() => { setSelected(p.id); setPanel(true) }} className={`h-[30px] cursor-pointer border-b border-[#f3f7f6] ${pay?.id === p.id ? 'bg-[#f4fbfa]' : 'hover:bg-[#f8fcfb]'}`}>
                        <td className="px-2 py-0" onClick={(e) => e.stopPropagation()}><input type="checkbox" className="accent-[var(--color-org-teal)]" checked={!!checked[p.id]} aria-label={p.id} onChange={() => setChecked((c) => ({ ...c, [p.id]: !c[p.id] }))} /></td>
                        <td className="px-1.5 py-0 text-[11.5px] font-semibold leading-none" style={{ color: TEAL }}>#{p.id}</td>
                        <td className="px-1.5 py-0 text-[10.5px] leading-[1.15] text-[#5e787e]"><div>{p.when}</div><div className="text-[#8aa0a4]">{p.time}</div></td>
                        <td className="px-1.5 py-0">
                          <span className="flex min-w-0 items-center gap-1.5">
                            <img src={FACES[p.face % FACES.length]} alt="" className="size-5 shrink-0 rounded-full object-cover" />
                            <span className="min-w-0">
                              <span className="block truncate text-[12px] font-semibold" style={{ color: INK }}>{p.who}</span>
                              <span className="block truncate text-[10.5px] text-[#8aa0a4]">{p.clinic}</span>
                            </span>
                          </span>
                        </td>
                        <td className="truncate px-1.5 py-0 text-[11.5px] text-[#3e5960]">{p.seminar}</td>
                        <td className="px-1.5 py-0 text-[11.5px] font-semibold" style={{ color: INK }}>{som(p.sum)}</td>
                        <td className="px-1.5 py-0">
                          <span className="inline-flex items-center gap-1 text-[12px]"><MethodMark name={p.method} />{p.method}</span>
                        </td>
                        <td className="px-1.5 py-0"><StatusPill state={p.state} /></td>
                        <td className="px-1" onClick={(e) => e.stopPropagation()}>
                          <div className="relative">
                            <button type="button" aria-label="Amallar" onClick={() => setMenu(menu === p.id ? null : p.id)} className="grid size-7 place-items-center rounded-lg text-[#8aa4a8] hover:bg-[#f4fbfa]">
                              <MoreHorizontal className="size-4" />
                            </button>
                            {menu === p.id && (
                              <div className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-xl border border-[#e6eeec] bg-white py-1 shadow-lg">
                                <button type="button" className="block w-full px-3 py-1.5 text-left text-[12.5px] hover:bg-[#f4fbfa]" onClick={() => { setSelected(p.id); setReceipt(true); setMenu(null) }}>Chek</button>
                                <button type="button" className="block w-full px-3 py-1.5 text-left text-[12.5px] text-[#e11d48] hover:bg-[#f4fbfa]" onClick={() => { setSelected(p.id); setRefund(true); setMenu(null) }}>Qaytarish</button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {shown.length === 0 && <p className="py-8 text-center text-[13px] text-[#7d939a]">To‘lov topilmadi</p>}
              </div>
              <div className="flex shrink-0 items-center justify-between gap-2 border-t border-[#f0f5f4] px-3 py-1.5">
                <div className="flex items-center gap-2 text-[12px] text-[#6e868c]">
                  <span className="inline-flex h-7 items-center gap-1 rounded-lg border border-[#e5eeec] bg-white px-2">10 <ChevronDown className="size-3 text-[#8aa4a8]" /></span>
                  <span>dan {(Math.min(page, pages) - 1) * per + (shown.length ? 1 : 0)}–{(Math.min(page, pages) - 1) * per + shown.length} gacha, jami {filtered.length} ta</span>
                </div>
                <div className="flex items-center gap-0.5 text-[12px]">
                  <button type="button" aria-label="Oldingi" onClick={() => setPage((p) => Math.max(1, p - 1))} className="grid size-7 place-items-center text-[#8aa4a8]"><ChevronLeft className="size-3.5" /></button>
                  {Array.from({ length: Math.min(5, pages) }, (_, i) => i + 1).map((n) => (
                    <button key={n} type="button" onClick={() => setPage(n)} className={`grid h-7 min-w-7 place-items-center rounded-lg font-semibold ${n === Math.min(page, pages) ? 'text-white' : 'text-[#3e5960]'}`} style={n === Math.min(page, pages) ? { background: TEAL } : undefined}>{n}</button>
                  ))}
                  {pages > 5 && <button type="button" onClick={() => setPage(pages)} className="grid h-7 min-w-7 place-items-center rounded-lg px-1 font-semibold text-[#3e5960]">{pages}</button>}
                  <button type="button" aria-label="Keyingi" onClick={() => setPage((p) => Math.min(pages, p + 1))} className="grid size-7 place-items-center text-[#5e787e]"><ChevronRight className="size-3.5" /></button>
                </div>
              </div>
            </section>
          </div>

          {panel && pay && (
            <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#e7f1ef] bg-white px-3 py-2.5 shadow-[0_1px_2px_rgb(16_40_40/0.03)]">
              <div className="mb-1.5 flex items-center justify-between">
                <h2 className="text-[13.5px] font-bold" style={{ color: INK }}>To‘lov ma’lumotlari</h2>
                <button type="button" aria-label="Yopish" onClick={() => setPanel(false)} className="grid size-6 place-items-center text-[#8aa0a4]"><X className="size-4" /></button>
              </div>
              <span className={`inline-flex h-[22px] w-fit items-center gap-1 rounded-full px-2 text-[11px] font-semibold ${STATE_META[pay.state].pill}`}>
                <span className="size-1.5 rounded-full" style={{ background: STATE_META[pay.state].dot }} />
                {STATE_META[pay.state].label} to‘lov
              </span>
              <p className="mt-1.5 text-[20px] font-bold leading-none tracking-tight" style={{ color: INK }}>{som(pay.sum)}</p>
              <p className="mt-0.5 text-[12px] font-semibold" style={{ color: TEAL }}>#{pay.id}</p>
              <dl className="mt-2 space-y-1.5 text-[12px]">
                <Row icon={Calendar} label="Sana va vaqt">{pay.when}, {pay.time}</Row>
                <Row icon={CreditCard} label="To‘lov usuli"><span className="inline-flex items-center gap-1"><MethodMark name={pay.method} size={14} />{pay.method}</span></Row>
                <Row icon={UserRound} label="Ishtirokchi">
                  <span className="inline-flex items-center gap-1"><img src={FACES[pay.face % FACES.length]} alt="" className="size-4 rounded-full object-cover" />{pay.who}</span>
                </Row>
                <Row icon={Phone} label="Telefon">{pay.phone}</Row>
                <Row icon={Mail} label="Email">{pay.email}</Row>
                <Row icon={Ticket} label="Seminar"><span className="line-clamp-2">{pay.seminar}</span></Row>
                <Row icon={Ticket} label="Chipta turi">{pay.ticket}</Row>
                <div className="flex items-center gap-2">
                  <Check className="size-3.5 shrink-0 text-[#8aa4a8]" />
                  <span className="text-[11.5px] text-[#8aa0a4]">Holat</span>
                  <span className="ml-auto"><StatusPill state={pay.state} /></span>
                </div>
              </dl>
              <div className="mt-auto space-y-1.5 pt-2">
                <button type="button" onClick={() => setReceipt(true)} className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-[#d5eee8] bg-[#f3fbf9] text-[12.5px] font-semibold" style={{ color: TEAL }}><Eye className="size-3.5" /> Chekni ko‘rish</button>
                <button type="button" onClick={() => receiptOf(pay)} className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg text-[12.5px] font-semibold text-white" style={{ background: TEAL }}><Download className="size-3.5" /> Chekni yuklab olish</button>
                <button type="button" onClick={() => setRefund(true)} className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-[#e4eeec] bg-white text-[12.5px] font-semibold text-[#1c4a5a]"><RefreshCw className="size-3.5" /> To‘lovni qaytarish</button>
                <button type="button" onClick={() => setMail(true)} className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-[#e4eeec] bg-white text-[12.5px] font-semibold text-[#1c4a5a]"><Mail className="size-3.5" /> Email yuborish</button>
              </div>
            </aside>
          )}
        </div>
      </div>

      <MobilePay notify={notify} />

      <Modal open={receipt} title="To‘lov cheki" onClose={() => setReceipt(false)}>
        {pay && (
          <div className="rounded-xl border border-dashed border-[#d5ebe6] p-4 text-[13px]">
            <p className="text-center text-[12px] text-[#7d939a]">StomaHub · To‘lov cheki</p>
            <p className="mt-2 text-center text-[18px] font-bold">{som(pay.sum)}</p>
            <p className="text-center text-[12px]" style={{ color: TEAL }}>#{pay.id}</p>
            <div className="mt-3 space-y-1 text-[12.5px]">
              <p>{pay.who} · {pay.clinic}</p>
              <p>{pay.seminar}</p>
              <p>{pay.ticket} · {pay.method}</p>
              <p>{pay.when}, {pay.time}</p>
            </div>
          </div>
        )}
      </Modal>
      <Modal open={refund} title="To‘lovni qaytarish" sub="Bu amalni tasdiqlasangiz, summa ishtirokchiga qaytariladi." onClose={() => setRefund(false)}>
        <p className="text-[13px]">Summa: <b>{pay ? som(pay.sum) : ''}</b></p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={() => setRefund(false)} className="h-9 rounded-xl border border-[#e4eeec] px-3 text-[13px] font-semibold">Ortga</button>
          <button type="button" onClick={doRefund} className="h-9 rounded-xl px-3 text-[13px] font-semibold text-white" style={{ background: TEAL }}>Qaytarishni tasdiqlash</button>
        </div>
      </Modal>
      <Modal open={mail} title="Email yuborish" onClose={() => setMail(false)}>
        <label className="block text-[12.5px] font-medium">Email
          <input className="mt-1 h-10 w-full rounded-xl border border-[#e3eeec] px-3 text-[13px] outline-none" defaultValue={pay?.email || ''} />
        </label>
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" onClick={() => setMail(false)} className="h-9 rounded-xl border border-[#e4eeec] px-3 text-[13px] font-semibold">Bekor qilish</button>
          <button type="button" onClick={() => { setMail(false); notify('Email yuborildi') }} className="h-9 rounded-xl px-3 text-[13px] font-semibold text-white" style={{ background: TEAL }}>Yuborish</button>
        </div>
      </Modal>
    </>
  )
}

function Row({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-1.5">
      <Icon className="mt-0.5 size-3.5 shrink-0 text-[#8aa4a8]" />
      <span className="shrink-0 text-[11.5px] text-[#8aa0a4]">{label}</span>
      <span className="ml-auto max-w-[62%] text-right text-[12px] font-medium leading-snug" style={{ color: INK }}>{children}</span>
    </div>
  )
}

function MobilePay({ notify }) {
  const hub = useHub()
  const totals = moneyOf(hub)
  const sem = newestSeminar(hub.seminars.filter((s) => s.status !== 'qoralama')) || newestSeminar(hub.seminars)
  const [tab, setTab] = useState('all')
  const [filter, setFilter] = useState(false)
  const [open, setOpen] = useState(null)
  const source = hub.payments.slice(0, 40).map((p, i) => ({
    n: i + 1, id: p.id, init: p.who.split(' ').map((w) => w[0]).join('').slice(0, 2), who: p.who, phone: p.phone, sum: p.sum, via: p.method,
    state: p.state === 'ok' ? 'paid' : p.state === 'wait' ? 'wait' : p.state === 'refund' ? 'refund' : 'cancel',
  }))
  const rows = source.filter((r) => tab === 'all' || (tab === 'paid' ? r.state === 'paid' : tab === 'wait' ? r.state === 'wait' : r.state === 'refund'))
  const counts = { all: source.length, paid: source.filter((r) => r.state === 'paid').length, wait: source.filter((r) => r.state === 'wait').length, refund: source.filter((r) => r.state === 'refund').length }

  return (
    <div className="text-[#1c2340] md:hidden">
      <div className="rounded-2xl bg-white">
        <div className="flex gap-2 px-3 pb-1.5 pt-2">
          <img src={sem?.image || '/images/seminars/teeth.jpg'} alt="" className="h-14 w-[68px] shrink-0 rounded-xl object-cover" />
          <div className="min-w-0">
            <span className="inline-flex h-5 items-center rounded-full bg-[#e7f6f4] px-2 text-[10.5px] font-semibold" style={{ color: TEAL }}>{sem?.topic}</span>
            <p className="text-[13.5px] font-bold leading-tight text-[#3b37c9]">{sem?.title}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[#6b728a]"><Calendar className="size-3" style={{ color: TEAL }} /> {sem?.date}</p>
            <p className="flex items-center gap-1 text-[11px] text-[#6b728a]"><MapPin className="size-3" style={{ color: TEAL }} /> {sem?.place || sem?.city}</p>
          </div>
        </div>
        <div className="grid grid-cols-5 border-b border-[#eef1f6] px-1">
          {[
            [Home, 'Umumiy', sem ? `/tashkilotchi/seminarlar/${sem.id}` : '/tashkilotchi/seminarlar'],
            [Users, 'Ishtirokchilar', '/tashkilotchi/ishtirokchilar'],
            [Ticket, 'Chiptalar', '/tashkilotchi/chiptalar'],
            [Wallet, 'To‘lovlar', null],
            [Award, 'Sertifikatlar', '/tashkilotchi/sertifikatlar'],
          ].map(([Icon, label, to]) => {
            const active = !to
            const cls = `flex flex-col items-center gap-0 pb-1 pt-0.5 text-[10px] ${active ? 'font-semibold' : 'text-[#8b95a7]'}`
            const inner = (<><Icon className="size-[18px]" strokeWidth={1.8} style={{ color: active ? TEAL : '#8b95a7' }} /><span style={active ? { color: TEAL } : undefined}>{label}</span>{active && <span className="mt-0.5 h-0.5 w-8 rounded-full" style={{ background: TEAL }} />}</>)
            return to
              ? <Link key={label} to={to} className={cls}>{inner}</Link>
              : <div key={label} className={cls}>{inner}</div>
          })}
        </div>

        <div className="bg-[#f5f7fb] px-3 pb-2 pt-2">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-[17px] font-bold leading-none" style={{ color: INK }}>To‘lovlar</h1>
              <p className="mt-0.5 text-[11.5px] text-[#8b95a7]">Barcha to‘lovlar ro‘yxati</p>
            </div>
            <button type="button" onClick={() => setFilter(true)} className="inline-flex h-8 items-center gap-1 rounded-xl border border-[#d9e2ea] bg-white px-2.5 text-[12.5px] font-semibold text-[#3e5960]">
              <Filter className="size-3.5" /> Filtr
            </button>
          </div>

          <div className="mt-2 grid grid-cols-3 rounded-2xl bg-white px-1 py-1.5 shadow-[0_1px_2px_rgb(16_40_40/0.04)]">
            {[
              [Banknote, 'Jami tushum', num(totals.gross)],
              [CreditCard, 'Komissiya (12%)', num(totals.fee)],
              [Wallet, 'Sizga', num(totals.net)],
            ].map(([Icon, label, value]) => (
              <div key={label} className="px-1 text-center">
                <span className="mx-auto grid size-7 place-items-center rounded-full bg-[#e7f6f4]" style={{ color: TEAL }}><Icon className="size-3.5" /></span>
                <p className="mt-1 text-[10px] leading-tight text-[#8b95a7]">{label}</p>
                <p className="text-[13px] font-bold leading-tight" style={{ color: TEAL }}>{value}</p>
                <p className="text-[11px] font-semibold" style={{ color: TEAL }}>so‘m</p>
              </div>
            ))}
          </div>

          <div className="mt-1.5 grid grid-cols-4 rounded-xl bg-[#e8edf3] p-0.5 text-[10px]">
            {[
              ['all', `Barchasi (${counts.all})`],
              ['paid', `To‘langan (${counts.paid})`],
              ['wait', `Kutilmoqda (${counts.wait})`],
              ['refund', `Qaytarilgan (${counts.refund})`],
            ].map(([id, label]) => (
              <button key={id} type="button" onClick={() => setTab(id)} className={`rounded-[10px] px-1 py-1.5 font-semibold leading-tight ${tab === id ? 'bg-white text-[#1c2340] shadow-sm' : 'text-[#8b95a7]'}`}>{label}</button>
            ))}
          </div>

          <div className="mt-2 overflow-hidden rounded-2xl bg-white">
            <div className="grid grid-cols-[22px_minmax(0,1.3fr)_62px_64px_72px_14px] items-center gap-1 px-2 py-1.5 text-[10px] text-[#9aa3b5]">
              <span>#</span><span>Ishtirokchi</span><span>Summa</span><span>Usul</span><span>Holat</span><span />
            </div>
            {rows.map((r) => (
              <button key={r.n} type="button" onClick={() => setOpen(r)} className="grid w-full grid-cols-[16px_minmax(0,1.35fr)_54px_58px_70px_12px] items-center gap-1 border-t border-[#f2f4f8] px-2 py-[3px] text-left">
                <span className="text-[11px] text-[#9aa3b5]">{r.n}</span>
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="grid size-[18px] shrink-0 place-items-center rounded-full text-[8px] font-bold" style={{ background: '#dff6f2', color: TEAL }}>{r.init}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] font-semibold text-[#2a2766]">{r.who}</span>
                    <span className="block truncate text-[10px] text-[#9aa3b5]">{r.phone}</span>
                  </span>
                </span>
                <span className="leading-tight">
                  <span className="block text-[11.5px] font-bold text-[#2a2766]">{num(r.sum)}</span>
                  <span className="block text-[10px] text-[#9aa3b5]">so‘m</span>
                </span>
                <span className="text-[10.5px] leading-tight text-[#5c6480]">{r.via}</span>
                <span className={`inline-flex h-5 w-fit items-center rounded-full px-1.5 text-[10px] font-semibold ${r.state === 'paid' ? 'bg-[#e7f8ee] text-[#16a34a]' : 'bg-[#fff4d6] text-[#d0890b]'}`}>
                  {r.state === 'paid' ? 'To‘langan' : 'Kutilmoqda'}
                </span>
                <ChevronRight className="size-3.5 text-[#c5cdd8]" />
              </button>
            ))}
            {rows.length === 0 && <p className="py-8 text-center text-[13px] text-[#8b95a7]">To‘lov topilmadi</p>}
          </div>
        </div>
      </div>

      {filter && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end bg-[#0e2433]/40" onClick={() => setFilter(false)}>
          <div className="rounded-t-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between"><h3 className="font-bold">Filtr</h3><button type="button" aria-label="Yopish" onClick={() => setFilter(false)}><X className="size-4" /></button></div>
            {[['all', 'Barchasi'], ['paid', 'To‘langan'], ['wait', 'Kutilmoqda'], ['refund', 'Qaytarilgan']].map(([id, label]) => (
              <button key={id} type="button" onClick={() => { setTab(id); setFilter(false) }} className={`mb-1 flex h-10 w-full items-center rounded-xl px-3 text-left text-[14px] ${tab === id ? 'bg-[#e7f6f4] font-semibold' : ''}`} style={tab === id ? { color: TEAL } : undefined}>{label}</button>
            ))}
          </div>
        </div>
      )}
      {open && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end bg-[#0e2433]/40" onClick={() => setOpen(null)}>
          <div className="rounded-t-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between"><h3 className="font-bold">{open.who}</h3><button type="button" aria-label="Yopish" onClick={() => setOpen(null)}><X className="size-4" /></button></div>
            <p className="text-[13px] text-[#6b728a]">{open.phone}</p>
            <p className="mt-1 text-[18px] font-bold" style={{ color: TEAL }}>{som(open.sum)}</p>
            <p className="text-[13px]">{open.via} · {open.state === 'paid' ? 'To‘langan' : 'Kutilmoqda'}</p>
            <button type="button" onClick={() => { downloadText(`chek-${open.id || open.n}.txt`, `StomaHub chek\n${open.who}\n${som(open.sum)}\n${open.via || open.method || ''}\n`); notify('Chek yuklab olindi'); setOpen(null) }} className="mt-3 h-10 w-full rounded-xl text-[13px] font-semibold text-white" style={{ background: TEAL }}>Chekni yuklab olish</button>
          </div>
        </div>
      )}
    </div>
  )
}

