import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Award, BookOpen, Check, ChevronDown, Clock, Lock, Play, Star, UserRound } from 'lucide-react'
import ShopLayout from '../components/market/ShopLayout'
import { Certificate } from './Sertifikatlar'
import { courseError, enrollCourse, loadPlayer, loadPublicExtras, mergeCourseExtras, devShot } from '../courseApi'
import { courseDurationSeconds, formatDuration, groupLessons, hoursNumber, lessonTakeaways, nextWatchLesson } from '../courseRules'
import { directions, formats, levels, money } from '../educationData'
import { isTestEvent, isTestSeedId, TEST_ORDER_TEXT } from '../lib/testSeed'
import { loginHref } from '../requireAuth'
import { certFromRow } from '../sertifikatData'
import { useSession } from '../sessionStore'

const LEVEL_OF = Object.fromEntries(levels.filter(([k]) => k !== 'all'))
const FORMAT_OF = Object.fromEntries(formats.filter(([k]) => k !== 'all'))
const DIRECTION_OF = Object.fromEntries(directions.filter(([k]) => k !== 'all'))

export default function CourseDetailRoute() {
  return (
    <ShopLayout active="education" search="plain" placeholder="Kurs, mavzu yoki shifokor qidiring...">
      <CourseDetailPage />
    </ShopLayout>
  )
}

function CourseDetailPage() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [enrolling, setEnrolling] = useState(false)
  const [message, setMessage] = useState('')
  const session = useSession()
  const navigate = useNavigate()

  const reload = () => {
    const shot = devShot('detail') || devShot('player')
    if (shot) {
      setData(shot)
      setStatus('ready')
      setError('')
      return Promise.resolve(shot)
    }
    return Promise.all([loadPlayer(id), loadPublicExtras(id)])
      .then(([body, extras]) => {
        if (!body?.ok) throw new Error(body?.error || 'Kurs topilmadi')
        setData(mergeCourseExtras(body, extras))
        setStatus('ready')
        setError('')
        return body
      })
      .catch((err) => {
        setData(null)
        setStatus('error')
        setError(courseError(err))
        return null
      })
  }

  useEffect(() => {
    let stop = false
    setStatus('loading')
    setMessage('')
    reload().then(() => { /* loaded */ })
    return () => { stop = true }
  }, [id])

  const course = data?.course
  const lessons = data?.lessons || []
  const testSeed = !!(course && (isTestSeedId(course.id) || isTestEvent(course)))

  useCourseSeo(course)

  const onEnroll = async () => {
    if (testSeed) {
      setMessage(TEST_ORDER_TEXT)
      return
    }
    if (session.status !== 'authed') {
      navigate(loginHref(`/talim/${id}`))
      return
    }
    setEnrolling(true)
    setMessage('')
    try {
      const res = await enrollCourse(id)
      if (!res?.ok) throw new Error(res?.error || 'Yozilib bo‘lmadi')
      if (!res.access) setMessage('Yozuv saqlandi. To‘lov ulanmaguncha darslar yopiq.')
      await reload()
    } catch (err) {
      setMessage(courseError(err))
    } finally {
      setEnrolling(false)
    }
  }

  const onWatch = () => {
    const next = nextWatchLesson(lessons)
    const qs = next?.id ? `?dars=${encodeURIComponent(next.id)}` : ''
    navigate(`/talim/${id}/dars${qs}`)
  }

  if (status === 'loading') {
    return (
      <div className="animate-pulse pb-10 pt-5">
        <div className="h-4 w-40 rounded bg-[#dce8e7]" />
        <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="aspect-video rounded-2xl bg-[#d7e6e4]" />
          <div className="hidden h-[280px] rounded-2xl bg-white shadow-card lg:block" />
        </div>
      </div>
    )
  }

  if (status === 'error' || !course) {
    return (
      <div className="py-16 text-center">
        <p className="text-[16px] font-bold text-ink">{error || 'Kurs topilmadi'}</p>
        <Link to="/talim" className="mt-3 inline-flex h-12 items-center justify-center rounded-xl bg-sea px-5 text-[14px] font-semibold text-white">Ta’limga qaytish</Link>
      </div>
    )
  }

  return (
    <CourseDetailView
      course={course}
      lessons={lessons}
      message={message}
      enrolling={enrolling}
      testSeed={testSeed}
      onEnroll={onEnroll}
      onWatch={onWatch}
    />
  )
}

