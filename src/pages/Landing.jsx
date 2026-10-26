import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CONTACT_PHONE, CONTACT_PHONE_TEL } from '../config/contact'
import { useSession } from '../sessionStore'
import {
  ArrowRight, BarChart3, BookOpen, CalendarDays, CheckCircle2, ChevronDown, Globe, GraduationCap, Home, Mail, MapPin, Megaphone,
  Menu, MessageSquareMore, Phone, Search, ShoppingCart, Users, X, LayoutGrid, Bell, Wallet, FileText, Settings, Package, UserRound, Store,
} from 'lucide-react'

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
  [ShoppingCart, 'Marketplace', 'Stomatologik mahsulotlar, uskuna va materiallar', '/marketplace'],
  [GraduationCap, 'Onlayn darslar', 'Professional kurslar va video darslar', '/talim'],
  [CalendarDays, 'Seminarlar', 'Amaliy seminarlar va master-klasslar', '/seminarlar'],
  [BookOpen, 'Kitoblar', 'Stomatologiyaga oid kitoblar va qo‘llanmalar', '/kitoblar'],
  [BarChart3, 'Klinika CRM', 'Bemorlar, uchrashuvlar, davolash rejalari, to‘lovlar', '/klinika'],
  [Tooth, 'Ustalar laboratoriyalari', 'Tish texniklari va laboratoriyalar', '/ustalar'],
  [MessageSquareMore, 'Konsultatsiyalar', 'Hamkasblar bilan maslahat va tajriba almashish', '/community'],
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
  ['StomaHub’dan foydalanish pullikmi?', 'Ro‘yxatdan o‘tish va asosiy bo‘limlar bepul. Marketplace mahsulotlari, seminarlar va ayrim kurslar alohida narxlanadi.'],
  ['Seminarlarga qanday qatnashish mumkin?', 'Seminarlar sahifasidan kerakli seminarni tanlab, ro‘yxatdan o‘tasiz va elektron chipta olasiz.'],
  ['Klinika CRM’ni bir necha xodim ishlata oladimi?', 'Ha. Klinika egasi shifokor va administratorlarni qo‘shib, ularga alohida kirish beradi.'],
  ['Mahsulotlarni qanday xarid qilish mumkin?', 'Marketplace’da mahsulotni savatga qo‘shing, manzil va to‘lov usulini tanlab buyurtma bering.'],
  ['To‘lovlarni qanday qabul qilish mumkin?', 'Click va Payme orqali onlayn, shuningdek naqd to‘lov qo‘llab-quvvatlanadi.'],
  ['Texnik yordam qanday ishlaydi?', `Savol bo‘lsa, ${CONTACT_PHONE} raqamiga qo‘ng‘iroq qiling yoki info@stomahub.uz manziliga yozing. Ish vaqti 09:00–21:00.`],
]

const wrap = 'mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8'
const h2 = 'text-[26px] font-extrabold tracking-tight text-[#0f2438] sm:text-[34px]'
const btn = 'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition'

