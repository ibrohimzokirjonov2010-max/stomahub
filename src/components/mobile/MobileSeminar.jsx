import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Bookmark, Share2, CalendarDays, Clock, MapPin, Tag, CalendarRange, ListChecks, Gift, BookOpen,
  Users, Coffee, FileBadge, Folder, ArrowRight, CircleCheck, CalendarPlus, Check, Ticket,
} from 'lucide-react'
import { seminarView, som } from '../../seminarsData'
import { publicRecord, useHub } from '../../hubStore'
import { MobileToast } from './parts'
import MobileTabBar from './MobileTabBar'
import { ToothIcon, BottomSheet } from './MobileSeminars'
import { useSeminarStore, toggleSaved } from './seminarStore'

const TABS = [
  ['about', 'Umumiy', CalendarRange],
  ['program', 'Dastur', ListChecks],
  ['includes', 'Narxga nimalar kiradi', Gift],
  ['venue', 'Manzil', MapPin],
]
const INCLUDES = [
  [BookOpen, 'Nazariy va amaliy darslar'],
  [ToothIcon, 'Amaliy mashg‘ulotlar'],
  [Users, 'Klinik case muhokamalari'],
  [Coffee, 'Kofe-breyk va tushlik'],
  [FileBadge, 'Sertifikat'],
  [Folder, 'Materiallar (slaydlar)'],
]
export default function MobileSeminar() {
  const { id } = useParams()
  return <SeminarView key={id} id={id} />
}

