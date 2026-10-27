import { useCallback, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search, X, LayoutGrid, Armchair, ScanLine, Wrench, Cog, MessagesSquare, MapPin, Settings2, Wallet, ArrowUpDown, BadgeCheck,
  Star, BriefcaseBusiness, ChevronRight, Phone, CalendarDays, Plus, ArrowRight, Check, Zap,
} from 'lucide-react'
import { USTALAR, USTA_CATS, USTA_CITIES, USTA_SPECS, som } from '../../ustalarMobileData'
import { MobileTopBar, MobileToast } from './parts'
import MobileTabBar from './MobileTabBar'
import { BottomSheet } from './MobileSeminars'
import { Lightbox } from './MobileCommunity'
import { ChatSheet, CallSheet } from './MobileMutaxassislar'
import { Pick } from './MobileIshlar'
import PhoneInput, { extractUzLocalDigits, isCompleteUzPhone, PHONE_INCOMPLETE_MSG, toE164 } from '../PhoneInput'

const CAT_ICONS = { all: LayoutGrid, kreslo: Armchair, rentgen: ScanLine, ornatish: Wrench, tamir: Cog, konsult: MessagesSquare }
const PRICES = [['', 'Narx'], ['200000', '200 ming gacha'], ['300000', '300 ming gacha'], ['500000', '500 ming gacha']]
const SORTS = [['rec', 'Tavsiya etilgan'], ['rating', 'Reyting yuqori'], ['reviews', 'Ko‘p baholangan'], ['price', 'Arzonroq'], ['years', 'Tajribaliroq']]
const TIMES = ['09:00', '11:00', '14:00', '16:00', '18:00']
const DAYS = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan']
export const USTA_QUICK = ['Narxini bilmoqchiman', 'Bugun kela olasizmi?', 'Diagnostika qancha turadi?', 'Kafolat berasizmi?']

export function StatusBadge({ m, className = '' }) {
  return m.status === 'online'
    ? <span className={`flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-[#16a05a] shadow-sm ${className}`}><span className="size-1.5 rounded-full bg-[#22c55e]" /> Onlayn</span>
    : <span className={`flex items-center gap-1 rounded-full bg-[#334155]/80 px-2 py-0.5 text-[10px] font-semibold text-white ${className}`}><span className="size-1.5 rounded-full bg-white" /> Band</span>
}

