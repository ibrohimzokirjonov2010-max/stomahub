export async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string') return req.body ? JSON.parse(req.body) : {}
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  if (!chunks.length) return {}
  const raw = Buffer.concat(chunks.map((chunk) => (Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))).toString('utf8')
  return raw ? JSON.parse(raw) : {}
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
