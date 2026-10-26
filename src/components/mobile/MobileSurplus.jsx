import { useCallback, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Search, SlidersHorizontal, LayoutGrid, ChevronDown, Heart, MapPin, X, Check, Camera, ImagePlus } from 'lucide-react'
import { surplusChips, surplusItems, cities, addSurplusItem } from '../../surplusData'
import { som } from '../../marketData'
import { MobileTopBar, MobileToast } from './parts'
import MobileTabBar from './MobileTabBar'

const expiryKey = (e) => { const [m, y] = e.split('/'); return Number(y) * 12 + Number(m) }
const SORTS = {
  new: { label: 'Eng yangi', fn: (a, b) => a.order - b.order },
  cheap: { label: 'Arzonroq', fn: (a, b) => a.price - b.price },
  expensive: { label: 'Qimmatroq', fn: (a, b) => b.price - a.price },
  expiry: { label: 'Muddati uzoq', fn: (a, b) => expiryKey(b.expiry) - expiryKey(a.expiry) },
}
const PRICE_MAX = 50000000
const EMPTY = { city: '', cond: '', expiry: '', max: PRICE_MAX }
const PRICE_PRESETS = [['500 ming gacha', 500000], ['1 mln gacha', 1000000], ['3 mln gacha', 3000000]]

export const condLabel = (c) => (c === 'Ochilgan' ? 'Ochilgan, yaroqli' : 'Yangi, ochilmagan')
export const expiryLabel = (e) => e.replace('/', '.')
const volume = (p) => p.type?.match(/\(([^)]+)\)/)?.[1] || p.type || p.name.match(/\(([^)]+)\)/)?.[1] || ''

const matchesFilter = (p, f) =>
  (!f.city || p.city === f.city) &&
  (!f.cond || p.condition === f.cond) &&
  (!f.expiry || Number(p.expiry.split('/')[1]) >= Number(f.expiry)) &&
  p.price <= f.max

