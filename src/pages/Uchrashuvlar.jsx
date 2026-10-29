import { useMemo, useState } from 'react'
import { Bell, Calendar, Check, ChevronLeft, ChevronRight, Clock, Plus, Search, Users, X } from 'lucide-react'
import ShopLayout from '../components/market/ShopLayout'
import AppointmentForm from '../components/crm/AppointmentForm'
import { chairNames, useClinicSettings } from '../clinicSettings'
import { tashkentToday } from '../tashkentDate'
import {
  MONTHS, WDS, alignWeek, clockRange, doctors, isoOf, labelRange, longDate, minutes, parts, setVisits, useVisits, shift, tones, weekDays, weekdayIndex,
} from '../uchrashuvData'

const HOUR = 44
const START = 8 * 60
const SLOTS = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30']

export default function Uchrashuvlar() {
  const clinic = useClinicSettings()
  const rows = useVisits()
  const setRows = setVisits
  const [anchor, setAnchor] = useState(() => alignWeek(tashkentToday()))
  const [focus, setFocus] = useState(tashkentToday)
  const [mode, setMode] = useState('hafta')
  const [doc, setDoc] = useState('all')
  const [room, setRoom] = useState('all')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(null)
  const [sideAll, setSideAll] = useState(false)
  const [menu, setMenu] = useState(null)

  const days = weekDays(anchor)
  const list = useMemo(() => rows.filter((r) => {
    const blob = `${r.name} ${r.service} ${r.room}`.toLowerCase()
    return (doc === 'all' || r.doctor === doc) && (room === 'all' || r.room === room) && (!q || blob.includes(q.trim().toLowerCase()))
  }), [rows, doc, room, q])

  const dayRows = list.filter((r) => r.date === focus).sort((a, b) => minutes(a.start) - minutes(b.start))
  const sideRows = (sideAll ? list.filter((r) => days.some((d) => d.iso === r.date)) : dayRows)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date) || minutes(a.start) - minutes(b.start))

  const filtered = doc !== 'all' || room !== 'all' || q
  const stats = {
        n: dayRows.length,
        neu: dayRows.filter((r) => r.isNew).length,
        done: dayRows.filter((r) => r.status === 'yakun').length,
        cancel: dayRows.filter((r) => r.status === 'bekor').length,
        avg: dayRows.length ? Math.round(dayRows.reduce((s, r) => s + r.dur, 0) / dayRows.length) : 0,
        load: Math.min(100, Math.round(dayRows.reduce((s, r) => s + r.dur, 0) / 4.2)),
      }

  const jump = (iso) => {
    setAnchor(alignWeek(iso))
    setFocus(iso)
  }

  const openNew = (date, start) => {
    if (date) setFocus(date)
    setDraft({ date: date || focus, start: start || '10:30' })
    setOpen(true)
  }

  const save = (visit) => {
    setFocus(visit.date)
    if (!weekDays(anchor).some((day) => day.iso === visit.date)) setAnchor(alignWeek(visit.date))
    setOpen(false)
  }

  return (
    <ShopLayout active="uchrashuv" placeholder="Bemor, telefon, ID yoki xizmat bo‘yicha qidiring..." onQuery={setQ}>
      <div className="pb-4 pt-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-bold leading-none text-ink">Uchrashuvlar</h1>
            <p className="mt-1 text-[13px] text-muted">Klinika jadvali va bemor qabuli</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => jump('2026-10-24')} className="h-9 rounded-lg border border-line bg-white px-3 text-[12.5px] font-semibold">Bugun</button>
            <button onClick={() => openNew(focus, '10:30')} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-sea px-3 text-[12.5px] font-semibold text-white"><Plus className="size-4" /> Yangi uchrashuv</button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button onClick={() => setAnchor(shift(anchor, -7))} className="grid size-8 place-items-center rounded-lg border border-line bg-white" aria-label="Oldingi hafta"><ChevronLeft className="size-4" /></button>
          <button onClick={() => setAnchor(shift(anchor, 7))} className="grid size-8 place-items-center rounded-lg border border-line bg-white" aria-label="Keyingi hafta"><ChevronRight className="size-4" /></button>
          <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 text-[12.5px] font-semibold"><Calendar className="size-3.5 text-sea" /> {labelRange(anchor)}</span>
          <div className="flex rounded-lg bg-white p-0.5 text-[12.5px] font-semibold shadow-card">
            {[['kun', 'Kun'], ['hafta', 'Hafta'], ['oy', 'Oy']].map(([k, label]) => (
              <button key={k} onClick={() => setMode(k)} className={`h-7 rounded-md px-3 ${mode === k ? 'bg-sea text-white' : 'text-ink-2'}`}>{label}</button>
            ))}
          </div>
          <select value={doc} onChange={(e) => setDoc(e.target.value)} className="h-8 rounded-lg border border-line bg-white px-2 text-[12.5px]">
            <option value="all">Barcha shifokorlar</option>
            {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select value={room} onChange={(e) => setRoom(e.target.value)} className="h-8 rounded-lg border border-line bg-white px-2 text-[12.5px]">
            <option value="all">Barcha xonalar</option>
            {[...new Set([...chairNames(clinic), ...rows.map((r) => r.room).filter(Boolean)])].map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Chip on={doc === 'all'} onClick={() => setDoc('all')}>Barchasi</Chip>
          {doctors.map((d) => (
            <Chip key={d.id} on={doc === d.id} onClick={() => setDoc(d.id)}>
              <b className="grid size-5 place-items-center rounded-full bg-sea-50 text-[9px] text-sea">{d.name.split(' ')[1][0]}</b>
              <span className="text-left leading-tight"><span className="block">{d.name}</span><span className="block text-[9px] font-normal text-muted">{d.role}</span></span>
            </Chip>
          ))}
          <span className="ml-auto hidden flex-wrap items-center gap-2 text-[10.5px] text-muted xl:flex">
            {Object.values(tones).map((t) => <span key={t.label} className="inline-flex items-center gap-1"><i className="size-2 rounded-full" style={{ background: t.dot }} />{t.label}</span>)}
          </span>
        </div>

        <div className="uch-layout mt-3">
          <section className="min-w-0 rounded-2xl bg-white p-2 shadow-card">
            {mode === 'oy' ? (
              <Month anchor={anchor} rows={list} focus={focus} onPick={(iso) => { setFocus(iso); setMode('kun') }} />
            ) : (
              <Week days={mode === 'kun' ? days.filter((d) => d.iso === focus) : days} rows={list} focus={focus} onFocus={setFocus} onSlot={openNew} />
            )}
          </section>

          <aside className="rounded-2xl bg-white p-3 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-[14px] font-bold">Bugungi uchrashuvlar</h2>
                <p className="text-[11px] text-muted">{longDate(focus)}</p>
              </div>
              <button onClick={() => setSideAll((v) => !v)} className="shrink-0 text-[12px] font-semibold text-sea">{sideAll ? 'Shu kun' : 'Barchasi'}</button>
            </div>
            <ul className="mt-2 space-y-2">
              {sideRows.map((r) => (
                <li key={r.id} className="flex items-start gap-2 text-[12px]">
                  <span className="w-10 shrink-0 pt-1 text-[10.5px] leading-tight text-muted">{r.start}<br />{clockRange(r.start, r.dur).slice(-5)}</span>
                  <Face src={r.photo} name={r.name} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{r.name}</span>
                    <span className="block text-[11px] text-muted">{r.service}</span>
                    <span className="block text-[11px] text-muted">{r.room}</span>
                  </span>
                  <span className="relative">
                    <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: tones[r.status].bg, color: '#245' }}>{tones[r.status].label}</span>
                    <button aria-label="Holat" onClick={() => setMenu(menu === r.id ? null : r.id)} className="ml-1 text-muted">···</button>
                    {menu === r.id && (
                      <div className="absolute right-0 z-10 mt-1 w-36 rounded-lg bg-white py-1 shadow-card">
                        {Object.entries(tones).map(([k, t]) => (
                          <button key={k} onClick={() => { setRows((list) => list.map((it) => it.id === r.id ? { ...it, status: k } : it)); setMenu(null) }} className="block w-full px-2 py-1 text-left text-[11.5px] hover:bg-sea-50">{t.label}</button>
                        ))}
                      </div>
                    )}
                  </span>
                </li>
              ))}
              {sideRows.length === 0 && <li className="py-4 text-center text-[12px] text-muted">Uchrashuv yo‘q.</li>}
            </ul>

            <h3 className="mb-2 mt-4 text-[13px] font-bold">Statistika (bugun)</h3>
            <div className="grid grid-cols-4 gap-1 text-center">
              <Stat icon={Calendar} n={stats.n} label="Uchrashuv" />
              <Stat icon={Users} n={stats.neu} label="Yangi bemor" />
              <Stat icon={Check} n={stats.done} label="Yakunlangan" />
              <Stat icon={X} n={stats.cancel} label="Bekor qilingan" />
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 text-[12px]">
              <span className="inline-flex items-center gap-1 text-muted"><Clock className="size-3.5 text-sea" /> O‘rtacha qabul vaqti</span>
              <b>{stats.avg} daqiqa</b>
            </div>
            <div className="mt-2 flex items-center justify-between text-[12px]">
              <span className="text-muted">Klinika bandligi</span>
              <b className="text-sea">{stats.load}%</b>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sea-50"><div className="h-full rounded-full bg-sea" style={{ width: `${stats.load}%` }} /></div>
          </aside>
        </div>
      </div>
      {open && <AppointmentForm initial={draft || {}} onClose={() => setOpen(false)} onSaved={save} />}
    </ShopLayout>
  )
}

