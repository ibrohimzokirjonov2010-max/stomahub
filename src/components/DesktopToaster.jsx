// Desktop (≥768px) uchun yagona toast: savatga qo‘shildi (rasm, nom, "Savatga o‘tish"), sevimlilar, savat cheklovlari.
// Mobil sahifalar o‘z toastlarini (GlassToast, pastda) ko‘rsatadi — bu komponent mobilda hech narsa chizmaydi.
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AlertTriangle, Check, Heart, Info, ShoppingCart, X } from 'lucide-react'
import { onCartAdd, useCart } from '../cart'
import { useMobile } from '../useMobile'
import { cartToastModel, detailPath, onToast, quietCartPath } from '../lib/toastBus'

const DURATION = { cart: 3000, fav: 2600, info: 2600, success: 3000, warn: 4500, error: 4500 }
const TILE = {
  fav: 'bg-[#fdecee] text-[#e5323d] ring-[#f9d3d7]',
  info: 'bg-[#e4f6f8] text-[#087683] ring-[#cdeef2]',
  success: 'bg-[#e8f6ec] text-[#2e9e4f] ring-[#cfeedb]',
  warn: 'bg-[#fff5e6] text-[#b45309] ring-[#fde7c4]',
  error: 'bg-[#fdecee] text-[#e5323d] ring-[#f9d3d7]',
}
const ICON = { fav: Heart, info: Info, success: Check, warn: AlertTriangle, error: AlertTriangle }
const BAR = { cart: 'bg-[#0F766E]/40', fav: 'bg-[#e5323d]/35', warn: 'bg-[#b45309]/40', error: 'bg-[#e5323d]/40' }

