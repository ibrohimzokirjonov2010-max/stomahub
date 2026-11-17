// Kurs konstruktori holati: modullar → darslar. Saqlashda course_save (asosiy) + course_author_save_extras (0078).

export const STEPS = [
  { key: 'asosiy', label: 'Asosiy', title: 'Asosiy ma’lumot', hint: 'Nom, yo‘nalish, muqova va tavsif' },
  { key: 'auditoriya', label: 'Auditoriya', title: 'Nimalarni o‘rganadi va kimlar uchun', hint: 'Kurs sahifasida birinchi ko‘rinadigan bloklar' },
  { key: 'dastur', label: 'Dastur', title: 'Modullar va darslar', hint: 'Video, bandlar, materiallar va test' },
  { key: 'narx', label: 'Narx', title: 'Narx va chegirma', hint: 'Bepul yoki pullik' },
  { key: 'sertifikat', label: 'Sertifikat', title: 'Sertifikat', hint: 'Berilish sharti va namuna' },
  { key: 'tekshiruv', label: 'Yuborish', title: 'Ko‘rib chiqish va yuborish', hint: 'Oldindan ko‘rish va moderatsiya' },
]

const uid = (p) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

export const blankQuestion = () => ({ key: uid('q'), prompt: '', options: ['', '', ''], correctIndex: 0 })

export const blankLesson = () => ({
  key: uid('l'),
  id: '',
  title: '',
  description: '',
  passThreshold: 70,
  maxMistakes: 2,
  points: 10,
  bunnyVideoId: '',
  encodingStatus: 'empty',
  durationSeconds: 0,
  uploadPct: 0,
  takeaways: [],
  materials: [],
  questions: [],
})

export const blankModule = (n = 1) => ({ key: uid('m'), title: `${n}-modul`, lessons: [blankLesson()] })

export const blankCourse = () => ({
  id: '',
  status: 'draft',
  title: '',
  subtitle: '',
  description: '',
  direction: 'terapiya',
  level: 'bosh',
  format: 'kurs',
  language: 'uz',
  coverUrl: '',
  trailerUrl: '',
  learnPoints: ['', '', ''],
  audience: ['', ''],
  price: 0,
  paid: false,
  discountOn: false,
  discountPrice: '',
  discountUntil: '',
  certificateEnabled: true,
  certificateMinScore: 0,
  moderationNote: '',
})

/** course_editor + course_author_extras → konstruktor holati. */
export function fromServer(editor, extras) {
  const c = editor?.course || {}
  const x = extras?.course || {}
  const extraById = new Map((extras?.lessons || []).map((row) => [row.id, row]))
  const modules = []
  for (const lesson of editor?.lessons || []) {
    const title = String(lesson.moduleTitle || '').trim() || '1-modul'
    let mod = modules[modules.length - 1]
    if (!mod || mod.title !== title) {
      mod = { key: uid('m'), title, lessons: [] }
      modules.push(mod)
    }
    const extra = extraById.get(lesson.id) || {}
    mod.lessons.push({
      ...blankLesson(),
      ...lesson,
      key: lesson.id || uid('l'),
      takeaways: Array.isArray(extra.takeaways) && extra.takeaways.length ? extra.takeaways : [],
      materials: Array.isArray(extra.materials) ? extra.materials : [],
      questions: (lesson.questions || []).map((q) => ({ ...q, key: q.id || uid('q'), options: q.options?.length ? q.options : ['', ''] })),
      uploadPct: 0,
    })
  }
  const price = Number(c.price) || 0
  const disc = Number(x.discountPrice) || 0
  return {
    course: {
      ...blankCourse(),
      id: c.id || '',
      status: x.status || c.status || 'draft',
      title: c.title || '',
      subtitle: x.subtitle || '',
      description: c.description || '',
      direction: c.direction || 'terapiya',
      level: c.level || 'bosh',
      format: c.format || 'kurs',
      language: x.language || 'uz',
      coverUrl: c.coverUrl || '',
      trailerUrl: x.trailerUrl || '',
      learnPoints: padList(x.learnPoints, 3),
      audience: padList(x.audience, 2),
      price,
      paid: price > 0,
      discountOn: disc > 0,
      discountPrice: disc ? String(disc) : '',
      discountUntil: x.discountUntil ? String(x.discountUntil).slice(0, 10) : '',
      certificateEnabled: x.certificateEnabled !== false,
      certificateMinScore: Number(x.certificateMinScore) || 0,
      moderationNote: x.moderationNote || '',
    },
    modules: modules.length ? modules : [blankModule(1)],
  }
}

function padList(list, n) {
  const clean = (Array.isArray(list) ? list : []).map((s) => String(s || ''))
  while (clean.length < n) clean.push('')
  return clean
}

export function flatLessons(modules) {
  const out = []
  modules.forEach((mod) => mod.lessons.forEach((lesson) => out.push({ ...lesson, moduleTitle: mod.title })))
  return out
}

