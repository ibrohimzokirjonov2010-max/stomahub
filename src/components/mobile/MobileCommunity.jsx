import { useCallback, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, SlidersHorizontal, Image as ImageIcon, Video, Plus, Heart, MessageCircle, Bookmark, Share2, MoreHorizontal,
  Lightbulb, HelpCircle, Newspaper, PenLine, X, Check, Link2, EyeOff, Flag, Trash2, BadgeCheck,
} from 'lucide-react'
import { useProfile } from '../../profileStore'
import { FEED_TABS, useFeed, feed, countComments } from '../../communityFeed'
import { MobileTopBar, MobileToast } from './parts'
import MobileTabBar from './MobileTabBar'
import { BottomSheet, ToothIcon } from './MobileSeminars'

export const KIND = {
  case: { label: 'Klinik case', icon: ToothIcon, cls: 'bg-[#e8f1ff] text-[#2f6fe4]' },
  maslahat: { label: 'Maslahatlar', icon: Lightbulb, cls: 'bg-[#e3f8ef] text-[#1f9d63]' },
  savol: { label: 'Savollar', icon: HelpCircle, cls: 'bg-[#f3e8ff] text-[#8b3fd6]' },
  yangilik: { label: 'Yangiliklar', icon: Newspaper, cls: 'bg-[#fff3df] text-[#c77700]' },
}
const SORTS = [['new', 'Eng yangi'], ['top', 'Eng mashhur'], ['talk', 'Ko‘p muhokama qilingan']]

export const postLink = (p) => `${window.location.origin}/community/${p.id}`

export function Avatar({ p, size = 'size-11' }) {
  if (p.official) return <span className={`${size} grid shrink-0 place-items-center rounded-full bg-sea text-white`}><ToothIcon className="size-1/2" /></span>
  if (p.avatar) return <img src={p.avatar} alt="" className={`${size} shrink-0 rounded-full object-cover`} />
  const ini = (p.name || p.author).replace('Dr. ', '').split(' ').map((w) => w[0]).slice(0, 2).join('')
  return <span className={`${size} grid shrink-0 place-items-center rounded-full bg-[#e9eef3] text-[13px] font-semibold text-[#6b7f95]`}>{ini}</span>
}

export function KindBadge({ kind }) {
  const k = KIND[kind]
  const Icon = k.icon
  return <span className={`inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2 text-[10.5px] font-semibold ${k.cls}`}><Icon className="size-3.5" /> {k.label}</span>
}

export function PostImages({ p, onOpen }) {
  const img = (src, i, cls) => (
    <button key={src + i} type="button" onClick={(e) => { e.stopPropagation(); onOpen(i) }} className={`relative overflow-hidden rounded-xl bg-page ${cls}`}>
      <img src={src} alt="" loading="lazy" className="size-full object-cover" />
      {p.layout === 'ba' && <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">{i ? 'Keyin' : 'Oldin'}</span>}
    </button>
  )
  const im = p.images
  if (!im.length) return null
  if (p.layout === 'ba') return <div className="grid grid-cols-2 gap-1.5">{im.slice(0, 2).map((s, i) => img(s, i, 'h-[118px]'))}</div>
  if (p.layout === 'mosaic') {
    return (
      <div className="grid h-[150px] grid-cols-[1.25fr_1fr] gap-1.5">
        {img(im[0], 0, 'h-full')}
        <div className="grid grid-rows-2 gap-1.5">{im.slice(1, 3).map((s, i) => img(s, i + 1, 'h-full'))}</div>
      </div>
    )
  }
  if (p.layout === 'row') return <div className="grid grid-cols-3 gap-1.5">{im.slice(0, 3).map((s, i) => img(s, i, 'h-[96px]'))}</div>
  return img(im[0], 0, 'block h-[170px] w-full')
}

export function Lightbox({ images, index, onClose }) {
  const [i, setI] = useState(index)
  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-black/90" onClick={onClose}>
      <div className="flex items-center justify-between px-4 pt-4 text-white">
        <span className="text-[13px]">{i + 1} / {images.length}</span>
        <button type="button" onClick={onClose} aria-label="Yopish" className="grid size-9 place-items-center rounded-full bg-white/15"><X className="size-5" /></button>
      </div>
      <div className="grid flex-1 place-items-center p-4">
        <img src={images[i]} alt="" className="max-h-[70dvh] max-w-full rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
      </div>
      {images.length > 1 && (
        <div className="flex justify-center gap-2 pb-8" onClick={(e) => e.stopPropagation()}>
          {images.map((src, k) => (
            <button key={src + k} type="button" onClick={() => setI(k)} aria-label={`Rasm ${k + 1}`} className={`size-12 overflow-hidden rounded-lg ${k === i ? 'ring-2 ring-white' : 'opacity-50'}`}><img src={src} alt="" className="size-full object-cover" /></button>
          ))}
        </div>
      )}
    </div>
  )
}

