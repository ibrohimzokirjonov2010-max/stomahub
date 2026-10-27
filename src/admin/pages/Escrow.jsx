import { useState } from 'react'
import { Coins, Eye } from 'lucide-react'
import { fetchEscrow, orderDetail, useAdminList } from '../api'
import { dmyhm, maskPhone, num, ORDER_STATUS, payLabel, som } from '../format'
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

  const { loading, error, needsMigration, rows, total, extra } = useAdminList(
    () => fetchEscrow({ q, page, pageSize }),
    [q, page, pageSize],
  )
  const s = extra.summary || {}

  return (
    <div>
      <PageHeader title="Escrow va pul aylanmasi" subtitle="Buyurtmalar bo‘yicha ushlab turilgan va chiqarilgan mablag‘lar" />
      <MigrateBanner show={needsMigration} />
      <KpiStrip items={[
        { label: 'Ushlab turilgan', value: som(s.held), sub: `${num(s.orders_held)} ta buyurtma`, active: true, icon: Coins },
        { label: 'Chiqarilgan', value: som(s.released), sub: 'Yetkazilgan buyurtmalar' },
        { label: 'Komissiya (12%)', value: som(s.commission), sub: 'Platforma ulushi' },
        { label: 'Escrow buyurtmalar', value: num(s.orders_held), sub: 'Jarayonda' },
      ]} />
      <SearchRow value={q} onChange={(v) => { setQ(v); setPage(1) }} placeholder="Buyurtma kodi yoki do‘kon..." onFilter={() => {}} />
      {loading && <p className="mt-6 text-[#5C6E80]">Yuklanmoqda…</p>}
      {error && !needsMigration && <p role="alert" className="mt-6 text-[#b42318]">{error}</p>}

      <MobileCards rows={rows} render={(r) => (
        <button type="button" className="flex w-full items-center justify-between text-left" onClick={async () => setDetail(await orderDetail(r.id))}>
          <div>
            <div className="font-semibold">#{r.code}</div>
            <div className="text-[12px] text-[#5C6E80]">{r.shop_name} · {payLabel(r.payment_method)}</div>
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
              <td className="px-3 py-3">{payLabel(r.payment_method)}</td>
              <td className="px-3 py-3">{som(r.subtotal)}</td>
              <td className="px-3 py-3">{som(r.commission)}</td>
              <td className="px-3 py-3 font-bold text-[#0F766E]">{som(r.payout)}</td>
              <td className="px-3 py-3"><StatusDot tone={ORDER_STATUS[r.status]?.tone || 'gray'}>{ORDER_STATUS[r.status]?.label}</StatusDot></td>
              <td className="px-3 py-3">{dmyhm(r.created_at)}</td>
              <td className="px-3 py-3"><Btn onClick={async () => setDetail(await orderDetail(r.id))}><Eye className="size-3.5" /> Ko‘rish</Btn></td>
            </tr>
          ))}
          {!loading && !rows.length && <tr><td colSpan={11}><Empty /></td></tr>}
        </DataTable>
      </TableCard>
      <Pagination page={page} pageSize={pageSize} total={total} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1) }} />

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? `Escrow #${detail.code}` : ''} sheet
        headerIcon={<Coins className="size-5" />} footer={<Btn onClick={() => setDetail(null)}>Yopish</Btn>}
      >
        {detail && (
          <div className="space-y-3 text-[13px]">
            <StatusDot tone={ORDER_STATUS[detail.status]?.tone || 'gray'}>{ORDER_STATUS[detail.status]?.label}</StatusDot>
            <div className="grid grid-cols-2 gap-3">
              <div><div className="text-[#8A9AA8]">Summa</div><div className="font-bold">{som(detail.subtotal)}</div></div>
              <div><div className="text-[#8A9AA8]">Komissiya 12%</div><div className="font-bold">{som(detail.commission)}</div></div>
              <div><div className="text-[#8A9AA8]">Escrow (sotuvchiga)</div><div className="font-bold text-[#0F766E]">{som(detail.payout)}</div></div>
              <div><div className="text-[#8A9AA8]">To‘lov</div><div className="font-bold">{payLabel(detail.payment_method)}</div></div>
            </div>
            <div><div className="text-[#8A9AA8]">Do‘kon</div><div className="font-semibold">{detail.seller?.shop_name || detail.seller?.name}</div></div>
          </div>
        )}
      </Modal>
    </div>
  )
}
