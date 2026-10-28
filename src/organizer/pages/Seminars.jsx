import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Award, Calendar, CalendarDays, ChevronDown, ChevronRight, LayoutGrid, List,
  MapPin, MoreVertical, Plus, Search, User, Users, Wallet,
} from 'lucide-react'
import { som } from '../data'
import { useOrg } from '../Shell'
import { moneyOf, useHub } from '../../hubStore'

const BRAND = 'var(--color-org-teal)'
const INK = '#10182a'
const MUTED = '#8d93a3'
const GREEN = '#16924e'

const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']

const PHOTO = {
  bolalar: '/images/channels/kids.jpg',
  estetik: '/images/seminars/smile.jpg',
  ortodont: '/images/seminars/aligner.jpg',
}

const photoOf = (s) => PHOTO[s.id] || s.image

function monthOf(date) {
  const s = date.toLowerCase()
  return MONTHS.findIndex((m) => s.includes(m))
}

const TABS = [
  { id: 'all', label: 'Barchasi' },
  { id: 'rejalashtirilgan', label: 'Rejalashtirilgan' },
  { id: 'jarayonda', label: 'Jarayonda' },
  { id: 'yakunlangan', label: 'Yakunlangan' },
  { id: 'bekor', label: 'Bekor qilingan' },
]

const MOBILE = []

const MSTATUS = {
  faol: { label: 'Faol', dot: '#22a34a', text: '#1a9a48' },
  qoralama: { label: 'Qoralama', dot: '#b0b7c3', text: '#98a0ae' },
  otgan: { label: 'O‘tgan', dot: '#b0b7c3', text: '#98a0ae' },
  bekor: { label: 'Bekor qilingan', dot: '#e11d48', text: '#e11d48' },
  yashirin: { label: 'Yashirin', dot: '#e8a317', text: '#b7791f' },
}

export default function Seminars() {
  return (
    <>
      <Desktop />
      <Mobile />
    </>
  )
}

