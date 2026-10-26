import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronLeft, ChevronRight, Ellipsis, Search, Check, ArrowLeft } from 'lucide-react'

export const card = 'rounded-2xl border border-[#E6EEF0] bg-white shadow-[0_1px_2px_rgb(16_40_63/0.04)]'
export const inputCls = 'h-[42px] w-full rounded-[10px] border border-[#DCE5E7] bg-white px-3 text-[14px] text-[#10283F] outline-none placeholder:text-[#8A98A5] focus:border-[#0F766E] disabled:bg-[#F4F7F8]'

export function PageHead({ title, subtitle, action, back }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4 md:mb-5">
      <div className="min-w-0">
        {back && <Link to={back} className="mb-2 inline-flex items-center gap-1 text-[13px] text-[#0F766E] md:hidden"><ArrowLeft className="size-4" />Orqaga</Link>}
        <h1 className="text-[26px] font-extrabold tracking-tight text-[#10283F] md:text-[32px]">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[13.5px] text-[#5C6E80] md:text-[15px]">{subtitle}</p>}
      </div>
      {action && <div className="hidden shrink-0 md:block">{action}</div>}
    </div>
  )
}

export function Btn({ variant = 'primary', icon: Icon, children, className = '', size = 'md', ...p }) {
  const v = {
    primary: 'bg-[#0F766E] text-white hover:bg-[#115E59] disabled:bg-[#7FB8B2]',
    outline: 'border border-[#0F766E] bg-white text-[#0F766E] hover:bg-[#F0FDFA]',
    soft: 'bg-[#F0FDFA] text-[#0F766E] hover:bg-[#CCFBF1]',
    gray: 'border border-[#C9D6DA] bg-white text-[#3D4E5F] hover:bg-[#F4F7F8]',
    ghost: 'text-[#0F766E] hover:bg-[#F0FDFA]',
  }[variant]
  const s = size === 'sm' ? 'h-9 px-3 text-[13px]' : size === 'lg' ? 'h-12 px-5 text-[15px]' : 'h-[42px] px-4 text-[14px]'
  return (
    <button type="button" {...p} className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] font-semibold transition disabled:cursor-not-allowed ${v} ${s} ${className}`}>
      {Icon && <Icon className="size-[18px]" strokeWidth={2} />}{children}
    </button>
  )
}

export function Field({ label, required, hint, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1.5 block text-[13px] font-medium text-[#10283F]">{label}{required && ' *'}</span>}
      {children}
      {hint && <span className="mt-1 block text-[11.5px] text-[#6B7A88]">{hint}</span>}
    </label>
  )
}
export const Input = ({ className = '', icon: Icon, ...p }) => Icon
  ? <span className="relative block"><Icon className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-[#0F766E]" strokeWidth={1.8} /><input {...p} className={`${inputCls} pl-10 ${className}`} /></span>
  : <input {...p} className={`${inputCls} ${className}`} />
export const Textarea = ({ className = '', ...p }) => <textarea {...p} className={`${inputCls} h-auto min-h-[84px] py-2.5 ${className}`} />
export function Select({ value, onChange, options, className = '', placeholder }) {
  return (
    <span className={`relative block ${className}`}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`${inputCls} appearance-none pr-9`}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => { const [v, l] = Array.isArray(o) ? o : [o, o]; return <option key={v} value={v}>{l}</option> })}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#10283F]" />
    </span>
  )
}

export function SearchInput({ value, onChange, placeholder, className = '' }) {
  return (
    <span className={`relative block ${className}`}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-[#6B7A88]" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${inputCls} pl-10`} />
    </span>
  )
}

