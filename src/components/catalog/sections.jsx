import { useMemo, useState } from 'react'
import { useCatalogVersion, isOwned } from '../../recordSync'
import { som } from '../../marketData'
import { cats as formaCats, colorOf, genders, sizesOf, allForma } from '../../formaData'
import { cats as bookCats, langOptions, formatOptions } from '../../booksData'
import { directions, levels, formats } from '../../educationData'
import { cats as ustaCats } from '../../ustalarData'
import { catList as jihozCats, statusList } from '../../jihozData'
import { specs as jobSpecs, cities as jobCities, types as jobTypes, exps as jobExps, pay } from '../../ishlarData'
import { surplusChips, conditions } from '../../surplusData'
import { SPECS } from '../../mutaxassislarData'
import { AD_CATS, DEALS, dealName, adPriceShort } from '../../elonlarData'
import { seminarChips, seminarCard } from '../../seminarsData'
import { publicRecords, useHub } from '../../hubStore'
import { useMarket } from '../../buyerApi'
import { isFormaMarketProduct } from '../../lib/formaLive'
import { books } from '../../booksData'
import { courses } from '../../educationData'
import { masters } from '../../ustalarData'
import { allJihoz } from '../../jihozData'
import { isJihozMarketProduct, jihozCartLine } from '../../lib/jihozLive'
import { jobs } from '../../ishlarData'
import { surplusItems } from '../../surplusData'
import { DOCTORS } from '../../mutaxassislarData'
import { ADS } from '../../elonlarData'
import { allAds, myAds, publicAds, useAds, PostAdSheet, MyAdsSheet } from '../mobile/MobileElonlar'
import { PostSheet } from '../mobile/MobileSurplus'
import { iconFor } from '../../icons/categoryIcons'
import { usePersonal } from '../../personal/usePersonal'
import { orderForMarketplace } from '../../personal/rank.js'
import { seminarMatches } from '../../personal/specialtyMap.js'
import { SizUchun, SpecialtyPicker } from '../../personal/PersonalBlocks'
import { useMobile } from '../../useMobile'
import { BookOpen as PBook, Recycle as PRecycle, Megaphone as PMegaphone, PlayCircle as PPlay, ShoppingBag as PBag, CalendarDays as PCal, MonitorCog as PMonitor, Shirt as PShirt, Wrench as PWrench, BriefcaseBusiness as PJob, Stethoscope as PDoc } from 'lucide-react'
import { sectionPoster, categoryPoster } from '../../posters/sectionPosters'

/* ---- helpers ---- */
// Kategoriya ikonkalari yagona to‘plamdan (src/icons): bo‘lim + kalit/nom bo‘yicha.
const chipsFrom = (pairs, sec) => pairs.filter(([k]) => k !== 'all').map(([key, label]) => ({ key, label, icon: iconFor(sec, key, label) }))
const uniq = (arr) => [...new Set(arr.filter(Boolean))]
const opts = (arr) => uniq(arr).sort((a, b) => String(a).localeCompare(String(b))).map((v) => [String(v), String(v)])
const PRICE_SORTS = (get = (x) => x.price) => [
  ['default', 'Tavsiya etilgan', null],
  ['cheap', 'Arzonroq', (a, b) => (get(a) ?? Infinity) - (get(b) ?? Infinity)],
  ['rich', 'Qimmatroq', (a, b) => (get(b) ?? -1) - (get(a) ?? -1)],
]
// Discounts are only trusted on rows that belong to a real seller (owner_id) — demo seeds carry invented oldPrice/off.
const realDiscount = (kind, it) => (isOwned(kind, it.id) && Number(it.oldPrice) > Number(it.price) ? Math.round((1 - it.price / it.oldPrice) * 100) : 0)
// No item has real reviews yet (reviews/seller_reviews tables are empty), so seed rating/reviews are never shown.
const realRating = () => null
const priceBand = (bands) => ({ key: 'price', label: 'Narx', options: bands.map(([k, l]) => [k, l]), match: (it, v) => { const [lo, hi] = bands.find(([k]) => k === v)[2]; const p = Number(it.price); return p >= lo && p < hi } })

