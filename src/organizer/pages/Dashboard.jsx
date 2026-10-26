import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Award, Calendar, ChevronDown, ChevronRight, GraduationCap, Info, MapPin, Megaphone, Plus, QrCode,
  Send, Share2, Download, Users, Wallet, X, Check,
} from 'lucide-react'
import { MONTHS, SEAT, som } from '../data'
import { useOrg } from '../Shell'
import { useHub, walletOf } from '../../hubStore'
import { Badge, Btn, MiniSelect, Modal, cx } from '../ui'

const TICKET_COLORS = ['#0a8a82', '#5ed0c6', '#b7ebe4', '#7ec8c0', '#e5f7f4']

function ticketSplit(participants) {
  const map = new Map()
  participants.forEach((person) => {
    const label = person.ticket || 'Boshqa'
    map.set(label, (map.get(label) || 0) + 1)
  })
  const total = participants.length || 1
  return [...map.entries()].map(([label, n], index) => ({
    label,
    n,
    pct: Math.round((n / total) * 100),
    color: TICKET_COLORS[index % TICKET_COLORS.length],
  }))
}

function EmptyNote({ children }) {
  return <p className="px-2 py-8 text-center text-[13px] leading-snug text-[#7e9398]">{children}</p>
}

const ICONS = { user: Users, pay: Wallet, cal: Calendar, award: Award, qr: QrCode }

function Panel({ title, extra, children, className, bodyClass }) {
  return (
    <section className={cx('rounded-2xl border border-[#e6f1ef] bg-white shadow-[0_1px_2px_rgb(16_40_40/0.04)]', className)}>
      {(title || extra) && (
        <div className="flex items-center justify-between gap-2 px-3.5 pt-2.5">
          {title ? <h2 className="min-w-0 text-[14.5px] font-bold leading-tight text-[#143044]">{title}</h2> : <span />}
          {extra}
        </div>
      )}
      <div className={bodyClass || 'px-3.5 pb-2.5 pt-1.5'}>{children}</div>
    </section>
  )
}

function DashKpi({ icon: Icon, label, value, delta, hint }) {
  return (
    <article className="flex min-w-0 items-center gap-2.5 rounded-2xl border border-[#e6f1ef] bg-white px-3 py-2.5 shadow-[0_1px_2px_rgb(16_40_40/0.03)]">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e7f7f4] text-[var(--color-org-teal)]">
        <Icon className="size-[18px]" strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <p className="text-[12px] leading-tight text-[#6e868c]">{label}</p>
        <p className="mt-0.5 whitespace-nowrap text-[17px] font-bold leading-none tracking-tight text-[#143044]">{value}</p>
        <p className="mt-1 flex items-center gap-1 whitespace-nowrap text-[11px] leading-none text-[#8aa0a4]">
          {delta ? (
            <span className="inline-flex items-center font-semibold text-[#16a34a]">
              <svg viewBox="0 0 12 12" className="mr-0.5 size-2.5" aria-hidden><path d="M6 1.5 10 7H2L6 1.5Z" fill="currentColor" /></svg>
              {delta}
            </span>
          ) : null}
          <span>{hint}</span>
        </p>
      </div>
    </article>
  )
}

