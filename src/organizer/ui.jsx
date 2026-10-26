import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { MONTHS } from './data'

export const cx = (...a) => a.filter(Boolean).join(' ')

export function Btn({ children, onClick, to, kind = 'primary', type = 'button', disabled, className, ariaLabel }) {
  const cls = cx(
    'inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-3.5 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
    kind === 'primary' && 'bg-[var(--color-org-teal)] text-white shadow-[0_6px_14px_rgb(12_143_134/0.25)] hover:bg-[#0a7e76]',
    kind === 'ghost' && 'border border-[#d5ebe6] bg-white text-[var(--color-org-teal)] hover:bg-[#f3fbfa]',
    kind === 'soft' && 'border border-[#e4eeec] bg-white text-[#1c4a5a] hover:bg-[#f7fbfb]',
    kind === 'danger' && 'bg-[var(--color-org-teal)] text-white hover:bg-[#0a7e76]',
    className,
  )
  if (to) return <Link to={to} className={cls} aria-label={ariaLabel}>{children}</Link>
  return <button type={type} onClick={onClick} disabled={disabled} className={cls} aria-label={ariaLabel}>{children}</button>
}

export function Crumb({ items }) {
  return (
    <nav className="mb-1 flex flex-wrap items-center gap-1 text-[12px] text-[#8aa0a4]">
      {items.map((it, i) => (
        <span key={it.label} className="inline-flex items-center gap-1">
          {i > 0 && <ChevronRight className="size-3" />}
          {it.to ? <Link to={it.to} className="hover:text-[var(--color-org-teal)]">{it.label}</Link> : <span className={i === items.length - 1 ? 'text-[#5e787e]' : ''}>{it.label}</span>}
        </span>
      ))}
    </nav>
  )
}

export function PageHead({ crumb, title, sub, extra }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        {crumb && <Crumb items={crumb} />}
        <h1 className="text-[22px] font-bold leading-tight tracking-tight text-[#143044]">{title}</h1>
        {sub && <p className="mt-1 max-w-[640px] text-[13px] leading-snug text-[#6e868c]">{sub}</p>}
      </div>
      {extra && <div className="flex flex-wrap items-center gap-2">{extra}</div>}
    </div>
  )
}

export function Card({ title, extra, children, className, bodyClass, pad = true }) {
  return (
    <section className={cx('rounded-2xl border border-[#e6f1ef] bg-white shadow-[0_1px_2px_rgb(16_40_40/0.04)]', className)}>
      {(title || extra) && (
        <div className="flex items-center justify-between gap-3 px-4 pt-3.5">
          {title ? <h2 className="text-[14.5px] font-bold text-[#143044]">{title}</h2> : <span />}
          {extra}
        </div>
      )}
      <div className={cx(pad && 'p-4', (title || extra) && pad && 'pt-3')}>{children}</div>
    </section>
  )
}

const TONE = {
  green: 'bg-[#e7f8ee] text-[#16a34a]',
  orange: 'bg-[#fff4e0] text-[#d0890b]',
  red: 'bg-[#fde8ee] text-[#e11d48]',
  teal: 'bg-[#e7f6f3] text-[var(--color-org-teal)]',
  slate: 'bg-[#eef2f3] text-[#5f7278]',
  outline: 'border border-[#bfe3da] bg-[#f6fdfb] text-[var(--color-org-teal)]',
  pink: 'bg-[#fdecef] text-[#e11d48]',
}