export function Tabs({ tabs, value, onChange, className = '' }) {
  return (
    <div className={`flex gap-2 overflow-x-auto [scrollbar-width:none] ${className}`}>
      {tabs.map(([k, label, count]) => (
        <button key={k} type="button" onClick={() => onChange(k)}
          className={`h-10 shrink-0 rounded-[10px] border px-4 text-[14px] font-medium transition ${value === k ? 'border-[#CCFBF1] bg-[#CCFBF1]/70 text-[#0F766E]' : 'border-[#E2ECEE] bg-white text-[#3D4E5F] hover:bg-[#F0FDFA]'}`}>
          {label}{count !== undefined && ` (${count})`}
        </button>
      ))}
    </div>
  )
}
export function Chips({ tabs, value, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
      {tabs.map(([k, label, count]) => (
        <button key={k} type="button" onClick={() => onChange(k)}
          className={`h-9 shrink-0 rounded-full border px-3.5 text-[13.5px] font-medium ${value === k ? 'border-[#0F766E] bg-[#0F766E] text-white' : 'border-[#C9D6DA] bg-white text-[#10283F]'}`}>
          {label}{count !== undefined && ` (${count})`}
        </button>
      ))}
    </div>
  )
}

const TONES = { on: 'bg-[#CCFBF1] text-[#115E59]', mid: 'bg-[#E3F4F2] text-[#0F766E]', off: 'bg-[#E9EEF0] text-[#3D4E5F]', dark: 'bg-[#0F766E] text-white' }
export const Badge = ({ tone = 'on', children, dot, className = '' }) => (
  <span className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-[12px] font-medium ${TONES[tone]} ${className}`}>
    {dot && <span className={`size-1.5 rounded-full ${tone === 'off' ? 'bg-[#6B7A88]' : 'bg-[#0F766E]'}`} />}{children}
  </span>
)
export const Dot = ({ on = true, children }) => (
  <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] text-[#10283F]"><span className={`size-2 rounded-full ${on ? 'bg-[#0F766E]' : 'bg-[#9AAAB5]'}`} />{children}</span>
)

export function Toggle({ checked, onChange, disabled }) {
  return (
    <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-[#0F766E]' : 'bg-[#AEBAC2]'} disabled:opacity-50`}>
      <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  )
}
export function Checkbox({ checked, onChange, className = '' }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} onClick={(e) => { e.stopPropagation(); onChange(!checked) }}
      className={`grid size-[18px] shrink-0 place-items-center rounded-[5px] border ${checked ? 'border-[#0F766E] bg-[#0F766E] text-white' : 'border-[#AEBAC2] bg-white'} ${className}`}>
      {checked && <Check className="size-3.5" strokeWidth={3} />}
    </button>
  )
}

export function Pager({ page, pages, setPage, per, setPer, total }) {
  if (!total) return null
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5">
      <div className="flex items-center gap-2 text-[12.5px] text-[#5C6E80]">
        {setPer ? <Select value={String(per)} onChange={(v) => { setPer(Number(v)); setPage(1) }} options={['10', '20', '50']} className="w-[74px]" /> : null}
        <span>{setPer ? 'sahifada' : `Jami: ${total}`}</span>
      </div>
      <div className="flex items-center gap-2">
        <PBtn disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="size-4" /></PBtn>
        {pageList(page, pages).map((n, i) => n === '…' ? <span key={`g${i}`} className="px-1 text-[#6B7A88]">…</span> :
          <PBtn key={n} active={n === page} onClick={() => setPage(n)}>{n}</PBtn>)}
        <PBtn disabled={page >= pages} onClick={() => setPage(page + 1)}><ChevronRight className="size-4" /></PBtn>
      </div>
    </div>
  )
}
const PBtn = ({ active, children, ...p }) => <button type="button" {...p} className={`grid size-9 place-items-center rounded-lg border text-[13.5px] font-medium disabled:opacity-40 ${active ? 'border-[#0F766E] bg-[#0F766E] text-white' : 'border-[#DCE5E7] bg-white text-[#10283F] hover:bg-[#F0FDFA]'}`}>{children}</button>
function pageList(p, n) {
  if (n <= 6) return Array.from({ length: n }, (_, i) => i + 1)
  const s = new Set([1, n, p - 1, p, p + 1].filter((x) => x >= 1 && x <= n))
  const arr = [...s].sort((a, b) => a - b); const out = []
  arr.forEach((x, i) => { if (i && x - arr[i - 1] > 1) out.push('…'); out.push(x) })
  return out
}
export function usePaged(list, perDefault = 10) {
  const [page, setPage] = useState(1)
  const [per, setPer] = useState(perDefault)
  const pages = Math.max(1, Math.ceil(list.length / per))
  const p = Math.min(page, pages)
  return { rows: list.slice((p - 1) * per, p * per), page: p, pages, setPage, per, setPer, total: list.length, offset: (p - 1) * per }
}

