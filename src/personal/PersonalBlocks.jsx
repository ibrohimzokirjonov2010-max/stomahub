import { useEffect, useMemo, useState } from 'react'
import { Sparkles, X, Check } from 'lucide-react'
import { CatalogCard } from '../components/catalog/CatalogLayout'
import { MobileToast } from '../components/mobile/parts'
import { useMarket } from '../buyerApi'
import { profileStore, flushProfile } from '../profileStore'
import { refreshSession } from '../sessionStore'
import { usePersonal } from './usePersonal'
import { recommend } from './rank.js'
import { complementsFor } from './complements.js'
import { PICKER_SPECIALTIES, specialtyTitle } from './specialtyMap.js'
import { recordInterest } from './interestStore'

const REASON = { viewed: 'Siz ko‘rgan', cart: 'Savatga qo‘shgansiz', searched: 'Qidiruvingiz bo‘yicha', complement: 'Xaridingizga mos', similar: 'Qiziqishingizga o‘xshash', popular: 'Ommabop' }

const pct = (p) => (Number(p.oldPrice) > Number(p.price) ? Math.round((1 - p.price / p.oldPrice) * 100) : 0)

function toCard(p, reasonText) {
  const off = pct(p)
  return {
    id: p.id, href: `/product/${p.id}`, image: p.image, fit: 'contain',
    kicker: reasonText || [p.brand, p.category].filter(Boolean).join(' · '),
    title: p.name, meta: [p.seller], price: p.price, oldPrice: off ? p.oldPrice : 0,
    // Chegirma bo‘lsa — birinchi navbatda chegirma belgisi
    badge: off ? { text: `-${off}%`, tone: 'sale' } : p.stock <= 0 ? { text: 'Tugagan', tone: 'info' } : null,
    cart: p.stock > 0 ? { prefix: p.id, line: { id: p.id, productId: p.id, name: p.name, type: p.brand || p.category, price: p.price, image: p.image } } : null,
  }
}

function ProductRow({ title, subtitle, products, reasons = {}, desktop, testId }) {
  const [toast, setToast] = useState('')
  return (
    <section data-testid={testId} className="mt-3 min-w-0">
      <div className="mb-2 flex min-w-0 items-end justify-between gap-2">
        <div className="min-w-0">
          <h2 className={`flex items-center gap-1.5 truncate font-extrabold text-[#0d2a4a] ${desktop ? 'text-[18px]' : 'text-[16px]'}`}><Sparkles className="size-4 shrink-0 text-sea" /> <span className="truncate">{title}</span></h2>
          {subtitle && <p className="truncate text-[11.5px] text-muted">{subtitle}</p>}
        </div>
      </div>
      <div className={desktop ? 'grid grid-cols-3 gap-4 xl:grid-cols-4 2xl:grid-cols-5' : '-mx-3.5 flex snap-x scroll-px-3.5 gap-2.5 overflow-x-auto px-3.5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'}>
        {products.slice(0, desktop ? 10 : 12).map((p) => {
          const card = toCard(p, reasons[p.id])
          return (
            <div key={p.id} className={desktop ? 'flex min-w-0 [&>a]:flex-1' : 'flex w-[47%] max-w-[190px] shrink-0 snap-start [&>a]:flex-1'}>
              <CatalogCard card={card} desktop={desktop}
                onAdd={() => setToast(`${card.title} savatga qo‘shildi`)} />
            </div>
          )
        })}
      </div>
      <MobileToast text={toast} onClose={() => setToast('')} bottom={desktop ? 24 : 76} />
    </section>
  )
}

/** "Siz uchun" — faqat kirgan foydalanuvchiga, kamida 2 ta haqiqiy mahsulot bo‘lsa. */
export function SizUchun({ desktop }) {
  const { products, status } = useMarket()
  const me = usePersonal()
  // marketProducts joyida yangilanadi (bir xil massiv) — status/uzunlik bilan qayta hisoblaymiz.
  const rec = useMemo(() => (me.authed ? recommend(products, { signals: me.signals, specialty: me.specialty }) : { items: [] }), [products, products.length, status, me.authed, me.signals, me.specialty]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!me.authed || rec.items.length < 2) return null
  const specTitle = specialtyTitle(me.specialty)
  const title = rec.mode === 'specialty' && specTitle ? `Siz uchun: ${specTitle}` : rec.mode === 'popular' ? 'Siz uchun: ommabop mahsulotlar' : 'Siz uchun'
  const subtitle = rec.mode === 'behavior' ? 'Ko‘rgan, qidirgan va xarid qilganlaringiz asosida' : rec.mode === 'specialty' ? 'Yo‘nalishingiz bo‘yicha tanlandi' : 'Hamkasblaringiz ko‘p ko‘rayotganlari'
  const reasons = Object.fromEntries(rec.items.map((x) => [x.product.id, x.reason === 'specialty' ? specTitle : REASON[x.reason] || '']))
  return <ProductRow testId="siz-uchun" title={title} subtitle={subtitle} products={rec.items.map((x) => x.product)} reasons={reasons} desktop={desktop} />
}

