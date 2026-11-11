import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Award, CalendarDays, CalendarPlus, Check, ChevronLeft, CreditCard, Download, MapPin, Share2, Ticket, UserRound,
} from 'lucide-react'
import QRCode from 'qrcode'
import LiveQr from '../LiveQr'
import { ToothIcon } from '../icons'
import { MobileToast } from '../mobile/parts'
import { buildIcs } from '../../seminarPresent'
import { jpegToPdf } from '../../ticketPdf'

const STATUS = {
  ok: 'bg-[#e8f8ee] text-[#15803d]',
  wait: 'bg-[#fff6e4] text-[#b7791f]',
  bad: 'bg-[#fde8e8] text-[#dc2626]',
  muted: 'bg-[#eef2f4] text-[#5b6b7d]',
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

function wrapText(g, text, x, y, max, lh) {
  const words = String(text || '').split(/\s+/)
  let line = ''
  let cy = y
  for (const w of words) {
    const t = line ? `${line} ${w}` : w
    if (g.measureText(t).width > max && line) {
      g.fillText(line, x, cy)
      line = w
      cy += lh
    } else line = t
  }
  if (line) g.fillText(line, x, cy)
  return cy + lh
}

async function renderTicketCanvas(view) {
  const W = 800
  const H = 1180
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')
  const font = (w, px) => `${w} ${px}px Inter, "Segoe UI", Arial, sans-serif`
  g.fillStyle = '#f4f8f8'
  g.fillRect(0, 0, W, H)
  g.fillStyle = '#ffffff'
  g.beginPath()
  g.roundRect(36, 36, W - 72, H - 72, 28)
  g.fill()
  g.fillStyle = '#0c8f86'
  g.beginPath()
  g.roundRect(36, 36, W - 72, 92, [28, 28, 0, 0])
  g.fill()
  g.fillStyle = '#ffffff'
  g.font = font(800, 28)
  g.fillText('StomaHub', 64, 92)
  g.font = font(600, 20)
  g.textAlign = 'right'
  g.fillText('Seminar chiptasi', W - 64, 92)
  g.textAlign = 'left'
  let y = 168
  if (view.direction) {
    g.fillStyle = '#0b8a95'
    g.font = font(700, 18)
    g.fillText(view.direction, 64, y)
    y += 36
  }
  g.fillStyle = '#12263a'
  g.font = font(800, 26)
  y = wrapText(g, String(view.title || '').toUpperCase(), 64, y, W - 128, 34)
  y += 12
  const rows = [
    ['Ishtirokchi', view.attendee],
    ['Sana', [view.dateLabel, view.time].filter(Boolean).join('  ·  ')],
    ['Joy', view.place],
  ].filter(([, v]) => v)
  g.font = font(500, 20)
  for (const [k, v] of rows) {
    g.fillStyle = '#6b7686'
    g.fillText(k, 64, y)
    g.fillStyle = '#12263a'
    g.font = font(700, 20)
    g.textAlign = 'right'
    g.fillText(String(v).slice(0, 42), W - 64, y)
    g.textAlign = 'left'
    g.font = font(500, 20)
    y += 36
  }
  y += 16
  if (view.qr) {
    try {
      const url = await QRCode.toDataURL(view.qr, { margin: 1, width: 360, errorCorrectionLevel: 'M' })
      const img = await loadImage(url)
      const size = 280
      g.drawImage(img, (W - size) / 2, y, size, size)
      y += size + 28
    } catch { /* QR chizilmasa matn qoladi */ }
  }
  if (view.code) {
    g.fillStyle = '#0b8a95'
    g.font = font(800, 22)
    g.textAlign = 'center'
    g.fillText(view.code, W / 2, y)
    y += 28
  }
  g.fillStyle = '#6b7686'
  g.font = font(400, 16)
  g.textAlign = 'center'
  g.fillText('Seminar kirishida ushbu QR-kodni ko‘rsating', W / 2, y)
  g.textAlign = 'left'
  y += 36
  g.strokeStyle = '#c5d8dc'
  g.setLineDash([8, 8])
  g.beginPath()
  g.moveTo(72, y)
  g.lineTo(W - 72, y)
  g.stroke()
  g.setLineDash([])
  y += 40
  const lower = [
    ['Chipta turi', view.plan],
    ['To‘lov summasi', view.priceLabel],
    ['Sertifikat', view.certificate ? 'Beriladi' : ''],
  ].filter(([, v]) => v)
  for (const [k, v] of lower) {
    g.fillStyle = '#6b7686'
    g.font = font(500, 20)
    g.fillText(k, 64, y)
    g.fillStyle = '#12263a'
    g.font = font(700, 20)
    g.textAlign = 'right'
    g.fillText(v, W - 64, y)
    g.textAlign = 'left'
    y += 36
  }
  return c
}

function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image()
    img.onload = () => res(img)
    img.onerror = rej
    img.src = src
  })
}

