import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  Heart, BadgeCheck, MapPin, ChevronRight, Banknote, BriefcaseBusiness, Clock, FileText, ListChecks, Gift, CircleCheck,
  MessageCircle, Send, Paperclip, Check, X, Phone,
} from 'lucide-react'
import { jobs, typeName, viewOf, pay, exps } from '../../ishlarData'
import { MobileToast } from './parts'
import MobileTabBar from './MobileTabBar'
import { BottomSheet, ToothIcon } from './MobileSeminars'
import { HubTopBar } from './MobileKategoriyalar'
import { Lightbox } from './MobileCommunity'
import { ChatSheet } from './MobileMutaxassislar'
import { TYPE_CLS, expText, findJob, jobsStore, useJobs } from './MobileIshlar'

const GRAPH = { full: '6/1', part: 'Yarim kun', shift: '2/2 smena', remote: 'Moslashuvchan' }
const DUTIES = {
  terapevt: ['Bemorlarga terapevtik davolash xizmatlarini ko‘rsatish', 'Davolash rejalarini tuzish va amalga oshirish', 'Klinika standartlariga rioya qilish', 'Bemorlar bilan sifatli muloqot'],
  ortoped: ['Protezlash rejasini tuzish', 'Koronka va protezlarni o‘rnatish', 'Texnik laboratoriya bilan ishlash', 'Bemorlarni nazoratga chaqirish'],
  ortodont: ['Ortodontik tashxis va rejalashtirish', 'Breket va elayner bilan davolash', 'Davolash jarayonini nazorat qilish', 'Ota-onalar bilan muloqot'],
  jarroh: ['Tish olish va jarrohlik amaliyotlari', 'Implantatsiya rejasi va bajarish', 'Operatsiyadan keyingi nazorat', 'Rentgen va CBCT tahlili'],
  bolalar: ['Bolalarni qo‘rquvsiz davolash', 'Profilaktika va germetizatsiya', 'Ota-onalarga maslahat berish', 'Sut tishlari terapiyasi'],
  gigiyenist: ['Professional gigiyena o‘tkazish', 'Bemorlarga parvarish o‘rgatish', 'Profilaktik ko‘riklar', 'Gigiyena kartasini yuritish'],
  texnik: ['Koronka va vinirlar tayyorlash', 'CAD/CAM bilan ishlash', 'Shifokor bilan rang tanlash', 'Sifat nazorati'],
  assistent: ['Shifokorga to‘rt qo‘lda yordam berish', 'Asboblarni sterilizatsiya qilish', 'Kabinetni tayyorlash', 'Bemorlarni kutib olish'],
  admin: ['Bemorlarni ro‘yxatga olish', 'Telefon qo‘ng‘iroqlariga javob berish', 'Qabul jadvalini yuritish', 'Kassa va hujjatlar bilan ishlash'],
}
const NEEDS = {
  assistent: ['O‘rta tibbiy yoki tibbiy ma’lumot', 'Sterilizatsiya qoidalarini bilish', 'Diqqatli va tartibli bo‘lish', 'Jamoada ishlay olish'],
  admin: ['Kompyuterda ishlay olish', 'Muloqot madaniyati', 'Rus va o‘zbek tillarini bilish', 'Mas’uliyatlilik'],
  texnik: ['Tish texnigi diplomi', 'Keramika bilan ishlash tajribasi', 'CAD/CAM dasturlarini bilish', 'Aniqlik va sabr'],
}
const OFFER = ['Qulay va zamonaviy ish sharoiti', 'Zamonaviy uskunalar va materiallar', 'Doimiy rivojlanish va malaka oshirish imkoniyatlari', 'Barqaror va o‘z vaqtida maosh']

export default function MobileIsh() {
  const { id } = useParams()
  return <JobView key={id} id={id} />
}

