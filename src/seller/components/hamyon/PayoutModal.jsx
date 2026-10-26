import { useState } from 'react'
import { Wallet, Info, Send } from 'lucide-react'
import Modal from '../shell/Modal'
import { Btn, Field, Input, Textarea, Err, toast } from '../ui'
import { requestPayout } from '../../api'
import { som } from '../../format'

export default function PayoutModal({ open, onClose, balance }) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const v = Number(String(amount).replace(/\D/g, ''))
  const submit = async () => {
    if (!v) return setErr('Summani kiriting.')
    if (v > balance) return setErr('Summa mavjud balansdan oshmasligi kerak.')
    setBusy(true); const r = await requestPayout({ amount: v, note }); setBusy(false)
    if (!r.ok) return setErr(r.error || 'So‘rov yuborilmadi.')
    toast('Pul yechish so‘rovi yuborildi'); setAmount(''); setNote(''); setErr(''); onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="Pul yechish so‘rovi" subtitle="Balansingizdan pul yechish uchun so‘rov yuboring." width="md:max-w-[480px]"
      footer={<div className="grid grid-cols-2 gap-3"><Btn variant="outline" onClick={onClose}>Bekor qilish</Btn><Btn icon={Send} onClick={submit} disabled={busy || !balance}>So‘rov yuborish</Btn></div>}>
      <div className="space-y-4">
        <div className="flex items-center gap-4 rounded-xl bg-[#F0FDFA] p-4"><span className="grid size-12 place-items-center rounded-full bg-[#CCFBF1] text-[#0F766E]"><Wallet className="size-6" /></span><div><div className="text-[12px] text-[#3D4E5F]">Mavjud balans</div><div className="text-[20px] font-extrabold">{som(balance)}</div><div className="text-[11.5px] text-[#5C6E80]">Pul yechish uchun mavjud</div></div></div>
        <Field label="Summa (so‘m)" hint={`Mavjud balans: ${som(balance)}`}><span className="relative block"><Input inputMode="numeric" value={v ? v.toLocaleString('ru-RU').replace(/,/g, ' ') : ''} onChange={(e) => { setAmount(e.target.value); setErr('') }} placeholder="0" className="pr-14" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-[#5C6E80]">so‘m</span></span></Field>
        <div className="flex gap-3 rounded-xl bg-[#F0FDFA] p-3.5"><Info className="mt-0.5 size-5 shrink-0 text-[#0F766E]" /><div><div className="text-[13px] font-bold">Pul naqd tarzda topshiriladi.</div><div className="text-[12px] text-[#3D4E5F]">So‘rovingiz ko‘rib chiqilgandan so‘ng, pul sizga naqd tarzda topshiriladi.</div></div></div>
        <Field label="Izoh (ixtiyoriy)"><Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Masalan: Shaxsiy foydalanish uchun" /></Field>
        <Err>{err}</Err>
      </div>
    </Modal>
  )
}
