import { useMemo } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { RequireAuth } from '../requireAuth'
import ETicketPage from '../components/ticket/ETicket'
import ShopLayout from '../components/market/ShopLayout'
import { useMobile } from '../useMobile'
import { publicRecord, useHub } from '../hubStore'
import { useSeminarStore } from '../components/mobile/seminarStore'
import { useProfile } from '../profileStore'
import { hasCertificate } from '../seminarPresent'
import { buildTicketView } from '../ticketModel'

function mergeReg(local, server) {
  if (!local && !server) return null
  const s = server || {}
  const l = local || {}
  return {
    name: l.name || s.name || '',
    code: l.code || s.code || '',
    personId: l.personId || s.id || '',
    id: s.id || l.personId || '',
    order: l.order || '',
    checkin: l.checkin || '',
    plan: l.ticketName || l.plan || s.ticket || '',
    ticketName: l.ticketName || s.ticket || '',
    ticket: s.ticket || l.ticket || '',
    price: l.price != null && l.price !== '' ? l.price : undefined,
    pending: l.pending != null ? l.pending : s.pay === 'wait',
    pay: s.pay || '',
    paidConfirmed: l.paidConfirmed || s.pay === 'paid',
    method: l.method || '',
    cert: l.cert,
    created_at: s.created_at,
    at: l.at,
    cancelled: s.pay === 'cancel',
  }
}

function previewReg(record) {
  // Dev skrinshot: qisqa kod seminarning o‘zidan, mockupdagi raqam emas.
  let h = 2166136261
  for (const ch of String(record.id || '')) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  const n = String(h >>> 0).padStart(10, '0').slice(0, 10)
  const year = String(record.startIso || '').slice(0, 4) || '2026'
  const code = `QR-${n}`
  const order = `ST${year}-${n}`
  const plan = (record.tickets || []).find((t) => /standart/i.test(t.name || '')) || record.tickets?.[0]
  const price = plan ? Number(plan.price) : Number(record.price) || 0
  return {
    name: '',
    ticketName: plan?.name || '',
    price,
    code,
    order,
    checkin: `STH:${code}|${order}`,
    pending: false,
    pay: 'paid',
    cert: hasCertificate(record),
    preview: true,
  }
}

export default function SeminarTicket() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const mobile = useMobile()
  const hub = useHub()
  const store = useSeminarStore()
  const profile = useProfile()
  const record = publicRecord(id, hub)
  const shot = import.meta.env.DEV && params.get('shot') === '1'
  const reg = useMemo(() => {
    const local = store.registered?.[id]
    const server = (hub.myRegistrations || []).find((r) => r.seminar_id === id && r.pay !== 'cancel')
    return mergeReg(local, server) || (shot && record ? previewReg(record) : null)
  }, [store, hub.myRegistrations, id, shot, record])
  const view = record && reg ? buildTicketView(record, reg, profile) : null
  const back = () => (window.history.length > 1 ? navigate(-1) : navigate('/seminarlar'))
  const missing = !hub.ready && hub.loading
    ? 'Yuklanmoqda…'
    : !record
      ? 'Seminar topilmadi'
      : 'Bu seminar uchun chiptangiz yo‘q'

  const screen = (
    <ETicketPage
      view={view}
      onBack={back}
      missing={missing}
    />
  )

  if (!mobile) {
    return (
      <ShopLayout active="seminars" search="plain" placeholder="Seminar, spiker yoki shahar qidiring...">
        <div className="mx-auto w-full max-w-[460px] py-2">{screen}</div>
      </ShopLayout>
    )
  }
  return screen
}

/** Lokal skrinshot: ?shot=1 faqat dev-serverda, autentifikatsiyasiz haqiqiy seminardan namuna chipta. */
export function SeminarTicketRoute() {
  const [params] = useSearchParams()
  if (import.meta.env.DEV && params.get('shot') === '1') return <SeminarTicket />
  return <RequireAuth><SeminarTicket /></RequireAuth>
}
