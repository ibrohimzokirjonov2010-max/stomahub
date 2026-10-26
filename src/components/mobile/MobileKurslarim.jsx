import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, CircleCheck, CirclePlay, Download, Play } from 'lucide-react'
import { COURSES, courseDone, profileStore, useProfile } from '../../profileStore'
import { MobileToast } from './parts'
import MobileTabBar from './MobileTabBar'
import { BottomSheet } from './MobileSeminars'
import { SubTopBar } from './MobileManzillar'

const teal = 'text-[#0b6d73]'
const navy = 'text-[#0d2a4a]'

const TOPICS = {
  endo: ['Endodontiyaga kirish', 'Kanal anatomiyasi', 'Diagnostika va rentgen', 'Izolyatsiya va ochish', 'Ishchi uzunlikni aniqlash', 'Kanalni kengaytirish', 'Irrigatsiya protokollari', 'Obturatsiya usullari', 'Murakkab kanallar', 'Qayta davolash', 'Asoratlar va oldini olish', 'Klinik holatlar tahlili'],
  impl: ['Implantologiyaga kirish', 'Anatomiya va rejalashtirish', 'CBCT diagnostikasi', 'Jarrohlik protokoli', 'Implant tanlash', 'Joylashtirish texnikasi', 'Suyak o‘rnini bosish', 'Yumshoq to‘qima', 'Vaqtinchalik protez', 'Osteointegratsiya', 'Abutment tanlash', 'Doimiy toj', 'Reabilitatsiya', 'Asoratlar', 'Klinik holatlar'],
  orto: ['Ortodontiyaga kirish', 'Tish qo‘yilishi turlari', 'Tashxis va tahlil', 'Davolash rejasini tuzish', 'Breket tizimlari', 'Yoy tanlash', 'Aligner ko‘rsatmalari', 'Case selection', 'Aktiv davolash', 'Retensiya', 'Asoratlar', 'Yakuniy holatlar'],
  estet: ['Estetik tahlil', 'Tabassum dizayni', 'Rang tanlash', 'Kompozit qatlamlash', 'Oldingi tishlar', 'Orqa tishlar', 'Veneer ko‘rsatmalari', 'Preparatsiya', 'Sementlash', 'Parvarish va nazorat'],
  paro: ['Parodontologiyaga kirish', 'Diagnostika', 'Gigiyena protokoli', 'Konservativ davolash', 'Jarrohlik usullari', 'Regeneratsiya', 'Parvarish dasturi', 'Klinik holatlar'],
}

const lessonsOf = (c) => TOPICS[c.id].map((title, i) => ({ n: i + 1, title, minutes: 18 + ((i * 7) % 25) }))

