import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Star, Heart, ShoppingCart, Minus, Plus, Truck, ShieldCheck, CreditCard, ChevronRight, X } from 'lucide-react'
import { useCart } from '../cart'
import { getForma, products, similarIds, money, colorOf, sizeChart } from '../formaData'

const perks = [
  ['Sifat kafolati', '30 kun ichida qaytarish'],
  ['Tez yetkazib berish', 'Toshkent 1 kun · Viloyatlar 2–3 kun'],
  ['Xavfsiz to‘lov', 'Click, Payme, Uzcard'],
]
const shipping = [
  ['Toshkent shahri', '1 kun'],
  ['Toshkent viloyati', '2–3 kun'],
  ['Boshqa viloyatlar', '2–3 kun'],
]

export default function FormaItem() {
  const { id } = useParams()
  const product = getForma(id)
  const [shot, setShot] = useState(0)
  const [color, setColor] = useState(product?.colors[0] || 'teal')
  const [size, setSize] = useState(product?.sizes.includes('M') ? 'M' : product?.sizes[0])
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState('about')
  const [saved, setSaved] = useState(false)
  const [ask, setAsk] = useState(false)
  const [ship, setShip] = useState(false)
  const { add, items } = useCart()
  const navigate = useNavigate()

  if (!product) {
    return <div className="py-16 text-center text-[14px] text-muted">Mahsulot topilmadi. <Link to="/forma" className="text-sea">Formaga qaytish</Link></div>
  }

  const gallery = product.gallery?.length ? product.gallery : [product.image]
  const inCart = items.some((it) => it.id === product.id)
  const put = () => { if (!inCart) add({ id: product.id, name: product.title, type: product.brand, price: product.price, image: product.image }, qty) }
  const similar = similarIds.map((sid) => products.find((p) => p.id === sid)).filter((p) => p && p.id !== product.id)
  const story = product.story || `${product.brand} ${product.title.toLowerCase()}. ${product.about} Klinika va shifoxonada kiyish uchun mos.`

  return (
    <div className="pb-8 pt-3">
      <p className="mb-3 flex flex-wrap items-center gap-1 text-[11px] text-muted">
        <Link to="/marketplace" className="hover:text-sea">Do‘kon</Link><ChevronRight className="size-3" />
        <Link to="/forma" className="hover:text-sea">Forma</Link><ChevronRight className="size-3" />
        <span className="text-ink">{product.title}</span>
      </p>

      <div className="forma-buy">
        <div className="min-w-0">
          <div className="grid items-start gap-3" style={{ gridTemplateColumns: '76px minmax(200px, 320px) minmax(0, 1fr)' }}>
            <div className="flex flex-col gap-2">
              {gallery.map((src, i) => (
                <button key={src + i} onClick={() => setShot(i)} className={`overflow-hidden rounded-lg border ${shot === i ? 'border-sea' : 'border-transparent'}`} style={{ height: 68 }}>
                  <img src={src} alt="" className="size-full object-cover object-top" />
                </button>
              ))}
            </div>
            <div className="overflow-hidden rounded-2xl bg-[#f4f7fb]" style={{ height: 360 }}>
              <img src={gallery[shot] || product.image} alt={product.title} className="size-full object-cover object-top" />
            </div>
            <div className="min-w-0">
              <h1 className="text-[22px] font-extrabold leading-tight text-ink">{product.title}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-ink-2">
                <Star className="size-3.5 fill-star text-star" /> {product.rating} <span className="text-muted">({product.reviews} sharh)</span>
                {product.sold ? <span className="text-muted">{product.sold} ta sotilgan</span> : null}
              </p>
              <div className="mt-2 flex items-end gap-2">
                <p className="text-[26px] font-extrabold text-ink">{money(product.price)}</p>
                {product.oldPrice ? <p className="mb-1 text-[13px] text-muted line-through">{money(product.oldPrice)}</p> : null}
                {product.off ? <span className="mb-1 rounded-md bg-sale/10 px-1.5 py-0.5 text-[12px] font-bold text-sale">-{product.off}%</span> : null}
              </div>
              <p className="mt-3 text-[12px] text-ink-2">Rang: <b className="text-ink">{colorOf(color).name}</b></p>
              <div className="mt-1.5 flex gap-1.5">
                {product.colors.map((c) => (
                  <button key={c} aria-label={colorOf(c).name} onClick={() => setColor(c)} className={`size-6 rounded-full border ${color === c ? 'ring-2 ring-sea ring-offset-2' : 'border-line'}`} style={{ background: colorOf(c).hex }} />
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-[12px] text-ink-2">O‘lcham: <b className="text-ink">{size}</b></p>
                <button onClick={() => setTab('size')} className="text-[11px] font-semibold text-sea">O‘lchamlar jadvali</button>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {product.sizes.map((s) => (
                  <button key={s} onClick={() => setSize(s)} className={`h-8 min-w-8 rounded-lg px-2 text-[11px] font-semibold ${size === s ? 'bg-sea text-white' : 'bg-[#f3f6fa] text-ink'}`}>{s}</button>
                ))}
              </div>
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
              <button onClick={() => { put(); navigate('/buyurtma', { state: { from: 'forma' } }) }} className="mt-2 h-10 w-full rounded-full border border-sea text-[13px] font-semibold text-sea hover:bg-sea-50">Hozir sotib olish</button>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {perks.map(([t, d], i) => {
                  const Icon = [ShieldCheck, Truck, CreditCard][i]
                  return (
                    <div key={t} className="rounded-xl bg-[#f6f9fc] p-2">
                      <Icon className="size-4 text-sea" />
                      <p className="mt-1 text-[10px] font-bold text-ink">{t}</p>
                      <p className="text-[9px] leading-snug text-muted">{d}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-1 border-b border-line">
            {[
              ['about', 'Tavsif'],
              ['specs', 'Xususiyatlar'],
              ['size', 'O‘lcham jadvali'],
              ['reviews', `Sharhlar (${product.reviews})`],
            ].map(([k, label]) => (
              <button key={k} onClick={() => setTab(k)} className={`h-9 px-3 text-[12px] font-semibold ${tab === k ? 'border-b-2 border-sea text-sea' : 'text-ink-2'}`}>{label}</button>
            ))}
          </div>

          {tab === 'about' && (
            <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_240px]">
              <div>
                <h3 className="text-[14px] font-bold">Mahsulot tavsifi</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-ink-2">{story}</p>
                <h3 className="mt-3 text-[14px] font-bold">Afzalliklar</h3>
                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {(product.perks || [['Qulay kiyim', 'Nafas oluvchi mato'], ['Klinikada mos', 'Oson yuviladi']]).flat().map((line) => (
                    <p key={line} className="flex items-start gap-1.5 text-[11.5px] text-ink-2"><span className="mt-1 size-1.5 shrink-0 rounded-full bg-sea" />{line}</p>
                  ))}
                </div>
              </div>
              <div className="rounded-xl bg-white p-3 shadow-card">
                <h3 className="text-[13px] font-bold">Mato tarkibi</h3>
                <img src="/images/forma/fabric.jpg" alt="" className="mt-2 w-full rounded-lg object-cover" style={{ height: 90 }} />
                <div className="mt-2 grid grid-cols-2 gap-y-1 text-[11px]">
                  {(product.cloth || [['Stretch mato', 'Nafas oluvchi'], [product.brand, 'Oson yuviladi']]).flat().filter(Boolean).map((line) => <p key={line} className="text-ink-2">{line}</p>)}
                </div>
              </div>
              <div className="rounded-xl bg-white p-3 shadow-card">
                <h3 className="text-[13px] font-bold">O‘lchamlar jadvali (sm)</h3>
                <table className="mt-2 w-full text-left text-[10px]">
                  <thead><tr className="text-muted"><th className="py-1 font-medium">O‘lcham</th><th>Ko‘krak (A)</th><th>Bel (B)</th><th>Bo‘y (C)</th></tr></thead>
                  <tbody>{sizeChart.map((r) => <tr key={r[0]} className="border-t border-line"><td className="py-1 font-semibold">{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td></tr>)}</tbody>
                </table>
              </div>
            </div>
          )}
          {tab === 'specs' && (
            <div className="mt-3 grid max-w-[520px] grid-cols-2 gap-y-2 rounded-xl bg-white p-4 text-[12px] shadow-card">
              {[['Brend', product.brand], ['Toifa', product.cat], ['Mato', product.fabric], ['Jins', product.gender], ['Reyting', product.rating]].map(([k, v]) => (
                <div key={k}><p className="text-muted">{k}</p><p className="font-semibold text-ink">{v}</p></div>
              ))}
            </div>
          )}
          {tab === 'size' && (
            <div className="mt-3 max-w-[480px] rounded-xl bg-white p-4 shadow-card">
              <h3 className="text-[14px] font-bold">O‘lchamlar jadvali (sm)</h3>
              <table className="mt-2 w-full text-left text-[12px]">
                <thead><tr className="text-muted"><th className="py-1">O‘lcham</th><th>Ko‘krak (A)</th><th>Bel (B)</th><th>Bo‘y (C)</th></tr></thead>
                <tbody>{sizeChart.map((r) => <tr key={r[0]} className={r[0] === size ? 'bg-sea-50 font-semibold' : ''}><td className="py-1.5">{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td></tr>)}</tbody>
              </table>
            </div>
          )}
          {tab === 'reviews' && (
            <div className="mt-3 flex max-w-[640px] flex-col gap-2">
              <p className="rounded-xl bg-white p-3 text-[12px] text-muted shadow-card">Hali sharhlar yo‘q</p>
            </div>
          )}

          <h2 className="mb-2 mt-6 text-[16px] font-bold">O‘xshash mahsulotlar</h2>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
            {similar.map((p) => (
              <Link key={p.id} to={`/forma/${p.id}`} className="rounded-xl bg-white p-2 shadow-card hover:ring-1 hover:ring-sea">
                <img src={p.image} alt="" className="w-full rounded-lg object-cover object-top" style={{ height: 88 }} />
                <p className="mt-1 text-[8px] font-bold uppercase text-sea">{p.brand}</p>
                <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-ink">{p.title}</p>
                <p className="text-[12px] font-extrabold">{money(p.price)}</p>
                <p className="flex items-center gap-1 text-[10px] text-muted"><Star className="size-3 fill-star text-star" /> {p.rating}</p>
              </Link>
            ))}
          </div>
        </div>

        <aside className="flex flex-col gap-3">
          <div className="rounded-xl bg-white p-3 shadow-card">
            <p className="text-[10px] text-muted">Sotuvchi</p>
            <p className="text-[14px] font-extrabold text-ink">{product.brand}</p>
            <p className="text-[11px] text-muted">Tibbiy forma va aksessuarlar</p>
            <p className="mt-1 flex items-center gap-1 text-[11px]"><Star className="size-3 fill-star text-star" /> 4.9 <span className="text-muted">(320 sharh)</span></p>
            <p className="text-[11px] text-muted">2 500+ mahsulot</p>
            <Link to={`/forma?brand=${encodeURIComponent(product.brand)}`} className="mt-2 flex h-8 items-center justify-center rounded-lg border border-sea text-[11px] font-semibold text-sea">Barcha mahsulotlar →</Link>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-card">
            <h3 className="text-[12px] font-bold">Yetkazib berish</h3>
            {shipping.map(([place, time]) => (
              <div key={place} className="mt-1.5 flex items-center justify-between text-[11px]"><span className="text-ink-2">{place}</span><span className="font-semibold text-ink">{time}</span></div>
            ))}
            <button onClick={() => setShip(true)} className="mt-2 text-[11px] font-semibold text-sea">Yetkazib berish haqida batafsil →</button>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-card">
            <h3 className="text-[12px] font-bold">Savollaringiz bormi?</h3>
            <p className="mt-1 text-[10px] text-muted">Mahsulot haqida mutaxassisdan maslahat oling.</p>
            <button onClick={() => setAsk(true)} className="mt-2 h-8 w-full rounded-lg bg-sea text-[11px] font-semibold text-white">Savol berish</button>
          </div>
        </aside>
      </div>

      {ask && <Note title="Savol berish" done="Savolingiz yuborildi. Tez orada javob beramiz." onClose={() => setAsk(false)} />}
      {ship && <Note title="Yetkazib berish" done="Toshkent bo‘ylab 1 kun, viloyatlarga 2–3 kun. 500 000 so‘mdan yuqori buyurtmada yetkazish bepul." onClose={() => setShip(false)} plain />}
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
            <textarea required placeholder="Savolingiz..." className="h-24 rounded-lg bg-page p-3 text-[12px] outline-none" />
            <button className="h-10 rounded-lg bg-sea text-[13px] font-semibold text-white">Yuborish</button>
          </form>
        )}
      </div>
    </div>
  )
}
