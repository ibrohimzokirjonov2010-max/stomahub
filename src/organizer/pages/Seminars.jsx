import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, LayoutGrid, List, MapPin, Plus } from 'lucide-react'
import { SEMINARS, SEMINAR_STATUS, som } from '../data'
import { useOrg } from '../Shell'
import { Badge, Btn, Kpi, MenuBtn, SearchBox, Select, Tabs } from '../ui'
import { Award, CalendarDays, Users, Wallet } from 'lucide-react'

const TABS = [
  { id: 'all', label: 'Barchasi (8)' },
  { id: 'rejalashtirilgan', label: 'Rejalashtirilgan (3)' },
  { id: 'jarayonda', label: 'Jarayonda (2)' },
  { id: 'yakunlangan', label: 'Yakunlangan (3)' },
  { id: 'bekor', label: 'Bekor qilingan (0)' },
]

export default function Seminars() {
  const { query } = useOrg()
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [city, setCity] = useState('all')
  const [span, setSpan] = useState('all')
  const [sort, setSort] = useState('new')
  const [view, setView] = useState('list')

  const rows = useMemo(() => {
    const s = `${query} ${q}`.trim().toLowerCase()
    let list = SEMINARS.filter((x) => {
      if (tab !== 'all' && x.status !== tab) return false
      if (status !== 'all' && x.status !== status) return false
      if (city !== 'all' && x.city !== city) return false
      if (span === '2026' && !x.date.includes('2026')) return false
      if (span === 'kelasi' && !/noyabr|dekabr/.test(x.date)) return false
      if (s && !`${x.title} ${x.speaker} ${x.city}`.toLowerCase().includes(s)) return false
      return true
    })
    list = [...list]
    if (sort === 'old') list.reverse()
    if (sort === 'money') list.sort((a, b) => b.revenue - a.revenue)
    if (sort === 'people') list.sort((a, b) => b.sold - a.sold)
    return list
  }, [query, q, tab, status, city, span, sort])

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Seminarlar</h1>
          <p className="mt-0.5 text-[13px] text-[#6e868c]">Tadbirlaringizni boshqaring, ishtirokchilar, to‘lovlar va sertifikatlar</p>
        </div>
        <Btn to="/tashkilotchi/seminarlar/yangi"><Plus className="size-4" /> Yangi seminar yaratish</Btn>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={CalendarDays} label="Jami seminarlar" value="8" hint="3 ta yaqinlashmoqda" />
        <Kpi icon={Users} label="Jami ishtirokchilar" value="1 240" delta="+12%" hint="o‘tgan oyga nisbatan" />
        <Kpi icon={Wallet} label="Umumiy tushum" value="98 600 000 so‘m" delta="+28%" hint="o‘tgan oyga nisbatan" />
        <Kpi icon={Award} label="Berilgan sertifikatlar" value="987" foot="80%" hint="ishtirokchilarga" />
      </section>

      <div className="mt-4"><Tabs tabs={TABS} value={tab} onChange={setTab} /></div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <SearchBox value={q} onChange={setQ} placeholder="Seminar nomi, ma’ruzachi yoki joy..." className="w-full sm:w-[280px]" />
        <Select value={status} onChange={setStatus} className="w-[140px]" options={[{ value: 'all', label: 'Holat' }, ...Object.entries(SEMINAR_STATUS).map(([value, label]) => ({ value, label }))]} />
        <Select value={span} onChange={setSpan} className="w-[150px]" options={[{ value: 'all', label: 'Sana oralig‘i' }, { value: '2026', label: '2026' }, { value: 'kelasi', label: 'Kelgusi oylar' }]} />
        <Select value={city} onChange={setCity} className="w-[130px]" options={[{ value: 'all', label: 'Shahar' }, { value: 'Toshkent', label: 'Toshkent' }, { value: 'Samarqand', label: 'Samarqand' }, { value: 'Buxoro', label: 'Buxoro' }]} />
        <div className="ml-auto flex items-center gap-2">
          <Select value={sort} onChange={setSort} className="w-[180px]" options={[{ value: 'new', label: 'Saralash: Yangi → Eski' }, { value: 'old', label: 'Saralash: Eski → Yangi' }, { value: 'money', label: 'Tushum bo‘yicha' }, { value: 'people', label: 'Ishtirokchi bo‘yicha' }]} />
          <div className="flex overflow-hidden rounded-xl border border-[#e4eeec] bg-white">
            <button type="button" aria-label="Ro‘yxat" onClick={() => setView('list')} className={`grid size-10 place-items-center ${view === 'list' ? 'bg-[#e7f6f3] text-[#0c8f86]' : 'text-[#8aa0a4]'}`}><List className="size-4" /></button>
            <button type="button" aria-label="Jadval" onClick={() => setView('grid')} className={`grid size-10 place-items-center ${view === 'grid' ? 'bg-[#e7f6f3] text-[#0c8f86]' : 'text-[#8aa0a4]'}`}><LayoutGrid className="size-4" /></button>
          </div>
        </div>
      </div>

      {rows.length === 0 && <p className="mt-8 text-center text-[13px] text-[#7e9398]">Seminar topilmadi. Filtrlarni tozalab ko‘ring.</p>}

      {view === 'list' ? (
        <div className="mt-3 space-y-3">
          {rows.map((s) => <SeminarLine key={s.id} s={s} />)}
        </div>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((s) => <SeminarCard key={s.id} s={s} />)}
        </div>
      )}
    </div>
  )
}

