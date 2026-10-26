import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar, Check, ChevronDown, Crown, Download, Gem, GraduationCap, House, Link2, MapPin,
  Pencil, Plus, QrCode, ShoppingCart, Tag, Ticket, Users, Wallet,
} from 'lucide-react'
import { MONTHS, som } from '../data'
import { downloadText, newestSeminar, saveTickets, upsertPromo, useHub } from '../../hubStore'
import { useOrg } from '../Shell'
import { Btn, Field, MenuBtn, Modal, QrMark, Toggle, inputCls } from '../ui'
import { useMobile } from '../../useMobile'
import { ToothIcon } from '../../components/icons'

const cx = (...a) => a.filter(Boolean).join(' ')

const TYPE_STYLE = {
  crown: { icon: Crown, bg: '#fff4d6', color: '#e2a008' },
  gem: { icon: Gem, bg: '#e7f0ff', color: '#3b82f6' },
  cap: { icon: GraduationCap, bg: '#f3e8ff', color: '#8b5cf6' },
  users: { icon: Users, bg: '#fdecee', color: '#ef6b6b' },
}

const DONUT = [
  { label: 'VIP', pct: 41, n: 400, color: '#0e8b82' },
  { label: 'Standart', pct: 43, n: 420, color: '#3ec9bb' },
  { label: 'Student', pct: 12, n: 120, color: '#f0b42a' },
  { label: 'Guruh', pct: 4, n: 40, color: '#f07268' },
]

const BARS = [18, 32, 44, 56, 72, 86, 102, 120, 138, 156, 176, 196]

const MOBILE_SEED = [
  {
    id: 'oddiy',
    name: 'Oddiy',
    price: 300000,
    perks: ['Seminarga kirish', 'Qahva-breyk', 'Ishtirok sertifikati'],
    sold: 28,
    total: 30,
    image: '/images/organizer/ticket-hall.jpg',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 500000,
    perks: ['Seminarga kirish', 'Qahva-breyk', 'Ishtirok sertifikati', 'Print materiallar', 'Oldingi qatorda joy'],
    sold: 14,
    total: 15,
    image: '/images/organizer/ticket-premium.jpg',
  },
  {
    id: 'vip',
    name: 'VIP',
    price: 1000000,
    perks: ['Seminarga kirish', 'Qahva-breyk', 'Ishtirok sertifikati', 'Print materiallar', 'Oldingi qatorda joy', 'Ma’ruzachi bilan foto'],
    sold: 0,
    total: 5,
    image: '/images/organizer/ticket-vip-table.jpg',
  },
]

const PILL_TABS = [
  { id: 'types', label: 'Chipta turlari (4)' },
  { id: 'sales', label: 'Sotuvlar' },
  { id: 'promo', label: 'Chegirma va promo-kodlar' },
  { id: 'qr', label: 'QR kodlar' },
  { id: 'settings', label: 'Sozlamalar' },
]

export default function Tickets() {
  const mobile = useMobile()
  if (mobile) return <MobileTickets />
  return <DesktopTickets />
}

function useSeminarPick() {
  const hub = useHub()
  const list = hub.seminars
  const [sid, setSid] = useState(() => newestSeminar(list)?.id || '')
  useEffect(() => {
    if (!list.some((s) => s.id === sid)) setSid(newestSeminar(list)?.id || '')
  }, [list, sid])
  const sem = list.find((s) => s.id === sid) || newestSeminar(list)
  return { list, sid, setSid, sem }
}

