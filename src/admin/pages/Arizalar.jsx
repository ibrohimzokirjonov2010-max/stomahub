import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, FileText, XCircle } from 'lucide-react'
import { adminListApplications, adminReviewApplication, signDocs } from '../../apply/api'
import { parseGeo } from '../../components/MapPicker'
import { Btn, FilterTabs, PageHeader } from '../components/ui'
import Modal from '../components/Modal'

const ST = {
  pending: ['Kutilmoqda', 'bg-[#FFF7E6] text-[#B7791F]'],
  approved: ['Tasdiqlangan', 'bg-[#E7F8F1] text-[#0F766E]'],
  rejected: ['Rad etilgan', 'bg-[#FDECEC] text-[#C53030]'],
}
const LEGAL = { yatt: 'YaTT', mchj: 'MChJ' }
const dt = (s) => (s ? new Date(s).toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—')
const Pill = ({ s }) => <span className={`inline-flex rounded-full px-2.5 py-1 text-[12px] font-semibold ${ST[s]?.[1] || ''}`}>{ST[s]?.[0] || s}</span>

/** Reusable for organizers later: <Arizalar kind="organizer" /> */
export default function Arizalar({ kind = 'seller' }) {
  const [status, setStatus] = useState('pending')
  const [state, setState] = useState({ loading: true, rows: [], error: '' })
  const [open, setOpen] = useState(null)
  const load = useCallback(async () => {
    setState((x) => ({ ...x, loading: true }))
    const r = await adminListApplications(kind, status === 'all' ? '' : status)
    setState({ loading: false, rows: r.data, error: r.ok ? '' : r.error })
  }, [kind, status])
  useEffect(() => { load() }, [load])

  return (
    <div data-testid="admin-arizalar">
      <PageHeader title={kind === 'seller' ? 'Sotuvchi arizalari' : 'Tashkilotchi arizalari'} subtitle="Hujjatlarni tekshiring, tasdiqlang yoki sababini yozib rad eting" />
      <FilterTabs value={status} onChange={setStatus} tabs={[{ id: 'pending', label: 'Kutilmoqda' }, { id: 'approved', label: 'Tasdiqlangan' }, { id: 'rejected', label: 'Rad etilgan' }, { id: 'all', label: 'Barchasi' }]} />
      {state.error && <div className="mt-4 rounded-xl bg-[#FDECEC] px-4 py-3 text-[13.5px] text-[#C53030]">{state.error}</div>}
      <div className="mt-4 overflow-hidden rounded-2xl border border-[#E6EEF0] bg-white">
        {state.loading ? <div className="p-8 text-center text-[14px] text-[#6B7A88]">Yuklanmoqda…</div>
          : !state.rows.length ? <div className="p-8 text-center text-[14px] text-[#6B7A88]">Arizalar yo‘q</div>
            : state.rows.map((r) => (
              <button key={r.id} type="button" data-testid="app-row" onClick={() => setOpen(r)} className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 border-b border-[#EEF2F4] px-4 py-3.5 text-left last:border-0 hover:bg-[#F8FBFC]">
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-[15px] text-[#10283F]">{r.shop_name}</b>
                  <span className="block truncate text-[13px] text-[#6B7A88]">{r.full_name} · {r.phone} · {LEGAL[r.legal_type] || '—'} {r.stir}</span>
                </span>
                <span className="text-[12.5px] text-[#6B7A88]">{dt(r.created_at)}</span>
                <Pill s={r.status} />
              </button>
            ))}
      </div>
      <ReviewModal row={open} onClose={() => setOpen(null)} onDone={() => { setOpen(null); load() }} />
    </div>
  )
}

function ReviewModal({ row, onClose, onDone }) {
  const [docs, setDocs] = useState([])
  const [reason, setReason] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  useEffect(() => {
    setReason(''); setRejecting(false); setErr(''); setDocs([])
    if (row?.docs?.length) signDocs(row.docs).then(setDocs)
  }, [row])
  if (!row) return null
  const act = async (approve) => {
    if (!approve && reason.trim().length < 3) return setErr('Rad etish sababini yozing (kamida 3 belgi).')
    setBusy(true); setErr('')
    const r = await adminReviewApplication(row.id, approve, reason.trim())
    setBusy(false)
    if (!r.ok) return setErr(r.error)
    onDone()
  }
  const kv = [
    ['Egasi', row.full_name], ['Telefon', row.phone], ['Email', row.email], ['Do‘kon', row.shop_name], ['Kategoriya', row.category],
    ['Hudud', row.region], ['Manzil', parseGeo(row.address || '').text], ['Instagram', row.instagram], ['Telegram', row.telegram], ['Sayt', row.website],
    ['Yuridik shakl', LEGAL[row.legal_type]], ['STIR', row.stir], ['Yuborilgan', dt(row.created_at)],
  ]
  const pending = row.status === 'pending'
  return (
    <Modal open onClose={onClose} title={row.shop_name} subtitle={<Pill s={row.status} />} sheet
      footer={pending && (
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end" data-testid="review-actions">
          {rejecting
            ? <><Btn onClick={() => setRejecting(false)} disabled={busy}>Bekor qilish</Btn><Btn tone="danger" data-testid="confirm-reject" onClick={() => act(false)} disabled={busy} className="!bg-[#C53030] !text-white"><XCircle className="size-4" />Rad etish</Btn></>
            : <><Btn data-testid="reject" onClick={() => setRejecting(true)} disabled={busy}><XCircle className="size-4 text-[#C53030]" />Rad etish</Btn><Btn tone="primary" data-testid="approve" onClick={() => act(true)} disabled={busy}><CheckCircle2 className="size-4" />Tasdiqlash</Btn></>}
        </div>
      )}>
      <dl className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
        {kv.map(([k, v]) => <div key={k} className="min-w-0"><dt className="text-[12px] text-[#6B7A88]">{k}</dt><dd className="break-words text-[14px] font-medium text-[#10283F]">{v || '—'}</dd></div>)}
      </dl>
      {row.description && <p className="mt-3 rounded-xl bg-[#F8FBFC] p-3 text-[13.5px] text-[#3D4E5F]">{row.description}</p>}
      <h4 className="mt-4 text-[14px] font-bold text-[#10283F]">Hujjatlar</h4>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {(docs.length ? docs : row.docs || []).map((d) => (
          <a key={d.path} href={d.url || undefined} target="_blank" rel="noreferrer" data-testid="doc-link" className="flex items-center gap-3 rounded-xl border border-[#E6EEF0] p-3 hover:border-[#0F766E]">
            <FileText className="size-5 shrink-0 text-[#0F766E]" />
            <span className="min-w-0"><b className="block truncate text-[13.5px]">{d.label}</b><span className="block truncate text-[12px] text-[#6B7A88]">{d.name}</span></span>
          </a>
        ))}
      </div>
      {row.status === 'rejected' && <p className="mt-3 text-[13.5px] text-[#C53030]">Sabab: {row.reject_reason}</p>}
      {rejecting && (
        <textarea autoFocus data-testid="reject-reason-input" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Rad etish sababi (arizachiga ko‘rsatiladi)"
          className="mt-4 w-full rounded-xl border border-[#DCE5E7] p-3 text-[14px] outline-none focus:border-[#0F766E]" />
      )}
      {err && <p data-testid="review-error" className="mt-3 text-[13.5px] text-[#C53030]">{err}</p>}
    </Modal>
  )
}
