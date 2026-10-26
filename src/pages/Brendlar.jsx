import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronRight, Search } from 'lucide-react'
import ShopLayout from '../components/market/ShopLayout'

const n = (v) => v.toLocaleString('ru-RU').replace(/\u00a0/g, ' ')
const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

const countries = {
  us: ['🇺🇸', 'AQSH'],
  de: ['🇩🇪', 'Germaniya'],
  li: ['🇱🇮', 'Lixtenshteyn'],
  ch: ['🇨🇭', 'Shveytsariya'],
  jp: ['🇯🇵', 'Yaponiya'],
  it: ['🇮🇹', 'Italiya'],
  at: ['🇦🇹', 'Avstriya'],
  kr: ['🇰🇷', 'Janubiy Koreya'],
  fi: ['🇫🇮', 'Finlandiya'],
  cn: ['🇨🇳', 'Xitoy'],
  br: ['🇧🇷', 'Braziliya'],
}

const brands = [
  { name: '3M', mark: '3M', color: '#e10600', country: 'us', count: 450, to: '/marketplace?brand=3M' },
  { name: 'Dentsply Sirona', mark: 'Dentsply\nSirona', color: '#1c1c1c', country: 'de', count: 1240, to: '/marketplace?brand=Dentsply' },
  { name: 'Ivoclar', mark: 'ivoclar', color: '#00a3a1', country: 'li', count: 980, to: '/jihozlar?brand=Ivoclar' },
  { name: 'Straumann', mark: 'straumann', color: '#111111', country: 'ch', count: 860, to: '/marketplace?brand=Straumann' },
  { name: 'Nobel Biocare', mark: 'Nobel\nBiocare', color: '#d0121a', country: 'ch', count: 720, to: '/marketplace' },
  { name: 'Zimmer Biomet', mark: 'ZIMMER\nBIOMET', color: '#1d4e89', country: 'us', count: 680, to: '/marketplace' },
  { name: 'Coltene', mark: 'COLTENE', color: '#1a2744', country: 'ch', count: 520, to: '/marketplace' },
  { name: 'Kerr', mark: 'Kerr', color: '#111111', country: 'us', count: 610, to: '/marketplace?brand=Kerr' },
  { name: 'GC', mark: 'GC', color: '#e10600', country: 'jp', count: 590, to: '/marketplace?brand=GC' },
  { name: 'Tokuyama', mark: 'Tokuyama', color: '#1a4f8b', country: 'jp', count: 430, to: '/marketplace' },
  { name: 'Fanta Dental', mark: 'fanta', color: '#0b8a95', country: 'it', count: 380, to: '/marketplace' },
  { name: 'Ultradent', mark: 'ULTRADENT', color: '#f26b1f', country: 'us', count: 550, to: '/marketplace' },
  { name: 'Mectron', mark: 'mectron', color: '#222222', country: 'it', count: 320, to: '/marketplace' },
  { name: 'NSK', mark: 'NSK', color: '#163a7a', country: 'jp', count: 790, to: '/marketplace?brand=NSK' },
  { name: 'W&H', mark: 'W&H', color: '#4b5563', country: 'at', count: 410, to: { pathname: '/marketplace', search: '?brand=W&H' } },
  { name: 'Vatech', mark: 'vatech', color: '#e10600', country: 'kr', count: 360, to: '/marketplace' },
  { name: 'Planmeca', mark: 'PLANMECA', color: '#163a7a', country: 'fi', count: 280, to: '/jihozlar?brand=Planmeca' },
  { name: 'Osstem', mark: 'OSSTEM', color: '#f26b1f', country: 'kr', count: 690, to: '/marketplace' },
  { name: 'Mindray', mark: 'mindray', color: '#e10600', country: 'cn', count: 240, to: '/marketplace' },
  { name: 'Angelus', mark: 'angelus', color: '#111111', country: 'br', count: 310, to: '/marketplace' },
]

