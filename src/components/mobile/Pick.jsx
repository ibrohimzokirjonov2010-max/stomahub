import { ChevronDown } from 'lucide-react'

// Mobil filtr "chip-select" (avval MobileIshlar ichida edi).
export function Pick({ icon: Icon, label, value, onChange, options, on }) {
  return (
    <label className={`relative flex h-10 shrink-0 items-center gap-1.5 rounded-xl border px-2.5 text-[11.5px] font-medium ${on ? 'border-sea bg-[#e6f6f5] text-sea' : 'border-line/70 bg-white text-ink'}`}>
      <Icon className="size-4 shrink-0" />
      <span className="whitespace-nowrap">{label}</span>
      <ChevronDown className="size-3.5 shrink-0 text-muted" />
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className="absolute inset-0 opacity-0">
        {options.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>
    </label>
  )
}
