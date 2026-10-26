import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { LayoutGrid, Shirt, UserRound, Footprints, Stethoscope, Heart, Star, ShoppingCart, List, Upload, X } from 'lucide-react'
import ShopLayout from '../components/market/ShopLayout'
import { useCart } from '../cart'
import { cats, genders, allSizes, colors, fabrics, brands, sorts, tiers, products, money, colorOf, sizeChart } from '../formaData'

const catIcon = { all: LayoutGrid, scrub: Shirt, coat: UserRound, cap: Shirt, shoe: Footprints, apron: Stethoscope, accessory: Stethoscope }

export default function Forma() {
  const [q, setQ] = useState('')
  return (
    <ShopLayout active="forma" search="plain" placeholder="Mahsulot, brend yoki kategoriya qidiring..." onQuery={setQ}>
      <Catalog query={q} />
    </ShopLayout>
  )
}

function Catalog({ query }) {
  const [params] = useSearchParams()
  const [cat, setCat] = useState('all')
  const [gender, setGender] = useState([])
  const [size, setSize] = useState([])
  const [color, setColor] = useState([])
  const [fabric, setFabric] = useState([])
  const [brand, setBrand] = useState(() => params.get('brand') ? [params.get('brand')] : [])
  const [priceTo, setPriceTo] = useState(1000000)
  const [sort, setSort] = useState('popular')
  const [view, setView] = useState('grid')
  const [saved, setSaved] = useState(() => new Set())
  const [logo, setLogo] = useState(false)
  const [sent, setSent] = useState(false)
  const [whole, setWhole] = useState(false)

  const toggle = (list, set, value) => set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value])
  const reset = () => { setGender([]); setSize([]); setColor([]); setFabric([]); setBrand([]); setPriceTo(1000000); setCat('all'); setSort('popular') }

  const text = query.trim().toLowerCase()
  const list = useMemo(() => products
    .filter((p) => cat === 'all' || p.cat === cat)
    .filter((p) => !gender.length || gender.includes(p.gender))
    .filter((p) => !size.length || p.sizes.some((s) => size.includes(s)))
    .filter((p) => !color.length || p.colors.some((c) => color.includes(c)))
    .filter((p) => !fabric.length || fabric.includes(p.fabric))
    .filter((p) => !brand.length || brand.some((b) => b.toLowerCase() === p.brand.toLowerCase()))
    .filter((p) => p.price <= priceTo)
    .filter((p) => !text || `${p.title} ${p.brand} ${p.about}`.toLowerCase().includes(text))
    .slice()
    .sort((a, b) => sort === 'cheap' ? a.price - b.price : sort === 'rich' ? b.price - a.price : sort === 'rating' ? b.rating - a.rating : sort === 'fresh' ? Number(!!b.fresh) - Number(!!a.fresh) || a.rank - b.rank : a.rank - b.rank),
  [cat, gender, size, color, fabric, brand, priceTo, sort, text])

  return (
    <div className="pb-8 pt-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold tracking-tight text-ink">Tibbiy forma</h1>
          <p className="mt-0.5 text-[12px] text-ink-2">Stomatologlar va klinika xodimlari uchun sifatli, qulay va zamonaviy tibbiy kiyimlar.</p>
        </div>
        <button onClick={() => setWhole(true)} className="flex h-[34px] items-center gap-1.5 rounded-full border border-sea bg-white px-4 text-[12px] font-semibold text-sea hover:bg-sea-50">
          Klinika uchun ulgurji buyurtma →
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {cats.map(([k, label]) => {
          const Icon = catIcon[k]
          const on = cat === k
          return (
            <button key={k} onClick={() => setCat(k)} className={`flex h-[30px] items-center gap-1.5 rounded-full px-3 text-[10.5px] font-medium ${on ? 'bg-sea text-white' : 'bg-white text-ink-2 shadow-card hover:text-sea'}`}>
              <Icon className="size-3.5" /> {label}
            </button>
          )
        })}
      </div>

      <div className="forma-layout mt-3">
        <aside className="rounded-xl bg-white p-3 shadow-card">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[13px] font-bold text-ink">Filtrlar</h2>
            <button onClick={reset} className="text-[10px] font-medium text-sea">Tozalash</button>
          </div>
          <Block title="Jins">
            {genders.map(([k, label]) => <Check key={k} checked={gender.includes(k)} onChange={() => toggle(gender, setGender, k)} label={label} />)}
          </Block>
          <Block title="O‘lcham">
            <div className="flex flex-wrap gap-1">
              {allSizes.map((s) => (
                <button key={s} onClick={() => toggle(size, setSize, s)} className={`h-6 min-w-6 rounded-md px-1.5 text-[9px] font-semibold ${size.includes(s) ? 'bg-sea text-white' : 'bg-[#f3f6fa] text-ink-2'}`}>{s}</button>
              ))}
            </div>
          </Block>
          <Block title="Rang">
            <div className="flex flex-wrap gap-1.5">
              {colors.map((c) => (
                <button key={c.id} aria-label={c.name} onClick={() => toggle(color, setColor, c.id)} className={`size-4 rounded-full border ${color.includes(c.id) ? 'ring-2 ring-sea ring-offset-1' : 'border-line'}`} style={{ background: c.hex }} />
              ))}
            </div>
          </Block>
          <Block title="Mato">
            {fabrics.map(([k, label]) => <Check key={k} checked={fabric.includes(k)} onChange={() => toggle(fabric, setFabric, k)} label={label} />)}
          </Block>
          <Block title="Narx oralig‘i">
            <div className="mb-1 flex justify-between text-[10px] text-muted"><span>0</span><span>{priceTo.toLocaleString('ru-RU').replace(/\u00a0/g, ' ')}</span></div>
            <input type="range" min={0} max={1000000} step={10000} value={priceTo} onChange={(e) => setPriceTo(Number(e.target.value))} className="surplus-range w-full" style={{ '--p': `${priceTo / 10000}%` }} />
          </Block>
          <Block title="Brend">
            {brands.map((b) => <Check key={b} checked={brand.some((x) => x.toLowerCase() === b.toLowerCase())} onChange={() => toggle(brand, setBrand, b)} label={b} />)}
          </Block>
        </aside>

        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            {Object.entries(sorts).map(([k, label]) => (
              <button key={k} onClick={() => setSort(k)} className={`h-[26px] rounded-full px-2.5 text-[10px] font-medium ${sort === k ? 'bg-sea text-white' : 'bg-white text-ink-2 shadow-card'}`}>{label}</button>
            ))}
            <span className="ml-auto text-[11px] text-muted">{list.length} ta mahsulot</span>
            <button aria-label="Kartochkalar" onClick={() => setView('grid')} className={`grid size-7 place-items-center rounded-md ${view === 'grid' ? 'bg-sea text-white' : 'bg-white text-ink-2 shadow-card'}`}><LayoutGrid className="size-3.5" /></button>
            <button aria-label="Ro‘yxat" onClick={() => setView('list')} className={`grid size-7 place-items-center rounded-md ${view === 'list' ? 'bg-sea text-white' : 'bg-white text-ink-2 shadow-card'}`}><List className="size-3.5" /></button>
          </div>
          {list.length === 0 ? (
            <div className="grid h-[160px] place-items-center rounded-xl bg-white text-[12px] text-muted shadow-card">Mahsulot topilmadi</div>
          ) : view === 'grid' ? (
            <div className="grid min-w-0 grid-cols-2 gap-2 xl:grid-cols-4">
              {list.map((p) => <Card key={p.id} p={p} saved={saved.has(p.id)} onSave={() => setSaved((s) => { const n = new Set(s); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n })} />)}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {list.map((p) => <Row key={p.id} p={p} />)}
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-3">
          <div className="rounded-xl bg-white p-3 shadow-card">
            <h3 className="text-[12px] font-bold text-ink">Logo kashtasi xizmati</h3>
            <img src="/images/forma/coat.jpg" alt="" className="mt-2 h-[88px] w-full rounded-lg object-cover object-top" />
            <p className="mt-2 text-[10px] leading-snug text-muted">Klinika logoyingizni tibbiy formaga kashta qilib beramiz.</p>
            <button onClick={() => { setLogo(true); setSent(false) }} className="mt-2 flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-sea text-[10.5px] font-semibold text-sea">
              <Upload className="size-3.5" /> Logoni yuklash
            </button>
            <p className="mt-2 text-[11px] font-semibold text-ink">35 000 so‘m / dona</p>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-card">
            <h3 className="text-[12px] font-bold text-ink">Ulgurji buyurtma uchun chegirmalar</h3>
            <div className="mt-2 flex flex-col gap-1.5">
              {tiers.map(([qnt, off]) => (
                <div key={qnt} className="flex items-center justify-between text-[11px]">
                  <span className="text-ink-2">{qnt}</span>
                  <span className="font-bold text-sea">{off}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-card">
            <h3 className="text-[12px] font-bold text-ink">O‘lchamlar jadvali</h3>
            <p className="mt-1 text-[10px] text-muted">To‘g‘ri o‘lcham tanlash uchun jadvaldan foydalaning.</p>
            <SizeTable compact />
          </div>
        </aside>
      </div>

      {logo && <LogoModal sent={sent} onClose={() => setLogo(false)} onSubmit={() => setSent(true)} />}
      {whole && <WholeModal onClose={() => setWhole(false)} />}
    </div>
  )
}

function Card({ p, saved, onSave }) {
  return (
    <article className="flex h-full min-w-0 flex-col rounded-xl bg-white p-2 shadow-card">
      <div className="relative overflow-hidden rounded-lg bg-[#f3f6fa]" style={{ height: 148 }}>
        <Link to={`/forma/${p.id}`}><img src={p.image} alt="" className="size-full object-cover object-top" /></Link>
        <button onClick={onSave} aria-label="Saqlash" className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-white/90">
          <Heart className={`size-3.5 ${saved ? 'fill-sale text-sale' : 'text-ink-2'}`} />
        </button>
      </div>
      <p className="mt-1.5 text-[9px] font-bold uppercase tracking-wide text-sea">{p.brand}</p>
      <Link to={`/forma/${p.id}`} className="line-clamp-2 text-[12px] font-bold leading-snug text-ink hover:text-sea">{p.title}</Link>
      <p className="line-clamp-2 text-[10px] text-muted">{p.about}</p>
      <p className="mt-1 flex items-center gap-1 text-[10px]"><Star className="size-3 fill-star text-star" /> {p.rating} <span className="text-muted">({p.reviews})</span></p>
      <div className="mt-1 flex flex-wrap gap-1">{p.sizes.slice(0, 4).map((s) => <span key={s} className="rounded bg-[#f3f6fa] px-1 text-[8px] text-ink-2">{s}</span>)}</div>
      <div className="mt-1 flex gap-1">{p.colors.map((c) => <span key={c} className="size-2.5 rounded-full border border-line" style={{ background: colorOf(c).hex }} />)}</div>
      <div className="mt-auto pt-1">
        <div className="flex flex-wrap items-baseline gap-1.5">
          <span className="text-[13px] font-extrabold text-ink">{money(p.price)}</span>
          {p.oldPrice ? <span className="text-[9px] text-muted line-through">{money(p.oldPrice)}</span> : null}
          {p.off ? <span className="text-[9px] font-bold text-sale">-{p.off}%</span> : null}
        </div>
        <Buy p={p} />
      </div>
    </article>
  )
}

function Row({ p }) {
  return (
    <article className="flex gap-3 rounded-xl bg-white p-2 shadow-card">
      <Link to={`/forma/${p.id}`} className="shrink-0 overflow-hidden rounded-lg" style={{ width: 120, height: 90 }}><img src={p.image} alt="" className="size-full object-cover object-top" /></Link>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold uppercase text-sea">{p.brand}</p>
        <Link to={`/forma/${p.id}`} className="text-[13px] font-bold text-ink">{p.title}</Link>
        <p className="text-[11px] text-muted">{p.about}</p>
        <p className="text-[12px] font-extrabold text-ink">{money(p.price)}</p>
      </div>
      <div className="w-[140px] self-center"><Buy p={p} /></div>
    </article>
  )
}

function Buy({ p }) {
  const { add, items } = useCart()
  const inCart = items.some((it) => it.id === p.id)
  return (
    <button onClick={() => { if (!inCart) add({ id: p.id, name: p.title, type: p.brand, price: p.price, image: p.image }) }} className={`mt-2 flex h-8 w-full items-center justify-center gap-1.5 rounded-lg text-[11px] font-semibold text-white ${inCart ? 'bg-[#1f8f4e]' : 'bg-sea hover:bg-sea-600'}`}>
      <ShoppingCart className="size-3.5" /> {inCart ? 'Savatda' : 'Savatga qo‘shish'}
    </button>
  )
}

function Block({ title, children }) {
  return <div className="mt-3 border-t border-line pt-2.5"><p className="mb-1.5 text-[11px] font-bold text-ink">{title}</p><div className="flex flex-col gap-1.5">{children}</div></div>
}
function Check({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[10.5px] text-ink-2">
      <input type="checkbox" checked={checked} onChange={onChange} className="size-3.5" style={{ accentColor: '#0b8a95' }} /> {label}
    </label>
  )
}

export function SizeTable({ compact }) {
  const rows = compact ? sizeChart.slice(0, 4) : sizeChart
  return (
    <table className="mt-2 w-full text-left text-[9px]">
      <thead><tr className="text-muted"><th className="py-1 font-medium">O‘lcham</th><th>A</th><th>B</th><th>C</th></tr></thead>
      <tbody>
        {rows.map((r) => <tr key={r[0]} className="border-t border-line"><td className="py-1 font-semibold text-ink">{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td></tr>)}
      </tbody>
    </table>
  )
}

function LogoModal({ sent, onClose, onSubmit }) {
  const [place, setPlace] = useState('chest')
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); onSubmit() }} className="w-full max-w-[400px] rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between"><h3 className="text-[16px] font-bold">Logo kashtasi</h3><button type="button" onClick={onClose} aria-label="Yopish"><X className="size-4 text-muted" /></button></div>
        {sent ? <p className="py-6 text-center text-[13px] text-ink-2">Buyurtma qabul qilindi. Kashta narxi 35 000 so‘m / dona.</p> : (
          <div className="flex flex-col gap-2">
            <label className="flex h-20 cursor-pointer items-center justify-center rounded-xl border border-dashed border-line text-[12px] text-muted"><Upload className="mr-2 size-4" /> PNG yoki SVG yuklang<input type="file" accept="image/*,.svg" className="hidden" required /></label>
            <div className="flex gap-2">
              {[['chest', 'Ko‘krak qismi'], ['sleeve', 'Yeng qismi']].map(([k, l]) => (
                <button type="button" key={k} onClick={() => setPlace(k)} className={`h-8 flex-1 rounded-lg text-[11px] font-semibold ${place === k ? 'bg-sea text-white' : 'bg-page text-ink-2'}`}>{l}</button>
              ))}
            </div>
            <p className="text-[12px] font-bold">35 000 so‘m / dona</p>
            <button className="h-10 rounded-lg bg-sea text-[13px] font-semibold text-white">Buyurtma berish</button>
          </div>
        )}
      </form>
    </div>
  )
}

function WholeModal({ onClose }) {
  const [qty, setQty] = useState(10)
  const off = qty >= 100 ? 'Maxsus narx' : qty >= 50 ? '−30%' : qty >= 30 ? '−20%' : qty >= 10 ? '−10%' : 'Chegirma yo‘q'
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[400px] rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between"><h3 className="text-[16px] font-bold">Ulgurji buyurtma</h3><button onClick={onClose} aria-label="Yopish"><X className="size-4 text-muted" /></button></div>
        <label className="text-[11px] text-muted">Dona soni
          <input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value) || 1)} className="mt-1 h-10 w-full rounded-lg bg-page px-3 text-[14px] outline-none" />
        </label>
        <p className="mt-3 text-[13px]">Sizning chegirmangiz: <b className="text-sea">{off}</b></p>
        <button onClick={onClose} className="mt-3 h-10 w-full rounded-lg bg-sea text-[13px] font-semibold text-white">Tushunarli</button>
      </div>
    </div>
  )
}
