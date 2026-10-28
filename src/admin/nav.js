import {
  LayoutDashboard, Users, Store, GraduationCap, Megaphone, ShoppingBag,
  Coins, BadgeCheck, Wallet, CircleHelp, ChartNoAxesColumn, Settings, PackageCheck, ShieldAlert,
} from 'lucide-react'

export const ADMIN_NAV = [
  { to: '/admin', label: 'Boshqaruv paneli', icon: LayoutDashboard, end: true },
  { to: '/admin/foydalanuvchilar', label: 'Foydalanuvchilar', icon: Users },
  { to: '/admin/sotuvchilar', label: 'Sotuvchilar', icon: Store },
  { to: '/admin/tasdiqlashlar', label: 'Tasdiqlashlar va arizalar', icon: BadgeCheck },
  { to: '/admin/mahsulotlar', label: 'Mahsulotlarni tasdiqlash', icon: PackageCheck },
  { to: '/admin/tashkilotchilar', label: 'Seminar tashkilotchilari', icon: GraduationCap },
  { to: '/admin/elonlar', label: 'Reklama kampaniyalari', icon: Megaphone },
  { to: '/admin/moderatsiya', label: 'Kontent moderatsiyasi', icon: ShieldAlert },
  { to: '/admin/buyurtmalar', label: 'Buyurtmalar', icon: ShoppingBag },
  { to: '/admin/escrow', label: 'Escrow va pul aylanmasi', icon: Coins },
  { to: '/admin/moliya', label: 'Moliya va komissiya', icon: Wallet },
  { to: '/admin/shikoyatlar', label: 'Shikoyatlar', icon: CircleHelp },
  { to: '/admin/hisobotlar', label: 'Hisobotlar', icon: ChartNoAxesColumn },
  { to: '/admin/sozlamalar', label: 'Sozlamalar', icon: Settings },
]

/** Mobil pastki menyu — dizayndagi 5 ta asosiy bo‘lim */
export const ADMIN_MOBILE_TAB = [
  { to: '/admin', label: 'Boshqaruv', icon: LayoutDashboard, end: true },
  { to: '/admin/foydalanuvchilar', label: 'Foydalanuvchilar', icon: Users },
  { to: '/admin/buyurtmalar', label: 'Buyurtmalar', icon: ShoppingBag },
  { to: '/admin/hisobotlar', label: 'Hisobotlar', icon: ChartNoAxesColumn },
  { to: '/admin/sozlamalar', label: 'Sozlamalar', icon: Settings },
]
