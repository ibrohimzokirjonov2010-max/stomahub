import { useCallback, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal, LayoutGrid, BookOpen, FileText, ChevronDown, Heart, Star, ShoppingCart, X, Check, Scissors, Bone, Library, Sparkles, Crown } from 'lucide-react'
import { books, shelf, langOptions, publisherOptions, sorts, money, productOf } from '../../booksData'
import { useCart } from '../../cart'
import { useCatalogVersion } from '../../recordSync'
import { MobileTopBar, MobileToast, QtyStepper, GoCartButton } from './parts'
import MobileTabBar from './MobileTabBar'
import { BottomSheet, ToothIcon } from './MobileSeminars'

export const allBooks = () => [...books, ...shelf.filter((b) => b.id === 'klinik')]

const CATS = [
  ['all', 'Barchasi', LayoutGrid],
  ['endo', 'Endodontiya', ToothIcon],
  ['impl', 'Implantologiya', ImplantIcon],
  ['orto', 'Ortodontiya', BracesIcon],
  ['surgery', 'Jarrohlik', Scissors],
  ['terapiya', 'Terapiya', Sparkles],
  ['ortoped', 'Ortopediya', Crown],
  ['anatomy', 'Anatomiya', Bone],
  ['atlas', 'Atlaslar', Library],
]
const SORT_FN = {
  popular: (a, b) => b.reviews - a.reviews,
  rating: (a, b) => b.rating - a.rating,
  cheap: (a, b) => a.price - b.price,
  rich: (a, b) => b.price - a.price,
  fresh: (a, b) => b.year - a.year,
}
const SORT_SHORT = { popular: 'Mashhurligi', rating: 'Reyting', cheap: 'Arzonroq', rich: 'Qimmatroq', fresh: 'Yangilari' }
const PRICES = [['200000', '200 000 gacha'], ['400000', '400 000 gacha'], ['600000', '600 000 gacha']]
const EMPTY = { langs: [], pubs: [], price: '', stock: '' }

export const bookPrice = (b, fmt) => (fmt === 'pdf' && b.formats.includes('print') && b.price != null ? productOf(b).pdf : b.price)
export const bookCartId = (b, fmt) => `${b.id}-${fmt}`
export const defaultFormat = (b) => (b.formats.includes('print') ? 'print' : 'pdf')

export function bookBadge(b) {
  if (b.off) return [`-${b.off}%`, 'bg-sale']
  if (b.badge === 'best') return ['Bestseller', 'bg-[#f59e0b]']
  if (b.badge === 'new' || b.year >= 2021) return ['Yangi', 'bg-[#22b573]']
  return null
}