export function CourseDetailView({ course, lessons, message, enrolling, testSeed, onEnroll, onWatch }) {
  const durationSec = courseDurationSeconds(course, lessons)
  const duration = formatDuration(durationSec)
  const hours = hoursNumber(durationSec)
  const access = !!course.access
  const paid = (Number(course.price) || 0) > 0
  const unpaid = !!course.enrolled && paid && !access
  const progressing = access && (Number(course.done) || 0) > 0 && !course.completed
  const cta = detailCta({ access, paid, progressing, testSeed, unpaid })
  const onCta = cta.key === 'watch' ? onWatch : onEnroll

  return (
    <div className="relative pb-[calc(var(--action-bar-h)+28px)] pt-3 lg:pb-14 lg:pt-5">
      <nav className="hidden text-[12.5px] text-muted lg:block">
        <Link to="/talim" className="font-semibold text-sea hover:underline">Ta’lim</Link>
        <span className="px-1.5">/</span>
        <span className="text-ink-2">{course.title}</span>
      </nav>
      <Link to="/talim" className="mb-2 inline-flex h-11 items-center text-[13px] font-semibold text-sea lg:hidden">← Ta’lim</Link>

      <div className="mt-2 grid items-start gap-6 lg:mt-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.9fr)] lg:gap-10">
        <div className="min-w-0">
          <div className="-mx-4 overflow-hidden bg-[#0d3b3a] lg:mx-0 lg:rounded-2xl lg:shadow-[0_18px_40px_rgb(11_31_58/0.12)]">
            {course.cover ? (
              <img src={course.cover} alt={course.title} className="aspect-video w-full object-cover" />
            ) : (
              <div className="aspect-video w-full bg-[linear-gradient(135deg,#0b6d73,#143044)]" />
            )}
          </div>

          <div className="mt-4 lg:hidden">
            <HeroInfo course={course} duration={duration} lessons={lessons} />
          </div>

          {String(course.about || '').trim().length > 220 ? <AboutSection about={course.about} /> : null}
          <LearningsSection lessons={lessons} points={course.learnPoints} />
          <AudienceSection items={course.audience} />
          <CurriculumSection lessons={lessons} access={access} />
          <AuthorCard course={course} />
          <CertificateSection course={course} hours={hours} />
          <ReviewsSection />
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-4">
            <HeroInfo course={course} duration={duration} lessons={lessons} compact />
            <div className="mt-5 overflow-hidden rounded-2xl bg-white p-5 shadow-[0_16px_40px_rgb(11_31_58/0.10)] ring-1 ring-black/5">
              <PurchaseBlock
                course={course}
                duration={duration}
                lessons={lessons}
                cta={cta}
                unpaid={unpaid}
                testSeed={testSeed}
                message={message}
                enrolling={enrolling}
                onCta={onCta}
              />
            </div>
          </div>
        </aside>
      </div>

      <div className="app-action-bar fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-3.5 py-2.5 shadow-[0_-8px_24px_rgb(11_31_58/0.08)] backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className={`text-[16px] font-extrabold leading-tight ${paid && !access ? 'text-ink' : 'text-sea'}`}>{money(Number(course.discountPrice) > 0 && Number(course.discountPrice) < Number(course.price) ? course.discountPrice : course.price)}</p>
            {unpaid && <p className="text-[11px] text-muted">To‘lov kutilmoqda</p>}
          </div>
          <CtaButton cta={cta} enrolling={enrolling} testSeed={testSeed} onClick={onCta} className="h-12 flex-1" />
        </div>
        {(message || testSeed) && (
          <p className="mt-1.5 text-[11.5px] leading-snug text-[#8a4b12]">{testSeed ? TEST_ORDER_TEXT : message}</p>
        )}
      </div>
    </div>
  )
}

