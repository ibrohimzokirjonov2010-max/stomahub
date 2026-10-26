import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search, SlidersHorizontal, X, LayoutGrid, MapPin, ChevronDown, BriefcaseBusiness, Wallet, ArrowUpDown, Bookmark,
  CalendarDays, ArrowRight, Plus, Check, UserRound, FlaskConical, ClipboardList, Scissors, Baby, Sparkles, Stethoscope,
} from 'lucide-react'
import { jobs, cities, specs, types, typeName, exps, pay } from '../../ishlarData'
import { MobileTopBar, MobileToast } from './parts'
import MobileTabBar from './MobileTabBar'
import { BottomSheet, ToothIcon } from './MobileSeminars'
import { BracesIcon } from './MobileBooks'

const SPEC_ICONS = { terapevt: ToothIcon, ortoped: Stethoscope, assistent: UserRound, texnik: FlaskConical, admin: ClipboardList, ortodont: BracesIcon, jarroh: Scissors, bolalar: Baby, gigiyenist: Sparkles }
const SPEC_LABEL = { terapevt: 'Stomatolog-terapevt', ortoped: 'Ortoped', assistent: 'Assistent', texnik: 'Tish texniki', admin: 'Ma’mur', ortodont: 'Ortodont', jarroh: 'Jarroh', bolalar: 'Bolalar', gigiyenist: 'Gigiyenist' }
const SPEC_ORDER = ['terapevt', 'ortoped', 'assistent', 'texnik', 'admin', 'ortodont', 'jarroh', 'bolalar', 'gigiyenist']
const PAYS = [['', 'Maosh'], ['5000000', '5 mln dan'], ['10000000', '10 mln dan'], ['15000000', '15 mln dan']]
const SORTS = [['fresh', 'Eng yangi'], ['pay', 'Maosh yuqori'], ['exp', 'Tajriba kam']]
const EXP_RANK = { none: 0, y1: 1, y3: 2, y5: 3 }
const PAGE = 10

export const TYPE_CLS = { full: 'bg-[#e3f8ec] text-[#16a05a]', part: 'bg-[#fff3df] text-[#c77700]', shift: 'bg-[#e6f0fc] text-[#1f6fd1]', remote: 'bg-[#f3e8ff] text-[#8b3fd6]' }
export const expText = (j) => (j.exp === 'none' ? 'Tajriba talab qilinmaydi' : `${j.expLabel || { y1: '1+ yil', y3: '3+ yil', y5: '5+ yil' }[j.exp]} tajriba`)

let store = { added: [], saved: new Set(), applied: new Set() }
const subs = new Set()
const emit = (next) => {
  store = { ...store, ...next }
  subs.forEach((f) => f())
}
export function useJobs() {
  return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f) }, () => store)
}
const flip = (s, id) => {
  const n = new Set(s)
  if (n.has(id)) n.delete(id)
  else n.add(id)
  return n
}
export const jobsStore = {
  toggleSave: (id) => emit({ saved: flip(store.saved, id) }),
  apply: (id) => emit({ applied: new Set(store.applied).add(id) }),
  add: (j) => emit({ added: [j, ...store.added] }),
}
export const allJobs = () => [...store.added, ...jobs]
export const findJob = (id) => allJobs().find((j) => j.id === id) || null

