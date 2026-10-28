import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Bookmark, ChevronLeft, ChevronRight, Lock, Menu, Moon, Plus, Search, Trash2, ZoomIn, ZoomOut } from 'lucide-react'
import { Logo } from '../components/icons'
import ShopSidebar from '../components/market/ShopSidebar'
import { getBook } from '../booksData'
import { useCatalogVersion } from '../recordSync'
import { PageView, ZOOM_MAX, ZOOM_MIN, bookFacts, sectionAt, useReaderAccess, useReaderPrefs } from '../components/reader/bookReader'

export default function Reader() {
  const { id } = useParams()
  useCatalogVersion()
  const book = getBook(id)
  if (!book) return <div className="p-10 text-center">Kitob topilmadi. <Link to="/kitoblar" className="text-sea">Kitoblar</Link></div>
  return <DesktopReader key={id} book={book} />
}

function DesktopReader({ book }) {
  const [params] = useSearchParams()
  const facts = useMemo(() => bookFacts(book), [book])
  const reader = useReaderAccess(book)
  const st = useReaderPrefs(book.id, facts.total, Number(params.get('page')) || 0)
  const { page, setPage, zoom, night, marks, notes, setNotes } = st
  const [query, setQuery] = useState('')
  const [find, setFind] = useState(false)
  const [menu, setMenu] = useState(false)
  const [tab, setTab] = useState('marks')
  const [note, setNote] = useState(false)
  const [draft, setDraft] = useState('')
  const full = reader.access === 'yes'
  const free = facts.preview.length
  const section = sectionAt(facts.contents, page)
  const q = query.trim().toLowerCase()
  const shown = q ? facts.contents.filter((r) => r.title.toLowerCase().includes(q)) : facts.contents
  const card = night ? 'bg-[#16202a]' : 'bg-white shadow-card'

  const saveNote = (e) => {
    e.preventDefault()
    setNotes((list) => [{ id: `n-${Date.now()}`, page, title: section?.title || '', text: draft, when: new Date().toLocaleDateString('uz-UZ') }, ...list])
    setDraft(''); setNote(false); setTab('notes')
  }

  return (
    <div className={`min-h-screen ${night ? 'reader-night bg-[#0e141b] text-[#e8eef4]' : 'bg-[#f7fafd] text-ink'}`}>
      <header className={`sticky top-0 z-30 flex h-[46px] items-center gap-3 px-4 ${night ? 'bg-[#121a22]' : 'bg-white shadow-[0_1px_0_#eef2f6]'}`}>
        <button onClick={() => setMenu(true)} className="rounded-lg p-1 lg:hidden" aria-label="Menyu"><Menu className="size-5" /></button>
        <Logo />
        <div className="ml-auto flex items-center gap-1.5">
          <button onClick={st.zoomOut} disabled={zoom <= ZOOM_MIN} className="grid size-8 place-items-center rounded-lg border border-[#e6eef3] disabled:opacity-40" aria-label="Kichraytirish"><ZoomOut className="size-4" /></button>
          <span className="w-10 text-center text-[11px] tabular-nums text-muted">{Math.round(zoom * 100)}%</span>
          <button onClick={st.zoomIn} disabled={zoom >= ZOOM_MAX} className="grid size-8 place-items-center rounded-lg border border-[#e6eef3] disabled:opacity-40" aria-label="Kattalashtirish"><ZoomIn className="size-4" /></button>
          <button onClick={() => st.setNight(!night)} aria-pressed={night} className={`inline-flex h-8 items-center gap-1 rounded-lg border px-2 text-[11px] font-semibold ${night ? 'border-sea text-sea' : 'border-[#e6eef3]'}`}><Moon className="size-3.5" /> Tungi rejim</button>
          <button onClick={st.toggleMark} aria-pressed={marks.includes(page)} className={`inline-flex h-8 items-center gap-1 rounded-lg border px-2 text-[11px] font-semibold ${marks.includes(page) ? 'border-sea text-sea' : 'border-[#e6eef3]'}`}><Bookmark className={`size-3.5 ${marks.includes(page) ? 'fill-sea' : ''}`} /> Xatcho‘p</button>
          {facts.contents.length > 0 && <button onClick={() => setFind((v) => !v)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#e6eef3] px-2 text-[11px] font-semibold"><Search className="size-3.5" /> Qidirish</button>}
        </div>
      </header>
      {find && (
        <div className="border-b border-[#e6eef3] bg-white px-4 py-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Mundarijadan qidirish..." className="h-8 w-full max-w-md rounded-lg bg-[#f2f5f9] px-3 text-[12px] text-ink outline-none" />
        </div>
      )}
      <div className="flex">
        <ShopSidebar active="books" open={menu} onClose={() => setMenu(false)} />
        <main className="min-w-0 flex-1 px-4 py-3">
          <div className="reader-layout">
            <aside className={`self-start rounded-xl p-3 lg:sticky lg:top-[58px] ${card}`}>
              <div className="flex gap-2">
                {book.cover && <img src={book.cover} alt="" className="h-16 w-12 rounded object-cover" />}
                <div className="min-w-0">
                  <p data-testid="reader-title" className="text-[12px] font-bold leading-snug">{facts.title}</p>
                  <p data-testid="reader-author" className="mt-0.5 text-[10px] text-muted">{facts.author}</p>
                  <p className="mt-0.5 text-[10px] text-muted">{[facts.year && `${facts.year}-yil`, `${facts.total} bet`].filter(Boolean).join(' · ')}</p>
                </div>
              </div>
              {facts.contents.length > 0 && (
                <>
                  <p className="mb-1 mt-3 text-[12px] font-bold">Mundarija</p>
                  <ul data-testid="reader-toc" className="grid max-h-[calc(100vh-220px)] gap-0.5 overflow-y-auto pr-1">
                    {shown.map((r) => (
                      <li key={r.id}>
                        <button onClick={() => setPage(r.page)} className={`flex w-full items-start gap-1 rounded-md py-1 text-left text-[11px] ${r.level ? 'pl-4 pr-1' : 'px-1 font-semibold'} ${section?.id === r.id ? 'bg-[#e7f6f4] text-sea' : ''}`}>
                          <span className="min-w-0 flex-1 leading-snug">{r.title}</span>
                          {!full && r.page > free && <Lock className="mt-0.5 size-3 shrink-0 text-muted" />}
                          <span className="shrink-0 text-[10px] tabular-nums text-muted">{r.page}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </aside>

            <article className={`min-w-0 overflow-x-auto rounded-xl p-3 ${card}`}>
              {section && <p className="mb-2 truncate text-[12px] text-sea">{section.title}</p>}
              {!full && free > 0 && page <= free && <p className="mb-2 rounded-lg bg-[#e6f4f3] px-3 py-1.5 text-center text-[11.5px] text-[#0b5b60]">Bepul namuna: 1–{free} bet · to‘liq kitob {facts.total} bet xarid qilganlar uchun</p>}
              <div className="mx-auto max-w-[820px]">
                <PageView book={book} facts={facts} page={page} zoom={zoom} night={night} reader={reader} />
              </div>
            </article>

            <aside className="grid content-start gap-3">
              <div className={`rounded-xl p-3 ${card}`}>
                <div className="flex gap-3 border-b border-[#e6eef3] text-[12px]">
                  <button onClick={() => setTab('marks')} className={`-mb-px border-b-2 pb-1.5 ${tab === 'marks' ? 'border-sea font-semibold text-sea' : 'border-transparent text-muted'}`}>Xatcho‘plar</button>
                  <button onClick={() => setTab('notes')} className={`-mb-px border-b-2 pb-1.5 ${tab === 'notes' ? 'border-sea font-semibold text-sea' : 'border-transparent text-muted'}`}>Mening eslatmalarim</button>
                </div>
                {tab === 'marks' ? (
                  <div className="mt-2 grid gap-1.5">
                    {marks.length === 0 && <p className="text-[11px] text-muted">Hali xatcho‘p yo‘q.</p>}
                    {marks.map((p) => (
                      <div key={p} className="flex items-start gap-2">
                        <button onClick={() => setPage(p)} className="flex min-w-0 flex-1 gap-2 text-left">
                          <Bookmark className="mt-0.5 size-3.5 shrink-0 text-sea" />
                          <span className="min-w-0"><span className="block text-[12px] font-semibold">{p}-bet</span><span className="line-clamp-1 block text-[10px] text-muted">{sectionAt(facts.contents, p)?.title}</span></span>
                        </button>
                        <button aria-label="O‘chirish" onClick={() => st.setMarks((l) => l.filter((x) => x !== p))} className="p-0.5 text-muted"><Trash2 className="size-3.5" /></button>
                      </div>
                    ))}
                    {!marks.includes(page) && <button onClick={st.toggleMark} className="mt-1 h-8 rounded-lg border border-dashed border-sea text-[11px] font-semibold text-sea"><Plus className="mr-1 inline size-3" /> Joriy sahifani xatcho‘pga qo‘shish</button>}
                  </div>
                ) : (
                  <>
                    <NoteList notes={notes} onOpen={setPage} />
                    {note ? (
                      <form onSubmit={saveNote} className="mt-2 grid gap-1">
                        <textarea required value={draft} onChange={(e) => setDraft(e.target.value)} className="h-16 rounded-lg border border-[#e6eef3] p-2 text-[12px] text-ink" placeholder={`${page}-bet uchun eslatma...`} />
                        <button className="h-8 rounded-lg bg-sea text-[11px] font-semibold text-white">Saqlash</button>
                      </form>
                    ) : (
                      <button onClick={() => setNote(true)} className="mt-2 h-8 w-full rounded-lg border border-dashed border-sea text-[11px] font-semibold text-sea"><Plus className="mr-1 inline size-3" /> Yangi eslatma</button>
                    )}
                  </>
                )}
              </div>
            </aside>
          </div>

          <div className={`sticky bottom-2 z-10 mt-3 flex items-center gap-3 rounded-xl px-3 py-2 ${card}`}>
            <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#d7e3ea] px-3 text-[12px] font-semibold disabled:opacity-40"><ChevronLeft className="size-4" /> Oldingi sahifa</button>
            <input type="range" min={1} max={Math.max(1, facts.total)} value={page} onChange={(e) => setPage(Number(e.target.value))} aria-label="Sahifa" className="surplus-range flex-1" style={{ '--p': `${(page / Math.max(1, facts.total)) * 100}%` }} />
            <span data-testid="reader-progress" className="shrink-0 text-[12px] tabular-nums text-muted">{page} / {facts.total} bet</span>
            <button onClick={() => setPage(page + 1)} disabled={page >= facts.total} className="inline-flex h-9 items-center gap-1 rounded-lg bg-sea px-3 text-[12px] font-semibold text-white disabled:opacity-40">Keyingi sahifa <ChevronRight className="size-4" /></button>
          </div>
        </main>
      </div>
    </div>
  )
}

function NoteList({ notes, onOpen }) {
  if (!notes.length) return <p className="mt-2 text-[11px] text-muted">Eslatma yo‘q.</p>
  return (
    <div className="mt-2 grid gap-2">
      {notes.map((n) => (
        <button key={n.id} onClick={() => onOpen(n.page)} className="rounded-lg bg-[#f4fbfb] p-2 text-left text-ink">
          <p className="text-[10px] text-muted">{n.page}-bet{n.title ? ` · ${n.title}` : ''}</p>
          <p className="mt-0.5 text-[11px] leading-snug">{n.text}</p>
          {n.when && <p className="mt-1 text-[10px] text-muted">{n.when}</p>}
        </button>
      ))}
    </div>
  )
}
