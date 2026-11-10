import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, ChevronDown, Bookmark, Share2, CalendarDays, MapPin, Wallet, ArrowRight, Check, CircleCheck, Ticket,
  LayoutGrid, ListChecks, Target, Layers, MessageCircle, BookOpen, Users, Gift, RotateCcw, Send, Phone, FileText, CreditCard, BadgeCheck, User, Clock, Award, Package, Pencil,
} from 'lucide-react'
import { buildSeminarPage, som } from '../../seminarsData'
import { publicRecord, publicRecords, useHub } from '../../hubStore'
import { detail } from '../../pages/Seminar'
import { dateRangeLabel, dayCount } from '../../programDays'
import { IMG } from '../../organizer/data'
import { splitAddress, joinAddress, telegramHandle, formatPhone } from '../../seminarAddress'
import { MobileToast } from './parts'
import { useSeminarStore, toggleSaved } from './seminarStore'
import { useSession } from '../../sessionStore'
import Lightbox from '../Lightbox'
import SpeakerProfileSheet from '../SpeakerProfileSheet'
import { findSpeakerDoctorHref, seminarsBySpeaker } from '../../seminarSpeaker'
import { DOCTORS } from '../../mutaxassislarData'

const PLACEHOLDERS = new Set(Object.values(IMG))
const TEAL = '#0F766E'

