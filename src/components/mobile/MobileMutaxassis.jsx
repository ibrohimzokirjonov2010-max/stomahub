import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Heart, BadgeCheck, MapPin, GraduationCap, Building2, MessageCircle, Phone, UserRound, Image as ImageIcon, MessageSquareText,
  FileText, ChevronRight, CalendarCheck, Star, Check,
} from 'lucide-react'
import { getDoctor, sum } from '../../mutaxassislarData'
import { MobileToast } from './parts'
import MobileTabBar from './MobileTabBar'
import { BottomSheet, ToothIcon } from './MobileSeminars'
import { HubTopBar } from './MobileKategoriyalar'
import { Lightbox } from './MobileCommunity'
import { ChatSheet, CallSheet, Stars, useFav } from './MobileMutaxassislar'
import PhoneInput, { extractUzLocalDigits, isCompleteUzPhone, PHONE_INCOMPLETE_MSG, toE164 } from '../PhoneInput'

const TABS = [['info', 'Ma’lumot', UserRound], ['services', 'Xizmatlar', ToothIcon], ['works', 'Ishlar', ImageIcon], ['reviews', 'Sharhlar', MessageSquareText]]
const TIMES = ['09:00', '10:30', '12:00', '14:00', '15:30', '17:00']
const DAYS = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan']

export default function MobileMutaxassis() {
  const { id } = useParams()
  return <DoctorView key={id} id={id} />
}

