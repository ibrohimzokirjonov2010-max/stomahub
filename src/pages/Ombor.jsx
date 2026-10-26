import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, Box, Calendar, Check, ChevronLeft, ChevronRight, ClipboardCheck, FileUp, ImagePlus, LayoutGrid, MapPin, MoreHorizontal, Package, Plus, Search, SlidersHorizontal, X,
} from 'lucide-react'
import ShopLayout from '../components/market/ShopLayout'
import { som } from '../marketData'
import {
  CATEGORIES, PLACES, STATUSES, SUPPLIERS, UNITS, addOmbor, patchOmbor, receiveStock, removeOmbor, useOmbor,
} from '../omborData'

const LOW_IDS = ['filtek', 'articaine', 'implant', 'gutta']
const EXPIRY = [
  { id: 'xhlor', days: 23 },
  { id: 'articaine', days: 45 },
  { id: 'gutta', days: 67 },
]

export default function Ombor() {
  const rows = useOmbor()
  const [headerQ, setHeaderQ] = useState('')
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [status, setStatus] = useState('all')
  const [supplier, setSupplier] = useState('all')
  const [page, setPage] = useState(1)
  const [per, setPer] = useState(10)
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState(null)
  const [menu, setMenu] = useState(null)
  const [catsOpen, setCatsOpen] = useState(false)
  const [checked, setChecked] = useState({})
  const [importRows, setImportRows] = useState(null)
  const fileRef = useRef(null)

  const query = `${headerQ} ${q}`.trim().toLowerCase()
  const filtered = useMemo(() => rows.filter((r) => {
    const blob = `${r.name} ${r.sku} ${r.supplier} ${r.category} ${r.pack}`.toLowerCase()
    return (cat === 'all' || r.category === cat)
      && (status === 'all' || r.status === status)
      && (supplier === 'all' || r.supplier === supplier)
      && (!query || blob.includes(query))
  }), [rows, cat, status, supplier, query])

  const clean = !query && cat === 'all' && status === 'all' && supplier === 'all' && !rows.some((r) => r.incoming)
  const pages = Math.max(1, Math.ceil(filtered.length / per))
  const safePage = Math.min(page, pages)
  const slice = filtered.slice((safePage - 1) * per, safePage * per)
  const low = LOW_IDS.map((id) => rows.find((r) => r.id === id)).filter(Boolean)
  const expiring = EXPIRY.map((e) => ({ ...e, row: rows.find((r) => r.id === e.id) })).filter((e) => e.row)
  const incoming = rows.filter((r) => r.incoming)

  const save = (product) => {
    if (edit) patchOmbor(edit.id, product)
    else addOmbor({ ...product, id: `new-${Date.now()}` })
    setOpen(false)
    setEdit(null)
    setPage(1)
  }

  const onCsv = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const text = await file.text()
    const parsed = text.split(/\r?\n/).map((line) => line.split(/[,;]/).map((c) => c.trim())).filter((c) => c[0] && !/^nom/i.test(c[0]))
    setImportRows(parsed.map((c, i) => ({
      id: `csv-${i}-${c[0]}`,
      name: c[0],
      qty: Number(String(c[1] || '').replace(/\D/g, '')) || 1,
      price: Number(String(c[2] || '').replace(/\D/g, '')) || 0,
      type: c[3] || 'Import',
      supplier: c[4] || 'StomaHub',
      category: 'Sarf materiallar',
    })))
  }

  return (
    <ShopLayout active="ombor" placeholder="Mahsulot nomi, brend, kategoriya yoki SKU qidiring..." onQuery={setHeaderQ}>
      <div className="pb-4 pt-4" onClick={() => { setMenu(null); setCatsOpen(false) }}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-bold leading-none text-ink">Ombor</h1>
            <p className="mt-1 text-[13px] text-muted">Klinika inventari va sarf materiallari</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <button type="button" onClick={(e) => { e.stopPropagation(); setCatsOpen((v) => !v) }} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[12.5px] font-semibold">
                <LayoutGrid className="size-4 text-muted" /> Kategoriyalar
              </button>
              {catsOpen && (
                <div className="absolute right-0 z-20 mt-1 w-56 rounded-xl border border-line bg-white p-1 shadow-card" onClick={(e) => e.stopPropagation()}>
                  <button type="button" onClick={() => { setCat('all'); setPage(1); setCatsOpen(false) }} className="block w-full rounded-lg px-2 py-1.5 text-left text-[12.5px] hover:bg-[#f4f7fb]">Barcha kategoriyalar</button>
                  {CATEGORIES.map((c) => (
                    <button key={c} type="button" onClick={() => { setCat(c); setPage(1); setCatsOpen(false) }} className="block w-full rounded-lg px-2 py-1.5 text-left text-[12.5px] hover:bg-[#f4f7fb]">{c}</button>
                  ))}
                </div>
              )}
            </div>
            <Link to="/marketplace" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-sea px-3 text-[12.5px] font-semibold text-white"><Plus className="size-4" /> Buyurtma berish</Link>
          </div>
        </div>

        {incoming.length > 0 && (
          <p className="mt-3 rounded-xl bg-[#e7f7f1] px-3 py-2 text-[12.5px] text-[#0f766e]">Xariddan {incoming.length} ta mahsulot ko‘rib chiqilib omborga qo‘shildi. Ular jadval boshida.</p>
        )}

        <div className="ombor-layout mt-4">
          <div className="min-w-0 space-y-3">
            <div className="ombor-stats">
              <Stat icon={Package} tint="#e7f7f4" color="#0f9b8e" label="Jami mahsulotlar" value={clean ? '248' : String(filtered.length)} delta="+12%" note="o‘tgan oyga nisbatan" />
              <Stat icon={Box} tint="#e8f8ee" color="#1f9d55" label="Ombordagi qiymat" value={clean ? '125 600 000 so‘m' : som(filtered.reduce((s, r) => s + r.price * r.qty, 0))} delta="+8%" note="o‘tgan oyga nisbatan" />
              <Stat icon={AlertTriangle} tint="#fdecec" color="#e11d48" label="Kam zahira" value={clean ? '18' : String(filtered.filter((r) => r.status === 'kam').length)} note="Diqqat talab qiladi" warn />
            </div>

            <section className="rounded-2xl border border-line bg-white shadow-card">
              <div className="flex flex-wrap items-center gap-2 px-3 py-3">
                <label className="flex h-9 min-w-[180px] flex-1 items-center gap-2 rounded-lg border border-line px-3">
                  <Search className="size-4 text-muted" />
                  <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Mahsulot nomi, brend yoki SKU..." className="w-full bg-transparent text-[12.5px] outline-none placeholder:text-muted" />
                </label>
                <select value={cat} onChange={(e) => { setCat(e.target.value); setPage(1) }} className="h-9 rounded-lg border border-line bg-white px-2 text-[12px]">
                  <option value="all">Barcha kategoriyalar</option>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
                <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="h-9 rounded-lg border border-line bg-white px-2 text-[12px]">
                  <option value="all">Barcha holatlar</option>
                  <option value="kam">Kam zahira</option>
                  <option value="mavjud">Mavjud</option>
                  <option value="tugash">Tugash arafasida</option>
                </select>
                <select value={supplier} onChange={(e) => { setSupplier(e.target.value); setPage(1) }} className="h-9 rounded-lg border border-line bg-white px-2 text-[12px]">
                  <option value="all">Barcha yetkazib beruvchilar</option>
                  {SUPPLIERS.map((s) => <option key={s}>{s}</option>)}
                </select>
                <button type="button" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-[12.5px] font-semibold">
                  <SlidersHorizontal className="size-4" /> Filtrlar
                </button>
              </div>
              <div className="bemor-scroll">
                <table className="bemor-table text-[12.5px]">
                  <thead>
                    <tr className="border-y border-line text-left text-[11px] text-muted">
                      <th className="w-8 px-3 py-2"><input type="checkbox" checked={slice.length > 0 && slice.every((r) => checked[r.id])} onChange={(e) => {
                        const on = e.target.checked
                        setChecked((prev) => {
                          const next = { ...prev }
                          slice.forEach((r) => { next[r.id] = on })
                          return next
                        })
                      }} aria-label="Hammasini tanlash" /></th>
                      {['#', 'Mahsulot', 'Kategoriya', 'SKU', 'Zahira', 'Min. zahira', 'Yaroqlilik muddati', 'Yetkazib beruvchi', 'Holat', 'Amallar'].map((h) => <th key={h} className="px-2 py-2 font-medium">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {slice.map((r, i) => {
                      const st = STATUSES[r.status]
                      return (
                        <tr key={r.id} className="border-b border-line last:border-0">
                          <td className="px-3 py-2"><input type="checkbox" checked={!!checked[r.id]} onChange={(e) => setChecked((prev) => ({ ...prev, [r.id]: e.target.checked }))} aria-label={r.name} /></td>
                          <td className="px-2 py-2 text-muted">{(safePage - 1) * per + i + 1}</td>
                          <td className="px-2 py-2">
                            <span className="flex min-w-0 items-center gap-2">
                              <Thumb src={r.image} name={r.name} />
                              <span className="min-w-0">
                                <b className="block truncate">{r.name}</b>
                                <span className="block truncate text-[11px] text-muted">{r.pack}</span>
                              </span>
                            </span>
                          </td>
                          <td className="px-2 py-2 text-ink-2">{r.category}</td>
                          <td className="whitespace-nowrap px-2 py-2">{r.sku}</td>
                          <td className="px-2 py-2 font-bold" style={{ color: r.qty < r.min ? '#dc2626' : '#0b1f3a' }}>{r.qty}</td>
                          <td className="px-2 py-2">{r.min}</td>
                          <td className="whitespace-nowrap px-2 py-2">{r.expiry || '—'}</td>
                          <td className="px-2 py-2">{r.supplier}</td>
                          <td className="px-2 py-2"><span className="whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ background: st.bg, color: st.color }}>{st.label}</span></td>
                          <td className="px-2 py-2">
                            <button type="button" aria-label="Amallar" onClick={(e) => {
                              e.stopPropagation()
                              const box = e.currentTarget.getBoundingClientRect()
                              setMenu(menu?.id === r.id ? null : { id: r.id, top: box.bottom + 4, left: Math.max(8, box.right - 144) })
                            }} className="grid size-7 place-items-center rounded-md text-muted hover:bg-[#f3f6fb]"><MoreHorizontal className="size-4" /></button>
                          </td>
                        </tr>
                      )
                    })}
                    {slice.length === 0 && <tr><td colSpan={11} className="px-3 py-8 text-center text-muted">Mahsulot topilmadi</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center gap-2 px-4 py-3 text-[12px] text-muted">
                <span>Jami: {filtered.length} mahsulot</span>
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
            <Rail title="Kam zahira mahsulotlar" action="Barchasi" onAction={() => { setStatus('kam'); setPage(1) }}>
              <ul className="space-y-2.5">
                {low.map((r) => (
                  <li key={r.id} className="flex items-center gap-2">
                    <Thumb src={r.image} name={r.name} />
                    <div className="min-w-0 flex-1">
                      <b className="block truncate text-[12.5px]">{r.name}</b>
                      <span className="text-[11px] text-[#dc2626]">{r.qty} / {r.min} qolgan</span>
                    </div>
                    <AlertTriangle className="size-4 shrink-0 text-[#e11d48]" />
                  </li>
                ))}
              </ul>
            </Rail>
            <Rail title="Yaroqlilik muddati yaqin" action="Barchasi" onAction={() => { setStatus('tugash'); setPage(1) }}>
              <ul className="space-y-2.5">
                {expiring.map(({ row, days }) => (
                  <li key={row.id} className="flex items-center gap-2">
                    <Thumb src={row.image} name={row.name} />
                    <div className="min-w-0 flex-1">
                      <b className="block truncate text-[12.5px]">{row.name}</b>
                      <span className="text-[11px] text-muted">{row.expiry} ({days} kun qoldi)</span>
                    </div>
                    <AlertTriangle className="size-4 shrink-0 text-[#f59e0b]" />
                  </li>
                ))}
              </ul>
            </Rail>
            <section className="rounded-2xl border border-line bg-white p-3 shadow-card">
              <h2 className="text-[14px] font-bold">Tezkor amallar</h2>
              <div className="mt-2 space-y-1">
                <Quick icon={Plus} label="Yangi mahsulot" onClick={() => { setEdit(null); setOpen(true) }} />
                <Link to="/marketplace" className="flex items-center gap-2 rounded-lg px-2 py-2 text-[12.5px] font-semibold hover:bg-[#f4fbf8]"><Box className="size-4 text-sea" /> Buyurtma berish</Link>
                <Quick icon={ClipboardCheck} label="Inventarizatsiya" onClick={() => { setStatus('kam'); setPage(1) }} />
                <Quick icon={FileUp} label="Excel import" onClick={() => fileRef.current?.click()} />
              </div>
              <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={onCsv} />
            </section>
          </aside>
        </div>
      </div>

      {menu && (
        <div className="fixed z-40 w-36 rounded-xl border border-line bg-white p-1 text-[12px] shadow-card" style={{ top: menu.top, left: menu.left }} onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => { const r = rows.find((x) => x.id === menu.id); setEdit(r); setOpen(true); setMenu(null) }} className="block w-full rounded-lg px-2 py-1.5 text-left hover:bg-[#f4f7fb]">Tahrirlash</button>
          <button type="button" onClick={() => { removeOmbor(menu.id); setMenu(null) }} className="block w-full rounded-lg px-2 py-1.5 text-left text-[#dc2626] hover:bg-[#fff5f5]">O‘chirish</button>
        </div>
      )}
      {open && <AddModal key={edit?.id || 'new'} edit={edit} onClose={() => { setOpen(false); setEdit(null) }} onSave={save} />}
      {importRows && (
        <ImportReview rows={importRows} onClose={() => setImportRows(null)} onConfirm={() => { receiveStock(importRows); setImportRows(null); setPage(1) }} />
      )}
    </ShopLayout>
  )
}

function pager(page, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1)
  if (page <= 4) return [1, 2, 3, 4, 5, '...', pages]
  if (page >= pages - 3) return [1, '...', pages - 4, pages - 3, pages - 2, pages - 1, pages]
  return [1, '...', page - 1, page, page + 1, '...', pages]
}

