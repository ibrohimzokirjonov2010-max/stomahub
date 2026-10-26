import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Header from '../Header'
import ShopSidebar from './ShopSidebar'

export default function ShopLayout({ active, placeholder, search, onQuery, children }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    setMenuOpen(false)
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="min-h-screen bg-[#f7fafd] lg:pl-[280px]">
      <Header variant="shop" search={search} placeholder={placeholder} onQuery={onQuery} onMenu={() => setMenuOpen(true)} />
      <div className="flex">
        <ShopSidebar flush active={active} open={menuOpen} onClose={() => setMenuOpen(false)} />
        <main className="min-w-0 flex-1 px-4 pb-6 lg:pl-4 lg:pr-[18px]">{children}</main>
      </div>
    </div>
  )
}
