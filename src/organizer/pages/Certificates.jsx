import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, CircleCheck, Clock, Download, Ellipsis,
  Filter, House, Mail, MapPin, MessageSquare, MoreVertical, Pencil, QrCode, Search, Send, Shield, Users, Wallet,
} from 'lucide-react'
import { CERTS } from '../data'
import { useOrg } from '../Shell'
import { Modal, QrMark } from '../ui'
import { CertFrame, MiniCert } from './certArt'

const TICKETS = ['Standart', 'VIP', 'Student', 'Guruh']
const TONE = {
  done: 'bg-[#e7f8ee] text-[#16a34a]',
  progress: 'bg-[#fff4e0] text-[#e0940b]',
  none: 'bg-[#fde8ee] text-[#e11d48]',
}
const STATE_LABEL = { done: 'Berilgan', progress: 'Jarayonda', none: 'Berilmagan' }
const COURSE = 'Implantologiya: nazariya va amaliyot'
const CERT_DATE = '24-noyabr 2026'

const MOBILE_FIRST = [
  { name: 'Aliyeva Mohira', phone: '+998 90 123 45 67', state: 'done', date: '21.10.2026' },
  { name: 'Karimov Bekzod', phone: '+998 91 234 56 78', state: 'done', date: '21.10.2026' },
  { name: 'Toirov Dilshod', phone: '+998 93 345 67 89', state: 'done', date: '21.10.2026' },
  { name: 'Saidova Malika', phone: '+998 90 456 78 90', state: 'wait', date: '' },
  { name: 'Usmonov Javohir', phone: '+998 91 567 89 01', state: 'done', date: '21.10.2026' },
  { name: 'Raximova Sevara', phone: '+998 93 678 90 12', state: 'wait', date: '' },
  { name: 'Jalilov Akmal', phone: '+998 90 789 01 23', state: 'done', date: '21.10.2026' },
  { name: 'Eshmatova Dildora', phone: '+998 91 890 12 34', state: 'wait', date: '' },
]

const EXTRA = [
  ['Nazarova', 'Nilufar'], ['Ergashev', 'Otabek'], ['Qodirova', 'Madina'], ['Soliyev', 'Jasur'],
  ['Abdullayeva', 'Kamola'], ['Hamidov', 'Bobur'], ['Karimova', 'Aziza'], ['Yuldasheva', 'Shahzod'],
  ['Toirova', 'Dilshod'], ['Usmonova', 'Sevara'], ['Rahimova', 'Bekzod'], ['Aliyev', 'Javohir'],
  ['Karimova', 'Malika'], ['Saidov', 'Azizbek'], ['Mirzayeva', 'Mohira'], ['Nodirova', 'Sevinch'],
  ['Tursunov', 'Jamshid'], ['Yusupov', 'Sardor'], ['Ismoilov', 'Behzod'], ['Raximova', 'Dilnoza'],
  ['Eshmatov', 'Akmal'], ['Jalilova', 'Dildora'], ['Qodirov', 'Nilufar'], ['Nazarov', 'Madina'],
  ['Hamidova', 'Otabek'], ['Soliyeva', 'Kamola'], ['Ergasheva', 'Bobur'], ['Abdullayev', 'Aziza'],
  ['Yuldashev', 'Shahzod'], ['Toirov', 'Sevara'], ['Usmonov', 'Malika'], ['Rahimov', 'Jasur'],
  ['Aliyeva', 'Bekzod'], ['Karimov', 'Dildora'],
]

function buildMobile() {
  const rows = MOBILE_FIRST.map((r, i) => ({ ...r, id: i + 1 }))
  EXTRA.forEach(([fam, given], i) => {
    const n = rows.length
    const doneSlots = 23
    const state = i < doneSlots ? 'done' : 'wait'
    rows.push({
      id: n + 1,
      name: `${fam} ${given}`,
      phone: `+998 9${(i + 2) % 10} ${String(120 + i).padStart(3, '0')} ${String(20 + (i % 70)).padStart(2, '0')} ${String(12 + (i % 80)).padStart(2, '0')}`,
      state,
      date: state === 'done' ? '21.10.2026' : '',
    })
  })
  return rows
}

function decorate(list) {
  return list.map((c, i) => ({
    ...c,
    clinic: c.name === 'Yusupova Sevinch' ? 'Stomatolog+' : c.clinic,
    ticket: TICKETS[i % TICKETS.length],
    phone: `+998 9${i % 10} ${String(100 + ((i * 17) % 900)).padStart(3, '0')} ${String(10 + ((i * 3) % 90)).padStart(2, '0')} ${String(10 + ((i * 5) % 90)).padStart(2, '0')}`,
  }))
}

function pageWindow(page, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1)
  if (page <= 4) return [1, 2, 3, 4, 5, '…', pages]
  if (page >= pages - 3) return [1, '…', pages - 4, pages - 3, pages - 2, pages - 1, pages]
  return [1, '…', page - 1, page, page + 1, '…', pages]
}

