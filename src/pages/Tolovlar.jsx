import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Banknote, Building2, Calendar, Check, ChevronDown, ChevronLeft, ChevronRight, CreditCard, Download, Info, MoreHorizontal, Pencil, Plus, Printer, Search, SlidersHorizontal, Wallet, X,
} from 'lucide-react'
import ShopLayout from '../components/market/ShopLayout'
import { useBemorlar } from '../bemorData'
import {
  DAILY, MONTHLY, METHODS, STATUSES, WEEKLY, detailOf, methodOf, planFor, seedPayments, som,
} from '../tolovData'

const KPI = [
  { label: 'Jami tushum', value: '52 400 000 so‘m', delta: '+12%', up: true, icon: Wallet, tint: '#e7f7f4', color: '#0f9b8e' },
  { label: 'Naqd tushum', value: '8 700 000 so‘m', delta: '+5%', up: true, icon: Banknote, tint: '#e8f8ee', color: '#1f9d55' },
  { label: 'Karta to‘lovlari', value: '28 300 000 so‘m', delta: '+18%', up: true, icon: CreditCard, tint: '#e8f1ff', color: '#2f6fed' },
  { label: 'Qolgan qarzdorlik', value: '14 600 000 so‘m', delta: '-8%', up: false, icon: CreditCard, tint: '#fdecec', color: '#e11d48', card: '#fff6f6' },
]

const DONUT = [
  { id: 'Karta', label: 'Karta', sum: '28 300 000', pct: 54, dot: '#2fbf9b' },
  { id: 'Click', label: 'Click', sum: '12 600 000', pct: 24, dot: '#7b68b8' },
  { id: 'Payme', label: 'Payme', sum: '7 800 000', pct: 15, dot: '#3d74d6' },
  { id: 'Naqd', label: 'Naqd', sum: '7 400 000', pct: 7, dot: '#f0b429' },
]

const QUICK = [
  { id: 'Click', label: 'Click', bg: '#e9f9ef', color: '#12a150' },
  { id: 'Payme', label: 'Payme', bg: '#e7f0ff', color: '#2f6fe0' },
  { id: 'Karta', label: 'Karta', bg: '#f3e9ff', color: '#7c5cbf' },
  { id: 'Naqd', label: 'Naqd', bg: '#fff4d6', color: '#e0a100' },
]

