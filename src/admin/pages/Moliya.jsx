import { friendlyError } from '../../lib/friendlyError'
import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Eye, Wallet, XCircle } from 'lucide-react'
import { fetchFinance, listPayouts, reviewPayout, useAdminList } from '../api'
import { dmyhm, maskPhone, monthBounds, num, payLabel, som } from '../format'
import Modal from '../components/Modal'
import AdTopups from '../components/AdTopups'
import MonthPicker, { TestToggle } from '../components/MonthPicker'
import {
  Btn, DataTable, Empty, FilterTabs, KpiStrip, MigrateBanner, MobileCards,
  PageHeader, Pagination, RowActions, SearchRow, StatusDot, TableCard,
} from '../components/ui'

const STATUS = {
  kutilmoqda: { label: 'Kutilmoqda', tone: 'teal' },
  tolandi: { label: 'To‘landi', tone: 'teal' },
  rad_etildi: { label: 'Rad etildi', tone: 'red' },
}

function Card({ label, value, sub }) {
  return (
    <div className="rounded-2xl border border-[#E6EEF0] bg-white p-3.5">
      <div className="text-[12.5px] font-medium text-[#5C6E80]">{label}</div>
      <div className="mt-1 text-[18px] font-extrabold text-[#10283F]">{value}</div>
      {sub && <div className="text-[11.5px] text-[#8A9AA8]">{sub}</div>}
    </div>
  )
}

