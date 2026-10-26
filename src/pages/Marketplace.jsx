import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  LayoutGrid, PenTool, Hash, Syringe, Pipette, Wrench, Scissors, Microwave, Sparkles, SlidersHorizontal, ChevronDown, Star,
} from 'lucide-react'
import ProductCard from '../components/market/ProductCard'
import FilterPanel from '../components/market/FilterPanel'
import CartPanel from '../components/market/CartPanel'
import { filterChips, marketProducts } from '../marketData'
import { loadMarketProducts, useMarket } from '../buyerApi'

const chipIcons = { all: LayoutGrid, komp: PenTool, bond: Hash, endo: Syringe, impl: Pipette, uch: Wrench, asb: Scissors, usk: Microwave, gig: Sparkles }

const sorts = {
  popular: { label: 'Ommabop', fn: () => 0 },
  cheap: { label: 'Arzonroq', fn: (a, b) => a.price - b.price },
  expensive: { label: 'Qimmatroq', fn: (a, b) => b.price - a.price },
  rating: { label: 'Reyting', fn: (a, b) => b.rating - a.rating },
}

const initialFilters = { cats: [], brands: [], min: 0, max: 50000000, inStock: true, official: false }

export default function Marketplace() {
  const market = useMarket()
  const [params] = useSearchParams()
  const initialCat = params.get('cat')
  const initialBrand = params.get('brand')
  const [filters, setFilters] = useState({
    ...initialFilters,
    cats: initialCat ? [initialCat] : [],
    brands: initialBrand ? [initialBrand] : [],
  })
  const [sort, setSort] = useState('popular')
  const [showFilters, setShowFilters] = useState(true)

  const chip = filters.cats.length === 1 ? filters.cats[0] : filters.cats.length === 0 ? 'all' : null

  const list = useMemo(
    () =>
      marketProducts
        .filter((p) => !filters.cats.length || filters.cats.includes(p.cat))
        .filter((p) => !filters.brands.length || filters.brands.includes(p.brand))
        .filter((p) => p.price >= filters.min && p.price <= filters.max)
        .sort(sorts[sort].fn),
    [filters, sort, market.status],
  )

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_224px]">
      <div className="min-w-0 pt-4 lg:pl-1.5">
        <h1 className="text-[21px] font-extrabold tracking-tight text-ink">Stomatologik mahsulotlar</h1>
        <p className="text-[12px] text-ink-2">Sifatli materiallar, zamonaviy asboblar va ishonchli brendlar – StomaHub’da</p>

        {/* Kategoriya chiplari */}
        <div className="-mx-4 mt-3.5 flex gap-1.5 overflow-x-auto px-4 pb-1 no-scrollbar lg:mx-0 lg:px-0">
          {filterChips.map(({ key, label }) => {
            const Icon = chipIcons[key]
            const active = chip === key
            return (
              <button
                key={key}
                onClick={() => setFilters((f) => ({ ...f, cats: key === 'all' ? [] : [key] }))}
                className={`flex h-[31px] shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[9.5px] xl:min-w-0 xl:shrink font-medium shadow-card transition ${
                  active ? 'bg-sea px-4 text-white' : 'bg-white text-ink hover:text-sea'
                } ${key === 'all' ? 'min-w-[82px] justify-center' : 'justify-center xl:flex-1'}`}
              >
                <Icon className="size-[15px] shrink-0" strokeWidth={1.6} /> {label}
              </button>
            )
          })}
        </div>

        {/* Filtrlar qatori */}
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex h-[27px] shrink-0 items-center gap-2 rounded-lg bg-sea-50 px-3 text-[10.5px] font-semibold text-sea-600"
          >
            <SlidersHorizontal className="size-[15px]" /> Filtrlar
          </button>
          {[['Brend', 82], ['Narx oralig‘i (so‘m)', 140], ['Mavjudligi', 92], ['Rasmiy distribyutor', 128]].map(([l, w]) => (
            <Dropdown key={l} label={l} style={{ minWidth: w }} />
          ))}
          <Dropdown label={<><Star className="size-3.5 fill-star text-star" /> Reyting</>} style={{ minWidth: 80 }} />

          <div className="ml-auto flex shrink-0 items-center gap-2 pl-2">
            <span className="text-[9px] text-muted">Saralash:</span>
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="h-[27px] appearance-none rounded-lg bg-white pl-3 pr-7 text-[10px] font-medium text-ink shadow-card outline-none"
              >
                {Object.entries(sorts).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-ink-2" />
            </div>
          </div>
        </div>

        <div className={`mt-3 grid gap-2 ${showFilters ? 'md:grid-cols-[142px_minmax(0,1fr)]' : ''}`}>
          {showFilters && <div className="hidden md:block"><FilterPanel filters={filters} setFilters={setFilters} /></div>}
          <div>
            {market.status === 'loading' && !list.length ? (
              <div className="grid h-[200px] place-items-center rounded-xl bg-white text-[11px] text-muted shadow-card">Mahsulotlar yuklanmoqda…</div>
            ) : market.status === 'error' ? (
              <div className="grid h-[200px] place-items-center rounded-xl bg-white text-center text-[11px] text-[#b42318] shadow-card">
                <div>{market.error}<br /><button type="button" onClick={loadMarketProducts} className="mt-2 font-semibold text-sea">Qayta urinish</button></div>
              </div>
            ) : list.length ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {list.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            ) : (
              <div className="grid h-[200px] place-items-center rounded-xl bg-white text-[11px] text-muted shadow-card">
                {marketProducts.length ? 'Bu filtr bo‘yicha mahsulot topilmadi' : 'Hozircha sotuvda mahsulot yo‘q'}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="xl:sticky xl:top-[54px] xl:h-fit xl:pt-2">
        <CartPanel />
      </div>
    </div>
  )
}

function Dropdown({ label, style }) {
  return (
    <button style={style} className="flex h-[27px] shrink-0 items-center justify-between gap-3 rounded-lg bg-white px-3 text-[10px] text-ink-2 shadow-card hover:text-sea">
      <span className="flex items-center gap-1.5">{label}</span> <ChevronDown className="size-3.5" />
    </button>
  )
}
