import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Check, ChevronDown, ChevronRight, CircleHelp, Clock, Coins, CreditCard, FileText, Info, Landmark, Lock, Plus, Undo2, Upload, UserRound, Wallet as WalletIcon, X,
} from 'lucide-react'
import { som } from '../data'
import { addRequisite, useHub, walletOf, withdraw } from '../../hubStore'
import { useOrg } from '../Shell'

const STATUS = {
  hold: { label: 'Ushlab turilgan', icon: Clock, cls: 'bg-[#fff4e0] text-[#e1960b]' },
  paid: { label: 'O‘tkazildi', icon: Check, cls: 'bg-[#e7f8ee] text-[#16a34a]' },
  refund: { label: 'Qaytarildi', icon: Undo2, cls: 'bg-[#eef2f3] text-[#7d8b90]' },
}

const FILTERS = [
  { value: 'all', label: 'Barchasi' },
  { value: 'hold', label: 'Ushlab turilgan' },
  { value: 'paid', label: 'O‘tkazildi' },
  { value: 'refund', label: 'Qaytarildi' },
]

function compact(n) {
  return Math.round(n).toLocaleString('ru-RU')
}

function DateBits({ value }) {
  const raw = String(value || '')
  const [date, time] = raw.split(', ')
  return (
    <span className="block leading-tight">
      <span className="block break-words">{date}</span>
      {time ? <span className="block text-[11px] text-[#8aa0a4]">{time}</span> : null}
    </span>
  )
}

function mobileRows(wallet) {
  const rows = []
  for (const r of wallet.rows) {
    if (r.who === 'Yechish') {
      rows.push({ id: r.id, date: r.date, time: '', title: 'Pul yechish', sub: r.seminar, amount: -r.sum, kind: 'out', status: 'Yuborilgan' })
      continue
    }
    rows.push({
      id: `${r.id}-in`,
      date: r.date,
      time: '',
      title: r.seminar,
      sub: `To‘lov (${r.who})`,
      amount: r.sum,
      kind: 'in',
      status: r.state === 'refund' ? 'Qaytarildi' : 'Tushum',
    })
    if (r.fee) {
      rows.push({ id: `${r.id}-fee`, date: r.date, time: '', title: 'Komissiya', sub: r.seminar, amount: -r.fee, kind: 'fee', status: 'Komissiya' })
    }
  }
  return rows
}

const MOBILE_FILTERS = [
  { id: 'all', label: 'Barchasi' },
  { id: 'in', label: 'Tushumlar' },
  { id: 'out', label: 'Yechishlar' },
  { id: 'fee', label: 'Komissiya' },
]

const STATUS_TONE = {
  Tushum: 'text-[#16a34a]',
  Yuborilgan: 'text-[#3b82f6]',
  Komissiya: 'text-[#8b979c]',
  Qaytarildi: 'text-[#8b979c]',
}

const FACTS = [
  'Pul faqat seminar o‘tkazilgandan keyin yechib olish mumkin.',
  'Platforma komissiyasi 12% ni tashkil qiladi.',
  'So‘rov 1–3 ish kuni ichida ko‘rib chiqiladi.',
  'To‘lov sizning tanlagan rekvizitingizga o‘tkaziladi.',
]

