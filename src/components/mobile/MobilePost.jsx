import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { MapPin, Heart, MessageCircle, Share2, Bookmark, ChevronDown, Image as ImageIcon, Send, MoreVertical, MoreHorizontal, X, Reply, Copy, Trash2, Flag, BadgeCheck } from 'lucide-react'
import { ME } from '../../communityData'
import { useFeed, feed, countComments } from '../../communityFeed'
import { MobileToast } from './parts'
import MobileTabBar from './MobileTabBar'
import { BottomSheet } from './MobileSeminars'
import { HubTopBar } from './MobileKategoriyalar'
import { Avatar, PostImages, Lightbox, PostMenu, sharePost } from './MobileCommunity'

const SORTS = [['new', 'Eng yangi'], ['top', 'Eng ko‘p yoqqan'], ['old', 'Eng eski']]

export default function MobilePost() {
  const { id } = useParams()
  return <PostView key={id} id={id} />
}

function PostView({ id }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { posts, liked, saved, likedComments } = useFeed()
  const p = posts.find((x) => x.id === id)
  const [sort, setSort] = useState('new')
  const [text, setText] = useState('')
  const [photo, setPhoto] = useState(null)
  const [reply, setReply] = useState(null)
  const [menu, setMenu] = useState(null)
  const [postMenu, setPostMenu] = useState(false)
  const [zoom, setZoom] = useState(null)
  const [toast, setToast] = useState('')
  const closeToast = useCallback(() => setToast(''), [])
  const inputRef = useRef(null)
  const fileRef = useRef(null)
  const listRef = useRef(null)

  const back = () => (window.history.length > 1 ? navigate(-1) : navigate('/community'))

  useEffect(() => {
    if (location.state?.focus) {
      setTimeout(() => {
        listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        inputRef.current?.focus({ preventScroll: true })
      }, 150)
    } else window.scrollTo(0, 0)
  }, [location.state])

  const comments = useMemo(() => {
    if (!p) return []
    const rows = [...p.comments]
    if (sort === 'top') rows.sort((a, b) => b.likes + (likedComments.has(`${p.id}:${b.id}`) ? 1 : 0) - a.likes - (likedComments.has(`${p.id}:${a.id}`) ? 1 : 0))
    if (sort === 'old') rows.reverse()
    return rows
  }, [p, sort, likedComments])

  if (!p) {
    return (
      <div className="grid min-h-screen place-items-center bg-white px-6 text-center">
        <div>
          <p className="text-[15px] font-semibold text-ink">Post topilmadi</p>
          <Link to="/community" className="mt-3 inline-block text-[13px] font-semibold text-sea">Hamjamiyatga qaytish</Link>
        </div>
      </div>
    )
  }

  const isLiked = liked.has(p.id)
  const isSaved = saved.has(p.id)
  const total = countComments(p)

  const send = () => {
    const t = text.trim()
    if (!t && !photo) return
    feed.comment(p.id, t, reply?.id, photo)
    setText('')
    setPhoto(null)
    setToast(reply ? 'Javobingiz qo‘shildi' : 'Izohingiz qo‘shildi')
    setReply(null)
    if (!reply) setSort('new')
  }
  const startReply = (c, parent) => {
    setReply({ id: parent?.id || c.id, name: c.name })
    setText(parent ? `${c.name.replace('Dr. ', '')}, ` : '')
    inputRef.current?.focus()
  }
  const attach = (e) => {
    const f = e.target.files?.[0]
    if (f) setPhoto(URL.createObjectURL(f))
    e.target.value = ''
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef8f7_0%,#f6faf9_30%)] pb-[86px]">
      <div className="px-3.5 pt-3">
        <HubTopBar onBack={back} onBell={() => setToast('Yangi bildirishnomalar yo‘q')} />
      </div>

      <article className="mx-3.5 mt-3 rounded-2xl bg-white p-3.5 shadow-[0_1px_4px_rgb(11_31_58/0.06)]">
        <div className="flex items-start gap-3">
          <Avatar p={p} size="size-[58px]" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-[15.5px] font-bold text-[#0d2a4a]">{p.author}{p.official && <BadgeCheck className="size-4 text-sea" />}</p>
            <p className="text-[12px] text-muted">{p.role}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-muted"><MapPin className="size-3.5" /> {p.place}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end">
            <span className="text-[11.5px] text-muted">{p.time}</span>
            <button type="button" onClick={() => setPostMenu(true)} aria-label="Ko‘proq" className="-mr-1 grid size-8 place-items-center text-muted"><MoreHorizontal className="size-5" /></button>
          </div>
        </div>
        {p.title && <h1 className="mt-2 text-[15px] font-bold leading-snug text-[#0d2a4a]">{p.title}</h1>}
        <p className="mt-1.5 whitespace-pre-line text-[14px] leading-[1.55] text-ink">{p.body}</p>
        <div className="mt-3"><PostImages p={p} onOpen={(i) => setZoom(i)} /></div>
        {p.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {p.tags.map((t) => <Link key={t} to="/community" className="rounded-lg bg-[#e2f4f2] px-2.5 py-1 text-[11.5px] font-medium text-[#0b6d73]">{t}</Link>)}
          </div>
        )}
        <div className="mt-3 flex items-center justify-between text-[12.5px] text-ink-2">
          <button type="button" onClick={() => feed.toggleLike(p.id)} aria-pressed={isLiked} className={`flex h-9 items-center gap-1.5 ${isLiked ? 'font-semibold text-[#0b6d73]' : ''}`}>
            <Heart className={`size-5 transition ${isLiked ? 'scale-110 fill-[#0b6d73] text-[#0b6d73]' : ''}`} /> Yoqdi <span className="text-muted">{p.likes + (isLiked ? 1 : 0)}</span>
          </button>
          <button type="button" onClick={() => { listRef.current?.scrollIntoView({ behavior: 'smooth' }); inputRef.current?.focus({ preventScroll: true }) }} className="flex h-9 items-center gap-1.5">
            <MessageCircle className="size-5" /> {total} ta izoh
          </button>
          <button type="button" onClick={() => sharePost(p, setToast)} className="flex h-9 items-center gap-1.5">
            <Share2 className="size-5" /> Ulashish
          </button>
          <button type="button" onClick={() => { feed.toggleSave(p.id); setToast(isSaved ? 'Saqlanganlardan olib tashlandi' : 'Saqlandi') }} aria-pressed={isSaved} className={`flex h-9 items-center gap-1.5 ${isSaved ? 'font-semibold text-[#0b6d73]' : ''}`}>
            <Bookmark className={`size-5 ${isSaved ? 'fill-[#0b6d73] text-[#0b6d73]' : ''}`} /> {isSaved ? 'Saqlangan' : 'Saqlash'}
          </button>
        </div>
      </article>

      <section ref={listRef} className="mx-3.5 mt-3 scroll-mt-3 rounded-2xl bg-white p-3.5 shadow-[0_1px_4px_rgb(11_31_58/0.06)]">
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-[#0d2a4a]">Izohlar ({total})</h2>
          <label className="relative flex h-8 items-center gap-1 rounded-lg bg-[#f2f6f9] px-2.5 text-[12px] font-medium text-ink">
            {SORTS.find(([k]) => k === sort)[1]} <ChevronDown className="size-4 text-muted" />
            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Izohlarni saralash" className="absolute inset-0 opacity-0">
              {SORTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </label>
        </div>

        {reply && (
          <div className="mt-3 flex items-center justify-between rounded-lg bg-sea-50 px-3 py-1.5 text-[12px] text-sea">
            <span className="flex items-center gap-1.5"><Reply className="size-3.5" /> Javob: <b>{reply.name}</b></span>
            <button type="button" onClick={() => { setReply(null); setText('') }} aria-label="Javobni bekor qilish"><X className="size-4" /></button>
          </div>
        )}
        <div className="mt-3 flex items-center gap-2">
          <img src={ME.avatar} alt="" className="size-10 shrink-0 rounded-full object-cover" />
          <div className="flex h-11 min-w-0 flex-1 items-center rounded-full border border-line/80 bg-[#f7fafb] pl-4 pr-1.5 focus-within:border-sea">
            <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder={reply ? 'Javob yozing...' : 'Izoh yozing...'} className="min-w-0 flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-muted" />
            <button type="button" onClick={() => fileRef.current?.click()} aria-label="Rasm biriktirish" className="grid size-8 shrink-0 place-items-center text-[#0b6d73]"><ImageIcon className="size-5" /></button>
            <input ref={fileRef} type="file" accept="image/*" onChange={attach} className="hidden" />
          </div>
          <button type="button" onClick={send} disabled={!text.trim() && !photo} aria-label="Yuborish" className="grid size-11 shrink-0 place-items-center rounded-full bg-[#0b6d73] text-white transition disabled:bg-[#d6eeec] disabled:text-[#0b6d73]">
            <Send className="size-5" />
          </button>
        </div>
        {photo && (
          <div className="relative ml-12 mt-2 w-fit">
            <img src={photo} alt="" className="h-20 rounded-lg object-cover" />
            <button type="button" onClick={() => setPhoto(null)} aria-label="Rasmni olib tashlash" className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-ink text-white"><X className="size-3.5" /></button>
          </div>
        )}

        <div className="mt-2 flex flex-col">
          {comments.length ? comments.map((c) => (
            <div key={c.id} className="border-b border-line/60 py-3 last:border-0">
              <Comment p={p} c={c} liked={likedComments.has(`${p.id}:${c.id}`)} onReply={() => startReply(c)} onMenu={() => setMenu({ c })} />
              {c.replies.length > 0 && (
                <div className="ml-12 mt-2 flex flex-col gap-2.5 border-l-2 border-[#e2f4f2] pl-3">
                  {c.replies.map((r) => (
                    <Comment key={r.id} small p={p} c={r} liked={likedComments.has(`${p.id}:${r.id}`)} onReply={() => startReply(r, c)} onMenu={() => setMenu({ c: r, parent: c })} />
                  ))}
                </div>
              )}
            </div>
          )) : (
            <p className="py-8 text-center text-[12.5px] text-muted">Hali izoh yo‘q. Birinchi bo‘lib fikr bildiring!</p>
          )}
        </div>
      </section>

      {menu && (
        <BottomSheet title="" onClose={() => setMenu(null)}>
          {[
            [Reply, 'Javob berish', () => startReply(menu.c, menu.parent)],
            [Copy, 'Matnni nusxalash', () => { navigator.clipboard?.writeText(menu.c.text).catch(() => {}); setToast('Nusxalandi') }],
            menu.c.mine
              ? [Trash2, 'Izohni o‘chirish', () => { feed.removeComment(p.id, menu.c.id); setToast('Izoh o‘chirildi') }, true]
              : [Flag, 'Shikoyat qilish', () => setToast('Shikoyatingiz moderatorlarga yuborildi'), true],
          ].map(([Icon, l, fn, danger]) => (
            <button key={l} type="button" onClick={() => { setMenu(null); fn() }} className={`flex h-12 w-full items-center gap-3 rounded-xl px-2 text-left text-[14px] font-medium ${danger ? 'text-sale' : 'text-ink'} active:bg-page`}>
              <Icon className="size-5" /> {l}
            </button>
          ))}
        </BottomSheet>
      )}
      {postMenu && <PostMenu p={p} saved={isSaved} onClose={() => setPostMenu(false)} onToast={setToast} onDeleted={() => navigate('/community', { replace: true })} />}
      {zoom !== null && <Lightbox images={p.images} index={zoom} onClose={() => setZoom(null)} />}

      <MobileToast text={toast} onClose={closeToast} />
      <MobileTabBar />
    </div>
  )
}

function Comment({ p, c, liked, small, onReply, onMenu }) {
  return (
    <div className="flex gap-2.5">
      <Avatar p={c} size={small ? 'size-8' : 'size-11'} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={`truncate font-bold text-[#0d2a4a] ${small ? 'text-[12.5px]' : 'text-[13.5px]'}`}>{c.name}</p>
            <p className="truncate text-[11px] text-muted">{c.role} · {c.time}</p>
          </div>
          <button type="button" onClick={onMenu} aria-label="Izoh menyusi" className="-mr-1 grid size-7 shrink-0 place-items-center text-muted"><MoreVertical className="size-4" /></button>
        </div>
        {c.text && <p className="mt-1.5 rounded-xl rounded-tl-sm bg-[#f2f7f8] px-3 py-2 text-[13px] leading-snug text-ink">{c.text}</p>}
        {c.image && <img src={c.image} alt="" className="mt-1.5 max-h-40 rounded-xl object-cover" />}
        <div className="mt-1 flex items-center gap-4 text-[12px] text-ink-2">
          <button type="button" onClick={() => feed.likeComment(p.id, c.id)} aria-pressed={liked} className={`flex h-7 items-center gap-1.5 ${liked ? 'font-semibold text-[#0b6d73]' : ''}`}>
            <Heart className={`size-4 ${liked ? 'fill-[#0b6d73] text-[#0b6d73]' : ''}`} /> Yoqdi{c.likes + (liked ? 1 : 0) > 0 && <span className="text-muted">{c.likes + (liked ? 1 : 0)}</span>}
          </button>
          <button type="button" onClick={onReply} className="h-7">Javob berish</button>
        </div>
      </div>
    </div>
  )
}
