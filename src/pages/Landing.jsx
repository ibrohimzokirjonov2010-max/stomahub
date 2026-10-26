import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CONTACT_PHONE } from '../config/contact'
import { useSession } from '../sessionStore'
import { useCrmStats, mln } from '../crmStats'
import {
  ArrowRight, BookOpen, Building, CalendarDays, Check, ChevronDown, FolderOpen, GraduationCap,
  Mail, MapPin, Megaphone, MessagesSquare, MonitorPlay, Phone, Presentation, ShoppingBag, Store, Users, Wallet, Wrench,
} from 'lucide-react'

const NAV = [
  ['Marketplace', '/marketplace'],
  ['Ta’lim', '/talim'],
  ['Seminarlar', '/seminarlar'],
  ['Kitoblar', '/kitoblar'],
  ['Klinika CRM', '/klinika'],
  ['Ustalar', '/ustalar'],
]

const FEATURES = [
  [Store, 'Marketplace', 'Stomatologik asbob-uskuna va materiallar', '/marketplace'],
  [MonitorPlay, 'Onlayn darslar', 'Professional kurslar va video darslar', '/talim'],
  [Presentation, 'Seminarlar', 'Amaly seminarlar va master-klasslar', '/seminarlar'],
  [BookOpen, 'Kitoblar', 'Stomatologiyaga oid kitoblar va qo‘llanmalar', '/kitoblar'],
  [FolderOpen, 'Klinika CRM', 'Bemorlar, uchrashuvlar, davolash rejalari, to‘lovlar', '/klinika'],
  [Wrench, 'Ustalar laboratoriyasi', 'Texnik xizmat va laboratoriyalar', '/ustalar'],
  [MessagesSquare, 'Konsultatsiyalar', 'Hamkasblar bilan maslahat va tajriba almashish', '/community'],
  [Megaphone, 'E’lonlar', 'Ish, hamkorlik va xizmatlar e’lonlari', '/ishlar'],
]

const PEOPLE = [
  ['/images/yangiliklar/yang-sardor.jpg', 'object-[50%_18%]', 'Stomatolog', 'Ish joyida o‘sish uchun'],
  ['/images/bemorlar/bemor-madina.jpg', 'object-[50%_15%]', 'Talaba', 'Bilim va amaliyot'],
  ['/images/bemorlar/bemor-aziz.jpg', 'object-[50%_18%]', 'Klinika egasi', 'Klinikani boshqarish'],
  ['/images/ustalar/usta-sardor.jpg', 'object-[28%_12%]', 'Tish texnigi', 'Laboratoriya va texnika'],
  ['/images/bemorlar/bemor-dilnoza.jpg', 'object-[50%_18%]', 'Sotuvchi', 'Materiallar va savdo'],
]

const CRM = [
  'Bemorlar bazasi va davolash rejalari',
  'Uchrashuvlar va qabul jadvali',
  'To‘lovlar va qarzdorliklar',
  'Ombor va materiallar',
  'Hisobotlar va tahlil',
  'Telegram xabarnomalar',
]

const STEPS = [
  ['01', 'Ro‘yxatdan o‘ting', 'Bir necha daqiqada bepul hisob yarating'],
  ['02', 'Kerakli yo‘nalishni tanlang', 'Do‘kon, ta’lim yoki Klinika CRM'],
  ['03', 'Imkoniyatlardan foydalaning', 'O‘qish, savdo va klinikani bir joyda boshqaring'],
]

const APP = ['Marketplace va buyurtmalar', 'Seminarlar va onlayn darslar', 'Uchrashuvlar va qabul', 'To‘lovlar va bildirishnomalar', 'Har doim yoningizda']

const FAQ = [
  ['StomaHub’dan foydalanish pullikmi?', 'Asosiy bo‘limlar bepul. Marketplace, seminarlar va ayrim kurslar alohida narxlanadi. Yashirin to‘lov yo‘q.'],
  ['Kimlar CRM’dan foydalana oladi?', 'Klinika egasi, shifokor va administrator. Bemorlar, qabul, to‘lov va ombor shu yerda yuritiladi.'],
  ['To‘lovni qanday amalga oshiraman?', 'Click, Payme, Uzum va naqd to‘lov qo‘llab-quvvatlanadi. Chek va qarzdorlik CRM ichida saqlanadi.'],
  ['Seminarga qanday qatnashish mumkin?', 'Seminar sahifasidan joy tanlab, ro‘yxatdan o‘tasiz. Elektron chipta va kalendar eslatmasi beriladi.'],
  ['Mahsulotni qanday xarid qilaman?', 'Marketplace’da mahsulotni savatga qo‘shing, manzil va to‘lov usulini tanlang. Buyurtmani kuzatish mumkin.'],
  ['Texnik yordam qayerda?', `Savol bo‘lsa, ${CONTACT_PHONE} raqamiga yoki info@stomahub.uz manziliga yozing. Ish vaqti 09:00–21:00.`],
]

