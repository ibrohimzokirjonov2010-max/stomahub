// Baholash rasmlari: siqish, URL tekshiruvi, storage path. Node testlari ham shu yerdan o‘qiydi.

export const REVIEW_PHOTO_MAX = 3
export const REVIEW_PHOTO_MAX_EDGE = 1600
export const REVIEW_PHOTO_QUALITY = 0.8
export const REVIEW_MEDIA_BUCKET = 'seller-media'
export const REVIEW_MEDIA_MARK = `/storage/v1/object/public/${REVIEW_MEDIA_BUCKET}/`

/** Klientda siqish: uzun tomoni ≤1600px, JPEG sifat 0.8 (WebP bo‘lsa — undan). */
export async function compressReviewImage(blob, max = REVIEW_PHOTO_MAX_EDGE, quality = REVIEW_PHOTO_QUALITY) {
  if (!blob?.type?.startsWith('image/') || blob.type === 'image/gif' || typeof document === 'undefined') return blob
  try {
    const bmp = await window.createImageBitmap(blob)
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height))
    const c = document.createElement('canvas')
    c.width = Math.round(bmp.width * k)
    c.height = Math.round(bmp.height * k)
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height)
    bmp.close?.()
    const enc = (type) => new Promise((ok) => c.toBlob((b) => ok(b), type, quality))
    let out = await enc('image/webp')
    if (!out || out.type !== 'image/webp') out = await enc('image/jpeg')
    return out && (out.size < blob.size || k < 1) ? out : blob
  } catch {
    return blob
  }
}

/** Faqat o‘z uid papkasidagi seller-media/reviews URL larini qoldiradi (max 3). */
export function normalizeReviewPhotoUrls(urls, uid) {
  const id = String(uid || '')
  if (!id) return []
  const out = []
  for (const raw of Array.isArray(urls) ? urls : []) {
    const u = String(raw || '').trim().split('?')[0]
    if (!/^https:\/\//i.test(u)) continue
    const i = u.indexOf(REVIEW_MEDIA_MARK)
    if (i < 0) continue
    let path = u.slice(i + REVIEW_MEDIA_MARK.length)
    try { path = decodeURIComponent(path) } catch { /* keep raw */ }
    if (!path.startsWith(`${id}/reviews/`)) continue
    if (!out.includes(u)) out.push(u)
    if (out.length >= REVIEW_PHOTO_MAX) break
  }
  return out
}

/** DB/jsonb dan massiv URL: string[] yoki [{url}] shaklida kelishi mumkin. */
export function reviewImageList(images) {
  if (!Array.isArray(images)) return []
  return images.map((x) => (typeof x === 'string' ? x : x?.url)).filter((u) => typeof u === 'string' && u.length > 0)
}

export function reviewPhotoPath(uid, ext = 'jpg') {
  const e = String(ext || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  return `${uid}/reviews/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${e}`
}
