import { useCallback, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  AlertTriangle, ArrowDownToLine, BarChart3, Box, CalendarDays, Check, ChevronRight, Filter, Minus, MoreVertical, PackageCheck, PackageMinus, PackagePlus, PencilLine, Plus, ScanLine, Search, ShoppingCart, Trash2, Truck, X,
} from 'lucide-react'
import { SUPPLIERS, addOmbor, patchOmbor, removeOmbor, useOmbor } from '../../omborData'
import { parts, todayIso } from '../../uchrashuvData'
import { MobileToast } from './parts'
import MobileTabBar from './MobileTabBar'
import { BottomSheet } from './MobileSeminars'
import { HubTopBar } from './MobileKategoriyalar'

export const GROUPS = [
  ['Materiallar', ['Restavratsion material', 'Anesteziya', 'Endodontiya', 'Sarf materiallar', 'Dezinfeksiya', 'Profilaktika', 'Bondlar']],
  ['Implantlar', ['Implantlar']],
  ['Instrumentlar', ['Asboblar']],
  ['Jihozlar', ['Uskunalar']],
]
const groupOf = (cat) => GROUPS.find(([, list]) => list.includes(cat))?.[0] || 'Materiallar'
const MON = ['yan', 'fev', 'mar', 'apr', 'may', 'iyun', 'iyul', 'avg', 'sen', 'okt', 'noy', 'dek']
const TODAY = todayIso()
const PAGE = 20
const EMPTY = { stock: '', expiring: false, suppliers: [], sort: 'default' }
const SORTS = [['default', 'Standart'], ['name', 'Nomi bo‘yicha'], ['low', 'Qoldiq kam → ko‘p'], ['expiry', 'Muddati yaqin']]
export const fmt = (n) => Math.round(Number(n) || 0).toLocaleString('ru-RU').replace(/\u00a0/g, ' ')

const toIso = (dmy) => (dmy ? dmy.split('.').reverse().join('-') : '')
const daysTo = (iso) => {
  const a = parts(TODAY)
  const b = parts(iso)
  return Math.round((new Date(b.y, b.m - 1, b.d) - new Date(a.y, a.m - 1, a.d)) / 86400000)
}
export const isLow = (r) => r.qty < r.min
export const expiryOf = (r) => {
  if (!r.expiry) return null
  const iso = toIso(r.expiry)
  const { d, m, y } = parts(iso)
  const left = daysTo(iso)
  return { text: `${d} ${MON[m - 1]} ${y}`, left, tone: left < 0 ? 'text-[#e0263c]' : left <= 60 ? 'text-[#e07a2e]' : 'text-muted' }
}
const target = (r) => Math.max(r.min * 2, r.qty, 1)

