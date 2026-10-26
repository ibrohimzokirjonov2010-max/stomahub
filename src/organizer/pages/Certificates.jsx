import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Award, Clock, Download, Mail, QrCode, RefreshCw, Send, Shield, Users } from 'lucide-react'
import { CERTS, CERT_STATE, CERT_TEMPLATES } from '../data'
import { useOrg } from '../Shell'
import { Badge, Btn, Card, CertificateCard, Empty, Modal, Pager, Person, QrMark, SearchBox, Select, Tabs, usePager } from '../ui'

const TONE = { done: 'green', progress: 'orange', none: 'red' }

export default function Certificates() {
  const { query, notify } = useOrg()
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const [state, setState] = useState('all')
  const [ticket, setTicket] = useState('all')
  const [rows, setRows] = useState(CERTS)
  const [selected, setSelected] = useState(CERTS[0].id)
  const [template, setTemplate] = useState('teal')
  const [tplOpen, setTplOpen] = useState(false)
  const [qr, setQr] = useState(false)

  const filtered = useMemo(() => {
    const s = `${query} ${q}`.trim().toLowerCase()
    return rows.filter((c) => {
      if (tab !== 'all' && c.state !== tab) return false
      if (state !== 'all' && c.state !== state) return false
      if (s && !`${c.name} ${c.code} ${c.clinic}`.toLowerCase().includes(s)) return false
      return true
    })
  }, [rows, query, q, tab, state])
  const pager = usePager(filtered, 10)
  const cert = rows.find((c) => c.id === selected) || filtered[0]

  const issue = (c) => {
    const code = `STH-2026-${String(c.id).padStart(4, '0')}`
    setRows((list) => list.map((x) => x.id === c.id ? { ...x, state: 'done', code, date: '24-noy 2026' } : x))
    notify('Sertifikat berildi')
  }

  return (
    <div>
      <div className="mb-4">
        <p className="mb-1 text-[12px] text-[#8aa0a4]"><Link to="/tashkilotchi" className="hover:text-[#0c8f86]">Boshqaruv paneli</Link> <span className="px-1">›</span> <Link to="/tashkilotchi/seminarlar" className="hover:text-[#0c8f86]">Mening seminarlarim</Link> <span className="px-1">›</span> Implantologiya <span className="px-1">›</span> Sertifikatlar</p>
        <h1 className="text-[22px] font-bold">Sertifikatlar</h1>
        <p className="mt-0.5 text-[13px] text-[#6e868c]">Seminar ishtirokchilari uchun elektron sertifikatlarni boshqaring</p>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3 rounded-2xl border border-[#e6f1ef] bg-white p-3">
        <img src="/images/seminars/teeth.jpg" alt="" className="h-12 w-16 rounded-lg object-cover" />
        <div className="min-w-0 flex-1">
          <p className="font-bold">Implantologiya: nazariya va amaliyot</p>
          <p className="text-[12px] text-[#7e9398]">24-noyabr 2026, 10:00 · Toshkent, Congress Hall</p>
        </div>
        <Badge tone="green" dot>O‘tkazildi</Badge>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiMini icon={Users} label="Jami ishtirokchilar" value="200" />
        <KpiMini icon={Award} label="Sertifikat berilgan" value="180" hint="90%" />
        <KpiMini icon={Clock} label="Jarayonda" value="15" hint="8%" />
        <KpiMini icon={Shield} label="Berilmagan" value="5" hint="2%" />
      </section>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <Tabs tabs={[
          { id: 'all', label: 'Barcha ishtirokchilar (200)' },
          { id: 'done', label: 'Sertifikat berilgan (180)' },
          { id: 'progress', label: 'Jarayonda (15)' },
          { id: 'none', label: 'Berilmagan (5)' },
        ]} value={tab} onChange={setTab} />
        <Btn kind="ghost" onClick={() => setTplOpen(true)}>Sertifikat shablonini sozlash</Btn>
      </div>

      <Card className="mt-3" pad={false}>
        <div className="flex flex-wrap gap-2 p-3">
          <SearchBox value={q} onChange={setQ} placeholder="Ishtirokchi nomi, telefon yoki sertifikat raqami qidirish..." className="min-w-[220px] flex-1" />
          <Select value={state} onChange={setState} className="w-[160px]" options={[{ value: 'all', label: 'Barcha holatlar' }, ...Object.entries(CERT_STATE).map(([value, label]) => ({ value, label }))]} />
          <Select value={ticket} onChange={setTicket} className="w-[170px]" options={[{ value: 'all', label: 'Barcha chipta turlari' }, { value: 'vip', label: 'VIP' }, { value: 'standart', label: 'Standart' }]} />
          <Btn kind="soft" onClick={() => { setQ(''); setState('all'); setTicket('all'); setTab('all') }}>Filtrlar</Btn>
        </div>
        <div className="org-with-side">
          <div className="min-w-0 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead><tr className="border-y border-[#eef3f2] text-[12px] text-[#8aa0a4]">{['#', 'Ishtirokchi', 'Seminar', 'Holat', 'Sertifikat raqami', 'Berilgan sana', 'Amallar'].map((h) => <th key={h} className="px-3 py-2.5 font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {pager.slice.map((c, i) => (
                  <tr key={c.id} onClick={() => setSelected(c.id)} className={`cursor-pointer border-b border-[#f3f7f6] ${cert?.id === c.id ? 'bg-[#f4fbfa]' : 'hover:bg-[#f8fcfb]'}`}>
                    <td className="px-3 py-2.5 text-[12.5px] text-[#7e9398]">{pager.from + i}</td>
                    <td className="px-3 py-2.5"><Person name={c.name} sub={c.clinic} avatar={c.avatar} /></td>
                    <td className="px-3 py-2.5 text-[12.5px]">{c.seminar}</td>
                    <td className="px-3 py-2.5"><Badge tone={TONE[c.state]} dot>{CERT_STATE[c.state]}</Badge></td>
                    <td className="px-3 py-2.5 text-[12.5px]">{c.code || '—'}</td>
                    <td className="px-3 py-2.5 text-[12.5px]">{c.date || '—'}</td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex gap-1" onClick={(e) => e.stopPropagation()}>
                        {c.state === 'done' ? <button type="button" aria-label="Yuklab olish" onClick={() => notify('Sertifikat yuklab olindi')} className="grid size-8 place-items-center text-[#0c8f86]"><Download className="size-4" /></button> : <button type="button" aria-label="Berish" onClick={() => issue(c)} className="grid size-8 place-items-center text-[#0c8f86]"><Send className="size-4" /></button>}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pager.total === 0 && <Empty text="Sertifikat topilmadi" />}
            <Pager {...pager} onPage={pager.setPage} onPer={pager.setPer} />
          </div>
          {cert && (
            <aside className="border-t border-[#eef3f2] p-4 lg:border-l lg:border-t-0">
              <CertificateCard name={cert.name} course="Implantologiya: nazariya va amaliyot" date={cert.date || '24-noyabr 2026'} template={template} />
              <div className="mt-3 space-y-2">
                <Btn className="w-full" onClick={() => notify('Sertifikat yuklab olindi')}><Download className="size-4" /> Sertifikatni yuklab olish</Btn>
                <div className="grid grid-cols-3 gap-2">
                  <Mini icon={Mail} label="Email yuborish" onClick={() => notify('Email yuborildi')} />
                  <Mini icon={QrCode} label="QR kod yaratish" onClick={() => setQr(true)} />
                  <Mini icon={RefreshCw} label="Qayta yuborish" onClick={() => notify('Qayta yuborildi')} />
                </div>
              </div>
            </aside>
          )}
        </div>
      </Card>

      <Modal open={tplOpen} title="Sertifikat shablonini sozlash" onClose={() => setTplOpen(false)} width={640}>
        <div className="grid grid-cols-2 gap-3">
          {CERT_TEMPLATES.map((t) => (
            <button key={t.id} type="button" onClick={() => setTemplate(t.id)} className={`rounded-xl border p-2 text-left ${template === t.id ? 'border-[#0c8f86] ring-2 ring-[#0c8f86]/30' : 'border-[#e6f1ef]'}`}>
              <CertificateCard name="Aliyeva Mohira" course="Implantologiya: nazariya va amaliyot" template={t.id} />
              <p className="mt-2 text-center text-[12.5px] font-semibold">{t.name}</p>
            </button>
          ))}
        </div>
        <div className="mt-4 flex justify-end"><Btn onClick={() => { setTplOpen(false); notify('Shablon saqlandi') }}>Saqlash</Btn></div>
      </Modal>
      <Modal open={qr} title="Sertifikat QR kodi" onClose={() => setQr(false)}>
        <div className="grid place-items-center"><QrMark size={160} seed={cert?.id || 1} /></div>
        <p className="mt-2 text-center text-[12.5px]">{cert?.code || 'Hali berilmagan'}</p>
      </Modal>
    </div>
  )
}

function KpiMini({ icon: Icon, label, value, hint }) {
  return (
    <article className="rounded-2xl border border-[#e6f1ef] bg-white px-4 py-3.5">
      <span className="grid size-9 place-items-center rounded-xl bg-[#e7f7f4] text-[#0c8f86]"><Icon className="size-4" /></span>
      <p className="mt-2 text-[12px] text-[#6e868c]">{label}</p>
      <p className="text-[22px] font-bold leading-tight">{value} {hint && <span className="text-[13px] font-semibold text-[#16a34a]">{hint}</span>}</p>
    </article>
  )
}

function Mini({ icon: Icon, label, onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-1 rounded-xl border border-[#e6f1ef] px-1 py-2 text-[10.5px] font-medium leading-tight text-[#1c4a5a] hover:bg-[#f6fbfa]">
      <Icon className="size-4 text-[#0c8f86]" />{label}
    </button>
  )
}
