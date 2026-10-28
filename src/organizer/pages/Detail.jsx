import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Award, Calendar, Check, ChevronDown, ChevronRight, ClipboardList, Clock, Coins, Copy,
  CreditCard, FileText, House, LayoutGrid, MapPin, MessageSquare, MoreVertical, Pencil,
  Eye, EyeOff, Plus, Ticket, Trash2, Users, Wallet, X,
} from 'lucide-react'
import { num, som } from '../data'
import { useOrg } from '../Shell'
import { cancelSeminar, deleteSeminar, duplicateSeminar, setSeminarVisible, useHub } from '../../hubStore'

const REASONS = ['Sana o‘zgardi', 'Ma’ruzachi kelmaydi', 'Joy topilmadi', 'Ishtirokchilar yetarli emas', 'Boshqa sabab']

const DESK_TABS = [
  { id: 'umumiy', label: 'Umumiy', icon: House },
  { id: 'people', label: 'Ishtirokchilar', icon: Users },
  { id: 'tickets', label: 'Chiptalar', icon: Ticket },
  { id: 'check', label: 'Check-in', icon: LayoutGrid },
  { id: 'pay', label: 'To‘lovlar', icon: CreditCard },
  { id: 'cert', label: 'Sertifikatlar', icon: Award },
  { id: 'msg', label: 'Xabarlar', icon: MessageSquare },
]

const MOBILE_TABS = DESK_TABS.filter((t) => t.id !== 'msg')

const cx = (...a) => a.filter(Boolean).join(' ')

function modelFor(id, seminars = []) {
  const sem = seminars.find((s) => s.id === id)
  if (!sem) return null
  return {
    id: sem.id,
    topic: sem.topic,
    title: sem.title,
    mobileTitle: sem.title,
    when: `${sem.date}, ${sem.startTime || '10:00'} – ${sem.endTime || '18:00'}`,
    dateLabel: sem.date,
    timeLabel: `${sem.startTime || '10:00'} – ${sem.endTime || '18:00'}`,
    place: sem.place || sem.city,
    mobilePlace: sem.place || sem.city,
    city: 'O‘zbekiston',
    published: sem.published !== false,
    venueLines: [sem.place || sem.city, sem.place && sem.city && !String(sem.place).includes(sem.city) ? sem.city : ''],
    mobileVenue: [sem.place || sem.city, sem.place && sem.city && !String(sem.place).includes(sem.city) ? sem.city : ''],
    image: sem.cover || sem.image,
    venueImage: sem.placeImg || sem.image,
    sold: sem.sold,
    seats: sem.seats,
    revenue: sem.revenue,
    mobileRevenue: sem.revenue,
    checked: sem.checked || 0,
    hours: Number(sem.form?.hours) || 0,
    minPeople: Number(sem.form?.min) || 0,
    description: sem.about || `${sem.title} — ${sem.days}. ${sem.speaker} ishtirokida.`,
    mobileDescription: sem.about || `${sem.title}. ${sem.days}.`,
    bring: String(sem.form?.bring || '').split(/[\n,;]+/).map((x) => x.trim()).filter(Boolean),
    refundPeople: sem.sold,
    refundSum: sem.revenue || 0,
    speakers: (sem.speakers || [{ name: sem.speaker, role: sem.topic, avatar: '' }]).map((sp) => ({
      name: sp.name, specialty: sp.role || sem.topic, bio: sp.bio || sem.days, avatar: sp.avatar || '',
    })),
    mobileSpeakers: (sem.speakers || [{ name: sem.speaker, role: sem.topic, avatar: '' }]).map((sp) => ({
      name: sp.name, role: sp.role || sem.topic, avatar: sp.avatar || '',
    })),
    liveStatus: sem.status,
  }
}

