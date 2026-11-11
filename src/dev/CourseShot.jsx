import { useState } from 'react'
import { useParams } from 'react-router-dom'
import ShopLayout from '../components/market/ShopLayout'
import { LessonPlayer } from '../components/course/LessonPlayer'
import { MyCourseCards } from '../components/course/MyCourseCards'
import { Certificate } from '../pages/Sertifikatlar'
import { certFromRow } from '../sertifikatData'
import { useMobile } from '../useMobile'

const COVER = '/images/seminars/micro.jpg'
const FACE = '/images/surplus/u1.jpg'

const course = {
  title: 'Zamonaviy endodontiya: kanalni kengaytirish',
  about: 'Rotatsion fayllar, irrigatsiya va obturatsiya. Klinik holatlar bilan.',
  doctor: 'Dr. Dilnoza Karimova',
  cover: COVER,
  price: 0,
  lessons: 4,
  done: 1,
  pct: 25,
  completed: false,
  preview: false,
}

const lessons = [
  { id: 'l1', position: 1, title: 'Anatomiya va diagnostika', description: 'Kanal tizimi va rentgen belgilar.', moduleTitle: 'Asoslar', durationSeconds: 980, encodingStatus: 'finished', hasQuiz: true, complete: true, locked: false, watchedRatio: 1, passThreshold: 70 },
  { id: 'l2', position: 2, title: 'Ishchi uzunlik va kengaytirish', description: 'Crown-down protokoli va xavfsiz ishchi uzunlik.', moduleTitle: 'Asoslar', durationSeconds: 1240, encodingStatus: 'finished', hasQuiz: true, complete: false, locked: false, watchedRatio: 0.62, quizUnlocked: false, passThreshold: 70 },
  { id: 'l3', position: 3, title: 'Irrigatsiya protokollari', description: 'NaOCl, EDTA va faollashtirish.', moduleTitle: 'Protokollar', durationSeconds: 860, encodingStatus: 'finished', hasQuiz: true, complete: false, locked: true, watchedRatio: 0, passThreshold: 70 },
  { id: 'l4', position: 4, title: 'Klinik holat: egri kanal', description: 'Murakkab anatomiya, video qayta ishlanmoqda.', moduleTitle: 'Protokollar', durationSeconds: 0, encodingStatus: 'processing', hasQuiz: false, complete: false, locked: true, watchedRatio: 0 },
]

const questions = [
  { id: 'q1', prompt: 'Ishchi uzunlikni aniqlashda birinchi qadam qaysi?', options: ['Apekslokator va rentgenni solishtirish', 'Darhol obturatsiya', 'Faqat sezgi bilan o‘lchash', 'Kanalni quruq qoldirish'] },
  { id: 'q2', prompt: 'Crown-down texnikasining asosiy maqsadi nima?', options: ['Koronal qismdan pastga kengaytirish', 'Faqat apikal tirqishni ochish', 'Shpatel bilan tozalash', 'Kavitani yopish'] },
  { id: 'q3', prompt: 'Irrigatsiyada EDTA odatda nima uchun ishlatiladi?', options: ['Smear qatlamini olib tashlash', 'Kanalni quritish', 'Anesteziya', 'Toj rangini tuzatish'] },
]

const mine = [
  { id: 'c1', title: course.title, cover: COVER, about: course.about, lessons: 4, done: 4, pct: 100, complete: true, score: 92, points: 40, certificateId: 'cert-shot' },
  { id: 'c2', title: 'Raqamli tabassum dizayni', cover: '/images/seminars/smile.jpg', about: 'Mock-up, wax-up va rang tanlash.', lessons: 6, done: 2, pct: 33, complete: false, score: 0, points: 10 },
]

const certificate = certFromRow({
  id: 'cert-shot',
  code: 'SH-KURS-A1B2C3D4',
  title: course.title,
  issuedAt: '2026-11-11',
  kind: 'online',
  hours: 2.4,
  cme: 40,
  speaker: 'Dr. Dilnoza Karimova',
  holderName: 'Madina Yusupova',
  scorePct: 92,
  place: 'Onlayn',
})