export default function MobileOmbor() {
  const rows = useOmbor()
  const navigate = useNavigate()
  const location = useLocation()
  const [q, setQ] = useState('')
  const [group, setGroup] = useState('')
  const [f, setF] = useState(EMPTY)
  const [shown, setShown] = useState(PAGE)
  const [sheet, setSheet] = useState(null)
  const [toast, setToast] = useState(() => location.state?.toast || '')
  const [undo, setUndo] = useState(null)
  const closeToast = useCallback(() => { setToast(''); setUndo(null) }, [])

  const base = useMemo(() => {
    const s = q.trim().toLowerCase()
    return rows.filter((r) => {
      const ex = expiryOf(r)
      return (!s || `${r.name} ${r.sku} ${r.category} ${r.supplier} ${r.pack}`.toLowerCase().includes(s))
        && (!f.stock || (f.stock === 'low' ? isLow(r) : !isLow(r)))
        && (!f.expiring || (ex && ex.left <= 60))
        && (!f.suppliers.length || f.suppliers.includes(r.supplier))
    })
  }, [rows, q, f])
  const list = useMemo(() => {
    const out = base.filter((r) => !group || groupOf(r.category) === group)
    if (f.sort === 'name') return [...out].sort((a, b) => a.name.localeCompare(b.name))
    if (f.sort === 'low') return [...out].sort((a, b) => a.qty / Math.max(a.min, 1) - b.qty / Math.max(b.min, 1))
    if (f.sort === 'expiry') return [...out].filter((r) => r.expiry).sort((a, b) => toIso(a.expiry).localeCompare(toIso(b.expiry))).concat(out.filter((r) => !r.expiry))
    return out
  }, [base, group, f.sort])
  const lowCount = rows.filter(isLow).length
  const active = (f.stock ? 1 : 0) + (f.expiring ? 1 : 0) + f.suppliers.length + (f.sort !== 'default' ? 1 : 0)
  const reset = (fn) => (v) => { fn(v); setShown(PAGE) }

  const remove = (r) => {
    removeOmbor(r.id)
    setSheet(null)
    setUndo(() => () => addOmbor(r))
    setToast(`${r.name} o‘chirildi`)
  }
  const done = (msg) => { setSheet(null); setToast(msg) }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef8f7_0%,#f6faf9_40%,#f6faf9_100%)] pb-[150px]">
      <div className="px-3.5 pt-3">
        <HubTopBar onBell={() => setToast(lowCount ? `${lowCount} ta mahsulot kam qoldi` : 'Yangi bildirishnomalar yo‘q')} />
        <div className="mt-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-[27px] font-extrabold leading-tight tracking-tight text-[#0d2a4a]">Ombor</h1>
            <p className="text-[12.5px] text-[#7d8fa9]">Materiallar va jihozlar inventarizatsiyasi</p>
          </div>
          <button type="button" onClick={() => setSheet('scan')} className="mt-1 flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-line/70 bg-white px-3 text-[12.5px] font-medium text-ink">
            <ScanLine className="size-4 text-sea" /> Skaner
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <label className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-line/70 bg-white px-3">
            <Search className="size-[18px] shrink-0 text-sea" />
            <input type="search" value={q} onChange={(e) => reset(setQ)(e.target.value)} placeholder="Mahsulot nomi, kategoriya yoki SKU..." className="min-w-0 flex-1 bg-transparent text-[12.5px] text-ink outline-none placeholder:text-muted" />
            {q && <button type="button" onClick={() => setQ('')} aria-label="Tozalash" className="text-muted"><X className="size-4" /></button>}
          </label>
          <button type="button" onClick={() => setSheet('filter')} className="relative flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-line/70 bg-white px-3 text-[12.5px] font-medium text-ink">
            <Filter className="size-4" /> Filtr
            {active > 0 && <span className="absolute -right-1 -top-1 grid size-[18px] place-items-center rounded-full bg-sea text-[10px] font-bold text-white ring-2 ring-white">{active}</span>}
          </button>
        </div>
      </div>

      <div className="mt-3 flex gap-1.5 overflow-x-auto px-3.5 pb-0.5 no-scrollbar">
        {[['', 'Barchasi'], ...GROUPS.map(([g]) => [g, g])].map(([k, l]) => {
          const on = group === k
          const n = k ? base.filter((r) => groupOf(r.category) === k).length : base.length
          return (
            <button key={l} type="button" aria-pressed={on} onClick={() => reset(setGroup)(k)} className={`h-9 shrink-0 whitespace-nowrap rounded-xl border px-3 text-[12px] font-medium transition ${on ? 'border-[#0b6d73] bg-[#0b6d73] text-white' : 'border-line/70 bg-white text-ink'}`}>
              {l} ({n})
            </button>
          )
        })}
      </div>

      <div className="px-3.5">
        {lowCount > 0 && (
          <button type="button" onClick={() => { setF((s) => ({ ...s, stock: s.stock === 'low' ? '' : 'low' })); setShown(PAGE) }} className={`mt-3 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${f.stock === 'low' ? 'bg-[#ffe1e4] ring-1 ring-[#f3a3ad]' : 'bg-[#ffecee]'}`}>
            <AlertTriangle className="size-7 shrink-0 fill-[#e0263c] text-white" strokeWidth={2} />
            <span className="min-w-0 flex-1">
              <b className="block text-[13.5px] font-bold text-[#0d2a4a]">Kam miqdordagi mahsulotlar</b>
              <span className="block text-[11.5px] text-ink-2">{f.stock === 'low' ? 'Faqat kam qolganlar ko‘rsatilmoqda. Bekor qilish uchun bosing.' : `${lowCount} ta mahsulotning qoldig‘i kam. Zudlik bilan buyurtma bering.`}</span>
            </span>
            {f.stock === 'low' ? <X className="size-5 shrink-0 text-[#e0263c]" /> : <ChevronRight className="size-5 shrink-0 text-[#e0263c]" />}
          </button>
        )}

        <div className="mt-3 flex flex-col gap-2">
          {list.slice(0, shown).map((r) => <ItemCard key={r.id} r={r} onOrder={() => setSheet({ order: r.id })} onMenu={() => setSheet({ menu: r.id })} />)}
          {list.length > shown && <button type="button" onClick={() => setShown((n) => n + PAGE)} className="h-11 rounded-xl border border-line bg-white text-[13px] font-semibold text-sea">Yana ko‘rsatish ({list.length - shown})</button>}
          {!list.length && (
            <div className="rounded-2xl bg-white px-6 py-10 text-center">
              <Box className="mx-auto size-10 text-[#b9c3cf]" strokeWidth={1.4} />
              <p className="mt-2 text-[14px] font-semibold text-ink">Mahsulot topilmadi</p>
              <p className="mt-1 text-[12px] text-muted">Qidiruv yoki filtrlarni o‘zgartirib ko‘ring</p>
              <button type="button" onClick={() => { setQ(''); setGroup(''); setF(EMPTY) }} className="mt-3 h-9 rounded-xl bg-sea-50 px-4 text-[12.5px] font-semibold text-sea">Filtrlarni tozalash</button>
            </div>
          )}
        </div>

        <button type="button" onClick={() => setSheet('report')} className="mt-2 flex h-12 w-full items-center gap-2.5 rounded-xl bg-white px-3 text-[13px] font-medium text-ink shadow-[0_1px_4px_rgb(11_31_58/0.06)]">
          <Box className="size-5 text-sea" strokeWidth={1.7} /> <span className="flex-1 text-left">Ombor hisoboti</span> <ChevronRight className="size-4 text-muted" />
        </button>
      </div>

      <button type="button" onClick={() => navigate('/ombor/yangi')} className="fixed bottom-[76px] right-3.5 z-30 flex h-12 items-center gap-2 rounded-full bg-[#0b6d73] pl-4 pr-5 text-[14px] font-semibold text-white shadow-[0_8px_20px_rgb(11_109_115/0.4)] active:scale-95">
        <Plus className="size-5" /> Mahsulot qo‘shish
      </button>

      {sheet === 'filter' && <FilterSheet initial={f} count={(x) => rows.filter((r) => (!x.stock || (x.stock === 'low' ? isLow(r) : !isLow(r))) && (!x.expiring || (expiryOf(r) && expiryOf(r).left <= 60)) && (!x.suppliers.length || x.suppliers.includes(r.supplier))).length} onClose={() => setSheet(null)} onApply={(x) => { setF(x); setShown(PAGE); setSheet(null) }} />}
      {sheet === 'scan' && <ScanSheet rows={rows} onClose={() => setSheet(null)} onFound={(r) => setSheet({ menu: r.id })} />}
      {sheet === 'report' && <ReportSheet rows={rows} onClose={() => setSheet(null)} />}
      {sheet?.order && <OrderSheet r={rows.find((x) => x.id === sheet.order)} onClose={() => setSheet(null)} onDone={done} />}
      {sheet?.menu && (
        <MenuSheet
          r={rows.find((x) => x.id === sheet.menu)}
          onClose={() => setSheet(null)}
          onOrder={() => setSheet({ order: sheet.menu })}
          onEdit={() => navigate('/ombor/yangi', { state: { edit: sheet.menu } })}
          onDone={done}
          onRemove={remove}
        />
      )}

      <MobileToast text={toast} onClose={closeToast} action={undo && <button type="button" onClick={() => { undo(); closeToast() }} className="shrink-0 text-[13px] font-semibold text-[#5fe0c8]">Qaytarish</button>} />
      <MobileTabBar />
    </div>
  )
}

