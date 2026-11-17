import { useEffect, useRef, useState } from 'react'
import {
  ArrowDown, ArrowLeft, ArrowUp, CheckCircle2, ChevronRight, FileText, GripVertical, Link2, ListChecks, Loader2, Plus, Sparkles, Trash2, UploadCloud, Video, X,
} from 'lucide-react'
import { formatDuration } from '../../courseRules'
import { checkVideoFile, videoHost } from '../../lib/videoHost'
import { btn, cx, input } from '../ui'
import { Card, Field, ListEditor, Text } from './fields'
import { VideoBadge } from './steps'
import { blankLesson, blankModule, blankQuestion, lessonCount, totalDuration } from './model'

function moveItem(list, from, to) {
  const next = list.slice()
  const [row] = next.splice(from, 1)
  next.splice(Math.max(0, Math.min(next.length, to)), 0, row)
  return next
}

export default function Curriculum({ modules, setModules, selected, setSelected, onVideo, onAttachRef, onGenerate, jobs, videoReady }) {
  const drag = useRef(null)
  const all = modules.flatMap((m) => m.lessons)
  const current = all.find((l) => l.key === selected) || null
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!current && all[0]) setSelected(all[0].key)
  }, [current, all.length])

  const patchModule = (mk, p) => setModules((ms) => ms.map((m) => (m.key === mk ? { ...m, ...p } : m)))
  const patchLesson = (lk, p) => setModules((ms) => ms.map((m) => ({ ...m, lessons: m.lessons.map((l) => (l.key === lk ? { ...l, ...p } : l)) })))
  const addLesson = (mk) => {
    const lesson = blankLesson()
    setModules((ms) => ms.map((m) => (m.key === mk ? { ...m, lessons: [...m.lessons, lesson] } : m)))
    setSelected(lesson.key)
    setMobileOpen(true)
  }
  const addModule = () => {
    const mod = blankModule(modules.length + 1)
    setModules((ms) => [...ms, mod])
    setSelected(mod.lessons[0].key)
  }
  const removeLesson = (lk) => {
    if (all.length <= 1) return
    setModules((ms) => ms.map((m) => ({ ...m, lessons: m.lessons.filter((l) => l.key !== lk) })).filter((m) => m.lessons.length))
    if (selected === lk) setSelected(null)
    setMobileOpen(false)
  }
  const removeModule = (mk) => {
    if (modules.length <= 1) return
    setModules((ms) => ms.filter((m) => m.key !== mk))
  }
  const moveLesson = (lk, dir) => {
    setModules((ms) => {
      const flat = ms.flatMap((m) => m.lessons.map((l) => ({ l, mk: m.key })))
      const i = flat.findIndex((x) => x.l.key === lk)
      const j = i + dir
      if (i < 0 || j < 0 || j >= flat.length) return ms
      const target = flat[j].mk
      const from = flat[i].mk
      if (target === from) return ms.map((m) => (m.key === from ? { ...m, lessons: moveItem(m.lessons, m.lessons.findIndex((x) => x.key === lk), m.lessons.findIndex((x) => x.key === flat[j].l.key)) } : m))
      return ms.map((m) => {
        if (m.key === from) return { ...m, lessons: m.lessons.filter((x) => x.key !== lk) }
        if (m.key === target) return { ...m, lessons: dir > 0 ? [flat[i].l, ...m.lessons] : [...m.lessons, flat[i].l] }
        return m
      }).filter((m) => m.lessons.length)
    })
  }
  const dropLesson = (toModule, toIndex) => {
    const d = drag.current
    drag.current = null
    if (!d || d.type !== 'lesson') return
    setModules((ms) => {
      let row = null
      const without = ms.map((m) => {
        if (m.key !== d.module) return m
        row = m.lessons.find((l) => l.key === d.key)
        return { ...m, lessons: m.lessons.filter((l) => l.key !== d.key) }
      })
      if (!row) return ms
      return without.map((m) => {
        if (m.key !== toModule) return m
        const next = m.lessons.slice()
        next.splice(toIndex == null ? next.length : toIndex, 0, row)
        return { ...m, lessons: next }
      }).filter((m) => m.lessons.length)
    })
  }
  const dropModule = (toIndex) => {
    const d = drag.current
    drag.current = null
    if (!d || d.type !== 'module') return
    setModules((ms) => moveItem(ms, ms.findIndex((m) => m.key === d.key), toIndex))
  }

  let n = 0
  return (
    <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
      <div className="min-w-0">
        <div className="mb-3 flex items-center justify-between gap-2 rounded-2xl bg-[#0B1F3A] px-4 py-3 text-white">
          <span className="text-[13px] text-white/75">{modules.length} modul · {lessonCount(modules)} dars</span>
          <span className="text-[13px] font-semibold">{formatDuration(totalDuration(modules)) || '0 daqiqa'}</span>
        </div>
        <ol className="space-y-3">
          {modules.map((mod, mi) => (
            <li key={mod.key} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (drag.current?.type === 'module') dropModule(mi); else dropLesson(mod.key, null) }}
              className="rounded-2xl border border-[#E4ECEE] bg-white shadow-[0_1px_2px_rgb(16_40_60/0.04)]">
              <div className="flex items-center gap-1.5 border-b border-[#EEF3F5] px-2 py-2">
                <span draggable onDragStart={() => { drag.current = { type: 'module', key: mod.key } }} className="hidden cursor-grab p-1.5 text-[#B3C2C9] md:block" title="Sudrab tartiblang"><GripVertical className="size-4" /></span>
                <span className="ml-1 shrink-0 text-[11px] font-bold uppercase tracking-[0.1em] text-[#98A8B3] md:ml-0">M{mi + 1}</span>
                <input aria-label="Modul nomi" value={mod.title} maxLength={80} onChange={(e) => patchModule(mod.key, { title: e.target.value })} className="min-h-11 min-w-0 flex-1 rounded-lg bg-transparent px-2 text-[14px] font-bold text-[#0B1F3A] outline-none focus:bg-[#F4F8F9]" />
                {modules.length > 1 && <button type="button" aria-label="Modulni o‘chirish" onClick={() => removeModule(mod.key)} className="grid size-11 place-items-center rounded-lg text-[#98A8B3] hover:text-[#B42318]"><Trash2 className="size-4" /></button>}
              </div>
              <ul className="p-1.5">
                {mod.lessons.map((lesson, li) => {
                  n += 1
                  const active = lesson.key === selected
                  const qn = (lesson.questions || []).filter((q) => q.prompt?.trim()).length
                  return (
                    <li key={lesson.key} draggable onDragStart={() => { drag.current = { type: 'lesson', key: lesson.key, module: mod.key } }}
                      onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); e.stopPropagation(); dropLesson(mod.key, li) }}>
                      <button type="button" onClick={() => { setSelected(lesson.key); setMobileOpen(true) }}
                        className={cx('flex min-h-[56px] w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition', active ? 'bg-[#EFF8F6] ring-1 ring-[#BFE6DC]' : 'hover:bg-[#F6FAFA]')}>
                        <GripVertical className="hidden size-4 shrink-0 cursor-grab text-[#C3D0D6] md:block" />
                        <span className={cx('grid size-7 shrink-0 place-items-center rounded-lg text-[12px] font-bold', active ? 'bg-[#0F766E] text-white' : 'bg-[#EEF3F5] text-[#5B6F7E]')}>{n}</span>
                        <span className="min-w-0 flex-1">
                          <span className={cx('block truncate text-[13.5px] font-semibold', lesson.title ? 'text-[#0B1F3A]' : 'text-[#98A8B3]')}>{lesson.title || 'Nomsiz dars'}</span>
                          <span className="mt-0.5 flex items-center gap-2"><VideoBadge lesson={lesson} />{qn > 0 && <span className="text-[11.5px] text-[#6B7F8D]">· {qn} savol</span>}</span>
                        </span>
                        <ChevronRight className="size-4 shrink-0 text-[#B3C2C9] lg:hidden" />
                      </button>
                    </li>
                  )
                })}
              </ul>
              <button type="button" onClick={() => addLesson(mod.key)} className="mx-1.5 mb-1.5 flex min-h-11 w-[calc(100%-12px)] items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#C9D8DC] text-[13px] font-semibold text-[#0F766E] hover:bg-[#F4FAF9]">
                <Plus className="size-4" /> Dars qo‘shish
              </button>
            </li>
          ))}
        </ol>
        <button type="button" onClick={addModule} className={cx(btn.ghost, 'mt-3 w-full')}><Plus className="size-4" /> Modul qo‘shish</button>
        <p className="mt-2 hidden text-center text-[12px] text-[#8A9AA8] md:block">Darslar va modullarni sudrab tartiblang</p>
      </div>

      <div className={cx('min-w-0', mobileOpen ? 'fixed inset-0 z-[80] overflow-y-auto bg-[#F3F7F8] lg:static lg:z-auto lg:overflow-visible lg:bg-transparent' : 'hidden lg:block')}>
        {current ? (
          <>
            <div className="sticky top-[0px] z-10 border-b border-[#E4ECEE] bg-white/95 pt-[var(--safe-top)] backdrop-blur lg:hidden">
              <div className="flex h-14 items-center gap-2 px-2">
                <button type="button" aria-label="Dasturga qaytish" onClick={() => setMobileOpen(false)} className="grid size-11 place-items-center rounded-xl"><ArrowLeft className="size-5" /></button>
                <span className="min-w-0 flex-1 truncate text-[15px] font-bold">{current.title || 'Nomsiz dars'}</span>
                <button type="button" onClick={() => setMobileOpen(false)} className="min-h-11 rounded-xl px-3 text-[14px] font-semibold text-[#0F766E]">Tayyor</button>
              </div>
            </div>
            <div className="p-4 pb-[calc(24px+max(env(safe-area-inset-bottom),var(--safe-bottom-sim,0px)))] lg:p-0">
              <LessonEditor
                lesson={current}
                index={all.findIndex((l) => l.key === current.key)}
                count={all.length}
                patch={(p) => patchLesson(current.key, p)}
                onMove={(dir) => moveLesson(current.key, dir)}
                onRemove={() => removeLesson(current.key)}
                onVideo={(file) => onVideo(current.key, file)}
                onAttachRef={(raw, mins) => onAttachRef(current.key, raw, mins)}
                onGenerate={() => onGenerate(current.key)}
                job={current.id ? jobs[current.id] : null}
                videoReady={videoReady}
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

function LessonEditor({ lesson, index, count, patch, onMove, onRemove, onVideo, onAttachRef, onGenerate, job, videoReady }) {
  const fileRef = useRef(null)
  const [fileErr, setFileErr] = useState('')
  const [videoRef, setVideoRef] = useState(lesson.bunnyVideoId || '')
  const [videoMins, setVideoMins] = useState(lesson.durationSeconds ? String(Math.max(1, Math.round(lesson.durationSeconds / 60))) : '20')
  const questions = lesson.questions || []
  const patchQ = (i, p) => patch({ questions: questions.map((q, j) => (j === i ? { ...q, ...p } : q)) })
  const filled = questions.filter((q) => q.prompt?.trim()).length
  const maxM = Number(lesson.maxMistakes) || 0
  const passPct = filled ? Math.max(0, Math.round(((filled - Math.min(maxM, filled)) / filled) * 100)) : null
  const uploading = lesson.uploadPct > 0 && lesson.uploadPct < 100
  const pick = (file) => {
    const err = checkVideoFile(file)
    setFileErr(err)
    if (!err) onVideo(file)
  }
  return (
    <div className="space-y-4">
      <Card
        title={`${index + 1}-dars`}
        extra={(
          <div className="flex items-center gap-1">
            <button type="button" aria-label="Yuqoriga" disabled={index === 0} onClick={() => onMove(-1)} className="grid size-11 place-items-center rounded-xl text-[#5B6F7E] hover:bg-[#EEF3F5] disabled:opacity-30"><ArrowUp className="size-4" /></button>
            <button type="button" aria-label="Pastga" disabled={index === count - 1} onClick={() => onMove(1)} className="grid size-11 place-items-center rounded-xl text-[#5B6F7E] hover:bg-[#EEF3F5] disabled:opacity-30"><ArrowDown className="size-4" /></button>
            <button type="button" aria-label="Darsni o‘chirish" disabled={count <= 1} onClick={onRemove} className="grid size-11 place-items-center rounded-xl text-[#B42318] hover:bg-[#FFF1F1] disabled:opacity-30"><Trash2 className="size-4" /></button>
          </div>
        )}
      >
        <Field label="Dars nomi" counter={`${lesson.title.length}/160`}>
          <Text aria-label="Dars nomi" value={lesson.title} onChange={(v) => patch({ title: v })} max={160} placeholder="Masalan: Ishchi uzunlik va kengaytirish" />
        </Field>
      </Card>

      <Card title="Video" sub={videoReady.ready ? 'MP4/MOV, 4 GB gacha. Yuklash tugagach video qayta ishlanadi, davomiyligi avtomatik aniqlanadi.' : videoReady.reason}
        extra={<span className="shrink-0 whitespace-nowrap rounded-full bg-[#EEF3F5] px-2.5 py-1 text-[11px] font-semibold text-[#5B6F7E]">{videoHost().label}</span>}>
        {lesson.bunnyVideoId && !uploading ? (
          <div className="flex items-center gap-3 rounded-xl border border-[#E4ECEE] bg-[#F7FAFB] p-3">
            <span className={cx('grid size-11 shrink-0 place-items-center rounded-xl', lesson.encodingStatus === 'finished' ? 'bg-[#E7F6F2] text-[#0B6B5F]' : lesson.encodingStatus === 'failed' ? 'bg-[#FFF1F1] text-[#B42318]' : 'bg-[#FFF6E5] text-[#9A5B00]')}>
              {lesson.encodingStatus === 'finished' ? <CheckCircle2 className="size-5" /> : lesson.encodingStatus === 'failed' ? <X className="size-5" /> : <Loader2 className="size-5 animate-spin" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold text-[#0B1F3A]">{lesson.encodingStatus === 'finished' ? 'Video tayyor' : lesson.encodingStatus === 'failed' ? 'Video qayta ishlanmadi' : 'Video qayta ishlanmoqda…'}</span>
              <span className="block text-[12.5px] text-[#6B7F8D]">{lesson.encodingStatus === 'finished' ? `Davomiyligi: ${formatDuration(lesson.durationSeconds) || '—'}` : 'Bir necha daqiqa olishi mumkin. Sahifadan chiqsangiz ham davom etadi.'}</span>
            </span>
            <button type="button" disabled={!videoReady.ready} onClick={() => fileRef.current?.click()} className={cx(btn.ghost, 'min-h-10 px-3 text-[13px]')}>Almashtirish</button>
          </div>
        ) : uploading ? (
          <div className="rounded-xl border border-[#BFE6DC] bg-[#F3FBF9] p-4">
            <div className="flex items-center justify-between text-[13px] font-semibold text-[#0B5F57]"><span className="inline-flex items-center gap-2"><Loader2 className="size-4 animate-spin" />Yuklanmoqda</span><span className="tabular-nums">{lesson.uploadPct}%</span></div>
            <span className="mt-2.5 block h-2 overflow-hidden rounded-full bg-[#D6EEE9]"><span className="block h-full rounded-full bg-[#0F766E] transition-all" style={{ width: `${lesson.uploadPct}%` }} /></span>
          </div>
        ) : (
          <button type="button" disabled={!videoReady.ready} onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0]) }}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#C9D8DC] bg-[#F7FAFB] px-4 py-8 text-center transition hover:border-[#0F766E] hover:bg-[#F2FAF8] disabled:cursor-not-allowed disabled:opacity-60">
            <span className="grid size-12 place-items-center rounded-2xl bg-white text-[#0F766E] shadow-sm ring-1 ring-[#E4ECEE]"><UploadCloud className="size-6" /></span>
            <span className="text-[14px] font-semibold text-[#0B1F3A]">{videoReady.ready ? 'Videoni shu yerga tashlang yoki tanlang' : 'Video yuklash hozircha yopiq'}</span>
            <span className="text-[12px] text-[#7A8C99]">{videoReady.ready ? 'Birinchi yuklashda kurs qoralama sifatida saqlanadi' : 'Server sozlangach shu yerda ishlaydi'}</span>
          </button>
        )}
        {fileErr && <p className="mt-2 text-[12.5px] text-[#B42318]">{fileErr}</p>}
        <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = '' }} />
        <div className="mt-4 border-t border-[#EEF3F5] pt-3">
          <p className="text-[12.5px] font-semibold text-[#2C4152]">Video ID yoki pleyer havolasi</p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-[#7A8C99]">Mavjud Bunny videoni identifikator yoki havola bilan biriktiring. Yuklash ishlamasa ham shu usul saqlanadi.</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input value={videoRef} onChange={(e) => setVideoRef(e.target.value)} placeholder="Masalan: abc123 yoki https://iframe.mediadelivery.net/embed/…" className={cx(input, 'min-h-11 flex-1')} aria-label="Video ID yoki havola" />
            <input value={videoMins} onChange={(e) => setVideoMins(e.target.value)} inputMode="decimal" placeholder="20" className={cx(input, 'min-h-11 sm:w-24')} aria-label="Davomiyligi (daqiqa)" title="Davomiyligi (daqiqa)" />
            <button type="button" onClick={() => onAttachRef?.(videoRef, videoMins)} className={cx(btn.soft, 'min-h-11 shrink-0 px-4')}>Biriktirish</button>
          </div>
        </div>
      </Card>

      <Card title="Nimalar o‘rgatiladi" sub="Kurs sahifasida dars ostida ochiladi. 2–6 ta qisqa band.">
        <ListEditor items={lesson.takeaways?.length ? lesson.takeaways : ['']} onChange={(v) => patch({ takeaways: v })} max={10} icon={ListChecks}
          placeholder={(i) => ['Crown-down protokoli', 'Xavfsiz ishchi uzunlikni aniqlash'][i] || 'Yana bir band'} />
      </Card>

      <Card title="Materiallar" sub="PDF, protokol yoki maqola havolasi. Faqat kursga kirish huquqi borlarga ko‘rinadi.">
        <ul className="space-y-2">
          {(lesson.materials || []).map((m, i) => (
            <li key={i} className="grid gap-2 rounded-xl border border-[#E4ECEE] p-2.5 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_44px]">
              <span className="relative block"><FileText className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8A9AA8]" /><input value={m.title} maxLength={120} placeholder="Nomi" onChange={(e) => patch({ materials: lesson.materials.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} className={cx(input, 'pl-9')} /></span>
              <span className="relative block"><Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8A9AA8]" /><input value={m.url} maxLength={500} inputMode="url" placeholder="https://…" onChange={(e) => patch({ materials: lesson.materials.map((x, j) => (j === i ? { ...x, url: e.target.value.trim() } : x)) })} className={cx(input, 'pl-9', m.url && !/^https:\/\//.test(m.url) && 'border-[#F4C7C7]')} /></span>
              <button type="button" aria-label="Materialni o‘chirish" onClick={() => patch({ materials: lesson.materials.filter((_, j) => j !== i) })} className="grid size-11 place-items-center rounded-xl text-[#8A9AA8] hover:text-[#B42318]"><X className="size-4" /></button>
            </li>
          ))}
        </ul>
        {(lesson.materials || []).length < 10 && <button type="button" onClick={() => patch({ materials: [...(lesson.materials || []), { title: '', url: '' }] })} className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-[13.5px] font-semibold text-[#0F766E] hover:bg-[#EFF8F6]"><Plus className="size-4" /> Material qo‘shish</button>}
      </Card>

      <Card title="Test" sub="Testdan o‘tgach keyingi dars ochiladi. Test bo‘lmasa, video 90% ko‘rilganda ochiladi."
        extra={lesson.encodingStatus === 'finished' && lesson.id ? (
          <button type="button" onClick={onGenerate} disabled={job && !['ready', 'failed'].includes(job.status)} className={cx(btn.soft, 'min-h-10 px-3 text-[13px]')}>
            {job && !['ready', 'failed'].includes(job.status) ? <><Loader2 className="size-4 animate-spin" />{job.progress || 0}%</> : <><Sparkles className="size-4" />AI bilan tuzish</>}
          </button>
        ) : null}>
        {job?.status === 'failed' && <p className="mb-3 rounded-xl bg-[#FFF5F5] px-3 py-2 text-[12.5px] text-[#B42318]">AI savol tuza olmadi: {job.error || 'xato'}</p>}
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-[#F7FAFB] p-3 sm:grid-cols-3">
          <Field label="Ruxsat etilgan xato" hint={passPct == null ? 'Savol qo‘shing' : `O‘tish bali ≈ ${passPct}%`}>
            <input value={lesson.maxMistakes ?? 2} inputMode="numeric" onChange={(e) => patch({ maxMistakes: Math.min(20, Number(e.target.value.replace(/\D/g, '')) || 0) })} className={input} />
          </Field>
          <Field label="Ball" hint="Reyting uchun">
            <input value={lesson.points ?? 10} inputMode="numeric" onChange={(e) => patch({ points: Math.min(100, Number(e.target.value.replace(/\D/g, '')) || 0) })} className={input} />
          </Field>
          <div className="col-span-2 flex items-end sm:col-span-1">
            <p className="text-[12px] leading-snug text-[#6B7F8D]">Javobsiz savol ham xato hisoblanadi. O‘quvchi testni qayta topshira oladi.</p>
          </div>
        </div>
        <ol className="mt-3 space-y-3">
          {questions.map((q, qi) => (
            <li key={q.key || qi} className="rounded-xl border border-[#E4ECEE] p-3">
              <div className="flex items-start gap-2">
                <span className="mt-2.5 grid size-7 shrink-0 place-items-center rounded-lg bg-[#0B1F3A] text-[12px] font-bold text-white">{qi + 1}</span>
                <textarea value={q.prompt} rows={2} maxLength={500} onChange={(e) => patchQ(qi, { prompt: e.target.value })} placeholder="Savol matni" className={cx(input, 'min-h-[52px] py-2.5')} />
                <button type="button" aria-label="Savolni o‘chirish" onClick={() => patch({ questions: questions.filter((_, j) => j !== qi) })} className="grid size-11 shrink-0 place-items-center rounded-xl text-[#8A9AA8] hover:text-[#B42318]"><Trash2 className="size-4" /></button>
              </div>
              <div className="mt-2.5 space-y-2 sm:pl-9">
                {q.options.map((opt, oi) => {
                  const right = Number(q.correctIndex) === oi
                  return (
                    <div key={oi} className="flex items-center gap-2">
                      <button type="button" role="radio" aria-checked={right} aria-label={`${oi + 1}-variant to‘g‘ri`} onClick={() => patchQ(qi, { correctIndex: oi })}
                        className={cx('grid size-11 shrink-0 place-items-center rounded-xl border transition', right ? 'border-[#0F766E] bg-[#0F766E] text-white' : 'border-[#D8E3E6] text-transparent hover:border-[#0F766E]')}>
                        <CheckCircle2 className="size-4" />
                      </button>
                      <input value={opt} maxLength={200} onChange={(e) => patchQ(qi, { options: q.options.map((x, j) => (j === oi ? e.target.value : x)) })} placeholder={`${String.fromCharCode(65 + oi)} variant`} className={cx(input, right && 'border-[#9FD8CC] bg-[#F3FBF9]')} />
                      {q.options.length > 2 && <button type="button" aria-label="Variantni o‘chirish" onClick={() => patchQ(qi, { options: q.options.filter((_, j) => j !== oi), correctIndex: Number(q.correctIndex) === oi ? 0 : Number(q.correctIndex) > oi ? Number(q.correctIndex) - 1 : q.correctIndex })} className="grid size-11 shrink-0 place-items-center rounded-xl text-[#98A8B3] hover:text-[#B42318]"><X className="size-4" /></button>}
                    </div>
                  )
                })}
                {q.options.length < 6 && <button type="button" onClick={() => patchQ(qi, { options: [...q.options, ''] })} className="inline-flex min-h-10 items-center gap-1 px-1 text-[12.5px] font-semibold text-[#0F766E]"><Plus className="size-3.5" /> Variant</button>}
                {q.explanation && <p className="rounded-lg bg-[#F7FAFB] px-2.5 py-2 text-[12px] leading-relaxed text-[#4F6373]">AI izohi: {q.explanation}</p>}
              </div>
            </li>
          ))}
        </ol>
        <button type="button" onClick={() => patch({ questions: [...questions, blankQuestion()] })} className={cx(btn.ghost, 'mt-3 w-full sm:w-auto')}><Plus className="size-4" /> Savol qo‘shish</button>
        {!questions.length && <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[#8A9AA8]"><Video className="size-3.5" /> Testsiz dars video ko‘rilgach yakunlanadi.</p>}
      </Card>
    </div>
  )
}
