import { useMemo, useState } from 'react'
import { CheckCircle2, Clock3, Download, Landmark, Search, ShieldAlert, Wallet } from 'lucide-react'
import { downloadCsv, listPayments, markPaid, useLoad } from '../api'
import {
  Avatar, CourseTitle, Empty, Kpi, METHOD, MigrationNotice, PAY, PageHead, Panel, PayPill, Segmented, Sheet, btn, cx, dmy, input, shortSom, som,
} from '../ui'

export default function Payments() {
  const { data, status, error, reload } = useLoad(listPayments, [])
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const [pick, setPick] = useState(null)
  const [method, setMethod] = useState('cash')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const rows = data?.rows || []

  const totals = useMemo(() => {
    const t = { paid: 0, paidN: 0, unpaid: 0, unpaidN: 0 }
    rows.forEach((r) => {
      if (r.paymentStatus === 'paid') { t.paid += Number(r.amount) || 0; t.paidN += 1 }
      if (r.paymentStatus === 'unpaid') { t.unpaid += Number(r.amount) || 0; t.unpaidN += 1 }
    })
    return t
  }, [rows])

  const list = rows.filter((r) => (tab === 'all' || r.paymentStatus === tab) && (!q.trim() || `${r.name} ${r.courseTitle}`.toLowerCase().includes(q.trim().toLowerCase())))

  const open = (row) => { setPick(row); setMethod('cash'); setNote(''); setMsg('') }
  const confirm = async () => {
    setBusy(true)
    try {
      await markPaid(pick.courseId, pick.userId, method, note)
      setPick(null)
      setMsg(`${pick.name}: to‘lov belgilandi, darslar ochildi`)
      await reload()
    } catch (e) {
      setMsg(e.message || 'Belgilanmadi')
    } finally {
      setBusy(false)
    }
  }

  const exportCsv = () => downloadCsv(`tolovlar-${new Date().toISOString().slice(0, 10)}.csv`,
    ['O‘quvchi', 'Kurs', 'Summa', 'Holat', 'Usul', 'Yozilgan', 'To‘langan', 'Izoh'],
    list.map((r) => [r.name, r.courseTitle, r.amount || 0, PAY[r.paymentStatus]?.label || r.paymentStatus, METHOD[r.method] || '', dmy(r.enrolledAt, true), r.paidAt ? dmy(r.paidAt, true) : '', r.note || '']))

  return (
    <div>
      <PageHead
        title="To‘lovlar"
        sub="Pullik kurslarga yozilishlar va ularning to‘lov holati"
        actions={<button type="button" onClick={exportCsv} disabled={!list.length} className={btn.ghost}><Download className="size-4" /> CSV eksport</button>}
      />
      <MigrationNotice show={!!data?.legacy} text="To‘lovlar ro‘yxati va «To‘landi deb belgilash» 0078 migratsiyasi qo‘llangach ishlaydi." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-[1fr_1fr_1.25fr] lg:gap-4">
        <Kpi icon={CheckCircle2} label="To‘langan" value={<Money v={totals.paid} />} foot={`${totals.paidN} ta yozilish`} />
        <Kpi icon={Clock3} label="To‘lov kutilmoqda" value={<Money v={totals.unpaid} />} foot={`${totals.unpaidN} ta kutmoqda`} tone="amber" />
        <article className="rounded-2xl border border-dashed border-[#C9D8DC] bg-[linear-gradient(135deg,#F7FBFB,#EEF6F5)] p-4 col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-white text-[#0F766E] ring-1 ring-[#DCE8EA]"><Landmark className="size-[18px]" /></span>
            <p className="text-[13.5px] font-bold text-[#0B1F3A]">Pul yechish (payout)</p>
            <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-[#7A8C99] ring-1 ring-[#DCE8EA]">Tez kunda</span>
          </div>
          <p className="mt-2.5 text-[12.5px] leading-relaxed text-[#4F6373]">
            Click va Payme hali ulanmagan. Hozircha to‘lovni o‘zingiz qabul qilasiz (naqd yoki karta orqali) va shu yerda «To‘landi» deb belgilaysiz. Platforma to‘lovi ulangach, hisob-kitob va karta rekvizitlari shu yerda chiqadi.
          </p>
        </article>
      </div>

      <div className="mb-4 mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented value={tab} onChange={setTab} items={[['all', 'Barchasi', rows.length], ['unpaid', 'Kutilmoqda', totals.unpaidN], ['paid', 'To‘langan', totals.paidN]]} />
        <label className="relative block lg:w-[300px]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8A9AA8]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="O‘quvchi yoki kurs" className={cx(input, 'pl-10')} />
        </label>
      </div>

      {msg && <p role="status" className="mb-3 rounded-xl bg-[#E9F6F4] px-3.5 py-2.5 text-[13px] font-medium text-[#0B5F57]">{msg}</p>}

      {status === 'loading' ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-[72px] animate-pulse rounded-2xl bg-white" />)}</div>
      ) : status === 'error' ? (
        <Panel><Empty title="To‘lovlar ochilmadi" text={error} /></Panel>
      ) : !rows.length ? (
        <Panel><Empty icon={Wallet} title="Hali to‘lov yo‘q" text={data?.legacy ? 'Migratsiya qo‘llangach ro‘yxat shu yerda chiqadi.' : 'Pullik kursingizga yozilish bo‘lganda shu yerda ko‘rinadi.'} /></Panel>
      ) : !list.length ? (
        <Panel><Empty icon={Search} title="Mos yozuv topilmadi" text="Filtrni o‘zgartiring." /></Panel>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-[#E4ECEE] bg-white shadow-[0_1px_2px_rgb(16_40_60/0.04)] lg:block">
            <table className="w-full table-fixed text-left">
              <thead className="border-b border-[#EEF3F5] bg-[#FAFCFC] text-[11.5px] font-bold uppercase tracking-[0.08em] text-[#7A8C99]">
                <tr>
                  <th className="w-[30%] px-5 py-3">O‘quvchi</th>
                  <th className="w-[14%] px-3 py-3">Summa</th>
                  <th className="w-[15%] px-3 py-3">Sana</th>
                  <th className="w-[12%] px-3 py-3">Holat</th>
                  <th className="w-[12%] px-3 py-3">Usul</th>
                  <th className="w-[17%] px-3 py-3 text-right">Amal</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={`${r.userId}:${r.courseId}`} className="border-b border-[#EEF3F5] last:border-0 hover:bg-[#FAFCFC]">
                    <td className="px-5 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar src={r.avatar} name={r.name} size={38} />
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-semibold text-[#0B1F3A]">{r.name}</p>
                          <CourseTitle className="text-[12.5px] text-[#6B7F8D]">{r.courseTitle}</CourseTitle>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[14px] font-bold text-[#0B1F3A]">{som(r.amount)}</td>
                    <td className="px-3 py-3 text-[12.5px] text-[#3F5263]">{dmy(r.paidAt || r.enrolledAt, true)}<span className="block text-[11.5px] text-[#8A9AA8]">{r.paidAt ? 'to‘langan' : 'yozilgan'}</span></td>
                    <td className="px-3 py-3"><PayPill status={r.paymentStatus} /></td>
                    <td className="px-3 py-3 text-[13px] text-[#3F5263]">{METHOD[r.method] || '—'}</td>
                    <td className="px-3 py-3 text-right">
                      {r.paymentStatus === 'unpaid' ? <button type="button" onClick={() => open(r)} className={cx(btn.soft, 'min-h-10 whitespace-nowrap px-3 text-[13px]')}><CheckCircle2 className="size-4" /> To‘landi</button> : <span className="text-[12px] text-[#98A8B3]">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-2.5 lg:hidden">
            {list.map((r) => (
              <article key={`${r.userId}:${r.courseId}`} className="rounded-2xl border border-[#E4ECEE] bg-white p-3.5 shadow-[0_1px_2px_rgb(16_40_60/0.04)]">
                <div className="flex items-center gap-3">
                  <Avatar src={r.avatar} name={r.name} size={42} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-semibold text-[#0B1F3A]">{r.name}</p>
                    <CourseTitle className="text-[12.5px] text-[#6B7F8D]">{r.courseTitle}</CourseTitle>
                  </div>
                  <p className="text-[14.5px] font-bold text-[#0B1F3A]">{som(r.amount)}</p>
                </div>
                <div className="mt-3 flex items-center gap-2 text-[12.5px] text-[#5B6F7E]">
                  <PayPill status={r.paymentStatus} />
                  <span className="truncate">{dmy(r.paidAt || r.enrolledAt)}{r.method ? ` · ${METHOD[r.method]}` : ''}</span>
                </div>
                {r.paymentStatus === 'unpaid' && <button type="button" onClick={() => open(r)} className={cx(btn.soft, 'mt-3 w-full')}>To‘landi deb belgilash</button>}
              </article>
            ))}
          </div>
        </>
      )}

      <Sheet open={!!pick} title="To‘landi deb belgilash" sub={pick ? `${pick.name} · ${pick.courseTitle} · ${som(pick.amount)}` : ''} onClose={() => !busy && setPick(null)}
        footer={<><button type="button" className={btn.ghost} disabled={busy} onClick={() => setPick(null)}>Bekor qilish</button><button type="button" className={btn.primary} disabled={busy} onClick={confirm}>{busy ? 'Saqlanmoqda…' : 'Tasdiqlash'}</button></>}>
        <p className="flex items-start gap-2 rounded-xl bg-[#FFFAF0] px-3 py-2.5 text-[12.5px] leading-snug text-[#7A4B00]">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" /> Faqat pulni haqiqatan olgan bo‘lsangiz belgilang. O‘quvchiga darslar darhol ochiladi, bu amal jurnalga yoziladi va qaytarilmaydi.
        </p>
        <p className="mb-1.5 mt-4 text-[12.5px] font-semibold text-[#3F5263]">To‘lov usuli</p>
        <div className="grid grid-cols-3 gap-2">
          {[['cash', 'Naqd'], ['transfer', 'Karta'], ['other', 'Boshqa']].map(([k, l]) => (
            <button key={k} type="button" onClick={() => setMethod(k)} className={cx('min-h-11 rounded-xl border text-[13.5px] font-semibold', method === k ? 'border-[#0F766E] bg-[#E9F6F4] text-[#0F766E]' : 'border-[#D8E3E6] text-[#3F5263]')}>{l}</button>
          ))}
        </div>
        <label className="mt-4 block text-[12.5px] font-semibold text-[#3F5263]">Izoh (ixtiyoriy)
          <input value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder="Masalan: 17-noyabr, karta orqali" className={cx(input, 'mt-1.5')} />
        </label>
      </Sheet>
    </div>
  )
}

function Money({ v }) {
  return (
    <>
      <span className="sm:hidden">{shortSom(v)} so‘m</span>
      <span className="hidden sm:inline">{som(v)}</span>
    </>
  )
}
