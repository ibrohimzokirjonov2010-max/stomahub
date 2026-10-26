import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft, Heart, Share2, BadgeCheck, Star, BriefcaseBusiness, MapPin, CheckCircle2, Wrench, UsersRound, ShieldCheck, Clock,
  ChevronRight, ArrowRight, Phone, CalendarDays, MessageCircle, Truck,
} from 'lucide-react'
import { getUstaM, som } from '../../ustalarMobileData'
import { MobileToast } from './parts'
import MobileTabBar from './MobileTabBar'
import { Lightbox } from './MobileCommunity'
import { ChatSheet, CallSheet, useFav } from './MobileMutaxassislar'
import { ReviewsSheet, Review } from './MobileMutaxassis'
import { OrderSheet, USTA_QUICK } from './MobileUstalar'

const TABS = [['services', 'Xizmatlar'], ['works', 'Ishlar'], ['reviews', 'Sharhlar'], ['info', 'Ma’lumot']]

export default function MobileUsta() {
  const { id } = useParams()
  return <UstaView key={id} id={id} />
}

function UstaView({ id }) {
  const m = getUstaM(id)
  const navigate = useNavigate()
  const [fav, toggleFav] = useFav()
  const [tab, setTab] = useState('services')
  const [sheet, setSheet] = useState(null)
  const [zoom, setZoom] = useState(null)
  const [reviews, setReviews] = useState(() => m?.reviewsList || [])
  const [toast, setToast] = useState('')
  const closeToast = useCallback(() => setToast(''), [])
  const refs = { services: useRef(null), works: useRef(null), reviews: useRef(null), info: useRef(null) }

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  if (!m) {
    return (
      <div className="grid min-h-screen place-items-center bg-white px-6 text-center">
        <div>
          <p className="text-[15px] font-semibold text-ink">Usta topilmadi</p>
          <Link to="/ustalar" className="mt-3 inline-block text-[13px] font-semibold text-sea">Ustalarga qaytish</Link>
        </div>
      </div>
    )
  }

  const isFav = fav.has(m.id)
  const total = m.reviews + reviews.length - m.reviewsList.length
  const go = (k) => {
    setTab(k)
    refs[k].current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const back = () => (window.history.length > 1 ? navigate(-1) : navigate('/ustalar'))
  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: m.name, text: m.role, url })
      else {
        await navigator.clipboard.writeText(url)
        setToast('Havola nusxalandi')
      }
    } catch {
      /* foydalanuvchi bekor qildi */
    }
  }
  const stats = [[Wrench, `${m.jobs}+`, 'Bajarilgan ishlar'], [UsersRound, `${total} ta`, 'Baho va sharh'], [ShieldCheck, m.warranty, 'Kafolat'], [Clock, m.speed, 'Xizmat ko‘rsatish']]

  return (
    <div className="min-h-screen bg-[#f4f8fa] pb-[150px]">
      <div className="relative h-[250px] overflow-hidden bg-[#dfe9ee]">
        <img src={m.photo} alt={m.name} className="absolute inset-0 size-full object-cover" style={{ objectPosition: '50% 25%' }} />
        <span className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#f4f8fa] to-transparent" />
        <button type="button" onClick={back} aria-label="Orqaga" className="absolute left-3.5 top-3 grid size-10 place-items-center rounded-xl bg-white/95 text-ink shadow-[0_2px_6px_rgb(11_31_58/0.15)]"><ChevronLeft className="size-5" /></button>
        <div className="absolute right-3.5 top-3 flex gap-2">
          <button type="button" onClick={() => setToast(toggleFav(m.id) ? 'Sevimlilarga qo‘shildi' : 'Sevimlilardan olib tashlandi')} aria-label="Sevimlilarga" aria-pressed={isFav} className="grid size-10 place-items-center rounded-xl bg-white/95 shadow-[0_2px_6px_rgb(11_31_58/0.15)]">
            <Heart className={`size-5 ${isFav ? 'fill-sale text-sale' : 'text-ink'}`} />
          </button>
          <button type="button" onClick={share} aria-label="Ulashish" className="grid size-10 place-items-center rounded-xl bg-white/95 text-ink shadow-[0_2px_6px_rgb(11_31_58/0.15)]"><Share2 className="size-[18px]" /></button>
        </div>
      </div>

      <div className="relative z-10 -mt-16 px-3.5">
        <section className="rounded-2xl bg-white p-3 shadow-[0_2px_10px_rgb(11_31_58/0.08)]">
          <div className="flex gap-3">
            <div className="relative size-[84px] shrink-0">
              <span className="block size-full overflow-hidden rounded-full ring-[3px] ring-white">
                <img src={m.photo} alt="" className="size-full object-cover" style={{ objectPosition: m.face, transform: 'scale(2.4)', transformOrigin: m.face }} />
              </span>
              <span className={`absolute bottom-1 right-1 size-4 rounded-full ring-[3px] ring-white ${m.online ? 'bg-[#22c55e]' : 'bg-[#9aa7b4]'}`} />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h1 className="flex items-center gap-1 text-[19px] font-extrabold leading-tight text-[#0d2a4a]"><span className="truncate">{m.name}</span>{m.verified && <BadgeCheck className="size-5 shrink-0 fill-sea text-white" />}</h1>
              <p className="mt-0.5 truncate text-[12px] text-[#7d8fa9]">{m.role}</p>
              <p className="mt-1 flex items-center gap-1 text-[12px] text-ink-2"><Star className="size-4 fill-star text-star" /> <b className="font-bold text-ink">{m.rating}</b> <span className="text-muted">({total} ta baho)</span></p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-ink-2">
                <span className="flex items-center gap-1"><BriefcaseBusiness className="size-3.5 text-muted" /> {m.years} yil tajriba</span>
                <span className="flex items-center gap-1"><MapPin className="size-3.5 text-muted" /> {m.city}</span>
                {m.online
                  ? <span className="flex items-center gap-1 rounded-full bg-[#e3f8ec] px-2 py-0.5 text-[10.5px] font-semibold text-[#16a05a]"><CheckCircle2 className="size-3.5" /> Onlayn</span>
                  : <span className="flex items-center gap-1 rounded-full bg-[#eef1f5] px-2 py-0.5 text-[10.5px] font-semibold text-ink-2"><Clock className="size-3.5" /> Band</span>}
              </div>
            </div>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {m.tags.map((t) => <span key={t} className="rounded-lg bg-[#f0f4f8] px-2 py-1 text-[11px] text-ink-2">{t}</span>)}
          </div>
        </section>

        <div className="mt-2.5 grid grid-cols-4 divide-x divide-line/70 rounded-2xl bg-white py-2.5 shadow-[0_1px_4px_rgb(11_31_58/0.05)]">
          {stats.map(([Icon, v, l]) => (
            <div key={l} className="flex min-w-0 flex-col items-center gap-0.5 px-1 text-center">
              <Icon className="size-5 text-[#0b8a95]" strokeWidth={1.7} />
              <b className="text-[13px] font-extrabold leading-tight text-[#0d2a4a]">{v}</b>
              <span className="text-[9.5px] leading-tight text-muted">{l}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="sticky top-0 z-20 mt-2 bg-[#f4f8fa]/95 px-3.5 py-1.5 backdrop-blur">
        <div className="grid grid-cols-4 gap-1 rounded-xl bg-white p-1 shadow-[0_1px_3px_rgb(11_31_58/0.05)]">
          {TABS.map(([k, l]) => (
            <button key={k} type="button" aria-pressed={tab === k} onClick={() => go(k)} className={`h-9 rounded-lg text-[12.5px] font-medium transition ${tab === k ? 'bg-[linear-gradient(90deg,#0b8a95,#14a7a0)] font-semibold text-white' : 'text-ink-2'}`}>{l}</button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2.5 px-3.5 pt-1">
        <Card refEl={refs.services} title="Xizmatlar va narxlar">
          <div className="flex flex-col gap-1.5">
            {m.services.map((s) => (
              <button key={s.id} type="button" onClick={() => setSheet({ order: s })} className="flex items-center gap-2.5 rounded-xl border border-line/70 p-1.5 pr-1 text-left active:bg-[#f2f8f8]">
                <img src={s.image} alt="" className="size-[46px] shrink-0 rounded-lg object-cover" />
                <span className="min-w-0 flex-1">
                  <b className="block text-[13px] font-semibold leading-tight text-ink">{s.name}</b>
                  <span className="mt-0.5 block text-[10.5px] leading-tight text-muted">{s.note}</span>
                </span>
                <span className="shrink-0 whitespace-nowrap text-[13px] font-bold text-[#0b8a95]">{som(s.price)}</span>
                <ChevronRight className="size-4 shrink-0 text-muted" />
              </button>
            ))}
          </div>
        </Card>

        <Card refEl={refs.works} title="Bajarilgan ishlar" action={<More onClick={() => setZoom(0)} />}>
          <div className="grid grid-cols-4 gap-1.5">
            {m.works.map((src, i) => (
              <button key={i} type="button" onClick={() => setZoom(i)} aria-label={`Ish ${i + 1}`} className="h-[72px] overflow-hidden rounded-lg bg-page"><img src={src} alt="" loading="lazy" className="size-full object-cover" /></button>
            ))}
          </div>
        </Card>

        <Card refEl={refs.reviews} title="Mijozlar sharhlari" action={<More onClick={() => setSheet('reviews')} />}>
          <div className="flex items-center gap-3 rounded-xl bg-[#f2f8f8] p-3">
            <b className="text-[28px] font-extrabold leading-none text-[#0d2a4a]">{m.rating}</b>
            <span>
              <span className="flex">{[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`size-4 ${i <= Math.round(m.rating) ? 'fill-star text-star' : 'fill-line text-line'}`} />)}</span>
              <span className="mt-0.5 block text-[11.5px] text-muted">{total} ta baho asosida</span>
            </span>
          </div>
          {reviews.slice(0, 2).map((r, i) => <Review key={r.name + r.date + i} r={r} />)}
        </Card>

        <Card refEl={refs.info} title="Ma’lumot">
          <p className="text-[12.5px] leading-[1.55] text-ink-2">{m.about}</p>
          <div className="mt-3 flex flex-col divide-y divide-line/60 rounded-xl border border-line/70">
            <Row icon={Clock} label="Ish vaqti" value={m.hours} />
            <Row icon={MapPin} label="Manzil" value={`${m.city}, ${m.district}`} />
            <Row icon={ShieldCheck} label="Kafolat" value={`${m.warranty}, yozma`} />
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-[12.5px] font-semibold text-ink"><Truck className="size-4 text-[#0b8a95]" /> Chiqib kelish muddati</p>
          <div className="mt-1.5 flex flex-col gap-1">
            {m.area.map(([place, time]) => (
              <p key={place} className="flex items-center justify-between text-[12px] text-ink-2">{place}<span className="rounded-md bg-[#e3f8ec] px-1.5 py-0.5 text-[10.5px] font-semibold text-[#16a05a]">{time}</span></p>
            ))}
          </div>
          <p className="mt-3 text-[12.5px] font-semibold text-ink">Brendlar bo‘yicha tajriba</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {m.brands.map((b) => <span key={b} className="rounded-lg border border-line px-2 py-1 text-[11px] font-bold text-[#0d2a4a]">{b}</span>)}
          </div>
          <button type="button" onClick={() => setSheet('chat')} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#e6f4f3] text-[13px] font-semibold text-[#0b6d73]"><MessageCircle className="size-4" /> Ustaga xabar yozish</button>
        </Card>
      </div>

      <div className="fixed inset-x-0 bottom-[62px] z-30 grid grid-cols-2 gap-2 border-t border-line/60 bg-white/95 px-3.5 py-2 backdrop-blur">
        <button type="button" onClick={() => setSheet('call')} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#0b8a95] bg-white text-[14px] font-semibold text-[#0b6d73]"><Phone className="size-5" /> Qo‘ng‘iroq</button>
        <button type="button" onClick={() => setSheet({ order: m.services[0] })} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(90deg,#0b8a95,#14a7a0)] text-[14px] font-semibold text-white shadow-[0_6px_14px_rgb(11_138_149/0.3)]"><CalendarDays className="size-5" /> Buyurtma berish</button>
      </div>

      {sheet === 'call' && <CallSheet d={m} onClose={() => setSheet(null)} onChat={() => setSheet('chat')} onToast={setToast} />}
      {sheet === 'chat' && <ChatSheet d={m} initial={`Assalomu alaykum, ${m.name}! Jihozni ta’mirlash bo‘yicha savolim bor edi.`} quick={USTA_QUICK} onClose={() => setSheet(null)} onSent={() => { setSheet(null); setToast('Xabar yuborildi. Usta tez orada javob beradi') }} />}
      {sheet === 'reviews' && <ReviewsSheet reviews={reviews} onClose={() => setSheet(null)} onAdd={(r) => { setReviews((l) => [r, ...l]); setToast('Sharhingiz qo‘shildi') }} />}
      {sheet?.order && <OrderSheet m={m} service={sheet.order} onClose={() => setSheet(null)} onDone={(msg) => { setSheet(null); setToast(msg) }} />}
      {zoom !== null && <Lightbox images={m.works} index={zoom} onClose={() => setZoom(null)} />}

      <MobileToast text={toast} onClose={closeToast} bottom={140} />
      <MobileTabBar />
    </div>
  )
}

function Card({ refEl, title, action, children }) {
  return (
    <section ref={refEl} className="scroll-mt-[60px] rounded-2xl bg-white p-3 shadow-[0_1px_4px_rgb(11_31_58/0.05)]">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h2 className="text-[16px] font-bold text-[#0d2a4a]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function More({ onClick }) {
  return <button type="button" onClick={onClick} className="flex items-center gap-1 text-[12px] font-semibold text-[#0b8a95]">Barchasini ko‘rish <ArrowRight className="size-3.5" /></button>
}

function Row({ icon: Icon, label, value }) {
  return (
    <p className="flex items-center gap-2 px-3 py-2.5 text-[12px]">
      <Icon className="size-4 shrink-0 text-[#0b8a95]" />
      <span className="text-muted">{label}</span>
      <span className="ml-auto text-right font-semibold text-ink">{value}</span>
    </p>
  )
}
