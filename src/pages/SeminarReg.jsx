import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowRight, Calendar, CalendarPlus, Check, ChevronRight, Download, Info, Mail, MapPin, UserRound, X,
} from 'lucide-react'
import { buildSeminarPage } from '../seminarsData'
import { addMessage, publicRecord, quotePromo, useHub } from '../hubStore'
import { register } from '../components/mobile/seminarStore'
import { som } from '../marketData'
import LiveQr from '../components/LiveQr'
import { tashkentWhen } from '../time'
import PhoneInput, { extractUzLocalDigits, isCompleteUzPhone, PHONE_INCOMPLETE_MSG, toE164 } from '../components/PhoneInput'

const SPECS = ['Implantolog', 'Terapevt', 'Ortoped', 'Ortodont', 'Jarroh', 'Gigiyenist', 'Boshqa']
const CLINICS = ['DentAKI Clinic', 'EMU Universiteti', 'Nexus Clinic', 'Hyatt Regency', 'Boshqa']
const CITIES = ['Toshkent', 'Samarqand', 'Buxoro', 'Andijon', 'Namangan', "Farg‘ona", 'Nukus']

export default function SeminarReg() {
  const { id } = useParams()
  const hub = useHub()
  const rec = publicRecord(id, hub)
  const seminar = rec ? buildSeminarPage(rec) : null
  const view = useMemo(() => (seminar ? profile(seminar) : null), [seminar])
  const [step, setStep] = useState(1)
  const [method, setMethod] = useState('click')
  const [pending, setPending] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', spec: '', clinic: '', city: '' })
  const [error, setError] = useState('')
  const [paidAt, setPaidAt] = useState('')
  const [pass, setPass] = useState(null)
  const [help, setHelp] = useState(false)
  const [sent, setSent] = useState(false)
  const [helpText, setHelpText] = useState('')
  const [promo, setPromo] = useState('')
  const [promoMsg, setPromoMsg] = useState('')
  const [discount, setDiscount] = useState(0)
  const [planId, setPlanId] = useState(() => seminar?.plans?.find((p) => /standart/i.test(p.name))?.id || seminar?.plans?.[0]?.id || '')
  if (!seminar || !view) {
    return (
      <div className="py-16 text-center">
        <p className="text-[18px] font-bold text-ink">Seminar topilmadi</p>
        <Link to="/seminarlar" className="mt-3 inline-block text-[13px] font-semibold text-sea">Seminarlarga qaytish</Link>
      </div>
    )
  }
  if (seminar.cancelled) {
    return (
      <div className="py-16 text-center">
        <p className="text-[18px] font-bold text-ink">Seminar bekor qilingan</p>
        <p className="mt-1 text-[13px] text-muted">Ro‘yxatdan o‘tish yopiq.</p>
        <Link to={`/seminarlar/${id}`} className="mt-3 inline-block text-[13px] font-semibold text-sea">Seminar sahifasi</Link>
      </div>
    )
  }
  const plan = seminar.plans.find((p) => p.id === planId) || seminar.plans[0]
  const amount = Math.max(0, plan.price - discount)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const next = () => {
    if (!form.name.trim() || form.phone.replace(/\D/g, '').length < 9 || !form.email.includes('@') || !form.spec || !form.clinic || !form.city) {
      setError('F.I.Sh, telefon, email, mutaxassislik, klinika va shahar majburiy.')
      return
    }
    setError('')
    // Bepul chipta: to‘lov bosqichisiz darhol tasdiqlanadi.
    if (amount === 0) { accept('free'); return }
    setMethod('cash')
    setStep(2)
  }

  const applyCode = () => {
    const q = quotePromo(promo, id, plan.price)
    if (!q.ok) { setDiscount(0); setPromoMsg(q.error); return }
    setDiscount(q.discount)
    setPromoMsg(`Chegirma qo‘llandi: ${som(q.discount)}`)
  }

  const accept = async (payId, opts = {}) => {
    let res
    try {
      res = await register(id, {
      name: form.name.trim(),
      phone: form.phone,
      email: form.email,
      clinic: form.clinic,
      city: form.city,
      spec: form.spec,
      ticketName: plan.name,
      methodLabel: payId === 'free' ? 'Bepul' : 'Naqd',
      gross: plan.price,
      promo: discount ? promo.trim() : '',
      title: view.title,
      plan: 'Standart',
      price: amount,
    })
    } catch (error) {
      setError(error?.message || 'To‘lov amalga oshmadi')
      return
    }
    if (!res?.ok) { setError(res?.error || 'To‘lov amalga oshmadi'); return }
    setPass(res.info || null)
    // To‘lov hech qachon mijoz tomonida "to‘landi" deb belgilanmaydi: pullik chipta tashkilotchi tasdiqlaguncha kutilmoqda.
    setPending(amount > 0 || !!res.pending)
    setPaidAt(tashkentWhen(new Date()))
    setMethod(payId)
    setStep(3)
  }

  const includes = step === 1 ? view.includes : view.includesMore

  return (
    <div className="pb-6 pt-3">
      <nav className="flex flex-wrap items-center gap-1.5 text-[12px] text-muted">
        <Link to="/seminarlar" className="hover:text-sea">Seminarlar</Link>
        <ChevronRight className="size-3.5" />
        <span className={step === 3 ? 'hover:text-sea' : 'font-medium text-ink'}>Seminarga ro‘yxatdan o‘tish</span>
        {step === 3 && <><ChevronRight className="size-3.5" /><span className="font-medium text-ink">Tasdiqlandi</span></>}
      </nav>

      <div className="sem-reg mt-3">
        <div className="min-w-0">
          <h1 className="text-[26px] font-extrabold leading-tight text-ink">Seminarga ro‘yxatdan o‘tish</h1>
          <p className="mt-1 text-[13px] text-muted">{view.title}</p>
          <Stepper step={step} />

          {step === 1 && (
            <section className="mt-4 rounded-2xl border border-line bg-white p-4 shadow-card">
              <h2 className="flex items-center gap-2 text-[15px] font-bold"><UserRound className="size-4 text-sea" /> Shaxsiy ma’lumotlar</h2>
              <p className="mt-1 text-[12.5px] text-muted">Seminarga ro‘yxatdan o‘tish uchun quyidagi ma’lumotlarni to‘ldiring</p>
              <div className="mt-4 space-y-3">
                <Field label="F.I.Sh" required>
                  <span className="flex h-11 items-center gap-2 rounded-xl border border-line px-3">
                    <UserRound className="size-4 text-muted" />
                    <input value={form.name} onChange={set('name')} placeholder="Masalan: Ism Familiya" className="w-full bg-transparent text-[13px] outline-none" />
                  </span>
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                                    <Field label="Telefon raqami" required>
                    <PhoneInput
                      className="h-11 rounded-xl border border-line px-2"
                      inputClassName="text-[13px]"
                      value={form.phone}
                      onChange={(v) => setForm((f) => ({ ...f, phone: extractUzLocalDigits(v) }))}
                      valueMode="local"
                      placeholder="+998 90 123 45 67"
                    />
                  </Field>
                  <Field label="Email manzil" required>
                    <span className="flex h-11 items-center gap-2 rounded-xl border border-line px-3">
                      <Mail className="size-4 text-muted" />
                      <input value={form.email} onChange={set('email')} placeholder="example@email.com" className="w-full bg-transparent text-[13px] outline-none" />
                    </span>
                  </Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Mutaxassislik" required>
                    <select value={form.spec} onChange={set('spec')} className="h-11 w-full rounded-xl border border-line bg-white px-3 text-[13px]">
                      <option value="">Mutaxassisligingizni tanlang</option>
                      {SPECS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="Klinika" required>
                    <select value={form.clinic} onChange={set('clinic')} className="h-11 w-full rounded-xl border border-line bg-white px-3 text-[13px]">
                      <option value="">Klinika nomi</option>
                      {CLINICS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Shahar" required>
                  <span className="flex h-11 items-center gap-2 rounded-xl border border-line px-3">
                    <MapPin className="size-4 text-muted" />
                    <select value={form.city} onChange={set('city')} className="w-full bg-transparent text-[13px] outline-none">
                      <option value="">Shaharni tanlang</option>
                      {CITIES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </span>
                </Field>
              </div>
              {error && <p className="mt-3 text-[12px] font-semibold text-[#e11d48]">{error}</p>}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="flex max-w-[360px] gap-2 rounded-xl bg-[#e7f8f4] px-3 py-2 text-[12px] text-[#0f766e]"><Info className="mt-0.5 size-4 shrink-0" /> Muhim ma’lumot. Kiritilgan ma’lumotlar sertifikatda ko‘rsatiladi. Iltimos, ma’lumotlaringizni aniq kiriting.</p>
                <button type="button" onClick={next} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#149e86] px-5 text-[13px] font-semibold text-white">Davom etish <ArrowRight className="size-4" /></button>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="mt-4">
              <h2 className="text-[16px] font-bold">To‘lov usulini tanlang</h2>
              {seminar.organizer && seminar.plans.length > 1 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {seminar.plans.map((p) => (
                    <button key={p.id} type="button" onClick={() => { setPlanId(p.id); setDiscount(0); setPromoMsg('') }} className={`h-10 rounded-xl border px-3 text-[12.5px] font-semibold ${p.id === plan.id ? 'border-[#149e86] bg-[#e7f8f4] text-[#0f766e]' : 'border-line bg-white text-ink'}`}>
                      {p.name} · {som(p.price)}
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input value={promo} onChange={(e) => { setPromo(e.target.value.toUpperCase()); setPromoMsg('') }} placeholder="Promokod" className="h-11 w-40 rounded-xl border border-line px-3 text-[13px] uppercase outline-none" />
                <button type="button" onClick={applyCode} className="h-11 rounded-xl bg-[#0b6d73] px-4 text-[13px] font-semibold text-white">Qo‘llash</button>
                {promoMsg && <span className="text-[12.5px] text-[#0f766e]">{promoMsg}</span>}
                {discount > 0 && <span className="text-[12.5px] text-muted line-through">{som(view.price)}</span>}
              </div>
              <div data-testid="pay-pending-note" className="mt-3 rounded-xl border border-[#f5d48a] bg-[#fff8e6] px-3 py-3 text-[13px] text-ink-2">
                <b className="block text-ink">To‘lov: naqd yoki o‘tkazma — tashkilotchi orqali</b>
                Onlayn to‘lov hozircha ulanmagan. Ro‘yxatdan o‘tganingizdan so‘ng arizangiz <b>“To‘lov kutilmoqda”</b> holatida bo‘ladi; tashkilotchi to‘lovni qabul qilib, tasdiqlaydi.
              </div>
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <button type="button" onClick={() => setStep(1)} className="h-10 rounded-xl border border-line px-4 text-[13px] font-semibold">Orqaga</button>
                <button type="button" data-testid="reg-submit-pending" onClick={() => accept('cash')} className="h-10 rounded-xl bg-[#149e86] px-4 text-[13px] font-semibold text-white">Ro‘yxatdan o‘tish</button>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="mt-4 space-y-3">
              <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 shadow-card">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#e7f8f4] text-[#149e86]"><Check className="size-6" /></span>
                <div>
                  <b className="block text-[16px]">Siz seminarga ro‘yxatdan o‘tdingiz!</b>
                  <span className="text-[12.5px] text-muted">{pending ? 'To‘lov kutilmoqda: tashkilotchi naqd/o‘tkazma to‘lovni qabul qilgach, chiptangiz tasdiqlanadi.' : amount === 0 ? 'Bepul chipta — ro‘yxatdan o‘tish tasdiqlandi. Quyida elektron chiptangiz.' : 'Quyida elektron chiptangiz va seminar tafsilotlari.'}</span>
                </div>
              </div>
              <article className="rounded-2xl border border-line bg-white p-4 shadow-card">
                <div className="flex items-center justify-between text-[11px] font-semibold tracking-wide text-muted">
                  <span className="inline-flex items-center gap-1 text-sea"><Tooth /> StomaHub</span>
                  ELEKTRON CHIPTA
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)_140px]">
                  <img src={view.banner} alt="" className="h-[140px] w-full rounded-xl object-cover" />
                  <div className="min-w-0">
                    <b className="block text-[16px] leading-snug">{view.longTitle}</b>
                    <p className="mt-2 flex items-center gap-2 text-[12.5px]"><img src={view.avatar} alt="" className="size-6 rounded-full object-cover" /> {view.doctor}<span className="text-muted">{view.role}</span></p>
                    <p className="mt-1 flex items-center gap-2 text-[12.5px] text-ink-2"><Calendar className="size-4 text-sea" /> {view.when}</p>
                    <p className="mt-1 flex items-center gap-2 text-[12.5px] text-ink-2"><MapPin className="size-4 text-sea" /> {view.place}<span className="text-muted">{view.address}</span></p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {view.tags.map((t) => <span key={t} className="rounded-md bg-[#e7f6f4] px-2 py-0.5 text-[11px] font-semibold text-sea">{t}</span>)}
                    </div>
                  </div>
                  <div className="grid place-items-center text-center">
                    <LiveQr text={pass?.checkin || `STH:${view.order}`} className="size-32" />
                    <b className="mt-1 text-[13px] text-sea">#{pass?.order || view.order}</b>
                    <span className="text-[10px] text-muted">Seminar kirish chiptasi</span>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <button type="button" onClick={() => downloadTicket(view, form, method, paidAt)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#149e86] text-[12.5px] font-semibold text-white"><Download className="size-4" /> Chiptani yuklab olish</button>
                  <button type="button" onClick={() => downloadIcs(view)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-line text-[12.5px] font-semibold"><CalendarPlus className="size-4" /> Kalendarga qo‘shish</button>
                  <Link to="/seminarlar" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-line text-[12.5px] font-semibold"><UserRound className="size-4" /> Mening seminarlarim</Link>
                </div>
              </article>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#e7f8f4] px-4 py-3 text-[12.5px] text-[#0f766e]">
                <p className="flex gap-2"><Info className="mt-0.5 size-4 shrink-0" /> Seminar kuni elektron chiptangizni (QR kod) yoki ro‘yxatdan o‘tishda ko‘rsatgan telefon raqamingizni ko‘rsating. Savollar bo‘lsa, biz bilan bog‘laning.</p>
                <button type="button" onClick={() => setHelp(true)} className="inline-flex h-9 items-center rounded-xl border border-[#b7e3d8] bg-white px-3 text-[12px] font-semibold text-sea">Qo‘llab-quvvatlash</button>
              </div>
            </section>
          )}
        </div>

        <aside className="min-w-0 rounded-2xl border border-line bg-white p-3 shadow-card">
          <h2 className="flex items-center gap-2 text-[14px] font-bold"><Calendar className="size-4 text-sea" /> Seminar haqida</h2>
          <div className="relative mt-2 h-[148px] overflow-hidden rounded-xl bg-[#08343c]">
            <img src={view.banner} alt="" className="h-full w-full object-cover opacity-80" />
            <img src={view.avatar} alt="" className="absolute bottom-0 right-3 h-[132px] w-[92px] object-cover object-top" />
            <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold">{view.format}</span>
          </div>
          <p className="mt-2 text-[11px] font-semibold text-sea">{view.kicker}</p>
          <b className="mt-0.5 block text-[16px] leading-snug">{step === 1 ? view.title : view.longTitle}</b>
          <p className="mt-2 flex items-center gap-2 text-[12.5px]"><img src={view.avatar} alt="" className="size-7 rounded-full object-cover" /><span><b className="block">{view.doctor}</b><span className="text-[11px] text-muted">{view.role}</span></span></p>
          <p className="mt-2 flex items-start gap-2 text-[12.5px] text-ink-2"><Calendar className="mt-0.5 size-4 shrink-0 text-sea" /> {view.when}</p>
          <p className="mt-1 flex items-start gap-2 text-[12.5px] text-ink-2"><MapPin className="mt-0.5 size-4 shrink-0 text-sea" /><span>{view.place}<span className="block text-[11px] text-muted">{view.address}</span></span></p>
          {step < 3 ? (
            <>
              <p className="mt-3 text-[12px] text-muted">Seminar narxi</p>
              <b className="text-[22px] text-[#149e86]">{som(amount)}</b>
              <div className="mt-2 rounded-xl bg-[#e7f8f4] p-3 text-[12.5px]">
                <b className="mb-1 block">Narxga quyidagilar kiradi:</b>
                {includes.map((t) => <p key={t} className="mt-1 flex gap-1.5"><Check className="mt-0.5 size-3.5 shrink-0 text-[#149e86]" /> {t}</p>)}
              </div>
            </>
          ) : (
            <div className="mt-3 rounded-xl border border-line p-3 text-[12.5px]">
              <b className="mb-2 block">Buyurtma ma’lumotlari</b>
              <Row k="Buyurtma raqami" v={`#${pass?.order || view.order}`} />
              <Row k="To‘lov usuli" v={amount === 0 ? 'Bepul' : 'Naqd / o‘tkazma'} />
              <Row k="To‘lov holati" v={pending ? 'To‘lov kutilmoqda' : 'Tasdiqlangan'} />
              <Row k="Ro‘yxat sanasi" v={paidAt} />
              <Row k="Seminar narxi" v={som(amount)} />
            </div>
          )}
        </aside>
      </div>

      {help && (
        <div className="bemor-shade" onClick={() => setHelp(false)}>
          <div className="bemor-dialog" style={{ width: 'min(420px, 100%)' }} onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="help-title">
            <div className="bemor-dialog-head flex items-center justify-between px-4 py-3">
              <h2 id="help-title" className="text-[16px] font-bold">Qo‘llab-quvvatlash</h2>
              <button type="button" onClick={() => setHelp(false)} aria-label="Yopish"><X className="size-4" /></button>
            </div>
            <div className="bemor-dialog-body px-4 pb-4">
              {sent ? <p className="text-[13px]">Xabaringiz qabul qilindi. Operator telefon raqamingizga bog‘lanadi.</p> : (
                <>
                  <textarea value={helpText} onChange={(e) => setHelpText(e.target.value)} placeholder="Savolingizni yozing..." className="h-24 w-full rounded-xl border border-line px-3 py-2 text-[13px] outline-none" />
                  {error && help && <p className="mt-1 text-[12px] text-[#e11d48]">{error}</p>}
                  <button type="button" onClick={() => { if (helpText.trim().length < 5) { setError('Xabar kamida 5 ta belgidan iborat bo‘lsin'); return } addMessage(helpText.trim()); setError(''); setHelpText(''); setSent(true) }} className="mt-2 h-10 rounded-xl bg-sea px-4 text-[13px] font-semibold text-white">Yuborish</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function profile(d) {
  if (d.id === 'implant-toj') {
    return {
      kicker: 'Implantologiya',
      title: 'Implantologiya: nazariya va klinik amaliyot',
      longTitle: 'Zamonaviy implantologiya: nazariya va klinik amaliyot',
      price: 1500000,
      doctor: 'Dr. Sardor Karimov',
      role: 'Implantolog',
      when: '24-noyabr 2026, 10:00 – 16:00',
      place: 'Toshkent, Hyatt Regency',
      address: 'Toshkent shahri, Navoi ko‘chasi, 1A',
      format: 'Offlayn',
      banner: d.hero,
      avatar: d.speaker.avatar,
      order: 'SEM-2041',
      includes: ['Seminarda ishtirok', 'Xorijiy ma’ruzachining materiallari', 'Elektron sertifikat'],
      includesMore: ['Seminarda ishtirok', 'Xorijiy ma’ruzachining materiallari', 'Elektron sertifikat', 'Kofe-breyk va tushlik'],
      tags: ['Implantologiya', 'Nazariya', 'Klinik amaliyot', 'Amaliyot'],
    }
  }
  return {
    kicker: d.catName,
    title: d.title,
    longTitle: d.title,
    price: d.plans[0].price,
    doctor: d.speaker.name,
    role: d.speaker.role,
    when: `${d.whenTitle}, ${d.whenText}`,
    place: `${d.whereTitle}, ${d.venue.name}`,
    address: d.venue.address,
    format: d.modeTitle.includes('Online') ? 'Onlayn' : 'Offlayn',
    banner: d.hero,
    avatar: d.speaker.avatar,
    order: `SEM-${String(d.price || 1000).slice(0, 4)}`,
    includes: ['Seminarda ishtirok', 'Materiallar', 'Elektron sertifikat'],
    includesMore: ['Seminarda ishtirok', 'Materiallar', 'Elektron sertifikat', 'Kofe-breyk'],
    tags: [d.catName, 'Nazariya', 'Amaliyot'],
  }
}

function Stepper({ step }) {
  const items = [
    ['Ma’lumotlar', step > 1 ? 'Shaxsiy ma’lumotlar kiritildi' : 'Shaxsiy ma’lumotlaringizni kiriting'],
    ['To‘lov', step > 2 ? 'Ariza qabul qilindi' : 'Naqd / o‘tkazma'],
    [step === 3 ? 'Tasdiqlandi' : 'Tasdiqlash', step === 3 ? 'Siz seminarga ro‘yxatdan o‘tdingiz' : 'Ma’lumotlarni tekshiring, tasdiqlang'],
  ]
  return (
    <ol className="mt-4 grid grid-cols-3 gap-2">
      {items.map(([title, text], i) => {
        const n = i + 1
        const done = step > n
        const on = step === n
        return (
          <li key={title} className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`grid size-7 shrink-0 place-items-center rounded-full text-[12px] font-bold ${done || on ? 'bg-[#149e86] text-white' : 'bg-[#e8eef5] text-muted'}`}>{done ? <Check className="size-3.5" /> : n}</span>
              {n < 3 && <span className={`h-px flex-1 ${step > n ? 'bg-[#149e86]' : 'bg-[#e8eef5]'}`} />}
            </div>
            <b className={`mt-1 block text-[12.5px] ${on || done ? 'text-ink' : 'text-muted'}`}>{title}</b>
            <span className="block text-[11px] text-muted">{text}</span>
          </li>
        )
      })}
    </ol>
  )
}

function Field({ label, required, children }) {
  return (
    <label className="block text-[12.5px] font-semibold">
      {label} {required && <span className="text-[#e11d48]">*</span>}
      <div className="mt-1.5 font-normal">{children}</div>
    </label>
  )
}

function Row({ k, v }) {
  return <div className="mt-1.5 flex items-center justify-between gap-2"><span className="text-muted">{k}</span><b>{v}</b></div>
}

function Tooth() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
      <path d="M8 3c2 0 2.5 1.4 4 1.4S14 3 16 3c2.6 0 4.5 2.2 4.5 5 0 2.6-.8 5-1.8 7.2-.8 1.8-1.6 4-2.4 5.2-.6.8-1.6.2-1.8-.8L14 16h-1.2l-.6 3.6c-.2 1-1.2 1.6-1.8.8-.8-1.2-1.6-3.4-2.4-5.2C6.3 13 5.5 10.6 5.5 8 5.5 5.2 7.4 3 8 3z" />
    </svg>
  )
}

function downloadTicket(view, form, method, paidAt) {
  const brand = method === 'free' ? 'Bepul' : 'Naqd / o‘tkazma (to‘lov tashkilotchi tasdiqlaydi)'
  const text = `StomaHub elektron chipta\n#${view.order}\n${view.longTitle}\n${view.doctor}\n${view.when}\n${view.place}, ${view.address}\n${form.name}\n+998 ${form.phone}\n${brand}\n${paidAt}\n${som(view.price)}\n`
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${view.order}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

function downloadIcs(view) {
  const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${view.longTitle}\nLOCATION:${view.place}, ${view.address}\nDESCRIPTION:${view.doctor}\nEND:VEVENT\nEND:VCALENDAR\n`
  const blob = new Blob([ics], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${view.order}.ics`
  a.click()
  URL.revokeObjectURL(url)
}
