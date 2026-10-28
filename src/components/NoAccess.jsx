import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock3, ShieldAlert, Ban, Store, CalendarDays } from 'lucide-react'

/**
 * Kabinetga huquqi yo'q foydalanuvchi uchun ekran. Kabinet ichidagi hech narsa ko'rsatilmaydi.
 * kind: 'seller' | 'organizer'; status: profildagi seller_status / org_status.
 */
export default function NoAccess({ kind, status, role, onApply, applyTo }) {
  const seller = kind === 'seller'
  const [shop, setShop] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [sent, setSent] = useState(false)
  // ariza faqat shu kabinet roli bilan bog'liq bo'lsa holatini ko'rsatamiz
  const own = seller ? role === 'seller' : role === 'organizer'
  const st = sent ? 'pending' : own ? status : 'none'
  const label = seller ? 'sotuvchi' : 'tashkilotchi'
  const Icon = st === 'pending' ? Clock3 : st === 'blocked' ? Ban : seller ? Store : CalendarDays

  let title = seller ? 'Sotuvchi kabinetiga kirish huquqingiz yo‘q' : 'Tashkilotchi kabinetiga kirish huquqingiz yo‘q'
  let text = seller
    ? 'Bu bo‘lim faqat tasdiqlangan sotuvchilar uchun. Mahsulot sotish uchun ariza qoldiring — administrator ko‘rib chiqqach, kabinet ochiladi.'
    : 'Bu bo‘lim faqat tasdiqlangan tashkilotchilar uchun. Seminar o‘tkazish uchun ariza qoldiring — administrator ko‘rib chiqqach, kabinet ochiladi.'
  if (st === 'pending') { title = 'Arizangiz ko‘rib chiqilmoqda'; text = `${label[0].toUpperCase() + label.slice(1)} arizangiz qabul qilindi. Administrator tasdiqlagach, kabinet avtomatik ochiladi.` }
  if (st === 'rejected') { title = 'Arizangiz rad etildi'; text = `Afsuski, ${label} arizangiz tasdiqlanmadi. Ma’lumotlarni yangilab, qayta ariza yuborishingiz mumkin.` }
  if (st === 'blocked') { title = 'Kabinet bloklangan'; text = 'Hisobingiz administrator tomonidan bloklangan. Batafsil ma’lumot uchun qo‘llab-quvvatlash xizmatiga murojaat qiling.' }
  const canApply = st === 'none' || st === 'rejected' || !st

  const submit = async (e) => {
    e.preventDefault()
    if (seller && !shop.trim()) { setErr('Do‘kon nomini kiriting'); return }
    setBusy(true); setErr('')
    const res = await onApply(shop.trim())
    setBusy(false)
    if (!res?.ok) setErr(res?.error || 'Ariza yuborilmadi')
    else setSent(true)
  }

  return (
    <div data-testid="no-access" className="grid min-h-screen place-items-center bg-[#f4fbfa] px-4 py-10">
      <form onSubmit={submit} className="w-full max-w-md rounded-[24px] bg-white px-6 py-8 text-center shadow-[0_16px_50px_rgb(16_50_48/0.08)]">
        <span className={`mx-auto grid size-16 place-items-center rounded-full ${st === 'blocked' ? 'bg-[#fdecec] text-[#c43d3d]' : 'bg-[#e3f4f1] text-[#0b6d73]'}`}>
          {st === 'none' || !st ? <ShieldAlert className="size-8" strokeWidth={1.6} /> : <Icon className="size-8" strokeWidth={1.6} />}
        </span>
        <h1 className="mt-4 text-[22px] font-extrabold leading-tight tracking-tight text-[#10283f]">{title}</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[#5c6e80]">{text}</p>
        {canApply && applyTo && (
          <Link to={applyTo} data-testid="become-seller" className="mt-5 grid h-12 w-full place-items-center rounded-xl bg-[#0f766e] text-[15px] font-semibold text-white hover:bg-[#115e59]">{seller ? 'Sotuvchi bo‘lish' : 'Tashkilotchi bo‘lish'}</Link>
        )}
        {canApply && seller && !applyTo && (
          <input value={shop} onChange={(e) => setShop(e.target.value)} placeholder="Do‘kon nomi" className="mt-5 h-12 w-full rounded-xl border border-[#dce5e7] px-4 text-[15px] outline-none focus:border-[#0f766e]" />
        )}
        {err && <p className="mt-3 text-[13px] font-medium text-[#d14343]">{err}</p>}
        {canApply && !applyTo && (
          <button type="submit" disabled={busy} className="mt-4 h-12 w-full rounded-xl bg-[#0f766e] text-[15px] font-semibold text-white hover:bg-[#115e59] disabled:opacity-60">
            {busy ? 'Yuborilmoqda…' : seller ? 'Sotuvchi bo‘lish uchun ariza' : 'Tashkilotchi bo‘lish uchun ariza'}
          </button>
        )}
        <Link to="/" className={`mt-3 grid h-12 w-full place-items-center rounded-xl text-[15px] font-semibold ${canApply ? 'border border-[#dce5e7] text-[#10283f]' : 'bg-[#0f766e] text-white'}`}>Bosh sahifaga qaytish</Link>
      </form>
    </div>
  )
}
