import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, Search, Store, House, Package, FileText, UserRound, Ellipsis, LogOut, Lock, ShieldCheck } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { canUseSeller, signOut, useSession } from '../sessionStore'
import { SELLER_NAV } from './nav'
import Logo from './components/shell/Logo'
import Modal from './components/shell/Modal'
import QuickActions from './components/bosh-sahifa/QuickActions'
import OrderDrawer from './components/bosh-sahifa/OrderDrawer'
import { useSellerData } from './api'
import { Toaster } from './components/ui'

function useShopName() {
  const session = useSession()
  const [shop, setShop] = useState('')
  useEffect(() => {
    if (!supabase || !session.user) return
    supabase.from('profiles').select('shop_name').eq('id', session.user.id).maybeSingle()
      .then(({ data }) => setShop(data?.shop_name || ''))
  }, [session.user])
  useEffect(() => { const h = (e) => setShop(e.detail); window.addEventListener('shop-name', h); return () => window.removeEventListener('shop-name', h) }, [])
  return shop || session.profile?.name || 'Do‘kon'
}

export default function SellerLayout() {
  const shop = useShopName()
  const data = useSellerData()
  const [quick, setQuick] = useState(null) // null | 'menu' | action key
  const [orderId, setOrderId] = useState(null)
  const [more, setMore] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0); setMore(false) }, [pathname])
  const hasNew = data.orders.some((o) => o.status === 'yangi')
  const session = useSession()
  const verified = canUseSeller(session.profile)
  const nav = useNavigate()
  const locked = (to) => !verified && to !== '/sotuvchi/sozlamalar'
  const ctx = { shop, openQuick: (k = 'menu') => (verified ? setQuick(k) : nav('/sotuvchi/tasdiqlash')), openOrder: setOrderId }

  return (
    <div className="min-h-screen bg-[#F6FAFA] font-sans text-[#10283F]">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col border-r border-[#E6EEF0] bg-white md:flex">
        <div className="px-6 pb-7 pt-6"><Logo /></div>
        <nav className="flex flex-col gap-1.5 px-3.5">
          {SELLER_NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `flex h-[46px] items-center gap-3.5 rounded-xl px-3.5 text-[15px] font-medium transition-colors ${isActive ? 'bg-[#F0FDFA] text-[#0F766E] shadow-[inset_0_0_0_1px_#CCFBF1]' : 'text-[#1F2A3C] hover:bg-[#F0FDFA] hover:text-[#0F766E]'}`}>
              <Icon className="size-[21px]" strokeWidth={1.9} />{label}{locked(to) && <Lock className="ml-auto size-4 text-[#8A98A8]" aria-label="Qulflangan" />}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="md:pl-[232px]">
        {/* desktop header */}
        <header className="sticky top-0 z-20 hidden h-[72px] items-center border-b border-[#E6EEF0] bg-white/95 px-6 backdrop-blur md:flex">
          <SearchBox />
          <div className="ml-auto flex items-center gap-6">
            <button type="button" onClick={() => setQuick(null)} aria-label="Bildirishnomalar" className="relative rounded-lg p-1.5 text-[#10283F] hover:bg-[#F0FDFA]">
              <Bell className="size-6" strokeWidth={1.9} />
              {hasNew && <span className="absolute right-1 top-1 size-2 rounded-full bg-[#0F766E]" />}
            </button>
            <ProfileMenu shop={shop} />
          </div>
        </header>

        {/* mobile header */}
        <header className="flex items-center px-5 pb-3 pt-4 md:hidden">
          <Logo size="sm" />
          <div className="ml-auto flex items-center gap-3">
            <span className="relative p-1"><Bell className="size-[26px]" strokeWidth={1.9} />{hasNew && <span className="absolute right-1 top-0.5 size-2.5 rounded-full border-2 border-white bg-[#0F766E]" />}</span>
            <ProfileMenu shop={shop} compact />
          </div>
        </header>

        <main className="px-4 pb-28 md:px-6 md:pb-10 md:pt-6">
          {!verified && <UnverifiedBanner status={session.profile?.seller_status} />}
          {verified && <ApprovalNotice uid={session.user?.id} />}
          <Outlet context={ctx} />
        </main>
      </div>

      {/* mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[#E6EEF0] bg-white pb-[max(env(safe-area-inset-bottom),8px)] pt-2 md:hidden">
        {[
          { to: '/sotuvchi', label: 'Bosh sahifa', icon: House, end: true },
          { to: '/sotuvchi/mahsulotlar', label: 'Mahsulotlar', icon: Package },
          { to: '/sotuvchi/buyurtmalar', label: 'Buyurtmalar', icon: FileText },
          { to: '/sotuvchi/mijozlar', label: 'Mijozlar', icon: UserRound },
        ].map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex flex-col items-center gap-1 text-[12px] font-medium ${isActive ? 'text-[#0F766E]' : 'text-[#4A5A6A]'}`}>
            {({ isActive }) => (<><span className="relative"><Icon className="size-[26px]" strokeWidth={1.8} fill={isActive ? '#0F766E' : 'none'} color={isActive ? '#0F766E' : 'currentColor'} />{locked(to) && <Lock className="absolute -right-1.5 -top-1 size-3.5 rounded-full bg-white text-[#8A98A8]" />}</span>{label}</>)}
          </NavLink>
        ))}
        <button type="button" onClick={() => setMore(true)} className="flex flex-col items-center gap-1 text-[12px] font-medium text-[#4A5A6A]">
          <Ellipsis className="size-[26px]" strokeWidth={1.8} />Ko‘proq
        </button>
      </nav>

      <Modal open={more} onClose={() => setMore(false)} title="Bo‘limlar">
        <div className="grid grid-cols-2 gap-2.5">
          {SELLER_NAV.slice(4).map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className="flex items-center gap-3 rounded-xl bg-[#F0FDFA] px-3.5 py-3 text-[14px] font-semibold text-[#10283F]">
              <Icon className="size-5 text-[#0F766E]" />{label}{locked(to) && <Lock className="ml-auto size-4 text-[#8A98A8]" />}
            </NavLink>
          ))}
        </div>
      </Modal>

      <QuickActions open={quick} setOpen={setQuick} products={data.products} />
      <OrderDrawer orderId={orderId} onClose={() => setOrderId(null)} />
      <Toaster />
    </div>
  )
}

/** Shows unread "do‘kon tasdiqlandi" in-app notification (customer_notifications, link /sotuvchi). */
function ApprovalNotice({ uid }) {
  const [note, setNote] = useState(null)
  useEffect(() => {
    if (!supabase || !uid) return
    supabase.from('customer_notifications').select('id,title,body').eq('user_id', uid).eq('link', '/sotuvchi').is('read_at', null)
      .order('created_at', { ascending: false }).limit(1).then(({ data }) => setNote(data?.[0] || null))
  }, [uid])
  if (!note) return null
  const close = () => { setNote(null); supabase.from('customer_notifications').update({ read_at: new Date().toISOString() }).eq('id', note.id).then(() => {}) }
  return (
    <div data-testid="approval-notice" role="status" className="mb-4 flex items-start gap-3 rounded-2xl bg-[#0F766E] p-4 text-white shadow-[0_10px_30px_rgb(15_118_110/0.25)]">
      <ShieldCheck className="mt-0.5 size-6 shrink-0" />
      <span className="min-w-0 flex-1"><b className="block text-[15px]">{note.title}</b><span className="text-[13.5px] text-white/90">{note.body}</span></span>
      <button type="button" onClick={close} className="rounded-lg bg-white/15 px-3 py-1.5 text-[13px] font-semibold hover:bg-white/25">Yopish</button>
    </div>
  )
}

function UnverifiedBanner({ status }) {
  const navigate = useNavigate()
  const pending = status === 'pending'
  return (
    <div data-testid="unverified-banner" className="mb-4 flex flex-col gap-3 rounded-2xl border border-[#CCFBF1] bg-[#F0FDFA] p-4 sm:flex-row sm:items-center">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#0F766E]"><ShieldCheck className="size-5" /></span>
      <span className="min-w-0 flex-1 text-[13.5px] leading-snug text-[#3D4E5F]">
        <b className="block text-[14.5px] text-[#10283F]">{pending ? 'Arizangiz ko‘rib chiqilmoqda' : status === 'rejected' ? 'Arizangiz rad etildi' : 'Do‘koningiz hali tasdiqlanmagan'}</b>
        {pending ? 'Tasdiqlangach mahsulot qo‘shish va boshqa bo‘limlar ochiladi. Hozircha do‘kon sozlamalarini to‘ldirishingiz mumkin.' : 'Hozircha faqat Sozlamalar ishlaydi. Mahsulot qo‘shish uchun tasdiqdan o‘ting.'}
      </span>
      {!pending && <button type="button" data-testid="banner-verify" onClick={() => navigate('/sotuvchi/tasdiqlash')} className="h-10 shrink-0 rounded-xl bg-[#0F766E] px-4 text-[14px] font-semibold text-white">{status === 'rejected' ? 'Qayta yuborish' : 'Tasdiqdan o‘tish'}</button>}
    </div>
  )
}

const SEARCH = {
  mahsulotlar: 'Mahsulot, SKU yoki kategoriya bo‘yicha qidirish...',
  buyurtmalar: 'Buyurtma raqami, mijoz yoki telefon bo‘yicha qidirish...',
  mijozlar: 'Mijoz nomi, telefon yoki STIR bo‘yicha qidirish...',
  sharhlar: 'Sharh, mahsulot yoki xaridor bo‘yicha qidirish...',
  chegirmalar: 'Chegirma nomi yoki promokod bo‘yicha qidirish...',
  reklama: 'Kampaniya nomi bo‘yicha qidirish...',
}
function SearchBox() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const section = pathname.split('/')[2] || ''
  const target = SEARCH[section] ? section : 'buyurtmalar'
  const [q, setQ] = useState('')
  useEffect(() => setQ(''), [section])
  return (
    <form className="relative w-full max-w-[480px]" onSubmit={(e) => { e.preventDefault(); navigate(`/sotuvchi/${target}${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`) }}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-[#6B7A88]" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={SEARCH[section] || 'Mahsulot, buyurtma yoki mijozni qidirish...'}
        className="h-[38px] w-full rounded-[10px] border border-[#DCE5E7] bg-white pl-10 pr-3 text-[13.5px] outline-none placeholder:text-[#6B7A88] focus:border-[#0F766E]" />
    </form>
  )
}

function ProfileMenu({ shop, compact }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()
  useEffect(() => {
    const off = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', off)
    return () => document.removeEventListener('mousedown', off)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-2.5 text-left">
        <span className={`grid place-items-center rounded-full bg-[#E3F4F2] text-[#0F766E] ${compact ? 'size-10' : 'size-[46px]'}`}><Store className={compact ? 'size-5' : 'size-6'} strokeWidth={1.8} /></span>
        <span className="leading-tight">
          <span className={`block font-bold text-[#10283F] ${compact ? 'max-w-[84px] truncate text-[13px]' : 'text-[15px]'}`}>{shop}</span>
          {!compact && <span className="block text-[12.5px] text-[#6B7A88]">Sotuvchi</span>}
        </span>
        <ChevronDown className={`size-5 text-[#10283F] ${compact ? '' : 'ml-6'}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-52 rounded-xl border border-[#E6EEF0] bg-white p-1.5 shadow-[0_12px_32px_rgb(8_40_45/0.12)]">
          <button type="button" onClick={() => navigate('/sotuvchi/sozlamalar')} className="w-full rounded-lg px-3 py-2 text-left text-[14px] hover:bg-[#F0FDFA]">Sozlamalar</button>
          <button type="button" onClick={async () => { await signOut(); navigate('/kirish') }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[14px] hover:bg-[#F0FDFA]"><LogOut className="size-4" />Chiqish</button>
        </div>
      )}
    </div>
  )
}
