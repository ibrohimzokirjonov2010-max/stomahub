import { Navigate, useLocation } from 'react-router-dom'
import { canUseSeller, useSession } from '../sessionStore'
import NoAccess from '../components/NoAccess'
import { becomeSeller } from './api'

export default function SellerGate({ children }) {
  const session = useSession()
  const location = useLocation()

  if (session.status === 'loading') return <Note>Hisob tekshirilmoqda…</Note>
  if (session.status !== 'authed') {
    const next = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/kirish?next=${next}&role=seller`} replace />
  }
  if (!canUseSeller(session.profile)) {
    return <NoAccess kind="seller" role={session.profile?.role} status={session.profile?.seller_status} onApply={becomeSeller} />
  }
  return children
}

function Note({ children }) {
  return <div className="grid min-h-screen place-items-center bg-[#F4FBFA] text-[15px] font-semibold text-[#0F766E]">{children}</div>
}
