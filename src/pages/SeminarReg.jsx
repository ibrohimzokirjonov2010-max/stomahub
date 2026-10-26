import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowRight, Calendar, CalendarPlus, Check, ChevronRight, CreditCard, Download, Info, Mail, MapPin, UserRound, X,
} from 'lucide-react'
import { seminarPage } from '../seminarsData'
import { som } from '../marketData'

const PAY = {
  click: 'https://my.click.uz/services/pay',
  payme: 'https://payme.uz',
}

const SPECS = ['Implantolog', 'Terapevt', 'Ortoped', 'Ortodont', 'Jarroh', 'Gigiyenist', 'Boshqa']
const CLINICS = ['DentAKI Clinic', 'EMU Universiteti', 'Nexus Clinic', 'Hyatt Regency', 'Boshqa']
const CITIES = ['Toshkent', 'Samarqand', 'Buxoro', 'Andijon', 'Namangan', "Farg‘ona", 'Nukus']

export default function SeminarReg() {
  const { id } = useParams()
  const seminar = seminarPage(id)
  const view = useMemo(() => profile(seminar), [seminar])
  const [step, setStep] = useState(1)
  const [method, setMethod] = useState('click')
  const [sheet, setSheet] = useState(true)
  const [form, setForm] = useState({ name: '', phone: '', email: '', spec: '', clinic: '', city: '' })
  const [error, setError] = useState('')
  const [paidAt, setPaidAt] = useState('')
  const [help, setHelp] = useState(false)
  const [sent, setSent] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const next = () => {
    if (!form.name.trim() || form.phone.replace(/\D/g, '').length < 9 || !form.email.includes('@') || !form.spec || !form.clinic || !form.city) {
      setError('F.I.Sh, telefon, email, mutaxassislik, klinika va shahar majburiy.')
      return
    }
    setError('')
    setMethod('click')
    setSheet(true)
    setStep(2)
  }

  const pick = (id) => {
    if (method === id && sheet && PAY[id]) {
      accept(id)
      return
    }
    setMethod(id)
    setSheet(true)
  }

  const accept = (id) => {
    const link = PAY[id]
    if (link) window.open(link, '_blank', 'noopener,noreferrer')
    const now = new Date()
    const months = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']
    const hh = String(now.getHours()).padStart(2, '0')
    const mm = String(now.getMinutes()).padStart(2, '0')
    setPaidAt(`${now.getDate()}-${months[now.getMonth()]} ${now.getFullYear()}, ${hh}:${mm}`)
    setMethod(id)
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
                    <input value={form.name} onChange={set('name')} placeholder="Masalan: Karimov Alisher Baxtiyorovich" className="w-full bg-transparent text-[13px] outline-none" />
                  </span>
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Telefon raqami" required>
                    <span className="flex h-11 items-center gap-2 rounded-xl border border-line px-2">
                      <span className="grid h-7 w-8 place-items-center rounded bg-[#f4f7fb] text-[14px]">🇺🇿</span>
                      <span className="text-[13px] font-semibold text-ink-2">+998</span>
                      <input value={form.phone} onChange={set('phone')} placeholder="90 123 45 67" className="w-full bg-transparent text-[13px] outline-none" inputMode="tel" />
                    </span>
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
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <Method id="click" on={method === 'click'} title="Click" text="Click orqali to‘lov" onClick={() => pick('click')} />
                <Method id="payme" on={method === 'payme'} title="Payme" text="Payme orqali to‘lov" onClick={() => pick('payme')} />
                <Method id="uzcard" on={method === 'uzcard'} title="Uzcard / Humo" text="Uzcard, Humo, Visa" onClick={() => pick('uzcard')} />
              </div>
              {sheet && method !== 'uzcard' && (
                <PaySheet
                  method={method}
                  amount={view.price}
                  order={view.order}
                  onClose={() => setSheet(false)}
                  onOther={() => setSheet(false)}
                  onPay={() => accept(method)}
                />
              )}
              {sheet && method === 'uzcard' && (
                <Uzcard amount={view.price} onClose={() => setSheet(false)} onPay={() => accept('uzcard')} />
              )}
            </section>
          )}

          {step === 3 && (
            <section className="mt-4 space-y-3">
              <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 shadow-card">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#e7f8f4] text-[#149e86]"><Check className="size-6" /></span>
                <div>
                  <b className="block text-[16px]">Siz seminarga ro‘yxatdan o‘tdingiz!</b>
                  <span className="text-[12.5px] text-muted">To‘lov muvaffaqiyatli amalga oshirildi. Quyida elektron chiptangiz va seminar tafsilotlari.</span>
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
                    <Qr seed={`${view.order}-${method}`} />
                    <b className="mt-1 text-[13px] text-sea">#{view.order}</b>
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
              <b className="text-[22px] text-[#149e86]">{som(view.price)}</b>
              <div className="mt-2 rounded-xl bg-[#e7f8f4] p-3 text-[12.5px]">
                <b className="mb-1 block">Narxga quyidagilar kiradi:</b>
                {includes.map((t) => <p key={t} className="mt-1 flex gap-1.5"><Check className="mt-0.5 size-3.5 shrink-0 text-[#149e86]" /> {t}</p>)}
              </div>
            </>
          ) : (
            <div className="mt-3 rounded-xl border border-line p-3 text-[12.5px]">
              <b className="mb-2 block">Buyurtma ma’lumotlari</b>
              <Row k="Buyurtma raqami" v={`#${view.order}`} />
              <Row k="To‘lov usuli" v={method === 'payme' ? 'Payme' : method === 'uzcard' ? 'Uzcard / Humo' : 'Click'} />
              <Row k="To‘lov sanasi" v={paidAt} />
              <Row k="Seminar narxi" v={som(view.price)} />
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
                  <textarea placeholder="Savolingizni yozing..." className="h-24 w-full rounded-xl border border-line px-3 py-2 text-[13px] outline-none" />
                  <button type="button" onClick={() => setSent(true)} className="mt-2 h-10 rounded-xl bg-sea px-4 text-[13px] font-semibold text-white">Yuborish</button>
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
    ['To‘lov', step > 2 ? 'To‘lov amalga oshirildi' : 'To‘lov usulini tanlang'],
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

function Method({ id, on, title, text, onClick }) {
  return (
    <button type="button" onClick={onClick} className="relative flex items-center gap-2 rounded-xl border bg-white px-3 py-3 text-left" style={{ borderColor: on ? '#149e86' : '#e7ecf3', boxShadow: on ? 'inset 0 0 0 1px #149e86' : 'none' }}>
      <Mark id={id} />
      <span className="min-w-0">
        <b className="block text-[13px]">{title}</b>
        <span className="block text-[11px] text-muted">{text}</span>
      </span>
      {on ? <span className="absolute right-2 top-2 grid size-4 place-items-center rounded-full bg-[#149e86] text-white"><Check className="size-3" /></span> : <span className="absolute right-2 top-2 size-4 rounded-full border border-line" />}
    </button>
  )
}

function Mark({ id }) {
  if (id === 'click') return <span className="grid size-9 place-items-center rounded-full bg-[#e7f8f4] text-[13px] font-bold text-[#149e86]">C</span>
  if (id === 'payme') return <span className="grid size-9 place-items-center rounded-lg bg-[#e7f8f4] text-[14px] font-bold text-[#12a150]">P</span>
  return <span className="grid size-9 place-items-center rounded-lg bg-[#f4f7fb] text-ink-2"><CreditCard className="size-4" /></span>
}

function PaySheet({ method, amount, order, onClose, onOther, onPay }) {
  const link = PAY[method]
  const brand = method === 'payme' ? 'Payme' : 'Click'
  const clock = new Date().toTimeString().slice(0, 5)
  return (
    <div className="relative mx-auto mt-4 max-w-[560px] rounded-2xl border border-line bg-white px-4 py-5 text-center shadow-card">
      <button type="button" onClick={onClose} className="absolute right-3 top-3 grid size-8 place-items-center rounded-lg text-muted" aria-label="Yopish"><X className="size-4" /></button>
      <button type="button" onClick={onPay} className="mx-auto grid place-items-center">
        <Mark id={method} />
        <b className="mt-1 text-[18px]">{brand}</b>
      </button>
      <p className="mt-3 text-[12px] text-muted">To‘lov summasi</p>
      <b className="block text-[26px]">{som(amount)}</b>
      <p className="text-[12px] text-muted">Buyurtma raqami: #{order}</p>
      <button type="button" onClick={onPay} className="mx-auto mt-3 grid size-40 place-items-center rounded-xl border border-line" aria-label={`${brand} to‘lov havolasi`}>
        <Qr seed={`${order}-${link}`} />
      </button>
      <p className="mx-auto mt-3 max-w-[380px] text-[12.5px] text-ink-2">Telefoningiz kamerasi yoki {brand} ilovasi bilan QR kodni skanerlang — to‘lov summasi avtomatik to‘ldiriladi.</p>
      <button type="button" onClick={onPay} className="mt-1 text-[12px] font-semibold text-sea">{link}</button>
      <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] text-muted">
        {['Skanerlang', 'Ilovada tasdiqlang', 'Tayyor'].map((t, i) => (
          <div key={t}>
            <span className="mx-auto grid size-6 place-items-center rounded-full bg-[#e7f8f4] text-[11px] font-bold text-[#149e86]">{i + 1}</span>
            <b className="mt-1 block text-ink">{t}</b>
            <span>{['QR kodni skanerlang', 'To‘lovni ilovada tasdiqlang', 'To‘lov avtomatik tasdiqlanadi'][i]}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-[12.5px] text-muted"><span className="size-2 rounded-full bg-[#f0b429]" /> To‘lov kutilmoqda...</span>
        <span className="text-[12px] text-muted">{clock}</span>
        <button type="button" onClick={onOther} className="h-9 rounded-xl border border-line px-3 text-[12px] font-semibold">Boshqa to‘lov usuli</button>
      </div>
    </div>
  )
}

function Uzcard({ amount, onClose, onPay }) {
  return (
    <div className="relative mx-auto mt-4 max-w-[560px] rounded-2xl border border-line bg-white px-4 py-5 shadow-card">
      <button type="button" onClick={onClose} className="absolute right-3 top-3" aria-label="Yopish"><X className="size-4 text-muted" /></button>
      <b className="block text-center text-[16px]">Uzcard / Humo</b>
      <p className="mt-1 text-center text-[13px] text-muted">To‘lov summasi {som(amount)}</p>
      <div className="mt-3 space-y-2">
        <input placeholder="Karta raqami" className="h-11 w-full rounded-xl border border-line px-3 text-[13px] outline-none" />
        <div className="grid grid-cols-2 gap-2">
          <input placeholder="MM/YY" className="h-11 rounded-xl border border-line px-3 text-[13px] outline-none" />
          <input placeholder="CVV" className="h-11 rounded-xl border border-line px-3 text-[13px] outline-none" />
        </div>
      </div>
      <button type="button" onClick={onPay} className="mt-3 h-11 w-full rounded-xl bg-[#149e86] text-[13px] font-semibold text-white">To‘lovni tasdiqlash</button>
    </div>
  )
}

function Qr({ seed }) {
  const n = 21
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  const cells = []
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const finder = (x < 7 && y < 7) || (x > n - 8 && y < 7) || (x < 7 && y > n - 8)
      let on = false
      if (finder) {
        const lx = x > n - 8 ? x - (n - 7) : x
        const ly = y > n - 8 ? y - (n - 7) : y
        on = lx === 0 || ly === 0 || lx === 6 || ly === 6 || (lx > 1 && lx < 5 && ly > 1 && ly < 5)
      } else {
        h = Math.imul(h ^ (x + y * 31), 16777619)
        on = (h & 3) !== 0
      }
      if (on) cells.push(`${x}-${y}`)
    }
  }
  return (
    <svg viewBox={`0 0 ${n} ${n}`} className="size-32">
      <rect width={n} height={n} fill="#fff" />
      {cells.map((c) => {
        const [x, y] = c.split('-')
        return <rect key={c} x={x} y={y} width="1" height="1" fill="#0b1f3a" />
      })}
    </svg>
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
  const brand = method === 'payme' ? 'Payme' : method === 'uzcard' ? 'Uzcard / Humo' : 'Click'
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
