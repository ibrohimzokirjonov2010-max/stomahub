import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpenCheck, Copy, Eye, MoreHorizontal, Pencil, Plus, Search, Send, Trash2, Undo2, EyeOff, Users, AlertTriangle,
} from 'lucide-react'
import { directions } from '../../educationData'
import { formatDuration } from '../../courseRules'
import { duplicateCourse, listMyCourses, removeCourse, setCourseStatus, useLoad } from '../api'
import { BASE } from '../AuthorShell'
import { Cover, CourseTitle, Empty, MigrationNotice, PageHead, Panel, Segmented, Sheet, StatusPill, btn, cx, dmy, input, som } from '../ui'

const DIR = Object.fromEntries(directions)

export default function Courses() {
  const { data, status, error, reload } = useLoad(listMyCourses, [])
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const [menu, setMenu] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [toast, setToast] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const rows = data?.rows || []

  useEffect(() => {
    const text = location.state?.toast
    if (!text) return undefined
    setToast(text)
    navigate(location.pathname, { replace: true, state: null })
    const t = setTimeout(() => setToast(''), 2600)
    return () => clearTimeout(t)
  }, [location.state])

  const counts = useMemo(() => {
    const c = { all: rows.length, published: 0, review: 0, draft: 0, archived: 0 }
    rows.forEach((row) => { c[row.status] = (c[row.status] || 0) + 1 })
    return c
  }, [rows])

  const list = rows.filter((row) => (tab === 'all' || row.status === tab) && (!q.trim() || row.title.toLowerCase().includes(q.trim().toLowerCase())))

  const say = (text) => { setToast(text); setTimeout(() => setToast(''), 2600) }
  const act = async (row, action) => {
    setMenu(null)
    try {
      if (action === 'edit') return navigate(`${BASE}/kurslar/${row.id}/tahrir`)
      if (action === 'view') return navigate(`/talim/${row.id}`)
      if (action === 'duplicate') {
        const res = await duplicateCourse(row.id)
        say('Nusxa qoralama sifatida yaratildi')
        await reload()
        if (res?.id && res.id !== row.id) navigate(`${BASE}/kurslar/${res.id}/tahrir`)
        return null
      }
      if (action === 'remove') return setConfirm(row)
      const res = await setCourseStatus(row.id, action)
      say(action === 'submit' ? (res?.status === 'published' ? 'Kurs nashr qilindi' : 'Moderatsiyaga yuborildi') : action === 'unpublish' ? 'Kurs nashrdan olindi' : 'Moderatsiyadan qaytarildi')
      await reload()
    } catch (e) {
      say(e.message || 'Amal bajarilmadi')
    }
    return null
  }

  const doRemove = async () => {
    const row = confirm
    setConfirm(null)
    try {
      const res = await removeCourse(row.id)
      say(res?.archived ? 'Kurs arxivlandi' : 'Kurs o‘chirildi')
      await reload()
    } catch (e) { say(e.message || 'O‘chirilmadi') }
  }

  return (
    <div>
      <PageHead
        title="Kurslarim"
        sub="Qoralama, moderatsiya va nashr qilingan kurslaringiz"
        actions={<Link to={`${BASE}/kurslar/yangi`} className={cx(btn.primary, 'hidden md:inline-flex')}><Plus className="size-4" /> Yangi kurs</Link>}
      />
      <MigrationNotice show={!!data?.legacy} text="Moderatsiya, nusxa olish va daromad ustunlari 0078 migratsiyasi qo‘llangach to‘liq ishlaydi. Hozir «Nashr qilish» eski usulda ishlaydi." />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented value={tab} onChange={setTab} items={[
          ['all', 'Barchasi', counts.all], ['published', 'Nashr', counts.published], ['review', 'Moderatsiyada', counts.review], ['draft', 'Qoralama', counts.draft], ['archived', 'Arxiv', counts.archived],
        ]} />
        <label className="relative block lg:w-[300px]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8A9AA8]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kurs nomini qidiring" className={cx(input, 'pl-10')} />
        </label>
      </div>

      {status === 'loading' ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-[104px] animate-pulse rounded-2xl bg-white" />)}</div>
      ) : status === 'error' ? (
        <Panel><Empty title="Kurslar ochilmadi" text={error} /></Panel>
      ) : !rows.length ? (
        <Panel>
          <Empty icon={BookOpenCheck} title="Hali kurs yo‘q" text="Konstruktor orqali birinchi kursingizni yarating: modullar, video, test va sertifikat."
            action={<Link to={`${BASE}/kurslar/yangi`} className={btn.primary}><Plus className="size-4" /> Kurs yaratish</Link>} />
        </Panel>
      ) : !list.length ? (
        <Panel><Empty icon={Search} title="Mos kurs topilmadi" text="Filtr yoki qidiruvni o‘zgartiring." /></Panel>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-[#E4ECEE] bg-white shadow-[0_1px_2px_rgb(16_40_60/0.04)] lg:block">
            <div className="grid grid-cols-[minmax(0,1fr)_136px_84px_150px_96px_44px] gap-4 border-b border-[#EEF3F5] bg-[#FAFCFC] px-5 py-3 text-[11.5px] font-bold uppercase tracking-[0.08em] text-[#7A8C99]">
              <span>Kurs</span><span>Holat</span><span>O‘quvchilar</span><span>Daromad</span><span>Yangilangan</span><span />
            </div>
            {list.map((row) => (
              <div key={row.id} className="grid grid-cols-[minmax(0,1fr)_136px_84px_150px_96px_44px] items-center gap-4 border-b border-[#EEF3F5] px-5 py-3.5 last:border-0 hover:bg-[#FAFCFC]">
                <Link to={`${BASE}/kurslar/${row.id}/tahrir`} className="flex min-w-0 items-center gap-3.5">
                  <Cover src={row.cover} className="h-[56px] w-[84px] shrink-0 rounded-xl" />
                  <span className="min-w-0">
                    <CourseTitle className="text-[14px] font-bold text-[#0B1F3A]">{row.title}</CourseTitle>
                    <span className="mt-1 block truncate text-[12.5px] text-[#6B7F8D]">{meta(row)}</span>
                  </span>
                </Link>
                <StatusPill status={row.status} className="justify-self-start" />
                <span className="text-[14px] font-semibold text-[#0B1F3A]">{row.enrolled || 0}</span>
                <span className="text-[13.5px] text-[#0B1F3A]">{row.paidSum == null ? '—' : <><b>{som(row.paidSum)}</b>{Number(row.pendingSum) > 0 && <span className="block text-[11.5px] text-[#9A5B00]">+{som(row.pendingSum)} kutilmoqda</span>}</>}</span>
                <span className="text-[12.5px] text-[#6B7F8D]">{dmy(row.updatedAt)}</span>
                <button type="button" aria-label="Amallar" onClick={() => setMenu(row)} className="grid size-11 place-items-center rounded-xl text-[#5B6F7E] hover:bg-[#EEF3F5]"><MoreHorizontal className="size-5" /></button>
                {row.status === 'draft' && row.moderationNote ? <div className="col-span-full -mt-1 pl-[98px]"><Rejected note={row.moderationNote} /></div> : null}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 lg:hidden">
            {list.map((row) => (
              <article key={row.id} className="overflow-hidden rounded-2xl border border-[#E4ECEE] bg-white shadow-[0_1px_2px_rgb(16_40_60/0.04)]">
                <Link to={`${BASE}/kurslar/${row.id}/tahrir`} className="flex gap-3 p-3">
                  <Cover src={row.cover} className="h-[72px] w-[104px] shrink-0 rounded-xl" />
                  <span className="min-w-0 flex-1">
                    <StatusPill status={row.status} />
                    <CourseTitle className="mt-1.5 block text-[14.5px] font-bold text-[#0B1F3A]">{row.title}</CourseTitle>
                    <span className="mt-1 block truncate text-[12px] text-[#6B7F8D]">{meta(row)}</span>
                  </span>
                </Link>
                {row.status === 'draft' && row.moderationNote ? <div className="px-3 pb-2"><Rejected note={row.moderationNote} /></div> : null}
                <div className="flex items-center gap-4 border-t border-[#EEF3F5] px-3 py-1.5 text-[12.5px] text-[#4F6373]">
                  <span className="inline-flex items-center gap-1.5"><Users className="size-3.5" />{row.enrolled || 0}</span>
                  <span className="truncate font-semibold text-[#0B1F3A]">{row.paidSum == null ? som(row.price) : som(row.paidSum)}</span>
                  <button type="button" aria-label="Amallar" onClick={() => setMenu(row)} className="ml-auto grid size-11 place-items-center rounded-xl text-[#5B6F7E]"><MoreHorizontal className="size-5" /></button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      <Sheet open={!!menu} title={menu?.title} sub={menu ? `Holat: ${menu.status === 'published' ? 'nashr qilingan' : menu.status === 'review' ? 'moderatsiyada' : menu.status === 'archived' ? 'arxiv' : 'qoralama'}` : ''} onClose={() => setMenu(null)}>
        {menu && (
          <div className="grid gap-1">
            <MenuItem icon={Pencil} label="Tahrirlash" onClick={() => act(menu, 'edit')} />
            {menu.status === 'published' && <MenuItem icon={Eye} label="Katalogda ko‘rish" onClick={() => act(menu, 'view')} />}
            <MenuItem icon={Copy} label="Nusxa olish" hint="Video va o‘quvchilarsiz qoralama" onClick={() => act(menu, 'duplicate')} />
            {(menu.status === 'draft' || menu.status === 'archived') && <MenuItem icon={Send} label="Moderatsiyaga yuborish" onClick={() => act(menu, 'submit')} />}
            {menu.status === 'review' && <MenuItem icon={Undo2} label="Moderatsiyadan qaytarish" hint="Tahrirlash uchun qoralamaga qaytadi" onClick={() => act(menu, 'withdraw')} />}
            {menu.status === 'published' && <MenuItem icon={EyeOff} label="Nashrdan olish" hint="Katalogdan yashiriladi, o‘quvchilar kirishi saqlanadi" onClick={() => act(menu, 'unpublish')} />}
            <MenuItem icon={Trash2} danger label={menu.enrolled ? 'Arxivlash' : 'O‘chirish'} onClick={() => act(menu, 'remove')} />
          </div>
        )}
      </Sheet>

      <Sheet open={!!confirm} title={confirm?.enrolled ? 'Kurs arxivlansinmi?' : 'Kurs o‘chirilsinmi?'}
        sub={confirm?.enrolled ? 'Kursga yozilganlar bor, shuning uchun u o‘chirilmaydi — arxivga o‘tadi.' : 'Bu amalni qaytarib bo‘lmaydi.'}
        onClose={() => setConfirm(null)}
        footer={<><button type="button" className={btn.ghost} onClick={() => setConfirm(null)}>Bekor qilish</button><button type="button" className={btn.danger} onClick={doRemove}>{confirm?.enrolled ? 'Arxivlash' : 'O‘chirish'}</button></>} />

      {toast && <div role="status" className="fixed bottom-[calc(96px+env(safe-area-inset-bottom))] left-1/2 z-[95] -translate-x-1/2 rounded-xl bg-[#0B1F3A] px-4 py-2.5 text-[13px] font-medium text-white shadow-xl md:bottom-6">{toast}</div>}
    </div>
  )
}

function meta(row) {
  return [DIR[row.direction], `${row.lessons || 0} dars`, row.durationSeconds ? formatDuration(row.durationSeconds) : '', Number(row.price) ? som(row.price) : 'Bepul'].filter(Boolean).join(' · ')
}

function Rejected({ note }) {
  return (
    <span className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-[#FFF5F5] px-2 py-1.5 text-[12px] leading-snug text-[#B42318]">
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" /> Moderator izohi: {note}
    </span>
  )
}

function MenuItem({ icon: Icon, label, hint, onClick, danger }) {
  return (
    <button type="button" onClick={onClick} className={cx('flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left hover:bg-[#F4F8F9]', danger ? 'text-[#B42318]' : 'text-[#0B1F3A]')}>
      <Icon className="size-[18px] shrink-0" strokeWidth={1.8} />
      <span className="min-w-0">
        <span className="block text-[14px] font-semibold">{label}</span>
        {hint && <span className="block text-[12px] text-[#7A8C99]">{hint}</span>}
      </span>
    </button>
  )
}