function detailCta({ access, paid, progressing, testSeed, unpaid }) {
  if (testSeed) return { key: 'blocked', label: 'Batafsil', disabled: true }
  if (access) return { key: 'watch', label: progressing ? 'Davom ettirish' : 'Tomosha qilish' }
  if (unpaid) return { key: 'unpaid', label: 'Sotib olish', disabled: true }
  if (paid) return { key: 'buy', label: 'Sotib olish' }
  return { key: 'start', label: 'Boshlash' }
}

function CtaButton({ cta, enrolling, testSeed, onClick, className = '' }) {
  const disabled = !!cta.disabled || enrolling || testSeed
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-12 items-center justify-center rounded-xl bg-sea px-5 text-[14.5px] font-semibold text-white shadow-[0_8px_18px_rgb(11_138_149/0.28)] hover:bg-sea-600 disabled:cursor-not-allowed disabled:opacity-55 ${className}`}
    >
      {enrolling ? (cta.key === 'buy' ? 'Saqlanmoqda…' : 'Yozilmoqda…') : cta.label}
    </button>
  )
}

function PurchaseBlock({ course, duration, lessons, cta, unpaid, testSeed, message, enrolling, onCta }) {
  const includes = [
    lessons.length ? `${lessons.length} ta dars` : '',
    duration || '',
    LEVEL_OF[course.level] || '',
    FORMAT_OF[course.format] || '',
  ].filter(Boolean)
  return (
    <>
      <PriceLine course={course} />
      {unpaid && (
        <p className="mt-2 rounded-xl bg-[#fff6e8] px-3 py-2 text-[12.5px] leading-relaxed text-[#8a4b12]">
          Yozuv saqlandi. To‘lov ulanmaguncha darslar yopiq.
        </p>
      )}
      {testSeed && <p className="mt-2 rounded-xl bg-[#fff6e8] px-3 py-2 text-[12.5px] leading-relaxed text-[#8a4b12]">{TEST_ORDER_TEXT}</p>}
      {message && !unpaid && !testSeed && <p className="mt-2 text-[12.5px] leading-relaxed text-[#8a4b12]">{message}</p>}
      <CtaButton cta={cta} enrolling={enrolling} testSeed={testSeed} onClick={onCta} className="mt-4 w-full" />
      {includes.length > 0 && (
        <ul className="mt-5 space-y-2 border-t border-line pt-4">
          {includes.map((item) => (
            <li key={item} className="flex items-center gap-2 text-[13px] text-ink-2">
              <Check className="size-4 shrink-0 text-sea" strokeWidth={2.5} />
              {item}
            </li>
          ))}
          <li className="flex items-center gap-2 text-[13px] text-ink-2">
            <Award className="size-4 shrink-0 text-sea" strokeWidth={2.5} />
            {course.certificateEnabled === false ? 'Sertifikat berilmaydi' : 'Sertifikat: barcha testlardan o‘tilgach'}
          </li>
          <li className="flex items-start gap-2 text-[13px] leading-snug text-ink-2">
            <Lock className="mt-0.5 size-4 shrink-0 text-sea" strokeWidth={2.5} />
            Darslar ketma-ket ochiladi — avvalgi test topshirilgach
          </li>
        </ul>
      )}
      {Number(course.enrolledCount) > 0 && (
        <p className="mt-4 text-[12px] text-muted">{course.enrolledCount} ta tinglovchi</p>
      )}
    </>
  )
}


const UZ_MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']
function untilLabel(value) {
  if (!value) return ''
  const raw = String(value)
  const d = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T12:00:00+05:00`) : new Date(raw)
  if (Number.isNaN(d.getTime())) return ''
  const t = new Date(d.getTime() + 5 * 3600 * 1000)
  return `${t.getUTCDate()}-${UZ_MONTHS[t.getUTCMonth()]}`
}

