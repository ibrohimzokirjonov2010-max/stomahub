import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Crown, Download, Gem, GraduationCap, Link2, Pencil, Plus, QrCode, ShoppingCart, Tag, Ticket, TrendingDown, TrendingUp, Users, Wallet } from 'lucide-react'
import { SALES_TICKETS, SEMINARS, TICKET_BARS, TICKET_TYPES, som } from '../data'
import { useOrg } from '../Shell'
import { Badge, BarChart, Btn, Card, Donut, Field, Kpi, MenuBtn, Modal, Tabs, TicketPreview, Toggle, inputCls } from '../ui'

const ICONS = { crown: Crown, gem: Gem, cap: GraduationCap, users: Users }

export default function Tickets() {
  const { notify } = useOrg()
  const sem = SEMINARS[0]
  const [tab, setTab] = useState('types')
  const [rows, setRows] = useState(TICKET_TYPES)
  const [open, setOpen] = useState(false)
  const [promo, setPromo] = useState(false)
  const [design, setDesign] = useState(false)
  const [metric, setMetric] = useState('Sotilgan chiptalar')

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-[12px] text-[#8aa0a4]"><Link to="/tashkilotchi" className="hover:text-[#0c8f86]">Boshqaruv paneli</Link> <span className="px-1">›</span> <Link to="/tashkilotchi/seminarlar" className="hover:text-[#0c8f86]">Mening seminarlarim</Link> <span className="px-1">›</span> Chiptalar</p>
          <h1 className="text-[22px] font-bold">Chiptalar</h1>
          <p className="mt-0.5 text-[13px] text-[#6e868c]">Chipta turlarini yarating, narxlarini boshqaring va sotuvlarni kuzating</p>
        </div>
        <Btn onClick={() => setOpen(true)}><Plus className="size-4" /> Yangi chipta turi</Btn>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e6f1ef] bg-white px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <img src={sem.image} alt="" className="h-12 w-16 rounded-lg object-cover" />
          <div>
            <p className="font-bold">{sem.title}</p>
            <p className="text-[12px] text-[#7e9398]">{sem.date} · {sem.city} · <Badge tone="outline">Offline</Badge></p>
          </div>
        </div>
        <Btn kind="ghost" to="/tashkilotchi/seminarlar/yangi">Seminarni o‘zgartirish</Btn>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Ticket} label="Jami chiptalar" value="1 240" delta="+18%" hint="o‘tgan oyga nisbatan" />
        <Kpi icon={ShoppingCart} label="Sotilgan chiptalar" value="980" delta="+25%" hint="o‘tgan oyga nisbatan" />
        <Kpi icon={Wallet} label="Umumiy tushum" value="45 600 000 so‘m" delta="+32%" hint="o‘tgan oyga nisbatan" />
        <Kpi icon={Ticket} label="Qolgan chiptalar" value="260" delta="-18%" down hint="o‘tgan oyga nisbatan" />
      </section>

      <div className="mt-4"><Tabs tabs={[{ id: 'types', label: 'Chipta turlari (4)' }, { id: 'sales', label: 'Sotuvlar' }, { id: 'promo', label: 'Chegirma va promo-kodlar' }, { id: 'qr', label: 'QR kodlar' }, { id: 'settings', label: 'Sozlamalar' }]} value={tab} onChange={setTab} /></div>

      {tab === 'types' && (
        <div className="mt-3 grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-3">
          <Card pad={false} title="Chipta turlari" extra={<span className="text-[12px] font-normal text-[#8aa0a4]">Seminar uchun turli chipta turlarini yarating va boshqaring</span>}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead><tr className="border-y border-[#eef3f2] text-[12px] text-[#8aa0a4]">{['#', 'Nom', 'Narx', 'Soni', 'Sotilgan', 'Qolgan', 'Holat', 'Amallar'].map((h) => <th key={h} className="px-3 py-2.5 font-medium">{h}</th>)}</tr></thead>
                <tbody>
                  {rows.map((t, i) => {
                    const Icon = ICONS[t.icon] || Ticket
                    return (
                      <tr key={t.id} className="border-b border-[#f3f7f6]">
                        <td className="px-3 py-3 text-[12.5px] text-[#7e9398]">{i + 1}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-start gap-2">
                            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#e7f7f4] text-[#0c8f86]"><Icon className="size-4" /></span>
                            <div><p className="text-[13px] font-semibold">{t.name}</p><p className="text-[11.5px] text-[#8aa0a4]">{t.note}</p></div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-[13px] font-semibold">{som(t.price)}</td>
                        <td className="px-3 py-3 text-[13px]">{t.total}</td>
                        <td className="px-3 py-3 text-[13px]">{t.sold}</td>
                        <td className="px-3 py-3 text-[13px]">{t.left}</td>
                        <td className="px-3 py-3"><Badge tone={t.active ? 'green' : 'slate'} dot>{t.active ? 'Faol' : 'Nofaol'}</Badge></td>
                        <td className="px-3 py-3"><span className="inline-flex items-center gap-1"><button type="button" aria-label="Tahrirlash" onClick={() => setOpen(true)} className="grid size-8 place-items-center text-[#0c8f86]"><Pencil className="size-4" /></button><MenuBtn items={[{ label: t.active ? 'Nofaol qilish' : 'Faol qilish', onClick: () => setRows((list) => list.map((x) => x.id === t.id ? { ...x, active: !x.active } : x)) }, { label: 'O‘chirish', danger: true, onClick: () => setRows((list) => list.filter((x) => x.id !== t.id)) }]} /></span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
          <div className="grid gap-3 lg:grid-cols-2">
            <Card title="Chipta sotuvlari dinamikasi" extra={<select value={metric} onChange={(e) => setMetric(e.target.value)} className="h-8 rounded-lg border border-[#e6eeec] px-2 text-[12px]"><option>Sotilgan chiptalar</option><option>Tushum</option></select>}>
              <BarChart values={metric === 'Tushum' ? TICKET_BARS.map((n) => Math.round(n * 0.7)) : TICKET_BARS} max={200} />
            </Card>
            <Card title="Chipta turlari bo‘yicha sotuv"><Donut parts={SALES_TICKETS} center="980" sub="chipta" /></Card>
          </div>
          </div>
          <div className="space-y-3">
          <Card title="Chipta ko‘rinishi (namuna)" extra={<button type="button" onClick={() => setDesign(true)} className="text-[12.5px] font-semibold text-[#0c8f86]">Dizaynni sozlash</button>}>
            <TicketPreview />
            <Btn className="mt-3 w-full" onClick={() => notify('QR kod yuklab olindi')}><Download className="size-4" /> QR kodni yuklab olish</Btn>
          </Card>
          <Card title="Tezkor amallar">
            <div className="grid grid-cols-2 gap-2">
              <Quick icon={QrCode} label="QR kodlar yaratish" onClick={() => { setTab('qr'); notify('QR kodlar yaratildi') }} />
              <Quick icon={Download} label="Excel yuklab olish" onClick={() => notify('Excel yuklab olindi')} />
              <Quick icon={Tag} label="Promo-kod qo‘shish" onClick={() => setPromo(true)} />
              <Quick icon={Link2} label="Chipta linkini ulashish" onClick={() => notify('Havola nusxalandi')} />
            </div>
          </Card>
          </div>
        </div>
      )}

      {tab === 'sales' && <Sales metric={metric} setMetric={setMetric} />}
      {tab === 'promo' && (
        <Card className="mt-3" title="Chegirma va promo-kodlar">
          <p className="text-[13px] text-[#5e787e]">Promo-kodlar alohida sahifada boshqariladi.</p>
          <Btn className="mt-3" to="/tashkilotchi/promo">Promo-kodlarga o‘tish</Btn>
        </Card>
      )}
      {tab === 'qr' && (
        <Card className="mt-3" title="QR kodlar">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {rows.map((t) => (
              <button key={t.id} type="button" onClick={() => notify(`${t.name} QR yuklab olindi`)} className="rounded-xl border border-[#e6f1ef] p-3 text-center hover:bg-[#f6fbfa]">
                <p className="mb-2 text-[12.5px] font-semibold">{t.name}</p>
                <div className="mx-auto w-fit rounded bg-white"><span className="text-[11px] text-[#8aa0a4]">{t.sold} ta kod</span></div>
              </button>
            ))}
          </div>
        </Card>
      )}
      {tab === 'settings' && <TicketSettings notify={notify} />}

      {tab === 'sales' && (
        <Card className="mt-3" title="Tezkor amallar">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Quick icon={QrCode} label="QR kodlar yaratish" onClick={() => { setTab('qr'); notify('QR kodlar yaratildi') }} />
            <Quick icon={Download} label="Excel yuklab olish" onClick={() => notify('Excel yuklab olindi')} />
            <Quick icon={Tag} label="Promo-kod qo‘shish" onClick={() => setPromo(true)} />
            <Quick icon={Link2} label="Chipta linkini ulashish" onClick={() => notify('Havola nusxalandi')} />
          </div>
        </Card>
      )}

      <TicketModal open={open} onClose={() => setOpen(false)} onSave={(row) => { setRows((list) => [...list, row]); setOpen(false); notify('Chipta turi saqlandi') }} />
      <Modal open={promo} title="Promo-kod qo‘shish" onClose={() => setPromo(false)}>
        <Field label="Promo-kod" req><input className={inputCls()} placeholder="EARLYBIRD" /></Field>
        <div className="mt-4 flex justify-end gap-2"><Btn kind="soft" onClick={() => setPromo(false)}>Bekor qilish</Btn><Btn onClick={() => { setPromo(false); notify('Promo-kod qo‘shildi') }}>Saqlash</Btn></div>
      </Modal>
      <Modal open={design} title="Dizaynni sozlash" onClose={() => setDesign(false)}>
        <p className="text-[13px] text-[#5e787e]">Chipta foni hozircha StomaHub teal uslubida. O‘z rasmingizni keyingi qadamda yuklaysiz.</p>
        <Btn className="mt-4" onClick={() => setDesign(false)}>Tayyor</Btn>
      </Modal>
    </div>
  )
}

function Sales({ metric, setMetric }) {
  return (
    <div className="mt-3 grid gap-3 lg:grid-cols-2">
      <Card title="Chipta sotuvlari dinamikasi" extra={<select value={metric} onChange={(e) => setMetric(e.target.value)} className="h-8 rounded-lg border border-[#e6eeec] px-2 text-[12px]"><option>Sotilgan chiptalar</option><option>Tushum</option></select>}>
        <BarChart values={TICKET_BARS} max={200} />
      </Card>
      <Card title="Chipta turlari bo‘yicha sotuv"><Donut parts={SALES_TICKETS} center="980" sub="chipta" /></Card>
    </div>
  )
}

function TicketSettings({ notify }) {
  const [on, setOn] = useState(true)
  return (
    <Card className="mt-3" title="Chipta sozlamalari">
      <div className="flex items-center justify-between gap-3 py-2"><div><p className="text-[13px] font-semibold">Sotuvni ochiq qoldirish</p><p className="text-[12px] text-[#7e9398]">Joylar tugaguncha yangi buyurtma qabul qilinadi</p></div><Toggle on={on} onChange={setOn} label="Sotuv" /></div>
      <Btn className="mt-3" onClick={() => notify('Sozlamalar saqlandi')}>Saqlash</Btn>
    </Card>
  )
}

function Quick({ icon: Icon, label, onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-2 rounded-xl px-2 py-3 hover:bg-[#f4fbfb]">
      <span className="grid size-10 place-items-center rounded-xl bg-[#e7f7f4] text-[#0c8f86]"><Icon className="size-4" /></span>
      <span className="text-center text-[11.5px] font-medium leading-tight">{label}</span>
    </button>
  )
}

function TicketModal({ open, onClose, onSave }) {
  const blank = { name: 'VIP', price: '850 000', seats: '30', note: 'Seminarga kirish, maxsus materiallar, oldingi qator o‘rinlar, kofe-breyk, sertifikat, ma’ruzachilar bilan foto', color: '#0c8f86', active: true }
  const [f, setF] = useState(blank)
  const [err, setErr] = useState({})
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = () => {
    const e = {}
    if (!f.name.trim()) e.name = 'Nomni kiriting'
    const price = Number(String(f.price).replace(/\s/g, ''))
    const seats = Number(f.seats)
    if (!price) e.price = 'Narxni kiriting'
    if (!seats) e.seats = 'Joylar sonini kiriting'
    setErr(e)
    if (Object.keys(e).length) return
    onSave({ id: Date.now(), name: f.name, icon: 'crown', note: f.note, price, total: seats, sold: 0, left: seats, active: f.active, perks: f.note.split(',').map((x) => x.trim()) })
    setF(blank)
  }
  const colors = ['#0c8f86', '#12a394', '#3b82f6', '#8b5cf6', '#f59e0b', '#e11d48']
  return (
    <Modal open={open} title="Yangi chipta turi qo‘shish" onClose={onClose} width={420}>
      <div className="space-y-3">
        <Field label="Chipta turi nomi" req error={err.name}><input className={inputCls(err.name)} value={f.name} onChange={set('name')} /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Narx" req error={err.price}><input className={inputCls(err.price)} value={f.price} onChange={set('price')} /></Field>
          <Field label="Joylar soni" req error={err.seats}><input className={inputCls(err.seats)} value={f.seats} onChange={set('seats')} /></Field>
        </div>
        <Field label="Tavsif" hint={`${f.note.length}/500`}><textarea maxLength={500} className={`${inputCls()} h-20 py-2`} value={f.note} onChange={set('note')} /></Field>
        <div>
          <p className="mb-1.5 text-[12.5px] font-medium">Rang</p>
          <div className="flex gap-2">{colors.map((c) => <button key={c} type="button" aria-label={c} onClick={() => setF({ ...f, color: c })} className="size-6 rounded-full ring-offset-2" style={{ background: c, boxShadow: f.color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : '' }} />)}</div>
        </div>
        <div className="flex items-center justify-between"><span className="text-[12.5px] font-medium">Holat · Faol</span><Toggle on={f.active} onChange={(v) => setF({ ...f, active: v })} label="Faol" /></div>
        <div className="flex justify-end gap-2 pt-1"><Btn kind="soft" onClick={onClose}>Bekor qilish</Btn><Btn onClick={save}>Saqlash</Btn></div>
      </div>
    </Modal>
  )
}
