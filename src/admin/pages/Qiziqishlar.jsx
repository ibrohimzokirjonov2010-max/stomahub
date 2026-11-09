import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { isMissingFn } from '../api'
import { friendlyError } from '../../lib/friendlyError'
import { Empty, MigrateBanner, PageHeader, TableCard } from '../components/ui'

const DAYS = [7, 30, 90]
const fmt = (iso) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
const list = (a) => (Array.isArray(a) && a.length ? a.join(', ') : '—')

/** Sotuv jamoasi uchun: mijozlar nimani qidirayapti, ko‘rayapti va sotib olayapti (0058 admin_interest_summary). */
export default function Qiziqishlar() {
  const [days, setDays] = useState(30)
  const [data, setData] = useState(null)
  const [state, setState] = useState({ loading: true, error: '', missing: false })
  useEffect(() => {
    let stop = false
    setState({ loading: true, error: '', missing: false })
    Promise.resolve(supabase ? supabase.rpc('admin_interest_summary', { p_days: days }) : { error: new Error('Supabase sozlanmagan') })
      .then(({ data: d, error }) => {
        if (stop) return
        if (error) setState({ loading: false, error: isMissingFn(error) ? '' : friendlyError(error), missing: isMissingFn(error) })
        else { setData(d || {}); setState({ loading: false, error: '', missing: false }) }
      })
    return () => { stop = true }
  }, [days])
  const users = data?.users || []
  const zero = data?.zero_searches || []
  return (
    <div>
      <PageHeader title="Mijozlar qiziqishi" subtitle="Qidiruvlar, ko‘rilgan va sotib olingan mahsulotlar — faqat ichki foydalanish uchun, sotuvchilarga berilmaydi"
        actions={<div className="flex gap-1.5">{DAYS.map((d) => <button key={d} type="button" onClick={() => setDays(d)} className={`h-9 rounded-lg px-3 text-[13px] font-semibold ${days === d ? 'bg-[#0F766E] text-white' : 'bg-white text-[#10283F] ring-1 ring-[#e3eeec]'}`}>{d} kun</button>)}</div>} />
      <MigrateBanner show={state.missing} file="0058_user_interest.sql" />
      {state.error && <p role="alert" className="mt-3 rounded-xl bg-[#fff4f4] px-3 py-2 text-[13px] text-[#b42318]">{state.error}</p>}

      <h2 className="mt-5 text-[16px] font-bold text-[#10283F]">Topilmagan qidiruvlar</h2>
      <TableCard>
        {state.loading ? <Empty text="Yuklanmoqda…" /> : !zero.length ? <Empty text="Natijasiz qidiruvlar yo‘q" /> : (
          <div className="max-w-full overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-[13px]">
              <thead className="bg-[#F7FAFA] text-[12px] text-[#5C6E80]"><tr><th className="px-3 py-2">So‘rov</th><th className="px-3 py-2">Necha marta</th><th className="px-3 py-2">Foydalanuvchilar</th><th className="px-3 py-2">Oxirgi marta</th></tr></thead>
              <tbody>{zero.map((z) => <tr key={z.term} className="border-t border-[#eef3f3]"><td className="px-3 py-2 font-semibold text-[#10283F]">{z.term}</td><td className="px-3 py-2">{z.count}</td><td className="px-3 py-2">{z.users}</td><td className="px-3 py-2">{fmt(z.last_at)}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </TableCard>

      <h2 className="mt-5 text-[16px] font-bold text-[#10283F]">Mijozlar</h2>
      <TableCard>
        {state.loading ? <Empty text="Yuklanmoqda…" /> : !users.length ? <Empty text="Hozircha ma’lumot yo‘q" /> : (
          <div className="max-w-full overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-[13px]">
              <thead className="bg-[#F7FAFA] text-[12px] text-[#5C6E80]"><tr><th className="px-3 py-2">Mijoz</th><th className="px-3 py-2">Yo‘nalish</th><th className="px-3 py-2">Kategoriyalar</th><th className="px-3 py-2">Ko‘p ko‘rgan mahsulotlar</th><th className="px-3 py-2">Qidiruvlar</th><th className="px-3 py-2">Xaridlar</th><th className="px-3 py-2">Oxirgi faollik</th></tr></thead>
              <tbody>{users.map((u) => (
                <tr key={u.user_id} className="border-t border-[#eef3f3] align-top">
                  <td className="px-3 py-2"><p className="font-semibold text-[#10283F]">{u.name || '—'}</p><p className="text-[12px] text-[#5C6E80]">{u.phone || ''}</p></td>
                  <td className="px-3 py-2">{u.specialty || '—'}</td>
                  <td className="px-3 py-2">{list(u.top_categories)}</td>
                  <td className="px-3 py-2">{(u.top_products || []).length ? (u.top_products || []).map((p) => <p key={p.product_id}>{p.name || 'Mahsulot'} <span className="text-[#5C6E80]">· {p.views} ko‘rish{p.carts ? ` · ${p.carts} savat` : ''}</span></p>) : '—'}</td>
                  <td className="px-3 py-2">{list(u.top_searches)}</td>
                  <td className="px-3 py-2">{u.purchases || 0}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{fmt(u.last_at)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </TableCard>
    </div>
  )
}
