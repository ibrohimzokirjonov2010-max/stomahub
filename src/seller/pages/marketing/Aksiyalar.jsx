import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Flame, ExternalLink, Pencil, Trash2, ImagePlus, X, Pause, Play } from 'lucide-react'
import { supabase } from '../../../supabaseClient'
import { useSession } from '../../../sessionStore'
import { useSellerData, uid, useAsync } from '../../api'
import { dmy, som } from '../../format'
import { card, PageHead, Btn, Input, Select, Badge, Err, Fab, Field, Tabs, toast } from '../../components/ui'
import Empty from '../../components/shell/Empty'
import Modal from '../../components/shell/Modal'
import ProductThumb from '../../components/bosh-sahifa/ProductThumb'
import { today } from '../../components/chegirmalar/constants'
import { aksiyaError, BANNER_MAX_MB, BANNER_TYPES, statusOf, TITLE_MAX, toRow, validateAksiya } from '../../../lib/aksiya'

const missingTable = (e) => e && (e.code === '42P01' || e.code === 'PGRST205' || /relation .*seller_promotions/.test(e.message || ''))

function usePromotions() {
  const me = useSession().user?.id
  const [st, setSt] = useState({ loading: true, rows: [], unavailable: false, error: '' })
  const load = useCallback(async () => {
    if (import.meta.env.DEV && window.__shotPromos) { setSt({ loading: false, rows: window.__shotPromos, unavailable: false, error: '' }); return }
    if (!supabase || !me) { setSt({ loading: false, rows: [], unavailable: false, error: 'Avval kiring' }); return }
    const { data, error } = await supabase.from('seller_promotions').select('*').eq('seller_id', me).order('created_at', { ascending: false })
    if (error) setSt({ loading: false, rows: [], unavailable: missingTable(error), error: missingTable(error) ? '' : aksiyaError(error) })
    else setSt({ loading: false, rows: data || [], unavailable: false, error: '' })
  }, [me])
  useEffect(() => { load() }, [load])
  return { ...st, reload: load }
}