export default function Moliya() {
  const [month, setMonth] = useState(() => new Date())
  const [noTest, setNoTest] = useState(false)
  const [finance, setFinance] = useState(null)
  const [finErr, setFinErr] = useState('')
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [busy, setBusy] = useState('')
  const [reason, setReason] = useState('')
  const [pick, setPick] = useState(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const { from, to } = monthBounds(month)
    setFinErr('')
    fetchFinance(from, to, noTest).then(setFinance).catch((e) => setFinErr(friendlyError(e)))
  }, [month, noTest])

  const pct = Math.round(Number(finance?.commission_pct ?? (finance?.commission_rate != null ? finance.commission_rate * 100 : 12)))
  const { loading, error, needsMigration, rows, total, counts, reload } = useAdminList(
    () => listPayouts({ tab, q, page, pageSize }),
    [tab, q, page, pageSize],
  )

  const tabs = useMemo(() => [
    { id: 'all', label: 'Barchasi', count: counts.all },
    { id: 'kutilmoqda', label: 'Kutilmoqda', count: counts.kutilmoqda },
    { id: 'tolandi', label: 'To‘landi', count: counts.tolandi },
    { id: 'rad_etildi', label: 'Rad etildi', count: counts.rad_etildi },
  ], [counts])

  async function act(id, action) {
    if (action === 'reject' && reason.trim().length < 3) { setMsg('Rad etish sababini yozing.'); return }
    setBusy(id)
    try {
      await reviewPayout(id, action, reason)
      setMsg(action === 'approve' ? 'To‘lov tasdiqlandi.' : 'Rad etildi.')
      setPick(null); reload()
    } catch (e) { setMsg(friendlyError(e)) }
    finally { setBusy('') }
  }

  return (
    <div>
      <PageHeader title="Moliya va komissiya" subtitle="Aylanma va komissiya faqat yetkazilgan buyurtmalardan hisoblanadi"
        actions={<div className="flex flex-wrap gap-2"><TestToggle value={noTest} onChange={setNoTest} /><MonthPicker value={month} onChange={setMonth} /></div>} />
      <MigrateBanner show={needsMigration || /admin_finance|admin_payouts/i.test(finErr)} />
      {msg && <p role="status" className="mt-3 rounded-xl bg-[#eef8f6] px-3 py-2 text-[13px]">{msg}</p>}
      <KpiStrip items={[
        { label: 'Aylanma (yetkazilgan)', value: som(finance?.turnover), active: true, icon: Wallet, sub: finance?.turnover_in_progress ? `Jarayonda: ${som(finance.turnover_in_progress)}` : undefined },
        { label: `Komissiya ${pct}% (yetkazilgan)`, value: som(finance?.commission) },
        { label: 'Sotuvchilarga to‘lash kerak', value: som(finance?.seller_payable ?? finance?.payout) },
        { label: 'Kutilayotgan to‘lovlar', value: som(finance?.seller_payable ?? finance?.payouts_pending), sub: finance?.payouts_requested != null ? `So‘rov: ${som(finance.payouts_requested)}` : undefined },
      ]} />
      {finance && finance.seminar_revenue != null && (
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Card label="Seminar tushumi" value={som(finance.seminar_revenue)} sub={`${num(finance.seminar_paid_count)} ta to‘langan chipta`} />
          <Card label={`Tashkilotchi komissiyasi ${pct}%`} value={som(finance.seminar_commission)} sub="Seminar tushumidan" />
          <Card label="Naqd — kutilmoqda" value={som(finance.cash_pending)} sub={`${num(finance.cash_pending_orders)} ta buyurtma · escrow emas`} />
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(finance?.by_method || []).map((m) => (
          <Card key={m.method} label={payLabel(m.method)} value={som(m.sum)}
            sub={`${num(m.count)} ta buyurtma${m.cancelled ? ` · ${num(m.cancelled)} bekor` : ''}${m.demo ? ` · ${num(m.demo)} demo` : ''}`} />
        ))}
      </div>
      {finance?.orders_count != null && (
        <p className="mt-2 text-[12px] text-[#5C6E80]">
          Jami {num(finance.orders_count)} ta buyurtma = usullar bo‘yicha {num((finance.by_method || []).reduce((a, m) => a + Number(m.count || 0), 0))} ta
          {finance.orders_delivered != null ? ` · yetkazilgan ${num(finance.orders_delivered)}, jarayonda ${num(finance.orders_in_progress)}, bekor ${num(finance.orders_cancelled)}` : ''}.
        </p>
      )}

      <h2 className="mt-6 text-[16px] font-bold">To‘lov so‘rovlari</h2>
      <FilterTabs tabs={tabs} value={tab} onChange={(v) => { setTab(v); setPage(1) }} />
      <SearchRow value={q} onChange={(v) => { setQ(v); setPage(1) }} placeholder="Do‘kon nomi bo‘yicha..." onFilter={() => {}} />
      {loading && <p className="mt-6 text-[#5C6E80]">Yuklanmoqda…</p>}
      {error && !needsMigration && <p role="alert" className="mt-6 text-[#b42318]">{error}</p>}

      <MobileCards rows={rows} render={(r) => (
        <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => { setPick(r); setReason('') }}>
          <div>
            <div className="font-semibold">{r.shop_name}</div>
            <div className="text-[12px] text-[#5C6E80]">{payLabel(r.method)} · {dmyhm(r.created_at)}</div>
          </div>
          <div className="text-right">
            <div className="font-bold text-[#0F766E]">{som(r.amount)}</div>
            <StatusDot tone={STATUS[r.status]?.tone || 'gray'}>{STATUS[r.status]?.label}</StatusDot>
          </div>
        </button>
      )} />

      <TableCard className="hidden lg:block">
        <DataTable head={['#', 'Do‘kon', 'Telefon', 'Summa', 'Usul', 'Holat', 'Sana', 'Amallar']}>
          {rows.map((r, i) => (
            <tr key={r.id} className="border-t border-[#EEF3F4]">
              <td className="px-3 py-3 text-[#8A9AA8]">{(page - 1) * pageSize + i + 1}</td>
              <td className="px-3 py-3 font-semibold">{r.shop_name}</td>
              <td className="px-3 py-3">{maskPhone(r.phone)}</td>
              <td className="px-3 py-3 font-bold text-[#0F766E]">{som(r.amount)}</td>
              <td className="px-3 py-3">{payLabel(r.method)}</td>
              <td className="px-3 py-3"><StatusDot tone={STATUS[r.status]?.tone || 'gray'}>{STATUS[r.status]?.label}</StatusDot></td>
              <td className="px-3 py-3">{dmyhm(r.created_at)}</td>
              <td className="px-3 py-3">
                <RowActions>
                  <Btn onClick={() => { setPick(r); setReason('') }}><Eye className="size-3.5" /> Ko‘rish</Btn>
                  {r.status === 'kutilmoqda' && (
                    <>
                      <Btn tone="primary" disabled={busy === r.id} onClick={() => act(r.id, 'approve')}><CheckCircle2 className="size-3.5" /> To‘lash</Btn>
                      <Btn disabled={busy === r.id} onClick={() => { setPick(r); setReason('') }}><XCircle className="size-3.5" /> Rad</Btn>
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

      <Modal open={!!pick} onClose={() => setPick(null)} title="To‘lov so‘rovi" sheet headerIcon={<Wallet className="size-5" />}
        footer={pick?.status === 'kutilmoqda' ? (
          <div className="flex flex-wrap gap-2">
            <Btn tone="primary" disabled={busy === pick.id} onClick={() => act(pick.id, 'approve')}><CheckCircle2 className="size-4" /> To‘lash</Btn>
            <Btn tone="danger" disabled={busy === pick.id} onClick={() => act(pick.id, 'reject')}><XCircle className="size-4" /> Rad etish</Btn>
            <Btn onClick={() => setPick(null)}>Yopish</Btn>
          </div>
        ) : <Btn onClick={() => setPick(null)}>Yopish</Btn>}
      >
        {pick && (
          <div className="space-y-3 text-[13px]">
            <div className="text-[22px] font-extrabold text-[#0F766E]">{som(pick.amount)}</div>
            <div><span className="text-[#8A9AA8]">Do‘kon:</span> {pick.shop_name}</div>
            <div><span className="text-[#8A9AA8]">Usul:</span> {payLabel(pick.method)}</div>
            <div><span className="text-[#8A9AA8]">Telefon:</span> {maskPhone(pick.phone)}</div>
            <div><span className="text-[#8A9AA8]">Izoh:</span> {pick.note || '—'}</div>
            {pick.status === 'kutilmoqda' && (
              <label className="block">
                <span className="mb-1 block font-semibold">Rad etish sababi</span>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="w-full rounded-xl border border-[#E6EEF0] px-3 py-2" />
              </label>
            )}
          </div>
        )}
      </Modal>
      <AdTopups />
    </div>
  )
}
