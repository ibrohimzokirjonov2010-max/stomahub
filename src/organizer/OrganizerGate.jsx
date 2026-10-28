import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { becomeOrganizer, canUseOrganizer, refreshSession, useSession } from '../sessionStore'
import NoAccess from '../components/NoAccess'
import { retryHub, useHub } from '../hubStore'

export default function OrganizerGate({ children }) {
  const session = useSession()
  const hub = useHub()
  const location = useLocation()
  const [stuck, setStuck] = useState(false)

  const waitingSession = session.status === 'loading'
  const waitingHub = session.status === 'authed' && canUseOrganizer(session.profile) && (!hub.ready || hub.loading)

  useEffect(() => {
    if (!waitingSession && !waitingHub) {
      setStuck(false)
      return undefined
    }
    setStuck(false)
    const timer = window.setTimeout(() => setStuck(true), 8000)
    return () => window.clearTimeout(timer)
  }, [waitingSession, waitingHub, session.status, hub.ready, hub.loading])

  useEffect(() => {
    if (waitingSession) refreshSession().catch(() => {})
  }, [waitingSession])

  const retry = async () => {
    setStuck(false)

    await refreshSession().catch(() => {})
    await retryHub()
  }

  if (waitingSession) {
    if (stuck) {
      return (
        <GateNote>
          <p>Hisobni tekshirish uzoq ketdi.</p>
          <button type="button" onClick={retry} className="mt-4 h-11 rounded-xl bg-[#0d8a84] px-5 text-[14px] font-semibold text-white">
            Qayta urinish
          </button>
        </GateNote>
      )
    }
    return <GateNote>Hisob tekshirilmoqda…</GateNote>
  }
  if (session.status !== 'authed') {
    const next = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/kirish?next=${next}&role=organizer`} replace />
  }
  if (!canUseOrganizer(session.profile)) {
    return <NoAccess kind="organizer" role={session.profile?.role} status={session.profile?.org_status} onApply={becomeOrganizer} />
  }
  if (waitingHub) {
    if (stuck) {
      return (
        <GateNote>
          <p>Kabinet yuklanishi uzoq ketdi.</p>
          {hub.error && <p className="mt-2 text-[13px] font-medium text-[#d14343]">{hub.error}</p>}
          <button type="button" onClick={retry} className="mt-4 h-11 rounded-xl bg-[#0d8a84] px-5 text-[14px] font-semibold text-white">
            Qayta urinish
          </button>
        </GateNote>
      )
    }
    return <GateNote>Kabinet yuklanmoqda…</GateNote>
  }
  return children
}

function GateNote({ children }) {
  return <div className="grid min-h-screen place-items-center bg-[#f4fbfa] px-4 text-center text-[15px] font-semibold text-[#0b8a84]">{children}</div>
}
