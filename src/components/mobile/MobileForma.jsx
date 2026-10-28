import { useCallback, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, ArrowRight, ChevronDown, ArrowUpDown, Heart, Star, ShoppingCart, Check, X, LayoutGrid } from 'lucide-react'
import { products, genders, allSizes, colors, fabrics, brands, sorts, money, colorOf } from '../../formaData'
import { useCart } from '../../cart'
import { MobileTopBar, MobileToast } from './parts'
import MobileTabBar from './MobileTabBar'
import { BottomSheet } from './MobileSeminars'

const line = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }
const ScrubIcon = (p) => (
  <svg viewBox="0 0 24 24" {...line} {...p}><path d="M8.5 3.5 5 5 2.5 9.5l3 1.5 1-1.8V20.5h11V9.2l1 1.8 3-1.5L19 5l-3.5-1.5" /><path d="M8.5 3.5 12 8l3.5-4.5" /><path d="M14 13h2.5" /></svg>
)
const CoatIcon = (p) => (
  <svg viewBox="0 0 24 24" {...line} {...p}><path d="M9 3h6l4.5 2.5 1.5 14-3 .5-.5-8v8.5H6.5V12l-.5 8-3-.5 1.5-14z" /><path d="M9 3l3 6.5L15 3" /><path d="M12 9.5v11" /><path d="M8.5 14.5h1.5M14 14.5h1.5" /></svg>
)
const CapIcon = (p) => (
  <svg viewBox="0 0 24 24" {...line} {...p}><path d="M3.5 15c0-5 3.8-9 8.5-9s8.5 4 8.5 9" /><path d="M3 15h18v2.5H3z" /><path d="M20 17.5l2 2.5M19 17.5l.5 3" /></svg>
)
const ShoeIcon = (p) => (
  <svg viewBox="0 0 24 24" {...line} {...p}><path d="M2.5 16V9.5c2 0 3 1 5 1s2.5-2 4-2c2 3 6 4 9 5.5.7.4 1 1 1 1.8V16z" /><path d="M2.5 16v2h19v-2" /><path d="M10 11.5l1.5-1M12.5 12.5l1.5-1" /></svg>
)
const ApronIcon = (p) => (
  <svg viewBox="0 0 24 24" {...line} {...p}><path d="M9 3h6v4l3.5 1v12.5h-13V8L9 7z" /><path d="M9 7c1 1 5 1 6 0" /><path d="M9.5 14h5v3h-5z" /></svg>
)
const BagIcon = (p) => (
  <svg viewBox="0 0 24 24" {...line} {...p}><rect x="3.5" y="8" width="17" height="12" rx="2" /><path d="M9 8V5.5h6V8" /><path d="M3.5 13h17" /></svg>
)

const CATS = [
  ['all', 'Barchasi', LayoutGrid],
  ['scrub', 'Kostyumlar', ScrubIcon],
  ['coat', 'Xalatlar', CoatIcon],
  ['cap', 'Bosh kiyimlar', CapIcon],
  ['shoe', 'Poyabzal', ShoeIcon],
  ['apron', 'Fartuklar', ApronIcon],
  ['accessory', 'Aksessuarlar', BagIcon],
]
const SORT_FN = {
  popular: (a, b) => b.reviews - a.reviews,
  cheap: (a, b) => a.price - b.price,
  rich: (a, b) => b.price - a.price,
  fresh: (a, b) => Number(!!b.fresh) - Number(!!a.fresh) || a.rank - b.rank,
  rating: (a, b) => b.rating - a.rating,
}
const PRICES = [['', 'Barchasi'], ['100000', '100 000 so‘mgacha'], ['300000', '300 000 so‘mgacha'], ['500000', '500 000 so‘mgacha']]
const EMPTY = { size: '', color: '', gender: '', price: '', fabric: '', brand: '' }

