import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { CalendarDays, Check, GraduationCap, Heart, MapPin, Megaphone, ShoppingBag, ShoppingCart } from 'lucide-react'
import { useCart } from '../../cart'
import { marketProducts, som } from '../../marketData'
import { seminars, seminarCard } from '../../seminarsData'
import { ADS, adPrice } from '../../elonlarData'
import { COURSES, courseDone, profileStore, useProfile } from '../../profileStore'
import { MobileToast } from './parts'
import MobileTabBar from './MobileTabBar'
import { useSeminarStore, toggleSaved } from './seminarStore'
import { adsStore, useAds } from './MobileElonlar'
import { SubTopBar } from './MobileManzillar'

const teal = 'text-[#0b6d73]'
const navy = 'text-[#0d2a4a]'
const TABS = [['products', 'Mahsulotlar', ShoppingBag], ['seminars', 'Seminarlar', CalendarDays], ['courses', 'Kurslar', GraduationCap], ['ads', 'E’lonlar', Megaphone]]
const SEMINARS = seminars.map(seminarCard)

export default function MobileSevimlilar() {
  const navigate = useNavigate()
  const location = useLocation()
  const profile = useProfile()
  const seminarStore = useSeminarStore()
  const { added, saved: savedAds } = useAds()
  const { items, add } = useCart()
  const [tab, setTab] = useState(location.state?.tab || 'products')
  const [toast, setToast] = useState(null)
  const closeToast = useCallback(() => setToast(null), [])
  useEffect(() => { window.scrollTo(0, 0) }, [tab])

  const lists = {
    products: profile.favProducts.map((id) => marketProducts.find((p) => p.id === id)).filter(Boolean),
    seminars: SEMINARS.filter((s) => seminarStore.saved.includes(s.id)),
    courses: COURSES.filter((c) => profile.favCourses.includes(c.id)),
    ads: [...added, ...ADS].filter((a) => savedAds.has(a.id)),
  }
  const toggles = {
    products: (id) => profileStore.toggleFav('favProducts', id),
    seminars: (id) => toggleSaved(id),
    courses: (id) => profileStore.toggleFav('favCourses', id),
    ads: (id) => adsStore.toggleSave(id),
  }
  const unfav = (kind, id) => {
    toggles[kind](id)
    setToast({ text: 'Sevimlilardan olib tashlandi', undo: () => { toggles[kind](id); setToast(null) } })
  }
  const inCart = (id) => items.some((it) => it.id === id)

  const cards = {
    products: (p) => (
      <Card key={p.id} image={p.image} contain onOpen={() => navigate(`/product/${p.id}`)} onHeart={() => unfav('products', p.id)} title={p.name} sub={p.type} price={som(p.price)}>
        {inCart(p.id) ? (
          <ActionBtn onClick={() => navigate('/buyurtma', { state: { from: 'profil' } })} done><Check className="size-4" /> Savatda</ActionBtn>
        ) : (
          <ActionBtn onClick={() => { add(p); setToast({ text: `${p.name} savatga qo‘shildi` }) }}><ShoppingCart className="size-4" /> Savatga</ActionBtn>
        )}
      </Card>
    ),
    seminars: (s) => (
      <Card key={s.id} image={s.image} badge={s.dateShort} onOpen={() => navigate(`/seminarlar/${s.id}`)} onHeart={() => unfav('seminars', s.id)} title={s.title} sub={s.online ? 'Onlayn' : s.city} price={som(s.price)}>
        <ActionBtn onClick={() => navigate(seminarStore.registered[s.id] ? `/seminarlar/${s.id}` : `/seminarlar/${s.id}/royxat`)} done={!!seminarStore.registered[s.id]}>
          {seminarStore.registered[s.id] ? <><Check className="size-4" /> Ro‘yxatdasiz</> : 'Ro‘yxatdan o‘tish'}
        </ActionBtn>
      </Card>
    ),
    courses: (c) => {
      const pct = Math.round((courseDone(profile, c) / c.lessons) * 100)
      return (
        <Card key={c.id} image={c.image} badge={`${c.lessons} dars`} onOpen={() => navigate('/profil/kurslar')} onHeart={() => unfav('courses', c.id)} title={c.title} sub={c.author} price={pct ? `${pct}% o‘tildi` : som(c.price)}>
          <ActionBtn onClick={() => navigate('/profil/kurslar')}>{pct === 100 ? 'Sertifikat' : pct ? 'Davom etish' : 'Boshlash'}</ActionBtn>
        </Card>
      )
    },
    ads: (a) => (
      <Card key={a.id} image={a.images?.[0]} onOpen={() => navigate(`/elonlar/${a.id}`)} onHeart={() => unfav('ads', a.id)} title={a.title} sub={<span className="flex items-center gap-1"><MapPin className="size-3" /> {a.city}</span>} price={adPrice(a)}>
        <ActionBtn onClick={() => navigate(`/elonlar/${a.id}`)}>Batafsil</ActionBtn>
      </Card>
    ),
  }
  const empty = {
    products: ['Sevimli mahsulot yo‘q', 'Marketplace’da yurakcha bosib saqlang', '/marketplace', 'Marketplace’ga o‘tish'],
    seminars: ['Saqlangan seminar yo‘q', 'Seminar sahifasida saqlash tugmasini bosing', '/seminarlar', 'Seminarlarni ko‘rish'],
    courses: ['Sevimli kurs yo‘q', 'Qiziqarli kurslarni saqlab qo‘ying', '/seminarlar', 'Kurslarni ko‘rish'],
    ads: ['Saqlangan e’lon yo‘q', 'E’lonlar bo‘limida yurakchani bosing', '/elonlar', 'E’lonlarni ko‘rish'],
  }[tab]

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef8f7_0%,#f6faf9_28%,#f6faf9_100%)] pb-[86px]">
      <div className="px-4 pt-3">
        <SubTopBar title="Sevimlilar" subtitle="Saqlagan mahsulotlar, seminarlar, kurslar va e’lonlar" />
      </div>
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Sevimlilar bo‘limlari">
        {TABS.map(([id, label, Icon]) => {
          const on = tab === id
          return (
            <button key={id} type="button" role="tab" aria-selected={on} onClick={() => setTab(id)} className={`flex h-11 shrink-0 items-center gap-2 rounded-xl border px-4 text-[13.5px] font-medium transition ${on ? 'border-[#0b6d73] bg-[#0b6d73] text-white shadow-[0_4px_12px_rgb(11_109_115/0.25)]' : 'border-[#e2ebee] bg-white text-[#0b6d73]'}`}>
              <Icon className="size-[18px]" strokeWidth={1.8} /> {label}
            </button>
          )
        })}
      </div>

      <div className="px-4">
        {lists[tab].length === 0 ? (
          <div className="mt-12 text-center">
            <span className={`mx-auto grid size-16 place-items-center rounded-full bg-[#e3f4f1] ${teal}`}><Heart className="size-8" strokeWidth={1.6} /></span>
            <p className={`mt-3 text-[15px] font-bold ${navy}`}>{empty[0]}</p>
            <p className="mt-1 text-[12.5px] text-muted">{empty[1]}</p>
            <Link to={empty[2]} className="mt-4 inline-flex h-11 items-center rounded-xl bg-[#0b6d73] px-5 text-[14px] font-semibold text-white">{empty[3]}</Link>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3">{lists[tab].map(cards[tab])}</div>
        )}
      </div>

      <MobileToast
        text={toast?.text}
        onClose={closeToast}
        action={toast?.undo && <button type="button" onClick={toast.undo} className="shrink-0 text-[13px] font-semibold text-[#5fe0c8]">Qaytarish</button>}
      />
      <MobileTabBar />
    </div>
  )
}

