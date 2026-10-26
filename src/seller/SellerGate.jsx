import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSession } from '../sessionStore'
import { becomeSeller } from './api'

export default function SellerGate({ children }) {
  const session = useSession()
  const location = useLocation()
  const [shop, setShop] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  if (session.status === 'loading') return <Note>Hisob tekshirilmoqda…</Note>
  if (session.status !== 'authed') {
    const next = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/kirish?next=${next}&role=seller`} replace />
  }
  if (session.profile?.role !== 'seller') {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F4FBFA] px-4">
        <form
          className="w-full max-w-md rounded-[24px] bg-white px-6 py-8 text-center shadow-[0_16px_50px_rgb(16_50_48/0.08)]"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!shop.trim()) { setErr('Do‘kon nomini kiriting'); return }
            setBusy(true); setErr('')
            const res = await becomeSeller(shop.trim())
            setBusy(false)
            if (!res.ok) setErr(res.error)
          }}
        >
          <h1 className="text-[24px] font-extrabold tracking-tight text-[#10283F]">Sotuvchi kabineti</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-[#5C6E80]">Mahsulot sotish uchun do‘koningizni oching. Har bir buyurtmadan 12% komissiya olinadi, to‘lov faqat naqd.</p>
          <input value={shop} onChange={(e) => setShop(e.target.value)} placeholder="Do‘kon nomi" className="mt-5 h-12 w-full rounded-xl border border-[#DCE5E7] px-4 text-[15px] outline-none focus:border-[#0F766E]" />
          {err && <p className="mt-3 text-[13px] font-medium text-[#0F766E]">{err}</p>}
          <button type="submit" disabled={busy} className="mt-4 h-12 w-full rounded-xl bg-[#0F766E] text-[15px] font-semibold text-white hover:bg-[#115E59] disabled:opacity-60">
            {busy ? 'Saqlanmoqda…' : 'Sotuvchi bo‘lish'}
          </button>
        </form>
      </div>
    )
  }
  return children
}

function Note({ children }) {
  return <div className="grid min-h-screen place-items-center bg-[#F4FBFA] text-[15px] font-semibold text-[#0F766E]">{children}</div>
}