async function downloadPdf(view) {
  const canvas = await renderTicketCanvas(view)
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.92))
  if (!blob) throw new Error('pdf')
  const pdf = jpegToPdf(new Uint8Array(await blob.arrayBuffer()), canvas.width, canvas.height)
  downloadBlob(new Blob([pdf], { type: 'application/pdf' }), `StomaHub-${view.code || view.id || 'chipta'}.pdf`)
}

function downloadIcs(view) {
  const ics = buildIcs(view)
  if (!ics) return false
  downloadBlob(new Blob([ics], { type: 'text/calendar;charset=utf-8' }), `StomaHub-${view.code || view.id || 'seminar'}.ics`)
  return true
}

async function shareTicket(view) {
  const url = `${window.location.origin}/seminarlar/${view.id}/chipta`
  const text = [view.title, view.dateLabel, view.place, view.code && `Chipta: ${view.code}`].filter(Boolean).join('\n')
  if (navigator.share) {
    try {
      await navigator.share({ title: view.title || 'Elektron chipta', text, url })
      return 'shared'
    } catch (e) {
      if (e?.name === 'AbortError') return 'abort'
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    return 'failed'
  }
}

function Row({ icon: Icon, label, value, extra, badge }) {
  if (!value && !extra && !badge) return null
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e7f5f4] text-[#0c8f86]">
        <Icon className="size-[18px]" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] leading-none text-[#7b8b98]">{label}</p>
        {value && <p className="mt-1 text-[13.5px] font-semibold leading-snug text-[#12263a]">{value}</p>}
        {extra && <p className="text-[12px] font-medium leading-snug text-[#3d5566]">{extra}</p>}
      </div>
      {badge}
    </div>
  )
}

export function ETicketCard({ view }) {
  return (
    <article data-testid="e-ticket" className="relative rounded-[26px] bg-white shadow-[0_16px_40px_-24px_rgb(12_60_70/0.55)]">
      <header className="flex items-center justify-between rounded-t-[26px] bg-gradient-to-r from-[#0c8f86] to-[#0a756e] px-4 py-3.5 text-white">
        <span className="flex items-center gap-1.5 text-[15px] font-bold tracking-tight">
          <ToothIcon className="size-5" strokeWidth={1.7} /> StomaHub
        </span>
        <span className="text-[12.5px] font-medium text-white/90">Seminar chiptasi</span>
      </header>
      <div className="px-4 pb-1 pt-4">
        {view.direction && (
          <span className="inline-flex rounded-full bg-[#e7f5f4] px-2.5 py-1 text-[11px] font-semibold text-[#0c8f86]">{view.direction}</span>
        )}
        <h2 className="mt-2 text-[15px] font-extrabold uppercase leading-snug tracking-[-0.02em] text-[#12263a]">{view.title}</h2>
        <div className="mt-2">
          <Row icon={UserRound} label="Ishtirokchi" value={view.attendee} />
          <Row icon={CalendarDays} label="Sana" value={view.dateLabel} extra={view.time} />
          <Row icon={MapPin} label="Joy" value={view.place} />
        </div>
        {view.qr && (
          <div className="flex flex-col items-center px-2 pb-2 pt-3">
            <LiveQr text={view.qr} className="size-[168px]" />
            {view.code && (
              <span className="mt-2 max-w-full break-all rounded-lg bg-[#f2f4f6] px-3 py-1 text-center text-[12.5px] font-bold tracking-wide text-[#12263a]">{view.code}</span>
            )}
            <p className="mt-2 text-center text-[12px] leading-snug text-[#7b8b98]">Seminar kirishida ushbu QR-kodni ko‘rsating</p>
          </div>
        )}
      </div>
      <div className="relative mx-0 h-6">
        <span className="absolute left-0 top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f4f8f8]" />
        <span className="absolute right-0 top-1/2 size-6 translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f4f8f8]" />
        <span className="absolute left-7 right-7 top-1/2 border-t border-dashed border-[#c9dce0]" />
      </div>
      <div className="px-4 pb-4 pt-1">
        <Row icon={Ticket} label="Chipta turi" value={view.plan} />
        <Row icon={CreditCard} label="To‘lov summasi" value={view.priceLabel} />
        {view.certificate && (
          <Row
            icon={Award}
            label="Sertifikat"
            badge={<span className="inline-flex items-center gap-1 rounded-full bg-[#e8f8ee] px-2.5 py-1 text-[12px] font-semibold text-[#15803d]"><Check className="size-3.5" strokeWidth={2.6} /> Beriladi</span>}
          />
        )}
      </div>
    </article>
  )
}

