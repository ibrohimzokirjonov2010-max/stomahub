import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Heart, Share2, Star, CircleCheck, BadgeCheck, ShieldCheck, Truck, Package, ShoppingCart, CreditCard,
  Zap, Sun, Armchair, Monitor, PenTool, Activity, Droplets, Wind, Weight, Calendar, Settings, MapPin, Tag, Lightbulb, FileText, Wrench,
} from 'lucide-react'
import { getJihoz, products, similarIds, specsOf, kitOf, money } from '../../jihozData'
import { useCart } from '../../cart'
import { MobileToast, QtyStepper, GoCartButton } from './parts'
import MobileTabBar from './MobileTabBar'
import { BottomSheet } from './MobileSeminars'
import { SellerChat } from './MobileProduct'
import { BrandMark, badgeOf, warrantyLabel } from './MobileJihozlar'

const SPEC_ICONS = [
  [/quvvat|kuchlanish/i, Zap],
  [/yorit|lux/i, Sun],
  [/kreslo/i, Armchair],
  [/panel|displey/i, Monitor],
  [/uchlik/i, PenTool],
  [/skaler/i, Activity],
  [/suv|tupurug/i, Droplets],
  [/havo/i, Wind],
  [/og‘ir/i, Weight],
  [/yil/i, Calendar],
  [/kafolat/i, ShieldCheck],
  [/shahar/i, MapPin],
  [/toifa/i, Tag],
]
const KIT_ICONS = [
  [/kreslo/i, Armchair],
  [/chiroq|LED|lampa/i, Lightbulb],
  [/panel|blok/i, Monitor],
  [/skaler/i, Activity],
  [/suv|tupurug/i, Droplets],
  [/yo‘riqnoma|talon/i, FileText],
  [/o‘rnatish|yetkazib/i, Wrench],
]
const iconFor = (list, text, fallback) => list.find(([re]) => re.test(text))?.[1] || fallback
const PLANS = [6, 12, 24]

export default function MobileJihozItem() {
  const { id } = useParams()
  return <JihozView key={id} id={id} />
}

