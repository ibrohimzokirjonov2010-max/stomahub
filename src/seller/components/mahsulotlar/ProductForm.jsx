import { useEffect, useRef, useState } from 'react'
import { CloudUpload, Plus, X, Trash2, Info, Send, Camera, Save, FileText } from 'lucide-react'
import Modal from '../shell/Modal'
import { Btn, Field, Input, Select, Textarea, Err, toast } from '../ui'
import { insertRow, updateRow, uploadMedia, logActivity, useAsync } from '../../api'
import { useMobile } from '../../../useMobile'
import { BRANDS, CATEGORIES, COUNTRIES, SHADES } from './constants'

const blank = { name: '', category: '', brand: '', country: '', description: '', price: '', stock: '', sku: '', expires_on: '', unit: '', images: [], variants: [], documents: [] }
const toNum = (v) => Number(String(v).replace(/\s/g, '')) || 0

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
    setV(product ? { ...blank, ...product, price: String(product.price ?? ''), stock: String(product.stock ?? ''), expires_on: product.expires_on || '',
      images: product.images?.length ? product.images : (product.image_url ? [product.image_url] : []), variants: product.variants || [], documents: product.documents || [] } : blank)
  }, [open, product, setError])
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e?.target ? e.target.value : e }))
  const setVar = (i, k, val) => setV((s) => ({ ...s, variants: s.variants.map((x, j) => (j === i ? { ...x, [k]: val } : x)) }))
  const hasVariants = v.variants.length > 0

  async function addFiles(files, kind) {
    setUp(true)
    for (const f of files) {
      if (kind === 'img' && !/^image\/(png|jpe?g|webp)$/.test(f.type)) { setError('Faqat JPG yoki PNG rasm'); continue }
      const r = await uploadMedia(f, kind === 'img' ? 'products' : 'docs')
      if (!r.ok) { setError(r.error); continue }
      if (kind === 'img') setV((s) => ({ ...s, images: [...s.images, r.url].slice(0, 10) }))
      else setV((s) => ({ ...s, documents: [...s.documents, { name: r.name, url: r.url, size: r.size, type: r.type, at: new Date().toISOString() }] }))
    }
    setUp(false)
  }

  async function submit(asDraft) {
    if (!v.name.trim()) return setError('Mahsulot nomini kiriting')
    if (!asDraft) {
      if (!v.category) return setError('Kategoriyani tanlang')
      if (toNum(v.price) <= 0 && !hasVariants) return setError('Narxni kiriting')
      if (!v.sku.trim() && !mobile) return setError('SKU ni kiriting')
    }
    const variants = v.variants.map((x) => ({ ...x, price: toNum(x.price) || toNum(v.price), stock: toNum(x.stock), sku: x.sku.trim() || `${v.sku || 'V'}-${x.color || ''}${x.size || ''}`.replace(/\s/g, ''), label: [x.color, x.size].filter(Boolean).join(', ') }))
    const row = {
      name: v.name.trim(), category: v.category, brand: v.brand, country: v.country, description: v.description.trim(), unit: v.unit.trim(),
      price: toNum(v.price) || (variants[0]?.price ?? 0), stock: toNum(v.stock), sku: v.sku.trim(), expires_on: v.expires_on || null,
      images: v.images, image_url: v.images[0] || '', variants, documents: v.documents,
    }
    let res
    if (product) {
      if (asDraft === false && ['draft', 'rejected'].includes(product.status)) row.status = 'review'
      res = await go(() => updateRow('seller_products', product.id, row))
    } else {
      row.status = asDraft ? 'draft' : 'review'
      res = await go(() => insertRow('seller_products', row))
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
        <div><div className="text-[13.5px] font-semibold text-[#10283F]">Komissiya 12%</div><div className="text-[12px] text-[#5C6E80]">Sotilgan har bir mahsulot uchun Stoqm Hub komissiya sifatida 12% ni oladi. To‘lov faqat naqd.</div></div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:flex">
        <Btn variant="outline" icon={mobile ? X : undefined} onClick={onClose} className="h-12 md:w-[120px]">Bekor qilish</Btn>
        {!product && !mobile && <Btn variant="gray" disabled={busy || up} onClick={() => submit(true)} className="h-12">Qoralama</Btn>}
        <Btn icon={mobile ? Save : Send} disabled={busy || up} onClick={() => submit(false)} className="h-12 md:px-6">{busy ? 'Saqlanmoqda…' : editingLive ? 'Saqlash' : mobile ? 'Saqlash' : 'Tekshiruvga yuborish'}</Btn>
      </div>
    </div>
  )

  return (
    <Modal open={open} onClose={onClose} full width="md:max-w-[900px]" title={product ? 'Mahsulotni tahrirlash' : 'Mahsulot qo‘shish'}
      subtitle={mobile ? 'Yangi mahsulot haqida ma’lumot kiriting.' : 'Yangi mahsulotingiz haqida ma’lumotlarni kiriting.'} footer={footer}>
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={(e) => { addFiles([...e.target.files], 'img'); e.target.value = '' }} />
      <input ref={docRef} type="file" accept="application/pdf,image/*" hidden onChange={(e) => { addFiles([...e.target.files], 'doc'); e.target.value = '' }} />
      <div className="grid gap-6 md:grid-cols-[1fr_1fr] md:gap-0">
        {/* images */}
        <div className="md:border-r md:border-[#E6EEF0] md:pr-5">
          <div className="rounded-2xl md:rounded-none max-md:border max-md:border-[#E2ECEE] max-md:bg-[#F7FBFB] max-md:p-3">
            <div className="flex items-baseline justify-between">
              <div className="text-[15px] font-bold text-[#10283F] md:text-[14px] md:text-[#0F766E]">{mobile ? 'Mahsulot fotosuratlari' : 'Mahsulot rasmlari'}</div>
              <span className="text-[12.5px] text-[#5C6E80] md:hidden">{v.images.length}/10 ta</span>
            </div>
            <div className="mb-2.5 hidden text-[12px] text-[#5C6E80] md:block">Asosiy rasm va qo‘shimcha rasmlarni yuklang.</div>
            <div className="mt-2 grid grid-cols-[2fr_1fr_1fr] gap-2 md:mt-0 md:block">
              <button type="button" onClick={() => fileRef.current?.click()} className="row-span-2 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#99D5CE] bg-[#F0FDFA] py-6 md:h-[88px] md:w-full md:py-0">
                {mobile ? <span className="grid size-12 place-items-center rounded-full bg-[#CCFBF1] text-[#0F766E]"><Camera className="size-6" /></span> : <CloudUpload className="size-7 text-[#0F766E]" />}
                <span className="mt-1.5 text-[14px] font-semibold text-[#0F766E]">{up ? 'Yuklanmoqda…' : 'Rasm yuklash'}</span>
                <span className="text-[11.5px] text-[#5C6E80]">JPG yoki PNG, 10 MB gacha</span>
              </button>
              {mobile && [0, 1, 2, 3].map((i) => v.images[i + 1] ? <Thumb key={i} src={v.images[i + 1]} onRemove={() => setV((s) => ({ ...s, images: s.images.filter((_, j) => j !== i + 1) }))} /> :
                <button key={i} type="button" onClick={() => fileRef.current?.click()} className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-[#B8DEDA] bg-[#F0FDFA]"><Camera className="size-6 text-[#0F766E]" /></button>)}
            </div>
            <div className="mt-2.5 hidden flex-wrap gap-2 md:flex">
              {v.images.map((src, i) => <Thumb key={src} src={src} main={i === 0} onRemove={() => setV((s) => ({ ...s, images: s.images.filter((x) => x !== src) }))} />)}
              <button type="button" onClick={() => fileRef.current?.click()} className="flex size-[56px] flex-col items-center justify-center rounded-lg border border-dashed border-[#99D5CE] text-[#0F766E]"><Plus className="size-5" /><span className="text-[9px]">Rasm qo‘shish</span></button>
            </div>
          </div>
        </div>
        {/* main info */}
        <div className="grid grid-cols-2 gap-3 md:pl-5">
          <div className="col-span-2 text-[15px] font-bold text-[#10283F] md:hidden">Asosiy ma’lumotlar</div>
          <Field label="Mahsulot nomi" required className="col-span-2 md:col-span-1"><Input value={v.name} onChange={set('name')} placeholder="Mahsulot nomini kiriting..." /></Field>
          <Field label="Kategoriya" required className="max-md:order-2 md:col-span-1"><Select value={v.category} onChange={set('category')} options={CATEGORIES} placeholder="— Tanlang —" /></Field>
          <Field label={mobile ? 'SKU (ixtiyoriy)' : 'Brend'} className="max-md:order-1">
            {mobile ? <Input value={v.sku} onChange={set('sku')} placeholder="Masalan: KMP-001" /> : <Select value={v.brand} onChange={set('brand')} options={BRANDS} placeholder="— Tanlang —" />}
          </Field>
          <Field label="Ishlab chiqaruvchi davlat" className="max-md:order-3"><Select value={v.country} onChange={set('country')} options={COUNTRIES} placeholder="— Tanlang —" /></Field>
          {mobile && <Field label="Brend" className="order-3"><Select value={v.brand} onChange={set('brand')} options={BRANDS} placeholder="— Tanlang —" /></Field>}
          <Field label="Qadoq / o‘lcham" className="col-span-2 max-md:order-4" hint="Ro‘yxatda nom ostida ko‘rinadi, masalan: 4 g, rang A3"><Input value={v.unit} onChange={set('unit')} placeholder="Masalan: 4 g, 100 dona" /></Field>
          <Field label="Tavsif" required className="col-span-2 max-md:order-6"><Textarea value={v.description} onChange={(e) => set('description')(e.target.value.slice(0, 1000))} placeholder="Mahsulot haqida batafsil ma’lumot yozing..." /><span className="mt-1 block text-right text-[11.5px] text-[#6B7A88] md:hidden">{v.description.length}/1000</span></Field>
          <div className="col-span-2 grid grid-cols-2 gap-3 max-md:order-5 md:hidden">
            <div className="col-span-2 text-[15px] font-bold text-[#10283F]">Narx va miqdor</div>
            <Field label="Narx (so‘m)" required><Input inputMode="numeric" value={v.price} onChange={set('price')} placeholder="Masalan: 320 000" /></Field>
            <Field label="Qoldiq (dona)" required><Input inputMode="numeric" value={hasVariants ? sumStock(v.variants) : v.stock} disabled={hasVariants} onChange={set('stock')} placeholder="Masalan: 10" /></Field>
          </div>
        </div>
      </div>

      <div className="mt-5 hidden border-t border-[#E6EEF0] pt-4 md:block">
        <div className="text-[15px] font-bold text-[#0F766E]">Asosiy ma’lumotlar</div>
        <div className="mt-3 grid grid-cols-3 gap-4">
          <Field label="Narx (so‘m)" required><Input inputMode="numeric" value={v.price} onChange={set('price')} placeholder="250 000" /></Field>
          <Field label="Stok soni" required hint={hasVariants ? 'Variantlar bo‘yicha avtomatik hisoblanadi' : ''}><Input inputMode="numeric" value={hasVariants ? sumStock(v.variants) : v.stock} disabled={hasVariants} onChange={set('stock')} placeholder="15" /></Field>
          <Field label="SKU" required><Input value={v.sku} onChange={set('sku')} placeholder="CMP-A3-001" /></Field>
          <div className="col-span-2" />
          <Field label="Yaroqlilik muddati"><Input type="date" value={v.expires_on} onChange={set('expires_on')} /></Field>
        </div>
      </div>
      {mobile && <Field label="Yaroqlilik muddati" className="mt-3"><Input type="date" value={v.expires_on} onChange={set('expires_on')} /></Field>}

      {/* variants */}
      <div className="mt-5 border-t border-[#E6EEF0] pt-4">
        <div className="flex items-start justify-between gap-3">
          <div><div className="text-[15px] font-bold text-[#0F766E]">Variantlar</div><div className="text-[12px] text-[#5C6E80]">Mahsulot rang yoki o‘lcham bo‘yicha bir nechta variantda bo‘lishi mumkin.</div></div>
          <Btn variant="soft" icon={Plus} size="sm" onClick={() => setV((s) => ({ ...s, variants: [...s.variants, { color: 'A1', size: '', price: s.price, stock: '', sku: '' }] }))}>Variant qo‘shish</Btn>
        </div>
        {hasVariants && (
          <div className="mt-3 overflow-x-auto rounded-xl border border-[#E6EEF0]">
            <table className="w-full min-w-[640px]">
              <thead className="bg-[#F6FAFA] text-left text-[12px] text-[#3D4E5F]"><tr><th className="px-3 py-2">#</th><th>Rang</th><th>O‘lcham</th><th>Narx (so‘m)</th><th>Stok</th><th>SKU</th><th className="text-center">Amallar</th></tr></thead>
              <tbody>
                {v.variants.map((x, i) => (
                  <tr key={i} className="border-t border-[#EEF3F4]">
                    <td className="px-3 py-1.5 text-[13px] text-[#5C6E80]">{i + 1}</td>
                    <td className="py-1.5 pr-2"><Select value={x.color} onChange={(val) => setVar(i, 'color', val)} options={SHADES} className="w-[96px]" /></td>
                    <td className="py-1.5 pr-2"><input value={x.size} onChange={(e) => setVar(i, 'size', e.target.value)} placeholder="4 g" className="h-[38px] w-[80px] rounded-lg border border-[#DCE5E7] px-2 text-[13px] outline-none focus:border-[#0F766E]" /></td>
                    <td className="py-1.5 pr-2"><input inputMode="numeric" value={x.price} onChange={(e) => setVar(i, 'price', e.target.value)} className="h-[38px] w-[110px] rounded-lg border border-[#DCE5E7] px-2 text-[13px] outline-none focus:border-[#0F766E]" /></td>
                    <td className="py-1.5 pr-2"><input inputMode="numeric" value={x.stock} onChange={(e) => setVar(i, 'stock', e.target.value)} className="h-[38px] w-[64px] rounded-lg border border-[#DCE5E7] px-2 text-[13px] outline-none focus:border-[#0F766E]" /></td>
                    <td className="py-1.5 pr-2"><input value={x.sku} onChange={(e) => setVar(i, 'sku', e.target.value)} placeholder="CMP-A1-001" className="h-[38px] w-[120px] rounded-lg border border-[#DCE5E7] px-2 text-[13px] outline-none focus:border-[#0F766E]" /></td>
                    <td className="text-center"><button type="button" aria-label="O‘chirish" onClick={() => setV((s) => ({ ...s, variants: s.variants.filter((_, j) => j !== i) }))} className="rounded p-1 text-[#10283F] hover:bg-[#F0FDFA]"><Trash2 className="size-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* documents */}
      <div className="mt-5 border-t border-[#E6EEF0] pt-4">
        <div className="flex items-start justify-between gap-3">
          <div><div className="text-[15px] font-bold text-[#0F766E]">Sertifikat va hujjatlar</div><div className="text-[12px] text-[#5C6E80]">PDF yoki rasm. Tekshiruvni tezlashtiradi.</div></div>
          <Btn variant="soft" icon={Plus} size="sm" onClick={() => docRef.current?.click()}>Hujjat qo‘shish</Btn>
        </div>
        {v.documents.map((d) => (
          <div key={d.url} className="mt-2 flex items-center gap-3 rounded-lg border border-[#E6EEF0] px-3 py-2 text-[13px]">
            <FileText className="size-4 text-[#0F766E]" /><span className="min-w-0 flex-1 truncate">{d.name}</span>
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
    <span className="relative block aspect-square md:size-[56px]">
      <img src={src} alt="" className={`size-full rounded-lg border object-cover ${main ? 'border-[#0F766E]' : 'border-[#E6EEF0]'}`} />
      <button type="button" aria-label="Rasmni o‘chirish" onClick={onRemove} className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-[#3D4E5F] text-white"><X className="size-3" /></button>
    </span>
  )
}
