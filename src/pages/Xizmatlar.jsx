import { useEffect, useMemo, useRef, useState } from 'react'
import {
  LayoutGrid, Search, ChevronDown, SlidersHorizontal, ArrowUpDown, Plus, Upload, Download, FileUp, Pencil, Copy, MoreVertical,
  Clock, ChevronLeft, ChevronRight, Check, Trash2, Power, X,
} from 'lucide-react'
import ShopLayout from '../components/market/ShopLayout'
import EmptyCatalog from '../components/EmptyCatalog'
import ServiceArt from '../components/ServiceArt'
import XizmatDialog from '../components/XizmatDialog'
import { CATS, COLORS, catOf, useXizmatlar, saveXizmat, patchXizmat, removeXizmat, importXizmat, nextCode } from '../xizmatData'

const PER = 10
const money = (n) => Number(n || 0).toLocaleString('ru-RU').replace(/\u00a0/g, ' ')
const SORTS = [
  ['code', 'Kodi bo‘yicha'],
  ['az', 'Nomi bo‘yicha (A-Z)'],
  ['za', 'Nomi bo‘yicha (Z-A)'],
  ['cheap', 'Narx: arzonroq'],
  ['expensive', 'Narx: qimmatroq'],
  ['short', 'Davomiylik: qisqa'],
  ['long', 'Davomiylik: uzun'],
]

