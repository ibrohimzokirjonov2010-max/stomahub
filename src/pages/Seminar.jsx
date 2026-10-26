import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ChevronRight, ChevronDown, CalendarDays, MapPin, Users, Award, Hand, Video, MessagesSquare, BookOpen, UsersRound,
  Play, Check, ArrowRight, CalendarPlus, Phone, Send, ShieldCheck, RotateCcw, FileText, Building2, Star,
  BadgeCheck, Syringe, HelpCircle, Car, TrainFront, X, Image as ImageIcon,
} from 'lucide-react'
import { ToothIcon } from '../components/icons'
import { buildSeminarPage } from '../seminarsData'
import { publicRecord, useHub } from '../hubStore'
import { som } from '../marketData'

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
  ['To‘lovni qanday amalga oshirish mumkin?', 'Click, Payme yoki Uzcard/Humo kartasi orqali ro‘yxatdan o‘tish sahifasida to‘lash mumkin.'],
  ['Qaytarish shartlari qanday?', 'Seminar boshlanishidan 72 soat oldin bekor qilinsa, to‘lov to‘liq qaytariladi. Undan keyin joyni hamkasbingizga o‘tkazish mumkin.'],
  ['Seminar kimlar uchun mos?', 'Implantologiyani boshlayotgan va tajribasini mustahkamlamoqchi bo‘lgan stomatolog-jarrohlar, ortopedlar va rezidentlar uchun.'],
  ['Joylar soni cheklanganmi?', 'Ha, amaliy qism sifatli bo‘lishi uchun guruh 30 kishidan oshmaydi.'],
]

const NOTES = {
  pay: ['To‘lov xavfsiz', 'To‘lovlar Click, Payme va bank kartalari orqali himoyalangan kanalda amalga oshiriladi. Karta ma’lumotlari StomaHub’da saqlanmaydi.'],
  refund: ['Qaytarish shartlari', 'Seminardan 72 soat oldin bekor qilinsa, to‘lov to‘liq qaytariladi. Keyinroq bekor qilinsa, joyingizni hamkasbingizga o‘tkazishingiz mumkin.'],
  invite: ['Rasmiy taklifnoma', 'Ro‘yxatdan o‘tgandan so‘ng ish joyingiz uchun rasmiy taklifnoma PDF ko‘rinishida elektron pochtangizga yuboriladi.'],
}

