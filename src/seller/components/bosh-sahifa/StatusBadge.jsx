import { STATUS } from '../../api'

const TONE = {
  yangi: 'bg-[#CCFBF1] text-[#115E59]',
  tasdiqlandi: 'bg-[#CCFBF1] text-[#115E59]',
  tayyorlanmoqda: 'bg-[#EEF2F3] text-[#3D4E5F]',
  yetkazilmoqda: 'bg-[#E3F4F2] text-[#0F766E]',
  yetkazildi: 'bg-[#CCFBF1] text-[#115E59]',
  bekor_qilindi: 'bg-[#EEF2F3] text-[#3D4E5F]',
}

export default function StatusBadge({ status, className = '' }) {
  return <span className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-2.5 py-1 text-[11.5px] font-medium ${TONE[status] || TONE.tayyorlanmoqda} ${className}`}>{STATUS[status]?.label || status}</span>
}
