import { createHash } from 'node:crypto'

/** Bunny TUS imzosi: SHA256(libraryId + apiKey + expire + videoId), hex. */
export function bunnySignature({ libraryId, apiKey, videoId, expire }) {
  return createHash('sha256').update(`${libraryId}${apiKey}${expire}${videoId}`).digest('hex')
}

/**
 * Bunny Stream video.status:
 * 0 Created, 1 Uploaded, 2 Processing, 3 Transcoding, 4 Finished, 5 Error, 6 UploadFailed.
 * length — soniya. encodeProgress — 0..100.
 */
export function mapBunnyStatus(body) {
  const code = Number(body?.status)
  const table = {
    0: 'created',
    1: 'processing',
    2: 'processing',
    3: 'processing',
    4: 'finished',
    5: 'failed',
    6: 'failed',
  }
  const encoding = Object.prototype.hasOwnProperty.call(table, code) ? table[code] : 'processing'
  const duration = Math.max(0, Math.round(Number(body?.length) || 0))
  const encodeProgress = Math.max(0, Math.min(100, Math.round(Number(body?.encodeProgress) || (encoding === 'finished' ? 100 : 0))))
  return {
    code: Number.isFinite(code) ? code : null,
    encoding,
    duration,
    encodeProgress,
    ready: encoding === 'finished' && duration > 0,
  }
}

export function bunnyConfigured(env = process.env) {
  const libraryId = String(env.BUNNY_STREAM_LIBRARY_ID || '').trim()
  const apiKey = String(env.BUNNY_STREAM_API_KEY || '').trim()
  const cdnHost = String(env.BUNNY_STREAM_CDN_HOST || '').trim().replace(/^https?:\/\//, '').replace(/\/$/, '')
  const refererRaw = String(env.BUNNY_STREAM_REFERER || 'https://stomahub-three.vercel.app/').trim()
  const referer = refererRaw.endsWith('/') ? refererRaw : `${refererRaw}/`
  return { libraryId, apiKey, cdnHost, referer, ok: Boolean(libraryId && apiKey) }
}

const MP4_HEIGHTS = ['240p', '360p', '480p', '720p', '1080p', '1440p', '2160p']

function joinUrl(prefix, name) {
  return `${String(prefix).replace(/\/$/, '')}/${name}`
}

/**
 * STT uchun manba. Eng past MP4 fallback (odatda play_240p.mp4) — audio izi kichik.
 * CDN referrer cheklovi bor, shuning uchun keyinroq so‘rov Referer bilan ketadi.
 * Play-data dagi URL imzolangan bo‘lishi mumkin; bo‘lmasa CDN hostdan yig‘iladi.
 * MP4 fallback yo‘q bo‘lsa original (library "keep original") ishlatiladi, lekin
 * baribir butun fayl emas, faqat audio baytlari olinadi.
 */
export function pickLessonAudioSource({ video, play, cdnHost }) {
  const available = String(video?.availableResolutions || '')
    .split(/[,\s]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
  const height = MP4_HEIGHTS.find((item) => available.includes(item))
  const guid = video?.guid || video?.videoId || ''
  if (video?.hasMP4Fallback && height) {
    if (play?.fallbackUrl) return { url: joinUrl(play.fallbackUrl, `play_${height}.mp4`), label: `play_${height}.mp4`, kind: 'mp4' }
    if (cdnHost && guid) return { url: `https://${cdnHost}/${guid}/play_${height}.mp4`, label: `play_${height}.mp4`, kind: 'mp4' }
  }
  if (play?.originalUrl) return { url: play.originalUrl, label: 'original', kind: 'original' }
  if (cdnHost && guid) return { url: `https://${cdnHost}/${guid}/original`, label: 'original', kind: 'original' }
  return null
}
