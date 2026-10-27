import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, ChevronDown, Heart, Share2, BadgeCheck, Star, MessageSquareText, Package, Truck, Minus, Plus,
  MessageCircle, MapPin, ShoppingCart, X, Send,
} from 'lucide-react'
import { useCart } from '../../cart'
import { productById, som } from '../../marketData'
import { useMarket } from '../../buyerApi'
import MobileTabBar from './MobileTabBar'
import { MobileToast, QtyStepper, GoCartButton } from './parts'

export default function MobileProduct() {
  const { id } = useParams()
  return <ProductGate key={id} id={id} />
}

function ProductGate({ id }) {
  const market = useMarket()
  if (!productById(id)) {
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center">
        <div>
          <p className="text-[15px] font-semibold text-ink">{market.status === 'loading' || market.status === 'idle' ? 'Mahsulot yuklanmoqda…' : market.status === 'error' ? market.error : 'Mahsulot topilmadi yoki sotuvdan olingan'}</p>
          <a href="/marketplace" className="mt-3 inline-block text-[14px] font-semibold text-sea">Marketplace’ga qaytish</a>
        </div>
      </div>
    )
  }
  return <ProductView id={id} />
}

function ProductView({ id }) {
  const p = productById(id)
  const seller = { name: p.seller || 'Sotuvchi', logo: (p.seller || 'S').slice(0, 2).toUpperCase(), about: 'StomaHub sotuvchisi', city: '' }
  const navigate = useNavigate()
  const { add, items, setQty: setCartQty, remove } = useCart()
  const variants = p.variants || [{ label: p.type.match(/\(([^)]+)\)/)?.[1] || p.type, price: p.price, oldPrice: p.oldPrice }]
  const [shot, setShot] = useState(0)
  const [variant, setVariant] = useState(0)
  const [pick, setPick] = useState(1)
  const [liked, setLiked] = useState(false)
  const [moreText, setMoreText] = useState(false)
  const [chat, setChat] = useState(false)
  const [toast, setToast] = useState('')
  const closeToast = useCallback(() => setToast(''), [])
  const touch = useRef(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const v = variants[variant]
  const cartId = variant ? `${p.id}-${variant}` : p.id
  const inCart = items.find((it) => it.id === cartId)?.qty || 0
  const qty = inCart || pick
  const changeQty = (next) => {
    if (!inCart) return setPick(Math.min(99, Math.max(1, next)))
    if (next < 1) {
      remove(cartId)
      setPick(1)
      setToast(`${p.name} savatdan olib tashlandi`)
    } else setCartQty(cartId, Math.min(99, next))
  }
  const off = v.oldPrice && v.oldPrice > v.price ? Math.round((1 - v.price / v.oldPrice) * 100) : 0
  const thumbs = p.thumbs.slice(0, 4)
  const n = thumbs.length

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: p.name, url })
      else { await navigator.clipboard.writeText(url); setToast('Havola nusxalandi') }
    } catch { /* foydalanuvchi bekor qildi */ }
  }

  const addToCart = () => {
    add({ id: cartId, productId: p.id, variant: p.variants ? (v.sku || '') : '', sellerId: p.sellerId, name: variant ? `${p.name} (${v.label})` : p.name, type: v.label, price: v.price, image: p.thumbs[0] }, qty)
    setToast(`${qty} ta ${p.name} savatga qo‘shildi`)
  }

  return (
    <div className="min-h-screen bg-white pb-[150px]">
      {/* Galereya */}
      <div
        className="relative h-[252px] overflow-hidden bg-[#f3f6f9]"
        onTouchStart={(e) => { touch.current = e.touches[0].clientX }}
        onTouchEnd={(e) => {
          if (touch.current == null || n < 2) return
          const dx = e.changedTouches[0].clientX - touch.current
          if (Math.abs(dx) > 40) setShot((s) => (s + (dx < 0 ? 1 : -1) + n) % n)
          touch.current = null
        }}
      >
        <img
          src={p.images[shot] || thumbs[shot]}
          alt={p.name}
          className={p.images.length > 1 ? `size-full object-cover ${shot === 0 && p.images[0].includes('g-main') ? 'scale-[1.26]' : ''}` : 'size-full bg-white object-contain px-10 pb-4 pt-14'}
        />
        <button type="button" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/marketplace'))} aria-label="Orqaga" className="absolute left-3.5 top-3.5 grid size-10 place-items-center rounded-xl bg-white/95 text-ink shadow-[0_2px_8px_rgb(11_31_58/0.12)]">
          <ChevronLeft className="size-5" />
        </button>
        <div className="absolute right-3.5 top-3.5 flex gap-2">
          <button type="button" onClick={() => { setLiked(!liked); setToast(liked ? 'Sevimlilardan olib tashlandi' : 'Sevimlilarga qo‘shildi') }} aria-label="Sevimlilarga qo‘shish" aria-pressed={liked} className="grid size-10 place-items-center rounded-xl bg-white/95 text-ink shadow-[0_2px_8px_rgb(11_31_58/0.12)]">
            <Heart className={`size-[19px] ${liked ? 'fill-sale text-sale' : ''}`} />
          </button>
          <button type="button" onClick={share} aria-label="Ulashish" className="grid size-10 place-items-center rounded-xl bg-white/95 text-ink shadow-[0_2px_8px_rgb(11_31_58/0.12)]">
            <Share2 className="size-[18px]" />
          </button>
        </div>
      </div>

      {n > 1 && (
        <div className="mt-2 grid grid-cols-4 gap-2 px-3.5">
          {thumbs.map((t, i) => (
            <button key={t} type="button" onClick={() => setShot(i)} aria-label={`Rasm ${i + 1}`} className={`h-[60px] overflow-hidden rounded-xl bg-[#f3f6f9] ${i === shot ? 'ring-2 ring-sea' : 'ring-1 ring-line'}`}>
              <img src={t} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="px-3.5">
        <div className="mt-3 flex items-center gap-2 text-[11.5px]">
          <span className="flex items-center gap-1 font-bold tracking-wide text-ink"><BadgeCheck className="size-[18px] fill-ok text-white" /> ORIGINAL</span>
          <span className="h-3 w-px bg-line" />
          <Link to={`/marketplace?brand=${encodeURIComponent(p.brand)}`} className="flex items-center gap-0.5 text-ink-2">{p.brand} <ChevronRight className="size-3.5" /></Link>
        </div>
        <h1 className="mt-1.5 text-[21px] font-bold leading-tight text-ink">{p.name}</h1>
        <div className="mt-1.5 flex items-center gap-2 text-[12.5px] text-muted">
          {p.stock > 0 ? `Omborda ${p.stock} dona` : 'Tugagan'}
          <span className="mx-1 h-3 w-px bg-line" />
          <MessageSquareText className="size-4" /> 128 ta sharh
        </div>

        {/* Narx */}
        <div className="mt-3 rounded-2xl border border-line px-3.5 py-3">
          <div className="flex items-center gap-2.5">
            <p className="text-[23px] font-extrabold tracking-tight text-ink">{som(v.price)}</p>
            {off > 0 && <span className="rounded-full bg-[#fde7ea] px-2 py-0.5 text-[12px] font-bold text-sale">-{off}%</span>}
          </div>
          {off > 0 && (
            <>
              <p className="text-[12.5px] text-muted line-through">{som(v.oldPrice)}</p>
              <span className="mt-1.5 inline-block rounded-lg bg-[#e6f6ee] px-2 py-1 text-[12px] font-semibold text-ok">Tejaysiz: {som(v.oldPrice - v.price)}</span>
            </>
          )}
        </div>

        {/* Mavjudlik */}
        <button type="button" onClick={() => setToast('Buyurtma bugun 18:00 gacha berilsa, ertaga yetkaziladi')} className="mt-3 flex w-full items-center justify-between gap-2 rounded-xl bg-sea-50/70 px-2.5 py-2.5 text-left">
          <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[11.5px] font-semibold text-sea-600"><Package className="size-[17px]" /> Omborda bor</span>
          <span className="flex min-w-0 items-center gap-1 text-[10px] text-ink-2">
            <Truck className="size-4 shrink-0" /> <span className="truncate">Toshkent bo‘ylab 1 kunda yetkazib berish</span> <ChevronRight className="size-4 shrink-0" />
          </span>
        </button>

        {/* Variant va miqdor */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[12px] text-ink-2">Hajm (variant)</span>
            <span className="relative mt-1 flex h-11 items-center rounded-xl border border-line">
              <select value={variant} onChange={(e) => setVariant(Number(e.target.value))} disabled={variants.length < 2} className="h-full w-full appearance-none rounded-xl bg-transparent pl-3 pr-8 text-[13.5px] font-medium text-ink outline-none disabled:opacity-100">
                {variants.map((x, i) => <option key={x.label} value={i}>{x.label}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 size-4 text-ink-2" />
            </span>
          </label>
          <div>
            <span className="text-[12px] text-ink-2">Miqdori</span>
            <div className="mt-1 flex h-11 items-center justify-between rounded-xl border border-line px-1">
              <button type="button" onClick={() => changeQty(qty - 1)} disabled={!inCart && qty <= 1} aria-label="Kamaytirish" className="grid size-9 place-items-center rounded-lg text-ink disabled:text-muted/50">
                <Minus className="size-4" />
              </button>
              <span className="text-[14px] font-semibold text-ink">{qty}</span>
              <button type="button" onClick={() => changeQty(qty + 1)} aria-label="Ko‘paytirish" className="grid size-9 place-items-center rounded-lg text-ink">
                <Plus className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tavsif */}
        <h2 className="mt-4 text-[16px] font-bold text-ink">Tavsif</h2>
        <p className={`mt-1 text-[12.5px] leading-[1.55] text-ink-2 ${moreText ? '' : 'line-clamp-3'}`}>{p.description}</p>
        {p.description.length > 160 && (
          <button type="button" onClick={() => setMoreText(!moreText)} className="mt-0.5 text-[12px] font-semibold text-sea">
            {moreText ? 'Yopish' : 'Ko‘proq o‘qish'}
          </button>
        )}

        <h2 className="mt-3 text-[16px] font-bold text-ink">Xususiyatlari</h2>
        <ul className="mt-1.5 space-y-1">
          {(p.highlights || p.features).map((f) => (
            <li key={f} className="flex gap-2 text-[12.5px] leading-[1.45] text-ink-2">
              <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-sea" /> {f}
            </li>
          ))}
        </ul>

        {/* Sotuvchi */}
        <h2 className="mt-4 text-[16px] font-bold text-ink">Sotuvchi</h2>
        <div className="mt-2 flex items-center gap-2.5 rounded-2xl border border-line p-2.5">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#0f2b5b] text-[12px] font-bold text-white">{seller.logo}</span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold text-ink">{seller.name}</p>
            <p className="truncate text-[11px] text-muted">{seller.about}</p>
            <p className="mt-0.5 flex items-center gap-1 whitespace-nowrap text-[11px] text-muted">
              Naqd to‘lov · yetkazishda
            </p>
          </div>
          <button type="button" onClick={() => setChat(true)} className="flex h-10 shrink-0 items-center gap-1 rounded-xl border border-sea/70 px-2.5 text-[11.5px] font-semibold text-sea active:bg-sea-50">
            <MessageCircle className="size-4" /> Sotuvchiga yozish
          </button>
        </div>
      </div>

      {/* Pastki xarid paneli */}
      <div className="fixed inset-x-0 bottom-[62px] z-30 flex items-center gap-3 border-t border-line bg-white px-3.5 py-2.5 shadow-[0_-6px_18px_rgb(11_31_58/0.06)]">
        {inCart ? (
          <div className="grid h-[52px] flex-1 grid-cols-2 gap-3">
            <QtyStepper big value={inCart} onDec={() => changeQty(inCart - 1)} onInc={() => changeQty(inCart + 1)} />
            <GoCartButton big />
          </div>
        ) : (
          <>
            <div className="min-w-0">
              <p className="whitespace-nowrap text-[17px] font-extrabold leading-tight text-ink">{som(v.price * qty)}</p>
              {off > 0 && (
                <p className="flex items-center gap-1.5 text-[11.5px]">
                  <span className="text-muted line-through">{som(v.oldPrice * qty)}</span>
                  <span className="rounded-md bg-[#fde7ea] px-1.5 font-bold text-sale">-{off}%</span>
                </p>
              )}
            </div>
            <button type="button" onClick={addToCart} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-sea text-[14.5px] font-semibold text-white shadow-[0_6px_16px_rgb(11_138_149/0.3)] active:scale-[0.98]">
              <ShoppingCart className="size-[19px]" /> Savatga qo‘shish
            </button>
          </>
        )}
      </div>

      {chat && <SellerChat seller={seller} product={p} onClose={() => setChat(false)} onSent={() => { setChat(false); setToast('Xabar sotuvchiga yuborildi') }} />}

      <MobileToast
        text={toast}
        onClose={closeToast}
        bottom={140}
      />
      <MobileTabBar />
    </div>
  )
}

const SHOP_QUICK = ['Ulgurji narx bormi?', 'Yaroqlilik muddati qancha?', 'Bugun yetkazasizmi?']

export function SellerChat({ seller, product, onClose, onSent, quick = SHOP_QUICK, reply = '15 daqiqada' }) {
  const [text, setText] = useState(`Assalomu alaykum! "${product.name}" mavjudmi?`)
  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end bg-ink/45" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Sotuvchiga yozish" onClick={(e) => e.stopPropagation()} className="rounded-t-3xl bg-white px-4 pb-[calc(14px+env(safe-area-inset-bottom))] pt-3">
        <div className="flex items-center gap-3">
          {seller.avatar ? (
            <img src={seller.avatar} alt="" className="size-10 rounded-full object-cover" />
          ) : (
            <span className="grid size-10 place-items-center rounded-full bg-[#0f2b5b] text-[11px] font-bold text-white">{seller.logo}</span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-ink">{seller.name}</p>
            <p className="text-[11.5px] text-ok">Odatda {reply} javob beradi</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Yopish" className="grid size-8 place-items-center rounded-full bg-page text-ink"><X className="size-4" /></button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {quick.map((q) => (
            <button key={q} type="button" onClick={() => setText(q)} className="h-8 rounded-lg bg-page px-2.5 text-[12px] text-ink-2">{q}</button>
          ))}
        </div>
        <div className="mt-3 flex items-end gap-2">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className="min-h-[80px] flex-1 resize-none rounded-xl border border-line px-3 py-2.5 text-[13.5px] text-ink outline-none focus:border-sea" />
          <button type="button" disabled={!text.trim()} onClick={onSent} aria-label="Yuborish" className="grid size-12 shrink-0 place-items-center rounded-xl bg-sea text-white disabled:opacity-40">
            <Send className="size-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
