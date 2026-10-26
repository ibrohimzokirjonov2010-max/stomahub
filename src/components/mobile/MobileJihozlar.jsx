import { useCallback, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Search, SlidersHorizontal, ChevronDown, LayoutGrid, List, Heart, ShieldCheck, Settings, ShoppingCart, Check, X,
  Armchair, ScanLine, Microwave, Microscope, Gauge, PenTool, Lightbulb, Radiation,
} from 'lucide-react'
import { products, catName, primaryBrands, cities, sorts, money } from '../../jihozData'
import { useCart } from '../../cart'
import { MobileTopBar, MobileToast } from './parts'
import MobileTabBar from './MobileTabBar'
import { BottomSheet } from './MobileSeminars'

const CATS = [
  ['unit', 'Kreslolar', Armchair],
  ['cbct', 'Rentgen', Radiation],
  ['scan', 'Skaner', ScanLine],
  ['autoclave', 'Sterilizatsiya', Microwave],
  ['micro', 'Mikroskop', Microscope],
  ['compressor', 'Kompressor', Gauge],
  ['handpiece', 'Qo‘lchalar', PenTool],
  ['lamp', 'Lampa', Lightbulb],
]
const SORT_FN = {
  popular: (a, b) => b.reviews - a.reviews,
  cheap: (a, b) => a.price - b.price,
  rich: (a, b) => b.price - a.price,
  fresh: (a, b) => b.year - a.year,
  rating: (a, b) => b.rating - a.rating,
}
const SORT_SHORT = { popular: 'Mashhur', cheap: 'Arzonroq', rich: 'Qimmatroq', fresh: 'Yangilari', rating: 'Reyting' }
const PRICES = [['10000000', '10 mln gacha'], ['50000000', '50 mln gacha'], ['100000000', '100 mln gacha'], ['200000000', '200 mln gacha']]
const EMPTY = { brand: '', price: '', warranty: '', city: '', lizing: false }

export const warrantyLabel = (m) => (m >= 12 ? `${m / 12} yil` : `${m} oy`)
export const conditionLabel = (s) => (s === 'used' ? 'B.U.' : s === 'demo' ? 'Ko‘rgazmali' : 'Yangi')
export function badgeOf(p) {
  if (p.status === 'used') return ['B.U.', 'bg-[#f59e0b]']
  if (p.status === 'demo') return ['Ko‘rgazmali', 'bg-[#7c4ddb]']
  return p.year >= 2024 ? ['Yangi', 'bg-[#22b573]'] : ['Original', 'bg-[#1a73e8]']
}

const matches = (p, f) =>
  (!f.brand || p.brand === f.brand) &&
  (!f.price || p.price <= Number(f.price)) &&
  (!f.warranty || p.warranty >= Number(f.warranty)) &&
  (!f.city || p.city === f.city) &&
  (!f.lizing || p.lizing)

export function BrandMark({ p, className = '' }) {
  return <span className={`block truncate font-black uppercase tracking-[0.08em] text-[#1d3d7a] ${className}`}>{p.mark || p.brand}</span>
}

