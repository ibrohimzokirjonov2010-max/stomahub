// POST /api/image-search { image: "data:image/jpeg;base64,..." }
// The client crops + resizes the photo (≤1024px JPEG) and sends only the selected area.
// A cheap vision model (via Vercel AI Gateway) names the product; the client then searches
// the real marketplace with the returned keywords. Images are never stored or logged.
//
// Auth: AI_GATEWAY_API_KEY, or the Vercel OIDC token (VERCEL_OIDC_TOKEN, injected automatically
// on Vercel deployments). Without either → 503 "Rasm qidiruvi hali sozlanmagan".
// Model can be overridden with IMAGE_SEARCH_MODEL (default google/gemini-2.5-flash-lite).
import { generateObject } from 'ai'
import { z } from 'zod'
import { clientIp, readJson, requirePost, send } from './_lib/http.js'
import { fetchPublicListing, listingMetaFromRow, renderOgHtml, siteOrigin } from './_lib/ogListing.js'

const MODEL = process.env.IMAGE_SEARCH_MODEL || 'google/gemini-2.5-flash-lite'
const MAX_BYTES = 1.5 * 1024 * 1024 // decoded image
const NOT_CONFIGURED = 'Rasm qidiruvi hali sozlanmagan'

// Light per-IP limiter (per warm instance): 8 requests / minute.
const WINDOW_MS = 60_000
const LIMIT = 8
const hits = new Map()
function limited(ip) {
  const now = Date.now()
  const arr = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS)
  arr.push(now)
  hits.set(ip, arr)
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k)
  return arr.length > LIMIT
}

export const schema = z.object({
  found: z.boolean().describe('false if no dental/medical product is visible'),
  name: z.string().max(120).describe('Short product name as sold, e.g. "Kompozit plomba materiali Filtek Z250"'),
  brand: z.string().max(60).describe('Brand/manufacturer if readable or recognisable, else empty'),
  category: z.string().max(60).describe('Product category in Uzbek (Latin), e.g. "Plomba materiallari", "Asboblar", "Implantlar"'),
  keywords_uz: z.array(z.string().max(40)).max(8).describe('Search keywords in Uzbek Latin script'),
  keywords_en: z.array(z.string().max(40)).max(8).describe('Search keywords in English, incl. model/brand terms'),
})

const PROMPT = `Sen StomaHub — O‘zbekistondagi stomatologiya marketplace'i uchun mahsulotni rasmdan aniqlovchi yordamchisan.
Rasmdagi asosiy mahsulotni aniqla (stomatologiya materiallari, asboblar, uskunalar, sarf materiallari).
- name: qisqa mahsulot nomi (brend + model bo‘lsa yoz). Qadoqdagi yozuvni o‘qishga harakat qil.
- brand: o‘qilsa yoki aniq tanilsa, aks holda bo‘sh.
- category: o‘zbek (lotin) tilida.
- keywords_uz: o‘zbek lotin yozuvida 3-8 ta qidiruv so‘zi (rus so‘zlarini ishlatma).
- keywords_en: inglizcha 3-8 ta qidiruv so‘zi (brend, model, mahsulot turi).
Agar rasmda mahsulot bo‘lmasa found=false qaytar. Taxmin qilma — bilmasang umumiy turini yoz.`

function cleanList(a) {
  const seen = new Set()
  return (a || []).map((s) => String(s).trim()).filter((s) => s && s.length <= 40 && !seen.has(s.toLowerCase()) && seen.add(s.toLowerCase())).slice(0, 8)
}

async function handleOg(req, res) {
  try {
    const u = new URL(req.url || '/', 'http://local')
    const kind = u.searchParams.get('kind') || ''
    const id = u.searchParams.get('id') || ''
    const origin = siteOrigin(req)
    const sendHtml = (status, html) => {
      res.statusCode = status
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
      res.end(html)
    }
    if (!['ad', 'surplus'].includes(kind) || !id) {
      return sendHtml(400, renderOgHtml({
        title: 'StomaHub',
        description: 'Stomatologik marketplace',
        image: `${origin}/icons/favicon-256.png`,
        url: origin,
      }))
    }
    let row = null
    try { row = await fetchPublicListing(kind, id) } catch { row = null }
    if (!row) {
      return sendHtml(404, renderOgHtml({
        title: 'E’lon topilmadi',
        description: 'Bu e’lon ommaviy emas yoki o‘chirilgan.',
        image: `${origin}/icons/favicon-256.png`,
        url: `${origin}${kind === 'ad' ? '/elonlar' : '/ortiqcha'}`,
      }))
    }
    return sendHtml(200, renderOgHtml(listingMetaFromRow(kind, row, origin)))
  } catch {
    res.statusCode = 500
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end('OG xato')
  }
}

export default async function handler(req, res) {
  const pathQ = (req.url || '').split('?')[1] || ''
  const qs = new URLSearchParams(pathQ)
  if (req.method === 'GET' && (qs.get('og') === '1' || qs.get('kind'))) {
    return handleOg(req, res)
  }
  res.setHeader('Cache-Control', 'no-store')
  if (!requirePost(req, res)) return
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) {
    return send(res, 503, { ok: false, error: NOT_CONFIGURED, code: 'not_configured' })
  }
  if (limited(clientIp(req) || 'unknown')) {
    res.setHeader('Retry-After', '60')
    return send(res, 429, { ok: false, error: 'Juda ko‘p so‘rov. Bir daqiqadan so‘ng qayta urinib ko‘ring.' })
  }
  let body
  try { body = await readJson(req) } catch { return send(res, 400, { ok: false, error: 'Noto‘g‘ri so‘rov' }) }
  const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(body?.image || ''))
  if (!m) return send(res, 400, { ok: false, error: 'Rasm topilmadi yoki formati noto‘g‘ri (JPEG, PNG, WEBP)' })
  const bytes = Buffer.from(m[2], 'base64')
  if (bytes.length < 200) return send(res, 400, { ok: false, error: 'Rasm juda kichik' })
  if (bytes.length > MAX_BYTES) return send(res, 413, { ok: false, error: 'Rasm hajmi juda katta (1,5 MB dan oshmasin)' })

  try {
    const { object } = await generateObject({
      model: MODEL,
      schema,
      maxRetries: 1,
      abortSignal: AbortSignal.timeout(25_000),
      messages: [{ role: 'user', content: [{ type: 'text', text: PROMPT }, { type: 'image', image: bytes, mediaType: `image/${m[1]}` }] }],
    })
    return send(res, 200, {
      ok: true,
      found: !!object.found && !!object.name.trim(),
      name: object.name.trim(),
      brand: object.brand.trim(),
      category: object.category.trim(),
      keywords_uz: cleanList(object.keywords_uz),
      keywords_en: cleanList(object.keywords_en),
    })
  } catch (e) {
    const status = e?.statusCode || e?.status || e?.cause?.statusCode
    const msg = String(e?.message || '')
    console.error('image-search failed', status || '', e?.name || '', msg.slice(0, 200))
    if (status === 401 || status === 403 || /api key|oidc|authenticat|unauthori/i.test(msg)) {
      return send(res, 503, { ok: false, error: NOT_CONFIGURED, code: 'auth' })
    }
    return send(res, 502, { ok: false, error: 'Rasmni tahlil qilib bo‘lmadi. Qayta urinib ko‘ring.' })
  }
}
