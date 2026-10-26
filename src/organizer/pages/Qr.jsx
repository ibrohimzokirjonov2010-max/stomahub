import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, ChevronDown, History, MapPin, QrCode, ScanLine, Settings, SlidersHorizontal, Users, Check, Clock, XCircle } from 'lucide-react'
import { CHECKINS, SEMINARS } from '../data'
import { useOrg } from '../Shell'
import { Badge, Btn, Card, Field, QrMark, inputCls } from '../ui'

const TABS = [
  { id: 'scan', label: 'QR skaner', icon: QrCode },
  { id: 'manual', label: 'Manuel check-in', icon: Users },
  { id: 'history', label: 'Check-in tarixi', icon: History },
  { id: 'stats', label: 'Statistika', icon: SlidersHorizontal },
  { id: 'settings', label: 'Sozlamalar', icon: Settings },
]

export default function Qr() {
  const { notify } = useOrg()
  const [tab, setTab] = useState('scan')
  const [seminar, setSeminar] = useState('implant-nov')
  const [open, setOpen] = useState(false)
  const [list, setList] = useState(CHECKINS)
  const [scanning, setScanning] = useState(false)
  const [code, setCode] = useState('')
  const [sound, setSound] = useState(true)
  const sem = SEMINARS.find((s) => s.id === seminar) || SEMINARS[0]
  const ok = list.filter((x) => x.ok).length

  const scan = () => {
    setScanning(true)
    window.setTimeout(() => {
      setScanning(false)
      const hit = list.find((x) => !x.ok)
      if (hit) {
        setList((rows) => rows.map((r) => r.id === hit.id ? { ...r, ok: true, time: 'hozir' } : r))
        notify(`${hit.name} kirish qildi`)
      } else notify('Yangi kod topilmadi')
    }, 700)
  }

  const manual = () => {
    const name = code.trim()
    if (name.length < 3) { notify('Ism yoki kod kiriting'); return }
    setList((rows) => [{ id: Date.now(), name, clinic: 'Mehmon', time: 'hozir', ticket: 'Standart', ok: true, avatar: '/images/avatar.jpg' }, ...rows])
    setCode('')
    notify('Manuel check-in saqlandi')
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-[12px] text-[#8aa0a4]"><Link to="/tashkilotchi" className="hover:text-[#0c8f86]">Boshqaruv paneli</Link> <span className="px-1">›</span> <Link to="/tashkilotchi/seminarlar" className="hover:text-[#0c8f86]">Mening seminarlarim</Link> <span className="px-1">›</span> QR Check-in</p>
        </div>
        <div className="relative">
          <button type="button" onClick={() => setOpen((v) => !v)} className="flex h-10 items-center gap-2 rounded-xl bg-[#0c8f86] px-3 text-[13px] font-semibold text-white"><Calendar className="size-4" /> Seminarni tanlash <ChevronDown className="size-4" /></button>
          {open && (
            <ul className="absolute right-0 z-20 mt-1 w-72 overflow-hidden rounded-xl border border-[#e6eeec] bg-white py-1 shadow-lg">
              {SEMINARS.map((s) => <li key={s.id}><button type="button" className="block w-full px-3 py-2 text-left text-[12.5px] hover:bg-[#f4fbfa]" onClick={() => { setSeminar(s.id); setOpen(false) }}>{s.title}</button></li>)}
            </ul>
          )}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3 rounded-2xl border border-[#e6f1ef] bg-white p-3">
        <img src={sem.image} alt="" className="h-14 w-[92px] rounded-xl object-cover" />
        <div className="min-w-0 flex-1">
          <p className="font-bold">{sem.title}</p>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-[#6e868c]">
            <span className="inline-flex items-center gap-1"><Calendar className="size-3.5" /> {sem.date}, 10:00</span>
            <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" /> {sem.city}, Congress Hall</span>
            <Badge tone="green" dot>Faol</Badge>
          </p>
        </div>
        <div className="w-full sm:w-48">
          <div className="flex justify-between text-[12px]"><span className="font-semibold">{sem.sold} / {sem.seats}</span><span>{Math.round(sem.sold / sem.seats * 100)}%</span></div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#e7f1ef]"><div className="h-full bg-[#14a394]" style={{ width: `${Math.round(sem.sold / sem.seats * 100)}%` }} /></div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[200px_minmax(0,1fr)_300px]">
        <Card pad={false} className="h-fit">
          <nav className="p-2">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => setTab(id)} className={`flex h-10 w-full items-center gap-2 rounded-xl px-2.5 text-[13px] ${tab === id ? 'bg-[#e7f6f3] font-semibold text-[#0c8f86]' : 'text-[#3e5a62]'}`}>
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </nav>
        </Card>

        <div>
          {tab === 'scan' && (
            <div className="relative overflow-hidden rounded-2xl bg-[#102033] text-white">
              <img src="/images/ishlar/ish-hall.jpg" alt="" className="absolute inset-0 size-full object-cover opacity-35" />
              <div className="relative grid place-items-center px-4 py-8 text-center">
                <h2 className="text-[20px] font-bold">QR kodni skanerlang</h2>
                <p className="mt-1 max-w-sm text-[13px] text-white/75">Ishtirokchining chipta QR kodini kamera orqali tekshiring</p>
                <div className={`relative mt-5 w-[210px] rounded-[28px] border-[6px] border-[#1c1c1c] bg-white p-3 shadow-2xl ${scanning ? 'ring-4 ring-[#5dcec4]' : ''}`}>
                  <div className="mb-2 flex items-center justify-center gap-1 text-[12px] font-bold text-[#0c8f86]">⌖ StomaHub</div>
                  <div className="rounded-lg border-2 border-[#5dcec4] p-2"><QrMark size={140} seed={9} /></div>
                  <div className="pointer-events-none absolute left-6 right-6 top-1/2 h-0.5 bg-[#5dcec4] shadow-[0_0_12px_#5dcec4]" />
                </div>
                <button type="button" onClick={scan} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-[#16324a]/80 px-4 text-[13px] font-semibold ring-1 ring-white/20"><ScanLine className="size-4" /> {scanning ? 'Tekshirilmoqda...' : 'QR kodni skanerlang'}</button>
              </div>
            </div>
          )}
          {tab === 'manual' && (
            <Card title="Manuel check-in" extra={null}>
              <Field label="Ism yoki chipta kodi" req><input className={inputCls()} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Aliyeva Mohira yoki STH-2026-0001" /></Field>
              <Btn className="mt-3" onClick={manual}>Check-in qilish</Btn>
            </Card>
          )}
          {tab === 'history' && (
            <Card title="Check-in tarixi" pad={false}>
              <ul className="divide-y divide-[#eef4f3]">
                {list.map((p) => <CheckRow key={p.id} p={p} />)}
              </ul>
            </Card>
          )}
          {tab === 'stats' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Stat icon={Users} label="Jami ishtirokchilar" value="200" />
              <Stat icon={Check} label="Check-in qilingan" value={String(150 - (CHECKINS.filter((c) => c.ok).length - ok))} hint="75%" />
              <Stat icon={Clock} label="Kutilmoqda" value="50" hint="25%" />
              <Stat icon={QrCode} label="QR kodlar" value="200" hint="Barchasi faol" />
            </div>
          )}
          {tab === 'settings' && (
            <Card title="Skaner sozlamalari">
              <label className="flex items-center justify-between text-[13px]"><span>Muvaffaqiyatli ovoz</span><input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} /></label>
              <Btn className="mt-3" onClick={() => notify('Sozlamalar saqlandi')}>Saqlash</Btn>
            </Card>
          )}
        </div>

        <Card title="So‘nggi check-inlar" extra={<button type="button" onClick={() => setTab('history')} className="text-[12.5px] font-semibold text-[#0c8f86]">Barchasini ko‘rish</button>} pad={false}>
          <ul className="divide-y divide-[#eef4f3] px-2">
            {list.slice(0, 8).map((p) => <CheckRow key={p.id} p={p} />)}
          </ul>
        </Card>
      </div>

      <section className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Users} label="Jami ishtirokchilar" value="200" />
        <Stat icon={Check} label="Check-in qilingan" value="150" hint="75%" />
        <Stat icon={Clock} label="Kutilmoqda" value="50" hint="25%" />
        <Stat icon={QrCode} label="QR kodlar" value="200" hint="Barchasi faol" />
      </section>
    </div>
  )
}

function CheckRow({ p }) {
  return (
    <li className="flex items-center gap-2 py-2.5">
      <img src={p.avatar} alt="" className="size-9 rounded-full object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12.5px] font-semibold">{p.name}</p>
        <p className="truncate text-[11px] text-[#8aa0a4]">{p.clinic}</p>
      </div>
      <span className="text-[11px] text-[#8aa0a4]">{p.time}</span>
      <span className="hidden text-[11px] text-[#5e787e] sm:inline">{p.ticket}</span>
      <Badge tone={p.ok ? 'green' : 'red'} dot>{p.ok ? 'Kirish qildi' : 'Bekor qilingan'}</Badge>
    </li>
  )
}

function Stat({ icon: Icon, label, value, hint }) {
  return (
    <article className="rounded-2xl border border-[#e6f1ef] bg-white px-4 py-3.5">
      <span className="grid size-9 place-items-center rounded-xl bg-[#e7f7f4] text-[#0c8f86]"><Icon className="size-4" /></span>
      <p className="mt-2 text-[12px] text-[#6e868c]">{label}</p>
      <p className="text-[22px] font-bold leading-tight">{value}</p>
      {hint && <p className="text-[12px] font-semibold text-[#16a34a]">{hint}</p>}
    </article>
  )
}
