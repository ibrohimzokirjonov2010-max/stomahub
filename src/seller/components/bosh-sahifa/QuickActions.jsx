import { useState } from 'react'
import { Box, FileText, UserRound, Tag, Megaphone, Wallet, ChevronRight, CirclePlus } from 'lucide-react'
import Modal from '../shell/Modal'
import { addCampaign, addCustomer, addDiscount, addManualOrder, addProduct, requestPayout, useAsync } from '../../api'

export const ACTIONS = [
  { key: 'product', icon: Box, mIcon: CirclePlus, title: 'Mahsulot qo‘shish', text: 'Yangi mahsulotni qo‘shib, sotuvga chiqaring.', mText: 'Yangi mahsulotni katalogga qo‘shing.', mobile: true },
  { key: 'order', icon: FileText, title: 'Buyurtma qo‘lda qo‘shish', mTitle: 'Buyurtma qo‘shish', text: 'Telefon orqali olingan buyurtmani qo‘lda kiriting.', mText: 'Mijoz uchun buyurtma yarating.', mobile: true },
  { key: 'customer', icon: UserRound, title: 'Mijoz qo‘shish', text: 'Yangi mijozni bazaga qo‘shing.' },
  { key: 'discount', icon: Tag, title: 'Chegirma yaratish', text: 'Mahsulotlar uchun chegirma aksiyasini yarating.', mText: 'Mahsulotlarga chegirma belgilang.', mobile: true },
  { key: 'campaign', icon: Megaphone, title: 'Reklama kampaniyasi', mTitle: 'Reklama yaratish', text: 'Mahsulotingizni ko‘proq mijozlarga ko‘rsating.', mText: 'Mahsulotingizni ko‘proq mijozlarga ko‘rsating.', mobile: true },
  { key: 'payout', icon: Wallet, title: 'Pul yechish so‘rovi', text: 'Hamyondagi mablag‘ni yechish uchun so‘rov yuboring.' },
]

const FORMS = {
  product: { title: 'Mahsulot qo‘shish', submit: 'Saqlash', fn: addProduct, done: 'Mahsulot qo‘shildi', fields: [
    ['name', 'Mahsulot nomi', 'text', true], ['sku', 'SKU (ixtiyoriy)', 'text'], ['category', 'Kategoriya', 'text'],
    ['price', 'Narx (so‘m)', 'number', true], ['stock', 'Omborda (dona)', 'number', true], ['image_url', 'Rasm havolasi (ixtiyoriy)', 'url']] },
  order: { title: 'Buyurtma qo‘lda qo‘shish', submit: 'Buyurtma yaratish', fn: addManualOrder, done: 'Buyurtma yaratildi', needsProducts: true, fields: [
    ['customer_name', 'Mijoz ism familiyasi', 'text', true], ['customer_phone', 'Telefon raqami', 'tel', true], ['address', 'Yetkazib berish manzili', 'text', true],
    ['product_id', 'Mahsulot', 'product', true], ['qty', 'Soni', 'number', true], ['note', 'Izoh', 'text']] },
  customer: { title: 'Mijoz qo‘shish', submit: 'Saqlash', fn: addCustomer, done: 'Mijoz qo‘shildi', fields: [
    ['name', 'Ism familiya', 'text', true], ['phone', 'Telefon raqami', 'tel', true], ['city', 'Shahar', 'text'], ['note', 'Izoh', 'text']] },
  discount: { title: 'Chegirma yaratish', submit: 'Yaratish', fn: addDiscount, done: 'Chegirma yaratildi', fields: [
    ['title', 'Aksiya nomi', 'text', true], ['percent', 'Chegirma (%)', 'number', true], ['product_id', 'Mahsulot (bo‘sh qolsa — barchasi)', 'product'], ['ends_on', 'Tugash sanasi', 'date']] },
  campaign: { title: 'Reklama kampaniyasi', submit: 'Moderatsiyaga yuborish', fn: addCampaign, done: 'Kampaniya moderatsiyaga yuborildi', needsProducts: true, fields: [
    ['title', 'Kampaniya nomi', 'text', true], ['product_id', 'Mahsulot', 'product', true], ['daily_budget', 'Kunlik byudjet (so‘m)', 'number', true], ['days', 'Davomiyligi (kun)', 'number', true]] },
  payout: { title: 'Pul yechish so‘rovi', submit: 'So‘rov yuborish', fn: requestPayout, done: 'So‘rov yuborildi', note: 'To‘lov faqat naqd shaklda beriladi. Mablag‘ yetkazilgan buyurtmalardan (12% komissiya ayirilgan holda) hisoblanadi.', fields: [
    ['amount', 'Summa (so‘m)', 'number', true], ['note', 'Izoh', 'text']] },
}