export default function MobileBooks() {
  const navigate = useNavigate()
  const catalogV = useCatalogVersion()
  const { items, add, setQty, remove } = useCart()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [fmt, setFmt] = useState('')
  const [sort, setSort] = useState('popular')
  const [filter, setFilter] = useState(EMPTY)
  const [sheet, setSheet] = useState(false)
  const [liked, setLiked] = useState(() => new Set())
  const [toast, setToast] = useState('')
  const closeToast = useCallback(() => setToast(''), [])
  const searchRef = useRef(null)

  const matches = useCallback((b, f) =>
    (!f.langs.length || f.langs.includes(b.lang)) &&
    (!f.pubs.length || f.pubs.includes(b.publisher)) &&
    (!f.price || b.price <= Number(f.price)) &&
    (!f.stock || b.stock === f.stock), [])

  const base = useMemo(() => {
    const s = q.trim().toLowerCase()
    return allBooks()
      .filter((b) => cat === 'all' || b.cats.includes(cat))
      .filter((b) => !fmt || b.formats.includes(fmt))
      .filter((b) => !s || `${b.title} ${b.author} ${b.isbn}`.toLowerCase().includes(s))
  }, [q, cat, fmt, catalogV])
  const list = useMemo(() => base.filter((b) => matches(b, filter)).sort(SORT_FN[sort]), [base, filter, sort, matches])
  const active = filter.langs.length + filter.pubs.length + (filter.price ? 1 : 0) + (filter.stock ? 1 : 0)

  const qtyOf = (id) => items.find((it) => it.id === id)?.qty || 0
  const put = (b, f) => {
    if (b.price == null) { navigate(`/kitoblar/${b.id}`); return }
    add({ id: bookCartId(b, f), name: `${b.title} (${f === 'pdf' ? 'PDF' : 'bosma'})`, type: 'Kitob', price: bookPrice(b, f), image: b.cover })
    setToast(`${b.title} savatga qo‘shildi`)
  }
  const dec = (id, n) => (n <= 1 ? remove(id) : setQty(id, n - 1))
  const toggleLike = (id) => setLiked((s) => {
    const n = new Set(s)
    if (n.has(id)) n.delete(id)
    else { n.add(id); setToast('Sevimlilarga qo‘shildi') }
    return n
  })

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef6fb_0%,#f6f9fb_35%)] pb-[86px]">
      <div className="px-3.5 pt-3">
        <MobileTopBar onSearch={() => searchRef.current?.focus()} onBell={() => setToast('Yangi bildirishnomalar yo‘q')} />
        <h1 className="mt-2.5 text-[26px] font-extrabold leading-tight tracking-tight text-[#0d2a4a]">Kitoblar</h1>
        <p className="text-[13px] text-[#7d8fa9]">Stomatologiya bo‘yicha eng yaxshi adabiyotlar</p>

        <div className="mt-3 flex gap-2">
          <label className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-2xl border border-line/70 bg-white px-3.5">
            <Search className="size-[18px] shrink-0 text-ink-2" />
            <input ref={searchRef} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kitob nomi, muallif yoki mavzu bo‘yicha qidiring..." className="min-w-0 flex-1 bg-transparent text-[12.5px] text-ink outline-none placeholder:text-muted" />
            {q && <button type="button" onClick={() => setQ('')} aria-label="Tozalash" className="text-muted"><X className="size-4" /></button>}
          </label>
          <button type="button" onClick={() => setSheet(true)} aria-label="Filtrlar" className="relative grid size-11 shrink-0 place-items-center rounded-2xl border border-line/70 bg-white text-ink">
            <SlidersHorizontal className="size-[18px]" />
            {active > 0 && <span className="absolute -right-1 -top-1 grid size-[18px] place-items-center rounded-full bg-sea text-[10px] font-bold text-white ring-2 ring-[#f1f7fa]">{active}</span>}
          </button>
        </div>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto px-3.5 pb-0.5 no-scrollbar">
        {CATS.map(([k, l, Icon]) => {
          const on = cat === k
          return (
            <button key={k} type="button" aria-pressed={on} onClick={() => setCat(k)} className={`flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 text-[12px] font-medium transition ${on ? 'bg-sea text-white shadow-[0_4px_10px_rgb(11_138_149/0.25)]' : 'border border-line/70 bg-white text-ink'}`}>
              <Icon className="size-[17px]" strokeWidth={1.7} /> {l}
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex items-center gap-1.5 px-3.5">
        {[['print', 'Bosma kitoblar', BookOpen], ['pdf', 'PDF kitoblar', FileText]].map(([k, l, Icon]) => {
          const on = fmt === k
          return (
            <button key={k} type="button" aria-pressed={on} onClick={() => setFmt(on ? '' : k)} className={`flex h-9 shrink-0 items-center gap-1 rounded-full px-2.5 text-[11px] font-medium transition ${on ? 'bg-sea text-white' : 'border border-line/70 bg-white text-ink'}`}>
              <Icon className="size-3.5" strokeWidth={1.8} /> {l}
            </button>
          )
        })}
        <label className="relative ml-auto flex shrink-0 items-center gap-0.5 whitespace-nowrap text-[11px] text-muted">
          Saralash: <b className="font-semibold text-[#1f5fa8]">{SORT_SHORT[sort]}</b> <ChevronDown className="size-3.5 text-[#1f5fa8]" />
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Saralash" className="absolute inset-0 opacity-0">
            {Object.entries(sorts).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-3 px-3.5">
        {list.length ? (
          <div className="grid grid-cols-2 gap-2.5">
            {list.map((b) => {
              const f = fmt || defaultFormat(b)
              const id = bookCartId(b, f)
              return (
                <BookCard
                  key={b.id}
                  b={b}
                  fmt={f}
                  qty={qtyOf(id)}
                  liked={liked.has(b.id)}
                  onLike={() => toggleLike(b.id)}
                  onAdd={() => put(b, f)}
                  onInc={() => setQty(id, qtyOf(id) + 1)}
                  onDec={() => dec(id, qtyOf(id))}
                />
              )
            })}
          </div>
        ) : (
          <div className="rounded-2xl bg-white px-6 py-10 text-center">
            <p className="text-[14px] font-semibold text-ink">Kitob topilmadi</p>
            <p className="mt-1 text-[12px] text-muted">Qidiruv yoki filtrlarni o‘zgartirib ko‘ring</p>
            <button type="button" onClick={() => { setQ(''); setCat('all'); setFmt(''); setFilter(EMPTY) }} className="mt-3 h-9 rounded-xl bg-sea-50 px-4 text-[12.5px] font-semibold text-sea">Filtrlarni tozalash</button>
          </div>
        )}
      </div>

      {sheet && (
        <FilterSheet
          initial={filter}
          count={(f) => base.filter((b) => matches(b, f)).length}
          onClose={() => setSheet(false)}
          onApply={(f) => { setFilter(f); setSheet(false) }}
        />
      )}

      <MobileToast
        text={toast}
        onClose={closeToast}
        action={toast.includes('savatga') ? <button type="button" onClick={() => navigate('/buyurtma', { state: { from: 'market' } })} className="shrink-0 text-[12.5px] font-semibold text-[#5fe0c8]">Savat</button> : null}
      />
      <MobileTabBar />
    </div>
  )
}

function BookCard({ b, fmt, qty, liked, onLike, onAdd, onInc, onDec }) {
  const badge = bookBadge(b)
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white p-2 shadow-[0_1px_4px_rgb(11_31_58/0.07)]">
      <Link to={`/kitoblar/${b.id}`} className="relative block h-[176px] overflow-hidden rounded-xl bg-[linear-gradient(160deg,#eef4f8,#e2ebf1)]">
        <img src={b.cover} alt={b.title} loading="lazy" className="mx-auto h-full object-contain py-2.5 drop-shadow-[0_8px_10px_rgb(11_31_58/0.25)]" />
        {badge && <span className={`absolute left-1.5 top-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white ${badge[1]}`}>{badge[0]}</span>}
        <button type="button" onClick={(e) => { e.preventDefault(); onLike() }} aria-label="Sevimlilarga" aria-pressed={liked} className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-white/95 shadow-[0_1px_4px_rgb(11_31_58/0.15)]">
          <Heart className={`size-[15px] ${liked ? 'fill-sale text-sale' : 'text-ink'}`} />
        </button>
      </Link>
      <Link to={`/kitoblar/${b.id}`} className="mt-2 block px-0.5">
        <h3 className="line-clamp-2 min-h-[34px] text-[13px] font-bold leading-[1.3] text-[#0d2a4a]">{b.title}</h3>
        <p className="mt-0.5 truncate text-[11px] text-muted">{b.author}</p>
      </Link>
      <p className="mt-1 flex items-center gap-1 px-0.5 text-[11px] text-ink-2">
        <Star className="size-3.5 fill-star text-star" /> <b className="font-semibold text-ink">{b.rating}</b> <span className="truncate text-muted">({b.reviews} ta baho)</span>
      </p>
      <span className={`mx-0.5 mt-1.5 w-fit rounded-md px-1.5 py-0.5 text-[10px] font-medium ${fmt === 'pdf' ? 'bg-[#e4f6ec] text-[#1f9d63]' : 'bg-[#e6f0fc] text-[#1f6fd1]'}`}>{fmt === 'pdf' ? 'PDF kitob' : 'Bosma kitob'}</span>
      <p className="mt-1.5 px-0.5 text-[15px] font-extrabold text-[#0d2a4a]">{money(bookPrice(b, fmt))}</p>
      <div className="mt-auto pt-2">
        {qty ? (
          <div className="flex h-10 gap-1.5">
            <QtyStepper value={qty} onDec={onDec} onInc={onInc} className="w-[86px] shrink-0" />
            <GoCartButton className="flex-1" />
          </div>
        ) : (
          <button type="button" onClick={onAdd} className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-sea text-[13px] font-semibold text-white active:scale-[0.98]">
            {b.price == null ? 'Batafsil' : <><ShoppingCart className="size-4" /> Savatga</>}
          </button>
        )}
      </div>
    </div>
  )
}

function FilterSheet({ initial, count, onClose, onApply }) {
  const [f, setF] = useState(initial)
  const toggle = (key, v) => setF((s) => ({ ...s, [key]: s[key].includes(v) ? s[key].filter((x) => x !== v) : [...s[key], v] }))
  const chip = (on) => `flex h-9 items-center gap-1.5 rounded-xl border px-3 text-[12.5px] font-medium ${on ? 'border-sea bg-sea-50 text-sea' : 'border-line text-ink'}`
  return (
    <BottomSheet
      title="Filtrlar"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={() => setF(EMPTY)} className="h-12 rounded-xl border border-line px-4 text-[13.5px] font-semibold text-ink">Tozalash</button>
          <button type="button" onClick={() => onApply(f)} className="h-12 flex-1 rounded-xl bg-sea text-[14px] font-semibold text-white">{count(f)} ta kitobni ko‘rsatish</button>
        </>
      }
    >
      <p className="mt-3 text-[13px] font-semibold text-ink">Til</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {langOptions.map(([k, l]) => <button key={k} type="button" aria-pressed={f.langs.includes(k)} onClick={() => toggle('langs', k)} className={chip(f.langs.includes(k))}>{f.langs.includes(k) && <Check className="size-3.5" />} {l}</button>)}
      </div>
      <p className="mt-4 text-[13px] font-semibold text-ink">Nashriyot</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {publisherOptions.map(([k, l]) => <button key={k} type="button" aria-pressed={f.pubs.includes(k)} onClick={() => toggle('pubs', k)} className={chip(f.pubs.includes(k))}>{f.pubs.includes(k) && <Check className="size-3.5" />} {l}</button>)}
      </div>
      <p className="mt-4 text-[13px] font-semibold text-ink">Narx</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {PRICES.map(([k, l]) => <button key={k} type="button" aria-pressed={f.price === k} onClick={() => setF((s) => ({ ...s, price: s.price === k ? '' : k }))} className={chip(f.price === k)}>{f.price === k && <Check className="size-3.5" />} {l}</button>)}
      </div>
      <p className="mt-4 text-[13px] font-semibold text-ink">Mavjudlik</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {[['stock', 'Omborda'], ['preorder', 'Oldindan buyurtma']].map(([k, l]) => <button key={k} type="button" aria-pressed={f.stock === k} onClick={() => setF((s) => ({ ...s, stock: s.stock === k ? '' : k }))} className={chip(f.stock === k)}>{f.stock === k && <Check className="size-3.5" />} {l}</button>)}
      </div>
    </BottomSheet>
  )
}

export function ImplantIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7 3.5h10l-1 3H8z" />
      <path d="M9 8.5h6M9.3 11.5h5.4M9.6 14.5h4.8M10 17.5h4M12 21l-2-3.5h4z" />
    </svg>
  )
}

export function BracesIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8 4c1.2 0 1.9.8 4 .8S14.8 4 16 4c2 0 3 1.8 3 4 0 1.9-.5 3-1 4.8-.6 2.1-1.4 6.2-2.6 6.2-.8 0-1.2-2-3.4-2s-2.6 2-3.4 2c-1.2 0-2-4.1-2.6-6.2C5.5 11 5 9.9 5 8c0-2.2 1-4 3-4z" />
      <path d="M5.5 10h13" />
      <rect x="10.5" y="8.5" width="3" height="3" rx=".6" />
    </svg>
  )
}
