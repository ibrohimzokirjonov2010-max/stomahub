import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Clock, Info, MapPin, Pencil, X } from 'lucide-react'
import { CONFIRM_PEOPLE, DETAIL, HALL_PHOTOS, som } from '../data'
import { useOrg } from '../Shell'
import { Badge, Btn, CertificateCard, Modal } from '../ui'

export default function Confirm() {
  const { notify } = useOrg()
  const [photos, setPhotos] = useState(HALL_PHOTOS)
  const [people] = useState(CONFIRM_PEOPLE)
  const [all, setAll] = useState(false)
  const [asked, setAsked] = useState(false)
  const [askOpen, setAskOpen] = useState(false)

  const add = (file) => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { notify('Rasm 10 MB dan katta'); return }
    if (!/^image\/(png|jpeg)$/.test(file.type)) { notify('Faqat JPG yoki PNG'); return }
    if (photos.length >= 10) { notify('Ko‘pi bilan 10 ta rasm'); return }
    setPhotos((list) => [...list, URL.createObjectURL(file)])
  }

  const ask = () => {
    if (photos.length < 3) { notify('Kamida 3 ta zal rasmi kerak'); return }
    setAskOpen(false)
    setAsked(true)
    notify('Pul so‘rovi yuborildi')
  }

  return (
    <div>
      <Link to="/tashkilotchi/seminarlar" className="mb-2 inline-flex items-center gap-1 text-[13px] text-[#5e787e] hover:text-[#0c8f86]"><ChevronLeft className="size-4" /> Seminarlar</Link>
      <h1 className="text-[22px] font-bold">O‘tkazilganini tasdiqlash</h1>
      <p className="mt-0.5 max-w-3xl text-[13px] text-[#6e868c]">Seminar yakunlangandan so‘ng ma’lumotlarni yuboring. StomaHub tekshiruvidan o‘tilgach, to‘lovni chiqaradi.</p>

      <div className="mt-4 grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#e6f1ef] bg-white p-3">
            <img src={DETAIL.image} alt="" className="h-16 w-24 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <Badge tone="teal">{DETAIL.topic}</Badge>
              <p className="mt-1 font-bold">{DETAIL.title}</p>
              <p className="text-[12px] text-[#6e868c]">21 oktabr 2026, 18:30 · Toshkent, O‘zbekiston · 50 ishtirokchi</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-[#fff7e8] px-3 py-2 text-[12px] text-[#b7791f]"><Clock className="size-4" /><div><b>Tekshiruvda</b><p>Ma’lumotlaringiz tekshirilmoqda.</p></div></div>
          </div>

          <ol className="grid gap-2 sm:grid-cols-4">
            {[
              ['1', 'Yuborildi', ''],
              ['2', 'StomaHub tekshiruvi', 'Hozirgi bosqich'],
              ['3', 'Tasdiqlandi', 'Kutimoqda'],
              ['4', 'Pul o‘tkazildi', asked ? 'So‘rov yuborildi' : 'Kutimoqda'],
            ].map(([n, t, s], i) => (
              <li key={n} className={`rounded-xl border px-3 py-2 ${i === 1 ? 'border-[#0c8f86] bg-[#f3fbfa]' : 'border-[#e6f1ef] bg-white'}`}>
                <span className={`grid size-6 place-items-center rounded-full text-[12px] font-bold ${i === 1 ? 'bg-[#0c8f86] text-white' : 'bg-[#e7eef0] text-[#5e787e]'}`}>{n}</span>
                <p className="mt-1 text-[12.5px] font-semibold">{t}</p>
                {s && <p className="text-[11px] text-[#0c8f86]">{s}</p>}
              </li>
            ))}
          </ol>

          <section className="rounded-2xl border border-[#e6f1ef] bg-white p-4">
            <div className="flex items-center justify-between"><h2 className="font-bold">1. Zal rasmlari</h2><span className="text-[12px] font-semibold text-[#0c8f86]">{photos.length}/10 rasm yuklandi</span></div>
            <p className="text-[12.5px] text-[#6e868c]">Seminar o‘tkazilganini tasdiqlovchi zal rasmlarini yuklang (kamida 3–5 ta).</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <label className="grid h-24 w-36 cursor-pointer place-items-center rounded-xl border border-dashed border-[#b7e0d8] bg-[#f6fbfa] text-center text-[11px] text-[#5e787e]">
                Rasm tanlash<br />JPG, PNG · 10 MB
                <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => add(e.target.files?.[0])} />
              </label>
              {photos.map((src, i) => (
                <div key={src + i} className="relative h-24 w-36 overflow-hidden rounded-xl">
                  <img src={src} alt="" className="size-full object-cover" />
                  <button type="button" aria-label="Olib tashlash" onClick={() => setPhotos((list) => list.filter((_, j) => j !== i))} className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-white/90"><X className="size-3" /></button>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11.5px] text-[#8aa0a4]">Rasmlarni shu yerga tashlang yoki tanlang. JPG, PNG formatda. Har bir rasm 10 MB gacha.</p>
          </section>

          <section className="rounded-2xl border border-[#e6f1ef] bg-white p-4">
            <div className="flex items-center justify-between"><h2 className="font-bold">2. Ishtirokchilar ro‘yxati</h2><span className="text-[12px] font-semibold text-[#0c8f86]">{people.filter((p) => p.ok).length} / 50 keldi</span></div>
            <p className="text-[12.5px] text-[#6e868c]">Ro‘yxat avtomatik ravishda QR check-in ma’lumotlari asosida shakllantiriladi.</p>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-[12.5px]">
                <thead><tr className="border-b border-[#eef3f2] text-[12px] text-[#8aa0a4]">{['#', 'Ism familiya', 'Telefon raqam', 'Check-in vaqti', 'Holat'].map((h) => <th key={h} className="py-2 font-medium">{h}</th>)}</tr></thead>
                <tbody>
                  {(all ? people : people.slice(0, 5)).map((p, i) => (
                    <tr key={p.name} className="border-b border-[#f4f7f6]">
                      <td className="py-2">{i + 1}</td>
                      <td className="py-2"><span className="inline-flex items-center gap-2"><img src={p.avatar} alt="" className="size-7 rounded-full object-cover" />{p.name}</span></td>
                      <td>{p.phone}</td>
                      <td>{p.time}</td>
                      <td><Badge tone="green" dot>Keldi</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" className="mt-2 text-[12.5px] font-semibold text-[#0c8f86]" onClick={() => setAll((v) => !v)}>{all ? 'Yig‘ish' : 'Barchasini ko‘rish'}</button>
          </section>

          <section className="rounded-2xl border border-[#e6f1ef] bg-white p-4">
            <div className="flex items-center justify-between"><h2 className="font-bold">3. Berilgan sertifikatlar</h2><span className="text-[12px] font-semibold text-[#0c8f86]">42 ta sertifikat berilgan</span></div>
            <p className="text-[12.5px] text-[#6e868c]">Seminarda qatnashgan ishtirokchilarga sertifikatlar berilganini tasdiqlang.</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {people.slice(0, 4).map((p) => <CertificateCard key={p.name} name={p.name} course={DETAIL.title} date="21-oktabr 2026" />)}
            </div>
            <Link to="/tashkilotchi/sertifikatlar" className="mt-2 inline-block text-[12.5px] font-semibold text-[#0c8f86]">Sertifikatlar ro‘yxati</Link>
          </section>

          <Btn className="w-full" onClick={() => setAskOpen(true)}>Pulni so‘rash →</Btn>
        </div>

        <aside className="space-y-3">
          <div className="rounded-2xl border border-[#e6f1ef] bg-white p-4">
            <div className="mb-2 flex items-center justify-between"><h3 className="font-bold">Seminar ma’lumotlari</h3><Link to="/tashkilotchi/seminarlar/yangi?tahrir=implant" className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#0c8f86]"><Pencil className="size-3.5" /> Tahrirlash</Link></div>
            <img src={DETAIL.image} alt="" className="h-24 w-full rounded-xl object-cover" />
            <p className="mt-2 text-[13px] font-bold">{DETAIL.title}</p>
            <dl className="mt-2 space-y-1.5 text-[12.5px]">
              <Row k="Sana" v="21 oktabr 2026, 09:00–18:00" />
              <Row k="Manzil" v="Toshkent, O‘zbekiston" />
              <Row k="Zal" v="Tashkent City Kongress Markazi" />
              <Row k="Ishtirokchilar" v="50 kishi" />
              <Row k="Chipta narxi" v={som(350000)} />
              <Row k="Jami daromad" v={som(17500000)} />
            </dl>
          </div>
          <div className="rounded-2xl border border-[#e6f1ef] bg-white p-4">
            <h3 className="font-bold">To‘lov hisob-kitobi</h3>
            <Row k="Jami daromad" v={som(17500000)} />
            <Row k="Platforma komissiyasi (12%)" v={som(2100000)} />
            <p className="mt-2 flex justify-between text-[13.5px] font-bold text-[#0c8f86]"><span>Sizga o‘tkaziladigan summa</span><span>{som(15400000)}</span></p>
          </div>
          <div className="rounded-2xl bg-[#f7fcfb] p-4 text-[12.5px] text-[#3e5a62]">
            <p className="mb-2 flex items-center gap-1 font-bold"><Info className="size-4 text-[#0c8f86]" /> Muhim ma’lumotlar</p>
            <ul className="list-disc space-y-1 pl-4">
              <li>Zal rasmlari, ishtirokchilar ro‘yxati va sertifikatlar yuklangandan keyin to‘lov so‘rovini yuborish mumkin.</li>
              <li>Ma’lumotlar StomaHub tomonidan tekshiriladi.</li>
              <li>Tasdiqlangandan so‘ng pul avtomatik ravishda hamyoningizga o‘tkaziladi.</li>
              <li>Tekshiruv odatda 1–3 ish kuni davom etadi.</li>
            </ul>
          </div>
        </aside>
      </div>

      <Modal open={askOpen} title="Pulni so‘rash" sub="15 400 000 so‘m hamyoningizga so‘raladi." onClose={() => setAskOpen(false)}>
        <p className="text-[13px] text-[#3e5a62]">Zal rasmlari va ishtirokchilar ro‘yxati tekshiruvga yuboriladi.</p>
        <div className="mt-4 flex justify-end gap-2"><Btn kind="soft" onClick={() => setAskOpen(false)}>Ortga</Btn><Btn onClick={ask}>So‘rovni yuborish</Btn></div>
      </Modal>
      </div>
  )
}

function Row({ k, v }) {
  return <div className="flex justify-between gap-3 py-0.5 text-[12.5px]"><span className="text-[#7e9398]">{k}</span><span className="text-right font-medium">{v}</span></div>
}
