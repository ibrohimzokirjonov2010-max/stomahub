import { ChevronLeft, ChevronRight, Filter, Search } from 'lucide-react'

export const card = 'rounded-2xl border border-[#E6EEF0] bg-white shadow-[0_1px_2px_rgb(16_40_63/0.04)]'

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[24px] font-extrabold tracking-tight text-[#10283F] lg:text-[26px]">{title}</h1>
        {subtitle && <p className="mt-1 text-[13.5px] text-[#5C6E80] lg:text-[14px]">{subtitle}</p>}
      </div>
      {actions}
    </div>
  )
}

export function FilterTabs({ tabs, value, onChange }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {tabs.map((t) => {
        const active = value === t.id
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition ${active ? 'bg-[#0F766E] text-white shadow-sm' : 'border border-[#E6EEF0] bg-white text-[#3D4E5F] hover:border-[#0F766E]/40'}`}
          >
            {t.label}
            {t.count != null && <span className={active ? 'text-white/80' : 'text-[#8A9AA8]'}>{typeof t.count === 'number' ? t.count.toLocaleString('ru-RU').replace(/\u00a0|,/g, ' ') : t.count}</span>}
          </button>
        )
      })}
    </div>
  )
}

export function SearchRow({ value, onChange, placeholder, onFilter, right }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <label className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5C6E80]" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-10 w-full rounded-xl border border-[#E6EEF0] bg-[#F8FBFC] pl-10 pr-3 text-[14px] outline-none placeholder:text-[#8A9AA8] focus:border-[#0F766E]"
        />
      </label>
      {onFilter && (
        <button type="button" onClick={onFilter} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#E6EEF0] bg-white px-3.5 text-[13.5px] font-semibold text-[#10283F]">
          <Filter className="size-4 text-[#0F766E]" /> Filtrlar
        </button>
      )}
      {right}
    </div>
  )
}

export function Pagination({ page, pageSize, total, onPage, onPageSize }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  const nums = []
  const push = (n) => { if (!nums.includes(n) && n >= 1 && n <= pages) nums.push(n) }
  push(1); push(2); push(3); push(4); push(5)
  if (pages > 6) { nums.push('…'); push(pages) }
  else for (let i = 6; i <= pages; i++) push(i)

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 text-[13px] text-[#5C6E80]">
      <select
        value={pageSize}
        onChange={(e) => onPageSize?.(Number(e.target.value))}
        className="h-9 rounded-lg border border-[#E6EEF0] bg-white px-2 font-semibold text-[#10283F]"
      >
        {[10, 20, 50].map((n) => <option key={n} value={n}>{n} ta</option>)}
      </select>
      <span>{from}–{to} dan {total.toLocaleString('ru-RU').replace(/\u00a0|,/g, ' ')} ta</span>
      <div className="ml-auto flex items-center gap-1">
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="grid size-8 place-items-center rounded-lg border border-[#E6EEF0] disabled:opacity-40"><ChevronLeft className="size-4" /></button>
        {nums.map((n, i) => n === '…' ? (
          <span key={`e${i}`} className="px-1">…</span>
        ) : (
          <button key={n} type="button" onClick={() => onPage(n)} className={`grid size-8 place-items-center rounded-lg text-[13px] font-semibold ${page === n ? 'bg-[#0F766E] text-white' : 'border border-[#E6EEF0] hover:bg-[#F0FDFA]'}`}>{n}</button>
        ))}
        <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)} className="grid size-8 place-items-center rounded-lg border border-[#E6EEF0] disabled:opacity-40"><ChevronRight className="size-4" /></button>
      </div>
    </div>
  )
}

export function Empty({ text = 'Ma’lumot yo‘q' }) {
  return <div className="px-4 py-12 text-center text-[14px] text-[#8A9AA8]">{text}</div>
}

export function Avatar({ name, src, size = 'md' }) {
  const s = size === 'sm' ? 'size-8 text-[11px]' : size === 'lg' ? 'size-14 text-[18px]' : 'size-10 text-[13px]'
  if (src) return <img src={src} alt="" className={`${s} rounded-full object-cover`} />
  return <span className={`grid ${s} place-items-center rounded-full bg-[#CCFBF1] font-bold text-[#0F766E]`}>{(name || '?').slice(0, 1).toUpperCase()}</span>
}

export function ToneBadge({ tone = 'teal', children, dot }) {
  const map = {
    teal: 'bg-[#F0FDFA] text-[#0F766E]',
    blue: 'bg-[#EFF6FF] text-[#1D4ED8]',
    orange: 'bg-[#FFF7ED] text-[#C2410C]',
    red: 'bg-[#FEF2F2] text-[#B91C1C]',
    gray: 'bg-[#F3F4F6] text-[#4B5563]',
    green: 'bg-[#ECFDF5] text-[#047857]',
  }
  const d = { teal: 'bg-[#0F766E]', blue: 'bg-[#1D4ED8]', orange: 'bg-[#EA580C]', red: 'bg-[#DC2626]', gray: 'bg-[#9CA3AF]', green: 'bg-[#059669]' }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${map[tone] || map.teal}`}>
      {dot && <span className={`size-1.5 rounded-full ${d[tone] || d.teal}`} />}
      {children}
    </span>
  )
}

export function MigrateBanner({ show, file = '0012_admin_sections.sql' }) {
  if (!show) return null
  return (
    <div className="mt-3 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 text-[13px] text-[#92400E]">
      Kerakli RPC topilmadi. <code className="font-semibold">supabase/migrations/{file}</code> ni Supabase SQL editorida qo‘llang.
    </div>
  )
}

export function StatusDot({ tone = 'teal', children }) {
  return <ToneBadge tone={tone} dot>{children}</ToneBadge>
}

export function TableCard({ children, className = '' }) {
  return <div className={`${card} mt-4 overflow-hidden ${className}`}>{children}</div>
}

export function DataTable({ head, children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-[13px]">
        <thead className="bg-[#F8FBFC] text-[11.5px] uppercase tracking-wide text-[#5C6E80]">
          <tr>{head.map((h) => <th key={h} className="whitespace-nowrap px-3 py-2.5 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export function RowActions({ children }) {
  return <div className="flex flex-wrap items-center gap-1.5">{children}</div>
}

export function Btn({ tone = 'ghost', children, className = '', ...rest }) {
  const map = {
    primary: 'bg-[#0F766E] text-white hover:bg-[#0d6a63]',
    ghost: 'border border-[#E6EEF0] bg-white text-[#10283F] hover:bg-[#F8FBFC]',
    danger: 'border border-[#FECACA] bg-white text-[#B91C1C] hover:bg-[#FEF2F2]',
    soft: 'bg-[#F0FDFA] text-[#0F766E] hover:bg-[#CCFBF1]',
  }
  return (
    <button type="button" className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold disabled:opacity-50 ${map[tone] || map.ghost} ${className}`} {...rest}>
      {children}
    </button>
  )
}

export function KpiStrip({ items }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((x) => (
        <div key={x.label} className={`${card} p-3.5 ${x.active ? 'border-[#0F766E] ring-1 ring-[#0F766E]/30' : ''}`}>
          <div className="flex items-center gap-2 text-[12.5px] font-medium text-[#5C6E80]">
            {x.icon && <x.icon className="size-4 text-[#0F766E]" />}
            {x.label}
          </div>
          <div className="mt-1 text-[22px] font-extrabold tracking-tight text-[#10283F]">{x.value}</div>
          {x.sub && <div className="mt-0.5 text-[11.5px] text-[#8A9AA8]">{x.sub}</div>}
        </div>
      ))}
    </div>
  )
}

export function MobileCards({ rows, render }) {
  return (
    <ul className="mt-3 flex flex-col gap-2.5 lg:hidden">
      {rows.map((r, i) => <li key={r.id || i} className={`${card} p-3`}>{render(r, i)}</li>)}
    </ul>
  )
}
