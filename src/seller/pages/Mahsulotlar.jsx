import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Filter, Pencil, Copy, Package, SlidersHorizontal, ArrowUpDown, ClipboardList, Eye, Archive, Boxes, Trash2, EyeOff } from 'lucide-react'
import { useSellerData, PRODUCT_STATUS, insertRow, updateRow, deleteRow, logActivity, removeMedia } from '../api'
import { num, som } from '../format'
import { useMobile } from '../../useMobile'
import { card, PageHead, Btn, Select, SearchInput, Tabs, Chips, Badge, Checkbox, Pager, usePaged, Menu, Fab, Th, Td, toast } from '../components/ui'
import Empty from '../components/shell/Empty'
import Modal from '../components/shell/Modal'
import Confirm from '../components/shell/Confirm'
import ProductThumb from '../components/bosh-sahifa/ProductThumb'
import ProductForm from '../components/mahsulotlar/ProductForm'
import StockModal from '../components/mahsulotlar/StockModal'
import { CATEGORIES } from '../components/mahsulotlar/constants'
import { normCategory } from '../../config/productCatalog'

const TONE = { active: 'on', review: 'mid', rejected: 'off', inactive: 'off', archived: 'off', draft: 'off' }
export const ProductBadge = ({ status, className }) => <Badge tone={TONE[status]} className={`min-w-[72px] ${className || ''}`}>{PRODUCT_STATUS[status]?.label || status}</Badge>

export function useProductActions() {
  const [edit, setEdit] = useState(null)
  const [stock, setStock] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const navigate = useNavigate()
  const copy = async (p) => {
    const { id: _i, created_at: _c, updated_at: _u, seller_id: _s, status: _st, reject_reason: _r, ...rest } = p
    const r = await insertRow('seller_products', { ...rest, name: `${p.name} (nusxa)`, sku: p.sku ? `${p.sku}-N` : '', status: 'draft' })
    if (r.ok) { logActivity('Mahsulot nusxalandi', p.name); toast('Nusxa qoralama sifatida yaratildi'); setEdit(r.data) } else toast(r.error)
  }
  const setStatus = async (p, status, msg) => {
    const r = await updateRow('seller_products', p.id, { status })
    if (r.ok) { logActivity(msg, p.name); toast(msg) } else toast(r.error)
  }
  const items = (p) => [
    ['Ko‘rish', () => navigate(`/sotuvchi/mahsulotlar/${p.id}`), Eye],
    ['Tahrirlash', () => setEdit(p), Pencil],
    ['Stokni yangilash', () => setStock(p), Boxes],
    ['Nusxa olish', () => copy(p), Copy],
    p.status === 'active' && ['Faolsizlantirish', () => setStatus(p, 'inactive', 'Mahsulot faolsizlantirildi'), EyeOff],
    p.status === 'inactive' && ['Faollashtirish', () => setStatus(p, 'active', 'Mahsulot faollashtirildi'), Eye],
    ['draft', 'rejected'].includes(p.status) && ['Tekshiruvga yuborish', () => setStatus(p, 'review', 'Tekshiruvga yuborildi'), ClipboardList],
    !['archived', 'review'].includes(p.status) && ['Arxivlash', () => setStatus(p, 'archived', 'Mahsulot arxivlandi'), Archive],
    p.status === 'archived' && ['Arxivdan chiqarish', () => setStatus(p, 'inactive', 'Arxivdan chiqarildi (faolsiz)'), Archive],
    ['O‘chirish', () => setConfirm(p), Trash2],
  ]
  const modals = (
    <>
      <ProductForm open={!!edit} product={edit && edit.id ? edit : null} onClose={() => setEdit(null)} />
      <StockModal product={stock} onClose={() => setStock(null)} />
      <Confirm open={!!confirm} title="Mahsulotni o‘chirish" okText="O‘chirish" onClose={() => setConfirm(null)}
        text={`“${confirm?.name}” butunlay o‘chiriladi. Avvalgi buyurtmalardagi yozuvlar saqlanib qoladi.`}
        onOk={async () => { const p = confirm; const r = await deleteRow('seller_products', p.id); setConfirm(null); if (r.ok) { removeMedia([...(p.images || []), p.image_url, p.image]); logActivity('Mahsulot o‘chirildi', p.name); toast('Mahsulot o‘chirildi'); navigate('/sotuvchi/mahsulotlar') } else toast(r.error) }} />
    </>
  )
  return { items, modals, setEdit, setStock, copy, setStatus, setConfirm }
}

