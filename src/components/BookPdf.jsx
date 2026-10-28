import { useEffect, useState } from 'react'
import { BookOpen, FileText, Lock, X } from 'lucide-react'
import { supabase } from '../supabaseClient'

// Full PDF lives in the private `book-files` bucket (migration 0022). Only users
// with a book_access row (buyers) — or the book owner / admin — can get a
// short-lived signed URL. Everyone can read the image preview of the first pages.
export function useBookAccess(book) {
  const [state, setState] = useState('idle') // idle | checking | yes | no | guest
  useEffect(() => {
    if (!book?.pdf?.path || !supabase) return undefined
    let live = true
    setState('checking')
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { if (live) setState('guest'); return }
      const { data: ok, error } = await supabase.rpc('my_book_access', { p_book: book.id })
      if (live) setState(!error && ok ? 'yes' : 'no')
    })
    return () => { live = false }
  }, [book?.id, book?.pdf?.path])
  return state
}

export async function openBookPdf(book) {
  const { data, error } = await supabase.storage.from(book.pdf.bucket || 'book-files').createSignedUrl(book.pdf.path, 600)
  if (error || !data?.signedUrl) throw new Error('PDF faqat xarid qilganlar uchun ochiq')
  window.open(data.signedUrl, '_blank', 'noopener')
}

export function BookPreviewModal({ book, onClose }) {
  const pages = book.pdf?.preview || []
  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-black/80" onClick={onClose}>
      <div className="flex items-center justify-between px-4 py-3 text-white" onClick={(e) => e.stopPropagation()}>
        <p className="text-[13px] font-semibold">{book.title} — namuna ({pages.length} / {book.pdf.pages} bet)</p>
        <button onClick={onClose} aria-label="Yopish" className="grid size-8 place-items-center rounded-full bg-white/15"><X className="size-4" /></button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-6" onClick={(e) => e.stopPropagation()} onContextMenu={(e) => e.preventDefault()}>
        <div className="mx-auto grid max-w-[760px] gap-3">
          {pages.map((src, i) => <img key={src} src={src} alt={`${i + 1}-bet`} loading="lazy" draggable={false} className="w-full select-none rounded bg-white" />)}
          <p className="rounded-lg bg-white/10 p-3 text-center text-[12px] text-white">Namuna shu yerda tugadi. To‘liq PDF ({book.pdf.pages} bet) xariddan keyin ochiladi.</p>
        </div>
      </div>
    </div>
  )
}

export default function BookPdfPanel({ book, compact = false }) {
  const access = useBookAccess(book)
  const [preview, setPreview] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  if (!book?.pdf) return null
  const mb = book.pdf.size ? `${(book.pdf.size / 1048576).toFixed(1)} MB` : ''
  const open = async () => {
    setErr(''); setBusy(true)
    try { await openBookPdf(book) } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  const locked = book.price == null
    ? 'To‘liq PDF narx kelishilib, xarid tasdiqlangandan so‘ng ochiladi.'
    : 'To‘liq PDF xariddan so‘ng shu sahifada ochiladi.'
  return (
    <div className={`rounded-xl border border-[#e6eef3] bg-white ${compact ? 'p-3' : 'mt-3 p-3'}`} data-testid="book-pdf">
      <p className="flex items-center gap-1.5 text-[12.5px] font-bold text-ink"><FileText className="size-4 text-sea" /> Elektron nusxa (PDF)</p>
      <p className="mt-0.5 text-[11px] text-muted">{book.pdf.pages} bet{mb && ` · ${mb}`}{book.pdf.previewPages ? ` · ${book.pdf.previewPages} bet bepul namuna` : ''}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {book.pdf.preview?.length > 0 && (
          <button onClick={() => setPreview(true)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#d7e3ea] bg-white px-3 text-[12px] font-semibold text-ink"><BookOpen className="size-3.5 text-sea" /> Namuna o‘qish ({book.pdf.previewPages} bet)</button>
        )}
        {access === 'yes' && (
          <button onClick={open} disabled={busy} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-sea px-3 text-[12px] font-semibold text-white disabled:opacity-60"><FileText className="size-3.5" /> {busy ? 'Ochilmoqda…' : 'To‘liq PDF ni ochish'}</button>
        )}
      </div>
      {access !== 'yes' && access !== 'idle' && (
        <p className="mt-2 flex items-start gap-1.5 text-[11px] text-ink-2"><Lock className="mt-0.5 size-3 shrink-0 text-muted" /> {access === 'guest' ? `Kirish talab qilinadi. ${locked}` : locked}</p>
      )}
      {err && <p className="mt-1 text-[11px] text-sale">{err}</p>}
      {preview && <BookPreviewModal book={book} onClose={() => setPreview(false)} />}
    </div>
  )
}