function detail(d) {
  if (d.id === 'implant-toj') {
    return {
      kicker: 'Implantologiya',
      title: 'Implantologiya: implantdan to‘igacha',
      lead: 'Diagnostika, jarrohlik protokoli va implant usti protezlash bo‘yicha amaliy seminar.',
      dayTitle: '28 Oktabr 2026',
      dayText: 'Chorshanba, 10:00 – 18:00',
      dayShort: '28 Oktabr 2026',
      city: 'Toshkent',
      venueShort: 'Hyatt Regency, konferens-zal',
      price: 1200000,
      oldPrice: 1500000,
      off: '-20%',
      seats: 30,
      taken: 0,
      hero: '/images/hero-implant.jpg',
      gallery: ['/images/hero-implant.jpg', yang('yang-seminar'), yang('yang-training'), pic('surgery'), pic('micro')],
      more: 12,
      speaker: {
        name: 'Dr. Aziz Karimov',
        role: 'Implantolog, PhD',
        avatar: d.speaker.avatar,
        lines: ['10+ yil tajriba', '500+ muvaffaqiyatli implantatsiya', 'Xalqaro sertifikatlar (ITI, Straumann)', 'Amaliy klinik faoliyat'],
        bio: 'Dr. Aziz Karimov – implantologiya va rekonstruktiv jarrohlik bo‘yicha mutaxassis. ITI va Straumann sertifikatlariga ega. Ko‘plab xalqaro konferensiyalarda ma’ruzachi sifatida ishtirok etgan.',
      },
      about: 'Ushbu amaliy seminar implantologiyaning zamonaviy yondashuvlarini, diagnostika, jarrohlik protokollari va implant usti protezlash bosqichlarini qamrab oladi. Ishtirokchilar nazariy bilimlar bilan bir qatorda jonli jarrohlik va amaliy mashg‘ulotlarda qatnashish imkoniyatiga ega bo‘ladilar.',
      learn: ['Implantatsiya uchun bemor tanlash', 'CBCT tahlili va diagnostika', 'Jarrohlik protokoli (bosqichma-bosqich)', 'Suyak rekonstruksiyasi asoslari', 'Implant usti protezlash', 'Komplikatsiyalar va ularni boshqarish'],
      includes: ['Zalda qatnashish', 'Sertifikat beriladi (CME)', 'Kofe-breyk va tushlik', 'Amaliy mashg‘ulotlar', 'Seminar materiallari'],
      schedule: [
        ['10:00 – 11:00', 'Ro‘yxatdan o‘tish va qahva', 'Ishtirokchilarni kutib olish, tanishuv'],
        ['11:00 – 12:30', 'Nazariy qism', 'Diagnostika, rejalashtirish, zamonaviy protokollar'],
        ['12:30 – 13:30', 'Tushlik', 'Kofe-breyk va networking'],
        ['13:30 – 15:00', 'Jonli jarrohlik (Live-surgery)', 'Real klinik holat asosida'],
        ['15:30 – 17:00', 'Amaliy mashg‘ulot', 'Model va amaliy ishlar'],
        ['17:00 – 18:00', 'Savol-javob, case muhokama va sertifikat topshirish', ''],
      ],
      venue: {
        name: 'Hyatt Regency Tashkent',
        address: 'Toshkent sh., Navoi ko‘chasi, 1A',
        image: pic('hotel'),
        map: 'https://maps.google.com/?q=Hyatt+Regency+Tashkent',
        lines: [[Building2, 'Konferens-zal, 3-qavat'], [Car, 'Avtoturargoh mavjud'], [TrainFront, 'Metro: Amir Temur (10 daqiqa)']],
      },
      similar: [
        { to: '/seminarlar/sinus-lifting', title: 'Sinus lifting va vertikal augmentatsiya', date: '12 Noy 2026, Toshkent', price: 2500000, image: pic('surgery') },
        { to: '/seminarlar', title: 'Yumshoq to‘qimalar plastikasi', date: '25 Noy 2026, Toshkent', price: 1800000, image: pic('micro') },
        { to: '/seminarlar', title: 'Implant usti protezlash', date: '10 Dek 2026, Toshkent', price: 1200000, image: pic('teeth') },
      ],
      ics: { start: '20261028T100000', end: '20261028T180000' },
    }
  }
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
    gallery: [d.image, yang('yang-seminar'), yang('yang-training'), pic('hotel'), pic('micro')],
    more: 8,
    speaker: {
      name: d.speaker.name,
      role: d.speaker.role,
      avatar: d.speaker.avatar,
      lines: d.speaker.lines,
      bio: `${d.speaker.name} – ${d.speaker.role.toLowerCase()}. Klinik amaliyot va o‘qitish tajribasiga ega, ${d.cme} ballik dastur muallifi.`,
    },
    about: d.about,
    learn: d.learn,
    includes: plan.perks,
    schedule: d.schedule.map(([time, text]) => [time, text, '']),
    venue: { ...d.venue, lines: [[Building2, 'Konferens-zal'], [Car, 'Avtoturargoh mavjud']] },
    similar: d.similar.map((s) => ({ to: `/seminarlar/${s.id}`, title: s.title, date: `${s.date}, ${s.city}`, price: s.price, image: s.image })),
    ics: { start: `${year}${mm}${String(d.day).padStart(2, '0')}T${from}00`, end: `${year}${mm}${String(d.day).padStart(2, '0')}T${to}00` },
  }
}

