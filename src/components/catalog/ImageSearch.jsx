import { useEffect, useRef, useState } from 'react'
import { Camera, ImagePlus, X, Search, RotateCcw, Loader2, ScanSearch, Pencil, Plus } from 'lucide-react'

/* ---------- image helpers (client-side only; nothing is stored) ---------- */

const MAX_SIDE = 1024
const MAX_UPLOAD = 1.4 * 1024 * 1024
const MAX_FILE = 25 * 1024 * 1024

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve({ img, url })
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('bad')) }
    img.src = url
  })
}

/** crop: {x,y,w,h} in 0..1 of the natural image. Returns a JPEG data URL, longest side ≤ 1024. */
export function cropToJpeg(img, crop) {
  const sx = crop.x * img.naturalWidth, sy = crop.y * img.naturalHeight
  const sw = Math.max(1, crop.w * img.naturalWidth), sh = Math.max(1, crop.h * img.naturalHeight)
  const k = Math.min(1, MAX_SIDE / Math.max(sw, sh))
  const c = document.createElement('canvas')
  c.width = Math.round(sw * k); c.height = Math.round(sh * k)
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height)
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height)
  for (const q of [0.85, 0.72, 0.6, 0.45]) {
    const d = c.toDataURL('image/jpeg', q)
    if (d.length * 0.75 < MAX_UPLOAD) return d
  }
  return c.toDataURL('image/jpeg', 0.35)
}

/* ---------- search helpers ---------- */

