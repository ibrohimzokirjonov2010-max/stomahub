import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Calendar, Check, ChevronLeft, Clock, Copy, MapPin, Pencil, Plus, Ticket, Trash2, Users, Wallet, QrCode, Award, MessageSquare } from 'lucide-react'
import { CHECKINS, DETAIL, PAYMENTS, SEMINARS, som } from '../data'
import { useOrg } from '../Shell'
import { Badge, Btn, Card, Field, Kpi, MenuBtn, Modal, Tabs, inputCls } from '../ui'

const REASONS = ['Sana o‘zgardi', 'Ma’ruzachi kelmaydi', 'Joy topilmadi', 'Ishtirokchilar yetarli emas', 'Boshqa sabab']

export default function Detail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { notify } = useOrg()
  const exact = id === 'implant'
  const sem = exact ? null : SEMINARS.find((s) => s.id === id)
  const [tab, setTab] = useState('umumiy')
  const [cancel, setCancel] = useState(false)
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [ok, setOk] = useState(false)
  const [done, setDone] = useState(false)
  const [copied, setCopied] = useState(false)
  const [msg, setMsg] = useState('')

  if (!exact && !sem) {
    return <div className="py-16 text-center"><p className="font-semibold">Seminar topilmadi</p><Link to="/tashkilotchi/seminarlar" className="text-[#0c8f86]">Ro‘yxatga qaytish</Link></div>
  }

  const title = exact ? DETAIL.title : sem.title
  const image = exact ? DETAIL.image : sem.image
  const sold = exact ? DETAIL.sold : sem.sold
  const seats = exact ? DETAIL.seats : sem.seats
  const revenue = exact ? DETAIL.revenue : sem.revenue
  const pct = Math.round((sold / seats) * 100)

  const confirmCancel = () => {
    if (!reason || !ok) return
    setDone(true)
    setCancel(false)
    notify('Seminar bekor qilindi')
  }

  return (
    <div>
      <Link to="/tashkilotchi/seminarlar" className="mb-3 inline-flex items-center gap-1 text-[13px] text-[#5e787e] hover:text-[#0c8f86]"><ChevronLeft className="size-4" /> Seminarlar ro‘yxati</Link>
      <div className="flex flex-wrap items-start gap-4">
        <img src={image} alt="" className="h-24 w-36 rounded-2xl object-cover" />
        <div className="min-w-0 flex-1">
          <Badge tone="teal">{exact ? DETAIL.topic : sem.topic}</Badge>
          <h1 className="mt-1 text-[22px] font-bold leading-tight">{title}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-3 text-[13px] text-[#5e787e]">
            <span className="inline-flex items-center gap-1"><Calendar className="size-4 text-[#0c8f86]" /> {exact ? DETAIL.when : `${sem.date}, 10:00 – 18:00`}</span>
          </p>
          <p className="flex items-center gap-1 text-[13px] text-[#5e787e]"><MapPin className="size-4 text-[#0c8f86]" /> {exact ? DETAIL.place : sem.city}</p>
          <p className="pl-5 text-[12.5px] text-[#8aa0a4]">{exact ? DETAIL.city : 'O‘zbekiston'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={done ? 'red' : 'green'} dot>{done ? 'Bekor qilingan' : 'Faol'}</Badge>
          <MenuBtn items={[
            { icon: Pencil, label: 'Tahrirlash', onClick: () => navigate('/tashkilotchi/seminarlar/yangi?tahrir=implant') },
            { icon: Copy, label: 'Nusxalash', onClick: () => { setCopied(true); notify('Seminar nusxalandi') } },
            { icon: Trash2, label: 'Bekor qilish', danger: true, onClick: () => setCancel(true) },
          ]} />
        </div>
      </div>
      {copied && <p className="mt-2 text-[12.5px] text-[#0c8f86]">Nusxa qoralama sifatida yaratildi.</p>}

      <div className="mt-4 overflow-x-auto">
        <Tabs tabs={[
          { id: 'umumiy', label: 'Umumiy' },
          { id: 'people', label: 'Ishtirokchilar' },
          { id: 'tickets', label: 'Chiptalar' },
          { id: 'check', label: 'Check-in' },
          { id: 'pay', label: 'To‘lovlar' },
          { id: 'cert', label: 'Sertifikatlar' },
          { id: 'msg', label: 'Xabarlar' },
        ]} value={tab} onChange={setTab} />
      </div>

      {tab === 'umumiy' && (
        <>
          <section className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi icon={Ticket} label="Sotilgan chiptalar" value={`${sold} / ${seats}`} progress={pct} foot={`${pct}%`} />
            <Kpi icon={Wallet} label="Jami daromad" value={som(revenue)} />
            <Kpi icon={QrCode} label="Check-in qilganlar" value={String(exact ? DETAIL.checked : sold)} foot="100%" />
            <Kpi icon={Ticket} label="Qolgan chiptalar" value={exact ? `${DETAIL.left} ta` : `${seats - sold} ta`} />
          </section>
          <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-3">
              <Card title="Seminar tavsifi"><p className="text-[13.5px] leading-relaxed text-[#3e5a62]">{exact ? DETAIL.description : `${sem.title} — ${sem.days}. ${sem.speaker} ishtirokida.`}</p></Card>
              <div className="grid gap-3 sm:grid-cols-2">
                <Card><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#e7f7f4] text-[#0c8f86]"><Clock className="size-5" /></span><div><p className="text-[12px] text-[#7e9398]">Kredit soati</p><p className="text-[18px] font-bold">{exact ? DETAIL.hours : 8} soat</p><p className="text-[11.5px] text-[#8aa0a4]">Davomiy ta’lim uchun</p></div></div></Card>
                <Card><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#e7f7f4] text-[#0c8f86]"><Users className="size-5" /></span><div><p className="text-[12px] text-[#7e9398]">Minimal ishtirokchi soni</p><p className="text-[18px] font-bold">{exact ? DETAIL.minPeople : 15} kishi</p><p className="text-[11.5px] text-[#8aa0a4]">Seminar o‘tkazilishi uchun</p></div></div></Card>
              </div>
              <Card title="Ma’ruzachilar" extra={<button type="button" onClick={() => navigate('/tashkilotchi/seminarlar/yangi')} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#0c8f86]"><Plus className="size-3.5" /> Ma’ruzachi qo‘shish</button>}>
                <ul className="space-y-3">
                  {(exact ? DETAIL.speakers : [{ name: sem.speaker, role: sem.topic, avatar: '/images/avatar.jpg' }]).map((s) => (
                    <li key={s.name} className="flex items-center gap-3">
                      <img src={s.avatar} alt="" className="size-11 rounded-full object-cover" />
                      <div className="min-w-0 flex-1"><p className="font-semibold">{s.name}</p><p className="text-[12.5px] text-[#6e868c]">{s.role}</p></div>
                      <ChevronLeft className="size-4 rotate-180 text-[#c5d0d4]" />
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
            <div className="space-y-3">
              <Card title="Olib kelish kerak narsalar">
                <ul className="space-y-2 text-[13px]">{(exact ? DETAIL.bring : ['Noutbuk', 'Shaxsiy asboblar', 'Qulay kiyim']).map((b) => <li key={b} className="flex gap-2"><Check className="size-4 shrink-0 text-[#16a34a]" /> {b}</li>)}</ul>
              </Card>
              <Card title="Seminar joyi">
                <img src={exact ? DETAIL.venueImage : sem.image} alt="" className="h-28 w-full rounded-xl object-cover" />
                <p className="mt-2 font-semibold">{exact ? DETAIL.place : sem.city}</p>
                <p className="text-[12.5px] text-[#6e868c]">{exact ? DETAIL.city : sem.city}</p>
                <a href="https://maps.google.com/?q=Tashkent+City+Congress+Centre" target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#0c8f86]"><MapPin className="size-3.5" /> Xaritada ochish</a>
              </Card>
            </div>
          </div>
        </>
      )}

      {tab === 'people' && <Jump title="Ishtirokchilar" to="/tashkilotchi/ishtirokchilar" text={`${sold} kishi ro‘yxatdan o‘tgan.`} />}
      {tab === 'tickets' && <Jump title="Chiptalar" to="/tashkilotchi/chiptalar" text="Chipta turlari va sotuvlar." />}
      {tab === 'check' && (
        <Card className="mt-3" title="So‘nggi check-inlar">
          <ul className="space-y-2">{CHECKINS.slice(0, 5).map((c) => <li key={c.id} className="flex items-center justify-between text-[13px]"><span>{c.name}</span><Badge tone={c.ok ? 'green' : 'red'}>{c.ok ? 'Kirish qildi' : 'Bekor'}</Badge></li>)}</ul>
          <Btn className="mt-3" to="/tashkilotchi/qr">QR Check-in</Btn>
        </Card>
      )}
      {tab === 'pay' && (
        <Card className="mt-3" title="To‘lovlar">
          <ul className="space-y-2 text-[13px]">{PAYMENTS.slice(0, 4).map((p) => <li key={p.id} className="flex justify-between"><span>{p.who}</span><b>{som(p.sum)}</b></li>)}</ul>
          <Btn className="mt-3" to="/tashkilotchi/tolovlar">Barcha to‘lovlar</Btn>
        </Card>
      )}
      {tab === 'cert' && <Jump title="Sertifikatlar" to="/tashkilotchi/sertifikatlar" text="Berilgan sertifikatlarni ko‘ring va yuklab oling." />}
      {tab === 'msg' && (
        <Card className="mt-3" title="Xabar yuborish">
          <Field label="Ishtirokchilarga xabar" error={msg.trim().length > 0 && msg.trim().length < 5 ? 'Kamida 5 ta belgi' : ''}>
            <textarea className={`${inputCls()} h-24 py-2`} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Eslatma yoki o‘zgarish haqida yozing..." />
          </Field>
          <Btn className="mt-3" onClick={() => { if (msg.trim().length < 5) return; setMsg(''); notify('Xabar yuborildi') }}>Yuborish</Btn>
        </Card>
      )}

      <Modal open={cancel} title="Seminarni bekor qilish" sub="Seminarni bekor qilmoqchimisiz? Bu amalni keyin qaytarib bo‘lmaydi." onClose={() => setCancel(false)} width={480}>
        <Field label="Bekor qilish sababi">
          <select className={inputCls()} value={reason} onChange={(e) => setReason(e.target.value)}>
            <option value="">Sababni tanlang</option>
            {REASONS.map((r) => <option key={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="Qo‘shimcha izoh (ixtiyoriy)">
          <textarea maxLength={500} className={`${inputCls()} mt-2 h-24 py-2`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Bekor qilish sababini batafsil yozing..." />
          <span className="mt-1 block text-right text-[11px] text-[#9aafb4]">{note.length}/500</span>
        </Field>
        <div className="mt-3 rounded-xl bg-[#f3fbfa] p-3 text-[12.5px]">
          <p className="mb-1 flex items-center gap-1 font-semibold"><span className="text-[#0c8f86]">i</span> Nimalar bo‘ladi?</p>
          <ul className="space-y-1 text-[#3e5a62]">
            <li className="flex gap-1"><Check className="size-3.5 text-[#16a34a]" /> {exact ? 42 : sold} ishtirokchiga 100% pul avtomatik qaytariladi</li>
            <li className="flex gap-1"><Check className="size-3.5 text-[#16a34a]" /> Jami qaytariladigan summa: {som(exact ? DETAIL.refundSum : Math.round(revenue * 0.48))}</li>
            <li className="flex gap-1"><Check className="size-3.5 text-[#16a34a]" /> Ishtirokchilarga seminar bekor qilingani haqida SMS va email yuboriladi.</li>
            <li className="flex gap-1"><Check className="size-3.5 text-[#16a34a]" /> Seminar sahifasi “Bekor qilingan” holatiga o‘tadi.</li>
          </ul>
        </div>
        <label className="mt-3 flex items-start gap-2 text-[12.5px]"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} className="mt-0.5" /> Tushundim. Seminar bekor qilinganda barcha ishtirokchilarga pul qaytariladi va bu amalni qaytarib bo‘lmaydi.</label>
        {!reason && ok && <p className="mt-1 text-[12px] text-[#e11d48]">Sababni tanlang</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Btn kind="soft" onClick={() => setCancel(false)}>Ortga</Btn>
          <Btn onClick={confirmCancel}>Bekor qilishni tasdiqlash</Btn>
        </div>
      </Modal>
    </div>
  )
}

function Jump({ title, to, text }) {
  return (
    <Card className="mt-3" title={title}>
      <p className="text-[13px] text-[#5e787e]">{text}</p>
      <Btn className="mt-3" to={to}>Ochish</Btn>
    </Card>
  )
}
