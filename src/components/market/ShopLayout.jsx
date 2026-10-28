import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Header from '../Header'
import ShopSidebar from './ShopSidebar'
import MobileTabBar from '../mobile/MobileTabBar'
import { useMobile } from '../../useMobile'

export default function ShopLayout({ active, placeholder, search, onQuery, children }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const mobile = useMobile()

  useEffect(() => {
    setMenuOpen(false)
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="min-h-screen bg-[#f7fafd] lg:pl-[280px]">
      <Header variant="shop" search={search} placeholder={placeholder} onQuery={onQuery} onMenu={() => setMenuOpen(true)} />
      <div className="flex">
        <ShopSidebar flush active={active} open={menuOpen} onClose={() => setMenuOpen(false)} />
        <main className={`min-w-0 flex-1 px-4 lg:pl-4 lg:pr-[18px] ${mobile ? 'pb-[96px]' : 'pb-6'}`}>{children}</main>
      </div>
      {mobile && <MobileTabBar />}
    </div>
  )
}
