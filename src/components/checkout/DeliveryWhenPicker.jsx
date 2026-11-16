// Yetkazish / olib ketish vaqtini tanlash: «Imkon qadar tezroq», kun chiplari (Bugun, Ertaga, +5 kun) va vaqt oraliqlari.
import { useEffect, useState } from 'react'
import { CalendarDays, Clock3, Info, Zap } from 'lucide-react'
import { ASAP, TIME_WINDOWS, dayChips, isAsap, normalizeWhen, slotOpen, tashkentNow, whenLabel } from '../../lib/deliveryWhen.js'

function useMinuteTick() {
  const [, set] = useState(0)
  useEffect(() => { const t = setInterval(() => set((n) => n + 1), 60000); return () => clearInterval(t) }, [])
}

export default function DeliveryWhenPicker({ value, onChange, pickup = false, minDate, err = '', compact = false }) {
  useMinuteTick()
  const now = tashkentNow()
  const days = dayChips(minDate, now)
  // Eskirgan tanlov (o‘tgan kun, yopilgan oraliq) avtomatik tuzatiladi
  useEffect(() => {
    const n = normalizeWhen(value, minDate, now)
    if (n.date !== value?.date || n.slot !== value?.slot) onChange(n)
  }) // eslint-disable-line react-hooks/exhaustive-deps
  const asap = isAsap(value)
  const pickDay = (iso) => {
    const first = TIME_WINDOWS.find((w) => slotOpen(iso, w, now))
    onChange({ date: iso, slot: value?.date === iso && !asap ? value.slot : first })
  }
  const chip = (on, disabled) => `shrink-0 rounded-xl border transition ${on ? 'border-sea bg-sea-50 text-sea ring-1 ring-sea/30' : 'border-[#e3e9ef] bg-white text-ink-2 hover:border-sea/50'} ${disabled ? 'cursor-not-allowed opacity-40 hover:border-[#e3e9ef]' : ''}`
  return (
    <section data-testid="delivery-when" className={`rounded-2xl bg-white shadow-card ${compact ? 'mt-3 p-3' : 'p-4'}`}>
      <h2 className={`flex items-center gap-2 font-bold text-[#0d2a4a] ${compact ? 'text-[14px]' : 'text-[16px]'}`}>
        <span className="grid size-8 place-items-center rounded-xl bg-sea-50 text-sea"><CalendarDays className="size-4" /></span>
        {pickup ? 'Qachon olib ketasiz?' : 'Yetkazish sanasi va vaqti'}
      </h2>
      <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar" role="radiogroup" aria-label="Kun">
        <button type="button" role="radio" aria-checked={asap} data-testid="when-asap" onClick={() => onChange({ date: '', slot: ASAP })} className={`${chip(asap)} flex items-center gap-1.5 px-3 py-2 text-left`}>
          <Zap className="size-4 shrink-0" />
          <span><b className="block text-[13px] leading-tight">Imkon qadar tezroq</b><span className="block text-[11px] leading-tight opacity-80">Eng yaqin vaqtda</span></span>
        </button>
        {days.map((d) => {
          const on = !asap && value?.date === d.iso
          return (
            <button key={d.iso} type="button" role="radio" aria-checked={on} disabled={d.disabled} data-testid="when-day" data-iso={d.iso} title={d.disabled ? 'Bu kunga bo‘sh vaqt qolmadi' : undefined} onClick={() => pickDay(d.iso)} className={`${chip(on, d.disabled)} min-w-[78px] px-3 py-2 text-left`}>
              <b className="block text-[13px] leading-tight">{d.label}</b>
              <span className="block text-[11px] leading-tight opacity-80">{d.disabled && d.label === 'Bugun' ? 'Vaqt qolmadi' : d.date}</span>
            </button>
          )
        })}
      </div>
      {!asap && value?.date && (
        <div className="mt-3">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0d2a4a]"><Clock3 className="size-3.5 text-sea" /> Vaqt oralig‘i</p>
          <div className={`mt-1.5 grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
            {TIME_WINDOWS.map((w) => {
              const open = slotOpen(value.date, w, now)
              const on = value.slot === w
              return <button key={w} type="button" disabled={!open} aria-pressed={on} data-testid="when-slot" onClick={() => onChange({ date: value.date, slot: w })} className={`${chip(on, !open)} h-10 text-center text-[13px] font-semibold`}>{w}</button>
            })}
          </div>
        </div>
      )}
      {err && <p className="mt-2 text-[12px] font-medium text-[#e11d48]">{err}</p>}
      <div className="mt-3 rounded-xl bg-[#f4f8fa] px-3 py-2 text-[12px] text-ink-2">
        <p>Tanlandi: <b className="text-[#0d2a4a]" data-testid="when-chosen">{whenLabel(value, now)}</b></p>
        <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-muted"><Info className="size-3.5 shrink-0" /> Sotuvchi tasdiqlagach, aniq vaqtni siz bilan kelishadi. Vaqtlar Toshkent bo‘yicha.</p>
      </div>
    </section>
  )
}
