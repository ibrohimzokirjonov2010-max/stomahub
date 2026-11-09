/** Sync clipboard + Telegram open for listing contact (iOS Safari / PWA safe). */

export function copyTextSync(text) {
  const value = String(text || '')
  if (!value) return false
  let ok = false
  try {
    const ta = document.createElement('textarea')
    ta.value = value
    ta.setAttribute('readonly', '')
    ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    ta.setSelectionRange(0, ta.value.length)
    ok = document.execCommand('copy')
    document.body.removeChild(ta)
  } catch {
    ok = false
  }
  try {
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(value)
  } catch { /* ignore */ }
  return ok
}

export function formatListingPrice(n) {
  return (Number(n) || 0).toLocaleString('ru-RU').replace(/\u00a0/g, ' ')
}

/** Message pasted into Telegram after user opens the chat. */
export function buildListingTelegramMessage({ title, price, url }) {
  const t = String(title || 'E’lon').trim() || 'E’lon'
  const p = formatListingPrice(price)
  const u = String(url || '').trim()
  return `Assalomu alaykum! StomaHub'dagi e'loningiz bo'yicha yozyapman: ${t} — ${p} so'm\n${u}`
}

/**
 * Copy intro message (sync), toast, then open t.me/<user>.
 * Must be called directly from a user tap handler.
 */
export function openTelegramWithListingMessage({ tgUrl, title, price, itemPath, onToast }) {
  if (!tgUrl) return
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const path = String(itemPath || '').startsWith('/') ? itemPath : `/${itemPath || ''}`
  const url = `${origin}${path}`
  const msg = buildListingTelegramMessage({ title, price, url })
  copyTextSync(msg)
  onToast?.('Xabar nusxalandi — Telegram’da joylashtiring')
  // Brief delay so toast paints; copy already ran synchronously above.
  const go = () => {
    try {
      window.location.assign(tgUrl)
    } catch {
      window.location.href = tgUrl
    }
  }
  if (typeof window !== 'undefined') setTimeout(go, 280)
  else go()
}
