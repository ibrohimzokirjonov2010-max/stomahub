import { MapPin, User } from 'lucide-react'
import Section from './Section'
import { seminars } from '../data'

export default function Seminars() {
  return (
    <Section title="Yaqin seminarlar">
      <div className="-mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 xl:grid-cols-4">
        {seminars.map((s) => (
          <article key={s.title} className="w-[260px] shrink-0 snap-start overflow-hidden rounded-xl bg-white shadow-card sm:w-auto">
            <div className="relative h-[82px] overflow-hidden bg-[#dce8f5]">
              <img src={s.image} alt="" className="absolute inset-y-0 right-0 h-full w-[78%] object-cover" />
              <div className="absolute inset-y-0 left-0 w-[30%] bg-gradient-to-r from-[#d7e6f5] to-transparent" />
              <div className="absolute left-2 top-2 grid h-[42px] w-[34px] place-items-center rounded-md bg-white text-center leading-none shadow-sm">
                <div>
                  <p className="text-[15px] font-semibold text-ink">{s.day}</p>
                  <p className="mt-1 text-[10px] text-ink-2">{s.month}</p>
                </div>
              </div>
            </div>
            <div className="px-2.5 pb-2.5 pt-2">
              <h3 className="text-[11px] font-bold tracking-wide text-ink">{s.title}</h3>
              <p className="text-[10.5px] text-muted">{s.subtitle}</p>
              <div className="mt-2.5 flex items-center gap-4 text-[9.5px] text-ink-2">
                <span className="flex items-center gap-1.5"><MapPin className="size-3.5 shrink-0 text-muted" />{s.city}</span>
                <span className="flex min-w-0 items-center gap-1.5 truncate"><User className="size-3.5 shrink-0 text-muted" />{s.speaker}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-[14px] font-bold text-ink">{s.price} so‘m</p>
                <a href="#" className="grid h-[22px] place-items-center rounded bg-brand px-3 text-[10px] font-semibold text-white transition hover:bg-brand-600">
                  Batafsil
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </Section>
  )
}
