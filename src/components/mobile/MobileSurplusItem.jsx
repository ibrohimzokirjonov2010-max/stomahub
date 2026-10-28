import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Heart, Share2, PackageCheck, CalendarDays, Box, MapPin, Star, BadgeCheck, MessageCircle,
  ShieldCheck, ShoppingCart, X, CalendarCheck, MessageSquare, Lock, Clock,
} from 'lucide-react'
import { getSurplusDetail, similarFor } from '../../surplusData'
import { som } from '../../marketData'
import { useCart } from '../../cart'
import { MobileToast, QtyStepper } from './parts'
import { SellerChat } from './MobileProduct'
import { condLabel, expiryLabel } from './MobileSurplus'
import MobileTabBar from './MobileTabBar'

const SAFETY = [
  { icon: ShieldCheck, title: 'Tekshirilgan sotuvchilar', text: 'Har bir sotuvchi shifokor sifatida tasdiqlangan' },
  { icon: CalendarCheck, title: 'Yaroqlilik muddati ko‘rsatilgan', text: 'Muddati o‘tgan mahsulotlar joylanmaydi' },
  { icon: MessageSquare, title: 'Muloqot platforma orqali', text: 'Barcha kelishuvlar yozishmada saqlanadi' },
  { icon: Lock, title: 'To‘lov himoyalangan', text: 'Pul mahsulotni olganingizdan keyin sotuvchiga o‘tadi' },
]
const QUICK = ['Hali sotuvdami?', 'Narxi kelishiladimi?', 'Qayerdan olib ketsam bo‘ladi?']

export default function MobileSurplusItem() {
  const { id } = useParams()
  return <SurplusView key={id} id={id} />
}

