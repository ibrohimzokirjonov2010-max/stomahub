import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2, Calendar, Check, ChevronDown, ChevronLeft, ChevronRight, Clock, CreditCard,
  Download, House, Mail, MapPin, MoreVertical, Plus, QrCode, SlidersHorizontal, Ticket,
  UserRound, Users, Wallet, X, XCircle,
} from 'lucide-react'
import { PAY_LABEL } from '../data'
import { useOrg } from '../Shell'
import { addParticipant, checkIn, downloadText, newestSeminar, removeParticipant, useHub } from '../../hubStore'
import { Btn, Field, Modal, inputCls } from '../ui'
import { useMobile } from '../../useMobile'
import { FACE } from './participantsData'
import './participants.css'

const TEAL = 'var(--color-org-teal)'
const DASH = '\u2013'

const TICKET_CLS = {
  Standart: 'bg-[#e7f8ef] text-[#16a34a]',
  VIP: 'bg-[#f3e8ff] text-[#7c3aed]',
  Student: 'bg-[#e7f0ff] text-[#2563eb]',
  Guruh: 'bg-[#fff4e5] text-[#d0890b]',
}

const PAY_CLS = {
  paid: 'bg-[#e7f8ef] text-[#16a34a]',
  wait: 'bg-[#fff4e0] text-[#d0890b]',
  unpaid: 'bg-[#fde8ee] text-[#e11d48]',
  cancel: 'bg-[#fde8ee] text-[#e11d48]',
  refund: 'bg-[#eef2f3] text-[#5f7278]',
}

const faceOf = (p) => FACE[p.id] || p.avatar

function splitWhen(value) {
  const [date, time] = String(value || '').split(', ')
  return { date, time }
}

function pageItems(page, pages) {
  if (pages <= 6) return Array.from({ length: pages }, (_, i) => i + 1)
  if (page <= 5) return [1, 2, 3, 4, 5, '\u2026', pages]
  const out = [1, '\u2026']
  for (let n = Math.max(2, page - 1); n <= Math.min(pages - 1, page + 1); n += 1) out.push(n)
  if (page + 1 < pages - 1) out.push('\u2026')
  out.push(pages)
  return out
}

