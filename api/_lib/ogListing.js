import { anonClient } from './supabaseAdmin.js'

const BOT_UA = /TelegramBot|facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|vkShare|Googlebot/i

export function isBotUserAgent(ua) {
  return BOT_UA.test(String(ua || ''))
}

export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function siteOrigin(req) {
  const env = (process.env.PUBLIC_SITE_URL || process.env.VITE_PUBLIC_SITE_URL || '').replace(/\/$/, '')
  if (env) return env
  const host = req?.headers?.['x-forwarded-host'] || req?.headers?.host || 'stomahub-three.vercel.app'
  const proto = req?.headers?.['x-forwarded-proto'] || 'https'
  return `${proto}://${String(host).split(',')[0].trim()}`
}

function absUrl(origin, maybe) {
  const u = String(maybe || '').trim()
  if (!u) return `${origin}/icons/favicon-256.png`
  if (/^https?:\/\//i.test(u)) return u
  if (u.startsWith('//')) return `https:${u}`
  if (u.startsWith('/')) return `${origin}${u}`
  return `${origin}/${u}`
}

function priceLabel(n) {
  const v = Number(n) || 0
  return `${v.toLocaleString('ru-RU').replace(/\u00a0/g, ' ')} so‘m`
}

export function listingMetaFromRow(kind, row, origin) {
  const payload = row?.payload || {}
  const title = kind === 'ad'
    ? (payload.title || 'E’lon')
    : (payload.name || payload.title || 'Ortiqcha material')
  const price = payload.price
  const desc = kind === 'ad'
    ? `${priceLabel(price)}${payload.city ? ` · ${payload.city}` : ''} — StomaHub E’lonlar`
    : `${priceLabel(price)}${payload.city ? ` · ${payload.city}` : ''} — StomaHub Ortiqcha`
  const img = Array.isArray(payload.images) && payload.images[0]
    ? payload.images[0]
    : (payload.image || '')
  const path = kind === 'ad' ? `/elonlar/${row.id}` : `/ortiqcha/${row.id}`
  return {
    title: String(title).slice(0, 120),
    description: String(desc).slice(0, 200),
    image: absUrl(origin, img),
    url: `${origin}${path}`,
    path,
  }
}

export function renderOgHtml(meta, { siteName = 'StomaHub' } = {}) {
  const title = escapeHtml(meta.title)
  const desc = escapeHtml(meta.description)
  const url = escapeHtml(meta.url)
  const image = escapeHtml(meta.image)
  const site = escapeHtml(siteName)
  return `<!doctype html>
<html lang="uz">
<head>
  <meta charset="utf-8" />
  <title>${title} — ${site}</title>
  <meta name="description" content="${desc}" />
  <link rel="canonical" href="${url}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${site}" />
  <meta property="og:locale" content="uz_UZ" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${image}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${desc}" />
  <meta name="twitter:image" content="${image}" />
</head>
<body>
  <h1>${title}</h1>
  <p>${desc}</p>
  <p><a href="${url}">${url}</a></p>
</body>
</html>`
}

/** Public listing only: hidden=false; status active when column/payload present. */
export async function fetchPublicListing(kind, id) {
  if (!['ad', 'surplus'].includes(kind) || !id) return null
  // fail-fast: avoid hanging createClient when env is missing (local curl/tests)
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
  if (!url || !key) return null
  const sb = anonClient()
  const withTimeout = (promise, ms = 2500) => Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error('og_timeout')), ms)),
  ])
  try {
    let { data, error } = await withTimeout(
      sb.from('catalog_items')
        .select('id, kind, hidden, payload, status')
        .eq('kind', kind)
        .eq('id', String(id))
        .eq('hidden', false)
        .maybeSingle(),
    )
    if (error && /status/i.test(error.message || '')) {
      ;({ data, error } = await withTimeout(
        sb.from('catalog_items')
          .select('id, kind, hidden, payload')
          .eq('kind', kind)
          .eq('id', String(id))
          .eq('hidden', false)
          .maybeSingle(),
      ))
    }
    if (error || !data) return null
    const status = data.status || data.payload?.status || 'active'
    if (status !== 'active') return null
    return data
  } catch {
    return null
  }
}
