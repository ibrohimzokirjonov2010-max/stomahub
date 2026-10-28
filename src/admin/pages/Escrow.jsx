import { useState } from 'react'
import { Coins, Eye, Banknote, Undo2 } from 'lucide-react'
import { fetchEscrow, orderDetail, releaseEscrow, refundEscrow, useAdminList } from '../api'
import { dmyhm, isCash, maskPhone, num, ORDER_STATUS, payLabel, payStatusLabel, som } from '../format'
import Modal from '../components/Modal'
import {
  Btn, DataTable, Empty, KpiStrip, MigrateBanner, MobileCards,
  PageHeader, Pagination, SearchRow, StatusDot, TableCard,
} from '../components/ui'

export default function Escrow() {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [detail, setDetail] = useState(null)
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [tick, setTick] = useState(0)

  const { loading, error, needsMigration, rows, total, extra, reload } = useAdminList(
    () => fetchEscrow({ q, page, pageSize }),
    [q, page, pageSize, tick],
  )
  const s = extra.summary || {}

  const openDetail = async (id) => {
    setErr('')
    setDetail(await orderDetail(id))
    setRefundReason('')
  }

  const doRelease = async (id) => {
    setBusy('release'); setErr('')
    try {
      await releaseEscrow(id)
      setTick((n) => n + 1)
      setDetail(await orderDetail(id))
      reload?.()
    } catch (e) {
      setErr(e.message || 'Chiqarib bo‘lmadi')
    } finally {
      setBusy('')
    }
  }

  const doRefund = async (id) => {
    setBusy('refund'); setErr('')
    try {
      await refundEscrow(id, refundReason)
      setTick((n) => n + 1)
      setDetail(await orderDetail(id))
      reload?.()
    } catch (e) {
      setErr(e.message || 'Qaytarib bo‘lmadi')
    } finally {
      setBusy('')
    }
  }

  const canRelease = (d) => d && !isCash(d.payment_method) && d.status !== 'bekor_qilindi' && d.payment_status !== 'released' && d.payment_status !== 'refunded'
  const canRefund = (d) => d && !isCash(d.payment_method) && d.payment_status !== 'released' && d.payment_status !== 'refunded' && d.status !== 'bekor_qilindi'

  return (
    <div>
      <PageHeader title="Escrow va pul aylanmasi" subtitle="Buyurtmalar bo‘yicha ushlab turilgan va chiqarilgan mablag‘lar" />
      <MigrateBanner show={needsMigration} />
      <KpiStrip items={[
        { label: 'Ushlab turilgan', value: som(s.held), sub: `${num(s.orders_held)} ta buyurtma`, active: true, icon: Coins },
        { label: 'Chiqarilgan', value: som(s.released), sub: 'Yetkazilgan buyurtmalar' },
        { label: 'Komissiya (12%)', value: som(s.commission), sub: 'Faqat yetkazilgan buyurtmalar' },
        { label: 'Naqd — kutilmoqda', value: s.cash_pending != null ? som(s.cash_pending) : '—', sub: s.cash_pending_orders != null ? `${num(s.cash_pending_orders)} ta · escrow emas` : 'Migratsiya 0031 kerak' },
      ]} />
      <SearchRow value={q} onChange={(v) => { setQ(v); setPage(1) }} placeholder="Buyurtma kodi yoki do‘kon..." onFilter={() => {}} />
      {loading && <p className="mt-6 text-[#5C6E80]">Yuklanmoqda…</p>}
      {error && !needsMigration && <p role="alert" className="mt-6 text-[#b42318]">{error}</p>}

      <MobileCards rows={rows} render={(r) => (
        <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => openDetail(r.id)}>
          <div>
            <div className="font-semibold">#{r.code}</div>
            <div className="text-[12px] text-[#5C6E80]">{r.shop_name} · {payLabel(r.payment_method)} · {payStatusLabel(r.payment_status, r.payment_method)}</div>
          </div>
          <div className="text-right">
            <div className="font-bold text-[#0F766E]">{som(r.payout)}</div>
            <StatusDot tone={ORDER_STATUS[r.status]?.tone || 'gray'}>{ORDER_STATUS[r.status]?.label}</StatusDot>
          </div>
        </button>
      )} />

      <TableCard className="hidden lg:block">
        <DataTable head={['#', 'Buyurtma', 'Do‘kon', 'Xaridor', 'To‘lov', 'Summa', 'Komissiya', 'Escrow', 'Holat', 'Sana', 'Amallar']}>
          {rows.map((r, i) => (
            <tr key={r.id} className="border-t border-[#EEF3F4]">
              <td className="px-3 py-3 text-[#8A9AA8]">{(page - 1) * pageSize + i + 1}</td>
              <td className="px-3 py-3 font-semibold text-[#0F766E]">#{r.code}</td>
              <td className="px-3 py-3">{r.shop_name}</td>
              <td className="px-3 py-3">{maskPhone(r.customer_phone)}</td>
              <td className="px-3 py-3">{payLabel(r.payment_method)}<div className="text-[11px] text-[#8A9AA8]">{payStatusLabel(r.payment_status, r.payment_method)}</div></td>
              <td className="px-3 py-3">{som(r.subtotal)}</td>
              <td className="px-3 py-3">{som(r.commission)}</td>
              <td className="px-3 py-3 font-bold text-[#0F766E]">{som(r.payout)}</td>
              <td className="px-3 py-3"><StatusDot tone={ORDER_STATUS[r.status]?.tone || 'gray'}>{ORDER_STATUS[r.status]?.label}</StatusDot></td>
              <td className="px-3 py-3">{dmyhm(r.created_at)}</td>
              <td className="px-3 py-3"><Btn onClick={() => openDetail(r.id)}><Eye className="size-3.5" /> Ko‘rish</Btn></td>
            </tr>
          ))}
          {!loading && !rows.length && <tr><td colSpan={11}><Empty /></td></tr>}
        </DataTable>
      </TableCard>
      <Pagination page={page} pageSize={pageSize} total={total} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1) }} />

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? `Escrow #${detail.code}` : ''} sheet
        headerIcon={<Coins className="size-5" />}
        footer={(
          <div className="flex w-full flex-wrap gap-2">
            {canRelease(detail) && (
              <Btn tone="primary" disabled={!!busy} onClick={() => doRelease(detail.id)}>
                <Banknote className="size-3.5" /> {busy === 'release' ? 'Chiqarilmoqda…' : 'Escrowni chiqarish'}
              </Btn>
            )}
            {canRefund(detail) && (
              <Btn tone="soft" disabled={!!busy} onClick={() => doRefund(detail.id)}>
                <Undo2 className="size-3.5" /> {busy === 'refund' ? 'Qaytarilmoqda…' : 'Refund'}
              </Btn>
            )}
            <Btn onClick={() => setDetail(null)}>Yopish</Btn>
          </div>
        )}
      >
        {detail && (
          <div className="space-y-3 text-[13px]">
            <StatusDot tone={ORDER_STATUS[detail.status]?.tone || 'gray'}>{ORDER_STATUS[detail.status]?.label}</StatusDot>
            {err && <p role="alert" className="rounded-lg bg-[#fdecec] px-3 py-2 text-[#b42318]">{err}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div><div className="text-[#8A9AA8]">Summa</div><div className="font-bold">{som(detail.subtotal)}</div></div>
              <div><div className="text-[#8A9AA8]">Komissiya 12%</div><div className="font-bold">{som(detail.commission)}</div></div>
              <div><div className="text-[#8A9AA8]">Escrow (sotuvchiga)</div><div className="font-bold text-[#0F766E]">{som(detail.payout)}</div></div>
              <div><div className="text-[#8A9AA8]">To‘lov</div><div className="font-bold">{payLabel(detail.payment_method)}</div></div>
              <div><div className="text-[#8A9AA8]">To‘lov holati</div><div className="font-bold">{payStatusLabel(detail.payment_status, detail.payment_method)}</div></div>
              <div><div className="text-[#8A9AA8]">Xaridor</div><div className="font-bold">{detail.customer_name || '—'}</div></div>
            </div>
            <div><div className="text-[#8A9AA8]">Do‘kon</div><div className="font-semibold">{detail.seller?.shop_name || detail.seller?.name}</div></div>
            <div><div className="text-[#8A9AA8]">Manzil</div><div className="font-semibold">{[detail.city, detail.address].filter(Boolean).join(', ') || '—'}</div></div>
            {detail.tracking_url && (
              <div>
                <div className="text-[#8A9AA8]">Yandex kuzatuv</div>
                <a href={detail.tracking_url} target="_blank" rel="noreferrer" className="font-semibold text-[#0F766E] break-all">{detail.tracking_url}</a>
              </div>
            )}
            {canRefund(detail) && (
              <label className="block">
                <span className="text-[#8A9AA8]">Refund sababi</span>
                <input
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-[#DCE5E7] px-3"
                  placeholder="Ixtiyoriy"
                />
              </label>
            )}
            {Array.isArray(detail.items) && detail.items.length > 0 && (
              <div>
                <div className="mb-1 text-[#8A9AA8]">Mahsulotlar</div>
                <ul className="space-y-1">
                  {detail.items.map((it) => (
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