function SeminarView({ id }) {
  const hub = useHub()
  const rec = publicRecord(id, hub)
  const s = rec ? seminarView(rec) : null
  const navigate = useNavigate()
  const store = useSeminarStore()
  const reg = s ? store.registered[s.id] : null
  const saved = s ? store.saved.includes(s.id) : false
  const [tab, setTab] = useState('about')
  const [sheet, setSheet] = useState(null)
  const [toast, setToast] = useState('')
  const closeToast = useCallback(() => setToast(''), [])
  const refs = useRef({})
  // Tashkilotchi seminarlarida faqat u kiritgan bandlar; bo‘sh bo‘limlar yashiriladi
  const includes = s ? (s.includes ? s.includes.map((t) => [Check, t]) : INCLUDES) : []
  const tabs = TABS.filter(([k]) => (k !== 'program' || s?.program?.length) && (k !== 'includes' || includes.length))

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const onScroll = () => {
      let cur = 'about'
      for (const [key] of TABS) {
        const el = refs.current[key]
        if (el && el.getBoundingClientRect().top < 140) cur = key
      }
      setTab(cur)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!s) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-[16px] font-bold text-ink">Seminar topilmadi</p>
        <button type="button" onClick={() => navigate('/seminarlar')} className="mt-3 text-[13px] font-semibold text-sea">Seminarlarga qaytish</button>
      </div>
    )
  }

  const goTo = (key) => {
    setTab(key)
    const el = refs.current[key]
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 64, behavior: 'smooth' })
  }

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: s.title, url })
      else { await navigator.clipboard.writeText(url); setToast('Havola nusxalandi') }
    } catch { /* foydalanuvchi bekor qildi */ }
  }

  const addToCalendar = () => {
    downloadIcs(s)
    setToast('Kalendar fayli yuklab olindi')
  }

  return (
    <div className="min-h-screen bg-[#f6f9fb] pb-[150px]">
      {/* Hero */}
      <div className="relative h-[calc(300px+var(--safe-top))] overflow-hidden bg-[#0b4f55]">
        <img src={s.hero} alt="" className={`absolute inset-0 size-full object-cover ${s.id === 'implant-toj' ? '-scale-x-100' : ''}`} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b4f55]/10 via-[#0b4f55]/55 to-[#0b4f55]/95" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0b4f55]/60 to-transparent" />
        <button type="button" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/seminarlar'))} aria-label="Orqaga" className="safe-overlay-top absolute left-3.5 grid size-10 place-items-center rounded-full bg-white/95 text-ink shadow-[0_2px_8px_rgb(11_31_58/0.15)]">
          <ChevronLeft className="size-5" />
        </button>
        <div className="safe-overlay-top absolute right-3.5 flex gap-2">
          <button type="button" onClick={() => setToast(toggleSaved(s.id) ? 'Seminar saqlandi' : 'Saqlanganlardan olib tashlandi')} aria-label="Saqlash" aria-pressed={saved} className="grid size-10 place-items-center rounded-full bg-white/95 text-ink shadow-[0_2px_8px_rgb(11_31_58/0.15)]">
            <Bookmark className={`size-[18px] ${saved ? 'fill-sea text-sea' : ''}`} />
          </button>
          <button type="button" onClick={share} aria-label="Ulashish" className="grid size-10 place-items-center rounded-full bg-white/95 text-ink shadow-[0_2px_8px_rgb(11_31_58/0.15)]">
            <Share2 className="size-[18px]" />
          </button>
        </div>
        <div className="absolute bottom-9 right-3.5 w-[58%] text-white">
          <span className="ml-auto flex w-fit items-center gap-1 rounded-full bg-[#0b8a95] px-2.5 py-1 text-[10.5px] font-semibold">
            <ToothIcon className="size-3.5" /> {s.tag}
          </span>
          <h1 className="mt-2.5 text-[21px] font-extrabold leading-[1.15] tracking-tight">{s.title}</h1>
          <p className="mt-1.5 line-clamp-4 text-[11px] leading-snug text-white/85">{s.lead}</p>
        </div>
      </div>

      {/* Qisqa ma'lumot */}
      <div className="relative z-10 mx-3 -mt-6 flex justify-between divide-x divide-line rounded-2xl bg-white py-2.5 shadow-[0_4px_16px_rgb(11_31_58/0.1)]">
        <Info icon={CalendarDays}>{s.dateShort}<br />{s.monthKey.slice(0, 4)}</Info>
        <Info icon={Clock}>{s.time.replace(' – ', '–')}<br />{s.days > 1 ? `(${s.days} kun)` : s.hours}</Info>
        <Info icon={MapPin} wrap>{s.online ? 'Online (Zoom)' : <>{s.city},<br />{s.place}</>}</Info>
        <div className="flex items-start gap-1 px-1.5">
          <Tag className="mt-0.5 size-3.5 shrink-0 text-sea" strokeWidth={1.8} />
          <span className="min-w-0 leading-tight">
            <span className="block whitespace-nowrap text-[11px] font-bold text-ink">{som(s.price)}</span>
            {s.oldPrice > s.price && <span className="block whitespace-nowrap text-[9px] text-muted line-through">{som(s.oldPrice)}</span>}
            {s.off > 0 && <span className="mt-0.5 inline-block rounded-full bg-sea px-1.5 text-[9px] font-bold text-white">-{s.off}%</span>}
          </span>
        </div>
      </div>

      {/* Ma'ruzachi */}
      {!s.noSpeaker && (
      <button type="button" onClick={() => setSheet('speaker')} className="mx-3 mt-3 flex w-[calc(100%-24px)] items-center gap-3 rounded-2xl bg-white p-2.5 text-left shadow-[0_1px_4px_rgb(11_31_58/0.06)]">
        {s.speaker.avatar ? <img src={s.speaker.avatar} alt={s.speaker.name} className="h-[76px] w-[84px] shrink-0 rounded-xl object-cover" /> : <span className="grid h-[76px] w-[84px] shrink-0 place-items-center rounded-xl bg-[#e6f4f3] text-[26px] font-bold text-sea">{(s.speaker.name || '?').slice(0, 1)}</span>}
        <span className="min-w-0 flex-1">
          <span className="block text-[10.5px] text-muted">Ma’ruzachi</span>
          <span className="block text-[15px] font-bold text-[#0d3b44]">{s.speaker.name}</span>
          <span className="block text-[11px] text-ink-2">{s.speaker.role}</span>
          {s.speaker.bio && <span className="mt-0.5 line-clamp-2 block text-[10.5px] leading-snug text-muted">{s.speaker.bio}</span>}
        </span>
        <ChevronRight className="size-5 shrink-0 text-ink-2" />
      </button>
      )}

      {s.organizer && (s.speakersAll || []).length > 1 && (
        <div className="mx-3 mt-2 flex gap-2 overflow-x-auto no-scrollbar">
          {s.speakersAll.slice(1).map((sp) => (
            <div key={sp.name} className="flex w-[220px] shrink-0 items-center gap-2 rounded-2xl bg-white p-2">
              {sp.avatar ? <img src={sp.avatar} alt="" className="size-11 rounded-xl object-cover" /> : <span className="grid size-11 place-items-center rounded-xl bg-[#e6f4f3] font-bold text-sea">{sp.name.slice(0, 1)}</span>}
              <span className="min-w-0"><b className="block truncate text-[12.5px] text-ink">{sp.name}</b><span className="block truncate text-[10.5px] text-muted">{sp.role}</span></span>
            </div>
          ))}
        </div>
      )}

      {s.organizer && (s.galleryList || []).length > 0 && (
        <div className="mx-3 mt-2.5 flex gap-2 overflow-x-auto no-scrollbar" aria-label="Galereya">
          {s.galleryList.map((src) => <img key={src} src={src} alt="" className="h-[86px] w-[124px] shrink-0 rounded-xl object-cover" />)}
        </div>
      )}

      {/* Tablar */}
      <div className="sticky top-0 z-20 mt-3 overflow-x-auto bg-[#f6f9fb] px-3 py-2 backdrop-blur no-scrollbar">
        <div className="flex w-max gap-2">
          {tabs.map(([key, label, Icon]) => (
            <button key={key} type="button" onClick={() => goTo(key)} aria-current={tab === key ? 'true' : undefined} className={`flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[12px] font-medium transition ${tab === key ? 'bg-sea text-white shadow-[0_4px_12px_-4px_rgb(11_138_149/0.6)]' : 'border border-line bg-white text-ink'}`}>
              <Icon className="size-4" strokeWidth={1.7} /> {label}
            </button>
          ))}
        </div>
      </div>

      <section ref={(el) => { refs.current.about = el }} className="mx-3 mt-1 rounded-2xl bg-white p-3">
        <h2 className="text-[17px] font-bold text-[#0d3b44]">Seminar haqida</h2>
        <p className="mt-1 text-[12px] leading-[1.55] text-ink-2">{s.about}</p>
      </section>

      {s.program.length > 0 && <section ref={(el) => { refs.current.program = el }} className="mx-3 mt-2.5 rounded-2xl bg-white p-3">
        <h2 className="text-[17px] font-bold text-[#0d3b44]">Seminar dasturi</h2>
        <div className="mt-2 flex flex-col gap-3">
          {s.program.map((day) => (
            <div key={day.label} className="flex gap-3">
              <div className="flex h-[52px] w-[66px] shrink-0 flex-col items-center justify-center self-center rounded-xl bg-[#e6f4f3] text-sea-600">
                <span className="text-[13px] font-bold">{day.label}</span>
                <span className="text-[9.5px]">{day.date}</span>
              </div>
              <ol className="relative min-w-0 flex-1 border-l-2 border-sea/80 pl-3">
                {day.items.map(([t, text]) => (
                  <li key={t} className="relative flex gap-2 py-[3px] text-[10.5px] leading-snug">
                    <span className="absolute -left-[17px] top-[7px] size-2 rounded-full bg-sea ring-2 ring-white" />
                    <span className="w-[74px] shrink-0 whitespace-nowrap text-ink-2">{t}</span>
                    <span className="min-w-0 text-ink">{text}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>}

      {s.learn?.length > 0 && s.organizer && <section className="mx-3 mt-2.5 rounded-2xl bg-white p-3">
        <h2 className="text-[17px] font-bold text-[#0d3b44]">Nimalarni o‘rganasiz?</h2>
        <ul className="mt-1.5 space-y-1">{s.learn.map((t) => <li key={t} className="flex items-start gap-1.5 text-[12px] text-ink"><Check className="mt-0.5 size-3.5 shrink-0 text-sea" /> {t}</li>)}</ul>
      </section>}

      {s.audience?.length > 0 && <section className="mx-3 mt-2.5 rounded-2xl bg-white p-3">
        <h2 className="text-[17px] font-bold text-[#0d3b44]">Kimlar uchun?</h2>
        <div className="mt-1.5 flex flex-wrap gap-1.5">{s.audience.map((t) => <span key={t} className="rounded-full bg-[#f3f6fa] px-2.5 py-1 text-[11px] font-medium text-ink-2">{t}</span>)}</div>
      </section>}

      {(s.practice || s.liveSurgery || s.cmeLine) && <section className="mx-3 mt-2.5 rounded-2xl bg-white p-3">
        <h2 className="text-[17px] font-bold text-[#0d3b44]">Amaliyot va sertifikat</h2>
        <ul className="mt-1.5 space-y-1 text-[12px] text-ink">
          {s.practice && <li className="flex items-start gap-1.5"><Check className="mt-0.5 size-3.5 shrink-0 text-sea" /> {s.practice}</li>}
          {s.liveSurgery && <li className="flex items-start gap-1.5"><Check className="mt-0.5 size-3.5 shrink-0 text-sea" /> Jonli jarrohlik: {s.liveSurgery}</li>}
          {s.cmeLine && <li className="flex items-start gap-1.5"><Check className="mt-0.5 size-3.5 shrink-0 text-sea" /> Sertifikat: {s.cmeLine}</li>}
        </ul>
      </section>}

      {includes.length > 0 && <section ref={(el) => { refs.current.includes = el }} className="mx-3 mt-2.5 rounded-2xl bg-white p-3">
        <h2 className="text-[17px] font-bold text-[#0d3b44]">Narxga nimalar kiradi?</h2>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {includes.map(([Icon, label]) => (
            <div key={label} className="flex flex-col items-center gap-1 rounded-xl border border-[#d8eeec] bg-[#f3fafa] px-1 py-2 text-center">
              <Icon className="size-5 text-sea" strokeWidth={1.6} />
              <span className="text-[10px] leading-tight text-ink-2">{label}</span>
            </div>
          ))}
        </div>
      </section>}

      {s.refundPolicy && <section className="mx-3 mt-2.5 rounded-2xl bg-white p-3">
        <h2 className="text-[17px] font-bold text-[#0d3b44]">Bekor qilish va qaytarish</h2>
        <p className="mt-1 whitespace-pre-line text-[12px] leading-[1.55] text-ink-2">{s.refundPolicy}</p>
      </section>}

      <section ref={(el) => { refs.current.venue = el }} className="mx-3 mt-2.5 rounded-2xl bg-white p-3">
        <h2 className="text-[17px] font-bold text-[#0d3b44]">Manzil</h2>
        <a href={s.venue.map} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2.5">
          <MapPin className="size-5 shrink-0 text-ink-2" strokeWidth={1.7} />
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-bold text-ink">{s.online ? 'Online (Zoom)' : s.venue.name}</span>
            <span className="block text-[11px] text-muted">{s.online ? 'Havola ro‘yxatdan o‘tgach yuboriladi' : s.venue.address}</span>
          </span>
          {s.organizer ? (s.venue.image && !s.online && <img src={s.venue.image} alt="" className="h-[64px] w-[118px] shrink-0 rounded-xl object-cover" />) : <MapArt className="h-[64px] w-[118px] shrink-0 rounded-xl" />}
          <ChevronRight className="size-4 shrink-0 text-ink-2" />
        </a>
        {s.organizer && !s.online && (s.venue.notes || []).length > 0 && (
          <ul className="mt-2 space-y-1">{s.venue.notes.map((t) => <li key={t} className="flex items-start gap-1.5 text-[11.5px] text-ink-2"><Check className="mt-0.5 size-3.5 shrink-0 text-sea" /> {t}</li>)}</ul>
        )}
      </section>

      {s.organizer && (s.faqList || []).length > 0 && (
        <section className="mx-3 mt-2.5 rounded-2xl bg-white p-3">
          <h2 className="text-[17px] font-bold text-[#0d3b44]">Savol-javob</h2>
          {s.faqList.map((r) => (
            <details key={r.q} className="border-b border-line py-2 last:border-0">
              <summary className="cursor-pointer text-[12.5px] font-semibold text-ink">{r.q}</summary>
              <p className="mt-1 whitespace-pre-line text-[12px] leading-[1.5] text-ink-2">{r.a}</p>
            </details>
          ))}
        </section>
      )}

      {s.organizer && (s.orgName || s.contact?.phone || s.contact?.telegram) && (
        <section className="mx-3 mt-2.5 rounded-2xl bg-white p-3">
          <h2 className="text-[17px] font-bold text-[#0d3b44]">Tashkilotchi</h2>
          {s.orgName && <p className="mt-1 text-[13px] font-semibold text-ink">{s.orgName}</p>}
          {s.contact?.phone && <a href={`tel:${s.contact.phone.replace(/[^\d+]/g, '')}`} className="mt-0.5 block text-[12px] text-ink-2">{s.contact.phone}</a>}
          {s.contact?.telegram && <a href={/^https?:/.test(s.contact.telegram) ? s.contact.telegram : `https://t.me/${s.contact.telegram.replace(/^@/, '')}`} target="_blank" rel="noreferrer" className="mt-0.5 block text-[12px] font-semibold text-sea">Telegram: {s.contact.telegram}</a>}
        </section>
      )}

      {/* Pastki panel */}
      <div className="app-action-bar fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-white px-3.5 py-2.5 shadow-[0_-6px_18px_rgb(11_31_58/0.06)]">
        {reg ? (
          <>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 text-[14px] font-bold text-ok"><CircleCheck className="size-4" /> Ro‘yxatdan o‘tgansiz</p>
              <p className="truncate text-[11.5px] text-muted">{reg.plan} · {s.dateShort}</p>
            </div>
            {reg.order ? (
              <button type="button" onClick={() => navigate(`/seminarlar/${s.id}/royxat`)} className="flex h-12 items-center gap-2 rounded-xl bg-sea px-4 text-[13.5px] font-semibold text-white">
                <Ticket className="size-[18px]" /> Chipta
              </button>
            ) : (
              <button type="button" onClick={addToCalendar} className="flex h-12 items-center gap-2 rounded-xl bg-[#e6f4f3] px-4 text-[13.5px] font-semibold text-sea-600">
                <CalendarPlus className="size-[18px]" /> Kalendarga
              </button>
            )}
          </>
        ) : (
          <>
            <div className="min-w-0">
              <p className="whitespace-nowrap text-[18px] font-extrabold leading-tight text-[#0d3b44]">{som(s.price)}</p>
              {s.oldPrice > s.price && <p className="flex items-center gap-1.5 text-[11.5px]">
                <span className="text-muted line-through">{som(s.oldPrice)}</span>
                <span className="rounded-md bg-sale px-1.5 font-bold text-white">-{s.off}%</span>
              </p>}
            </div>
            <button type="button" disabled={s.cancelled || s.regClosed} onClick={() => { if (!s.cancelled && !s.regClosed) navigate(`/seminarlar/${s.id}/royxat`) }} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-sea text-[14.5px] font-semibold text-white shadow-[0_6px_16px_rgb(11_138_149/0.3)] active:scale-[0.98] disabled:bg-[#fde8e8] disabled:text-[#dc2626] disabled:shadow-none">
              {s.regClosed ? 'Yakunlangan — ro‘yxat yopiq' : s.cancelled ? 'Bekor qilingan' : 'Ro‘yxatdan o‘tish'} {!s.cancelled && !s.regClosed && <ArrowRight className="size-[18px]" />}
            </button>
          </>
        )}
      </div>

      {sheet === 'speaker' && (
        <BottomSheet title="Ma’ruzachi" onClose={() => setSheet(null)}>
          <div className="mt-2 flex items-center gap-3">
            {s.speaker.avatar && <img src={s.speaker.avatar} alt="" className="size-16 rounded-2xl object-cover" />}
            <div>
              <p className="text-[16px] font-bold text-ink">{s.speaker.name}</p>
              <p className="text-[12px] text-ink-2">{s.speaker.role}</p>
              {s.speaker.rating > 0 && <p className="mt-0.5 text-[11.5px] text-muted">★ {s.speaker.rating} · {s.speaker.reviews} ta sharh</p>}
            </div>
          </div>
          <ul className="mt-3 space-y-2">
            {s.speaker.lines.map((l) => (
              <li key={l} className="flex items-center gap-2 text-[13px] text-ink"><Check className="size-4 text-sea" /> {l}</li>
            ))}
          </ul>
          {s.organizer && s.speaker.bio && <p className="mt-3 whitespace-pre-line text-[12.5px] leading-[1.55] text-ink-2">{s.speaker.bio}</p>}
        </BottomSheet>
      )}

      <MobileToast text={toast} onClose={closeToast} bottom={140} />
      <MobileTabBar />
    </div>
  )
}

function Info({ icon: Icon, children, wrap = false }) {
  return (
    <div className={`flex items-start gap-1 px-1.5 ${wrap ? 'min-w-0 flex-1' : 'shrink-0'}`}>
      <Icon className="mt-0.5 size-3.5 shrink-0 text-sea" strokeWidth={1.8} />
      <span className={`min-w-0 text-[10px] leading-tight text-ink ${wrap ? '' : 'whitespace-nowrap'}`}>{children}</span>
    </div>
  )
}

function MapArt({ className }) {
  return (
    <svg viewBox="0 0 118 64" className={className} aria-hidden="true">
      <rect width="118" height="64" fill="#e8eef0" />
      <path d="M0 40 C 30 34, 50 46, 118 30" stroke="#fff" strokeWidth="5" fill="none" />
      <path d="M38 0 L 52 64" stroke="#fff" strokeWidth="4" />
      <path d="M86 0 L 78 64" stroke="#fff" strokeWidth="3" />
      <path d="M0 14 L 118 20" stroke="#fff" strokeWidth="2.5" />
      <rect x="6" y="46" width="22" height="12" rx="2" fill="#d5e7dc" />
      <rect x="92" y="38" width="20" height="18" rx="2" fill="#d5e7dc" />
      <rect x="58" y="4" width="18" height="10" rx="2" fill="#dde3e8" />
      <circle cx="64" cy="31" r="11" fill="#0b8a95" opacity="0.15" />
      <path d="M64 21 c-4.4 0 -7.5 3.2 -7.5 7.3 c0 5.2 7.5 12.2 7.5 12.2 s7.5 -7 7.5 -12.2 c0 -4.1 -3.1 -7.3 -7.5 -7.3z" fill="#0b8a95" />
      <circle cx="64" cy="28.5" r="2.6" fill="#fff" />
    </svg>
  )
}

export function downloadIcs(s) {
  const [y, m] = s.monthKey.split('-')
  const [from, to] = s.time.split('–').map((t) => t.trim().replace(':', ''))
  const day = String(s.day).padStart(2, '0')
  const endDay = String(Number(s.day) + s.days - 1).padStart(2, '0')
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//StomaHub//Seminar//UZ', 'BEGIN:VEVENT',
    `UID:${s.id}@stomahub.uz`,
    `DTSTART:${y}${m}${day}T${from}00`,
    `DTEND:${y}${m}${endDay}T${to}00`,
    `SUMMARY:${s.title}`,
    `LOCATION:${s.placeLabel}`,
    `DESCRIPTION:Ma'ruzachi: ${s.speaker.name}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${s.id}.ics`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
