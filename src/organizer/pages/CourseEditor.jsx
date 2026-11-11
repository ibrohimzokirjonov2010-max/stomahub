import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronDown, ChevronUp, Plus, Sparkles, Trash2, Upload } from 'lucide-react'
import { directions, formats, levels } from '../../educationData'
import { courseError, devShot, loadEditor, pollQuizJob, refreshVideo, saveCourse, startQuizFromVideo, uploadLessonVideo } from '../../courseApi'
import { uploadImage } from './wizardBits'
import { encodingLabel } from '../../components/course/LessonPlayer'

const blankLesson = () => ({
  key: `new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  title: '',
  description: '',
  moduleTitle: '',
  passThreshold: 70,
  points: 10,
  bunnyVideoId: '',
  encodingStatus: 'empty',
  durationSeconds: 0,
  questions: [],
  uploadPct: 0,
})

const blankQuestion = () => ({ prompt: '', options: ['', ''], correctIndex: 0 })

function clock(totalSeconds) {
  const sec = Math.max(0, Math.round(Number(totalSeconds) || 0))
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
}

function aiQuestions(list) {
  return (list || []).map((item) => ({
    prompt: item.prompt || '',
    options: item.options || ['', '', '', ''],
    correctIndex: Number(item.correctIndex) || 0,
    explanation: item.explanation || '',
    quote: item.quote || '',
    timestampSec: Number(item.timestampSec) || 0,
    source: 'ai',
  }))
}

export default function CourseEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const shot = devShot('editor')
  const [course, setCourse] = useState(shot?.course || {
    title: '', description: '', direction: 'endo', level: 'bosh', format: 'kurs', price: 0, coverUrl: '', status: 'draft',
  })
  const [lessons, setLessons] = useState(shot?.lessons || [blankLesson()])
  const [jobs, setJobs] = useState(() => {
    const map = {}
    for (const lesson of shot?.lessons || []) if (lesson.aiJob) map[lesson.id] = lesson.aiJob
    return map
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(shot?.error || '')
  const [savedId, setSavedId] = useState(id && id !== 'yangi' ? id : (shot?.course?.id || ''))
  const awaiting = useRef(new Set(shot?.awaiting || []))
  const polls = useRef(new Map())

  const applyDraft = (lessonId, job) => {
    if (!job || job.status !== 'ready') return
    setLessons((list) => list.map((lesson) => {
      if (lesson.id !== lessonId) return lesson
      const manual = (lesson.questions || []).filter((item) => item.source !== 'ai')
      return { ...lesson, questions: [...manual, ...aiQuestions(job.questions)], transcriptClean: job.transcript || lesson.transcriptClean || '' }
    }))
  }

  const watchJob = (lessonId, jobId) => {
    if (!lessonId || !jobId || shot) return
    const prev = polls.current.get(lessonId)
    if (prev) prev.cancelled = true
    const token = { cancelled: false }
    polls.current.set(lessonId, token)
    const loop = async () => {
      while (!token.cancelled) {
        try {
          const body = await pollQuizJob(lessonId, jobId)
          if (token.cancelled) return
          const job = body.job
          if (!job) return
          setJobs((map) => ({ ...map, [lessonId]: job }))
          if (job.transcript) {
            setLessons((list) => list.map((lesson) => lesson.id === lessonId ? { ...lesson, transcriptClean: job.transcript } : lesson))
          }
          if (job.status === 'ready') {
            if (awaiting.current.has(lessonId)) {
              awaiting.current.delete(lessonId)
              applyDraft(lessonId, job)
            }
            return
          }
          if (job.status === 'failed') return
        } catch (e) {
          if (!token.cancelled) setError(e.message || 'Savol tuzilmadi')
          return
        }
        await new Promise((resolve) => setTimeout(resolve, 1600))
      }
    }
    loop()
  }

  useEffect(() => () => {
    for (const token of polls.current.values()) token.cancelled = true
  }, [])

  useEffect(() => {
    if (shot || !id || id === 'yangi') return undefined
    let stop = false
    loadEditor(id).then((body) => {
      if (stop) return
      if (!body?.ok) { setError(body?.error || 'Kurs ochilmadi'); return }
      setCourse(body.course)
      setSavedId(body.course.id)
      setLessons((body.lessons || []).map((lesson) => ({ ...lesson, key: lesson.id, uploadPct: 0, questions: (lesson.questions || []).map((q) => ({ ...q, options: q.options || ['', ''] })) })))
      const withVideo = (body.lessons || []).filter((lesson) => lesson.bunnyVideoId && lesson.encodingStatus === 'finished')
      withVideo.forEach((lesson) => {
        pollQuizJob(lesson.id).then((res) => {
          if (stop || !res?.job) return
          setJobs((map) => ({ ...map, [lesson.id]: res.job }))
          if (!['ready', 'failed'].includes(res.job.status)) {
            awaiting.current.add(lesson.id)
            watchJob(lesson.id, res.job.id)
          }
        }).catch(() => {})
      })
    }).catch((e) => { if (!stop) setError(courseError(e)) })
    return () => { stop = true }
  }, [id])

  useEffect(() => {
    const pending = lessons.filter((lesson) => lesson.id && ['created', 'processing', 'uploading'].includes(lesson.encodingStatus))
    if (!pending.length) return undefined
    const timer = setInterval(() => {
      pending.forEach((lesson) => {
        refreshVideo(lesson.id).then((res) => {
          setLessons((list) => list.map((item) => item.id === lesson.id ? { ...item, encodingStatus: res.encoding, durationSeconds: res.duration, bunnyVideoId: res.videoId || item.bunnyVideoId } : item))
        }).catch(() => {})
      })
    }, 5000)
    return () => clearInterval(timer)
  }, [lessons.map((lesson) => `${lesson.id}:${lesson.encodingStatus}`).join('|')])

  const patchLesson = (key, patch) => setLessons((list) => list.map((lesson) => lesson.key === key ? { ...lesson, ...patch } : lesson))

  const payload = (status) => ({
    id: savedId || undefined,
    title: course.title,
    description: course.description,
    direction: course.direction,
    level: course.level,
    format: course.format,
    price: Number(course.price) || 0,
    coverUrl: course.coverUrl || '',
    status,
    lessons: lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      moduleTitle: lesson.moduleTitle,
      passThreshold: Number(lesson.passThreshold) || 70,
      points: Number(lesson.points) || 0,
      questions: (lesson.questions || []).filter((q) => q.prompt.trim()).map((q) => ({
        prompt: q.prompt,
        options: q.options.map((option) => option.trim()).filter(Boolean),
        correctIndex: Number(q.correctIndex) || 0,
      })),
    })),
  })

  const persist = async (status, { redirect = true } = {}) => {
    setBusy(true)
    setError('')
    try {
      const body = await saveCourse(payload(status))
      if (!body?.ok) throw new Error(body?.error || 'Saqlanmadi')
      const nextLessons = lessons.map((lesson, index) => ({ ...lesson, id: body.lessons?.[index]?.id || lesson.id, key: body.lessons?.[index]?.id || lesson.key }))
      setLessons(nextLessons)
      setSavedId(body.id)
      if (redirect && (!id || id === 'yangi')) navigate(`/tashkilotchi/kurslar/${body.id}`, { replace: true })
      return { id: body.id, lessons: nextLessons }
    } catch (e) {
      setError(courseError(e))
      return null
    } finally {
      setBusy(false)
    }
  }

  const onCover = async (file) => {
    try {
      const url = await uploadImage(file, 'courses')
      setCourse((c) => ({ ...c, coverUrl: url }))
    } catch (e) { setError(e.message || 'Muqova yuklanmadi') }
  }

  const onVideo = async (lesson, file) => {
    if (!file) return
    setError('')
    let current = lesson
    let courseId = savedId
    if (!lesson.id) {
      const saved = await persist('draft', { redirect: false })
      courseId = saved?.id || courseId
      current = saved?.lessons.find((item) => item.key === lesson.key || item.title === lesson.title) || saved?.lessons[lessons.indexOf(lesson)]
      if (!current?.id) return
    }
    patchLesson(current.key || lesson.key, { uploadPct: 1, encodingStatus: 'uploading' })
    try {
      const res = await uploadLessonVideo(current.id, file, current.title || course.title, (sent, total) => {
        patchLesson(current.key || lesson.key, { uploadPct: Math.max(1, Math.round((sent / total) * 100)) })
      })
      patchLesson(current.key || lesson.key, { uploadPct: 100, encodingStatus: res.encoding, durationSeconds: res.duration, bunnyVideoId: res.videoId })
      if ((!id || id === 'yangi') && courseId) navigate(`/tashkilotchi/kurslar/${courseId}`, { replace: true })
    } catch (e) {
      patchLesson(current.key || lesson.key, { uploadPct: 0, encodingStatus: 'failed' })
      setError(e.message || 'Video yuklanmadi')
    }
  }

  const onGenerate = async (lesson) => {
    if (shot) return
    const hasAi = (lesson.questions || []).some((item) => item.source === 'ai')
    if (hasAi && typeof window !== 'undefined' && !window.confirm('Yangi savollar oldingi AI qoralamasini almashtiradi. Qo‘lda yozilgan savollar qoladi.')) return
    setError('')
    let current = lesson
    if (!current.id) {
      const saved = await persist('draft', { redirect: false })
      current = saved?.lessons.find((item) => item.key === lesson.key) || saved?.lessons[lessons.indexOf(lesson)]
      if (!current?.id) return
    }
    if (!current.bunnyVideoId || current.encodingStatus !== 'finished') {
      setError('Video tayyor bo‘lgach, AI savol tuza oladi.')
      return
    }
    try {
      const started = await startQuizFromVideo(current.id)
      awaiting.current.add(current.id)
      setJobs((map) => ({ ...map, [current.id]: started.job }))
      watchJob(current.id, started.job.id)
    } catch (e) {
      setError(e.message || 'Savol tuzilmadi')
    }
  }

  return (
    <div className="mx-auto max-w-[860px] pb-8">
      <Link to="/tashkilotchi/kurslar" className="text-[12.5px] font-semibold text-[#0F766E]">← Kurslar</Link>
      <h1 className="mt-1 text-[22px] font-extrabold text-[#10283F]">{savedId ? 'Kursni tahrirlash' : 'Yangi kurs'}</h1>
      <p className="mt-1 text-[13px] text-[#5b7280]">Video brauzerdan to‘g‘ridan-to‘g‘ri Bunny’ga ketadi. 1 GB va undan katta fayl ham serverdan o‘tmaydi.</p>

      <div className="mt-4 grid gap-3 rounded-2xl bg-white p-4 shadow-card">
        <Field label="Nomi">
          <input value={course.title} onChange={(e) => setCourse({ ...course, title: e.target.value })} className={input} placeholder="Masalan, Kanalni kengaytirish protokoli" />
        </Field>
        <Field label="Tavsif">
          <textarea value={course.description} onChange={(e) => setCourse({ ...course, description: e.target.value })} className={`${input} h-24 py-2`} placeholder="Kimlar uchun va nima o‘rganiladi" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Select label="Yo‘nalish" value={course.direction} onChange={(direction) => setCourse({ ...course, direction })} items={directions.filter(([k]) => k !== 'all')} />
          <Select label="Daraja" value={course.level} onChange={(level) => setCourse({ ...course, level })} items={levels.filter(([k]) => k !== 'all')} />
          <Select label="Format" value={course.format} onChange={(format) => setCourse({ ...course, format })} items={formats.filter(([k]) => k !== 'all')} />
        </div>
        <div className="grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)]">
          <Field label="Narx, so‘m (0 — bepul)">
            <input inputMode="numeric" value={course.price} onChange={(e) => setCourse({ ...course, price: e.target.value.replace(/\D/g, '') })} className={input} />
          </Field>
          <Field label="Muqova">
            <div className="flex items-center gap-3">
              {course.coverUrl && <img src={course.coverUrl} alt="" className="h-14 w-20 rounded-lg object-cover" />}
              <label className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-[#d5e4e2] px-3 text-[13px] font-semibold text-[#0F766E]">
                <Upload className="size-4" /> Rasm
                <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => { onCover(e.target.files?.[0]); e.target.value = '' }} />
              </label>
            </div>
          </Field>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <h2 className="text-[16px] font-bold text-[#10283F]">Darslar</h2>
        <button type="button" onClick={() => setLessons((list) => [...list, blankLesson()])} className="inline-flex h-9 items-center gap-1 rounded-xl border border-[#0F766E] px-3 text-[13px] font-semibold text-[#0F766E]">
          <Plus className="size-4" /> Dars
        </button>
      </div>

      <div className="mt-2 flex flex-col gap-3">
        {lessons.map((lesson, index) => (
          <article key={lesson.key} className="rounded-2xl bg-white p-3 shadow-card">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 sm:contents">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#e7f6f4] text-[12px] font-bold text-[#0F766E]">{index + 1}</span>
                <span className="ml-auto flex sm:hidden">
                  <LessonOrder index={index} count={lessons.length} onMove={(dir) => setLessons((list) => move(list, index, dir))} onRemove={() => setLessons((list) => list.filter((item) => item.key !== lesson.key))} />
                </span>
              </div>
              <input value={lesson.title} onChange={(e) => patchLesson(lesson.key, { title: e.target.value })} className={`${input} min-w-0 flex-1 font-semibold`} placeholder="Dars nomi" />
              <span className="hidden shrink-0 sm:flex">
                <LessonOrder index={index} count={lessons.length} onMove={(dir) => setLessons((list) => move(list, index, dir))} onRemove={() => setLessons((list) => list.filter((item) => item.key !== lesson.key))} />
              </span>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <input value={lesson.moduleTitle} onChange={(e) => patchLesson(lesson.key, { moduleTitle: e.target.value })} className={input} placeholder="Modul nomi (ixtiyoriy)" />
              <input value={lesson.description} onChange={(e) => patchLesson(lesson.key, { description: e.target.value })} className={input} placeholder="Qisqa tavsif" />
            </div>
            <div className="mt-3 rounded-xl bg-[#f6fbfb] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[13px] font-semibold text-[#143044]">Video · {encodingLabel(lesson.encodingStatus)}{lesson.durationSeconds ? ` · ${Math.round(lesson.durationSeconds / 60)} daq` : ''}</p>
                <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-[#0F766E] px-3 text-[12.5px] font-semibold text-white">
                  <Upload className="size-3.5" /> Video yuklash
                  <input type="file" accept="video/*" className="hidden" onChange={(e) => { onVideo(lesson, e.target.files?.[0]); e.target.value = '' }} />
                </label>
              </div>
              {lesson.uploadPct > 0 && lesson.uploadPct < 100 && (
                <div className="mt-2">
                  <div className="h-1.5 overflow-hidden rounded-full bg-white"><div className="h-full bg-[#0F766E]" style={{ width: `${lesson.uploadPct}%` }} /></div>
                  <p className="mt-1 text-[12px] text-[#0F766E]">Yuklanmoqda {lesson.uploadPct}%. Katta faylda sahifani yopmang.</p>
                </div>
              )}
              {lesson.encodingStatus === 'failed' && <p className="mt-2 text-[12px] text-[#b42318]">Yuklash yoki qayta ishlashda xato. Qayta urinib ko‘ring.</p>}
              <AiQuizPanel
                lesson={lesson}
                job={jobs[lesson.id]}
                onGenerate={() => onGenerate(lesson)}
                onApply={() => applyDraft(lesson.id, jobs[lesson.id])}
              />
            </div>
            <QuizEditor lesson={lesson} onChange={(questions) => patchLesson(lesson.key, { questions })} onThreshold={(passThreshold) => patchLesson(lesson.key, { passThreshold })} onPoints={(points) => patchLesson(lesson.key, { points })} />
          </article>
        ))}
      </div>

      {error && <p className="mt-3 rounded-xl bg-[#fff4f4] px-3 py-2 text-[13px] text-[#b42318]">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => persist('draft')} className="h-11 rounded-xl border border-[#0F766E] px-4 text-[13.5px] font-semibold text-[#0F766E] disabled:opacity-50">Qoralama</button>
        <button type="button" disabled={busy} onClick={() => persist('published')} className="h-11 rounded-xl bg-[#0F766E] px-4 text-[13.5px] font-semibold text-white disabled:opacity-50">{busy ? 'Saqlanmoqda…' : 'Nashr qilish'}</button>
      </div>
    </div>
  )
}

function AiQuizPanel({ lesson, job, onGenerate, onApply }) {
  const running = job && !['ready', 'failed'].includes(job.status)
  const readyVideo = lesson.encodingStatus === 'finished' && lesson.bunnyVideoId
  const transcript = lesson.transcriptClean || (job?.status === 'ready' ? job.transcript : '')
  const state = running ? 'progress' : job?.status === 'failed' ? 'error' : job?.status === 'ready' ? 'draft' : 'button'
  return (
    <div className="mt-3 border-t border-[#e3eeec] pt-3" data-quiz-state={state}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12.5px] leading-snug text-[#5b7280]">Videodagi faktlardan test. Saqlamaguningizcha talabaga chiqmaydi.</p>
        <button
          type="button"
          onClick={onGenerate}
          disabled={!readyVideo || running}
          aria-busy={running ? 'true' : 'false'}
          className="inline-flex h-9 w-full shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[#0F766E] px-3 text-[12.5px] font-semibold text-[#0F766E] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          <Sparkles className="size-3.5" />
          {running ? 'Tuzilmoqda…' : (job?.status === 'ready' || job?.status === 'failed' ? 'Qayta tuzish' : 'AI bilan savol tuzish')}
        </button>
      </div>
      {!readyVideo && <p className="mt-2 text-[12px] text-[#5b7280]">Video tayyor bo‘lgach, AI savol tuza oladi.</p>}
      {running && (
        <div className="mt-2" data-quiz-state="progress">
          <div className="h-1.5 overflow-hidden rounded-full bg-white">
            <div className="h-full bg-[#0F766E] transition-all" style={{ width: `${Math.max(6, job.progress || 0)}%` }} />
          </div>
          <p className="mt-1 text-[12px] text-[#0F766E]">{job.stage || 'Tayyorlanmoqda'} · {job.progress || 0}%</p>
        </div>
      )}
      {job?.status === 'failed' && (
        <p className="mt-2 rounded-lg bg-[#fff4f4] px-2.5 py-2 text-[12.5px] text-[#b42318]" data-quiz-state="error">{job.error || 'Savol tuzilmadi'}</p>
      )}
      {job?.status === 'ready' && (
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] text-[#0F766E]">Qoralama tayyor. Tahrirlang, keragimasini o‘chiring, so‘ng saqlang.</p>
          <button type="button" onClick={onApply} className="h-8 rounded-lg bg-[#e7f6f4] px-3 text-[12px] font-semibold text-[#0F766E]">Savollarni joylash</button>
        </div>
      )}
      {transcript && (
        <details className="mt-2 rounded-lg bg-white px-2.5 py-2" open={Boolean(devShot('editor') && job?.status === 'ready') || undefined}>
          <summary className="cursor-pointer text-[12.5px] font-semibold text-[#143044]">Tozalangan matn</summary>
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap font-sans text-[12px] leading-relaxed text-[#3d5160]">{transcript}</pre>
        </details>
      )}
    </div>
  )
}

function QuizEditor({ lesson, onChange, onThreshold, onPoints }) {
  const questions = lesson.questions || []
  const patchQ = (index, patch) => onChange(questions.map((q, i) => i === index ? { ...q, ...patch } : q))
  return (
    <div className="mt-3">
      {(questions.some((item) => item.source === 'ai')) && (
        <p className="mb-2 rounded-lg bg-[#f3fbf8] px-2.5 py-2 text-[12px] text-[#0F766E]">AI qoralama. Izoh va iqtibos faqat tekshirish uchun — testda chiqmaydi. Talaba savolni siz saqlagandan keyin ko‘radi.</p>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-[12px] text-[#5b7280]">O‘tish bali %
          <input value={lesson.passThreshold} onChange={(e) => onThreshold(e.target.value.replace(/\D/g, ''))} className={`${input} mt-1 w-24`} />
        </label>
        <label className="text-[12px] text-[#5b7280]">Ball
          <input value={lesson.points} onChange={(e) => onPoints(e.target.value.replace(/\D/g, ''))} className={`${input} mt-1 w-24`} />
        </label>
        <button type="button" onClick={() => onChange([...questions, blankQuestion()])} className="mb-0.5 inline-flex h-10 items-center gap-1 text-[13px] font-semibold text-[#0F766E]">
          <Plus className="size-4" /> Savol
        </button>
      </div>
      {questions.map((q, qi) => (
        <div key={qi} className="mt-2 rounded-xl border border-[#e3eeec] p-3">
          <div className="flex gap-2">
            <input value={q.prompt} onChange={(e) => patchQ(qi, { prompt: e.target.value })} className={input} placeholder={`${qi + 1}-savol`} />
            <button type="button" aria-label="Savolni o‘chirish" onClick={() => onChange(questions.filter((_, i) => i !== qi))} className="grid size-10 shrink-0 place-items-center text-[#b42318]"><Trash2 className="size-4" /></button>
          </div>
          <div className="mt-2 flex flex-col gap-1.5">
            {q.options.map((option, oi) => (
              <label key={oi} className="flex items-center gap-2">
                <input type="radio" name={`correct-${lesson.key}-${qi}`} checked={Number(q.correctIndex) === oi} onChange={() => patchQ(qi, { correctIndex: oi })} />
                <input value={option} onChange={(e) => patchQ(qi, { options: q.options.map((item, i) => i === oi ? e.target.value : item) })} className={input} placeholder={`${oi + 1}-variant`} />
              </label>
            ))}
          </div>
          {q.options.length < 6 && (
            <button type="button" onClick={() => patchQ(qi, { options: [...q.options, ''] })} className="mt-2 text-[12px] font-semibold text-[#0F766E]">Variant qo‘shish</button>
          )}
          {(q.explanation || q.quote) && (
            <div className="mt-2 rounded-lg bg-[#f6fbfb] px-2.5 py-2 text-[12px] leading-relaxed text-[#3d5160]">
              {q.explanation && <p>{q.explanation}</p>}
              {q.quote && <p className="mt-1 text-[#5b7280]">“{q.quote}”{Number.isFinite(Number(q.timestampSec)) ? ` · ${clock(q.timestampSec)}` : ''}</p>}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function LessonOrder({ index, count, onMove, onRemove }) {
  return (
    <>
      <button type="button" aria-label="Yuqoriga" disabled={index === 0} onClick={() => onMove(-1)} className="grid size-8 shrink-0 place-items-center rounded-lg text-[#5b7280] disabled:opacity-30"><ChevronUp className="size-4" /></button>
      <button type="button" aria-label="Pastga" disabled={index === count - 1} onClick={() => onMove(1)} className="grid size-8 shrink-0 place-items-center rounded-lg text-[#5b7280] disabled:opacity-30"><ChevronDown className="size-4" /></button>
      <button type="button" aria-label="Darsni o‘chirish" onClick={onRemove} className="grid size-8 shrink-0 place-items-center rounded-lg text-[#b42318]"><Trash2 className="size-4" /></button>
    </>
  )
}

function move(list, index, dir) {
  const next = list.slice()
  const [row] = next.splice(index, 1)
  next.splice(index + dir, 0, row)
  return next
}

function Field({ label, children }) {
  return <label className="block text-[12px] font-medium text-[#5b7280]">{label}<div className="mt-1">{children}</div></label>
}

function Select({ label, value, onChange, items }) {
  return (
    <Field label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={input}>
        {items.map(([k, name]) => <option key={k} value={k}>{name}</option>)}
      </select>
    </Field>
  )
}

const input = 'h-10 w-full rounded-xl border border-[#e3eeec] bg-white px-3 text-[13.5px] text-[#143044] outline-none focus:border-[#0F766E]'