export default function Landing() {
  const session = useSession()
  const authed = session.status === 'authed'
  const [open, setOpen] = useState(0)
  const [menu, setMenu] = useState(false)

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-[#17324d]">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-[#edf2f4] bg-white/95 backdrop-blur">
        <div className={`${wrap} flex h-[64px] items-center gap-6 lg:h-[76px]`}>
          <Link to="/" aria-label="StomaHub" className="shrink-0"><img src="/images/landing/logo.png" alt="StomaHub" className="h-8 w-auto lg:h-10" /></Link>
          <nav className="mx-auto hidden items-center gap-8 lg:flex">
            {NAV.map(([l, to]) => <Link key={to} to={to} className="text-[15px] font-medium text-[#24384d] hover:text-[#0F766E]">{l}</Link>)}
          </nav>
          <div className="ml-auto flex items-center gap-2 lg:ml-0 lg:gap-3">
            <Link to="/marketplace" aria-label="Qidirish" className="grid size-10 place-items-center rounded-full text-[#24384d] hover:bg-[#eef7f5] lg:size-11"><Search className="size-5" /></Link>
            <Link to={authed ? '/klinika' : '/kirish'} className={`${btn} hidden h-11 border border-[#0F766E] px-6 text-[15px] text-[#0F766E] hover:bg-[#eef7f5] sm:inline-flex`}>{authed ? 'Kabinet' : 'Kirish'}</Link>
            <Link to="/royxat" className={`${btn} hidden h-11 bg-[#0F766E] px-6 text-[15px] text-white hover:bg-[#0b5f59] sm:inline-flex`}>Ro‘yxatdan o‘tish</Link>
            <button type="button" aria-label="Menyu" onClick={() => setMenu(true)} className="grid size-10 place-items-center rounded-xl border border-[#e2ebee] lg:hidden"><Menu className="size-5" /></button>
          </div>
        </div>
      </header>
      {menu && (
        <div className="fixed inset-0 z-50 bg-black/30 lg:hidden" onClick={() => setMenu(false)}>
          <div className="ml-auto flex h-full w-[82%] max-w-[340px] flex-col bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><img src="/images/landing/logo.png" alt="StomaHub" className="h-8" /><button type="button" aria-label="Yopish" onClick={() => setMenu(false)} className="grid size-10 place-items-center rounded-xl border border-[#e2ebee]"><X className="size-5" /></button></div>
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
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f3faf9_0%,#ffffff_100%)]">
        <img src="/images/landing/auth-clinic.jpg" alt="" aria-hidden className="pointer-events-none absolute inset-0 size-full object-cover opacity-[0.16] blur-[2px]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,#ffffff_0%,rgba(255,255,255,.85)_40%,rgba(255,255,255,.2)_100%)]" />
        <div className={`${wrap} relative grid items-center gap-6 pb-10 pt-8 lg:grid-cols-[1.05fr_1fr] lg:pb-0 lg:pt-10`}>
          <div className="lg:pb-14">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#d9ebe8] bg-white/90 px-3 py-1.5 text-[12.5px] font-medium text-[#24384d] sm:text-[13.5px]">
              <span className="grid size-6 place-items-center rounded-full bg-[#e3f3f0] text-[#0F766E]"><Tooth className="size-3.5" /></span>Stomatologlar uchun yagona platforma
            </span>
            <h1 className="mt-5 text-[36px] font-extrabold leading-[1.08] tracking-tight text-[#0f2438] sm:text-[48px] xl:text-[56px]">Stomatologlar uchun <span className="text-[#0F766E]">yagona platforma</span></h1>
            <p className="mt-5 max-w-[500px] text-[16px] leading-relaxed text-[#3d5168] sm:text-[19px]">Do‘kon, ta’lim, seminarlar va klinika boshqaruvi bir joyda. Stomatologlar uchun zamonaviy ekotizim.</p>
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
          <div className="relative mx-auto h-[400px] w-full max-w-[560px] sm:h-[520px] lg:h-[600px]">
            <img src="/images/landing/hero-doctor.jpg" alt="Stomatolog" className="absolute bottom-0 left-0 h-[92%] w-[62%] rounded-t-[28px] object-cover object-[50%_20%] [mask-image:linear-gradient(180deg,#000_75%,transparent)]" />
            <div className="absolute right-0 top-2 w-[47%] max-w-[260px] sm:top-6"><PhoneHome /></div>
            <span className="absolute bottom-24 right-[-6px] hidden size-14 place-items-center rounded-2xl bg-[#0F766E] text-white shadow-lg sm:grid"><Tooth className="size-7" /></span>
          </div>
        </div>
      </section>

      {/* NIMALAR BOR */}
      <section className={`${wrap} py-12 lg:py-16`}>
        <h2 className={h2}>Nimalar bor?</h2>
        <p className="mt-2 text-[15px] text-[#5c6e80] sm:text-[16px]">Stomatologlar uchun kerakli barcha imkoniyatlar bir joyda</p>
        <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {FEATURES.map(([I, t, d, to]) => (
            <Link key={t} to={to} className="group rounded-2xl border border-[#e8eff1] bg-white p-4 shadow-[0_6px_20px_rgb(16_40_50/0.04)] transition hover:-translate-y-0.5 hover:border-[#b9dfd9] sm:p-5">
              <span className="grid size-12 place-items-center rounded-2xl bg-[#e6f4f1] text-[#0F766E] sm:size-14"><I className="size-6 sm:size-7" strokeWidth={1.8} /></span>
              <b className="mt-4 block text-[15px] text-[#0f2438] sm:text-[17px]">{t}</b>
              <p className="mt-1.5 text-[12.5px] leading-snug text-[#5c6e80] sm:text-[14.5px]">{d}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* KIMLAR UCHUN */}
      <section className={`${wrap} pb-12 lg:pb-16`}>
        <h2 className={h2}>Kimlar uchun?</h2>
        <p className="mt-2 text-[15px] text-[#5c6e80] sm:text-[16px]">StomaHub barcha stomatologiya sohasidagi mutaxassislar uchun</p>
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5">
          {ROLES.map(([img, t, d, to], i) => (
            <Link key={t} to={to} className={`overflow-hidden rounded-2xl border bg-white transition hover:border-[#0F766E] ${i === 0 ? 'border-[#0F766E]/60' : 'border-[#e8eff1]'} ${i === 4 ? 'col-span-2 sm:col-span-1' : ''}`}>
              <div className="relative h-[150px] overflow-hidden bg-[#e9f5f2] sm:h-[170px]">
                <span className="absolute left-1/2 top-[18%] size-[78%] -translate-x-1/2 rounded-full bg-white/60" />
                <img src={`/images/landing/role-${img}.jpg`} alt={t} className="relative size-full object-cover object-top mix-blend-multiply" />
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
      <section className="bg-[linear-gradient(180deg,#ffffff_0%,#f2faf8_100%)] py-12 lg:py-16">
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
      <section className={`${wrap} py-12 lg:py-16`}>
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
      <section className="bg-[linear-gradient(180deg,#ffffff_0%,#eef8f6_100%)] py-12 lg:py-14">
        <div className={`${wrap} grid items-center gap-8 lg:grid-cols-[1fr_1.05fr_0.8fr]`}>
          <div>
            <h2 className={h2}>Har doim yoningizda</h2>
            <p className="mt-3 max-w-[420px] text-[15px] leading-relaxed text-[#3d5168] sm:text-[16px]">StomaHub mobil ilovasi bilan barcha imkoniyatlar telefoningizda. Istalgan vaqtda, istalgan joyda.</p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:flex">
              <StoreBadge kind="apple" /><StoreBadge kind="google" />
            </div>
          </div>
          <div className="relative mx-auto flex h-[340px] w-full max-w-[420px] items-start justify-center sm:h-[400px]">
            <div className="absolute left-[4%] top-0 w-[52%] rotate-[-4deg]"><PhoneHome compact /></div>
            <div className="absolute right-[4%] top-4 w-[48%] rotate-[5deg]"><PhoneCats /></div>
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
            <img src="/images/landing/logo.png" alt="StomaHub" className="h-10 w-auto" />
            <p className="mt-3 max-w-[220px] text-[13px] leading-relaxed text-[#5c6e80]">O‘zbekiston stomatologlari uchun yagona platforma.</p>
            <div className="mt-5 flex gap-2.5">
              {[['Telegram', 'https://t.me/', 'M21.9 4.6 18.7 19.4c-.2 1-.9 1.3-1.7.8l-4.8-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.9 8.9-8c.4-.3-.1-.5-.6-.2L6.5 13.2l-4.7-1.5c-1-.3-1-1 .2-1.5L20.5 3.1c.9-.3 1.6.2 1.4 1.5Z'], ['Instagram', 'https://instagram.com/', null], ['YouTube', 'https://youtube.com/', null], ['LinkedIn', 'https://linkedin.com/', null]].map(([n, href, d]) => (
                <a key={n} href={href} target="_blank" rel="noreferrer" aria-label={n} className="grid size-10 place-items-center rounded-full bg-[#e6f4f1] text-[#0F766E] hover:bg-[#d4ece8]">
                  {d ? <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor"><path d={d} /></svg> : <span className="text-[12px] font-bold">{n === 'Instagram' ? 'IG' : n === 'YouTube' ? '▶' : 'in'}</span>}
                </a>
              ))}
            </div>
          </div>
          <Foot title="Platforma" links={[['Marketplace', '/marketplace'], ['Ta’lim', '/talim'], ['Seminarlar', '/seminarlar'], ['Kitoblar', '/kitoblar'], ['Ustalar', '/ustalar']]} />
          <Foot title="Klinika uchun" links={[['Klinika CRM', '/klinika'], ['Ustalar laboratoriyalari', '/ustalar'], ['Konsultatsiyalar', '/community'], ['E’lonlar', '/elonlar']]} />
          <Foot title="Yordam" links={[['Savol-javob', '#faq'], ['Foydalanish shartlari', '/royxat'], ['Maxfiylik siyosati', '/royxat'], ['Sayt xaritasi', '/kategoriyalar']]} />
          <div>
            <p className="text-[14px] font-bold text-[#0f2438]">Aloqa</p>
            <a href={CONTACT_PHONE_TEL} className="mt-3 flex items-center gap-2 text-[13.5px] text-[#3d5168]"><Phone className="size-4 text-[#0F766E]" /> {CONTACT_PHONE}</a>
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
          <span className="flex items-center gap-2"><Globe className="size-4" /> O‘zbekcha</span>
        </div>
      </footer>
    </div>
  )
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
    <a href={apple ? 'https://apps.apple.com/' : 'https://play.google.com/store'} target="_blank" rel="noreferrer" className="inline-flex h-14 items-center gap-3 rounded-xl bg-[#0b0f14] px-4 text-white sm:px-5">
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

function PhoneHome({ compact = false }) {
  return (
    <Frame>
      <div className="px-3 pb-2 pt-3">
        <div className="flex items-center justify-between"><img src="/images/landing/logo.png" alt="" className="h-5" /><Bell className="size-3.5 text-[#24384d]" /></div>
        <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-[#f1f5f6] px-2 py-1.5 text-[8.5px] text-[#8aa0a8]"><Search className="size-3" /> Nima qidiryapsiz?</div>
        <div className="mt-2.5 grid grid-cols-4 gap-1 text-center text-[7.5px] text-[#3d5168]">
          {[[Package, 'Materiallar'], [Tooth, 'Implantlar'], [Settings, 'Uchliklar'], [LayoutGrid, 'Jihozlar']].map(([I, t]) => <span key={t}><span className="mx-auto mb-1 grid size-7 place-items-center rounded-lg bg-[#e6f4f1] text-[#0F766E]"><I className="size-3.5" /></span>{t}</span>)}
        </div>
        <div className="mt-2.5 flex items-center justify-between rounded-xl bg-[linear-gradient(120deg,#0F766E,#14a092)] p-2.5 text-white"><b className="text-[10px] leading-tight">Stomatologlar uchun<br />yagona platforma</b><Tooth className="size-7 opacity-90" /></div>
        <div className="mt-2.5 flex justify-between text-[8.5px]"><b>Ommabop kategoriyalar</b><span className="text-[#0F766E]">Barchasi →</span></div>
        <div className="mt-1.5 grid grid-cols-3 gap-1">
          {['/images/cat-1.jpg', '/images/cat-2.jpg', '/images/cat-3.jpg'].map((s, i) => <div key={s} className="overflow-hidden rounded-lg bg-[#f1f5f6]"><img src={s} alt="" className={`${compact ? 'h-9' : 'h-11'} w-full object-cover`} /><p className="px-1 py-0.5 text-[7px] font-semibold">{['Dental materiallar', 'Implantlar', 'Uchliklar'][i]}</p></div>)}
        </div>
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

function CrmDash() {
  const pts = [18, 26, 34, 42, 44, 40, 52, 48, 56, 62, 58, 68, 74]
  const path = pts.map((v, i) => `${i ? 'L' : 'M'}${(i / (pts.length - 1)) * 100} ${80 - v}`).join(' ')
  return (
    <div className="rounded-[24px] bg-[#e7f3f1]/70 p-2 sm:p-4">
      <div className="overflow-hidden rounded-2xl border border-[#e3ecee] bg-white shadow-[0_20px_50px_rgb(16_40_50/0.10)]">
        <div className="flex items-center gap-3 border-b border-[#eef3f5] px-4 py-2.5">
          <img src="/images/landing/logo.png" alt="" className="h-6" />
          <span className="mx-auto hidden w-[46%] items-center gap-1.5 rounded-lg bg-[#f3f6f7] px-2.5 py-1.5 text-[10px] text-[#8aa0a8] sm:flex"><Search className="size-3" /> Bemorlarni qidirish</span>
          <span className="ml-auto flex items-center gap-2 text-[10px]"><Bell className="size-3.5" /><img src="/images/avatar.jpg" alt="" className="size-6 rounded-full object-cover" /></span>
        </div>
        <div className="grid grid-cols-[auto_1fr]">
          <aside className="hidden w-[130px] space-y-0.5 border-r border-[#eef3f5] p-2 text-[10px] text-[#5c6e80] sm:block">
            {[[LayoutGrid, 'Bosh panel'], [CalendarDays, 'Uchrashuvlar'], [Users, 'Bemorlar'], [FileText, 'Davolash rejalari'], [Wallet, 'To‘lovlar'], [Package, 'Ombor va material'], [BarChart3, 'Hisobotlar'], [Settings, 'Sozlamalar']].map(([I, t], i) => <p key={t} className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 ${i === 0 ? 'bg-[#0F766E] text-white' : ''}`}><I className="size-3" />{t}</p>)}
          </aside>
          <div className="min-w-0 p-3">
            <b className="text-[12px]">Bosh sahifa</b>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {[[Users, 'Bemorlar', '248'], [CalendarDays, 'Uchrashuvlar', '18'], [Wallet, 'To‘lovlar', '42'], [BarChart3, 'Daromad', '36,5 mln']].map(([I, t, v]) => <div key={t} className="rounded-lg border border-[#eef3f5] p-1.5"><I className="size-3.5 text-[#0F766E]" /><p className="mt-1 truncate text-[8.5px] text-[#5c6e80]">{t}</p><b className="text-[10.5px]">{v}</b></div>)}
            </div>
            <div className="mt-2 grid grid-cols-[1.6fr_1fr] gap-1.5">
              <div className="rounded-lg border border-[#eef3f5] p-2">
                <p className="flex justify-between text-[9.5px] font-semibold">Bugungi uchrashuvlar<span className="text-[#0F766E]">Barchasi →</span></p>
                {[['Aliyeva Mohira', 'Davolash'], ['Karimov Behzod', 'Konsultatsiya'], ['Rahimova Malika', 'Tozalash'], ['To‘rayev Sardor', 'Implant']].map(([n, s], i) => <p key={n} className="mt-1 flex items-center gap-1.5 rounded-md bg-[#f7fafa] px-1.5 py-1 text-[8.5px]"><img src={`/images/bemorlar/bemor-${['mohira', 'bobur', 'malika', 'sardor'][i]}.jpg`} alt="" className="size-4 rounded-full object-cover" /><span className="flex-1 truncate">{n}</span><span className="text-[#8aa0a8]">{s}</span></p>)}
              </div>
              <div className="rounded-lg border border-[#eef3f5] p-2 text-[8.5px]">
                <p className="text-[9.5px] font-semibold">Amallar</p>
                {['Yangi bemor', 'Yangi uchrashuv', 'To‘lov qo‘shish', 'Hisobot'].map((t) => <p key={t} className="mt-1.5 flex items-center gap-1"><CheckCircle2 className="size-3 text-[#0F766E]" />{t}</p>)}
              </div>
            </div>
            <div className="mt-2 rounded-lg border border-[#eef3f5] p-2">
              <p className="flex justify-between text-[9.5px] font-semibold">Daromad dinamikasi<span className="text-[#0F766E]">Barchasi →</span></p>
              <svg viewBox="0 0 100 82" preserveAspectRatio="none" className="mt-1 h-20 w-full"><defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#0F766E" stopOpacity=".25" /><stop offset="1" stopColor="#0F766E" stopOpacity="0" /></linearGradient></defs><path d={`${path} L100 82 L0 82Z`} fill="url(#g)" /><path d={path} fill="none" stroke="#0F766E" strokeWidth="1.2" vectorEffect="non-scaling-stroke" /></svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
