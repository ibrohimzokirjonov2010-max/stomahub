import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Download, Mail, MapPin, Plus, QrCode, Users, Wallet, Clock, XCircle } from 'lucide-react'
import { PARTICIPANTS, PAY_LABEL, SEMINARS, som } from '../data'
import { useOrg } from '../Shell'
import { Badge, Btn, Card, Empty, Field, Kpi, MenuBtn, Modal, Pager, Person, QrMark, SearchBox, Select, Tabs, inputCls, usePager } from '../ui'

const TONE = { paid: 'green', wait: 'orange', unpaid: 'red', cancel: 'red' }

export default function Participants() {
  const { query, notify } = useOrg()
  const [seminar, setSeminar] = useState('endo')
  const [q, setQ] = useState('')
  const [ticket, setTicket] = useState('all')
  const [pay, setPay] = useState('all')
  const [city, setCity] = useState('all')
  const [rows, setRows] = useState(PARTICIPANTS)
  const [selected, setSelected] = useState(PARTICIPANTS[0].id)
  const [tab, setTab] = useState('info')
  const [add, setAdd] = useState(false)
  const [mail, setMail] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', ticket: 'Standart', city: 'Toshkent' })
  const [errors, setErrors] = useState({})

  const current = SEMINARS.find((s) => s.id === seminar) || SEMINARS[1]
  const filtered = useMemo(() => {
    const s = `${query} ${q}`.trim().toLowerCase()
    return rows.filter((p) => {
      if (ticket !== 'all' && p.ticket !== ticket) return false
      if (pay !== 'all' && p.pay !== pay) return false
      if (city !== 'all' && p.city !== city) return false
      if (s && !`${p.name} ${p.phone} ${p.email} ${p.clinic}`.toLowerCase().includes(s)) return false
      return true
    })
  }, [rows, query, q, ticket, pay, city])
  const pager = usePager(filtered, 10)
  const person = rows.find((p) => p.id === selected) || null

  const save = () => {
    const e = {}
    if (form.name.trim().length < 3) e.name = 'Ism-familiyani kiriting'
    if (!/^\+998\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/.test(form.phone.trim())) e.phone = 'Telefon +998 formatida bo‘lsin'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email noto‘g‘ri'
    setErrors(e)
    if (Object.keys(e).length) return
    const row = { id: Date.now(), ...form, clinic: 'Yangi klinika', pay: 'wait', registered: 'Bugun', role: 'Stomatolog', avatar: '/images/avatar.jpg' }
    setRows((list) => [row, ...list])
    setSelected(row.id)
    setAdd(false)
    setForm({ name: '', phone: '', email: '', ticket: 'Standart', city: 'Toshkent' })
    notify('Ishtirokchi qo‘shildi')
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-[12px] text-[#8aa0a4]">
            <Link to="/tashkilotchi" className="hover:text-[#0c8f86]">Boshqaruv paneli</Link> <span className="px-1">›</span>
            <Link to="/tashkilotchi/seminarlar" className="hover:text-[#0c8f86]">Mening seminarlarim</Link> <span className="px-1">›</span> Ishtirokchilar
          </p>
          <h1 className="text-[22px] font-bold">Ishtirokchilar</h1>
          <p className="mt-0.5 text-[13px] text-[#6e868c]">Seminar ishtirokchilarini boshqaring, to‘lovlar, QR check-in va sertifikatlar</p>
        </div>
        <div className="flex gap-2">
          <Btn onClick={() => setAdd(true)}><Plus className="size-4" /> Ishtirokchi qo‘shish</Btn>
          <MenuBtn items={[{ label: 'Excel', onClick: () => notify('Excel yuklab olindi') }, { label: 'Email', onClick: () => setMail(true) }]} />
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Users} label="Jami ishtirokchilar" value="180 / 200" progress={90} foot="90%" />
        <Kpi icon={Wallet} label="To‘lov qilingan" value="150" foot="83%" />
        <Kpi icon={Clock} label="Kutilmoqda" value="20" hint="11%" hintClass="font-semibold text-[#d0890b]" />
        <Kpi icon={XCircle} label="Bekor qilingan" value="10" hint="6%" hintClass="font-semibold text-[#e11d48]" />
      </section>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="flex min-w-[260px] flex-1 items-center gap-3 rounded-2xl border border-[#e6f1ef] bg-white px-3 py-2">
          <img src={current.image} alt="" className="h-10 w-16 rounded-lg object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold">{current.title}</p>
            <p className="flex flex-wrap gap-2 text-[11px] text-[#7e9398]"><span className="inline-flex items-center gap-1"><Calendar className="size-3" /> {current.date}</span><span className="inline-flex items-center gap-1"><MapPin className="size-3" /> {current.city}</span><span>{current.sold} / {current.seats}</span></p>
          </div>
          <Select value={seminar} onChange={setSeminar} className="w-[180px]" options={SEMINARS.map((s) => ({ value: s.id, label: s.title }))} />
        </div>
        <Btn kind="ghost" to="/tashkilotchi/qr"><QrCode className="size-4" /> QR check-in</Btn>
        <Btn kind="soft" onClick={() => notify('Excel yuklab olindi')}><Download className="size-4" /> Excel yuklab olish</Btn>
        <Btn kind="soft" onClick={() => setMail(true)}><Mail className="size-4" /> Email yuborish</Btn>
      </div>

      <Card className="mt-3" pad={false}>
        <div className="flex flex-wrap items-center gap-2 p-3">
          <SearchBox value={q} onChange={setQ} placeholder="Ishtirokchi nomi, telefon yoki email bo‘yicha qidirish..." className="min-w-[220px] flex-1" />
          <Select value={ticket} onChange={setTicket} className="w-[150px]" options={[{ value: 'all', label: 'Barcha chiptalar' }, { value: 'Standart', label: 'Standart' }, { value: 'VIP', label: 'VIP' }, { value: 'Student', label: 'Student' }, { value: 'Guruh', label: 'Guruh' }]} />
          <Select value={pay} onChange={setPay} className="w-[170px]" options={[{ value: 'all', label: 'Barcha holatlar' }, ...Object.entries(PAY_LABEL).map(([value, label]) => ({ value, label }))]} />
          <Select value={city} onChange={setCity} className="w-[150px]" options={[{ value: 'all', label: 'Barcha shaharlar' }, { value: 'Toshkent', label: 'Toshkent' }, { value: 'Samarqand', label: 'Samarqand' }, { value: 'Buxoro', label: 'Buxoro' }]} />
          <Btn kind="soft" onClick={() => { setQ(''); setTicket('all'); setPay('all'); setCity('all') }}>Filtrlar</Btn>
        </div>
        <div className="org-with-side">
          <div className="min-w-0 overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead>
                <tr className="border-y border-[#eef3f2] text-[12px] text-[#8aa0a4]">
                  {['#', 'Ishtirokchi', 'Telefon', 'Email', 'Chipta turi', 'To‘lov holati', 'Ro‘yxatdan o‘tgan', 'QR', 'Amallar'].map((h) => <th key={h} className="px-3 py-2.5 font-medium">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {pager.slice.map((p, i) => (
                  <tr key={p.id} onClick={() => { setSelected(p.id); setTab('info') }} className={`cursor-pointer border-b border-[#f3f7f6] ${person?.id === p.id ? 'bg-[#f4fbfa]' : 'hover:bg-[#f8fcfb]'}`}>
                    <td className="px-3 py-2.5 text-[12.5px] text-[#6e868c]">{pager.from + i}</td>
                    <td className="px-3 py-2.5"><Person name={p.name} sub={p.clinic} avatar={p.avatar} /></td>
                    <td className="px-3 py-2.5 text-[12.5px]">{p.phone}</td>
                    <td className="px-3 py-2.5 text-[12.5px] text-[#3e5a62]">{p.email}</td>
                    <td className="px-3 py-2.5"><Badge tone={p.ticket === 'VIP' ? 'teal' : p.ticket === 'Student' ? 'orange' : 'outline'}>{p.ticket}</Badge></td>
                    <td className="px-3 py-2.5"><Badge tone={TONE[p.pay]} dot>{PAY_LABEL[p.pay]}</Badge></td>
                    <td className="px-3 py-2.5 text-[12px] text-[#5e787e]">{p.registered}</td>
                    <td className="px-3 py-2.5"><QrCode className="size-4 text-[#0c8f86]" /></td>
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}><MenuBtn items={[{ label: 'Email', onClick: () => setMail(true) }, { label: 'O‘chirish', danger: true, onClick: () => { setRows((list) => list.filter((x) => x.id !== p.id)); notify('O‘chirildi') } }]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pager.total === 0 && <Empty text="Ishtirokchi topilmadi" />}
            <Pager {...pager} onPage={pager.setPage} onPer={pager.setPer} />
          </div>
          {person && (
            <aside className="border-t border-[#eef3f2] p-4 lg:border-l lg:border-t-0">
              <div className="mb-3 flex items-start gap-2">
                <img src={person.avatar} alt="" className="size-12 rounded-full object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{person.name}</p>
                  <p className="text-[12px] text-[#7e9398]">{person.clinic}</p>
                </div>
                <button type="button" aria-label="Yopish" onClick={() => setSelected(null)} className="text-[#8aa0a4]"><XCircle className="size-4" /></button>
              </div>
              <Tabs tabs={[{ id: 'info', label: 'Ma’lumotlar' }, { id: 'pay', label: 'To‘lovlar' }, { id: 'cert', label: 'Sertifikat' }]} value={tab} onChange={setTab} />
              {tab === 'info' && (
                <dl className="mt-3 space-y-2 text-[12.5px]">
                  {[
                    ['Telefon', person.phone],
                    ['Email', person.email],
                    ['Shahar', person.city],
                    ['Klinika', person.clinic],
                    ['Lavozim', person.role],
                    ['Chipta turi', person.ticket],
                    ['Ro‘yxatdan o‘tgan', person.registered],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3"><dt className="text-[#7e9398]">{k}</dt><dd className="text-right font-medium">{v}</dd></div>
                  ))}
                  <div className="flex justify-between gap-3"><dt className="text-[#7e9398]">To‘lov holati</dt><dd><Badge tone={TONE[person.pay]}>{PAY_LABEL[person.pay]}</Badge></dd></div>
                </dl>
              )}
              {tab === 'pay' && (
                <div className="mt-3 rounded-xl bg-[#f6fbfa] p-3 text-[13px]">
                  <p className="text-[#7e9398]">Chipta</p>
                  <p className="font-bold">{person.ticket}</p>
                  <p className="mt-2 text-[#7e9398]">Holat</p>
                  <p className="font-semibold">{PAY_LABEL[person.pay]}</p>
                  <Link to="/tashkilotchi/tolovlar" className="mt-2 inline-block text-[12.5px] font-semibold text-[#0c8f86]">To‘lovlarga o‘tish</Link>
                </div>
              )}
              {tab === 'cert' && (
                <div className="mt-3 text-[13px]">
                  {person.pay === 'paid' ? <p>Sertifikat tayyor. Raqam: STH-2026-{String(person.id).padStart(4, '0')}</p> : <p className="text-[#7e9398]">Sertifikat hali berilmagan.</p>}
                  <Btn kind="ghost" className="mt-3" to="/tashkilotchi/sertifikatlar">Sertifikatlarga o‘tish</Btn>
                </div>
              )}
              <div className="mt-4 grid place-items-center rounded-xl bg-[#f6fbfa] py-3">
                <QrMark size={120} seed={person.id} />
                <p className="mt-2 text-[12.5px] font-semibold">Ishtirokchi QR-kodi</p>
                <p className="text-[11px] text-[#8aa0a4]">Kirish paytida skanerlang</p>
              </div>
              <div className="mt-3 space-y-2">
                <Btn className="w-full" onClick={() => notify(`${person.name} check-in qilindi`)}><QrCode className="size-4" /> QR check-in qilish</Btn>
                <Btn kind="ghost" className="w-full" to="/tashkilotchi/sertifikatlar">Sertifikat berish</Btn>
                <Btn kind="ghost" className="w-full" onClick={() => setMail(true)}><Mail className="size-4" /> Email yuborish</Btn>
              </div>
            </aside>
          )}
        </div>
      </Card>

      <Modal open={add} title="Ishtirokchi qo‘shish" onClose={() => setAdd(false)}>
        <div className="space-y-3">
          <Field label="Ism-familiya" req error={errors.name}><input className={inputCls(errors.name)} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Aliyeva Mohira" /></Field>
          <Field label="Telefon" req error={errors.phone}><input className={inputCls(errors.phone)} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+998 90 123 45 67" /></Field>
          <Field label="Email" req error={errors.email}><input className={inputCls(errors.email)} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="m.aliyeva@mail.uz" /></Field>
          <Field label="Chipta turi"><select className={inputCls()} value={form.ticket} onChange={(e) => setForm({ ...form, ticket: e.target.value })}><option>Standart</option><option>VIP</option><option>Student</option><option>Guruh</option></select></Field>
          <div className="flex justify-end gap-2 pt-2"><Btn kind="soft" onClick={() => setAdd(false)}>Bekor qilish</Btn><Btn onClick={save}>Saqlash</Btn></div>
        </div>
      </Modal>
      <Modal open={mail} title="Email yuborish" onClose={() => setMail(false)}>
        <MailForm onClose={() => setMail(false)} onSend={() => { setMail(false); notify('Email yuborildi') }} to={person?.email} />
      </Modal>
      <p className="sr-only">{som(0)}</p>
    </div>
  )
}

function MailForm({ onClose, onSend, to }) {
  const [text, setText] = useState('Assalomu alaykum! Seminarga yozilganingiz uchun rahmat.')
  const [bad, setBad] = useState(false)
  return (
    <div className="space-y-3">
      <Field label="Qabul qiluvchi"><input className={inputCls()} defaultValue={to || ''} /></Field>
      <Field label="Xabar" error={bad ? 'Xabar bo‘sh bo‘lmasin' : ''}><textarea className={`${inputCls()} h-24 py-2`} value={text} onChange={(e) => setText(e.target.value)} /></Field>
      <div className="flex justify-end gap-2"><Btn kind="soft" onClick={onClose}>Bekor qilish</Btn><Btn onClick={() => { if (!text.trim()) { setBad(true); return } onSend() }}>Yuborish</Btn></div>
    </div>
  )
}
