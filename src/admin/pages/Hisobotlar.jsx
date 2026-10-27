import { useEffect, useState } from 'react'
import { CalendarDays, ChevronDown } from 'lucide-react'
import { BarChart } from '../components/Chart'
import { fetchReports } from '../api'
import { daysInMonth, monthBounds, monthTitle, num, som } from '../format'
import { KpiStrip, MigrateBanner, PageHeader, card } from '../components/ui'

export default function Hisobotlar() {
  const [month, setMonth] = useState(() => new Date())
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [needsMigration, setNeeds] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const { from, to } = monthBounds(month)
    fetchReports(from, to)
      .then((d) => { setData(d); setError(''); setNeeds(false) })
      .catch((e) => {
        const msg = e?.message || String(e)
        setError(msg)
        setNeeds(/admin_reports|Could not find|PGRST/i.test(msg))
        setData(null)
      })
      .finally(() => setLoading(false))
  }, [month])

  const n = daysInMonth(month)
  const byDay = Array.from({ length: n }, () => 0)
  ;(data?.daily || []).forEach((d) => { if (d.day >= 1 && d.day <= n) byDay[d.day - 1] = Number(d.sum) || 0 })
  const labels = byDay.map((_, i) => String(i + 1))

  return (
    <div>
      <PageHeader
        title="Hisobotlar"
        subtitle="Savdo, komissiya va foydalanuvchi o‘sishi bo‘yicha hisobotlar"
        actions={
          <label className="relative inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#E6EEF0] bg-white px-3 text-[13.5px] font-semibold">
            <CalendarDays className="size-4 text-[#0F766E]" />
            {monthTitle(month)}
            <ChevronDown className="size-4 text-[#5C6E80]" />
            <input type="month" className="absolute inset-0 cursor-pointer opacity-0"
              value={`${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split('-').map(Number)
                if (y && m) setMonth(new Date(y, m - 1, 1))
              }}
            />
          </label>
        }
      />
      <MigrateBanner show={needsMigration} />
      {loading && <p className="mt-6 text-[#5C6E80]">Yuklanmoqda…</p>}
      {error && !needsMigration && <p role="alert" className="mt-6 text-[#b42318]">{error}</p>}

      <KpiStrip items={[
        { label: 'Aylanma', value: som(data?.turnover), active: true },
        { label: 'Komissiya 12%', value: som(data?.commission) },
        { label: 'Buyurtmalar', value: num(data?.orders) },
        { label: 'Yangi foydalanuvchilar', value: num(data?.users_new) },
      ]} />

      <div className={`${card} mt-4 p-4`}>
        <h3 className="mb-3 text-[15px] font-bold">Kunlik savdo</h3>
        <BarChart values={byDay} labels={labels} height={220} tipFmt={(v) => som(v)} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className={`${card} p-4`}>
          <h3 className="mb-3 text-[15px] font-bold">Top sotuvchilar</h3>
          <ul className="space-y-2">
            {(data?.top_sellers || []).map((s, i) => (
              <li key={s.shop} className="flex items-center justify-between gap-2 text-[13px]">
                <span className="text-[#8A9AA8] w-5">{i + 1}</span>
                <span className="min-w-0 flex-1 font-semibold truncate">{s.shop}</span>
                <span className="text-[#5C6E80]">{num(s.orders)} ta</span>
                <span className="font-bold text-[#0F766E]">{som(s.sum)}</span>
              </li>
            ))}
            {!data?.top_sellers?.length && <p className="py-6 text-center text-[#8A9AA8]">Ma’lumot yo‘q</p>}
          </ul>
        </div>
        <div className={`${card} p-4`}>
          <h3 className="mb-3 text-[15px] font-bold">Kategoriyalar</h3>
          <ul className="space-y-2">
            {(data?.categories || []).map((c, i) => (
              <li key={c.name} className="flex items-center justify-between gap-2 text-[13px]">
                <span className="text-[#8A9AA8] w-5">{i + 1}</span>
                <span className="min-w-0 flex-1 font-semibold truncate">{c.name}</span>
                <span className="text-[#5C6E80]">{num(c.orders)} ta</span>
                <span className="font-bold text-[#0F766E]">{som(c.sum)}</span>
              </li>
            ))}
            {!data?.categories?.length && <p className="py-6 text-center text-[#8A9AA8]">Ma’lumot yo‘q</p>}
          </ul>
        </div>
      </div>
    </div>
  )
}
