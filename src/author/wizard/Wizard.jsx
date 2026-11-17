import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Loader2, Save, X } from 'lucide-react'
import { courseError, loadEditor, pollQuizJob, saveCourse, startQuizFromVideo } from '../../courseApi'
import { profileName, useSession } from '../../sessionStore'
import { videoHost } from '../../lib/videoHost'
import { authorShot, loadExtras, saveExtras, setCourseStatus } from '../api'
import { BASE } from '../AuthorShell'
import { MigrationNotice, StatusPill, btn, cx } from '../ui'
import Curriculum from './Curriculum'
import { PreviewOverlay, StepReview } from './Review'
import { StepAudience, StepBasics, StepCertificate, StepPricing } from './steps'
import { STEPS, blankCourse, blankModule, corePayload, extrasPayload, flatLessons, fromServer } from './model'

export default function Wizard() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const session = useSession()
  const shot = authorShot()?.editor || null
  const isNew = !id
  const step = Math.min(STEPS.length - 1, Math.max(0, (Number(params.get('qadam')) || 1) - 1))

  const [course, setCourse] = useState(() => (shot ? shot.course : blankCourse()))
  const [modules, setModules] = useState(() => (shot ? shot.modules : [blankModule(1)]))
  const [selected, setSelected] = useState(() => shot?.selected || null)
  const [loading, setLoading] = useState(!isNew && !shot)
  const [busy, setBusy] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const [error, setError] = useState('')
  const [legacy, setLegacy] = useState(!!authorShot()?.missing)
  const [preview, setPreview] = useState(!!shot?.preview)
  const [jobs, setJobs] = useState(shot?.jobs || {})
  const [videoReady, setVideoReady] = useState(shot?.videoReady || { ready: true, reason: '' })
  const polls = useRef(new Map())
  const authorName = profileName(session.profile, session.user?.email) || 'Muallif'

  const patch = (p) => { setCourse((c) => ({ ...c, ...p })); setDirty(true) }
  const setMods = (fn) => { setModules(fn); setDirty(true) }

  useEffect(() => {
    if (shot) return
    videoHost().status().then(setVideoReady).catch(() => {})
  }, [])

  useEffect(() => {
    if (shot || isNew || course.id === id) return undefined
    let stop = false
    setLoading(true)
    Promise.all([loadEditor(id), loadExtras(id)])
      .then(([editor, extras]) => {
        if (stop) return
        if (!editor?.ok) throw new Error(editor?.error || 'Kurs ochilmadi')
        const state = fromServer(editor, extras)
        setCourse(state.course)
        setModules(state.modules)
        setLegacy(!!extras.legacy)
        setDirty(false)
      })
      .catch((e) => { if (!stop) setError(courseError(e)) })
      .finally(() => { if (!stop) setLoading(false) })
    return () => { stop = true }
  }, [id])

  // Video qayta ishlanayotgan darslar holatini yangilash
  const pendingKey = flatLessons(modules).filter((l) => l.id && ['created', 'processing', 'uploading'].includes(l.encodingStatus) && !(l.uploadPct > 0 && l.uploadPct < 100)).map((l) => l.id).join('|')
  useEffect(() => {
    if (shot || !pendingKey) return undefined
    const ids = pendingKey.split('|')
    const timer = setInterval(() => {
      ids.forEach((lessonId) => {
        videoHost().refresh(lessonId).then((res) => {
          setModules((ms) => ms.map((m) => ({ ...m, lessons: m.lessons.map((l) => (l.id === lessonId ? { ...l, encodingStatus: res.encoding, durationSeconds: res.duration || l.durationSeconds, bunnyVideoId: res.videoId || l.bunnyVideoId } : l)) })))
        }).catch(() => {})
      })
    }, 5000)
    return () => clearInterval(timer)
  }, [pendingKey])

  useEffect(() => () => { for (const t of polls.current.values()) t.cancelled = true }, [])

  useEffect(() => {
    if (!dirty) return undefined
    const warn = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  /** Saqlash: asosiy (course_save) + qo‘shimcha (0078). Qaytaradi: { id, lessonIds } yoki null. */
  const persist = async ({ quiet = false } = {}) => {
    if (shot) { setDirty(false); setSavedAt(new Date()); return { id: course.id || 'shot', lessonIds: flatLessons(modules).map((l) => l.id || l.key) } }
    setBusy(true)
    setError('')
    try {
      const status = course.status === 'published' ? 'published' : 'draft'
      const body = await saveCourse(corePayload(course, modules, status))
      if (!body?.ok) throw new Error(body?.error || 'Saqlanmadi')
      const lessonIds = (body.lessons || []).map((l) => l.id)
      let i = 0
      const nextModules = modules.map((m) => ({ ...m, lessons: m.lessons.map((l) => { const lid = lessonIds[i++] || l.id; return { ...l, id: lid } }) }))
      setModules(nextModules)
      const extra = await saveExtras(body.id, extrasPayload(course, nextModules, lessonIds))
      if (extra.legacy) setLegacy(true)
      setCourse((c) => ({ ...c, id: body.id, status: c.status === 'review' ? 'draft' : c.status }))
      setDirty(false)
      setSavedAt(new Date())
      if (isNew) navigate(`${BASE}/kurslar/${body.id}/tahrir?qadam=${step + 1}`, { replace: true })
      return { id: body.id, lessonIds, modules: nextModules }
    } catch (e) {
      if (!quiet) setError(courseError(e))
      return null
    } finally {
      setBusy(false)
    }
  }

  const goStep = async (n) => {
    if (dirty && (course.id || course.title.trim()) && !shot) await persist({ quiet: true })
    const next = new URLSearchParams(params)
    next.set('qadam', String(n + 1))
    setParams(next, { replace: false })
    window.scrollTo({ top: 0 })
  }

  const patchLessonByKey = (key, p) => setModules((ms) => ms.map((m) => ({ ...m, lessons: m.lessons.map((l) => (l.key === key ? { ...l, ...p } : l)) })))

  const onVideo = async (key, file) => {
    setError('')
    let lesson = flatLessons(modules).find((l) => l.key === key)
    if (!lesson) return
    if (!lesson.id) {
      const saved = await persist()
      if (!saved) return
      lesson = flatLessons(saved.modules).find((l) => l.key === key)
      if (!lesson?.id) return
    }
    patchLessonByKey(key, { uploadPct: 1, encodingStatus: 'uploading' })
    try {
      const res = await videoHost().upload(lesson.id, file, lesson.title || course.title, (sent, total) => {
        patchLessonByKey(key, { uploadPct: Math.max(1, Math.min(99, Math.round((sent / total) * 100))) })
      })
      patchLessonByKey(key, { uploadPct: 100, encodingStatus: res.encoding, durationSeconds: res.duration, bunnyVideoId: res.videoId })
    } catch (e) {
      patchLessonByKey(key, { uploadPct: 0, encodingStatus: lesson.bunnyVideoId ? lesson.encodingStatus : 'failed' })
      setError(e.message || 'Video yuklanmadi')
    }
  }

  const onGenerate = async (key) => {
    if (shot) return
    const lesson = flatLessons(modules).find((l) => l.key === key)
    if (!lesson?.id || lesson.encodingStatus !== 'finished') { setError('Video tayyor bo‘lgach AI savol tuza oladi'); return }
    try {
      const started = await startQuizFromVideo(lesson.id)
      setJobs((m) => ({ ...m, [lesson.id]: started.job }))
      const token = { cancelled: false }
      const prev = polls.current.get(lesson.id)
      if (prev) prev.cancelled = true
      polls.current.set(lesson.id, token)
      while (!token.cancelled) {
        await new Promise((r) => setTimeout(r, 1800))
        const body = await pollQuizJob(lesson.id, started.job.id)
        const job = body?.job
        if (!job || token.cancelled) return
        setJobs((m) => ({ ...m, [lesson.id]: job }))
        if (job.status === 'ready') {
          const ai = (job.questions || []).map((q, i) => ({ key: `ai-${i}-${Date.now()}`, prompt: q.prompt || '', options: q.options?.length ? q.options : ['', ''], correctIndex: Number(q.correctIndex) || 0, explanation: q.explanation || '', source: 'ai' }))
          setMods((ms) => ms.map((m) => ({ ...m, lessons: m.lessons.map((l) => (l.key === key ? { ...l, questions: [...(l.questions || []).filter((q) => q.source !== 'ai'), ...ai] } : l)) })))
          return
        }
        if (job.status === 'failed') return
      }
    } catch (e) {
      setError(e.message || 'AI savol tuzmadi')
    }
  }

  const onSubmit = async () => {
    const saved = dirty || !course.id ? await persist() : { id: course.id }
    if (!saved?.id) return
    setBusy(true)
    try {
      const res = await setCourseStatus(saved.id, 'submit')
      setCourse((c) => ({ ...c, id: saved.id, status: res?.status || 'review', moderationNote: '' }))
      navigate(`${BASE}/kurslar`, { state: { toast: res?.status === 'published' ? 'Kurs nashr qilindi' : 'Kurs moderatsiyaga yuborildi' } })
    } catch (e) {
      setError(courseError(e))
    } finally {
      setBusy(false)
    }
  }

  const stepView = (() => {
    if (loading) return <div className="h-[420px] animate-pulse rounded-2xl bg-white" />
    switch (STEPS[step].key) {
      case 'asosiy': return <StepBasics course={course} patch={patch} onError={setError} shot={!!shot} />
      case 'auditoriya': return <StepAudience course={course} patch={patch} />
      case 'dastur': return <Curriculum modules={modules} setModules={setMods} selected={selected} setSelected={setSelected} onVideo={onVideo} onGenerate={onGenerate} jobs={jobs} videoReady={videoReady} />
      case 'narx': return <StepPricing course={course} patch={patch} />
      case 'sertifikat': return <StepCertificate course={course} modules={modules} patch={patch} authorName={authorName} />
      default: return <StepReview course={course} modules={modules} onGo={goStep} onPreview={() => setPreview(true)} onSubmit={onSubmit} busy={busy} legacy={legacy} />
    }
  })()

  const saveLabel = busy ? 'Saqlanmoqda…' : dirty ? 'Saqlanmagan o‘zgarishlar' : savedAt ? `Saqlandi ${String(savedAt.getHours()).padStart(2, '0')}:${String(savedAt.getMinutes()).padStart(2, '0')}` : course.id ? 'Saqlangan' : 'Yangi qoralama'

  return (
    <div className="min-h-dvh md:min-h-0">
      {/* Yuqori panel */}
      <div className="sticky top-0 z-30 border-b border-[#E4ECEE] bg-white/95 backdrop-blur">
        <div className="flex h-14 items-center gap-2 px-2 md:h-16 md:gap-3 md:px-8">
          <Link to={`${BASE}/kurslar`} aria-label="Kurslarimga qaytish" className="grid size-11 shrink-0 place-items-center rounded-xl text-[#3F5263] hover:bg-[#EEF3F5]"><X className="size-5 md:hidden" /><ArrowLeft className="hidden size-5 md:block" /></Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-[15px] font-bold text-[#0B1F3A] md:text-[16px]">{course.title.trim() || (isNew ? 'Yangi kurs' : 'Nomsiz kurs')}</p>
              <StatusPill status={course.status} className="hidden md:inline-flex" />
            </div>
            <p className={cx('truncate text-[11.5px]', dirty ? 'text-[#9A5B00]' : 'text-[#7A8C99]')}>
              <span className="md:hidden">{step + 1}/{STEPS.length} · </span>{saveLabel}
            </p>
          </div>
          <button type="button" onClick={() => persist()} disabled={busy || (!dirty && !!course.id)} className={cx(btn.ghost, 'min-h-11 shrink-0 px-3 md:px-4')}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}<span className="hidden sm:inline">Saqlash</span>
          </button>
        </div>
        <div className="h-1 bg-[#EEF3F5] md:hidden"><div className="h-full bg-[#0F766E] transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
        {/* Qadamlar (kompyuter) */}
        <ol className="hidden items-center gap-1 overflow-x-auto px-8 pb-3 md:flex">
          {STEPS.map((s, i) => (
            <li key={s.key} className="flex shrink-0 items-center">
              <button type="button" onClick={() => goStep(i)} className={cx('flex min-h-10 items-center gap-2 rounded-xl px-2.5 text-[13px] font-semibold transition', i === step ? 'bg-[#E9F6F4] text-[#0F766E]' : i < step ? 'text-[#0B1F3A] hover:bg-[#F4F8F9]' : 'text-[#8A9AA8] hover:bg-[#F4F8F9]')}>
                <span className={cx('grid size-6 place-items-center rounded-full text-[11.5px] font-bold', i === step ? 'bg-[#0F766E] text-white' : i < step ? 'bg-[#D3EFE9] text-[#0F766E]' : 'bg-[#EEF3F5] text-[#8A9AA8]')}>{i < step ? <Check className="size-3.5" /> : i + 1}</span>
                {s.label}
              </button>
              {i < STEPS.length - 1 && <span className="mx-1 h-px w-5 bg-[#DCE6E9] xl:w-8" />}
            </li>
          ))}
        </ol>
      </div>

      <div className="px-4 pb-[calc(112px+max(env(safe-area-inset-bottom),var(--safe-bottom-sim,0px)))] pt-4 md:px-8 md:pb-28 md:pt-6">
        <div className="mb-4 md:mb-5">
          <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#0F766E]">{step + 1}-qadam · {STEPS.length} tadan</p>
          <h1 className="mt-1 text-[21px] font-extrabold leading-tight tracking-tight text-[#0B1F3A] md:text-[24px]">{STEPS[step].title}</h1>
          <p className="mt-1 text-[13.5px] text-[#5B6F7E]">{STEPS[step].hint}</p>
        </div>
        <MigrationNotice show={legacy && !shot?.hideNotice} text="Til, treyler, «Nimalarni o‘rganasiz», «Kimlar uchun», dars bandlari, materiallar, chegirma va sertifikat sozlamalari 0078 migratsiyasi qo‘llangach saqlanadi. Asosiy kurs, darslar, video va testlar hozir ham saqlanadi." />
        {course.status === 'review' && step !== STEPS.length - 1 && <p className="mb-4 rounded-2xl border border-[#F8DFAE] bg-[#FFFAF0] px-4 py-3 text-[13px] text-[#7A4B00]">Kurs moderatsiyada. O‘zgarishni saqlasangiz, kurs qoralamaga qaytadi va qayta yuborish kerak bo‘ladi.</p>}
        {error && <p role="alert" className="mb-4 flex items-start justify-between gap-3 rounded-2xl border border-[#F4C7C7] bg-[#FFF5F5] px-4 py-3 text-[13.5px] text-[#B42318]"><span>{error}</span><button type="button" aria-label="Yopish" onClick={() => setError('')} className="-m-2 grid size-10 place-items-center"><X className="size-4" /></button></p>}
        {stepView}
      </div>

      {/* Pastki panel */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E4ECEE] bg-white/95 pb-[max(env(safe-area-inset-bottom),var(--safe-bottom-sim,0px))] backdrop-blur md:left-[248px]">
        <div className="flex items-center gap-2 px-4 py-3 md:px-8">
          <button type="button" onClick={() => goStep(step - 1)} disabled={step === 0} className={cx(btn.ghost, 'min-h-12 px-4 disabled:invisible')}><ArrowLeft className="size-4" /><span className="hidden sm:inline">Orqaga</span></button>
          <span className="hidden flex-1 text-center text-[12.5px] text-[#7A8C99] md:block">{step + 1}-qadam: {STEPS[step].label}</span>
          <span className="flex-1 md:hidden" />
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={() => goStep(step + 1)} disabled={busy} className={cx(btn.primary, 'min-h-12 min-w-[168px]')}>Keyingi: {STEPS[step + 1].label}<ArrowRight className="size-4" /></button>
          ) : (
            <button type="button" onClick={() => setPreview(true)} className={cx(btn.soft, 'min-h-12 min-w-[168px]')}>Oldindan ko‘rish</button>
          )}
        </div>
      </div>

      <PreviewOverlay open={preview} course={course} modules={modules} onClose={() => setPreview(false)} authorName={authorName} avatar={session.profile?.avatar_url || ''} />
    </div>
  )
}
