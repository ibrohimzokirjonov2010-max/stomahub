import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Check, CircleCheck, CirclePlay, Play } from 'lucide-react'
import { useProfile } from '../../profileStore'
import { useMyCourses } from '../../courseApi'
import { MobileToast } from './parts'
import MobileTabBar from './MobileTabBar'
import { BottomSheet } from './MobileSeminars'
import { SubTopBar } from './MobileManzillar'
import { Certificate, printCert } from '../../pages/Sertifikatlar'
import { certFromRow } from '../../sertifikatData'

const teal = 'text-[#0b6d73]'
const navy = 'text-[#0d2a4a]'

export default function MobileKurslarim() {
  const profile = useProfile()
  const navigate = useNavigate()
  const mine = useMyCourses()
  const rows = (mine.rows || []).map((c) => ({
    ...c,
    image: c.cover,
    author: c.doctor,
    avatar: c.avatar,
    lessons: c.lessons || 0,
    done: c.done || 0,
    complete: !!c.complete,
    certificateId: c.certificate_id,
  }))
  const active = rows.filter((c) => !c.complete)
  const done = rows.filter((c) => c.complete)
  const [tab, setTab] = useState('active')
  const [cert, setCert] = useState(null)
  const [toast, setToast] = useState('')
  const closeToast = useCallback(() => setToast(''), [])
  const pastRef = useRef(null)
  const lock = useRef(0)

  useEffect(() => { window.scrollTo(0, 0) }, [])
  useEffect(() => {
    const onScroll = () => {
      if (Date.now() < lock.current || !pastRef.current) return
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
      setTab(pastRef.current.getBoundingClientRect().top < 200 || atBottom ? 'done' : 'active')
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const jump = (id) => {
    setTab(id)
    lock.current = Date.now() + 700
    const el = id === 'done' ? pastRef.current : null
    window.scrollTo({ top: el ? el.getBoundingClientRect().top + window.scrollY - 70 : 0, behavior: 'smooth' })
  }

  const tabs = [['active', 'Davom etmoqda', Play, active.length], ['done', 'Tugallangan', CircleCheck, done.length]]

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef8f7_0%,#f6faf9_28%,#f6faf9_100%)] pb-[86px]">
      <div className="px-3 pt-3">
        <SubTopBar title="Kurslarim" subtitle="Siz boshlagan va tugallagan kurslar" />
        {mine.error && <p className="mt-2 rounded-xl bg-[#fff4f4] px-3 py-2 text-[12.5px] text-[#b42318]">{mine.error}</p>}

        <div role="tablist" aria-label="Kurslar" className="sticky top-0 z-20 -mx-3 mt-3 grid grid-cols-2 gap-2 bg-[#f1f9f8]/95 px-3 py-1.5 backdrop-blur">
          {tabs.map(([id, label, Icon, count]) => {
            const on = tab === id
            return (
              <button key={id} type="button" role="tab" aria-selected={on} disabled={!count} onClick={() => jump(id)} className={`flex h-11 items-center justify-center gap-1.5 rounded-xl border text-[13.5px] font-medium transition disabled:opacity-50 ${on ? 'border-transparent bg-[#0b6d73] text-white shadow-[0_4px_12px_rgb(11_109_115/0.25)]' : `border-[#e2ebee] bg-white ${teal}`}`}>
                <Icon className="size-[18px] shrink-0" strokeWidth={1.8} />
                <span className="truncate">{label}</span>
                <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-semibold ${on ? 'bg-white/20 text-white' : 'bg-[#e3f4f1] text-[#0b6d73]'}`}>{count}</span>
              </button>
            )
          })}
        </div>

        <section aria-labelledby="course-active">
          <h2 id="course-active" className={`mt-3 text-[17px] font-bold ${navy}`}>Davom etmoqda</h2>
          {mine.status === 'loading' ? <p className="mt-3 text-[13px] text-[#6b7c8f]">Yuklanmoqda…</p> : active.length ? (
            <div className="mt-2 flex flex-col gap-3">
              {active.map((c) => <CourseCard key={c.id} c={c} onOpen={() => navigate(`/talim/${c.id}`)} />)}
            </div>
          ) : (
            <div className="mt-2 rounded-2xl border border-dashed border-[#cfe3e0] bg-white px-4 py-6 text-center">
              <CircleCheck className={`mx-auto size-8 ${teal}`} strokeWidth={1.5} />
              <p className={`mt-2 text-[14px] font-semibold ${navy}`}>{rows.length ? 'Barcha kurslar tugallangan' : 'Hali kurs yo‘q'}</p>
              <p className="mt-0.5 text-[12px] text-muted">{rows.length ? 'Yangi kurslar sertifikat bilan shu yerda paydo bo‘ladi' : 'Ta’limdan kursni boshlang — progress hisobingizda saqlanadi'}</p>
              <Link to="/talim" className="mt-3 inline-flex h-10 items-center rounded-xl bg-[#0b6d73] px-4 text-[13px] font-semibold text-white">Kurslarni ko‘rish</Link>
            </div>
          )}
        </section>

        {done.length > 0 && (
          <section ref={pastRef} aria-labelledby="course-done">
            <h2 id="course-done" className={`mt-5 text-[17px] font-bold ${navy}`}>Tugallangan kurslar</h2>
            <div className="mt-2 flex flex-col gap-3">
              {done.map((c) => <CourseCard key={c.id} c={c} onOpen={() => setCert(c)} />)}
            </div>
          </section>
        )}
      </div>

      {cert && <CertSheet course={cert} name={profile.name} onClose={() => setCert(null)} onToast={setToast} />}
      <MobileToast text={toast} onClose={closeToast} />
      <MobileTabBar />
    </div>
  )
}

function CourseCard({ c, onOpen }) {
  const finished = c.complete || (c.lessons > 0 && c.done === c.lessons)
  const pct = c.lessons ? Math.round((c.done / c.lessons) * 100) : (finished ? 100 : 0)
  return (
    <article className="rounded-2xl border border-[#e5eef0] bg-white p-2.5 shadow-[0_1px_6px_rgb(11_31_58/0.04)]">
      <div className="flex gap-2.5">
        <button type="button" onClick={onOpen} aria-label={c.title} className="relative h-[148px] w-[118px] shrink-0 overflow-hidden rounded-xl bg-[#eef4f4]">
          {c.image ? <img src={c.image} alt="" className="size-full object-cover" /> : <span className="grid size-full place-items-center bg-[linear-gradient(160deg,#0b6d73,#143044)] text-white"><Play className="size-6 fill-white" /></span>}
          <span className="absolute left-1 top-1 flex items-center gap-0.5 whitespace-nowrap rounded-md bg-[#0b6d73]/92 px-1 py-0.5 text-[9px] font-medium leading-none text-white">
            {finished ? <Check className="size-2.5 shrink-0" strokeWidth={3} /> : <Play className="size-2.5 shrink-0 fill-white" />}
            {finished ? 'Tugallangan' : 'Davom etmoqda'}
          </span>
        </button>
        <div className="flex min-w-0 flex-1 flex-col">
          <h3 className={`text-[15px] font-bold leading-tight ${navy}`}>{c.title}</h3>
          <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-[#5b6e80]">{c.about}</p>
          <div className="mt-2 flex items-center gap-2">
            {c.avatar ? <img src={c.avatar} alt="" className="size-8 shrink-0 rounded-full object-cover object-top" /> : <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#e3f4f1] text-[11px] font-bold text-[#0b6d73]">{(c.author || 'M').slice(0, 1)}</span>}
            <span className="min-w-0">
              <span className={`block truncate text-[12.5px] font-semibold leading-tight ${navy}`}>{c.author}</span>
              <span className="block truncate text-[11px] text-[#7a8a9c]">{c.role}</span>
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <span className="shrink-0 text-[11.5px] text-[#5b6e80]">{finished ? `Natija ${c.score || 0}%` : `${c.done}/${c.lessons} dars`}</span>
            <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#e6eef0]"><span className="block h-full rounded-full bg-[#0b6d73]" style={{ width: `${pct}%` }} /></span>
            <span className={`shrink-0 text-[12px] font-bold ${teal}`}>{pct}%</span>
          </div>
          <button type="button" onClick={onOpen} className={`mt-2.5 flex h-10 items-center justify-center gap-1.5 rounded-xl text-[13px] font-semibold active:scale-[0.98] ${finished ? `border border-[#0b8a7a]/60 bg-white ${teal}` : 'bg-[#0b6d73] text-white'}`}>
            {finished ? <CircleCheck className="size-4" /> : <Play className="size-4 fill-current" />}
            {finished ? 'Sertifikatni ko‘rish' : 'Davom ettirish'}
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </article>
  )
}

function CertSheet({ course, name, onClose, onToast }) {
  const c = certFromRow({
    id: course.certificateId || course.id,
    course_id: `course:${course.id}`,
    code: course.code,
    title: course.title,
    issuedAt: course.issued_at,
    kind: 'online',
    hours: course.hours,
    cme: course.points || course.cme,
    speaker: course.speaker || course.author,
    holderName: course.holder_name || name,
    scorePct: course.score,
    place: 'Onlayn',
  })
  return (
    <BottomSheet
      title="Sertifikat"
      onClose={onClose}
      footer={<button type="button" onClick={() => { printCert(c, c.holderName || name); onToast('Chop etish oynasi ochildi') }} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0b6d73] text-[14px] font-semibold text-white">Yuklab olish</button>}
    >
      <Certificate c={c} big />
      <Link to={`/sertifikatlar?cert=${c.id}`} className={`mt-3 block text-center text-[13px] font-semibold ${teal}`}>Barcha sertifikatlar</Link>
    </BottomSheet>
  )
}
