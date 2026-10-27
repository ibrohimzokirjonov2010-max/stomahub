import { Inbox } from 'lucide-react'

/** Shared empty / loading / error strip for real-data catalog sections. */
export default function EmptyCatalog({
  title = 'Hozircha ma’lumot yo‘q',
  text = 'Supabase katalogiga qo‘shilgan yozuvlar shu yerda chiqadi.',
  loading = false,
  error = '',
  action = null,
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-[#E6EEF0] bg-white px-5 py-10 text-center text-[13px] text-[#5C6E80]">
        Yuklanmoqda…
      </div>
    )
  }
  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-8 text-center text-[13px] text-rose-700">
        {error}
      </div>
    )
  }
  return (
    <div className="rounded-2xl border border-dashed border-[#D5E3E6] bg-white px-5 py-12 text-center">
      <span className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-[#F0FDFA] text-[#0F766E]">
        <Inbox className="size-6" />
      </span>
      <div className="text-[15px] font-bold text-[#10283F]">{title}</div>
      <p className="mx-auto mt-1.5 max-w-md text-[12.5px] leading-relaxed text-[#5C6E80]">{text}</p>
      {action}
    </div>
  )
}
