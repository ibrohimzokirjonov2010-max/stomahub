import { ORDER_STATUS, payLabel } from '../../format'

const TONE = {
  teal: 'bg-[#CCFBF1] text-[#0F766E]',
  blue: 'bg-[#E0F2FE] text-[#0369A1]',
  orange: 'bg-[#FFEDD5] text-[#C2410C]',
  gray: 'bg-[#F1F5F9] text-[#64748B]',
}

export default function StatusBadge({ status }) {
  const s = ORDER_STATUS[status] || { label: status || '—', tone: 'gray' }
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[12px] font-semibold ${TONE[s.tone] || TONE.gray}`}>{s.label}</span>
}

export function PayBadge({ method }) {
  return <span className="inline-flex rounded-full bg-[#CCFBF1] px-2.5 py-1 text-[12px] font-semibold text-[#0F766E]">{payLabel(method)}</span>
}
