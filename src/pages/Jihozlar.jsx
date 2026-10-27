import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  LayoutGrid, List, Scale, BadgeCheck, ShieldCheck, CreditCard, Wrench, Truck, Headset,
  ShoppingCart, X, ChevronDown,
} from 'lucide-react'
import ShopLayout from '../components/market/ShopLayout'
import EmptyCatalog from '../components/EmptyCatalog'
import { useCatalogVersion } from '../recordSync'
import { useCart } from '../cart'
import {
  products, catList, catName, statusList, statusName, primaryBrands, warranties, cities, sorts,
  money, why, compareSeed, engineer,
} from '../jihozData'

const perkIcon = { BadgeCheck, ShieldCheck, CreditCard, Wrench }
const whyIcon = [ShieldCheck, BadgeCheck, CreditCard, Wrench, Truck, Headset]
const allBrands = [...new Set(products.map((p) => p.brand))]
const moreBrands = allBrands.filter((b) => !primaryBrands.includes(b)).sort()

export default function Jihozlar() {
  const [q, setQ] = useState('')
  return (
    <ShopLayout active="jihozlar" search="plain" placeholder="Stomatologik jihozlar, brend yoki model qidiring..." onQuery={setQ}>
      <Catalog query={q} />
    </ShopLayout>
  )
}

