import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Heart, Share2, Star, CircleCheck, Ruler, Minus, Plus, Leaf, WashingMachine, Truck, ShoppingCart,
} from 'lucide-react'
import { getForma, products, similarIds, money, colorOf, sizeChart } from '../../formaData'
import { useCart } from '../../cart'
import { MobileToast, QtyStepper, GoCartButton } from './parts'
import MobileTabBar from './MobileTabBar'
import { BottomSheet, ToothIcon } from './MobileSeminars'
import { defaultSize, formaCartId, sizeLabel } from './MobileForma'

const LOGO_PRICE = 25000
const MATERIAL = {
  cotton: ['65% paxta', '35% polyester'],
  stretch: ['72% polyester, 21% viskoza', '7% spandeks'],
  premium: ['80% paxta', '20% polyester'],
  anti: ['100% polyester', 'Antibakterial qoplama'],
}

export default function MobileFormaItem() {
  const { id } = useParams()
  return <FormaView key={id} id={id} />
}

function FormaView({ id }) {
  const p = getForma(id)
  const navigate = useNavigate()
  const { items, add, setQty: setCartQty, remove } = useCart()
  const [shot, setShot] = useState(0)
  const [color, setColor] = useState(p?.colors[0])
  const [size, setSize] = useState(p ? defaultSize(p) : 'M')
  const [logo, setLogo] = useState(false)
  const [pick, setPick] = useState(1)
  const [liked, setLiked] = useState(false)
  const [chart, setChart] = useState(false)
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
          <p className="text-[15px] font-semibold text-ink">Mahsulot topilmadi</p>
          <Link to="/forma" className="mt-3 inline-block text-[13px] font-semibold text-sea">Formaga qaytish</Link>
        </div>
      </div>
    )
  }

  const gallery = (p.gallery?.length ? p.gallery : [p.image]).slice(0, 4)
  const n = gallery.length
  const oldPrice = p.oldPrice || null
  const off = p.off || (oldPrice ? Math.round((1 - p.price / oldPrice) * 100) : 0)
  const unit = p.price + (logo ? LOGO_PRICE : 0)
  const sku = `${p.brand.slice(0, 2).toUpperCase()}-${String(p.rank + 1).padStart(3, '0')}`
  const cartId = formaCartId(p, color, size, logo)
  const inCart = items.find((it) => it.id === cartId)?.qty || 0
  const qty = inCart || pick
  const similar = similarIds.map((sid) => products.find((x) => x.id === sid)).filter((x) => x && x.id !== p.id)
  const story = p.story || `${p.brand} ${p.title.toLowerCase()}. ${p.about} Klinika va shifoxonada kiyish uchun mos.`
  const [mat1, mat2] = MATERIAL[p.fabric] || MATERIAL.cotton

  const changeQty = (next) => {
    if (!inCart) return setPick(Math.min(99, Math.max(1, next)))
    if (next < 1) { remove(cartId); setPick(1); setToast('Savatdan olib tashlandi') }
    else setCartQty(cartId, Math.min(99, next))
  }
  const addToCart = () => {
    add({
      id: cartId,
      name: `${p.title} (${colorOf(color).name}, ${sizeLabel(size)}${logo ? ', logo bilan' : ''})`,
      type: p.brand,
      price: unit,
      image: p.image,
    }, qty)
    setToast(`${qty} ta ${p.title} savatga qo‘shildi`)
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
        className="relative h-[310px] overflow-hidden bg-[#eef3f6]"
        onTouchStart={(e) => { touch.current = e.touches[0].clientX }}
        onTouchEnd={(e) => {
          if (touch.current == null || n < 2) return
          const dx = e.changedTouches[0].clientX - touch.current
          if (Math.abs(dx) > 40) setShot((shot + (dx < 0 ? 1 : -1) + n) % n)
          touch.current = null
        }}
      >
        <img src={gallery[shot]} alt={p.title} className="size-full object-cover object-[50%_20%]" />
        <button type="button" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/forma'))} aria-label="Orqaga" className="safe-overlay-top absolute left-3.5 grid size-10 place-items-center rounded-xl bg-white/95 text-ink shadow-[0_2px_8px_rgb(11_31_58/0.12)]">
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
      </div>

      {n > 1 && (
        <div className="grid grid-cols-4 gap-2 bg-white px-3.5 pt-2">
          {gallery.map((src, i) => (
            <button key={src + i} type="button" onClick={() => setShot(i)} aria-label={`Rasm ${i + 1}`} className={`h-[70px] overflow-hidden rounded-xl bg-[#eef3f6] ${i === shot ? 'ring-2 ring-sea' : 'ring-1 ring-line'}`}>
              <img src={src} alt="" className="size-full object-cover object-top" />
            </button>
          ))}
        </div>
      )}

      {/* Narx va nom */}
      <div className="mx-3 mt-2.5 rounded-2xl bg-white p-3 shadow-[0_1px_4px_rgb(11_31_58/0.05)]">
        {off > 0 && oldPrice && (
          <p className="flex items-center gap-2">
            <span className="rounded-md bg-sale px-1.5 py-0.5 text-[11px] font-bold text-white">-{off}%</span>
            <span className="text-[12px] text-muted line-through">{money(oldPrice)}</span>
          </p>
        )}
        <p className="mt-0.5 text-[25px] font-extrabold leading-tight tracking-tight text-[#0d2a4a]">{money(p.price)}</p>
        <Link to={`/forma?brand=${encodeURIComponent(p.brand)}`} className="mt-2 flex w-fit items-center gap-0.5 text-[11.5px] font-bold uppercase tracking-wide text-ink">
          {p.brand} <ChevronRight className="size-3.5" />
        </Link>
        <h1 className="mt-0.5 text-[20px] font-bold leading-tight text-[#0d2a4a]">{p.title}</h1>
        <div className="mt-2 flex items-center gap-2 text-[11.5px]">
          <span className="flex items-center gap-1 text-ink-2"><Star className="size-4 fill-star text-star" /> <b className="font-semibold text-ink">{p.rating}</b> ({p.reviews} ta sharh)</span>
          <span className="ml-auto flex items-center gap-1 text-ink-2"><CircleCheck className="size-4 fill-ok text-white" /> Sotuvda mavjud</span>
          <span className="h-3 w-px bg-line" />
          <span className="text-muted">SKU: {sku}</span>
        </div>
      </div>

      {/* Tanlov */}
      <div className="mx-3 mt-2.5 rounded-2xl bg-white p-3 shadow-[0_1px_4px_rgb(11_31_58/0.05)]">
        <p className="text-[13px] text-ink-2">Rang: <b className="font-semibold text-ink">{colorOf(color).name}</b></p>
        <div className="mt-2 flex gap-2.5">
          {p.colors.map((c) => (
            <button key={c} type="button" onClick={() => setColor(c)} aria-label={colorOf(c).name} aria-pressed={color === c} className={`size-10 rounded-full border border-line transition ${color === c ? 'ring-2 ring-sea ring-offset-2' : ''}`} style={{ background: colorOf(c).hex }} />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-[13px] text-ink-2">O‘lcham: <b className="font-semibold text-sea">{sizeLabel(size)}</b></p>
          <button type="button" onClick={() => setChart(true)} className="flex items-center gap-1 text-[12px] font-semibold text-[#1f5fa8]"><Ruler className="size-4" /> O‘lcham jadvali</button>
        </div>
        <div className="mt-2 grid grid-cols-6 gap-1.5">
          {p.sizes.map((s) => (
            <button key={s} type="button" onClick={() => setSize(s)} aria-pressed={size === s} className={`h-10 rounded-xl text-[13px] font-semibold transition ${size === s ? 'bg-sea text-white' : 'border border-line bg-white text-ink'}`}>{sizeLabel(s)}</button>
          ))}
        </div>

        <label className="mt-3.5 flex cursor-pointer items-center gap-2.5 rounded-2xl border border-line p-2.5">
          <ToothIcon className="size-6 shrink-0 text-[#0d2a4a]" strokeWidth={1.5} />
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-semibold text-ink">Logo tikish (ixtiyoriy)</span>
            <span className="block text-[10.5px] text-muted">Kiyimingizga klinika logotipini tikish</span>
          </span>
          <span className="whitespace-nowrap text-[12px] font-semibold text-[#1f5fa8]">+ {money(LOGO_PRICE)}</span>
          <input type="checkbox" checked={logo} onChange={(e) => setLogo(e.target.checked)} className="sr-only" />
          <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${logo ? 'bg-sea' : 'bg-line'}`}>
            <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${logo ? 'left-[22px]' : 'left-0.5'}`} />
          </span>
        </label>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-[13px] text-ink-2">Miqdor</span>
          <div className="flex h-10 items-center rounded-xl bg-[#f0f3f7] p-1">
            <button type="button" onClick={() => changeQty(qty - 1)} disabled={!inCart && qty <= 1} aria-label="Kamaytirish" className="grid size-8 place-items-center rounded-lg text-ink disabled:text-muted/50"><Minus className="size-4" /></button>
            <span className="w-9 text-center text-[14px] font-semibold text-ink">{qty}</span>
            <button type="button" onClick={() => changeQty(qty + 1)} aria-label="Ko‘paytirish" className="grid size-8 place-items-center rounded-lg text-ink"><Plus className="size-4" /></button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-[1fr_1fr_1.2fr] gap-1.5">
          {[
            [Leaf, 'Material', mat1, mat2],
            [WashingMachine, 'Parvarish', '30°C da yuvish', 'Oqartiruvchi ishlatmaslik'],
            [Truck, 'Yetkazib berish', 'Toshkent: 1 kun', 'Boshqa hududlar: 1–2 kun'],
          ].map(([Icon, title, a, b]) => (
            <div key={title} className="rounded-xl bg-[#f3f7fb] p-2">
              <p className="flex items-center gap-1 whitespace-nowrap text-[10.5px] font-semibold text-ink"><Icon className="size-4 shrink-0 text-sea" strokeWidth={1.7} /> {title}</p>
              <p className="mt-1 text-[9.5px] leading-snug text-ink-2">{a}<br />{b}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tavsif */}
      <div className="mx-3 mt-2.5 rounded-2xl bg-white p-3 shadow-[0_1px_4px_rgb(11_31_58/0.05)]">
        <h2 className="text-[15px] font-bold text-[#0d2a4a]">Mahsulot tavsifi</h2>
        <p className="mt-1 text-[12px] leading-[1.55] text-ink-2">{story}</p>
        {p.perks && (
          <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
            {p.perks.flat().map((l) => (
              <li key={l} className="flex gap-1.5 text-[11px] leading-snug text-ink-2"><span className="mt-[5px] size-1.5 shrink-0 rounded-full bg-sea" /> {l}</li>
            ))}
          </ul>
        )}
      </div>

      {/* O'xshash */}
      <div className="mt-4 flex items-center justify-between px-3.5">
        <h2 className="text-[15px] font-bold text-[#0d2a4a]">O‘xshash mahsulotlar</h2>
        <Link to="/forma" className="text-[12px] font-semibold text-sea">Barchasi</Link>
      </div>
      <div className="mt-2 flex gap-2.5 overflow-x-auto px-3.5 pb-1 no-scrollbar">
        {similar.map((x) => (
          <Link key={x.id} to={`/forma/${x.id}`} className="w-[132px] shrink-0 overflow-hidden rounded-2xl bg-white shadow-[0_1px_4px_rgb(11_31_58/0.07)]">
            <img src={x.image} alt="" className="h-[110px] w-full object-cover object-top" />
            <div className="p-2">
              <p className="text-[10px] text-muted">{x.brand}</p>
              <p className="truncate text-[11.5px] font-bold text-ink">{x.title}</p>
              <p className="mt-0.5 text-[12.5px] font-extrabold text-[#0d2a4a]">{money(x.price)}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Pastki panel */}
      <div className="fixed inset-x-0 bottom-[62px] z-30 flex items-center gap-3 border-t border-line bg-white px-3.5 py-2.5 shadow-[0_-6px_18px_rgb(11_31_58/0.06)]">
        {inCart ? (
          <div className="grid h-[52px] flex-1 grid-cols-2 gap-3">
            <QtyStepper big value={inCart} onDec={() => changeQty(inCart - 1)} onInc={() => changeQty(inCart + 1)} />
            <GoCartButton big />
          </div>
        ) : (
          <>
            <div className="min-w-0">
              {off > 0 && oldPrice && (
                <p className="flex items-center gap-1.5 text-[11.5px]">
                  <span className="rounded-md bg-sale px-1.5 font-bold text-white">-{off}%</span>
                  <span className="text-muted line-through">{money((oldPrice + (logo ? LOGO_PRICE : 0)) * qty)}</span>
                </p>
              )}
              <p className="whitespace-nowrap text-[19px] font-extrabold leading-tight text-[#0d2a4a]">{money(unit * qty)}</p>
            </div>
            <button type="button" onClick={addToCart} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-sea text-[14.5px] font-semibold text-white shadow-[0_6px_16px_rgb(11_138_149/0.3)] active:scale-[0.98]">
              <ShoppingCart className="size-[19px]" /> Savatga qo‘shish
            </button>
          </>
        )}
      </div>

      {chart && (
        <BottomSheet title="O‘lcham jadvali (sm)" onClose={() => setChart(false)}>
          <table className="mt-3 w-full text-left text-[13px]">
            <thead>
              <tr className="text-[11.5px] text-muted"><th className="py-2 font-medium">O‘lcham</th><th className="font-medium">Ko‘krak</th><th className="font-medium">Bel</th><th className="font-medium">Bo‘y</th></tr>
            </thead>
            <tbody>
              {sizeChart.map((r) => {
                const on = sizeLabel(size) === r[0]
                const avail = p.sizes.map(sizeLabel).includes(r[0])
                return (
                  <tr key={r[0]} onClick={() => { if (avail) { setSize(p.sizes.find((s) => sizeLabel(s) === r[0])); setChart(false) } }} className={`border-t border-line ${on ? 'bg-sea-50 font-semibold text-sea' : avail ? 'text-ink' : 'text-muted/60'} ${avail ? 'cursor-pointer' : ''}`}>
                    <td className="py-2.5 pl-1">{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="mt-3 text-[11.5px] text-muted">O‘lchamni tanlash uchun qatorni bosing. Kulrang o‘lchamlar bu mahsulotda mavjud emas.</p>
        </BottomSheet>
      )}

      <MobileToast text={toast} onClose={closeToast} bottom={140} />
      <MobileTabBar />
    </div>
  )
}
