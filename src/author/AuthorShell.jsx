import { NavLink, Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, BookOpenCheck, Users, Wallet, Plus, GraduationCap, CalendarDays, ArrowUpRight, ShieldCheck, UserRound,
} from 'lucide-react'
import { canEnterOrganizer, canUseOrganizer, profileName, useSession } from '../sessionStore'
import { loginHref } from '../requireAuth'
import { Avatar, btn, cx } from './ui'

export const BASE = '/kurs-muallifi'

const NAV = [
  { to: BASE, label: 'Boshqaruv paneli', short: 'Panel', icon: LayoutDashboard, end: true },
  { to: `${BASE}/kurslar`, label: 'Kurslarim', short: 'Kurslar', icon: BookOpenCheck },
  { to: `${BASE}/oquvchilar`, label: 'O‘quvchilar', short: 'O‘quvchilar', icon: Users },
  { to: `${BASE}/tolovlar`, label: 'To‘lovlar', short: 'To‘lovlar', icon: Wallet },
]

/** Kurs yaratish huquqi: tasdiqlangan tashkilotchi yoki admin (server: course_is_teacher). */
export function canAuthorCourses(profile) {
  return canUseOrganizer(profile)
}

export default function AuthorShell() {
  const session = useSession()
  const location = useLocation()
  if (session.status === 'loading') {
    return <div className="grid min-h-[60vh] place-items-center text-[13px] text-[#5B6F7E]" role="status">Yuklanmoqda…</div>
  }
  if (session.status !== 'authed') return <Navigate replace to={loginHref(location.pathname + location.search)} />
  if (!canAuthorCourses(session.profile)) return <BecomeAuthor profile={session.profile} />

  const wizard = /\/kurslar\/(yangi|[^/]+\/tahrir)/.test(location.pathname)
  const name = profileName(session.profile, session.user?.email) || 'Muallif'

  return (
    <div className="flex min-h-dvh bg-[#F3F7F8] text-[#0B1F3A]">
      <aside className="hidden w-[248px] shrink-0 self-stretch border-r border-[#E4ECEE] bg-white md:flex">
        <div className="sticky top-0 flex h-dvh min-h-dvh w-full flex-col overflow-y-auto">
        <div className="px-5 pb-4 pt-5">
          <Link to={BASE} className="flex items-center gap-2.5" aria-label="Kurs muallifi kabineti">
            <span className="grid size-10 place-items-center rounded-xl bg-[linear-gradient(135deg,#14B8A6,#0F766E)] text-white shadow-[0_8px_18px_-8px_rgb(15_118_110/0.7)]"><GraduationCap className="size-5" /></span>
            <span className="min-w-0">
              <span className="block text-[15px] font-extrabold leading-tight">StomaHub</span>
              <span className="block text-[11.5px] font-medium text-[#7A8C99]">Kurs muallifi kabineti</span>
            </span>
          </Link>
        </div>
        <div className="px-4">
          <Link to={`${BASE}/kurslar/yangi`} className={cx(btn.primary, 'w-full')}><Plus className="size-4" /> Yangi kurs</Link>
        </div>
        <nav className="mt-5 flex-1 space-y-1 px-3" aria-label="Muallif bo‘limlari">
          <p className="px-3 pb-1 text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#98A8B3]">Kabinet</p>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => cx('flex min-h-11 items-center gap-3 rounded-xl px-3 text-[14px] transition', isActive ? 'bg-[#E9F6F4] font-semibold text-[#0F766E]' : 'text-[#3F5263] hover:bg-[#F4F8F9]')}>
              <Icon className="size-[18px] shrink-0" strokeWidth={1.8} />{label}
            </NavLink>
          ))}
          <p className="px-3 pb-1 pt-5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#98A8B3]">Platforma</p>
          <a href="/talim" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-[14px] text-[#3F5263] hover:bg-[#F4F8F9]"><GraduationCap className="size-[18px]" strokeWidth={1.8} />Ta’lim katalogi<ArrowUpRight className="ml-auto size-3.5 text-[#98A8B3]" /></a>
          <Link to="/tashkilotchi" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-[14px] text-[#3F5263] hover:bg-[#F4F8F9]"><CalendarDays className="size-[18px]" strokeWidth={1.8} />Tashkilotchi kabineti</Link>
        </nav>
        <Link to="/profil" className="m-3 flex items-center gap-3 rounded-2xl border border-[#E4ECEE] p-3 hover:bg-[#F7FAFB]">
          <Avatar src={session.profile?.avatar_url || session.profile?.avatar} name={name} size={36} />
          <span className="min-w-0">
            <span className="block truncate text-[13.5px] font-semibold">{name}</span>
            <span className="block text-[11.5px] text-[#7A8C99]">Kurs muallifi</span>
          </span>
        </Link>
        </div>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
      <header className={cx('sticky top-0 z-30 border-b border-[#E4ECEE] bg-white/90 backdrop-blur md:hidden', wizard && 'hidden')}>
        <div className="flex h-14 items-center gap-3 px-4">
          <span className="grid size-9 place-items-center rounded-xl bg-[linear-gradient(135deg,#14B8A6,#0F766E)] text-white"><GraduationCap className="size-[18px]" /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-extrabold leading-tight">Kurs muallifi</span>
            <span className="block truncate text-[11.5px] text-[#7A8C99]">{name}</span>
          </span>
          <Link to="/profil" aria-label="Profil" className="grid size-11 place-items-center"><Avatar src={session.profile?.avatar_url || session.profile?.avatar} name={name} size={34} /></Link>
        </div>
      </header>

      <main className={cx('min-w-0 flex-1', wizard ? 'pb-0' : 'pb-[calc(88px+max(env(safe-area-inset-bottom),var(--safe-bottom-sim,0px)))] md:pb-10')}>
        <div className={cx('mx-auto w-full max-w-[1180px]', wizard ? '' : 'px-4 pt-4 md:px-8 md:pt-8')}>
          <Outlet />
        </div>
      </main>

      {!wizard && (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E4ECEE] bg-white/95 pb-[max(env(safe-area-inset-bottom),var(--safe-bottom-sim,0px))] backdrop-blur md:hidden" aria-label="Muallif menyusi">
          <ul className="grid h-16 grid-cols-5">
            {NAV.slice(0, 2).map((it) => <Tab key={it.to} {...it} />)}
            <li className="relative">
              <Link to={`${BASE}/kurslar/yangi`} aria-label="Yangi kurs" className="absolute left-1/2 top-0 grid size-[56px] -translate-x-1/2 -translate-y-[18px] place-items-center rounded-full bg-[linear-gradient(135deg,#14B8A6,#0F766E)] text-white shadow-[0_10px_22px_-6px_rgb(15_118_110/0.6)] ring-4 ring-white">
                <Plus className="size-6" strokeWidth={2.2} />
              </Link>
              <span className="pointer-events-none absolute inset-x-0 bottom-2 text-center text-[10.5px] leading-none text-[#8A9AA8]">Yangi</span>
            </li>
            {NAV.slice(2).map((it) => <Tab key={it.to} {...it} />)}
          </ul>
        </nav>
      )}
      </div>
    </div>
  )
}

