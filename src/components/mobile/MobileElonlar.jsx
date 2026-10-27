import { useCallback, useMemo, useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import { Search, X, Plus, Filter, LayoutGrid, Armchair, Building2, BriefcaseBusiness, Wrench, Heart, MapPin, CalendarDays, Check, ImagePlus } from 'lucide-react'
import { ADS, DEALS, AD_CATS, AD_CITIES, SELLERS, dealName, adPrice } from '../../elonlarData'
import { bindBlob, touchBlob } from '../../recordSync'
import { MobileToast } from './parts'
import MobileTabBar from './MobileTabBar'
import { BottomSheet, ToothIcon } from './MobileSeminars'
import { HubTopBar } from './MobileKategoriyalar'
import PhoneInput, { extractUzLocalDigits, isCompleteUzPhone, PHONE_INCOMPLETE_MSG, toE164 } from '../PhoneInput'

const CAT_ICONS = { all: LayoutGrid, uskuna: Armchair, material: ToothIcon, klinika: Building2, ish: BriefcaseBusiness, asbob: Wrench }
const SORTS = [['new', 'Eng yangi'], ['cheap', 'Arzonroq'], ['rich', 'Qimmatroq'], ['views', 'Ko‘p ko‘rilgan']]
const EMPTY = { cities: [], min: '', max: '', cond: '', sort: 'new', saved: false }
export const DEAL_CLS = { sale: 'bg-[#16b07a]', rent: 'bg-[#0b8a95]', job: 'bg-[#0b8a95]' }

const DEMO_ADS = { added: [], saved: ['endomotor', 'nsk-turbina'] }
let store = { added: [], saved: new Set() }
const subs = new Set()
const emit = (next) => {
  store = { ...store, ...next }
  subs.forEach((f) => f())
  touchBlob('saved_ads')
}
bindBlob('saved_ads', {
  seed: DEMO_ADS,
  get: () => ({ added: store.added, saved: [...store.saved] }),
  empty: () => ({ added: [], saved: [] }),
  set: (payload) => {
    store = {
      added: Array.isArray(payload?.added) ? payload.added : [],
      saved: new Set(Array.isArray(payload?.saved) ? payload.saved : []),
    }
    subs.forEach((f) => f())
  },
})
export function useAds() {
  return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f) }, () => store)
}
export const adsStore = {
  toggleSave: (id) => {
    const s = new Set(store.saved)
    if (s.has(id)) s.delete(id)
    else s.add(id)
    emit({ saved: s })
    return s.has(id)
  },
  add: (a) => emit({ added: [a, ...store.added] }),
}
export const allAds = () => [...store.added, ...ADS]
export const findAd = (id) => allAds().find((a) => a.id === id) || null
export const sellerOf = (a) => SELLERS[a.seller] || a.sellerInfo