export default function Mahsulotlar() {
  const data = useSellerData()
  const mobile = useMobile()
  const navigate = useNavigate()
  const [sp, setSp] = useSearchParams()
  const [q, setQ] = useState(sp.get('q') || '')
  const [cat, setCat] = useState('')
  const [status, setStatus] = useState('')
  const [stock, setStock] = useState('')
  const [tab, setTab] = useState('all')
  const [sort, setSort] = useState('new')
  const [sel, setSel] = useState(new Set())
  const [filters, setFilters] = useState(false)
  const [adding, setAdding] = useState(false)
  const act = useProductActions()
  useEffect(() => { if (sp.get('new')) { setAdding(true); sp.delete('new'); setSp(sp, { replace: true }) } }, [sp, setSp])
  useEffect(() => { setQ(sp.get('q') || '') }, [sp])

  const products = data.products
  const count = (f) => products.filter(f).length
  const tabs = [['all', 'Barchasi', count((p) => p.status !== 'archived')], ['active', 'Faol', count((p) => p.status === 'active')], ['review', 'Tekshiruvda', count((p) => p.status === 'review')], ['rejected', 'Rad etilgan', count((p) => p.status === 'rejected')], ['archived', 'Arxiv', count((p) => p.status === 'archived')]]
  const mtabs = [['all', 'Barchasi', count((p) => p.status !== 'archived')], ['active', 'Faol', count((p) => p.status === 'active' && p.stock > 0)], ['out', 'Tugagan', count((p) => p.status !== 'archived' && p.stock <= 0)]]

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    let l = products.filter((p) => {
      if (tab === 'all' && p.status === 'archived' && status !== 'archived') return false
      if (tab === 'out') { if (p.stock > 0 || p.status === 'archived') return false } else if (tab === 'active' && mobile) { if (p.status !== 'active' || p.stock <= 0) return false } else if (tab !== 'all' && p.status !== tab) return false
      if (cat && normCategory(p.category) !== cat) return false
      if (status && p.status !== status) return false
      if (stock === 'in' && p.stock <= 0) return false
      if (stock === 'low' && !(p.stock > 0 && p.stock <= 5)) return false
      if (stock === 'out' && p.stock > 0) return false
      if (s && ![p.name, p.sku, p.brand, p.category].some((x) => (x || '').toLowerCase().includes(s))) return false
      return true
    })
    l = [...l].sort(sort === 'old' ? (a, b) => a.created_at.localeCompare(b.created_at) : sort === 'cheap' ? (a, b) => a.price - b.price : sort === 'expensive' ? (a, b) => b.price - a.price : (a, b) => b.created_at.localeCompare(a.created_at))
    return l
  }, [products, q, cat, status, stock, tab, sort, mobile])
  const pg = usePaged(list, mobile ? 20 : 10)
  useEffect(() => { pg.setPage(1) }, [q, cat, status, stock, tab]) // eslint-disable-line react-hooks/exhaustive-deps
  const allSel = pg.rows.length > 0 && pg.rows.every((p) => sel.has(p.id))
  const filtered = q || cat || status || stock

  async function bulk(statusTo) {
    const ids = [...sel]; let ok = 0
    for (const id of ids) { const r = await updateRow('seller_products', id, { status: statusTo }); if (r.ok) ok++ }
    toast(`${ok} ta mahsulot yangilandi${ok < ids.length ? `, ${ids.length - ok} tasini o‘zgartirib bo‘lmadi` : ''}`); setSel(new Set())
  }

  const empty = (
    <Empty icon={Package} title={filtered || tab !== 'all' ? 'Mos mahsulot topilmadi' : 'Hali mahsulot qo‘shilmagan'}
      text={filtered || tab !== 'all' ? 'Filtr yoki qidiruvni o‘zgartirib ko‘ring.' : 'Birinchi mahsulotingizni qo‘shing — tekshiruvdan so‘ng xaridorlarga ko‘rinadi.'}
      action={!filtered && tab === 'all' && <Btn icon={Plus} className="mt-4" onClick={() => setAdding(true)}>Mahsulot qo‘shish</Btn>} />
  )

  return (
    <div>
      <PageHead title="Mahsulotlar" subtitle={mobile ? 'Mahsulotlaringizni boshqaring va yangi mahsulot qo‘shing.' : 'Do‘koningizdagi mahsulotlarni boshqaring.'}
        action={<Btn icon={Plus} size="lg" onClick={() => setAdding(true)} className="px-6">Mahsulot qo‘shish</Btn>} />

      {/* desktop */}
      <div className="hidden md:block">
        <div className={`${card} flex items-end gap-4 p-3.5`}>
          <SearchInput value={q} onChange={setQ} placeholder="Mahsulot nomi, SKU yoki brend..." className="flex-[1.35]" />
          <label className="flex-1"><span className="mb-1 block text-[13px] font-medium">Kategoriya</span><Select value={cat} onChange={setCat} options={CATEGORIES} placeholder="Barcha kategoriyalar" /></label>
          <label className="flex-[0.8]"><span className="mb-1 block text-[13px] font-medium">Holat</span><Select value={status} onChange={setStatus} options={Object.entries(PRODUCT_STATUS).map(([k, v]) => [k, v.label])} placeholder="Barcha holatlar" /></label>
          <label className="flex-[0.7]"><span className="mb-1 block text-[13px] font-medium">Stok</span><Select value={stock} onChange={setStock} options={[['in', 'Mavjud'], ['low', 'Kam qolgan (≤5)'], ['out', 'Tugagan']]} placeholder="Barchasi" /></label>
          <Btn variant="outline" icon={Filter} className="h-[42px] bg-[#F0FDFA] px-5" onClick={() => { setQ(''); setCat(''); setStatus(''); setStock('') }}>{filtered ? 'Tozalash' : 'Filtrlar'}</Btn>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <Tabs tabs={tabs} value={tab} onChange={setTab} />
          {sel.size > 0 && (
            <div className="flex items-center gap-2 text-[13px]">
              <span className="text-[#5C6E80]">{sel.size} ta tanlandi</span>
              <Btn size="sm" variant="outline" onClick={() => bulk('inactive')}>Faolsizlantirish</Btn>
              <Btn size="sm" variant="outline" onClick={() => bulk('archived')}>Arxivlash</Btn>
            </div>
          )}
        </div>
        <div className={`${card} mt-3 overflow-hidden`}>
          <table className="w-full table-fixed">
            <colgroup><col className="w-[44px]" /><col className="w-[36px]" /><col className="w-[76px]" /><col /><col className="w-[120px]" /><col className="w-[170px]" /><col className="w-[110px]" /><col className="w-[62px]" /><col className="w-[118px]" /><col className="w-[112px]" /></colgroup>
            <thead className="bg-[#F6FAFA]"><tr>
              <Th><Checkbox checked={allSel} onChange={(c) => setSel(c ? new Set(pg.rows.map((p) => p.id)) : new Set())} /></Th><Th>#</Th><Th>Rasm</Th><Th>Mahsulot nomi</Th><Th>SKU</Th><Th>Kategoriya</Th><Th>Narx (so‘m)</Th><Th>Stok</Th><Th>Holat</Th><Th className="text-center">Amallar</Th>
            </tr></thead>
            <tbody>
              {pg.rows.map((p, i) => (
                <tr key={p.id} onClick={() => navigate(`/sotuvchi/mahsulotlar/${p.id}`)} className="cursor-pointer border-t border-[#EEF3F4] hover:bg-[#F7FCFB]">
                  <Td><Checkbox checked={sel.has(p.id)} onChange={(c) => setSel((s) => { const n = new Set(s); c ? n.add(p.id) : n.delete(p.id); return n })} /></Td>
                  <Td className="text-[#5C6E80]">{pg.offset + i + 1}</Td>
                  <Td><ProductThumb src={p.image_url} className="h-[30px] w-[50px]" /></Td>
                  <Td><div className="truncate font-semibold">{p.name}</div><div className="truncate text-[12px] text-[#5C6E80]">{p.unit || (p.variants?.length ? `${p.variants.length} ta variant` : '—')}</div></Td>
                  <Td className="truncate text-[#5C6E80]">{p.sku || '—'}</Td>
                  <Td className="truncate text-[#5C6E80]">{p.category || '—'}</Td>
                  <Td>{num(p.price)}</Td>
                  <Td>{p.stock}</Td>
                  <Td><ProductBadge status={p.status} /></Td>
                  <Td><div className="flex items-center justify-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                    <IconBtn label="Tahrirlash" onClick={() => act.setEdit(p)}><Pencil className="size-4" /></IconBtn>
                    <IconBtn label="Nusxa olish" onClick={() => act.copy(p)}><Copy className="size-4" /></IconBtn>
                    <Menu items={act.items(p)} />
                  </div></Td>
                </tr>
              ))}
            </tbody>
          </table>
          {!pg.rows.length && empty}
          <Pager {...pg} />
        </div>
      </div>

      {/* mobile */}
      <div className="md:hidden">
        <div className="flex gap-2.5">
          <SearchInput value={q} onChange={setQ} placeholder="Mahsulot nomi, SKU yoki kategoriya bo‘yicha qidirish..." className="flex-1 [&_input]:h-11 [&_input]:bg-[#F6FAFA]" />
          <button type="button" aria-label="Filtrlar" onClick={() => setFilters(true)} className={`grid size-11 place-items-center rounded-[10px] border ${cat || status || stock ? 'border-[#0F766E] bg-[#F0FDFA]' : 'border-[#DCE5E7] bg-white'} text-[#0F766E]`}><SlidersHorizontal className="size-5" /></button>
        </div>
        <div className="mt-3.5 flex items-center justify-between gap-2">
          <Chips tabs={mtabs} value={tab} onChange={setTab} />
          <button type="button" onClick={() => setSort(sort === 'new' ? 'old' : 'new')} className="flex shrink-0 items-center gap-1 text-[13px] text-[#10283F]"><ArrowUpDown className="size-4" />{sort === 'old' ? 'Eski avval' : 'Yangi avval'}</button>
        </div>
        <div className="mt-3.5 space-y-2.5">
          {pg.rows.map((p) => (
            <div key={p.id} onClick={() => navigate(`/sotuvchi/mahsulotlar/${p.id}`)} className={`${card} flex gap-3 p-2.5`}>
              <ProductThumb src={p.image_url} className="h-[76px] w-[96px]" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-1">
                  <div className="truncate pt-0.5 text-[14.5px] font-bold">{p.name}</div>
                  <div className="flex shrink-0 items-center"><Badge dot tone={p.stock <= 0 ? 'off' : TONE[p.status]} className="rounded-full">{p.stock <= 0 && p.status === 'active' ? 'Tugagan' : PRODUCT_STATUS[p.status]?.label}</Badge><Menu items={act.items(p)} className="-mr-1" /></div>
                </div>
                <div className="truncate text-[12px] text-[#5C6E80]">SKU: {p.sku || '—'} <span className="mx-1 text-[#C9D6DA]">|</span> {p.category || '—'}</div>
                <div className="text-[16px] font-extrabold">{som(p.price)}</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-[#5C6E80]"><ClipboardList className="size-3.5" />Stok: {p.stock} dona</div>
              </div>
            </div>
          ))}
          {!pg.rows.length && <div className={card}>{empty}</div>}
        </div>
        {pg.pages > 1 && <Pager {...pg} setPer={null} />}
        <Fab icon={Plus} onClick={() => setAdding(true)}>Mahsulot qo‘shish</Fab>
        <Modal open={filters} onClose={() => setFilters(false)} title="Filtrlar">
          <div className="space-y-3">
            <label className="block"><span className="mb-1 block text-[13px] font-medium">Kategoriya</span><Select value={cat} onChange={setCat} options={CATEGORIES} placeholder="Barcha kategoriyalar" /></label>
            <label className="block"><span className="mb-1 block text-[13px] font-medium">Holat</span><Select value={status} onChange={setStatus} options={Object.entries(PRODUCT_STATUS).map(([k, v]) => [k, v.label])} placeholder="Barcha holatlar" /></label>
            <label className="block"><span className="mb-1 block text-[13px] font-medium">Saralash</span><Select value={sort} onChange={setSort} options={[['new', 'Yangi avval'], ['old', 'Eski avval'], ['cheap', 'Arzon avval'], ['expensive', 'Qimmat avval']]} /></label>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3"><Btn variant="outline" onClick={() => { setCat(''); setStatus(''); setStock('') }}>Tozalash</Btn><Btn onClick={() => setFilters(false)}>Qo‘llash</Btn></div>
        </Modal>
      </div>

      <ProductForm open={adding} onClose={() => setAdding(false)} />
      {act.modals}
    </div>
  )
}

export const IconBtn = ({ label, children, ...p }) => <button type="button" aria-label={label} title={label} {...p} className="grid size-8 place-items-center rounded-lg text-[#10283F] hover:bg-[#F0FDFA] hover:text-[#0F766E]">{children}</button>
