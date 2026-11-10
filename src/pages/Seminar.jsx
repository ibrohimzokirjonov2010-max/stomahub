import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CONTACT_PHONE, CONTACT_PHONE_TEL } from '../config/contact'
import {
  ChevronRight, ChevronDown, CalendarDays, MapPin, Users, Award, Hand, Video, MessagesSquare, BookOpen, UsersRound,
  Play, Check, ArrowRight, CalendarPlus, Phone, Send, ShieldCheck, RotateCcw, FileText, Building2, Star,
  BadgeCheck, Syringe, Clock, HelpCircle, Car, X, Image as ImageIcon, Target, Box, Package, Settings2, UserRound, Layers, CreditCard, GraduationCap, Info,
} from 'lucide-react'
import { ToothIcon } from '../components/icons'
import { buildSeminarPage } from '../seminarsData'
import { publicRecord, publicRecords, useHub } from '../hubStore'
import { som } from '../marketData'
import { seminarPrice } from '../seminarsData'
import { formatPhone, telegramHandle } from '../seminarAddress'
import { dateRangeLabel } from '../programDays'
import { IMG } from '../organizer/data'
import { useSession } from '../sessionStore'
import PhotoLightbox from '../components/Lightbox'
import SpeakerProfileSheet from '../components/SpeakerProfileSheet'
import { findSpeakerDoctorHref, seminarsBySpeaker } from '../seminarSpeaker'
import { DOCTORS } from '../mutaxassislarData'

const PLACEHOLDERS = new Set(Object.values(IMG))

const MONTHS = { YAN: 'Yanvar', FEV: 'Fevral', MAR: 'Mart', APR: 'Aprel', MAY: 'May', IYN: 'Iyun', IYL: 'Iyul', AVG: 'Avgust', SEN: 'Sentabr', OKT: 'Oktabr', NOY: 'Noyabr', DEK: 'Dekabr' }

const yang = (n) => `/images/yangiliklar/${n}.jpg`
const pic = (n) => `/images/seminars/${n}.jpg`
const face = (n) => `/images/bemorlar/${n}.jpg`

const FEATS = [
  [Video, 'Jonli jarrohlik', '(Live-surgery)'],
  [MessagesSquare, 'Klinik case', 'muhokama'],
  [BookOpen, 'Nazariya va', 'protokollar'],
  [UsersRound, 'Kichik guruhda', 'amaliyot'],
  [Award, 'Sertifikat', '+ CME ballari'],
]

const ABOUT_CARDS = [
  [FileText, 'Klinik protokollar', 'Zamonaviy va isbotlangan yondashuvlar'],
  [Video, 'Jonli jarrohlik', 'Real klinik holat asosida'],
  [Hand, 'Amaliy mashg‘ulotlar', 'Model va simulyatorlarda'],
  [MessagesSquare, 'Case muhokamalari', 'Klinik holatlar tahlili'],
  [HelpCircle, 'Q&A sessiya', 'Savol-javob va ekspert tavsiyalari'],
  [Award, 'Sertifikat + CME', 'Rasmiy sertifikat va ballar'],
]

const FAQ = [
  ['Sertifikat beriladimi?', 'Ha. Seminar yakunida StomaHub rasmiy sertifikati va CME ballari beriladi. Elektron nusxasi “Sertifikatlar” bo‘limida paydo bo‘ladi.'],
  ['To‘lovni qanday amalga oshirish mumkin?', 'To‘lov ro‘yxatdan o‘tish sahifasida amalga oshiriladi.'],
  ['Qaytarish shartlari qanday?', 'Seminar boshlanishidan 72 soat oldin bekor qilinsa, to‘lov to‘liq qaytariladi. Undan keyin joyni hamkasbingizga o‘tkazish mumkin.'],
  ['Seminar kimlar uchun mos?', 'Implantologiyani boshlayotgan va tajribasini mustahkamlamoqchi bo‘lgan stomatolog-jarrohlar, ortopedlar va rezidentlar uchun.'],
  ['Joylar soni cheklanganmi?', 'Ha, amaliy qism sifatli bo‘lishi uchun guruh 30 kishidan oshmaydi.'],
]

const NOTES = {
  pay: ['To‘lov xavfsiz', 'To‘lovlar himoyalangan kanalda amalga oshiriladi. Karta ma’lumotlari StomaHub’da saqlanmaydi.'],
  refund: ['Qaytarish shartlari', 'Seminardan 72 soat oldin bekor qilinsa, to‘lov to‘liq qaytariladi. Keyinroq bekor qilinsa, joyingizni hamkasbingizga o‘tkazishingiz mumkin.'],
  invite: ['Rasmiy taklifnoma', 'Ro‘yxatdan o‘tgandan so‘ng ish joyingiz uchun rasmiy taklifnoma PDF ko‘rinishida elektron pochtangizga yuboriladi.'],
}

