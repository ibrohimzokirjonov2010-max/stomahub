import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Info, Lock, Plus, Wallet as WalletIcon } from 'lucide-react'
import { WALLET_STATE, WALLET_TX, som } from '../data'
import { useOrg } from '../Shell'
import { Badge, Btn, Card, Field, Select, inputCls } from '../ui'

const TONE = { hold: 'orange', paid: 'green', refund: 'slate' }

export default function Wallet() {
  const { notify } = useOrg()
  const [filter, setFilter] = useState('all')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('card')
  const [card, setCard] = useState('4521')
  const [err, setErr] = useState('')
  const [sent, setSent] = useState(false)
  const available = 8200000
  const rows = useMemo(() => WALLET_TX.filter((t) => filter === 'all' || t.state === filter), [filter])
  const n = Number(String(amount).replace(/\s/g, ''))

  const submit = () => {
    if (!n || n < 1000) { setErr('Kamida 1 000 so‘m kiriting'); return }
    if (n > available) { setErr('Yechib olish mumkin bo‘lgan summadan oshmasin'); return }
    if (!card) { setErr('Rekvizit tanlang'); return }
    setErr('')
    setSent(true)
    notify('So‘rov yuborildi')
  }

  return (
    <div>
      <h1 className="text-[22px] font-bold">Hamyon</h1>
      <p className="mt-0.5 text-[13px] text-[#6e868c]">Seminarlardan olingan to‘lovlar va pul yechish</p>

      <section className="mt-4 grid gap-3 lg:grid-cols-3">
        <Balance icon={Lock} title="Ushlab turilgan" value="12 500 000 so‘m" text="Seminar o‘tkazilgandan keyin yechib olish mumkin" />
        <Balance icon={WalletIcon} title="Yechib olish mumkin" value="8 200 000 so‘m" text="Hozir pul yechish so‘rovini yuborishingiz mumkin" />
        <Balance icon={WalletIcon} title="Jami o‘tkazilgan" value="45 600 000 so‘m" text="Oldingi to‘lovlar (muvaffaqiyatli o‘tkazilgan)" />
      </section>

      <section className="mt-3 rounded-2xl border border-[#d7f0ea] bg-[#f3fbf8] p-4">
        <p className="flex items-center gap-2 text-[14px] font-bold"><span className="grid size-7 place-items-center rounded-lg bg-white text-[#0c8f86]">%</span> Komissiya hisoblash misoli</p>
        <p className="mt-1 text-[12.5px] text-[#5e787e]">Platforma komissiyasi har bir to‘lov summasidan 12% ni tashkil qiladi.</p>
        <div className="mt-3 grid items-center gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
          <Calc n="10 000 000 so‘m" l="To‘lov summasi" />
          <span className="text-center text-[18px] text-[#8aa0a4]">−</span>
          <Calc n="1 200 000 so‘m" l="Platforma komissiyasi (12%)" />
          <span className="text-center text-[18px] text-[#8aa0a4]">=</span>
          <Calc n="8 800 000 so‘m" l="Sizga o‘tkaziladigan summa" hi />
        </div>
      </section>

      <div className="mt-3 grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card title="Tranzaksiyalar" extra={<Select value={filter} onChange={setFilter} className="w-[140px]" options={[{ value: 'all', label: 'Barchasi' }, { value: 'hold', label: 'Ushlab turilgan' }, { value: 'paid', label: 'O‘tkazildi' }, { value: 'refund', label: 'Qaytarildi' }]} />} pad={false}>
          <p className="px-4 text-[12px] text-[#8aa0a4]">Barcha to‘lovlar va pul harakatlari</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-[12.5px]">
              <thead><tr className="border-y border-[#eef3f2] text-[12px] text-[#8aa0a4]">{['Sana', 'Seminar', 'Summa', 'Komissiya (12%)', 'Sizga', 'Holat'].map((h) => <th key={h} className="px-3 py-2.5 font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.date + t.seminar} className="border-b border-[#f3f7f6]">
                    <td className="px-3 py-3">{t.date}</td>
                    <td className="px-3 py-3"><Link to="/tashkilotchi/seminarlar/implant" className="font-medium hover:text-[#0c8f86]">{t.seminar}</Link></td>
                    <td className="px-3 py-3">{som(t.sum)}</td>
                    <td className="px-3 py-3">{som(t.fee)}</td>
                    <td className="px-3 py-3 font-semibold">{som(t.net)}</td>
                    <td className="px-3 py-3"><Badge tone={TONE[t.state]} dot>{WALLET_STATE[t.state]}</Badge></td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-[#7e9398]">Tranzaksiya yo‘q</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-3">
          <Card title="Pul yechish so‘rovi">
            <p className="text-[12px] text-[#6e868c]">Yechib olish mumkin bo‘lgan summa</p>
            <p className="text-[20px] font-bold text-[#0c8f86]">8 200 000 so‘m</p>
            <Field label="Yechib olish summasi" error={err}>
              <div className="flex items-center gap-2"><input className={inputCls(!!err)} value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d\s]/g, ''))} placeholder="Masalan: 1 000 000" /><span className="text-[12px] text-[#6e868c]">so‘m</span></div>
            </Field>
            <p className="mb-1.5 mt-3 text-[12.5px] font-medium">To‘lov usulini tanlang</p>
            {[['card', 'Bank kartasi'], ['bank', 'Bank hisobi']].map(([id, label]) => (
              <label key={id} className="mb-1 flex items-center gap-2 text-[13px]"><input type="radio" checked={method === id} onChange={() => setMethod(id)} /> {label}</label>
            ))}
            <p className="mb-1.5 mt-3 text-[12.5px] font-medium">Saqlangan rekvizitlar</p>
            <button type="button" onClick={() => setCard('4521')} className={`mb-2 w-full rounded-xl border px-3 py-2 text-left text-[12.5px] ${card === '4521' ? 'border-[#0c8f86] bg-[#f3fbfa]' : 'border-[#e6f1ef]'}`}>
              <b>Karta **** 4521</b><br /><span className="text-[#7e9398]">Humo · 04/28</span>
            </button>
            <button type="button" onClick={() => setCard('bank')} className={`w-full rounded-xl border px-3 py-2 text-left text-[12.5px] ${card === 'bank' ? 'border-[#0c8f86] bg-[#f3fbfa]' : 'border-[#e6f1ef]'}`}>
              <b>Aloqabank</b><br /><span className="text-[#7e9398]">MFO: 00487<br />Hisob raqami: 2020 8000 1234 5678 9001</span>
            </button>
            <button type="button" onClick={() => notify('Rekvizit qo‘shish oynasi keyingi yangilanishda')} className="mt-2 text-[12.5px] font-semibold text-[#0c8f86]"><Plus className="mr-1 inline size-3.5" /> Rekvizit qo‘shish</button>
            {sent && <p className="mt-2 rounded-lg bg-[#e7f8ee] px-2 py-1.5 text-[12px] text-[#15803d]">{n ? som(n) : ''} so‘rovi qabul qilindi. 1–3 ish kuni.</p>}
            <Btn className="mt-3 w-full" onClick={submit}>So‘rov yuborish →</Btn>
          </Card>
          <div className="rounded-2xl border border-[#e6f1ef] bg-[#f7fcfb] p-4 text-[12.5px] text-[#3e5a62]">
            <p className="mb-2 flex items-center gap-1 font-bold"><Info className="size-4 text-[#0c8f86]" /> Muhim ma’lumotlar</p>
            <ul className="list-disc space-y-1 pl-4">
              <li>Pul faqat seminar o‘tkazilgandan keyin yechib olish mumkin.</li>
              <li>Platforma komissiyasi 12% ni tashkil qiladi.</li>
              <li>So‘rov 1–3 ish kuni ichida ko‘rib chiqiladi.</li>
              <li>To‘lov sizning tanlagan rekvizitingizga o‘tkaziladi.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function Balance({ icon: Icon, title, value, text }) {
  return (
    <article className="rounded-2xl border border-[#e6f1ef] bg-white p-4">
      <span className="grid size-9 place-items-center rounded-xl bg-[#e7f7f4] text-[#0c8f86]"><Icon className="size-4" /></span>
      <p className="mt-2 text-[12.5px] text-[#6e868c]">{title}</p>
      <p className="text-[20px] font-bold">{value}</p>
      <p className="mt-1 text-[12px] text-[#8aa0a4]">{text}</p>
    </article>
  )
}

function Calc({ n, l, hi }) {
  return (
    <div className={`rounded-xl bg-white px-3 py-3 text-center ${hi ? 'ring-1 ring-[#b7e3da]' : ''}`}>
      <p className="text-[16px] font-bold">{n}</p>
      <p className="text-[11.5px] text-[#7e9398]">{l}</p>
    </div>
  )
}
