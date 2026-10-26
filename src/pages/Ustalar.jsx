import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  LayoutGrid, Wrench, Cog, Fan, Container, Scan, Monitor, Hammer, Phone, Send, Heart, Star,
  MapPin, Briefcase, ChevronDown, Upload, ShieldCheck, BadgeCheck, Clock, X,
} from 'lucide-react'
import ShopLayout from '../components/market/ShopLayout'
import { masters, cats, cities, districts, sorts, why, statusLabel } from '../ustalarData'

const catIcon = { all: LayoutGrid, unit: Wrench, handpiece: Cog, compressor: Fan, autoclave: Container, cbct: Scan, scan: Monitor, install: Hammer }

export default function Ustalar() {
  const [q, setQ] = useState('')
  return (
    <ShopLayout active="ustalar" search="plain" placeholder="Usta, brend yoki xizmat turini qidiring..." onQuery={setQ}>
      <Catalog query={q} />
    </ShopLayout>
  )
}

function Catalog({ query }) {
  const [cat, setCat] = useState('all')
  const [city, setCity] = useState('Toshkent')
  const [district, setDistrict] = useState('')
  const [brand, setBrand] = useState('')
  const [free, setFree] = useState('')
  const [rating, setRating] = useState('')
  const [sort, setSort] = useState('popular')
  const [saved, setSaved] = useState(() => new Set())
  const [call, setCall] = useState(null)
  const [order, setOrder] = useState(null)
  const [urgent, setUrgent] = useState(false)
  const [join, setJoin] = useState(false)
  const [sent, setSent] = useState(false)
  const [map, setMap] = useState(false)

  const brands = useMemo(() => [...new Set(masters.flatMap((m) => m.brands))].sort(), [])
  const list = useMemo(() => {
    const text = query.trim().toLowerCase()
    let rows = masters.filter((m) => {
      if (cat !== 'all' && !m.cats.includes(cat)) return false
      if (city && m.city !== city) return false
      if (district && m.district !== district) return false
      if (brand && !m.brands.some((b) => b.toLowerCase() === brand.toLowerCase()) && !m.tags.some((t) => t.toLowerCase() === brand.toLowerCase())) return false
      if (free && m.status !== free) return false
      if (rating && m.rating < Number(rating)) return false
      if (text && !`${m.name} ${m.role} ${m.tags.join(' ')} ${m.brands.join(' ')}`.toLowerCase().includes(text)) return false
      return true
    })
    if (sort === 'rating') rows = [...rows].sort((a, b) => b.rating - a.rating || b.reviews - a.reviews)
    else if (sort === 'years') rows = [...rows].sort((a, b) => b.years - a.years)
    else if (sort === 'jobs') rows = [...rows].sort((a, b) => b.jobs - a.jobs)
    return rows
  }, [cat, city, district, brand, free, rating, sort, query])

  return (
    <div className="pb-8 pt-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-[240px] max-w-[560px]">
          <h1 className="text-[22px] font-extrabold leading-tight text-ink">Ustalar va servis</h1>
          <p className="mt-1 text-[12px] text-muted">Stomatologik uskunalar uchun professional ta’mirlash, o‘rnatish va texnik xizmat.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setUrgent(true)} className="flex h-10 items-center gap-2 rounded-xl bg-[#ffe8ea] px-3 text-left text-[#e23b4a]">
            <Phone className="size-4" />
            <span><span className="block text-[12px] font-bold">Shoshilinch chaqiruv</span><span className="block text-[10px]">24/7 tezkor xizmat</span></span>
          </button>
          <button onClick={() => setJoin(true)} className="flex h-10 items-center gap-2 rounded-xl border border-sea bg-white px-3 text-[12px] font-semibold text-sea">Usta sifatida ro‘yxatdan o‘tish</button>
        </div>
      </div>

      <div className="mt-3 flex gap-1.5 overflow-x-auto no-scrollbar">
        {cats.map(([k, label]) => {
          const Icon = catIcon[k]
          return (
            <button key={k} onClick={() => setCat(k)} className={`flex h-[30px] shrink-0 items-center gap-1.5 rounded-full px-3 text-[11px] font-medium ${cat === k ? 'bg-sea text-white' : 'bg-white text-ink-2 shadow-card'}`}>
              <Icon className="size-3.5" /> {label}
            </button>
          )
        })}
      </div>

      <div className="ustalar-layout mt-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <Select label="Shahar" value={city} onChange={setCity} options={[['', 'Barchasi'], ...cities.map((c) => [c, c])]} />
            <Select label="Tuman" value={district} onChange={setDistrict} options={[['', 'Barchasi'], ...districts.map((d) => [d, d])]} />
            <Select label="Brend/jihozlar" value={brand} onChange={setBrand} options={[['', 'Barchasi'], ...brands.map((b) => [b, b])]} />
            <Select label="Hozir bo‘sh" value={free} onChange={setFree} options={[['', 'Barchasi'], ['online', 'Onlayn'], ['soon', 'Tez keladi'], ['offline', 'Offlayn']]} />
            <Select label="Reyting" value={rating} onChange={setRating} options={[['', 'Barchasi'], ['4.9', '4.9+'], ['4.7', '4.7+'], ['4.5', '4.5+']]} />
            <span className="ml-auto text-[11px] text-muted">Saralash</span>
            <Select label="" value={sort} onChange={setSort} options={Object.entries(sorts)} />
          </div>
          <p className="mb-2 text-[13px] font-bold text-ink">{list.length} ta usta topildi</p>
          <div className="flex flex-col gap-2">
            {list.length === 0 ? <div className="grid h-[120px] place-items-center rounded-xl bg-white text-[12px] text-muted shadow-card">Usta topilmadi</div> : list.map((m) => (
              <Card key={m.id} m={m} saved={saved.has(m.id)} onSave={() => setSaved((s) => { const n = new Set(s); n.has(m.id) ? n.delete(m.id) : n.add(m.id); return n })} onCall={() => setCall(m)} onOrder={() => setOrder(m)} />
            ))}
          </div>
        </div>

        <aside className="flex flex-col gap-3">
          <form onSubmit={(e) => { e.preventDefault(); setSent(true) }} className="rounded-xl bg-white p-3 shadow-card">
            <h3 className="text-[13px] font-bold">Ta’mir so‘rovi</h3>
            <p className="mt-0.5 text-[10px] leading-snug text-muted">Usta va brendni ma’lumot qoldiring. Biz sizga mos ustani topamiz.</p>
            {sent ? <p className="mt-3 text-[12px] text-ink-2">So‘rov yuborildi. Mos usta tez orada bog‘lanadi.</p> : (
              <div className="mt-2 flex flex-col gap-2">
                <Field label="Jihoz turi" placeholder="Masalan, stomatologik ustanovka" />
                <Field label="Brend va model" placeholder="Masalan, Sirona Intego" />
                <label className="text-[10px] text-muted">Muammo tavsifi
                  <textarea required placeholder="Muammoni qisqacha yozing..." className="mt-1 h-16 w-full rounded-lg bg-page p-2 text-[11px] text-ink outline-none" />
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-line px-2 py-2 text-[10px] text-muted">
                  <Upload className="size-3.5 text-sea" /> Rasm yoki video yuklash
                  <input type="file" accept="image/*,video/mp4" className="hidden" />
                </label>
                <p className="-mt-1 text-[9px] text-muted">JPG, PNG, MP4 — 10 MB gacha</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <Field label="Manzil" placeholder="Toshkent" />
                  <Field label="Tuman" placeholder="Tuman" />
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <Field label="Qulay vaqt" placeholder="Bugun" />
                  <Field label="Soat" placeholder="14:00–16:00" />
                </div>
                <button className="h-9 rounded-lg bg-sea text-[12px] font-semibold text-white">So‘rov yuborish</button>
              </div>
            )}
          </form>

          <div className="overflow-hidden rounded-xl bg-white shadow-card">
            <div className="relative h-[120px] bg-[#d7e7f2]">
              <div className="absolute left-6 top-6 h-10 w-16 rounded bg-white/70" />
              <div className="absolute bottom-4 right-8 h-8 w-20 rounded bg-white/60" />
              <div className="absolute left-1/2 top-8 -translate-x-1/2 rounded-lg bg-white px-2 py-1 shadow">
                <p className="text-[10px] font-bold">Sardor Rahimov</p>
                <p className="text-[9px] text-muted">4.9 (125) · Toshkent</p>
              </div>
              <MapPin className="absolute left-1/2 top-4 size-4 -translate-x-1/2 text-sea" />
            </div>
            <div className="p-3">
              <h3 className="text-[12px] font-bold">Ustalar xaritada</h3>
              <button onClick={() => setMap(true)} className="mt-1 text-[11px] font-semibold text-sea">Barcha ustalarni xaritada ko‘rish</button>
            </div>
          </div>

          <div className="rounded-xl bg-white p-3 shadow-card">
            <h3 className="text-[13px] font-bold">Nega StomaHub ustalari?</h3>
            <div className="mt-2 flex flex-col gap-2">
              {why.map(([title, text], i) => {
                const Icon = [BadgeCheck, ShieldCheck, Clock, Star][i]
                return (
                  <div key={title} className="flex items-start gap-2">
                    <Icon className="mt-0.5 size-3.5 shrink-0 text-sea" />
                    <div><p className="text-[11px] font-semibold">{title}</p><p className="text-[10px] text-muted">{text}</p></div>
                  </div>
                )
              })}
            </div>
          </div>
        </aside>
      </div>

      {call && <Note title="Qo‘ng‘iroq" done={`${call.name}: ${call.phone}. Telegram: @${call.telegram}`} onClose={() => setCall(null)} />}
      {order && <FormModal title={`${order.name} — buyurtma`} done="Buyurtma qabul qilindi. Usta siz bilan bog‘lanadi." onClose={() => setOrder(null)} fields={['Ism', 'Telefon', 'Jihoz va muammo']} />}
      {urgent && <FormModal title="Shoshilinch chaqiruv" done="Navbatchi usta 15 daqiqa ichida qo‘ng‘iroq qiladi." onClose={() => setUrgent(false)} fields={['Telefon', 'Manzil', 'Nima buzilgan']} />}
      {join && <FormModal title="Usta sifatida ro‘yxatdan o‘tish" done="Arizangiz qabul qilindi. Profil tekshiruvdan so‘ng ochiladi." onClose={() => setJoin(false)} fields={['Ism', 'Telefon', 'Mutaxassislik']} />}
      {map && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={() => setMap(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[420px] rounded-2xl bg-white p-4 shadow-xl">
            <div className="mb-2 flex items-center justify-between"><h3 className="text-[16px] font-bold">Ustalar xaritada</h3><button onClick={() => setMap(false)} aria-label="Yopish"><X className="size-4 text-muted" /></button></div>
            {masters.slice(0, 6).map((m) => (
              <Link key={m.id} to={`/ustalar/${m.id}`} className="flex items-center justify-between border-b border-line py-2 text-[12px] hover:text-sea">
                <span>{m.name}</span><span className="text-muted">{m.district}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Card({ m, saved, onSave, onCall, onOrder }) {
  const badge = m.status === 'online' ? 'bg-[#12a06a]' : m.status === 'soon' ? 'bg-[#e59a12]' : 'bg-[#8b97a6]'
  return (
    <article className="flex min-w-0 gap-3 rounded-xl bg-white p-2.5 shadow-card">
      <Link to={`/ustalar/${m.id}`} className="relative shrink-0 overflow-hidden rounded-lg" style={{ width: 118, height: 104 }}>
        <img src={m.photo} alt="" className="size-full object-cover" />
        <span className={`absolute left-1.5 top-1.5 rounded-md px-1.5 py-0.5 text-[9px] font-bold text-white ${badge}`}>{statusLabel[m.status]}</span>
      </Link>
      <div className="min-w-0 flex-1">
        <Link to={`/ustalar/${m.id}`} className="text-[14px] font-extrabold text-ink hover:text-sea">{m.name}</Link>
        <p className="text-[11px] text-muted">{m.role}</p>
        <div className="mt-1 flex flex-wrap gap-1">{m.tags.slice(0, 4).map((t) => <span key={t} className="rounded-md bg-[#f3f6fa] px-1.5 py-0.5 text-[10px] text-ink-2">{t}</span>)}</div>
        <p className="mt-1 flex items-center gap-1 text-[11px] text-muted"><MapPin className="size-3" /> {m.city}, {m.district}</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-ink-2">
          <span className="inline-flex items-center gap-1"><Briefcase className="size-3 text-sea" /> {m.years} yil tajriba</span>
          <span>{m.jobs}+ bajarilgan ish</span>
          <span className="inline-flex items-center gap-1"><Star className="size-3 fill-star text-star" /> {m.rating} <span className="text-muted">({m.reviews} sharh)</span></span>
        </p>
      </div>
      <div className="relative hidden w-[280px] shrink-0 rounded-xl border border-line p-2 sm:block">
        <button aria-label="Saqlash" onClick={onSave} className="absolute right-2 top-2"><Heart className={`size-3.5 ${saved ? 'fill-sale text-sale' : 'text-muted'}`} /></button>
        <p className="mb-1 text-[11px] font-bold">Xizmat narxlari</p>
        {m.services.map((s) => (
          <div key={s.name} className="grid items-baseline gap-1 border-t border-line py-1 text-[10px]" style={{ gridTemplateColumns: 'minmax(0,1.2fr) auto' }}>
            <span className="text-ink-2">{s.name}</span>
            <span className="text-right font-semibold">{s.price}</span>
            <span className="col-span-2 text-[9px] text-muted">{s.meta}</span>
          </div>
        ))}
        <div className="mt-1.5 flex gap-1">
          <button onClick={onCall} className="flex h-7 flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-sea px-1 text-[9px] font-semibold text-sea"><Phone className="size-3" /> Qo‘ng‘iroq</button>
          <button onClick={onCall} className="flex h-7 flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-sea px-1 text-[9px] font-semibold text-sea"><Send className="size-3" /> Telegram</button>
          <button onClick={onOrder} className="h-7 flex-1 whitespace-nowrap rounded-lg bg-sea px-1 text-[9px] font-semibold text-white">Buyurtma berish</button>
        </div>
      </div>
    </article>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-8 appearance-none rounded-lg bg-white pl-2 pr-6 text-[11px] text-ink shadow-card outline-none">
        {options.map(([v, l]) => <option key={l + v} value={v}>{label && v === options[0][0] ? l : l}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-1.5 top-2 size-3.5 text-muted" />
    </label>
  )
}
function Field({ label, placeholder }) {
  return (
    <label className="text-[10px] text-muted">{label}
      <input required placeholder={placeholder} className="mt-1 h-8 w-full rounded-lg bg-page px-2 text-[11px] text-ink outline-none" />
    </label>
  )
}
function Note({ title, done, onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[380px] rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-2 flex items-center justify-between"><h3 className="text-[16px] font-bold">{title}</h3><button onClick={onClose} aria-label="Yopish"><X className="size-4 text-muted" /></button></div>
        <p className="py-3 text-[13px] text-ink-2">{done}</p>
      </div>
    </div>
  )
}
function FormModal({ title, done, onClose, fields }) {
  const [sent, setSent] = useState(false)
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); setSent(true) }} className="w-full max-w-[400px] rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between"><h3 className="text-[16px] font-bold">{title}</h3><button type="button" onClick={onClose} aria-label="Yopish"><X className="size-4 text-muted" /></button></div>
        {sent ? <p className="py-4 text-[13px] text-ink-2">{done}</p> : (
          <div className="flex flex-col gap-2">
            {fields.map((f) => <input key={f} required placeholder={f} className="h-10 rounded-lg bg-page px-3 text-[13px] outline-none" />)}
            <button className="h-10 rounded-lg bg-sea text-[13px] font-semibold text-white">Yuborish</button>
          </div>
        )}
      </form>
    </div>
  )
}
