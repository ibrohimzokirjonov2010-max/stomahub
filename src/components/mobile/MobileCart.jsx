import { useCallback, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowRight, Bell, ChevronLeft, CircleCheck, FileText, Heart, Minus, Plus, ShoppingBag, ShoppingCart, Store, Trash2, Truck, X,
} from 'lucide-react'
import { useCart } from '../../cart'
import { som } from '../../marketData'
import { BrandLogo, MobileToast, CountBadge } from './parts'
import MobileTabBar from './MobileTabBar'
import { BottomSheet } from './MobileSeminars'

export const ORIGIN = {
  market: { label: 'Marketplace', to: '/marketplace' },
  forma: { label: 'Forma', to: '/forma' },
  jihoz: { label: 'Jihozlar', to: '/jihozlar' },
}
const SHIP = {
  city: { label: 'Toshkent bo‘ylab', days: '1–2 kun', fee: 0 },
  region: { label: 'Boshqa viloyatlar', days: '2–4 kun', fee: 30000 },
}
export const PROMOS = {
  SH10: { text: '10% chegirma', calc: (sum) => Math.round(sum * 0.1 / 1000) * 1000 },
  STOMA500: { text: '500 000 so‘m chegirma (5 mln dan)', min: 5000000, calc: () => 500000 },
}

