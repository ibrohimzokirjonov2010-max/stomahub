import { useMemo, useState } from 'react'
import {
  Plus, BadgeCheck, Heart, MessageCircle, Bookmark, Share2, MoreHorizontal, HelpCircle,
  MessagesSquare, FileText, Bold, Italic, Link2, X, ShieldCheck, Send, Search, Flame,
} from 'lucide-react'
import ShopLayout from '../components/market/ShopLayout'
import { ToothIcon } from '../components/icons'
import {
  TOPICS, CATS, catTopic, TRENDS, LEADERS, KINDS, KIND_LABEL, SAMPLE_SHOTS, seedPosts, seedSaved, PROMO,
} from '../communityData'
import { useProfile } from '../profileStore'

const CLINIC = [
  ['shikoyat', 'Shikoyat', 'Bemorning shikoyatlari va anamnezi...'],
  ['tekshiruv', 'Klinik tekshiruv', 'Klinik tekshiruv natijasi...'],
  ['tashxis', 'Tashxis', 'Tashxis...'],
  ['reja', 'Davolash rejasi', 'Davolash rejasi...'],
  ['jarayon', 'Davolash jarayoni', 'Davolash jarayoni...'],
  ['natija', 'Natija', 'Natija va nazorat...'],
]

const emptyForm = () => ({
  kind: 'keys',
  title: '',
  cat: 'Endodontiya',
  body: '',
  age: '',
  gender: 'Erkak',
  date: '',
  step: 'shikoyat',
  notes: { shikoyat: '', tekshiruv: '', tashxis: '', reja: '', jarayon: '', natija: '' },
  images: SAMPLE_SHOTS.map((src, i) => ({ id: `s${i}`, src })),
  tags: ['#Endodontiya', '#Mikroskop', '#Qayta davolash', '#Case'],
  tag: '',
  consent: true,
  face: true,
  nameHidden: true,
  science: false,
})

export default function Community() {
  const [q, setQ] = useState('')
  return (
    <ShopLayout active="community" search="plain" placeholder="Stomatolog, mavzular yoki postlarni qidiring..." onQuery={setQ}>
      <Board query={q} />
    </ShopLayout>
  )
}

function viewerOf(profile) {
  if (!profile?.accountLive) return { name: 'Mehmon', role: 'Stomatolog', place: 'Toshkent', avatar: '/images/avatar.jpg' }
  return {
    name: profile.name || 'Shifokor',
    role: profile.role || 'Stomatolog',
    place: profile.city || 'Toshkent',
    avatar: profile.avatar || '/images/avatar.jpg',
  }
}

