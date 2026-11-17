import { Link } from 'react-router-dom'
import { Info, UserRound } from 'lucide-react'
import { MIGRATION_NOTE } from './api'

export const cx = (...a) => a.filter(Boolean).join(' ')

export const STATUS = {
  draft: { label: 'Qoralama', tone: 'bg-[#EEF2F6] text-[#475467] ring-[#D9E0E8]', dot: 'bg-[#98A2B3]' },
  review: { label: 'Moderatsiyada', tone: 'bg-[#FFF6E5] text-[#9A5B00] ring-[#F8DFAE]', dot: 'bg-[#F59E0B]' },
  published: { label: 'Nashr qilingan', tone: 'bg-[#E7F6F2] text-[#0B6B5F] ring-[#BFE6DC]', dot: 'bg-[#10A37F]' },
  archived: { label: 'Arxiv', tone: 'bg-[#F2F4F7] text-[#667085] ring-[#E4E7EC]', dot: 'bg-[#98A2B3]' },
}

export const PAY = {
  paid: { label: 'To‘langan', tone: 'bg-[#E7F6F2] text-[#0B6B5F] ring-[#BFE6DC]' },
  unpaid: { label: 'Kutilmoqda', tone: 'bg-[#FFF6E5] text-[#9A5B00] ring-[#F8DFAE]' },
  free: { label: 'Bepul', tone: 'bg-[#EEF4FF] text-[#3538CD] ring-[#D6E0FF]' },
}

export const METHOD = { cash: 'Naqd', transfer: 'Karta o‘tkazmasi', other: 'Boshqa', click: 'Click', payme: 'Payme' }

export function som(n) {
  const v = Math.round(Number(n) || 0)
  return `${v.toLocaleString('ru-RU').replace(/\u00a0|,/g, ' ')} so‘m`
}

export function shortSom(n) {
  const v = Number(n) || 0
  if (v >= 1e9) return `${(v / 1e9).toFixed(1).replace('.0', '')} mlrd`
  if (v >= 1e6) return `${(v / 1e6).toFixed(1).replace('.0', '')} mln`
  if (v >= 1e3) return `${Math.round(v / 1e3)} ming`
  return String(v)
}

const MONTHS = ['yan', 'fev', 'mar', 'apr', 'may', 'iyun', 'iyul', 'avg', 'sen', 'okt', 'noy', 'dek']
export const MONTHS_FULL = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']

/** Toshkent vaqti bo‘yicha qisqa sana: 17-noy 2026 */
export function dmy(value, withTime = false) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  const t = new Date(d.getTime() + 5 * 3600 * 1000)
  const base = `${t.getUTCDate()}-${MONTHS[t.getUTCMonth()]} ${t.getUTCFullYear()}`
  if (!withTime) return base
  return `${base}, ${String(t.getUTCHours()).padStart(2, '0')}:${String(t.getUTCMinutes()).padStart(2, '0')}`
}

export function monthLabel(ym) {
  const m = Number(String(ym || '').split('-')[1]) - 1
  return MONTHS[m] || ym
}

/** Kurs nomi: 2 qatorgacha, to‘liq nom title/tooltipda. */
export function CourseTitle({ children, className }) {
  const text = children == null ? '' : String(children)
  return (
    <span title={text} className={cx('line-clamp-2 min-w-0 leading-snug', className)}>
      {text}
    </span>
  )
}

export function StatusPill({ status, className }) {
  const s = STATUS[status] || STATUS.draft
  return (
    <span className={cx('inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[11.5px] font-semibold ring-1 ring-inset', s.tone, className)}>
      <span className={cx('size-1.5 rounded-full', s.dot)} />{s.label}
    </span>
  )
}

export function PayPill({ status }) {
  const s = PAY[status] || PAY.free
  return <span className={cx('inline-flex h-6 items-center whitespace-nowrap rounded-full px-2.5 text-[11.5px] font-semibold ring-1 ring-inset', s.tone)}>{s.label}</span>
}

