import { Info } from 'lucide-react'
import { DEMO_TEXT, DEMO_TITLE } from '../demoContent'

/** Batafsil sahifadagi ogohlantirish kartochkasi. */
export function DemoNotice({ className = '' }) {
  return (
    <div role="note" data-testid="demo-notice" className={`flex items-start gap-2.5 rounded-2xl border border-[#f3d48a] bg-[#fff8e6] p-3 ${className}`}>
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#ffe9b0] text-[#8a5a00]"><Info className="size-[18px]" /></span>
      <span className="min-w-0">
        <b className="block text-[13px] font-bold text-[#6b4500]">{DEMO_TITLE}</b>
        <span className="mt-0.5 block text-[11.5px] leading-snug text-[#7a5a1c]">{DEMO_TEXT}</span>
      </span>
    </div>
  )
}

/** Pastki panel (aloqa/savat tugmalari o‘rniga) — bosilmaydi. */
export function DemoActionBar({ label = 'Namuna e’lon — aloqa o‘chirilgan', className = '' }) {
  return (
    <div data-testid="demo-action" aria-disabled="true" className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#f3d48a] bg-[#fff8e6] text-[13px] font-semibold text-[#6b4500] ${className}`}>
      <Info className="size-[18px]" /> {label}
    </div>
  )
}

/** Kichik «Namuna» belgisi (sarlavha yonida). */
export function DemoChip({ className = '' }) {
  return <span data-testid="demo-chip" className={`inline-flex shrink-0 items-center rounded-full bg-[#f59e0b] px-2 py-0.5 text-[10.5px] font-bold text-white ${className}`}>Namuna</span>
}
