import { Link } from 'react-router-dom'
import { CalendarDays, ChevronDown, ChevronRight } from 'lucide-react'
import Modal from '../Modal'
import { BarChart } from '../Chart'
import { PayBadge } from './StatusBadge'
import { daysInMonth, dmyhm, monthTitle, num, som } from '../../format'

export default function SalesDetailModal({ open, onClose, data, month, onPick }) {
  const n = daysInMonth(month)
  const byDay = Array.from({ length: n }, () => 0)
  ;(data.daily || []).forEach((d) => { if (d.day >= 1 && d.day <= n) byDay[d.day - 1] = d.sum })
  const labels = byDay.map((_, i) => String(i + 1))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Umumiy savdo"
      subtitle={monthTitle(month)}
      width="max-w-[720px]"
      full
      footer={null}
    >
      <div className="space-y-5">
        <div className="flex justify-end">
          <label className="relative inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-[#E6EEF0] bg-white px-3 text-[13px] font-semibold">
            <CalendarDays className="size-3.5 text-[#0F766E]" />
            {monthTitle(month)}
            <ChevronDown className="size-3.5 text-[#5C6E80]" />
            <input
              type="month"
              className="absolute inset-0 cursor-pointer opacity-0"
              value={`${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split('-').map(Number)
                if (y && m) onPick(new Date(y, m - 1, 1))
              }}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            { label: 'Jami buyurtmalar', value: `${num(data.orders_count)} ta` },
            { label: 'Umumiy savdo summasi', value: som(data.turnover) },
            { label: 'Platforma komissiyasi (12%)', value: som(data.commission) },
            { label: 'Sof summa', value: som(data.net) },
          ].map((x) => (
            <div key={x.label} className="rounded-xl border border-[#E6EEF0] bg-[#F8FBFC] p-3">
              <div className="text-[11.5px] font-medium text-[#5C6E80]">{x.label}</div>
              <div className="mt-1 text-[14px] font-extrabold leading-tight text-[#10283F]">{x.value}</div>
            </div>
          ))}
        </div>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-[#10283F]">Kategoriyalar bo‘yicha savdo</h3>
            <Link to="/admin/hisobotlar" className="inline-flex items-center text-[12.5px] font-semibold text-[#0F766E]">
              Barchasini ko‘rish <ChevronRight className="size-3.5" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-[#E6EEF0]">
            <table className="w-full text-left text-[13px]">
              <tbody>
                {(data.categories || []).map((c) => (
                  <tr key={c.name} className="border-t border-[#EEF3F4] first:border-0">
                    <td className="px-3 py-2.5 font-semibold text-[#10283F]">{c.name}</td>
                    <td className="px-3 py-2.5 text-[#5C6E80]">{num(c.orders)} buyurtma</td>
                    <td className="px-3 py-2.5 text-right font-bold text-[#0F766E]">{som(c.sum)}</td>
                  </tr>
                ))}
                {!data.categories?.length && (
                  <tr><td className="px-3 py-8 text-center text-[#8A9AA8]" colSpan={3}>Ma’lumot yo‘q</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-[15px] font-bold text-[#10283F]">Kunlik savdo ({monthTitle(month)})</h3>
          <BarChart labels={labels} values={byDay} height={210} maxTicks={8} />
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-[#10283F]">So‘nggi buyurtmalar</h3>
            <Link to="/admin/buyurtmalar" className="inline-flex items-center text-[12.5px] font-semibold text-[#0F766E]">
              Barchasini ko‘rish <ChevronRight className="size-3.5" />
            </Link>
          </div>
          <ul className="space-y-2">
            {(data.recent_orders || []).slice(0, 5).map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-[#E6EEF0] bg-[#F8FBFC] px-3 py-2.5">
                <span className="font-bold text-[#0F766E]">#{o.code}</span>
                <span className="text-[12px] text-[#8A9AA8]">{dmyhm(o.created_at)}</span>
                <span className="text-[12.5px] text-[#3D4E5F]">{o.category || '—'}</span>
                <span className="ml-auto text-[13px] font-bold">{som(o.subtotal)}</span>
                <PayBadge method={o.payment_method} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Modal>
  )
}
