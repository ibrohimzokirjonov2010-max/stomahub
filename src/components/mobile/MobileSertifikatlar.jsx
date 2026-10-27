import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Award, GraduationCap, Clock, Star, Calendar, Eye, Download, Share2, Copy, Building2, UserRound, CircleCheck, MapPin, Monitor } from 'lucide-react'
import { certs } from '../../sertifikatData'
import { useProfile } from '../../profileStore'
import { currentUid } from '../../recordSync'
import { useSession } from '../../sessionStore'
import { Certificate, Qr, printCert } from '../../pages/Sertifikatlar'
import { MobileToast } from './parts'
import MobileTabBar from './MobileTabBar'
import { BottomSheet } from './MobileSeminars'
import { HubTopBar } from './MobileKategoriyalar'

const TABS = [
  ['all', 'Barchasi'],
  ['seminar', 'Seminarlar'],
  ['online', 'Onlayn darslar'],
  ['webinar', 'Vebinarlar'],
  ['training', 'Treninglar'],
]
const PILL = { seminar: 'Seminar', online: 'Onlayn dars', webinar: 'Vebinar', training: 'Amaliy trening' }

const sum = (key) => certs.reduce((s, c) => s + c[key], 0)
const TOTAL_CME = sum('cme')
const TOTAL_HOURS = sum('hours')
const DONE = certs.filter((c) => c.type === 'online' || c.type === 'training').length

const linkOf = (c) => `${window.location.origin}/sertifikatlar?cert=${c.id}`