export const defaultSize = (p) => (p.sizes.includes('M') ? 'M' : p.sizes[0])
export const formaCartId = (p, color, size, logo = false) => `forma-${p.id}-${color}-${size}${logo ? '-logo' : ''}`
export const sizeLabel = (s) => (s === '2XL' ? 'XXL' : s)

const matches = (p, f) =>
  (!f.size || p.sizes.includes(f.size)) &&
  (!f.color || p.colors.includes(f.color)) &&
  (!f.gender || p.gender === f.gender || (p.gender === 'uni' && f.gender !== 'uni')) &&
  (!f.price || p.price <= Number(f.price)) &&
  (!f.fabric || p.fabric === f.fabric) &&
  (!f.brand || p.brand.toLowerCase() === f.brand.toLowerCase())

export default function MobileForma() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { items, add } = useCart()
  const [cat, setCat] = useState(() => params.get('cat') || 'all')
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState(() => ({ ...EMPTY, brand: params.get('brand') || '' }))
  const [sort, setSort] = useState('popular')
  const [sheet, setSheet] = useState(null)
  const [liked, setLiked] = useState(() => new Set())
  const [toast, setToast] = useState('')
  const closeToast = useCallback(() => setToast(''), [])
  const searchRef = useRef(null)
  const gridRef = useRef(null)

  const base = useMemo(() => {
    const s = q.trim().toLowerCase()
    return products
      .filter((p) => cat === 'all' || p.cat === cat)
      .filter((p) => !s || `${p.title} ${p.brand} ${p.about}`.toLowerCase().includes(s))
  }, [cat, q])
  const list = useMemo(() => base.filter((p) => matches(p, filter)).sort(SORT_FN[sort]), [base, filter, sort])
  const activeFilters = Object.keys(EMPTY).filter((k) => filter[k]).length

  const inCart = (p) => items.some((it) => it.id.startsWith(`forma-${p.id}-`))
  const quickAdd = (p) => {
    if (inCart(p)) return navigate('/savatcha', { state: { from: 'forma' } })
    const color = filter.color && p.colors.includes(filter.color) ? filter.color : p.colors[0]
    const size = filter.size && p.sizes.includes(filter.size) ? filter.size : defaultSize(p)
    add({ id: formaCartId(p, color, size), name: `${p.title} (${colorOf(color).name}, ${sizeLabel(size)})`, type: p.brand, price: p.price, image: p.image })
    setToast(`${p.title} savatga qo‘shildi`)
  }
  const toggleLike = (id) =>
    setLiked((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else { n.add(id); setToast('Sevimlilarga qo‘shildi') }
      return n
    })

  const pill = (key, label, value) => (
    <button key={key} type="button" onClick={() => setSheet(key)} className={`flex h-9 shrink-0 items-center gap-0.5 rounded-xl border px-2 text-[11.5px] font-medium ${value ? 'border-sea bg-sea-50 text-sea' : 'border-line bg-white text-ink'}`}>
      {value || label} <ChevronDown className="size-3.5" />
    </button>
  )

  return (
    <div className="min-h-screen bg-[#f6f9fb] pb-[86px]">
      <div className="px-3.5 pt-3">
        <MobileTopBar onSearch={() => searchRef.current?.focus()} onBell={() => setToast('Yangi bildirishnomalar yo‘q')} />
        <h1 className="mt-2.5 text-[24px] font-extrabold leading-tight tracking-tight text-[#0d2a4a]">Forma</h1>
        <p className="text-[12px] text-ink-2">Stomatologlar uchun professional kiyimlar</p>

        <div className="mt-3 flex gap-2">
          <label className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-2xl border border-line/70 bg-white px-3.5">
            <Search className="size-[18px] shrink-0 text-ink-2" />
            <input ref={searchRef} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Forma, brend yoki kategoriya..." className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-muted" />
            {q && <button type="button" onClick={() => setQ('')} aria-label="Tozalash" className="text-muted"><X className="size-4" /></button>}
          </label>
          <button type="button" onClick={() => setSheet('all')} aria-label="Filtrlar" className="relative grid size-11 shrink-0 place-items-center rounded-2xl border border-line/70 bg-white text-ink">
            <SlidersHorizontal className="size-[19px]" />
            {activeFilters > 0 && <span className="absolute -right-1 -top-1 grid size-[18px] place-items-center rounded-full bg-sea text-[10px] font-bold text-white ring-2 ring-[#f6f9fb]">{activeFilters}</span>}
          </button>
        </div>

        {/* Banner */}
        <div className="relative mt-3 h-[150px] overflow-hidden rounded-2xl bg-gradient-to-r from-[#e3f3f4] via-[#eaf5f7] to-[#d7ecf0]">
          <div className="absolute inset-y-0 right-0 flex w-[50%]">
            <img src="/images/forma/hero.jpg" alt="" className="h-full w-1/2 object-cover object-[50%_12%]" />
            <img src="/images/forma/man-teal.jpg" alt="" className="h-full w-1/2 object-cover object-[50%_10%]" />
          </div>
          <div className="absolute inset-y-0 left-0 w-[64%] bg-gradient-to-r from-[#e6f4f5] via-[#e6f4f5]/95 to-transparent" />
          <div className="relative flex h-full max-w-[64%] flex-col justify-center pl-3.5">
            <p className="text-[17px] font-extrabold leading-[1.15] text-[#0d2a4a]">Stomatologlar uchun <span className="block text-sea">zamonaviy forma</span></p>
            <p className="mt-1 max-w-[150px] text-[10.5px] leading-snug text-ink-2">Qulay, sifatli va professional ko‘rinish</p>
            <button type="button" onClick={() => { setSort('fresh'); setCat('all'); gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }} className="mt-2.5 flex h-9 w-fit items-center gap-1.5 rounded-xl bg-sea px-3.5 text-[12px] font-semibold text-white active:scale-[0.97]">
              Kolleksiyani ko‘rish <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Kategoriyalar */}
      <div className="mt-3 flex gap-2.5 overflow-x-auto px-3.5 pb-1 no-scrollbar">
        {CATS.map(([key, label, Icon]) => {
          const on = cat === key
          return (
            <button key={key} type="button" aria-pressed={on} onClick={() => setCat(on && key !== 'all' ? 'all' : key)} className="flex w-[60px] shrink-0 flex-col items-center gap-1">
              <span className={`grid size-[54px] place-items-center rounded-2xl transition ${on ? 'bg-sea text-white shadow-[0_6px_14px_-6px_rgb(11_138_149/0.7)]' : 'border border-line/70 bg-white text-[#1f5fa8]'}`}>
                <Icon className="size-[26px]" strokeWidth={1.5} />
              </span>
              <span className={`whitespace-nowrap text-[10.5px] ${on ? 'font-semibold text-sea' : 'text-ink-2'}`}>{label}</span>
            </button>
          )
        })}
      </div>

      {/* Filtrlar qatori */}
      <div ref={gridRef} className="mt-2 flex scroll-mt-2 gap-1 overflow-x-auto px-3.5 pb-1 no-scrollbar">
        {pill('size', 'O‘lcham', filter.size && sizeLabel(filter.size))}
        {pill('color', 'Rang', filter.color && colorOf(filter.color).name)}
        {pill('gender', 'Jins', filter.gender && genders.find(([k]) => k === filter.gender)[1])}
        {pill('price', 'Narx', filter.price && PRICES.find(([k]) => k === filter.price)[1])}
        <button type="button" onClick={() => setSheet('sort')} className="ml-auto flex h-9 shrink-0 items-center gap-1 rounded-xl border border-line bg-white px-2 text-[11.5px] font-medium text-ink">
          <ArrowUpDown className="size-3.5" /> {sort === 'popular' ? 'Saralash' : sorts[sort].replace('Narxi: ', '')}
        </button>
      </div>

      <div className="mt-2.5 px-3.5">
        {list.length ? (
          <div className="grid grid-cols-2 gap-2.5">
            {list.map((p) => (
              <FormaCard key={p.id} p={p} liked={liked.has(p.id)} onLike={() => toggleLike(p.id)} added={inCart(p)} onAdd={() => quickAdd(p)} />
            ))}
          </div>
        ) : (
          <div className="grid place-items-center rounded-2xl bg-white px-6 py-10 text-center">
            <p className="text-[14px] font-semibold text-ink">Mahsulot topilmadi</p>
            <p className="mt-1 text-[12px] text-muted">Qidiruv yoki filtrlarni o‘zgartirib ko‘ring</p>
            <button type="button" onClick={() => { setQ(''); setCat('all'); setFilter(EMPTY) }} className="mt-3 h-9 rounded-xl bg-sea-50 px-4 text-[12.5px] font-semibold text-sea">Filtrlarni tozalash</button>
          </div>
        )}
      </div>

      {sheet && sheet !== 'sort' && (
        <FilterSheet
          section={sheet}
          initial={filter}
          count={(f) => base.filter((p) => matches(p, f)).length}
          onClose={() => setSheet(null)}
          onApply={(f) => { setFilter(f); setSheet(null) }}
        />
      )}
      {sheet === 'sort' && (
        <BottomSheet title="Saralash" onClose={() => setSheet(null)}>
          <div className="mt-2 flex flex-col">
            {Object.entries(sorts).map(([k, l]) => (
              <button key={k} type="button" onClick={() => { setSort(k); setSheet(null) }} className="flex h-12 items-center justify-between border-b border-line text-[14px] text-ink last:border-0">
                {l} {sort === k && <Check className="size-5 text-sea" />}
              </button>
            ))}
          </div>
        </BottomSheet>
      )}

      <MobileToast
        text={toast}
        onClose={closeToast}
        action={toast.includes('savatga') ? <button type="button" onClick={() => navigate('/savatcha', { state: { from: 'forma' } })} className="shrink-0 text-[12.5px] font-semibold text-[#5fe0c8]">Savat</button> : null}
      />
      <MobileTabBar />
    </div>
  )
}

