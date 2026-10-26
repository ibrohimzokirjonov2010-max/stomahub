import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bookmark, Clock, Eye, MapPin, Send, X } from 'lucide-react'
import ShopLayout from '../components/market/ShopLayout'
import { articles, cats, catName, events, people, popular, viewsOf } from '../yangiliklarData'

export default function Yangiliklar() {
  const [q, setQ] = useState('')
  return (
    <ShopLayout active="yangiliklar" search="plain" placeholder="Stomatologiya sohasidagi yangiliklarni qidiring..." onQuery={setQ}>
      <Feed query={q} />
    </ShopLayout>
  )
}

function Feed({ query }) {
  const [cat, setCat] = useState('all')
  const [hot, setHot] = useState(false)
  const [saved, setSaved] = useState(() => new Set())
  const [event, setEvent] = useState(null)
  const [sent, setSent] = useState(false)
  const [tg, setTg] = useState(false)

  const { hero, grid } = useMemo(() => {
    const text = query.trim().toLowerCase()
    let rows = articles.filter((a) => (cat === 'all' || a.cat === cat) && (!text || `${a.title} ${a.excerpt}`.toLowerCase().includes(text)))
    if (hot) rows = [...rows].sort((a, b) => b.views - a.views)
    else rows = [...rows].sort((a, b) => a.rank - b.rank)
    const top = hot ? rows[0] : rows.find((a) => a.featured) || rows[0]
    return { hero: top, grid: rows.filter((a) => a !== top) }
  }, [cat, query, hot])

  const toggle = (id) => setSaved((prev) => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  return (
    <div className="pb-8 pt-3">
      <h1 className="text-[22px] font-extrabold text-ink">Yangiliklar</h1>
      <p className="mt-0.5 text-[12px] text-muted">Stomatologiya sohasidagi eng so‘nggi yangiliklar, tadbirlar va tahlillar</p>
      <div className="mt-3 flex gap-1.5 overflow-x-auto no-scrollbar">
        {cats.map(([k, label]) => (
          <button key={k} onClick={() => { setCat(k); setHot(false) }} className={`h-7 shrink-0 rounded-full px-3 text-[11px] font-semibold ${cat === k && !hot ? 'bg-sea text-white' : 'bg-white text-ink-2 shadow-card'}`}>{label}</button>
        ))}
      </div>

      <div className="yangilik-layout mt-3">
        <div className="grid gap-3">
          {hero ? <Featured a={hero} saved={saved.has(hero.id)} onSave={() => toggle(hero.id)} /> : <Empty />}
          <div className="yangilik-grid">
            {grid.map((a) => <Card key={a.id} a={a} saved={saved.has(a.id)} onSave={() => toggle(a.id)} />)}
          </div>
        </div>

        <aside className="grid min-w-0 gap-3">
          <div className="min-w-0 overflow-hidden rounded-xl bg-white p-3 shadow-card">
            <div className="flex items-center justify-between gap-1">
              <p className="min-w-0 truncate text-[13px] font-bold">Ko‘p o‘qilganlar</p>
              <button onClick={() => { setHot(true); setCat('all') }} className="shrink-0 text-[10px] font-semibold text-sea">Barchasini ko‘rish</button>
            </div>
            <div className="mt-2 grid gap-2.5">
              {popular.map((a, i) => (
                <Link key={a.id} to={`/yangiliklar/${a.id}`} className="flex min-w-0 items-center gap-2">
                  <span className="w-4 text-[12px] font-bold text-muted">{i + 1}</span>
                  <img src={a.image} alt="" className="size-10 shrink-0 rounded-lg object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-[11px] font-semibold leading-snug text-ink">{a.title}</span>
                    <span className="mt-0.5 flex items-center gap-2 text-[10px] text-muted"><Eye className="size-3" /> {viewsOf(a.views)} <span>{a.date}</span></span>
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="min-w-0 overflow-hidden rounded-xl bg-white p-3 shadow-card">
            <div className="flex items-center justify-between gap-1">
              <p className="min-w-0 truncate text-[13px] font-bold">Yaqin tadbirlar</p>
              <button onClick={() => { setCat('tadbir'); setHot(false) }} className="shrink-0 text-[10px] font-semibold text-sea">Barchasini ko‘rish</button>
            </div>
            <div className="mt-2 grid gap-2.5">
              {events.map((e) => (
                <button key={e.id} onClick={() => { setEvent(e); setSent(false) }} className="flex min-w-0 items-center gap-2 text-left">
                  <span className="grid h-11 w-10 shrink-0 place-items-center rounded-lg bg-sea leading-none text-white">
                    <span className="text-[13px] font-extrabold">{e.day}</span>
                    <span className="text-[8px] font-bold">{e.month}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[11px] font-semibold text-ink">{e.title}</span>
                    <span className="flex items-center gap-1 text-[10px] text-muted"><MapPin className="size-3" /> {e.place}</span>
                    <span className="block text-[11px] font-bold text-sea">{e.price}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-sea to-[#0a6f78] p-3 text-white">
            <Send className="size-6" />
            <p className="mt-2 text-[14px] font-bold leading-tight">Telegram kanalimizga obuna bo‘ling</p>
            <p className="mt-1 text-[11px] leading-snug text-white/85">Stomatologiya yangiliklari, tadbirlar va foydali materiallar birinchi bo‘lib sizda!</p>
            <button onClick={() => setTg(true)} className="mt-3 h-8 w-full rounded-lg bg-white text-[12px] font-semibold text-sea">Obuna bo‘lish</button>
          </div>
        </aside>
      </div>

      {event && (
        <Modal title={event.title} onClose={() => setEvent(null)}>
          <p className="text-[12px] text-muted">{event.place} · {event.price}</p>
          {sent ? <p className="mt-3 text-[13px] font-semibold text-sea">Ro‘yxatdan o‘tdingiz. Tafsilotlar yuboriladi.</p> : (
            <form className="mt-3 grid gap-2" onSubmit={(e) => { e.preventDefault(); setSent(true) }}>
              <input required placeholder="Ism" className="h-9 rounded-lg border border-[#d7e3ea] px-2 text-[13px]" />
              <input required placeholder="Telefon" className="h-9 rounded-lg border border-[#d7e3ea] px-2 text-[13px]" />
              <button className="h-9 rounded-lg bg-sea text-[12px] font-semibold text-white">Ro‘yxatdan o‘tish</button>
            </form>
          )}
          <Link to={`/yangiliklar/${event.article}`} className="mt-2 inline-block text-[12px] font-semibold text-sea">Maqolani o‘qish</Link>
        </Modal>
      )}
      {tg && (
        <Modal title="Telegram kanalimiz" onClose={() => setTg(false)}>
          <p className="text-[13px] leading-relaxed text-ink-2">@stomahub kanalida yangiliklar, tadbirlar va qisqa maslahatlar chiqadi.</p>
          <a href="https://t.me/stomahub" target="_blank" rel="noreferrer" className="mt-3 flex h-9 items-center justify-center rounded-lg bg-sea text-[12px] font-semibold text-white">Kanalni ochish</a>
        </Modal>
      )}
    </div>
  )
}

function Featured({ a, saved, onSave }) {
  const person = people[a.author]
  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-card">
      <div className="yangilik-feature">
        <Link to={`/yangiliklar/${a.id}`} className="relative block h-full min-h-[210px] overflow-hidden">
          <img src={a.image} alt="" className="size-full object-cover" />
        </Link>
        <div className="relative flex flex-col p-3">
          <button onClick={onSave} className="absolute right-3 top-3 grid size-7 place-items-center rounded-full bg-[#f3f6fb]" aria-label="Saqlash">
            <Bookmark className={`size-3.5 ${saved ? 'fill-sea text-sea' : 'text-ink-2'}`} />
          </button>
          <Link to={`/yangiliklar/${a.id}`} className="pr-8">
            <span className="rounded-full bg-sea-50 px-2 py-0.5 text-[10px] font-semibold text-sea">{a.badge || catName[a.cat]}</span>
            <h2 className="mt-2 text-[16px] font-extrabold leading-snug text-ink">{a.title}</h2>
            <p className="mt-1 line-clamp-4 text-[12px] leading-relaxed text-ink-2">{a.excerpt}</p>
          </Link>
          <div className="mt-auto flex items-center gap-2 pt-3">
            <img src={person.photo} alt="" className="size-8 rounded-full object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-semibold">{person.name}</p>
              <p className="text-[10px] text-muted">{person.role}</p>
            </div>
          </div>
          <p className="mt-2 flex items-center gap-3 text-[10px] text-muted">
            <span>{a.date}</span>
            <span className="inline-flex items-center gap-1"><Eye className="size-3" /> {viewsOf(a.views)}</span>
            <span className="inline-flex items-center gap-1"><Clock className="size-3" /> {a.minutes} daqiqa</span>
          </p>
        </div>
      </div>
    </article>
  )
}

function Card({ a, saved, onSave }) {
  return (
    <article className="overflow-hidden rounded-xl bg-white shadow-card">
      <div className="relative h-[126px] overflow-hidden">
        <Link to={`/yangiliklar/${a.id}`} className="block size-full">
          <img src={a.image} alt="" className="size-full object-cover" />
        </Link>
        <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-sea">{a.badge || catName[a.cat]}</span>
        <button onClick={onSave} className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-white/95" aria-label="Saqlash">
          <Bookmark className={`size-3 ${saved ? 'fill-sea text-sea' : 'text-ink-2'}`} />
        </button>
      </div>
      <Link to={`/yangiliklar/${a.id}`} className="block p-2.5">
        <h3 className="line-clamp-2 min-h-[34px] text-[12px] font-bold leading-snug text-ink">{a.title}</h3>
        <p className="mt-1.5 flex items-center gap-2 text-[10px] text-muted">
          <span>{a.date}</span>
          <span className="inline-flex items-center gap-0.5"><Eye className="size-3" /> {viewsOf(a.views)}</span>
          <span className="inline-flex items-center gap-0.5"><Clock className="size-3" /> {a.minutes} daqiqa</span>
        </p>
      </Link>
    </article>
  )
}

function Empty() {
  return <div className="rounded-xl bg-white p-8 text-center text-[13px] text-muted shadow-card">Yangilik topilmadi.</div>
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Yopish"><X className="size-4" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}