function Thumb({ r, className = 'size-[76px]' }) {
  const [ok, setOk] = useState(true)
  return (
    <span className={`grid shrink-0 place-items-center overflow-hidden rounded-xl bg-[#f3f6f9] ${className}`}>
      {r.image && ok ? <img src={r.image} alt="" onError={() => setOk(false)} className="size-full object-cover" /> : <Box className="size-8 text-[#b9c3cf]" strokeWidth={1.4} />}
    </span>
  )
}

function ItemCard({ r, onOrder, onMenu }) {
  const low = isLow(r)
  const pct = Math.min(100, (r.qty / target(r)) * 100)
  const bar = r.qty === 0 || low ? 'bg-[#ef4444]' : r.qty < r.min * 1.3 ? 'bg-[#f5b30b]' : 'bg-[#22b35e]'
  const ex = expiryOf(r)
  return (
    <article className="relative rounded-2xl bg-white p-2.5 shadow-[0_1px_4px_rgb(11_31_58/0.06)]">
      <div className="flex gap-2.5">
        <button type="button" onClick={onMenu} className="h-fit shrink-0"><Thumb r={r} /></button>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1.5 pr-6">
            <button type="button" onClick={onMenu} className="min-w-0 flex-1 text-left">
              <h3 className="truncate text-[14px] font-bold leading-tight text-[#0d2a4a]">{r.name}</h3>
              <p className="mt-0.5 truncate text-[11px] text-muted">{groupOf(r.category)} <span className="mx-1 text-line">|</span> SKU: {r.sku}</p>
            </button>
            <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold ${r.qty === 0 ? 'bg-[#ffecee] text-[#e0263c]' : low ? 'bg-[#ffecee] text-[#e0263c]' : 'bg-[#e6f8ec] text-[#1c9a52]'}`}>{r.qty === 0 ? 'Tugagan' : low ? 'Kam qoldi' : 'Norma'}</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-[#edf1f5]"><span className={`block h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} /></span>
            <b className={`shrink-0 text-[11.5px] font-semibold ${low ? 'text-[#e0263c]' : 'text-[#1c9a52]'}`}>{fmt(r.qty)} / {fmt(target(r))} {r.unit}</b>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className={`flex min-w-0 flex-1 items-center gap-1 text-[10.5px] ${ex ? ex.tone : 'text-muted'}`}>
              <CalendarDays className="size-3.5 shrink-0" strokeWidth={1.7} />
              <span className="truncate" title="Yaroqlilik muddati">{ex ? (ex.left < 0 ? `Eskirgan: ${ex.text}` : `${ex.text} gacha`) : 'Muddatsiz'}</span>
            </span>
            {r.ordered ? (
              <span className="flex h-8 shrink-0 items-center gap-1 rounded-lg bg-[#e6f4f3] px-2.5 text-[11px] font-semibold text-[#0b6d73]"><Truck className="size-3.5" /> Yo‘lda: {fmt(r.ordered)}</span>
            ) : (
              <button type="button" onClick={onOrder} className="flex h-8 shrink-0 items-center gap-1 rounded-lg bg-[#0b6d73] px-2 text-[11px] font-semibold text-white active:scale-95"><ShoppingCart className="size-3.5" /> Buyurtma berish</button>
            )}
          </div>
        </div>
      </div>
      <button type="button" onClick={onMenu} aria-label="Amallar" className="absolute right-1 top-2 grid size-7 place-items-center text-ink-2"><MoreVertical className="size-4" /></button>
    </article>
  )
}