export function Panel({ title, sub, extra, children, className, body = 'p-4 md:p-5' }) {
  return (
    <section className={cx('min-w-0 rounded-2xl border border-[#E4ECEE] bg-white shadow-[0_1px_2px_rgb(16_40_60/0.04),0_8px_24px_-12px_rgb(16_40_60/0.08)]', className)}>
      {(title || extra) && (
        <header className="flex items-start justify-between gap-3 px-4 pt-4 md:px-5">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-bold leading-tight text-[#0B1F3A]">{title}</h2>}
            {sub && <p className="mt-1 text-[12.5px] leading-snug text-[#667A8A]">{sub}</p>}
          </div>
          {extra}
        </header>
      )}
      <div className={body}>{children}</div>
    </section>
  )
}

export function Kpi({ icon: Icon, label, value, foot, tone = 'teal' }) {
  const tones = {
    teal: 'bg-[#E6F6F3] text-[#0F766E]',
    amber: 'bg-[#FFF4E0] text-[#B45309]',
    indigo: 'bg-[#EEF0FF] text-[#4338CA]',
    rose: 'bg-[#FFEDEF] text-[#BE123C]',
  }
  return (
    <article className="min-w-0 rounded-2xl border border-[#E4ECEE] bg-white p-4 shadow-[0_1px_2px_rgb(16_40_60/0.04)]">
      <div className="flex items-center gap-2.5">
        <span className={cx('grid size-9 shrink-0 place-items-center rounded-xl', tones[tone])}><Icon className="size-[18px]" strokeWidth={1.9} /></span>
        <p className="min-w-0 text-[12.5px] font-medium leading-tight text-[#5B6F7E]">{label}</p>
      </div>
      <p className="mt-3 truncate text-[22px] font-extrabold leading-none tracking-tight text-[#0B1F3A] md:text-[24px]">{value}</p>
      {foot && <p className="mt-2 truncate text-[12px] text-[#7A8C99]">{foot}</p>}
    </article>
  )
}

export function Empty({ icon: Icon = Info, title, text, action }) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-[#EEF7F6] text-[#0F766E]"><Icon className="size-6" strokeWidth={1.7} /></span>
      <p className="mt-3 text-[15px] font-bold text-[#0B1F3A]">{title}</p>
      {text && <p className="mt-1 max-w-[360px] text-[13px] leading-relaxed text-[#667A8A]">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function MigrationNotice({ show, text = MIGRATION_NOTE }) {
  if (!show) return null
  return (
    <div role="status" className="mb-4 flex items-start gap-3 rounded-2xl border border-[#F8DFAE] bg-[#FFFAF0] px-4 py-3 text-[13px] leading-snug text-[#7A4B00]">
      <Info className="mt-0.5 size-4 shrink-0" />
      <span>{text}</span>
    </div>
  )
}

export function Avatar({ src, name, size = 36 }) {
  const ok = typeof src === 'string' && /^(https?:|\/|data:image)/.test(src)
  const letter = String(name || '').trim().slice(0, 1).toUpperCase()
  return ok ? (
    <img src={src} alt="" style={{ width: size, height: size }} className="shrink-0 rounded-full object-cover ring-2 ring-white" />
  ) : (
    <span style={{ width: size, height: size }} className="grid shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#D7F0EC,#BFE3F0)] text-[13px] font-bold text-[#0F5F59] ring-2 ring-white">
      {letter || <UserRound className="size-4" />}
    </span>
  )
}

export function Progress({ value, className }) {
  const v = Math.max(0, Math.min(100, Math.round(Number(value) || 0)))
  return (
    <span className={cx('block h-1.5 w-full overflow-hidden rounded-full bg-[#E8EFF1]', className)}>
      <span className="block h-full rounded-full bg-[linear-gradient(90deg,#14B8A6,#0F766E)]" style={{ width: `${v}%` }} />
    </span>
  )
}

export const btn = {
  primary: 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-4 text-[14px] font-semibold text-white shadow-[0_6px_16px_-6px_rgb(15_118_110/0.55)] transition hover:bg-[#0D655E] disabled:cursor-not-allowed disabled:opacity-50',
  ghost: 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D8E3E6] bg-white px-4 text-[14px] font-semibold text-[#14324A] transition hover:bg-[#F5F9FA] disabled:opacity-50',
  soft: 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#EAF6F4] px-4 text-[14px] font-semibold text-[#0F766E] transition hover:bg-[#DDF1EE] disabled:opacity-50',
  danger: 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#F4C7C7] bg-white px-4 text-[14px] font-semibold text-[#B42318] hover:bg-[#FFF5F5]',
}

export const input = 'min-h-11 w-full rounded-xl border border-[#D8E3E6] bg-white px-3.5 text-[14px] text-[#0B1F3A] outline-none transition placeholder:text-[#9AABB5] focus:border-[#0F766E] focus:ring-4 focus:ring-[#0F766E]/10'

export function PageHead({ title, sub, actions }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3 md:mb-5">
      <div className="min-w-0">
        <h1 className="text-[22px] font-extrabold leading-tight tracking-tight text-[#0B1F3A] md:text-[26px]">{title}</h1>
        {sub && <p className="mt-1 text-[13.5px] leading-snug text-[#5B6F7E]">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Segmented({ value, onChange, items, className }) {
  return (
    <div className={cx('inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-[#EEF3F5] p-1', className)} role="tablist">
      {items.map(([key, label, count]) => (
        <button key={key} type="button" role="tab" aria-selected={value === key} onClick={() => onChange(key)}
          className={cx('inline-flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-[13px] font-semibold transition', value === key ? 'bg-white text-[#0B1F3A] shadow-[0_1px_3px_rgb(16_40_60/0.12)]' : 'text-[#5B6F7E] hover:text-[#0B1F3A]')}>
          {label}{count != null && <span className={cx('rounded-full px-1.5 text-[11px]', value === key ? 'bg-[#E6F6F3] text-[#0F766E]' : 'bg-white/70 text-[#7A8C99]')}>{count}</span>}
        </button>
      ))}
    </div>
  )
}

export function Sheet({ open, title, sub, onClose, children, footer }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Yopish" className="absolute inset-0 bg-[#0B1F3A]/45 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative max-h-[88vh] w-full overflow-y-auto rounded-t-[24px] bg-white px-5 pb-[calc(20px+max(env(safe-area-inset-bottom),var(--safe-bottom-sim,0px)))] pt-3 shadow-2xl md:max-w-[460px] md:rounded-[22px] md:pb-5 md:pt-5">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#D5E0E3] md:hidden" />
        <h3 className="text-[17px] font-extrabold text-[#0B1F3A]">{title}</h3>
        {sub && <p className="mt-1 text-[13px] leading-relaxed text-[#5B6F7E]">{sub}</p>}
        <div className="mt-4">{children}</div>
        {footer && <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>
  )
}

export function Cover({ src, className }) {
  return src
    ? <img src={src} alt="" className={cx('object-cover', className)} />
    : <span className={cx('block bg-[linear-gradient(135deg,#0F766E_0%,#134E63_60%,#0B1F3A_100%)]', className)} />
}

export function TextLink({ to, children }) {
  return <Link to={to} className="inline-flex min-h-10 items-center text-[13px] font-semibold text-[#0F766E] hover:underline">{children}</Link>
}