function useOutside(ref, onClose, active) {
  useEffect(() => {
    if (!active) return undefined
    const fn = (e) => { if (!ref.current?.contains(e.target)) onClose() }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [active, onClose, ref])
}

export default function Detail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const org = useOrg()
  const notify = org?.notify
  const hub = useHub()
  const [params, setParams] = useSearchParams()
  const m = modelFor(id, hub.seminars)
  const mobileQuery = '(max-width: 767.98px)'
  const [mobile, setMobile] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(mobileQuery).matches : false))
  const [tab, setTab] = useState('umumiy')
  const [menu, setMenu] = useState(params.get('menu') === '1')
  const [cancel, setCancel] = useState(params.get('bekor') === '1')
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [ack, setAck] = useState(() => params.get('bekor') === '1' && typeof window !== 'undefined' && window.matchMedia(mobileQuery).matches)
  const [warn, setWarn] = useState('')
  const [done, setDone] = useState(() => modelFor(id, hub.seminars)?.liveStatus === 'bekor')
  const [msg, setMsg] = useState('')
  const menuRef = useRef(null)
  const closeRef = useRef(() => {})

  useEffect(() => {
    const mq = window.matchMedia(mobileQuery)
    const fn = () => setMobile(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])

  useOutside(menuRef, () => setMenu(false), menu)

  const closeCancel = () => {
    setCancel(false)
    setWarn('')
    if (params.get('bekor')) {
      const next = new URLSearchParams(params)
      next.delete('bekor')
      setParams(next, { replace: true })
    }
  }
  closeRef.current = closeCancel

  useEffect(() => {
    if (!cancel) return undefined
    const onKey = (e) => { if (e.key === 'Escape') closeRef.current() }
    document.addEventListener('keydown', onKey)
    const main = document.querySelector('main')
    const prev = main?.style.overflow ?? ''
    if (main) main.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      if (main) main.style.overflow = prev
    }
  }, [cancel])

  useEffect(() => {
    const open = () => {
      setReason('')
      setNote('')
      setWarn('')
      setAck(window.matchMedia(mobileQuery).matches)
      setMenu(false)
      setCancel(true)
    }
    window.addEventListener('org-seminar-cancel', open)
    return () => window.removeEventListener('org-seminar-cancel', open)
  }, [])

  if (!m) {
    return (
      <div className="py-16 text-center">
        <p className="font-semibold text-[#143044]">Seminar topilmadi</p>
        <Link to="/tashkilotchi/seminarlar" className="text-[var(--color-org-teal)]">Ro‘yxatga qaytish</Link>
      </div>
    )
  }

  const edit = () => navigate(`/tashkilotchi/seminarlar/yangi?tahrir=${m.id}`)
  const duplicate = () => {
    setMenu(false)
    const copyId = duplicateSeminar(m.id)
    notify?.(copyId ? 'Seminar nusxalandi' : 'Nusxa olinmadi')
    if (copyId) navigate(`/tashkilotchi/seminarlar/yangi?tahrir=${copyId}`)
  }
  const openCancel = () => {
    setMenu(false)
    setReason('')
    setNote('')
    setWarn('')
    setAck(mobile)
    setCancel(true)
  }
  const confirmCancel = () => {
    if (!reason || !ack) {
      setWarn(!reason ? 'Sababni tanlang' : 'Tasdiqlang')
      return
    }
    cancelSeminar(m.id, reason)
    setDone(true)
    closeCancel()
    notify?.('Seminar bekor qilindi')
  }

  const pct = Math.round((m.sold / m.seats) * 100)
  const left = m.seats - m.sold
  const checkPct = m.sold ? Math.round((m.checked / m.sold) * 100) : 0
  const toggleVisible = () => {
    setMenu(false)
    setSeminarVisible(m.id, !m.published)
    notify?.(m.published ? 'Seminar yashirildi — katalogda ko‘rinmaydi' : 'Seminar yana katalogda ko‘rinadi')
  }
  const remove = () => {
    setMenu(false)
    if (!window.confirm('Seminar butunlay o‘chirilsinmi? Bu amalni qaytarib bo‘lmaydi.')) return
    const res = deleteSeminar(m.id)
    if (!res.ok) { notify?.(res.error); return }
    notify?.('Seminar o‘chirildi')
    navigate('/tashkilotchi/seminarlar')
  }
  const actions = { edit, duplicate, openCancel, toggleVisible, remove, published: m.published, done }

  return (
    <div>
        {mobile ? (
        <MobilePage m={m} tab={tab} setTab={setTab} actions={actions} msg={msg} setMsg={setMsg} notify={notify} />
      ) : (
        <DesktopPage m={m} tab={tab} setTab={setTab} actions={actions} menu={menu} setMenu={setMenu} menuRef={menuRef} pct={pct} left={left} checkPct={checkPct} msg={msg} setMsg={setMsg} notify={notify} />
      )}
      {cancel && (
        <CancelDialog
          sheet={mobile}
          m={m}
          reason={reason}
          setReason={setReason}
          note={note}
          setNote={setNote}
          ack={ack}
          setAck={setAck}
          warn={warn}
          onClose={closeCancel}
          onConfirm={confirmCancel}
        />
      )}
    </div>
  )
}

function ActionMenu({ open, actions }) {
  if (!open) return null
  const item = 'flex w-full items-center gap-2.5 px-3.5 py-[9px] text-left text-[13.5px] text-[#243e4a] hover:bg-[#f6fbfa]'
  return (
    <div className="absolute right-0 top-[calc(100%+6px)] z-40 w-[196px] overflow-hidden rounded-xl border border-[#e7eeed] bg-white py-1 shadow-[0_10px_28px_rgb(16_40_50/0.14)]">
      <button type="button" className={item} onClick={actions.edit}><Pencil className="size-4 text-[#5e787e]" /> Tahrirlash</button>
      <button type="button" className={item} onClick={actions.duplicate}><Copy className="size-4 text-[#5e787e]" /> Nusxalash</button>
      <button type="button" className={item} onClick={actions.toggleVisible}>{actions.published ? <EyeOff className="size-4 text-[#5e787e]" /> : <Eye className="size-4 text-[#5e787e]" />} {actions.published ? 'Yashirish' : 'Ko‘rsatish'}</button>
      <button type="button" className={cx(item, 'text-[#e11d48]')} onClick={actions.openCancel}><X className="size-4" /> Bekor qilish</button>
      <button type="button" className={cx(item, 'text-[#e11d48]')} onClick={actions.remove}><Trash2 className="size-4" /> O‘chirish</button>
    </div>
  )
}

