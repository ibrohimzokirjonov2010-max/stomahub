import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Award, Calendar, ChevronDown, GraduationCap, MapPin, Megaphone, Plus, QrCode, Send, Share2, Download, Users, Wallet, X } from 'lucide-react'
import { ACTIVITY, DASH_BARS, DASH_LINE, DASH_TICKETS, SEAT, UPCOMING } from '../data'
import { useOrg } from '../Shell'
import { Badge, BarChart, Btn, Card, Donut, Kpi, LineChart, MenuBtn, MiniSelect, Modal } from '../ui'

const ICONS = { user: Users, pay: Wallet, cal: Calendar, award: Award, qr: QrCode }

export default function Dashboard() {
  const { query, notify } = useOrg()
  const navigate = useNavigate()
  const [banner, setBanner] = useState(true)
  const [range, setRange] = useState('1-yan, 2026 — 31-dek, 2026')
  const [rangeOpen, setRangeOpen] = useState(false)
  const [metric, setMetric] = useState('Ishtirokchilar soni')
  const [unit, setUnit] = useState('So‘mda')
  const [activity, setActivity] = useState(false)
  const [invite, setInvite] = useState(false)
  const [email, setEmail] = useState('')
  const [err, setErr] = useState('')

  const list = useMemo(() => {
    const s = query.trim().toLowerCase()
    if (!s) return UPCOMING
    return UPCOMING.filter((x) => `${x.title} ${x.city}`.toLowerCase().includes(s))
  }, [query])

  const sendInvite = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr('Email noto‘g‘ri'); return }
    setInvite(false); setEmail(''); setErr(''); notify('Taklifnoma yuborildi')
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Boshqaruv paneli</h1>
          <p className="mt-0.5 text-[13px] text-[#6e868c]">Seminarlaringiz umumiy ko‘rinishi va asosiy ko‘rsatkichlar</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <button type="button" onClick={() => setRangeOpen((v) => !v)} className="flex h-10 items-center gap-2 rounded-xl border border-[#e3eeec] bg-white px-3 text-[12.5px] font-medium text-[#1c4a5a]">
              <Calendar className="size-4 text-[#0c8f86]" /> {range} <ChevronDown className="size-3.5 text-[#8aa4a8]" />
            </button>
            {rangeOpen && (
              <ul className="absolute right-0 z-20 mt-1 w-64 overflow-hidden rounded-xl border border-[#e6eeec] bg-white py-1 shadow-lg">
                {['1-yan, 2026 — 31-dek, 2026', 'Shu oy', 'So‘nggi 90 kun', 'Shu yil'].map((o) => (
                  <li key={o}><button type="button" className="block w-full px-3 py-1.5 text-left text-[12.5px] hover:bg-[#f4fbfa]" onClick={() => { setRange(o); setRangeOpen(false) }}>{o}</button></li>
                ))}
              </ul>
            )}
          </div>
          <Btn to="/tashkilotchi/seminarlar/yangi"><Plus className="size-4" /> Yangi seminar yaratish</Btn>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={GraduationCap} label="Jami seminarlar" value="12" delta="+3" hint="o‘tgan oyga nisbatan" />
        <Kpi icon={Users} label="Jami ishtirokchilar" value="1 240" delta="+18%" hint="o‘tgan oyga nisbatan" />
        <Kpi icon={Wallet} label="Umumiy tushum" value="98 600 000 so‘m" delta="+28%" hint="o‘tgan oyga nisbatan" />
        <Kpi icon={Award} label="Berilgan sertifikatlar" value="987" delta="+22%" hint="o‘tgan oyga nisbatan" />
      </section>

      <section className="org-charts mt-3">
        <Card title="Ishtirokchilar dinamikasi" extra={<MiniSelect label={metric} value={metric} options={['Ishtirokchilar soni', 'Yangi ro‘yxat', 'Qayta kelganlar']} onChange={setMetric} />}>
          <BarChart values={metric === 'Ishtirokchilar soni' ? DASH_BARS : DASH_BARS.map((n) => Math.round(n * 0.55))} max={200} />
        </Card>
        <Card title="Tushumlar" extra={<MiniSelect label={unit} value={unit} options={['So‘mda', 'Ming so‘m', 'Dollar']} onChange={setUnit} />}>
          <p className="text-[20px] font-bold leading-none">98 600 000 so‘m</p>
          <LineChart values={DASH_LINE} max={170} tipTitle="Noyabr" tipText="18 400 000 so‘m" />
        </Card>
        <Card title="Chipta turlari bo‘yicha sotuv">
          <Donut parts={DASH_TICKETS} center="1 240" sub="chipta" />
        </Card>
      </section>

      <section className="org-split mt-3">
        <div className="min-w-0 space-y-3">
          <Card title="Yaqinlashayotgan seminarlar" extra={<Link to="/tashkilotchi/seminarlar" className="text-[12.5px] font-semibold text-[#0c8f86]">Barchasini ko‘rish</Link>} pad={false}>
            <ul className="divide-y divide-[#eef4f3] px-2">
              {list.map((s) => <Row key={s.id} s={s} notify={notify} navigate={navigate} />)}
              {list.length === 0 && <li className="py-8 text-center text-[13px] text-[#7e9398]">Seminar topilmadi</li>}
            </ul>
          </Card>
          {banner && (
            <div className="flex items-center gap-3 rounded-2xl border border-[#d7f0ea] bg-[#eefaf6] px-4 py-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#0c8f86]"><Megaphone className="size-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-bold">Seminarlaringizni kengroq auditoriyaga yetkazing</p>
                <p className="text-[12px] text-[#5f7c80]">Platforma orqali reklama qiling va ko‘proq ishtirokchilar jalb qiling.</p>
              </div>
              <Link to="/tashkilotchi/marketing" className="hidden h-9 shrink-0 items-center gap-1 rounded-xl border border-[#b7e0d8] bg-white px-3 text-[12.5px] font-semibold text-[#0c8f86] sm:flex">Marketing vositalari →</Link>
              <button type="button" onClick={() => setBanner(false)} aria-label="Yopish" className="grid size-8 shrink-0 place-items-center rounded-lg text-[#7e9398]"><X className="size-4" /></button>
            </div>
          )}
        </div>
        <div className="min-w-0 space-y-3">
          <Card title="So‘nggi faoliyatlar" extra={<button type="button" onClick={() => setActivity(true)} className="text-[12.5px] font-semibold text-[#0c8f86]">Barchasini ko‘rish</button>}>
            <ul className="space-y-3">
              {ACTIVITY.map((a) => <Activity key={a.title} a={a} />)}
            </ul>
          </Card>
          <Card title="Tezkor amallar">
            <div className="grid grid-cols-3 gap-2">
              <Quick icon={Send} label="Taklifnoma yuborish" onClick={() => setInvite(true)} />
              <Quick icon={Download} label="QR tushirish" onClick={() => notify('QR kodlar yuklab olindi')} />
              <Quick icon={Share2} label="Seminarni ulashish" onClick={() => { navigator.clipboard?.writeText(window.location.origin + '/tashkilotchi/seminarlar/implant').catch(() => {}); notify('Havola nusxalandi') }} />
            </div>
          </Card>
        </div>
      </section>

      <Modal open={activity} title="So‘nggi faoliyatlar" onClose={() => setActivity(false)} width={480}>
        <ul className="space-y-3">{ACTIVITY.map((a) => <Activity key={a.title} a={a} />)}</ul>
      </Modal>
      <Modal open={invite} title="Taklifnoma yuborish" sub="Ishtirokchi emailini kiriting" onClose={() => setInvite(false)}>
        <input value={email} onChange={(e) => { setEmail(e.target.value); setErr('') }} placeholder="email@mail.uz" className="h-10 w-full rounded-xl border border-[#e3eeec] px-3 text-[13px] outline-none focus:border-[#0c8f86]" />
        {err && <p className="mt-1 text-[12px] text-[#e11d48]">{err}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Btn kind="soft" onClick={() => setInvite(false)}>Bekor qilish</Btn>
          <Btn onClick={sendInvite}>Yuborish</Btn>
        </div>
      </Modal>
    </div>
  )
}

