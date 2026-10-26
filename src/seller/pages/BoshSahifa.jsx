import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { computeStats, monthStats, popularProducts, useSellerData } from '../api'
import { useMobile } from '../../useMobile'
import { Greeting, StatCards, RecentOrders, LowStock, RecentReviews, SalesActivity, InfoCards } from '../components/bosh-sahifa/Desktop'
import { Welcome, PeriodBar, MobileStats, MobileQuick, MobileOrders, Popular } from '../components/bosh-sahifa/Mobile'

export const LOW_STOCK_LIMIT = 10

export default function BoshSahifa() {
  const { shop, openQuick, openOrder } = useOutletContext()
  const data = useSellerData()
  const mobile = useMobile()
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const stats = useMemo(() => computeStats(data), [data])
  const lowStock = useMemo(() => data.products.filter((p) => p.status !== 'archived' && p.stock <= LOW_STOCK_LIMIT).sort((a, b) => a.stock - b.stock).slice(0, 5), [data.products])

  if (data.loading) return <div className="grid h-[60vh] place-items-center text-[15px] font-semibold text-[#0F766E]">Yuklanmoqda…</div>

  const banner = data.error ? <div className="mb-4 rounded-xl border border-[#CCFBF1] bg-[#F0FDFA] px-4 py-3 text-[13.5px] font-medium text-[#115E59]">{data.error}</div> : null

  if (mobile) {
    return (
      <div>
        {banner}
        <Welcome shop={shop} />
        <PeriodBar month={month} setMonth={setMonth} />
        <MobileStats s={monthStats(data.orders, month)} />
        <MobileQuick openQuick={openQuick} />
        <MobileOrders orders={data.orders.slice(0, 4)} onOpen={openOrder} />
        <Popular products={popularProducts(data.orders, data.products)} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      {banner}
      <Greeting shop={shop} openQuick={openQuick} />
      <div className="mt-6"><StatCards stats={stats} /></div>
      <div className="mt-4 grid grid-cols-[1.65fr_1fr] gap-4">
        <RecentOrders orders={data.orders.slice(0, 5)} onOpen={openOrder} />
        <LowStock products={lowStock} />
      </div>
      <div className="mt-4 grid grid-cols-[1.05fr_0.6fr_0.78fr] gap-4">
        <RecentReviews reviews={data.reviews.slice(0, 3)} products={data.products} />
        <SalesActivity stats={stats} />
        <InfoCards />
      </div>
    </div>
  )
}
