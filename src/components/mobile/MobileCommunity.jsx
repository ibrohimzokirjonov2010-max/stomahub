import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ensureLogin } from '../../loginPrompt'
import { useNavigate } from 'react-router-dom'
import {
  Search, SlidersHorizontal, Image as ImageIcon, Video, Plus, Heart, MessageCircle, Bookmark, Share2, MoreHorizontal,
  Lightbulb, X, Check, Link2, EyeOff, Flag, Trash2, BadgeCheck, MessagesSquare, PenLine, ShieldCheck, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, ChevronDown, CheckCircle2,
} from 'lucide-react'
import { useProfile } from '../../profileStore'
import { FEED_TABS, POST_KINDS, CLINIC_SECTIONS, IMAGE_TAGS, emptyNotes, composeCaseBody, useFeed, feed, countComments, validatePost } from '../../communityFeed'
import { CATS, catTopic } from '../../communityData'
import { MobileTopBar, MobileToast } from './parts'
import MobileTabBar from './MobileTabBar'
import { BottomSheet, ToothIcon } from './MobileSeminars'
import { imgIcon } from '../tealIcons'
import UserAvatar from '../UserAvatar'

export const KIND = {
  case: { label: 'Klinik case', icon: imgIcon('forum', 'klinik-holatlar'), cls: 'bg-[#e8f1ff] text-[#2f6fe4]' },
  maslahat: { label: 'Maslahatlar', icon: Lightbulb, cls: 'bg-[#e3f8ef] text-[#1f9d63]' },
  muhokama: { label: 'Muhokama', icon: MessagesSquare, cls: 'bg-[#eef2ff] text-[#4f46e5]' },
  savol: { label: 'Savollar', icon: imgIcon('forum', 'savollar'), cls: 'bg-[#f3e8ff] text-[#8b3fd6]' },
  yangilik: { label: 'Yangiliklar', icon: imgIcon('forum', 'yangiliklar'), cls: 'bg-[#fff3df] text-[#c77700]' },
}
const SORTS = [['new', 'Eng yangi'], ['top', 'Eng mashhur'], ['talk', 'Ko‘p muhokama qilingan']]

export const postLink = (p) => `${window.location.origin}/community/${p.id}`

export function Avatar({ p, size = 'size-11' }) {
  if (p.official) return <span className={`${size} grid shrink-0 place-items-center rounded-full bg-sea text-white`}><ToothIcon className="size-1/2" /></span>
  return <UserAvatar src={p.avatar} name={p.name || p.author} className={size} textClass="text-[13px]" />
}

export function SolvedBadge() {
  return <span className="inline-flex h-6 shrink-0 items-center gap-1 rounded-full bg-[#e3f8ef] px-2 text-[10.5px] font-semibold text-[#1f9d63]"><CheckCircle2 className="size-3.5" /> Hal qilindi</span>
}

export function KindBadge({ kind }) {
  const k = KIND[kind] || KIND.muhokama
  const Icon = k.icon
  return <span className={`inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2 text-[10.5px] font-semibold ${k.cls}`}><Icon className={Icon.raster ? 'size-4' : 'size-3.5'} /> {k.label}</span>
}

// Rasm teglari (Oldin/Keyin). Eski postlarda layout 'ba' bo‘lsa — 1-rasm Oldin, 2-rasm Keyin.
export const labelOf = (p, i) => p.labels?.[i] || (p.layout === 'ba' && !p.labels ? (i ? 'keyin' : 'oldin') : '')
const TAG_TEXT = { oldin: 'Oldin', keyin: 'Keyin' }