/**
 * Bo‘lim posterlari: matn src/posters/sectionPosters.js dan, rasm va son — faqat bo‘limning real yozuvlaridan.
 * 1-slayd bo‘limni tushuntiradi (+ real son), keyingilari (ko‘pi bilan 3) — real sotuvchi yozuvlari, 1-slayd rasmi takrorlanmaydi.
 * ctx: { scroll, post, catLabel } — catLabel bo‘lsa (Marketplace turkumi), poster shu turkumniki.
 */
const posterAction = (a, ctx) => (a === 'scroll' ? { onClick: ctx.scroll } : a === 'post' ? { onClick: ctx.post } : { href: a })
const slidesFor = ({ key, icon, items, count = items.length, image, href, ctx = {} }) => {
  const withImg = items.filter((x) => image(x))
  const poster = ctx.catLabel ? { ...categoryPoster(ctx.catLabel), badge: items.length ? `${items.length} ta mahsulot` : '' } : sectionPoster(key, count)
  const lead = withImg[0]
  const intro = { id: `intro-${ctx.catLabel || 'all'}`, title: poster.title, text: poster.text, badge: poster.badge, cta: poster.cta, icon, images: lead ? [image(lead)] : [], ...posterAction(poster.action, ctx) }
  const feat = withImg.filter((x) => x.__owned && x !== lead).slice(0, 3).map((x) => ({ id: `f-${x.id}`, item: true, title: x.__title, text: x.__sub, images: [image(x)], cta: 'Ko‘rish', href: href(x) }))
  return [intro, ...feat]
}
const tag = (kind, list, titleOf, subOf) => list.map((x) => Object.assign({}, x, { __owned: isOwned(kind, x.id), __title: titleOf(x), __sub: subOf ? subOf(x) : '' }))

/* ---- sections ---- */

export function useFormaSection() {
  const v = useCatalogVersion()
  // Sotuvchi kabinetidan qo‘shilgan haqiqiy forma (market_products, category = 'Tibbiy forma')
  const market = useMarket()
  return useMemo(() => {
    const items = allForma().map((x) => Object.assign({}, x, { __owned: x.live || isOwned('uniform', x.id), __title: x.title, __sub: x.brand }))
    return {
      key: 'forma', shopActive: 'forma', title: 'Tibbiy forma', subtitle: 'Qulay, sifatli va zamonaviy tibbiy kiyimlar', placeholder: 'Forma, xalat yoki brend qidiring...',
      items, cats: chipsFrom(formaCats, 'forma'), catOf: (p) => p.cat,
      filters: [
        { key: 'size', label: 'O‘lcham', options: opts(items.flatMap((p) => sizesOf(p) || [])), match: (p, s) => sizesOf(p).includes(s) },
        { key: 'color', label: 'Rang', options: uniq(items.flatMap((p) => p.colors || [])).map((c) => [c, colorOf(c).name]), match: (p, c) => (p.colors || []).includes(c) },
        { key: 'gender', label: 'Jins', options: genders, match: (p, g) => p.gender === g || (g !== 'uni' && p.gender === 'uni') },
        { key: 'brand', label: 'Brend', options: opts(items.map((p) => p.brand)), match: (p, b) => p.brand === b },
      ],
      sorts: PRICE_SORTS(),
      text: (p) => `${p.title} ${p.brand} ${p.about || ''}`,
      card: (p) => {
        const off = p.live ? (p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0) : realDiscount('uniform', p)
        return {
          id: p.id, href: `/forma/${p.id}`, image: p.image, kicker: p.brand, title: p.title, price: p.price, oldPrice: off ? p.oldPrice : 0,
          badge: off ? { text: `-${off}%`, tone: 'sale' } : p.__owned && p.fresh ? { text: 'Yangi', tone: 'new' } : null,
          rating: realRating(p),
          extra: (
            <div className="mt-1 flex items-center gap-1.5">
              <span className="flex gap-1">{(p.colors || []).slice(0, 4).map((c) => <span key={c} className="size-2.5 rounded-full ring-1 ring-line" style={{ background: colorOf(c).hex }} />)}</span>
              <span className="truncate text-[10px] text-muted">{sizesOf(p).join(' ')}</span>
            </div>
          ),
          // Forma: o‘lcham va rang sahifada tanlanadi — kartochkada savat emas, sahifaga o‘tish
          cart: null,
        }
      },
      slides: (list, ctx) => slidesFor({ key: 'forma', icon: PShirt, items: list, image: (p) => p.image, href: (p) => `/forma/${p.id}`, ctx }),
    }
  }, [v, market.status, market.products.length])
}

