import { useEffect, useState } from 'react'
import {
  Award, Crown, Gift, Star, Ticket, Users, X, ChevronDown,
} from 'lucide-react'
import { TEAL, TICKET_COLORS, box, uzDate, uploadImage } from './wizardBits'

const ICONS = [
  { id: 'ticket', Icon: Ticket },
  { id: 'star', Icon: Star },
  { id: 'crown', Icon: Crown },
  { id: 'gift', Icon: Gift },
  { id: 'users', Icon: Users },
  { id: 'award', Icon: Award },
]

const PERKS = [
  'Seminarga kirish',
  'Maxsus materiallar',
  'Oldingi qator o‘rinlar',
  'Kofe-breyk',
  'Sertifikat',
  'Ma’ruzachilar bilan foto',
]

function Overlay({ children, onClose, width = 440 }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-[#102838]/40 p-3 sm:items-center sm:p-6" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="my-4 w-full rounded-2xl bg-white shadow-[0_24px_60px_rgb(10_30_40/0.28)]"
        style={{ maxWidth: width }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

function Head({ title, onClose }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 pt-4">
      <h3 className="text-[16px] font-bold text-[#143044]">{title}</h3>
      <button type="button" onClick={onClose} aria-label="Yopish" className="grid size-8 place-items-center rounded-lg text-[#8aa0a4] hover:bg-[#f4f7f7]">
        <X className="size-4" />
      </button>
    </div>
  )
}

function Lab({ children, req }) {
  return (
    <span className="mb-1.5 block text-[12.5px] font-medium text-[#1c4a5a]">
      {children}{req && <span className="ml-0.5 text-[#e11d48]">*</span>}
    </span>
  )
}

function Foot({ onClose, onSave }) {
  return (
    <div className="flex justify-end gap-2 px-5 pb-4 pt-1">
      <button type="button" onClick={onClose} className="h-10 rounded-xl border border-[#d7e6e3] bg-white px-4 text-[13px] font-semibold text-[#1c4a5a] hover:bg-[#f7fbfb]">Bekor qilish</button>
      <button type="button" onClick={onSave} className="h-10 rounded-xl px-5 text-[13px] font-semibold text-white" style={{ background: TEAL }}>Saqlash</button>
    </div>
  )
}

function SocialGlyph({ kind }) {
  const common = { viewBox: '0 0 24 24', className: 'size-4', fill: 'currentColor', 'aria-hidden': true }
  if (kind === 'fb') return <svg {...common}><path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.6l.4-3H13v-2c0-.6.4-1 1-1z" /></svg>
  if (kind === 'ig') return <svg {...common}><path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 4.5A4.5 4.5 0 1 0 16.5 12 4.5 4.5 0 0 0 12 7.5zm6.2-.9a1.1 1.1 0 1 0 1.1 1.1 1.1 1.1 0 0 0-1.1-1.1zM12 9.2A2.8 2.8 0 1 1 9.2 12 2.8 2.8 0 0 1 12 9.2z" /></svg>
  if (kind === 'yt') return <svg {...common}><path d="M23 12.2s0-3.2-.4-4.6a3 3 0 0 0-2.1-2.1C18.9 5 12 5 12 5s-6.9 0-8.5.5a3 3 0 0 0-2.1 2.1C1 9 1 12.2 1 12.2s0 3.2.4 4.6a3 3 0 0 0 2.1 2.1C5.1 19.4 12 19.4 12 19.4s6.9 0 8.5-.5a3 3 0 0 0 2.1-2.1c.4-1.4.4-4.6.4-4.6zM9.8 15.5v-6.6l6.2 3.3z" /></svg>
  if (kind === 'in') return <svg {...common}><path d="M4.7 3.2A2.2 2.2 0 1 0 4.7 7.6 2.2 2.2 0 0 0 4.7 3.2zM3 9h3.4v12H3zm5.6 0H12v1.6h.1A3.7 3.7 0 0 1 15.4 9c3.2 0 3.8 2.1 3.8 4.8V21H16v-6.3c0-1.5 0-3.4-2.1-3.4s-2.4 1.6-2.4 3.3V21H8.6z" /></svg>
  if (kind === 'tg') return <svg {...common}><path d="M21.5 4.4 2.7 11.6c-1.3.5-1.3 1.2-.2 1.5l4.8 1.5 11.1-7c.5-.3 1-.1.6.2l-9 8.1-.3 4.8c.5 0 .7-.2 1-.5l2.4-2.3 5 3.7c.9.5 1.6.2 1.8-.9l3.3-15.4c.3-1.3-.5-1.9-1.7-1.4z" /></svg>
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.8 3.8 5.8 3.8 9s-1.3 6.2-3.8 9c-2.5-2.8-3.8-5.8-3.8-9S9.5 5.8 12 3z" />
    </svg>
  )
}

export function TicketModal({ open, onClose, onSave }) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [seats, setSeats] = useState('')
  const [note, setNote] = useState('')
  const [color, setColor] = useState(TICKET_COLORS[0])
  const [icon, setIcon] = useState('ticket')
  const [active, setActive] = useState(true)
  const [err, setErr] = useState('')
  useEffect(() => {
    if (!open) return
    setName(''); setPrice(''); setSeats(''); setNote(''); setColor(TICKET_COLORS[0]); setIcon('ticket'); setActive(true); setErr('')
  }, [open])
  if (!open) return null
  const save = () => {
    if (!name.trim() || !Number(price) || !Number(seats)) { setErr('Nom, narx va joylar sonini kiriting'); return }
    const perks = note.split('\n').map((l) => l.replace(/^[•\-\s]+/, '').trim()).filter(Boolean)
    onSave({ id: `t${Date.now()}`, name: name.trim(), price: Number(price), seats: Number(seats), perks, active, color, icon, basic: false })
  }
  return (
    <Overlay onClose={onClose} width={400}>
      <Head title="Yangi chipta turi qo‘shish" onClose={onClose} />
      <div className="space-y-3 px-5 pb-2 pt-3">
        <label className="block">
          <Lab req>Chipta turi nomi</Lab>
          <input className={box} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <Lab req>Narx</Lab>
            <span className="flex h-10 items-center rounded-xl border border-[#e3eeec] bg-white pr-3 focus-within:border-[var(--color-org-teal)]">
              <input className="h-full min-w-0 flex-1 bg-transparent px-3 text-[13px] outline-none" value={price ? Number(price).toLocaleString('ru-RU').replace(/\u00a0/g, ' ') : ''} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))} placeholder="0" />
              <span className="text-[12.5px] text-[#6e868c]">so‘m</span>
            </span>
          </label>
          <label className="block">
            <Lab req>Joylar soni</Lab>
            <input className={box} value={seats} onChange={(e) => setSeats(e.target.value.replace(/\D/g, ''))} />
          </label>
        </div>
        <label className="block">
          <Lab>Tavsif</Lab>
          <span className="relative block">
            <textarea maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} className="h-[108px] w-full resize-none rounded-xl border border-[#e3eeec] bg-white px-3 py-2 text-[13px] leading-relaxed outline-none focus:border-[var(--color-org-teal)]" />
            <span className="pointer-events-none absolute bottom-2 right-3 text-[11px] text-[#9aafb4]">{note.length}/500</span>
          </span>
        </label>
        <div>
          <p className="mb-1.5 text-[12.5px] font-medium text-[#1c4a5a]">Rang</p>
          <div className="flex gap-2">
            {TICKET_COLORS.map((c) => (
              <button key={c} type="button" aria-label={c} onClick={() => setColor(c)} className="size-6 rounded-full" style={{ background: c, boxShadow: color === c ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : undefined }} />
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-[12.5px] font-medium text-[#1c4a5a]">Ikonka</p>
          <div className="flex gap-1.5">
            {ICONS.map(({ id, Icon }) => (
              <button key={id} type="button" aria-label={id} onClick={() => setIcon(id)} className={`grid size-9 place-items-center rounded-lg border ${icon === id ? 'border-[var(--color-org-teal)] bg-[#e7f6f4] text-[var(--color-org-teal)]' : 'border-[#e6eeec] text-[#5e787e]'}`}>
                <Icon className="size-4" />
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between text-[13px]">
          <span className="font-medium text-[#1c4a5a]">Holat</span>
          <span className="inline-flex items-center gap-2 text-[#3e5a62]">Faol
            <button type="button" role="switch" aria-checked={active} aria-label="Faol" onClick={() => setActive((v) => !v)} className="relative h-6 w-11 rounded-full" style={{ background: active ? TEAL : '#d5e0e2' }}>
              <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow ${active ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </span>
        </div>
        {err && <p className="text-[12px] text-[#e11d48]">{err}</p>}
      </div>
      <Foot onClose={onClose} onSave={save} />
    </Overlay>
  )
}

export function SpeakerModal({ open, onClose, onSave, photo }) {
  const [f, setF] = useState({
    name: '',
    role: '',
    city: '',
    bio: '',
    avatar: photo,
    links: ['https://', 'https://'],
    net: 'web',
  })
  const [err, setErr] = useState('')
  useEffect(() => {
    if (!open) return
    setF({
      name: '',
      role: '',
      city: '',
      bio: '',
      avatar: photo,
      links: ['https://', 'https://'],
      net: 'web',
    })
    setErr('')
  }, [open, photo])
  if (!open) return null
  const save = () => {
    if (f.name.trim().length < 3 || !f.role.trim()) { setErr('Ism-familiya va lavozimni kiriting'); return }
    onSave({ id: `s${Date.now()}`, name: f.name.trim(), role: f.role.trim(), city: f.city.trim(), bio: f.bio, avatar: f.avatar, links: f.links })
  }
  return (
    <Overlay onClose={onClose} width={560}>
      <Head title="Ma’ruzachi qo‘shish" onClose={onClose} />
      <div className="space-y-3 px-5 pb-2 pt-3">
        <div className="flex gap-3">
          <img src={f.avatar} alt="" className="h-[132px] w-[108px] shrink-0 rounded-xl object-cover" />
          <label className="grid min-h-[132px] flex-1 cursor-pointer place-items-center rounded-xl border border-dashed border-[#d5e4e1] bg-[#f7fbfb] text-center text-[12.5px] font-medium text-[#5e787e]">
            <span>Rasm yuklash</span>
            <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0]
              if (file && /^image\/(png|jpeg)$/.test(file.type)) uploadImage(file, 'speakers').then((src) => setF((x) => ({ ...x, avatar: src })), () => {})
            }} />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label><Lab req>Ism-familiya</Lab><input className={box} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
          <label><Lab req>Lavozim</Lab><input className={box} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} /></label>
        </div>
        <label className="block">
          <Lab>Tavsif</Lab>
          <span className="relative block">
            <textarea maxLength={500} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} className="h-[88px] w-full resize-none rounded-xl border border-[#e3eeec] px-3 py-2 text-[13px] leading-snug outline-none focus:border-[var(--color-org-teal)]" />
            <span className="pointer-events-none absolute bottom-2 right-3 text-[11px] text-[#9aafb4]">{f.bio.length}/500</span>
          </span>
        </label>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
          <div>
            <p className="mb-1.5 text-[12.5px] font-medium text-[#1c4a5a]">Ijtimoiy tarmoqlar</p>
            <div className="mb-2 flex gap-1.5">
              {['web', 'fb', 'ig', 'yt', 'in', 'tg'].map((id) => (
                <button key={id} type="button" aria-label={id} onClick={() => setF({ ...f, net: id })} className={`grid size-8 place-items-center rounded-lg border ${f.net === id ? 'border-[var(--color-org-teal)] bg-[#e7f6f4] text-[var(--color-org-teal)]' : 'border-[#e6eeec] text-[#5e787e]'}`}>
                  <SocialGlyph kind={id} />
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {f.links.map((l, i) => (
                <input key={i} className={box} value={l} onChange={(e) => setF({ ...f, links: f.links.map((x, j) => j === i ? e.target.value : x) })} />
              ))}
            </div>
          </div>
          <label>
            <Lab>Shahar</Lab>
            <span className="relative block">
              <input className={box} value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-[#8aa4a8]" />
            </span>
          </label>
        </div>
        {err && <p className="text-[12px] text-[#e11d48]">{err}</p>}
      </div>
      <Foot onClose={onClose} onSave={save} />
    </Overlay>
  )
}

export function PromoModal({ open, onClose, onSave }) {
  const [f, setF] = useState({ code: 'EARLYBIRD', kind: 'foiz', value: '20', from: '2026-11-01', to: '2026-11-15', limit: '100', active: true })
  const [err, setErr] = useState('')
  useEffect(() => {
    if (!open) return
    setF({ code: 'EARLYBIRD', kind: 'foiz', value: '20', from: '2026-11-01', to: '2026-11-15', limit: '100', active: true })
    setErr('')
  }, [open])
  if (!open) return null
  const save = () => {
    if (!/^[A-Za-z0-9]{3,16}$/.test(f.code.trim()) || !Number(f.value)) { setErr('Kod va chegirma miqdorini kiriting'); return }
    onSave({
      id: `p${Date.now()}`,
      code: f.code.trim().toUpperCase(),
      off: f.kind === 'foiz' ? `-${f.value}%` : `-${Number(f.value).toLocaleString('ru-RU').replace(/\u00a0/g, ' ')} so‘m`,
      note: `${uzDate(f.from, 'dot')} – ${uzDate(f.to, 'dot')}`,
      on: f.active,
    })
  }
  return (
    <Overlay onClose={onClose} width={520}>
      <Head title="Promo-kod yaratish" onClose={onClose} />
      <div className="space-y-3 px-5 pb-2 pt-3">
        <div className="grid grid-cols-2 gap-3">
          <label><Lab req>Promo-kod</Lab><input className={box} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} /></label>
          <div>
            <Lab>Chegirma turi</Lab>
            <div className="flex h-10 items-center gap-3 text-[13px] text-[#1c4a5a]">
              {[['foiz', 'Foiz (%)'], ['summa', 'Summa (so‘m)']].map(([id, label]) => (
                <label key={id} className="inline-flex items-center gap-1.5">
                  <input type="radio" name="kind" checked={f.kind === id} onChange={() => setF({ ...f, kind: id })} className="accent-[var(--color-org-teal)]" />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-[120px_minmax(0,1fr)_88px_auto] items-end gap-2">
          <label>
            <Lab req>Chegirma miqdori</Lab>
            <span className="flex h-10 items-center rounded-xl border border-[#e3eeec] bg-white pr-3 focus-within:border-[var(--color-org-teal)]">
              <input className="h-full w-full bg-transparent px-3 text-[13px] outline-none" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value.replace(/\D/g, '') })} />
              <span className="text-[12.5px] text-[#6e868c]">{f.kind === 'foiz' ? '%' : 'so‘m'}</span>
            </span>
          </label>
          <label>
            <Lab>Amal qilish muddati</Lab>
            <span className="relative flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#e3eeec] bg-white px-2 text-[12.5px] text-[#143044]">
              <span className="whitespace-nowrap">{uzDate(f.from, 'dot')}</span>
              <span className="text-[#8aa0a4]">→</span>
              <span className="whitespace-nowrap">{uzDate(f.to, 'dot')}</span>
              <input type="date" aria-label="Boshlanish" className="absolute inset-y-0 left-0 w-1/2 cursor-pointer opacity-0" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} />
              <input type="date" aria-label="Tugash" className="absolute inset-y-0 right-0 w-1/2 cursor-pointer opacity-0" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} />
            </span>
          </label>
          <label>
            <Lab>Foydalanish limiti</Lab>
            <input className={box} value={f.limit} onChange={(e) => setF({ ...f, limit: e.target.value.replace(/\D/g, '') })} />
          </label>
          <div className="pb-1.5">
            <p className="mb-1.5 text-[12.5px] font-medium text-[#1c4a5a]">Faol</p>
            <button type="button" role="switch" aria-checked={f.active} aria-label="Faol" onClick={() => setF({ ...f, active: !f.active })} className="relative h-6 w-11 rounded-full" style={{ background: f.active ? TEAL : '#d5e0e2' }}>
              <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow ${f.active ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>
        </div>
        {err && <p className="text-[12px] text-[#e11d48]">{err}</p>}
      </div>
      <Foot onClose={onClose} onSave={save} />
    </Overlay>
  )
}
