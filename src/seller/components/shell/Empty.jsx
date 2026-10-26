export default function Empty({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
      {Icon && <div className="grid size-12 place-items-center rounded-2xl bg-[#F0FDFA] text-[#0F766E]"><Icon className="size-6" strokeWidth={1.8} /></div>}
      <div className="mt-3 text-[14px] font-semibold text-[#10283F]">{title}</div>
      {text && <div className="mt-1 max-w-[280px] text-[12.5px] leading-relaxed text-[#6B7A88]">{text}</div>}
      {action}
    </div>
  )
}
