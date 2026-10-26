import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Bell, Building, CalendarCheck, CalendarDays, CalendarPlus, ChartPie, Check, ChevronDown, ChevronLeft,
  Coins, CreditCard, Crown, Download, FileBadge, FileText, Hash, Info, LoaderCircle, MapPin, ShieldCheck, ShoppingCart, Tag,
  Ticket, UserRound, Users, Video, X,
} from 'lucide-react'
import { seminarView, som } from '../../seminarsData'
import { publicRecord, quotePromo, useHub } from '../../hubStore'
import { useCart } from '../../cart'
import { BrandLogo, MobileToast, CountBadge } from './parts'
import MobileTabBar from './MobileTabBar'
import { BottomSheet } from './MobileSeminars'
import { downloadIcs } from './MobileSeminar'
import { register, useSeminarStore } from './seminarStore'

const CITIES = ['Toshkent', 'Samarqand', 'Buxoro', 'Andijon', 'Namangan', 'Farg‘ona', 'Qarshi', 'Nukus', 'Urganch', 'Termiz']
const SPECS = ['Implantolog', 'Terapevt', 'Ortoped', 'Ortodont', 'Jarroh', 'Endodontist', 'Parodontolog', 'Bolalar stomatologi', 'Gigiyenist', 'Talaba']
const YEARS = ['1 yildan kam', ...Array.from({ length: 19 }, (_, i) => String(i + 1)), '20+']
const MONTH_NAMES = { YAN: 'yanvar', FEV: 'fevral', MAR: 'mart', APR: 'aprel', MAY: 'may', IYN: 'iyun', IYL: 'iyul', AVG: 'avgust', SEN: 'sentabr', OKT: 'oktabr', NOY: 'noyabr', DEK: 'dekabr' }
const METHODS = {
  click: ['Click', 'Click orqali to‘lov qilish'],
  payme: ['Payme', 'Payme orqali to‘lov qilish'],
  uzum: ['Uzum Bank', 'Uzum Bank orqali to‘lov'],
  card: ['Bank kartasi', 'Uzcard, Humo, Visa'],
  split: ['Bo‘lib to‘lash', 'Muddatli to‘lov (3-12 oy)'],
}
const SPLITS = [3, 6, 12]
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const page = 'bg-[linear-gradient(180deg,#eef8f7_0%,#f6faf9_40%,#f6faf9_100%)]'
const card = 'rounded-2xl bg-white shadow-[0_1px_6px_rgb(11_31_58/0.06)]'

export default function MobileSeminarReg() {
  const { id } = useParams()
  const hub = useHub()
  const rec = publicRecord(id, hub)
  const seminar = rec ? seminarView(rec) : null
  if (!seminar) return <div className="px-4 py-16 text-center text-[15px] font-bold">Seminar topilmadi</div>
  if (seminar.cancelled) return <div className="px-4 py-16 text-center text-[15px] font-bold">Seminar bekor qilingan</div>
  return <RegView key={id} id={id} seminar={seminar} />
}

function info(s) {
  const month = MONTH_NAMES[s.mon]
  const d = Number(s.day)
  const year = s.monthKey.slice(0, 4)
  const [start] = s.time.split('–').map((t) => t.trim())
  const days = s.days > 1 ? `${d}–${d + s.days - 1}` : d
  const online = s.format.includes('jonli') || s.online
  const offline = !s.online
  const base = { offline: s.price, online: s.plans.find((p) => p.id === 'online')?.price || s.price }
  return {
    when: `${d}-${month} ${year}, ${start}`,
    whenFull: `${days}-${month} ${year}, ${s.time}`,
    place: s.online ? 'Online (Zoom)' : `${s.city}, ${s.venue.name}`,
    address: s.online ? 'Havola email orqali yuboriladi' : `${s.city === 'Toshkent' ? 'Toshkent shahri' : s.city}${s.venue.address !== s.city ? `, ${s.venue.address.replace(/^Toshkent sh\.,\s*/, '')}` : ''}`,
    formats: { offline, online },
    base,
    vip: Math.round((s.price * 0.47) / 100000) * 100000,
  }
}

