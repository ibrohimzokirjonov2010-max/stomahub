import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Megaphone, Star, Mic, ChartColumn, Settings, CircleQuestionMark } from 'lucide-react'
import { FAQ, som } from '../data'
import { addMessage, addSpeaker, downloadText, saveMarketing, saveSettings, useHub } from '../../hubStore'
import { profileStore } from '../../profileStore'
import { signOut, useSession } from '../../sessionStore'
import { useOrg } from '../Shell'
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
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [err, setErr] = useState('')
  return (
    <div>
      <h1 className="text-[22px] font-bold">Ma’ruzachilar</h1>
      <p className="mt-0.5 text-[13px] text-[#6e868c]">Seminarlarda ishtirok etadigan ma’ruzachilar.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((s) => (
          <article key={s.id} className="rounded-2xl border border-[#e6f1ef] bg-white p-4">
            <div className="flex items-center gap-3">
              <img src={s.avatar} alt="" className="size-12 rounded-full object-cover" />
              <div><p className="font-bold">{s.name}</p><p className="text-[12px] text-[#6e868c]">{s.role} · {s.city}</p></div>
            </div>
            <p className="mt-2 text-[12.5px] text-[#5e787e]">{s.bio}</p>
          </article>
        ))}
      </div>
      <Card className="mt-3" title="Ma’ruzachi qo‘shish">
        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="Ism" req error={err}><input className={inputCls(!!err)} value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Ism Familiya" /></Field>
          <Field label="Lavozim"><input className={inputCls()} value={role} onChange={(e) => setRole(e.target.value)} placeholder="Implantolog" /></Field>
        </div>
        <Btn className="mt-3" onClick={() => { if (name.trim().length < 3) { setErr('Ismni kiriting'); return } addSpeaker({ id: Date.now(), name: name.trim(), role: role || 'Mutaxassis', city: 'Toshkent', avatar: '/images/avatar.jpg', bio: '' }); setName(''); setRole(''); setErr(''); notify('Ma’ruzachi qo‘shildi') }}>Qo‘shish</Btn>
      </Card>
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
  const confirmId = hub.seminars.find((s) => s.status === 'yakunlangan')?.id || hub.seminars[0]?.id
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
              {!rows.length && <tr><td colSpan={4} className="px-3 py-8 text-center text-[#7e9398]">Hali seminar yo‘q. Hisobot birinchi seminardan keyin paydo bo‘ladi.</td></tr>}
              {rows.map((r) => (
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
      <Card className="mt-4" title="Profil">
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
