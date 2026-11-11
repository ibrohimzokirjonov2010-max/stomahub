// Dev-only: kurs tahriridagi AI savol holatlari. Prod buildga kirmaydi.
import { useParams } from 'react-router-dom'
import CourseEditor from '../organizer/pages/CourseEditor'

const QUESTIONS = [
  {
    prompt: 'Tsirkon koronka uchun ustup qayerda shakllantiriladi?',
    options: ['Gingiva chetida, chamfer ko‘rinishida', 'Faqat okklyuzion yuzada', 'Kanal ichida', 'Implant vintida'],
    correctIndex: 0,
    explanation: 'Darsda ustup gingiva chetida chamfer qilib olinadi.',
    quote: 'Ustupni gingiva chetida chamfer qilib olamiz',
    timestampSec: 86,
    source: 'ai',
  },
  {
    prompt: 'Polirovkada birinchi qadam sifatida nima aytiladi?',
    options: ['Grubaya tochka bilan dag‘al qatlamni olish', 'Darhol glazur surish', 'Kanalni EDTA bilan yuvish', 'Abatmentni burash'],
    correctIndex: 0,
    explanation: 'Avval dag‘al abraziv, keyin finir va disk.',
    quote: 'Avval grubaya tochka, keyin finir',
    timestampSec: 214,
    source: 'ai',
  },
]

const TRANSCRIPT = `[1:26] Ustupni gingiva chetida chamfer qilib olamiz.
[3:34] Avval grubaya tochka, keyin finir. Tsirkon yuzasini shu tartibda silliqlaymiz.`

function lesson(extra = {}) {
  return {
    id: 'lesson-shot',
    key: 'lesson-shot',
    title: 'Tsirkon koronka: ustup va polirovka',
    description: 'Preparatsiya chegarasi va silliqlash tartibi',
    moduleTitle: 'Ortopediya',
    passThreshold: 70,
    points: 10,
    bunnyVideoId: 'vid-shot',
    encodingStatus: 'finished',
    durationSeconds: 28 * 60,
    questions: [],
    uploadPct: 0,
    transcriptClean: '',
    ...extra,
  }
}

function fixture(screen) {
  const course = {
    id: 'course-shot',
    title: 'Tsirkon koronka: klinik protokollar',
    description: 'Ustup, qalinlik va polirovka. Qoralama savollar talabaga saqlanmaguncha chiqmaydi.',
    direction: 'ortoped',
    level: 'orta',
    format: 'kurs',
    price: 0,
    coverUrl: '',
    status: 'draft',
  }
  if (screen === 'jarayon') {
    return {
      course,
      lessons: [lesson({
        aiJob: { id: 'job-shot', status: 'transcribing', progress: 62, stage: 'Matn yozilmoqda', error: '', transcript: '', questions: [] },
      })],
    }
  }
  if (screen === 'xato') {
    return {
      course,
      lessons: [lesson({
        aiJob: { id: 'job-shot', status: 'failed', progress: 55, stage: 'Xato', error: 'VoiceLab hisobida kredit tugadi', transcript: '', questions: [] },
      })],
    }
  }
  if (screen === 'qoralama') {
    return {
      course,
      lessons: [lesson({
        questions: QUESTIONS,
        transcriptClean: TRANSCRIPT,
        aiJob: { id: 'job-shot', status: 'ready', progress: 100, stage: 'Tayyor', error: '', transcript: TRANSCRIPT, questions: QUESTIONS },
      })],
    }
  }
  return { course, lessons: [lesson()] }
}

export default function QuizEditorShot() {
  const { screen } = useParams()
  window.__STOMAHUB_COURSE_SHOT__ = { editor: fixture(screen || 'tugma') }
  return (
    <div className="min-h-screen bg-[#f4f8f8] px-3 py-4 sm:px-4">
      <CourseEditor />
    </div>
  )
}