function useDismiss(ref, onClose) {
  useEffect(() => {
    const fn = (e) => { if (!ref.current?.contains(e.target)) onClose() }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [ref, onClose])
}

function VertMenu({ items, bordered, label = 'Amallar' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useDismiss(ref, () => setOpen(false))
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`grid place-items-center text-[#8aa4a8] hover:bg-[#f4fbfa] ${bordered ? 'size-9 rounded-xl border border-[#e4eeec] bg-white' : 'size-8 rounded-lg'}`}
      >
        <MoreVertical className="size-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-48 overflow-hidden rounded-xl border border-[#e6eeec] bg-white py-1 shadow-lg">
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] hover:bg-[#f4fbfa] ${it.danger ? 'text-[#e11d48]' : 'text-[#1c4a5a]'}`}
              onClick={() => { setOpen(false); it.onClick?.() }}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Drop({ value, onChange, options, className = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useDismiss(ref, () => setOpen(false))
  const current = options.find((o) => o.value === value) || options[0]
  return (
    <div ref={ref} className={`relative ${className}`}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex h-9 w-full items-center justify-between gap-2 rounded-xl border border-[#e4eeec] bg-white px-3 text-[12.5px] text-[#3e5a62]">
        <span className="truncate">{current?.label}</span>
        <ChevronDown className="size-3.5 shrink-0 text-[#8aa4a8]" />
      </button>
      {open && (
        <ul className="absolute left-0 z-30 mt-1 max-h-64 w-full min-w-[168px] overflow-auto rounded-xl border border-[#e6eeec] bg-white py-1 shadow-lg">
          {options.map((o) => (
            <li key={String(o.value)}>
              <button
                type="button"
                className={`block w-full px-3 py-1.5 text-left text-[12.5px] hover:bg-[#f4fbfa] ${o.value === value ? 'font-semibold text-[var(--color-org-teal)]' : 'text-[#1c4a5a]'}`}
                onClick={() => { onChange(o.value); setOpen(false) }}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Pill({ className, children, dot }) {
  return (
    <span className={`inline-flex h-[22px] max-w-full items-center gap-1 whitespace-nowrap rounded-full px-2 text-[11px] font-semibold ${className}`}>
      {dot && <span className="size-1.5 shrink-0 rounded-full bg-current" />}
      <span className="truncate">{children}</span>
    </span>
  )
}

function MiniQr({ className = 'size-4' }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden>
      <rect x="0.8" y="0.8" width="5.2" height="5.2" rx="0.7" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <rect x="2.3" y="2.3" width="2.2" height="2.2" fill="currentColor" />
      <rect x="10" y="0.8" width="5.2" height="5.2" rx="0.7" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <rect x="11.5" y="2.3" width="2.2" height="2.2" fill="currentColor" />
      <rect x="0.8" y="10" width="5.2" height="5.2" rx="0.7" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <rect x="2.3" y="11.5" width="2.2" height="2.2" fill="currentColor" />
      <rect x="10" y="10" width="1.5" height="1.5" fill="currentColor" />
      <rect x="12.4" y="10" width="1.5" height="1.5" fill="currentColor" />
      <rect x="14.2" y="11.6" width="1.2" height="1.2" fill="currentColor" />
      <rect x="10" y="12.6" width="1.5" height="1.5" fill="currentColor" />
      <rect x="12.5" y="14" width="1.4" height="1.2" fill="currentColor" />
    </svg>
  )
}

function KpiCard({ icon: Icon, label, value, pct, pctClass, bar, iconBg }) {
  return (
    <article className="flex min-w-0 items-center gap-2.5 rounded-2xl border border-[#e6f1ef] bg-white px-3 py-2.5 shadow-[0_1px_2px_rgb(16_40_40/0.04)]">
      <span className={`grid size-10 shrink-0 place-items-center rounded-2xl ${iconBg}`}>
        <Icon className="size-[18px]" strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] leading-tight text-[#6e868c]">{label}</p>
        <p className="truncate text-[20px] font-bold leading-tight tracking-tight text-[#143044]">{value}</p>
        {bar != null && (
          <div className="mt-1.5 h-[5px] overflow-hidden rounded-full bg-[#e6f2f0]">
            <div className="h-full rounded-full bg-[#12a394]" style={{ width: `${bar}%` }} />
          </div>
        )}
        <p className={`mt-0.5 flex items-center gap-1 text-[12px] font-semibold leading-none ${pctClass}`}>
          <span className="size-1.5 rounded-full bg-current" />
          {pct}
        </p>
      </div>
    </article>
  )
}

export default function Participants() {
  const mobile = useMobile()
  return mobile ? <MobileParticipants /> : <DesktopParticipants />
}

function DesktopParticipants() {
  const { query, notify } = useOrg()
  const hub = useHub()
  const SEMINARS = hub.seminars
  const [seminar, setSeminar] = useState('all')
  const [semOpen, setSemOpen] = useState(false)
  const semRef = useRef(null)
  useDismiss(semRef, () => setSemOpen(false))
  const [q, setQ] = useState('')
  const [ticket, setTicket] = useState('all')
  const [pay, setPay] = useState('all')
  const [city, setCity] = useState('all')
  const rows = useMemo(() => (seminar === 'all' ? hub.participants : hub.participants.filter((p) => p.seminarId === seminar)), [hub.participants, seminar])
  const [selected, setSelected] = useState(null)
  const [panel, setPanel] = useState(true)
  const [tab, setTab] = useState('info')
  const [add, setAdd] = useState(false)
  const [mail, setMail] = useState(false)
  const [page, setPage] = useState(1)
  const [per, setPer] = useState(8)
  const [pagerFree, setPagerFree] = useState(false)
  const [perOpen, setPerOpen] = useState(false)
  const perRef = useRef(null)
  useDismiss(perRef, () => setPerOpen(false))

  const allMode = seminar === 'all'
  const current = allMode ? null : (SEMINARS.find((s) => s.id === seminar) || SEMINARS[0])
  const headSeats = allMode ? SEMINARS.reduce((n, s) => n + (Number(s.seats) || 0), 0) : (current?.seats || rows.length)
  const headTitle = allMode ? 'Barcha seminarlar' : (current?.title || 'Seminar')
  const headImage = allMode ? (newestSeminar(SEMINARS)?.image || '/images/seminars/teeth.jpg') : (current?.id === 'endo' ? '/images/bemorlar/bemor-intra.jpg' : current?.image)
  const filtered = useMemo(() => {
    const s = `${query} ${q}`.trim().toLowerCase()
    return rows.filter((p) => {
      if (ticket !== 'all' && p.ticket !== ticket) return false
      if (pay !== 'all' && p.pay !== pay) return false
      if (city !== 'all' && p.city !== city) return false
      if (s && !`${p.name} ${p.phone} ${p.email} ${p.clinic}`.toLowerCase().includes(s)) return false
      return true
    })
  }, [rows, query, q, ticket, pay, city])

  const designLock = false
  const pages = designLock ? 18 : Math.max(1, Math.ceil(filtered.length / per) || 1)
  const safe = Math.min(page, pages)
  const slice = filtered.slice((safe - 1) * per, safe * per)
  const from = filtered.length ? (safe - 1) * per + 1 : 0
  const to = Math.min(safe * per, filtered.length)
  const person = panel ? rows.find((p) => p.id === selected) || null : null

  useEffect(() => { setPage(1) }, [q, query, ticket, pay, city, per, seminar])
  useEffect(() => {
    if (seminar !== 'all' && !SEMINARS.some((s) => s.id === seminar)) setSeminar('all')
  }, [seminar, SEMINARS])

  const clearFilters = () => {
    setQ('')
    setTicket('all')
    setPay('all')
    setCity('all')
  }

  return (
    <div className="org-participants -mt-1 -mb-4 text-[#143044]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold leading-none tracking-tight">Ishtirokchilar</h1>
          <p className="mt-1.5 text-[13px] leading-snug text-[#6e868c]">Seminar ishtirokchilarini boshqaring, to‘lovlar, QR check-in va sertifikatlar</p>
        </div>
        <div className="shrink-0">
          <p className="text-right text-[12px] leading-none text-[#8aa0a4]">
            <Link to="/tashkilotchi" className="hover:text-[var(--color-org-teal)]">Boshqaruv paneli</Link>
            <span className="px-1.5 text-[#b7c6c8]">&gt;</span>
            <Link to="/tashkilotchi/seminarlar" className="hover:text-[var(--color-org-teal)]">Mening seminarlarim</Link>
            <span className="px-1.5 text-[#b7c6c8]">&gt;</span>
            Ishtirokchilar
          </p>
          <div className="mt-2.5 flex justify-end gap-2">
            <button type="button" onClick={() => setAdd(true)} className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-[13px] font-semibold text-white shadow-[0_6px_14px_rgb(3_128_136/0.22)]" style={{ background: TEAL }}>
              <Plus className="size-4" strokeWidth={2.4} /> Ishtirokchi qo‘shish
            </button>
            <VertMenu
              bordered
              label="Yana"
              items={[
                { label: 'Excel yuklab olish', onClick: () => { downloadText('ishtirokchilar.csv', ['ism,telefon,email,chipta,tolov,keldi', ...filtered.map((p) => `${p.name},${p.phone},${p.email},${p.ticket},${p.pay},${p.arrived ? 'Keldi' : ''}`)].join('\n'), 'text/csv'); notify('Excel yuklab olindi') } },
                { label: 'Email yuborish', onClick: () => setMail(true) },
              ]}
            />
          </div>
        </div>
      </div>

      <section className="mt-3 grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        <KpiCard icon={Users} label="Jami ishtirokchilar" value={`${rows.length} / ${headSeats || rows.length}`} pct={headSeats ? `${Math.min(100, Math.round((rows.length / headSeats) * 100))}%` : ''} pctClass="text-[#16a34a]" bar={headSeats ? Math.min(100, Math.round((rows.length / headSeats) * 100)) : 0} iconBg="bg-[#e7f7f4] text-[var(--color-org-teal)]" />
        <KpiCard icon={Wallet} label="To‘lov qilingan" value={String(rows.filter((p) => p.pay === 'paid').length)} pct="" pctClass="text-[#16a34a]" iconBg="bg-[#e7f7f4] text-[var(--color-org-teal)]" />
        <KpiCard icon={Clock} label="Kutilmoqda" value={String(rows.filter((p) => p.pay === 'wait').length)} pct="" pctClass="text-[#e09a12]" iconBg="bg-[#fff6e8] text-[#e09a12]" />
        <KpiCard icon={XCircle} label="Keldi" value={String(rows.filter((p) => p.arrived).length)} pct="" pctClass="text-[#16a34a]" iconBg="bg-[#e7f7f4] text-[#16a34a]" />
      </section>

      <div className="mt-2.5 flex items-center gap-2 rounded-2xl border border-[#e6f1ef] bg-white px-2.5 py-2 shadow-[0_1px_2px_rgb(16_40_40/0.03)]">
        <div ref={semRef} className="relative min-w-0 flex-1">
          <button type="button" onClick={() => setSemOpen((v) => !v)} className="flex w-full min-w-0 items-center gap-2.5 text-left">
            <img src={headImage} alt="" className="h-9 w-[84px] shrink-0 rounded-lg object-cover object-center" />
            <span className="min-w-0">
              <span className="flex items-center gap-1">
                <span className="truncate text-[13.5px] font-bold leading-tight">{headTitle}</span>
                <ChevronDown className="size-4 shrink-0 text-[#8aa4a8]" />
              </span>
              <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11.5px] text-[#6e868c]">
                {allMode ? (
                  <span>{SEMINARS.length} ta seminar · {rows.length} ishtirokchi</span>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1"><Calendar className="size-3.5 text-[var(--color-org-teal)]" /> {current?.date}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="size-3.5 text-[var(--color-org-teal)]" /> {current?.city}</span>
                    <span>{current?.sold} / {current?.seats}</span>
                  </>
                )}
              </span>
            </span>
          </button>
          {semOpen && (
            <ul className="absolute left-0 top-full z-30 mt-2 max-h-72 w-[min(420px,80vw)] overflow-auto rounded-xl border border-[#e6eeec] bg-white py-1 shadow-lg">
              <li>
                <button type="button" className={`block w-full px-3 py-2 text-left text-[12.5px] hover:bg-[#f4fbfa] ${allMode ? 'font-semibold text-[var(--color-org-teal)]' : ''}`} onClick={() => { setSeminar('all'); setSemOpen(false) }}>
                  Barcha seminarlar
                </button>
              </li>
              {SEMINARS.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className={`block w-full px-3 py-2 text-left text-[12.5px] hover:bg-[#f4fbfa] ${s.id === seminar ? 'font-semibold text-[var(--color-org-teal)]' : ''}`}
                    onClick={() => { setSeminar(s.id); setSemOpen(false) }}
                  >
                    {s.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Link to="/tashkilotchi/qr" className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#b7e3dc] bg-white px-2.5 text-[12.5px] font-semibold text-[var(--color-org-teal)]">
            <QrCode className="size-4" /> QR check-in
          </Link>
          <button type="button" onClick={() => { downloadText('ishtirokchilar.csv', ['ism,telefon,email,chipta,tolov,keldi', ...filtered.map((p) => `${p.name},${p.phone},${p.email},${p.ticket},${p.pay},${p.arrived ? 'Keldi' : ''}`)].join('\n'), 'text/csv'); notify('Excel yuklab olindi') }} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#e4eeec] bg-white px-2.5 text-[12.5px] font-semibold text-[#1c4a5a]">
            <Download className="size-4 text-[#1f9d55]" /> Excel yuklab olish
          </button>
          <button type="button" onClick={() => setMail(true)} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#e4eeec] bg-white px-2.5 text-[12.5px] font-semibold text-[#1c4a5a]">
            <Mail className="size-4 text-[var(--color-org-teal)]" /> Email yuborish
          </button>
          <VertMenu
            bordered
            label="Seminar amallari"
            items={[
              { label: 'Excel yuklab olish', onClick: () => { downloadText('ishtirokchilar.csv', ['ism,telefon,email,chipta,tolov,keldi', ...filtered.map((p) => `${p.name},${p.phone},${p.email},${p.ticket},${p.pay},${p.arrived ? 'Keldi' : ''}`)].join('\n'), 'text/csv'); notify('Excel yuklab olindi') } },
              { label: 'Email yuborish', onClick: () => setMail(true) },
              { label: 'QR check-in', onClick: () => { window.location.assign('/tashkilotchi/qr') } },
            ]}
          />
        </div>
      </div>

      <div className={`mt-2.5 grid items-start gap-2.5 ${person ? 'min-[1180px]:grid-cols-[minmax(0,1fr)_272px]' : ''}`}>
        <section className="min-w-0 overflow-hidden rounded-2xl border border-[#e6f1ef] bg-white shadow-[0_1px_2px_rgb(16_40_40/0.04)]">
          <div className="flex items-center gap-2 px-2.5 py-2">
            <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#e4eeec] bg-white px-3">
              <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-[#8aa4a8]" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" /></svg>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ishtirokchi nomi, telefon yoki email bo‘yicha qidirish..." className="min-w-0 flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-[#9aafb4]" />
            </label>
            <Drop value={ticket} onChange={setTicket} className="w-[148px] shrink-0" options={[{ value: 'all', label: 'Barcha chiptalar' }, { value: 'Standart', label: 'Standart' }, { value: 'VIP', label: 'VIP' }, { value: 'Student', label: 'Student' }, { value: 'Guruh', label: 'Guruh' }]} />
            <Drop value={pay} onChange={setPay} className="w-[156px] shrink-0" options={[{ value: 'all', label: 'Barcha holatlar' }, ...Object.entries(PAY_LABEL).filter(([k]) => k !== 'refund').map(([value, label]) => ({ value, label }))]} />
            <Drop value={city} onChange={setCity} className="w-[150px] shrink-0" options={[{ value: 'all', label: 'Barcha shaharlar' }, { value: 'Toshkent', label: 'Toshkent' }, { value: 'Samarqand', label: 'Samarqand' }, { value: 'Buxoro', label: 'Buxoro' }]} />
            <button type="button" onClick={clearFilters} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-[#e4eeec] bg-white px-3 text-[12.5px] font-semibold text-[#1c4a5a]">
              <SlidersHorizontal className="size-3.5 text-[var(--color-org-teal)]" /> Filtrlar
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-y border-[#eef3f2] text-[12px] text-[#8aa0a4]">
                  {['#', 'Ishtirokchi', 'Telefon', 'Email', 'Chipta turi', 'To‘lov holati', 'Ro‘yxatdan o‘tgan', 'QR', 'Amallar'].map((h) => (
                    <th key={h} className={`px-2.5 py-1.5 font-medium ${h === '#' ? 'w-11' : ''} ${h === 'QR' || h === 'Amallar' ? 'w-10' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slice.map((p, i) => {
                  const when = splitWhen(p.registered)
                  const on = person?.id === p.id
                  return (
                    <tr
                      key={p.id}
                      onClick={() => { setSelected(p.id); setPanel(true); setTab('info') }}
                      className={`h-9 cursor-pointer border-b border-[#f3f7f6] ${on ? 'bg-[#f3fbf9]' : 'hover:bg-[#f8fcfb]'}`}
                    >
                      <td className="px-2.5"><span className="grid size-[22px] place-items-center rounded-full text-[11px] font-semibold leading-none text-white" style={{ background: TEAL }}>{from + i}</span></td>
                      <td className="px-2"><span className="flex min-w-0 items-center gap-2"><img src={faceOf(p)} alt="" className="size-7 shrink-0 rounded-full object-cover" /><span className="min-w-0 leading-tight"><span className="block truncate text-[12.5px] font-semibold">{p.name}</span><span className="block truncate text-[11px] text-[#8aa0a4]">{p.clinic}</span></span></span></td>
                      <td className="px-2 text-[12px] leading-none text-[#1c4a5a]">{p.phone}</td>
                      <td className="max-w-[140px] truncate px-2 text-[12px] leading-none text-[#4e6a72]">{p.email}</td>
                      <td className="px-2"><Pill className={TICKET_CLS[p.ticket] || TICKET_CLS.Standart}>{p.ticket}</Pill></td>
                      <td className="px-2"><Pill className={PAY_CLS[p.pay] || PAY_CLS.paid} dot>{PAY_LABEL[p.pay]}</Pill></td>
                      <td className="px-2 leading-tight text-[#5e787e]"><span className="block text-[11.5px]">{when.date}</span>{when.time && <span className="block text-[11px] text-[#8aa0a4]">{when.time}</span>}</td>
                      <td className="px-1.5"><span className="grid size-7 place-items-center rounded-lg border border-[#d7ebe7] text-[var(--color-org-teal)]"><MiniQr /></span></td>
                      <td className="px-1" onClick={(e) => e.stopPropagation()}>
                        <VertMenu
                          items={[
                            { label: 'Email', onClick: () => { setSelected(p.id); setMail(true) } },
                            { label: 'O‘chirish', danger: true, onClick: () => { removeParticipant(p.id); notify('O‘chirildi') } },
                          ]}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="py-8 text-center text-[13px] text-[#7e9398]">Ishtirokchi topilmadi</p>}
          </div>
          {filtered.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#f0f5f4] px-3 py-1">
              <div className="flex items-center gap-2 text-[12.5px] text-[#6e868c]">
                <div ref={perRef} className="relative">
                  <button type="button" onClick={() => setPerOpen((v) => !v)} className="flex h-8 items-center gap-1 rounded-lg border border-[#e4eeec] bg-white px-2 text-[12.5px] text-[#3e5a62]">
                    {designLock ? 10 : per}
                    <ChevronDown className="size-3.5 text-[#8aa4a8]" />
                  </button>
                  {perOpen && (
                    <ul className="absolute bottom-full left-0 z-30 mb-1 w-16 overflow-hidden rounded-lg border border-[#e6eeec] bg-white py-1 shadow-lg">
                      {[8, 10, 20].map((n) => (
                        <li key={n}>
                          <button type="button" className="block w-full px-2 py-1 text-left text-[12.5px] hover:bg-[#f4fbfa]" onClick={() => { setPagerFree(true); setPer(n); setPerOpen(false); setPage(1) }}>{n}</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <span>dan {from}{DASH}{to} gacha, jami {filtered.length} ta</span>
              </div>
              <div className="flex items-center gap-0.5">
                <button type="button" aria-label="Oldingi" disabled={safe <= 1} onClick={() => setPage(safe - 1)} className="grid size-8 place-items-center rounded-lg text-[#5e787e] disabled:opacity-40"><ChevronLeft className="size-4" /></button>
                {pageItems(safe, pages).map((n, i) => n === '\u2026'
                  ? <span key={`e${i}`} className="px-1 text-[12px] text-[#8aa0a4]">…</span>
                  : (
                    <button key={n} type="button" onClick={() => setPage(n)} className={`grid h-8 min-w-8 place-items-center rounded-lg px-1.5 text-[12.5px] font-semibold ${n === safe ? 'text-white' : 'text-[#3e5a62] hover:bg-[#f4fbfa]'}`} style={n === safe ? { background: TEAL } : undefined}>{n}</button>
                  ))}
                <button type="button" aria-label="Keyingi" disabled={safe >= pages} onClick={() => setPage(safe + 1)} className="grid size-8 place-items-center rounded-lg text-[#5e787e] disabled:opacity-40"><ChevronRight className="size-4" /></button>
              </div>
            </div>
          )}
        </section>

        {person && (
          <aside className="rounded-2xl border border-[#e6f1ef] bg-white p-2.5 shadow-[0_1px_2px_rgb(16_40_40/0.04)]">
            <div className="flex items-center gap-2">
              <img src={faceOf(person)} alt="" className="size-10 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-bold leading-tight">{person.name}</p>
                <p className="truncate text-[11.5px] text-[#8aa0a4]">{person.clinic}</p>
              </div>
              <button type="button" aria-label="Yopish" onClick={() => setPanel(false)} className="grid size-7 place-items-center rounded-lg text-[#8aa4a8] hover:bg-[#f4fbfa]"><X className="size-4" /></button>
            </div>
            <div className="mt-2 flex items-center gap-1">
              {[
                ['info', 'Ma’lumotlar'],
                ['pay', 'To‘lovlar'],
                ['cert', 'Sertifikat'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`h-7 rounded-full px-2.5 text-[12px] font-semibold ${tab === id ? 'text-white' : 'text-[#5e787e] hover:bg-[#f4fbfa]'}`}
                  style={tab === id ? { background: TEAL } : undefined}
                >
                  {label}
                </button>
              ))}
            </div>
            {tab === 'info' && (
              <dl className="mt-1.5 space-y-0.5">
                {[
                  [Phone, 'Telefon', person.phone],
                  [Mail, 'Email', person.email],
                  [MapPin, 'Shahar', person.city],
                  [Building2, 'Klinika', person.clinic],
                  [UserRound, 'Lavozim', person.role || 'Stomatolog'],
                  [Ticket, 'Chipta turi', person.ticket],
                  [Calendar, 'Ro‘yxatdan o‘tgan', person.registered],
                ].map(([Icon, k, v]) => (
                  <div key={k} className="flex items-center gap-1.5 text-[12px]">
                    <Icon className="size-3.5 shrink-0 text-[var(--color-org-teal)]" strokeWidth={1.8} />
                    <dt className="text-[#7e9398]">{k}</dt>
                    <dd className="ml-auto truncate pl-2 text-right font-medium text-[#143044]">{v}</dd>
                  </div>
                ))}
                <div className="flex items-center gap-1.5 text-[12px]">
                  <CreditCard className="size-3.5 shrink-0 text-[var(--color-org-teal)]" strokeWidth={1.8} />
                  <dt className="text-[#7e9398]">To‘lov holati</dt>
                  <dd className="ml-auto"><Pill className={PAY_CLS[person.pay]} dot>{PAY_LABEL[person.pay]}</Pill></dd>
                </div>
              </dl>
            )}
            {tab === 'pay' && (
              <div className="mt-3 rounded-xl bg-[#f6fbfa] p-3 text-[12.5px]">
                <p className="text-[#7e9398]">Chipta</p>
                <p className="font-bold">{person.ticket}</p>
                <p className="mt-2 text-[#7e9398]">Holat</p>
                <p className="font-semibold">{PAY_LABEL[person.pay]}</p>
                <Link to="/tashkilotchi/tolovlar" className="mt-2 inline-block text-[12.5px] font-semibold text-[var(--color-org-teal)]">To‘lovlarga o‘tish</Link>
              </div>
            )}
            {tab === 'cert' && (
              <div className="mt-3 text-[12.5px]">
                {person.pay === 'paid'
                  ? <p>Sertifikat tayyor. Raqam: STH-2026-{String(person.id).padStart(4, '0')}</p>
                  : <p className="text-[#7e9398]">Sertifikat hali berilmagan.</p>}
                <Link to="/tashkilotchi/sertifikatlar" className="mt-2 inline-flex h-8 items-center rounded-lg border border-[#d5ebe6] px-2.5 text-[12px] font-semibold text-[var(--color-org-teal)]">Sertifikatlarga o‘tish</Link>
              </div>
            )}
            <div className="mt-2 flex flex-col items-center rounded-xl bg-[#f7fbfa] px-2 py-1.5">
              <QrMark size={78} seed={person.id} />
              <p className="mt-1 text-[12px] font-semibold leading-tight">Ishtirokchi QR-kodi</p>
              <p className="text-[10.5px] leading-tight text-[#8aa0a4]">Kirish paytida skanerlang</p>
            </div>
            {person.arrived && <p className="mt-2 text-center text-[12px] font-semibold text-[#16a34a]">Keldi</p>}
            <button type="button" onClick={() => { checkIn(person.id); notify(`${person.name} — Keldi`) }} className="mt-2 flex h-8 w-full items-center justify-center gap-1.5 rounded-xl text-[12.5px] font-semibold text-white" style={{ background: TEAL }}>
              <Check className="size-4" strokeWidth={2.6} /> {person.arrived ? 'Qayta belgilash' : 'QR check-in qilish'}
            </button>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              <Link to="/tashkilotchi/sertifikatlar" className="inline-flex h-9 items-center justify-center rounded-xl border border-[#d7ebe6] text-[12px] font-semibold text-[#1c4a5a]">Sertifikat berish</Link>
              <button type="button" onClick={() => setMail(true)} className="inline-flex h-9 items-center justify-center rounded-xl border border-[#d7ebe6] text-[12px] font-semibold text-[#1c4a5a]">Email yuborish</button>
            </div>
          </aside>
        )}
      </div>

      <AddModal open={add} onClose={() => setAdd(false)} onSave={(row) => {
        const person = addParticipant({ ...row, seminarId: allMode ? (newestSeminar(SEMINARS)?.id || '') : seminar })
        setSelected(person.id)
        setPanel(true)
        setPagerFree(true)
        setAdd(false)
        notify('Ishtirokchi qo‘shildi')
      }} />
      <Modal open={mail} title="Email yuborish" onClose={() => setMail(false)}>
        <MailForm onClose={() => setMail(false)} onSend={() => { setMail(false); notify('Email yuborildi') }} to={person?.email} />
      </Modal>
    </div>
  )
}

function QrMark({ size = 96, seed = 1 }) {
  const n = 25
  const cells = []
  const on = (x, y) => {
    const finder = (fx, fy) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7
    if (finder(0, 0) || finder(n - 7, 0) || finder(0, n - 7)) {
      const lx = x < 8 ? x : x >= n - 7 ? x - (n - 7) : x
      const ly = y < 8 ? y : y >= n - 7 ? y - (n - 7) : y
      const edge = lx === 0 || ly === 0 || lx === 6 || ly === 6
      const core = lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4
      return edge || core
    }
    return ((x * 17 + y * 13 + seed * 31) % 7) > 2
  }
  for (let y = 0; y < n; y += 1) for (let x = 0; x < n; x += 1) if (on(x, y)) cells.push(`${x},${y}`)
  return (
    <svg viewBox={`0 0 ${n} ${n}`} width={size} height={size} className="rounded bg-white" aria-hidden>
      <rect width={n} height={n} fill="#fff" />
      {cells.map((k) => {
        const [x, y] = k.split(',')
        return <rect key={k} x={x} y={y} width="1" height="1" fill="#143044" />
      })}
    </svg>
  )
}

function Phone(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6.5 3.5h3l1.2 3-2 1.2a12 12 0 0 0 5.6 5.6l1.2-2 3 1.2v3A2 2 0 0 1 16.6 17 14.5 14.5 0 0 1 5 5.4a2 2 0 0 1 1.5-1.9Z" />
    </svg>
  )
}

function AddModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', ticket: 'Standart', city: 'Toshkent' })
  const [errors, setErrors] = useState({})
  const save = () => {
    const e = {}
    if (form.name.trim().length < 3) e.name = 'Ism-familiyani kiriting'
    if (!/^\+998\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/.test(form.phone.trim())) e.phone = 'Telefon +998 formatida bo‘lsin'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email noto‘g‘ri'
    setErrors(e)
    if (Object.keys(e).length) return
    onSave({
      id: Date.now(),
      ...form,
      clinic: 'Yangi klinika',
      pay: 'wait',
      registered: 'Bugun',
      role: 'Stomatolog',
      avatar: '/images/seller-2.jpg',
    })
    setForm({ name: '', phone: '', email: '', ticket: 'Standart', city: 'Toshkent' })
    setErrors({})
  }
  return (
    <Modal open={open} title="Ishtirokchi qo‘shish" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Ism-familiya" req error={errors.name}><input className={inputCls(errors.name)} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Aliyeva Mohira" /></Field>
        <Field label="Telefon" req error={errors.phone}><input className={inputCls(errors.phone)} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+998 90 123 45 67" /></Field>
        <Field label="Email" req error={errors.email}><input className={inputCls(errors.email)} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="m.aliyeva@mail.uz" /></Field>
        <Field label="Chipta turi">
          <select className={inputCls()} value={form.ticket} onChange={(e) => setForm({ ...form, ticket: e.target.value })}>
            <option>Standart</option><option>VIP</option><option>Student</option><option>Guruh</option>
          </select>
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Btn kind="soft" onClick={onClose}>Bekor qilish</Btn>
          <Btn onClick={save}>Saqlash</Btn>
        </div>
      </div>
    </Modal>
  )
}

function MailForm({ onClose, onSend, to }) {
  const [text, setText] = useState('Assalomu alaykum! Seminarga yozilganingiz uchun rahmat.')
  const [bad, setBad] = useState(false)
  return (
    <div className="space-y-3">
      <Field label="Qabul qiluvchi"><input className={inputCls()} defaultValue={to || ''} /></Field>
      <Field label="Xabar" error={bad ? 'Xabar bo‘sh bo‘lmasin' : ''}><textarea className={`${inputCls()} h-24 py-2`} value={text} onChange={(e) => setText(e.target.value)} /></Field>
      <div className="flex justify-end gap-2">
        <Btn kind="soft" onClick={onClose}>Bekor qilish</Btn>
        <Btn onClick={() => { if (!text.trim()) { setBad(true); return } onSend() }}>Yuborish</Btn>
      </div>
    </div>
  )
}

const M_PAY = { paid: 'To‘langan', wait: 'Kutilmoqda', cancel: 'Bekor qilingan' }

const TINTS = [
  ['#e5f6f3', '#0d8a84'],
  ['#f1e9ff', '#7c3aed'],
  ['#e7f0ff', '#2563eb'],
  ['#fff3e0', '#e08a00'],
  ['#eef1f4', '#64748b'],
  ['#e7f8ef', '#16a34a'],
]

function MobileParticipants() {
  const { notify } = useOrg()
  const hub = useHub()
  const [tab, setTab] = useState('people')
  const [chip, setChip] = useState('all')
  const [sheet, setSheet] = useState(null)
  const [seminar, setSeminar] = useState('all')
  const head = seminar === 'all' ? newestSeminar(hub.seminars) : (hub.seminars.find((s) => s.id === seminar) || newestSeminar(hub.seminars))
  const seats = seminar === 'all' ? hub.seminars.reduce((n, s) => n + (Number(s.seats) || 0), 0) : (head?.seats || 0)

  const people = useMemo(() => {
    const rows = seminar === 'all' ? hub.participants : hub.participants.filter((p) => p.seminarId === seminar)
    return rows.map((p, i) => ({
      id: p.id,
      initials: String(p.name || '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?',
      name: p.name,
      phone: p.phone,
      ticket: p.ticket,
      pay: p.pay === 'wait' || p.pay === 'cancel' ? p.pay : 'paid',
      tint: TINTS[i % TINTS.length],
    }))
  }, [hub.participants, seminar])

  const counts = useMemo(() => ({
    all: people.length,
    paid: people.filter((p) => p.pay === 'paid').length,
    wait: people.filter((p) => p.pay === 'wait').length,
    cancel: people.filter((p) => p.pay === 'cancel').length,
  }), [people])

  const list = useMemo(() => people.filter((p) => {
    if (chip === 'paid' && p.pay !== 'paid') return false
    if (chip === 'wait' && p.pay !== 'wait') return false
    if (chip === 'cancel' && p.pay !== 'cancel') return false
    return true
  }), [people, chip])

  const chips = [
    ['all', 'Hammasi', counts.all],
    ['paid', 'To‘langan', counts.paid],
    ['wait', 'Kutilmoqda', counts.wait],
    ['cancel', 'Bekor qilingan', counts.cancel],
  ]

  return (
    <div className="bg-white text-[#143044]">
      <div className="flex gap-2.5 pb-2">
        <img src={head?.image || '/images/seminars/teeth.jpg'} alt="" className="size-16 shrink-0 rounded-xl object-cover" />
        <div className="min-w-0">
          <select value={seminar} onChange={(e) => setSeminar(e.target.value)} className="max-w-full bg-transparent text-[10.5px] font-semibold text-[var(--color-org-teal)]" aria-label="Seminar">
            <option value="all">Barcha seminarlar</option>
            {hub.seminars.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
          <p className="mt-0.5 text-[14.5px] font-bold leading-tight">{seminar === 'all' ? 'Barcha seminarlar' : head?.title}</p>
          <p className="mt-1 flex items-center gap-1 text-[11px] text-[#5e787e]"><Calendar className="size-3.5 shrink-0 text-[var(--color-org-teal)]" /> {seminar === 'all' ? `${hub.seminars.length} ta seminar` : `${head?.date || ''}${head?.startTime ? `, ${head.startTime}` : ''}`}</p>
          <p className="flex items-center gap-1 text-[11px] text-[#5e787e]"><MapPin className="size-3.5 shrink-0 text-[var(--color-org-teal)]" /> {seminar === 'all' ? 'Barcha shaharlar' : (head?.place || head?.city)}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 border-b border-[#e8f1f0] bg-white">
        {[
          ['umumiy', 'Umumiy', House],
          ['people', 'Ishtirokchilar', Users],
          ['tickets', 'Chiptalar', Ticket],
          ['check', 'Check-in', QrCode],
        ].map(([id, label, Icon]) => {
          const on = tab === id
          return (
            <button key={id} type="button" onClick={() => setTab(id)} className={`flex flex-col items-center gap-0.5 py-1.5 text-[11px] ${on ? 'font-semibold text-[var(--color-org-teal)]' : 'font-medium text-[#8aa0a4]'}`}>
              <Icon className="size-[18px]" strokeWidth={on ? 2.2 : 1.7} />
              {label}
            </button>
          )
        })}
      </div>

      <div className="pb-2">
        {tab === 'people' && (
          <>
            <div className="flex items-center justify-between px-3 pb-1.5 pt-2">
              <h2 className="text-[15px] font-bold">Ishtirokchilar ro‘yxati</h2>
              <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--color-org-teal)]">
                <Users className="size-4" /> {people.length} / {seats || people.length}
              </span>
            </div>
            <div className="flex items-center justify-end px-3">
              <button type="button" aria-label="Filtr" onClick={() => setChip(chip === 'all' ? 'paid' : 'all')} className="grid size-9 shrink-0 place-items-center rounded-xl border border-[#e6eeec] text-org-teal">
                <SlidersHorizontal className="size-4" />
              </button>
            </div>
            <div className="no-scrollbar mt-1.5 flex gap-1.5 overflow-x-auto px-3">
              {chips.map(([id, label, n]) => {
                const on = chip === id
                const soft = !on && id === 'paid'
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setChip(id)}
                    className={`h-7 shrink-0 rounded-full px-2.5 text-[12px] font-semibold ${on ? 'text-white' : soft ? 'bg-[#e7f6f3] text-[var(--color-org-teal)]' : 'border border-[#e6eeec] bg-white text-[#5e787e]'}`}
                    style={on ? { background: TEAL } : undefined}
                  >
                    {label} ({n})
                  </button>
                )
              })}
            </div>
            <div className="mt-2.5 px-1.5">
              <div className="grid grid-cols-[22px_minmax(0,1.15fr)_minmax(0,1fr)_58px_78px_14px] items-center gap-1 rounded-lg bg-[#f4f8f8] px-1.5 py-2 text-[10px] font-medium text-[#8aa0a4]">
                <span>#</span>
                <span>Ism familiya</span>
                <span>Telefon raqam</span>
                <span>Chipta turi</span>
                <span>To‘lov holati</span>
                <span />
              </div>
              {list.length === 0 && <p className="py-8 text-center text-[13px] text-[#7e9398]">Ishtirokchi topilmadi</p>}
              <ul className="mt-1">
                {list.map((p, i) => (
                  <li key={p.id}>
                    <button type="button" onClick={() => setSheet(p)} className="grid w-full grid-cols-[22px_minmax(0,1.15fr)_minmax(0,1fr)_58px_78px_14px] items-center gap-1 border-b border-[#f2f6f6] px-1.5 py-[6px] text-left">
                      <span className="text-[11px] text-[#8aa0a4]">{i + 1}</span>
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="grid size-6 shrink-0 place-items-center rounded-full text-[8.5px] font-bold" style={{ background: p.tint[0], color: p.tint[1] }}>{p.initials}</span>
                        <span className="truncate text-[11.5px] font-semibold text-[#143044]">{p.name}</span>
                      </span>
                      <span className="truncate text-[10.5px] text-[#3e5a62]">{p.phone}</span>
                      <span className={`truncate text-[11px] font-semibold ${p.ticket === 'VIP' ? 'text-[#7c3aed]' : 'text-[#5e787e]'}`}>{p.ticket}</span>
                      <span className={`inline-flex h-[18px] w-fit items-center rounded-full px-1.5 text-[10px] font-semibold ${p.pay === 'paid' ? 'bg-[#e7f8ef] text-[#16a34a]' : p.pay === 'wait' ? 'bg-[#eef1f3] text-[#64748b]' : 'bg-[#fde8ee] text-[#e11d48]'}`}>{M_PAY[p.pay]}</span>
                      <ChevronRight className="size-3.5 text-[#c5d0d4]" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
        {tab === 'umumiy' && (
          <div className="space-y-2 px-3 py-3 text-[13px]">
            <p className="font-bold">{seminar === 'all' ? 'Barcha seminarlar' : head?.title}</p>
            <p className="text-[#5e787e]">{seminar === 'all' ? `${hub.seminars.length} ta seminar` : head?.date}</p>
            <p className="text-[#5e787e]">{seminar === 'all' ? 'Barcha shaharlar' : (head?.place || head?.city)}</p>
            <p className="rounded-xl bg-[#f4fbfa] p-3 text-[12.5px] text-[#3e5a62]">Ro‘yxatdan o‘tganlar: {people.length} / {seats || people.length}. To‘langan: {counts.paid}. Kutilmoqda: {counts.wait}.</p>
          </div>
        )}
        {tab === 'tickets' && (
          <ul className="space-y-2 px-3 py-3">
            {[['Standart', '1 200 000 so‘m'], ['VIP', '2 500 000 so‘m'], ['Student', '800 000 so‘m']].map(([n, p]) => (
              <li key={n} className="flex items-center justify-between rounded-xl border border-[#e6f1ef] px-3 py-2.5 text-[13px]">
                <span className="font-semibold">{n}</span><span className="text-[var(--color-org-teal)]">{p}</span>
              </li>
            ))}
          </ul>
        )}
        {tab === 'check' && (
          <div className="px-3 py-6 text-center">
            <QrCode className="mx-auto size-10 text-[var(--color-org-teal)]" />
            <p className="mt-2 text-[13px] text-[#5e787e]">QR kodni skanerlang va kirishni tasdiqlang.</p>
            <Link to="/tashkilotchi/qr" className="mt-3 inline-flex h-10 items-center rounded-xl px-4 text-[13px] font-semibold text-white" style={{ background: TEAL }}>Check-in ochish</Link>
          </div>
        )}
      </div>

      {sheet && (
        <div className="fixed inset-0 z-[60] flex items-end bg-[#0e2433]/40" onClick={() => setSheet(null)}>
          <div className="w-full rounded-t-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center gap-2">
              <span className="grid size-10 place-items-center rounded-full text-[12px] font-bold" style={{ background: sheet.tint[0], color: sheet.tint[1] }}>{sheet.initials}</span>
              <div className="min-w-0 flex-1">
                <p className="font-bold">{sheet.name}</p>
                <p className="text-[12px] text-[#7e9398]">{sheet.phone}</p>
              </div>
              <button type="button" aria-label="Yopish" onClick={() => setSheet(null)} className="grid size-8 place-items-center"><X className="size-4" /></button>
            </div>
            <p className="text-[13px]">Chipta: <b>{sheet.ticket}</b></p>
            <p className="mt-1 text-[13px]">To‘lov: <b>{M_PAY[sheet.pay]}</b></p>
            <button type="button" onClick={() => { const hit = hub.participants.find((p) => p.name === sheet.name); if (hit) checkIn(hit.id); else { const person = addParticipant({ name: sheet.name, phone: sheet.phone || '', seminarId: hub.seminars[0]?.id, ticket: 'Standart', pay: 'paid', clinic: '—', email: '', city: 'Toshkent', role: 'Stomatolog' }); checkIn(person.id) } notify(`${sheet.name} — Keldi`); setSheet(null) }} className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl text-[13px] font-semibold text-white" style={{ background: TEAL }}>
              <Check className="size-4" /> QR check-in qilish
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
