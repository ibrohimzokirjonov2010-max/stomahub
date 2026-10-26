import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Heart, ChevronRight, Tag, Briefcase, Settings, CalendarDays, Ruler, MapPin, Clock, GraduationCap, Layers, FileText, CheckCircle2,
  Store, MessageCircle, Phone, Star, Eye, Flag, Package,
} from 'lucide-react'
import { ADS, adCatName, adPrice } from '../../elonlarData'
import { MobileToast } from './parts'
import MobileTabBar from './MobileTabBar'
import { BottomSheet, ToothIcon } from './MobileSeminars'
import { HubTopBar } from './MobileKategoriyalar'
import { Lightbox } from './MobileCommunity'
import { ChatSheet, CallSheet } from './MobileMutaxassislar'
import { AdCard, adsStore, findAd, sellerOf, useAds } from './MobileElonlar'

const SPEC_ICONS = { brand: Tag, size: Briefcase, cond: Settings, year: CalendarDays, area: Ruler, place: MapPin, time: Clock, exp: GraduationCap, cat: Layers }
const QUICK = {
  sale: ['Hali sotuvdami?', 'Narxi kelishiladimi?', 'Yetkazib berasizmi?', 'Qayerda ko‘rsa bo‘ladi?'],
  rent: ['Hali bo‘shmi?', 'Qachondan olsa bo‘ladi?', 'Zalog kerakmi?', 'Ko‘rib chiqsa bo‘ladimi?'],
  job: ['Vakansiya ochiqmi?', 'Suhbat qachon?', 'Ish grafigi qanday?', 'Rezyume yuborsam bo‘ladimi?'],
}

export default function MobileElon() {
  const { id } = useParams()
  return <AdView key={id} id={id} />
}

