import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Heart, UserRound, Star, Eye, ShoppingCart, BookOpen, FileText, Globe, File, ChevronDown, ChevronRight, ListOrdered, MessageCircle, MoreHorizontal, Check, Truck,
} from 'lucide-react'
import { getBook, productOf, readerOf, langLong, money } from '../../booksData'
import { useCart } from '../../cart'
import { MobileToast } from './parts'
import MobileTabBar from './MobileTabBar'
import { BottomSheet } from './MobileSeminars'
import { HubTopBar } from './MobileKategoriyalar'
import { bookCartId, bookPrice, defaultFormat } from './MobileBooks'

const img = (n) => `/images/books/${n}.jpg`

export default function MobileBook() {
  const { id } = useParams()
  return <BookView key={id} id={id} />
}

const chapterNo = (title) => title.match(/^(\d+)-bob/)?.[1]
const chapterName = (title) => title.replace(/^\d+-bob\.\s*/, '')

function BookView({ id }) {
  const b = getBook(id)
  const navigate = useNavigate()
  const { items, add } = useCart()
  const [fmt, setFmt] = useState(() => (b ? defaultFormat(b) : 'print'))
  const [shot, setShot] = useState(0)
  const [liked, setLiked] = useState(false)
  const [more, setMore] = useState(false)
  const [sheet, setSheet] = useState(null)
  const [reviews, setReviews] = useState(() => (b ? productOf(b).reviews : []))
  const [toast, setToast] = useState('')
  const closeToast = useCallback(() => setToast(''), [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  if (!b) {
    return (
      <div className="grid min-h-screen place-items-center bg-white px-6 text-center">
        <div>
          <p className="text-[15px] font-semibold text-ink">Kitob topilmadi</p>
          <Link to="/kitoblar" className="mt-3 inline-block text-[13px] font-semibold text-sea">Kitoblarga qaytish</Link>
        </div>
      </div>
    )
  }

  const view = productOf(b)
  const doc = readerOf(b)
  const chapters = doc.chapters.map((ch, i) => ({ ...ch, pages: (doc.chapters[i + 1]?.page || doc.pages + 1) - ch.page }))
  const gallery = b.id === 'atlas' ? view.gallery : [b.cover, img('book-spread'), img('book-page')]
  const price = bookPrice(b, fmt)
  const cartId = bookCartId(b, fmt)
  const inCart = items.some((it) => it.id === cartId)
  const views = b.reviews * 67
  const subtitle = b.id === 'klinik' ? doc.subtitle : b.blurb

  const buy = () => {
    if (!inCart) add({ id: cartId, name: `${b.title} (${fmt === 'pdf' ? 'PDF' : 'bosma'})`, type: 'Kitob', price, image: b.cover })
    navigate('/buyurtma', { state: { from: 'market' } })
  }
  const toCart = () => {
    if (inCart) return navigate('/buyurtma', { state: { from: 'market' } })
    add({ id: cartId, name: `${b.title} (${fmt === 'pdf' ? 'PDF' : 'bosma'})`, type: 'Kitob', price, image: b.cover })
    setToast('Savatga qo‘shildi')
  }
  const read = (page) => navigate(`/kitoblar/${b.id}/oqish${page ? `?page=${page}` : ''}`)

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef8f7_0%,#f6faf9_30%)] pb-[86px]">
      <div className="px-3.5 pt-3">
        <HubTopBar onBell={() => setToast('Yangi bildirishnomalar yo‘q')} />
      </div>

      {/* Muqova va asosiy */}
      <div className="mt-3 grid grid-cols-[46%_1fr] gap-3 px-3.5">
        <div>
          <button type="button" onClick={() => setSheet('zoom')} aria-label="Kattalashtirish" className="block h-[236px] w-full overflow-hidden rounded-xl bg-[linear-gradient(160deg,#eef4f8,#dfe9ef)]">
            <img src={gallery[shot]} alt={b.title} className="size-full object-contain p-1.5 drop-shadow-[0_10px_14px_rgb(11_31_58/0.28)]" />
          </button>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {gallery.slice(0, 3).map((src, i) => (
              <button key={src + i} type="button" onClick={() => setShot(i)} aria-label={`Rasm ${i + 1}`} className={`h-[52px] overflow-hidden rounded-lg bg-[#eef4f8] ${i === shot ? 'ring-2 ring-sea' : 'ring-1 ring-line'}`}>
                <img src={src} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex items-start justify-between gap-1">
            <Link to="/kitoblar" className="rounded-full bg-[#dff3f0] px-2 py-0.5 text-[10.5px] font-semibold text-sea-600">Kitoblar</Link>
            <button type="button" onClick={() => { setLiked(!liked); if (!liked) setToast('Sevimlilarga qo‘shildi') }} aria-label="Sevimlilarga" aria-pressed={liked} className="grid size-9 shrink-0 place-items-center rounded-full bg-white shadow-[0_1px_4px_rgb(11_31_58/0.12)]">
              <Heart className={`size-[18px] ${liked ? 'fill-sale text-sale' : 'text-ink'}`} />
            </button>
          </div>
          <h1 className="mt-1 text-[19px] font-extrabold leading-[1.15] tracking-tight text-[#0d3b3f]">{b.title}</h1>
          <p className="mt-1 line-clamp-2 text-[11.5px] leading-snug text-muted">{subtitle}</p>
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-ink-2"><UserRound className="size-3.5 shrink-0" /> <span className="truncate">{b.author}</span></p>
          <p className="mt-1.5 flex items-center gap-1 text-[11.5px] text-ink-2">
            <Star className="size-3.5 fill-star text-star" /> <b className="font-semibold text-ink">{b.rating}</b>
            <button type="button" onClick={() => setSheet('reviews')} className="text-muted">({reviews.length + b.reviews - 2} ta sharh)</button>
            <span className="mx-1 h-3 w-px bg-line" />
            <Eye className="size-3.5 text-muted" /> <span className="text-muted">{(views / 1000).toFixed(1)}K</span>
          </p>
          {b.formats.length > 1 && (
            <div className="mt-2 grid grid-cols-2 rounded-lg bg-[#e8f1f2] p-0.5">
              {[['print', 'Bosma'], ['pdf', 'PDF']].map(([k, l]) => (
                <button key={k} type="button" aria-pressed={fmt === k} onClick={() => setFmt(k)} className={`h-7 rounded-md text-[11.5px] font-semibold transition ${fmt === k ? 'bg-white text-sea shadow-[0_1px_2px_rgb(11_31_58/0.1)]' : 'text-ink-2'}`}>{l}</button>
              ))}
            </div>
          )}
          <p className="mt-2 whitespace-nowrap text-[22px] font-extrabold tracking-tight text-[#0b6d73]">{money(price)}</p>
          <button type="button" onClick={buy} className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0b6d73] text-[14px] font-semibold text-white active:scale-[0.98]">
            <ShoppingCart className="size-[18px]" /> Sotib olish
          </button>
          <div className="mt-2 flex gap-1.5">
            <button type="button" onClick={() => read()} className="flex h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#0b6d73]/50 bg-white px-1.5 text-left text-[12px] font-semibold leading-tight text-[#0b6d73]">
              <BookOpen className="size-[18px] shrink-0" /> <span>O‘qib ko‘rish<span className="block text-[10px] font-medium text-muted">(Namuna)</span></span>
            </button>
            <button type="button" onClick={toCart} aria-label={inCart ? 'Savatda' : 'Savatga qo‘shish'} className={`grid size-11 shrink-0 place-items-center rounded-xl border ${inCart ? 'border-sea bg-sea-50 text-sea' : 'border-[#0b6d73]/50 bg-white text-[#0b6d73]'}`}>
              {inCart ? <Check className="size-[18px]" /> : <ShoppingCart className="size-[18px]" />}
            </button>
          </div>
        </div>
      </div>

      {/* Ma'lumot qatori */}
      <div className="mx-3.5 mt-3 grid grid-cols-4 divide-x divide-line rounded-2xl bg-white py-2.5 shadow-[0_1px_4px_rgb(11_31_58/0.05)]">
        {[
          [BookOpen, 'Sahifalar', `${b.pages} bet`],
          [FileText, 'Format', fmt === 'pdf' ? 'A4, rangli' : view.binding],
          [Globe, 'Til', langLong[b.lang]],
          fmt === 'pdf' ? [File, 'Fayl turi', 'PDF (darhol)'] : [Truck, 'Yetkazish', '1–2 kun'],
        ].map(([Icon, k, v]) => (
          <div key={k} className="flex min-w-0 items-center gap-1.5 px-1.5">
            <Icon className="size-[18px] shrink-0 text-[#0b6d73]" strokeWidth={1.6} />
            <span className="min-w-0">
              <span className="block truncate text-[9.5px] text-muted">{k}</span>
              <span className="block text-[10.5px] font-semibold leading-tight text-ink">{v}</span>
            </span>
          </div>
        ))}
      </div>

      {/* Tavsif */}
      <Card icon={FileText} title="Tavsif">
        <p className={`text-[12.5px] leading-[1.55] text-ink-2 ${more ? '' : 'line-clamp-3'}`}>{view.about}{more && <><br /><br />{view.more}<br /><span className="mt-1 block text-[11.5px] text-muted">ISBN: {b.isbn} · {b.year}-yil</span></>}</p>
        <button type="button" onClick={() => setMore(!more)} className="mt-1 flex items-center gap-0.5 text-[12px] font-semibold text-[#0b6d73]">
          {more ? 'Yopish' : 'Batafsil'} <ChevronDown className={`size-4 transition ${more ? 'rotate-180' : ''}`} />
        </button>
      </Card>

      {/* Mundarija */}
      <Card icon={ListOrdered} title="Mundarija" action={<button type="button" onClick={() => setSheet('toc')} className="flex items-center gap-0.5 text-[12px] font-semibold text-[#0b6d73]">Barcha boblar ({chapters.length}) <ChevronRight className="size-4" /></button>}>
        <ChapterList chapters={chapters.slice(0, 5)} onOpen={read} />
      </Card>

      {/* Sharhlar */}
      <Card icon={MessageCircle} title={`Sharhlar (${reviews.length + b.reviews - 2})`} action={<button type="button" onClick={() => setSheet('reviews')} className="text-[12px] font-semibold text-[#0b6d73]">Barchasini ko‘rish</button>}>
        <Review r={reviews[0]} onMore={() => setSheet('reviews')} />
      </Card>

      {view.similar.length > 0 && (
        <>
          <h2 className="mt-4 px-3.5 text-[16px] font-bold text-[#0d2a4a]">O‘xshash kitoblar</h2>
          <div className="mt-2 flex gap-2.5 overflow-x-auto px-3.5 pb-1 no-scrollbar">
            {view.similar.map((x) => (
              <Link key={x.id} to={`/kitoblar/${x.id}`} className="w-[118px] shrink-0">
                <span className="block h-[150px] overflow-hidden rounded-xl bg-[linear-gradient(160deg,#eef4f8,#dfe9ef)]">
                  <img src={x.cover} alt="" className="size-full object-contain p-2 drop-shadow-[0_6px_8px_rgb(11_31_58/0.2)]" />
                </span>
                <span className="mt-1.5 line-clamp-2 block text-[11.5px] font-bold leading-snug text-ink">{x.title}</span>
                <span className="mt-0.5 block text-[12px] font-extrabold text-[#0b6d73]">{money(x.price)}</span>
              </Link>
            ))}
          </div>
        </>
      )}

      {sheet === 'toc' && (
        <BottomSheet title={`Mundarija · ${chapters.length} bob`} onClose={() => setSheet(null)}>
          <ChapterList chapters={chapters} onOpen={read} />
        </BottomSheet>
      )}
      {sheet === 'reviews' && (
        <ReviewsSheet
          reviews={reviews}
          onClose={() => setSheet(null)}
          onAdd={(r) => { setReviews((l) => [r, ...l]); setToast('Sharhingiz qo‘shildi') }}
        />
      )}
      {sheet === 'zoom' && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/85 p-6" onClick={() => setSheet(null)}>
          <img src={gallery[shot]} alt={b.title} className="max-h-full max-w-full rounded-lg object-contain" />
        </div>
      )}

      <MobileToast text={toast} onClose={closeToast} />
      <MobileTabBar />
    </div>
  )
}

function Card({ icon: Icon, title, action, children }) {
  return (
    <section className="mx-3.5 mt-3 rounded-2xl bg-white p-3.5 shadow-[0_1px_4px_rgb(11_31_58/0.05)]">
      <div className="mb-2.5 flex items-center gap-2.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#e6f4f3] text-[#0b6d73]"><Icon className="size-[19px]" strokeWidth={1.7} /></span>
        <h2 className="flex-1 text-[16px] font-bold text-[#0d3b3f]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function ChapterList({ chapters, onOpen }) {
  return (
    <div className="flex flex-col">
      {chapters.map((ch) => (
        <button key={ch.id} type="button" onClick={() => onOpen(ch.children?.[0]?.page || ch.page)} className="flex h-[42px] items-center gap-2.5 border-b border-line/70 text-left last:border-0">
          <span className="w-[50px] shrink-0 rounded-full bg-[#e6f4f3] py-0.5 text-center text-[10.5px] font-semibold text-[#0b6d73]">{chapterNo(ch.title) ? `${chapterNo(ch.title)}-bob` : 'Bob'}</span>
          <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink">{chapterName(ch.title)}</span>
          <span className="shrink-0 text-[11px] text-muted">{ch.pages} bet</span>
          <ChevronRight className="size-4 shrink-0 text-muted" />
        </button>
      ))}
    </div>
  )
}

function Review({ r, onMore }) {
  if (!r) return <p className="text-[12px] text-muted">Hali sharh yo‘q</p>
  return (
    <div className="flex gap-3">
      {r.photo ? <img src={r.photo} alt="" className="size-12 shrink-0 rounded-full object-cover" /> : <span className="grid size-12 shrink-0 place-items-center rounded-full bg-sea-50 text-[15px] font-bold text-sea">{r.name.replace('Dr. ', '')[0]}</span>}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className="truncate text-[13.5px] font-bold text-ink">{r.name}</p>
          {onMore && <button type="button" onClick={onMore} aria-label="Barcha sharhlar" className="text-muted"><MoreHorizontal className="size-5" /></button>}
        </div>
        <p className="flex items-center gap-1.5">
          <span className="flex">{[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`size-3.5 ${i <= r.stars ? 'fill-star text-star' : 'text-line'}`} />)}</span>
          <span className="text-[11px] text-muted">{r.date}</span>
        </p>
        <p className="mt-1 text-[12px] leading-snug text-ink-2">{r.text}</p>
      </div>
    </div>
  )
}

function ReviewsSheet({ reviews, onClose, onAdd }) {
  const [stars, setStars] = useState(5)
  const [text, setText] = useState('')
  const submit = () => {
    onAdd({ name: 'Dr. Ibrohim', role: 'Stomatolog', date: 'Bugun', stars, text: text.trim() })
    setText('')
  }
  return (
    <BottomSheet title="Sharhlar" onClose={onClose}>
      <div className="mt-2 rounded-2xl border border-line p-3">
        <p className="text-[13px] font-semibold text-ink">Sharh qoldiring</p>
        <div className="mt-1.5 flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <button key={i} type="button" onClick={() => setStars(i)} aria-label={`${i} yulduz`}><Star className={`size-6 ${i <= stars ? 'fill-star text-star' : 'text-line'}`} /></button>
          ))}
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Kitob haqida fikringiz..." className="mt-2 w-full resize-none rounded-xl border border-line px-3 py-2 text-[13px] outline-none focus:border-sea" />
        <button type="button" disabled={text.trim().length < 3} onClick={submit} className="mt-2 h-10 w-full rounded-xl bg-sea text-[13px] font-semibold text-white disabled:opacity-40">Yuborish</button>
      </div>
      <div className="mt-3 flex flex-col gap-4 pb-2">
        {reviews.map((r, i) => <Review key={r.name + r.date + i} r={r} />)}
      </div>
    </BottomSheet>
  )
}
