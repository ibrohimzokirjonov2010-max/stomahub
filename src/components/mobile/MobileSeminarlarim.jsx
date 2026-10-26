import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck, CalendarDays, CircleCheck, Download, MapPin, QrCode, Ticket, UserRound, Video } from 'lucide-react'
import { seminarView, som } from '../../seminarsData'
import { publicRecord } from '../../hubStore'
import { useProfile } from '../../profileStore'
import { MobileToast } from './parts'
import MobileTabBar from './MobileTabBar'
import { BottomSheet } from './MobileSeminars'
import { SubTopBar } from './MobileManzillar'
import { Qr, downloadTicket } from './MobileSeminarReg'
import { useSeminarStore } from './seminarStore'

const teal = 'text-[#0b6d73]'
const navy = 'text-[#0d2a4a]'
const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']
const METHOD_LABEL = { click: 'Click', payme: 'Payme', uzum: 'Uzum Bank', card: 'Bank kartasi', split: 'Bo‘lib to‘lash' }

const SEED = [
  {
    key: 'seed-impl', cat: 'Implantologiya', title: 'Implantologiya: nazariya va klinik amaliyot', speaker: 'Dr. Sardor Karimov', role: 'Implantolog',
    date: '2026-11-24', from: '10:00', to: '16:00', online: false, place: 'Toshkent, Hyatt Regency', address: 'Toshkent shahri, Navoiy ko‘chasi, 1A',
    image: '/images/seminar-1.jpg', pos: 'object-[80%_center]', order: 'SEM-2031', plan: 'Standart · Oflayn', price: 1200000, method: 'click', cme: 8,
  },
  {
    key: 'seed-endo', cat: 'Endodontiya', title: 'Endodontiya: zamonaviy yondashuv', speaker: 'Dr. Sardor Ismailov', role: 'Endodontist',
    date: '2026-12-12', from: '10:00', to: '15:00', online: true, place: 'Onlayn', address: 'Zoom havolasi seminardan 1 soat oldin yuboriladi',
    image: '/images/seminar-2.jpg', pos: 'object-[18%_center]', order: 'SEM-2036', plan: 'Standart · Onlayn', price: 470000, method: 'payme', cme: 6,
  },
  {
    key: 'seed-orto', cat: 'Ortodontiya', title: 'Ortodontiya asoslari', speaker: 'Dr. Nilufar Abdullayeva', role: 'Ortodont',
    date: '2026-10-15', from: '10:00', to: '16:00', online: false, place: 'Toshkent, Hyatt Regency', address: 'Toshkent shahri, Navoiy ko‘chasi, 1A',
    image: '/images/seminars/aligner.jpg', pos: 'object-center', order: 'SEM-2012', plan: 'Standart · Oflayn', price: 900000, method: 'click', cme: 6,
  },
  {
    key: 'seed-estet', cat: 'Estetika', title: 'Kompozit restavratsiya: oldingi tishlar', speaker: 'Dr. Kamola Abdullayeva', role: 'Estetik stomatolog',
    date: '2026-09-27', from: '09:00', to: '17:00', online: false, place: 'Toshkent, Dentoshon Center', address: 'Toshkent shahri, Mirzo Ulug‘bek tumani',
    image: '/images/seminar-4.jpg', pos: 'object-[20%_center]', order: 'SEM-1998', plan: 'Amaliy · Oflayn', price: 1700000, method: 'card', cme: 5,
  },
  {
    key: 'seed-paro', cat: 'Parodontologiya', title: 'Parodontologiya: klinik protokollar', speaker: 'Dr. Javohir Ahmedov', role: 'Parodontolog',
    date: '2026-09-06', from: '10:00', to: '14:00', online: true, place: 'Onlayn', address: 'Yozuv 3 oy davomida mavjud',
    image: '/images/seminars/smile.jpg', pos: 'object-center', order: 'SEM-1984', plan: 'Standart · Onlayn', price: 390000, method: 'uzum', cme: 4,
  },
]

const atOf = (s) => new Date(`${s.date}T${s.to}:00`)
export const dateLabel = (s) => {
  const [y, m, d] = s.date.split('-').map(Number)
  const days = s.days > 1 ? `${d}–${d + s.days - 1}` : d
  return `${days}-${MONTHS[m - 1]} ${y}, ${s.from} – ${s.to}`
}

