import { useMemo, useState } from 'react'
import { BadgeCheck, CheckCircle2, Eye, GraduationCap, Megaphone, Package, Store, XCircle } from 'lucide-react'
import { listApprovals, reviewSeller, reviewOrganizer, reviewCampaign, adminReview, useAdminList } from '../api'
import { dmyhm, maskPhone, num } from '../format'
import {
  Btn, DataTable, Empty, FilterTabs, KpiStrip, MigrateBanner, MobileCards,
  PageHeader, Pagination, RowActions, SearchRow, StatusDot, TableCard,
} from '../components/ui'

const KIND = {
  seller: { label: 'Sotuvchi', icon: Store },
  organizer: { label: 'Tashkilotchi', icon: GraduationCap },
  ad: { label: 'E’lon', icon: Megaphone },
  product: { label: 'Mahsulot', icon: Package },
}

export default function Tasdiqlashlar() {
  const [type, setType] = useState('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState('')

  const { loading, error, needsMigration, rows, total, counts, reload } = useAdminList(
    () => listApprovals({ type, q, page, pageSize }),
    [type, q, page, pageSize],
  )

  const tabs = useMemo(() => [
    { id: 'all', label: 'Barcha turlar' },
    { id: 'seller', label: 'Sotuvchi' },
    { id: 'organizer', label: 'Tashkilotchi' },
    { id: 'ad', label: 'E’lon' },
    { id: 'product', label: 'Mahsulot' },
  ], [])

  async function act(row, approve) {
    setBusy(row.id)
    setMsg('')
    try {
      if (row.kind === 'seller') await reviewSeller(row.id, approve ? 'approve' : 'reject', approve ? '' : 'Talabga mos emas')
      else if (row.kind === 'organizer') await reviewOrganizer(row.id, approve ? 'approve' : 'reject', approve ? '' : 'Talabga mos emas')
      else if (row.kind === 'ad') await reviewCampaign(row.id, approve ? 'approve' : 'reject', approve ? '' : 'Talabga mos emas')
      else if (row.kind === 'product') await adminReview(row.id, approve, approve ? '' : 'Talabga mos emas')
      setMsg(approve ? 'Tasdiqlandi.' : 'Rad etildi.')
      reload()
    } catch (e) { setMsg(e.message) }
    finally { setBusy('') }
  }

  const kpis = [
    { label: 'Sotuvchi', value: num(counts.sellers), icon: Store, active: true },
    { label: 'Tashkilotchi', value: num(counts.organizers), icon: GraduationCap },
    { label: 'E’lon', value: num(counts.ads), icon: Megaphone },
    { label: 'Mahsulot', value: num(counts.products), icon: Package },
  ]

  return (
    <div>
      <PageHeader title="Tasdiqlashlar" subtitle="Platformadagi barcha tasdiqlash so‘rovlarini boshqarish" />
      <MigrateBanner show={needsMigration} />
      {msg && <p role="status" className="mt-3 rounded-xl bg-[#eef8f6] px-3 py-2 text-[13px]">{msg}</p>}
      <KpiStrip items={kpis} />
      <FilterTabs tabs={tabs} value={type} onChange={(v) => { setType(v); setPage(1) }} />
      <SearchRow value={q} onChange={(v) => { setQ(v); setPage(1) }} placeholder="Nomi, yuboruvchi yoki shaharga ko‘ra qidirish..." onFilter={() => {}} />
      {loading && <p className="mt-6 text-[#5C6E80]">Yuklanmoqda…</p>}
      {error && !needsMigration && <p role="alert" className="mt-6 text-[#b42318]">{error}</p>}

      <MobileCards rows={rows} render={(r) => {
        const K = KIND[r.kind] || KIND.seller
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#F0FDFA] px-2 py-0.5 text-[11.5px] font-semibold text-[#0F766E]">
                <K.icon className="size-3.5" /> {K.label}
              </span>
              <StatusDot tone="teal">Kutilmoqda</StatusDot>
            </div>
            <div className="font-semibold">{r.title}</div>
            <div className="text-[12px] text-[#5C6E80]">{r.sender} · {maskPhone(r.phone)} · {r.city || '—'}</div>
            <div className="flex gap-2">
              <Btn tone="primary" disabled={busy === r.id} onClick={() => act(r, true)}><CheckCircle2 className="size-3.5" /> Tasdiqlash</Btn>
              <Btn disabled={busy === r.id} onClick={() => act(r, false)}><XCircle className="size-3.5" /> Rad etish</Btn>
            </div>
          </div>
        )
      }} />

      <TableCard className="hidden lg:block">
        <DataTable head={['#', 'Turi', 'Nomi', 'Yuboruvchi', 'Shahar', 'Yuborilgan sana', 'Hujjatlar', 'Holat', 'Amallar']}>
          {rows.map((r, i) => {
            const K = KIND[r.kind] || KIND.seller
            return (
              <tr key={`${r.kind}-${r.id}`} className="border-t border-[#EEF3F4]">
                <td className="px-3 py-3 text-[#8A9AA8]">{(page - 1) * pageSize + i + 1}</td>
                <td className="px-3 py-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F0FDFA] px-2.5 py-0.5 text-[12px] font-semibold text-[#0F766E]">
                    <K.icon className="size-3.5" /> {K.label}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    {r.thumb ? <img src={r.thumb} alt="" className="size-9 rounded-lg object-cover" /> : <span className="grid size-9 place-items-center rounded-lg bg-[#F0FDFA] text-[#0F766E]"><BadgeCheck className="size-4" /></span>}
                    <div>
                      <div className="font-semibold">{r.title}</div>
                      <div className="text-[11.5px] text-[#8A9AA8]">{r.subtitle}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="font-semibold">{r.sender}</div>
                  <div className="text-[11.5px] text-[#8A9AA8]">{maskPhone(r.phone)}</div>
                </td>
                <td className="px-3 py-3">{r.city || '—'}</td>
                <td className="px-3 py-3">{dmyhm(r.sent_at)}</td>
                <td className="px-3 py-3">{num(r.docs)} ta</td>
                <td className="px-3 py-3"><StatusDot tone="teal">Kutilmoqda</StatusDot></td>
                <td className="px-3 py-3">
                  <RowActions>
                    <Btn><Eye className="size-3.5" /> Ko‘rish</Btn>
                    <Btn tone="primary" disabled={busy === r.id} onClick={() => act(r, true)}><CheckCircle2 className="size-3.5" /> Tasdiqlash</Btn>
                    <Btn disabled={busy === r.id} onClick={() => act(r, false)}><XCircle className="size-3.5" /> Rad etish</Btn>
                  </RowActions>
                </td>
              </tr>
            )
          })}
          {!loading && !rows.length && <tr><td colSpan={9}><Empty text="Kutilayotgan tasdiqlash yo‘q" /></td></tr>}
        </DataTable>
      </TableCard>
      <Pagination page={page} pageSize={pageSize} total={total} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1) }} />
    </div>
  )
}
