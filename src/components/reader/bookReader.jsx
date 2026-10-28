import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Lock } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { useBookAccess } from '../BookPdf'
import { loadBlob, saveBlob, currentUid } from '../../recordSync'

// Real-book reader model. Everything comes from the book record:
//   title / author / year           -> book.*
//   page count                      -> book.pdf.pages (real PDF) or book.pages
//   table of contents               -> book.contents [{ title, page, level }] (page = PDF page,
//                                      read from the book's own contents page by the seed)
//   free preview                    -> book.pdf.preview (first N page images, public)
//   full book                       -> private PDF via short-lived signed URL (buyers/owner/admin)
// Nothing here is invented: no contents -> the TOC is hidden.

export const ZOOM_MIN = 0.6
export const ZOOM_MAX = 2
export const ZOOM_STEP = 0.2

export function bookFacts(book) {
  if (!book) return null
  const total = Number(book.pdf?.pages || book.pages) || 0
  const preview = Array.isArray(book.pdf?.preview) ? book.pdf.preview : []
  const contents = (Array.isArray(book.contents) ? book.contents : [])
    .filter((r) => r && r.title && Number(r.page) >= 1 && (!total || Number(r.page) <= total))
    .map((r, i) => ({ id: `c${i}`, title: r.title, page: Number(r.page), printed: r.printed, level: r.level ? 1 : 0 }))
  return { title: book.title, author: book.author, year: book.year, total, preview, contents, hasPdf: !!book.pdf?.path }
}

// Section that contains `page` (last entry whose page <= page).
export function sectionAt(contents, page) {
  let hit = null
  for (const r of contents) if (r.page <= page) hit = r
  return hit
}
export function chapterAt(contents, page) {
  let hit = null
  for (const r of contents) if (r.level === 0 && r.page <= page) hit = r
  return hit
}

const keyOf = (id) => `stomahub-read-${id}`
const memo = {}
function loadLocal(id) {
  if (memo[id]) return memo[id]
  try { return JSON.parse(localStorage.getItem(keyOf(id))) || {} } catch { return {} }
}

// page / zoom / night / bookmarks / notes, kept per book in localStorage and the
// signed-in user's synced 'reader' blob.
export function useReaderPrefs(id, total, askedPage) {
  const saved = useMemo(() => loadLocal(id), [id])
  const clamp = (p) => Math.max(1, Math.min(total || 1, Math.round(Number(p) || 1)))
  const [page, setPageRaw] = useState(() => clamp(askedPage || saved.page || 1))
  const [zoom, setZoom] = useState(() => (typeof saved.zoom === 'number' ? saved.zoom : 1))
  const [night, setNight] = useState(!!saved.night)
  const [marks, setMarks] = useState(() => (Array.isArray(saved.marks) ? saved.marks.filter((n) => typeof n === 'number') : []))
  const [notes, setNotes] = useState(() => (Array.isArray(saved.notes) ? saved.notes : []))
  const [ready, setReady] = useState(() => !currentUid())

  useEffect(() => {
    if (!currentUid()) return undefined
    let stop = false
    loadBlob('reader').then((payload) => {
      if (stop) return
      const r = payload?.[id]
      if (r) {
        memo[id] = r
        if (r.page && !askedPage) setPageRaw(clamp(r.page))
        if (typeof r.zoom === 'number') setZoom(r.zoom)
        if (r.night != null) setNight(!!r.night)
        if (Array.isArray(r.marks)) setMarks(r.marks.filter((n) => typeof n === 'number'))
        if (Array.isArray(r.notes)) setNotes(r.notes)
      }
      setReady(true)
    })
    return () => { stop = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => { if (total && page > total) setPageRaw(total) }, [total, page])
  useEffect(() => { if (askedPage) setPageRaw(clamp(askedPage)) }, [askedPage]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const next = { page, zoom, night, marks, notes }
    memo[id] = next
    try { localStorage.setItem(keyOf(id), JSON.stringify(next)) } catch { /* storage closed */ }
    if (ready && currentUid()) saveBlob('reader', { ...memo })
  }, [id, page, zoom, night, marks, notes, ready])

  return {
    page, setPage: (p) => setPageRaw(clamp(typeof p === 'function' ? p(page) : p)),
    zoom, zoomIn: () => setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2))), zoomOut: () => setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2))),
    night, setNight, marks, setMarks, notes, setNotes,
    toggleMark: () => setMarks((l) => (l.includes(page) ? l.filter((p) => p !== page) : [...l, page].sort((a, b) => a - b))),
  }
}

// Full PDF (buyers / owner / admin only). Signed URL from the private bucket; pdf.js
// renders one page at a time. The storage policy (0022) is what actually enforces access.
export function useFullPdf(book, access) {
  const [doc, setDoc] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    if (access !== 'yes' || !book?.pdf?.path || !supabase) return undefined
    let live = true
    let task
    ;(async () => {
      try {
        const { data, error: e } = await supabase.storage.from(book.pdf.bucket || 'book-files').createSignedUrl(book.pdf.path, 3600)
        if (e || !data?.signedUrl) throw new Error('PDF ochilmadi')
        const pdfjs = await import('pdfjs-dist')
        const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default
        task = pdfjs.getDocument({ url: data.signedUrl })
        const d = await task.promise
        if (live) setDoc(d)
      } catch (err) {
        if (live) setError(err?.message || 'PDF ochilmadi')
      }
    })()
    return () => { live = false; task?.destroy?.() }
  }, [access, book?.pdf?.path, book?.pdf?.bucket])
  return { doc, error }
}

