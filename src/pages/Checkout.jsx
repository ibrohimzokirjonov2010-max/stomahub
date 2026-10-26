import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  House, ChevronRight, UserRound, MapPin, Truck, Store, Check, Lock, ShieldCheck,
  CreditCard, Banknote, CalendarDays, Pencil, ArrowRight, ArrowLeft, X,
} from 'lucide-react'
import ShopLayout from '../components/market/ShopLayout'
import { useCart } from '../cart'
import { som } from '../marketData'
import { profileStore, useProfile } from '../profileStore'
import { receiveStock } from '../omborData'

const SHIP_FEE = 25000

const CITIES = {
  Toshkent: ['Yunusobod tumani', 'Chilonzor tumani', 'Mirzo Ulug‘bek tumani', 'Yakkasaroy tumani', 'Mirobod tumani', 'Shayxontohur tumani', 'Sergeli tumani', 'Uchtepa tumani', 'Yashnobod tumani', 'Bektemir tumani', 'Olmazor tumani'],
  Samarqand: ['Markaz', 'Siab tumani', 'Temiryo‘l tumani'],
  Buxoro: ['Markaz', 'Kogon tumani'],
  Andijon: ['Markaz', 'Asaka tumani'],
  "Farg‘ona": ['Markaz', 'Qo‘qon shahri'],
  Namangan: ['Markaz', 'Chortoq tumani'],
  Nukus: ['Markaz'],
}

const METHODS = [
  { id: 'click', title: 'Click', text: 'Click orqali to‘lov', hint: 'Tavsiya etiladi', pay: 'https://my.click.uz/services/pay' },
  { id: 'payme', title: 'Payme', text: 'Payme orqali to‘lov', pay: 'https://payme.uz' },
  { id: 'uzum', title: 'Uzum', text: 'Uzum orqali to‘lov', pay: 'https://uzum.uz' },
  { id: 'card', title: 'Bank kartasi', text: 'Visa, Mastercard, Humo' },
  { id: 'cash', title: 'Naqd to‘lov', text: 'Yetkazishda naqd' },
  { id: 'installment', title: 'Muddatli to‘lov', text: 'Uzum nasiya / Bank' },
]

const ORIGIN = {
  market: { label: 'Marketplace', to: '/marketplace', active: 'market' },
  forma: { label: 'Forma', to: '/forma', active: 'forma' },
  jihoz: { label: 'Jihozlar', to: '/jihozlar', active: 'jihozlar' },
}

const input = 'h-11 w-full rounded-xl border border-[#e6ebf2] bg-white text-[13px] text-ink outline-none focus:border-sea'