export function detail(d) {
  // Avval bu yerda Hyatt Regency joyi qattiq yozilgan edi — endi faqat haqiqiy seminar ma’lumoti ishlatiladi.
  const plan = d.plans[0]
  const year = String(d.monthKey || '2026-11').slice(0, 4)
  const mm = String(d.monthKey || '2026-11').slice(5, 7)
  const month = MONTHS[d.mon] || 'Noyabr'
  const [from, to] = String(d.time || '10:00 – 18:00').split(' – ').map((t) => t.replace(':', ''))
  return {
    kicker: d.catName,
    title: d.title,
    lead: d.lead,
    dayTitle: `${Number(d.day)} ${month} ${year}`,
    dayText: `${d.weekday}, ${d.time}`,
    dayShort: `${Number(d.day)} ${month} ${year}`,
    city: d.city,
    venueShort: d.place,
    price: plan.price,
    oldPrice: plan.oldPrice,
    off: plan.discount,
    seats: d.seats,
    taken: d.seats - d.left,
    hero: d.image,
    // Tashkilotchi seminarida faqat yuklangan rasmlar (poster + galereya)
    gallery: d.organizer ? [d.image, ...(d.galleryList || [])].filter(Boolean).filter((x, i, a) => a.indexOf(x) === i) : [d.image, yang('yang-seminar'), yang('yang-training'), pic('hotel'), pic('micro')],
    more: 0,
    speaker: {
      name: d.speaker.name,
      role: d.speaker.role,
      avatar: d.organizer ? (d.speakersAll?.[0]?.avatar || '') : d.speaker.avatar,
      lines: d.speaker.lines,
      bio: d.organizer ? (d.speakersAll?.[0]?.bio || '') : `${d.speaker.name} – ${d.speaker.role.toLowerCase()}. Klinik amaliyot va o‘qitish tajribasiga ega, ${d.cme} ballik dastur muallifi.`,
    },
    speakers: d.organizer ? (d.speakersAll || []).slice(1) : [],
    faq: d.organizer ? (d.faqList || []).map((r) => [r.q, r.a]) : FAQ,
    contact: d.organizer ? d.contact : null,
    orgName: d.organizer ? (d.orgName || '') : '',
    handsOn: d.organizer ? !!(d.practice) : true,
    about: d.about,
    learn: d.learn,
    // Narxga kiradiganlar — faqat tashkilotchi chiptalarga yozgan bandlar
    includes: d.includesList?.length ? d.includesList : [...new Set(d.plans.flatMap((p) => p.perks || []))],
    audience: d.audience || [],
    practice: d.practice || '',
    refundPolicy: d.refundPolicy || '',
    liveSurgery: d.liveSurgery || '',
    cmeLine: d.cmeLine || '',
    regClosed: !!d.regClosed,
    earlyUntil: plan.earlyUntil || '',
    schedule: d.schedule.map(([time, text]) => [time, text, '']),
    programDays: d.programDays?.length ? d.programDays : [{ label: '', title: '', date: '', items: d.schedule.map(([time, text]) => [time, text, '']) }],
    organizer: !!d.organizer,
    venue: { ...d.venue, lines: d.organizer ? (d.venue.notes || []).map((t) => [Check, t]) : [[Building2, 'Konferens-zal'], [Car, 'Avtoturargoh mavjud']] },
    similar: d.similar.map((s) => ({ to: `/seminarlar/${s.id}`, title: s.title, date: `${s.date}, ${s.city}`, price: s.price, image: s.image })),
    ics: { start: `${year}${mm}${String(d.day).padStart(2, '0')}T${from}00`, end: `${year}${mm}${String(d.day).padStart(2, '0')}T${to}00` },
  }
}

export default function Seminar() {
  const { id } = useParams()
  const hub = useHub()
  const rec = publicRecord(id, hub)
  const d = rec ? buildSeminarPage(rec) : null
  // Tashkilotchi seminarlari uchun o‘xshashlar — haqiqiy katalogdan (namuna ma’lumot emas)
  const realSimilar = rec?.organizer
    ? publicRecords(hub).filter((x) => x.id !== rec.id && !x.cancelled).sort((a, b) => (b.cat === rec.cat) - (a.cat === rec.cat)).slice(0, 3)
      .map((x) => ({ to: `/seminarlar/${x.id}`, title: x.title, date: `${Number(x.day)} ${MONTHS[x.mon] || ''} ${String(x.monthKey || '').slice(0, 4)}, ${x.city || ''}`, price: x.price, image: x.image }))
    : null
  if (!d) {
    return (
      <div className="py-16 text-center">
        <p className="text-[18px] font-bold text-ink">Seminar topilmadi</p>
        <Link to="/seminarlar" className="mt-3 inline-block text-[13px] font-semibold text-sea">Seminarlarga qaytish</Link>
      </div>
    )
  }
  return <SeminarView d={d} similar={realSimilar} />
}

const BREAK_RE = /tushlik|breyk|break|qahva|kofe|coffee/i
const KIND_TILE = { model: ['Modelda amaliyot', 'Klinik sharoitga yaqin maxsus modellarda'], fantom: ['Fantomda amaliyot', 'Fantom modellarda mashq'], bemor: ['Jonli bemorda amaliyot', 'Nazorat ostida bemorda ishlash'] }
const MATERIAL_TILE = { tashkilotchi: 'Materiallarni tashkilotchi beradi', ishtirokchi: 'Materiallarni ishtirokchi olib keladi', aralash: 'Materiallar qisman tashkilotchidan' }
const splitList = (x) => (Array.isArray(x) ? x : String(x || '').split(/[\n;,]+/)).map((t) => String(t).trim()).filter(Boolean)

