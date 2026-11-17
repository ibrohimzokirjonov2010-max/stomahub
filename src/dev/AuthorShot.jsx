import { useLayoutEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { __shotSession } from '../sessionStore'
import { blankCourse, blankModule } from '../author/wizard/model'

// DEV: kurs muallifi kabineti skrinshotlari uchun soxta ma’lumot. Prod buildga kirmaydi.
const PROFILE = { id: 'shot-author', role: 'organizer', org_status: 'approved', name: 'Dr. Dilnoza Karimova', full_name: 'Dilnoza Karimova', email: 'shot@stomahub.uz', avatar_url: '/images/surplus/u1.jpg', org_name: 'Endo Akademiya' }
const CUSTOMER = { ...PROFILE, role: 'customer', org_status: null }

const C1 = { id: 'c-endo', title: 'Zamonaviy endodontiya: kanalni kengaytirish', subtitle: 'Rotatsion fayllar va irrigatsiya protokollari', status: 'published', price: 450000, discountPrice: 360000, cover: '/images/seminars/micro.jpg', format: 'kurs', level: 'orta', direction: 'endo', language: 'uz', updatedAt: '2026-11-15T09:20:00Z', publishedAt: '2026-08-02T06:00:00Z', lessons: 12, durationSeconds: 15420, enrolled: 86, completed: 31, paidSum: 28440000, pendingSum: 1350000, certificateEnabled: true }
const C2 = { id: 'c-implant', title: 'Implantologiya asoslari: rejalashtirishdan protezgacha', subtitle: 'KT tahlil, shablon va birinchi implant', status: 'published', price: 690000, cover: '/images/seminars/surgery.jpg', format: 'kurs', level: 'bosh', direction: 'implant', language: 'uz', updatedAt: '2026-11-10T11:00:00Z', publishedAt: '2026-06-18T06:00:00Z', lessons: 9, durationSeconds: 11200, enrolled: 54, completed: 22, paidSum: 33120000, pendingSum: 2070000, certificateEnabled: true }
const C3 = { id: 'c-aligner', title: 'Elayner terapiyasi: klinik holatlar', subtitle: 'Vebinar yozuvi va holatlar tahlili', status: 'review', price: 290000, cover: '/images/seminars/aligner.jpg', format: 'vebinar', level: 'orta', direction: 'orto', language: 'uz', updatedAt: '2026-11-16T14:40:00Z', submittedAt: '2026-11-16T14:40:00Z', lessons: 5, durationSeconds: 6100, enrolled: 0, completed: 0, paidSum: 0, pendingSum: 0 }
const C4 = { id: 'c-smile', title: 'Estetik restavratsiya: kompozit qatlamlari', subtitle: '', status: 'draft', price: 0, cover: '/images/seminars/smile.jpg', format: 'kurs', level: 'bosh', direction: 'terapiya', language: 'uz', updatedAt: '2026-11-12T08:00:00Z', moderationNote: 'Ikkinchi darsdagi video ovozi juda past. Iltimos, qayta yuklang va testga kamida 3 ta savol qo‘shing.', lessons: 4, durationSeconds: 3900, enrolled: 0, completed: 0, paidSum: 0, pendingSum: 0 }
const C5 = { id: 'c-teeth', title: 'Bolalar stomatologiyasida og‘riqsiz davolash', subtitle: '', status: 'draft', price: 190000, cover: '', format: 'kurs', level: 'bosh', direction: 'bolalar', language: 'uz', updatedAt: '2026-11-03T08:00:00Z', lessons: 0, durationSeconds: 0, enrolled: 0, completed: 0, paidSum: 0, pendingSum: 0 }
const COURSES = [C3, C1, C4, C2, C5]

const FACES = ['/images/surplus/u1.jpg', '', '', '', '', '', '', '']
const NAMES = ['Aziza Rahimova', 'Jasur Tursunov', 'Malika Yusupova', 'Bekzod Aliyev', 'Nodira Saidova', 'Sardor Qodirov', 'Dilshod Ergashev', 'Gulnora Xasanova', 'Otabek Nazarov', 'Shahnoza Mirzayeva']

function student(i, course, extra) {
  const total = course.lessons
  return {
    userId: `u${i}`, name: NAMES[i % NAMES.length], avatar: FACES[i % FACES.length] || '',
    courseId: course.id, courseTitle: course.title,
    enrolledAt: new Date(Date.UTC(2026, 10, 16 - i * 3, 5 + i, 10)).toISOString(),
    paymentStatus: 'paid', access: true, amount: course.discountPrice || course.price,
    paidAt: new Date(Date.UTC(2026, 10, 16 - i * 3, 7, 0)).toISOString(), method: 'cash', note: '',
    lessonsTotal: total, lessonsDone: Math.min(total, (i * 5) % (total + 1)), avgScore: 72 + ((i * 7) % 27), attempts: 3 + i,
    lastActivity: new Date(Date.UTC(2026, 10, 17 - i, 9, 30)).toISOString(), completedAt: null, certificate: null,
    ...extra,
  }
}

const STUDENTS = [
  student(0, C1, { lessonsDone: 12, completedAt: '2026-11-16T10:00:00Z', avgScore: 94, certificate: { code: 'SH-ENDO-0086', issuedAt: '2026-11-16T10:00:00Z', scorePct: 94 } }),
  student(1, C2, { paymentStatus: 'unpaid', access: false, paidAt: null, method: null, lessonsDone: 0, avgScore: null, attempts: 0 }),
  student(2, C1, { lessonsDone: 7 }),
  student(3, C2, { lessonsDone: 9, completedAt: '2026-11-08T10:00:00Z', avgScore: 88, certificate: { code: 'SH-IMPL-0041', issuedAt: '2026-11-08T10:00:00Z', scorePct: 88 } }),
  student(4, C1, { paymentStatus: 'unpaid', access: false, paidAt: null, method: null, lessonsDone: 0, avgScore: null, attempts: 0 }),
  student(5, C2, { lessonsDone: 3, method: 'transfer' }),
  student(6, C1, { lessonsDone: 2, avgScore: 66 }),
  student(7, C1, { lessonsDone: 12, completedAt: '2026-10-29T10:00:00Z', avgScore: 91, certificate: { code: 'SH-ENDO-0071', issuedAt: '2026-10-29T10:00:00Z', scorePct: 91 } }),
  student(8, C2, { lessonsDone: 5, method: 'other', note: 'Klinika hisobidan' }),
  student(9, C1, { paymentStatus: 'unpaid', access: false, paidAt: null, method: null, lessonsDone: 0, avgScore: null, attempts: 0 }),
]

const DASHBOARD = {
  ok: true,
  totals: { courses: 5, published: 2, review: 1, draft: 2, students: 131, enrollments: 140, active: 87, completed: 53, paidSum: 61560000, pendingSum: 3420000, paidCount: 133, pendingCount: 7, freeCount: 0, certificates: 49 },
  monthly: [
    { month: '2026-06', enrollments: 6, paid: 4140000 },
    { month: '2026-07', enrollments: 14, paid: 8280000 },
    { month: '2026-08', enrollments: 23, paid: 10950000 },
    { month: '2026-09', enrollments: 31, paid: 13020000 },
    { month: '2026-10', enrollments: 38, paid: 15660000 },
    { month: '2026-11', enrollments: 28, paid: 9510000 },
  ],
  recent: STUDENTS.slice(0, 6),
  top: [C1, C2].map((c) => ({ id: c.id, title: c.title, cover: c.cover, status: c.status, price: c.price, enrolled: c.enrolled, completed: c.completed, paidSum: c.paidSum })),
}
const EMPTY_DASH = { ok: true, totals: { courses: 0, published: 0, review: 0, draft: 0, students: 0, enrollments: 0, active: 0, completed: 0, paidSum: 0, pendingSum: 0, paidCount: 0, pendingCount: 0, freeCount: 0, certificates: 0 }, monthly: ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'].map((month) => ({ month, enrollments: 0, paid: 0 })), recent: [], top: [] }

const q = (prompt, options, correctIndex) => ({ key: `q-${prompt.length}-${correctIndex}`, id: '', prompt, options, correctIndex })
const lesson = (id, title, extra) => ({
  key: id, id, title, description: '', passThreshold: 70, maxMistakes: 1, points: 10,
  bunnyVideoId: `v-${id}`, encodingStatus: 'finished', durationSeconds: 1180, uploadPct: 0,
  takeaways: [], materials: [], questions: [], ...extra,
})
const MODULES = [
  { key: 'm1', title: 'Asoslar', lessons: [
    lesson('l1', 'Kanal anatomiyasi va diagnostika', {
      durationSeconds: 980,
      takeaways: ['Kanal tizimi turlarini rentgenda farqlash', 'Diagnostik reja tuzish', 'Asoratlar xavfini oldindan baholash'],
      materials: [{ title: 'Protokol (PDF)', url: 'https://stomahub.uz/fayl/endo-protokol.pdf' }, { title: 'Rentgen atlas', url: 'https://stomahub.uz/fayl/atlas.pdf' }],
      questions: [
        q('Mezial ildizda odatda nechta kanal bo‘ladi?', ['Bitta', 'Ikkita', 'To‘rtta'], 1),
        q('Ishchi uzunlikni aniqlashning eng aniq usuli qaysi?', ['Faqat rentgen', 'Apeks lokator + rentgen', 'Taktil sezgi'], 1),
        q('NaOCl qaysi konsentratsiyada eng ko‘p ishlatiladi?', ['0,5%', '2,5–5,25%', '10%'], 1),
      ],
    }),
    lesson('l2', 'Ishchi uzunlik va kengaytirish', { durationSeconds: 1240, questions: [q('Crown-down nima?', ['Tojdan apeksga', 'Apeksdan tojga'], 0)] }),
  ] },
  { key: 'm2', title: 'Protokollar', lessons: [
    lesson('l3', 'Irrigatsiya protokollari', { durationSeconds: 860 }),
    lesson('l4', 'Klinik holat: egri kanal', { bunnyVideoId: 'v-l4', encodingStatus: 'processing', durationSeconds: 0 }),
    lesson('l5', 'Obturatsiya va yakuniy rentgen', { bunnyVideoId: '', encodingStatus: 'empty', durationSeconds: 0 }),
  ] },
]
const EDIT_COURSE = {
  id: 'c-endo-draft', status: 'draft', title: 'Zamonaviy endodontiya: kanalni kengaytirish', subtitle: 'Rotatsion fayllar va irrigatsiya protokollari',
  description: 'Rotatsion fayllar, irrigatsiya va obturatsiya protokollari. Klinik holatlar, rentgen belgilari va xavfsiz ishchi uzunlik. Kurs amaliyotchi shifokorlar uchun tuzilgan, har bir dars test bilan yakunlanadi.',
  direction: 'endo', level: 'orta', format: 'kurs', language: 'uz', coverUrl: '/images/seminars/micro.jpg', trailerUrl: 'https://youtu.be/stomahub-endo',
  learnPoints: ['Kanal anatomiyasini rentgenda o‘qish', 'Rotatsion fayllar bilan xavfsiz ishlash', 'Irrigatsiya va faollashtirish protokoli', 'Murakkab egri kanallarda yondashuv'],
  audience: ['Amaliyotchi terapevt-stomatologlar', 'Ordinatorlar va yosh shifokorlar', 'Endodontiyani chuqurlashtirmoqchi bo‘lganlar'],
  price: 450000, paid: true, discountOn: true, discountPrice: 360000, discountUntil: '2026-11-30',
  certificateEnabled: true, certificateMinScore: 80, moderationNote: '',
}
const READY_MODULES = MODULES.map((m) => ({ ...m, lessons: m.lessons.map((l) => ({ ...l, bunnyVideoId: l.bunnyVideoId || `v-${l.id}`, encodingStatus: 'finished', durationSeconds: l.durationSeconds || 1020 })) }))

const editor = (extra) => ({ course: EDIT_COURSE, modules: MODULES, selected: null, hideNotice: true, ...extra })
const W = '/kurs-muallifi/kurslar/c-endo-draft/tahrir'

const SCREENS = {
  panel: { to: '/kurs-muallifi', data: { dashboard: DASHBOARD } },
  'panel-bosh': { to: '/kurs-muallifi', data: { dashboard: EMPTY_DASH, courses: [] } },
  kurslar: { to: '/kurs-muallifi/kurslar', data: { courses: COURSES } },
  'kurslar-bosh': { to: '/kurs-muallifi/kurslar', data: { courses: [] } },
  oquvchilar: { to: '/kurs-muallifi/oquvchilar', data: { students: STUDENTS, courses: COURSES } },
  tolovlar: { to: '/kurs-muallifi/tolovlar', data: { payments: STUDENTS, courses: COURSES } },
  'tolovlar-eski': { to: '/kurs-muallifi/tolovlar', data: { payments: [], courses: COURSES, missing: true } },
  muallif_emas: { to: '/kurs-muallifi', data: { dashboard: EMPTY_DASH }, profile: CUSTOMER },
  yangi: { to: '/kurs-muallifi/kurslar/yangi', data: { editor: { course: blankCourse(), modules: [blankModule(1)], selected: null, hideNotice: true } } },
  'qadam-1': { to: `${W}?qadam=1`, data: { editor: editor() } },
  'qadam-2': { to: `${W}?qadam=2`, data: { editor: editor() } },
  'qadam-3': { to: `${W}?qadam=3`, data: { editor: editor() } },
  'qadam-3-dars': { to: `${W}?qadam=3`, data: { editor: editor({ selected: 'l1' }) } },
  'qadam-4': { to: `${W}?qadam=4`, data: { editor: editor() } },
  'qadam-5': { to: `${W}?qadam=5`, data: { editor: editor() } },
  'qadam-6': { to: `${W}?qadam=6`, data: { editor: editor() } },
  'qadam-6-tayyor': { to: `${W}?qadam=6`, data: { editor: editor({ modules: READY_MODULES }) } },
  korinish: { to: `${W}?qadam=6`, data: { editor: editor({ modules: READY_MODULES, preview: true }) } },
}

export default function AuthorShot() {
  const { screen } = useParams()
  const spec = SCREENS[screen] || SCREENS.panel
  const [ready, setReady] = useState(false)
  useLayoutEffect(() => {
    window.__STOMAHUB_AUTHOR_SHOT__ = { profile: spec.profile || PROFILE, ...spec.data }
    __shotSession?.(spec.profile || PROFILE)
    setReady(true)
  }, [spec])
  return ready ? <Navigate to={spec.to} replace /> : null
}

export const AUTHOR_SHOT_SCREENS = Object.keys(SCREENS)
