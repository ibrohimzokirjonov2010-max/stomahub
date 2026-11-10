// Vakansiya sahifasi (desktop + mobil). Faqat ish beruvchi kiritgan ma’lumot; aloqa — tel: va t.me havolalari.
// Soxta «Ariza yuborish / Arizangiz yuborildi», rezyume, ichki chat va shablon «vazifalar» olib tashlandi.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BriefcaseBusiness, Building2, ChevronLeft, Clock, MapPin, Pencil, Phone, Send, Share2, ShieldCheck, Lock, RotateCcw, Trash2, Banknote, GraduationCap } from 'lucide-react'
import { specName, expName } from '../../ishlarData'
import { isMine, deleteJob, setJobStatus } from '../../vakansiyaApi'
import { JOB_TYPE_NAME, jobError, phoneLabel, salaryText, telHref, tgHref } from '../../lib/vakansiya'
import { JobFormSheet } from './JobSheets'

export default function JobDetail({ job, mobile = false }) {
  const navigate = useNavigate()
  const [shared, setShared] = useState('')
  const [edit, setEdit] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  if (!job) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-[15px] font-semibold text-ink">Vakansiya topilmadi yoki yopilgan</p>
        <Link to="/ishlar" className="mt-3 inline-flex h-10 items-center rounded-xl bg-sea px-4 text-[13px] font-semibold text-white">Barcha vakansiyalar</Link>
      </div>
    )
  }
  const tel = telHref(job.phone)
  const tg = tgHref(job.telegram)
  const mine = isMine(job)
  const closed = job.status === 'closed'
  const reqs = Array.isArray(job.requirements) ? job.requirements : []
  const place = [job.cityLabel, job.address].filter(Boolean).join(', ')
  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) { await navigator.share({ title: job.title, url }); return }
      await navigator.clipboard.writeText(url); setShared('Havola nusxalandi')
    } catch { /* bekor qilindi */ }
  }
  const run = async (fn, ok) => {
    setBusy(true); setMsg('')
    try { await fn(); setMsg(ok) } catch (e) { setMsg(jobError(e)) } finally { setBusy(false); setConfirm(false) }
  }
  const contacts = (
    <div className={mobile ? 'flex gap-2' : 'grid gap-2'}>
      {tel && <a href={tel} data-testid="job-call" className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-sea text-[14px] font-semibold text-white"><Phone className="size-4" /> Qo‘ng‘iroq qilish</a>}
      {tg && <a href={tg} target="_blank" rel="noopener noreferrer" data-testid="job-telegram" className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-[14px] font-semibold ${tel ? 'border border-sea bg-white text-sea' : 'bg-sea text-white'}`}><Send className="size-4" /> Telegram</a>}
    </div>
  )
  const facts = [
    [Banknote, 'Maosh', salaryText(job.min, job.max)],
    [BriefcaseBusiness, 'Ish turi', JOB_TYPE_NAME[job.type] || '—'],
    job.spec && [GraduationCap, 'Yo‘nalish', specName[job.spec] || job.spec],
    job.exp && [Clock, 'Tajriba', expName[job.exp] || job.exp],
    [MapPin, 'Manzil', place || '—'],
  ].filter(Boolean)

  return (
    <div className={mobile ? 'pb-[calc(84px+env(safe-area-inset-bottom))]' : 'pb-8 pt-3'}>
      <div className={`bg-white ${mobile ? 'px-4 pb-4 pt-[max(12px,env(safe-area-inset-top))]' : 'rounded-2xl p-5 shadow-card'}`}>
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/ishlar'))} className="inline-flex h-10 items-center gap-1 text-[13px] font-semibold text-ink"><ChevronLeft className="size-5" /> Vakansiyalar</button>
          <button type="button" onClick={share} className="inline-flex h-10 items-center gap-1.5 text-[13px] font-semibold text-ink-2"><Share2 className="size-4" /> {shared || 'Ulashish'}</button>
        </div>
        {closed && <p className="mt-2 rounded-xl bg-[#f1f5f9] px-3 py-2 text-[12.5px] font-semibold text-muted">Bu vakansiya yopilgan — boshqalarga ko‘rinmaydi.</p>}
        {job._pending && <p className="mt-2 rounded-xl bg-[#fff8e6] px-3 py-2 text-[12.5px] font-semibold text-[#7a5200]">Vakansiya administrator tomonidan yashirilgan.</p>}
        <div className={`mt-2 ${mobile ? '' : 'grid grid-cols-[minmax(0,1fr)_280px] gap-6'}`}>
          <div className="min-w-0">
            <span className="inline-flex rounded-full bg-[#e7f6f4] px-2.5 py-0.5 text-[11.5px] font-semibold text-sea">{JOB_TYPE_NAME[job.type] || 'Ish'}</span>
            <h1 className="mt-1.5 break-words text-[22px] font-extrabold leading-tight text-ink">{job.title}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-[14px] font-semibold text-ink-2"><Building2 className="size-4 shrink-0 text-sea" /> <span className="min-w-0 break-words">{job.clinic}</span></p>
            <p className="mt-1 flex items-start gap-1.5 text-[13px] text-muted"><MapPin className="mt-0.5 size-4 shrink-0" /> <span className="min-w-0 break-words">{place}</span></p>
            <p className="mt-3 text-[20px] font-extrabold text-sea">{salaryText(job.min, job.max)}</p>
            {job.posted && <p className="mt-0.5 text-[12px] text-muted">E’lon qilingan: {job.posted}</p>}

            <dl className="mt-4 grid gap-2 sm:grid-cols-2">
              {facts.map(([Icon, k, v]) => (
                <div key={k} className="flex items-start gap-2 rounded-xl bg-page px-3 py-2.5">
                  <Icon className="mt-0.5 size-4 shrink-0 text-sea" />
                  <div className="min-w-0"><dt className="text-[11.5px] text-muted">{k}</dt><dd className="break-words text-[13.5px] font-semibold text-ink">{v}</dd></div>
                </div>
              ))}
            </dl>

            {reqs.length > 0 && (
              <section className="mt-4">
                <h2 className="text-[15px] font-bold text-ink">Talablar</h2>
                <ul className="mt-1.5 grid gap-1.5 text-[13.5px] text-ink-2">{reqs.map((r, i) => <li key={i} className="flex gap-2 break-words"><span className="text-sea">•</span><span className="min-w-0">{r}</span></li>)}</ul>
              </section>
            )}
            {job.about && (
              <section className="mt-4">
                <h2 className="text-[15px] font-bold text-ink">Qo‘shimcha ma’lumot</h2>
                <p className="mt-1.5 whitespace-pre-line break-words text-[13.5px] leading-relaxed text-ink-2">{job.about}</p>
              </section>
            )}
            <p className="mt-4 flex gap-2 rounded-xl bg-[#f3fbf8] p-3 text-[12px] leading-relaxed text-ink-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-sea" />
              Vakansiyani foydalanuvchi joylagan. Bog‘lanishdan oldin ish beruvchi haqidagi ma’lumotlarni tekshiring, oldindan to‘lov qilmang.
            </p>
          </div>

          <aside className={mobile ? 'mt-4 grid gap-3' : 'grid content-start gap-3'}>
            {!mobile && (
              <div className="rounded-xl border border-[#e6eef3] p-3.5">
                <p className="text-[14px] font-bold text-ink">Bog‘lanish</p>
                {tel && <p className="mt-1 text-[13px] text-ink-2">{phoneLabel(job.phone)}</p>}
                {tg && <p className="text-[13px] text-ink-2">@{job.telegram}</p>}
                <div className="mt-3">{contacts}</div>
              </div>
            )}
            {mobile && (tel || tg) && (
              <div className="rounded-xl border border-[#e6eef3] p-3.5 text-[13px] text-ink-2">
                <p className="text-[14px] font-bold text-ink">Bog‘lanish</p>
                {tel && <p className="mt-1">{phoneLabel(job.phone)}</p>}
                {tg && <p>@{job.telegram}</p>}
              </div>
            )}
            {mine && (
              <div className="rounded-xl border border-[#e6eef3] p-3.5">
                <p className="text-[14px] font-bold text-ink">Sizning vakansiyangiz</p>
                {confirm ? (
                  <div className="mt-2 rounded-xl bg-[#fef3f2] p-2.5">
                    <p className="text-[12.5px] text-ink">Vakansiya butunlay o‘chiriladi. Davom etasizmi?</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setConfirm(false)} className="h-9 rounded-xl border border-line bg-white text-[12.5px] font-semibold">Yo‘q</button>
                      <button type="button" disabled={busy} onClick={() => run(async () => { await deleteJob(job.id); navigate('/ishlar') }, 'Vakansiya o‘chirildi')} className="h-9 rounded-xl bg-[#b42318] text-[12.5px] font-semibold text-white disabled:opacity-50">Ha, o‘chirish</button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <button type="button" onClick={() => setEdit(true)} className="flex h-9 items-center justify-center gap-1 rounded-xl border border-line text-[12px] font-semibold"><Pencil className="size-3.5" /> Tahrir</button>
                    <button type="button" disabled={busy} onClick={() => run(() => setJobStatus(job.id, closed ? 'active' : 'closed'), closed ? 'Qayta ochildi' : 'Vakansiya yopildi')} className="flex h-9 items-center justify-center gap-1 rounded-xl border border-line text-[12px] font-semibold disabled:opacity-50">{closed ? <><RotateCcw className="size-3.5" /> Ochish</> : <><Lock className="size-3.5" /> Yopish</>}</button>
                    <button type="button" onClick={() => setConfirm(true)} className="flex h-9 items-center justify-center gap-1 rounded-xl border border-[#f3c4bf] text-[12px] font-semibold text-[#b42318]"><Trash2 className="size-3.5" /> O‘chirish</button>
                  </div>
                )}
                {msg && <p role="status" className="mt-2 text-[12px] text-sea">{msg}</p>}
              </div>
            )}
          </aside>
        </div>
      </div>
      {mobile && (tel || tg) && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-4 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom))] backdrop-blur">{contacts}</div>
      )}
      {edit && <JobFormSheet job={job} onClose={() => setEdit(false)} onDone={(m) => { setEdit(false); setMsg(m) }} />}
    </div>
  )
}