function AdView({ id }) {
  const navigate = useNavigate()
  const { saved } = useAds()
  const a = findAd(id)
  const [cur, setCur] = useState(0)
  const [zoom, setZoom] = useState(null)
  const [sheet, setSheet] = useState(null)
  const [toast, setToast] = useState('')
  const closeToast = useCallback(() => setToast(''), [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  if (!a) {
    return (
      <div className="grid min-h-screen place-items-center bg-white px-6 text-center">
        <div>
          <p className="text-[15px] font-semibold text-ink">E’lon topilmadi</p>
          <Link to="/elonlar" className="mt-3 inline-block text-[13px] font-semibold text-sea">E’lonlarga qaytish</Link>
        </div>
      </div>
    )
  }

  const seller = sellerOf(a)
  const contact = { ...seller, clinic: seller.type, city: a.city, online: true }
  const isSaved = saved.has(a.id)
  const isJob = a.deal === 'job'
  const thumbs = a.images.slice(0, 3)
  const extra = a.images.length - 3
  const similar = ADS.filter((x) => x.id !== a.id && (x.cat === a.cat || x.deal === a.deal)).slice(0, 3)
  const sellerAds = ADS.filter((x) => x.seller === a.seller && x.id !== a.id)
  const back = () => (window.history.length > 1 ? navigate(-1) : navigate('/elonlar'))
  const chatText = isJob ? `Assalomu alaykum! "${a.title}" vakansiyasi bo‘yicha yozyapman.` : `Assalomu alaykum! "${a.title}" e’loni hali dolzarbmi?`

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef8f7_0%,#f6faf9_30%)] pb-[150px]">
      <div className="px-3.5 pt-3">
        <HubTopBar onBack={back} onBell={() => setToast('Yangi bildirishnomalar yo‘q')} />

        <div className="mt-2.5 grid h-[236px] grid-cols-[1fr_72px] gap-2">
          <div className="relative overflow-hidden rounded-2xl bg-white shadow-[0_1px_4px_rgb(11_31_58/0.06)]">
            <button type="button" onClick={() => setZoom(cur)} aria-label="Kattalashtirish" className="size-full">
              <img src={a.images[cur]} alt={a.title} className={`size-full ${a.cat === 'material' || a.cat === 'asbob' ? 'object-contain p-2' : 'object-cover'}`} />
            </button>
            <button type="button" onClick={() => setToast(adsStore.toggleSave(a.id) ? 'Saqlanganlarga qo‘shildi' : 'Saqlanganlardan olib tashlandi')} aria-label="Saqlash" aria-pressed={isSaved} className="absolute right-2.5 top-2.5 grid size-10 place-items-center rounded-full bg-white shadow-[0_1px_4px_rgb(11_31_58/0.15)]">
              <Heart className={`size-5 ${isSaved ? 'fill-sale text-sale' : 'text-[#0b6d73]'}`} />
            </button>
            <span className="absolute bottom-2 left-2 rounded-md bg-ink/55 px-1.5 py-0.5 text-[10.5px] font-medium text-white">{cur + 1} / {a.images.length}</span>
          </div>
          <div className="grid grid-rows-4 gap-2">
            {thumbs.map((src, i) => (
              <button key={i} type="button" onClick={() => setCur(i)} aria-label={`Rasm ${i + 1}`} aria-pressed={cur === i} className={`overflow-hidden rounded-xl bg-white ${cur === i ? 'ring-2 ring-sea' : 'ring-1 ring-line/70'}`}>
                <img src={src} alt="" className="size-full object-cover" />
              </button>
            ))}
            {extra > 0 && <button type="button" onClick={() => setZoom(3)} className="rounded-xl bg-[#e6f4f3] text-[15px] font-semibold text-[#0b6d73]">+{extra}</button>}
          </div>
        </div>

        <section className="mt-2.5 rounded-2xl bg-white p-3.5 shadow-[0_1px_4px_rgb(11_31_58/0.05)]">
          <div className="flex items-center gap-1.5">
            <span className="rounded-full border border-line px-2.5 py-1 text-[10.5px] text-ink-2">{isJob ? 'Ish o‘rni' : adCatName[a.cat] === 'Materiallar' ? 'Stomatologik materiallar' : adCatName[a.cat]}</span>
            <span className="ml-auto rounded-full bg-[#e3f8ec] px-2.5 py-1 text-[10.5px] font-semibold text-[#16a05a]">{a.cond}</span>
            {a.original && <span className="rounded-full bg-[#e3f8ec] px-2.5 py-1 text-[10.5px] font-semibold text-[#16a05a]">Original</span>}
          </div>
          <h1 className="mt-2 text-[24px] font-extrabold leading-tight tracking-tight text-[#0d2a4a]">{a.title}</h1>
          <p className="mt-1 text-[13px] leading-snug text-[#7d8fa9]">{a.sub}</p>
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <p className="text-[21px] font-extrabold tracking-tight text-[#0b6d73]">{adPrice(a)}</p>
            <button type="button" onClick={() => setSheet('seller')} className="flex shrink-0 items-center gap-0.5 text-[12px] font-medium text-[#0b6d73]">{isJob ? 'Ish beruvchi' : 'Sotuvchidan'} <ChevronRight className="size-4" /></button>
          </div>

          <div className="mt-3 grid grid-cols-3 divide-x divide-line/70 rounded-2xl border border-line/70 py-2.5">
            {a.specs.map(([k, l, v]) => {
              const Icon = SPEC_ICONS[k] || Package
              return (
                <div key={l} className="flex min-w-0 items-center gap-2 px-2">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e6f4f3] text-[#0b6d73]"><Icon className="size-[18px]" strokeWidth={1.7} /></span>
                  <span className="min-w-0">
                    <span className="block text-[10px] leading-tight text-muted">{l}</span>
                    <b className="block text-[11.5px] font-semibold leading-tight text-ink">{v}</b>
                  </span>
                </div>
              )
            })}
          </div>

          <h2 className="mt-4 flex items-center gap-2 text-[15px] font-bold text-[#0d2a4a]"><span className="grid size-7 place-items-center rounded-lg bg-[#e6f4f3] text-[#0b6d73]"><FileText className="size-4" /></span> Tavsif</h2>
          <p className="mt-2 text-[13px] leading-[1.55] text-ink-2">{a.about}</p>
          {a.features.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-2 rounded-2xl border border-line/70 p-3">
              {a.features.map((t) => <p key={t} className="flex items-start gap-1.5 text-[11.5px] leading-tight text-ink-2"><CheckCircle2 className="size-4 shrink-0 fill-[#0b8a95] text-white" /> {t}</p>)}
            </div>
          )}

          <h2 className="mt-4 flex items-center gap-2 text-[15px] font-bold text-[#0d2a4a]"><span className="grid size-7 place-items-center rounded-lg bg-[#e6f4f3] text-[#0b6d73]"><Store className="size-4" /></span> {isJob ? 'Ish beruvchi' : 'Sotuvchi'}</h2>
          <button type="button" onClick={() => setSheet('seller')} className="mt-2 flex w-full items-center gap-3 rounded-2xl border border-line/70 p-2.5 text-left active:bg-[#f2f8f8]">
            <SellerPic s={seller} />
            <span className="min-w-0 flex-1">
              <b className="block truncate text-[14px] font-bold text-ink">{seller.name}</b>
              <span className="block truncate text-[11.5px] text-muted">{seller.type}</span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-muted" />
          </button>

          <div className="mt-3 flex items-center gap-3 text-[11px] text-muted">
            <span className="flex items-center gap-1"><Eye className="size-3.5" /> {a.views} ko‘rildi</span>
            <span className="flex items-center gap-1"><CalendarDays className="size-3.5" /> {a.date}</span>
            <button type="button" onClick={() => setToast('Shikoyatingiz moderatorga yuborildi')} className="ml-auto flex items-center gap-1 text-sale"><Flag className="size-3.5" /> Shikoyat</button>
          </div>
        </section>

        {similar.length > 0 && (
          <>
            <h2 className="mb-2 mt-4 text-[16px] font-bold text-[#0d2a4a]">O‘xshash e’lonlar</h2>
            <div className="flex flex-col gap-2">
              {similar.map((x) => <AdCard key={x.id} a={x} saved={saved.has(x.id)} onSave={() => setToast(adsStore.toggleSave(x.id) ? 'Saqlanganlarga qo‘shildi' : 'Saqlanganlardan olib tashlandi')} />)}
            </div>
          </>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-[62px] z-30 grid grid-cols-2 gap-2 border-t border-line/60 bg-white/95 px-3.5 py-2 backdrop-blur">
        <button type="button" onClick={() => setSheet('chat')} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#bfe3df] bg-[#e6f4f3] text-[13.5px] font-semibold text-[#0b6d73]"><MessageCircle className="size-5" /> {isJob ? 'Ish beruvchiga yozish' : 'Sotuvchi bilan chat'}</button>
        <button type="button" onClick={() => setSheet('call')} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0b6d73] text-[13.5px] font-semibold text-white"><Phone className="size-5" /> Qo‘ng‘iroq qilish</button>
      </div>

      {sheet === 'chat' && <ChatSheet d={contact} initial={chatText} quick={QUICK[a.deal]} onClose={() => setSheet(null)} onSent={() => { setSheet(null); setToast('Xabar yuborildi') }} />}
      {sheet === 'call' && <CallSheet d={contact} onClose={() => setSheet(null)} onChat={() => setSheet('chat')} onToast={setToast} />}
      {sheet === 'seller' && (
        <BottomSheet title={isJob ? 'Ish beruvchi' : 'Sotuvchi'} onClose={() => setSheet(null)}>
          <div className="mt-2 flex items-center gap-3 rounded-2xl bg-[#f2f8f8] p-3">
            <SellerPic s={seller} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold text-ink">{seller.name}</p>
              <p className="text-[12px] text-muted">{seller.type}</p>
              <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-ink-2"><Star className="size-3.5 fill-star text-star" /> <b>{seller.rating}</b> · {seller.since} yildan beri StomaHub’da</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setSheet('chat')} className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[#e6f4f3] text-[13px] font-semibold text-[#0b6d73]"><MessageCircle className="size-4" /> Yozish</button>
            <a href={`tel:${seller.phone.replace(/\s/g, '')}`} className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[#0b6d73] text-[13px] font-semibold text-white"><Phone className="size-4" /> {seller.phone}</a>
          </div>
          <p className="mt-4 text-[13px] font-semibold text-ink">Boshqa e’lonlari ({sellerAds.length})</p>
          <div className="mt-2 flex flex-col gap-2 pb-3">
            {sellerAds.length ? sellerAds.map((x) => (
              <Link key={x.id} to={`/elonlar/${x.id}`} className="flex items-center gap-2.5 rounded-xl border border-line/70 p-1.5">
                <img src={x.images[0]} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-[12.5px] font-semibold text-ink">{x.title}</b>
                  <span className="block truncate text-[12px] font-bold text-[#0b8a95]">{adPrice(x)}</span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted" />
              </Link>
            )) : <p className="text-[12px] text-muted">Hozircha boshqa e’lon yo‘q</p>}
          </div>
        </BottomSheet>
      )}
      {zoom !== null && <Lightbox images={a.images} index={zoom} onClose={() => setZoom(null)} />}

      <MobileToast text={toast} onClose={closeToast} bottom={140} />
      <MobileTabBar />
    </div>
  )
}

function SellerPic({ s }) {
  if (s.photo) return <img src={s.photo} alt="" className="size-12 shrink-0 rounded-full object-cover" />
  return <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#e6f4f3] text-[#0b6d73]"><ToothIcon className="size-7" strokeWidth={1.6} /></span>
}