export function PostMenu({ p, saved, onClose, onToast, onDeleted }) {
  const item = (Icon, label, fn, danger) => (
    <button type="button" onClick={() => { fn(); onClose() }} className={`flex h-12 w-full items-center gap-3 rounded-xl px-2 text-left text-[14px] font-medium ${danger ? 'text-sale' : 'text-ink'} active:bg-page`}>
      <Icon className="size-5" /> {label}
    </button>
  )
  return (
    <BottomSheet title="" onClose={onClose}>
      {item(Bookmark, saved ? 'Saqlanganlardan olib tashlash' : 'Saqlash', () => { feed.toggleSave(p.id); onToast(saved ? 'Saqlanganlardan olib tashlandi' : 'Saqlandi') })}
      {item(Link2, 'Havolani nusxalash', () => { navigator.clipboard?.writeText(postLink(p)).catch(() => {}); onToast('Havola nusxalandi') })}
      {p.mine
        ? item(Trash2, 'Postni o‘chirish', () => { feed.remove(p.id); onToast('Post o‘chirildi'); onDeleted?.() }, true)
        : (
          <>
            {item(EyeOff, 'Bu postni yashirish', () => { feed.hide(p.id); onToast('Post yashirildi'); onDeleted?.() })}
            {item(Flag, 'Shikoyat qilish', () => onToast('Shikoyatingiz moderatorlarga yuborildi'), true)}
          </>
        )}
    </BottomSheet>
  )
}

export async function sharePost(p, onToast) {
  if (navigator.share) {
    try {
      await navigator.share({ title: p.title, url: postLink(p) })
    } catch { /* bekor qilindi */ }
    return
  }
  navigator.clipboard?.writeText(postLink(p)).catch(() => {})
  onToast('Havola nusxalandi')
}

function viewerOf(profile) {
  if (!profile?.accountLive) return { name: 'Mehmon', role: 'Stomatolog', place: 'Toshkent', avatar: '/images/avatar.jpg' }
  return {
    name: profile.name || 'Shifokor',
    role: profile.role || 'Stomatolog',
    place: profile.city || 'Toshkent',
    avatar: profile.avatar || '/images/avatar.jpg',
  }
}

