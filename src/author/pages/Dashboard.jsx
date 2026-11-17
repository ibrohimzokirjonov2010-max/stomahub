import { Link } from 'react-router-dom'
import { Award, BookOpenCheck, ChartColumnBig, Clock3, Plus, TrendingUp, Users, Wallet } from 'lucide-react'
import { loadDashboard, useLoad } from '../api'
import { BASE } from '../AuthorShell'
import {
  Avatar, Cover, CourseTitle, Empty, Kpi, MigrationNotice, PageHead, Panel, PayPill, Progress, TextLink, btn, cx, dmy, monthLabel, shortSom, som,
} from '../ui'

export default function Dashboard() {
  const { data, status, error } = useLoad(loadDashboard, [])
  if (status === 'loading') return <Skeleton />
  if (status === 'error') return <Panel><Empty title="Panel ochilmadi" text={error} /></Panel>
  const t = data?.totals || {}
  const legacy = !!data?.legacy
  const enrollments = Number(t.enrollments) || 0
  const rate = enrollments && t.completed != null ? Math.round((Number(t.completed) / enrollments) * 100) : null
  const none = !Number(t.courses)

  return (
    <div>
      <PageHead
        title="Boshqaruv paneli"
        sub="Kurslaringiz, o‘quvchilar va daromad bo‘yicha umumiy ko‘rsatkichlar"
        actions={<Link to={`${BASE}/kurslar/yangi`} className={cx(btn.primary, 'hidden md:inline-flex')}><Plus className="size-4" /> Yangi kurs</Link>}
      />
      <MigrationNotice show={legacy} />

      {none ? (
        <Panel>
          <Empty
            icon={BookOpenCheck}
            title="Birinchi kursingizni yarating"
            text="Modullar, video darslar, testlar va sertifikat — barchasi bitta konstruktorda. Kurs moderatsiyadan o‘tgach katalogda chiqadi."
            action={<Link to={`${BASE}/kurslar/yangi`} className={btn.primary}><Plus className="size-4" /> Kurs yaratish</Link>}
          />
        </Panel>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <Kpi icon={Users} label="Jami o‘quvchilar" value={t.students ?? enrollments} foot={`${enrollments} ta yozilish`} />
            <Kpi icon={TrendingUp} label="Faol o‘quvchilar" value={t.active ?? '—'} foot="Kurs davom etmoqda" tone="indigo" />
            <Kpi icon={Wallet} label="Daromad, so‘m" value={t.paidSum == null ? "—" : shortSom(t.paidSum)} foot={t.pendingSum ? `+${shortSom(t.pendingSum)} kutilmoqda` : 'To‘langan yozilishlar'} tone="amber" />
            <Kpi icon={Award} label="Tugatish darajasi" value={rate == null ? '—' : `${rate}%`} foot={t.certificates != null ? `${t.certificates} ta sertifikat berilgan` : 'Kurs yakunlaganlar'} tone="rose" />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
            <Panel title="Daromad va yozilishlar" sub="Oxirgi 6 oy, Toshkent vaqti">
              <MonthChart rows={data?.monthly || []} legacy={legacy} />
            </Panel>
            <Panel title="Kurslar holati" sub={`${t.courses} ta kurs`} extra={<TextLink to={`${BASE}/kurslar`}>Barchasi</TextLink>}>
              <StatusBreakdown totals={t} />
            </Panel>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
            <Panel title="So‘nggi yozilishlar" extra={<TextLink to={`${BASE}/oquvchilar`}>Hammasi</TextLink>} body="px-2 pb-2 pt-2 md:px-3">
              <Recent rows={data?.recent || []} legacy={legacy} />
            </Panel>
            <Panel title="Top kurslar" sub="Yozilishlar soni bo‘yicha" body="px-2 pb-2 pt-2 md:px-3">
              <Top rows={data?.top || []} />
            </Panel>
          </div>
        </>
      )}
    </div>
  )
}

