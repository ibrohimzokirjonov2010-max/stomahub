import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { BadgeCheck, Settings, ShieldCheck } from 'lucide-react'
import { canEnterOrganizer, useSession } from '../sessionStore'
import { withGeo } from '../components/MapPicker'
import StepForm from './StepForm'
import ApplyShell from './ApplyShell'
import { ORGANIZER_REGISTER } from './organizerConfig'
import { loadOrgPrefill, registerOrganizer } from './api'

/** Stage 1: "Tashkilotchi bo‘lish" short registration. */
export default function OrganizerRegister() {
  const session = useSession()
  const navigate = useNavigate()
  const [init, setInit] = useState(null)
  useEffect(() => {
    if (session.status !== 'authed') return
    loadOrgPrefill().then(({ profile, settings }) => setInit(ORGANIZER_REGISTER.initial({ ...session.profile, ...profile }, settings)))
  }, [session.status]) // eslint-disable-line react-hooks/exhaustive-deps

  if (session.status === 'loading') return <ApplyShell><p className="py-20 text-center font-semibold text-[#0F766E]">Hisob tekshirilmoqda…</p></ApplyShell>
  if (session.status !== 'authed') return <Navigate to="/kirish?next=%2Ftashkilotchi-bolish&role=organizer" replace />
  if (canEnterOrganizer(session.profile)) return <Navigate to={session.profile.org_status === 'approved' || session.profile.role === 'admin' ? '/tashkilotchi' : '/tashkilotchi/sozlamalar'} replace />
  if (session.profile?.org_status === 'blocked') return <Navigate to="/tashkilotchi" replace />

  const submit = async (v) => {
    const r = await registerOrganizer(v, v.lat != null ? withGeo(v.address.trim(), v) : v.address.trim())
    if (r.ok) navigate('/tashkilotchi/sozlamalar?royxat=1', { replace: true })
    return r
  }

  return (
    <ApplyShell back="/profil" backLabel="Profil">
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {init ? <StepForm config={ORGANIZER_REGISTER} initial={init} onSubmit={submit} /> : <p className="py-20 text-center font-semibold text-[#0F766E]">Yuklanmoqda…</p>}
        <aside className="hidden h-fit rounded-[20px] border border-[#E6EEF0] bg-white p-5 lg:block">
          <h3 className="text-[15px] font-bold text-[#10283F]">Qanday ishlaydi?</h3>
          {[[Settings, '1. Ro‘yxatdan o‘ting', 'Kabinet ochiladi — tashkilotchi profilini to‘ldirasiz.'], [ShieldCheck, '2. Tasdiqdan o‘ting', 'Seminar qo‘shishdan oldin YaTT/MChJ, STIR va pasportni yuborasiz.'], [BadgeCheck, '3. Seminar qo‘shing', '7 ish kuni ichida tasdiqlangach, barcha bo‘limlar ochiladi.']].map(([I, t, d]) => (
            <div key={t} className="mt-4 flex gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#E3F4F1] text-[#0F766E]"><I className="size-4.5" /></span><span><b className="block text-[14px] text-[#10283F]">{t}</b><span className="text-[13px] text-[#5C6E80]">{d}</span></span></div>
          ))}
        </aside>
      </div>
    </ApplyShell>
  )
}
