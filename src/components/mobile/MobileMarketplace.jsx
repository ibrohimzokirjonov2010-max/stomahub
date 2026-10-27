import { useCallback, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Search, X, ChevronRight, ChevronDown, Box, Scissors, Monitor, FlaskConical, Sparkles, SlidersHorizontal, ArrowUpDown,
  LayoutGrid, List, Heart, Star, ShoppingCart, Check,
} from 'lucide-react'
import { useCart } from '../../cart'
import { marketProducts, som } from '../../marketData'
import { useMarket } from '../../buyerApi'
import { profileStore, useProfile } from '../../profileStore'
import { ToothIcon } from '../icons'
import MobileTabBar from './MobileTabBar'
import { MobileTopBar, MobileToast, GiftArt, QtyStepper, GoCartButton } from './parts'

const GROUPS = [
  { key: 'mat', label: 'Materiallar', icon: Box, cats: ['komp', 'bond', 'endo'] },
  { key: 'impl', label: 'Implantlar', icon: ToothIcon, cats: ['impl'] },
  { key: 'asb', label: 'Asboblar', icon: Scissors, cats: ['asb', 'uch'] },
  { key: 'jih', label: 'Jihozlar', icon: Monitor, cats: ['usk'] },
  { key: 'lab', label: 'Laboratoriya', icon: FlaskConical, cats: ['lab'] },
  { key: 'gig', label: 'Gigiyena', icon: Sparkles, cats: ['gig'] },
]

const SORTS = {
  cheap: { label: 'Arzonroq', fn: (a, b) => a.price - b.price },
  expensive: { label: 'Qimmatroq', fn: (a, b) => b.price - a.price },
  rating: { label: 'Reyting', fn: (a, b) => b.rating - a.rating },
  popular: { label: 'Ommabop', fn: (a, b) => b.reviews - a.reviews },
}

const PRICE_MAX = 50000000
const EMPTY = { brands: [], min: 0, max: PRICE_MAX, inStock: true, sale: false }
const PRICE_PRESETS = [['500 ming gacha', 0, 500000], ['0.5–2 mln', 500000, 2000000], ['2–10 mln', 2000000, 10000000], ['10 mln+', 10000000, PRICE_MAX]]

const groupOfCat = (cat) => GROUPS.find((g) => g.cats.includes(cat))?.key