function DoctorView({ id }) {
  const d = getDoctor(id)
  const navigate = useNavigate()
  const [fav, toggleFav] = useFav()
  const [tab, setTab] = useState('info')
  const [sheet, setSheet] = useState(null)
  const [zoom, setZoom] = useState(null)
  const [reviews, setReviews] = useState(() => d?.reviewsList || [])
  const [toast, setToast] = useState('')
  const closeToast = useCallback(() => setToast(''), [])
  const refs = { info: useRef(null), services: useRef(null), works: useRef(null), reviews: useRef(null) }

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  if (!d) {
    return (
      <div className="grid min-h-screen place-items-center bg-white px-6 text-center">
        <div>
          <p className="text-[15px] font-semibold text-ink">Mutaxassis topilmadi</p>
          <Link to="/mutaxassislar" className="mt-3 inline-block text-[13px] font-semibold text-sea">Mutaxassislarga qaytish</Link>
        </div>
      </div>
    )
  }

  const isFav = fav.has(d.id)
  const go = (k) => {
    setTab(k)
    refs[k].current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const back = () => (window.history.length > 1 ? navigate(-1) : navigate('/mutaxassislar'))
  const total = d.reviews + reviews.length - d.reviewsList.length

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef8f7_0%,#f6faf9_30%)] pb-[86px]">
      <div className="px-3.5 pt-3">
        <HubTopBar onBack={back} onBell={() => setToast('Yangi bildirishnomalar yo‘q')} />

        <section className="relative mt-3 h-[170px] overflow-hidden rounded-2xl bg-white shadow-[0_1px_4px_rgb(11_31_58/0.06)]">
          <img src="/images/ishlar/ish-implant.jpg" alt="" className="absolute inset-0 size-full object-cover opacity-35" />
          <span className="absolute inset-0 bg-[linear-gradient(180deg,rgb(255_255_255/0.2)_0%,rgb(255_255_255/0.75)_55%,#fff_100%)]" />
          <img src={d.photo} alt={d.name} className="absolute bottom-0 left-0 h-full w-[46%] object-cover object-top [mask-image:linear-gradient(90deg,#000_75%,transparent)]" />
          <button type="button" onClick={() => setToast(toggleFav(d.id) ? 'Sevimlilarga qo‘shildi' : 'Sevimlilardan olib tashlandi')} aria-label="Sevimlilarga" aria-pressed={isFav} className="absolute right-2.5 top-2.5 grid size-10 place-items-center rounded-full bg-white shadow-[0_1px_4px_rgb(11_31_58/0.15)]">
            <Heart className={`size-5 ${isFav ? 'fill-sale text-sale' : 'text-[#0b6d73]'}`} />
          </button>
          <div className="absolute bottom-3 left-[44%] right-3">
            <p className="flex items-center gap-1 text-[17px] font-extrabold leading-tight text-[#0d2a4a]">{d.name}<BadgeCheck className="size-[18px] shrink-0 fill-[#0b6d73] text-white" /></p>
            <p className="mt-0.5 text-[12.5px] text-[#5f8f93]">{d.role}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-muted"><MapPin className="size-3.5 text-[#0b6d73]" /> {d.city}, {d.district}</p>
            <p className="mt-1 flex items-center gap-1 text-[11.5px] text-ink-2"><Stars value={d.rating} size="size-3" /> <b className="font-semibold text-ink">{d.rating}</b> <span className="text-muted">({total})</span></p>
          </div>
        </section>

        <div className="mt-2.5 grid grid-cols-[0.8fr_1.1fr_1.1fr] divide-x divide-line/70 rounded-2xl bg-white py-2.5 shadow-[0_1px_3px_rgb(11_31_58/0.05)]">
          {[[GraduationCap, `${d.exp}+ yil`, 'Tajriba'], [ToothIcon, d.focus, 'Asosiy yo‘nalish'], [Building2, d.clinic, 'Klinika']].map(([Icon, v, l]) => (
            <div key={l} className="flex min-w-0 items-center gap-1.5 px-2">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#e6f4f3] text-[#0b6d73]"><Icon className="size-[18px]" strokeWidth={1.7} /></span>
              <span className="min-w-0">
                <b className="block text-[11px] font-semibold leading-tight text-ink">{v}</b>
                <span className="block text-[9.5px] leading-tight text-muted">{l}</span>
              </span>
            </div>
          ))}
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setSheet('chat')} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#bfe3df] bg-[#e6f4f3] text-[14px] font-semibold text-[#0b6d73]"><MessageCircle className="size-5" /> Chat</button>
          <button type="button" onClick={() => setSheet('call')} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0b6d73] text-[14px] font-semibold text-white"><Phone className="size-5" /> Qo‘ng‘iroq qilish</button>
        </div>
      </div>

      <div className="sticky top-0 z-20 mt-3 bg-[#f3f9f8]/95 px-3.5 py-1.5 backdrop-blur">
        <div className="grid grid-cols-4 rounded-xl bg-white p-1 shadow-[0_1px_3px_rgb(11_31_58/0.05)]">
          {TABS.map(([k, l, Icon]) => (
            <button key={k} type="button" aria-pressed={tab === k} onClick={() => go(k)} className={`flex h-9 items-center justify-center gap-1 rounded-lg text-[11.5px] font-medium transition ${tab === k ? 'bg-[#e6f4f3] font-semibold text-[#0b6d73]' : 'text-ink-2'}`}>
              <Icon className="size-4" strokeWidth={1.7} /> {l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 px-3.5 pt-1.5">
        <Card refEl={refs.info} icon={FileText} title="Mutaxassis haqida">
          <p className="text-[12.5px] leading-[1.55] text-ink-2">{d.about}</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {d.tags.map((t) => <span key={t} className="rounded-full bg-[#e6f4f3] px-2.5 py-1 text-[11px] text-[#0b6d73]">{t}</span>)}
          </div>
          <p className="mt-2.5 flex items-center gap-1.5 text-[11.5px] text-muted"><CalendarCheck className="size-4 text-[#0b6d73]" /> Qabul: Dush–Shan, 09:00–18:00 · {d.patients} bemor</p>
        </Card>

        <Card refEl={refs.services} icon={ToothIcon} title="Xizmatlar" action={d.services.length > 4 && <More onClick={() => setSheet('services')} />}>
          <ServiceList list={d.services.slice(0, 4)} onPick={(s) => setSheet({ book: s })} />
        </Card>

        <Card refEl={refs.works} icon={ImageIcon} title="Ishlar" action={<More onClick={() => setZoom(0)} />}>
          <div className="grid grid-cols-4 gap-1.5">
            {d.works.slice(0, 4).map((src, i) => (
              <button key={src} type="button" onClick={() => setZoom(i)} aria-label={`Ish ${i + 1}`} className="h-[74px] overflow-hidden rounded-lg"><img src={src} alt="" className="size-full object-cover" /></button>
            ))}
          </div>
        </Card>

        <Card refEl={refs.reviews} icon={MessageSquareText} title={`Sharhlar (${total})`} action={<More onClick={() => setSheet('reviews')} />}>
          <div className="flex items-center gap-3 rounded-xl bg-[#f2f8f8] p-3">
            <b className="text-[30px] font-extrabold leading-none text-[#0d2a4a]">{d.rating}</b>
            <span>
              <Stars value={d.rating} size="size-4" />
              <span className="mt-0.5 block text-[11.5px] text-muted">{total} ta sharh asosida</span>
            </span>
          </div>
          {reviews.slice(0, 2).map((r) => <Review key={r.name + r.date} r={r} />)}
        </Card>

        <button type="button" onClick={() => setSheet({ book: d.services[0] })} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0b6d73] text-[14px] font-semibold text-white shadow-[0_6px_16px_rgb(11_109_115/0.3)]">
          <CalendarCheck className="size-5" /> Qabulga yozilish
        </button>
      </div>

      {sheet === 'chat' && <ChatSheet d={d} onClose={() => setSheet(null)} onSent={() => { setSheet(null); setToast('Xabar yuborildi. Mutaxassis tez orada javob beradi') }} />}
      {sheet === 'call' && <CallSheet d={d} onClose={() => setSheet(null)} onChat={() => setSheet('chat')} onToast={setToast} />}
      {sheet === 'services' && (
        <BottomSheet title="Barcha xizmatlar" onClose={() => setSheet(null)}>
          <div className="pb-2 pt-2"><ServiceList list={d.services} onPick={(s) => setSheet({ book: s })} /></div>
        </BottomSheet>
      )}
      {sheet === 'reviews' && <ReviewsSheet reviews={reviews} onClose={() => setSheet(null)} onAdd={(r) => { setReviews((l) => [r, ...l]); setToast('Sharhingiz qo‘shildi') }} />}
      {sheet?.book && <BookSheet d={d} service={sheet.book} onClose={() => setSheet(null)} onDone={(msg) => { setSheet(null); setToast(msg) }} />}
      {zoom !== null && <Lightbox images={d.works} index={zoom} onClose={() => setZoom(null)} />}

      <MobileToast text={toast} onClose={closeToast} />
      <MobileTabBar />
    </div>
  )
}

function Card({ refEl, icon: Icon, title, action, children }) {
  return (
    <section ref={refEl} className="scroll-mt-[60px] rounded-2xl bg-white p-3.5 shadow-[0_1px_4px_rgb(11_31_58/0.05)]">
      <div className="mb-2.5 flex items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#e6f4f3] text-[#0b6d73]"><Icon className="size-[18px]" strokeWidth={1.7} /></span>
        <h2 className="flex-1 text-[15px] font-bold text-[#0d2a4a]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function More({ onClick }) {
  return <button type="button" onClick={onClick} className="flex items-center gap-0.5 text-[12px] font-semibold text-[#0b6d73]">Barchasini ko‘rish <ChevronRight className="size-4" /></button>
}

function ServiceList({ list, onPick }) {
  return (
    <div className="flex flex-col gap-1.5">
      {list.map((s) => (
        <button key={s.name} type="button" onClick={() => onPick(s)} className="flex items-center gap-2.5 rounded-xl border border-line/70 p-1.5 pr-2 text-left active:bg-[#f2f8f8]">
          <img src={s.img} alt="" className="size-[50px] shrink-0 rounded-lg object-cover" />
          <span className="min-w-0 flex-1">
            <b className="block text-[12.5px] font-semibold leading-tight text-ink">{s.name}</b>
            <span className="mt-0.5 block text-[10.5px] leading-tight text-muted">{s.note}</span>
          </span>
          <span className="shrink-0 whitespace-nowrap text-[12px] font-bold text-[#0b6d73]">{sum(s.price)}</span>
          <ChevronRight className="-ml-1 size-4 shrink-0 text-muted" />
        </button>
      ))}
    </div>
  )
}

export function Review({ r }) {
  return (
    <div className="mt-3 border-t border-line/60 pt-3">
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e6f4f3] text-[13px] font-bold text-[#0b6d73]">{r.name[0]}</span>
        <span className="min-w-0 flex-1">
          <b className="block text-[13px] text-ink">{r.name}</b>
          <span className="flex items-center gap-1.5 text-[11px] text-muted"><Stars value={r.stars} size="size-3" /> {r.date}</span>
        </span>
      </div>
      <p className="mt-1.5 text-[12.5px] leading-snug text-ink-2">{r.text}</p>
    </div>
  )
}

export function ReviewsSheet({ reviews, onClose, onAdd }) {
  const [stars, setStars] = useState(5)
  const [text, setText] = useState('')
  return (
    <BottomSheet title="Sharhlar" onClose={onClose}>
      <div className="mt-2 rounded-2xl border border-line p-3">
        <p className="text-[13px] font-semibold text-ink">Sharh qoldiring</p>
        <div className="mt-1.5 flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => <button key={i} type="button" onClick={() => setStars(i)} aria-label={`${i} yulduz`}><Star className={`size-6 ${i <= stars ? 'fill-star text-star' : 'text-line'}`} /></button>)}
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Tajribangiz haqida yozing..." className="mt-2 w-full resize-none rounded-xl border border-line px-3 py-2 text-[13px] outline-none focus:border-sea" />
        <button type="button" disabled={text.trim().length < 3} onClick={() => { onAdd({ name: 'Siz', date: 'Bugun', stars, text: text.trim() }); setText('') }} className="mt-2 h-10 w-full rounded-xl bg-sea text-[13px] font-semibold text-white disabled:opacity-40">Yuborish</button>
      </div>
      <div className="pb-2">{reviews.map((r, i) => <Review key={r.name + r.date + i} r={r} />)}</div>
    </BottomSheet>
  )
}

function BookSheet({ d, service, onClose, onDone }) {
  const days = Array.from({ length: 6 }, (_, i) => {
    const x = new Date()
    x.setDate(x.getDate() + i + 1)
    return x
  })
  const [svc, setSvc] = useState(service.name)
  const [day, setDay] = useState(0)
  const [time, setTime] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('+998 ')
  const [tried, setTried] = useState(false)
  const digits = phone.replace(/\D/g, '')
  const okPhone = digits.length === 12 && digits.startsWith('998')
  const ok = time && name.trim().length >= 2 && okPhone
  const busy = (i, t) => (i * 7 + TIMES.indexOf(t) * 3) % 5 === 0
  const submit = () => {
    setTried(true)
    if (!ok) return
    const x = days[day]
    onDone(`Qabulga yozildingiz: ${x.getDate()}.${String(x.getMonth() + 1).padStart(2, '0')}, ${time}`)
  }
  return (
    <BottomSheet title="Qabulga yozilish" onClose={onClose} footer={<button type="button" onClick={submit} className="h-12 flex-1 rounded-xl bg-[#0b6d73] text-[14px] font-semibold text-white">Tasdiqlash · {sum(d.services.find((s) => s.name === svc).price)}</button>}>
      <p className="mt-2 text-[12.5px] text-muted">{d.name} · {d.clinic}</p>
      <p className="mt-3 text-[13px] font-semibold text-ink">Xizmat</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {d.services.map((s) => <button key={s.name} type="button" aria-pressed={svc === s.name} onClick={() => setSvc(s.name)} className={`flex h-9 items-center gap-1 rounded-xl border px-3 text-[12.5px] font-medium ${svc === s.name ? 'border-sea bg-sea-50 text-sea' : 'border-line text-ink'}`}>{svc === s.name && <Check className="size-3.5" />}{s.name}</button>)}
      </div>
      <p className="mt-4 text-[13px] font-semibold text-ink">Kun</p>
      <div className="mt-2 grid grid-cols-6 gap-1.5">
        {days.map((x, i) => (
          <button key={i} type="button" aria-pressed={day === i} onClick={() => { setDay(i); setTime('') }} className={`flex h-14 flex-col items-center justify-center rounded-xl border text-[11px] ${day === i ? 'border-[#0b6d73] bg-[#0b6d73] text-white' : 'border-line text-ink-2'}`}>
            {DAYS[x.getDay()]}<b className="text-[15px]">{x.getDate()}</b>
          </button>
        ))}
      </div>
      <p className="mt-4 text-[13px] font-semibold text-ink">Vaqt</p>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {TIMES.map((t) => {
          const off = busy(day, t)
          return <button key={t} type="button" disabled={off} aria-pressed={time === t} onClick={() => setTime(t)} className={`h-10 rounded-xl border text-[13px] font-semibold disabled:border-line disabled:bg-page disabled:text-muted disabled:line-through ${time === t ? 'border-[#0b6d73] bg-[#e6f4f3] text-[#0b6d73]' : 'border-line text-ink'}`}>{t}</button>
        })}
      </div>
      {tried && !time && <p className="mt-1 text-[11.5px] text-sale">Vaqtni tanlang</p>}
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ismingiz" className={`mt-4 h-11 w-full rounded-xl border px-3 text-[14px] outline-none focus:border-sea ${tried && name.trim().length < 2 ? 'border-sale' : 'border-line'}`} />
      <PhoneInput value={phone} onChange={setPhone} valueMode="e164" className={`mt-2 h-11 w-full ${tried && !okPhone ? 'border-sale' : 'border-line'}`} invalid={tried && !okPhone} placeholder="+998 90 123 45 67" />
      {tried && !okPhone && <p className="mt-1 text-[11.5px] text-sale">Telefon raqam to‘liq emas</p>}
      <div className="h-2" />
    </BottomSheet>
  )
}
