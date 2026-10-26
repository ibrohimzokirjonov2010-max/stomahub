import { House, Package, FileText, UserRound, Star, BadgePercent, Megaphone, ChartNoAxesColumn, Wallet, Settings } from 'lucide-react'

export const SELLER_NAV = [
  { to: '/sotuvchi', label: 'Bosh sahifa', icon: House, end: true },
  { to: '/sotuvchi/mahsulotlar', label: 'Mahsulotlar', icon: Package },
  { to: '/sotuvchi/buyurtmalar', label: 'Buyurtmalar', icon: FileText },
  { to: '/sotuvchi/mijozlar', label: 'Mijozlar', icon: UserRound },
  { to: '/sotuvchi/sharhlar', label: 'Sharhlar', icon: Star },
  { to: '/sotuvchi/chegirmalar', label: 'Chegirmalar', icon: BadgePercent },
  { to: '/sotuvchi/reklama', label: 'Reklama', icon: Megaphone },
  { to: '/sotuvchi/analitika', label: 'Analitika', icon: ChartNoAxesColumn },
  { to: '/sotuvchi/hamyon', label: 'Hamyon va to‘lovlar', icon: Wallet },
  { to: '/sotuvchi/sozlamalar', label: 'Sozlamalar', icon: Settings },
]
