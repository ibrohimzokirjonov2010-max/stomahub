import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { BookOpen, ChevronDown, Eye, EyeOff, GraduationCap, Lock, LogIn, Mail, Phone, ShoppingCart, UserPlus, UserRound, Users } from 'lucide-react'
import { profileStore, useProfile } from '../profileStore'
import { retryHub } from '../hubStore'
import { supabase } from '../supabaseClient'
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
const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

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
    if (!emailOk(raw)) {
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
    if (!supabase) return setErr(t.errSupabase)
    if (mode === 'login') {
      const raw = id.trim()
      if (emailOk(raw)) {
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
    if (!emailOk(email)) return setErr(t.errEmail)
    if (!spec) return setErr(t.errSpec)
    if (pass.length < 6) return setErr(t.errPass)
    if (pass !== pass2) return setErr(t.errMatch)
    if (!terms) return setErr(t.errTerms)
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
      finishing.current = false
      setBusy(false)
      setInfo(t.confirmEmail)
      return
    }
    try {
      const role = await applyAccount({ forceRole: true })
      navigate(destination(role), { replace: true })
    } catch (signError) {
      finishing.current = false
      setErr(signError.message)
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen bg-[#f3faf8] lg:h-[calc(100dvh/var(--z))] lg:min-h-0 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)] lg:overflow-hidden">
      <aside className="relative hidden overflow-hidden bg-[#0c7f7a] lg:block">
        <img src="/images/jihozlar/fengdan.jpg" alt="" className="absolute inset-0 size-full object-cover object-[78%_center]" />
        <div className="absolute inset-y-0 left-0 w-[68%] bg-[#0e8b84]" style={{ clipPath: 'ellipse(78% 85% at 8% 50%)' }} />
        <div className="relative flex h-full flex-col px-10 py-10 text-white xl:px-14">
          <Link to="/" aria-label="StomaHub" className="inline-flex">
            <img src="/images/logo.png" alt="" className="h-10 w-auto brightness-0 invert" />
          </Link>
          <h1 className="mt-14 max-w-[420px] text-[40px] font-extrabold leading-[1.12] tracking-tight xl:text-[46px]">{t.title}</h1>
          <p className="mt-4 max-w-[380px] text-[16px] leading-relaxed text-white/90">{t.lead}</p>
          <ul className="mt-10 space-y-4">
            {t.feats.map((label, i) => {
              const Icon = [GraduationCap, ShoppingCart, Users, BookOpen][i]
              return (
                <li key={label} className="flex items-center gap-3 text-[15px] font-medium">
                  <span className="grid size-10 place-items-center rounded-full bg-white/15"><Icon className="size-5" /></span>
                  {label}
                </li>
              )
            })}
          </ul>
        </div>
      </aside>

      <main className="overflow-y-auto">
        <div className="flex min-h-full items-center justify-center px-4 py-6">
        <div className="relative w-full max-w-[460px] rounded-[28px] bg-white px-6 py-7 shadow-[0_16px_50px_rgb(16_50_48/0.08)] sm:px-8">
          <div className="absolute right-5 top-5">
            <button type="button" onClick={() => setOpenLang((v) => !v)} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#e3ecea] px-3 text-[12.5px] font-semibold text-[#3d5168]">
              <span className="text-[#0b8a84]">A</span> {t.lang} <ChevronDown className="size-3.5" />
            </button>
            {openLang && (
              <div className="absolute right-0 z-10 mt-1 w-36 overflow-hidden rounded-xl border border-[#e6eef2] bg-white shadow-lg">
                {Object.entries(COPY).map(([key, item]) => (
                  <button key={key} type="button" onClick={() => { setLang(key); setOpenLang(false); setErr('') }} className={`block w-full px-3 py-2 text-left text-[13px] hover:bg-[#f3faf8] ${key === lang ? 'font-semibold text-[#0b8a84]' : ''}`}>{item.lang}</button>
                ))}
              </div>
            )}
          </div>

          <h2 className="pr-28 text-[32px] font-extrabold tracking-tight text-[#10283f]">{mode === 'login' ? t.login : t.reg}</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-[#5c6e80]">{mode === 'login' ? t.loginLead : t.regLead}</p>
          <div className="mt-4">
            <span className="text-[13px] font-semibold text-[#17324d]">{t.kind}</span>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {[['customer', t.customer], ['organizer', t.organizer]].map(([key, label]) => (
                <button key={key} type="button" onClick={() => setRoleIntent(key)} className={`h-10 rounded-xl border text-[13.5px] font-semibold ${roleIntent === key ? 'border-[#0d8a84] bg-[#e8f7f5] text-[#0b8a84]' : 'border-[#e3ecea] text-[#3d5168]'}`}>{label}</button>
              ))}
            </div>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-3.5">
            {mode === 'register' && <Field label={t.name} icon={UserRound} value={name} onChange={setName} placeholder={t.namePh} />}
            {mode === 'login' ? (
              <Field label={t.id} icon={UserRound} value={id} onChange={setId} placeholder={t.idPh} />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t.phone} icon={Phone} value={phone} onChange={setPhone} placeholder={t.phonePh} />
                <Field label={t.email} icon={Mail} value={email} onChange={setEmail} placeholder={t.emailPh} type="email" />
              </div>
            )}
            {mode === 'register' && (
              <label className="block">
                <span className="text-[13px] font-semibold text-[#17324d]">{t.spec}</span>
                <span className="mt-1.5 flex h-12 items-center gap-2 rounded-xl border border-[#e3ecea] px-3 focus-within:border-[#0b8a84]">
                  <GraduationCap className="size-[18px] text-[#8aa0a8]" />
                  <select value={spec} onChange={(e) => setSpec(e.target.value)} className="min-w-0 flex-1 bg-transparent text-[14px] outline-none">
                    <option value="">{t.specPh}</option>
                    {SPECS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </span>
              </label>
            )}
            {mode === 'login' ? (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-[#17324d]">{t.pass}</span>
                  <button type="button" onClick={resetPassword} className="text-[12.5px] font-semibold text-[#0b8a84]">{t.forgot}</button>
                </div>
                <Pass value={pass} onChange={setPass} placeholder={t.passPh} show={show} onToggle={() => setShow((v) => !v)} />
                {forgot && <p className="mt-1.5 text-[12.5px] leading-snug text-[#5c6e80]">{t.forgotNote}</p>}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[13px] font-semibold text-[#17324d]">{t.pass}</span>
                  <span className="mt-1.5 block"><Pass value={pass} onChange={setPass} placeholder={t.passPh} show={show} onToggle={() => setShow((v) => !v)} /></span>
                </label>
                <label className="block">
                  <span className="text-[13px] font-semibold text-[#17324d]">{t.pass2}</span>
                  <span className="mt-1.5 block"><Pass value={pass2} onChange={setPass2} placeholder={t.pass2Ph} show={show2} onToggle={() => setShow2((v) => !v)} /></span>
                </label>
              </div>
            )}
            {mode === 'register' && (
              <label className="flex items-center gap-2 text-[13.5px] text-[#17324d]">
                <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="size-4 accent-[#0b8a84]" />
                {t.terms}
              </label>
            )}
                {otpSent && mode === 'login' && (
                  <Field label={t.code} icon={Lock} value={otp} onChange={setOtp} placeholder={t.codePh} />
                )}
                {err && <p className="text-[13px] font-medium text-[#d14343]">{err}</p>}
                {info && <p className="text-[13px] font-medium text-[#0b8a84]">{info}</p>}
                <button type="submit" disabled={busy} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0d8a84] text-[15px] font-semibold text-white hover:bg-[#08756f] disabled:opacity-60">
              {mode === 'login' ? <LogIn className="size-[18px]" /> : <UserPlus className="size-[18px]" />}
              {mode === 'login' ? (emailOk(id.trim()) || digits(id).length < 9 ? t.login : (otpSent ? t.code : t.sendCode)) : t.reg}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3 text-[12.5px] text-[#8aa0a8]">
            <span className="h-px flex-1 bg-[#e6eeec]" /> {t.or} <span className="h-px flex-1 bg-[#e6eeec]" />
          </div>
          <button type="button" onClick={google} disabled={busy} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#dbe6e4] text-[14.5px] font-semibold text-[#17324d] hover:bg-[#f7fbfa] disabled:opacity-60">
            <GoogleMark /> {mode === 'login' ? t.googleIn : t.googleUp}
          </button>
          {bot ? (
            <div className="mt-3">
              <TelegramButton bot={bot} role={roleIntent} label={t.telegram} onError={setErr} onBusy={setBusy} />
            </div>
          ) : null}
          {bot && (
            <p className="mt-3 text-center text-[12.5px] text-[#5c6e80]">
              <a className="font-semibold text-[#0b8a84]" href={`https://t.me/${bot}?start=link`} target="_blank" rel="noreferrer">{t.linkBot}</a>
            </p>
          )}
          <p className="mt-5 text-center text-[13.5px] text-[#5c6e80]">
            {mode === 'login' ? t.noAcc : t.hasAcc}{' '}
            <Link to={mode === 'login' ? '/royxat' : '/kirish'} className="font-semibold text-[#0b8a84]">{mode === 'login' ? t.toReg : t.login}</Link>
          </p>
        </div>
        </div>
      </main>
    </div>
  )
}

function Field({ label, icon: Icon, value, onChange, placeholder, type = 'text' }) {
  return (
    <label className="block">
      <span className="text-[13px] font-semibold text-[#17324d]">{label}</span>
      <span className="mt-1.5 flex h-12 items-center gap-2 rounded-xl border border-[#e3ecea] px-3 focus-within:border-[#0b8a84]">
        <Icon className="size-[18px] shrink-0 text-[#8aa0a8]" />
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#9aafb4]" />
      </span>
    </label>
  )
}

function Pass({ value, onChange, placeholder, show, onToggle }) {
  return (
    <span className="flex h-12 items-center gap-2 rounded-xl border border-[#e3ecea] px-3 focus-within:border-[#0b8a84]">
      <Lock className="size-[18px] shrink-0 text-[#8aa0a8]" />
      <input type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#9aafb4]" />
      <button type="button" onClick={onToggle} aria-label={show ? 'Yashirish' : 'Ko‘rsatish'} className="text-[#8aa0a8]">
        {show ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
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
