import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Check, CircleX, Info, ShoppingCart, X } from 'lucide-react'
import { useCart, getLastAdded, onCartAdd } from '../cart'
import { parseToast, toastBottom, toastDuration } from '../lib/toastModel'

// Bildirishnoma toasti (NotificationToaster) bilan bir xil vizual til: oq "shisha" kartochka.
const TONE = {
  success: { tile: 'bg-[#e8f6ec] text-[#2e9e4f] ring-[#cfeedb]', icon: Check, bar: 'bg-[#2e9e4f]/35' },
  cart: { tile: 'bg-[#e8f6ec] text-[#2e9e4f] ring-[#cfeedb]', icon: Check, bar: 'bg-[#0F766E]/35' },
  info: { tile: 'bg-[#e4f6f8] text-[#087683] ring-[#cdeef2]', icon: Info, bar: 'bg-[#0F766E]/35' },
  warn: { tile: 'bg-[#fff5e6] text-[#b45309] ring-[#fde7c4]', icon: AlertTriangle, bar: 'bg-[#b45309]/35' },
  error: { tile: 'bg-[#fdecee] text-[#e5323d] ring-[#f9d3d7]', icon: CircleX, bar: 'bg-[#e5323d]/35' },
}

/**
 * Pastdagi "shisha" toast. Matndan turini o‘zi aniqlaydi ("… savatga qo‘shildi" → savat kartochkasi
 * rasm, nom va "Savatga o‘tish" bilan). Bir sahifada bitta toast: qayta qo‘shilsa — almashadi, ustma-ust chiqmaydi.
 */
