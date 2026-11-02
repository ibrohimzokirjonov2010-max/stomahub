import { useEffect, useRef, useState } from 'react'
import { QrMark } from '../ui'

// O‘z dizayni ustidagi maydonlar: x/y — markaz, % da; size — konteyner kengligiga nisbatan %
export const CERT_FIELDS = [
  ['name', 'Ishtirokchi ismi'],
  ['course', 'Seminar nomi'],
  ['date', 'Sana'],
  ['cme', 'CME ball'],
  ['qr', 'QR kod'],
]
export const DEFAULT_LAYOUT = {
  name: { on: true, x: 50, y: 50, size: 5, color: 'dark' },
  course: { on: false, x: 50, y: 62, size: 2.4, color: 'dark' },
  date: { on: false, x: 22, y: 86, size: 1.8, color: 'dark' },
  cme: { on: false, x: 78, y: 86, size: 1.8, color: 'dark' },
  qr: { on: false, x: 88, y: 80, size: 10, color: 'dark' },
}
export const layoutOf = (design) => {
  const l = design?.layout || {}
  return Object.fromEntries(Object.keys(DEFAULT_LAYOUT).map((k) => [k, { ...DEFAULT_LAYOUT[k], ...(l[k] || {}) }]))
}
export const INK = { dark: '#1b2d38', white: '#ffffff' }
const FONT = { name: '"Great Vibes", "Playfair Display", Georgia, cursive', course: '"Playfair Display", Georgia, serif', date: 'Arial, sans-serif', cme: 'Arial, sans-serif' }

/** Yuklangan dizayn: butun rasm (kesilmaydi), haqiqiy nisbatda; maydonlarni surish mumkin. */
export function CertDesignCanvas({ src, ratio, layout, values, editable = false, onMove, onRatio, className = '' }) {
  const box = useRef(null)
  const [w, setW] = useState(0)
  const [r, setR] = useState(ratio || 0.707)
  const [drag, setDrag] = useState('')
  useEffect(() => {
    const el = box.current
    if (!el) return undefined
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el); setW(el.clientWidth)
    return () => ro.disconnect()
  }, [])
  const move = (k, e) => {
    const rect = box.current.getBoundingClientRect()
    const x = Math.max(2, Math.min(98, ((e.clientX - rect.left) / rect.width) * 100))
    const y = Math.max(2, Math.min(98, ((e.clientY - rect.top) / rect.height) * 100))
    onMove?.(k, { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 })
  }
  return (
    <div ref={box} className={`relative w-full select-none overflow-hidden rounded-lg bg-[#f4f7f7] shadow-[0_8px_22px_rgb(16_70_68/0.12)] ${className}`} style={{ aspectRatio: String(r) }}>
      <img src={src} alt="Sertifikat dizayni" draggable={false} onLoad={(e) => { const n = e.currentTarget; if (n.naturalWidth) { const v = n.naturalWidth / n.naturalHeight; setR(v); onRatio?.(v) } }} className="absolute inset-0 size-full object-contain" />
      {Object.entries(layout).filter(([, f]) => f.on).map(([k, f]) => {
        const style = { left: `${f.x}%`, top: `${f.y}%`, transform: 'translate(-50%,-50%)', touchAction: 'none' }
        const handlers = editable ? {
          onPointerDown: (e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); setDrag(k) },
          onPointerMove: (e) => { if (drag === k) move(k, e) },
          onPointerUp: () => setDrag(''),
          onPointerCancel: () => setDrag(''),
        } : {}
        const ring = editable ? `cursor-grab rounded outline-dashed outline-1 ${drag === k ? 'outline-[#0f766e] cursor-grabbing' : 'outline-[#0f766e]/50'}` : ''
        if (k === 'qr') {
          const s = (f.size / 100) * w
          return <div key={k} {...handlers} className={`absolute bg-white p-[2px] ${ring}`} style={style}><QrMark size={Math.max(12, s)} seed={7} /></div>
        }
        return (
          <div key={k} {...handlers} className={`absolute whitespace-nowrap px-1 leading-tight ${ring}`} style={{ ...style, fontSize: `${(f.size / 100) * w}px`, color: INK[f.color] || INK.dark, fontFamily: FONT[k] }}>
            {values[k] || ''}
          </div>
        )
      })}
    </div>
  )
}

/** Chop etish/PDF uchun xuddi shu joylashuv (mm). */
export function certDesignHtml(design, values, esc = (s) => s) {
  const ratio = design.ratio || 0.707
  const land = ratio > 1
  const W = land ? 297 : 210
  const H = land ? 210 : 297
  const L = layoutOf(design)
  const pos = (f) => `left:${f.x}%;top:${f.y}%;transform:translate(-50%,-50%);`
  const items = Object.entries(L).filter(([k, f]) => f.on && k !== 'qr').map(([k, f]) => `<div style="position:absolute;${pos(f)}white-space:nowrap;font-size:${(f.size / 100) * W}mm;color:${INK[f.color] || INK.dark};font-family:${FONT[k].replace(/"/g, "'")}">${esc(values[k] || '')}</div>`).join('')
  return {
    page: `A4 ${land ? 'landscape' : 'portrait'}`,
    body: `<div style="position:relative;width:${W}mm;height:${H}mm;overflow:hidden"><img src="${esc(design.url)}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain">${items}</div>`,
  }
}

/** O‘z dizayni bilan sertifikatni chop etish/PDF (brauzer “PDF sifatida saqlash”). bg — PDF bo‘lsa birinchi sahifa rasmi. */
export function printDesignCert(design, values, bg) {
  const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]))
  const { page, body } = certDesignHtml({ ...design, url: bg || design.url }, values, esc)
  const win = window.open('', '_blank')
  if (!win) return false
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(values.name || 'Sertifikat')}</title><style>@page{size:${page};margin:0}body{margin:0}</style></head><body>${body}<script>window.onload=()=>window.print()</script></body></html>`)
  win.document.close()
  return true
}
