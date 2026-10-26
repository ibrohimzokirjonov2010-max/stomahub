import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, X, LayoutGrid, Microscope, Scissors, Sparkles, Baby, Filter, BadgeCheck, Heart, Star, MapPin, BriefcaseBusiness,
  GraduationCap, FileText, MessageCircle, Phone, Check, Send, Copy,
} from 'lucide-react'
import { DOCTORS, SPECS, CITIES } from '../../mutaxassislarData'
import { MobileToast } from './parts'
import MobileTabBar from './MobileTabBar'
import { BottomSheet, ToothIcon } from './MobileSeminars'
import { HubTopBar } from './MobileKategoriyalar'
import { ImplantIcon, BracesIcon } from './MobileBooks'

const ICONS = { all: LayoutGrid, stomatolog: ToothIcon, implantolog: ImplantIcon, ortodont: BracesIcon, endodont: Microscope, jarroh: Scissors, estetik: Sparkles, pediatr: Baby }
const SORTS = [['rec', 'Tavsiya etilgan'], ['rating', 'Reyting bo‘yicha'], ['reviews', 'Sharhlar soni'], ['exp', 'Tajriba']]
const EMPTY = { cities: [], online: false, cert: false, sort: 'rec' }

const favs = new Set()
export function useFav() {
  const [, bump] = useState(0)
  const toggle = (id) => {
    if (favs.has(id)) favs.delete(id)
    else favs.add(id)
    bump((n) => n + 1)
    return favs.has(id)
  }
  return [favs, toggle]
}

export function Stars({ value, size = 'size-3.5' }) {
  return (
    <span className="flex">
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`${size} ${i <= Math.round(value) ? 'fill-star text-star' : 'fill-line text-line'}`} />)}
    </span>
  )
}