export default function MobileCart() {
  const { items, setItems, setQty, remove } = useCart()
  const navigate = useNavigate()
  const loc = useLocation()
  const origin = ORIGIN[loc.state?.from] || ORIGIN.market
  const [liked, setLiked] = useState({})
  const [ship, setShip] = useState('city')
  const [code, setCode] = useState('')
  const [promo, setPromo] = useState(null)
  const [promoErr, setPromoErr] = useState('')
  const [sheet, setSheet] = useState(null)
  const [toast, setToast] = useState({ text: '' })
  const closeToast = useCallback(() => setToast({ text: '' }), [])

  const goods = items.reduce((s, it) => s + it.price * it.qty, 0)
  const promoValid = promo && goods >= (PROMOS[promo].min || 0)
  const discount = promoValid ? Math.min(goods, PROMOS[promo].calc(goods)) : 0
  const fee = SHIP[ship].fee
  const total = goods - discount + fee

  const undoable = (text, snapshot) => setToast({
    text,
    action: <button type="button" onClick={() => { setItems(snapshot); setToast({ text: '' }) }} className="shrink-0 text-[12.5px] font-semibold text-[#5fe0c8]">Qaytarish</button>,
  })

  const drop = (it) => {
    const snapshot = items
    remove(it.id)
    undoable(`${it.name} o‘chirildi`, snapshot)
  }
  const clearAll = () => {
    const snapshot = items
    setItems([])
    setSheet(null)
    undoable('Savat tozalandi', snapshot)
  }

  const applyPromo = () => {
    const key = code.trim().toUpperCase()
    if (!key) return setPromoErr('Promo-kodni kiriting')
    const p = PROMOS[key]
    if (!p) return setPromoErr('Bunday promo-kod topilmadi')
    if (p.min && goods < p.min) return setPromoErr(`Bu promo-kod ${som(p.min)} dan ortiq buyurtmaga amal qiladi`)
    setPromo(key)
    setPromoErr('')
    setToast({ text: `Promo-kod qo‘llandi: ${p.text}` })
  }

  const back = () => (window.history.length > 1 ? navigate(-1) : navigate(origin.to))

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef8f7_0%,#f6faf9_30%,#f6faf9_100%)] pb-[150px]">
      <header className="flex items-center gap-2 px-3.5 pt-3">
        <button type="button" onClick={back} aria-label="Orqaga" className="grid size-10 place-items-center rounded-full bg-white text-[#0d2a4a] shadow-[0_1px_4px_rgb(11_31_58/0.08)]">
          <ChevronLeft className="size-5" />
        </button>
        <BrandLogo />
        <div className="ml-auto flex items-center gap-2">
          <span className="relative grid size-10 place-items-center rounded-full bg-white text-[#0d2a4a] shadow-[0_1px_4px_rgb(11_31_58/0.08)]" aria-label="Savat">
            <ShoppingCart className="size-[19px]" />
            {items.length > 0 && <CountBadge>{items.length}</CountBadge>}
          </span>
          <button type="button" onClick={() => setToast({ text: 'Yangi bildirishnomalar yo‘q' })} aria-label="Bildirishnomalar" className="relative grid size-10 place-items-center rounded-full bg-white text-[#0d2a4a] shadow-[0_1px_4px_rgb(11_31_58/0.08)]">
            <Bell className="size-[19px]" />
            <CountBadge>3</CountBadge>
          </button>
        </div>
      </header>

      <div className="mt-4 px-3.5">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-[26px] font-extrabold leading-none tracking-tight text-[#0d2a4a]">Savat</h1>
          {items.length > 0 && (
            <button type="button" onClick={() => setSheet('clear')} className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-[#e8eef1] px-3 text-[11.5px] font-medium text-[#0d2a4a] active:scale-95">
              <Trash2 className="size-4" /> Barchasini o‘chirish
            </button>
          )}
        </div>
        <p className="mt-1 text-[12.5px] text-ink-2">Tanlangan mahsulotlar ro‘yxati ({items.length} ta)</p>
      </div>

      {items.length === 0 ? (
        <div className="mx-3.5 mt-4 rounded-2xl bg-white px-6 py-10 text-center shadow-[0_1px_6px_rgb(11_31_58/0.06)]">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#e3f4f1] text-[#0b6d73]"><ShoppingBag className="size-8" strokeWidth={1.6} /></span>
          <p className="mt-3 text-[16px] font-bold text-[#0d2a4a]">Savat bo‘sh</p>
          <p className="mt-1 text-[12.5px] text-muted">Kerakli mahsulotlarni tanlab, savatga qo‘shing</p>
          <Link to={origin.to} className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-[#0b6d73] px-5 text-[13.5px] font-semibold text-white">{origin.label}ga o‘tish <ArrowRight className="size-4" /></Link>
        </div>
      ) : (
        <div className="px-3.5">
          <ul className="mt-3 space-y-2.5">
            {items.map((it) => (
              <li key={it.id} className="flex gap-3 rounded-2xl bg-white p-2.5 shadow-[0_1px_6px_rgb(11_31_58/0.06)]">
                <img src={it.image} alt="" className="size-[96px] shrink-0 rounded-xl bg-[#f3f6f8] object-contain p-1" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-[13.5px] font-bold leading-snug text-[#0d2a4a]">{it.name}</p>
                      {it.type && <p className="truncate text-[12px] text-ink-2">{it.type}</p>}
                      {it.seller && <p className="mt-0.5 flex items-center gap-1 truncate text-[11.5px] text-muted"><Store className="size-3.5 shrink-0" /> {it.seller}</p>}
                    </div>
                    <button type="button" onClick={() => drop(it)} aria-label={`${it.name} — o‘chirish`} className="grid size-8 shrink-0 place-items-center rounded-full bg-[#f0f3f5] text-ink-2 active:scale-90">
                      <Trash2 className="size-4" />
                    </button>
                    <button type="button" aria-pressed={!!liked[it.id]} onClick={() => { setLiked((m) => ({ ...m, [it.id]: !m[it.id] })); setToast({ text: liked[it.id] ? 'Sevimlilardan olib tashlandi' : 'Sevimlilarga qo‘shildi' }) }} aria-label="Sevimlilarga" className="grid size-8 shrink-0 place-items-center rounded-full text-ink-2 active:scale-90">
                      <Heart className={`size-[18px] ${liked[it.id] ? 'fill-sale text-sale' : ''}`} />
                    </button>
                  </div>
                  <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                    <div className="flex h-9 items-center rounded-xl border border-line bg-white">
                      <button type="button" onClick={() => (it.qty > 1 ? setQty(it.id, it.qty - 1) : drop(it))} aria-label="Kamaytirish" className="grid size-9 place-items-center text-[#0d2a4a] active:scale-90">
                        <Minus className="size-4" strokeWidth={2.2} />
                      </button>
                      <span className="min-w-6 text-center text-[13.5px] font-semibold tabular-nums text-[#0d2a4a]">{it.qty}</span>
                      <button type="button" onClick={() => setQty(it.id, it.qty + 1)} disabled={it.qty >= 99} aria-label="Ko‘paytirish" className="grid size-9 place-items-center text-[#0d2a4a] active:scale-90 disabled:opacity-40">
                        <Plus className="size-4" strokeWidth={2.2} />
                      </button>
                    </div>
                    <div className="min-w-0 text-right">
                      <p className="whitespace-nowrap text-[14.5px] font-extrabold text-[#0b8a7a]">{som(it.price * it.qty)}</p>
                      {it.qty > 1 && <p className="whitespace-nowrap text-[10.5px] text-muted">{it.qty} x {som(it.price)}</p>}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <section className="mt-3 rounded-2xl border border-[#cfeae5] bg-[#ebf7f4] p-3">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg border-[1.5px] border-dashed border-[#0b8a7a] text-[13px] font-black text-[#0b8a7a]">%</span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold text-[#0d2a4a]">Promo-kod</p>
                <p className="text-[11px] text-ink-2">Chegirma olish uchun promo-kod kiriting</p>
              </div>
              {!promo && <button type="button" onClick={applyPromo} className="h-9 shrink-0 rounded-xl border border-[#0b8a7a] bg-white px-3.5 text-[12.5px] font-semibold text-[#0b6d73] active:scale-95">Qo‘llash</button>}
            </div>
            {promo ? (
              <div className="mt-2.5 flex h-11 items-center gap-2 rounded-xl bg-white px-3">
                <CircleCheck className="size-[18px] shrink-0 text-[#0b8a7a]" />
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-[#0d2a4a]"><b>{promo}</b> · {promoValid ? PROMOS[promo].text : `${som(PROMOS[promo].min)} dan kam — amal qilmaydi`}</span>
                <button type="button" onClick={() => { setPromo(null); setCode('') }} aria-label="Promo-kodni olib tashlash" className="grid size-7 place-items-center rounded-full text-ink-2"><X className="size-4" /></button>
              </div>
            ) : (
              <>
                <input value={code} onChange={(e) => { setCode(e.target.value); setPromoErr('') }} onKeyDown={(e) => e.key === 'Enter' && applyPromo()} placeholder="Promo-kod kiriting..." className={`mt-2.5 h-11 w-full rounded-xl border bg-white px-3 text-[13px] uppercase text-ink outline-none placeholder:normal-case placeholder:text-[#a3b3b9] focus:border-sea ${promoErr ? 'border-sale' : 'border-[#dbe8e6]'}`} />
                {promoErr && <p className="mt-1 text-[11px] text-sale">{promoErr}</p>}
              </>
            )}
          </section>

          <section className="mt-3 rounded-2xl bg-white p-3.5 shadow-[0_1px_6px_rgb(11_31_58/0.06)]">
            <h2 className="flex items-center gap-2 text-[14px] font-bold text-[#0d2a4a]"><Truck className="size-[18px] text-[#0b6d73]" /> Yetkazib berish</h2>
            <div className="mt-2" role="radiogroup" aria-label="Yetkazib berish">
              {Object.entries(SHIP).map(([k, s]) => (
                <button key={k} type="button" role="radio" aria-checked={ship === k} onClick={() => setShip(k)} className="flex w-full items-center gap-2.5 py-2 text-left">
                  <span className={`grid size-5 shrink-0 place-items-center rounded-full border-[1.5px] ${ship === k ? 'border-[#2563eb]' : 'border-[#b8c4ca]'}`}>{ship === k && <span className="size-2.5 rounded-full bg-[#2563eb]" />}</span>
                  <span className="text-[13px] text-[#0d2a4a]">{s.label}</span>
                  <span className="rounded-md bg-[#e5f6ec] px-1.5 py-0.5 text-[11px] font-medium text-[#16a34a]">{s.days}</span>
                  <span className={`ml-auto text-[13px] font-semibold ${s.fee ? 'text-[#0d2a4a]' : 'text-[#0b8a7a]'}`}>{s.fee ? som(s.fee) : 'Bepul'}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="mt-3 rounded-2xl bg-white p-3.5 shadow-[0_1px_6px_rgb(11_31_58/0.06)]">
            <h2 className="flex items-center gap-2 text-[14px] font-bold text-[#0d2a4a]"><FileText className="size-[18px] text-[#0b6d73]" /> Buyurtma xulosasi</h2>
            <div className="mt-2.5 space-y-1.5 text-[12.5px]">
              <Row k={`Mahsulotlar (${items.length} ta)`} v={som(goods)} />
              <Row k="Chegirma" v={discount ? `− ${som(discount)}` : som(0)} tone="text-[#0b8a7a]" />
              <Row k="Yetkazib berish" v={fee ? som(fee) : 'Bepul'} tone={fee ? '' : 'text-[#0b8a7a]'} />
            </div>
            <div className="mt-2.5 flex items-center justify-between border-t border-line pt-2.5">
              <span className="text-[15px] font-bold text-[#0d2a4a]">Jami</span>
              <span className="text-[18px] font-extrabold text-[#0b8a7a]">{som(total)}</span>
            </div>
          </section>
        </div>
      )}

      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-[62px] z-30 flex items-center gap-3 border-t border-line bg-white px-3.5 py-2.5 shadow-[0_-6px_18px_rgb(11_31_58/0.06)]">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-ink-2">Jami:</p>
            <p className="whitespace-nowrap text-[17px] font-extrabold leading-tight text-[#0b6d73]">{som(total)}</p>
          </div>
          <button type="button" onClick={() => navigate('/buyurtma/rasmiylashtirish', { state: { from: loc.state?.from, promo: promoValid ? promo : '', ship } })} className="flex h-12 w-[56%] items-center justify-center gap-2 rounded-xl bg-[#0b8a7a] text-[14.5px] font-semibold text-white shadow-[0_6px_16px_rgb(11_138_122/0.3)] active:scale-[0.98]">
            Rasmiylashtirish <ArrowRight className="size-[18px]" />
          </button>
        </div>
      )}

      {sheet === 'clear' && (
        <BottomSheet title="Savatni tozalash" onClose={() => setSheet(null)} footer={<>
          <button type="button" onClick={() => setSheet(null)} className="h-12 flex-1 rounded-xl border border-line text-[14px] font-semibold text-ink">Bekor qilish</button>
          <button type="button" onClick={clearAll} className="h-12 flex-1 rounded-xl bg-sale text-[14px] font-semibold text-white">Ha, o‘chirish</button>
        </>}>
          <p className="mt-1 text-[13px] text-ink-2">Savatdagi {items.length} ta mahsulot o‘chiriladi. Buni keyin “Qaytarish” orqali tiklash mumkin.</p>
        </BottomSheet>
      )}
      <MobileToast text={toast.text} action={toast.action} onClose={closeToast} bottom={items.length ? 142 : 76} />
      <MobileTabBar />
    </div>
  )
}

function Row({ k, v, tone = '' }) {
  return (
    <p className="flex items-center justify-between gap-3">
      <span className="text-ink-2">{k}</span>
      <span className={`whitespace-nowrap font-medium ${tone || 'text-[#0d2a4a]'}`}>{v}</span>
    </p>
  )
}
