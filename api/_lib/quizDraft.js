import { glossaryForPrompt } from './dentalGlossary.js'

function clean(value, max) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
}

function invalid(message) {
  const error = new Error(message)
  error.code = 'invalid_questions'
  error.status = 422
  return error
}

function parseOne(item) {
  const prompt = clean(item?.prompt, 500)
  const explanation = clean(item?.explanation, 400)
  const quote = clean(item?.quote, 400)
  const options = Array.isArray(item?.options) ? item.options.map((option) => clean(option, 200)) : []
  const correctIndex = Number(item?.correctIndex)
  const timestampSec = Number(item?.timestampSec ?? item?.timestamp_sec ?? item?.timestamp)
  if (prompt.length < 12 || explanation.length < 8 || quote.length < 8) return null
  if (options.length !== 4 || options.some((option) => option.length < 1)) return null
  const folded = new Set(options.map((option) => option.toLocaleLowerCase('uz')))
  if (folded.size !== 4) return null
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) return null
  if (!Number.isFinite(timestampSec) || timestampSec < 0 || timestampSec > 24 * 3600) return null
  return {
    prompt,
    options,
    correctIndex,
    explanation,
    quote,
    timestampSec: Math.round(timestampSec),
  }
}

/** 5–10 ta savol. Nosoz element tashlanadi. 10 tadan oshig‘i kesiladi. */
export function validateQuestions(payload) {
  const list = payload?.questions
  if (!Array.isArray(list)) throw invalid('Savollar ro‘yxati yo‘q')
  const questions = []
  for (const item of list) {
    const parsed = parseOne(item)
    if (!parsed) continue
    questions.push(parsed)
    if (questions.length === 10) break
  }
  if (questions.length < 5) throw invalid('Kamida 5 ta to‘liq savol kerak')
  return questions
}

export function extractJson(text) {
  const raw = String(text || '').trim()
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced ? fenced[1] : raw
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start < 0 || end <= start) throw invalid('JSON topilmadi')
  try {
    return JSON.parse(candidate.slice(start, end + 1))
  } catch {
    throw invalid('JSON o‘qilmadi')
  }
}

export function clock(totalSeconds) {
  const sec = Math.max(0, Math.round(Number(totalSeconds) || 0))
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
}

export function transcriptFromStt(body) {
  const segments = Array.isArray(body?.segments) ? body.segments : []
  if (!segments.length) return String(body?.transcript || '').trim()
  return segments.map((segment) => {
    const text = String(segment?.text || '').trim()
    if (!text) return ''
    return `[${clock((segment.start_ms || 0) / 1000)}] ${text}`
  }).filter(Boolean).join('\n')
}

export function cleanSystemPrompt() {
  return `Sen stomatologiya darsi transkriptini tahrirlaysan.
${glossaryForPrompt()}
Qoidalar:
- Faqat aniq eshitilish xatolarini tuzat. Yangi gap, raqam, doza yoki maslahat qo‘shma.
- [m:ss] vaqt belgilarini o‘chirman va boshqa joyga ko‘chirma.
- O‘zbek lotin yozuvida yoz. Ruscha terminni lug‘atdagi lotin shakliga keltir.
- Javob faqat tuzatilgan transkript bo‘lsin.`
}

export function questionSystemPrompt() {
  return `Sen stomatologiya darsi bo‘yicha test tuzuvchisan. Savollar o‘zbek lotin yozuvida.
${glossaryForPrompt()}
Qat’iy qoidalar:
- Faqat transkriptda aniq aytilgan faktlardan 5 tadan 10 tagacha savol tuz.
- Aniq aytilmagan raqam, doza, foiz, o‘lcham yoki nom bo‘yicha savol qo‘yma. Taxmin qilma. Ishonching komil bo‘lmasa o‘sha savolni tashlab ket.
- Har bir savolda aynan 4 ta variant va aynan bitta to‘g‘ri javob: correctIndex 0, 1, 2 yoki 3.
- explanation — nima uchun shu javob to‘g‘ri, 1-2 gap.
- quote — transkriptdan qisqa iqtibos. timestampSec — shu iqtibosning soniyasi.
- Javob faqat shu JSON bo‘lsin, boshqa matn yo‘q:
{"questions":[{"prompt":"...","options":["...","...","...","..."],"correctIndex":0,"explanation":"...","quote":"...","timestampSec":0}]}`
}

export function repairUserPrompt(previous) {
  return `Oldingi JSON yaroqsiz edi: ${previous}
Qayta yoz. Kamida 5 ta, ko‘pi bilan 10 ta savol. Har birida 4 ta turli variant, bitta correctIndex, explanation, quote va timestampSec bo‘lsin. Faqat transkriptdagi faktlar.`
}