function JihozView({ id }) {
  const p = getJihoz(id)
  const navigate = useNavigate()
  const { items, add, setQty, remove } = useCart()
  const [shot, setShot] = useState(0)
  const [liked, setLiked] = useState(false)
  const [sheet, setSheet] = useState(null)
  const [toast, setToast] = useState('')
  const closeToast = useCallback(() => setToast(''), [])
  const touch = useRef(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  if (!p) {
    return (
      <div className="grid min-h-screen place-items-center bg-white px-6 text-center">
        <div>
          <p className="text-[15px] font-semibold text-ink">Jihoz topilmadi</p>
          <Link to="/jihozlar" className="mt-3 inline-block text-[13px] font-semibold text-sea">Jihozlarga qaytish</Link>
        </div>
      </div>
    )
  }

  const gallery = [...new Set(p.gallery?.length ? p.gallery : [p.image])].slice(0, 4)
  const n = gallery.length
  const off = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0
  const specs = specsOf(p).filter(([k]) => !/^(model|brend)$/i.test(k))
  const kit = kitOf(p)
  const inCart = items.find((it) => it.id === p.id)?.qty || 0
  const official = p.official || p.status === 'new'
  const seller = { name: `${p.brand} Uzbekistan`, logo: (p.mark || p.brand).slice(0, 2).toUpperCase() }
  const similar = [...new Set([...similarIds, ...products.filter((x) => x.cat === p.cat).map((x) => x.id)])]
    .map((sid) => products.find((x) => x.id === sid))
    .filter((x) => x && x.id !== p.id)
    .slice(0, 8)
  const [badge] = badgeOf(p)

  const addToCart = () => {
    add({ id: p.id, name: p.title, type: p.brand, price: p.price, image: p.image })
    setToast(`${p.title} savatga qo‘shildi`)
  }
  const changeQty = (next) => {
    if (next < 1) { remove(p.id); setToast('Savatdan olib tashlandi') }
    else setQty(p.id, Math.min(20, next))
  }
  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: p.title, url })
      else { await navigator.clipboard.writeText(url); setToast('Havola nusxalandi') }
    } catch { /* foydalanuvchi bekor qildi */ }
  }

  return (
    <div className="min-h-screen bg-[#f6f9fb] pb-[150px]">
      {/* Galereya */}
      <div
        className="relative h-[300px] overflow-hidden bg-[#eef3f6]"
        onTouchStart={(e) => { touch.current = e.touches[0].clientX }}
        onTouchEnd={(e) => {
          if (touch.current == null || n < 2) return
          const dx = e.changedTouches[0].clientX - touch.current
          if (Math.abs(dx) > 40) setShot((shot + (dx < 0 ? 1 : -1) + n) % n)
          touch.current = null
        }}
      >
        <img src={gallery[shot]} alt={p.title} className="size-full object-cover" />
        <button type="button" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/jihozlar'))} aria-label="Orqaga" className="safe-overlay-top absolute left-3.5 grid size-10 place-items-center rounded-xl bg-white/95 text-ink shadow-[0_2px_8px_rgb(11_31_58/0.12)]">
          <ChevronLeft className="size-5" />
        </button>
        <div className="safe-overlay-top absolute right-3.5 flex gap-2">
          <button type="button" onClick={() => { setLiked(!liked); if (!liked) setToast('Sevimlilarga qo‘shildi') }} aria-label="Sevimlilarga" aria-pressed={liked} className="grid size-10 place-items-center rounded-xl bg-white/95 shadow-[0_2px_8px_rgb(11_31_58/0.12)]">
            <Heart className={`size-5 ${liked ? 'fill-sale text-sale' : 'text-ink'}`} />
          </button>
          <button type="button" onClick={share} aria-label="Ulashish" className="grid size-10 place-items-center rounded-xl bg-white/95 text-ink shadow-[0_2px_8px_rgb(11_31_58/0.12)]">
            <Share2 className="size-[18px]" />
          </button>
        </div>
        {n > 1 && (
          <div className="absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5">
            {gallery.map((src, i) => <span key={src} className={`h-1.5 rounded-full transition-all ${i === shot ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`} />)}
          </div>
        )}
      </div>

      {n > 1 && (
        <div className="grid grid-cols-4 gap-2 bg-white px-3.5 pt-2">
          {gallery.map((src, i) => (
            <button key={src} type="button" onClick={() => setShot(i)} aria-label={`Rasm ${i + 1}`} className={`h-[64px] overflow-hidden rounded-xl bg-[#eef3f6] ${i === shot ? 'ring-2 ring-sea' : 'ring-1 ring-line'}`}>
              <img src={src} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Nom va narx */}
      <div className="bg-white px-3.5 pb-3.5 pt-3">
        <div className="flex items-center gap-1.5">
          {official ? (
            <span className="flex items-center gap-1 rounded-md bg-[#e8f1fd] px-1.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-[#1a73e8]"><BadgeCheck className="size-3.5" /> Original</span>
          ) : (
            <span className="rounded-md bg-[#fff4e0] px-1.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-[#c77800]">{badge}</span>
          )}
          <Link to={`/jihozlar?brand=${encodeURIComponent(p.brand)}`} className="flex items-center gap-0.5 rounded-md border border-line px-1.5 py-[3px]">
            <BrandMark p={p} className="max-w-[110px] text-[11px]" /> <ChevronRight className="size-3.5 text-ink-2" />
          </Link>
          <span className="ml-auto flex items-center gap-1 whitespace-nowrap text-[11.5px] font-medium text-ok"><CircleCheck className="size-4 fill-ok text-white" /> Omborda bor</span>
        </div>
        <h1 className="mt-2 text-[21px] font-extrabold leading-tight tracking-tight text-[#0d2a4a]">{p.title}</h1>
        <p className="mt-1 flex items-center gap-1 text-[12px] text-ink-2">
          {[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`size-3.5 ${i <= Math.round(p.rating) ? 'fill-star text-star' : 'text-line'}`} />)}
          <b className="ml-0.5 font-semibold text-ink">{p.rating}</b> ({p.reviews} ta sharh)
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1">
          <p className="whitespace-nowrap text-[22px] font-extrabold leading-tight tracking-tight text-[#0d2a4a]">{money(p.price)}</p>
          {off > 0 && (
            <>
              <span className="whitespace-nowrap text-[12px] text-muted line-through">{money(p.oldPrice)}</span>
              <span className="rounded-md bg-sale/10 px-1.5 py-0.5 text-[11px] font-bold text-sale">-{off}%</span>
            </>
          )}
        </div>
        {p.lizing && (
          <button type="button" onClick={() => setSheet('lizing')} className="mt-2.5 flex h-10 w-full items-center gap-2 rounded-xl bg-[#e6f4f3] px-3 text-left text-[12.5px] text-sea-600">
            <CreditCard className="size-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate"><b className="font-semibold">12 oy</b> — oyiga {money(Math.round(p.price / 12 / 1000) * 1000)} dan</span>
            <ChevronRight className="size-4 shrink-0" />
          </button>
        )}

        <div className="mt-3 grid grid-cols-3 divide-x divide-line rounded-2xl border border-line py-2.5">
          {[
            [ShieldCheck, 'Kafolat', warrantyLabel(p.warranty)],
            [Truck, 'Toshkent bo‘ylab', 'bepul yetkazish'],
            [Package, 'Omborda bor', 'Tez yetkazish'],
          ].map(([Icon, a, b]) => (
            <div key={a} className="flex flex-col items-center px-1 text-center">
              <Icon className="size-[22px] text-sea" strokeWidth={1.6} />
              <p className="mt-1 text-[11px] font-semibold leading-tight text-ink">{a}</p>
              <p className="text-[10.5px] leading-tight text-muted">{b}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Texnik xususiyatlar */}
      <section className="mt-2.5 bg-white px-3.5 py-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-[#0d2a4a]">Texnik xususiyatlari</h2>
          {specs.length > 4 && (
            <button type="button" onClick={() => setSheet('specs')} className="flex items-center gap-0.5 text-[12px] font-semibold text-sea">Barchasini ko‘rish <ChevronRight className="size-3.5" /></button>
          )}
        </div>
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          {specs.slice(0, 4).map(([k, v]) => {
            const Icon = iconFor(SPEC_ICONS, k, Settings)
            return (
              <div key={k} className="flex items-center gap-2.5 rounded-xl bg-[#f3f7fb] p-2.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-sea"><Icon className="size-[18px]" strokeWidth={1.7} /></span>
                <span className="min-w-0">
                  <span className="block truncate text-[10.5px] text-muted">{k}</span>
                  <span className="block text-[12px] font-semibold leading-tight text-ink">{v}</span>
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Komplektatsiya */}
      <section className="mt-2.5 bg-white py-3.5">
        <h2 className="px-3.5 text-[16px] font-bold text-[#0d2a4a]">Komplektatsiya <span className="text-[12px] font-medium text-muted">({kit.length})</span></h2>
        <div className="mt-2.5 flex gap-2 overflow-x-auto px-3.5 no-scrollbar">
          {kit.map((k) => {
            const Icon = iconFor(KIT_ICONS, k, Package)
            return (
              <div key={k} className="flex w-[82px] shrink-0 flex-col items-center text-center">
                <span className="grid h-[64px] w-full place-items-center rounded-xl border border-line bg-[#f8fafc] text-[#1f5fa8]"><Icon className="size-7" strokeWidth={1.4} /></span>
                <span className="mt-1 line-clamp-2 text-[10.5px] leading-tight text-ink-2">{k}</span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Sotuvchi */}
      <section className="mt-2.5 bg-white px-3.5 py-3.5">
        <h2 className="text-[16px] font-bold text-[#0d2a4a]">Sotuvchi</h2>
        <div className="mt-2.5 flex items-center gap-3 rounded-2xl border border-line p-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#0f2b5b] text-[13px] font-black tracking-wide text-white">{seller.logo}</span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-[14px] font-bold text-ink">
              <span className="truncate">{seller.name}</span>
              <BadgeCheck className="size-4 shrink-0 fill-[#1a73e8] text-white" />
            </p>
            <p className="truncate text-[11px] text-muted">{official ? 'Rasmiy distribyutor' : 'Tekshirilgan sotuvchi'} · Stomatologik jihozlar</p>
            <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-ink-2"><Star className="size-3.5 fill-star text-star" /> <b className="font-semibold text-ink">4.9</b> (156 ta baho)</p>
          </div>
        </div>
        <button type="button" onClick={() => setSheet('chat')} className="mt-2.5 h-11 w-full rounded-xl border border-sea text-[13.5px] font-semibold text-sea active:bg-sea-50">Sotuvchiga yozish</button>
      </section>

      {/* O'xshash */}
      {similar.length > 0 && (
        <>
          <div className="mt-4 flex items-center justify-between px-3.5">
            <h2 className="text-[16px] font-bold text-[#0d2a4a]">O‘xshash jihozlar</h2>
            <Link to={`/jihozlar?cat=${p.cat}`} className="text-[12px] font-semibold text-sea">Barchasi</Link>
          </div>
          <div className="mt-2 flex gap-2.5 overflow-x-auto px-3.5 pb-1 no-scrollbar">
            {similar.map((x) => (
              <Link key={x.id} to={`/jihozlar/${x.id}`} className="w-[140px] shrink-0 overflow-hidden rounded-2xl bg-white shadow-[0_1px_4px_rgb(11_31_58/0.07)]">
                <img src={x.image} alt="" className="h-[100px] w-full object-cover" />
                <div className="p-2">
                  <BrandMark p={x} className="text-[10px]" />
                  <p className="truncate text-[11.5px] font-bold text-ink">{x.title}</p>
                  <p className="mt-0.5 text-[12.5px] font-extrabold text-[#0d2a4a]">{money(x.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Pastki panel */}
      <div className="fixed inset-x-0 bottom-[62px] z-30 flex items-center gap-1.5 border-t border-line bg-white px-3 py-2.5 shadow-[0_-6px_18px_rgb(11_31_58/0.06)]">
        <div className="min-w-0 flex-1">
          <p className="whitespace-nowrap text-[14.5px] font-extrabold leading-tight tracking-tight text-[#0d2a4a]">{money(p.price * (inCart || 1))}</p>
          {p.lizing && <p className="truncate text-[10px] text-sea-600">12 oy — oyiga {money(Math.round(p.price / 12 / 1000) * 1000)} dan</p>}
        </div>
        {inCart ? (
          <>
            <QtyStepper big value={inCart} onDec={() => changeQty(inCart - 1)} onInc={() => changeQty(inCart + 1)} className="h-12 w-[100px] shrink-0" />
            <GoCartButton big className="h-12 w-[92px] shrink-0" />
          </>
        ) : (
          <>
            {p.lizing && (
              <button type="button" onClick={() => setSheet('lizing')} className="flex h-12 shrink-0 flex-col items-center justify-center rounded-xl bg-[#e6f4f3] px-2 text-[10.5px] font-semibold leading-tight text-sea-600">
                <CreditCard className="size-4" /> Bo‘lib to‘lash
              </button>
            )}
            <button type="button" onClick={addToCart} className="flex h-12 shrink-0 items-center justify-center gap-1 rounded-xl bg-sea px-2 text-[12px] font-semibold text-white shadow-[0_6px_16px_rgb(11_138_149/0.3)] active:scale-[0.98]">
              <ShoppingCart className="size-4" /> Savatga qo‘shish
            </button>
          </>
        )}
      </div>

      {sheet === 'specs' && (
        <BottomSheet title="Texnik xususiyatlari" onClose={() => setSheet(null)}>
          <dl className="mt-2">
            {specsOf(p).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-line py-2.5 text-[13px] last:border-0">
                <dt className="text-muted">{k}</dt>
                <dd className="text-right font-medium text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </BottomSheet>
      )}
      {sheet === 'lizing' && (
        <LizingSheet p={p} onClose={() => setSheet(null)} onDone={() => { setSheet(null); setToast('Ariza yuborildi — menejer 15 daqiqada qo‘ng‘iroq qiladi') }} />
      )}
      {sheet === 'chat' && (
        <SellerChat
          seller={seller}
          product={{ name: p.title }}
          quick={['O‘rnatish narxga kiradimi?', 'Kafolat qanday?', 'Ko‘rgazmada ko‘rsa bo‘ladimi?']}
          onClose={() => setSheet(null)}
          onSent={() => { setSheet(null); setToast('Xabar sotuvchiga yuborildi') }}
        />
      )}

      <MobileToast
        text={toast}
        onClose={closeToast}
        bottom={140}
      />
      <MobileTabBar />
    </div>
  )
}

function LizingSheet({ p, onClose, onDone }) {
  const [months, setMonths] = useState(12)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('+998 ')
  const monthly = Math.round(p.price / months / 1000) * 1000
  const valid = name.trim().length > 1 && phone.replace(/\D/g, '').length >= 12
  return (
    <BottomSheet
      title="Bo‘lib to‘lash"
      onClose={onClose}
      footer={<button type="button" disabled={!valid} onClick={onDone} className="h-12 flex-1 rounded-xl bg-sea text-[14px] font-semibold text-white disabled:opacity-40">Ariza yuborish</button>}
    >
      <p className="mt-1 text-[12.5px] text-muted">Ustamasiz muddatli to‘lov — birinchi to‘lovsiz</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {PLANS.map((m) => (
          <button key={m} type="button" aria-pressed={months === m} onClick={() => setMonths(m)} className={`rounded-xl border px-2 py-2.5 text-center ${months === m ? 'border-sea bg-sea-50' : 'border-line'}`}>
            <span className={`block text-[14px] font-bold ${months === m ? 'text-sea' : 'text-ink'}`}>{m} oy</span>
            <span className="block whitespace-nowrap text-[10.5px] text-muted">{money(Math.round(p.price / m / 1000) * 1000)}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between rounded-2xl bg-[#f3f7fb] px-3.5 py-3">
        <span className="text-[12.5px] text-ink-2">Oylik to‘lov</span>
        <span className="text-[17px] font-extrabold text-[#0d2a4a]">{money(monthly)}</span>
      </div>
      <label className="mt-3 block text-[12.5px] font-medium text-ink">Ism familiya
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Masalan, Aziz Karimov" className="mt-1 h-11 w-full rounded-xl border border-line px-3 text-[14px] outline-none focus:border-sea" />
      </label>
      <label className="mt-2.5 block text-[12.5px] font-medium text-ink">Telefon
        <input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-line px-3 text-[14px] outline-none focus:border-sea" />
      </label>
    </BottomSheet>
  )
}