export default function MobileElonlar() {
  const { added, saved } = useAds()
  const [q, setQ] = useState('')
  const [deal, setDeal] = useState('')
  const [cat, setCat] = useState('all')
  const [f, setF] = useState(EMPTY)
  const [sheet, setSheet] = useState(null)
  const [toast, setToast] = useState('')
  const closeToast = useCallback(() => setToast(''), [])
  const ads = useMemo(() => [...added, ...ADS], [added])

  const match = useCallback((a, x) =>
    (!x.cities.length || x.cities.includes(a.city)) &&
    (!x.min || a.price >= Number(x.min)) &&
    (!x.max || a.price <= Number(x.max)) &&
    (!x.cond || a.cond === x.cond) &&
    (!x.saved || saved.has(a.id)), [saved])

  const base = useMemo(() => {
    const s = q.trim().toLowerCase()
    return ads.filter((a) => (cat === 'all' || a.cat === cat) && (!s || `${a.title} ${a.sub} ${a.city} ${dealName[a.deal]} ${a.specs.map((x) => x[2]).join(' ')}`.toLowerCase().includes(s)))
  }, [ads, q, cat])
  const list = useMemo(() => {
    const rows = base.filter((a) => (!deal || a.deal === deal) && match(a, f))
    if (f.sort === 'cheap') return [...rows].sort((a, b) => a.price - b.price)
    if (f.sort === 'rich') return [...rows].sort((a, b) => b.price - a.price)
    if (f.sort === 'views') return [...rows].sort((a, b) => b.views - a.views)
    return rows
  }, [base, deal, f, match])
  const active = f.cities.length + (f.min || f.max ? 1 : 0) + (f.cond ? 1 : 0) + (f.sort !== 'new' ? 1 : 0) + (f.saved ? 1 : 0)
  const reset = () => { setQ(''); setDeal(''); setCat('all'); setF(EMPTY) }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef8f7_0%,#f6faf9_40%,#f6faf9_100%)] pb-[86px]">
      <div className="px-3.5 pt-3">
        <HubTopBar onBell={() => setToast('Yangi bildirishnomalar yo‘q')} />
        <div className="mt-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-[27px] font-extrabold leading-tight tracking-tight text-[#0d2a4a]">E’lonlar</h1>
            <p className="text-[12.5px] text-[#7d8fa9]">Stomatologiya sohasidagi e’lonlar</p>
          </div>
          <button type="button" onClick={() => setSheet('post')} className="mt-1 flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-[#0b6d73] px-3 text-[12.5px] font-semibold text-white shadow-[0_6px_14px_rgb(11_109_115/0.25)]">
            <Plus className="size-[18px]" /> E’lon joylash
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <label className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-line/70 bg-white px-3">
            <Search className="size-[18px] shrink-0 text-sea" />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kalit so‘z, kategoriya yoki shahar..." className="min-w-0 flex-1 bg-transparent text-[12px] text-ink outline-none placeholder:text-muted" />
            {q && <button type="button" onClick={() => setQ('')} aria-label="Tozalash" className="text-muted"><X className="size-4" /></button>}
          </label>
          <button type="button" onClick={() => setSheet('filter')} className="relative flex h-11 shrink-0 items-center gap-1 rounded-xl border border-line/70 bg-white px-3 text-[12.5px] font-medium text-ink">
            <Filter className="size-4" /> Filtr
            {active > 0 && <span className="absolute -right-1 -top-1 grid size-[18px] place-items-center rounded-full bg-sea text-[10px] font-bold text-white ring-2 ring-white">{active}</span>}
          </button>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {DEALS.map(([k, l]) => {
            const on = deal === k
            const n = base.filter((a) => a.deal === k && match(a, f)).length
            return <button key={k} type="button" aria-pressed={on} onClick={() => setDeal(on ? '' : k)} className={`h-10 rounded-xl text-[12.5px] font-semibold transition ${on ? 'bg-[#0b8a95] text-white shadow-[0_4px_10px_rgb(11_138_149/0.25)]' : 'border border-line/70 bg-white text-ink'}`}>{l} ({n})</button>
          })}
        </div>
      </div>

      <div className="mt-2.5 flex gap-1.5 overflow-x-auto px-3.5 pb-0.5 no-scrollbar">
        {AD_CATS.map(([k, l]) => {
          const Icon = CAT_ICONS[k]
          const on = cat === k
          return (
            <button key={k} type="button" aria-pressed={on} onClick={() => setCat(k)} className={`flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-[11.5px] font-medium transition ${on ? 'bg-[#0b6d73] text-white' : 'border border-line/70 bg-white text-ink'}`}>
              <Icon className={`size-4 ${on ? '' : 'text-sea'}`} strokeWidth={1.7} /> {l}
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex flex-col gap-2 px-3.5">
        {list.map((a) => (
          <AdCard key={a.id} a={a} saved={saved.has(a.id)} onSave={() => setToast(adsStore.toggleSave(a.id) ? 'Saqlanganlarga qo‘shildi' : 'Saqlanganlardan olib tashlandi')} />
        ))}
        {!list.length && (
          <div className="rounded-2xl bg-white px-6 py-10 text-center">
            <p className="text-[14px] font-semibold text-ink">E’lon topilmadi</p>
            <p className="mt-1 text-[12px] text-muted">Qidiruv yoki filtrlarni o‘zgartirib ko‘ring</p>
            <button type="button" onClick={reset} className="mt-3 h-9 rounded-xl bg-sea-50 px-4 text-[12.5px] font-semibold text-sea">Filtrlarni tozalash</button>
          </div>
        )}
      </div>

      {sheet === 'filter' && <FilterSheet initial={f} count={(x) => base.filter((a) => (!deal || a.deal === deal) && match(a, x)).length} savedCount={saved.size} onClose={() => setSheet(null)} onApply={(x) => { setF(x); setSheet(null) }} />}
      {sheet === 'post' && <PostAdSheet onClose={() => setSheet(null)} onDone={(a) => { adsStore.add(a); setSheet(null); reset(); setToast('E’loningiz joylandi'); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />}

      <MobileToast text={toast} onClose={closeToast} />
      <MobileTabBar />
    </div>
  )
}

export function AdCard({ a, saved, onSave }) {
  return (
    <article className="relative flex gap-3 rounded-2xl bg-white p-2 shadow-[0_1px_4px_rgb(11_31_58/0.06)]">
      <Link to={`/elonlar/${a.id}`} className="relative min-h-[92px] w-[108px] shrink-0 overflow-hidden rounded-xl bg-page">
        <img src={a.images[0]} alt={a.title} loading="lazy" className="absolute inset-0 size-full object-cover" />
        <span className={`absolute left-1.5 top-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-white ${DEAL_CLS[a.deal]}`}>{dealName[a.deal]}</span>
      </Link>
      <Link to={`/elonlar/${a.id}`} className="min-w-0 flex-1 py-0.5">
        <h3 className="line-clamp-2 pr-7 text-[14px] font-bold leading-tight text-[#0d2a4a]">{a.title}</h3>
        <p className="mt-0.5 line-clamp-2 text-[10.5px] leading-snug text-[#7d8fa9]">{a.short || a.sub}</p>
        <p className={`mt-1 whitespace-nowrap font-extrabold tracking-tight text-[#0b8a95] ${a.deal === 'job' ? 'text-[14.5px]' : 'text-[16px]'}`}>{adPrice(a)}</p>
        <p className="mt-1.5 flex items-center gap-3 whitespace-nowrap text-[10.5px] text-muted">
          <span className="flex items-center gap-1"><MapPin className="size-3.5 text-sea" /> {a.city}</span>
          <span className="flex items-center gap-1"><CalendarDays className="size-3.5 text-sea" /> {a.date}</span>
        </p>
      </Link>
      <button type="button" onClick={onSave} aria-label="Saqlash" aria-pressed={saved} className="absolute right-1.5 top-1.5 grid size-8 place-items-center">
        <Heart className={`size-5 ${saved ? 'fill-sale text-sale' : 'text-[#0b6d73]'}`} />
      </button>
    </article>
  )
}

const chip = (on) => `flex h-9 items-center gap-1.5 rounded-xl border px-3 text-[12.5px] font-medium ${on ? 'border-sea bg-sea-50 text-sea' : 'border-line text-ink'}`

function FilterSheet({ initial, count, savedCount, onClose, onApply }) {
  const [f, setF] = useState(initial)
  const num = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value.replace(/\D/g, '') }))
  return (
    <BottomSheet
      title="Filtrlar"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={() => setF(EMPTY)} className="h-12 rounded-xl border border-line px-4 text-[13.5px] font-semibold text-ink">Tozalash</button>
          <button type="button" onClick={() => onApply(f)} className="h-12 flex-1 rounded-xl bg-sea text-[14px] font-semibold text-white">{count(f)} ta e’lon</button>
        </>
      }
    >
      <p className="mt-3 text-[13px] font-semibold text-ink">Shahar</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {AD_CITIES.map((c) => {
          const on = f.cities.includes(c)
          return <button key={c} type="button" aria-pressed={on} onClick={() => setF((s) => ({ ...s, cities: on ? s.cities.filter((x) => x !== c) : [...s.cities, c] }))} className={chip(on)}>{on && <Check className="size-3.5" />}{c}</button>
        })}
      </div>
      <p className="mt-4 text-[13px] font-semibold text-ink">Narx, so‘m</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <input value={f.min} onChange={num('min')} inputMode="numeric" placeholder="dan" className="h-11 rounded-xl border border-line px-3 text-[14px] outline-none focus:border-sea" />
        <input value={f.max} onChange={num('max')} inputMode="numeric" placeholder="gacha" className="h-11 rounded-xl border border-line px-3 text-[14px] outline-none focus:border-sea" />
      </div>
      <p className="mt-4 text-[13px] font-semibold text-ink">Holati</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {['Yangi', 'Ishlatilgan'].map((c) => <button key={c} type="button" aria-pressed={f.cond === c} onClick={() => setF((s) => ({ ...s, cond: s.cond === c ? '' : c }))} className={chip(f.cond === c)}>{f.cond === c && <Check className="size-3.5" />}{c}</button>)}
      </div>
      <p className="mt-4 text-[13px] font-semibold text-ink">Saralash</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {SORTS.map(([k, l]) => <button key={k} type="button" aria-pressed={f.sort === k} onClick={() => setF((s) => ({ ...s, sort: k }))} className={chip(f.sort === k)}>{f.sort === k && <Check className="size-3.5" />}{l}</button>)}
      </div>
      <button type="button" onClick={() => setF((s) => ({ ...s, saved: !s.saved }))} className="mb-2 mt-4 flex h-12 w-full items-center justify-between rounded-xl border border-line px-3 text-[13px] font-medium text-ink">
        <span className="flex items-center gap-2"><Heart className="size-4 text-sea" /> Faqat saqlanganlar ({savedCount})</span>
        <span className={`relative h-6 w-10 rounded-full transition ${f.saved ? 'bg-sea' : 'bg-line'}`}><span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${f.saved ? 'left-[18px]' : 'left-0.5'}`} /></span>
      </button>
    </BottomSheet>
  )
}

const CAT_IMG = { uskuna: '/images/jihozlar/fengdan.jpg', material: '/images/market/p3.jpg', klinika: '/images/jihozlar/fengdan-room.jpg', ish: '/images/ishlar/ish-hall.jpg', asbob: '/images/market/p5.jpg' }

function PostAdSheet({ onClose, onDone }) {
  const [f, setF] = useState({ deal: 'sale', cat: 'material', title: '', sub: '', price: '', priceMax: '', city: 'Toshkent', cond: 'Yangi', phone: '+998 ' })
  const [photos, setPhotos] = useState([])
  const [tried, setTried] = useState(false)
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  const num = (v) => Number(String(v).replace(/\D/g, ''))
  const isJob = f.deal === 'job'
  const errs = {
    title: f.title.trim().length < 3,
    price: !num(f.price) || (isJob && num(f.priceMax) < num(f.price)),
    phone: f.phone.replace(/\D/g, '').length !== 12,
  }
  const ok = !Object.values(errs).some(Boolean)
  const field = (bad) => `h-11 w-full rounded-xl border px-3 text-[14px] outline-none focus:border-sea ${tried && bad ? 'border-sale' : 'border-line'}`
  const addPhotos = (e) => {
    const files = [...e.target.files].slice(0, 6 - photos.length)
    setPhotos((p) => [...p, ...files.map((x) => URL.createObjectURL(x))])
    e.target.value = ''
  }
  const submit = () => {
    setTried(true)
    if (!ok) return
    const d = new Date()
    onDone({
      id: `mening-${Date.now()}`, deal: f.deal, cat: isJob ? 'ish' : f.cat, title: f.title.trim(), sub: f.sub.trim() || 'Yangi e’lon',
      price: num(f.price), priceMax: isJob ? num(f.priceMax) : undefined, city: f.city, date: `${d.getDate()} ${['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'][d.getMonth()]} ${d.getFullYear()}`,
      cond: isJob ? 'To‘liq stavka' : f.cond, original: false, views: 0,
      images: photos.length ? photos : [CAT_IMG[isJob ? 'ish' : f.cat]],
      specs: [['cat', 'Turi', dealName[f.deal]], ['place', 'Shahar', f.city], ['cond', isJob ? 'Bandlik' : 'Holati', isJob ? 'To‘liq stavka' : f.cond]],
      about: f.sub.trim() || 'Batafsil ma’lumot uchun qo‘ng‘iroq qiling.', features: [],
      seller: '', sellerInfo: { id: 'me', name: 'Siz', type: 'Xususiy shaxs', phone: f.phone, rating: 5, since: String(d.getFullYear()) },
    })
  }
  return (
    <BottomSheet title="E’lon joylash" onClose={onClose} footer={<button type="button" onClick={submit} className="h-12 flex-1 rounded-xl bg-[#0b6d73] text-[14px] font-semibold text-white">E’lonni joylash</button>}>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {DEALS.map(([k, l]) => <button key={k} type="button" aria-pressed={f.deal === k} onClick={() => setF((s) => ({ ...s, deal: k }))} className={`h-10 rounded-xl text-[12.5px] font-semibold ${f.deal === k ? 'bg-[#0b8a95] text-white' : 'border border-line text-ink'}`}>{l}</button>)}
      </div>
      {!isJob && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {AD_CATS.filter(([k]) => k !== 'all' && k !== 'ish').map(([k, l]) => <button key={k} type="button" aria-pressed={f.cat === k} onClick={() => setF((s) => ({ ...s, cat: k }))} className={chip(f.cat === k)}>{f.cat === k && <Check className="size-3.5" />}{l}</button>)}
        </div>
      )}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {photos.map((src, i) => (
          <span key={src} className="relative size-16 shrink-0 overflow-hidden rounded-xl">
            <img src={src} alt="" className="size-full object-cover" />
            <button type="button" onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))} aria-label="Rasmni o‘chirish" className="absolute right-0.5 top-0.5 grid size-5 place-items-center rounded-full bg-ink/60 text-white"><X className="size-3" /></button>
          </span>
        ))}
        {photos.length < 6 && (
          <label className="grid size-16 shrink-0 cursor-pointer place-items-center rounded-xl border border-dashed border-sea/50 bg-sea-50 text-sea">
            <ImagePlus className="size-6" />
            <input type="file" accept="image/*" multiple onChange={addPhotos} className="hidden" />
          </label>
        )}
      </div>
      <div className="mt-2 flex flex-col gap-2 pb-2">
        <input value={f.title} onChange={set('title')} placeholder={isJob ? 'Lavozim (masalan, Stomatolog kerak)' : 'Sarlavha (masalan, Kompozit A2)'} className={field(errs.title)} />
        <textarea value={f.sub} onChange={set('sub')} rows={2} placeholder="Qisqacha tavsif" className="w-full resize-none rounded-xl border border-line px-3 py-2.5 text-[13.5px] outline-none focus:border-sea" />
        <div className="grid grid-cols-2 gap-2">
          <input value={f.price} onChange={set('price')} inputMode="numeric" placeholder={isJob ? 'Maosh dan' : f.deal === 'rent' ? 'Narx / oy' : 'Narx, so‘m'} className={field(errs.price)} />
          {isJob
            ? <input value={f.priceMax} onChange={set('priceMax')} inputMode="numeric" placeholder="Maosh gacha" className={field(errs.price)} />
            : <select value={f.cond} onChange={set('cond')} aria-label="Holati" className={field(false)}><option>Yangi</option><option>Ishlatilgan</option></select>}
          <select value={f.city} onChange={set('city')} aria-label="Shahar" className={field(false)}>{AD_CITIES.map((c) => <option key={c}>{c}</option>)}</select>
          <PhoneInput value={f.phone} onChange={(v) => set('phone')({ target: { value: toE164(v) || extractUzLocalDigits(v) } })} valueMode="e164" className={field(errs.phone)} invalid={errs.phone} placeholder="+998 90 123 45 67" />
        </div>
        {tried && !ok && <p className="text-[11.5px] text-sale">Qizil maydonlarni to‘ldiring</p>}
      </div>
    </BottomSheet>
  )
}