export default function MobileIshlar() {
  const navigate = useNavigate()
  const { added, saved, applied } = useJobs()
  const [q, setQ] = useState('')
  const [spec, setSpec] = useState('all')
  const [city, setCity] = useState('toshkent')
  const [type, setType] = useState('')
  const [minPay, setMinPay] = useState('')
  const [sort, setSort] = useState('fresh')
  const [extra, setExtra] = useState({ exp: '', onlySaved: false })
  const [shown, setShown] = useState(PAGE)
  const [sheet, setSheet] = useState(null)
  const [toast, setToast] = useState('')
  const closeToast = useCallback(() => setToast(''), [])
  const searchRef = useRef(null)

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    const rows = [...added, ...jobs].filter((j) =>
      (spec === 'all' || j.spec === spec) &&
      (!city || j.city === city) &&
      (!type || j.type === type) &&
      (!minPay || j.max >= Number(minPay)) &&
      (!extra.exp || j.exp === extra.exp) &&
      (!extra.onlySaved || saved.has(j.id)) &&
      (!s || `${j.title} ${j.clinic} ${j.cityLabel} ${j.district}`.toLowerCase().includes(s)))
    if (sort === 'pay') return rows.sort((a, b) => b.max - a.max)
    if (sort === 'exp') return rows.sort((a, b) => EXP_RANK[a.exp] - EXP_RANK[b.exp])
    return rows.sort((a, b) => a.rank - b.rank)
  }, [added, q, spec, city, type, minPay, extra, saved, sort])

  const more = (fn) => (v) => { fn(v); setShown(PAGE) }
  const extraCount = (extra.exp ? 1 : 0) + (extra.onlySaved ? 1 : 0)
  const reset = () => { setQ(''); setSpec('all'); setCity(''); setType(''); setMinPay(''); setExtra({ exp: '', onlySaved: false }); setShown(PAGE) }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef6fb_0%,#f6f9fb_35%)] pb-[146px]">
      <div className="px-3.5 pt-3">
        <MobileTopBar onSearch={() => searchRef.current?.focus()} onBell={() => setToast('Yangi bildirishnomalar yo‘q')} />
        <h1 className="mt-2.5 text-[27px] font-extrabold leading-tight tracking-tight text-[#0d2a4a]">Ishlar</h1>
        <p className="text-[12.5px] text-[#7d8fa9]">Stomatologiya sohasidagi vakansiyalar va ish e’lonlari</p>
        <div className="mt-3 flex h-11 items-center gap-2.5 rounded-2xl border border-line/70 bg-white pl-3.5 pr-1.5">
          <Search className="size-[18px] shrink-0 text-ink-2" />
          <input ref={searchRef} type="search" value={q} onChange={(e) => more(setQ)(e.target.value)} placeholder="Lavozim, klinika yoki shaharni qidiring..." className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-muted" />
          {q && <button type="button" onClick={() => setQ('')} aria-label="Tozalash" className="text-muted"><X className="size-4" /></button>}
          <button type="button" onClick={() => setSheet('filter')} aria-label="Qo‘shimcha filtrlar" className="relative grid size-8 shrink-0 place-items-center rounded-lg bg-[#eef6f6] text-sea">
            <SlidersHorizontal className="size-4" />
            {extraCount > 0 && <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-sea text-[9px] font-bold text-white">{extraCount}</span>}
          </button>
        </div>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto px-3.5 pb-0.5 no-scrollbar">
        {[['all', 'Barchasi', LayoutGrid], ...SPEC_ORDER.map((k) => [k, SPEC_LABEL[k], SPEC_ICONS[k]])].map(([k, l, Icon]) => {
          const on = spec === k
          return (
            <button key={k} type="button" aria-pressed={on} onClick={() => more(setSpec)(k)} className={`flex h-[68px] w-[78px] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border px-1 text-center text-[10.5px] leading-tight transition ${on ? 'border-sea bg-[#e6f6f5] font-semibold text-sea' : 'border-line/70 bg-white text-ink-2'}`}>
              <Icon className={`size-6 ${on ? 'text-sea' : 'text-[#2c8f97]'}`} strokeWidth={1.6} />
              {l}
            </button>
          )
        })}
      </div>

      <div className="mt-2.5 flex gap-1.5 overflow-x-auto px-3.5 pb-0.5 no-scrollbar">
        <Pick icon={MapPin} label={city ? cities.find(([k]) => k === city)[1] : 'Barcha shahar'} value={city} onChange={more(setCity)} options={[['', 'Barcha shaharlar'], ...cities]} on={!!city} />
        <Pick icon={BriefcaseBusiness} label={type ? typeName[type] : 'Bandlik turi'} value={type} onChange={more(setType)} options={[['', 'Barcha turlar'], ...types]} on={!!type} />
        <Pick icon={Wallet} label={PAYS.find(([k]) => k === minPay)[1]} value={minPay} onChange={more(setMinPay)} options={PAYS.map(([k, l]) => [k, k ? l : 'Har qanday'])} on={!!minPay} />
        <Pick icon={ArrowUpDown} label={sort === 'fresh' ? 'Saralash' : SORTS.find(([k]) => k === sort)[1]} value={sort} onChange={setSort} options={SORTS} on={sort !== 'fresh'} />
      </div>

      <p className="mt-3 px-3.5 text-[12px] text-muted"><b className="font-semibold text-ink">{list.length}</b> ta vakansiya topildi</p>

      <div className="mt-2 flex flex-col gap-2.5 px-3.5">
        {list.slice(0, shown).map((j) => (
          <JobCard
            key={j.id}
            j={j}
            saved={saved.has(j.id)}
            applied={applied.has(j.id)}
            onSave={() => { jobsStore.toggleSave(j.id); setToast(saved.has(j.id) ? 'Saqlanganlardan olib tashlandi' : 'Vakansiya saqlandi') }}
            onApply={() => navigate(`/ishlar/${j.id}`, { state: { apply: true } })}
          />
        ))}
        {list.length > shown && (
          <button type="button" onClick={() => setShown((n) => n + PAGE)} className="h-11 rounded-xl border border-line bg-white text-[13px] font-semibold text-sea">
            Yana ko‘rsatish ({list.length - shown})
          </button>
        )}
        {!list.length && (
          <div className="rounded-2xl bg-white px-6 py-10 text-center">
            <p className="text-[14px] font-semibold text-ink">Vakansiya topilmadi</p>
            <p className="mt-1 text-[12px] text-muted">Filtrlarni o‘zgartirib ko‘ring</p>
            <button type="button" onClick={reset} className="mt-3 h-9 rounded-xl bg-sea-50 px-4 text-[12.5px] font-semibold text-sea">Filtrlarni tozalash</button>
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-[62px] z-30 bg-gradient-to-t from-[#f6f9fb] via-[#f6f9fb]/90 to-transparent px-3.5 pb-2 pt-4">
        <button type="button" onClick={() => setSheet('post')} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(90deg,#0b8a95,#14a7a0)] text-[15px] font-semibold text-white shadow-[0_8px_20px_rgb(11_138_149/0.35)] active:scale-[0.99]">
          <Plus className="size-5" /> E’lon joylash <ArrowRight className="size-4" />
        </button>
      </div>

      {sheet === 'filter' && (
        <BottomSheet title="Qo‘shimcha filtrlar" onClose={() => setSheet(null)} footer={<button type="button" onClick={() => setSheet(null)} className="h-12 flex-1 rounded-xl bg-sea text-[14px] font-semibold text-white">{list.length} ta vakansiya</button>}>
          <p className="mt-3 text-[13px] font-semibold text-ink">Tajriba</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {exps.map(([k, l]) => {
              const on = extra.exp === k
              return <button key={k} type="button" aria-pressed={on} onClick={() => { setExtra((s) => ({ ...s, exp: on ? '' : k })); setShown(PAGE) }} className={`flex h-9 items-center gap-1.5 rounded-xl border px-3 text-[12.5px] font-medium ${on ? 'border-sea bg-sea-50 text-sea' : 'border-line text-ink'}`}>{on && <Check className="size-3.5" />}{l}</button>
            })}
          </div>
          <button type="button" onClick={() => setExtra((s) => ({ ...s, onlySaved: !s.onlySaved }))} className="mt-4 flex h-12 w-full items-center justify-between rounded-xl border border-line px-3 text-[13px] font-medium text-ink">
            <span className="flex items-center gap-2"><Bookmark className="size-4 text-sea" /> Faqat saqlanganlar ({saved.size})</span>
            <span className={`relative h-6 w-10 rounded-full transition ${extra.onlySaved ? 'bg-sea' : 'bg-line'}`}><span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${extra.onlySaved ? 'left-[18px]' : 'left-0.5'}`} /></span>
          </button>
          <button type="button" onClick={() => { reset(); setSheet(null) }} className="mt-3 h-10 w-full rounded-xl text-[13px] font-semibold text-sale">Barcha filtrlarni tozalash</button>
        </BottomSheet>
      )}
      {sheet === 'post' && (
        <PostJobSheet
          onClose={() => setSheet(null)}
          onDone={(j) => { jobsStore.add(j); setSheet(null); setSpec('all'); setCity(j.city); setType(''); setMinPay(''); setSort('fresh'); setToast('E’loningiz joylandi'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
        />
      )}

      <MobileToast text={toast} onClose={closeToast} bottom={136} />
      <MobileTabBar />
    </div>
  )
}

export function Pick({ icon: Icon, label, value, onChange, options, on }) {
  return (
    <label className={`relative flex h-10 shrink-0 items-center gap-1.5 rounded-xl border px-2.5 text-[11.5px] font-medium ${on ? 'border-sea bg-[#e6f6f5] text-sea' : 'border-line/70 bg-white text-ink'}`}>
      <Icon className="size-4 shrink-0" />
      <span className="whitespace-nowrap">{label}</span>
      <ChevronDown className="size-3.5 shrink-0 text-muted" />
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className="absolute inset-0 opacity-0">
        {options.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>
    </label>
  )
}

function JobCard({ j, saved, applied, onSave, onApply }) {
  return (
    <article className="flex gap-2.5 rounded-2xl bg-white p-2.5 shadow-[0_1px_4px_rgb(11_31_58/0.06)]">
      <Link to={`/ishlar/${j.id}`} className="w-[112px] shrink-0 overflow-hidden rounded-xl bg-page">
        <img src={j.image} alt={j.clinic} loading="lazy" className="size-full min-h-[118px] object-cover" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-1">
          <Link to={`/ishlar/${j.id}`} className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-[14px] font-bold leading-tight text-[#0d2a4a]">{j.title}</h3>
            <p className="mt-0.5 truncate text-[11.5px] text-muted">{j.clinic}</p>
          </Link>
          <button type="button" onClick={onSave} aria-label="Saqlash" aria-pressed={saved} className="-mr-1 -mt-1 grid size-8 shrink-0 place-items-center"><Bookmark className={`size-5 ${saved ? 'fill-sea text-sea' : 'text-ink'}`} /></button>
        </div>
        <p className="mt-1 flex items-center gap-1 text-[10.5px] text-ink-2">
          <MapPin className="size-3 shrink-0 text-muted" /> <span className="truncate">{j.cityLabel}, {j.district}</span>
          <span className={`ml-auto shrink-0 rounded-md px-1.5 py-0.5 text-[9.5px] font-semibold ${TYPE_CLS[j.type]}`}>{typeName[j.type]}</span>
        </p>
        <p className="mt-1 whitespace-nowrap text-[13px] font-extrabold tracking-tight text-[#0d2a4a]">{pay(j.min, j.max)}</p>
        <div className="mt-1.5 flex items-end gap-1.5">
          <div className="min-w-0 flex-1 text-[10px] leading-[1.45] text-muted">
            <p className="flex items-center gap-1 truncate"><BriefcaseBusiness className="size-3 shrink-0" /> <span className="truncate">{j.exp === 'none' ? 'Tajribasiz' : expText(j)}</span></p>
            <p className="flex items-center gap-1"><CalendarDays className="size-3 shrink-0" /> {j.posted}</p>
          </div>
          {applied ? (
            <span className="flex h-9 shrink-0 items-center gap-1 rounded-xl bg-[#e3f8ec] px-2.5 text-[11.5px] font-semibold text-[#16a05a]"><Check className="size-4" /> Yuborildi</span>
          ) : (
            <button type="button" onClick={onApply} className="flex h-9 shrink-0 items-center gap-1 rounded-xl bg-[linear-gradient(90deg,#0b8a95,#14a7a0)] px-2.5 text-[11.5px] font-semibold text-white">Ariza topshirish <ArrowRight className="size-3.5" /></button>
          )}
        </div>
      </div>
    </article>
  )
}

function PostJobSheet({ onClose, onDone }) {
  const [f, setF] = useState({ title: '', clinic: '', spec: 'terapevt', city: 'toshkent', district: '', type: 'full', min: '', max: '', phone: '+998 ', about: '' })
  const [tried, setTried] = useState(false)
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  const num = (v) => Number(String(v).replace(/\D/g, ''))
  const errs = {
    title: f.title.trim().length < 3,
    clinic: f.clinic.trim().length < 2,
    pay: !num(f.min) || num(f.max) < num(f.min),
    phone: f.phone.replace(/\D/g, '').length !== 12,
  }
  const ok = !Object.values(errs).some(Boolean)
  const field = (bad) => `h-11 w-full rounded-xl border px-3 text-[14px] outline-none focus:border-sea ${tried && bad ? 'border-sale' : 'border-line'}`
  const submit = () => {
    setTried(true)
    if (!ok) return
    const cityLabel = cities.find(([k]) => k === f.city)[1]
    onDone({
      id: `mening-${Date.now()}`, rank: -1, title: f.title.trim(), clinic: f.clinic.trim(), logo: f.clinic.slice(0, 2).toUpperCase(),
      city: f.city, cityLabel, district: f.district.trim() || 'Markaz', type: f.type, exp: 'y1', spec: f.spec,
      min: num(f.min), max: num(f.max), posted: 'Hozir', image: '/images/ishlar/ish-hall.jpg', phone: f.phone,
      about: f.about.trim() || `${f.clinic.trim()} klinikasiga ${f.title.trim().toLowerCase()} kerak.`, source: 'StomaHub', mine: true,
    })
  }
  return (
    <BottomSheet title="E’lon joylash" onClose={onClose} footer={<button type="button" onClick={submit} className="h-12 flex-1 rounded-xl bg-sea text-[14px] font-semibold text-white">E’lonni joylash</button>}>
      <div className="mt-2 flex flex-col gap-2 pb-2">
        <input value={f.title} onChange={set('title')} placeholder="Lavozim (masalan, Stomatolog-terapevt)" className={field(errs.title)} />
        <input value={f.clinic} onChange={set('clinic')} placeholder="Klinika nomi" className={field(errs.clinic)} />
        <div className="grid grid-cols-2 gap-2">
          <select value={f.spec} onChange={set('spec')} className={field(false)}>{specs.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <select value={f.type} onChange={set('type')} className={field(false)}>{types.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <select value={f.city} onChange={set('city')} className={field(false)}>{cities.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <input value={f.district} onChange={set('district')} placeholder="Tuman" className={field(false)} />
          <input value={f.min} onChange={set('min')} inputMode="numeric" placeholder="Maosh dan" className={field(errs.pay)} />
          <input value={f.max} onChange={set('max')} inputMode="numeric" placeholder="Maosh gacha" className={field(errs.pay)} />
        </div>
        {tried && errs.pay && <p className="text-[11.5px] text-sale">Maosh oralig‘ini to‘g‘ri kiriting</p>}
        <input value={f.phone} onChange={set('phone')} inputMode="tel" placeholder="+998 90 123 45 67" className={field(errs.phone)} />
        <textarea value={f.about} onChange={set('about')} rows={3} placeholder="Qisqacha tavsif (ixtiyoriy)" className="w-full resize-none rounded-xl border border-line px-3 py-2.5 text-[13.5px] outline-none focus:border-sea" />
        {tried && !ok && <p className="text-[11.5px] text-sale">Qizil maydonlarni to‘ldiring</p>}
      </div>
    </BottomSheet>
  )
}