export default function Landing() {
  const session = useSession()
  const firstName = session.status === 'authed' ? String(session.profile?.name || session.user?.user_metadata?.name || '').trim().split(/\s+/)[0] : ''
  const [open, setOpen] = useState(0)

  return (
    <div className="min-h-screen bg-white text-[#17324d]">
      <header className="sticky top-0 z-30 border-b border-[#e7eef2] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-[1180px] items-center gap-6 px-5">
          <Link to="/" aria-label="StomaHub" className="shrink-0"><img src="/images/logo.png" alt="" className="h-9 w-auto" /></Link>
          <nav className="hidden items-center gap-4 lg:flex">
            {NAV.map(([label, to]) => (
              <Link key={to} to={to} className="text-[14px] font-medium text-[#3d5168] transition hover:text-[#0b8a84]">{label}</Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/kirish" className="hidden h-10 items-center rounded-xl px-4 text-[14px] font-semibold text-[#0b8a84] hover:bg-[#f3faf8] sm:inline-flex">Kirish</Link>
            <Link to="/royxat" className="inline-flex h-10 items-center rounded-xl bg-[#0b8a84] px-4 text-[14px] font-semibold text-white hover:bg-[#08756f]">Ro‘yxatdan o‘tish</Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1180px] items-center gap-8 px-5 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.92fr)] lg:py-16">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#0b8a84]">Stomatologlar uchun yagona platforma</p>
          <h1 className="mt-3 text-[40px] font-extrabold leading-[1.08] tracking-tight text-[#10283f] lg:text-[52px]">Stomatologlar uchun yagona platforma</h1>
          <p className="mt-4 max-w-[520px] text-[17px] leading-relaxed text-[#5c6e80]">Do‘kon, ta’lim, seminarlar va klinika boshqaruvi bir joyda. Stomatologlar uchun zamonaviy ekotizim.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/royxat" className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#0b8a84] px-6 text-[15px] font-semibold text-white hover:bg-[#08756f]">Boshlash <ArrowRight className="size-4" /></Link>
            <Link to="/marketplace" className="inline-flex h-12 items-center rounded-xl border border-[#d5e4e2] bg-white px-6 text-[15px] font-semibold text-[#17324d] hover:border-[#0b8a84] hover:text-[#0b8a84]">Marketplace’ni ko‘rish</Link>
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[13.5px] text-[#3d5168]">
            {['Barcha imkoniyatlar bir joyda', 'Ortiqcha to‘lovsiz', 'Professional hamjamiyat'].map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5"><Check className="size-4 text-[#0b8a84]" strokeWidth={2.4} /> {t}</li>
            ))}
          </ul>
        </div>
        <HeroArt />
      </section>

      <section className="bg-[#f7fbfb] py-16">
        <div className="mx-auto max-w-[1180px] px-5">
          <h2 className="text-[32px] font-extrabold tracking-tight text-[#10283f]">Nimalar bor?</h2>
          <p className="mt-2 text-[15px] text-[#5c6e80]">Stomatologlar uchun kerakli barcha imkoniyatlar bir joyda</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {FEATURES.map(([Icon, title, text, to]) => (
              <Link key={title} to={to} className="rounded-2xl border border-[#e6eef2] bg-white p-5 shadow-[0_8px_24px_rgb(16_40_50/0.04)] transition hover:-translate-y-0.5 hover:border-[#b7e0db]">
                <span className="grid size-11 place-items-center rounded-xl bg-[#e7f6f3] text-[#0b8a84]"><Icon className="size-5" strokeWidth={1.8} /></span>
                <b className="mt-4 block text-[16px]">{title}</b>
                <p className="mt-1.5 text-[13.5px] leading-snug text-[#5c6e80]">{text}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-5 py-16">
        <h2 className="text-[32px] font-extrabold tracking-tight text-[#10283f]">Kimlar uchun?</h2>
        <p className="mt-2 text-[15px] text-[#5c6e80]">StomaHub butun stomatologiya sohasidagi mutaxassislar uchun</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {PEOPLE.map(([src, pos, name, role]) => (
            <article key={name} className="overflow-hidden rounded-2xl border border-[#e6eef2] bg-white shadow-[0_8px_24px_rgb(16_40_50/0.04)]">
              <img src={src} alt="" className={`h-44 w-full object-cover ${pos}`} />
              <div className="px-4 py-3.5">
                <b className="block text-[15px]">{name}</b>
                <p className="mt-0.5 text-[13px] text-[#5c6e80]">{role}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#f4fbfa_0%,#ffffff_100%)] py-16">
        <div className="mx-auto grid max-w-[1180px] items-center gap-10 px-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#0b8a84]">Klinika boshqaruvi</p>
            <h2 className="mt-2 text-[32px] font-extrabold tracking-tight text-[#10283f]">Klinika CRM</h2>
            <p className="mt-3 text-[15.5px] leading-relaxed text-[#5c6e80]">Bemorlar, uchrashuvlar, davolash rejalari, to‘lovlar va hisobotlar — barchasi bir joyda. Klinikani qog‘ozsiz va samarali yuriting.</p>
            <ul className="mt-5 space-y-2.5">
              {CRM.map((t) => (
                <li key={t} className="flex items-center gap-2 text-[14.5px]"><Check className="size-4 shrink-0 text-[#0b8a84]" strokeWidth={2.4} /> {t}</li>
              ))}
            </ul>
            <Link to="/klinika" className="mt-7 inline-flex h-12 items-center gap-2 rounded-xl bg-[#0b8a84] px-6 text-[15px] font-semibold text-white hover:bg-[#08756f]">CRM imkoniyatlarini ko‘rish <ArrowRight className="size-4" /></Link>
          </div>
          <CrmBoard />
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-5 py-16">
        <h2 className="text-[32px] font-extrabold tracking-tight text-[#10283f]">Qanday ishlaydi?</h2>
        <p className="mt-2 text-[15px] text-[#5c6e80]">StomaHub’da boshlash juda oson</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map(([n, title, text]) => (
            <article key={n} className="rounded-2xl border border-[#e6eef2] bg-white p-6">
              <span className="grid size-12 place-items-center rounded-2xl bg-[#e7f6f3] text-[18px] font-extrabold text-[#0b8a84]">{n}</span>
              <b className="mt-4 block text-[18px]">{title}</b>
              <p className="mt-1.5 text-[14.5px] leading-relaxed text-[#5c6e80]">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#f7fbfb] py-16">
        <div className="mx-auto grid max-w-[1180px] items-center gap-10 px-5 lg:grid-cols-2">
          <div>
            <h2 className="text-[32px] font-extrabold tracking-tight text-[#10283f]">Har doim yoningizda</h2>
            <p className="mt-3 max-w-[460px] text-[15.5px] leading-relaxed text-[#5c6e80]">StomaHub mobil ilovasi bilan barcha imkoniyatlar telefonda: do‘kon, ta’lim, qabul va to‘lovlar.</p>
            <ul className="mt-5 space-y-2">
              {APP.map((t) => <li key={t} className="flex items-center gap-2 text-[14.5px]"><Check className="size-4 text-[#0b8a84]" strokeWidth={2.4} /> {t}</li>)}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="inline-flex h-12 items-center rounded-xl bg-[#10283f] px-4 text-[13px] font-semibold text-white">App Store</span>
              <span className="inline-flex h-12 items-center rounded-xl bg-[#10283f] px-4 text-[13px] font-semibold text-white">Google Play</span>
            </div>
          </div>
          <div className="flex items-end justify-center gap-4">
            <Handset>
              <div className="bg-[#f4fbfa] p-3">
                <p className="text-[11px] font-extrabold text-[#0b8a84]">StomaHub</p>
                <p className="mt-2 text-[12px] font-bold">{firstName ? `Salom, ${firstName}` : 'Xush kelibsiz'}</p>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {['Seminar', 'Do‘kon', 'Kurs', 'CRM'].map((t) => <span key={t} className="rounded-lg bg-white px-2 py-2 text-[10px] font-semibold text-[#17324d]">{t}</span>)}
                </div>
              </div>
            </Handset>
            <Handset className="mb-6">
              <div className="space-y-2 bg-white p-3">
                <p className="text-[11px] font-bold">Bugungi qabul</p>
                {['09:00 Aliyeva', '11:30 Karimov', '15:00 Normatova'].map((t) => <p key={t} className="rounded-lg bg-[#f4fbfa] px-2 py-1.5 text-[10px]">{t}</p>)}
              </div>
            </Handset>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-5 py-16">
        <h2 className="text-[32px] font-extrabold tracking-tight text-[#10283f]">Ko‘p so‘raladigan savollar</h2>
        <div className="mt-6 divide-y divide-[#e7eef2] rounded-2xl border border-[#e6eef2]">
          {FAQ.map(([q, a], i) => (
            <div key={q}>
              <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[15.5px] font-semibold">
                {q}
                <ChevronDown className={`size-5 shrink-0 text-[#0b8a84] transition ${open === i ? 'rotate-180' : ''}`} />
              </button>
              {open === i && <p className="px-5 pb-4 text-[14.5px] leading-relaxed text-[#5c6e80]">{a}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 pb-16">
        <div className="mx-auto flex max-w-[1180px] flex-col items-start justify-between gap-5 rounded-3xl bg-[linear-gradient(100deg,#e7f7f4_0%,#f4fbfa_55%,#ffffff_100%)] px-8 py-10 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-[28px] font-extrabold tracking-tight text-[#10283f]">Stomatologik hamjamiyatga qo‘shiling</h2>
            <p className="mt-2 max-w-[560px] text-[15px] text-[#5c6e80]">Kasb, o‘qish, yangi imkoniyatlar va ishonchli hamkorlar — barchasi StomaHub’da.</p>
          </div>
          <Link to="/royxat" className="inline-flex h-12 shrink-0 items-center rounded-xl bg-[#0b8a84] px-6 text-[15px] font-semibold text-white hover:bg-[#08756f]">Bepul ro‘yxatdan o‘tish</Link>
        </div>
      </section>

      <footer className="border-t border-[#e7eef2] bg-[#f8fbfb]">
        <div className="mx-auto grid max-w-[1180px] gap-8 px-5 py-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <img src="/images/logo.png" alt="" className="h-8 w-auto" />
            <p className="mt-3 text-[13px] leading-relaxed text-[#5c6e80]">Stomatologlar uchun do‘kon, ta’lim va klinika boshqaruvi.</p>
          </div>
          <Foot title="Platforma" links={[['Marketplace', '/marketplace'], ['Ta’lim', '/talim'], ['Seminarlar', '/seminarlar'], ['Kitoblar', '/kitoblar']]} />
          <Foot title="Klinika" links={[['Klinika CRM', '/klinika'], ['Bemorlar', '/bemorlar'], ['Uchrashuvlar', '/uchrashuvlar'], ['To‘lovlar', '/tolovlar']]} />
          <Foot title="Aloqa" links={[['Yangiliklar', '/yangiliklar'], ['Hamjamiyat', '/community'], ['Ustalar', '/ustalar'], ['Ishlar', '/ishlar']]} />
          <div>
            <p className="text-[13px] font-bold">Bog‘lanish</p>
            <p className="mt-3 flex items-center gap-2 text-[13px] text-[#3d5168]"><Phone className="size-3.5 text-[#0b8a84]" /> {CONTACT_PHONE}</p>
            <p className="mt-2 flex items-center gap-2 text-[13px] text-[#3d5168]"><Mail className="size-3.5 text-[#0b8a84]" /> info@stomahub.uz</p>
            <p className="mt-2 flex items-center gap-2 text-[13px] text-[#3d5168]"><MapPin className="size-3.5 text-[#0b8a84]" /> Toshkent, O‘zbekiston</p>
            <p className="mt-3 text-[12px] font-semibold text-[#5c6e80]">Click · Payme</p>
          </div>
        </div>
        <div className="border-t border-[#e7eef2] py-4 text-center text-[12px] text-[#7b8b9a]">© 2026 StomaHub. Barcha huquqlar himoyalangan.</div>
      </footer>
    </div>
  )
}

function Foot({ title, links }) {
  return (
    <div>
      <p className="text-[13px] font-bold">{title}</p>
      <div className="mt-3 flex flex-col gap-2">
        {links.map(([label, to]) => <Link key={to} to={to} className="text-[13.5px] text-[#3d5168] hover:text-[#0b8a84]">{label}</Link>)}
      </div>
    </div>
  )
}

function HeroArt() {
  return (
    <div className="relative mx-auto h-[460px] w-full max-w-[540px]">
      <div className="absolute inset-x-8 top-6 h-[400px] overflow-hidden rounded-[28px] bg-[#e7f4f2]">
        <img src="/images/yangiliklar/yang-clinic.jpg" alt="" className="size-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#e7f4f2] via-transparent to-[#e7f4f2]/30" />
      </div>
      <img src="/images/yangiliklar/yang-sardor.jpg" alt="" className="absolute bottom-0 left-6 h-[390px] w-[250px] rounded-t-[24px] object-cover object-[50%_18%] shadow-[0_16px_40px_rgb(16_40_50/0.16)]" />
      <Handset className="absolute right-0 top-8 w-[190px]">
        <div className="bg-[#f6fbfa] px-2.5 pb-3 pt-1">
          <p className="text-center text-[10px] font-extrabold text-[#0b8a84]">StomaHub</p>
          <p className="mt-2 text-[11px] font-bold leading-tight">Stomatologlar uchun yagona platforma</p>
          <div className="mt-2 space-y-1">
            {[[ShoppingBag, 'Marketplace'], [GraduationCap, 'Ta’lim'], [CalendarDays, 'Qabul'], [Wallet, 'To‘lovlar']].map(([Icon, t]) => (
              <p key={t} className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1.5 text-[10px] font-medium"><Icon className="size-3 text-[#0b8a84]" /> {t}</p>
            ))}
          </div>
        </div>
      </Handset>
    </div>
  )
}

function Handset({ className = '', children }) {
  return (
    <div className={`overflow-hidden rounded-[26px] border-[5px] border-[#10283f] bg-white shadow-[0_18px_40px_rgb(16_40_50/0.16)] ${className}`}>
      <div className="mx-auto mt-1 h-3.5 w-14 rounded-full bg-[#10283f]" />
      {children}
    </div>
  )
}

function CrmBoard() {
  // Haqiqiy ma’lumotdan (crmStats) — kirilmagan bo‘lsa nollar
  const crm = useCrmStats()
  const session = useSession()
  const authed = session.status === 'authed'
  const bars = [28, 40, 36, 52, 48, 64, 58, 72, 66, 80, 74, 88]
  return (
    <div className="overflow-hidden rounded-3xl border border-[#e6eef2] bg-white shadow-[0_18px_50px_rgb(16_40_50/0.08)]">
      <div className="flex items-center justify-between border-b border-[#eef3f6] px-4 py-3">
        <span className="text-[13px] font-extrabold text-[#0b8a84]">StomaHub</span>
        <span className="rounded-full bg-[#e7f6f3] px-2.5 py-1 text-[11px] font-semibold text-[#0b8a84]">Bugun</span>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-[140px_minmax(0,1fr)]">
        <div className="hidden space-y-1 text-[11px] font-medium text-[#5c6e80] sm:block">
          {['Bosh sahifa', 'Bemorlar', 'Qabul', 'To‘lovlar', 'Ombor'].map((t, i) => (
            <p key={t} className={`rounded-lg px-2 py-1.5 ${i === 0 ? 'bg-[#e7f6f3] text-[#0b8a84]' : ''}`}>{t}</p>
          ))}
        </div>
        <div>
          <div className="grid grid-cols-3 gap-2">
            {[['To‘lovlar', String(authed ? crm.paymentsCount : 0)], ['Bugungi qabul', String(authed ? crm.todayAppointments : 0)], ['Tushum', mln(authed ? crm.revenueTotal : 0)]].map(([l, v]) => (
              <div key={l} className="rounded-xl bg-[#f6fbfa] px-2.5 py-2">
                <p className="text-[10px] text-[#5c6e80]">{l}</p>
                <b className="text-[14px]">{v}</b>
              </div>
            ))}
          </div>
          <div className="mt-3 flex h-28 items-end gap-1.5 rounded-xl bg-[#f8fbfb] px-3 py-3">
            {bars.map((h, i) => <span key={i} className="flex-1 rounded-t bg-[#0b8a84]" style={{ height: `${h}%`, opacity: 0.45 + (i / bars.length) * 0.55 }} />)}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[12px] text-[#5c6e80]"><Building className="size-3.5 text-[#0b8a84]" /> {authed && crm.todayAppointments ? `Bugun ${crm.todayAppointments} ta qabul` : 'Bugun hali qabul yo‘q'}</div>
          <div className="mt-2 flex items-center gap-2 text-[12px] text-[#5c6e80]"><Users className="size-3.5 text-[#0b8a84]" /> {authed && crm.todayVisits[0] ? `Keyingi bemor: ${crm.todayVisits[0].name || '—'}` : 'Bemorlar ro‘yxati bo‘sh'}</div>
        </div>
      </div>
    </div>
  )
}
