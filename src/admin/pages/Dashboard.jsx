import { useState } from 'react'
import { useAdminDashboard } from '../api'
import {
  KpiRow, MidRow, OrdersAndPending, PageHead, StatsAndComplaints,
} from '../components/dashboard/Desktop'
import {
  MobileCategories, MobileChart, MobileHead, MobileKpis, MobileLists,
} from '../components/dashboard/Mobile'
import SellerApplicationModal from '../components/dashboard/SellerApplicationModal'
import SalesDetailModal from '../components/dashboard/SalesDetailModal'

export default function Dashboard() {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const { loading, error, data, needsMigration, reload } = useAdminDashboard(month)
  const [sellerId, setSellerId] = useState(null)
  const [salesOpen, setSalesOpen] = useState(false)

  return (
    <div>
      {/* desktop */}
      <div className="hidden lg:block">
        <PageHead month={month} onPick={setMonth} />
        {needsMigration && <Banner error={error} />}
        {loading && !needsMigration && <p className="mt-8 text-center text-[#5C6E80]">Yuklanmoqda…</p>}
        {error && !needsMigration && <p role="alert" className="mt-4 rounded-xl bg-[#FEF2F2] px-4 py-3 text-[14px] text-[#b42318]">{error}</p>}
        {!loading && (
          <>
            <KpiRow data={data} />
            <MidRow data={data} month={month} onPick={setMonth} />
            <OrdersAndPending data={data} onOpenSeller={setSellerId} />
            <StatsAndComplaints data={data} />
          </>
        )}
      </div>

      {/* mobile */}
      <div className="lg:hidden">
        <MobileHead month={month} onPick={setMonth} />
        {needsMigration && <Banner error={error} />}
        {loading && !needsMigration && <p className="mt-8 text-center text-[#5C6E80]">Yuklanmoqda…</p>}
        {error && !needsMigration && <p role="alert" className="mt-4 rounded-xl bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#b42318]">{error}</p>}
        {!loading && (
          <>
            <MobileKpis data={data} onOpenSales={() => setSalesOpen(true)} />
            <MobileChart data={data} month={month} />
            <MobileCategories data={data} />
            <MobileLists data={data} />
          </>
        )}
      </div>

      <SellerApplicationModal id={sellerId} onClose={() => setSellerId(null)} onDone={reload} />
      <SalesDetailModal open={salesOpen} onClose={() => setSalesOpen(false)} data={data} month={month} onPick={setMonth} />
    </div>
  )
}

function Banner({ error }) {
  return (
    <div role="status" className="mt-4 rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-[13.5px] leading-relaxed text-[#92400E]">
      <strong className="font-bold">Migratsiya kerak.</strong>{' '}
      {error || 'supabase/migrations/0011_admin_dashboard.sql ni Supabase SQL editorida qo‘llang, so‘ng sahifani yangilang.'}
    </div>
  )
}