function initials(name) {
  const [a = '', b = ''] = name.split(' ')
  return `${a[0] || ''}${b[0] || ''}`.toUpperCase()
}

export default function Certificates() {
  const { query, notify } = useOrg()
  const [rows, setRows] = useState(() => decorate(CERTS))
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const [state, setState] = useState('all')
  const [ticket, setTicket] = useState('all')
  const [page, setPage] = useState(1)
  const [per, setPer] = useState(10)
  const [selected, setSelected] = useState(CERTS[0].id)
  const [checked, setChecked] = useState(() => new Set())
  const [preview, setPreview] = useState(true)
  const [tpl, setTpl] = useState(false)
  const [qr, setQr] = useState(null)
  const [note, setNote] = useState(false)

  const [mobile, setMobile] = useState(buildMobile)
  const [mTab, setMTab] = useState('all')
  const [mSeek, setMSeek] = useState(false)
  const [mq, setMq] = useState('')

  useEffect(() => { setPage(1) }, [q, tab, state, ticket, query, per])

  const filtered = useMemo(() => {
    const s = `${query} ${q}`.trim().toLowerCase()
    return rows.filter((c) => {
      if (tab !== 'all' && c.state !== tab) return false
      if (state !== 'all' && c.state !== state) return false
      if (ticket !== 'all' && c.ticket !== ticket) return false
      if (s && !`${c.name} ${c.phone} ${c.code} ${c.clinic}`.toLowerCase().includes(s)) return false
      return true
    })
  }, [rows, query, q, tab, state, ticket])

  const step = per === 10 ? 10 : per
  const take = per === 10 ? 8 : per
  const pages = Math.max(1, Math.ceil(filtered.length / step) || 1)
  const safe = Math.min(page, pages)
  const start = (safe - 1) * step
  const slice = filtered.slice(start, start + take)
  const from = filtered.length ? start + 1 : 0
  const to = Math.min(start + slice.length, filtered.length)
  const counts = useMemo(() => ({
    all: rows.length,
    done: rows.filter((r) => r.state === 'done').length,
    progress: rows.filter((r) => r.state === 'progress').length,
    none: rows.filter((r) => r.state === 'none').length,
  }), [rows])

  const cert = rows.find((c) => c.id === selected) || slice[0] || rows[0]

  const issue = (c) => {
    const code = `STH-2026-${String(c.id).padStart(4, '0')}`
    setRows((list) => list.map((x) => (x.id === c.id ? { ...x, state: 'done', code, date: '24-noy 2026' } : x)))
    setSelected(c.id)
    notify('Sertifikat berildi')
  }

  const toggle = (id) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const allOn = slice.length > 0 && slice.every((c) => checked.has(c.id))
  const toggleAll = () => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (allOn) slice.forEach((c) => next.delete(c.id))
      else slice.forEach((c) => next.add(c.id))
      return next
    })
  }

  const mCounts = useMemo(() => ({
    all: mobile.length,
    done: mobile.filter((r) => r.state === 'done').length,
    wait: mobile.filter((r) => r.state === 'wait').length,
  }), [mobile])
  const mRows = mobile.filter((r) => {
    if (mTab === 'done' && r.state !== 'done') return false
    if (mTab === 'wait' && r.state !== 'wait') return false
    const s = mq.trim().toLowerCase()
    if (s && !`${r.name} ${r.phone}`.toLowerCase().includes(s)) return false
    return true
  })

  const sendMobile = (id) => {
    setMobile((list) => list.map((r) => (r.id === id ? { ...r, state: 'done', date: '21.10.2026' } : r)))
    notify('Sertifikat yuborildi')
  }

  return (
    <>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&display=swap" />
      <style>{`
        @media (max-width: 1023.98px) {
          main:has(.cert-mobile) { padding: 0 !important; background: #fff; }
          main:has(.cert-mobile) > .mb-3 { display: none !important; }
          div:has(main .cert-mobile) > header { display: none !important; }
        }
      `}</style>

      <div className="hidden lg:block">
        <Desktop
          counts={counts}
          tab={tab}
          setTab={setTab}
          q={q}
          setQ={setQ}
          state={state}
          setState={setState}
          ticket={ticket}
          setTicket={setTicket}
          slice={slice}
          from={from}
          to={to}
          total={filtered.length}
          page={safe}
          pages={pages}
          per={per}
          setPer={setPer}
          setPage={setPage}
          selected={cert?.id}
          setSelected={setSelected}
          checked={checked}
          toggle={toggle}
          allOn={allOn}
          toggleAll={toggleAll}
          cert={cert}
          preview={preview}
          setPreview={setPreview}
          onTpl={() => setTpl(true)}
          onNote={() => setNote(true)}
          onDownload={() => notify('Sertifikat yuklab olindi')}
          onMail={() => notify('Email yuborildi')}
          onQr={() => setQr(cert)}
          onResend={() => notify('Sertifikat qayta yuborildi')}
          onIssue={issue}
          onReset={() => { setQ(''); setState('all'); setTicket('all'); setTab('all') }}
        />
      </div>

      <div className="cert-mobile lg:hidden">
        <Mobile
          rows={mRows}
          counts={mCounts}
          tab={mTab}
          setTab={setMTab}
          seek={mSeek}
          setSeek={setMSeek}
          q={mq}
          setQ={setMq}
          onSendAll={() => {
            setMobile((list) => list.map((r) => (r.state === 'wait' ? { ...r, state: 'done', date: '21.10.2026' } : r)))
            notify('Sertifikatlar yuborildi')
          }}
          onSend={sendMobile}
          onQr={(row) => setQr({ name: row.name, code: `STH-2026-${String(row.id).padStart(4, '0')}` })}
          onTpl={() => setTpl(true)}
          onOpen={(row) => {
            setSelected(row.id)
            setQr(row.state === 'done' ? { name: row.name, code: `STH-2026-${String(row.id).padStart(4, '0')}` } : null)
            if (row.state !== 'done') notify(row.name)
          }}
        />
      </div>

      <Modal open={tpl} title="Sertifikat shablonini sozlash" sub="Barcha ishtirokchilarga shu shablon asosida sertifikat beriladi." onClose={() => setTpl(false)} width={520}>
        <div className="flex justify-center rounded-2xl bg-[#e7f6f3] p-4">
          <CertFrame width={220} name="Aliyeva Mohira" course={COURSE} date={CERT_DATE} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-[12.5px]">
          <div className="rounded-xl border border-[#e6f1ef] px-3 py-2">
            <p className="text-[#8aa0a4]">Kredit soati</p>
            <p className="text-[18px] font-bold">16</p>
          </div>
          <div className="rounded-xl border border-[#e6f1ef] px-3 py-2">
            <p className="text-[#8aa0a4]">QR tekshirish</p>
            <p className="font-semibold text-[#0c8f86]">Yoqilgan</p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={() => { setTpl(false); notify('Shablon saqlandi') }} className="h-10 rounded-xl bg-[#0e8078] px-4 text-[13px] font-semibold text-white">Saqlash</button>
        </div>
      </Modal>

      <Modal open={!!qr} title="Sertifikat QR kodi" onClose={() => setQr(null)}>
        <div className="grid place-items-center">
          <QrMark size={160} seed={qr?.id || 3} />
          <p className="mt-2 text-[13px] font-semibold">{qr?.name}</p>
          <p className="text-[12.5px] text-[#6e868c]">{qr?.code || 'Hali berilmagan'}</p>
        </div>
      </Modal>

      <Modal open={note} title="Izoh" onClose={() => setNote(false)} width={420}>
        <textarea className="h-24 w-full resize-none rounded-xl border border-[#e3eeec] px-3 py-2 text-[13px] outline-none focus:border-[#0c8f86]" placeholder="Sertifikat bo‘yicha izoh..." />
        <div className="mt-3 flex justify-end">
          <button type="button" onClick={() => { setNote(false); notify('Izoh saqlandi') }} className="h-10 rounded-xl bg-[#0e8078] px-4 text-[13px] font-semibold text-white">Saqlash</button>
        </div>
      </Modal>
    </>
  )
}

