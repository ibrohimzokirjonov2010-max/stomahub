import { useMemo, useState } from 'react'
import { EyeOff, Eye, Trash2 } from 'lucide-react'
import { listContent, moderateContent, useAdminList } from '../api'
import { dmyhm, num } from '../format'
import ConfirmReason from '../components/ConfirmReason'
import {
  Btn, DataTable, Empty, FilterTabs, MigrateBanner, MobileCards, PageHeader, Pagination, RowActions, SearchRow, StatusDot, TableCard,
} from '../components/ui'

// StomaHub Market official kinds (Forma, Jihozlar, Marketplace) are intentionally NOT here.
export const MOD_KINDS = [
  ['ad', 'E’lonlar'], ['surplus', 'Ortiqcha materiallar'], ['post', 'Hamjamiyat postlari'], ['master', 'Ustalar'],
  ['book', 'Kitoblar'], ['course', 'Kurslar'], ['job', 'Vakansiyalar'], ['channel', 'Kanallar'], ['seminar', 'Seminarlar'],
]

export default function Moderatsiya() {
  const [kind, setKind] = useState('ad')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [pick, setPick] = useState(null) // { row, action }
  const [msg, setMsg] = useState('')
  const { loading, error, needsMigration, rows, total, reload } = useAdminList(
    () => listContent({ kind, q, page, pageSize }), [kind, q, page, pageSize],
  )
  const tabs = useMemo(() => MOD_KINDS.map(([id, label]) => ({ id, label })), [])
  const unhide = async (r) => {
    try { await moderateContent(kind, r.id, 'unhide'); setMsg('Qayta ko‘rsatildi.'); reload() } catch (e) { setMsg(e.message) }
  }
  const actions = (r) => (
    <RowActions>
      {r.hidden
        ? <Btn onClick={() => unhide(r)}><Eye className="size-3.5" /> Ko‘rsatish</Btn>
        : <Btn onClick={() => setPick({ row: r, action: 'hide' })}><EyeOff className="size-3.5" /> Yashirish</Btn>}
      <Btn tone="ghost" onClick={() => setPick({ row: r, action: 'delete' })}><Trash2 className="size-3.5" /> O‘chirish</Btn>
    </RowActions>
  )
  return (
    <div>
      <PageHeader title="Kontent moderatsiyasi" subtitle="Foydalanuvchi kontentini yashirish yoki tasdiq bilan o‘chirish" />
      <MigrateBanner show={needsMigration} />
      {msg && <p role="status" className="mt-3 rounded-xl bg-[#eef8f6] px-3 py-2 text-[13px]">{msg}</p>}
      <FilterTabs tabs={tabs} value={kind} onChange={(v) => { setKind(v); setPage(1) }} />
      <SearchRow value={q} onChange={(v) => { setQ(v); setPage(1) }} placeholder="Sarlavha yoki muallif bo‘yicha..." onFilter={() => {}} />
      {loading && <p className="mt-6 text-[#5C6E80]">Yuklanmoqda…</p>}
      {error && !needsMigration && <p role="alert" className="mt-6 text-[#b42318]">{error}</p>}
      <MobileCards rows={rows} render={(r) => (
        <div className="space-y-2">
          <div className="font-semibold">{r.title}</div>
          <div className="text-[12px] text-[#5C6E80]">{r.owner} · {typeof r.at === "string" ? dmyhm(r.at) : "—"}</div>
          <StatusDot tone={r.hidden ? 'gray' : 'teal'}>{r.hidden ? 'Yashirilgan' : 'Ko‘rinadi'}</StatusDot>
          {actions(r)}
        </div>
      )} />
      <TableCard className="hidden lg:block">
        <DataTable head={['#', 'Sarlavha', 'Muallif', 'Sana', 'Holat', 'Amallar']}>
          {rows.map((r, i) => (
            <tr key={r.id} className="border-t border-[#EEF3F4]">
              <td className="px-3 py-3 text-[#8A9AA8]">{(page - 1) * pageSize + i + 1}</td>
              <td className="px-3 py-3 font-semibold">{r.title}</td>
              <td className="px-3 py-3">{r.owner}</td>
              <td className="px-3 py-3">{typeof r.at === "string" ? dmyhm(r.at) : "—"}</td>
              <td className="px-3 py-3"><StatusDot tone={r.hidden ? 'gray' : 'teal'}>{r.hidden ? 'Yashirilgan' : 'Ko‘rinadi'}</StatusDot></td>
              <td className="px-3 py-3">{actions(r)}</td>
            </tr>
          ))}
          {!loading && !rows.length && <tr><td colSpan={6}><Empty /></td></tr>}
        </DataTable>
      </TableCard>
      <p className="mt-2 text-[12px] text-[#8A9AA8]">Jami: {num(total)}</p>
      <Pagination page={page} pageSize={pageSize} total={total} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1) }} />
      <ConfirmReason open={!!pick} danger={pick?.action === 'delete'}
        title={pick?.action === 'delete' ? 'O‘chirishni tasdiqlang' : 'Yashirish'}
        confirmLabel={pick?.action === 'delete' ? 'Butunlay o‘chirish' : 'Yashirish'}
        text={pick ? (pick.action === 'delete'
          ? `“${pick.row.title}” butunlay o‘chiriladi. Bu amalni qaytarib bo‘lmaydi.`
          : `“${pick.row.title}” ommaga ko‘rinmaydi (muallif va admin ko‘radi).`) : ''}
        onClose={() => setPick(null)}
        onConfirm={async (reason) => { await moderateContent(kind, pick.row.id, pick.action, reason); setMsg(pick.action === 'delete' ? 'O‘chirildi.' : 'Yashirildi.'); reload() }} />
    </div>
  )
}
