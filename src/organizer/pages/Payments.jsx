import { useMemo, useState } from 'react'
import { Calendar, Check, Clock, Download, Mail, Wallet, XCircle } from 'lucide-react'
import { PAYMENTS, PAY_BARS, PAY_METHODS, PAY_STATE, som } from '../data'
import { useOrg } from '../Shell'
import { Badge, BarChart, Btn, Card, Donut, Empty, Field, Kpi, MenuBtn, Modal, Pager, Person, SearchBox, Select, Tabs, inputCls, usePager } from '../ui'

const TONE = { ok: 'green', wait: 'orange', cancel: 'red', refund: 'slate' }
const DOT = { Payme: '#12a394', Click: '#3b82f6', Uzum: '#8b5cf6', Paynet: '#f59e0b' }

export default function Payments() {
  const { query, notify } = useOrg()
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const [seminar, setSeminar] = useState('all')
  const [method, setMethod] = useState('all')
  const [state, setState] = useState('all')
  const [rows, setRows] = useState(PAYMENTS)
  const [selected, setSelected] = useState(PAYMENTS[0].id)
  const [checked, setChecked] = useState({})
  const [mail, setMail] = useState(false)
  const [receipt, setReceipt] = useState(false)
  const [refund, setRefund] = useState(false)
  const [range, setRange] = useState('1-yan, 2026 — 31-dek, 2026')

  const filtered = useMemo(() => {
    const s = `${query} ${q}`.trim().toLowerCase()
    return rows.filter((p) => {
      if (tab !== 'all' && p.state !== tab) return false
      if (state !== 'all' && p.state !== state) return false
      if (seminar !== 'all' && !p.seminar.toLowerCase().includes(seminar)) return false
      if (method !== 'all' && p.method !== method) return false
      if (s && !`${p.who} ${p.seminar} ${p.id} ${p.clinic}`.toLowerCase().includes(s)) return false
      return true
    })
  }, [rows, query, q, tab, state, seminar, method])
  const pager = usePager(filtered, 10)
  const pay = rows.find((p) => p.id === selected) || null
  const counts = { all: 1030, ok: 950, wait: 60, cancel: 20, refund: 15 }

  const doRefund = () => {
    if (!pay) return
    setRows((list) => list.map((p) => p.id === pay.id ? { ...p, state: 'refund' } : p))
    setRefund(false)
    notify('To‘lov qaytarildi')
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold">To‘lovlar</h1>
          <p className="mt-0.5 text-[13px] text-[#6e868c]">Seminar to‘lovlarini boshqaring, tranzaksiyalarni kuzating va hisobotlar oling</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={range} onChange={setRange} className="w-[230px]" options={[{ value: '1-yan, 2026 — 31-dek, 2026', label: '1-yan, 2026 — 31-dek, 2026' }, { value: 'Shu oy', label: 'Shu oy' }]} />
          <Btn onClick={() => notify('Hisobot yuklab olindi')}><Download className="size-4" /> Hisobotni yuklab olish</Btn>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Wallet} label="Umumiy tushum" value="98 600 000 so‘m" delta="+28%" hint="o‘tgan oyga nisbatan" />
        <Kpi icon={Check} label="Muvaffaqiyatli to‘lovlar" value="950" hint="92%" hintClass="font-semibold text-[#16a34a]" />
        <Kpi icon={Clock} label="Kutilayotgan to‘lovlar" value="60" hint="6%" hintClass="font-semibold text-[#d0890b]" />
        <Kpi icon={XCircle} label="Bekor qilingan to‘lovlar" value="20" hint="2%" hintClass="font-semibold text-[#e11d48]" />
      </section>

      <section className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.7fr)]">
        <Card title="Tushumlar dinamikasi" extra={<Select value="som" onChange={() => {}} className="w-[110px]" options={[{ value: 'som', label: 'So‘mda' }]} />}>
          <BarChart values={PAY_BARS} max={40000000} ticks={['40M', '30M', '20M', '10M', '0']} format={(n) => n >= 1000000 ? `${Math.round(n / 1000000)}M` : n} height={180} />
        </Card>
        <Card title="To‘lov usullari bo‘yicha">
          <Donut parts={PAY_METHODS} center="98,6M" sub="so‘m" />
        </Card>
      </section>

      <div className="mt-4">
        <Tabs tabs={[
          { id: 'all', label: `Barcha to‘lovlar (${counts.all.toLocaleString('ru-RU').replace('\u00a0', ' ')})` },
          { id: 'ok', label: `Muvaffaqiyatli (${counts.ok})` },
          { id: 'wait', label: `Kutilayotgan (${counts.wait})` },
          { id: 'cancel', label: `Bekor qilingan (${counts.cancel})` },
          { id: 'refund', label: `Qaytarilgan (${counts.refund})` },
        ]} value={tab} onChange={(id) => { setTab(id); pager.setPage(1) }} />
      </div>

      <Card className="mt-3" pad={false}>
        <div className="flex flex-wrap gap-2 p-3">
          <SearchBox value={q} onChange={setQ} placeholder="Ishtirokchi, seminar yoki tranzaksiya ID..." className="min-w-[220px] flex-1" />
          <Select value={seminar} onChange={setSeminar} className="w-[160px]" options={[{ value: 'all', label: 'Barcha seminarlar' }, { value: 'implant', label: 'Implantologiya' }, { value: 'endodont', label: 'Endodontiya' }, { value: 'bolalar', label: 'Bolalar' }]} />
          <Select value={method} onChange={setMethod} className="w-[140px]" options={[{ value: 'all', label: 'Barcha usullar' }, { value: 'Payme', label: 'Payme' }, { value: 'Click', label: 'Click' }, { value: 'Uzum', label: 'Uzum' }, { value: 'Paynet', label: 'Paynet' }]} />
          <Select value={state} onChange={setState} className="w-[150px]" options={[{ value: 'all', label: 'Barcha holatlar' }, ...Object.entries(PAY_STATE).map(([value, label]) => ({ value, label }))]} />
          <Select value="all" onChange={() => {}} className="w-[140px]" options={[{ value: 'all', label: 'Sana oralig‘i' }]} />
          <Btn kind="soft" onClick={() => { setQ(''); setSeminar('all'); setMethod('all'); setState('all'); setTab('all') }}>Filtrlar</Btn>
        </div>
        <div className="org-with-side">
          <div className="min-w-0 overflow-x-auto">
            <table className="w-full min-w-[920px] text-left">
              <thead>
                <tr className="border-y border-[#eef3f2] text-[12px] text-[#8aa0a4]">
                  <th className="px-3 py-2"><input type="checkbox" aria-label="Hammasini belgilash" onChange={(e) => {
                    const next = {}
                    if (e.target.checked) pager.slice.forEach((p) => { next[p.id] = true })
                    setChecked(next)
                  }} /></th>
                  {['#', 'Sana va vaqt', 'Ishtirokchi', 'Seminar', 'Summa', 'To‘lov usuli', 'Holat', 'Amallar'].map((h) => <th key={h} className="px-2 py-2.5 font-medium">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {pager.slice.map((p) => (
                  <tr key={p.id} onClick={() => setSelected(p.id)} className={`cursor-pointer border-b border-[#f3f7f6] ${pay?.id === p.id ? 'bg-[#f4fbfa]' : 'hover:bg-[#f8fcfb]'}`}>
                    <td className="px-3" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={!!checked[p.id]} aria-label={p.id} onChange={() => setChecked((c) => ({ ...c, [p.id]: !c[p.id] }))} /></td>
                    <td className="px-2 py-2.5 text-[12px] font-medium text-[#0c8f86]">#{p.id}</td>
                    <td className="px-2 py-2.5 text-[12px] leading-tight text-[#5e787e]"><div>{p.when.split(',')[0]}</div><div>{p.when.split(',')[1]?.trim()}</div></td>
                    <td className="px-2 py-2.5"><Person name={p.who} sub={p.clinic} avatar={p.avatar} /></td>
                    <td className="max-w-[180px] truncate px-2 py-2.5 text-[12.5px]">{p.seminar}</td>
                    <td className="px-2 py-2.5 text-[12.5px] font-semibold">{som(p.sum)}</td>
                    <td className="px-2 py-2.5"><span className="inline-flex items-center gap-1 text-[12.5px]"><span className="size-2 rounded-full" style={{ background: DOT[p.method] || '#94a3b8' }} />{p.method}</span></td>
                    <td className="px-2 py-2.5"><Badge tone={TONE[p.state]} dot>{PAY_STATE[p.state]}</Badge></td>
                    <td className="px-2" onClick={(e) => e.stopPropagation()}><MenuBtn items={[{ label: 'Chek', onClick: () => { setSelected(p.id); setReceipt(true) } }, { label: 'Qaytarish', danger: true, onClick: () => { setSelected(p.id); setRefund(true) } }]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pager.total === 0 && <Empty text="To‘lov topilmadi" />}
            <Pager {...pager} onPage={pager.setPage} onPer={pager.setPer} />
          </div>
          {pay && (
            <aside className="border-t border-[#eef3f2] p-4 lg:border-l lg:border-t-0">
              <div className="mb-2 flex items-center justify-between"><h3 className="font-bold">To‘lov ma’lumotlari</h3><button type="button" aria-label="Yopish" onClick={() => setSelected(null)} className="text-[#8aa0a4]">✕</button></div>
              <Badge tone={TONE[pay.state]}>{PAY_STATE[pay.state]} to‘lov</Badge>
              <p className="mt-2 text-[22px] font-bold">{som(pay.sum)}</p>
              <p className="text-[12px] text-[#0c8f86]">#{pay.id}</p>
              <dl className="mt-3 space-y-2 text-[12.5px]">
                {[['Sana va vaqt', pay.when], ['To‘lov usuli', pay.method], ['Ishtirokchi', pay.who], ['Telefon', pay.phone], ['Email', pay.email], ['Seminar', pay.seminar], ['Chipta turi', pay.ticket]].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3"><dt className="text-[#7e9398]">{k}</dt><dd className="max-w-[58%] text-right font-medium">{v}</dd></div>
                ))}
                <div className="flex justify-between"><dt className="text-[#7e9398]">Holat</dt><dd><Badge tone={TONE[pay.state]}>{PAY_STATE[pay.state]}</Badge></dd></div>
              </dl>
              <div className="mt-4 space-y-2">
                <Btn kind="ghost" className="w-full" onClick={() => setReceipt(true)}>Chekni ko‘rish</Btn>
                <Btn className="w-full" onClick={() => notify('Chek yuklab olindi')}><Download className="size-4" /> Chekni yuklab olish</Btn>
                <Btn kind="ghost" className="w-full" onClick={() => setRefund(true)}>To‘lovni qaytarish</Btn>
                <Btn kind="ghost" className="w-full" onClick={() => setMail(true)}><Mail className="size-4" /> Email yuborish</Btn>
              </div>
            </aside>
          )}
        </div>
      </Card>

      <Modal open={receipt} title="To‘lov cheki" onClose={() => setReceipt(false)}>
        {pay && <Receipt pay={pay} />}
      </Modal>
      <Modal open={refund} title="To‘lovni qaytarish" sub="Bu amalni tasdiqlasangiz, summa ishtirokchiga qaytariladi." onClose={() => setRefund(false)}>
        <p className="text-[13px]">Summa: <b>{pay ? som(pay.sum) : ''}</b></p>
        <div className="mt-4 flex justify-end gap-2"><Btn kind="soft" onClick={() => setRefund(false)}>Ortga</Btn><Btn onClick={doRefund}>Qaytarishni tasdiqlash</Btn></div>
      </Modal>
      <Modal open={mail} title="Email yuborish" onClose={() => setMail(false)}>
        <Field label="Email"><input className={inputCls()} defaultValue={pay?.email || ''} /></Field>
        <div className="mt-3 flex justify-end gap-2"><Btn kind="soft" onClick={() => setMail(false)}>Bekor qilish</Btn><Btn onClick={() => { setMail(false); notify('Email yuborildi') }}>Yuborish</Btn></div>
      </Modal>
    </div>
  )
}

function Receipt({ pay }) {
  return (
    <div className="rounded-xl border border-dashed border-[#d5ebe6] p-4 text-[13px]">
      <p className="text-center text-[12px] text-[#7e9398]">StomaHub · To‘lov cheki</p>
      <p className="mt-2 text-center text-[18px] font-bold">{som(pay.sum)}</p>
      <p className="text-center text-[12px] text-[#0c8f86]">#{pay.id}</p>
      <div className="mt-3 space-y-1 text-[12.5px]">
        <p>{pay.who} · {pay.clinic}</p>
        <p>{pay.seminar}</p>
        <p>{pay.ticket} · {pay.method}</p>
        <p>{pay.when}</p>
      </div>
    </div>
  )
}
