import { useCallback, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowRight, BadgeCheck, Bell, Building, CalendarClock, CalendarDays, Camera, Check, ChevronDown, ChevronRight, CircleQuestionMark,
  ClipboardList, Coins, CreditCard, Crown, Gift, Globe, GraduationCap, Heart, ImagePlus, LogIn, LogOut, Mail, MapPin, Megaphone,
  Pencil, Percent, Phone, Plus, Search, Send, ShoppingBag, ShoppingCart, Sparkles, Trash2, Truck, UserRound, Wallet, Warehouse,
  Store,
} from 'lucide-react'
import { useCart } from '../../cart'
import { som } from '../../marketData'
import { adPrice } from '../../elonlarData'
import { fetchBonusLog, fetchNotifications, markNotificationsRead, useRemote } from '../../buyerApi'
import { COURSES, allOrders, flushProfile, profileStore, useProfile } from '../../profileStore'
import { canEnterSeller, signOut, useSession } from '../../sessionStore'
import { BrandLogo, MobileToast, CountBadge } from './parts'
import MobileTabBar from './MobileTabBar'
import { BottomSheet } from './MobileSeminars'
import { useSeminarStore } from './seminarStore'
import { useMySeminars } from './MobileSeminarlarim'
import { useAds } from './MobileElonlar'
import { CITIES } from './MobileCheckout'
import PhoneInput, { extractUzLocalDigits, isCompleteUzPhone, PHONE_INCOMPLETE_MSG, toE164 } from '../PhoneInput'

const AVATAR = '/images/yangiliklar/yang-sardor.jpg'
const card = 'rounded-2xl bg-white shadow-[0_1px_6px_rgb(11_31_58/0.06)]'
const navy = 'text-[#0d2a4a]'
const LANGS = [['uz', 'O‘zbekcha'], ['ru', 'Русский'], ['en', 'English']]
const ROLES = ['Stomatolog', 'Terapevt', 'Ortoped', 'Ortodont', 'Jarroh', 'Implantolog', 'Endodontist', 'Gigiyenist', 'Talaba']

