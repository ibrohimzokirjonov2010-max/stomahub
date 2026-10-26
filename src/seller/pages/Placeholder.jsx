import { Construction } from 'lucide-react'

export default function Placeholder({ title }) {
  return (
    <div className="mx-auto max-w-[1400px]">
      <h1 className="hidden text-[34px] font-extrabold tracking-tight text-[#10283F] md:block">{title}</h1>
      <h1 className="text-[22px] font-extrabold tracking-tight text-[#10283F] md:hidden">{title}</h1>
      <div className="mt-6 flex flex-col items-center rounded-2xl border border-[#E6EEF0] bg-white px-6 py-16 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-[#F0FDFA] text-[#0F766E]"><Construction className="size-7" /></span>
        <div className="mt-4 text-[17px] font-bold text-[#10283F]">Bu bo‘lim tez orada ishga tushadi</div>
        <div className="mt-1 max-w-sm text-[14px] text-[#5C6E80]">“{title}” bo‘limi ustida ishlanmoqda.</div>
      </div>
    </div>
  )
}
