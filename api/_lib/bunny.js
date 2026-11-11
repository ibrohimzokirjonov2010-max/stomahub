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

export function bunnyConfigured() {
  const libraryId = String(process.env.BUNNY_STREAM_LIBRARY_ID || '').trim()
  const apiKey = String(process.env.BUNNY_STREAM_API_KEY || '').trim()
  return { libraryId, apiKey, ok: Boolean(libraryId && apiKey) }
}