function StatusPill({ done }) {
  return (
    <span className={cx('inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-semibold', done ? 'bg-[#fde8ee] text-[#e11d48]' : 'bg-[#e7f8ee] text-[#16a34a]')}>
      <span className={cx('size-1.5 rounded-full', done ? 'bg-[#e11d48]' : 'bg-[#22a34a]')} />
      {done ? 'Bekor qilingan' : 'Faol'}
    </span>
  )
}

function Kebab({ menuRef, menu, setMenu, actions }) {
  return (
    <div ref={menuRef} className="relative">
      <button type="button" aria-label="Yana" aria-expanded={menu} onClick={() => setMenu((v) => !v)} className="grid size-9 place-items-center rounded-xl border border-[#e6eeec] bg-white text-[#5d7278] shadow-[0_1px_2px_rgb(16_40_40/0.04)]">
        <MoreVertical className="size-4" />
      </button>
      <ActionMenu open={menu} actions={actions} />
    </div>
  )
}

function TabStrip({ tabs, value, onChange, stacked }) {
  return (
    <div className={cx('flex', stacked ? 'justify-between gap-0.5' : 'gap-0.5 overflow-x-auto')}>
      {tabs.map((t) => {
        const Icon = t.icon
        const on = value === t.id
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={cx(
              stacked
                ? 'flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium leading-none tracking-[-0.02em]'
                : 'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-[13px] font-medium',
              on ? 'bg-[#e7f6f3] font-semibold text-[var(--color-org-teal)]' : 'text-[#5e7380] hover:bg-white/80',
            )}
          >
            <Icon className={stacked ? 'size-[18px]' : 'size-4'} strokeWidth={1.8} />
            <span className={stacked ? 'whitespace-nowrap' : ''}>{t.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function Panel({ children, className }) {
  return <section className={cx('rounded-2xl border border-[#e7f2f0] bg-white p-4 shadow-[0_1px_2px_rgb(16_40_40/0.04)]', className)}>{children}</section>
}

function Heading({ icon: Icon, children, extra }) {
  return (
    <div className="mb-2.5 flex items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 text-[15px] font-bold text-[#143044]">
        <Icon className="size-[18px] text-[var(--color-org-teal)]" strokeWidth={1.8} />
        {children}
      </h2>
      {extra}
    </div>
  )
}

function DesktopPage({ m, tab, setTab, actions, menu, setMenu, menuRef, pct, left, checkPct, msg, setMsg, notify }) {
  return (
    <div>
      <div className="flex items-start gap-4">
        <img src={m.image} alt="" className="h-[92px] w-[140px] shrink-0 rounded-2xl object-cover" />
        <div className="min-w-0 flex-1 pt-0.5">
          <span className="inline-flex rounded-md bg-[#e5f7f4] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-org-teal)]">{m.topic}</span>
          <h1 className="mt-1.5 text-[22px] font-bold leading-tight tracking-[-0.02em] text-[#143044]">{m.title}</h1>
          <div className="mt-2 flex flex-wrap items-start gap-x-5 gap-y-1 text-[13px] text-[#5e7380]">
            <span className="inline-flex items-center gap-1.5 pt-px">
              <Calendar className="size-4 text-[var(--color-org-teal)]" strokeWidth={1.8} />
              {m.when}
            </span>
            <span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4 text-[var(--color-org-teal)]" strokeWidth={1.8} />
                {m.place}
              </span>
              <span className="mt-0.5 block pl-[22px] text-[12.5px] text-[#8aa0a6]">{m.city}</span>
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusPill done={actions.done} />
          <Kebab menuRef={menuRef} menu={menu} setMenu={setMenu} actions={actions} />
        </div>
      </div>

      <div className="mt-3.5">
        <TabStrip tabs={DESK_TABS} value={tab} onChange={setTab} />
      </div>

      {tab === 'umumiy' && (
        <>
          <section className="mt-3 grid grid-cols-2 gap-3 min-[1200px]:grid-cols-4">
            <KpiCard icon={Users} label="Sotilgan chiptalar" value={`${m.sold} / ${m.seats}`} progress={pct} />
            <KpiCard icon={Wallet} label="Jami daromad" value={som(m.revenue)} />
            <KpiCard icon={LayoutGrid} label="Check-in qilganlar" value={String(m.checked)} accent={` (${checkPct}%)`} />
            <KpiCard icon={Ticket} label="Qolgan chiptalar" value={`${left} ta`} />
          </section>
          <div className="mt-3 grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_400px]">
            <div className="space-y-2.5">
              <Panel>
                <Heading icon={FileText}>Seminar tavsifi</Heading>
                <p className="text-[13.5px] leading-relaxed text-[#3e5560]">{m.description}</p>
              </Panel>
              <div className="grid gap-3 sm:grid-cols-2">
                <Panel>
                  <div className="flex items-center gap-3">
                    <IconBox icon={Clock} />
                    <div>
                      <p className="text-[12px] text-[#7e9398]">Kredit soati</p>
                      <p className="text-[20px] font-bold leading-tight text-[#143044]">{m.hours ? `${m.hours} soat` : '—'}</p>
                      <p className="text-[11.5px] text-[#8aa0a4]">Davomiy ta’lim uchun</p>
                    </div>
                  </div>
                </Panel>
                <Panel>
                  <div className="flex items-center gap-3">
                    <IconBox icon={Users} />
                    <div>
                      <p className="text-[12px] text-[#7e9398]">Minimal ishtirokchi soni</p>
                      <p className="text-[20px] font-bold leading-tight text-[#143044]">{m.minPeople ? `${m.minPeople} kishi` : '—'}</p>
                      <p className="text-[11.5px] text-[#8aa0a4]">Seminar o‘tkazilishi uchun</p>
                    </div>
                  </div>
                </Panel>
              </div>
              <Panel>
                <Heading
                  icon={Users}
                  extra={(
                    <button type="button" onClick={actions.edit} className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-[#b7e6de] bg-white px-2.5 text-[12.5px] font-semibold text-[var(--color-org-teal)] hover:bg-[#f4fbfa]">
                      <Plus className="size-3.5" strokeWidth={2.4} /> Ma’ruzachi qo‘shish
                    </button>
                  )}
                >
                  Ma’ruzachilar
                </Heading>
                <ul>
                  {m.speakers.map((s) => (
                    <li key={s.name} className="border-b border-[#f1f6f5] last:border-0">
                      <Link to="/tashkilotchi/maruzachilar" className="flex items-center gap-3 py-2.5">
                        <img src={s.avatar} alt="" className="size-12 shrink-0 rounded-full object-cover object-top" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[14px] font-bold text-[#143044]">{s.name}</span>
                          <span className="block text-[12.5px] text-[#7e9398]">{s.specialty}</span>
                        </span>
                        <span className="hidden max-w-[190px] text-[12.5px] leading-snug text-[#6e868c] sm:block">{s.bio}</span>
                        <ChevronRight className="size-4 shrink-0 text-[#c5d0d4]" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
            <div className="space-y-2.5">
              <Panel>
                <Heading icon={ClipboardList}>Olib kelish kerak narsalar</Heading>
                <ul className="space-y-2.5">
                  {!m.bring.length && <li className="text-[13px] text-[#8aa0a6]">Ko‘rsatilmagan</li>}
                  {m.bring.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-[13.5px] text-[#3e5560]">
                      <Check className="mt-0.5 size-4 shrink-0 text-[#22a34a]" strokeWidth={2.6} />
                      {b}
                    </li>
                  ))}
                </ul>
              </Panel>
              <Panel>
                <Heading icon={MapPin}>Seminar joyi</Heading>
                <div className="relative h-[104px] overflow-hidden rounded-xl">
                  <img src={m.venueImage} alt="" className="h-full w-full object-cover object-center" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c3040]/80 via-[#0c3040]/15 to-transparent" />
                  <p className="absolute bottom-2.5 left-3 text-[14px] font-bold leading-tight text-white drop-shadow-[0_1px_2px_rgb(0_0_0/0.45)]">
                    {m.venueLines[0]}{m.venueLines[1] ? <><br />{m.venueLines[1]}</> : null}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex items-start gap-1.5 text-[12.5px] font-bold leading-snug text-[#143044]">
                      <MapPin className="mt-0.5 size-3.5 shrink-0 text-[var(--color-org-teal)]" />
                      <span className="whitespace-nowrap">{m.place}</span>
                    </p>
                    <p className="pl-[22px] text-[12.5px] text-[#7e9398]">{m.city}</p>
                  </div>
                  <a href="https://www.google.com/maps/search/?api=1&query=Tashkent+City+Congress+Centre" target="_blank" rel="noreferrer" className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-[var(--color-org-teal)] px-2.5 text-[12px] font-semibold text-white hover:bg-[#0a7e76]">
                    <MapPin className="size-3.5" /> Xaritada ochish
                  </a>
                </div>
              </Panel>
            </div>
          </div>
        </>
      )}

      {tab !== 'umumiy' && <SidePanels tab={tab} m={m} msg={msg} setMsg={setMsg} notify={notify} />}
    </div>
  )
}

function IconBox({ icon: Icon, size = 'size-11' }) {
  return (
    <span className={cx('grid shrink-0 place-items-center rounded-2xl bg-[#e7f7f4] text-[var(--color-org-teal)]', size)}>
      <Icon className="size-5" strokeWidth={1.8} />
    </span>
  )
}

function KpiCard({ icon: Icon, label, value, accent, progress }) {
  return (
    <article className="flex h-full min-w-0 items-start gap-2.5 rounded-2xl border border-[#e7f2f0] bg-white px-3 py-3.5 shadow-[0_1px_2px_rgb(16_40_40/0.04)]">
      <IconBox icon={Icon} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] text-[#7e9398]">{label}</p>
        <p className="mt-0.5 whitespace-nowrap text-[17px] font-bold leading-tight tracking-tight text-[#143044]">
          {value}
          {accent && <span className="text-[13px] font-semibold text-[var(--color-org-teal)]">{accent}</span>}
        </p>
        {progress != null && (
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#e6f3f0]">
              <div className="h-full rounded-full bg-[#14b3a4]" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-[12px] font-semibold text-[var(--color-org-teal)]">{progress}%</span>
          </div>
        )}
      </div>
    </article>
  )
}

function MobilePage({ m, tab, setTab, actions, msg, setMsg, notify }) {
  return (
    <div>
      <div className="relative h-[178px] overflow-hidden rounded-[20px]">
        <img src={m.image} alt="" className="absolute inset-0 h-full w-full object-cover object-[82%_center]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#06424c_0%,#0b5c66_34%,rgb(11_92_102/0.55)_56%,rgb(11_92_102/0)_78%)]" />
        <div className="relative flex h-full flex-col p-4 text-white">
          <span className="w-fit rounded-md bg-white/20 px-2 py-0.5 text-[11px] font-semibold backdrop-blur-sm">{m.topic}</span>
          <h1 className="mt-1.5 max-w-[240px] text-[20px] font-bold leading-tight">{m.mobileTitle}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-white/95">
            <Calendar className="size-3.5 shrink-0" strokeWidth={1.8} /> {m.when}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-white/95">
            <MapPin className="size-3.5 shrink-0" strokeWidth={1.8} /> {m.mobilePlace}
          </p>
          <button type="button" onClick={actions.edit} className="mt-3 inline-flex h-8 w-fit items-center gap-1.5 rounded-lg border border-white/35 bg-white/15 px-3 text-[13px] font-semibold backdrop-blur-sm">
            <Pencil className="size-3.5" /> Tahrirlash
          </button>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1.5 text-[11.5px] font-semibold">
        <button type="button" onClick={actions.duplicate} className="flex h-10 flex-col items-center justify-center rounded-xl border border-[#e6eeec] bg-white text-[#243e4a]"><Copy className="size-3.5" />Nusxalash</button>
        <button type="button" onClick={actions.toggleVisible} className="flex h-10 flex-col items-center justify-center rounded-xl border border-[#e6eeec] bg-white text-[#243e4a]">{actions.published ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}{actions.published ? 'Yashirish' : 'Ko‘rsatish'}</button>
        <button type="button" onClick={actions.openCancel} className="flex h-10 flex-col items-center justify-center rounded-xl border border-[#fbd5df] bg-white text-[#e11d48]"><X className="size-3.5" />Bekor qilish</button>
        <button type="button" onClick={actions.remove} className="flex h-10 flex-col items-center justify-center rounded-xl border border-[#fbd5df] bg-white text-[#e11d48]"><Trash2 className="size-3.5" />O‘chirish</button>
      </div>

      <div className="mt-3">
        <TabStrip tabs={MOBILE_TABS} value={tab} onChange={setTab} stacked />
      </div>

      {tab === 'umumiy' && (
        <>
          <section className="mt-3 grid grid-cols-2 gap-2.5">
            <MobileKpi icon={Ticket} label="Jami chipta" value={`${m.sold} / ${m.seats}`} progress={Math.round((m.sold / m.seats) * 100)} foot="chipta sotildi" />
            <MobileKpi icon={Coins} label="Jami daromad" value={num(m.mobileRevenue)} unit="so‘m" />
            <MobileKpi icon={FileText} label="Kredit soati" value={m.hours ? String(m.hours) : '—'} unit={m.hours ? 'soat' : ''} />
            <MobileKpi icon={Users} label="Minimal ishtirokchi soni" value={m.minPeople ? String(m.minPeople) : '—'} unit={m.minPeople ? 'kishi' : ''} />
          </section>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-[#143044]">Ma’ruzachilar</h2>
              <Link to="/tashkilotchi/maruzachilar" className="inline-flex items-center gap-0.5 text-[12.5px] font-semibold text-[var(--color-org-teal)]">
                Barchasini ko‘rish <ChevronRight className="size-3.5" />
              </Link>
            </div>
            <div className="overflow-hidden rounded-2xl border border-[#e7f2f0] bg-white shadow-[0_1px_2px_rgb(16_40_40/0.04)]">
              {m.mobileSpeakers.map((s, i) => (
                <Link key={s.name} to="/tashkilotchi/maruzachilar" className={cx('flex items-center gap-3 px-3 py-3', i > 0 && 'border-t border-[#f1f6f5]')}>
                  <img src={s.avatar} alt="" className="size-11 shrink-0 rounded-full object-cover object-top" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-bold text-[#143044]">{s.name}</span>
                    <span className="block text-[12.5px] text-[#7e9398]">{s.role}</span>
                  </span>
                  <ChevronRight className="size-4 text-[#c5d0d4]" />
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <Panel className="p-3">
              <div className="flex items-start gap-2">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e7f7f4] text-[var(--color-org-teal)]"><Calendar className="size-[18px]" strokeWidth={1.8} /></span>
                <div>
                  <p className="text-[11px] text-[#7e9398]">Seminar kuni</p>
                  <p className="text-[13px] font-bold leading-tight text-[#143044]">{m.dateLabel}</p>
                  <p className="text-[11.5px] text-[#7e9398]">{m.timeLabel}</p>
                </div>
              </div>
            </Panel>
            <a href="https://www.google.com/maps/search/?api=1&query=Tashkent+City+Congress+Centre" target="_blank" rel="noreferrer" className="rounded-2xl border border-[#e7f2f0] bg-white p-3 shadow-[0_1px_2px_rgb(16_40_40/0.04)]">
              <div className="flex items-start gap-2">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e7f7f4] text-[var(--color-org-teal)]"><MapPin className="size-[18px]" strokeWidth={1.8} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-[#7e9398]">Zal manzili</p>
                  <p className="text-[13px] font-bold leading-tight text-[#143044]">{m.mobileVenue[0]}</p>
                  {m.mobileVenue[1] && <p className="text-[12.5px] font-semibold leading-tight text-[#143044]">{m.mobileVenue[1]}</p>}
                </div>
                <ChevronRight className="mt-3 size-4 shrink-0 text-[#c5d0d4]" />
              </div>
            </a>
          </div>

          <Panel className="mt-3">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-[#143044]">Tavsif</h2>
              <button type="button" onClick={actions.edit} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--color-org-teal)]">
                <Pencil className="size-3.5" /> O‘zgartirish
              </button>
            </div>
            <p className="text-[13px] leading-relaxed text-[#4a6570]">{m.mobileDescription}</p>
          </Panel>
        </>
      )}

      {tab !== 'umumiy' && <SidePanels tab={tab} m={m} msg={msg} setMsg={setMsg} notify={notify} />}
    </div>
  )
}

function MobileKpi({ icon: Icon, label, value, unit, progress, foot }) {
  return (
    <article className="rounded-2xl border border-[#e7f2f0] bg-white p-3 shadow-[0_1px_2px_rgb(16_40_40/0.04)]">
      <div className="flex items-start gap-2">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e7f7f4] text-[var(--color-org-teal)]">
          <Icon className="size-[18px]" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] leading-tight text-[#7e9398]">{label}</p>
          <p className="mt-0.5 text-[18px] font-bold leading-none tracking-tight text-[#143044]">{value}</p>
          {unit && <p className="mt-0.5 text-[12px] text-[#6e868c]">{unit}</p>}
        </div>
      </div>
      {progress != null && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e6f3f0]">
          <div className="h-full rounded-full bg-[#14b3a4]" style={{ width: `${progress}%` }} />
        </div>
      )}
      {foot && <p className="mt-1.5 text-[11px] text-[#8aa0a4]">{foot}</p>}
    </article>
  )
}

function SidePanels({ tab, m, msg, setMsg, notify }) {
  const hub = useHub()
  const checkins = hub.participants.filter((person) => person.seminarId === m.id && person.arrived).slice(0, 5)
  const pays = hub.payments.filter((payment) => payment.seminarId === m.id).slice(0, 4)
  if (tab === 'people') {
    return (
      <Panel className="mt-3">
        <h2 className="text-[15px] font-bold text-[#143044]">Ishtirokchilar</h2>
        <p className="mt-1 text-[13px] text-[#5e787e]">{m.sold} kishi ro‘yxatdan o‘tgan.</p>
        <Link to="/tashkilotchi/ishtirokchilar" className="mt-3 inline-flex h-10 items-center rounded-xl bg-[var(--color-org-teal)] px-3.5 text-[13px] font-semibold text-white">Ochish</Link>
      </Panel>
    )
  }
  if (tab === 'tickets') {
    return (
      <Panel className="mt-3">
        <h2 className="text-[15px] font-bold text-[#143044]">Chiptalar</h2>
        <p className="mt-1 text-[13px] text-[#5e787e]">Chipta turlari va sotuvlar.</p>
        <Link to="/tashkilotchi/chiptalar" className="mt-3 inline-flex h-10 items-center rounded-xl bg-[var(--color-org-teal)] px-3.5 text-[13px] font-semibold text-white">Ochish</Link>
      </Panel>
    )
  }
  if (tab === 'check') {
    return (
      <Panel className="mt-3">
        <h2 className="mb-2 text-[15px] font-bold text-[#143044]">So‘nggi check-inlar</h2>
        <ul className="space-y-2">
          {checkins.map((c) => (
            <li key={c.id} className="flex items-center justify-between text-[13px]">
              <span>{c.name}</span>
              <span className="rounded-full bg-[#e7f8ee] px-2 py-0.5 text-[11px] font-semibold text-[#16a34a]">Kirish qildi</span>
            </li>
          ))}
          {checkins.length === 0 && <li className="py-4 text-center text-[13px] text-[#7e9398]">Hali check-in yo‘q.</li>}
        </ul>
        <Link to="/tashkilotchi/qr" className="mt-3 inline-flex h-10 items-center rounded-xl bg-[var(--color-org-teal)] px-3.5 text-[13px] font-semibold text-white">QR Check-in</Link>
      </Panel>
    )
  }
  if (tab === 'pay') {
    return (
      <Panel className="mt-3">
        <h2 className="mb-2 text-[15px] font-bold text-[#143044]">To‘lovlar</h2>
        <ul className="space-y-2 text-[13px]">
          {pays.map((p) => (
            <li key={p.id} className="flex justify-between"><span>{p.who}</span><b>{som(p.sum)}</b></li>
          ))}
          {pays.length === 0 && <li className="py-4 text-center text-[13px] text-[#7e9398]">Hali to‘lov yo‘q.</li>}
        </ul>
        <Link to="/tashkilotchi/tolovlar" className="mt-3 inline-flex h-10 items-center rounded-xl bg-[var(--color-org-teal)] px-3.5 text-[13px] font-semibold text-white">Barcha to‘lovlar</Link>
      </Panel>
    )
  }
  if (tab === 'cert') {
    return (
      <Panel className="mt-3">
        <h2 className="text-[15px] font-bold text-[#143044]">Sertifikatlar</h2>
        <p className="mt-1 text-[13px] text-[#5e787e]">Berilgan sertifikatlarni ko‘ring va yuklab oling.</p>
        <Link to="/tashkilotchi/sertifikatlar" className="mt-3 inline-flex h-10 items-center rounded-xl bg-[var(--color-org-teal)] px-3.5 text-[13px] font-semibold text-white">Ochish</Link>
      </Panel>
    )
  }
  return (
    <Panel className="mt-3">
      <h2 className="text-[15px] font-bold text-[#143044]">Xabar yuborish</h2>
      <label className="mt-2 block text-[12.5px] font-medium text-[#1c4a5a]">Ishtirokchilarga xabar</label>
      <textarea className="mt-1.5 h-24 w-full rounded-xl border border-[#e3eeec] px-3 py-2 text-[13px] outline-none focus:border-[var(--color-org-teal)]" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Eslatma yoki o‘zgarish haqida yozing..." />
      {msg.trim().length > 0 && msg.trim().length < 5 && <p className="mt-1 text-[11.5px] text-[#e11d48]">Kamida 5 ta belgi</p>}
      <button type="button" className="mt-3 inline-flex h-10 items-center rounded-xl bg-[var(--color-org-teal)] px-3.5 text-[13px] font-semibold text-white" onClick={() => { if (msg.trim().length < 5) return; setMsg(''); notify?.('Xabar yuborildi') }}>Yuborish</button>
    </Panel>
  )
}

function FieldLabel({ children }) {
  return <span className="mb-1.5 block text-[13px] font-medium text-[#1c3d4e]">{children}</span>
}

function CancelDialog({ sheet, m, reason, setReason, note, setNote, ack, setAck, warn, onClose, onConfirm }) {
  const field = 'h-11 w-full appearance-none rounded-xl border border-[#e3eeec] bg-white text-[13.5px] outline-none focus:border-[var(--color-org-teal)]'
  return (
    <div className="fixed inset-0 z-[90]">
      <button type="button" aria-label="Yopish" className="absolute inset-0 bg-[#102433]/45" onClick={onClose} />
      <div className={sheet ? 'absolute inset-x-0 bottom-0' : 'absolute inset-0 grid place-items-center p-4'}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-title"
          className={cx(
            'relative bg-white shadow-2xl',
            sheet ? 'max-h-[92dvh] overflow-y-auto rounded-t-[24px] px-4 pb-5 pt-2' : 'max-h-[calc(100dvh-32px)] w-full max-w-[560px] overflow-y-auto rounded-[20px] px-5 pb-5 pt-4',
          )}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {sheet && <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-[#d5dee2]" />}
          <button type="button" onClick={onClose} aria-label="Yopish" className="absolute right-3 top-3 grid size-8 place-items-center rounded-lg text-[#7e9398] hover:bg-[#f4f7f7]">
            <X className="size-4" />
          </button>
          <div className="flex items-start gap-3 pr-8">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e7f7f4] text-[var(--color-org-teal)]">
              <Calendar className="size-5" strokeWidth={1.8} />
            </span>
            <div>
              <h3 id="cancel-title" className="text-[16px] font-bold leading-tight text-[#143044]">Seminarni bekor qilish</h3>
              <p className="mt-0.5 text-[12.5px] leading-snug text-[#6e868c]">
                {sheet ? 'Ushbu seminarni bekor qilmoqchimisiz?' : 'Seminarni bekor qilmoqchimisiz? Bu amalni keyin qaytarib bo‘lmaydi.'}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <FieldLabel>Bekor qilish sababi</FieldLabel>
            <div className="relative">
              {sheet && <FileText className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#90a4a8]" />}
              <select
                className={cx(field, sheet ? 'pl-10 pr-9' : 'px-3 pr-9', reason ? 'text-[#143044]' : 'text-[#9aafb4]')}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="">Sababni tanlang</option>
                {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#90a4a8]" />
            </div>
            {warn && !reason && <p className="mt-1 text-[12px] text-[#e11d48]">{warn}</p>}
          </div>

          <div className="mt-3">
            <FieldLabel>{sheet ? 'Izoh (ixtiyoriy)' : 'Qo‘shimcha izoh (ixtiyoriy)'}</FieldLabel>
            {sheet ? (
              <div className="relative">
                <MessageSquare className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#90a4a8]" />
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 500))}
                  placeholder="Qo‘shimcha ma’lumot yozing..."
                  className={cx(field, 'px-10 placeholder:text-[#9aafb4]')}
                />
              </div>
            ) : (
              <div className="relative">
                <textarea
                  maxLength={500}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Bekor qilish sababini batafsil yozing..."
                  className="h-[104px] w-full resize-none rounded-xl border border-[#e3eeec] bg-white px-3 py-2.5 pb-6 text-[13.5px] text-[#143044] outline-none placeholder:text-[#9aafb4] focus:border-[var(--color-org-teal)]"
                />
                <span className="pointer-events-none absolute bottom-2 right-3 text-[11px] text-[#a0b4b8]">{note.length}/500</span>
              </div>
            )}
          </div>

          {sheet ? (
            <div className="mt-3 flex gap-2.5 rounded-xl bg-[#f3fbf8] px-3.5 py-3">
              <span className="mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full border border-[var(--color-org-teal)] text-[11px] font-bold leading-none text-[var(--color-org-teal)]">i</span>
              <div className="text-[13px] leading-snug text-[#3e5560]">
                <p className="font-bold text-[#143044]">{m.refundPeople} nafar ishtirokchiga 100% pul qaytariladi</p>
                <p className="mt-1">Jami qaytariladigan summa: <b className="font-bold text-[#143044]">{som(m.refundSum)}</b>.</p>
                <p className="mt-1">Barcha ishtirokchilarga SMS va email orqali seminar bekor qilinganligi haqida xabar yuboriladi.</p>
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-xl bg-[#f3fbf8] px-3.5 py-3">
              <p className="mb-2 flex items-center gap-2 text-[13.5px] font-bold text-[#143044]">
                <span className="grid size-[18px] place-items-center rounded-full border border-[var(--color-org-teal)] text-[11px] font-bold leading-none text-[var(--color-org-teal)]">i</span>
                Nimalar bo‘ladi?
              </p>
              <ul className="space-y-1.5 text-[12.5px] leading-snug text-[#3e5560]">
                <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-[#22a34a]" strokeWidth={2.6} /><span>{m.refundPeople} ishtirokchiga 100% pul avtomatik qaytariladi</span></li>
                <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-[#22a34a]" strokeWidth={2.6} /><span>Jami qaytariladigan summa: <b className="font-bold text-[#143044]">{som(m.refundSum)}</b></span></li>
                <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-[#22a34a]" strokeWidth={2.6} /><span>Ishtirokchilarga seminar bekor qilingani haqida SMS va email yuboriladi.</span></li>
                <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-[#22a34a]" strokeWidth={2.6} /><span>Seminar sahifasi “Bekor qilingan” holatiga o‘tadi.</span></li>
              </ul>
            </div>
          )}

          <label className="mt-3 flex items-start gap-2.5">
            <button
              type="button"
              role="checkbox"
              aria-checked={ack}
              onClick={() => setAck((v) => !v)}
              className={cx('mt-0.5 grid size-5 shrink-0 place-items-center rounded-[5px] border', ack ? 'border-[var(--color-org-teal)] bg-[var(--color-org-teal)] text-white' : 'border-[#c9d6d8] bg-white')}
            >
              {ack && <Check className="size-3.5" strokeWidth={3} />}
            </button>
            {sheet ? (
              <span>
                <span className="block text-[13.5px] font-bold text-[#143044]">Tushundim</span>
                <span className="mt-0.5 block text-[12.5px] leading-snug text-[#5e7380]">Seminar bekor qilinganda barcha ishtirokchilarga avtomatik ravishda pul qaytariladi va xabar yuboriladi.</span>
              </span>
            ) : (
              <span className="text-[12.5px] leading-snug text-[#3e5560]">Tushundim. Seminar bekor qilinganda barcha ishtirokchilarga pul qaytariladi va bu amalni qaytarib bo‘lmaydi.</span>
            )}
          </label>
          {warn && reason && !ack && <p className="mt-1 pl-7 text-[12px] text-[#e11d48]">{warn}</p>}

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button type="button" onClick={onClose} className="h-11 rounded-xl border border-[#dbe3e6] bg-white text-[13.5px] font-semibold text-[#243e4a] hover:bg-[#f7fbfb]">Ortga</button>
            <button type="button" onClick={onConfirm} className="h-11 rounded-xl bg-[var(--color-org-teal)] px-2 text-[13.5px] font-semibold text-white hover:bg-[#0a7e76]">Bekor qilishni tasdiqlash</button>
          </div>
        </div>
      </div>
    </div>
  )
}
