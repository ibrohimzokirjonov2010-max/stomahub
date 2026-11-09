import { fetchPublicListing, listingMetaFromRow, renderOgHtml, siteOrigin } from './_lib/ogListing.js'

function sendHtml(res, status, html) {
  res.statusCode = status
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
  res.end(html)
}

export default async function handler(req, res) {
  try {
    const rawUrl = req.url || '/'
    const u = new URL(rawUrl, 'http://local')
    const kind = u.searchParams.get('kind') || ''
    const id = u.searchParams.get('id') || ''
    const origin = siteOrigin(req)
    if (!['ad', 'surplus'].includes(kind) || !id) {
      return sendHtml(res, 400, renderOgHtml({
        title: 'StomaHub',
        description: 'Stomatologik marketplace',
        image: `${origin}/icons/favicon-256.png`,
        url: origin,
      }))
    }
    let row = null
    try {
      row = await fetchPublicListing(kind, id)
    } catch {
      row = null
    }
    if (!row) {
      return sendHtml(res, 404, renderOgHtml({
        title: 'E’lon topilmadi',
        description: 'Bu e’lon ommaviy emas yoki o‘chirilgan.',
        image: `${origin}/icons/favicon-256.png`,
        url: `${origin}${kind === 'ad' ? '/elonlar' : '/ortiqcha'}`,
      }))
    }
    const meta = listingMetaFromRow(kind, row, origin)
    return sendHtml(res, 200, renderOgHtml(meta))
  } catch (e) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end('OG xato')
  }
}