export default function MobileMutaxassislar() {
  const [q, setQ] = useState('')
  const [spec, setSpec] = useState('all')
  const [filter, setFilter] = useState(EMPTY)
  const [sheet, setSheet] = useState(false)
  const [chat, setChat] = useState(null)
  const [call, setCall] = useState(null)
  const [fav, toggleFav] = useFav()
  const [toast, setToast] = useState('')
  const closeToast = useCallback(() => setToast(''), [])

  const matches = useCallback((d, f) =>
    (!f.cities.length || f.cities.includes(d.city)) && (!f.online || d.online) && (!f.cert || d.cert), [])

  const base = useMemo(() => {
    const s = q.trim().toLowerCase()
    return DOCTORS
      .filter((d) => spec === 'all' || d.specs.includes(spec))
      .filter((d) => !s || `${d.name} ${d.role} ${d.city} ${d.district} ${d.tags.join(' ')} ${d.clinic}`.toLowerCase().includes(s))
  }, [q, spec])
  const list = useMemo(() => {
    const rows = base.filter((d) => matches(d, filter))
    return filter.sort === 'rec' ? rows : [...rows].sort((a, b) => b[filter.sort] - a[filter.sort])
  }, [base, filter, matches])
  const active = filter.cities.length + (filter.online ? 1 : 0) + (filter.cert ? 1 : 0) + (filter.sort !== 'rec' ? 1 : 0)

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef8f7_0%,#f6faf9_40%,#f6faf9_100%)] pb-[86px]">
      <div className="px-3.5 pt-3">
        <HubTopBar onBell={() => setToast('Yangi bildirishnomalar yo‘q')} />
        <h1 className="mt-3 text-[27px] font-extrabold leading-tight tracking-tight text-[#0d2a4a]">Mutaxassislar</h1>
        <p className="mt-0.5 text-[12.5px] text-[#7d8fa9]">Tajribali stomatologlar va soha mutaxassislari</p>
        <label className="mt-3 flex h-11 items-center gap-2.5 rounded-2xl border border-line/70 bg-white px-3.5">
          <Search className="size-[18px] shrink-0 text-sea" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Mutaxassis, mutaxassislik yoki shahar bo‘yicha qidirish..." className="min-w-0 flex-1 bg-transparent text-[12.5px] text-ink outline-none placeholder:text-muted" />
          {q && <button type="button" onClick={() => setQ('')} aria-label="Tozalash" className="text-muted"><X className="size-4" /></button>}
        </label>
      </div>

      <div className="mt-3 flex items-center gap-2 pl-3.5">
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-0.5 no-scrollbar">
          {SPECS.map(([k, l]) => {
            const Icon = ICONS[k]
            const on = spec === k
            return (
              <button key={k} type="button" aria-pressed={on} onClick={() => setSpec(k)} className={`flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 text-[12px] font-medium transition ${on ? 'bg-[#0b6d73] text-white' : 'border border-line/70 bg-white text-ink'}`}>
                <Icon className="size-[18px]" strokeWidth={1.7} /> {l}
              </button>
            )
          })}
        </div>
        <button type="button" onClick={() => setSheet(true)} aria-label="Filtrlar" className="relative mr-3.5 grid size-10 shrink-0 place-items-center rounded-xl border border-line/70 bg-white text-ink">
          <Filter className="size-[18px]" />
          {active > 0 && <span className="absolute -right-1 -top-1 grid size-[18px] place-items-center rounded-full bg-sea text-[10px] font-bold text-white ring-2 ring-[#f1f7fa]">{active}</span>}
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-2.5 px-3.5">
        {list.length ? list.map((d) => (
          <DoctorCard
            key={d.id}
            d={d}
            fav={fav.has(d.id)}
            onFav={() => setToast(toggleFav(d.id) ? 'Sevimlilarga qo‘shildi' : 'Sevimlilardan olib tashlandi')}
            onChat={() => setChat(d)}
            onCall={() => setCall(d)}
          />
        )) : (
          <div className="rounded-2xl bg-white px-6 py-10 text-center">
            <p className="text-[14px] font-semibold text-ink">Mutaxassis topilmadi</p>
            <p className="mt-1 text-[12px] text-muted">Qidiruv yoki filtrlarni o‘zgartirib ko‘ring</p>
            <button type="button" onClick={() => { setQ(''); setSpec('all'); setFilter(EMPTY) }} className="mt-3 h-9 rounded-xl bg-sea-50 px-4 text-[12.5px] font-semibold text-sea">Filtrlarni tozalash</button>
          </div>
        )}
      </div>

      {sheet && <FilterSheet initial={filter} count={(f) => base.filter((d) => matches(d, f)).length} onClose={() => setSheet(false)} onApply={(f) => { setFilter(f); setSheet(false) }} />}
      {chat && <ChatSheet d={chat} onClose={() => setChat(null)} onSent={() => { setChat(null); setToast('Xabar yuborildi. Mutaxassis tez orada javob beradi') }} />}
      {call && <CallSheet d={call} onClose={() => setCall(null)} onChat={() => { setCall(null); setChat(call) }} onToast={setToast} />}

      <MobileToast text={toast} onClose={closeToast} />
      <MobileTabBar />
    </div>
  )
}

