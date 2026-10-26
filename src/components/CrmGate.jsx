import { Navigate, useLocation } from 'react-router-dom'
import { useSession } from '../sessionStore'

// Shifokor CRM bo‘limlari faqat kirgan foydalanuvchilar uchun.
// Rol yo‘naltirish Auth.jsx dagi bilan bir xil: organizer -> /tashkilotchi, qolganlar -> CRM.
export default function CrmGate({ children }) {
  const session = useSession()
  const location = useLocation()
  if (session.status === 'loading') {
    return <div className="grid min-h-screen place-items-center bg-[#f4fbfa] text-[15px] font-semibold text-[#0b8a84]">Hisob tekshirilmoqda…</div>
  }
  if (session.status !== 'authed') {
    const next = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/kirish?next=${next}`} replace />
  }
  if (session.profile?.role === 'organizer') return <Navigate to="/tashkilotchi" replace />
  return children
}