export function PostImages({ p, onOpen }) {
  const im = p.images || []
  if (!im.length) return null
  // absolute img + min-h-0: panjara balandligi kontent bilan yorilib ketmasin
  const cell = (i, cls, overlay = null) => (
    <button key={`${im[i]}-${i}`} type="button" onClick={(e) => { e.stopPropagation(); onOpen(i) }} className={`relative min-h-0 min-w-0 overflow-hidden rounded-xl bg-page ${cls}`}>
      <img src={im[i]} alt={TAG_TEXT[labelOf(p, i)] || ''} loading="lazy" className="absolute inset-0 size-full object-cover" />
      {TAG_TEXT[labelOf(p, i)] && <span className={`absolute bottom-1.5 left-1.5 z-[1] rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-white ${labelOf(p, i) === 'oldin' ? 'bg-[#c2410c]/85' : 'bg-[#047857]/85'}`}>{TAG_TEXT[labelOf(p, i)]}</span>}
      {overlay}
    </button>
  )
  const idx = im.map((_, i) => i)
  const before = idx.filter((i) => labelOf(p, i) === 'oldin')
  const after = idx.filter((i) => labelOf(p, i) === 'keyin')
  if (before.length && after.length) {
    const rest = idx.filter((i) => !before.includes(i) && !after.includes(i))
    const shownRest = rest.slice(0, 3)
    const moreRest = rest.length - shownRest.length
    const col = (title, list, tone) => {
      const shown = list.slice(0, 2)
      const more = list.length - shown.length
      return (
        <div className="min-w-0 overflow-hidden">
          <p className={`mb-1 text-[11px] font-bold uppercase tracking-wide ${tone}`}>{title}</p>
          <div className="grid gap-1.5 overflow-hidden">
            {shown.map((i, k) => cell(i, list.length > 1 ? 'aspect-[4/3]' : 'aspect-[4/3]', more > 0 && k === shown.length - 1 ? <span className="absolute inset-0 z-[1] grid place-items-center bg-ink/55 text-[16px] font-bold text-white">+{more}</span> : null))}
          </div>
        </div>
      )
    }
    return (
      <div className="overflow-hidden">
        <div className="grid grid-cols-2 gap-2 overflow-hidden">{col('Oldin', before, 'text-[#c2410c]')}{col('Keyin', after, 'text-[#047857]')}</div>
        {shownRest.length > 0 && (
          <div className="mt-1.5 grid grid-cols-3 gap-1.5 overflow-hidden">
            {shownRest.map((i, k) => cell(i, 'aspect-square', moreRest > 0 && k === shownRest.length - 1 ? <span className="absolute inset-0 z-[1] grid place-items-center bg-ink/55 text-[16px] font-bold text-white">+{moreRest}</span> : null))}
          </div>
        )}
      </div>
    )
  }
  if (im.length === 1) return <div className="overflow-hidden">{cell(0, 'block aspect-[4/3] w-full')}</div>
  if (im.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-1.5 overflow-hidden">
        {[0, 1].map((i) => cell(i, 'aspect-square'))}
      </div>
    )
  }
  if (im.length === 3) {
    return (
      <div className="grid h-[168px] grid-cols-[1.3fr_1fr] gap-1.5 overflow-hidden">
        {cell(0, 'h-full')}
        <div className="grid min-h-0 grid-rows-2 gap-1.5">{[1, 2].map((i) => cell(i, 'h-full'))}</div>
      </div>
    )
  }
  // 4+: 2×2, ortiqchasi "+N"
  const more = im.length - 4
  return (
    <div className="grid grid-cols-2 gap-1.5 overflow-hidden">
      {[0, 1, 2, 3].map((i) => cell(i, 'aspect-square', more > 0 && i === 3 ? <span className="absolute inset-0 z-[1] grid place-items-center bg-ink/55 text-[18px] font-bold text-white">+{more}</span> : null))}
    </div>
  )
}