export function useMarketSection() {
  const { products, status } = useMarket()
  const me = usePersonal()
  const desktop = !useMobile()
  return useMemo(() => {
    // Kirgan foydalanuvchi: qiziqish (ko‘rgan/qidirgan/savat/xarid) va yo‘nalish bo‘yicha standart tartib.
    // 0065: Forma va Jihozlar sotuvchilarining mahsulotlari o‘z bo‘limida — Marketplace’da faqat stomatologik mahsulotlar
    const own = products.filter((p) => !isFormaMarketProduct(p) && !isJihozMarketProduct(p))
    const ordered = me.authed ? orderForMarketplace(own, { signals: me.signals, specialty: me.specialty }) : own
    const items = ordered.map((p) => Object.assign({}, p, { __owned: true, __title: p.name, __sub: p.category || p.seller }))
    return {
      key: 'marketplace', shopActive: 'market', imageSearch: true, catPosters: true, ads: true, track: true,
      top: me.authed ? <><SpecialtyPicker desktop={desktop} /><SizUchun desktop={desktop} /></> : null, title: 'Marketplace', subtitle: 'Stomatologiya materiallari va asboblari — tasdiqlangan sotuvchilardan', placeholder: 'Mahsulot, brend yoki sotuvchi qidiring...',
      items, loading: status === 'loading' || status === 'idle', emptyText: 'Hozircha sotuvdagi mahsulotlar yo‘q',
      cats: uniq(items.map((p) => p.category)).map((c) => ({ key: c, label: c, icon: iconFor('marketplace', c, c) })), catOf: (p) => p.category,
      filters: [
        { key: 'brand', label: 'Brend', options: opts(items.map((p) => p.brand)), match: (p, b) => p.brand === b },
        { key: 'seller', label: 'Sotuvchi', options: opts(items.map((p) => p.seller)), match: (p, s) => p.seller === s },
        { key: 'stock', label: 'Mavjudlik', options: [['in', 'Omborda bor']], match: (p) => p.stock > 0 },
      ],
      sorts: PRICE_SORTS(),
      text: (p) => `${p.name} ${p.brand} ${p.category} ${p.seller}`,
      card: (p) => ({
        id: p.id, href: isFormaMarketProduct(p) ? `/forma/${p.id}` : `/product/${p.id}`, image: p.image, fit: 'contain', kicker: [p.brand, p.seller].filter(Boolean).join(' · '), title: p.name, meta: [p.type], price: p.price,
        badge: p.stock <= 0 ? { text: 'Tugagan', tone: 'info' } : null, rating: p.reviews > 0 ? { value: p.rating, count: p.reviews } : null,
        // Variantli mahsulot (forma o‘lcham/rangi va h.k.) — variant sahifada tanlanadi
        cart: p.stock > 0 && !(p.variants || []).length ? { prefix: p.id, line: { id: p.id, productId: p.id, name: p.name, type: p.brand || p.category, price: p.price, image: p.image } } : null,
      }),
      slides: (list, ctx) => slidesFor({ key: 'marketplace', icon: PBag, items: list, image: (p) => p.image, href: (p) => `/product/${p.id}`, ctx }),
    }
  }, [products, status, me.authed, me.signals, me.specialty, desktop])
}