function Catalog({ query }) {
  useCatalogVersion()
  const [params] = useSearchParams()
  const [cat, setCat] = useState(params.get('cat') || 'all')
  const [status, setStatus] = useState([])
  const [brand, setBrand] = useState(params.get('brand') ? [params.get('brand')] : [])
  const [warranty, setWarranty] = useState([])
  const [priceTo, setPriceTo] = useState(600000000)
  const [lizing, setLizing] = useState(true)
  const [install, setInstall] = useState(true)
  const [official, setOfficial] = useState(true)
  const [city, setCity] = useState('')
  const [sort, setSort] = useState('popular')
  const [view, setView] = useState('grid')
  const [more, setMore] = useState(false)
  const [picked, setPicked] = useState(compareSeed)
  const [sell, setSell] = useState(false)
  const [consult, setConsult] = useState(false)
  const [offer, setOffer] = useState(null)
  const [compare, setCompare] = useState(false)

  const counts = useMemo(() => ({
    status: Object.fromEntries(statusList.map(([k]) => [k, products.filter((p) => p.status === k).length])),
    brand: Object.fromEntries(allBrands.map((b) => [b, products.filter((p) => p.brand === b).length])),
    warranty: Object.fromEntries(warranties.map((w) => [w, products.filter((p) => p.warranty === w).length])),
  }), [])

  const list = useMemo(() => {
    const text = query.trim().toLowerCase()
    let rows = products.filter((p) => {
      if (cat !== 'all' && p.cat !== cat) return false
      if (status.length && !status.includes(p.status)) return false
      if (brand.length && !brand.some((b) => b.toLowerCase() === p.brand.toLowerCase())) return false
      if (warranty.length && !warranty.includes(p.warranty)) return false
      if (p.price > priceTo) return false
      if (lizing && !p.lizing) return false
      if (install && !p.install) return false
      if (official && !p.official) return false
      if (city && p.city !== city) return false
      if (text && !`${p.title} ${p.brand} ${catName[p.cat]}`.toLowerCase().includes(text)) return false
      return true
    })
    if (sort === 'cheap') rows = [...rows].sort((a, b) => a.price - b.price)
    else if (sort === 'rich') rows = [...rows].sort((a, b) => b.price - a.price)
    else if (sort === 'fresh') rows = [...rows].sort((a, b) => b.year - a.year)
    else if (sort === 'rating') rows = [...rows].sort((a, b) => b.rating - a.rating || b.reviews - a.reviews)
    return rows
  }, [cat, status, brand, warranty, priceTo, lizing, install, official, city, sort, query])

  const reset = () => {
    setCat('all'); setStatus([]); setBrand([]); setWarranty([]); setPriceTo(600000000)
    setLizing(true); setInstall(true); setOfficial(true); setCity('')
  }
  const toggle = (list, set, value) => set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value])
  const togglePick = (id) => setPicked((cur) => cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= 3 ? cur : [...cur, id])
  const chosen = picked.map((id) => products.find((p) => p.id === id)).filter(Boolean)
  const shownBrands = more ? [...primaryBrands, ...moreBrands] : primaryBrands

  return (
    <div className="pb-8 pt-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-[240px] max-w-[520px] flex-1">
          <h1 className="text-[22px] font-extrabold leading-tight text-ink">Stomatologik jihozlar</h1>
          <p className="mt-1 text-[12px] leading-snug text-muted">Klinikangiz uchun zamonaviy va ishonchli uskunalar. Yangi va ishlatilgan, kafolat va servis bilan.</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
          {[['BadgeCheck', 'Rasmiy distribyutorlar'], ['ShieldCheck', 'Kafolat va servis'], ['CreditCard', 'Lizing / bo‘lib to‘lash'], ['Wrench', 'O‘rnatish xizmati']].map(([key, label]) => {
            const Icon = perkIcon[key]
            return <span key={label} className="flex items-center gap-1 text-[10px] font-medium text-ink-2"><Icon className="size-3.5 text-sea" />{label}</span>
          })}
          <button onClick={() => setSell(true)} className="h-9 rounded-full bg-sea px-4 text-[12px] font-semibold text-white hover:bg-sea-600">Jihoz sotish</button>
        </div>
      </div>

      <div className="mt-3 flex gap-1.5 overflow-x-auto no-scrollbar">
        {catList.map(([k, label]) => (
          <button key={k} onClick={() => setCat(k)} className={`h-[30px] shrink-0 rounded-full px-3 text-[11px] font-medium ${cat === k ? 'bg-sea text-white' : 'bg-white text-ink-2 shadow-card hover:text-sea'}`}>{label}</button>
        ))}
      </div>

      <div className="jihoz-layout mt-3">
        <aside className="rounded-xl bg-white p-3 shadow-card">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[13px] font-bold text-ink">Filtrlar</h2>
            <button onClick={reset} className="text-[10px] font-medium text-sea">Tozalash</button>
          </div>
          <Block title="Holati">
            {statusList.map(([k, label]) => (
              <Check key={k} checked={status.includes(k)} onChange={() => toggle(status, setStatus, k)} label={label} count={counts.status[k]} />
            ))}
          </Block>
          <Block title="Brend">
            {shownBrands.map((b) => (
              <Check key={b} checked={brand.some((x) => x.toLowerCase() === b.toLowerCase())} onChange={() => toggle(brand, setBrand, b)} label={b} count={counts.brand[b] || 0} />
            ))}
            <button onClick={() => setMore((v) => !v)} className="text-left text-[10px] font-semibold text-sea">{more ? 'Yig‘ish' : 'Barchasini ko‘rsatish'}</button>
          </Block>
          <Block title="Narx oralig‘i">
            <div className="mb-1 flex justify-between text-[10px] text-muted"><span>0 so‘m</span><span>{priceTo.toLocaleString('ru-RU').replace(/\u00a0/g, ' ')}</span></div>
            <input type="range" min={5000000} max={600000000} step={5000000} value={priceTo} onChange={(e) => setPriceTo(Number(e.target.value))} className="surplus-range w-full" style={{ '--p': `${((priceTo - 5000000) / 595000000) * 100}%` }} />
          </Block>
          <Block title="Kafolat muddati">
            {warranties.map((w) => (
              <Check key={w} checked={warranty.includes(w)} onChange={() => toggle(warranty, setWarranty, w)} label={`${w} oy`} count={counts.warranty[w]} />
            ))}
          </Block>
          <div className="mt-3 flex flex-col gap-1 border-t border-line pt-2">
            <Switch on={lizing} onClick={() => setLizing((v) => !v)} label="Lizing mavjud" />
            <Switch on={install} onClick={() => setInstall((v) => !v)} label="O‘rnatish xizmati" />
            <Switch on={official} onClick={() => setOfficial((v) => !v)} label="Rasmiy distribyutor" />
          </div>
          <Block title="Shahar tanlash">
            <div className="relative">
              <select value={city} onChange={(e) => setCity(e.target.value)} className="h-8 w-full appearance-none rounded-lg bg-[#f3f6fa] px-2 pr-6 text-[11px] outline-none">
                <option value="">Barchasi</option>
                {cities.map((c) => <option key={c}>{c}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-2 size-3.5 text-muted" />
            </div>
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
            <div className="grid h-[160px] place-items-center rounded-xl bg-white text-[12px] text-muted shadow-card">Jihoz topilmadi</div>
          ) : view === 'grid' ? (
            <div className="grid min-w-0 grid-cols-2 gap-2 xl:grid-cols-4">
              {!products.length ? <EmptyCatalog title="Jihozlar katalogi bo‘sh" text="Hali jihozlar qo‘shilmagan." /> : null}
      {list.map((p) => (
                <Card key={p.id} p={p} picked={picked.includes(p.id)} onPick={() => togglePick(p.id)} onOffer={() => setOffer(p)} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {list.map((p) => <Row key={p.id} p={p} onOffer={() => setOffer(p)} />)}
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-3">
          <div className="rounded-xl bg-white p-3 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-[12px] font-bold text-ink">Jihozlarni solishtirish ({chosen.length})</h3>
              <button onClick={() => setPicked([])} className="shrink-0 text-[10px] font-medium text-sea">Barchasini tozalash</button>
            </div>
            <div className="mt-2 flex flex-col gap-2">
              {chosen.length === 0 ? <p className="text-[11px] text-muted">Solishtirish uchun jihoz tanlang.</p> : chosen.map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  <img src={p.image} alt="" className="size-10 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold text-ink">{p.title}</p>
                    <p className="truncate text-[10px] text-muted">{catName[p.cat]}</p>
                    <p className="text-[11px] font-bold text-ink">{money(p.price)}</p>
                  </div>
                  <button aria-label="Olib tashlash" onClick={() => togglePick(p.id)} className="text-muted"><X className="size-3.5" /></button>
                </div>
              ))}
            </div>
            <button disabled={chosen.length < 2} onClick={() => setCompare(true)} className="mt-2 h-8 w-full rounded-lg bg-sea text-[12px] font-semibold text-white disabled:opacity-40">Solishtirish</button>
          </div>

          <div className="rounded-xl bg-[#e7f7f4] p-3">
            <h3 className="text-[13px] font-bold text-ink">Bepul konsultatsiya</h3>
            <p className="mt-0.5 text-[10px] text-muted">Jihoz tanlashda yordam beramiz</p>
            <img src={engineer} alt="" className="mx-auto mt-2 size-16 rounded-full object-cover" />
            <ul className="mt-2 space-y-1 text-[11px] text-ink-2">
              {['Mutaxassis maslahati', 'Lizing va moliyalashtirish', 'Klinikangizga to‘g‘ri variant'].map((t) => <li key={t}>• {t}</li>)}
            </ul>
            <button onClick={() => setConsult(true)} className="mt-2 h-9 w-full rounded-lg bg-sea text-[12px] font-semibold text-white">Muhandis bilan bog‘lanish</button>
          </div>

          <div className="rounded-xl bg-white p-3 shadow-card">
            <h3 className="text-[13px] font-bold text-ink">Nega StomaHub?</h3>
            <div className="mt-2 flex flex-col gap-2">
              {why.map(([title, text], i) => {
                const Icon = whyIcon[i]
                return (
                  <div key={title} className="flex items-start gap-2">
                    <Icon className="mt-0.5 size-3.5 shrink-0 text-sea" />
                    <div>
                      <p className="text-[11px] font-semibold text-ink">{title}</p>
                      <p className="text-[10px] text-muted">{text}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </aside>
      </div>

      {sell && <FormModal title="Jihoz sotish" done="So‘rovingiz qabul qilindi. Mutaxassis narxni kelishish uchun bog‘lanadi." onClose={() => setSell(false)} fields={['Jihoz nomi', 'Holati', 'Narxi', 'Telefon']} />}
      {consult && <FormModal title="Muhandis bilan bog‘lanish" done="Muhandis tez orada siz bilan bog‘lanadi." onClose={() => setConsult(false)} fields={['Ism', 'Telefon', 'Qanday jihoz kerak']} />}
      {offer && <FormModal title="Taklif so‘rash" done={`${offer.title} uchun taklif so‘rovi yuborildi.`} onClose={() => setOffer(null)} fields={['Ism', 'Telefon', 'Izoh']} />}
      {compare && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={() => setCompare(false)}>
          <div onClick={(e) => e.stopPropagation()} className="max-h-[80vh] w-full max-w-[720px] overflow-auto rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between"><h3 className="text-[16px] font-bold">Solishtirish</h3><button onClick={() => setCompare(false)} aria-label="Yopish"><X className="size-4 text-muted" /></button></div>
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${chosen.length}, minmax(0,1fr))` }}>
              {chosen.map((p) => (
                <div key={p.id} className="min-w-0">
                  <img src={p.image} alt="" className="h-[120px] w-full rounded-lg object-cover" />
                  <p className="mt-2 text-[12px] font-bold text-ink">{p.title}</p>
                  <p className="text-[11px] text-muted">{p.brand} · {catName[p.cat]}</p>
                  <p className="mt-1 text-[14px] font-extrabold">{money(p.price)}</p>
                  <p className="text-[11px] text-muted">{p.year} yil · Kafolat {p.warranty} oy</p>
                  <p className="text-[11px] text-ink-2">{statusName[p.status]}</p>
                  <p className="text-[11px] text-muted">12 oyga {money(p.month)}/oy</p>
                  <Link to={`/jihozlar/${p.id}`} className="mt-2 flex h-8 items-center justify-center rounded-lg bg-sea text-[11px] font-semibold text-white">Ochish</Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Card({ p, picked, onPick, onOffer }) {
  return (
    <article className="flex h-full min-w-0 flex-col rounded-xl bg-white p-2 shadow-card">
      <div className="relative overflow-hidden rounded-lg bg-[#f4f7fb]" style={{ height: 118 }}>
        <Link to={`/jihozlar/${p.id}`}><img src={p.image} alt="" className="size-full max-w-full object-cover" /></Link>
        <span className={`absolute left-1.5 top-1.5 rounded-md px-1.5 py-0.5 text-[9px] font-bold text-white ${p.status === 'new' ? 'bg-sea' : p.status === 'used' ? 'bg-[#5d6b7c]' : 'bg-[#d89a14]'}`}>{statusName[p.status]}</span>
        <button aria-label="Solishtirish" onClick={onPick} className={`absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full ${picked ? 'bg-sea text-white' : 'bg-white/90 text-ink-2'}`}><Scale className="size-3.5" /></button>
      </div>
      <p className="mt-1.5 text-[9px] font-bold uppercase tracking-wide text-sea">{p.mark}</p>
      <Link to={`/jihozlar/${p.id}`} className="line-clamp-2 text-[12px] font-bold leading-snug text-ink hover:text-sea">{p.title}</Link>
      <p className="text-[10px] text-muted">{catName[p.cat]}</p>
      <p className="mt-1 text-[10px] text-ink-2">{p.year} yil · Kafolat: {p.warranty} oy</p>
      <p className="line-clamp-1 text-[10px] text-muted">{p.feature}</p>
      <div className="mt-auto pt-1">
        <p className="text-[13px] font-extrabold leading-tight text-ink">{money(p.price)}</p>
        <p className="text-[10px] text-muted">12 oyga {money(p.month)}/oy</p>
        <div className="mt-1.5 flex gap-1">
          <Buy p={p} />
          <button onClick={onOffer} className="h-7 flex-1 rounded-lg border border-line text-[9px] font-semibold text-ink hover:border-sea hover:text-sea">Taklif so‘rash</button>
        </div>
      </div>
    </article>
  )
}

function Row({ p, onOffer }) {
  return (
    <article className="flex min-w-0 gap-3 rounded-xl bg-white p-2 shadow-card">
      <Link to={`/jihozlar/${p.id}`} className="shrink-0 overflow-hidden rounded-lg" style={{ width: 140, height: 96 }}><img src={p.image} alt="" className="size-full object-cover" /></Link>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold uppercase text-sea">{p.mark}</p>
        <Link to={`/jihozlar/${p.id}`} className="text-[13px] font-bold text-ink">{p.title}</Link>
        <p className="text-[11px] text-muted">{catName[p.cat]} · {p.year} yil · Kafolat {p.warranty} oy</p>
        <p className="text-[13px] font-extrabold">{money(p.price)}</p>
      </div>
      <div className="flex w-[150px] flex-col justify-center gap-1">
        <Buy p={p} wide />
        <button onClick={onOffer} className="h-8 rounded-lg border border-line text-[11px] font-semibold">Taklif so‘rash</button>
      </div>
    </article>
  )
}

function Buy({ p, wide }) {
  const { add, items } = useCart()
  const inCart = items.some((it) => it.id === p.id)
  return (
    <button onClick={() => { if (!inCart) add({ id: p.id, name: p.title, type: p.brand, price: p.price, image: p.image }) }} className={`flex items-center justify-center gap-1 rounded-lg font-semibold text-white ${wide ? 'h-8 text-[11px]' : 'h-7 flex-1 text-[9px]'} ${inCart ? 'bg-[#1f8f4e]' : 'bg-sea hover:bg-sea-600'}`}>
      <ShoppingCart className="size-3" /> {inCart ? 'Savatda' : 'Savatga'}
    </button>
  )
}

function Block({ title, children }) {
  return <div className="mt-3 border-t border-line pt-2.5"><p className="mb-1.5 text-[11px] font-bold text-ink">{title}</p><div className="flex flex-col gap-1.5">{children}</div></div>
}
function Check({ checked, onChange, label, count }) {
  return (
    <label className="flex cursor-pointer items-center gap-1.5 text-[10.5px] text-ink-2">
      <input type="checkbox" checked={checked} onChange={onChange} className="size-3.5 shrink-0" style={{ accentColor: '#0b8a95' }} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="text-[10px] text-muted">({count})</span>
    </label>
  )
}
function Switch({ on, onClick, label }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center justify-between gap-2 text-left">
      <span className="text-[11px] text-ink">{label}</span>
      <span className={`relative h-4 w-7 shrink-0 rounded-full ${on ? 'bg-sea' : 'bg-[#d5dde6]'}`}>
        <span className="absolute top-0.5 size-3 rounded-full bg-white" style={{ left: on ? 14 : 2 }} />
      </span>
    </button>
  )
}
function FormModal({ title, done, onClose, fields }) {
  const [sent, setSent] = useState(false)
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); setSent(true) }} className="w-full max-w-[400px] rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between"><h3 className="text-[16px] font-bold">{title}</h3><button type="button" onClick={onClose} aria-label="Yopish"><X className="size-4 text-muted" /></button></div>
        {sent ? <p className="py-4 text-[13px] leading-relaxed text-ink-2">{done}</p> : (
          <div className="flex flex-col gap-2">
            {fields.map((f) => <input key={f} required placeholder={f} className="h-10 rounded-lg bg-page px-3 text-[13px] outline-none" />)}
            <button className="h-10 rounded-lg bg-sea text-[13px] font-semibold text-white">Yuborish</button>
          </div>
        )}
      </form>
    </div>
  )
}
