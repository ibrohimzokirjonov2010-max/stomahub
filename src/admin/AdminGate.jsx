import { Link, Navigate, useLocation } from 'react-router-dom'
import { useSession } from '../sessionStore'

export default function AdminGate({ children }) {
  const session = useSession()
  const location = useLocation()

  if (session.status === 'loading') {
    return <div className="grid min-h-screen place-items-center bg-[#F4F7F8] text-[15px] font-semibold text-[#0F766E]">Yuklanmoqda…</div>
  }
  if (session.status !== 'authed') {
    const next = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/kirish?next=${next}`} replace />
  }
  if (session.profile?.role !== 'admin') {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F4F7F8] px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-[0_16px_50px_rgb(16_50_48/0.08)]">
          <h1 className="text-[22px] font-extrabold text-[#10283F]">Admin panel</h1>
          <p className="mt-3 text-[14px] leading-relaxed text-[#b42318]">Bu sahifa faqat administratorlar uchun.</p>
          <Link to="/" className="mt-5 inline-block font-semibold text-[#0F766E]">Bosh sahifa</Link>
        </div>
      </div>
    )
  }
  return children
}
