import { useEffect, useState } from 'react'
import Modal from './Modal'

/** Confirm step with an (optionally required) reason field. onConfirm(reason) may throw -> shown inline. */
export default function ConfirmReason({
  open, title, text, confirmLabel = 'Tasdiqlash', danger = false, needReason = true,
  reasonLabel = 'Sabab', placeholder = 'Sababini yozing (kamida 3 belgi)', onClose, onConfirm,
}) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  useEffect(() => { if (open) { setReason(''); setErr(''); setBusy(false) } }, [open])
  const go = async () => {
    if (needReason && reason.trim().length < 3) { setErr('Sababini yozing (kamida 3 belgi).'); return }
    setBusy(true); setErr('')
    try { await onConfirm(reason.trim()); onClose() } catch (e) { setErr(e?.message || String(e)) } finally { setBusy(false) }
  }
  return (
    <Modal open={open} onClose={onClose} title={title} width="max-w-[480px]"
      footer={(
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-xl border border-[#E6EEF0] px-4 text-[13.5px] font-semibold text-[#3D4E5F]">Bekor qilish</button>
          <button type="button" data-testid="confirm-ok" disabled={busy} onClick={go}
            className={`h-10 rounded-xl px-4 text-[13.5px] font-semibold text-white disabled:opacity-60 ${danger ? 'bg-[#b42318]' : 'bg-[#0F766E]'}`}>{confirmLabel}</button>
        </div>
      )}>
      <div className="p-5">
        {text && <p className="text-[14px] text-[#3D4E5F]">{text}</p>}
        {needReason && (
          <label className="mt-3 block text-[12.5px] font-semibold text-[#12263a]">{reasonLabel}
            <textarea data-testid="confirm-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={placeholder}
              className="mt-1 w-full rounded-xl border border-[#e6ebf2] px-3 py-2 text-[14px] font-normal" />
          </label>
        )}
        {err && <p role="alert" className="mt-2 text-[13px] text-[#b42318]">{err}</p>}
      </div>
    </Modal>
  )
}