export default function MobileKurslarim() {
  const profile = useProfile()
  const rows = COURSES.map((c) => ({ ...c, done: courseDone(profile, c) }))
  const active = rows.filter((c) => c.done < c.lessons)
  const done = rows.filter((c) => c.done === c.lessons)
  const [tab, setTab] = useState('active')
  const [player, setPlayer] = useState(null)
  const [cert, setCert] = useState(null)
  const [toast, setToast] = useState('')
  const closeToast = useCallback(() => setToast(''), [])
  const pastRef = useRef(null)
  const lock = useRef(0)

  useEffect(() => { window.scrollTo(0, 0) }, [])
  useEffect(() => {
    const onScroll = () => {
      if (Date.now() < lock.current || !pastRef.current) return
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
      setTab(pastRef.current.getBoundingClientRect().top < 200 || atBottom ? 'done' : 'active')
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const jump = (id) => {
    setTab(id)
    lock.current = Date.now() + 700
    const el = id === 'done' ? pastRef.current : null
    window.scrollTo({ top: el ? el.getBoundingClientRect().top + window.scrollY - 70 : 0, behavior: 'smooth' })
  }

  const finishLesson = (c) => {
    const next = Math.min(c.lessons, c.done + 1)
    profileStore.setCourseDone(c.id, next)
    if (next === c.lessons) {
      setPlayer(null)
      setToast(`“${c.title}” tugallandi. Sertifikat tayyor`)
    } else {
      setToast(`${next}-dars ochildi`)
    }
  }

  const tabs = [['active', 'Davom etmoqda', Play, active.length], ['done', 'Tugallangan', CircleCheck, done.length]]

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef8f7_0%,#f6faf9_28%,#f6faf9_100%)] pb-[86px]">
      <div className="px-3 pt-3">
        <SubTopBar title="Kurslarim" subtitle="Siz boshlagan va tugallagan kurslar" />

        <div role="tablist" aria-label="Kurslar" className="sticky top-0 z-20 -mx-3 mt-3 grid grid-cols-2 gap-2 bg-[#f1f9f8]/95 px-3 py-1.5 backdrop-blur">
          {tabs.map(([id, label, Icon, count]) => {
            const on = tab === id
            return (
              <button key={id} type="button" role="tab" aria-selected={on} disabled={!count} onClick={() => jump(id)} className={`flex h-11 items-center justify-center gap-1.5 rounded-xl border text-[13.5px] font-medium transition disabled:opacity-50 ${on ? 'border-transparent bg-[#0b6d73] text-white shadow-[0_4px_12px_rgb(11_109_115/0.25)]' : `border-[#e2ebee] bg-white ${teal}`}`}>
                <Icon className="size-[18px] shrink-0" strokeWidth={1.8} />
                <span className="truncate">{label}</span>
                <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-semibold ${on ? 'bg-white/20 text-white' : 'bg-[#e3f4f1] text-[#0b6d73]'}`}>{count}</span>
              </button>
            )
          })}
        </div>

        <section aria-labelledby="course-active">
          <h2 id="course-active" className={`mt-3 text-[17px] font-bold ${navy}`}>Davom etmoqda</h2>
          {active.length ? (
            <div className="mt-2 flex flex-col gap-3">
              {active.map((c) => <CourseCard key={c.id} c={c} onOpen={() => setPlayer(c)} />)}
            </div>
          ) : (
            <div className="mt-2 rounded-2xl border border-dashed border-[#cfe3e0] bg-white px-4 py-6 text-center">
              <CircleCheck className={`mx-auto size-8 ${teal}`} strokeWidth={1.5} />
              <p className={`mt-2 text-[14px] font-semibold ${navy}`}>Barcha kurslar tugallangan</p>
              <p className="mt-0.5 text-[12px] text-muted">Yangi kurslar sertifikat bilan shu yerda paydo bo‘ladi</p>
              <Link to="/talim" className="mt-3 inline-flex h-10 items-center rounded-xl bg-[#0b6d73] px-4 text-[13px] font-semibold text-white">Kurslarni ko‘rish</Link>
            </div>
          )}
        </section>

        {done.length > 0 && (
          <section ref={pastRef} aria-labelledby="course-done">
            <h2 id="course-done" className={`mt-5 text-[17px] font-bold ${navy}`}>Tugallangan kurslar</h2>
            <div className="mt-2 flex flex-col gap-3">
              {done.map((c) => <CourseCard key={c.id} c={c} onOpen={() => setCert(c)} />)}
            </div>
          </section>
        )}
      </div>

      {player && <PlayerSheet course={rows.find((c) => c.id === player.id) || player} onFinish={finishLesson} onClose={() => setPlayer(null)} />}
      {cert && <CertSheet course={cert} name={profile.name} onClose={() => setCert(null)} onToast={setToast} />}
      <MobileToast text={toast} onClose={closeToast} />
      <MobileTabBar />
    </div>
  )
}

function CourseCard({ c, onOpen }) {
  const finished = c.done === c.lessons
  const pct = Math.round((c.done / c.lessons) * 100)
  return (
    <article className="rounded-2xl border border-[#e5eef0] bg-white p-2.5 shadow-[0_1px_6px_rgb(11_31_58/0.04)]">
      <div className="flex gap-2.5">
        <button type="button" onClick={onOpen} aria-label={c.title} className="relative h-[148px] w-[118px] shrink-0 overflow-hidden rounded-xl bg-[#eef4f4]">
          <img src={c.image} alt="" className={`size-full object-cover ${c.pos}`} />
          <span className="absolute left-1 top-1 flex items-center gap-0.5 whitespace-nowrap rounded-md bg-[#0b6d73]/92 px-1 py-0.5 text-[9px] font-medium leading-none text-white">
            {finished ? <Check className="size-2.5 shrink-0" strokeWidth={3} /> : <Play className="size-2.5 shrink-0 fill-white" />}
            {finished ? 'Tugallangan' : 'Davom etmoqda'}
          </span>
        </button>
        <div className="flex min-w-0 flex-1 flex-col">
          <h3 className={`text-[15px] font-bold leading-tight ${navy}`}>{c.title}</h3>
          <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-[#5b6e80]">{c.about}</p>
          <div className="mt-2 flex items-center gap-2">
            <img src={c.avatar} alt="" className="size-8 shrink-0 rounded-full object-cover object-top" />
            <span className="min-w-0">
              <span className={`block truncate text-[12.5px] font-semibold leading-tight ${navy}`}>{c.author}</span>
              <span className="block truncate text-[11px] text-[#7a8a9c]">{c.role}</span>
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <span className="shrink-0 text-[11.5px] text-[#5b6e80]">{c.done}/{c.lessons} dars</span>
            <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#e6eef0]"><span className="block h-full rounded-full bg-[#0b6d73]" style={{ width: `${pct}%` }} /></span>
            <span className={`shrink-0 text-[12px] font-bold ${teal}`}>{pct}%</span>
          </div>
          <button type="button" onClick={onOpen} className={`mt-2.5 flex h-10 items-center justify-center gap-1.5 rounded-xl text-[13px] font-semibold active:scale-[0.98] ${finished ? `border border-[#0b8a7a]/60 bg-white ${teal}` : 'bg-[#0b6d73] text-white'}`}>
            {finished ? <CircleCheck className="size-4" /> : <Play className="size-4 fill-current" />}
            {finished ? 'Sertifikatni ko‘rish' : 'Davom ettirish'}
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </article>
  )
}

function PlayerSheet({ course, onFinish, onClose }) {
  const lessons = lessonsOf(course)
  const current = lessons[course.done]
  const [playing, setPlaying] = useState(false)
  const listRef = useRef(null)

  useEffect(() => {
    listRef.current?.querySelector('[data-current]')?.scrollIntoView({ block: 'nearest' })
  }, [course.done])

  return (
    <BottomSheet
      title={course.title}
      onClose={onClose}
      footer={current && (
        <button type="button" disabled={!playing} onClick={() => { setPlaying(false); onFinish(course) }} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0b6d73] text-[14px] font-semibold text-white disabled:opacity-40">
          <Check className="size-[18px]" /> {course.done + 1}-darsni tugatish
        </button>
      )}
    >
      {current && (
        <button type="button" onClick={() => setPlaying(true)} aria-pressed={playing} className="relative mt-1 grid aspect-video w-full place-items-center overflow-hidden rounded-2xl bg-[#0d2a4a]">
          <img src={course.image} alt="" className={`absolute inset-0 size-full object-cover opacity-60 ${course.pos}`} />
          <span className="relative grid size-14 place-items-center rounded-full bg-white/95 text-[#0b6d73] shadow-lg">
            {playing ? <span className="size-5 animate-pulse rounded-sm bg-[#0b6d73]" /> : <Play className="size-7 translate-x-0.5 fill-[#0b6d73]" />}
          </span>
          <span className="absolute bottom-2 left-2 rounded-md bg-black/55 px-2 py-1 text-[11px] font-medium text-white">{current.n}-dars · {current.minutes} daqiqa</span>
        </button>
      )}
      <p className={`mt-3 text-[15px] font-bold ${navy}`}>{current ? current.title : 'Barcha darslar ko‘rildi'}</p>
      <p className="mt-0.5 text-[12px] text-[#7a8a9c]">{playing ? 'Dars ochildi. Tugatgach, keyingisiga o‘tasiz.' : 'Boshlash uchun videoni bosing, so‘ng darsni tugating.'}</p>
      <ol ref={listRef} className="mt-3 max-h-[240px] divide-y divide-[#eef2f4] overflow-y-auto">
        {lessons.map((l) => {
          const state = l.n <= course.done ? 'done' : l.n === course.done + 1 ? 'now' : 'todo'
          return (
            <li key={l.n} data-current={state === 'now' || undefined} className="flex items-center gap-2.5 py-2">
              <span className={`grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-bold ${state === 'done' ? 'bg-[#0b6d73] text-white' : state === 'now' ? 'bg-[#e3f4f1] text-[#0b6d73] ring-2 ring-[#0b6d73]' : 'bg-[#eef2f4] text-[#8796a5]'}`}>
                {state === 'done' ? <Check className="size-3.5" strokeWidth={3} /> : l.n}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block truncate text-[13px] ${state === 'now' ? `font-semibold ${navy}` : state === 'done' ? navy : 'text-[#8796a5]'}`}>{l.title}</span>
                <span className="text-[11px] text-[#7a8a9c]">{l.minutes} daqiqa{state === 'done' ? ' · ko‘rilgan' : state === 'now' ? ' · joriy dars' : ''}</span>
              </span>
            </li>
          )
        })}
      </ol>
    </BottomSheet>
  )
}

function certOf(course, name) {
  return {
    id: `SH-KURS-${course.id.toUpperCase()}`,
    title: course.title,
    name,
    speaker: course.author,
    role: course.role,
    date: course.certDate || new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' }),
    hours: course.hours,
    cme: course.cme,
  }
}

async function downloadCert(c) {
  const W = 1400
  const H = 990
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const g = canvas.getContext('2d')
  const font = (w, px) => `${w} ${px}px Georgia, "Times New Roman", serif`
  const sans = (w, px) => `${w} ${px}px Inter, "Segoe UI", Arial, sans-serif`
  g.fillStyle = '#f7fffd'
  g.fillRect(0, 0, W, H)
  g.fillStyle = '#d7f3ee'
  g.fillRect(0, 0, 26, H)
  g.fillRect(W - 26, 0, 26, H)
  g.strokeStyle = '#0b6d73'
  g.lineWidth = 4
  g.strokeRect(58, 48, W - 116, H - 96)
  g.textAlign = 'center'
  g.fillStyle = '#0b6d73'
  g.font = sans(800, 32)
  g.fillText('StomaHub', W / 2, 150)
  g.fillStyle = '#0d2a4a'
  g.font = font(700, 78)
  g.fillText('SERTIFIKAT', W / 2, 260)
  g.font = sans(400, 24)
  g.fillStyle = '#5b7280'
  g.fillText('Mazkur sertifikat bilan tasdiqlanadiki,', W / 2, 330)
  g.fillStyle = '#0d2a4a'
  g.font = font(700, 52)
  g.fillText(c.name, W / 2, 410)
  g.fillStyle = '#0b6d73'
  g.font = sans(700, 34)
  g.fillText(`«${c.title}»`, W / 2, 480)
  g.fillStyle = '#5b7280'
  g.font = sans(400, 24)
  g.fillText('onlayn kursini muvaffaqiyatli yakunlagan', W / 2, 528)
  g.fillText(`${c.hours} soat  ·  CME ${c.cme} ball  ·  ${c.date}`, W / 2, 575)
  g.textAlign = 'left'
  g.fillStyle = '#0d2a4a'
  g.font = font(700, 28)
  g.fillText(c.speaker, 150, 820)
  g.font = sans(400, 20)
  g.fillStyle = '#5b7280'
  g.fillText(`Ma’ruzachi, ${c.role.toLowerCase()}`, 150, 854)
  g.strokeStyle = '#0d2a4a'
  g.beginPath()
  g.moveTo(150, 778)
  g.lineTo(520, 778)
  g.stroke()
  g.textAlign = 'right'
  g.fillStyle = '#0d2a4a'
  g.font = sans(700, 22)
  g.fillText(c.id, W - 150, 820)
  g.fillStyle = '#5b7280'
  g.font = sans(400, 20)
  g.fillText('stomahub.uz/sertifikatlar', W - 150, 854)
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'))
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${c.id}.png`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function CertSheet({ course, name, onClose, onToast }) {
  const c = certOf(course, name)
  const save = async () => {
    try {
      await downloadCert(c)
      onToast('Sertifikat yuklab olindi')
    } catch {
      onToast('Sertifikatni yuklab bo‘lmadi')
    }
  }
  return (
    <BottomSheet
      title="Sertifikat"
      onClose={onClose}
      footer={<button type="button" onClick={save} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0b6d73] text-[14px] font-semibold text-white"><Download className="size-[18px]" /> Yuklab olish</button>}
    >
      <div className="mt-1 overflow-hidden rounded-2xl border border-[#d7ebe7] bg-[#f7fffd] px-4 py-5 text-center">
        <p className={`text-[12px] font-bold ${teal}`}>StomaHub</p>
        <p className={`mt-1 font-serif text-[28px] tracking-wide ${navy}`}>SERTIFIKAT</p>
        <p className="mt-2 text-[12px] text-[#7a8a9c]">Mazkur sertifikat bilan tasdiqlanadiki,</p>
        <p className={`mt-1 text-[18px] font-bold ${navy}`}>{c.name}</p>
        <p className={`mt-1 text-[14px] font-semibold ${teal}`}>«{c.title}»</p>
        <p className="mt-1 text-[12px] text-[#7a8a9c]">onlayn kursini muvaffaqiyatli yakunlagan</p>
        <p className="mt-3 text-[12px] text-[#5b6e80]">{c.hours} soat · CME {c.cme} ball · {c.date}</p>
        <div className="mt-4 flex items-end justify-between text-left">
          <span>
            <span className={`block text-[13px] font-semibold ${navy}`}>{c.speaker}</span>
            <span className="block text-[11px] text-[#7a8a9c]">{c.role}</span>
          </span>
          <span className={`text-right text-[11px] ${teal}`}>{c.id}</span>
        </div>
      </div>
      <Link to="/sertifikatlar" className={`mt-3 block text-center text-[13px] font-semibold ${teal}`}>Barcha sertifikatlar</Link>
    </BottomSheet>
  )
}