function Week({ days, rows, focus, onFocus, onSlot }) {
  const hours = Array.from({ length: 11 }, (_, i) => 8 + i)
  return (
    <div className="min-w-0">
      <div className="grid" style={{ gridTemplateColumns: `48px repeat(${days.length}, minmax(0, 1fr))` }}>
        <div />
        {days.map((d) => (
          <button key={d.iso} onClick={() => onFocus(d.iso)} className="pb-1 text-center">
            <span className="block text-[11px] text-muted">{d.wd}</span>
            <span className={`mx-auto mt-0.5 grid size-7 place-items-center rounded-full text-[12px] font-bold ${d.iso === focus ? 'bg-sea text-white' : 'text-ink'}`}>{d.d}</span>
          </button>
        ))}
      </div>
      <div className="uch-scroll">
        <div className="grid min-w-[720px]" style={{ gridTemplateColumns: `48px repeat(${days.length}, minmax(0, 1fr))` }}>
          <div>
            {hours.map((h) => <div key={h} className="pr-1 text-right text-[10px] text-muted" style={{ height: HOUR }}>{String(h).padStart(2, '0')}:00</div>)}
          </div>
          {days.map((d) => (
            <div
              key={d.iso}
              className="relative border-l border-line"
              style={{ height: hours.length * HOUR, backgroundImage: `repeating-linear-gradient(#eef2f6 0 1px, transparent 1px ${HOUR}px)` }}
            >
              {Array.from({ length: 20 }, (_, i) => {
                const mins = START + i * 30
                const label = `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
                return (
                  <button
                    key={label}
                    type="button"
                    aria-label={`${d.d} okt ${label}`}
                    onClick={() => onSlot(d.iso, label)}
                    className="absolute left-0 right-0 z-0 hover:bg-sea-50"
                    style={{ top: i * (HOUR / 2), height: HOUR / 2 }}
                  />
                )
              })}
              {rows.filter((r) => r.date === d.iso).map((r) => {
                const top = ((minutes(r.start) - START) / 60) * HOUR
                const height = Math.max(26, (r.dur / 60) * HOUR - 3)
                const tone = tones[r.status]
                return (
                  <button
                    key={r.id}
                    type="button"
                    className="absolute left-0.5 right-0.5 z-10 overflow-hidden rounded-md border px-1 py-0.5 text-left text-[10px] leading-tight"
                    style={{ top, height, background: tone.bg, borderColor: tone.bd }}
                  >
                    <b className="block">{clockRange(r.start, r.dur)}</b>
                    <span className="block truncate font-semibold">{r.name}</span>
                    <span className="block truncate text-muted">{r.service}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Month({ anchor, rows, focus, onPick }) {
  const { y, m } = parts(anchor)
  const lead = weekdayIndex(isoOf(y, m, 1))
  const count = new Date(y, m, 0).getDate()
  const cells = [...Array(lead).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)]
  return (
    <div>
      <p className="mb-2 text-center text-[13px] font-bold capitalize">{MONTHS[m - 1]} {y}</p>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted">{WDS.map((w) => <span key={w}>{w}</span>)}</div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          const iso = d ? isoOf(y, m, d) : ''
          const n = d ? rows.filter((r) => r.date === iso).length : 0
          return (
            <button key={i} disabled={!d} onClick={() => onPick(iso)} className={`h-12 rounded-lg text-[12px] ${iso === focus ? 'bg-sea text-white' : 'bg-[#f7fafd]'}`}>
              {d || ''}
              {n > 0 && <span className="mt-0.5 block text-[10px]">{n} ta</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Chip({ on, onClick, children }) {
  return <button onClick={onClick} className={`inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[11.5px] font-semibold ${on ? 'bg-sea text-white' : 'bg-white text-ink shadow-card'}`}>{children}</button>
}

function Face({ src, name }) {
  const [ok, setOk] = useState(Boolean(src))
  const letters = name.split(' ').slice(0, 2).map((w) => w[0]).join('')
  if (!src || !ok) return <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sea-50 text-[10px] font-bold text-sea">{letters}</span>
  return <img src={src} alt="" onError={() => setOk(false)} className="size-8 shrink-0 rounded-full object-cover" />
}

function Stat({ icon: Icon, n, label }) {
  return (
    <div className="rounded-lg bg-[#f7fafd] px-1 py-1.5">
      <Icon className="mx-auto size-3.5 text-sea" />
      <b className="block text-[13px]">{n}</b>
      <span className="block text-[9px] leading-tight text-muted">{label}</span>
    </div>
  )
}