function PriceLine({ course }) {
  const price = Number(course.price) || 0
  const discount = Number(course.discountPrice) || 0
  if (price > 0 && discount > 0 && discount < price) {
    const pct = Math.round((1 - discount / price) * 100)
    return (
      <div>
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <p className="text-[28px] font-extrabold leading-none text-ink">{money(discount)}</p>
          <p className="text-[15px] font-semibold text-muted line-through">{money(price)}</p>
          <span className="rounded-full bg-[#fff1e6] px-2 py-0.5 text-[12px] font-bold text-[#c2410c]">−{pct}%</span>
        </div>
        {untilLabel(course.discountUntil) ? <p className="mt-1.5 text-[12px] font-semibold text-[#c2410c]">Chegirma {untilLabel(course.discountUntil)} gacha</p> : null}
      </div>
    )
  }
  return <p className={`text-[28px] font-extrabold leading-none ${price ? 'text-ink' : 'text-sea'}`}>{money(price)}</p>
}

function HeroInfo({ course, duration, lessons, compact = false }) {
  return (
    <div>
      {DIRECTION_OF[course.direction] && (
        <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-sea">{DIRECTION_OF[course.direction]}</p>
      )}
      <h1 className={`mt-1 font-extrabold leading-[1.2] tracking-tight text-ink ${compact ? 'text-[28px] xl:text-[32px]' : 'text-[24px]'}`}>{course.title}</h1>
      {(course.subtitle || course.about) && (
        <p className={`mt-2.5 leading-relaxed text-ink-2 ${compact ? 'text-[15px]' : 'text-[14.5px]'}`}>{course.subtitle || shortAbout(course.about)}</p>
      )}
      <MetaRow course={course} duration={duration} lessons={lessons} />
      <AuthorInline course={course} />
    </div>
  )
}

function MetaRow({ course, duration, lessons }) {
  const chips = [
    LEVEL_OF[course.level],
    FORMAT_OF[course.format],
    lessons.length ? `${lessons.length} dars` : (course.lessons ? `${course.lessons} dars` : ''),
    duration,
  ].filter(Boolean)
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <span key={chip} className="inline-flex h-8 items-center rounded-full bg-sea-50 px-3 text-[12px] font-semibold text-sea">{chip}</span>
      ))}
      <span className="inline-flex h-8 items-center gap-1 rounded-full bg-[#f4f6f8] px-3 text-[12px] text-ink-2">
        <Star className="size-3.5 text-[#c5ccd4]" /> Hali baho yo‘q
      </span>
    </div>
  )
}

function AuthorInline({ course }) {
  if (!course.doctor && !course.avatar) return null
  return (
    <div className="mt-4 flex items-center gap-2.5">
      <Avatar course={course} size="size-10" />
      <div className="min-w-0">
        <p className="truncate text-[13.5px] font-bold text-ink">{course.doctor}</p>
        {course.role ? <p className="truncate text-[12px] text-muted">{course.role}</p> : null}
      </div>
    </div>
  )
}

function AboutSection({ about }) {
  const text = String(about || '').trim()
  const [open, setOpen] = useState(false)
  if (!text) return null
  const long = text.length > 280
  return (
    <section className="mt-8 rounded-2xl bg-white p-5 shadow-card lg:p-6">
      <h2 className="text-[18px] font-extrabold tracking-tight text-ink lg:text-[20px]">Kurs haqida</h2>
      <p className={`mt-3 whitespace-pre-line text-[14.5px] leading-relaxed text-ink-2 ${!open && long ? 'line-clamp-6' : ''}`}>{text}</p>
      {long && (
        <button type="button" onClick={() => setOpen((v) => !v)} className="mt-2 inline-flex h-12 items-center text-[13.5px] font-semibold text-sea">
          {open ? 'Qisqartirish' : 'Batafsil'}
        </button>
      )}
    </section>
  )
}