function Board({ query }) {
  const me = viewerOf(useProfile())
  const [topic, setTopic] = useState('all')
  const [tab, setTab] = useState('all')
  const [sort, setSort] = useState('yangi')
  const [posts, setPosts] = useState(seedPosts)
  const [liked, setLiked] = useState(() => new Set())
  const [saved, setSaved] = useState(() => new Set())
  const [followed, setFollowed] = useState(() => new Set())
  const [openId, setOpenId] = useState(null)
  const [hidden, setHidden] = useState(() => new Set())
  const [composer, setComposer] = useState(null)
  const [toast, setToast] = useState('')
  const [promo, setPromo] = useState(true)

  const list = useMemo(() => {
    const text = query.trim().toLowerCase()
    const rows = posts.filter((p) => {
      if (hidden.has(p.id)) return false
      if (tab !== 'all' && p.kind !== tab) return false
      if (topic !== 'all' && p.topic !== topic) return false
      if (text && !`${p.title} ${p.body} ${p.author}`.toLowerCase().includes(text)) return false
      return true
    })
    rows.sort((a, b) => (sort === 'mashhur' ? b.likes - a.likes : a.rank - b.rank))
    return rows
  }, [posts, hidden, tab, topic, query, sort])

  const ping = (text) => {
    setToast(text)
    window.setTimeout(() => setToast(''), 1800)
  }

  const toggleLike = (id) => {
    setLiked((s) => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
    setPosts((rows) => rows.map((p) => (p.id === id ? { ...p, likes: p.likes + (liked.has(id) ? -1 : 1) } : p)))
  }

  const share = (p) => {
    const url = `${window.location.origin}/community#${p.id}`
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url).catch(() => {})
    setPosts((rows) => rows.map((row) => (row.id === p.id ? { ...row, shares: row.shares + 1 } : row)))
    ping('Havola nusxalandi')
  }

  const publish = (form) => {
    const notes = Object.values(form.notes).map((x) => x.trim()).filter(Boolean)
    const post = {
      id: `p-${Date.now()}`,
      rank: 0,
      kind: form.kind,
      topic: catTopic[form.cat] || 'endo',
      author: me.name,
      role: me.role,
      place: me.place,
      time: 'Hozir',
      avatar: me.avatar,
      title: form.title.trim(),
      body: [form.body.trim(), ...notes].filter(Boolean).join(' '),
      tags: [{ t: KIND_LABEL[form.kind] || 'Post', tone: form.kind === 'keys' ? 'keys' : 'talk' }, ...form.tags.map((t) => ({ t, tone: t.startsWith('#') ? 'hash' : '' }))],
      images: form.images.map((img) => img.src),
      likes: 0,
      comments: 0,
      shares: 0,
      thread: [],
    }
    setPosts((rows) => [post, ...rows.map((p) => ({ ...p, rank: p.rank + 1 }))])
    setTab('all')
    setComposer(null)
    ping('Post joylandi')
  }

  const savedCards = [
    ...posts.filter((p) => saved.has(p.id)).map((p) => ({ id: p.id, title: p.title, meta: `${p.author} · ${p.time}`, image: p.images[0] })),
    ...seedSaved,
  ]

  return (
    <div className="pb-8 pt-3">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight text-ink">Hamjamiyat</h1>
          <p className="text-[13px] text-muted">Stomatologlar uchun professional bilim, tajriba va muhokama maydoni.</p>
        </div>
        <button type="button" onClick={() => setComposer('keys')} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-sea px-4 text-[13px] font-semibold text-white">
          <Plus className="size-4" /> Post yozish
        </button>
      </div>

      <div className="com-kinds">
        {KINDS.map((k) => (
          <button key={k.id} type="button" onClick={() => setTab(k.id)} className="flex min-w-0 items-center gap-2.5 rounded-2xl border bg-white px-3 py-3 text-left shadow-card" style={{ borderColor: tab === k.id ? '#0b8a95' : '#eef2f6' }}>
            <KindIcon id={k.id} bg={k.bg} color={k.color} />
            <span className="min-w-0 flex-1">
              <b className="flex items-center gap-1 text-[13px]">{k.title} {k.id === 'keys' && <span role="button" aria-label="Klinik keys yozish" onClick={(e) => { e.stopPropagation(); setComposer('keys') }}><Plus className="size-3.5 text-sea" /></span>}</b>
              <span className="block truncate text-[11px] text-muted">{k.text}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {TOPICS.map((t) => (
          <button key={t.id} type="button" onClick={() => setTopic(t.id)} className={`h-8 shrink-0 rounded-full px-3 text-[12px] font-semibold ${topic === t.id ? 'bg-sea text-white' : 'bg-white text-ink-2 shadow-card'}`}>
            {t.label}{t.count ? ` ${t.count}` : ''}
          </button>
        ))}
      </div>

      <div className="com-layout mt-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1 overflow-x-auto no-scrollbar">
              {[
                ['all', 'Lenta'],
                ['keys', 'Klinik keyslar'],
                ['savol', 'Savollar'],
                ['muhokama', 'Muhokamalar'],
                ['maqola', 'Maqolalar'],
              ].map(([id, label]) => (
                <button key={id} type="button" onClick={() => setTab(id)} className={`h-8 shrink-0 rounded-lg px-2.5 text-[12.5px] font-semibold ${tab === id ? 'text-sea' : 'text-ink-2'}`} style={{ boxShadow: tab === id ? 'inset 0 -2px 0 #0b8a95' : 'none' }}>{label}</button>
              ))}
            </div>
            <label className="flex items-center gap-1 text-[12px] text-muted">
              Saralash:
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="bg-transparent font-semibold text-ink outline-none">
                <option value="yangi">Yangi</option>
                <option value="mashhur">Mashhur</option>
              </select>
            </label>
          </div>

          {list.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center text-[13px] text-muted shadow-card">Bu bo‘limda post yo‘q. Birinchi bo‘lib yozing.</div>
          ) : (
            <div className="space-y-3">
              {list.map((p) => (
                <article key={p.id} id={p.id} className="rounded-2xl bg-white p-4 shadow-card">
                  <div className="flex items-start gap-2">
                    <img src={p.avatar} alt="" className="size-10 shrink-0 rounded-full object-cover" />
                    <div className="min-w-0 flex-1">
                      <b className="inline-flex items-center gap-1 text-[13px]">{p.author} <BadgeCheck className="size-3.5 text-[#3b82f6]" /></b>
                      <p className="text-[11px] text-muted">{p.role} · {p.place} <span className="px-1">·</span> {p.time}</p>
                    </div>
                    <button type="button" onClick={() => setFollowed((s) => { const n = new Set(s); n.has(p.author) ? n.delete(p.author) : n.add(p.author); return n })} className="hidden h-8 items-center gap-1 rounded-lg border border-sea px-2.5 text-[12px] font-semibold text-sea sm:inline-flex">
                      <Plus className="size-3.5" /> {followed.has(p.author) ? 'Kuzatyapsiz' : 'Kuzatish'}
                    </button>
                    <Menu onHide={() => setHidden((s) => new Set(s).add(p.id))} />
                  </div>
                  <h2 className="mt-3 text-[15px] font-bold leading-snug">{p.title}</h2>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{p.body}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {p.tags.map((tag) => <Tag key={tag.t} tag={tag} />)}
                  </div>
                  {p.images.length > 0 && <div className="mt-3"><Shots images={p.images} /></div>}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-[12.5px] text-ink-2">
                    <button type="button" onClick={() => toggleLike(p.id)} className={`inline-flex items-center gap-1 ${liked.has(p.id) ? 'text-[#e11d48]' : ''}`}><Heart className={`size-4 ${liked.has(p.id) ? 'fill-[#e11d48]' : ''}`} /> {p.likes}</button>
                    <button type="button" onClick={() => setOpenId(openId === p.id ? null : p.id)} className="inline-flex items-center gap-1"><MessageCircle className="size-4" /> {p.comments + (p.extra || 0)}</button>
                    <span className="inline-flex items-center gap-1"><Share2 className="size-4" /> {p.shares}</span>
                    <button type="button" onClick={() => setSaved((s) => { const n = new Set(s); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n })} className={`inline-flex items-center gap-1 ${saved.has(p.id) ? 'text-sea' : ''}`}><Bookmark className={`size-4 ${saved.has(p.id) ? 'fill-sea' : ''}`} /> Saqlash</button>
                    <button type="button" onClick={() => share(p)} className="ml-auto inline-flex items-center gap-1"><Share2 className="size-4" /> Ulashish</button>
                  </div>
                  {openId === p.id && <Thread post={p} onAdd={(text) => setPosts((rows) => rows.map((row) => row.id === p.id ? { ...row, extra: (row.extra || 0) + 1, thread: [...(row.thread || []), { name: me.name, text }] } : row))} />}
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="min-w-0 space-y-3">
          <section className="rounded-2xl bg-white p-3 shadow-card">
            <div className="mb-2 flex items-center justify-between">
              <b className="text-[13px]">Haftaning top a’zolari</b>
              <span className="text-[11px] font-semibold text-sea">Barchasini ko‘rish</span>
            </div>
            <ol className="space-y-2">
              {LEADERS.map((m, i) => (
                <li key={m.name} className="flex items-center gap-2">
                  <span className="w-4 text-[12px] font-bold text-muted">{i + 1}</span>
                  <img src={m.avatar} alt="" className="size-8 rounded-full object-cover" />
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-[12px]">{m.name}</b>
                    <span className="text-[11px] text-muted">{m.role}</span>
                  </span>
                  <b className="text-[12px] text-sea">{m.score} <span className="font-medium text-muted">ball</span></b>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-2xl bg-white p-3 shadow-card">
            <div className="mb-2 flex items-center justify-between">
              <b className="inline-flex items-center gap-1 text-[13px]"><Flame className="size-3.5 text-[#f97316]" /> Trend mavzular</b>
              <span className="text-[11px] font-semibold text-sea">Barchasini ko‘rish</span>
            </div>
            <ol className="space-y-1.5">
              {TRENDS.map(([tag, count, id], i) => (
                <li key={tag}>
                  <button type="button" onClick={() => setTopic(id)} className="flex w-full items-center gap-2 text-left">
                    <span className="w-4 text-[12px] text-muted">{i + 1}</span>
                    <b className="flex-1 text-[12.5px] text-sea">{tag}</b>
                    <span className="text-[11px] text-muted">{count}</span>
                  </button>
                </li>
              ))}
            </ol>
          </section>

          {promo && <section className="relative overflow-hidden rounded-2xl bg-[#123044] text-white shadow-card">
            <img src={PROMO} alt="" className="h-[150px] w-full object-cover opacity-80" />
            <button type="button" aria-label="Yopish" onClick={() => setPromo(false)} className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-white/80 text-ink"><X className="size-3.5" /></button>
            <div className="p-3">
              <b className="text-[14px]">Klinik holatingizni ulashing</b>
              <p className="mt-1 text-[12px] text-white/80">Hamkasblaringizdan fikr oling, tajriba almashing</p>
              <button type="button" onClick={() => setComposer('keys')} className="mt-2 inline-flex h-9 w-full items-center justify-center gap-1 rounded-xl bg-sea text-[12.5px] font-semibold"><Plus className="size-4" /> Post yozish</button>
            </div>
          </section>}

          <section className="rounded-2xl bg-white p-3 shadow-card">
            <div className="mb-2 flex items-center justify-between">
              <b className="text-[13px]">Mening saqlanganlarim</b>
              <span className="text-[11px] font-semibold text-sea">Barchasini ko‘rish</span>
            </div>
            <ul className="space-y-2">
              {savedCards.slice(0, 4).map((s) => (
                <li key={s.id} className="flex items-center gap-2">
                  <img src={s.image} alt="" className="size-10 shrink-0 rounded-lg object-cover" />
                  <span className="min-w-0">
                    <b className="block truncate text-[12px]">{s.title}</b>
                    <span className="block truncate text-[11px] text-muted">{s.meta}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      {composer && <Composer initialKind={composer} onClose={() => setComposer(null)} onPublish={publish} />}
      {toast && <p className="fixed bottom-4 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-[12.5px] text-white">{toast}</p>}
    </div>
  )
}

function Composer({ initialKind, onClose, onPublish }) {
  const me = viewerOf(useProfile())
  const [form, setForm] = useState(() => ({ ...emptyForm(), kind: KINDS.some((k) => k.id === initialKind && k.id !== 'maqola') ? initialKind : 'keys' }))
  const [error, setError] = useState('')
  const patch = (key, value) => setForm((f) => ({ ...f, [key]: value }))
  const kinds = KINDS.filter((k) => k.id !== 'maqola')
  const previewTitle = form.title.trim() || '36-tish: apikal periodontit, qayta endodontik davolash'
  const previewBody = form.body.trim() || 'Bemor 36-tishda og‘riq bilan murojaat qildi. Avvalgi davolash sifatsiz bo‘lgan. Mikroskop ostida qayta endodontik davolash o‘tkazildi.'

  const addFiles = (files) => {
    const next = []
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Fayl 10 MB dan katta bo‘lmasin.')
        continue
      }
      next.push({ id: `${file.name}-${file.size}-${next.length}`, src: URL.createObjectURL(file) })
    }
    if (next.length) setForm((f) => ({ ...f, images: [...f.images, ...next].slice(0, 8) }))
  }

  const addTag = () => {
    const raw = form.tag.trim()
    if (!raw) return
    const tag = raw.startsWith('#') ? raw : `#${raw}`
    if (form.tags.includes(tag)) {
      patch('tag', '')
      return
    }
    setForm((f) => ({ ...f, tags: [...f.tags, tag], tag: '' }))
  }

  const submit = () => {
    if (!form.title.trim() || !form.body.trim() || !form.cat) {
      setError('Sarlavha, mavzu va qisqacha tavsif majburiy.')
      return
    }
    if (form.kind === 'keys' && !form.consent) {
      setError('Klinik keys uchun bemor roziligi belgilanishi kerak.')
      return
    }
    onPublish(form)
  }

  return (
    <div className="bemor-shade" onClick={onClose}>
      <div className="com-dialog" role="dialog" aria-labelledby="post-title" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div className="flex items-start gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-sea-50 text-sea"><ToothIcon className="size-5" /></span>
            <div>
              <h2 id="post-title" className="text-[16px] font-bold">Yangi post yozish</h2>
              <p className="text-[12px] text-muted">Bilim, tajriba va qiziqarli mavzularni hamkasblaringiz bilan ulashing</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Yopish" className="grid size-8 place-items-center rounded-lg text-muted"><X className="size-4" /></button>
        </div>
        <div className="bemor-dialog-body px-4 py-3">
          <div className="grid gap-2 sm:grid-cols-3">
            {kinds.map((k) => (
              <button key={k.id} type="button" onClick={() => patch('kind', k.id)} className="flex items-center gap-2 rounded-xl border px-3 py-2 text-left" style={{ borderColor: form.kind === k.id ? '#0b8a95' : '#e6ebf2', background: form.kind === k.id ? '#f3fbfb' : '#fff' }}>
                <KindIcon id={k.id} bg={k.bg} color={k.color} />
                <span className="min-w-0">
                  <b className="block text-[13px]">{k.title}</b>
                  <span className="block truncate text-[11px] text-muted">{k.text}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="com-modal-grid mt-4">
            <div className="min-w-0 space-y-4">
              <section>
                <h3 className="text-[14px] font-bold">Asosiy ma’lumotlar</h3>
                <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px]">
                  <label className="block text-[12px] font-semibold">Sarlavha
                    <input value={form.title} onChange={(e) => patch('title', e.target.value)} placeholder="Masalan: 36-tish: apikal periodontit, qayta endodontik davolash" className="mt-1 h-11 w-full rounded-xl border border-[#e6ebf2] px-3 text-[13px] font-normal outline-none focus:border-sea" />
                  </label>
                  <label className="block text-[12px] font-semibold">Mavzu (kategoriya) <span className="text-[#e11d48]">*</span>
                    <select value={form.cat} onChange={(e) => patch('cat', e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-[#e6ebf2] px-3 text-[13px] font-normal outline-none">
                      {CATS.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </label>
                </div>
                <label className="mt-3 block text-[12px] font-semibold">Qisqacha tavsif <span className="text-[#e11d48]">*</span>
                  <span className="mt-1 block rounded-xl border border-[#e6ebf2]">
                    <span className="flex items-center gap-1 border-b border-line px-2 py-1">
                      <Tool label="Qalin" onClick={() => patch('body', wrap(form.body, '**'))}><Bold className="size-3.5" /></Tool>
                      <Tool label="Kursiv" onClick={() => patch('body', wrap(form.body, '_'))}><Italic className="size-3.5" /></Tool>
                      <Tool label="Havola" onClick={() => patch('body', `${form.body}${form.body ? ' ' : ''}https://`)}><Link2 className="size-3.5" /></Tool>
                      <span className="ml-auto text-[11px] font-normal text-muted">{form.body.length}/1000</span>
                    </span>
                    <textarea maxLength={1000} value={form.body} onChange={(e) => patch('body', e.target.value)} placeholder="Klinik holat haqida qisqacha ma’lumot yozing..." className="h-24 w-full resize-none px-3 py-2 text-[13px] font-normal outline-none" />
                  </span>
                </label>
              </section>

              {form.kind === 'keys' && (
                <>
                  <section>
                    <h3 className="text-[14px] font-bold">Bemor ma’lumotlari <span className="font-medium text-muted">(ixtiyoriy)</span></h3>
                    <div className="mt-2 grid gap-3 sm:grid-cols-3">
                      <label className="text-[12px] font-semibold">Yosh
                        <input value={form.age} onChange={(e) => patch('age', e.target.value)} placeholder="Masalan: 28" className="mt-1 h-10 w-full rounded-xl border border-[#e6ebf2] px-3 text-[13px] font-normal outline-none" />
                      </label>
                      <fieldset className="text-[12px] font-semibold">Jinsi
                        <div className="mt-2 flex gap-3 font-normal">
                          {['Erkak', 'Ayol', 'Boshqa'].map((g) => (
                            <label key={g} className="inline-flex items-center gap-1"><input type="radio" name="gender" checked={form.gender === g} onChange={() => patch('gender', g)} className="accent-[#0b8a95]" /> {g}</label>
                          ))}
                        </div>
                      </fieldset>
                      <label className="text-[12px] font-semibold">Davolash sanasi
                        <input value={form.date} onChange={(e) => patch('date', e.target.value)} placeholder="dd.mm.yyyy" className="mt-1 h-10 w-full rounded-xl border border-[#e6ebf2] px-3 text-[13px] font-normal outline-none" />
                      </label>
                    </div>
                  </section>
                  <section>
                    <h3 className="text-[14px] font-bold">Klinik ma’lumotlar</h3>
                    <div className="mt-2 flex gap-1 overflow-x-auto no-scrollbar">
                      {CLINIC.map(([id, label], i) => (
                        <button key={id} type="button" onClick={() => patch('step', id)} className={`h-8 shrink-0 rounded-full px-2.5 text-[11.5px] font-semibold ${form.step === id ? 'bg-sea text-white' : 'bg-[#f3f6fa] text-ink-2'}`}>{i + 1} {label}</button>
                      ))}
                    </div>
                    <textarea value={form.notes[form.step]} onChange={(e) => setForm((f) => ({ ...f, notes: { ...f.notes, [f.step]: e.target.value } }))} placeholder={CLINIC.find((c) => c[0] === form.step)?.[2]} className="mt-2 h-20 w-full resize-none rounded-xl border border-[#e6ebf2] px-3 py-2 text-[13px] outline-none" />
                  </section>
                </>
              )}

              <section>
                <h3 className="text-[14px] font-bold">Rasm va fayllar</h3>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <label className="grid h-[74px] w-[92px] cursor-pointer place-items-center rounded-xl border border-dashed border-[#c9d5e2] text-center text-[10px] text-muted">
                    <Search className="size-4" />
                    Rasm, rentgen yoki fayl yuklash
                    <span className="block">PNG, JPG, JPEG, DICOM, PDF · 10MB</span>
                    <input type="file" accept="image/png,image/jpeg,application/pdf" multiple className="hidden" onChange={(e) => { addFiles([...e.target.files]); e.target.value = '' }} />
                  </label>
                  {form.images.map((img) => (
                    <span key={img.id} className="relative">
                      <img src={img.src} alt="" className="h-[74px] w-[74px] rounded-xl object-cover" />
                      <button type="button" aria-label="Olib tashlash" onClick={() => setForm((f) => ({ ...f, images: f.images.filter((x) => x.id !== img.id) }))} className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-white shadow"><X className="size-3" /></button>
                    </span>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-[14px] font-bold">Teglar <span className="font-medium text-muted">(kalit so‘zlar)</span></h3>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 rounded-xl border border-[#e6ebf2] px-2 py-2">
                  {form.tags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 rounded-full bg-sea-50 px-2 py-0.5 text-[12px] font-semibold text-sea">
                      {t}
                      <button type="button" aria-label="Tegni olib tashlash" onClick={() => setForm((f) => ({ ...f, tags: f.tags.filter((x) => x !== t) }))}><X className="size-3" /></button>
                    </span>
                  ))}
                  <input value={form.tag} onChange={(e) => patch('tag', e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }} placeholder="Enter bilan qo‘shing..." className="h-7 min-w-[140px] flex-1 bg-transparent text-[12.5px] outline-none" />
                </div>
              </section>

              <section>
                <h3 className="text-[14px] font-bold">Maxfiylik va rozilik</h3>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <Check on={form.consent} set={(v) => patch('consent', v)} label="Bemor roziligi olingan" />
                  <Check on={form.face} set={(v) => patch('face', v)} label="Yuz ko‘rinmaydi" />
                  <Check on={form.nameHidden} set={(v) => patch('nameHidden', v)} label="Ism va shaxsiy ma’lumotlar yashirilgan" />
                  <Check on={form.science} set={(v) => patch('science', v)} label="Ilmiy maqsadda ulashish mumkin" />
                </div>
              </section>
              {error && <p className="rounded-xl bg-[#fff1f2] px-3 py-2 text-[12.5px] text-[#e11d48]">{error}</p>}
            </div>

            <aside className="min-w-0 space-y-3">
              <section className="rounded-2xl border border-line bg-white p-3">
                <b className="text-[12px] text-muted">Post ko‘rinishi (oldindan)</b>
                <div className="mt-2 flex items-center gap-2">
                  <img src={me.avatar} alt="" className="size-8 rounded-full object-cover" />
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-[12px]">{me.name}</b>
                    <span className="text-[10px] text-muted">{me.role} · {me.place}</span>
                  </span>
                  <span className="rounded-full bg-sea-50 px-2 py-0.5 text-[10px] font-semibold text-sea">{KIND_LABEL[form.kind]}</span>
                </div>
                <b className="mt-2 block text-[13px] leading-snug">{previewTitle}</b>
                <p className="mt-1 text-[11.5px] leading-relaxed text-ink-2">{previewBody}</p>
                {form.images.length > 0 && <div className="mt-2"><Shots images={form.images.map((i) => i.src)} /></div>}
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="rounded-full bg-[#f3f6fa] px-2 py-0.5 text-[10px]">#{form.cat.replace(/\s/g, '')}</span>
                  {form.tags.slice(0, 3).map((t) => <span key={t} className="rounded-full bg-[#f3f6fa] px-2 py-0.5 text-[10px]">{t}</span>)}
                </div>
              </section>
              <section className="rounded-2xl bg-[#eefbf6] p-3 text-[12px] text-[#157a45]">
                <b className="inline-flex items-center gap-1"><ShieldCheck className="size-4" /> Muhim eslatma</b>
                <ul className="mt-2 space-y-1.5">
                  {['Bemorning roziligi olingan bo‘lishi shart.', 'Rasmlarda bemorni aniqlash mumkin bo‘lgan ma’lumotlar bo‘lmasin.', 'Klinik ma’lumotlar faqat ta’lim va tajriba almashish maqsadida qo‘llansin.', 'Etik qoidalar va tibbiy maxfiylik rioya qiling.'].map((line) => (
                    <li key={line} className="flex gap-1.5"><span>✓</span> {line}</li>
                  ))}
                </ul>
              </section>
            </aside>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-4 py-3">
          <button type="button" onClick={onClose} className="h-10 rounded-xl border border-[#d7e0ea] px-4 text-[13px] font-semibold">Bekor</button>
          <button type="button" onClick={submit} className="inline-flex h-10 items-center gap-1 rounded-xl bg-sea px-4 text-[13px] font-semibold text-white"><Send className="size-4" /> Post joylash</button>
        </div>
      </div>
    </div>
  )
}

function Thread({ post, onAdd }) {
  const [text, setText] = useState('')
  return (
    <div className="mt-3 border-t border-line pt-3">
      <ul className="space-y-2">
        {(post.thread || []).map((c, i) => (
          <li key={`${c.name}-${i}`} className="rounded-xl bg-[#f6f9fc] px-3 py-2 text-[12.5px]">
            <b>{c.name}</b>
            <p className="text-ink-2">{c.text}</p>
          </li>
        ))}
      </ul>
      <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; onAdd(text.trim()); setText('') }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Izoh yozing..." className="h-9 min-w-0 flex-1 rounded-xl border border-[#e6ebf2] px-3 text-[12.5px] outline-none" />
        <button className="h-9 rounded-xl bg-sea px-3 text-[12px] font-semibold text-white">Yuborish</button>
      </form>
    </div>
  )
}

function Shots({ images }) {
  const shown = images.slice(0, 4)
  const more = images.length - shown.length
  return (
    <div className="com-shots">
      {shown.map((src, i) => (
        <div key={`${src}-${i}`} className="relative h-[92px] overflow-hidden rounded-xl bg-[#eef3f8]">
          <img src={src} alt="" className="h-full w-full object-cover" />
          {more > 0 && i === shown.length - 1 && <span className="absolute inset-0 grid place-items-center bg-[#0b1f3a]/55 text-[18px] font-bold text-white">+{more}</span>}
        </div>
      ))}
    </div>
  )
}

function Tag({ tag }) {
  const cls = tag.tone === 'keys' ? 'bg-[#e5f7ea] text-[#17803d]' : tag.tone === 'hash' ? 'border border-[#d7e0ea] text-ink-2' : tag.tone === 'savol' ? 'bg-[#e8f1ff] text-[#3b6fd8]' : tag.tone === 'talk' ? 'bg-[#f3e8ff] text-[#8b3fd6]' : tag.tone === 'paper' ? 'bg-[#e7f3ff] text-[#2b7bb9]' : 'bg-[#f3f6fa] text-ink-2'
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{tag.t}</span>
}

function KindIcon({ id, bg, color }) {
  const Icon = id === 'savol' ? HelpCircle : id === 'muhokama' ? MessagesSquare : id === 'maqola' ? FileText : null
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-xl" style={{ background: bg, color }}>
      {Icon ? <Icon className="size-5" /> : <ToothIcon className="size-5" />}
    </span>
  )
}

function Menu({ onHide }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative">
      <button type="button" aria-label="Yana" onClick={() => setOpen((v) => !v)} className="grid size-8 place-items-center rounded-lg text-muted"><MoreHorizontal className="size-4" /></button>
      {open && (
        <button type="button" onClick={() => { setOpen(false); onHide() }} className="absolute right-0 top-8 z-10 whitespace-nowrap rounded-lg bg-white px-3 py-2 text-[12px] shadow-card">Yashirish</button>
      )}
    </span>
  )
}

function Check({ on, set, label }) {
  return <label className="flex items-center gap-2 text-[12.5px]"><input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} className="accent-[#0b8a95]" /> {label}</label>
}

function Tool({ label, onClick, children }) {
  return <button type="button" aria-label={label} onClick={onClick} className="grid size-7 place-items-center rounded-md text-ink-2 hover:bg-[#f3f6fa]">{children}</button>
}

function wrap(value, mark) {
  return `${value}${mark}matn${mark}`
}