function Activity({ a }) {
  const Icon = ICONS[a.icon]
  return (
    <li className="flex items-start gap-2.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#e7f7f4] text-[#0c8f86]"><Icon className="size-4" /></span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12.5px] font-semibold">{a.title}</p>
        <p className="truncate text-[11.5px] text-[#7e9398]">{a.text}</p>
      </div>
      <span className="shrink-0 text-[11px] text-[#8aa4a8]">{a.time}</span>
    </li>
  )
}

function Quick({ icon: Icon, label, onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-2 rounded-xl px-1 py-2 text-center hover:bg-[#f4fbfb]">
      <span className="grid size-10 place-items-center rounded-xl bg-[#e7f7f4] text-[#0c8f86]"><Icon className="size-[18px]" /></span>
      <span className="text-[11.5px] font-medium leading-tight text-[#1c4a5a]">{label}</span>
    </button>
  )
}

function Row({ s, notify, navigate }) {
  const st = SEAT[s.seat]
  const pct = Math.round((s.sold / s.seats) * 100)
  return (
    <li className="flex items-center gap-3 py-3">
      <img src={s.image} alt="" className="size-12 shrink-0 rounded-xl object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-semibold">{s.title}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11.5px] text-[#7e9398]">
          <span className="inline-flex items-center gap-1"><Calendar className="size-3.5" /> {s.when}</span>
          <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" /> {s.city}</span>
        </p>
      </div>
      <div className="hidden w-[108px] shrink-0 sm:block">
        <div className="h-1.5 overflow-hidden rounded-full bg-[#e8f1ef]"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: st.bar }} /></div>
        <p className="mt-1 text-right text-[11px] text-[#6e868c]">{s.sold} / {s.seats}</p>
      </div>
      <Badge tone={st.tone} className="max-md:hidden">{st.label}</Badge>
      <Link to={`/tashkilotchi/seminarlar/${s.id}`} className="inline-flex h-8 items-center rounded-lg border border-[#d7ebe7] px-2.5 text-[12px] font-semibold text-[#0c8f86] max-lg:hidden">Tafsilotlar</Link>
      <MenuBtn items={[
        { label: 'Tafsilotlar', onClick: () => navigate(`/tashkilotchi/seminarlar/${s.id}`) },
        { label: 'Ulashish', onClick: () => notify('Havola nusxalandi') },
      ]} />
    </li>
  )
}