function LearningsSection({ lessons, points }) {
  const own = (Array.isArray(points) ? points : []).map((item) => String(item || '').trim()).filter(Boolean)
  const items = own.length ? own : (lessons || []).map((lesson) => String(lesson.title || '').trim()).filter(Boolean)
  if (!items.length) return null
  return (
    <section className="mt-4 rounded-2xl bg-white p-5 shadow-card lg:mt-5 lg:p-6">
      <h2 className="text-[18px] font-extrabold tracking-tight text-ink lg:text-[20px]">Nimalarni o‘rganasiz</h2>
      <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {items.map((item, i) => (
          <li key={`${i}-${item}`} className="flex items-start gap-2.5 text-[14px] leading-snug text-ink-2">
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-sea-50 text-sea">
              <Check className="size-3" strokeWidth={3} />
            </span>
            {item}
          </li>
        ))}
      </ul>
    </section>
  )
}

function AudienceSection({ items }) {
  const list = (Array.isArray(items) ? items : []).map((item) => String(item || '').trim()).filter(Boolean)
  if (!list.length) return null
  return (
    <section className="mt-4 rounded-2xl bg-white p-5 shadow-card lg:mt-5 lg:p-6">
      <h2 className="text-[18px] font-extrabold tracking-tight text-ink lg:text-[20px]">Kimlar uchun</h2>
      <ul className="mt-4 space-y-2.5">
        {list.map((item, i) => (
          <li key={`${i}-${item}`} className="flex items-start gap-2.5 text-[14px] leading-snug text-ink-2">
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-sea-50 text-sea">
              <UserRound className="size-3" strokeWidth={2.5} />
            </span>
            {item}
          </li>
        ))}
      </ul>
    </section>
  )
}

