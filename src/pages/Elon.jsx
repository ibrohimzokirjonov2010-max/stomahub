import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Heart, ChevronRight, ChevronLeft, Tag, Briefcase, Settings, CalendarDays, Ruler, MapPin, Clock,
  GraduationCap, Layers, FileText, CheckCircle2, Store, Phone, Star, Eye, Package, Send, ArrowRight,
} from 'lucide-react'
import { adCatName, adPrice, dealName, som } from '../elonlarData'
import { adsStore, allAds, findAd, sellerOf, useAds } from '../components/mobile/MobileElonlar'
import { useCatalogVersion, isOwned } from '../recordSync'
import { telegramUrl, setAdStatus } from '../elonApi'
import { openTelegramWithListingMessage } from '../lib/telegramShare'
import { isDemoItem } from '../demoContent'
import { DemoNotice, DemoActionBar, DemoChip } from '../components/DemoNotice'
import { friendlyError } from '../lib/friendlyError'
import { ensureLogin } from '../loginPrompt'
import Lightbox from '../components/Lightbox'
import { ToothIcon } from '../components/icons'

const SPEC_ICONS = { brand: Tag, size: Briefcase, cond: Settings, year: CalendarDays, area: Ruler, place: MapPin, time: Clock, exp: GraduationCap, cat: Layers }
const card = 'rounded-2xl bg-white shadow-card'

export default function Elon() {
  const { id } = useParams()
  return <ElonBody key={id} id={id} />
}

function catLabel(a) {
  if (a.deal === 'job' || a.cat === 'ish') return 'Ish o‘rni'
  const name = adCatName[a.cat] || 'E’lon'
  return name === 'Materiallar' ? 'Stomatologik materiallar' : name
}

