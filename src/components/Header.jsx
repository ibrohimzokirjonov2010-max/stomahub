import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search, ChevronDown, MapPin, Heart, ShoppingCart, Bell, Menu, Camera, LogOut, X } from 'lucide-react'
import { Logo } from './icons'
import { useCart } from '../cart'
import { profileStore, useProfile } from '../profileStore'
import { fetchNotifications } from '../buyerApi'
import { signOut, useSession } from '../sessionStore'
import { initialsOf, looksLikeDemoName } from '../demoPurge'

// variant="home" — bosh sahifa dizayni, variant="shop" — marketplace sahifalari
// search (faqat shop): "image" — "Rasm orqali qidirish" tugmasi, "icon" — faqat kamera ikonkasi, "plain" — oddiy qidiruv
export default function Header({ onMenu, variant = 'home', search = 'image', placeholder = 'Mahsulot, brend yoki kategoriya qidiring...', onQuery }) {
  const shop = variant === 'shop'
  const { items, count } = useCart()
  const profile = useProfile()
  const session = useSession()
  const authed = session.status === 'authed' || profile.accountLive
  const remoteName = session.profile?.full_name || session.profile?.name || ''
  const localName = profile.accountLive ? (profile.name || '') : ''
  const rawName = authed ? (localName || remoteName || '') : ''
  const who = !authed ? 'Mehmon' : (looksLikeDemoName(rawName) && remoteName && !looksLikeDemoName(remoteName) ? remoteName : (rawName || remoteName || 'Shifokor'))
  const role = !authed ? 'Hisobga kiring' : (profile.accountLive ? (profile.role || session.profile?.specialty || '') : (session.profile?.specialty || profile.role || '')) || '—'
  const avatarUrl = (profile.accountLive ? profile.avatar : '') || session.profile?.avatar_url || ''
  const showInitials = authed && !avatarUrl
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const cartFrom = pathname.startsWith('/forma') ? 'forma' : pathname.startsWith('/jihoz') ? 'jihoz' : 'market'
  const [text, setText] = useState('')
  const [unread, setUnread] = useState(0)
  useEffect(() => {
    let alive = true
    if (session.status === 'authed') {
      fetchNotifications().then((rows) => {
        if (!alive) return
        const n = (rows || []).filter((r) => !r.read_at && !(profile.readNotifs || []).includes(r.id)).length
        setUnread(n)
      }).catch(() => {})
    } else setUnread(0)
    return () => { alive = false }
  }, [session.status, profile.readNotifs])

  useEffect(() => { setText(''); onQuery?.('') }, [placeholder])

  return (
    <header className={`sticky top-0 z-30 flex h-[46px] items-center gap-4 bg-white px-4 lg:px-5 ${shop ? 'shadow-[0_1px_0_#eef2f6]' : 'border-b border-line'}`}>
      <button onClick={onMenu} className="-ml-1 rounded-lg p-1.5 text-ink-2 hover:bg-page lg:hidden" aria-label="Menyu">
        <Menu className="size-6" />
      </button>

      <div className="shrink-0 lg:hidden">
        <Logo />
      </div>

      {shop ? (
        <form className={`hidden h-[29px] flex-1 items-center rounded-full bg-[#f2f5f9] md:flex ${search === 'image' ? 'max-w-[628px]' : 'max-w-[595px]'}`} onSubmit={(e) => e.preventDefault()}>
          <Search className="ml-3.5 size-[14px] shrink-0 text-ink-2" />
          <input
            type="text"
            value={text}
            placeholder={placeholder}
            onChange={(e) => { setText(e.target.value); onQuery?.(e.target.value) }}
            className="h-full flex-1 bg-transparent px-3 text-[10.5px] text-ink-2 outline-none placeholder:text-[#8a94a3]"
          />
          {text && (
            <button type="button" aria-label="Tozalash" onClick={() => { setText(''); onQuery?.('') }} className="mr-2 grid size-5 place-items-center rounded-full text-muted hover:bg-white">
              <X className="size-3" />
            </button>
          )}
          {search === 'image' && (
            <button type="button" className="mr-0.5 hidden h-[25px] items-center gap-2 rounded-full bg-white pl-1 pr-3.5 text-[10.5px] font-medium text-sea shadow-sm transition hover:bg-sea-50 lg:flex">
              <span className="grid h-[21px] w-[24px] place-items-center rounded-full bg-sea-50"><Camera className="size-3.5" /></span>
              Rasm orqali qidirish
            </button>
          )}
          {search === 'icon' && (
            <button type="button" aria-label="Rasm orqali qidirish" className="mr-2.5 grid size-[22px] place-items-center rounded-md text-ink-2 transition hover:text-sea">
              <Camera className="size-4" strokeWidth={1.7} />
            </button>
          )}
        </form>
      ) : (
        <form className="hidden h-[29px] max-w-[642px] flex-1 items-center md:flex" onSubmit={(e) => e.preventDefault()}>
          <div className="flex h-full flex-1 items-center rounded-l-lg bg-[#f2f5fa]">
            <Search className="ml-3.5 size-[14px] shrink-0 text-ink-2" />
            <input
              type="text"
              placeholder={placeholder}
              className="h-full flex-1 bg-transparent px-3 text-[10.5px] text-ink-2 outline-none placeholder:text-[#8a94a3]"
            />
            <button type="button" className="hidden h-full items-center gap-2 border-l border-white px-4 text-[10px] text-ink-2 xl:flex">
              Barcha kategoriyalar <ChevronDown className="size-4" />
            </button>
          </div>
          <button className="ml-1.5 grid h-full w-[40px] place-items-center rounded-md bg-brand text-white transition hover:bg-brand-600" aria-label="Qidirish">
            <Search className="size-4" strokeWidth={2.2} />
          </button>
        </form>
      )}

      <div className="ml-auto flex items-center gap-1 sm:gap-3">
        <button className="hidden items-center gap-1.5 rounded-lg px-2 py-1.5 text-[10.5px] text-ink-2 hover:bg-page sm:flex">
          <MapPin className={`size-[14px] ${shop ? 'text-sea' : ''}`} /> Toshkent {!shop && <ChevronDown className="size-3.5" />}
        </button>
        {!shop && <div className="hidden h-6 w-px bg-line sm:block" />}

        {shop ? (
          <>
            <IconBtn label="Savat" onClick={() => navigate('/savatcha', { state: { from: cartFrom } })}>
              <ShoppingCart className="size-[17px]" />
              {items.length > 0 && <Badge className="bg-sea">{items.length}</Badge>}
            </IconBtn>
            <IconBtn label="Bildirishnomalar" onClick={() => navigate('/profil')}>
              <Bell className="size-[17px]" />
              {unread > 0 && <Badge className="bg-[#e11d48]">{unread > 9 ? '9+' : unread}</Badge>}
            </IconBtn>
            <IconBtn label="Sevimlilar" className="hidden sm:grid" onClick={() => navigate('/profil/sevimlilar')}><Heart className="size-[17px]" /></IconBtn>
          </>
        ) : (
          <>
            <IconBtn label="Sevimlilar" className="hidden sm:grid"><Heart className="size-[17px]" /></IconBtn>
            <IconBtn label="Savat" onClick={() => navigate('/savatcha')}>
              <ShoppingCart className="size-[17px]" />
              {count > 0 && <Badge className="bg-brand">{count}</Badge>}
            </IconBtn>
            <IconBtn label="Bildirishnomalar">
              <Bell className="size-[17px]" />
            </IconBtn>
          </>
        )}

        <div className="ml-1 hidden h-8 w-px bg-line sm:block" />
        <button type="button" onClick={() => navigate(authed ? '/profil' : '/kirish')} className="flex items-center gap-2.5 rounded-lg py-1 pl-1 pr-1.5 hover:bg-page">
          {showInitials ? (
            <span className="grid size-[26px] place-items-center rounded-full bg-sea-50 text-[10px] font-bold text-sea">{initialsOf(who)}</span>
          ) : (
            <img src={avatarUrl || (shop ? '/images/market/avatar2.jpg' : '/images/avatar.jpg')} alt="" className="size-[26px] rounded-full object-cover" />
          )}
          <span className="hidden text-left leading-tight xl:block">
            <span className="block text-[10.5px] font-semibold text-ink">{who}</span>
            <span className="block text-[9.5px] text-muted">{role}</span>
          </span>
          <ChevronDown className="hidden size-4 text-ink-2 xl:block" />
        </button>
        {authed && (
          <button
            type="button"
            onClick={async () => {
              await signOut()
              profileStore.update({ loggedOut: true, accountLive: false })
              navigate('/kirish')
            }}
            className="hidden h-8 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-[#d14343] hover:bg-[#fff5f5] sm:inline-flex"
          >
            <LogOut className="size-3.5" /> Chiqish
          </button>
        )}
      </div>
    </header>
  )
}

function Badge({ className, children }) {
  return (
    <span className={`absolute -right-0.5 -top-0.5 grid size-[12px] place-items-center rounded-full text-[7.5px] font-semibold text-white ring-2 ring-white ${className}`}>
      {children}
    </span>
  )
}

function IconBtn({ label, className = 'grid', onClick, children }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className={`relative size-8 place-items-center rounded-lg text-ink-2 transition hover:bg-page ${className}`}>
      {children}
    </button>
  )
}