export default function QuickActions({ open, setOpen, products }) {
  if (!open) return null
  if (open === 'menu') {
    return (
      <Modal open onClose={() => setOpen(null)} title="Tezkor amal" subtitle={<><span className="hidden md:inline">Eng kerakli amallarni tez va oson bajaring.</span><span className="md:hidden">Eng kerakli amallarni tez bajaring.</span></>} width="max-w-[680px]">
        <div className="hidden grid-cols-3 gap-3 md:grid">
          {ACTIONS.map((a) => (
            <button key={a.key} type="button" onClick={() => setOpen(a.key)} className="group rounded-[14px] border border-[#E2ECEE] bg-white p-3.5 text-left transition hover:border-[#99D5CE] hover:bg-[#F0FDFA]">
              <span className="mx-auto mb-3 grid size-[52px] place-items-center rounded-xl bg-[#E3F4F2] text-[#0F766E]"><a.icon className="size-7" strokeWidth={1.8} /></span>
              <span className="flex items-center justify-between text-[14px] font-bold text-[#10283F]">{a.title}<ChevronRight className="size-4 shrink-0" /></span>
              <span className="mt-1 block text-[12.5px] leading-snug text-[#5C6E80]">{a.text}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 md:hidden">
          {ACTIONS.filter((a) => a.mobile).map((a) => {
            const Icon = a.mIcon || a.icon
            return (
              <button key={a.key} type="button" onClick={() => setOpen(a.key)} className="flex items-center gap-4 rounded-[14px] bg-[#F0FDFA] px-4 py-3.5 text-left">
                <span className={`grid size-[46px] shrink-0 place-items-center rounded-full ${a.mIcon ? 'bg-[#CCFBF1]' : 'bg-[#CCFBF1]'} text-[#0F766E]`}>
                  {a.mIcon ? <span className="grid size-7 place-items-center rounded-full bg-[#0F766E] text-white"><Icon className="size-7" fill="#0F766E" color="white" strokeWidth={2} /></span> : <Icon className="size-6" strokeWidth={1.9} />}
                </span>
                <span className="min-w-0 flex-1"><span className="block text-[15.5px] font-bold text-[#10283F]">{a.mTitle || a.title}</span><span className="block text-[13.5px] text-[#5C6E80]">{a.mText || a.text}</span></span>
                <ChevronRight className="size-5 text-[#10283F]" />
              </button>
            )
          })}
        </div>
        <button type="button" onClick={() => setOpen(null)} className="mt-4 h-12 w-full rounded-xl border border-[#0F766E] text-[15px] font-medium text-[#0F766E] hover:bg-[#F0FDFA]">Yopish</button>
      </Modal>
    )
  }
  return <ActionForm form={FORMS[open]} products={products} onBack={() => setOpen('menu')} onClose={() => setOpen(null)} />
}

function ActionForm({ form, products, onBack, onClose }) {
  const [v, setV] = useState({ qty: 1, days: 7 })
  const [done, setDone] = useState(false)
  const { busy, error, go } = useAsync()
  if (!form) return null
  const set = (k) => (e) => setV((x) => ({ ...x, [k]: e.target.value }))
  const noProducts = form.needsProducts && products.length === 0
  return (
    <Modal open onClose={onClose} title={form.title} subtitle={form.note}>
      {done ? (
        <div className="py-6 text-center">
          <div className="text-[17px] font-bold text-[#0F766E]">{form.done}</div>
          <div className="mt-5 flex gap-3">
            <button type="button" onClick={onBack} className="h-11 flex-1 rounded-xl border border-[#0F766E] font-medium text-[#0F766E] hover:bg-[#F0FDFA]">Boshqa amal</button>
            <button type="button" onClick={onClose} className="h-11 flex-1 rounded-xl bg-[#0F766E] font-semibold text-white hover:bg-[#115E59]">Yopish</button>
          </div>
        </div>
      ) : noProducts ? (
        <div className="py-4 text-center text-[14px] text-[#5C6E80]">
          Avval kamida bitta mahsulot qo‘shing.
          <button type="button" onClick={onBack} className="mt-4 h-11 w-full rounded-xl border border-[#0F766E] font-medium text-[#0F766E]">Orqaga</button>
        </div>
      ) : (
        <form className="flex flex-col gap-3" onSubmit={async (e) => {
          e.preventDefault()
          const res = await go(() => form.fn(v))
          if (res.ok) setDone(true)
        }}>
          {form.fields.map(([k, label, type, req]) => (
            <label key={k} className="block">
              <span className="mb-1 block text-[13px] font-medium text-[#3D4E5F]">{label}</span>
              {type === 'product' ? (
                <select required={req} value={v[k] || ''} onChange={set(k)} className="h-11 w-full rounded-xl border border-[#DCE5E7] bg-white px-3 text-[14px] outline-none focus:border-[#0F766E]">
                  <option value="">{req ? 'Tanlang' : 'Barcha mahsulotlar'}</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} — {Number(p.price).toLocaleString('ru-RU')} so‘m ({p.stock} ta)</option>)}
                </select>
              ) : (
                <input required={req} type={type} min={type === 'number' ? (k === 'stock' ? 0 : 1) : undefined} max={k === 'percent' ? 90 : undefined}
                  value={v[k] ?? ''} onChange={set(k)} className="h-11 w-full rounded-xl border border-[#DCE5E7] px-3 text-[14px] outline-none focus:border-[#0F766E]" />
              )}
            </label>
          ))}
          {error && <p className="rounded-lg bg-[#F0FDFA] px-3 py-2 text-[13px] font-medium text-[#115E59]">{error}</p>}
          <div className="mt-1 flex gap-3">
            <button type="button" onClick={onBack} className="h-11 flex-1 rounded-xl border border-[#0F766E] font-medium text-[#0F766E] hover:bg-[#F0FDFA]">Orqaga</button>
            <button type="submit" disabled={busy} className="h-11 flex-1 rounded-xl bg-[#0F766E] font-semibold text-white hover:bg-[#115E59] disabled:opacity-60">{busy ? 'Saqlanmoqda…' : form.submit}</button>
          </div>
        </form>
      )}
    </Modal>
  )
}
