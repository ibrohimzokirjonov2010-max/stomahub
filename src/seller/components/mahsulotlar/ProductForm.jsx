import { useEffect, useRef, useState } from 'react'
import { CloudUpload, Plus, X, Trash2, Info, Send, Camera, Save, FileText } from 'lucide-react'
import Modal from '../shell/Modal'
import { Btn, Field, Input, Select, Textarea, Toggle, Err, toast } from '../ui'
import { insertRow, updateRow, uploadMedia, logActivity, useAsync } from '../../api'
import { useMobile } from '../../../useMobile'
import {
  BRANDS, COUNTRIES, SHADES, SIZES, ENDO_SIZES, ENDO_TAPERS, ENDO_LENGTHS, VARIANT_TYPES, UOMS, DOC_TYPES, STORAGE_TEMPS,
  SPEC_PRESETS, REORDER_INTERVALS, categoryOptions, normCategory, variantLabel, cleanTiers,
} from '../../../config/productCatalog'

// columns added by migration 0029 (form keeps working if it is not applied yet)
const NEW_COLS = ['clinical_use', 'delivery_info', 'reorder', 'variant_type', 'uom', 'min_qty', 'price_tiers', 'reg_cert_no', 'lot_no', 'storage_temp']
const blank = {
  name: '', category: '', brand: '', country: '', description: '', price: '', stock: '', sku: '', expires_on: '', unit: '', images: [], variants: [], documents: [],
  specs: [], clinical_use: '', delivery_info: '', reorder_enabled: false, reorder_days: 30, variant_type: 'rang', uom: 'dona', min_qty: '1', price_tiers: [],
  reg_cert_no: '', lot_no: '', storage_temp: '',
}
const toNum = (v) => Number(String(v ?? '').replace(/\s/g, '')) || 0
const sec = 'mt-5 border-t border-[#E6EEF0] pt-4'
const h = 'text-[15px] font-bold text-[#0F766E]'
const sub = 'text-[12px] text-[#5C6E80]'
const cell = 'h-[38px] rounded-lg border border-[#DCE5E7] px-2 text-[13px] outline-none focus:border-[#0F766E]'
const VAR_DEFAULTS = { rang: { color: 'A2' }, olcham: { size: 'M' }, endo: { size: '#25', taper: '.04', length: '25 mm' }, implant: { diameter: '4.0', length: '10' }, custom: { name: '' } }
const newVariant = (type, price) => ({ ...(VAR_DEFAULTS[type] || {}), price, stock: '', sku: '' })

export function fromProduct(product) {
  if (!product) return blank
  const reorder = product.reorder && typeof product.reorder === 'object' ? product.reorder : {}
  const vt = product.variant_type || 'rang'
  return {
    ...blank, ...product,
    category: normCategory(product.category),
    brand: product.brand || '', country: product.country || '', description: product.description || '', sku: product.sku || '', unit: product.unit || '',
    price: String(product.price ?? ''), stock: String(product.stock ?? ''), expires_on: product.expires_on || '',
    images: product.images?.length ? product.images : (product.image_url ? [product.image_url] : []),
    variants: (product.variants || []).map((x) => ({ ...x, price: String(x.price ?? ''), stock: String(x.stock ?? ''), sku: x.sku || '', ...(vt === 'custom' && !x.name ? { name: x.label || '' } : {}) })),
    documents: product.documents || [],
    specs: Array.isArray(product.specs) ? product.specs.filter((x) => Array.isArray(x) && x.length === 2) : [],
    clinical_use: product.clinical_use || '', delivery_info: product.delivery_info || '',
    reorder_enabled: !!reorder.enabled, reorder_days: Number(reorder.interval_days) || 30,
    variant_type: vt, uom: product.uom || 'dona', min_qty: String(product.min_qty || 1),
    price_tiers: (product.price_tiers || []).map((t) => ({ min_qty: String(t.min_qty), price: String(t.price) })),
    reg_cert_no: product.reg_cert_no || '', lot_no: product.lot_no || '', storage_temp: product.storage_temp || '',
  }
}