export default function MobileSurplus() {
  const [params] = useSearchParams()
  const [cat, setCat] = useState(() => params.get('cat') || 'all')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('new')
  const [filter, setFilter] = useState(EMPTY)
  const [sheet, setSheet] = useState(null)
  const [liked, setLiked] = useState(() => new Set())
  const [toast, setToast] = useState('')
  const [version, setVersion] = useState(0)
  const closeToast = useCallback(() => setToast(''), [])

  const base = useMemo(() => {
    const s = q.trim().toLowerCase()
    return surplusItems
      .filter((p) => cat === 'all' || p.cat === cat)
      .filter((p) => !s || `${p.name} ${p.brand} ${p.type}`.toLowerCase().includes(s))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat, q, version])
  const list = useMemo(() => base.filter((p) => matchesFilter(p, filter)).sort(SORTS[sort].fn), [base, filter, sort])
  const activeFilters = Object.keys(EMPTY).filter((k) => filter[k] !== EMPTY[k]).length

  const toggleLike = (id) =>
    setLiked((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else { n.add(id); setToast('Saqlanganlarga qo‘shildi') }
      return n
    })

  return (
    <div className="min-h-screen bg-page pb-[86px]">
      <div className="px-3.5 pt-3">
        <MobileTopBar search={false} />

        <div className="mt-3 flex items-center justify-between gap-3">
          <h1 className="min-w-0 truncate text-[22px] font-extrabold leading-tight tracking-tight text-ink">Ortiqcha material</h1>
          <button type="button" onClick={() => setSheet('post')} className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-sea px-4 text-[13px] font-semibold text-white shadow-[0_6px_16px_-6px_rgb(11_138_149/0.7)] active:scale-[0.97]">
            <Plus className="size-[18px]" strokeWidth={2.4} /> E’lon berish
          </button>
        </div>
        <p className="-mt-0.5 text-[11px] leading-snug text-ink-2">Stomatologlarning ortiqcha, ishlatilmayotgan materiallari</p>

        <div className="mt-3 flex gap-2">
          <label className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-2xl bg-white px-3.5 shadow-[0_1px_4px_rgb(11_31_58/0.06)]">
            <Search className="size-[18px] shrink-0 text-ink-2" />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Material, brend, nom, model..." className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-muted" />
            {q && (
              <button type="button" onClick={() => setQ('')} aria-label="Tozalash" className="text-muted"><X className="size-4" /></button>
            )}
          </label>
          <button type="button" onClick={() => setSheet('filter')} aria-label="Filtrlar" className="relative grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-ink shadow-[0_1px_4px_rgb(11_31_58/0.06)]">
            <SlidersHorizontal className="size-[19px]" />
            {activeFilters > 0 && <span className="absolute -right-1 -top-1 grid size-[18px] place-items-center rounded-full bg-sea text-[10px] font-bold text-white ring-2 ring-page">{activeFilters}</span>}
          </button>
        </div>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto px-3.5 pb-1 no-scrollbar">
        {surplusChips.map(({ key, label }) => {
          const on = cat === key
          return (
            <button key={key} type="button" aria-pressed={on} onClick={() => setCat(on && key !== 'all' ? 'all' : key)} className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[12px] font-medium transition ${on ? 'bg-sea text-white' : 'bg-white text-ink shadow-[0_1px_3px_rgb(11_31_58/0.06)]'}`}>
              {key === 'all' && <LayoutGrid className="size-3.5" />} {label}
            </button>
          )
        })}
      </div>

      <div className="mt-2.5 flex items-center justify-between px-3.5">
        <p className="text-[13px] font-semibold text-ink">{list.length} ta e’lon</p>
        <label className="relative flex h-8 items-center gap-1 rounded-lg border border-line bg-white pl-2.5 pr-2 text-[11.5px] text-ink-2">
          Saralash: <b className="font-semibold text-ink">{SORTS[sort].label}</b>
          <ChevronDown className="size-3.5 text-ink-2" />
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Saralash" className="absolute inset-0 opacity-0">
            {Object.entries(SORTS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-2.5 px-3.5">
        {list.length ? (
          <div className="grid grid-cols-2 gap-2.5">
            {list.map((p) => <SurplusCard key={p.id} p={p} liked={liked.has(p.id)} onLike={() => toggleLike(p.id)} />)}
          </div>
        ) : (
          <div className="grid place-items-center rounded-2xl bg-white px-6 py-10 text-center shadow-[0_1px_4px_rgb(11_31_58/0.06)]">
            <p className="text-[14px] font-semibold text-ink">E’lonlar topilmadi</p>
            <p className="mt-1 text-[12px] text-muted">Qidiruv yoki filtrlarni o‘zgartirib ko‘ring</p>
            <button type="button" onClick={() => { setQ(''); setCat('all'); setFilter(EMPTY) }} className="mt-3 h-9 rounded-xl bg-sea-50 px-4 text-[12.5px] font-semibold text-sea">Filtrlarni tozalash</button>
          </div>
        )}
      </div>

      {sheet === 'filter' && (
        <FilterSheet
          initial={filter}
          count={(f) => base.filter((p) => matchesFilter(p, f)).length}
          onClose={() => setSheet(null)}
          onApply={(f) => { setFilter(f); setSheet(null) }}
        />
      )}
      {sheet === 'post' && (
        <PostSheet
          onClose={() => setSheet(null)}
          onSubmit={(data) => {
            addSurplusItem(data)
            setVersion((v) => v + 1)
            setCat('all'); setQ(''); setFilter(EMPTY); setSort('new')
            setSheet(null)
            setToast('E’loningiz joylandi')
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      )}

      <MobileToast text={toast} onClose={closeToast} />
      <MobileTabBar />
    </div>
  )
}

function SurplusCard({ p, liked, onLike }) {
  const vol = volume(p)
  return (
    <Link to={`/ortiqcha/${p.id}`} className="flex flex-col rounded-2xl bg-white p-2 shadow-[0_1px_4px_rgb(11_31_58/0.06)] active:scale-[0.99]">
      <div className="relative h-[112px] overflow-hidden rounded-xl bg-white">
        <img src={p.image} alt={p.name} className="size-full object-contain" />
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); onLike() }}
          aria-label="Saqlash"
          aria-pressed={liked}
          className="absolute right-1 top-1 grid size-7 place-items-center rounded-lg bg-white/95 shadow-[0_1px_4px_rgb(11_31_58/0.14)]"
        >
          <Heart className={`size-4 ${liked ? 'fill-sale text-sale' : 'text-ink'}`} strokeWidth={1.9} />
        </button>
      </div>
      <h3 className="mt-2 truncate text-[12px] font-bold text-ink">{p.name}</h3>
      <p className="truncate text-[10.5px] text-muted">{p.brand}{vol && ` · ${vol}`}</p>
      <div className="mt-1.5 flex flex-wrap gap-1">
        <span className={`rounded-md px-1.5 py-[3px] text-[9.5px] font-medium leading-none ${p.condition === 'Ochilgan' ? 'bg-[#ecebff] text-[#5b54d6]' : 'bg-[#e5f6ec] text-ok'}`}>
          {p.condition === 'Ochilgan' ? 'Ochilgan' : 'Yangi'}
        </span>
        <span className="rounded-md bg-[#f0f2f6] px-1.5 py-[3px] text-[9.5px] leading-none text-ink-2">Yaroqlilik: {expiryLabel(p.expiry)}</span>
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-x-1.5 pt-2">
        <span className="whitespace-nowrap text-[13px] font-extrabold text-ink">{som(p.price)}</span>
        {p.discount && <span className="ml-auto shrink-0 rounded-md bg-[#fde7ea] px-1.5 py-[3px] text-[9.5px] font-bold leading-none text-sale">{p.discount}</span>}
        {p.oldPrice && <span className="w-full text-[10px] leading-tight text-muted line-through">{som(p.oldPrice)}</span>}
      </div>
      <p className="mt-1 flex items-center gap-1 text-[10px] text-muted"><MapPin className="size-3" /> {p.city}</p>
    </Link>
  )
}

function Sheet({ title, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end bg-ink/45" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} className="flex max-h-[90dvh] flex-col rounded-t-3xl bg-white">
        <div className="flex items-center justify-between px-4 pb-1 pt-3">
          <span className="w-8" />
          <span className="h-1 w-10 rounded-full bg-line" />
          <button type="button" onClick={onClose} aria-label="Yopish" className="grid size-8 place-items-center rounded-full bg-page text-ink">
            <X className="size-4" />
          </button>
        </div>
        <h2 className="px-4 text-[18px] font-bold text-ink">{title}</h2>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{children}</div>
        <div className="flex gap-2 border-t border-line px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3">{footer}</div>
      </div>
    </div>
  )
}

function ChoiceRow({ label, options, value, onChange }) {
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
  const n = count(f)
  return (
    <Sheet
      title="Filtrlar"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={() => setF(EMPTY)} className="h-12 rounded-xl border border-line px-4 text-[13.5px] font-semibold text-ink">Tozalash</button>
          <button type="button" onClick={() => onApply(f)} className="h-12 flex-1 rounded-xl bg-sea text-[14px] font-semibold text-white">{n} ta e’lonni ko‘rsatish</button>
        </>
      }
    >
      <ChoiceRow label="Shahar" options={cities.map((c) => [c, c])} value={f.city} onChange={(city) => patch({ city })} />
      <ChoiceRow label="Holati" options={[['Yopiq', 'Yangi, ochilmagan'], ['Ochilgan', 'Ochilgan']]} value={f.cond} onChange={(cond) => patch({ cond })} />
      <ChoiceRow label="Yaroqlilik muddati" options={[['2027', '2027 va undan keyin'], ['2028', '2028 va undan keyin']]} value={f.expiry} onChange={(expiry) => patch({ expiry })} />
      <p className="mt-4 text-[13px] font-semibold text-ink">Narxi (so‘m)</p>
      <label className="mt-2 flex h-11 items-center gap-2 rounded-xl border border-line px-3">
        <input
          inputMode="numeric"
          value={f.max === PRICE_MAX ? '' : f.max.toLocaleString('ru-RU')}
          onChange={(e) => { const v = Number(e.target.value.replace(/\D/g, '')); patch({ max: v || PRICE_MAX }) }}
          placeholder="Cheksiz"
          className="min-w-0 flex-1 bg-transparent text-[13.5px] text-ink outline-none"
        />
        <span className="text-[11.5px] text-muted">gacha</span>
      </label>
      <div className="mt-2 flex flex-wrap gap-2">
        {PRICE_PRESETS.map(([l, v]) => {
          const on = f.max === v
          return (
            <button key={l} type="button" onClick={() => patch({ max: on ? PRICE_MAX : v })} className={`h-8 rounded-lg px-2.5 text-[12px] font-medium ${on ? 'bg-sea text-white' : 'bg-page text-ink-2'}`}>{l}</button>
          )
        })}
      </div>
    </Sheet>
  )
}

const field = 'h-11 w-full rounded-xl border border-line bg-white px-3 text-[13.5px] text-ink outline-none focus:border-sea'

function PostSheet({ onClose, onSubmit }) {
  const fileRef = useRef(null)
  const [f, setF] = useState({ name: '', brand: '', cat: 'komp', type: '', price: '', oldPrice: '', city: 'Toshkent', condition: 'Yopiq', expiry: '', qty: 1, image: '' })
  const [tried, setTried] = useState(false)
  const patch = (p) => setF((x) => ({ ...x, ...p }))
  const num = (v) => Number(String(v).replace(/\D/g, '')) || 0
  const money = (v) => (num(v) ? num(v).toLocaleString('ru-RU') : '')
  const errors = { name: !f.name.trim(), price: !num(f.price), expiry: !f.expiry }
  const invalid = Object.values(errors).some(Boolean)
  const err = (k) => (tried && errors[k] ? 'border-sale' : '')

  const submit = () => {
    setTried(true)
    if (invalid) return
    const [y, m] = f.expiry.split('-')
    onSubmit({
      name: f.name.trim(),
      brand: f.brand.trim() || 'Boshqa',
      cat: f.cat,
      type: f.type.trim(),
      price: num(f.price),
      oldPrice: num(f.oldPrice),
      city: f.city,
      condition: f.condition,
      expiry: `${m}/${y}`,
      qty: f.qty,
      image: f.image,
    })
  }

  return (
    <Sheet
      title="Yangi e’lon"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="h-12 rounded-xl border border-line px-4 text-[13.5px] font-semibold text-ink">Bekor qilish</button>
          <button type="button" onClick={submit} className="h-12 flex-1 rounded-xl bg-sea text-[14px] font-semibold text-white">E’lonni joylash</button>
        </>
      }
    >
      <p className="mt-0.5 text-[12px] text-muted">Ortiqcha materialingizni hamkasblarga arzon narxda taklif qiling</p>

      <button type="button" onClick={() => fileRef.current?.click()} className="mt-3 flex h-[104px] w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-sea/50 bg-sea-50/60 text-sea">
        {f.image ? (
          <img src={f.image} alt="" className="size-full object-contain" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-[12.5px] font-semibold">
            <ImagePlus className="size-6" strokeWidth={1.7} /> Rasm qo‘shish
            <span className="text-[11px] font-normal text-muted">Mahsulot va qadoq ko‘rinsin</span>
          </span>
        )}
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) patch({ image: URL.createObjectURL(file) }) }} />
      {f.image && (
        <button type="button" onClick={() => fileRef.current?.click()} className="mt-1.5 flex items-center gap-1 text-[12px] font-semibold text-sea"><Camera className="size-3.5" /> Rasmni almashtirish</button>
      )}

      <p className="mt-4 text-[13px] font-semibold text-ink">Mahsulot nomi *</p>
      <input value={f.name} onChange={(e) => patch({ name: e.target.value })} placeholder="Masalan: Filtek Z350 XT A2" className={`mt-1.5 ${field} ${err('name')}`} />
      {tried && errors.name && <p className="mt-1 text-[11px] text-sale">Nomini kiriting</p>}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <p className="text-[12px] text-ink-2">Brend</p>
          <input value={f.brand} onChange={(e) => patch({ brand: e.target.value })} placeholder="3M, GC..." className={`mt-1 ${field}`} />
        </div>
        <div>
          <p className="text-[12px] text-ink-2">Hajmi / turi</p>
          <input value={f.type} onChange={(e) => patch({ type: e.target.value })} placeholder="A2, 4 g" className={`mt-1 ${field}`} />
        </div>
      </div>

      <p className="mt-4 text-[13px] font-semibold text-ink">Kategoriya</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {surplusChips.filter((c) => c.key !== 'all').map(({ key, label }) => (
          <button key={key} type="button" aria-pressed={f.cat === key} onClick={() => patch({ cat: key })} className={`h-9 rounded-xl border px-3 text-[12.5px] font-medium ${f.cat === key ? 'border-sea bg-sea-50 text-sea' : 'border-line text-ink'}`}>{label}</button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div>
          <p className="text-[12px] font-semibold text-ink">Narxi (so‘m) *</p>
          <input inputMode="numeric" value={money(f.price)} onChange={(e) => patch({ price: e.target.value })} placeholder="850 000" className={`mt-1 ${field} ${err('price')}`} />
        </div>
        <div>
          <p className="text-[12px] text-ink-2">Asl narxi (yangi)</p>
          <input inputMode="numeric" value={money(f.oldPrice)} onChange={(e) => patch({ oldPrice: e.target.value })} placeholder="1 200 000" className={`mt-1 ${field}`} />
        </div>
      </div>
      {tried && errors.price && <p className="mt-1 text-[11px] text-sale">Narxni kiriting</p>}

      <p className="mt-4 text-[13px] font-semibold text-ink">Holati</p>
      <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl bg-page p-1">
        {[['Yopiq', 'Yangi, ochilmagan'], ['Ochilgan', 'Ochilgan']].map(([v, l]) => (
          <button key={v} type="button" aria-pressed={f.condition === v} onClick={() => patch({ condition: v })} className={`h-9 rounded-lg text-[12.5px] font-semibold ${f.condition === v ? 'bg-white text-sea shadow-[0_1px_3px_rgb(11_31_58/0.1)]' : 'text-ink-2'}`}>{l}</button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div>
          <p className="text-[12px] font-semibold text-ink">Yaroqlilik muddati *</p>
          <input type="month" value={f.expiry} onChange={(e) => patch({ expiry: e.target.value })} className={`mt-1 ${field} ${err('expiry')}`} />
        </div>
        <div>
          <p className="text-[12px] text-ink-2">Miqdori</p>
          <div className="mt-1 flex h-11 items-center justify-between rounded-xl border border-line px-1">
            <button type="button" onClick={() => patch({ qty: Math.max(1, f.qty - 1) })} aria-label="Kamaytirish" className="grid size-9 place-items-center text-[18px] text-ink">−</button>
            <span className="text-[14px] font-semibold text-ink">{f.qty} ta</span>
            <button type="button" onClick={() => patch({ qty: Math.min(99, f.qty + 1) })} aria-label="Ko‘paytirish" className="grid size-9 place-items-center text-[18px] text-ink">+</button>
          </div>
        </div>
      </div>
      {tried && errors.expiry && <p className="mt-1 text-[11px] text-sale">Yaroqlilik muddatini tanlang</p>}

      <p className="mt-4 text-[13px] font-semibold text-ink">Shahar</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {cities.map((c) => (
          <button key={c} type="button" aria-pressed={f.city === c} onClick={() => patch({ city: c })} className={`h-9 rounded-xl border px-3 text-[12.5px] font-medium ${f.city === c ? 'border-sea bg-sea-50 text-sea' : 'border-line text-ink'}`}>{c}</button>
        ))}
      </div>

      <p className="mt-4 text-[11px] leading-snug text-muted">
E’lon moderatsiyadan so‘ng hamkasblarga ko‘rinadi. Faqat yaroqli va original mahsulotlarni joylang.
      </p>
    </Sheet>
  )
}
