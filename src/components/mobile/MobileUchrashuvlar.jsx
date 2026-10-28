import { useCallback, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { CalendarDays, CalendarClock, ChevronLeft, ChevronRight, FileText, MessageCircle, MoreVertical, Phone, Plus, Send, Trash2, UserRound } from 'lucide-react'
import { useBemorlar } from '../../bemorData'
import { MONTHS, doctors, isoOf, minutes, parts, setVisits, shift, todayIso, useVisits } from '../../uchrashuvData'
import { MobileToast } from './parts'
import MobileTabBar from './MobileTabBar'
import { BottomSheet, ToothIcon } from './MobileSeminars'
import { HubTopBar } from './MobileKategoriyalar'
import { Face } from './bemorParts'

export const DAY_SHORT = ['Dsh', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak']
const DAY_LONG = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba']
export const MON_SHORT = ['yan', 'fev', 'mar', 'apr', 'may', 'iyun', 'iyul', 'avg', 'sen', 'okt', 'noy', 'dek']
export const MST = {
  tasdiq: ['Kelmoqda', 'bg-[#e6f8ec] text-[#1c9a52]'],
  kutil: ['Kutilmoqda', 'bg-[#e6f4f3] text-[#0b6d73]'],
  davol: ['Davolanmoqda', 'bg-[#fff1e6] text-[#e07a2e]'],
  yakun: ['Bajarildi', 'bg-[#eef1f5] text-[#6b7a90]'],
  bekor: ['Bekor qilindi', 'bg-[#ffecee] text-[#e0475b]'],
}
const TABS = [
  ['all', 'Barchasi', () => true],
  ['come', 'Keladigan', (v) => v.status === 'tasdiq' || v.status === 'davol'],
  ['wait', 'Kutilayotgan', (v) => v.status === 'kutil'],
  ['done', 'Bajarildi', (v) => v.status === 'yakun'],
]

export const dow = (iso) => {
  const { y, m, d } = parts(iso)
  return (new Date(y, m - 1, d).getDay() + 6) % 7
}
export const weekOf = (iso) => {
  const start = shift(iso, -dow(iso))
  return Array.from({ length: 7 }, (_, i) => shift(start, i))
}
export const docName = (id) => doctors.find((d) => d.id === id)?.name || ''
export const patientOf = (v, all) => (v.patientId && all.find((p) => p.id === v.patientId)) || all.find((p) => p.name === v.name) || null
export const nowMinutes = () => {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}
export const shortDate = (iso) => {
  const { d, m } = parts(iso)
  return `${d} ${MON_SHORT[m - 1]}`
}

const TODAY = todayIso()
const dayTitle = (iso) => {
  const { d, m } = parts(iso)
  const tail = `${d} ${MONTHS[m - 1]}`
  if (iso === TODAY) return `Bugun, ${tail}`
  if (iso === shift(TODAY, 1)) return `Ertaga, ${tail}`
  if (iso === shift(TODAY, -1)) return `Kecha, ${tail}`
  return `${DAY_LONG[dow(iso)]}, ${tail}`
}

export default function MobileUchrashuvlar() {
  const visits = useVisits()
  const patients = useBemorlar()
  const navigate = useNavigate()
  const location = useLocation()
  const [date, setDate] = useState(() => location.state?.date || TODAY)
  const [tab, setTab] = useState('all')
  const [sheet, setSheet] = useState(null)
  const [toast, setToast] = useState(() => location.state?.toast || '')
  const [undo, setUndo] = useState(null)
  const closeToast = useCallback(() => { setToast(''); setUndo(null) }, [])

  const day = useMemo(() => visits.filter((v) => v.date === date).sort((a, b) => minutes(a.start) - minutes(b.start)), [visits, date])
  const rows = day.filter(TABS.find((t) => t[0] === tab)[2])
  const live = date === TODAY ? nowMinutes() : date < TODAY ? Infinity : -1
  const current = day.find((v) => v.status !== 'yakun' && v.status !== 'bekor' && minutes(v.start) + v.dur > live)?.id
  const timeline = rows

  const setStatus = (v, s) => {
    setVisits((list) => list.map((x) => (x.id === v.id ? { ...x, status: s } : x)))
    setSheet(null)
    setToast(`${v.name}: ${MST[s][0]}`)
  }
  const remove = (v) => {
    setVisits((list) => list.filter((x) => x.id !== v.id))
    setSheet(null)
    setUndo(() => () => setVisits((list) => [...list, v]))
    setToast('Uchrashuv o‘chirildi')
  }
  const call = (v, p) => {
    const phone = v.phone || p?.phone
    if (phone) window.location.href = `tel:${phone.replace(/\s/g, '')}`
    else setToast('Bemorning telefon raqami kiritilmagan')
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef8f7_0%,#f6faf9_40%,#f6faf9_100%)] pb-[86px]">
      <div className="px-3.5 pt-3">
        <HubTopBar onBell={() => setToast('Yangi bildirishnomalar yo‘q')} />
        <div className="mt-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-[27px] font-extrabold leading-tight tracking-tight text-[#0d2a4a]">Uchrashuvlar</h1>
            <p className="text-[12.5px] text-[#7d8fa9]">Bemorlar uchrashuvlarini boshqaring</p>
          </div>
          <button type="button" onClick={() => setSheet('calendar')} className="mt-1 flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-line/70 bg-white px-3 text-[12.5px] font-medium text-ink">
            <CalendarDays className="size-4 text-sea" /> Kalendar
          </button>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1.5">
          {weekOf(date).map((iso, i) => {
            const on = iso === date
            const { d, m } = parts(iso)
            return (
              <button key={iso} type="button" aria-pressed={on} onClick={() => setDate(iso)} className={`flex h-[64px] flex-col items-center justify-center rounded-xl border text-center transition ${on ? 'border-[#0b6d73] bg-[#0b6d73] text-white shadow-[0_4px_10px_rgb(11_109_115/0.3)]' : 'border-line/70 bg-white text-ink'}`}>
                <span className={`text-[10.5px] ${on ? 'text-white/85' : 'text-ink-2'}`}>{DAY_SHORT[i]}</span>
                <b className="text-[16px] font-bold leading-tight">{d}</b>
                <span className={`text-[10.5px] capitalize ${on ? 'text-white/85' : 'text-ink-2'}`}>{MON_SHORT[m - 1]}</span>
                {iso === TODAY && !on && <span className="mt-0.5 size-1 rounded-full bg-sea" />}
              </button>
            )
          })}
        </div>

        <div className="-mx-3.5 mt-3 flex gap-1.5 overflow-x-auto px-3.5 no-scrollbar">
          {TABS.map(([k, l, fn]) => {
            const on = tab === k
            return (
              <button key={k} type="button" aria-pressed={on} onClick={() => setTab(k)} className={`h-9 flex-auto shrink-0 whitespace-nowrap rounded-xl border px-2 text-[11px] font-medium transition ${on ? 'border-[#0b6d73] bg-[#0b6d73] text-white' : 'border-line/70 bg-white text-ink'}`}>
                {l} ({day.filter(fn).length})
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <h2 className="text-[16px] font-extrabold text-[#0d2a4a]">{dayTitle(date)}</h2>
          <span className="text-[12px] font-medium text-[#7d8fa9]">{rows.length} ta uchrashuv</span>
        </div>
      </div>

      {timeline.length ? (
        <div className="relative mt-2 flex flex-col gap-2.5 px-3.5">
          <span className="absolute bottom-0 left-[62px] top-3 w-0.5 bg-[#cfe6e4]" />
          {timeline.map((v) => (
            <div key={v.id} className="flex gap-2">
              <div className="relative w-[50px] shrink-0 pt-3">
                <b className={`text-[13.5px] font-bold ${v.status === 'bekor' ? 'text-muted line-through' : 'text-[#0b6d73]'}`}>{v.start}</b>
                <span className={`absolute right-[-5px] top-[15px] size-3 rounded-full border-2 border-[#0b6d73] ${v.id === current ? 'bg-[#0b6d73] ring-[3px] ring-[#cfe6e4]' : v.status === 'yakun' ? 'bg-[#0b6d73]/25' : 'bg-white'}`} />
              </div>
              <VisitCard v={v} p={patientOf(v, patients)} onMenu={() => setSheet({ menu: v })} onChat={() => { const ph = v.phone || patientOf(v, patients)?.phone; if (ph) setSheet({ sms: v }); else setToast('Bemorning telefon raqami kiritilmagan') }} onCall={call} />
            </div>
          ))}
        </div>
      ) : (
        <div className="mx-3.5 mt-2 rounded-2xl bg-white px-6 py-10 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#e6f4f3] text-[#0b6d73]"><CalendarClock className="size-7" strokeWidth={1.6} /></span>
          <p className="mt-3 text-[14px] font-semibold text-ink">{day.length ? 'Bu bo‘limda uchrashuv yo‘q' : visits.length ? 'Bu kunga uchrashuv yo‘q' : 'Hali uchrashuvlar yo‘q'}</p>
          <p className="mt-1 text-[12px] text-muted">{day.length ? 'Boshqa bo‘limni tanlang' : 'Yangi uchrashuv belgilashingiz mumkin'}</p>
          {date >= TODAY && <button type="button" onClick={() => navigate('/uchrashuvlar/yangi', { state: { date } })} className="mt-3 h-9 rounded-xl bg-sea-50 px-4 text-[12.5px] font-semibold text-sea">Uchrashuv qo‘shish</button>}
        </div>
      )}

      <button type="button" onClick={() => navigate('/uchrashuvlar/yangi', { state: { date: date >= TODAY ? date : TODAY } })} className="fixed bottom-[76px] right-3.5 z-30 flex h-12 items-center gap-2 rounded-full bg-[#0b6d73] pl-4 pr-5 text-[14px] font-semibold text-white shadow-[0_8px_20px_rgb(11_109_115/0.4)] active:scale-95">
        <Plus className="size-5" /> Uchrashuv
      </button>

      {sheet === 'calendar' && <CalendarSheet value={date} visits={visits} onClose={() => setSheet(null)} onPick={(iso) => { setDate(iso); setSheet(null) }} />}
      {sheet?.menu && (
        <MenuSheet
          v={sheet.menu}
          p={patientOf(sheet.menu, patients)}
          onClose={() => setSheet(null)}
          onStatus={(s) => setStatus(sheet.menu, s)}
          onSms={() => setSheet({ sms: sheet.menu })}
          onRemove={() => remove(sheet.menu)}
        />
      )}
      {sheet?.sms && <SmsSheet v={sheet.sms} onClose={() => setSheet(null)} phone={sheet.sms.phone || patientOf(sheet.sms, patients)?.phone || ''} onSent={(text) => { const ph = (sheet.sms.phone || patientOf(sheet.sms, patients)?.phone || '').replace(/[^\d+]/g, ''); setSheet(null); if (!ph) { setToast('Bemorning telefon raqami kiritilmagan'); return } window.location.href = `sms:${ph}?body=${encodeURIComponent(text)}` }} />}

      <MobileToast text={toast} onClose={closeToast} action={undo && <button type="button" onClick={() => { undo(); closeToast() }} className="shrink-0 text-[13px] font-semibold text-[#5fe0c8]">Qaytarish</button>} />
      <MobileTabBar />
    </div>
  )
}

function VisitCard({ v, p, onMenu, onChat, onCall }) {
  const [label, cls] = MST[v.status] || MST.tasdiq
  const face = { name: v.name, photo: v.photo || p?.photo }
  const head = <Face p={face} className="size-[48px]" text="text-[14px]" />
  const line = 'flex min-w-0 items-center gap-1.5 text-[11px] text-ink-2'
  const btn = 'grid size-9 place-items-center rounded-full bg-[#e6f4f3] text-[#0b6d73]'
  return (
    <article className={`relative min-w-0 flex-1 rounded-2xl bg-white py-2.5 pl-2.5 pr-2 shadow-[0_1px_4px_rgb(11_31_58/0.06)] ${v.status === 'bekor' ? 'opacity-70' : ''}`}>
      <div className="flex gap-2.5">
        {p ? <Link to={`/bemorlar/${p.id}`} className="h-fit shrink-0">{head}</Link> : <span className="h-fit shrink-0">{head}</span>}
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1.5 pr-5">
            {p ? (
              <Link to={`/bemorlar/${p.id}`} className="min-w-0 flex-1 truncate text-[13.5px] font-bold leading-tight text-[#0d2a4a]">{v.name}</Link>
            ) : (
              <h3 className="min-w-0 flex-1 truncate text-[13.5px] font-bold leading-tight text-[#0d2a4a]">{v.name}</h3>
            )}
            <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${cls}`}>{label}</span>
          </div>
          <p className="mt-0.5 truncate text-[11.5px] text-[#5e88a0]">{v.detail || v.service}</p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className={line}>
                <UserRound className="size-3.5 shrink-0 text-muted" strokeWidth={1.7} />
                <span className="truncate">{p ? <>{p.age} <span className="mx-1 text-line">|</span> {p.gender}</> : `${v.dur} daqiqa`}</span>
              </span>
              <span className={line}><ToothIcon className="size-3.5 shrink-0 text-muted" strokeWidth={1.7} /><span className="truncate">{v.info || `${docName(v.doctor)} · ${v.room}`}</span></span>
            </div>
            <button type="button" onClick={onChat} aria-label={`${v.name}ga xabar`} className={btn}><MessageCircle className="size-[17px]" /></button>
            <button type="button" onClick={() => onCall(v, p)} aria-label={`${v.name}ga qo‘ng‘iroq`} className={btn}><Phone className="size-[17px]" /></button>
          </div>
          {v.note && <span className={`${line} mt-1`}><FileText className="size-3.5 shrink-0 text-muted" strokeWidth={1.7} /><span className="truncate">Izoh: {v.note}</span></span>}
        </div>
      </div>
      <button type="button" onClick={onMenu} aria-label="Amallar" className="absolute right-1 top-2 grid size-7 place-items-center text-ink-2"><MoreVertical className="size-4" /></button>
    </article>
  )
}

function CalendarSheet({ value, visits, onClose, onPick }) {
  const [cur, setCur] = useState(() => value.slice(0, 8) + '01')
  const { y, m } = parts(cur)
  const lead = dow(cur)
  const count = new Date(y, m, 0).getDate()
  const per = useMemo(() => visits.reduce((acc, v) => ((acc[v.date] = (acc[v.date] || 0) + 1), acc), {}), [visits])
  const move = (n) => setCur(isoOf(m + n === 0 ? y - 1 : m + n === 13 ? y + 1 : y, ((m + n + 11) % 12) + 1, 1))
  return (
    <BottomSheet title="Kalendar" onClose={onClose}>
      <div className="mt-2 flex items-center justify-between">
        <button type="button" onClick={() => move(-1)} aria-label="Oldingi oy" className="grid size-9 place-items-center rounded-full bg-page text-ink"><ChevronLeft className="size-5" /></button>
        <b className="text-[15px] font-bold capitalize text-ink">{MONTHS[m - 1]} {y}</b>
        <button type="button" onClick={() => move(1)} aria-label="Keyingi oy" className="grid size-9 place-items-center rounded-full bg-page text-ink"><ChevronRight className="size-5" /></button>
      </div>
      <div className="mt-3 grid grid-cols-7 text-center text-[11px] font-medium text-muted">{DAY_SHORT.map((d) => <span key={d}>{d}</span>)}</div>
      <div className="mt-1 grid grid-cols-7 gap-1 pb-2">
        {Array.from({ length: lead }, (_, i) => <span key={`e${i}`} />)}
        {Array.from({ length: count }, (_, i) => {
          const iso = isoOf(y, m, i + 1)
          const on = iso === value
          const n = per[iso] || 0
          return (
            <button key={iso} type="button" onClick={() => onPick(iso)} className={`flex h-12 flex-col items-center justify-center rounded-xl text-[13.5px] font-semibold ${on ? 'bg-[#0b6d73] text-white' : iso === TODAY ? 'bg-[#e6f4f3] text-[#0b6d73]' : 'text-ink'}`}>
              {i + 1}
              <span className={`mt-0.5 h-3 text-[9.5px] font-medium ${on ? 'text-white/85' : 'text-sea'}`}>{n ? `${n} ta` : ''}</span>
            </button>
          )
        })}
      </div>
      <button type="button" onClick={() => onPick(TODAY)} className="mb-2 h-11 w-full rounded-xl bg-[#e6f4f3] text-[13.5px] font-semibold text-[#0b6d73]">Bugunga qaytish</button>
    </BottomSheet>
  )
}

function MenuSheet({ v, p, onClose, onStatus, onSms, onRemove }) {
  const navigate = useNavigate()
  const [confirm, setConfirm] = useState(false)
  const row = 'flex h-12 w-full items-center gap-3 rounded-xl px-2 text-[14px] font-medium text-ink active:bg-page'
  return (
    <BottomSheet title={v.name} onClose={onClose}>
      <p className="-mt-0.5 text-[12.5px] text-muted">{shortDate(v.date)}, {v.start} · {v.dur} daqiqa · {docName(v.doctor)} · {v.room}</p>
      <div className="mt-2 flex flex-col pb-2">
        {p && <button type="button" onClick={() => navigate(`/bemorlar/${p.id}`)} className={row}><UserRound className="size-5 text-sea" /> Bemor profili</button>}
        <button type="button" onClick={() => navigate('/uchrashuvlar/yangi', { state: { edit: v.id } })} className={row}><CalendarClock className="size-5 text-sea" /> Vaqtini o‘zgartirish</button>
        <button type="button" onClick={onSms} className={row}><MessageCircle className="size-5 text-sea" /> SMS eslatma yuborish</button>
        <p className="mt-2 px-2 text-[12.5px] font-semibold text-muted">Holat</p>
        <div className="mt-2 flex flex-wrap gap-2 px-2">
          {Object.entries(MST).map(([k, [l, c]]) => <button key={k} type="button" aria-pressed={v.status === k} onClick={() => onStatus(k)} className={`h-9 rounded-xl px-3 text-[12.5px] font-semibold ${v.status === k ? 'ring-2 ring-sea' : ''} ${c}`}>{l}</button>)}
        </div>
        {confirm ? (
          <div className="mt-3 flex gap-2 px-2">
            <button type="button" onClick={() => setConfirm(false)} className="h-11 flex-1 rounded-xl border border-line text-[13.5px] font-semibold text-ink">Bekor qilish</button>
            <button type="button" onClick={onRemove} className="h-11 flex-1 rounded-xl bg-sale text-[13.5px] font-semibold text-white">Ha, o‘chirish</button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirm(true)} className={`${row} mt-2 text-sale`}><Trash2 className="size-5" /> Uchrashuvni o‘chirish</button>
        )}
      </div>
    </BottomSheet>
  )
}

function SmsSheet({ v, phone, onClose, onSent }) {
  const when = `${v.date === TODAY ? 'bugun' : shortDate(v.date)} soat ${v.start}`
  const quick = [
    `Hurmatli ${v.name}, ${when} da qabulingiz bor. Kutib qolamiz!`,
    'Iltimos, qabulga 10 daqiqa oldin keling.',
    'Qabul vaqtini o‘zgartirish kerak, iltimos qo‘ng‘iroq qiling.',
  ]
  const [text, setText] = useState(quick[0])
  return (
    <BottomSheet
      title="SMS yuborish"
      onClose={onClose}
      footer={<button type="button" disabled={!text.trim() || !phone} onClick={() => onSent(text)} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0b6d73] text-[14px] font-semibold text-white disabled:opacity-40"><Send className="size-[18px]" /> Yuborish</button>}
    >
      <div className="mt-2 flex items-center gap-3 rounded-2xl bg-[#f2f8f8] p-3">
        <Face p={v} className="size-11" text="text-[13px]" />
        <div className="min-w-0">
          <p className="truncate text-[14px] font-bold text-ink">{v.name}</p>
          <p className="text-[12px] text-muted">{phone || 'Telefon kiritilmagan'} · {shortDate(v.date)}, {v.start}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {quick.map((x) => <button key={x} type="button" aria-pressed={text === x} onClick={() => setText(x)} className={`rounded-xl border px-3 py-2 text-left text-[12.5px] ${text === x ? 'border-sea bg-sea-50 text-sea' : 'border-line text-ink-2'}`}>{x}</button>)}
      </div>
      <textarea value={text} maxLength={300} onChange={(e) => setText(e.target.value)} rows={3} className="mb-1 mt-3 w-full resize-none rounded-xl border border-line px-3 py-2.5 text-[13.5px] text-ink outline-none focus:border-sea" />
      <p className="mb-2 text-right text-[11px] text-muted">{text.length}/300</p>
    </BottomSheet>
  )
}