function Stat({ icon: Icon, tint, color, label, value, delta, note, warn }) {
  return (
    <article className="flex items-center gap-3 rounded-2xl border border-line bg-white px-3 py-3 shadow-card" style={warn ? { background: '#fff6f6' } : undefined}>
      <span className="grid size-10 shrink-0 place-items-center rounded-xl" style={{ background: tint, color }}><Icon className="size-5" /></span>
      <div className="min-w-0">
        <p className="text-[12px] text-muted">{label}</p>
        <p className="truncate text-[16px] font-bold">{value}</p>
        <p className="text-[11px]" style={{ color: warn ? '#e11d48' : '#16a34a' }}>{delta ? <b>{delta} </b> : null}<span className="font-normal text-muted">{note}</span></p>
      </div>
    </article>
  )
}

function Thumb({ src, name }) {
  if (!src) return <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-sea-50 text-[11px] font-bold text-sea">{name.slice(0, 1)}</span>
  return <img src={src} alt="" className="size-9 shrink-0 rounded-lg bg-[#f4f7fb] object-contain" />
}

function Rail({ title, action, onAction, children }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-3 shadow-card">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[13px] font-bold">{title}</h2>
        <button type="button" onClick={onAction} className="text-[12px] font-semibold text-sea">{action} →</button>
      </div>
      {children}
    </section>
  )
}