const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']
export function useSeminarsSection() {
  const hub = useHub()
  const me = usePersonal()
  const spec = me.authed ? me.specialty : ''
  return useMemo(() => {
    // Yo‘nalishga mos (yakunlanmagan) seminarlar oldinda + "Sizning yo‘nalishingiz" belgisi; qolganlari o‘zgarishsiz.
    const items = publicRecords(hub).map(seminarCard).map((s) => Object.assign({}, s, { __owned: false, __title: s.title, __sub: s.dateLabel, __mine: !!spec && !s.past && !s.cancelled && seminarMatches(s, spec) }))
    const byDate = (a, b) => (a.past !== b.past ? (a.past ? 1 : -1) : (a.past ? -1 : 1) * String(a.startIso || a.dateKey).localeCompare(String(b.startIso || b.dateKey), undefined, { numeric: true }))
    return {
      key: 'seminarlar', shopActive: 'seminars', title: 'Seminarlar', subtitle: 'Amaliy seminarlar va master-klasslar', placeholder: 'Seminar, spiker yoki shahar qidiring...',
      items, cats: seminarChips.filter((c) => c.key !== 'all').map((c) => ({ ...c, icon: iconFor('seminarlar', c.key, c.label) })), catOf: (s) => s.cat,
      filters: [
        { key: 'city', label: 'Shahar', options: opts(items.filter((s) => !s.online).map((s) => s.city)), match: (s, c) => s.city === c && !s.online },
        { key: 'format', label: 'Format', options: [['online', 'Onlayn'], ['offline', 'Oflayn']], match: (s, f) => (f === 'online' ? s.online : !s.online) },
        { key: 'month', label: 'Oy', options: uniq(items.map((s) => s.monthKey)).sort().map((m) => [m, `${MONTHS[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`]), match: (s, m) => s.monthKey === m },
      ],
      // Yaqinlashayotganlar sana bo‘yicha oldinda, yakunlanganlar oxirida (eng yangisi birinchi)
      sorts: [['default', 'Sana bo‘yicha', (a, b) => (Number(b.__mine) - Number(a.__mine)) || byDate(a, b)], ...PRICE_SORTS().slice(1)],
      text: (s) => `${s.title} ${s.speaker?.name || s.speaker || ''} ${s.city} ${s.placeLabel}`,
      // seminarCard().off is derived from an invented plan oldPrice — not shown.
      card: (s) => ({ id: s.id, href: `/seminarlar/${s.id}`, image: s.image, fit: 'contain', kicker: s.tag, title: s.title, meta: [s.dateLabel, s.placeLabel], price: s.price, badge: s.past ? { text: 'Yakunlangan', tone: 'info' } : s.cancelled ? { text: 'Bekor qilingan', tone: 'info' } : s.__mine ? { text: 'Sizning yo‘nalishingiz', tone: 'new' } : s.online ? { text: 'Onlayn', tone: 'info' } : null }),
      slides: (list, ctx) => slidesFor({ key: 'seminarlar', icon: PCal, items: list, count: list.filter((s) => !s.past && !s.cancelled).length, image: (s) => s.image, href: (s) => `/seminarlar/${s.id}`, ctx }),
    }
  }, [hub, spec])
}

