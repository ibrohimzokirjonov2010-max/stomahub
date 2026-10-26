import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ChevronRight, ChevronDown, ShieldCheck, CalendarDays, Box, Plus, HeartHandshake, Pencil, CupSoda, Puzzle, Target, PenTool,
  Syringe, Ellipsis, MapPin, ArrowUpDown, LayoutGrid, List, Star,
} from 'lucide-react'
import { LikeButton, AddButton } from '../components/market/ProductCard'
import { surplusChips, surplusItems, cities, conditions } from '../surplusData'
import { som } from '../marketData'

const chipIcons = { all: HeartHandshake, komp: Pencil, bond: CupSoda, sement: Puzzle, impl: Target, instr: PenTool, anes: Syringe, other: Ellipsis }

const perks = [
  { icon: ShieldCheck, title: 'Tekshirilgan sotuvchilar', text: 'Ishonchli hamjamiyat' },
  { icon: CalendarDays, title: 'Yaroqlilik muddati ko‘rsatilgan', text: 'Faqat yaroqli mahsulotlar' },
  { icon: Box, title: 'Yopiq va original', text: 'Sifat kafolati' },
]

const expiryKey = (e) => { const [m, y] = e.split('/'); return Number(y) * 12 + Number(m) }
const sorts = {
  new: { label: 'Eng yangi', fn: (a, b) => a.order - b.order },
  cheap: { label: 'Arzonroq', fn: (a, b) => a.price - b.price },
  expensive: { label: 'Qimmatroq', fn: (a, b) => b.price - a.price },
  expiry: { label: 'Muddati uzoq', fn: (a, b) => expiryKey(b.expiry) - expiryKey(a.expiry) },
}

export function ConditionBadge({ value, className = '' }) {
  const opened = value === 'Ochilgan'
  return (
    <span className={`rounded-md px-2 py-[3px] text-[9px] font-semibold leading-none ${opened ? 'bg-[#ecebff] text-[#5b54d6]' : 'bg-sea-50 text-sea-600'} ${className}`}>
      {value}
    </span>
  )
}

