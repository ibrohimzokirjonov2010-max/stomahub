import { useState } from 'react'
import { ChevronUp, ChevronDown, Search, Check } from 'lucide-react'
import { categoryCounts as CATS, marketProducts } from '../../marketData'
import { useMarket } from '../../buyerApi'

function Box({ title, children }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border-b border-line px-3 py-2.5 last:border-0">
      <button onClick={() => setOpen(!open)} className="mb-1.5 flex w-full items-center justify-between text-[10.5px] font-bold text-ink">
        {title} <ChevronUp className={`size-3.5 text-muted transition ${open ? '' : 'rotate-180'}`} />
      </button>
      {open && children}
    </div>
  )
}

function CheckRow({ label, count, checked, onChange }) {
  return (
    <label className="flex h-[15.5px] cursor-pointer items-center gap-2 text-[9.5px] text-ink-2">
      <span className={`grid size-[10px] place-items-center rounded-[3px] border ${checked ? 'border-sea bg-sea' : 'border-[#c3ccd8] bg-white'}`}>
        {checked && <Check className="size-2 text-white" strokeWidth={4} />}
      </span>
      <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
      <span className="flex-1">{label}</span>
      <span className="text-muted">{count}</span>
    </label>
  )
}

export default function FilterPanel({ filters, setFilters }) {
  const [brandQuery, setBrandQuery] = useState('')
  const [showAll, setShowAll] = useState(false)

  const toggle = (key, value) =>
    setFilters((f) => {
      const list = f[key]
      return { ...f, [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] }
    })

  useMarket()
  const categoryCounts = CATS.map(([key, label]) => [key, label, key === 'all' ? marketProducts.length : marketProducts.filter((p) => p.cat === key).length])
  const brandMap = {}
  marketProducts.forEach((p) => { if (p.brand) brandMap[p.brand] = (brandMap[p.brand] || 0) + 1 })
  const shownBrands = Object.entries(brandMap)
    .filter(([b]) => b.toLowerCase().includes(brandQuery.toLowerCase()))
    .slice(0, showAll ? undefined : 8)

  return (
    <aside className="h-fit rounded-xl bg-white shadow-card">
      <Box title="Kategoriya">
        {categoryCounts.map(([key, label, count]) => (
          <CheckRow
            key={key}
            label={label}
            count={count}
            checked={key === 'all' ? filters.cats.length === 0 : filters.cats.includes(key)}
            onChange={() => (key === 'all' ? setFilters((f) => ({ ...f, cats: [] })) : toggle('cats', key))}
          />
        ))}
      </Box>

      <Box title="Brend">
        <div className="mb-1.5 flex h-[20px] items-center gap-1.5 rounded-md bg-[#f3f6fa] px-2">
          <Search className="size-[10px] text-muted" />
          <input
            value={brandQuery}
            onChange={(e) => setBrandQuery(e.target.value)}
            placeholder="Brend qidirish..."
            className="w-full bg-transparent text-[9px] outline-none placeholder:text-muted"
          />
        </div>
        {shownBrands.map(([b, n]) => (
          <CheckRow key={b} label={b} count={n} checked={filters.brands.includes(b)} onChange={() => toggle('brands', b)} />
        ))}
        <button onClick={() => setShowAll(!showAll)} className="mt-1 flex items-center gap-1 text-[9px] font-medium text-sea">
          {showAll ? 'Kamroq' : 'Yana ko‘rsatish'} <ChevronDown className={`size-3 transition ${showAll ? 'rotate-180' : ''}`} />
        </button>
      </Box>

      <Box title="Narx oralig‘i (so‘m)">
        <div className="grid grid-cols-2 gap-1">
          {['min', 'max'].map((k) => (
            <input
              key={k}
              inputMode="numeric"
              value={filters[k].toLocaleString('ru-RU').replace(/ /g, ' ')}
              onChange={(e) => setFilters((f) => ({ ...f, [k]: Number(e.target.value.replace(/\D/g, '')) }))}
              className="h-[21px] w-full min-w-0 rounded-md border border-line px-1.5 text-[8.5px] text-ink-2 outline-none focus:border-sea"
            />
          ))}
        </div>
        <div className="relative mx-1 mb-1 mt-3 h-[3px] rounded-full bg-sea">
          <span className="absolute -left-1 -top-[3px] size-[9px] rounded-full border-2 border-sea bg-white" />
          <span className="absolute -right-1 -top-[3px] size-[9px] rounded-full border-2 border-sea bg-white" />
        </div>
      </Box>

      <Box title="Mavjudligi">
        <CheckRow label="Omborda bor" count={marketProducts.filter((p) => Number(p.stock) > 0).length} checked={filters.inStock} onChange={() => setFilters((f) => ({ ...f, inStock: !f.inStock }))} />
        <CheckRow label="Buyurtma asosida" count={marketProducts.filter((p) => !(Number(p.stock) > 0)).length} checked={false} onChange={() => {}} />
      </Box>

    </aside>
  )
}
