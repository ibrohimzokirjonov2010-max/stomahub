import { useCallback, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Search, X, Filter, MoreVertical, Phone, CalendarDays, Plus, Check, UserRound, CalendarPlus, Trash2, Users, UserPlus, CalendarCheck, Wallet } from 'lucide-react'
import { useBemorStats } from '../../bemorStats'
import { CITIES, patchBemor, removeBemor, addBemor, useBemorlar, som } from '../../bemorData'
import { MobileToast } from './parts'
import MobileTabBar from './MobileTabBar'
import { BottomSheet, ToothIcon } from './MobileSeminars'
import { HubTopBar } from './MobileKategoriyalar'
import { Face, MSTATUS, STATUS_TABS, fmtDate } from './bemorParts'

const PAGE = 20
const SORTS = [['default', 'Standart'], ['name', 'Ism bo‘yicha'], ['last', 'Oxirgi tashrif'], ['next', 'Keyingi tashrif'], ['debt', 'Qarz bo‘yicha']]
const EMPTY = { cities: [], gender: '', debt: false, next: false, sort: 'default' }
const TAB_CLS = {
  Yangi: 'bg-[#e9f8ef] text-[#1c9a52]',
  Davolanishda: 'bg-[#e6f4f3] text-[#0b6d73]',
  Kuzatuvda: 'bg-[#fff1e6] text-[#e07a2e]',
  Faol: 'bg-[#e9f8ef] text-[#1c9a52]',
  Nofaol: 'bg-[#eef1f5] text-[#6b7a90]',
}
const KIND_TAG = { 'Endodontik davolash': 'Endodontiya', 'Implant o‘rnatish': 'Implant', 'Profilaktik ko‘rik': 'Gigiyena', 'Ko‘rik': 'Ko‘rik' }
const ACCENT = { Kuzatuvda: ['Kuzatuv', 'bg-[#fff1e6] text-[#e07a2e]'], Nofaol: ['Yakunlangan', 'bg-[#e9f8ef] text-[#1c9a52]'], Yangi: ['Diagnostika', 'bg-[#e6f4f3] text-[#0b6d73]'] }
const SKIP = new Set(['Faol bemor', 'VIP', 'Faol', 'Davolanishda', 'Yangi', 'Kuzatuvda', 'Nofaol'])

const ord = (d) => (d ? d.split('.').reverse().join('') : '')
export function tagsOf(p) {
  const base = [...new Set([...(p.tags || []).filter((t) => !SKIP.has(t)), ...(p.visits || []).map((v) => KIND_TAG[v.kind] || v.kind)])]
  const list = (base.length ? base : ['Konsultatsiya']).slice(0, 2).map((t) => [t, 'bg-[#e6f4f3] text-[#0b6d73]'])
  if (ACCENT[p.status]) list.push(ACCENT[p.status])
  return list
}