export default function GlassToast({ text, onClose, action, bottom = 76, warn = false, tone = '', role }) {
  const info = parseToast(text, { warn, tone })
  const { items, cartNotice } = useCart() || { items: [] }
  const [bump, setBump] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const [hidden, setHidden] = useState('')
  const [drag, setDrag] = useState({ x: 0, y: 0 })
  const start = useRef(null)
  const paused = useRef(false)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const keyRef = useRef('')
  keyRef.current = `${text}-${bump}`

  // Savatga yana qo‘shilsa (bir xil matn bo‘lsa ham) — taymer qaytadan boshlanadi, kartochka yangilanadi
  useEffect(() => (text && info.kind === 'cart' ? onCartAdd(() => setBump((b) => b + 1)) : undefined), [text, info.kind])

  const dismiss = useCallback(() => {
    setLeaving(true)
    setTimeout(() => { setLeaving(false); setDrag({ x: 0, y: 0 }); setHidden(keyRef.current); closeRef.current?.() }, 200)
  }, [])

  useEffect(() => {
    if (!text) return undefined
    setLeaving(false)
    const ref = { t: null }
    const tick = () => { if (paused.current) { ref.t = setTimeout(tick, 500); return } dismiss() }
    ref.t = setTimeout(tick, toastDuration(info.kind))
    return () => clearTimeout(ref.t)
  }, [text, bump, info.kind, dismiss])

  if (!text || hidden === `${text}-${bump}`) return null
  // Savat cheklovi xabari chiqib turgan bo‘lsa, "qo‘shildi" ko‘rsatilmaydi (ustma-ust chiqmasin)
  if (tone !== 'warn' && cartNotice && parseToast(text, { warn }).kind === 'cart') return null
  const style = TONE[info.kind] || TONE.success
  const Icon = style.icon
  const last = info.kind === 'cart' ? getLastAdded() : null
  const name = info.name || last?.name || ''
  const thumb = info.kind === 'cart' && last && (!info.name || last.name === info.name || name.includes(last.name)) ? last.image : ''
  const line = info.kind === 'cart' ? items.find((it) => it.name === name) : null
  const inCart = line?.qty || 0

  const onDown = (e) => {
    if (e.target.closest('a,button')) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    start.current = { x: e.clientX, y: e.clientY }
    paused.current = true
  }
  const onMove = (e) => {
    if (!start.current) return
    const dx = e.clientX - start.current.x
    const dy = e.clientY - start.current.y
    setDrag(Math.abs(dx) > Math.abs(dy) ? { x: dx, y: 0 } : { x: 0, y: Math.max(0, dy) })
  }
  const onUp = () => {
    if (!start.current) return
    start.current = null
    paused.current = false
    if (Math.abs(drag.x) > 70 || drag.y > 36) { dismiss(); return }
    setDrag({ x: 0, y: 0 })
  }
  const dist = Math.max(Math.abs(drag.x), drag.y * 2)

  return (
    <div className="pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-3" style={{ bottom: toastBottom(bottom) }}>
      <div
        key={`${text}-${bump}`}
        role={role || (info.kind === 'error' || info.kind === 'warn' ? 'alert' : 'status')}
        aria-live={info.kind === 'error' || info.kind === 'warn' ? 'assertive' : 'polite'}
        className={`glass-toast pointer-events-auto relative w-full max-w-[440px] touch-pan-y select-none overflow-hidden rounded-[22px] border border-white/80 bg-white/[0.86] shadow-[0_14px_40px_rgb(11_31_58/0.20),inset_0_1px_0_rgb(255_255_255/0.9)] backdrop-blur-[24px] backdrop-saturate-[180%] [-webkit-backdrop-filter:blur(24px)_saturate(180%)] ${leaving ? 'glass-toast-out' : ''}`}
        style={dist ? { transform: `translate(${drag.x}px, ${drag.y}px)`, opacity: Math.max(0.3, 1 - dist / 220), transition: 'none' } : undefined}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={() => { start.current = null; paused.current = false; setDrag({ x: 0, y: 0 }) }}
        onMouseEnter={() => { paused.current = true }}
        onMouseLeave={() => { paused.current = false }}
      >
        <div className={`flex items-center gap-3 py-2.5 pl-3 ${info.kind === 'cart' ? 'pr-2.5' : 'pr-10'}`}>
          {info.kind === 'cart' ? (
            <span className="relative shrink-0">
              <span className="grid size-12 place-items-center overflow-hidden rounded-[14px] bg-[#f3f6fb] ring-1 ring-inset ring-[#e7ecf3]">
                {thumb ? <img src={thumb} alt="" className="size-full object-contain p-1" /> : <ShoppingCart className="size-5 text-[#0F766E]" />}
              </span>
              <span className="absolute -bottom-1 -right-1 grid size-[20px] place-items-center rounded-full bg-[#2e9e4f] text-white ring-2 ring-white" aria-hidden="true">
                <Check className="size-3" strokeWidth={3} />
              </span>
              {inCart > 1 && <span className="absolute -left-1.5 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#0b1f3a] px-1 text-[10px] font-bold tabular-nums text-white ring-2 ring-white" aria-label={`Savatda ${inCart} ta`}>×{inCart > 99 ? '99+' : inCart}</span>}
            </span>
          ) : (
            <span className={`grid size-10 shrink-0 place-items-center rounded-[14px] ring-1 ring-inset ${style.tile}`} aria-hidden="true"><Icon className="size-[19px]" strokeWidth={2.2} /></span>
          )}
          <span className="min-w-0 flex-1">
            {info.kind === 'cart' ? (
              <>
                <span className="block whitespace-nowrap text-[14px] font-bold leading-snug text-[#0b1f3a]">Savatga qo‘shildi</span>
                {name && <span className="mt-0.5 line-clamp-2 break-words text-[12.5px] leading-[1.35] text-[#516074]">{info.qty > 1 ? `${info.qty} ta · ` : ''}{name}</span>}
              </>
            ) : (
              <span className="line-clamp-3 break-words text-[13.5px] font-semibold leading-[1.35] text-[#0b1f3a]">{info.title}</span>
            )}
          </span>
          {info.kind === 'cart' ? (
            <Link to="/savatcha" state={{ from: 'market' }} onClick={() => { setHidden(keyRef.current); closeRef.current?.() }} className="shrink-0 whitespace-nowrap rounded-xl bg-[#0F766E] px-3 py-2 text-[12.5px] font-semibold text-white shadow-[0_4px_12px_rgb(15_118_110/0.28)] transition active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E]">
              Savatga o‘tish
            </Link>
          ) : action ? (
            <span className="shrink-0 text-[12.5px] font-semibold [&_a]:!text-[#0F766E] [&_button]:!text-[#0F766E]">{action}</span>
          ) : null}
        </div>
        {info.kind !== 'cart' && <button type="button" onClick={dismiss} aria-label="Yopish" className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full text-[#94a3b8] transition hover:bg-black/5 hover:text-[#475569] focus-visible:outline-2 focus-visible:outline-[#0F766E]"><X className="size-[15px]" /></button>}
        <span className={`glass-toast-timer absolute inset-x-0 bottom-0 h-[3px] origin-left ${style.bar}`} style={{ animationDuration: `${toastDuration(info.kind)}ms` }} aria-hidden="true" />
      </div>
    </div>
  )
}
