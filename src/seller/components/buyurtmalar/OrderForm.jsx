import { useEffect, useMemo, useState } from 'react'
import { UserRound, MapPin, Box, Truck, CalendarDays, CreditCard, FileText, Search, Plus, Minus, Trash2, Store, X, Check, Info, Banknote, Calculator, Tag } from 'lucide-react'
import Modal from '../shell/Modal'
import { Btn, Input, Select, Textarea, Err, Field, toast, inputCls } from '../ui'
import { useSellerData, createOrder, insertRow, logActivity, useAsync, COMMISSION_RATE } from '../../api'
import { num, som } from '../../format'
import { useMobile } from '../../../useMobile'
import ProductThumb from '../bosh-sahifa/ProductThumb'
import { DELIVERY } from './constants'
import { variantLabel } from '../mahsulotlar/constants'

const today = () => new Date().toISOString().slice(0, 10)
const H = ({ icon: Icon, n, children, right }) => (
  <div className="mb-2.5 flex items-center justify-between gap-2"><div className="flex items-center gap-2 text-[14.5px] font-bold text-[#0F766E] md:text-[14px]"><Icon className="size-5" />{n && <span>{n}.</span>}<span className="text-[#10283F] md:text-[#0F766E]">{children}</span></div>{right}</div>
)

