import { useMemo, useState } from 'react'
import { Ban, CheckCircle2, Eye, GraduationCap, Plus, XCircle } from 'lucide-react'
import { listOrganizers, organizerDetail, reviewOrganizer, useAdminList } from '../api'
import { dmyhm, maskPhone, num } from '../format'
import Modal from '../components/Modal'
import {
  Avatar, Btn, DataTable, Empty, FilterTabs, MigrateBanner, MobileCards,
  PageHeader, Pagination, RowActions, SearchRow, StatusDot, TableCard,
} from '../components/ui'
import ConfirmReason from '../components/ConfirmReason'

const STATUS = {
  approved: { label: 'Tasdiqlangan', tone: 'teal' },
  pending: { label: 'Kutilmoqda', tone: 'gray' },
  registered: { label: 'Ro‘yxatdan o‘tgan (ariza yo‘q)', tone: 'gray' },
  rejected: { label: 'Rad etilgan', tone: 'gray' },
  blocked: { label: 'Bloklangan', tone: 'red' },
  none: { label: '—', tone: 'gray' },
}

export default function Tashkilotchilar() {
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [detail, setDetail] = useState(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState('')
  const [blockRow, setBlockRow] = useState(null)

  const { loading, error, needsMigration, rows, total, counts, reload } = useAdminList(
    () => listOrganizers({ tab, q, page, pageSize }),
    [tab, q, page, pageSize],
  )
  const tabs = useMemo(() => [
    { id: 'all', label: 'Barchasi', count: counts.all },
    { id: 'approved', label: 'Tasdiqlangan', count: counts.approved },
    { id: 'pending', label: 'Kutilmoqda', count: counts.pending },
    { id: 'registered', label: 'Ro‘yxatdan o‘tgan', count: counts.registered },
    { id: 'rejected', label: 'Rad etilgan', count: counts.rejected },
    { id: 'blocked', label: 'Bloklangan', count: counts.blocked },
  ], [counts])

  async function open(id) {
    try { setDetail(await organizerDetail(id)); setReason(''); setMsg('') }
    catch (e) { setMsg(e.message) }
  }
  async function act(id, action) {
    if ((action === 'reject' || action === 'block') && reason.trim().length < 3) {
      setMsg('Sababni yozing (kamida 3 belgi).'); return
    }
    setBusy(id)
    try {
      await reviewOrganizer(id, action, reason)
      setMsg('Saqlandi.')
      setDetail(null)
      reload()
    } catch (e) { setMsg(e.message) }
    finally { setBusy('') }
  }

  return (
    <div>
      <PageHeader title="Seminar tashkilotchilari" subtitle="Platformadagi barcha seminar tashkilotchilari" />
      <MigrateBanner show={needsMigration} />
      <ConfirmReason open={!!blockRow} title="Tashkilotchini bloklash" danger confirmLabel="Bloklash" reasonLabel="Bloklash sababi"
        text={blockRow ? `${blockRow.name} bloklanadi: seminarlari ommaga ko‘rinmaydi va ro‘yxatdan o‘tish yopiladi.` : ''}
        onClose={() => setBlockRow(null)}
        onConfirm={async (r) => { await reviewOrganizer(blockRow.id, 'block', r); setMsg('Bloklandi.'); setDetail(null); reload() }} />
      {msg && <p role="status" className="mt-3 rounded-xl bg-[#eef8f6] px-3 py-2 text-[13px]">{msg}</p>}
      <FilterTabs tabs={tabs} value={tab} onChange={(v) => { setTab(v); setPage(1) }} />
      <SearchRow value={q} onChange={(v) => { setQ(v); setPage(1) }} placeholder="Ism, shahar yoki telefon bo‘yicha..." onFilter={() => {}} />
      {loading && <p className="mt-6 text-[#5C6E80]">Yuklanmoqda…</p>}
      {error && !needsMigration && <p role="alert" className="mt-6 text-[#b42318]">{error}</p>}

      <MobileCards rows={rows} render={(r) => (
        <button type="button" className="flex w-full items-center gap-3 text-left" onClick={() => open(r.id)}>
          <Avatar name={r.name} src={r.avatar} />
          <div className="min-w-0 flex-1">
            <div className="font-semibold">{r.name}</div>
            <div className="text-[12px] text-[#5C6E80]">{r.city || '—'} · {num(r.seminars_count)} seminar</div>
          </div>
          <StatusDot tone={STATUS[r.org_status]?.tone || 'gray'}>{STATUS[r.org_status]?.label}</StatusDot>
        </button>
      )} />

      <TableCard className="hidden lg:block">
        <DataTable head={['#', 'Tashkilotchi', 'Shahar', 'Seminarlar', 'Holat', 'Telefon', 'Ro‘yxatdan o‘tgan', 'Amallar']}>
          {rows.map((r, i) => (
            <tr key={r.id} className="border-t border-[#EEF3F4]">
              <td className="px-3 py-3 text-[#8A9AA8]">{(page - 1) * pageSize + i + 1}</td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  <Avatar name={r.name} src={r.avatar} size="sm" />
                  <span className="font-semibold">{r.name}</span>
                </div>
              </td>
              <td className="px-3 py-3">{r.city || '—'}</td>
              <td className="px-3 py-3">{num(r.seminars_count)}</td>
              <td className="px-3 py-3"><StatusDot tone={STATUS[r.org_status]?.tone || 'gray'}>{STATUS[r.org_status]?.label}</StatusDot></td>
              <td className="px-3 py-3">{maskPhone(r.phone)}</td>
              <td className="px-3 py-3">{dmyhm(r.created_at)}</td>
              <td className="px-3 py-3">
                <RowActions>
                  <Btn onClick={() => open(r.id)}><Eye className="size-3.5" /> Ko‘rish</Btn>
                  {r.org_status === 'pending' && (
                    <>
                      <Btn tone="primary" disabled={busy === r.id} onClick={() => act(r.id, 'approve')}><CheckCircle2 className="size-3.5" /> Tasdiqlash</Btn>
                      <Btn disabled={busy === r.id} onClick={() => { setReason('Talablar mos emas'); act(r.id, 'reject') }}><XCircle className="size-3.5" /> Rad etish</Btn>
                    </>
                  )}
                </RowActions>
              </td>
            </tr>
          ))}
          {!loading && !rows.length && <tr><td colSpan={8}><Empty /></td></tr>}
        </DataTable>
      </TableCard>
      <Pagination page={page} pageSize={pageSize} total={total} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1) }} />

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Tashkilotchi ma’lumotlari" sheet
        headerIcon={<GraduationCap className="size-5" />} width="max-w-[640px]"
        footer={detail && (
          <div className="flex flex-wrap gap-2">
            {detail.org_status === 'pending' && (
              <>
                <Btn tone="primary" disabled={busy === detail.id} onClick={() => act(detail.id, 'approve')}><CheckCircle2 className="size-4" /> Tasdiqlash</Btn>
                <Btn tone="danger" disabled={busy === detail.id} onClick={() => act(detail.id, 'reject')}><XCircle className="size-4" /> Rad etish</Btn>
              </>
            )}
            <Btn tone="ghost" disabled={busy === detail.id} onClick={() => setBlockRow(detail)}><Ban className="size-4" /> Bloklash</Btn>
            <Btn onClick={() => setDetail(null)}>Yopish</Btn>
          </div>
        )}
      >
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar name={detail.name} src={detail.avatar} size="lg" />
              <div>
                <h3 className="text-[18px] font-extrabold">{detail.name}</h3>
                <p className="text-[13px] text-[#5C6E80]">{detail.city || '—'} · {maskPhone(detail.phone)}</p>
                <StatusDot tone={STATUS[detail.org_status]?.tone || 'gray'}>{STATUS[detail.org_status]?.label}</StatusDot>
              </div>
            </div>
            <p className="text-[13px] text-[#3D4E5F]">{detail.about || 'Tavsif yo‘q'}</p>
            <label className="block text-[13px]">
              <span className="mb-1 block font-semibold">Rad / blok sababi</span>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="w-full rounded-xl border border-[#E6EEF0] px-3 py-2" />
            </label>
            <div>
              <h4 className="mb-2 text-[14px] font-bold">Seminarlar</h4>
              <ul className="space-y-2">
                {(detail.seminars || []).map((s) => (
                  <li key={s.id} className="rounded-xl border border-[#E6EEF0] px-3 py-2 text-[13px]">
                    <div className="font-semibold">{s.title}</div>
                    <div className="text-[#5C6E80]">{s.city} · {s.start_date} · {s.sold}/{s.seats} · {s.status}</div>
                  </li>
                ))}
                {!detail.seminars?.length && <Empty text="Seminar yo‘q" />}
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
