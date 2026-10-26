import { useEffect, useState } from 'react'
import { Wallet, Info } from 'lucide-react'
import { insertRow, useAsync, useSellerData, computeStats } from '../../api'
import { som } from '../../format'
import { Btn, Input, Err, toast } from '../ui'
import Modal from '../shell/Modal'

// Reklama balansi naqd tushumlar hamyonidan to'ldiriladi (seller_payout_guard tekshiradi)
export default function TopupModal({ open, onClose }) {
  const data = useSellerData()
  const [amount, setAmount] = useState('')
  const a = useAsync()
  useEffect(() => { if (open) { setAmount(''); a.setError('') } }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const avail = Math.max(0, computeStats(data).balance ?? 0)
  const save = () => {
    const n = Number(amount)
    if (!(n >= 10000)) return a.setError('Kamida 10 000 so‘m kiriting')
    if (n > avail) return a.setError('Hamyonda yetarli mablag‘ yo‘q')
    a.go(() => insertRow('seller_ad_topups', { amount: n }), () => { toast('Reklama balansi to‘ldirildi'); onClose() })
  }
  return (
    <Modal open={open} onClose={onClose} title="Balansni to‘ldirish" subtitle="Mablag‘ hamyoningizdagi mavjud balansdan o‘tkaziladi." width="md:max-w-[460px]" footer={<div className="grid grid-cols-2 gap-3"><Btn variant="outline" onClick={onClose}>Bekor qilish</Btn><Btn icon={Wallet} disabled={a.busy} onClick={save}>To‘ldirish</Btn></div>}>
      <div className="space-y-3">
        <div className="rounded-xl bg-[#F0FDFA] p-3 text-[13px]">Hamyondagi mavjud balans: <b>{som(avail)}</b></div>
        <div className="relative"><Input type="number" min="10000" step="1000" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Summa" className="pr-12" autoFocus /><span className="absolute inset-y-0 right-3 grid place-items-center text-[12.5px] text-[#5C6E80]">so‘m</span></div>
        <div className="flex flex-wrap gap-2">{[100000, 300000, 500000, 1000000].map((x) => <button key={x} type="button" onClick={() => setAmount(String(x))} className="rounded-lg border border-[#DCE5E7] px-2.5 py-1 text-[12.5px] hover:border-[#0F766E]">{som(x)}</button>)}</div>
        <div className="flex gap-2 text-[12px] text-[#5C6E80]"><Info className="size-4 shrink-0 text-[#0F766E]" />To‘lovlar faqat naqd. Hamyon balansi yetkazilgan buyurtmalarning naqd tushumi (12% komissiyadan keyin) hisobidan shakllanadi.</div>
        <Err>{a.error}</Err>
      </div>
    </Modal>
  )
}
