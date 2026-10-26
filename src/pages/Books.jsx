import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Star, BookOpen, Plus, X, Check } from 'lucide-react'
import ShopLayout from '../components/market/ShopLayout'
import { useCart } from '../cart'
import {
  cats, formatOptions, langOptions, stockOptions, publisherOptions, langName, sorts,
  books, library, perks, money, featured,
} from '../booksData'

const empty = { formats: [], langs: [], publishers: [], yearFrom: 2015, yearTo: 2026, priceFrom: 0, priceTo: 5000000, stock: 'all', sort: 'popular', cat: 'all' }

export default function BooksRoute() {
  const [q, setQ] = useState('')
  return (
    <ShopLayout active="books" search="plain" placeholder="Kitob, muallif yoki ISBN bo‘yicha qidiring..." onQuery={setQ}>
      <Books query={q} />
    </ShopLayout>
  )
}

function Books({ query }) {
  const [f, setF] = useState(empty)
  const [ask, setAsk] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const patch = (p) => setF((s) => ({ ...s, ...p }))
  const toggle = (key, value) => setF((s) => ({ ...s, [key]: s[key].includes(value) ? s[key].filter((x) => x !== value) : [...s[key], value] }))

  const counts = useMemo(() => ({
    format: {
      print: books.filter((b) => b.formats.includes('print')).length,
      pdf: books.filter((b) => b.formats.includes('pdf')).length,
      both: books.filter((b) => b.formats.includes('print') && b.formats.includes('pdf')).length,
    },
    lang: Object.fromEntries(langOptions.map(([k]) => [k, books.filter((b) => b.lang === k).length])),
    stock: {
      all: books.length,
      stock: books.filter((b) => b.stock === 'stock').length,
      preorder: books.filter((b) => b.stock === 'preorder').length,
    },
    publisher: Object.fromEntries(publisherOptions.map(([k]) => [k, books.filter((b) => b.publisher === k).length])),
  }), [])

  const text = query.trim().toLowerCase()
  const list = useMemo(() => books
    .filter((b) => f.cat === 'all' || b.cats.includes(f.cat))
    .filter((b) => !f.formats.length || f.formats.some((fmt) => fmt === 'both' ? b.formats.includes('print') && b.formats.includes('pdf') : b.formats.includes(fmt)))
    .filter((b) => !f.langs.length || f.langs.includes(b.lang))
    .filter((b) => !f.publishers.length || f.publishers.includes(b.publisher))
    .filter((b) => b.year >= f.yearFrom && b.year <= f.yearTo)
    .filter((b) => b.price >= f.priceFrom && b.price <= f.priceTo)
    .filter((b) => f.stock === 'all' || b.stock === f.stock)
    .filter((b) => !text || `${b.title} ${b.author} ${b.isbn}`.toLowerCase().includes(text))
    .slice()
    .sort((a, b) => {
      if (f.sort === 'rating') return b.rating - a.rating
      if (f.sort === 'cheap') return a.price - b.price
      if (f.sort === 'rich') return b.price - a.price
      if (f.sort === 'fresh') return b.year - a.year
      return books.indexOf(a) - books.indexOf(b)
    }), [f, text])

  return (
    <div className="pb-8 pt-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold tracking-tight text-ink">Kitoblar</h1>
          <p className="mt-0.5 text-[12px] text-ink-2">Stomatologik kitoblar, atlaslar va qo‘llanmalar. Bosma yoki elektron formatda.</p>
        </div>
        <button onClick={() => { setAddOpen(true); setSent(false) }} className="flex h-[34px] items-center gap-1.5 rounded-full bg-sea px-4 text-[12px] font-semibold text-white shadow-[0_6px_16px_-6px_rgb(11_138_149/0.7)] hover:bg-sea-600">
          <Plus className="size-4" /> Kitob qo‘shish
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {cats.map(([k, label]) => (
          <button key={k} onClick={() => patch({ cat: k })} className={`h-[28px] rounded-full px-3 text-[10.5px] font-medium ${f.cat === k ? 'bg-sea text-white' : 'bg-white text-ink-2 shadow-card hover:text-sea'}`}>{label}</button>
        ))}
      </div>

      <div className="books-layout mt-3">
        <aside className="rounded-xl bg-white p-3 shadow-card">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[13px] font-bold text-ink">Filtrlar</h2>
            <button onClick={() => setF(empty)} className="text-[10px] font-medium text-sea">Tozalash</button>
          </div>
          <FilterBlock title="Format">
            {formatOptions.map(([k, label]) => (
              <CheckRow key={k} checked={f.formats.includes(k)} onChange={() => toggle('formats', k)} label={label} count={counts.format[k]} />
            ))}
          </FilterBlock>
          <FilterBlock title="Til">
            {langOptions.map(([k, label]) => (
              <CheckRow key={k} checked={f.langs.includes(k)} onChange={() => toggle('langs', k)} label={label} count={counts.lang[k]} />
            ))}
          </FilterBlock>
          <FilterBlock title="Nashr yili">
            <RangePair from={f.yearFrom} to={f.yearTo} min={2015} max={2026} onFrom={(n) => patch({ yearFrom: n })} onTo={(n) => patch({ yearTo: n })} />
          </FilterBlock>
          <FilterBlock title="Narx oralig‘i (so‘m)">
            <RangePair from={f.priceFrom} to={f.priceTo} min={0} max={5000000} step={50000} money onFrom={(n) => patch({ priceFrom: n })} onTo={(n) => patch({ priceTo: n })} />
          </FilterBlock>
          <FilterBlock title="Mavjudligi">
            {stockOptions.map(([k, label]) => (
              <CheckRow key={k} checked={f.stock === k} onChange={() => patch({ stock: k })} label={label} count={counts.stock[k]} />
            ))}
          </FilterBlock>
          <FilterBlock title="Nashriyot">
            {publisherOptions.map(([k, label]) => (
              <CheckRow key={k} checked={f.publishers.includes(k)} onChange={() => toggle('publishers', k)} label={label} count={counts.publisher[k]} />
            ))}
          </FilterBlock>
        </aside>

        <div className="min-w-0">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[12px] text-ink-2"><span className="font-bold text-ink">{list.length}</span> ta kitob topildi</p>
            <label className="relative">
              <span className="mr-1 text-[10px] text-muted">Saralash:</span>
              <select value={f.sort} onChange={(e) => patch({ sort: e.target.value })} className="h-[26px] appearance-none rounded-lg bg-white pl-2 pr-6 text-[10px] font-medium text-ink shadow-card outline-none">
                {Object.entries(sorts).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </label>
          </div>
          {list.length ? (
            <div className="grid min-w-0 grid-cols-2 gap-2 xl:grid-cols-4">
              {list.map((b) => <BookCard key={b.id} book={b} />)}
            </div>
          ) : (
            <div className="grid h-[180px] place-items-center rounded-xl bg-white text-[12px] text-muted shadow-card">Kitob topilmadi</div>
          )}
        </div>

        <aside className="flex flex-col gap-3">
          <div className="rounded-xl bg-white p-3 shadow-card">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[12px] font-bold text-ink">Haftaning tanlovi</h3>
              {featured.off ? <span className="rounded-full bg-sale px-1.5 py-0.5 text-[9px] font-bold text-white">-{featured.off}%</span> : null}
            </div>
            <Link to={`/kitoblar/${featured.id}`}><img src={featured.cover} alt="" className="h-[132px] w-full rounded-lg object-cover" /></Link>
            <Link to={`/kitoblar/${featured.id}`} className="mt-2 block text-[13px] font-bold leading-tight text-ink">{featured.title}</Link>
            <p className="text-[10px] text-muted">{featured.author}</p>
            <p className="text-[10px] text-muted">{featured.year} · {featured.pages} sahifa</p>
            <p className="mt-1 flex items-center gap-1 text-[10px] text-ink-2"><Star className="size-3 fill-star text-star" /> {featured.rating}</p>
            <p className="mt-1 text-[16px] font-extrabold text-sale">{money(featured.price)}</p>
            {featured.oldPrice ? <p className="text-[10px] text-muted line-through">{money(featured.oldPrice)}</p> : null}
            <CartButton book={featured} wide />
            <Link to={`/kitoblar/${featured.id}/oqish`} className="mt-1.5 flex h-8 w-full items-center justify-center rounded-lg border border-sea text-[11px] font-semibold text-sea hover:bg-sea-50">Namuna o‘qish</Link>
            <div className="mt-2 flex flex-col gap-1">
              {perks.map((p) => <p key={p} className="flex items-center gap-1.5 text-[10px] text-ink-2"><Check className="size-3 text-sea" /> {p}</p>)}
            </div>
          </div>

          <div className="rounded-xl bg-white p-3 shadow-card">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[12px] font-bold text-ink">Mening kutubxonam</h3>
              <span className="text-[9px] font-medium text-sea">Barchasini ko‘rish</span>
            </div>
            {library.map((b) => (
              <div key={b.id} className="flex items-center gap-2 py-1.5">
                <img src={b.cover} alt="" className="h-10 w-8 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10.5px] font-semibold text-ink">{b.title}</p>
                  <p className="truncate text-[9px] text-muted">{b.author}</p>
                  <p className="text-[9px] text-muted">PDF · {b.size}</p>
                </div>
                <Link to="/kitoblar/klinik/oqish" className="text-[10px] font-semibold text-sea">O‘qish</Link>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-white p-3 shadow-card">
            <div className="flex items-start gap-2">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sea-50 text-sea"><BookOpen className="size-4" /></span>
              <div>
                <h3 className="text-[12px] font-bold text-ink">Kitob topa olmadingizmi?</h3>
                <p className="mt-0.5 text-[10px] leading-snug text-muted">Sizga kerakli kitobni topishda yordam beramiz. Buyurtma qoldiring.</p>
              </div>
            </div>
            <button onClick={() => { setAsk(true); setSent(false) }} className="mt-2 flex h-8 w-full items-center justify-center gap-1 rounded-lg bg-sea text-[11px] font-semibold text-white hover:bg-sea-600">
              So‘rov yuborish <span aria-hidden>→</span>
            </button>
          </div>
        </aside>
      </div>

      {addOpen && <FormModal title="Kitob qo‘shish" sent={sent} onClose={() => setAddOpen(false)} onSubmit={() => setSent(true)} fields={['Kitob nomi', 'Muallif', 'ISBN']} ok="Yuborish" done="Taklif qabul qilindi. Muharrir ko‘rib chiqadi." />}
      {ask && <FormModal title="Kitob so‘rovi" sent={sent} onClose={() => setAsk(false)} onSubmit={() => setSent(true)} fields={['Kitob nomi', 'Muallif yoki nashriyot']} ok="So‘rov yuborish" done="So‘rov qabul qilindi. Topilsa, xabar beramiz." />}
    </div>
  )
}

function BookCard({ book }) {
  const both = book.formats.includes('print') && book.formats.includes('pdf')
  return (
    <article className="flex min-w-0 flex-col rounded-xl bg-white p-2 shadow-card">
      <Link to={`/kitoblar/${book.id}`} className="relative grid place-items-center overflow-hidden rounded-lg bg-[#f4f7fb]" style={{ height: 132 }}>
        <img src={book.cover} alt="" className="max-h-full max-w-full object-contain" />
        {book.badge === 'best' && <span className="absolute left-1.5 top-1.5 rounded-full bg-[#1f8f4e] px-1.5 py-0.5 text-[8px] font-bold text-white">Bestseller</span>}
        {book.off ? <span className="absolute left-1.5 top-1.5 rounded-full bg-sale px-1.5 py-0.5 text-[8px] font-bold text-white">-{book.off}%</span> : null}
        {book.badge === 'new' && <span className="absolute left-1.5 top-1.5 rounded-full bg-sea px-1.5 py-0.5 text-[8px] font-bold text-white">Yangi</span>}
      </Link>
      <div className="mt-1.5 flex gap-1">
        {(both || book.formats.includes('print')) && <Tag>Bosma</Tag>}
        {(both || book.formats.includes('pdf')) && <Tag>PDF</Tag>}
      </div>
      <Link to={`/kitoblar/${book.id}`} className="mt-1 line-clamp-2 text-[12px] font-bold leading-snug text-ink">{book.title}</Link>
      <p className="truncate text-[10px] text-muted">{book.author}</p>
      <p className="text-[9.5px] text-muted">{book.year} · {book.pages} sahifa · {langName[book.lang]}</p>
      <p className="mt-1 flex items-center gap-1 text-[10px] text-ink-2"><Star className="size-3 fill-star text-star" /> {book.rating} <span className="text-muted">({book.reviews} ta sharh)</span></p>
      <div className="mt-1">
        <p className="text-[13px] font-extrabold text-ink">{money(book.price)}</p>
        {book.oldPrice ? <p className="text-[9.5px] text-muted line-through">{money(book.oldPrice)}</p> : null}
      </div>
      <div className="mt-auto pt-2">
        <CartButton book={book} />
        <Link to={`/kitoblar/${book.id}/oqish`} className="mt-1 block h-7 w-full text-center text-[10.5px] font-semibold leading-7 text-sea hover:underline">Namuna o‘qish</Link>
      </div>
    </article>
  )
}

function CartButton({ book, wide }) {
  const { add, items } = useCart()
  const inCart = items.some((it) => it.id === book.id)
  return (
    <button
      onClick={() => { if (!inCart) add({ id: book.id, name: book.title, type: 'Kitob', price: book.price, image: book.cover }) }}
      className={`flex h-8 w-full items-center justify-center gap-1.5 rounded-lg text-[11px] font-semibold text-white ${inCart ? 'bg-[#1f8f4e]' : 'bg-sea hover:bg-sea-600'}`}
    >
      <ShoppingCart className="size-3.5" /> {inCart ? 'Savatda' : wide ? 'Savatga qo‘shish' : 'Savatga'}
    </button>
  )
}

function Tag({ children }) {
  return <span className="rounded bg-sea-50 px-1.5 py-0.5 text-[8px] font-semibold text-sea-600">{children}</span>
}

function FilterBlock({ title, children }) {
  return (
    <div className="mt-3 border-t border-line pt-2.5 first:mt-0 first:border-0 first:pt-0">
      <p className="mb-1.5 text-[11px] font-bold text-ink">{title}</p>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  )
}

function CheckRow({ checked, onChange, label, count }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[10.5px] text-ink-2">
      <input type="checkbox" checked={checked} onChange={onChange} className="size-3.5" style={{ accentColor: '#0b8a95' }} />
      <span className="flex-1">{label}</span>
      <span className="text-muted">({count})</span>
    </label>
  )
}

function RangePair({ from, to, min, max, step = 1, money: asMoney, onFrom, onTo }) {
  const show = (n) => asMoney ? n.toLocaleString('ru-RU').replace(/\u00a0/g, ' ') : n
  const pct = ((to - min) / (max - min)) * 100
  return (
    <div>
      <div className="flex items-center gap-1">
        <input value={show(from)} onChange={(e) => onFrom(Math.min(Number(String(e.target.value).replace(/\s/g, '')) || min, to))} className="h-7 w-full rounded-md bg-page text-center text-[10px] outline-none" />
        <span className="text-muted">—</span>
        <input value={show(to)} onChange={(e) => onTo(Math.max(Number(String(e.target.value).replace(/\s/g, '')) || min, from))} className="h-7 w-full rounded-md bg-page text-center text-[10px] outline-none" />
      </div>
      <input type="range" min={min} max={max} step={step} value={to} onChange={(e) => onTo(Number(e.target.value))} className="surplus-range mt-2 w-full" style={{ '--p': `${pct}%` }} />
      <p className="sr-only">{show(from)} — {show(to)}</p>
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[420px] rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="text-[16px] font-bold leading-tight text-ink">{title}</h3>
          <button onClick={onClose} aria-label="Yopish"><X className="size-4 text-muted" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function FormModal({ title, fields, ok, done, sent, onClose, onSubmit }) {
  return (
    <Modal title={title} onClose={onClose}>
      {sent ? <p className="py-6 text-center text-[13px] text-ink-2">{done}</p> : (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit() }} className="flex flex-col gap-2">
          {fields.map((label) => (
            <label key={label} className="text-[10px] text-muted">{label}
              <input required className="mt-1 h-9 w-full rounded-lg bg-page px-3 text-[12px] text-ink outline-none focus:ring-1 focus:ring-sea" />
            </label>
          ))}
          <button className="mt-1 h-10 rounded-lg bg-sea text-[13px] font-semibold text-white">{ok}</button>
        </form>
      )}
    </Modal>
  )
}