// To‘liq ekranli ko‘rish: barmoq bilan kattalashtirish (pinch), +/− tugmalar, ikki marta bosish,
// chapga/o‘ngga surish (swipe) va klaviatura (← → Esc). Desktop ham shu komponentni ishlatadi.
export function Lightbox({ images, index = 0, labels, onClose }) {
  const [i, setI] = useState(index)
  const [z, setZ] = useState({ s: 1, x: 0, y: 0 })
  const g = useRef({})
  const n = images.length
  const go = useCallback((d) => { setI((k) => (k + d + n) % n); setZ({ s: 1, x: 0, y: 0 }) }, [n])
  const zoomBy = (f) => setZ((v) => { const s = Math.min(5, Math.max(1, v.s * f)); return s === 1 ? { s, x: 0, y: 0 } : { ...v, s } })
  useEffect(() => {
    const key = (e) => { if (e.key === 'Escape') onClose(); else if (e.key === 'ArrowRight') go(1); else if (e.key === 'ArrowLeft') go(-1); else if (e.key === '+' || e.key === '=') zoomBy(1.4); else if (e.key === '-') zoomBy(1 / 1.4) }
    window.addEventListener('keydown', key)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', key); document.body.style.overflow = prev }
  }, [go, onClose])
  const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)
  const onTouchStart = (e) => {
    const t = e.touches
    if (t.length === 2) g.current = { pinch: dist(t), s0: z.s }
    else if (t.length === 1) g.current = { x: t[0].clientX, y: t[0].clientY, px: z.x, py: z.y, t: Date.now() }
  }
  const onTouchMove = (e) => {
    const t = e.touches; const st = g.current
    if (t.length === 2 && st.pinch) { const s = Math.min(5, Math.max(1, st.s0 * (dist(t) / st.pinch))); setZ((v) => (s === 1 ? { s, x: 0, y: 0 } : { ...v, s })) }
    else if (t.length === 1 && st.x != null && z.s > 1) setZ((v) => ({ ...v, x: st.px + t[0].clientX - st.x, y: st.py + t[0].clientY - st.y }))
  }
  const onTouchEnd = (e) => {
    const st = g.current
    if (st.x != null && z.s === 1 && e.changedTouches?.length) {
      const dx = e.changedTouches[0].clientX - st.x; const dy = e.changedTouches[0].clientY - st.y
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3 && n > 1) go(dx < 0 ? 1 : -1)
    }
    if (!e.touches?.length) g.current = {}
  }
  const tag = labels?.[i]
  const btn = 'grid size-10 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25 disabled:opacity-40'
  return (
    <div role="dialog" aria-modal="true" aria-label="Rasmni ko‘rish" className="fixed inset-0 z-[90] flex select-none flex-col bg-black/95">
      <div className="flex items-center justify-between gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))] text-white">
        <span className="text-[13px]">{i + 1} / {n}{tag && TAG_TEXT[tag] ? ` · ${TAG_TEXT[tag]}` : ''}</span>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => zoomBy(1 / 1.4)} disabled={z.s <= 1} aria-label="Kichiklashtirish" className={btn}><ZoomOut className="size-5" /></button>
          <span className="w-11 text-center text-[12px] tabular-nums">{Math.round(z.s * 100)}%</span>
          <button type="button" onClick={() => zoomBy(1.4)} disabled={z.s >= 5} aria-label="Kattalashtirish" className={btn}><ZoomIn className="size-5" /></button>
          <button type="button" onClick={onClose} aria-label="Yopish" className={btn}><X className="size-5" /></button>
        </div>
      </div>
      <div
        className="relative flex flex-1 touch-none items-center justify-center overflow-hidden"
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        onWheel={(e) => zoomBy(e.deltaY < 0 ? 1.15 : 1 / 1.15)}
        onDoubleClick={() => setZ((v) => (v.s > 1 ? { s: 1, x: 0, y: 0 } : { ...v, s: 2.5 }))}
        onClick={(e) => { if (e.target === e.currentTarget && z.s === 1) onClose() }}
      >
        <img src={images[i]} alt="" draggable={false} style={{ transform: `translate(${z.x}px, ${z.y}px) scale(${z.s})`, transition: g.current.pinch || g.current.x != null ? 'none' : 'transform .15s' }} className="max-h-full max-w-full object-contain" />
        {n > 1 && <>
          <button type="button" onClick={() => go(-1)} aria-label="Oldingi rasm" className={`${btn} absolute left-3 top-1/2 -translate-y-1/2`}><ChevronLeft className="size-6" /></button>
          <button type="button" onClick={() => go(1)} aria-label="Keyingi rasm" className={`${btn} absolute right-3 top-1/2 -translate-y-1/2`}><ChevronRight className="size-6" /></button>
        </>}
      </div>
      {n > 1 && (
        <div className="flex justify-center gap-2 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">
          {images.map((src, k) => (
            <button key={src + k} type="button" onClick={() => { setI(k); setZ({ s: 1, x: 0, y: 0 }) }} aria-label={`Rasm ${k + 1}`} className={`size-12 overflow-hidden rounded-lg ${k === i ? 'ring-2 ring-white' : 'opacity-50'}`}><img src={src} alt="" className="size-full object-cover" /></button>
          ))}
        </div>
      )}
    </div>
  )
}

