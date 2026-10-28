import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Bookmark, ChevronDown, ChevronLeft, ChevronRight, List, Lock, Moon, Sun, Trash2, ZoomIn, ZoomOut } from 'lucide-react'
import { getBook } from '../../booksData'
import { useCatalogVersion } from '../../recordSync'
import { MobileToast } from './parts'
import { BottomSheet } from './MobileSeminars'
import { PageView, ZOOM_MAX, ZOOM_MIN, bookFacts, sectionAt, useReaderAccess, useReaderPrefs } from '../reader/bookReader'

export default function MobileReader() {
  const { id } = useParams()
  useCatalogVersion()
  const book = getBook(id)
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
  return <ReaderView key={id} book={book} />
}

function ReaderView({ book }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const facts = useMemo(() => bookFacts(book), [book])
  const reader = useReaderAccess(book)
  const asked = Number(params.get('page')) || 0
  const st = useReaderPrefs(book.id, facts.total, asked)
  const { page, setPage, zoom, night, marks } = st
  const [sheet, setSheet] = useState(null)
  const [toast, setToast] = useState('')
  const closeToast = useCallback(() => setToast(''), [])
  const full = reader.access === 'yes'
  const free = facts.preview.length
  const section = sectionAt(facts.contents, page)
  const marked = marks.includes(page)

  useEffect(() => { window.scrollTo(0, 0) }, [page])

  const go = (p) => { setPage(p); setSheet(null) }
  const mark = () => { st.toggleMark(); setToast(marked ? 'Xatcho‘p olib tashlandi' : `${page}-bet xatcho‘pga qo‘shildi`) }

  const dark = night
  const tools = [
    [ZoomOut, 'Kichraytirish', st.zoomOut, false, zoom <= ZOOM_MIN],
    [ZoomIn, 'Kattalashtirish', st.zoomIn, false, zoom >= ZOOM_MAX],
    [night ? Sun : Moon, night ? 'Kunduzgi' : 'Tungi rejim', () => st.setNight(!night), night],
    [Bookmark, 'Xatcho‘p', mark, marked],
    ...(facts.contents.length || marks.length ? [[List, 'Mundarija', () => setSheet('toc'), false]] : []),
  ]

  return (
    <div className={`min-h-screen pb-[calc(124px+env(safe-area-inset-bottom))] ${dark ? 'bg-[#0f1a22] text-[#e3edf2]' : 'bg-[#f3f8f7] text-ink'}`}>
      <header className={`sticky top-0 z-30 border-b pt-[env(safe-area-inset-top)] ${dark ? 'border-[#22343f] bg-[#0f1a22]' : 'border-line/60 bg-white'}`}>
        <div className="flex items-center gap-2 px-3 py-2">
          <button type="button" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(`/kitoblar/${book.id}`))} aria-label="Orqaga" className="grid size-10 shrink-0 place-items-center rounded-full"><ArrowLeft className="size-[22px]" /></button>
          <div className="min-w-0 flex-1 text-center">
            <h1 data-testid="reader-title" className="truncate text-[15px] font-bold leading-tight">{facts.title}</h1>
            <p data-testid="reader-author" className="truncate text-[11.5px] opacity-70">{[facts.author, facts.year].filter(Boolean).join(' · ')}</p>
          </div>
          <button type="button" onClick={mark} aria-label="Xatcho‘p" aria-pressed={marked} className="grid size-10 shrink-0 place-items-center rounded-full"><Bookmark className={`size-[22px] ${marked ? 'fill-[#0b6d73] text-[#0b6d73]' : ''}`} /></button>
        </div>
        {section && (
          <button type="button" onClick={() => setSheet('toc')} className={`flex w-full items-center gap-2 border-t px-4 py-1.5 text-left text-[12px] ${dark ? 'border-[#22343f]' : 'border-line/50'}`}>
            <List className="size-4 shrink-0 text-[#0b6d73]" /><span className="min-w-0 flex-1 truncate opacity-80">{section.title}</span><ChevronDown className="size-4 shrink-0 opacity-60" />
          </button>
        )}
      </header>

      {!full && free > 0 && page <= free && (
        <p className={`mx-3 mt-2 rounded-lg px-3 py-1.5 text-center text-[11.5px] ${dark ? 'bg-[#16252f]' : 'bg-[#e6f4f3] text-[#0b5b60]'}`}>Bepul namuna: 1–{free} bet · to‘liq kitob {facts.total} bet</p>
      )}

      <main className="overflow-x-auto px-2 pt-2">
        <PageView book={book} facts={facts} page={page} zoom={zoom} night={night} reader={reader} />
      </main>

      <div className="mt-3 grid grid-cols-2 gap-2 px-3">
        <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className={`flex h-11 items-center justify-center gap-1 rounded-xl border text-[13.5px] font-semibold disabled:opacity-40 ${dark ? 'border-[#22343f] bg-[#16252f]' : 'border-line bg-white'}`}><ChevronLeft className="size-4" /> Oldingi</button>
        <button type="button" disabled={page >= facts.total} onClick={() => setPage(page + 1)} className="flex h-11 items-center justify-center gap-1 rounded-xl bg-[#0b6d73] text-[13.5px] font-semibold text-white disabled:opacity-40">Keyingi bet <ChevronRight className="size-4" /></button>
      </div>

      <nav className={`fixed inset-x-0 bottom-0 z-40 rounded-t-2xl border-t pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgb(11_31_58/0.08)] ${dark ? 'border-[#22343f] bg-[#0f1a22]' : 'border-line/60 bg-white'}`}>
        <div className="flex items-center gap-3 px-4 pt-3">
          <input type="range" min={1} max={Math.max(1, facts.total)} value={page} onChange={(e) => setPage(Number(e.target.value))} aria-label="Sahifa" className="h-1.5 min-w-0 flex-1 accent-[#0b6d73]" />
          <span data-testid="reader-progress" className="shrink-0 text-[12.5px] font-semibold tabular-nums">{page} / {facts.total} bet</span>
        </div>
        <div className="grid px-1 pb-1.5 pt-1" style={{ gridTemplateColumns: `repeat(${tools.length}, minmax(0, 1fr))` }}>
          {tools.map(([Icon, label, onClick, on, off]) => (
            <button key={label} type="button" onClick={onClick} disabled={off} aria-pressed={on} className={`flex flex-col items-center gap-0.5 py-1.5 text-[10.5px] font-medium disabled:opacity-35 ${on ? 'text-[#0b6d73]' : ''}`}>
              <Icon className={`size-[22px] ${on && label === 'Xatcho‘p' ? 'fill-[#0b6d73]' : ''}`} strokeWidth={1.7} />{label}
            </button>
          ))}
        </div>
      </nav>

      {sheet === 'toc' && (
        <BottomSheet title={`Mundarija · ${facts.total} bet`} onClose={() => setSheet(null)}>
          {marks.length > 0 && (
            <div className="px-4 pb-2">
              <p className="pb-1 text-[12px] font-semibold text-muted">Xatcho‘plar</p>
              <div className="flex flex-wrap gap-1.5">
                {marks.map((p) => (
                  <span key={p} className="inline-flex items-center rounded-full bg-[#e6f4f3] text-[12px] font-semibold text-[#0b5b60]">
                    <button type="button" onClick={() => go(p)} className="py-1 pl-3 pr-1">{p}-bet</button>
                    <button type="button" aria-label="O‘chirish" onClick={() => st.setMarks((l) => l.filter((x) => x !== p))} className="py-1 pl-1 pr-2"><Trash2 className="size-3.5" /></button>
                  </span>
                ))}
              </div>
            </div>
          )}
          <ul data-testid="reader-toc" className="px-2 pb-4">
            {facts.contents.map((r) => {
              const locked = !full && r.page > free
              const here = section?.id === r.id
              return (
                <li key={r.id}>
                  <button type="button" onClick={() => go(r.page)} className={`flex w-full items-start gap-2 rounded-lg py-2 text-left ${r.level ? 'pl-6 pr-2 text-[12.5px] text-ink-2' : 'px-2 text-[13px] font-bold text-ink'} ${here ? 'bg-[#e6f4f3]' : ''}`}>
                    <span className="min-w-0 flex-1 leading-snug">{r.title}</span>
                    {locked && <Lock className="mt-0.5 size-3.5 shrink-0 text-muted" />}
                    <span className="shrink-0 tabular-nums text-muted">{r.page}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </BottomSheet>
      )}

      <MobileToast text={toast} onClose={closeToast} bottom={140} />
    </div>
  )
}