function Stepper({ value, onChange, min = 1 }) {
  return (
    <div className="flex h-12 items-center rounded-xl border border-line">
      <button type="button" disabled={value <= min} onClick={() => onChange(value - 1)} aria-label="Kamaytirish" className="grid size-12 place-items-center text-ink disabled:text-line"><Minus className="size-4" /></button>
      <input value={value} onChange={(e) => onChange(Math.max(min, Number(e.target.value.replace(/\D/g, '')) || min))} inputMode="numeric" aria-label="Miqdor" className="min-w-0 flex-1 bg-transparent text-center text-[17px] font-bold text-ink outline-none" />
      <button type="button" onClick={() => onChange(value + 1)} aria-label="Ko‘paytirish" className="grid size-12 place-items-center text-ink"><Plus className="size-4" /></button>
    </div>
  )
}

function SheetHead({ r }) {
  return (
    <div className="mt-2 flex items-center gap-3 rounded-2xl bg-[#f2f8f8] p-2.5">
      <Thumb r={r} className="size-12" />
      <div className="min-w-0">
        <p className="truncate text-[14px] font-bold text-ink">{r.name}</p>
        <p className="truncate text-[11.5px] text-muted">{r.category} · SKU: {r.sku}</p>
        <p className={`text-[11.5px] font-semibold ${isLow(r) ? 'text-[#e0263c]' : 'text-[#1c9a52]'}`}>Qoldiq: {fmt(r.qty)} {r.unit} · min {fmt(r.min)}</p>
      </div>
    </div>
  )
}

