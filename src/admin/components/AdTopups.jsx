import { friendlyError } from '../../lib/friendlyError'
import { useMemo, useState } from 'react'
import { CheckCircle2, Eye, Megaphone, XCircle } from 'lucide-react'
import { listAdTopups, reviewAdTopup, useAdminList } from '../api'
import { dmyhm, maskPhone, som } from '../format'
import Modal from './Modal'
import { Btn, DataTable, Empty, FilterTabs, MigrateBanner, MobileCards, Pagination, RowActions, StatusDot, TableCard } from './ui'

const STATUS = {
  kutilmoqda: { label: 'Kutilmoqda', tone: 'orange' },
  tasdiqlandi: { label: 'Tasdiqlangan', tone: 'teal' },
  rad_etildi: { label: 'Rad etildi', tone: 'red' },
}
const METHOD = { naqd: 'Naqd', bank: 'Bank o‘tkazma', click: 'Click' }

/** Moliya → Reklama balansi so‘rovlari. Faqat tasdiqlangan so‘rov balansga qo‘shiladi. */
export default function AdTopups() {
  const [tab, setTab] = useState('kutilmoqda')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [pick, setPick] = useState(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState('')
  const { loading, error, needsMigration, rows, total, counts, reload } = useAdminList(
    () => listAdTopups({ status: tab, page, pageSize }), [tab, page, pageSize])
  const tabs = useMemo(() => [
    { id: 'kutilmoqda', label: 'Kutilmoqda', count: counts.kutilmoqda },
    { id: 'tasdiqlandi', label: 'Tasdiqlangan', count: counts.tasdiqlandi },
    { id: 'rad_etildi', label: 'Rad etilgan', count: counts.rad_etildi },
    { id: 'all', label: 'Barchasi', count: counts.all },
  ], [counts])

  async function act(r, action, why = '') {
    if (action === 'reject' && why.trim().length < 3) { setMsg('Rad etish sababini yozing.'); return }
    setBusy(r.id)
    try {
      await reviewAdTopup(r.id, action, why.trim())
      setMsg(action === 'confirm' ? `${som(r.amount)} reklama balansiga qo‘shildi.` : 'So‘rov rad etildi.')
      setPick(null); setReason(''); reload()
    } catch (e) { setMsg(friendlyError(e)) }
    finally { setBusy('') }
  }
  const actions = (r, big) => r.status === 'kutilmoqda' && <>
    <Btn tone="primary" disabled={busy === r.id} onClick={() => act(r, 'confirm')}><CheckCircle2 className={big ? 'size-4' : 'size-3.5'} /> Pul tushdi — tasdiqlash</Btn>
    {!big && <Btn disabled={busy === r.id} onClick={() => { setReason(''); setPick(r) }}><XCircle className="size-3.5" /> Rad etish</Btn>}
  </>

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div><h2 className="flex items-center gap-2 text-[18px] font-extrabold text-[#10283F]"><Megaphone className="size-5 text-[#0F766E]" />Reklama balansi so‘rovlari</h2>
          <p className="text-[12.5px] text-[#5C6E80]">Naqd yoki bank orqali to‘lov tushganini tekshirib tasdiqlang. Tasdiqlangan summa sotuvchining reklama balansiga qo‘shiladi.</p></div>
        {Number(counts.pending_sum) > 0 && <div className="rounded-xl bg-[#FFF7ED] px-3 py-1.5 text-[12.5px] text-[#9A3412]">Kutilayotgan jami: <b>{som(counts.pending_sum)}</b></div>}
      </div>
      <MigrateBanner show={needsMigration} />
      {msg && <p role="status" className="mt-3 rounded-xl bg-[#eef8f6] px-3 py-2 text-[13px]">{msg}</p>}
      <FilterTabs tabs={tabs} value={tab} onChange={(v) => { setTab(v); setPage(1) }} />
      {loading && <p className="mt-4 text-[#5C6E80]">Yuklanmoqda…</p>}
      {error && !needsMigration && <p role="alert" className="mt-4 text-[#b42318]">{error}</p>}
      <MobileCards rows={rows} render={(r) => (
        <div className="space-y-2">
          <button type="button" className="flex w-full items-start justify-between gap-2 text-left" onClick={() => { setReason(''); setPick(r) }}>
            <div className="min-w-0"><div className="font-semibold">{r.shop_name}</div><div className="text-[12px] text-[#5C6E80]">{METHOD[r.method] || r.method} · {dmyhm(r.created_at)}</div></div>
            <div className="text-right"><div className="font-extrabold text-[#0F766E]">{som(r.amount)}</div><StatusDot tone={STATUS[r.status]?.tone}>{STATUS[r.status]?.label}</StatusDot></div>
          </button>
          {r.status === 'kutilmoqda' && <div className="flex flex-wrap gap-2">{actions(r)}</div>}
        </div>
      )} />
      <TableCard className="hidden lg:block">
        <DataTable head={['#', 'Do‘kon', 'Summa', 'Usul', 'Chek', 'Joriy balans', 'Holat', 'Sana', 'Amallar']}>
          {rows.map((r, i) => (
            <tr key={r.id} className="border-t border-[#EEF3F4]">
              <td className="px-3 py-3 text-[#8A9AA8]">{(page - 1) * pageSize + i + 1}</td>
              <td className="px-3 py-3"><div className="font-semibold">{r.shop_name}</div><div className="text-[12px] text-[#8A9AA8]">{maskPhone(r.phone)}</div></td>
              <td className="px-3 py-3 font-extrabold text-[#0F766E]">{som(r.amount)}</td>
              <td className="px-3 py-3">{METHOD[r.method] || r.method}</td>
              <td className="px-3 py-3">{r.receipt_url ? <a href={r.receipt_url} target="_blank" rel="noreferrer" className="text-[#0F766E] underline">Ko‘rish</a> : '—'}</td>
              <td className="px-3 py-3">{som(r.balance || 0)}</td>
              <td className="px-3 py-3"><StatusDot tone={STATUS[r.status]?.tone}>{STATUS[r.status]?.label}</StatusDot>{r.reject_reason && <div className="max-w-[160px] truncate text-[11.5px] text-[#8A9AA8]" title={r.reject_reason}>{r.reject_reason}</div>}</td>
              <td className="px-3 py-3">{dmyhm(r.created_at)}</td>
              <td className="px-3 py-3"><RowActions><Btn onClick={() => { setReason(''); setPick(r) }}><Eye className="size-3.5" /></Btn>{actions(r)}</RowActions></td>
            </tr>
          ))}
          {!loading && !rows.length && <tr><td colSpan={9}><Empty /></td></tr>}
        </DataTable>
      </TableCard>
      <Pagination page={page} pageSize={pageSize} total={total} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1) }} />

      <Modal open={!!pick} onClose={() => setPick(null)} title="Reklama balansi so‘rovi" sheet width="max-w-[480px]"
        footer={pick && <div className="flex flex-wrap gap-2">{pick.status === 'kutilmoqda' && <>{actions(pick, true)}<Btn tone="danger" disabled={busy === pick.id} onClick={() => act(pick, 'reject', reason)}><XCircle className="size-4" /> Rad etish</Btn></>}<Btn onClick={() => setPick(null)}>Yopish</Btn></div>}>
        {pick && <div className="space-y-2 text-[13px]">
          <div className="text-[22px] font-extrabold text-[#0F766E]">{som(pick.amount)}</div>
          <div><span className="text-[#8A9AA8]">Do‘kon:</span> {pick.shop_name} {pick.city ? `(${pick.city})` : ''}</div>
          <div><span className="text-[#8A9AA8]">Telefon:</span> {maskPhone(pick.phone)}</div>
          <div><span className="text-[#8A9AA8]">Usul:</span> {METHOD[pick.method] || pick.method}</div>
          <div><span className="text-[#8A9AA8]">Izoh:</span> {pick.note || '—'}</div>
          <div><span className="text-[#8A9AA8]">Joriy reklama balansi:</span> {som(pick.balance || 0)}</div>
          {pick.receipt_url && <a href={pick.receipt_url} target="_blank" rel="noreferrer"><img src={pick.receipt_url} alt="To‘lov cheki" className="mt-1 max-h-56 rounded-xl border border-[#E6EEF0] object-contain" /></a>}
          {pick.status === 'kutilmoqda' && <label className="block pt-1"><span className="mb-1 block font-semibold">Rad etish sababi</span>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} maxLength={300} placeholder="Masalan: to‘lov tushmadi" className="w-full rounded-xl border border-[#E6EEF0] px-3 py-2" /></label>}
          {pick.reject_reason && <div className="text-[#b42318]">Sabab: {pick.reject_reason}</div>}
        </div>}
      </Modal>
    </section>
  )
}