function RegView({ id, seminar }) {
  const s = seminar
  const m = info(s)
  const navigate = useNavigate()
  const store = useSeminarStore()
  const reg = store.registered[s.id]
  const [step, setStep] = useState(reg?.order ? 3 : 1)
  const [form, setForm] = useState({ name: '', phone: '', email: '', city: s.online ? 'Toshkent' : s.city, clinic: '', spec: 'Implantolog', years: '3', diploma: '' })
  const [format, setFormat] = useState(m.formats.offline ? 'offline' : 'online')
  const [ticket, setTicket] = useState('standart')
  const [cert, setCert] = useState(true)
  const [agree, setAgree] = useState(true)
  const [tried, setTried] = useState(false)
  const [method, setMethod] = useState('click')
  const [months, setMonths] = useState(6)
  const [cardNo, setCardNo] = useState({ num: '', exp: '' })
  const [payTried, setPayTried] = useState(false)
  const [promo, setPromo] = useState('')
  const [promoErr, setPromoErr] = useState('')
  const [applied, setApplied] = useState(null)
  const [paying, setPaying] = useState(false)
  const [terms, setTerms] = useState(false)
  const [toast, setToast] = useState('')
  const closeToast = useCallback(() => setToast(''), [])
  const formRef = useRef(null)

  useEffect(() => { window.scrollTo(0, 0) }, [step])

  const orgStd = s.organizer ? s.plans?.find((p) => /standart/i.test(p.name)) || s.plans?.[0] : null
  const orgVip = s.organizer ? s.plans?.find((p) => /vip/i.test(p.name)) : null
  const price = orgStd ? orgStd.price : m.base[format]
  const vip = ticket === 'vip' ? (orgVip ? Math.max(0, orgVip.price - price) : (orgStd ? 0 : m.vip)) : 0
  const subtotal = price + vip
  const discount = applied?.discount || 0
  const total = subtotal - discount
  const monthly = Math.ceil(total / months / 1000) * 1000
  const payNow = method === 'split' ? monthly : total

  const phone = form.phone.replace(/\D/g, '')
  const errors = {
    name: form.name.trim().length < 3 && 'F.I.Sh kiriting',
    phone: phone.length !== 9 && 'Raqamni to‘liq kiriting',
    email: !EMAIL.test(form.email.trim()) && 'Email noto‘g‘ri',
    agree: !agree && 'Shartlarga rozilik bering',
  }
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const toPay = () => {
    setTried(true)
    const bad = Object.keys(errors).find((k) => errors[k])
    if (bad) {
      const el = formRef.current?.querySelector(`[data-f="${bad}"]`)
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' })
      return
    }
    setStep(2)
  }

  const cardDigits = cardNo.num.replace(/\D/g, '')
  const [mm, yy] = cardNo.exp.split('/').map(Number)
  const now = new Date()
  const expOk = mm >= 1 && mm <= 12 && yy >= 0 && (2000 + yy > now.getFullYear() || (2000 + yy === now.getFullYear() && mm >= now.getMonth() + 1))
  const cardErr = method === 'card' && { num: cardDigits.length !== 16 && 'Karta raqami 16 ta raqam', exp: !expOk && 'Muddat noto‘g‘ri' }

  const applyPromo = () => {
    const q = quotePromo(promo, s.id, subtotal)
    if (!q.ok) { setPromoErr(q.error); setApplied(null); return }
    setApplied({ code: promo.trim().toUpperCase(), discount: q.discount })
    setPromoErr('')
    setToast(`Promokod qo‘llandi: −${q.discount.toLocaleString('ru-RU')} so‘m`)
  }

  const pay = () => {
    setPayTried(true)
    if (cardErr && (cardErr.num || cardErr.exp)) return
    setPaying(true)
  }

  const confirmPaid = useCallback(async () => {
    const count = Object.values(store.registered).filter((r) => r.order).length
    const at = new Date()
    let res
    try {
      res = await register(s.id, {
      order: `SEM-${2041 + count}`,
      plan: `${ticket === 'vip' ? 'VIP' : 'Standart'} · ${format === 'online' ? 'Onlayn' : 'Oflayn'}`,
      ticket, ticketName: ticket === 'vip' ? 'VIP' : 'Standart', format, cert, method,
      methodLabel: METHODS[method]?.[0] || 'Click',
      months: method === 'split' ? months : 0,
      name: form.name.trim(), phone, email: form.email.trim(),
      city: form.city, clinic: form.clinic, spec: form.spec,
      gross: subtotal, price: total, paid: payNow, promo: applied?.code || '',
      title: s.title,
      at: at.toISOString(),
    })
    } catch (error) {
      setPaying(false)
      setPromoErr(error?.message || 'To‘lov amalga oshmadi')
      return
    }
    if (!res?.ok) { setPaying(false); setPromoErr(res?.error || 'To‘lov amalga oshmadi'); return }
    setPaying(false)
    setStep(3)
  }, [store.registered, s.id, ticket, format, cert, method, months, form, phone, total, payNow, applied])

  const back = () => {
    if (step === 2) setStep(1)
    else if (window.history.length > 1) navigate(-1)
    else navigate(`/seminarlar/${s.id}`)
  }

  if (step === 3 && reg) return <Done s={s} m={m} reg={reg} />

  return (
    <div className={`min-h-screen ${page} pb-[100px]`}>
      <header className="sticky top-0 z-30 bg-[#eef8f7]/95 px-3.5 pb-2 pt-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <button type="button" onClick={back} aria-label="Orqaga" className="grid size-9 shrink-0 place-items-center rounded-full text-[#0d2a4a] active:bg-white/70">
            <ArrowLeft className="size-[22px]" />
          </button>
          <div className="min-w-0">
            <BrandLogo className="h-7" />
            <p className="mt-1 text-[12.5px] text-ink-2">Seminarga ro‘yxatdan o‘tish</p>
          </div>
        </div>
        <Steps step={step} />
      </header>

      <div className="px-3.5">
        <SeminarCard s={s} m={m} />

        {step === 1 ? (
          <div ref={formRef} className={`${card} mt-3 px-3.5 pb-3.5`}>
            <Section icon={UserRound} title="Shaxsiy ma’lumotlar" first />
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="F.I.SH" f="name" err={tried && errors.name}>
                <input value={form.name} onChange={set('name')} autoComplete="name" placeholder="Ibrohim Zokirjonov" className={input} />
              </Field>
              <Field label="Telefon raqami" f="phone" err={tried && errors.phone}>
                <span className="mt-0.5 flex h-8 items-center gap-1 rounded-lg bg-white px-1.5">
                  <UzFlag />
                  <span className="text-[12px] font-medium text-ink">+998</span>
                  <input inputMode="tel" autoComplete="tel-national" value={fmtPhone(form.phone)} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 9) }))} placeholder="90 123 45 67" className="min-w-0 flex-1 bg-transparent text-[11.5px] text-ink outline-none placeholder:text-[#a3b3b9]" />
                </span>
              </Field>
              <Field label="Email manzil" f="email" err={tried && errors.email}>
                <input type="email" inputMode="email" autoComplete="email" value={form.email} onChange={set('email')} placeholder="example@mail.com" className={input} />
              </Field>
              <Field label="Shahar">
                <Select value={form.city} options={CITIES} onChange={set('city')} label="Shahar" />
              </Field>
              <Field label="Klinika nomi">
                <input value={form.clinic} onChange={set('clinic')} placeholder="Dent Smile Clinic" className={input} />
              </Field>
              <Field label="Mutaxassisligi">
                <Select value={form.spec} options={SPECS} onChange={set('spec')} label="Mutaxassisligi" />
              </Field>
              <Field label="Ish tajribasi (yil)">
                <Select value={form.years} options={YEARS} onChange={set('years')} label="Ish tajribasi" />
              </Field>
              <Field label="Diplom raqami" opt>
                <input value={form.diploma} onChange={set('diploma')} placeholder="Masalan: № 123456" className={input} />
              </Field>
            </div>

            <Section icon={Users} title="Ishtirok turi" />
            <div className="grid grid-cols-2 gap-2.5">
              <Option on={format === 'offline'} disabled={!m.formats.offline} onClick={() => setFormat('offline')} icon={Building} title="Oflayn" text={m.formats.offline ? 'Joyida ishtirok etish' : 'Mavjud emas'} />
              <Option on={format === 'online'} disabled={!m.formats.online} onClick={() => setFormat('online')} icon={Video} title="Onlayn" text={m.formats.online ? 'Onlayn qatnashish' : 'Bu seminarda yo‘q'} />
            </div>

            <Section icon={Ticket} title="Chipta turi" />
            <div className="grid grid-cols-2 gap-2.5">
              <Option tall on={ticket === 'standart'} onClick={() => setTicket('standart')} icon={Tag} title="Standart" text={format === 'online' ? 'Jonli efir, yozuvlar 3 oy, materiallar' : 'Seminarga kirish, materiallar, kofe-breyk'} price={som(price)} />
              <Option tall on={ticket === 'vip'} onClick={() => setTicket('vip')} icon={Crown} title="VIP" text={format === 'online' ? 'Jonli efir, yozuvlar 12 oy, shaxsiy savol-javob, sertifikat' : 'Seminarga kirish, premium o‘rin, maxsus materiallar, sertifikat, tushlik'} price={som(price + m.vip)} />
            </div>

            <Section icon={FileText} title="Qo‘shimcha imkoniyatlar" />
            <CheckRow on={cert} onChange={setCert} title="Sertifikat kerak" text="Seminar yakunida elektron sertifikat beriladi" />

            <Section icon={ShieldCheck} title="Rozilik" />
            <div data-f="agree">
              <CheckRow on={agree} onChange={setAgree} err={tried && errors.agree} title="Shartlarga roziman" text={<>Seminar qatnashish shartlari va <button type="button" onClick={(e) => { e.preventDefault(); setTerms(true) }} className="font-medium text-sea underline underline-offset-2">qaytarish siyosati</button> bilan tanishdim</>} />
              {tried && errors.agree && <p className="ml-8 mt-1 text-[11px] text-sale">{errors.agree}</p>}
            </div>
          </div>
        ) : (
          <>
            <div className={`${card} mt-3 px-3.5 pb-3.5`}>
              <Section icon={CreditCard} title="To‘lov usulini tanlang" first />
              <div className="grid grid-cols-2 gap-2.5">
                {Object.keys(METHODS).map((k) => (
                  <Method key={k} id={k} on={method === k} onClick={() => { setMethod(k); setPayTried(false) }} />
                ))}
              </div>
              {method === 'card' && (
                <div className="mt-3 grid grid-cols-[1fr_96px] gap-2.5">
                  <Field label="Karta raqami" err={payTried && cardErr.num}>
                    <input inputMode="numeric" autoComplete="cc-number" value={cardDigits.replace(/(\d{4})(?=\d)/g, '$1 ')} onChange={(e) => setCardNo((c) => ({ ...c, num: e.target.value.replace(/\D/g, '').slice(0, 16) }))} placeholder="8600 0000 0000 0000" className={input} />
                  </Field>
                  <Field label="Muddati" err={payTried && cardErr.exp}>
                    <input inputMode="numeric" autoComplete="cc-exp" value={cardNo.exp} onChange={(e) => { const d = e.target.value.replace(/\D/g, '').slice(0, 4); setCardNo((c) => ({ ...c, exp: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d })) }} placeholder="OO/YY" className={input} />
                  </Field>
                </div>
              )}
              {method === 'split' && (
                <div className="mt-3 rounded-xl bg-[#f3faf9] p-3">
                  <p className="text-[12px] font-semibold text-ink">Muddatni tanlang</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {SPLITS.map((n) => (
                      <button key={n} type="button" aria-pressed={months === n} onClick={() => setMonths(n)} className={`h-10 rounded-xl border text-[12.5px] font-semibold ${months === n ? 'border-[#0b6d73] bg-[#0b6d73] text-white' : 'border-[#dbecea] bg-white text-ink'}`}>{n} oy</button>
                    ))}
                  </div>
                  <p className="mt-2 text-[11.5px] text-ink-2">Oyiga <b className="text-[#0b6d73]">{som(monthly)}</b> · {months} oy davomida, ustama 0%</p>
                </div>
              )}
            </div>

            <div className={`${card} mt-3 px-3.5 pb-3.5`}>
              <Section icon={Tag} title="Promokod" first />
              {applied ? (
                <div className="flex h-11 items-center gap-2 rounded-xl border border-[#bfe3dd] bg-[#eef8f6] px-3">
                  <Check className="size-4 text-[#0b6d73]" />
                  <span className="flex-1 text-[13px] font-semibold text-[#0b6d73]">{applied.code} · −{applied.pct}%</span>
                  <button type="button" onClick={() => { setApplied(null); setPromo('') }} aria-label="Promokodni olib tashlash" className="grid size-7 place-items-center rounded-full text-ink-2"><X className="size-4" /></button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2.5">
                    <input value={promo} onChange={(e) => { setPromo(e.target.value); setPromoErr('') }} onKeyDown={(e) => e.key === 'Enter' && applyPromo()} placeholder="Promokod kiriting" className={`h-11 min-w-0 flex-1 rounded-xl border bg-[#f7fbfb] px-3 text-[13px] uppercase text-ink outline-none placeholder:normal-case placeholder:text-[#a3b3b9] focus:border-sea ${promoErr ? 'border-sale' : 'border-[#dbecea]'}`} />
                    <button type="button" onClick={applyPromo} className="h-11 shrink-0 rounded-xl bg-[#0b6d73] px-5 text-[13px] font-semibold text-white active:scale-95">Qo‘llash</button>
                  </div>
                  {promoErr && <p className="mt-1 text-[11px] text-sale">{promoErr}</p>}
                </>
              )}
            </div>

            <div className={`${card} mt-3 px-3.5 pb-3.5`}>
              <Section icon={FileText} title="Buyurtma xulosasi" first />
              <div className="space-y-2.5 text-[13px]">
                <SumRow k={`Seminar narxi${format === 'online' ? ' (onlayn)' : ''}`} v={som(price)} />
                <SumRow k="VIP paket" v={som(vip)} />
                <SumRow k={`Chegirma (promokod)`} v={discount ? `−${som(discount)}` : som(0)} green />
                {method === 'split' && <SumRow k={`Bo‘lib to‘lash (${months} oy)`} v={`${som(monthly)} / oy`} />}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                <span className="text-[14px] font-bold text-[#0d2a4a]">Jami summa</span>
                <span className="text-[19px] font-extrabold text-[#0b6d73]">{som(total)}</span>
              </div>
            </div>

            <div className="mt-3 flex gap-3 rounded-2xl border border-[#d5ecea] bg-[#eef8f7] p-3.5">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#0b6d73] text-white"><Info className="size-4" /></span>
              <p className="text-[12px] leading-snug text-ink-2"><b className="font-semibold text-[#0d2a4a]">To‘lovdan so‘ng elektron chipta (QR kodi) {cert ? 'va sertifikat' : ''}</b> sizning email manzilingizga va Telegram orqali yuboriladi.</p>
            </div>
          </>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 rounded-t-2xl border-t border-line bg-white px-3.5 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-6px_18px_rgb(11_31_58/0.06)]">
        <div className="min-w-0 flex-1">
          <p className="text-[11.5px] text-ink-2">{step === 1 ? 'Jami summa' : method === 'split' ? `1-oy to‘lovi (${months} oydan)` : 'To‘lov summasi'}</p>
          <p className="whitespace-nowrap text-[19px] font-extrabold leading-tight text-[#0b6d73]">{som(step === 1 ? subtotal : payNow)}</p>
        </div>
        {step === 1 ? (
          <button type="button" onClick={toPay} className="flex h-[52px] w-[58%] flex-col items-center justify-center rounded-xl bg-[#0b6d73] text-white shadow-[0_6px_16px_rgb(11_109_115/0.3)] active:scale-[0.98]">
            <span className="flex items-center gap-1.5 text-[14px] font-semibold">To‘lovga o‘tish <ArrowRight className="size-4" /></span>
            <span className="text-[10.5px] text-white/80">2-bosqich: to‘lov</span>
          </button>
        ) : (
          <button type="button" onClick={pay} className="flex h-[52px] w-[58%] items-center justify-center gap-1.5 rounded-xl bg-[#0b6d73] px-2 text-[13.5px] font-semibold text-white shadow-[0_6px_16px_rgb(11_109_115/0.3)] active:scale-[0.98]">
            <span className="truncate">To‘lash {som(payNow)}</span> <ArrowRight className="size-4 shrink-0" />
          </button>
        )}
      </div>

      {paying && <Paying method={method} amount={payNow} onCancel={() => setPaying(false)} onDone={confirmPaid} />}
      {terms && (
        <BottomSheet title="Qatnashish shartlari" onClose={() => setTerms(false)} footer={<button type="button" onClick={() => { setAgree(true); setTerms(false) }} className="h-12 flex-1 rounded-xl bg-[#0b6d73] text-[14px] font-semibold text-white">Tanishdim, roziman</button>}>
          <ul className="mt-2 space-y-2.5 text-[12.5px] leading-snug text-ink-2">
            {[
              'Seminar boshlanishidan 48 soat oldin bekor qilsangiz, to‘lov to‘liq qaytariladi.',
              '48 soatdan kam vaqt qolganda to‘lovning 50% qaytariladi yoki chipta keyingi seminarga o‘tkaziladi.',
              'Chiptani boshqa shifokorga o‘tkazish uchun kamida 24 soat oldin qo‘llab-quvvatlash xizmatiga yozing.',
              'Sertifikat seminarda to‘liq qatnashgan ishtirokchilarga beriladi.',
              'Bo‘lib to‘lashda keyingi oylik to‘lovlar har oyning shu sanasida avtomatik yechiladi.',
            ].map((t) => <li key={t} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-sea" /> {t}</li>)}
          </ul>
        </BottomSheet>
      )}
      <MobileToast text={toast} onClose={closeToast} bottom={96} />
    </div>
  )
}

