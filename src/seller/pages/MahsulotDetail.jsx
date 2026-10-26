import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Pencil, Box, Copy, EyeOff, Eye, Archive, FileText, Download, ArrowRight, Trash2, UserRound, ArrowLeft, Ellipsis, Package, ClipboardList, Send } from 'lucide-react'
import { useSellerData, updateRow, PRODUCT_STATUS } from '../api'
import { dmy, num, som } from '../format'
import { card, Btn, Crumbs, Badge, Menu, Th, Td, toast } from '../components/ui'
import Empty from '../components/shell/Empty'
import StatusBadge from '../components/bosh-sahifa/StatusBadge'
import { ProductBadge, useProductActions, IconBtn } from './Mahsulotlar'
import { variantLabel } from '../components/mahsulotlar/constants'

const kb = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)
const short = (n) => { const [a, b] = (n || '').split(' '); return b ? `${a} ${b[0]}.` : a || '' }

export default function MahsulotDetail() {
  const { id } = useParams()
  const data = useSellerData()
  const navigate = useNavigate()
  const act = useProductActions()
  const [img, setImg] = useState(0)
  const p = data.products.find((x) => x.id === id)
  if (!p) return <div className={card}><Empty icon={Package} title={data.loading ? 'Yuklanmoqda…' : 'Mahsulot topilmadi'} text={data.loading ? '' : 'Mahsulot o‘chirilgan yoki sizga tegishli emas.'} action={!data.loading && <Link to="/sotuvchi/mahsulotlar" className="mt-3 text-[14px] font-semibold text-[#0F766E]">Mahsulotlarga qaytish</Link>} /></div>
  const images = p.images?.length ? p.images : p.image_url ? [p.image_url] : []
  const orders = data.orders.filter((o) => o.items.some((it) => it.product_id === p.id))
  const reviews = data.reviews.filter((r) => r.product_id === p.id && !r.hidden)
  const variants = p.variants || []
  const removeVariant = async (i) => { const r = await updateRow('seller_products', p.id, { variants: variants.filter((_, j) => j !== i) }); toast(r.ok ? 'Variant o‘chirildi' : r.error) }
  const subtitle = p.unit || (variants.length ? variants.map(variantLabel).join(' · ') : '')

  const actions = [
    ['Tahrirlash', Pencil, () => act.setEdit(p), true],
    ['Stokni yangilash', Box, () => act.setStock(p)],
    ['Nusxa olish', Copy, () => act.copy(p)],
    p.status === 'active' ? ['Faolsizlantirish', EyeOff, () => act.setStatus(p, 'inactive', 'Mahsulot faolsizlantirildi'), false, true]
      : p.status === 'inactive' ? ['Faollashtirish', Eye, () => act.setStatus(p, 'active', 'Mahsulot faollashtirildi')]
        : ['draft', 'rejected'].includes(p.status) ? ['Tekshiruvga yuborish', Send, () => act.setStatus(p, 'review', 'Tekshiruvga yuborildi')] : null,
    p.status === 'archived' ? ['Arxivdan chiqarish', Archive, () => act.setStatus(p, 'inactive', 'Arxivdan chiqarildi')] : p.status !== 'review' ? ['Arxivlash', Archive, () => act.setStatus(p, 'archived', 'Mahsulot arxivlandi')] : null,
  ].filter(Boolean)

  return (
    <div>
      <Crumbs items={[['Mahsulotlar', '/sotuvchi/mahsulotlar'], ['Mahsulot tafsiloti']]} />
      {/* mobile top bar */}
      <div className="-mt-1 mb-3 flex items-center justify-between md:hidden">
        <button type="button" onClick={() => navigate('/sotuvchi/mahsulotlar')} aria-label="Orqaga" className="text-[#0F766E]"><ArrowLeft className="size-6" /></button>
        <div className="text-[17px] font-bold">Mahsulot tafsiloti</div>
        <Menu icon={Ellipsis} items={act.items(p)} />
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_200px] lg:grid-cols-[1fr_160px]">
        <div className={`${card} p-3 md:p-4`}>
          <div className="grid gap-4 md:grid-cols-[56px_220px_1fr] lg:grid-cols-[56px_220px_1fr]">
            <div className="order-2 flex gap-2 overflow-x-auto md:order-none md:flex-col">
              {images.map((src, i) => <button key={src} type="button" onClick={() => setImg(i)} className={`size-14 shrink-0 overflow-hidden rounded-lg border-2 ${i === img ? 'border-[#0F766E]' : 'border-transparent'}`}><img src={src} alt="" className="size-full object-cover" /></button>)}
            </div>
            <div className="order-1 grid aspect-[4/3] place-items-center overflow-hidden rounded-xl bg-[#F1F5F6] md:order-none md:aspect-square">
              {images[img] ? <img src={images[img]} alt={p.name} className="size-full object-cover" /> : <Package className="size-14 text-[#9AAAB5]" strokeWidth={1.4} />}
            </div>
            <div className="order-3 min-w-0 md:order-none">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><h1 className="text-[22px] font-extrabold leading-tight md:text-[24px]">{p.name}</h1>{subtitle && <div className="mt-0.5 text-[15px] text-[#0F766E] md:text-[16px]">{subtitle}</div>}</div>
                <ProductBadge status={p.status} className="hidden md:inline-flex" />
              </div>
              <div className="mt-2 flex items-center justify-between md:hidden"><span className="text-[22px] font-extrabold text-[#0F766E]">{som(p.price)}</span><ProductBadge status={p.status} /></div>
              {p.status === 'rejected' && p.reject_reason && <div className="mt-2 rounded-lg bg-[#EEF2F3] px-3 py-2 text-[13px]">Rad etish sababi: {p.reject_reason}</div>}
              {p.status === 'review' && <div className="mt-2 rounded-lg bg-[#F0FDFA] px-3 py-2 text-[12.5px] text-[#115E59]">Mahsulot moderator tekshiruvida. Tasdiqlangandan so‘ng xaridorlarga ko‘rinadi.</div>}
              <div className="mt-4 grid grid-cols-3 gap-y-4 border-t border-[#EEF3F4] pt-4 text-[13px] max-md:hidden">
                <Info k="SKU" v={p.sku} /><Info k="Kategoriya" v={p.category} /><Info k="Brend" v={p.brand} />
                <Info k="Ishlab chiqaruvchi davlat" v={p.country} /><Info k="Narx (so‘m)" v={num(p.price)} bold /><Info k="Stok" v={`${p.stock} dona`} bold />
                {p.expires_on && <Info k="Yaroqlilik muddati" v={dmy(p.expires_on)} />}
              </div>
              <div className="mt-1 grid grid-cols-3 gap-2 md:hidden">
                {[['Qoldiq', `${p.stock} dona`], ['SKU', p.sku || '—'], ['Kategoriya', p.category || '—']].map(([k, v]) => <div key={k} className="rounded-xl bg-[#F6FAFA] p-2.5"><div className="text-[11.5px] text-[#6B7A88]">{k}</div><div className="text-[13px] font-semibold leading-snug">{v}</div></div>)}
              </div>
            </div>
          </div>
        </div>
        <div className={`${card} hidden h-fit flex-col gap-2.5 p-3 md:flex`}>
          {actions.map(([label, Icon, fn, primary, gray]) => <Btn key={label} variant={primary ? 'primary' : gray ? 'gray' : 'outline'} icon={Icon} onClick={fn} className="w-full">{label}</Btn>)}
        </div>
      </div>

      {variants.length > 0 && (
        <div className={`${card} mt-4 overflow-hidden md:mr-[216px] lg:mr-[176px]`}>
          <div className="px-4 pb-2 pt-3.5 text-[16px] font-bold">Variantlar ({variants.length} ta)</div>
          <div className="overflow-x-auto px-3 pb-3"><table className="w-full min-w-[560px]">
            <thead className="bg-[#F6FAFA]"><tr><Th>#</Th><Th>Rang</Th><Th>O‘lcham</Th><Th>Narx (so‘m)</Th><Th>Stok</Th><Th>SKU</Th><Th>Holat</Th><Th className="text-center">Amallar</Th></tr></thead>
            <tbody>{variants.map((v, i) => (
              <tr key={v.sku || i} className="border-t border-[#EEF3F4]">
                <Td>{i + 1}</Td><Td>{v.color || '—'}</Td><Td>{v.size || '—'}</Td><Td>{num(v.price)}</Td><Td>{v.stock}</Td><Td className="text-[#3D4E5F]">{v.sku}</Td>
                <Td><Badge tone={v.stock > 0 ? 'on' : 'off'}>{v.stock > 0 ? 'Faol' : 'Tugagan'}</Badge></Td>
                <Td><div className="flex justify-center gap-1"><IconBtn label="Tahrirlash" onClick={() => act.setEdit(p)}><Pencil className="size-4" /></IconBtn><IconBtn label="O‘chirish" onClick={() => removeVariant(i)}><Trash2 className="size-4" /></IconBtn></div></Td>
              </tr>))}</tbody>
          </table></div>
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <div className={`${card} p-4`}><div className="mb-2 text-[16px] font-bold">Tavsif</div>
            {p.description ? <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-[#3D4E5F]">{p.description}</p> : <p className="text-[13px] text-[#6B7A88]">Tavsif kiritilmagan.</p>}
          </div>
          <div className={`${card} p-4`}><div className="mb-2 text-[16px] font-bold">Sertifikat va hujjatlar</div>
            {(p.documents || []).length ? p.documents.map((d) => (
              <div key={d.url} className="mt-2 flex items-center gap-3 rounded-xl border border-[#E6EEF0] p-2.5">
                <span className="grid h-14 w-11 place-items-center rounded bg-[#F1F5F6]"><FileText className="size-5 text-[#3D4E5F]" /></span>
                <div className="min-w-0 flex-1"><div className="truncate text-[13.5px] font-medium">{d.name}</div><div className="text-[12px] text-[#6B7A88]">{(d.type || '').includes('pdf') ? 'PDF' : 'Rasm'} • {kb(d.size || 0)} • {dmy(d.at || p.created_at)}</div></div>
                <a href={d.url} target="_blank" rel="noreferrer" download aria-label="Yuklab olish" className="grid size-10 place-items-center rounded-lg border border-[#DCE5E7] text-[#0F766E] hover:bg-[#F0FDFA]"><Download className="size-5" /></a>
              </div>)) : <p className="text-[13px] text-[#6B7A88]">Hujjat yuklanmagan. Tahrirlash orqali sertifikat qo‘shing.</p>}
          </div>
        </div>
        <div className="space-y-4">
          <div className={`${card} p-4`}>
            <div className="mb-2 flex items-center justify-between"><span className="text-[16px] font-bold">Oxirgi buyurtmalar</span>{orders.length > 0 && <Link to={`/sotuvchi/buyurtmalar?product=${p.id}`} className="flex items-center gap-1 text-[13px] font-medium text-[#0F766E]">Barchasini ko‘rish<ArrowRight className="size-4" /></Link>}</div>
            {orders.length ? <div className="overflow-x-auto"><table className="w-full min-w-[440px]">
              <thead className="bg-[#F6FAFA]"><tr><Th>#</Th><Th>Sana</Th><Th>Xaridor</Th><Th>Variant</Th><Th>Soni</Th><Th>Summa (so‘m)</Th><Th>Holat</Th></tr></thead>
              <tbody>{orders.slice(0, 5).map((o) => { const it = o.items.find((x) => x.product_id === p.id); return (
                <tr key={o.id} onClick={() => navigate(`/sotuvchi/buyurtmalar/${o.id}`)} className="cursor-pointer border-t border-[#EEF3F4] hover:bg-[#F7FCFB]">
                  <Td className="whitespace-nowrap">{o.code}</Td><Td>{dmy(o.created_at)}</Td><Td className="whitespace-nowrap">{short(o.customer_name)}</Td><Td>{it.variant || '—'}</Td><Td>{it.qty}</Td><Td>{num(it.qty * it.price)}</Td><Td><StatusBadge status={o.status} /></Td>
                </tr>) })}</tbody></table></div> : <Empty icon={ClipboardList} title="Hali buyurtma yo‘q" text="Bu mahsulot bo‘yicha buyurtmalar shu yerda ko‘rinadi." />}
          </div>
          <div className={`${card} p-4`}>
            <div className="mb-2 flex items-center justify-between"><span className="text-[16px] font-bold">Sharhlar</span>{reviews.length > 0 && <Link to={`/sotuvchi/sharhlar?product=${p.id}`} className="flex items-center gap-1 text-[13px] font-medium text-[#0F766E]">Barchasini ko‘rish<ArrowRight className="size-4" /></Link>}</div>
            {reviews.length ? reviews.slice(0, 3).map((r) => (
              <div key={r.id} className="mt-2 flex gap-3 rounded-xl border border-[#EEF3F4] p-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#E3F4F2] text-[#0F766E]"><UserRound className="size-5" /></span>
                <div className="min-w-0"><div className="text-[13.5px] font-semibold">{short(r.author_name) || 'Xaridor'} <span className="ml-3 font-normal text-[#6B7A88]">{dmy(r.created_at)}</span></div><div className="text-[13px] text-[#3D4E5F]">{r.body}</div></div>
              </div>)) : <Empty title="Hali sharh yo‘q" text="Xaridorlar sharh qoldirganda shu yerda ko‘rinadi." />}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5 md:hidden">
        {actions.map(([label, Icon, fn, primary]) => <Btn key={label} variant={primary ? 'primary' : 'outline'} icon={Icon} onClick={fn} className="h-12">{label}</Btn>)}
        <Btn variant="gray" icon={Trash2} onClick={() => act.setConfirm(p)} className="h-12">O‘chirish</Btn>
      </div>
      {act.modals}
    </div>
  )
}

const Info = ({ k, v, bold }) => <div className="pr-3"><div className="text-[12.5px] text-[#5C6E80]">{k}</div><div className={`mt-1 text-[14px] ${bold ? 'font-bold' : ''}`}>{v || '—'}</div></div>
