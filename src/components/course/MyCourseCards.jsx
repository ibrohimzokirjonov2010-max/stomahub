import { Link } from 'react-router-dom'
import { Award, Play } from 'lucide-react'

export function MyCourseCards({ courses, mobile }) {
  if (!courses?.length) return null
  return (
    <div className={`grid gap-3 ${mobile ? '' : 'md:grid-cols-2'}`}>
      {courses.map((c) => {
        const pct = c.pct ?? (c.lessons ? Math.round((100 * (c.done || 0)) / c.lessons) : 0)
        const complete = !!c.complete
        return (
          <article key={c.id} className="flex gap-3 rounded-2xl border border-[#e6eef2] bg-white p-2.5">
            {c.cover ? (
              <img src={c.cover} alt="" className="size-[76px] shrink-0 rounded-xl object-cover" />
            ) : (
              <span className="grid size-[76px] shrink-0 place-items-center rounded-xl bg-[linear-gradient(135deg,#0b6d73,#143044)] text-white"><Play className="size-5 fill-white" /></span>
            )}
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-[13.5px] font-bold leading-snug text-[#12263a]">{c.title}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e7eef2]">
                <div className={`h-full rounded-full ${complete ? 'bg-[#16a34a]' : 'bg-[#0F766E]'}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11.5px] font-semibold text-[#5b6b7d]">
                  {complete ? `Natija ${c.score ?? 0}%` : `${pct}%`}
                  {complete && c.points ? ` · ${c.points} ball` : ''}
                </span>
                {complete && c.certificateId ? (
                  <Link to={`/sertifikatlar?cert=${c.certificateId}`} className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#0F766E]">
                    <Award className="size-3.5" /> Sertifikat
                  </Link>
                ) : (
                  <Link to={`/talim/${c.id}`} className="text-[12px] font-semibold text-[#0F766E]">{pct ? 'Davom ettirish' : 'Boshlash'}</Link>
                )}
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