export default function Xizmatlar() {
  const all = useXizmatlar()
  const [cat, setCat] = useState('all')
  const [status, setStatus] = useState('all')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('code')
  const [page, setPage] = useState(1)
  const [range, setRange] = useState({ min: '', max: '', dur: '', plans: false })
  const [filterOpen, setFilterOpen] = useState(false)
  const [ioOpen, setIoOpen] = useState(false)
  const [menu, setMenu] = useState(null)
  const [checked, setChecked] = useState([])
  const [dialog, setDialog] = useState(null)
  const [focusId, setFocusId] = useState('')
  const [toast, setToast] = useState('')
  const toastTimer = useRef(0)
  const importInput = useRef(null)

  const flash = (text) => {
    setToast(text)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), 2600)
  }

  const counts = useMemo(() => Object.fromEntries(CATS.map((c) => [c.key, all.filter((x) => x.cat === c.key).length])), [all])
  const activeFilters = [range.min, range.max, range.dur].filter(Boolean).length + (range.plans ? 1 : 0)

  const list = useMemo(() => {
    const query = q.trim().toLowerCase()
    const out = all.filter((x) => (cat === 'all' || x.cat === cat)
      && (status === 'all' || x.status === status)
      && (!query || `${x.name} ${x.code} ${x.tags.join(' ')}`.toLowerCase().includes(query))
      && (!range.min || x.price >= Number(range.min))
      && (!range.max || x.price <= Number(range.max))
      && (!range.dur || x.duration <= Number(range.dur))
      && (!range.plans || x.inPlans))
    const by = {
      code: (a, b) => a.code.localeCompare(b.code),
      az: (a, b) => a.name.localeCompare(b.name, 'uz'),
      za: (a, b) => b.name.localeCompare(a.name, 'uz'),
      cheap: (a, b) => a.price - b.price,
      expensive: (a, b) => b.price - a.price,
      short: (a, b) => a.duration - b.duration,
      long: (a, b) => b.duration - a.duration,
    }
    return [...out].sort(by[sort])
  }, [all, cat, status, q, range, sort])

  const pages = Math.max(1, Math.ceil(list.length / PER))
  const current = Math.min(page, pages)
  const slice = list.slice((current - 1) * PER, current * PER)

  useEffect(() => {
    if (!focusId) return
    const i = list.findIndex((x) => x.id === focusId)
    if (i >= 0) setPage(Math.floor(i / PER) + 1)
    const t = window.setTimeout(() => setFocusId(''), 2400)
    return () => window.clearTimeout(t)
  }, [focusId, list])

  const resetPage = (fn) => (v) => { fn(v); setPage(1) }
  const allOnPage = slice.length > 0 && slice.every((x) => checked.includes(x.id))
  const toggleAll = () => setChecked(allOnPage ? checked.filter((id) => !slice.some((x) => x.id === id)) : [...new Set([...checked, ...slice.map((x) => x.id)])])
  const toggle = (id) => setChecked((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))

  const save = (item) => {
    const isNew = !all.some((x) => x.id === item.id)
    saveXizmat(item)
    setDialog(null)
    if (isNew) { setCat('all'); setStatus('all'); setQ('') }
    setFocusId(item.id)
    flash(isNew ? `“${item.name}” xizmati qo‘shildi` : 'O‘zgarishlar saqlandi')
  }

  const duplicate = (x) => {
    const id = `xzm-${Date.now()}`
    saveXizmat({ ...x, id, code: nextCode(), name: `${x.name} (nusxa)` })
    setFocusId(id)
    flash('Xizmat nusxalandi')
  }

  const exportCsv = () => {
    const head = ['Kodi', 'Nomi', 'Kategoriya', 'Narx', 'Davomiyligi', 'Status', 'Teglar']
    const rows = list.map((x) => [x.code, x.name, catOf(x.cat).label, x.price, x.duration, x.status === 'faol' ? 'Faol' : 'Nofaol', x.tags.join(', ')])
    const csv = [head, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\r\n')
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'xizmatlar.csv'
    a.click()
    URL.revokeObjectURL(url)
    setIoOpen(false)
    flash(`${list.length} ta xizmat eksport qilindi`)
  }

  const importCsv = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    setIoOpen(false)
    if (!file) return
    const text = (await file.text()).replace(/^\ufeff/, '')
    const lines = text.split(/\r?\n/).filter(Boolean)
    const clean = (v) => (v || '').trim().replace(/^"|"$/g, '').replace(/""/g, '"')
    let n = Number(nextCode().replace(/\D/g, ''))
    const items = lines.slice(/kodi|nomi/i.test(lines[0]) ? 1 : 0).map((line, i) => {
      const cells = line.split(';').map(clean)
      const [, name, catLabel, price, duration] = cells.length >= 5 ? cells : ['', ...cells]
      const c = CATS.find((x) => x.label.toLowerCase() === (catLabel || '').toLowerCase()) || CATS[1]
      if (!name) return null
      const code = `XZM-${String(n++).padStart(3, '0')}`
      return { id: `xzm-imp-${Date.now()}-${i}`, code, name, cat: c.key, price: Number(String(price).replace(/\D/g, '')) || 0, duration: Number(String(duration).replace(/\D/g, '')) || 30, teeth: '', status: 'faol', short: '', body: '', materials: '', tags: ['import'], inPlans: true, color: COLORS[0], icon: 'tooth', art: c.key, image: '', docs: [] }
    }).filter(Boolean)
    if (!items.length) return flash('Faylda xizmat topilmadi (format: Kodi;Nomi;Kategoriya;Narx;Davomiyligi)')
    importXizmat(items)
    flash(`${items.length} ta xizmat import qilindi`)
  }

  const bulk = (action) => {
    if (action === 'delete') {
      if (!window.confirm(`${checked.length} ta xizmat o‘chirilsinmi?`)) return
      removeXizmat(checked)
      flash(`${checked.length} ta xizmat o‘chirildi`)
    } else {
      patchXizmat(checked, { status: action })
      flash(`${checked.length} ta xizmat ${action === 'faol' ? 'faollashtirildi' : 'nofaol qilindi'}`)
    }
    setChecked([])
  }

  return (
    <ShopLayout active="xizmatlar" search="plain" placeholder="Xizmat qidirish (masalan: implant, plomba, CSR)..." onQuery={resetPage(setQ)}>
      <div className="space-y-3 pb-8 pt-3" onClick={() => { setMenu(null); setFilterOpen(false); setIoOpen(false) }}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-ink">Xizmatlar</h1>
            <p className="text-[12px] text-muted">Klinikangizda ko‘rsatiladigan barcha tibbiy xizmatlar va narxlar</p>
          </div>
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <button type="button" onClick={() => setIoOpen(!ioOpen)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-sea bg-white px-4 text-[12.5px] font-semibold text-sea">
                <Upload className="size-4" /> Import/Export <ChevronDown className="size-4" />
              </button>
              {ioOpen && (
                <div className="absolute right-0 top-full z-30 mt-1 w-52 rounded-xl border border-line bg-white p-1 shadow-lg">
                  <button type="button" onClick={exportCsv} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12.5px] hover:bg-[#f4f8fb]"><Download className="size-4 text-sea" /> CSV eksport ({list.length})</button>
                  <button type="button" onClick={() => importInput.current?.click()} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12.5px] hover:bg-[#f4f8fb]"><FileUp className="size-4 text-sea" /> CSV import</button>
                </div>
              )}
              <input ref={importInput} type="file" accept=".csv,text/csv" hidden onChange={importCsv} />
            </div>
            <button type="button" onClick={() => setDialog({})} className="inline-flex h-10 items-center gap-2 rounded-xl bg-sea px-5 text-[12.5px] font-semibold text-white hover:bg-sea-600"><Plus className="size-4" /> Yangi xizmat</button>
          </div>
        </div>

        <div className="xzm-cats">
          <CatTile active={cat === 'all'} onClick={() => resetPage(setCat)('all')} label="Barchasi" count={all.length}>
            <LayoutGrid className="size-9 text-sea" strokeWidth={1.4} />
          </CatTile>
          {!list.length ? <EmptyCatalog title="Xizmatlar bo‘sh" text="Hali xizmatlar yo‘q. Klinika kabinetidan qo‘shing." /> : null}
      {CATS.map((c) => (
            <CatTile key={c.key} active={cat === c.key} onClick={() => resetPage(setCat)(c.key)} label={c.label} count={counts[c.key]}>
              <ServiceArt kind={c.key} className="size-12" />
            </CatTile>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex h-10 min-w-[240px] flex-[1.3] items-center gap-2 rounded-xl border border-line bg-white px-3">
            <Search className="size-4 text-muted" />
            <input value={q} onChange={(e) => resetPage(setQ)(e.target.value)} placeholder="Xizmat nomi yoki kodi bo‘yicha qidirish..." className="min-w-0 flex-1 bg-transparent text-[12.5px] outline-none" />
            {q && <button type="button" aria-label="Tozalash" onClick={() => setQ('')} className="text-muted"><X className="size-4" /></button>}
          </label>
          <PrefixSelect prefix="Kategoriya" value={cat} onChange={resetPage(setCat)} options={[['all', 'Barchasi'], ...CATS.map((c) => [c.key, c.label])]} />
          <PrefixSelect prefix="Status" value={status} onChange={resetPage(setStatus)} options={[['all', 'Barchasi'], ['faol', 'Faol'], ['nofaol', 'Nofaol']]} />
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setFilterOpen(!filterOpen)} className={`inline-flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-[12.5px] font-medium ${activeFilters ? 'border-sea text-sea' : 'border-line text-ink'}`}>
              <SlidersHorizontal className="size-4" /> Filtrlar {activeFilters > 0 && <span className="grid size-5 place-items-center rounded-full bg-sea text-[10.5px] text-white">{activeFilters}</span>}
            </button>
            {filterOpen && (
              <div className="absolute left-0 top-full z-30 mt-1 w-64 space-y-2.5 rounded-xl border border-line bg-white p-3 shadow-lg">
                <p className="text-[12px] font-semibold">Narx oralig‘i (so‘m)</p>
                <div className="flex gap-2">
                  <input value={range.min} onChange={(e) => { setRange({ ...range, min: e.target.value.replace(/\D/g, '') }); setPage(1) }} placeholder="dan" className="h-9 w-full rounded-lg border border-line px-2 text-[12px] outline-none focus:border-sea" />
                  <input value={range.max} onChange={(e) => { setRange({ ...range, max: e.target.value.replace(/\D/g, '') }); setPage(1) }} placeholder="gacha" className="h-9 w-full rounded-lg border border-line px-2 text-[12px] outline-none focus:border-sea" />
                </div>
                <p className="text-[12px] font-semibold">Davomiyligi</p>
                <div className="flex flex-wrap gap-1.5">
                  {['', '30', '60', '90'].map((d) => (
                    <button key={d || 'any'} type="button" onClick={() => { setRange({ ...range, dur: d }); setPage(1) }} className={`h-8 rounded-lg border px-2.5 text-[11.5px] ${range.dur === d ? 'border-sea bg-sea-50 text-sea' : 'border-line'}`}>{d ? `≤ ${d} daq` : 'Har qanday'}</button>
                  ))}
                </div>
                <label className="flex items-center gap-2 text-[12px]"><input type="checkbox" checked={range.plans} onChange={(e) => { setRange({ ...range, plans: e.target.checked }); setPage(1) }} className="accent-[#0b8a95]" /> Faqat davolash rejalaridagilar</label>
                <button type="button" onClick={() => { setRange({ min: '', max: '', dur: '', plans: false }); setPage(1) }} className="text-[12px] font-medium text-sea">Filtrlarni tozalash</button>
              </div>
            )}
          </div>
          <label className="relative ml-auto flex h-10 items-center rounded-xl border border-line bg-white pl-3">
            <ArrowUpDown className="size-4 text-ink-2" />
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-full appearance-none bg-transparent pl-2 pr-8 text-[12.5px] outline-none">
              {SORTS.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 size-4 text-muted" />
          </label>
        </div>

        {checked.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[#e9f6f7] px-3 py-2 text-[12.5px]">
            <b className="text-sea">{checked.length} ta tanlandi</b>
            <button type="button" onClick={() => bulk('faol')} className="inline-flex h-8 items-center gap-1 rounded-lg bg-white px-3 font-medium"><Check className="size-3.5 text-[#16a34a]" /> Faol qilish</button>
            <button type="button" onClick={() => bulk('nofaol')} className="inline-flex h-8 items-center gap-1 rounded-lg bg-white px-3 font-medium"><Power className="size-3.5 text-muted" /> Nofaol qilish</button>
            <button type="button" onClick={() => bulk('delete')} className="inline-flex h-8 items-center gap-1 rounded-lg bg-white px-3 font-medium text-[#dc2626]"><Trash2 className="size-3.5" /> O‘chirish</button>
            <button type="button" onClick={() => setChecked([])} className="ml-auto text-muted">Bekor qilish</button>
          </div>
        )}

        <section className="overflow-hidden rounded-2xl bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="xzm-table w-full text-left text-[12px]">
              <thead className="bg-[#f8fafc] text-[11.5px] text-muted">
                <tr>
                  <th className="w-11 py-3 pl-4"><input type="checkbox" aria-label="Sahifadagi barchasini tanlash" checked={allOnPage} onChange={toggleAll} className="size-4 accent-[#0b8a95]" /></th>
                  <th className="w-10 font-medium">#</th>
                  <th className="font-medium">Xizmat nomi</th>
                  <th className="w-[180px] font-medium">Kategoriya</th>
                  <th className="w-[130px] font-medium"><SortHead label="Narx (so‘m)" active={sort === 'cheap' || sort === 'expensive'} onClick={() => setSort(sort === 'cheap' ? 'expensive' : 'cheap')} /></th>
                  <th className="w-[130px] font-medium"><SortHead label="Davomiyligi" active={sort === 'short' || sort === 'long'} onClick={() => setSort(sort === 'short' ? 'long' : 'short')} /></th>
                  <th className="w-[100px] font-medium">Status</th>
                  <th className="w-[110px] font-medium">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {slice.map((x, i) => {
                  const c = catOf(x.cat)
                  return (
                    <tr key={x.id} className={`border-t border-line transition-colors ${focusId === x.id ? 'bg-[#e9f8f6]' : checked.includes(x.id) ? 'bg-[#f6fbfc]' : 'hover:bg-[#fafcfe]'}`}>
                      <td className="py-2 pl-4"><input type="checkbox" aria-label={`${x.name} tanlash`} checked={checked.includes(x.id)} onChange={() => toggle(x.id)} className="size-4 accent-[#0b8a95]" /></td>
                      <td className="text-ink-2">{(current - 1) * PER + i + 1}</td>
                      <td>
                        <button type="button" onClick={() => setDialog(x)} className="flex items-center gap-3 text-left">
                          <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl" style={{ background: `${x.color}55` }}>
                            {x.image ? <img src={x.image} alt="" className="h-full w-full object-cover" /> : <ServiceArt kind={x.art} className="size-9" />}
                          </span>
                          <span className="min-w-0">
                            <b className="block text-[12.5px] font-semibold text-ink hover:text-sea">{x.name}</b>
                            <span className="text-[11px] text-muted">{x.code}</span>
                          </span>
                        </button>
                      </td>
                      <td><span className="inline-block rounded-md px-2 py-0.5 text-[11px] font-medium" style={{ background: c.bg, color: c.color }}>{c.label}</span></td>
                      <td className="font-semibold text-ink">{money(x.price)}</td>
                      <td className="text-ink-2"><span className="inline-flex items-center gap-1.5"><Clock className="size-3.5 text-muted" /> {x.duration} daqiqa</span></td>
                      <td>
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${x.status === 'faol' ? 'bg-[#e9f8ef] text-[#15803d]' : 'bg-[#f1f5f9] text-muted'}`}>
                          <span className={`size-1.5 rounded-full ${x.status === 'faol' ? 'bg-[#16a34a]' : 'bg-[#94a3b8]'}`} />{x.status === 'faol' ? 'Faol' : 'Nofaol'}
                        </span>
                      </td>
                      <td>
                        <div className="relative flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <IconBtn label="Tahrirlash" onClick={() => setDialog(x)}><Pencil className="size-4" /></IconBtn>
                          <IconBtn label="Nusxalash" onClick={() => duplicate(x)}><Copy className="size-4" /></IconBtn>
                          <IconBtn label="Boshqa amallar" onClick={() => setMenu(menu === x.id ? null : x.id)}><MoreVertical className="size-4" /></IconBtn>
                          {menu === x.id && (
                            <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-line bg-white p-1 shadow-lg">
                              <button type="button" onClick={() => { patchXizmat(x.id, { status: x.status === 'faol' ? 'nofaol' : 'faol' }); setMenu(null) }} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] hover:bg-[#f4f8fb]"><Power className="size-3.5" /> {x.status === 'faol' ? 'Nofaol qilish' : 'Faol qilish'}</button>
                              <button type="button" onClick={() => { if (window.confirm(`“${x.name}” o‘chirilsinmi?`)) { removeXizmat(x.id); flash('Xizmat o‘chirildi') } setMenu(null) }} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] text-[#dc2626] hover:bg-[#fdf0f0]"><Trash2 className="size-3.5" /> O‘chirish</button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {!slice.length && (
                  <tr><td colSpan={8} className="py-12 text-center text-[13px] text-muted">Hech narsa topilmadi. Filtrlarni o‘zgartirib ko‘ring.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-line px-4 py-3">
            <p className="text-[12.5px] text-ink-2">Jami: <b>{list.length} ta xizmat</b></p>
            <div className="flex items-center gap-1.5">
              <PageBtn label="Oldingi sahifa" disabled={current === 1} onClick={() => setPage(current - 1)}><ChevronLeft className="size-4" /></PageBtn>
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <PageBtn key={n} active={n === current} onClick={() => setPage(n)}>{n}</PageBtn>
              ))}
              <PageBtn label="Keyingi sahifa" disabled={current === pages} onClick={() => setPage(current + 1)}><ChevronRight className="size-4" /></PageBtn>
            </div>
          </div>
        </section>
      </div>

      {dialog && <XizmatDialog initial={dialog.id ? dialog : null} onClose={() => setDialog(null)} onSave={save} />}
      {toast && <div className="fixed bottom-5 left-1/2 z-[70] -translate-x-1/2 rounded-xl bg-ink px-4 py-2.5 text-[12.5px] font-medium text-white shadow-lg"><Check className="mr-1.5 inline size-4" />{toast}</div>}
    </ShopLayout>
  )
}

function CatTile({ active, onClick, label, count, children }) {
  return (
    <button type="button" onClick={onClick} className={`flex min-w-0 flex-col items-center rounded-2xl border bg-white px-1.5 pb-2.5 pt-2 text-center transition ${active ? 'border-sea bg-[#f2fbfb] shadow-[0_0_0_1px_#0b8a95]' : 'border-transparent shadow-card hover:border-[#cfe3e6]'}`}>
      <span className="grid h-14 w-full place-items-center rounded-xl bg-[#f3f7fa]">{children}</span>
      <b className={`mt-1.5 line-clamp-2 text-[11px] leading-tight ${active ? 'text-sea' : 'text-ink'}`}>{label}</b>
      <span className="text-[10.5px] text-muted">{count} ta</span>
    </button>
  )
}

function PrefixSelect({ prefix, value, onChange, options }) {
  return (
    <label className="relative flex h-10 min-w-[170px] flex-1 items-center rounded-xl border border-line bg-white">
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-full w-full appearance-none bg-transparent pl-3 pr-8 text-[12.5px] outline-none">
        {options.map(([k, t]) => <option key={k} value={k}>{`${prefix}: ${t}`}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 size-4 text-muted" />
    </label>
  )
}

function SortHead({ label, active, onClick }) {
  return (
    <button type="button" onClick={onClick} className={`inline-flex items-center gap-1 ${active ? 'text-sea' : ''}`}>{label} <ChevronDown className="size-3.5" /></button>
  )
}

function IconBtn({ label, onClick, children }) {
  return <button type="button" title={label} aria-label={label} onClick={onClick} className="grid size-8 place-items-center rounded-lg text-ink-2 hover:bg-[#f1f5f9] hover:text-sea">{children}</button>
}

function PageBtn({ active, disabled, onClick, label, children }) {
  return (
    <button type="button" aria-label={label} disabled={disabled} onClick={onClick} className={`grid size-8 place-items-center rounded-lg border text-[12.5px] font-medium transition disabled:opacity-40 ${active ? 'border-sea bg-sea text-white' : 'border-line bg-white text-ink-2 hover:border-sea'}`}>{children}</button>
  )
}
