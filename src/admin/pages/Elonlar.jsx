import { useMemo, useState } from 'react'
import { CheckCircle2, Eye, Megaphone, Pause, XCircle } from 'lucide-react'
import { campaignDetail, listCampaigns, reviewCampaign, useAdminList } from '../api'
import { dmyhm, maskPhone, som } from '../format'
import Modal from '../components/Modal'
import {
  Btn, DataTable, Empty, FilterTabs, MigrateBanner, MobileCards,
  PageHeader, Pagination, RowActions, SearchRow, StatusDot, TableCard,
} from '../components/ui'

const STATUS = {
  moderatsiyada: { label: 'Moderatsiyada', tone: 'teal' },
  faol: { label: 'Faol', tone: 'teal' },
  toxtatilgan: { label: 'To‘xtatilgan', tone: 'gray' },
  yakunlangan: { label: 'Yakunlangan', tone: 'gray' },
}

export default function Elonlar() {
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [detail, setDetail] = useState(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState('')

  const { loading, error, needsMigration, rows, total, counts, reload } = useAdminList(
    () => listCampaigns({ tab, q, page, pageSize }),
    [tab, q, page, pageSize],
  )
  const tabs = useMemo(() => [
    { id: 'all', label: 'Barchasi', count: counts.all },
    { id: 'moderatsiyada', label: 'Moderatsiyada', count: counts.moderatsiyada },
    { id: 'faol', label: 'Faol', count: counts.faol },
    { id: 'toxtatilgan', label: 'To‘xtatilgan', count: counts.toxtatilgan },
    { id: 'yakunlangan', label: 'Yakunlangan', count: counts.yakunlangan },
  ], [counts])

  async function open(id) {
    try { setDetail(await campaignDetail(id)); setReason(''); setMsg('') }
    catch (e) { setMsg(e.message) }
  }
  async function act(id, action) {
    if (action === 'reject' && reason.trim().length < 3) { setMsg('Rad etish sababini yozing.'); return }
    setBusy(id)
    try {
      await reviewCampaign(id, action, reason)
      setMsg('Saqlandi.'); setDetail(null); reload()
    } catch (e) { setMsg(e.message) }
    finally { setBusy('') }
  }

  return (
    <div>
      <PageHeader title="Reklama kampaniyalari" subtitle="Sotuvchilarning pullik reklama kampaniyalari" />
      <MigrateBanner show={needsMigration} />
      {msg && <p role="status" className="mt-3 rounded-xl bg-[#eef8f6] px-3 py-2 text-[13px]">{msg}</p>}
      <FilterTabs tabs={tabs} value={tab} onChange={(v) => { setTab(v); setPage(1) }} />
      <SearchRow value={q} onChange={(v) => { setQ(v); setPage(1) }} placeholder="E’lon nomi yoki do‘kon bo‘yicha..." onFilter={() => {}} />
      {loading && <p className="mt-6 text-[#5C6E80]">Yuklanmoqda…</p>}
      {error && !needsMigration && <p role="alert" className="mt-6 text-[#b42318]">{error}</p>}

      <MobileCards rows={rows} render={(r) => (
        <button type="button" className="flex w-full gap-3 text-left" onClick={() => open(r.id)}>
          {r.image_url ? <img src={r.image_url} alt="" className="size-14 rounded-lg object-cover" /> : <span className="grid size-14 place-items-center rounded-lg bg-[#F0FDFA] text-[#0F766E]"><Megaphone className="size-5" /></span>}
          <div className="min-w-0 flex-1">
            <div className="font-semibold">{r.title}</div>
            <div className="text-[12px] text-[#5C6E80]">{r.shop_name} · {som(r.daily_budget)}/kun</div>
          </div>
          <StatusDot tone={STATUS[r.status]?.tone || 'gray'}>{STATUS[r.status]?.label}</StatusDot>
        </button>
      )} />

      <TableCard className="hidden lg:block">
        <DataTable head={['#', 'E’lon', 'Do‘kon', 'Shahar', 'Byudjet', 'Kunlar', 'Holat', 'Sana', 'Amallar']}>
          {rows.map((r, i) => (
            <tr key={r.id} className="border-t border-[#EEF3F4]">
              <td className="px-3 py-3 text-[#8A9AA8]">{(page - 1) * pageSize + i + 1}</td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  {r.image_url ? <img src={r.image_url} alt="" className="size-9 rounded-lg object-cover" /> : <span className="grid size-9 place-items-center rounded-lg bg-[#F0FDFA]"><Megaphone className="size-4 text-[#0F766E]" /></span>}
                  <span className="font-semibold">{r.title}</span>
                </div>
              </td>
              <td className="px-3 py-3">{r.shop_name}</td>
              <td className="px-3 py-3">{r.city || '—'}</td>
              <td className="px-3 py-3 font-semibold text-[#0F766E]">{som(r.daily_budget)}</td>
              <td className="px-3 py-3">{r.days} kun</td>
              <td className="px-3 py-3"><StatusDot tone={STATUS[r.status]?.tone || 'gray'}>{STATUS[r.status]?.label}</StatusDot></td>
              <td className="px-3 py-3">{dmyhm(r.created_at)}</td>
              <td className="px-3 py-3">
                <RowActions>
                  <Btn onClick={() => open(r.id)}><Eye className="size-3.5" /> Ko‘rish</Btn>
                  {r.status === 'moderatsiyada' && (
                    <>
                      <Btn tone="primary" disabled={busy === r.id} onClick={() => act(r.id, 'approve')}><CheckCircle2 className="size-3.5" /> Tasdiqlash</Btn>
                      <Btn disabled={busy === r.id} onClick={() => { setReason('Talabga mos emas'); act(r.id, 'reject') }}><XCircle className="size-3.5" /> Rad etish</Btn>
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

      <Modal open={!!detail} onClose={() => setDetail(null)} title="E’lon tafsilotlari" sheet
        headerIcon={<Megaphone className="size-5" />} width="max-w-[640px]"
        footer={detail && (
          <div className="flex flex-wrap gap-2">
            {detail.status === 'moderatsiyada' && (
              <>
                <Btn tone="primary" disabled={busy === detail.id} onClick={() => act(detail.id, 'approve')}><CheckCircle2 className="size-4" /> Tasdiqlash</Btn>
                <Btn tone="danger" disabled={busy === detail.id} onClick={() => act(detail.id, 'reject')}><XCircle className="size-4" /> Rad etish</Btn>
              </>
            )}
            {detail.status === 'faol' && <Btn disabled={busy === detail.id} onClick={() => act(detail.id, 'pause')}><Pause className="size-4" /> To‘xtatish</Btn>}
            <Btn onClick={() => setDetail(null)}>Yopish</Btn>
          </div>
        )}
      >
        {detail && (
          <div className="space-y-4">
            {detail.image_url && <img src={detail.image_url} alt="" className="h-40 w-full rounded-xl object-cover" />}
            <h3 className="text-[18px] font-extrabold">{detail.title}</h3>
            <StatusDot tone={STATUS[detail.status]?.tone || 'gray'}>{STATUS[detail.status]?.label}</StatusDot>
            <p className="text-[13px] text-[#3D4E5F]">{detail.description || 'Tavsif yo‘q'}</p>
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              <div><div className="text-[#8A9AA8]">Do‘kon</div><div className="font-semibold">{detail.seller?.shop_name || detail.seller?.name}</div></div>
              <div><div className="text-[#8A9AA8]">Telefon</div><div className="font-semibold">{maskPhone(detail.seller?.phone)}</div></div>
              <div><div className="text-[#8A9AA8]">Kunlik byudjet</div><div className="font-semibold text-[#0F766E]">{som(detail.daily_budget)}</div></div>
              <div><div className="text-[#8A9AA8]">Davomiylik</div><div className="font-semibold">{detail.days} kun</div></div>
            </div>
            {detail.product && (
              <div className="flex items-center gap-3 rounded-xl border border-[#E6EEF0] p-3">
                {detail.product.image_url && <img src={detail.product.image_url} alt="" className="size-12 rounded-lg object-cover" />}
                <div>
                  <div className="font-semibold">{detail.product.name}</div>
                  <div className="text-[12px] text-[#0F766E]">{som(detail.product.price)}</div>
                </div>
              </div>
            )}
            {detail.status === 'moderatsiyada' && (
              <label className="block text-[13px]">
                <span className="mb-1 block font-semibold">Rad etish sababi</span>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="w-full rounded-xl border border-[#E6EEF0] px-3 py-2" />
              </label>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