function Progress({ s }) {
  const pct = Math.round((s.sold / s.seats) * 100)
  return (
    <div className="w-full min-w-[140px]">
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e7f1ef]"><div className="h-full rounded-full bg-[#14a394]" style={{ width: `${pct}%` }} /></div>
        <span className="text-[12px] text-[#5e787e]">{s.sold} / {s.seats}</span>
        <span className="text-[12px] font-semibold text-[#143044]">{pct}%</span>
      </div>
      <p className="mt-1 text-[13px] font-bold">{som(s.revenue)}</p>
      <p className="text-[11px] text-[#8aa0a4]">Tushum</p>
    </div>
  )
}

function SeminarLine({ s }) {
  return (
    <article className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#e6f1ef] bg-white p-3 shadow-[0_1px_2px_rgb(16_40_40/0.03)]">
      <div className="relative h-[74px] w-[148px] shrink-0 overflow-hidden rounded-xl">
        <img src={s.image} alt="" className="size-full object-cover" />
        <span className="absolute left-1.5 top-1.5 rounded-full bg-[#12a394] px-2 py-0.5 text-[10px] font-semibold text-white">{s.badge}</span>
      </div>
      <div className="min-w-[200px] flex-1">
        <p className="text-[14.5px] font-bold leading-snug">{s.title}</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#6e868c]">
          <span>{s.speaker}</span>
          <span className="inline-flex items-center gap-1"><Calendar className="size-3.5" /> {s.date}</span>
          <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" /> {s.city}</span>
        </p>
        <p className="mt-1.5 flex gap-1.5">
          <Badge tone="outline">{s.format}</Badge>
          <Badge tone="teal">{s.days}</Badge>
        </p>
      </div>
      <div className="w-full sm:w-[220px]"><Progress s={s} /></div>
      <div className="ml-auto flex items-center gap-2">
        <Badge tone="outline" dot>{SEMINAR_STATUS[s.status]}</Badge>
        <Btn kind="ghost" to={`/tashkilotchi/seminarlar/${s.id}`} className="h-9">Tafsilotlar</Btn>
        <MenuBtn items={[{ label: 'Tahrirlash', onClick: () => {} }, { label: 'Nusxalash', onClick: () => {} }]} />
      </div>
    </article>
  )
}

function SeminarCard({ s }) {
  const pct = Math.round((s.sold / s.seats) * 100)
  return (
    <article className="overflow-hidden rounded-2xl border border-[#e6f1ef] bg-white">
      <div className="relative h-28">
        <img src={s.image} alt="" className="size-full object-cover" />
        <span className="absolute left-2 top-2 rounded-full bg-[#12a394] px-2 py-0.5 text-[10px] font-semibold text-white">{s.badge}</span>
      </div>
      <div className="p-3">
        <p className="font-bold">{s.title}</p>
        <p className="mt-1 text-[12px] text-[#6e868c]">{s.city} · {s.date}</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e7f1ef]"><div className="h-full bg-[#14a394]" style={{ width: `${pct}%` }} /></div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[13px] font-bold">{som(s.revenue)}</span>
          <Link to={`/tashkilotchi/seminarlar/${s.id}`} className="text-[12px] font-semibold text-[#0c8f86]">Tafsilotlar</Link>
        </div>
      </div>
    </article>
  )
}