export default function MobileJihozlar() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { items, add } = useCart()
  const [cat, setCat] = useState(() => params.get('cat') || '')
  const [cond, setCond] = useState('new')
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState(() => ({ ...EMPTY, brand: params.get('brand') || '' }))
  const [sort, setSort] = useState('cheap')
  const [view, setView] = useState('grid')
  const [sheet, setSheet] = useState(null)
  const [liked, setLiked] = useState(() => new Set())
  const [toast, setToast] = useState('')
  const closeToast = useCallback(() => setToast(''), [])
  const searchRef = useRef(null)

  const base = useMemo(() => {
    const s = q.trim().toLowerCase()
    return products
      .filter((p) => !cat || p.cat === cat)
      .filter((p) => !cond || (cond === 'used' ? p.status === 'used' : p.status !== 'used'))
      .filter((p) => !s || `${p.title} ${p.brand} ${catName[p.cat]}`.toLowerCase().includes(s))
  }, [cat, cond, q])
  const list = useMemo(() => base.filter((p) => matches(p, filter)).sort(SORT_FN[sort]), [base, filter, sort])
  const activeFilters = Object.keys(EMPTY).filter((k) => filter[k]).length + (cond ? 1 : 0)

  const inCart = (p) => items.some((it) => it.id === p.id)
  const quickAdd = (p) => {
    if (inCart(p)) return navigate('/buyurtma', { state: { from: 'jihoz' } })
    add({ id: p.id, name: p.title, type: p.brand, price: p.price, image: p.image })
    setToast(`${p.title} savatga qo‘shildi`)
  }
  const toggleLike = (id) =>
    setLiked((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else { n.add(id); setToast('Sevimlilarga qo‘shildi') }
      return n
    })

  return (
    <div className="min-h-screen bg-[#f6f9fb] pb-[86px]">
      <div className="px-3.5 pt-3">
        <MobileTopBar onSearch={() => searchRef.current?.focus()} onBell={() => setToast('Yangi bildirishnomalar yo‘q')} />
        <h1 className="mt-2.5 text-[24px] font-extrabold leading-tight tracking-tight text-[#0d2a4a]">Jihozlar</h1>
        <p className="text-[11.5px] text-[#7d8fa9]">Klinik jihoz va uskunalar — sotuvchilar e’lonlari ham shu yerda</p>

        <label className="mt-3 flex h-11 items-center gap-2.5 rounded-2xl border border-line/70 bg-white px-3.5">
          <Search className="size-[18px] shrink-0 text-ink-2" />
          <input ref={searchRef} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Stomatologik jihozlarni qidiring..." className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-muted" />
          {q && <button type="button" onClick={() => setQ('')} aria-label="Tozalash" className="text-muted"><X className="size-4" /></button>}
        </label>
      </div>

      {/* Kategoriyalar */}
      <div className="mt-3 flex gap-2 overflow-x-auto px-3.5 pb-1 no-scrollbar">
        {CATS.map(([key, label, Icon]) => {
          const on = cat === key
          return (
            <button key={key} type="button" aria-pressed={on} onClick={() => setCat(on ? '' : key)} className={`flex h-[66px] w-[68px] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border transition ${on ? 'border-sea bg-sea-50 text-sea' : 'border-line/70 bg-white text-[#1f5fa8]'}`}>
              <Icon className="size-[26px]" strokeWidth={1.5} />
              <span className={`whitespace-nowrap text-[10px] ${on ? 'font-semibold' : 'text-ink-2'}`}>{label}</span>
            </button>
          )
        })}
      </div>

      {/* Asboblar qatori */}
      <div className="mt-2.5 flex items-center gap-1 px-3.5">
        <div className="flex h-8 shrink-0 rounded-full border border-line bg-white p-0.5">
          {[['new', 'Yangi'], ['used', 'B.U.']].map(([k, l]) => (
            <button key={k} type="button" aria-pressed={cond === k} onClick={() => setCond(cond === k ? '' : k)} className={`rounded-full px-2 text-[11px] font-semibold transition ${cond === k ? 'bg-sea text-white' : 'text-ink-2'}`}>{l}</button>
          ))}
        </div>
        <button type="button" onClick={() => setSheet('filter')} className="relative flex h-8 shrink-0 items-center gap-1 rounded-xl border border-line bg-white px-2 text-[11px] font-semibold text-ink">
          <SlidersHorizontal className="size-3.5" /> Filtrlar
          {activeFilters > 0 && <span className="absolute -right-1.5 -top-1.5 grid size-[17px] place-items-center rounded-full bg-[#1a73e8] text-[10px] font-bold text-white ring-2 ring-[#f6f9fb]">{activeFilters}</span>}
        </button>
        <span className="min-w-0 flex-1 pl-1 text-center text-[10px] leading-tight text-muted"><b className="font-semibold text-ink">{list.length}</b> ta natija</span>
        <label className="relative flex h-8 shrink-0 items-center gap-0.5 rounded-xl border border-line bg-white pl-2 pr-1 text-[11px] font-medium text-ink">
          {SORT_SHORT[sort]} <ChevronDown className="size-3.5 text-ink-2" />
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Saralash" className="absolute inset-0 opacity-0">
            {Object.entries(sorts).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
        <div className="flex shrink-0">
          {[['grid', LayoutGrid, 'Panjara'], ['list', List, 'Ro‘yxat']].map(([k, Icon, l]) => (
            <button key={k} type="button" onClick={() => setView(k)} aria-label={l} aria-pressed={view === k} className={`grid size-8 place-items-center rounded-lg ${view === k ? 'bg-[#1a73e8] text-white' : 'text-ink-2'}`}>
              <Icon className="size-4" />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2.5 px-3.5">
        {!list.length ? (
          <div className="grid place-items-center rounded-2xl bg-white px-6 py-10 text-center">
            <p className="text-[14px] font-semibold text-ink">Jihoz topilmadi</p>
            <p className="mt-1 text-[12px] text-muted">Qidiruv yoki filtrlarni o‘zgartirib ko‘ring</p>
            <button type="button" onClick={() => { setQ(''); setCat(''); setCond(''); setFilter(EMPTY) }} className="mt-3 h-9 rounded-xl bg-sea-50 px-4 text-[12.5px] font-semibold text-sea">Filtrlarni tozalash</button>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-2 gap-2.5">
            {list.map((p) => <JihozCard key={p.id} p={p} liked={liked.has(p.id)} onLike={() => toggleLike(p.id)} added={inCart(p)} onAdd={() => quickAdd(p)} />)}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {list.map((p) => <JihozRow key={p.id} p={p} added={inCart(p)} onAdd={() => quickAdd(p)} />)}
          </div>
        )}
      </div>

      {sheet === 'filter' && (
        <FilterSheet
          initial={filter}
          cond={cond}
          count={(f, c) => products.filter((p) => (!cat || p.cat === cat) && (!c || (c === 'used' ? p.status === 'used' : p.status !== 'used')) && matches(p, f)).length}
          onClose={() => setSheet(null)}
          onApply={(f, c) => { setFilter(f); setCond(c); setSheet(null) }}
        />
      )}

      <MobileToast
        text={toast}
        onClose={closeToast}
        action={toast.includes('savatga') ? <button type="button" onClick={() => navigate('/buyurtma', { state: { from: 'jihoz' } })} className="shrink-0 text-[12.5px] font-semibold text-[#5fe0c8]">Savat</button> : null}
      />
      <MobileTabBar />
    </div>
  )
}

function CartBtn({ added, onAdd, className = '' }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); onAdd() }}
      aria-label={added ? 'Savatda' : 'Savatga qo‘shish'}
      className={`grid shrink-0 place-items-center rounded-xl active:scale-95 ${added ? 'bg-sea-50 text-sea ring-1 ring-sea/40' : 'bg-sea text-white'} ${className}`}
    >
      {added ? <Check className="size-[18px]" strokeWidth={2.4} /> : <ShoppingCart className="size-[18px]" />}
    </button>
  )
}

