import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { CircleCheck, Clock3, Lock, ShieldCheck, XCircle } from 'lucide-react'
import { canUseSeller, useSession } from '../sessionStore'
import StepForm from '../apply/StepForm'
import { SELLER_APPLICATION } from '../apply/sellerConfig'
import { loadPrefill, myApplication, removeDocs, submitApplication, uploadDoc } from '../apply/api'

/**
 * Stage 2 gate. Approved sellers and admins see the section. Registered or unverified sellers
 * see "Tasdiqdan o‘ting" (form, pending status, or rejection with resubmit).
 */
export default function VerifyGate({ children, section }) {
  const session = useSession()
  if (canUseSeller(session.profile)) return children
  return <VerifyPanel section={section} />
}

// Texts and access rules for the seller flow; an organizer config overrides them via `config.ui`.
const SELLER_UI = {
  canUse: canUseSeller,
  status: (p) => p?.seller_status,
  rejectReason: (p) => p?.seller_reject_reason,
  prefill: loadPrefill,
  cabinetPath: '/sotuvchi',
  settingsPath: '/sotuvchi/sozlamalar',
  settingsLabel: 'Do‘kon sozlamalari',
  who: 'tasdiqlangan sotuvchilar',
  why: 'Mahsulot qo‘shish va sotishni boshlash uchun yuridik ma’lumotlar va hujjatlarni yuboring.',
  formSubtitle: 'Mahsulot qo‘shish va sotish uchun do‘koningizni tasdiqlang. Do‘kon ma’lumotlari ro‘yxatdan o‘tishdan olindi.',
  checklist: ['Tashkiliy shakl (YaTT yoki MChJ) va STIR', 'Guvohnoma / litsenziya nusxasi', 'Pasport yoki STIR nusxasi'],
  nameLabel: 'Do‘kon',
}