export default function MobileSertifikatlar() {
  const profile = useProfile()
  const session = useSession()
  const live = profile.accountLive || !!currentUid() || session.status === 'authed'
  const owner = live ? (profile.name || 'Ism kiritilmagan') : 'Sizning ismingiz'
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState('all')
  const [toast, setToast] = useState('')
  const closeToast = useCallback(() => setToast(''), [])
  const fromProfile = (profile.certificates || []).map((c, i) => {
    const iso = (c.issuedAt || c.issued_at || '').slice(0, 10)
    return {
      id: c.id || `cert-${i}`,
      title: c.title || 'Sertifikat',
      type: 'online',
      speaker: '',
      date: iso || '',
      iso: iso || '1970-01-01',
      place: 'Onlayn',
      cme: 0,
      hours: 0,
      theme: 'teal',
    }
  })
  const source = live ? fromProfile : certs
  const open = source.find((c) => c.id === params.get('cert')) || null
  const list = useMemo(() => source.filter((c) => tab === 'all' || c.type === tab).sort((a, b) => b.iso.localeCompare(a.iso)), [tab, source])
  const countOf = (k) => (k === 'all' ? source.length : source.filter((c) => c.type === k).length)
  const cme = source.reduce((sum, row) => sum + row.cme, 0)
  const hours = source.reduce((sum, row) => sum + row.hours, 0)
  const done = source.filter((row) => row.type === 'online' || row.type === 'training').length

  const show = (c) => setParams((p) => { const n = new URLSearchParams(p); n.set('cert', c.id); return n })
  const close = () => setParams((p) => { const n = new URLSearchParams(p); n.delete('cert'); return n })

  const copy = (text, msg) => {
    navigator.clipboard?.writeText(text).catch(() => {})
    setToast(msg)
  }
  const share = async (c) => {
    if (navigator.share) {
      try {
        await navigator.share({ title: c.title, text: `${owner} — ${c.title}`, url: linkOf(c) })
      } catch { /* bekor qilindi */ }
      return
    }
    copy(linkOf(c), 'Tekshirish havolasi nusxalandi')
  }
  const download = (c) => {
    printCert(c, owner)
    setToast('PDF tayyorlanmoqda...')
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef8f7_0%,#f6faf9_40%,#f6faf9_100%)] pb-[86px]">
      <div className="px-3.5 pt-3">
        <HubTopBar onBell={() => setToast('Yangi bildirishnomalar yo‘q')} />
        <h1 className="mt-3 text-[27px] font-extrabold leading-tight tracking-tight text-[#0d2a4a]">Sertifikatlar</h1>
        <p className="mt-0.5 text-[12.5px] leading-snug text-[#7d8fa9]">Seminarlar, onlayn darslar va kurslar bo‘yicha sertifikatlaringiz</p>

        <section className="mt-3.5 flex items-center rounded-2xl bg-white p-3.5 shadow-[0_1px_4px_rgb(11_31_58/0.06)]">
          <span className="grid size-[54px] shrink-0 place-items-center rounded-full bg-[#dff3f0] text-[#0b8a95]"><Award className="size-7" strokeWidth={1.6} /></span>
          <div className="ml-3 min-w-0 flex-1">
            <p className="text-[12px] text-ink-2">Jami CME ballari</p>
            <p className="flex items-baseline gap-1.5 leading-none"><b className="text-[34px] font-extrabold tracking-tight text-[#0d2a4a]">{cme}</b><span className="text-[13px] text-ink-2">ball</span></p>
            <p className="mt-1 text-[10.5px] leading-snug text-muted">Professional rivojlanishingiz uchun rahmat!</p>
          </div>
          <div className="ml-2 flex shrink-0 flex-col gap-2 border-l border-line pl-3">
            {[[GraduationCap, source.length, 'Sertifikatlar soni'], [Clock, hours, 'O‘quv soatlari'], [Star, done, 'Tugallangan kurslar']].map(([Icon, v, l]) => (
              <span key={l} className="flex items-center gap-2">
                <Icon className="size-[18px] shrink-0 text-[#0b6d73]" strokeWidth={1.6} />
                <span>
                  <b className="block text-[14px] leading-none text-[#0d2a4a]">{v}</b>
                  <span className="text-[10px] text-muted">{l}</span>
                </span>
              </span>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto px-3.5 pb-0.5 no-scrollbar">
        {TABS.map(([k, l]) => {
          const on = tab === k
          return (
            <button key={k} type="button" aria-pressed={on} onClick={() => setTab(k)} className={`h-9 shrink-0 rounded-xl px-3.5 text-[12px] font-medium transition ${on ? 'bg-[#0b6d73] text-white' : 'border border-line/70 bg-white text-ink'}`}>
              {l} ({countOf(k)})
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex flex-col gap-2.5 px-3.5">
        {!list.length && <p className="mt-4 rounded-2xl bg-white px-4 py-8 text-center text-[13px] text-muted">{profile.accountLive ? 'Hali sertifikat yo‘q. Yakunlangan seminar va kurslar shu yerda paydo bo‘ladi.' : 'Sertifikat topilmadi.'}</p>}
        {list.map((c) => (
          <article key={c.id} className="rounded-2xl bg-white p-2.5 shadow-[0_1px_4px_rgb(11_31_58/0.06)]">
            <div className="flex gap-2.5">
              <button type="button" onClick={() => show(c)} aria-label={`${c.title} sertifikatini ko‘rish`} className="w-[128px] shrink-0 self-start overflow-hidden rounded-lg ring-1 ring-line/70">
                <Certificate c={c} />
              </button>
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 text-[13px] font-bold leading-[1.25] text-[#0d2a4a]">{c.title}</h3>
                <span className="mt-1 inline-block rounded-md bg-[#e2f4f2] px-1.5 py-0.5 text-[10px] font-medium text-[#0b6d73]">{PILL[c.type]}</span>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-ink-2"><Calendar className="size-3.5 shrink-0 text-[#0b6d73]" /> {c.date}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-ink-2"><Clock className="size-3.5 shrink-0 text-[#0b6d73]" /> {c.hours} soat · {c.cme} CME</p>
              </div>
              <button type="button" onClick={() => show(c)} aria-label="QR kod" className="flex w-[66px] shrink-0 flex-col items-center self-start rounded-lg bg-[#f2f8f8] p-1.5">
                <Qr seed={linkOf(c)} className="size-[50px]" />
                <span className="mt-1 text-center text-[8.5px] leading-tight text-muted">QR kodni skaner qiling</span>
              </button>
            </div>
            <div className="mt-2.5 grid grid-cols-3 gap-1.5">
              {[[Eye, 'Ko‘rish', () => show(c)], [Download, 'Yuklab olish', () => download(c)], [Share2, 'Ulashish', () => share(c)]].map(([Icon, l, fn]) => (
                <button key={l} type="button" onClick={fn} className="flex h-9 items-center justify-center gap-1 rounded-xl border border-[#cfe5e3] text-[11.5px] font-semibold text-[#0b6d73] active:bg-[#eef8f7]">
                  <Icon className="size-4" /> {l}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>

      {open && (
        <BottomSheet
          title="Sertifikatni ko‘rish"
          onClose={close}
          footer={
            <>
              <button type="button" onClick={() => share(open)} className="flex h-12 items-center gap-1.5 rounded-xl border border-sea px-4 text-[13.5px] font-semibold text-sea"><Share2 className="size-4" /> Ulashish</button>
              <button type="button" onClick={() => download(open)} className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-xl bg-sea text-[14px] font-semibold text-white"><Download className="size-4" /> PDF yuklab olish</button>
            </>
          }
        >
          <div className="mt-2 overflow-hidden rounded-xl shadow-[0_8px_24px_rgb(11_31_58/0.12)] ring-1 ring-line/70">
            <Certificate c={open} big />
          </div>
          <dl className="mt-4 divide-y divide-line/70 rounded-2xl border border-line/70 px-3">
            <Row icon={Award} label="Raqami">
              <button type="button" onClick={() => copy(open.id, 'Sertifikat raqami nusxalandi')} className="inline-flex items-center gap-1 text-sea">{open.id} <Copy className="size-3.5" /></button>
            </Row>
            <Row icon={Calendar} label="Berilgan sana">{open.date}</Row>
            <Row icon={UserRound} label="Ma’ruzachi">{open.speaker}</Row>
            <Row icon={open.place === 'Onlayn' ? Monitor : MapPin} label="Joyi">{open.place}</Row>
            <Row icon={Clock} label="Soatlar">{open.hours} soat · {open.cme} CME</Row>
            <Row icon={Building2} label="Tashkilotchi">StomaHub</Row>
            <Row icon={CircleCheck} label="Holat"><span className="rounded-full bg-[#e5f7ea] px-2 py-0.5 text-[11px] font-semibold text-[#17803d]">Tasdiqlangan</span></Row>
          </dl>
          <div className="mt-3 flex items-center gap-3 rounded-2xl bg-[#eef9f7] p-3">
            <span className="shrink-0 rounded-lg bg-white p-1.5"><Qr seed={linkOf(open)} className="size-[72px]" /></span>
            <span>
              <b className="block text-[13px] text-ink">Haqiqiyligini tekshirish</b>
              <span className="text-[11.5px] leading-snug text-muted">QR kodni skanerlab, sertifikat haqiqiyligini tekshirish mumkin.</span>
            </span>
          </div>
        </BottomSheet>
      )}

      <MobileToast text={toast} onClose={closeToast} />
      <MobileTabBar />
    </div>
  )
}

function Row({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center gap-2.5 py-2.5 text-[12.5px]">
      <Icon className="size-4 shrink-0 text-sea" />
      <dt className="w-[96px] shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 flex-1 text-right font-semibold text-ink">{children}</dd>
    </div>
  )
}
