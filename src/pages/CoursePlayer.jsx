import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ShopLayout from '../components/market/ShopLayout'
import { LessonPlayer } from '../components/course/LessonPlayer'
import { Certificate, printCert } from './Sertifikatlar'
import { bunnyLibraryId, courseError, embedUrl, enrollCourse, loadPlayer, reportProgress, submitQuiz } from '../courseApi'
import { BUNNY_PLAYER_ORIGIN, parseBunnyMessage, shouldReportProgress, subscribeBunnyPlayer } from '../courseRules'
import { certFromRow } from '../sertifikatData'
import { reloadCertificates } from '../profileStore'
import { useMobile } from '../useMobile'
import { useSession } from '../sessionStore'

export default function CoursePlayer() {
  const mobile = useMobile()
  return (
    <ShopLayout active="education" search="plain" placeholder="Kurs, mavzu yoki shifokor qidiring...">
      <div className="pb-4 pt-3">
        <Link to="/talim" className="text-[12px] font-semibold text-sea">← Ta’lim</Link>
        <PlayerBody mobile={mobile} />
      </div>
    </ShopLayout>
  )
}

function PlayerBody({ mobile }) {
  const { id } = useParams()
  const session = useSession()
  const [data, setData] = useState(null)
  const [phase, setPhase] = useState('loading')
  const [message, setMessage] = useState('')
  const [activeId, setActiveId] = useState('')
  const [libraryId, setLibraryId] = useState('805789')
  const [enrolling, setEnrolling] = useState(false)
  const [quiz, setQuiz] = useState(null)
  const [result, setResult] = useState(null)
  const [certOpen, setCertOpen] = useState(false)
  const [retryUntil, setRetryUntil] = useState(0)
  const lastSent = useRef(0)
  const playerWindow = useRef(null)
  const playerLesson = useRef('')

  const reload = async () => {
    const body = await loadPlayer(id)
    if (!body?.ok) throw new Error(body?.error || 'Kurs topilmadi')
    setData(body)
    setActiveId((prev) => prev && body.lessons.some((lesson) => lesson.id === prev) ? prev : (body.lessons.find((lesson) => !lesson.locked)?.id || body.lessons[0]?.id || ''))
    const course = body.course
    if (!course.access && !course.preview) setPhase('enroll')
    else setPhase((prev) => (prev === 'quiz' || prev === 'result' ? prev : 'watch'))
    return body
  }

  useEffect(() => {
    let stop = false
    setPhase('loading')
    bunnyLibraryId().then((value) => { if (!stop) setLibraryId(value) })
    reload().catch((error) => { if (!stop) { setPhase('error'); setMessage(courseError(error)) } })
    return () => { stop = true }
  }, [id])

  const lessons = data?.lessons || []
  const course = data?.course
  const active = lessons.find((lesson) => lesson.id === activeId)

  const armRetry = (seconds) => {
    const wait = Number(seconds) || 0
    if (wait > 0) setRetryUntil(Date.now() + wait * 1000)
  }

  const onPlayerFrame = (frame) => {
    const win = frame?.contentWindow
    if (!win) return
    playerWindow.current = win
    playerLesson.current = active?.id || ''
    lastSent.current = 0
    subscribeBunnyPlayer(win)
  }

  const lessonKey = active?.id || ''
  if (playerLesson.current && playerLesson.current !== lessonKey) {
    playerWindow.current = null
    playerLesson.current = ''
    lastSent.current = 0
  }

  useEffect(() => {
    if (!active?.videoId || phase !== 'watch') return undefined
    const lessonId = active.id
    const onMessage = (event) => {
      if (event.origin !== BUNNY_PLAYER_ORIGIN) return
      const parsed = parseBunnyMessage(event.data)
      const frame = playerWindow.current
      if (parsed?.event === 'ready' && (!frame || event.source === frame)) subscribeBunnyPlayer(event.source)
      if (!frame || event.source !== frame || playerLesson.current !== lessonId) return
      if (!parsed || parsed.current == null) return
      if (parsed.event && !/timeupdate|progress|ended|pause|seeked/.test(parsed.event)) return
      const now = Date.now()
      if (!shouldReportProgress({ lastSent: lastSent.current, now, event: parsed.event })) return
      lastSent.current = now
      reportProgress(lessonId, parsed.current).then((res) => {
        if (!res?.ok) return
        if (res.quizUnlocked && !active.quizUnlocked) {
          reload().then((body) => {
            const fresh = body.lessons.find((lesson) => lesson.id === active.id)
            if (fresh?.quizUnlocked && !fresh.quizPassed && fresh.hasQuiz) openQuiz(fresh)
            if (res.certificate) setCertOpen(true)
          }).catch(() => {})
        } else if (res.quizPassed) {
          reload().catch(() => {})
          if (res.certificate) {
            reloadCertificates().catch(() => {})
            setCertOpen(true)
          }
        }
      }).catch(() => {})
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [active?.id, active?.videoId, active?.quizUnlocked, phase])

  const openQuiz = (lesson) => {
    const questions = lesson?.questions || []
    if (!questions.length) return
    setResult(null)
    setQuiz({
      lessonId: lesson.id,
      questions,
      maxMistakes: Number.isFinite(Number(lesson.maxMistakes)) ? Number(lesson.maxMistakes) : 2,
      index: 0,
      answers: {},
      busy: false,
      error: '',
    })
    setPhase('quiz')
  }

  const onPickLesson = (lesson) => {
    if (lesson.locked) return
    setActiveId(lesson.id)
    setResult(null)
    setQuiz(null)
    setPhase('watch')
    if (lesson.quizUnlocked && !lesson.quizPassed && lesson.hasQuiz && !lesson.questions?.length) {
      reload().catch(() => {})
    }
  }

  const onEnroll = async () => {
    if (session.status !== 'authed') {
      setMessage('Davom etish uchun kiring')
      return
    }
    setEnrolling(true)
    setMessage('')
    try {
      const res = await enrollCourse(id)
      if (!res?.ok) throw new Error(res?.error || 'Yozilib bo‘lmadi')
      if (!res.access) setMessage('To‘lov ulanmaguncha bu kurs yopiq')
      await reload()
    } catch (error) {
      setMessage(courseError(error))
    } finally {
      setEnrolling(false)
    }
  }

  const videoUrl = active && !active.locked && active.encodingStatus === 'finished' && active.videoId
    ? embedUrl(libraryId, active.videoId)
    : ''

  const quizView = quiz && {
    ...quiz,
    onPick: (qid, choice) => setQuiz((q) => ({ ...q, answers: { ...q.answers, [qid]: choice }, error: '' })),
    onPrev: () => setQuiz((q) => ({ ...q, index: Math.max(0, q.index - 1) })),
    onNext: () => setQuiz((q) => ({ ...q, index: Math.min(q.questions.length - 1, q.index + 1) })),
    onSubmit: async () => {
      setQuiz((q) => ({ ...q, busy: true, error: '' }))
      try {
        const answers = quiz.questions.map((q) => ({ id: q.id, choice: quiz.answers[q.id] }))
        const res = await submitQuiz(quiz.lessonId, answers)
        if (!res?.ok) {
          if (Number(res?.retryAfter) > 0) {
            armRetry(res.retryAfter)
            setResult({
              passed: false,
              score: res.score,
              correct: res.correct,
              total: res.total,
              mistakes: res.mistakes,
              maxMistakes: res.maxMistakes ?? quiz.maxMistakes,
              error: res.error,
              code: res.code,
              retryAfter: res.retryAfter,
            })
            setQuiz((q) => ({ ...q, busy: false }))
            setPhase('result')
            return
          }
          throw new Error(res?.error || 'Test qabul qilinmadi')
        }
        setResult(res)
        if (res.passed) setRetryUntil(0)
        else armRetry(res.retryAfter)
        setPhase('result')
        if (res.passed) {
          await reload()
          if (res.certificate) reloadCertificates().catch(() => {})
        }
      } catch (error) {
        setQuiz((q) => ({ ...q, busy: false, error: courseError(error) }))
      }
    },
  }

  const certificate = course?.certificate ? certFromRow({
    id: course.certificate.id,
    code: course.certificate.code,
    title: course.certificate.title || course.title,
    issuedAt: course.certificate.issuedAt,
    courseId: `course:${course.id}`,
    kind: 'online',
    hours: course.certificate.hours,
    cme: course.certificate.points,
    speaker: course.certificate.speaker || course.doctor,
    holderName: course.certificate.holderName,
    scorePct: course.certificate.scorePct,
    place: 'Onlayn',
  }) : null

  return (
    <>
      {course?.preview && phase !== 'loading' && (
        <p className="mb-3 rounded-xl bg-[#e7f6f4] px-3 py-2 text-[12.5px] text-[#0d2a4a]">Oldindan ko‘rish. Talaba tartibini sinash uchun bepul kursga o‘zingiz yoziling.</p>
      )}
      <LessonPlayer
        course={course}
        lessons={lessons}
        activeId={activeId}
        mobile={mobile}
        phase={phase}
        message={message}
        videoUrl={videoUrl}
        onPickLesson={onPickLesson}
        onNext={(lesson) => lesson && onPickLesson(lesson)}
        onEnroll={onEnroll}
        enrolling={enrolling}
        quiz={phase === 'quiz' ? quizView : null}
        result={result}
        retryUntil={retryUntil}
        onPlayerFrame={onPlayerFrame}
        onRetry={() => {
          if (Date.now() < retryUntil) return
          if (active) openQuiz(active)
        }}
        onOpenCert={() => setCertOpen(true)}
      />
      {active?.quizUnlocked && !active.quizPassed && active.hasQuiz && phase === 'watch' && (
        <button type="button" onClick={() => openQuiz(active)} className="mt-3 inline-flex h-11 items-center rounded-xl bg-[#0d2a4a] px-4 text-[13.5px] font-semibold text-white">
          Testni boshlash
        </button>
      )}
      {certOpen && certificate && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#0d2a4a]/45 p-4" onClick={() => setCertOpen(false)}>
          <div onClick={(event) => event.stopPropagation()} className="max-h-[92vh] w-full max-w-[760px] overflow-auto rounded-2xl bg-white p-4">
            <Certificate c={certificate} big />
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => printCert(certificate, certificate.holderName)} className="h-11 flex-1 rounded-xl bg-sea text-[13.5px] font-semibold text-white">Yuklab olish</button>
              <Link to={`/sertifikatlar?cert=${certificate.id}`} className="grid h-11 flex-1 place-items-center rounded-xl border border-sea text-[13.5px] font-semibold text-sea">Sertifikatlar</Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