function OrderSheet({ r, onClose, onDone }) {
  const [qty, setQty] = useState(() => (r ? Math.max(1, target(r) - r.qty) : 1))
  const [supplier, setSupplier] = useState(r?.supplier || SUPPLIERS[0])
  if (!r) return null
  return (
    <BottomSheet
      title="Buyurtma berish"
      onClose={onClose}
      footer={<button type="button" onClick={() => { patchOmbor(r.id, { ordered: qty, orderFrom: supplier }); onDone(`${supplier}ga buyurtma yuborildi: ${fmt(qty)} ${r.unit}`) }} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0b6d73] text-[14px] font-semibold text-white"><Truck className="size-[18px]" /> Buyurtma yuborish{r.price ? ` · ${fmt(qty * r.price)} so‘m` : ''}</button>}
    >
      <SheetHead r={r} />
      <p className="mb-1.5 mt-3 text-[13px] font-semibold text-ink">Miqdor ({r.unit})</p>
      <Stepper value={qty} onChange={setQty} />
      <p className="mt-1 text-[11.5px] text-muted">Tavsiya: {fmt(Math.max(1, target(r) - r.qty))} {r.unit} — zaxirani me’yorga keltiradi</p>
      <p className="mb-1.5 mt-3 text-[13px] font-semibold text-ink">Yetkazib beruvchi</p>
      <div className="flex flex-wrap gap-2 pb-2">
        {[...new Set([r.supplier, ...SUPPLIERS])].slice(0, 8).map((s) => <button key={s} type="button" aria-pressed={supplier === s} onClick={() => setSupplier(s)} className={`h-9 rounded-xl border px-3 text-[12.5px] font-medium ${supplier === s ? 'border-sea bg-sea-50 text-sea' : 'border-line text-ink'}`}>{s}</button>)}
      </div>
    </BottomSheet>
  )
}

function MenuSheet({ r, onClose, onOrder, onEdit, onDone, onRemove }) {
  const [mode, setMode] = useState('')
  const [n, setN] = useState(1)
  const [confirm, setConfirm] = useState(false)
  if (!r) return null
  const row = 'flex h-12 w-full items-center gap-3 rounded-xl px-2 text-[14px] font-medium text-ink active:bg-page'
  if (mode) {
    const plus = mode === 'in'
    return (
      <BottomSheet
        title={plus ? 'Kirim qilish' : 'Chiqim qilish'}
        onClose={onClose}
        footer={<button type="button" disabled={!plus && n > r.qty} onClick={() => { patchOmbor(r.id, { qty: r.qty + (plus ? n : -n) }); onDone(`${r.name}: ${plus ? '+' : '−'}${fmt(n)} ${r.unit}`) }} className="h-12 flex-1 rounded-xl bg-[#0b6d73] text-[14px] font-semibold text-white disabled:opacity-40">{plus ? 'Kirim qilish' : 'Chiqim qilish'}</button>}
      >
        <SheetHead r={r} />
        <p className="mb-1.5 mt-3 text-[13px] font-semibold text-ink">Miqdor ({r.unit})</p>
        <Stepper value={n} onChange={setN} />
        <p className={`mb-2 mt-1 text-[11.5px] ${!plus && n > r.qty ? 'text-sale' : 'text-muted'}`}>{!plus && n > r.qty ? `Omborda faqat ${fmt(r.qty)} ${r.unit} bor` : `Yangi qoldiq: ${fmt(r.qty + (plus ? n : -n))} ${r.unit}`}</p>
      </BottomSheet>
    )
  }
  return (
    <BottomSheet title="Amallar" onClose={onClose}>
      <SheetHead r={r} />
      <div className="mt-2 flex flex-col pb-2">
        {r.ordered > 0 && <button type="button" onClick={() => { patchOmbor(r.id, { qty: r.qty + r.ordered, ordered: 0 }); onDone(`Buyurtma qabul qilindi: +${fmt(r.ordered)} ${r.unit}`) }} className={`${row} text-[#0b6d73]`}><PackageCheck className="size-5" /> Buyurtmani qabul qilish (+{fmt(r.ordered)})</button>}
        <button type="button" onClick={() => setMode('in')} className={row}><PackagePlus className="size-5 text-sea" /> Kirim qilish</button>
        <button type="button" onClick={() => setMode('out')} disabled={!r.qty} className={`${row} disabled:opacity-40`}><PackageMinus className="size-5 text-sea" /> Chiqim qilish (ishlatildi)</button>
        {!r.ordered && <button type="button" onClick={onOrder} className={row}><ShoppingCart className="size-5 text-sea" /> Buyurtma berish</button>}
        <button type="button" onClick={onEdit} className={row}><PencilLine className="size-5 text-sea" /> Tahrirlash</button>
        {confirm ? (
          <div className="mt-2 flex gap-2 px-2">
            <button type="button" onClick={() => setConfirm(false)} className="h-11 flex-1 rounded-xl border border-line text-[13.5px] font-semibold text-ink">Bekor qilish</button>
            <button type="button" onClick={() => onRemove(r)} className="h-11 flex-1 rounded-xl bg-sale text-[13.5px] font-semibold text-white">Ha, o‘chirish</button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirm(true)} className={`${row} text-sale`}><Trash2 className="size-5" /> O‘chirish</button>
        )}
      </div>
    </BottomSheet>
  )
}

