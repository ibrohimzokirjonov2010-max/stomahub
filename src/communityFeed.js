import { useSyncExternalStore } from 'react'
import { ME } from './communityData'
import { bindBlob, touchBlob } from './recordSync'

const face = (n) => `/images/bemorlar/${n}.jpg`
const sem = (n) => `/images/seminars/${n}.jpg`
const kat = (n) => `/images/kategoriyalar/${n}.jpg`

export const FEED_TABS = [
  ['all', 'Hammasi'],
  ['case', 'Klinik case'],
  ['savol', 'Savollar'],
  ['maslahat', 'Maslahatlar'],
  ['yangilik', 'Yangiliklar'],
]

const seed = []

const DEMO_COMMUNITY = { posts: seed, liked: [], saved: [], likedComments: [], hidden: [] }
let state = { posts: [], liked: new Set(), saved: new Set(), likedComments: new Set(), hidden: new Set() }
const subs = new Set()
let quiet = false
const set = (next) => {
  state = { ...state, ...next }
  subs.forEach((fn) => fn())
  if (!quiet) touchBlob('community')
}
bindBlob('community', {
  seed: DEMO_COMMUNITY,
  get: () => ({
    posts: state.posts,
    liked: [...state.liked],
    saved: [...state.saved],
    hidden: [...state.hidden],
    likedComments: [...state.likedComments],
  }),
  empty: () => ({ posts: [], liked: [], saved: [], hidden: [], likedComments: [] }),
  set: (payload) => {
    quiet = true
    state = {
      posts: Array.isArray(payload?.posts) ? payload.posts : [],
      liked: new Set(payload?.liked || []),
      saved: new Set(payload?.saved || []),
      hidden: new Set(payload?.hidden || []),
      likedComments: new Set(payload?.likedComments || []),
    }
    subs.forEach((fn) => fn())
    quiet = false
  },
})
const subscribe = (fn) => {
  subs.add(fn)
  return () => subs.delete(fn)
}

export function useFeed() {
  return useSyncExternalStore(subscribe, () => state)
}

const toggle = (s, id) => {
  const n = new Set(s)
  if (n.has(id)) n.delete(id)
  else n.add(id)
  return n
}
const mapPost = (id, fn) => state.posts.map((p) => (p.id === id ? fn(p) : p))

export const countComments = (p) => p.comments.reduce((s, c) => s + 1 + c.replies.length, 0)

export const feed = {
  toggleLike(id) {
    set({ liked: toggle(state.liked, id) })
  },
  toggleSave(id) {
    set({ saved: toggle(state.saved, id) })
  },
  hide(id) {
    set({ hidden: toggle(state.hidden, id) })
  },
  remove(id) {
    set({ posts: state.posts.filter((p) => p.id !== id) })
  },
  add(post) {
    set({ posts: [post, ...state.posts] })
  },
  comment(postId, text, parentId, image) {
    const c = { id: `m${Date.now()}`, name: 'Shifokor', role: 'Stomatolog', time: 'Hozir', avatar: '', text, image, likes: 0, replies: [], mine: true }
    set({
      posts: mapPost(postId, (p) => ({
        ...p,
        comments: parentId
          ? p.comments.map((x) => (x.id === parentId ? { ...x, replies: [...x.replies, c] } : x))
          : [c, ...p.comments],
      })),
    })
  },
  removeComment(postId, cid) {
    set({
      posts: mapPost(postId, (p) => ({
        ...p,
        comments: p.comments.filter((x) => x.id !== cid).map((x) => ({ ...x, replies: x.replies.filter((r) => r.id !== cid) })),
      })),
    })
  },
  likeComment(postId, cid) {
    set({ likedComments: toggle(state.likedComments, `${postId}:${cid}`) })
  },
}