export function Badge({ tone = 'green', children, dot, className }) {
  return (
    <span className={cx('inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full px-2 text-[11.5px] font-semibold', TONE[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

export function Kpi({ icon: Icon, label, value, delta, hint, hintClass, down, foot, progress, iconBg = 'bg-[#e7f7f4] text-[var(--color-org-teal)]' }) {
  return (
    <article className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#e6f1ef] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgb(16_40_40/0.03)]">
      <span className={cx('grid size-11 shrink-0 place-items-center rounded-2xl', iconBg)}><Icon className="size-5" strokeWidth={1.8} /></span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] text-[#6e868c]">{label}</p>
        <p className="truncate text-[18px] font-bold leading-tight tracking-tight text-[#143044] sm:text-[20px]">{value}</p>
        {progress != null && (
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#e7f1ef]">
            <div className="h-full rounded-full bg-[#14a394]" style={{ width: `${progress}%` }} />
          </div>
        )}
        {(delta || hint || foot) && (
          <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-[#6e868c]">
            {delta && (
              <span className={cx('inline-flex items-center gap-0.5 font-semibold', down ? 'text-[#e11d48]' : 'text-[#16a34a]')}>
                {down ? '↓' : '↑'} {delta}
              </span>
            )}
            {foot && <span className={cx('font-semibold', down ? 'text-[#e11d48]' : 'text-[#16a34a]')}>{foot}</span>}
            {hint && <span className={cx('truncate', hintClass)}>{hint}</span>}
          </p>
        )}
      </div>
    </article>
  )
}

export function MiniSelect({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const fn = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex h-8 items-center gap-1 rounded-lg border border-[#e6eeec] bg-white px-2.5 text-[12px] text-[#3e5a62]">
        {value || label} <ChevronDown className="size-3.5 text-[#8aa4a8]" />
      </button>
      {open && options && (
        <ul className="absolute right-0 z-30 mt-1 min-w-[160px] overflow-hidden rounded-xl border border-[#e6eeec] bg-white py-1 shadow-lg">
          {options.map((o) => (
            <li key={o}>
              <button type="button" className="block w-full px-3 py-1.5 text-left text-[12.5px] hover:bg-[#f4fbfa]" onClick={() => { onChange?.(o); setOpen(false) }}>{o}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function Select({ value, onChange, options, className }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const fn = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])
  const current = options.find((o) => o.value === value) || options[0]
  return (
    <div ref={ref} className={cx('relative', className)}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-[#e4eeec] bg-white px-3 text-[12.5px] text-[#3e5a62]">
        <span className="truncate">{current?.label}</span>
        <ChevronDown className="size-3.5 shrink-0 text-[#8aa4a8]" />
      </button>
      {open && (
        <ul className="absolute left-0 z-30 mt-1 max-h-64 w-full min-w-[180px] overflow-auto rounded-xl border border-[#e6eeec] bg-white py-1 shadow-lg">
          {options.map((o) => (
            <li key={o.value}>
              <button type="button" className={cx('block w-full px-3 py-1.5 text-left text-[12.5px] hover:bg-[#f4fbfa]', o.value === value && 'font-semibold text-[var(--color-org-teal)]')} onClick={() => { onChange(o.value); setOpen(false) }}>{o.label}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function SearchBox({ value, onChange, placeholder, className }) {
  return (
    <label className={cx('flex h-10 min-w-0 items-center gap-2 rounded-xl border border-[#e4eeec] bg-white px-3', className)}>
      <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-[#8aa4a8]" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" /></svg>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-[#9aafb4]" />
    </label>
  )
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tabs.map((t) => (
        <button key={t.id} type="button" onClick={() => onChange(t.id)} className={cx('h-9 rounded-full px-3 text-[12.5px] font-semibold', value === t.id ? 'bg-[var(--color-org-teal)] text-white' : 'border border-[#e5eeec] bg-white text-[#3e5a62] hover:bg-[#f6fbfa]')}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

export function Field({ label, req, error, children, hint }) {
  return (
    <label className="block min-w-0">
      {label && <span className="mb-1.5 flex items-center gap-1 text-[12.5px] font-medium text-[#1c4a5a]">{label}{req && <span className="text-[#e11d48]">*</span>}</span>}
      {children}
      {error ? <span className="mt-1 block text-[11.5px] text-[#e11d48]">{error}</span> : hint ? <span className="mt-1 block text-[11.5px] text-[#8aa0a4]">{hint}</span> : null}
    </label>
  )
}

export const inputCls = (bad) => cx('h-10 w-full rounded-xl border bg-white px-3 text-[13px] text-[#143044] outline-none placeholder:text-[#9aafb4]', bad ? 'border-[#e11d48]' : 'border-[#e3eeec] focus:border-[var(--color-org-teal)]')

export function Modal({ open, title, sub, onClose, children, width = 440 }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-[#0e2433]/45 p-4" onMouseDown={onClose}>
      <div className="max-h-[calc(100dvh/var(--z)-32px)] w-full overflow-y-auto rounded-2xl bg-white shadow-2xl" style={{ maxWidth: width }} onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="flex items-start justify-between gap-3 px-5 pt-4">
          <div>
            <h3 className="text-[16px] font-bold text-[#143044]">{title}</h3>
            {sub && <p className="mt-0.5 text-[12.5px] text-[#6e868c]">{sub}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Yopish" className="grid size-8 place-items-center rounded-lg text-[#7e9398] hover:bg-[#f4f7f7]"><X className="size-4" /></button>
        </div>
        <div className="p-5 pt-3">{children}</div>
      </div>
    </div>
  )
}

export function pageWindow(page, pages) {
  const set = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages))
  const nums = [...set].sort((a, b) => a - b)
  const out = []
  let prev = 0
  for (const n of nums) {
    if (prev && n - prev > 1) out.push('…')
    out.push(n)
    prev = n
  }
  return out
}

export function Pager({ page, pages, from, to, total, per, onPage, onPer, perOptions = [10, 20, 50] }) {
  if (!total) return <p className="px-4 py-3 text-[12.5px] text-[#7e9398]">Hech narsa topilmadi</p>
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f0f5f4] px-3 py-3">
      <div className="flex items-center gap-2 text-[12.5px] text-[#6e868c]">
        <Select value={per} onChange={onPer} options={perOptions.map((n) => ({ value: n, label: String(n) }))} className="w-[72px]" />
        <span>dan {from}–{to} gacha, jami {total.toLocaleString('ru-RU').replace(/\u00a0/g, ' ')} ta</span>
      </div>
      <div className="flex items-center gap-1">
        <button type="button" aria-label="Oldingi" disabled={page <= 1} onClick={() => onPage(page - 1)} className="grid size-8 place-items-center rounded-lg text-[#5e787e] disabled:opacity-40"><ChevronLeft className="size-4" /></button>
        {pageWindow(page, pages).map((n, i) => n === '…'
          ? <span key={`e${i}`} className="px-1 text-[12px] text-[#8aa0a4]">…</span>
          : <button key={n} type="button" onClick={() => onPage(n)} className={cx('grid h-8 min-w-8 place-items-center rounded-lg px-2 text-[12.5px] font-semibold', n === page ? 'bg-[var(--color-org-teal)] text-white' : 'text-[#3e5a62] hover:bg-[#f4fbfa]')}>{n}</button>)}
        <button type="button" aria-label="Keyingi" disabled={page >= pages} onClick={() => onPage(page + 1)} className="grid size-8 place-items-center rounded-lg text-[#5e787e] disabled:opacity-40"><ChevronRight className="size-4" /></button>
      </div>
    </div>
  )
}

export function usePager(rows, perDefault = 10) {
  const [page, setPage] = useState(1)
  const [per, setPer] = useState(perDefault)
  const pages = Math.max(1, Math.ceil(rows.length / per))
  const safe = Math.min(page, pages)
  const slice = rows.slice((safe - 1) * per, safe * per)
  return {
    page: safe,
    pages,
    per,
    slice,
    from: rows.length ? (safe - 1) * per + 1 : 0,
    to: Math.min(safe * per, rows.length),
    total: rows.length,
    setPage,
    setPer: (n) => { setPer(Number(n)); setPage(1) },
  }
}

export function BarChart({ values, max, format, height = 168, ticks }) {
  const [tip, setTip] = useState(null)
  const labels = ticks || [max, Math.round(max * 0.75), Math.round(max * 0.5), Math.round(max * 0.25), 0]
  return (
    <div>
      <div className="flex gap-2" style={{ height }}>
        <div className="flex h-full w-8 shrink-0 flex-col justify-between pb-0 text-[10px] text-[#9aafb4]">
          {labels.map((n) => <span key={String(n)}>{ticks ? n : (format ? format(n) : n)}</span>)}
        </div>
        <div className="flex min-w-0 flex-1 items-end gap-1 border-b border-[#eef3f2] sm:gap-1.5">
          {values.map((v, i) => (
            <button key={MONTHS[i]} type="button" className="relative flex h-full min-w-0 flex-1 items-end" onMouseEnter={() => setTip(i)} onMouseLeave={() => setTip(null)}>
              {tip === i && <span className="absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#12324a] px-1.5 py-0.5 text-[10px] text-white">{MONTHS[i]} · {format ? format(v) : v}</span>}
              <span className="block w-full rounded-t-[5px] bg-[linear-gradient(180deg,#7edfd4_0%,#0e8f84_100%)]" style={{ height: `${Math.max(4, (v / max) * 100)}%` }} />
            </button>
          ))}
        </div>
      </div>
      <div className="ml-10 mt-1.5 flex gap-1 sm:gap-1.5">
        {MONTHS.map((m) => <span key={m} className="flex-1 text-center text-[10px] text-[#8aa4a8]">{m}</span>)}
      </div>
    </div>
  )
}

export function LineChart({ values, max, tipIndex = 10, tipTitle, tipText }) {
  const w = 360
  const h = 132
  const step = w / (values.length - 1)
  const y = (v) => h - 18 - (v / max) * (h - 28)
  const pts = values.map((v, i) => [i * step, y(v)])
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const area = `${d} L${w},${h} L0,${h} Z`
  const dot = pts[tipIndex]
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-[148px] w-full">
        {[0, 1, 2, 3].map((i) => <line key={i} x1="0" x2={w} y1={(h / 4) * i + 4} y2={(h / 4) * i + 4} stroke="#eef3f2" />)}
        <path d={area} fill="rgb(20 163 148 / 0.14)" />
        <path d={d} fill="none" stroke="#12a394" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={dot[0]} cy={dot[1]} r="4.5" fill="#fff" stroke="#12a394" strokeWidth="2.4" />
      </svg>
      <div className="pointer-events-none absolute rounded-lg bg-[#16324a] px-2 py-1 text-[10.5px] leading-tight text-white shadow" style={{ left: `${(dot[0] / w) * 100}%`, top: 0, transform: 'translate(-40%, 0)' }}>
        {tipTitle}<br />{tipText}
      </div>
      <div className="mt-1 flex">
        {MONTHS.map((m) => <span key={m} className="flex-1 text-center text-[10px] text-[#8aa4a8]">{m}</span>)}
      </div>
    </div>
  )
}

export function Donut({ parts, center, sub, size = 128 }) {
  let acc = 0
  const stops = parts.map((p) => {
    const next = acc + p.pct
    const s = `${p.color} ${acc}% ${next}%`
    acc = next
    return s
  }).join(',')
  return (
    <div className="flex items-center gap-3">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${stops})` }} />
        <div className="absolute inset-[18%] grid place-items-center rounded-full bg-white text-center">
          <div>
            <div className="text-[15px] font-bold leading-none text-[#143044]">{center}</div>
            {sub && <div className="mt-0.5 text-[10px] text-[#7e9398]">{sub}</div>}
          </div>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-1.5">
        {parts.map((t) => (
          <li key={t.label} className="grid grid-cols-[10px_minmax(0,1fr)_auto_auto] items-center gap-1.5 text-[12px]">
            <span className="size-2.5 rounded-full" style={{ background: t.color }} />
            <span className="truncate text-[#3e5a62]">{t.label}</span>
            <span className="font-semibold text-[#143044]">{t.pct}%</span>
            <span className="w-10 text-right text-[#7e9398]">{t.n}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function QrMark({ size = 112, seed = 1 }) {
  const n = 25
  const cells = []
  const on = (x, y) => {
    const finder = (fx, fy) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7
    if (finder(0, 0) || finder(n - 7, 0) || finder(0, n - 7)) {
      const lx = x < 8 ? x : x >= n - 7 ? x - (n - 7) : x
      const ly = y < 8 ? y : y >= n - 7 ? y - (n - 7) : y
      const edge = lx === 0 || ly === 0 || lx === 6 || ly === 6
      const core = lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4
      return edge || core
    }
    return ((x * 17 + y * 13 + seed * 31) % 7) > 2
  }
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (on(x, y)) cells.push(`${x},${y}`)
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox={`0 0 ${n} ${n}`} width={size} height={size} className="rounded bg-white" aria-hidden>
      <rect width={n} height={n} fill="#fff" />
      {cells.map((k) => {
        const [x, y] = k.split(',')
        return <rect key={`${id}-${k}`} x={x} y={y} width="1" height="1" fill="#143044" />
      })}
    </svg>
  )
}

export function Person({ name, sub, avatar, size = 32 }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <img src={avatar} alt="" className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
      <span className="min-w-0">
        <span className="block truncate text-[12.5px] font-semibold text-[#143044]">{name}</span>
        {sub && <span className="block truncate text-[11px] text-[#8aa0a4]">{sub}</span>}
      </span>
    </span>
  )
}

export function MenuBtn({ items }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const fn = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button type="button" aria-label="Yana" onClick={() => setOpen((v) => !v)} className="grid size-8 place-items-center rounded-lg text-[#8aa4a8] hover:bg-[#f4fbfa]">
        <svg viewBox="0 0 24 24" className="size-4" fill="currentColor"><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg>
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-44 overflow-hidden rounded-xl border border-[#e6eeec] bg-white py-1 shadow-lg">
          {items.map((it) => {
            const Icon = it.icon
            return (
              <button key={it.label} type="button" className={cx('flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] hover:bg-[#f4fbfa]', it.danger && 'text-[#e11d48]')} onClick={() => { setOpen(false); it.onClick?.() }}>
                {Icon && <Icon className="size-4" />}
                {it.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function Toggle({ on, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label || 'Holat'} onClick={() => onChange(!on)} className={cx('relative h-6 w-11 rounded-full transition', on ? 'bg-[var(--color-org-teal)]' : 'bg-[#d5e0e2]')}>
      <span className={cx('absolute top-0.5 size-5 rounded-full bg-white shadow transition', on ? 'left-[22px]' : 'left-0.5')} />
    </button>
  )
}

export function Empty({ text }) {
  return <p className="py-8 text-center text-[13px] text-[#7e9398]">{text}</p>
}

export function CertificateCard({ name, course, date = '24-noyabr 2026', template = 'teal' }) {
  const skin = {
    teal: 'from-[#0c6e72] via-[#14948c] to-[#0d7c74]',
    gold: 'from-[#8a6a2f] via-[#c6a15a] to-[#8d7040]',
    minimal: 'from-white via-white to-[#f7fbfa] text-[#143044]',
    blue: 'from-[#1d4e89] via-[#2f6fad] to-[#1d4e89]',
  }[template] || 'from-[#0c6e72] via-[#14948c] to-[#0d7c74]'
  const light = template === 'minimal'
  return (
    <div className={cx('relative aspect-[1.35/1] overflow-hidden rounded-xl bg-gradient-to-br p-3 shadow-sm', skin, light ? 'border border-[#e6d7b0] text-[#143044]' : 'text-white')}>
      <div className={cx('flex h-full flex-col rounded-lg border p-4', light ? 'border-[#e4d3a4]' : 'border-[#f3e6c0]/80')}>
        <div className="flex items-center gap-1.5 text-[12px] font-semibold">
          <span className={cx('grid size-5 place-items-center rounded-full text-[10px]', light ? 'bg-[var(--color-org-teal)] text-white' : 'bg-white/15')}>⌂</span>
          StomaHub
        </div>
        <p className={cx('mt-3 text-center text-[18px] font-semibold tracking-[0.18em]', light ? 'text-[#0c6e72]' : 'text-[#f6e7c1]')}>SERTIFIKAT</p>
        <p className={cx('mt-2 text-center text-[10px]', light ? 'text-[#6e868c]' : 'text-white/80')}>Ushbu sertifikat bilan tasdiqlanadiki,</p>
        <p className="mt-1 text-center font-['Great_Vibes',cursive] text-[28px] leading-none" style={{ fontFamily: '"Great Vibes", cursive' }}>{name}</p>
        <p className={cx('mt-2 text-center text-[10.5px] leading-snug', light ? 'text-[#3e5a62]' : 'text-white/90')}>
          “{course}”<br />mavzusidagi ilmiy-amaliy seminarda<br />faol ishtirok etgan.
        </p>
        <div className="mt-auto flex items-end justify-between pt-3 text-[9px]">
          <div>
            <div className={light ? 'text-[#6e868c]' : 'text-white/70'}>{date}</div>
            <div className="mt-2 w-16 border-t border-current/40 pt-0.5">Sana</div>
          </div>
          <div className={cx('grid size-12 place-items-center rounded-full border-2 text-[9px] font-bold', light ? 'border-[#d4b15a] text-[#b68b2c]' : 'border-[#f3e6c0] text-[#f6e7c1]')}>ST</div>
          <div className="text-right">
            <div className="font-['Great_Vibes',cursive] text-[16px]" style={{ fontFamily: '"Great Vibes", cursive' }}>Imzo</div>
            <div className="mt-1 w-16 border-t border-current/40 pt-0.5">Ma’ruzachi</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function TicketPreview({ name = 'Aliyeva Mohira', kind = 'VIP chipta', code = '#STH-2026-0001' }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-[linear-gradient(160deg,#073f45_0%,#0c6e72_45%,#14948c_100%)] p-4 text-white shadow-[0_10px_24px_rgb(12_110_114/0.25)]">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-1.5 text-[13px] font-bold"><span className="text-[16px]">⌖</span> StomaHub</div>
        <span className="rounded-md bg-[#f0b429] px-2 py-0.5 text-[11px] font-bold text-[#143044]">VIP</span>
      </div>
      <div className="mt-3 flex gap-3">
        <img src="/images/seminars/teeth.jpg" alt="" className="h-16 w-14 rounded-lg object-cover" />
        <div className="min-w-0">
          <p className="text-[13.5px] font-bold leading-snug">Implantologiya: nazariya va amaliyot</p>
          <p className="mt-1 text-[11px] text-white/80">24-noyabr 2026, 10:00</p>
          <p className="text-[11px] text-white/80">Toshkent, Congress Hall</p>
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="text-[12px]">
          <p className="text-white/70">Ishtirokchi</p>
          <p className="font-semibold">{name}</p>
          <p className="mt-2 text-white/70">Chipta turi</p>
          <p className="font-semibold">{kind}</p>
        </div>
        <div className="rounded-lg bg-white p-1.5">
          <QrMark size={72} seed={4} />
          <p className="mt-1 text-center text-[9px] font-semibold text-[#143044]">{code}</p>
        </div>
      </div>
    </div>
  )
}