export default function MobileBemorlar() {
  const all = useBemorlar()
  const stats = useBemorStats()
  const navigate = useNavigate()
  const location = useLocation()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [f, setF] = useState(EMPTY)
  const [shown, setShown] = useState(PAGE)
  const [sheet, setSheet] = useState(null)
  const [toast, setToast] = useState(() => location.state?.toast || '')
  const [undo, setUndo] = useState(null)
  const closeToast = useCallback(() => { setToast(''); setUndo(null) }, [])

  const match = useCallback((p, x) =>
    (!x.cities.length || x.cities.includes(p.city)) &&
    (!x.gender || p.gender === x.gender) &&
    (!x.debt || p.debt > 0) &&
    (!x.next || !!p.next), [])
  const base = useMemo(() => {
    const s = q.trim().toLowerCase()
    const digits = s.replace(/\D/g, '')
    return all.filter((p) => match(p, f) && (!s || p.name.toLowerCase().includes(s) || p.code.toLowerCase().includes(s.replace('#', '')) || (digits.length >= 3 && p.phone.replace(/\D/g, '').includes(digits))))
  }, [all, q, f, match])
  const list = useMemo(() => {
    const rows = base.filter((p) => !status || p.status === status)
    if (f.sort === 'name') return [...rows].sort((a, b) => a.name.localeCompare(b.name))
    if (f.sort === 'last') return [...rows].sort((a, b) => ord(b.last).localeCompare(ord(a.last)))
    if (f.sort === 'next') return [...rows].filter((p) => p.next).sort((a, b) => ord(a.next).localeCompare(ord(b.next))).concat(rows.filter((p) => !p.next))
    if (f.sort === 'debt') return [...rows].sort((a, b) => b.debt - a.debt)
    return rows
  }, [base, status, f.sort])
  const active = f.cities.length + (f.gender ? 1 : 0) + (f.debt ? 1 : 0) + (f.next ? 1 : 0) + (f.sort !== 'default' ? 1 : 0)
  const pick = (fn) => (v) => { fn(v); setShown(PAGE) }

  const remove = (p) => {
    removeBemor(p.id)
    setSheet(null)
    setUndo(() => () => addBemor(p))
    setToast(`${p.name} o‘chirildi`)
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef8f7_0%,#f6faf9_40%,#f6faf9_100%)] pb-[86px]">
      <div className="px-3.5 pt-3">
        <HubTopBar onBell={() => setToast('Yangi bildirishnomalar yo‘q')} />
        <div className="mt-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-[27px] font-extrabold leading-tight tracking-tight text-[#0d2a4a]">Bemorlar</h1>
            <p className="text-[12.5px] text-[#7d8fa9]">Bemorlaringizni qulay boshqaring</p>
          </div>
          <button type="button" onClick={() => setSheet('filter')} className="relative mt-1 flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-line/70 bg-white px-3 text-[12.5px] font-medium text-ink">
            <Filter className="size-4" /> Filtr
            {active > 0 && <span className="absolute -right-1 -top-1 grid size-[18px] place-items-center rounded-full bg-sea text-[10px] font-bold text-white ring-2 ring-white">{active}</span>}
          </button>
        </div>
        <label className="mt-3 flex h-11 items-center gap-2.5 rounded-xl border border-line/70 bg-white px-3">
          <Search className="size-[18px] shrink-0 text-sea" />
          <input type="search" value={q} onChange={(e) => pick(setQ)(e.target.value)} placeholder="Bemor ismi, telefon yoki ID bo‘yicha qidirish..." className="min-w-0 flex-1 bg-transparent text-[12.5px] text-ink outline-none placeholder:text-muted" />
          {q && <button type="button" onClick={() => setQ('')} aria-label="Tozalash" className="text-muted"><X className="size-4" /></button>}
        </label>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[[Users, 'Jami bemorlar', stats.total, 'bg-[#e6f4f2] text-[#0F766E]'], [UserPlus, 'Bu oy yangi', stats.thisMonth, 'bg-[#e6f8ec] text-[#1c9a52]'], [CalendarCheck, 'Bugungi qabullar', stats.today, 'bg-[#e7f0ff] text-[#3a6fd6]'], [Wallet, 'Qarzdorlar', stats.debtors, 'bg-[#ffe9ee] text-[#e11d48]']].map(([I, l, v, c]) => (
            <div key={l} className="flex items-center gap-2.5 rounded-2xl border border-[#e8f0ef] bg-white p-3">
              <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${c}`}><I className="size-5" /></span>
              <div className="min-w-0"><p className="truncate text-[11px] text-muted">{l}</p><p className="text-[19px] font-extrabold leading-tight text-ink">{v}</p></div>
            </div>
          ))}
        </div>
        {stats.debtSum > 0 && <p className="mt-1.5 text-right text-[11px] text-[#e11d48]">Jami qarzdorlik: {som(stats.debtSum)}</p>}
      </div>

      <div className="mt-3 flex gap-1.5 overflow-x-auto px-3.5 pb-0.5 no-scrollbar">
        {[['', 'Barchasi'], ...STATUS_TABS.map((s) => [s, s])].map(([k, l]) => {
          const on = status === k
          const n = k ? base.filter((p) => p.status === k).length : base.length
          return (
            <button key={l} type="button" aria-pressed={on} onClick={() => pick(setStatus)(k)} className={`flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-[12px] font-medium transition ${on ? 'bg-[#0b8a95] text-white shadow-[0_4px_10px_rgb(11_138_149/0.25)]' : k ? TAB_CLS[k] : 'border border-line/70 bg-white text-ink'}`}>
              {l}<span className={`rounded-full px-1.5 text-[10.5px] font-semibold ${on ? 'bg-white/25' : 'bg-white/80'}`}>{n}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex flex-col gap-2 px-3.5">
        {list.slice(0, shown).map((p) => <PatientCard key={p.id} p={p} onMenu={() => setSheet({ menu: p })} />)}
        {list.length > shown && <button type="button" onClick={() => setShown((n) => n + PAGE)} className="h-11 rounded-xl border border-line bg-white text-[13px] font-semibold text-sea">Yana ko‘rsatish ({list.length - shown})</button>}
        {!list.length && (all.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-[#cfe5e1] bg-white px-6 py-10 text-center">
            <span className="relative grid size-16 place-items-center rounded-3xl bg-[#e6f4f2] text-[#0F766E]">
              <Users className="size-8" strokeWidth={1.6} />
              <span className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full bg-[#0F766E] text-white ring-4 ring-white"><Plus className="size-4" /></span>
            </span>
            <p className="mt-4 text-[16px] font-bold text-ink">Hali bemorlar yo‘q</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted">Birinchi bemoringizni qo‘shing — qabullar, to‘lovlar va davolash tarixi shu yerda jamlanadi.</p>
            <button type="button" onClick={() => navigate('/bemorlar/yangi')} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-[#0F766E] text-[13.5px] font-semibold text-white shadow-[0_6px_16px_rgb(15_118_110/0.25)]"><Plus className="size-4" /> Yangi bemor qo‘shish</button>
          </div>
        ) : (
          <div className="rounded-2xl bg-white px-6 py-10 text-center">
            <p className="text-[14px] font-semibold text-ink">Bemor topilmadi</p>
            <p className="mt-1 text-[12px] text-muted">Qidiruv yoki filtrlarni o‘zgartirib ko‘ring</p>
            <button type="button" onClick={() => { setQ(''); setStatus(''); setF(EMPTY) }} className="mt-3 h-9 rounded-xl bg-sea-50 px-4 text-[12.5px] font-semibold text-sea">Filtrlarni tozalash</button>
          </div>
        ))}
      </div>

      <button type="button" onClick={() => navigate('/bemorlar/yangi')} className="fixed bottom-[76px] right-3.5 z-30 flex h-12 items-center gap-2 rounded-full bg-[#0b6d73] pl-4 pr-5 text-[14px] font-semibold text-white shadow-[0_8px_20px_rgb(11_109_115/0.4)] active:scale-95">
        <Plus className="size-5" /> Bemor
      </button>

      {sheet === 'filter' && <FilterSheet initial={f} count={(x) => all.filter((p) => match(p, x) && (!status || p.status === status)).length} onClose={() => setSheet(null)} onApply={(x) => { setF(x); setShown(PAGE); setSheet(null) }} />}
      {sheet?.menu && (
        <MenuSheet
          p={sheet.menu}
          onClose={() => setSheet(null)}
          onStatus={(s) => { patchBemor(sheet.menu.id, { status: s }); setSheet(null); setToast(`Holat: ${s}`) }}
          onRemove={() => remove(sheet.menu)}
        />
      )}

      <MobileToast text={toast} onClose={closeToast} action={undo && <button type="button" onClick={() => { undo(); closeToast() }} className="shrink-0 text-[13px] font-semibold text-[#5fe0c8]">Qaytarish</button>} />
      <MobileTabBar />
    </div>
  )
}

function PatientCard({ p, onMenu }) {
  const tags = tagsOf(p)
  return (
    <article className="relative rounded-2xl bg-white p-3 shadow-[0_1px_4px_rgb(11_31_58/0.06)]">
      <div className="flex gap-3">
        <Link to={`/bemorlar/${p.id}`} className="relative h-fit shrink-0">
          <Face p={p} className="size-[60px]" text="text-[18px]" />
          <span className={`absolute right-0 top-0.5 size-3 rounded-full ring-2 ring-white ${p.next ? 'bg-[#22c55e]' : 'bg-[#8d99a8]'}`} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1.5 pr-6">
            <Link to={`/bemorlar/${p.id}`} className="min-w-0 flex-1">
              <h3 className="truncate text-[14.5px] font-bold leading-tight text-[#0d2a4a]">{p.name}</h3>
              <p className="mt-0.5 whitespace-nowrap text-[11px] text-muted">#{p.code} <span className="mx-1 text-line">|</span> {p.age} <span className="mx-1 text-line">|</span> {p.gender}</p>
            </Link>
            <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10.5px] font-semibold ${MSTATUS[p.status]}`}>{p.status}</span>
          </div>
          <div className="mt-2 flex items-end gap-2">
            <Link to={`/bemorlar/${p.id}`} className="grid min-w-0 flex-1 grid-cols-2 gap-2">
              <span className="flex min-w-0 gap-1.5">
                <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted" strokeWidth={1.6} />
                <span className="min-w-0">
                  <span className="block text-[10px] leading-tight text-muted">Oxirgi tashrif</span>
                  <b className="block truncate text-[11.5px] font-semibold text-ink">{fmtDate(p.last) || '—'}</b>
                </span>
              </span>
              <span className="flex min-w-0 gap-1.5">
                <ToothIcon className="mt-0.5 size-4 shrink-0 text-muted" strokeWidth={1.6} />
                <span className="min-w-0">
                  <span className="block text-[10px] leading-tight text-muted">Keyingi tashrif</span>
                  <b className={`block truncate text-[11.5px] font-semibold ${p.next ? 'text-ink' : 'text-[#0b8a95]'}`}>{fmtDate(p.next) || 'Rejalashtirish'}</b>
                </span>
              </span>
            </Link>
            <a href={`tel:${p.phone.replace(/\s/g, '')}`} aria-label={`${p.name}ga qo‘ng‘iroq`} className="grid size-11 shrink-0 place-items-center rounded-full bg-[#e6f4f3] text-[#0b6d73]"><Phone className="size-5" /></a>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.map(([t, c]) => <span key={t} className={`rounded-md px-2 py-0.5 text-[10.5px] ${c}`}>{t}</span>)}
          </div>
        </div>
      </div>
      <button type="button" onClick={onMenu} aria-label="Amallar" className="absolute right-1.5 top-2.5 grid size-7 place-items-center text-ink-2"><MoreVertical className="size-4" /></button>
    </article>
  )
}