function DesktopTickets() {
  const { notify, query } = useOrg()
  const { list, sid, setSid, sem } = useSeminarPick()
  const [tab, setTab] = useState('types')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [promo, setPromo] = useState(false)
  const [design, setDesign] = useState(false)
  const [metric, setMetric] = useState('Sotilgan chiptalar')
  const all = sem?.tickets || []
  const q = (query || '').trim().toLowerCase()
  const rows = all.filter((t) => !q || `${t.name} ${t.note || ''}`.toLowerCase().includes(q))
  const seats = all.reduce((n, t) => n + (Number(t.total || t.seats) || 0), 0)
  const sold = all.reduce((n, t) => n + (Number(t.sold) || 0), 0)
  const revenue = all.reduce((n, t) => n + (Number(t.sold) || 0) * (Number(t.price) || 0), 0)
  const left = Math.max(0, seats - sold)

  const commit = (next) => { if (sem) saveTickets(sem.id, next) }
  const saveRow = (row) => {
    const idx = all.findIndex((x) => x.id === row.id)
    const mapped = { ...row, seats: row.total, total: row.total }
    commit(idx === -1 ? [...all, mapped] : all.map((x) => (x.id === row.id ? { ...x, ...mapped } : x)))
    setOpen(false)
    setEditing(null)
    notify('Chipta turi saqlandi')
  }

  return (
    <div>
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold leading-tight tracking-tight text-[#143044]">Chiptalar</h1>
          <p className="mt-1 text-[13px] leading-snug text-[#6e868c]">Chipta turlarini yarating, narxlarini boshqaring va sotuvlarni kuzating</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <p className="whitespace-nowrap text-[12px] text-[#8aa0a4]">
            <Link to="/tashkilotchi" className="text-[var(--color-org-teal)] hover:underline">Boshqaruv paneli</Link>
            <span className="px-1.5 text-[#b7c6c8]">›</span>
            <Link to="/tashkilotchi/seminarlar" className="text-[var(--color-org-teal)] hover:underline">Mening seminarlarim</Link>
            <span className="px-1.5 text-[#b7c6c8]">›</span>
            <span className="text-[#5e787e]">Chiptalar</span>
          </p>
          <Btn onClick={() => { setEditing(null); setOpen(true) }}><Plus className="size-4" /> Yangi chipta turi</Btn>
        </div>
      </div>

      <section className="flex items-center justify-between gap-3 rounded-2xl border border-[#e6f1ef] bg-white px-3.5 py-2.5 shadow-[0_1px_2px_rgb(16_40_40/0.03)]">
        <div className="flex min-w-0 items-center gap-3">
          <img src={sem?.image || '/images/organizer/ticket-implant.jpg'} alt="" className="h-14 w-[72px] shrink-0 rounded-xl object-cover object-center" />
          <div className="min-w-0">
            <label className="block text-[11px] text-[#8aa0a4]">Seminar
              <select value={sid} onChange={(e) => setSid(e.target.value)} className="mt-0.5 block h-7 max-w-[280px] truncate rounded-lg border border-[#e4eeec] bg-white px-2 text-[13px] font-bold text-[#143044]">
                {list.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </label>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-[#5e787e]">
              <span className="inline-flex items-center gap-1"><Calendar className="size-3.5 text-[var(--color-org-teal)]" /> {sem?.date}</span>
              <span className="inline-flex items-center gap-1"><MapPin className="size-3.5 text-[var(--color-org-teal)]" /> {sem?.city}</span>
              <span className="inline-flex h-5 items-center rounded-full border border-[#b7e3da] bg-[#f3fbfa] px-2 text-[11px] font-semibold text-[var(--color-org-teal)]">{sem?.format || 'Offline'}</span>
            </p>
          </div>
        </div>
        <Btn kind="ghost" to={`/tashkilotchi/seminarlar/yangi?tahrir=${sem?.id || ''}`} className="h-9 shrink-0 px-3">Seminarni o‘zgartirish</Btn>
      </section>

      <section className="mt-3 grid grid-cols-4 gap-3">
        <Kpi icon={Ticket} label="Jami chiptalar" value={String(seats)} delta="" />
        <Kpi icon={ShoppingCart} label="Sotilgan chiptalar" value={String(sold)} delta="" />
        <Kpi icon={Wallet} label="Umumiy tushum" value={som(revenue)} delta="" />
        <Kpi icon={Ticket} label="Qolgan chiptalar" value={String(left)} delta="" />
      </section>

      <div className="mt-3.5 flex flex-wrap gap-2">
        {PILL_TABS.map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)} className={cx('h-9 rounded-full px-3.5 text-[12.5px] font-semibold', tab === t.id ? 'bg-[var(--color-org-teal)] text-white' : 'border border-[#e4eeec] bg-white text-[#3e5a62] hover:bg-[#f6fbfa]')}>
            {t.id === 'types' ? `Chipta turlari (${rows.length})` : t.label}
          </button>
        ))}
      </div>

      {tab === 'types' && (
        <div className="mt-3 grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-3">
            <Panel title="Chipta turlari" sub="Seminar uchun turli chipta turlarini yarating va boshqaring" flush>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left">
                  <thead>
                    <tr className="border-y border-[#eef4f3] text-[12px] text-[#93a6ab]">
                      {['#', 'Nom', 'Narx', 'Soni', 'Sotilgan', 'Qolgan', 'Holat', 'Amallar'].map((h) => (
                        <th key={h} className={cx('px-3 py-2.5 font-medium', h === 'Narx' && 'whitespace-nowrap')}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((t, i) => {
                      const style = TYPE_STYLE[t.icon] || TYPE_STYLE.crown
                      const Icon = style.icon
                      return (
                        <tr key={t.id} className="border-b border-[#f2f7f6] last:border-0">
                          <td className="px-3 py-3 text-[12.5px] text-[#8aa0a4]">{i + 1}</td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2.5">
                              <span className="grid size-8 shrink-0 place-items-center rounded-[10px]" style={{ background: style.bg, color: style.color }}>
                                <Icon className="size-4" strokeWidth={1.8} />
                              </span>
                              <div className="min-w-0">
                                <p className="text-[13px] font-semibold leading-tight text-[#143044]">{t.name}</p>
                                <p className="mt-0.5 max-w-[220px] text-[11.5px] leading-snug text-[#8aa0a4]">{t.note}</p>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-[13px] font-semibold text-[#143044]">{som(t.price)}</td>
                          <td className="px-3 py-3 text-[13px] text-[#143044]">{t.total}</td>
                          <td className="px-3 py-3 text-[13px] text-[#143044]">{t.sold}</td>
                          <td className="px-3 py-3 text-[13px] text-[#143044]">{t.left}</td>
                          <td className="px-3 py-3">
                            <span className={cx('inline-flex h-[22px] items-center gap-1 rounded-full px-2 text-[11.5px] font-semibold', t.active ? 'bg-[#e7f8ee] text-[#16a34a]' : 'bg-[#eef2f3] text-[#5f7278]')}>
                              <span className={cx('size-1.5 rounded-full', t.active ? 'bg-[#16a34a]' : 'bg-[#94a3a8]')} />
                              {t.active ? 'Faol' : 'Nofaol'}
                            </span>
                          </td>
                          <td className="px-2 py-3">
                            <span className="inline-flex items-center">
                              <button type="button" aria-label="Tahrirlash" onClick={() => { setEditing(t); setOpen(true) }} className="grid size-8 place-items-center text-[var(--color-org-teal)]"><Pencil className="size-4" /></button>
                              <MenuBtn items={[
                                { label: t.active ? 'Nofaol qilish' : 'Faol qilish', onClick: () => commit(all.map((x) => x.id === t.id ? { ...x, active: !x.active } : x)) },
                                { label: 'O‘chirish', danger: true, onClick: () => commit(all.filter((x) => x.id !== t.id)) },
                              ]} />
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                    {!rows.length && (
                      <tr><td colSpan={8} className="px-3 py-8 text-center text-[13px] text-[#7e9398]">Chipta turi yo‘q</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>

            <div className="grid items-stretch gap-3 lg:grid-cols-2">
              <Panel title="Chipta sotuvlari dinamikasi" extra={<MetricSelect value={metric} onChange={setMetric} />} className="h-full">
                <SalesBars values={metric === 'Tushum' ? BARS.map((n) => Math.round(n * 0.72)) : BARS} />
              </Panel>
              <Panel title="Chipta turlari bo‘yicha sotuv" className="h-full">
                <SalesDonut rows={all} />
              </Panel>
            </div>
          </div>

          <div className="space-y-3">
            <Panel title="Chipta ko‘rinishi (namuna)" extra={<button type="button" onClick={() => setDesign(true)} className="text-[12.5px] font-semibold text-[var(--color-org-teal)]">Dizaynni sozlash</button>}>
              <VipTicket />
              <Btn className="mt-3 w-full" onClick={() => { downloadText('qr-chiptalar.txt', all.map((t) => `${t.name} · ${t.sold || 0} ta · ${sem?.title || ''}`).join('\n')); notify('QR kod yuklab olindi') }}><Download className="size-4" /> QR kodni yuklab olish</Btn>
            </Panel>
            <Panel title="Tezkor amallar">
              <QuickGrid notify={notify} rows={all} shareId={sem?.id} onQr={() => { setTab('qr'); notify('QR kodlar yaratildi') }} onPromo={() => setPromo(true)} />
            </Panel>
          </div>
        </div>
      )}

      {tab === 'sales' && (
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <Panel title="Chipta sotuvlari dinamikasi" extra={<MetricSelect value={metric} onChange={setMetric} />}>
            <SalesBars values={BARS} />
          </Panel>
          <Panel title="Chipta turlari bo‘yicha sotuv"><SalesDonut rows={all} /></Panel>
        </div>
      )}

      {tab === 'promo' && (
        <Panel title="Chegirma va promo-kodlar" className="mt-3">
          <p className="text-[13px] text-[#5e787e]">Promo-kodlar alohida sahifada boshqariladi.</p>
          <Btn className="mt-3" to="/tashkilotchi/promo">Promo-kodlarga o‘tish</Btn>
        </Panel>
      )}

      {tab === 'qr' && (
        <Panel title="QR kodlar" className="mt-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {rows.map((t) => (
              <button key={t.id} type="button" onClick={() => { downloadText(`${t.name}-qr.txt`, `${sem?.title || ''}\n${t.name}\n${t.sold || 0} ta kod`); notify(`${t.name} QR yuklab olindi`) }} className="rounded-xl border border-[#e6f1ef] p-3 text-center hover:bg-[#f6fbfa]">
                <p className="mb-2 text-[12.5px] font-semibold">{t.name}</p>
                <QrMark size={84} seed={t.id} />
                <p className="mt-1 text-[11px] text-[#8aa0a4]">{t.sold} ta kod</p>
              </button>
            ))}
          </div>
        </Panel>
      )}

      {tab === 'settings' && <TicketSettings notify={notify} />}

      <TicketModal open={open} initial={editing} onClose={() => { setOpen(false); setEditing(null) }} onSave={saveRow} />
      <PromoModal open={promo} onClose={() => setPromo(false)} onSave={(code) => { upsertPromo({ id: Date.now(), code, name: code, kind: 'foiz', value: 10, used: 0, limit: 100, from: 'bugun', to: 'ochiq', status: 'faol', seminar: sem?.id || 'all' }); setPromo(false); notify('Promo-kod qo‘shildi') }} />
      <Modal open={design} title="Dizaynni sozlash" onClose={() => setDesign(false)}>
        <p className="text-[13px] text-[#5e787e]">Chipta foni hozircha StomaHub teal uslubida. Tish va implant rasmi namuna chiptada ko‘rinadi.</p>
        <Btn className="mt-4" onClick={() => setDesign(false)}>Tayyor</Btn>
      </Modal>
    </div>
  )
}

function MobileTickets() {
  const { notify } = useOrg()
  const { list, sid, setSid, sem } = useSeminarPick()
  const all = (sem?.tickets || []).map((t) => ({
    ...t,
    total: t.total || t.seats || 0,
    perks: t.perks?.length ? t.perks : ['Seminarga kirish'],
    image: t.image || '/images/organizer/ticket-hall.jpg',
  }))
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const sold = all.reduce((s, t) => s + (t.sold || 0), 0)
  const total = all.reduce((s, t) => s + (t.total || 0), 0)
  const rows = all

  const save = (row) => {
    const idx = all.findIndex((x) => x.id === row.id)
    const mapped = {
      id: row.id,
      name: row.name,
      price: row.price,
      perks: row.perks?.length ? row.perks : ['Seminarga kirish'],
      sold: row.sold || 0,
      total: row.total,
      seats: row.total,
      left: Math.max(0, row.total - (row.sold || 0)),
      active: true,
      image: '/images/organizer/ticket-hall.jpg',
    }
    saveTickets(sem.id, idx === -1 ? [...all, mapped] : all.map((x) => (x.id === row.id ? { ...x, ...mapped } : x)))
    setOpen(false)
    setEditing(null)
    notify('Chipta turi saqlandi')
  }

  return (
    <div className="-mx-3 bg-white px-4 pb-8">
      <section className="flex gap-3 rounded-2xl border border-[#e7f1ef] bg-white p-2.5 shadow-[0_1px_2px_rgb(16_40_40/0.04)]">
        <img src={sem?.image || '/images/organizer/ticket-implant.jpg'} alt="" className="size-[72px] shrink-0 rounded-xl object-cover" />
        <div className="min-w-0 py-0.5">
          <select value={sid} onChange={(e) => setSid(e.target.value)} className="max-w-full bg-transparent text-[11.5px] text-[#8b93a7]">
            {list.map((s) => <option key={s.id} value={s.id}>{s.topic || s.title}</option>)}
          </select>
          <p className="text-[15px] font-bold leading-tight text-[#24185f]">{sem?.title}</p>
          <p className="mt-1 flex items-center gap-1 text-[11.5px] text-[#5e787e]"><Calendar className="size-3.5 shrink-0 text-[var(--color-org-teal)]" /> {sem?.date}{sem?.startTime ? `, ${sem.startTime}` : ''}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-[#5e787e]"><MapPin className="size-3.5 shrink-0 text-[var(--color-org-teal)]" /> {sem?.place || sem?.city}</p>
        </div>
      </section>

      <nav className="mt-3 flex items-center justify-between gap-1 px-0.5">
        <MobileTab to={`/tashkilotchi/seminarlar/${sem?.id || 'implant-nov'}`} icon={House} label="Umumiy" />
        <MobileTab to="/tashkilotchi/ishtirokchilar" icon={Users} label="Ishtirokchilar" />
        <MobileTab icon={Ticket} label="Chiptalar" active />
        <MobileTab to="/tashkilotchi/qr" icon={QrCode} label="Check-in" />
      </nav>

      <div className="mt-4">
        <h2 className="text-[18px] font-bold leading-tight text-[#143044]">Chipta turlari</h2>
        <p className="mt-0.5 text-[13px] text-[#8aa0a4]">
          Jami sotilgan: <span className="font-bold text-[#143044]">{sold}</span>
          <span> / {total}</span>
        </p>
      </div>

      <div className="mt-3 space-y-3">
        {rows.map((t) => (
          <article key={t.id} className="rounded-2xl border border-[#e7f1ef] bg-white p-3 shadow-[0_1px_2px_rgb(16_40_40/0.03)]">
            <div className="flex gap-3">
              <img src={t.image} alt="" className="w-[92px] shrink-0 self-stretch rounded-xl object-cover" style={{ minHeight: 104 }} />
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[16px] font-bold leading-tight text-[#143044]">{t.name}</p>
                    <p className="mt-0.5 text-[15px] font-bold leading-tight text-[var(--color-org-teal)]">{som(t.price)}</p>
                  </div>
                  <button type="button" onClick={() => { setEditing(t); setOpen(true) }} className="inline-flex shrink-0 items-center gap-1 text-[12.5px] font-semibold text-[var(--color-org-teal)]">
                    <Pencil className="size-3.5" /> Tahrirlash
                  </button>
                </div>
                <div className="mt-1.5 flex items-end justify-between gap-2">
                  <ul className="min-w-0 space-y-1">
                    {t.perks.map((p) => (
                      <li key={p} className="flex items-start gap-1.5 text-[12.5px] leading-tight text-[#3e5560]">
                        <Check className="mt-0.5 size-3.5 shrink-0 text-[#22a06b]" strokeWidth={2.6} />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="w-[86px] shrink-0 pb-0.5 text-right">
                    <p className="text-[11px] text-[#8aa0a4]">Sotilgan</p>
                    <p className="text-[14px] font-bold leading-tight text-[#143044]">
                      {t.sold} <span className="font-medium text-[#9aa8ac]">/ {t.total}</span>
                    </p>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#e6f1ef]">
                      <div className="h-full rounded-full bg-[#12a394]" style={{ width: `${t.total ? Math.round((t.sold / t.total) * 100) : 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <button type="button" onClick={() => { setEditing(null); setOpen(true) }} className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#e5f7f4] text-[14.5px] font-semibold text-[var(--color-org-teal)]">
        <Plus className="size-4" /> Chipta turi qo‘shish
      </button>

      <TicketModal
        open={open}
        initial={editing ? { ...editing, seats: editing.total, note: (editing.perks || []).join(', ') } : null}
        onClose={() => { setOpen(false); setEditing(null) }}
        onSave={save}
      />
    </div>
  )
}

function MobileTab({ icon: Icon, label, active, to }) {
  const cls = cx('inline-flex items-center gap-1 text-[11.5px] font-semibold', active ? 'text-[var(--color-org-teal)]' : 'text-[#8d95a8]')
  const inner = (<><Icon className="size-4" strokeWidth={1.8} />{label}</>)
  if (to) return <Link to={to} className={cls}>{inner}</Link>
  return <span className={cls}>{inner}</span>
}

function Kpi({ icon: Icon, label, value, delta, down }) {
  return (
    <article className="flex min-w-0 items-center gap-2.5 rounded-2xl border border-[#e6f1ef] bg-white px-3 py-3 shadow-[0_1px_2px_rgb(16_40_40/0.03)]">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e7f6f3] text-[var(--color-org-teal)]">
        <Icon className="size-[18px]" strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[12px] leading-tight text-[#6e868c]">{label}</p>
        <p className="mt-0.5 truncate text-[20px] font-bold leading-none tracking-tight text-[#143044]">{value}</p>
        {delta ? (
          <p className={cx('mt-1 inline-flex items-center gap-0.5 text-[12px] font-semibold leading-none', down ? 'text-[#e11d48]' : 'text-[#16a34a]')}>
            <TrendArrow down={down} /> {delta}
          </p>
        ) : null}
      </div>
    </article>
  )
}

function TrendArrow({ down }) {
  return (
    <svg viewBox="0 0 12 12" className="size-3" aria-hidden>
      {down
        ? <path d="M6 2.2v7.2M6 9.4 3.2 6.6M6 9.4l2.8-2.8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        : <path d="M6 9.8V2.6M6 2.6 3.2 5.4M6 2.6l2.8 2.8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  )
}

function Panel({ title, sub, extra, children, className, flush }) {
  return (
    <section className={cx('rounded-2xl border border-[#e6f1ef] bg-white shadow-[0_1px_2px_rgb(16_40_40/0.04)]', className)}>
      {(title || extra) && (
        <div className={cx('flex justify-between gap-3 px-4 pt-3.5', sub ? 'items-start' : 'items-center')}>
          <div className="min-w-0">
            {title && <h2 className="text-[14.5px] font-bold leading-tight text-[#143044]">{title}</h2>}
            {sub && <p className="mt-0.5 text-[12px] leading-snug text-[#8aa0a4]">{sub}</p>}
          </div>
          {extra}
        </div>
      )}
      <div className={cx(flush ? 'px-0 pb-1 pt-2' : 'px-4 pb-4 pt-3')}>{children}</div>
    </section>
  )
}

function MetricSelect({ value, onChange }) {
  return (
    <label className="relative shrink-0">
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-8 appearance-none rounded-lg border border-[#e4eeec] bg-white pl-2.5 pr-7 text-[12px] text-[#3e5a62] outline-none">
        <option>Sotilgan chiptalar</option>
        <option>Tushum</option>
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-[#8aa4a8]" />
    </label>
  )
}

function SalesBars({ values }) {
  const max = 200
  const ticks = [200, 150, 100, 50, 0]
  return (
    <div>
      <div className="flex h-[150px] gap-1.5">
        <div className="flex h-full w-7 shrink-0 flex-col justify-between text-right text-[10px] leading-none text-[#9aafb4]">
          {ticks.map((n) => <span key={n}>{n}</span>)}
        </div>
        <div className="flex min-w-0 flex-1 items-end gap-[5px] border-b border-[#e8f0ef]">
          {values.map((v, i) => (
            <div key={MONTHS[i]} className="group relative flex h-full min-w-0 flex-1 items-end" title={`${MONTHS[i]} · ${v}`}>
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-[#12324a] px-1.5 py-0.5 text-[10px] text-white group-hover:block">{MONTHS[i]} · {v}</span>
              <span className="block w-full rounded-t-[4px]" style={{ height: `${Math.max(3, (v / max) * 100)}%`, background: 'linear-gradient(180deg,#8fe6dc 0%,#1aa396 48%,#0c8a80 100%)' }} />
            </div>
          ))}
        </div>
      </div>
      <div className="ml-8 mt-1.5 flex gap-[5px]">
        {MONTHS.map((m) => <span key={m} className="flex-1 text-center text-[10px] leading-none text-[#93a8ad]">{m}</span>)}
      </div>
    </div>
  )
}

function SalesDonut({ rows = [] }) {
  const size = 132
  const c = 66
  const r = 46
  const stroke = 18
  const circ = 2 * Math.PI * r
  const colors = ['#0e8b82', '#3ec9bb', '#f0b42a', '#f07268', '#8b5cf6']
  const sum = rows.reduce((n, t) => n + (Number(t.sold) || 0), 0)
  const parts = (rows.length ? rows : [{ name: 'Chipta', sold: 0 }]).map((t, i) => ({
    label: t.name,
    n: Number(t.sold) || 0,
    pct: sum ? Math.round(((Number(t.sold) || 0) / sum) * 100) : 0,
    color: colors[i % colors.length],
  }))
  const visual = parts.filter((p) => p.pct > 0)
  let acc = 0
  return (
    <div className="flex items-center gap-3">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
          {(visual.length ? visual : [{ label: 'empty', pct: 100, color: '#e6f1ef' }]).map((p) => {
            const len = (p.pct / 100) * circ + 0.8
            const rot = (acc / 100) * 360 - 90
            acc += p.pct
            return <circle key={p.label} cx={c} cy={c} r={r} fill="none" stroke={p.color} strokeWidth={stroke} strokeDasharray={`${len} ${circ}`} transform={`rotate(${rot} ${c} ${c})`} />
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="text-[18px] font-bold leading-none text-[#143044]">{sum}</div>
            <div className="mt-0.5 text-[11px] text-[#7e9398]">chipta</div>
          </div>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-2">
        {parts.map((t) => (
          <li key={t.label} className="grid grid-cols-[10px_minmax(0,1fr)_34px_32px] items-center gap-1.5 text-[12.5px]">
            <span className="size-2.5 rounded-full" style={{ background: t.color }} />
            <span className="truncate text-[#3e5a62]">{t.label}</span>
            <span className="text-right font-semibold text-[#143044]">{t.pct}%</span>
            <span className="text-right text-[#8aa0a4]">{t.n}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function VipTicket() {
  return (
    <div className="relative min-h-[214px] overflow-hidden rounded-[16px] text-white" style={{ background: '#055b58' }}>
      <img src="/images/organizer/ticket-implant.jpg" alt="" className="absolute inset-y-0 right-0 h-full w-[68%] object-cover object-center" />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, #055b58 0%, #055b58 30%, rgb(5 91 88 / 0.55) 48%, rgb(5 91 88 / 0) 68%)' }} />
      <div className="relative flex min-h-[208px] flex-col px-3.5 pb-3 pt-3 pr-[96px]">
        <div className="flex items-center gap-1.5">
          <ToothIcon className="size-[16px] text-white" strokeWidth={1.7} />
          <span className="text-[13px] font-bold tracking-tight">StomaHub</span>
        </div>
        <p className="mt-3 max-w-[168px] text-[14.5px] font-bold leading-[1.2]">Implantologiya: nazariya va amaliyot</p>
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-white/85"><Calendar className="size-3.5 shrink-0" /> 24-noyabr 2026, 10:00</p>
        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-white/85"><MapPin className="size-3.5 shrink-0" /> Toshkent, Congress Hall</p>
        <div className="mt-auto grid grid-cols-2 gap-2 pt-3 text-[11px]">
          <div>
            <p className="text-white/65">Ishtirokchi</p>
            <p className="font-semibold">Aliyeva Mohira</p>
          </div>
          <div>
            <p className="text-white/65">Chipta turi</p>
            <p className="font-semibold">VIP chipta</p>
          </div>
        </div>
      </div>
      <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-md bg-[#f5c518] px-1.5 py-[3px] text-[10px] font-extrabold tracking-wide text-[#3a2e08]">
        <Crown className="size-3" strokeWidth={2.2} /> VIP
      </span>
      <div className="absolute bottom-2.5 right-2.5 w-[78px]">
        <div className="rounded-[6px] bg-white p-1">
          <QrMark size={70} seed={4} />
        </div>
        <p className="mt-1 text-center text-[8px] font-semibold tracking-tight text-white">#STH-2026-0001</p>
      </div>
    </div>
  )
}

function QuickGrid({ notify, onQr, onPromo, rows = [], shareId }) {
  const items = [
    { icon: QrCode, label: 'QR kodlar yaratish', onClick: onQr },
    { icon: Download, label: 'Excel yuklab olish', onClick: () => { downloadText('chiptalar.csv', ['Nom,Narx,Soni,Sotilgan', ...rows.map((t) => `${t.name},${t.price},${t.total || t.seats || 0},${t.sold || 0}`)].join('\n'), 'text/csv'); notify('Excel yuklab olindi') } },
    { icon: Tag, label: 'Promo-kod qo‘shish', onClick: onPromo },
    { icon: Link2, label: 'Chipta linkini ulashish', onClick: () => { const url = `${window.location.origin}/seminarlar/${shareId || ''}`; navigator.clipboard?.writeText(url).catch(() => {}); notify('Havola nusxalandi') } },
  ]
  return (
    <div className="grid grid-cols-2 gap-x-2 gap-y-3">
      {items.map((it) => (
        <button key={it.label} type="button" onClick={it.onClick} className="flex items-center gap-2 rounded-xl px-0.5 py-1 text-left hover:bg-[#f4fbfb]">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e7f6f3] text-[var(--color-org-teal)]">
            <it.icon className="size-4" strokeWidth={1.8} />
          </span>
          <span className="text-[11.5px] font-medium leading-tight text-[#1c3d48]">{it.label}</span>
        </button>
      ))}
    </div>
  )
}

function TicketSettings({ notify }) {
  const [on, setOn] = useState(true)
  return (
    <Panel title="Chipta sozlamalari" className="mt-3">
      <div className="flex items-center justify-between gap-3 py-1">
        <div>
          <p className="text-[13px] font-semibold">Sotuvni ochiq qoldirish</p>
          <p className="text-[12px] text-[#7e9398]">Joylar tugaguncha yangi buyurtma qabul qilinadi</p>
        </div>
        <Toggle on={on} onChange={setOn} label="Sotuv" />
      </div>
      <Btn className="mt-3" onClick={() => notify('Sozlamalar saqlandi')}>Saqlash</Btn>
    </Panel>
  )
}

function PromoModal({ open, onClose, onSave }) {
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  return (
    <Modal open={open} title="Promo-kod qo‘shish" onClose={onClose}>
      <Field label="Promo-kod" req error={err}><input className={inputCls(err)} value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setErr('') }} placeholder="EARLYBIRD" /></Field>
      <div className="mt-4 flex justify-end gap-2">
        <Btn kind="soft" onClick={onClose}>Bekor qilish</Btn>
        <Btn onClick={() => { if (code.trim().length < 3) { setErr('Kodni kiriting'); return } onSave(code.trim()) }}>Saqlash</Btn>
      </div>
    </Modal>
  )
}

function TicketModal({ open, onClose, onSave, initial }) {
  const blank = {
    name: initial?.name || '',
    price: initial ? String(initial.price).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : '',
    seats: initial ? String(initial.seats ?? initial.total ?? '') : '',
    note: initial?.note || '',
    active: initial ? initial.active !== false : true,
  }
  return <TicketForm key={`${open}-${initial?.id || 'new'}`} open={open} initial={initial} onClose={onClose} onSave={onSave} blank={blank} />
}

function TicketForm({ open, initial, onClose, onSave, blank }) {
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
    onSave({
      id: initial?.id || Date.now(),
      name: f.name.trim(),
      icon: initial?.icon || 'crown',
      note: f.note,
      perks: String(f.note || '').split(',').map((x) => x.trim()).filter(Boolean),
      price,
      total: seats,
      sold: initial?.sold || 0,
      left: Math.max(0, seats - (initial?.sold || 0)),
      active: f.active,
    })
  }
  return (
    <Modal open={open} title={initial ? 'Chipta turini tahrirlash' : 'Yangi chipta turi qo‘shish'} onClose={onClose} width={420}>
      <div className="space-y-3">
        <Field label="Chipta turi nomi" req error={err.name}><input className={inputCls(err.name)} value={f.name} onChange={set('name')} placeholder="VIP chipta" /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Narx" req error={err.price}><input className={inputCls(err.price)} value={f.price} onChange={set('price')} placeholder="2 500 000" /></Field>
          <Field label="Joylar soni" req error={err.seats}><input className={inputCls(err.seats)} value={f.seats} onChange={set('seats')} placeholder="100" /></Field>
        </div>
        <Field label="Tavsif" hint={`${f.note.length}/500`}><textarea maxLength={500} className={`${inputCls()} h-20 py-2`} value={f.note} onChange={set('note')} /></Field>
        <div className="flex items-center justify-between"><span className="text-[12.5px] font-medium">Holat · {f.active ? 'Faol' : 'Nofaol'}</span><Toggle on={f.active} onChange={(v) => setF({ ...f, active: v })} label="Faol" /></div>
        <div className="flex justify-end gap-2 pt-1"><Btn kind="soft" onClick={onClose}>Bekor qilish</Btn><Btn onClick={save}>Saqlash</Btn></div>
      </div>
    </Modal>
  )
}
