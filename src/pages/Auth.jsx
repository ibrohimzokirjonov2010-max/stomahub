import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, ClipboardList, Globe, Stethoscope, BookOpen, ChevronDown, Eye, EyeOff, GraduationCap, Lock, LogIn, Mail, Phone, ShoppingCart, UserPlus, UserRound, Users } from 'lucide-react'
import { profileStore, useProfile } from '../profileStore'
import { retryHub } from '../hubStore'
import { supabase } from '../supabaseClient'
import { flashToast } from '../components/FlashToast'
import { ensureProfile, intendedRole, setIntendedRole, useSession } from '../sessionStore'

const SPECS = ['Stomatolog', 'Talaba', 'Klinika egasi', 'Tish texnigi', 'Sotuvchi', 'Implantolog', 'Ortodont', 'Endodontist', 'Terapevt']

const COPY = {
  uz: {
    lang: 'O‘zbekcha',
    title: 'Stomatologlar uchun yagona platforma',
    lead: 'Ta’lim, sifatli materiallar, professional hamjamiyat va yangi imkoniyatlar — barchasi StomaHub’da.',
    feats: ['Onlayn kurslar va seminarlar', 'Sifatli stomatologik mahsulotlar', 'Professional hamjamiyat', 'Foydali resurslar va imkoniyatlar'],
    login: 'Kirish',
    loginLead: 'StomaHub hisobingizga kiring va imkoniyatlardan foydalaning.',
    id: 'Telefon raqam yoki email',
    idPh: '+998 90 123 45 67 yoki email',
    pass: 'Parol',
    passPh: 'Parolingizni kiriting',
    forgot: 'Parolni unutdingizmi?',
    forgotNote: 'Email kiritsangiz, tiklash havolasini yuboramiz. Telefon orqali kirishda parol yo‘q — kod Telegram botga keladi.',
    forgotSent: 'Agar hisob bo‘lsa, tiklash havolasi emailga yuborildi.',
    or: 'yoki',
    googleIn: 'Google orqali kirish',
    kind: 'Hisob turi',
    customer: 'Mijoz',
    organizer: 'Tashkilotchi',
    telegram: 'Telegram orqali kirish',
    phoneLead: 'Telefon orqali kirish',
    sendCode: 'Kod yuborish',
    code: 'Tasdiqlash kodi',
    codePh: '6 xonali kod',
    confirmEmail: 'Hisob ochildi. Emailingizdagi tasdiqlash havolasini bosing, so‘ng kiring.',
    errCode: '6 xonali kodni kiriting',
    errSupabase: 'Supabase sozlanmagan',
    linkBot: 'Avval botda telefon raqamingizni ulang',
    noAcc: 'Hisobingiz yo‘qmi?',
    toReg: 'Ro‘yxatdan o‘tish',
    reg: 'Ro‘yxatdan o‘tish',
    regLead: 'StomaHub jamoasiga qo‘shiling va yangi imkoniyatlardan foydalaning.',
    name: 'Ism familiya',
    namePh: 'Ism familiyangizni kiriting',
    phone: 'Telefon raqam',
    phonePh: '+998 90 123 45 67',
    email: 'Email',
    emailPh: 'example@mail.uz',
    spec: 'Mutaxassislik',
    specPh: 'Mutaxassislikni tanlang',
    pass2: 'Parolni tasdiqlang',
    pass2Ph: 'Parolni takrorlang',
    terms: 'Foydalanish shartlariga roziman',
    googleUp: 'Google orqali ro‘yxatdan o‘tish',
    hasAcc: 'Hisobingiz bormi?',
    errId: 'Telefon yoki emailni kiriting',
    errPass: 'Parol kamida 6 ta belgidan iborat bo‘lsin',
    errName: 'Ism familiyani kiriting',
    errPhone: 'Telefon raqamini to‘liq kiriting',
    errEmail: 'Email manzilini to‘g‘ri kiriting',
    errSpec: 'Mutaxassislikni tanlang',
    errMatch: 'Parollar mos kelmadi',
    errTerms: 'Davom etish uchun shartlarga rozilik bildiring',
  },
  ru: {
    lang: 'Русский',
    title: 'Единая платформа для стоматологов',
    lead: 'Обучение, материалы, сообщество и новые возможности — всё в StomaHub.',
    feats: ['Онлайн-курсы и семинары', 'Качественные материалы', 'Профессиональное сообщество', 'Полезные ресурсы'],
    login: 'Вход',
    loginLead: 'Войдите в аккаунт StomaHub и пользуйтесь возможностями.',
    id: 'Телефон или email',
    idPh: '+998 90 123 45 67 или email',
    pass: 'Пароль',
    passPh: 'Введите пароль',
    forgot: 'Забыли пароль?',
    forgotNote: 'Для email отправим ссылку сброса. Для телефона пароль не нужен — код придёт в Telegram-бот.',
    forgotSent: 'Если аккаунт есть, ссылка отправлена на email.',
    or: 'или',
    googleIn: 'Войти через Google',
    kind: 'Тип аккаунта',
    customer: 'Клиент',
    organizer: 'Организатор',
    telegram: 'Войти через Telegram',
    phoneLead: 'Вход по телефону',
    sendCode: 'Отправить код',
    code: 'Код подтверждения',
    codePh: '6 цифр',
    confirmEmail: 'Аккаунт создан. Подтвердите email, затем войдите.',
    errCode: 'Введите 6-значный код',
    errSupabase: 'Supabase не настроен',
    linkBot: 'Сначала привяжите номер в боте',
    noAcc: 'Нет аккаунта?',
    toReg: 'Регистрация',
    reg: 'Регистрация',
    regLead: 'Присоединяйтесь к StomaHub и откройте новые возможности.',
    name: 'Имя и фамилия',
    namePh: 'Введите имя и фамилию',
    phone: 'Телефон',
    phonePh: '+998 90 123 45 67',
    email: 'Email',
    emailPh: 'example@mail.uz',
    spec: 'Специальность',
    specPh: 'Выберите специальность',
    pass2: 'Подтвердите пароль',
    pass2Ph: 'Повторите пароль',
    terms: 'Согласен с условиями использования',
    googleUp: 'Регистрация через Google',
    hasAcc: 'Уже есть аккаунт?',
    errId: 'Введите телефон или email',
    errPass: 'Пароль должен быть не короче 6 символов',
    errName: 'Введите имя и фамилию',
    errPhone: 'Введите телефон полностью',
    errEmail: 'Введите корректный email',
    errSpec: 'Выберите специальность',
    errMatch: 'Пароли не совпадают',
    errTerms: 'Подтвердите согласие с условиями',
  },
  en: {
    lang: 'English',
    title: 'One platform for dentists',
    lead: 'Education, quality supplies, a professional community and new opportunities — all in StomaHub.',
    feats: ['Online courses and seminars', 'Quality dental products', 'Professional community', 'Useful resources'],
    login: 'Sign in',
    loginLead: 'Sign in to your StomaHub account and start using it.',
    id: 'Phone or email',
    idPh: '+998 90 123 45 67 or email',
    pass: 'Password',
    passPh: 'Enter your password',
    forgot: 'Forgot password?',
    forgotNote: 'For email we send a reset link. Phone login has no password — the code arrives in the Telegram bot.',
    forgotSent: 'If the account exists, a reset link was sent.',
    or: 'or',
    googleIn: 'Continue with Google',
    kind: 'Account type',
    customer: 'Customer',
    organizer: 'Organizer',
    telegram: 'Continue with Telegram',
    phoneLead: 'Sign in with phone',
    sendCode: 'Send code',
    code: 'Confirmation code',
    codePh: '6-digit code',
    confirmEmail: 'Account created. Confirm the email, then sign in.',
    errCode: 'Enter the 6-digit code',
    errSupabase: 'Supabase is not configured',
    linkBot: 'Link your phone in the bot first',
    noAcc: 'No account yet?',
    toReg: 'Create one',
    reg: 'Create account',
    regLead: 'Join StomaHub and start using the new tools.',
    name: 'Full name',
    namePh: 'Enter your full name',
    phone: 'Phone',
    phonePh: '+998 90 123 45 67',
    email: 'Email',
    emailPh: 'example@mail.uz',
    spec: 'Specialty',
    specPh: 'Choose a specialty',
    pass2: 'Confirm password',
    pass2Ph: 'Repeat the password',
    terms: 'I agree to the terms of use',
    googleUp: 'Sign up with Google',
    hasAcc: 'Already have an account?',
    errId: 'Enter a phone number or email',
    errPass: 'Use at least 6 characters',
    errName: 'Enter your full name',
    errPhone: 'Enter the full phone number',
    errEmail: 'Enter a valid email',
    errSpec: 'Choose a specialty',
    errMatch: 'Passwords do not match',
    errTerms: 'Please accept the terms',
  },
}