export function useBooksSection() {
  const v = useCatalogVersion()
  return useMemo(() => {
    const items = tag('book', books, (b) => b.title, (b) => b.author)
    return {
      key: 'kitoblar', shopActive: 'books', title: 'Kitoblar', subtitle: 'Stomatologiya bo‘yicha kitoblar va qo‘llanmalar', placeholder: 'Kitob, muallif yoki ISBN qidiring...',
      items, emptyText: 'Hozircha kitoblar yo‘q',
      cats: chipsFrom(bookCats, 'kitoblar'), catOf: (b) => b.cats || [],
      filters: [
        { key: 'lang', label: 'Til', options: langOptions, match: (b, l) => b.lang === l },
        { key: 'format', label: 'Format', options: formatOptions.filter(([k]) => k !== 'both'), match: (b, f) => (b.formats || []).includes(f) },
        { key: 'year', label: 'Yil', options: opts(items.map((b) => b.year)).reverse(), match: (b, y) => String(b.year) === y },
      ],
      sorts: [...PRICE_SORTS(), ['year', 'Eng yangi nashr', (a, b) => (b.year || 0) - (a.year || 0)]],
      text: (b) => `${b.title} ${b.author} ${b.isbn || ''}`,
      card: (b) => ({ id: b.id, href: `/kitoblar/${b.id}`, image: b.cover, fit: 'contain', kicker: b.author, title: b.title, meta: [[b.year, b.pages && `${b.pages} bet`].filter(Boolean).join(' · ')], price: b.price == null || b.price === '' ? null : Number(b.price), priceText: b.price == null || b.price === '' ? 'Narxi kelishiladi' : undefined, badge: (b.formats || []).includes('pdf') ? { text: 'PDF', tone: 'info' } : null }),
      slides: (list, ctx) => slidesFor({ key: 'kitoblar', icon: PBook, items: list, image: (b) => b.cover, href: (b) => `/kitoblar/${b.id}`, ctx }),
    }
  }, [v])
}

export function useEducationSection() {
  const v = useCatalogVersion()
  return useMemo(() => {
    const items = tag('course', courses, (c) => c.title, (c) => c.doctor)
    return {
      key: 'talim', shopActive: 'education', title: 'Ta’lim', subtitle: 'Video darslar, kurslar va vebinarlar', placeholder: 'Kurs, mavzu yoki shifokor qidiring...',
      items, emptyText: 'Hozircha kurslar yo‘q — tez orada qo‘shiladi',
      cats: chipsFrom(directions, 'talim'), catOf: (c) => c.direction,
      filters: [
        { key: 'level', label: 'Daraja', options: levels.filter(([k]) => k !== 'all'), match: (c, l) => c.level === l },
        { key: 'format', label: 'Format', options: formats.filter(([k]) => k !== 'all'), match: (c, f) => c.format === f },
        { key: 'free', label: 'Narx', options: [['free', 'Bepul'], ['paid', 'Pullik']], match: (c, f) => (f === 'free' ? !c.price : c.price > 0) },
      ],
      sorts: PRICE_SORTS(),
      text: (c) => `${c.title} ${c.doctor} ${c.about || ''}`,
      card: (c) => ({ id: c.id, href: '/talim', image: c.cover, kicker: c.doctor, title: c.title, meta: [[c.lessons && `${c.lessons} dars`, c.hours && `${c.hours} soat`].filter(Boolean).join(' · ')], price: Number(c.price) || 0, badge: { text: formats.find(([k]) => k === c.format)?.[1] || 'Kurs', tone: 'info' } }),
      slides: (list, ctx) => slidesFor({ key: 'talim', icon: PPlay, items: list, image: (c) => c.cover, href: () => '/talim', ctx }),
    }
  }, [v])
}