export default function Checkout() {
  const loc = useLocation()
  const origin = ORIGIN[loc.state?.from] || ORIGIN.market
  const { items, total, clear } = useCart()
  const profile = useProfile()
  const [step, setStep] = useState(1)
  const [method, setMethod] = useState('click')
  const [shipMode, setShipMode] = useState('courier')
  const [form, setForm] = useState({
    name: '',
    phone: '',
    city: 'Toshkent',
    district: '',
    address: '',
    note: '',
    saved: '',
  })
  const [code, setCode] = useState('')
  const [promoOpen, setPromoOpen] = useState(false)
  const [discount, setDiscount] = useState(0)
  const [promoMsg, setPromoMsg] = useState('')
  const [invoice, setInvoice] = useState(true)
  const [agree, setAgree] = useState(false)
  const [error, setError] = useState('')
  const [payOpen, setPayOpen] = useState(false)
  const [allSaved, setAllSaved] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [placed, setPlaced] = useState(null)
  const [orderId] = useState(() => `SH-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`)
  const savedRows = (profile.accountLive ? profile.addresses : []).map((row) => ({
    id: row.id,
    tag: row.tag || 'Manzil',
    line: row.address || row.street || '',
    city: row.city,
    district: row.district,
    address: row.address || row.street || '',
  }))

  useEffect(() => {
    if (!profile.accountLive) return
    const addr = profile.addresses.find((row) => row.id === profile.defaultAddr) || profile.addresses[0]
    setForm((current) => ({
      ...current,
      name: profile.name || '',
      phone: profile.phone || '',
      city: addr?.city || profile.city || current.city || 'Toshkent',
      district: addr?.district || profile.district || '',
      address: addr?.address || '',
      saved: addr?.id || '',
    }))
  }, [profile.accountLive])

  const ship = shipMode === 'courier' ? SHIP_FEE : 0
  const goods = total
  const grand = Math.max(0, goods + ship - discount)
  const pay = METHODS.find((m) => m.id === method) || METHODS[0]

  const patch = (key, value) => setForm((f) => ({ ...f, [key]: value, saved: key === 'saved' ? value : '' }))

  const applyPromo = () => {
    const token = code.trim().toUpperCase()
    if (!token) {
      setPromoMsg('Promokodni kiriting')
      setDiscount(0)
      return
    }
    if (token === 'SH10') {
      setDiscount(Math.round(goods * 0.1))
      setPromoMsg('Promokod qo‘llandi')
      return
    }
    setDiscount(0)
    setPromoMsg('Bunday promokod topilmadi')
  }

  const next = () => {
    if (step === 1) {
      const phone = form.phone.replace(/\D/g, '')
      const needAddress = shipMode === 'courier' && !form.address.trim()
      if (!form.name.trim() || phone.length < 9 || !form.city || !form.district || needAddress) {
        setError('Ism, telefon, shahar, tuman va aniq manzil majburiy.')
        return
      }
    }
    setError('')
    setStep((n) => Math.min(3, n + 1))
  }

  const finish = (openLink) => {
    if (!agree) {
      setError('Oferta shartlari bilan tanishib chiqishingiz kerak.')
      return
    }
    setError('')
    if (openLink && pay.pay) window.open(pay.pay, '_blank', 'noopener,noreferrer')
    const id = orderId
    const at = new Date()
    const months = ['yan', 'fev', 'mar', 'apr', 'may', 'iyun', 'iyul', 'avg', 'sen', 'okt', 'noy', 'dek']
    const order = {
      id,
      at: `${at.getDate()} ${months[at.getMonth()]}, ${at.getFullYear()} ${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`,
      items: items.map((it) => ({ ...it })),
      goods,
      fee: ship,
      discount,
      total: grand,
      method: pay.id,
      months: 0,
      mode: shipMode === 'courier' ? 'courier' : 'pickup',
      eta: '1–2 kun',
      days: '1–2 kun',
      name: form.name.trim(),
      phone: form.phone,
      address: shipMode === 'courier' ? `${form.city}, ${form.address}` : 'Do‘kondan olib ketish',
    }
    profileStore.addOrder(order)
    const snap = {
      id,
      items: order.items,
      goods,
      ship,
      discount,
      grand,
      method: pay,
      form: { ...form },
      shipMode,
      invoice,
    }
    if (items.length) receiveStock(items)
    clear()
    setPayOpen(false)
    setPlaced(snap)
    if (invoice) downloadInvoice(snap)
  }

  const confirm = () => {
    if (!items.length) return
    if (!agree) {
      setError('Oferta shartlari bilan tanishib chiqishingiz kerak.')
      return
    }
    setError('')
    if (pay.pay) setPayOpen(true)
    else finish(false)
  }

  return (
    <ShopLayout active={origin.active} search="plain" placeholder="Mahsulot, brend yoki kategoriya qidiring...">
      <div className="pb-8 pt-3">
        <p className="mb-3 flex flex-wrap items-center gap-1 text-[12px] text-muted">
          <Link to={origin.to} className="text-sea" aria-label={origin.label}><House className="size-3.5" /></Link>
          <Link to={origin.to} className="hover:text-sea">{origin.label}</Link>
          <ChevronRight className="size-3" />
          <Link to={origin.to} className="hover:text-sea">Savatcha</Link>
          <ChevronRight className="size-3" />
          <span className="font-medium text-ink">Buyurtma berish</span>
        </p>

        {placed ? (
          <Done placed={placed} origin={origin} />
        ) : (
          <>
            <h1 className="text-[26px] font-extrabold tracking-tight text-ink">Buyurtma berish</h1>
            <p className="mt-1 text-[13px] text-muted">
              {step === 1 && 'Buyurtmangizni rasmiylashtirish uchun ma’lumotlarni kiriting'}
              {step === 2 && 'Buyurtmangizni rasmiylashtirish uchun to‘lov usulini tanlang'}
              {step === 3 && 'Buyurtmangizni tekshirib, tasdiqlang'}
            </p>
            <Stepper step={step} />
            {error && <p className="mt-3 rounded-xl bg-[#fff1f2] px-3 py-2 text-[12.5px] text-[#e11d48]">{error}</p>}

            <div className="buy-layout mt-4">
              <div className="min-w-0">
                {items.length === 0 ? (
                  <div className="rounded-2xl bg-white p-8 text-center shadow-card">
                    <p className="text-[14px] text-ink-2">Savat bo‘sh. Avval mahsulot tanlang.</p>
                    <Link to={origin.to} className="mt-3 inline-flex h-10 items-center rounded-xl bg-sea px-4 text-[13px] font-semibold text-white">Mahsulotlarga qaytish</Link>
                  </div>
                ) : (
                  <>
                    {step === 1 && (
                      <StepAddress
                        form={form}
                        patch={patch}
                        setForm={setForm}
                        shipMode={shipMode}
                        setShipMode={setShipMode}
                        zoom={zoom}
                        setZoom={setZoom}
                        allSaved={allSaved}
                        setAllSaved={setAllSaved}
                        savedRows={savedRows}
                      />
                    )}
                    {step === 2 && (
                      <StepPay
                        method={method}
                        setMethod={setMethod}
                        code={code}
                        setCode={setCode}
                        promoMsg={promoMsg}
                        applyPromo={applyPromo}
                        goods={goods}
                        ship={ship}
                        discount={discount}
                        grand={grand}
                        invoice={invoice}
                        setInvoice={setInvoice}
                        onBack={() => { setError(''); setStep(1) }}
                        onNext={next}
                      />
                    )}
                    {step === 3 && (
                      <StepReview
                        items={items}
                        form={form}
                        shipMode={shipMode}
                        pay={pay}
                        agree={agree}
                        setAgree={setAgree}
                        onBack={() => { setError(''); setStep(2) }}
                        onEdit={(n) => { setError(''); setStep(n) }}
                        onConfirm={confirm}
                      />
                    )}
                  </>
                )}
              </div>

              <Summary
                items={items}
                goods={goods}
                ship={ship}
                discount={discount}
                grand={grand}
                step={step}
                promoOpen={promoOpen}
                setPromoOpen={setPromoOpen}
                code={code}
                setCode={setCode}
                promoMsg={promoMsg}
                applyPromo={applyPromo}
                onNext={next}
                locked={!items.length || !!placed}
              />
            </div>
          </>
        )}
      </div>

      {payOpen && (
        <PayModal
          pay={pay}
          amount={grand}
          orderId={orderId}
          onClose={() => setPayOpen(false)}
          onOther={() => { setPayOpen(false); setStep(2) }}
          onPay={() => finish(true)}
        />
      )}
    </ShopLayout>
  )
}

