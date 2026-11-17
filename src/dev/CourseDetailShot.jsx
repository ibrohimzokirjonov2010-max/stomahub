import { useParams } from 'react-router-dom'
import ShopLayout from '../components/market/ShopLayout'
import { CourseDetailView } from '../pages/CourseDetail'

const COVER = '/images/seminars/micro.jpg'
const FACE = '/images/surplus/u1.jpg'

const BASE_COURSE = {
  id: 'shot-endo',
  title: 'Zamonaviy endodontiya: kanalni kengaytirish',
  about: 'Rotatsion fayllar, irrigatsiya va obturatsiya protokollari. Klinik holatlar, rentgen belgilari va xavfsiz ishchi uzunlik. Kurs amaliyotchi shifokorlar uchun tuzilgan va har bir dars test bilan yakunlanadi.',
  direction: 'endo',
  level: 'orta',
  format: 'kurs',
  price: 450000,
  cover: COVER,
  doctor: 'Dr. Dilnoza Karimova',
  role: 'Endodontist',
  avatar: FACE,
  lessons: 4,
  done: 0,
  pct: 0,
  enrolled: false,
  access: false,
  preview: false,
  paymentStatus: '',
  completed: false,
  certificate: null,
}

const LESSONS = [
  { id: 'l1', position: 1, title: 'Anatomiya va diagnostika', description: 'Kanal tizimi tuzilishi\nRentgen belgilarini o‘qish\nDiagnostik reja tuzish', moduleTitle: 'Asoslar', durationSeconds: 980, hasQuiz: true, complete: false, locked: true },
  { id: 'l2', position: 2, title: 'Ishchi uzunlik va kengaytirish', description: 'Crown-down protokoli\nXavfsiz ishchi uzunlikni aniqlash', moduleTitle: 'Asoslar', durationSeconds: 1240, hasQuiz: true, complete: false, locked: true },
  { id: 'l3', position: 3, title: 'Irrigatsiya protokollari', description: 'NaOCl va EDTA ketma-ketligi\nFaollashtirish usullari', moduleTitle: 'Protokollar', durationSeconds: 860, hasQuiz: true, complete: false, locked: true },
  { id: 'l4', position: 4, title: 'Klinik holat: egri kanal', description: 'Murakkab anatomiyada yondashuv', moduleTitle: 'Protokollar', durationSeconds: 1100, hasQuiz: false, complete: false, locked: true },
]

function stateData(state) {
  if (state === 'free') {
    return {
      course: { ...BASE_COURSE, price: 0, title: 'Bepul kirish: endodontiya asoslari' },
      lessons: LESSONS,
    }
  }
  if (state === 'purchased') {
    const lessons = LESSONS.map((lesson, i) => ({
      ...lesson,
      locked: i > 1,
      complete: i === 0,
    }))
    return {
      course: { ...BASE_COURSE, enrolled: true, access: true, done: 1, pct: 25, paymentStatus: 'paid' },
      lessons,
    }
  }
  return { course: BASE_COURSE, lessons: LESSONS }
}

export default function CourseDetailShot() {
  const { state } = useParams()
  const data = stateData(state)
  return (
    <ShopLayout active="education" search="plain" placeholder="Kurs qidiring...">
      <CourseDetailView
        course={data.course}
        lessons={data.lessons}
        message=""
        enrolling={false}
        testSeed={false}
        onEnroll={() => {}}
        onWatch={() => {}}
      />
    </ShopLayout>
  )
}
