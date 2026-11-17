import { Children, cloneElement, isValidElement, useId } from 'react'
import { GripVertical, Plus, X } from 'lucide-react'
import { cx, input } from '../ui'

export function Field({ label, hint, counter, error, children, className }) {
  const id = useId()
  const kids = Children.map(children, (child, i) => {
    if (!isValidElement(child) || i !== 0) return child
    const extra = {}
    if (!child.props.id) extra.id = id
    if (label && !child.props['aria-label'] && !child.props['aria-labelledby']) extra['aria-label'] = label
    return cloneElement(child, extra)
  })
  return (
    <div className={cx('block min-w-0', className)}>
      {(label || counter) && (
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          {label && <label htmlFor={id} className="text-[13px] font-semibold text-[#22384A]">{label}</label>}
          {counter && <span className="text-[11.5px] tabular-nums text-[#98A8B3]">{counter}</span>}
        </div>
      )}
      {kids}
      {error ? <p className="mt-1.5 text-[12px] text-[#B42318]">{error}</p> : hint ? <p className="mt-1.5 text-[12px] leading-snug text-[#7A8C99]">{hint}</p> : null}
    </div>
  )
}

export function Text({ value, onChange, max, ...rest }) {
  return <input value={value ?? ''} maxLength={max} onChange={(e) => onChange(e.target.value)} className={input} {...rest} />
}

export function Area({ value, onChange, max, rows = 5, ...rest }) {
  return <textarea value={value ?? ''} maxLength={max} rows={rows} onChange={(e) => onChange(e.target.value)} className={cx(input, 'min-h-[120px] py-3 leading-relaxed')} {...rest} />
}

export function Choice({ value, onChange, items, cols = 'grid-cols-2 sm:grid-cols-3' }) {
  return (
    <div className={cx('grid gap-2', cols)} role="radiogroup">
      {items.map(([key, label, sub]) => (
        <button key={key} type="button" role="radio" aria-checked={value === key} onClick={() => onChange(key)}
          className={cx('min-h-12 rounded-xl border px-3 py-2 text-left transition', value === key ? 'border-[#0F766E] bg-[#EFF8F6] ring-4 ring-[#0F766E]/10' : 'border-[#D8E3E6] bg-white hover:border-[#B7CBD0]')}>
          <span className={cx('block text-[13.5px] font-semibold', value === key ? 'text-[#0F766E]' : 'text-[#14324A]')}>{label}</span>
          {sub && <span className="mt-0.5 block text-[11.5px] leading-snug text-[#7A8C99]">{sub}</span>}
        </button>
      ))}
    </div>
  )
}

export function Toggle({ on, onChange, label, sub }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex min-h-12 w-full items-center gap-3 text-left">
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold text-[#0B1F3A]">{label}</span>
        {sub && <span className="mt-0.5 block text-[12.5px] leading-snug text-[#6B7F8D]">{sub}</span>}
      </span>
      <span className={cx('relative h-7 w-12 shrink-0 rounded-full transition', on ? 'bg-[#0F766E]' : 'bg-[#CBD7DB]')}>
        <span className={cx('absolute top-1 size-5 rounded-full bg-white shadow transition-all', on ? 'left-6' : 'left-1')} />
      </span>
    </button>
  )
}

/** Satrlar ro‘yxati: band qo‘shish/o‘chirish, tartibni sudrab o‘zgartirish. */
export function ListEditor({ items, onChange, max = 10, placeholder, addLabel = 'Band qo‘shish', icon: Icon }) {
  const set = (i, v) => onChange(items.map((s, j) => (j === i ? v : s)))
  const drop = (from, to) => {
    if (from === to || from == null) return
    const next = items.slice()
    const [row] = next.splice(from, 1)
    next.splice(to, 0, row)
    onChange(next)
  }
  return (
    <div>
      <ul className="space-y-2">
        {items.map((value, i) => (
          <li key={i} draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', String(i))}
            onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); drop(Number(e.dataTransfer.getData('text/plain')), i) }}
            className="group flex items-center gap-2">
            <span className="hidden cursor-grab text-[#B3C2C9] md:block" aria-hidden><GripVertical className="size-4" /></span>
            {Icon && <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#EFF8F6] text-[#0F766E]"><Icon className="size-4" /></span>}
            <input value={value} maxLength={160} onChange={(e) => set(i, e.target.value)} placeholder={placeholder?.(i)} className={input} />
            <button type="button" aria-label="Bandni o‘chirish" onClick={() => onChange(items.filter((_, j) => j !== i))} className="grid size-11 shrink-0 place-items-center rounded-xl text-[#8A9AA8] hover:bg-[#FFF1F1] hover:text-[#B42318]"><X className="size-4" /></button>
          </li>
        ))}
      </ul>
      {items.length < max && (
        <button type="button" onClick={() => onChange([...items, ''])} className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-[13.5px] font-semibold text-[#0F766E] hover:bg-[#EFF8F6]">
          <Plus className="size-4" /> {addLabel}
        </button>
      )}
    </div>
  )
}

export function Card({ title, sub, children, className, extra }) {
  return (
    <section className={cx('rounded-2xl border border-[#E4ECEE] bg-white p-4 shadow-[0_1px_2px_rgb(16_40_60/0.04)] md:p-6', className)}>
      {(title || extra) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h3 className="text-[16px] font-bold text-[#0B1F3A]">{title}</h3>}
            {sub && <p className="mt-1 text-[12.5px] leading-snug text-[#6B7F8D]">{sub}</p>}
          </div>
          {extra}
        </header>
      )}
      {children}
    </section>
  )
}
