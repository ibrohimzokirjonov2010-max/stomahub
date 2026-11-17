import { useState } from 'react'
import { CheckCircle2, Eye, XCircle } from 'lucide-react'
import { friendlyError } from '../../lib/friendlyError'
import { supabase } from '../../supabaseClient'
import { useAdminList } from '../api'
import { dmyhm, num } from '../format'
import ConfirmReason from '../components/ConfirmReason'
import { Btn, DataTable, Empty, MigrateBanner, MobileCards, PageHeader, RowActions, StatusDot, TableCard } from '../components/ui'

async function call(name, args) {
  if (!supabase) throw new Error('Supabase sozlanmagan')
  const { data, error } = await supabase.rpc(name, args || {})
  if (error) throw error
  if (data && data.ok === false) throw new Error(data.error || 'Amal bajarilmadi')
  return data
}

const money = (n) => (Number(n) ? `${num(n)} so‘m` : 'Bepul')

// 0078: muallif yuborgan kurslar. Tasdiqlansa katalogda chiqadi, rad etilsa sabab muallifga ko‘rinadi.
export default function KursModeratsiya() {
  const [pick, setPick] = useState(null)
  const [msg, setMsg] = useState('')
  const { loading, error, needsMigration, rows, reload } = useAdminList(async () => {
    const list = await call('course_review_queue')
    return { rows: Array.isArray(list) ? list : [], total: Array.isArray(list) ? list.length : 0 }
  }, [])

  const approve = async (r) => {
    try { await call('course_moderate', { p_course_id: r.id, p_action: 'approve', p_note: '' }); setMsg(`“${r.title}” nashr qilindi.`); reload() } catch (e) { setMsg(friendlyError(e)) }
  }
  const actions = (r) => (
    <RowActions>
      <Btn onClick={() => window.open(`/talim/${r.id}`, '_blank', 'noopener')}><Eye className="size-3.5" /> Ko‘rish</Btn>
      <Btn tone="primary" onClick={() => approve(r)}><CheckCircle2 className="size-3.5" /> Tasdiqlash</Btn>
      <Btn tone="ghost" onClick={() => setPick(r)}><XCircle className="size-3.5" /> Qaytarish</Btn>
    </RowActions>
  )
  return (
    <div>
      <PageHeader title="Kurs moderatsiyasi" subtitle="Mualliflar yuborgan onlayn kurslar. Tasdiqlangan kurs Ta’lim katalogida chiqadi." />
      <MigrateBanner show={needsMigration} file="0078_course_author_cabinet.sql" />
      {msg && <p role="status" className="mt-3 rounded-xl bg-[#eef8f6] px-3 py-2 text-[13px]">{msg}</p>}
      {loading && <p className="mt-6 text-[#5C6E80]">Yuklanmoqda…</p>}
      {error && !needsMigration && <p role="alert" className="mt-6 text-[#b42318]">{error}</p>}
      <MobileCards rows={rows} render={(r) => (
        <div className="space-y-2">
          <div className="font-semibold">{r.title}</div>
          <div className="text-[12px] text-[#5C6E80]">{r.author} · {r.lessons} dars · {money(r.price)} · {r.submittedAt ? dmyhm(r.submittedAt) : '—'}</div>
          {actions(r)}
        </div>
      )} />
      <TableCard className="mt-3 hidden lg:block">
        <DataTable head={['Kurs', 'Muallif', 'Darslar', 'Narx', 'Yuborilgan', 'Holat', 'Amallar']}>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-[#EEF3F4]">
              <td className="px-3 py-3"><b>{r.title}</b>{r.subtitle ? <div className="text-[12px] text-[#5C6E80]">{r.subtitle}</div> : null}</td>
              <td className="px-3 py-3">{r.author}</td>
              <td className="px-3 py-3">{r.lessons}</td>
              <td className="px-3 py-3">{money(r.price)}</td>
              <td className="px-3 py-3">{r.submittedAt ? dmyhm(r.submittedAt) : '—'}</td>
              <td className="px-3 py-3"><StatusDot tone="orange">Moderatsiyada</StatusDot></td>
              <td className="px-3 py-3">{actions(r)}</td>
            </tr>
          ))}
          {!loading && !rows.length && <tr><td colSpan={7}><Empty text="Navbatda kurs yo‘q" /></td></tr>}
        </DataTable>
      </TableCard>
      <ConfirmReason open={!!pick} title="Kursni qaytarish" confirmLabel="Qaytarish" reasonLabel="Muallifga izoh"
        placeholder="Nimani tuzatish kerak (kamida 3 belgi)"
        text={pick ? `“${pick.title}” qoralamaga qaytadi. Izohingiz muallif kabinetida ko‘rinadi.` : ''}
        onClose={() => setPick(null)}
        onConfirm={async (reason) => { await call('course_moderate', { p_course_id: pick.id, p_action: 'reject', p_note: reason }); setMsg('Kurs muallifga qaytarildi.'); reload() }} />
    </div>
  )
}