export function ETicketActions({ view, onToast }) {
  const [busy, setBusy] = useState(false)
  const pdf = async () => {
    setBusy(true)
    try {
      await downloadPdf(view)
      onToast('Chipta PDF yuklab olindi')
    } catch {
      onToast('Chiptani yuklab bo‘lmadi')
    } finally {
      setBusy(false)
    }
  }
  const cal = () => {
    if (!downloadIcs(view)) { onToast('Sana ma’lum emas'); return }
    onToast('Kalendar fayli yuklab olindi')
  }
  const share = async () => {
    const res = await shareTicket(view)
    if (res === 'copied') onToast('Havola nusxalandi')
    else if (res === 'failed') onToast('Ulashib bo‘lmadi')
  }
  return (
    <div className="mt-4">
      <button type="button" disabled={busy} onClick={pdf} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0c8f86] text-[14.5px] font-semibold text-white shadow-[0_8px_18px_-10px_rgb(12_143_134/0.9)] active:scale-[0.99] disabled:opacity-60">
        <Download className="size-[18px]" /> Chiptani yuklab olish (PDF)
      </button>
      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
        <button type="button" onClick={cal} className="flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-[#b7ddd8] bg-white text-[12.5px] font-semibold text-[#0c8f86] active:bg-[#f3fbfa]">
          <CalendarPlus className="size-4" /> Kalendarga qo‘shish
        </button>
        <button type="button" onClick={share} className="flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-[#b7ddd8] bg-white text-[12.5px] font-semibold text-[#0c8f86] active:bg-[#f3fbfa]">
          <Share2 className="size-4" /> Ulashish
        </button>
      </div>
    </div>
  )
}

export default function ETicketPage({ view, onBack, missing }) {
  const [toast, setToast] = useState('')
  const status = view?.status
  return (
    <div className="min-h-screen bg-[#f4f8f8] px-3.5 pb-10 pt-3 text-[#12263a]">
      <header className="mb-3 flex items-center gap-1">
        <button type="button" onClick={onBack} aria-label="Orqaga" className="grid size-9 shrink-0 place-items-center rounded-full text-[#12263a] active:bg-white">
          <ChevronLeft className="size-6" />
        </button>
        <h1 className="min-w-0 flex-1 text-[18px] font-bold tracking-tight">Elektron chipta</h1>
        {status && (
          <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold ${STATUS[status.tone] || STATUS.muted}`}>
            {status.tone === 'ok' && <Check className="size-3.5" strokeWidth={2.8} />}
            {status.label}
          </span>
        )}
      </header>
      {view ? (
        <>
          <ETicketCard view={view} />
          <ETicketActions view={view} onToast={setToast} />
          <Link to={`/seminarlar/${view.id}`} className="mt-4 block text-center text-[13px] font-semibold text-[#0c8f86]">Seminar sahifasini ochish</Link>
        </>
      ) : (
        <div className="rounded-[26px] bg-white px-5 py-10 text-center shadow-[0_10px_30px_-20px_rgb(12_60_70/0.4)]">
          <Ticket className="mx-auto size-8 text-[#0c8f86]" />
          <p className="mt-3 text-[15px] font-bold">{missing || 'Chipta topilmadi'}</p>
          <p className="mt-1 text-[12.5px] leading-snug text-[#7b8b98]">Ro‘yxatdan o‘tganingizdan so‘ng elektron chipta shu yerda ochiladi.</p>
        </div>
      )}
      <MobileToast text={toast} onClose={() => setToast('')} bottom={24} />
    </div>
  )
}
