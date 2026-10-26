import { useMemo, useState } from 'react'
import { BadgePercent, Gift, Plus, TrendingUp, Users } from 'lucide-react'
import { PROMOS, PROMO_STATUS, SEMINARS, som } from '../data'
import { useOrg } from '../Shell'
import { Badge, Btn, Card, Empty, Field, MenuBtn, Pager, SearchBox, Select, Tabs, Toggle, inputCls, usePager } from '../ui'

const TONE = { faol: 'green', yakun: 'slate', reja: 'orange', nofaol: 'red' }

const blank = { name: '', code: '', kind: 'foiz', value: '20', limit: '', endless: false, from: '2026-11-01', to: '2026-11-24', onlyTicket: false }

export default function Promos() {
  const { query, notify } = useOrg()
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const [seminar, setSeminar] = useState('all')
  const [kind, setKind] = useState('all')
  const [status, setStatus] = useState('all')
  const [rows, setRows] = useState(PROMOS)
  const [form, setForm] = useState(blank)
  const [err, setErr] = useState({})
  const [showForm, setShowForm] = useState(true)

  const filtered = useMemo(() => {
    const s = `${query} ${q}`.trim().toLowerCase()
    return rows.filter((p) => {
      if (tab !== 'all' && p.status !== tab) return false
      if (status !== 'all' && p.status !== status) return false
      if (kind !== 'all' && p.kind !== kind) return false
      if (s && !`${p.code} ${p.name}`.toLowerCase().includes(s)) return false
      return true
    })
  }, [rows, query, q, tab, status, kind])
  const pager = usePager(filtered, 10)
  const counts = { all: rows.length, faol: rows.filter((p) => p.status === 'faol').length, yakun: rows.filter((p) => p.status === 'yakun').length, reja: rows.filter((p) => p.status === 'reja').length, nofaol: rows.filter((p) => p.status === 'nofaol').length }
  const previewCode = form.code.trim() || 'STOMAHUB20'
  const previewValue = form.value || '20'

  const save = () => {
    const e = {}
    if (form.name.trim().length < 2) e.name = 'Promo-kod nomini kiriting'
    if (!/^[A-Z0-9]{4,16}$/.test(form.code.trim().toUpperCase())) e.code = '4–16 ta lotin harf yoki raqam'
    const value = Number(form.value)
    if (!value || value <= 0) e.value = 'Chegirma miqdorini kiriting'
    if (form.kind === 'foiz' && value > 100) e.value = 'Foiz 100 dan oshmasin'
    if (!form.from || !form.to) e.date = 'Muddatni tanlang'
    if (form.from && form.to && form.from > form.to) e.date = 'Tugash sanasi boshlanishidan keyin bo‘lsin'
    setErr(e)
    if (Object.keys(e).length) return
    const row = {
      id: Date.now(),
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      kind: form.kind,
      value,
      used: 0,
      limit: form.endless || !form.limit ? 999 : Number(form.limit),
      from: form.from,
      to: form.to,
      status: 'faol',
    }
    setRows((list) => [row, ...list])
    setForm(blank)
    notify('Promo-kod saqlandi')
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold">Promo-kodlar</h1>
          <p className="mt-0.5 max-w-xl text-[13px] text-[#6e868c]">Seminarlarga chegirmalar va maxsus takliflar yaratish, boshqarish va natijalarni kuzatish</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-[#e6f1ef] bg-white px-3 py-2">
          <img src={SEMINARS[0].image} alt="" className="h-8 w-12 rounded object-cover" />
          <div className="text-[12px]"><p className="font-semibold">{SEMINARS[0].title}</p><p className="text-[#8aa0a4]">{SEMINARS[0].date}, 10:00</p></div>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-[#e6f1ef] bg-white p-4"><p className="text-[12px] text-[#6e868c]">Jami promo-kodlar</p><p className="text-[22px] font-bold">{rows.length}</p><p className="text-[12px] font-semibold text-[#16a34a]">+3 bu oy</p></article>
        <article className="flex items-center justify-between rounded-2xl border border-[#e6f1ef] bg-white p-4"><div><p className="text-[12px] text-[#6e868c]">Foydalanilgan</p><p className="text-[22px] font-bold">286</p></div><Ring /></article>
        <article className="rounded-2xl border border-[#e6f1ef] bg-white p-4"><p className="text-[12px] text-[#6e868c]">Umumiy chegirma</p><p className="text-[20px] font-bold">14 300 000 so‘m</p></article>
        <article className="rounded-2xl border border-[#e6f1ef] bg-white p-4"><p className="text-[12px] text-[#6e868c]">Qo‘shimcha tushum</p><p className="text-[20px] font-bold">42 800 000 so‘m</p><p className="text-[12px] font-semibold text-[#16a34a]">↑ +28%</p></article>
      </section>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <Tabs tabs={[
          { id: 'all', label: `Barchasi (${counts.all})` },
          { id: 'faol', label: `Faol (${counts.faol})` },
          { id: 'yakun', label: `Yakunlangan (${counts.yakun})` },
          { id: 'reja', label: `Rejalashtirilgan (${counts.reja})` },
          { id: 'nofaol', label: `Nofaol (${counts.nofaol})` },
        ]} value={tab} onChange={setTab} />
        <Btn onClick={() => setShowForm(true)}><Plus className="size-4" /> Yangi promo-kod yaratish</Btn>
      </div>

      <div className="org-with-side mt-3">
        <Card pad={false}>
          <div className="flex flex-wrap gap-2 p-3">
            <SearchBox value={q} onChange={setQ} placeholder="Promo-kod nomi yoki kodi bo‘yicha qidiring..." className="min-w-[200px] flex-1" />
            <Select value={seminar} onChange={setSeminar} className="w-[160px]" options={[{ value: 'all', label: 'Barcha seminarlar' }, ...SEMINARS.slice(0, 4).map((s) => ({ value: s.id, label: s.topic }))]} />
            <Select value={kind} onChange={setKind} className="w-[130px]" options={[{ value: 'all', label: 'Barcha turlar' }, { value: 'foiz', label: 'Foiz' }, { value: 'summa', label: 'Summa' }]} />
            <Select value={status} onChange={setStatus} className="w-[150px]" options={[{ value: 'all', label: 'Barcha holatlar' }, ...Object.entries(PROMO_STATUS).map(([value, label]) => ({ value, label }))]} />
            <Btn kind="soft" onClick={() => { setQ(''); setKind('all'); setStatus('all'); setTab('all') }}>Filtrlar</Btn>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead><tr className="border-y border-[#eef3f2] text-[12px] text-[#8aa0a4]">{['#', 'Promo-kod', 'Turi', 'Chegirma', 'Foydalanilgan / Limit', 'Amal muddati', 'Holat', ''].map((h) => <th key={h} className="px-3 py-2.5 font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {pager.slice.map((p, i) => (
                  <tr key={p.id} className="border-b border-[#f3f7f6]">
                    <td className="px-3 py-2.5 text-[12px] text-[#8aa0a4]">{pager.from + i}</td>
                    <td className="px-3 py-2.5 text-[13px] font-bold">{p.code}</td>
                    <td className="px-3 py-2.5"><Badge tone="pink">{p.kind === 'foiz' ? 'Foiz' : 'Summa'}</Badge></td>
                    <td className={`px-3 py-2.5 text-[13px] font-semibold ${p.kind === 'foiz' ? 'text-[#0c8f86]' : 'text-[#e11d48]'}`}>{p.kind === 'foiz' ? `${p.value}%` : som(p.value)}</td>
                    <td className="px-3 py-2.5">
                      <p className="text-[12.5px]">{p.used} / {p.limit}</p>
                      <div className="mt-1 h-1 w-24 overflow-hidden rounded-full bg-[#e7f1ef]"><div className="h-full bg-[#14a394]" style={{ width: `${Math.min(100, (p.used / p.limit) * 100)}%` }} /></div>
                    </td>
                    <td className="px-3 py-2.5 text-[12px] text-[#5e787e]">{p.from} — {p.to}</td>
                    <td className="px-3 py-2.5"><Badge tone={TONE[p.status]} dot>{PROMO_STATUS[p.status]}</Badge></td>
                    <td className="px-2"><MenuBtn items={[
                      { label: 'Nusxalash', onClick: () => { setRows((list) => [{ ...p, id: Date.now(), code: `${p.code}2`, used: 0 }, ...list]); notify('Nusxa yaratildi') } },
                      { label: p.status === 'nofaol' ? 'Faollashtirish' : 'Nofaol qilish', onClick: () => setRows((list) => list.map((x) => x.id === p.id ? { ...x, status: x.status === 'nofaol' ? 'faol' : 'nofaol' } : x)) },
                    ]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pager.total === 0 && <Empty text="Promo-kod topilmadi" />}
            <Pager {...pager} onPage={pager.setPage} onPer={pager.setPer} />
          </div>
        </Card>

        {showForm && (
          <Card title="Yangi promo-kod yaratish" extra={<button type="button" aria-label="Yopish" onClick={() => setShowForm(false)} className="text-[#8aa0a4]">✕</button>}>
            <div className="space-y-3">
              <Field label="Promo-kod nomi" req error={err.name}><input className={inputCls(err.name)} value={form.name} placeholder="Masalan: Student chegirmasi" onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
              <Field label="Promo-kod" req error={err.code}><input className={inputCls(err.code)} value={form.code} placeholder="Masalan: STUDENT50" onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} /></Field>
              <div>
                <p className="mb-1.5 text-[12.5px] font-medium">Chegirma turi</p>
                <div className="flex gap-3 text-[13px]">
                  <label className="inline-flex items-center gap-1.5"><input type="radio" checked={form.kind === 'foiz'} onChange={() => setForm({ ...form, kind: 'foiz' })} /> Foiz (%)</label>
                  <label className="inline-flex items-center gap-1.5"><input type="radio" checked={form.kind === 'summa'} onChange={() => setForm({ ...form, kind: 'summa' })} /> Summa (so‘m)</label>
                </div>
              </div>
              <Field label="Chegirma miqdori" req error={err.value}>
                <div className="flex items-center gap-2"><input className={inputCls(err.value)} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value.replace(/[^\d]/g, '') })} /><span className="text-[13px] text-[#6e868c]">{form.kind === 'foiz' ? '%' : 'so‘m'}</span></div>
              </Field>
              <div className="flex items-center justify-between"><span className="text-[12.5px]">Foydalanish limiti <span className="text-[#8aa0a4]">Cheksiz (ixtiyoriy)</span></span><Toggle on={form.endless} onChange={(v) => setForm({ ...form, endless: v })} label="Cheksiz" /></div>
              {!form.endless && <input className={inputCls()} placeholder="Masalan: 100" value={form.limit} onChange={(e) => setForm({ ...form, limit: e.target.value.replace(/[^\d]/g, '') })} />}
              <Field label="Amal qilish muddati" req error={err.date}>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" className={inputCls()} value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} />
                  <input type="date" className={inputCls()} value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} />
                </div>
              </Field>
              <div className="flex items-center justify-between text-[12.5px]"><span>Faqat ma’lum chipta turiga</span><Toggle on={form.onlyTicket} onChange={(v) => setForm({ ...form, onlyTicket: v })} label="Chipta turi" /></div>
              <Btn className="w-full" onClick={save}>Saqlash</Btn>
            </div>
            <div className="mt-4">
              <p className="mb-2 text-[12.5px] font-semibold">Promo-kod ko‘rinishi (oldindan)</p>
              <div className="flex items-center justify-between rounded-xl bg-[linear-gradient(90deg,#073f45,#0e8f84)] p-3 text-white">
                <div>
                  <p className="text-[16px] font-bold tracking-wide">{previewCode}</p>
                  <p className="text-[12px]">{form.kind === 'foiz' ? `${previewValue}% chegirma` : `${previewValue} so‘m chegirma`}</p>
                  <p className="text-[11px] text-white/70">{form.onlyTicket ? 'Tanlangan chipta' : 'Barcha chipta turlari uchun'}</p>
                </div>
                <Gift className="size-8 text-white/80" />
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

function Ring() {
  return (
    <div className="relative grid size-14 place-items-center">
      <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(#12a394 0 72%, #e7f1ef 72% 100%)' }} />
      <div className="absolute inset-1.5 grid place-items-center rounded-full bg-white text-[12px] font-bold">72%</div>
    </div>
  )
}
