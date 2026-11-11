/**
 * VoiceLab STT va OpenAI-mos chat. Kalit faqat serverda.
 * STT: POST /v1/stt → 202 {id}, so‘ng GET /v1/stt/transcriptions/{id}.
 * Til: dars asosan o‘zbek, ichida ruscha terminlar. `auto` aralash nutqda ishonchsiz,
 * shuning uchun standart `uz`. Lug‘at keyin terminlarni to‘g‘rilaydi.
 */

const BASE = 'https://api.voicelab.uz'

function fail(status, error, code = '', transient = false) {
  const err = new Error(error)
  err.status = status
  err.code = code
  err.transient = transient
  return err
}

export function voiceLabError(status, body) {
  const code = body?.error?.code || body?.code || ''
  if (status === 402 || code === 'insufficient_credits' || code === 'api_key_credit_limit') {
    return fail(402, 'VoiceLab hisobida kredit tugadi', 'insufficient_credits')
  }
  if (status === 429) return fail(429, 'VoiceLab vaqtincha band. Birozdan so‘ng qayta urinib ko‘ring.', 'rate', true)
  if (status === 413 || code === 'audio_too_large') return fail(413, 'Audio hajmi VoiceLab limitidan oshdi', 'audio_too_large')
  if (status === 415) return fail(415, 'Audio formati qabul qilinmadi', 'media')
  if (status >= 500) return fail(502, 'VoiceLab vaqtincha javob bermadi', code || 'upstream', true)
  return fail(status || 502, 'VoiceLab so‘rovi muvaffaqiyatsiz', code || 'upstream', status === 0)
}

async function readBody(res) {
  const text = await res.text()
  if (!text) return {}
  try { return JSON.parse(text) } catch { return { raw: text.slice(0, 300) } }
}

export function pickVoiceLabModel(payload) {
  const list = Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload) ? payload : [])
  const orbit = list.find((item) => item?.id === 'aisha-orbit')
  const halo = list.find((item) => item?.id === 'aisha-halo')
  const chosen = orbit || halo || list[0]
  if (!chosen?.id) return null
  const efforts = Array.isArray(chosen.reasoning_efforts) ? chosen.reasoning_efforts : []
  let reasoning = ''
  if (chosen.id === 'aisha-orbit') {
    reasoning = efforts.length === 0 || efforts.includes('low') ? 'low' : ''
  } else if (efforts.includes('low')) {
    reasoning = 'low'
  }
  return { id: chosen.id, reasoning }
}

export function sttLanguage(env) {
  const raw = String(env?.VOICELAB_STT_LANGUAGE || 'uz').trim().toLowerCase()
  return /^[a-z]{2}$/.test(raw) || raw === 'auto' ? raw : 'uz'
}

export async function voiceLabModels({ fetch, apiKey }) {
  const res = await fetch(`${BASE}/v1/models`, { headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' } })
  const body = await readBody(res)
  if (!res.ok) throw voiceLabError(res.status, body)
  return body
}

export async function voiceLabPreflight({ fetch, apiKey, durationMs }) {
  const query = durationMs > 0 ? `?duration_ms=${Math.round(durationMs)}` : ''
  const res = await fetch(`${BASE}/v1/stt/preflight${query}`, { headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' } })
  const body = await readBody(res)
  if (!res.ok) throw voiceLabError(res.status, body)
  return body
}

export async function voiceLabSubmitStt({ fetch, apiKey, audio, idempotencyKey, language, durationMs }) {
  const form = new FormData()
  const bytes = audio instanceof Uint8Array ? audio : new Uint8Array(audio)
  form.append('audio', new Blob([bytes], { type: 'audio/mp4' }), 'lesson.m4a')
  form.append('language', language || 'uz')
  form.append('include_speakers', 'false')
  const headers = { Authorization: `Bearer ${apiKey}`, 'Idempotency-Key': idempotencyKey }
  if (durationMs > 0) headers['X-Audio-Duration-Ms'] = String(Math.round(durationMs))
  const res = await fetch(`${BASE}/v1/stt`, { method: 'POST', headers, body: form })
  const body = await readBody(res)
  if (res.status !== 202 && !res.ok) throw voiceLabError(res.status, body)
  if (!body?.id) throw fail(502, 'Transkripsiya identifikatori kelmadi', 'stt', true)
  return body
}

export async function voiceLabTranscription({ fetch, apiKey, id }) {
  const res = await fetch(`${BASE}/v1/stt/transcriptions/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
  })
  const body = await readBody(res)
  if (!res.ok) throw voiceLabError(res.status, body)
  return body
}

export async function voiceLabChat({ fetch, apiKey, idempotencyKey, model, reasoning, messages, maxTokens = 4096 }) {
  const payload = { model, messages, max_tokens: maxTokens, temperature: 0.2 }
  if (reasoning) payload.reasoning_effort = reasoning
  const res = await fetch(`${BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(payload),
  })
  const body = await readBody(res)
  if (!res.ok) throw voiceLabError(res.status, body)
  const text = body?.choices?.[0]?.message?.content
  if (typeof text !== 'string' || !text.trim()) throw fail(502, 'Model bo‘sh javob qaytardi', 'empty_model', true)
  return text.trim()
}