function Tab({ to, short, icon: Icon, end }) {
  return (
    <li>
      <NavLink to={to} end={end} className={({ isActive }) => cx('flex h-full flex-col items-center justify-center gap-1 text-[10.5px] leading-none', isActive ? 'font-semibold text-[#0F766E]' : 'text-[#8A9AA8]')}>
        <Icon className="size-[22px]" strokeWidth={1.8} />{short}
      </NavLink>
    </li>
  )
}

function BecomeAuthor({ profile }) {
  const member = canEnterOrganizer(profile)
  const pending = member && profile?.org_status === 'pending'
  return (
    <div className="min-h-dvh bg-[#F3F7F8] px-4 pb-10 pt-6">
      <div className="mx-auto max-w-[560px] rounded-[24px] border border-[#E4ECEE] bg-white p-6 text-center shadow-[0_20px_50px_-24px_rgb(16_40_60/0.25)] md:p-8">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-[linear-gradient(135deg,#14B8A6,#0F766E)] text-white"><GraduationCap className="size-8" /></span>
        <h1 className="mt-4 text-[22px] font-extrabold tracking-tight">Kurs muallifi kabineti</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[#4F6373]">
          Onlayn kurs yaratish, o‘quvchilar va to‘lovlarni kuzatish uchun tasdiqlangan tashkilotchi hisobi kerak.
          {pending ? ' Arizangiz ko‘rib chiqilmoqda — tasdiqlangach kabinet ochiladi.' : ''}
        </p>
        <ul className="mx-auto mt-5 max-w-[380px] space-y-2.5 text-left text-[13.5px] text-[#2C4152]">
          {['Kurs konstruktori: modullar, video, test va sertifikat', 'O‘quvchilar progressi va test natijalari', 'To‘lovlar va daromad statistikasi'].map((t) => (
            <li key={t} className="flex items-start gap-2.5"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#0F766E]" />{t}</li>
          ))}
        </ul>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link to={member ? '/tashkilotchi/sozlamalar' : '/tashkilotchi-bolish'} className={btn.primary}>{member ? 'Arizani ko‘rish' : 'Tashkilotchi bo‘lish'}</Link>
          <Link to="/profil" className={btn.ghost}><UserRound className="size-4" /> Profilga qaytish</Link>
        </div>
      </div>
    </div>
  )
}