/** Banner → public 'avatars' bucket, `${uid}/aksiya/...` (o‘z papkasi — Storage RLS). */
async function uploadBanner(file) {
  const me = uid()
  const ext = /png$/i.test(file.type) ? 'png' : /webp$/i.test(file.type) ? 'webp' : 'jpg'
  const path = `${me}/aksiya/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from('avatars').upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw new Error('Bannerni yuklab bo‘lmadi. Qayta urinib ko‘ring.')
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
}

const offOf = (r) => (r.scope === 'all' ? Number(r.percent) || 0 : r.old_price > 0 ? Math.round((1 - r.price / r.old_price) * 100) : 0)

export default function Aksiyalar() {
  const data = useSellerData()
  const promo = usePromotions()
  const [form, setForm] = useState(null) // null | {} (yangi) | row (tahrir)
  const [del, setDel] = useState(null)
  const byId = useMemo(() => Object.fromEntries(data.products.map((p) => [p.id, p])), [data.products])
  const toggle = async (r) => {
    const { error } = await supabase.from('seller_promotions').update({ active: !r.active }).eq('id', r.id).eq('seller_id', uid())
    toast(error ? aksiyaError(error) : r.active ? 'Aksiya to‘xtatildi' : 'Aksiya qayta yoqildi'); promo.reload()
  }
  const remove = async () => {
    const r = del
    const { error } = await supabase.from('seller_promotions').delete().eq('id', r.id).eq('seller_id', uid())
    setDel(null)
    toast(error ? aksiyaError(error) : 'Aksiya o‘chirildi'); promo.reload()
  }
  const busyIds = promo.rows.filter((r) => r.active && r.ends_on >= today() && r.product_id).map((r) => r.product_id)
  const add = <Btn icon={Plus} disabled={promo.unavailable} onClick={() => setForm({})}>Aksiya yaratish</Btn>
  return (
    <div className="mx-auto max-w-[1100px] pb-[max(16px,env(safe-area-inset-bottom))]">
      <PageHead title="Aksiyalar" subtitle="O‘z aksiyangizni yarating — u saytdagi “Aksiyalar” bo‘limida ko‘rinadi" back="/sotuvchi/marketing" action={add} />
      <Err>{promo.error}</Err>
      <div className={`${card} overflow-hidden`}>
        {promo.loading ? <div className="p-6 text-center text-[13px] text-[#5C6E80]">Yuklanmoqda...</div>
          : promo.unavailable ? <Empty icon={Flame} title="Aksiyalar tez orada ishga tushadi" text="Bu bo‘lim hozircha sozlanmoqda. Tayyor bo‘lgach, aksiyalaringizni shu yerdan yarata olasiz." />
          : !promo.rows.length ? <Empty icon={Flame} title="Hali aksiya yo‘q" text="Bitta mahsulotga yoki do‘koningizdagi barcha mahsulotlarga chegirma va muddat belgilang." action={<div className="mt-4">{add}</div>} />
          : <ul className="divide-y divide-[#EEF3F4]">
            {promo.rows.map((r) => {
              const p = byId[r.product_id]
              const [sl, tone] = statusOf(r, today())
              const expired = r.ends_on < today()
              return (
                <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  {r.banner_url ? <img src={r.banner_url} alt="" className="h-11 w-16 shrink-0 rounded-lg object-cover" />
                    : r.scope === 'all' ? <span className="grid h-11 w-16 shrink-0 place-items-center rounded-lg bg-[#F0FDFA] text-[#0F766E]"><Flame className="size-5" /></span>
                    : <ProductThumb src={p?.image_url} className="h-11 w-16 shrink-0" />}
                  <div className="min-w-0 flex-1 basis-[200px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="min-w-0 truncate font-semibold">{r.title || p?.name || 'Mahsulot'}</span>
                      <Badge tone={tone} dot>{sl}</Badge>
                    </div>
                    <div className="mt-0.5 text-[12.5px] text-[#5C6E80]">
                      {r.scope === 'all' ? <>Barcha mahsulotlar · <b className="text-[#0F766E]">−{offOf(r)}%</b></>
                        : <>{r.title && p?.name ? `${p.name} · ` : ''}<b className="text-[#0F766E]">{som(r.price)}</b> <s>{som(r.old_price)}</s> · −{offOf(r)}%</>}
                      {' · '}{dmy(r.starts_on)} – {dmy(r.ends_on)}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {!expired && <Btn size="sm" variant="soft" icon={r.active ? Pause : Play} onClick={() => toggle(r)}>{r.active ? 'To‘xtatish' : 'Yoqish'}</Btn>}
                    <button type="button" aria-label="Tahrirlash" onClick={() => setForm(r)} className="grid size-9 place-items-center rounded-lg text-[#0F766E] hover:bg-[#F0FDFA]"><Pencil className="size-[18px]" /></button>
                    <button type="button" aria-label="O‘chirish" onClick={() => setDel(r)} className="grid size-9 place-items-center rounded-lg text-[#B42318] hover:bg-[#FEF3F2]"><Trash2 className="size-[18px]" /></button>
                  </div>
                </li>
              )
            })}
          </ul>}
      </div>
      <Link to="/aksiyalar" className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#0F766E]"><ExternalLink className="size-4" />Saytdagi Aksiyalar sahifasi</Link>
      {!promo.unavailable && <Fab icon={Plus} onClick={() => setForm({})}>Aksiya</Fab>}
      {form && <PromoForm row={form.id ? form : null} products={data.products.filter((p) => p.status === 'active' || p.id === form.product_id)}
        busyIds={busyIds.filter((x) => x !== form.product_id)} onClose={() => setForm(null)} onSaved={promo.reload} />}
      {del && (
        <Modal open onClose={() => setDel(null)} title="Aksiyani o‘chirish"
          footer={<div className="flex justify-end gap-2 pb-[env(safe-area-inset-bottom)]"><Btn variant="gray" onClick={() => setDel(null)}>Bekor qilish</Btn><Btn className="!bg-[#B42318]" onClick={remove}>O‘chirish</Btn></div>}>
          <p className="pb-2 text-[14px] text-[#3D4E5F]">“{del.title || byId[del.product_id]?.name || 'Aksiya'}” butunlay o‘chiriladi va saytdan olib tashlanadi. Vaqtincha yashirish uchun “To‘xtatish”ni tanlang.</p>
        </Modal>
      )}
    </div>
  )
}

export function PromoForm({ row, products, busyIds, onClose, onSaved, initial }) {
  const a = useAsync()
  const free = products.filter((p) => !busyIds.includes(p.id))
  const [v, setV] = useState(() => initial || (row ? {
    scope: row.scope || 'product', product_id: row.product_id || '', title: row.title || '', banner_url: row.banner_url || '',
    mode: row.scope !== 'all' && !row.percent ? 'price' : 'percent', percent: row.percent ?? (row.old_price ? Math.round((1 - row.price / row.old_price) * 100) : ''),
    price: row.price || '', starts_on: row.starts_on, ends_on: row.ends_on, file: null,
  } : { scope: 'product', product_id: free[0]?.id || '', title: '', banner_url: '', mode: 'percent', percent: '', price: '', starts_on: today(), ends_on: '', file: null }))
  const [errs, setErrs] = useState({})
  const [preview, setPreview] = useState('')
  const fileRef = useRef(null)
  useEffect(() => {
    if (!v.file) { setPreview(''); return undefined }
    const u = URL.createObjectURL(v.file); setPreview(u)
    return () => URL.revokeObjectURL(u)
  }, [v.file])
  const set = (k) => (e) => setV((x) => ({ ...x, [k]: e?.target ? e.target.value : e }))
  const p = v.scope === 'product' ? products.find((x) => x.id === v.product_id) : null
  const pct = Number(v.percent)
  const newPrice = p ? (v.mode === 'price' ? Number(String(v.price).replace(/\D/g, '')) : Math.round(Number(p.price) * (1 - pct / 100))) : 0
  const pickFile = (e) => {
    const f = e.target.files?.[0]; e.target.value = ''
    if (!f) return
    if (!BANNER_TYPES.includes(f.type)) { setErrs((x) => ({ ...x, banner: 'Faqat JPG, PNG yoki WEBP rasm yuklang' })); return }
    if (f.size > BANNER_MAX_MB * 1024 * 1024) { setErrs((x) => ({ ...x, banner: `Rasm ${BANNER_MAX_MB} MB dan oshmasin` })); return }
    setErrs((x) => ({ ...x, banner: '' })); setV((x) => ({ ...x, file: f }))
  }
  const save = () => {
    const e = validateAksiya(v, p, today())
    setErrs(e)
    if (Object.keys(e).length) return a.setError('Maydonlarni tekshiring')
    a.go(async () => {
      try {
        const banner = v.file ? await uploadBanner(v.file) : v.banner_url
        const body = toRow({ ...v, banner_url: banner }, p)
        const q = row
          ? supabase.from('seller_promotions').update(body).eq('id', row.id).eq('seller_id', uid())
          : supabase.from('seller_promotions').insert({ ...body, seller_id: uid(), active: true })
        const { error } = await q
        return error ? { ok: false, error: aksiyaError(error) } : { ok: true }
      } catch (err) { return { ok: false, error: aksiyaError(err) } }
    }, () => { toast(row ? 'Aksiya yangilandi' : 'Aksiya yaratildi'); onSaved(); onClose() })
  }
  const E = ({ k }) => (errs[k] ? <span className="mt-1 block text-[12px] text-[#B42318]">{errs[k]}</span> : null)
  const banner = preview || v.banner_url
  const noProducts = v.scope === 'product' && !free.length
  return (
    <Modal open full width="max-w-[640px]" onClose={onClose} title={row ? 'Aksiyani tahrirlash' : 'Yangi aksiya'} subtitle="Aksiya saytdagi “Aksiyalar” bo‘limida ko‘rinadi"
      footer={<div className="flex justify-end gap-2 pb-[env(safe-area-inset-bottom)]"><Btn variant="gray" onClick={onClose}>Bekor qilish</Btn><Btn onClick={save} disabled={a.busy || noProducts}>{a.busy ? 'Saqlanmoqda...' : row ? 'Saqlash' : 'Aksiyani e’lon qilish'}</Btn></div>}>
      <div className="space-y-4 pb-2 pt-2">
        <div role="group" aria-label="Aksiya turi"><span className="mb-1.5 block text-[13px] font-medium text-[#10283F]">Aksiya turi</span>
          <Tabs value={v.scope} onChange={(s) => !row && setV((x) => ({ ...x, scope: s, mode: s === 'all' ? 'percent' : x.mode }))}
            tabs={[['product', 'Bitta mahsulot'], ['all', 'Barcha mahsulotlarim']]} />
          {row && <span className="mt-1 block text-[11.5px] text-[#6B7A88]">Turini o‘zgartirib bo‘lmaydi — yangi aksiya yarating.</span>}
        </div>
        <Field label="Aksiya nomi" required={v.scope === 'all'} hint={`${String(v.title).length}/${TITLE_MAX}`}>
          <Input value={v.title} maxLength={TITLE_MAX} onChange={set('title')} placeholder="Masalan: Kuzgi chegirmalar" />
          <E k="title" />
        </Field>
        {v.scope === 'product' && (noProducts
          ? <Empty icon={Flame} title="Mos mahsulot yo‘q" text="Aksiyaga faqat sotuvdagi (faol) va hali aksiyada bo‘lmagan mahsulotlarni qo‘shish mumkin." />
          : <>
            <Field label="Mahsulot" required>
              <Select value={v.product_id} onChange={set('product_id')} options={(row ? products : free).map((x) => [x.id, `${x.name} — ${som(x.price)}`])} placeholder="Mahsulotni tanlang" />
              <E k="product_id" />
            </Field>
            <div role="group" aria-label="Chegirma usuli"><span className="mb-1.5 block text-[13px] font-medium text-[#10283F]">Chegirma usuli</span>
              <Tabs value={v.mode} onChange={set('mode')} tabs={[['percent', 'Foiz (%)'], ['price', 'Yangi narx']]} />
            </div>
          </>)}
        {v.mode === 'percent' || v.scope === 'all'
          ? <Field label="Chegirma foizi" required hint="1 dan 90 gacha"><Input type="number" inputMode="numeric" min="1" max="90" value={v.percent} onChange={set('percent')} placeholder="Masalan: 20" /><E k="percent" /></Field>
          : <Field label="Aksiya narxi (so‘m)" required hint={p ? `Hozirgi narx: ${som(p.price)}` : ''}><Input inputMode="numeric" value={v.price} onChange={(e) => setV((x) => ({ ...x, price: e.target.value.replace(/\D/g, '').slice(0, 12) }))} placeholder="Masalan: 150000" /><E k="price" /></Field>}
        {p && newPrice > 0 && newPrice < Number(p.price) && <div className="rounded-xl bg-[#F0FDFA] px-3.5 py-2.5 text-[13.5px]">Aksiya narxi: <b className="text-[#0F766E]">{som(newPrice)}</b> <s className="text-[#5C6E80]">{som(p.price)}</s> · −{Math.round((1 - newPrice / p.price) * 100)}%</div>}
        {v.scope === 'all' && pct >= 1 && pct <= 90 && <div className="rounded-xl bg-[#F0FDFA] px-3.5 py-2.5 text-[13.5px]">Do‘koningizdagi barcha sotuvdagi mahsulotlar narxi <b className="text-[#0F766E]">{pct}%</b> arzonlashadi.</div>}
        <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
          <Field label="Boshlanish" required><Input type="date" value={v.starts_on} min={row ? undefined : today()} onChange={set('starts_on')} /></Field>
          <Field label="Tugash" required><Input type="date" value={v.ends_on} min={v.starts_on || today()} onChange={set('ends_on')} /><E k="ends_on" /></Field>
        </div>
        <Field label="Banner (ixtiyoriy)" hint={`JPG, PNG yoki WEBP, ${BANNER_MAX_MB} MB gacha. Tavsiya: 1200×400`}>
          {banner ? (
            <span className="relative block overflow-hidden rounded-xl border border-[#DCE5E7]">
              <img src={banner} alt="Banner" className="h-[120px] w-full object-cover sm:h-[150px]" />
              <button type="button" aria-label="Bannerni olib tashlash" onClick={(e) => { e.preventDefault(); setV((x) => ({ ...x, file: null, banner_url: '' })) }}
                className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-white/95 text-[#10283F] shadow"><X className="size-4" /></button>
            </span>
          ) : (
            <button type="button" onClick={(e) => { e.preventDefault(); fileRef.current?.click() }}
              className="flex h-[96px] w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[#9FC7C2] bg-[#F7FBFB] text-[13px] font-medium text-[#0F766E]">
              <ImagePlus className="size-6" /> Rasm yuklash
            </button>
          )}
          <input ref={fileRef} type="file" accept={BANNER_TYPES.join(',')} className="hidden" onChange={pickFile} />
          <E k="banner" />
        </Field>
        <Err>{a.error}</Err>
      </div>
    </Modal>
  )
}
