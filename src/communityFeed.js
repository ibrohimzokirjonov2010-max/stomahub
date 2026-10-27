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

const seed = [
  {
    id: 'cct-milk',
    kind: 'case',
    author: ME.name,
    role: 'Stomatolog',
    place: 'Toshkent, O‘zbekiston',
    time: '3 kun oldin',
    avatar: ME.avatar,
    mine: true,
    title: 'Davolash natijasi: CCT bilan milk retsessiyasini yopish',
    body: 'Mandibular old tishlar sohasida milk retsessiyasi kuzatildi. CCT (Connective Tissue Graft) usuli bilan yopildi. 6 oylik nazorat natijasi. Bemorda sezgirlik kamaydi va estetik ko‘rinish yaxshilandi.',
    images: [sem('teeth'), face('bemor-intra')],
    layout: 'ba',
    tags: ['Parodontologiya', 'Klinik holat', 'CCT'],
    likes: 24,
    comments: [
      { id: 'c1', name: 'Dr. Malika Yusupova', role: 'Endodontist', time: '2 kun oldin', avatar: face('bemor-malika'), text: 'Ajoyib natija! Greft qaysi sohadan olindi — tanglaymi?', likes: 4, replies: [
        { id: 'c1r1', name: ME.name, role: 'Stomatolog', time: '2 kun oldin', avatar: ME.avatar, text: 'Ha, tanglayning premolyar sohasidan.', likes: 2, mine: true },
      ] },
      { id: 'c2', name: 'Dr. Jasur Murodov', role: 'Jarroh', time: '1 kun oldin', avatar: face('bemor-bobur'), text: 'Tikuv materiali sifatida nima ishlatdingiz?', likes: 1, replies: [] },
    ],
  },
  {
    id: 'kompozit-qatlam',
    kind: 'maslahat',
    author: 'Dr. Dilnoza Karimova',
    role: 'Stomatolog',
    place: 'Samarqand, O‘zbekiston',
    time: '5 kun oldin',
    avatar: face('bemor-dilnoza'),
    title: 'Kompozit restavratsiyada qatlamma usul',
    body: 'Posterior tishlarda kompozit bilan ishlashda qatlamma usul natijani yanada mustahkam va estetik qiladi. Siz qanday materiallardan foydalanasiz?',
    images: [sem('smile'), kat('kat-ortopediya'), face('bemor-intra')],
    layout: 'mosaic',
    tags: ['Terapiya', 'Kompozit', 'Maslahat'],
    likes: 18,
    comments: [
      { id: 'c1', name: 'Dr. Aziz Karimov', role: 'Implantolog', time: '4 kun oldin', avatar: face('bemor-aziz'), text: 'Men Filtek Z550 bilan ishlayman, polirovkasi juda yaxshi.', likes: 3, replies: [] },
      { id: 'c2', name: 'Dr. Sevara Aliyeva', role: 'Terapevt', time: '3 kun oldin', avatar: face('bemor-sevara'), text: 'Har bir qatlam 2 mm dan oshmasligi kerak, shunda kirishish kamroq bo‘ladi.', likes: 5, replies: [] },
    ],
  },
  {
    id: 'implant-protetik',
    kind: 'savol',
    author: 'Dr. Azizbek Murodov',
    role: 'Stomatolog',
    place: 'Andijon, O‘zbekiston',
    time: '1 hafta oldin',
    avatar: face('bemor-anvar'),
    title: 'Implantdan keyingi protetik bosqich',
    body: 'Implant qo‘yilgandan keyin protetik bosqichni qachon boshlaysiz? Pastki jag‘da 3 oy kutish yetarlimi yoki ISQ o‘lchovini kutasizmi?',
    images: [kat('kat-implant')],
    layout: 'single',
    tags: ['Implantologiya', 'Savol'],
    likes: 11,
    comments: [
      { id: 'c1', name: 'Dr. Sardor Karimov', role: 'Stomatolog-implantolog', time: '6 kun oldin', avatar: face('bemor-sardor'), text: 'ISQ 70 dan yuqori bo‘lsa, bemalol boshlash mumkin. Pastki jag‘da odatda 8–10 hafta yetadi.', likes: 7, replies: [] },
    ],
  },
  {
    id: 'sardor-implant',
    kind: 'case',
    author: 'Dr. Sardor Karimov',
    role: 'Stomatolog-implantolog',
    place: 'Toshkent, O‘zbekiston',
    time: '2 soat oldin',
    avatar: face('bemor-sardor'),
    title: 'Pastki jag‘da bitta tish implantatsiyasi',
    body: 'Bugun qiziqarli holat: pastki jag‘da bitta tish yo‘qotilgan bemorda implant qo‘yish amaliyoti. Natija juda yaxshi bo‘ldi. Sizlar bu holatda qanday yondashuvni tanlardingiz?',
    images: [sem('teeth'), kat('kat-implant'), face('bemor-intra')],
    layout: 'row',
    tags: ['Implantologiya', 'Klinik holat', 'Case study'],
    likes: 46,
    comments: [
      { id: 'c1', name: 'Dr. Malika Saidova', role: 'Stomatolog-ortoped', time: '1 soat oldin', avatar: face('bemor-malika'), text: 'Juda yaxshi natija! Men bunday holatlarda hamisha CBCT tekshiruvidan keyin rejalashtiraman.', likes: 3, replies: [] },
      { id: 'c2', name: 'Dr. Azizbek Mirzayev', role: 'Stomatolog-jarroh', time: '2 soat oldin', avatar: face('bemor-aziz'), text: 'Ajoyib ish! Qaysi implant tizimidan foydalandiz? Stabilizatsiya darajasi qanday bo‘ldi?', likes: 2, replies: [] },
      { id: 'c3', name: 'Dilshod Raxmonov', role: 'Talaba', time: '3 soat oldin', text: 'Rahmat, juda foydali holat. Shunga o‘xshash case’larni ko‘proq ko‘rsangiz.', likes: 1, replies: [] },
    ],
  },
  {
    id: 'stomaexpo',
    kind: 'yangilik',
    author: 'StomaHub jamoasi',
    role: 'Rasmiy',
    place: 'Toshkent',
    time: '1 hafta oldin',
    official: true,
    title: 'StomaExpo 2026: ro‘yxatdan o‘tish ochildi',
    body: 'Noyabr oyida Toshkentda bo‘ladigan StomaExpo ko‘rgazmasida 120 dan ortiq ishlab chiqaruvchi, master-klasslar va jonli jarrohlik translyatsiyalari bo‘ladi.',
    images: ['/images/yangiliklar/yang-expo.jpg'],
    layout: 'single',
    tags: ['Yangilik', 'Ko‘rgazma'],
    likes: 63,
    comments: [],
  },
]

const DEMO_COMMUNITY = { posts: seed, liked: ['sardor-implant'], saved: [], likedComments: [], hidden: [] }
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
