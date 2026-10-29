import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, Box, Calendar, Check, ChevronLeft, ChevronRight, ClipboardCheck, FileUp, ImagePlus, LayoutGrid, MapPin, MoreHorizontal, Package, Plus, Search, SlidersHorizontal, X,
} from 'lucide-react'
import ShopLayout from '../components/market/ShopLayout'
import { som } from '../marketData'
import {
  PLACES, STATUSES, UNITS, addCategory, addOmbor, addSupplier, categoriesOf, daysLeft, omborStats, patchOmbor, receiveStock, removeCategory, removeOmbor, suppliersOf, useOmbor, useOmborPrefs,
} from '../omborData'
import { useBlobsReady } from '../recordSync'
import { tashkentToday } from '../tashkentDate'

export default function Ombor() {
  const rows = useOmbor()
  const ready = useBlobsReady()
  const prefs = useOmborPrefs()
  const CATEGORIES = categoriesOf(prefs)
  const SUPPLIERS = suppliersOf(prefs)
  const [catsManager, setCatsManager] = useState(false)
  const [inventory, setInventory] = useState(false)
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

  const stats = omborStats(filtered)
  const pages = Math.max(1, Math.ceil(filtered.length / per))
  const safePage = Math.min(page, pages)
  const slice = filtered.slice((safePage - 1) * per, safePage * per)
  const low = rows.filter((r) => (Number(r.qty) || 0) < (Number(r.min) || 0)).slice(0, 5)
  const today = tashkentToday()
  const expiring = rows.map((row) => ({ row, days: daysLeft(row.expiry, today) })).filter((e) => e.days != null && e.days <= 90).sort((a, b) => a.days - b.days).slice(0, 5)
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
                  <button type="button" onClick={() => { setCatsOpen(false); setCatsManager(true) }} className="mt-1 block w-full rounded-lg border-t border-line px-2 py-1.5 text-left text-[12.5px] font-semibold text-sea hover:bg-[#f4fbf8]">+ Kategoriyalarni boshqarish</button>
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
              <Stat loading={!ready} icon={Package} tint="#e7f7f4" color="#0f9b8e" label="Jami mahsulotlar" value={String(stats.count)} note={stats.count ? 'omboringizdagi pozitsiyalar' : 'Hali mahsulot qo‘shilmagan'} />
              <Stat loading={!ready} icon={Box} tint="#e8f8ee" color="#1f9d55" label="Ombordagi qiymat" value={som(stats.value)} note="narx × zahira bo‘yicha" />
              <Stat loading={!ready} icon={AlertTriangle} tint="#fdecec" color="#e11d48" label="Kam zahira" value={String(stats.low)} note={stats.low ? 'Diqqat talab qiladi' : 'Hammasi yetarli'} warn={stats.low > 0} />
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
                <button type="button" disabled={!q && cat === 'all' && status === 'all' && supplier === 'all'} onClick={() => { setQ(''); setCat('all'); setStatus('all'); setSupplier('all'); setPage(1) }} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-[12.5px] font-semibold disabled:opacity-40">
                  <SlidersHorizontal className="size-4" /> Filtrlarni tozalash
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
                    {!ready && Array.from({ length: 4 }, (_, i) => <tr key={`sk${i}`} className="border-b border-line"><td colSpan={11} className="px-3 py-3"><div className="h-5 animate-pulse rounded bg-[#eef3f6]" /></td></tr>)}
                    {ready && slice.length === 0 && <tr><td colSpan={11} className="px-3 py-8 text-center text-muted">{rows.length ? 'Mahsulot topilmadi' : 'Ombor bo‘sh. “Yangi mahsulot” yoki “Excel (CSV) import” orqali qo‘shing.'}</td></tr>}
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
                {!low.length && <li className="text-[12px] text-muted">Kam zahira yo‘q</li>}
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
                {!expiring.length && <li className="text-[12px] text-muted">90 kun ichida muddati tugaydigan mahsulot yo‘q</li>}
                {expiring.map(({ row, days }) => (
                  <li key={row.id} className="flex items-center gap-2">
                    <Thumb src={row.image} name={row.name} />
                    <div className="min-w-0 flex-1">
                      <b className="block truncate text-[12.5px]">{row.name}</b>
                      <span className={`text-[11px] ${days < 0 ? 'text-[#dc2626]' : 'text-muted'}`}>{row.expiry} ({days < 0 ? 'muddati o‘tgan' : `${days} kun qoldi`})</span>
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
                <Quick icon={ClipboardCheck} label="Inventarizatsiya" onClick={() => setInventory(true)} disabled={!rows.length} />
                <Quick icon={FileUp} label="Excel (CSV) import" onClick={() => fileRef.current?.click()} />
                <Quick icon={LayoutGrid} label="Kategoriyalar" onClick={() => setCatsManager(true)} />
              </div>
              <p className="mt-1 px-2 text-[11px] text-muted">CSV ustunlari: nomi; miqdor; narx; turi; yetkazib beruvchi. Excel’da “CSV sifatida saqlash” orqali oling.</p>
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
      {catsManager && <CategoriesModal custom={prefs.categories} used={rows} onClose={() => setCatsManager(false)} />}
      {inventory && <InventoryModal rows={rows} onClose={() => setInventory(false)} onSave={(counts) => { Object.entries(counts).forEach(([id, qty]) => patchOmbor(id, { qty })); setInventory(false) }} />}
      {open && <AddModal key={edit?.id || 'new'} categories={CATEGORIES} suppliers={SUPPLIERS} edit={edit} onClose={() => { setOpen(false); setEdit(null) }} onSave={save} />}
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

function Stat({ icon: Icon, tint, color, label, value, delta, note, warn, loading }) {
  if (loading) {
    return (
      <article className="flex items-center gap-3 rounded-2xl border border-line bg-white px-3 py-3 shadow-card" aria-busy="true">
        <span className="size-10 shrink-0 animate-pulse rounded-xl bg-[#eef3f6]" />
        <div className="min-w-0 flex-1 space-y-1.5"><div className="h-3 w-24 animate-pulse rounded bg-[#eef3f6]" /><div className="h-4 w-32 animate-pulse rounded bg-[#eef3f6]" /></div>
      </article>
    )
  }
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

function Quick({ icon: Icon, label, onClick, disabled }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="disabled:opacity-40 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[12.5px] font-semibold hover:bg-[#f4fbf8]">
      <Icon className="size-4 text-sea" /> {label}
    </button>
  )
}

function AddModal({ edit, onClose, onSave, categories: CATEGORIES, suppliers: SUPPLIERS }) {
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
              <select value={supplier} onChange={(e) => {
                if (e.target.value !== '__new') { setSupplier(e.target.value); return }
                const name = (window.prompt('Yangi yetkazib beruvchi nomi') || '').trim()
                if (name) { addSupplier(name); setSupplier(name) }
              }} className="h-10 w-full rounded-xl border border-line bg-white px-3 text-[13px]">
                <option value="">Yetkazib beruvchini tanlang</option>
                {[...new Set([...SUPPLIERS, supplier].filter(Boolean))].map((s) => <option key={s}>{s}</option>)}
                <option value="__new">+ Yangi yetkazib beruvchi qo‘shish</option>
              </select>
            </Field>
            <Field label="Yaroqlilik muddati">
              <span className="flex h-10 items-center gap-2 rounded-xl border border-line px-3">
                <Calendar className="size-4 text-muted" />
                <input type={/^\d{4}-\d{2}-\d{2}$/.test(expiry) || !expiry ? 'date' : 'text'} value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="Sana tanlang" className="w-full bg-transparent text-[13px] outline-none" />
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

function CategoriesModal({ custom, used, onClose }) {
  const [name, setName] = useState('')
  const all = categoriesOf({ suppliers: [], categories: custom })
  const add = () => { const n = name.trim(); if (n) { addCategory(n); setName('') } }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#0f172a]/40 p-4" onClick={onClose}>
      <div role="dialog" aria-label="Kategoriyalar" className="w-full max-w-[440px] rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between"><h2 className="text-[16px] font-bold">Kategoriyalar</h2><button type="button" aria-label="Yopish" onClick={onClose}><X className="size-5 text-muted" /></button></div>
        <div className="mb-3 flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="Yangi kategoriya nomi" className="h-10 flex-1 rounded-xl border border-line px-3 text-[13px] outline-none focus:border-sea" />
          <button type="button" onClick={add} disabled={!name.trim()} className="h-10 rounded-xl bg-sea px-4 text-[13px] font-semibold text-white disabled:opacity-40">Qo‘shish</button>
        </div>
        <ul className="max-h-[320px] space-y-1 overflow-y-auto">
          {all.map((c) => {
            const mine = custom.includes(c)
            const count = used.filter((r) => r.category === c).length
            return (
              <li key={c} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-[13px] hover:bg-[#f4f7fb]">
                <span>{c} <span className="text-[11px] text-muted">· {count} ta</span></span>
                {mine ? <button type="button" onClick={() => removeCategory(c)} disabled={count > 0} title={count ? 'Avval mahsulotlarni boshqa kategoriyaga o‘tkazing' : 'O‘chirish'} className="text-[12px] font-semibold text-[#dc2626] disabled:opacity-40">O‘chirish</button> : <span className="text-[11px] text-muted">standart</span>}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

function InventoryModal({ rows, onClose, onSave }) {
  const [counts, setCounts] = useState({})
  const changed = Object.entries(counts).filter(([id, v]) => v !== '' && Number(v) !== Number(rows.find((r) => r.id === id)?.qty))
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#0f172a]/40 p-4" onClick={onClose}>
      <div role="dialog" aria-label="Inventarizatsiya" className="flex max-h-[85vh] w-full max-w-[640px] flex-col rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-1 flex items-center justify-between"><h2 className="text-[16px] font-bold">Inventarizatsiya</h2><button type="button" aria-label="Yopish" onClick={onClose}><X className="size-5 text-muted" /></button></div>
        <p className="mb-3 text-[12px] text-muted">Har bir mahsulotning haqiqiy sonini kiriting. Bo‘sh qoldirilganlar o‘zgarmaydi.</p>
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-[13px]">
            <thead><tr className="border-b border-line text-left text-[11.5px] text-muted"><th className="py-2">Mahsulot</th><th className="py-2 text-right">Tizimda</th><th className="py-2 text-right">Haqiqiy</th><th className="py-2 text-right">Farq</th></tr></thead>
            <tbody>
              {rows.map((r) => {
                const v = counts[r.id] ?? ''
                const diff = v === '' ? null : Number(v) - Number(r.qty || 0)
                return (
                  <tr key={r.id} className="border-b border-line">
                    <td className="py-2 pr-2">{r.name}</td>
                    <td className="py-2 text-right">{r.qty} {r.unit}</td>
                    <td className="py-2 text-right"><input inputMode="numeric" aria-label={`${r.name} haqiqiy soni`} value={v} onChange={(e) => setCounts((c) => ({ ...c, [r.id]: e.target.value.replace(/\D/g, '') }))} className="h-8 w-20 rounded-lg border border-line px-2 text-right outline-none focus:border-sea" /></td>
                    <td className={`py-2 text-right font-semibold ${diff == null || diff === 0 ? 'text-muted' : diff > 0 ? 'text-[#1f9d55]' : 'text-[#dc2626]'}`}>{diff == null ? '—' : diff > 0 ? `+${diff}` : diff}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-xl border border-line px-4 text-[13px] font-semibold">Bekor qilish</button>
          <button type="button" disabled={!changed.length} onClick={() => onSave(Object.fromEntries(changed.map(([id, v]) => [id, Number(v)])))} className="h-10 rounded-xl bg-sea px-4 text-[13px] font-semibold text-white disabled:opacity-40">Saqlash ({changed.length})</button>
        </div>
      </div>
    </div>
  )
}
