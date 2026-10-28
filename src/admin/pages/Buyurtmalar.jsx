import { useMemo, useState } from 'react'
import { Eye, ShoppingBag } from 'lucide-react'
import { listOrders, orderDetail, useAdminList } from '../api'
import { dmyhm, maskPhone, num, ORDER_STATUS, payLabel, som, fullPhone } from '../format'
import Modal from '../components/Modal'
import { PayBadge } from '../components/dashboard/StatusBadge'
import {
  Btn, DataTable, Empty, FilterTabs, KpiStrip, MigrateBanner, MobileCards,
  PageHeader, Pagination, RowActions, SearchRow, StatusDot, TableCard, card,
} from '../components/ui'

export default function Buyurtmalar() {
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [detail, setDetail] = useState(null)
  const [msg, setMsg] = useState('')

  const { loading, error, needsMigration, rows, total, counts, extra, reload } = useAdminList(
    () => listOrders({ tab, q, page, pageSize }),
    [tab, q, page, pageSize],
  )
  const tabs = useMemo(() => [
    { id: 'all', label: 'Barchasi', count: counts.all },
    { id: 'kutilmoqda', label: 'Kutilmoqda', count: counts.kutilmoqda },
    { id: 'yuborilgan', label: 'Yuborilgan', count: counts.yuborilgan },
    { id: 'yetkazilgan', label: 'Yetkazilgan', count: counts.yetkazilgan },
    { id: 'bekor', label: 'Bekor qilingan', count: counts.bekor },
  ], [counts])

  async function open(id) {
    try { setDetail(await orderDetail(id)); setMsg('') }
    catch (e) { setMsg(e.message) }
  }

  const kpis = [
    { label: 'Jami buyurtmalar', value: num(counts.all), sub: 'Barcha davr' },
    { label: 'Kutilmoqda', value: num(counts.kutilmoqda), sub: 'Yangi buyurtmalar' },
    { label: 'Yuborilgan', value: num(counts.yuborilgan), sub: 'Yo‘lda' },
    { label: 'Yetkazilgan', value: num(counts.yetkazilgan), sub: 'Muvaffaqiyatli' },
  ]

  return (
    <div>
      <PageHeader title="Buyurtmalar" subtitle="Platformadagi barcha buyurtmalar va ularning holati" />
      <MigrateBanner show={needsMigration} />
      {msg && <p role="status" className="mt-3 rounded-xl bg-[#eef8f6] px-3 py-2 text-[13px]">{msg}</p>}
      <KpiStrip items={kpis} />
      <FilterTabs tabs={tabs} value={tab} onChange={(v) => { setTab(v); setPage(1) }} />
      <SearchRow value={q} onChange={(v) => { setQ(v); setPage(1) }} placeholder="Buyurtma kodi, xaridor yoki sotuvchi..." onFilter={() => {}} />
      {loading && <p className="mt-6 text-[#5C6E80]">Yuklanmoqda…</p>}
      {error && !needsMigration && <p role="alert" className="mt-6 text-[#b42318]">{error}</p>}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_280px]">
        <div>
          <MobileCards rows={rows} render={(r) => (
            <button type="button" className="flex w-full gap-3 text-left" onClick={() => open(r.id)}>
              {r.first_item?.image_url
                ? <img src={r.first_item.image_url} alt="" className="size-14 rounded-lg object-cover" />
                : <span className="grid size-14 place-items-center rounded-lg bg-[#F0FDFA]"><ShoppingBag className="size-5 text-[#0F766E]" /></span>}
              <div className="min-w-0 flex-1">
                <div className="font-semibold">#{r.code}</div>
                <div className="text-[12px] text-[#5C6E80]">{r.shop_name} · {som(r.subtotal)}</div>
              </div>
              <StatusDot tone={ORDER_STATUS[r.status]?.tone || 'gray'}>{ORDER_STATUS[r.status]?.label || r.status}</StatusDot>
            </button>
          )} />

          <TableCard className="hidden lg:block">
            <DataTable head={['#', 'Buyurtma', 'Xaridor', 'Mahsulot', 'Sotuvchi', 'Shahar', 'Summa', 'Sana', 'Holat', 'Amallar']}>
              {rows.map((r, i) => (
                <tr key={r.id} className="border-t border-[#EEF3F4]">
                  <td className="px-3 py-3 text-[#8A9AA8]">{(page - 1) * pageSize + i + 1}</td>
                  <td className="px-3 py-3 font-semibold text-[#0F766E]">#{r.code}</td>
                  <td className="px-3 py-3">
                    <div className="font-semibold">{r.customer_name || '—'}</div>
                    <div className="text-[11.5px] text-[#8A9AA8]">{maskPhone(r.customer_phone)}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      {r.first_item?.image_url
                        ? <img src={r.first_item.image_url} alt="" className="size-9 rounded-lg object-cover" />
                        : <span className="size-9 rounded-lg bg-[#F0FDFA]" />}
                      <span className="line-clamp-1 max-w-[140px]">{r.first_item?.name || '—'}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">{r.shop_name}</td>
                  <td className="px-3 py-3">{r.city || '—'}</td>
                  <td className="px-3 py-3 font-bold text-[#0F766E]">{som(r.subtotal)}</td>
                  <td className="px-3 py-3">{dmyhm(r.created_at)}</td>
                  <td className="px-3 py-3"><StatusDot tone={ORDER_STATUS[r.status]?.tone || 'gray'}>{ORDER_STATUS[r.status]?.label || r.status}</StatusDot></td>
                  <td className="px-3 py-3"><Btn onClick={() => open(r.id)}><Eye className="size-3.5" /> Ko‘rish</Btn></td>
                </tr>
              ))}
              {!loading && !rows.length && <tr><td colSpan={10}><Empty /></td></tr>}
            </DataTable>
          </TableCard>
          <Pagination page={page} pageSize={pageSize} total={total} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1) }} />
        </div>

        <aside className={`${card} hidden h-fit p-4 lg:block`}>
          <h3 className="text-[14px] font-bold">Viloyat bo‘yicha buyurtmalar</h3>
          <ul className="mt-3 space-y-2">
            {(extra.regions || []).map((r) => (
              <li key={r.city} className="flex items-center justify-between text-[13px]">
                <span className="text-[#3D4E5F]">{r.city}</span>
                <span className="font-bold text-[#0F766E]">{num(r.count)}</span>
              </li>
            ))}
            {!extra.regions?.length && <Empty text="Ma’lumot yo‘q" />}
          </ul>
        </aside>
      </div>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={`Buyurtma #${detail?.code || ''}`} sheet
        headerIcon={<ShoppingBag className="size-5" />} width="max-w-[680px]"
        footer={<Btn onClick={() => setDetail(null)}>Yopish</Btn>}
      >
        {detail && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusDot tone={ORDER_STATUS[detail.status]?.tone || 'gray'}>{ORDER_STATUS[detail.status]?.label}</StatusDot>
              <PayBadge method={detail.payment_method} />
              <span className="text-[12.5px] text-[#5C6E80]">{dmyhm(detail.created_at)}</span>
            </div>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#CCFBF1] bg-[#CCFBF1] sm:grid-cols-4">
              {[
                { label: 'Jami', value: som(detail.subtotal) },
                { label: 'Komissiya (12%)', value: som(detail.commission) },
                { label: 'Sotuvchiga', value: som(detail.payout) },
                { label: 'To‘lov', value: payLabel(detail.payment_method) },
              ].map((x) => (
                <div key={x.label} className="bg-[#F0FDFA] p-3">
                  <div className="text-[11px] text-[#5C6E80]">{x.label}</div>
                  <div className="mt-0.5 text-[13.5px] font-extrabold">{x.value}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              <div><div className="text-[#8A9AA8]">Xaridor</div><div className="font-semibold">{detail.customer_name}</div><a href={`tel:${String(detail.customer_phone || '').replace(/[^\d+]/g, '')}`} className="text-[#0F766E] underline">{fullPhone(detail.customer_phone)}</a></div>
              <div><div className="text-[#8A9AA8]">Sotuvchi</div><div className="font-semibold">{detail.seller?.shop_name || detail.seller?.name}</div><div>{detail.seller?.city} · {maskPhone(detail.seller?.phone)}</div></div>
              <div className="col-span-2"><div className="text-[#8A9AA8]">Manzil</div><div className="font-semibold">{detail.address || '—'}</div></div>
            </div>
            <ul className="space-y-2">
              {(detail.items || []).map((it) => (
                <li key={it.id} className="flex items-center gap-3 rounded-xl border border-[#E6EEF0] p-2.5">
                  {it.image_url ? <img src={it.image_url} alt="" className="size-12 rounded-lg object-cover" /> : <span className="size-12 rounded-lg bg-[#F0FDFA]" />}
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{it.name}</div>
                    <div className="text-[12px] text-[#5C6E80]">{it.qty} × {som(it.price)}</div>
                  </div>
                  <div className="font-bold text-[#0F766E]">{som(it.total)}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>
    </div>
  )
}
