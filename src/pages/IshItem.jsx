import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BadgeCheck, ChevronLeft, Heart, MapPin, Phone, Share2, ShieldCheck, X } from 'lucide-react'
import { getJob, viewOf, pay, typeName, expName } from '../ishlarData'

const tabs = ['Asosiy ma’lumotlar', 'Klinika haqida', 'Talablar', 'Imtiyozlar', 'Manzil']

export default function IshItem() {
  const { id } = useParams()
  const job = getJob(id)
  const [tab, setTab] = useState(0)
  const [saved, setSaved] = useState(false)
  const [phone, setPhone] = useState(false)
  const [apply, setApply] = useState(false)
  const [sent, setSent] = useState(false)
  const [shared, setShared] = useState(false)

  if (!job) {
    return <div className="py-16 text-center text-[14px] text-muted">Vakansiya topilmadi. <Link to="/ishlar" className="text-sea">Barcha vakansiyalar</Link></div>
  }

  const view = viewOf(job)
  const day = job.type === 'full' ? 'To‘liq ish kuni' : typeName[job.type]
  const share = async () => {
    const url = window.location.href
    try { await navigator.clipboard.writeText(url) } catch { /* clipboard blocked */ }
    setShared(true)
  }

  return (
    <div className="pb-8 pt-3">
      <div className="rounded-2xl bg-white p-4 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <Link to="/ishlar" className="inline-flex items-center gap-1 text-[12px] font-semibold text-ink"><ChevronLeft className="size-4" /> Barcha vakansiyalar</Link>
          <div className="flex items-center gap-3 text-[12px] font-semibold text-ink-2">
            <button onClick={share} className="inline-flex items-center gap-1"><Share2 className="size-3.5" /> {shared ? 'Nusxa olindi' : 'Ulashish'}</button>
            <button onClick={() => setSaved((v) => !v)} className={`inline-flex items-center gap-1 ${saved ? 'text-sea' : ''}`}><Heart className={`size-3.5 ${saved ? 'fill-sea' : ''}`} /> Saqlash</button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#e7f6f4] text-[16px] font-extrabold text-sea">{job.logo}</span>
            <div className="min-w-0">
              <h1 className="flex flex-wrap items-center gap-2 text-[18px] font-extrabold leading-tight text-ink">
                {job.title}
                {job.verified && <BadgeCheck className="size-4 text-sea" />}
                <span className="rounded-full bg-[#e7f6f4] px-2 py-0.5 text-[10px] font-semibold text-sea">{day}</span>
              </h1>
              <p className="mt-0.5 text-[12px] font-semibold text-ink-2">{job.clinicLine || job.clinic} {job.verified && <BadgeCheck className="inline size-3.5 text-sea" />}</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
                <span className="inline-flex items-center gap-1"><MapPin className="size-3" /> {job.cityLabel}</span>
                <span>{day}</span>
                <span>{job.expLabel || expName[job.exp]}</span>
                <span>{job.posted}</span>
              </p>
              <p className="mt-2 text-[18px] font-extrabold text-sea">{pay(job.min, job.max)}</p>
            </div>
          </div>
          <div className="grid w-full max-w-[240px] gap-2">
            <button onClick={() => { setApply(true); setSent(false) }} className="h-10 rounded-xl bg-sea text-[13px] font-semibold text-white">Ariza yuborish</button>
            <button onClick={() => setPhone(true)} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-sea text-[12px] font-semibold text-sea">
              <Phone className="size-3.5" /> {phone ? job.phone : 'Telefon raqamni ko‘rsatish'}
            </button>
          </div>
        </div>

        <div className="mt-4 flex gap-4 overflow-x-auto border-b border-[#e6eef3] text-[12px] no-scrollbar">
          {tabs.map((label, i) => (
            <button key={label} onClick={() => setTab(i)} className={`-mb-px shrink-0 border-b-2 pb-2 ${tab === i ? 'border-sea font-semibold text-sea' : 'border-transparent text-muted'}`}>{label}</button>
          ))}
        </div>

        <div className="ish-detail mt-3">
          <div className="grid gap-3">
            {tab === 0 && (
              <>
                <Block title="Tavsif" body={job.about} />
                {view.original && (
                  <div className="rounded-xl bg-[#f3fbf8] p-3">
                    <p className="text-[12px] font-bold text-sea">Asl e’lon matni (OLX):</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-ink-2">{view.original}</p>
                  </div>
                )}
                {view.sourceUrl && (
                  <div>
                    <p className="text-[12px] font-bold">Qo‘shimcha ma’lumot</p>
                    <p className="mt-1 text-[11px] text-muted">Manba:</p>
                    <a href={view.sourceUrl} target="_blank" rel="noreferrer" className="break-all text-[12px] text-sea hover:underline">{view.sourceUrl}</a>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {view.gallery.map((src) => <img key={src} src={src} alt="" className="h-24 w-full rounded-lg object-cover" />)}
                </div>
              </>
            )}
            {tab === 1 && <Block title="Klinika haqida" body={view.aboutClinic || "Klinika haqida ma’lumot kiritilmagan."} />}
            {tab === 2 && <List title="Talablar" rows={view.requirements.length ? view.requirements : ["Ish beruvchi talablarni kiritmagan."]} />}
            {tab === 3 && <List title="Imtiyozlar" rows={view.benefits.length ? view.benefits : ["Ish beruvchi imtiyozlarni kiritmagan."]} />}
            {tab === 4 && <Block title="Manzil" body={view.address} />}
            <div className="flex gap-2 rounded-xl bg-[#f3fbf8] p-3 text-[11px] leading-relaxed text-ink-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-sea" />
              Ariza yuborishdan oldin ish beruvchi ma’lumotlarini tekshirib chiqing. Shaxsiy ma’lumotlaringizni faqat ishonchli manbalarga yuboring.
            </div>
          </div>

          <aside className="grid gap-3">
            <div className="rounded-xl border border-[#e6eef3] p-3">
              <p className="text-[13px] font-bold">Asosiy ma’lumotlar</p>
              <Fact k="Maosh" v={pay(job.min, job.max)} />
              <Fact k="Ish turi" v={day} />
              <Fact k="Tajriba" v={job.expLabel || expName[job.exp]} />
              <Fact k="Joylashuv" v={job.cityLabel} />
              <Fact k="E’lon manbasi" v={job.source} />
              <Fact k="E’lon joylashtirilgan" v={job.postedFact || job.posted} />
            </div>
            <div className="rounded-xl border border-[#e6eef3] p-3">
              <p className="text-[13px] font-bold">Klinika haqida</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="grid size-9 place-items-center rounded-lg bg-[#e7f6f4] text-[12px] font-extrabold text-sea">{job.logo}</span>
                <span>
                  <span className="block text-[12px] font-semibold">{job.clinic}</span>
                  <span className="block text-[11px] text-muted">{job.cityLabel}</span>
                </span>
              </div>
              <Link to={`/ishlar?clinic=${encodeURIComponent(job.clinic)}`} className="mt-3 inline-flex text-[12px] font-semibold text-sea">Barcha vakansiyalarni ko‘rish →</Link>
            </div>
          </aside>
        </div>
      </div>

      {apply && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setApply(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[15px] font-bold">Ariza yuborish</h2>
              <button onClick={() => setApply(false)}><X className="size-4" /></button>
            </div>
            {sent ? <p className="text-[13px] font-semibold text-sea">Arizangiz yuborildi.</p> : (
              <form className="grid gap-2" onSubmit={(e) => { e.preventDefault(); setSent(true) }}>
                <input required placeholder="Ism" className="h-9 rounded-lg border border-[#d7e3ea] px-2 text-[13px]" />
                <input required placeholder="Telefon" className="h-9 rounded-lg border border-[#d7e3ea] px-2 text-[13px]" />
                <button className="h-9 rounded-lg bg-sea text-[12px] font-semibold text-white">Yuborish</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Block({ title, body }) {
  return (
    <div className="rounded-xl border border-[#e6eef3] p-3">
      <p className="text-[13px] font-bold">{title}</p>
      <p className="mt-1 text-[12px] leading-relaxed text-ink-2">{body}</p>
    </div>
  )
}

function List({ title, rows }) {
  return (
    <div className="rounded-xl border border-[#e6eef3] p-3">
      <p className="text-[13px] font-bold">{title}</p>
      <ul className="mt-2 grid gap-1 text-[12px] text-ink-2">
        {rows.map((row) => <li key={row}>• {row}</li>)}
      </ul>
    </div>
  )
}

function Fact({ k, v }) {
  return (
    <div className="mt-2 flex items-start justify-between gap-3 text-[11px]">
      <span className="text-muted">{k}</span>
      <span className="text-right font-semibold text-ink">{v}</span>
    </div>
  )
}
