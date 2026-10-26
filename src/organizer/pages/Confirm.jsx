import { useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Award, Building2, Calendar, Camera, Check, ChevronLeft, Clock, FileText, Image as ImageIcon,
  Info, MapPin, Pencil, Send, Ticket, Upload, Users, Wallet, X,
} from 'lucide-react'
import { ToothIcon } from '../../components/icons'
import { som } from '../data'
import { confirmHeld, FEE, useHub } from '../../hubStore'
import { useOrg } from '../Shell'
import { Modal } from '../ui'

const TEETH = '/images/seminars/teeth.jpg'

const PHOTOS = [
  { id: 'h1', src: '/images/organizer/confirm/hall-1.jpg' },
  { id: 'h2', src: '/images/organizer/confirm/hall-2.jpg' },
  { id: 'h3', src: '/images/organizer/confirm/hall-3.jpg' },
  { id: 'h4', src: '/images/organizer/confirm/hall-4.jpg' },
]

const PEOPLE = [
  { name: 'Aliyeva Mohira', phone: '+998 90 123 45 67', time: '21.10.2026, 09:12', avatar: '/images/bemorlar/bemor-mohira.jpg' },
  { name: 'Karimov Bekzod', phone: '+998 91 234 56 78', time: '21.10.2026, 09:18', avatar: '/images/seller-1.jpg' },
  { name: 'Toirov Dilshod', phone: '+998 93 345 67 89', time: '21.10.2026, 09:21', avatar: '/images/ustalar/usta-dilshod.jpg' },
  { name: 'Saydova Malika', phone: '+998 90 456 78 90', time: '21.10.2026, 09:25', avatar: '/images/bemorlar/bemor-malika.jpg' },
  { name: 'Usmonov Javohir', phone: '+998 91 567 89 01', time: '21.10.2026, 09:27', avatar: '/images/ustalar/usta-jasur.jpg' },
  { name: 'Karimova Nilufar', phone: '+998 97 210 33 45', time: '21.10.2026, 09:31', avatar: '/images/forma/woman-navy.jpg' },
  { name: 'Rahimov Sardor', phone: '+998 93 778 12 06', time: '21.10.2026, 09:36', avatar: '/images/ustalar/usta-sardor.jpg' },
]

const NOTES = [
  'Zal rasmlari, ishtirokchilar ro‘yxati va sertifikatlar yuklangandan keyin to‘lov so‘rovini yuborish mumkin.',
  'Ma’lumotlar StomaHub tomonidan tekshiriladi.',
  'Tasdiqlangandan so‘ng pul avtomatik ravishda hamyoningizga o‘tkaziladi.',
  'Tekshiruv odatda 1–3 ish kuni davom etadi.',
]

const FACTS = [
  { icon: Calendar, k: 'Sana', v: '21 oktabr 2026, 09:00 — 18:00' },
  { icon: MapPin, k: 'Manzil', v: 'Toshkent, O‘zbekiston' },
  { icon: Building2, k: 'Zal', v: 'Tashkent City Kongress Markazi' },
  { icon: Users, k: 'Ishtirokchilar', v: '50 kishi' },
  { icon: Ticket, k: 'Chipta narxi', v: som(350000) },
  { icon: Wallet, k: 'Jami daromad', v: som(17500000) },
]

const card = 'rounded-2xl border border-[#e6f1ef] bg-white shadow-[0_1px_2px_rgb(16_48_48/0.04)]'