export default function CourseShot() {
  const { screen } = useParams()
  const mobile = useMobile()
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState({ q1: 0 })
  const quiz = {
    questions,
    index,
    answers,
    maxMistakes: 2,
    busy: false,
    error: '',
    onPick: (id, choice) => setAnswers((prev) => ({ ...prev, [id]: choice })),
    onPrev: () => setIndex((n) => Math.max(0, n - 1)),
    onNext: () => setIndex((n) => Math.min(questions.length - 1, n + 1)),
    onSubmit: () => {},
  }
  const result = { passed: true, score: 100, correct: 3, total: 3, mistakes: 0, maxMistakes: 2, pointsAwarded: 10, certificate }
  const failed = { passed: false, score: 40, correct: 2, total: 5, mistakes: 3, maxMistakes: 2, pointsAwarded: 0 }
  const cooled = { ...failed, error: 'Keyingi urinishdan oldin biroz kuting.' }

  const body = screen === 'quiz' ? (
    <LessonPlayer course={course} lessons={lessons} activeId="l2" mobile={mobile} phase="quiz" quiz={quiz} poster={COVER} posterAsPlayer />
  ) : screen === 'natija' ? (
    <LessonPlayer course={{ ...course, completed: true, done: 4, pct: 100 }} lessons={lessons.map((l) => ({ ...l, locked: false, complete: true }))} activeId="l2" mobile={mobile} phase="result" result={result} poster={COVER} />
  ) : screen === 'qayta' ? (
    <LessonPlayer course={course} lessons={lessons} activeId="l2" mobile={mobile} phase="result" result={failed} retryUntil={0} poster={COVER} />
  ) : screen === 'xato' ? (
    <LessonPlayer course={course} lessons={lessons} activeId="l2" mobile={mobile} phase="result" result={cooled} retryUntil={Date.now() + 47000} poster={COVER} />
  ) : screen === 'profil' ? (
    <ProfileShot mobile={mobile} />
  ) : screen === 'sertifikat' ? (
    <div className="mx-auto max-w-[860px] py-4">
      <h1 className="mb-3 text-[22px] font-extrabold text-[#0d2a4a]">Sertifikat</h1>
      <Certificate c={certificate} big />
    </div>
  ) : (
    <LessonPlayer course={course} lessons={lessons} activeId="l2" mobile={mobile} phase="watch" poster={COVER} posterAsPlayer />
  )

  return (
    <ShopLayout active="education" search="plain" placeholder="Kurs qidiring...">
      <div className="pb-6 pt-3">{body}</div>
    </ShopLayout>
  )
}

function ProfileShot({ mobile }) {
  return (
    <div className={mobile ? '' : 'mx-auto max-w-[920px]'}>
      <div className="mb-4 flex items-center gap-3">
        <img src={FACE} alt="" className="size-16 rounded-full object-cover" />
        <div>
          <p className="text-[18px] font-bold text-[#0d2a4a]">Madina Yusupova</p>
          <p className="text-[13px] text-[#5b6b7d]">Stomatolog-terapevt · Toshkent</p>
        </div>
      </div>
      <section className="rounded-2xl border border-[#e6eef2] bg-white p-4">
        <h2 className="text-[16px] font-bold text-[#12263a]">Kurslarim va sertifikatlar</h2>
        <p className="mb-3 mt-3 text-[12px] font-bold uppercase tracking-wide text-[#6b7c8f]">Tugatilgan</p>
        <MyCourseCards courses={mine.filter((c) => c.complete)} mobile={mobile} />
        <p className="mb-3 mt-4 text-[12px] font-bold uppercase tracking-wide text-[#6b7c8f]">Davom etmoqda</p>
        <MyCourseCards courses={mine.filter((c) => !c.complete)} mobile={mobile} />
      </section>
    </div>
  )
}