/** Tavsifni bir xil matnlardan tozalash (subtitle/description takrorlansa bir marta ko‘rsatiladi). */
const norm = (t) => String(t || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
export function dedupeTexts(list) {
  const out = []
  for (const raw of list) {
    const t = String(raw || '').trim()
    if (!t) continue
    const n = norm(t)
    if (out.some((o) => norm(o).includes(n))) continue
    for (let i = out.length - 1; i >= 0; i--) if (n.includes(norm(out[i]))) out.splice(i, 1)
    out.push(t)
  }
  return out
}

/** Xarita havolasi: hech qachon xom URL ko‘rsatilmaydi, utm_* parametrlari olib tashlanadi. */
export function cleanMapUrl(url) {
  try {
    const u = new URL(url)
    for (const k of [...u.searchParams.keys()]) if (/^utm_/i.test(k)) u.searchParams.delete(k)
    return u.toString()
  } catch { return '' }
}
const isUrl = (t) => /^https?:\/\//i.test(String(t || '').trim())

export default function MobileSeminarV2() {
  const { id } = useParams()
  return <Page key={id} id={id} />
}

function Page({ id }) {
  const hub = useHub()
  const rec = publicRecord(id, hub)
  const d = rec ? buildSeminarPage(rec) : null
  const v = d ? detail(d) : null
  const navigate = useNavigate()
  const store = useSeminarStore()
  const reg = rec ? store.registered[rec.id] : null
  const saved = rec ? store.saved.includes(rec.id) : false
  const [toast, setToast] = useState('')
  const closeToast = useCallback(() => setToast(''), [])
  const [tab, setTab] = useState('about')
  const [shot, setShot] = useState(null)
  const [speakerOpen, setSpeakerOpen] = useState(false)
  const refs = useRef({})
  const tabsRef = useRef(null)

  useEffect(() => { window.scrollTo(0, 0) }, [])
  useEffect(() => {
    const onScroll = () => {
      let cur = 'about'
      for (const [key, el] of Object.entries(refs.current)) if (el && el.getBoundingClientRect().top < 130) cur = key
      setTab(cur)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const session = useSession()
  const uid = session.user?.id || session.profile?.id || ''
  const isOwner = !!(uid && rec?.organizerId && uid === rec.organizerId)
  const participantsTo = rec ? `/tashkilotchi/ishtirokchilar?seminar=${encodeURIComponent(rec.id)}` : '/tashkilotchi/ishtirokchilar'
  const editTo = rec ? `/tashkilotchi/seminarlar/yangi?tahrir=${encodeURIComponent(rec.id)}` : '/tashkilotchi/seminarlar'

  if (!v) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-[17px] font-bold text-[#115E59]">Seminar topilmadi</p>
        <button type="button" onClick={() => navigate('/seminarlar')} className="mt-3 text-[15px] font-semibold text-[#0F766E]">Seminarlarga qaytish</button>
      </div>
    )
  }

  // Sana va davomiylik — faqat haqiqiy boshlanish/tugash sanasidan
  const days = dayCount(rec.startIso, rec.endIso)
  const dateLabel = dateRangeLabel(rec.startIso, rec.endIso) || v.dayShort
  const poster = v.hero && !PLACEHOLDERS.has(v.hero) ? v.hero : ''
  const about = dedupeTexts([rec.aboutFull || v.about])
  const program = (v.programDays || []).filter((x) => x.items?.length)
  const gallery = (rec.gallery || []).filter((x) => x && x !== poster)
  // Manzil: URL bo‘lsa — matn sifatida ko‘rsatilmaydi, faqat "Xaritada ochish" tugmasi
  // utm/fbclid olib tashlanadi, matndagi havola ajratiladi, shahar takrorlanmaydi
  const addrParts = splitAddress(String(rec.address || '').trim())
  const mapUrl = addrParts.mapUrl || v.venue?.map || ''
  const addrText = joinAddress([addrParts.text, rec.city])
  const venueNotes = (rec.venueNotes || []).filter((t) => !isUrl(t))
  const sp = v.speaker?.name ? v.speaker : null
  const { handle: tg, url: tgUrl } = telegramHandle(v.contact?.telegram)
  const phone = formatPhone(v.contact?.phone)
  const cmeLine = d.cmeLine || ''
  const timeLine = rec.time ? `${rec.time}${rec.hours ? ` · ${rec.hours}` : ''}` : ''
  const spLines = (d.speaker?.lines || []).filter(Boolean)
  const bring = rec.bring || []
  const rawSpeaker = rec.speakers?.[0] || rec.speaker || sp
  const speakerHref = findSpeakerDoctorHref({ ...rawSpeaker, ...sp }, DOCTORS)
  const speakerOthers = seminarsBySpeaker(publicRecords(hub), sp?.name, rec.id)
  const openSpeaker = () => {
    if (speakerHref) navigate(speakerHref)
    else setSpeakerOpen(true)
  }

  const tabs = [
    ['about', 'Umumiy', LayoutGrid, true],
    ['program', 'Dastur', ListChecks, program.length > 0],
    ['learn', 'Natijalar', Target, v.learn?.length > 0],
    ['price', 'Narx', Layers, true],
    ['venue', 'Manzil', MapPin, !!(v.venueShort || addrText || mapUrl)],
    ['faq', 'Savol-javob', MessageCircle, v.faq?.length > 0],
  ].filter((t) => t[3])

  const goTo = (key) => {
    setTab(key)
    const el = refs.current[key]
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 112, behavior: 'smooth' })
    tabsRef.current?.querySelector(`[data-tab="${key}"]`)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }
  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: v.title, url })
      else { await navigator.clipboard?.writeText(url); setToast('Havola nusxalandi') }
    } catch { /* bekor qilindi */ }
  }
  const register = () => navigate(isOwner ? participantsTo : `/seminarlar/${rec.id}/royxat`)
  const sec = (key) => (el) => { refs.current[key] = el }

  return (
    <div className="min-h-dvh bg-[#F0FDFA] pb-[calc(150px+env(safe-area-inset-bottom))] text-[15px] text-[#134e4a]">
      {/* Yuqori panel */}
      <header className="sticky top-[0px] z-20 flex items-center justify-between bg-white/95 px-2 pb-1.5 pt-[calc(6px+var(--safe-top))] backdrop-blur">
        <button type="button" aria-label="Orqaga" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/seminarlar'))} className="grid size-11 place-items-center rounded-full text-[#115E59]"><ChevronLeft className="size-6" /></button>
        <p className="text-[16px] font-bold text-[#115E59]">Seminar</p>
        <div className="flex">
          <button type="button" aria-label="Saqlash" aria-pressed={saved} onClick={() => { toggleSaved(rec.id); setToast(saved ? 'Saqlanganlardan olindi' : 'Saqlandi') }} className="grid size-11 place-items-center rounded-full text-[#115E59]"><Bookmark className={`size-[21px] ${saved ? 'fill-[#0F766E]' : ''}`} /></button>
          <button type="button" aria-label="Ulashish" onClick={share} className="grid size-11 place-items-center rounded-full text-[#115E59]"><Share2 className="size-[21px]" /></button>
        </div>
      </header>

      {/* Poster — sarlavhadan alohida, ustiga matn qo‘yilmaydi */}
      {poster && (
        <div className="mx-3 mt-2 overflow-hidden rounded-2xl bg-[#CCFBF1]">
          <img src={poster} alt={`${v.title} posteri`} className="block h-auto max-h-[70vh] w-full object-contain" />
        </div>
      )}

      {/* Sarlavha kartasi */}
      <section className="mx-3 mt-3 rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgb(15_118_110/0.08)]">
        <div className="flex flex-wrap gap-1.5">
          {v.kicker && <span className="rounded-full bg-[#CCFBF1] px-2.5 py-1 text-[13px] font-semibold text-[#115E59]">{v.kicker}</span>}
          <span className="rounded-full bg-[#F0FDFA] px-2.5 py-1 text-[13px] font-semibold text-[#0F766E] ring-1 ring-[#CCFBF1]">{days} kunlik</span>
        </div>
        <h1 className="mt-2 text-[22px] font-extrabold leading-tight text-[#115E59]">{v.title}</h1>
        <div className="mt-3 grid grid-cols-1 gap-2.5 border-t border-[#CCFBF1] pt-3">
          <Fact icon={CalendarDays} text={dateLabel} sub={days > 1 ? `${days} kun` : ''} />
          {timeLine && <Fact icon={Clock} text={rec.time} sub={rec.hours ? `Davomiyligi: ${rec.hours}` : ''} />}
          {cmeLine && <Fact icon={Award} text={`Sertifikat: ${cmeLine}`} />}
          {(v.venueShort || v.city) && <Fact icon={MapPin} text={v.venueShort || v.city} sub={v.venueShort && v.city !== v.venueShort ? v.city : ''} />}
          <Fact icon={Wallet} text={v.price ? som(v.price) : 'Bepul'} sub={v.oldPrice ? `${som(v.oldPrice)} o‘rniga` : ''} />
        </div>
        {isOwner ? (
          <div className="mt-3.5 grid gap-2">
            <button type="button" onClick={() => navigate(participantsTo)} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0F766E] text-[16px] font-semibold text-white"><Users className="size-5" /> Ishtirokchilarni ko‘rish</button>
            <button type="button" onClick={() => navigate(editTo)} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#CCFBF1] text-[14px] font-semibold text-[#0F766E]"><Pencil className="size-4" /> Tahrirlash</button>
          </div>
        ) : reg ? (
          <p className="mt-3.5 flex h-12 items-center justify-center gap-2 rounded-xl bg-[#CCFBF1] text-[15px] font-semibold text-[#0F766E]"><CircleCheck className="size-5" /> Ro‘yxatdan o‘tgansiz</p>
        ) : !v.regClosed ? (
          <button type="button" onClick={register} className="mt-3.5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0F766E] text-[16px] font-semibold text-white">Ro‘yxatdan o‘tish <ArrowRight className="size-5" /></button>
        ) : null}
      </section>

      {/* Ma’ruzachi */}
      {sp && (
        <button type="button" onClick={openSpeaker} className="mx-3 mt-3 flex w-[calc(100%-1.5rem)] items-center gap-3 rounded-2xl bg-white p-3.5 text-left">
          {sp.avatar ? <img src={sp.avatar} alt="" className="size-16 shrink-0 rounded-full object-cover" /> : <span className="grid size-16 shrink-0 place-items-center rounded-full bg-[#CCFBF1] text-[#0F766E]"><User className="size-8" /></span>}
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-[#0F766E]">Ma’ruzachi</p>
            <p className="text-[17px] font-bold leading-snug text-[#115E59]">{sp.name}</p>
            {sp.role && <p className="text-[13px] text-[#115E59]/80">{sp.role}</p>}
            {spLines.length > 0 && <p className="mt-0.5 text-[13px] text-[#115E59]/80">{spLines.join(' · ')}</p>}
            {sp.bio && <p className="mt-0.5 line-clamp-2 text-[13px] text-[#115E59]/80">{sp.bio}</p>}
          </div>
          <ChevronRight className="size-5 shrink-0 text-[#0F766E]" aria-hidden />
        </button>
      )}

      {/* Kursdan lavhalar — faqat yuklangan rasmlar */}
      {gallery.length > 0 && (
        <section className="mt-3">
          <h2 className="px-4 text-[17px] font-bold text-[#115E59]">Kursdan lavhalar</h2>
          <div className="no-scrollbar mt-2 flex snap-x gap-2 overflow-x-auto px-3">
            {gallery.map((g, i) => (
              <button key={g} type="button" onClick={() => setShot(i)} aria-label={`Rasm ${i + 1}`} className="h-28 w-40 shrink-0 snap-start overflow-hidden rounded-xl">
                <img src={g} alt="" loading="lazy" className="size-full object-cover" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Bo‘limlar */}
      <nav ref={tabsRef} aria-label="Bo‘limlar" className="no-scrollbar sticky top-[calc(56px+var(--safe-top))] z-10 mt-3 flex gap-2 overflow-x-auto bg-[#F0FDFA]/95 px-3 py-2 backdrop-blur">
        {tabs.map(([k, label, Icon]) => (
          <button key={k} data-tab={k} type="button" onClick={() => goTo(k)} className={`flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-semibold ring-1 ${tab === k ? 'bg-[#0F766E] text-white ring-[#0F766E]' : 'bg-white text-[#115E59] ring-[#CCFBF1]'}`}>
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </nav>

      <div ref={sec('about')}>
        {about.length > 0 && (
          <Card title="Seminar haqida">
            {about.map((t) => <p key={t} className="whitespace-pre-line text-[15px] leading-relaxed">{t}</p>)}
          </Card>
        )}
      </div>

      {program.length > 0 && (
        <div ref={sec('program')}>
          <Card title="Seminar dasturi">
            <div className="space-y-3">
              {program.map((day) => (
                <div key={day.label} className="overflow-hidden rounded-xl ring-1 ring-[#CCFBF1]">
                  <p className="flex items-center gap-2 bg-[#0F766E] px-3 py-2 text-[14px] font-semibold text-white">
                    <BookOpen className="size-4" /> {day.label}{day.title ? ` — ${day.title}` : ''}{day.date ? ` (${day.date})` : ''}
                  </p>
                  <ul className="divide-y divide-[#CCFBF1]">
                    {day.items.map(([time, text, sub], i) => (
                      <li key={i} className="flex gap-3 px-3 py-2">
                        {time && <span className="w-[92px] shrink-0 text-[13px] font-medium tabular-nums text-[#0F766E]">{time}</span>}
                        <span className="min-w-0 flex-1 text-[15px] leading-snug">{text}{sub && <span className="block text-[13px] text-[#115E59]/75">{sub}</span>}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {v.learn?.length > 0 && (
        <div ref={sec('learn')}>
          <Card icon={Target} title="Kurs yakunida nimalarni bajara olasiz?"><Checks items={v.learn} /></Card>
        </div>
      )}

      {v.audience?.length > 0 && <Card icon={Users} title="Kimlar uchun?"><Checks items={v.audience} /></Card>}
      {(v.practice || v.liveSurgery) && (
        <Card icon={BadgeCheck} title="Amaliyot formati">
          <Checks items={[v.practice && `Amaliy qism: ${v.practice}`, v.liveSurgery && `Jonli jarrohlik: ${v.liveSurgery}`].filter(Boolean)} />
        </Card>
      )}
      {bring.length > 0 && <Card icon={Package} title="Olib kelish kerak narsalar"><Checks items={bring} /></Card>}

      <div ref={sec('price')}>
        <Card icon={Gift} title="Narxga nimalar kiradi?">
          <p className="text-[20px] font-extrabold text-[#0F766E]">{v.price ? som(v.price) : 'Bepul'}{v.oldPrice ? <span className="ml-2 text-[14px] font-medium text-[#115E59]/60 line-through">{som(v.oldPrice)}</span> : null}</p>
          {v.includes?.length > 0 && <div className="mt-2"><Checks items={v.includes} /></div>}
        </Card>
      </div>

      {v.refundPolicy && (
        <Card icon={RotateCcw} title="Bekor qilish va qaytarish shartlari">
          <p className="whitespace-pre-line text-[15px] leading-relaxed">{v.refundPolicy}</p>
        </Card>
      )}

      {(v.venueShort || addrText || mapUrl) && (
        <div ref={sec('venue')}>
          <Card icon={MapPin} title="Manzil">
            {v.venueShort && <p className="text-[16px] font-semibold text-[#115E59]">{v.venueShort}</p>}
            {addrText && addrText !== v.venueShort && <p className="text-[15px]">{addrText}</p>}
            {venueNotes.map((t) => <p key={t} className="mt-1 flex items-start gap-1.5 text-[15px]"><Check className="mt-0.5 size-4 shrink-0 text-[#0F766E]" />{t}</p>)}
            {mapUrl && (
              <a href={mapUrl} target="_blank" rel="noreferrer" className="mt-3 block overflow-hidden rounded-xl ring-1 ring-[#CCFBF1]">
                <div aria-hidden className="relative h-28 bg-[#F0FDFA] [background-image:linear-gradient(#CCFBF1_1px,transparent_1px),linear-gradient(90deg,#CCFBF1_1px,transparent_1px)] [background-size:22px_22px]">
                  <span className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 -rotate-6 bg-white/90" />
                  <span className="absolute inset-y-0 left-[38%] w-2 rotate-12 bg-white/90" />
                  <MapPin className="absolute left-1/2 top-1/2 size-9 -translate-x-1/2 -translate-y-[85%] fill-[#0F766E] text-white" />
                </div>
                <span className="flex h-11 items-center justify-center gap-1.5 bg-white text-[15px] font-semibold text-[#0F766E]">Xaritada ochish <ArrowRight className="size-4" /></span>
              </a>
            )}
          </Card>
        </div>
      )}

      {v.faq?.length > 0 && (
        <div ref={sec('faq')}>
          <Card icon={MessageCircle} title="Savol-javob">
            <div className="divide-y divide-[#CCFBF1]">
              {v.faq.map(([q, a], i) => (
                <details key={q} open={i === 0} className="group py-2.5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-[15px] font-semibold text-[#115E59]">{q}<ChevronDown className="size-4 shrink-0 transition group-open:rotate-180" /></summary>
                  <p className="mt-1.5 rounded-lg bg-[#F0FDFA] p-2.5 text-[15px] leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
          </Card>
        </div>
      )}

      {(v.orgName || phone || tg) && (
        <Card icon={Send} title="Tashkilotchi">
          {v.orgName && <p className="text-[15px] font-semibold">{v.orgName}</p>}
          {phone && <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} className="mt-1 flex items-center gap-1.5 text-[15px]"><Phone className="size-4 text-[#0F766E]" />{phone}</a>}
          {tg && <a href={tgUrl} target="_blank" rel="noreferrer" className="mt-2 flex h-11 items-center justify-center gap-1.5 rounded-xl text-[15px] font-semibold text-[#0F766E] ring-1 ring-[#0F766E]">Telegramda yozish ({tg}) <ChevronRight className="size-4" /></a>}
        </Card>
      )}

      {/* Pastki panel */}
      <div className="app-action-bar fixed inset-x-0 bottom-0 z-30 border-t border-[#CCFBF1] bg-white px-3.5 pb-2 pt-2.5 shadow-[0_-6px_18px_rgb(15_118_110/0.08)]">
        {isOwner ? (
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => navigate(editTo)} className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#CCFBF1] text-[14px] font-semibold text-[#0F766E]"><Pencil className="size-4" /> Tahrirlash</button>
            <button type="button" onClick={() => navigate(participantsTo)} className="flex h-12 flex-[1.4] items-center justify-center gap-1.5 rounded-xl bg-[#0F766E] text-[14px] font-semibold text-white"><Users className="size-4" /> Ishtirokchilar</button>
          </div>
        ) : reg ? (
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 text-[15px] font-bold text-[#0F766E]"><CircleCheck className="size-4" /> Ro‘yxatdan o‘tgansiz</p>
              <p className="truncate text-[13px] text-[#115E59]/80">{reg.plan} · {dateLabel}</p>
            </div>
            <button type="button" onClick={register} className="flex h-12 items-center gap-2 rounded-xl bg-[#0F766E] px-4 text-[15px] font-semibold text-white"><Ticket className="size-[18px]" /> Chipta</button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <p className="min-w-0 flex-1 whitespace-nowrap text-[19px] font-extrabold text-[#115E59]">{v.price ? som(v.price) : 'Bepul'}</p>
              <button type="button" disabled={v.regClosed} onClick={register} className="flex h-12 items-center gap-2 rounded-xl bg-[#0F766E] px-5 text-[16px] font-semibold text-white disabled:bg-[#115E59]/40">
                {v.regClosed ? 'Ro‘yxat yopilgan' : <>Ro‘yxatdan o‘tish <ArrowRight className="size-5" /></>}
              </button>
            </div>
            {/* Haqiqiy ro‘yxatdan o‘tish bosqichlari (MobileSeminarReg): Ma’lumotlar → To‘lov → Tasdiqlandi */}
            {!v.regClosed && (
              <ol className="mt-1.5 flex items-center justify-center gap-1.5 text-[13px] text-[#115E59]/80">
                <li className="flex items-center gap-1"><FileText className="size-3.5 text-[#0F766E]" />Ma’lumotlar</li>
                <li aria-hidden>→</li>
                <li className="flex items-center gap-1"><CreditCard className="size-3.5 text-[#0F766E]" />To‘lov</li>
                <li aria-hidden>→</li>
                <li className="flex items-center gap-1"><CircleCheck className="size-3.5 text-[#0F766E]" />Tasdiqlash</li>
              </ol>
            )}
          </>
        )}
      </div>

      <MobileToast text={toast} onClose={closeToast} />
      {shot != null && gallery.length > 0 && (
        <Lightbox images={gallery} index={shot} onIndex={setShot} onClose={() => setShot(null)} alt="Kursdan lavhalar" />
      )}
      {speakerOpen && (
        <SpeakerProfileSheet
          speaker={{ ...rawSpeaker, ...sp, lines: spLines }}
          others={speakerOthers}
          onClose={() => setSpeakerOpen(false)}
        />
      )}
    </div>
  )
}

function Fact({ icon: Icon, text, sub }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#F0FDFA] text-[#0F766E]"><Icon className="size-[18px]" /></span>
      <div className="min-w-0"><p className="text-[15px] font-semibold text-[#115E59]">{text}</p>{sub && <p className="text-[13px] text-[#115E59]/75">{sub}</p>}</div>
    </div>
  )
}

function Card({ icon: Icon, title, children }) {
  return (
    <section className="mx-3 mt-3 scroll-mt-28 rounded-2xl bg-white p-4">
      <h2 className="mb-2 flex items-center gap-2 text-[17px] font-bold text-[#115E59]">{Icon && <Icon className="size-5 text-[#0F766E]" />}{title}</h2>
      {children}
    </section>
  )
}

function Checks({ items }) {
  return (
    <ul className="space-y-1.5">
      {items.map((t) => <li key={t} className="flex items-start gap-2 text-[15px] leading-snug"><Check className="mt-0.5 size-4 shrink-0 text-[#0F766E]" />{t}</li>)}
    </ul>
  )
}