function Card({ id, icon: Icon, title, children, className = '' }) {
  return (
    <section id={id ? `sem-${id}` : undefined} className={`scroll-mt-28 rounded-2xl border border-[#e3efed] bg-white p-4 shadow-card ${className}`}>
      <h2 className="flex items-center gap-2 text-[15.5px] font-bold text-ink">{Icon && <Icon className="size-5 shrink-0 text-sea" />}{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}
function Checks({ items }) {
  return <ul className="space-y-1.5">{items.map((t, i) => <li key={`${i}-${t}`} className="flex items-start gap-2 text-[12.5px] leading-snug text-ink"><Check className="mt-0.5 size-4 shrink-0 text-sea" /> <span className="min-w-0">{t}</span></li>)}</ul>
}

/** Seminar sahifasi ko‘rinishi. `preview` — tashkilotchi ko‘rib chiqishi: harakat tugmalari o‘chirilgan. */
export function SeminarView({ d, similar = null, preview = false }) {
  const [faq, setFaq] = useState(0)
  const [shot, setShot] = useState(null)
  const [note, setNote] = useState(null)
  const [corp, setCorp] = useState(false)
  const [speakerOpen, setSpeakerOpen] = useState(false)
  const navigate = useNavigate()
  const hub = useHub()
  const v = detail(d)
  if (similar) v.similar = similar
  if (preview) v.similar = []
  const cancelled = !!d.cancelled || !!v.regClosed
  const left = v.seats - v.taken
  const session = useSession()
  const uid = session.user?.id || session.profile?.id || ''
  const isOwner = !!(uid && d.organizerId && uid === d.organizerId)
  const participantsTo = `/tashkilotchi/ishtirokchilar?seminar=${encodeURIComponent(d.id)}`
  const editTo = `/tashkilotchi/seminarlar/yangi?tahrir=${encodeURIComponent(d.id)}`
  const regTo = `/seminarlar/${d.id}/royxat`
  const dateLabel = (d.startIso && dateRangeLabel(d.startIso, d.endIso)) || v.dayShort
  const sp = d.organizer ? (d.speakersAll || [])[0] : null
  const spCerts = splitList(sp?.certs)
  const others = v.speakers
  const speakerPerson = { ...(d.speakersAll?.[0] || {}), ...(v.speaker || {}), ...(sp || {}) }
  const speakerHref = findSpeakerDoctorHref(speakerPerson, DOCTORS)
  const speakerOthers = seminarsBySpeaker(publicRecords(hub), speakerPerson.name, d.id)
  const openSpeaker = () => {
    if (speakerHref) navigate(speakerHref)
    else setSpeakerOpen(true)
  }
  const pr = d.practiceRaw
  const tiles = [
    pr && KIND_TILE[pr.kind] && [Box, ...KIND_TILE[pr.kind]],
    pr && Number(pr.perPerson) > 0 && [Syringe, `Har bir ishtirokchiga ${Number(pr.perPerson)} ta ${pr.unit === 'tish' ? 'tish' : 'implant'}`, 'Amaliyot davomida shaxsan'],
    pr && MATERIAL_TILE[pr.materials] && [Package, MATERIAL_TILE[pr.materials], ''],
    v.liveSurgery && [Video, 'Jonli jarrohlik', v.liveSurgery],
    v.cmeLine && [Award, 'Sertifikat', v.cmeLine],
  ].filter(Boolean)
  const practiceTiles = tiles.length ? tiles : (v.practice ? [[Hand, 'Amaliy qism', v.practice]] : [])
  const days = (v.programDays || []).filter((day) => day.items?.length)
  const gallery = v.gallery.slice(1)
  const faqs = v.faq
  const hasPoster = !!v.hero && !PLACEHOLDERS.has(v.hero)
  const tabs = [
    ['about', 'Seminar haqida', !!v.about || (hasPoster && (v.audience.length > 0 || v.learn.length > 0))],
    ['program', 'Dastur', days.length > 0],
    ['learn', 'Natijalar', v.learn.length > 0],
    ['practice', 'Amaliyot formati', practiceTiles.length > 0],
    ['speaker', 'Spiker', !d.noSpeaker],
    ['price', 'Narxga nimalar kiradi?', v.includes.length > 0],
    ['pay', 'To‘lov va qaytarish', true],
    ['gallery', 'Galereya', gallery.length > 0],
    ['place', 'Manzil', !!(v.venue.name || v.venue.address)],
    ['faq', 'Savol-javob', faqs.length > 0],
  ].filter((t) => t[2])
  const go = (e, key) => {
    e.preventDefault()
    document.getElementById(`sem-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const RegButton = ({ className = '' }) => (preview
    ? <button type="button" disabled title="Ko‘rib chiqish rejimi" className={`flex cursor-not-allowed items-center justify-center gap-1.5 rounded-xl bg-sea font-semibold text-white opacity-60 ${className}`}>Ro‘yxatdan o‘tish <ArrowRight className="size-4" /></button>
    : isOwner
      ? <div className={`flex flex-col gap-2 ${className.includes('w-full') || className.includes('flex-1') ? 'w-full' : ''}`}>
          <Link to={participantsTo} className={`flex items-center justify-center gap-1.5 rounded-xl bg-sea font-semibold text-white ${className}`}>Ishtirokchilarni ko‘rish <Users className="size-4" /></Link>
          <Link to={editTo} className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-sea-50 text-[13px] font-semibold text-sea">Tahrirlash</Link>
        </div>
    : cancelled
      ? <span className={`flex items-center justify-center rounded-xl bg-[#fde8e8] font-semibold text-[#dc2626] ${className}`}>Ro‘yxat yopiq</span>
      : <Link to={regTo} className={`flex items-center justify-center gap-1.5 rounded-xl bg-sea font-semibold text-white ${className}`}>Ro‘yxatdan o‘tish <ArrowRight className="size-4" /></Link>)

  return (
    <div className="sem-v2 @container pb-24 pt-3 @[900px]:pb-8" onClickCapture={preview ? (e) => { const a = e.target.closest('a'); if (a && !a.getAttribute('href')?.startsWith('#')) e.preventDefault() } : undefined}>
      <nav className="mb-3 flex flex-wrap items-center gap-1.5 text-[11.5px] text-muted">
        <Link to="/seminarlar" className="hover:text-sea">Seminarlar</Link>
        <ChevronRight className="size-3" />
        <Link to="/seminarlar" className="hover:text-sea">{v.kicker}</Link>
        <ChevronRight className="size-3" />
        <span className="min-w-0 truncate font-medium text-ink">{v.title}</span>
      </nav>

      <div className="grid gap-3 @[900px]:grid-cols-[minmax(0,1fr)_260px]">
        {/* Hero: yuklangan poster bo‘lsa — poster, aks holda matnli blok */}
        {hasPoster ? (
          <section className="min-w-0 overflow-hidden rounded-2xl bg-white p-2 shadow-card">
            <h1 className="sr-only">{v.title}</h1>
            <img src={v.hero} alt={v.title} className="block max-h-[78vh] w-full rounded-xl bg-white object-contain" />
            {!preview && <div className="px-1.5 pb-1 pt-2 @[900px]:hidden"><div className="min-w-0">
                {v.kicker && <span className="inline-block max-w-full truncate rounded-md bg-sea-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-sea">{v.kicker}</span>}
                <p title={v.title} className="mt-1 line-clamp-2 text-[15px] font-bold leading-snug text-ink">{v.title}</p>
              </div></div>}
          </section>
        ) : (
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#e6f6f5] via-[#eef8f8] to-[#d9efee] p-4 shadow-card @[640px]:p-5">
          <div className="relative grid gap-4">
            <div className="min-w-0">
              <span className="inline-block rounded-md bg-sea px-2 py-0.5 text-[11px] font-semibold text-white">{v.kicker}</span>
              <h1 className="mt-2 text-[24px] font-extrabold leading-[1.12] tracking-tight text-ink @[640px]:text-[28px]">{v.title}</h1>
              {v.lead && <p className="mt-2 text-[13px] leading-snug text-ink-2">{v.lead}</p>}
              {(v.audience.length > 0 || v.learn.length > 0) && (
                <div className="mt-3 grid gap-2 @[480px]:grid-cols-2">
                  {v.audience.length > 0 && <div className="flex items-start gap-2 rounded-xl bg-white/85 p-2.5 backdrop-blur"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sea-50 text-sea"><Users className="size-4" /></span><span className="min-w-0"><b className="block text-[12px]">Kim uchun?</b><span className="block text-[11.5px] leading-snug text-ink-2">{v.audience.join(', ')}</span></span></div>}
                  {v.learn.length > 0 && <div className="flex items-start gap-2 rounded-xl bg-white/85 p-2.5 backdrop-blur"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sea-50 text-sea"><Target className="size-4" /></span><span className="min-w-0"><b className="block text-[12px]">Natija</b><span className="line-clamp-3 block text-[11.5px] leading-snug text-ink-2">{v.learn.slice(0, 2).join('; ')}</span></span></div>}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/90 px-3 py-2 text-[12.5px] font-semibold text-ink"><CalendarDays className="size-4 text-sea" /> {dateLabel}</span>
                {d.organizer && d.time && <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/90 px-3 py-2 text-[12.5px] font-semibold text-ink"><Clock className="size-4 text-sea" /> {d.time}{d.hours ? ` · ${d.hours}` : ''}</span>}
                {v.cmeLine && <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/90 px-3 py-2 text-[12.5px] font-semibold text-ink"><Award className="size-4 text-sea" /> {v.cmeLine}</span>}
                {(v.venueShort || v.city) && <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/90 px-3 py-2 text-[12.5px] font-semibold text-ink"><MapPin className="size-4 shrink-0 text-sea" /> <span className="min-w-0"><span className="block leading-tight">{v.venueShort || v.city}</span>{v.venueShort && v.city && v.city !== v.venueShort && <span className="block text-[11px] font-medium text-muted">{v.city}</span>}</span></span>}
                {v.handsOn && <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/90 px-3 py-2 text-[12.5px] font-semibold text-sea"><Hand className="size-4" /> Amaliy mashg‘ulot</span>}
              </div>
            </div>
          </div>
        </section>
        )}

        {/* Narx kartasi (desktop) */}
        <aside id="sem-buy" className={`${preview ? '' : 'hidden'} min-w-0 @[900px]:block`}>
          <div className="sticky top-[54px] space-y-3">
            <section className="rounded-2xl border border-[#e3efed] bg-white p-4 shadow-card">
              {hasPoster && <div className="mb-3 border-b border-[#e3efed] pb-3"><div className="min-w-0">
                {v.kicker && <span className="inline-block max-w-full truncate rounded-md bg-sea-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-sea">{v.kicker}</span>}
                <p title={v.title} className="mt-1 line-clamp-2 text-[15px] font-bold leading-snug text-ink">{v.title}</p>
              </div></div>}
              {v.oldPrice > v.price && <p className="text-[12px] text-muted line-through">{som(v.oldPrice)}</p>}
              <div className="flex items-start justify-between gap-2">
                <b className="text-[24px] leading-tight text-ink">{som(v.price)}</b>
                {v.off && <span className="rounded-md bg-[#fde8e8] px-1.5 py-0.5 text-[11.5px] font-bold text-[#dc2626]">{v.off}</span>}
              </div>
              {v.earlyUntil && <p className="mt-1 text-[11.5px] font-semibold text-sea">Early bird narxi {v.earlyUntil.split('-').reverse().join('.')} gacha</p>}
              <ul className="mt-3 space-y-2 border-t border-line pt-3 text-[12.5px] text-ink">
                <li className="flex items-center gap-2"><CalendarDays className="size-4 text-sea" /> Sana: <b className="font-semibold">{dateLabel}</b></li>
                <li className="flex items-center gap-2"><Users className="size-4 text-sea" /> {v.seats} ta joydan {left} tasi qoldi</li>
              </ul>
              <RegButton className="mt-3 h-11 w-full text-[13.5px]" />
              <button type="button" disabled={preview} onClick={() => downloadIcs(v)} className="mt-2 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-sea text-[12.5px] font-semibold text-sea disabled:cursor-not-allowed disabled:opacity-60"><CalendarPlus className="size-4" /> Kalendarga qo‘shish</button>
            </section>
          </div>
        </aside>
      </div>

      {/* Bo‘limlar */}
      <div className="sticky top-[46px] z-10 mt-3 flex gap-1 overflow-x-auto rounded-xl border border-[#e3efed] bg-white px-1 shadow-card no-scrollbar">
        {tabs.map(([key, label]) => (
          <a key={key} href={`#sem-${key}`} onClick={(e) => go(e, key)} className="flex h-10 shrink-0 items-center px-2.5 text-[12.5px] font-semibold text-ink-2 hover:text-sea">{label}</a>
        ))}
      </div>

      <div className="mt-3 grid gap-3 @[760px]:grid-cols-2">
        {(v.about || (hasPoster && (v.audience.length > 0 || v.learn.length > 0))) && (
          <Card id="about" icon={BookOpen} title="Seminar haqida" className="@[760px]:col-span-2">
            {v.about && <p className="whitespace-pre-line text-[12.5px] leading-relaxed text-ink-2">{v.about}</p>}
            {hasPoster && (v.audience.length > 0 || v.learn.length > 0) && (
              <div className={`grid gap-2 @[480px]:grid-cols-2 ${v.about ? 'mt-3' : ''}`}>
                {v.audience.length > 0 && <div className="flex items-start gap-2 rounded-xl bg-[#f3faf9] p-2.5"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-sea"><Users className="size-4" /></span><span className="min-w-0"><b className="block text-[12px]">Kim uchun?</b><span className="block text-[11.5px] leading-snug text-ink-2">{v.audience.join(', ')}</span></span></div>}
                {v.learn.length > 0 && <div className="flex items-start gap-2 rounded-xl bg-[#f3faf9] p-2.5"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-sea"><Target className="size-4" /></span><span className="min-w-0"><b className="block text-[12px]">Natija</b><span className="block text-[11.5px] leading-snug text-ink-2">{v.learn.join('; ')}</span></span></div>}
              </div>
            )}
          </Card>
        )}
        {v.learn.length > 0 && <Card id="learn" icon={Target} title="Kurs yakunida nimalarni bajara olasiz?"><Checks items={v.learn} /></Card>}
        {practiceTiles.length > 0 && (
          <Card id="practice" icon={Settings2} title="Amaliyot formati">
            <div className="grid gap-2 @[480px]:grid-cols-2">
              {practiceTiles.map(([Icon, t, s]) => (
                <div key={t} className="flex items-start gap-2 rounded-xl bg-[#f2f9f8] p-2.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-sea"><Icon className="size-[18px]" /></span>
                  <span className="min-w-0"><b className="block text-[12.5px] leading-snug">{t}</b>{s && <span className="block text-[11.5px] leading-snug text-ink-2">{s}</span>}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {d.organizer && (d.bring || []).length > 0 && (
          <Card id="bring" icon={Package} title="Olib kelish kerak narsalar"><Checks items={d.bring} /></Card>
        )}

        {!d.noSpeaker && (
          <Card id="speaker" icon={UserRound} title={`Spiker — ${v.speaker.name}`} className="@[760px]:col-span-2">
            <button type="button" onClick={openSpeaker} className="mb-3 flex w-full items-center justify-between gap-2 rounded-xl bg-sea-50 px-3 py-2 text-left text-[13px] font-semibold text-sea">
              Ma’ruzachi profilini ochish <ChevronRight className="size-4 shrink-0" />
            </button>
            <div className="grid gap-4 @[640px]:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)]">
              <div className="flex min-w-0 gap-3">
                {v.speaker.avatar ? <img src={v.speaker.avatar} alt="" className="size-24 shrink-0 rounded-xl object-cover" /> : <span className="grid size-24 shrink-0 place-items-center rounded-xl bg-sea-50 text-[32px] font-bold text-sea">{(v.speaker.name || '?').slice(0, 1)}</span>}
                <div className="min-w-0 space-y-1.5">
                  {v.speaker.role && <span className="inline-block rounded-md bg-sea-50 px-2 py-0.5 text-[11.5px] font-semibold text-sea">{v.speaker.role}</span>}
                  {sp?.years && <p className="flex items-center gap-1.5 text-[12px] text-ink-2"><BadgeCheck className="size-4 shrink-0 text-sea" /> Tajriba: {sp.years} yil</p>}
                  {sp?.clinic && <p className="flex items-center gap-1.5 text-[12px] text-ink-2"><Building2 className="size-4 shrink-0 text-sea" /> Klinika: {sp.clinic}</p>}
                  {sp?.degree && <p className="flex items-center gap-1.5 text-[12px] text-ink-2"><GraduationCap className="size-4 shrink-0 text-sea" /> {sp.degree}</p>}
                  {!d.organizer && v.speaker.lines.map((l) => <p key={l} className="flex items-center gap-1.5 text-[12px] text-ink-2"><BadgeCheck className="size-4 shrink-0 text-sea" /> {l}</p>)}
                </div>
              </div>
              {v.speaker.bio && <div className="min-w-0"><b className="text-[13px]">Bio</b><p className="mt-1 whitespace-pre-line text-[12px] leading-relaxed text-ink-2">{v.speaker.bio}</p></div>}
              {spCerts.length > 0 && <div className="min-w-0"><b className="flex items-center gap-1.5 text-[13px]"><Award className="size-4 text-sea" /> Sertifikatlar va malaka oshirish</b><div className="mt-1.5"><Checks items={spCerts} /></div></div>}
            </div>
            {others.length > 0 && (
              <div className="mt-3 grid gap-2 border-t border-line pt-3 @[640px]:grid-cols-2">
                {others.map((o) => (
                  <div key={o.name} className="flex items-start gap-2 rounded-xl border border-line p-2">
                    {o.avatar ? <img src={o.avatar} alt="" className="size-11 shrink-0 rounded-full object-cover" /> : <span className="grid size-11 shrink-0 place-items-center rounded-full bg-sea-50 text-[15px] font-bold text-sea">{o.name.slice(0, 1)}</span>}
                    <span className="min-w-0"><b className="block text-[12.5px]">{o.name}</b>{o.role && <span className="block text-[11.5px] text-muted">{o.role}</span>}{o.bio && <span className="mt-0.5 block text-[11.5px] leading-snug text-ink-2">{o.bio}</span>}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {v.includes.length > 0 && <Card id="price" icon={Layers} title="Narxga nimalar kiradi?"><Checks items={v.includes} /></Card>}
        <Card id="pay" icon={CreditCard} title="To‘lov va qaytarish shartlari">
          <dl className="space-y-2.5 text-[12px]">
            <div className="grid grid-cols-[130px_minmax(0,1fr)] gap-2"><dt className="flex items-center gap-1.5 font-semibold text-ink"><ShieldCheck className="size-4 text-sea" /> To‘lov</dt><dd className="text-ink-2">{NOTES.pay[1]}</dd></div>
            {(v.refundPolicy || !v.organizer) && <div className="grid grid-cols-[130px_minmax(0,1fr)] gap-2"><dt className="flex items-center gap-1.5 font-semibold text-ink"><RotateCcw className="size-4 text-sea" /> Qaytarish</dt><dd className="whitespace-pre-line text-ink-2">{v.refundPolicy || NOTES.refund[1]}</dd></div>}
          </dl>
          <button type="button" onClick={() => setCorp(true)} disabled={preview} className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-sea disabled:opacity-60"><Building2 className="size-4" /> Korporativ ariza <ChevronRight className="size-3.5" /></button>
        </Card>

        {days.length > 0 && (
          <Card id="program" icon={CalendarDays} title={`Dastur (${days.length} kun)`} className="@[760px]:col-span-2">
            <div className={`grid gap-3 ${days.length > 1 ? '@[560px]:grid-cols-2' : ''}`}>
              {days.map((day, di) => (
                <div key={di} className="min-w-0 overflow-hidden rounded-xl border border-[#d8ecea]">
                  <b className="block bg-sea px-3 py-2 text-[12.5px] text-white">{day.label || `${di + 1}-kun`}{day.title ? ` — ${day.title}` : ''}{day.date ? ` (${day.date})` : ''}</b>
                  <ul className="divide-y divide-[#eef4f3]">
                    {day.items.map(([time, title, sub], i) => {
                      const brk = BREAK_RE.test(title)
                      return (
                        <li key={`${time}-${i}`} className={`flex items-start gap-2 px-3 py-1.5 ${brk ? 'bg-[#eaf6f5]' : ''}`}>
                          <span className="w-[84px] shrink-0 whitespace-nowrap text-[11.5px] font-semibold tabular-nums text-ink-2">{time}</span>
                          <span className={`min-w-0 flex-1 text-[12px] leading-snug ${brk ? 'font-bold text-sea' : 'text-ink'}`} lang="uz" style={{ overflowWrap: 'break-word', hyphens: 'auto' }}>{title}{sub && <span className="block text-[11px] text-muted">{sub}</span>}</span>
                          {!brk && day.title ? <span className="shrink-0 rounded-md bg-sea-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-sea">{day.title}</span> : null}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
        )}
        {gallery.length > 0 && (
          <Card id="gallery" icon={ImageIcon} title="Galereya">
            <div className="grid grid-cols-2 gap-2">
              {gallery.slice(0, 4).map((src, i) => (
                <button key={src} type="button" onClick={() => setShot(i + 1)} className="aspect-[4/3] overflow-hidden rounded-xl" aria-label={`Rasm ${i + 2}`}><img src={src} alt="" className="h-full w-full object-cover" /></button>
              ))}
            </div>
            <button type="button" onClick={() => setShot(1)} className="mx-auto mt-3 flex h-9 items-center gap-1.5 rounded-xl border border-sea px-4 text-[12.5px] font-semibold text-sea">Barcha fotosuratlar ({gallery.length}) <ArrowRight className="size-3.5" /></button>
          </Card>
        )}

        {(v.venue.name || v.venue.address) && (
          <Card id="place" icon={MapPin} title="Manzil">
            <div className="grid gap-3 @[480px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              {v.venue.image ? <img src={v.venue.image} alt="" className="h-[130px] w-full rounded-xl object-cover" /> : <span className="grid h-[130px] place-items-center rounded-xl bg-[#eef5f4] text-sea"><MapPin className="size-8" /></span>}
              <div className="min-w-0">
                <b className="flex items-start gap-1.5 text-[13px]"><Building2 className="mt-0.5 size-4 shrink-0 text-sea" /> {v.venue.name}</b>
                {v.venue.address && <p className="mt-1 break-words text-[11.5px] text-muted">{v.venue.address}</p>}
                {v.venue.lines.length > 0 && <ul className="mt-1.5 space-y-1">{v.venue.lines.map(([Icon, t]) => <li key={t} className="flex items-start gap-1.5 text-[11.5px] text-ink-2"><Icon className="mt-0.5 size-3.5 shrink-0 text-sea" /> {t}</li>)}</ul>}
                {!v.venue.online && <a href={v.venue.map} target="_blank" rel="noreferrer" className="mt-2 inline-flex h-8 items-center gap-1 rounded-xl border border-sea px-3 text-[12px] font-semibold text-sea">Xaritada ochish <ArrowRight className="size-3.5" /></a>}
              </div>
            </div>
          </Card>
        )}
        <Card id="reviews" icon={MessagesSquare} title="Sharhlar">
          <p className="flex items-center gap-2 rounded-xl bg-[#eef8f7] px-3 py-3 text-[12px] text-ink-2"><Info className="size-4 shrink-0 text-sea" /> Kurs tugagach ishtirokchilar sharhlari shu yerda chiqadi.</p>
        </Card>

        {faqs.length > 0 && (
          <Card id="faq" icon={HelpCircle} title="Savol-javob">
            {faqs.map(([q, a], i) => (
              <div key={q} className="border-b border-line last:border-0">
                <button type="button" onClick={() => setFaq(faq === i ? -1 : i)} className="flex w-full items-center justify-between gap-2 py-2.5 text-left text-[12.5px] font-medium" aria-expanded={faq === i}>
                  {q} <ChevronDown className={`size-4 shrink-0 text-muted transition ${faq === i ? 'rotate-180' : ''}`} />
                </button>
                {faq === i && <p className="whitespace-pre-line pb-2.5 text-[12px] leading-relaxed text-ink-2">{a}</p>}
              </div>
            ))}
          </Card>
        )}
        <section className="rounded-2xl border border-[#e3efed] bg-white p-4 shadow-card">
          <div className="flex items-start gap-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sea-50 text-sea"><Phone className="size-4" /></span>
            <span>
              <b className="block text-[13px]">Savollar bormi?</b>
              {v.orgName && <span className="block text-[11.5px] text-muted">Tashkilotchi: <b className="font-semibold text-ink">{v.orgName}</b></span>}
              {v.contact?.phone
                ? <a href={`tel:${formatPhone(v.contact.phone).replace(/[^\d+]/g, '')}`} className="block text-[12px] text-ink-2">{formatPhone(v.contact.phone)}</a>
                : CONTACT_PHONE && <a href={CONTACT_PHONE_TEL} className="block text-[12px] text-ink-2">{CONTACT_PHONE}</a>}
              <a href={telegramHandle(v.contact?.telegram).url || 'https://t.me/stomahub'} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] font-semibold text-sea"><Send className="size-3.5" /> Telegram orqali yozish{telegramHandle(v.contact?.telegram).handle ? ` (${telegramHandle(v.contact?.telegram).handle})` : ''}</a>
            </span>
          </div>
        </section>
        {v.similar.length > 0 && (
          <section className="rounded-2xl border border-[#e3efed] bg-white p-4 shadow-card">
            <div className="mb-2 flex items-center justify-between"><b className="text-[13px]">O‘xshash seminarlar</b><Link to="/seminarlar" className="text-[11.5px] font-semibold text-sea">Barchasi</Link></div>
            <ul className="space-y-2">
              {v.similar.map((s) => (
                <li key={s.title}><Link to={s.to} className="flex items-center gap-2 rounded-lg p-1 hover:bg-[#f4f8fb]"><img src={s.image} alt="" className="h-12 w-14 shrink-0 rounded-lg object-cover" /><span className="min-w-0 flex-1"><b className="block text-[12px] leading-snug">{s.title}</b><span className="block text-[10.5px] text-muted">{s.date}</span><b className="block text-[12px] text-sea">{seminarPrice(s.price)}</b></span><ChevronRight className="size-4 shrink-0 text-muted" /></Link></li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Mobil: pastki narx paneli (iOS safe-area) */}
      {!preview && <div className="app-action-bar fixed inset-x-0 bottom-0 z-30 border-t border-[#e3efed] bg-white/95 px-3 pt-2 backdrop-blur @[900px]:hidden">
        <div className="mx-auto flex max-w-[640px] items-center gap-3">
          <div className="min-w-0 flex-1">
            {v.oldPrice > v.price && <span className="block text-[11px] text-muted line-through">{som(v.oldPrice)}</span>}
            <b className="block text-[17px] leading-tight text-ink">{som(v.price)}</b>
            <span className="block truncate text-[11px] text-muted">{dateLabel} · {left} ta joy qoldi</span>
          </div>
          <RegButton className="h-11 shrink-0 px-4 text-[13.5px]" />
        </div>
      </div>}

      {shot !== null && <PhotoLightbox images={v.gallery} index={shot} onIndex={setShot} onClose={() => setShot(null)} alt="Galereya" />}
      {speakerOpen && (
        <SpeakerProfileSheet
          speaker={{ ...speakerPerson, lines: v.speaker?.lines || [] }}
          others={speakerOthers}
          onClose={() => setSpeakerOpen(false)}
        />
      )}
      {note && <Dialog title={NOTES[note][0]} onClose={() => setNote(null)}><p className="whitespace-pre-line text-[13px] leading-relaxed text-ink-2">{note === 'refund' && v.refundPolicy ? v.refundPolicy : NOTES[note][1]}</p></Dialog>}
      {corp && <Corporate title={v.title} onClose={() => setCorp(false)} />}
    </div>
  )
}

function Fact({ icon: Icon, title, text }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-xl bg-white/95 px-2.5 py-2 shadow-sm">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sea-50 text-sea"><Icon className="size-4" /></span>
      <span className="min-w-0 leading-tight">
        <b className="block truncate text-[12px]">{title}</b>
        <span className="block truncate text-[10.5px] text-muted">{text}</span>
      </span>
    </div>
  )
}

function Lightbox({ images, index, onIndex, onClose, trailer = false }) {
  const total = images.length
  return (
    <div className="bemor-shade" onClick={onClose}>
      <div className="relative w-[min(860px,100%)]" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} aria-label="Yopish" className="absolute -top-10 right-0 grid size-8 place-items-center rounded-full bg-white"><X className="size-4" /></button>
        <img src={images[index]} alt="" className="max-h-[calc(100dvh/var(--z)-120px)] w-full rounded-2xl object-contain" />
        {trailer && index === 0 && <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[12px]"><Play className="size-3.5" /> Seminar videosi treyleri — kadr</p>}
        <div className="mt-2 flex items-center justify-center gap-2">
          {images.map((src, i) => (
            <button key={`${i}-${src}`} type="button" onClick={() => onIndex(i)} aria-label={`Rasm ${i + 1}`} className={`h-12 w-16 overflow-hidden rounded-lg ${i === index ? 'ring-2 ring-sea' : 'opacity-70'}`}>
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[11px]"><ImageIcon className="size-3.5" /> {index + 1}/{total}</span>
        </div>
      </div>
    </div>
  )
}

function Dialog({ title, onClose, children }) {
  return (
    <div className="bemor-shade" onClick={onClose}>
      <div className="w-[min(440px,100%)] rounded-2xl bg-white p-4" role="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <b className="text-[15px]">{title}</b>
          <button type="button" onClick={onClose} aria-label="Yopish" className="grid size-8 place-items-center rounded-lg text-muted"><X className="size-4" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Corporate({ title, onClose }) {
  const [form, setForm] = useState({ org: '', name: '', phone: '', count: '3' })
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const submit = (e) => {
    e.preventDefault()
    if (!form.org.trim() || !form.name.trim() || form.phone.replace(/\D/g, '').length < 9) {
      setError('Klinika nomi, mas’ul shaxs va telefon majburiy.')
      return
    }
    setSent(true)
  }
  return (
    <Dialog title="Korporativ ariza" onClose={onClose}>
      {sent ? (
        <p className="text-[13px] leading-relaxed text-ink-2">Ariza qabul qilindi. {form.count} ta ishtirokchi uchun “{title}” bo‘yicha menejer siz bilan bog‘lanadi.</p>
      ) : (
        <form onSubmit={submit} className="space-y-2">
          {[['org', 'Klinika nomi'], ['name', 'Mas’ul shaxs'], ['phone', 'Telefon']].map(([key, label]) => (
            <input key={key} value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} placeholder={label} className="h-10 w-full rounded-xl border border-[#e6ebf2] px-3 text-[13px] outline-none focus:border-sea" />
          ))}
          <label className="flex items-center justify-between text-[12.5px]">Ishtirokchilar soni
            <input type="number" min="2" max="30" value={form.count} onChange={(e) => setForm((f) => ({ ...f, count: e.target.value }))} className="h-9 w-20 rounded-lg border border-[#e6ebf2] px-2 text-[13px] outline-none" />
          </label>
          {error && <p className="text-[12px] text-[#e11d48]">{error}</p>}
          <button className="h-10 w-full rounded-xl bg-sea text-[13px] font-semibold text-white">Yuborish</button>
        </form>
      )}
    </Dialog>
  )
}

function downloadIcs(v) {
  const body = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//StomaHub//Seminar//UZ', 'BEGIN:VEVENT',
    `UID:${v.ics.start}-${v.title.length}@stomahub`,
    `DTSTART:${v.ics.start}`, `DTEND:${v.ics.end}`,
    `SUMMARY:${v.title}`, `LOCATION:${v.venue.name}, ${v.venue.address}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([body], { type: 'text/calendar' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'seminar.ics'
  a.click()
  URL.revokeObjectURL(url)
}
