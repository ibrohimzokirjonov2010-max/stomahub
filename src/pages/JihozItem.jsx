import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Star, Heart, ShoppingCart, Minus, Plus, ChevronRight, X, BadgeCheck, Truck, Check, MapPin } from 'lucide-react'
import { useCart } from '../cart'
import {
  getJihoz, products, similarIds, money, catName, statusName, specsOf, kitOf, coverOf, installer, shipping,
} from '../jihozData'

export default function JihozItem() {
  const { id } = useParams()
  const product = getJihoz(id)
  const [shot, setShot] = useState(0)
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState('about')
  const [saved, setSaved] = useState(false)
  const [ask, setAsk] = useState(false)
  const [plan, setPlan] = useState(false)
  const [master, setMaster] = useState(false)
  const { add, items } = useCart()
  const navigate = useNavigate()

  if (!product) {
    return <div className="py-16 text-center text-[14px] text-muted">Jihoz topilmadi. <Link to="/jihozlar" className="text-sea">Jihozlarga qaytish</Link></div>
  }

  const gallery = product.gallery?.length ? product.gallery : [product.image]
  const inCart = items.some((it) => it.id === product.id)
  const put = () => { if (!inCart) add({ id: product.id, name: product.title, type: product.brand, price: product.price, image: product.image }, qty) }
  const similar = similarIds.map((sid) => products.find((p) => p.id === sid)).filter((p) => p && p.id !== product.id)
  const points = product.points || [product.feature, 'Kafolat va servis', 'Original yetkazib berish', product.lizing ? 'Bo‘lib to‘lash mumkin' : 'Ombordan jo‘natish']
  const specs = specsOf(product)
  const kit = kitOf(product)
  const cover = coverOf(product)

  return (
    <div className="pb-8 pt-3">
      <p className="mb-3 flex flex-wrap items-center gap-1 text-[11px] text-muted">
        <Link to="/marketplace" className="hover:text-sea">Do‘kon</Link><ChevronRight className="size-3" />
        <Link to="/jihozlar" className="hover:text-sea">Jihozlar</Link><ChevronRight className="size-3" />
        <Link to={`/jihozlar?cat=${product.cat}`} className="hover:text-sea">{product.crumb || catName[product.cat]}</Link><ChevronRight className="size-3" />
        <span className="text-ink">{product.title}</span>
      </p>

      <div className="jihoz-buy">
        <div className="min-w-0">
          <div className="grid items-start gap-3" style={{ gridTemplateColumns: '68px minmax(180px, 300px) minmax(0, 1fr)' }}>
            <div className="flex flex-col gap-2">
              {gallery.map((src, i) => (
                <button key={src + i} onClick={() => setShot(i)} className={`overflow-hidden rounded-lg border bg-[#f4f7fb] ${shot === i ? 'border-sea' : 'border-transparent'}`} style={{ height: 60 }}>
                  <img src={src} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
            <div className="relative overflow-hidden rounded-2xl bg-[#f4f7fb]" style={{ height: 320 }}>
              <img src={gallery[shot] || product.image} alt={product.title} className="size-full object-cover" />
              {product.id === 'fengdan-ql2028' && shot === 0 ? <span className="absolute left-3 top-3 text-[16px] font-black tracking-[0.16em] text-[#1d4e89]">FENGDAN</span> : null}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap gap-1.5">
                <span className="rounded-md bg-sea px-1.5 py-0.5 text-[10px] font-bold text-white">{statusName[product.status]}</span>
                {product.official ? <span className="rounded-md bg-sea-50 px-1.5 py-0.5 text-[10px] font-semibold text-sea">Rasmiy distribyutor</span> : null}
                <span className="rounded-md bg-[#eef2f6] px-1.5 py-0.5 text-[10px] font-semibold text-ink-2">{product.warranty >= 12 ? `${product.warranty / 12} yil kafolat` : `${product.warranty} oy kafolat`}</span>
              </div>
              <h1 className="mt-1.5 text-[22px] font-extrabold leading-tight text-ink">{product.title}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-ink-2">
                <span className="font-semibold text-ink">{product.brand}</span>
                <Star className="size-3.5 fill-star text-star" /> {product.rating}
                <span className="text-muted">({product.reviews} sharh)</span>
                {product.sold ? <span className="text-muted">{product.sold} ta sotilgan</span> : null}
              </p>
              <p className="mt-2 text-[26px] font-extrabold leading-none text-ink">{money(product.price)}</p>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-2">
                <span className="inline-flex items-center gap-1 text-ok"><Check className="size-3.5" /> Omborda bor</span>
                <span className="inline-flex items-center gap-1"><Truck className="size-3.5 text-sea" /> Toshkent 1 kun, Viloyatlar 3–5 kun</span>
              </p>
              <button onClick={() => setPlan(true)} className="mt-2 flex w-full items-center justify-between rounded-xl border border-line px-3 py-2 text-left hover:border-sea">
                <span>
                  <span className="block text-[11px] font-bold text-ink">Bo‘lib to‘lash</span>
                  <span className="text-[12px] text-ink-2">12 oy × {money(product.month)}/oy</span>
                </span>
                <ChevronRight className="size-4 text-muted" />
              </button>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex h-10 items-center rounded-full bg-[#f3f6fa] px-1">
                  <button aria-label="Kamaytirish" onClick={() => setQty((n) => Math.max(1, n - 1))} className="grid size-8 place-items-center"><Minus className="size-3.5" /></button>
                  <span className="w-6 text-center text-[13px] font-bold">{qty}</span>
                  <button aria-label="Ko‘paytirish" onClick={() => setQty((n) => n + 1)} className="grid size-8 place-items-center"><Plus className="size-3.5" /></button>
                </div>
                <button onClick={put} className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-full text-[13px] font-semibold text-white ${inCart ? 'bg-[#1f8f4e]' : 'bg-sea hover:bg-sea-600'}`}>
                  <ShoppingCart className="size-4" /> {inCart ? 'Savatda' : 'Savatga qo‘shish'}
                </button>
                <button aria-label="Saqlash" onClick={() => setSaved((v) => !v)} className="grid size-10 place-items-center rounded-full border border-line bg-white">
                  <Heart className={`size-4 ${saved ? 'fill-sale text-sale' : 'text-ink-2'}`} />
                </button>
              </div>
              <button onClick={() => { put(); navigate('/buyurtma', { state: { from: 'jihoz' } }) }} className="mt-2 h-10 w-full rounded-full bg-sea text-[13px] font-semibold text-white hover:bg-sea-600">Hozir sotib olish</button>
              <button onClick={() => setAsk(true)} className="mt-2 h-10 w-full rounded-full border border-sea text-[13px] font-semibold text-sea hover:bg-sea-50">Konsultatsiya so‘rash</button>
            </div>
          </div>

          <div className="mt-4 flex gap-1 overflow-x-auto border-b border-line no-scrollbar">
            {[
              ['about', 'Tavsif'],
              ['specs', 'Texnik xususiyatlar'],
              ['kit', 'Komplekt'],
              ['cover', 'Kafolat va servis'],
              ['install', 'O‘rnatish'],
              ['ship', 'Yetkazib berish'],
              ['reviews', `Sharhlar (${product.reviews})`],
            ].map(([k, label]) => (
              <button key={k} onClick={() => setTab(k)} className={`h-9 shrink-0 px-2.5 text-[12px] font-semibold ${tab === k ? 'border-b-2 border-sea text-sea' : 'text-ink-2'}`}>{label}</button>
            ))}
          </div>

          {tab === 'about' && (
            <div className="jihoz-about mt-3">
              <div>
                <h3 className="text-[14px] font-bold">Mahsulot tavsifi</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-ink-2">{product.story || `${product.brand} ${product.title}. ${product.feature}. ${product.year}-yil, kafolat ${product.warranty} oy.`}</p>
                <div className="mt-2 flex flex-col gap-1.5">
                  {points.map((line) => <p key={line} className="flex items-start gap-1.5 text-[12px] text-ink-2"><Check className="mt-0.5 size-3.5 shrink-0 text-sea" />{line}</p>)}
                </div>
              </div>
              <div>
                <h3 className="text-[14px] font-bold">Texnik xususiyatlar</h3>
                <div className="mt-1">
                  {specs.map(([k, v]) => (
                    <div key={k} className="grid items-start gap-1 border-b border-line py-1 text-[11px]" style={{ gridTemplateColumns: '86px minmax(0,1fr)' }}><span className="text-muted">{k}</span><span className="text-right font-semibold text-ink">{v}</span></div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-[14px] font-bold">Komplekt</h3>
                <div className="mt-1 flex flex-col gap-1">
                  {kit.map((line) => <p key={line} className="flex items-start gap-1.5 text-[12px] text-ink-2"><Check className="mt-0.5 size-3.5 shrink-0 text-sea" />{line}</p>)}
                </div>
              </div>
              <div className="rounded-xl bg-[#e7f7f4] p-3">
                <h3 className="text-[14px] font-bold">Kafolat va servis</h3>
                <div className="mt-1 flex flex-col gap-1">
                  {cover.map((line) => <p key={line} className="flex items-start gap-1.5 text-[12px] text-ink-2"><Check className="mt-0.5 size-3.5 shrink-0 text-sea" />{line}</p>)}
                </div>
              </div>
            </div>
          )}
          {tab === 'specs' && <SpecList rows={specs} />}
          {tab === 'kit' && <CheckList title="Komplekt" rows={kit} />}
          {tab === 'cover' && <CheckList title="Kafolat va servis" rows={cover} soft />}
          {tab === 'install' && (
            <div className="mt-3 max-w-[420px] rounded-xl bg-white p-4 shadow-card">
              <h3 className="text-[14px] font-bold">O‘rnatish va servis</h3>
              <p className="mt-1 text-[12px] text-muted">Sertifikatlashgan usta tomonidan o‘rnatish</p>
              <p className="mt-1 text-[16px] font-extrabold">{money(installer.price)}</p>
              <p className="mt-2 text-[13px] font-bold">{installer.name}</p>
              <p className="text-[12px] text-muted">{installer.city} · {installer.brands.join(', ')}</p>
              <button onClick={() => setMaster(true)} className="mt-3 h-9 rounded-lg border border-sea px-4 text-[12px] font-semibold text-sea">Ustani tanlash</button>
            </div>
          )}
          {tab === 'ship' && (
            <div className="mt-3 max-w-[480px] rounded-xl bg-white p-4 shadow-card">
              {shipping.map(([place, cost, time]) => (
                <div key={place} className="flex items-center justify-between border-b border-line py-2 text-[12px]">
                  <span>{place}</span><span className="font-semibold">{cost}</span><span className="text-muted">{time}</span>
                </div>
              ))}
            </div>
          )}
          {tab === 'reviews' && (
            <div className="mt-3 flex max-w-[640px] flex-col gap-2">
              <p className="rounded-xl bg-white p-3 text-[12px] text-muted shadow-card">Hali sharhlar yo‘q</p>
            </div>
          )}

          <div className="mb-2 mt-6 flex items-center justify-between">
            <h2 className="text-[16px] font-bold">O‘xshash mahsulotlar</h2>
            <Link to={`/jihozlar?cat=${product.cat}`} className="text-[12px] font-semibold text-sea">Barchasini ko‘rish</Link>
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {similar.map((p) => (
              <Link key={p.id} to={`/jihozlar/${p.id}`} className="min-w-0 rounded-xl bg-white p-2 shadow-card hover:ring-1 hover:ring-sea">
                <img src={p.image} alt="" className="w-full rounded-lg object-cover" style={{ height: 88 }} />
                <p className="mt-1 text-[9px] font-bold uppercase text-sea">{p.brand}</p>
                <p className="line-clamp-2 text-[12px] font-semibold leading-tight">{p.title}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted"><Star className="size-3 fill-star text-star" /> {p.rating} <span>({p.reviews})</span></p>
                <p className="text-[13px] font-extrabold">{money(p.price)}</p>
              </Link>
            ))}
          </div>
        </div>

        <aside className="flex flex-col gap-3">
          <div className="rounded-xl bg-white p-3 shadow-card">
            <p className="text-[10px] text-muted">Sotuvchi</p>
            <p className="text-[14px] font-extrabold text-ink">{product.brand} Uzbekistan</p>
            <p className="inline-flex items-center gap-1 text-[11px] text-sea"><BadgeCheck className="size-3.5" /> Rasmiy distribyutor</p>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <Link to={`/jihozlar?brand=${encodeURIComponent(product.brand)}`} className="flex h-8 items-center justify-center rounded-lg bg-sea text-[10px] font-semibold text-white">Do‘konni ko‘rish</Link>
              <Link to={`/jihozlar?brand=${encodeURIComponent(product.brand)}`} className="flex h-8 items-center justify-center rounded-lg border border-line text-[10px] font-semibold text-ink">Barcha mahsulotlar</Link>
            </div>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-card">
            <h3 className="text-[12px] font-bold">O‘rnatish va servis</h3>
            <p className="mt-1 text-[11px] text-muted">Sertifikatlashgan usta tomonidan o‘rnatish</p>
            <p className="text-[16px] font-extrabold">{money(installer.price)}</p>
            <div className="mt-2 flex items-center gap-2">
              <img src={installer.photo} alt="" className="size-10 rounded-full object-cover" />
              <div>
                <p className="text-[12px] font-bold">{installer.name}</p>
                <p className="flex items-center gap-1 text-[11px]"><Star className="size-3 fill-star text-star" /> {installer.rating} <span className="text-muted">({installer.reviews})</span></p>
              </div>
            </div>
            <p className="mt-1 flex items-center gap-1 text-[11px] text-muted"><MapPin className="size-3" /> {installer.city}</p>
            <div className="mt-1 flex flex-wrap gap-1">{installer.brands.map((b) => <span key={b} className="rounded bg-[#f3f6fa] px-1.5 py-0.5 text-[10px]">{b}</span>)}</div>
            <button onClick={() => setMaster(true)} className="mt-2 h-8 w-full rounded-lg border border-sea text-[11px] font-semibold text-sea">Ustani tanlash</button>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-card">
            <h3 className="flex items-center gap-1 text-[12px] font-bold"><Truck className="size-3.5 text-sea" /> Yetkazib berish</h3>
            {shipping.map(([place, cost, time]) => (
              <div key={place} className="mt-1.5 grid items-center gap-1 text-[10px]" style={{ gridTemplateColumns: 'minmax(0,1fr) auto auto' }}>
                <span className="text-ink-2">{place}</span>
                <span className="whitespace-nowrap font-semibold">{cost}</span>
                <span className="whitespace-nowrap text-muted">{time}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {ask && <Note title="Konsultatsiya so‘rash" done="So‘rovingiz qabul qilindi. Muhandis jihoz bo‘yicha bog‘lanadi." onClose={() => setAsk(false)} />}
      {plan && <Note title="Bo‘lib to‘lash" done={`${product.title} — 12 oy × ${money(product.month)}/oy. Rasmiy lizing bo‘yicha ariza qoldirishingiz mumkin.`} onClose={() => setPlan(false)} plain />}
      {master && <Note title="Ustani tanlash" done={`${installer.name} o‘rnatishga yozildi. Narx: ${money(installer.price)}. Usta sana bo‘yicha bog‘lanadi.`} onClose={() => setMaster(false)} plain />}
    </div>
  )
}

function SpecList({ rows }) {
  return (
    <div className="mt-3 max-w-[520px] rounded-xl bg-white p-4 shadow-card">
      {rows.map(([k, v]) => <div key={k} className="flex justify-between gap-3 border-b border-line py-1.5 text-[12px]"><span className="text-muted">{k}</span><span className="text-right font-semibold">{v}</span></div>)}
    </div>
  )
}
function CheckList({ title, rows, soft }) {
  return (
    <div className={`mt-3 max-w-[420px] rounded-xl p-4 ${soft ? 'bg-[#e7f7f4]' : 'bg-white shadow-card'}`}>
      <h3 className="text-[14px] font-bold">{title}</h3>
      <div className="mt-2 flex flex-col gap-1.5">{rows.map((line) => <p key={line} className="flex items-start gap-1.5 text-[12px]"><Check className="mt-0.5 size-3.5 text-sea" />{line}</p>)}</div>
    </div>
  )
}
function Note({ title, done, onClose, plain }) {
  const [sent, setSent] = useState(!!plain)
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[400px] rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between"><h3 className="text-[16px] font-bold">{title}</h3><button onClick={onClose} aria-label="Yopish"><X className="size-4 text-muted" /></button></div>
        {sent ? <p className="py-4 text-[13px] leading-relaxed text-ink-2">{done}</p> : (
          <form onSubmit={(e) => { e.preventDefault(); setSent(true) }} className="flex flex-col gap-2">
            <input required placeholder="Ism" className="h-10 rounded-lg bg-page px-3 text-[13px] outline-none" />
            <input required placeholder="Telefon" className="h-10 rounded-lg bg-page px-3 text-[13px] outline-none" />
            <button className="h-10 rounded-lg bg-sea text-[13px] font-semibold text-white">Yuborish</button>
          </form>
        )}
      </div>
    </div>
  )
}