const chip = (on) => `flex h-9 items-center gap-1.5 rounded-xl border px-3 text-[12.5px] font-medium ${on ? 'border-sea bg-sea-50 text-sea' : 'border-line text-ink'}`

function FilterSheet({ initial, count, onClose, onApply }) {
  const [f, setF] = useState(initial)
  const sw = (key, label) => (
    <button type="button" onClick={() => setF((s) => ({ ...s, [key]: !s[key] }))} className="mt-2 flex h-12 w-full items-center justify-between rounded-xl border border-line px-3 text-[13px] font-medium text-ink">
      {label}
      <span className={`relative h-6 w-10 rounded-full transition ${f[key] ? 'bg-sea' : 'bg-line'}`}><span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${f[key] ? 'left-[18px]' : 'left-0.5'}`} /></span>
    </button>
  )
  return (
    <BottomSheet
      title="Filtrlar"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={() => setF(EMPTY)} className="h-12 rounded-xl border border-line px-4 text-[13.5px] font-semibold text-ink">Tozalash</button>
          <button type="button" onClick={() => onApply(f)} className="h-12 flex-1 rounded-xl bg-sea text-[14px] font-semibold text-white">{count(f)} ta bemor</button>
        </>
      }
    >
      <p className="mt-3 text-[13px] font-semibold text-ink">Shahar</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {CITIES.map((c) => {
          const on = f.cities.includes(c)
          return <button key={c} type="button" aria-pressed={on} onClick={() => setF((s) => ({ ...s, cities: on ? s.cities.filter((x) => x !== c) : [...s.cities, c] }))} className={chip(on)}>{on && <Check className="size-3.5" />}{c}</button>
        })}
      </div>
      <p className="mt-4 text-[13px] font-semibold text-ink">Jinsi</p>
      <div className="mt-2 flex gap-2">
        {['Erkak', 'Ayol'].map((g) => <button key={g} type="button" aria-pressed={f.gender === g} onClick={() => setF((s) => ({ ...s, gender: s.gender === g ? '' : g }))} className={chip(f.gender === g)}>{f.gender === g && <Check className="size-3.5" />}{g}</button>)}
      </div>
      <p className="mt-4 text-[13px] font-semibold text-ink">Saralash</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {SORTS.map(([k, l]) => <button key={k} type="button" aria-pressed={f.sort === k} onClick={() => setF((s) => ({ ...s, sort: k }))} className={chip(f.sort === k)}>{f.sort === k && <Check className="size-3.5" />}{l}</button>)}
      </div>
      <div className="mb-2 mt-3">
        {sw('debt', 'Faqat qarzi borlar')}
        {sw('next', 'Keyingi tashrifi belgilanganlar')}
      </div>
    </BottomSheet>
  )
}

function MenuSheet({ p, onClose, onStatus, onRemove }) {
  const navigate = useNavigate()
  const [confirm, setConfirm] = useState(false)
  const row = 'flex h-12 w-full items-center gap-3 rounded-xl px-2 text-[14px] font-medium text-ink active:bg-page'
  return (
    <BottomSheet title={p.name} onClose={onClose}>
      <div className="mt-1 flex flex-col pb-2">
        <button type="button" onClick={() => navigate(`/bemorlar/${p.id}`)} className={row}><UserRound className="size-5 text-sea" /> Profilni ochish</button>
        <button type="button" onClick={() => navigate(`/bemorlar/${p.id}`, { state: { visit: true } })} className={row}><CalendarPlus className="size-5 text-sea" /> Qabulga yozish</button>
        <a href={`tel:${p.phone.replace(/\s/g, '')}`} className={row}><Phone className="size-5 text-sea" /> {p.phone}</a>
        <p className="mt-2 px-2 text-[12.5px] font-semibold text-muted">Holatni o‘zgartirish</p>
        <div className="mt-2 flex flex-wrap gap-2 px-2">
          {STATUS_TABS.map((s) => <button key={s} type="button" aria-pressed={p.status === s} onClick={() => onStatus(s)} className={`h-9 rounded-xl px-3 text-[12.5px] font-semibold ${p.status === s ? 'ring-2 ring-sea' : ''} ${MSTATUS[s]}`}>{s}</button>)}
        </div>
        {confirm ? (
          <div className="mt-3 flex gap-2 px-2">
            <button type="button" onClick={() => setConfirm(false)} className="h-11 flex-1 rounded-xl border border-line text-[13.5px] font-semibold text-ink">Bekor qilish</button>
            <button type="button" onClick={onRemove} className="h-11 flex-1 rounded-xl bg-sale text-[13.5px] font-semibold text-white">Ha, o‘chirish</button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirm(true)} className={`${row} mt-2 text-sale`}><Trash2 className="size-5" /> Bemorni o‘chirish</button>
        )}
      </div>
    </BottomSheet>
  )
}
