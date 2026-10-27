import { Link } from 'react-router-dom'
import { ADMIN_NAV } from '../nav'

export default function Placeholder({ title }) {
  const item = ADMIN_NAV.find((n) => n.label === title)
  const Icon = item?.icon
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-6 py-14 text-center shadow-sm">
      {Icon && <span className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-[#F0FDFA] text-[#0F766E]"><Icon className="size-7" /></span>}
      <h1 className="text-[22px] font-extrabold text-[#10283F]">{title}</h1>
      <p className="mt-2 text-[14px] text-[#5C6E80]">Bu bo‘lim tez orada qo‘shiladi. Hozircha faqat Boshqaruv paneli ishlaydi.</p>
      <Link to="/admin" className="mt-5 inline-block text-[14px] font-semibold text-[#0F766E]">← Boshqaruv paneli</Link>
    </div>
  )
}
