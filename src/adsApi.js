// Xaridor tomonidagi reklama joylari (0043): ads_placements() — SECURITY DEFINER, faqat
// tasdiqlangan, faol, balansi va byudjeti yetarli kampaniyalar. Tracking — ad_track() RPC,
// server tomonda dedupe, rate-limit va to‘lov (1 000 so‘m / haqiqiy bosish).
import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

const SID_KEY = 'sh_ad_sid'
function sessionId() {
  try {
    let s = localStorage.getItem(SID_KEY)
    if (!s || !/^[A-Za-z0-9-]{16,64}$/.test(s)) {
      s = (crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`).slice(0, 64)
      localStorage.setItem(SID_KEY, s)
    }
    return s
  } catch { return '' }
}

const cache = new Map() // kind -> { at, rows }
const TTL = 60_000
async function fetchPlacements(kind) {
  if (typeof window !== 'undefined' && window.__ADS_SHOT__) return window.__ADS_SHOT__[kind] || []
  const c = cache.get(kind)
  if (c && Date.now() - c.at < TTL) return c.rows
  if (!supabase) return []
  const { data, error } = await supabase.rpc('ads_placements', { p_kind: kind, p_region: null, p_limit: kind === 'banner' ? 5 : 8 })
  const rows = error ? [] : (data || []) // migratsiya hali qo‘llanmagan bo‘lsa — jim
  cache.set(kind, { at: Date.now(), rows })
  return rows
}

/** Reklama kampaniyalari ro‘yxati: [{ campaign_id, kind, title, description, image_url, shop_name, product_ids }] */
export function useAdPlacements(kind, enabled = true) {
  const [rows, setRows] = useState([])
  useEffect(() => {
    if (!enabled) return undefined
    let live = true
    fetchPlacements(kind).then((r) => { if (live) setRows(r) }).catch(() => {})
    return () => { live = false }
  }, [kind, enabled])
  return enabled ? rows : []
}

const seen = new Set()
/** Ko‘rish (sahifa sessiyasida bir marta) yoki bosish. Xatolar e’tiborsiz — UX’ni buzmaydi. */
export function trackAd(event, campaignId, productId) {
  if (!campaignId || !productId || !supabase || (typeof window !== 'undefined' && window.__ADS_SHOT__)) return
  const k = `${event}:${campaignId}:${productId}`
  if (event === 'view') { if (seen.has(k)) return; seen.add(k) }
  supabase.rpc('ad_track', { p_campaign: campaignId, p_product: productId, p_event: event, p_session: sessionId() }).then(() => {}, () => {})
}

/** Kampaniyalarni market mahsulotlariga bog‘lab, [{ ad, item }] qaytaradi (bitta mahsulot bir marta). */
export function joinAds(ads, items, pred = () => true, max = 2) {
  const byId = new Map(items.map((it) => [String(it.id), it]))
  const out = []; const used = new Set()
  for (const ad of ads) {
    for (const pid of ad.product_ids || []) {
      const it = byId.get(String(pid))
      if (!it || used.has(it.id) || !pred(it)) continue
      out.push({ ad, item: it }); used.add(it.id)
      break // bir kampaniyadan bitta mahsulot — turli sotuvchilar ko‘rinsin
    }
    if (out.length >= max) break
  }
  return out
}
