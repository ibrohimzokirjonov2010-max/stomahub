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

// DEV-only: skrinshot uchun ?specpick bilan har doim ko‘rsatish (prod build’da o‘chadi)
const forcePicker = () => import.meta.env.DEV && typeof location !== 'undefined' && new URLSearchParams(location.search).has('specpick')

/** Mutaxassisligi yo‘q shifokorga bir marta: "Yo‘nalishingizni tanlang" (ixcham kartochka). */
export function SpecialtyPicker({ desktop }) {
  const me = usePersonal()
  const [hidden, setHidden] = useState(false)
  const [pick, setPick] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const forced = forcePicker()
  if (!forced && (!me.isDoctor || me.specialtyRaw || hidden || !me.uid || dismissed(me.uid))) return null
  if (forced && hidden) return null
  const close = () => { if (me.uid) dismiss(me.uid); setHidden(true) }
  const save = async () => {
    if (!pick) return
    setSaving(true); setErr('')
    try {
      if (forced && !me.uid) { setHidden(true); return }
      profileStore.update({ role: pick })
      await flushProfile()
      await refreshSession()
      dismiss(me.uid)
      setHidden(true)
    } catch (e) {
      setErr(e?.message || 'Saqlab bo‘lmadi, qayta urinib ko‘ring')
    } finally { setSaving(false) }
  }
  return <SpecialtyPickerCard desktop={desktop} pick={pick} onPick={setPick} saving={saving} err={err} onSave={save} onClose={close} />
}

export function SpecialtyPickerCard({ desktop, pick, onPick, saving, err, onSave, onClose }) {
  const actions = (
    <>
      <button type="button" onClick={onClose} className="h-8 rounded-full px-3 text-[12.5px] font-semibold text-[#64748b] transition hover:text-[#1f2a3c] focus-visible:outline-2 focus-visible:outline-[#0F766E]">Keyinroq</button>
      <button type="button" disabled={!pick || saving} onClick={onSave} className="h-8 rounded-full bg-[#0F766E] px-4 text-[12.5px] font-semibold text-white shadow-[0_3px_10px_rgb(15_118_110/0.25)] transition active:scale-[0.97] disabled:bg-[#cbd5e1] disabled:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E]">{saving ? 'Saqlanmoqda…' : 'Saqlash'}</button>
    </>
  )
  return (
    <section
      data-testid="spec-picker"
      aria-labelledby="spec-picker-title"
      className={`relative mt-3 overflow-hidden rounded-[20px] border border-[#cdeef2] bg-gradient-to-br from-white via-white to-[#eef9f8] shadow-[0_1px_3px_rgb(11_31_58/0.05),0_6px_18px_rgb(15_118_110/0.06)] ${desktop ? 'px-4 pb-3.5 pt-3.5' : 'px-3 pb-3 pt-3'}`}
    >
      <div className="flex items-center gap-2.5 pr-8">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e4f6f8] text-[#0F766E] ring-1 ring-inset ring-[#cdeef2]" aria-hidden="true"><Sparkles className="size-[18px]" /></span>
        <div className="min-w-0">
          <p id="spec-picker-title" className="text-[14.5px] font-bold leading-tight text-[#0b1f3a]">Yo‘nalishingizni tanlang</p>
          <p className="mt-0.5 truncate text-[12px] leading-tight text-[#64748b]">Sizga mos mahsulotlar oldinda chiqadi</p>
        </div>
      </div>
      <button type="button" onClick={onClose} aria-label="Yopish" className="absolute right-2 top-2 grid size-8 place-items-center rounded-full text-[#94a3b8] transition hover:bg-black/5 hover:text-[#475569] focus-visible:outline-2 focus-visible:outline-[#0F766E]"><X className="size-4" /></button>

      <div className={`mt-2.5 flex gap-1.5 py-0.5 ${desktop ? 'flex-wrap' : 'spec-chips no-scrollbar -mx-3 snap-x snap-mandatory overflow-x-auto scroll-px-3 px-3'}`} role="group" aria-label="Yo‘nalishlar">
        {PICKER_SPECIALTIES.map((s) => {
          const on = pick === s
          return (
            <button
              key={s}
              type="button"
              aria-pressed={on}
              onClick={() => onPick(on ? '' : s)}
              className={`flex h-8 shrink-0 snap-start items-center gap-1 whitespace-nowrap rounded-full border px-3 text-[12.5px] font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0F766E] ${on ? 'border-[#0F766E] bg-[#0F766E] text-white shadow-[0_3px_10px_rgb(15_118_110/0.28)]' : 'border-[#e2e8f0] bg-white text-[#1f2a3c] hover:border-[#9fd9d3]'}`}
            >
              {on && <Check className="size-3.5" strokeWidth={3} />}{s}
            </button>
          )
        })}
        {desktop && <span className="ml-auto flex items-center gap-1 pl-2">{actions}</span>}
      </div>

      {err && <p role="alert" className="mt-2 text-[12px] text-[#b42318]">{err}</p>}
      {!desktop && <div className="mt-2.5 flex items-center justify-end gap-1">{actions}</div>}
    </section>
  )
}

/** Mahsulot sahifasi ko‘rilganini qayd qiladi. */
export function useTrackView(p) {
  const id = p?.id
  useEffect(() => { if (id) recordInterest('view', { productId: id, category: p.rawCategory || p.category }) }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
}
