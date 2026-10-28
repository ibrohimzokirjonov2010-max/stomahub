import { useCallback, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Search, SlidersHorizontal, LayoutGrid, Scissors, Sparkles, HeartPulse, Ellipsis, ChevronDown, Bookmark, CalendarDays,
  Clock, MapPin, UserRound, ArrowRight, ShoppingCart, Bell, Video, X, Check, CircleCheck,
} from 'lucide-react'
import { seminarChips, seminarCard, som } from '../../seminarsData'
import { publicRecords, useHub } from '../../hubStore'
import HubNotice from '../HubNotice'
import { useCart } from '../../cart'
import { BrandLogo, MobileToast, CountBadge } from './parts'
import MobileTabBar from './MobileTabBar'
import { SHOWCASE_SAVED, useSeminarStore, toggleSaved } from './seminarStore'
import { useProfile } from '../../profileStore'
import { currentUid } from '../../recordSync'
import { useSession } from '../../sessionStore'

const ImplantIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M7 3.5h10l-1 4H8z" /><path d="M8.5 9.5h7M9 12.5h6M9.5 15.5h5M10.2 18.5h3.6" /><path d="M12 21v-1.5" />
  </svg>
)
export const ToothIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M7.5 3.5c-2.4 0-4 1.9-4 4.6 0 2.3 1 3.6 1.6 5.6.7 2.4.9 6.8 2.7 6.8 1.6 0 1.6-4.6 4.2-4.6s2.6 4.6 4.2 4.6c1.8 0 2-4.4 2.7-6.8.6-2 1.6-3.3 1.6-5.6 0-2.7-1.6-4.6-4-4.6-1.8 0-2.7 1-4.5 1s-2.7-1-4.5-1z" />
  </svg>
)
const BracesIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M2.5 12h19" /><rect x="4" y="8.5" width="4.5" height="7" rx="1.2" /><rect x="9.75" y="8.5" width="4.5" height="7" rx="1.2" /><rect x="15.5" y="8.5" width="4.5" height="7" rx="1.2" />
  </svg>
)

const CHIP_ICONS = { all: LayoutGrid, impl: ImplantIcon, endo: ToothIcon, orto: BracesIcon, estet: Sparkles, paro: HeartPulse, surg: Scissors, other: Ellipsis }
const SORTS = {
  date: { label: 'Sanasi bo‘yicha', fn: (a, b) => a.dateKey.localeCompare(b.dateKey) },
  cheap: { label: 'Arzonroq', fn: (a, b) => a.price - b.price },
  expensive: { label: 'Qimmatroq', fn: (a, b) => b.price - a.price },
  seats: { label: 'Joy kam qolgan', fn: (a, b) => a.left - b.left },
}
const CITIES = ['Toshkent', 'Samarqand']
const EMPTY = { city: '', month: '', live: false }
const matches = (s, f) =>
  (!f.city || s.city === f.city) && (!f.month || s.monthKey === f.month) && (!f.live || s.format.includes('jonli'))

export function SeminarTopBar({ onCalendar, onBell }) {
  const { items } = useCart()
  const navigate = useNavigate()
  const btn = 'relative grid size-10 place-items-center rounded-full bg-[#e6f4f3] text-sea'
  return (
    <header className="app-topbar sticky top-0 z-30 -mx-3.5 -mt-3 flex items-center justify-between bg-[#f6f9fb]/95 px-3.5 pb-1 backdrop-blur">
      <BrandLogo />
      <div className="flex items-center gap-2">
        <button type="button" onClick={onCalendar} aria-label="Mening seminarlarim" className={btn}><CalendarDays className="size-[19px]" /></button>
        <button type="button" onClick={() => navigate('/savatcha', { state: { from: 'market' } })} aria-label="Savat" className={btn}>
          <ShoppingCart className="size-[19px]" />
          {items.length > 0 && <CountBadge>{items.length}</CountBadge>}
        </button>
        <button type="button" onClick={onBell} aria-label="Bildirishnomalar" className={btn}>
          <Bell className="size-[19px]" />
        </button>
      </div>
    </header>
  )
}

