import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Bookmark, List, ChevronDown, ChevronLeft, ChevronRight, Moon, Sun, Trash2 } from 'lucide-react'
import { getBook, readerOf, flatReader } from '../../booksData'
import { MobileToast } from './parts'
import { BottomSheet } from './MobileSeminars'

const MIN = 13
const MAX = 20
const keyOf = (id) => `stomahub-read-${id}`

function load(id) {
  try {
    return JSON.parse(localStorage.getItem(keyOf(id))) || {}
  } catch {
    return {}
  }
}

export default function MobileReader() {
  const { id } = useParams()
  return <ReaderView key={id} id={id} />
}

function ReaderView({ id }) {
  const book = getBook(id)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const doc = book ? readerOf(book) : null
  const rows = useMemo(() => (doc ? flatReader(doc) : []), [doc])
  const saved = useMemo(() => load(id), [id])

  const [page, setPage] = useState(() => Number(params.get('page')) || saved.page || doc?.start || 1)
  const [size, setSize] = useState(saved.size || 15)
  const [night, setNight] = useState(!!saved.night)
  const [marks, setMarks] = useState(() => saved.marks || doc?.marks.map((m) => m.page) || [])
  const [sheet, setSheet] = useState(null)
  const [toast, setToast] = useState('')
  const closeToast = useCallback(() => setToast(''), [])

  const idx = Math.max(0, rows.findLastIndex((r) => r.page <= page))
  const current = rows[idx]
  const chapter = current && (current.parent ? doc.chapters.find((c) => c.id === current.parent) : doc.chapters.find((c) => c.id === current.id))
  const view = current && (doc.pagesOf[current.id] || doc.pagesOf[chapter?.children?.[0]?.id])
  const marked = marks.includes(page)

  useEffect(() => {
    try {
      localStorage.setItem(keyOf(id), JSON.stringify({ page, size, night, marks }))
    } catch { /* xotira yopiq */ }
  }, [id, page, size, night, marks])

  const asked = Number(params.get('page'))
  useEffect(() => {
    if (asked) setPage(asked)
  }, [asked])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [current?.id])

  if (!book) {
    return (
      <div className="grid min-h-screen place-items-center bg-white px-6 text-center">
        <div>
          <p className="text-[15px] font-semibold text-ink">Kitob topilmadi</p>
          <Link to="/kitoblar" className="mt-3 inline-block text-[13px] font-semibold text-sea">Kitoblarga qaytish</Link>
        </div>
      </div>
    )
  }

  const back = () => (window.history.length > 1 ? navigate(-1) : navigate(`/kitoblar/${id}`))
  const go = (p) => setPage(Math.min(doc.pages, Math.max(1, p)))
  const toggleMark = () => {
    setMarks((l) => (l.includes(page) ? l.filter((p) => p !== page) : [...l, page].sort((a, b) => a - b)))
    setToast(marked ? 'Xatcho‘p olib tashlandi' : `${page}-betga xatcho‘p qo‘yildi`)
  }
  const chapterSub = chapter?.children?.length
    ? chapter.children.map((c) => c.title.replace(/^[\d.]+\s*/, '')).join(', ')
    : `${chapter?.page}-betdan boshlanadi`
  const pct = ((page - 1) / (doc.pages - 1)) * 100

  const t = night
    ? { page: 'bg-[#0f1a22]', card: 'bg-[#16252f] border-[#22343f]', head: 'text-[#e3edf2]', text: 'text-[#b9c8d1]', muted: 'text-[#7f95a3]', bar: 'bg-[#16252f] border-[#22343f]', btn: 'text-[#b9c8d1]' }
    : { page: 'bg-[#f6faf9]', card: 'bg-white border-line/70', head: 'text-[#0d3b3f]', text: 'text-[#3d4f5f]', muted: 'text-muted', bar: 'bg-white border-line/60', btn: 'text-ink' }

  return (
    <div className={`min-h-screen pb-[150px] transition-colors ${t.page}`}>
      <header className={`sticky top-0 z-20 flex items-center gap-2 border-b px-2 py-2.5 ${t.bar}`}>
        <button type="button" onClick={back} aria-label="Orqaga" className={`grid size-10 shrink-0 place-items-center rounded-full ${t.btn}`}><ArrowLeft className="size-[22px]" /></button>
        <div className="min-w-0 flex-1 text-center">
          <p className={`truncate text-[15px] font-bold ${t.head}`}>{doc.title}</p>
          <p className={`truncate text-[11.5px] ${t.muted}`}>{doc.author}</p>
        </div>
        <button type="button" onClick={() => setSheet('marks')} aria-label="Xatcho‘plar" className={`relative grid size-10 shrink-0 place-items-center rounded-full ${t.btn}`}>
          <Bookmark className={`size-[21px] ${marked ? 'fill-[#0b6d73] text-[#0b6d73]' : ''}`} />
          {marks.length > 0 && <span className="absolute right-0.5 top-0.5 grid size-4 place-items-center rounded-full bg-sea text-[9px] font-bold text-white">{marks.length}</span>}
        </button>
      </header>

      <div className="px-3.5 pt-3">
        <button type="button" onClick={() => setSheet('toc')} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left ${t.card}`}>
          <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${night ? 'bg-[#1d3a40] text-[#5fd0c4]' : 'bg-[#e6f4f3] text-[#0b6d73]'}`}><List className="size-5" /></span>
          <span className="min-w-0 flex-1">
            <span className={`block text-[13.5px] font-bold leading-snug ${t.head}`}>{chapter?.title}</span>
            <span className={`mt-0.5 block truncate text-[11.5px] ${t.muted}`}>{chapterSub}</span>
          </span>
          <ChevronDown className={`size-5 shrink-0 ${t.muted}`} />
        </button>

        {view && (
          <article className="px-1 pt-4" style={{ fontSize: size }}>
            <h2 className={`text-[1.3em] font-extrabold leading-tight ${t.head}`}>{view.title}</h2>
            <p className={`mt-2 leading-[1.65] ${t.text}`}>{view.lead}</p>

            {view.figure && (
              <figure className={`mt-4 overflow-hidden rounded-2xl border ${t.card}`}>
                <img src={view.figure} alt={view.caption} className="w-full bg-white" />
                {view.labels && (
                  <div className="grid grid-cols-4 gap-1 px-1.5 py-2">
                    {view.labels.map((l) => <span key={l} className={`text-center text-[10.5px] font-medium leading-tight ${t.text}`}>{l}</span>)}
                  </div>
                )}
                {view.caption && <figcaption className={`border-t px-3 py-2 text-center text-[11.5px] italic ${t.muted} ${night ? 'border-[#22343f]' : 'border-line/60'}`}>{view.caption}</figcaption>}
              </figure>
            )}

            {view.after && <p className={`mt-4 leading-[1.65] ${t.text}`}>{view.after}</p>}
            {view.body?.map((p) => <p key={p} className={`mt-3 leading-[1.65] ${t.text}`}>{p}</p>)}

            {view.nextKicker && <h2 className={`mt-5 text-[1.3em] font-extrabold leading-tight ${t.head}`}>{view.nextKicker}</h2>}
            {view.nextLead && <p className={`mt-2 leading-[1.65] ${t.text}`}>{view.nextLead}</p>}
            {(view.points || (view.point ? [view.point] : [])).map((pt) => (
              <div key={pt.n} className={`mt-2.5 flex gap-3 rounded-2xl border p-3 ${t.card}`}>
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#0b6d73] text-[14px] font-bold text-white">{pt.n}</span>
                <span className="min-w-0">
                  <b className={`block text-[0.95em] ${t.head}`}>{pt.title}</b>
                  <span className={`mt-0.5 block text-[0.88em] leading-snug ${t.text}`}>{pt.body}</span>
                </span>
              </div>
            ))}

            <div className="mt-6 flex gap-2">
              <button type="button" disabled={idx === 0} onClick={() => go(rows[idx - 1].page)} className={`flex h-11 flex-1 items-center justify-center gap-1 rounded-xl border text-[13px] font-semibold disabled:opacity-40 ${t.card} ${t.btn}`}>
                <ChevronLeft className="size-4" /> Oldingi
              </button>
              <button type="button" disabled={idx === rows.length - 1} onClick={() => go(rows[idx + 1].page)} className="flex h-11 flex-1 items-center justify-center gap-1 rounded-xl bg-[#0b6d73] text-[13px] font-semibold text-white disabled:opacity-40">
                Keyingi bo‘lim <ChevronRight className="size-4" />
              </button>
            </div>
          </article>
        )}
      </div>

      <div className={`fixed inset-x-0 bottom-0 z-30 rounded-t-3xl border-t px-4 pb-[max(10px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-6px_20px_rgb(11_31_58/0.08)] ${t.bar}`}>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={doc.pages}
            value={page}
            onChange={(e) => go(Number(e.target.value))}
            aria-label="Sahifa"
            className="reader-range h-1.5 flex-1 cursor-pointer appearance-none rounded-full accent-[#0b6d73]"
            style={{ background: `linear-gradient(90deg,#0b6d73 ${pct}%,${night ? '#2c3f4b' : '#dbe5e9'} ${pct}%)` }}
          />
          <span className={`shrink-0 text-[12.5px] font-semibold tabular-nums ${t.head}`}>{page} / {doc.pages} bet</span>
        </div>
        <div className="mt-2.5 grid grid-cols-5 gap-1">
          <Tool label="Kichikroq" disabled={size <= MIN} onClick={() => setSize((s) => Math.max(MIN, s - 1))} night={night}><span className="text-[15px] font-bold">A<sup className="text-[10px]">−</sup></span></Tool>
          <Tool label="Kattaroq" disabled={size >= MAX} onClick={() => setSize((s) => Math.min(MAX, s + 1))} night={night}><span className="text-[18px] font-bold">A<sup className="text-[11px]">+</sup></span></Tool>
          <Tool label={night ? 'Kunduzgi' : 'Tungi rejim'} active={night} onClick={() => setNight(!night)} night={night}>{night ? <Sun className="size-5" /> : <Moon className="size-5" />}</Tool>
          <Tool label="Xatcho‘p" active={marked} onClick={toggleMark} night={night}><Bookmark className={`size-5 ${marked ? 'fill-current' : ''}`} /></Tool>
          <Tool label="Mundarija" onClick={() => setSheet('toc')} night={night}><List className="size-5" /></Tool>
        </div>
      </div>

      {sheet && (
        <BottomSheet title={sheet === 'toc' ? 'Mundarija' : 'Xatcho‘plar'} onClose={() => setSheet(null)}>
          <div className="mt-2 grid grid-cols-2 rounded-xl bg-[#eef3f5] p-1">
            {[['toc', 'Mundarija'], ['marks', `Xatcho‘plar (${marks.length})`]].map(([k, l]) => (
              <button key={k} type="button" onClick={() => setSheet(k)} className={`h-9 rounded-lg text-[12.5px] font-semibold ${sheet === k ? 'bg-white text-sea shadow-[0_1px_2px_rgb(11_31_58/0.1)]' : 'text-ink-2'}`}>{l}</button>
            ))}
          </div>
          {sheet === 'toc' ? (
            <div className="mt-2 flex flex-col pb-2">
              {rows.map((r) => {
                const on = r.id === current?.id
                return (
                  <button key={r.id} type="button" onClick={() => { go(r.page); setSheet(null) }} className={`flex min-h-[44px] items-center gap-2 rounded-xl px-2 text-left ${r.parent ? 'pl-6' : ''} ${on ? 'bg-sea-50' : ''}`}>
                    <span className={`min-w-0 flex-1 text-[13px] ${r.parent ? 'text-ink-2' : 'font-semibold text-ink'} ${on ? '!text-sea' : ''}`}>{r.title}</span>
                    <span className="shrink-0 text-[11.5px] text-muted">{r.page}</span>
                  </button>
                )
              })}
            </div>
          ) : marks.length ? (
            <div className="mt-2 flex flex-col gap-2 pb-2">
              {marks.map((p) => {
                const r = rows[Math.max(0, rows.findLastIndex((x) => x.page <= p))]
                return (
                  <div key={p} className="flex items-center gap-2 rounded-xl border border-line p-2.5">
                    <Bookmark className="size-4 shrink-0 fill-sea text-sea" />
                    <button type="button" onClick={() => { go(p); setSheet(null) }} className="min-w-0 flex-1 text-left">
                      <span className="block truncate text-[13px] font-semibold text-ink">{r?.title}</span>
                      <span className="text-[11.5px] text-muted">{p}-bet</span>
                    </button>
                    <button type="button" onClick={() => setMarks((l) => l.filter((x) => x !== p))} aria-label="O‘chirish" className="grid size-8 place-items-center text-muted"><Trash2 className="size-4" /></button>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="py-8 text-center text-[12.5px] text-muted">Hali xatcho‘p yo‘q. Pastdagi “Xatcho‘p” tugmasini bosing.</p>
          )}
        </BottomSheet>
      )}

      <MobileToast text={toast} onClose={closeToast} bottom={140} />
    </div>
  )
}

function Tool({ label, active, disabled, onClick, night, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`flex h-[54px] flex-col items-center justify-center gap-0.5 rounded-xl text-[10.5px] font-medium transition disabled:opacity-35 ${active ? 'bg-[#0b6d73] text-white' : night ? 'text-[#b9c8d1]' : 'text-ink'}`}
    >
      <span className="grid h-6 place-items-center">{children}</span>
      {label}
    </button>
  )
}
