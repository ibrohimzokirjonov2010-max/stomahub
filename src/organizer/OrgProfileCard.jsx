import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CircleCheck } from 'lucide-react'
import StepForm from '../apply/StepForm'
import { withGeo } from '../components/MapPicker'
import { toE164 } from '../components/PhoneInput'
import { ORGANIZER_REGISTER } from '../apply/organizerConfig'
import { loadOrgPrefill, saveOrgProfile } from '../apply/api'
import { canUseOrganizer, useSession } from '../sessionStore'

const url = (v) => !v || /^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(v.trim()) ? '' : 'Havola noto‘g‘ri'
const email = (v) => !v || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim()) ? '' : 'Email noto‘g‘ri'

const PROFILE = {
  kind: 'organizer',
  submitLabel: 'Profilni saqlash',
  steps: [{ id: 'profile', title: 'Profil', heading: 'Tashkilot profili', fields: [
    ...ORGANIZER_REGISTER.steps[0].fields.filter((f) => f.name !== 'logo_url'),
    { name: 'email', label: 'Email', type: 'email', optional: true, placeholder: 'info@academy.uz', validate: email },
    { name: 'website', label: 'Veb-sayt', optional: true, placeholder: 'dentalacademy.uz', validate: url },
    { name: 'description', label: 'Tashkilot haqida', type: 'textarea', optional: true, full: true, placeholder: 'Qanday seminarlar o‘tkazasiz, ma’ruzachilar, tajriba…', validate: (v) => (v && v.length > 1000 ? '1000 belgidan oshmasin' : '') },
    ORGANIZER_REGISTER.steps[0].fields.find((f) => f.name === 'logo_url'),
  ] }],
}

/** Full organizer profile (organizer_settings, 0026). Works for registered (unverified) organizers too. */
export default function OrgProfileCard({ notify }) {
  const session = useSession()
  const [params] = useSearchParams()
  const [init, setInit] = useState(null)
  const [key, setKey] = useState(0)
  useEffect(() => {
    loadOrgPrefill().then(({ profile, settings: s }) => {
      const g = s.address ? s.address.match(/\[geo:(-?[\d.]+),(-?[\d.]+)\]/) : null
      setInit({ ...ORGANIZER_REGISTER.initial(profile, s), lat: g ? +g[1] : null, lng: g ? +g[2] : null, email: s.email || '', website: s.website || '', description: s.description || '' })
    })
  }, [])
  const save = async (v) => {
    const r = await saveOrgProfile({
      owner_name: v.owner_name.trim(), name: v.owner_name.trim(), org_name: v.org_name.trim(), phone: toE164(v.phone),
      address: v.lat != null ? withGeo(v.address.trim(), v) : v.address.trim(), telegram: v.telegram.trim(), instagram: v.instagram.trim(),
      email: v.email.trim(), website: v.website.trim(), description: v.description.trim(), logo_url: v.logo_url || '',
    })
    if (r.ok) { notify?.('Profil saqlandi'); setKey((k) => k + 1) }
    return r
  }
  return (
    <div data-testid="org-profile" className="mt-4 rounded-[20px] border border-[#e6eeec] bg-white p-4 md:p-6">
      {params.get('royxat') && !canUseOrganizer(session.profile) && (
        <div data-testid="registered-welcome" className="mb-4 flex gap-3 rounded-2xl bg-[#F0FDFA] p-4 text-[13.5px] text-[#3D4E5F]">
          <CircleCheck className="size-6 shrink-0 text-[#0F766E]" />
          <span><b className="block text-[15px] text-[#10283F]">Ro‘yxatdan o‘tdingiz!</b>Tashkilotchi kabinetingiz ochildi. Profilni to‘ldiring — seminar qo‘shish uchun keyinroq tasdiqdan o‘tasiz.</span>
        </div>
      )}
      {init ? <StepForm key={key} config={PROFILE} initial={init} onSubmit={save} title="Tashkilot profili" subtitle="Bu ma’lumotlar seminar sahifalarida va arizangizda ishlatiladi." /> : <p className="py-10 text-center font-semibold text-[#0F766E]">Yuklanmoqda…</p>}
    </div>
  )
}
