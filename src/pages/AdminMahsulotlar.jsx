import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSession } from '../sessionStore'
import { adminQueue, adminReview } from '../buyerApi'
import { som } from '../marketData'

// Minimal moderatsiya: faqat role = 'admin'. Server tomonda ham is_admin() tekshiriladi.
export default function AdminMahsulotlar() {
  const session = useSession()
  const isAdmin = session.profile?.role === 'admin'
  const [state, setState] = useState({ loading: true, error: '', rows: [] })
  const [busy, setBusy] = useState('')
  const [reasons, setReasons] = useState({})
  const [msg, setMsg] = useState('')

  const load = () => {
    setState((s) => ({ ...s, loading: true, error: '' }))
    adminQueue().then((rows) => setState({ loading: false, error: '', rows }), (e) => setState({ loading: false, error: e.message, rows: [] }))
  }
  useEffect(() => { if (isAdmin) load() }, [isAdmin])

  if (session.status === 'loading') return <Shell><p className="text-muted">Yuklanmoqda…</p></Shell>
  if (!isAdmin) return <Shell><p className="text-[#b42318]">Bu sahifa faqat administratorlar uchun.</p><Link to="/" className="mt-3 inline-block font-semibold text-[#0F766E]">Bosh sahifa</Link></Shell>

  const act = async (row, approve) => {
    const reason = (reasons[row.id] || '').trim()
    if (!approve && reason.length < 3) return setMsg('Rad etish sababini yozing (kamida 3 belgi).')
    setBusy(row.id)
    setMsg('')
    try {
      await adminReview(row.id, approve, reason)
      setMsg(approve ? `“${row.name}” tasdiqlandi va marketplace’da ko‘rinadi.` : `“${row.name}” rad etildi.`)
      load()
    } catch (e) {
      setMsg(e.message)
    } finally {
      setBusy('')
    }
  }

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-extrabold text-ink">Mahsulotlarni tasdiqlash</h1>
        <button type="button" onClick={load} className="text-[13px] font-semibold text-[#0F766E]">Yangilash</button>
      </div>
      {msg && <p role="status" className="mt-3 rounded-xl bg-[#eef8f6] px-3 py-2 text-[13px] text-ink">{msg}</p>}
      {state.loading && <p className="mt-6 text-muted">Yuklanmoqda…</p>}
      {state.error && <p role="alert" className="mt-6 text-[#b42318]">{state.error}</p>}
      {!state.loading && !state.error && !state.rows.length && <p className="mt-6 rounded-2xl border border-dashed px-4 py-10 text-center text-muted">Tekshiruvda mahsulot yo‘q.</p>}
      <ul className="mt-4 flex flex-col gap-3">
        {state.rows.map((row) => (
          <li key={row.id} className="flex gap-3 rounded-2xl bg-white p-3 shadow-card">
            {row.image_url ? <img src={row.image_url} alt="" className="size-20 shrink-0 rounded-lg object-cover" /> : <div className="size-20 shrink-0 rounded-lg bg-[#f1f5f4]" />}
            <div className="min-w-0 flex-1">
              <p className="font-bold text-ink">{row.name}</p>
              <p className="text-[12px] text-muted">{row.shop_name} · {row.category} · {row.brand || '—'} · {som(row.price)} · {row.stock} dona</p>
              {row.description && <p className="mt-1 line-clamp-2 text-[12px] text-ink-2">{row.description}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button type="button" disabled={busy === row.id} onClick={() => act(row, true)} className="h-9 rounded-lg bg-[#0F766E] px-4 text-[13px] font-semibold text-white disabled:opacity-60">Tasdiqlash</button>
                <input value={reasons[row.id] || ''} onChange={(e) => setReasons((r) => ({ ...r, [row.id]: e.target.value }))} placeholder="Rad etish sababi" className="h-9 min-w-0 flex-1 rounded-lg border border-[#e6ebf2] px-2 text-[13px]" />
                <button type="button" disabled={busy === row.id} onClick={() => act(row, false)} className="h-9 rounded-lg border border-[#f3c2c2] px-4 text-[13px] font-semibold text-[#b42318] disabled:opacity-60">Rad etish</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Shell>
  )
}

function Shell({ children }) {
  return <div className="mx-auto max-w-[900px] px-4 py-6">{children}</div>
}
