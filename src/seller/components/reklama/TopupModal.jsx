import { useEffect, useState } from 'react'
import { Send, Info, Banknote, Landmark, ImagePlus, Loader2, X, Clock3 } from 'lucide-react'
import { requestAdTopup, cancelAdTopup, uploadMedia, useAsync, useSellerData, CLICK_TOPUP_ENABLED, startClickTopup } from '../../api'
import { som, dmy } from '../../format'
import { Btn, Input, Textarea, Err, Badge, toast } from '../ui'
import Modal from '../shell/Modal'
import { ADS, TOPUP_METHODS, TOPUP_STATUS } from './constants'

const METHODS = [
  ['naqd', Banknote, 'Naqd', 'Pulni StomaHub menejeriga topshirasiz'],
  ['bank', Landmark, 'Bank o‘tkazma', 'Hisobga o‘tkazib, chekni biriktirasiz'],
]

/**
 * “To‘ldirish so‘rovi”: sotuvchi summa va usulni yuboradi, admin pul tushganini
 * tasdiqlagach reklama balansiga qo‘shiladi. Hamyonga bog‘liq emas, onlayn to‘lov yo‘q.
 */
export default function TopupModal({ open, onClose }) {
  const { adRequests = [] } = useSellerData()
  const [v, setV] = useState({ amount: '', method: 'naqd', receipt_url: '', note: '' })
  const [upl, setUpl] = useState(false)
  const a = useAsync()
  useEffect(() => { if (open) { setV({ amount: '', method: 'naqd', receipt_url: '', note: '' }); a.setError('') } }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const pending = adRequests.filter((r) => r.status === 'kutilmoqda')
  const recent = adRequests.slice(0, 4)
  const set = (k) => (e) => setV((x) => ({ ...x, [k]: e?.target ? e.target.value : e }))

  async function onFile(e) {
    const f = e.target.files?.[0]; e.target.value = ''
    if (!f) return
    if (!/^image\//.test(f.type)) return a.setError('Chek uchun rasm fayl yuklang (JPG, PNG)')
    setUpl(true); const r = await uploadMedia(f, 'ad-receipts'); setUpl(false)
    if (!r.ok) return a.setError(r.error)
    setV((x) => ({ ...x, receipt_url: r.url }))
  }
  const save = () => {
    const n = Math.round(Number(v.amount))
    if (!(n >= ADS.minTopup)) return a.setError('Eng kam summa — 50 000 so‘m')
    if (pending.length >= 3) return a.setError('Sizda 3 ta ko‘rib chiqilmagan so‘rov bor — admin tasdiqlashini kuting')
    a.go(() => requestAdTopup({ ...v, amount: n }), () => { toast('So‘rov yuborildi. Admin tasdiqlagach balans to‘ldiriladi'); onClose() })
  }
  const cancel = (r) => a.go(() => cancelAdTopup(r.id), () => toast('So‘rov bekor qilindi'))

  return (
    <Modal open={open} onClose={onClose} title="To‘ldirish so‘rovi" subtitle="Reklama balansi administrator to‘lovni tasdiqlagandan so‘ng to‘ldiriladi." width="md:max-w-[500px]"
      footer={<div className="grid grid-cols-2 gap-3"><Btn variant="outline" onClick={onClose}>Bekor qilish</Btn><Btn icon={Send} disabled={a.busy || upl} onClick={save}>So‘rov yuborish</Btn></div>}>
      <div className="space-y-3.5">
        <div>
          <div className="mb-1.5 text-[13px] font-semibold text-[#10283F]">Summa *</div>
          <div className="relative"><Input type="number" inputMode="numeric" min={ADS.minTopup} step="1000" value={v.amount} onChange={set('amount')} placeholder="Kamida 50 000" className="pr-12" /><span className="absolute inset-y-0 right-3 grid place-items-center text-[12.5px] text-[#5C6E80]">so‘m</span></div>
          <div className="mt-2 flex flex-wrap gap-2">{[100000, 300000, 500000, 1000000].map((x) => <button key={x} type="button" onClick={() => setV((s) => ({ ...s, amount: String(x) }))} className={`rounded-lg border px-2.5 py-1 text-[12.5px] ${Number(v.amount) === x ? 'border-[#0F766E] bg-[#F0FDFA] text-[#0F766E]' : 'border-[#DCE5E7] hover:border-[#0F766E]'}`}>{som(x)}</button>)}</div>
        </div>
        <div>
          <div className="mb-1.5 text-[13px] font-semibold text-[#10283F]">To‘lov usuli *</div>
          <div className="grid grid-cols-2 gap-2">{METHODS.map(([k, I, l, s]) => (
            <button key={k} type="button" onClick={() => setV((x) => ({ ...x, method: k }))} className={`rounded-xl border p-2.5 text-left ${v.method === k ? 'border-[#0F766E] bg-[#F0FDFA]' : 'border-[#E6EEF0] hover:border-[#99D5CE]'}`}>
              <I className="size-5 text-[#0F766E]" /><div className="mt-1 text-[13.5px] font-bold">{l}</div><div className="text-[11.5px] leading-snug text-[#5C6E80]">{s}</div>
            </button>))}
          </div>
          {CLICK_TOPUP_ENABLED && <button type="button" onClick={async () => { const r = await startClickTopup(v.amount); if (!r.ok) a.setError(r.error) }} className="mt-2 w-full rounded-xl border border-dashed border-[#CCE3E0] p-2 text-[12.5px] text-[#5C6E80]">Click orqali to‘lash (tez orada)</button>}
        </div>
        <div>
          <div className="mb-1.5 text-[13px] font-semibold text-[#10283F]">To‘lov cheki {v.method === 'bank' ? '(tavsiya etiladi)' : '(ixtiyoriy)'}</div>
          {v.receipt_url
            ? <div className="flex items-center gap-3 rounded-xl border border-[#E6EEF0] p-2"><img src={v.receipt_url} alt="Chek" className="size-12 rounded-lg object-cover" /><span className="flex-1 truncate text-[12.5px]">Chek biriktirildi</span><button type="button" aria-label="Olib tashlash" onClick={() => setV((x) => ({ ...x, receipt_url: '' }))} className="p-1.5"><X className="size-4" /></button></div>
            : <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#CCE3E0] p-3 text-[13px] text-[#0F766E] hover:bg-[#F0FDFA]">{upl ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}Chek rasmini yuklash<input type="file" accept="image/*" className="hidden" disabled={upl} onChange={onFile} /></label>}
        </div>
        <div><div className="mb-1.5 text-[13px] font-semibold text-[#10283F]">Izoh (ixtiyoriy)</div><Textarea value={v.note} onChange={set('note')} maxLength={300} className="min-h-[56px]" placeholder={v.method === 'bank' ? 'Masalan: to‘lov topshiriqnomasi raqami' : 'Masalan: qachon va kimga topshirasiz'} /></div>
        <div className="flex gap-2 rounded-xl bg-[#F0FDFA] p-3 text-[12px] text-[#3D4E5F]"><Info className="size-4 shrink-0 text-[#0F766E]" />So‘rov “Kutilmoqda” holatida bo‘ladi. Administrator pul tushganini tasdiqlagach, summa reklama balansiga qo‘shiladi. Hamyondagi mablag‘ingizga ta’sir qilmaydi.</div>
        <Err>{a.error}</Err>
        {recent.length > 0 && <div className="rounded-xl border border-[#E6EEF0]">
          <div className="border-b border-[#EEF3F4] px-3 py-2 text-[13px] font-bold">So‘nggi so‘rovlar</div>
          {recent.map((r) => { const [l, t] = TOPUP_STATUS[r.status] || TOPUP_STATUS.kutilmoqda; return (
            <div key={r.id} className="flex items-center gap-2.5 border-b border-[#EEF3F4] px-3 py-2 text-[12.5px] last:border-0">
              <Clock3 className="size-4 shrink-0 text-[#5C6E80]" />
              <div className="min-w-0 flex-1"><b>{som(r.amount)}</b> <span className="text-[#5C6E80]">· {TOPUP_METHODS[r.method] || r.method} · {dmy(r.created_at)}</span>{r.status === 'rad_etildi' && r.reject_reason && <div className="truncate text-[11.5px] text-[#B42318]">Sabab: {r.reject_reason}</div>}</div>
              <Badge tone={t} dot>{l}</Badge>
              {r.status === 'kutilmoqda' && <button type="button" onClick={() => cancel(r)} disabled={a.busy} className="text-[12px] text-[#B42318]">Bekor qilish</button>}
            </div>) })}
        </div>}
      </div>
    </Modal>
  )
}