function Desktop(p) {
  const tabs = [
    { id: 'all', label: `Barcha ishtirokchilar (${p.counts.all})` },
    { id: 'done', label: `Sertifikat berilgan (${p.counts.done})` },
    { id: 'progress', label: `Jarayonda (${p.counts.progress})` },
    { id: 'none', label: `Berilmagan (${p.counts.none})` },
  ]
  return (
    <div>
      <div className="mb-2.5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold leading-tight tracking-tight text-[#143044]">Sertifikatlar</h1>
          <p className="mt-0.5 text-[13px] text-[#8aa0a4]">Seminar ishtirokchilari uchun elektron sertifikatlarni boshqaring</p>
        </div>
        <nav className="flex shrink-0 items-center gap-1 pt-1 text-[12px] text-[#9aafb4]">
          <Link to="/tashkilotchi" className="hover:text-[#0c8f86]">Boshqaruv paneli</Link>
          <span>›</span>
          <Link to="/tashkilotchi/seminarlar" className="hover:text-[#0c8f86]">Mening seminarlarim</Link>
          <span>›</span>
          <Link to="/tashkilotchi/seminarlar/implant" className="hover:text-[#0c8f86]">Implantologiya</Link>
          <span>›</span>
          <span className="text-[#6e868c]">Sertifikatlar</span>
        </nav>
      </div>

      <div className="mb-2.5 flex items-center gap-3 rounded-2xl border border-[#e6f1ef] bg-white px-3 py-2 shadow-[0_1px_2px_rgb(16_40_40/0.03)]">
        <img src="/images/seminars/teeth.jpg" alt="" className="h-[52px] w-[72px] rounded-xl object-cover" />
        <div className="min-w-0">
          <p className="text-[15px] font-bold leading-tight text-[#143044]">Implantologiya: nazariya va amaliyot</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-[#6e868c]">
            <span className="inline-flex items-center gap-1"><Calendar className="size-3.5 text-[#12a394]" /> 24-noyabr 2026, 10:00</span>
            <span className="inline-flex items-center gap-1"><MapPin className="size-3.5 text-[#12a394]" /> Toshkent, Congress Hall</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#e7f8ee] px-2 py-0.5 text-[12px] font-semibold text-[#16a34a]">
              <CircleCheck className="size-3.5" /> O‘tkazildi
            </span>
          </p>
        </div>
      </div>

      <section className="mb-2.5 grid grid-cols-4 gap-2.5">
        <Kpi icon={Users} label="Jami ishtirokchilar" value={String(p.counts.all)} />
        <Kpi icon={CircleCheck} label="Sertifikat berilgan" value={String(p.counts.done)} ring={90} color="#12a99a" />
        <Kpi icon={Clock} label="Jarayonda" value={String(p.counts.progress)} ring={8} color="#f0a31a" />
        <Kpi icon={Shield} label="Berilmagan" value={String(p.counts.none)} ring={2} color="#f05d6a" />
      </section>

      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-0.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => p.setTab(t.id)}
              className={t.id === p.tab
                ? 'h-9 shrink-0 rounded-full bg-[#0e8078] px-3.5 text-[12.5px] font-semibold text-white'
                : 'h-9 shrink-0 rounded-full px-3 text-[12.5px] font-medium text-[#8aa0a4] hover:text-[#3e5a62]'}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button type="button" onClick={p.onTpl} className="h-9 rounded-xl border border-[#b7e4dc] bg-white px-3 text-[12.5px] font-semibold text-[#0c8f86] hover:bg-[#f4fbfa]">
            Sertifikat shablonini sozlash
          </button>
          <button type="button" aria-label="Izoh" onClick={p.onNote} className="grid size-9 place-items-center rounded-xl border border-[#e4eeec] bg-white text-[#5e787e] hover:bg-[#f7fbfb]">
            <MessageSquare className="size-4" />
          </button>
          <button type="button" aria-label={p.preview ? 'Yig‘ish' : 'Ochish'} onClick={() => p.setPreview((v) => !v)} className="grid size-9 place-items-center rounded-xl border border-[#e4eeec] bg-white text-[#5e787e] hover:bg-[#f7fbfb]">
            <ChevronDown className={`size-4 transition ${p.preview ? '' : '-rotate-90'}`} />
          </button>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#e6f1ef] bg-white shadow-[0_1px_2px_rgb(16_40_40/0.04)]">
        <div className={p.preview ? 'grid grid-cols-[minmax(0,1fr)_292px]' : ''}>
          <div className="min-w-0">
            <div className="flex items-center gap-2 p-2.5">
              <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#e4eeec] bg-white px-3">
                <Search className="size-4 shrink-0 text-[#8aa4a8]" />
                <input value={p.q} onChange={(e) => p.setQ(e.target.value)} placeholder="Ishtirokchi nomi, telefon yoki sertifikat raqami qidirish..." className="min-w-0 flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-[#9aafb4]" />
              </label>
              <MiniDrop
                value={p.state}
                onChange={p.setState}
                className="w-[148px]"
                options={[
                  { value: 'all', label: 'Barcha holatlar' },
                  { value: 'done', label: 'Berilgan' },
                  { value: 'progress', label: 'Jarayonda' },
                  { value: 'none', label: 'Berilmagan' },
                ]}
              />
              <MiniDrop
                value={p.ticket}
                onChange={p.setTicket}
                className="w-[168px]"
                options={[
                  { value: 'all', label: 'Barcha chipta turlari' },
                  ...TICKETS.map((t) => ({ value: t, label: t })),
                ]}
              />
              <button type="button" onClick={p.onReset} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-[#e4eeec] bg-white px-3 text-[12.5px] font-medium text-[#3e5a62] hover:bg-[#f7fbfb]">
                <Filter className="size-4 text-[#0c8f86]" /> Filtrlar
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-left">
                <thead>
                  <tr className="border-y border-[#eef3f2] text-[12px] font-medium text-[#93a6ab]">
                    <th className="w-9 py-2 pl-3 font-medium"><Box checked={p.allOn} onChange={p.toggleAll} label="Barchasini tanlash" /></th>
                    <th className="w-8 px-1 py-2 font-medium">#</th>
                    <th className="px-2 py-2 font-medium">Ishtirokchi</th>
                    <th className="px-2 py-2 font-medium">Seminar</th>
                    <th className="px-2 py-2 font-medium">Holat</th>
                    <th className="px-2 py-2 font-medium">Sertifikat raqami</th>
                    <th className="px-2 py-2 font-medium">Berilgan sana</th>
                    <th className="px-2 py-2 pr-3 font-medium">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {p.slice.map((c, i) => (
                    <tr key={c.id} onClick={() => p.setSelected(c.id)} className="cursor-pointer border-b border-[#f3f6f6] hover:bg-[#f8fcfb]">
                      <td className="py-1.5 pl-3" onClick={(e) => e.stopPropagation()}><Box checked={p.checked.has(c.id)} onChange={() => p.toggle(c.id)} label={c.name} /></td>
                      <td className="px-1 text-[12.5px] text-[#8aa0a4]">{p.from + i}</td>
                      <td className="px-2 py-1.5">
                        <span className="flex min-w-0 items-center gap-2">
                          <img src={c.avatar} alt="" className="size-8 shrink-0 rounded-full object-cover" />
                          <span className="min-w-0">
                            <span className="block truncate text-[13px] font-semibold leading-tight text-[#143044]">{c.name}</span>
                            <span className="block truncate text-[11px] text-[#9aa8ae]">{c.clinic}</span>
                          </span>
                        </span>
                      </td>
                      <td className="px-2 text-[12.5px] text-[#143044]">{c.seminar}</td>
                      <td className="px-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${TONE[c.state]}`}>
                          <span className="size-1.5 rounded-full bg-current" />
                          {STATE_LABEL[c.state]}
                        </span>
                      </td>
                      <td className="px-2 text-[12.5px] text-[#3e5a62]">{c.code || '—'}</td>
                      <td className="px-2 text-[12.5px] text-[#3e5a62]">{c.date || '—'}</td>
                      <td className="px-2 pr-3" onClick={(e) => e.stopPropagation()}>
                        <span className="inline-flex items-center gap-0.5 text-[#0c8f86]">
                          {c.state === 'done' ? (
                            <button type="button" aria-label="Yuklab olish" onClick={p.onDownload} className="grid size-7 place-items-center rounded-lg hover:bg-[#f3fbfa]"><Download className="size-4" /></button>
                          ) : (
                            <button type="button" aria-label="Yuborish" onClick={() => p.onIssue(c)} className="grid size-7 place-items-center rounded-lg hover:bg-[#f3fbfa]"><Send className="size-4" /></button>
                          )}
                          <button type="button" aria-label="Ko‘rish" onClick={() => p.setSelected(c.id)} className="grid size-7 place-items-center rounded-lg text-[#7e9398] hover:bg-[#f3fbfa]">
                            <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="2.2" y="2.2" width="11.6" height="11.6" rx="2" /></svg>
                          </button>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {p.total === 0 && <p className="py-8 text-center text-[13px] text-[#7e9398]">Sertifikat topilmadi</p>}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-[#f0f5f4] px-3 py-2.5">
              <div className="flex items-center gap-2 text-[12.5px] text-[#7e9398]">
                <PerSelect value={p.per} onChange={p.setPer} />
                <span>dan {p.from}–{p.to} gacha, jami {p.total} ta</span>
              </div>
              <div className="flex items-center gap-0.5">
                <button type="button" aria-label="Oldingi" disabled={p.page <= 1} onClick={() => p.setPage(p.page - 1)} className="grid size-8 place-items-center rounded-lg text-[#5e787e] disabled:opacity-40"><ChevronLeft className="size-4" /></button>
                {pageWindow(p.page, p.pages).map((n, i) => n === '…'
                  ? <span key={`e${i}`} className="px-1 text-[12px] text-[#9aafb4]">…</span>
                  : (
                    <button key={n} type="button" onClick={() => p.setPage(n)} className={`grid h-8 min-w-8 place-items-center rounded-lg px-1.5 text-[12.5px] font-semibold ${n === p.page ? 'bg-[#0e8078] text-white' : 'text-[#5c7278] hover:bg-[#f4fbfa]'}`}>{n}</button>
                  ))}
                <button type="button" aria-label="Keyingi" disabled={p.page >= p.pages} onClick={() => p.setPage(p.page + 1)} className="grid size-8 place-items-center rounded-lg text-[#5e787e] disabled:opacity-40"><ChevronRight className="size-4" /></button>
              </div>
            </div>
          </div>

          {p.preview && p.cert && (
            <aside className="border-l border-[#eef3f2] px-3 pb-3 pt-3">
              <CertFrame width={268} name={p.cert.name} course={COURSE} date={p.cert.date ? CERT_DATE : CERT_DATE} />
              <button type="button" onClick={p.onDownload} className="mt-2.5 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-[#0e8078] text-[13px] font-semibold text-white shadow-[0_6px_14px_rgb(14_128_120/0.22)] hover:bg-[#0c756e]">
                <Download className="size-4" /> Sertifikatni yuklab olish
              </button>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                <Act icon={Mail} label="Email yuborish" onClick={p.onMail} />
                <Act icon={QrCode} label="QR kod yaratish" onClick={p.onQr} />
                <Act icon={Send} label="Qayta yuborish" onClick={p.onResend} />
              </div>
            </aside>
          )}
        </div>
      </section>
    </div>
  )
}

function Kpi({ icon: Icon, label, value, ring, color }) {
  return (
    <article className="flex items-center gap-2.5 rounded-2xl border border-[#e6f1ef] bg-white px-3 py-2.5 shadow-[0_1px_2px_rgb(16_40_40/0.03)]">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e7f6f3] text-[#12a394]">
        <Icon className="size-[18px]" strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] leading-tight text-[#8aa0a6]">{label}</p>
        <p className="mt-0.5 text-[22px] font-bold leading-none tracking-tight text-[#143044]">{value}</p>
      </div>
      {ring != null && <Ring value={ring} color={color} />}
    </article>
  )
}

function Ring({ value, color }) {
  const size = 52
  const stroke = 5
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const dash = (value / 100) * c
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e7eeed" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle" fill={color} fontSize="11" fontWeight="700" fontFamily="Inter, sans-serif">{value}%</text>
    </svg>
  )
}

function Box({ checked, onChange, label }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} aria-label={label} onClick={onChange} className={`grid size-4 place-items-center rounded-[4px] border ${checked ? 'border-[#0e8078] bg-[#0e8078] text-white' : 'border-[#c9d6d3] bg-white'}`}>
      {checked && <svg viewBox="0 0 12 12" className="size-2.5"><path d="M2 6.2 4.6 8.8 10 3.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>}
    </button>
  )
}

function Act({ icon: Icon, label, onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex h-10 items-center justify-center gap-1 rounded-xl border border-[#b7e4dc] bg-white px-1 text-[10.5px] font-semibold leading-tight text-[#0c8f86] hover:bg-[#f4fbfa]">
      <Icon className="size-3.5 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  )
}

function MiniDrop({ value, onChange, options, className }) {
  const [open, setOpen] = useState(false)
  const current = options.find((o) => o.value === value) || options[0]
  return (
    <div className={`relative shrink-0 ${className || ''}`}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex h-10 w-full items-center justify-between gap-1 rounded-xl border border-[#e4eeec] bg-white px-2.5 text-[12.5px] text-[#3e5a62]">
        <span className="truncate">{current?.label}</span>
        <ChevronDown className="size-3.5 shrink-0 text-[#8aa4a8]" />
      </button>
      {open && (
        <ul className="absolute left-0 z-30 mt-1 max-h-60 w-full min-w-[160px] overflow-auto rounded-xl border border-[#e6eeec] bg-white py-1 shadow-lg">
          {options.map((o) => (
            <li key={o.value}>
              <button type="button" className={`block w-full px-3 py-1.5 text-left text-[12.5px] hover:bg-[#f4fbfa] ${o.value === value ? 'font-semibold text-[#0c8f86]' : ''}`} onClick={() => { onChange(o.value); setOpen(false) }}>{o.label}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function PerSelect({ value, onChange }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex h-8 w-[64px] items-center justify-between rounded-lg border border-[#e4eeec] bg-white px-2 text-[12.5px] text-[#3e5a62]">
        {value}
        <ChevronDown className="size-3.5 text-[#8aa4a8]" />
      </button>
      {open && (
        <ul className="absolute bottom-9 left-0 z-30 w-[72px] overflow-hidden rounded-lg border border-[#e6eeec] bg-white py-1 shadow-lg">
          {[10, 20, 50].map((n) => (
            <li key={n}>
              <button type="button" className="block w-full px-2 py-1 text-left text-[12.5px] hover:bg-[#f4fbfa]" onClick={() => { onChange(n); setOpen(false) }}>{n}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const M_TABS = [
  { id: 'umumiy', label: 'Umumiy', to: '/tashkilotchi/seminarlar/implant' },
  { id: 'people', label: 'Ishtirokchilar', to: '/tashkilotchi/ishtirokchilar' },
  { id: 'tickets', label: 'Chiptalar', to: '/tashkilotchi/chiptalar' },
  { id: 'pay', label: 'To‘lovlar', to: '/tashkilotchi/tolovlar' },
  { id: 'cert', label: 'Sertifikatlar' },
]

function Mobile(p) {
  const [more, setMore] = useState(false)
  const chips = [
    { id: 'all', label: `Barchasi (${p.counts.all})` },
    { id: 'done', label: `Berilgan (${p.counts.done})` },
    { id: 'wait', label: `Kutilmoqda (${p.counts.wait})` },
  ]
  return (
    <div className="bg-white pb-20 text-[#143044]">
      <header className="relative sticky top-0 z-20 flex items-center gap-1.5 bg-white px-2 py-1.5">
        <Link to="/tashkilotchi/seminarlar" aria-label="Orqaga" className="grid size-9 place-items-center text-[#243044]">
          <ChevronLeft className="size-5" />
        </Link>
        <div className="min-w-0 leading-none">
          <img src="/images/logo.png" alt="StomaHub" className="h-[26px] w-auto" />
          <p className="mt-0.5 text-[11px] text-[#8b90a8]">Seminar tashkilotchisi</p>
        </div>
        <button type="button" aria-label="Yana" onClick={() => setMore((v) => !v)} className="ml-auto grid size-9 place-items-center text-[#243044]">
          <MoreVertical className="size-5" />
        </button>
        {more && (
          <div className="absolute right-3 top-12 z-30 w-44 overflow-hidden rounded-xl border border-[#e6eeec] bg-white py-1 shadow-lg">
            <Link to="/tashkilotchi/sozlamalar" className="block px-3 py-2 text-[13px] hover:bg-[#f4fbfa]">Sozlamalar</Link>
            <Link to="/tashkilotchi/yordam" className="block px-3 py-2 text-[13px] hover:bg-[#f4fbfa]">Yordam</Link>
          </div>
        )}
      </header>

      <div className="flex items-center gap-2.5 px-3.5 pt-0.5">
        <img src="/images/seminars/teeth.jpg" alt="" className="h-[60px] w-[72px] shrink-0 rounded-xl object-cover" />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold leading-none text-[#6a5acd]">Implantologiya</p>
          <p className="mt-0.5 text-[15px] font-bold leading-tight">Implantologiya: amaliy kurs</p>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[#7d8f96]"><Calendar className="size-3 shrink-0 text-[#12a394]" /> 21 oktabr 2026, 09:00 – 18:00</p>
          <p className="flex items-center gap-1 text-[11px] text-[#7d8f96]"><MapPin className="size-3 shrink-0 text-[#12a394]" /> Toshkent City Kongress Markazi</p>
        </div>
      </div>

      <div className="mx-3.5 mt-2 flex gap-2.5 overflow-x-auto border-b border-[#eef2f2] text-[12px]">
        {M_TABS.map((t) => t.to ? (
          <Link key={t.id} to={t.to} className="shrink-0 border-b-2 border-transparent pb-2 font-medium text-[#8b9aa0]">{t.label}</Link>
        ) : (
          <span key={t.id} className="shrink-0 border-b-2 border-[#0e8078] pb-2 font-semibold text-[#0e8078]">{t.label}</span>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 px-3.5">
        <h2 className="text-[18px] font-bold leading-none">Sertifikatlar</h2>
        <button type="button" onClick={p.onSendAll} className="inline-flex h-8 items-center gap-1 rounded-xl bg-[#0e8078] px-2.5 text-[12px] font-semibold text-white">
          <Send className="size-3.5" /> Hammaga yuborish
        </button>
      </div>
      <p className="mt-0.5 px-3.5 text-[12px] text-[#8aa0a4]">Ishtirokchilarga sertifikat berish va yuborish</p>

      <div className="mx-3.5 mt-2 grid grid-cols-[92px_minmax(0,1fr)] items-start gap-2 rounded-2xl bg-[#e7f6f3] p-2">
        <CertFrame width={92} qr name="Aliyeva Mohira" course="Implantologiya: amaliy kurs" date="21 oktabr 2026" />
        <div className="min-w-0">
          <p className="text-[13px] font-bold leading-tight">Sertifikat shabloni</p>
          <p className="mt-0.5 text-[11px] leading-snug text-[#5e787e]">Barcha ishtirokchilarga shu shablon asosida sertifikat beriladi.</p>
          <div className="mt-1.5 grid grid-cols-2 gap-1">
            <div className="rounded-xl bg-white px-2 py-1.5">
              <p className="flex items-center gap-1 text-[10px] text-[#8aa0a4]"><Clock className="size-3 text-[#0c8f86]" /> Kredit soati</p>
              <p className="text-[16px] font-bold leading-tight">16</p>
            </div>
            <button type="button" onClick={p.onTpl} className="flex items-center justify-between rounded-xl bg-white px-2 py-1.5 text-left">
              <span>
                <QrCode className="size-3.5 text-[#0c8f86]" />
                <span className="mt-0.5 block text-[10.5px] font-semibold leading-tight text-[#143044]">QR tekshirish</span>
              </span>
              <ChevronRight className="size-3.5 text-[#9aa8ae]" />
            </button>
          </div>
          <button type="button" onClick={p.onTpl} className="mt-1.5 flex h-7 w-full items-center justify-center gap-1 rounded-lg border border-[#b7e4dc] bg-white text-[11.5px] font-semibold text-[#0c8f86]">
            <Pencil className="size-3.5" /> Shablonni tahrirlash
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-1.5 px-3.5">
        {chips.map((c) => (
          <button key={c.id} type="button" onClick={() => p.setTab(c.id)} className={`h-8 shrink-0 rounded-full px-3 text-[12px] font-semibold ${p.tab === c.id ? 'bg-[#0e8078] text-white' : 'bg-[#f2f4f5] text-[#6e8086]'}`}>
            {c.label}
          </button>
        ))}
        <button type="button" aria-label="Qidirish" onClick={() => p.setSeek((v) => !v)} className="ml-auto grid size-8 place-items-center rounded-full bg-[#f2f4f5] text-[#5e787e]">
          <Search className="size-4" />
        </button>
        <button type="button" aria-label="Filtr" onClick={() => p.setTab('all')} className="grid size-8 place-items-center rounded-full bg-[#f2f4f5] text-[#5e787e]">
          <Filter className="size-4" />
        </button>
      </div>
      {p.seek && (
        <label className="mx-3.5 mt-2 flex h-9 items-center gap-2 rounded-xl border border-[#e4eeec] px-3">
          <Search className="size-4 text-[#8aa4a8]" />
          <input value={p.q} onChange={(e) => p.setQ(e.target.value)} placeholder="Ism yoki telefon" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none" />
        </label>
      )}

      <div className="mx-3.5 mt-2 overflow-hidden rounded-xl border border-[#eef2f2]">
        <div className="grid grid-cols-[16px_minmax(0,1.45fr)_42px_74px_58px] items-center gap-1 bg-[#f6f7fb] px-2 py-1.5 text-[11px] font-medium text-[#8b9aa3]">
          <span>#</span>
          <span>Ishtirokchi</span>
          <span>Sertifikat</span>
          <span>Holat</span>
          <span className="text-right">Amal</span>
        </div>
        {p.rows.map((r, i) => (
          <div key={r.id} className="grid grid-cols-[16px_minmax(0,1.45fr)_42px_74px_58px] items-center gap-1 border-t border-[#f2f5f6] px-2 py-1">
            <span className="text-[11px] text-[#9aa8ae]">{i + 1}</span>
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#d9f3ef] text-[10px] font-bold text-[#0c8f86]">{initials(r.name)}</span>
              <span className="min-w-0">
                <span className="block truncate text-[12.5px] font-semibold leading-tight">{r.name}</span>
                <span className="block truncate text-[10.5px] text-[#9aa8ae]">{r.phone}</span>
              </span>
            </span>
            <span>{r.state === 'done' ? <MiniCert /> : null}</span>
            <span>
              {r.state === 'done' ? (
                <>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-[#1aaa6a]"><span className="size-1.5 rounded-full bg-[#1aaa6a]" /> Berildi</span>
                  <span className="block pl-2.5 text-[10px] text-[#9aa8ae]">{r.date}</span>
                </>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-medium text-[#98a4aa]"><span className="size-1.5 rounded-full bg-[#c5cdd1]" /> Kutilmoqda</span>
              )}
            </span>
            <span className="flex items-center justify-end gap-0.5">
              {r.state === 'done' ? (
                <button type="button" aria-label="QR" onClick={() => p.onQr(r)} className="grid size-7 place-items-center rounded-lg border border-[#b7e4dc] text-[#0c8f86]"><QrCode className="size-3.5" /></button>
              ) : (
                <button type="button" aria-label="Yuborish" onClick={() => p.onSend(r.id)} className="grid size-7 place-items-center rounded-lg border border-[#b7e4dc] text-[#0c8f86]"><Send className="size-3.5" /></button>
              )}
              <button type="button" aria-label="Ochish" onClick={() => p.onOpen(r)} className="grid size-6 place-items-center text-[#b0bec4]"><ChevronRight className="size-4" /></button>
            </span>
          </div>
        ))}
        {p.rows.length === 0 && <p className="py-8 text-center text-[13px] text-[#8aa0a4]">Sertifikat topilmadi</p>}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#eef1f6] bg-white px-1 pb-1 pt-1">
        <div className="grid grid-cols-5 items-end text-[10px] text-[#8a86b0]">
          <TabLink to="/tashkilotchi" icon={House} label="Panel" />
          <TabLink to="/tashkilotchi/seminarlar" icon={CalendarDays} label="Seminarlar" />
          <Link to="/tashkilotchi/qr" className="flex flex-col items-center gap-0.5 font-semibold text-[#0e8078]">
            <span className="-mt-5 grid size-[54px] place-items-center rounded-full bg-[#0e8078] text-white shadow-[0_8px_16px_rgb(14_128_120/0.35)]">
              <QrCode className="size-6" />
            </span>
            Check-in
          </Link>
          <TabLink to="/tashkilotchi/hamyon" icon={Wallet} label="Hamyon" />
          <TabLink to="/tashkilotchi/sozlamalar" icon={Ellipsis} label="Yana" />
        </div>
      </nav>
    </div>
  )
}

function TabLink({ to, icon: Icon, label }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-0.5 py-1 font-medium">
      <Icon className="size-[22px]" strokeWidth={1.7} />
      {label}
    </Link>
  )
}