function CurriculumSection({ lessons, access }) {
  const groups = groupLessons(lessons || [])
  const [open, setOpen] = useState(() => new Set(groups[0]?.title ? [groups[0].title] : groups.length ? ['darslar'] : []))
  if (!lessons?.length) return null
  const toggle = (key) => setOpen((prev) => {
    const next = new Set(prev)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    return next
  })
  return (
    <section className="mt-4 rounded-2xl bg-white p-5 shadow-card lg:mt-5 lg:p-6">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-[18px] font-extrabold tracking-tight text-ink lg:text-[20px]">O‘quv dasturi</h2>
        <p className="text-[12.5px] font-medium text-muted">{lessons.length} dars</p>
      </div>
      <div className="mt-4 divide-y divide-line overflow-hidden rounded-xl ring-1 ring-line">
        {groups.map((group, gi) => {
          const key = group.title || `darslar-${gi}`
          const expanded = open.has(key)
          return (
            <div key={key}>
              <button
                type="button"
                onClick={() => toggle(key)}
                aria-expanded={expanded}
                className="flex min-h-12 w-full items-center justify-between gap-3 bg-[#f7fafb] px-3.5 py-2.5 text-left"
              >
                <span className="min-w-0">
                  <span className="block text-[14px] font-bold text-ink">{group.title || 'Darslar'}</span>
                  <span className="text-[12px] text-muted">{group.lessons.length} dars</span>
                </span>
                <ChevronDown className={`size-5 shrink-0 text-muted transition ${expanded ? 'rotate-180' : ''}`} />
              </button>
              {expanded && (
                <ol className="px-2 py-1.5">
                  {group.lessons.map((lesson) => (
                    <LessonItem key={lesson.id || lesson.position} lesson={lesson} locked={!access || lesson.locked} />
                  ))}
                </ol>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function LessonItem({ lesson, locked }) {
  const [open, setOpen] = useState(false)
  const takeaways = Array.isArray(lesson.takeaways) && lesson.takeaways.length ? lesson.takeaways : lessonTakeaways(lesson.description)
  const duration = formatDuration(lesson.durationSeconds)
  return (
    <li className="rounded-xl">
      <button
        type="button"
        onClick={() => takeaways.length && setOpen((v) => !v)}
        className={`flex min-h-12 w-full items-start gap-3 px-2 py-2.5 text-left ${takeaways.length ? '' : 'cursor-default'}`}
        aria-expanded={takeaways.length ? open : undefined}
      >
        <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full text-[12px] font-bold ${locked ? 'bg-[#eef2f4] text-[#8aa0b0]' : 'bg-sea-50 text-sea'}`}>
          {locked ? <Lock className="size-3.5" /> : lesson.position || <BookOpen className="size-3.5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block text-[14px] font-semibold leading-snug ${locked ? 'text-[#5c6e80]' : 'text-ink'}`}>{lesson.title || `${lesson.position}-dars`}</span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-muted">
            {duration ? <span className="inline-flex items-center gap-1"><Clock className="size-3" />{duration}</span> : null}
            {lesson.hasQuiz ? <span className="rounded-full bg-sea-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-sea">Test bor</span> : null}
            {locked ? <span>Yozilgandan so‘ng ochiladi</span> : null}
          </span>
        </span>
        {takeaways.length > 0 && <ChevronDown className={`mt-2 size-4 shrink-0 text-muted transition ${open ? 'rotate-180' : ''}`} />}
      </button>
      {open && takeaways.length > 0 && (
        <div className="mb-2 ml-11 mr-2">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-muted">Nimalar o‘rgatiladi</p>
          <ul className="space-y-1">
            {takeaways.map((item) => (
              <li key={item} className="flex items-start gap-2 text-[13px] leading-snug text-ink-2">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-sea" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  )
}

function AuthorCard({ course }) {
  if (!course.doctor && !course.avatar && !course.role) return null
  return (
    <section className="mt-4 rounded-2xl bg-white p-5 shadow-card lg:mt-5 lg:p-6">
      <h2 className="text-[18px] font-extrabold tracking-tight text-ink lg:text-[20px]">Muallif</h2>
      <div className="mt-4 flex items-start gap-3.5">
        <Avatar course={course} size="size-16" />
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-extrabold text-ink">{course.doctor || 'Muallif'}</p>
          {course.role ? <p className="mt-0.5 text-[13.5px] text-ink-2">{course.role}</p> : null}
        </div>
      </div>
    </section>
  )
}

function Avatar({ course, size }) {
  if (course.avatar) return <img src={course.avatar} alt={course.doctor || ''} className={`${size} shrink-0 rounded-full object-cover ring-2 ring-white shadow-card`} />
  return (
    <span className={`${size} grid shrink-0 place-items-center rounded-full bg-sea-50 text-sea ring-2 ring-white shadow-card`}>
      {course.doctor ? <span className="text-[18px] font-extrabold">{course.doctor.slice(0, 1)}</span> : <UserRound className="size-6" />}
    </span>
  )
}

function CertificateSection({ course, hours }) {
  const issued = course.certificate
  const sample = certFromRow({
    id: 'namuna',
    title: course.title,
    issuedAt: '',
    kind: 'online',
    hours: hours || 0,
    cme: 0,
    speaker: course.doctor || '',
    holderName: 'F.I.Sh.',
    scorePct: 0,
    place: 'Onlayn',
    code: '',
    courseId: course.id ? `course:${course.id}` : 'course:namuna',
  })
  return (
    <section className="mt-4 rounded-2xl bg-white p-5 shadow-card lg:mt-5 lg:p-6">
      <h2 className="text-[18px] font-extrabold tracking-tight text-ink lg:text-[20px]">Sertifikat</h2>
      {course.certificateEnabled === false && !issued ? (
        <p className="mt-2 text-[14.5px] leading-relaxed text-ink-2"><span className="font-bold text-ink">Berilmaydi.</span> Muallif bu kurs uchun sertifikatni o‘chirgan.</p>
      ) : (
        <p className="mt-2 text-[14.5px] leading-relaxed text-ink-2">
          <span className="font-bold text-ink">Beriladi.</span> Shart: barcha darslar yakunlanib, testdan o‘tishi kerak bo‘lgan darslar muvaffaqiyatli topshirilishi{Number(course.certificateMinScore) > 0 ? `, o‘rtacha ball kamida ${Number(course.certificateMinScore)}%` : ''}.
        </p>
      )}
      {course.certificateEnabled === false && !issued ? null : issued ? (
        <div className="mt-4 overflow-hidden rounded-xl ring-1 ring-line">
          <Certificate c={certFromRow({ ...issued, courseId: `course:${course.id}`, speaker: issued.speaker || course.doctor, title: issued.title || course.title, kind: 'online' })} big />
        </div>
      ) : (
        <div className="relative mt-4 overflow-hidden rounded-xl ring-1 ring-line">
          <div className="pointer-events-none select-none opacity-90">
            <Certificate c={sample} big />
          </div>
          <span className="pointer-events-none absolute inset-0 grid place-items-center bg-white/15">
            <span className="rotate-[-18deg] rounded-lg border-2 border-sea/50 bg-white/80 px-4 py-1 text-[16px] font-extrabold uppercase tracking-[0.2em] text-sea">Namuna</span>
          </span>
        </div>
      )}
    </section>
  )
}

function ReviewsSection() {
  return (
    <section className="mt-4 rounded-2xl bg-white p-5 shadow-card lg:mt-5 lg:mb-2 lg:p-6">
      <h2 className="text-[18px] font-extrabold tracking-tight text-ink lg:text-[20px]">Baholar va sharhlar</h2>
      <p className="mt-2 flex items-center gap-2 text-[14.5px] text-ink-2">
        <Star className="size-4 text-[#c5ccd4]" /> Hali baho yo‘q
      </p>
    </section>
  )
}

function shortAbout(text) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim()
  if (clean.length <= 220) return clean
  const cut = clean.slice(0, 220)
  const sp = cut.lastIndexOf(' ')
  return `${(sp > 140 ? cut.slice(0, sp) : cut).trim()}…`
}

function useCourseSeo(course) {
  useEffect(() => {
    if (!course?.title) return undefined
    const prevTitle = document.title
    const descEl = document.querySelector('meta[name="description"]')
    const ogTitle = document.querySelector('meta[property="og:title"]')
    const ogDesc = document.querySelector('meta[property="og:description"]')
    const prevDesc = descEl?.getAttribute('content')
    const prevOgT = ogTitle?.getAttribute('content')
    const prevOgD = ogDesc?.getAttribute('content')
    const desc = String(course.about || '').replace(/\s+/g, ' ').trim().slice(0, 160)
    document.title = `${course.title} — Ta’lim — StomaHub`
    if (descEl && desc) descEl.setAttribute('content', desc)
    if (ogTitle) ogTitle.setAttribute('content', `${course.title} — StomaHub`)
    if (ogDesc && desc) ogDesc.setAttribute('content', desc)
    return () => {
      document.title = prevTitle
      if (descEl && prevDesc != null) descEl.setAttribute('content', prevDesc)
      if (ogTitle && prevOgT != null) ogTitle.setAttribute('content', prevOgT)
      if (ogDesc && prevOgD != null) ogDesc.setAttribute('content', prevOgD)
    }
  }, [course?.id, course?.title, course?.about])
}

export { detailCta }
