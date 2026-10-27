import { useMemo, useState } from 'react'
import { CircleHelp, Eye } from 'lucide-react'
import { listComplaints, updateComplaint, useAdminList } from '../api'
import { dmyhm, maskPhone } from '../format'
import Modal from '../components/Modal'
import {
  Btn, DataTable, Empty, FilterTabs, MigrateBanner, MobileCards,
  PageHeader, Pagination, RowActions, SearchRow, StatusDot, TableCard,
} from '../components/ui'

const STATUS = {
  yangi: { label: 'Yangi', tone: 'teal' },
  jarayonda: { label: 'Jarayonda', tone: 'blue' },
  yopildi: { label: 'Yopildi', tone: 'gray' },
}

export default function Shikoyatlar() {
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [pick, setPick] = useState(null)
  const [resolution, setResolution] = useState('')
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState('')

  const { loading, error, needsMigration, rows, total, counts, reload } = useAdminList(
    () => listComplaints({ tab, q, page, pageSize }),
    [tab, q, page, pageSize],
  )
  const tabs = useMemo(() => [
    { id: 'all', label: 'Barchasi', count: counts.all },
    { id: 'yangi', label: 'Yangi', count: counts.yangi },
    { id: 'jarayonda', label: 'Jarayonda', count: counts.jarayonda },
    { id: 'yopildi', label: 'Yopildi', count: counts.yopildi },
  ], [counts])

  async function setStatus(id, status) {
    setBusy(id)
    try {
      await updateComplaint(id, status, resolution)
      setMsg('Yangilandi.'); setPick(null); reload()
    } catch (e) { setMsg(e.message) }
    finally { setBusy('') }
  }

  return (
    <div>
      <PageHeader title="Shikoyatlar" subtitle="Foydalanuvchi shikoyatlari va ularning holati" />
      <MigrateBanner show={needsMigration} />
      {msg && <p role="status" className="mt-3 rounded-xl bg-[#eef8f6] px-3 py-2 text-[13px]">{msg}</p>}
      <FilterTabs tabs={tabs} value={tab} onChange={(v) => { setTab(v); setPage(1) }} />
      <SearchRow value={q} onChange={(v) => { setQ(v); setPage(1) }} placeholder="Kod yoki mavzu bo‘yicha..." onFilter={() => {}} />
      {loading && <p className="mt-6 text-[#5C6E80]">Yuklanmoqda…</p>}
      {error && !needsMigration && <p role="alert" className="mt-6 text-[#b42318]">{error}</p>}

      <MobileCards rows={rows} render={(r) => (
        <button type="button" className="w-full text-left" onClick={() => { setPick(r); setResolution(r.resolution || '') }}>
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-[#0F766E]">{r.code}</span>
            <StatusDot tone={STATUS[r.status]?.tone || 'gray'}>{STATUS[r.status]?.label}</StatusDot>
          </div>
          <div className="mt-1 font-semibold">{r.subject}</div>
          <div className="text-[12px] text-[#5C6E80]">{r.reporter_name || 'Anonim'} · {dmyhm(r.created_at)}</div>
        </button>
      )} />

      <TableCard className="hidden lg:block">
        <DataTable head={['#', 'Kod', 'Mavzu', 'Yuboruvchi', 'Holat', 'Sana', 'Amallar']}>
          {rows.map((r, i) => (
            <tr key={r.id} className="border-t border-[#EEF3F4]">
              <td className="px-3 py-3 text-[#8A9AA8]">{(page - 1) * pageSize + i + 1}</td>
              <td className="px-3 py-3 font-semibold text-[#0F766E]">{r.code}</td>
              <td className="px-3 py-3 font-semibold">{r.subject}</td>
              <td className="px-3 py-3">
                <div>{r.reporter_name || 'Anonim'}</div>
                <div className="text-[11.5px] text-[#8A9AA8]">{maskPhone(r.reporter_phone)}</div>
              </td>
              <td className="px-3 py-3"><StatusDot tone={STATUS[r.status]?.tone || 'gray'}>{STATUS[r.status]?.label}</StatusDot></td>
              <td className="px-3 py-3">{dmyhm(r.created_at)}</td>
              <td className="px-3 py-3">
                <RowActions>
                  <Btn onClick={() => { setPick(r); setResolution(r.resolution || '') }}><Eye className="size-3.5" /> Ko‘rish</Btn>
                </RowActions>
              </td>
            </tr>
          ))}
          {!loading && !rows.length && <tr><td colSpan={7}><Empty /></td></tr>}
        </DataTable>
      </TableCard>
      <Pagination page={page} pageSize={pageSize} total={total} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1) }} />

      <Modal open={!!pick} onClose={() => setPick(null)} title={pick ? pick.code : ''} sheet
        headerIcon={<CircleHelp className="size-5" />}
        footer={pick && (
          <div className="flex flex-wrap gap-2">
            {pick.status !== 'jarayonda' && <Btn tone="soft" disabled={busy === pick.id} onClick={() => setStatus(pick.id, 'jarayonda')}>Jarayonga olish</Btn>}
            {pick.status !== 'yopildi' && <Btn tone="primary" disabled={busy === pick.id} onClick={() => setStatus(pick.id, 'yopildi')}>Yopish</Btn>}
            <Btn onClick={() => setPick(null)}>Bekor</Btn>
          </div>
        )}
      >
        {pick && (
          <div className="space-y-3 text-[13px]">
            <h3 className="text-[16px] font-extrabold">{pick.subject}</h3>
            <StatusDot tone={STATUS[pick.status]?.tone || 'gray'}>{STATUS[pick.status]?.label}</StatusDot>
            <p className="whitespace-pre-wrap text-[#3D4E5F]">{pick.body || '—'}</p>
            <div className="text-[#5C6E80]">{pick.reporter_name || 'Anonim'} · {maskPhone(pick.reporter_phone)} · {dmyhm(pick.created_at)}</div>
            <label className="block">
              <span className="mb-1 block font-semibold">Yechim / izoh</span>
              <textarea value={resolution} onChange={(e) => setResolution(e.target.value)} rows={3} className="w-full rounded-xl border border-[#E6EEF0] px-3 py-2" />
            </label>
          </div>
        )}
      </Modal>
    </div>
  )
}