export default function MobileUstalar() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [city, setCity] = useState('Toshkent')
  const [spec, setSpec] = useState('')
  const [price, setPrice] = useState('')
  const [sort, setSort] = useState('rec')
  const [sheet, setSheet] = useState(null)
  const [zoom, setZoom] = useState(null)
  const [toast, setToast] = useState('')
  const closeToast = useCallback(() => setToast(''), [])
  const searchRef = useRef(null)

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    const rows = USTALAR.filter((m) =>
      (cat === 'all' || m.cats.includes(cat)) &&
      (!city || m.city === city) &&
      (!spec || m.services.some((x) => x.tag === spec)) &&
      (!price || m.priceFrom <= Number(price)) &&
      (!s || `${m.name} ${m.role} ${m.city} ${m.district} ${m.tags.join(' ')} ${m.services.map((x) => x.name).join(' ')}`.toLowerCase().includes(s)))
    if (sort === 'price') return [...rows].sort((a, b) => a.priceFrom - b.priceFrom)
    if (sort !== 'rec') return [...rows].sort((a, b) => b[sort] - a[sort])
    return rows
  }, [q, cat, city, spec, price, sort])

  const reset = () => { setQ(''); setCat('all'); setCity(''); setSpec(''); setPrice(''); setSort('rec') }
  const order = (m, service) => setSheet({ order: m, service })

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef6fb_0%,#f6f9fb_35%)] pb-[146px]">
      <div className="px-3.5 pt-3">
        <MobileTopBar onSearch={() => searchRef.current?.focus()} onBell={() => setToast('Yangi bildirishnomalar yo‘q')} />
        <h1 className="mt-2.5 text-[27px] font-extrabold leading-tight tracking-tight text-[#0d2a4a]">Ustalar</h1>
        <p className="text-[12.5px] text-[#7d8fa9]">Stomatologik uskunalar ta’mirlash ustalari</p>
        <label className="mt-3 flex h-11 items-center gap-2.5 rounded-2xl border border-line/70 bg-white px-3.5">
          <Search className="size-[18px] shrink-0 text-ink-2" />
          <input ref={searchRef} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Usta, mutaxassislik yoki xizmatni qidiring..." className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-muted" />
          {q && <button type="button" onClick={() => setQ('')} aria-label="Tozalash" className="text-muted"><X className="size-4" /></button>}
        </label>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto px-3.5 pb-0.5 no-scrollbar">
        {USTA_CATS.map(([k, l]) => {
          const Icon = CAT_ICONS[k]
          const on = cat === k
          return (
            <button key={k} type="button" aria-pressed={on} onClick={() => setCat(k)} className="flex w-[64px] shrink-0 flex-col items-center gap-1">
              <span className={`grid size-[58px] place-items-center rounded-2xl transition ${on ? 'bg-[linear-gradient(135deg,#0b8a95,#14a7a0)] text-white shadow-[0_6px_14px_rgb(11_138_149/0.3)]' : 'border border-line/70 bg-white text-[#0b6d73]'}`}>
                <Icon className="size-[26px]" strokeWidth={1.6} />
              </span>
              <span className={`text-[10.5px] leading-tight ${on ? 'font-semibold text-sea' : 'text-ink-2'}`}>{l}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-2.5 flex gap-1.5 overflow-x-auto px-3.5 pb-0.5 no-scrollbar">
        <Pick icon={MapPin} label={city || 'Barcha shahar'} value={city} onChange={setCity} options={[['', 'Barcha shaharlar'], ...USTA_CITIES.map((c) => [c, c])]} on={city !== 'Toshkent'} />
        <Pick icon={Settings2} label={spec || 'Mutaxassislik'} value={spec} onChange={setSpec} options={[['', 'Barcha mutaxassisliklar'], ...USTA_SPECS.map((s) => [s, s])]} on={!!spec} />
        <Pick icon={Wallet} label={PRICES.find(([k]) => k === price)[1]} value={price} onChange={setPrice} options={PRICES.map(([k, l]) => [k, k ? l : 'Har qanday narx'])} on={!!price} />
        <Pick icon={ArrowUpDown} label={sort === 'rec' ? 'Saralash' : SORTS.find(([k]) => k === sort)[1]} value={sort} onChange={setSort} options={SORTS} on={sort !== 'rec'} />
      </div>

      <div className="mt-3 flex flex-col gap-2.5 px-3.5">
        {list.map((m) => (
          <UstaCard
            key={m.id}
            m={m}
            onCall={() => setSheet({ call: m })}
            onOrder={() => order(m, m.services[0])}
            onWorks={(i) => setZoom({ images: m.works, index: i })}
            onOpen={() => navigate(`/ustalar/${m.id}`)}
          />
        ))}
        {!list.length && (
          <div className="rounded-2xl bg-white px-6 py-10 text-center">
            <p className="text-[14px] font-semibold text-ink">Usta topilmadi</p>
            <p className="mt-1 text-[12px] text-muted">Filtrlarni o‘zgartiring yoki so‘rov qoldiring</p>
            <button type="button" onClick={reset} className="mt-3 h-9 rounded-xl bg-sea-50 px-4 text-[12.5px] font-semibold text-sea">Filtrlarni tozalash</button>
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-[62px] z-30 bg-gradient-to-t from-[#f6f9fb] via-[#f6f9fb]/90 to-transparent px-3.5 pb-2 pt-4">
        <button type="button" onClick={() => setSheet('request')} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(90deg,#0b8a95,#14a7a0)] text-[14.5px] font-semibold text-white shadow-[0_8px_20px_rgb(11_138_149/0.35)] active:scale-[0.99]">
          <Plus className="size-5" /> Usta topish yoki so‘rov qoldirish <ArrowRight className="size-4" />
        </button>
      </div>

      {sheet?.call && <CallSheet d={sheet.call} onClose={() => setSheet(null)} onChat={() => setSheet({ chat: sheet.call })} onToast={setToast} />}
      {sheet?.chat && <ChatSheet d={sheet.chat} initial={`Assalomu alaykum, ${sheet.chat.name}! Jihozni ta’mirlash bo‘yicha savolim bor edi.`} quick={USTA_QUICK} onClose={() => setSheet(null)} onSent={() => { setSheet(null); setToast('Xabar yuborildi. Usta tez orada javob beradi') }} />}
      {sheet?.order && <OrderSheet m={sheet.order} service={sheet.service} onClose={() => setSheet(null)} onDone={(msg) => { setSheet(null); setToast(msg) }} />}
      {sheet === 'request' && <RequestSheet onClose={() => setSheet(null)} onDone={(msg) => { setSheet(null); setToast(msg) }} />}
      {zoom && <Lightbox images={zoom.images} index={zoom.index} onClose={() => setZoom(null)} />}

      <MobileToast text={toast} onClose={closeToast} bottom={136} />
      <MobileTabBar />
    </div>
  )
}

function UstaCard({ m, onCall, onOrder, onWorks, onOpen }) {
  const more = m.works.length - 3
  return (
    <article className="relative flex gap-2.5 rounded-2xl bg-white p-2.5 shadow-[0_1px_4px_rgb(11_31_58/0.06)]">
      <Link to={`/ustalar/${m.id}`} className="relative w-[104px] shrink-0 overflow-hidden rounded-xl bg-[#eef3f5]">
        <img src={m.photo} alt={m.name} loading="lazy" className="absolute inset-0 size-full object-cover" style={{ objectPosition: '30% 20%' }} />
        <StatusBadge m={m} className="absolute left-1.5 top-1.5" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex gap-1.5 pr-3.5">
          <Link to={`/ustalar/${m.id}`} className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-[14px] font-bold leading-tight text-[#0d2a4a]"><span className="truncate">{m.name}</span>{m.verified && <BadgeCheck className="size-4 shrink-0 fill-sea text-white" />}</p>
            <p className="mt-0.5 truncate text-[10.5px] text-[#5f8f93]">{m.role}</p>
            <p className="mt-1 flex items-center gap-1 whitespace-nowrap text-[11px] text-ink-2"><Star className="size-3.5 fill-star text-star" /> <b className="font-bold text-ink">{m.rating}</b> <span className="text-muted">({m.reviews} ta baho)</span></p>
            <p className="mt-1 flex items-center gap-2 whitespace-nowrap text-[10.5px] text-ink-2">
              <span className="flex items-center gap-0.5"><BriefcaseBusiness className="size-3 text-muted" /> {m.years} yil tajriba</span>
              <span className="flex min-w-0 items-center gap-0.5"><MapPin className="size-3 shrink-0 text-muted" /> <span className="truncate">{m.city}</span></span>
            </p>
          </Link>
          <div className="grid h-fit w-[62px] shrink-0 grid-cols-2 gap-1">
            {m.works.slice(0, 3).map((src, i) => (
              <button key={i} type="button" onClick={() => onWorks(i)} aria-label={`Ish ${i + 1}`} className="size-[29px] overflow-hidden rounded-md bg-page"><img src={src} alt="" loading="lazy" className="size-full object-cover" /></button>
            ))}
            <button type="button" onClick={() => onWorks(3)} aria-label="Barcha ishlar" className="grid size-[29px] place-items-center rounded-md bg-[#eef3f7] text-[11px] font-semibold text-ink-2">+{more}</button>
          </div>
        </div>
        <button type="button" onClick={onOpen} aria-label="Batafsil" className="absolute right-1.5 top-3 grid size-6 place-items-center text-muted"><ChevronRight className="size-4" /></button>
        <div className="mt-1.5 flex h-[21px] flex-wrap gap-1 overflow-hidden">
          {m.tags.map((t) => <span key={t} className="h-[21px] whitespace-nowrap rounded-md bg-[#f0f4f8] px-1.5 text-[10px] leading-[21px] text-ink-2">{t}</span>)}
        </div>
        <p className="mt-1.5 whitespace-nowrap text-[11px] text-muted">Xizmat narxi: <b className="text-[13px] font-extrabold text-[#0b8a95]">{som(m.priceFrom)} dan</b></p>
        <div className="mt-2 grid grid-cols-[1fr_1.25fr] gap-1.5">
          <button type="button" onClick={onCall} className="flex h-9 items-center justify-center gap-1 rounded-xl border border-[#0b8a95] bg-white text-[11.5px] font-semibold text-[#0b6d73]"><Phone className="size-3.5" /> Qo‘ng‘iroq</button>
          <button type="button" onClick={onOrder} className="flex h-9 items-center justify-center gap-1 rounded-xl bg-[linear-gradient(90deg,#0b8a95,#14a7a0)] text-[11.5px] font-semibold text-white"><CalendarDays className="size-3.5" /> Buyurtma berish</button>
        </div>
      </div>
    </article>
  )
}

const field = (bad) => `h-11 w-full rounded-xl border px-3 text-[14px] outline-none focus:border-sea ${bad ? 'border-sale' : 'border-line'}`
const chipCls = (on) => `flex h-9 items-center gap-1 rounded-xl border px-3 text-[12.5px] font-medium ${on ? 'border-sea bg-sea-50 text-sea' : 'border-line text-ink'}`
const phoneOk = (p) => {
  const d = p.replace(/\D/g, '')
  return d.length === 12 && d.startsWith('998')
}

export function OrderSheet({ m, service, onClose, onDone }) {
  const busy = m.status === 'busy'
  const days = Array.from({ length: 6 }, (_, i) => {
    const x = new Date()
    x.setDate(x.getDate() + i + (busy ? 1 : 0))
    return x
  })
  const [svc, setSvc] = useState(service?.id || m.services[0].id)
  const [model, setModel] = useState('')
  const [problem, setProblem] = useState('')
  const [day, setDay] = useState(0)
  const [time, setTime] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('+998 ')
  const [tried, setTried] = useState(false)
  const picked = m.services.find((s) => s.id === svc)
  const hour = new Date().getHours()
  const taken = (i, t) => (i === 0 && !busy && Number(t.slice(0, 2)) <= hour) || (i * 5 + TIMES.indexOf(t) * 3 + m.reviews) % 4 === 0
  const errs = { problem: problem.trim().length < 5, time: !time, address: address.trim().length < 3, phone: !phoneOk(phone) }
  const ok = !Object.values(errs).some(Boolean)
  const dayLabel = (x, i) => (i === 0 && !busy ? 'Bugun' : `${x.getDate()}.${String(x.getMonth() + 1).padStart(2, '0')}`)
  const submit = () => {
    setTried(true)
    if (ok) onDone(`Buyurtma yuborildi: ${dayLabel(days[day], day)}, ${time}. ${m.name} tez orada bog‘lanadi`)
  }
  return (
    <BottomSheet title="Buyurtma berish" onClose={onClose} footer={<button type="button" onClick={submit} className="h-12 flex-1 rounded-xl bg-[#0b8a95] text-[14px] font-semibold text-white">Buyurtma berish · {som(picked.price)}</button>}>
      <div className="mt-2 flex items-center gap-2.5 rounded-2xl bg-[#f2f8f8] p-2.5">
        <span className="size-11 shrink-0 overflow-hidden rounded-full"><img src={m.photo} alt="" className="size-full object-cover" style={{ objectPosition: m.face, transform: 'scale(2.4)', transformOrigin: m.face }} /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-bold text-ink">{m.name}</p>
          <p className="truncate text-[11.5px] text-muted">{m.role}</p>
        </div>
        <StatusBadge m={m} />
      </div>
      {busy && <p className="mt-2 rounded-xl bg-[#fff6e5] px-3 py-2 text-[11.5px] text-[#a86500]">Usta bugun band — eng yaqin bo‘sh kun ertaga.</p>}
      <p className="mt-3 text-[13px] font-semibold text-ink">Xizmat</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {m.services.map((s) => <button key={s.id} type="button" aria-pressed={svc === s.id} onClick={() => setSvc(s.id)} className={chipCls(svc === s.id)}>{svc === s.id && <Check className="size-3.5" />}{s.name}</button>)}
      </div>
      <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Jihoz modeli (masalan, NSK Pana-Max)" className={`mt-3 ${field(false)}`} />
      <textarea value={problem} onChange={(e) => setProblem(e.target.value)} rows={2} placeholder="Muammoni qisqacha yozing..." className={`mt-2 w-full resize-none rounded-xl border px-3 py-2.5 text-[13.5px] outline-none focus:border-sea ${tried && errs.problem ? 'border-sale' : 'border-line'}`} />
      <p className="mt-3 text-[13px] font-semibold text-ink">Qachon</p>
      <div className="mt-2 grid grid-cols-6 gap-1.5">
        {days.map((x, i) => (
          <button key={i} type="button" aria-pressed={day === i} onClick={() => { setDay(i); setTime('') }} className={`flex h-14 flex-col items-center justify-center rounded-xl border text-[11px] ${day === i ? 'border-[#0b8a95] bg-[#0b8a95] text-white' : 'border-line text-ink-2'}`}>
            {i === 0 && !busy ? 'Bugun' : DAYS[x.getDay()]}<b className="text-[15px]">{x.getDate()}</b>
          </button>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-5 gap-1.5">
        {TIMES.map((t) => {
          const off = taken(day, t)
          return <button key={t} type="button" disabled={off} aria-pressed={time === t} onClick={() => setTime(t)} className={`h-10 rounded-xl border text-[12.5px] font-semibold disabled:border-line disabled:bg-page disabled:text-muted disabled:line-through ${time === t ? 'border-[#0b8a95] bg-[#e6f4f3] text-[#0b6d73]' : 'border-line text-ink'}`}>{t}</button>
        })}
      </div>
      {tried && errs.time && <p className="mt-1 text-[11.5px] text-sale">Vaqtni tanlang</p>}
      <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Klinika manzili" className={`mt-3 ${field(tried && errs.address)}`} />
      <PhoneInput value={phone} onChange={setPhone} valueMode="e164" className={`mt-2 ${field(tried && errs.phone)}`} invalid={tried && errs.phone} placeholder="+998 90 123 45 67" />
      {tried && !ok && <p className="mt-1 text-[11.5px] text-sale">Qizil maydonlarni to‘ldiring</p>}
      <div className="h-2" />
    </BottomSheet>
  )
}

function RequestSheet({ onClose, onDone }) {
  const [kind, setKind] = useState('')
  const [problem, setProblem] = useState('')
  const [city, setCity] = useState('Toshkent')
  const [phone, setPhone] = useState('+998 ')
  const [urgent, setUrgent] = useState(false)
  const [tried, setTried] = useState(false)
  const errs = { kind: !kind, problem: problem.trim().length < 5, phone: !phoneOk(phone) }
  const ok = !Object.values(errs).some(Boolean)
  const submit = () => {
    setTried(true)
    if (!ok) return
    const n = USTALAR.filter((m) => m.city === city && m.services.some((s) => s.tag === kind)).length || USTALAR.filter((m) => m.city === city).length
    onDone(`So‘rovingiz ${n} ta ustaga yuborildi${urgent ? ' (shoshilinch)' : ''}`)
  }
  return (
    <BottomSheet title="So‘rov qoldirish" onClose={onClose} footer={<button type="button" onClick={submit} className="h-12 flex-1 rounded-xl bg-[#0b8a95] text-[14px] font-semibold text-white">So‘rov yuborish</button>}>
      <p className="mt-1 text-[12px] text-muted">Muammoni yozing — mos ustalar o‘zi siz bilan bog‘lanadi.</p>
      <p className="mt-3 text-[13px] font-semibold text-ink">Qaysi jihoz?</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {USTA_SPECS.map((s) => <button key={s} type="button" aria-pressed={kind === s} onClick={() => setKind(s)} className={chipCls(kind === s)}>{kind === s && <Check className="size-3.5" />}{s}</button>)}
      </div>
      {tried && errs.kind && <p className="mt-1 text-[11.5px] text-sale">Jihoz turini tanlang</p>}
      <textarea value={problem} onChange={(e) => setProblem(e.target.value)} rows={3} placeholder="Nima bo‘ldi? Masalan: turbina shovqin qilyapti" className={`mt-3 w-full resize-none rounded-xl border px-3 py-2.5 text-[13.5px] outline-none focus:border-sea ${tried && errs.problem ? 'border-sale' : 'border-line'}`} />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <select value={city} onChange={(e) => setCity(e.target.value)} aria-label="Shahar" className={field(false)}>{USTA_CITIES.map((c) => <option key={c}>{c}</option>)}</select>
        <PhoneInput value={phone} onChange={setPhone} valueMode="e164" className={field(tried && errs.phone)} invalid={tried && errs.phone} placeholder="+998 90 123 45 67" />
      </div>
      <button type="button" aria-pressed={urgent} onClick={() => setUrgent((v) => !v)} className="mt-2 flex h-12 w-full items-center justify-between rounded-xl border border-line px-3 text-[13px] font-medium text-ink">
        <span className="flex items-center gap-2"><Zap className="size-4 text-[#f59e0b]" /> Shoshilinch (bugun kerak)</span>
        <span className={`relative h-6 w-10 rounded-full transition ${urgent ? 'bg-sea' : 'bg-line'}`}><span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${urgent ? 'left-[18px]' : 'left-0.5'}`} /></span>
      </button>
      <div className="h-2" />
    </BottomSheet>
  )
}