function Desktop() {
  const { query, city: headerCity, cityOn } = useOrg()
  const hub = useHub()
  const totals = moneyOf(hub)
  const SEMINARS = hub.seminars
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [span, setSpan] = useState('all')
  const [city, setCity] = useState('all')
  const [sort, setSort] = useState('new')
  const [view, setView] = useState('list')

  const rows = useMemo(() => {
    const s = `${query} ${q}`.trim().toLowerCase()
    let list = SEMINARS.filter((x) => {
      if (tab !== 'all' && x.status !== tab) return false
      if (status !== 'all' && x.status !== status) return false
      if (city !== 'all' && x.city !== city) return false
      if (cityOn && x.city !== headerCity) return false
      const day = new URLSearchParams(window.location.search).get('kun')
      if (day && !(String(x.date).startsWith(`${day}-`) || String(x.start || '').endsWith(`-${String(day).padStart(2, '0')}`))) return false
      const m = monthOf(x.date)
      if (span === '2026' && !x.date.includes('2026')) return false
      if (span === 'kelasi' && m < 10) return false
      if (span === 'otgan' && m >= 9) return false
      if (s && !`${x.title} ${x.speaker} ${x.city}`.toLowerCase().includes(s)) return false
      return true
    })
    list = [...list]
    if (sort === 'old') list.reverse()
    if (sort === 'money') list.sort((a, b) => b.revenue - a.revenue)
    if (sort === 'people') list.sort((a, b) => b.sold - a.sold)
    return list
  }, [query, q, tab, status, city, cityOn, headerCity, span, sort, SEMINARS])

  return (
    <div className="hidden lg:block">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 pt-0.5">
          <h1 className="text-[22px] font-bold leading-none tracking-[-0.02em]" style={{ color: INK }}>Seminarlar</h1>
          <p className="mt-2 text-[13px] leading-none" style={{ color: MUTED }}>Tadbirlaringizni boshqaring, ishtirokchilar, to‘lovlar va sertifikatlar</p>
        </div>
        <Link to="/tashkilotchi/seminarlar/yangi" className="inline-flex h-[38px] shrink-0 items-center gap-1.5 rounded-[10px] px-3.5 text-[13px] font-semibold text-white shadow-[0_6px_14px_rgb(2_125_132/0.22)]" style={{ background: BRAND }}>
          <Plus className="size-4" strokeWidth={2.4} /> Yangi seminar yaratish
        </Link>
      </div>

      <section className="mt-4 grid grid-cols-4 gap-3">
        <Kpi icon={CalendarDays} label="Jami seminarlar" value={String(totals.seminars)} hint={<span style={{ color: GREEN }} className="font-medium">{SEMINARS.filter((s) => s.status === 'rejalashtirilgan').length} ta yaqinlashmoqda</span>} />
        <Kpi icon={Users} label="Jami ishtirokchilar" value={String(hub.participants.length)} hint={<span>ro‘yxatdagilar</span>} />
        <Kpi icon={Wallet} label="Umumiy tushum" value={som(totals.gross)} hint={<span>muvaffaqiyatli to‘lovlar</span>} />
        <Kpi icon={Award} label="Berilgan sertifikatlar" value={String(hub.certs.filter((c) => c.state === 'done').length)} hint={<span className="font-semibold" style={{ color: GREEN }}>berilgan</span>} />
      </section>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {TABS.map((t) => {
          const on = tab === t.id
          const n = t.id === 'all' ? SEMINARS.length : SEMINARS.filter((s) => s.status === t.id).length
          return (
            <button key={t.id} type="button" onClick={() => setTab(t.id)} className="h-[30px] rounded-full px-3 text-[12.5px] font-semibold" style={on ? { background: BRAND, color: '#fff' } : { background: '#fff', color: '#3c4c5c', border: '1px solid #e5eeec' }}>
              {t.label} ({n})
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <label className="flex h-9 w-[248px] shrink-0 items-center gap-2 rounded-[10px] border border-[#e5eeec] bg-white px-3">
          <Search className="size-4 shrink-0 text-[#9aa6ae]" strokeWidth={2} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Seminar nomi, ma‘ruzachi yoki joy..." className="min-w-0 flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-[#a3aeb6]" />
        </label>
        <Drop value={status} onChange={setStatus} width={118} options={[
          { value: 'all', label: 'Holat' },
          { value: 'rejalashtirilgan', label: 'Rejalashtirilgan' },
          { value: 'jarayonda', label: 'Jarayonda' },
          { value: 'yakunlangan', label: 'Yakunlangan' },
          { value: 'bekor', label: 'Bekor qilingan' },
        ]} />
        <Drop value={span} onChange={setSpan} width={138} options={[
          { value: 'all', label: 'Sana oralig‘i' },
          { value: '2026', label: '2026-yil' },
          { value: 'kelasi', label: 'Kelgusi oylar' },
          { value: 'otgan', label: 'O‘tgan oylar' },
        ]} />
        <Drop value={city} onChange={setCity} width={112} options={[
          { value: 'all', label: 'Shahar' },
          { value: 'Toshkent', label: 'Toshkent' },
          { value: 'Samarqand', label: 'Samarqand' },
          { value: 'Buxoro', label: 'Buxoro' },
        ]} />
        <div className="ml-auto flex items-center gap-2">
          <Drop value={sort} onChange={setSort} width={196} options={[
            { value: 'new', label: 'Saralash: Yangi → Eski' },
            { value: 'old', label: 'Saralash: Eski → Yangi' },
            { value: 'money', label: 'Tushum bo‘yicha' },
            { value: 'people', label: 'Ishtirokchi bo‘yicha' },
          ]} />
          <div className="flex overflow-hidden rounded-[10px] border border-[#e5eeec] bg-white">
            <button type="button" aria-label="Ro‘yxat" aria-pressed={view === 'list'} onClick={() => setView('list')} className="grid size-9 place-items-center" style={view === 'list' ? { background: BRAND, color: '#fff' } : { color: '#8b98a0' }}>
              <List className="size-4" strokeWidth={2} />
            </button>
            <button type="button" aria-label="Jadval" aria-pressed={view === 'grid'} onClick={() => setView('grid')} className="grid size-9 place-items-center border-l border-[#e5eeec]" style={view === 'grid' ? { background: BRAND, color: '#fff' } : { color: '#8b98a0' }}>
              <LayoutGrid className="size-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {rows.length === 0 && <p className="mt-10 text-center text-[13px]" style={{ color: MUTED }}>Seminar topilmadi. Filtrlarni tozalab ko‘ring.</p>}

      {view === 'list' ? (
        <div className="mt-2.5 space-y-2">
          {rows.map((s) => <SeminarLine key={s.id} s={s} />)}
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3 xl:grid-cols-3">
          {rows.map((s) => <SeminarTile key={s.id} s={s} />)}
        </div>
      )}
    </div>
  )
}

function Hint({ delta, text }) {
  return (
    <>
      <span className="font-semibold" style={{ color: GREEN }}>↑ {delta}</span>
      <span> {text}</span>
    </>
  )
}

function Kpi({ icon: Icon, label, value, hint }) {
  return (
    <article className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#e7f1ef] bg-white px-3.5 py-[13px] shadow-[0_1px_2px_rgb(16_40_40/0.04)]">
      <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-[#e7f7f4]" style={{ color: BRAND }}>
        <Icon className="size-[22px]" strokeWidth={1.7} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[12px] leading-none" style={{ color: MUTED }}>{label}</p>
        <p className="mt-1 truncate text-[18px] font-bold leading-none tracking-[-0.03em]" style={{ color: INK }}>{value}</p>
        <p className="mt-1.5 truncate text-[11.5px] leading-none" style={{ color: MUTED }}>{hint}</p>
      </div>
    </article>
  )
}

function Drop({ value, onChange, options, width }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const fn = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])
  const current = options.find((o) => o.value === value) || options[0]
  return (
    <div ref={ref} className="relative shrink-0" style={{ width }}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex h-9 w-full items-center justify-between gap-1 rounded-[10px] border border-[#e5eeec] bg-white px-3 text-[12.5px] text-[#3e5160]">
        <span className="truncate">{current.label}</span>
        <ChevronDown className="size-3.5 shrink-0 text-[#93a1a8]" />
      </button>
      {open && (
        <ul className="absolute left-0 z-30 mt-1 max-h-64 w-full min-w-[160px] overflow-auto rounded-xl border border-[#e6eeec] bg-white py-1 shadow-lg">
          {options.map((o) => (
            <li key={o.value}>
              <button type="button" className="block w-full px-3 py-1.5 text-left text-[12.5px] hover:bg-[#f4fbfa]" style={o.value === value ? { color: BRAND, fontWeight: 600 } : undefined} onClick={() => { onChange(o.value); setOpen(false) }}>{o.label}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Banner({ s, className = 'h-[76px] w-[248px]' }) {
  return (
    <div className={`relative flex shrink-0 flex-col justify-between overflow-hidden rounded-[10px] bg-[#0b5962] p-2 ${className}`}>
      <img src={photoOf(s)} alt="" className="absolute inset-0 size-full object-cover object-[72%_center]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#085860_0%,#085860_30%,rgba(8,88,96,0.82)_48%,rgba(8,88,96,0.2)_68%,rgba(8,88,96,0)_80%)]" />
      <span className="relative z-10 w-fit rounded-full px-2 py-[3px] text-[10px] font-semibold leading-none text-white" style={{ background: '#129e90' }}>{s.badge}</span>
      <p className="relative z-10 line-clamp-2 max-w-[62%] text-[10.5px] font-semibold leading-[1.15] text-white">{s.title}</p>
    </div>
  )
}

const realSpeaker = (n) => !!n && n.trim() && n.trim() !== 'Ma’ruzachi'

function Meta({ s }) {
  return (
    <p className="mt-1 flex items-center gap-x-2 overflow-hidden whitespace-nowrap text-[11.5px]" style={{ color: MUTED }}>
      {realSpeaker(s.speaker) && <span className="inline-flex items-center gap-1"><User className="size-3.5 shrink-0" strokeWidth={1.8} /> {s.speaker}</span>}
      <span className="inline-flex items-center gap-1"><Calendar className="size-3.5 shrink-0" strokeWidth={1.8} /> {s.date}</span>
      <span className="inline-flex items-center gap-1"><MapPin className="size-3.5 shrink-0" strokeWidth={1.8} /> {s.city}</span>
    </p>
  )
}

function Chips({ s }) {
  return (
    <p className="mt-1.5 flex gap-1.5">
      <span className="inline-flex h-[22px] items-center rounded-full border border-[#bfe3da] bg-white px-2 text-[11px] font-semibold" style={{ color: BRAND }}>{s.format}</span>
      <span className="inline-flex h-[22px] items-center rounded-full bg-[#e7f6f3] px-2 text-[11px] font-semibold" style={{ color: BRAND }}>{s.days}</span>
    </p>
  )
}

function Progress({ s }) {
  const pct = Math.round((s.sold / s.seats) * 100)
  return (
    <div className="w-[158px] shrink-0">
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-[12px] tabular-nums" style={{ color: '#5d6e78' }}>{s.sold} / {s.seats}</span>
        <div className="h-[6px] min-w-[64px] flex-1 overflow-hidden rounded-full bg-[#e6eeec]">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: BRAND }} />
        </div>
        <span className="shrink-0 text-[12px] font-bold tabular-nums" style={{ color: INK }}>{pct}%</span>
      </div>
      <p className="mt-1 text-[13.5px] font-bold leading-none" style={{ color: INK }}>{som(s.revenue)}</p>
      <p className="mt-1 text-[11px] leading-none" style={{ color: '#9aa6ae' }}>Tushum</p>
    </div>
  )
}

function StatusPill({ status }) {
  const label = status === 'rejalashtirilgan' ? 'Rejalashtirilgan' : status === 'jarayonda' ? 'Jarayonda' : status === 'yakunlangan' ? 'Yakunlangan' : status === 'qoralama' ? 'Qoralama' : 'Bekor qilingan'
  const tone = status === 'bekor' ? '#e11d48' : status === 'qoralama' ? '#8d93a3' : status === 'yakunlangan' ? '#3b82f6' : GREEN
  return (
    <span className="inline-flex h-[24px] shrink-0 items-center gap-1 whitespace-nowrap rounded-full border bg-white px-2 text-[11.5px] font-semibold" style={{ color: tone, borderColor: '#b7e3d4' }}>
      <span className="size-1.5 rounded-full" style={{ background: tone }} />
      {label}
    </span>
  )
}

function DetailsBtn({ id }) {
  return (
    <Link to={`/tashkilotchi/seminarlar/${id}`} className="inline-flex h-[32px] shrink-0 items-center rounded-[10px] px-3.5 text-[12.5px] font-semibold text-white" style={{ background: BRAND }}>
      Tafsilotlar
    </Link>
  )
}

function Kebab({ id }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const fn = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])
  return (
    <div ref={ref} className="relative shrink-0">
      <button type="button" aria-label="Yana" onClick={() => setOpen((v) => !v)} className="grid size-8 place-items-center rounded-lg text-[#8b98a0] hover:bg-[#f4fbfa]">
        <MoreVertical className="size-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-40 overflow-hidden rounded-xl border border-[#e6eeec] bg-white py-1 shadow-lg">
          <button type="button" className="block w-full px-3 py-2 text-left text-[12.5px] hover:bg-[#f4fbfa]" onClick={() => { setOpen(false); navigate(`/tashkilotchi/seminarlar/${id}`) }}>Tafsilotlar</button>
          <button type="button" className="block w-full px-3 py-2 text-left text-[12.5px] hover:bg-[#f4fbfa]" onClick={() => { setOpen(false); navigate(`/tashkilotchi/seminarlar/yangi?tahrir=${id}`) }}>Tahrirlash</button>
        </div>
      )}
    </div>
  )
}

function SeminarLine({ s }) {
  return (
    <article className="flex items-center gap-2.5 rounded-2xl border border-[#e7f1ef] bg-white px-2.5 py-2 shadow-[0_1px_2px_rgb(16_40_40/0.03)]">
      <Banner s={s} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-bold leading-tight" style={{ color: INK }}>{s.title}</p>
        <Meta s={s} />
        <Chips s={s} />
      </div>
      <Progress s={s} />
      <StatusPill status={s.status} />
      <DetailsBtn id={s.id} />
      <Kebab id={s.id} />
    </article>
  )
}

function SeminarTile({ s }) {
  const pct = Math.round((s.sold / s.seats) * 100)
  return (
    <article className="overflow-hidden rounded-2xl border border-[#e7f1ef] bg-white shadow-[0_1px_2px_rgb(16_40_40/0.03)]">
      <Banner s={s} className="h-[92px] w-full rounded-none" />
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[14px] font-bold leading-snug" style={{ color: INK }}>{s.title}</p>
          <StatusPill status={s.status} />
        </div>
        <Meta s={s} />
        <div className="mt-2 flex items-center gap-2">
          <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-[#e6eeec]"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: BRAND }} /></div>
          <span className="text-[12px] font-bold" style={{ color: INK }}>{pct}%</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[13.5px] font-bold" style={{ color: INK }}>{som(s.revenue)}</span>
          <DetailsBtn id={s.id} />
        </div>
      </div>
    </article>
  )
}

function Mobile() {
  const navigate = useNavigate()
  const hub = useHub()
  const [tab, setTab] = useState('faol')
  const [menu, setMenu] = useState(null)
  const MOBILE_ROWS = hub.seminars.map((s) => ({
    id: s.id,
    cat: s.topic,
    title: s.title,
    date: `${s.date}${s.startTime ? `, ${s.startTime}` : ''}`,
    place: s.place || s.city,
    sold: s.sold,
    seats: s.seats,
    status: s.status === 'qoralama' ? 'qoralama' : s.status === 'yakunlangan' ? 'otgan' : s.status === 'bekor' ? 'bekor' : 'faol',
    hidden: s.published === false && s.status !== 'qoralama',
    image: s.image,
    pos: 'center',
  }))
  const counts = {
    faol: MOBILE_ROWS.filter((s) => s.status === 'faol').length,
    qoralama: MOBILE_ROWS.filter((s) => s.status === 'qoralama').length,
    otgan: MOBILE_ROWS.filter((s) => s.status === 'otgan' || s.status === 'bekor').length,
  }
  const rows = MOBILE_ROWS.filter((s) => (tab === 'otgan' ? s.status === 'otgan' || s.status === 'bekor' : s.status === tab))

  return (
    <div className="lg:hidden">
      <h1 className="text-[26px] font-bold leading-none tracking-[-0.03em] text-[#10143f]">Seminarlar</h1>
      <p className="mt-1.5 text-[14px] text-[#8b93a3]">Mening seminarlarim</p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          ['faol', `Faol (${counts.faol})`],
          ['qoralama', `Qoralama (${counts.qoralama})`],
          ['otgan', `O‘tgan (${counts.otgan})`],
        ].map(([id, label]) => {
          const on = tab === id
          return (
            <button key={id} type="button" onClick={() => setTab(id)} className="h-11 rounded-xl text-[13.5px] font-semibold" style={on ? { background: BRAND, color: '#fff' } : { background: '#fff', color: '#9aa3b2', boxShadow: '0 1px 2px rgb(16 40 60 / 0.04)' }}>
              {label}
            </button>
          )
        })}
      </div>

      <div className="mt-3 space-y-3 pb-24">
        {rows.map((s) => {
          const st = s.hidden && s.status === 'faol' ? MSTATUS.yashirin : MSTATUS[s.status]
          const pct = s.seats ? Math.round((s.sold / s.seats) * 100) : 0
          return (
            <article key={s.id} className="relative rounded-[18px] border border-[#eef1f4] bg-white px-3 py-3 shadow-[0_6px_18px_rgb(16_36_58/0.05)]">
              <div className="flex gap-3">
                <img src={s.image} alt="" className="size-[72px] shrink-0 rounded-xl object-cover" style={{ objectPosition: s.pos }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-org-teal">{s.cat}</span>
                    <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold" style={{ color: st.text }}>
                      <span className="size-[7px] rounded-full" style={{ background: st.dot }} />
                      {st.label}
                    </span>
                    <button type="button" aria-label="Yana" onClick={() => setMenu(menu === s.id ? null : s.id)} className="relative z-20 -mr-1 grid size-6 shrink-0 place-items-center text-[#9aa6b2]">
                      <MoreVertical className="size-4" />
                    </button>
                  </div>
                  <h2 className="mt-0.5 pr-5 text-[15px] font-bold leading-[1.25] text-[#12163f]">{s.title}</h2>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[12px] leading-none text-[#8b93a3]">
                    <Calendar className="size-3.5 shrink-0" strokeWidth={1.8} /> <span className="truncate">{s.date}</span>
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 pr-4 text-[12px] leading-none text-[#8b93a3]">
                    <MapPin className="size-3.5 shrink-0" strokeWidth={1.8} /> <span className="truncate">{s.place}</span>
                  </p>
                </div>
              </div>
              <ChevronRight className="pointer-events-none absolute right-2 top-[62px] size-[18px] text-[#c3ccd4]" />
              {menu === s.id && (
                <div className="absolute right-3 top-9 z-30 w-40 overflow-hidden rounded-xl border border-[#e6eeec] bg-white py-1 shadow-lg">
                  <button type="button" className="block w-full px-3 py-2 text-left text-[13px]" onClick={() => navigate(`/tashkilotchi/seminarlar/${s.id}`)}>Tafsilotlar</button>
                  <button type="button" className="block w-full px-3 py-2 text-left text-[13px]" onClick={() => navigate(`/tashkilotchi/seminarlar/yangi?tahrir=${s.id}`)}>Tahrirlash</button>
                </div>
              )}
              <button type="button" className="absolute inset-0 z-10 rounded-[18px]" aria-label={s.title} onClick={() => navigate(`/tashkilotchi/seminarlar/${s.id}`)} />
              <div className="relative z-20 mt-3 flex items-center justify-between pointer-events-none">
                <span className="inline-flex items-center gap-1.5 text-[12.5px] text-[#8b93a3]">
                  <Users className="size-4" strokeWidth={1.7} /> Sotilgan chiptalar
                </span>
                <span className="text-[13.5px] tabular-nums">
                  <span className="font-bold text-[#12163f]">{s.sold}</span>
                  <span className="text-[#9aa3b2]"> / {s.seats}</span>
                </span>
              </div>
              <div className="relative z-20 mt-2 flex items-center gap-2 pointer-events-none">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e7edf0]">
                  <div className="h-full rounded-full bg-org-teal" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-10 text-right text-[13px] font-bold tabular-nums text-[#12163f]">{pct}%</span>
              </div>
            </article>
          )
        })}
      </div>

      <Link to="/tashkilotchi/seminarlar/yangi" aria-label="Yangi seminar" className="fixed bottom-[92px] right-4 z-40 grid size-14 place-items-center rounded-full text-white shadow-[0_10px_22px_rgb(12_143_134/0.35)]" style={{ background: BRAND }}>
        <Plus className="size-7" strokeWidth={2.2} />
      </Link>
    </div>
  )
}
