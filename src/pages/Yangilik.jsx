import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BadgeCheck, Bookmark, Briefcase, ChevronRight, Clock, FileText, MapPin, Share2, Stethoscope, X } from 'lucide-react'
import { authorOf, catName, getArticle, longDate, relatedOf, sectionsOf } from '../yangiliklarData'

export default function Yangilik() {
  const { id } = useParams()
  const article = getArticle(id)
  const [saved, setSaved] = useState(false)
  const [shared, setShared] = useState(false)
  const [active, setActive] = useState('')
  const [clinic, setClinic] = useState(false)

  if (!article) {
    return <div className="py-16 text-center text-[14px] text-muted">Maqola topilmadi. <Link to="/yangiliklar" className="text-sea">Yangiliklar</Link></div>
  }

  const person = authorOf(article)
  const sections = sectionsOf(article)
  const related = relatedOf(article)
  const go = (sid) => {
    setActive(sid)
    document.getElementById(sid)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const share = async () => {
    try { await navigator.clipboard.writeText(window.location.href) } catch { /* clipboard blocked */ }
    setShared(true)
  }

  return (
    <div className="pb-8 pt-3">
      <p className="mb-3 truncate text-[11px] text-muted">
        <Link to="/" className="hover:text-sea">Bosh sahifa</Link>
        <span className="px-1">›</span>
        <Link to="/talim" className="hover:text-sea">Ta’lim</Link>
        <span className="px-1">›</span>
        <Link to="/yangiliklar" className="hover:text-sea">Maqolalar</Link>
        <span className="px-1">›</span>
        <span className="text-ink-2">{article.title}</span>
      </p>

      <div className="maqola-layout">
        <article className="min-w-0">
          <div className="relative overflow-hidden rounded-2xl">
            <img src={article.image} alt="" className="h-[230px] w-full object-cover" />
            <div className="absolute right-3 top-3 flex gap-2">
              <button onClick={share} className="grid size-8 place-items-center rounded-full bg-white shadow-card" aria-label="Ulashish"><Share2 className="size-3.5" /></button>
              <button onClick={() => setSaved((v) => !v)} className="grid size-8 place-items-center rounded-full bg-white shadow-card" aria-label="Saqlash"><Bookmark className={`size-3.5 ${saved ? 'fill-sea text-sea' : ''}`} /></button>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[12px] font-semibold text-sea">{article.badge || catName[article.cat]}</span>
            <span className="text-[12px] text-muted">{article.dateLong || longDate(article.date)}</span>
          </div>
          <h1 className="mt-1 text-[22px] font-extrabold leading-tight text-ink">{article.title}</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{article.excerpt}</p>

          <div className="mt-3 flex items-center gap-2">
            <img src={person.photo} alt="" className="size-10 rounded-full object-cover object-top" />
            <div>
              <p className="text-[13px] font-bold">{person.name}</p>
              <p className="text-[11px] text-muted">{person.role}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 border-y border-[#e6eef3] py-2.5 text-[12px] text-ink-2">
            <span className="inline-flex items-center gap-1.5"><Clock className="size-4 text-sea" /> {article.minutes} daqiqa o‘qish</span>
            <span className="inline-flex items-center gap-1.5"><FileText className="size-4 text-sea" /> {article.kind}</span>
            <button onClick={() => setSaved((v) => !v)} className={`inline-flex items-center gap-1.5 ${saved ? 'text-sea' : ''}`}><Bookmark className={`size-4 ${saved ? 'fill-sea' : ''}`} /> Saqlash</button>
            <button onClick={share} className="inline-flex items-center gap-1.5"><Share2 className="size-4" /> {shared ? 'Nusxa olindi' : 'Ulashish'}</button>
          </div>

          <div className="mt-3 rounded-xl border border-[#e6eef3] p-3">
            <p className="text-[13px] font-bold">Maqola mazmuni</p>
            <div className="maqola-toc mt-2">
              {sections.map((s, i) => (
                <button key={s.id} onClick={() => go(s.id)} className="flex items-center gap-2 text-left text-[12px]">
                  <span className={`grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${active === s.id ? 'bg-sea text-white' : 'bg-[#e7f6f4] text-sea'}`}>{i + 1}</span>
                  {s.title}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-5">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-4">
                <h2 className="flex items-center gap-2 text-[16px] font-extrabold">
                  <span className="grid size-7 place-items-center rounded-full bg-sea text-[13px] font-bold text-white">{i + 1}</span>
                  {s.title}
                </h2>
                {(s.body || []).map((p) => <p key={p} className="mt-2 text-[13px] leading-relaxed text-ink-2">{p}</p>)}
                {i === 0 && article.figure && <img src={article.figure} alt="" className="mt-3 h-40 w-full rounded-xl object-cover" />}
              </section>
            ))}
          </div>
        </article>

        <aside className="grid content-start gap-3">
          <div className="rounded-xl border border-[#e6eef3] bg-white p-3">
            <p className="text-[13px] font-bold">Maqola muallifi</p>
            <div className="mt-2 flex items-center gap-2">
              <img src={person.photo} alt="" className="size-11 rounded-full object-cover object-top" />
              <div>
                <p className="flex items-center gap-1 text-[13px] font-bold">{person.name} {person.verified && <BadgeCheck className="size-3.5 text-sea" />}</p>
                <p className="text-[11px] text-muted">{person.role}</p>
              </div>
            </div>
            {person.clinic && (
              <div className="mt-2 grid gap-1 text-[11px] text-ink-2">
                <p className="inline-flex items-center gap-1.5"><Briefcase className="size-3.5 text-sea" /> {person.years}</p>
                <p className="inline-flex items-center gap-1.5"><Stethoscope className="size-3.5 text-sea" /> {person.focus}</p>
                <p className="inline-flex items-center gap-1.5"><BadgeCheck className="size-3.5 text-sea" /> {person.clinic}</p>
                <p className="inline-flex items-center gap-1.5"><MapPin className="size-3.5 text-sea" /> {person.city}</p>
                <button onClick={() => setClinic(true)} className="mt-2 h-9 rounded-lg bg-sea text-[12px] font-semibold text-white">Klinika profilini ko‘rish</button>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[#e6eef3] bg-white p-3">
            <p className="text-[13px] font-bold">Maqola mazmuni</p>
            <div className="mt-2 grid gap-1">
              {sections.map((s, i) => (
                <button key={s.id} onClick={() => go(s.id)} className={`flex items-center gap-2 rounded-lg px-1.5 py-1 text-left text-[12px] ${active === s.id ? 'bg-[#e7f6f4] font-semibold text-sea' : 'text-ink-2'}`}>
                  <span className={`grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${active === s.id ? 'bg-sea text-white' : 'bg-[#e7f6f4] text-sea'}`}>{i + 1}</span>
                  {s.title}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#e6eef3] bg-white p-3">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-bold">Tegishli maqolalar</p>
              <Link to="/yangiliklar" className="text-[10px] font-semibold text-sea">Barchasini ko‘rish</Link>
            </div>
            <div className="mt-2 grid gap-2">
              {related.map((r) => (
                <Link key={r.id} to={`/yangiliklar/${r.id}`} className="flex items-center gap-2">
                  <img src={r.image} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-[12px] font-semibold leading-snug text-ink">{r.title}</span>
                    <span className="text-[10px] text-sea">{r.badge || r.kind || catName[r.cat]}</span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted" />
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {clinic && person.clinic && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setClinic(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[15px] font-bold">{person.clinic}</h2>
              <button onClick={() => setClinic(false)} aria-label="Yopish"><X className="size-4" /></button>
            </div>
            <p className="text-[13px] text-ink-2">{person.city}</p>
            <p className="mt-1 text-[12px] text-muted">{person.focus}. Qabul bo‘yicha {person.name} bilan bog‘laniladi.</p>
            <Link to="/ishlar" className="mt-3 flex h-9 items-center justify-center rounded-lg bg-sea text-[12px] font-semibold text-white">Klinikadagi vakansiyalar</Link>
          </div>
        </div>
      )}
    </div>
  )
}
