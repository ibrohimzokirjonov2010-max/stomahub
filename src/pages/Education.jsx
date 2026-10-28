import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal, LayoutGrid, LayoutList, Heart, Star, Play, Clock, BookOpen, Award, Headphones, X, FileBadge, Hourglass, BadgeCheck, MonitorPlay } from 'lucide-react'
import ShopLayout from '../components/market/ShopLayout'
import EmptyCatalog from '../components/EmptyCatalog'
import { useMobile } from '../useMobile'
import { BottomSheet } from '../components/mobile/MobileSeminars'
import { useCatalogVersion } from '../recordSync'
import { directions, levels, formats, prices, sorts, courses, continuing, certificates, why, money } from '../educationData'

export default function EducationRoute() {
  const [q, setQ] = useState('')
  const mobile = useMobile()
  return (
    <ShopLayout active="education" search="plain" placeholder="Stomatologga nima kerak?" onQuery={setQ}>
      <Education headerQuery={q} mobile={mobile} />
    </ShopLayout>
  )
}

function Education({ headerQuery, mobile }) {
  useCatalogVersion()
  const [local, setLocal] = useState('')
  const [direction, setDirection] = useState('all')
  const [level, setLevel] = useState('all')
  const [format, setFormat] = useState('all')
  const [price, setPrice] = useState('all')
  const [sort, setSort] = useState('popular')
  const [view, setView] = useState('grid')
  const [showFilters, setShowFilters] = useState(true)
  const [sheet, setSheet] = useState(null)
  const activeCount = [direction !== 'all', level !== 'all', format !== 'all', price !== 'all', sort !== 'popular'].filter(Boolean).length
  const openSheet = () => setSheet({ direction, level, format, price, sort })
  const applySheet = () => { setDirection(sheet.direction); setLevel(sheet.level); setFormat(sheet.format); setPrice(sheet.price); setSort(sheet.sort); setSheet(null) }
  const [saved, setSaved] = useState(() => new Set())
  const [playing, setPlaying] = useState(null)
  const [chat, setChat] = useState(false)
  const [sent, setSent] = useState(false)

  const query = (local || headerQuery).trim().toLowerCase()
  const list = useMemo(() => courses
    .filter((c) => direction === 'all' || c.direction === direction)
    .filter((c) => level === 'all' || c.level === level)
    .filter((c) => format === 'all' || c.format === format)
    .filter((c) => price === 'all' || (price === 'free' ? c.price === 0 : c.price > 0))
    .filter((c) => !query || `${c.title} ${c.about} ${c.doctor}`.toLowerCase().includes(query))
    .slice()
    .sort((a, b) => {
      if (sort === 'cheap') return a.price - b.price
      if (sort === 'rich') return b.price - a.price
      if (sort === 'fresh') return Number(!!b.fresh) - Number(!!a.fresh) || a.rank - b.rank
      return a.rank - b.rank
    }), [direction, level, format, price, sort, query])

  const toggle = (id) => setSaved((prev) => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })
  const openCourse = (id) => setPlaying(courses.find((c) => c.id === id) || continuing.find((c) => c.id === id))

  return (
    <div className="grid gap-4 pb-8 pt-3 xl:grid-cols-[minmax(0,1fr)_250px]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[24px] font-extrabold tracking-tight text-ink">Ta’lim</h1>
            <p className="mt-0.5 text-[12px] text-ink-2">Bilimingizni oshiring. Klinik ko‘nikmalar, protokollar va sertifikatli kurslar.</p>
          </div>
          <div className="flex items-center gap-2 max-md:w-full">
            <label className="flex h-9 w-[250px] max-md:w-auto max-md:flex-1 items-center rounded-full bg-white px-3 shadow-card">
              <Search className="size-3.5 text-muted" />
              <input value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Dars yoki kurs qidiring..." className="h-full flex-1 bg-transparent px-2 text-[11px] outline-none placeholder:text-[#8a94a3]" />
            </label>
            <button onClick={() => (mobile ? openSheet() : setShowFilters((v) => !v))} aria-label="Filtrlar" className={`relative grid size-9 place-items-center rounded-xl bg-white shadow-card ${(mobile ? activeCount : showFilters) ? 'text-sea' : 'text-ink-2'}`}>
              <SlidersHorizontal className="size-4" />
              {mobile && activeCount > 0 && <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-sea text-[9px] font-bold text-white">{activeCount}</span>}
            </button>
          </div>
        </div>

        {mobile && (
          <div className="-mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {directions.map(([k, name]) => (
              <button key={k} onClick={() => setDirection(k)} className={`h-[28px] shrink-0 whitespace-nowrap rounded-full px-3 text-[11px] font-medium ${direction === k ? 'bg-sea text-white' : 'bg-white text-ink-2 shadow-card'}`}>{name}</button>
            ))}
          </div>
        )}

        {continuing.length > 0 && <section className="mt-4">
          <h2 className="mb-2 text-[15px] font-bold text-ink">Davom ettirish</h2>
          <div className="grid gap-2.5 md:grid-cols-3">
            {continuing.map((c) => (
              <article key={c.id} className="flex gap-2 rounded-xl bg-white p-2 shadow-card">
                <div className="relative shrink-0 overflow-hidden rounded-lg" style={{ width: 92, height: 68 }}>
                  <img src={c.cover} alt="" className="size-full object-cover" />
                  <span className="absolute bottom-1 left-1 rounded bg-black/75 px-1 text-[8px] font-medium text-white">{c.duration}</span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <h3 className="line-clamp-2 text-[11px] font-bold leading-snug text-ink">{c.title}</h3>
                  <p className="mt-0.5 text-[9px] text-muted">{c.progress.total} darsdan {c.progress.seen} darsi ko‘rildi</p>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-sea-50">
                    <div className="h-full rounded-full bg-sea" style={{ width: `${c.progress.pct}%` }} />
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-1.5">
                    <span className="text-[10px] font-bold text-sea">{c.progress.pct}%</span>
                    <button onClick={() => openCourse(c.courseId || c.id)} className="flex h-[24px] items-center gap-1 rounded-full bg-sea px-2 text-[9px] font-semibold text-white hover:bg-sea-600">
                      Davom ettirish <Play className="size-2.5 fill-white" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>}

        {!mobile && showFilters && (
          <div className="mt-3 flex flex-col gap-2">
            <ChipRow label="Yo‘nalish:" value={direction} onChange={setDirection} items={directions} />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <ChipRow label="Daraja:" value={level} onChange={setLevel} items={levels} />
              <ChipRow label="Format:" value={format} onChange={setFormat} items={formats} />
              <ChipRow label="Narx:" value={price} onChange={setPrice} items={prices} />
              <label className="relative ml-auto">
                <span className="mr-1 text-[10px] text-muted">Saralash:</span>
                <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-[26px] appearance-none rounded-lg bg-white pl-2 pr-6 text-[10px] font-medium text-ink shadow-card outline-none">
                  {Object.entries(sorts).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </label>
            </div>
          </div>
        )}

        <div className={`${mobile ? 'mt-3' : 'mt-4'} mb-2 flex items-center justify-between`}>
          <h2 className="text-[15px] font-bold text-ink">Barcha kurslar <span className="ml-1 text-[11px] font-medium text-muted">{list.length} ta kurs topildi</span></h2>
          <div className="flex overflow-hidden rounded-lg bg-white shadow-card">
            <button aria-label="Kartochkalar" onClick={() => setView('grid')} className={`grid size-7 place-items-center ${view === 'grid' ? 'bg-sea text-white' : 'text-ink-2'}`}><LayoutGrid className="size-3.5" /></button>
            <button aria-label="Ro‘yxat" onClick={() => setView('list')} className={`grid size-7 place-items-center ${view === 'list' ? 'bg-sea text-white' : 'text-ink-2'}`}><LayoutList className="size-3.5" /></button>
          </div>
        </div>

        {list.length === 0 ? (
          <div className="grid h-[160px] place-items-center rounded-xl bg-white text-[12px] text-muted shadow-card">{courses.length ? 'Kurs topilmadi' : 'Hali kurslar qo‘shilmagan'}</div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
      {list.map((c) => <CourseCard key={c.id} c={c} saved={saved.has(c.id)} onSave={() => toggle(c.id)} onOpen={() => openCourse(c.id)} />)}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {list.map((c) => <CourseRow key={c.id} c={c} saved={saved.has(c.id)} onSave={() => toggle(c.id)} onOpen={() => openCourse(c.id)} />)}
          </div>
        )}
      </div>

      <aside className="flex flex-col gap-3">
        <div className="rounded-xl bg-white p-3 shadow-card">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[12px] font-bold text-ink">Mening sertifikatlarim</h3>
            <span className="text-[9px] font-medium text-sea">Barchasini ko‘rish</span>
          </div>
          {certificates.map((c) => (
            <div key={c.title} className="flex items-start gap-2 py-1.5">
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-sea-50 text-sea"><FileBadge className="size-3.5" /></span>
              <div className="min-w-0">
                <p className="text-[10.5px] font-semibold leading-tight text-ink">{c.title}</p>
                <p className="text-[9px] text-muted">{c.score}</p>
                <p className="text-[9px] text-muted">{c.date}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-white p-3 shadow-card">
          <h3 className="mb-2 text-[12px] font-bold text-ink">Mening natijalarim</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              ['42', 'Ko‘rilgan soat', Clock],
              ['6', 'Tugatilgan kurslar', BadgeCheck],
              ['3', 'Sertifikatlar', Award],
              ['1', 'Joriy kurs', Hourglass],
            ].map(([n, label, Icon]) => (
              <div key={label} className="rounded-lg bg-[#f6f9fc] px-2 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-[18px] font-extrabold text-ink">{n}</span>
                  <Icon className="size-3.5 text-sea" />
                </div>
                <p className="text-[9px] text-muted">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white p-3 shadow-card">
          <h3 className="mb-2 text-[12px] font-bold text-ink">Nega Ta’lim?</h3>
          <div className="flex flex-col gap-2">
            {why.map(([title, text], i) => {
              const Icon = [MonitorPlay, Award, FileBadge, BookOpen][i]
              return (
                <div key={title} className="flex gap-2">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-sea-50 text-sea"><Icon className="size-3.5" /></span>
                  <div>
                    <p className="text-[10.5px] font-semibold leading-tight text-ink">{title}</p>
                    <p className="text-[9px] text-muted">{text}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-white p-3 shadow-card">
          <div className="min-w-0 flex-1">
            <h3 className="text-[12px] font-bold text-ink">Savollaringiz bormi?</h3>
            <p className="mt-0.5 text-[9.5px] leading-snug text-muted">Ta’lim bo‘yicha yordam va maslahatlar tayyormiz.</p>
            <button onClick={() => { setChat(true); setSent(false) }} className="mt-2 flex h-7 items-center gap-1.5 rounded-full bg-sea px-3 text-[10px] font-semibold text-white hover:bg-sea-600">
              <Headphones className="size-3.5" /> Onlayn chat
            </button>
          </div>
          <img src="/images/education/support.jpg" alt="" className="size-16 rounded-xl object-cover" />
        </div>
      </aside>

      {sheet && (
        <BottomSheet title="Filtrlar" onClose={() => setSheet(null)} footer={<>
          <button type="button" onClick={() => setSheet({ direction: 'all', level: 'all', format: 'all', price: 'all', sort: 'popular' })} className="h-11 flex-1 rounded-xl border border-line text-[13px] font-semibold text-ink">Tozalash</button>
          <button type="button" onClick={applySheet} className="h-11 flex-1 rounded-xl bg-sea text-[13px] font-semibold text-white">Qo‘llash</button>
        </>}>
          {[['Yo‘nalish', 'direction', directions], ['Daraja', 'level', levels], ['Format', 'format', formats], ['Narx', 'price', prices], ['Saralash', 'sort', Object.entries(sorts)]].map(([label, key, items]) => (
            <div key={key} className="mt-3">
              <p className="mb-1.5 text-[12px] font-semibold text-ink">{label}</p>
              <div className="flex flex-wrap gap-1.5">
                {items.map(([k, name]) => <button key={k} type="button" onClick={() => setSheet((d) => ({ ...d, [key]: k }))} className={`h-8 rounded-full px-3 text-[12px] font-medium ${sheet[key] === k ? 'bg-sea text-white' : 'bg-page text-ink-2'}`}>{name}</button>)}
              </div>
            </div>
          ))}
        </BottomSheet>
      )}
      {playing && (
        <Modal title={playing.title} onClose={() => setPlaying(null)}>
          <img src={playing.cover} alt="" className="h-[160px] w-full rounded-xl object-cover" />
          <p className="mt-3 text-[12px] text-ink-2">{playing.about || 'Klinik video dars. Davom ettirish joyidan ochiladi.'}</p>
          <p className="mt-1 text-[11px] text-muted">{playing.doctor ? `${playing.doctor} · ` : ''}{playing.duration}</p>
          <button onClick={() => setPlaying(null)} className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-sea text-[13px] font-semibold text-white">
            <Play className="size-4 fill-white" /> Tomosha qilish
          </button>
        </Modal>
      )}

      {chat && (
        <Modal title="Onlayn chat" onClose={() => setChat(false)}>
          {sent ? <p className="py-6 text-center text-[13px] text-ink-2">Xabar yuborildi. Mutaxassis tez orada javob beradi.</p> : (
            <form onSubmit={(e) => { e.preventDefault(); setSent(true) }} className="flex flex-col gap-2">
              <textarea required placeholder="Savolingizni yozing..." className="h-24 w-full rounded-lg bg-page p-3 text-[12px] outline-none focus:ring-1 focus:ring-sea" />
              <button className="h-10 rounded-lg bg-sea text-[13px] font-semibold text-white">Yuborish</button>
            </form>
          )}
        </Modal>
      )}
    </div>
  )
}

function ChipRow({ label, value, onChange, items }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-[10px] text-muted">{label}</span>
      {items.map(([k, name]) => (
        <button key={k} onClick={() => onChange(k)} className={`h-[26px] rounded-full px-2.5 text-[10px] font-medium ${value === k ? 'bg-sea text-white' : 'bg-white text-ink-2 shadow-card hover:text-sea'}`}>{name}</button>
      ))}
    </div>
  )
}

function CourseCard({ c, saved, onSave, onOpen }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl bg-white shadow-card">
      <Cover c={c} saved={saved} onSave={onSave} tall />
      <div className="flex flex-1 flex-col px-2.5 pb-2.5 pt-2">
        <h3 className="line-clamp-2 text-[12px] font-bold leading-snug text-ink">{c.title}</h3>
        <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-ink-2">{c.about}</p>
        <Teacher c={c} />
        <Meta c={c} />
        <Footer c={c} onOpen={onOpen} />
      </div>
    </article>
  )
}

function CourseRow({ c, saved, onSave, onOpen }) {
  return (
    <article className="flex gap-3 rounded-xl bg-white p-2 shadow-card">
      <div className="relative shrink-0 overflow-hidden rounded-lg" style={{ width: 168, height: 96 }}>
        <img src={c.cover} alt="" className="size-full object-cover" />
        <Badge c={c} />
        <span className="absolute bottom-1.5 left-1.5 rounded bg-black/75 px-1 text-[8px] text-white">{c.duration}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col py-0.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[13px] font-bold text-ink">{c.title}</h3>
          <button onClick={onSave} aria-label="Saqlash"><Heart className={`size-4 ${saved ? 'fill-sale text-sale' : 'text-ink-2'}`} /></button>
        </div>
        <p className="text-[11px] text-ink-2">{c.about}</p>
        <Teacher c={c} />
        <div className="mt-auto flex items-end justify-between">
          <Meta c={c} />
          <Footer c={c} onOpen={onOpen} />
        </div>
      </div>
    </article>
  )
}

function Cover({ c, saved, onSave }) {
  return (
    <div className="relative" style={{ height: 108 }}>
      <img src={c.cover} alt="" className="size-full object-cover" />
      <Badge c={c} />
      <button onClick={onSave} aria-label="Saqlash" className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-white/90">
        <Heart className={`size-3.5 ${saved ? 'fill-sale text-sale' : 'text-ink-2'}`} />
      </button>
      <span className="absolute bottom-1.5 left-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-medium text-white">{c.duration}</span>
    </div>
  )
}

function Badge({ c }) {
  if (c.price === 0) return <span className="absolute left-2 top-2 rounded-full bg-sea px-1.5 py-0.5 text-[8px] font-bold text-white">Bepul</span>
  if (c.off) return <span className="absolute left-2 top-2 rounded-full bg-sale px-1.5 py-0.5 text-[8px] font-bold text-white">-{c.off}%</span>
  if (c.fresh) return <span className="absolute left-2 top-2 rounded-full bg-[#1a73e8] px-1.5 py-0.5 text-[8px] font-bold text-white">Yangi</span>
  return null
}

function Teacher({ c }) {
  return (
    <div className="mt-1.5 flex items-center gap-1.5">
      <img src={c.avatar} alt="" className="size-6 rounded-full object-cover" />
      <div className="min-w-0">
        <p className="truncate text-[10px] font-semibold text-ink">{c.doctor}</p>
        <p className="truncate text-[9px] text-muted">{c.role}</p>
      </div>
    </div>
  )
}

function Meta({ c }) {
  return (
    <div className="mt-1">
      <p className="flex items-center gap-1 text-[9.5px] text-ink-2"><Star className="size-3 fill-star text-star" /> {c.rating} <span className="text-muted">({c.reviews} ta sharh)</span></p>
      <p className="mt-0.5 text-[9.5px] text-ink-2">{c.lessons} dars · {c.hours} soat · O‘zbek</p>
    </div>
  )
}

function Footer({ c, onOpen }) {
  return (
    <div className="mt-auto flex items-end justify-between gap-1 pt-2">
      <div>
        {c.oldPrice ? <p className="text-[9px] text-muted line-through">{money(c.oldPrice)}</p> : null}
        <p className={`text-[12px] font-extrabold ${c.price ? 'text-ink' : 'text-sea'}`}>{money(c.price)}</p>
      </div>
      <button onClick={onOpen} className="h-[26px] shrink-0 rounded-full bg-sea px-2.5 text-[10px] font-semibold text-white hover:bg-sea-600">
        {c.price ? 'Kursni boshlash' : 'Tomosha qilish'}
      </button>
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[420px] rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-[16px] font-bold text-ink">{title}</h3>
          <button onClick={onClose} aria-label="Yopish"><X className="size-4 text-muted" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}