function FormaCard({ p, liked, onLike, added, onAdd }) {
  const sizes = p.sizes.filter((s) => ['S', 'M', 'L', 'XL'].includes(s))
  return (
    <Link to={`/forma/${p.id}`} className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_4px_rgb(11_31_58/0.07)] active:scale-[0.99]">
      <div className="relative h-[150px] bg-[#eef3f6]">
        <img src={p.image} alt={p.title} className="size-full object-cover object-[50%_18%]" />
        {p.fresh && <span className="absolute left-2 top-2 rounded-full bg-[#22b573] px-2 py-0.5 text-[10px] font-semibold text-white">Yangi</span>}
        {!p.fresh && p.off ? <span className="absolute left-2 top-2 rounded-full bg-sale px-2 py-0.5 text-[10px] font-semibold text-white">-{p.off}%</span> : null}
        <button type="button" onClick={(e) => { e.preventDefault(); onLike() }} aria-label="Sevimlilarga" aria-pressed={liked} className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-white/95 shadow-[0_1px_4px_rgb(11_31_58/0.15)]">
          <Heart className={`size-[15px] ${liked ? 'fill-sale text-sale' : 'text-ink'}`} strokeWidth={2} />
        </button>
      </div>
      <div className="flex flex-1 flex-col p-2">
        <p className="text-[10.5px] text-muted">{p.brand}</p>
        <h3 className="truncate text-[12.5px] font-bold text-[#0d2a4a]">{p.title}</h3>
        <p className="mt-0.5 flex items-center gap-1 text-[10.5px] text-ink-2">
          <Star className="size-3 fill-star text-star" /> <b className="font-semibold text-ink">{p.rating}</b> ({p.reviews} ta baho)
        </p>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="flex shrink-0 -space-x-0.5">
            {p.colors.slice(0, 4).map((c) => (
              <span key={c} title={colorOf(c).name} className="size-3.5 rounded-full border-2 border-white ring-1 ring-line" style={{ background: colorOf(c).hex }} />
            ))}
          </span>
          {sizes.length > 0 && <span className="truncate text-[9.5px] tracking-wide text-ink-2">{sizes.join('  ')}</span>}
        </div>
        <div className="mt-auto flex items-center justify-between gap-1 pt-1.5">
          <span className="whitespace-nowrap text-[14px] font-extrabold text-[#0d2a4a]">{money(p.price)}</span>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onAdd() }}
            aria-label={added ? 'Savatda' : 'Savatga qo‘shish'}
            className={`grid size-9 shrink-0 place-items-center rounded-xl active:scale-95 ${added ? 'bg-sea-50 text-sea ring-1 ring-sea/40' : 'bg-sea text-white'}`}
          >
            {added ? <Check className="size-[18px]" strokeWidth={2.4} /> : <ShoppingCart className="size-[17px]" />}
          </button>
        </div>
      </div>
    </Link>
  )
}