function fromStore(id, reg) {
  const rec = publicRecord(id)
  const s = rec ? seminarView(rec) : null
  if (!s) return null
  const [from, to] = s.time.split(/\s*[-–]\s*/)
  const online = reg.format === 'online'
  return {
    key: id, link: `/seminarlar/${id}`, cat: s.catName, title: s.title, speaker: s.speaker.name, role: s.speaker.role,
    date: `${s.monthKey}-${s.day}`, days: s.days, from, to, online,
    place: online ? 'Onlayn' : `${s.city}, ${s.venue.name}`,
    address: online ? 'Zoom havolasi email orqali yuboriladi' : s.venue.address,
    image: s.image, pos: 'object-center', order: reg.order, plan: reg.plan, price: reg.price, method: reg.method, months: reg.months, cme: s.cme,
  }
}

export function useMySeminars() {
  const store = useSeminarStore()
  const own = Object.entries(store.registered).filter(([, r]) => r?.order).map(([id, r]) => fromStore(id, r)).filter(Boolean)
  const all = [...own, ...SEED]
  const now = Date.now()
  return {
    upcoming: all.filter((s) => atOf(s) >= now).sort((a, b) => atOf(a) - atOf(b)),
    past: all.filter((s) => atOf(s) < now).sort((a, b) => atOf(b) - atOf(a)),
  }
}

