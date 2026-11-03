import { House, Package, FileText, UserRound, Star, BadgePercent, Megaphone, ChartNoAxesColumn, Wallet, Settings, Sparkles, TicketPercent, Flame, Send } from 'lucide-react'

export const MARKETING_NAV = [
  { to: '/sotuvchi/marketing/chegirmalar', label: 'Chegirmalar', icon: BadgePercent, match: ['/sotuvchi/chegirmalar'] },
  { to: '/sotuvchi/marketing/promokodlar', label: 'Promokodlar', icon: TicketPercent },
  { to: '/sotuvchi/marketing/aksiyalar', label: 'Aksiyalar', icon: Flame },
  { to: '/sotuvchi/marketing/reklama', label: 'Reklama', icon: Megaphone, match: ['/sotuvchi/reklama'] },
  { to: '/sotuvchi/marketing/telegram', label: 'Telegram xabar', icon: Send },
]

export const SELLER_NAV = [
  { to: '/sotuvchi', label: 'Bosh sahifa', icon: House, end: true },
  { to: '/sotuvchi/mahsulotlar', label: 'Mahsulotlar', icon: Package },
  { to: '/sotuvchi/buyurtmalar', label: 'Buyurtmalar', icon: FileText },
  { to: '/sotuvchi/mijozlar', label: 'Mijozlar', icon: UserRound },
  { to: '/sotuvchi/sharhlar', label: 'Sharhlar', icon: Star },
  { to: '/sotuvchi/marketing', label: 'Marketing', icon: Sparkles, children: MARKETING_NAV, match: ['/sotuvchi/chegirmalar', '/sotuvchi/reklama'] },
  { to: '/sotuvchi/analitika', label: 'Analitika', icon: ChartNoAxesColumn },
  { to: '/sotuvchi/hamyon', label: 'Hamyon va to‘lovlar', icon: Wallet },
  { to: '/sotuvchi/sozlamalar', label: 'Sozlamalar', icon: Settings },
]

export const isUnder = (pathname, item) => [item.to, ...(item.match || [])].some((p) => pathname === p || pathname.startsWith(`${p}/`))