export default function MobileMarketplace() {
  const market = useMarket()
  const BRANDS = [...new Set(market.products.map((p) => p.brand).filter(Boolean))]
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { add, items, setQty, remove } = useCart()
  const qtyOf = (id) => items.find((it) => it.id === id)?.qty || 0
  const dec = (id) => (qtyOf(id) > 1 ? setQty(id, qtyOf(id) - 1) : remove(id))
  const [group, setGroup] = useState(() => (params.get('cat') ? groupOfCat(params.get('cat')) || null : null))
  const [query, setQuery] = useState(() => params.get('q') || '')
  const [filters, setFilters] = useState(() => ({ ...EMPTY, brands: params.get('brand') ? [params.get('brand')] : [] }))
  const [sheet, setSheet] = useState(false)
  const [sort, setSort] = useState('cheap')
  const [view, setView] = useState('grid')
  const profile = useProfile()
  const liked = Object.fromEntries((profile.favProducts || []).map((id) => [id, true]))
  const [toast, setToast] = useState('')
  const closeToast = useCallback(() => setToast(''), [])
  const inputRef = useRef(null)

  const apply = useCallback((f, q, g) => {
    const cats = GROUPS.find((x) => x.key === g)?.cats
    const text = q.trim().toLowerCase()
    return marketProducts
      .filter((p) => !cats || cats.includes(p.cat))
      .filter((p) => !text || `${p.name} ${p.brand} ${p.type}`.toLowerCase().includes(text))
      .filter((p) => !f.brands.length || f.brands.includes(p.brand))
      .filter((p) => p.price >= f.min && p.price <= f.max)
      .filter((p) => !f.sale || p.oldPrice)
  }, [])

  const list = useMemo(() => apply(filters, query, group).sort(SORTS[sort].fn), [apply, filters, query, group, sort, market.status])
  const activeCount = (filters.brands.length ? 1 : 0) + (filters.min > 0 || filters.max < PRICE_MAX ? 1 : 0) + (filters.inStock ? 1 : 0) + (filters.sale ? 1 : 0)

  const addToCart = (p) => {
    add(p)
    setToast(`${p.name} savatga qo‘shildi`)
  }
  const toggleLike = (id) => profileStore.toggleFav('favProducts', id)

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#eef7f8] via-page to-page pb-[86px]">
      <div className="px-3.5 pt-3">
        <MobileTopBar onSearch={() => inputRef.current?.focus()} onBell={() => setToast('Yangi bildirishnomalar yo‘q')} />

        <label className="mt-3 flex h-11 items-center gap-2.5 rounded-xl bg-white px-3.5 shadow-[0_1px_4px_rgb(11_31_58/0.07)]">
          <Search className="size-[18px] shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Stomatologga nima kerak?"
            className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-muted"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Tozalash" className="grid size-5 place-items-center rounded-full bg-page text-muted">
              <X className="size-3" />
            </button>
          )}
        </label>

        <Link to="/aksiyalar" className="mt-3 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#d9f2ef] to-[#e8f7f5] py-2 pl-1.5 pr-3">
          <GiftArt className="h-[44px] w-[54px] shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold text-ink">10 000 so‘m bonus oling!</p>
            <p className="line-clamp-2 text-[10px] leading-snug text-ink-2">Ilovada ro‘yxatdan o‘ting va birinchi xaridingizda foydalaning.</p>
          </div>
          <ChevronRight className="size-5 shrink-0 text-ink" />
        </Link>
      </div>

      {/* Kategoriyalar */}
      <div className="mt-3 flex gap-2 overflow-x-auto px-3.5 pb-1 no-scrollbar">
        {GROUPS.map(({ key, label, icon: Icon }) => {
          const on = group === key
          return (
            <button
              key={key}
              type="button"
              aria-pressed={on}
              onClick={() => setGroup(on ? null : key)}
              className={`flex h-10 shrink-0 items-center gap-2 rounded-xl px-3.5 text-[12.5px] font-medium transition ${on ? 'bg-sea text-white shadow-[0_4px_12px_rgb(11_138_149/0.28)]' : 'bg-white text-ink shadow-[0_1px_3px_rgb(11_31_58/0.07)]'}`}
            >
              <Icon className="size-[17px]" strokeWidth={1.7} /> {label}
            </button>
          )
        })}
      </div>

      <div className="px-3.5">
        {/* Asboblar paneli */}
        <div className="mt-3 flex items-center gap-1.5">
          <button type="button" onClick={() => setSheet(true)} className="relative flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-white px-3 text-[13px] font-medium text-ink shadow-[0_1px_3px_rgb(11_31_58/0.07)]">
            <SlidersHorizontal className="size-[17px]" /> Filtrlar
            {activeCount > 0 && <span className="absolute -right-1.5 -top-1.5 grid size-[18px] place-items-center rounded-full bg-hub text-[10px] font-bold text-white">{activeCount}</span>}
          </button>
          <span className="ml-1 min-w-0 flex-1 truncate text-[12px] text-muted">{list.length} ta natija</span>
          <label className="relative flex h-10 shrink-0 items-center rounded-xl bg-white shadow-[0_1px_3px_rgb(11_31_58/0.07)]">
            <ArrowUpDown className="pointer-events-none absolute left-2 size-[15px] text-ink" />
            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Saralash" className="h-full w-[108px] appearance-none truncate rounded-xl bg-transparent pl-[26px] pr-[20px] text-[11.5px] font-medium text-ink outline-none">
              {Object.entries(SORTS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-1.5 size-4 text-ink-2" />
          </label>
          <div className="flex shrink-0 rounded-xl bg-white p-0.5 shadow-[0_1px_3px_rgb(11_31_58/0.07)]">
            {[['grid', LayoutGrid], ['list', List]].map(([v, Icon]) => (
              <button key={v} type="button" onClick={() => setView(v)} aria-label={v === 'grid' ? 'Panjara ko‘rinishi' : 'Ro‘yxat ko‘rinishi'} aria-pressed={view === v} className={`grid size-9 place-items-center rounded-[10px] ${view === v ? 'bg-sea text-white' : 'text-ink-2'}`}>
                <Icon className="size-[17px]" />
              </button>
            ))}
          </div>
        </div>

        {/* Mahsulotlar */}
        {market.status === 'loading' && !list.length ? (
          <p className="mt-3 rounded-2xl bg-white px-6 py-10 text-center text-[13px] text-muted">Mahsulotlar yuklanmoqda…</p>
        ) : market.status === 'error' ? (
          <p className="mt-3 rounded-2xl bg-[#fff4f4] px-6 py-10 text-center text-[13px] text-[#b42318]">{market.error}</p>
        ) : list.length === 0 ? (
          <div className="mt-3 rounded-2xl bg-white px-6 py-10 text-center shadow-[0_1px_4px_rgb(11_31_58/0.06)]">
            <p className="text-[14px] font-semibold text-ink">{marketProducts.length ? 'Mahsulot topilmadi' : 'Hozircha sotuvda mahsulot yo‘q'}</p>
            <p className="mt-1 text-[12px] text-muted">Boshqa kategoriya yoki filtrni tanlab ko‘ring</p>
            <button type="button" onClick={() => { setGroup(null); setQuery(''); setFilters(EMPTY) }} className="mt-4 h-10 rounded-xl bg-sea px-5 text-[13px] font-semibold text-white">
              Filtrlarni tozalash
            </button>
          </div>
        ) : view === 'grid' ? (
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {list.map((p) => (
              <article key={p.id} className="relative flex flex-col rounded-2xl bg-white p-2.5 shadow-[0_1px_4px_rgb(11_31_58/0.06)]">
                <Discount p={p} className="absolute left-2.5 top-2.5 z-10" />
                <LikeBtn on={liked[p.id]} onClick={() => toggleLike(p.id)} className="absolute right-2 top-2 z-10" />
                <Link to={`/product/${p.id}`} className="block">
                  <div className="h-[118px] overflow-hidden rounded-xl bg-[#f6f8fb]">
                    <img src={p.image} alt={p.name} className="size-full object-contain mix-blend-multiply" />
                  </div>
                  <p className="mt-2 text-[11px] text-muted">{p.brand}</p>
                  <p className="truncate text-[14px] font-bold text-ink">{p.name}</p>
                  <p className="truncate text-[11px] text-muted">{p.type}</p>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-muted">
                    <Star className="size-3.5 fill-star text-star" /> <b className="font-semibold text-ink">{p.rating}</b> ({p.reviews} ta baho)
                  </p>
                  <div className="mt-1 flex flex-wrap items-center justify-between gap-x-1 gap-y-0.5">
                    <p className={`whitespace-nowrap font-extrabold text-ink ${p.price >= 10000000 ? 'text-[13.5px]' : 'text-[15px]'}`}>{som(p.price)}</p>
                    <span className="shrink-0 rounded-md bg-[#e6f6ee] px-1.5 py-0.5 text-[10px] font-medium text-ok">Sotuvda</span>
                  </div>
                  <p className="h-4 text-[11px] text-muted line-through">{p.oldPrice ? som(p.oldPrice) : ''}</p>
                </Link>
                {qtyOf(p.id) ? (
                  <div className="mt-2 flex h-10 gap-1.5">
                    <QtyStepper value={qtyOf(p.id)} onDec={() => dec(p.id)} onInc={() => setQty(p.id, qtyOf(p.id) + 1)} className="w-[88px] shrink-0" />
                    <GoCartButton className="min-w-0 flex-1" />
                  </div>
                ) : (
                  <button type="button" onClick={() => addToCart(p)} className="mt-2 flex h-10 items-center justify-center gap-2 rounded-xl border border-sea/70 text-[13px] font-semibold text-sea active:bg-sea-50">
                    <ShoppingCart className="size-[17px]" /> Savatga
                  </button>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-3 space-y-2.5">
            {list.map((p) => (
              <article key={p.id} className="relative flex gap-3 rounded-2xl bg-white p-2.5 shadow-[0_1px_4px_rgb(11_31_58/0.06)]">
                <Link to={`/product/${p.id}`} className="relative h-[104px] w-[104px] shrink-0 overflow-hidden rounded-xl bg-[#f6f8fb]">
                  <img src={p.image} alt={p.name} className="size-full object-contain mix-blend-multiply" />
                  <Discount p={p} className="absolute left-1.5 top-1.5" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link to={`/product/${p.id}`} className="block pr-8">
                    <p className="text-[11px] text-muted">{p.brand}</p>
                    <p className="truncate text-[14px] font-bold text-ink">{p.name}</p>
                    <p className="truncate text-[11px] text-muted">{p.type}</p>
                  </Link>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-muted">
                    <Star className="size-3.5 fill-star text-star" /> <b className="font-semibold text-ink">{p.rating}</b> ({p.reviews})
                    <span className="ml-1 rounded-md bg-[#e6f6ee] px-1.5 py-0.5 text-[10px] font-medium text-ok">Sotuvda</span>
                  </p>
                  <div className="mt-1 flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      <p className="whitespace-nowrap text-[15px] font-extrabold text-ink">{som(p.price)}</p>
                      {p.oldPrice && <p className="text-[11px] text-muted line-through">{som(p.oldPrice)}</p>}
                    </div>
                    {!qtyOf(p.id) && (
                      <button type="button" onClick={() => addToCart(p)} aria-label="Savatga qo‘shish" className="grid size-10 shrink-0 place-items-center rounded-xl bg-sea text-white active:scale-95">
                        <ShoppingCart className="size-[18px]" />
                      </button>
                    )}
                  </div>
                  {qtyOf(p.id) > 0 && (
                    <div className="mt-1.5 flex h-9 gap-1.5">
                      <QtyStepper value={qtyOf(p.id)} onDec={() => dec(p.id)} onInc={() => setQty(p.id, qtyOf(p.id) + 1)} className="w-[96px] shrink-0" />
                      <GoCartButton className="min-w-0 flex-1" />
                    </div>
                  )}
                </div>
                <LikeBtn on={liked[p.id]} onClick={() => toggleLike(p.id)} className="absolute right-2 top-2" />
              </article>
            ))}
          </div>
        )}
      </div>

      {sheet && (
        <FilterSheet
          initial={filters}
          count={(f) => apply(f, query, group).length}
          onClose={() => setSheet(false)}
          onApply={(f) => { setFilters(f); setSheet(false) }}
        />
      )}

      <MobileToast
        text={toast}
        onClose={closeToast}
        action={<button type="button" onClick={() => navigate('/buyurtma', { state: { from: 'market' } })} className="shrink-0 text-[12.5px] font-semibold text-[#5fe0c8]">Savat</button>}
      />
      <MobileTabBar />
    </div>
  )
}

function Discount({ p, className = '' }) {
  if (!p.badge) return null
  const isNew = p.badge === 'Yangi'
  return (
    <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${isNew ? 'bg-sea-50 text-sea' : 'bg-[#fde7ea] text-sale'} ${className}`}>{p.badge}</span>
  )
}

function LikeBtn({ on, onClick, className = '' }) {
  return (
    <button type="button" onClick={onClick} aria-label="Sevimlilarga qo‘shish" aria-pressed={!!on} className={`grid size-8 place-items-center rounded-full bg-white text-ink-2 shadow-[0_1px_3px_rgb(11_31_58/0.1)] ${className}`}>
      <Heart className={`size-[17px] ${on ? 'fill-sale text-sale' : ''}`} />
    </button>
  )
}

function FilterSheet({ initial, count, onClose, onApply }) {
  const [f, setF] = useState(initial)
  const patch = (p) => setF((x) => ({ ...x, ...p }))
  const n = count(f)
  const toggleBrand = (b) => patch({ brands: f.brands.includes(b) ? f.brands.filter((x) => x !== b) : [...f.brands, b] })
  const num = (v) => Math.max(0, Number(String(v).replace(/\D/g, '')) || 0)

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end bg-ink/45" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Filtrlar" onClick={(e) => e.stopPropagation()} className="flex max-h-[88dvh] flex-col rounded-t-3xl bg-white">
        <div className="flex items-center justify-between px-4 pb-2 pt-3">
          <span className="w-14" />
          <span className="h-1 w-10 rounded-full bg-line" />
          <button type="button" onClick={onClose} aria-label="Yopish" className="ml-auto grid size-8 place-items-center rounded-full bg-page text-ink">
            <X className="size-4" />
          </button>
        </div>
        <h2 className="px-4 text-[18px] font-bold text-ink">Filtrlar</h2>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          <p className="mt-4 text-[13px] font-semibold text-ink">Brend</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {BRANDS.map((b) => {
              const on = f.brands.includes(b)
              return (
                <button key={b} type="button" aria-pressed={on} onClick={() => toggleBrand(b)} className={`flex h-9 items-center gap-1.5 rounded-xl border px-3 text-[12.5px] font-medium ${on ? 'border-sea bg-sea-50 text-sea' : 'border-line text-ink'}`}>
                  {on && <Check className="size-3.5" />} {b}
                </button>
              )
            })}
          </div>

          <p className="mt-5 text-[13px] font-semibold text-ink">Narx oralig‘i (so‘m)</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {[['min', 'dan'], ['max', 'gacha']].map(([k, suf]) => (
              <label key={k} className="flex h-11 items-center gap-2 rounded-xl border border-line px-3">
                <input
                  inputMode="numeric"
                  value={f[k] === PRICE_MAX && k === 'max' ? '' : f[k] ? f[k].toLocaleString('ru-RU') : ''}
                  onChange={(e) => patch({ [k]: k === 'max' && !e.target.value ? PRICE_MAX : num(e.target.value) })}
                  placeholder={k === 'min' ? '0' : 'Cheksiz'}
                  className="min-w-0 flex-1 bg-transparent text-[13.5px] text-ink outline-none"
                />
                <span className="text-[11.5px] text-muted">{suf}</span>
              </label>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {PRICE_PRESETS.map(([l, min, max]) => {
              const on = f.min === min && f.max === max
              return (
                <button key={l} type="button" onClick={() => patch(on ? { min: 0, max: PRICE_MAX } : { min, max })} className={`h-8 rounded-lg px-2.5 text-[12px] font-medium ${on ? 'bg-sea text-white' : 'bg-page text-ink-2'}`}>
                  {l}
                </button>
              )
            })}
          </div>

          <div className="mt-5 divide-y divide-line rounded-2xl border border-line">
            {[['inStock', 'Faqat sotuvdagilar'], ['sale', 'Faqat chegirmadagilar']].map(([k, l]) => (
              <label key={k} className="flex items-center justify-between px-3.5 py-3 text-[13.5px] text-ink">
                {l}
                <input type="checkbox" checked={f[k]} onChange={(e) => patch({ [k]: e.target.checked })} className="peer sr-only" />
                <span className={`relative h-6 w-11 rounded-full transition ${f[k] ? 'bg-sea' : 'bg-line'}`}>
                  <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${f[k] ? 'left-[22px]' : 'left-0.5'}`} />
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-2 border-t border-line px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3">
          <button type="button" onClick={() => setF({ brands: [], min: 0, max: PRICE_MAX, inStock: false, sale: false })} className="h-12 rounded-xl border border-line px-4 text-[13.5px] font-semibold text-ink">
            Tozalash
          </button>
          <button type="button" onClick={() => onApply(f)} className="h-12 flex-1 rounded-xl bg-sea text-[14px] font-semibold text-white">
            {n} ta natijani ko‘rsatish
          </button>
        </div>
      </div>
    </div>
  )
}