function downloadIcs(s) {
  const d = s.date.replaceAll('-', '')
  const end = s.days > 1 ? String(Number(d) + s.days - 1) : d
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//StomaHub//Seminar//UZ', 'BEGIN:VEVENT',
    `UID:${s.key}-${s.order}@stomahub.uz`,
    `DTSTART:${d}T${s.from.replace(':', '')}00`,
    `DTEND:${end}T${s.to.replace(':', '')}00`,
    `SUMMARY:${s.title}`,
    `LOCATION:${s.online ? 'Onlayn (Zoom)' : `${s.place}, ${s.address}`}`,
    `DESCRIPTION:Ma'ruzachi: ${s.speaker}. Chipta: #${s.order}`,
    'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', `DESCRIPTION:${s.title}`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `StomaHub-${s.order}.ics`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function downloadCertificate(s, name) {
  const W = 1400
  const H = 990
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')
  const font = (w, px) => `${w} ${px}px Inter, "Segoe UI", Arial, sans-serif`
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, W, H)
  g.fillStyle = '#eef8f7'
  g.fillRect(0, 0, W, 16)
  g.strokeStyle = '#0b6d73'
  g.lineWidth = 6
  g.strokeRect(40, 40, W - 80, H - 80)
  g.strokeStyle = '#9fd3cb'
  g.lineWidth = 2
  g.strokeRect(58, 58, W - 116, H - 116)

  g.textAlign = 'center'
  g.fillStyle = '#0b6d73'
  g.font = font(800, 40)
  g.fillText('StomaHub', W / 2, 150)
  g.fillStyle = '#0d2a4a'
  g.font = font(800, 76)
  g.fillText('SERTIFIKAT', W / 2, 260)
  g.fillStyle = '#5b7280'
  g.font = font(400, 26)
  g.fillText('Ushbu sertifikat', W / 2, 330)
  g.fillStyle = '#0b6d73'
  g.font = font(700, 58)
  g.fillText(name, W / 2, 410)
  g.strokeStyle = '#d9e6e8'
  g.beginPath()
  g.moveTo(W / 2 - 320, 436)
  g.lineTo(W / 2 + 320, 436)
  g.stroke()
  g.fillStyle = '#5b7280'
  g.font = font(400, 26)
  g.fillText('quyidagi seminarda muvaffaqiyatli ishtirok etgani uchun berildi:', W / 2, 494)
  g.fillStyle = '#0d2a4a'
  g.font = font(800, 40)
  g.fillText(`“${s.title}”`, W / 2, 560)
  g.fillStyle = '#5b7280'
  g.font = font(500, 26)
  g.fillText(`${dateLabel(s).split(',')[0]} · ${s.online ? 'Onlayn' : s.place} · CME ${s.cme} ball`, W / 2, 612)

  g.textAlign = 'left'
  g.fillStyle = '#0d2a4a'
  g.font = font(700, 26)
  g.fillText(s.speaker, 150, 800)
  g.fillStyle = '#5b7280'
  g.font = font(400, 22)
  g.fillText(`Ma’ruzachi, ${s.role.toLowerCase()}`, 150, 834)
  g.strokeStyle = '#0d2a4a'
  g.lineWidth = 1.5
  g.beginPath()
  g.moveTo(150, 760)
  g.lineTo(470, 760)
  g.stroke()

  g.textAlign = 'right'
  g.fillStyle = '#0d2a4a'
  g.font = font(700, 26)
  g.fillText(`№ CERT-${s.order.replace('SEM-', '')}`, W - 150, 800)
  g.fillStyle = '#5b7280'
  g.font = font(400, 22)
  g.fillText('stomahub.uz/sertifikat', W - 150, 834)

  g.beginPath()
  g.arc(W / 2, 790, 70, 0, Math.PI * 2)
  g.fillStyle = '#0b6d73'
  g.fill()
  g.beginPath()
  g.arc(W / 2, 790, 58, 0, Math.PI * 2)
  g.strokeStyle = '#ffffff'
  g.lineWidth = 3
  g.stroke()
  g.textAlign = 'center'
  g.fillStyle = '#ffffff'
  g.font = font(800, 30)
  g.fillText(`CME ${s.cme}`, W / 2, 790)
  g.font = font(600, 16)
  g.fillText('TASDIQLANGAN', W / 2, 816)

  const blob = await new Promise((res) => c.toBlob(res, 'image/png'))
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `StomaHub-sertifikat-${s.order}.png`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function MobileSeminarlarim() {
  const profile = useProfile()
  const { upcoming, past } = useMySeminars()
  const [tab, setTab] = useState('upcoming')
  const [ticket, setTicket] = useState(null)
  const [added, setAdded] = useState(() => new Set())
  const [toast, setToast] = useState('')
  const closeToast = useCallback(() => setToast(''), [])
  const pastRef = useRef(null)
  const upRef = useRef(null)
  const lock = useRef(0)

  useEffect(() => { window.scrollTo(0, 0) }, [])
  useEffect(() => {
    const onScroll = () => {
      if (Date.now() < lock.current || !pastRef.current) return
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
      setTab(pastRef.current.getBoundingClientRect().top < 200 || atBottom ? 'past' : 'upcoming')
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const jump = (id) => {
    setTab(id)
    lock.current = Date.now() + 700
    const el = id === 'past' ? pastRef.current : upRef.current
    if (!el) return
    window.scrollTo({ top: id === 'upcoming' ? 0 : el.getBoundingClientRect().top + window.scrollY - 70, behavior: 'smooth' })
  }

  const addCal = (s) => {
    downloadIcs(s)
    setAdded((p) => new Set(p).add(s.key))
    setToast('Kalendar fayli yuklab olindi')
  }
  const cert = async (s) => {
    try {
      await downloadCertificate(s, profile.name)
      setToast('Sertifikat yuklab olindi')
    } catch {
      setToast('Sertifikatni yuklab bo‘lmadi')
    }
  }

  const tabs = [['upcoming', 'Kelgusi', CalendarDays, upcoming.length], ['past', 'O‘tgan', CircleCheck, past.length]]

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef8f7_0%,#f6faf9_28%,#f6faf9_100%)] pb-[86px]">
      <div className="px-3 pt-3">
        <SubTopBar title="Seminarlarim" subtitle="Ro‘yxatdan o‘tgan seminarlaringiz" />

        <div role="tablist" aria-label="Seminarlar" className="sticky top-0 z-20 -mx-3 mt-3 grid grid-cols-2 gap-2 bg-[#f1f9f8]/95 px-3 py-1.5 backdrop-blur">
          {tabs.map(([id, label, Icon, count]) => {
            const on = tab === id
            return (
              <button key={id} type="button" role="tab" aria-selected={on} disabled={!count} onClick={() => jump(id)} className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-[14px] font-medium transition disabled:opacity-50 ${on ? 'border-transparent bg-[#0b6d73] text-white shadow-[0_4px_12px_rgb(11_109_115/0.25)]' : `border-[#e2ebee] bg-white ${teal}`}`}>
                <Icon className="size-[18px]" strokeWidth={1.8} /> {label}
                <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-semibold ${on ? 'bg-white/20 text-white' : 'bg-[#e3f4f1] text-[#0b6d73]'}`}>{count}</span>
              </button>
            )
          })}
        </div>

        <section ref={upRef} aria-labelledby="sem-up">
          <h2 id="sem-up" className={`mt-3 text-[17px] font-bold ${navy}`}>Kelgusi seminarlar</h2>
          {upcoming.length ? (
            <div className="mt-2 flex flex-col gap-3">
              {upcoming.map((s) => (
                <SemCard key={s.key} s={s} past={false} inCal={added.has(s.key)} onTicket={() => setTicket(s)} onCal={() => addCal(s)} />
              ))}
            </div>
          ) : (
            <div className="mt-2 rounded-2xl border border-dashed border-[#cfe3e0] bg-white px-4 py-6 text-center">
              <CalendarDays className={`mx-auto size-8 ${teal}`} strokeWidth={1.5} />
              <p className={`mt-2 text-[14px] font-semibold ${navy}`}>Kelgusi seminarlar yo‘q</p>
              <p className="mt-0.5 text-[12px] text-muted">Yangi seminarlarga yoziling va chiptangiz shu yerda saqlanadi</p>
              <Link to="/seminarlar" className="mt-3 inline-flex h-10 items-center rounded-xl bg-[#0b6d73] px-4 text-[13px] font-semibold text-white">Seminarlarni ko‘rish</Link>
            </div>
          )}
        </section>

        {past.length > 0 && (
          <section ref={pastRef} aria-labelledby="sem-past">
            <h2 id="sem-past" className={`mt-5 text-[17px] font-bold ${navy}`}>O‘tgan seminarlar</h2>
            <div className="mt-2 flex flex-col gap-3">
              {past.map((s) => <SemCard key={s.key} s={s} past onTicket={() => setTicket(s)} onCert={() => cert(s)} />)}
            </div>
          </section>
        )}
      </div>

      {ticket && <TicketSheet s={ticket} profile={profile} past={atOf(ticket) < Date.now()} onClose={() => setTicket(null)} onToast={setToast} />}
      <MobileToast text={toast} onClose={closeToast} />
      <MobileTabBar />
    </div>
  )
}

function Line({ icon: Icon, a, b, nowrap }) {
  return (
    <div className="mt-2 flex items-center gap-2">
      <span className={`grid size-7 shrink-0 place-items-center rounded-full bg-[#eef6f6] ${teal}`}><Icon className="size-[15px]" strokeWidth={1.8} /></span>
      <span className="min-w-0">
        <span className={`block font-medium leading-tight ${navy} ${nowrap ? 'whitespace-nowrap text-[11.5px] tracking-[-0.01em]' : 'text-[12px]'}`}>{a}</span>
        {b && <span className="block truncate text-[10.5px] leading-tight text-[#7a8a9c]">{b}</span>}
      </span>
    </div>
  )
}

function SemCard({ s, past, inCal, onTicket, onCal, onCert }) {
  const partial = !past && s.months > 0
  const btn = 'flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-xl text-[12.5px] font-semibold active:scale-[0.98]'
  const solid = `${btn} bg-[#0b6d73] text-white`
  const outline = `${btn} border border-[#0b8a7a]/60 bg-white ${teal}`
  const media = (
    <span className="relative block h-[160px] w-[124px] shrink-0 overflow-hidden rounded-xl bg-[#eef4f4]">
      <img src={s.image} alt="" loading="lazy" className={`size-full object-cover ${s.pos}`} />
      <span className="absolute left-1.5 top-1.5 max-w-[calc(100%-12px)] truncate rounded-md bg-[#0b6d73] px-1.5 py-0.5 text-[10px] font-medium text-white">{s.cat}</span>
    </span>
  )
  return (
    <article className="rounded-2xl border border-[#e5eef0] bg-white p-3 shadow-[0_1px_6px_rgb(11_31_58/0.04)]">
      <div className="flex gap-3">
        {s.link ? <Link to={s.link} aria-label={s.title}>{media}</Link> : media}
        <div className="min-w-0 flex-1">
          <div className="flex justify-end">
            <span className={`flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[10.5px] font-medium ${partial ? 'bg-[#fff4e0] text-[#c77700]' : `bg-[#e3f4f1] ${teal}`}`}>
              <CircleCheck className={`size-3.5 ${partial ? '' : 'fill-[#0b6d73] text-white'}`} strokeWidth={2.4} />
              {past ? 'Tugallangan' : partial ? 'Qisman to‘langan' : 'To‘langan'}
            </span>
          </div>
          {s.link
            ? <Link to={s.link} className={`mt-1 line-clamp-2 block text-[14.5px] font-bold leading-tight ${navy}`}>{s.title}</Link>
            : <p className={`mt-1 line-clamp-2 text-[14.5px] font-bold leading-tight ${navy}`}>{s.title}</p>}
          <Line icon={UserRound} a={s.speaker} b={s.role} />
          <Line icon={CalendarDays} a={dateLabel(s)} nowrap />
          {s.online ? <Line icon={Video} a="Onlayn" /> : <Line icon={MapPin} a={s.place} b={s.address} />}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {past ? (
          <>
            <button type="button" onClick={onTicket} className={outline}><QrCode className="size-[17px] shrink-0" /> Chiptani ko‘rish</button>
            <button type="button" onClick={onCert} className={`${solid} text-[12px]`}><Download className="size-[17px] shrink-0" /> <span className="truncate">Sertifikatni yuklab olish</span></button>
          </>
        ) : (
          <>
            <button type="button" onClick={onTicket} className={solid}><QrCode className="size-[17px] shrink-0" /> Chiptani ko‘rish</button>
            <button type="button" onClick={onCal} aria-pressed={inCal} className={outline}>
              {inCal ? <CalendarCheck className="size-[17px] shrink-0" /> : <CalendarDays className="size-[17px] shrink-0" />} {inCal ? 'Kalendarda' : 'Kalendarga qo‘shish'}
            </button>
          </>
        )}
      </div>
    </article>
  )
}

function TicketSheet({ s, profile, past, onClose, onToast }) {
  const seed = `${s.order}-${s.key}-${profile.phone}`
  const download = async () => {
    try {
      await downloadTicket({
        s: { id: s.key, image: s.image, catName: s.cat, title: s.title, speaker: { name: s.speaker } },
        m: { whenFull: dateLabel(s) },
        reg: { order: s.order, phone: profile.phone, name: profile.name, plan: s.plan, price: s.price },
        place: s.online ? 'Onlayn (Zoom)' : s.place,
        methodLabel: s.months ? `${METHOD_LABEL.split} (${s.months} oy)` : METHOD_LABEL[s.method] || 'Click',
      })
      onToast('Chipta yuklab olindi')
    } catch {
      onToast('Chiptani yuklab bo‘lmadi')
    }
  }
  return (
    <BottomSheet
      title="Elektron chipta"
      onClose={onClose}
      footer={<button type="button" onClick={download} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0b6d73] text-[14px] font-semibold text-white"><Download className="size-[18px]" /> Chiptani yuklab olish</button>}
    >
      <div className="mt-1 overflow-hidden rounded-2xl border border-[#e2ebee]">
        <div className="flex gap-3 p-3">
          <img src={s.image} alt="" className={`h-[92px] w-[80px] shrink-0 rounded-xl object-cover ${s.pos}`} />
          <div className="min-w-0 flex-1">
            <span className="rounded-md bg-[#e3f4f1] px-1.5 py-0.5 text-[10px] font-medium text-[#0b6d73]">{s.cat}</span>
            <p className={`mt-1 line-clamp-2 text-[14px] font-bold leading-tight ${navy}`}>{s.title}</p>
            <p className="mt-1 truncate text-[11.5px] text-[#7a8a9c]">{s.speaker} · {s.role}</p>
          </div>
        </div>
        <div className="relative mx-3 border-t-2 border-dashed border-[#d9e6e8]">
          <span className="absolute -left-[22px] -top-[10px] size-[18px] rounded-full border border-[#e2ebee] bg-white" />
          <span className="absolute -right-[22px] -top-[10px] size-[18px] rounded-full border border-[#e2ebee] bg-white" />
        </div>
        <div className="flex flex-col items-center px-3 pb-3 pt-3">
          <div className={past ? 'opacity-40' : ''}><Qr seed={seed} className="size-[132px]" /></div>
          <span className="mt-1.5 rounded-md bg-[#e3f4f1] px-2 py-0.5 text-[12px] font-bold text-[#0b6d73]">#{s.order}</span>
          <p className="mt-1 text-center text-[11.5px] text-ink-2">
            {past ? 'Seminar yakunlangan · chipta arxivda saqlanadi' : s.online ? 'Zoom havolasi seminardan 1 soat oldin email va Telegram orqali yuboriladi' : 'Ro‘yxatdan o‘tishda QR kodni ko‘rsating'}
          </p>
        </div>
      </div>
      <dl className="mt-3 divide-y divide-[#eef2f4] rounded-xl bg-[#f6faf9] px-3 text-[12.5px]">
        {[
          [UserRound, 'Ishtirokchi', profile.name],
          [CalendarDays, 'Sana va vaqt', dateLabel(s)],
          [s.online ? Video : MapPin, 'Joy', s.online ? 'Onlayn (Zoom)' : `${s.place}`],
          [Ticket, 'Chipta turi', s.plan],
          [CircleCheck, 'To‘langan', s.months ? `${som(Math.round(s.price / s.months))} / oy` : som(s.price)],
        ].map(([Icon, k, v]) => (
          <div key={k} className="flex items-center gap-2.5 py-2.5">
            <Icon className={`size-4 shrink-0 ${teal}`} strokeWidth={1.8} />
            <dt className="flex-1 text-ink-2">{k}</dt>
            <dd className={`text-right font-semibold ${navy}`}>{v}</dd>
          </div>
        ))}
      </dl>
      {s.link && <Link to={s.link} className={`mt-3 block text-center text-[13px] font-semibold ${teal}`}>Seminar sahifasini ochish</Link>}
    </BottomSheet>
  )
}
