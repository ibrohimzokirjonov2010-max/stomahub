import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Bookmark, ChevronDown, ChevronLeft, ChevronRight, Menu, Moon, Plus, Search } from 'lucide-react'
import { Logo } from '../components/icons'
import ShopSidebar from '../components/market/ShopSidebar'
import { flatReader, getBook, readerOf } from '../booksData'

export default function Reader() {
  const { id } = useParams()
  const book = getBook(id)
  const doc = book ? readerOf(book) : null
  const rows = useMemo(() => (doc ? flatReader(doc) : []), [doc])
  const [page, setPage] = useState(doc?.start || 1)
  const [open, setOpen] = useState(() => new Set(['c2', 'b']))
  const [size, setSize] = useState(15)
  const [night, setNight] = useState(false)
  const [tab, setTab] = useState('marks')
  const [query, setQuery] = useState('')
  const [find, setFind] = useState(false)
  const [menu, setMenu] = useState(false)
  const [marks, setMarks] = useState(doc?.marks || [])
  const [notes, setNotes] = useState(doc?.notes || [])
  const [note, setNote] = useState(false)
  const [draft, setDraft] = useState('')

  if (!book || !doc) return <div className="p-10 text-center">Kitob topilmadi. <Link to="/kitoblar" className="text-sea">Kitoblar</Link></div>

  const current = [...rows].reverse().find((r) => r.page <= page) || rows[0]
  const view = doc.pagesOf[current.id] || doc.pagesOf[rows[0].id]
  const shown = query.trim()
    ? rows.filter((r) => r.title.toLowerCase().includes(query.trim().toLowerCase()))
    : rows
  const go = (row) => setPage(row.page)
  const addMark = () => {
    if (marks.some((m) => m.id === current.id)) return
    setMarks((list) => [...list, { id: current.id, title: current.title, page, text: (view.lead || '').slice(0, 80) }])
  }
  const saveNote = (e) => {
    e.preventDefault()
    setNotes((list) => [{ id: `n-${Date.now()}`, page, title: current.title, text: draft, when: 'Bugun' }, ...list])
    setDraft('')
    setNote(false)
    setTab('notes')
  }

  return (
    <div className={`min-h-screen ${night ? 'reader-night bg-[#0e141b] text-[#e8eef4]' : 'bg-[#f7fafd] text-ink'}`}>
      <header className={`sticky top-0 z-30 flex h-[46px] items-center gap-3 px-4 ${night ? 'bg-[#121a22]' : 'bg-white shadow-[0_1px_0_#eef2f6]'}`}>
        <button onClick={() => setMenu(true)} className="rounded-lg p-1 lg:hidden" aria-label="Menyu"><Menu className="size-5" /></button>
        <Logo />
        <div className="ml-auto flex items-center gap-1.5">
          <button onClick={() => setSize((n) => Math.max(13, n - 1))} className="grid size-8 place-items-center rounded-lg border border-[#e6eef3] text-[12px] font-bold" aria-label="Kichikroq">A-</button>
          <button onClick={() => setSize((n) => Math.min(20, n + 1))} className="grid size-8 place-items-center rounded-lg border border-[#e6eef3] text-[14px] font-bold" aria-label="Kattaroq">A+</button>
          <button onClick={() => setNight((v) => !v)} className={`inline-flex h-8 items-center gap-1 rounded-lg border px-2 text-[11px] font-semibold ${night ? 'border-sea text-sea' : 'border-[#e6eef3]'}`}><Moon className="size-3.5" /> Tungi rejim</button>
          <button onClick={addMark} className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#e6eef3] px-2 text-[11px] font-semibold"><Bookmark className="size-3.5" /> Xatcho‘p</button>
          <button onClick={() => setFind((v) => !v)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#e6eef3] px-2 text-[11px] font-semibold"><Search className="size-3.5" /> Qidirish</button>
        </div>
      </header>
      {find && (
        <div className="border-b border-[#e6eef3] bg-white px-4 py-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Bob yoki mavzu..." className="h-8 w-full max-w-md rounded-lg bg-[#f2f5f9] px-3 text-[12px] outline-none" />
        </div>
      )}
      <div className="flex">
        <ShopSidebar active="books" open={menu} onClose={() => setMenu(false)} />
        <main className="min-w-0 flex-1 px-4 py-3">
          <div className="reader-layout">
            <aside className={`rounded-xl p-3 ${night ? 'bg-[#16202a]' : 'bg-white shadow-card'}`}>
              <div className="flex gap-2">
                <img src={doc.cover} alt="" className="h-16 w-12 rounded object-cover" />
                <div className="min-w-0">
                  <p className="text-[12px] font-bold leading-snug">{doc.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-[10px] text-muted">{doc.subtitle}</p>
                  <p className="mt-0.5 text-[10px] text-muted">{doc.author}</p>
                </div>
              </div>
              <p className="mb-1 mt-3 text-[12px] font-bold">Mundarija</p>
              <div className="grid gap-0.5">
                {doc.chapters.map((ch) => {
                  const kids = ch.children || []
                  const opened = open.has(ch.id)
                  const visible = !query || shown.some((r) => r.id === ch.id || r.parent === ch.id)
                  if (!visible) return null
                  return (
                    <div key={ch.id}>
                      <button onClick={() => { go(ch); if (kids.length) setOpen((s) => { const n = new Set(s); n.has(ch.id) ? n.delete(ch.id) : n.add(ch.id); return n }) }} className="flex w-full items-center gap-1 py-1 text-left text-[11px]">
                        {kids.length ? <ChevronDown className={`size-3 shrink-0 ${opened ? '' : '-rotate-90'}`} /> : <span className="w-3" />}
                        <span className="min-w-0 flex-1 truncate">{ch.title}</span>
                        <span className="text-[10px] text-muted">{ch.page} bet</span>
                      </button>
                      {opened && kids.map((s) => (
                        <button key={s.id} onClick={() => go(s)} className={`ml-4 flex w-[calc(100%-16px)] items-center justify-between rounded-md px-2 py-1 text-left text-[11px] ${current.id === s.id ? 'bg-[#e7f6f4] font-semibold text-sea' : ''}`}>
                          <span className="truncate">{s.title}</span>
                          <span className="shrink-0 text-[10px] text-muted">{s.page} bet</span>
                        </button>
                      ))}
                    </div>
                  )
                })}
              </div>
            </aside>

            <article className={`rounded-xl p-4 ${night ? 'reader-paper bg-[#16202a]' : 'bg-white shadow-card'}`} style={{ fontSize: size }}>
              <p className="text-[12px] text-sea">{view.kicker}</p>
              <h1 className="mt-1 text-[1.35em] font-extrabold leading-tight">{view.title}</h1>
              <p className="mt-2 leading-relaxed">{view.lead}</p>
              {view.figure && (
                <figure className="mt-3">
                  <img src={view.figure} alt="" className="h-44 w-full rounded-xl object-cover" />
                  {view.labels && <div className="mt-1 grid grid-cols-4 gap-1 text-center text-[10px] text-muted">{view.labels.map((l) => <span key={l}>{l}</span>)}</div>}
                  <figcaption className="mt-1 text-center text-[11px] text-muted">{view.caption}</figcaption>
                </figure>
              )}
              {view.after && <p className="mt-3 leading-relaxed">{view.after}</p>}
              {(view.body || []).map((p) => <p key={p} className="mt-2 leading-relaxed">{p}</p>)}
              {view.nextKicker && <h2 className="mt-4 text-[1.15em] font-extrabold">{view.nextKicker}</h2>}
              {view.nextLead && <p className="mt-1 leading-relaxed">{view.nextLead}</p>}
              {view.point && (
                <div className="mt-2 flex gap-2 rounded-xl bg-[#f4fbfb] p-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-sea text-[12px] font-bold text-white">{view.point.n}</span>
                  <span><span className="block text-[13px] font-bold">{view.point.title}</span><span className="text-[12px] text-ink-2">{view.point.body}</span></span>
                </div>
              )}
            </article>

            <aside className="grid gap-3">
              <div className={`rounded-xl p-3 ${night ? 'bg-[#16202a]' : 'bg-white shadow-card'}`}>
                <div className="flex gap-3 border-b border-[#e6eef3] text-[12px]">
                  <button onClick={() => setTab('marks')} className={`-mb-px border-b-2 pb-1.5 ${tab === 'marks' ? 'border-sea font-semibold text-sea' : 'border-transparent text-muted'}`}>Xatcho‘plar</button>
                  <button onClick={() => setTab('notes')} className={`-mb-px border-b-2 pb-1.5 ${tab === 'notes' ? 'border-sea font-semibold text-sea' : 'border-transparent text-muted'}`}>Mening eslatmalarim</button>
                </div>
                {tab === 'marks' ? (
                  <div className="mt-2 grid gap-2">
                    {marks.length === 0 && <p className="text-[11px] text-muted">Hali xatcho‘p yo‘q.</p>}
                    {marks.map((m) => (
                      <button key={m.id + m.page} onClick={() => setPage(m.page)} className="flex gap-2 text-left">
                        <Bookmark className="mt-0.5 size-3.5 shrink-0 text-sea" />
                        <span><span className="block text-[12px] font-semibold">{m.title}</span><span className="text-[10px] text-muted">{m.page}-bet</span><span className="mt-0.5 line-clamp-2 block text-[10px] text-ink-2">{m.text}</span></span>
                      </button>
                    ))}
                    <button onClick={addMark} className="mt-1 h-8 rounded-lg border border-dashed border-sea text-[11px] font-semibold text-sea"><Plus className="mr-1 inline size-3" /> Joriy sahifani xatcho‘pga qo‘shish</button>
                  </div>
                ) : (
                  <NoteList notes={notes} />
                )}
              </div>
              <div className={`rounded-xl p-3 ${night ? 'bg-[#16202a]' : 'bg-white shadow-card'}`}>
                <p className="text-[13px] font-bold">Mening eslatmalarim</p>
                <NoteList notes={notes} />
                {note ? (
                  <form onSubmit={saveNote} className="mt-2 grid gap-1">
                    <textarea required value={draft} onChange={(e) => setDraft(e.target.value)} className="h-16 rounded-lg border border-[#e6eef3] p-2 text-[12px]" placeholder="Eslatma..." />
                    <button className="h-8 rounded-lg bg-sea text-[11px] font-semibold text-white">Saqlash</button>
                  </form>
                ) : (
                  <button onClick={() => setNote(true)} className="mt-2 h-8 w-full rounded-lg border border-dashed border-sea text-[11px] font-semibold text-sea"><Plus className="mr-1 inline size-3" /> Yangi eslatma</button>
                )}
              </div>
            </aside>
          </div>

          <div className={`sticky bottom-2 z-10 mt-3 flex items-center gap-3 rounded-xl px-3 py-2 ${night ? 'bg-[#16202a]' : 'bg-white shadow-card'}`}>
            <button onClick={() => setPage((n) => Math.max(1, n - 1))} className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#d7e3ea] px-3 text-[12px] font-semibold"><ChevronLeft className="size-4" /> Oldingi sahifa</button>
            <input type="range" min={1} max={doc.pages} value={page} onChange={(e) => setPage(Number(e.target.value))} className="surplus-range flex-1" style={{ '--p': `${(page / doc.pages) * 100}%` }} />
            <span className="shrink-0 text-[12px] text-muted">{page} / {doc.pages} bet</span>
            <button onClick={() => setPage((n) => Math.min(doc.pages, n + 1))} className="inline-flex h-9 items-center gap-1 rounded-lg bg-sea px-3 text-[12px] font-semibold text-white">Keyingi sahifa <ChevronRight className="size-4" /></button>
          </div>
        </main>
      </div>
    </div>
  )
}

function NoteList({ notes }) {
  if (!notes.length) return <p className="mt-2 text-[11px] text-muted">Eslatma yo‘q.</p>
  return (
    <div className="mt-2 grid gap-2">
      {notes.map((n) => (
        <div key={n.id} className="rounded-lg bg-[#f4fbfb] p-2">
          <p className="text-[10px] text-muted">{n.page}-bet · {n.title}</p>
          <p className="mt-0.5 text-[11px] leading-snug">{n.text}</p>
          <p className="mt-1 text-[10px] text-muted">{n.when}</p>
        </div>
      ))}
    </div>
  )
}