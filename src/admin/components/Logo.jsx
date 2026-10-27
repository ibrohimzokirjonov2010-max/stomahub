export function ToothMark({ className = 'size-9' }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      <path d="M12.5 4.5c-4.6 0-8 3.6-8 8.6 0 4.4 1.7 7 2.9 10.6 1.3 3.9 1.5 12.3 5.1 12.3 3.4 0 3-8.6 7.5-8.6s4.1 8.6 7.5 8.6c3.6 0 3.8-8.4 5.1-12.3 1.2-3.6 2.9-6.2 2.9-10.6 0-5-3.4-8.6-8-8.6-3 0-4.6 1.6-7.5 1.6s-4.5-1.6-7.5-1.6Z" stroke="#0F766E" strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M14 11.5c1.6-.9 3.6-.6 6 .4" stroke="#0F766E" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

export default function Logo({ size = 'md', subtitle = 'Dental platforma' }) {
  const big = size === 'md'
  return (
    <div className="flex items-center gap-2.5">
      <ToothMark className={big ? 'size-[40px]' : 'size-[30px]'} />
      <div className="whitespace-nowrap leading-tight">
        <div className={`${big ? 'text-[20px]' : 'text-[17px]'} font-extrabold tracking-tight text-[#0F766E]`}>
          Stoma<span className="text-[#10283F]">Hub</span>
        </div>
        <div className={`${big ? 'text-[12px]' : 'text-[11px]'} font-medium text-[#5C6E80]`}>{subtitle}</div>
      </div>
    </div>
  )
}
