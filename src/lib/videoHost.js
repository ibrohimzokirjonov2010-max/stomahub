// Dars videosi uchun yagona adapter. Kabinet va muharrir faqat shu fayl orqali video yuklaydi.
//
// Hozirgi provayder: Bunny Stream (mavjud oqim). Brauzer /api/talim dan imzolangan TUS
// manzilini oladi va faylni to‘g‘ridan-to‘g‘ri Bunny’ga yuboradi (api/_lib/talim.js, api/_lib/bunny.js).
// Kalitlar faqat serverda: BUNNY_STREAM_LIBRARY_ID, BUNNY_STREAM_API_KEY (+ ixtiyoriy CDN_HOST, REFERER).
// Brauzerda hech qanday kalit yo‘q va bo‘lmasligi kerak.
//
// Yangi provayder (masalan, boshqa Bunny kutubxonasi yoki boshqa xizmat) qo‘shish:
//   1) PROVIDERS ga { id, label, status(), upload(), refresh() } qo‘shing.
//   2) Server tomonda imzo beradigan action — mavjud /api/talim ichida (yangi api/ fayl ochilmaydi:
//      Vercel Hobby 12 funksiya chegarasi).
//   3) ACTIVE ni almashtiring.

import { refreshVideo, uploadLessonVideo } from '../courseApi'

export const VIDEO_LIMIT_BYTES = 4 * 1024 * 1024 * 1024 // 4 GB
export const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska', 'video/x-msvideo']

const bunny = {
  id: 'bunny',
  label: 'Bunny Stream',
  /** { ready, reason } — server sozlanganmi. Kalit ko‘rsatilmaydi. */
  async status() {
    try {
      const res = await fetch('/api/talim?action=config')
      const body = await res.json().catch(() => ({}))
      if (res.ok && body?.libraryId) return { ready: true, reason: '' }
      return { ready: false, reason: 'Video xizmati hali sozlanmagan (Bunny Stream kaliti serverda yo‘q).' }
    } catch {
      return { ready: false, reason: 'Video xizmatiga ulanib bo‘lmadi.' }
    }
  },
  upload: (lessonId, file, title, onProgress) => uploadLessonVideo(lessonId, file, title, onProgress),
  refresh: (lessonId) => refreshVideo(lessonId),
}

const PROVIDERS = { bunny }
const ACTIVE = 'bunny'

export function videoHost() {
  return PROVIDERS[ACTIVE]
}

/** Fayl tekshiruvi: xato matni yoki ''. */
export function checkVideoFile(file) {
  if (!file) return 'Fayl tanlanmadi'
  if (file.type && !VIDEO_TYPES.includes(file.type) && !/^video\//.test(file.type)) return 'Faqat video fayl (MP4, MOV, WEBM)'
  if (file.size > VIDEO_LIMIT_BYTES) return 'Video 4 GB dan katta bo‘lmasin'
  return ''
}

export const ENCODING_LABEL = {
  empty: 'Video yo‘q',
  created: 'Yuklashga tayyor',
  uploading: 'Yuklanmoqda',
  processing: 'Qayta ishlanmoqda',
  finished: 'Tayyor',
  failed: 'Xato',
}
