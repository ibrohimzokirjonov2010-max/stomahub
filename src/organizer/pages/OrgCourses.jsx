import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { authoredCourses, courseError, deleteCourse } from '../../courseApi'
import { directions, formats, levels, money } from '../../educationData'

const STATUS = { draft: 'Qoralama', published: 'Nashr', archived: 'Arxiv' }

export default function OrgCourses() {
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    authoredCourses()
      .then((data) => { setRows(Array.isArray(data) ? data : []); setError('') })
      .catch((e) => setError(courseError(e)))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const remove = async (row) => {
    if (!window.confirm(row.enrolled ? 'Yozilganlar bor. Kurs arxivlanadi.' : 'Kurs o‘chirilsinmi?')) return
    try {
      await deleteCourse(row.id)
      load()
    } catch (e) { setError(courseError(e)) }
  }

  return (
    <div className="mx-auto max-w-[980px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold text-[#10283F]">Kurslar</h1>
          <p className="mt-0.5 text-[13px] text-[#5b7280]">Video darslar, test va sertifikat. Narx saqlanadi, to‘lov keyinroq.</p>
        </div>
        <Link to="/tashkilotchi/kurslar/yangi" className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#0F766E] px-4 text-[13.5px] font-semibold text-white">
          <Plus className="size-4" /> Yangi kurs
        </Link>
      </div>
      {error && <p className="mt-3 rounded-xl bg-[#fff4f4] px-3 py-2 text-[13px] text-[#b42318]">{error}</p>}
      {loading ? <p className="mt-6 text-[13px] text-[#6b7c8f]">Yuklanmoqda…</p> : !rows.length ? (
        <div className="mt-4 rounded-2xl border border-dashed border-[#cfe3e0] bg-white px-4 py-10 text-center">
          <p className="text-[15px] font-semibold text-[#10283F]">Hali kurs yo‘q</p>
          <p className="mt-1 text-[13px] text-[#6b7c8f]">Birinchi kursni qo‘shing, videoni Bunny’ga yuklang va nashr qiling.</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          {rows.map((row) => (
            <article key={row.id} className="flex gap-3 rounded-2xl bg-white p-3 shadow-card">
              {row.cover ? <img src={row.cover} alt="" className="h-[72px] w-[108px] shrink-0 rounded-xl object-cover" /> : <span className="h-[72px] w-[108px] shrink-0 rounded-xl bg-[linear-gradient(135deg,#0b6d73,#143044)]" />}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[15px] font-bold text-[#10283F]">{row.title}</h2>
                  <span className="rounded-full bg-[#e7f6f4] px-2 py-0.5 text-[11px] font-semibold text-[#0F766E]">{STATUS[row.status] || row.status}</span>
                </div>
                <p className="mt-1 text-[12.5px] text-[#5b7280]">
                  {directions.find(([k]) => k === row.direction)?.[1] || row.direction}
                  {' · '}{levels.find(([k]) => k === row.level)?.[1] || row.level}
                  {' · '}{formats.find(([k]) => k === row.format)?.[1] || row.format}
                  {' · '}{row.lessons} dars · {money(row.price)} · {row.enrolled || 0} yozilgan
                </p>
                <div className="mt-2 flex gap-3 text-[12.5px] font-semibold">
                  <Link to={`/tashkilotchi/kurslar/${row.id}`} className="text-[#0F766E]">Tahrirlash</Link>
                  {row.status === 'published' && <Link to={`/talim/${row.id}`} className="text-[#0F766E]">Ko‘rish</Link>}
                  <button type="button" onClick={() => remove(row)} className="text-[#b42318]">{row.enrolled ? 'Arxivlash' : 'O‘chirish'}</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
