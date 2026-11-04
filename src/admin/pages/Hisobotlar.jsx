import { friendlyError } from '../../lib/friendlyError'
import { useEffect, useState } from 'react'
import { BarChart } from '../components/Chart'
import { fetchReports } from '../api'
import { daysInMonth, monthBounds, num, som } from '../format'
import MonthPicker, { TestToggle } from '../components/MonthPicker'
import { KpiStrip, MigrateBanner, PageHeader, card } from '../components/ui'

export default function Hisobotlar() {
  const [month, setMonth] = useState(() => new Date())
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [needsMigration, setNeeds] = useState(false)
  const [loading, setLoading] = useState(true)
  const [noTest, setNoTest] = useState(false)

  useEffect(() => {
    setLoading(true)
    const { from, to } = monthBounds(month)
    fetchReports(from, to, noTest)
      .then((d) => { setData(d); setError(''); setNeeds(false) })
      .catch((e) => {
        const rawmsg = e?.message || String(e)
        const msg = friendlyError(e)
        setError(msg)
        setNeeds(/admin_reports|Could not find|PGRST/i.test(rawmsg))
        setData(null)
      })
      .finally(() => setLoading(false))
  }, [month, noTest])

  const n = daysInMonth(month)
  const byDay = Array.from({ length: n }, () => 0)
  ;(data?.daily || []).forEach((d) => { if (d.day >= 1 && d.day <= n) byDay[d.day - 1] = Number(d.sum) || 0 })
  const labels = byDay.map((_, i) => String(i + 1))

  return (
    <div>
      <PageHeader
        title="Hisobotlar"
        subtitle="Savdo, komissiya va foydalanuvchi o‘sishi bo‘yicha hisobotlar"
        actions={<div className="flex flex-wrap gap-2"><TestToggle value={noTest} onChange={setNoTest} /><MonthPicker value={month} onChange={setMonth} /></div>}
      />
      <MigrateBanner show={needsMigration} />
      {loading && <p className="mt-6 text-[#5C6E80]">Yuklanmoqda…</p>}
      {error && !needsMigration && <p role="alert" className="mt-6 text-[#b42318]">{error}</p>}

      <KpiStrip items={[
        { label: 'Aylanma (yetkazilgan)', value: som(data?.turnover), active: true, sub: data?.turnover_in_progress ? `Jarayonda: ${som(data.turnover_in_progress)}` : undefined },
        { label: `Komissiya ${Math.round(Number(data?.commission_pct ?? 12))}% (yetkazilgan)`, value: som(data?.commission) },
        { label: 'Buyurtmalar', value: num(data?.orders), sub: data?.orders_delivered != null ? `Yetkazilgan ${num(data.orders_delivered)} · jarayonda ${num(data.orders_in_progress)} · bekor ${num(data.orders_cancelled)}` : undefined },
        { label: 'Yangi foydalanuvchilar', value: num(data?.users_new) },
      ]} />

      <div className={`${card} mt-4 p-4`}>
        <h3 className="mb-3 text-[15px] font-bold">Kunlik savdo (yetkazilgan buyurtmalar)</h3>
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
      {(data?.test_accounts?.length > 0 || data?.duplicates?.length > 0) && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className={`${card} p-4`}>
            <h3 className="mb-1 text-[15px] font-bold">Test akkauntlar ({num(data.test_accounts?.length || 0)})</h3>
            <p className="mb-3 text-[12px] text-[#8A9AA8]">O‘chirilmaydi. “Test akkauntlarsiz” yoqilsa hisobotdan chiqariladi.</p>
            <ul className="max-h-72 space-y-1.5 overflow-auto text-[13px]">
              {(data.test_accounts || []).map((t) => (
                <li key={t.id} className="flex justify-between gap-2">
                  <span className="min-w-0 truncate font-semibold">{t.name}</span>
                  <span className="truncate text-[#5C6E80]">{t.email}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className={`${card} p-4`}>
            <h3 className="mb-1 text-[15px] font-bold">Takroriy ismlar ({num(data.duplicates?.length || 0)})</h3>
            <p className="mb-3 text-[12px] text-[#8A9AA8]">Bir xil ism bilan bir nechta akkaunt — tekshirib chiqing.</p>
            <ul className="max-h-72 space-y-2 overflow-auto text-[13px]">
              {(data.duplicates || []).map((d) => (
                <li key={d.name}>
                  <div className="font-semibold capitalize">{d.name} <span className="text-[#5C6E80]">× {num(d.count)}</span></div>
                  <div className="truncate text-[12px] text-[#5C6E80]">{(d.emails || []).filter(Boolean).join(', ')}</div>
                </li>
              ))}
              {!data.duplicates?.length && <p className="py-4 text-center text-[#8A9AA8]">Ma’lumot yo‘q</p>}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
