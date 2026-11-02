import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Search, Trash2, Info, MapPin, CalendarDays, Plus, X, ImagePlus, Loader2 } from 'lucide-react'
import { insertRow, updateRow, useAsync, useSellerData, uploadMedia } from '../../api'
import { som } from '../../format'
import { useMobile } from '../../../useMobile'
import { Btn, Input, Textarea, Select, Err, toast, Checkbox } from '../ui'
import Modal from '../shell/Modal'
import ProductThumb from '../bosh-sahifa/ProductThumb'
import { BannerView, SponsoredCardView, BANNER } from '../../../components/ads/BannerView'
import { CKINDS, CKIND, REGIONS, ADS, daysBetween } from './constants'

const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)
const blank = () => ({ title: '', kind: 'qidiruv', product_ids: [], daily_budget: '', total_budget: '', starts_on: today(), ends_on: '', region: 'Barcha hududlar', description: '', image_url: '', headline: '', body_text: '', cta_text: 'Ko‘rish' })
const L = ({ children }) => <div className="mb-1.5 text-[13px] font-semibold text-[#10283F]">{children}</div>
const STEPS = [['Turi', 'Reklama turini tanlang'], ['Mahsulotlar', 'Mahsulotlarni tanlang'], ['Byudjet va muddat', 'Byudjet, sana va hudud'], ['Tasdiqlash', 'Ma’lumotlarni tekshiring']]

