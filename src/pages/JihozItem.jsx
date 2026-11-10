import { useState } from 'react'
import { goBuyNow } from '../checkoutUtils'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Star, Heart, ShoppingCart, ChevronRight, BadgeCheck, Truck, Check, Send, Phone, Wrench } from 'lucide-react'
import { useCart } from '../cart'
import { getJihoz, allJihoz, money, catName, specsOf } from '../jihozData'
import { useMarket } from '../buyerApi'
import { useSellerContact } from '../lib/useSellerContact'
import { telegramChatUrl, openExternal } from '../ustaContact'
import { jihozCartLine, jihozQuestionText } from '../lib/jihozLive'

export default function JihozItem() {
  const { id } = useParams()
  useMarket() // sotuvchi jihozlari (0065) market_products bilan keladi
  const product = getJihoz(id)
  const contact = useSellerContact(product?.live ? product.sellerId : null)
  const [shot, setShot] = useState(0)
  const [tab, setTab] = useState('about')
  const [saved, setSaved] = useState(false)
  const { add, items } = useCart()
  const navigate = useNavigate()

  if (!product) {
    return <div className="py-16 text-center text-[14px] text-muted">Jihoz topilmadi. <Link to="/jihozlar" className="text-sea">Jihozlarga qaytish</Link></div>
  }

  const gallery = product.gallery?.length ? product.gallery : [product.image]
  const inCart = items.some((it) => it.id === product.id)
  // Faqat sotuvchi qo‘shgan (haqiqiy) jihozni sotib olish mumkin — oddiy checkout orqali
  const line = jihozCartLine(product)
  const inStock = !!line && product.stock > 0
  const put = () => { if (!inCart && inStock) add(line, 1) }
  const similar = allJihoz().filter((p) => p.cat === product.cat && p.id !== product.id).slice(0, 8)
  const points = [product.install ? 'O‘rnatish narxga kiradi' : '', product.lizing ? 'Bo‘lib to‘lash mumkin — shartlarni sotuvchidan so‘rang' : '', ...(product.points || [])].filter(Boolean)
  const specs = specsOf(product)
  const canAsk = !!(contact?.telegram || contact?.phone)
  const ask = (topic = '') => {
    if (contact?.telegram) openExternal(telegramChatUrl(contact.telegram, jihozQuestionText({ p: product, topic, url: window.location.href })))
    else if (contact?.phone) window.location.href = `tel:${contact.phone}`
  }

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
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap gap-1.5">
                <span className="rounded-md bg-sea px-1.5 py-0.5 text-[10px] font-bold text-white">Yangi</span>
                {product.official ? <span className="rounded-md bg-sea-50 px-1.5 py-0.5 text-[10px] font-semibold text-sea">Rasmiy distribyutor</span> : null}
                {product.warranty ? <span className="rounded-md bg-[#eef2f6] px-1.5 py-0.5 text-[10px] font-semibold text-ink-2">{product.warranty >= 12 && product.warranty % 12 === 0 ? `${product.warranty / 12} yil kafolat` : `${product.warranty} oy kafolat`}</span> : null}
              </div>
              <h1 className="mt-1.5 text-[22px] font-extrabold leading-tight text-ink">{product.title}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-ink-2">
                <span className="font-semibold text-ink">{product.brand}</span>
                {product.model ? <span className="text-muted">Model: {product.model}</span> : null}
                {Number(product.reviews) > 0 ? <><Star className="size-3.5 fill-star text-star" /> {product.rating} <span className="text-muted">({product.reviews} sharh)</span></> : <span className="text-muted">Hali baho yo‘q</span>}
              </p>
              <p className="mt-2 text-[26px] font-extrabold leading-none text-ink">{money(product.price)}</p>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-2">
                {inStock ? <span className="inline-flex items-center gap-1 text-ok"><Check className="size-3.5" /> Omborda bor ({product.stock} dona)</span> : <span className="text-sale">Omborda yo‘q</span>}
                {product.city ? <span className="inline-flex items-center gap-1"><Truck className="size-3.5 text-sea" /> {product.city}</span> : null}
                {product.install ? <span className="inline-flex items-center gap-1"><Wrench className="size-3.5 text-sea" /> O‘rnatish narxga kiradi</span> : null}
              </p>
              {product.lizing && canAsk ? (
                <button onClick={() => ask('Bo‘lib to‘lash shartlari qanday?')} className="mt-2 flex w-full items-center justify-between rounded-xl border border-line px-3 py-2 text-left hover:border-sea">
                  <span>
                    <span className="block text-[11px] font-bold text-ink">Bo‘lib to‘lash mumkin</span>
                    <span className="text-[12px] text-ink-2">Shartlarni sotuvchidan so‘rang</span>
                  </span>
                  <ChevronRight className="size-4 text-muted" />
                </button>
              ) : null}
              <div className="mt-3 flex items-center gap-2">
                <button onClick={put} disabled={!inStock} className={`flex h-10 flex-1 disabled:opacity-40 items-center justify-center gap-2 rounded-full text-[13px] font-semibold text-white ${inCart ? 'bg-[#1f8f4e]' : 'bg-sea hover:bg-sea-600'}`}>
                  <ShoppingCart className="size-4" /> {inCart ? 'Savatda' : 'Savatga qo‘shish'}
                </button>
                <button aria-label="Saqlash" onClick={() => setSaved((v) => !v)} className="grid size-10 place-items-center rounded-full border border-line bg-white">
                  <Heart className={`size-4 ${saved ? 'fill-sale text-sale' : 'text-ink-2'}`} />
                </button>
              </div>
              <button disabled={!inStock} onClick={() => goBuyNow(navigate, line, 1, 'jihoz')} className="mt-2 h-10 w-full rounded-full bg-sea text-[13px] font-semibold text-white hover:bg-sea-600 disabled:opacity-40">Hozir sotib olish</button>
              {canAsk ? (
                <button onClick={() => ask()} className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-full border border-sea text-[13px] font-semibold text-sea hover:bg-sea-50">{contact?.telegram ? <><Send className="size-4" /> Sotuvchiga yozish (Telegram)</> : <><Phone className="size-4" /> Sotuvchiga qo‘ng‘iroq</>}</button>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex gap-1 overflow-x-auto border-b border-line no-scrollbar">
            {[
              ['about', 'Tavsif'],
              ['specs', 'Texnik xususiyatlar'],
              product.deliveryInfo ? ['ship', 'Yetkazib berish'] : null,
              ['reviews', `Sharhlar (${product.reviews})`],
            ].filter(Boolean).map(([k, label]) => (
              <button key={k} onClick={() => setTab(k)} className={`h-9 shrink-0 px-2.5 text-[12px] font-semibold ${tab === k ? 'border-b-2 border-sea text-sea' : 'text-ink-2'}`}>{label}</button>
            ))}
          </div>

          {tab === 'about' && (
            <div className="jihoz-about mt-3">
              <div>
                <h3 className="text-[14px] font-bold">Mahsulot tavsifi</h3>
                <p className="mt-1 whitespace-pre-line text-[12px] leading-relaxed text-ink-2">{product.story || 'Sotuvchi tavsif qo‘shmagan.'}</p>
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
            </div>
          )}
          {tab === 'specs' && <SpecList rows={specs} />}
          {tab === 'ship' && <p className="mt-3 max-w-[520px] whitespace-pre-line rounded-xl bg-white p-4 text-[12px] leading-relaxed text-ink-2 shadow-card">{product.deliveryInfo}</p>}
          {tab === 'reviews' && (
            <div className="mt-3 flex max-w-[640px] flex-col gap-2">
              <p className="rounded-xl bg-white p-3 text-[12px] text-muted shadow-card">Hali sharhlar yo‘q</p>
            </div>
          )}

          {similar.length > 0 && <div className="mb-2 mt-6 flex items-center justify-between">
            <h2 className="text-[16px] font-bold">O‘xshash mahsulotlar</h2>
            <Link to={`/jihozlar?cat=${product.cat}`} className="text-[12px] font-semibold text-sea">Barchasini ko‘rish</Link>
          </div>}
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {similar.map((p) => (
              <Link key={p.id} to={`/jihozlar/${p.id}`} className="min-w-0 rounded-xl bg-white p-2 shadow-card hover:ring-1 hover:ring-sea">
                <img src={p.image} alt="" className="w-full rounded-lg object-cover" style={{ height: 88 }} />
                <p className="mt-1 text-[9px] font-bold uppercase text-sea">{p.brand}</p>
                <p className="line-clamp-2 text-[12px] font-semibold leading-tight">{p.title}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted">{Number(p.reviews) > 0 ? <><Star className="size-3 fill-star text-star" /> {p.rating} <span>({p.reviews})</span></> : 'Hali baho yo‘q'}</p>
                <p className="text-[13px] font-extrabold">{money(p.price)}</p>
              </Link>
            ))}
          </div>
        </div>

        <aside className="flex flex-col gap-3">
          <div className="rounded-xl bg-white p-3 shadow-card">
            <p className="text-[10px] text-muted">Sotuvchi</p>
            <p className="text-[14px] font-extrabold text-ink">{product.seller || 'Sotuvchi'}</p>
            <p className="inline-flex items-center gap-1 text-[11px] text-sea"><BadgeCheck className="size-3.5" /> Tekshirilgan sotuvchi</p>
            {product.sellerId ? <Link to={`/dokon/${product.sellerId}`} className="mt-2 flex h-8 items-center justify-center rounded-lg bg-sea text-[11px] font-semibold text-white">Do‘konni ko‘rish</Link> : null}
          </div>
        </aside>
      </div>
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
