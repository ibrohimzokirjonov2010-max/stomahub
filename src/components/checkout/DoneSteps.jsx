// Buyurtma holati qadamlari (muvaffaqiyat sahifasi): birinchisi faol.
import { Check } from 'lucide-react'

const DONE_STEPS = ['Qabul qilindi', 'Sotuvchi tasdiqlaydi', 'Yetkazilmoqda', 'Yetkazildi']
const DONE_STEPS_PICKUP = ['Qabul qilindi', 'Sotuvchi tasdiqlaydi', 'Olib ketishga tayyor', 'Olib ketildi']

export default function DoneSteps({ pickup }) {
  const steps = pickup ? DONE_STEPS_PICKUP : DONE_STEPS
  return (
    <ol className="grid grid-cols-4 gap-1" data-testid="done-steps" aria-label="Buyurtma holati">
      {steps.map((t, i) => (
        <li key={t} className="relative flex flex-col items-center text-center">
          {i > 0 && <span className="absolute right-1/2 top-[13px] h-[2px] w-full -translate-y-1/2 bg-[#e3e9ef]" aria-hidden="true" />}
          <span className={`relative z-[1] grid size-[26px] place-items-center rounded-full text-[11px] font-bold ${i === 0 ? 'bg-sea text-white shadow-[0_0_0_4px_rgb(13_138_132/0.15)]' : 'border-2 border-[#e3e9ef] bg-white text-muted'}`}>{i === 0 ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}</span>
          <span className={`mt-1.5 text-[11.5px] leading-tight ${i === 0 ? 'font-bold text-sea' : 'text-muted'}`} aria-current={i === 0 ? 'step' : undefined}>{t}</span>
        </li>
      ))}
    </ol>
  )
}
