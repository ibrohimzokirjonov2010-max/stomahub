import { Link } from 'react-router-dom'
import { Armchair, ChevronRight, Crown, Gem, Scissors, Wrench } from 'lucide-react'
import ShopLayout from '../components/market/ShopLayout'
import { useMarket } from '../buyerApi'
import { products as devices } from '../jihozData'

const img = (name) => `/images/kategoriyalar/${name}.jpg`
const n = (v) => v.toLocaleString('ru-RU').replace(/\u00a0/g, ' ')

const cats = [
  { id: 'terapiya', name: 'Terapiya', about: 'Kompozitlar, sementlar, adgezivlar va boshqa materiallar', count: 0, to: '/marketplace?cat=komp', image: img('kat-terapiya'), icon: Tooth },
  { id: 'ortopediya', name: 'Ortopediya', about: 'Kronalar, ko‘priklar, protezlar va ortopedik materiallar', count: 0, to: '/marketplace', image: img('kat-ortopediya'), icon: Crown },
  { id: 'jarrohlik', name: 'Jarrohlik', about: 'Jarrohlik asboblari, materiallar va sarf buyumlari', count: 0, to: '/marketplace?cat=asb', image: img('kat-jarrohlik'), icon: Scissors },
  { id: 'implant', name: 'Implantologiya', about: 'Implantlar, abutmentlar, jarrohlik to‘plamlar', count: 0, to: '/marketplace?cat=impl', image: img('kat-implant'), icon: Screw },
  { id: 'endo', name: 'Endodontiya', about: 'Kanal asboblari, motorlar, materiallar va irrigatsiya', count: 0, to: '/marketplace?cat=endo', image: img('kat-endo'), icon: Tooth },
  { id: 'orto', name: 'Ortodontiya', about: 'Breketlar, alaynerlar, dog‘lar va ortodontik materiallar', count: 0, to: '/marketplace', image: img('kat-orto'), icon: Braces },
  { id: 'gigiyena', name: 'Gigiyena', about: 'Cho‘tkalar, pastalar, iplar va profilaktik vositalar', count: 0, to: '/marketplace?cat=gig', image: img('kat-gigiyena'), icon: Tooth },
  { id: 'asbob', name: 'Asboblar', about: 'Diagnostik, terapevtik va jarrohlik asboblar', count: 0, to: '/marketplace?cat=asb', image: img('kat-asbob'), icon: Wrench },
  { id: 'uskuna', name: 'Uskunalar', about: 'Stomatologik unitlar, rentgen, sterilizatsiya va boshqa uskunalar', count: 0, to: '/jihozlar', image: img('kat-uskuna'), icon: Armchair },
]

export default function Kategoriyalar() {
  const market = useMarket()
  const total = (market.products?.length || 0) + (devices?.length || 0)
  const live = cats.map((c) => {
    if (c.id === 'uskuna') return { ...c, count: devices.length }
    const key = ({ terapiya: 'komp', implant: 'impl', jarrohlik: 'asb', endo: 'endo', gigiyena: 'gig', asbob: 'asb' })[c.id]
    const count = key ? (market.products || []).filter((p) => p.cat === key).length : 0
    return { ...c, count }
  })
  return (
    <ShopLayout active="cats" search="plain" placeholder="Mahsulot, brend yoki kategoriya qidiring...">
      <div className="pb-8 pt-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-extrabold text-ink">Kategoriyalar</h1>
            <p className="mt-0.5 text-[12px] text-muted">Stomatologiya mahsulotlarini kategoriya bo‘yicha tanlang</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-[#e6eef3] bg-white px-3 py-2 shadow-card">
            <Gem className="size-5 text-sea" />
            <span>
              <span className="block text-[12px] font-bold text-ink">9 ta kategoriya</span>
              <span className="block text-[11px] text-sea">{n(total)} mahsulot</span>
            </span>
          </div>
        </div>

        <div className="kat-grid mt-3">
          {live.map((c) => {
            const Icon = c.icon
            return (
              <Link key={c.id} to={c.to} className="min-w-0 overflow-hidden rounded-2xl bg-white shadow-card transition hover:-translate-y-0.5">
                <div className="h-[148px] overflow-hidden bg-white">
                  <img src={c.image} alt="" className="size-full object-contain" />
                </div>
                <div className="flex items-center gap-2.5 border-t border-[#f2f5f8] p-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e7f6f4] text-sea"><Icon className="size-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-bold text-ink">{c.name}</span>
                    <span className="mt-0.5 line-clamp-2 block text-[11px] leading-snug text-muted">{c.about}</span>
                    <span className="mt-1 block text-[12px] font-semibold text-sea">{n(c.count)} ta mahsulot</span>
                  </span>
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#f4f7fb] text-muted"><ChevronRight className="size-4" /></span>
                </div>
              </Link>
            )
          })}
        </div>
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

function Screw(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...props}>
      <path d="M12 3v18M9 6h6M9 9h6M9 12h6M10 16l2 5 2-5" />
    </svg>
  )
}

function Braces(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...props}>
      <rect x="4" y="8" width="5" height="8" rx="1" />
      <rect x="15" y="8" width="5" height="8" rx="1" />
      <path d="M9 12h6" />
    </svg>
  )
}
