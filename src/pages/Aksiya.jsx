import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Clock, Heart, MapPin, Minus, Plus, RotateCcw, ShieldCheck,
  ShoppingCart, Star, Store, Timer, Truck, Wallet, X, Zap,
} from 'lucide-react'
import { useCart } from '../cart'
import { clock, getDeal, others, som, useCountdown } from '../aksiyaData'

const places = ['Toshkent, Yakkasaroy tumani', 'Toshkent, Chilonzor tumani', 'Samarqand shahri']

export default function Aksiya() {
  const { id } = useParams()
  const deal = getDeal(id)
  const sec = useCountdown(deal?.left ?? 0)
  const { add } = useCart()
  const [photo, setPhoto] = useState(0)
  const [qty, setQty] = useState(1)
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState('tavsif')
  const [added, setAdded] = useState(false)
  const [bought, setBought] = useState(false)
  const [shop, setShop] = useState(false)
  const [place, setPlace] = useState(0)
  const [editPlace, setEditPlace] = useState(false)
  const [ship, setShip] = useState('std')

  useEffect(() => {
    setPhoto(0)
    setQty(1)
    setTab('tavsif')
    setAdded(false)
    setBought(false)
  }, [id])

  if (!deal) return <p className="pt-6 text-[13px] text-muted">Aksiya topilmadi.</p>

  const images = deal.images
  const points = deal.points
  const specs = deal.specs || [
    ['Brend', deal.brand],
    ['Chegirma', `-${deal.off}%`],
    ['Omborda', `${deal.stock} dona`],
    ['Kafolat', '12 oy'],
    ['Yetkazish', '1–3 kun'],
  ]
  const reviews = deal.reviewList || []
  const more = others(deal.id)

  const addCart = () => {
    add({ id: deal.id, name: deal.name, type: deal.brand, price: deal.price, image: deal.image }, qty)
    setAdded(true)
  }

  return (
    <div className="pb-2 pt-3">
      <p className="mb-3 flex flex-wrap items-center gap-1 text-[12px] text-muted">
        <Link to="/" className="hover:text-sea">Bosh sahifa</Link>
        <ChevronRight className="size-3" />
        <Link to="/aksiyalar" className="hover:text-sea">Aksiyalar</Link>
        <ChevronRight className="size-3" />
        <span className="text-ink-2">{deal.name}</span>
      </p>

      <div className="aksiya-buy">
        <div className="aksiya-gallery rounded-2xl bg-white p-3 shadow-card">
          <div className="relative grid h-[280px] place-items-center overflow-hidden rounded-xl bg-[#f4f7fb]">
            <span className="absolute left-3 top-3 rounded-lg bg-[#e85d4c] px-2 py-1 text-[12px] font-bold text-white">-{deal.off}%</span>
            <button onClick={() => setSaved((v) => !v)} className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-white text-muted shadow-card" aria-label="Saqlash">
              <Heart className={`size-4 ${saved ? 'fill-sale text-sale' : ''}`} />
            </button>
            <button onClick={() => setPhoto((i) => (i + images.length - 1) % images.length)} className="absolute left-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white shadow-card" aria-label="Oldingi">
              <ChevronLeft className="size-4" />
            </button>
            <img src={images[photo]} alt={deal.name} className="max-h-[250px] max-w-full object-contain" />
            <button onClick={() => setPhoto((i) => (i + 1) % images.length)} className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white shadow-card" aria-label="Keyingi">
              <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="mt-2 flex gap-2">
            {images.map((src, i) => (
              <button key={src} onClick={() => setPhoto(i)} className={`grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg border bg-white ${i === photo ? 'border-sea' : 'border-line'}`}>
                <img src={src} alt="" className="max-h-12 max-w-full object-contain" />
              </button>
            ))}
          </div>
        </div>

        <div className="aksiya-info min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-sea-50 px-2 py-0.5 text-[11px] font-semibold text-sea">Aksiya</span>
          </div>
          <h1 className="mt-1 text-[20px] font-bold leading-tight text-ink">{deal.name}</h1>
          <p className="text-[13px] text-muted">{deal.brand}</p>
          <p className="mt-1 flex items-center gap-1 text-[12.5px] text-ink-2">
            <Stars value={deal.rating} />
            <span className="font-semibold text-ink">{deal.rating}</span>
            <span className="text-muted">({deal.reviews} ta sharh)</span>
          </p>
          <p className="mt-3 text-[13px] text-muted line-through">{som(deal.oldPrice)}</p>
          <div className="flex flex-wrap items-end gap-2">
            <p className="text-[26px] font-bold leading-none text-ink">{som(deal.price)}</p>
            <p className="text-[12.5px] font-semibold text-sea">Siz {som(deal.oldPrice - deal.price)} tejaysiz</p>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-sea-50 px-3 py-2.5 text-[13px]">
            <Timer className="size-4 text-sea" />
            <span className="text-ink-2">Aksiya tugashiga:</span>
            <span className="font-bold text-sea">{clock(sec)}</span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-9 items-center rounded-lg border border-line bg-white">
              <button onClick={() => setQty((n) => Math.max(1, n - 1))} className="grid size-9 place-items-center" aria-label="Kamaytirish"><Minus className="size-3.5" /></button>
              <span className="w-6 text-center text-[13px] font-semibold">{qty}</span>
              <button onClick={() => setQty((n) => Math.min(deal.stock, n + 1))} className="grid size-9 place-items-center" aria-label="Ko‘paytirish"><Plus className="size-3.5" /></button>
            </div>
            <span className="text-[12.5px] text-muted">Soni: {deal.stock} dona</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={addCart} className="inline-flex h-11 items-center gap-2 rounded-xl bg-sea px-5 text-[13.5px] font-semibold text-white">
              <ShoppingCart className="size-4" /> {added ? 'Savatga qo‘shildi' : 'Savatga qo‘shish'}
            </button>
            <button onClick={() => setBought(true)} className="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-white px-5 text-[13.5px] font-semibold text-ink">
              <Zap className="size-4 text-sea" /> {bought ? 'Buyurtma qabul qilindi' : 'Hozir sotib olish'}
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              [Truck, 'Tez yetkazib berish', '1–2 kun ichida'],
              [ShieldCheck, 'Rasmiy kafolat', '12 oy'],
              [Wallet, 'Qulay to‘lov', 'Click, Payme, Uzum'],
              [RotateCcw, '7 kun ichida qaytarish', 'Agar mos kelmasa'],
            ].map(([Icon, title, sub]) => (
              <div key={title} className="flex items-start gap-2 rounded-lg bg-white px-2 py-1.5">
                <Icon className="mt-0.5 size-4 shrink-0 text-sea" />
                <span>
                  <span className="block text-[11.5px] font-semibold text-ink">{title}</span>
                  <span className="block text-[10.5px] text-muted">{sub}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <aside className="aksiya-seller flex flex-col gap-3">
          <div className="rounded-2xl bg-white p-3.5 shadow-card">
            <p className="text-[12px] font-semibold text-muted">Sotuvchi</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-full bg-sea-50 text-sea"><Store className="size-4" /></span>
              <span>
                <span className="block text-[13px] font-bold text-ink">{deal.seller.name}</span>
                <span className="block text-[11px] text-sea">{deal.seller.role}</span>
              </span>
            </div>
            <button onClick={() => setShop(true)} className="mt-3 flex h-9 w-full items-center justify-between rounded-lg bg-sea-50 px-3 text-[12.5px] font-semibold text-sea">
              Do‘kon sahifasi <ChevronRight className="size-4" />
            </button>
            <dl className="mt-3 space-y-1.5 text-[12px]">
              <Row k="Mahsulotlar soni" v={deal.seller.products} />
              <Row k="Reyting" v={String(deal.seller.rating)} />
              <Row k="Javob berish vaqti" v={deal.seller.reply} />
            </dl>
          </div>
          <div className="rounded-2xl bg-white p-3.5 shadow-card">
            <p className="text-[13px] font-bold text-ink">Yetkazib berish</p>
            <p className="mt-2 flex items-start gap-1.5 text-[12px] text-ink-2">
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-sea" /> {places[place]}
            </p>
            <button onClick={() => setEditPlace((v) => !v)} className="mt-1 text-[11.5px] font-semibold text-sea">Manzilni o‘zgartirish</button>
            {editPlace && (
              <select value={place} onChange={(e) => setPlace(Number(e.target.value))} className="mt-2 h-8 w-full rounded-lg border border-line px-2 text-[12px]">
                {places.map((p, i) => <option key={p} value={i}>{p}</option>)}
              </select>
            )}
            <label className={`mt-3 flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-[12px] ${ship === 'std' ? 'border-sea bg-sea-50' : 'border-line'}`}>
              <span className="flex items-center gap-2"><input type="radio" checked={ship === 'std'} onChange={() => setShip('std')} /> <span><span className="block font-semibold">Standart yetkazib berish</span><span className="text-muted">1–3 kun</span></span></span>
              <span className="font-semibold text-sea">Bepul</span>
            </label>
            <label className={`mt-2 flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-[12px] ${ship === 'exp' ? 'border-sea bg-sea-50' : 'border-line'}`}>
              <span className="flex items-center gap-2"><input type="radio" checked={ship === 'exp'} onChange={() => setShip('exp')} /> <span><span className="block font-semibold">Ekspress yetkazib berish</span><span className="text-muted">Bugun (Toshkent)</span></span></span>
              <span className="font-semibold">50 000 so‘m</span>
            </label>
          </div>
        </aside>

        <div className="aksiya-tabs rounded-2xl bg-white p-4 shadow-card">
          <div className="flex gap-4 border-b border-line text-[13px] font-semibold">
            {[
              ['tavsif', 'Tavsif'],
              ['xususiyat', 'Xususiyatlar'],
              ['sharh', `Sharhlar (${deal.reviews})`],
            ].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} className={`-mb-px border-b-2 pb-2 ${tab === key ? 'border-sea text-sea' : 'border-transparent text-muted'}`}>{label}</button>
            ))}
          </div>
          {tab === 'tavsif' && (
            <div className="pt-3">
              <p className="text-[13px] leading-relaxed text-ink-2">{deal.about}</p>
              <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                {points.map((p) => (
                  <li key={p} className="flex gap-2 text-[12.5px] text-ink-2"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-sea" />{p}</li>
                ))}
              </ul>
            </div>
          )}
          {tab === 'xususiyat' && (
            <dl className="mt-3 divide-y divide-line text-[13px]">
              {specs.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 py-2"><dt className="text-muted">{k}</dt><dd className="font-semibold text-ink">{v}</dd></div>
              ))}
            </dl>
          )}
          {tab === 'sharh' && (
            <div className="mt-3 space-y-3">
              {reviews.map((r) => (
                <div key={r.name} className="rounded-xl bg-[#f7fafd] p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-bold text-ink">{r.name} <span className="font-normal text-muted">· {r.role}</span></p>
                    <span className="text-[11px] text-muted">{r.date}</span>
                  </div>
                  <Stars value={r.stars} />
                  <p className="mt-1 text-[12.5px] text-ink-2">{r.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <section className="aksiya-more">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-ink">Boshqa aksiyalar</h2>
            <Link to="/aksiyalar" className="text-[12.5px] font-semibold text-sea">Barchasini ko‘rish</Link>
          </div>
          <div className="aksiya-more-grid">
            {more.map((d) => (
              <Link key={d.id} to={`/aksiyalar/${d.id}`} className="min-w-0 rounded-xl bg-white p-2.5 shadow-card">
                <div className="relative grid h-[100px] place-items-center">
                  <span className="absolute left-0 top-0 rounded-md bg-sea px-1.5 py-0.5 text-[11px] font-bold text-white">-{d.off}%</span>
                  <img src={d.image} alt="" className="max-h-[88px] max-w-full object-contain" />
                </div>
                <p className="mt-1 truncate text-[12.5px] font-bold text-ink">{d.name}</p>
                <p className="text-[11px] text-muted">{d.brand}</p>
                <p className="mt-1 text-[11px] text-muted line-through">{som(d.oldPrice)}</p>
                <p className="text-[13px] font-bold text-ink">{som(d.price)}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {shop && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={() => setShop(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[16px] font-bold text-ink">{deal.seller.name}</p>
                <p className="text-[12.5px] text-sea">{deal.seller.role}</p>
              </div>
              <button onClick={() => setShop(false)} aria-label="Yopish" className="grid size-8 place-items-center rounded-lg text-muted"><X className="size-4" /></button>
            </div>
            <p className="mt-3 text-[13px] text-ink-2">{places[place]}. Rasmiy yetkazib beruvchi, {deal.seller.products} mahsulot, reyting {deal.seller.rating}.</p>
            <button onClick={() => setShop(false)} className="mt-4 h-9 rounded-lg bg-sea px-4 text-[12.5px] font-semibold text-white">Yopish</button>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ k, v }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted">{k}</dt>
      <dd className="font-semibold text-ink">{v}</dd>
    </div>
  )
}

function Stars({ value }) {
  return (
    <span className="inline-flex">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`size-3.5 ${i <= Math.round(value) ? 'fill-[#f5b400] text-[#f5b400]' : 'text-line'}`} />
      ))}
    </span>
  )
}
