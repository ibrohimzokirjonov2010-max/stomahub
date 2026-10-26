import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BookOpen, ChevronRight, CreditCard, Headset, Heart, Share2, ShieldCheck, ShoppingCart, Star, Truck, ZoomIn, X } from 'lucide-react'
import { useCart } from '../cart'
import { getBook, langLong, money, productOf, pubName } from '../booksData'

export default function Book() {
  const { id } = useParams()
  const book = getBook(id)
  const [shot, setShot] = useState(0)
  const [format, setFormat] = useState('print')
  const [tab, setTab] = useState('about')
  const [more, setMore] = useState(false)
  const [saved, setSaved] = useState(false)
  const [shared, setShared] = useState(false)
  const [zoom, setZoom] = useState(false)
  const [bought, setBought] = useState(false)
  const { add, items } = useCart()

  if (!book) return <div className="py-16 text-center text-[14px] text-muted">Kitob topilmadi. <Link to="/kitoblar" className="text-sea">Kitoblar</Link></div>

  const view = productOf(book)
  const price = format === 'pdf' ? view.pdf : book.price
  const cartId = `${book.id}-${format}`
  const inCart = items.some((it) => it.id === cartId)
  const put = () => { if (!inCart) add({ id: cartId, name: book.title, type: 'Kitob', price, image: book.cover }) }
  const share = async () => {
    try { await navigator.clipboard.writeText(window.location.href) } catch { /* clipboard */ }
    setShared(true)
  }

  return (
    <div className="pb-8 pt-3">
      <p className="mb-3 flex flex-wrap items-center gap-1 text-[11px] text-muted">
        <Link to="/marketplace" className="hover:text-sea">Do‘kon</Link><span>›</span>
        <Link to="/kitoblar" className="hover:text-sea">Kitoblar</Link><span>›</span>
        <span>Stomatologiya</span><span>›</span>
        <span className="text-ink-2">{book.title}</span>
      </p>

      <div className="book-page">
        <div className="book-gallery">
          <div className="relative overflow-hidden rounded-2xl bg-[#eef6f6]">
            <img src={view.gallery[shot] || book.cover} alt="" className="mx-auto h-[250px] w-full object-contain" />
            <button onClick={() => setZoom(true)} className="absolute bottom-2 right-2 grid size-7 place-items-center rounded-full bg-white shadow-card" aria-label="Kattalashtirish"><ZoomIn className="size-3.5" /></button>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {view.gallery.slice(0, 4).map((src, i) => (
              <button key={src + i} onClick={() => setShot(i)} className={`relative h-14 overflow-hidden rounded-lg bg-[#eef6f6] ${shot === i ? 'ring-2 ring-sea' : ''}`}>
                <img src={src} alt="" className="size-full object-cover" />
                {i === 3 && view.gallery.length > 3 && <span className="absolute inset-0 grid place-items-center bg-black/45 text-[12px] font-bold text-white">+2</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="book-info min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span className="rounded-full bg-sea-50 px-2 py-0.5 text-[10px] font-semibold text-sea">{view.category}</span>
            <span className="flex gap-1">
              <button onClick={() => setSaved((v) => !v)} className="grid size-7 place-items-center rounded-full bg-white shadow-card" aria-label="Saqlash"><Heart className={`size-3.5 ${saved ? 'fill-sale text-sale' : ''}`} /></button>
              <button onClick={share} className="grid size-7 place-items-center rounded-full bg-white shadow-card" aria-label="Ulashish"><Share2 className="size-3.5" /></button>
            </span>
          </div>
          <h1 className="mt-2 text-[22px] font-extrabold leading-tight text-ink">{book.title}</h1>
          <p className="mt-1 text-[12px] text-muted">Muallif: {book.author}</p>
          <p className="mt-1 flex items-center gap-1 text-[12px]"><Stars n={5} /> <span className="font-bold">{book.rating}</span> <button onClick={() => setTab('reviews')} className="text-muted">({book.reviews} ta sharh)</button></p>
          <p className="mt-2 text-[22px] font-extrabold text-ink">{money(price)}</p>
          <p className="mt-3 text-[12px] font-bold">Formatni tanlang</p>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            <Format on={format === 'print'} onClick={() => setFormat('print')} icon={BookOpen} title="Qog‘oz nashr" price={money(book.price)} />
            <Format on={format === 'pdf'} onClick={() => setFormat('pdf')} icon={BookOpen} title="Elektron nashr (PDF)" price={money(view.pdf)} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to={`/kitoblar/${book.id}/oqish`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#d7e3ea] bg-white px-3 text-[12px] font-semibold text-ink"><BookOpen className="size-3.5 text-sea" /> O‘qib ko‘rish (1-bob)</Link>
            <button onClick={put} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-sea px-3 text-[12px] font-semibold text-sea"><ShoppingCart className="size-3.5" /> {inCart ? 'Savatda' : 'Savatga qo‘shish'}</button>
            <button onClick={() => { put(); setBought(true) }} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-sea px-3 text-[12px] font-semibold text-white">{bought ? 'Qabul qilindi' : 'Sotib olish'}</button>
          </div>
          {shared && <p className="mt-1 text-[11px] text-sea">Havola nusxalandi</p>}
          <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-ink-2 lg:grid-cols-4">
            <Perk icon={Truck} title="Tez yetkazib berish" sub="Toshkent 1–2 kun" />
            <Perk icon={ShieldCheck} title="Original mahsulot" sub="Rasmiy nashr" />
            <Perk icon={CreditCard} title="Qulay to‘lov" sub="Click, Payme, Uzum" />
            <Perk icon={Headset} title="Qo‘llab-quvvatlash" sub="Savollar bo‘yicha yordam" />
          </div>
        </div>

        <aside className="book-facts rounded-xl border border-[#e6eef3] bg-white p-3">
          <p className="text-[13px] font-bold">Kitob ma’lumotlari</p>
          <Fact k="Sahifalar" v={`${book.pages} sahifa`} />
          <Fact k="Til" v={langLong[book.lang]} />
          <Fact k="Nashriyot" v={pubName[book.publisher]} />
          <Fact k="Nashr yili" v={book.year} />
          <Fact k="ISBN" v={book.isbn} />
          <Fact k="Muqova" v={view.binding} />
        </aside>

        <div className="book-body min-w-0">
          <div className="flex gap-4 border-b border-[#e6eef3] text-[13px]">
            {[['about', 'Tavsif'], ['toc', 'Mundarija'], ['reviews', `Sharhlar (${book.reviews})`]].map(([k, label]) => (
              <button key={k} onClick={() => setTab(k)} className={`-mb-px border-b-2 pb-2 ${tab === k ? 'border-sea font-semibold text-sea' : 'border-transparent text-muted'}`}>{label}</button>
            ))}
          </div>
          {tab === 'about' && (
            <div className="pt-3">
              <p className="text-[13px] font-bold">Tavsif</p>
              <p className="mt-1 text-[12px] leading-relaxed text-ink-2">{view.about}</p>
              {more && <p className="mt-1 text-[12px] leading-relaxed text-ink-2">{view.more}</p>}
              <button onClick={() => setMore((v) => !v)} className="mt-1 text-[12px] font-semibold text-sea">{more ? 'Yig‘ish' : 'Ko‘proq o‘qish'} ›</button>
              <p className="mt-4 text-[13px] font-bold">Mundarija</p>
              <div className="mt-2 grid gap-1 sm:grid-cols-2">
                {view.toc.map((row, i) => <p key={row} className="flex items-center justify-between border-b border-[#f0f4f8] py-1.5 text-[12px] text-ink-2"><span>{i + 1}. {row}</span><ChevronRight className="size-3.5 text-muted" /></p>)}
              </div>
            </div>
          )}
          {tab === 'toc' && (
            <div className="grid gap-1 pt-3">
              {view.toc.map((row, i) => <Link key={row} to={`/kitoblar/${book.id}/oqish`} className="flex items-center justify-between rounded-lg px-1 py-1.5 text-[12px] hover:bg-[#f4fbfb]"><span>{i + 1}. {row}</span><ChevronRight className="size-3.5 text-muted" /></Link>)}
            </div>
          )}
          {tab === 'reviews' && <ReviewList rows={view.reviews} />}
        </div>

        <aside className="book-reviews rounded-xl border border-[#e6eef3] bg-white p-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-bold">Sharhlar</p>
            <button onClick={() => setTab('reviews')} className="text-[10px] font-semibold text-sea">Barchasini ko‘rish</button>
          </div>
          <ReviewList rows={view.reviews} />
        </aside>

        <div className="book-similar">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[14px] font-bold">O‘xshash kitoblar</p>
            <Link to="/kitoblar" className="text-[11px] font-semibold text-sea">Barchasini ko‘rish</Link>
          </div>
          <div className="book-related">
            {view.similar.map((b) => (
              <Link key={b.id} to={`/kitoblar/${b.id}`} className="min-w-0 rounded-xl bg-white p-2 shadow-card">
                <img src={b.cover} alt="" className="mx-auto h-[92px] object-contain" />
                <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-snug">{b.title}</p>
                <p className="truncate text-[10px] text-muted">{b.author}</p>
                <p className="mt-1 text-[12px] font-extrabold">{money(b.price)}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {zoom && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-6" onClick={() => setZoom(false)}>
          <button className="absolute right-4 top-4 text-white" aria-label="Yopish"><X /></button>
          <img src={view.gallery[shot] || book.cover} alt="" className="max-h-[80vh] max-w-full object-contain" />
        </div>
      )}
    </div>
  )
}

function Format({ on, onClick, icon: Icon, title, price }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 rounded-xl border p-2 text-left ${on ? 'border-sea bg-[#f3fbfb]' : 'border-[#e6eef3] bg-white'}`}>
      <Icon className="size-4 shrink-0 text-sea" />
      <span><span className="block text-[11px] font-semibold">{title}</span><span className="block text-[12px] font-extrabold">{price}</span></span>
    </button>
  )
}

function Perk({ icon: Icon, title, sub }) {
  return <p className="flex items-start gap-1.5"><Icon className="mt-0.5 size-3.5 shrink-0 text-sea" /><span><span className="block font-semibold text-ink">{title}</span><span className="text-muted">{sub}</span></span></p>
}

function Fact({ k, v }) {
  return <div className="mt-2 flex items-center justify-between gap-2 text-[11px]"><span className="text-muted">{k}</span><span className="text-right font-semibold">{v}</span></div>
}

function Stars({ n }) {
  return <span className="inline-flex">{Array.from({ length: 5 }, (_, i) => <Star key={i} className={`size-3 ${i < n ? 'fill-star text-star' : 'text-[#d5dde6]'}`} />)}</span>
}

function ReviewList({ rows }) {
  return (
    <div className="mt-2 grid gap-3">
      {rows.map((r) => (
        <div key={r.name + r.date} className="flex gap-2">
          <img src={r.photo} alt="" className="size-8 rounded-full object-cover" />
          <div className="min-w-0">
            <p className="text-[12px] font-bold">{r.name}</p>
            <p className="text-[10px] text-muted">{r.role}</p>
            <p className="mt-0.5 flex items-center gap-2 text-[10px]"><Stars n={r.stars} /> <span className="text-muted">{r.date}</span></p>
            <p className="mt-1 text-[11px] leading-snug text-ink-2">{r.text}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