function Quick({ icon: Icon, label, onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[12.5px] font-semibold hover:bg-[#f4fbf8]">
      <Icon className="size-4 text-sea" /> {label}
    </button>
  )
}

function AddModal({ edit, onClose, onSave }) {
  const [image, setImage] = useState(edit?.image || '')
  const [name, setName] = useState(edit?.name || '')
  const [category, setCategory] = useState(edit?.category || '')
  const [qty, setQty] = useState(edit ? String(edit.qty) : '')
  const [unit, setUnit] = useState(edit?.unit || '')
  const [min, setMin] = useState(edit ? String(edit.min) : '')
  const [alert, setAlert] = useState(edit?.alert ?? true)
  const [price, setPrice] = useState(edit ? String(edit.price || '') : '')
  const [supplier, setSupplier] = useState(edit?.supplier || '')
  const [expiry, setExpiry] = useState(edit?.expiry || '')
  const [batch, setBatch] = useState(edit?.batch || '')
  const [place, setPlace] = useState(edit?.place || '')
  const [note, setNote] = useState(edit?.note || '')
  const [error, setError] = useState('')

  const onFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Rasm 5 MB dan oshmasligi kerak.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setImage(String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  const submit = () => {
    const amount = Number(qty)
    const floor = Number(min)
    const cost = Number(String(price).replace(/\D/g, ''))
    if (!name.trim() || !category || !unit || !amount || !floor || !cost) {
      setError('Mahsulot nomi, kategoriya, miqdor, o‘lchov, minimal zahira va narx majburiy.')
      return
    }
    onSave({
      name: name.trim(),
      category,
      pack: edit?.pack || unit,
      sku: edit?.sku || `SKU-${Date.now().toString().slice(-6)}`,
      qty: amount,
      min: floor,
      unit,
      alert,
      price: cost,
      supplier: supplier || 'StomaHub',
      expiry,
      batch,
      place,
      note,
      image,
    })
  }

  return (
    <div className="bemor-shade" onClick={onClose}>
      <div className="bemor-dialog tolov-dialog" role="dialog" aria-labelledby="ombor-add" onClick={(e) => e.stopPropagation()}>
        <div className="bemor-dialog-head flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 id="ombor-add" className="text-[18px] font-bold">{edit ? 'Mahsulotni tahrirlash' : 'Omborga mahsulot qo‘shish'}</h2>
            <p className="mt-0.5 text-[12.5px] text-muted">Klinika omboriga yangi mahsulot qo‘shing</p>
          </div>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-[#f4f7fb]" aria-label="Yopish"><X className="size-4" /></button>
        </div>
        <div className="bemor-dialog-body space-y-3 px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-[140px_minmax(0,1fr)]">
            <label className="grid h-[104px] cursor-pointer place-items-center rounded-xl border border-dashed border-[#b7e3ea] bg-[#f3fbfb] text-center text-[11px] text-sea">
              {image ? <img src={image} alt="" className="h-full w-full rounded-xl object-contain" /> : <span><ImagePlus className="mx-auto size-5" /><b className="mt-1 block">Rasm yuklang</b>JPG, PNG (maks. 5 MB)</span>}
              <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={onFile} />
            </label>
            <div className="space-y-3">
              <Field label="Mahsulot nomi" required>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mahsulot nomini kiriting" className="h-10 w-full rounded-xl border border-line px-3 text-[13px] outline-none" />
              </Field>
              <Field label="Kategoriya" required>
                <span className="flex h-10 items-center gap-2 rounded-xl border border-line px-3">
                  <LayoutGrid className="size-4 text-muted" />
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-transparent text-[13px] outline-none">
                    <option value="">Kategoriyani tanlang</option>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </span>
              </Field>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Miqdori" required><input value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, ''))} placeholder="Miqdor kiriting" className="h-10 w-full rounded-xl border border-line px-3 text-[13px] outline-none" inputMode="numeric" /></Field>
            <Field label="O‘lchov birligi" required>
              <select value={unit} onChange={(e) => setUnit(e.target.value)} className="h-10 w-full rounded-xl border border-line bg-white px-3 text-[13px]">
                <option value="">Birlikni tanlang</option>
                {UNITS.map((u) => <option key={u}>{u}</option>)}
              </select>
            </Field>
            <Field label="Minimal zahira" required><input value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ''))} placeholder="Minimal miqdor" className="h-10 w-full rounded-xl border border-line px-3 text-[13px] outline-none" inputMode="numeric" /></Field>
            <button type="button" onClick={() => setAlert((v) => !v)} className="mt-6 flex items-center justify-between rounded-xl bg-[#e7f8f2] px-3 py-2 text-left">
              <span>
                <b className="block text-[12.5px]">Zaxira haqida ogohlantirish</b>
                <span className="text-[11px] text-muted">Miqdor minimal zahiradan kam bo‘lsa, sizga bildirishnoma yuboriladi.</span>
              </span>
              <span className="relative ml-2 h-6 w-11 shrink-0 rounded-full" style={{ background: alert ? '#1aa37a' : '#d5dde8' }}>
                <span className="absolute top-0.5 size-5 rounded-full bg-white shadow" style={{ left: alert ? 22 : 2 }} />
              </span>
            </button>
            <Field label="Narxi (so‘m)" required><input value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))} placeholder="Narx kiriting" className="h-10 w-full rounded-xl border border-line px-3 text-[13px] outline-none" inputMode="numeric" /></Field>
            <Field label="Yetkazib beruvchi">
              <select value={supplier} onChange={(e) => setSupplier(e.target.value)} className="h-10 w-full rounded-xl border border-line bg-white px-3 text-[13px]">
                <option value="">Yetkazib beruvchini tanlang</option>
                {SUPPLIERS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Yaroqlilik muddati">
              <span className="flex h-10 items-center gap-2 rounded-xl border border-line px-3">
                <Calendar className="size-4 text-muted" />
                <input value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="Sana tanlang" className="w-full bg-transparent text-[13px] outline-none" />
              </span>
            </Field>
            <Field label="Partiya raqami (ixtiyoriy)"><input value={batch} onChange={(e) => setBatch(e.target.value)} placeholder="Partiya raqamini kiriting" className="h-10 w-full rounded-xl border border-line px-3 text-[13px] outline-none" /></Field>
            <Field label="Saqlash joyi (ixtiyoriy)">
              <span className="flex h-10 items-center gap-2 rounded-xl border border-line px-3">
                <MapPin className="size-4 text-muted" />
                <select value={place} onChange={(e) => setPlace(e.target.value)} className="w-full bg-transparent text-[13px] outline-none">
                  <option value="">Saqlash joyini tanlang</option>
                  {PLACES.map((p) => <option key={p}>{p}</option>)}
                </select>
              </span>
            </Field>
          </div>
          <Field label="Izoh (ixtiyoriy)">
            <textarea value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} placeholder="Qo‘shimcha eslatmalar..." className="h-20 w-full resize-none rounded-xl border border-line px-3 py-2 text-[13px] outline-none" />
            <span className="mt-1 block text-right text-[11px] text-muted">{note.length}/500</span>
          </Field>
          {error && <p className="text-[12px] font-semibold text-[#e11d48]">{error}</p>}
        </div>
        <div className="bemor-dialog-foot flex items-center justify-between gap-2 border-t border-line px-5 py-3">
          <button type="button" onClick={onClose} className="h-10 rounded-xl border border-line px-4 text-[13px] font-semibold">Bekor qilish</button>
          <button type="button" onClick={submit} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-sea px-5 text-[13px] font-semibold text-white"><Check className="size-4" /> Saqlash</button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <label className="block text-[12.5px] font-semibold">
      {label} {required && <span className="text-[#e11d48]">*</span>}
      <div className="mt-1.5 font-normal">{children}</div>
    </label>
  )
}

