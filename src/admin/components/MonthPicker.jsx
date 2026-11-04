import { CalendarDays, ChevronDown } from 'lucide-react'
import { monthTitle } from '../format'

/** Oy tanlash tugmasi (Hisobotlar va Moliya uchun umumiy). */
export default function MonthPicker({ value, onChange }) {
  return (
    <label className="relative inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#E6EEF0] bg-white px-3 text-[13.5px] font-semibold">
      <CalendarDays className="size-4 text-[#0F766E]" />
      {monthTitle(value)}
      <ChevronDown className="size-4 text-[#5C6E80]" />
      <input type="month" aria-label="Oyni tanlash" className="absolute inset-0 cursor-pointer opacity-0"
        value={`${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`}
        onChange={(e) => {
          const [y, m] = e.target.value.split('-').map(Number)
          if (y && m) onChange(new Date(y, m - 1, 1))
        }}
      />
    </label>
  )
}

/** "Test akkauntlarni chiqarish" almashtirgichi. */
export function TestToggle({ value, onChange }) {
  return (
    <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#E6EEF0] bg-white px-3 text-[13px] font-semibold text-[#10283F]">
      <input type="checkbox" className="size-4 accent-[#0F766E]" checked={value} onChange={(e) => onChange(e.target.checked)} />
      Test akkauntlarsiz
    </label>
  )
}