export default function Confirm() {
  const { notify } = useOrg()
  const { id } = useParams()
  const hub = useHub()
  const sem = useMemo(() => {
    const key = id === 'implant' ? 'implant-nov' : id
    return hub.seminars.find((s) => s.id === key) || hub.seminars.find((s) => s.status === 'yakunlangan') || hub.seminars[0]
  }, [hub.seminars, id])
  const people = hub.participants.filter((p) => p.seminarId === sem?.id)
  const arrived = people.filter((p) => p.arrived)
  const shown = (arrived.length ? arrived : people).slice(0, 8).map((p) => ({ name: p.name, phone: p.phone, time: p.registered, avatar: p.avatar }))
  const pays = hub.payments.filter((p) => p.seminarId === sem?.id && p.state === 'ok')
  const revenue = pays.reduce((n, p) => n + (Number(p.sum) || 0), 0)
  const fee = Math.round(revenue * FEE)
  const net = Math.max(0, revenue - fee)
  const meta = {
    id: sem?.id,
    topic: sem?.topic || 'Seminar',
    title: sem?.title || 'Seminar',
    image: sem?.image || TEETH,
    when: `${sem?.date || ''}${sem?.startTime ? `, ${sem.startTime}` : ''}${sem?.endTime ? ` — ${sem.endTime}` : ''}`,
    place: sem?.place || sem?.city || '',
    people: people.length,
    revenue,
    fee,
    net,
    certs: hub.certs.filter((c) => !c.seminarId || c.seminarId === sem?.id).filter((c) => c.state === 'done').length,
    edit: `/tashkilotchi/seminarlar/yangi?tahrir=${sem?.id || ''}`,
    facts: [
      { icon: Calendar, k: 'Sana', v: sem?.date || '—' },
      { icon: MapPin, k: 'Manzil', v: sem?.city || '—' },
      { icon: Building2, k: 'Zal', v: sem?.place || '—' },
      { icon: Users, k: 'Ishtirokchilar', v: `${people.length} kishi` },
      { icon: Ticket, k: 'Chipta narxi', v: som(sem?.tickets?.[0]?.price || 0) },
      { icon: Wallet, k: 'Jami daromad', v: som(revenue) },
    ],
  }
  const [photos, setPhotos] = useState(PHOTOS)
  const [dirty, setDirty] = useState(false)
  const [all, setAll] = useState(false)
  const [askOpen, setAskOpen] = useState(false)
  const [over, setOver] = useState(false)
  const inputRef = useRef(null)
  const inputRefM = useRef(null)

  const countLabel = dirty ? photos.length : 5
  const source = shown.length ? shown : PEOPLE
  const rows = all ? source : source.slice(0, 5)

  const add = (file) => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { notify('Rasm 10 MB dan katta'); return }
    if (!/^image\/(png|jpeg)$/.test(file.type)) { notify('Faqat JPG yoki PNG'); return }
    if (photos.length >= 10) { notify('Ko‘pi bilan 10 ta rasm'); return }
    setDirty(true)
    setPhotos((list) => [...list, { id: `${Date.now()}`, src: URL.createObjectURL(file) }])
  }

  const remove = (id) => {
    setDirty(true)
    setPhotos((list) => list.filter((p) => p.id !== id))
  }

  const onDrop = (e) => {
    e.preventDefault()
    setOver(false)
    add(e.dataTransfer.files?.[0])
  }

  const ask = () => {
    if (photos.length < 3) { notify('Kamida 3 ta zal rasmi kerak'); return }
    if (sem?.id) confirmHeld(sem.id)
    setAskOpen(false)
    notify('Pul so‘rovi yuborildi')
  }

  const openAsk = () => {
    if (photos.length < 3) { notify('Kamida 3 ta zal rasmi kerak'); return }
    setAskOpen(true)
  }

  return (
    <>
      <div className="hidden lg:block">
        <Desktop
          photos={photos}
          countLabel={countLabel}
          rows={rows}
          all={all}
          setAll={setAll}
          over={over}
          setOver={setOver}
          onDrop={onDrop}
          add={add}
          remove={remove}
          inputRef={inputRef}
          onAsk={openAsk}
          meta={meta}
        />
      </div>
      <div className="lg:hidden">
        <Mobile
          photos={photos}
          add={add}
          remove={remove}
          inputRef={inputRefM}
          onAsk={openAsk}
          meta={meta}
        />
      </div>
      <Modal open={askOpen} title="Pulni so‘rash" sub={`${som(net)} hamyoningizga so‘raladi.`} onClose={() => setAskOpen(false)}>
        <p className="text-[13px] leading-relaxed text-[#3e5a62]">Zal rasmlari va ishtirokchilar ro‘yxati tekshiruvga yuboriladi.</p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={() => setAskOpen(false)} className="inline-flex h-10 items-center rounded-xl border border-[#e4eeec] bg-white px-3.5 text-[13px] font-semibold text-[#1c4a5a]">Ortga</button>
          <button type="button" onClick={ask} className="inline-flex h-10 items-center rounded-xl bg-[var(--color-org-teal)] px-3.5 text-[13px] font-semibold text-white">So‘rovni yuborish</button>
        </div>
      </Modal>
    </>
  )
}

