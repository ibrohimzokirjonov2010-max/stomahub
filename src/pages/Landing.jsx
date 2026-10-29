import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CONTACT_PHONE, CONTACT_PHONE_TEL, CONTACT_EMAIL, SOCIAL_LINKS } from '../config/contact'
import { useSession } from '../sessionStore'
import { useCrmStats, mln } from '../crmStats'
import { useClinicPayments } from '../tolovData'
import {
  ArrowRight, BarChart3, BookOpen, CalendarDays, CheckCircle2, ChevronDown, Globe, GraduationCap, Home, Mail, MapPin, Megaphone,
  Menu, MessageSquareMore, Phone, Search, ShoppingCart, Users, X, LayoutGrid, Bell, Wallet, FileText, Settings, Package, UserRound, Store,
} from 'lucide-react'
import { payPromo } from '../payments/paymentService'
import { SectionIcons } from '../components/tealIcons'

const T = '#0F766E'
const NAV = [['Marketplace', '/marketplace'], ['Ta’lim', '/talim'], ['Seminarlar', '/seminarlar'], ['Kitoblar', '/kitoblar'], ['Klinika CRM', '/klinika'], ['Ustalar', '/ustalar']]

function Tooth(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7.5 3C5 3 3.5 5 3.5 7.6c0 2.2 1 3.6 1.5 5.4.6 2.3.8 7.9 3 7.9 1.7 0 1.5-5.2 4-5.2s2.3 5.2 4 5.2c2.2 0 2.4-5.6 3-7.9.5-1.8 1.5-3.2 1.5-5.4C20.5 5 19 3 16.5 3c-1.8 0-2.6 1-4.5 1S9.3 3 7.5 3Z" />
    </svg>
  )
}

const FEATURES = [
  [SectionIcons.marketplace, 'Marketplace', 'Stomatologik mahsulotlar, uskuna va materiallar', '/marketplace'],
  [GraduationCap, 'Onlayn darslar', 'Professional kurslar va video darslar', '/talim'],
  [SectionIcons.seminarlar, 'Seminarlar', 'Amaliy seminarlar va master-klasslar', '/seminarlar'],
  [SectionIcons.kitoblar, 'Kitoblar', 'Stomatologiyaga oid kitoblar va qo‘llanmalar', '/kitoblar'],
  [BarChart3, 'Klinika CRM', 'Bemorlar, uchrashuvlar, davolash rejalari, to‘lovlar', '/klinika'],
  [Tooth, 'Ustalar laboratoriyalari', 'Tish texniklari va laboratoriyalar', '/ustalar'],
  [SectionIcons.forum, 'Konsultatsiyalar', 'Hamkasblar bilan maslahat va tajriba almashish', '/community'],
  [Megaphone, 'E’lonlar', 'Ish, hamkorlik va xizmatlar e’lonlari', '/elonlar'],
]
const ROLES = [
  ['stomatolog', 'Stomatolog', 'Amaliyotchi shifokorlar', '/marketplace'],
  ['talaba', 'Talaba', 'Tibbiyot talabalari', '/talim'],
  ['klinika', 'Klinika egasi', 'Klinika rahbarlari', '/klinika'],
  ['texnik', 'Tish texnigi', 'Laboratoriya mutaxassislari', '/ustalar'],
  ['sotuvchi', 'Sotuvchi', 'Mahsulotlar sotuvchilari', '/marketplace'],
]
const CRM = ['Bemorlar kartasi va davolash rejalari', 'Uchrashuvlar va kalendar', 'To‘lovlar va qarzdorliklar', 'Ombor va materiallar', 'Hisobotlar va tahlillar', 'Telegram eslatmalar']
const STEPS = [['Ro‘yxatdan o‘ting', 'Bir necha daqiqada hisob yarating'], ['Kerakli yo‘nalishni tanlang', 'Marketplace, ta’lim yoki Klinika CRM'], ['Imkoniyatlardan foydalaning', 'O‘zingiz va klinikangizni rivojlantiring']]
const APP = ['Marketplace va buyurtmalar', 'Seminarlar va onlayn darslar', 'Uchrashuvlar va kalendar', 'Bemorlar kartasi', 'To‘lovlar va bildirishnomalar', 'Har doim yoningizda']
const FAQ = [
  ['StomaHub’dan foydalanish pullikmi?', 'Ro‘yxatdan o‘tish bepul. Klinika CRM — muddatsiz bepul: bemorlar kartasi, uchrashuvlar kalendari, davolash rejalari va to‘lovlar hisobi uchun pul olinmaydi. Marketplace mahsulotlari, seminarlar va ayrim kurslar alohida narxlanadi.'],
  ['Seminarlarga qanday qatnashish mumkin?', 'Seminarlar sahifasidan kerakli seminarni tanlab, ro‘yxatdan o‘tasiz va elektron chipta olasiz.'],
  ['Klinika CRM’ni bir necha xodim ishlata oladimi?', 'Ha. Klinika egasi shifokor va administratorlarni qo‘shib, ularga alohida kirish beradi.'],
  ['Mahsulotlarni qanday xarid qilish mumkin?', 'Marketplace’da mahsulotni savatga qo‘shing, manzil va to‘lov usulini tanlab buyurtma bering.'],
  ['To‘lovlarni qanday qabul qilish mumkin?', payPromo('Click va Payme orqali onlayn, shuningdek naqd to‘lov qo‘llab-quvvatlanadi.', 'Naqd to‘lov qo‘llab-quvvatlanadi. Onlayn to‘lov tez orada ishga tushadi.')],
  ['Texnik yordam qanday ishlaydi?', CONTACT_PHONE ? `Savol bo‘lsa, ${CONTACT_PHONE} raqamiga qo‘ng‘iroq qiling yoki ${CONTACT_EMAIL} manziliga yozing. Ish vaqti 09:00–21:00.` : `Savol bo‘lsa, ${CONTACT_EMAIL} manziliga yozing. Ish vaqti 09:00–21:00.`],
]