function MonthChart({ rows, legacy }) {
  const has = rows.some((row) => Number(row.enrollments) > 0 || Number(row.paid) > 0)
  if (!has) {
    return <Empty icon={ChartColumnBig} title="Hali ma’lumot yo‘q" text={legacy ? 'Grafik 0078 migratsiyasi qo‘llangach chiqadi.' : 'Birinchi o‘quvchi yozilgach grafik shu yerda chiqadi.'} />
  }
  const maxPaid = Math.max(1, ...rows.map((row) => Number(row.paid) || 0))
  const maxEnr = Math.max(1, ...rows.map((row) => Number(row.enrollments) || 0))
  const totalPaid = rows.reduce((s, row) => s + (Number(row.paid) || 0), 0)
  const totalEnr = rows.reduce((s, row) => s + (Number(row.enrollments) || 0), 0)
  return (
    <div>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <Legend color="bg-[#0F766E]" label="To‘langan" value={som(totalPaid)} />
        <Legend color="bg-[#A5DCD3]" label="Yozilishlar" value={`${totalEnr} ta`} />
      </div>
      <div className="mt-4 grid h-[200px] grid-cols-6 items-end gap-2 border-b border-[#E4ECEE] md:gap-4">
        {rows.map((row) => {
          const p = Math.round(((Number(row.paid) || 0) / maxPaid) * 100)
          const e = Math.round(((Number(row.enrollments) || 0) / maxEnr) * 100)
          return (
            <div key={row.month} className="group relative flex h-full items-end justify-center gap-1">
              <span className="w-[38%] max-w-[22px] rounded-t-md bg-[#0F766E] transition group-hover:bg-[#0D5F58]" style={{ height: `${Math.max(p, Number(row.paid) ? 3 : 0)}%` }} />
              <span className="w-[38%] max-w-[22px] rounded-t-md bg-[#A5DCD3]" style={{ height: `${Math.max(e, Number(row.enrollments) ? 3 : 0)}%` }} />
              <span className="pointer-events-none absolute -top-2 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-[#0B1F3A] px-2.5 py-1.5 text-[11.5px] text-white shadow-lg group-hover:block">
                {som(row.paid)} · {row.enrollments} ta
              </span>
            </div>
          )
        })}
      </div>
      <div className="mt-2 grid grid-cols-6 gap-2 text-center text-[11.5px] font-medium text-[#7A8C99] md:gap-4">
        {rows.map((row) => <span key={row.month}>{monthLabel(row.month)}</span>)}
      </div>
    </div>
  )
}

function Legend({ color, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cx('size-2.5 rounded-sm', color)} />
      <span className="text-[12.5px] text-[#5B6F7E]">{label}</span>
      <span className="text-[13px] font-bold text-[#0B1F3A]">{value}</span>
    </div>
  )
}

