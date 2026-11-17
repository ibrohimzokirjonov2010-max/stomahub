import { useMemo, useState } from 'react'
import { Award, Download, Search, Users } from 'lucide-react'
import { downloadCsv, listMyCourses, listStudents, useLoad } from '../api'
import {
  Avatar, CourseTitle, Empty, MigrationNotice, PageHead, Panel, PayPill, Progress, Segmented, btn, cx, dmy, input, PAY,
} from '../ui'

async function loadAll() {
  const [students, courses] = await Promise.all([listStudents(null), listMyCourses()])
  return { rows: students.rows, legacy: students.legacy, courses: courses.rows }
}

export default function Students() {
  const { data, status, error } = useLoad(loadAll, [])
  const [course, setCourse] = useState('all')
  const [pay, setPay] = useState('all')
  const [stage, setStage] = useState('all')
  const [q, setQ] = useState('')
  const rows = data?.rows || []

  const list = useMemo(() => rows.filter((row) => {
    if (course !== 'all' && row.courseId !== course) return false
    if (pay !== 'all' && row.paymentStatus !== pay) return false
    if (stage === 'learning' && row.completedAt) return false
    if (stage === 'done' && !row.completedAt) return false
    if (stage === 'cert' && !row.certificate) return false
    const s = q.trim().toLowerCase()
    return !s || String(row.name).toLowerCase().includes(s) || String(row.courseTitle).toLowerCase().includes(s)
  }), [rows, course, pay, stage, q])

  const stats = useMemo(() => ({
    all: rows.length,
    learning: rows.filter((r) => !r.completedAt).length,
    done: rows.filter((r) => r.completedAt).length,
    cert: rows.filter((r) => r.certificate).length,
  }), [rows])

  const exportCsv = () => {
    downloadCsv(`oquvchilar-${new Date().toISOString().slice(0, 10)}.csv`,
      ['O‘quvchi', 'Kurs', 'Yozilgan', 'To‘lov holati', 'Summa', 'Darslar', 'Progress %', 'O‘rtacha ball', 'Urinishlar', 'Tugatgan', 'Sertifikat'],
      list.map((r) => [
        r.name, r.courseTitle, dmy(r.enrolledAt), PAY[r.paymentStatus]?.label || r.paymentStatus, r.amount || 0,
        `${r.lessonsDone}/${r.lessonsTotal}`, pct(r), r.avgScore ?? '', r.attempts || 0, r.completedAt ? dmy(r.completedAt) : '', r.certificate?.code || '',
      ]))
  }

  return (
    <div>
      <PageHead
        title="O‘quvchilar"
        sub="Faqat sizning kurslaringizga yozilganlar. Har bir o‘quvchining progressi va test natijalari."
        actions={<button type="button" onClick={exportCsv} disabled={!list.length} className={btn.ghost}><Download className="size-4" /> CSV eksport</button>}
      />
      <MigrationNotice show={!!data?.legacy} text="O‘quvchilar ro‘yxati 0078 migratsiyasi qo‘llangach chiqadi (har bir muallif faqat o‘z kurslari o‘quvchilarini ko‘radi)." />

      <div className="mb-4 flex flex-col gap-3">
        <Segmented value={stage} onChange={setStage} items={[['all', 'Barchasi', stats.all], ['learning', 'O‘qiyapti', stats.learning], ['done', 'Tugatgan', stats.done], ['cert', 'Sertifikatli', stats.cert]]} />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_220px_180px]">
          <label className="relative col-span-2 block sm:col-span-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8A9AA8]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ism yoki kurs bo‘yicha qidiring" className={cx(input, 'pl-10')} />
          </label>
          <select aria-label="Kurs" value={course} onChange={(e) => setCourse(e.target.value)} className={input}>
            <option value="all">Barcha kurslar</option>
            {(data?.courses || []).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <select aria-label="To‘lov holati" value={pay} onChange={(e) => setPay(e.target.value)} className={input}>
            <option value="all">Har qanday to‘lov</option>
            <option value="paid">To‘langan</option>
            <option value="unpaid">Kutilmoqda</option>
            <option value="free">Bepul</option>
          </select>
        </div>
      </div>

      {status === 'loading' ? (
        <div className="space-y-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-[72px] animate-pulse rounded-2xl bg-white" />)}</div>
      ) : status === 'error' ? (
        <Panel><Empty title="Ro‘yxat ochilmadi" text={error} /></Panel>
      ) : !rows.length ? (
        <Panel><Empty icon={Users} title="Hali o‘quvchi yo‘q" text={data?.legacy ? 'Migratsiya qo‘llangach ro‘yxat shu yerda chiqadi.' : 'Kursingizga birinchi o‘quvchi yozilganda shu yerda ko‘rinadi.'} /></Panel>
      ) : !list.length ? (
        <Panel><Empty icon={Search} title="Mos o‘quvchi topilmadi" text="Filtrlarni o‘zgartiring." /></Panel>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-[#E4ECEE] bg-white shadow-[0_1px_2px_rgb(16_40_60/0.04)] lg:block">
            <table className="w-full table-fixed text-left">
              <thead className="border-b border-[#EEF3F5] bg-[#FAFCFC] text-[11.5px] font-bold uppercase tracking-[0.08em] text-[#7A8C99]">
                <tr>
                  <th className="w-[26%] px-5 py-3">O‘quvchi</th>
                  <th className="w-[13%] px-3 py-3">Yozilgan</th>
                  <th className="w-[12%] px-3 py-3">To‘lov</th>
                  <th className="w-[19%] px-3 py-3">Progress</th>
                  <th className="w-[10%] px-3 py-3">Test bali</th>
                  <th className="w-[20%] px-3 py-3">Sertifikat</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={`${r.userId}:${r.courseId}`} className="border-b border-[#EEF3F5] last:border-0 hover:bg-[#FAFCFC]">
                    <td className="px-5 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar src={r.avatar} name={r.name} size={38} />
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-semibold text-[#0B1F3A]">{r.name}</p>
                          <CourseTitle className="text-[12.5px] text-[#6B7F8D]">{r.courseTitle}</CourseTitle>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[13px] text-[#3F5263]">{dmy(r.enrolledAt)}</td>
                    <td className="px-3 py-3"><PayPill status={r.paymentStatus} /></td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <Progress value={pct(r)} className="flex-1" />
                        <span className="w-[58px] shrink-0 text-right text-[12.5px] font-semibold text-[#0B1F3A]">{r.lessonsDone}/{r.lessonsTotal}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[13.5px]"><Score value={r.avgScore} attempts={r.attempts} /></td>
                    <td className="px-3 py-3"><Cert row={r} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-2.5 lg:hidden">
            {list.map((r) => (
              <article key={`${r.userId}:${r.courseId}`} className="rounded-2xl border border-[#E4ECEE] bg-white p-3.5 shadow-[0_1px_2px_rgb(16_40_60/0.04)]">
                <div className="flex items-center gap-3">
                  <Avatar src={r.avatar} name={r.name} size={42} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-semibold text-[#0B1F3A]">{r.name}</p>
                    <CourseTitle className="text-[12.5px] text-[#6B7F8D]">{r.courseTitle}</CourseTitle>
                  </div>
                  <PayPill status={r.paymentStatus} />
                </div>
                <div className="mt-3 flex items-center gap-2.5">
                  <Progress value={pct(r)} className="flex-1" />
                  <span className="text-[12.5px] font-semibold text-[#0B1F3A]">{r.lessonsDone}/{r.lessonsTotal} dars</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[#EEF3F5] pt-2.5 text-[12px]">
                  <Cell label="Yozilgan" value={dmy(r.enrolledAt)} />
                  <Cell label="Test bali" value={r.avgScore == null ? '—' : `${r.avgScore}%`} />
                  <Cell label="Sertifikat" value={r.certificate ? 'Berilgan' : r.completedAt ? 'Yo‘q' : '—'} good={!!r.certificate} />
                </div>
              </article>
            ))}
          </div>
          <p className="mt-3 text-[12.5px] text-[#7A8C99]">Ko‘rsatilmoqda: {list.length} / {rows.length}</p>
        </>
      )}
    </div>
  )
}

function pct(r) {
  return r.lessonsTotal ? Math.round((Number(r.lessonsDone) / Number(r.lessonsTotal)) * 100) : 0
}

function Score({ value, attempts }) {
  if (value == null) return <span className="text-[#98A8B3]">—</span>
  const tone = value >= 85 ? 'text-[#0B6B5F]' : value >= 70 ? 'text-[#0B1F3A]' : 'text-[#B45309]'
  return <span className={cx('font-bold', tone)}>{value}%<span className="ml-1 text-[11.5px] font-normal text-[#8A9AA8]">· {attempts} ur.</span></span>
}

function Cert({ row }) {
  if (row.certificate) {
    return (
      <span className="inline-flex min-w-0 items-center gap-2 text-[12.5px]">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#E7F6F2] text-[#0B6B5F]"><Award className="size-3.5" /></span>
        <span className="min-w-0"><span className="block truncate font-semibold text-[#0B1F3A]">{row.certificate.code}</span><span className="block text-[11.5px] text-[#7A8C99]">{dmy(row.certificate.issuedAt)}</span></span>
      </span>
    )
  }
  if (row.completedAt) return <span className="text-[12.5px] text-[#7A8C99]">Tugatgan, sertifikatsiz</span>
  return <span className="text-[12.5px] text-[#98A8B3]">Hali yo‘q</span>
}

function Cell({ label, value, good }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-[#8A9AA8]">{label}</p>
      <p className={cx('truncate font-semibold', good ? 'text-[#0B6B5F]' : 'text-[#0B1F3A]')}>{value}</p>
    </div>
  )
}