export function VerifyPanel({ section, config = SELLER_APPLICATION }) {
  const session = useSession()
  const ui = { ...SELLER_UI, ...config.ui }
  const [state, setState] = useState({ loading: true })
  const [mode, setMode] = useState('intro') // intro | form | sent
  const load = async () => {
    const [a, pre] = await Promise.all([myApplication(config.kind), ui.prefill()])
    setState({ loading: false, app: a.data || null, error: a.ok ? '' : a.error, pre })
  }
  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (ui.canUse(session.profile)) return <Navigate to={ui.cabinetPath} replace />
  if (state.loading) return <Box><p className="py-10 text-center font-semibold text-[#0F766E]">Yuklanmoqda…</p></Box>
  const app = state.app
  const status = mode === 'sent' ? 'pending' : app?.status || (ui.status(session.profile) === 'pending' ? 'pending' : '')

  if (status === 'pending' && mode !== 'form') return (
    <Box testid="verify-pending">
      <Hero icon={mode === 'sent' ? CircleCheck : Clock3} title={mode === 'sent' ? 'Arizangiz qabul qilindi' : 'Arizangiz ko‘rib chiqilmoqda'} text={config.successText} />
      {app && <Summary app={app} label={ui.nameLabel} />}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row"><Link to={ui.settingsPath} className="grid h-12 sm:flex-1 place-items-center rounded-xl bg-[#0F766E] text-[15px] font-semibold text-white">{ui.settingsLabel}</Link><Link to="/" className="grid h-12 sm:flex-1 place-items-center rounded-xl border border-[#DCE5E7] text-[15px] font-semibold text-[#10283F]">Bosh sahifa</Link></div>
    </Box>
  )

  if (mode === 'form') {
    const base = config.initial(state.pre.profile, state.pre.settings)
    const initial = app?.status === 'rejected' ? { ...base, ...config.fromRow(app) } : base
    const submit = async (v, files) => {
      const batch = `${config.kind}-${Date.now()}`
      const docs = []
      for (const d of config.steps.flatMap((s) => s.docs || [])) {
        if (!files[d.key]) continue
        const r = await uploadDoc(files[d.key], d.key, d.label, batch)
        if (!r.ok) { await removeDocs(docs.map((x) => x.path)); return r }
        docs.push(r.doc)
      }
      const r = await submitApplication(config, v, docs)
      if (!r.ok) { if (!r.data) await removeDocs(docs.map((x) => x.path)); return r }
      setState((s) => ({ ...s, app: r.data })); setMode('sent'); window.scrollTo(0, 0)
      return r
    }
    return (
      <div className="px-0 py-2 md:py-4">
        <StepForm config={config} initial={initial} onSubmit={submit} title={config.title2} subtitle={ui.formSubtitle}
          extraTop={app?.status === 'rejected' ? <Reject reason={app.reject_reason} /> : null} />
      </div>
    )
  }

  return (
    <Box testid="verify-intro">
      {status === 'rejected'
        ? <><Hero icon={XCircle} tone="red" title="Arizangiz rad etildi" text="Ma’lumotlarni tuzatib, arizani qayta yuborishingiz mumkin." /><Reject reason={app?.reject_reason || ui.rejectReason(session.profile)} /></>
        : <Hero icon={Lock} title="Tasdiqdan o‘ting" text={`${section ? `“${section}” bo‘limi` : 'Bu bo‘lim'} faqat ${ui.who} uchun. ${ui.why}`} />}
      {status !== 'rejected' && (
        <ul className="mt-5 space-y-2 text-left text-[14px] text-[#3D4E5F]">
          {ui.checklist.map((t) => <li key={t} className="flex gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#0F766E]" /> {t}</li>)}
        </ul>
      )}
      {state.error && <p className="mt-3 rounded-xl bg-[#FDECEC] px-3 py-2 text-[13px] text-[#B42318]">{state.error}</p>}
      <button type="button" data-testid="verify-start" onClick={() => setMode('form')} className="mt-5 h-12 w-full rounded-xl bg-[#0F766E] text-[15px] font-semibold text-white hover:bg-[#115E59]">{status === 'rejected' ? 'Qayta ariza yuborish' : 'Tasdiqdan o‘tish'}</button>
      <Link to={ui.settingsPath} className="mt-2 grid h-12 w-full place-items-center rounded-xl border border-[#DCE5E7] text-[15px] font-semibold text-[#10283F]">{ui.settingsLabel}</Link>
    </Box>
  )
}

const Box = ({ children, testid }) => <div data-testid={testid} className="grid place-items-center py-6 md:py-12"><div className="w-full max-w-[520px] rounded-[24px] border border-[#E6EEF0] bg-white px-5 py-7 text-center shadow-[0_16px_50px_rgb(16_50_48/0.06)] md:px-8">{children}</div></div>
const Hero = ({ icon: I, title, text, tone }) => (<>
  <span className={`mx-auto grid size-16 place-items-center rounded-full ${tone === 'red' ? 'bg-[#FDECEC] text-[#C43D3D]' : 'bg-[#E3F4F1] text-[#0F766E]'}`}><I className="size-8" strokeWidth={1.6} /></span>
  <h1 className="mt-4 text-[22px] font-extrabold leading-tight tracking-tight text-[#10283F]">{title}</h1>
  <p className="mt-2 text-[14px] leading-relaxed text-[#5C6E80]">{text}</p>
</>)
const Reject = ({ reason }) => reason ? <div data-testid="reject-reason" className="mt-4 rounded-xl border border-[#F5C2C2] bg-[#FFF7F7] px-4 py-3 text-left text-[13.5px] text-[#7A1F1F]"><b className="block text-[#B42318]">Rad etish sababi</b>{reason}</div> : null
const Summary = ({ app, label }) => (
  <dl className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-[#F4FBFA] p-3 text-left text-[13px]">
    <dt className="text-[#5C6E80]">{label}</dt><dd className="font-semibold text-[#10283F]">{app.shop_name}</dd>
    <dt className="text-[#5C6E80]">Yuborilgan</dt><dd className="font-semibold text-[#10283F]">{new Date(app.created_at).toLocaleDateString('uz-UZ')}</dd>
    <dt className="text-[#5C6E80]">Holat</dt><dd className="font-semibold text-[#B45309]">Ko‘rib chiqilmoqda</dd>
  </dl>
)
