import { retryHub } from '../hubStore'

export default function HubNotice({ hub }) {
  if (!hub) return null
  if (hub.loading && !hub.ready) {
    return <p className="mb-3 rounded-xl bg-[#e8f7f5] px-3 py-2 text-[13px] font-medium text-[#0b8a84]">Ma’lumotlar yuklanmoqda…</p>
  }
  if (!hub.error) return null
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#fff4f4] px-3 py-2 text-[13px] text-[#b42318]">
      <span>{hub.error}</span>
      <button type="button" onClick={() => retryHub()} className="font-semibold text-[#0b8a84]">Qayta urinish</button>
    </div>
  )
}