const wrap = 'mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8'
const h2 = 'text-[26px] font-extrabold tracking-tight text-[#0f2438] sm:text-[34px]'
const btn = 'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition'

export default function Landing() {
  const session = useSession()
  const authed = session.status === 'authed'
  const [open, setOpen] = useState(-1)
  const [menu, setMenu] = useState(false)

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-[#17324d]">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-[#edf2f4] bg-white/95 backdrop-blur">
        <div className={`${wrap} flex h-[64px] items-center gap-6 lg:h-[76px]`}>
          <Link to="/" aria-label="StomaHub" className="shrink-0"><img src="/images/landing/logo-mark.png" alt="StomaHub" className="h-8 w-auto lg:h-[42px]" /></Link>
          <nav className="mx-auto hidden items-center gap-8 lg:flex">
            {NAV.map(([l, to]) => <Link key={to} to={to} className="text-[15px] font-medium text-[#24384d] hover:text-[#0F766E]">{l}</Link>)}
          </nav>
          <div className="ml-auto flex items-center gap-2 lg:ml-0 lg:gap-3">
            <Link to="/marketplace" aria-label="Qidirish" className="grid size-10 place-items-center rounded-full text-[#24384d] hover:bg-[#eef7f5] lg:size-11"><Search className="size-5" /></Link>
            <Link to={authed ? '/klinika' : '/kirish'} className={`${btn} max-sm:hidden h-11 border border-[#0F766E] px-6 text-[15px] text-[#0F766E] hover:bg-[#eef7f5] sm:inline-flex`}>{authed ? 'Kabinet' : 'Kirish'}</Link>
            <Link to="/royxat" className={`${btn} max-sm:hidden h-11 bg-[#0F766E] px-6 text-[15px] text-white hover:bg-[#0b5f59] sm:inline-flex`}>Ro‘yxatdan o‘tish</Link>
            <button type="button" aria-label="Menyu" onClick={() => setMenu(true)} className="grid size-10 place-items-center rounded-xl border border-[#e2ebee] lg:hidden"><Menu className="size-5" /></button>
          </div>
        </div>
      </header>
      {menu && (
        <div className="fixed inset-0 z-50 bg-black/30 lg:hidden" onClick={() => setMenu(false)}>
          <div className="ml-auto flex h-full w-[82%] max-w-[340px] flex-col bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><img src="/images/landing/logo-mark.png" alt="StomaHub" className="h-8" /><button type="button" aria-label="Yopish" onClick={() => setMenu(false)} className="grid size-10 place-items-center rounded-xl border border-[#e2ebee]"><X className="size-5" /></button></div>
            <nav className="mt-6 flex flex-col">
              {NAV.map(([l, to]) => <Link key={to} to={to} className="border-b border-[#eef3f5] py-3.5 text-[16px] font-medium">{l}</Link>)}
            </nav>
            <div className="mt-auto grid gap-2.5">
              <Link to={authed ? '/klinika' : '/kirish'} className={`${btn} h-12 border border-[#0F766E] text-[#0F766E]`}>{authed ? 'Kabinet' : 'Kirish'}</Link>
              <Link to="/royxat" className={`${btn} h-12 bg-[#0F766E] text-white`}>Ro‘yxatdan o‘tish</Link>
            </div>
          </div>
        </div>
      )}

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#f3faf9]">
        <img src="/images/landing/hero-clinic-bg.jpg" alt="" aria-hidden className="pointer-events-none absolute inset-0 size-full object-cover object-[70%_50%] opacity-90" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,.96)_0%,rgba(255,255,255,.85)_34%,rgba(255,255,255,.2)_62%,rgba(255,255,255,0)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-white/75 lg:hidden" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,#fff)]" />
        <div className={`${wrap} relative grid items-center gap-6 pb-10 pt-8 lg:grid-cols-[1.05fr_1fr] lg:pb-0 lg:pt-10`}>
          <div className="lg:pb-14">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#d9ebe8] bg-white/90 px-3 py-1.5 text-[12.5px] font-medium text-[#24384d] sm:text-[13.5px]">
              <span className="grid size-6 place-items-center rounded-full bg-[#e3f3f0] text-[#0F766E]"><Tooth className="size-3.5" /></span>Stomatologlar uchun yagona platforma
            </span>
            <h1 className="mt-5 text-[36px] font-extrabold leading-[1.08] tracking-tight text-[#0f2438] sm:text-[48px] xl:text-[56px]">Stomatologlar uchun <span className="text-[#0F766E]">yagona platforma</span></h1>
            <p className="mt-5 max-w-[440px] text-[16px] leading-relaxed text-[#3d5168] sm:text-[21px]">Do‘kon, ta’lim, seminarlar va klinika boshqaruvi bir joyda. Stomatologlar uchun zamonaviy ekotizim.</p>
            <div className="mt-7 grid grid-cols-1 gap-3 sm:flex">
              <Link to="/royxat" className={`${btn} h-14 bg-[#0F766E] px-9 text-[16px] text-white shadow-[0_10px_24px_rgb(15_118_110/0.25)] hover:bg-[#0b5f59]`}>Boshlash <ArrowRight className="size-5" /></Link>
              <Link to="/marketplace" className={`${btn} h-14 border border-[#0F766E] bg-white px-8 text-[16px] text-[#0F766E] hover:bg-[#eef7f5]`}><ShoppingCart className="size-5" /> Marketplace’ni ko‘rish</Link>
            </div>
            <ul className="mt-8 grid grid-cols-3 gap-3 sm:max-w-[560px]">
              {[[Tooth, 'Barcha imkoniyatlar bir joyda'], [Globe, 'O‘rtoqlashish oson uchun mos'], [Users, 'Professional hamjamiyat']].map(([I, t]) => (
                <li key={t} className="flex flex-col items-start gap-2 text-[12px] leading-snug text-[#3d5168] sm:flex-row sm:items-center sm:text-[13.5px]"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#e3f3f0] text-[#0F766E]"><I className="size-5" /></span>{t}</li>
              ))}
            </ul>
          </div>
          <div className="relative mx-auto h-[470px] w-full max-w-[580px] sm:h-[580px] lg:h-[600px]">
            <img src="/images/landing/hero-doctor-cut.webp" alt="Stomatolog" className="absolute bottom-0 left-[-4%] h-[86%] w-auto sm:left-[2%] sm:h-[94%] max-w-none object-contain object-bottom [mask-image:linear-gradient(180deg,#000_88%,transparent)]" />
            <div className="absolute right-[-2%] top-[3%] z-10 w-[165px] [zoom:1.1] sm:w-[220px] sm:[zoom:1.4] lg:right-[-6%]"><PhoneHome tall /></div>
            <span className="absolute bottom-[4%] right-[-10px] z-20 hidden size-14 place-items-center rounded-2xl bg-[#0F766E] text-white shadow-lg sm:grid lg:right-[-36px]"><Tooth className="size-7" /></span>
          </div>
        </div>
      </section>

      {/* NIMALAR BOR */}
      <section className={`${wrap} py-10 lg:py-12`}>
        <h2 className={h2}>Nimalar bor?</h2>
        <p className="mt-2 text-[15px] text-[#5c6e80] sm:text-[16px]">Stomatologlar uchun kerakli barcha imkoniyatlar bir joyda</p>
        <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {FEATURES.map(([I, t, d, to]) => (
            <Link key={t} to={to} className="group rounded-2xl border border-[#e8eff1] bg-white p-4 shadow-[0_6px_20px_rgb(16_40_50/0.04)] transition hover:-translate-y-0.5 hover:border-[#b9dfd9] sm:p-5">
              <span className="grid size-12 place-items-center rounded-2xl bg-[#e6f4f1] text-[#0F766E] sm:size-14"><I className={I.raster ? 'size-10 sm:size-12' : 'size-7 sm:size-8'} strokeWidth={2} /></span>
              <b className="mt-4 block text-[15px] text-[#0f2438] sm:text-[17px]">{t}</b>
              <p className="mt-1.5 text-[12.5px] leading-snug text-[#5c6e80] sm:text-[14.5px]">{d}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* KIMLAR UCHUN */}
      <section className={`${wrap} pb-10 lg:pb-10`}>
        <h2 className={h2}>Kimlar uchun?</h2>
        <p className="mt-2 text-[15px] text-[#5c6e80] sm:text-[16px]">StomaHub barcha stomatologiya sohasidagi mutaxassislar uchun</p>
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5">
          {ROLES.map(([img, t, d, to], i) => (
            <Link key={t} to={to} className={`overflow-hidden rounded-2xl border bg-white transition hover:border-[#0F766E] ${i === 0 ? 'border-[#0F766E]/60' : 'border-[#e8eff1]'} ${i === 4 ? 'col-span-2 sm:col-span-1' : ''}`}>
              <div className="relative h-[150px] overflow-hidden bg-[linear-gradient(180deg,#eef8f6,#e2f2ee)] sm:h-[170px]">
                <span className="absolute left-1/2 top-[14%] aspect-square w-[84%] -translate-x-1/2 rounded-full bg-white/70" />
                <img src={`/images/landing/role-${img}.webp`} alt={t} className="absolute bottom-0 left-1/2 h-[94%] w-auto max-w-none -translate-x-1/2 object-contain object-bottom" />
              </div>
              <div className="flex items-center justify-between gap-2 px-4 py-3.5">
                <div><b className="block text-[15px] text-[#0f2438] sm:text-[16px]">{t}</b><p className="mt-0.5 text-[12.5px] text-[#5c6e80]">{d}</p></div>
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#e6f4f1] text-[#0F766E]"><ArrowRight className="size-4" /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CRM */}
      <section className="bg-[linear-gradient(180deg,#ffffff_0%,#f2faf8_100%)] py-10 lg:py-12">
        <div className={`${wrap} grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr]`}>
          <div>
            <h2 className={h2}>Klinika CRM</h2>
            <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#e6f4f1] px-3 py-1.5 text-[13.5px] font-medium text-[#24384d]"><Tooth className="size-4 text-[#0F766E]" /> Klinikangizni to‘liq nazorat qiling</span>
            <p className="mt-4 text-[15px] leading-relaxed text-[#3d5168] sm:text-[16px]">Bemorlar, uchrashuvlar, davolash rejalari, to‘lovlar va hisobotlar — barchasi bir joyda. Klinika jarayonlarini soddalashtiring va samaradorlikni oshiring.</p>
            <ul className="mt-5 space-y-3">{CRM.map((t) => <li key={t} className="flex items-center gap-3 text-[15px] text-[#24384d]"><CheckCircle2 className="size-5 shrink-0 fill-[#0F766E] text-white" /> {t}</li>)}</ul>
            <Link to="/klinika" className={`${btn} mt-7 h-14 w-full bg-[#0F766E] px-8 text-[16px] text-white hover:bg-[#0b5f59] sm:w-auto`}>CRM imkoniyatlarini ko‘rish <ArrowRight className="size-5" /></Link>
          </div>
          <CrmDash />
        </div>
      </section>

      {/* QANDAY ISHLAYDI */}
      <section className={`${wrap} py-10 lg:py-12`}>
        <h2 className={h2}>Qanday ishlaydi?</h2>
        <p className="mt-2 text-[15px] text-[#5c6e80] sm:text-[16px]">StomaHub’da boshlash juda oson</p>
        <div className="mt-7 grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center md:gap-4">
          {STEPS.map(([t, d], i) => (
            <div key={t} className="contents">
              <Link to={['/royxat', '/marketplace', '/klinika'][i]} className="flex items-center gap-4 rounded-2xl border border-[#e8eff1] bg-white p-5 hover:border-[#b9dfd9]">
                <span className="grid size-14 shrink-0 place-items-center rounded-full bg-[#e6f4f1]"><span className="grid size-10 place-items-center rounded-full bg-[#0F766E] text-[17px] font-bold text-white">{i + 1}</span></span>
                <div><b className="block text-[16px] text-[#0f2438]">{t}</b><p className="mt-1 text-[14px] leading-snug text-[#5c6e80]">{d}</p></div>
              </Link>
              {i < 2 && <ArrowRight className="mx-auto hidden size-5 text-[#0F766E] md:block" />}
            </div>
          ))}
        </div>
      </section>

      {/* MOBILE APP */}
      <section className="bg-[linear-gradient(180deg,#ffffff_0%,#eef8f6_100%)] py-8 lg:py-10">
        <div className={`${wrap} grid items-center gap-8 lg:grid-cols-[1fr_1.05fr_0.8fr]`}>
          <div>
            <h2 className={h2}>Har doim yoningizda</h2>
            <p className="mt-3 max-w-[420px] text-[15px] leading-relaxed text-[#3d5168] sm:text-[16px]">StomaHub mobil ilovasi bilan barcha imkoniyatlar telefoningizda. Istalgan vaqtda, istalgan joyda.</p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:flex">
              <StoreBadge kind="apple" /><StoreBadge kind="google" />
            </div>
          </div>
          <div className="relative mx-auto flex h-[380px] w-full max-w-[460px] items-start justify-center sm:h-[430px]">
            <div className="absolute left-[4%] top-0 z-10 w-[50%]"><PhoneHome compact /></div>
            <div className="absolute right-[4%] top-2 w-[46%]"><PhoneCats /></div>
          </div>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">{APP.map((t) => <li key={t} className="flex items-center gap-3 text-[15px] text-[#24384d]"><CheckCircle2 className="size-5 shrink-0 fill-[#0F766E] text-white" /> {t}</li>)}</ul>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className={`${wrap} py-12 lg:py-14`}>
        <h2 className={h2}>Ko‘p so‘raladigan savollar</h2>
        <div className="mt-6 grid items-start gap-3 lg:grid-cols-2 lg:gap-x-6">
          {[0, 1].map((col) => (
            <div key={col} className="grid gap-3">
              {FAQ.map((f, i) => [f, i]).filter(([, i]) => i % 2 === col).map(([[q, a], i]) => (
                <div key={q} className="rounded-xl border border-[#e6eef1] bg-white">
                  <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-medium text-[#24384d]">
                    {q}<ChevronDown className={`size-5 shrink-0 text-[#5c6e80] transition ${open === i ? 'rotate-180 text-[#0F766E]' : ''}`} />
                  </button>
                  {open === i && <p className="px-5 pb-4 text-[14.5px] leading-relaxed text-[#5c6e80]">{a}</p>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className={`${wrap} pb-12`}>
        <div className="flex flex-col items-start gap-5 rounded-2xl border border-[#d8ece8] bg-[#ecf7f5] p-6 sm:flex-row sm:items-center sm:px-10 sm:py-8">
          <Tooth className="size-14 shrink-0 text-[#0F766E] sm:size-16" strokeWidth={1.6} />
          <div className="flex-1">
            <h2 className="text-[22px] font-extrabold tracking-tight text-[#0F766E] sm:text-[26px]">Stomatologlar hamjamiyatiga qo‘shiling</h2>
            <p className="mt-1.5 text-[14.5px] text-[#3d5168] sm:text-[15.5px]">Kasbiy o‘sish, yangi imkoniyatlar va ishonchli hamkorlar — barchasi StomaHub’da.</p>
          </div>
          <Link to="/royxat" className={`${btn} h-14 w-full shrink-0 bg-[#0F766E] px-8 text-[16px] text-white hover:bg-[#0b5f59] sm:w-auto`}>Bepul ro‘yxatdan o‘tish <ArrowRight className="size-5" /></Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#edf2f4]">
        <div className={`${wrap} grid grid-cols-2 gap-8 py-10 md:grid-cols-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.1fr_0.8fr]`}>
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <img src="/images/landing/logo-mark.png" alt="StomaHub" className="h-10 w-auto" />
            <p className="mt-3 max-w-[220px] text-[13px] leading-relaxed text-[#5c6e80]">O‘zbekiston stomatologlari uchun yagona platforma.</p>
            <div className="mt-5 flex gap-2.5">
              {[['Telegram', SOCIAL_LINKS.Telegram, 'M21.9 4.6 18.7 19.4c-.2 1-.9 1.3-1.7.8l-4.8-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.9 8.9-8c.4-.3-.1-.5-.6-.2L6.5 13.2l-4.7-1.5c-1-.3-1-1 .2-1.5L20.5 3.1c.9-.3 1.6.2 1.4 1.5Z'], ['Instagram', SOCIAL_LINKS.Instagram, null], ['YouTube', SOCIAL_LINKS.YouTube, null], ['LinkedIn', SOCIAL_LINKS.LinkedIn, null]].filter(([, href]) => href).map(([n, href, d]) => (
                <a key={n} href={href} target="_blank" rel="noreferrer" aria-label={n} className="grid size-10 place-items-center rounded-full bg-[#e6f4f1] text-[#0F766E] hover:bg-[#d4ece8]">
                  <Social n={n} d={d} />
                </a>
              ))}
            </div>
          </div>
          <Foot title="Platforma" links={[['Marketplace', '/marketplace'], ['Ta’lim', '/talim'], ['Seminarlar', '/seminarlar'], ['Kitoblar', '/kitoblar'], ['Ustalar', '/ustalar']]} />
          <Foot title="Klinika uchun" links={[['Klinika CRM', '/klinika'], ['Ustalar laboratoriyalari', '/ustalar'], ['Konsultatsiyalar', '/community'], ['E’lonlar', '/elonlar']]} />
          <Foot title="Yordam" links={[['Savol-javob', '#faq'], ['Foydalanish shartlari', '/foydalanish-shartlari'], ['Maxfiylik siyosati', '/maxfiylik'], ['Sayt xaritasi', '/kategoriyalar']]} />
          <div>
            <p className="text-[14px] font-bold text-[#0f2438]">Aloqa</p>
            {CONTACT_PHONE && <a href={CONTACT_PHONE_TEL} className="mt-3 flex items-center gap-2 text-[13.5px] text-[#3d5168]"><Phone className="size-4 text-[#0F766E]" /> {CONTACT_PHONE}</a>}
            <a href="mailto:info@stomahub.uz" className="mt-2.5 flex items-center gap-2 text-[13.5px] text-[#3d5168]"><Mail className="size-4 text-[#0F766E]" /> info@stomahub.uz</a>
            <p className="mt-2.5 flex items-center gap-2 text-[13.5px] text-[#3d5168]"><MapPin className="size-4 text-[#0F766E]" /> Toshkent, O‘zbekiston</p>
          </div>
          <div>
            <p className="text-[14px] font-bold text-[#0f2438]">To‘lov usullari</p>
            <div className="mt-3 flex items-center gap-1.5 text-[17px] font-extrabold tracking-tight text-[#1c2b3a]"><span className="grid size-6 place-items-center rounded-full bg-[conic-gradient(#00aeef_0_25%,#7ac143_0_50%,#fbb040_0_75%,#ee3d6d_0)]"><span className="size-2.5 rounded-full bg-white" /></span>CLICK</div>
            <div className="mt-3 text-[22px] font-extrabold leading-none tracking-tight"><span className="text-[#1c2b3a]">Pay</span><span className="text-[#33cccc] underline decoration-[#33cccc] decoration-2 underline-offset-4">me</span></div>
          </div>
        </div>
        <div className={`${wrap} flex items-center justify-between border-t border-[#edf2f4] py-5 text-[13px] text-[#5c6e80]`}>
          <span>© 2026 StomaHub. Barcha huquqlar himoyalangan.</span>
          <span className="flex items-center gap-2"><Globe className="size-4" /> O‘zbekcha <ChevronDown className="size-4" /></span>
        </div>
      </footer>
    </div>
  )
}

function Social({ n, d }) {
  if (d) return <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor"><path d={d} /></svg>
  if (n === 'Instagram') return <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
  if (n === 'YouTube') return <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor"><path d="M22 8.2c-.2-1.6-1-2.6-2.6-2.8C17.2 5 12 5 12 5s-5.2 0-7.4.4C3 5.6 2.2 6.6 2 8.2 1.8 9.4 1.8 12 1.8 12s0 2.6.2 3.8c.2 1.6 1 2.6 2.6 2.8 2.2.4 7.4.4 7.4.4s5.2 0 7.4-.4c1.6-.2 2.4-1.2 2.6-2.8.2-1.2.2-3.8.2-3.8s0-2.6-.2-3.8ZM10 15V9l5.2 3L10 15Z" /></svg>
  return <svg viewBox="0 0 24 24" className="size-[17px]" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.5h4V21H3V9.5Zm6.5 0h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.2c0-1.3 0-2.9-1.8-2.9s-2 1.4-2 2.8V21h-4V9.5Z" /></svg>
}

function Foot({ title, links }) {
  return (
    <div>
      <p className="text-[14px] font-bold text-[#0f2438]">{title}</p>
      <div className="mt-3 flex flex-col gap-2">{links.map(([l, to]) => (to.startsWith('#') ? <a key={l} href={to} className="text-[13.5px] text-[#3d5168] hover:text-[#0F766E]">{l}</a> : <Link key={l} to={to} className="text-[13.5px] text-[#3d5168] hover:text-[#0F766E]">{l}</Link>))}</div>
    </div>
  )
}

function StoreBadge({ kind }) {
  const apple = kind === 'apple'
  return (
    <a href={apple ? 'https://apps.apple.com/' : 'https://play.google.com/store'} target="_blank" rel="noreferrer" className="inline-flex h-14 items-center gap-3 whitespace-nowrap rounded-xl bg-[#0b0f14] px-4 text-white sm:px-5">
      {apple ? <svg viewBox="0 0 24 24" className="size-7" fill="currentColor"><path d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.8 1.2 1.8 2.6 3.1 2.6 1.3-.1 1.7-.8 3.3-.8 1.5 0 1.9.8 3.3.8 1.4 0 2.2-1.2 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.5-1-2.5-4.1ZM13.9 5c.7-.9 1.2-2 1-3.2-1 0-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.5Z" /></svg>
        : <svg viewBox="0 0 24 24" className="size-7"><path fill="#00d7fe" d="M3.6 2.3 13.4 12 3.6 21.7c-.4-.2-.6-.6-.6-1.1V3.4c0-.5.2-.9.6-1.1Z" /><path fill="#ffce00" d="m16.7 15.3-3.3-3.3 3.3-3.3 3.8 2.2c1 .6 1 1.6 0 2.2l-3.8 2.2Z" /><path fill="#ff3a44" d="M16.7 15.3 13.4 12l-9.8 9.7c.4.2.9.2 1.4-.1l11.7-6.3Z" /><path fill="#00f076" d="M16.7 8.7 5 2.4c-.5-.3-1-.3-1.4-.1L13.4 12l3.3-3.3Z" /></svg>}
      <span className="text-left text-[13px] font-semibold leading-tight sm:text-[14px]">{apple ? 'App Store’dan' : 'Google Play’dan'}<br />yuklab oling</span>
    </a>
  )
}

function Frame({ children }) {
  return (
    <div className="rounded-[34px] bg-[#111827] p-[7px] shadow-[0_24px_50px_rgb(15_40_50/0.25)]">
      <div className="relative overflow-hidden rounded-[28px] bg-white">
        <div className="absolute left-1/2 top-1.5 z-10 h-4 w-16 -translate-x-1/2 rounded-full bg-[#111827]" />
        <div className="flex items-center justify-between px-4 pt-1.5 text-[9px] font-semibold"><span>9:41</span><span>●●●</span></div>
        {children}
      </div>
    </div>
  )
}

function PhoneHome({ compact = false, tall = false }) {
  const session = useSession()
  const firstName = (() => {
    if (session.status !== 'authed') return ''
    const parts = String(session.profile?.full_name || session.profile?.name || session.profile?.fullName || session.user?.user_metadata?.name || '').trim().split(/\s+/).filter(Boolean)
    if (!parts.length) return ''
    // Uzbek «Familiya Ism» → greet with Ism
    return parts.length >= 2 ? parts[1] : parts[0]
  })()
  return (
    <Frame>
      <div className="px-3 pb-2 pt-3">
        <div className="flex items-center justify-between"><img src="/images/landing/logo-mark.png" alt="" className="h-5" /><Bell className="size-3.5 text-[#24384d]" /></div>
        {firstName && <p className="mt-1.5 text-[10px] font-bold text-[#0f2438]">Salom, {firstName}</p>}
        <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-[#f1f5f6] px-2 py-1.5 text-[8.5px] text-[#8aa0a8]"><Search className="size-3" /> Nima qidiryapsiz?</div>
        <div className="mt-2.5 grid grid-cols-4 gap-1 text-center text-[7.5px] text-[#3d5168]">
          {[[Package, 'Materiallar'], [Tooth, 'Implantlar'], [Settings, 'Uchliklar'], [LayoutGrid, 'Jihozlar']].map(([I, t]) => <span key={t}><span className="mx-auto mb-1 grid size-7 place-items-center rounded-lg bg-[#e6f4f1] text-[#0F766E]"><I className="size-3.5" /></span>{t}</span>)}
        </div>
        <div className="mt-2.5 flex items-center justify-between rounded-xl bg-[linear-gradient(120deg,#0F766E,#14a092)] p-2.5 text-white"><b className="text-[10px] leading-tight">Stomatologlar uchun<br />yagona platforma</b><Tooth className="size-7 opacity-90" /></div>
        <div className="mt-2.5 flex justify-between text-[8.5px]"><b>Ommabop kategoriyalar</b><span className="text-[#0F766E]">Barchasi →</span></div>
        <div className="mt-1.5 grid grid-cols-3 gap-1">
          {['/images/cat-1.jpg', '/images/cat-2.jpg', '/images/cat-3.jpg'].map((s, i) => <div key={s} className="overflow-hidden rounded-lg bg-[#f1f5f6]"><img src={s} alt="" className={`${compact ? 'h-9' : 'h-11'} w-full object-cover`} /><p className="px-1 py-0.5 text-[7px] font-semibold">{['Dental materiallar', 'Implantlar', 'Uchliklar'][i]}</p></div>)}
        </div>
        {tall && <><div className="mt-2.5 flex justify-between text-[8.5px]"><b>Yaqin seminarlar</b><span className="text-[#0F766E]">Barchasi →</span></div>
        <div className="mt-1.5 flex items-center gap-2 rounded-lg bg-[#f7fafa] p-1.5"><span className="grid size-8 place-items-center rounded-md bg-[#e6f4f1] text-[#0F766E]"><CalendarDays className="size-4" /></span><span className="text-[7.5px] leading-tight"><b className="block text-[8px]">Seminarlar va kurslar</b><span className="text-[#8aa0a8]">Taqvimni ko‘rish</span></span></div></>}
      </div>
      <div className="flex justify-around border-t border-[#eef3f5] py-1.5 text-[7px] text-[#5c6e80]">
        {[[Home, 'Bosh sahifa'], [Store, 'Do‘kon'], [CalendarDays, 'Seminarlar'], [Tooth, 'Ustalar'], [UserRound, 'Profil']].map(([I, t], i) => <span key={t} className={`flex flex-col items-center ${i === 0 ? 'text-[#0F766E]' : ''}`}><I className="size-3" />{t}</span>)}
      </div>
    </Frame>
  )
}

function PhoneCats() {
  return (
    <Frame>
      <div className="px-3 pb-4 pt-3">
        <p className="text-center text-[10px] font-bold">Kategoriyalar</p>
        <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-[#f1f5f6] px-2 py-1.5 text-[8.5px] text-[#8aa0a8]"><Search className="size-3" /> Qidirish</div>
        <div className="mt-2 flex gap-1">{[Package, Tooth, Settings, LayoutGrid, FileText].map((I, i) => <span key={i} className={`grid size-6 place-items-center rounded-md ${i === 3 ? 'bg-[#0F766E] text-white' : 'bg-[#e6f4f1] text-[#0F766E]'}`}><I className="size-3" /></span>)}</div>
        <div className="mt-2 space-y-0">{['Terapevtik stomatologiya', 'Endodontiya', 'Ortodontiya', 'Ortopediya', 'Jarrohlik', 'Dental jihozlar', 'Forma'].map((t) => <p key={t} className="flex justify-between border-b border-[#eef3f5] py-[7px] text-[8.5px]">{t}<span className="text-[#8aa0a8]">›</span></p>)}</div>
      </div>
    </Frame>
  )
}

function isoDay(d) {
  const s = String(d || '')
  const m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})/)
  return m ? `${m[3]}-${m[2]}-${m[1]}` : s.slice(0, 10)
}

function CrmDash() {
  // Faqat haqiqiy ma’lumot (crmStats). Kirilmagan bo‘lsa — nollar va bo‘sh holat, hech qanday soxta raqam yo‘q.
  const session = useSession()
  const authed = session.status === 'authed'
  const crm = useCrmStats()
  const payments = useClinicPayments()
  const months = []
  const now = new Date(`${crm.today}T00:00:00`)
  for (let k = 11; k >= 0; k -= 1) { const d = new Date(now.getFullYear(), now.getMonth() - k, 1); months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`) }
  const sums = months.map((m) => (authed ? payments.filter((r) => r && r.status !== 'Qaytarilgan' && isoDay(r.date).slice(0, 7) === m).reduce((a, r) => a + (Number(r.amount) || 0), 0) : 0))
  const max = Math.max(...sums, 1)
  const pts = sums.map((v) => 8 + (v / max) * 64)
  const path = pts.map((v, i) => `${i ? 'L' : 'M'}${(i / (pts.length - 1)) * 100} ${80 - v}`).join(' ')
  const visits = authed ? crm.todayVisits.slice(0, 4) : []
  const stats = [[Users, 'Bugungi qabul', String(authed ? crm.todayAppointments : 0)], [Wallet, 'To‘lovlar', String(authed ? crm.paymentsCount : 0)], [CalendarDays, 'Oylik tushum', mln(authed ? crm.revenueMonth : 0)], [BarChart3, 'Jami tushum', mln(authed ? crm.revenueTotal : 0)]]
  const MN = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']
  return (
    <div className="relative rounded-[26px] bg-[#e4f2ef]/80 p-2 shadow-[0_30px_60px_rgb(16_40_50/0.08)] sm:p-4">
      <div className="overflow-hidden rounded-2xl border border-[#e3ecee] bg-white shadow-[0_20px_50px_rgb(16_40_50/0.10)]">
        <div className="flex items-center gap-3 border-b border-[#eef3f5] px-4 py-2.5">
          <img src="/images/landing/logo-mark.png" alt="" className="h-5" />
          <span className="mx-auto hidden w-[46%] items-center gap-1.5 rounded-lg bg-[#f3f6f7] px-2.5 py-1.5 text-[10px] text-[#8aa0a8] sm:flex"><Search className="size-3" /> Bemorlarni qidirish</span>
          <span className="ml-auto flex items-center gap-2 text-[10px] text-[#5c6e80]"><Bell className="size-3.5" /><span className="grid size-6 place-items-center rounded-full bg-[#e6f4f1] text-[#0F766E]"><UserRound className="size-3.5" /></span></span>
        </div>
        <div className="grid grid-cols-[auto_1fr]">
          <aside className="hidden w-[130px] space-y-0.5 border-r border-[#eef3f5] p-2 text-[10px] text-[#5c6e80] sm:block">
            {[[LayoutGrid, 'Bosh panel'], [CalendarDays, 'Uchrashuvlar'], [Users, 'Bemorlar'], [FileText, 'Davolash rejalari'], [Wallet, 'To‘lovlar'], [Package, 'Ombor va material'], [BarChart3, 'Hisobotlar'], [Settings, 'Sozlamalar']].map(([I, t], i) => <p key={t} className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 ${i === 0 ? 'bg-[#0F766E] text-white' : ''}`}><I className="size-3" />{t}</p>)}
          </aside>
          <div className="min-w-0 p-3">
            <b className="text-[12px]">Bosh sahifa</b>
            <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {stats.map(([I, t, v]) => <div key={t} className="flex items-center gap-2 rounded-lg border border-[#eef3f5] p-1.5"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#e6f4f1] text-[#0F766E]"><I className="size-3.5" /></span><span className="min-w-0"><p className="truncate text-[8.5px] text-[#5c6e80]">{t}</p><b className="text-[10.5px]">{v}</b></span></div>)}
            </div>
            <div className="mt-2 grid grid-cols-[1.6fr_1fr] gap-1.5">
              <div className="rounded-lg border border-[#eef3f5] p-2">
                <p className="flex justify-between text-[9.5px] font-semibold">Bugungi uchrashuvlar<span className="text-[#0F766E]">Barchasi →</span></p>
                {visits.length ? visits.map((v) => <p key={v.id} className="mt-1 flex items-center gap-1.5 rounded-md bg-[#f7fafa] px-1.5 py-1 text-[8.5px]">{v.photo ? <img src={v.photo} alt="" className="size-4 rounded-full object-cover" /> : <UserRound className="size-4 text-[#8aa0a8]" />}<span className="flex-1 truncate">{v.name}</span><span className="text-[#8aa0a8]">{v.service}</span></p>)
                  : <p className="mt-3 flex flex-col items-center gap-1 py-3 text-center text-[9px] text-[#8aa0a8]"><CalendarDays className="size-5 text-[#b9cfd0]" />Bugun hali qabul yo‘q</p>}
              </div>
              <div className="rounded-lg border border-[#eef3f5] p-2 text-[8.5px]">
                <p className="text-[9.5px] font-semibold">Amallar</p>
                {['Yangi bemor', 'Yangi uchrashuv', 'To‘lov qo‘shish', 'Hisobot'].map((t) => <p key={t} className="mt-1.5 flex items-center gap-1"><CheckCircle2 className="size-3 text-[#0F766E]" />{t}</p>)}
              </div>
            </div>
            <div className="mt-2 rounded-lg border border-[#eef3f5] p-2">
              <p className="flex items-center justify-between text-[9.5px] font-semibold">Daromad dinamikasi<span className="flex items-center gap-2"><span className="rounded border border-[#e3ecee] px-1.5 py-0.5 font-normal text-[#5c6e80]">Oy / Yil</span><span className="text-[#0F766E]">Barchasi →</span></span></p>
              <div className="mt-1 grid grid-cols-[auto_1fr] gap-1">
                <div className="flex h-20 flex-col justify-between text-[7px] text-[#8aa0a8]">{[1, 0.66, 0.33, 0].map((f) => <span key={f}>{mln(authed ? max * f : 0).replace(' mln', '')}</span>)}</div>
                <svg viewBox="0 0 100 82" preserveAspectRatio="none" className="h-20 w-full"><defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#0F766E" stopOpacity=".25" /><stop offset="1" stopColor="#0F766E" stopOpacity="0" /></linearGradient></defs>{[2, 28, 54, 80].map((y) => <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="#eef3f5" strokeWidth=".6" vectorEffect="non-scaling-stroke" />)}<path d={`${path} L100 82 L0 82Z`} fill="url(#g)" /><path d={path} fill="none" stroke="#0F766E" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />{pts.map((v, i) => <circle key={i} cx={(i / (pts.length - 1)) * 100} cy={80 - v} r="1.1" fill="#0F766E" />)}</svg>
              </div>
              <div className="ml-5 flex justify-between text-[7px] text-[#8aa0a8]">{months.map((m) => <span key={m}>{MN[Number(m.slice(5)) - 1]}</span>)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