export default function Tolovlar() {
  const patients = useBemorlar()
  const [rows, setRows] = useState(seedPayments)
  const [headerQ, setHeaderQ] = useState('')
  const [q, setQ] = useState('')
  const [method, setMethod] = useState('all')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [per, setPer] = useState(10)
  const [chart, setChart] = useState('kun')
  const [filters, setFilters] = useState(false)
  const [menu, setMenu] = useState(null)
  const [open, setOpen] = useState(false)
  const [preset, setPreset] = useState('Naqd')
  const [edit, setEdit] = useState(null)
  const [detail, setDetail] = useState(null)
  const [rangeOpen, setRangeOpen] = useState(false)

  const filtered = useMemo(() => {
    const query = `${headerQ} ${q}`.trim().toLowerCase()
    return rows.filter((r) => {
      const blob = `${r.name} ${r.phone} ${r.service} ${r.receipt}`.toLowerCase()
      return (method === 'all' || r.method === method) && (status === 'all' || r.status === status) && (!query || blob.includes(query))
    })
  }, [rows, headerQ, q, method, status])

  const editorial = !`${headerQ} ${q}`.trim() && method === 'all' && status === 'all'
  const pages = Math.max(1, Math.ceil(filtered.length / per))
  const safePage = Math.min(page, pages)
  const slice = filtered.slice((safePage - 1) * per, safePage * per)
  const openRow = rows.find((r) => r.id === detail) || null

  const openNew = (methodId) => {
    setEdit(null)
    setPreset(methodId || 'Naqd')
    setMenu(null)
    setOpen(true)
  }

  const save = (payment) => {
    setRows((list) => {
      const i = list.findIndex((r) => r.id === payment.id)
      if (i >= 0) {
        const next = list.slice()
        next[i] = { ...list[i], ...payment }
        return next
      }
      return [payment, ...list]
    })
    setPage(1)
    setOpen(false)
    setEdit(null)
  }

  const refund = (id) => {
    setRows((list) => list.map((r) => (r.id === id ? { ...r, status: 'Qaytarilgan' } : r)))
    setMenu(null)
  }

  const shares = editorial
    ? DONUT
    : METHODS.filter((m) => m.id !== 'Otkazma').map((m) => {
        const sum = filtered.filter((r) => r.method === m.id).reduce((s, r) => s + r.amount, 0)
        return { id: m.id, label: m.label, sum: sum.toLocaleString('ru-RU').replace(/\u00a0/g, ' '), raw: sum, dot: m.dot, pct: 0 }
      }).map((m, _, arr) => {
        const total = arr.reduce((s, x) => s + x.raw, 0) || 1
        return { ...m, pct: Math.round((m.raw / total) * 100) }
      })

  const donutTotal = editorial ? '52.4M' : `${(filtered.reduce((s, r) => s + r.amount, 0) / 1e6).toFixed(1)}M`
  const paidSum = filtered.filter((r) => r.status === 'Tolandi').reduce((s, r) => s + r.amount, 0)
  const allSum = filtered.reduce((s, r) => s + r.amount, 0) || 1
  const progress = editorial ? 40 : Math.min(100, Math.round((paidSum / allSum) * 100))

  return (
    <ShopLayout active="tolov" placeholder="Bemor, telefon, ID yoki xizmat nomi bo‘yicha qidiring..." onQuery={setHeaderQ}>
      <div className="pb-4 pt-4" onClick={() => { setMenu(null); setRangeOpen(false) }}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-bold leading-none text-ink">To‘lovlar</h1>
            <p className="mt-1 text-[13px] text-muted">Moliyaviy operatsiyalar va bemor to‘lovlari</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <button type="button" onClick={(e) => { e.stopPropagation(); setRangeOpen((v) => !v) }} className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-white px-3 text-[12.5px] font-semibold">
                <Calendar className="size-4 text-muted" /> 01.10.2026 – 31.10.2026 <ChevronDown className="size-3.5 text-muted" />
              </button>
              {rangeOpen && (
                <div className="absolute right-0 z-20 mt-1 w-56 rounded-xl border border-line bg-white p-3 text-[12px] shadow-card" onClick={(e) => e.stopPropagation()}>
                  <p className="font-semibold text-ink">Hisobot davri</p>
                  <p className="mt-1 text-muted">01.10.2026 – 31.10.2026</p>
                </div>
              )}
            </div>
            <button type="button" onClick={() => openNew('Naqd')} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-sea px-3 text-[12.5px] font-semibold text-white"><Plus className="size-4" /> Yangi to‘lov</button>
          </div>
        </div>

        <div className="tolov-stats mt-4">
          {KPI.map((k) => (
            <article key={k.label} className="flex items-center gap-3 rounded-2xl border border-line px-3 py-3 shadow-card" style={{ background: k.card || '#fff' }}>
              <span className="grid size-10 shrink-0 place-items-center rounded-xl" style={{ background: k.tint, color: k.color }}><k.icon className="size-5" /></span>
              <div className="min-w-0">
                <p className="text-[12px] text-muted">{k.label}</p>
                <p className="truncate text-[15px] font-bold text-ink">{editorial ? k.value : som(k.label.startsWith('Qolgan') ? filtered.filter((r) => r.status === 'Qisman').reduce((s, r) => s + Math.round(r.amount * 0.35), 0) : filtered.filter((r) => (k.label.startsWith('Naqd') ? r.method === 'Naqd' : k.label.startsWith('Karta') ? r.method === 'Karta' : r.status === 'Tolandi')).reduce((s, r) => s + r.amount, 0))}</p>
                <p className="text-[11px] font-semibold" style={{ color: k.up ? '#16a34a' : '#e11d48' }}>{k.delta} <span className="font-normal text-muted">o‘tgan oyga nisbatan</span></p>
              </div>
            </article>
          ))}
        </div>

        <div className="tolov-split mt-3">
          <div className="min-w-0 space-y-3">
            <section className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-[15px] font-bold">Tushum dinamikasi</h2>
                <div className="flex rounded-lg bg-[#f4f7fb] p-0.5">
                  {[['kun', 'Kunlik'], ['hafta', 'Haftalik'], ['oy', 'Oylik']].map(([id, label]) => (
                    <button key={id} type="button" onClick={() => setChart(id)} className={`h-7 rounded-md px-3 text-[12px] font-semibold ${chart === id ? 'bg-sea text-white' : 'text-ink-2'}`}>{label}</button>
                  ))}
                </div>
              </div>
              <Bars mode={chart} />
            </section>

            <section className="rounded-2xl border border-line bg-white shadow-card">
              <div className="flex flex-wrap items-center gap-2 px-4 py-3">
                <h2 className="mr-auto text-[15px] font-bold">So‘nggi to‘lovlar</h2>
                <label className="flex h-9 min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-line px-3 sm:max-w-[280px]">
                  <Search className="size-4 text-muted" />
                  <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Bemor nomi, telefon, xizmat..." className="w-full bg-transparent text-[12.5px] outline-none placeholder:text-muted" />
                </label>
                <button type="button" onClick={(e) => { e.stopPropagation(); setFilters((v) => !v) }} className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[12.5px] font-semibold ${filters ? 'border-sea bg-sea-50 text-sea' : 'border-line'}`}>
                  <SlidersHorizontal className="size-4" /> Filtrlar
                </button>
              </div>
              {filters && (
                <div className="flex flex-wrap gap-2 px-4 pb-3">
                  <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="h-8 rounded-lg border border-line bg-white px-2 text-[12px]">
                    <option value="all">Barcha holat</option>
                    <option value="Tolandi">To‘landi</option>
                    <option value="Qisman">Qisman</option>
                    <option value="Qaytarilgan">Qaytarilgan</option>
                  </select>
                  <select value={method} onChange={(e) => { setMethod(e.target.value); setPage(1) }} className="h-8 rounded-lg border border-line bg-white px-2 text-[12px]">
                    <option value="all">Barcha usul</option>
                    {METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                  </select>
                </div>
              )}
              <div className="bemor-scroll">
                <table className="bemor-table text-[12.5px]">
                  <thead>
                    <tr className="border-y border-line text-left text-[11px] text-muted">
                      {['#', 'Sana', 'Bemor', 'Xizmat', 'Summa', 'To‘lov usuli', 'Holat', 'Amallar'].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {slice.map((r, i) => {
                      const st = STATUSES[r.status]
                      const md = methodOf(r.method)
                      return (
                        <tr key={r.id} onClick={() => setDetail(r.id)} className="cursor-pointer border-b border-line last:border-0 hover:bg-[#f8fbfd]">
                          <td className="px-3 py-2 text-muted">{(safePage - 1) * per + i + 1}</td>
                          <td className="whitespace-nowrap px-3 py-2">{r.date}</td>
                          <td className="px-3 py-2">
                            <span className="flex min-w-0 items-center gap-2">
                              <Face src={r.photo} name={r.name} className="size-7 shrink-0 rounded-full" />
                              <span className="truncate font-semibold">{r.name}</span>
                            </span>
                          </td>
                          <td className="px-3 py-2 text-ink-2">{r.service}</td>
                          <td className="whitespace-nowrap px-3 py-2 font-semibold">{som(r.amount)}</td>
                          <td className="px-3 py-2"><span className="rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ background: md.bg, color: md.color }}>{md.label}</span></td>
                          <td className="px-3 py-2"><span className="rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ background: st.bg, color: st.color }}>{st.label}</span></td>
                          <td className="px-3 py-2">
                            <button type="button" aria-label="Amallar" onClick={(e) => {
                              e.stopPropagation()
                              const box = e.currentTarget.getBoundingClientRect()
                              setMenu(menu?.id === r.id ? null : { id: r.id, top: box.bottom + 4, left: Math.max(8, box.right - 144) })
                            }} className="grid size-7 place-items-center rounded-md text-muted hover:bg-[#f3f6fb]"><MoreHorizontal className="size-4" /></button>
                          </td>
                        </tr>
                      )
                    })}
                    {slice.length === 0 && <tr><td colSpan={8} className="px-3 py-8 text-center text-muted">To‘lov topilmadi</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center gap-2 px-4 py-3 text-[12px] text-muted">
                <span>Jami: {filtered.length} ta to‘lov</span>
                <div className="mx-auto flex items-center gap-1">
                  <button type="button" onClick={() => setPage((n) => Math.max(1, n - 1))} className="grid size-7 place-items-center rounded-md border border-line" aria-label="Oldingi"><ChevronLeft className="size-3.5" /></button>
                  {pager(safePage, pages).map((n, i) => n === '...'
                    ? <span key={`d${i}`} className="px-1">...</span>
                    : <button key={n} type="button" onClick={() => setPage(n)} className={`grid size-7 place-items-center rounded-md ${n === safePage ? 'bg-sea text-white' : 'border border-line'}`}>{n}</button>)}
                  <button type="button" onClick={() => setPage((n) => Math.min(pages, n + 1))} className="grid size-7 place-items-center rounded-md border border-line" aria-label="Keyingi"><ChevronRight className="size-3.5" /></button>
                </div>
                <label className="flex items-center gap-1.5">
                  Sahifada:
                  <select value={per} onChange={(e) => { setPer(Number(e.target.value)); setPage(1) }} className="h-7 rounded-md border border-line bg-white px-1 text-ink">
                    {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
              </div>
            </section>
          </div>

          <aside className="min-w-0 space-y-3">
            <section className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-[14px] font-bold">To‘lov usullari bo‘yicha</h2>
                <span className="inline-flex h-7 items-center gap-1 rounded-lg border border-line px-2 text-[11px] text-muted">Davom etmoqda <ChevronDown className="size-3" /></span>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <div className="relative grid size-[148px] shrink-0 place-items-center rounded-full" style={{ background: conic(shares) }}>
                  <div className="grid size-[92px] place-items-center rounded-full bg-white text-center">
                    <div>
                      <b className="block text-[16px] leading-none">{donutTotal}</b>
                      <span className="text-[11px] text-muted">so‘m</span>
                    </div>
                  </div>
                </div>
                <ul className="min-w-0 flex-1 space-y-2 text-[12px]">
                  {shares.map((s) => (
                    <li key={s.id} className="flex items-center gap-2">
                      <span className="size-2 shrink-0 rounded-full" style={{ background: s.dot }} />
                      <span className="w-12 shrink-0">{s.label}</span>
                      <span className="min-w-0 flex-1 truncate text-muted">{s.sum}</span>
                      <b>{s.pct}%</b>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-4 border-t border-line pt-3">
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="font-semibold">Bajarilish darajasi</span>
                  <b>{progress}%</b>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e8eef5]">
                  <div className="h-full rounded-full bg-sea" style={{ width: `${progress}%` }} />
                </div>
                <button type="button" onClick={() => openNew('Naqd')} className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-sea text-[12.5px] font-semibold text-white"><Pencil className="size-4" /> Rejani tahrirlash</button>
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => downloadReport(filtered)} className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 text-[12px] font-semibold text-ink-2"><Download className="size-3.5" /> PDF yuklab olish</button>
                  <button type="button" onClick={() => window.print()} className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 text-[12px] font-semibold text-ink-2"><Printer className="size-3.5" /> Chop etish</button>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <h2 className="text-[14px] font-bold">Tezkor to‘lov</h2>
              <div className="tolov-quick mt-3">
                {QUICK.map((qitem) => (
                  <button key={qitem.id} type="button" onClick={() => openNew(qitem.id)} className="rounded-xl border border-line px-1 py-3 text-center hover:border-sea">
                    <Mark id={qitem.id} bg={qitem.bg} color={qitem.color} />
                    <span className="mt-1.5 block text-[11px] font-semibold">{qitem.label}</span>
                  </button>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>

      {menu && (
        <div className="fixed z-40 w-36 rounded-xl border border-line bg-white p-1 text-[12px] shadow-card" style={{ top: menu.top, left: menu.left }} onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => { setDetail(menu.id); setMenu(null) }} className="block w-full rounded-lg px-2 py-1.5 text-left hover:bg-[#f4f7fb]">Ko‘rish</button>
          <button type="button" onClick={() => { const r = rows.find((x) => x.id === menu.id); setEdit(r); setPreset(r.method); setOpen(true); setMenu(null) }} className="block w-full rounded-lg px-2 py-1.5 text-left hover:bg-[#f4f7fb]">Tahrirlash</button>
          <button type="button" onClick={() => refund(menu.id)} className="block w-full rounded-lg px-2 py-1.5 text-left text-[#dc2626] hover:bg-[#fff5f5]">Qaytarish</button>
        </div>
      )}
      {open && (
        <PayModal
          key={edit?.id || preset}
          patients={patients}
          preset={preset}
          edit={edit}
          onClose={() => { setOpen(false); setEdit(null) }}
          onSave={save}
        />
      )}
      {openRow && <Drawer row={openRow} onClose={() => setDetail(null)} onEdit={() => { setEdit(openRow); setPreset(openRow.method); setDetail(null); setOpen(true) }} onRefund={() => { refund(openRow.id); setDetail(null) }} />}
    </ShopLayout>
  )
}

function pager(page, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1)
  if (page <= 4) return [1, 2, 3, 4, 5, '...', pages]
  if (page >= pages - 3) return [1, '...', pages - 4, pages - 3, pages - 2, pages - 1, pages]
  return [1, '...', page - 1, page, page + 1, '...', pages]
}

function conic(shares) {
  let cursor = 0
  const parts = shares.map((s) => {
    const next = cursor + s.pct
    const piece = `${s.dot} ${cursor}% ${next}%`
    cursor = next
    return piece
  })
  if (cursor < 100) parts.push(`#e8eef5 ${cursor}% 100%`)
  return `conic-gradient(${parts.join(', ')})`
}

function Bars({ mode }) {
  const values = mode === 'hafta' ? WEEKLY : mode === 'oy' ? MONTHLY : DAILY
  const max = mode === 'kun' ? 8 : Math.max(...values)
  const labels = mode === 'kun'
    ? ['1 okt', '5 okt', '10 okt', '15 okt', '20 okt', '25 okt', '31 okt']
    : mode === 'hafta'
      ? ['1-hafta', '2-hafta', '3-hafta', '4-hafta', '5-hafta']
      : ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']
  return (
    <div className="mt-3">
      <div className="flex gap-2">
        <div className="flex h-[156px] flex-col justify-between pb-1 text-[10px] text-muted">
          {(mode === 'kun' ? ['8M', '6M', '4M', '2M', '0'] : ['', '', '', '', '0']).map((l, i) => <span key={i}>{mode === 'kun' ? l : (i === 4 ? '0' : '')}</span>)}
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="flex h-[156px] items-end gap-[3px] border-b border-line" style={{ backgroundImage: 'repeating-linear-gradient(to top, transparent 0, transparent calc(25% - 1px), #eef2f6 calc(25% - 1px), #eef2f6 25%)' }}>
            {values.map((v, i) => (
              <div key={i} title={`${v}${mode === 'kun' ? ' mln' : ''}`} className="min-w-0 flex-1 rounded-t-[3px]" style={{ height: `${Math.max(4, (v / max) * 100)}%`, background: i % 4 === 0 ? '#149e86' : i % 3 === 0 ? '#3ec6b0' : '#7ed9c8' }} />
            ))}
          </div>
        </div>
      </div>
      <div className="ml-8 mt-1 flex justify-between text-[10px] text-muted">
        {labels.map((l) => <span key={l}>{l}</span>)}
      </div>
    </div>
  )
}

function Face({ src, name, className }) {
  const letters = name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('')
  if (!src) return <span className={`${className} grid place-items-center bg-sea-50 font-bold text-sea`}>{letters}</span>
  return <img src={src} alt="" className={`${className} object-cover`} />
}

function Mark({ id, bg, color }) {
  return (
    <span className="mx-auto grid size-9 place-items-center rounded-xl text-[15px] font-bold" style={{ background: bg, color }}>
      {id === 'Click' && 'C'}
      {id === 'Payme' && 'P'}
      {id === 'Karta' && <CreditCard className="size-4" />}
      {id === 'Naqd' && <Banknote className="size-4" />}
    </span>
  )
}

function downloadReport(rows) {
  const lines = ['Chek,Sana,Bemor,Xizmat,Summa,Usul,Holat', ...rows.slice(0, 50).map((r) => `${r.receipt},${r.date},${r.name},${r.service},${r.amount},${r.method},${STATUSES[r.status].label}`)]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'tolovlar-oktabr.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function PayModal({ patients, preset, edit, onClose, onSave }) {
  const picks = patients.filter((p) => p.photo).slice(0, 12)
  const [pid, setPid] = useState(edit?.patientId || 'malika-karimova')
  const [whoOpen, setWhoOpen] = useState(false)
  const [planOpen, setPlanOpen] = useState(false)
  const patient = patients.find((p) => p.id === pid) || picks[0]
  const plan = planFor(patient)
  const debt = Math.max(0, plan.plan - plan.paid)
  const [amount, setAmount] = useState(edit ? String(edit.amount) : String(debt || ''))
  const [date, setDate] = useState(edit?.date || '14.10.2024')
  const [method, setMethod] = useState(edit?.method || preset || 'Naqd')
  const [chek, setChek] = useState(edit?.chek ?? true)
  const [note, setNote] = useState(edit?.note || '')
  const [error, setError] = useState('')

  const choose = (id) => {
    const next = patients.find((p) => p.id === id)
    setPid(id)
    setWhoOpen(false)
    if (!edit && next) {
      const p = planFor(next)
      setAmount(String(Math.max(0, p.plan - p.paid)))
    }
  }

  const submit = () => {
    const sum = Number(String(amount).replace(/\D/g, ''))
    if (!patient || !sum || !date || !method) {
      setError('Bemor, summa, sana va to‘lov usuli majburiy.')
      return
    }
    onSave({
      id: edit?.id || `tl-${Date.now()}`,
      receipt: edit?.receipt || `TL-${String(330 + (Date.now() % 500)).padStart(5, '0')}`,
      date,
      time: edit?.time || new Date().toTimeString().slice(0, 5),
      name: patient.name,
      patientId: patient.id,
      photo: patient.photo,
      phone: patient.phone,
      service: plan.name,
      amount: sum,
      method,
      status: edit?.status || 'Tolandi',
      chek,
      note,
      detail: edit?.detail,
    })
  }

  return (
    <div className="bemor-shade" onClick={onClose}>
      <div className="bemor-dialog tolov-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="tolov-title">
        <div className="bemor-dialog-head flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 id="tolov-title" className="text-[18px] font-bold">{edit ? 'To‘lovni tahrirlash' : 'Yangi to‘lov qo‘shish'}</h2>
            <p className="mt-0.5 text-[12.5px] text-muted">Bemor to‘lovini kiriting</p>
          </div>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-[#f4f7fb]" aria-label="Yopish"><X className="size-4" /></button>
        </div>
        <div className="bemor-dialog-body space-y-4 px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Bemor" required>
              <button type="button" onClick={() => { setWhoOpen((v) => !v); setPlanOpen(false) }} className="flex h-14 w-full items-center gap-2 rounded-xl border border-line px-3 text-left">
                <Face src={patient?.photo} name={patient?.name || '?'} className="size-9 shrink-0 rounded-full" />
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-[13px]">{patient?.name}</b>
                  <span className="block truncate text-[11px] text-muted">{patient?.phone} · {patient?.age}</span>
                </span>
                <ChevronDown className="size-4 text-muted" />
              </button>
              {whoOpen && (
                <div className="absolute z-10 mt-1 max-h-52 w-full overflow-auto rounded-xl border border-line bg-white p-1 shadow-card">
                  {picks.map((p) => (
                    <button key={p.id} type="button" onClick={() => choose(p.id)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-[#f4f7fb]">
                      <Face src={p.photo} name={p.name} className="size-7 rounded-full" />
                      <span className="min-w-0"><b className="block truncate text-[12.5px]">{p.name}</b><span className="text-[11px] text-muted">{p.phone}</span></span>
                    </button>
                  ))}
                </div>
              )}
            </Field>
            <Field label="Davolash rejasi">
              <button type="button" onClick={() => { setPlanOpen((v) => !v); setWhoOpen(false) }} className="flex h-14 w-full items-center gap-2 rounded-xl border border-line px-3 text-left">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sea-50 text-sea"><Tooth /></span>
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-[13px]">{plan.name}</b>
                  <span className="block truncate text-[11px] text-muted">{plan.date} · {som(plan.plan)}</span>
                </span>
                <ChevronDown className="size-4 text-muted" />
              </button>
              {planOpen && <p className="absolute z-10 mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-[12px] shadow-card">{plan.name} tanlangan</p>}
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Sum label="Reja summasi" value={som(plan.plan)} />
            <Sum label="To‘langan" value={som(plan.paid)} tone="#17803d" />
            <Sum label="Qarz" value={som(debt)} tone="#e11d48" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Summa" required>
              <div className="flex h-11 items-center rounded-xl border border-line px-3">
                <input value={groupDigits(amount)} onChange={(e) => { setAmount(e.target.value.replace(/\D/g, '')); setError('') }} className="w-full bg-transparent text-[14px] font-semibold outline-none" inputMode="numeric" />
                <span className="text-[12px] text-muted">so‘m</span>
              </div>
            </Field>
            <Field label="Sana">
              <div className="flex h-11 items-center gap-2 rounded-xl border border-line px-3">
                <input value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-transparent text-[14px] outline-none" />
                <Calendar className="size-4 text-muted" />
              </div>
            </Field>
          </div>

          <div>
            <p className="mb-2 text-[12.5px] font-semibold">To‘lov usuli <span className="text-[#e11d48]">*</span></p>
            <div className="tolov-methods">
              {METHODS.map((m) => {
                const on = method === m.id
                return (
                  <button key={m.id} type="button" onClick={() => setMethod(m.id)} className="relative flex h-[72px] flex-col items-center justify-center gap-1 rounded-xl border bg-white text-[12px] font-semibold" style={{ borderColor: on ? '#1aa37a' : '#e7ecf3', boxShadow: on ? 'inset 0 0 0 1px #1aa37a' : 'none' }}>
                    {on && <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-[#1aa37a] text-white"><Check className="size-3" /></span>}
                    <MethodIcon id={m.id} />
                    {m.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex gap-2 rounded-xl bg-[#eef6ff] px-3 py-2.5 text-[12px] text-[#1d4e89]">
            <Info className="mt-0.5 size-4 shrink-0" />
            <p>Qarz summa to‘liq yopilsa, davolash rejasi avtomatik ravishda “Yakunlangan” holatiga o‘tadi.</p>
          </div>

          <button type="button" onClick={() => setChek((v) => !v)} className="flex items-center gap-3 text-left">
            <span className="relative h-6 w-11 rounded-full" style={{ background: chek ? '#1aa37a' : '#d5dde8' }}>
              <span className="absolute top-0.5 size-5 rounded-full bg-white shadow" style={{ left: chek ? 22 : 2 }} />
            </span>
            <span>
              <b className="block text-[13px]">Chek chiqarish</b>
              <span className="text-[12px] text-muted">To‘lov bo‘yicha fiskal chek chiqarish</span>
            </span>
          </button>

          <Field label="Izoh">
            <textarea value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder="To‘lov haqida qo‘shimcha ma’lumot (ixtiyoriy)..." className="h-20 w-full resize-none rounded-xl border border-line px-3 py-2 text-[13px] outline-none" />
            <span className="mt-1 block text-right text-[11px] text-muted">{note.length}/300</span>
          </Field>
          {error && <p className="text-[12px] font-semibold text-[#e11d48]">{error}</p>}
        </div>
        <div className="bemor-dialog-foot flex justify-end gap-2 border-t border-line px-5 py-3">
          <button type="button" onClick={onClose} className="h-10 rounded-xl border border-line px-4 text-[13px] font-semibold">Bekor qilish</button>
          <button type="button" onClick={submit} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#149e86] px-4 text-[13px] font-semibold text-white"><Check className="size-4" /> Saqlash</button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <label className="relative block text-[12.5px] font-semibold">
      {label} {required && <span className="text-[#e11d48]">*</span>}
      <div className="mt-1.5 font-normal">{children}</div>
    </label>
  )
}

function Sum({ label, value, tone }) {
  return (
    <div className="rounded-xl bg-[#f6f8fb] px-3 py-2.5">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="mt-0.5 text-[13px] font-bold" style={{ color: tone || '#0b1f3a' }}>{value}</p>
    </div>
  )
}

function MethodIcon({ id }) {
  if (id === 'Naqd') return <span className="grid size-7 place-items-center rounded-lg bg-[#e9f9ef] text-[#12a150]"><Banknote className="size-4" /></span>
  if (id === 'Karta') return <span className="grid size-7 place-items-center rounded-lg bg-[#e8f1ff] text-[#2f6fed]"><CreditCard className="size-4" /></span>
  if (id === 'Click') return <span className="grid size-7 place-items-center rounded-full bg-[#e8f1ff] text-[13px] font-bold text-[#2f6fed]">C</span>
  if (id === 'Payme') return <span className="grid size-7 place-items-center rounded-lg bg-[#e7eeff] text-[13px] font-bold text-[#2546b8]">P</span>
  return <span className="grid size-7 place-items-center rounded-lg bg-[#eef2f6] text-[#334155]"><Building2 className="size-4" /></span>
}

function Tooth() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M7.5 3.5c1.4 0 2.2 1 4.5 1s3.1-1 4.5-1C19 3.5 21 5.4 21 8c0 2.4-.7 4.6-1.6 6.6-.8 1.8-1.6 4-2.3 5.2-.5.8-1.6.3-1.8-.7L14.6 16h-1.2l-.7 3.1c-.2 1-1.3 1.5-1.8.7-.7-1.2-1.5-3.4-2.3-5.2C7.7 12.6 7 10.4 7 8c0-2.6 2-4.5 4.5-4.5z" transform="translate(-2 0)" />
    </svg>
  )
}

function groupDigits(value) {
  const digits = String(value || '').replace(/\D/g, '')
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

function Drawer({ row, onClose, onEdit, onRefund }) {
  const d = detailOf(row)
  const st = STATUSES[row.status]
  const paidLabel = row.status === 'Tolandi' ? 'To‘langan' : st.label
  const linesSum = d.lines.reduce((s, l) => s + l.sum, 0)
  return (
    <div className="tolov-shade" onClick={onClose}>
      <aside className="tolov-drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="tolov-detail-title">
        <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div>
            <h2 id="tolov-detail-title" className="text-[16px] font-bold">To‘lov tafsiloti</h2>
            <p className="mt-0.5 text-[12px] text-muted">Chek raqami: #{row.receipt}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-md px-2 py-1 text-[11px] font-semibold" style={{ background: st.bg, color: st.color }}>{paidLabel}</span>
            <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-[#f4f7fb]" aria-label="Yopish"><X className="size-4" /></button>
          </div>
        </div>
        <div className="tolov-drawer-body space-y-3 px-4 py-3">
          <div className="grid grid-cols-2 gap-2">
            <Tile kicker="Jami summa" value={som(d.total)} sub="To‘lov usuli" extra={methodOf(row.method).label} />
            <Tile kicker="Sana va vaqt" value={`${row.date}, ${row.time}`} sub="To‘lov holati" extra={paidLabel} />
          </div>

          <section className="rounded-xl border border-line p-3">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold text-muted">Bemor haqida</p>
              <Link to={`/bemorlar/${row.patientId}`} className="text-[12px] font-semibold text-sea">Bemor profili →</Link>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Face src={row.photo} name={row.name} className="size-10 rounded-full" />
              <div>
                <b className="block text-[13px]">{row.name}</b>
                <span className="text-[12px] text-muted">{row.phone}</span>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-2">
            <section className="rounded-xl border border-line p-3">
              <p className="text-[11px] text-muted">Shifokor</p>
              <div className="mt-1.5 flex items-center gap-2">
                <Face src={d.doctorPhoto} name={d.doctor} className="size-8 rounded-full text-[10px]" />
                <div className="min-w-0">
                  <b className="block truncate text-[12.5px]">{d.doctor}</b>
                  <span className="text-[11px] text-muted">{d.doctorRole}</span>
                </div>
              </div>
            </section>
            <section className="rounded-xl border border-line p-3">
              <p className="text-[11px] text-muted">Kreslo</p>
              <b className="mt-2 block text-[13px]">{d.chair}</b>
            </section>
          </div>

          <section>
            <p className="mb-1.5 text-[12.5px] font-bold">Xizmatlar ro‘yxati</p>
            <div className="overflow-hidden rounded-xl border border-line">
              <table className="w-full text-[11.5px]">
                <thead>
                  <tr className="bg-[#f7f9fc] text-left text-muted">
                    {['#', 'Xizmat nomi', 'Tish', 'Narx', 'Summa'].map((h) => <th key={h} className="px-2 py-1.5 font-medium">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {d.lines.map((l, i) => (
                    <tr key={l.name} className="border-t border-line">
                      <td className="px-2 py-1.5">{i + 1}</td>
                      <td className="px-2 py-1.5">{l.name}</td>
                      <td className="px-2 py-1.5">{l.tooth}</td>
                      <td className="whitespace-nowrap px-2 py-1.5">{som(l.price).replace(' so‘m', '')}</td>
                      <td className="whitespace-nowrap px-2 py-1.5 font-semibold">{som(l.sum).replace(' so‘m', '')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="space-y-1 border-t border-line px-3 py-2 text-[12px]">
                <Line k="Oraliq jami:" v={som(linesSum)} />
                <Line k="Chegirma:" v={som(d.discount)} />
                <Line k="Jami to‘langan:" v={som(d.total)} strong />
                <Line k="Qarzdorlik:" v={som(d.debt)} tone={d.debt ? '#e11d48' : '#17803d'} />
              </div>
            </div>
          </section>

          <div className="grid gap-2 sm:grid-cols-2">
            <section className="rounded-xl border border-line p-3">
              <p className="text-[11px] text-muted">Bog‘langan davolash rejasi</p>
              <b className="mt-1 block text-[12.5px]">#{d.planId}</b>
              <p className="text-[12px] text-ink-2">{d.planName}</p>
            </section>
            <section className="rounded-xl border border-line p-3">
              <p className="text-[11px] text-muted">Admin izohi</p>
              <p className="mt-1 text-[12px] leading-snug">{d.note || 'Izoh yo‘q'}</p>
            </section>
          </div>

          <section>
            <p className="mb-2 text-[12.5px] font-bold">To‘lov tarixi</p>
            <ol className="space-y-3">
              {d.history.map((h) => (
                <li key={h.title} className="flex gap-2">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-sea" />
                  <div>
                    <b className="block text-[12.5px]">{h.title}</b>
                    <span className="text-[11px] text-muted">{h.meta}</span>
                    <span className="block text-[11px] text-ink-2">{h.by}</span>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
        <div className="tolov-drawer-foot flex gap-1.5 border-t border-line px-3 py-3">
          <button type="button" onClick={() => window.print()} className="inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-1 rounded-lg border border-line px-1.5 text-[11px] font-semibold"><Printer className="size-3.5 shrink-0" /> Chek chop etish</button>
          <button type="button" onClick={() => downloadReport([row])} className="inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-1 rounded-lg border border-line px-1.5 text-[11px] font-semibold"><Download className="size-3.5 shrink-0" /> PDF yuklab olish</button>
          <button type="button" onClick={onEdit} className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg border border-line px-2 text-[11px] font-semibold"><Pencil className="size-3.5" /> Tahrirlash</button>
          <button type="button" onClick={onRefund} className="inline-flex h-9 shrink-0 items-center rounded-lg border border-[#f3c1c1] px-2 text-[11px] font-semibold text-[#dc2626]">Qaytarish</button>
        </div>
      </aside>
    </div>
  )
}

function Tile({ kicker, value, sub, extra }) {
  return (
    <div className="rounded-xl bg-[#f4fbf8] px-3 py-2.5">
      <p className="text-[11px] text-muted">{kicker}</p>
      <b className="mt-1 block text-[14px]">{value}</b>
      <p className="mt-2 text-[11px] text-muted">{sub}</p>
      <b className="text-[12.5px]">{extra}</b>
    </div>
  )
}

function Line({ k, v, strong, tone }) {
  return (
    <div className="flex items-center justify-between">
      <span className={strong ? 'font-semibold' : 'text-muted'}>{k}</span>
      <b style={{ color: tone || '#0b1f3a' }}>{v}</b>
    </div>
  )
}