function ElonBody({ id }) {
  const { saved } = useAds()
  useCatalogVersion()
  const a = findAd(id)
  const [cur, setCur] = useState(0)
  const [zoom, setZoom] = useState(null)
  const [toast, setToast] = useState('')
  const [busy, setBusy] = useState(false)
  const closeToast = useCallback(() => setToast(''), [])
  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(closeToast, 2200)
    return () => clearTimeout(t)
  }, [toast, closeToast])

  if (!a) {
    return (
      <div className="grid min-h-[320px] place-items-center py-16 text-center">
        <div>
          <p className="text-[16px] font-bold text-ink">E’lon topilmadi</p>
          <Link to="/elonlar" className="mt-3 inline-flex text-[13px] font-semibold text-sea">E’lonlarga qaytish</Link>
        </div>
      </div>
    )
  }

  const seller = sellerOf(a)
  const isJob = a.deal === 'job'
  const who = isJob ? 'Ish beruvchi' : 'Sotuvchi'
  const images = a.images?.length ? a.images : ['/images/market/p3.jpg']
  const contain = a.cat === 'material' || a.cat === 'asbob'
  const isSaved = saved.has(a.id)
  const isOwner = isOwned('ad', a.id)
  const demo = isDemoItem(a)
  const tg = telegramUrl(seller.telegram || a.telegram)
  const phone = (seller.phone || '').replace(/\s/g, '')
  const active = (a.status || 'active') === 'active' && !a._pending
  const similar = allAds().filter((x) => x.id !== a.id && x.cat === a.cat && !x._pending && (x.status || 'active') === 'active').slice(0, 4)
  const sellerName = a.sellerInfo?.name || ''
  const others = sellerName
    ? allAds().filter((x) => x.id !== a.id && !x._pending && (x.status || 'active') === 'active' && x.sellerInfo?.name === sellerName).slice(0, 3)
    : []

  const toggleSave = (adId) => setToast(adsStore.toggleSave(adId) ? 'Saqlanganlarga qo‘shildi' : 'Saqlanganlardan olib tashlandi')

  const mark = async (status) => {
    if (!ensureLogin() || busy) return
    setBusy(true)
    try {
      await setAdStatus(a.id, status)
      setToast(status === 'sold' ? 'E’lon «Sotilgan» deb belgilandi' : 'E’lon yopildi')
    } catch (e) {
      setToast(friendlyError(e, 'Amarni bajarib bo‘lmadi'))
    } finally { setBusy(false) }
  }

  const writeTg = () => openTelegramWithListingMessage({ tgUrl: tg, title: a.title, price: a.price, itemPath: `/elonlar/${a.id}`, onToast: setToast })

  return (
    <div data-testid="elon-desktop" className="pb-8 pt-3">
      <nav className="flex flex-wrap items-center gap-1.5 text-[12.5px] text-muted">
        <Link to="/elonlar" className="font-medium text-sea hover:underline">E’lonlar</Link>
        <ChevronRight className="size-3.5" />
        <span>{catLabel(a)}</span>
        <ChevronRight className="size-3.5" />
        <span className="font-medium text-ink">{a.title}</span>
      </nav>

      <div className="mt-3 grid items-stretch gap-5 lg:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)]">
        <Gallery images={images} cur={cur} setCur={setCur} onZoom={setZoom} contain={contain} saved={isSaved} onSave={() => toggleSave(a.id)} pending={a._pending} status={a.status} alt={a.title} />

        <section className={`${card} flex h-full flex-col p-4 sm:p-5`}>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-sea px-2.5 py-1 text-[11.5px] font-semibold text-white">{dealName[a.deal] || 'E’lon'}</span>
            <span className="rounded-full border border-line bg-white px-2.5 py-1 text-[11.5px] font-medium text-ink-2">{catLabel(a)}</span>
            {a.cond && <span className="rounded-full bg-[#e3f8ec] px-2.5 py-1 text-[11.5px] font-semibold text-[#16a05a]">{a.cond}</span>}
            {a.original && <span className="rounded-full bg-[#e3f8ec] px-2.5 py-1 text-[11.5px] font-semibold text-[#16a05a]">Original</span>}
          </div>

          <h1 className="mt-3 text-[26px] font-extrabold leading-tight tracking-tight text-[#0d2a4a] xl:text-[28px]">
            {a.title}{demo && <DemoChip className="ml-2 align-middle" />}
          </h1>
          {a.sub && <p className="mt-1.5 text-[14.5px] leading-snug text-[#7d8fa9]">{a.sub}</p>}
          <p className="mt-3 text-[28px] font-extrabold leading-tight tracking-tight text-[#0b6d73]">
            {a.deal === 'job'
              ? <>{som(a.price).replace(' so‘m', '')} – {som(a.priceMax || a.price).replace(' so‘m', '')} <span className="text-[16px] font-bold">so‘m</span></>
              : adPrice(a)}
          </p>

          {(a.specs || []).length > 0 && (
            <div className={`mt-4 grid gap-2 rounded-2xl border border-line/70 p-3 ${(a.specs || []).length >= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {a.specs.map(([k, l, v]) => {
                const Icon = SPEC_ICONS[k] || Package
                return (
                  <div key={`${k}-${l}`} className="flex min-w-0 items-center gap-2 px-1">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#e6f4f3] text-[#0b6d73]"><Icon className="size-[18px]" strokeWidth={1.7} /></span>
                    <span className="min-w-0">
                      <span className="block text-[11px] leading-tight text-muted">{l}</span>
                      <b className="block text-[13px] font-semibold leading-tight text-ink">{v}</b>
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {demo && <DemoNotice className="mt-4" />}

          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-line/70 p-3">
            <SellerPic s={seller} />
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-medium text-muted">{who}</span>
              <b className="block truncate text-[15px] font-bold text-ink">{seller.name}</b>
              <span className="block truncate text-[12.5px] text-muted">{seller.type}</span>
              {(seller.rating != null || seller.since) && (
                <span className="mt-0.5 flex items-center gap-1 text-[12px] text-ink-2">
                  {seller.rating != null && <><Star className="size-3.5 fill-star text-star" /> <b>{seller.rating}</b></>}
                  {seller.rating != null && seller.since && <span className="text-muted">·</span>}
                  {seller.since && <span>{seller.since} yildan beri StomaHub’da</span>}
                </span>
              )}
            </span>
          </div>

          {demo ? <DemoActionBar className="mt-3" /> : active && !isOwner && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {tg ? (
                <button type="button" onClick={writeTg} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#bfe3df] bg-[#e6f4f3] text-[13.5px] font-semibold text-[#0b6d73] transition hover:bg-[#d8f0ed]">
                  <Send className="size-4" /> Telegram’da yozish
                </button>
              ) : (
                <span className="flex h-12 items-center justify-center rounded-xl border border-line bg-page text-[13px] font-semibold text-muted">Telegram yo‘q</span>
              )}
              {phone ? (
                <a href={`tel:${phone}`} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0b6d73] text-[13.5px] font-semibold text-white transition hover:bg-sea-600">
                  <Phone className="size-4" /> Qo‘ng‘iroq qilish
                </a>
              ) : (
                <button type="button" onClick={() => setToast('Telefon ko‘rsatilmagan')} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0b6d73] text-[13.5px] font-semibold text-white">
                  <Phone className="size-4" /> Qo‘ng‘iroq qilish
                </button>
              )}
            </div>
          )}

          {isOwner && active && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" disabled={busy} onClick={() => mark('sold')} className="h-11 rounded-xl bg-[#0b6d73] text-[13.5px] font-semibold text-white disabled:opacity-50">Sotildi</button>
              <button type="button" disabled={busy} onClick={() => mark('closed')} className="h-11 rounded-xl border border-line text-[13.5px] font-semibold text-ink disabled:opacity-50">Yopish</button>
            </div>
          )}

          <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-3 text-[12.5px] text-muted">
            <span className="flex items-center gap-1.5"><Eye className="size-4" /> {a.views || 0} ko‘rildi</span>
            {a.date && <span className="flex items-center gap-1.5"><CalendarDays className="size-4" /> {a.date}</span>}
            {a.city && <span className="flex items-center gap-1.5"><MapPin className="size-4 text-sea" /> {a.city}</span>}
          </div>
        </section>
      </div>

      <div className="mt-5 grid items-start gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
        <section className={`${card} p-4 sm:p-5`}>
          <h2 className="flex items-center gap-2 text-[17px] font-bold text-[#0d2a4a]">
            <span className="grid size-8 place-items-center rounded-lg bg-[#e6f4f3] text-[#0b6d73]"><FileText className="size-4" /></span>
            Tavsif
          </h2>
          <p className="mt-3 text-[14.5px] leading-[1.65] text-ink-2">{a.about}</p>
          {a.features?.length > 0 && (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {a.features.map((t) => (
                  <li key={t} className="flex items-start gap-2 rounded-xl bg-[#f6faf9] px-3 py-2 text-[13.5px] leading-snug text-ink-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 fill-[#0b8a95] text-white" /> {t}
                  </li>
                ))}
            </ul>
          )}
        </section>

        <section className={`${card} p-4 sm:p-5`}>
          <h2 className="flex items-center gap-2 text-[17px] font-bold text-[#0d2a4a]">
            <span className="grid size-8 place-items-center rounded-lg bg-[#e6f4f3] text-[#0b6d73]"><Store className="size-4" /></span>
            {who}
          </h2>
          <div className="mt-3 flex items-center gap-3">
            <SellerPic s={seller} />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold text-ink">{seller.name}</p>
              <p className="truncate text-[12.5px] text-muted">{seller.type}</p>
              <p className="mt-0.5 flex items-center gap-1 text-[12px] text-ink-2">
                {seller.rating != null ? <><Star className="size-3.5 fill-star text-star" /> <b>{seller.rating}</b></> : 'Hali baho yo‘q'}
                {seller.since && <span className="text-muted">· {seller.since} yildan beri</span>}
              </p>
            </div>
          </div>
          {a.city && <p className="mt-3 flex items-center gap-1.5 text-[13px] text-ink-2"><MapPin className="size-4 text-sea" /> {a.city}</p>}
          <p className="mt-3 text-[13px] font-semibold text-ink">Boshqa e’lonlari ({others.length})</p>
          {others.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {others.map((x) => (
                <li key={x.id}>
                  <Link to={`/elonlar/${x.id}`} className="flex items-center gap-2.5 rounded-xl border border-line/70 p-2 transition hover:border-sea/40 hover:bg-[#f6faf9]">
                    <img src={x.images?.[0]} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-ink">{x.title}</span>
                      <span className="block text-[12.5px] font-bold text-[#0b6d73]">{adPrice(x)}</span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-[12.5px] text-muted">Boshqa ochiq e’loni yo‘q</p>
          )}
        </section>
      </div>

      {similar.length > 0 && (
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-[18px] font-bold text-[#0d2a4a]">O‘xshash e’lonlar</h2>
            <Link to="/elonlar" className="flex items-center gap-1 text-[13px] font-semibold text-sea hover:underline">
              Barchasini ko‘rish <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {similar.map((x) => (
              <article key={x.id} className={`${card} relative overflow-hidden transition hover:shadow-md`}>
                <Link to={`/elonlar/${x.id}`} className="group block">
                  <span className="relative block h-[150px] bg-[#eef3f6]">
                    <img src={x.images?.[0]} alt={x.title} className="size-full object-cover" />
                    <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10.5px] font-semibold text-white ${x.isDemo ? 'bg-[#f59e0b]' : 'bg-sea'}`}>{x.isDemo ? 'Namuna' : (dealName[x.deal] || 'E’lon')}</span>
                  </span>
                  <span className="block p-3">
                    <span className="line-clamp-2 text-[14px] font-bold leading-snug text-[#0d2a4a] group-hover:text-sea">{x.title}</span>
                    {x.sub && <span className="mt-0.5 line-clamp-1 block text-[12px] text-ink-2">{x.sub}</span>}
                    <span className="mt-2 block text-[15px] font-extrabold text-[#0b6d73]">{adPrice(x)}</span>
                    <span className="mt-1 flex items-center gap-1 text-[12px] text-muted"><MapPin className="size-3.5 text-sea" /> {x.city}</span>
                  </span>
                </Link>
                <button
                  type="button"
                  aria-label="Saqlash"
                  aria-pressed={saved.has(x.id)}
                  onClick={() => toggleSave(x.id)}
                  className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-white/95 shadow-[0_1px_4px_rgb(11_31_58/0.15)]"
                >
                  <Heart className={`size-4 ${saved.has(x.id) ? 'fill-sale text-sale' : 'text-[#0b6d73]'}`} />
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      {zoom !== null && <Lightbox images={images} index={cur} onIndex={(i) => { setCur(i); setZoom(i) }} onClose={() => setZoom(null)} alt={a.title} />}
      {toast && <Toast text={toast} onClose={closeToast} />}
    </div>
  )
}

function Gallery({ images, cur, setCur, onZoom, contain, saved, onSave, pending, status, alt }) {
  const n = images.length
  const fit = contain ? 'object-contain p-6' : 'object-cover'
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative min-h-[360px] flex-1 overflow-hidden rounded-2xl bg-[#eef3f8]">
        <button type="button" onClick={() => onZoom(cur)} aria-label="Rasmni kattalashtirish" className="absolute inset-0 cursor-zoom-in">
          <img src={images[cur]} alt={alt} className={`size-full ${fit}`} />
        </button>
        <button type="button" onClick={onSave} aria-label="Saqlash" aria-pressed={saved} className="absolute right-3 top-3 grid size-11 place-items-center rounded-full bg-white shadow-[0_1px_4px_rgb(11_31_58/0.15)]">
          <Heart className={`size-5 ${saved ? 'fill-sale text-sale' : 'text-[#0b6d73]'}`} />
        </button>
        <span className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-ink/55 px-2 py-0.5 text-[12px] font-medium text-white">{cur + 1} / {n}</span>
        {pending && <span className="absolute left-3 top-3 rounded-md bg-[#fff8e6] px-2.5 py-1 text-[11px] font-semibold text-[#7a5200]">Moderatsiyada</span>}
        {(status === 'sold' || status === 'closed') && (
          <span className="absolute left-3 top-3 rounded-md bg-ink/70 px-2.5 py-1 text-[11px] font-semibold text-white">{status === 'sold' ? 'Sotilgan' : 'Yopilgan'}</span>
        )}
        {n > 1 && <GalleryArrow side="left" onClick={() => setCur((cur - 1 + n) % n)} />}
        {n > 1 && <GalleryArrow side="right" onClick={() => setCur((cur + 1) % n)} />}
      </div>
      <div className="no-scrollbar mt-2.5 flex shrink-0 gap-2 overflow-x-auto">
        {images.map((src, i) => (
          <button
            key={`${i}-${src}`}
            type="button"
            onClick={() => setCur(i)}
            aria-label={`Rasm ${i + 1}`}
            aria-pressed={cur === i}
            className={`h-[72px] w-[96px] shrink-0 overflow-hidden rounded-xl bg-white ${cur === i ? 'ring-2 ring-sea' : 'ring-1 ring-line hover:ring-sea/50'}`}
          >
            <img src={src} alt="" className={`size-full ${contain ? 'object-contain p-1' : 'object-cover'}`} />
          </button>
        ))}
      </div>
    </div>
  )
}

function GalleryArrow({ side, onClick }) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === 'left' ? 'Oldingi rasm' : 'Keyingi rasm'}
      className={`absolute top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-ink shadow-md transition hover:bg-white ${side === 'left' ? 'left-3' : 'right-3'}`}
    >
      <Icon className="size-5" />
    </button>
  )
}

function SellerPic({ s }) {
  if (s.photo || s.avatar) return <img src={s.photo || s.avatar} alt="" className="size-12 shrink-0 rounded-full object-cover" />
  return <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#e6f4f3] text-[#0b6d73]"><ToothIcon className="size-7" /></span>
}

function Toast({ text, onClose }) {
  return (
    <button type="button" onClick={onClose} role="status" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-white shadow-lg">
      {text}
    </button>
  )
}