export default function Brendlar() {
  const [q, setQ] = useState('')
  const [letter, setLetter] = useState('all')
  const [country, setCountry] = useState('all')

  const list = useMemo(() => {
    const text = q.trim().toLowerCase()
    return brands.filter((b) => {
      if (country !== 'all' && b.country !== country) return false
      if (letter !== 'all' && b.name[0].toUpperCase() !== letter) return false
      if (text && !b.name.toLowerCase().includes(text)) return false
      return true
    })
  }, [q, letter, country])

  return (
    <ShopLayout active="brands" search="plain" placeholder="Mahsulot, brend yoki kategoriya qidiring...">
      <div className="pb-8 pt-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-extrabold text-ink">Brendlar</h1>
            <p className="mt-0.5 text-[12px] text-muted">Dunyoning yetakchi stomatologiya brendlari</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-[#e6eef3] bg-white px-3 py-2 shadow-card">
            <Tooth className="size-5 text-sea" />
            <span>
              <span className="block text-[12px] font-bold text-ink">100+ brend</span>
              <span className="block text-[11px] text-muted">Rasmiy yetkazib beruvchilar</span>
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="flex h-9 min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-[#e6eef3] bg-white px-3">
            <Search className="size-3.5 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Brend nomi bo‘yicha qidiring..." className="h-full w-full bg-transparent text-[12px] outline-none" />
          </label>
          <label className="relative">
            <select value={country} onChange={(e) => setCountry(e.target.value)} className="h-9 appearance-none rounded-xl border border-[#e6eef3] bg-white pl-3 pr-8 text-[12px] font-medium">
              <option value="all">Barcha davlatlar</option>
              {Object.entries(countries).map(([k, [, label]]) => <option key={k} value={k}>{label}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-2.5 size-4 text-muted" />
          </label>
        </div>

        <div className="mt-3 flex gap-1 overflow-x-auto no-scrollbar">
          <button onClick={() => setLetter('all')} className={`h-7 shrink-0 rounded-lg px-2.5 text-[11px] font-semibold ${letter === 'all' ? 'bg-sea text-white' : 'bg-white text-ink-2 shadow-card'}`}>Barchasi</button>
          {letters.map((ch) => (
            <button key={ch} onClick={() => setLetter(ch)} className={`grid size-7 shrink-0 place-items-center rounded-lg text-[11px] font-semibold ${letter === ch ? 'bg-sea text-white' : 'bg-white text-ink-2 shadow-card'}`}>{ch}</button>
          ))}
        </div>

        {list.length === 0 ? (
          <div className="mt-3 rounded-xl bg-white p-8 text-center text-[13px] text-muted shadow-card">Bu filtrda brend topilmadi.</div>
        ) : (
          <div className="brand-grid mt-3">
            {list.map((b) => {
              const [flag, place] = countries[b.country]
              return (
                <Link key={b.name} to={b.to} className="flex min-w-0 flex-col rounded-xl bg-white p-3 shadow-card transition hover:-translate-y-0.5">
                  <span className="grid h-11 place-items-center whitespace-pre-line text-center text-[15px] font-black leading-none" style={{ color: b.color }}>{b.mark}</span>
                  <span className="mt-2 flex items-center justify-between gap-1">
                    <span className="truncate text-[12px] font-bold text-ink">{b.name}</span>
                    <ChevronRight className="size-3.5 shrink-0 text-muted" />
                  </span>
                  <span className="mt-0.5 text-[10px] text-muted">{flag} {place}</span>
                  <span className="text-[11px] font-semibold text-sea">{n(b.count)} ta mahsulot</span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </ShopLayout>
  )
}

function Tooth(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...props}>
      <path d="M8 3.5c1.3 0 2.1.9 4 .9s2.7-.9 4-.9c2.1 0 3.2 2 3.2 4.4 0 2.1-.5 3.4-1.1 5.4-.7 2.3-1.5 6.7-2.8 6.7-.9 0-1.3-2.2-3.3-2.2s-2.4 2.2-3.3 2.2c-1.3 0-2.1-4.4-2.8-6.7C5.3 11.3 4.8 10 4.8 7.9 4.8 5.5 5.9 3.5 8 3.5z" />
    </svg>
  )
}
