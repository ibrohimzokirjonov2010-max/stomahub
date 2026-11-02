import { friendlyError } from '../../lib/friendlyError'
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
  moderatsiyada: { label: 'Moderatsiyada', tone: 'orange' },
  faol: { label: 'Faol', tone: 'teal' },
  toxtatilgan: { label: 'To‘xtatilgan', tone: 'gray' },
  rad_etilgan: { label: 'Rad etilgan', tone: 'red' },
  yakunlangan: { label: 'Yakunlangan', tone: 'gray' },
}
const KIND = { qidiruv: 'Qidiruvda', banner: 'Bosh sahifa banneri', kategoriya: 'Kategoriyada' }
const REASONS = ['Rasm yoki matn talabga mos emas', 'Mahsulot ma’lumotlari noto‘liq', 'Taqiqlangan yoki noto‘g‘ri reklama', 'Narx yoki tavsif chalg‘ituvchi']

export default function Elonlar() {
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [detail, setDetail] = useState(null)
  const [reason, setReason] = useState('')
  const [rej, setRej] = useState(null) // { id, title } — rad etish oynasi
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
    { id: 'rad_etilgan', label: 'Rad etilgan', count: counts.rad_etilgan },
    { id: 'yakunlangan', label: 'Yakunlangan', count: counts.yakunlangan },
  ], [counts])

  async function open(id) {
    try { setDetail(await campaignDetail(id)); setReason(''); setMsg('') }
    catch (e) { setMsg(friendlyError(e)) }
  }
  // Sabab parametr sifatida uzatiladi — eski state’dan o‘qilmaydi.
  async function act(id, action, why = '') {
    if (action === 'reject' && why.trim().length < 3) { setMsg('Rad etish sababini yozing (kamida 3 belgi).'); return }
    setBusy(id)
    try {
      const r = await reviewCampaign(id, action, why.trim())
      const st = r?.status
      setMsg(action === 'approve' ? (st === 'faol' ? 'Kampaniya tasdiqlandi va ishga tushdi.' : 'Kampaniya tasdiqlandi. Sotuvchi balansi yetarli emas — to‘ldirilgach avtomatik ishga tushadi.')
        : action === 'reject' ? 'Kampaniya rad etildi. Sabab sotuvchiga ko‘rsatiladi.' : 'Kampaniya to‘xtatildi.')
      setDetail(null); setRej(null); setReason(''); reload()
    } catch (e) { setMsg(friendlyError(e)) }
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
              <td className="px-3 py-3"><StatusDot tone={STATUS[r.status]?.tone || 'gray'}>{STATUS[r.status]?.label || r.status}</StatusDot>{(r.reject_reason && r.status === 'rad_etilgan') || r.pause_reason ? <div className="mt-0.5 max-w-[160px] truncate text-[11.5px] text-[#8A9AA8]" title={r.reject_reason || r.pause_reason}>{r.status === 'rad_etilgan' ? r.reject_reason : r.pause_reason}</div> : null}</td>
              <td className="px-3 py-3">{dmyhm(r.created_at)}</td>
              <td className="px-3 py-3">
                <RowActions>
                  <Btn onClick={() => open(r.id)}><Eye className="size-3.5" /> Ko‘rish</Btn>
                  {r.status === 'moderatsiyada' && (
                    <>
                      <Btn tone="primary" disabled={busy === r.id} onClick={() => act(r.id, 'approve')}><CheckCircle2 className="size-3.5" /> Tasdiqlash</Btn>
                      <Btn disabled={busy === r.id} onClick={() => { setReason(''); setRej({ id: r.id, title: r.title }) }}><XCircle className="size-3.5" /> Rad etish</Btn>
                    </>
                  )}
                  {r.status === 'faol' && <Btn disabled={busy === r.id} onClick={() => act(r.id, 'pause')}><Pause className="size-3.5" /> To‘xtatish</Btn>}
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
                <Btn tone="danger" disabled={busy === detail.id} onClick={() => act(detail.id, 'reject', reason)}><XCircle className="size-4" /> Rad etish</Btn>
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
              <div><div className="text-[#8A9AA8]">Turi</div><div className="font-semibold">{KIND[detail.kind] || detail.kind}</div></div>
              <div><div className="text-[#8A9AA8]">Umumiy byudjet</div><div className="font-semibold">{detail.total_budget ? som(detail.total_budget) : '—'}</div></div>
              <div><div className="text-[#8A9AA8]">Muddat</div><div className="font-semibold">{detail.starts_on} – {detail.ends_on || '…'}</div></div>
              <div><div className="text-[#8A9AA8]">Hudud</div><div className="font-semibold">{detail.region || '—'}</div></div>
              <div><div className="text-[#8A9AA8]">Reklama balansi</div><div className={`font-semibold ${Number(detail.balance) < 1000 ? 'text-[#b42318]' : 'text-[#0F766E]'}`}>{som(detail.balance || 0)}</div></div>
              <div><div className="text-[#8A9AA8]">Ko‘rish / bosish / sarf</div><div className="font-semibold">{detail.stats?.impressions || 0} / {detail.stats?.clicks || 0} / {som(detail.stats?.spent || 0)}</div></div>
            </div>
            {(detail.reject_reason || detail.pause_reason) && <p className="rounded-xl bg-[#FFF7E6] px-3 py-2 text-[12.5px] text-[#7A4B00]">{detail.status === 'rad_etilgan' ? 'Rad sababi: ' + detail.reject_reason : detail.pause_reason}</p>}
            {detail.products?.length > 0 ? (
              <div className="space-y-1.5">{detail.products.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl border border-[#E6EEF0] p-2">
                  {p.image_url ? <img src={p.image_url} alt="" className="size-10 rounded-lg object-cover" /> : <span className="size-10 rounded-lg bg-[#F0FDFA]" />}
                  <div className="min-w-0 flex-1"><div className="truncate font-semibold">{p.name}</div><div className="text-[12px] text-[#5C6E80]">{p.category || ''}</div></div>
                  <div className="text-right text-[12px]"><div className="font-semibold text-[#0F766E]">{som(p.price)}</div><div className={p.status === 'active' ? 'text-[#0F766E]' : 'text-[#b42318]'}>{p.status === 'active' ? 'Faol' : 'Faol emas'}</div></div>
                </div>))}</div>
            ) : detail.product && (
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
                <div className="mb-2 flex flex-wrap gap-1.5">{REASONS.map((x) => <button key={x} type="button" onClick={() => setReason(x)} className={`rounded-lg border px-2 py-1 text-[12px] ${reason === x ? 'border-[#0F766E] bg-[#F0FDFA]' : 'border-[#E6EEF0]'}`}>{x}</button>)}</div>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="w-full rounded-xl border border-[#E6EEF0] px-3 py-2" />
              </label>
            )}
          </div>
        )}
      </Modal>

      <Modal open={!!rej} onClose={() => setRej(null)} title="Kampaniyani rad etish" width="max-w-[480px]" sheet
        footer={rej && <div className="flex gap-2"><Btn tone="danger" disabled={busy === rej.id} onClick={() => act(rej.id, 'reject', reason)}><XCircle className="size-4" /> Rad etish</Btn><Btn onClick={() => setRej(null)}>Bekor qilish</Btn></div>}>
        {rej && <div className="space-y-3 text-[13px]">
          <p>“<b>{rej.title}</b>” rad etiladi. Sabab sotuvchiga ko‘rsatiladi va u kampaniyani tahrirlab qayta yuborishi mumkin.</p>
          <div className="flex flex-wrap gap-1.5">{REASONS.map((x) => <button key={x} type="button" onClick={() => setReason(x)} className={`rounded-lg border px-2 py-1 text-[12px] ${reason === x ? 'border-[#0F766E] bg-[#F0FDFA]' : 'border-[#E6EEF0]'}`}>{x}</button>)}</div>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={300} placeholder="Sababni yozing…" className="w-full rounded-xl border border-[#E6EEF0] px-3 py-2" />
        </div>}
      </Modal>
    </div>
  )
}
