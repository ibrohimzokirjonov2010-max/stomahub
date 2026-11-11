import { useState } from 'react'
import { Award, Check, ChevronDown, Clock, Lock, Play, RotateCcw } from 'lucide-react'
import { formatDuration, groupLessons } from '../../courseRules'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export function LessonPlayer({
  course,
  lessons,
  activeId,
  mobile,
  phase,
  message,
  videoUrl,
  poster,
  posterAsPlayer = false,
  onPickLesson,
  onNext,
  onEnroll,
  enrolling,
  quiz,
  result,
  onRetry,
  onOpenCert,
}) {
  const [listOpen, setListOpen] = useState(true)
  const active = lessons.find((lesson) => lesson.id === activeId) || lessons.find((lesson) => !lesson.locked) || lessons[0]
  const activeIndex = lessons.findIndex((lesson) => lesson.id === active?.id)
  const next = activeIndex >= 0 ? lessons[activeIndex + 1] : null
  const groups = groupLessons(lessons)
  const showList = !mobile || listOpen

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_332px]">
      <section className="min-w-0">
        <PlayerStage
          course={course}
          lesson={active}
          phase={phase}
          message={message}
          videoUrl={videoUrl}
          poster={poster}
          posterAsPlayer={posterAsPlayer}
          onEnroll={onEnroll}
          enrolling={enrolling}
          quiz={quiz}
          result={result}
          onRetry={onRetry}
          onNext={onNext}
          onOpenCert={onOpenCert}
          next={next}
        />
        {phase !== 'enroll' && active && phase !== 'quiz' && phase !== 'result' && (
          <div className="mt-3">
            <p className="text-[12px] font-semibold text-sea">{active.position}-dars{active.moduleTitle ? ` · ${active.moduleTitle}` : ''}</p>
            <h1 className="mt-0.5 text-[20px] font-extrabold leading-tight tracking-tight text-[#0d2a4a] md:text-[24px]">{active.title}</h1>
            {active.description && <p className="mt-1.5 whitespace-pre-line text-[13.5px] leading-relaxed text-[#4d6274]">{active.description}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {next && (
                <button type="button" disabled={next.locked} onClick={() => onNext?.(next)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-sea px-4 text-[13.5px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
                  Keyingi dars <Play className="size-3.5 fill-white" />
                </button>
              )}
              {!next && course?.completed && (
                <button type="button" onClick={onOpenCert} className="inline-flex h-11 items-center gap-2 rounded-xl bg-sea px-4 text-[13.5px] font-semibold text-white">
                  <Award className="size-4" /> Sertifikatni ko‘rish
                </button>
              )}
              {next?.locked && <span className="text-[12px] text-[#6b7c8f]">Keyingi dars avvalgi test topshirilgach ochiladi</span>}
            </div>
          </div>
        )}
      </section>

      <aside className="rounded-2xl bg-white p-3 shadow-card lg:sticky lg:top-3 lg:max-h-[calc(100vh-88px)] lg:overflow-y-auto">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-sea">Kurs</p>
            <h2 className="line-clamp-2 text-[14px] font-bold leading-snug text-[#0d2a4a]">{course?.title}</h2>
          </div>
          {mobile && (
            <button type="button" onClick={() => setListOpen((v) => !v)} aria-expanded={listOpen} className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#e7f6f4] px-2 text-[12px] font-semibold text-sea">
              Darslar <ChevronDown className={`size-3.5 transition ${listOpen ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
        <ProgressBar pct={course?.pct || 0} label={`${course?.done || 0}/${course?.lessons || lessons.length} dars`} />
        {showList && (
          <div className="mt-2">
            {groups.map((group) => (
              <div key={group.title || 'darslar'} className="mt-2">
                {group.title && <p className="px-1 pb-1 text-[11px] font-bold uppercase tracking-wide text-[#7d8ea0]">{group.title}</p>}
                <ol className="flex flex-col gap-0.5">
                  {group.lessons.map((lesson) => (
                    <LessonRow key={lesson.id} lesson={lesson} current={lesson.id === active?.id} onPick={() => onPickLesson?.(lesson)} />
                  ))}
                </ol>
              </div>
            ))}
          </div>
        )}
      </aside>
    </div>
  )
}

function ProgressBar({ pct, label }) {
  return (
    <div className="mt-2">
      <div className="mb-1 flex items-center justify-between text-[11px] text-[#6b7c8f]">
        <span>{label}</span>
        <span className="font-bold text-sea">{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#e5f2f0]">
        <div className="h-full rounded-full bg-sea" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
      </div>
    </div>
  )
}

function LessonRow({ lesson, current, onPick }) {
  const done = lesson.complete
  const locked = lesson.locked
  const ratio = Math.round((Number(lesson.watchedRatio) || 0) * 100)
  return (
    <li>
      <button type="button" disabled={locked} onClick={onPick} className={`flex w-full items-start gap-2.5 rounded-xl px-2 py-2 text-left ${current ? 'bg-[#e7f6f4]' : 'hover:bg-[#f6fbfb]'} disabled:cursor-not-allowed`}>
        <span className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-bold ${done ? 'bg-sea text-white' : current ? 'bg-white text-sea ring-2 ring-sea' : locked ? 'bg-[#eef2f4] text-[#8aa0b0]' : 'bg-[#e7f6f4] text-sea'}`}>
          {done ? <Check className="size-3.5" strokeWidth={3} /> : locked ? <Lock className="size-3.5" /> : lesson.position}
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block text-[13px] leading-snug ${locked ? 'text-[#8aa0b0]' : 'font-semibold text-[#143044]'}`}>{lesson.title}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#7d8ea0]">
            {lesson.encodingStatus && lesson.encodingStatus !== 'finished' && lesson.encodingStatus !== 'empty' ? 'Video tayyorlanmoqda' : formatDuration(lesson.durationSeconds) || 'Video'}
            {lesson.hasQuiz ? ' · test' : ''}
            {done ? ' · yakunlangan' : ''}
          </span>
          {!done && !locked && ratio > 0 && (
            <span className="mt-1 block h-1 overflow-hidden rounded-full bg-[#e5f2f0]"><span className="block h-full bg-sea" style={{ width: `${ratio}%` }} /></span>
          )}
        </span>
      </button>
    </li>
  )
}

function PlayerStage({ course, lesson, phase, message, videoUrl, poster, posterAsPlayer, onEnroll, enrolling, quiz, result, onRetry, onNext, onOpenCert, next }) {
  if (phase === 'loading') {
    return <div className="aspect-video animate-pulse rounded-2xl bg-[#d7e6e4]" />
  }
  if (phase === 'error') {
    return <StageFrame><p className="text-[14px] font-semibold text-white">{message || 'Kursni ochib bo‘lmadi'}</p></StageFrame>
  }
  if (phase === 'enroll') {
    return (
      <div className="overflow-hidden rounded-2xl bg-white shadow-card">
        <div className="relative aspect-[16/8] bg-[#0d3b3a]">
          {course?.cover ? <img src={course.cover} alt="" className="size-full object-cover opacity-80" /> : <div className="size-full bg-[linear-gradient(135deg,#0b6d73,#143044)]" />}
          <div className="absolute inset-0 bg-gradient-to-t from-[#071820] via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 text-white">
            <p className="text-[12px] font-semibold text-[#b7ebe4]">{course?.doctor}</p>
            <h1 className="mt-1 text-[22px] font-extrabold leading-tight md:text-[28px]">{course?.title}</h1>
          </div>
        </div>
        <div className="p-4">
          <p className="text-[13.5px] leading-relaxed text-[#4d6274]">{course?.about}</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[20px] font-extrabold text-[#0d2a4a]">{course?.price ? `${Number(course.price).toLocaleString('uz-UZ')} so‘m` : 'Bepul'}</p>
            {course?.price > 0 ? (
              <p className="max-w-[280px] text-[12.5px] text-[#6b7c8f]">Narx saqlanadi. To‘lov ulanmaguncha darslar yopiq — sinash uchun bepul kurs oching.</p>
            ) : (
              <button type="button" disabled={enrolling} onClick={onEnroll} className="h-11 rounded-xl bg-sea px-5 text-[14px] font-semibold text-white disabled:opacity-60">
                {enrolling ? 'Yozilmoqda…' : 'Bepul boshlash'}
              </button>
            )}
          </div>
          {message && <p className="mt-2 text-[12.5px] text-[#b42318]">{message}</p>}
        </div>
      </div>
    )
  }
  if (phase === 'quiz' && quiz) return <QuizCard quiz={quiz} lesson={lesson} />
  if (phase === 'result' && result) return <ResultCard result={result} onRetry={onRetry} onNext={() => onNext?.(next)} nextLocked={next?.locked} hasNext={!!next} onOpenCert={onOpenCert} />
  if (!lesson || lesson.locked) {
    return <StageFrame icon={Lock} title="Dars yopiq" text="Avvalgi darsni ko‘rib, testni topshiring. Keyingi dars shundan keyin ochiladi." />
  }
  if (lesson.encodingStatus && lesson.encodingStatus !== 'finished') {
    return <StageFrame icon={Clock} title="Video tayyorlanmoqda" text="Yuklangan video qayta ishlanmoqda. Bir necha daqiqa ichida shu yerda ochiladi — sahifani yopib, keyinroq qaytishingiz mumkin." />
  }
  if (!videoUrl && posterAsPlayer && poster) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-[#071820] shadow-[0_12px_40px_rgb(7_24_32/0.18)]">
        <img src={poster} alt="" className="size-full object-cover" />
        <span className="absolute inset-0 grid place-items-center bg-[#071820]/25">
          <span className="grid size-16 place-items-center rounded-full bg-white text-sea shadow-lg"><Play className="size-7 translate-x-0.5 fill-sea" /></span>
        </span>
        <span className="absolute bottom-3 left-3 rounded-md bg-black/65 px-2 py-1 text-[12px] font-medium text-white">{formatDuration(lesson?.durationSeconds) || 'Dars'}</span>
      </div>
    )
  }
  if (!videoUrl) {
    return <StageFrame icon={Play} title="Video hali yo‘q" text="Muallif dars videosini yuklagach, tomosha shu yerda boshlanadi." poster={poster} />
  }
  return (
    <div className="overflow-hidden rounded-2xl bg-[#071820] shadow-[0_12px_40px_rgb(7_24_32/0.18)]">
      <div className="relative aspect-video">
        <iframe
          key={videoUrl}
          src={videoUrl}
          title={lesson.title}
          className="absolute inset-0 size-full"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    </div>
  )
}

function StageFrame({ icon: Icon = Play, title, text, poster, children }) {
  return (
    <div className="relative grid aspect-video place-items-center overflow-hidden rounded-2xl bg-[#071820] text-center text-white shadow-[0_12px_40px_rgb(7_24_32/0.18)]">
      {poster && <img src={poster} alt="" className="absolute inset-0 size-full object-cover opacity-40" />}
      <div className="relative max-w-[420px] px-6">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-white/15"><Icon className="size-6" /></span>
        {title && <p className="mt-3 text-[16px] font-bold">{title}</p>}
        {text && <p className="mt-1 text-[13px] leading-relaxed text-white/80">{text}</p>}
        {children}
      </div>
    </div>
  )
}

function QuizCard({ quiz, lesson }) {
  const q = quiz.questions[quiz.index]
  const total = quiz.questions.length
  const picked = quiz.answers[q?.id]
  return (
    <div className="rounded-2xl bg-white p-4 shadow-card md:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] font-semibold text-sea">Test · {lesson?.title}</p>
        <p className="text-[12px] font-bold text-[#0d2a4a]">{quiz.index + 1} / {total}</p>
      </div>
      <div className="mt-2 flex gap-1">
        {quiz.questions.map((item, i) => (
          <span key={item.id} className={`h-1 flex-1 rounded-full ${i < quiz.index ? 'bg-sea' : i === quiz.index ? 'bg-sea/70' : 'bg-[#e5f2f0]'}`} />
        ))}
      </div>
      <h2 className="mt-4 text-[18px] font-bold leading-snug text-[#0d2a4a] md:text-[20px]">{q?.prompt}</h2>
      <div className="mt-3 flex flex-col gap-2">
        {(q?.options || []).map((option, i) => {
          const on = picked === i
          return (
            <button key={`${q.id}-${i}`} type="button" onClick={() => quiz.onPick(q.id, i)} className={`flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition ${on ? 'border-sea bg-[#f3fbfa]' : 'border-[#e3eeec] bg-white hover:border-sea/40'}`}>
              <span className={`grid size-7 shrink-0 place-items-center rounded-full text-[12px] font-bold ${on ? 'bg-sea text-white' : 'bg-[#eef4f4] text-[#5b7280]'}`}>{LETTERS[i] || i + 1}</span>
              <span className="pt-0.5 text-[14px] leading-snug text-[#143044]">{option}</span>
            </button>
          )
        })}
      </div>
      <p className="mt-3 text-[12px] text-[#6b7c8f]">O‘tish bali: {quiz.threshold}%. Javoblar yuborilguncha to‘g‘ri variant ko‘rsatilmaydi.</p>
      {quiz.error && <p className="mt-2 text-[12.5px] text-[#b42318]">{quiz.error}</p>}
      <div className="mt-4 flex gap-2">
        <button type="button" disabled={quiz.index === 0} onClick={quiz.onPrev} className="h-11 flex-1 rounded-xl border border-[#d5e4e2] text-[13.5px] font-semibold text-[#143044] disabled:opacity-40">Orqaga</button>
        {quiz.index < total - 1 ? (
          <button type="button" disabled={picked == null} onClick={quiz.onNext} className="h-11 flex-1 rounded-xl bg-sea text-[13.5px] font-semibold text-white disabled:opacity-40">Keyingi savol</button>
        ) : (
          <button type="button" disabled={quiz.busy || picked == null} onClick={quiz.onSubmit} className="h-11 flex-1 rounded-xl bg-sea text-[13.5px] font-semibold text-white disabled:opacity-40">{quiz.busy ? 'Tekshirilmoqda…' : 'Yakunlash'}</button>
        )}
      </div>
    </div>
  )
}

function ResultCard({ result, onRetry, onNext, nextLocked, hasNext, onOpenCert }) {
  const passed = !!result.passed
  return (
    <div className="rounded-2xl bg-white p-5 text-center shadow-card md:p-8">
      <ScoreRing score={result.score} passed={passed} />
      <h2 className="mt-3 text-[22px] font-extrabold text-[#0d2a4a]">{passed ? 'Test topshirildi' : 'Bu safar o‘tmadi'}</h2>
      <p className="mt-1 text-[14px] text-[#4d6274]">
        {result.correct != null ? `${result.correct}/${result.total} ta to‘g‘ri. ` : ''}
        O‘tish bali {result.threshold}%.
        {passed && result.pointsAwarded > 0 ? ` +${result.pointsAwarded} ball.` : ''}
      </p>
      {!passed && <p className="mt-1 text-[13px] text-[#6b7c8f]">To‘g‘ri javoblar ko‘rsatilmaydi. Qayta urinib ko‘ring.</p>}
      {result.certificate && <p className="mt-2 text-[13.5px] font-semibold text-sea">Kurs yakunlandi. Sertifikat tayyor.</p>}
      <div className="mx-auto mt-4 flex max-w-[420px] flex-col gap-2 sm:flex-row">
        {!passed && (
          <button type="button" onClick={onRetry} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-sea text-[13.5px] font-semibold text-sea">
            <RotateCcw className="size-4" /> Qayta topshirish
          </button>
        )}
        {passed && hasNext && (
          <button type="button" disabled={nextLocked} onClick={onNext} className="h-11 flex-1 rounded-xl bg-sea text-[13.5px] font-semibold text-white disabled:opacity-40">Keyingi dars</button>
        )}
        {passed && result.certificate && (
          <button type="button" onClick={onOpenCert} className="h-11 flex-1 rounded-xl bg-sea text-[13.5px] font-semibold text-white">Sertifikat</button>
        )}
      </div>
    </div>
  )
}

function ScoreRing({ score, passed }) {
  const r = 46
  const c = 2 * Math.PI * r
  const dash = c * (Math.max(0, Math.min(100, Number(score) || 0)) / 100)
  return (
    <svg viewBox="0 0 120 120" className="mx-auto size-28" aria-hidden>
      <circle cx="60" cy="60" r={r} fill="none" stroke="#e6f3f1" strokeWidth="8" />
      <circle cx="60" cy="60" r={r} fill="none" stroke={passed ? '#0F766E' : '#d14343'} strokeWidth="8" strokeDasharray={`${dash} ${c - dash}`} strokeLinecap="round" transform="rotate(-90 60 60)" />
      <text x="60" y="66" textAnchor="middle" fontSize="28" fontWeight="700" fill="#0d2a4a">{score}</text>
    </svg>
  )
}

export function encodingLabel(status) {
  if (status === 'finished') return 'Tayyor'
  if (status === 'failed') return 'Xato'
  if (status === 'processing' || status === 'created' || status === 'uploading') return 'Qayta ishlanmoqda'
  return 'Video yo‘q'
}
