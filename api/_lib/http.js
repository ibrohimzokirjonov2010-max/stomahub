function parseRaw(raw, contentType) {
  if (!raw) return {}
  const ct = String(contentType || '')
  const t = raw.trim()
  if (/application\/x-www-form-urlencoded/i.test(ct) || (!/json/i.test(ct) && !t.startsWith('{') && !t.startsWith('[') && t.includes('='))) {
    return Object.fromEntries(new URLSearchParams(raw))
  }
  return JSON.parse(raw)
}

/** JSON yoki application/x-www-form-urlencoded (Click callback’lari form ko‘rinishida keladi). */
export async function readJson(req) {
  const ct = req.headers?.['content-type']
  if (Buffer.isBuffer(req.body)) return parseRaw(req.body.toString('utf8'), ct)
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string') return parseRaw(req.body, ct)
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  if (!chunks.length) return {}
  const raw = Buffer.concat(chunks.map((chunk) => (Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))).toString('utf8')
  return parseRaw(raw, ct)
}

export function send(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

export function clientIp(req) {
  const fwd = req.headers['x-forwarded-for']
  return String(fwd || req.socket?.remoteAddress || '').split(',')[0].trim().slice(0, 80)
}

export function requirePost(req, res) {
  if (req.method === 'POST') return true
  send(res, 405, { ok: false, error: 'Faqat POST' })
  return false
}