function JobView({ id }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { saved, applied } = useJobs()
  const j = findJob(id)
  const [sheet, setSheet] = useState(() => (location.state?.apply ? 'apply' : null))
  const [zoom, setZoom] = useState(null)
  const [toast, setToast] = useState('')
  const closeToast = useCallback(() => setToast(''), [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  if (!j) {
    return (
      <div className="grid min-h-screen place-items-center bg-white px-6 text-center">
        <div>
          <p className="text-[15px] font-semibold text-ink">Vakansiya topilmadi</p>
          <Link to="/ishlar" className="mt-3 inline-block text-[13px] font-semibold text-sea">Ishlarga qaytish</Link>
        </div>
      </div>
    )
  }

  const v = viewOf(j)
  const isSaved = saved.has(j.id)
  const isApplied = applied.has(j.id)
  const needs = j.requirements || NEEDS[j.spec] || ['Stomatologiya yo‘nalishi bo‘yicha oliy ma’lumot', expText(j), 'Zamonaviy davolash usullarini bilish', 'Mas’uliyatlilik va kommunikativlik']
  const duties = DUTIES[j.spec] || DUTIES.terapevt
  const offer = j.benefits ? [...j.benefits, ...OFFER].slice(0, 4) : OFFER
  const similar = jobs.filter((x) => x.spec === j.spec && x.id !== j.id).slice(0, 6)
  const back = () => (window.history.length > 1 ? navigate(-1) : navigate('/ishlar'))

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef8f7_0%,#f6faf9_30%)] pb-[150px]">
      <div className="px-3.5 pt-3">
        <HubTopBar onBack={back} onBell={() => setToast('Yangi bildirishnomalar yo‘q')} />

        <div className="relative mt-3">
          <button type="button" onClick={() => setZoom(0)} aria-label="Rasmlarni ko‘rish" className="block h-[150px] w-full overflow-hidden rounded-2xl">
            <img src={v.gallery[0]} alt={j.clinic} className="size-full object-cover" />
          </button>
          <span className="absolute bottom-2 left-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[10.5px] text-white">1 / {v.gallery.length}</span>
          <button type="button" onClick={() => { jobsStore.toggleSave(j.id); setToast(isSaved ? 'Saqlanganlardan olib tashlandi' : 'Vakansiya saqlandi') }} aria-label="Saqlash" aria-pressed={isSaved} className="absolute right-2.5 top-2.5 grid size-10 place-items-center rounded-full bg-white shadow-[0_1px_4px_rgb(11_31_58/0.15)]">
            <Heart className={`size-5 ${isSaved ? 'fill-sale text-sale' : 'text-ink'}`} />
          </button>
        </div>

        <div className="mt-2.5 flex items-center gap-3 rounded-2xl bg-white p-2.5 shadow-[0_1px_4px_rgb(11_31_58/0.05)]">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#e6f4f3] text-sea"><ToothIcon className="size-7" strokeWidth={1.6} /></span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-[14px] font-bold text-[#0d2a4a]"><span className="truncate">{j.clinic}</span><BadgeCheck className="size-4 shrink-0 fill-sea text-white" /></p>
            <p className="flex items-center gap-1 truncate text-[11.5px] text-muted"><MapPin className="size-3.5 shrink-0" /> {v.address}</p>
          </div>
          <button type="button" onClick={() => setSheet('clinic')} className="flex h-8 shrink-0 items-center gap-0.5 rounded-lg bg-[#e6f4f3] px-2 text-[11.5px] font-semibold text-[#0b6d73]">Klinika profili <ChevronRight className="size-3.5" /></button>
        </div>

        <section className="mt-2.5 rounded-2xl bg-white p-3.5 shadow-[0_1px_4px_rgb(11_31_58/0.05)]">
          <div className="flex items-start gap-2">
            <h1 className="min-w-0 flex-1 text-[21px] font-extrabold leading-tight tracking-tight text-[#0d2a4a]">{j.title}</h1>
            <span className={`mt-1 shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${TYPE_CLS[j.type]}`}>{typeName[j.type]}</span>
          </div>
          <p className="mt-1 text-[13px] leading-snug text-ink-2">{j.about}</p>
          <div className="mt-2.5 flex items-center gap-2">
            <Banknote className="size-6 shrink-0 text-[#0b6d73]" strokeWidth={1.7} />
            <div>
              <p className="text-[19px] font-extrabold leading-none tracking-tight text-[#0b6d73]">{pay(j.min, j.max)}</p>
              <p className="mt-0.5 text-[11px] text-muted">Kelishuv asosida · {j.posted}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 divide-x divide-line/70 rounded-xl border border-line/70 py-2.5">
            {[[BriefcaseBusiness, 'Ish turi', typeName[j.type]], [Clock, 'Ish grafigi', GRAPH[j.type]], [MapPin, 'Manzil', `${j.cityLabel}, ${j.district}`]].map(([Icon, k, val]) => (
              <div key={k} className="flex min-w-0 gap-1.5 px-2">
                <Icon className="mt-0.5 size-[18px] shrink-0 text-[#0b6d73]" strokeWidth={1.7} />
                <span className="min-w-0">
                  <span className="block text-[10.5px] text-muted">{k}</span>
                  <b className="block text-[11.5px] font-semibold leading-tight text-ink">{val}</b>
                </span>
              </div>
            ))}
          </div>
        </section>

        <Block icon={FileText} title="Talablar" items={needs} />
        <Block icon={ListChecks} title="Vazifalar" items={duties} />
        <Block icon={Gift} title="Biz taklif qilamiz" items={offer} />

        {v.original && (
          <section className="mt-2.5 rounded-2xl bg-white p-3.5 text-[12px] text-ink-2 shadow-[0_1px_4px_rgb(11_31_58/0.05)]">
            <p className="font-semibold text-ink">E’lon matni ({j.source})</p>
            <p className="mt-1">{v.original}</p>
            {v.sourceUrl && <a href={v.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block font-semibold text-sea">Asl e’lonni ochish</a>}
          </section>
        )}

        {similar.length > 0 && (
          <>
            <h2 className="mt-4 text-[16px] font-bold text-[#0d2a4a]">O‘xshash vakansiyalar</h2>
            <div className="-mx-3.5 mt-2 flex gap-2.5 overflow-x-auto px-3.5 pb-1 no-scrollbar">
              {similar.map((x) => (
                <Link key={x.id} to={`/ishlar/${x.id}`} className="w-[200px] shrink-0 rounded-2xl bg-white p-2 shadow-[0_1px_4px_rgb(11_31_58/0.06)]">
                  <img src={x.image} alt="" className="h-[86px] w-full rounded-xl object-cover" />
                  <p className="mt-1.5 truncate text-[13px] font-bold text-ink">{x.title}</p>
                  <p className="truncate text-[11px] text-muted">{x.clinic} · {x.cityLabel}</p>
                  <p className="mt-0.5 text-[12px] font-extrabold text-[#0b6d73]">{pay(x.min, x.max)}</p>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-[62px] z-30 grid grid-cols-[0.85fr_1.15fr] gap-2 border-t border-line/60 bg-white/95 px-3.5 py-2.5 backdrop-blur">
        <button type="button" onClick={() => setSheet('chat')} className="flex h-12 items-center justify-center gap-1.5 rounded-xl border border-[#bfe3df] bg-[#eef8f7] text-[13px] font-semibold text-[#0b6d73]"><MessageCircle className="size-5" /> Klinika bilan chat</button>
        {isApplied ? (
          <span className="flex h-12 items-center justify-center gap-1.5 rounded-xl bg-[#e3f8ec] text-[14px] font-semibold text-[#16a05a]"><Check className="size-5" /> Ariza yuborildi</span>
        ) : (
          <button type="button" onClick={() => setSheet('apply')} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0b6d73] text-[15px] font-semibold text-white"><Send className="size-5" /> Ariza yuborish</button>
        )}
      </div>

      {sheet === 'apply' && !isApplied && <ApplySheet j={j} onClose={() => setSheet(null)} onDone={() => { jobsStore.apply(j.id); setSheet(null); setToast('Arizangiz yuborildi. Klinika siz bilan bog‘lanadi') }} />}
      {sheet === 'chat' && (
        <ChatSheet
          d={{ name: j.clinic, photo: j.image, online: true }}
          initial={`Assalomu alaykum! "${j.title}" vakansiyasi bo‘yicha yozyapman.`}
          quick={['Vakansiya hali ochiqmi?', 'Suhbat qachon?', 'Ish vaqti qanday?', 'Maosh haqida']}
          onClose={() => setSheet(null)}
          onSent={() => { setSheet(null); setToast('Xabar klinikaga yuborildi') }}
        />
      )}
      {sheet === 'clinic' && (
        <BottomSheet title={j.clinic} onClose={() => setSheet(null)}>
          <p className="mt-1 text-[13px] leading-snug text-ink-2">{v.aboutClinic}</p>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {v.gallery.map((src, i) => <button key={src + i} type="button" onClick={() => { setSheet(null); setZoom(i) }} className="h-20 overflow-hidden rounded-lg"><img src={src} alt="" className="size-full object-cover" /></button>)}
          </div>
          <a href={`tel:${j.phone.replace(/\s/g, '')}`} className="mt-3 flex h-11 items-center justify-center gap-2 rounded-xl border border-line text-[13.5px] font-semibold text-ink"><Phone className="size-4 text-sea" /> {j.phone}</a>
          <p className="mt-4 text-[13px] font-semibold text-ink">Klinikaning boshqa vakansiyalari</p>
          <div className="mt-2 flex flex-col gap-1.5 pb-2">
            {jobs.filter((x) => x.clinic === j.clinic && x.id !== j.id).slice(0, 6).map((x) => (
              <Link key={x.id} to={`/ishlar/${x.id}`} onClick={() => setSheet(null)} className="flex items-center justify-between rounded-xl border border-line/70 px-3 py-2.5">
                <span className="min-w-0">
                  <b className="block truncate text-[13px] text-ink">{x.title}</b>
                  <span className="text-[11.5px] text-muted">{x.cityLabel} · {pay(x.min, x.max)}</span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted" />
              </Link>
            ))}
            {!jobs.some((x) => x.clinic === j.clinic && x.id !== j.id) && <p className="text-[12px] text-muted">Boshqa ochiq vakansiya yo‘q</p>}
          </div>
        </BottomSheet>
      )}
      {zoom !== null && <Lightbox images={v.gallery} index={zoom} onClose={() => setZoom(null)} />}

      <MobileToast text={toast} onClose={closeToast} bottom={140} />
      <MobileTabBar />
    </div>
  )
}

function Block({ icon: Icon, title, items }) {
  return (
    <section className="mt-2.5 rounded-2xl bg-white p-3.5 shadow-[0_1px_4px_rgb(11_31_58/0.05)]">
      <div className="mb-2 flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-lg bg-[#e6f4f3] text-[#0b6d73]"><Icon className="size-[18px]" strokeWidth={1.7} /></span>
        <h2 className="text-[15px] font-bold text-[#0d2a4a]">{title}</h2>
      </div>
      <ul className="flex flex-col gap-1.5">
        {items.map((t) => (
          <li key={t} className="flex items-start gap-2 text-[12.5px] leading-snug text-ink-2">
            <CircleCheck className="mt-px size-4 shrink-0 fill-[#0b6d73] text-white" /> {t}
          </li>
        ))}
      </ul>
    </section>
  )
}

function ApplySheet({ j, onClose, onDone }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('+998 ')
  const [exp, setExp] = useState(j.exp)
  const [note, setNote] = useState('')
  const [file, setFile] = useState(null)
  const [tried, setTried] = useState(false)
  const okName = name.trim().length >= 3
  const okPhone = phone.replace(/\D/g, '').length === 12
  const submit = () => {
    setTried(true)
    if (okName && okPhone) onDone()
  }
  return (
    <BottomSheet title="Ariza yuborish" onClose={onClose} footer={<button type="button" onClick={submit} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0b6d73] text-[14px] font-semibold text-white"><Send className="size-4" /> Yuborish</button>}>
      <div className="mt-2 rounded-xl bg-[#f2f8f8] px-3 py-2.5">
        <p className="text-[13.5px] font-bold text-ink">{j.title}</p>
        <p className="text-[11.5px] text-muted">{j.clinic} · {pay(j.min, j.max)}</p>
      </div>
      <div className="mt-3 flex flex-col gap-2 pb-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ism familiya" className={`h-11 rounded-xl border px-3 text-[14px] outline-none focus:border-sea ${tried && !okName ? 'border-sale' : 'border-line'}`} />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="+998 90 123 45 67" className={`h-11 rounded-xl border px-3 text-[14px] outline-none focus:border-sea ${tried && !okPhone ? 'border-sale' : 'border-line'}`} />
        {tried && (!okName || !okPhone) && <p className="text-[11.5px] text-sale">Ism va telefon raqamni to‘liq kiriting</p>}
        <p className="mt-1 text-[13px] font-semibold text-ink">Tajribangiz</p>
        <div className="flex flex-wrap gap-2">
          {exps.map(([k, l]) => <button key={k} type="button" aria-pressed={exp === k} onClick={() => setExp(k)} className={`flex h-9 items-center gap-1 rounded-xl border px-3 text-[12px] font-medium ${exp === k ? 'border-sea bg-sea-50 text-sea' : 'border-line text-ink'}`}>{exp === k && <Check className="size-3.5" />}{l}</button>)}
        </div>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="O‘zingiz haqingizda qisqacha (ixtiyoriy)" className="mt-1 w-full resize-none rounded-xl border border-line px-3 py-2.5 text-[13.5px] outline-none focus:border-sea" />
        {file ? (
          <div className="flex h-11 items-center gap-2 rounded-xl border border-sea bg-sea-50 px-3 text-[13px] text-sea">
            <Paperclip className="size-4" /> <span className="min-w-0 flex-1 truncate">{file}</span>
            <button type="button" onClick={() => setFile(null)} aria-label="Faylni olib tashlash"><X className="size-4" /></button>
          </div>
        ) : (
          <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line text-[13px] font-semibold text-sea">
            <Paperclip className="size-4" /> Rezyume biriktirish (PDF, rasm)
            <input type="file" accept=".pdf,.doc,.docx,image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0]?.name || null)} />
          </label>
        )}
      </div>
    </BottomSheet>
  )
}
