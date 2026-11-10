import { Bell, CircleCheckBig, CircleX, Info, PackageCheck, PackageOpen, Truck } from 'lucide-react'
import { splitTitle } from '../lib/notifyModel'

// Holat → rang va ikonka (sayt palitrasi: sea/teal, amber, blue, ok-green, sale-red)
export const STATUS_STYLE = {
  tasdiqlandi: { icon: CircleCheckBig, tile: 'bg-[#e4f6f8] text-[#087683] ring-[#cdeef2]', pill: 'bg-[#e4f6f8] text-[#087683]' },
  tayyorlanmoqda: { icon: PackageOpen, tile: 'bg-[#fff5e6] text-[#b45309] ring-[#fde7c4]', pill: 'bg-[#fff5e6] text-[#b45309]' },
  yetkazilmoqda: { icon: Truck, tile: 'bg-[#eaf1fe] text-[#1f6fe0] ring-[#d5e3fc]', pill: 'bg-[#eaf1fe] text-[#1f5fc4]' },
  yetkazildi: { icon: PackageCheck, tile: 'bg-[#e8f6ec] text-[#2e9e4f] ring-[#cfeedb]', pill: 'bg-[#e8f6ec] text-[#23803f]' },
  bekor_qilindi: { icon: CircleX, tile: 'bg-[#fdecee] text-[#e5323d] ring-[#f9d3d7]', pill: 'bg-[#fdecee] text-[#c4202b]' },
}
const ORDER = { icon: Bell, tile: 'bg-[#e4f6f8] text-[#087683] ring-[#cdeef2]', pill: '' }
const INFO = { icon: Info, tile: 'bg-[#eef2f7] text-[#475569] ring-[#e2e8f0]', pill: '' }

/** Bildirishnoma ko‘rinishi: { head, status, label, style } */
export function notifView(n) {
  const t = splitTitle(n?.title)
  const style = STATUS_STYLE[t.status] || (n?.kind === 'order' ? ORDER : INFO)
  return { ...t, style }
}

export function StatusTile({ style, size = 'size-11', icon = 'size-[20px]' }) {
  const Icon = style.icon
  return (
    <span className={`grid shrink-0 place-items-center rounded-[14px] ring-1 ring-inset ${size} ${style.tile}`} aria-hidden="true">
      <Icon className={icon} strokeWidth={2} />
    </span>
  )
}

export function StatusPill({ view }) {
  if (!view.label || !view.style.pill) return null
  return <span className={`inline-flex h-[22px] shrink-0 items-center rounded-full px-2 text-[11.5px] font-semibold ${view.style.pill}`}>{view.label}</span>
}