export default function MobileCommunity() {
  const me = viewerOf(useProfile())
  const navigate = useNavigate()
  const { posts, liked, saved, hidden } = useFeed()
  const [q, setQ] = useState('')
  const [tab, setTab] = useState('all')
  const [sort, setSort] = useState('new')
  const [onlySaved, setOnlySaved] = useState(false)
  const [sheet, setSheet] = useState(null)
  const [menu, setMenu] = useState(null)
  const [zoom, setZoom] = useState(null)
  const [toast, setToast] = useState('')
  const [undo, setUndo] = useState(null)
  const closeToast = useCallback(() => { setToast(''); setUndo(null) }, [])
  const searchRef = useRef(null)

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    const rows = posts.filter((p) =>
      !hidden.has(p.id) &&
      (tab === 'all' || p.kind === tab) &&
      (!onlySaved || saved.has(p.id)) &&
      (!s || `${p.title} ${p.body} ${p.author} ${p.tags.join(' ')}`.toLowerCase().includes(s)))
    if (sort === 'top') return [...rows].sort((a, b) => b.likes - a.likes)
    if (sort === 'talk') return [...rows].sort((a, b) => countComments(b) - countComments(a))
    return rows
  }, [posts, hidden, tab, onlySaved, saved, q, sort])

  const filters = (sort !== 'new' ? 1 : 0) + (onlySaved ? 1 : 0)
  const open = (p, focus) => navigate(`/community/${p.id}`, { state: focus ? { focus: true } : null })
  const say = (t) => { setUndo(null); setToast(t) }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef6fb_0%,#f6f9fb_35%)] pb-[86px]">
      <div className="px-3.5 pt-3">
        <MobileTopBar onSearch={() => searchRef.current?.focus()} onBell={() => say('Yangi bildirishnomalar yo‘q')} />
        <h1 className="mt-2.5 text-[27px] font-extrabold leading-tight tracking-tight text-[#0d2a4a]">Hamjamiyat</h1>
        <p className="text-[12.5px] text-[#7d8fa9]">Stomatologlar tajribasi, savollari va klinik holatlar</p>

        <div className="mt-3 flex gap-2">
          <label className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-2xl border border-line/70 bg-white px-3.5">
            <Search className="size-[18px] shrink-0 text-ink-2" />
            <input ref={searchRef} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Mavzu yoki savollarni izlash..." className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-muted" />
            {q && <button type="button" onClick={() => setQ('')} aria-label="Tozalash" className="text-muted"><X className="size-4" /></button>}
          </label>
          <button type="button" onClick={() => setSheet('filter')} aria-label="Filtrlar" className="relative grid size-11 shrink-0 place-items-center rounded-2xl border border-line/70 bg-white text-ink">
            <SlidersHorizontal className="size-[18px]" />
            {filters > 0 && <span className="absolute -right-1 -top-1 grid size-[18px] place-items-center rounded-full bg-sea text-[10px] font-bold text-white ring-2 ring-[#f1f7fa]">{filters}</span>}
          </button>
        </div>

        <div className="mt-3 flex items-center gap-1.5 rounded-2xl bg-white p-2.5 shadow-[0_1px_4px_rgb(11_31_58/0.06)]">
          <img src={me.avatar} alt="" className="size-11 shrink-0 rounded-full object-cover" />
          <button type="button" onClick={() => setSheet('compose')} className="ml-0.5 h-11 min-w-0 flex-1 truncate rounded-xl bg-[#f2f6f9] px-3 text-left text-[12.5px] text-muted">Nima haqida o‘ylayapsiz?</button>
          <button type="button" onClick={() => setSheet('compose-img')} aria-label="Rasm qo‘shish" className="grid size-8 shrink-0 place-items-center text-sea"><ImageIcon className="size-[21px]" strokeWidth={1.7} /></button>
          <button type="button" onClick={() => say('Video yuklash tez orada qo‘shiladi')} aria-label="Video qo‘shish" className="grid size-8 shrink-0 place-items-center text-sea"><Video className="size-[21px]" strokeWidth={1.7} /></button>
          <button type="button" onClick={() => setSheet('compose')} aria-label="Post yozish" className="grid size-9 shrink-0 place-items-center rounded-full bg-sea text-white"><Plus className="size-5" /></button>
        </div>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto px-3.5 pb-0.5 no-scrollbar">
        {FEED_TABS.map(([k, l]) => {
          const on = tab === k
          return <button key={k} type="button" aria-pressed={on} onClick={() => setTab(k)} className={`h-9 shrink-0 rounded-xl px-4 text-[12.5px] font-medium transition ${on ? 'bg-sea text-white shadow-[0_4px_10px_rgb(11_138_149/0.25)]' : 'border border-line/70 bg-white text-ink'}`}>{l}</button>
        })}
      </div>

      <div className="mt-3 flex flex-col gap-3 px-3.5">
        {list.length ? list.map((p) => {
          const isLiked = liked.has(p.id)
          const isSaved = saved.has(p.id)
          return (
            <article key={p.id} className="rounded-2xl bg-white p-3 shadow-[0_1px_4px_rgb(11_31_58/0.06)]">
              <div className="flex items-center gap-2.5">
                <Avatar p={p} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 truncate text-[14px] font-bold text-[#0d2a4a]">{p.author}{p.official && <BadgeCheck className="size-4 shrink-0 text-sea" />}</p>
                  <p className="truncate text-[11.5px] text-muted">{p.role} · {p.time}</p>
                </div>
                <KindBadge kind={p.kind} />
                <button type="button" onClick={() => setMenu(p)} aria-label="Ko‘proq" className="grid size-7 shrink-0 place-items-center text-muted"><MoreHorizontal className="size-5" /></button>
              </div>
              <button type="button" onClick={() => open(p)} className="mt-2 block w-full text-left">
                <h3 className="text-[14.5px] font-bold leading-snug text-[#0d2a4a]">{p.title}</h3>
                <p className="mt-1 line-clamp-3 text-[12.5px] leading-[1.5] text-ink-2">{p.body}</p>
              </button>
              <div className="mt-2.5"><PostImages p={p} onOpen={(i) => setZoom({ images: p.images, i })} /></div>
              <div className="mt-2 flex items-center text-[12.5px] text-ink-2">
                <button type="button" onClick={() => feed.toggleLike(p.id)} aria-pressed={isLiked} className="flex h-9 items-center gap-1.5 pr-4 font-semibold">
                  <Heart className={`size-5 transition ${isLiked ? 'scale-110 fill-sale text-sale' : 'text-ink-2'}`} /> {p.likes + (isLiked ? 1 : 0)}
                </button>
                <button type="button" onClick={() => open(p, true)} className="flex h-9 items-center gap-1.5 pr-4">
                  <MessageCircle className="size-5" /> {countComments(p)}
                </button>
                <button type="button" onClick={() => { feed.toggleSave(p.id); say(isSaved ? 'Saqlanganlardan olib tashlandi' : 'Saqlandi') }} aria-pressed={isSaved} className={`ml-auto flex h-9 items-center gap-1.5 pr-3 ${isSaved ? 'font-semibold text-sea' : ''}`}>
                  <Bookmark className={`size-[18px] ${isSaved ? 'fill-sea' : ''}`} /> {isSaved ? 'Saqlangan' : 'Saqlash'}
                </button>
                <button type="button" onClick={() => sharePost(p, say)} className="flex h-9 items-center gap-1.5">
                  <Share2 className="size-[18px]" /> Ulashish
                </button>
              </div>
            </article>
          )
        }) : (
          <div className="rounded-2xl bg-white px-6 py-10 text-center">
            <p className="text-[14px] font-semibold text-ink">Post topilmadi</p>
            <p className="mt-1 text-[12px] text-muted">{onlySaved ? 'Saqlangan postlar yo‘q' : 'Boshqa so‘z yoki bo‘limni tanlab ko‘ring'}</p>
            <button type="button" onClick={() => { setQ(''); setTab('all'); setOnlySaved(false) }} className="mt-3 h-9 rounded-xl bg-sea-50 px-4 text-[12.5px] font-semibold text-sea">Hammasini ko‘rsatish</button>
          </div>
        )}
      </div>

      <button type="button" onClick={() => setSheet('compose')} className="fixed bottom-[76px] right-3.5 z-30 flex h-12 items-center gap-2 rounded-full bg-sea px-5 text-[14px] font-semibold text-white shadow-[0_8px_20px_rgb(11_138_149/0.4)] active:scale-95">
        <PenLine className="size-[18px]" /> Yangi post
      </button>

      {sheet === 'filter' && (
        <BottomSheet title="Filtrlar" onClose={() => setSheet(null)} footer={<button type="button" onClick={() => setSheet(null)} className="h-12 flex-1 rounded-xl bg-sea text-[14px] font-semibold text-white">{list.length} ta postni ko‘rsatish</button>}>
          <p className="mt-3 text-[13px] font-semibold text-ink">Saralash</p>
          <div className="mt-2 flex flex-col gap-1.5">
            {SORTS.map(([k, l]) => (
              <button key={k} type="button" onClick={() => setSort(k)} className={`flex h-11 items-center justify-between rounded-xl border px-3 text-[13px] font-medium ${sort === k ? 'border-sea bg-sea-50 text-sea' : 'border-line text-ink'}`}>
                {l} {sort === k && <Check className="size-4" />}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setOnlySaved(!onlySaved)} className="mt-4 flex h-12 w-full items-center justify-between rounded-xl border border-line px-3 text-[13px] font-medium text-ink">
            <span className="flex items-center gap-2"><Bookmark className="size-4 text-sea" /> Faqat saqlanganlar ({saved.size})</span>
            <span className={`relative h-6 w-10 rounded-full transition ${onlySaved ? 'bg-sea' : 'bg-line'}`}><span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${onlySaved ? 'left-[18px]' : 'left-0.5'}`} /></span>
          </button>
        </BottomSheet>
      )}

      {(sheet === 'compose' || sheet === 'compose-img') && (
        <Composer
          withImages={sheet === 'compose-img'}
          onClose={() => setSheet(null)}
          onPublish={(post) => { feed.add(post); setSheet(null); setTab('all'); setQ(''); setOnlySaved(false); say('Post e’lon qilindi'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
        />
      )}

      {menu && (
        <PostMenu
          p={menu}
          saved={saved.has(menu.id)}
          onClose={() => setMenu(null)}
          onToast={say}
          onDeleted={() => { if (!menu.mine) { const id = menu.id; setTimeout(() => setUndo(() => () => feed.hide(id)), 0) } }}
        />
      )}
      {zoom && <Lightbox images={zoom.images} index={zoom.i} onClose={() => setZoom(null)} />}

      <MobileToast
        text={toast}
        onClose={closeToast}
        bottom={136}
        action={undo ? <button type="button" onClick={() => { undo(); closeToast() }} className="shrink-0 text-[12.5px] font-semibold text-[#5fe0c8]">Bekor qilish</button> : null}
      />
      <MobileTabBar />
    </div>
  )
}

function Composer({ withImages, onClose, onPublish }) {
  const me = viewerOf(useProfile())
  const [kind, setKind] = useState('case')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [imgs, setImgs] = useState([])
  const [pick, setPick] = useState(withImages)
  const ok = title.trim().length >= 5 && body.trim().length >= 10

  const publish = () => onPublish({
    id: `p${Date.now()}`,
    kind,
    author: me.name,
    role: me.role,
    place: `${me.place}, O‘zbekiston`,
    time: 'Hozir',
    avatar: me.avatar,
    mine: true,
    title: title.trim(),
    body: body.trim(),
    images: imgs,
    layout: imgs.length === 2 ? 'ba' : imgs.length >= 3 ? 'row' : 'single',
    tags: [KIND[kind].label],
    likes: 0,
    comments: [],
  })

  return (
    <BottomSheet
      title="Yangi post"
      onClose={onClose}
      footer={<button type="button" disabled={!ok} onClick={publish} className="h-12 flex-1 rounded-xl bg-sea text-[14px] font-semibold text-white disabled:opacity-40">E’lon qilish</button>}
    >
      <div className="mt-2 flex flex-wrap gap-2">
        {Object.entries(KIND).filter(([k]) => k !== 'yangilik').map(([k, v]) => {
          const Icon = v.icon
          return (
            <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className={`flex h-9 items-center gap-1.5 rounded-xl border px-3 text-[12.5px] font-medium ${kind === k ? 'border-sea bg-sea-50 text-sea' : 'border-line text-ink'}`}>
              <Icon className="size-4" /> {v.label}
            </button>
          )
        })}
      </div>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sarlavha" className="mt-3 h-11 w-full rounded-xl border border-line px-3 text-[14px] font-semibold outline-none focus:border-sea" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder={kind === 'savol' ? 'Savolingizni batafsil yozing...' : 'Holat, davolash va natijani yozing...'} className="mt-2 w-full resize-none rounded-xl border border-line px-3 py-2.5 text-[13.5px] leading-relaxed outline-none focus:border-sea" />
      <button type="button" onClick={() => setPick(!pick)} className="mt-1 flex items-center gap-1.5 text-[13px] font-semibold text-sea">
        <ImageIcon className="size-4" /> Rasm qo‘shish {imgs.length > 0 && `(${imgs.length})`}
      </button>
      {pick && (
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {imgs.map((src, i) => (
            <button key={i} type="button" onClick={() => setImgs((l) => l.filter((_, j) => j !== i))} className="relative h-[84px] overflow-hidden rounded-lg ring-2 ring-sea">
              <img src={src} alt="" className="size-full object-cover" />
              <span className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-sea text-[10px] font-bold text-white">{i + 1}</span>
            </button>
          ))}
          {imgs.length < 3 && (
            <label className="grid h-[84px] cursor-pointer place-items-center rounded-lg border border-dashed border-line text-[12px] text-muted">
              + Rasm
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => setImgs((l) => (l.length < 3 ? [...l, r.result] : l)); r.readAsDataURL(f); e.target.value = '' }} />
            </label>
          )}
        </div>
      )}
      <p className="mt-2 text-[11px] text-muted">Bemor yuzi va shaxsiy ma’lumotlari ko‘rinmasligiga ishonch hosil qiling. 3 tagacha rasm.</p>
    </BottomSheet>
  )
}