export function toRow(v) {
  const vt = v.variant_type
  const variants = v.variants.map((x) => {
    const label = variantLabel(x, vt)
    const clean = { ...x, type: vt, price: toNum(x.price) || toNum(v.price), stock: toNum(x.stock), label }
    clean.sku = String(x.sku || '').trim() || `${v.sku || 'V'}-${label}`.replace(/[\s×Ø#·.]+/g, '')
    if (vt === 'rang') clean.color = x.color
    return clean
  })
  return {
    name: v.name.trim(), category: normCategory(v.category), brand: v.brand.trim(), country: v.country, description: v.description.trim(), unit: v.unit.trim(),
    price: toNum(v.price) || (variants[0]?.price ?? 0), stock: variants.length ? variants.reduce((s, x) => s + x.stock, 0) : toNum(v.stock), sku: v.sku.trim(), expires_on: v.expires_on || null,
    images: v.images, image_url: v.images[0] || '', variants, documents: v.documents,
    specs: v.specs.map(([k, val]) => [String(k).trim(), String(val).trim()]).filter(([k, val]) => k && val),
    clinical_use: v.clinical_use.trim(), delivery_info: v.delivery_info.trim(),
    reorder: { enabled: !!v.reorder_enabled, interval_days: Number(v.reorder_days) || 30 },
    variant_type: vt, uom: v.uom || 'dona', min_qty: Math.max(1, Math.round(toNum(v.min_qty) || 1)), price_tiers: cleanTiers(v.price_tiers),
    reg_cert_no: v.reg_cert_no.trim(), lot_no: v.lot_no.trim(), storage_temp: v.storage_temp.trim(),
  }
}
const missingColumn = (e) => /column|schema cache|0029/i.test(String(e || ''))

export default function ProductForm({ open, onClose, product, onSaved }) {
  const [v, setV] = useState(blank)
  const [up, setUp] = useState(false)
  const { busy, error, setError, go } = useAsync()
  const fileRef = useRef(null)
  const docRef = useRef(null)
  const mobile = useMobile()
  useEffect(() => {
    if (!open) return
    setError('')
    setV(fromProduct(product))
  }, [open, product, setError])
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e?.target ? e.target.value : e }))
  const setVar = (i, k, val) => setV((s) => ({ ...s, variants: s.variants.map((x, j) => (j === i ? { ...x, [k]: val } : x)) }))
  const setList = (key, i, k, val) => setV((s) => ({ ...s, [key]: s[key].map((x, j) => (j === i ? (Array.isArray(x) ? x.map((y, n) => (n === k ? val : y)) : { ...x, [k]: val }) : x)) }))
  const hasVariants = v.variants.length > 0

  async function addFiles(files, kind) {
    setUp(true)
    for (const f of files) {
      if (kind === 'img' && !/^image\/(png|jpe?g|webp)$/.test(f.type)) { setError('Faqat JPG yoki PNG rasm'); continue }
      const r = await uploadMedia(f, kind === 'img' ? 'products' : 'docs')
      if (!r.ok) { setError(r.error); continue }
      if (kind === 'img') setV((s) => ({ ...s, images: [...s.images, r.url].slice(0, 10) }))
      else setV((s) => ({ ...s, documents: [...s.documents, { name: r.name, url: r.url, size: r.size, type: r.type, doc_type: DOC_TYPES[0], doc_no: '', at: new Date().toISOString() }] }))
    }
    setUp(false)
  }

  async function submit(asDraft) {
    if (!v.name.trim()) return setError('Mahsulot nomini kiriting')
    if (!asDraft) {
      if (!v.category) return setError('Kategoriyani tanlang')
      if (toNum(v.price) <= 0 && !hasVariants) return setError('Narxni kiriting')
      if (!v.sku.trim() && !mobile) return setError('SKU ni kiriting')
      if (hasVariants && v.variants.some((x) => !variantLabel(x, v.variant_type))) return setError('Har bir variant uchun qiymat kiriting')
      const bad = v.price_tiers.find((t) => toNum(t.min_qty) > 1 && toNum(t.price) >= toNum(v.price) && toNum(v.price) > 0)
      if (bad) return setError('Ulgurji narx oddiy narxdan past bo‘lishi kerak')
    }
    const row = toRow(v)
    if (product && !row.category) row.category = product.category // never wipe an existing category
    const save = (r) => (product ? updateRow('seller_products', product.id, r) : insertRow('seller_products', r))
    if (product) { if (asDraft === false && ['draft', 'rejected'].includes(product.status)) row.status = 'review' } else row.status = asDraft ? 'draft' : 'review'
    let res = await go(() => save(row))
    if (!res?.ok && missingColumn(res?.error)) {
      const legacy = { ...row }; NEW_COLS.forEach((k) => delete legacy[k])
      res = await go(() => save(legacy))
      if (res?.ok) toast('Saqlandi. Diqqat: yangi maydonlar uchun 0029 migratsiyasi hali qo‘llanmagan')
    }
    if (res?.ok) {
      logActivity(product ? 'Mahsulot tahrirlandi' : 'Mahsulot qo‘shildi', row.name)
      toast(product ? 'O‘zgarishlar saqlandi' : asDraft ? 'Qoralama saqlandi' : 'Mahsulot tekshiruvga yuborildi')
      onSaved?.(res.data); onClose()
    }
  }

  const editingLive = product && !['draft', 'rejected'].includes(product.status)
  const footer = (
    <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
      <div className="hidden flex-1 items-start gap-3 rounded-xl bg-[#F0FDFA] px-4 py-3 md:flex">
        <Info className="mt-0.5 size-5 shrink-0 text-[#0F766E]" />
        <div><div className="text-[13.5px] font-semibold text-[#10283F]">Komissiya 12%</div><div className="text-[12px] text-[#5C6E80]">Sotilgan har bir mahsulot uchun StomaHub komissiya sifatida 12% ni oladi. To‘lov faqat naqd.</div></div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:flex">
        <Btn variant="outline" icon={mobile ? X : undefined} onClick={onClose} className="h-12 md:w-[120px]">Bekor qilish</Btn>
        {!product && !mobile && <Btn variant="gray" disabled={busy || up} onClick={() => submit(true)} className="h-12">Qoralama</Btn>}
        <Btn icon={mobile ? Save : Send} disabled={busy || up} onClick={() => submit(false)} className="h-12 md:px-6">{busy ? 'Saqlanmoqda…' : editingLive ? 'Saqlash' : mobile ? 'Saqlash' : 'Tekshiruvga yuborish'}</Btn>
      </div>
    </div>
  )

  const vt = v.variant_type
  const varCols = {
    rang: [['color', 'Rang', (x, i) => <Select value={x.color || ''} onChange={(val) => setVar(i, 'color', val)} options={SHADES} className="w-[104px]" />]],
    olcham: [['size', 'O‘lcham', (x, i) => <Select value={x.size || ''} onChange={(val) => setVar(i, 'size', val)} options={SIZES} className="w-[96px]" />]],
    endo: [
      ['size', 'ISO #', (x, i) => <Select value={x.size || ''} onChange={(val) => setVar(i, 'size', val)} options={ENDO_SIZES} className="w-[96px]" />],
      ['taper', 'Taper', (x, i) => <Select value={x.taper || ''} onChange={(val) => setVar(i, 'taper', val)} options={ENDO_TAPERS} className="w-[100px]" />],
      ['length', 'Uzunlik', (x, i) => <Select value={x.length || ''} onChange={(val) => setVar(i, 'length', val)} options={ENDO_LENGTHS} className="w-[96px]" />],
    ],
    implant: [
      ['diameter', 'Diametr (mm)', (x, i) => <input inputMode="decimal" value={x.diameter || ''} onChange={(e) => setVar(i, 'diameter', e.target.value)} placeholder="4.0" className={`${cell} w-[80px]`} />],
      ['length', 'Uzunlik (mm)', (x, i) => <input inputMode="decimal" value={x.length || ''} onChange={(e) => setVar(i, 'length', e.target.value)} placeholder="10" className={`${cell} w-[80px]`} />],
    ],
    custom: [['name', 'Variant nomi', (x, i) => <input value={x.name || ''} onChange={(e) => setVar(i, 'name', e.target.value)} placeholder="Masalan: 4 g shprits" className={`${cell} w-[150px]`} />]],
  }[vt] || []

  return (
    <Modal open={open} onClose={onClose} full width="md:max-w-[960px]" title={product ? 'Mahsulotni tahrirlash' : 'Mahsulot qo‘shish'}
      subtitle={product ? 'Mahsulot ma’lumotlarini yangilang. Bo‘sh qoldirilgan bo‘limlar mahsulot sahifasida ko‘rinmaydi.' : 'Yangi mahsulotingiz haqida ma’lumotlarni kiriting.'} footer={footer}>
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={(e) => { addFiles([...e.target.files], 'img'); e.target.value = '' }} />
      <input ref={docRef} type="file" accept="application/pdf,image/*" hidden onChange={(e) => { addFiles([...e.target.files], 'doc'); e.target.value = '' }} />
      <datalist id="sh-brands">{BRANDS.map((b) => <option key={b} value={b} />)}</datalist>
      <datalist id="sh-spec-keys">{SPEC_PRESETS.map((b) => <option key={b} value={b} />)}</datalist>
      <datalist id="sh-temps">{STORAGE_TEMPS.map((b) => <option key={b} value={b} />)}</datalist>
      <div className="grid gap-6 md:grid-cols-[1fr_1fr] md:gap-0">
        {/* images */}
        <div className="md:border-r md:border-[#E6EEF0] md:pr-5">
          <div className="text-[15px] font-bold text-[#10283F] md:text-[14px] md:text-[#0F766E]">Mahsulot rasmlari <span className="text-[12px] font-normal text-[#5C6E80]">{v.images.length}/10</span></div>
          <div className="mb-2.5 text-[12px] text-[#5C6E80]">Asosiy rasm va qo‘shimcha rasmlarni yuklang.</div>
          <button type="button" onClick={() => fileRef.current?.click()} className="flex h-[88px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#99D5CE] bg-[#F0FDFA]">
            {mobile ? <Camera className="size-6 text-[#0F766E]" /> : <CloudUpload className="size-7 text-[#0F766E]" />}
            <span className="mt-1 text-[14px] font-semibold text-[#0F766E]">{up ? 'Yuklanmoqda…' : 'Rasm yuklash'}</span>
            <span className="text-[11.5px] text-[#5C6E80]">JPG yoki PNG, 10 MB gacha</span>
          </button>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {v.images.map((src, i) => <Thumb key={src} src={src} main={i === 0} onRemove={() => setV((s) => ({ ...s, images: s.images.filter((x) => x !== src) }))} />)}
          </div>
          <Field label="Tavsif" required className="mt-4"><Textarea value={v.description} onChange={(e) => set('description')(e.target.value.slice(0, 1000))} placeholder="Mahsulot haqida batafsil ma’lumot yozing..." /><span className="mt-1 block text-right text-[11.5px] text-[#5C6E80]">{v.description.length}/1000</span></Field>
        </div>
        {/* main info */}
        <div className="grid grid-cols-2 content-start gap-3 md:pl-5">
          <Field label="Mahsulot nomi" required className="col-span-2"><Input value={v.name} onChange={set('name')} placeholder="Mahsulot nomini kiriting..." /></Field>
          <Field label="Kategoriya" required><Select value={v.category} onChange={set('category')} options={categoryOptions(v.category)} placeholder="— Tanlang —" /></Field>
          <Field label="Brend" hint="Ro‘yxatdan tanlang yoki o‘zingiz yozing"><Input list="sh-brands" value={v.brand} onChange={set('brand')} placeholder="Masalan: Zhermack" /></Field>
          <Field label="Ishlab chiqaruvchi davlat"><Select value={v.country} onChange={set('country')} options={COUNTRIES} placeholder="— Tanlang —" /></Field>
          <Field label="Qadoq tarkibi" hint="Masalan: 2 × 50 ml, 4 g"><Input value={v.unit} onChange={set('unit')} placeholder="2 × 50 ml" /></Field>
        </div>
      </div>

      {/* pricing */}
      <div className={sec}>
        <div className={h}>Narx va xarid shartlari</div>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <Field label="Narx (so‘m)" required><Input inputMode="numeric" value={v.price} onChange={set('price')} placeholder="250 000" /></Field>
          <Field label="O‘lchov birligi"><Select value={v.uom} onChange={set('uom')} options={UOMS} /></Field>
          <Field label="Minimal buyurtma" hint={`${v.uom} hisobida`}><Input inputMode="numeric" value={v.min_qty} onChange={set('min_qty')} placeholder="1" /></Field>
          <Field label={`Qoldiq (${v.uom})`} required hint={hasVariants ? 'Variantlar bo‘yicha hisoblanadi' : ''}><Input inputMode="numeric" value={hasVariants ? sumStock(v.variants) : v.stock} disabled={hasVariants} onChange={set('stock')} placeholder="15" /></Field>
          <Field label="SKU" required={!mobile}><Input value={v.sku} onChange={set('sku')} placeholder="CMP-A3-001" /></Field>
          <Field label="Yaroqlilik muddati"><Input type="date" value={v.expires_on} onChange={set('expires_on')} /></Field>
        </div>
        <div className="mt-3 rounded-xl border border-[#E6EEF0] p-3">
          <div className="flex items-start justify-between gap-3">
            <div><div className="text-[13.5px] font-semibold text-[#10283F]">Ulgurji narxlar</div><div className={sub}>Ko‘p olganda arzonroq narx, masalan: 10 {v.uom} va undan ko‘p — 230 000 so‘m</div></div>
            <Btn variant="soft" icon={Plus} size="sm" onClick={() => setV((s) => ({ ...s, price_tiers: [...s.price_tiers, { min_qty: '10', price: '' }] }))}>Daraja qo‘shish</Btn>
          </div>
          {v.price_tiers.map((t, i) => (
            <div key={i} className="mt-2 flex flex-wrap items-center gap-2 text-[13px]">
              <input inputMode="numeric" value={t.min_qty} onChange={(e) => setList('price_tiers', i, 'min_qty', e.target.value)} className={`${cell} w-[80px]`} aria-label="Minimal miqdor" />
              <span>{v.uom} va undan ko‘p —</span>
              <input inputMode="numeric" value={t.price} onChange={(e) => setList('price_tiers', i, 'price', e.target.value)} placeholder="230 000" className={`${cell} w-[130px]`} aria-label="Narx" />
              <span>so‘m / {v.uom}</span>
              <button type="button" aria-label="O‘chirish" onClick={() => setV((s) => ({ ...s, price_tiers: s.price_tiers.filter((_, j) => j !== i) }))} className="rounded p-1 hover:bg-[#F0FDFA]"><Trash2 className="size-4" /></button>
            </div>
          ))}
        </div>
      </div>

      {/* variants */}
      <div className={sec}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><div className={h}>Variantlar</div><div className={sub}>Har bir variantning o‘z narxi, qoldig‘i va SKU si bo‘ladi.</div></div>
          <div className="flex items-center gap-2">
            <Select value={vt} onChange={(val) => setV((s) => ({ ...s, variant_type: val, variants: s.variants.length && val !== s.variant_type ? [] : s.variants }))} options={VARIANT_TYPES} className="w-[230px]" />
            <Btn variant="soft" icon={Plus} size="sm" onClick={() => setV((s) => ({ ...s, variants: [...s.variants, newVariant(s.variant_type, s.price)] }))}>Variant qo‘shish</Btn>
          </div>
        </div>
        {hasVariants && (
          <div className="mt-3 overflow-x-auto rounded-xl border border-[#E6EEF0]">
            <table className="w-full min-w-[640px]">
              <thead className="bg-[#F6FAFA] text-left text-[12px] text-[#3D4E5F]"><tr><th className="px-3 py-2">#</th>{varCols.map(([k, l]) => <th key={k}>{l}</th>)}<th>Narx (so‘m)</th><th>Qoldiq</th><th>SKU</th><th className="text-center">Amallar</th></tr></thead>
              <tbody>
                {v.variants.map((x, i) => (
                  <tr key={i} className="border-t border-[#EEF3F4]">
                    <td className="px-3 py-1.5 text-[13px] text-[#5C6E80]">{i + 1}</td>
                    {varCols.map(([k, , render]) => <td key={k} className="py-1.5 pr-2">{render(x, i)}</td>)}
                    <td className="py-1.5 pr-2"><input inputMode="numeric" value={x.price} onChange={(e) => setVar(i, 'price', e.target.value)} className={`${cell} w-[110px]`} /></td>
                    <td className="py-1.5 pr-2"><input inputMode="numeric" value={x.stock} onChange={(e) => setVar(i, 'stock', e.target.value)} className={`${cell} w-[64px]`} /></td>
                    <td className="py-1.5 pr-2"><input value={x.sku} onChange={(e) => setVar(i, 'sku', e.target.value)} placeholder="avtomatik" className={`${cell} w-[120px]`} /></td>
                    <td className="text-center"><button type="button" aria-label="O‘chirish" onClick={() => setV((s) => ({ ...s, variants: s.variants.filter((_, j) => j !== i) }))} className="rounded p-1 text-[#10283F] hover:bg-[#F0FDFA]"><Trash2 className="size-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* product page tabs */}
      <div className={sec}>
        <div className={h}>Mahsulot sahifasi bo‘limlari</div>
        <div className={sub}>Xaridor mahsulot sahifasidagi tablarda ko‘radi. Bo‘sh qoldirilgan bo‘lim ko‘rsatilmaydi.</div>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <Field label="Klinik qo‘llanish" hint="Ko‘rsatmalar, qo‘llash tartibi, qarshi ko‘rsatmalar"><Textarea value={v.clinical_use} onChange={(e) => set('clinical_use')(e.target.value.slice(0, 2000))} placeholder="Masalan: Bir bosqichli ottisk olish uchun. Aralashtirish vaqti 30 s, og‘izda qotish 3 daqiqa..." /></Field>
          <Field label="Yetkazib berish shartlari" hint="Muddat, hudud, narx, qaytarish shartlari"><Textarea value={v.delivery_info} onChange={(e) => set('delivery_info')(e.target.value.slice(0, 1000))} placeholder="Masalan: Toshkent bo‘ylab 1 kunda bepul (500 000 so‘mdan). Viloyatlarga BTS orqali 2–3 kun." /></Field>
        </div>
        <div className="mt-4">
          <div className="flex items-start justify-between gap-3">
            <div><div className="text-[13.5px] font-semibold text-[#10283F]">Texnik xususiyatlar</div><div className={sub}>Masalan: Kafolat — 12 oy, Ob/min — 40 000, Kuchlanish — 220 V</div></div>
            <Btn variant="soft" icon={Plus} size="sm" onClick={() => setV((s) => ({ ...s, specs: [...s.specs, ['', '']] }))}>Xususiyat qo‘shish</Btn>
          </div>
          {v.specs.map(([k, val], i) => (
            <div key={i} className="mt-2 flex items-center gap-2">
              <input list="sh-spec-keys" value={k} onChange={(e) => setList('specs', i, 0, e.target.value)} placeholder="Nomi (Kafolat)" className={`${cell} w-[40%]`} />
              <input value={val} onChange={(e) => setList('specs', i, 1, e.target.value)} placeholder="Qiymati (12 oy)" className={`${cell} flex-1`} />
              <button type="button" aria-label="O‘chirish" onClick={() => setV((s) => ({ ...s, specs: s.specs.filter((_, j) => j !== i) }))} className="rounded p-1 hover:bg-[#F0FDFA]"><Trash2 className="size-4" /></button>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-[#E6EEF0] p-3">
          <Toggle checked={v.reorder_enabled} onChange={(x) => setV((s) => ({ ...s, reorder_enabled: x }))} />
          <div className="flex-1"><div className="text-[13.5px] font-semibold text-[#10283F]">Qayta buyurtma</div><div className={sub}>Xaridor bu mahsulotni muntazam (avtomatik eslatma bilan) buyurtma qila oladi</div></div>
          {v.reorder_enabled && <Select value={String(v.reorder_days)} onChange={(x) => setV((s) => ({ ...s, reorder_days: Number(x) }))} options={REORDER_INTERVALS.map(([d, l]) => [String(d), l])} className="w-[180px]" />}
        </div>
      </div>

      {/* medical device */}
      <div className={sec}>
        <div className={h}>Tibbiy buyum ma’lumotlari</div>
        <div className={sub}>O‘zbekistonda tibbiy buyum sifatida ro‘yxatdan o‘tgan mahsulotlar uchun</div>
        <div className="mt-3 grid gap-3 md:grid-cols-3 md:gap-4">
          <Field label="Ro‘yxatdan o‘tganlik guvohnomasi №" hint="O‘zbekiston tibbiy buyum guvohnomasi"><Input value={v.reg_cert_no} onChange={set('reg_cert_no')} placeholder="TV/X 01234/05/24" /></Field>
          <Field label="Partiya (LOT) raqami"><Input value={v.lot_no} onChange={set('lot_no')} placeholder="LOT 2405123" /></Field>
          <Field label="Saqlash harorati"><Input list="sh-temps" value={v.storage_temp} onChange={set('storage_temp')} placeholder="+5…+25 °C" /></Field>
        </div>
      </div>

      {/* documents */}
      <div className={sec}>
        <div className="flex items-start justify-between gap-3">
          <div><div className={h}>Sertifikat va hujjatlar</div><div className={sub}>PDF yoki rasm. Hujjat turi va raqamini ko‘rsating — tekshiruvni tezlashtiradi.</div></div>
          <Btn variant="soft" icon={Plus} size="sm" onClick={() => docRef.current?.click()}>Hujjat qo‘shish</Btn>
        </div>
        {v.documents.map((d, i) => (
          <div key={d.url} className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-[#E6EEF0] px-3 py-2 text-[13px]">
            <FileText className="size-4 text-[#0F766E]" /><span className="min-w-[120px] flex-1 truncate">{d.name}</span>
            <Select value={d.doc_type || ''} onChange={(x) => setList('documents', i, 'doc_type', x)} options={DOC_TYPES} placeholder="Hujjat turi" className="w-[230px]" />
            <input value={d.doc_no || ''} onChange={(e) => setList('documents', i, 'doc_no', e.target.value)} placeholder="Hujjat raqami" className={`${cell} w-[150px]`} />
            <button type="button" aria-label="O‘chirish" onClick={() => setV((s) => ({ ...s, documents: s.documents.filter((x) => x.url !== d.url) }))}><X className="size-4" /></button>
          </div>
        ))}
      </div>
      <div className="mt-4"><Err>{error}</Err></div>
      {!editingLive && <p className="mt-3 text-[12px] text-[#5C6E80]">Yangi mahsulot moderator tekshiruvidan so‘ng “Faol” bo‘ladi va xaridorlarga ko‘rinadi.</p>}
    </Modal>
  )
}

const sumStock = (vs) => String(vs.reduce((s, x) => s + toNum(x.stock), 0))
function Thumb({ src, main, onRemove }) {
  return (
    <span className="relative block size-[56px]">
      <img src={src} alt="" className={`size-full rounded-lg border object-cover ${main ? 'border-[#0F766E]' : 'border-[#E6EEF0]'}`} />
      <button type="button" aria-label="Rasmni o‘chirish" onClick={onRemove} className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-[#3D4E5F] text-white"><X className="size-3" /></button>
    </span>
  )
}