function JihozCard({ p, liked, onLike, added, onAdd }) {
  const [badge, tone] = badgeOf(p)
  return (
    <Link to={`/jihozlar/${p.id}`} className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_4px_rgb(11_31_58/0.07)] active:scale-[0.99]">
      <div className="relative h-[140px] bg-[#eef3f6]">
        <img src={p.image} alt={p.title} className="size-full object-cover" />
        <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white ${tone}`}>{badge}</span>
        <button type="button" onClick={(e) => { e.preventDefault(); onLike() }} aria-label="Sevimlilarga" aria-pressed={liked} className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-white/95 shadow-[0_1px_4px_rgb(11_31_58/0.15)]">
          <Heart className={`size-[15px] ${liked ? 'fill-sale text-sale' : 'text-ink'}`} strokeWidth={2} />
        </button>
      </div>
      <div className="flex flex-1 flex-col p-2">
        <BrandMark p={p} className="text-[12px]" />
        <h3 className="mt-0.5 truncate text-[12.5px] font-bold text-[#0d2a4a]">{p.title}</h3>
        <div className="mt-1 flex items-center gap-2.5 text-[10px] text-ink-2">
          <span className="flex items-center gap-0.5 whitespace-nowrap"><ShieldCheck className="size-3.5 text-[#1f5fa8]" /> Kafolat {warrantyLabel(p.warranty)}</span>
          <span className="flex items-center gap-0.5 whitespace-nowrap"><Settings className="size-3.5 text-[#1f5fa8]" /> {conditionLabel(p.status)}</span>
        </div>
        <div className="mt-auto flex items-center justify-between gap-1 pt-2">
          <p className="min-w-0 whitespace-nowrap text-[14px] font-extrabold leading-tight text-[#0d2a4a]">{money(p.price)}</p>
          <CartBtn added={added} onAdd={onAdd} className="size-9" />
        </div>
        {p.lizing && <p className="mt-1.5 truncate rounded-lg bg-[#e6f4f3] px-2 py-1 text-center text-[10px] font-medium text-sea-600">Oyiga {money(p.month)} dan</p>}
      </div>
    </Link>
  )
}

function JihozRow({ p, added, onAdd }) {
  const [badge, tone] = badgeOf(p)
  return (
    <Link to={`/jihozlar/${p.id}`} className="flex gap-2.5 rounded-2xl bg-white p-2 shadow-[0_1px_4px_rgb(11_31_58/0.07)]">
      <div className="relative h-[92px] w-[104px] shrink-0 overflow-hidden rounded-xl bg-[#eef3f6]">
        <img src={p.image} alt={p.title} className="size-full object-cover" />
        <span className={`absolute left-1.5 top-1.5 rounded-full px-1.5 py-px text-[9px] font-semibold text-white ${tone}`}>{badge}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <BrandMark p={p} className="text-[11px]" />
        <h3 className="truncate text-[13px] font-bold text-[#0d2a4a]">{p.title}</h3>
        <p className="text-[10.5px] text-muted">Kafolat {warrantyLabel(p.warranty)} · {p.city}</p>
        <div className="mt-auto flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="whitespace-nowrap text-[14px] font-extrabold text-[#0d2a4a]">{money(p.price)}</p>
            {p.lizing && <p className="truncate text-[10px] text-sea-600">Oyiga {money(p.month)} dan</p>}
          </div>
          <CartBtn added={added} onAdd={onAdd} className="size-9" />
        </div>
      </div>
    </Link>
  )
}

function Options({ title, options, value, onChange }) {
  return (
    <>
      <p className="mt-4 text-[13px] font-semibold text-ink">{title}</p>
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

function FilterSheet({ initial, cond: initialCond, count, onClose, onApply }) {
  const [f, setF] = useState(initial)
  const [cond, setCond] = useState(initialCond)
  const patch = (p) => setF((x) => ({ ...x, ...p }))
  return (
    <BottomSheet
      title="Filtrlar"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={() => { setF(EMPTY); setCond('') }} className="h-12 rounded-xl border border-line px-4 text-[13.5px] font-semibold text-ink">Tozalash</button>
          <button type="button" onClick={() => onApply(f, cond)} className="h-12 flex-1 rounded-xl bg-sea text-[14px] font-semibold text-white">{count(f, cond)} ta natijani ko‘rsatish</button>
        </>
      }
    >
      <Options title="Holati" options={[['new', 'Yangi'], ['used', 'B.U. (ishlatilgan)']]} value={cond} onChange={setCond} />
      <Options title="Brend" options={primaryBrands.map((b) => [b, b])} value={f.brand} onChange={(brand) => patch({ brand })} />
      <Options title="Narx" options={PRICES} value={f.price} onChange={(price) => patch({ price })} />
      <Options title="Kafolat" options={[['12', '1 yildan'], ['24', '2 yildan'], ['36', '3 yil']]} value={f.warranty} onChange={(warranty) => patch({ warranty })} />
      <Options title="Shahar" options={cities.map((c) => [c, c])} value={f.city} onChange={(city) => patch({ city })} />
      <label className="mt-5 flex items-center justify-between rounded-2xl border border-line px-3.5 py-3 text-[13.5px] text-ink">
        Bo‘lib to‘lash mumkin
        <input type="checkbox" checked={f.lizing} onChange={(e) => patch({ lizing: e.target.checked })} className="sr-only" />
        <span className={`relative h-6 w-11 rounded-full transition ${f.lizing ? 'bg-sea' : 'bg-line'}`}>
          <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${f.lizing ? 'left-[22px]' : 'left-0.5'}`} />
        </span>
      </label>
    </BottomSheet>
  )
}