function StatusBreakdown({ totals }) {
  const items = [
    ['published', 'Nashr qilingan', Number(totals.published) || 0, 'bg-[#10A37F]'],
    ['review', 'Moderatsiyada', Number(totals.review) || 0, 'bg-[#F59E0B]'],
    ['draft', 'Qoralama', Number(totals.draft) || 0, 'bg-[#98A2B3]'],
  ]
  const total = Math.max(1, items.reduce((s, [, , n]) => s + n, 0))
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-[#EEF3F5]">
        {items.map(([key, , n, color]) => n > 0 && <span key={key} className={color} style={{ width: `${(n / total) * 100}%` }} />)}
      </div>
      <ul className="mt-4 space-y-1">
        {items.map(([key, label, n, color]) => (
          <li key={key} className="flex min-h-10 items-center gap-3 rounded-xl px-2 text-[13.5px]">
            <span className={cx('size-2.5 rounded-full', color)} />
            <span className="flex-1 text-[#3F5263]">{label}</span>
            <span className="font-bold text-[#0B1F3A]">{n}</span>
          </li>
        ))}
      </ul>
      {Number(totals.review) > 0 && (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-[#FFFAF0] px-3 py-2.5 text-[12.5px] leading-snug text-[#7A4B00]">
          <Clock3 className="mt-0.5 size-3.5 shrink-0" /> Moderatsiya odatda 1 ish kuni ichida ko‘rib chiqiladi.
        </p>
      )}
    </div>
  )
}

function Recent({ rows, legacy }) {
  if (!rows.length) return <Empty icon={Users} title="Hali yozilish yo‘q" text={legacy ? 'Ro‘yxat 0078 migratsiyasi qo‘llangach chiqadi.' : 'O‘quvchi kursga yozilganda shu yerda ko‘rinadi.'} />
  return (
    <ul className="divide-y divide-[#EEF3F5]">
      {rows.map((row) => {
        const pct = row.lessonsTotal ? Math.round((row.lessonsDone / row.lessonsTotal) * 100) : 0
        return (
          <li key={`${row.userId}:${row.courseId}`} className="flex items-center gap-3 px-2 py-3">
            <Avatar src={row.avatar} name={row.name} size={38} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold text-[#0B1F3A]">{row.name}</p>
              <CourseTitle className="text-[12.5px] text-[#6B7F8D]">{row.courseTitle}</CourseTitle>
            </div>
            <div className="hidden w-[120px] sm:block">
              <p className="mb-1 text-right text-[11.5px] text-[#6B7F8D]">{row.lessonsDone}/{row.lessonsTotal} dars</p>
              <Progress value={pct} />
            </div>
            <div className="flex w-[104px] flex-col items-end gap-1">
              <PayPill status={row.paymentStatus} />
              <span className="text-[11.5px] text-[#8A9AA8]">{dmy(row.enrolledAt)}</span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function Top({ rows }) {
  if (!rows.length) return <Empty icon={BookOpenCheck} title="Reyting bo‘sh" text="Kurslarga yozilish boshlangach eng ommabop kurslar shu yerda chiqadi." />
  return (
    <ol className="space-y-1">
      {rows.map((row, i) => {
        const enrolled = Number(row.enrolled) || 0
        const pct = enrolled ? Math.round(((Number(row.completed) || 0) / enrolled) * 100) : 0
        return (
          <li key={row.id}>
            <Link to={`${BASE}/kurslar/${row.id}/tahrir`} className="flex min-h-14 items-start gap-3 rounded-xl px-2 py-2.5 hover:bg-[#F5F9FA]">
              <span className="mt-2.5 w-4 text-center text-[13px] font-bold text-[#98A8B3]">{i + 1}</span>
              <Cover src={row.cover} className="h-11 w-14 shrink-0 rounded-lg" />
              <span className="min-w-0 flex-1">
                <CourseTitle className="text-[13.5px] font-semibold text-[#0B1F3A]">{row.title}</CourseTitle>
                <span className="mt-1 flex flex-wrap items-center gap-x-2 text-[12px] text-[#6B7F8D]">
                  <span>{enrolled} o‘quvchi</span>
                  {row.paidSum != null && Number(row.paidSum) > 0 && <span className="font-semibold text-[#0F766E]">{shortSom(row.paidSum)} so‘m</span>}
                </span>
                {enrolled > 0 && (
                  <span className="mt-1.5 flex items-center gap-2">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EEF3F5]"><span className="block h-full rounded-full bg-[#14B8A6]" style={{ width: `${pct}%` }} /></span>
                    <span className="text-[11px] font-semibold text-[#6B7F8D]">{pct}% tugatgan</span>
                  </span>
                )}
              </span>
            </Link>
          </li>
        )
      })}
    </ol>
  )
}

function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-56 rounded-lg bg-[#E1EAEC]" />
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-[112px] rounded-2xl bg-white" />)}</div>
      <div className="mt-4 h-[300px] rounded-2xl bg-white" />
    </div>
  )
}
