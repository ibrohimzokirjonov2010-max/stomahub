import { AlertCircle, CheckCircle2, Circle, Eye, Send, ShieldCheck, X } from 'lucide-react'
import { CourseDetailView } from '../../pages/CourseDetail'
import { formatDuration } from '../../courseRules'
import { Cover, StatusPill, btn, cx, som } from '../ui'
import { Card } from './fields'
import { checklist, flatLessons, lessonCount, totalDuration } from './model'

export function StepReview({ course, modules, onGo, onPreview, onSubmit, busy, legacy }) {
  const items = checklist(course, modules)
  const blockers = items.filter((i) => i.required && !i.ok)
  const done = items.filter((i) => i.ok).length
  const review = course.status === 'review'
  const published = course.status === 'published'
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Card title="Tayyorlik" sub={`${done} / ${items.length} bajarildi`}
        extra={<span className="relative grid size-12 place-items-center"><svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90"><circle cx="18" cy="18" r="15.5" fill="none" stroke="#E8EFF1" strokeWidth="3.5" /><circle cx="18" cy="18" r="15.5" fill="none" stroke="#0F766E" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${(done / items.length) * 97.4} 97.4`} /></svg><span className="text-[12px] font-bold">{Math.round((done / items.length) * 100)}%</span></span>}>
        <ul className="divide-y divide-[#EEF3F5]">
          {items.map((it) => (
            <li key={it.key}>
              <button type="button" onClick={() => onGo(it.step)} className="flex min-h-12 w-full items-center gap-3 py-2 text-left">
                {it.ok ? <CheckCircle2 className="size-5 shrink-0 text-[#10A37F]" /> : it.required ? <AlertCircle className="size-5 shrink-0 text-[#D92D20]" /> : <Circle className="size-5 shrink-0 text-[#C3D0D6]" />}
                <span className={cx('min-w-0 flex-1 text-[14px]', it.ok ? 'text-[#3F5263]' : 'font-semibold text-[#0B1F3A]')}>{it.label}</span>
                {!it.ok && <span className={cx('shrink-0 text-[11.5px] font-semibold', it.required ? 'text-[#D92D20]' : 'text-[#8A9AA8]')}>{it.required ? 'Majburiy' : 'Tavsiya'}</span>}
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <div className="space-y-4">
        <Card>
          <Cover src={course.coverUrl} className="aspect-video w-full rounded-xl" />
          <div className="mt-3 flex items-center gap-2"><StatusPill status={course.status} /></div>
          <p className="mt-2 text-[16px] font-bold leading-snug text-[#0B1F3A]">{course.title || 'Kurs nomi'}</p>
          <p className="mt-1 text-[12.5px] text-[#6B7F8D]">{modules.length} modul · {lessonCount(modules)} dars · {formatDuration(totalDuration(modules)) || '0 daqiqa'} · {course.paid ? som(course.discountOn && Number(course.discountPrice) ? course.discountPrice : course.price) : 'Bepul'}</p>
          <button type="button" onClick={onPreview} className={cx(btn.ghost, 'mt-4 w-full')}><Eye className="size-4" /> Kurs sahifasini oldindan ko‘rish</button>
        </Card>
        <Card>
          {course.moderationNote && course.status === 'draft' && (
            <p className="mb-3 rounded-xl bg-[#FFF5F5] px-3 py-2.5 text-[12.5px] leading-snug text-[#B42318]"><b>Moderator izohi:</b> {course.moderationNote}</p>
          )}
          {published ? (
            <p className="flex items-start gap-2 text-[13px] leading-snug text-[#0B5F57]"><ShieldCheck className="mt-0.5 size-4 shrink-0" />Kurs nashr qilingan. O‘zgarishlar «Saqlash» bilan darhol kurs sahifasida chiqadi.</p>
          ) : review ? (
            <p className="flex items-start gap-2 text-[13px] leading-snug text-[#7A4B00]"><ShieldCheck className="mt-0.5 size-4 shrink-0" />Kurs moderatsiyada. Tasdiqlangach katalogda chiqadi. Tahrir saqlansa, kurs qoralamaga qaytadi va qayta yuborish kerak bo‘ladi.</p>
          ) : (
            <>
              <p className="text-[13px] leading-relaxed text-[#4F6373]">{legacy ? 'Kurs saqlanib, darhol nashr qilinadi (moderatsiya 0078 migratsiyasi bilan yoqiladi).' : 'Moderator kursni tekshiradi (odatda 1 ish kuni). Tasdiqlangach katalogda chiqadi, rad etilsa sababini shu yerda ko‘rasiz.'}</p>
              <button type="button" disabled={busy || blockers.length > 0} onClick={onSubmit} className={cx(btn.primary, 'mt-4 w-full')}>
                <Send className="size-4" /> {busy ? 'Yuborilmoqda…' : legacy ? 'Nashr qilish' : 'Moderatsiyaga yuborish'}
              </button>
              {blockers.length > 0 && <p className="mt-2 text-center text-[12px] text-[#B42318]">Avval majburiy bandlarni to‘ldiring</p>}
            </>
          )}
        </Card>
      </div>
    </div>
  )
}

export function PreviewOverlay({ open, course, modules, onClose, authorName, avatar }) {
  if (!open) return null
  const lessons = flatLessons(modules).map((l, i) => ({
    id: l.id || l.key, position: i + 1, title: l.title, description: l.description, moduleTitle: l.moduleTitle,
    durationSeconds: l.durationSeconds, hasQuiz: (l.questions || []).some((q) => q.prompt?.trim()), complete: false, locked: true, takeaways: (l.takeaways || []).filter((s) => s.trim()),
  }))
  const view = {
    id: course.id || 'namuna', title: course.title || 'Kurs nomi', about: course.description, subtitle: course.subtitle,
    direction: course.direction, level: course.level, format: course.format, price: course.paid ? Number(course.price) || 0 : 0,
    discountPrice: course.paid && course.discountOn ? Number(course.discountPrice) || null : null,
    discountUntil: course.paid && course.discountOn && course.discountUntil ? `${course.discountUntil}T23:59:59+05:00` : null,
    cover: course.coverUrl, doctor: authorName, avatar, lessons: lessons.length, done: 0, enrolled: false, access: false,
    learnPoints: course.learnPoints.filter((s) => s.trim()), audience: course.audience.filter((s) => s.trim()),
    certificateEnabled: course.certificateEnabled, certificateMinScore: course.certificateMinScore, certificate: null,
  }
  return (
    <div className="fixed inset-0 z-[96] overflow-y-auto bg-[#F3F7F8]" role="dialog" aria-modal="true" aria-label="Oldindan ko‘rish">
      <div className="sticky top-[0px] z-40 border-b border-[#E4ECEE] bg-[#0B1F3A] pt-[var(--safe-top)] text-white">
        <div className="mx-auto flex h-14 max-w-[1180px] items-center gap-3 px-4">
          <Eye className="size-4 text-white/70" />
          <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">Oldindan ko‘rish — o‘quvchi shunday ko‘radi</span>
          <button type="button" onClick={onClose} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-white/10 px-3 text-[13.5px] font-semibold hover:bg-white/20"><X className="size-4" /> Yopish</button>
        </div>
      </div>
      <div className="mx-auto max-w-[1180px] px-4 [&_.app-action-bar]:hidden">
        <CourseDetailView course={view} lessons={lessons} message="" enrolling={false} testSeed={false} onEnroll={() => {}} onWatch={() => {}} />
      </div>
    </div>
  )
}