/** Mahsulot sahifasida: "Bu bilan birga olishadi" (to‘ldiruvchilar, kamida 2 ta). */
export function BirgaOlishadi({ product, desktop }) {
  const { products, status } = useMarket()
  const list = useMemo(() => complementsFor(product, products), [product, products, products.length, status]) // eslint-disable-line react-hooks/exhaustive-deps
  if (list.length < 2) return null
  return <ProductRow testId="birga-olishadi" title="Bu bilan birga olishadi" subtitle="Shu mahsulot bilan birga ishlatiladi" products={list} desktop={desktop} />
}

const DISMISS_KEY = 'sh_specpick_dismissed'
const dismissed = (uid) => { try { return (JSON.parse(localStorage.getItem(DISMISS_KEY) || '[]') || []).includes(uid) } catch { return false } }
const dismiss = (uid) => { try { const l = JSON.parse(localStorage.getItem(DISMISS_KEY) || '[]') || []; localStorage.setItem(DISMISS_KEY, JSON.stringify([...new Set([...l, uid])].slice(-20))) } catch { /* ignore */ } }

/** Mutaxassisligi yo‘q shifokorga bir marta: "Yo‘nalishingizni tanlang". */
export function SpecialtyPicker({ desktop }) {
  const me = usePersonal()
  const [hidden, setHidden] = useState(false)
  const [pick, setPick] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  if (!me.isDoctor || me.specialtyRaw || hidden || !me.uid || dismissed(me.uid)) return null
  const close = () => { dismiss(me.uid); setHidden(true) }
  const save = async () => {
    if (!pick) return
    setSaving(true); setErr('')
    try {
      profileStore.update({ role: pick })
      await flushProfile()
      await refreshSession()
      dismiss(me.uid)
      setHidden(true)
    } catch (e) {
      setErr(e?.message || 'Saqlab bo‘lmadi, qayta urinib ko‘ring')
    } finally { setSaving(false) }
  }
  return (
    <section data-testid="spec-picker" className={`relative mt-3 rounded-2xl border border-sea/25 bg-white p-3.5 shadow-[0_1px_4px_rgb(11_31_58/0.06)] ${desktop ? 'p-4' : ''}`}>
      <button type="button" onClick={close} aria-label="Yopish" className="absolute right-2 top-2 grid size-8 place-items-center rounded-full text-muted hover:bg-page"><X className="size-4" /></button>
      <p className="pr-8 text-[15px] font-bold text-ink">Yo‘nalishingizni tanlang</p>
      <p className="mt-0.5 pr-8 text-[12.5px] text-ink-2">Sizga mos mahsulot va seminarlarni birinchi bo‘lib ko‘rsatamiz.</p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {PICKER_SPECIALTIES.map((s) => (
          <button key={s} type="button" aria-pressed={pick === s} onClick={() => setPick(s)} className={`flex h-9 items-center gap-1 rounded-xl border px-3 text-[12.5px] font-medium ${pick === s ? 'border-sea bg-sea-50 text-sea' : 'border-line bg-white text-ink'}`}>
            {pick === s && <Check className="size-3.5" />}{s}
          </button>
        ))}
      </div>
      {err && <p role="alert" className="mt-2 text-[12px] text-[#b42318]">{err}</p>}
      <div className="mt-3 flex gap-2">
        <button type="button" disabled={!pick || saving} onClick={save} className="h-10 rounded-xl bg-sea px-4 text-[13px] font-semibold text-white disabled:opacity-50">{saving ? 'Saqlanmoqda…' : 'Saqlash'}</button>
        <button type="button" onClick={close} className="h-10 rounded-xl px-3 text-[13px] font-semibold text-ink-2">Keyinroq</button>
      </div>
    </section>
  )
}

/** Mahsulot sahifasi ko‘rilganini qayd qiladi. */
export function useTrackView(p) {
  const id = p?.id
  useEffect(() => { if (id) recordInterest('view', { productId: id, category: p.rawCategory || p.category }) }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
}