function SurplusView({ id }) {
  const d = getSurplusDetail(id)
  const related = similarFor(id)
  const navigate = useNavigate()
  if (!d) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-[16px] font-bold text-ink">E’lon topilmadi</p>
        <button type="button" onClick={() => navigate('/ortiqcha')} className="mt-3 text-[13px] font-semibold text-sea">Ortiqcha materiallarga qaytish</button>
      </div>
    )
  }
  const s = d.seller
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

  const shots = d.images.filter((src, i, a) => a.indexOf(src) === i)
  const n = shots.length
  const off = d.oldPrice ? Math.round((1 - d.price / d.oldPrice) * 100) : 0
  const fact = (k) => d.facts.find(([key]) => key === k)?.[2] || ''
  const stock = Number(fact('qty').match(/\d+/)?.[0]) || 1
  const turi = d.specs.find(([k]) => k === 'Turi')?.[1] || ''
  const subtitle = turi.includes('(') || !fact('vol') ? turi : `${turi}, ${fact('vol').replace(/\s*\(.*\)/, '')}`

  const cartId = `surplus-${d.id}`
  const inCart = items.find((it) => it.id === cartId)?.qty || 0
  const addToCart = () => {
    add({ id: cartId, name: d.name, type: `${d.brand} · Ortiqcha material`, price: d.price, image: d.thumbs[0] })
    setToast(`${d.name} savatga qo‘shildi`)
  }
  const changeQty = (next) => {
    if (next < 1) { remove(cartId); setToast('Savatdan olib tashlandi') }
    else if (next > stock) setToast(`Sotuvchida faqat ${stock} ta bor`)
    else setQty(cartId, next)
  }

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: d.name, url })
      else { await navigator.clipboard.writeText(url); setToast('Havola nusxalandi') }
    } catch { /* foydalanuvchi bekor qildi */ }
  }

  return (
    <div className="min-h-screen bg-white pb-[150px]">
      {/* Galereya */}
      <div
        className="relative h-[262px] overflow-hidden bg-white"
        onTouchStart={(e) => { touch.current = e.touches[0].clientX }}
        onTouchEnd={(e) => {
          if (touch.current == null || n < 2) return
          const dx = e.changedTouches[0].clientX - touch.current
          if (Math.abs(dx) > 40) setShot((shot + (dx < 0 ? 1 : -1) + n) % n)
          touch.current = null
        }}
      >
        <img
          src={shots[shot]}
          alt={d.name}
          className={`size-full ${shots[shot].endsWith('main.jpg') ? 'scale-[1.2] object-cover' : n > 1 ? 'object-cover' : 'object-contain px-8 pb-3 pt-14'}`}
        />
        <button type="button" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/ortiqcha'))} aria-label="Orqaga" className="safe-overlay-top absolute left-3.5 grid size-10 place-items-center rounded-xl bg-white/95 text-ink shadow-[0_2px_8px_rgb(11_31_58/0.12)]">
          <ChevronLeft className="size-5" />
        </button>
        <div className="safe-overlay-top absolute right-3.5 flex gap-2">
          <button type="button" onClick={() => { setLiked(!liked); if (!liked) setToast('Saqlanganlarga qo‘shildi') }} aria-label="Saqlash" aria-pressed={liked} className="grid size-10 place-items-center rounded-xl bg-white/95 shadow-[0_2px_8px_rgb(11_31_58/0.12)]">
            <Heart className={`size-5 ${liked ? 'fill-sale text-sale' : 'text-ink'}`} />
          </button>
          <button type="button" onClick={share} aria-label="Ulashish" className="grid size-10 place-items-center rounded-xl bg-white/95 text-ink shadow-[0_2px_8px_rgb(11_31_58/0.12)]">
            <Share2 className="size-[18px]" />
          </button>
        </div>
      </div>

      {n > 1 && (
        <div className="mt-2 grid grid-cols-5 gap-2 px-3.5">
          {d.thumbs.slice(0, n).map((t, i) => (
            <button key={t} type="button" onClick={() => setShot(i)} aria-label={`Rasm ${i + 1}`} className={`aspect-[4/3] overflow-hidden rounded-xl bg-[#f3f6f9] ${i === shot ? 'ring-2 ring-sea' : 'ring-1 ring-line'}`}>
              <img src={t} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="px-3.5">
        <div className="mt-3 flex gap-1.5">
          <Link to={`/ortiqcha?cat=${d.cat}`} className="rounded-full bg-[#fde8ef] px-2.5 py-1 text-[11px] font-semibold text-[#e0457b]">{d.category}</Link>
          <span className="rounded-full bg-[#eef1f5] px-2.5 py-1 text-[11px] font-medium text-ink-2">{d.brand}</span>
        </div>
        <h1 className="mt-2 text-[21px] font-extrabold leading-tight tracking-tight text-ink">{d.name}</h1>
        <p className="mt-0.5 text-[12px] text-muted">{subtitle}</p>

        <div className="mt-2.5 flex flex-wrap gap-1 whitespace-nowrap">
          <span className={`flex h-7 items-center gap-1 rounded-lg px-[7px] text-[10.5px] font-medium ${d.condition === 'Ochilgan' ? 'bg-[#ecebff] text-[#5b54d6]' : 'bg-[#e5f6ec] text-ok'}`}>
            <PackageCheck className="size-3.5" /> {condLabel(d.condition)}
          </span>
          <span className="flex h-7 items-center gap-1 rounded-lg border border-line px-[7px] text-[10.5px] text-ink-2">
            <CalendarDays className="size-3.5" /> Yaroqlilik: <b className="font-semibold text-ink">{expiryLabel(d.expiry)}</b>
          </span>
          <span className="flex h-7 items-center gap-1 rounded-lg border border-line px-[7px] text-[10.5px] text-ink-2">
            <Box className="size-3.5" /> Miqdori: <b className="font-semibold text-ink">{stock} ta</b>
          </span>
        </div>
        <p className="mt-2 flex items-center gap-1 text-[11.5px] text-muted"><MapPin className="size-3.5" /> {fact('city')}</p>

        {/* Narx */}
        <div className="mt-3 rounded-2xl border border-line p-3">
          <p className="text-[11px] text-muted">Hozirgi narx</p>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-[24px] font-extrabold leading-tight tracking-tight text-ink">{som(d.price)}</span>
            {off > 0 && <span className="rounded-full bg-[#fde7ea] px-2 py-0.5 text-[11.5px] font-bold text-sale">-{off}%</span>}
          </div>
          {d.oldPrice && (
            <>
              <p className="mt-1 text-[11.5px] text-muted">Asl narxi (yangi): <span className="line-through">{som(d.oldPrice)}</span></p>
              <p className="mt-0.5 text-[12px] font-semibold text-ok">Tejaysiz: {som(d.oldPrice - d.price)}</p>
            </>
          )}
        </div>

        <h2 className="mt-4 text-[15px] font-bold text-ink">Tavsif</h2>
        <p className="mt-1 text-[12px] leading-[1.55] text-ink-2">{d.description}</p>

        {/* Sotuvchi */}
        <h2 className="mt-4 text-[15px] font-bold text-ink">Sotuvchi</h2>
        <div className="mt-2 flex items-center gap-2 rounded-2xl border border-line p-2.5">
          <img src={s.avatar} alt={s.name} className="size-12 shrink-0 rounded-full object-cover" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold leading-tight text-ink">
              {s.name} <BadgeCheck className="-mt-0.5 inline size-4 fill-sea text-white" />
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
              <Star className="size-3.5 fill-star text-star" /> <b className="font-semibold text-ink">{s.rating}</b> ({s.reviews} ta baho)
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted"><MapPin className="size-3" /> {s.city}</p>
          </div>
          <button type="button" onClick={() => setSheet('chat')} className="flex h-10 shrink-0 items-center gap-1 rounded-xl border border-sea/70 px-2 text-[11px] font-semibold text-sea active:bg-sea-50">
            <MessageCircle className="size-4" /> Sotuvchiga yozish
          </button>
        </div>

        <button type="button" onClick={() => setSheet('safety')} className="mt-2.5 flex w-full items-center gap-2.5 rounded-2xl bg-[#e9f6f1] p-2.5 text-left">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-ok"><ShieldCheck className="size-5" strokeWidth={1.8} /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-[12.5px] font-semibold text-ink">Xavfsiz savdo</span>
            <span className="block text-[10.5px] leading-snug text-ink-2">To‘lovni platforma orqali amalga oshiring va o‘zingizni himoya qiling.</span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-ink-2" />
        </button>

        {/* O'xshash e'lonlar */}
        <div className="mt-5 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-ink">O‘xshash e’lonlar</h2>
          <Link to="/ortiqcha" className="text-[12px] font-semibold text-sea">Barchasi</Link>
        </div>
      </div>
      <div className="mt-2 flex gap-2.5 overflow-x-auto px-3.5 pb-1 no-scrollbar">
        {related.map((it) => (
          <Link key={it.id} to={`/ortiqcha/${it.id}`} className="w-[140px] shrink-0 rounded-2xl border border-line p-2">
            <div className="h-[84px] overflow-hidden rounded-xl bg-white">
              <img src={it.image} alt={it.name} className="size-full object-contain" />
            </div>
            <p className="mt-1.5 truncate text-[11.5px] font-bold text-ink">{it.name}</p>
            <p className="truncate text-[10px] text-muted">{it.brand}{it.type && ` · ${it.type}`}</p>
            <p className="mt-1 whitespace-nowrap text-[12.5px] font-extrabold text-ink">{som(it.price)}</p>
            <p className="flex items-center gap-1 text-[10px] text-muted"><MapPin className="size-3" /> {it.city}</p>
          </Link>
        ))}
      </div>

      {/* Pastki panel */}
      <div className="fixed inset-x-0 bottom-[62px] z-30 grid grid-cols-2 gap-2.5 border-t border-line bg-white px-3.5 py-2.5 shadow-[0_-6px_18px_rgb(11_31_58/0.06)]">
        {inCart ? (
          <QtyStepper big value={inCart} onDec={() => changeQty(inCart - 1)} onInc={() => changeQty(inCart + 1)} className="h-12" />
        ) : (
          <button type="button" onClick={addToCart} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-sea text-[14px] font-semibold text-sea active:bg-sea-50">
            <ShoppingCart className="size-[19px]" /> Savatga qo‘shish
          </button>
        )}
        <button type="button" onClick={() => setSheet('chat')} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-sea text-[14px] font-semibold text-white shadow-[0_6px_16px_rgb(11_138_149/0.3)] active:scale-[0.98]">
          <MessageCircle className="size-[19px]" /> Sotuvchiga yozish
        </button>
      </div>

      {sheet === 'chat' && (
        <SellerChat
          seller={s}
          product={d}
          quick={QUICK}
          reply={s.reply}
          onClose={() => setSheet(null)}
          onSent={() => { setSheet(null); setToast('Xabar sotuvchiga yuborildi') }}
        />
      )}
      {sheet === 'safety' && <SafetySheet onClose={() => setSheet(null)} />}

      <MobileToast
        text={toast}
        onClose={closeToast}
        bottom={140}
        action={toast.includes('savatga') ? <button type="button" onClick={() => navigate('/savatcha', { state: { from: 'market' } })} className="shrink-0 text-[12.5px] font-semibold text-[#5fe0c8]">Savat</button> : null}
      />
      <MobileTabBar />
    </div>
  )
}

function SafetySheet({ onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end bg-ink/45" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Xavfsiz savdo" onClick={(e) => e.stopPropagation()} className="rounded-t-3xl bg-white px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-[18px] font-bold text-ink"><ShieldCheck className="size-5 text-ok" /> Xavfsiz savdo</h2>
          <button type="button" onClick={onClose} aria-label="Yopish" className="grid size-8 place-items-center rounded-full bg-page text-ink"><X className="size-4" /></button>
        </div>
        <ul className="mt-3 space-y-3">
          {SAFETY.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e9f6f1] text-ok"><Icon className="size-[18px]" /></span>
              <span>
                <span className="block text-[13.5px] font-semibold text-ink">{title}</span>
                <span className="block text-[12px] text-muted">{text}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-page p-3 text-[11.5px] leading-snug text-ink-2">
          <Clock className="mt-px size-4 shrink-0 text-sea" /> Oldindan to‘lov so‘ralsa yoki platformadan tashqariga chaqirilsa, ehtiyot bo‘ling va bizga xabar bering.
        </p>
        <button type="button" onClick={onClose} className="mt-4 h-12 w-full rounded-xl bg-sea text-[14px] font-semibold text-white">Tushunarli</button>
      </div>
    </div>
  )
}