export function Menu({ items, className = '', label = 'Amallar', icon: Icon = Ellipsis }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const off = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', off); return () => document.removeEventListener('mousedown', off)
  }, [open])
  const list = items.filter(Boolean)
  return (
    <div ref={ref} className={`relative inline-block ${className}`} onClick={(e) => e.stopPropagation()}>
      <button type="button" aria-label={label} onClick={() => setOpen((v) => !v)} className="grid size-8 place-items-center rounded-lg text-[#10283F] hover:bg-[#F0FDFA]"><Icon className="size-5" /></button>
      {open && (
        <div className="absolute right-0 top-9 z-40 w-52 rounded-xl border border-[#E6EEF0] bg-white p-1.5 text-left shadow-[0_12px_32px_rgb(8_40_45/0.14)]">
          {list.map(([label, fn, Ico]) => (
            <button key={label} type="button" onClick={() => { setOpen(false); fn() }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] text-[#10283F] hover:bg-[#F0FDFA]">
              {Ico && <Ico className="size-4 text-[#0F766E]" />}{label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function Crumbs({ items }) {
  return (
    <div className="mb-4 hidden items-center gap-2 text-[13px] text-[#3D4E5F] md:flex">
      {items.map(([label, to], i) => (
        <span key={label} className="flex items-center gap-2">
          {i > 0 && <ChevronRight className="size-4 text-[#6B7A88]" />}
          {to ? <Link to={to} className="hover:text-[#0F766E]">{label}</Link> : <span className="text-[#10283F]">{label}</span>}
        </span>
      ))}
    </div>
  )
}

export function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className={`${card} flex items-center gap-4 p-4 md:p-5`}>
      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#E3F4F2] text-[#0F766E] md:size-[60px]"><Icon className="size-6 md:size-7" strokeWidth={1.8} /></span>
      <div className="min-w-0">
        <div className="text-[12.5px] text-[#3D4E5F] md:text-[13.5px]">{label}</div>
        <div className="mt-0.5 truncate text-[18px] font-extrabold text-[#10283F] md:text-[22px]">{value}</div>
        {sub && <div className="mt-0.5 text-[12px] text-[#5C6E80]">{sub}</div>}
      </div>
    </div>
  )
}

export function Fab({ onClick, children, icon: Icon }) {
  return (
    <button type="button" onClick={onClick} className="fixed bottom-[86px] right-4 z-30 flex h-14 items-center gap-2.5 rounded-full bg-[#0F766E] pl-3 pr-5 text-[15px] font-semibold text-white shadow-[0_10px_24px_rgb(15_118_110/0.35)] md:hidden">
      <span className="grid size-8 place-items-center rounded-full bg-white text-[#0F766E]"><Icon className="size-5" strokeWidth={2.4} /></span>{children}
    </button>
  )
}

export const Err = ({ children }) => children ? <div className="rounded-lg bg-[#EEF2F3] px-3 py-2 text-[13px] text-[#3D4E5F]">{children}</div> : null

let toastFn = null
export function Toaster() {
  const [msg, setMsg] = useState('')
  useEffect(() => { toastFn = (m) => { setMsg(m); setTimeout(() => setMsg(''), 2600) }; return () => { toastFn = null } }, [])
  if (!msg) return null
  return <div className="fixed bottom-24 left-1/2 z-[70] -translate-x-1/2 rounded-xl bg-[#10283F] px-4 py-2.5 text-[13.5px] text-white shadow-lg md:bottom-8">{msg}</div>
}
export const toast = (m) => toastFn?.(m)

export const Th = ({ children, className = '' }) => <th className={`whitespace-nowrap px-3 py-2.5 text-left text-[12.5px] font-medium text-[#3D4E5F] ${className}`}>{children}</th>
export const Td = ({ children, className = '' }) => <td className={`px-3 py-2 text-[13px] text-[#10283F] ${className}`}>{children}</td>
