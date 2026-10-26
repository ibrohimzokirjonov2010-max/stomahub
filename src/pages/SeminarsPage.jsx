import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  LayoutGrid, Crosshair, Microscope, Smile, Sparkles, Activity, Scissors, Ellipsis, ChevronDown, ChevronLeft, ChevronRight,
  Plus, MapPin, Clock, Users, Heart, CalendarDays, Award, Handshake, BadgeCheck, X,
} from 'lucide-react'
import { seminarChips, mySeminars, whyAttend } from '../seminarsData'
import { publicRecords, useHub } from '../hubStore'
import { som } from '../marketData'

const UZ = ['', 'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']
const monthLabel = (key) => {
  const [y, m] = String(key || '').split('-')
  return `${UZ[Number(m)] || m} ${y}`
}
const dateKeyOf = (s) => `${s.monthKey}-${String(s.day).padStart(2, '0')}`

const chipIcons = { all: LayoutGrid, impl: Crosshair, endo: Microscope, orto: Smile, estet: Sparkles, paro: Activity, surg: Scissors, other: Ellipsis }
const whyIcons = [Award, Handshake, BadgeCheck, Users]

const formats = ['Offline', 'Online', 'Offline + jonli efir']
const sorts = {
  near: { label: 'Sana bo‘yicha (eng yaqin)', fn: (a, b) => a.monthKey.localeCompare(b.monthKey) || Number(a.day) - Number(b.day) },
  far: { label: 'Sana bo‘yicha (uzoq)', fn: (a, b) => b.monthKey.localeCompare(a.monthKey) || Number(b.day) - Number(a.day) },
  cheap: { label: 'Arzonroq', fn: (a, b) => a.price - b.price },
  expensive: { label: 'Qimmatroq', fn: (a, b) => b.price - a.price },
}

