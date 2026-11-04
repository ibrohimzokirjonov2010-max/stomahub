import { useSyncExternalStore } from 'react'
import { supabase } from './supabaseClient'
import { bindBlob, touchBlob, currentUid, onAccount } from './recordSync'
import { seedPosts } from './communityData'

// Hamjamiyat: barcha postlar BITTA umumiy jadvalda (public.community_posts).
// Sayt ham, admin ham shu jadvalni o‘qiydi. Muallif ismi va avatari har safar
// o‘qish paytida profiles jadvalidan (author_id bo‘yicha) jonli olinadi —
// snapshot saqlanmaydi. Shaxsiy UI holati (like/saqlash/yashirish) blobda qoladi.

export const FEED_TABS = [
  ['all', 'Hammasi'],
  ['case', 'Klinik case'],
  ['savol', 'Savollar'],
  ['muhokama', 'Muhokamalar'],
  ['maslahat', 'Maslahatlar'],
  ['yangilik', 'Yangiliklar'],
]

// Desktop va mobil formalar uchun yagona post turlari.
export const POST_KINDS = [
  ['case', 'Klinik keys'],
  ['savol', 'Savol'],
  ['muhokama', 'Muhokama'],
]
export const EMPTY_POST_ERROR = 'Sarlavha va matnni kiriting'
export const CONSENT_ERROR = 'Klinik keys yoki rasmli post uchun bemor roziligi belgilanishi kerak.'

// Yagona validatsiya (desktop + mobil). Server ham shu shartni CHECK bilan tekshiradi.
export function validatePost({ title, body, kind, images = [], consent }) {
  if (!String(title || '').trim() || !String(body || '').trim()) return EMPTY_POST_ERROR
  if (String(title).trim().length < 3) return 'Sarlavha kamida 3 belgidan iborat bo‘lsin'
  if ((kind === 'case' || images.length > 0) && !consent) return CONSENT_ERROR
  return ''
}

// Yagona ism/initsial resolver (postlar va izohlar uchun).
export const displayName = (a) => String(a?.full_name || a?.name || '').trim() || 'Foydalanuvchi'
export const initials = (name) => String(name || '').replace(/^Dr\.?\s*/i, '').split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?'

let state = { posts: [], legacy: [], live: false, ready: false, liked: new Set(), saved: new Set(), likedComments: new Set(), hidden: new Set() }
const subs = new Set()
let quiet = false
const emit = () => subs.forEach((fn) => fn())
const set = (next, persist = true) => {
  state = { ...state, ...next }
  emit()
  if (persist && !quiet) touchBlob('community')
}
bindBlob('community', {
  seed: { posts: [], liked: [], saved: [], likedComments: [], hidden: [] },
  // Eski shaxsiy postlar (payload.posts) o‘zgartirilmay qaytariladi — migratsiya ularni nusxalaydi, o‘chirmaydi.
  get: () => ({
    posts: state.legacy,
    liked: [...state.liked],
    saved: [...state.saved],
    hidden: [...state.hidden],
    likedComments: [...state.likedComments],
  }),
  empty: () => ({ posts: [], liked: [], saved: [], hidden: [], likedComments: [] }),
  set: (payload) => {
    quiet = true
    state = {
      ...state,
      legacy: Array.isArray(payload?.posts) ? payload.posts : [],
      liked: new Set(payload?.liked || []),
      saved: new Set(payload?.saved || []),
      hidden: new Set(payload?.hidden || []),
      likedComments: new Set(payload?.likedComments || []),
    }
    emit()
    quiet = false
  },
})
const subscribe = (fn) => {
  subs.add(fn)
  return () => subs.delete(fn)
}

