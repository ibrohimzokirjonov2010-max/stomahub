import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { BadgeCheck, Settings, ShieldCheck } from 'lucide-react'
import { canEnterSeller, useSession } from '../sessionStore'
import { withGeo } from '../components/MapPicker'
import StepForm from './StepForm'
import ApplyShell from './ApplyShell'
import { SELLER_REGISTER } from './sellerConfig'
import { loadPrefill, registerSeller } from './api'

/** Stage 1: "Sotuvchi bo‘lish" short registration. */
export default function SellerRegister() {
  const session = useSession()
  const navigate = useNavigate()
  const [init, setInit] = useState(null)
  useEffect(() => {
    if (session.status !== 'authed') return
    loadPrefill().then(({ profile, settings }) => setInit(SELLER_REGISTER.initial({ ...session.profile, ...profile }, settings)))
  }, [session.status]) // eslint-disable-line react-hooks/exhaustive-deps

  if (session.status === 'loading') return <ApplyShell><p className="py-20 text-center font-semibold text-[#0F766E]">Hisob tekshirilmoqda…</p></ApplyShell>
  if (session.status !== 'authed') return <Navigate to="/kirish?next=%2Fsotuvchi-bolish&role=seller" replace />
  if (canEnterSeller(session.profile)) return <Navigate to={session.profile.seller_status === 'approved' || session.profile.role === 'admin' ? '/sotuvchi' : '/sotuvchi/sozlamalar'} replace />
  if (session.profile?.seller_status === 'blocked') return <Navigate to="/sotuvchi" replace />

  const submit = async (v) => {
    const r = await registerSeller(v, v.lat != null ? withGeo(v.address.trim(), v) : v.address.trim())
    if (r.ok) navigate('/sotuvchi/sozlamalar?royxat=1', { replace: true })
    return r
  }

  return (
    <ApplyShell back="/profil" backLabel="Profil">
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {init ? <StepForm config={SELLER_REGISTER} initial={init} onSubmit={submit} /> : <p className="py-20 text-center font-semibold text-[#0F766E]">Yuklanmoqda…</p>}
        <aside className="hidden h-fit rounded-[20px] border border-[#E6EEF0] bg-white p-5 lg:block">
          <h3 className="text-[15px] font-bold text-[#10283F]">Qanday ishlaydi?</h3>
          {[[Settings, '1. Ro‘yxatdan o‘ting', 'Kabinet ochiladi — do‘kon sozlamalarini to‘ldirasiz.'], [ShieldCheck, '2. Tasdiqdan o‘ting', 'Mahsulot qo‘shishdan oldin YaTT/MChJ hujjatlarini yuborasiz.'], [BadgeCheck, '3. Sotishni boshlang', '7 ish kuni ichida tasdiqlangach, barcha bo‘limlar ochiladi.']].map(([I, t, d]) => (
            <div key={t} className="mt-4 flex gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#E3F4F1] text-[#0F766E]"><I className="size-4.5" /></span><span><b className="block text-[14px] text-[#10283F]">{t}</b><span className="text-[13px] text-[#5C6E80]">{d}</span></span></div>
          ))}
        </aside>
      </div>
    </ApplyShell>
  )
}
