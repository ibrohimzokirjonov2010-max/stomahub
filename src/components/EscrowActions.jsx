import { useState } from 'react'
import { AlertTriangle, CheckCircle2, ShieldCheck, X } from 'lucide-react'
import { canConfirmReceipt, canPayOnline, confirmReceipt, openDispute } from '../buyerApi'
import { payUrlFor, usePaymentConfig } from '../payments/paymentService'
import { profileStore } from '../profileStore'

const fmtDay = (iso) => {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
}
const PAY_TONE = {
  held: 'bg-[#eef4ff] text-[#1d4ed8]', released: 'bg-[#e5f6ec] text-[#15803d]', paid: 'bg-[#e5f6ec] text-[#15803d]',
  refund_pending: 'bg-[#fff4e5] text-[#b45309]', refunded: 'bg-[#f1f5f9] text-[#475569]', failed: 'bg-[#fff1f2] text-[#be123c]', pending: 'bg-[#fff8eb] text-[#92400e]',
}

export function PayStatusPill({ order }) {
  if (!order?.live || !order.paymentStatus) return null
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${PAY_TONE[order.paymentStatus] || PAY_TONE.pending}`}>{order.paymentLabel}</span>
}

/** Xaridor buyurtmasi uchun escrow amallari: To‘lash / Qabul qildim / Muammo bor. */
export default function EscrowActions({ order, compact = false, onDone }) {
  const cfg = usePaymentConfig()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [dispute, setDispute] = useState(false)
  const [reason, setReason] = useState('')
  if (!order?.live) return null
  const payUrl = canPayOnline(order) ? payUrlFor(order.method, { code: order.id, amount: order.total }, cfg) : ''
  const canConfirm = canConfirmReceipt(order)
  const open = order.dispute === 'open'
  if (!payUrl && !canConfirm && !open) return null

  const run = async (fn, ok) => {
    setBusy(true); setErr('')
    try { await fn(); setMsg(ok); setDispute(false); profileStore.refreshOrders?.(); onDone?.() } catch (e) { setErr(e.message || 'Xatolik') } finally { setBusy(false) }
  }
  const btn = compact ? 'h-9 px-3 text-[12px]' : 'h-10 px-4 text-[13px]'
  return (
    <div className="mt-2 w-full">
      {canConfirm && (
        <p className="mb-2 flex items-start gap-1.5 text-[11.5px] text-[#475569]">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-[#0F766E]" />
          {order.autoReleaseAt ? `Pul escrowda. ${fmtDay(order.autoReleaseAt)} kuni avtomatik sotuvchiga o‘tadi.` : 'Pul escrowda. Mahsulotni olgach tasdiqlang.'}
        </p>
      )}
      {open && <p className="mb-2 rounded-lg bg-[#fff4e5] px-2.5 py-1.5 text-[12px] text-[#b45309]">Nizo ochilgan — admin ko‘rib chiqmoqda. Pul muzlatilgan.</p>}
      <div className="flex flex-wrap gap-2">
        {payUrl && <a href={payUrl} className={`inline-flex items-center rounded-lg bg-[#0F766E] font-semibold text-white ${btn}`}>To‘lash</a>}
        {canConfirm && (
          <button type="button" disabled={busy} onClick={() => run(() => confirmReceipt(order.dbId), 'Rahmat! Pul sotuvchiga o‘tkazildi')} className={`inline-flex items-center gap-1.5 rounded-lg bg-[#0F766E] font-semibold text-white disabled:opacity-60 ${btn}`}>
            <CheckCircle2 className="size-4" /> Qabul qildim
          </button>
        )}
        {canConfirm && (
          <button type="button" disabled={busy} onClick={() => setDispute(true)} className={`inline-flex items-center gap-1.5 rounded-lg border border-[#f3c2c2] bg-white font-semibold text-[#b42318] disabled:opacity-60 ${btn}`}>
            <AlertTriangle className="size-4" /> Muammo bor
          </button>
        )}
      </div>
      {msg && <p role="status" className="mt-2 text-[12px] font-medium text-[#15803d]">{msg}</p>}
      {err && !dispute && <p role="alert" className="mt-2 text-[12px] text-[#b42318]">{err}</p>}
      {dispute && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/40 p-4" onClick={() => setDispute(false)}>
          <div role="dialog" aria-labelledby="dispute-title" className="w-full max-w-[420px] rounded-2xl bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <b id="dispute-title" className="text-[16px] text-[#12263a]">Muammo haqida xabar bering</b>
              <button type="button" aria-label="Yopish" onClick={() => setDispute(false)} className="text-[#6b7c8f]"><X className="size-4" /></button>
            </div>
            <p className="mt-1 text-[12.5px] text-[#6b7c8f]">Buyurtma #{order.id}. Pul admin hal qilguncha sotuvchiga o‘tmaydi.</p>
            <textarea autoFocus maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Masalan: mahsulot shikastlangan, noto‘g‘ri mahsulot keldi, to‘liq emas…" className="mt-3 h-28 w-full resize-none rounded-xl border border-[#dbe5ee] px-3 py-2 text-[13px] outline-none focus:border-[#0F766E]" />
            {err && <p role="alert" className="mt-1 text-[12px] text-[#b42318]">{err}</p>}
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={() => setDispute(false)} className="h-10 rounded-xl border border-[#dbe5ee] px-4 text-[13px] font-semibold">Bekor qilish</button>
              <button type="button" disabled={busy} onClick={() => run(() => openDispute(order.dbId, reason), 'Murojaatingiz qabul qilindi. Admin tez orada bog‘lanadi.')} className="h-10 rounded-xl bg-[#b42318] px-4 text-[13px] font-semibold text-white disabled:opacity-60">Yuborish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