const ago = (iso) => {
  const t = Date.parse(iso)
  if (!t) return ''
  const s = Math.max(0, (Date.now() - t) / 1000)
  if (s < 60) return 'Hozir'
  if (s < 3600) return `${Math.floor(s / 60)} daq oldin`
  if (s < 86400) return `${Math.floor(s / 3600)} soat oldin`
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} kun oldin`
  return new Date(t).toLocaleDateString('ru-RU', { timeZone: 'Asia/Tashkent' })
}
const person = (a) => ({ authorId: a?.id || null, name: displayName(a), avatar: a?.avatar || '', role: a?.role || 'Stomatolog' })

function fromRow(r) {
  const au = person(r.author)
  const flat = (Array.isArray(r.comments) ? r.comments : []).map((c) => {
    const ca = person(c.author)
    return { id: c.id, parentId: c.parent_id || null, ...ca, text: c.text || '', image: c.image || null, time: ago(c.created_at), createdAt: c.created_at, likes: 0, replies: [], mine: !!c.mine }
  })
  const byId = new Map(flat.map((c) => [c.id, c]))
  const top = []
  flat.forEach((c) => {
    const parent = c.parentId && byId.get(c.parentId)
    if (parent) (parent.parentId && byId.get(parent.parentId) ? byId.get(parent.parentId) : parent).replies.push(c)
    else top.push(c)
  })
  top.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
  const images = Array.isArray(r.images) ? r.images.filter(Boolean) : []
  return {
    id: r.id,
    kind: r.kind || 'muhokama',
    topic: r.topic || '',
    author: au.name,
    name: au.name,
    avatar: au.avatar,
    role: au.role,
    authorId: au.authorId,
    time: ago(r.created_at),
    createdAt: r.created_at,
    edited: !!r.edited_at,
    title: r.title || '',
    body: r.body || '',
    images,
    tags: Array.isArray(r.tags) ? r.tags : [],
    layout: images.length >= 3 ? 'mosaic' : undefined,
    consent: !!r.consent,
    hiddenByAdmin: !!r.hidden,
    likes: 0,
    shares: 0,
    comments: top,
    mine: !!r.mine,
  }
}
const legacyNorm = (p) => ({ likes: 0, shares: 0, images: [], tags: [], ...p, comments: Array.isArray(p?.comments) ? p.comments.map((c) => ({ ...c, replies: Array.isArray(c?.replies) ? c.replies : [] })) : [] })

let loading = null
export function reloadFeed() {
  if (!supabase) {
    set({ ready: true, live: false }, false)
    return Promise.resolve()
  }
  loading = supabase.rpc('community_feed', { p_limit: 300 }).then(({ data, error }) => {
    if (error) {
      // Migratsiya hali qo‘llanmagan bo‘lsa — eski manbalar bilan ishlashda davom etamiz.
      set({ live: false, ready: true }, false)
      return
    }
    set({ posts: (Array.isArray(data) ? data : []).map(fromRow), live: true, ready: true }, false)
  }).catch(() => set({ live: false, ready: true }, false)).finally(() => { loading = null })
  return loading
}
reloadFeed()
onAccount(() => { reloadFeed() })

const visible = () => {
  if (state.live) return state.posts
  const ids = new Set(state.legacy.map((p) => p?.id))
  return [...state.legacy.map(legacyNorm), ...seedPosts.filter((p) => p && p.id != null && !p._pending && !ids.has(p.id)).map(legacyNorm)]
}
let lastSnap = null
let lastKey = null
const snapshot = () => {
  if (lastKey !== state) {
    lastKey = state
    lastSnap = { ...state, posts: visible() }
  }
  return lastSnap
}
export function useFeed() {
  return useSyncExternalStore(subscribe, snapshot)
}

const toggle = (s, id) => {
  const n = new Set(s)
  if (n.has(id)) n.delete(id)
  else n.add(id)
  return n
}

export const countComments = (p) => (Array.isArray(p.comments) ? p.comments.reduce((s, c) => s + 1 + (c.replies?.length || 0), 0) : Number(p.comments) || 0)

// data:/blob: rasmlarni ommaviy 'avatars' bucketiga ({uid}/posts/...) yuklaydi.
async function storeImage(src, i) {
  const s = String(src || '')
  if (!/^(data|blob):/.test(s)) return s
  const uid = currentUid()
  if (!supabase || !uid) throw new Error('Rasm yuklash uchun tizimga kiring')
  const blob = await (await fetch(s)).blob()
  const ext = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg'
  const path = `${uid}/posts/${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}.${ext}`
  const { error } = await supabase.storage.from('avatars').upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: false })
  if (error) throw error
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
}
const fail = (error) => ({ ok: false, error: error?.message || String(error || 'Xatolik') })
const need = () => {
  if (!supabase || !currentUid()) return 'Avval tizimga kiring'
  if (!state.live) return 'Hamjamiyat serveri hali yangilanmagan. Keyinroq urinib ko‘ring.'
  return ''
}

export const feed = {
  toggleLike(id) { set({ liked: toggle(state.liked, id) }) },
  toggleSave(id) { set({ saved: toggle(state.saved, id) }) },
  hide(id) { set({ hidden: toggle(state.hidden, id) }) },
  likeComment(postId, cid) { set({ likedComments: toggle(state.likedComments, `${postId}:${cid}`) }) },

  async add(post) {
    const why = need() || validatePost(post)
    if (why) return fail(why)
    try {
      const images = await Promise.all((post.images || []).map(storeImage))
      const row = {
        id: `p${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
        author_id: currentUid(),
        kind: post.kind,
        topic: post.topic || '',
        title: post.title.trim(),
        body: post.body.trim(),
        images,
        tags: post.tags || [],
        meta: post.meta || {},
        consent: !!post.consent,
      }
      const { error } = await supabase.from('community_posts').insert(row)
      if (error) return fail(error)
      await reloadFeed()
      return { ok: true, id: row.id }
    } catch (e) { return fail(e) }
  },
  async update(id, patch) {
    const why = need() || validatePost(patch)
    if (why) return fail(why)
    try {
      const images = await Promise.all((patch.images || []).map(storeImage))
      const { data, error } = await supabase.from('community_posts')
        .update({ kind: patch.kind, topic: patch.topic || '', title: patch.title.trim(), body: patch.body.trim(), images, consent: !!patch.consent })
        .eq('id', id).select('id')
      if (error) return fail(error)
      if (!data?.length) return fail('Faqat muallif tahrirlay oladi')
      await reloadFeed()
      return { ok: true }
    } catch (e) { return fail(e) }
  },
  async remove(id) {
    const why = need()
    if (why) return fail(why)
    const { data, error } = await supabase.from('community_posts').delete().eq('id', id).select('id')
    if (error) return fail(error)
    if (!data?.length) return fail('Faqat muallif o‘chira oladi')
    set({ posts: state.posts.filter((p) => p.id !== id) }, false)
    return { ok: true }
  },
  async comment(postId, text, parentId, image) {
    const why = need()
    if (why) return fail(why)
    try {
      const img = image ? await storeImage(image, 0) : null
      const { error } = await supabase.from('community_comments').insert({
        id: `c${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
        post_id: postId,
        parent_id: parentId || null,
        author_id: currentUid(),
        text: String(text || '').trim(),
        image: img,
      })
      if (error) return fail(error)
      await reloadFeed()
      return { ok: true }
    } catch (e) { return fail(e) }
  },
  async removeComment(postId, cid) {
    const why = need()
    if (why) return fail(why)
    const { data, error } = await supabase.from('community_comments').delete().eq('id', cid).select('id')
    if (error) return fail(error)
    if (!data?.length) return fail('Faqat muallif o‘chira oladi')
    await reloadFeed()
    return { ok: true }
  },
  async report(postId, reason) {
    const why = need()
    if (why) return fail(why)
    const { error } = await supabase.from('community_reports').insert({ post_id: postId, reporter_id: currentUid(), reason: String(reason || '').trim() || 'Nomaqbul kontent' })
    if (error) return fail(error.code === '23505' ? 'Siz bu postga allaqachon shikoyat qilgansiz' : error)
    return { ok: true }
  },
}