function Bars({ values, labels = MONTHS }) {
  const max = Math.max(1, ...values)
  const ticks = [max, Math.round(max * 0.75), Math.round(max * 0.5), Math.round(max * 0.25), 0]
  return (
    <div>
      <div className="flex h-[108px] gap-1.5">
        <div className="flex h-full w-7 shrink-0 flex-col justify-between text-right text-[10px] leading-none text-[#9aafb4]">
          {ticks.map((n) => <span key={n}>{n}</span>)}
        </div>
        <div className="relative min-w-0 flex-1">
          {[0, 25, 50, 75].map((p) => (
            <span key={p} className="absolute inset-x-0 border-t border-[#f0f5f4]" style={{ top: `${p}%` }} />
          ))}
          <div className="absolute inset-0 flex items-end gap-[6px] border-b border-[#e6eeec]">
            {values.map((v, i) => {
              const pct = Math.max(2, (v / max) * 100)
              return (
                <div key={labels[i] || i} className="flex h-full min-w-0 flex-1 items-end">
                  <div className="relative w-full overflow-hidden rounded-t-[5px]" style={{ height: `${pct}%` }}>
                    <div
                      className="absolute inset-x-0 bottom-0"
                      style={{
                        height: `${100 / (pct / 100)}%`,
                        background: 'linear-gradient(to bottom, #06786f 0%, #2fafa4 36%, #8fdcd4 68%, #d9f5f1 100%)',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <div className="ml-8 mt-1.5 flex">
        {labels.map((m, i) => <span key={`${m}-${i}`} className="flex-1 truncate text-center text-[10px] leading-none text-[#8aa4a8]">{m}</span>)}
      </div>
    </div>
  )
}

function TicketDonut({ tickets }) {
  if (!tickets.length) return <EmptyNote>Hali chipta sotilmagan.</EmptyNote>
  let acc = 0
  const stops = tickets.map((p) => {
    const next = acc + p.pct
    const s = `${p.color} ${acc}% ${next}%`
    acc = next
    return s
  }).join(',')
  const total = tickets.reduce((sum, row) => sum + row.n, 0)
  return (
    <div className="flex items-center gap-2.5 py-1">
      <div className="relative size-[108px] shrink-0">
        <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${stops})` }} />
        <div className="absolute inset-[26%] grid place-items-center rounded-full bg-white text-center">
          <div>
            <div className="text-[15px] font-bold leading-none tracking-tight text-[#143044]">{total}</div>
            <div className="mt-0.5 text-[10px] text-[#7e9398]">chipta</div>
          </div>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-[7px]">
        {tickets.map((t) => (
          <li key={t.label} className="grid grid-cols-[8px_minmax(0,1fr)_28px_26px] items-center gap-1.5 text-[12px] leading-none">
            <span className="size-2 rounded-full" style={{ background: t.color }} />
            <span className="truncate text-[#3e5a62]">{t.label}</span>
            <span className="text-right font-semibold text-[#143044]">{t.pct}%</span>
            <span className="text-right text-[#7e9398]">{t.n}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Activity({ a }) {
  const Icon = ICONS[a.icon]
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-[#e7f7f4] text-[var(--color-org-teal)]">
        <Icon className="size-3.5" strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="whitespace-nowrap text-[12px] font-semibold leading-none text-[#143044]">{a.title}</p>
          <span className="shrink-0 text-[10.5px] leading-none text-[#8aa4a8]">{a.time}</span>
        </div>
        <p className="mt-0.5 whitespace-nowrap text-[11px] leading-none text-[#7e9398]">{a.text}</p>
      </div>
    </li>
  )
}

function Quick({ icon: Icon, label, onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-1 rounded-xl px-1 py-1 text-center hover:bg-[#f4fbfb]">
      <span className="grid size-9 place-items-center rounded-xl bg-[#e7f7f4] text-[var(--color-org-teal)]">
        <Icon className="size-4" strokeWidth={1.8} />
      </span>
      <span className="max-w-[88px] text-[11px] font-medium leading-[1.15] text-[#1c4a5a]">{label}</span>
    </button>
  )
}

function SeminarRow({ s, navigate }) {
  const st = SEAT[s.seat]
  const pct = Math.round((s.sold / s.seats) * 100)
  return (
    <li className="flex items-center gap-2.5 px-3 py-1.5">
      <div className="relative h-[50px] w-[150px] shrink-0 overflow-hidden rounded-[10px]">
        <img src={s.image} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/5" />
        <p className="absolute inset-y-0 left-0 flex w-[78%] items-center px-2 text-[10.5px] font-semibold leading-[1.2] text-white drop-shadow-[0_1px_1px_rgb(0_0_0/0.45)]">
          <span className="line-clamp-2">{s.title}</span>
        </p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="whitespace-nowrap text-[13px] font-semibold leading-tight text-[#143044]">{s.title}</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11.5px] text-[#7e9398]">
          <span className="inline-flex items-center gap-1"><Calendar className="size-3.5 text-[#8aa4a8]" /> {s.when}</span>
          <span className="inline-flex items-center gap-1"><MapPin className="size-3.5 text-[#8aa4a8]" /> {s.city}</span>
        </p>
      </div>
      <div className="w-[76px] shrink-0">
        <p className="text-right text-[11px] leading-none text-[#6e868c]">{s.sold} / {s.seats}</p>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#e8f1ef]">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: st.bar }} />
        </div>
      </div>
      <Badge tone={st.tone}>{st.label}</Badge>
      <button
        type="button"
        onClick={() => navigate(`/tashkilotchi/seminarlar/${s.id}`)}
        className="inline-flex h-8 shrink-0 items-center rounded-lg border border-[#d5ebe6] bg-white px-2.5 text-[12.5px] font-semibold text-[var(--color-org-teal)] hover:bg-[#f4fbfa]"
      >
        Tafsilotlar
      </button>
    </li>
  )
}

function upcomingOf(seminars) {
  return seminars
    .filter((s) => s.status === 'rejalashtirilgan' || s.status === 'jarayonda')
    .map((s) => ({
      id: s.id,
      title: s.title,
      when: `${s.date}, ${s.startTime || '10:00'}`,
      city: s.city,
      sold: s.sold,
      seats: s.seats || 1,
      seat: s.sold >= s.seats ? 'full' : s.seats && s.sold / s.seats > 0.75 ? 'low' : 'open',
      image: s.image,
    }))
}

function Desktop() {
  const { query, notify } = useOrg()
  const hub = useHub()
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
    const rows = upcomingOf(hub.seminars)
    if (!s) return rows
    return rows.filter((x) => `${x.title} ${x.city}`.toLowerCase().includes(s))
  }, [query, hub.seminars])
  const revenue = hub.payments.filter((p) => p.state === 'ok').reduce((n, p) => n + p.sum, 0)
  const feed = hub.activity || []
  const tickets = ticketSplit(hub.participants)
  const seminarBars = hub.seminars.slice(0, 12).map((seminar) => (
    metric === 'Ishtirokchilar soni'
      ? hub.participants.filter((person) => person.seminarId === seminar.id).length
      : seminar.sold || 0
  ))

  const sendInvite = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr('Email noto‘g‘ri'); return }
    setInvite(false); setEmail(''); setErr(''); notify('Taklifnoma yuborildi')
  }

  return (
    <div className="-mt-1">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold leading-tight tracking-tight text-[#143044]">Boshqaruv paneli</h1>
          <p className="mt-0.5 text-[13px] text-[#6e868c]">Seminarlaringiz umumiy ko‘rinishi va asosiy ko‘rsatkichlar</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="relative">
            <button type="button" onClick={() => setRangeOpen((v) => !v)} className="flex h-10 items-center gap-2 rounded-xl border border-[#e3eeec] bg-white px-3 text-[12.5px] font-medium text-[#1c4a5a]">
              <Calendar className="size-4 text-[var(--color-org-teal)]" /> {range} <ChevronDown className="size-3.5 text-[#8aa4a8]" />
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

      <section className="grid grid-cols-2 gap-3 min-[1180px]:grid-cols-4">
        <DashKpi icon={GraduationCap} label="Jami seminarlar" value={String(hub.seminars.length)} delta={`+${hub.seminars.filter((s) => s.status === 'rejalashtirilgan').length}`} hint="rejalashtirilgan" />
        <DashKpi icon={Users} label="Jami ishtirokchilar" value={String(hub.participants.length)} delta="" hint="ro‘yxatdagilar" />
        <DashKpi icon={Wallet} label="Umumiy tushum" value={som(revenue)} delta="" hint="muvaffaqiyatli to‘lovlar" />
        <DashKpi icon={Award} label="Berilgan sertifikatlar" value={String(hub.certs.filter((c) => c.state === 'done').length)} delta="" hint="berilgan" />
      </section>

      <section className="mt-2 grid gap-3 min-[1180px]:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_276px]">
        <Panel title="Ishtirokchilar dinamikasi" extra={<MiniSelect label={metric} value={metric} options={['Ishtirokchilar soni', 'Sotilgan chipta']} onChange={setMetric} />}>
          {seminarBars.some((value) => value > 0) ? <Bars values={seminarBars} labels={hub.seminars.slice(0, 12).map((seminar) => seminar.title.slice(0, 3))} /> : <EmptyNote>Hali ishtirokchi yo‘q. Birinchi seminaringizni yarating.</EmptyNote>}
        </Panel>
        <Panel title="Tushumlar" extra={<MiniSelect label={unit} value={unit} options={['So‘mda', 'Ming so‘m', 'Dollar']} onChange={setUnit} />}>
          <p className="mb-1 text-[20px] font-bold leading-none tracking-tight text-[#143044]">
            {unit === 'Dollar' ? `${Math.round(revenue / 12500).toLocaleString('ru-RU')} $` : unit === 'Ming so‘m' ? `${Math.round(revenue / 1000).toLocaleString('ru-RU')} ming` : som(revenue)}
          </p>
          {revenue > 0 ? (
            <ul className="max-h-[120px] space-y-1 overflow-auto">
              {hub.seminars.filter((seminar) => seminar.revenue).map((seminar) => (
                <li key={seminar.id} className="flex items-center justify-between gap-2 text-[12px]">
                  <span className="truncate text-[#3e5a62]">{seminar.title}</span>
                  <b className="shrink-0 text-[#143044]">{som(seminar.revenue)}</b>
                </li>
              ))}
            </ul>
          ) : <EmptyNote>Hali tushum yo‘q. To‘lovlar shu hisobga yoziladi.</EmptyNote>}
        </Panel>
        <Panel title="Chipta turlari bo‘yicha sotuv" bodyClass="px-3 pb-3 pt-1">
          <TicketDonut tickets={tickets} />
        </Panel>
      </section>

      <section className="mt-2 grid items-start gap-3 min-[1180px]:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-2">
          <Panel
            title="Yaqinlashayotgan seminarlar"
            extra={<Link to="/tashkilotchi/seminarlar" className="shrink-0 text-[12.5px] font-semibold text-[var(--color-org-teal)]">Barchasini ko‘rish</Link>}
            bodyClass="px-0 pb-1 pt-1"
          >
            <ul className="divide-y divide-[#eef4f3]">
              {list.map((s) => <SeminarRow key={s.id} s={s} navigate={navigate} />)}
              {list.length === 0 && <li className="py-8 text-center text-[13px] text-[#7e9398]">Seminar topilmadi</li>}
            </ul>
          </Panel>
          {banner && (
            <div className="flex items-center gap-3 rounded-2xl border border-[#d7f0ea] bg-[#eefaf6] px-3.5 py-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[var(--color-org-teal)] shadow-[0_1px_2px_rgb(12_143_134/0.08)]">
                <Megaphone className="size-5" strokeWidth={1.8} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-bold leading-tight text-[#143044]">Seminarlaringizni kengroq auditoriyaga yetkazing</p>
                <p className="mt-0.5 text-[12px] leading-snug text-[#5f7c80]">Platforma orqali reklama qiling va ko‘proq ishtirokchilar jalb qiling.</p>
              </div>
              <Link to="/tashkilotchi/marketing" className="inline-flex h-9 shrink-0 items-center rounded-xl border border-[#b7e0d8] bg-white px-3 text-[12.5px] font-semibold text-[var(--color-org-teal)] hover:bg-[#f6fdfb]">
                Marketing vositalari →
              </Link>
              <button type="button" onClick={() => setBanner(false)} aria-label="Yopish" className="grid size-8 shrink-0 place-items-center rounded-lg text-[#7e9398] hover:bg-white/70">
                <X className="size-4" />
              </button>
            </div>
          )}
        </div>
        <div className="min-w-0 space-y-2">
          <Panel title="So‘nggi faoliyatlar" extra={<button type="button" onClick={() => setActivity(true)} className="shrink-0 text-[12.5px] font-semibold text-[var(--color-org-teal)]">Barchasini ko‘rish</button>}>
            <ul className="space-y-1.5">
              {feed.map((a) => <Activity key={a.title + a.time} a={a} />)}
              {feed.length === 0 && <EmptyNote>Hali faoliyat yo‘q.</EmptyNote>}
            </ul>
          </Panel>
          <Panel title="Tezkor amallar" bodyClass="px-1.5 pb-2 pt-1">
            <div className="grid grid-cols-3 gap-1">
              <Quick icon={Send} label="Taklifnoma yuborish" onClick={() => setInvite(true)} />
              <Quick icon={Download} label="QR tushirish" onClick={() => { const lines = hub.participants.slice(0, 40).map((p) => `${p.code},${p.name},${p.phone}`).join('\n'); const blob = new Blob([`kod,ism,telefon\n${lines}`], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'qr-kodlar.csv'; a.click(); notify('QR kodlar yuklab olindi') }} />
              <Quick icon={Share2} label="Seminarni ulashish" onClick={() => { const id = list[0]?.id; if (!id) { notify('Avval seminar yarating'); return } navigator.clipboard?.writeText(`${window.location.origin}/seminarlar/${id}`).catch(() => {}); notify('Havola nusxalandi') }} />
            </div>
          </Panel>
        </div>
      </section>

      <Modal open={activity} title="So‘nggi faoliyatlar" onClose={() => setActivity(false)} width={480}>
        <ul className="space-y-3">{feed.map((a) => <Activity key={a.title + a.time} a={a} />)}{feed.length === 0 && <EmptyNote>Hali faoliyat yo‘q.</EmptyNote>}</ul>
      </Modal>
      <Modal open={invite} title="Taklifnoma yuborish" sub="Ishtirokchi emailini kiriting" onClose={() => setInvite(false)}>
        <input value={email} onChange={(e) => { setEmail(e.target.value); setErr('') }} placeholder="email@mail.uz" className="h-10 w-full rounded-xl border border-[#e3eeec] px-3 text-[13px] outline-none focus:border-[var(--color-org-teal)]" />
        {err && <p className="mt-1 text-[12px] text-[#e11d48]">{err}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Btn kind="soft" onClick={() => setInvite(false)}>Bekor qilish</Btn>
          <Btn onClick={sendInvite}>Yuborish</Btn>
        </div>
      </Modal>
    </div>
  )
}

function Status({ ok }) {
  if (ok) {
    return (
      <span className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#16a34a]">
        <span className="grid size-[18px] place-items-center rounded-full bg-[#16a34a] text-white">
          <Check className="size-3" strokeWidth={3} />
        </span>
        Keldi
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[12.5px] font-medium text-[#9aa6aa]">
      <span className="size-[18px] rounded-full border-2 border-[#d5dee0]" />
      Kelmadi
    </span>
  )
}

function Mobile() {
  const { query } = useOrg()
  const hub = useHub()
  const next = hub.seminars.find((s) => s.status === 'rejalashtirilgan' || s.status === 'jarayonda') || hub.seminars[0]
  const [info, setInfo] = useState(false)
  const q = query.trim().toLowerCase()
  const people = hub.participants.map((person) => ({
    name: person.name,
    phone: person.phone,
    ticket: person.ticket,
    time: person.registered || '',
    ok: !!person.arrived,
    avatar: person.avatar || '/images/avatar.jpg',
  }))
  const rows = q ? people.filter((r) => `${r.name} ${r.phone} ${r.ticket}`.toLowerCase().includes(q)) : people
  const checkedIn = hub.participants.filter((person) => person.arrived).length
  const held = walletOf(hub).hold
  const soldPct = next?.seats ? Math.round(((next.sold || 0) / next.seats) * 100) : 0
  const hello = hub.settings?.name || 'Tashkilotchi'

  return (
    <div className="-mt-1 pb-1">
      <p className="text-[13px] leading-tight text-[#7e9398]">Assalomu alaykum,</p>
      <h1 className="mt-0.5 text-[24px] font-bold leading-none tracking-tight text-[#143044]">{hello}</h1>
      <p className="mt-1 text-[12.5px] text-[#8aa0a4]">Bugun ham muvaffaqiyatli kun bo‘lsin!</p>

      {next ? <Link to={`/tashkilotchi/seminarlar/${next.id}`} className="mt-3 block rounded-2xl border border-[#e7f2f0] bg-white p-2.5 shadow-[0_8px_24px_rgb(20_60_60/0.04)]">
        <div className="flex gap-2.5">
          <img src={next?.image || '/images/hero-implant.jpg'} alt="" className="h-[76px] w-[84px] shrink-0 rounded-xl object-cover" />
          <div className="min-w-0 flex-1">
            <span className="inline-flex rounded-full bg-[#e7f7f4] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-org-teal)]">{next?.topic || 'Implantologiya'}</span>
            <p className="mt-1 flex items-start gap-1 text-[15px] font-bold leading-tight text-[#143044]">
              <span className="min-w-0 flex-1">{next?.title || 'Seminar'}</span>
              <ChevronRight className="mt-0.5 size-4 shrink-0 text-[#9aafb4]" />
            </p>
            <p className="mt-1.5 flex items-start gap-1.5 text-[12px] leading-snug text-[#6e868c]">
              <Calendar className="mt-0.5 size-3.5 shrink-0 text-[var(--color-org-teal)]" />
              <span>{next ? `${next.date}, ${next.startTime || '10:00'}` : ''}</span>
            </p>
            <p className="mt-1 flex items-start gap-1.5 text-[12px] leading-snug text-[#6e868c]">
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-[var(--color-org-teal)]" />
              <span>{next?.place || next?.city}</span>
            </p>
          </div>
        </div>
        <div className="mt-2 border-t border-[#f0f5f4] pt-2">
          <div className="flex items-center gap-2">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#e7f7f4] text-[var(--color-org-teal)]">
              <Users className="size-4" strokeWidth={1.8} />
            </span>
            <span className="text-[13px] font-medium text-[#1c4a5a]">Sotilgan chiptalar</span>
            <span className="ml-auto text-[13.5px] font-bold text-[#143044]">{next?.sold || 0} / {next?.seats || 0}</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e6f3f1]">
              <div className="h-full rounded-full bg-[#14b8a6]" style={{ width: `${soldPct}%` }} />
            </div>
            <span className="text-[12.5px] font-semibold text-[var(--color-org-teal)]">{soldPct}%</span>
          </div>
        </div>
      </Link> : (
        <div className="mt-3 rounded-2xl border border-dashed border-[#d5ebe6] bg-white px-4 py-8 text-center">
          <p className="text-[15px] font-bold text-[#143044]">Hali seminar yo‘q</p>
          <p className="mt-1 text-[12.5px] text-[#6e868c]">Birinchi seminaringizni yarating — statistika shu yerda paydo bo‘ladi.</p>
          <Link to="/tashkilotchi/seminarlar/yangi" className="mt-3 inline-flex h-10 items-center rounded-xl bg-[var(--color-org-teal)] px-4 text-[13px] font-semibold text-white">Seminar yaratish</Link>
        </div>
      )}

      <div className="mt-2 grid grid-cols-2 gap-2">
        <article className="rounded-2xl border border-[#e7f2f0] bg-white p-2.5 shadow-[0_6px_18px_rgb(20_60_60/0.04)]">
          <span className="grid size-9 place-items-center rounded-xl bg-[#e7f7f4] text-[var(--color-org-teal)]">
            <Users className="size-[18px]" strokeWidth={1.8} />
          </span>
          <p className="mt-2 text-[12px] text-[#6e868c]">Bugungi check-in</p>
          <p className="mt-0.5 text-[18px] font-bold leading-none tracking-tight text-[#143044]">{checkedIn} kishi</p>
          <p className="mt-1 text-[11.5px] text-[#8aa0a4]">Jami: {hub.participants.length} ishtirokchi</p>
        </article>
        <article className="relative rounded-2xl border border-[#e7f2f0] bg-white p-2.5 shadow-[0_6px_18px_rgb(20_60_60/0.04)]">
          <span className="grid size-9 place-items-center rounded-xl bg-[#e7f7f4] text-[var(--color-org-teal)]">
            <Wallet className="size-[18px]" strokeWidth={1.8} />
          </span>
          <p className="mt-2 flex items-center gap-1 text-[12px] text-[#6e868c]">
            Daromad
            <button type="button" aria-label="Daromad haqida" onClick={() => setInfo((v) => !v)} className="text-[#9aafb4]">
              <Info className="size-3.5" />
            </button>
          </p>
          {info && (
            <p className="absolute left-3 right-3 top-16 z-10 rounded-lg bg-[#16324a] px-2 py-1.5 text-[11px] leading-snug text-white shadow-lg">
              Ushlab turilgan summa to‘lov tasdiqlangach hamyonga o‘tadi.
            </p>
          )}
          <p className="mt-0.5 text-[16px] font-bold leading-tight tracking-tight text-[#143044]">{som(held)}</p>
          <p className="mt-1 text-[11.5px] text-[#8aa0a4]">Ushlab turilgan summa</p>
        </article>
      </div>

      <div className="mt-2 space-y-2">
        <Link to="/tashkilotchi/seminarlar/yangi" className="flex items-center gap-3 rounded-2xl border border-[#e7f2f0] bg-white px-3 py-2 shadow-[0_6px_18px_rgb(20_60_60/0.04)]">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e7f7f4] text-[var(--color-org-teal)]">
            <Plus className="size-5" strokeWidth={1.8} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14.5px] font-bold leading-tight text-[#143044]">Yangi seminar</span>
            <span className="mt-0.5 block text-[12px] text-[#8aa0a4]">Seminar qo‘shish</span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-[#9aafb4]" />
        </Link>
        <Link to="/tashkilotchi/qr" className="flex items-center gap-3 rounded-2xl border border-[#e7f2f0] bg-white px-3 py-2 shadow-[0_6px_18px_rgb(20_60_60/0.04)]">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e7f7f4] text-[var(--color-org-teal)]">
            <QrCode className="size-5" strokeWidth={1.8} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14.5px] font-bold leading-tight text-[#143044]">QR skaner</span>
            <span className="mt-0.5 block text-[12px] text-[#8aa0a4]">Check-in qilish</span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-[#9aafb4]" />
        </Link>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <h2 className="text-[16px] font-bold text-[#143044]">So‘nggi ro‘yxatdan o‘tishlar</h2>
        <Link to="/tashkilotchi/ishtirokchilar" className="inline-flex shrink-0 items-center gap-0.5 text-[12.5px] font-semibold text-[var(--color-org-teal)]">
          Barchasini ko‘rish <ChevronRight className="size-3.5" />
        </Link>
      </div>
      <ul className="mt-2 divide-y divide-[#eef3f2] overflow-hidden rounded-2xl border border-[#e7f2f0] bg-white">
        {rows.map((r) => (
          <li key={r.phone} className="flex items-center gap-2 px-2.5 py-2">
            <img src={r.avatar} alt="" className="size-9 shrink-0 rounded-full object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-semibold leading-tight text-[#143044]">{r.name}</p>
              <p className="mt-0.5 truncate text-[11.5px] text-[#8aa0a4]">{r.phone}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[12.5px] font-medium leading-tight text-[#1c4a5a]">{r.ticket}</p>
              <p className="mt-0.5 text-[11px] text-[#8aa0a4]">{r.time}</p>
            </div>
            <Status ok={r.ok} />
          </li>
        ))}
        {rows.length === 0 && <li className="px-3 py-8 text-center text-[13px] text-[#7e9398]">{q ? 'Ro‘yxat topilmadi' : 'Hali ishtirokchi yo‘q'}</li>}
      </ul>
    </div>
  )
}

export default function Dashboard() {
  return (
    <>
      <div className="md:hidden"><Mobile /></div>
      <div className="hidden md:block"><Desktop /></div>
    </>
  )
}