export default function Seminar() {
  const { id } = useParams()
  const hub = useHub()
  const rec = publicRecord(id, hub)
  const d = rec ? buildSeminarPage(rec) : null
  const [tab, setTab] = useState('about')
  const [faq, setFaq] = useState(0)
  const [shot, setShot] = useState(null)
  const [note, setNote] = useState(null)
  const [corp, setCorp] = useState(false)
  const [profile, setProfile] = useState(false)
  if (!d) {
    return (
      <div className="py-16 text-center">
        <p className="text-[18px] font-bold text-ink">Seminar topilmadi</p>
        <Link to="/seminarlar" className="mt-3 inline-block text-[13px] font-semibold text-sea">Seminarlarga qaytish</Link>
      </div>
    )
  }
  const v = detail(d)
  const cancelled = !!d.cancelled
  const left = v.seats - v.taken
  const regTo = `/seminarlar/${d.id}/royxat`

  const go = (key) => {
    setTab(key)
    document.getElementById(`sem-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="sem-page pb-8 pt-3">
      <div className="min-w-0 space-y-3">
        <nav className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
          <Link to="/seminarlar" className="hover:text-sea">Seminarlar</Link>
          <ChevronRight className="size-3" />
          <Link to="/seminarlar" className="hover:text-sea">{v.kicker}</Link>
          <ChevronRight className="size-3" />
          <span className="font-medium text-ink">{v.title}</span>
        </nav>

        <section className="relative overflow-hidden rounded-2xl bg-[#eaf6f7] p-4 shadow-card">
          <img src={v.hero} alt="" className="absolute inset-y-0 right-0 h-full w-[58%] object-cover" />
          <span className="absolute inset-y-0 right-0 w-[58%]" style={{ background: 'linear-gradient(90deg, #eaf6f7 0%, rgb(234 246 247 / 0.65) 35%, rgb(234 246 247 / 0) 70%)' }} />
          <div className="relative max-w-[62%]">
            <span className="rounded-md bg-sea px-2 py-0.5 text-[11px] font-semibold text-white">{v.kicker}</span>
            <h1 className="mt-2 text-[28px] font-extrabold leading-[1.1] tracking-tight text-ink">{v.title}</h1>
            <p className="mt-2 text-[12.5px] text-ink-2">{v.lead}</p>
          </div>
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-sea shadow"><Hand className="size-3.5" /> Hands-on amaliyot</span>
          <div className="sem-facts relative mt-4">
            <Fact icon={CalendarDays} title={v.dayTitle} text={v.dayText} />
            <Fact icon={MapPin} title={v.city} text={v.venueShort} />
            <Fact icon={Users} title={d.format.startsWith('Online') ? 'Online' : 'Offline'} text="Zalda qatnashish" />
            <Fact icon={Award} title="CME" text="Sertifikat beriladi" />
          </div>
        </section>

        <div className="sem-feats">
          {FEATS.map(([Icon, a, b]) => (
            <div key={a} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 shadow-card">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sea-50 text-sea"><Icon className="size-4" /></span>
              <span className="text-[11.5px] font-semibold leading-tight text-ink">{a}<br /><span className="font-medium text-ink-2">{b}</span></span>
            </div>
          ))}
        </div>

        <div className="sem-gallery">
          <button type="button" onClick={() => setShot(0)} className="relative row-span-2 overflow-hidden rounded-2xl" aria-label="Seminar videosi">
            <img src={v.gallery[0]} alt="" className="h-full w-full object-cover" />
            <span className="absolute left-1/2 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow"><Play className="ml-0.5 size-5 fill-ink" /></span>
            <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent px-3 py-2 text-[11.5px] font-semibold text-white">
              <span className="inline-flex items-center gap-1"><Play className="size-3 fill-white" /> Seminar videosi</span>
              <span>02:15</span>
            </span>
          </button>
          {v.gallery.slice(1, 5).map((src, i) => (
            <button key={src} type="button" onClick={() => setShot(i + 1)} className="relative overflow-hidden rounded-2xl" aria-label={`Rasm ${i + 2}`}>
              <img src={src} alt="" className="h-full w-full object-cover" />
              {i === 3 && <span className="absolute inset-0 grid place-items-center bg-[#0b1f3a]/50 text-[20px] font-bold text-white">+{v.more}</span>}
            </button>
          ))}
        </div>

        <section className="sem-speaker rounded-2xl bg-white p-3 shadow-card">
          <div className="relative overflow-hidden rounded-xl bg-[#eef6f8]">
            <img src={v.speaker.avatar} alt="" className="h-full min-h-[150px] w-full object-cover" />
            <span className="absolute bottom-2 left-2 rounded-md bg-white px-2 py-0.5 text-[10.5px] font-semibold text-sea shadow">Asosiy spiker</span>
          </div>
          <div className="min-w-0">
            <h2 className="text-[17px] font-bold text-ink">{v.speaker.name}</h2>
            <p className="text-[12px] text-muted">{v.speaker.role}</p>
            <ul className="mt-2 space-y-1.5">
              {v.speaker.lines.map((line, i) => {
                const Icon = [BadgeCheck, Syringe, Award, ToothIcon][i % 4]
                return <li key={line} className="flex items-center gap-2 text-[12px] text-ink-2"><Icon className="size-4 shrink-0 text-sea" /> {line}</li>
              })}
            </ul>
          </div>
          <div className="flex min-w-0 flex-col justify-between gap-3 border-line sm:border-l sm:pl-3">
            <p className="text-[12px] leading-relaxed text-ink-2">{v.speaker.bio}</p>
            <button type="button" onClick={() => setProfile(true)} className="inline-flex h-9 items-center justify-center gap-1 self-end rounded-xl border border-sea px-3 text-[12px] font-semibold text-sea">Batafsil profil <ArrowRight className="size-3.5" /></button>
          </div>
        </section>

        <div className="sticky top-[46px] z-10 flex gap-1 overflow-x-auto rounded-xl bg-white px-1 shadow-card no-scrollbar">
          {[
            ['about', 'Seminar haqida'], ['program', 'Dastur'], ['learn', 'Nimalarni o‘rganasiz?'], ['who', 'Kimlar uchun?'],
            ['price', 'Narxga nimalar kiradi?'], ['place', 'Manzil'], ['reviews', 'Sharhlar'], ['faq', 'FAQ'],
          ].map(([key, label]) => (
            <button key={key} type="button" onClick={() => go(key)} className={`h-9 shrink-0 px-2.5 text-[12px] font-semibold ${tab === key ? 'text-sea' : 'text-ink-2'}`} style={{ boxShadow: tab === key ? 'inset 0 -2px 0 #0b8a95' : 'none' }}>{label}</button>
          ))}
        </div>

        <div className="sem-split">
          <section id="sem-about" className="scroll-mt-24 rounded-2xl bg-white p-4 shadow-card">
            <h2 className="text-[15px] font-bold">Seminar haqida</h2>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-2">{v.about}</p>
            <div className="sem-cards mt-3">
              {ABOUT_CARDS.map(([Icon, t, s]) => (
                <div key={t} className="flex items-start gap-2">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sea-50 text-sea"><Icon className="size-4" /></span>
                  <span className="min-w-0"><b className="block text-[12px]">{t}</b><span className="block text-[11px] text-muted">{s}</span></span>
                </div>
              ))}
            </div>
          </section>
          <section id="sem-learn" className="scroll-mt-24 rounded-2xl bg-[#eef8f7] p-4">
            <h2 className="text-[15px] font-bold">Nimalarni o‘rganasiz?</h2>
            <ul className="mt-2 space-y-2">
              {v.learn.map((t) => <li key={t} className="flex items-start gap-2 text-[12.5px] text-ink"><Check className="mt-0.5 size-4 shrink-0 text-sea" /> {t}</li>)}
            </ul>
          </section>
        </div>

        <div className="sem-split">
          <section id="sem-program" className="scroll-mt-24 rounded-2xl bg-white p-4 shadow-card">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-bold">Dastur</h2>
              <span className="inline-flex items-center gap-1 rounded-lg bg-sea-50 px-2 py-0.5 text-[11px] font-semibold text-sea"><CalendarDays className="size-3.5" /> {v.dayShort}</span>
            </div>
            <ol className="mt-3 border-l-2 border-sea-100 pl-4">
              {v.schedule.map(([time, title, sub]) => (
                <li key={time} className="relative pb-3 last:pb-0">
                  <span className="absolute -left-[23px] top-1 size-3 rounded-full border-2 border-white bg-sea" />
                  <div className="grid grid-cols-[100px_minmax(0,1fr)] gap-3">
                    <span className="h-fit rounded-md bg-[#f3f6fa] px-2 py-0.5 text-[11px] font-semibold text-ink-2">{time}</span>
                    <span><b className="block text-[12.5px]">{title}</b>{sub && <span className="text-[11.5px] text-muted">{sub}</span>}</span>
                  </div>
                </li>
              ))}
            </ol>
          </section>
          <section id="sem-place" className="scroll-mt-24 rounded-2xl bg-white p-4 shadow-card">
            <h2 className="text-[15px] font-bold">Manzil</h2>
            <div className="relative mt-2 overflow-hidden rounded-xl">
              <img src={v.venue.image} alt="" className="h-[150px] w-full object-cover" />
              <a href={v.venue.map} target="_blank" rel="noreferrer" className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[11.5px] font-semibold text-sea shadow"><MapPin className="size-3.5" /> Xaritada ochish</a>
            </div>
            <b className="mt-2 block text-[13px]">{v.venue.name}</b>
            <p className="text-[12px] text-muted">{v.venue.address}</p>
            <ul className="mt-2 space-y-1.5">
              {v.venue.lines.map(([Icon, t]) => <li key={t} className="flex items-center gap-2 text-[12px] text-ink-2"><Icon className="size-4 text-sea" /> {t}</li>)}
            </ul>
          </section>
        </div>

        <section id="sem-who" className="scroll-mt-24 rounded-2xl bg-white p-4 shadow-card">
          <h2 className="text-[15px] font-bold">Kimlar uchun?</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {['Stomatolog-jarrohlar', 'Ortoped stomatologlar', 'Implantologiyani boshlayotganlar', 'Rezident va ordinatorlar', 'Klinika rahbarlari'].map((t) => (
              <span key={t} className="rounded-full bg-[#f3f6fa] px-3 py-1 text-[12px] font-medium text-ink-2">{t}</span>
            ))}
          </div>
        </section>

        <section id="sem-reviews" className="scroll-mt-24 rounded-2xl bg-white p-4 shadow-card">
          <h2 className="text-[15px] font-bold">Ishtirokchilar sharhlari</h2>
          <div className="sem-reviews mt-3">
            {[
              ['Dr. Malika Saidova', 'Stomatolog, Toshkent', face('bemor-malika'), 'Juda foydali seminar bo‘ldi. Jonli jarrohlik va amaliy mashg‘ulotlar katta tajriba berdi.'],
              ['Dr. Bekzod Inomov', 'Stomatolog, Samarqand', face('bemor-bobur'), 'Amaliy qismi a’lo darajada tashkil etilgan. Tavsiya qilaman!'],
              ['Dr. Gulnora Karimova', 'Stomatolog, Buxoro', face('bemor-dilnoza'), 'Nazariy ma’lumotlar va klinik holatlar muhokamasi juda foydali bo‘ldi.'],
            ].map(([name, role, avatar, text]) => (
              <article key={name} className="rounded-xl border border-line p-3">
                <div className="flex items-center gap-2">
                  <img src={avatar} alt="" className="size-9 rounded-full object-cover" />
                  <span className="min-w-0"><b className="block truncate text-[12.5px]">{name}</b><span className="text-[11px] text-muted">{role}</span></span>
                </div>
                <p className="mt-1.5 flex">{Array.from({ length: 5 }, (_, i) => <Star key={i} className="size-3.5 fill-star text-star" />)}</p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-ink-2">{text}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <aside className="min-w-0 space-y-3">
        <section id="sem-price" className="scroll-mt-24 rounded-2xl bg-white p-4 shadow-card">
          <div className="flex gap-2">
            <span className="rounded-lg bg-[#fde8e8] px-2.5 py-1 text-[12px] font-bold text-[#dc2626]">{cancelled ? 'Bekor qilingan' : 'Ro‘yxatdan o‘tish'}</span>
            <span className="rounded-lg border border-[#fbd5d5] px-2.5 py-1 text-[12px] font-semibold text-[#dc2626]">{left} ta o‘rin qoldi</span>
          </div>
          <p className="mt-3 text-[12px] text-muted line-through">{som(v.oldPrice)}</p>
          <div className="flex items-center justify-between gap-2">
            <b className="text-[24px] leading-tight">{som(v.price)}</b>
            <span className="rounded-md bg-[#fde8e8] px-1.5 py-0.5 text-[12px] font-bold text-[#dc2626]">{v.off}</span>
          </div>
          <ul className="mt-3 space-y-1.5">
            {v.includes.map((t) => <li key={t} className="flex items-center gap-2 text-[12.5px] text-ink"><Check className="size-4 text-sea" /> {t}</li>)}
          </ul>
          <div className="mt-3 flex justify-between text-[11.5px] text-muted"><span>Band joylar</span><span>{v.taken}/{v.seats}</span></div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#e7eef5]"><span className="block h-full rounded-full bg-sea" style={{ width: `${Math.max(4, (v.taken / v.seats) * 100)}%` }} /></div>
          <p className="mt-2 text-[13px] font-bold text-sea">{left} ta o‘rin qoldi</p>
          {cancelled
            ? <span className="mt-3 flex h-11 items-center justify-center rounded-xl bg-[#fde8e8] text-[13.5px] font-semibold text-[#dc2626]">Ro‘yxat yopiq</span>
            : <Link to={regTo} className="mt-3 flex h-11 items-center justify-center gap-1.5 rounded-xl bg-sea text-[13.5px] font-semibold text-white">Ro‘yxatdan o‘tish <ArrowRight className="size-4" /></Link>}
          <button type="button" onClick={() => downloadIcs(v)} className="mt-2 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-sea text-[12.5px] font-semibold text-sea"><CalendarPlus className="size-4" /> Kalendarga qo‘shish</button>
        </section>

        <section className="rounded-2xl bg-white p-3 shadow-card">
          <div className="flex items-start gap-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sea-50 text-sea"><Phone className="size-4" /></span>
            <span>
              <b className="block text-[13px]">Savollar bormi?</b>
              <a href="tel:+998901234567" className="block text-[12px] text-ink-2">+998 90 123 45 67</a>
              <a href="https://t.me/stomahub" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] font-semibold text-sea"><Send className="size-3.5" /> Telegram orqali yozish</a>
            </span>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-2 shadow-card">
          {[
            [ShieldCheck, 'To‘lov xavfsiz', () => setNote('pay')],
            [RotateCcw, 'Qaytarish shartlari', () => setNote('refund')],
            [FileText, 'Rasmiy taklifnoma', () => setNote('invite')],
            [Building2, 'Korporativ ariza', () => setCorp(true)],
          ].map(([Icon, label, onClick]) => (
            <button key={label} type="button" onClick={onClick} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[12.5px] font-medium hover:bg-[#f4f8fb]">
              <Icon className="size-4 text-sea" /> <span className="flex-1">{label}</span> <ChevronRight className="size-3.5 text-muted" />
            </button>
          ))}
        </section>

        <section className="rounded-2xl bg-white p-3 shadow-card">
          <div className="mb-2 flex items-center justify-between">
            <b className="text-[13px]">O‘xshash seminarlar</b>
            <Link to="/seminarlar" className="text-[11.5px] font-semibold text-sea">Barchasi</Link>
          </div>
          <ul className="space-y-2">
            {v.similar.map((s) => (
              <li key={s.title}>
                <Link to={s.to} className="flex items-center gap-2 rounded-lg p-1 hover:bg-[#f4f8fb]">
                  <img src={s.image} alt="" className="h-12 w-14 shrink-0 rounded-lg object-cover" />
                  <span className="min-w-0 flex-1">
                    <b className="block text-[12px] leading-snug">{s.title}</b>
                    <span className="block text-[10.5px] text-muted">{s.date}</span>
                    <b className="block text-[12px] text-sea">{som(s.price)}</b>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section id="sem-faq" className="scroll-mt-24 rounded-2xl bg-white p-3 shadow-card">
          <div className="mb-1 flex items-center justify-between">
            <b className="text-[13px]">Tez-tez so‘raladigan savollar</b>
          </div>
          {FAQ.map(([q, a], i) => (
            <div key={q} className="border-b border-line last:border-0">
              <button type="button" onClick={() => setFaq(faq === i ? -1 : i)} className="flex w-full items-center justify-between gap-2 py-2.5 text-left text-[12.5px] font-medium" aria-expanded={faq === i}>
                {q} <ChevronDown className={`size-4 shrink-0 text-muted transition ${faq === i ? 'rotate-180' : ''}`} />
              </button>
              {faq === i && <p className="pb-2.5 text-[12px] leading-relaxed text-ink-2">{a}</p>}
            </div>
          ))}
        </section>
      </aside>

      {shot !== null && <Lightbox images={v.gallery} index={shot} onIndex={setShot} onClose={() => setShot(null)} />}
      {note && <Dialog title={NOTES[note][0]} onClose={() => setNote(null)}><p className="text-[13px] leading-relaxed text-ink-2">{NOTES[note][1]}</p></Dialog>}
      {profile && (
        <Dialog title={v.speaker.name} onClose={() => setProfile(false)}>
          <div className="flex gap-3">
            <img src={v.speaker.avatar} alt="" className="size-20 rounded-xl object-cover" />
            <div>
              <p className="text-[12px] text-muted">{v.speaker.role}</p>
              <ul className="mt-1 space-y-1">{v.speaker.lines.map((l) => <li key={l} className="flex gap-1.5 text-[12.5px]"><Check className="mt-0.5 size-3.5 text-sea" />{l}</li>)}</ul>
            </div>
          </div>
          <p className="mt-3 text-[12.5px] leading-relaxed text-ink-2">{v.speaker.bio}</p>
        </Dialog>
      )}
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

function Lightbox({ images, index, onIndex, onClose }) {
  const total = images.length
  return (
    <div className="bemor-shade" onClick={onClose}>
      <div className="relative w-[min(860px,100%)]" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} aria-label="Yopish" className="absolute -top-10 right-0 grid size-8 place-items-center rounded-full bg-white"><X className="size-4" /></button>
        <img src={images[index]} alt="" className="max-h-[calc(100dvh/var(--z)-120px)] w-full rounded-2xl object-contain" />
        {index === 0 && <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[12px]"><Play className="size-3.5" /> Seminar videosi treyleri — kadr</p>}
        <div className="mt-2 flex items-center justify-center gap-2">
          {images.map((src, i) => (
            <button key={src} type="button" onClick={() => onIndex(i)} aria-label={`Rasm ${i + 1}`} className={`h-12 w-16 overflow-hidden rounded-lg ${i === index ? 'ring-2 ring-sea' : 'opacity-70'}`}>
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