const input = 'mt-0.5 h-8 w-full min-w-0 bg-transparent text-[13px] text-ink outline-none placeholder:text-[12.5px] placeholder:text-[#a3b3b9]'

function fmtPhone(v) {
  const d = v.replace(/\D/g, '').slice(0, 9)
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(' ')
}

function Steps({ step }) {
  const items = ['Ma’lumotlar', 'To‘lov']
  return (
    <div className="mt-3 flex items-center gap-2 px-1">
      {items.map((label, i) => {
        const n = i + 1
        const done = step > n
        const on = step >= n
        return (
          <div key={label} className={`flex items-center gap-2 ${i === 0 ? 'flex-1' : ''}`}>
            <span className={`grid size-8 shrink-0 place-items-center rounded-full text-[13px] font-bold ${on ? 'bg-[#0b6d73] text-white' : 'bg-[#e3ebee] text-muted'}`}>
              {done ? <Check className="size-4" strokeWidth={3} /> : n}
            </span>
            <span className={`text-[13px] ${on ? 'font-medium text-[#0d2a4a]' : 'text-muted'}`}>{label}</span>
            {i === 0 && (
              <span className="relative ml-1 h-[3px] flex-1 overflow-hidden rounded-full bg-[#dfe8ea]">
                <span className={`absolute inset-y-0 left-0 rounded-full bg-[#0b6d73] transition-all duration-500 ${step > 1 ? 'w-full' : 'w-1/2'}`} />
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function SeminarCard({ s, m }) {
  return (
    <div className={`${card} mt-2 flex gap-3 p-2.5`}>
      <img src={s.image} alt="" className="h-[118px] w-[118px] shrink-0 rounded-xl object-cover" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1">
          <span className="rounded-full bg-[#e3f4f1] px-2 py-0.5 text-[9.5px] font-medium text-[#0b6d73]">{s.catName}</span>
          <span className="ml-auto flex gap-1">
            {m.formats.offline && <span className="rounded-full bg-[#e3f4f1] px-2 py-0.5 text-[9.5px] font-medium text-[#0b6d73]">Oflayn</span>}
            {m.formats.online && <span className="rounded-full bg-[#e3f4f1] px-2 py-0.5 text-[9.5px] font-medium text-[#0b6d73]">Online</span>}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-[14.5px] font-bold leading-tight text-[#0d2a4a]">{s.title}</p>
        <p className="mt-1 flex items-center gap-1.5 truncate text-[11px] text-ink-2"><UserRound className="size-3.5 shrink-0" /> <span className="truncate">{s.speaker.name}</span></p>
        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-2"><CalendarDays className="size-3.5 shrink-0" /> {m.when}</p>
        <div className="mt-0.5 flex items-end justify-between gap-1">
          <p className="flex min-w-0 items-center gap-1.5 text-[11px] text-ink-2"><MapPin className="size-3.5 shrink-0" /> <span className="truncate">{m.place}</span></p>
        </div>
        <div className="mt-1 text-right">
          <p className="text-[14.5px] font-extrabold leading-none text-[#0b6d73]">{som(s.price)}</p>
          <p className="text-[9.5px] text-muted">Boshlang‘ich narx</p>
        </div>
      </div>
    </div>
  )
}

function Section({ icon: Icon, title, first }) {
  return (
    <div className={`flex items-center gap-2.5 pb-2.5 ${first ? 'pt-3.5' : 'mt-4 border-t border-line pt-3.5'}`}>
      <Icon className="size-[19px] text-[#0b6d73]" strokeWidth={1.8} />
      <h2 className="text-[14.5px] font-bold text-[#0d2a4a]">{title}</h2>
    </div>
  )
}

function Field({ label, opt, f, err, children }) {
  return (
    <div data-f={f} className="min-w-0">
      <label className={`relative block rounded-xl border px-2.5 pb-1 pt-2 transition focus-within:border-sea ${err ? 'border-sale bg-[#fff7f7]' : 'border-[#dbecea] bg-[#f7fbfb]'}`}>
        <span className="block truncate text-[11px] text-ink-2">{label}{opt && <span className="text-muted"> (ixtiyoriy)</span>}</span>
        {children}
      </label>
      {err && <p className="mt-0.5 text-[10.5px] text-sale">{err}</p>}
    </div>
  )
}

function Select({ value, options, onChange, label }) {
  return (
    <>
      <span className="mt-0.5 flex h-8 items-center justify-between rounded-lg bg-white px-2 text-[13px] text-ink">
        <span className="truncate">{value}</span>
        <ChevronDown className="size-4 shrink-0 text-ink-2" />
      </span>
      <select value={value} onChange={onChange} aria-label={label} className="absolute inset-0 size-full cursor-pointer opacity-0">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </>
  )
}

function Radio({ on }) {
  return on
    ? <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#0b6d73] text-white"><Check className="size-3" strokeWidth={3.5} /></span>
    : <span className="block size-5 shrink-0 rounded-full border-[1.5px] border-[#9fb0b6]" />
}

function Option({ on, disabled, onClick, icon: Icon, title, text, price, tall }) {
  return (
    <button type="button" aria-pressed={on} disabled={disabled} onClick={onClick} className={`relative flex gap-2 rounded-xl border p-2.5 text-left transition disabled:opacity-45 ${tall ? 'items-start' : 'items-center'} ${on ? 'border-[#0b6d73] bg-[#eef8f6] shadow-[inset_0_0_0_1px_#0b6d73]' : 'border-[#dbe5e8] bg-white'}`}>
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e3f4f1] text-[#0b6d73]"><Icon className="size-[18px]" strokeWidth={1.7} /></span>
      <span className="min-w-0 flex-1 pr-5">
        <span className={`block text-[13px] font-bold ${on ? 'text-[#0b6d73]' : 'text-[#0d2a4a]'}`}>{title}</span>
        <span className="mt-0.5 block text-[10px] leading-snug text-ink-2">{text}</span>
        {price && <span className="mt-1.5 block whitespace-nowrap text-[13.5px] font-extrabold text-[#0d2a4a]">{price}</span>}
      </span>
      <span className="absolute right-2 top-2.5"><Radio on={on} /></span>
    </button>
  )
}

function CheckRow({ on, onChange, title, text, err }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5">
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <span className={`mt-0.5 grid size-[22px] shrink-0 place-items-center rounded-md border-[1.5px] transition ${on ? 'border-[#0b6d73] bg-[#0b6d73] text-white' : err ? 'border-sale bg-white' : 'border-[#9fb0b6] bg-white'}`}>
        {on && <Check className="size-3.5" strokeWidth={3.5} />}
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-medium text-[#0d2a4a]">{title}</span>
        <span className="block text-[11px] leading-snug text-ink-2">{text}</span>
      </span>
    </label>
  )
}

export function PayLogo({ id, size = 'size-9' }) {
  if (id === 'click') return <span className={`grid ${size} shrink-0 place-items-center rounded-full bg-[#00a7b5] text-[13px] font-black italic text-white`}>C!</span>
  if (id === 'payme') return <span className={`grid ${size} shrink-0 place-items-center rounded-full bg-[#1bb3a5] text-[16px] font-black text-white`}>P</span>
  if (id === 'uzum') return <span className={`grid ${size} shrink-0 place-items-center rounded-full bg-[#7000ff] text-[16px] font-black text-white`}>U</span>
  if (id === 'card') return <span className={`grid ${size} shrink-0 place-items-center rounded-full bg-[#e3f4f1] text-[#0b6d73]`}><CreditCard className="size-[18px]" /></span>
  return <span className={`grid ${size} shrink-0 place-items-center rounded-full bg-[#e3f4f1] text-[#0b6d73]`}><ChartPie className="size-[18px]" /></span>
}

function Method({ id, on, onClick }) {
  const [title, text] = METHODS[id]
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={`relative flex items-start gap-2 rounded-xl border p-2.5 text-left transition ${on ? 'border-[#0b6d73] bg-[#eef8f6] shadow-[inset_0_0_0_1px_#0b6d73]' : 'border-[#dbe5e8] bg-white'}`}>
      <PayLogo id={id} size="size-8" />
      <span className="min-w-0 flex-1">
        <span className={`block whitespace-nowrap pr-5 text-[12.5px] font-bold ${on ? 'text-[#0b6d73]' : 'text-[#0d2a4a]'}`}>{title}</span>
        <span className="mt-0.5 block text-[10px] leading-snug text-ink-2">{text}</span>
        {id === 'card' && (
          <span className="mt-1 flex gap-1">
            <span className="rounded bg-[#0a4d8c] px-1 text-[7.5px] font-extrabold leading-[14px] text-white">UZCARD</span>
            <span className="rounded bg-[#1c8a3e] px-1 text-[7.5px] font-extrabold leading-[14px] text-white">HUMO</span>
            <span className="text-[10px] font-black italic leading-[14px] text-[#1a1f71]">VISA</span>
          </span>
        )}
      </span>
      <span className="absolute right-2 top-2"><Radio on={on} /></span>
    </button>
  )
}

function SumRow({ k, v, green }) {
  return (
    <p className="flex items-center justify-between gap-3">
      <span className="text-ink-2">{k}</span>
      <span className={`whitespace-nowrap font-semibold ${green ? 'text-[#16a34a]' : 'text-[#0d2a4a]'}`}>{v}</span>
    </p>
  )
}

function UzFlag() {
  return (
    <svg viewBox="0 0 20 14" className="h-3 w-[18px] shrink-0 overflow-hidden rounded-[2px]" aria-hidden="true">
      <rect width="20" height="14" fill="#fff" />
      <rect width="20" height="4.4" fill="#1eb4e6" />
      <rect y="9.6" width="20" height="4.4" fill="#1eb53a" />
      <rect y="4.4" width="20" height="0.5" fill="#ce1126" />
      <rect y="9.1" width="20" height="0.5" fill="#ce1126" />
      <circle cx="3.6" cy="2.2" r="1.4" fill="#fff" />
      <circle cx="4.1" cy="2.2" r="1.25" fill="#1eb4e6" />
    </svg>
  )
}

function Paying({ method, amount, onCancel, onDone }) {
  const [phase, setPhase] = useState(0)
  const done = useRef(onDone)
  done.current = onDone
  useEffect(() => {
    const a = setTimeout(() => setPhase(1), 900)
    const b = setTimeout(() => setPhase(2), 1900)
    const c = setTimeout(() => done.current(), 2500)
    return () => { clearTimeout(a); clearTimeout(b); clearTimeout(c) }
  }, [])
  const steps = [`${METHODS[method][0]} bilan bog‘lanilmoqda`, 'To‘lov tasdiqlanmoqda', 'Chipta tayyorlanmoqda']
  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end bg-ink/45">
      <div role="dialog" aria-modal="true" aria-label="To‘lov" className="rounded-t-3xl bg-white px-5 pb-[calc(18px+env(safe-area-inset-bottom))] pt-5 text-center">
        <div className="mx-auto w-fit"><PayLogo id={method} size="size-12" /></div>
        <p className="mt-2 text-[13px] text-ink-2">{METHODS[method][0]} orqali to‘lov</p>
        <p className="text-[24px] font-extrabold text-[#0d2a4a]">{som(amount)}</p>
        <ul className="mx-auto mt-4 max-w-[260px] space-y-2.5 text-left">
          {steps.map((t, i) => (
            <li key={t} className={`flex items-center gap-2.5 text-[13px] ${phase >= i ? 'text-[#0d2a4a]' : 'text-muted'}`}>
              {phase > i ? <span className="grid size-5 place-items-center rounded-full bg-[#0b6d73] text-white"><Check className="size-3" strokeWidth={3.5} /></span>
                : phase === i ? <LoaderCircle className="size-5 animate-spin text-[#0b6d73]" />
                  : <span className="size-5 rounded-full border-[1.5px] border-line" />}
              {t}
            </li>
          ))}
        </ul>
        <button type="button" onClick={onCancel} className="mt-5 h-11 w-full rounded-xl border border-line text-[13.5px] font-semibold text-ink">Bekor qilish</button>
      </div>
    </div>
  )
}

/* ---------- 3-bosqich: tasdiqlandi ---------- */

function Done({ s, m, reg }) {
  const navigate = useNavigate()
  const { items } = useCart()
  const [toast, setToast] = useState('')
  const closeToast = useCallback(() => setToast(''), [])
  const order = reg.order
  const methodLabel = reg.method === 'split' ? `Bo‘lib to‘lash (${reg.months} oy)` : METHODS[reg.method]?.[0] || 'Click'
  const place = reg.format === 'online' ? 'Online (Zoom)' : m.place
  const address = reg.format === 'online' ? 'Havola email orqali yuboriladi' : m.address

  const download = async () => {
    try {
      await downloadTicket({ s, m, reg, place, methodLabel })
      setToast('Chipta yuklab olindi')
    } catch {
      setToast('Chiptani yuklab bo‘lmadi')
    }
  }

  return (
    <div className={`min-h-screen ${page} pb-[86px]`}>
      <header className="flex items-center gap-2 px-3.5 pt-3">
        <button type="button" onClick={() => navigate(`/seminarlar/${s.id}`)} aria-label="Orqaga" className="grid size-9 place-items-center rounded-full text-[#0d2a4a] active:bg-white/70"><ChevronLeft className="size-6" /></button>
        <BrandLogo />
        <div className="ml-auto flex items-center gap-1.5">
          <button type="button" onClick={() => navigate('/buyurtma', { state: { from: 'market' } })} aria-label="Savat" className="relative grid size-10 place-items-center rounded-full text-[#0d2a4a]">
            <ShoppingCart className="size-[21px]" />
            {items.length > 0 && <CountBadge>{items.length}</CountBadge>}
          </button>
          <button type="button" onClick={() => setToast('Yangi bildirishnomalar yo‘q')} aria-label="Bildirishnomalar" className="relative grid size-10 place-items-center rounded-full bg-white text-[#0d2a4a] shadow-[0_1px_4px_rgb(11_31_58/0.08)]">
            <Bell className="size-[19px]" />
            <span className="absolute right-2 top-2 size-2 rounded-full bg-sale ring-2 ring-white" />
          </button>
        </div>
      </header>

      <div className="px-3.5">
        <ol className="mt-3 grid grid-cols-3">
          {[['Ma’lumotlar', 'Shaxsiy ma’lumotlar kiritildi'], ['To‘lov', 'To‘lov amalga oshirildi'], ['Tasdiqlandi', 'Siz seminarga ro‘yxatdan o‘tdingiz']].map(([t, d], i) => (
            <li key={t} className="min-w-0">
              <div className="flex items-center">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#0b6d73] text-white"><Check className="size-4" strokeWidth={3} /></span>
                {i < 2 && <span className="mx-1.5 h-px flex-1 bg-[#0b6d73]/50" />}
              </div>
              <p className="mt-1 text-[12px] font-semibold text-[#0d2a4a]">{t}</p>
              <p className="pr-2 text-[9.5px] leading-tight text-muted">{d}</p>
            </li>
          ))}
        </ol>

        <div className="mt-3 flex items-center gap-3.5 rounded-2xl border border-[#c8e8e3] bg-[#e4f4f1] p-3.5">
          <span className="grid size-[60px] shrink-0 place-items-center rounded-full bg-[#0b6d73] text-white ring-[6px] ring-[#c8e8e3]">
            <Check className="size-8" strokeWidth={2.6} />
          </span>
          <div className="min-w-0">
            <p className="text-[15.5px] font-bold leading-tight text-[#0d2a4a]">Siz seminarga ro‘yxatdan o‘tdingiz!</p>
            <p className="mt-1 text-[11.5px] leading-snug text-ink-2">To‘lov muvaffaqiyatli amalga oshirildi. Elektron chiptangiz quyida ko‘rsatilgan.</p>
          </div>
        </div>

        <div className={`${card} relative mt-3`}>
          <div className="flex items-center gap-2.5 px-3.5 pt-3.5">
            <span className="grid size-8 place-items-center rounded-lg bg-[#e3f4f1] text-[#0b6d73]"><Ticket className="size-[18px]" /></span>
            <h2 className="flex-1 text-[15.5px] font-bold text-[#0d2a4a]">Elektron chipta</h2>
            <span className="rounded-lg bg-[#e3f4f1] px-2 py-1 text-[11.5px] font-bold text-[#0b6d73]">#{order}</span>
          </div>
          <div className="flex gap-3 p-3.5">
            <img src={s.image} alt="" className="h-[150px] w-[132px] shrink-0 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <span className="rounded-full bg-[#e3f4f1] px-2 py-0.5 text-[9.5px] font-medium text-[#0b6d73]">{s.catName}</span>
              <p className="mt-1.5 line-clamp-3 text-[14px] font-bold leading-tight text-[#0d2a4a]">{s.title}</p>
              <TicketLine icon={UserRound} a={s.speaker.name} b={s.speaker.role} />
              <TicketLine icon={CalendarDays} a={m.whenFull} />
              <TicketLine icon={MapPin} a={place} b={address} />
            </div>
          </div>
          <div className="relative mx-3.5 border-t-2 border-dashed border-[#d9e6e8]">
            <span className="absolute -left-[26px] -top-[11px] size-5 rounded-full bg-[#f6faf9]" />
            <span className="absolute -right-[26px] -top-[11px] size-5 rounded-full bg-[#f6faf9]" />
          </div>
          <div className="flex flex-col items-center px-3.5 pb-3.5 pt-3">
            <Qr seed={`${order}-${s.id}-${reg.phone}`} className="size-[108px]" />
            <span className="mt-1.5 rounded-md bg-[#e3f4f1] px-2 py-0.5 text-[11.5px] font-bold text-[#0b6d73]">#{order}</span>
            <p className="mt-1 text-[11px] text-ink-2">Ro‘yxatdan o‘tishda QR kodni ko‘rsating</p>
          </div>
        </div>

        <div className={`${card} mt-3 p-3.5`}>
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-[#e3f4f1] text-[#0b6d73]"><FileText className="size-[18px]" /></span>
            <h2 className="text-[15px] font-bold text-[#0d2a4a]">Buyurtma ma’lumotlari</h2>
          </div>
          <div className="mt-2 divide-y divide-line">
            <OrderRow icon={Hash} k="Buyurtma raqami" v={`#${order}`} teal />
            <OrderRow icon={CreditCard} k="To‘lov usuli" v={methodLabel} />
            <OrderRow icon={Ticket} k="Chipta turi" v={reg.plan} />
            {reg.months ? <OrderRow icon={CalendarCheck} k="To‘langan (1-oy)" v={som(reg.paid)} /> : null}
            <OrderRow icon={Coins} k="Seminar narxi" v={som(reg.price)} bold />
          </div>
        </div>

        <button type="button" onClick={download} className="mt-3 flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-[#0b6d73] text-[14.5px] font-semibold text-white shadow-[0_6px_16px_rgb(11_109_115/0.3)] active:scale-[0.98]">
          <Download className="size-5" /> Chiptani yuklab olish
        </button>
        <div className="mt-2.5 grid grid-cols-2 gap-2.5">
          <button type="button" onClick={() => { downloadIcs(s); setToast('Kalendar fayli yuklab olindi') }} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#0b6d73] bg-white text-[12.5px] font-semibold text-[#0b6d73] active:bg-[#eef8f6]">
            <CalendarPlus className="size-[18px]" /> Kalendarga qo‘shish
          </button>
          <button type="button" onClick={() => navigate('/profil/seminarlar')} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#0b6d73] bg-white text-[12.5px] font-semibold text-[#0b6d73] active:bg-[#eef8f6]">
            <UserRound className="size-[18px]" /> Mening seminarlarim
          </button>
        </div>
        {reg.cert && <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted"><FileBadge className="size-3.5" /> Sertifikat seminar yakunida {reg.email} manziliga yuboriladi</p>}
      </div>

      <MobileToast text={toast} onClose={closeToast} bottom={76} />
      <MobileTabBar />
    </div>
  )
}

function TicketLine({ icon: Icon, a, b }) {
  return (
    <div className="mt-1.5 flex gap-2">
      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#eef6f6] text-[#0b6d73]"><Icon className="size-4" strokeWidth={1.8} /></span>
      <span className="min-w-0">
        <span className="block text-[11.5px] font-medium leading-tight text-[#0d2a4a]">{a}</span>
        {b && <span className="line-clamp-2 block text-[10px] leading-tight text-muted">{b}</span>}
      </span>
    </div>
  )
}

function OrderRow({ icon: Icon, k, v, teal, bold }) {
  return (
    <p className="flex items-center gap-2.5 py-2.5 text-[12.5px]">
      <Icon className="size-[18px] shrink-0 text-[#0b6d73]" strokeWidth={1.7} />
      <span className="flex-1 text-ink-2">{k}</span>
      <span className={`text-right ${teal ? 'font-bold text-[#0b6d73]' : bold ? 'text-[14px] font-extrabold text-[#0d2a4a]' : 'font-medium text-[#0d2a4a]'}`}>{v}</span>
    </p>
  )
}

function qrCells(seed) {
  const n = 25
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  const out = []
  const finder = (x, y) => {
    for (const [ox, oy] of [[0, 0], [n - 7, 0], [0, n - 7]]) {
      const lx = x - ox
      const ly = y - oy
      if (lx >= -1 && lx <= 7 && ly >= -1 && ly <= 7) {
        if (lx < 0 || ly < 0 || lx > 6 || ly > 6) return 0
        return lx === 0 || ly === 0 || lx === 6 || ly === 6 || (lx > 1 && lx < 5 && ly > 1 && ly < 5) ? 1 : 0
      }
    }
    return -1
  }
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const f = finder(x, y)
      let on = f === 1
      if (f === -1) {
        h = Math.imul(h ^ (x * 7 + y * 131), 16777619)
        on = ((h >>> 13) & 3) < 2
      }
      if (on) out.push([x, y])
    }
  }
  return { n, out }
}

export function Qr({ seed, className }) {
  const { n, out } = useMemo(() => qrCells(seed), [seed])
  return (
    <svg viewBox={`-1 -1 ${n + 2} ${n + 2}`} className={className} shapeRendering="crispEdges" role="img" aria-label="Chipta QR kodi">
      <rect x="-1" y="-1" width={n + 2} height={n + 2} fill="#fff" />
      {out.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#0d1b2a" />)}
    </svg>
  )
}

function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image()
    img.onload = () => res(img)
    img.onerror = rej
    img.src = src
  })
}

export async function downloadTicket({ s, m, reg, place, methodLabel }) {
  const W = 720
  const H = 1080
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')
  const font = (w, px) => `${w} ${px}px Inter, "Segoe UI", Arial, sans-serif`
  g.fillStyle = '#eef8f7'
  g.fillRect(0, 0, W, H)
  g.fillStyle = '#fff'
  g.beginPath()
  g.roundRect(32, 32, W - 64, H - 64, 28)
  g.fill()

  g.fillStyle = '#0b6d73'
  g.font = font(800, 34)
  g.fillText('StomaHub', 64, 92)
  g.font = font(700, 22)
  g.textAlign = 'right'
  g.fillText(`#${reg.order}`, W - 64, 90)
  g.textAlign = 'left'
  g.fillStyle = '#5b7280'
  g.font = font(400, 20)
  g.fillText('Elektron chipta', 64, 124)

  try {
    const img = await loadImage(s.image)
    const iw = 240
    const ih = 260
    const r = Math.max(iw / img.width, ih / img.height)
    const sw = iw / r
    const sh = ih / r
    g.save()
    g.beginPath()
    g.roundRect(64, 156, iw, ih, 18)
    g.clip()
    g.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 64, 156, iw, ih)
    g.restore()
  } catch { /* rasm yuklanmasa matnli chipta */ }

  const wrap = (text, x, y, max, lh) => {
    const words = text.split(' ')
    let line = ''
    for (const w of words) {
      const t = line ? `${line} ${w}` : w
      if (g.measureText(t).width > max && line) { g.fillText(line, x, y); line = w; y += lh } else line = t
    }
    g.fillText(line, x, y)
    return y + lh
  }
  const tx = 330
  const tw = W - tx - 64
  g.fillStyle = '#0b6d73'
  g.font = font(600, 18)
  g.fillText(s.catName, tx, 176)
  g.fillStyle = '#0d2a4a'
  g.font = font(800, 28)
  let y = wrap(s.title, tx, 214, tw, 34)
  g.font = font(500, 19)
  g.fillStyle = '#0d2a4a'
  for (const line of [s.speaker.name, m.whenFull, place]) y = wrap(line, tx, y + 8, tw, 24)

  g.strokeStyle = '#d9e6e8'
  g.lineWidth = 3
  g.setLineDash([12, 10])
  g.beginPath()
  g.moveTo(64, 460)
  g.lineTo(W - 64, 460)
  g.stroke()
  g.setLineDash([])

  const { n, out } = qrCells(`${reg.order}-${s.id}-${reg.phone}`)
  const size = 300
  const cell = size / n
  const qx = (W - size) / 2
  const qy = 500
  g.fillStyle = '#0d1b2a'
  for (const [x, yy] of out) g.fillRect(qx + x * cell, qy + yy * cell, Math.ceil(cell), Math.ceil(cell))
  g.textAlign = 'center'
  g.fillStyle = '#0b6d73'
  g.font = font(700, 24)
  g.fillText(`#${reg.order}`, W / 2, qy + size + 44)
  g.fillStyle = '#5b7280'
  g.font = font(400, 18)
  g.fillText('Ro‘yxatdan o‘tishda QR kodni ko‘rsating', W / 2, qy + size + 74)
  g.textAlign = 'left'

  const rows = [['Ishtirokchi', reg.name], ['Chipta turi', reg.plan], ['To‘lov usuli', methodLabel], ['Seminar narxi', som(reg.price)]]
  let ry = 912
  g.font = font(400, 19)
  for (const [k, v] of rows) {
    g.fillStyle = '#5b7280'
    g.fillText(k, 64, ry)
    g.fillStyle = '#0d2a4a'
    g.textAlign = 'right'
    g.font = font(600, 19)
    g.fillText(v, W - 64, ry)
    g.textAlign = 'left'
    g.font = font(400, 19)
    ry += 30
  }

  const blob = await new Promise((res) => c.toBlob(res, 'image/png'))
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `StomaHub-${reg.order}.png`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