const STOP = new Set(['dental', 'dentistry', 'stomatologik', 'stomatologiya', 'stomatologiyada', 'material', 'materiali', 'materiallar', 'materiallari', 'mahsulot', 'mahsuloti', 'product', 'uchun', 'for', 'and', 'the', 'with', 'bilan', 'va', 'set', 'kit', 'tool', 'tools'])
export const words = (s) => String(s || '').toLowerCase().replace(/[‘’ʻʼ`']/g, '').split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 3 && !STOP.has(w))

/** Ranks items by how many detected words appear in section.text(item). Reuses the catalog's text(). */
export function rankByTerms(items, text, terms, brand) {
  const ws = [...new Set(terms.flatMap(words))]
  if (!ws.length) return []
  const b = String(brand || '').toLowerCase().trim()
  const norm = (s) => String(s || '').toLowerCase().replace(/[‘’ʻʼ`']/g, '')
  return items
    .map((it) => {
      const t = norm(text(it))
      let score = ws.reduce((n, w) => n + (t.includes(w) ? 1 : 0), 0)
      if (score && b && t.includes(b)) score += 2
      return [it, score]
    })
    .filter(([, s]) => s > 0)
    .sort((a, b2) => b2[1] - a[1])
    .map(([it]) => it)
}

export function termsFrom(r) {
  const seen = new Set()
  return [r.name, r.brand, ...(r.keywords_uz || []), ...(r.keywords_en || [])]
    .map((s) => String(s || '').trim()).filter((s) => s && !seen.has(s.toLowerCase()) && seen.add(s.toLowerCase())).slice(0, 10)
}

/* ---------- camera button ---------- */

export function ImageSearchButton({ onClick, desktop }) {
  return (
    <button type="button" onClick={onClick} aria-label="Rasm orqali qidirish" title="Rasm orqali qidirish" data-testid="image-search-btn"
      className={`grid ${desktop ? 'size-12' : 'size-11'} shrink-0 place-items-center rounded-2xl border border-line/70 bg-white text-[#0F766E] active:scale-95`}>
      <Camera className="size-[19px]" />
    </button>
  )
}

/* ---------- crop box ---------- */

const MIN = 0.08
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

function CropArea({ src, crop, setCrop }) {
  const wrap = useRef(null)
  const drag = useRef(null)
  const start = (mode) => (e) => {
    e.preventDefault(); e.stopPropagation()
    const r = wrap.current.getBoundingClientRect()
    drag.current = { mode, x: e.clientX, y: e.clientY, r, c: crop, id: e.pointerId }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const move = (e) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dx = (e.clientX - d.x) / d.r.width, dy = (e.clientY - d.y) / d.r.height
    const c = d.c
    if (d.mode === 'move') return setCrop({ ...c, x: clamp(c.x + dx, 0, 1 - c.w), y: clamp(c.y + dy, 0, 1 - c.h) })
    let { x, y, w, h } = c
    if (d.mode.includes('l')) { const nx = clamp(x + dx, 0, x + w - MIN); w += x - nx; x = nx }
    if (d.mode.includes('r')) w = clamp(w + dx, MIN, 1 - x)
    if (d.mode.includes('t')) { const ny = clamp(y + dy, 0, y + h - MIN); h += y - ny; y = ny }
    if (d.mode.includes('b')) h = clamp(h + dy, MIN, 1 - y)
    setCrop({ x, y, w, h })
  }
  const end = () => { drag.current = null }
  const handle = (mode, pos) => (
    <span key={mode} onPointerDown={start(mode)} onPointerMove={move} onPointerUp={end} onPointerCancel={end}
      className={`absolute ${pos} z-10 grid size-11 place-items-center`} style={{ touchAction: 'none' }} aria-hidden="true">
      <span className="size-[18px] rounded-full border-[3px] border-white bg-[#0F766E] shadow-[0_1px_6px_rgb(0_0_0/0.4)]" />
    </span>
  )
  const pct = (v) => `${v * 100}%`
  return (
    <div className="relative mx-auto w-fit select-none" style={{ touchAction: 'none' }}>
      <div ref={wrap} className="relative" data-testid="image-search-crop">
        <img src={src} alt="Tanlangan rasm" draggable={false} className="block max-h-[calc(100dvh/var(--z,1)-300px)] max-w-full rounded-xl object-contain md:max-h-[calc(100dvh/var(--z,1)-330px)]" style={{ minHeight: 120 }} />
        {/* dim outside the selection */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
          <div className="absolute rounded-md" style={{ left: pct(crop.x), top: pct(crop.y), width: pct(crop.w), height: pct(crop.h), boxShadow: '0 0 0 9999px rgb(11 31 58 / 0.55)' }} />
        </div>
        <div onPointerDown={start('move')} onPointerMove={move} onPointerUp={end} onPointerCancel={end}
          className="absolute cursor-move rounded-md border-2 border-white outline outline-2 outline-[#0F766E]" style={{ left: pct(crop.x), top: pct(crop.y), width: pct(crop.w), height: pct(crop.h), touchAction: 'none' }}>
          {handle('tl', '-left-[22px] -top-[22px]')}
          {handle('tr', '-right-[22px] -top-[22px]')}
          {handle('bl', '-bottom-[22px] -left-[22px]')}
          {handle('br', '-bottom-[22px] -right-[22px]')}
        </div>
      </div>
    </div>
  )
}

/* ---------- dialog ---------- */

const FULL = { x: 0, y: 0, w: 1, h: 1 }

export function ImageSearchDialog({ onClose, onResult, desktop }) {
  const [pic, setPic] = useState(null) // { img, url }
  const [crop, setCrop] = useState(FULL)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const camRef = useRef(null)
  const galRef = useRef(null)
  useEffect(() => () => { if (pic) URL.revokeObjectURL(pic.url) }, [pic])
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const esc = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', esc) }
  }, [onClose])

  const pick = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setErr('')
    if (!/^image\//.test(f.type) && !/\.(jpe?g|png|webp|heic|heif)$/i.test(f.name)) return setErr('Faqat rasm faylini tanlang')
    if (f.size > MAX_FILE) return setErr('Rasm juda katta (25 MB dan oshmasin)')
    try { setPic(await loadImage(f)); setCrop(FULL) } catch { setErr('Rasmni ochib bo‘lmadi. Boshqa rasm tanlang.') }
  }

  const run = async () => {
    if (!pic || busy) return
    setBusy(true); setErr('')
    try {
      const image = cropToJpeg(pic.img, crop)
      const r = await fetch('/api/image-search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image }) })
      let j = null
      try { j = await r.json() } catch { /* non-JSON */ }
      if (!r.ok || !j?.ok) throw new Error(j?.error || (r.status === 404 ? 'Rasm qidiruvi hali sozlanmagan' : 'Rasmni tahlil qilib bo‘lmadi. Qayta urinib ko‘ring.'))
      onResult({ ...j, thumb: image })
    } catch (e2) {
      setErr(e2.message && !/fetch|network/i.test(e2.message) ? e2.message : 'Internet aloqasini tekshirib, qayta urinib ko‘ring.')
    } finally { setBusy(false) }
  }

  const btn = 'flex h-12 items-center justify-center gap-2 rounded-xl text-[14px] font-semibold active:scale-[0.98]'
  return (
    <div className="fixed inset-0 z-[80] flex bg-[#0b1f3a]/55 md:items-center md:justify-center md:p-6" style={{ height: 'calc(100dvh / var(--z, 1))' }}
      onMouseDown={(e) => { if (desktop && e.target === e.currentTarget) onClose() }} data-testid="image-search-dialog">
      <div role="dialog" aria-modal="true" aria-label="Rasm orqali qidirish"
        className="flex w-full flex-col bg-white md:max-h-[calc(100dvh/var(--z,1)-48px)] md:max-w-[620px] md:rounded-2xl md:shadow-2xl"
        style={desktop ? undefined : { height: '100%', paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center justify-between gap-3 border-b border-line/70 px-4 py-3">
          <div className="min-w-0">
            <h2 className="text-[17px] font-bold text-[#0d2a4a]">Rasm orqali qidirish</h2>
            <p className="text-[12px] text-ink-2">{pic ? 'Mahsulot turgan joyni ramka bilan belgilang' : 'Mahsulotni suratga oling yoki rasm yuklang'}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Yopish" className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f1f5f7] text-ink"><X className="size-5" /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 [-webkit-overflow-scrolling:touch]">
          {!pic ? (
            <div className="flex flex-col items-center px-2 py-6 text-center">
              <span className="grid size-20 place-items-center rounded-3xl bg-[#e6f4f1] text-[#0F766E]"><ScanSearch className="size-10" strokeWidth={1.6} /></span>
              <p className="mt-4 text-[15px] font-semibold text-[#0d2a4a]">Mahsulotni rasmdan toping</p>
              <p className="mt-1 max-w-[320px] text-[12.5px] leading-snug text-ink-2">Qadoq, asbob yoki materialni suratga oling — sun’iy intellekt uning nomini aniqlaydi va marketplace’dan o‘xshash mahsulotlarni qidiradi.</p>
              <div className="mt-6 grid w-full max-w-[360px] gap-2.5">
                {!desktop && <button type="button" onClick={() => camRef.current?.click()} className={`${btn} bg-[#0F766E] text-white`}><Camera className="size-5" /> Suratga olish</button>}
                <button type="button" onClick={() => galRef.current?.click()} className={`${btn} ${desktop ? 'bg-[#0F766E] text-white' : 'border border-line bg-white text-[#0d2a4a]'}`}><ImagePlus className="size-5" /> {desktop ? 'Rasm yuklash' : 'Galereyadan tanlash'}</button>
              </div>
              <p className="mt-4 text-[11px] text-muted">Rasm faqat tahlil uchun yuboriladi va saqlanmaydi.</p>
            </div>
          ) : (
            <>
              <CropArea src={pic.url} crop={crop} setCrop={setCrop} />
              <div className="mt-3 flex items-center justify-center gap-2">
                <button type="button" onClick={() => setCrop(FULL)} className="flex h-9 items-center gap-1.5 rounded-xl border border-line px-3 text-[12.5px] font-medium text-ink"><RotateCcw className="size-4" /> Butun rasm</button>
                <button type="button" onClick={() => galRef.current?.click()} className="flex h-9 items-center gap-1.5 rounded-xl border border-line px-3 text-[12.5px] font-medium text-ink"><ImagePlus className="size-4" /> Boshqa rasm</button>
              </div>
            </>
          )}
          {err && <p role="alert" data-testid="image-search-error" className="mx-auto mt-3 max-w-[420px] rounded-xl bg-[#fff1f0] px-3 py-2 text-center text-[12.5px] font-medium text-[#b42318]">{err}</p>}
        </div>

        {pic && (
          <div className="flex gap-2 border-t border-line/70 px-4 pt-3" style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
            <button type="button" onClick={onClose} className={`${btn} border border-line px-4 text-ink`}>Bekor qilish</button>
            <button type="button" onClick={run} disabled={busy} data-testid="image-search-run" className={`${btn} flex-1 bg-[#0F766E] text-white disabled:opacity-70`}>
              {busy ? <><Loader2 className="size-5 animate-spin" /> Aniqlanmoqda…</> : <><Search className="size-5" /> Qidirish</>}
            </button>
          </div>
        )}
        <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={pick} />
        <input ref={galRef} type="file" accept="image/*" className="hidden" onChange={pick} data-testid="image-search-file" />
      </div>
    </div>
  )
}

/* ---------- result banner with editable chips ---------- */

export function ImageSearchBanner({ vis, setTerms, onClear, count, desktop }) {
  const [edit, setEdit] = useState(-1)
  const [val, setVal] = useState('')
  const save = () => {
    const v = val.trim()
    const next = [...vis.terms]
    if (edit === next.length) { if (v) next.push(v) } else if (v) next[edit] = v; else next.splice(edit, 1)
    setTerms(next); setEdit(-1); setVal('')
  }
  return (
    <div data-testid="image-search-banner" className="mt-3 rounded-2xl border border-[#0F766E]/25 bg-[#effaf8] p-3">
      <div className="flex items-start gap-3">
        {vis.thumb && <img src={vis.thumb} alt="" className={`${desktop ? 'size-16' : 'size-14'} shrink-0 rounded-xl bg-white object-cover ring-1 ring-line`} />}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#0F766E]">Rasm bo‘yicha qidiruv</p>
          <p className="truncate text-[14.5px] font-bold text-[#0d2a4a]">{vis.name || 'Mahsulot aniqlanmadi'}</p>
          <p className="truncate text-[11.5px] text-ink-2">{[vis.brand, vis.category].filter(Boolean).join(' · ')}{count != null ? `${vis.brand || vis.category ? ' · ' : ''}${count} ta natija` : ''}</p>
        </div>
        <button type="button" onClick={onClear} aria-label="Rasm qidiruvini bekor qilish" className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-ink ring-1 ring-line"><X className="size-4" /></button>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5" data-testid="image-search-chips">
        {vis.terms.map((t, i) => (edit === i ? (
          <input key={`e${i}`} autoFocus value={val} onChange={(e) => setVal(e.target.value)} onBlur={save} onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setEdit(-1) } }}
            className="h-8 w-[160px] rounded-full border border-[#0F766E] bg-white px-3 text-[16px] text-ink outline-none md:text-[12.5px]" />
        ) : (
          <span key={t + i} className="flex h-8 items-center gap-1 rounded-full bg-white pl-3 pr-1 text-[12.5px] font-medium text-[#0d2a4a] ring-1 ring-line">
            <button type="button" onClick={() => { setEdit(i); setVal(t) }} className="flex max-w-[200px] items-center gap-1 truncate" aria-label={`${t} — tahrirlash`}>{t}<Pencil className="size-3 shrink-0 text-muted" /></button>
            <button type="button" onClick={() => setTerms(vis.terms.filter((_, k) => k !== i))} aria-label={`${t} — olib tashlash`} className="grid size-6 place-items-center rounded-full text-muted"><X className="size-3.5" /></button>
          </span>
        )))}
        {edit === vis.terms.length ? (
          <input autoFocus value={val} placeholder="So‘z qo‘shing" onChange={(e) => setVal(e.target.value)} onBlur={save} onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEdit(-1) }}
            className="h-8 w-[160px] rounded-full border border-[#0F766E] bg-white px-3 text-[16px] text-ink outline-none md:text-[12.5px]" />
        ) : (
          <button type="button" onClick={() => { setEdit(vis.terms.length); setVal('') }} className="flex h-8 items-center gap-1 rounded-full border border-dashed border-[#0F766E]/60 px-3 text-[12.5px] font-medium text-[#0F766E]"><Plus className="size-3.5" /> So‘z qo‘shish</button>
        )}
      </div>
    </div>
  )
}