const chip = (on) => `flex h-9 items-center gap-1.5 rounded-xl border px-3 text-[12.5px] font-medium ${on ? 'border-sea bg-sea-50 text-sea' : 'border-line text-ink'}`

function FilterSheet({ initial, count, onClose, onApply }) {
  const [f, setF] = useState(initial)
  return (
    <BottomSheet
      title="Filtrlar"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={() => setF(EMPTY)} className="h-12 rounded-xl border border-line px-4 text-[13.5px] font-semibold text-ink">Tozalash</button>
          <button type="button" onClick={() => onApply(f)} className="h-12 flex-1 rounded-xl bg-sea text-[14px] font-semibold text-white">{count(f)} ta mahsulot</button>
        </>
      }
    >
      <p className="mt-3 text-[13px] font-semibold text-ink">Qoldiq</p>
      <div className="mt-2 flex gap-2">
        {[['', 'Barchasi'], ['low', 'Kam qolgan'], ['ok', 'Norma']].map(([k, l]) => <button key={l} type="button" aria-pressed={f.stock === k} onClick={() => setF((s) => ({ ...s, stock: k }))} className={chip(f.stock === k)}>{f.stock === k && <Check className="size-3.5" />}{l}</button>)}
      </div>
      <button type="button" onClick={() => setF((s) => ({ ...s, expiring: !s.expiring }))} className="mt-3 flex h-12 w-full items-center justify-between rounded-xl border border-line px-3 text-[13px] font-medium text-ink">
        Muddati 60 kun ichida tugaydiganlar
        <span className={`relative h-6 w-10 rounded-full transition ${f.expiring ? 'bg-sea' : 'bg-line'}`}><span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${f.expiring ? 'left-[18px]' : 'left-0.5'}`} /></span>
      </button>
      <p className="mt-4 text-[13px] font-semibold text-ink">Yetkazib beruvchi</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {SUPPLIERS.map((s) => {
          const on = f.suppliers.includes(s)
          return <button key={s} type="button" aria-pressed={on} onClick={() => setF((x) => ({ ...x, suppliers: on ? x.suppliers.filter((y) => y !== s) : [...x.suppliers, s] }))} className={chip(on)}>{on && <Check className="size-3.5" />}{s}</button>
        })}
      </div>
      <p className="mt-4 text-[13px] font-semibold text-ink">Saralash</p>
      <div className="mb-2 mt-2 flex flex-wrap gap-2">
        {SORTS.map(([k, l]) => <button key={k} type="button" aria-pressed={f.sort === k} onClick={() => setF((s) => ({ ...s, sort: k }))} className={chip(f.sort === k)}>{f.sort === k && <Check className="size-3.5" />}{l}</button>)}
      </div>
    </BottomSheet>
  )
}

function ScanSheet({ rows, onClose, onFound }) {
  const [code, setCode] = useState('')
  const [miss, setMiss] = useState(false)
  const find = () => {
    const s = code.trim().toLowerCase()
    const r = rows.find((x) => x.sku.toLowerCase() === s) || rows.find((x) => x.sku.toLowerCase().includes(s))
    if (r && s) onFound(r)
    else setMiss(true)
  }
  return (
    <BottomSheet
      title="Skaner"
      onClose={onClose}
      footer={<button type="button" disabled={!code.trim()} onClick={find} className="h-12 flex-1 rounded-xl bg-[#0b6d73] text-[14px] font-semibold text-white disabled:opacity-40">Topish</button>}
    >
      <div className="relative mx-auto mt-3 grid aspect-[16/9] w-full place-items-center overflow-hidden rounded-2xl bg-[#0d2a4a]">
        <span className="absolute inset-6 rounded-xl border-2 border-dashed border-white/40" />
        <span className="absolute inset-x-8 top-1/2 h-0.5 animate-pulse bg-[#5fe0c8]" />
        <p className="relative mt-20 text-[12px] text-white/80">Shtrix-kodni ramka ichiga joylang</p>
      </div>
      <p className="mb-1.5 mt-3 text-[13px] font-semibold text-ink">Yoki SKU kodini kiriting</p>
      <label className={`flex h-12 items-center gap-2 rounded-xl border px-3 ${miss ? 'border-sale' : 'border-line'}`}>
        <ScanLine className="size-5 text-sea" />
        <input value={code} onChange={(e) => { setCode(e.target.value); setMiss(false) }} onKeyDown={(e) => e.key === 'Enter' && find()} placeholder="Masalan: CMP-001" autoCapitalize="characters" className="min-w-0 flex-1 bg-transparent text-[14px] uppercase outline-none placeholder:normal-case" />
      </label>
      <p className={`mb-2 mt-1 text-[11.5px] ${miss ? 'text-sale' : 'text-muted'}`}>{miss ? 'Bunday SKU topilmadi' : 'Mahsulot topilsa, amallar oynasi ochiladi'}</p>
    </BottomSheet>
  )
}

function ReportSheet({ rows, onClose }) {
  const value = rows.reduce((s, r) => s + r.qty * (r.price || 0), 0)
  const low = rows.filter(isLow)
  const soon = rows.filter((r) => { const e = expiryOf(r); return e && e.left <= 60 })
  const ordered = rows.filter((r) => r.ordered > 0)
  const byGroup = GROUPS.map(([g]) => [g, rows.filter((r) => groupOf(r.category) === g).reduce((s, r) => s + r.qty * (r.price || 0), 0)])
  const top = Math.max(...byGroup.map(([, v]) => v), 1)
  const stats = [
    ['Mahsulotlar', `${rows.length} ta`, Box],
    ['Kam qolgan', `${low.length} ta`, AlertTriangle],
    ['Muddati yaqin', `${soon.length} ta`, CalendarDays],
    ['Yo‘lda', `${ordered.length} ta`, Truck],
  ]
  return (
    <BottomSheet title="Ombor hisoboti" onClose={onClose}>
      <div className="mt-2 rounded-2xl bg-[#0b6d73] p-4 text-white">
        <p className="flex items-center gap-1.5 text-[12px] text-white/80"><BarChart3 className="size-4" /> Ombor qiymati</p>
        <b className="mt-1 block text-[24px] font-extrabold">{fmt(value)} so‘m</b>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {stats.map(([l, v, Icon]) => (
          <div key={l} className="flex items-center gap-2.5 rounded-xl bg-[#f3f7fa] p-2.5">
            <Icon className="size-5 text-sea" strokeWidth={1.7} />
            <span><span className="block text-[11px] text-muted">{l}</span><b className="text-[14px] font-bold text-ink">{v}</b></span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[13px] font-semibold text-ink">Guruhlar bo‘yicha qiymat</p>
      <div className="mt-2 flex flex-col gap-2.5">
        {byGroup.map(([g, v]) => (
          <div key={g}>
            <div className="flex justify-between text-[12px]"><span className="text-ink-2">{g}</span><b className="font-semibold text-ink">{fmt(v)} so‘m</b></div>
            <span className="mt-1 block h-2 overflow-hidden rounded-full bg-[#edf1f5]"><span className="block h-full rounded-full bg-[#0b8a95]" style={{ width: `${(v / top) * 100}%` }} /></span>
          </div>
        ))}
      </div>
      {low.length > 0 && (
        <>
          <p className="mt-4 text-[13px] font-semibold text-ink">Buyurtma kerak</p>
          <div className="mb-2 mt-1 divide-y divide-line/70">
            {low.slice(0, 6).map((r) => (
              <div key={r.id} className="flex items-center gap-2 py-2 text-[12.5px]">
                <ArrowDownToLine className="size-4 shrink-0 text-[#e0263c]" />
                <span className="min-w-0 flex-1 truncate text-ink">{r.name}</span>
                <b className="shrink-0 font-semibold text-[#e0263c]">{fmt(r.qty)}/{fmt(r.min)} {r.unit}</b>
              </div>
            ))}
          </div>
        </>
      )}
    </BottomSheet>
  )
}