export function useUstalarSection() {
  const v = useCatalogVersion()
  return useMemo(() => {
    const items = tag('master', masters, (m) => m.name, (m) => m.role)
    return {
      key: 'ustalar', shopActive: 'ustalar', title: 'Ustalar va laboratoriyalar', subtitle: 'Stomatologik uskunalar ta’miri va servis', placeholder: 'Usta, xizmat yoki brend qidiring...',
      items, cats: chipsFrom(ustaCats, 'ustalar'), catOf: (m) => m.cats || [],
      filters: [
        { key: 'city', label: 'Shahar', options: opts(items.map((m) => m.city)), match: (m, c) => m.city === c },
        { key: 'brand', label: 'Brend', options: opts(items.flatMap((m) => m.brands || [])), match: (m, b) => (m.brands || []).includes(b) },
      ],
      sorts: [['default', 'Tavsiya etilgan', null], ['years', 'Tajriba', (a, b) => (b.years || 0) - (a.years || 0)]],
      text: (m) => `${m.name} ${m.role} ${(m.tags || []).join(' ')} ${(m.brands || []).join(' ')} ${m.city} ${m.district || ''}`,
      card: (m) => ({ id: m.id, href: `/ustalar/${m.id}`, image: m.photo, kicker: [m.city, m.district].filter(Boolean).join(', '), title: m.name, meta: [m.role, m.years && `${m.years} yil tajriba`], priceText: m.services?.[0]?.price || '' }),
      slides: (list, ctx) => slidesFor({ key: 'ustalar', icon: PWrench, items: list, image: (m) => m.photo, href: (m) => `/ustalar/${m.id}`, ctx }),
    }
  }, [v])
}

export function useJihozSection() {
  const v = useCatalogVersion()
  const { products: live, status: liveStatus } = useMarket()
  return useMemo(() => {
    const items = tag('device', allJihoz(), (p) => p.title, (p) => p.brand)
    return {
      key: 'jihozlar', shopActive: 'jihozlar', title: 'Jihozlar', subtitle: 'Yangi stomatologik uskunalar — tasdiqlangan sotuvchilardan', placeholder: 'Uskuna, brend yoki model qidiring...',
      loading: !items.length && (liveStatus === 'loading' || liveStatus === 'idle'), emptyText: 'Hozircha sotuvdagi jihozlar yo‘q',
      items, cats: chipsFrom(jihozCats, 'jihozlar'), catOf: (p) => p.cat,
      filters: [
        { key: 'brand', label: 'Brend', options: opts(items.map((p) => p.brand)), match: (p, b) => p.brand === b },
        { key: 'city', label: 'Shahar', options: opts(items.map((p) => p.city)), match: (p, c) => p.city === c },
        priceBand([['lt10', '10 mln gacha', [0, 1e7]], ['10-50', '10–50 mln', [1e7, 5e7]], ['50-150', '50–150 mln', [5e7, 1.5e8]], ['gt150', '150 mln+', [1.5e8, Infinity]]]),
      ],
      sorts: PRICE_SORTS(),
      text: (p) => `${p.title} ${p.brand} ${p.model || ''} ${p.feature || ''}`,
      card: (p) => {
        const off = realDiscount('device', p)
        return { id: p.id, href: `/jihozlar/${p.id}`, image: p.image, kicker: [p.brand, p.year].filter(Boolean).join(' · '), title: p.title, meta: [p.live ? p.seller : p.city, p.warranty ? `Kafolat: ${p.warranty} oy` : ''].filter(Boolean), cart: p.live && p.stock > 0 ? { prefix: p.id, line: jihozCartLine(p) } : null, price: p.price, oldPrice: off ? p.oldPrice : 0, badge: off ? { text: `-${off}%`, tone: 'sale' } : { text: statusList.find(([k]) => k === p.status)?.[1] || 'Yangi', tone: p.status === 'new' ? 'new' : 'info' } }
      },
      slides: (list, ctx) => slidesFor({ key: 'jihozlar', icon: PMonitor, items: list, image: (p) => p.image, href: (p) => `/jihozlar/${p.id}`, ctx }),
    }
  }, [v, live, liveStatus])
}