export default function OrderForm({ open, onClose, onCreated, presetCustomer }) {
  const data = useSellerData()
  const mobile = useMobile()
  const { busy, error, setError, go } = useAsync()
  const [cq, setCq] = useState('')
  const [cust, setCust] = useState(null)
  const [newCust, setNewCust] = useState(null)
  const [address, setAddress] = useState('')
  const [items, setItems] = useState([])
  const [picker, setPicker] = useState(false)
  const [pq, setPq] = useState('')
  const [method, setMethod] = useState('olib_ketish')
  const [date, setDate] = useState(today())
  const [fee, setFee] = useState('')
  const [note, setNote] = useState('')
  const [discountId, setDiscountId] = useState('')
  const [cOpen, setCOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    setCq(''); setNewCust(null); setItems([]); setMethod('olib_ketish'); setDate(today()); setFee(''); setNote(''); setDiscountId(''); setError('')
    const c = presetCustomer ? data.customers.find((x) => x.id === presetCustomer) : null
    setCust(c || null); setAddress(c ? [c.region, c.city, c.address].filter(Boolean).join(', ') : '')
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const customers = data.customers.filter((c) => !c.blocked && (!cq || `${c.name} ${c.phone}`.toLowerCase().includes(cq.toLowerCase())))
  const sellable = useMemo(() => {
    const out = []
    data.products.filter((p) => p.status === 'active').forEach((p) => {
      if (p.variants?.length) p.variants.forEach((v) => out.push({ key: `${p.id}:${v.sku}`, product: p, variant: v.sku, label: variantLabel(v), price: Number(v.price || p.price), stock: Number(v.stock || 0) }))
      else out.push({ key: p.id, product: p, variant: '', label: p.unit || '', price: Number(p.price), stock: Number(p.stock) })
    })
    return out
  }, [data.products])
  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0)
  const activeDiscounts = data.discounts.filter((d) => d.active !== false && !d.is_draft && (!d.ends_on || d.ends_on >= today()) && (!d.starts_on || d.starts_on <= today()) && (!d.usage_limit || data.orders.filter((o) => o.discount_id === d.id && o.status !== 'bekor_qilindi').length < d.usage_limit))
  const disc = activeDiscounts.find((d) => d.id === discountId)
  const inScope = (pr) => !disc || disc.scope === 'all' || !disc.scope || (disc.scope === 'products' ? (disc.product_ids || []).includes(pr.id) || disc.product_id === pr.id : pr.category === disc.category)
  const elig = items.filter((it) => inScope(it.product)).reduce((s, it) => s + it.price * it.qty, 0)
  const free = items.filter((it) => inScope(it.product)).reduce((s, it) => s + Math.floor(it.qty / 3) * it.price, 0)
  const discAmt = !disc || subtotal < Number(disc.min_order || 0) ? 0 : disc.kind === 'bir_bepul' ? free : Math.min(elig, disc.kind === 'summa' ? Number(disc.value || 0) : Math.round(elig * Number(disc.value || disc.percent || 0) / 100))
  const pd = !disc && cust?.personal_discount ? Number(cust.personal_discount) : 0
  const pdAmt = pd ? Math.round(subtotal * pd / 100) : 0
  const net = subtotal - discAmt - pdAmt
  const fe = method === 'olib_ketish' ? 0 : Math.max(0, Number(fee) || 0)
  const commission = Math.round(net * COMMISSION_RATE)
  const add = (s) => { setItems((l) => (l.some((x) => x.key === s.key) ? l.map((x) => (x.key === s.key ? { ...x, qty: Math.min(x.stock, x.qty + 1) } : x)) : [...l, { ...s, qty: 1 }])); setPicker(false); setPq('') }
  const setQty = (key, q) => setItems((l) => l.map((x) => (x.key === key ? { ...x, qty: Math.max(1, Math.min(x.stock, q)) } : x)))

  async function submit() {
    if (!cust && !newCust?.name) return setError('Mijozni tanlang yoki yangi mijoz qo‘shing')
    if (!items.length) return setError('Kamida bitta mahsulot qo‘shing')
    if (method !== 'olib_ketish' && !address.trim()) return setError('Yetkazib berish manzilini kiriting')
    const r = await go(async () => {
      let c = cust
      if (!c) {
        if (!newCust.phone?.trim()) return { ok: false, error: 'Yangi mijoz telefon raqamini kiriting' }
        const cr = await insertRow('seller_customers', { name: newCust.name.trim(), phone: newCust.phone.trim(), city: newCust.city || '', kind: 'klinika' })
        if (!cr.ok) return cr
        c = cr.data
      }
      return createOrder({ customer_id: c.id, customer_name: c.name, customer_phone: c.phone, address: address.trim(), delivery_method: method, delivery_date: date, delivery_fee: fe, note, discount_id: discountId || null,
        items: items.map((it) => ({ product_id: it.product.id, variant: it.variant, qty: it.qty })) })
    })
    if (r?.ok) { logActivity('Buyurtma qo‘lda yaratildi', `${items.length} ta mahsulot`); toast('Buyurtma yaratildi'); onClose(); onCreated?.(r.data) }
  }

  const summary = (
    <div className="rounded-xl bg-[#F0FDFA] p-3.5 text-[13px]">
      <div className="mb-2 flex items-center gap-2 font-bold"><Calculator className="size-5 text-[#0F766E]" />Buyurtma summasi</div>
      <Row k="Mahsulotlar jami" v={som(subtotal)} />
      {discAmt > 0 && <Row k={disc.kind === 'bir_bepul' ? 'Chegirma (2+1)' : 'Chegirma'} v={`−${som(discAmt)}`} />}
      {disc && !discAmt && items.length > 0 && <p className="text-[12px] text-[#5C6E80]">{subtotal < Number(disc.min_order || 0) ? `Chegirma uchun minimal buyurtma: ${som(disc.min_order)}` : !elig ? 'Tanlangan chegirma bu mahsulotlarga tegishli emas' : '2+1: har 3 donadan bittasi bepul'}</p>}
      {pdAmt > 0 && <Row k={`Shaxsiy chegirma (${pd}%)`} v={`−${som(pdAmt)}`} />}
      <Row k="Yetkazib berish" v={som(fe)} />
      <div className="my-2 flex items-center justify-between rounded-lg bg-[#CCFBF1] px-3 py-2.5 font-bold"><span>Jami summa</span><span>{som(net + fe)}</span></div>
      <Row k={`StomaHub komissiyasi (${COMMISSION_RATE * 100}%)`} v={som(commission)} />
      <div className="mt-2 flex items-center justify-between rounded-lg bg-[#CCFBF1] px-3 py-2.5 font-bold"><span>Sizga tushadi</span><span>{som(net - commission + fe)}</span></div>
    </div>
  )

  const footer = (
    <div className="grid grid-cols-2 gap-3 md:flex md:justify-end">
      <Btn variant="outline" icon={X} onClick={onClose} className="h-12 md:w-[170px]">Bekor qilish</Btn>
      <Btn icon={Check} disabled={busy} onClick={submit} className="h-12 md:w-[250px]">{busy ? 'Yaratilmoqda…' : 'Buyurtmani yaratish'}</Btn>
    </div>
  )

  return (
    <Modal open={open} onClose={onClose} full width="max-w-[960px]" title={mobile ? 'Buyurtma qo‘shish' : 'Buyurtma qo‘lda qo‘shish'} subtitle={mobile ? 'Yangi buyurtma ma’lumotlarini kiriting.' : 'Do‘kondagi mavjud mahsulotlardan foydalangan holda buyurtma yarating.'} footer={footer}>
      <div className="grid gap-5 md:grid-cols-[1fr_240px] md:gap-4">
        <div className="space-y-5 max-md:space-y-3">
          <section className="max-md:rounded-2xl max-md:border max-md:border-[#E6EEF0] max-md:p-3">
            <H icon={UserRound} n={!mobile && 1} right={mobile && <button type="button" className="flex items-center gap-1 text-[13px] text-[#0F766E]" onClick={() => { setCust(null); setNewCust({ name: '', phone: '' }) }}><Plus className="size-4" />Yangi mijoz qo‘shish</button>}>Mijoz ma’lumotlari</H>
            {newCust ? (
              <div className="grid gap-2 rounded-xl border border-[#E6EEF0] p-3 md:grid-cols-3">
                <Input placeholder="Klinika yoki ism" value={newCust.name} onChange={(e) => setNewCust({ ...newCust, name: e.target.value })} />
                <Input placeholder="+998 90 123 45 67" value={newCust.phone} onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })} />
                <div className="flex gap-2"><Input placeholder="Shahar" value={newCust.city || ''} onChange={(e) => setNewCust({ ...newCust, city: e.target.value })} /><button type="button" aria-label="Bekor" onClick={() => setNewCust(null)} className="grid size-[42px] shrink-0 place-items-center rounded-[10px] border border-[#DCE5E7]"><X className="size-4" /></button></div>
              </div>
            ) : cust ? (
              <div className="flex items-center gap-3 rounded-xl border border-[#E6EEF0] p-2.5">
                <span className="grid size-9 place-items-center rounded-lg bg-[#E3F4F2] text-[#0F766E]"><Store className="size-5" /></span>
                <div className="min-w-0 flex-1"><div className="truncate text-[13.5px] font-semibold">{cust.name}</div><div className="text-[12px] text-[#5C6E80]">{cust.city || cust.region || '—'}</div></div>
                <span className="text-[13px] text-[#3D4E5F]">{cust.phone}</span>
                <button type="button" aria-label="Olib tashlash" onClick={() => setCust(null)} className="grid size-9 place-items-center rounded-lg text-[#5C6E80] hover:bg-[#F0FDFA]"><X className="size-4" /></button>
              </div>
            ) : (
              <div className="flex gap-2.5">
                <div className="relative flex-1">
                  <Input icon={mobile ? UserRound : Search} placeholder={mobile ? 'Mijozni tanlang — telefon yoki ism' : 'Mijoz nomi yoki telefon raqami bo‘yicha qidirish...'} value={cq} onFocus={() => setCOpen(true)} onBlur={() => setTimeout(() => setCOpen(false), 150)} onChange={(e) => { setCq(e.target.value); setCOpen(true) }} />
                  {cOpen && (
                    <div className="absolute inset-x-0 top-11 z-20 max-h-56 overflow-y-auto rounded-xl border border-[#E6EEF0] bg-white p-1 shadow-lg">
                      {customers.length ? customers.slice(0, 30).map((c) => (
                        <button key={c.id} type="button" onMouseDown={() => { setCust(c); setAddress([c.region, c.city, c.address].filter(Boolean).join(', ')) }} className="flex w-full justify-between gap-2 rounded-lg px-3 py-2 text-left text-[13px] hover:bg-[#F0FDFA]"><span className="truncate font-medium">{c.name}</span><span className="text-[#5C6E80]">{c.phone}</span></button>
                      )) : <div className="px-3 py-3 text-[13px] text-[#6B7A88]">{data.customers.length ? 'Mijoz topilmadi' : 'Hali mijoz yo‘q — “Yangi mijoz” orqali qo‘shing'}</div>}
                    </div>
                  )}
                </div>
                {!mobile && <Btn variant="soft" icon={Plus} onClick={() => setNewCust({ name: cq, phone: '' })} className="h-[42px]">Yangi mijoz</Btn>}
              </div>
            )}
          </section>

          {!mobile && <Address address={address} setAddress={setAddress} />}

          <section className="max-md:rounded-2xl max-md:border max-md:border-[#E6EEF0] max-md:p-3">
            <H icon={Box} n={!mobile && 3} right={<Btn variant={mobile ? 'ghost' : 'soft'} size="sm" icon={Plus} onClick={() => setPicker((v) => !v)}>Mahsulot qo‘shish</Btn>}>Mahsulotlar</H>
            {picker && (
              <div className="mb-2 rounded-xl border border-[#E6EEF0] p-2">
                <Input icon={Search} autoFocus placeholder="Mahsulot nomi yoki SKU..." value={pq} onChange={(e) => setPq(e.target.value)} />
                <div className="mt-1.5 max-h-52 overflow-y-auto">
                  {sellable.filter((s) => !pq || `${s.product.name} ${s.product.sku} ${s.variant}`.toLowerCase().includes(pq.toLowerCase())).map((s) => (
                    <button key={s.key} type="button" disabled={s.stock <= 0} onClick={() => add(s)} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-[#F0FDFA] disabled:opacity-40">
                      <ProductThumb src={s.product.image_url} className="size-9" /><span className="min-w-0 flex-1"><span className="block truncate font-medium">{s.product.name}</span><span className="text-[12px] text-[#5C6E80]">{s.label} {s.label && '·'} {s.stock} dona</span></span><span>{num(s.price)}</span>
                    </button>
                  ))}
                  {!sellable.length && <div className="p-3 text-[13px] text-[#6B7A88]">Faol mahsulot yo‘q. Avval mahsulot qo‘shing va tasdiqlanishini kuting.</div>}
                </div>
              </div>
            )}
            {items.length ? (mobile ? (
              <div className="divide-y divide-[#EEF3F4]">{items.map((it) => (
                <div key={it.key} className="flex items-center gap-2.5 py-2.5">
                  <ProductThumb src={it.product.image_url} className="h-[52px] w-[64px]" />
                  <div className="min-w-0 flex-1"><div className="truncate text-[13.5px] font-semibold">{it.product.name}</div><div className="text-[11.5px] text-[#6B7A88]">SKU: {it.variant || it.product.sku || '—'}</div><div className="text-[14px] font-bold">{som(it.price)}</div></div>
                  <button type="button" aria-label="O‘chirish" onClick={() => setItems((l) => l.filter((x) => x.key !== it.key))}><Trash2 className="size-5 text-[#3D4E5F]" /></button>
                  <Qty it={it} setQty={setQty} />
                </div>))}</div>
            ) : (
              <table className="w-full text-[12.5px]">
                <thead className="bg-[#F6FAFA] text-[#3D4E5F]"><tr><th className="px-2 py-2 text-left font-medium">#</th><th className="px-2 text-left font-medium">Mahsulot</th><th className="px-2 font-medium">Soni</th><th className="px-2 text-right font-medium">Narx (so‘m)</th><th className="px-2 text-right font-medium">Jami (so‘m)</th><th className="px-2 font-medium">Amallar</th></tr></thead>
                <tbody>{items.map((it, i) => (
                  <tr key={it.key} className="border-t border-[#EEF3F4]">
                    <td className="px-2 py-2">{i + 1}</td>
                    <td className="px-2"><div className="flex items-center gap-2"><ProductThumb src={it.product.image_url} className="h-8 w-10" /><div className="min-w-0"><div className="truncate font-medium">{it.product.name}</div><div className="text-[11.5px] text-[#6B7A88]">{it.label}</div></div></div></td>
                    <td className="px-2"><Qty it={it} setQty={setQty} /></td>
                    <td className="px-2 text-right">{num(it.price)}</td><td className="px-2 text-right">{num(it.price * it.qty)}</td>
                    <td className="px-2 text-center"><button type="button" aria-label="O‘chirish" onClick={() => setItems((l) => l.filter((x) => x.key !== it.key))}><Trash2 className="size-4" /></button></td>
                  </tr>))}</tbody>
              </table>
            )) : <div className="rounded-xl border border-dashed border-[#DCE5E7] py-5 text-center text-[13px] text-[#6B7A88]">Mahsulot qo‘shilmagan</div>}
          </section>

          {mobile && <Address address={address} setAddress={setAddress} mobile />}

          <div className="grid gap-4 md:grid-cols-2">
            <section><H icon={Truck} n={!mobile && 4}>Yetkazib berish usuli</H><Select value={method} onChange={setMethod} options={DELIVERY} />
              {method !== 'olib_ketish' && <Input className="mt-2" inputMode="numeric" placeholder="Yetkazish narxi (so‘m)" value={fee} onChange={(e) => setFee(e.target.value)} />}</section>
            <section><H icon={CalendarDays} n={!mobile && 5}>Yetkazib berish sanasi</H><input type="date" min={today()} value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} /></section>
            <section><H icon={CreditCard} n={!mobile && 6}>To‘lov usuli</H>
              <div className="flex h-[42px] items-center gap-2 rounded-[10px] border border-[#DCE5E7] bg-[#F4F7F8] px-3 text-[13.5px] text-[#5C6E80]"><Banknote className="size-4" />Naqd</div>
              <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-[#5C6E80]"><Info className="size-3.5 text-[#0F766E]" />Mijoz buyurtmani qabul qilganda naqd to‘lov qiladi.</p></section>
            <section><H icon={FileText} n={!mobile && 7}>Izoh (ixtiyoriy)</H><Textarea maxLength={500} placeholder="Buyurtma haqida qo‘shimcha ma’lumot" value={note} onChange={(e) => setNote(e.target.value)} className="min-h-[64px]" /></section>
          </div>
          {activeDiscounts.length > 0 && <Field label={<span className="flex items-center gap-1.5"><Tag className="size-4 text-[#0F766E]" />Chegirma (ixtiyoriy)</span>}><Select value={discountId} onChange={setDiscountId} options={activeDiscounts.map((d) => [d.id, d.title])} placeholder="Chegirmasiz" /></Field>}
          {mobile && summary}
          <Err>{error}</Err>
        </div>
        {!mobile && <aside className="border-l border-[#EEF3F4] pl-4">{summary}</aside>}
      </div>
    </Modal>
  )
}

