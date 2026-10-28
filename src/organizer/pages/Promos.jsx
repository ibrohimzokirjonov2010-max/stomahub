import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Award, BadgePercent, Calendar, ChevronDown, ChevronLeft, ChevronRight, Coins, Copy, Gift,
  Home, MapPin, MoreVertical, Plus, Search, SlidersHorizontal, Ticket, TrendingUp, Users, Wallet, X,
} from 'lucide-react'
import { som } from '../data'
import { useOrg } from '../Shell'
import { upsertPromo, useHub } from '../../hubStore'

const APOST = '\u2018'
const SO = `so${APOST}m`

const ROWS0 = []

const STATUS = { faol: 'Faol', yakun: 'Yakunlangan', reja: 'Rejalashtirilgan', nofaol: 'Nofaol' }
const TONE = {
  faol: ['bg-[#e7f8ee]', 'text-[#16a34a]', 'bg-[#22a34a]'],
  yakun: ['bg-[#eef1f3]', 'text-[#6d7b82]', 'bg-[#9aa6ac]'],
  reja: ['bg-[#fff3e0]', 'text-[#e0890b]', 'bg-[#e0890b]'],
  nofaol: ['bg-[#fde8ee]', 'text-[#e11d48]', 'bg-[#e11d48]'],
}


const blank = { name: '', code: '', kind: 'foiz', value: '20', limit: '', limited: false, from: '', to: '', onlyTicket: false }
const MON = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek']

function useDesktop() {
  const [on, setOn] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const fn = () => setOn(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])
  return on
}

