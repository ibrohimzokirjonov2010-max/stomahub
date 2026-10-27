import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Banknote, Bell, Building, Hospital, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Coins,
  CreditCard, FileText, House, LoaderCircle, Map as MapIcon, MapPin, MessageSquareText, Phone, ShieldCheck, ShoppingBag, ShoppingCart,
  Store, Truck, UserRound, X,
} from 'lucide-react'
import { useCart } from '../../cart'
import { som } from '../../marketData'
import { createOrder } from '../../buyerApi'
import { createCharge, isDemoPayments } from '../../payments/paymentService'
import { BrandLogo, MobileToast, CountBadge } from './parts'
import MobileTabBar from './MobileTabBar'
import { BottomSheet } from './MobileSeminars'
import { HubTopBar } from './MobileKategoriyalar'
import { PayLogo } from './MobileSeminarReg'
import { PROMOS } from './MobileCart'
import { profileStore, useProfile } from '../../profileStore'
import PhoneInput, { extractUzLocalDigits, isCompleteUzPhone, PHONE_INCOMPLETE_MSG, toE164 } from '../PhoneInput'

export const CITIES = {
  Toshkent: ['Yunusobod', 'Chilonzor', 'Mirzo Ulug‘bek', 'Yakkasaroy', 'Mirobod', 'Shayxontohur', 'Sergeli', 'Uchtepa', 'Yashnobod', 'Olmazor', 'Bektemir'],
  Samarqand: ['Markaz', 'Siab', 'Temiryo‘l'],
  Buxoro: ['Markaz', 'Kogon'],
  Andijon: ['Markaz', 'Asaka'],
  'Farg‘ona': ['Markaz', 'Qo‘qon'],
  Namangan: ['Markaz', 'Chortoq'],
  Nukus: ['Markaz'],
}
export const ADDRESS_ICONS = { home: House, work: Hospital, branch: Store, other: MapPin }
const PINS = [
  { x: 210, y: 60, district: 'Yunusobod', address: 'Yunusobod tumani, Amir Temur ko‘chasi, 108-uy' },
  { x: 300, y: 92, district: 'Mirzo Ulug‘bek', address: 'Mirzo Ulug‘bek tumani, Buyuk Ipak Yo‘li, 42-uy' },
  { x: 150, y: 120, district: 'Shayxontohur', address: 'Shayxontohur tumani, Navoiy ko‘chasi, 12-uy' },
  { x: 232, y: 150, district: 'Yakkasaroy', address: 'Yakkasaroy tumani, Shota Rustaveli ko‘chasi, 15-uy' },
  { x: 92, y: 176, district: 'Chilonzor', address: 'Chilonzor tumani, Bunyodkor shoh ko‘chasi, 7-uy' },
  { x: 250, y: 214, district: 'Sergeli', address: 'Sergeli tumani, Yangi Sergeli ko‘chasi, 3-uy' },
]
const SHOP = 'StomaHub do‘koni — Yakkasaroy, Shota Rustaveli ko‘chasi, 15'
export const METHODS = {
  uzcard: ['UZCARD', 'Bank kartasi (demo)'],
  humo: ['HUMO', 'Bank kartasi (demo)'],
  click: ['Click', 'Click ilovasi (demo)'],
  payme: ['Payme', 'Payme ilovasi (demo)'],
  cash: ['Naqd', 'Olganda naqd to‘lash'],
}
const MON = ['yan', 'fev', 'mar', 'apr', 'may', 'iyun', 'iyul', 'avg', 'sen', 'okt', 'noy', 'dek']
const ORDER_KEY = 'stomahub-last-order'

const page = 'min-h-screen bg-[linear-gradient(180deg,#eef8f7_0%,#f6faf9_30%,#f6faf9_100%)]'
const card = 'rounded-2xl bg-white shadow-[0_1px_6px_rgb(11_31_58/0.06)]'
const dayLabel = (offset) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return `${d.getDate()} ${MON[d.getMonth()]}`
}

function shipInfo(mode, city) {
  if (mode === 'pickup') return { fee: 0, badge: 'Bugun', eta: `Bugun, ${dayLabel(0)}`, range: `${dayLabel(0)}`, days: 'bugun' }
  if (city === 'Toshkent') return { fee: 0, badge: 'Bugun / Ertaga', eta: `Bugun yoki ertaga`, range: `${dayLabel(0)}–${dayLabel(1)}`, days: '1–2 kun' }
  return { fee: 30000, badge: '2–4 kun', eta: `${dayLabel(2)}–${dayLabel(4)}`, range: `${dayLabel(2)}–${dayLabel(4)}`, days: '2–4 kun' }
}

function readOrder() {
  try { return JSON.parse(sessionStorage.getItem(ORDER_KEY)) } catch { return null }
}

