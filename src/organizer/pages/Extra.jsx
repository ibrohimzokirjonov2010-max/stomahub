import OrgProfileCard from '../OrgProfileCard'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Megaphone, Star, Mic, ChartColumn, Settings, CircleQuestionMark } from 'lucide-react'
import { FAQ, som } from '../data'
import { addMessage, addSpeaker, downloadText, saveMarketing, saveSettings, useHub } from '../../hubStore'
import { profileStore } from '../../profileStore'
import { signOut, useSession } from '../../sessionStore'
import { useOrg } from '../Shell'
import { uploadDoc } from '../../apply/api'
import { SpeakerModal } from './WizardModals'
import { Badge, Btn, Card, Field, Toggle, inputCls } from '../ui'

export function Marketing() {
  const { notify } = useOrg()
  const hub = useHub()
  const [on, setOn] = useState(hub.marketing || { push: true, email: true, telegram: false })
  const [budget, setBudget] = useState(hub.marketing?.budget || '')
  return (
    <div>
      <h1 className="text-[22px] font-bold">Marketing</h1>
      <p className="mt-0.5 text-[13px] text-[#6e868c]">Platforma orqali reklama qiling va ko‘proq ishtirokchilar jalb qiling.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {[
          ['Push-bildirishnoma', 'Ilova ichidagi eslatma', 'push'],
          ['Email xat', 'Ro‘yxatdagi ishtirokchilarga', 'email'],
          ['Telegram', 'Kanal orqali e’lon', 'telegram'],
        ].map(([t, s, k]) => (
          <Card key={k} title={t}>
            <p className="text-[12.5px] text-[#6e868c]">{s}</p>
            <div className="mt-3 flex justify-end"><Toggle on={on[k]} onChange={(v) => setOn({ ...on, [k]: v })} label={t} /></div>
          </Card>
        ))}
      </div>
      <Card className="mt-3" title="Reklama byudjeti">
        <Field label="Kunlik byudjet, so‘m"><input className={inputCls()} value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Masalan: 150 000" /></Field>
        <Btn className="mt-3" onClick={() => { saveMarketing({ ...on, budget }); notify('Marketing sozlamalari saqlandi') }}>Saqlash</Btn>
      </Card>
    </div>
  )
}

export function Speakers() {
  const { notify } = useOrg()
  const hub = useHub()
  const list = hub.speakers
  const [open, setOpen] = useState(false)
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-[22px] font-bold">Ma’ruzachilar</h1>
          <p className="mt-0.5 text-[13px] text-[#6e868c]">Seminarlarda ishtirok etadigan ma’ruzachilar.</p>
        </div>
        <Btn onClick={() => setOpen(true)}>Ma’ruzachi qo‘shish</Btn>
      </div>
      {!list.length && <p className="mt-4 rounded-2xl border border-dashed border-[#d5ebe6] bg-white px-4 py-10 text-center text-[13px] text-[#6e868c]">Hali ma’ruzachi yo‘q. “Ma’ruzachi qo‘shish” tugmasi orqali to‘liq ma’lumot bilan qo‘shing.</p>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((s) => {
          const meta = (Array.isArray(s.links) ? s.links : []).find((l) => l && typeof l === 'object' && l.kind === 'meta') || {}
          const years = s.years || meta.years
          const clinic = s.clinic || meta.clinic
          const degree = s.degree || meta.degree
          const certs = s.certs || meta.certs
          return (
            <article key={s.id} className="rounded-2xl border border-[#e6f1ef] bg-white p-4">
              <div className="flex items-center gap-3">
                <img src={s.avatar || '/images/avatar.jpg'} alt="" className="size-12 rounded-full object-cover" />
                <div className="min-w-0"><p className="truncate font-bold">{s.name}</p><p className="truncate text-[12px] text-[#6e868c]">{[s.role, s.city].filter(Boolean).join(' · ')}</p></div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11.5px]">
                {years && <Badge>{years} yil tajriba</Badge>}
                {degree && <Badge>{degree}</Badge>}
                {clinic && <Badge>{clinic}</Badge>}
              </div>
              {certs && <p className="mt-1.5 text-[12px] text-[#5e787e]">Sertifikatlar: {certs}</p>}
              {s.bio && <p className="mt-2 text-[12.5px] text-[#5e787e]">{s.bio}</p>}
            </article>
          )
        })}
      </div>
      <SpeakerModal open={open} photo="" onClose={() => setOpen(false)} onSave={(sp) => { addSpeaker(sp); setOpen(false); notify('Ma’ruzachi qo‘shildi') }} />
    </div>
  )
}