function moneyInput(raw) {
  const digits = String(raw).replace(/\D/g, '').slice(0, 9)
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export default function Wallet() {
  return (
    <>
      <div className="lg:hidden">
        <MobileWallet />
      </div>
      <div className="hidden lg:block">
        <DesktopWallet />
      </div>
    </>
  )
}

function DesktopWallet() {
  const { notify, query } = useOrg()
  const hub = useHub()
  const wallet = walletOf(hub)
  const [filter, setFilter] = useState('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('card')
  const [picked, setPicked] = useState(hub.requisites[0]?.id || '4521')
  const [cardOpen, setCardOpen] = useState(false)
  const [err, setErr] = useState('')
  const [sent, setSent] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const q = (query || '').trim().toLowerCase()
  const rows = useMemo(() => wallet.rows.filter((t) => (filter === 'all' || t.state === filter) && (!q || `${t.seminar} ${t.who}`.toLowerCase().includes(q))), [wallet.rows, filter, q])
  const n = Number(String(amount).replace(/\s/g, ''))
  const filterLabel = FILTERS.find((f) => f.value === filter)?.label
  const balances = [
    { icon: Lock, title: 'Ushlab turilgan', value: `${som(wallet.hold)}`, text: 'Seminar o‘tkazilgandan keyin yechib olish mumkin', info: true },
    { icon: WalletIcon, title: 'Yechib olish mumkin', value: `${som(wallet.available)}`, text: 'Hozir pul yechish so‘rovini yuborishingiz mumkin', info: true },
    { icon: Coins, title: 'Jami o‘tkazilgan', value: `${som(wallet.transferred)}`, text: 'Oldingi to‘lovlar (muvaffaqiyatli o‘tkazilgan)', info: false },
  ]

  const submit = () => {
    const res = withdraw(n, picked)
    if (!res.ok) { setErr(res.error); return }
    setErr('')
    setSent(true)
    setAmount('')
    notify('So‘rov yuborildi')
  }

  return (
    <div className="text-[#143044]">
      <h1 className="text-[26px] font-bold leading-none tracking-tight">Hamyon</h1>
      <p className="mt-1.5 text-[13.5px] text-[#6e868c]">Seminarlardan olingan to‘lovlar va pul yechish</p>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_240px] items-start gap-3">
        <div className="min-w-0 space-y-3">
          <section className="grid grid-cols-3 gap-3">
            {balances.map((b) => <Balance key={b.title} {...b} />)}
          </section>

          <section className="rounded-2xl border border-[#d7f0ea] bg-[#f4fbfa] px-4 py-3.5">
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-white text-[14px] font-bold text-[var(--color-org-teal)]">%</span>
              <h2 className="text-[14px] font-bold">Komissiya hisoblash misoli</h2>
            </div>
            <p className="mt-1 text-[12.5px] text-[#5e787e]">Platforma komissiyasi har bir to‘lov summasidan 12% ni tashkil qiladi.</p>
            <div className="mt-3 grid grid-cols-[minmax(0,1fr)_22px_minmax(0,1fr)_22px_minmax(0,1fr)] items-center">
              <Calc n={som(wallet.gross)} l="To‘lov summasi" />
              <span className="text-center text-[20px] font-medium leading-none text-[#b7c6ca]">−</span>
              <Calc n={som(wallet.fee)} l="Platforma komissiyasi (12%)" />
              <span className="text-center text-[20px] font-medium leading-none text-[#b7c6ca]">=</span>
              <Calc n={som(wallet.net)} l="Sizga o‘tkaziladigan summa" hi />
            </div>
          </section>

          <section className="min-w-0 rounded-2xl border border-[#e6f1ef] bg-white shadow-[0_1px_2px_rgb(16_40_40/0.04)]">
          <div className="flex items-start justify-between gap-3 px-4 pb-2 pt-4">
            <div>
              <h2 className="text-[15px] font-bold leading-tight">Tranzaksiyalar</h2>
              <p className="mt-0.5 text-[12.5px] text-[#8aa0a4]">Barcha to‘lovlar va pul harakatlari</p>
            </div>
            <div className="relative">
              <button type="button" onClick={() => setFilterOpen((v) => !v)} className="flex h-8 items-center gap-1.5 rounded-lg border border-[#e4eeec] bg-white px-2.5 text-[12.5px] text-[#3e5a62]">
                {filterLabel}
                <ChevronDown className="size-3.5 text-[#8aa4a8]" />
              </button>
              {filterOpen && (
                <ul className="absolute right-0 z-30 mt-1 w-40 overflow-hidden rounded-xl border border-[#e6eeec] bg-white py-1 shadow-lg">
                  {FILTERS.map((f) => (
                    <li key={f.value}>
                      <button type="button" className={`block w-full px-3 py-1.5 text-left text-[12.5px] hover:bg-[#f4fbfa] ${f.value === filter ? 'font-semibold text-[var(--color-org-teal)]' : ''}`} onClick={() => { setFilter(f.value); setFilterOpen(false) }}>{f.label}</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse text-left">
              <colgroup>
                <col className="w-[132px]" />
                <col />
                <col className="w-[104px]" />
                <col className="w-[112px]" />
                <col className="w-[104px]" />
                <col className="w-[128px]" />
              </colgroup>
              <thead>
                <tr className="border-y border-[#eef3f2] text-[11.5px] text-[#8aa0a4]">
                  {['Sana', 'Seminar', 'Summa', 'Komissiya (12%)', 'Sizga', 'Holat'].map((h) => (
                    <th key={h} className="px-2 py-2.5 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => {
                  const st = STATUS[t.state]
                  const Icon = st.icon
                  return (
                    <tr key={t.id} className="border-b border-[#f3f7f6] last:border-0">
                      <td className="overflow-hidden px-2 py-2.5 align-middle text-[12px] text-[#3e5a62]"><DateBits value={t.date} /></td>
                      <td className="overflow-hidden px-2 py-2.5 align-middle text-[12px] font-medium leading-snug">
                        {t.seminarId ? <Link to={`/tashkilotchi/seminarlar/${t.seminarId}`} className="line-clamp-2 break-words text-[#143044] hover:text-[var(--color-org-teal)]">{t.seminar}</Link> : <span className="line-clamp-2 break-words">{t.seminar}</span>}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2.5 align-middle text-[12px]">{som(t.sum)}</td>
                      <td className="whitespace-nowrap px-2 py-2.5 align-middle text-[12px] text-[#3e5a62]">{som(t.fee)}</td>
                      <td className="whitespace-nowrap px-2 py-2.5 align-middle text-[12px] font-bold">{som(t.net)}</td>
                      <td className="px-2 py-2.5 align-middle">
                        <span className={`inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full px-2 text-[11px] font-semibold ${st.cls}`}>
                          <Icon className="size-3 shrink-0" strokeWidth={2.4} />
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {rows.length === 0 && (
                  <tr><td colSpan={6} className="px-3 py-8 text-center text-[13px] text-[#7e9398]">Tranzaksiya yo‘q</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        </div>

        <div className="w-[240px] space-y-3">
          <section className="rounded-2xl border border-[#e6f1ef] bg-white p-3.5 shadow-[0_1px_2px_rgb(16_40_40/0.04)]">
            <h2 className="flex items-center gap-1.5 text-[13.5px] font-bold leading-tight">
              <FileText className="size-4 shrink-0 text-[var(--color-org-teal)]" strokeWidth={1.8} />
              Pul yechish so‘rovi
            </h2>
            <p className="mt-2.5 text-[12px] text-[#6e868c]">Yechib olish mumkin bo‘lgan summa</p>
            <p className="mt-0.5 text-[20px] font-bold leading-tight tracking-tight text-[#14a394]">{som(wallet.available)}</p>

            <label className="mt-3 block">
              <span className="mb-1.5 block text-[12.5px] font-medium text-[#1c4a5a]">Yechib olish summasi</span>
              <span className={`flex h-10 items-center gap-2 rounded-xl border bg-white px-2.5 ${err ? 'border-[#e11d48]' : 'border-[#e3eeec] focus-within:border-[var(--color-org-teal)]'}`}>
                <input
                  value={amount}
                  onChange={(e) => { setAmount(moneyInput(e.target.value)); setErr(''); setSent(false) }}
                  placeholder="Masalan: 1 000 000"
                  inputMode="numeric"
                  className="min-w-0 flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-[#9aafb4]"
                />
                <span className="shrink-0 text-[12px] text-[#8aa0a4]">so‘m</span>
              </span>
              {err && <span className="mt-1 block text-[11.5px] text-[#e11d48]">{err}</span>}
            </label>

            <p className="mb-1 mt-3 text-[12.5px] font-semibold">To‘lov usulini tanlang</p>
            <Radio checked={method === 'card'} label="Bank kartasi" onChange={() => { setMethod('card'); setPicked('4521') }} />
            <Radio checked={method === 'bank'} label="Bank hisobi" onChange={() => { setMethod('bank'); setPicked('bank') }} />

            <p className="mb-1.5 mt-3 text-[12.5px] font-semibold">Saqlangan rekvizitlar</p>
            <div className="relative">
              <button type="button" onClick={() => setCardOpen((v) => !v)} className={`flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-left ${picked === '4521' ? 'border-[#cfe7e3] bg-white' : 'border-[#e6eeec] bg-white'}`}>
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#e7f7f4] text-[var(--color-org-teal)]"><CreditCard className="size-3.5" strokeWidth={1.8} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] font-semibold leading-tight">Karta **** 4521</span>
                  <span className="mt-0.5 block text-[11px] text-[#7e9398]">Humo · 04/28</span>
                </span>
                <ChevronDown className="size-3.5 shrink-0 text-[#8aa4a8]" />
              </button>
              {cardOpen && (
                <ul className="absolute left-0 right-0 z-30 mt-1 overflow-hidden rounded-xl border border-[#e6eeec] bg-white py-1 shadow-lg">
                  {hub.requisites.map((r) => (
                    <li key={r.id}>
                      <button type="button" className="block w-full px-3 py-2 text-left text-[12.5px] font-medium hover:bg-[#f4fbfa]" onClick={() => { setPicked(r.id); setMethod('card'); setCardOpen(false) }}>{r.label} · {r.detail}</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button type="button" onClick={() => { setPicked('bank'); setMethod('bank'); setCardOpen(false) }} className={`mt-2 flex w-full items-start gap-2 rounded-xl border px-2.5 py-2 text-left ${picked === 'bank' ? 'border-[#cfe7e3] bg-white' : 'border-[#e6eeec] bg-white'}`}>
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#e7f7f4] text-[var(--color-org-teal)]"><Landmark className="size-3.5" strokeWidth={1.8} /></span>
              <span className="min-w-0">
                <span className="block text-[12.5px] font-semibold leading-tight">Aloqabank</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-[#7e9398]">MFO: 00487</span>
                <span className="mt-1 block text-[11px] leading-none text-[#7e9398]">Hisob raqami</span>
                <span className="mt-0.5 block whitespace-nowrap text-[11px] font-semibold tracking-tight text-[#143044]">2020&nbsp;8000&nbsp;1234&nbsp;5678&nbsp;9001</span>
              </span>
            </button>

            <button type="button" onClick={() => setAddOpen(true)} className="mt-2.5 inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--color-org-teal)]">
              <Plus className="size-3.5" strokeWidth={2.4} /> Rekvizit qo‘shish
            </button>
            {sent && <p className="mt-2 rounded-lg bg-[#e7f8ee] px-2.5 py-1.5 text-[12px] text-[#15803d]">{som(n)} so‘rovi qabul qilindi. 1–3 ish kuni.</p>}
            <button type="button" onClick={submit} className="mt-3 flex h-10 w-full items-center justify-center rounded-xl bg-[var(--color-org-teal)] text-[13px] font-semibold text-white shadow-[0_6px_14px_rgb(12_143_134/0.22)] hover:bg-[#0a7e76]">
              So‘rov yuborish →
            </button>
          </section>

          <section className="rounded-2xl border border-[#e3f3ef] bg-[#f4fbfa] p-3.5">
            <h2 className="flex items-center gap-1.5 text-[13px] font-bold">
              <span className="grid size-5 place-items-center rounded-full bg-white text-[var(--color-org-teal)]"><Info className="size-3.5" strokeWidth={2.2} /></span>
              Muhim ma’lumotlar
            </h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-4 text-[12px] leading-snug text-[#3e5a62]">
              {FACTS.map((f) => <li key={f}>{f}</li>)}
            </ul>
          </section>
        </div>
      </div>

      {addOpen && <AddRequisite onClose={() => setAddOpen(false)} onSave={(item) => { addRequisite(item); setPicked(item.id); setAddOpen(false); notify('Rekvizit saqlandi') }} />}
    </div>
  )
}

function Balance({ icon: Icon, title, value, text, info }) {
  return (
    <article className="rounded-2xl border border-[#e6f1ef] bg-white px-3.5 py-3.5 shadow-[0_1px_2px_rgb(16_40_40/0.04)]">
      <span className="grid size-9 place-items-center rounded-xl bg-[#e7f7f4] text-[var(--color-org-teal)]">
        <Icon className="size-4" strokeWidth={1.8} />
      </span>
      <p className="mt-2.5 flex items-center gap-1 text-[12.5px] text-[#6e868c]">
        {title}
        {info && (
          <button type="button" title={text} aria-label={text} className="text-[#9bb0b6]">
            <Info className="size-3.5" strokeWidth={2} />
          </button>
        )}
      </p>
      <p className="mt-1 text-[20px] font-bold leading-none tracking-tight text-[#143044]">{value}</p>
      <p className="mt-1.5 text-[11.5px] leading-snug text-[#8aa0a4]">{text}</p>
    </article>
  )
}

function Calc({ n, l, hi }) {
  return (
    <div className={`rounded-xl bg-white px-2 py-3 text-center shadow-[0_1px_2px_rgb(16_40_40/0.04)] ${hi ? 'ring-1 ring-[#c9ebe4]' : ''}`}>
      <p className={`break-words text-[14px] font-bold leading-tight tracking-tight ${hi ? 'text-[#14a394]' : 'text-[#143044]'}`}>{n}</p>
      <p className="mt-1 text-[11px] leading-snug text-[#7e9398]">{l}</p>
    </div>
  )
}

function Radio({ checked, label, onChange }) {
  return (
    <button type="button" onClick={onChange} className="flex w-full items-center gap-2 py-1 text-left text-[12.5px] text-[#143044]">
      <span className={`grid size-[18px] shrink-0 place-items-center rounded-full border-2 ${checked ? 'border-[var(--color-org-teal)]' : 'border-[#c9d6d8]'}`}>
        {checked && <span className="size-2.5 rounded-full bg-[var(--color-org-teal)]" />}
      </span>
      {label}
    </button>
  )
}

function AddRequisite({ onClose, onSave }) {
  const [name, setName] = useState('')
  const [detail, setDetail] = useState('')
  const [bad, setBad] = useState(false)
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-[#0e2a3a]/30 p-4" onClick={onClose}>
      <form
        className="w-full max-w-[400px] rounded-2xl bg-white p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); if (!name.trim() || !detail.trim()) { setBad(true); return } onSave({ id: detail.replace(/\D/g, '').slice(-4) || String(Date.now()).slice(-4), label: name.trim(), detail: detail.trim() }) }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-bold">Rekvizit qo‘shish</h3>
          <button type="button" aria-label="Yopish" onClick={onClose} className="grid size-8 place-items-center rounded-lg text-[#6e868c]"><X className="size-4" /></button>
        </div>
        <label className="mt-3 block text-[12.5px] font-medium">Nomi
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-[#e3eeec] px-3 text-[13px] outline-none focus:border-[var(--color-org-teal)]" placeholder="Karta yoki bank" />
        </label>
        <label className="mt-3 block text-[12.5px] font-medium">Raqam
          <input value={detail} onChange={(e) => setDetail(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-[#e3eeec] px-3 text-[13px] outline-none focus:border-[var(--color-org-teal)]" placeholder="Hisob yoki karta raqami" />
        </label>
        {bad && <p className="mt-2 text-[12px] text-[#e11d48]">Ikkala maydonni ham to‘ldiring</p>}
        <button type="submit" className="mt-3 h-10 w-full rounded-xl bg-[var(--color-org-teal)] text-[13px] font-semibold text-white">Saqlash</button>
      </form>
    </div>
  )
}

function MobileWallet() {
  const { notify } = useOrg()
  const hub = useHub()
  const wallet = walletOf(hub)
  const [filter, setFilter] = useState('all')
  const [cardOpen, setCardOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [picked, setPicked] = useState(hub.requisites[0]?.id || '4521')
  const [err, setErr] = useState('')
  const rows = mobileRows(wallet).filter((t) => filter === 'all' || t.kind === filter)
  const card = hub.requisites.find((r) => r.id === picked) || hub.requisites[0]
  const ask = () => {
    const n = Number(String(amount).replace(/\s/g, ''))
    const res = withdraw(n, picked)
    if (!res.ok) { setErr(res.error); return }
    setErr('')
    setAmount('')
    notify(`${som(n)} yechish so‘rovi yuborildi`)
  }

  return (
    <div className="text-[#143044]">
      <h1 className="text-[26px] font-bold leading-none tracking-tight">Hamyon</h1>
      <p className="mt-1 text-[13.5px] text-[#6e868c]">Daromadlaringiz va to‘lovlar</p>

      <section className="mt-3 grid grid-cols-3 gap-2">
        <MiniStat icon={CreditCard} label="Ushlab turilgan" value={compact(wallet.hold)} help />
        <MiniStat icon={WalletIcon} label="Yechib olish mumkin" value={compact(wallet.available)} />
        <MiniStat icon={Coins} label="Jami o‘tkazilgan" value={compact(wallet.transferred)} />
      </section>

      <section className="mt-3 rounded-2xl border border-[#e6f1ef] bg-[#f7fcfb] px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[13.5px] font-bold">Komissiya va hisob-kitob (12%)</h2>
          <Info className="size-4 shrink-0 text-[#8aa4a8]" />
        </div>
        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_14px_minmax(0,1fr)_14px_minmax(0,1fr)] items-start">
          <Flow icon={UserRound} label="Jami tushum" value={compact(wallet.gross)} />
          <span className="pt-3 text-center text-[14px] text-[#9bb0b6]">→</span>
          <Flow icon={Coins} label="Komissiya (12%)" value={compact(wallet.fee)} />
          <span className="pt-3 text-center text-[14px] text-[#9bb0b6]">→</span>
          <Flow icon={WalletIcon} label="Sizga" value={compact(wallet.net)} />
        </div>
        <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-snug text-[#6e868c]">
          <Info className="mt-0.5 size-3.5 shrink-0 text-[var(--color-org-teal)]" />
          Komissiya har bir muvaffaqiyatli to‘lovdan avtomatik hisoblanadi.
        </p>
      </section>

      <section className="relative mt-3 rounded-2xl border border-[#e6f1ef] bg-white p-3 shadow-[0_1px_2px_rgb(16_40_40/0.04)]">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[15px] font-bold">Pul yechish</h2>
          <button type="button" onClick={() => setCardOpen((v) => !v)} className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--color-org-teal)]">
            <CreditCard className="size-3.5" /> Karta o‘zgartirish
          </button>
        </div>
        <p className="mt-0.5 text-[12px] text-[#6e868c]">Mablag‘ni o‘z karta hisobingizga o‘tkazing.</p>
        <button type="button" onClick={() => setCardOpen((v) => !v)} className="mt-3 flex h-12 w-full items-center gap-2.5 rounded-xl bg-[#f4fbfa] px-3 text-left">
          <span className="grid size-8 place-items-center rounded-lg bg-white text-[var(--color-org-teal)]"><CreditCard className="size-4" /></span>
          <span className="flex-1 text-[14px] font-semibold tracking-wide">{card?.label || '**** 4521'}</span>
          <ChevronDown className="size-4 text-[#8aa4a8]" />
        </button>
        {cardOpen && (
          <div className="absolute left-3 right-3 z-20 mt-1 rounded-xl border border-[#e6eeec] bg-white p-2 shadow-lg">
            {hub.requisites.map((r) => (
              <button key={r.id} type="button" className="block w-full px-2 py-1.5 text-left text-[12.5px] font-semibold" onClick={() => { setPicked(r.id); setCardOpen(false) }}>{r.label} · {r.detail}</button>
            ))}
          </div>
        )}
        <label className="mt-3 block text-[12px] font-medium text-[#1c4a5a]">Summa
          <span className="mt-1 flex h-11 items-center gap-2 rounded-xl border border-[#e3eeec] bg-white px-3">
            <input value={amount} onChange={(e) => { setAmount(moneyInput(e.target.value)); setErr('') }} inputMode="numeric" placeholder="Masalan: 100 000" className="min-w-0 flex-1 bg-transparent text-[14px] outline-none" />
            <span className="text-[12px] text-[#8aa0a4]">so‘m</span>
          </span>
        </label>
        {err && <p className="mt-1 text-[12px] text-[#e11d48]">{err}</p>}
        <button type="button" onClick={ask} className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-org-teal)] text-[15px] font-semibold text-white">
          <Upload className="size-4" strokeWidth={2.2} /> Pul yechish
        </button>
      </section>

      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5">
        {MOBILE_FILTERS.map((f) => (
          <button key={f.id} type="button" onClick={() => setFilter(f.id)} className={`h-8 shrink-0 rounded-full px-3 text-[12.5px] font-semibold ${filter === f.id ? 'bg-[var(--color-org-teal)] text-white' : 'border border-[#e5eeec] bg-white text-[#3e5a62]'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <section className="mt-2.5 overflow-hidden rounded-2xl border border-[#e6f1ef] bg-white">
        <div className={`${MROW} border-b border-[#f0f4f3] px-1.5 py-2 text-[10px] font-medium text-[#9aa8ad]`}>
          <span>#</span><span>Sana</span><span>Tavsif</span><span>Summa</span><span>Holat</span>
        </div>
        {rows.map((t, i) => (
          <div key={`${t.date}${t.time}${t.kind}${t.sub}`} className={`${MROW} items-center border-b border-[#f4f7f6] px-1.5 py-2 last:border-0`}>
            <span className="text-[11px] text-[#8aa0a4]">{i + 1}</span>
            <span className="min-w-0 leading-tight">
              <span className="block break-words text-[10px] font-medium leading-tight">{t.date}</span>
              {t.time ? <span className="block text-[10px] text-[#9aa8ad]">{t.time}</span> : null}
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block break-words text-[10.5px] font-semibold leading-tight">{t.title}</span>
              <span className="block break-words text-[10px] leading-tight text-[#8aa0a4]">{t.sub}</span>
            </span>
            <span className="leading-tight">
              <span className="block whitespace-nowrap text-[10.5px] font-semibold tracking-tight">{t.amount < 0 ? `− ${moneyInput(String(Math.abs(t.amount)))}` : moneyInput(String(t.amount))}</span>
              <span className="block text-[10px] text-[#8aa0a4]">so‘m</span>
            </span>
            <span className={`flex items-center gap-0.5 whitespace-nowrap text-[10px] font-semibold leading-tight ${STATUS_TONE[t.status]}`}>
              <span className="size-1.5 shrink-0 rounded-full bg-current" />
              <span>{t.status}</span>
              <ChevronRight className="ml-auto size-3 shrink-0 text-[#c5d0d4]" />
            </span>
          </div>
        ))}
        {rows.length === 0 && <p className="px-3 py-8 text-center text-[12.5px] text-[#7e9398]">Tranzaksiya yo‘q</p>}
      </section>
    </div>
  )
}

const MROW = 'grid grid-cols-[14px_minmax(0,84px)_minmax(0,1fr)_minmax(0,58px)_minmax(0,74px)] gap-x-1'

function MiniStat({ icon: Icon, label, value, help }) {
  return (
    <article className="relative rounded-2xl border border-[#e6f1ef] bg-white px-2 py-2.5 shadow-[0_1px_2px_rgb(16_40_40/0.03)]">
      {help && (
        <CircleHelp className="absolute right-1.5 top-1.5 size-3.5 text-[#9bb0b6]" strokeWidth={1.8} aria-label={label} />
      )}
      <span className="grid size-7 place-items-center rounded-lg bg-[#e7f7f4] text-[var(--color-org-teal)]">
        <Icon className="size-3.5" strokeWidth={1.8} />
      </span>
      <p className="mt-2 min-h-[26px] pr-1 text-[10px] leading-tight text-[#6e868c]">{label}</p>
      <p className="mt-1 text-[15px] font-extrabold leading-none tracking-tight">{value}</p>
      <p className="mt-1 text-[10px] text-[#8aa0a4]">so‘m</p>
    </article>
  )
}

function Flow({ icon: Icon, label, value }) {
  return (
    <div className="min-w-0 text-center">
      <span className="mx-auto grid size-8 place-items-center rounded-xl bg-white text-[var(--color-org-teal)] shadow-[0_1px_2px_rgb(16_40_40/0.04)]">
        <Icon className="size-4" strokeWidth={1.8} />
      </span>
      <p className="mt-1.5 text-[10px] leading-tight text-[#6e868c]">{label}</p>
      <p className="mt-0.5 break-words text-[12px] font-bold leading-tight tracking-tight">{value}</p>
      <p className="text-[10px] text-[#8aa0a4]">so‘m</p>
    </div>
  )
}
