// Dev-only screenshot harness: /marketing-shot?to=/sotuvchi/marketing
// Tasdiqlangan sotuvchi sessiyasini o‘rnatadi (soxta ma'lumot yo‘q — ro'yxatlar bo‘sh), keyin sahifaga o‘tadi.
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { __shotSession } from '../sessionStore'
import { __shotSellerState } from '../seller/api'

export default function MarketingShot() {
  const nav = useNavigate()
  useEffect(() => {
    const t = setTimeout(() => {
      __shotSession?.({ user: { id: '00000000-0000-4000-8000-000000000000' }, profile: { role: 'seller', seller_status: 'approved', name: 'Do‘kon' } })
      __shotSellerState?.({ products: [], orders: [], reviews: [], payouts: [], customers: [], discounts: [], campaigns: [], adStats: [], adRequests: [], adTopups: [], staff: [], branches: [], activity: [] })
      nav(new URLSearchParams(window.location.search).get('to') || '/sotuvchi/marketing', { replace: true })
    }, 800)
    return () => clearTimeout(t)
  }, [nav])
  return null
}
