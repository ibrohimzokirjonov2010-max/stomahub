import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BadgeCheck, CheckCircle2, Eye, GraduationCap, Megaphone, Package, Store, XCircle } from 'lucide-react'
import { listApprovals, reviewSeller, reviewOrganizer, reviewCampaign, adminReview, useAdminList, licenseQueue, reviewLicense, pendingCounts } from '../api'
import Arizalar from './Arizalar'
import ConfirmReason from '../components/ConfirmReason'
import { dmyhm, fullPhone, maskPhone, num } from '../format'
import {
  Btn, DataTable, Empty, FilterTabs, KpiStrip, MigrateBanner, MobileCards,
  PageHeader, Pagination, RowActions, SearchRow, StatusDot, TableCard,
} from '../components/ui'

const KIND = {
  seller: { label: 'Sotuvchi', icon: Store },
  organizer: { label: 'Tashkilotchi', icon: GraduationCap },
  ad: { label: 'Reklama', icon: Megaphone },
  product: { label: 'Mahsulot', icon: Package },
}

function Queue() {
  const nav = useNavigate()
  const [rej, setRej] = useState(null)
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
    { id: 'ad', label: 'Reklama' },
    { id: 'product', label: 'Mahsulot' },
  ], [])

  async function doReview(row, approve, reason = '') {
    if (row.kind === 'seller') await reviewSeller(row.id, approve ? 'approve' : 'reject', reason)
    else if (row.kind === 'organizer') await reviewOrganizer(row.id, approve ? 'approve' : 'reject', reason)
    else if (row.kind === 'ad') await reviewCampaign(row.id, approve ? 'approve' : 'reject', reason)
    else if (row.kind === 'product') await adminReview(row.id, approve, reason)
  }
  async function act(row, approve) {
    if (!approve) { setRej(row); return }  // reject needs a written reason
    setBusy(row.id)
    setMsg('')
    try { await doReview(row, true); setMsg('Tasdiqlandi.'); reload() } catch (e) { setMsg(e.message) } finally { setBusy('') }
  }
  const view = (r) => nav(r.kind === 'product' ? '/admin/mahsulotlar' : r.kind === 'ad' ? '/admin/elonlar'
    : r.kind === 'organizer' ? '/admin/tashkilotchilar' : '/admin/sotuvchilar')

  const kpis = [
    { label: 'Sotuvchi', value: num(counts.sellers), icon: Store, active: true },
    { label: 'Tashkilotchi', value: num(counts.organizers), icon: GraduationCap },
    { label: 'Reklama', value: num(counts.ads), icon: Megaphone },
    { label: 'Mahsulot', value: num(counts.products), icon: Package },
  ]

  return (
    <div>
      <ConfirmReason open={!!rej} title="Rad etish" danger confirmLabel="Rad etish"
        text={rej ? `“${rej.title}” rad etiladi. Sabab foydalanuvchiga ko‘rsatiladi.` : ''}
        onClose={() => setRej(null)} onConfirm={async (reason) => { await doReview(rej, false, reason); setMsg('Rad etildi.'); reload() }} />
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
                    <Btn onClick={() => view(r)}><Eye className="size-3.5" /> Ko‘rish</Btn>
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

const SECTIONS = [
  ['arizalar', 'Arizalar (sotuvchi / tashkilotchi)'],
  ['boshqa', 'Mahsulot va reklama'],
  ['shifokor', 'Shifokor litsenziyasi'],
]

/** One page: stage-2 applications + legacy/product/ad queue + doctor licenses. */
export default function Tasdiqlashlar() {
  const [params, setParams] = useSearchParams()
  const bolim = SECTIONS.some(([k]) => k === params.get('bolim')) ? params.get('bolim') : 'arizalar'
  const [pc, setPc] = useState(null)
  useEffect(() => { pendingCounts().then(setPc).catch(() => setPc(null)) }, [bolim])
  const badge = { arizalar: pc ? pc.sellers + pc.organizers : null, boshqa: pc ? pc.products + pc.ads : null, shifokor: pc ? pc.doctors : null }
  return (
    <div>
      <PageHeader title="Tasdiqlashlar" subtitle="Arizalar, mahsulot/reklama moderatsiyasi va shifokor litsenziyalari — bitta sahifada" />
      {pc && <p className="-mt-1 mb-2 text-[12.5px] text-[#5C6E80]">Jami kutilmoqda: <b>{num(pc.total)}</b> (boshqaruv panelidagi son bilan bir xil manba)</p>}
      <div data-testid="approval-sections" className="mb-4 flex flex-wrap gap-2">
        {SECTIONS.map(([k, l]) => (
          <button key={k} type="button" onClick={() => setParams({ bolim: k }, { replace: true })}
            className={`h-10 rounded-xl px-4 text-[13.5px] font-semibold ${bolim === k ? 'bg-[#0F766E] text-white' : 'border border-[#E6EEF0] bg-white text-[#3D4E5F]'}`}>
            {l}{badge[k] != null ? ` (${num(badge[k])})` : ''}
          </button>
        ))}
      </div>
      {bolim === 'arizalar' && <Arizalar embedded />}
      {bolim === 'boshqa' && <Queue />}
      {bolim === 'shifokor' && <DoctorQueue />}
    </div>
  )
}

function DoctorQueue() {
  const [tab, setTab] = useState('pending')
  const [st, setSt] = useState({ loading: true, rows: [], counts: {}, error: '' })
  const [rej, setRej] = useState(null)
  const [msg, setMsg] = useState('')
  const load = useCallback(() => {
    setSt((x) => ({ ...x, loading: true }))
    licenseQueue(tab).then((r) => setSt({ loading: false, rows: r?.rows || [], counts: r?.counts || {}, error: '' }))
      .catch((e) => setSt({ loading: false, rows: [], counts: {}, error: e.message }))
  }, [tab])
  useEffect(() => { load() }, [load])
  const approve = async (r) => { try { await reviewLicense(r.id, true); setMsg(`${r.name} — tasdiqlangan shifokor.`); load() } catch (e) { setMsg(e.message) } }
  return (
    <div data-testid="doctor-queue">
      <FilterTabs tabs={[
        { id: 'pending', label: 'Kutilmoqda', count: st.counts.pending },
        { id: 'approved', label: 'Tasdiqlangan', count: st.counts.approved },
        { id: 'rejected', label: 'Rad etilgan', count: st.counts.rejected },
      ]} value={tab} onChange={setTab} />
      {msg && <p role="status" className="mt-3 rounded-xl bg-[#eef8f6] px-3 py-2 text-[13px]">{msg}</p>}
      {st.loading && <p className="mt-6 text-[#5C6E80]">Yuklanmoqda…</p>}
      {st.error && <p role="alert" className="mt-6 text-[#b42318]">{/admin_license_queue|Could not find/i.test(st.error) ? 'Migratsiya 0031 hali qo‘llanmagan — litsenziya navbati ishlamaydi.' : st.error}</p>}
      {!st.loading && !st.error && !st.rows.length && <Empty text="Bu bo‘limda ariza yo‘q" />}
      <ul className="mt-3 flex flex-col gap-2">
        {st.rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E6EEF0] bg-white p-3">
            <div>
              <div className="font-semibold">{r.name || '—'} <span className="text-[12px] font-normal text-[#5C6E80]">{r.specialty || ''}</span></div>
              <div className="text-[12.5px] text-[#5C6E80]">Litsenziya № <b>{r.license || '—'}</b> · {fullPhone(r.phone)} · {r.city || '—'} · {dmyhm(r.submitted_at)}</div>
              {r.reject_reason && <div className="text-[12px] text-[#b42318]">Sabab: {r.reject_reason}</div>}
            </div>
            {r.license_status === 'pending' && (
              <RowActions>
                <Btn tone="primary" onClick={() => approve(r)}><CheckCircle2 className="size-3.5" /> Tasdiqlash</Btn>
                <Btn onClick={() => setRej(r)}><XCircle className="size-3.5" /> Rad etish</Btn>
              </RowActions>
            )}
          </li>
        ))}
      </ul>
      <ConfirmReason open={!!rej} title="Litsenziyani rad etish" danger confirmLabel="Rad etish" text={rej ? `${rej.name} arizasi rad etiladi.` : ''}
        onClose={() => setRej(null)} onConfirm={async (reason) => { await reviewLicense(rej.id, false, reason); setMsg('Rad etildi.'); load() }} />
    </div>
  )
}