const jobCity = Object.fromEntries(jobCities)
export function useIshlarSection() {
  const v = useCatalogVersion()
  return useMemo(() => {
    const items = tag('job', jobs, (j) => j.title, (j) => j.clinic)
    return {
      key: 'ishlar', shopActive: 'ishlar', title: 'Ish o‘rinlari', subtitle: 'Stomatologiya klinikalaridagi vakansiyalar', placeholder: 'Lavozim, klinika yoki shahar qidiring...',
      items, cats: jobSpecs.map(([key, label]) => ({ key, label, icon: iconFor('ishlar', key, label) })), catOf: (j) => j.spec,
      filters: [
        { key: 'city', label: 'Shahar', options: jobCities, match: (j, c) => j.city === c },
        { key: 'type', label: 'Bandlik', options: jobTypes, match: (j, t) => j.type === t },
        { key: 'exp', label: 'Tajriba', options: jobExps, match: (j, e) => j.exp === e },
      ],
      sorts: [['default', 'Eng yangi', null], ['pay', 'Maosh', (a, b) => (b.max || 0) - (a.max || 0)]],
      text: (j) => `${j.title} ${j.clinic} ${j.cityLabel || ''} ${j.district || ''} ${j.about || ''}`,
      card: (j) => ({ id: j.id, href: `/ishlar/${j.id}`, image: j.image, kicker: j.clinic, title: j.title, meta: [[j.cityLabel || jobCity[j.city], j.district].filter(Boolean).join(', '), j.posted], priceText: j.min && j.max ? pay(j.min, j.max) : 'Kelishiladi', badge: { text: jobTypes.find(([k]) => k === j.type)?.[1] || 'Ish', tone: 'info' } }),
      slides: (list, ctx) => slidesFor({ key: 'ishlar', icon: PJob, items: list, image: (j) => j.image, href: (j) => `/ishlar/${j.id}`, ctx }),
    }
  }, [v])
}

export function useSurplusSection() {
  const v = useCatalogVersion()
  const [rev, setRev] = useState(0)
  return useMemo(() => {
    const items = tag('surplus', surplusItems, (s) => s.name, (s) => s.brand)
    return {
      key: 'ortiqcha', shopActive: 'surplus', title: 'Ortiqcha materiallar', subtitle: 'Hamkasblardan ortib qolgan materiallar', placeholder: 'Material, brend yoki shahar qidiring...',
      items, cats: surplusChips.filter((c) => c.key !== 'all').map((c) => ({ ...c, icon: iconFor('ortiqcha', c.key, c.label) })), catOf: (s) => s.cat,
      filters: [
        { key: 'city', label: 'Shahar', options: opts(items.map((s) => s.city)), match: (s, c) => s.city === c },
        { key: 'cond', label: 'Holati', options: conditions.map((c) => [c, c]), match: (s, c) => s.condition === c },
        { key: 'brand', label: 'Brend', options: opts(items.map((s) => s.brand)), match: (s, b) => s.brand === b },
      ],
      sorts: PRICE_SORTS(),
      action: { label: 'E’lon berish', render: ({ close, done }) => <PostSheet onClose={close} onSubmit={() => { setRev((n) => n + 1); done() }} /> },
      text: (s) => `${s.name} ${s.brand} ${s.type} ${s.city}`,
      card: (s) => {
        const off = realDiscount('surplus', s)
        return { id: s.id, href: `/ortiqcha/${s.id}`, image: s.image, fit: 'contain', kicker: s.brand, title: s.name, meta: [s.type, [s.city, s.expiry && `Muddati: ${s.expiry}`].filter(Boolean).join(' · ')], price: s.price, oldPrice: off ? s.oldPrice : 0, badge: s._pending ? { text: 'Moderatsiyada', tone: 'info' } : off ? { text: `-${off}%`, tone: 'sale' } : { text: s.condition, tone: 'info' } }
      },
      slides: (list, ctx) => slidesFor({ key: 'ortiqcha', icon: PRecycle, items: list, image: (s) => s.image, href: (s) => `/ortiqcha/${s.id}`, ctx }),
    }
  }, [v, rev])
}

