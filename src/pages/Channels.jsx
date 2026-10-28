import { useMemo, useState } from 'react'
import { LayoutGrid, Send, Mic, Heart, Star, BadgeCheck, ChevronDown, Plus, X } from 'lucide-react'
import ShopLayout from '../components/market/ShopLayout'
import EmptyCatalog from '../components/EmptyCatalog'
import { useCatalogVersion } from '../recordSync'
import { platforms, topics, languages, channels, official, langLabel, subsFull, subsShort } from '../channelsData'

const platformIcon = { all: LayoutGrid, tg: Send, yt: YouTubeMark, ig: InstagramMark, pod: Mic }
const sorts = { popular: 'Ommabop', rating: 'Reyting', subs: 'Obunachilar' }

export default function ChannelsRoute() {
  const [q, setQ] = useState('')
  return (
    <ShopLayout active="channels" search="plain" placeholder="Kanal, mavzu yoki username bo‘yicha qidiring..." onQuery={setQ}>
      <Channels query={q} />
    </ShopLayout>
  )
}

function Channels({ query }) {
  useCatalogVersion()
  const [platform, setPlatform] = useState('all')
  const [topic, setTopic] = useState('all')
  const [lang, setLang] = useState('all')
  const [sort, setSort] = useState('popular')
  const [saved, setSaved] = useState(() => new Set(channels.filter((c) => c.saved).map((c) => c.id)))
  const [joined, setJoined] = useState({})
  const [onlySaved, setOnlySaved] = useState(false)
  const [ask, setAsk] = useState(false)
  const [sent, setSent] = useState(false)

  const list = useMemo(() => {
    const text = query.trim().toLowerCase()
    return channels
      .filter((c) => platform === 'all' || c.platform === platform)
      .filter((c) => topic === 'all' || c.topic === topic || (c.tags || []).some((t) => t.toLowerCase().includes(topics.find((x) => x[0] === topic)?.[1].toLowerCase() || '')))
      .filter((c) => lang === 'all' || c.lang === lang)
      .filter((c) => !onlySaved || saved.has(c.id))
      .filter((c) => !text || `${c.name} ${c.handle} ${c.about}`.toLowerCase().includes(text))
      .slice()
      .sort((a, b) => sort === 'rating' ? b.rating - a.rating : sort === 'subs' ? b.subs - a.subs : channels.indexOf(a) - channels.indexOf(b))
  }, [platform, topic, lang, sort, query, onlySaved, saved])

  const editors = ['stom-uz', 'endo-masters', 'aesthetics', 'marketing', 'talk'].map((id) => channels.find((c) => c.id === id)).filter(Boolean)
  const savedList = channels.filter((c) => saved.has(c.id))
  const toggleSave = (id) => setSaved((prev) => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  return (
    <div className="grid gap-4 pb-8 pt-3 xl:grid-cols-[minmax(0,1fr)_250px]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[24px] font-extrabold tracking-tight text-ink">Foydali kanallar</h1>
            <p className="mt-0.5 text-[12px] text-ink-2">Stomatologlar uchun eng yaxshi Telegram, YouTube, Instagram kanallar va podkastlar.</p>
          </div>
          <button onClick={() => { setAsk(true); setSent(false) }} className="flex h-[34px] items-center gap-1.5 rounded-full bg-sea px-4 text-[12px] font-semibold text-white shadow-[0_6px_16px_-6px_rgb(11_138_149/0.7)] hover:bg-sea-600">
            <Plus className="size-4" /> Kanal taklif qilish
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {platforms.map(({ key, label }) => {
            const Icon = platformIcon[key]
            const on = platform === key
            return (
              <button key={key} onClick={() => setPlatform(key)} className={`flex h-[30px] items-center gap-1.5 rounded-full px-3 text-[10.5px] font-medium shadow-card ${on ? 'bg-sea text-white' : 'bg-white text-ink hover:text-sea'}`}>
                <Icon className="size-3.5" /> {label}
              </button>
            )
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[10px] text-muted">Mavzu:</span>
          {topics.map(([k, label]) => (
            <button key={k} onClick={() => setTopic(k)} className={`h-[26px] rounded-full px-2.5 text-[10px] font-medium ${topic === k ? 'bg-sea text-white' : 'bg-white text-ink-2 shadow-card hover:text-sea'}`}>{label}</button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[10px] text-muted">Til:</span>
          {languages.map(([k, label]) => (
            <button key={k} onClick={() => setLang(k)} className={`h-[26px] rounded-full px-2.5 text-[10px] font-medium ${lang === k ? 'bg-sea text-white' : 'bg-white text-ink-2 shadow-card hover:text-sea'}`}>{label}</button>
          ))}
          <label className="relative ml-auto">
            <span className="mr-1 text-[9px] text-muted">Saralash:</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-[26px] appearance-none rounded-lg bg-white pl-2 pr-6 text-[10px] font-medium text-ink shadow-card outline-none">
              {Object.entries(sorts).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-2" />
          </label>
        </div>

        {list.length ? (
          <div className="mt-3 grid grid-cols-2 gap-2.5 xl:grid-cols-4">
            {!channels.length ? <EmptyCatalog title="Kanallar ro‘yxati bo‘sh" text="Hali kanallar qo‘shilmagan." /> : null}
      {list.map((c) => (
              <ChannelCard key={c.id} c={c} saved={saved.has(c.id)} joined={!!joined[c.id]} onSave={() => toggleSave(c.id)} onJoin={() => setJoined((s) => ({ ...s, [c.id]: !s[c.id] }))} />
            ))}
          </div>
        ) : (
          <div className="mt-3 grid h-[180px] place-items-center rounded-xl bg-white text-[12px] text-muted shadow-card">Kanal topilmadi</div>
        )}
      </div>

      <aside className="flex flex-col gap-3">
        <div className="rounded-xl bg-white p-3 shadow-card">
          <h3 className="text-[12px] font-bold text-ink">Muharrir tanlovi</h3>
          <p className="text-[9px] text-muted">StomaHub jamoasi tavsiyasi</p>
          <div className="mt-2 flex flex-col gap-2">
            {editors.map((c) => (
              <div key={c.id} className="flex items-center gap-2">
                <Mark c={c} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10.5px] font-semibold text-ink">{c.name}</p>
                  <p className="text-[9px] text-muted">{subsShort(c.subs)}</p>
                </div>
                <button onClick={() => setJoined((s) => ({ ...s, [c.id]: !s[c.id] }))} className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-semibold ${joined[c.id] ? 'bg-sea-50 text-sea-600' : 'bg-sea text-white'}`}>
                  {joined[c.id] ? 'Obuna' : 'Obuna bo‘lish'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white p-3 shadow-card">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[12px] font-bold text-ink">Mening saqlanganlarim</h3>
            <button onClick={() => setOnlySaved(true)} className="text-[9px] font-medium text-sea">Barchasini ko‘rish</button>
          </div>
          {savedList.length ? savedList.map((c) => (
            <div key={c.id} className="flex items-center gap-2 py-1">
              <Mark c={c} />
              <p className="min-w-0 flex-1 truncate text-[10.5px] font-medium text-ink">{c.name}</p>
              <button onClick={() => toggleSave(c.id)} aria-label="Saqlashdan olish" className="text-sea"><Heart className="size-3.5 fill-sea" /></button>
            </div>
          )) : <p className="text-[10px] text-muted">Hali saqlangan kanal yo‘q</p>}
        </div>

        <div className="relative overflow-hidden rounded-xl bg-white p-3 shadow-card">
          <h3 className="text-[12px] font-bold text-ink">StomaHub rasmiy kanallari</h3>
          <p className="text-[9px] text-muted">Yangiliklar, aksiyalar va foydali kontentlar.</p>
          <Plane className="pointer-events-none absolute -right-2 top-6 size-16 text-sea/80" />
          <div className="mt-2 flex flex-col gap-2">
            {official.map((c) => (
              <div key={c.id} className="flex items-center gap-2">
                <Mark c={c} />
                <div className="min-w-0 flex-1">
                  <p className="text-[10.5px] font-semibold leading-tight text-ink">{c.name}</p>
                  <p className="text-[9px] text-muted">{c.handle}</p>
                  <p className="text-[9px] text-muted">{subsShort(c.subs)}</p>
                </div>
                <button onClick={() => setJoined((s) => ({ ...s, [c.id]: !s[c.id] }))} className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-semibold ${joined[c.id] ? 'bg-sea-50 text-sea-600' : 'bg-sea text-white'}`}>
                  {joined[c.id] ? 'Obuna' : 'Obuna bo‘lish'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {ask && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={() => setAsk(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); setSent(true) }} className="w-full max-w-[400px] rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-ink">Kanal taklif qilish</h3>
              <button type="button" onClick={() => setAsk(false)} aria-label="Yopish"><X className="size-4 text-muted" /></button>
            </div>
            {sent ? <p className="py-8 text-center text-[13px] text-ink-2">Taklif qabul qilindi. Muharrir ko‘rib chiqadi.</p> : (
              <div className="mt-3 flex flex-col gap-2">
                {['Kanal nomi', 'Username', 'Platforma'].map((l) => (
                  <label key={l} className="text-[10px] text-muted">{l}
                    <input required className="mt-1 h-9 w-full rounded-lg bg-page px-3 text-[12px] text-ink outline-none focus:ring-1 focus:ring-sea" />
                  </label>
                ))}
                <button className="mt-2 h-10 rounded-lg bg-sea text-[13px] font-semibold text-white">Yuborish</button>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  )
}

function ChannelCard({ c, saved, joined, onSave, onJoin }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl bg-white shadow-card">
      <div className="relative h-[92px]">
        <img src={c.cover} alt="" className="size-full object-cover" />
        <span className="absolute left-2 top-2"><PlatformBadge platform={c.platform} /></span>
        {c.verified && (
          <span className="absolute left-9 top-2 flex items-center gap-0.5 rounded-full bg-sea/95 px-1.5 py-0.5 text-[8px] font-semibold text-white">
            <BadgeCheck className="size-2.5" /> Tasdiqlangan
          </span>
        )}
        <button onClick={onSave} aria-label="Saqlash" className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-white/90">
          <Heart className={`size-3.5 ${saved ? 'fill-sale text-sale' : 'text-ink-2'}`} />
        </button>
      </div>
      <div className="relative flex-1 px-2.5 pb-2.5">
        <div className="-mt-4"><Mark c={c} /></div>
        <h3 className="mt-1 truncate text-[12px] font-bold text-ink">{c.name}</h3>
        <p className="truncate text-[9.5px] text-muted">{c.handle}</p>
        <p className="mt-0.5 text-[9.5px] text-ink-2">{subsFull(c.subs)} · {langLabel(c.lang)}</p>
        <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-ink-2">{c.about}</p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {c.tags.map((t) => <span key={t} className="rounded-full bg-[#f3f6fa] px-1.5 py-0.5 text-[8.5px] text-ink-2">{t}</span>)}
        </div>
        <div className="mt-auto flex items-center justify-between gap-1 pt-2">
          <p className="flex items-center gap-1 text-[9.5px] text-ink-2"><Star className="size-3 fill-star text-star" /> {c.rating} <span className="text-muted">({c.reviews})</span></p>
          <button onClick={onJoin} className={`h-[26px] rounded-full px-2.5 text-[10px] font-semibold ${joined ? 'bg-sea-50 text-sea-600' : 'bg-sea text-white hover:bg-sea-600'}`}>
            {joined ? 'Obuna' : 'Obuna bo‘lish'}
          </button>
        </div>
      </div>
    </article>
  )
}

function Mark({ c }) {
  if (c.avatar) return <img src={c.avatar} alt="" className="size-8 rounded-full object-cover ring-2 ring-white" />
  return (
    <span className="grid size-8 place-items-center rounded-full text-[9px] font-extrabold text-white ring-2 ring-white" style={{ background: c.color }}>
      {c.letter}
    </span>
  )
}

function PlatformBadge({ platform }) {
  const Icon = platformIcon[platform] || Send
  const bg = { tg: 'bg-[#2AABEE]', yt: 'bg-[#ff2d2d]', ig: 'bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]', pod: 'bg-[#6d4ad6]' }[platform]
  return <span className={`grid size-5 place-items-center rounded-md text-white ${bg}`}><Icon className="size-3" /></span>
}

function YouTubeMark({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M22 12.2s0-3.2-.4-4.6c-.2-.9-.9-1.6-1.8-1.8C18.2 5.4 12 5.4 12 5.4s-6.2 0-7.8.4c-.9.2-1.6.9-1.8 1.8C2 9 2 12.2 2 12.2s0 3.2.4 4.6c.2.9.9 1.6 1.8 1.8 1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.4.4-4.6.4-4.6ZM10 15.2V9.2l5.2 3-5.2 3Z" />
    </svg>
  )
}

function InstagramMark({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  )
}

function Plane({ className }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="currentColor">
      <path d="M58 8 6 30.5l16.8 6.2L50 16.8 28.5 39.2l.6 16.2 8.4-12.2L52 50.5 58 8Z" />
    </svg>
  )
}