function Card({ image, contain, badge, title, sub, price, onOpen, onHeart, children }) {
  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-[#e8eff1] bg-white p-2 shadow-[0_1px_6px_rgb(11_31_58/0.04)]">
      <div className="relative">
        <button type="button" onClick={onOpen} className={`block aspect-[4/3] w-full overflow-hidden rounded-xl ${contain ? 'bg-[#f3f6f7]' : 'bg-[#e9eff1]'}`}>
          <img src={image} alt={title} loading="lazy" className={`size-full ${contain ? 'object-contain p-1.5' : 'object-cover'}`} />
        </button>
        {badge && <span className={`absolute bottom-1.5 left-1.5 rounded-md bg-white/95 px-1.5 py-0.5 text-[10.5px] font-semibold ${teal}`}>{badge}</span>}
        <button type="button" onClick={onHeart} aria-label={`${title} — sevimlilardan olib tashlash`} className="absolute right-1.5 top-1.5 grid size-9 place-items-center rounded-full bg-[#e3f4f1]/95 text-[#0b6d73] shadow-sm active:scale-90">
          <Heart className="size-[18px] fill-current" />
        </button>
      </div>
      <button type="button" onClick={onOpen} className="mt-2 block min-w-0 px-0.5 text-left">
        <span className={`line-clamp-2 text-[13.5px] font-bold leading-[18px] ${navy}`}>{title}</span>
        <span className="mt-0.5 block truncate text-[11.5px] text-[#7a8a9c]">{sub}</span>
        <span className="mt-1 block truncate text-[15px] font-extrabold text-[#0b6d73]">{price}</span>
      </button>
      <div className="mt-auto pt-2">{children}</div>
    </article>
  )
}

function ActionBtn({ onClick, done, children }) {
  return (
    <button type="button" onClick={onClick} className={`flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border text-[12.5px] font-semibold active:scale-[0.98] ${done ? 'border-[#cde9e4] bg-[#eaf7f4] text-[#0b6d73]' : 'border-[#0b8a7a]/60 bg-white text-[#0b6d73]'}`}>
      {children}
    </button>
  )
}