export default function DesktopToaster() {
  const mobile = useMobile()
  const { items = [], cartNotice, closeCartNotice } = useCart() || {}
  const { pathname } = useLocation()
  const [toast, setToast] = useState(null)
  const [leaving, setLeaving] = useState(false)
  const itemsRef = useRef(items)
  itemsRef.current = items
  const pathRef = useRef(pathname)
  pathRef.current = pathname
  const paused = useRef(false)
  const noticeRef = useRef(closeCartNotice)
  noticeRef.current = closeCartNotice

  const push = useCallback((t) => { setLeaving(false); setToast({ ...t, key: Date.now() + Math.random() }) }, [])
  const dismiss = useCallback(() => {
    setLeaving(true)
    setTimeout(() => {
      setToast(null)
      setLeaving(false)
    }, 180)
  }, [])

  // Savatga qo‘shildi — qaysi joydan bo‘lmasin (mahsulot sahifasi, kartochka, Forma, Jihozlar, Kitoblar, Aksiyalar)
  useEffect(() => {
    if (mobile) return undefined
    return onCartAdd((last) => {
      if (quietCartPath(pathRef.current)) return
      // qty yangilangan holatini olish uchun bir kadr kutamiz
      requestAnimationFrame(() => push(cartToastModel(last, itemsRef.current)))
    })
  }, [mobile, push])
  useEffect(() => (mobile ? undefined : onToast(push)), [mobile, push])
  // Savat cheklovlari (ombor qoldig‘i, o‘z mahsuloti, ortiqcha material) — xato sifatida
  useEffect(() => {
    if (mobile || !cartNotice) return
    push({ kind: 'warn', title: 'Savatga qo‘shib bo‘lmadi', text: cartNotice })
    noticeRef.current?.() // keyingi xuddi shu xabar ham qayta chiqsin
  }, [mobile, cartNotice, push])
  // Savatdagi miqdor (×n) jonli
  const qty = toast?.kind === 'cart' ? items.find((it) => it.id === toast.id)?.qty || toast.qty : 0

  useEffect(() => {
    if (!toast) return undefined
    const ref = { t: null }
    const tick = () => { if (paused.current) { ref.t = setTimeout(tick, 400); return } dismiss() }
    ref.t = setTimeout(tick, DURATION[toast.kind] || 3000)
    return () => clearTimeout(ref.t)
  }, [toast, dismiss])
  useEffect(() => { if (toast && quietCartPath(pathname) && toast.kind === 'cart') setToast(null) }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  if (mobile || !toast) return null
  const cart = toast.kind === 'cart'
  const Icon = ICON[toast.kind] || Info
  const alert = toast.kind === 'warn' || toast.kind === 'error'
  return (
    <div className={`pointer-events-none fixed right-5 z-[96] flex w-[380px] max-w-[calc(100vw-40px)] justify-end ${detailPath(pathname) ? 'bottom-6' : 'top-[68px]'}`} data-testid="desktop-toast-host" data-pos={detailPath(pathname) ? 'bottom' : 'top'}>
      <div key={toast.key} role={alert ? 'alert' : 'status'} aria-live={alert ? 'assertive' : 'polite'} data-testid="desktop-toast" data-kind={toast.kind}
        onMouseEnter={() => { paused.current = true }} onMouseLeave={() => { paused.current = false }}
        className={`desktop-toast pointer-events-auto relative w-full overflow-hidden rounded-[18px] border border-white/80 bg-white/[0.94] shadow-[0_18px_48px_rgb(11_31_58/0.22),inset_0_1px_0_rgb(255_255_255/0.9)] backdrop-blur-[20px] ${leaving ? 'desktop-toast-out' : ''}`}>
        <div className="flex items-center gap-3 py-3 pl-3 pr-9">
          {cart || toast.image ? (
            <span className="relative shrink-0">
              <span className="grid size-[52px] place-items-center overflow-hidden rounded-[14px] bg-[#f3f6fb] ring-1 ring-inset ring-[#e7ecf3]">
                {toast.image ? <img src={toast.image} alt="" className="size-full object-contain p-1" /> : <ShoppingCart className="size-5 text-[#0F766E]" />}
              </span>
              <span className={`absolute -bottom-1 -right-1 grid size-[20px] place-items-center rounded-full text-white ring-2 ring-white ${toast.kind === 'fav' ? 'bg-[#e5323d]' : 'bg-[#2e9e4f]'}`} aria-hidden="true">
                {toast.kind === 'fav' ? <Heart className="size-3 fill-white" strokeWidth={2.5} /> : <Check className="size-3" strokeWidth={3} />}
              </span>
              {cart && qty > 1 && <span className="absolute -left-1.5 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#0b1f3a] px-1 text-[10px] font-bold tabular-nums text-white ring-2 ring-white" aria-label={`Savatda ${qty} ta`}>×{qty > 99 ? '99+' : qty}</span>}
            </span>
          ) : (
            <span className={`grid size-11 shrink-0 place-items-center rounded-[14px] ring-1 ring-inset ${TILE[toast.kind] || TILE.info}`} aria-hidden="true"><Icon className="size-5" strokeWidth={2.2} /></span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-bold leading-snug text-[#0b1f3a]">{toast.title}</span>
            {toast.text && <span className="mt-0.5 line-clamp-2 break-words text-[12.5px] leading-[1.35] text-[#516074]">{toast.text}</span>}
          </span>
          {toast.href && toast.actionLabel && (
            <Link to={toast.href} state={cart ? { from: 'market' } : undefined} onClick={() => setToast(null)} data-testid="desktop-toast-action"
              className={`shrink-0 whitespace-nowrap rounded-xl px-3 py-2 text-[12.5px] font-semibold transition active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E] ${cart ? 'bg-[#0F766E] text-white shadow-[0_4px_12px_rgb(15_118_110/0.28)] hover:bg-[#115E59]' : 'bg-[#F0FDFA] text-[#0F766E] hover:bg-[#CCFBF1]'}`}>
              {toast.actionLabel}
            </Link>
          )}
        </div>
        <button type="button" onClick={dismiss} aria-label="Yopish" className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full text-[#94a3b8] transition hover:bg-black/5 hover:text-[#475569] focus-visible:outline-2 focus-visible:outline-[#0F766E]"><X className="size-[15px]" /></button>
        <span className={`glass-toast-timer absolute inset-x-0 bottom-0 h-[3px] origin-left ${BAR[toast.kind] || 'bg-[#0F766E]/35'}`} style={{ animationDuration: `${DURATION[toast.kind] || 3000}ms` }} aria-hidden="true" />
      </div>
    </div>
  )
}