export function useDoctorsSection() {
  const v = useCatalogVersion()
  return useMemo(() => {
    const items = tag('doctor', DOCTORS, (d) => d.name, (d) => d.role)
    return {
      key: 'mutaxassislar', shopActive: 'mutaxassislar', title: 'Konsultatsiyalar', subtitle: 'Mutaxassis shifokorlar bilan maslahat', placeholder: 'Shifokor, mutaxassislik yoki klinika qidiring...',
      items, cats: chipsFrom(SPECS, 'mutaxassislar'), catOf: (d) => d.specs || [],
      filters: [
        { key: 'city', label: 'Shahar', options: opts(items.map((d) => d.city)), match: (d, c) => d.city === c },
        { key: 'online', label: 'Format', options: [['online', 'Onlayn konsultatsiya']], match: (d) => !!d.online },
      ],
      sorts: [['default', 'Tavsiya etilgan', null], ['exp', 'Tajriba', (a, b) => (b.exp || 0) - (a.exp || 0)]],
      text: (d) => `${d.name} ${d.role} ${d.clinic} ${(d.tags || []).join(' ')} ${d.city}`,
      card: (d) => ({ id: d.id, href: `/mutaxassislar/${d.id}`, image: d.photo, kicker: d.clinic, title: d.name, meta: [d.role, [d.city, d.exp && `${d.exp} yil tajriba`].filter(Boolean).join(' · ')], priceText: d.services?.[0]?.price ? (typeof d.services[0].price === 'number' ? som(d.services[0].price) : String(d.services[0].price)) : '', badge: d.online ? { text: 'Onlayn', tone: 'new' } : null }),
      slides: (list, ctx) => slidesFor({ key: 'mutaxassislar', icon: PDoc, items: list, image: (d) => d.photo, href: (d) => `/mutaxassislar/${d.id}`, ctx }),
    }
  }, [v])
}

export function useElonlarSection() {
  const v = useCatalogVersion()
  useAds()
  return useMemo(() => {
    const pub = publicAds()
    const items = tag('ad', pub, (a) => a.title, (a) => a.sub)
    return {
      key: 'elonlar', shopActive: 'elonlar', title: 'E’lonlar', subtitle: 'Sotish, ijaraga berish va ish e’lonlari', placeholder: 'E’lon, uskuna yoki shahar qidiring...',
      items, cats: chipsFrom(AD_CATS, 'elonlar'), catOf: (a) => a.cat,
      filters: [
        { key: 'deal', label: 'Turi', options: DEALS, match: (a, d) => a.deal === d },
        { key: 'city', label: 'Shahar', options: opts(items.map((a) => a.city)), match: (a, c) => a.city === c },
        { key: 'cond', label: 'Holati', options: opts(items.map((a) => a.cond)), match: (a, c) => a.cond === c },
      ],
      sorts: PRICE_SORTS(),
      action: {
        label: 'E’lon joylash',
        render: ({ close, done }) => (
          <PostAdSheet
            onClose={close}
            onDone={() => done('E’loningiz moderatsiyaga yuborildi')}
          />
        ),
      },
      secondaryAction: {
        label: 'Mening e’lonlarim',
        render: ({ close }) => <MyAdsSheet onClose={close} />,
      },
      text: (a) => `${a.title} ${a.sub} ${a.city} ${dealName[a.deal] || ''}`,
      card: (a) => ({
        id: a.id,
        href: `/elonlar/${a.id}`,
        image: a.images?.[0],
        kicker: [a.city, a.date].filter(Boolean).join(' · '),
        title: a.title,
        meta: [a.sub],
        priceText: a.price ? adPriceShort(a) : 'Kelishiladi',
        badge: a._pending
          ? { text: 'Moderatsiyada', tone: 'info' }
          : { text: dealName[a.deal] || 'E’lon', tone: a.deal === 'sale' ? 'new' : 'info' },
      }),
      slides: (list, ctx) => slidesFor({ key: 'elonlar', icon: PMegaphone, items: list, image: (a) => a.images?.[0], href: (a) => `/elonlar/${a.id}`, ctx }),
    }
  }, [v])
}
