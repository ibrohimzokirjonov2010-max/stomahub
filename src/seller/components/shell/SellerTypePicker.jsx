import { useState } from 'react'
import { Package, Shirt, Monitor, Check, X, Loader2 } from 'lucide-react'
import { supabase } from '../../../supabaseClient'
import { refreshSession } from '../../../sessionStore'
import { SELLER_TYPES } from '../../../lib/sellerType'

const ICONS = { stomatologik: Package, forma: Shirt, jihozlar: Monitor }

/**
 * Do‘kon yo‘nalishini tanlash (0065: seller_set_type). Tasdiqlangandan keyin bir marta majburiy;
 * keyin mahsulot formasidan «o‘zgartirish» orqali (boshqa yo‘nalishdagi faol mahsulot bo‘lmasa).
 */
export default function SellerTypePicker({ open, current = '', onClose, onDone }) {
  const [pick, setPick] = useState(current || '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  if (!open) return null
  const change = !!onClose
  async function save() {
    if (!pick || busy) return
    if (pick === current) { onClose?.(); return }
    setBusy(true); setErr('')
    const { error } = await supabase.rpc('seller_set_type', { p_type: pick })
    if (error) { setErr(String(error.message || 'Saqlab bo‘lmadi').replace(/^.*?: /, '')); setBusy(false); return }
    await refreshSession()
    setBusy(false)
    onDone?.(pick)
  }
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#0B2A2E]/45 md:items-center md:p-4" onMouseDown={(e) => change && e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="Do‘kon yo‘nalishi" data-testid="seller-type-picker"
        className="w-full rounded-t-[26px] bg-white px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-4 shadow-[0_24px_70px_rgb(8_40_45/0.25)] md:max-w-[520px] md:rounded-[18px] md:p-6">
        <div className="mx-auto mb-3 h-1 w-11 rounded-full bg-[#D5DEE0] md:hidden" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[20px] font-extrabold tracking-tight text-[#10283F]">{change ? 'Do‘kon yo‘nalishi' : 'Nima sotasiz?'}</h2>
            <p className="mt-0.5 text-[13.5px] leading-snug text-[#5C6E80]">Bitta yo‘nalishni tanlang — mahsulot qo‘shish formasi va mahsulotlaringiz chiqadigan bo‘lim shunga moslanadi.</p>
          </div>
          {change && <button type="button" onClick={onClose} aria-label="Yopish" className="rounded-lg p-1 text-[#10283F] hover:bg-[#F0FDFA]"><X className="size-5" /></button>}
        </div>
        <div className="mt-4 space-y-2.5" role="radiogroup">
          {SELLER_TYPES.map((t) => {
            const Icon = ICONS[t.key]
            const on = pick === t.key
            return (
              <button key={t.key} type="button" role="radio" aria-checked={on} onClick={() => { setPick(t.key); setErr('') }}
                className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${on ? 'border-[#0F766E] bg-[#F0FDFA] shadow-[0_0_0_1px_#0F766E]' : 'border-[#E2EAEC] hover:border-[#9FD8D1]'}`}>
                <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${on ? 'bg-[#0F766E] text-white' : 'bg-[#EEF6F5] text-[#0F766E]'}`}><Icon className="size-[22px]" strokeWidth={1.8} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold text-[#10283F]">{t.label}</span>
                  <span className="block text-[12.5px] leading-snug text-[#5C6E80]">{t.text}</span>
                  <span className="mt-0.5 block text-[11.5px] font-semibold text-[#0F766E]">→ {t.section} bo‘limida</span>
                </span>
                <span className={`grid size-5 shrink-0 place-items-center rounded-full border ${on ? 'border-[#0F766E] bg-[#0F766E] text-white' : 'border-[#C9D6DA]'}`}>{on && <Check className="size-3.5" strokeWidth={3} />}</span>
              </button>
            )
          })}
        </div>
        {err && <p role="alert" className="mt-3 rounded-xl bg-[#FFF1F2] px-3 py-2 text-[13px] text-[#BE123C]">{err}</p>}
        <p className="mt-3 text-[12px] text-[#5C6E80]">Keyin o‘zgartirsa bo‘ladi, agar boshqa yo‘nalishda faol mahsulot qolmagan bo‘lsa.</p>
        <button type="button" disabled={!pick || busy} onClick={save}
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0F766E] text-[15px] font-semibold text-white disabled:opacity-40">
          {busy && <Loader2 className="size-4 animate-spin" />}{change ? 'Saqlash' : 'Davom etish'}
        </button>
      </div>
    </div>
  )
}