function ImportReview({ rows, onClose, onConfirm }) {
  return (
    <div className="bemor-shade" onClick={onClose}>
      <div className="bemor-dialog" role="dialog" aria-labelledby="import-title" onClick={(e) => e.stopPropagation()}>
        <div className="bemor-dialog-head flex items-start justify-between px-5 py-4">
          <div>
            <h2 id="import-title" className="text-[18px] font-bold">Importni ko‘rib chiqish</h2>
            <p className="mt-0.5 text-[12.5px] text-muted">{rows.length} ta qator omborga qo‘shilishidan oldin tekshiriladi</p>
          </div>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg text-muted" aria-label="Yopish"><X className="size-4" /></button>
        </div>
        <div className="bemor-dialog-body px-5">
          <ul className="divide-y divide-line">
            {rows.slice(0, 12).map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2 text-[13px]">
                <span className="min-w-0 truncate font-semibold">{r.name}</span>
                <span className="shrink-0 text-muted">{r.qty} dona</span>
              </li>
            ))}
          </ul>
          {rows.length > 12 && <p className="py-2 text-[12px] text-muted">va yana {rows.length - 12} ta</p>}
        </div>
        <div className="bemor-dialog-foot flex justify-end gap-2 px-5 py-3">
          <button type="button" onClick={onClose} className="h-10 rounded-xl border border-line px-4 text-[13px] font-semibold">Bekor qilish</button>
          <button type="button" onClick={onConfirm} disabled={!rows.length} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-sea px-4 text-[13px] font-semibold text-white disabled:opacity-50"><Check className="size-4" /> Omborga qo‘shish</button>
        </div>
      </div>
    </div>
  )
}
