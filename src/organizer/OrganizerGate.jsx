import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { becomeOrganizer, useSession } from '../sessionStore'
import { retryHub, useHub } from '../hubStore'

export default function OrganizerGate({ children }) {
  const session = useSession()
  const hub = useHub()
  const location = useLocation()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  if (session.status === 'loading') {
    return <GateNote>Hisob tekshirilmoqda…</GateNote>
  }
  if (session.status !== 'authed') {
    const next = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/kirish?next=${next}&role=organizer`} replace />
  }
  if (session.profile?.role !== 'organizer') {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f4fbfa] px-4">
        <div className="w-full max-w-md rounded-[28px] bg-white px-6 py-8 text-center shadow-[0_16px_50px_rgb(16_50_48/0.08)]">
          <h1 className="text-[26px] font-extrabold tracking-tight text-[#10283f]">Bu bo‘lim faqat tashkilotchilar uchun</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-[#5c6e80]">Seminar yaratish, ishtirokchilar va hamyon uchun tashkilotchi huquqi kerak.</p>
          {err && <p className="mt-3 text-[13px] font-medium text-[#d14343]">{err}</p>}
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              setErr('')
              const res = await becomeOrganizer()
              if (!res.ok) {
                setBusy(false)
                setErr(res.error || 'Huquq berilmadi')
                return
              }
              await retryHub()
              setBusy(false)
            }}
            className="mt-5 h-12 w-full rounded-xl bg-[#0d8a84] text-[15px] font-semibold text-white hover:bg-[#08756f] disabled:opacity-60"
          >
            {busy ? 'Saqlanmoqda…' : 'Tashkilotchi bo‘lish'}
          </button>
        </div>
      </div>
    )
  }
  if (!hub.ready || hub.loading) return <GateNote>Kabinet yuklanmoqda…</GateNote>
  return children
}

function GateNote({ children }) {
  return <div className="grid min-h-screen place-items-center bg-[#f4fbfa] text-[15px] font-semibold text-[#0b8a84]">{children}</div>
}
