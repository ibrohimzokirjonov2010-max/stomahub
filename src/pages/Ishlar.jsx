import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Heart, Plus, ChevronDown, MapPin, X } from 'lucide-react'
import ShopLayout from '../components/market/ShopLayout'
import EmptyCatalog from '../components/EmptyCatalog'
import { useCatalogVersion } from '../recordSync'
import {
  jobs, cities, specs, exps, types, sorts, tips, popularClinics, resumes, resumePhoto,
  expName, typeName, pay,
} from '../ishlarData'

const PAY_MIN = 3000000
const PAY_MAX = 30000000

export default function Ishlar() {
  const [q, setQ] = useState('')
  return (
    <ShopLayout active="ishlar" search="plain" placeholder="Lavozim, klinika yoki shahar bo‘yicha qidiring..." onQuery={setQ}>
      <Catalog query={q} />
    </ShopLayout>
  )
}

function Catalog({ query }) {
  useCatalogVersion()
  const [params] = useSearchParams()
  const [tab, setTab] = useState('jobs')
  const [city, setCity] = useState([])
  const [spec, setSpec] = useState([])
  const [exp, setExp] = useState([])
  const [type, setType] = useState([])
  const [lo, setLo] = useState(PAY_MIN)
  const [hi, setHi] = useState(PAY_MAX)
  const [sort, setSort] = useState('fresh')
  const [saved, setSaved] = useState(() => new Set())
  const [apply, setApply] = useState(null)
  const [resume, setResume] = useState(false)
  const [vacancy, setVacancy] = useState(false)
  const [tip, setTip] = useState(null)
  const [sent, setSent] = useState('')
  const clinic = params.get('clinic') || ''

  const counts = useMemo(() => {
    const tally = (key) => jobs.reduce((m, j) => (m[j[key]] = (m[j[key]] || 0) + 1, m), {})
    return { city: tally('city'), spec: tally('spec'), exp: tally('exp'), type: tally('type') }
  }, [])

  const list = useMemo(() => {
    const text = query.trim().toLowerCase()
    let rows = jobs.filter((j) => {
      if (clinic && j.clinic !== clinic) return false
      if (city.length && !city.includes(j.city)) return false
      if (spec.length && !spec.includes(j.spec)) return false
      if (exp.length && !exp.includes(j.exp)) return false
      if (type.length && !type.includes(j.type)) return false
      if (j.max < lo || j.min > hi) return false
      if (text && !`${j.title} ${j.clinic} ${j.cityLabel} ${j.district}`.toLowerCase().includes(text)) return false
      if (tab === 'saved' && !saved.has(j.id)) return false
      return true
    })
    if (sort === 'pay') rows = [...rows].sort((a, b) => b.max - a.max)
    else if (sort === 'exp') rows = [...rows].sort((a, b) => rankExp(b.exp) - rankExp(a.exp))
    else rows = [...rows].sort((a, b) => a.rank - b.rank)
    return rows
  }, [city, spec, exp, type, lo, hi, sort, query, clinic, tab, saved])

  const toggle = (list, set, value) => set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
  const clear = () => { setCity([]); setSpec([]); setExp([]); setType([]); setLo(PAY_MIN); setHi(PAY_MAX) }
  const save = (id) => setSaved((prev) => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  return (
    <div className="pb-8 pt-3">
      <p className="text-[11px] text-muted"><Link to="/" className="hover:text-sea">Bosh sahifa</Link> <span className="px-1">›</span> Ishlar</p>
      <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold text-ink">Ishlar</h1>
          <p className="mt-0.5 text-[12px] text-muted">Stomatologlar va klinika xodimlari uchun eng yaxshi imkoniyatlar</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setResume(true)} className="h-9 rounded-full border border-[#d7e3ea] bg-white px-3 text-[12px] font-semibold text-ink">Rezyume joylash</button>
          <button onClick={() => setVacancy(true)} className="inline-flex h-9 items-center gap-1 rounded-full bg-sea px-3 text-[12px] font-semibold text-white"><Plus className="size-3.5" /> Vakansiya joylash</button>
        </div>
      </div>

      <div className="mt-3 flex gap-5 border-b border-[#e6eef3] text-[13px]">
        {[['jobs', 'Vakansiyalar'], ['cv', 'Rezyumelar'], ['saved', 'Saqlanganlar']].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`-mb-px border-b-2 pb-2 ${tab === k ? 'border-sea font-semibold text-sea' : 'border-transparent text-muted'}`}>{label}</button>
        ))}
      </div>

      {tab === 'cv' ? (
        <div className="mt-3 grid gap-2">
          {resumes.map((r) => (
            <article key={r.id} className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-card">
              <span className="grid size-10 place-items-center rounded-full bg-sea-50 text-[12px] font-bold text-sea">{r.name.slice(0, 1)}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-ink">{r.name}</p>
                <p className="text-[11px] text-sea">{r.role}</p>
                <p className="text-[11px] text-muted">{r.city} · {r.exp}</p>
              </div>
              <p className="text-[12px] font-bold text-ink">{r.salary}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="ishlar-layout mt-3">
          <aside className="rounded-xl bg-white p-3 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-bold">Filtrlar</p>
              <button onClick={clear} className="text-[10px] font-semibold text-sea">Barchasini tozalash</button>
            </div>
            <Group title="Shahar" rows={cities} picked={city} counts={counts.city} onPick={(v) => toggle(city, setCity, v)} />
            <Group title="Mutaxassislik" rows={specs} picked={spec} counts={counts.spec} onPick={(v) => toggle(spec, setSpec, v)} />
            <p className="mt-3 text-[12px] font-bold">Maosh oralig‘i (so‘m)</p>
            <p className="mt-1 text-[10px] text-muted">{pay(lo, hi)}</p>
            <input type="range" min={PAY_MIN} max={PAY_MAX} step={500000} value={lo} onChange={(e) => setLo(Math.min(Number(e.target.value), hi))} className="surplus-range mt-1 w-full" style={{ '--p': `${((lo - PAY_MIN) / (PAY_MAX - PAY_MIN)) * 100}%` }} />
            <input type="range" min={PAY_MIN} max={PAY_MAX} step={500000} value={hi} onChange={(e) => setHi(Math.max(Number(e.target.value), lo))} className="surplus-range mt-1 w-full" style={{ '--p': `${((hi - PAY_MIN) / (PAY_MAX - PAY_MIN)) * 100}%` }} />
            <div className="mt-0.5 flex justify-between text-[10px] text-muted"><span>3M</span><span>30M</span></div>
            <Group title="Tajriba" rows={exps} picked={exp} counts={counts.exp} onPick={(v) => toggle(exp, setExp, v)} />
            <Group title="Ish turi" rows={types} picked={type} counts={counts.type} onPick={(v) => toggle(type, setType, v)} />
          </aside>

          <section className="min-w-0">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[13px] font-bold text-ink">{list.length} ta vakansiya{clinic ? ` · ${clinic}` : ''}</p>
              <label className="inline-flex items-center gap-1 text-[11px] text-muted">
                Saralash:
                <span className="relative">
                  <select value={sort} onChange={(e) => setSort(e.target.value)} className="appearance-none rounded-lg bg-white py-1 pl-2 pr-6 text-[12px] font-semibold text-ink shadow-card">
                    {Object.entries(sorts).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-1.5 top-1.5 size-3.5 text-muted" />
                </span>
              </label>
            </div>
            {list.length === 0 ? (
              <div className="rounded-xl bg-white p-8 text-center text-[13px] text-muted shadow-card">Bu bo‘limda vakansiya yo‘q. Filtrlarni tozalang yoki vakansiyani saqlang.</div>
            ) : (
              <div className="grid gap-2">
                {!jobs.length ? <EmptyCatalog title="Ish o‘rinlari bo‘sh" text="Hali ish e’lonlari yo‘q." /> : null}
      {list.map((j) => (
                  <article key={j.id} className="grid min-w-0 grid-cols-[72px_minmax(0,1fr)] gap-2.5 rounded-xl bg-white p-2.5 shadow-card">
                    <Link to={`/ishlar/${j.id}`} className="relative size-[72px] overflow-hidden rounded-lg">
                      <img src={j.image} alt="" className="size-full object-cover" />
                      {j.top && <span className="absolute left-1 top-1 rounded bg-sea px-1 py-px text-[8px] font-bold text-white">Top</span>}
                    </Link>
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link to={`/ishlar/${j.id}`} className="block truncate text-[13px] font-bold text-ink hover:text-sea">{j.title}</Link>
                          <p className="truncate text-[11px] font-semibold text-sea">{j.clinic}</p>
                          <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-muted"><MapPin className="size-3 shrink-0" /> {j.cityLabel}{j.district ? `, ${j.district}` : ''} · {typeName[j.type]} · {j.expLabel || expName[j.exp]}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="whitespace-nowrap text-[12px] font-extrabold text-ink">{pay(j.min, j.max)}</p>
                          <p className="mt-0.5 text-[10px] text-muted">{j.posted}</p>
                        </div>
                      </div>
                      <div className="mt-1 flex items-end justify-between gap-2">
                        <p className="line-clamp-2 min-w-0 flex-1 text-[11px] leading-snug text-ink-2">{j.about}</p>
                        <div className="flex shrink-0 gap-1">
                          <button onClick={() => save(j.id)} className={`inline-flex h-7 items-center gap-1 whitespace-nowrap rounded-lg border px-2 text-[10px] font-semibold ${saved.has(j.id) ? 'border-sea bg-sea-50 text-sea' : 'border-[#d7e3ea] text-ink-2'}`}>
                            <Heart className={`size-3 ${saved.has(j.id) ? 'fill-sea' : ''}`} /> Saqlash
                          </button>
                          <button onClick={() => setApply(j)} className="h-7 whitespace-nowrap rounded-lg bg-sea px-2 text-[10px] font-semibold text-white">Ariza topshirish</button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="grid gap-3">
            <div className="overflow-hidden rounded-xl bg-white shadow-card">
              <img src={resumePhoto} alt="" className="h-[132px] w-full object-cover object-top" />
              <div className="p-3">
                <p className="text-[13px] font-bold">Rezyume yaratish</p>
                <p className="mt-1 text-[11px] leading-snug text-muted">Eng yaxshi klinikalar sizni topishi uchun professional rezyume joylang.</p>
                <button onClick={() => setResume(true)} className="mt-2 h-8 w-full rounded-lg bg-sea text-[12px] font-semibold text-white">Rezyume joylash</button>
              </div>
            </div>
            {popularClinics().length > 0 && <div className="rounded-xl bg-white p-3 shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-bold">Mashhur klinikalar</p>
                <Link to="/ishlar" className="text-[10px] text-sea">Barchasini ko‘rish</Link>
              </div>
              <div className="mt-2 grid gap-2">
                {popularClinics().map(({ name, city, count }) => (
                  <Link key={name} to={`/ishlar?clinic=${encodeURIComponent(name)}`} className="flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-lg bg-sea-50 text-[10px] font-bold text-sea">{mark(name)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-semibold text-ink">{name}</span>
                      <span className="block text-[10px] text-muted">{[city, `${count} ta vakansiya`].filter(Boolean).join(' · ')}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>}
            <div className="rounded-xl bg-white p-3 shadow-card">
              <p className="text-[13px] font-bold">Foydali maslahatlar</p>
              <div className="mt-2 grid gap-1.5">
                {tips.map(([title, body]) => (
                  <button key={title} onClick={() => setTip([title, body])} className="text-left text-[12px] text-sea hover:underline">{title}</button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}

      {apply && <Modal title="Ariza topshirish" onClose={() => { setApply(null); setSent('') }}>
        <p className="text-[12px] text-muted">{apply.title} · {apply.clinic}</p>
        {sent === 'apply' ? <p className="mt-3 text-[13px] font-semibold text-sea">Arizangiz yuborildi. Klinika siz bilan bog‘lanadi.</p> : (
          <form className="mt-3 grid gap-2" onSubmit={(e) => { e.preventDefault(); setSent('apply') }}>
            <Field label="Ism" />
            <Field label="Telefon" />
            <button className="mt-1 h-9 rounded-lg bg-sea text-[12px] font-semibold text-white">Yuborish</button>
          </form>
        )}
      </Modal>}
      {resume && <Modal title="Rezyume joylash" onClose={() => { setResume(false); setSent('') }}>
        {sent === 'cv' ? <p className="text-[13px] font-semibold text-sea">Rezyume qabul qilindi.</p> : (
          <form className="grid gap-2" onSubmit={(e) => { e.preventDefault(); setSent('cv') }}>
            <Field label="Ism" />
            <Field label="Mutaxassislik" />
            <Field label="Shahar" />
            <button className="mt-1 h-9 rounded-lg bg-sea text-[12px] font-semibold text-white">Joylash</button>
          </form>
        )}
      </Modal>}
      {vacancy && <Modal title="Vakansiya joylash" onClose={() => { setVacancy(false); setSent('') }}>
        {sent === 'job' ? <p className="text-[13px] font-semibold text-sea">Vakansiya moderatorga yuborildi.</p> : (
          <form className="grid gap-2" onSubmit={(e) => { e.preventDefault(); setSent('job') }}>
            <Field label="Lavozim" />
            <Field label="Klinika" />
            <Field label="Maosh" />
            <button className="mt-1 h-9 rounded-lg bg-sea text-[12px] font-semibold text-white">Joylash</button>
          </form>
        )}
      </Modal>}
      {tip && <Modal title={tip[0]} onClose={() => setTip(null)}><p className="text-[13px] leading-relaxed text-ink-2">{tip[1]}</p></Modal>}
    </div>
  )
}

function mark(name) { return name.slice(0, 2).toUpperCase() }

function rankExp(k) {
  return { none: 0, y1: 1, y3: 2, y5: 3 }[k] || 0
}

function Group({ title, rows, picked, counts, onPick }) {
  return (
    <div className="mt-3">
      <p className="text-[12px] font-bold">{title}</p>
      <div className="mt-1.5 grid gap-1">
        {rows.map(([k, label]) => (
          <label key={k} className="flex items-center gap-1.5 text-[11px] text-ink-2">
            <input type="checkbox" checked={picked.includes(k)} onChange={() => onPick(k)} className="size-3.5 accent-sea" />
            <span className="min-w-0 flex-1 truncate">{label}</span>
            <span className="text-[10px] text-muted">{counts[k] || 0}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function Field({ label }) {
  return (
    <label className="grid gap-1 text-[11px] font-semibold text-ink-2">
      {label}
      <input required className="h-9 rounded-lg border border-[#d7e3ea] px-2 text-[13px] font-normal" />
    </label>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-card" onClick={(e) => e.stopPropagation()}>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-bold">{title}</h2>
          <button onClick={onClose} className="grid size-7 place-items-center rounded-full hover:bg-[#f3f6fb]"><X className="size-4" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}