export default function Surplus() {
  const [params] = useSearchParams()
  const [cat, setCat] = useState(params.get('cat') || 'all')
  const [city, setCity] = useState('')
  const [cond, setCond] = useState('')
  const [expiry, setExpiry] = useState('')
  const [max, setMax] = useState(50000000)
  const [sort, setSort] = useState('new')
  const [view, setView] = useState('grid')

  useEffect(() => {
    const q = params.get('cat')
    if (q) setCat(q)
  }, [params])

  const list = useMemo(
    () =>
      surplusItems
        .filter((p) => cat === 'all' || p.cat === cat)
        .filter((p) => !city || p.city === city)
        .filter((p) => !cond || p.condition === cond)
        .filter((p) => !expiry || Number(p.expiry.split('/')[1]) >= Number(expiry))
        .filter((p) => p.price <= max)
        .sort(sorts[sort].fn),
    [cat, city, cond, expiry, max, sort],
  )

  return (
    <div className="pb-6">
      {/* Hero */}
      <section className="relative -mx-4 overflow-hidden px-4 pb-3 pt-2.5 lg:-ml-4 lg:-mr-[18px] lg:pl-[18px] lg:pr-[18px]">
        <img src="/images/surplus/hero.jpg" alt="" className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[34%] object-cover object-[18%_center] md:block" />
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] bg-gradient-to-r from-[#f7fafd] from-10% via-[#f7fafd]/80 via-42% to-transparent md:block" />

        <nav className="relative flex items-center gap-1.5 text-[10px] text-muted">
          <Link to="/" className="hover:text-sea">Bosh sahifa</Link> <ChevronRight className="size-3" />
          <span className="font-medium text-ink">Ortiqcha material</span>
        </nav>

        <div className="relative mt-3 flex flex-col gap-4 xl:flex-row xl:items-center">
          <div className="xl:w-[318px] xl:shrink-0">
            <h1 className="text-[25px] font-extrabold leading-tight tracking-tight text-ink">Ortiqcha material</h1>
            <p className="mt-1 text-[12px] leading-[1.4] text-ink-2">
              Stomatologlarning ortiqcha, ishlatilmagan materiallari arzonroq narxda – bir-birimizga foydali bo‘laylik!
            </p>
          </div>
          <div className="relative z-10 flex flex-wrap gap-x-5 gap-y-3">
            {perks.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex items-center gap-2.5">
                <span className="grid size-[30px] place-items-center rounded-full bg-white/80 text-sea shadow-card">
                  <Icon className="size-4" strokeWidth={1.7} />
                </span>
                <div className="leading-tight">
                  <p className="whitespace-nowrap text-[9.5px] font-semibold text-ink">{title}</p>
                  <p className="whitespace-nowrap text-[8.5px] text-muted">{text}</p>
                </div>
              </div>
            ))}
          </div>
          <Link
            to="#"
            className="flex h-[37px] w-fit shrink-0 items-center gap-2 rounded-full bg-sea px-5 text-[13px] font-semibold text-white shadow-[0_6px_16px_-6px_rgb(11_138_149/0.6)] transition hover:bg-sea-600 xl:ml-auto"
          >
            <Plus className="size-4" strokeWidth={2.4} /> E’lon berish
          </Link>
        </div>
      </section>

      {/* Chiplar */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar lg:mx-0 lg:px-0">
        {surplusChips.map(({ key, label }) => {
          const Icon = chipIcons[key]
          const active = cat === key
          return (
            <button
              key={key}
              onClick={() => setCat(key)}
              className={`flex h-[31px] shrink-0 items-center gap-2 rounded-lg px-4 text-[10.5px] font-medium shadow-card transition ${
                active ? 'bg-sea text-white' : 'bg-white text-ink hover:text-sea'
              }`}
            >
              <Icon className="size-[14px] shrink-0" strokeWidth={1.7} /> {label}
            </button>
          )
        })}
      </div>

      {/* Filtrlar */}
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1fr_1fr_1.65fr_1.1fr_1.1fr_auto]">
        <SelectBox icon={MapPin} label="Shahar" value={city} onChange={setCity} options={cities} />
        <SelectBox icon={Box} label="Holati" value={cond} onChange={setCond} options={conditions} />
        <div className="rounded-lg bg-white px-3 py-1.5 shadow-card">
          <p className="text-[8.5px] text-muted">Narx oralig‘i (so‘m)</p>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="flex h-[19px] w-[60px] items-center rounded bg-[#f3f6fa] px-1.5 text-[9px] text-ink-2">0</span>
            <ChevronDown className="size-3 text-muted" />
            <input
              type="range"
              min={0}
              max={50000000}
              step={100000}
              value={max}
              onChange={(e) => setMax(Number(e.target.value))}
              className="surplus-range flex-1"
              style={{ '--p': `${(max / 50000000) * 100}%` }}
            />
            <span className="flex h-[19px] min-w-[68px] items-center justify-center rounded bg-[#f3f6fa] px-1.5 text-[9px] text-ink-2">
              {som(max).replace(' so‘m', '')}
            </span>
          </div>
        </div>
        <SelectBox icon={CalendarDays} label="Yaroqlilik muddati" value={expiry} onChange={setExpiry} options={[['2027', '2027 va undan keyin'], ['2028', '2028 va undan keyin']]} />
        <SelectBox
          icon={ArrowUpDown}
          label="Saralash"
          value={sort}
          onChange={setSort}
          options={Object.entries(sorts).map(([k, s]) => [k, s.label])}
          noAll
        />
        <div className="flex items-center gap-1.5 justify-self-end rounded-lg bg-white p-1.5 shadow-card">
          {[['grid', LayoutGrid], ['list', List]].map(([k, Icon]) => (
            <button
              key={k}
              onClick={() => setView(k)}
              aria-label={k === 'grid' ? 'Panjara' : 'Ro‘yxat'}
              className={`grid size-[30px] place-items-center rounded-md transition ${view === k ? 'bg-sea text-white' : 'text-ink-2 hover:text-sea'}`}
            >
              <Icon className="size-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Ro'yxat */}
      <div className="mt-3">
        {!list.length ? (
          <div className="grid h-[200px] place-items-center rounded-xl bg-white text-[11px] text-muted shadow-card">E’lonlar topilmadi</div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {list.map((p) => <SurplusCard key={p.id} item={p} />)}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {list.map((p) => <SurplusRow key={p.id} item={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function SelectBox({ icon: Icon, label, value, onChange, options, noAll }) {
  const opts = options.map((o) => (Array.isArray(o) ? o : [o, o]))
  const current = opts.find(([v]) => v === value)?.[1] ?? 'Barchasi'
  return (
    <label className="relative flex h-[42px] cursor-pointer items-center gap-2.5 rounded-lg bg-white px-3 shadow-card">
      <Icon className="size-[17px] shrink-0 text-ink-2" strokeWidth={1.6} />
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block text-[8.5px] text-muted">{label}</span>
        <span className="block truncate text-[10.5px] font-medium text-ink">{current}</span>
      </span>
      <ChevronDown className="size-3.5 shrink-0 text-ink-2" />
      <select value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0">
        {!noAll && <option value="">Barchasi</option>}
        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  )
}

function Meta({ item }) {
  return (
    <>
      <div className="mt-2 flex items-center gap-4 text-[9px] text-ink-2">
        <span className="flex items-center gap-1"><CalendarDays className="size-[11px] text-muted" />{item.expiry}</span>
        <span className="flex items-center gap-1"><MapPin className="size-[11px] text-muted" />{item.city}</span>
      </div>
      <div className="mt-1.5 flex items-center gap-1.5 text-[9px]">
        <img src={item.seller.avatar} alt="" className="size-[15px] rounded-full object-cover" />
        <span className="mr-1.5 font-medium text-ink">{item.seller.name}</span>
        <Star className="size-[10px] fill-star text-star" />
        <span className="text-ink-2">{item.rating} ({item.reviews})</span>
      </div>
    </>
  )
}

function Price({ item }) {
  return (
    <div className="leading-tight">
      {item.oldPrice && <p className="text-[9px] text-sale/80 line-through">{som(item.oldPrice)}</p>}
      <p className={`whitespace-nowrap text-[12.5px] font-bold ${item.oldPrice ? 'text-sale' : 'text-sea-600'}`}>{som(item.price)}</p>
    </div>
  )
}

function SurplusCard({ item }) {
  return (
    <Link to={`/ortiqcha/${item.id}`} className="group relative flex flex-col rounded-xl bg-white p-2.5 shadow-card transition hover:shadow-md">
      <div className="flex items-center gap-1.5">
        {item.discount && <span className="rounded-md bg-sale px-1.5 py-[3px] text-[9px] font-semibold leading-none text-white">{item.discount}</span>}
        <ConditionBadge value={item.condition} />
        <LikeButton className="-mr-1 -mt-0.5 ml-auto" />
      </div>
      <div className="mt-1 grid h-[78px] place-items-center overflow-hidden">
        <img src={item.image} alt={item.name} className="max-h-[78px] max-w-full object-contain transition group-hover:scale-105" />
      </div>
      <h3 className="mt-2.5 text-[10px] font-bold leading-snug text-ink">{item.name}</h3>
      {item.type && <p className="text-[10px] font-medium leading-snug text-ink-2">{item.type}</p>}
      <p className="text-[9px] text-muted">{item.brand}</p>
      <Meta item={item} />
      <div className="mt-auto flex items-end justify-between pt-2">
        <Price item={item} />
        <AddButton product={item} className="!h-[26px] !w-[34px]" />
      </div>
    </Link>
  )
}

function SurplusRow({ item }) {
  return (
    <Link to={`/ortiqcha/${item.id}`} className="flex items-center gap-4 rounded-xl bg-white p-2.5 shadow-card transition hover:shadow-md">
      <img src={item.image} alt={item.name} className="h-[64px] w-[110px] shrink-0 object-contain" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {item.discount && <span className="rounded-md bg-sale px-1.5 py-[3px] text-[9px] font-semibold leading-none text-white">{item.discount}</span>}
          <ConditionBadge value={item.condition} />
        </div>
        <h3 className="mt-1 truncate text-[11px] font-bold text-ink">{item.name} <span className="font-medium text-ink-2">{item.type}</span></h3>
        <p className="text-[9px] text-muted">{item.brand}</p>
      </div>
      <div className="hidden md:block"><Meta item={item} /></div>
      <Price item={item} />
      <AddButton product={item} className="!h-[26px] !w-[34px]" />
    </Link>
  )
}
