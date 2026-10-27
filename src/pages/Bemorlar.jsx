import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Download, Mail, MapPin, MoreHorizontal, Phone, Plus, Search, Upload, X,
} from 'lucide-react'
import ShopLayout from '../components/market/ShopLayout'
import { addBemor, CITIES, patchBemor, removeBemor, SOURCES, STATUSES, statusClass, useBemorlar } from '../bemorData'

export default function Bemorlar() {
  const all = useBemorlar()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [city, setCity] = useState('all')
  const [sort, setSort] = useState('new')
  const [page, setPage] = useState(1)
  const [per, setPer] = useState(10)
  const [sel, setSel] = useState('aliyeva-mohira')
  const [checked, setChecked] = useState({})
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(null)
  const fileRef = useRef(null)

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    let list = all.filter((p) => {
      const okS = status === 'all' || p.status === status
      const okC = city === 'all' || p.city === city
      const blob = `${p.name} ${p.phone} ${p.code} ${p.email}`.toLowerCase()
      return okS && okC && (!query || blob.includes(query))
    })
    if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'uz'))
    if (sort === 'old') list = [...list].sort((a, b) => (a.last || '0').localeCompare(b.last || '0'))
    return list
  }, [all, q, status, city, sort])

  const pages = Math.max(1, Math.ceil(filtered.length / per))
  const safePage = Math.min(page, pages)
  const slice = filtered.slice((safePage - 1) * per, safePage * per)
  const current = all.find((p) => p.id === sel) || slice[0]

  const exportCsv = () => {
    const head = 'Ism,Telefon,Shahar,Status,Oxirgi tashrif,Keyingi qabul'
    const body = filtered.map((p) => [p.name, p.phone, p.city, p.status, p.last, p.next].join(',')).join('\n')
    const blob = new Blob([`\uFEFF${head}\n${body}`], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'bemorlar.csv'
    a.click()
  }

  const onImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    text.split(/\r?\n/).slice(1).filter(Boolean).forEach((line, i) => {
      const [name, phone, cityName] = line.split(',')
      if (!name) return
      addBemor({
        id: `import-${Date.now()}-${i}`,
        name: name.trim(),
        phone: (phone || '').trim(),
        city: (cityName || 'Toshkent').trim(),
        status: 'Yangi',
        age: '',
        gender: 'Ayol',
        last: '',
        next: '',
        code: `P-${Date.now() % 10000}`,
        email: '',
        photo: '',
        total: 0,
        paid: 0,
      })
    })
    e.target.value = ''
    setPage(1)
  }

  const toggleAll = () => {
    const on = slice.every((p) => checked[p.id])
    setChecked((c) => {
      const next = { ...c }
      slice.forEach((p) => { next[p.id] = !on })
      return next
    })
  }

  return (
    <ShopLayout active="bemorlar" placeholder="Bemor qidiring (ism, telefon, ID)...">
      <div className="pb-4 pt-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-bold leading-none text-ink">Bemorlar</h1>
            <p className="mt-1 text-[13px] text-muted">Barcha bemorlaringizni boshqaring</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setOpen(true)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-sea px-3 text-[12.5px] font-semibold text-white">
              <Plus className="size-4" /> Yangi bemor qo‘shish
            </button>
            <button onClick={() => fileRef.current?.click()} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[12.5px] font-semibold text-ink">
              <Upload className="size-3.5" /> Import
            </button>
            <button onClick={exportCsv} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[12.5px] font-semibold text-ink">
              <Download className="size-3.5" /> Eksport
            </button>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onImport} />
          </div>
        </div>

        <div className="bemor-layout mt-3">
          <section className="min-w-0 rounded-2xl bg-white p-3 shadow-card">
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex h-9 min-w-[180px] flex-1 items-center gap-2 rounded-lg border border-line px-3">
                <Search className="size-4 text-muted" />
                <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Bemor qidiring..." className="w-full bg-transparent text-[12.5px] outline-none placeholder:text-muted" />
              </label>
              <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="h-9 rounded-lg border border-line bg-white px-2 text-[12.5px]">
                <option value="all">Barcha statuslar</option>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
              <select value={city} onChange={(e) => { setCity(e.target.value); setPage(1) }} className="h-9 rounded-lg border border-line bg-white px-2 text-[12.5px]">
                <option value="all">Barcha shaharlar</option>
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-9 rounded-lg border border-line bg-white px-2 text-[12.5px]">
                <option value="new">Yangi oldin</option>
                <option value="old">Eski oldin</option>
                <option value="name">Ism bo‘yicha</option>
              </select>
            </div>

            <div className="bemor-scroll mt-3">
              <table className="bemor-table text-left text-[12px]">
                <thead className="text-[11px] text-muted">
                  <tr className="border-b border-line">
                    <th className="w-8 py-2"><input type="checkbox" checked={slice.length > 0 && slice.every((p) => checked[p.id])} onChange={toggleAll} /></th>
                    <th className="w-8 py-2 font-medium">#</th>
                    <th className="py-2 font-medium">Bemor</th>
                    <th className="py-2 font-medium">Telefon</th>
                    <th className="py-2 font-medium">Shahar</th>
                    <th className="py-2 font-medium">Status</th>
                    <th className="py-2 font-medium">Oxirgi tashrif</th>
                    <th className="py-2 font-medium">Keyingi qabul</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {slice.map((p, i) => (
                    <tr key={p.id} onClick={() => setSel(p.id)} className={`cursor-pointer border-b border-line/70 ${current?.id === p.id ? 'bg-[#eef8f8]' : 'hover:bg-[#f7fbfb]'}`}>
                      <td className="py-2" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={!!checked[p.id]} onChange={() => setChecked((c) => ({ ...c, [p.id]: !c[p.id] }))} />
                      </td>
                      <td className="py-2 text-muted">{(safePage - 1) * per + i + 1}</td>
                      <td className="py-2">
                        <Link to={`/bemorlar/${p.id}`} className="flex min-w-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Face src={p.photo} name={p.name} />
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-ink">{p.name}</span>
                            <span className="block text-[11px] text-muted">{p.age}{p.age && p.gender ? ' · ' : ''}{p.gender}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="whitespace-nowrap py-2 text-ink-2">{p.phone}</td>
                      <td className="py-2">{p.city}</td>
                      <td className="py-2"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass[p.status] || ''}`}>{p.status}</span></td>
                      <td className="whitespace-nowrap py-2 text-muted">{p.last || '—'}</td>
                      <td className="whitespace-nowrap py-2 font-medium text-sea">{p.next || '—'}</td>
                      <td className="relative py-2" onClick={(e) => e.stopPropagation()}>
                        <button aria-label="Yana" onClick={() => setMenu(menu === p.id ? null : p.id)} className="grid size-7 place-items-center rounded-md text-muted hover:bg-white"><MoreHorizontal className="size-4" /></button>
                        {menu === p.id && (
                          <div className="absolute right-0 z-20 w-36 rounded-lg bg-white py-1 text-[12px] shadow-card">
                            <Link to={`/bemorlar/${p.id}`} className="block px-3 py-1.5 hover:bg-sea-50">Profil</Link>
                            <button onClick={() => { setSel(p.id); setMenu(null) }} className="block w-full px-3 py-1.5 text-left hover:bg-sea-50">Yon panel</button>
                            <button onClick={() => { removeBemor(p.id); setMenu(null) }} className="block w-full px-3 py-1.5 text-left text-sale hover:bg-sea-50">O‘chirish</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {slice.length === 0 && (
                    <tr><td colSpan={9} className="py-8 text-center text-muted">Bemor topilmadi.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[12px]">
              <span className="text-muted">Jami: {filtered.length} bemor</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((n) => Math.max(1, n - 1))} className="grid size-7 place-items-center rounded-md border border-line" aria-label="Oldingi"><ChevronLeft className="size-3.5" /></button>
                {pageButtons(safePage, pages).map((n, i) => n === '…' ? (
                  <span key={`e${i}`} className="px-1 text-muted">…</span>
                ) : (
                  <button key={n} onClick={() => setPage(n)} className={`grid size-7 place-items-center rounded-md ${n === safePage ? 'bg-sea text-white' : 'border border-line'}`}>{n}</button>
                ))}
                <button onClick={() => setPage((n) => Math.min(pages, n + 1))} className="grid size-7 place-items-center rounded-md border border-line" aria-label="Keyingi"><ChevronRight className="size-3.5" /></button>
              </div>
              <label className="flex items-center gap-1 text-muted">
                Sahifada:
                <select value={per} onChange={(e) => { setPer(Number(e.target.value)); setPage(1) }} className="h-7 rounded-md border border-line bg-white px-1 text-ink">
                  {[10, 25, 50].map((n) => <option key={n}>{n}</option>)}
                </select>
              </label>
            </div>
          </section>

          {current && <Side patient={current} onVisit={(date) => patchBemor(current.id, { next: date, visits: [{ date, kind: 'Qabul', note: 'Yangi qabul', doctor: '' }, ...(current.visits || [])] })} />}
        </div>
      </div>
      {open && <AddModal onClose={() => setOpen(false)} />}
    </ShopLayout>
  )
}

function pageButtons(page, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1)
  const out = [1, 2, 3, 4, 5, '…', pages]
  if (page > 5 && page < pages) return [1, '…', page - 1, page, page + 1, '…', pages]
  return out
}

function Face({ src, name }) {
  const [ok, setOk] = useState(true)
  const letters = name.split(' ').slice(0, 2).map((w) => w[0]).join('')
  if (!src || !ok) return <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sea-50 text-[10px] font-bold text-sea">{letters}</span>
  return <img src={src} alt="" onError={() => setOk(false)} className="size-8 shrink-0 rounded-full object-cover" />
}

function Side({ patient, onVisit }) {
  const [tab, setTab] = useState('umumiy')
  const [when, setWhen] = useState(false)
  const [date, setDate] = useState('')
  return (
    <aside className="rounded-2xl bg-white p-3 shadow-card">
      <div className="flex items-start gap-2">
        <Face src={patient.photo} name={patient.name} />
        <div className="min-w-0 flex-1">
          <Link to={`/bemorlar/${patient.id}`} className="block truncate text-[13.5px] font-bold text-ink">{patient.name}</Link>
          <p className="text-[11px] text-muted">#{patient.code}</p>
          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${statusClass[patient.status]}`}>{patient.status}</span>
        </div>
      </div>
      <ul className="mt-3 space-y-1.5 text-[12px] text-ink-2">
        <li>{patient.age}{patient.birth ? ` (${patient.birth})` : ''} <span className="float-right">{patient.gender}</span></li>
        <li className="flex items-center gap-1.5"><Phone className="size-3.5 text-sea" /> {patient.phone}</li>
        <li className="flex items-center gap-1.5"><MapPin className="size-3.5 text-sea" /> {patient.city}</li>
        {patient.email && <li className="flex items-center gap-1.5 truncate"><Mail className="size-3.5 shrink-0 text-sea" /> {patient.email}</li>}
      </ul>
      <button onClick={() => setWhen((v) => !v)} className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-sea text-[12.5px] font-semibold text-white">
        <Plus className="size-4" /> Qabul qo‘shish
      </button>
      {when && (
        <form className="mt-2 flex gap-1" onSubmit={(e) => { e.preventDefault(); if (date) { onVisit(date.split('-').reverse().join('.')); setWhen(false) } }}>
          <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-8 flex-1 rounded-lg border border-line px-2 text-[12px]" />
          <button className="h-8 rounded-lg bg-sea px-2 text-[12px] font-semibold text-white">Saqlash</button>
        </form>
      )}
      <div className="mt-3 flex gap-3 border-b border-line text-[12px] font-semibold">
        {[['umumiy', 'Umumiy'], ['davolash', 'Davolash'], ['tolov', 'To‘lovlar'], ['hujjat', 'Hujjatlar']].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`-mb-px border-b-2 pb-1.5 ${tab === k ? 'border-sea text-sea' : 'border-transparent text-muted'}`}>{label}</button>
        ))}
      </div>
      {tab === 'umumiy' && (
        <>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-[12.5px] font-bold">Tish kartasi</p>
            <span className="rounded-full bg-sea px-2 py-0.5 text-[10px] font-semibold text-white">Doimiy</span>
          </div>
          <div className="mt-2 grid grid-cols-8 gap-0.5">
            {(patient.mini || []).slice(0, 16).map((s, i) => (
              <span key={i} className={`mx-auto h-5 w-3.5 rounded-b-md rounded-t-sm border ${s === 'care' ? 'border-[#e07a7a] bg-[#f7d0d0]' : s === 'done' ? 'border-[#7eb6e6] bg-[#d7ebfa]' : s === 'bad' ? 'border-[#9aa3ad] bg-[#d5dbe2]' : 'border-[#d5dde6] bg-white'}`} />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-muted">
            <span>Sog‘lom</span><span>Davolanmoqda</span><span>Davolangan</span><span>Muammo</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-[12.5px] font-bold">So‘nggi tashriflar</p>
            <Link to={`/bemorlar/${patient.id}`} className="text-[11px] font-semibold text-sea">Barchasi</Link>
          </div>
          <ul className="mt-2 space-y-2">
            {(patient.visits || []).slice(0, 3).map((v, i) => (
              <li key={i} className="text-[11.5px]">
                <span className="text-muted">{v.date}</span>
                <span className="ml-2 font-semibold text-ink">{v.kind}</span>
                {v.note && <span className="block text-muted">{v.note}</span>}
                <span className="block text-right text-muted">{v.doctor}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {tab === 'davolash' && <p className="mt-3 text-[12px] text-ink-2">{(patient.visits || []).map((v) => v.kind).join(', ') || 'Davolash yozuvi yo‘q.'}</p>}
      {tab === 'tolov' && <p className="mt-3 text-[12px] text-ink-2">Qarz: {(patient.debt || 0).toLocaleString('ru-RU')} so‘m</p>}
      {tab === 'hujjat' && <p className="mt-3 text-[12px] text-ink-2">{(patient.docs || []).map((d) => d.name).join(', ') || 'Hujjat yo‘q. Profilga o‘tib yuklang.'}</p>}
    </aside>
  )
}

const empty = { first: '', last: '', phone: '', birth: '', gender: 'Erkak', city: 'Toshkent', address: '', email: '', source: '', flags: [], other: '', note: '', photo: '' }

function AddModal({ onClose }) {
  const [f, setF] = useState(empty)
  const [err, setErr] = useState(false)
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }))
  const toggle = (name) => setF((s) => ({ ...s, flags: s.flags.includes(name) ? s.flags.filter((x) => x !== name) : [...s.flags, name] }))

  const save = () => {
    if (!f.first.trim() || !f.last.trim() || !f.phone.trim() || !f.birth || !f.city) {
      setErr(true)
      return
    }
    const id = `new-${Date.now()}`
    addBemor({
      id,
      name: `${f.last.trim()} ${f.first.trim()}`,
      phone: f.phone.trim().startsWith('+') ? f.phone.trim() : `+998 ${f.phone.trim()}`,
      birth: f.birth.split('-').reverse().join('.'),
      age: '',
      gender: f.gender,
      city: f.city,
      address: f.address,
      email: f.email,
      source: f.source,
      status: 'Yangi',
      last: '',
      next: '',
      code: `P-${String(Date.now()).slice(-4)}`,
      photo: f.photo,
      allergy: f.flags.filter((x) => x === 'Allergiya'),
      diseases: f.flags.filter((x) => x !== 'Allergiya'),
      note: [f.other, f.note].filter(Boolean).join('. '),
      total: 0,
      paid: 0,
    })
    onClose()
  }

  const bad = (k) => err && !String(f[k] || '').trim()

  return (
    <div className="bemor-shade" onClick={onClose}>
      <div className="bemor-dialog shadow-card" onClick={(e) => e.stopPropagation()}>
        <div className="bemor-dialog-head flex items-start justify-between px-4 pt-3">
          <div>
            <h2 className="text-[16px] font-bold leading-tight text-ink">Yangi bemor qo‘shish</h2>
            <p className="text-[12px] text-muted">Bemorning asosiy ma’lumotlarini kiriting</p>
          </div>
          <button onClick={onClose} aria-label="Yopish" className="grid size-8 place-items-center rounded-lg text-muted"><X className="size-4" /></button>
        </div>
        <div className="bemor-dialog-body px-4">
        <div className="mt-2 flex gap-3">
          <label className="grid size-16 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full border border-dashed border-line text-center text-[10px] text-muted">
            {f.photo ? <img src={f.photo} alt="" className="size-full object-cover" /> : <span>Rasm<br />yuklash</span>}
            <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onload = () => set('photo', reader.result)
              reader.readAsDataURL(file)
            }} />
          </label>
          <div className="grid flex-1 grid-cols-2 gap-3">
            <Field label="Ism" required bad={bad('first')}><input value={f.first} onChange={(e) => set('first', e.target.value)} placeholder="Ism kiriting" className={inputCls(bad('first'))} /></Field>
            <Field label="Familiya" required bad={bad('last')}><input value={f.last} onChange={(e) => set('last', e.target.value)} placeholder="Familiya kiriting" className={inputCls(bad('last'))} /></Field>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Telefon raqami" required bad={bad('phone')}>
            <div className={`flex h-9 items-center rounded-lg border px-2 ${bad('phone') ? 'border-sale' : 'border-line'}`}>
              <span className="mr-1 text-[12px]">🇺🇿 +998</span>
              <input value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="90 123 45 67" className="w-full bg-transparent text-[12.5px] outline-none" />
            </div>
          </Field>
          <Field label="Tug‘ilgan sana" required bad={bad('birth')}>
            <label className={`flex h-9 items-center rounded-lg border px-2 ${bad('birth') ? 'border-sale' : 'border-line'}`}>
              <input type="date" value={f.birth} onChange={(e) => set('birth', e.target.value)} className="w-full bg-transparent text-[12.5px] outline-none" />
            </label>
          </Field>
          <Field label="Jinsi" required>
            <div className="flex h-9 gap-1">
              {['Erkak', 'Ayol'].map((g) => (
                <button key={g} type="button" onClick={() => set('gender', g)} className={`flex-1 rounded-lg text-[12.5px] font-semibold ${f.gender === g ? 'bg-sea text-white' : 'border border-line text-ink-2'}`}>{g}</button>
              ))}
            </div>
          </Field>
          <Field label="Shahar" required>
            <select value={f.city} onChange={(e) => set('city', e.target.value)} className={inputCls(false)}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select>
          </Field>
        </div>
        <Field label="Manzil">
          <div className="flex h-9 items-center gap-2 rounded-lg border border-line px-2">
            <MapPin className="size-3.5 text-muted" />
            <input value={f.address} onChange={(e) => set('address', e.target.value)} placeholder="To‘liq manzil kiriting" className="w-full bg-transparent text-[12.5px] outline-none" />
          </div>
        </Field>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Email"><div className="flex h-9 items-center gap-2 rounded-lg border border-line px-2"><Mail className="size-3.5 text-muted" /><input value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="email@example.com" className="w-full bg-transparent text-[12.5px] outline-none" /></div></Field>
          <Field label="Qayerdan bildi?"><select value={f.source} onChange={(e) => set('source', e.target.value)} className={inputCls(false)}><option value="">Tanlang</option>{SOURCES.map((s) => <option key={s}>{s}</option>)}</select></Field>
        </div>
        <p className="mb-1 mt-3 text-[12px] font-semibold text-ink-2">Allergiya / kasalliklar</p>
        <div className="flex flex-wrap gap-3 text-[12.5px]">
          {['Diabet', 'Gipertoniya', 'Allergiya', 'Homiladorlik'].map((name) => (
            <label key={name} className="flex items-center gap-1.5"><input type="checkbox" checked={f.flags.includes(name)} onChange={() => toggle(name)} /> {name}</label>
          ))}
        </div>
        <Field label="Boshqa kasalliklar (ixtiyoriy)"><input value={f.other} onChange={(e) => set('other', e.target.value)} className={inputCls(false)} /></Field>
        <Field label="Izoh">
          <textarea value={f.note} maxLength={500} onChange={(e) => set('note', e.target.value)} placeholder="Qo‘shimcha ma’lumot (ixtiyoriy)" className="h-14 w-full resize-none rounded-lg border border-line px-2 py-1.5 text-[12.5px] outline-none" />
          <span className="mt-0.5 block text-right text-[10px] text-muted">{f.note.length}/500</span>
        </Field>
        {err && <p className="mt-2 text-[12px] text-sale">Ism, familiya, telefon va tug‘ilgan sana majburiy.</p>}
        </div>
        <div className="bemor-dialog-foot flex items-center justify-between border-t border-line px-4 py-3">
          <button onClick={onClose} className="h-9 rounded-lg border border-line px-5 text-[13px] font-semibold">Bekor qilish</button>
          <button onClick={save} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-sea px-5 text-[13px] font-semibold text-white"><Plus className="size-4" /> Saqlash</button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <label className="mt-1.5 block text-[12px] font-medium text-ink-2">
      {label} {required && <span className="text-sale">*</span>}
      <div className="mt-1">{children}</div>
    </label>
  )
}

const inputCls = (bad) => `h-9 w-full rounded-lg border px-2 text-[12.5px] outline-none ${bad ? 'border-sale' : 'border-line'}`
