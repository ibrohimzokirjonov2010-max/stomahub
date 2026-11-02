import { friendlyError } from '../../lib/friendlyError'
import { useEffect, useState } from 'react'
import { Coins, Eye, Banknote, Undo2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { clickReversal, fetchEscrow, markRefundedManual, orderDetail, paymentConfig, refundEscrow, releaseEscrow, useAdminList } from '../api'
import { DISPUTE_STATUS, dmyhm, isCash, maskPhone, num, ORDER_STATUS, payLabel, payStatusLabel, REFUND_METHOD, som } from '../format'
import Modal from '../components/Modal'
import {
  Btn, DataTable, Empty, FilterTabs, KpiStrip, MigrateBanner, MobileCards,
  PageHeader, Pagination, SearchRow, StatusDot, TableCard,
} from '../components/ui'

const TABS = [
  { id: 'all', label: 'Barchasi' },
  { id: 'held', label: 'Escrowda' },
  { id: 'dispute', label: 'Nizolar' },
  { id: 'refund', label: 'Qaytarish kutilmoqda' },
  { id: 'released', label: 'Sotuvchiga o‘tkazilgan' },
  { id: 'cash', label: 'Naqd' },
]
const PS_TONE = { held: 'blue', paid: 'blue', released: 'teal', refund_pending: 'orange', refunded: 'gray', failed: 'gray', pending: 'gray' }

function PayCell({ r }) {
  return (
    <div>
      <StatusDot tone={PS_TONE[r.payment_status] || 'gray'}>{payStatusLabel(r.payment_status, r.payment_method)}</StatusDot>
      {r.dispute_status === 'open' && <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#B91C1C]"><AlertTriangle className="size-3" /> Nizo ochiq</div>}
    </div>
  )
}

export default function Escrow() {
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [detail, setDetail] = useState(null)
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [reason, setReason] = useState('')
  const [cfg, setCfg] = useState(null)
  const [tick, setTick] = useState(0)

  useEffect(() => { paymentConfig().then(setCfg).catch(() => setCfg(null)) }, [])

  const { loading, error, needsMigration, rows, total, extra } = useAdminList(
    () => fetchEscrow({ q, page, pageSize, tab }),
    [q, page, pageSize, tab, tick],
  )
  const s = extra.summary || {}

  const load = async (row) => {
    let od = {}
    try { od = (await orderDetail(row.id)) || {} } catch { od = {} }
    // ro‘yxat qatori escrow/nizo maydonlariga ega; tafsilot — mahsulotlar va do‘kon
    return { ...od, ...row, items: od.items || row.items, seller: od.seller }
  }
  const openDetail = async (row) => { setErr(''); setOk(''); setReason(''); setDetail(await load(row)) }
  const refreshDetail = async (patch) => { setTick((n) => n + 1); setDetail((d) => (d ? { ...d, ...patch } : d)) }

  const run = async (kind, fn, msg) => {
    setBusy(kind); setErr(''); setOk('')
    try {
      const r = await fn()
      setOk(msg)
      await refreshDetail(r && typeof r === 'object' ? { payment_status: r.payment_status || detail.payment_status } : {})
    } catch (e) {
      setErr(friendlyError(e, 'Amalni bajarib bo‘lmadi'))
    } finally {
      setBusy('')
    }
  }

  const d = detail
  const online = d && !isCash(d.payment_method)
  const canRelease = online && ['held', 'paid'].includes(d.payment_status)
  const canRefund = online && ['held', 'paid'].includes(d.payment_status)
  const refundPending = online && d.payment_status === 'refund_pending'
  const clickAuto = refundPending && d.payment_method === 'click' && cfg?.click?.reversal

  return (
    <div>
      <PageHeader title="Escrow va pul aylanmasi" subtitle="Onlayn to‘lovlar xaridor “Qabul qildim” bosguncha yoki avtomatik muddatgacha ushlab turiladi" />
      <MigrateBanner show={needsMigration} file="0042_real_escrow.sql" />
      <KpiStrip items={[
        { label: 'Escrowda', value: som(s.held), sub: `${num(s.orders_held)} ta buyurtma`, active: true, icon: Coins },
        { label: 'Ochiq nizolar', value: num(s.disputes_open), sub: 'Admin qarori kutilmoqda' },
        { label: 'Qaytarish kutilmoqda', value: som(s.refund_pending), sub: `${num(s.refund_pending_orders)} ta buyurtma` },
        { label: 'Sotuvchilarga to‘lanadi', value: som(s.seller_payable), sub: 'Chiqarilgan, bankka o‘tkazilmagan' },
        { label: 'Komissiya (12%)', value: som(s.commission), sub: 'Chiqarilgan + naqd yetkazilgan' },
      ]} />
      <FilterTabs tabs={TABS} value={tab} onChange={(v) => { setTab(v); setPage(1) }} />
      <SearchRow value={q} onChange={(v) => { setQ(v); setPage(1) }} placeholder="Buyurtma kodi yoki do‘kon..." onFilter={() => {}} />
      {loading && <p className="mt-6 text-[#5C6E80]">Yuklanmoqda…</p>}
      {error && !needsMigration && <p role="alert" className="mt-6 text-[#b42318]">{error}</p>}

      <MobileCards rows={rows} render={(r) => (
        <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => openDetail(r)}>
          <div>
            <div className="font-semibold">#{r.code}</div>
            <div className="text-[12px] text-[#5C6E80]">{r.shop_name} · {payLabel(r.payment_method)}</div>
            <PayCell r={r} />
          </div>
          <div className="text-right">
            <div className="font-bold text-[#0F766E]">{som(r.payout)}</div>
            <StatusDot tone={ORDER_STATUS[r.status]?.tone || 'gray'}>{ORDER_STATUS[r.status]?.label}</StatusDot>
          </div>
        </button>
      )} />

      <TableCard className="hidden lg:block">
        <DataTable head={['#', 'Buyurtma', 'Do‘kon', 'Xaridor', 'Usul', 'Summa', 'Komissiya', 'Sotuvchiga', 'To‘lov holati', 'Buyurtma', 'Avto-chiqarish', '']}>
          {rows.map((r, i) => (
            <tr key={r.id} className={`border-t border-[#EEF3F4] ${r.dispute_status === 'open' ? 'bg-[#FEF2F2]/60' : ''}`}>
              <td className="px-3 py-3 text-[#8A9AA8]">{(page - 1) * pageSize + i + 1}</td>
              <td className="px-3 py-3 font-semibold text-[#0F766E]">#{r.code}<div className="text-[11px] font-normal text-[#8A9AA8]">{dmyhm(r.created_at)}</div></td>
              <td className="px-3 py-3">{r.shop_name}</td>
              <td className="px-3 py-3">{maskPhone(r.customer_phone)}</td>
              <td className="px-3 py-3">{payLabel(r.payment_method)}</td>
              <td className="px-3 py-3">{som(r.amount ?? r.subtotal)}</td>
              <td className="px-3 py-3">{som(r.commission)}</td>
              <td className="px-3 py-3 font-bold text-[#0F766E]">{som(r.payout)}</td>
              <td className="px-3 py-3"><PayCell r={r} /></td>
              <td className="px-3 py-3"><StatusDot tone={ORDER_STATUS[r.status]?.tone || 'gray'}>{ORDER_STATUS[r.status]?.label}</StatusDot></td>
              <td className="px-3 py-3 text-[12px]">{r.auto_release_at ? dmyhm(r.auto_release_at) : '—'}</td>
              <td className="px-3 py-3"><Btn onClick={() => openDetail(r)}><Eye className="size-3.5" /> Ko‘rish</Btn></td>
            </tr>
          ))}
          {!loading && !rows.length && <tr><td colSpan={12}><Empty /></td></tr>}
        </DataTable>
      </TableCard>
      <Pagination page={page} pageSize={pageSize} total={total} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1) }} />

      <Modal open={!!d} onClose={() => setDetail(null)} title={d ? `Escrow #${d.code}` : ''} sheet
        headerIcon={<Coins className="size-5" />}
        footer={(
          <div className="flex w-full flex-wrap gap-2">
            {canRelease && (
              <Btn tone="primary" disabled={!!busy} onClick={() => run('release', () => releaseEscrow(d.id), 'Sotuvchiga o‘tkazildi (12% komissiya ushlandi)')}>
                <Banknote className="size-3.5" /> {busy === 'release' ? 'Bajarilmoqda…' : 'Sotuvchiga chiqarish'}
              </Btn>
            )}
            {canRefund && (
              <Btn tone="danger" disabled={!!busy} onClick={() => run('refund', () => refundEscrow(d.id, reason), 'Qaytarish boshlandi — endi pulni qaytaring')}>
                <Undo2 className="size-3.5" /> {busy === 'refund' ? 'Bajarilmoqda…' : 'Xaridorga qaytarish'}
              </Btn>
            )}
            {clickAuto && (
              <Btn tone="primary" disabled={!!busy} onClick={() => run('click', () => clickReversal(d.id), 'Click orqali qaytarildi')}>
                <Undo2 className="size-3.5" /> {busy === 'click' ? 'Click…' : 'Click orqali qaytarish'}
              </Btn>
            )}
            {refundPending && (
              <Btn tone="soft" disabled={!!busy} onClick={() => run('manual', () => markRefundedManual(d.id, reason || 'Qo‘lda qaytarildi'), 'Qo‘lda qaytarildi deb belgilandi')}>
                <CheckCircle2 className="size-3.5" /> {busy === 'manual' ? 'Bajarilmoqda…' : 'Qo‘lda qaytarildi'}
              </Btn>
            )}
            <Btn onClick={() => setDetail(null)}>Yopish</Btn>
          </div>
        )}
      >
        {d && (
          <div className="space-y-3 text-[13px]">
            <div className="flex flex-wrap gap-2">
              <StatusDot tone={ORDER_STATUS[d.status]?.tone || 'gray'}>{ORDER_STATUS[d.status]?.label}</StatusDot>
              <PayCell r={d} />
            </div>
            {err && <p role="alert" className="rounded-lg bg-[#fdecec] px-3 py-2 text-[#b42318]">{err}</p>}
            {ok && <p role="status" className="rounded-lg bg-[#F0FDFA] px-3 py-2 text-[#0F766E]">{ok}</p>}
            {d.dispute_status && d.dispute_status !== 'none' && (
              <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-3">
                <div className="flex items-center gap-1.5 font-bold text-[#B91C1C]"><AlertTriangle className="size-4" /> {DISPUTE_STATUS[d.dispute_status] || d.dispute_status}</div>
                {d.dispute_reason && <p className="mt-1 text-[#3D4E5F]">Xaridor: “{d.dispute_reason}”</p>}
                {d.dispute_opened_at && <p className="mt-0.5 text-[11.5px] text-[#8A9AA8]">Ochilgan: {dmyhm(d.dispute_opened_at)}</p>}
              </div>
            )}
            {refundPending && (
              <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-3 text-[#92400E]">
                {d.payment_method === 'payme'
                  ? 'Payme: tranzaksiyani Payme merchant kabinetida bekor qiling — Payme CancelTransaction so‘rovi kelgach holat avtomatik “Qaytarildi” bo‘ladi. Aks holda pulni qo‘lda qaytarib, “Qo‘lda qaytarildi” tugmasini bosing.'
                  : clickAuto
                    ? 'Click: “Click orqali qaytarish” tugmasi Click Merchant API orqali to‘lovni qaytaradi. Xato bo‘lsa — qo‘lda qaytaring.'
                    : 'Avtomatik qaytarish sozlanmagan. Pulni xaridorga qo‘lda (bank/karta) qaytaring va “Qo‘lda qaytarildi” tugmasini bosing.'}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><div className="text-[#8A9AA8]">To‘langan summa</div><div className="font-bold">{som(d.amount ?? d.subtotal)}</div></div>
              <div><div className="text-[#8A9AA8]">Komissiya 12%</div><div className="font-bold">{som(d.commission)}</div></div>
              <div><div className="text-[#8A9AA8]">Sotuvchiga</div><div className="font-bold text-[#0F766E]">{som(d.payout)}</div></div>
              <div><div className="text-[#8A9AA8]">To‘lov usuli</div><div className="font-bold">{payLabel(d.payment_method)}</div></div>
              <div><div className="text-[#8A9AA8]">Yetkazilgan</div><div className="font-bold">{d.delivered_at ? dmyhm(d.delivered_at) : '—'}</div></div>
              <div><div className="text-[#8A9AA8]">Xaridor tasdiqladi</div><div className="font-bold">{d.buyer_confirmed_at ? dmyhm(d.buyer_confirmed_at) : '—'}</div></div>
              <div><div className="text-[#8A9AA8]">Avto-chiqarish</div><div className="font-bold">{d.auto_release_at ? dmyhm(d.auto_release_at) : '—'}</div></div>
              <div><div className="text-[#8A9AA8]">Qaytarish usuli</div><div className="font-bold">{d.refund_method ? (REFUND_METHOD[d.refund_method] || d.refund_method) : '—'}</div></div>
            </div>
            <div><div className="text-[#8A9AA8]">Do‘kon</div><div className="font-semibold">{d.seller?.shop_name || d.shop_name}</div></div>
            {d.escrow_refund_reason && <div><div className="text-[#8A9AA8]">Qaytarish sababi</div><div className="font-semibold">{d.escrow_refund_reason}</div></div>}
            {(canRelease || canRefund || refundPending) && (
              <label className="block">
                <span className="text-[#8A9AA8]">Izoh / sabab (jurnalga yoziladi)</span>
                <input value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-[#DCE5E7] px-3" placeholder="Masalan: nizo ko‘rib chiqildi" />
              </label>
            )}
            {Array.isArray(d.items) && d.items.length > 0 && (
              <div>
                <div className="mb-1 text-[#8A9AA8]">Mahsulotlar</div>
                <ul className="space-y-1">
                  {d.items.map((it) => (
                    <li key={it.id || it.name} className="flex justify-between gap-2 border-t border-[#EEF3F4] py-1">
                      <span>{it.name} × {it.qty}</span>
                      <span className="font-semibold">{som(Number(it.price) * Number(it.qty))}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