const MON = ['yan', 'fev', 'mar', 'apr', 'may', 'iyun', 'iyul', 'avg', 'sen', 'okt', 'noy', 'dek']
const when = (iso) => { const d = new Date(iso); return `${d.getDate()} ${MON[d.getMonth()]}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }
const toNote = (r) => ({ id: r.id, icon: r.kind === 'order' ? Truck : Gift, tone: r.kind === 'order' ? 'bg-[#e6f0fc] text-[#1f6fd1]' : 'bg-[#e5f6ec] text-[#16a34a]', title: r.title, text: r.body, time: when(r.created_at), to: r.link || '', readAt: r.read_at })

const FAQ = [
  ['Buyurtma qancha vaqtda yetkaziladi?', 'Toshkent bo‘ylab 1–2 kun ichida bepul, viloyatlarga 2–4 kun ichida yetkazamiz. Do‘kondan o‘zingiz ham olib ketishingiz mumkin.'],
  ['Mahsulotni qaytarsa bo‘ladimi?', 'Qadoqlari ochilmagan mahsulotlarni 14 kun ichida qaytarishingiz mumkin. Buning uchun operatorga murojaat qiling.'],
  ['Bonuslardan qanday foydalanaman?', '1 bonus = 1 so‘m. Bonuslar bilan buyurtma summasining 30% gacha qismini to‘lash mumkin.'],
  ['Seminar chiptasini qayerdan topaman?', '“Seminarlarim” bo‘limida ro‘yxatdan o‘tgan seminarlaringiz va QR chiptalaringiz saqlanadi.'],
]

const fmtPhone = (p) => `+998 ${p.slice(0, 2)} ${p.slice(2, 5)} ${p.slice(5, 7)} ${p.slice(7, 9)}`.trim()

function toAvatar(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const s = 320
      const c = document.createElement('canvas')
      c.width = c.height = s
      const k = Math.max(s / img.width, s / img.height)
      const w = img.width * k
      const h = img.height * k
      c.getContext('2d').drawImage(img, (s - w) / 2, (s - h) / 2, w, h)
      URL.revokeObjectURL(img.src)
      resolve(c.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export default function MobileProfil() {
  const navigate = useNavigate()
  const sessionNow = useSession()
  const profile = useProfile()
  const { items } = useCart()
  const seminars = useSeminarStore()
  const { added, saved: savedAds } = useAds()
  const location = useLocation()
  const [sheet, setSheet] = useState(location.state?.sheet || null)
  const [toast, setToast] = useState('')
  const closeToast = useCallback(() => setToast(''), [])
  const fileRef = useRef(null)

  const orders = allOrders(profile)
  const [notifTick, setNotifTick] = useState(0)
  const notifRes = useRemote(() => (profile.accountLive ? fetchNotifications() : Promise.resolve([])), [profile.accountLive, notifTick])
  const bonusRes = useRemote(() => (profile.accountLive ? fetchBonusLog() : Promise.resolve([])), [profile.accountLive])
  const notes = notifRes.data.map(toNote)
  const readIds = [...notes.filter((n) => n.readAt).map((n) => n.id), ...(profile.readNotifs || [])]
  const myAds = added
  const favCount = profile.favProducts.length + seminars.saved.length + profile.favCourses.length + (profile.accountLive ? 0 : savedAds.size)
  const mySem = useMySeminars()
  const semCount = mySem.upcoming.length + mySem.past.length
  const myCourseCount = profile.accountLive ? new Set([...(profile.favCourses || []), ...Object.keys(profile.courseDone || {})]).size : COURSES.length
  const unread = notes.filter((n) => !readIds.includes(n.id)).length
  const displayName = profile.name || (profile.accountLive ? 'Ism kiritilmagan' : 'Mehmon')
  const close = () => setSheet(null)

  const pickAvatar = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      profileStore.update({ accountLive: true, avatar: await toAvatar(file) })
      await flushProfile()
      setToast('Profil rasmi yangilandi')
    } catch {
      setToast('Rasmni o‘qib bo‘lmadi')
    }
  }

  if (profile.loggedOut) return <SignIn profile={profile} onDone={() => setToast(`Xush kelibsiz, ${profile.name.split(' ')[0]}!`)} toast={toast} closeToast={closeToast} />

  const member = canEnterSeller(sessionNow.profile)
  const groups = [
    [
      { id: 'orders', icon: ClipboardList, tone: 'bg-[#e6f0fc] text-[#1f6fd1]', title: 'Mening buyurtmalarim', text: 'Buyurtmalar tarixi va holati', count: orders.length, go: () => navigate('/profil/buyurtmalar') },
      { id: 'favs', icon: Heart, tone: 'bg-[#fde8ef] text-[#e04f7d]', title: 'Sevimlilar', text: 'Mahsulotlar, seminarlar va e’lonlar', count: favCount, go: () => navigate('/profil/sevimlilar') },
      { id: 'courses', icon: GraduationCap, tone: 'bg-[#e6f0fc] text-[#1f6fd1]', title: 'Kurslarim', text: 'Onlayn kurslar va sertifikatlar', count: myCourseCount, go: () => navigate('/profil/kurslar') },
      { id: 'seminars', icon: CalendarDays, tone: 'bg-[#e6f0fc] text-[#1f6fd1]', title: 'Seminarlarim', text: 'Ro‘yxatdan o‘tgan seminarlar', count: semCount, go: () => navigate('/profil/seminarlar') },
      { id: 'ads', icon: Megaphone, tone: 'bg-[#e3f5f3] text-sea', title: 'E’lonlarim', text: 'Ish va xizmat e’lonlarim', count: myAds.length },
    ],
    [
      { id: 'addresses', icon: MapPin, tone: 'bg-[#e6f0fc] text-[#1f6fd1]', title: 'Manzillarim', text: 'Yetkazib berish manzillari', go: () => navigate('/profil/manzillar') },
      { id: 'payments', icon: CreditCard, tone: 'bg-[#e6f0fc] text-[#1f6fd1]', title: 'To‘lov usullari', text: 'Naqd to‘lov — mahsulotni olganda', go: () => navigate('/profil/tolov-usullari') },
      { id: 'notif', icon: Bell, tone: 'bg-[#fff4e0] text-[#e8a20c]', title: 'Bildirishnomalar', text: 'Yangiliklar va xabarlar' },
      { id: 'seller', icon: Store, tone: 'bg-[#e3f5f3] text-sea', title: member ? 'Sotuvchi kabineti' : 'Sotuvchi bo‘lish', text: member ? 'Do‘koningizni boshqaring' : 'StomaHub’da mahsulot soting', go: () => navigate(member ? '/sotuvchi' : '/sotuvchi-bolish') },
      { id: 'lang', icon: Globe, tone: 'bg-[#e6f0fc] text-[#1f6fd1]', title: 'Til', text: LANGS.find((l) => l[0] === profile.lang)?.[1] },
      { id: 'help', icon: CircleQuestionMark, tone: 'bg-[#e6f0fc] text-[#1f6fd1]', title: 'Yordam', text: 'Savollar va qo‘llab-quvvatlash' },
      { id: 'logout', icon: LogOut, tone: 'bg-[#fdecec] text-sale', title: 'Chiqish', text: 'Hisobdan chiqish' },
    ],
  ]

  const stats = [
    { id: 'orders', icon: ShoppingBag, value: orders.length, label: 'Buyurtmalar', go: () => navigate('/profil/buyurtmalar') },
    { id: 'courses', icon: GraduationCap, value: myCourseCount, label: 'Kurslar', go: () => navigate('/profil/kurslar') },
    { id: 'seminars', icon: CalendarDays, value: semCount, label: 'Seminarlar', go: () => navigate('/profil/seminarlar') },
    { id: 'bonus', icon: Coins, value: som(profile.bonus), label: 'Bonus balans' },
  ]

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef8f7_0%,#f6faf9_26%,#f6faf9_100%)] pb-[86px]">
      <div className="px-3.5 pt-3">
        <header className="flex items-center justify-between">
          <BrandLogo />
          <div className="flex">
            <button type="button" onClick={() => navigate('/kategoriyalar')} aria-label="Qidirish" className={`grid size-10 place-items-center rounded-full ${navy}`}><Search className="size-[22px]" /></button>
            <button type="button" onClick={() => navigate('/buyurtma', { state: { from: 'profil' } })} aria-label="Savat" className={`relative grid size-10 place-items-center rounded-full ${navy}`}>
              <ShoppingCart className="size-[22px]" />
              {items.length > 0 && <CountBadge>{items.length}</CountBadge>}
            </button>
            <button type="button" onClick={() => setSheet('inbox')} aria-label="Bildirishnomalar" className={`relative grid size-10 place-items-center rounded-full ${navy}`}>
              <Bell className="size-[22px]" />
              {unread > 0 && <CountBadge>{unread}</CountBadge>}
            </button>
          </div>
        </header>
        {profile.syncError && <p className="mt-2 rounded-xl bg-[#fff4f4] px-3 py-2 text-[12.5px] text-[#b42318]">{profile.syncError}</p>}

        <section className="relative mt-2 overflow-hidden rounded-2xl border border-[#dcefed] bg-[linear-gradient(105deg,#f4fbfb_0%,#e9f6f5_55%,#e2f2f1_100%)] p-3.5">
          <img src="/images/ishlar/ish-chair.jpg" alt="" className="pointer-events-none absolute inset-y-0 right-0 h-full w-[50%] object-cover object-[28%_50%] opacity-70 [mask-image:linear-gradient(90deg,transparent_0%,rgb(0_0_0/0.5)_45%,#000_80%)]" />
          <div className="relative flex items-center gap-3.5">
            <div className="relative shrink-0">
              <img src={profile.avatar || AVATAR} alt={profile.name} className="size-[104px] rounded-full border-4 border-white object-cover object-top shadow-[0_4px_14px_rgb(13_42_74/0.15)]" />
              <button type="button" onClick={() => fileRef.current?.click()} aria-label="Rasmni o‘zgartirish" className="absolute bottom-0.5 right-0.5 grid size-8 place-items-center rounded-full bg-white text-sea shadow-[0_2px_8px_rgb(13_42_74/0.18)]">
                <Camera className="size-4" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={pickAvatar} className="hidden" />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`flex items-center gap-1 text-[17px] font-bold leading-tight ${navy}`}>
                <span className="truncate">{displayName}</span>
                {profile.plus ? <Crown className="size-[18px] shrink-0 fill-[#f5b301] text-[#f5b301]" /> : <BadgeCheck className="size-[18px] shrink-0 fill-[#1f6fd1] text-white" />}
              </p>
              <p className="mt-0.5 text-[12.5px] text-ink-2">{profile.role}</p>
              <button type="button" onClick={() => setSheet('clinic')} className="mt-1.5 flex max-w-full items-center gap-1.5 text-left text-[11.5px] text-ink-2"><Building className="size-3.5 shrink-0" /> <span className="truncate">{profile.clinic}</span></button>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-ink-2"><MapPin className="size-3.5 shrink-0" /> <span className="truncate">{profile.city}{profile.district ? `, ${profile.district}` : ''}</span></p>
              <button type="button" onClick={() => setSheet('edit')} className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-full bg-white/90 px-3 text-[12px] font-semibold text-sea shadow-[0_1px_4px_rgb(13_42_74/0.08)]">
                Profilni tahrirlash <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>
        </section>

        <div className="mt-3 grid grid-cols-4 gap-2">
          {stats.map((s) => (
            <button key={s.id} type="button" onClick={s.go || (() => setSheet(s.id))} className={`${card} flex min-w-0 flex-col items-center px-0.5 pb-2.5 pt-3 active:scale-[0.98]`}>
              <span className="grid size-9 place-items-center rounded-full bg-[#e3f5f3] text-sea"><s.icon className="size-[18px]" /></span>
              <span className={`mt-1.5 whitespace-nowrap font-bold tracking-tight ${navy} ${s.id === 'bonus' ? 'text-[11.5px] leading-[21px]' : 'text-[14px]'}`}>{s.value}</span>
              <span className="mt-0.5 text-[10.5px] text-ink-2">{s.label}</span>
            </button>
          ))}
        </div>

        <button type="button" onClick={() => setSheet('plus')} className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-[#d5eeea] bg-[linear-gradient(100deg,#ecf8f6,#f6fcfb)] p-3 text-left active:scale-[0.99]">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#d9f1ed] text-sea"><Crown className="size-5" /></span>
          <span className="min-w-0 flex-1">
            <span className={`flex items-center gap-2 text-[14px] font-bold ${navy}`}>StomaHub Plus {profile.plus && <span className="rounded-full bg-sea px-2 py-0.5 text-[10px] font-semibold text-white">Faol</span>}</span>
            <span className="mt-0.5 block truncate text-[11px] text-ink-2">{profile.plus ? 'Bepul yetkazish va 2x bonus faollashtirilgan' : 'Maxsus takliflar, chegirmalar va bepul yetkazish'}</span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-sea" />
        </button>

        {groups.map((rows, i) => (
          <ul key={i} className={`${card} mt-3 px-3`}>
            {rows.map((r) => (
              <li key={r.id} className="border-b border-[#eef2f4] last:border-0">
                <button type="button" onClick={r.go || (() => setSheet(r.id))} className="flex w-full items-center gap-3 py-2.5 text-left">
                  <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${r.tone}`}><r.icon className="size-5" strokeWidth={1.9} /></span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[14px] font-semibold ${r.id === 'logout' ? 'text-[#0d2a4a]' : navy}`}>{r.title}</span>
                    <span className="block truncate text-[11.5px] text-ink-2">{r.text}</span>
                  </span>
                  {r.count > 0 && <span className="grid h-6 min-w-6 place-items-center rounded-full bg-[#e6f0fc] px-2 text-[11.5px] font-semibold text-[#1f6fd1]">{r.count}</span>}
                  <ChevronRight className="size-[18px] shrink-0 text-[#8a9bab]" />
                </button>
              </li>
            ))}
          </ul>
        ))}

        <button type="button" onClick={() => setSheet('edit')} className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(90deg,#0b8a7a,#14a394)] text-[14.5px] font-semibold text-white shadow-[0_6px_16px_rgb(11_138_122/0.3)] active:scale-[0.99]">
          <Pencil className="size-[18px]" /> Profilni tahrirlash <ArrowRight className="size-[18px]" />
        </button>
      </div>

      {sheet === 'edit' && <EditSheet profile={profile} onPick={() => fileRef.current?.click()} onClose={close} onSaved={() => { close(); setToast('Profil ma’lumotlari saqlandi') }} />}
      {sheet === 'ads' && <AdsSheet ads={myAds} onClose={close} />}
      {sheet === 'bonus' && <BonusSheet bonus={profile.bonus} log={bonusRes.data.map((r) => [r.reason, r.amount, when(r.created_at)])} error={bonusRes.error} onClose={close} />}
      {sheet === 'plus' && <PlusSheet plus={profile.plus} onClose={close} onToast={setToast} />}
      {sheet === 'notif' && <NotifSheet notif={profile.notif} onClose={close} />}
      {sheet === 'inbox' && <InboxSheet items={notes} read={readIds} loading={notifRes.loading} error={notifRes.error} onMark={(ids) => markNotificationsRead(ids).then(() => setNotifTick((t) => t + 1), () => {})} onClose={close} onOpen={(n) => (n.to ? navigate(n.to) : setSheet(n.open))} />}
      {sheet === 'lang' && <LangSheet lang={profile.lang} onClose={close} onToast={setToast} />}
      {sheet === 'help' && <HelpSheet onClose={close} />}
      {sheet === 'clinic' && (
        <BottomSheet title={profile.clinic} onClose={close}>
          <p className="text-[12px] text-muted">Klinikangizni boshqarish</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[[UserRound, 'Bemorlar', '/bemorlar'], [CalendarClock, 'Uchrashuvlar', '/uchrashuvlar'], [Wallet, 'To‘lovlar', '/tolovlar'], [Warehouse, 'Ombor', '/ombor']].map(([Icon, label, to]) => (
              <Link key={to} to={to} className="flex items-center gap-2.5 rounded-2xl border border-line p-3 text-[13.5px] font-semibold text-ink active:bg-page">
                <span className="grid size-9 place-items-center rounded-full bg-[#e3f5f3] text-sea"><Icon className="size-[18px]" /></span> {label}
              </Link>
            ))}
          </div>
        </BottomSheet>
      )}
      {sheet === 'logout' && (
        <BottomSheet
          title="Hisobdan chiqish"
          onClose={close}
          footer={
            <>
              <button type="button" onClick={close} className="h-12 flex-1 rounded-xl border border-line text-[14px] font-semibold text-ink">Bekor qilish</button>
              <button type="button" onClick={() => { close(); signOut(); profileStore.update({ loggedOut: true }); window.scrollTo(0, 0) }} className="h-12 flex-1 rounded-xl bg-sale text-[14px] font-semibold text-white">Chiqish</button>
            </>
          }
        >
          <p className="mt-2 text-[13px] text-ink-2">Haqiqatan ham hisobingizdan chiqmoqchimisiz? Savatingiz va saqlangan ma’lumotlaringiz o‘chmaydi.</p>
        </BottomSheet>
      )}

      <MobileToast text={toast} onClose={closeToast} />
      <MobileTabBar />
    </div>
  )
}

function SignIn({ profile, onDone, toast, closeToast }) {
  const [phone, setPhone] = useState(profile.phone)
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')
  const digits = phone.replace(/\D/g, '').slice(0, 9)
  const submit = (e) => {
    e.preventDefault()
    if (!sent) {
      if (digits.length !== 9) return setErr('Telefon raqam to‘liq emas')
      setErr('')
      setSent(true)
      return
    }
    if (code !== '1234') return setErr('Kod noto‘g‘ri. Sinov kodi: 1234')
    profileStore.update({ loggedOut: false, phone: digits })
    onDone()
  }
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef8f7_0%,#f6faf9_40%)] px-4 pb-[86px] pt-3">
      <BrandLogo />
      <form onSubmit={submit} className={`${card} mt-8 p-5`}>
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#e3f5f3] text-sea"><UserRound className="size-8" /></span>
        <h1 className={`mt-3 text-center text-[20px] font-bold ${navy}`}>Hisobingizga kiring</h1>
        <p className="mt-1 text-center text-[12.5px] text-ink-2">Buyurtmalar, seminarlar va bonuslaringiz shu yerda saqlanadi</p>
        <label className="mt-5 block text-[12px] font-medium text-ink-2">Telefon raqami</label>
        <PhoneInput
          className={`mt-1 h-12 ${err && !sent ? 'border-sale' : 'border-line'}`}
          value={digits}
          onChange={(v) => { setPhone(extractUzLocalDigits(v)); setSent(false) }}
          valueMode="local"
          invalid={!!(err && !sent)}
          placeholder="+998 90 123 45 67"
        />
        {sent && (
          <>
            <label className="mt-3 block text-[12px] font-medium text-ink-2">SMS kod ({fmtPhone(digits)} raqamiga yuborildi)</label>
            <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))} autoFocus inputMode="numeric" placeholder="• • • •" className={`mt-1 h-12 w-full rounded-xl border px-3 text-center text-[18px] tracking-[0.5em] outline-none ${err ? 'border-sale' : 'border-line'}`} />
          </>
        )}
        {err && <p className="mt-1.5 text-[11.5px] text-sale">{err}</p>}
        {sent && !err && <p className="mt-1.5 text-[11.5px] text-muted">Sinov uchun kod: 1234</p>}
        <button type="submit" className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-sea text-[14.5px] font-semibold text-white">
          <LogIn className="size-[18px]" /> {sent ? 'Kirish' : 'SMS kod olish'}
        </button>
      </form>
      <MobileToast text={toast} onClose={closeToast} />
      <MobileTabBar />
    </div>
  )
}

function Field({ label, err, children }) {
  return (
    <label className="mt-3 block">
      <span className="text-[12px] font-medium text-ink-2">{label}</span>
      {children}
      {err && <span className="mt-1 block text-[11.5px] text-sale">{err}</span>}
    </label>
  )
}
const input = (bad) => `mt-1 h-11 w-full rounded-xl border bg-white px-3 text-[14px] text-ink outline-none focus:border-sea ${bad ? 'border-sale' : 'border-line'}`

function EditSheet({ profile, onPick, onClose, onSaved }) {
  const [f, setF] = useState({ name: profile.name, role: profile.role, clinic: profile.clinic, city: profile.city, district: profile.district, phone: profile.phone, email: profile.email })
  const [tried, setTried] = useState(false)
  const set = (k) => (e) => setF((v) => ({ ...v, [k]: k === 'phone' ? e.target.value.replace(/\D/g, '').slice(0, 9) : e.target.value }))
  const errors = {
    name: f.name.trim().length < 3 && 'Ism va familiyani kiriting',
    phone: f.phone.length !== 9 && 'Raqamni to‘liq kiriting',
    email: f.email && !/^\S+@\S+\.\S+$/.test(f.email) && 'Email noto‘g‘ri',
  }
  const save = async () => {
    setTried(true)
    if (Object.values(errors).some(Boolean)) return
    profileStore.update({ accountLive: true, ...f, name: f.name.trim(), clinic: f.clinic.trim(), district: f.district.trim() })
    await flushProfile()
    onSaved()
  }
  return (
    <BottomSheet title="Profilni tahrirlash" onClose={onClose} footer={<button type="button" onClick={save} className="h-12 flex-1 rounded-xl bg-sea text-[14.5px] font-semibold text-white">Saqlash</button>}>
      <div className="mt-3 flex items-center gap-3">
        <img src={profile.avatar || AVATAR} alt="" className="size-16 rounded-full object-cover object-top" />
        <div className="flex flex-col items-start gap-1">
          <button type="button" onClick={onPick} className="flex items-center gap-1.5 text-[13px] font-semibold text-sea"><ImagePlus className="size-4" /> Rasmni o‘zgartirish</button>
          {profile.avatar && <button type="button" onClick={() => profileStore.update({ avatar: '' })} className="flex items-center gap-1.5 text-[12.5px] font-medium text-sale"><Trash2 className="size-3.5" /> Rasmni o‘chirish</button>}
        </div>
      </div>
      <Field label="Ism va familiya" err={tried && errors.name}><input value={f.name} onChange={set('name')} className={input(tried && errors.name)} /></Field>
      <Field label="Mutaxassislik">
        <select value={f.role} onChange={set('role')} className={input()}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
      </Field>
      <Field label="Klinika"><input value={f.clinic} onChange={set('clinic')} placeholder="Klinika nomi" className={input()} /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Shahar">
          <select value={f.city} onChange={(e) => setF((v) => ({ ...v, city: e.target.value, district: CITIES[e.target.value]?.[0] || '' }))} className={input()}>{Object.keys(CITIES).map((c) => <option key={c}>{c}</option>)}</select>
        </Field>
        <Field label="Tuman">
          <select value={f.district} onChange={set('district')} className={input()}>{(CITIES[f.city] || []).map((d) => <option key={d}>{d}</option>)}</select>
        </Field>
      </div>
      <Field label="Telefon" err={tried && errors.phone}>
        <div className={`${input(tried && errors.phone)} flex items-center gap-2`}>
          <span className="font-semibold">+998</span>
          <input value={f.phone} onChange={set('phone')} inputMode="numeric" className="min-w-0 flex-1 bg-transparent outline-none" />
        </div>
      </Field>
      <Field label="Email" err={tried && errors.email}><input value={f.email} onChange={set('email')} type="email" inputMode="email" className={input(tried && errors.email)} /></Field>
    </BottomSheet>
  )
}

function Empty({ icon: Icon, text, sub }) {
  return (
    <div className="py-8 text-center">
      <Icon className="mx-auto size-9 text-sea/60" strokeWidth={1.5} />
      <p className="mt-2 text-[13.5px] font-semibold text-ink">{text}</p>
      {sub && <p className="mt-1 text-[12px] text-muted">{sub}</p>}
    </div>
  )
}

function AdsSheet({ ads, onClose }) {
  return (
    <BottomSheet title="E’lonlarim" onClose={onClose} footer={<Link to="/elonlar" className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-sea text-[14px] font-semibold text-white"><Plus className="size-[18px]" /> Yangi e’lon joylash</Link>}>
      {!ads.length && <Empty icon={Megaphone} text="Hozircha e’lon yo‘q" sub="Joylagan ish va xizmat e’lonlaringiz shu yerda ko‘rinadi" />}
      <div className="mt-3 flex flex-col gap-2">
        {ads.map((a) => (
          <Link key={a.id} to={`/elonlar/${a.id}`} className="flex items-center gap-3 rounded-2xl border border-line p-2">
            <img src={a.images?.[0]} alt="" className="size-16 shrink-0 rounded-xl bg-page object-cover" />
            <span className="min-w-0 flex-1">
              <span className={`block truncate text-[13px] font-semibold ${navy}`}>{a.title}</span>
              <span className="block truncate text-[11px] text-muted">{a.city}</span>
              <span className="mt-1 block text-[12.5px] font-bold text-sea">{adPrice(a)}</span>
            </span>
            <ChevronRight className="size-[18px] shrink-0 text-muted" />
          </Link>
        ))}
      </div>
    </BottomSheet>
  )
}

function BonusSheet({ bonus, log, error, onClose }) {
  return (
    <BottomSheet title="Bonus balans" onClose={onClose} footer={<Link to="/marketplace" className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-sea text-[14px] font-semibold text-white"><ShoppingBag className="size-[18px]" /> Xarid qilish</Link>}>
      <div className="mt-3 rounded-2xl bg-[linear-gradient(110deg,#0b8a7a,#14a394)] p-4 text-white">
        <p className="text-[12px] opacity-85">Mavjud bonus</p>
        <p className="mt-0.5 text-[26px] font-extrabold">{som(bonus)}</p>
        <p className="mt-1 text-[11.5px] opacity-85">1 bonus = 1 so‘m · buyurtmaning 30% gacha to‘lash mumkin</p>
      </div>
      <p className={`mt-4 text-[13px] font-semibold ${navy}`}>Tarix</p>
      <ul className="mt-1 divide-y divide-[#eef2f4]">
        {(log || []).map(([text, amount, date]) => (
          <li key={text} className="flex items-center gap-3 py-2.5">
            <span className={`grid size-9 shrink-0 place-items-center rounded-full ${amount > 0 ? 'bg-[#e5f6ec] text-[#16a34a]' : 'bg-[#fdecec] text-sale'}`}>{amount > 0 ? <Gift className="size-4" /> : <Wallet className="size-4" />}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-ink">{text}</span>
              <span className="block text-[11px] text-muted">{date}</span>
            </span>
            <span className={`shrink-0 whitespace-nowrap text-[13px] font-bold ${amount > 0 ? 'text-[#16a34a]' : 'text-sale'}`}>{amount > 0 ? '+' : '−'}{som(Math.abs(amount))}</span>
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="py-3 text-center text-[13px] text-[#b42318]">{error}</p>}
      {!error && !log?.length && <p className="py-6 text-center text-[13px] text-muted">Bonus tarixi yo‘q. Xarid va seminarlardan keyin shu yerda ko‘rinadi.</p>}
    </BottomSheet>
  )
}

function PlusSheet({ plus, onClose, onToast }) {
  const perks = [
    [Truck, 'Barcha viloyatlarga bepul yetkazish'],
    [Coins, 'Har xariddan 2 barobar ko‘p bonus'],
    [CalendarClock, 'Seminarlarga 15% chegirma'],
    [Sparkles, 'Aksiyalardan bir kun oldin xabardor bo‘lish'],
  ]
  const toggle = () => {
    profileStore.update({ plus: !plus })
    onToast(plus ? 'Obuna bekor qilindi' : 'StomaHub Plus faollashtirildi')
    onClose()
  }
  return (
    <BottomSheet
      title="StomaHub Plus"
      onClose={onClose}
      footer={
        <button type="button" onClick={toggle} className={`h-12 flex-1 rounded-xl text-[14px] font-semibold ${plus ? 'border border-sale text-sale' : 'bg-sea text-white'}`}>
          {plus ? 'Obunani bekor qilish' : `Obuna bo‘lish — ${som(49000)} / oy`}
        </button>
      }
    >
      <div className="mt-3 flex items-center gap-3 rounded-2xl bg-[linear-gradient(100deg,#ecf8f6,#f6fcfb)] p-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#fff4d6] text-[#e8a20c]"><Crown className="size-6 fill-current" /></span>
        <p className="text-[12.5px] text-ink-2">{plus ? 'Obunangiz faol. Keyingi to‘lov 25-noyabr kuni.' : 'Birinchi oy — 50% chegirma bilan. Istalgan payt bekor qilishingiz mumkin.'}</p>
      </div>
      <ul className="mt-3 space-y-2.5">
        {perks.map(([Icon, text]) => (
          <li key={text} className="flex items-center gap-3 text-[13px] text-ink">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e3f5f3] text-sea"><Icon className="size-[18px]" /></span> {text}
          </li>
        ))}
      </ul>
    </BottomSheet>
  )
}

function Switch({ on, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onChange} className={`relative h-[26px] w-[46px] shrink-0 rounded-full transition ${on ? 'bg-sea' : 'bg-[#cfd8de]'}`}>
      <span className={`absolute top-[3px] size-5 rounded-full bg-white shadow transition-all ${on ? 'left-[23px]' : 'left-[3px]'}`} />
    </button>
  )
}

function NotifSheet({ notif, onClose }) {
  const rows = [
    ['orders', Truck, 'Buyurtmalar', 'Holat o‘zgarishi va yetkazish'],
    ['seminars', CalendarDays, 'Seminarlar', 'Eslatmalar va yangi seminarlar'],
    ['promo', Percent, 'Aksiyalar', 'Chegirmalar va maxsus takliflar'],
    ['community', UserRound, 'Hamjamiyat', 'Javoblar va yangi postlar'],
    ['sound', Bell, 'Ovoz', 'Bildirishnoma ovozi'],
  ]
  return (
    <BottomSheet title="Bildirishnomalar" onClose={onClose}>
      <ul className="mt-2 divide-y divide-[#eef2f4]">
        {rows.map(([id, Icon, title, text]) => (
          <li key={id} className="flex items-center gap-3 py-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e3f5f3] text-sea"><Icon className="size-[18px]" /></span>
            <span className="min-w-0 flex-1">
              <span className={`block text-[13.5px] font-semibold ${navy}`}>{title}</span>
              <span className="block text-[11.5px] text-muted">{text}</span>
            </span>
            <Switch on={notif[id]} onChange={() => profileStore.update({ notif: { ...notif, [id]: !notif[id] } })} label={title} />
          </li>
        ))}
      </ul>
    </BottomSheet>
  )
}

function InboxSheet({ items, read, loading, error, onMark, onClose, onOpen }) {
  const unread = items.filter((n) => !read.includes(n.id))
  return (
    <BottomSheet title="Bildirishnomalar" onClose={onClose}>
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-muted">{unread.length ? `${unread.length} ta o‘qilmagan` : 'Hammasi o‘qilgan'}</p>
        {unread.length > 0 && <button type="button" onClick={() => onMark(unread.map((n) => n.id))} className="text-[12px] font-semibold text-sea">Barchasini o‘qildi deb belgilash</button>}
      </div>
      <ul className="mt-2 flex flex-col gap-1.5">
        {items.map((n) => {
          const isNew = !read.includes(n.id)
          return (
            <li key={n.id}>
              <button type="button" onClick={() => { if (isNew) onMark([n.id]); if (n.to) onOpen(n) }} className={`flex w-full items-start gap-3 rounded-2xl p-2.5 text-left ${isNew ? 'bg-[#eef8f6]' : ''}`}>
                <span className={`grid size-10 shrink-0 place-items-center rounded-full ${n.tone}`}><n.icon className="size-[18px]" /></span>
                <span className="min-w-0 flex-1">
                  <span className={`flex items-center gap-1.5 text-[13px] font-semibold ${navy}`}>{n.title} {isNew && <span className="size-2 shrink-0 rounded-full bg-sale" />}</span>
                  <span className="mt-0.5 block text-[12px] text-ink-2">{n.text}</span>
                  <span className="mt-0.5 block text-[11px] text-muted">{n.time}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {loading && !items.length && <p className="py-8 text-center text-[13px] text-muted">Yuklanmoqda…</p>}
      {error && <p role="alert" className="py-4 text-center text-[13px] text-[#b42318]">{error}</p>}
      {!loading && !error && !items.length && <p className="py-8 text-center text-[13px] text-muted">Bildirishnomalar yo‘q. Yangi buyurtma yoki seminar bo‘lsa, shu yerda chiqadi.</p>}
    </BottomSheet>
  )
}

function LangSheet({ lang, onClose, onToast }) {
  return (
    <BottomSheet title="Til" onClose={onClose}>
      <div className="mt-3 flex flex-col gap-2" role="radiogroup" aria-label="Til">
        {LANGS.map(([id, label]) => (
          <button key={id} type="button" role="radio" aria-checked={lang === id} onClick={() => { profileStore.update({ lang: id }); onToast(`Til: ${label}`); onClose() }} className={`flex h-12 items-center justify-between rounded-xl border px-3.5 text-[14px] font-medium ${lang === id ? 'border-sea bg-[#eef8f6] text-sea' : 'border-line text-ink'}`}>
            {label} {lang === id && <Check className="size-5" />}
          </button>
        ))}
      </div>
    </BottomSheet>
  )
}

function HelpSheet({ onClose }) {
  const [open, setOpen] = useState(0)
  return (
    <BottomSheet title="Yordam" onClose={onClose}>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[[Phone, 'Qo‘ng‘iroq', 'tel:+998712000000'], [Send, 'Telegram', 'https://t.me/stomahub'], [Mail, 'Email', 'mailto:support@stomahub.uz']].map(([Icon, label, href]) => (
          <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="flex flex-col items-center gap-1.5 rounded-2xl bg-[#eef8f6] py-3 text-[12px] font-semibold text-sea">
            <Icon className="size-5" /> {label}
          </a>
        ))}
      </div>
      <p className={`mt-4 text-[13px] font-semibold ${navy}`}>Ko‘p so‘raladigan savollar</p>
      <ul className="mt-1 divide-y divide-[#eef2f4]">
        {FAQ.map(([q, a], i) => (
          <li key={q}>
            <button type="button" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i} className="flex w-full items-center gap-2 py-3 text-left text-[13px] font-medium text-ink">
              <span className="flex-1">{q}</span>
              <ChevronDown className={`size-4 shrink-0 text-muted transition ${open === i ? 'rotate-180' : ''}`} />
            </button>
            {open === i && <p className="pb-3 text-[12.5px] leading-relaxed text-ink-2">{a}</p>}
          </li>
        ))}
      </ul>
    </BottomSheet>
  )
}