export function Reports() {
  const { notify } = useOrg()
  const hub = useHub()
  const rows = hub.seminars.map((s) => ({
    seminar: s.title,
    people: hub.participants.filter((p) => p.seminarId === s.id).length,
    revenue: s.revenue || 0,
    certs: hub.certs.filter((c) => c.seminarId === s.id && c.state === 'done').length,
    id: s.id,
  }))
  const confirmId = hub.seminars.find((s) => s.status === 'yakunlangan')?.id
  const loading = !hub.ready
  const total = rows.reduce((t, r) => ({ people: t.people + r.people, revenue: t.revenue + r.revenue, certs: t.certs + r.certs }), { people: 0, revenue: 0, certs: 0 })
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div><h1 className="text-[22px] font-bold">Hisobotlar</h1><p className="text-[13px] text-[#6e868c]">Seminarlar bo‘yicha qisqa hisobot.</p></div>
        <Btn onClick={() => { downloadText('hisobot.csv', ['Seminar,Ishtirokchi,Tushum,Sertifikat', ...rows.map((r) => `"${r.seminar}",${r.people},${r.revenue},${r.certs}`)].join('\n'), 'text/csv'); notify('Hisobot yuklab olindi') }}>Hisobotni yuklab olish</Btn>
      </div>
      <Card pad={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead><tr className="border-b border-[#eef3f2] text-[12px] text-[#8aa0a4]">{['Seminar', 'Ishtirokchi', 'Tushum', 'Sertifikat'].map((h) => <th key={h} className="px-3 py-2.5 font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {loading && [0, 1, 2].map((i) => <tr key={`sk${i}`} className="border-b border-[#f3f7f6]">{[0, 1, 2, 3].map((j) => <td key={j} className="px-3 py-3"><span className="block h-3.5 w-24 animate-pulse rounded bg-[#e8f1ef]" /></td>)}</tr>)}
              {!loading && !rows.length && <tr><td colSpan={4} className="px-3 py-8 text-center text-[#7e9398]">Hali seminar yo‘q. Hisobot birinchi seminardan keyin paydo bo‘ladi.</td></tr>}
              {!loading && rows.length > 1 && (
                <tr className="border-b border-[#eef3f2] bg-[#f7fcfb] font-semibold"><td className="px-3 py-3">Jami</td><td className="px-3 py-3">{total.people}</td><td className="px-3 py-3">{som(total.revenue)}</td><td className="px-3 py-3">{total.certs}</td></tr>
              )}
              {!loading && rows.map((r) => (
                <tr key={r.id} className="border-b border-[#f3f7f6]">
                  <td className="px-3 py-3 font-medium">{r.seminar}</td>
                  <td className="px-3 py-3">{r.people}</td>
                  <td className="px-3 py-3">{som(r.revenue)}</td>
                  <td className="px-3 py-3">{r.certs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {confirmId && <Link to={`/tashkilotchi/seminarlar/${confirmId}/tasdiqlash`} className="mt-3 inline-block text-[13px] font-semibold text-[var(--color-org-teal)]">O‘tkazilganini tasdiqlash →</Link>}
    </div>
  )
}

export function Ratings() {
  const hub = useHub()
  return (
    <div>
      <h1 className="text-[22px] font-bold">Reyting va sharhlar</h1>
      <p className="mt-0.5 text-[13px] text-[#6e868c]">Ishtirokchilar seminarlaringiz haqida qoldirgan fikrlar.</p>
      <div className="mt-4 grid gap-3">
        {!hub.reviews.length && <p className="rounded-2xl border border-dashed border-[#d5ebe6] bg-white px-4 py-10 text-center text-[13px] text-[#6e868c]">Hali sharh yo‘q. Ishtirokchilar fikri shu yerda chiqadi.</p>}
        {hub.reviews.map((r) => (
          <article key={r.name} className="rounded-2xl border border-[#e6f1ef] bg-white p-4">
            <div className="flex items-center gap-3">
              <img src={r.avatar} alt="" className="size-10 rounded-full object-cover" />
              <div className="flex-1"><p className="font-semibold">{r.name}</p><p className="text-[12px] text-[#8aa0a4]">{r.clinic} · {r.date}</p></div>
              <span className="text-[#f5b400]">{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</span>
            </div>
            <p className="mt-2 text-[13.5px] text-[#3e5a62]">{r.text}</p>
          </article>
        ))}
      </div>
    </div>
  )
}

export function SettingsPage() {
  const { notify } = useOrg()
  const navigate = useNavigate()
  const hub = useHub()
  const session = useSession()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [err, setErr] = useState('')
  const [notes, setNotes] = useState(true)
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    if (!hub.ready || hydrated) return
    setName(hub.settings?.name || session.profile?.name || '')
    setEmail(hub.settings?.email || session.profile?.email || session.user?.email || '')
    setNotes(hub.settings?.notes !== false)
    setHydrated(true)
  }, [hub.ready, hub.settings, session.profile, session.user, hydrated])
  return (
    <div>
      <h1 className="text-[22px] font-bold">Sozlamalar</h1>
      <p className="mt-0.5 text-[13px] text-[#6e868c]">Tashkilotchi profili va bildirishnomalar.</p>
      <OrgProfileCard notify={notify} />
      <LegalCard notify={notify} />
      <Card className="mt-4" title="Hisob va bildirishnomalar">
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            const nextName = name.trim()
            const nextEmail = email.trim()
            if (nextName.length < 2 || (nextEmail && !nextEmail.includes('@'))) {
              setErr('Ism va emailni to‘g‘ri kiriting')
              return
            }
            setErr('')
            saveSettings({ name: nextName, email: nextEmail, notes })
            notify('Sozlamalar saqlandi')
          }}
        >
          <Field label="Ism-familiya" req error={err}>
            <input id="org-profile-name" name="org-profile-name" type="text" autoComplete="name" className={inputCls(!!err)} value={name} onChange={(e) => { setName(e.target.value); setErr('') }} onKeyDown={(e) => e.stopPropagation()} />
          </Field>
          <Field label="Email" req>
            <input id="org-profile-email" name="org-profile-email" type="email" autoComplete="email" className={inputCls()} value={email} onChange={(e) => { setEmail(e.target.value); setErr('') }} onKeyDown={(e) => e.stopPropagation()} />
          </Field>
          <div className="sm:col-span-2 mt-0 flex items-center justify-between text-[13px]"><span>Yangi ro‘yxat haqida xabar</span><Toggle on={notes} onChange={setNotes} label="Bildirishnoma" /></div>
          <div className="sm:col-span-2">
            <Btn type="submit">Saqlash</Btn>
          </div>
        </form>
        <button type="button" className="mt-3 text-[13px] font-semibold text-[#d14343]" onClick={async () => { await signOut(); profileStore.update({ loggedOut: true }); navigate('/kirish') }}>Chiqish</button>
      </Card>
    </div>
  )
}

export function HelpPage() {
  const [open, setOpen] = useState(0)
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')
  const { notify } = useOrg()
  return (
    <div>
      <h1 className="text-[22px] font-bold">Yordam</h1>
      <p className="mt-0.5 text-[13px] text-[#6e868c]">Savollaringiz bo‘lsa, biz bilan bog‘laning.</p>
      <div className="mt-4 space-y-2">
        {FAQ.map((f, i) => (
          <button key={f.q} type="button" onClick={() => setOpen(open === i ? -1 : i)} className="block w-full rounded-2xl border border-[#e6f1ef] bg-white px-4 py-3 text-left">
            <p className="font-semibold">{f.q}</p>
            {open === i && <p className="mt-1 text-[13px] text-[#5e787e]">{f.a}</p>}
          </button>
        ))}
      </div>
      <Card className="mt-3" title="Aloqa">
        <textarea className={`${inputCls(!!err)} h-24 py-2`} value={text} onChange={(e) => { setText(e.target.value); setErr('') }} placeholder="Savolingizni yozing..." />
        {err && <p className="mt-2 text-[12.5px] text-[#e11d48]">{err}</p>}
        {sent && <p className="mt-2 text-[12.5px] text-[var(--color-org-teal)]">Xabar qabul qilindi.</p>}
        <Btn className="mt-3" onClick={() => { if (text.trim().length < 5) { setErr('Xabar kamida 5 ta belgidan iborat bo‘lsin'); return } addMessage(text.trim()); setSent(true); setText(''); notify('Xabar yuborildi') }}>Yuborish</Btn>
      </Card>
    </div>
  )
}

const LEGAL_DOCS = [
  ['license', 'Tibbiy/ta’lim litsenziyasi', 'licenseNo'],
  ['eduCert', 'Ta’lim guvohnomasi', 'eduCertNo'],
]

// Yuridik ma'lumotlar: arizadagi STIR va hujjatlar bo'lsa — qayta ishlatiladi.
function LegalCard({ notify }) {
  const hub = useHub()
  const app = hub.application || null
  const [f, setF] = useState({ stir: '', licenseNo: '', eduCertNo: '', docs: {} })
  const [err, setErr] = useState({})
  const [busy, setBusy] = useState('')
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    if (!hub.ready || hydrated) return
    const legal = hub.settings?.legal || {}
    const appDocs = Array.isArray(app?.docs) ? app.docs : []
    const docs = { ...(legal.docs || {}) }
    if (!docs.eduCert) { const d = appDocs.find((x) => x.key === 'certificate'); if (d) docs.eduCert = d }
    setF({ stir: legal.stir || app?.stir || '', licenseNo: legal.licenseNo || '', eduCertNo: legal.eduCertNo || '', docs })
    setHydrated(true)
  }, [hub.ready, hub.settings, app, hydrated])
  const pick = async (key, label, file) => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setErr({ ...err, [key]: 'Fayl 10 MB dan oshmasin' }); return }
    setBusy(key)
    const r = await uploadDoc(file, key, label, 'settings')
    setBusy('')
    if (!r.ok) { setErr({ ...err, [key]: r.error || 'Yuklab bo‘lmadi' }); return }
    setF((x) => ({ ...x, docs: { ...x.docs, [key]: r.doc } }))
    setErr({ ...err, [key]: '' })
  }
  const save = (e) => {
    e.preventDefault()
    const v = {}
    if (!/^\d{9}$/.test(f.stir)) v.stir = 'STIR 9 ta raqamdan iborat bo‘lsin'
    if (f.licenseNo && f.licenseNo.trim().length < 3) v.licenseNo = 'Litsenziya raqamini to‘liq kiriting'
    if (f.eduCertNo && f.eduCertNo.trim().length < 3) v.eduCertNo = 'Guvohnoma raqamini to‘liq kiriting'
    setErr(v)
    if (Object.keys(v).length) return
    saveSettings({ legal: { stir: f.stir, licenseNo: f.licenseNo.trim(), eduCertNo: f.eduCertNo.trim(), docs: f.docs } })
    notify('Yuridik ma’lumotlar saqlandi')
  }
  return (
    <Card className="mt-4" title="Yuridik ma’lumotlar">
      {app && <p className="mb-3 rounded-xl bg-[#eef8f6] px-3 py-2 text-[12px] text-[#3e6a6c]">Arizangizdagi ma’lumotlar avtomatik qo‘yildi — kerak bo‘lsa yangilang.</p>}
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={save} noValidate>
        <Field label="STIR (INN)" req error={err.stir}>
          <input inputMode="numeric" className={inputCls(!!err.stir)} value={f.stir} onChange={(e) => setF({ ...f, stir: e.target.value.replace(/\D/g, '').slice(0, 9) })} onKeyDown={(e) => e.stopPropagation()} placeholder="9 ta raqam" />
        </Field>
        <div />
        {LEGAL_DOCS.map(([key, label, numKey]) => (
          <div key={key} className="space-y-2">
            <Field label={`${label} raqami`} error={err[numKey]}>
              <input className={inputCls(!!err[numKey])} value={f[numKey]} onChange={(e) => setF({ ...f, [numKey]: e.target.value })} onKeyDown={(e) => e.stopPropagation()} placeholder="Masalan: L-012345" />
            </Field>
            <label className="flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-dashed border-[#cfe7e2] bg-[#f7fcfb] px-3 py-2 text-[12.5px]">
              <span className="min-w-0 truncate text-[#3e5a62]">{busy === key ? 'Yuklanmoqda…' : f.docs[key]?.name || `${label} fayli (PDF/JPG)`}</span>
              <span className="shrink-0 font-semibold text-[var(--color-org-teal)]">{f.docs[key] ? 'Almashtirish' : 'Fayl tanlash'}</span>
              <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => pick(key, label, e.target.files?.[0])} />
            </label>
            {err[key] && <p className="text-[11.5px] text-[#e11d48]">{err[key]}</p>}
          </div>
        ))}
        <div className="sm:col-span-2"><Btn type="submit">Saqlash</Btn></div>
      </form>
    </Card>
  )
}