export function PostMenu({ p, saved, onClose, onToast, onDeleted, onEdit }) {
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
        ? (
          <>
            {onEdit && item(PenLine, 'Tahrirlash', () => onEdit(p))}
            {item(Trash2, 'O‘chirish', async () => {
              if (!window.confirm('Postni o‘chirasizmi?')) return
              const r = await feed.remove(p.id)
              onToast(r.ok ? 'Post o‘chirildi' : r.error)
              if (r.ok) onDeleted?.()
            }, true)}
          </>
        )
        : (
          <>
            {item(EyeOff, 'Bu postni yashirish', () => { feed.hide(p.id); onToast('Post yashirildi'); onDeleted?.() })}
            {item(Flag, 'Shikoyat qilish', async () => {
              if (!ensureLogin()) return
              const reason = window.prompt('Shikoyat sababi', 'Nomaqbul kontent')
              if (reason === null) return
              const r = await feed.report(p.id, reason)
              onToast(r.ok ? 'Shikoyatingiz moderatorlarga yuborildi' : r.error)
            }, true)}
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
  if (!profile?.accountLive) return { name: 'Mehmon', avatar: '' }
  return { name: profile.name || 'Foydalanuvchi', avatar: profile.avatar || '' }
}

export default function MobileCommunity() {
  const me = viewerOf(useProfile())
  const navigate = useNavigate()
  const { posts, liked, saved, hidden } = useFeed()
  const [q, setQ] = useState('')
  const [tab, setTab] = useState('all')
  const [sort, setSort] = useState('new')
  const [onlySaved, setOnlySaved] = useState(false)
  const [solved, setSolved] = useState('all')
  const [sheet, setSheet] = useState(null)
  const composeIfAuthed = (kind) => { if (ensureLogin()) setSheet(kind) }
  const [menu, setMenu] = useState(null)
  const [editing, setEditing] = useState(null)
  const [zoom, setZoom] = useState(null)
  const [toast, setToast] = useState('')
  const [undo, setUndo] = useState(null)
  const closeToast = useCallback(() => { setToast(''); setUndo(null) }, [])
  const searchRef = useRef(null)

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    let rows = posts.filter((p) =>
      !hidden.has(p.id) &&
      (tab === 'all' || p.kind === tab) &&
      (tab !== 'savol' || solved === 'all' || (solved === 'yes') === !!p.solved) &&
      (!onlySaved || saved.has(p.id)) &&
      (!s || `${p.title} ${p.body} ${p.author} ${p.tags.map((t) => t?.t || t).join(' ')}`.toLowerCase().includes(s)))
    if (sort === 'top') rows = [...rows].sort((a, b) => b.likes - a.likes)
    else if (sort === 'talk') rows = [...rows].sort((a, b) => countComments(b) - countComments(a))
    // Playwright: 5 ta rasmli panjara skrinshoti (overflow regressiyasi)
    if (typeof window !== 'undefined' && window.__STOMAHUB_SHOT_GRID__) {
      const imgs = ['/images/seminars/teeth.jpg', '/images/hero-implant.jpg', '/images/hero-main.jpg', '/images/market/p2.jpg', '/images/market/g-main.jpg']
      rows = [{ id: '__shot_grid__', author: 'Dr. Jasur Murodov', role: 'Jarroh', time: '27.10.2026', kind: 'keys', title: 'Peri-implantitda birinchi chora: konservativmi yoki jarrohlikmi?', body: 'So‘nggi kuzatuvlarda regenerativ yondashuv bilan boshlangan holatlar.', images: imgs, labels: [], likes: 12, tags: [], comments: [] }, ...rows]
    }
    return rows
  }, [posts, hidden, tab, solved, onlySaved, saved, q, sort])

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
          <Avatar p={me} />
          <button type="button" onClick={() => composeIfAuthed('compose')} className="ml-0.5 h-11 min-w-0 flex-1 truncate rounded-xl bg-[#f2f6f9] px-3 text-left text-[12.5px] text-muted">Nima haqida o‘ylayapsiz?</button>
          <button type="button" onClick={() => composeIfAuthed('compose-img')} aria-label="Rasm qo‘shish" className="grid size-8 shrink-0 place-items-center text-sea"><ImageIcon className="size-[21px]" strokeWidth={1.7} /></button>
          <button type="button" onClick={() => say('Video yuklash tez orada qo‘shiladi')} aria-label="Video qo‘shish" className="grid size-8 shrink-0 place-items-center text-sea"><Video className="size-[21px]" strokeWidth={1.7} /></button>
          <button type="button" onClick={() => composeIfAuthed('compose')} aria-label="Post yozish" className="grid size-9 shrink-0 place-items-center rounded-full bg-sea text-white"><Plus className="size-5" /></button>
        </div>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto px-3.5 pb-0.5 no-scrollbar">
        {FEED_TABS.map(([k, l]) => {
          const on = tab === k
          return <button key={k} type="button" aria-pressed={on} onClick={() => setTab(k)} className={`h-9 shrink-0 rounded-xl px-4 text-[12.5px] font-medium transition ${on ? 'bg-sea text-white shadow-[0_4px_10px_rgb(11_138_149/0.25)]' : 'border border-line/70 bg-white text-ink'}`}>{l}</button>
        })}
      </div>

      {tab === 'savol' && (
        <div className="mt-2 flex gap-1.5 px-3.5">
          {[['all', 'Hammasi'], ['yes', 'Hal qilindi'], ['no', 'Javob kutilmoqda']].map(([k, l]) => (
            <button key={k} type="button" aria-pressed={solved === k} onClick={() => setSolved(k)} className={`h-8 rounded-full px-3 text-[12px] font-medium ${solved === k ? 'bg-[#e3f8ef] text-[#1f9d63] ring-1 ring-[#1f9d63]/40' : 'bg-white text-ink-2 ring-1 ring-line/70'}`}>{l}</button>
          ))}
        </div>
      )}

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
                  <p className="truncate text-[11.5px] text-muted">{p.role} · {p.time}{p.edited ? ' · tahrirlangan' : ''}</p>
                </div>
                <KindBadge kind={p.kind} />
                {p.kind === 'savol' && p.solved && <SolvedBadge />}
                <button type="button" onClick={() => setMenu(p)} aria-label="Ko‘proq" className="grid size-7 shrink-0 place-items-center text-muted"><MoreHorizontal className="size-5" /></button>
              </div>
              <button type="button" onClick={() => open(p)} className="mt-2 block w-full text-left">
                <h3 className="text-[14.5px] font-bold leading-snug text-[#0d2a4a]">{p.title}</h3>
                <p className="mt-1 line-clamp-3 text-[12.5px] leading-[1.5] text-ink-2">{p.body}</p>
              </button>
              <div className="mt-2.5"><PostImages p={p} onOpen={(i) => setZoom({ images: p.images, labels: p.images.map((_, k) => labelOf(p, k)), i })} /></div>
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
        <PostComposer
          withImages={sheet === 'compose-img'}
          onClose={() => setSheet(null)}
          onDone={() => { setSheet(null); setTab('all'); setQ(''); setOnlySaved(false); say('Post e’lon qilindi'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
        />
      )}
      {editing && <PostComposer editing={editing} onClose={() => setEditing(null)} onDone={() => { setEditing(null); say('Post yangilandi') }} />}

      {menu && (
        <PostMenu
          p={menu}
          saved={saved.has(menu.id)}
          onClose={() => setMenu(null)}
          onToast={say}
          onEdit={(p) => setEditing(p)}
          onDeleted={() => { if (!menu.mine) { const id = menu.id; setTimeout(() => setUndo(() => () => feed.hide(id)), 0) } }}
        />
      )}
      {zoom && <Lightbox images={zoom.images} labels={zoom.labels} index={zoom.i} onClose={() => setZoom(null)} />}

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

// Mobil forma desktop bilan bir xil talablarga ega: bir xil turlar (POST_KINDS), kategoriya (CATS),
// bemor roziligi (klinik keys yoki rasm bo‘lsa majburiy) va yagona validatePost.
export function PostComposer({ withImages, editing, onClose, onDone }) {
  const [kind, setKind] = useState(editing?.kind && POST_KINDS.some(([k]) => k === editing.kind) ? editing.kind : 'case')
  const [cat, setCat] = useState(editing?.meta?.cat || CATS[0])
  const [title, setTitle] = useState(editing?.title || '')
  const [body, setBody] = useState(editing ? (editing.meta?.summary ?? editing.body ?? '') : '')
  const [notes, setNotes] = useState({ ...emptyNotes(), ...(editing?.meta?.notes || {}) })
  const [openSec, setOpenSec] = useState(editing?.meta?.notes ? '' : 'shikoyat')
  const [imgs, setImgs] = useState((editing?.images || []).map((src, i) => ({ src, tag: labelOf(editing, i) })))
  const [consent, setConsent] = useState(!!editing?.consent)
  const [pick, setPick] = useState(withImages || !!editing?.images?.length)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const isCase = kind === 'case'
  const needConsent = isCase || imgs.length > 0
  const maxImgs = isCase ? 6 : 3

  const publish = async () => {
    const meta = { ...(editing?.meta || {}), cat }
    let text = body
    if (isCase) { meta.notes = notes; meta.summary = body.trim(); text = composeCaseBody(body, notes) }
    const post = { kind, topic: catTopic[cat] || '', title, body: text, images: imgs.map((x) => x.src), labels: imgs.map((x) => (isCase ? x.tag : '')), consent, meta }
    const why = validatePost(post)
    if (why) { setError(isCase && why.startsWith('Sarlavha va') ? 'Sarlavha va kamida bitta bo‘limni to‘ldiring' : why); return }
    setBusy(true)
    const r = editing ? await feed.update(editing.id, post) : await feed.add(post)
    setBusy(false)
    if (!r.ok) { setError(r.error); return }
    onDone()
  }

  return (
    <BottomSheet
      title={editing ? 'Postni tahrirlash' : 'Yangi post'}
      onClose={onClose}
      footer={<button type="button" disabled={busy} onClick={publish} className="h-12 flex-1 rounded-xl bg-sea text-[14px] font-semibold text-white disabled:opacity-60">{busy ? 'Saqlanmoqda…' : editing ? 'Saqlash' : 'E’lon qilish'}</button>}
    >
      <div className="mt-2 flex flex-wrap gap-2">
        {POST_KINDS.map(([k, label]) => {
          const Icon = (KIND[k] || KIND.muhokama).icon
          return (
            <button key={k} type="button" aria-pressed={kind === k} onClick={() => { setKind(k); setError('') }} className={`flex h-9 items-center gap-1.5 rounded-xl border px-3 text-[12.5px] font-medium ${kind === k ? 'border-sea bg-sea-50 text-sea' : 'border-line text-ink'}`}>
              <Icon className="size-4" /> {label}
            </button>
          )
        })}
      </div>
      <label className="mt-3 block text-[12px] font-semibold text-ink">Mavzu (kategoriya)
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-line bg-white px-3 text-[14px] font-normal outline-none focus:border-sea">
          {CATS.map((c) => <option key={c}>{c}</option>)}
        </select>
      </label>
      <input value={title} onChange={(e) => { setTitle(e.target.value); setError('') }} placeholder="Sarlavha" className="mt-3 h-11 w-full rounded-xl border border-line px-3 text-[14px] font-semibold outline-none focus:border-sea" />
      <textarea value={body} onChange={(e) => { setBody(e.target.value); setError('') }} rows={4} maxLength={10000} placeholder={kind === 'savol' ? 'Savolingizni batafsil yozing...' : isCase ? 'Qisqacha tavsif (ixtiyoriy)…' : 'Fikringizni yozing...'} className="mt-2 w-full resize-none rounded-xl border border-line px-3 py-2.5 text-[13.5px] leading-relaxed outline-none focus:border-sea" />
      {isCase && (
        <div className="mt-1 overflow-hidden rounded-xl border border-line">
          {CLINIC_SECTIONS.map(([id, label, hint], k) => {
            const on = openSec === id
            const filled = !!notes[id].trim()
            return (
              <div key={id} className={k ? 'border-t border-line' : ''}>
                <button type="button" aria-expanded={on} onClick={() => setOpenSec(on ? '' : id)} className="flex h-11 w-full items-center gap-2 px-3 text-left text-[13px] font-semibold text-ink">
                  <span className={`grid size-5 place-items-center rounded-full text-[10px] ${filled ? 'bg-sea text-white' : 'bg-page text-muted'}`}>{filled ? <Check className="size-3" /> : k + 1}</span>
                  <span className="flex-1">{label}</span>
                  <ChevronDown className={`size-4 text-muted transition ${on ? 'rotate-180' : ''}`} />
                </button>
                {on && <textarea value={notes[id]} onChange={(e) => { const v = e.target.value; setNotes((n) => ({ ...n, [id]: v })); setError('') }} rows={3} maxLength={3000} placeholder={hint} className="mx-3 mb-3 block w-[calc(100%-1.5rem)] resize-none rounded-lg border border-line px-2.5 py-2 text-[13px] outline-none focus:border-sea" />}
              </div>
            )
          })}
        </div>
      )}
      <button type="button" onClick={() => setPick(!pick)} className="mt-1 flex items-center gap-1.5 text-[13px] font-semibold text-sea">
        <ImageIcon className="size-4" /> Rasm qo‘shish {imgs.length > 0 && `(${imgs.length})`}
      </button>
      {pick && (
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {imgs.map((x, i) => (
            <div key={i} className="overflow-hidden rounded-lg ring-1 ring-line">
              <div className="relative h-[84px]">
                <img src={x.src} alt="" className="size-full object-cover" />
                <button type="button" onClick={() => setImgs((l) => l.filter((_, j) => j !== i))} aria-label="Rasmni olib tashlash" className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/60 text-white"><X className="size-3.5" /></button>
              </div>
              {isCase && (
                <div className="grid grid-cols-3 text-[10.5px] font-semibold">
                  {IMAGE_TAGS.map(([t, l]) => (
                    <button key={t || 'none'} type="button" aria-pressed={x.tag === t} onClick={() => setImgs((list) => list.map((y, j) => (j === i ? { ...y, tag: t } : y)))} className={`h-7 ${x.tag === t ? (t === 'oldin' ? 'bg-[#c2410c] text-white' : t === 'keyin' ? 'bg-[#047857] text-white' : 'bg-ink-2 text-white') : 'bg-page text-ink-2'}`}>{t ? l : '—'}</button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {imgs.length < maxImgs && (
            <label className="grid h-[84px] cursor-pointer place-items-center rounded-lg border border-dashed border-line text-[12px] text-muted">
              + Rasm
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => {
                const files = [...(e.target.files || [])]
                e.target.value = ''
                if (files.some((f) => f.size > 15 * 1024 * 1024)) { setError('Fayl 15 MB dan katta bo‘lmasin.'); return }
                files.forEach((f) => { const rd = new FileReader(); rd.onload = () => setImgs((l) => (l.length < maxImgs ? [...l, { src: rd.result, tag: isCase ? (l.some((y) => y.tag === 'oldin') ? 'keyin' : 'oldin') : '' }] : l)); rd.readAsDataURL(f) })
              }} />
            </label>
          )}
          {isCase && imgs.length > 0 && <p className="col-span-3 text-[11px] text-muted">Har bir rasmni «Oldin» yoki «Keyin» deb belgilang — post ularni yonma-yon ko‘rsatadi. Rasmlar siqilib (≤1600px) xavfsiz serverga yuklanadi.</p>}
        </div>
      )}
      <label className={`mt-3 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-[12.5px] ${needConsent && !consent && error ? 'border-sale' : 'border-line'}`}>
        <input type="checkbox" checked={consent} onChange={(e) => { setConsent(e.target.checked); setError('') }} className="mt-0.5 accent-[#0b8a95]" />
        <span><ShieldCheck className="mr-1 inline size-4 text-sea" />Bemor roziligi olingan{needConsent && <span className="text-sale"> *</span>}
          <span className="block text-[11px] text-muted">Klinik keys yoki rasmli post uchun majburiy. Bemor yuzi va shaxsiy ma’lumotlari ko‘rinmasin.</span>
        </span>
      </label>
      {error && <p role="alert" className="mt-2 rounded-xl bg-[#fff1f2] px-3 py-2 text-[12.5px] text-sale">{error}</p>}
    </BottomSheet>
  )
}
