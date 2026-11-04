import { tashkentToday } from '../../tashkentDate'
import { useEffect, useRef, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { MONTHS } from './wizardBits'

const OYLAR = MONTHS.map((m) => m[0].toUpperCase() + m.slice(1))
const KUNLAR = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']
const pad = (n) => String(n).padStart(2, '0')
const iso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`
export const uzLong = (v) => {
  if (!v) return ''
  const [y, m, d] = v.split('-').map(Number)
  return `${d}-${MONTHS[m - 1]}, ${y}`
}

// Yengil kalendar popover: dushanbadan boshlanadi, touch va #root zoom bilan ishlaydi (absolute joylashuv)
export default function DatePick({ value, onChange, min = '', placeholder = 'Sanani tanlang', color = '#0f766e', invalid = false, className = '', label, soft = false }) {
  const [open, setOpen] = useState(false)
  const base = value || min || tashkentToday()
  const [view, setView] = useState(() => { const [y, m] = base.split('-').map(Number); return { y, m: m - 1 } })
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    const [y, m] = base.split('-').map(Number); setView({ y, m: m - 1 })
    const off = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const esc = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', off); document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('pointerdown', off); document.removeEventListener('keydown', esc) }
  }, [open])
  const first = (new Date(view.y, view.m, 1).getDay() + 6) % 7
  const days = new Date(view.y, view.m + 1, 0).getDate()
  const today = tashkentToday()
  const shift = (k) => setView(({ y, m }) => { const t = new Date(y, m + k, 1); return { y: t.getFullYear(), m: t.getMonth() } })
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]
  return (
    <div ref={ref} className={`relative min-w-[148px] flex-1 ${className}`}>
      <button type="button" aria-label={label} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((v) => !v)} className={`flex w-full items-center gap-1.5 border text-left ${soft ? 'h-12 rounded-2xl bg-[#f3fafa] px-3' : 'h-10 rounded-xl bg-white px-2.5'} ${invalid ? 'border-[#e11d48]' : open ? 'border-[var(--color-org-teal)]' : soft ? 'border-transparent' : 'border-[#e3eeec]'}`}>
        <Calendar className="size-4 shrink-0" style={{ color }} />
        <span className={`truncate text-[12.5px] ${value ? 'text-[#143044]' : 'text-[#9aafb4]'}`}>{value ? uzLong(value) : placeholder}</span>
      </button>
      {open && (
        <div role="dialog" aria-label="Kalendar" className="absolute left-0 top-[calc(100%+4px)] z-50 w-[272px] max-w-[calc(100vw-24px)] rounded-2xl border border-[#e6f1ef] bg-white p-2.5 shadow-[0_12px_32px_rgb(16_40_40/0.16)]">
          <div className="mb-1.5 flex items-center justify-between">
            <button type="button" aria-label="Oldingi oy" onClick={() => shift(-1)} className="grid size-9 place-items-center rounded-lg text-[#3e5a62] hover:bg-[#f4fbfa]"><ChevronLeft className="size-4" /></button>
            <p className="text-[13.5px] font-bold text-[#143044]">{OYLAR[view.m]} {view.y}</p>
            <button type="button" aria-label="Keyingi oy" onClick={() => shift(1)} className="grid size-9 place-items-center rounded-lg text-[#3e5a62] hover:bg-[#f4fbfa]"><ChevronRight className="size-4" /></button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center">
            {KUNLAR.map((d) => <span key={d} className="py-1 text-[11px] font-semibold text-[#8aa0a4]">{d}</span>)}
            {cells.map((d, i) => {
              if (!d) return <span key={`e${i}`} />
              const v = iso(view.y, view.m, d)
              const off = !!min && v < min
              const on = v === value
              return (
                <button key={v} type="button" disabled={off} onClick={() => { onChange(v); setOpen(false) }} className={`h-9 rounded-lg text-[13px] ${on ? 'font-bold text-white' : off ? 'text-[#c9d6d8]' : 'text-[#143044] hover:bg-[#e7f6f3]'} ${v === today && !on ? 'ring-1 ring-inset ring-[#bfe3dc]' : ''}`} style={on ? { background: color } : undefined}>{d}</button>
              )
            })}
          </div>
          <div className="mt-1.5 flex justify-between">
            <button type="button" onClick={() => { if (!min || today >= min) { onChange(today); setOpen(false) } }} className="h-8 rounded-lg px-2 text-[12.5px] font-semibold" style={{ color }}>Bugun</button>
            {value && <button type="button" onClick={() => { onChange(''); setOpen(false) }} className="h-8 rounded-lg px-2 text-[12.5px] font-semibold text-[#6e868c]">Tozalash</button>}
          </div>
        </div>
      )}
    </div>
  )
}