function Stepper({ step }) {
  const rows = [
    ['Yetkazish', 'Manzil va yetkazish usuli'],
    ['To‘lov', step > 2 ? 'To‘lov usuli tanlandi' : 'To‘lov usulini tanlang'],
    ['Tasdiqlash', 'Buyurtmani tekshirib tasdiqlang'],
  ]
  return (
    <ol className="mt-4 grid grid-cols-3 gap-2">
      {rows.map(([title, text], i) => {
        const n = i + 1
        const done = step > n
        const on = step === n
        return (
          <li key={title} className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`grid size-7 shrink-0 place-items-center rounded-full text-[12px] font-bold ${done || on ? 'bg-sea text-white' : 'bg-[#e7eef5] text-muted'}`}>
                {done ? <Check className="size-3.5" /> : n}
              </span>
              {n < 3 && <span className={`h-[2px] flex-1 rounded ${step > n ? 'bg-sea' : 'bg-[#e3eaf2]'}`} />}
            </div>
            <b className={`mt-1.5 block text-[13px] ${on || done ? 'text-sea' : 'text-ink'}`}>{title}</b>
            <span className="block truncate text-[11px] text-muted">{text}</span>
          </li>
        )
      })}
    </ol>
  )
}

function StepAddress({ form, patch, setForm, shipMode, setShipMode, zoom, setZoom, allSaved, setAllSaved, savedRows }) {
  const districts = CITIES[form.city] || []
  const saved = allSaved ? savedRows : savedRows.slice(0, 2)
  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-white p-4 shadow-card">
        <h2 className="text-[16px] font-bold">Yetkazish manzili</h2>
        <p className="mt-0.5 text-[12px] text-muted">Buyurtmangiz qayerga yetkazilishini kiriting</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Ism" required>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input className={`${input} pl-9`} value={form.name} onChange={(e) => patch('name', e.target.value)} />
            </div>
          </Field>
          <Field label="Telefon" required>
            <div className={`${input} flex items-center gap-2 px-2`}>
              <Flag />
              <span className="text-[13px] font-semibold text-ink">+998</span>
              <input className="h-full min-w-0 flex-1 bg-transparent outline-none" value={form.phone} placeholder="90 123 45 67" onChange={(e) => patch('phone', e.target.value)} />
            </div>
          </Field>
          <Field label="Shahar" required>
            <Select value={form.city} onChange={(city) => {
              const list = CITIES[city] || []
              setForm((f) => ({ ...f, city, district: list.includes(f.district) ? f.district : (list[0] || ''), saved: '' }))
            }}>
              {Object.keys(CITIES).map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Tuman" required>
            <Select value={form.district} onChange={(district) => patch('district', district)}>
              {districts.map((d) => <option key={d}>{d}</option>)}
            </Select>
          </Field>
        </div>
        <div className="mt-3">
          <Field label="Aniq manzil">
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input className={`${input} pl-9`} value={form.address} onChange={(e) => patch('address', e.target.value)} />
            </div>
          </Field>
        </div>
        <div className="mt-3">
          <CityMap zoom={zoom} onZoom={setZoom} />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <b className="text-[13px]">Saqlangan manzillarim</b>
          <button type="button" onClick={() => setAllSaved((v) => !v)} className="text-[12px] font-semibold text-sea">{allSaved ? 'Yig‘ish' : 'Barchasini ko‘rish'}</button>
        </div>
        <div className="mt-2 space-y-2">
          {!saved.length && <p className="rounded-xl border border-dashed border-[#d7e4ea] px-3 py-4 text-center text-[12.5px] text-muted">Saqlangan manzil yo‘q. Manzilni yuqorida kiriting.</p>}
          {saved.map((a) => (
            <button key={a.id} type="button" onClick={() => setForm((f) => ({ ...f, city: a.city, district: a.district, address: a.address, saved: a.id }))} className="flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left" style={{ borderColor: form.saved === a.id ? '#0b8a95' : '#e6ebf2' }}>
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sea-50 text-sea"><MapPin className="size-4" /></span>
              <span className="min-w-0 flex-1">
                <b className="block text-[13px]">{a.tag}</b>
                <span className="block truncate text-[12px] text-muted">{a.line}</span>
              </span>
              <span className="text-[12px] font-semibold text-sea">Tahrirlash</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-card">
        <h2 className="text-[16px] font-bold">Yetkazish usuli</h2>
        <p className="mt-0.5 text-[12px] text-muted">Sizga qulay yetkazish usulini tanlang</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Choice on={shipMode === 'courier'} onClick={() => setShipMode('courier')} icon={Truck} title="Kuryer orqali" text="Manzilingizga yetkazib berish" meta="1–2 kun" price={`${SHIP_FEE.toLocaleString('ru-RU').replace(/\u00a0/g, ' ')} so‘m`} />
          <Choice on={shipMode === 'pickup'} onClick={() => setShipMode('pickup')} icon={Store} title="Olib ketish" text="Do‘kondan o‘ziroq olib ketish" meta="Bepul" />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-card">
        <h2 className="text-[16px] font-bold">Qo‘shimcha ma’lumot</h2>
        <textarea maxLength={300} value={form.note} onChange={(e) => patch('note', e.target.value)} placeholder="Kuryer uchun izoh (masalan: qo‘ng‘iroq qiling, darvozadan kutaman va h.k.)" className="mt-3 h-24 w-full resize-none rounded-xl border border-[#e6ebf2] px-3 py-2 text-[13px] outline-none focus:border-sea" />
        <p className="text-right text-[11px] text-muted">{form.note.length}/300</p>
      </section>
    </div>
  )
}

function StepPay({ method, setMethod, code, setCode, promoMsg, applyPromo, goods, ship, discount, grand, invoice, setInvoice, onBack, onNext }) {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-white p-4 shadow-card">
        <h2 className="text-[16px] font-bold">To‘lov usulini tanlang</h2>
        <p className="mt-0.5 text-[12px] text-muted">Sizga qulay to‘lov usulini tanlang</p>
        <div className="buy-pay mt-3">
          {METHODS.map((m) => (
            <button key={m.id} type="button" onClick={() => setMethod(m.id)} className="relative rounded-2xl border bg-white px-3 py-3 text-left" style={{ borderColor: method === m.id ? '#0b8a95' : '#e6ebf2', boxShadow: method === m.id ? 'inset 0 0 0 1px #0b8a95' : 'none' }}>
              {m.hint && <span className="absolute -top-2 right-3 rounded-full bg-[#e5f7ea] px-2 py-0.5 text-[10px] font-semibold text-[#17803d]">{m.hint}</span>}
              <span className="flex items-center gap-2">
                <Mark id={m.id} />
                <span className="min-w-0 flex-1">
                  <b className="block text-[13px]">{m.title}</b>
                  <span className="block text-[11px] text-muted">{m.text}</span>
                </span>
                <span className={`grid size-5 shrink-0 place-items-center rounded-full ${method === m.id ? 'bg-sea text-white' : 'border border-[#d5dde8]'}`}>
                  {method === m.id && <Check className="size-3" />}
                </span>
              </span>
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2 rounded-xl bg-[#eefbf6] px-3 py-2.5 text-[12.5px] text-[#157a45]">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          <p><b>To‘lovlar xavfsiz.</b> Barcha to‘lovlar shifrlangan va to‘liq himoyalangan. Sizning ma’lumotlaringiz xavfsiz.</p>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-card">
        <h2 className="text-[15px] font-bold">Promokod</h2>
        <p className="mt-0.5 text-[12px] text-muted">Agar promokodingiz bo‘lsa, kiriting</p>
        <div className="mt-2 flex gap-2">
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Promokodni kiriting" className={`${input} px-3`} />
          <button type="button" onClick={applyPromo} className="h-11 shrink-0 rounded-xl px-4 text-[13px] font-semibold text-sea">Qo‘llash</button>
        </div>
        {promoMsg && <p className="mt-1 text-[12px] text-muted">{promoMsg}</p>}
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-card">
        <h2 className="text-[15px] font-bold">To‘lov ma’lumotlari</h2>
        <Row k="Mahsulotlar" v={som(goods)} />
        <Row k="Yetkazish" v={som(ship)} />
        <Row k="Chegirma (promokod)" v={som(discount)} />
        <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
          <b>Jami to‘lov</b>
          <b className="text-[18px] text-sea">{som(grand)}</b>
        </div>
        <label className="mt-3 flex items-start gap-2 text-[12.5px]">
          <input type="checkbox" checked={invoice} onChange={(e) => setInvoice(e.target.checked)} className="mt-0.5 accent-[#0b8a95]" />
          <span><b>Hisob-faktura</b><br /><span className="text-muted">Menga elektron hisob-faktura (PDF) yuborilsin</span></span>
        </label>
      </section>

      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} className="inline-flex h-11 items-center gap-1 rounded-xl border border-[#d7e0ea] bg-white px-4 text-[13px] font-semibold"><ArrowLeft className="size-4" /> Orqaga</button>
        <button type="button" onClick={onNext} className="inline-flex h-11 items-center gap-1 rounded-xl bg-sea px-5 text-[13px] font-semibold text-white">Davom etish <ArrowRight className="size-4" /></button>
      </div>
    </div>
  )
}

function StepReview({ items, form, shipMode, pay, agree, setAgree, onBack, onEdit, onConfirm }) {
  return (
    <div className="space-y-4">
      <div className="buy-review">
        <section className="rounded-2xl bg-white p-4 shadow-card">
          <h2 className="mb-2 flex items-center gap-2 text-[15px] font-bold"><span className="grid size-6 place-items-center rounded-full bg-sea text-[12px] text-white">1</span> Mahsulotlar ({items.length} ta)</h2>
          <ul>
            {items.map((it) => (
              <li key={it.id} className="flex items-center gap-3 border-b border-line py-2.5 last:border-0">
                <img src={it.image} alt="" className="size-12 shrink-0 rounded-lg bg-[#f4f7fb] object-contain" />
                <div className="min-w-0 flex-1">
                  <b className="block truncate text-[13px]">{it.name}</b>
                  <span className="text-[12px] text-muted">{it.qty} dona</span>
                </div>
                <b className="whitespace-nowrap text-[13px]">{som(it.price * it.qty)}</b>
              </li>
            ))}
          </ul>
        </section>
        <div className="space-y-3">
          <section className="rounded-2xl bg-white p-4 shadow-card">
            <Head n="2" title="Yetkazish manzili" onEdit={() => onEdit(1)} />
            <b className="mt-2 block text-[13px]">{form.name}</b>
            <p className="text-[12.5px] text-ink-2">+998 {form.phone}</p>
            <p className="text-[12.5px] text-ink-2">{form.city}, {form.district}</p>
            <p className="text-[12.5px] text-ink-2">{form.address}</p>
            <div className="mt-2"><CityMap compact /></div>
          </section>
          <section className="rounded-2xl bg-white p-4 shadow-card">
            <Head n="3" title="Yetkazish vaqti" onEdit={() => onEdit(1)} />
            <div className="mt-2 flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-sea-50 text-sea">{shipMode === 'courier' ? <Truck className="size-4" /> : <Store className="size-4" />}</span>
              <span>
                <b className="block text-[13px]">{shipMode === 'courier' ? 'Kuryer orqali' : 'Olib ketish'}</b>
                <span className="text-[12px] text-muted">{shipMode === 'courier' ? 'Manzilingizga yetkazib berish' : 'Do‘kondan o‘ziroq olib ketish'}</span>
              </span>
            </div>
            <p className="mt-2 text-[13px] font-semibold">27 okt 2026, Seshanba</p>
            <p className="text-[12px] text-muted">10:00 – 18:00 oralig‘ida</p>
          </section>
          <section className="rounded-2xl bg-white p-4 shadow-card">
            <Head n="4" title="To‘lov usuli" onEdit={() => onEdit(2)} />
            <div className="mt-2 flex items-center gap-2">
              <Mark id={pay.id} />
              <span>
                <b className="block text-[13px]">{pay.title}</b>
                <span className="text-[12px] text-muted">{pay.text}</span>
              </span>
            </div>
          </section>
        </div>
      </div>

      <label className="flex items-start gap-2 rounded-2xl bg-[#eefbf6] px-3 py-3 text-[12.5px]">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 accent-[#0b8a95]" />
        <span>
          <b>Men oferta shartlari bilan tanishib chiqdim va roziman</b>
          <span className="mt-0.5 block text-muted">Buyurtma berish orqali siz StomaHub’ning foydalanish shartlari va maxfiylik siyosatiga rozilik bildirasiz.</span>
        </span>
      </label>

      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} className="inline-flex h-11 items-center gap-1 rounded-xl border border-[#d7e0ea] bg-white px-4 text-[13px] font-semibold"><ArrowLeft className="size-4" /> Orqaga</button>
        <button type="button" onClick={onConfirm} className="inline-flex h-11 items-center gap-1 rounded-xl bg-sea px-5 text-[13px] font-semibold text-white">Buyurtmani tasdiqlash <ArrowRight className="size-4" /></button>
      </div>
    </div>
  )
}

function Summary({ items, goods, ship, discount, grand, step, promoOpen, setPromoOpen, code, setCode, promoMsg, applyPromo, onNext, locked }) {
  return (
    <aside className="min-w-0 space-y-3">
      <div className="rounded-2xl bg-white p-4 shadow-card">
        <div className="mb-2 flex items-center justify-between">
          <b>Buyurtma ma’lumotlari</b>
          <span className="text-[12px] text-muted">{items.length} ta mahsulot</span>
        </div>
        <ul>
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-2 border-b border-line py-2 last:border-0">
              <img src={it.image} alt="" className="size-10 shrink-0 rounded-lg bg-[#f4f7fb] object-contain" />
              <div className="min-w-0 flex-1">
                <b className="block truncate text-[12.5px]">{it.name}</b>
                <span className="text-[11px] text-muted">{it.qty} dona</span>
              </div>
              <b className="whitespace-nowrap text-[12px]">{som(it.price * it.qty)}</b>
            </li>
          ))}
        </ul>
        <div className="mt-2 space-y-1.5 text-[12.5px]">
          <Row k={`Mahsulotlar (${items.length} ta)`} v={som(goods)} />
          <Row k="Yetkazish" v={som(ship)} />
          {step === 3 && <Row k="Chegirma (promokod)" v={som(discount)} />}
          <div className="flex items-center justify-between">
            <span className="text-muted">Promokod</span>
            <button type="button" onClick={() => setPromoOpen(true)} className="font-semibold text-sea">Qo‘llash</button>
          </div>
          {promoOpen && (
            <div className="flex gap-1">
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="SH10" className="h-9 min-w-0 flex-1 rounded-lg border border-[#e6ebf2] px-2 text-[12px] outline-none" />
              <button type="button" onClick={applyPromo} className="h-9 rounded-lg px-2 text-[12px] font-semibold text-sea">OK</button>
            </div>
          )}
          {promoMsg && <p className="text-[11px] text-muted">{promoMsg}</p>}
        </div>
        <div className="mt-3 flex items-end justify-between">
          <b>Jami</b>
          <b className="text-[22px] text-sea">{som(grand)}</b>
        </div>
        {step < 3 && (
          <button type="button" onClick={onNext} disabled={locked} className="mt-3 flex h-11 w-full items-center justify-center gap-1 rounded-xl bg-sea text-[13px] font-semibold text-white disabled:opacity-50">
            Davom etish <ArrowRight className="size-4" />
          </button>
        )}
        <p className="mt-2 flex items-center justify-center gap-1 text-center text-[11px] text-muted"><Lock className="size-3" /> Xavfsiz to‘lov va ma’lumotlaringiz himoyalangan</p>
      </div>
      {step < 3 ? (
        <div className="flex gap-2 rounded-2xl bg-[#eefbf6] p-3 text-[12px] text-[#157a45]">
          <Truck className="mt-0.5 size-4 shrink-0" />
          <p><b>Yetkazish haqida.</b> Toshkent shahri bo‘ylab 1–2 kun ichida yetkazib beriladi. Boshqa hududlar uchun muddatlar operator tomonidan tasdiqlanadi.</p>
        </div>
      ) : (
        <div className="flex gap-2 rounded-2xl bg-[#eefbf6] p-3 text-[12px] text-[#157a45]">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          <p><b>Xavfsiz xarid.</b> To‘lov ma’lumotlaringiz himoyalangan. Barcha operatsiyalar shifrlangan.</p>
        </div>
      )}
    </aside>
  )
}

function Done({ placed, origin }) {
  return (
    <div className="mx-auto max-w-[720px] rounded-2xl bg-white p-6 shadow-card">
      <div className="flex items-start gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#e5f7ea] text-[#17803d]"><Check className="size-6" /></span>
        <div>
          <h1 className="text-[22px] font-extrabold">Buyurtmangiz qabul qilindi</h1>
          <p className="mt-1 text-[13px] text-muted">To‘lov tasdiqlandi. Buyurtma raqami <b className="text-ink">#{placed.id}</b></p>
        </div>
      </div>
      <div className="mt-4 space-y-1 text-[13px]">
        <Row k="To‘lov usuli" v={placed.method.title} />
        <Row k="Yetkazish" v={placed.shipMode === 'courier' ? 'Kuryer orqali' : 'Olib ketish'} />
        <Row k="Manzil" v={`${placed.form.city}, ${placed.form.address}`} />
        <Row k="Jami" v={som(placed.grand)} />
      </div>
      <p className="mt-3 text-[12.5px] text-muted">Mahsulotlar tekshiruvdan so‘ng omborga qo‘shildi. Yetkazish 27 okt 2026, 10:00 – 18:00 oralig‘ida.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link to={origin.to} className="inline-flex h-10 items-center rounded-xl bg-sea px-4 text-[13px] font-semibold text-white">{origin.label}ga qaytish</Link>
        <Link to="/ombor" className="inline-flex h-10 items-center rounded-xl border border-[#d7e0ea] px-4 text-[13px] font-semibold">Omborni ko‘rish</Link>
      </div>
    </div>
  )
}

function PayModal({ pay, amount, orderId, onClose, onOther, onPay }) {
  const clock = new Date().toTimeString().slice(0, 5)
  return (
    <div className="bemor-shade" onClick={onClose}>
      <div className="buy-pay-dialog" role="dialog" aria-labelledby="pay-title" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <b id="pay-title">{pay.title} orqali to‘lash</b>
          <button type="button" onClick={onClose} aria-label="Yopish" className="grid size-8 place-items-center rounded-lg text-muted"><X className="size-4" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 text-center">
          <button type="button" onClick={onPay} className="mx-auto"><Mark id={pay.id} large /></button>
          <p className="mt-3 text-[12px] text-muted">To‘lov summasi</p>
          <b className="block text-[26px]">{som(amount)}</b>
          <p className="text-[12px] text-muted">Buyurtma raqami: #{orderId}</p>
          <button type="button" onClick={onPay} className="mx-auto mt-3 grid size-40 place-items-center rounded-xl border border-line" aria-label={`${pay.title} to‘lov havolasi`}>
            <Qr seed={`${orderId}-${pay.pay}`} />
          </button>
          <p className="mx-auto mt-3 max-w-[340px] text-[12.5px] text-ink-2">Telefoningiz kamerasi yoki {pay.title} ilovasi bilan QR kodni skanerlang — to‘lov summasi avtomatik to‘ldiriladi.</p>
          <button type="button" onClick={onPay} className="mt-1 text-[12px] font-semibold text-sea">{pay.pay}</button>
          <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] text-muted">
            {['Skanerlang', 'Ilovada tasdiqlang', 'Tayyor'].map((t, i) => (
              <div key={t}>
                <span className="mx-auto grid size-6 place-items-center rounded-full bg-sea-50 text-[11px] font-bold text-sea">{i + 1}</span>
                <b className="mt-1 block text-ink">{t}</b>
                <span>{['QR kodni skanerlang', 'To‘lovni ilovada tasdiqlang', 'To‘lov avtomatik tasdiqlanadi'][i]}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 flex items-center justify-center gap-2 text-[12.5px] text-muted"><span className="size-2 rounded-full bg-[#f0b429]" /> To‘lov kutilmoqda... <span>{clock}</span></p>
        </div>
        <div className="grid grid-cols-2 gap-2 border-t border-line px-4 py-3">
          <button type="button" onClick={onOther} className="h-11 rounded-xl border border-sea text-[13px] font-semibold text-sea">Boshqa to‘lov usuli</button>
          <button type="button" onClick={onClose} className="h-11 rounded-xl bg-sea text-[13px] font-semibold text-white">Bekor qilish</button>
        </div>
      </div>
    </div>
  )
}

function Head({ n, title, onEdit }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 text-[14px] font-bold"><span className="grid size-6 place-items-center rounded-full bg-[#e7eef5] text-[12px]">{n}</span> {title}</h2>
      <button type="button" onClick={onEdit} className="inline-flex items-center gap-1 text-[12px] font-semibold text-sea"><Pencil className="size-3.5" /> O‘zgartirish</button>
    </div>
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

function Select({ value, onChange, children }) {
  return (
    <span className="relative block">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`${input} appearance-none px-3 pr-8`}>{children}</select>
      <ChevronRight className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 rotate-90 text-muted" />
    </span>
  )
}

function Choice({ on, onClick, icon: Icon, title, text, meta, price }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-3 rounded-2xl border px-3 py-3 text-left" style={{ borderColor: on ? '#0b8a95' : '#e6ebf2', background: on ? '#f3fbfb' : '#fff' }}>
      <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${on ? 'bg-sea text-white' : 'bg-[#f4f7fb] text-ink-2'}`}><Icon className="size-4" /></span>
      <span className="min-w-0 flex-1">
        <b className="block text-[13px]">{title}</b>
        <span className="block text-[11px] text-muted">{text}</span>
      </span>
      <span className="text-right">
        <b className="block text-[12px]">{meta}</b>
        {price && <span className="text-[12px] font-semibold text-sea">{price}</span>}
      </span>
    </button>
  )
}

function Mark({ id, large }) {
  const box = large ? 'size-12 text-[18px]' : 'size-9 text-[14px]'
  if (id === 'click') return <span className={`grid ${box} place-items-center rounded-full bg-[#d9f6f3] font-extrabold text-[#0aa396]`}>C</span>
  if (id === 'payme') return <span className={`grid ${box} place-items-center rounded-lg bg-[#111] font-extrabold text-white`}>P</span>
  if (id === 'uzum') return <span className={`grid ${box} place-items-center rounded-full bg-[#f3e8ff] font-extrabold text-[#7b2ff2]`}>U</span>
  if (id === 'card') return <span className={`grid ${box} place-items-center rounded-xl bg-[#eef3ff] text-[#3b6fd8]`}><CreditCard className="size-4" /></span>
  if (id === 'cash') return <span className={`grid ${box} place-items-center rounded-xl bg-[#e5f7ea] text-[#17803d]`}><Banknote className="size-4" /></span>
  return <span className={`grid ${box} place-items-center rounded-xl bg-[#f3e8ff] text-[#7b2ff2]`}><CalendarDays className="size-4" /></span>
}

function Row({ k, v }) {
  return <div className="flex items-center justify-between gap-3 text-[12.5px]"><span className="text-muted">{k}</span><b className="text-right">{v}</b></div>
}

function Flag() {
  return (
    <svg viewBox="0 0 28 18" className="h-4 w-6 shrink-0 rounded-[2px]" aria-hidden="true">
      <rect width="28" height="6" fill="#0099b5" />
      <rect y="6" width="28" height="1" fill="#ce1126" />
      <rect y="7" width="28" height="4" fill="#fff" />
      <rect y="11" width="28" height="1" fill="#ce1126" />
      <rect y="12" width="28" height="6" fill="#1eb53a" />
    </svg>
  )
}

function CityMap({ zoom = 1, onZoom, compact }) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-[#d7e7d4] ${compact ? 'h-[92px]' : 'h-[188px]'}`}>
      <svg viewBox="0 0 640 240" className="h-full w-full" style={{ transform: `scale(${zoom})` }} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="640" height="240" fill="#e4f0dc" />
        <g fill="#c9dcc4">
          <rect x="16" y="16" width="70" height="40" rx="3" />
          <rect x="100" y="18" width="90" height="36" rx="3" />
          <rect x="210" y="20" width="60" height="48" rx="3" />
          <rect x="290" y="14" width="80" height="40" rx="3" />
          <rect x="390" y="22" width="70" height="36" rx="3" />
          <rect x="480" y="16" width="140" height="44" rx="3" />
          <rect x="20" y="150" width="100" height="50" rx="3" />
          <rect x="150" y="160" width="80" height="46" rx="3" />
          <rect x="260" y="154" width="120" height="52" rx="3" />
          <rect x="410" y="162" width="90" height="44" rx="3" />
          <rect x="520" y="150" width="96" height="56" rx="3" />
        </g>
        <g stroke="#fff" strokeWidth="14">
          <path d="M0 80 H640 M0 140 H640 M140 0 V240 M300 0 V240 M460 0 V240" />
        </g>
        <g stroke="#f0d48a" strokeWidth="7">
          <path d="M0 112 H640 M220 0 V240" />
        </g>
      </svg>
      <span className="absolute left-1/2 top-1/2 grid size-8 -translate-x-1/2 -translate-y-full place-items-center rounded-full bg-white text-sea shadow">
        <MapPin className="size-4 fill-sea" />
      </span>
      {!compact && onZoom && (
        <span className="absolute bottom-2 right-2 flex flex-col overflow-hidden rounded-lg bg-white shadow">
          <button type="button" aria-label="Yaqinlashtirish" onClick={() => onZoom((z) => Math.min(1.6, Math.round((z + 0.2) * 10) / 10))} className="grid size-7 place-items-center text-[16px]">+</button>
          <button type="button" aria-label="Uzoqlashtirish" onClick={() => onZoom((z) => Math.max(1, Math.round((z - 0.2) * 10) / 10))} className="grid size-7 place-items-center border-t border-line text-[16px]">−</button>
        </span>
      )}
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

function downloadInvoice(snap) {
  const lines = [
    `StomaHub hisob-faktura #${snap.id}`,
    `To'lov: ${snap.method.title}`,
    `Jami: ${snap.grand}`,
    ...snap.items.map((it) => `${it.name} x ${it.qty} = ${it.price * it.qty}`),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${snap.id}.txt`
  a.click()
  URL.revokeObjectURL(url)
}