export default function MobileCheckout() {
  const { items, setItems, cartReady } = useCart()
  const navigate = useNavigate()
  const loc = useLocation()
  const [placed, setPlaced] = useState(() => (loc.state?.done ? readOrder() : null))
  const [step, setStep] = useState(1)
  const profile = useProfile()
  const SAVED = profile.addresses.map((a) => ({ ...a, icon: ADDRESS_ICONS[a.kind] || MapPin }))
  useEffect(() => {
    if (!profile.accountLive) return
    const picked = profile.addresses.find((row) => row.id === profile.defaultAddr) || profile.addresses[0]
    setForm((current) => ({
      ...current,
      name: profile.name || '',
      phone: profile.phone || '',
      city: picked?.city || profile.city || current.city,
      district: picked?.district || current.district,
      address: picked?.address || '',
      saved: picked?.id || '',
    }))
  }, [profile.accountLive])
  const [form, setForm] = useState(() => {
    const me = profile.accountLive ? { name: profile.name, phone: profile.phone } : { name: '', phone: '' }
    const s = profile.accountLive ? (SAVED.find((a) => a.id === profile.defaultAddr) || SAVED[0]) : null
    return loc.state?.ship === 'region' || !s
      ? { ...me, city: 'Samarqand', district: 'Markaz', address: '', note: '', saved: '' }
      : { ...me, city: s.city, district: s.district, address: s.address, note: '', saved: s.id }
  })
  const [mode, setMode] = useState('courier')
  const [allSaved, setAllSaved] = useState(false)
  const [showItems, setShowItems] = useState(false)
  const [tried, setTried] = useState(false)
  const [method, setMethod] = useState('uzcard')
  const [savedCard, setSavedCard] = useState(() => profile.cards.find((c) => c.id === profile.defaultPay)?.id || profile.cards[0]?.id || '')
  const [months, setMonths] = useState(6)
  const [cardNo, setCardNo] = useState({ num: '', exp: '' })
  const [payTried, setPayTried] = useState(false)
  const [code, setCode] = useState(loc.state?.promo || '')
  const [promo, setPromo] = useState(loc.state?.promo || null)
  const [promoErr, setPromoErr] = useState('')
  const [agree, setAgree] = useState(false)
  const [agreeErr, setAgreeErr] = useState(false)
  const [sheet, setSheet] = useState(null)
  const [paying, setPaying] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [placeErr, setPlaceErr] = useState('')
  const [toast, setToast] = useState('')
  const closeToast = useCallback(() => setToast(''), [])
  const formRef = useRef(null)

  useEffect(() => { window.scrollTo(0, 0) }, [step, placed])

  const goods = items.reduce((s, it) => s + it.price * it.qty, 0)
  const ship = { ...shipInfo(mode, form.city), fee: 0 } // yetkazish narxi sotuvchi bilan kelishiladi
  const promoOk = false && promo && PROMOS[promo] && goods >= (PROMOS[promo].min || 0)
  const discount = promoOk ? Math.min(goods, PROMOS[promo].calc(goods)) : 0
  const total = goods + ship.fee - discount
  const monthly = Math.ceil(total / months / 1000) * 1000

  const phone = form.phone.replace(/\D/g, '').slice(0, 9)
  const fmtPhone = [phone.slice(0, 2), phone.slice(2, 5), phone.slice(5, 7), phone.slice(7, 9)].filter(Boolean).join(' ')
  const errors = {
    name: form.name.trim().length < 3 && 'Ism va familiyani kiriting',
    phone: phone.length !== 9 && PHONE_INCOMPLETE_MSG,
    address: mode === 'courier' && form.address.trim().length < 5 && 'Aniq manzilni kiriting',
  }
  const cardDigits = cardNo.num.replace(/\D/g, '')
  const [mm, yy] = cardNo.exp.split('/').map(Number)
  const now = new Date()
  const expOk = mm >= 1 && mm <= 12 && (2000 + yy > now.getFullYear() || (2000 + yy === now.getFullYear() && mm >= now.getMonth() + 1))
  const saved = method === 'card' ? profile.cards.find((c) => c.id === savedCard) : null
  const last4 = saved ? saved.last4 : cardDigits.slice(-4)
  const cardErr = method === 'card' && !saved ? { num: cardDigits.length !== 16 && '16 ta raqam kiriting', exp: !expOk && 'Muddat noto‘g‘ri' } : {}

  const patch = (k, v) => setForm((f) => ({ ...f, [k]: v, ...(k === 'address' || k === 'district' || k === 'city' ? { saved: '' } : {}) }))

  if (!cartReady) {
    return (
      <div className={`${page} grid min-h-screen place-items-center text-[14px] font-semibold text-[#0b8a84]`}>
        Savat yuklanmoqda…
      </div>
    )
  }
  if (!placed && items.length === 0) return <Navigate to="/buyurtma" replace />
  if (placed) return <Done order={placed} />

  const next1 = () => {
    setTried(true)
    const bad = Object.keys(errors).find((k) => errors[k])
    if (bad) {
      const el = formRef.current?.querySelector(`[data-f="${bad}"]`)
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' })
      return
    }
    setStep(2)
  }
  const next2 = () => {
    setPayTried(true)
    if (cardErr.num || cardErr.exp) return
    setStep(3)
  }
  const applyPromo = () => {
    const key = code.trim().toUpperCase()
    if (!key) return setPromoErr('Promokodni kiriting')
    setPromoErr('Promokodlar hozircha mavjud emas')
  }

  const place = async () => {
    if (placing) return
    setPlacing(true)
    setPlaceErr('')
    try {
      let paymentRef = ''
      if (method !== 'cash') {
        const charge = await createCharge({ method: { type: method }, amount: goods, meta: { source: 'mobile-checkout' } })
        paymentRef = charge.ref
      }
      const res = await createOrder({
        items, name: form.name.trim(), phone, city: [form.city, form.district].filter(Boolean).join(', '),
        address: form.address, note: form.note || '', pickup: mode === 'pickup',
        paymentMethod: method, paymentRef,
      })
      const at = new Date()
      const order = {
        id: (res.orders || []).map((o) => o.code).join(', '),
        at: `${at.getDate()} ${MON[at.getMonth()]}, ${at.getFullYear()} ${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`,
        items: items.map((it) => ({ ...it })),
        goods, fee: 0, discount: 0, total: goods, method, months: 0, monthly: 0, paymentRef, demo: isDemoPayments(),
        mode, eta: ship.range, days: ship.days, name: form.name.trim(), phone,
        address: mode === 'pickup' ? SHOP : `${form.city}, ${form.address}`,
      }
      sessionStorage.setItem(ORDER_KEY, JSON.stringify(order))
      setItems([])
      profileStore.refreshOrders?.()
      setPlaced(order)
      navigate('.', { replace: true, state: { done: true } })
    } catch (e) {
      setPlaceErr(e.message || 'Buyurtma yuborilmadi')
    } finally {
      setPlacing(false)
    }
  }
  const confirm = () => {
    if (!agree) { setAgreeErr(true); return }
    place()
  }

  const subtitle = ['Mahsulotlaringizni rasmiylashtirish', 'To‘lov usulini tanlang', 'Ma’lumotlarni tekshirib, tasdiqlang'][step - 1]

  return (
    <div className={`${page} ${step === 3 ? 'pb-[170px]' : 'pb-[158px]'}`}>
      <div className="px-3.5 pt-3">
        <HubTopBar onBell={() => setToast('Yangi bildirishnomalar yo‘q')} />
        <h1 className="mt-3 text-[25px] font-extrabold leading-tight tracking-tight text-[#0d2a4a]">Buyurtma berish</h1>
        <p className="text-[12.5px] text-ink-2">{subtitle}</p>
        <Stepper step={step} onGo={(n) => n < step && setStep(n)} />
      </div>

      <div className="px-3.5">
        {step === 1 && (
          <>
            <div className={`${card} mt-3 p-3`}>
              <button type="button" onClick={() => setShowItems((v) => !v)} aria-expanded={showItems} className="flex w-full items-center gap-2.5 text-left">
                <span className="text-[24px] font-extrabold leading-none text-[#0b6d73]">{items.length}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-bold text-[#0d2a4a]">ta mahsulot</span>
                  <span className="block text-[11px] text-muted">Savatingizdagi mahsulotlar</span>
                </span>
                <span className="whitespace-nowrap text-[15px] font-extrabold text-[#0d2a4a]">{som(goods)}</span>
                <ChevronDown className={`size-5 shrink-0 text-ink-2 transition ${showItems ? 'rotate-180' : ''}`} />
              </button>
              {showItems ? (
                <ul className="mt-2.5 divide-y divide-line">
                  {items.map((it) => <ItemRow key={it.id} it={it} />)}
                </ul>
              ) : (
                <div className="mt-2.5 grid grid-cols-6 gap-1.5">
                  {items.slice(0, items.length > 6 ? 5 : 6).map((it) => (
                    <img key={it.id} src={it.image} alt={it.name} className="aspect-square w-full rounded-lg bg-[#f3f6f8] object-contain p-0.5" />
                  ))}
                  {items.length > 6 && <button type="button" onClick={() => setShowItems(true)} className="grid aspect-square place-items-center rounded-lg bg-[#f0f3f5] text-[13px] font-semibold text-ink-2">+{items.length - 5}</button>}
                </div>
              )}
            </div>

            <section ref={formRef} className={`${card} mt-3 p-3`}>
              <Head icon={MapPin} title="Yetkazib berish ma’lumotlari" text="Buyurtmangiz qayerga yetkazilsin?" />
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Field f="name" icon={UserRound} label="Ism va familiya" err={tried && errors.name}>
                  <input value={form.name} onChange={(e) => patch('name', e.target.value)} autoComplete="name" placeholder="Ism Familiya" className={inp} />
                </Field>
                                <Field f="phone" icon={Phone} label="Telefon raqami" err={tried && errors.phone}>
                    <PhoneInput
                      className="h-10 rounded-xl border border-[#e2e9ec] bg-white px-3"
                      value={form.phone}
                      onChange={(v) => patch('phone', extractUzLocalDigits(v))}
                      valueMode="local"
                      invalid={!!(tried && errors.phone)}
                      placeholder="+998 90 123 45 67"
                    />
                </Field>
                <Field icon={Building} label="Shahar" chevron>
                  <span className="block truncate text-[13px] text-[#0d2a4a]">{form.city}</span>
                  <select value={form.city} aria-label="Shahar" onChange={(e) => { const city = e.target.value; setForm((f) => ({ ...f, city, district: CITIES[city][0], address: '', saved: '' })) }} className="absolute inset-0 opacity-0">
                    {Object.keys(CITIES).map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field icon={MapIcon} label="Tuman" chevron>
                  <span className="block truncate text-[13px] text-[#0d2a4a]">{form.district}</span>
                  <select value={form.district} aria-label="Tuman" onChange={(e) => patch('district', e.target.value)} className="absolute inset-0 opacity-0">
                    {CITIES[form.city].map((d) => <option key={d}>{d}</option>)}
                  </select>
                </Field>
              </div>
              {mode === 'courier' ? (
                <>
                  <div className="mt-2">
                    <Field f="address" icon={MapPin} label="Aniq manzil" err={tried && errors.address}>
                      <span className="flex items-center gap-1">
                        <input value={form.address} onChange={(e) => patch('address', e.target.value)} autoComplete="street-address" placeholder="Tuman, ko‘cha, uy, xonadon" className={inp} />
                        {form.address && <button type="button" onClick={() => patch('address', '')} aria-label="Manzilni tozalash" className="grid size-6 shrink-0 place-items-center text-ink-2"><X className="size-4" /></button>}
                      </span>
                    </Field>
                  </div>
                  <button type="button" onClick={() => setSheet('map')} className="relative mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#e3f4f1] text-[13.5px] font-semibold text-[#0b6d73] active:scale-[0.99]">
                    <MapIcon className="size-[18px]" /> Xaritadan tanlash <ChevronRight className="absolute right-3 size-4" />
                  </button>

                  {SAVED.length > 0 && (
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-[13px] font-semibold text-[#0d2a4a]">Saqlangan manzillar</p>
                      {SAVED.length > 2 && <button type="button" onClick={() => setAllSaved((v) => !v)} className="text-[12px] font-semibold text-[#0b6d73]">{allSaved ? 'Yig‘ish' : 'Barchasini ko‘rish'}</button>}
                    </div>
                  )}
                  <div className="mt-1.5 space-y-2" role="radiogroup" aria-label="Saqlangan manzillar">
                    {(allSaved ? SAVED : SAVED.slice(0, 2)).map((a) => {
                      const on = form.saved === a.id
                      return (
                        <button key={a.id} type="button" role="radio" aria-checked={on} onClick={() => setForm((f) => ({ ...f, name: a.name || f.name, phone: a.phone || f.phone, city: a.city, district: a.district, address: a.address, saved: a.id }))} className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left ${on ? 'border-[#0b8a7a] bg-[#eef8f6]' : 'border-[#e2e9ec] bg-white'}`}>
                          <a.icon className="size-5 shrink-0 text-[#0b6d73]" strokeWidth={1.7} />
                          <span className="min-w-0 flex-1">
                            <span className="block text-[13px] font-semibold text-[#0d2a4a]">{a.tag}</span>
                            <span className="block truncate text-[11px] text-ink-2">{a.address}</span>
                          </span>
                          <Radio on={on} />
                        </button>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div className="mt-2 flex items-start gap-2.5 rounded-xl bg-[#eef8f6] p-3">
                  <Store className="mt-0.5 size-5 shrink-0 text-[#0b6d73]" />
                  <p className="text-[12px] leading-snug text-ink-2"><b className="block text-[13px] text-[#0d2a4a]">Olib ketish manzili</b>{SHOP}. Har kuni 09:00–19:00.</p>
                </div>
              )}
              <div className="mt-2">
                <Field icon={MessageSquareText} label="Izoh (ixtiyoriy)">
                  <input value={form.note} maxLength={200} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="Masalan: qo‘ng‘iroq qilib keling..." className={inp} />
                </Field>
              </div>
            </section>

            <section className={`${card} mt-3 p-3`}>
              <Head icon={Truck} title="Yetkazish usuli" text="Sizga qulay usulni tanlang" />
              <div className="mt-3 space-y-2" role="radiogroup" aria-label="Yetkazish usuli">
                <ShipOption on={mode === 'courier'} onClick={() => setMode('courier')} icon={Truck} title="Kuryer orqali" text={form.city === 'Toshkent' ? 'Toshkent bo‘ylab yetkazib berish' : `${form.city}ga yetkazib berish`} info={shipInfo('courier', form.city)} />
                <ShipOption on={mode === 'pickup'} onClick={() => setMode('pickup')} icon={Store} title="Olib ketish" text="Do‘kondan o‘zingiz olib ketasiz" info={shipInfo('pickup', form.city)} />
              </div>
            </section>
          </>
        )}

        {step === 2 && (
          <>
            <section className={`${card} mt-3 p-3`}>
              <Head icon={CreditCard} title="To‘lov usuli" text="Sizga qulay to‘lov usulini tanlang" />
              <div className="mt-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label="To‘lov usuli">
                {Object.keys(METHODS).map((k) => (
                  <button key={k} type="button" role="radio" aria-checked={method === k} onClick={() => { setMethod(k); setPayTried(false) }} className={`relative flex items-center gap-2 rounded-xl border p-2.5 text-left ${method === k ? 'border-[#0b8a7a] bg-[#eef8f6] shadow-[inset_0_0_0_1px_#0b8a7a]' : 'border-[#e2e9ec] bg-white'}`}>
                    <Logo id={k} />
                    <span className="min-w-0 flex-1 pr-4">
                      <span className="block whitespace-nowrap text-[12.5px] font-bold text-[#0d2a4a]">{METHODS[k][0]}</span>
                      <span className="block text-[10px] leading-tight text-ink-2">{METHODS[k][1]}</span>
                    </span>
                    <span className="absolute right-2 top-1/2 -translate-y-1/2"><Radio on={method === k} /></span>
                  </button>
                ))}
              </div>
              {method === 'card' && profile.cards.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-2" role="radiogroup" aria-label="Saqlangan kartalar">
                  {[...profile.cards, { id: '', brand: 'Yangi karta' }].map((c) => (
                    <button key={c.id || 'new'} type="button" role="radio" aria-checked={savedCard === c.id} onClick={() => setSavedCard(c.id)} className={`flex h-9 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-semibold ${savedCard === c.id ? 'border-[#0b6d73] bg-[#eef8f6] text-[#0b6d73]' : 'border-[#dbe5e8] text-ink-2'}`}>
                      <CreditCard className="size-4" /> {c.id ? `${c.brand} •••• ${c.last4}` : c.brand}
                    </button>
                  ))}
                </div>
              )}
              {method === 'card' && !saved && (
                <div className="mt-2.5 grid grid-cols-[1fr_96px] gap-2">
                  <Field icon={CreditCard} label="Karta raqami" err={payTried && cardErr.num}>
                    <input inputMode="numeric" autoComplete="cc-number" value={cardDigits.replace(/(\d{4})(?=\d)/g, '$1 ')} onChange={(e) => setCardNo((c) => ({ ...c, num: e.target.value.replace(/\D/g, '').slice(0, 16) }))} placeholder="8600 0000 0000 0000" className={inp} />
                  </Field>
                  <Field label="Muddati" err={payTried && cardErr.exp}>
                    <input inputMode="numeric" autoComplete="cc-exp" value={cardNo.exp} onChange={(e) => { const d = e.target.value.replace(/\D/g, '').slice(0, 4); setCardNo((c) => ({ ...c, exp: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d })) }} placeholder="OO/YY" className={inp} />
                  </Field>
                </div>
              )}
              {method === 'nasiya' && (
                <div className="mt-2.5 rounded-xl bg-[#fff7ec] p-3">
                  <p className="text-[12px] font-semibold text-[#0d2a4a]">Muddatni tanlang</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {[3, 6, 12].map((n) => (
                      <button key={n} type="button" aria-pressed={months === n} onClick={() => setMonths(n)} className={`h-10 rounded-xl border text-[12.5px] font-semibold ${months === n ? 'border-[#f08c1a] bg-[#f08c1a] text-white' : 'border-[#f3dcc0] bg-white text-ink'}`}>{n} oy</button>
                    ))}
                  </div>
                  <p className="mt-2 text-[11.5px] text-ink-2">Oyiga <b className="text-[#c26a06]">{som(monthly)}</b> · {months} oy, birinchi to‘lov yetkazilganda</p>
                </div>
              )}
              {method === 'cash' && <p className="mt-2.5 rounded-xl bg-[#eef8f6] px-3 py-2 text-[11.5px] text-ink-2">Kuryerga naqd yoki terminal orqali karta bilan to‘laysiz.</p>}
            </section>

            <section className={`${card} mt-3 p-3`}>
              <Head icon={Coins} title="Promokod" text="Chegirma olish uchun promokod kiriting" />
              {promo ? (
                <div className="mt-3 flex h-11 items-center gap-2 rounded-xl border border-[#bfe3dd] bg-[#eef8f6] px-3">
                  <Check className="size-4 text-[#0b6d73]" />
                  <span className="min-w-0 flex-1 truncate text-[12.5px] text-[#0b6d73]"><b>{promo}</b> · {promoOk ? PROMOS[promo].text : 'shart bajarilmagan'}</span>
                  <button type="button" onClick={() => { setPromo(null); setCode('') }} aria-label="Promokodni olib tashlash" className="grid size-7 place-items-center text-ink-2"><X className="size-4" /></button>
                </div>
              ) : (
                <>
                  <div className="mt-3 flex gap-2">
                    <input value={code} onChange={(e) => { setCode(e.target.value); setPromoErr('') }} onKeyDown={(e) => e.key === 'Enter' && applyPromo()} placeholder="Promokod kiriting..." className={`h-11 min-w-0 flex-1 rounded-xl border bg-white px-3 text-[13px] uppercase outline-none placeholder:normal-case placeholder:text-[#a3b3b9] focus:border-sea ${promoErr ? 'border-sale' : 'border-[#dbe5e8]'}`} />
                    <button type="button" onClick={applyPromo} className="h-11 shrink-0 rounded-xl border border-[#0b8a7a] px-4 text-[13px] font-semibold text-[#0b6d73] active:scale-95">Qo‘llash</button>
                  </div>
                  {promoErr && <p className="mt-1 text-[11px] text-sale">{promoErr}</p>}
                </>
              )}
            </section>

            <section className={`${card} mt-3 p-3`}>
              <Head icon={FileText} title="Buyurtma xulosasi" text="Buyurtmangiz tafsilotlari" />
              <Summary items={items} goods={goods} ship={ship} mode={mode} city={form.city} discount={discount} total={total} />
              <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-[#f3f7f8] p-2.5">
                <ShieldCheck className="size-6 shrink-0 fill-[#0b8a7a] text-white" />
                <p className="text-[11px] text-ink-2"><b className="block text-[12.5px] text-[#0d2a4a]">Xavfsiz to‘lov</b>Barcha to‘lovlar himoyalangan va shifrlangan</p>
              </div>
            </section>
          </>
        )}

        {step === 3 && (
          <>
            <section className={`${card} mt-3 p-3`}>
              <ReviewHead icon={ShoppingCart} title={`Mahsulotlar (${items.length} ta)`} text="Savatdagi mahsulotlar" onEdit={() => navigate('/buyurtma', { state: { from: loc.state?.from } })} />
              <ul className="mt-1 divide-y divide-line">{items.map((it) => <ItemRow key={it.id} it={it} />)}</ul>
            </section>
            <section className={`${card} mt-3 p-3`}>
              <ReviewHead icon={MapPin} title={mode === 'pickup' ? 'Olib ketish manzili' : 'Yetkazib berish manzili'} onEdit={() => setStep(1)} />
              <div className="ml-[46px] mt-1 space-y-1 text-[12px] text-ink-2">
                <p className="flex items-center gap-1.5"><UserRound className="size-3.5 text-[#0b6d73]" /> {form.name.trim()} · +998 {fmtPhone}</p>
                <p className="flex items-start gap-1.5"><MapPin className="mt-0.5 size-3.5 shrink-0 text-[#0b6d73]" /> {mode === 'pickup' ? SHOP : `${form.city}, ${form.address}`}</p>
                {form.note && <p className="flex items-start gap-1.5"><MessageSquareText className="mt-0.5 size-3.5 shrink-0 text-[#0b6d73]" /> {form.note}</p>}
              </div>
            </section>
            <section className={`${card} mt-3 p-3`}>
              <ReviewHead icon={Truck} title="Yetkazish ma’lumotlari" onEdit={() => setStep(1)} />
              <div className="ml-[46px] mt-1 flex items-start justify-between gap-2">
                <p className="text-[12px] text-ink-2"><b className="block text-[13px] text-[#0d2a4a]">{mode === 'pickup' ? 'Olib ketish' : 'Kuryer orqali'}</b>{mode === 'pickup' ? 'Do‘kondan olib ketasiz' : form.city === 'Toshkent' ? 'Toshkent bo‘ylab yetkazib berish' : `${form.city}ga yetkazib berish`}</p>
                <span className="text-right">
                  <span className="block whitespace-nowrap rounded-md bg-[#e3f4f1] px-1.5 py-0.5 text-[11px] font-medium text-[#0b6d73]">{ship.eta}</span>
                  <span className={`mt-0.5 block text-[12px] font-semibold ${ship.fee ? 'text-[#0d2a4a]' : 'text-[#0b8a7a]'}`}>{ship.fee ? som(ship.fee) : 'Bepul'}</span>
                </span>
              </div>
            </section>
            <section className={`${card} mt-3 p-3`}>
              <ReviewHead icon={CreditCard} title="To‘lov usuli" onEdit={() => setStep(2)} />
              <div className="ml-[46px] mt-1 flex items-center gap-2.5">
                <Logo id={method} />
                <p className="text-[11.5px] text-ink-2"><b className="block text-[13px] text-[#0d2a4a]">{METHODS[method][0]}</b>{method === 'card' ? `•••• ${last4}` : method === 'nasiya' ? `${months} oy · oyiga ${som(monthly)}` : METHODS[method][1]}</p>
              </div>
            </section>
            <section className={`${card} mt-3 p-3`}>
              <Head icon={FileText} title="Buyurtma xulosasi" />
              <Summary items={items} goods={goods} ship={ship} mode={mode} city={form.city} discount={discount} total={total} />
            </section>
          </>
        )}
      </div>

      <div className={`fixed inset-x-0 bottom-[62px] z-30 px-3.5 pb-2 ${step === 3 ? 'rounded-t-2xl border-t border-line bg-white pt-3 shadow-[0_-6px_18px_rgb(13_42_74/0.07)]' : 'bg-gradient-to-t from-[#f6faf9] via-[#f6faf9] to-[#f6faf9]/0 pt-4'}`}>
        {step === 1 && (
          <>
            <button type="button" onClick={next1} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0b6d73] text-[14.5px] font-semibold text-white shadow-[0_6px_16px_rgb(11_109_115/0.3)] active:scale-[0.99]">Davom etish <ArrowRight className="size-[18px]" /></button>
            <p className="mt-1 text-center text-[11px] text-muted">Keyingi bosqich: to‘lov</p>
          </>
        )}
        {step === 2 && (
          <>
            <div className="flex gap-2.5">
              <button type="button" onClick={() => setStep(1)} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-[#0b6d73] bg-white text-[14px] font-semibold text-[#0b6d73]"><ArrowLeft className="size-[18px]" /> Orqaga</button>
              <button type="button" onClick={next2} className="flex h-12 flex-[1.2] items-center justify-center gap-2 rounded-xl bg-[#0b6d73] text-[14px] font-semibold text-white shadow-[0_6px_16px_rgb(11_109_115/0.3)]">Davom etish <ArrowRight className="size-[18px]" /></button>
            </div>
            <p className="mt-1 text-center text-[11px] text-muted">Keyingi bosqich: tasdiqlash</p>
          </>
        )}
        {step === 3 && (
          <>
            <label className="mb-2 flex cursor-pointer items-center gap-2.5">
              <input type="checkbox" checked={agree} onChange={(e) => { setAgree(e.target.checked); setAgreeErr(false) }} className="sr-only" />
              <span className={`grid size-[22px] shrink-0 place-items-center rounded-md border-[1.5px] ${agree ? 'border-[#0b6d73] bg-[#0b6d73] text-white' : agreeErr ? 'border-sale bg-white' : 'border-[#9fb0b6] bg-white'}`}>{agree && <Check className="size-3.5" strokeWidth={3.5} />}</span>
              <span className={`text-[12.5px] ${agreeErr ? 'text-sale' : 'text-ink-2'}`}>
                <button type="button" onClick={(e) => { e.preventDefault(); setSheet('oferta') }} className="font-medium text-[#0b6d73] underline underline-offset-2">Ommaviy oferta</button> bilan tanishdim va roziman
              </span>
            </label>
            {placeErr && <p role="alert" className="mb-2 rounded-lg bg-[#fff4f4] px-3 py-2 text-[12.5px] text-[#b42318]">{placeErr}</p>}
            <button type="button" disabled={placing} onClick={confirm} className="disabled:opacity-60 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0b6d73] text-[14.5px] font-semibold text-white shadow-[0_6px_16px_rgb(11_109_115/0.3)] active:scale-[0.99]">
              Buyurtmani tasdiqlash <ArrowRight className="size-[18px]" />
            </button>
          </>
        )}
      </div>

      {sheet === 'map' && (
        <MapSheet
          current={form.city === 'Toshkent' ? form.district : ''}
          onClose={() => setSheet(null)}
          onPick={(p) => { setForm((f) => ({ ...f, city: 'Toshkent', district: p.district, address: p.address, saved: '' })); setSheet(null); setToast('Manzil xaritadan tanlandi') }}
        />
      )}
      {sheet === 'oferta' && (
        <BottomSheet title="Ommaviy oferta" onClose={() => setSheet(null)} footer={<button type="button" onClick={() => { setAgree(true); setAgreeErr(false); setSheet(null) }} className="h-12 flex-1 rounded-xl bg-[#0b6d73] text-[14px] font-semibold text-white">Tanishdim, roziman</button>}>
          <ul className="mt-2 space-y-2.5 text-[12.5px] leading-snug text-ink-2">
            {[
              'Buyurtma tasdiqlangach, operator 30 daqiqa ichida siz bilan bog‘lanadi.',
              'Mahsulotni qabul qilishda qadoq butunligini tekshiring; nuqson bo‘lsa, kuryer huzurida dalolatnoma tuziladi.',
              'Ochilmagan mahsulotlarni 14 kun ichida qaytarish mumkin. Steril va sarf materiallari qaytarilmaydi.',
              'Onlayn to‘lov bekor qilinganda pul 3 ish kuni ichida kartangizga qaytariladi.',
              'Muddatli to‘lov Uzum Nasiya shartlari asosida rasmiylashtiriladi.',
            ].map((t) => <li key={t} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-sea" /> {t}</li>)}
          </ul>
        </BottomSheet>
      )}
      {paying && <Paying method={method} amount={method === 'nasiya' ? monthly : total} onCancel={() => setPaying(false)} onDone={place} />}
      <MobileToast text={toast} onClose={closeToast} bottom={step === 3 ? 170 : 150} />
      <MobileTabBar />
    </div>
  )
}

const inp = 'h-6 w-full min-w-0 bg-transparent text-[13px] text-[#0d2a4a] outline-none placeholder:text-[12px] placeholder:text-[#a3b3b9]'

function Stepper({ step, onGo, done, pickup }) {
  const rows = done
    ? [['Yetkazish', pickup ? 'Do‘kondan olib ketish' : 'Manzil va kuryer'], ['To‘lov', done === 'cash' ? (pickup ? 'Olganda to‘lanadi' : 'Yetkazilganda to‘lanadi') : 'To‘lov amalga oshirildi'], ['Tasdiqlash', 'Buyurtma qabul qilindi']]
    : [['Yetkazish'], ['To‘lov'], ['Tasdiqlash']]
  return (
    <ol className="mt-3 flex">
      {rows.map(([t, d], i) => {
        const n = i + 1
        const ok = done || step > n
        const on = done || step >= n
        return (
          <li key={t} className="relative flex flex-1 flex-col items-center text-center">
            {i > 0 && <span className={`absolute left-[calc(-50%+20px)] right-[calc(50%+20px)] top-[15px] h-[2px] rounded-full ${on ? 'bg-[#0b6d73]' : 'bg-[#dde6e9]'}`} />}
            <button type="button" onClick={() => onGo?.(n)} disabled={!ok || done} className={`relative z-[1] grid size-8 place-items-center rounded-full text-[13px] font-bold ${on ? 'bg-[#0b6d73] text-white' : 'bg-[#e1e8eb] text-muted'} ${step === n && !done ? 'ring-4 ring-[#0b6d73]/15' : ''}`}>
              {ok ? <Check className="size-4" strokeWidth={3} /> : n}
            </button>
            <span className={`mt-1 text-[11.5px] ${on ? 'font-semibold text-[#0d2a4a]' : 'text-muted'}`}>{t}</span>
            {d && <span className="px-1 text-[9.5px] leading-tight text-muted">{d}</span>}
          </li>
        )
      })}
    </ol>
  )
}

function Head({ icon: Icon, title, text }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e3f4f1] text-[#0b6d73]"><Icon className="size-[18px]" strokeWidth={1.8} /></span>
      <div className="min-w-0">
        <h2 className="text-[14.5px] font-bold leading-tight text-[#0d2a4a]">{title}</h2>
        {text && <p className="text-[11px] text-muted">{text}</p>}
      </div>
    </div>
  )
}

function ReviewHead({ icon, title, text, onEdit }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Head icon={icon} title={title} text={text} />
      <button type="button" onClick={onEdit} className="flex shrink-0 items-center gap-0.5 text-[12px] font-semibold text-[#0b6d73]">O‘zgartirish <ChevronRight className="size-3.5" /></button>
    </div>
  )
}

function Field({ f, icon: Icon, label, err, chevron, children }) {
  return (
    <div data-f={f} className="min-w-0">
      <label className={`relative flex min-h-[52px] items-center gap-2 rounded-xl border bg-white px-2.5 py-1.5 focus-within:border-sea ${err ? 'border-sale bg-[#fff7f7]' : 'border-[#e2e9ec]'}`}>
        {Icon && <Icon className="size-[18px] shrink-0 text-ink-2" strokeWidth={1.7} />}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[10.5px] text-muted">{label}</span>
          {children}
        </span>
        {chevron && <ChevronDown className="size-4 shrink-0 text-ink-2" />}
      </label>
      {err && <p className="mt-0.5 text-[10.5px] text-sale">{err}</p>}
    </div>
  )
}

function Radio({ on }) {
  return (
    <span className={`grid size-5 shrink-0 place-items-center rounded-full border-[1.5px] ${on ? 'border-[#0b8a7a]' : 'border-[#b8c4ca]'}`}>
      {on && <span className="size-2.5 rounded-full bg-[#0b8a7a]" />}
    </span>
  )
}

function ShipOption({ on, onClick, icon: Icon, title, text, info }) {
  return (
    <button type="button" role="radio" aria-checked={on} onClick={onClick} className={`flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left ${on ? 'border-[#0b8a7a] bg-[#eef8f6]' : 'border-[#e2e9ec] bg-white'}`}>
      <Radio on={on} />
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e3f4f1] text-[#0b6d73]"><Icon className="size-[18px]" strokeWidth={1.7} /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold text-[#0d2a4a]">{title}</span>
        <span className="block text-[11px] leading-tight text-ink-2">{text}</span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block rounded-md bg-[#e3f4f1] px-1.5 py-0.5 text-[10.5px] font-medium text-[#0b6d73]">{info.badge}</span>
        <span className={`mt-1 block text-[12px] font-semibold ${info.fee ? 'text-[#0d2a4a]' : 'text-[#0d2a4a]'}`}>{info.fee ? som(info.fee) : 'Bepul'}</span>
      </span>
    </button>
  )
}

export function Logo({ id }) {
  if (id === 'cash') return <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e5f6ec] text-[#16a34a]"><Banknote className="size-[18px]" /></span>
  if (id === 'nasiya') return <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#fff1df] text-[#f08c1a]"><CalendarDays className="size-[18px]" /></span>
  return <PayLogo id={id} />
}

function ItemRow({ it }) {
  return (
    <li className="flex items-center gap-2.5 py-2">
      <img src={it.image} alt="" className="size-11 shrink-0 rounded-lg bg-[#f3f6f8] object-contain p-0.5" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] font-medium text-[#0d2a4a]">{it.name}</span>
        {it.type && <span className="block truncate text-[10.5px] text-muted">{it.type}</span>}
      </span>
      <span className="shrink-0 text-[11px] text-muted">{it.qty} dona</span>
      <span className="shrink-0 whitespace-nowrap text-right text-[12.5px] font-semibold text-[#0d2a4a]">{som(it.price * it.qty)}</span>
    </li>
  )
}

function Summary({ items, goods, ship, mode, city, discount, total }) {
  return (
    <>
      <div className="mt-3 space-y-1.5 text-[12.5px]">
        <Row k={`Mahsulotlar (${items.length} ta)`} v={som(goods)} />
        <Row k={`Yetkazish (${mode === 'pickup' ? 'olib ketish' : `${city}, kuryer`})`} v={ship.fee ? som(ship.fee) : 'Bepul'} tone={ship.fee ? '' : 'text-[#0b8a7a]'} />
        <Row k="Chegirma (promokod)" v={discount ? `− ${som(discount)}` : som(0)} tone="text-[#0b8a7a]" />
      </div>
      <div className="mt-2.5 flex items-center justify-between border-t border-line pt-2.5">
        <span className="text-[16px] font-bold text-[#0d2a4a]">Jami</span>
        <span className="text-[19px] font-extrabold text-[#0b8a7a]">{som(total)}</span>
      </div>
    </>
  )
}

function Row({ k, v, tone = '' }) {
  return (
    <p className="flex items-center justify-between gap-3">
      <span className="min-w-0 truncate text-ink-2">{k}</span>
      <span className={`whitespace-nowrap font-medium ${tone || 'text-[#0d2a4a]'}`}>{v}</span>
    </p>
  )
}

function MapSheet({ current, onClose, onPick }) {
  const [sel, setSel] = useState(PINS.find((p) => p.district === current) || null)
  return (
    <BottomSheet title="Xaritadan tanlash" onClose={onClose} footer={<button type="button" disabled={!sel} onClick={() => onPick(sel)} className="h-12 flex-1 rounded-xl bg-[#0b6d73] text-[14px] font-semibold text-white disabled:opacity-40">Shu manzilni tanlash</button>}>
      <p className="text-[12px] text-muted">Toshkent shahri · nuqtani bosib manzilni tanlang</p>
      <div className="relative mt-2 overflow-hidden rounded-2xl">
        <svg viewBox="0 0 360 250" className="block w-full" role="img" aria-label="Toshkent xaritasi">
          <rect width="360" height="250" fill="#e6f0e2" />
          <g fill="#d3e4ce">
            <rect x="14" y="14" width="70" height="44" rx="4" /><rect x="100" y="12" width="80" height="34" rx="4" /><rect x="250" y="14" width="96" height="40" rx="4" />
            <rect x="20" y="200" width="90" height="36" rx="4" /><rect x="140" y="190" width="70" height="46" rx="4" /><rect x="290" y="180" width="60" height="56" rx="4" />
          </g>
          <path d="M0 130 C 80 110, 160 150, 360 120" stroke="#b9dcf0" strokeWidth="10" fill="none" />
          <g stroke="#fff" strokeWidth="9"><path d="M0 80 H360 M0 170 H360 M120 0 V250 M270 0 V250" /></g>
          <g stroke="#f1d58d" strokeWidth="5"><path d="M0 104 H360 M196 0 V250" /></g>
          {PINS.map((p) => {
            const on = sel?.district === p.district
            return (
              <g key={p.district} onClick={() => setSel(p)} className="cursor-pointer">
                <circle cx={p.x} cy={p.y} r="16" fill="transparent" />
                <path d={`M${p.x} ${p.y} c-6 -8 -10 -12 -10 -18 a10 10 0 0 1 20 0 c0 6 -4 10 -10 18z`} fill={on ? '#0b6d73' : '#ffffff'} stroke="#0b6d73" strokeWidth="2" />
                <circle cx={p.x} cy={p.y - 18} r="3.5" fill={on ? '#fff' : '#0b6d73'} />
                <text x={p.x} y={p.y + 13} textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#0d2a4a">{p.district}</text>
              </g>
            )
          })}
        </svg>
      </div>
      <div className="mt-2.5 flex min-h-[48px] items-center gap-2.5 rounded-xl bg-[#eef8f6] px-3 py-2">
        <MapPin className="size-5 shrink-0 text-[#0b6d73]" />
        <p className="text-[12.5px] text-[#0d2a4a]">{sel ? sel.address : 'Manzil tanlanmagan'}</p>
      </div>
    </BottomSheet>
  )
}

function Paying({ method, amount, onCancel, onDone }) {
  const [phase, setPhase] = useState(0)
  const done = useRef(onDone)
  done.current = onDone
  useEffect(() => {
    const a = setTimeout(() => setPhase(1), 900)
    const b = setTimeout(() => setPhase(2), 1800)
    const c = setTimeout(() => done.current(), 2400)
    return () => { clearTimeout(a); clearTimeout(b); clearTimeout(c) }
  }, [])
  const steps = method === 'nasiya'
    ? ['Uzum Nasiya bilan bog‘lanilmoqda', 'Muddatli to‘lov tasdiqlanmoqda', 'Buyurtma yaratilmoqda']
    : [`${METHODS[method][0]} bilan bog‘lanilmoqda`, 'To‘lov tasdiqlanmoqda', 'Buyurtma yaratilmoqda']
  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end bg-ink/45">
      <div role="dialog" aria-modal="true" aria-label="To‘lov" className="rounded-t-3xl bg-white px-5 pb-[calc(18px+env(safe-area-inset-bottom))] pt-5 text-center">
        <div className="mx-auto w-fit"><Logo id={method} /></div>
        <p className="mt-2 text-[13px] text-ink-2">{method === 'nasiya' ? 'Birinchi oylik to‘lov' : `${METHODS[method][0]} orqali to‘lov`}</p>
        <p className="text-[24px] font-extrabold text-[#0d2a4a]">{som(amount)}</p>
        <ul className="mx-auto mt-4 max-w-[270px] space-y-2.5 text-left">
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

/* ---------- Yakuniy: tasdiqlandi ---------- */

function Done({ order }) {
  const navigate = useNavigate()
  const { items } = useCart()
  const [all, setAll] = useState(false)
  const [toast, setToast] = useState('')
  const closeToast = useCallback(() => setToast(''), [])
  const cash = order.method === 'cash'
  const list = all ? order.items : order.items.slice(0, 3)

  return (
    <div className={`${page} pb-[86px]`}>
      <header className="flex items-center gap-2 px-3.5 pt-3">
        <button type="button" onClick={() => navigate('/marketplace')} aria-label="Orqaga" className="grid size-9 place-items-center rounded-full text-[#0d2a4a]"><ChevronLeft className="size-6" /></button>
        <BrandLogo />
        <div className="ml-auto flex items-center">
          <button type="button" onClick={() => navigate('/buyurtma')} aria-label="Savat" className="relative grid size-10 place-items-center rounded-full text-[#0d2a4a]">
            <ShoppingCart className="size-[21px]" />
            {items.length > 0 && <CountBadge>{items.length}</CountBadge>}
          </button>
          <button type="button" onClick={() => setToast('Yangi bildirishnomalar yo‘q')} aria-label="Bildirishnomalar" className="grid size-10 place-items-center rounded-full text-[#0d2a4a]"><Bell className="size-[21px]" /></button>
        </div>
      </header>

      <div className="px-3.5">
        <Stepper step={4} done={order.method} pickup={order.mode === 'pickup'} />

        <div className="relative mx-auto mt-4 grid size-[124px] place-items-center">
          <svg viewBox="0 0 124 124" className="absolute inset-0" aria-hidden="true">
            {[[-60, 14], [-25, 6], [25, 6], [60, 14], [200, 14], [160, 6], [-160, 6]].map(([deg, len], i) => {
              const r = (deg * Math.PI) / 180
              const r1 = 54
              return <line key={i} x1={62 + Math.cos(r) * r1} y1={62 + Math.sin(r) * r1} x2={62 + Math.cos(r) * (r1 + len * 0.6)} y2={62 + Math.sin(r) * (r1 + len * 0.6)} stroke="#2bb3a3" strokeWidth="3" strokeLinecap="round" />
            })}
          </svg>
          <span className="grid size-[96px] place-items-center rounded-full bg-[#d9f0ec]">
            <span className="grid size-[72px] place-items-center rounded-full bg-[#0b6d73] text-white shadow-[0_8px_20px_rgb(11_109_115/0.35)]"><Check className="size-10" strokeWidth={2.6} /></span>
          </span>
        </div>
        <h1 className="mt-2 text-center text-[24px] font-extrabold text-[#0d2a4a]">{cash ? 'Buyurtma qabul qilindi!' : 'To‘lov tasdiqlandi!'}</h1>
        <p className="text-center text-[13px] text-ink-2">{cash ? (order.mode === 'pickup' ? 'To‘lov mahsulotni olganingizda amalga oshiriladi.' : 'To‘lov yetkazilganda amalga oshiriladi.') : 'Buyurtmangiz qabul qilindi va tayyorlanmoqda.'}</p>

        <section className={`${card} mt-4 p-3.5`}>
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-full bg-[#e3f4f1] text-[#0b6d73]"><FileText className="size-[18px]" /></span>
            <h2 className="flex-1 text-[15px] font-bold text-[#0d2a4a]">Buyurtma ma’lumotlari</h2>
            <span className="rounded-lg bg-[#e3f4f1] px-2 py-1 text-[11.5px] font-bold text-[#0b6d73]">#{order.id}</span>
          </div>
          <div className="mt-1.5 divide-y divide-line">
            <InfoRow icon={CalendarDays} k="Buyurtma sanasi" v={order.at} />
            <InfoRow icon={CreditCard} k="To‘lov usuli" v={<span className="flex items-center justify-end gap-2"><span className="scale-[0.8]"><Logo id={order.method} /></span>{order.months ? `Nasiya (${order.months} oy)` : (METHODS[order.method] || METHODS.cash)[0]}</span>} />
            <InfoRow icon={Truck} k={order.mode === 'pickup' ? 'Olib ketish' : 'Taxminiy yetkazish vaqti'} v={<>{order.eta}<span className="block text-[10.5px] font-normal text-muted">({order.days})</span></>} />
            <InfoRow icon={Coins} k="Jami summa" v={<span className="text-[16px] font-extrabold">{som(order.total)}</span>} />
          </div>
        </section>

        <section className={`${card} mt-3 p-3.5`}>
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-full bg-[#e3f4f1] text-[#0b6d73]"><ShoppingBag className="size-[18px]" /></span>
            <h2 className="min-w-0 flex-1 whitespace-nowrap text-[14px] font-bold text-[#0d2a4a]">Buyurtma mahsulotlari ({order.items.length} ta)</h2>
            {order.items.length > 3 && <button type="button" onClick={() => setAll((v) => !v)} className="flex items-center text-[12px] font-semibold text-[#0b6d73]">{all ? 'Yig‘ish' : 'Barchasini ko‘rish'} <ChevronRight className={`size-3.5 transition ${all ? '-rotate-90' : ''}`} /></button>}
          </div>
          <ul className="mt-1 divide-y divide-line">
            {list.map((it) => (
              <li key={it.id} className="flex items-center gap-3 py-2.5">
                <img src={it.image} alt="" className="h-[60px] w-[76px] shrink-0 rounded-lg bg-[#f3f6f8] object-contain p-1" />
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 block text-[13px] font-bold leading-tight text-[#0d2a4a]">{it.name}</span>
                  {it.type && <span className="block truncate text-[11px] text-ink-2">{it.type}</span>}
                </span>
                <span className="shrink-0 text-[11px] text-muted">{it.qty} dona</span>
                <span className="shrink-0 text-right">
                  <span className="block whitespace-nowrap text-[13px] font-bold text-[#0d2a4a]">{som(it.price * it.qty)}</span>
                  {it.qty > 1 && <span className="block text-[10px] text-muted">({som(it.price)} × {it.qty})</span>}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <button type="button" onClick={() => navigate(`/buyurtma/kuzatish/${order.id}`)} className="mt-3 flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-[#0b6d73] text-[14.5px] font-semibold text-white shadow-[0_6px_16px_rgb(11_109_115/0.3)]">
          <Truck className="size-5" /> Buyurtmani kuzatish <ArrowRight className="size-4" />
        </button>
        <button type="button" onClick={() => navigate('/')} className="mt-2.5 flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-[#0b6d73] bg-white text-[14px] font-semibold text-[#0b6d73]">
          <House className="size-5" /> Bosh sahifaga qaytish
        </button>
      </div>

      <MobileToast text={toast} onClose={closeToast} />
      <MobileTabBar />
    </div>
  )
}

function InfoRow({ icon: Icon, k, v }) {
  return (
    <div className="flex items-center gap-2.5 py-2.5 text-[12.5px]">
      <Icon className="size-[18px] shrink-0 text-[#0b6d73]" strokeWidth={1.7} />
      <span className="flex-1 text-ink-2">{k}</span>
      <span className="text-right font-semibold text-[#0d2a4a]">{v}</span>
    </div>
  )
}