export function useReaderAccess(book) {
  const access = useBookAccess(book) // idle | checking | yes | no | guest
  const full = useFullPdf(book, access)
  return { access, ...full }
}

function PdfCanvas({ doc, page, zoom, night }) {
  const ref = useRef(null)
  const box = useRef(null)
  const [busy, setBusy] = useState(true)
  const [ratio, setRatio] = useState(1.414)
  useEffect(() => {
    let live = true
    let task
    setBusy(true)
    doc.getPage(page).then((p) => {
      if (!live) return
      const base = p.getViewport({ scale: 1 })
      setRatio(base.height / base.width)
      const width = (box.current?.clientWidth || 600) * zoom
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5)
      const vp = p.getViewport({ scale: (width / base.width) * dpr })
      const c = ref.current
      if (!c) return
      c.width = Math.floor(vp.width); c.height = Math.floor(vp.height)
      task = p.render({ canvasContext: c.getContext('2d'), viewport: vp })
      task.promise.then(() => live && setBusy(false)).catch(() => {})
    })
    return () => { live = false; task?.cancel?.() }
  }, [doc, page, zoom])
  return (
    <div ref={box} className="relative w-full">
      <canvas ref={ref} data-testid="reader-pdf-page" aria-label={`${page}-bet`} className={`block rounded bg-white shadow-card ${night ? 'reader-invert' : ''}`} style={{ width: `${zoom * 100}%`, aspectRatio: `1 / ${ratio}` }} />
      {busy && <div className="absolute inset-0 grid place-items-center"><Loader2 className="size-6 animate-spin text-sea" /></div>}
    </div>
  )
}

export function LockScreen({ book, facts, access, night }) {
  const n = facts.preview.length
  return (
    <div data-testid="reader-lock" className={`grid place-items-center rounded-2xl border px-5 py-10 text-center ${night ? 'border-[#22343f] bg-[#16252f] text-[#e3edf2]' : 'border-line/70 bg-white text-ink'}`}>
      <span className="grid size-12 place-items-center rounded-full bg-[#e6f4f3] text-[#0b6d73]"><Lock className="size-6" /></span>
      <p className="mt-3 text-[15px] font-bold">Bepul namuna {n} bet bilan tugadi</p>
      <p className="mt-1 max-w-[340px] text-[12.5px] leading-snug opacity-80">
        To‘liq kitob ({facts.total} bet) xarid qilganlar uchun ochiq.
        {access === 'guest' ? ' Avval tizimga kiring.' : book.price == null ? ' Narx sotuvchi bilan kelishiladi.' : ''}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {access === 'guest' && <Link to="/kirish" className="inline-flex h-10 items-center rounded-xl bg-[#0b6d73] px-4 text-[13px] font-semibold text-white">Kirish</Link>}
        <Link to={`/kitoblar/${book.id}`} className="inline-flex h-10 items-center rounded-xl border border-[#0b6d73]/50 px-4 text-[13px] font-semibold text-[#0b6d73]">Kitob sahifasi</Link>
      </div>
    </div>
  )
}

// One real page: full PDF page (buyers), preview image (first N pages), or the lock screen.
export function PageView({ book, facts, page, zoom, night, reader }) {
  const { access, doc, error } = reader
  if (!facts.hasPdf && !facts.preview.length) {
    return <p className="rounded-2xl bg-white p-6 text-center text-[13px] text-muted">Bu kitobning elektron nusxasi hali yuklanmagan.</p>
  }
  if (access === 'yes' && doc) return <PdfCanvas doc={doc} page={page} zoom={zoom} night={night} />
  if (access === 'yes' && !error && page > facts.preview.length) {
    return <div className="grid h-[60vh] place-items-center"><Loader2 className="size-7 animate-spin text-sea" /></div>
  }
  if (page <= facts.preview.length) {
    return (
      <div className="w-full" onContextMenu={(e) => e.preventDefault()}>
        <img key={page} src={facts.preview[page - 1]} alt={`${page}-bet`} data-testid="reader-preview-page" draggable={false}
          className={`block select-none rounded bg-white shadow-card ${night ? 'reader-invert' : ''}`} style={{ width: `${zoom * 100}%` }} />
      </div>
    )
  }
  if (access === 'checking' || access === 'idle') return <div className="grid h-[40vh] place-items-center"><Loader2 className="size-7 animate-spin text-sea" /></div>
  return <LockScreen book={book} facts={facts} access={access} night={night} />
}

export const isLocked = (facts, reader, page) => !(reader.access === 'yes') && page > facts.preview.length