export default function SeminarsPage() {
  const hub = useHub()
  const seminars = publicRecords(hub)
  const [cat, setCat] = useState('all')
  const [format, setFormat] = useState('')
  const [band, setBand] = useState('')
  const [month, setMonth] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [sort, setSort] = useState('near')
  const [liked, setLiked] = useState({})
  const [ask, setAsk] = useState(false)
  const [sent, setSent] = useState(false)
  const [onlyMine, setOnlyMine] = useState(false)

  const monthOptions = useMemo(() => {
    const keys = [...new Set(seminars.map((s) => s.monthKey))].sort()
    return keys.map((key) => [key, monthLabel(key)])
  }, [seminars])

  const list = useMemo(() => {
    return seminars
      .filter((s) => cat === 'all' || s.cat === cat)
      .filter((s) => !format || s.format === format)
      .filter((s) => !month || s.monthKey === month)
      .filter((s) => !onlyMine || s.mine)
      .filter((s) => band !== 'low' || s.price <= 1000000)
      .filter((s) => band !== 'high' || s.price > 1000000)
      .filter((s) => {
        const key = dateKeyOf(s)
        if (from && key < from) return false
        if (to && key > to) return false
        return true
      })
      .slice()
      .sort(sorts[sort].fn)
  }, [seminars, cat, format, band, month, sort, onlyMine, from, to])

  const groups = useMemo(() => {
    const keys = [...new Set(list.map((s) => s.monthKey))].sort()
    return keys.map((key) => ({ key, label: monthLabel(key) }))
  }, [list])

  return (
    <div className="grid gap-4 pb-8 pt-3 xl:grid-cols-[minmax(0,1fr)_262px]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[24px] font-extrabold tracking-tight text-ink">Seminarlar</h1>
            <p className="mt-0.5 text-[12px] text-ink-2">Bilimingizni oshiring, tajribali mutaxassislardan o‘rganing</p>
          </div>
          <button onClick={() => { setAsk(true); setSent(false) }} className="flex h-[34px] items-center gap-1.5 rounded-full bg-sea px-4 text-[12px] font-semibold text-white shadow-[0_6px_16px_-6px_rgb(11_138_149/0.7)] transition hover:bg-sea-600">
            <Plus className="size-4" strokeWidth={2.4} /> Seminar qo‘shish
          </button>
        </div>

        <div className="-mx-4 mt-3.5 flex gap-1.5 overflow-x-auto px-4 pb-1 no-scrollbar lg:mx-0 lg:px-0">
          {seminarChips.map(({ key, label }) => {
            const Icon = chipIcons[key]
            const on = cat === key
            return (
              <button key={key} onClick={() => setCat(key)} className={`flex h-[31px] shrink-0 items-center gap-1.5 rounded-lg px-3 text-[10.5px] font-medium shadow-card transition ${on ? 'bg-sea text-white' : 'bg-white text-ink hover:text-sea'}`}>
                <Icon className="size-3.5" strokeWidth={1.8} /> {label}
              </button>
            )
          })}
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.3fr_1.15fr]">
          <Select label="Format" value={format} onChange={setFormat} options={formats} />
          <Select label="Sana oralig‘i" value={month} onChange={setMonth} options={monthOptions} />
          <Select label="Narx" value={band} onChange={setBand} options={[['low', '1 000 000 gacha'], ['high', '1 000 000 dan yuqori']]} />
          <div className="flex h-[42px] items-center gap-2 rounded-lg bg-white px-3 shadow-card">
            <CalendarDays className="size-4 shrink-0 text-ink-2" />
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full bg-transparent text-[10px] text-ink outline-none" aria-label="Boshlanish" />
            <span className="text-muted">—</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full bg-transparent text-[10px] text-ink outline-none" aria-label="Tugash" />
          </div>
          <Select label="Saralash" value={sort} onChange={setSort} options={Object.entries(sorts).map(([k, v]) => [k, v.label])} noAll />
        </div>

        <div className="mt-4 flex flex-col gap-5">
          {groups.map((m) => {
            const rows = list.filter((s) => s.monthKey === m.key)
            if (!rows.length) return null
            return (
              <section key={m.key}>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-[14px] font-bold text-ink">{m.label} <span className="ml-1 text-[11px] font-medium text-muted">{rows.length} ta seminar</span></h2>
                  <button onClick={() => { setCat('all'); setFormat(''); setBand(''); setMonth(''); setFrom(''); setTo(''); setOnlyMine(false) }} className="text-[10px] font-medium text-sea hover:underline">Barchasini ko‘rish</button>
                </div>
                <div className="flex flex-col gap-2">
                  {rows.map((s) => <SeminarRow key={s.id} item={s} liked={!!liked[s.id]} onLike={() => setLiked((v) => ({ ...v, [s.id]: !v[s.id] }))} />)}
                </div>
              </section>
            )
          })}
          {!list.length && <div className="grid h-[160px] place-items-center rounded-xl bg-white text-[12px] text-muted shadow-card">Bu filtr bo‘yicha seminar topilmadi</div>}
        </div>
      </div>

      <aside className="flex flex-col gap-3">
        <Calendar />
        <div className="rounded-xl bg-white p-3 shadow-card">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[12px] font-bold text-ink">Mening seminarlarim</h3>
            <button onClick={() => setOnlyMine(true)} className="text-[9.5px] font-medium text-sea hover:underline">Barchasini ko‘rish</button>
          </div>
          <div className="flex flex-col gap-2">
            {mySeminars.map((s) => (
              <Link key={s.id} to={`/seminarlar/${s.id}`} className="flex items-center gap-2 rounded-lg p-1 hover:bg-page">
                <span className="grid h-[36px] w-[34px] shrink-0 place-items-center rounded-md bg-sea-50 text-center leading-none">
                  <span className="text-[12px] font-extrabold text-sea-600">{s.day}</span>
                  <span className="text-[8px] font-semibold text-sea">{s.mon}</span>
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[10.5px] font-semibold text-ink">{s.title}</span>
                  <span className="block truncate text-[9px] text-muted">{s.city}, {s.place}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-card">
          <h3 className="text-[12px] font-bold text-ink">Nega seminarlarga qatnashish kerak?</h3>
          <ul className="mt-2.5 space-y-2.5">
            {whyAttend.map((w, i) => {
              const Icon = whyIcons[i]
              return (
                <li key={w.title} className="flex items-center gap-2.5">
                  <span className="grid size-[28px] shrink-0 place-items-center rounded-lg bg-sea-50 text-sea"><Icon className="size-3.5" /></span>
                  <span>
                    <span className="block text-[10.5px] font-semibold text-ink">{w.title}</span>
                    <span className="block text-[9px] text-muted">{w.text}</span>
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      </aside>

      {ask && <AskModal sent={sent} onClose={() => setAsk(false)} onSend={() => setSent(true)} />}
    </div>
  )
}

function SeminarRow({ item: s, liked, onLike }) {
  return (
    <article className="grid items-center gap-2.5 rounded-xl bg-white p-2.5 shadow-card max-lg:grid-cols-1" style={{ gridTemplateColumns: '52px 104px minmax(0,1.3fr) 132px 92px 148px' }}>
      <Link to={`/seminarlar/${s.id}`} className="grid place-items-center text-center leading-none">
        <span className="text-[18px] font-extrabold text-ink">{s.day}</span>
        <span className="mt-0.5 text-[10px] font-bold text-ink-2">{s.mon}</span>
        <span className="mt-1 text-[9px] text-muted">{s.weekday}</span>
      </Link>
      <Link to={`/seminarlar/${s.id}`} className="overflow-hidden rounded-lg bg-[#eef3f8]" style={{ height: 68 }}>
        <img src={s.image} alt="" className="size-full object-cover" />
      </Link>
      <div className="min-w-0">
        <Link to={`/seminarlar/${s.id}`} className="inline-flex rounded-md bg-sea-50 px-1.5 py-0.5 text-[9px] font-semibold text-sea-600">{seminarChips.find((c) => c.key === s.cat)?.label}</Link>
        <Link to={`/seminarlar/${s.id}`} className="mt-0.5 block text-[12px] font-bold leading-snug text-ink hover:text-sea">{s.title}{s.cancelled ? <span className="ml-1 rounded bg-[#fde8e8] px-1 text-[9px] font-bold text-[#dc2626]">Bekor qilingan</span> : null}</Link>
        <p className="truncate text-[10px] text-muted">{s.text}</p>
        <p className="mt-1 flex items-center gap-2 truncate text-[9px] text-ink-2">
          <span className="flex items-center gap-1"><MapPin className="size-3 shrink-0 text-muted" />{s.city}</span>
          <span className="flex items-center gap-1"><Clock className="size-3 shrink-0 text-muted" />{s.time}</span>
          <span className="flex items-center gap-1"><Users className="size-3 shrink-0 text-muted" />{s.hours}</span>
        </p>
      </div>
      <div className="flex min-w-0 items-center gap-1.5">
        <img src={s.speaker.avatar} alt="" className="size-7 shrink-0 rounded-full object-cover" />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[10px] font-semibold text-ink">{s.speaker.name}</p>
          <p className="truncate text-[9px] text-muted">{s.speaker.role}</p>
        </div>
      </div>
      <div className="text-right leading-tight">
        <span className="rounded-md bg-sea-50 px-1.5 py-0.5 text-[9px] font-semibold text-sea-600">CME {s.cme} ball</span>
        <p className="mt-1 text-[10px] font-medium text-[#e08a2e]">{s.left}/{s.seats} joy qoldi</p>
      </div>
      <div className="text-right">
        <div className="flex items-center justify-end gap-1">
          <p className="whitespace-nowrap text-[13px] font-extrabold text-ink">{som(s.price)}</p>
          <button onClick={onLike} aria-label="Saqlash" className="grid size-6 place-items-center rounded-full text-ink-2 hover:bg-page">
            <Heart className={`size-3.5 ${liked ? 'fill-sale text-sale' : ''}`} />
          </button>
        </div>
        {s.cancelled
          ? <span className="mt-1 inline-flex h-[28px] items-center rounded-lg bg-[#fde8e8] px-2.5 text-[10.5px] font-semibold text-[#dc2626]">Bekor qilingan</span>
          : <Link to={`/seminarlar/${s.id}/royxat`} className="mt-1 inline-flex h-[28px] items-center rounded-lg bg-sea px-2.5 text-[10.5px] font-semibold text-white transition hover:bg-sea-600">Ro‘yxatdan o‘tish</Link>}
      </div>
    </article>
  )
}

function Select({ label, value, onChange, options, noAll }) {
  const opts = options.map((o) => (Array.isArray(o) ? o : [o, o]))
  const current = opts.find(([v]) => v === value)?.[1] ?? 'Barchasi'
  return (
    <label className="relative flex h-[42px] cursor-pointer items-center gap-2 rounded-lg bg-white px-3 shadow-card">
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block text-[8.5px] text-muted">{label}</span>
        <span className="block truncate text-[10.5px] font-medium text-ink">{current}</span>
      </span>
      <ChevronDown className="size-3.5 text-ink-2" />
      <select value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0">
        {!noAll && <option value="">Barchasi</option>}
        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  )
}

function Calendar() {
  const [cursor, setCursor] = useState({ y: 2026, m: 9 })
  const names = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']
  const marks = { '2026-9': [24, 28, 30, 31], '2026-10': [2, 15, 28] }
  const key = `${cursor.y}-${cursor.m}`
  const first = new Date(cursor.y, cursor.m, 1)
  const pad = (first.getDay() + 6) % 7
  const count = new Date(cursor.y, cursor.m + 1, 0).getDate()
  const cells = [...Array(pad).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)]
  const shift = (dir) => setCursor((c) => {
    const d = new Date(c.y, c.m + dir, 1)
    return { y: d.getFullYear(), m: d.getMonth() }
  })
  return (
    <div className="rounded-xl bg-white p-3 shadow-card">
      <div className="mb-2 flex items-center justify-between">
        <button onClick={() => shift(-1)} aria-label="Oldingi oy" className="grid size-6 place-items-center rounded-md text-ink-2 hover:bg-page"><ChevronLeft className="size-4" /></button>
        <p className="text-[12px] font-bold text-ink">{names[cursor.m]} {cursor.y}</p>
        <button onClick={() => shift(1)} aria-label="Keyingi oy" className="grid size-6 place-items-center rounded-md text-ink-2 hover:bg-page"><ChevronRight className="size-4" /></button>
      </div>
      <div className="grid grid-cols-7 text-center text-[9px] text-muted">
        {['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'].map((d) => <span key={d} className="py-1">{d}</span>)}
      </div>
      <div className="grid grid-cols-7 text-center text-[11px]">
        {cells.map((d, i) => {
          const today = cursor.y === 2026 && cursor.m === 9 && d === 24
          const mark = d && (marks[key] || []).includes(d)
          return (
            <span key={i} className="grid h-7 place-items-center">
              {d && (
                <span className={`relative grid size-6 place-items-center rounded-full ${today ? 'bg-sea font-bold text-white' : mark ? 'font-semibold text-sea' : 'text-ink-2'}`}>
                  {d}
                  {mark && !today && <span className="absolute bottom-0.5 size-1 rounded-full bg-sea" />}
                </span>
              )}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function AskModal({ sent, onClose, onSend }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); onSend() }} className="w-full max-w-[420px] rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between">
          <h3 className="text-[16px] font-bold text-ink">Seminar qo‘shish</h3>
          <button type="button" onClick={onClose} aria-label="Yopish" className="grid size-7 place-items-center rounded-lg text-muted hover:bg-page"><X className="size-4" /></button>
        </div>
        {sent ? (
          <p className="py-8 text-center text-[13px] text-ink-2">So‘rovingiz qabul qilindi. Moderator ko‘rib chiqadi.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {['Mavzu', 'Shahar', 'Joy', 'Sana'].map((l) => (
              <label key={l} className="text-[10px] text-muted">{l}
                <input required className="mt-1 h-9 w-full rounded-lg bg-page px-3 text-[12px] text-ink outline-none ring-1 ring-transparent focus:ring-sea" />
              </label>
            ))}
            <button className="mt-2 h-10 rounded-lg bg-sea text-[13px] font-semibold text-white hover:bg-sea-600">Yuborish</button>
          </div>
        )}
      </form>
    </div>
  )
}