/** course_save uchun. status: 'draft' | 'published'. */
export function corePayload(course, modules, status) {
  return {
    id: course.id || undefined,
    title: course.title,
    description: course.description,
    direction: course.direction,
    level: course.level,
    format: course.format,
    price: course.paid ? Math.max(0, Number(course.price) || 0) : 0,
    coverUrl: course.coverUrl || '',
    status,
    lessons: flatLessons(modules).map((lesson) => ({
      id: lesson.id || undefined,
      title: lesson.title,
      description: lesson.description || '',
      moduleTitle: lesson.moduleTitle,
      passThreshold: Number(lesson.passThreshold) || 70,
      maxMistakes: Number.isFinite(Number(lesson.maxMistakes)) ? Number(lesson.maxMistakes) : 2,
      points: Number.isFinite(Number(lesson.points)) ? Number(lesson.points) : 10,
      questions: (lesson.questions || [])
        .filter((q) => String(q.prompt || '').trim())
        .map((q) => {
          const opts = q.options.map((o) => String(o || '').trim())
          const kept = opts.map((o, i) => [o, i]).filter(([o]) => o)
          const correct = Math.max(0, kept.findIndex(([, i]) => i === Number(q.correctIndex)))
          return { prompt: q.prompt.trim(), options: kept.map(([o]) => o), correctIndex: correct }
        }),
    })),
  }
}

/** course_author_save_extras uchun; lessonIds — saqlangandan keyingi idlar tartibda. */
export function extrasPayload(course, modules, lessonIds) {
  const flat = flatLessons(modules)
  return {
    subtitle: course.subtitle,
    language: course.language,
    trailerUrl: course.trailerUrl,
    learnPoints: course.learnPoints.map((s) => s.trim()).filter(Boolean),
    audience: course.audience.map((s) => s.trim()).filter(Boolean),
    discountPrice: course.paid && course.discountOn && Number(course.discountPrice) > 0 ? Number(course.discountPrice) : null,
    discountUntil: course.paid && course.discountOn && course.discountUntil ? `${course.discountUntil}T23:59:59+05:00` : null,
    certificateEnabled: !!course.certificateEnabled,
    certificateMinScore: Number(course.certificateMinScore) || 0,
    lessons: flat.map((lesson, i) => ({
      id: lessonIds[i] || lesson.id,
      takeaways: (lesson.takeaways || []).map((s) => String(s).trim()).filter(Boolean),
      materials: (lesson.materials || []).filter((m) => /^https:\/\//.test(String(m.url || '').trim())).map((m) => ({ title: String(m.title || '').trim(), url: String(m.url).trim() })),
    })),
  }
}

/** Yuborishdan oldingi tekshiruv ro‘yxati. */
export function checklist(course, modules) {
  const flat = flatLessons(modules)
  const withVideo = flat.filter((l) => l.bunnyVideoId && l.encodingStatus !== 'failed').length
  const withQuiz = flat.filter((l) => (l.questions || []).some((q) => String(q.prompt || '').trim())).length
  const price = Number(course.price) || 0
  const disc = Number(course.discountPrice) || 0
  return [
    { key: 'title', step: 0, ok: course.title.trim().length >= 3, label: 'Kurs nomi (kamida 3 belgi)', required: true },
    { key: 'cover', step: 0, ok: !!course.coverUrl, label: 'Muqova rasmi', required: false },
    { key: 'desc', step: 0, ok: course.description.trim().length >= 80, label: 'To‘liq tavsif (kamida 80 belgi)', required: false },
    { key: 'learn', step: 1, ok: course.learnPoints.filter((s) => s.trim()).length >= 3, label: '«Nimalarni o‘rganasiz» — kamida 3 band', required: false },
    { key: 'lessons', step: 2, ok: flat.length >= 1 && flat.every((l) => l.title.trim().length >= 2), label: 'Har bir darsning nomi bor', required: true },
    { key: 'video', step: 2, ok: flat.length > 0 && withVideo === flat.length, label: `Har bir darsda video (${withVideo}/${flat.length})`, required: true },
    { key: 'quiz', step: 2, ok: withQuiz === flat.length && flat.length > 0, label: `Har bir darsda test (${withQuiz}/${flat.length})`, required: false },
    { key: 'price', step: 3, ok: !course.paid || price >= 1000, label: 'Pullik kurs narxi kamida 1 000 so‘m', required: true },
    { key: 'disc', step: 3, ok: !course.paid || !course.discountOn || (disc > 0 && disc < price), label: 'Chegirmali narx asl narxdan kam', required: true },
  ]
}

export function lessonCount(modules) {
  return modules.reduce((s, m) => s + m.lessons.length, 0)
}

export function totalDuration(modules) {
  return flatLessons(modules).reduce((s, l) => s + (Number(l.durationSeconds) || 0), 0)
}
