import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminQueue, adminReview } from '../api'
import { PRODUCT_STATUS, som } from '../format'

/** Mavjud /admin/mahsulotlar mantig‘i — yangi admin layout ichida. */
export default function Mahsulotlar() {
  const [state, setState] = useState({ loading: true, error: '', rows: [] })
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState('')
  const [reasons, setReasons] = useState({})

  const [tab, setTab] = useState('review')
  const counts = state.rows.reduce((a, r) => ({ ...a, [r.status]: (a[r.status] || 0) + 1 }), {})
  const shown = state.rows.filter((r) => tab === 'all' || r.status === tab)
  const load = () => {
    setState((s) => ({ ...s, loading: true, error: '' }))
    adminQueue()
      .then((rows) => setState({ loading: false, error: '', rows: rows || [] }))
      .catch((e) => setState({ loading: false, error: e.message, rows: [] }))
  }
  useEffect(() => { load() }, [])

  async function act(row, approve) {
    const reason = (reasons[row.id] || '').trim()
    if (!approve && reason.length < 3) return setMsg('Rad etish sababini yozing (kamida 3 belgi).')
    setBusy(row.id)
    setMsg('')
    try {
      await adminReview(row.id, approve, reason)
      setMsg(approve ? `“${row.name}” tasdiqlandi.` : `“${row.name}” rad etildi.`)
      load()
    } catch (e) {
      setMsg(e.message)
    } finally {
      setBusy('')
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold tracking-tight text-[#10283F]">Mahsulotlarni tasdiqlash</h1>
          <p className="mt-1 text-[14px] text-[#5C6E80]">Tekshiruvdagi mahsulotlarni tasdiqlang yoki rad eting</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/tasdiqlashlar" className="text-[13px] font-semibold text-[#0F766E]">Tasdiqlashlar →</Link>
          <button type="button" onClick={load} className="h-10 rounded-xl border border-[#E6EEF0] bg-white px-4 text-[13px] font-semibold text-[#0F766E]">Yangilash</button>
        </div>
      </div>
      {msg && <p role="status" className="mt-3 rounded-xl bg-[#eef8f6] px-3 py-2 text-[13px]">{msg}</p>}
      {state.loading && <p className="mt-6 text-[#5C6E80]">Yuklanmoqda…</p>}
      {state.error && <p role="alert" className="mt-6 text-[#b42318]">{state.error}</p>}
      {!state.loading && !state.error && !state.rows.length && (
        <p className="mt-6 rounded-2xl border border-dashed px-4 py-10 text-center text-[#8A9AA8]">Tekshiruvda mahsulot yo‘q.</p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {[['review', 'Tekshiruvda'], ['active', 'Faol'], ['rejected', 'Rad etilgan'], ['all', 'Barchasi']].map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)}
            className={`h-9 rounded-full px-4 text-[13px] font-semibold ${tab === id ? 'bg-[#0F766E] text-white' : 'border border-[#E6EEF0] bg-white text-[#3D4E5F]'}`}>
            {label} ({id === 'all' ? state.rows.length : counts[id] || 0})
          </button>
        ))}
      </div>
      {!state.loading && !state.error && state.rows.length > 0 && !shown.length && (
        <p className="mt-6 rounded-2xl border border-dashed px-4 py-10 text-center text-[#8A9AA8]">Bu bo‘limda mahsulot yo‘q.</p>
      )}
      <ul className="mt-4 flex flex-col gap-3">
        {shown.map((row) => (
          <li key={row.id} className="flex gap-3 rounded-2xl border border-[#E6EEF0] bg-white p-3 shadow-sm">
            {row.image_url
              ? <img src={row.image_url} alt="" className="size-20 shrink-0 rounded-lg object-cover" />
              : <div className="size-20 shrink-0 rounded-lg bg-[#f1f5f4]" />}
            <div className="min-w-0 flex-1">
              <p className="font-bold text-[#10283F]">{row.name}</p>
              <p className="text-[12px] text-[#5C6E80]">{row.shop_name} · {row.category} · {row.brand || '—'} · {som(row.price)} · {row.stock} dona</p>
              {row.description && <p className="mt-1 line-clamp-2 text-[12px] text-[#3D4E5F]">{row.description}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${row.status === 'review' ? 'bg-[#FFEDD5] text-[#C2410C]' : row.status === 'active' ? 'bg-[#E3F4F1] text-[#0F766E]' : 'bg-[#FDE8E8] text-[#b42318]'}`}>{PRODUCT_STATUS[row.status]?.label || row.status}</span>
                {row.status === 'rejected' && row.reject_reason && <span className="text-[12px] text-[#b42318]">Sabab: {row.reject_reason}</span>}
                {row.status === 'review' && (<>
                <button type="button" disabled={busy === row.id} onClick={() => act(row, true)} className="h-9 rounded-lg bg-[#0F766E] px-4 text-[13px] font-semibold text-white disabled:opacity-60">Tasdiqlash</button>
                <input value={reasons[row.id] || ''} onChange={(e) => setReasons((r) => ({ ...r, [row.id]: e.target.value }))} placeholder="Rad etish sababi" className="h-9 min-w-0 flex-1 rounded-lg border border-[#e6ebf2] px-2 text-[13px]" />
                <button type="button" disabled={busy === row.id} onClick={() => act(row, false)} className="h-9 rounded-lg border border-[#f3c2c2] px-4 text-[13px] font-semibold text-[#b42318] disabled:opacity-60">Rad etish</button>
                </>)}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