function Options({ title, options, value, onChange, swatch }) {
  return (
    <>
      <p className="mt-4 text-[13px] font-semibold text-ink">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map(([v, l]) => {
          const on = value === v
          return (
            <button key={v} type="button" aria-pressed={on} onClick={() => onChange(on ? '' : v)} className={`flex h-9 items-center gap-1.5 rounded-xl border px-3 text-[12.5px] font-medium ${on ? 'border-sea bg-sea-50 text-sea' : 'border-line text-ink'}`}>
              {swatch && <span className="size-4 rounded-full ring-1 ring-line" style={{ background: colorOf(v).hex }} />}
              {on && !swatch && <Check className="size-3.5" />} {l}
            </button>
          )
        })}
      </div>
    </>
  )
}

function FilterSheet({ section, initial, count, onClose, onApply }) {
  const [f, setF] = useState(initial)
  const patch = (p) => setF((x) => ({ ...x, ...p }))
  const show = (k) => section === 'all' || section === k
  const titles = { all: 'Filtrlar', size: 'O‘lcham', color: 'Rang', gender: 'Jins', price: 'Narx' }
  return (
    <BottomSheet
      title={titles[section]}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={() => setF(section === 'all' ? EMPTY : { ...f, [section]: '' })} className="h-12 rounded-xl border border-line px-4 text-[13.5px] font-semibold text-ink">Tozalash</button>
          <button type="button" onClick={() => onApply(f)} className="h-12 flex-1 rounded-xl bg-sea text-[14px] font-semibold text-white">{count(f)} ta mahsulotni ko‘rsatish</button>
        </>
      }
    >
      {show('size') && <Options title={section === 'all' ? 'O‘lcham' : ''} options={allSizes.map((s) => [s, sizeLabel(s)])} value={f.size} onChange={(size) => patch({ size })} />}
      {show('color') && <Options title={section === 'all' ? 'Rang' : ''} options={colors.map((c) => [c.id, c.name])} value={f.color} onChange={(color) => patch({ color })} swatch />}
      {show('gender') && <Options title={section === 'all' ? 'Jins' : ''} options={genders} value={f.gender} onChange={(gender) => patch({ gender })} />}
      {show('price') && <Options title={section === 'all' ? 'Narx' : ''} options={PRICES.slice(1)} value={f.price} onChange={(price) => patch({ price })} />}
      {section === 'all' && (
        <>
          <Options title="Mato" options={fabrics} value={f.fabric} onChange={(fabric) => patch({ fabric })} />
          <Options title="Brend" options={brands.map((b) => [b, b])} value={f.brand} onChange={(brand) => patch({ brand })} />
        </>
      )}
    </BottomSheet>
  )
}