export default function CampaignForm({ open, onClose, edit, copy, onSaved }) {
  const { products } = useSellerData()
  const mobile = useMobile()
  const [v, setV] = useState(blank())
  const [step, setStep] = useState(0)
  const [q, setQ] = useState('')
  const [pick, setPick] = useState(false)
  const [upl, setUpl] = useState(false)
  const [ratio, setRatio] = useState(null)
  const { settings } = useSellerData()
  const a = useAsync()
  useEffect(() => {
    if (!open) return
    const src = edit || copy
    setV(src ? { ...blank(), ...src, title: copy ? `${src.title} (nusxa)` : src.title, product_ids: src.product_ids?.length ? src.product_ids : src.product_id ? [src.product_id] : [], daily_budget: src.daily_budget || '', total_budget: src.total_budget || '', ends_on: src.ends_on || '', starts_on: copy ? today() : src.starts_on } : blank())
    setRatio(null); setStep(0); setQ(''); setPick(false); a.setError('')
  }, [open, edit, copy]) // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e?.target ? e.target.value : e }))
  const active = products.filter((p) => p.status === 'active')
  const chosen = v.product_ids.map((id) => products.find((p) => p.id === id)).filter(Boolean)
  const found = useMemo(() => { const s = q.trim().toLowerCase(); return active.filter((p) => !s || `${p.name} ${p.category}`.toLowerCase().includes(s)) }, [q, active])
  const toggleP = (id) => setV((x) => ({ ...x, product_ids: x.product_ids.includes(id) ? x.product_ids.filter((y) => y !== id) : [...x.product_ids, id] }))

  function check(upto) {
    if (upto >= 0 && !v.kind) return 'Reklama turini tanlang'
    if (upto >= 1 && !v.product_ids.length) return 'Kamida bitta mahsulot tanlang'
    if (upto >= 1 && v.product_ids.length > ADS.maxProducts) return 'Ko‘pi bilan 20 ta mahsulot tanlang'
    if (upto >= 2) {
      if (!(Number(v.daily_budget) >= ADS.minDaily)) return 'Kunlik byudjet kamida 10 000 so‘m bo‘lsin'
      if (!(Number(v.total_budget) >= ADS.minTotal)) return 'Umumiy byudjet kamida 50 000 so‘m bo‘lsin'
      if (Number(v.total_budget) < Number(v.daily_budget)) return 'Umumiy byudjet kunlik byudjetdan kam bo‘lmasin'
      if (!edit && v.starts_on < today()) return 'Boshlanish sanasi bugundan oldin bo‘lmasin'
      if (!v.starts_on || !v.ends_on) return 'Boshlanish va tugash sanasini kiriting'
      if (v.ends_on < v.starts_on) return 'Tugash sanasi boshlanishdan oldin bo‘lmasin'
      const d = daysBetween(v.starts_on, v.ends_on); if (d > 90) return 'Kampaniya muddati 90 kundan oshmasin'
    }
    if (upto >= 3 && v.title.trim().length < 3) return 'Kampaniya nomini kiriting (kamida 3 belgi)'
    if (upto >= 3 && v.kind === 'banner') {
      if (!v.image_url) return 'Banner uchun rasm majburiy (1200×400)'
      if (v.headline.trim().length < 2) return 'Banner sarlavhasini kiriting'
    }
    if (upto >= 3 && (v.headline.length > 50 || v.body_text.length > 100 || (v.cta_text || '').length > 20)) return 'Banner matnlari juda uzun'
    return ''
  }
  const next = () => { const e = check(step); if (e) return a.setError(e); a.setError(''); setStep(step + 1) }
  function save() {
    const e = check(3); if (e) return a.setError(e)
    const row = { title: v.title.trim(), kind: v.kind, product_ids: v.product_ids, product_id: v.product_ids[0] || null, daily_budget: Number(v.daily_budget), total_budget: Number(v.total_budget),
      starts_on: v.starts_on, ends_on: v.ends_on, days: Math.min(90, daysBetween(v.starts_on, v.ends_on)), region: v.region, description: (v.description || '').trim(), image_url: v.image_url || '',
      headline: (v.headline || '').trim(), body_text: (v.body_text || '').trim(), cta_text: (v.cta_text || '').trim() || 'Ko‘rish' }
    // Holatni server belgilaydi: yangi va kontenti o‘zgargan kampaniya — moderatsiyada.
    a.go(() => (edit ? updateRow('seller_campaigns', edit.id, row) : insertRow('seller_campaigns', row)), (r) => {
      toast(!edit || r.data?.status === 'moderatsiyada' ? 'Kampaniya moderatsiyaga yuborildi' : 'Kampaniya yangilandi'); onSaved?.(r.data); onClose()
    })
  }
  async function onImage(e) {
    const f = e.target.files?.[0]; e.target.value = ''
    if (!f) return
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) return a.setError('Faqat rasm fayli (JPG, PNG, WEBP)')
    if (f.size > BANNER.maxMB * 1024 * 1024) return a.setError(`Rasm hajmi ${BANNER.maxMB} MB dan oshmasin`)
    a.setError('')
    setUpl(true); const r = await uploadMedia(f, 'ads'); setUpl(false)
    if (!r.ok) return a.setError(r.error)
    setV((x) => ({ ...x, image_url: r.url }))
  }

  const kinds = <div className="grid gap-2 md:grid-cols-3">{CKINDS.map(([k, l, s, I]) => <button key={k} type="button" onClick={() => setV((x) => ({ ...x, kind: k }))} className={`relative rounded-xl border p-3 text-left ${v.kind === k ? 'border-[#0F766E] bg-[#F0FDFA]' : 'border-[#E6EEF0] hover:border-[#99D5CE]'}`}>{v.kind === k && <Check className="absolute right-2 top-2 size-4 text-[#0F766E]" />}<I className="size-6 text-[#0F766E]" /><div className="mt-1.5 text-[13.5px] font-bold">{l}</div><div className="text-[12px] text-[#5C6E80]">{s}</div></button>)}</div>
  const picker = <div>
    <Input icon={Search} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Mahsulot nomi yoki kategoriya..." />
    <div className="mt-2 max-h-[320px] space-y-1 overflow-y-auto">{found.length ? found.map((p) => <label key={p.id} className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-2 ${v.product_ids.includes(p.id) ? 'border-[#0F766E] bg-[#F0FDFA]' : 'border-[#EEF3F4]'}`}><Checkbox checked={v.product_ids.includes(p.id)} onChange={() => toggleP(p.id)} /><ProductThumb src={p.image_url} className="h-10 w-12 shrink-0" /><div className="min-w-0 flex-1"><div className="truncate text-[13px] font-semibold">{p.name}</div><div className="text-[11.5px] text-[#5C6E80]">Mavjud: {p.stock} {p.unit || 'dona'}</div></div><b className="text-[13px]">{som(p.price)}</b></label>) : <p className="py-6 text-center text-[13px] text-[#5C6E80]">{active.length ? 'Mahsulot topilmadi.' : 'Faol mahsulotlar yo‘q. Avval mahsulot qo‘shing va tasdiqlanishini kuting.'}</p>}</div>
  </div>
  const chosenList = <div className="rounded-xl border border-[#E6EEF0]"><div className="flex items-center justify-between gap-2 border-b border-[#EEF3F4] p-2.5"><b className="text-[13.5px]">Tanlangan mahsulotlar ({chosen.length} ta)</b><Btn size="sm" variant="outline" onClick={() => (mobile ? setPick(true) : setStep(1))}>Mahsulotlarni o‘zgartirish</Btn></div>{chosen.map((p) => <div key={p.id} className="flex items-center gap-2.5 border-b border-[#EEF3F4] p-2 last:border-0"><ProductThumb src={p.image_url} className="h-9 w-11 shrink-0" /><div className="min-w-0 flex-1"><div className="truncate text-[12.5px]">{p.name}</div><div className="text-[11px] text-[#5C6E80]">{p.unit || ''}</div></div><b className="text-[12.5px] text-[#0F766E]">{som(p.price)}</b><button type="button" aria-label="Olib tashlash" onClick={() => toggleP(p.id)} className="p-1.5"><Trash2 className="size-4" /></button></div>)}{!chosen.length && <p className="p-3 text-[12.5px] text-[#5C6E80]">Mahsulot tanlanmagan.</p>}</div>
  const budget = <div className="space-y-3">
    <div className="grid gap-3 md:grid-cols-2">
      <div><L>Kunlik byudjet *</L><div className="relative"><Input type="number" min="10000" step="1000" value={v.daily_budget} onChange={set('daily_budget')} placeholder="Masalan: 50 000" className="pr-12" /><span className="absolute inset-y-0 right-3 grid place-items-center text-[12.5px] text-[#5C6E80]">so‘m</span></div><p className="mt-1 text-[11.5px] text-[#5C6E80]">Reklamangiz har kuni shu summagacha sarflanadi.</p></div>
      <div><L>Umumiy byudjet *</L><div className="relative"><Input type="number" min="50000" step="1000" value={v.total_budget} onChange={set('total_budget')} placeholder="Masalan: 1 500 000" className="pr-12" /><span className="absolute inset-y-0 right-3 grid place-items-center text-[12.5px] text-[#5C6E80]">so‘m</span></div><p className="mt-1 text-[11.5px] text-[#5C6E80]">Kamida 50 000 so‘m. Tugagach, kampaniya avtomatik yakunlanadi.</p></div>
      <div><L>Boshlanish sanasi *</L><Input icon={CalendarDays} type="date" min={edit ? undefined : today()} value={v.starts_on} onChange={set('starts_on')} /></div>
      <div><L>Tugash sanasi *</L><Input icon={CalendarDays} type="date" min={v.starts_on} value={v.ends_on} onChange={set('ends_on')} /></div>
    </div>
    <div><L>Ko‘rsatish hududi *</L><span className="relative block"><MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 size-[18px] -translate-y-1/2 text-[#0F766E]" /><Select value={v.region} onChange={set('region')} options={REGIONS} className="[&_select]:pl-10" /></span><p className="mt-1 text-[11.5px] text-[#5C6E80]">Reklamangiz tanlangan hududdagi foydalanuvchilarga ko‘rsatiladi.</p></div>
  </div>
  const note = <div className="flex gap-2.5 rounded-xl bg-[#F0FDFA] p-3 text-[12.5px]"><Info className="size-5 shrink-0 text-[#0F766E]" /><div><b>Kampaniya moderatsiyadan so‘ng ishga tushadi.</b><div className="text-[#5C6E80]">Har bir haqiqiy bosish uchun reklama balansidan 1 000 so‘m yechiladi; kunlik va umumiy byudjetdan oshmaydi. Balans “To‘ldirish so‘rovi” orqali (naqd yoki bank o‘tkazma) to‘ldiriladi.</div></div></div>
  const off = ratio && Math.abs(ratio - BANNER.ratio) / BANNER.ratio > 0.2
  const isBanner = v.kind === 'banner'
  const imageField = <div><L>Banner rasmi {isBanner ? '*' : '(ixtiyoriy)'}</L>
    <div className="flex items-center gap-3">
      {v.image_url ? <img src={v.image_url} alt="" onLoad={(e) => setRatio(e.target.naturalWidth / (e.target.naturalHeight || 1))} className="aspect-[3/1] w-36 shrink-0 rounded-lg border border-[#E6EEF0] object-cover" /> : <span className="grid aspect-[3/1] w-36 shrink-0 place-items-center rounded-lg border border-dashed border-[#CCE3E0] text-[#8A98A5]"><ImagePlus className="size-6" /></span>}
      <div className="min-w-0 flex-1 text-[11.5px] text-[#5C6E80]">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#0F766E] px-3 py-1.5 text-[12.5px] font-semibold text-[#0F766E] hover:bg-[#F0FDFA]">{upl ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}{v.image_url ? 'Almashtirish' : 'Rasm yuklash'}<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onImage} disabled={upl} /></label>
        {v.image_url && <button type="button" onClick={() => { setV((x) => ({ ...x, image_url: '' })); setRatio(null) }} className="ml-2 text-[12px] text-[#B42318]">Olib tashlash</button>}
        <div className="mt-1">Tavsiya: <b>1200×400 px (3:1)</b>, JPG/PNG/WEBP, {BANNER.maxMB} MB gacha.{isBanner ? '' : ' Rasm bo‘lmasa, mahsulot rasmi ishlatiladi.'}</div>
      </div>
    </div>
    {off && <div className="mt-2 flex gap-2 rounded-lg bg-[#FFF7E6] p-2 text-[12px] text-[#7A4B00]"><Info className="size-4 shrink-0" />Rasm nisbati {ratio.toFixed(2).replace('.', ',')}:1 — tavsiya etilgan 3:1 dan ancha farq qiladi. Chetlari kesiladi, quyidagi ko‘rinishni tekshiring.</div>}
  </div>
  const cnt = (x, m) => <span className={`float-right text-[11px] font-normal ${x.length > m ? 'text-[#B42318]' : 'text-[#8A98A5]'}`}>{x.length}/{m}</span>
  const bannerFields = isBanner && <div className="space-y-3 rounded-xl border border-[#E6EEF0] p-3">
    <div className="text-[13.5px] font-bold">Banner matni</div>
    <div><L>Sarlavha * {cnt(v.headline, 50)}</L><Input value={v.headline} onChange={set('headline')} maxLength={50} placeholder="Masalan: Osstem implantlari — 15% chegirma" /></div>
    <div><L>Qisqa matn (ixtiyoriy) {cnt(v.body_text, 100)}</L><Input value={v.body_text} onChange={set('body_text')} maxLength={100} placeholder="Masalan: Noyabr davomida maxsus narx" /></div>
    <div><L>Tugma yozuvi {cnt(v.cta_text || '', 20)}</L><Input value={v.cta_text} onChange={set('cta_text')} maxLength={20} placeholder="Ko‘rish" /></div>
  </div>
  const shop = settings?.shop_name || ''
  const preview = <div data-testid="ad-preview" className="rounded-xl border border-[#E6EEF0] bg-[#F8FBFB] p-3">
    <div className="mb-2 flex items-center gap-1.5 text-[13.5px] font-bold"><Info className="size-4 text-[#0F766E]" />Xaridorga shunday ko‘rinadi</div>
    {isBanner ? <div className="space-y-2">
      {!mobile && <><div className="text-[11.5px] text-[#5C6E80]">Kompyuter (3:1)</div><BannerView image={v.image_url || chosen[0]?.image_url} headline={v.headline} text={v.body_text} cta={v.cta_text} shop={shop} /></>}
      <div className="text-[11.5px] text-[#5C6E80]">Telefon (2:1)</div>
      <div className="max-w-[360px]"><BannerView mobile image={v.image_url || chosen[0]?.image_url} headline={v.headline} text={v.body_text} cta={v.cta_text} shop={shop} /></div>
    </div> : <div>
      <div className="mb-2 text-[11.5px] text-[#5C6E80]">{v.kind === 'kategoriya' ? 'Kategoriya sahifasida “Tavsiya etiladi” qatorida' : 'Qidiruv natijalarida eng tepada (ko‘pi bilan 2 ta)'}</div>
      <div className="flex gap-2 overflow-x-auto pb-1">{(chosen.length ? chosen.slice(0, 3) : [null]).map((p, k) => <SponsoredCardView key={p?.id || k} product={p} shop={shop} />)}</div>
    </div>}
  </div>
  const reModerate = edit?.approved_at && <div className="flex gap-2 rounded-xl bg-[#FFF7E6] p-3 text-[12.5px] text-[#7A4B00]"><Info className="size-4 shrink-0" />Nom, tavsif, rasm, banner matni, mahsulotlar, tur yoki hududni o‘zgartirsangiz, kampaniya qayta moderatsiyaga yuboriladi.</div>
  const d = daysBetween(v.starts_on, v.ends_on)
  const summary = <div className="space-y-3">
    <div><L>Kampaniya nomi *</L><Input value={v.title} onChange={set('title')} placeholder="Masalan: Implantlar reklama kampaniyasi" maxLength={80} /></div>
    <div><L>Izoh (ixtiyoriy)</L><Textarea value={v.description} onChange={set('description')} maxLength={300} className="min-h-[60px]" placeholder="Kampaniya maqsadi haqida qisqacha" /></div>
    <div className="rounded-xl border border-[#E6EEF0] text-[13px]">{[['Turi', CKIND[v.kind]?.[1]], ['Mahsulotlar', `${chosen.length} ta`], ['Kunlik byudjet', som(v.daily_budget)], ['Umumiy byudjet', v.total_budget ? som(v.total_budget) : '—'], ['Muddat', d ? `${v.starts_on.split('-').reverse().join('.')} – ${v.ends_on.split('-').reverse().join('.')} (${d} kun)` : '—'], ['Hudud', v.region], ['Maksimal xarajat', d ? som(Math.min(Number(v.total_budget) || Infinity, Number(v.daily_budget) * d)) : '—']].map(([l, x]) => <div key={l} className="flex justify-between gap-3 border-b border-[#EEF3F4] px-3 py-2 last:border-0"><span className="text-[#5C6E80]">{l}</span><b className="text-right">{x}</b></div>)}</div>
    {imageField}
    {bannerFields}
    {preview}
    {reModerate}
    {note}
  </div>

  if (mobile) {
    const first = chosen[0]
    return <>
      <Modal open={open && !pick} onClose={onClose} full title={edit ? 'Kampaniyani tahrirlash' : 'Kampaniya yaratish'} subtitle="Mahsulotingizni ko‘proq mijozlarga yetkazing." footer={<div className="grid grid-cols-2 gap-3"><Btn variant="outline" icon={X} onClick={onClose}>Bekor qilish</Btn><Btn icon={edit ? Check : Plus} disabled={a.busy || upl} onClick={save}>{edit ? 'Saqlash' : 'Moderatsiyaga yuborish'}</Btn></div>}>
        <div className="space-y-4">
          <div><L>Kampaniya nomi</L><Input value={v.title} onChange={set('title')} placeholder="Masalan: Implantlar reklama kampaniyasi" maxLength={80} /></div>
          <div><L>Reklama turi</L><Select value={v.kind} onChange={set('kind')} options={CKINDS.map((k) => [k[0], k[1]])} /></div>
          <div><L>Mahsulot tanlash</L><button type="button" onClick={() => setPick(true)} className="flex w-full items-center gap-3 rounded-xl border border-[#DCE5E7] p-2.5 text-left">{first ? <><ProductThumb src={first.image_url} className="h-[70px] w-[84px] shrink-0" /><div className="min-w-0 flex-1"><div className="truncate text-[14px] font-bold">{first.name}{chosen.length > 1 && <span className="font-normal text-[#5C6E80]"> +{chosen.length - 1}</span>}</div><div className="text-[12px] text-[#5C6E80]">Mavjud: {first.stock} {first.unit || 'dona'}</div><div className="text-[14px] font-bold">{som(first.price)}</div></div></> : <span className="flex-1 py-3 text-[14px] text-[#8A98A5]">Mahsulotni tanlang</span>}<ChevronRight className="size-5" /></button></div>
          <div><L>Joylashuv</L><span className="relative block"><MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 size-[18px] -translate-y-1/2 text-[#0F766E]" /><Select value={v.region} onChange={set('region')} options={REGIONS} className="[&_select]:pl-10" /></span></div>
          <div><L>Kunlik byudjet (so‘m)</L><Input type="number" min="10000" value={v.daily_budget} onChange={set('daily_budget')} placeholder="Masalan: 100 000" /></div>
          <div><L>Umumiy byudjet (so‘m)</L><Input type="number" min="50000" value={v.total_budget} onChange={set('total_budget')} placeholder="Kamida 50 000" /></div>
          <div><L>Boshlanish sanasi</L><Input icon={CalendarDays} type="date" min={edit ? undefined : today()} value={v.starts_on} onChange={set('starts_on')} /></div>
          <div><L>Tugash sanasi</L><Input icon={CalendarDays} type="date" min={v.starts_on} value={v.ends_on} onChange={set('ends_on')} /></div>
          {imageField}
          {bannerFields}
          {preview}
          {reModerate}
          {note}
          <Err>{a.error}</Err>
        </div>
      </Modal>
      <Modal open={open && pick} onClose={() => setPick(false)} full title="Mahsulot tanlash" subtitle={`${chosen.length} ta tanlandi`} footer={<Btn className="w-full" onClick={() => setPick(false)}>Tayyor</Btn>}>{picker}</Modal>
    </>
  }
  return (
    <Modal open={open} onClose={onClose} full width="max-w-[680px]" title={edit ? 'Kampaniyani tahrirlash' : 'Reklama kampaniyasi yaratish'} subtitle="Mahsulotingizni ko‘proq mijozlarga yetkazing."
      footer={<div className="flex items-center justify-between gap-3">{step > 0 ? <Btn variant="outline" icon={ChevronLeft} onClick={() => { a.setError(''); setStep(step - 1) }}>Ortga</Btn> : <span />}<div className="flex gap-3"><Btn variant="gray" onClick={onClose}>Bekor qilish</Btn>{step < 3 ? <Btn onClick={next}>Keyingi<ChevronRight className="size-[18px]" /></Btn> : <Btn icon={Check} disabled={a.busy || upl} onClick={save}>{edit ? 'Saqlash' : 'Moderatsiyaga yuborish'}</Btn>}</div></div>}>
      <div className="mb-4 grid grid-cols-4">{STEPS.map(([t, s], i) => <button key={t} type="button" onClick={() => { if (i <= step || !check(i - 1)) { a.setError(''); setStep(i) } }} className="relative text-center">{i > 0 && <span className={`absolute right-1/2 top-[15px] h-0.5 w-[calc(100%-36px)] -translate-x-[18px] ${i <= step ? 'bg-[#0F766E]' : 'bg-[#CCE3E0]'}`} />}<span className={`relative mx-auto grid size-[30px] place-items-center rounded-full border text-[13px] font-semibold ${i === step ? 'border-[#0F766E] bg-[#0F766E] text-white' : i < step ? 'border-[#0F766E] bg-[#F0FDFA] text-[#0F766E]' : 'border-[#CCE3E0] bg-white text-[#5C6E80]'}`}>{i < step ? <Check className="size-4" /> : i + 1}</span><div className="mt-1 text-[12.5px] font-semibold">{t}</div><div className="text-[11px] text-[#5C6E80]">{s}</div></button>)}</div>
      <h3 className="text-[15px] font-bold">{STEPS[step][0]}</h3>
      <p className="mb-3 text-[12.5px] text-[#5C6E80]">{['Reklamangiz qayerda ko‘rsatilishini tanlang.', 'Reklama qilinadigan mahsulotlarni belgilang.', 'Reklamangiz uchun byudjet, muddat va ko‘rsatish hududini belgilang.', 'Kampaniyaga nom bering va ma’lumotlarni tekshiring.'][step]}</p>
      {step === 0 && kinds}
      {step === 1 && picker}
      {step === 2 && <div className="space-y-3">{budget}{chosenList}{note}</div>}
      {step === 3 && summary}
      <div className="mt-3"><Err>{a.error}</Err></div>
    </Modal>
  )
}
