import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Megaphone, Star, Mic, ChartColumn, Settings, CircleQuestionMark } from 'lucide-react'
import { FAQ, REPORT_ROWS, REVIEWS, WIZARD_SPEAKERS, som } from '../data'
import { useOrg } from '../Shell'
import { Badge, Btn, Card, Field, Toggle, inputCls } from '../ui'

export function Marketing() {
  const { notify } = useOrg()
  const [on, setOn] = useState({ push: true, email: true, telegram: false })
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
        <Field label="Kunlik byudjet, so‘m"><input className={inputCls()} defaultValue="150 000" /></Field>
        <Btn className="mt-3" onClick={() => notify('Marketing sozlamalari saqlandi')}>Saqlash</Btn>
      </Card>
    </div>
  )
}

export function Speakers() {
  const { notify } = useOrg()
  const [list, setList] = useState(WIZARD_SPEAKERS)
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
        <Btn className="mt-3" onClick={() => { if (name.trim().length < 3) { setErr('Ismni kiriting'); return } setList((xs) => [...xs, { id: Date.now(), name, role: role || 'Mutaxassis', city: 'Toshkent', avatar: '/images/avatar.jpg', bio: '' }]); setName(''); setRole(''); setErr(''); notify('Ma’ruzachi qo‘shildi') }}>Qo‘shish</Btn>
      </Card>
    </div>
  )
}

export function Reports() {
  const { notify } = useOrg()
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div><h1 className="text-[22px] font-bold">Hisobotlar</h1><p className="text-[13px] text-[#6e868c]">Seminarlar bo‘yicha qisqa hisobot.</p></div>
        <Btn onClick={() => notify('Hisobot yuklab olindi')}>Hisobotni yuklab olish</Btn>
      </div>
      <Card pad={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead><tr className="border-b border-[#eef3f2] text-[12px] text-[#8aa0a4]">{['Seminar', 'Ishtirokchi', 'Tushum', 'Sertifikat'].map((h) => <th key={h} className="px-3 py-2.5 font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {REPORT_ROWS.map((r) => (
                <tr key={r.seminar} className="border-b border-[#f3f7f6]">
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
      <Link to="/tashkilotchi/seminarlar/implant/tasdiqlash" className="mt-3 inline-block text-[13px] font-semibold text-[var(--color-org-teal)]">O‘tkazilganini tasdiqlash →</Link>
    </div>
  )
}

export function Ratings() {
  return (
    <div>
      <h1 className="text-[22px] font-bold">Reyting va sharhlar</h1>
      <p className="mt-0.5 text-[13px] text-[#6e868c]">Ishtirokchilar seminarlaringiz haqida qoldirgan fikrlar.</p>
      <div className="mt-4 grid gap-3">
        {REVIEWS.map((r) => (
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
  const [name, setName] = useState('Ibrohim Karimov')
  const [email, setEmail] = useState('ibrohim@stomahub.uz')
  const [err, setErr] = useState('')
  const [notes, setNotes] = useState(true)
  return (
    <div>
      <h1 className="text-[22px] font-bold">Sozlamalar</h1>
      <p className="mt-0.5 text-[13px] text-[#6e868c]">Tashkilotchi profili va bildirishnomalar.</p>
      <Card className="mt-4" title="Profil">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Ism-familiya" req error={err}><input className={inputCls(!!err)} value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Email" req><input className={inputCls()} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        </div>
        <div className="mt-3 flex items-center justify-between text-[13px]"><span>Yangi ro‘yxat haqida xabar</span><Toggle on={notes} onChange={setNotes} label="Bildirishnoma" /></div>
        <Btn className="mt-4" onClick={() => { if (name.trim().length < 3 || !email.includes('@')) { setErr('Ism va emailni to‘g‘ri kiriting'); return } setErr(''); notify('Sozlamalar saqlandi') }}>Saqlash</Btn>
      </Card>
    </div>
  )
}

export function HelpPage() {
  const [open, setOpen] = useState(0)
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)
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
        <textarea className={`${inputCls()} h-24 py-2`} value={text} onChange={(e) => setText(e.target.value)} placeholder="Savolingizni yozing..." />
        {sent && <p className="mt-2 text-[12.5px] text-[var(--color-org-teal)]">Xabar qabul qilindi.</p>}
        <Btn className="mt-3" onClick={() => { if (text.trim().length < 5) return; setSent(true); setText(''); notify('Xabar yuborildi') }}>Yuborish</Btn>
      </Card>
    </div>
  )
}