function useOutside(ref, close) {
  useEffect(() => {
    const fn = (e) => { if (!ref.current?.contains(e.target)) close() }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [ref, close])
}

function Drop({ value, onChange, options, className }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useOutside(ref, () => setOpen(false))
  const current = options.find((o) => o.value === value) || options[0]
  return (
    <div ref={ref} className={`relative shrink-0 ${className || ''}`}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex h-8 w-full items-center justify-between gap-1 rounded-lg border border-[#e4eeec] bg-white px-2 text-[11.5px] text-[#3e5a62]">
        <span className="whitespace-nowrap">{current?.label}</span>
        <ChevronDown className="size-3.5 shrink-0 text-[#93a8ad]" />
      </button>
      {open && (
        <ul className="absolute left-0 z-40 mt-1 max-h-56 w-full min-w-[168px] overflow-auto rounded-xl border border-[#e6eeec] bg-white py-1 shadow-lg">
          {options.map((o) => (
            <li key={o.value}>
              <button type="button" className={`block w-full px-3 py-1.5 text-left text-[12.5px] hover:bg-[#f4fbfa] ${o.value === value ? 'font-semibold text-[var(--color-org-teal)]' : 'text-[#1c4a5a]'}`} onClick={() => { onChange(o.value); setOpen(false) }}>{o.label}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function MiniMenu({ items }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btn = useRef(null)
  const pop = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    const fn = (e) => {
      if (pop.current?.contains(e.target) || btn.current?.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [open])
  return (
    <>
      <button
        ref={btn}
        type="button"
        aria-label="Amallar"
        onClick={() => {
          const r = btn.current.getBoundingClientRect()
          setPos({ top: r.bottom + 4, left: Math.min(r.right, window.innerWidth - 8) })
          setOpen((v) => !v)
        }}
        className="grid size-7 place-items-center rounded-lg text-[#93a4aa] hover:bg-[#f4fbfa]"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>
      </button>
      {open && (
        <div ref={pop} className="fixed z-50 w-44 overflow-hidden rounded-xl border border-[#e6eeec] bg-white py-1 shadow-lg" style={{ top: pos.top, left: pos.left, transform: 'translateX(-100%)' }}>
          {items.map((it) => (
            <button key={it.label} type="button" className="block w-full px-3 py-1.5 text-left text-[12.5px] text-[#1c4a5a] hover:bg-[#f4fbfa]" onClick={() => { setOpen(false); it.onClick() }}>{it.label}</button>
          ))}
        </div>
      )}
    </>
  )
}

function Toggle({ on, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`relative h-[22px] w-10 shrink-0 rounded-full transition ${on ? 'bg-[var(--color-org-teal)]' : 'bg-[#d7e2e4]'}`}>
      <span className={`absolute top-0.5 size-[18px] rounded-full bg-white shadow transition ${on ? 'left-[20px]' : 'left-0.5'}`} />
    </button>
  )
}

function Radio({ checked, onChange, children }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-1.5 text-[12.5px] text-[#1c4a5a]">
      <input type="radio" className="sr-only" checked={checked} onChange={onChange} />
      <span className={`grid size-[16px] place-items-center rounded-full border ${checked ? 'border-[var(--color-org-teal)]' : 'border-[#c5d4d6]'}`}>
        {checked && <span className="size-[8px] rounded-full bg-[var(--color-org-teal)]" />}
      </span>
      {children}
    </label>
  )
}

function Field({ label, req, error, children }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-0.5 text-[12px] font-medium leading-none text-[#1c4a5a]">
        {label}{req && <span className="text-[#e11d48]">*</span>}
      </span>
      {children}
      {error ? <span className="mt-0.5 block text-[11px] leading-tight text-[#e11d48]">{error}</span> : null}
    </label>
  )
}

const fieldCls = (bad) => `h-8 w-full rounded-lg border bg-white px-2.5 text-[12.5px] text-[#143044] outline-none placeholder:text-[#a8b8bc] ${bad ? 'border-[#e11d48]' : 'border-[#e3eeec] focus:border-[var(--color-org-teal)]'}`

function DateField({ value, onChange, placeholder, bad }) {
  const shown = value
    ? (() => {
      const [y, m, d] = value.split('-').map(Number)
      return `${d}-${MON[m - 1]} ${y}`
    })()
    : placeholder
  return (
    <label className={`relative flex h-8 min-w-0 flex-1 items-center gap-1 rounded-lg border bg-white px-1.5 ${bad ? 'border-[#e11d48]' : 'border-[#e3eeec]'}`}>
      <Calendar className="size-3.5 shrink-0 text-[#8aa4a8]" />
      <span className={`whitespace-nowrap text-[10px] leading-none ${value ? 'text-[#143044]' : 'text-[#a8b8bc]'}`}>{shown}</span>
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
    </label>
  )
}

function Ring({ pct = 0 }) {
  const r = 16
  const c = 2 * Math.PI * r
  const dash = (Math.max(0, Math.min(100, pct)) / 100) * c
  return (
    <svg width="46" height="46" viewBox="0 0 48 48" className="shrink-0" aria-hidden>
      <circle cx="24" cy="24" r={r} fill="none" stroke="#e5f2f0" strokeWidth="5" />
      <circle cx="24" cy="24" r={r} fill="none" stroke="#12a394" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${dash} ${c - dash}`} transform="rotate(-90 24 24)" />
      <text x="24" y="25" textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="700" fill="#143044" fontFamily="Inter, sans-serif">{Math.round(pct)}%</text>
    </svg>
  )
}

function TicketFace({ code, off, note }) {
  return (
    <div className="relative h-[70px]">
      <div className="flex h-full overflow-hidden rounded-[14px] bg-[linear-gradient(100deg,#07555e_0%,#0c7c76_55%,#12a898_100%)] text-white shadow-[0_8px_16px_rgb(7_90_96/0.16)]">
        <div className="flex min-w-0 flex-1 flex-col justify-center px-3.5">
          <p className="truncate text-[15px] font-extrabold leading-none tracking-[0.04em]">{code}</p>
          <p className="mt-1 text-[12px] font-semibold leading-none">{off}</p>
          <p className="mt-1 truncate text-[10px] leading-none text-white/75">{note}</p>
        </div>
        <div className="grid w-[64px] shrink-0 place-items-center border-l border-dashed border-white/50 bg-[#0e9a8c]/30">
          <Gift className="size-7" strokeWidth={1.6} />
        </div>
      </div>
      <span className="absolute right-[57px] -top-1.5 size-3 rounded-full bg-white" />
      <span className="absolute -bottom-1.5 right-[57px] size-3 rounded-full bg-white" />
    </div>
  )
}

function Kpi({ icon: Icon, label, value, foot, ring, valueClass = 'text-[22px]' }) {
  return (
    <article className="flex min-w-0 items-center gap-2.5 rounded-2xl border border-[#e7f2f0] bg-white px-3 py-2 shadow-[0_1px_2px_rgb(16_40_40/0.04)]">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e7f7f4] text-[var(--color-org-teal)]">
        <Icon className="size-[18px]" strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11.5px] leading-none text-[#7e9498]">{label}</p>
        <p className={`mt-1 truncate font-bold leading-none tracking-tight text-[#143044] ${valueClass}`}>{value}</p>
        {foot && <p className="mt-1 text-[11.5px] font-semibold leading-none text-[#16a34a]">{foot}</p>}
      </div>
      {ring}
    </article>
  )
}

function validate(form) {
  const e = {}
  if (form.name.trim().length < 2) e.name = 'Promo-kod nomini kiriting'
  if (!/^[A-Z0-9]{4,16}$/.test(form.code.trim().toUpperCase())) e.code = '4–16 ta lotin harf yoki raqam'
  const value = Number(form.value)
  if (!value || value <= 0) e.value = 'Chegirma miqdorini kiriting'
  if (form.kind === 'foiz' && value > 100) e.value = 'Foiz 100 dan oshmasin'
  if (form.limited && !Number(form.limit)) e.limit = 'Limitni kiriting'
  if (!form.from || !form.to) e.date = 'Muddatni tanlang'
  else if (form.from > form.to) e.date = 'Tugash sanasi boshlanishidan keyin bo‘lsin'
  return e
}

function uzShort(iso, withYear) {
  const [y, m, d] = iso.split('-').map(Number)
  return withYear ? `${d}-${MON[m - 1]} ${y}` : `${d}-${MON[m - 1]}`
}

function CreateForm({ form, setForm, err, onSave, onClose, nameRef, compact }) {
  const set = (patch) => setForm({ ...form, ...patch })
  const previewCode = form.code.trim() || 'STOMAHUB20'
  const previewValue = form.value || '20'
  const off = form.kind === 'foiz' ? `${previewValue}% chegirma` : `${previewValue ? som(previewValue) : `0 ${SO}`} chegirma`
  return (
    <div className={compact ? '' : 'rounded-2xl border border-[#e7f2f0] bg-white px-3 pb-2.5 pt-2.5 shadow-[0_1px_2px_rgb(16_40_40/0.04)]'}>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[14px] font-bold leading-none text-[#143044]">{compact ? `Promo-kod qo${APOST}shish` : 'Yangi promo-kod yaratish'}</h2>
        {onClose && (
          <button type="button" aria-label="Yopish" onClick={onClose} className="grid size-6 place-items-center text-[#8aa0a4] hover:text-[#143044]"><X className="size-4" /></button>
        )}
      </div>
      <div className="space-y-1.5">
        <Field label="Promo-kod nomi" req error={err.name}>
          <input ref={nameRef} className={fieldCls(err.name)} value={form.name} placeholder="Masalan: Student chegirmasi" onChange={(e) => set({ name: e.target.value })} />
        </Field>
        <Field label="Promo-kod" req error={err.code}>
          <input className={fieldCls(err.code)} value={form.code} placeholder="Masalan: STUDENT50" onChange={(e) => set({ code: e.target.value.toUpperCase() })} />
        </Field>
        <div>
          <p className="mb-1.5 text-[12px] font-medium leading-none text-[#1c4a5a]">Chegirma turi</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Radio checked={form.kind === 'foiz'} onChange={() => set({ kind: 'foiz' })}>Foiz (%)</Radio>
            <Radio checked={form.kind === 'summa'} onChange={() => set({ kind: 'summa' })}>Summa ({SO})</Radio>
          </div>
        </div>
        <Field label="Chegirma miqdori" req error={err.value}>
          <div className="flex items-center gap-1.5">
            <input className={fieldCls(err.value)} inputMode="numeric" value={form.value} onChange={(e) => set({ value: e.target.value.replace(/[^\d]/g, '') })} />
            <span className="grid h-8 w-10 shrink-0 place-items-center rounded-lg border border-[#e3eeec] bg-white text-[12px] text-[#6e868c]">{form.kind === 'foiz' ? '%' : SO}</span>
          </div>
        </Field>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="whitespace-nowrap text-[11px] font-medium text-[#1c4a5a]">Foydalanish limiti</span>
            <span className="whitespace-nowrap text-[10px] text-[#9aafb4]">∞ Cheksiz (ixtiyoriy)</span>
            <span className="ml-auto"><Toggle on={form.limited} onChange={(v) => set({ limited: v })} label="Foydalanish limiti" /></span>
          </div>
          {form.limited && <input className={`${fieldCls(err.limit)} mt-1.5`} placeholder="Masalan: 100" inputMode="numeric" value={form.limit} onChange={(e) => set({ limit: e.target.value.replace(/[^\d]/g, '') })} />}
          {err.limit && <span className="mt-0.5 block text-[11px] text-[#e11d48]">{err.limit}</span>}
        </div>
        <Field label="Amal qilish muddati" req error={err.date}>
          <div className="flex items-center gap-1">
            <DateField value={form.from} onChange={(from) => set({ from })} placeholder="Boshlanish sanasi" bad={err.date} />
            <ChevronRight className="size-3.5 shrink-0 text-[#b7c6c8]" />
            <DateField value={form.to} onChange={(to) => set({ to })} placeholder="Tugash sanasi" bad={err.date} />
          </div>
        </Field>
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <span className="text-[12px] text-[#1c4a5a]">Faqat ma{'\u2019'}lum chipta turiga</span>
          <Toggle on={form.onlyTicket} onChange={(v) => set({ onlyTicket: v })} label="Chipta turi" />
        </div>
        <button type="button" onClick={onSave} className="flex h-9 w-full items-center justify-center rounded-xl bg-[var(--color-org-teal)] text-[13px] font-semibold text-white shadow-[0_6px_14px_rgb(12_143_134/0.22)] hover:bg-[#0a7e76]">Saqlash</button>
      </div>
      <div className="mt-2.5">
        <p className="mb-1.5 text-[12px] font-semibold leading-none text-[#143044]">Promo-kod ko{APOST}rinishi (oldindan)</p>
        <TicketFace code={previewCode} off={off} note={form.onlyTicket ? 'Tanlangan chipta turi' : 'Barcha chipta turlari uchun'} />
      </div>
    </div>
  )
}

function Desktop() {
  const { query, notify } = useOrg()
  const hub = useHub()
  const SEMINARS = hub.seminars.length ? hub.seminars : []
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const [seminar, setSeminar] = useState('all')
  const [kind, setKind] = useState('all')
  const [status, setStatus] = useState('all')
  const rows = hub.promos
  const [form, setForm] = useState(blank)
  const [err, setErr] = useState({})
  const [showForm, setShowForm] = useState(true)
  const [page, setPage] = useState(1)
  const [per, setPer] = useState(10)
  const [picked, setPicked] = useState(SEMINARS[0]?.id || '')
  const [pickOpen, setPickOpen] = useState(false)
  const nameRef = useRef(null)
  const pickRef = useRef(null)
  useOutside(pickRef, () => setPickOpen(false))

  useEffect(() => { setPage(1) }, [tab, q, seminar, kind, status, query, per])
  useEffect(() => { if (!picked && SEMINARS[0]) setPicked(SEMINARS[0].id) }, [picked, SEMINARS])

  const filtered = useMemo(() => {
    const s = `${query || ''} ${q}`.trim().toLowerCase()
    return rows.filter((p) => {
      if (tab !== 'all' && p.status !== tab) return false
      if (status !== 'all' && p.status !== status) return false
      if (kind !== 'all' && p.kind !== kind) return false
      if (seminar !== 'all' && p.seminar !== seminar && p.seminar !== 'all') return false
      if (s && !`${p.code} ${p.name || ''}`.toLowerCase().includes(s)) return false
      return true
    })
  }, [rows, query, q, tab, status, kind, seminar])

  const pages = Math.max(1, Math.ceil(filtered.length / per))
  const safe = Math.min(page, pages)
  const slice = filtered.slice((safe - 1) * per, safe * per)
  const from = filtered.length ? (safe - 1) * per + 1 : 0
  const to = Math.min(safe * per, filtered.length)
  const counts = {
    all: rows.length,
    faol: rows.filter((p) => p.status === 'faol').length,
    yakun: rows.filter((p) => p.status === 'yakun').length,
    reja: rows.filter((p) => p.status === 'reja').length,
    nofaol: rows.filter((p) => p.status === 'nofaol').length,
  }
  const promoStats = rows.reduce((acc, p) => ({
    used: acc.used + (Number(p.used) || 0),
    limit: acc.limit + (Number(p.limit) && Number(p.limit) < 999 ? Number(p.limit) : 0),
    discount: acc.discount + (Number(p.discountSum) || 0),
    revenue: acc.revenue + (Number(p.revenueSum) || 0),
  }), { used: 0, limit: 0, discount: 0, revenue: 0 })
  const current = SEMINARS.find((s) => s.id === picked) || SEMINARS[0] || { id: '', title: 'Seminar yo‘q', image: '/images/seminar-1.jpg', date: '' }

  const copy = (code) => {
    navigator.clipboard?.writeText(code).catch(() => {})
    notify('Promo-kod nusxalandi')
  }

  const save = () => {
    const e = validate(form)
    setErr(e)
    if (Object.keys(e).length) return
    const value = Number(form.value)
    upsertPromo({
      id: Date.now(),
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      kind: form.kind,
      value,
      used: 0,
      limit: form.limited ? Number(form.limit) : 999,
      from: uzShort(form.from, false),
      to: uzShort(form.to, true),
      status: 'faol',
      seminar: picked,
    })
    setForm(blank)
    setErr({})
    notify('Promo-kod saqlandi')
  }

  const tabs = [
    { id: 'all', label: `Barchasi (${counts.all})` },
    { id: 'faol', label: `Faol (${counts.faol})` },
    { id: 'yakun', label: `Yakunlangan (${counts.yakun})` },
    { id: 'reja', label: `Rejalashtirilgan (${counts.reja})` },
    { id: 'nofaol', label: `Nofaol (${counts.nofaol})` },
  ]

  return (
    <div className="-mx-2 text-[#143044]">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0 pt-0.5">
          <h1 className="text-[22px] font-bold leading-none tracking-tight">Promo-kodlar</h1>
          <p className="mt-1.5 max-w-[540px] text-[12.5px] leading-snug text-[#7d9398]">Seminarlarga chegirmalar va maxsus takliflar yaratish, boshqarish va natijalarni kuzatish</p>
        </div>
        <div ref={pickRef} className="relative shrink-0">
          <button type="button" onClick={() => setPickOpen((v) => !v)} className="flex w-[268px] items-center gap-2 rounded-2xl border border-[#e7f2f0] bg-white p-1.5 pr-3 text-left shadow-[0_1px_2px_rgb(16_40_40/0.04)]">
            <img src={current.image} alt="" className="h-10 w-[54px] shrink-0 rounded-lg object-cover" />
            <span className="min-w-0">
              <span className="block text-[12px] font-bold leading-[1.25]">{current.title}</span>
              <span className="mt-0.5 flex items-center gap-1 text-[11px] text-[#8aa0a4]">
                <Calendar className="size-3 text-[var(--color-org-teal)]" /> {current.date ? `${current.date}${current.startTime ? `, ${current.startTime}` : ''}` : 'Sana kiritilmagan'}
              </span>
            </span>
          </button>
          {pickOpen && (
            <ul className="absolute right-0 z-40 mt-1 w-[300px] overflow-hidden rounded-xl border border-[#e6eeec] bg-white py-1 shadow-lg">
              {SEMINARS.map((s) => (
                <li key={s.id}>
                  <button type="button" className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left hover:bg-[#f4fbfa]" onClick={() => { setPicked(s.id); setPickOpen(false) }}>
                    <img src={s.image} alt="" className="h-8 w-10 rounded object-cover" />
                    <span className="min-w-0">
                      <span className="block truncate text-[12px] font-semibold">{s.title}</span>
                      <span className="block text-[11px] text-[#8aa0a4]">{s.date}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <section className="grid grid-cols-4 gap-2.5">
        {/* Hammasi payments jadvalidagi promo bilan to‘langan qatorlardan (reconcilePromos) */}
        <Kpi icon={BadgePercent} label="Jami promo-kodlar" value={hub.ready ? String(rows.length) : '…'} />
        <Kpi icon={Users} label="Foydalanilgan" value={hub.ready ? String(promoStats.used) : '…'} ring={promoStats.limit ? <Ring pct={(promoStats.used / promoStats.limit) * 100} /> : null} />
        <Kpi icon={Coins} label="Umumiy chegirma" value={hub.ready ? som(promoStats.discount) : '…'} valueClass="text-[15px]" />
        <Kpi icon={TrendingUp} label="Promo orqali tushum" value={hub.ready ? som(promoStats.revenue) : '…'} valueClass="text-[14.5px]" />
      </section>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap gap-1.5">
          {tabs.map((t) => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)} className={`h-8 whitespace-nowrap rounded-full px-3 text-[12.5px] font-semibold ${tab === t.id ? 'bg-[var(--color-org-teal)] text-white' : 'border border-[#e5eeec] bg-white text-[#3e5a62] hover:bg-[#f6fbfa]'}`}>{t.label}</button>
          ))}
        </div>
        <button type="button" onClick={() => { setShowForm(true); setTimeout(() => nameRef.current?.focus(), 0) }} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-[var(--color-org-teal)] px-3 text-[13px] font-semibold text-white shadow-[0_6px_14px_rgb(12_143_134/0.22)] hover:bg-[#0a7e76]">
          <Plus className="size-4" strokeWidth={2.2} /> Yangi promo-kod yaratish
        </button>
      </div>

      <div className={`mt-2 grid items-start gap-2 ${showForm ? 'grid-cols-[minmax(0,1fr)_276px]' : 'grid-cols-1'}`}>
        <section className="min-w-0 rounded-2xl border border-[#e7f2f0] bg-white shadow-[0_1px_2px_rgb(16_40_40/0.04)]">
          <div className="flex items-center gap-1.5 border-b border-[#f0f5f4] px-2 py-1.5">
            <label className="flex h-8 min-w-[210px] flex-1 items-center gap-1.5 rounded-lg border border-[#e4eeec] bg-white px-2.5">
              <Search className="size-3.5 shrink-0 text-[#93a8ad]" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Promo-kod nomi yoki kodi bo‘yicha qidiring..." className="min-w-0 flex-1 bg-transparent text-[11.5px] outline-none placeholder:text-[#a8b8bc]" />
            </label>
            <Drop className="w-[132px]" value={seminar} onChange={setSeminar} options={[{ value: 'all', label: 'Barcha seminarlar' }, ...SEMINARS.map((s) => ({ value: s.id, label: s.title }))]} />
            <Drop className="w-[108px]" value={kind} onChange={setKind} options={[{ value: 'all', label: 'Barcha turlar' }, { value: 'foiz', label: 'Foiz' }, { value: 'summa', label: 'Summa' }]} />
            <Drop className="w-[124px]" value={status} onChange={setStatus} options={[{ value: 'all', label: 'Barcha holatlar' }, ...Object.entries(STATUS).map(([value, label]) => ({ value, label }))]} />
            <button type="button" onClick={() => { setQ(''); setKind('all'); setStatus('all'); setSeminar('all'); setTab('all') }} className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-[#e4eeec] bg-white px-2 text-[11.5px] font-medium text-[#1c4a5a] hover:bg-[#f7fbfb]">
              <SlidersHorizontal className="size-3.5 text-[var(--color-org-teal)]" /> Filtrlar
            </button>
          </div>
          <table className="w-full table-fixed text-left">
            <colgroup>
              <col className="w-8" />
              <col className="w-[18%]" />
              <col className="w-[72px]" />
              <col className="w-[104px]" />
              <col className="w-[132px]" />
              <col className="w-[148px]" />
              <col />
              <col className="w-9" />
            </colgroup>
            <thead>
              <tr className="border-b border-[#f0f5f4] text-[11px] font-medium text-[#8aa0a4]">
                {['#', 'Promo-kod', 'Turi', 'Chegirma', 'Foydalanilgan / Limit', 'Amal muddati', 'Holat', 'Amallar'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-1.5 py-1.5 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slice.map((p, i) => {
                const pct = p.limit ? Math.min(100, (p.used / p.limit) * 100) : 0
                const tone = TONE[p.status]
                return (
                  <tr key={p.id} className="border-b border-[#f4f8f7] last:border-0">
                    <td className="px-1.5 py-1 text-[12px] text-[#9aa8ac]">{from + i}</td>
                    <td className="px-1.5 py-1">
                      <span className="inline-flex items-center gap-1 whitespace-nowrap">
                        <span className="text-[12.5px] font-bold tracking-wide">{p.code}</span>
                        <button type="button" aria-label={`${p.code} nusxalash`} onClick={() => copy(p.code)} className="text-[#a8b6ba] hover:text-[var(--color-org-teal)]"><Copy className="size-3.5" strokeWidth={1.8} /></button>
                      </span>
                    </td>
                    <td className="px-1.5 py-1">
                      <span className="inline-flex h-5 items-center rounded-full bg-[#fde8ee] px-2 text-[11px] font-semibold text-[#e11d48]">{p.kind === 'foiz' ? 'Foiz' : 'Summa'}</span>
                    </td>
                    <td className={`whitespace-nowrap px-1.5 py-1 text-[12.5px] font-bold ${p.kind === 'foiz' ? 'text-[var(--color-org-teal)]' : 'text-[#e11d48]'}`}>
                      {p.kind === 'foiz' ? `${p.value}%` : som(p.value)}
                    </td>
                    <td className="px-1.5 py-1">
                      <p className="text-[12px] leading-none text-[#1c4a5a]">{p.used} / {p.limit}</p>
                      <div className="mt-1 h-1 w-[72px] overflow-hidden rounded-full bg-[#e7f1ef]"><div className="h-full rounded-full bg-[#14a394]" style={{ width: `${pct}%` }} /></div>
                    </td>
                    <td className="whitespace-nowrap px-1.5 py-1 text-[11.5px] text-[#5e787e]">{p.from} – {p.to}</td>
                    <td className="px-1.5 py-1">
                      <span className={`inline-flex h-5 items-center gap-1 whitespace-nowrap rounded-full px-2 text-[11px] font-semibold ${tone[0]} ${tone[1]}`}>
                        <span className={`size-1.5 rounded-full ${tone[2]}`} /> {STATUS[p.status]}
                      </span>
                    </td>
                    <td className="px-0.5">
                      <MiniMenu items={[
                        { label: 'Nusxa yaratish', onClick: () => { upsertPromo({ ...p, id: Date.now(), code: `${p.code.slice(0, 14)}2`, used: 0 }); notify('Nusxa yaratildi') } },
                        { label: p.status === 'nofaol' ? 'Faollashtirish' : 'Nofaol qilish', onClick: () => upsertPromo({ ...p, status: p.status === 'nofaol' ? 'faol' : 'nofaol' }) },
                      ]} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="py-8 text-center text-[13px] text-[#7e9398]">Promo-kod topilmadi</p>}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between gap-2 border-t border-[#f0f5f4] px-3 py-2">
              <div className="flex items-center gap-2 text-[12px] text-[#7e9398]">
                <Drop value={per} onChange={(n) => setPer(Number(n))} options={[10, 20, 50].map((n) => ({ value: n, label: String(n) }))} className="w-[64px]" />
                <span>dan {to} gacha, jami {filtered.length} ta</span>
              </div>
              <div className="flex items-center gap-0.5">
                <button type="button" aria-label="Oldingi" disabled={safe <= 1} onClick={() => setPage(safe - 1)} className="grid size-7 place-items-center rounded-lg text-[#5e787e] disabled:opacity-40"><ChevronLeft className="size-4" /></button>
                {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                  <button key={n} type="button" onClick={() => setPage(n)} className={`grid size-7 place-items-center rounded-lg text-[12.5px] font-semibold ${n === safe ? 'bg-[var(--color-org-teal)] text-white' : 'text-[#3e5a62] hover:bg-[#f4fbfa]'}`}>{n}</button>
                ))}
                <button type="button" aria-label="Keyingi" disabled={safe >= pages} onClick={() => setPage(safe + 1)} className="grid size-7 place-items-center rounded-lg text-[#5e787e] disabled:opacity-40"><ChevronRight className="size-4" /></button>
              </div>
            </div>
          )}
        </section>
        {showForm && <CreateForm form={form} setForm={setForm} err={err} onSave={save} onClose={() => setShowForm(false)} nameRef={nameRef} />}
      </div>
    </div>
  )
}

const M_TABS = [
  { to: '/tashkilotchi/seminarlar', label: 'Umumiy', icon: Home },
  { to: '/tashkilotchi/ishtirokchilar', label: 'Ishtirokchilar', icon: Users },
  { to: '/tashkilotchi/chiptalar', label: 'Chiptalar', icon: Ticket },
  { to: '/tashkilotchi/tolovlar', label: `To${APOST}lovlar`, icon: Wallet },
  { to: '/tashkilotchi/sertifikatlar', label: 'Sertifikatlar', icon: Award },
]

function Mobile() {
  const { notify } = useOrg()
  const hub = useHub()
  const sem = hub.seminars[0]
  const rows = hub.promos.map((p) => ({
    ...p,
    off: p.kind === 'summa' ? `${som(p.value)} chegirma` : `${p.value}% chegirma`,
    date: p.to || p.from || '',
    label: p.status === 'faol' ? 'Faol' : p.status === 'yakun' ? 'Tugagan' : 'Nofaol',
  }))
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(blank)
  const [err, setErr] = useState({})
  const [menu, setMenu] = useState(null)

  const save = () => {
    const e = validate(form)
    setErr(e)
    if (Object.keys(e).length) return
    const value = Number(form.value)
    upsertPromo({
      id: Date.now(),
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      kind: form.kind,
      value,
      used: 0,
      limit: form.limited ? Number(form.limit) : 999,
      from: form.from || 'bugun',
      to: form.to || 'ochiq',
      status: 'faol',
      seminar: sem?.id || 'all',
    })
    setForm(blank)
    setErr({})
    setOpen(false)
    notify('Promo-kod saqlandi')
  }

  return (
    <div className="-mx-3 -mb-4 min-h-[calc(100dvh-8.5rem)] bg-[#f6f7fb] px-4 pb-8 pt-1 text-[#24185a]">
      <Link to={sem ? `/tashkilotchi/seminarlar/${sem.id}` : '/tashkilotchi/seminarlar'} className="flex items-center gap-3 rounded-2xl border border-[#eef0f5] bg-white p-2.5 shadow-[0_1px_3px_rgb(30_20_60/0.04)]">
        <img src={sem?.image || '/images/seminars/teeth.jpg'} alt="" className="h-[72px] w-[72px] shrink-0 rounded-xl object-cover" />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold leading-none text-[var(--color-org-teal)]">{sem?.topic || 'Seminar'}</span>
          <span className="mt-1 flex items-start justify-between gap-1">
            <span className="text-[14.5px] font-bold leading-tight text-[#3a2a86]">{sem?.title || 'Seminar'}</span>
            <ChevronRight className="mt-0.5 size-4 shrink-0 text-[#b0b4c4]" />
          </span>
          <span className="mt-1.5 flex items-center gap-1 text-[11px] text-[#6d7385]">
            <Calendar className="size-3.5 shrink-0 text-[var(--color-org-teal)]" /> {sem?.date || ''}{sem?.startTime ? `, ${sem.startTime}` : ''}
          </span>
          <span className="mt-0.5 flex items-center gap-1 text-[11px] text-[#6d7385]">
            <MapPin className="size-3.5 shrink-0 text-[var(--color-org-teal)]" /> {sem?.place || sem?.city || ''}
          </span>
        </span>
      </Link>

      <nav className="mt-3 flex items-start justify-between px-0.5">
        {M_TABS.map((t) => (
          <Link key={t.label} to={t.to} className="flex w-[64px] flex-col items-center gap-1 text-center text-[10px] font-medium leading-tight text-[#7b7896]">
            <t.icon className="size-[18px]" strokeWidth={1.7} />
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="mt-3.5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold leading-none text-[#3a2a86]">Promo-kodlar</h1>
          <p className="mt-1.5 max-w-[200px] text-[12.5px] leading-snug text-[#8b90a3]">Chipta sotuvini rag{APOST}batlantirish uchun promo-kodlar yarating.</p>
        </div>
        <button type="button" onClick={() => { setErr({}); setOpen(true) }} className="mt-0.5 inline-flex h-10 shrink-0 items-center gap-1 rounded-xl bg-[#0e9b86] px-2.5 text-[12.5px] font-semibold text-white shadow-[0_6px_14px_rgb(14_155_134/0.25)]">
          <Plus className="size-4" strokeWidth={2.4} /> Promo-kod qo{APOST}shish
        </button>
      </div>

      <div className="mt-3 space-y-2.5">
        {rows.map((p) => {
          const live = p.status === 'faol'
          return (
            <article key={p.id} className="rounded-2xl border border-[#eef0f5] bg-white px-3 py-3 shadow-[0_1px_3px_rgb(30_20_60/0.04)]">
              <div className="flex gap-2.5">
                <Ticket className="mt-0.5 size-7 shrink-0 text-[#12a394]" strokeWidth={1.7} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[15px] font-extrabold leading-none tracking-wide text-[#1a1440]">{p.code}</p>
                      <p className="mt-1 text-[12px] leading-none text-[#8b90a0]">{p.off}</p>
                    </div>
                    <button type="button" aria-label="Amallar" onClick={() => setMenu(menu === p.id ? null : p.id)} className="grid size-6 place-items-center text-[#9aa0b0]">
                      <MoreVertical className="size-4" />
                    </button>
                  </div>
                  {menu === p.id && (
                    <div className="mt-1 overflow-hidden rounded-xl border border-[#eef0f5] bg-white shadow-md">
                      <button type="button" className="block w-full px-3 py-2 text-left text-[12.5px] hover:bg-[#f6f7fb]" onClick={() => { navigator.clipboard?.writeText(p.code).catch(() => {}); notify('Promo-kod nusxalandi'); setMenu(null) }}>Nusxalash</button>
                      <button type="button" className="block w-full px-3 py-2 text-left text-[12.5px] hover:bg-[#f6f7fb]" onClick={() => { upsertPromo({ ...p, status: p.status === 'faol' ? 'nofaol' : 'faol' }); setMenu(null) }}>{live ? 'Nofaol qilish' : 'Faollashtirish'}</button>
                    </div>
                  )}
                  <div className="mt-2.5 flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <Users className="size-3.5 text-[#12a394]" />
                      <div className="leading-tight">
                        <p className="text-[12px] font-bold text-[#1c2434]">{p.used} / {p.limit}</p>
                        <p className="text-[10px] text-[#9aa3ad]">Ishlatilgan</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-[#12a394]" />
                      <div className="leading-tight">
                        <p className="text-[12px] font-semibold text-[#1c2434]">{p.date}</p>
                        <p className="text-[10px] text-[#9aa3ad]">Muddat</p>
                      </div>
                    </div>
                    <span className={`ml-auto inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[12px] font-semibold ${live ? 'bg-[#e7f8ee] text-[#1aa35a]' : 'bg-[#eef1f3] text-[#8b939c]'}`}>
                      <span className={`size-1.5 rounded-full ${live ? 'bg-[#1aa35a]' : 'bg-[#a0a7ae]'}`} />
                      {p.label}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#0e2433]/45" onMouseDown={() => setOpen(false)}>
          <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white px-4 pb-6 pt-4" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <CreateForm compact form={form} setForm={setForm} err={err} onSave={save} onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  )
}

export default function Promos() {
  const desktop = useDesktop()
  return desktop ? <Desktop /> : <Mobile />
}