const Row = ({ k, v }) => <div className="flex items-center justify-between gap-2 py-1 text-[12.5px]"><span className="text-[#3D4E5F]">{k}</span><span className="whitespace-nowrap">{v}</span></div>
function Qty({ it, setQty }) {
  return (
    <div className="mx-auto flex h-9 w-[96px] items-center justify-between rounded-lg border border-[#DCE5E7]">
      <button type="button" aria-label="Kamaytirish" onClick={() => setQty(it.key, it.qty - 1)} className="grid size-8 place-items-center text-[#0F766E]"><Minus className="size-4" /></button>
      <span className="text-[13.5px] font-semibold">{it.qty}</span>
      <button type="button" aria-label="Oshirish" onClick={() => setQty(it.key, it.qty + 1)} className="grid size-8 place-items-center text-[#0F766E]"><Plus className="size-4" /></button>
    </div>
  )
}
function Address({ address, setAddress, mobile }) {
  return (
    <section className="max-md:rounded-2xl max-md:border max-md:border-[#E6EEF0] max-md:p-3">
      <H icon={MapPin} n={!mobile && 2}>Yetkazib berish manzili</H>
      <div className="flex gap-2.5">
        <Input icon={mobile ? MapPin : undefined} placeholder="Masalan: Toshkent shahri, Yunusobod tumani, Amir Temur ko‘chasi, 12-uy" value={address} onChange={(e) => setAddress(e.target.value)} className="flex-1" />
        {!mobile && <a href={`https://www.google.com/maps/search/${encodeURIComponent(address)}`} target="_blank" rel="noreferrer" className="flex h-[42px] items-center gap-1.5 rounded-[10px] border border-[#DCE5E7] px-3 text-[12.5px] text-[#0F766E] hover:bg-[#F0FDFA]"><MapPin className="size-4" />Xaritada ko‘rish</a>}
      </div>
    </section>
  )
}