function DoctorCard({ d, fav, onFav, onChat, onCall }) {
  return (
    <article className="flex gap-2.5 rounded-2xl bg-white p-2.5 shadow-[0_1px_4px_rgb(11_31_58/0.06)]">
      <Link to={`/mutaxassislar/${d.id}`} className="relative w-[112px] shrink-0 overflow-hidden rounded-xl bg-[#eef3f5]">
        <img src={d.photo} alt={d.name} loading="lazy" className="absolute inset-0 size-full object-cover object-top" />
        <span className={`absolute left-2 top-2 size-3 rounded-full ring-2 ring-white ${d.online ? 'bg-[#22c55e]' : 'bg-[#9aa7b4]'}`} title={d.online ? 'Onlayn' : 'Oflayn'} />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-1">
          <Link to={`/mutaxassislar/${d.id}`} className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-[14.5px] font-bold leading-tight text-[#0d2a4a]"><span className="truncate">{d.name}</span><BadgeCheck className="size-4 shrink-0 fill-sea text-white" /></p>
            <p className="mt-0.5 truncate text-[11.5px] text-[#5f8f93]">{d.role}</p>
          </Link>
          <button type="button" onClick={onFav} aria-label="Sevimlilarga" aria-pressed={fav} className="-mr-0.5 -mt-0.5 grid size-8 shrink-0 place-items-center"><Heart className={`size-5 ${fav ? 'fill-sale text-sale' : 'text-sea'}`} /></button>
        </div>
        <p className="mt-1 flex items-center gap-1 whitespace-nowrap text-[10.5px] text-ink-2">
          <Stars value={d.rating} size="size-[11px]" /> <b className="font-semibold text-ink">{d.rating}</b>
          <span className="text-muted">({d.reviews} ta sharh)</span>
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-[10.5px] text-ink-2"><MapPin className="size-3 shrink-0 text-sea" /> <span className="truncate">{d.city}, {d.district}</span></p>
        <p className="mt-1.5 flex items-center gap-2 whitespace-nowrap text-[10px] text-ink-2">
          <span className="flex items-center gap-0.5"><BriefcaseBusiness className="size-3 text-sea" /> {d.exp} yil</span>
          <span className="flex items-center gap-0.5"><GraduationCap className="size-3 text-sea" /> {d.patients} bemor</span>
          {d.cert && <span className="flex min-w-0 items-center gap-0.5"><FileText className="size-3 shrink-0 text-sea" /> <span className="truncate">Sertifikat</span></span>}
        </p>
        <div className="mt-1.5 flex h-[22px] flex-wrap gap-1 overflow-hidden">
          {d.tags.map((t) => <span key={t} className="h-[22px] whitespace-nowrap rounded-md bg-[#e6f4f3] px-1.5 text-[10px] leading-[22px] text-[#0b6d73]">{t}</span>)}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <button type="button" onClick={onChat} className="flex h-9 items-center justify-center gap-1 rounded-xl bg-[#e6f4f3] text-[11.5px] font-semibold text-[#0b6d73]"><MessageCircle className="size-4" /> Xabar yozish</button>
          <button type="button" onClick={onCall} className="flex h-9 items-center justify-center gap-1 rounded-xl bg-[#0b6d73] text-[11.5px] font-semibold text-white"><Phone className="size-4" /> Bog‘lanish</button>
        </div>
      </div>
    </article>
  )
}

function FilterSheet({ initial, count, onClose, onApply }) {
  const [f, setF] = useState(initial)
  const chip = (on) => `flex h-9 items-center gap-1.5 rounded-xl border px-3 text-[12.5px] font-medium ${on ? 'border-sea bg-sea-50 text-sea' : 'border-line text-ink'}`
  const sw = (key, label) => (
    <button type="button" onClick={() => setF((s) => ({ ...s, [key]: !s[key] }))} className="mt-2 flex h-12 w-full items-center justify-between rounded-xl border border-line px-3 text-[13px] font-medium text-ink">
      {label}
      <span className={`relative h-6 w-10 rounded-full transition ${f[key] ? 'bg-sea' : 'bg-line'}`}><span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${f[key] ? 'left-[18px]' : 'left-0.5'}`} /></span>
    </button>
  )
  return (
    <BottomSheet
      title="Filtrlar"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={() => setF(EMPTY)} className="h-12 rounded-xl border border-line px-4 text-[13.5px] font-semibold text-ink">Tozalash</button>
          <button type="button" onClick={() => onApply(f)} className="h-12 flex-1 rounded-xl bg-sea text-[14px] font-semibold text-white">{count(f)} ta mutaxassis</button>
        </>
      }
    >
      <p className="mt-3 text-[13px] font-semibold text-ink">Shahar</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {CITIES.map((c) => {
          const on = f.cities.includes(c)
          return <button key={c} type="button" aria-pressed={on} onClick={() => setF((s) => ({ ...s, cities: on ? s.cities.filter((x) => x !== c) : [...s.cities, c] }))} className={chip(on)}>{on && <Check className="size-3.5" />} {c}</button>
        })}
      </div>
      <p className="mt-4 text-[13px] font-semibold text-ink">Saralash</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {SORTS.map(([k, l]) => <button key={k} type="button" aria-pressed={f.sort === k} onClick={() => setF((s) => ({ ...s, sort: k }))} className={chip(f.sort === k)}>{f.sort === k && <Check className="size-3.5" />} {l}</button>)}
      </div>
      <div className="mt-3">
        {sw('online', 'Hozir onlayn')}
        {sw('cert', 'Xalqaro sertifikatga ega')}
      </div>
    </BottomSheet>
  )
}

function PersonPic({ d, className }) {
  if (!d.photo) return <span className={`grid shrink-0 place-items-center rounded-full bg-[#e6f4f3] text-sea ${className}`}><ToothIcon className="size-1/2" strokeWidth={1.7} /></span>
  return <img src={d.photo} alt="" className={`shrink-0 rounded-full object-cover object-top ${className}`} />
}

const QUICK = ['Konsultatsiya olmoqchiman', 'Narxlar haqida', 'Qabulga yozilish', 'Rentgen yuborsam bo‘ladimi?']

export function ChatSheet({ d, onClose, onSent, initial, quick = QUICK }) {
  const [text, setText] = useState(initial || `Assalomu alaykum, ${d.name}! Konsultatsiya olmoqchi edim.`)
  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end bg-ink/45" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Xabar yozish" onClick={(e) => e.stopPropagation()} className="rounded-t-3xl bg-white px-4 pb-[calc(14px+env(safe-area-inset-bottom))] pt-3">
        <div className="flex items-center gap-3">
          <PersonPic d={d} className="size-11" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold text-ink">{d.name}</p>
            <p className={`text-[11.5px] ${d.online ? 'text-ok' : 'text-muted'}`}>{d.online ? 'Onlayn · odatda 10 daqiqada javob beradi' : 'Oflayn · ish vaqtida javob beradi'}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Yopish" className="grid size-8 place-items-center rounded-full bg-page text-ink"><X className="size-4" /></button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {quick.map((x) => <button key={x} type="button" onClick={() => setText(x)} className="h-8 rounded-lg bg-page px-2.5 text-[12px] text-ink-2">{x}</button>)}
        </div>
        <div className="mt-3 flex items-end gap-2">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className="min-h-[80px] flex-1 resize-none rounded-xl border border-line px-3 py-2.5 text-[13.5px] text-ink outline-none focus:border-sea" />
          <button type="button" disabled={!text.trim()} onClick={onSent} aria-label="Yuborish" className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#0b6d73] text-white disabled:opacity-40"><Send className="size-5" /></button>
        </div>
      </div>
    </div>
  )
}

export function CallSheet({ d, onClose, onChat, onToast }) {
  return (
    <BottomSheet title="Bog‘lanish" onClose={onClose}>
      <div className="mt-2 flex items-center gap-3 rounded-2xl bg-[#f2f8f8] p-3">
        <PersonPic d={d} className="size-12" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-bold text-ink">{d.name}</p>
          <p className="text-[12px] text-muted">{d.clinic} · {d.city}</p>
        </div>
      </div>
      <a href={`tel:${d.phone.replace(/\s/g, '')}`} className="mt-3 flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0b6d73] text-[14px] font-semibold text-white"><Phone className="size-[18px]" /> {d.phone}</a>
      <div className="mt-2 grid grid-cols-2 gap-2 pb-2">
        <button type="button" onClick={onChat} className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[#e6f4f3] text-[13px] font-semibold text-[#0b6d73]"><MessageCircle className="size-4" /> Xabar yozish</button>
        <button type="button" onClick={() => { navigator.clipboard?.writeText(d.phone).catch(() => {}); onToast('Raqam nusxalandi'); onClose() }} className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-line text-[13px] font-semibold text-ink"><Copy className="size-4" /> Nusxalash</button>
      </div>
    </BottomSheet>
  )
}
