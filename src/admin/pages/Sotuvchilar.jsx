import { useMemo, useState } from 'react'
import { Ban, CheckCircle2, Eye, Plus, Store } from 'lucide-react'
import { listSellers, reviewSeller, useAdminList } from '../api'
import { dmyhm, maskPhone, num } from '../format'
import Modal from '../components/Modal'
import SellerApplicationModal from '../components/dashboard/SellerApplicationModal'
import {
  Avatar, Btn, DataTable, Empty, FilterTabs, MigrateBanner, MobileCards,
  PageHeader, Pagination, RowActions, SearchRow, StatusDot, TableCard,
} from '../components/ui'

const STATUS = {
  approved: { label: 'Tasdiqlangan', tone: 'teal' },
  pending: { label: 'Kutilmoqda', tone: 'gray' },
  rejected: { label: 'Rad etilgan', tone: 'gray' },
  blocked: { label: 'Bloklangan', tone: 'red' },
  none: { label: '—', tone: 'gray' },
}

export default function Sotuvchilar() {
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sellerId, setSellerId] = useState(null)
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState('')

  const { loading, error, needsMigration, rows, total, counts, reload } = useAdminList(
    () => listSellers({ tab, q, page, pageSize }),
    [tab, q, page, pageSize],
  )

  const tabs = useMemo(() => [
    { id: 'all', label: 'Barchasi', count: counts.all },
    { id: 'approved', label: 'Tasdiqlangan', count: counts.approved },
    { id: 'pending', label: 'Kutilmoqda', count: counts.pending },
    { id: 'rejected', label: 'Rad etilgan', count: counts.rejected },
  ], [counts])

  async function act(id, action, reason = '') {
    setBusy(id)
    try {
      await reviewSeller(id, action, reason)
      setMsg(action === 'approve' ? 'Tasdiqlandi.' : action === 'reject' ? 'Rad etildi.' : 'Bloklandi.')
      setSellerId(null)
      reload()
    } catch (e) { setMsg(e.message) }
    finally { setBusy('') }
  }

  return (
    <div>
      <PageHeader title="Sotuvchilar" subtitle="Platformadagi barcha sotuvchilar ro‘yxati va ularni boshqarish"
        actions={<Btn tone="primary"><Plus className="size-4" /> Yangi sotuvchi</Btn>} />
      <MigrateBanner show={needsMigration} />
      {msg && <p role="status" className="mt-3 rounded-xl bg-[#eef8f6] px-3 py-2 text-[13px]">{msg}</p>}
      <FilterTabs tabs={tabs} value={tab} onChange={(v) => { setTab(v); setPage(1) }} />
      <SearchRow value={q} onChange={(v) => { setQ(v); setPage(1) }} placeholder="Do‘kon nomi, shahar yoki telefon bo‘yicha..." onFilter={() => {}} />
      {loading && <p className="mt-6 text-[#5C6E80]">Yuklanmoqda…</p>}
      {error && !needsMigration && <p role="alert" className="mt-6 text-[#b42318]">{error}</p>}

      <MobileCards rows={rows} render={(r) => (
        <button type="button" className="flex w-full items-center gap-3 text-left" onClick={() => setSellerId(r.id)}>
          <Avatar name={r.shop_name || r.name} src={r.avatar} />
          <div className="min-w-0 flex-1">
            <div className="font-semibold">{r.shop_name || r.name}</div>
            <div className="text-[12px] text-[#5C6E80]">{r.name} · {r.city || '—'} · {num(r.products_count)} mahsulot</div>
          </div>
          <StatusDot tone={STATUS[r.seller_status]?.tone || 'gray'}>{STATUS[r.seller_status]?.label || r.seller_status}</StatusDot>
        </button>
      )} />

      <TableCard className="hidden lg:block">
        <DataTable head={['#', 'Do‘kon nomi', 'Sotuvchi', 'Shahar', 'Tasdiqlash holati', 'Hujjatlar', 'Mahsulotlar', 'Telefon raqam', 'Amallar']}>
          {rows.map((r, i) => (
            <tr key={r.id} className="border-t border-[#EEF3F4]">
              <td className="px-3 py-3 text-[#8A9AA8]">{(page - 1) * pageSize + i + 1}</td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-lg bg-[#F0FDFA] text-[#0F766E]"><Store className="size-4" /></span>
                  <span className="font-semibold">{r.shop_name || '—'}</span>
                </div>
              </td>
              <td className="px-3 py-3">{r.name}</td>
              <td className="px-3 py-3">{r.city || '—'}</td>
              <td className="px-3 py-3"><StatusDot tone={STATUS[r.seller_status]?.tone || 'gray'}>{STATUS[r.seller_status]?.label || r.seller_status}</StatusDot></td>
              <td className="px-3 py-3">{num(r.docs_count)} ta</td>
              <td className="px-3 py-3">{num(r.products_count)}</td>
              <td className="px-3 py-3">{maskPhone(r.phone)}</td>
              <td className="px-3 py-3">
                <RowActions>
                  <Btn onClick={() => setSellerId(r.id)}><Eye className="size-3.5" /> Ko‘rish</Btn>
                  {r.seller_status === 'pending' && (
                    <>
                      <Btn tone="primary" disabled={busy === r.id} onClick={() => act(r.id, 'approve')}><CheckCircle2 className="size-3.5" /> Tasdiqlash</Btn>
                      <Btn tone="ghost" disabled={busy === r.id} onClick={() => act(r.id, 'block', 'Admin blokladi')}><Ban className="size-3.5" /> Bloklash</Btn>
                    </>
                  )}
                </RowActions>
              </td>
            </tr>
          ))}
          {!loading && !rows.length && <tr><td colSpan={9}><Empty /></td></tr>}
        </DataTable>
      </TableCard>
      <Pagination page={page} pageSize={pageSize} total={total} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1) }} />

      <SellerApplicationModal
        id={sellerId}
        onClose={() => setSellerId(null)}
        onDone={() => { setMsg('Yangilandi.'); reload() }}
      />
    </div>
  )
}