const digits = (v) => v.replace(/\D/g, '')
const emailFormatOk = (v) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim())
// Namuna / test domenlari — ro‘yxatdan o‘tishda qabul qilinmaydi
const BLOCKED_DOMAINS = ['example.com', 'example.org', 'example.net', 'test.com', 'mailinator.com', 'tempmail.com', '10minutemail.com', 'yopmail.com']
const BLOCKED_TLDS = ['test', 'example', 'invalid', 'localhost', 'local']
export function emailProblem(v) {
  const value = String(v || '').trim().toLowerCase()
  if (!value) return 'Email manzilini kiriting'
  if (!emailFormatOk(value)) return 'Email formati noto‘g‘ri (masalan: ism@gmail.com)'
  const domain = value.split('@')[1]
  const tld = domain.split('.').pop()
  if (BLOCKED_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`)) || BLOCKED_TLDS.includes(tld)) return 'Bu domen qabul qilinmaydi — haqiqiy email manzilingizni kiriting'
  return ''
}
const emailOk = (v) => !emailProblem(v)

export function Login() {
  return <Auth mode="login" />
}

export function Register() {
  return <Auth mode="register" />
}

function safeNext(value) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/kirish')) return ''
  return value
}

function toLocalPhone(value) {
  const raw = digits(String(value || ''))
  const local = raw.startsWith('998') ? raw.slice(3) : raw
  return local.length === 9 ? local : ''
}

function Auth({ mode }) {
  const navigate = useNavigate()
  const profile = useProfile()
  const session = useSession()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next') || '')
  const [lang, setLang] = useState(profile.lang === 'ru' || profile.lang === 'en' ? profile.lang : 'uz')
  const [openLang, setOpenLang] = useState(false)
  const t = COPY[lang]
  const [id, setId] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [spec, setSpec] = useState('')
  const [pass, setPass] = useState('')
  const [pass2, setPass2] = useState('')
  const [show, setShow] = useState(false)
  const [show2, setShow2] = useState(false)
  const [terms, setTerms] = useState(false)
  const [forgot, setForgot] = useState(false)
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')
  const [emailErr, setEmailErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [roleIntent, setRoleIntent] = useState(params.get('role') === 'organizer' || intendedRole() === 'organizer' ? 'organizer' : 'customer')
  const bot = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || ''
  const finishing = useRef(false)

  useEffect(() => { setIntendedRole(roleIntent) }, [roleIntent])

  const destination = (role) => next || (role === 'organizer' ? '/tashkilotchi' : role === 'seller' ? '/sotuvchi' : '/klinika')

  const applyAccount = async ({ forceRole } = {}) => {
    const phoneDigits = digits(phone).replace(/^998/, '').slice(-9)
    const res = await ensureProfile({
      role: roleIntent,
      forceRole,
      name: name.trim() || undefined,
      specialty: spec || undefined,
      email: emailOk(email) ? email.trim() : undefined,
      phone: phoneDigits.length === 9 ? `+998${phoneDigits}` : undefined,
    })
    if (!res.ok) throw new Error(res.error || 'Profil saqlanmadi')
    const localPhone = toLocalPhone(res.profile?.phone)
    profileStore.update({
      loggedOut: false,
      accountLive: true,
      lang,
      name: res.profile?.name || '',
      email: res.profile?.email || session.user?.email || '',
      phone: localPhone,
      role: res.profile?.specialty || '',
    })
    await retryHub()
    return res.profile?.role === 'organizer' ? 'organizer' : 'customer'
  }

  useEffect(() => {
    if (session.status !== 'authed' || !session.user || finishing.current) return undefined
    if (!session.profile) {
      finishing.current = true
      let cancel = false
      ;(async () => {
        try {
          const role = await applyAccount({ forceRole: true })
          if (!cancel) navigate(destination(role), { replace: true })
        } catch (error) {
          finishing.current = false
          if (!cancel) setErr(error.message)
        }
      })()
      return () => { cancel = true }
    }
    const localPhone = toLocalPhone(session.profile.phone || session.user.user_metadata?.phone)
    profileStore.update({
      loggedOut: false,
      lang,
      name: session.profile.name || session.user.user_metadata?.name || '',
      email: session.profile.email || session.user.email || '',
      phone: localPhone,
      role: session.profile.specialty || '',
    })
    navigate(destination(session.profile.role), { replace: true })
    return undefined
  }, [session.status, session.user, session.profile])

  const applySession = async (payload) => {
    if (!supabase) throw new Error(t.errSupabase)
    const { error } = await supabase.auth.setSession({
      access_token: payload.access_token,
      refresh_token: payload.refresh_token,
    })
    if (error) throw error
  }

  const startPhone = async (rawPhone) => {
    setBusy(true)
    setErr('')
    setInfo('')
    try {
      const res = await fetch('/api/auth/phone/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: rawPhone }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error || 'Kod yuborilmadi')
      setOtpSent(true)
      setInfo(t.phoneLead)
    } catch (error) {
      setErr(error.message)
    } finally {
      setBusy(false)
    }
  }

  const verifyPhone = async (rawPhone) => {
    if (otp.replace(/\D/g, '').length !== 6) return setErr(t.errCode)
    setBusy(true)
    setErr('')
    try {
      const res = await fetch('/api/auth/phone/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: rawPhone, code: otp, role: roleIntent, name: name.trim() }),
      })
      const json = await res.json()
      if (!res.ok || !json.access_token) throw new Error(json.error || 'Kirib bo‘lmadi')
      finishing.current = true
      await applySession(json)
      const role = await applyAccount({ forceRole: true })
      navigate(destination(role), { replace: true })
    } catch (error) {
      finishing.current = false
      setErr(error.message)
      setBusy(false)
    }
  }

  const google = async () => {
    if (!supabase) return setErr(t.errSupabase)
    setBusy(true)
    setErr('')
    setIntendedRole(roleIntent)
    const redirect = new URL('/kirish', window.location.origin)
    redirect.searchParams.set('role', roleIntent)
    if (next) redirect.searchParams.set('next', next)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirect.toString(),
        queryParams: { prompt: 'select_account' },
        data: { role: roleIntent, name: name.trim() },
      },
    })
    if (error) {
      setErr(error.message)
      setBusy(false)
    }
  }

  const resetPassword = async () => {
    const raw = id.trim()
    if (!emailFormatOk(raw)) {
      setForgot(true)
      setInfo(t.forgotNote)
      return
    }
    if (!supabase) return setErr(t.errSupabase)
    setBusy(true)
    const { error } = await supabase.auth.resetPasswordForEmail(raw, { redirectTo: `${window.location.origin}/kirish` })
    setBusy(false)
    if (error) setErr(error.message)
    else setInfo(t.forgotSent)
  }

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setInfo('')
    if (mode === 'login' && !supabase) return setErr(t.errSupabase)
    if (mode === 'login') {
      const raw = id.trim()
      if (emailFormatOk(raw)) {
        if (pass.length < 6) return setErr(t.errPass)
        setBusy(true)
        finishing.current = true
        const { error } = await supabase.auth.signInWithPassword({ email: raw, password: pass })
        if (error) {
          finishing.current = false
          setErr(error.message)
          setBusy(false)
          return
        }
        try {
          const role = await applyAccount({ forceRole: true })
          navigate(destination(role), { replace: true })
        } catch (error) {
          finishing.current = false
          setErr(error.message)
          setBusy(false)
        }
        return
      }
      const phoneDigits = digits(raw).replace(/^998/, '').slice(-9)
      if (phoneDigits.length !== 9) return setErr(t.errId)
      if (!otpSent) return startPhone(raw)
      return verifyPhone(raw)
    }
    const phoneDigits = digits(phone).replace(/^998/, '').slice(-9)
    if (name.trim().length < 3) return setErr(t.errName)
    if (phoneDigits.length !== 9) return setErr(t.errPhone)
    const emailIssue = emailProblem(email)
    if (emailIssue) { setEmailErr(emailIssue); return setErr(emailIssue) }
    if (!spec) return setErr(t.errSpec)
    if (pass.length < 6) return setErr(t.errPass)
    if (pass !== pass2) return setErr(t.errMatch)
    if (!terms) return setErr(t.errTerms)
    if (!supabase) return setErr(t.errSupabase)
    setBusy(true)
    finishing.current = true
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: pass,
      options: {
        data: { name: name.trim(), phone: `+998${phoneDigits}`, specialty: spec, role: roleIntent },
      },
    })
    if (error) {
      finishing.current = false
      setErr(error.message)
      setBusy(false)
      return
    }
    if (!data.session) {
      // Email tasdiqlash o‘chirilgan — darhol kirib ko‘ramiz
      const signed = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass })
      if (signed.error || !signed.data.session) {
        finishing.current = false
        setBusy(false)
        setInfo(t.confirmEmail)
        return
      }
    }
    try {
      const role = await applyAccount({ forceRole: true })
      flashToast('Muvaffaqiyatli ro‘yxatdan o‘tdingiz! Kabinetingizga xush kelibsiz.')
      navigate(destination(role), { replace: true })
    } catch (signError) {
      finishing.current = false
      setErr(signError.message)
      setBusy(false)
    }
  }

  const isLogin = mode === 'login'
  const langBtn = (
    <div className="relative">
      <button type="button" onClick={() => setOpenLang((v) => !v)} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#e3ecea] bg-[#f6fbfa] px-3 text-[13px] font-medium text-[#24384d]">
        <Globe className="size-4 text-[#0F766E]" /> {t.lang} <ChevronDown className="size-3.5" />
      </button>
      {openLang && (
        <div className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-xl border border-[#e6eef2] bg-white shadow-lg">
          {Object.entries(COPY).map(([key, item]) => (
            <button key={key} type="button" onClick={() => { setLang(key); setOpenLang(false); setErr('') }} className={`block w-full px-3 py-2 text-left text-[13px] hover:bg-[#f3faf8] ${key === lang ? 'font-semibold text-[#0F766E]' : ''}`}>{item.lang}</button>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="grid min-h-screen bg-white lg:h-[calc(100dvh/var(--z))] lg:min-h-0 lg:grid-cols-[minmax(0,1.07fr)_minmax(480px,1fr)] lg:overflow-hidden lg:bg-[#f2f9f8]">
      <AuthAside t={t} />

      <main className="overflow-y-auto">
        {/* Mobil sarlavha: logo, sarlavha, kreslo surati to‘lqin bilan */}
        <div className="relative overflow-hidden lg:hidden">
          <div className={`absolute right-0 top-0 ${isLogin ? 'h-full w-[60%]' : 'h-[82%] w-[55%]'}`}>
            <img src="/images/landing/auth-clinic.jpg" alt="" className="size-full object-cover object-[60%_45%]" />
          </div>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden>
            {isLogin
              ? <path d="M-1 -1 H46 C36 30 40 62 62 80 C76 92 90 97 101 98 V101 H-1 Z" fill="#fff" />
              : <path d="M-1 -1 H48 C40 28 46 52 64 64 C78 74 92 76 101 76 V101 H-1 Z" fill="#fff" />}
          </svg>
          <div className={`relative px-6 pt-10 ${isLogin ? 'pb-16' : 'pb-8'}`}>
            <div className="flex items-start justify-between">
              <Link to="/" aria-label="StomaHub"><img src="/images/landing/logo-mark.png" alt="StomaHub" className={isLogin ? 'h-11 w-auto' : 'h-9 w-auto'} /></Link>
            </div>
            {isLogin ? (
              <>
                <h1 className="mt-8 max-w-[190px] text-[40px] font-extrabold leading-[1.1] tracking-tight text-[#0f2438]">Xush kelibsiz!</h1>
                <p className="mt-3 max-w-[180px] text-[17px] leading-snug text-[#5c6e80]">{t.title}.</p>
              </>
            ) : (
              <>
                <h1 className="relative mt-6 text-[26px] font-extrabold leading-tight tracking-tight text-[#0f2438]">{t.reg}</h1>
                <p className="mt-1.5 max-w-[230px] text-[13px] text-[#5c6e80]">{t.title}.</p>
              </>
            )}
            <span className="mt-5 block h-2 w-12 rounded-full bg-[#bfe6e0]" />
          </div>
        </div>

        <div className="flex min-h-full items-start justify-center lg:items-center lg:px-6 lg:py-6">
          <div className="relative w-full bg-white px-6 pb-8 lg:max-w-[520px] lg:rounded-[24px] lg:px-9 lg:py-8 lg:shadow-[0_16px_50px_rgb(16_50_48/0.07)]">
            <div className="absolute right-6 top-5 hidden lg:block">{langBtn}</div>

            <div className="hidden lg:block">
              <h2 className={`pr-32 font-extrabold tracking-tight text-[#0f2438] ${isLogin ? 'mt-14 text-[40px]' : 'mt-8 text-[34px]'}`}>{isLogin ? t.login : t.reg}</h2>
              <p className="mt-2 max-w-[360px] text-[14.5px] leading-relaxed text-[#5c6e80]">{isLogin ? t.loginLead : t.regLead}</p>
            </div>
            <form onSubmit={submit} className={`mt-5 ${isLogin ? 'space-y-5' : 'space-y-4'}`}>
              {!isLogin && <Field label={t.name} icon={UserRound} value={name} onChange={setName} placeholder={t.namePh} />}
              {isLogin ? (
                <Field label={t.id} icon={UserRound} value={id} onChange={setId} placeholder={t.idPh} big />
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  <label className="block">
                    <span className="text-[13.5px] font-semibold text-[#0f2438]">{t.phone}</span>
                    <span className="mt-1.5 flex h-12 items-center rounded-xl border border-[#e3eaee] bg-[#f7f9fa] focus-within:border-[#0F766E]">
                      <span className="flex h-full items-center gap-1.5 border-r border-[#e3eaee] px-3 text-[14px] text-[#24384d] lg:hidden">+998 <ChevronDown className="size-4 text-[#5c6e80]" /></span>
                      <Phone className="ml-3 size-[18px] shrink-0 text-[#7d8f99]" />
                      <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder={t.phonePh} className="min-w-0 flex-1 bg-transparent px-2.5 text-[14px] outline-none placeholder:text-[#9aa9b1]" />
                    </span>
                  </label>
                  <div>
                    <Field label={t.email} icon={Mail} value={email} onChange={(v) => { setEmail(v); if (emailErr) setEmailErr(emailProblem(v)) }} onBlur={() => email && setEmailErr(emailProblem(email))} placeholder={t.emailPh} type="email" invalid={!!emailErr} />
                    {emailErr && <p role="alert" className="mt-1 text-[12px] font-medium text-[#d14343]">{emailErr}</p>}
                  </div>
                </div>
              )}
              {!isLogin && (
                <label className="block">
                  <span className="text-[13.5px] font-semibold text-[#0f2438]">{t.spec}</span>
                  <span className="relative mt-1.5 flex h-12 items-center gap-2.5 rounded-xl border border-[#e3eaee] bg-[#f7f9fa] px-3.5 focus-within:border-[#0F766E]">
                    <Stethoscope className="size-[18px] text-[#7d8f99] lg:hidden" /><GraduationCap className="hidden size-[18px] text-[#7d8f99] lg:block" />
                    <select value={spec} onChange={(e) => setSpec(e.target.value)} className={`min-w-0 flex-1 appearance-none bg-transparent text-[14px] outline-none ${spec ? '' : 'text-[#7d8f99]'}`}>
                      <option value="">{t.specPh}</option>
                      {SPECS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none size-4 text-[#5c6e80]" />
                  </span>
                </label>
              )}
              {isLogin ? (
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[13.5px] font-semibold text-[#0f2438]">{t.pass}</span>
                    <button type="button" onClick={resetPassword} className="hidden text-[13px] font-semibold text-[#0F766E] lg:inline">{t.forgot}</button>
                  </div>
                  <Pass value={pass} onChange={setPass} placeholder={t.passPh} show={show} onToggle={() => setShow((v) => !v)} big />
                  <div className="mt-3 text-right lg:hidden"><button type="button" onClick={resetPassword} className="text-[14px] font-semibold text-[#0F766E]">{t.forgot}</button></div>
                  {forgot && <p className="mt-1.5 text-[12.5px] leading-snug text-[#5c6e80]">{t.forgotNote}</p>}
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  <label className="block">
                    <span className="text-[13.5px] font-semibold text-[#0f2438]">{t.pass}</span>
                    <span className="mt-1.5 block"><Pass value={pass} onChange={setPass} placeholder={t.passPh} show={show} onToggle={() => setShow((v) => !v)} /></span>
                  </label>
                  <label className="block">
                    <span className="text-[13.5px] font-semibold text-[#0f2438]">{t.pass2}</span>
                    <span className="mt-1.5 block"><Pass value={pass2} onChange={setPass2} placeholder={t.pass2Ph} show={show2} onToggle={() => setShow2((v) => !v)} /></span>
                  </label>
                </div>
              )}
              {!isLogin && (
                <label className="flex items-center gap-2.5 text-[13.5px] text-[#24384d]">
                  <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="size-[18px] accent-[#0F766E]" />
                  <span><span className="font-medium text-[#0F766E]">Foydalanish shartlariga</span> roziman</span>
                </label>
              )}
              {otpSent && isLogin && <Field label={t.code} icon={Lock} value={otp} onChange={setOtp} placeholder={t.codePh} />}
              {err && <p className="text-[13px] font-medium text-[#d14343]">{err}</p>}
              {info && <p className="text-[13px] font-medium text-[#0F766E]">{info}</p>}
              <button type="submit" disabled={busy} className={`flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#0F766E] font-semibold text-white hover:bg-[#0b5f59] disabled:opacity-60 ${isLogin ? 'h-14 text-[17px]' : 'h-[52px] text-[16px]'}`}>
                {isLogin ? <LogIn className="size-5" /> : <UserPlus className="size-5" />}
                {isLogin ? (emailFormatOk(id.trim()) || digits(id).length < 9 ? t.login : (otpSent ? t.code : t.sendCode)) : t.reg}
              </button>
            </form>

            <div className="my-4 flex items-center gap-4 text-[13px] text-[#7d8f99]">
              <span className="h-px flex-1 bg-[#e3eaee]" /> {t.or} <span className="h-px flex-1 bg-[#e3eaee]" />
            </div>
            <button type="button" onClick={google} disabled={busy} className={`flex w-full items-center justify-center gap-3 rounded-xl border border-[#0F766E]/70 bg-white font-semibold text-[#0f2438] hover:bg-[#f4faf9] disabled:opacity-60 ${isLogin ? 'h-14 text-[16px]' : 'h-12 text-[14.5px]'}`}>
              <GoogleMark /> {isLogin ? t.googleIn : t.googleUp}
            </button>
            {bot ? <div className="mt-3"><TelegramButton bot={bot} role={roleIntent} label={t.telegram} onError={setErr} onBusy={setBusy} /></div> : null}
            {bot && (
              <p className="mt-3 text-center text-[12.5px] text-[#5c6e80]">
                <a className="font-semibold text-[#0F766E]" href={`https://t.me/${bot}?start=link`} target="_blank" rel="noreferrer">{t.linkBot}</a>
              </p>
            )}
            <div className={`mt-6 flex items-center justify-center gap-3 rounded-2xl bg-[#effaf8] text-[14.5px] text-[#3d5168] ${isLogin ? 'h-[68px]' : 'h-14'}`}>
              {isLogin ? t.noAcc : t.hasAcc}
              <Link to={isLogin ? '/royxat' : '/kirish'} className="inline-flex items-center gap-1.5 font-semibold text-[#0F766E]">{isLogin ? t.toReg : t.login} <ArrowRight className="size-4" /></Link>
            </div>
            {/* Hisob turi: kirishda rol profildan avtomatik aniqlanadi; bu faqat yangi hisob uchun */}
            <p className="mt-4 text-center text-[12.5px] text-[#7d8f99]">
              {t.kind}:{' '}
              {[['customer', t.customer], ['organizer', t.organizer]].map(([key, label], k) => (
                <span key={key}>{k ? ' · ' : ''}<button type="button" onClick={() => setRoleIntent(key)} aria-pressed={roleIntent === key} className={roleIntent === key ? 'font-semibold text-[#0F766E]' : 'underline-offset-2 hover:underline'}>{label}</button></span>
              ))}
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export function AuthAside({ t }) {
  return (
    <aside className="relative hidden overflow-hidden bg-[#0d6f68] lg:block">
      <img src="/images/landing/auth-clinic.jpg" alt="" className="absolute inset-y-0 right-0 h-full w-[78%] object-cover object-[45%_center]" />
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden>
        <defs><linearGradient id="aside-g" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor="#0b6b64" /><stop offset="1" stopColor="#13887f" /></linearGradient></defs>
        <path d="M0 0 H86 C66 18 60 42 52 62 C46 78 36 90 26 100 H0 Z" fill="url(#aside-g)" />
      </svg>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white/40 to-transparent" />
      <div className="relative flex h-full flex-col px-10 py-12 text-white xl:px-14">
        <Link to="/" aria-label="StomaHub" className="inline-flex"><img src="/images/landing/logo-white-mark.png" alt="StomaHub" className="h-14 w-auto" /></Link>
        <h1 className="mt-14 max-w-[440px] text-[34px] font-extrabold leading-[1.2] tracking-tight xl:text-[38px]">{t.title}</h1>
        <p className="mt-5 max-w-[360px] text-[17px] leading-relaxed text-white/90">{t.lead}</p>
        <ul className="mt-9 space-y-6">
          {t.feats.map((label, i) => {
            const Icon = [GraduationCap, ShoppingCart, Users, ClipboardList][i]
            const words = label.split(' ')
            const cut = i === 2 ? 1 : 2
            return (
              <li key={label} className="flex items-center gap-4 text-[15.5px] font-medium leading-snug">
                <span className="grid size-[52px] shrink-0 place-items-center rounded-full bg-white/15 ring-1 ring-white/10"><Icon className="size-6" /></span>
                <span>{words.slice(0, cut).join(' ')}<br />{words.slice(cut).join(' ')}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}

function Field({ label, icon: Icon, value, onChange, onBlur, placeholder, type = 'text', invalid = false, big = false }) {
  return (
    <label className="block">
      <span className="text-[13.5px] font-semibold text-[#0f2438]">{label}</span>
      <span className={`mt-1.5 flex items-center gap-2.5 rounded-xl border bg-[#f7f9fa] px-3.5 focus-within:border-[#0F766E] ${big ? 'h-14' : 'h-12'} ${invalid ? 'border-[#d14343]' : 'border-[#e3eaee]'}`}>
        <Icon className="size-[19px] shrink-0 text-[#7d8f99]" />
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} aria-invalid={invalid || undefined} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#9aa9b1]" />
      </span>
    </label>
  )
}

function Pass({ value, onChange, placeholder, show, onToggle, big = false }) {
  return (
    <span className={`flex items-center gap-2.5 rounded-xl border border-[#e3eaee] bg-[#f7f9fa] px-3.5 focus-within:border-[#0F766E] ${big ? 'h-14' : 'h-12'}`}>
      <Lock className="size-[19px] shrink-0 text-[#7d8f99]" />
      <input type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#9aa9b1]" />
      <button type="button" onClick={onToggle} aria-label={show ? 'Yashirish' : 'Ko‘rsatish'} className="text-[#5c6e80]">
        {show ? <Eye className="size-[19px]" /> : <EyeOff className="size-[19px]" />}
      </button>
    </span>
  )
}

function TelegramButton({ bot, role, label, onError, onBusy }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!bot || !ref.current || !supabase) return undefined
    const host = ref.current
    host.innerHTML = ''
    window.onTelegramAuth = async (user) => {
      onBusy(true)
      onError('')
      try {
        const res = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user, role }),
        })
        const json = await res.json()
        if (!res.ok || !json.access_token) throw new Error(json.error || 'Telegram orqali kirib bo‘lmadi')
        const { error } = await supabase.auth.setSession({
          access_token: json.access_token,
          refresh_token: json.refresh_token,
        })
        if (error) throw error
      } catch (error) {
        onError(error.message)
        onBusy(false)
      }
    }
    const script = document.createElement('script')
    script.async = true
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-login', bot)
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-radius', '12')
    script.setAttribute('data-onauth', 'onTelegramAuth(user)')
    script.setAttribute('data-request-access', 'write')
    host.appendChild(script)
    return () => { delete window.onTelegramAuth }
  }, [bot, role, onError, onBusy])
  if (!bot) return null
  return (
    <div>
      <p className="mb-2 text-center text-[12.5px] font-semibold text-[#5c6e80]">{label}</p>
      <div ref={ref} className="flex min-h-10 justify-center" />
    </div>
  )
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.5Z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-5.9-2.2-6.9-5.1H1.3v3c2 4 6 6.7 10.7 6.7Z" />
      <path fill="#FBBC05" d="M5.1 14.3A7.2 7.2 0 0 1 4.7 12c0-.8.1-1.6.4-2.3V6.7H1.3A12 12 0 0 0 0 12c0 1.9.5 3.8 1.3 5.3l3.8-3Z" />
      <path fill="#EA4335" d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.3 0 3.3 2.7 1.3 6.7l3.8 3C6.1 7 8.8 4.8 12 4.8Z" />
    </svg>
  )
}