function Desktop({ photos, countLabel, rows, all, setAll, over, setOver, onDrop, add, remove, inputRef, onAsk, meta }) {
  return (
    <div className="grid items-start gap-3.5" style={{ gridTemplateColumns: 'minmax(0,1fr) 308px' }}>
      <div className="min-w-0">
        <Link to="/tashkilotchi/seminarlar" className="inline-flex items-center gap-0.5 text-[13px] font-medium text-[#6d868c] hover:text-[var(--color-org-teal)]">
          <ChevronLeft className="size-4" strokeWidth={2} /> Seminarlar
        </Link>
        <h1 className="mt-1 text-[24px] font-bold leading-tight tracking-[-0.02em] text-[#123044]">O‘tkazilganini tasdiqlash</h1>
        <p className="mt-1 max-w-[640px] text-[13px] leading-[1.45] text-[#7b9197]">
          Seminar yakunlangandan so‘ng ma’lumotlarni yuboring. StomaHub tekshiruvidan o‘tilgach, to‘lovni chiqaradi.
        </p>

        <div className="mt-4 space-y-3">
          <section className={`${card} flex items-center gap-3.5 px-4 py-3.5`}>
            <img src={meta.image} alt="" className="h-[72px] w-[92px] shrink-0 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <span className="inline-flex h-[22px] items-center rounded-full bg-[#e7f6f3] px-2 text-[11px] font-semibold text-[var(--color-org-teal)]">{meta.topic}</span>
              <p className="mt-1 text-[15.5px] font-bold leading-tight text-[#123044]">{meta.title}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-[#6e868c]">
                <span className="inline-flex items-center gap-1.5"><Calendar className="size-3.5 text-[var(--color-org-teal)]" /> {meta.when}</span>
                <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5 text-[var(--color-org-teal)]" /> {meta.place}</span>
                <span className="inline-flex items-center gap-1.5"><Users className="size-3.5 text-[var(--color-org-teal)]" /> {meta.people} ishtirokchi</span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2.5 rounded-2xl bg-[#fff7ea] px-3 py-2">
              <span className="grid size-9 place-items-center rounded-full bg-[#ffe8c2] text-[#e09a1a]">
                <Clock className="size-[18px]" strokeWidth={2} />
              </span>
              <div className="leading-tight">
                <p className="text-[13px] font-bold text-[#d08a12]">Tekshiruvda</p>
                <p className="mt-0.5 text-[11.5px] text-[#8a97a0]">Ma’lumotlaringiz tekshirilmoqda.</p>
              </div>
            </div>
          </section>

          <DesktopSteps />

          <section className={`${card} p-4`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <Num n="1" />
                <div>
                  <h2 className="text-[15px] font-bold leading-tight text-[#123044]">Zal rasmlari</h2>
                  <p className="mt-0.5 text-[12.5px] leading-snug text-[#7d9398]">Seminar o‘tkazilganini tasdiqlovchi zal rasmlarini yuklang (kamida 3-5 ta).</p>
                </div>
              </div>
              <p className="shrink-0 pt-0.5 text-[12.5px] font-semibold text-[var(--color-org-teal)]">{countLabel} / 10 rasm yuklandi</p>
            </div>
            <div className="mt-3.5 flex h-[112px] gap-2">
              <label
                className={`flex w-[156px] shrink-0 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-2.5 text-center ${over ? 'border-[var(--color-org-teal)] bg-[#eef9f7]' : 'border-[#b7e3da] bg-[#f7fcfb]'}`}
                onDragOver={(e) => { e.preventDefault(); setOver(true) }}
                onDragLeave={() => setOver(false)}
                onDrop={onDrop}
              >
                <p className="text-[11.5px] font-medium leading-snug text-[#3d5962]">Rasmlarni shu yerga tashlang yoki tanlang</p>
                <p className="mt-0.5 text-[10.5px] leading-snug text-[#8aa0a4]">JPG, PNG formatda. Har bir rasm 10 MB gacha.</p>
                <span className="mt-2 inline-flex h-7 items-center gap-1 rounded-lg border border-[#cfe7e2] bg-white px-2 text-[12px] font-semibold text-[var(--color-org-teal)]">
                  <Upload className="size-3.5" /> Rasm tanlash
                </span>
                <input ref={inputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => { add(e.target.files?.[0]); e.target.value = '' }} />
              </label>
              {photos.map((p) => (
                <div key={p.id} className="relative min-w-0 flex-1 overflow-hidden rounded-xl">
                  <img src={p.src} alt="" className="size-full object-cover" />
                  <button type="button" aria-label="Olib tashlash" onClick={() => remove(p.id)} className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-white text-[#3e5560] shadow-[0_1px_4px_rgb(16_32_32/0.2)]">
                    <X className="size-3" strokeWidth={2.4} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className={`${card} p-4`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <Num n="2" />
                <div>
                  <h2 className="text-[15px] font-bold leading-tight text-[#123044]">Ishtirokchilar ro‘yxati</h2>
                  <p className="mt-0.5 text-[12.5px] leading-snug text-[#7d9398]">Ro‘yxat avtomatik ravishda QR check-in ma’lumotlari asosida shakllantiriladi.</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2.5 pt-0.5">
                <span className="text-[13px] font-semibold text-[var(--color-org-teal)]">42 / 50 keldi</span>
                <button type="button" onClick={() => setAll((v) => !v)} className="inline-flex h-8 items-center rounded-lg border border-[#d5ebe6] bg-white px-3 text-[12.5px] font-semibold text-[var(--color-org-teal)] hover:bg-[#f4fbfa]">
                  {all ? 'Yig‘ish' : 'Barchasini ko‘rish'}
                </button>
              </div>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#eef3f2] text-[12px] font-medium text-[#93a6ab]">
                    <th className="w-8 py-2 pr-2 font-medium">#</th>
                    <th className="py-2 pr-3 font-medium">Ism familiya</th>
                    <th className="py-2 pr-3 font-medium">Telefon raqam</th>
                    <th className="py-2 pr-3 font-medium">Check-in vaqti</th>
                    <th className="py-2 font-medium">Holat</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p, i) => (
                    <tr key={p.name} className="border-b border-[#f3f7f6] last:border-0">
                      <td className="py-2.5 pr-2 text-[12.5px] text-[#8aa0a4]">{i + 1}</td>
                      <td className="py-2.5 pr-3">
                        <span className="flex items-center gap-2">
                          <img src={p.avatar} alt="" className="size-7 rounded-full object-cover" />
                          <span className="text-[13px] font-semibold text-[#143044]">{p.name}</span>
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-[12.5px] text-[#3e5962]">{p.phone}</td>
                      <td className="py-2.5 pr-3 text-[12.5px] text-[#3e5962]">{p.time}</td>
                      <td className="py-2.5">
                        <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#16a34a]">
                          <span className="grid size-4 place-items-center rounded-full bg-[#16a34a] text-white"><Check className="size-2.5" strokeWidth={3} /></span>
                          Keldi
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={`${card} p-4`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <Num n="3" />
                <div>
                  <h2 className="text-[15px] font-bold leading-tight text-[#123044]">Berilgan sertifikatlar</h2>
                  <p className="mt-0.5 text-[12.5px] leading-snug text-[#7d9398]">Seminarda qatnashgan ishtirokchilarga sertifikatlar berilganini tasdiqlang.</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3 pt-0.5">
                <span className="text-[12.5px] font-semibold text-[var(--color-org-teal)]">{meta.certs} ta sertifikat berilgan</span>
                <Link to="/tashkilotchi/sertifikatlar" className="text-[12.5px] font-semibold text-[var(--color-org-teal)] hover:underline">Sertifikatlar ro‘yxati</Link>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-2.5">
              {PEOPLE.slice(0, 5).map((p) => <MiniCert key={p.name} name={p.name} />)}
            </div>
            <div className="mt-2.5 flex justify-end">
              <Link to="/tashkilotchi/sertifikatlar" className="text-[12.5px] font-semibold text-[var(--color-org-teal)] hover:underline">Barchasini ko‘rish</Link>
            </div>
          </section>

          <button type="button" onClick={onAsk} className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-org-teal)] text-[15px] font-semibold text-white shadow-[0_8px_18px_rgb(12_143_134/0.28)] hover:bg-[#0a7e76]">
            <Wallet className="size-[18px]" strokeWidth={2} />
            Pulni so‘rash
            <span aria-hidden>→</span>
          </button>
        </div>
      </div>

      <aside className="space-y-3">
        <section className={`${card} p-4`}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[14.5px] font-bold text-[#123044]">Seminar ma’lumotlari</h3>
            <Link to={meta.edit} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--color-org-teal)]">
              <Pencil className="size-3.5" /> Tahrirlash
            </Link>
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <img src={meta.image} alt="" className="size-14 shrink-0 rounded-xl object-cover" />
            <div className="min-w-0">
              <span className="inline-flex h-5 items-center rounded-full bg-[#e7f6f3] px-2 text-[10.5px] font-semibold text-[var(--color-org-teal)]">{meta.topic}</span>
              <p className="mt-1 text-[13px] font-bold leading-snug text-[#123044]">{meta.title}</p>
            </div>
          </div>
          <dl className="mt-3 space-y-2">
            {meta.facts.map((f) => (
              <div key={f.k} className="flex items-start gap-2 text-[12.5px]">
                <f.icon className="mt-0.5 size-4 shrink-0 text-[var(--color-org-teal)]" strokeWidth={1.8} />
                <dt className="shrink-0 text-[#8aa0a4]">{f.k}</dt>
                <dd className="ml-auto text-right font-medium leading-snug text-[#143044]">{f.v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className={`${card} p-4`}>
          <h3 className="text-[14.5px] font-bold text-[#123044]">To‘lov hisob-kitobi</h3>
          <div className="mt-2.5 space-y-2 text-[12.5px]">
            <div className="flex items-center justify-between gap-3 border-b border-[#f1f5f4] pb-2">
              <span className="text-[#8aa0a4]">Jami daromad</span>
              <span className="font-semibold text-[#143044]">{som(meta.revenue)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-[#f1f5f4] pb-2">
              <span className="text-[#8aa0a4]">Platforma komissiyasi (12%)</span>
              <span className="font-semibold text-[#143044]">{som(meta.fee)}</span>
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl bg-[#e7f7f4] px-2.5 py-2.5">
            <span className="text-[12px] font-bold leading-tight text-[var(--color-org-teal)]">Sizga o‘tkaziladigan summa</span>
            <span className="shrink-0 text-[12.5px] font-bold text-[var(--color-org-teal)]">{som(meta.net)}</span>
          </div>
        </section>

        <section className="rounded-2xl bg-[#f3fbf9] p-4">
          <p className="flex items-center gap-2 text-[13.5px] font-bold text-[#123044]">
            <span className="grid size-5 place-items-center rounded-full text-[var(--color-org-teal)]"><Info className="size-4" /></span>
            Muhim ma’lumotlar
          </p>
          <ul className="mt-2.5 space-y-2 text-[12px] leading-[1.45] text-[#3e5962]">
            {NOTES.map((n) => (
              <li key={n} className="flex gap-2">
                <span className="mt-[7px] size-1 shrink-0 rounded-full bg-[#8aa0a4]" />
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  )
}

function DesktopSteps() {
  const steps = [
    { n: '1', title: 'Yuborildi', sub: '21.10.2026, 18:30', tone: 'done' },
    { n: '2', title: 'StomaHub tekshiruvi', sub: 'Hozirgi bosqich', tone: 'now' },
    { n: '3', title: 'Tasdiqlandi', sub: 'Kutilmoqda', tone: 'wait' },
    { n: '4', title: 'Pul o‘tkazildi', sub: 'Kutilmoqda', tone: 'wait' },
  ]
  return (
    <section className={`${card} px-6 py-4`}>
      <ol className="relative grid grid-cols-4">
        <span className="absolute top-[13px] h-[2px] bg-[#e6eeed]" style={{ left: '12.5%', right: '12.5%' }} />
        <span className="absolute top-[13px] h-[2px] bg-[var(--color-org-teal)]" style={{ left: '12.5%', width: '25%' }} />
        {steps.map((s) => (
          <li key={s.n} className="relative flex flex-col items-center text-center">
            <span className={`relative z-10 grid size-7 place-items-center rounded-full text-[13px] font-bold ${s.tone === 'wait' ? 'bg-[#eef2f3] text-[#9aadb2]' : 'bg-[var(--color-org-teal)] text-white'}`}>{s.n}</span>
            <p className="mt-2.5 whitespace-nowrap text-[12.5px] font-semibold text-[#143044]">{s.title}</p>
            <p className={`mt-0.5 text-[11.5px] ${s.tone === 'now' ? 'font-medium text-[var(--color-org-teal)]' : 'text-[#8aa0a6]'}`}>{s.sub}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Mobile({ photos, add, remove, inputRef, onAsk, meta }) {
  const steps = [
    { key: 'done', title: 'Yuborildi', sub: '21.10.2026', sub2: '18:45' },
    { key: 'now', title: 'Tekshiruv', sub: 'Ma’lumotlar tomonidan tekshirilmoqda' },
    { key: 'wait', title: 'Tasdiqlandi', sub: '—' },
    { key: 'wait', title: 'Pul o‘tkazildi', sub: '—' },
  ]
  return (
    <div className="space-y-3 pb-1">
      <section className={`${card} flex gap-3 p-3`}>
        <img src={meta.image} alt="" className="h-[76px] w-[76px] shrink-0 rounded-xl object-cover" />
        <div className="min-w-0">
          <span className="inline-flex h-5 items-center rounded-full bg-[#e7f6f3] px-2 text-[10.5px] font-semibold text-[var(--color-org-teal)]">{meta.topic}</span>
          <p className="mt-1 text-[14.5px] font-bold leading-tight text-[#123044]">{meta.title}</p>
          <p className="mt-1.5 flex items-start gap-1.5 text-[11.5px] leading-snug text-[#5e787e]">
            <Calendar className="mt-0.5 size-3.5 shrink-0 text-[var(--color-org-teal)]" /> {meta.when}
          </p>
          <p className="mt-1 flex items-start gap-1.5 text-[11.5px] leading-snug text-[#5e787e]">
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-[var(--color-org-teal)]" /> {meta.place}
          </p>
        </div>
      </section>

      <div>
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-[16px] font-bold leading-snug text-[#123044]">Seminar o‘tkazilganini tasdiqlash</h2>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#fff6e8] px-2 py-1 text-[11px] font-bold text-[#d08a12]">
            <Clock className="size-3.5" /> Tekshiruvda
          </span>
        </div>
        <p className="mt-1 text-[12px] leading-snug text-[#7b9197]">Seminar muvaffaqiyatli o‘tkazilganini tasdiqlash uchun ma’lumotlarni yuklang.</p>
      </div>

      <ol className="relative grid grid-cols-4 pt-0.5">
        <span className="absolute top-[10px] h-[3px] rounded-full bg-[#e6eeed]" style={{ left: '12.5%', right: '12.5%' }} />
        <span className="absolute top-[10px] h-[3px] rounded-full bg-[#14a394]" style={{ left: '12.5%', width: '25%' }} />
        {steps.map((s) => (
          <li key={s.title} className="relative flex flex-col items-center px-0.5 text-center">
            {s.key === 'done' ? (
              <span className="relative z-10 grid size-[22px] place-items-center rounded-full bg-[#12a37a] text-white">
                <Check className="size-3" strokeWidth={3} />
              </span>
            ) : s.key === 'now' ? (
              <span className="relative z-10 size-[22px] rounded-full bg-[var(--color-org-teal)]" />
            ) : (
              <span className="relative z-10 size-[22px] rounded-full border-2 border-[#d5e0e2] bg-white" />
            )}
            <p className={`mt-2 text-[10.5px] font-semibold leading-tight ${s.key === 'wait' ? 'text-[#93a6ab]' : s.key === 'now' ? 'text-[var(--color-org-teal)]' : 'text-[#143044]'}`}>{s.title}</p>
            <p className="mt-0.5 text-[9.5px] leading-tight text-[#8aa0a6]">{s.sub}</p>
            {s.sub2 && <p className="text-[9.5px] leading-tight text-[#8aa0a6]">{s.sub2}</p>}
          </li>
        ))}
      </ol>

      <section>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[15px] font-bold text-[#123044]">Zal fotosuratlari</h3>
          <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#cfe7e2] bg-white px-2.5 text-[12px] font-semibold text-[var(--color-org-teal)]">
            <Camera className="size-3.5" /> Rasm yuklash
          </button>
        </div>
        <p className="mt-1 text-[12px] text-[#7d9398]">Seminardan fotosuratlarni yuklang (kamida 3 ta).</p>
        <div className="mt-2.5 grid grid-cols-2 gap-2.5">
          {photos.map((p) => (
            <div key={p.id} className="relative aspect-[16/10] overflow-hidden rounded-2xl">
              <img src={p.src} alt="" className="size-full object-cover" />
              <button type="button" aria-label="Olib tashlash" onClick={() => remove(p.id)} className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-white text-[#3e5560] shadow-[0_1px_4px_rgb(16_32_32/0.18)]">
                <X className="size-3.5" strokeWidth={2.4} />
              </button>
            </div>
          ))}
          <label className="flex aspect-[16/10] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#c5e4dc] bg-white px-2 text-center">
            <ImageIcon className="size-6 text-[#9aafb4]" strokeWidth={1.6} />
            <span className="mt-1 text-[12.5px] font-semibold text-[#143044]">Rasm yuklash</span>
            <span className="text-[10px] text-[#8aa0a4]">JPG yoki PNG</span>
            <span className="text-[10px] text-[#8aa0a4]">Tavsiya: 1080 × 1350</span>
            <input ref={inputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => { add(e.target.files?.[0]); e.target.value = '' }} />
          </label>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-2">
        <Stat icon={Users} label="Ishtirokchilar" value="42 keldi" hint="42 / 50 chipta" />
        <Stat icon={Award} label="Sertifikatlar" value="42 ta" hint="yaratildi" />
        <Stat icon={Calendar} label="Seminar kuni" value="21 oktabr 2026" hint="09:00 – 18:00" />
      </div>

      <section className={`${card} p-3`}>
        <p className="flex items-center gap-2 text-[13.5px] font-bold text-[#123044]">
          <FileText className="size-4 text-[var(--color-org-teal)]" /> Qo‘shimcha ma’lumot
        </p>
        <div className="mt-2 rounded-xl bg-[#f4f7f8] px-3 py-2.5 text-[12.5px] leading-relaxed text-[#3e5560]">
          Seminar reja bo‘yicha o‘tkazildi. Barcha ishtirokchilar qatnashdi.
          <br />
          Foto va video materiallar ilova qilindi.
        </div>
      </section>

      <button type="button" onClick={onAsk} className="flex w-full flex-col items-center justify-center rounded-2xl bg-[var(--color-org-teal)] px-4 py-3 text-white shadow-[0_8px_18px_rgb(12_143_134/0.28)]">
        <span className="flex items-center gap-2 text-[15.5px] font-semibold"><Send className="size-4" /> Pulni so‘rash</span>
        <span className="mt-0.5 text-[11px] font-medium text-white/85">Seminar o‘tkazilganini tasdiqlash va to‘lovni so‘rash</span>
      </button>
    </div>
  )
}

function Stat({ icon: Icon, label, value, hint }) {
  return (
    <div className={`${card} p-2`}>
      <span className="grid size-7 place-items-center rounded-lg bg-[#e7f6f3] text-[var(--color-org-teal)]"><Icon className="size-3.5" strokeWidth={1.8} /></span>
      <p className="mt-1 text-[10px] leading-tight text-[#7e9398]">{label}</p>
      <p className="text-[11.5px] font-bold leading-tight text-[#143044]">{value}</p>
      <p className="mt-0.5 text-[10px] leading-tight text-[#8aa0a4]">{hint}</p>
    </div>
  )
}

function Num({ n }) {
  return <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-[var(--color-org-teal)] text-[13px] font-bold text-white">{n}</span>
}

function MiniCert({ name }) {
  return (
    <div className="relative flex h-[100px] flex-col items-center overflow-hidden rounded-xl border-2 border-[#7dcec4] bg-white text-center">
      <span className="pointer-events-none absolute inset-[3px] rounded-[8px] border border-[#d4f1eb]" />
      <div className="relative mt-2.5 flex items-center gap-1 text-[var(--color-org-teal)]">
        <ToothIcon className="size-3.5" />
        <span className="text-[9px] font-bold">StomaHub</span>
      </div>
      <p className="relative mt-1 text-[8px] font-bold tracking-[0.16em] text-[var(--color-org-teal)]">SERTIFIKAT</p>
      <p className="relative mt-1.5 px-1.5 text-[11.5px] font-semibold leading-tight text-[#163044]">{name}</p>
    </div>
  )
}