export default function MobileSeminars() {
  const navigate = useNavigate()
  const location = useLocation()
  const store = useSeminarStore()
  const hub = useHub()
  const cards = useMemo(() => publicRecords(hub).map(seminarCard), [hub])
  const [cat, setCat] = useState('all')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('date')
  const [filter, setFilter] = useState(EMPTY)
  const [sheet, setSheet] = useState(location.state?.mine ? 'mine' : null)
  const [toast, setToast] = useState('')
  const closeToast = useCallback(() => setToast(''), [])

  const base = useMemo(() => {
    const s = q.trim().toLowerCase()
    return cards.filter((x) => cat === 'all' || x.cat === cat).filter(
      (x) => !s || `${x.title} ${x.text} ${x.speaker.name} ${x.city} ${x.place}`.toLowerCase().includes(s),
    )
  }, [cards, cat, q])
  const list = useMemo(() => base.filter((x) => matches(x, filter)).sort(SORTS[sort].fn), [base, filter, sort])
  const activeFilters = Object.keys(EMPTY).filter((k) => filter[k] !== EMPTY[k]).length
  const rows = [seminarChips.slice(0, 5), seminarChips.slice(5)]

  const save = (id) => setToast(toggleSaved(id) ? 'Seminar saqlandi' : 'Saqlanganlardan olib tashlandi')

  return (
    <div className="min-h-screen bg-[#f6f9fb] pb-[86px]">
      <div className="px-3.5 pt-3">
        <HubNotice hub={hub} />
        <SeminarTopBar onCalendar={() => setSheet('mine')} onBell={() => setToast('Yangi bildirishnomalar yo‘q')} />

        <div className="mt-3 flex gap-2">
          <label className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-2xl border border-line/70 bg-white px-3.5">
            <Search className="size-[18px] shrink-0 text-ink-2" />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Seminar, ma’ruzachi yoki mavzu qidiring..." className="min-w-0 flex-1 bg-transparent text-[12.5px] text-ink outline-none placeholder:text-muted" />
            {q && <button type="button" onClick={() => setQ('')} aria-label="Tozalash" className="text-muted"><X className="size-4" /></button>}
          </label>
          <button type="button" onClick={() => setSheet('filter')} aria-label="Filtrlar" className="relative grid size-11 shrink-0 place-items-center rounded-2xl bg-[#e6f4f3] text-ink">
            <SlidersHorizontal className="size-[19px]" />
            {activeFilters > 0 && <span className="absolute -right-1 -top-1 grid size-[18px] place-items-center rounded-full bg-sea text-[10px] font-bold text-white ring-2 ring-[#f6f9fb]">{activeFilters}</span>}
          </button>
        </div>
      </div>

      <div className="mt-3 overflow-x-auto px-3.5 pb-1 no-scrollbar">
        <div className="flex w-max flex-col gap-2">
          {rows.map((row, i) => (
            <div key={i} className="flex gap-2">
              {row.map(({ key, label }) => {
                const Icon = CHIP_ICONS[key]
                const on = cat === key
                return (
                  <button key={key} type="button" aria-pressed={on} onClick={() => setCat(on && key !== 'all' ? 'all' : key)} className={`flex h-[34px] items-center gap-1.5 rounded-full px-3.5 text-[12px] font-medium transition ${on ? 'bg-sea text-white' : 'border border-line/80 bg-white text-ink'}`}>
                    <Icon className={`size-4 ${on ? '' : 'text-sea'}`} strokeWidth={1.7} /> {label}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between px-3.5">
        <h1 className="text-[22px] font-extrabold tracking-tight text-[#0d3b44]">Seminarlar</h1>
        <label className="relative flex items-center gap-1 text-[12px] font-medium text-sea-600">
          {SORTS[sort].label} <ChevronDown className="size-4" />
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Saralash" className="absolute inset-0 opacity-0">
            {Object.entries(SORTS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-2 flex flex-col gap-2.5 px-3.5">
        {list.map((s) => (
          <SeminarCard key={s.id} s={s} saved={store.saved.includes(s.id)} registered={!!store.registered[s.id]} onSave={() => save(s.id)} onRegister={() => navigate(`/seminarlar/${s.id}/royxat`)} />
        ))}
        {!list.length && (
          <div className="grid place-items-center rounded-2xl bg-white px-6 py-10 text-center">
            <p className="text-[14px] font-semibold text-ink">Seminarlar topilmadi</p>
            <p className="mt-1 text-[12px] text-muted">Qidiruv yoki filtrlarni o‘zgartirib ko‘ring</p>
            <button type="button" onClick={() => { setQ(''); setCat('all'); setFilter(EMPTY) }} className="mt-3 h-9 rounded-xl bg-sea-50 px-4 text-[12.5px] font-semibold text-sea">Filtrlarni tozalash</button>
          </div>
        )}
      </div>

      {sheet === 'filter' && (
        <FilterSheet initial={filter} count={(f) => base.filter((x) => matches(x, f)).length} onClose={() => setSheet(null)} onApply={(f) => { setFilter(f); setSheet(null) }} />
      )}
      {sheet === 'mine' && <MineSheet cards={cards} store={store} onClose={() => { setSheet(null); if (location.state?.mine) navigate('.', { replace: true, state: null }) }} />}

      <MobileToast text={toast} onClose={closeToast} />
      <MobileTabBar />
    </div>
  )
}

function SeminarCard({ s, saved, registered, onSave, onRegister }) {
  const TagIcon = s.online ? Video : UserRound
  return (
    <article className="relative flex gap-2.5 rounded-2xl bg-white p-2 shadow-[0_1px_4px_rgb(11_31_58/0.06)]">
      <Link to={`/seminarlar/${s.id}`} className="relative w-[116px] shrink-0 overflow-hidden rounded-xl bg-[#dfeeee]">
        <img src={s.image} alt={s.title} className="absolute inset-0 size-full object-cover object-[80%_center]" />
        <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-[#0b7f87]/90 px-2 py-[3px] text-[9.5px] font-semibold text-white backdrop-blur-sm">
          <TagIcon className="size-3" /> {s.tag}
        </span>
      </Link>
      <div className="min-w-0 flex-1 py-0.5">
        <button type="button" onClick={onSave} aria-label="Saqlash" aria-pressed={saved} className="absolute right-2 top-2 grid size-7 place-items-center text-ink-2">
          <Bookmark className={`size-[18px] ${saved ? 'fill-sea text-sea' : ''}`} strokeWidth={1.8} />
        </button>
        <Link to={`/seminarlar/${s.id}`} className="block pr-7">
          <h3 className="line-clamp-2 text-[13.5px] font-bold leading-[1.25] text-[#0d3b44]">{s.title}</h3>
          <p className="mt-0.5 line-clamp-2 text-[10.5px] leading-snug text-muted">{s.text}</p>
        </Link>
        <div className="mt-1.5 flex items-center gap-3 text-[10px] text-ink-2">
          <span className="flex items-center gap-1"><CalendarDays className="size-3 text-muted" /> {s.dateLabel}</span>
          <span className="flex items-center gap-1 whitespace-nowrap"><Clock className="size-3 text-muted" /> {s.time}</span>
        </div>
        <p className="mt-1 flex items-center gap-1 truncate text-[10px] text-ink-2"><MapPin className="size-3 shrink-0 text-muted" /> <span className="truncate">{s.placeLabel}</span></p>
        <div className="mt-2 flex items-end justify-between gap-2 border-t border-line/70 pt-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <img src={s.speaker.avatar} alt="" className="size-7 shrink-0 rounded-full object-cover" />
            <div className="min-w-0 leading-tight">
              <p className="text-[9px] text-muted">Ma’ruzachi</p>
              <p className="line-clamp-2 text-[10.5px] font-semibold text-ink">{s.speaker.name}</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="whitespace-nowrap text-[13px] font-extrabold text-[#0d3b44]">{som(s.price)}</span>
            {s.cancelled ? (
              <span className="flex h-8 items-center rounded-lg bg-[#fde8e8] px-2 text-[10px] font-semibold text-[#dc2626]">Bekor qilingan</span>
            ) : registered ? (
              <span className="flex h-8 items-center gap-1 rounded-lg bg-[#e5f6ec] px-2 text-[10px] font-semibold text-ok"><CircleCheck className="size-3.5" /> Ro‘yxatdasiz</span>
            ) : (
              <button type="button" onClick={onRegister} className="flex h-8 items-center gap-1 rounded-lg bg-sea px-2 text-[10px] font-semibold text-white active:scale-[0.97]">
                Ro‘yxatdan o‘tish <ArrowRight className="size-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

export function BottomSheet({ title, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end bg-ink/45" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} className="flex max-h-[90dvh] flex-col rounded-t-3xl bg-white">
        <div className="flex items-center justify-between px-4 pb-1 pt-3">
          <span className="w-8" />
          <span className="h-1 w-10 rounded-full bg-line" />
          <button type="button" onClick={onClose} aria-label="Yopish" className="grid size-8 place-items-center rounded-full bg-page text-ink"><X className="size-4" /></button>
        </div>
        {title && <h2 className="px-4 text-[18px] font-bold text-ink">{title}</h2>}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{children}</div>
        {footer && <div className="flex gap-2 border-t border-line px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3">{footer}</div>}
      </div>
    </div>
  )
}

function Choice({ label, options, value, onChange }) {
  return (
    <>
      <p className="mt-4 text-[13px] font-semibold text-ink">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map(([v, l]) => {
          const on = value === v
          return (
            <button key={v} type="button" aria-pressed={on} onClick={() => onChange(on ? '' : v)} className={`flex h-9 items-center gap-1.5 rounded-xl border px-3 text-[12.5px] font-medium ${on ? 'border-sea bg-sea-50 text-sea' : 'border-line text-ink'}`}>
              {on && <Check className="size-3.5" />} {l}
            </button>
          )
        })}
      </div>
    </>
  )
}

function FilterSheet({ initial, count, onClose, onApply }) {
  const [f, setF] = useState(initial)
  const patch = (p) => setF((x) => ({ ...x, ...p }))
  return (
    <BottomSheet
      title="Filtrlar"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={() => setF(EMPTY)} className="h-12 rounded-xl border border-line px-4 text-[13.5px] font-semibold text-ink">Tozalash</button>
          <button type="button" onClick={() => onApply(f)} className="h-12 flex-1 rounded-xl bg-sea text-[14px] font-semibold text-white">{count(f)} ta seminarni ko‘rsatish</button>
        </>
      }
    >
      <Choice label="Shahar" options={CITIES.map((c) => [c, c])} value={f.city} onChange={(city) => patch({ city })} />
      <Choice label="Oy" options={[['2026-10', 'Oktabr 2026'], ['2026-11', 'Noyabr 2026']]} value={f.month} onChange={(month) => patch({ month })} />
      <label className="mt-5 flex items-center justify-between rounded-2xl border border-line px-3.5 py-3 text-[13.5px] text-ink">
        Jonli efir bilan
        <input type="checkbox" checked={f.live} onChange={(e) => patch({ live: e.target.checked })} className="sr-only" />
        <span className={`relative h-6 w-11 rounded-full transition ${f.live ? 'bg-sea' : 'bg-line'}`}>
          <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${f.live ? 'left-[22px]' : 'left-0.5'}`} />
        </span>
      </label>
    </BottomSheet>
  )
}

function MineSheet({ cards, store, onClose }) {
  const profile = useProfile()
  const session = useSession()
  const live = profile.accountLive || !!currentUid() || session.status === 'authed'
  const savedIds = store.saved.length ? store.saved : (live ? [] : SHOWCASE_SAVED)
  const regIds = live
    ? new Set([...(Object.keys(store.registered || {})), ...savedIds])
    : null
  const reg = cards.filter((s) => store.registered[s.id] && (!live || regIds.has(s.id)))
  const saved = cards.filter((s) => savedIds.includes(s.id) && !store.registered[s.id])
  const Row = ({ s, badge }) => (
    <Link to={store.registered[s.id]?.order ? `/seminarlar/${s.id}/royxat` : `/seminarlar/${s.id}`} className="flex items-center gap-3 rounded-2xl border border-line p-2">
      <img src={s.image} alt="" className="size-14 shrink-0 rounded-xl object-cover" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold text-ink">{s.title}</span>
        <span className="mt-0.5 block text-[11.5px] text-muted">{s.dateLabel} · {s.city}</span>
      </span>
      {badge}
    </Link>
  )
  return (
    <BottomSheet title="Mening seminarlarim" onClose={onClose}>
      {!reg.length && !saved.length && (
        <div className="py-8 text-center">
          <CalendarDays className="mx-auto size-9 text-sea/60" strokeWidth={1.5} />
          <p className="mt-2 text-[13.5px] font-semibold text-ink">Hozircha seminar yo‘q</p>
          <p className="mt-1 text-[12px] text-muted">Ro‘yxatdan o‘tgan va saqlagan seminarlaringiz shu yerda ko‘rinadi</p>
        </div>
      )}
      {reg.length > 0 && (
        <>
          <p className="mt-3 text-[13px] font-semibold text-ink">Ro‘yxatdan o‘tganlarim</p>
          <div className="mt-2 flex flex-col gap-2">{reg.map((s) => <Row key={s.id} s={s} badge={<CircleCheck className="size-5 shrink-0 text-ok" />} />)}</div>
        </>
      )}
      {saved.length > 0 && (
        <>
          <p className="mt-4 text-[13px] font-semibold text-ink">Saqlanganlar</p>
          <div className="mt-2 flex flex-col gap-2">{saved.map((s) => <Row key={s.id} s={s} badge={<Bookmark className="size-5 shrink-0 fill-sea text-sea" />} />)}</div>
        </>
      )}
    </BottomSheet>
  )
}
