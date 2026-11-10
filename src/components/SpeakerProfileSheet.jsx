import { Link } from 'react-router-dom'
import { CalendarDays, MapPin, User } from 'lucide-react'
import { BottomSheet } from './mobile/MobileSeminars'

export default function SpeakerProfileSheet({ speaker, others = [], onClose }) {
  if (!speaker) return null
  const seen = new Set()
  const lines = [
    speaker.degree,
    speaker.years ? (String(speaker.years).includes('tajriba') ? speaker.years : `${speaker.years} yillik tajriba`) : '',
    speaker.clinic,
    ...(speaker.lines || []),
  ].filter((t) => {
    const s = String(t || '').trim()
    if (!s) return false
    const k = s.toLowerCase()
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })

  return (
    <BottomSheet title="Ma’ruzachi" onClose={onClose} centered>
      <div className="flex flex-col items-center pb-3 pt-1 text-center">
        {speaker.avatar ? (
          <img src={speaker.avatar} alt="" className="size-24 rounded-full object-cover ring-4 ring-[#CCFBF1]" />
        ) : (
          <span className="grid size-24 place-items-center rounded-full bg-[#CCFBF1] text-[#0F766E]"><User className="size-10" /></span>
        )}
        <h3 className="mt-3 text-[20px] font-extrabold leading-tight text-[#115E59]">{speaker.name}</h3>
        {speaker.role && <p className="mt-1 rounded-full bg-[#CCFBF1] px-2.5 py-0.5 text-[13px] font-semibold text-[#0F766E]">{speaker.role}</p>}
        {lines.length > 0 && <p className="mt-2 text-[13px] leading-snug text-[#115E59]/80">{lines.join(' · ')}</p>}
      </div>
      {speaker.bio && (
        <div className="border-t border-[#CCFBF1] pt-3">
          <p className="text-[13px] font-semibold text-[#115E59]">Bio</p>
          <p className="mt-1 whitespace-pre-line text-[13.5px] leading-relaxed text-[#134e4a]">{speaker.bio}</p>
        </div>
      )}
      {others.length > 0 && (
        <div className="mt-3 border-t border-[#CCFBF1] pt-3">
          <p className="mb-2 text-[13px] font-semibold text-[#115E59]">Shu ma’ruzachining boshqa seminarlari</p>
          <div className="space-y-2">
            {others.map((o) => (
              <Link key={o.id} to={`/seminarlar/${o.id}`} onClick={onClose} className="flex gap-2.5 rounded-xl bg-[#F0FDFA] p-2">
                {o.image && <img src={o.image} alt="" className="h-14 w-11 shrink-0 rounded-lg object-contain bg-white" />}
                <span className="min-w-0">
                  <b className="block line-clamp-2 text-[13.5px] leading-snug text-[#115E59]">{o.title}</b>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-[#0F766E]">
                    {(o.city || o.place) && <span className="inline-flex items-center gap-0.5"><MapPin className="size-3" />{o.city || o.place}</span>}
                    {(o.day && o.mon) && <span className="inline-flex items-center gap-0.5"><CalendarDays className="size-3" />{o.day} {o.mon}</span>}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </BottomSheet>
  )
}
