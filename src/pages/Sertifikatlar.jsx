import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Award, Star, Clock, Search, ArrowUpDown, Eye, Download, QrCode, Calendar, MapPin, Monitor,
  X, Minus, Plus, Maximize2, Copy, FileText, Building2, CircleCheck, Share2, Printer,
} from 'lucide-react'
import ShopLayout from '../components/market/ShopLayout'
import { ToothIcon } from '../components/icons'
import { TYPES, TYPE_LABEL, TYPE_LINE, certs, STATS } from '../sertifikatData'
import { useProfile } from '../profileStore'
import { currentUid } from '../recordSync'
import { useSession } from '../sessionStore'

const THEMES = {
  teal: { bg: '#ffffff', ink: '#0b3b4a', accent: '#0e8f8a', corner: 'linear-gradient(135deg, #0e8f8a, #6fd0c4)', frame: '#cfe9e5' },
  mint: { bg: '#f7fdfc', ink: '#0b3b4a', accent: '#13a39a', corner: 'linear-gradient(135deg, #8fe0d6, #d7f5f0)', frame: '#d5efeb' },
  gold: { bg: '#fffdf8', ink: '#123a44', accent: '#0e7f7a', corner: 'linear-gradient(135deg, #0b6f73, #2aa39a)', frame: '#e8d6a6' },
  dark: { bg: '#0f2f3a', ink: '#f5e6c0', accent: '#d8b45c', corner: 'linear-gradient(135deg, #0b4a52, #13706f)', frame: '#b8954a' },
}

export default function Sertifikatlar() {
  return (
    <ShopLayout active="certs" search="plain" placeholder="Kurs, seminar yoki mavzu bo‘yicha qidiring...">
      <Board />
    </ShopLayout>
  )
}

function Board() {
  const profile = useProfile()
  const session = useSession()
  const live = profile.accountLive || !!currentUid() || session.status === 'authed'
  const owner = live ? (profile.name || 'Ism kiritilmagan') : 'Sizning ismingiz'
  const library = live ? [] : certs
  const stats = live ? { count: 0, cme: 0, done: 0 } : STATS
  const [params, setParams] = useSearchParams()
  const [type, setType] = useState('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('new')
  const [toast, setToast] = useState('')
  const openId = params.get('cert')
  const open = live ? null : (certs.find((c) => c.id === openId) || null)

  const list = useMemo(() => {
    const text = query.trim().toLowerCase()
    const rows = library.filter((c) => {
      if (type !== 'all' && type !== 'cme' && c.type !== type) return false
      if (text && !`${c.title} ${c.speaker} ${c.id}`.toLowerCase().includes(text)) return false
      return true
    })
    if (type === 'cme') return [...rows].sort((a, b) => b.cme - a.cme)
    return [...rows].sort((a, b) => (sort === 'new' ? b.iso.localeCompare(a.iso) : a.iso.localeCompare(b.iso)))
  }, [type, query, sort, library])

  const ping = (text) => {
    setToast(text)
    window.setTimeout(() => setToast(''), 1800)
  }

  const show = (c) => setParams((p) => { const n = new URLSearchParams(p); n.set('cert', c.id); return n })
  const close = () => setParams((p) => { const n = new URLSearchParams(p); n.delete('cert'); return n })

  return (
    <div className="pb-8 pt-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight text-ink">Sertifikatlar</h1>
          <p className="text-[13px] text-muted">Siz olgan barcha sertifikatlar va yutuqlar</p>
        </div>
        <div className="flex divide-x divide-[#d7ebe8] rounded-2xl bg-[#eef9f7] px-1 py-2">
          <Stat icon={Award} value={stats.count} label="ta sertifikat" />
          <Stat icon={Star} value={stats.cme} label="CME ballari" />
          <Stat icon={Clock} value={stats.done} label="ta kurs yakunlangan" />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button key={t.id} type="button" onClick={() => setType(t.id)} className={`h-9 rounded-xl px-3 text-[12px] font-semibold ${type === t.id ? 'bg-sea text-white' : 'bg-white text-ink-2 shadow-card'}`}>{t.label}</button>
          ))}
        </div>
        <label className="ml-auto flex h-9 min-w-[220px] flex-1 items-center gap-2 rounded-xl bg-white px-3 shadow-card sm:max-w-[260px]">
          <Search className="size-4 text-muted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Sertifikat nomi yoki tashkilot bo‘yicha..." className="h-full min-w-0 flex-1 bg-transparent text-[12px] outline-none" />
        </label>
        <label className="flex h-9 items-center gap-1.5 rounded-xl bg-white px-3 text-[12px] font-semibold shadow-card">
          <ArrowUpDown className="size-4 text-muted" />
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="bg-transparent outline-none">
            <option value="new">Yangidan eskiga</option>
            <option value="old">Eskidan yangiga</option>
          </select>
        </label>
      </div>

      {list.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-white p-8 text-center text-[13px] text-muted shadow-card">{live ? 'Hali sertifikat yo‘q. Seminar yoki kursni yakunlagach, u shu yerda saqlanadi.' : 'Sertifikat topilmadi.'}</p>
      ) : (
        <div className="cert-grid mt-4">
          {list.map((c) => (
            <article key={c.id} className="rounded-2xl bg-white p-2.5 shadow-card">
              <button type="button" onClick={() => show(c)} className="relative block w-full overflow-hidden rounded-xl text-left" aria-label={`${c.title} sertifikatini ko‘rish`}>
                <Certificate c={c} />
                <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg bg-white px-1.5 py-0.5 text-[10px] font-bold text-ink shadow"><Clock className="size-3" /> {c.cme} CME</span>
              </button>
              <h3 className="mt-2 truncate text-[13.5px] font-bold">{c.title}</h3>
              <p className="truncate text-[11.5px] text-muted">{TYPE_LABEL[c.type]} · {c.speaker}</p>
              <p className="mt-1 flex items-center gap-4 text-[11.5px] text-ink-2">
                <span className="inline-flex items-center gap-1"><Calendar className="size-3.5 text-muted" /> {c.date}</span>
                <span className="inline-flex items-center gap-1">{c.place === 'Onlayn' ? <Monitor className="size-3.5 text-muted" /> : <MapPin className="size-3.5 text-muted" />} {c.place}</span>
              </p>
              <div className="mt-2 flex gap-1.5">
                <button type="button" onClick={() => show(c)} className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg bg-[#f0f8f7] text-[12px] font-semibold text-sea"><Eye className="size-3.5" /> Ko‘rish</button>
                <button type="button" onClick={() => printCert(c, owner)} className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg bg-[#f0f8f7] text-[12px] font-semibold text-sea"><Download className="size-3.5" /> Yuklab olish</button>
                <button type="button" onClick={() => show(c)} aria-label="QR kod" className="grid size-8 place-items-center rounded-lg bg-[#f0f8f7] text-sea"><QrCode className="size-4" /></button>
              </div>
            </article>
          ))}
        </div>
      )}

      {open && <Viewer c={open} onClose={close} onToast={ping} />}
      {toast && <p className="fixed bottom-4 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-[12.5px] text-white">{toast}</p>}
    </div>
  )
}

function Viewer({ c, onClose, onToast }) {
  const profile = useProfile()
  const owner = profile.accountLive ? (profile.name || 'Ism kiritilmagan') : 'Sizning ismingiz'
  const [scale, setScale] = useState(100)
  const stage = useRef(null)
  const link = `${window.location.origin}/sertifikatlar?cert=${c.id}`

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const copy = (text, msg) => {
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).catch(() => {})
    onToast(msg)
  }

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: c.title, text: `${owner} — ${c.title}`, url: link })
        return
      } catch {
        return
      }
    }
    copy(link, 'Tekshirish havolasi nusxalandi')
  }

  const full = () => {
    const el = stage.current
    if (!el) return
    if (document.fullscreenElement) document.exitFullscreen()
    else el.requestFullscreen?.()
  }

  return (
    <div className="bemor-shade" onClick={onClose}>
      <div className="cert-dialog" role="dialog" aria-labelledby="cert-title" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 id="cert-title" className="text-[16px] font-bold">Sertifikatni ko‘rish</h2>
          <button type="button" onClick={onClose} aria-label="Yopish" className="grid size-8 place-items-center rounded-lg text-muted"><X className="size-4" /></button>
        </div>
        <div className="bemor-dialog-body p-4">
          <div className="cert-view">
            <div ref={stage} className="relative min-w-0 overflow-auto rounded-2xl bg-[#f3f6fa] p-3">
              <div className="mb-2 flex justify-end gap-1.5">
                <span className="inline-flex items-center rounded-lg bg-white text-[12px] shadow-sm">
                  <button type="button" aria-label="Kichraytirish" onClick={() => setScale((s) => Math.max(60, s - 10))} className="grid size-7 place-items-center"><Minus className="size-3.5" /></button>
                  <span className="w-11 text-center font-semibold">{scale}%</span>
                  <button type="button" aria-label="Kattalashtirish" onClick={() => setScale((s) => Math.min(160, s + 10))} className="grid size-7 place-items-center"><Plus className="size-3.5" /></button>
                </span>
                <button type="button" aria-label="To‘liq ekran" onClick={full} className="grid size-7 place-items-center rounded-lg bg-white shadow-sm"><Maximize2 className="size-3.5" /></button>
              </div>
              <div className="mx-auto" style={{ width: `${scale}%`, maxWidth: scale > 100 ? 'none' : '100%' }}>
                <Certificate c={c} big />
              </div>
            </div>

            <aside className="min-w-0">
              <dl className="space-y-2.5 text-[12.5px]">
                <Info label="Sertifikat raqami">
                  <span className="inline-flex items-center gap-1 font-semibold text-sea">{c.id}
                    <button type="button" aria-label="Raqamni nusxalash" onClick={() => copy(c.id, 'Sertifikat raqami nusxalandi')}><Copy className="size-3.5" /></button>
                  </span>
                </Info>
                <Info label="Berilgan sana" icon={Calendar}>{c.date}</Info>
                <Info label="Kurs / seminar" icon={FileText}>{c.title}</Info>
                <Info label="Tashkilotchi" icon={Building2}>StomaHub</Info>
                <Info label="Soatlar" icon={Clock}>{c.hours} soat</Info>
                <Info label="CME ballari" icon={Star}>{c.cme} ball</Info>
                <Info label="Holat" icon={CircleCheck}><span className="rounded-full bg-[#e5f7ea] px-2 py-0.5 text-[11px] font-semibold text-[#17803d]">Tasdiqlangan</span></Info>
              </dl>
              <div className="mt-3 flex items-center gap-3 rounded-2xl bg-[#eef9f7] p-3">
                <span className="shrink-0 rounded-lg bg-white p-1.5"><Qr seed={link} /></span>
                <span>
                  <b className="block text-[13px]">QR orqali haqiqiyligini tekshirish</b>
                  <span className="text-[11.5px] text-muted">Ushbu QR kodni skanerlab, sertifikatning haqiqiyligini tekshirishingiz mumkin.</span>
                </span>
              </div>
              <button type="button" onClick={() => printCert(c, owner)} className="mt-3 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-sea text-[13px] font-semibold text-white"><Download className="size-4" /> PDF yuklab olish</button>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button type="button" onClick={share} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-sea text-[13px] font-semibold text-sea"><Share2 className="size-4" /> Ulashish</button>
                <button type="button" onClick={() => printCert(c, owner)} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-sea text-[13px] font-semibold text-sea"><Printer className="size-4" /> Chop etish</button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Certificate({ c, big }) {
  const profile = useProfile()
  const owner = profile.accountLive ? (profile.name || 'Ism kiritilmagan') : 'Sizning ismingiz'
  const t = THEMES[c.theme] || THEMES.teal
  const dark = c.theme === 'dark'
  return (
    <div className="relative w-full overflow-hidden" style={{ aspectRatio: '1.414', background: t.bg, containerType: 'inline-size', boxShadow: big ? '0 10px 30px rgb(11 31 58 / 0.12)' : 'none' }}>
      <span className="absolute -left-[8%] -top-[18%] h-[42%] w-[26%] rotate-[35deg]" style={{ background: t.corner }} />
      <span className="absolute -bottom-[18%] -right-[8%] h-[42%] w-[26%] rotate-[35deg]" style={{ background: t.corner }} />
      <span className="absolute inset-[3.5%] border" style={{ borderColor: t.frame }} />
      <div className="absolute inset-0 flex flex-col items-center px-[10%] pt-[6%] text-center" style={{ color: t.ink }}>
        <span className="inline-flex items-center gap-[0.8cqw] font-bold" style={{ fontSize: '3cqw', color: dark ? t.accent : t.accent }}>
          <ToothIcon className="size-[3.6cqw]" strokeWidth={2} /> StomaHub
        </span>
        <span className="mt-[1.5cqw] font-serif tracking-[0.18em]" style={{ fontSize: '8cqw', lineHeight: 1, color: dark ? t.accent : t.ink }}>SERTIFIKAT</span>
        <span className="mt-[1.6cqw]" style={{ fontSize: '2.2cqw' }}>Mazkur sertifikat bilan tasdiqlanadiki,</span>
        <span className="mt-[1.2cqw] font-serif font-bold" style={{ fontSize: '4.6cqw' }}>{big ? `Dr. ${owner}` : owner}</span>
        <span className="mt-[0.8cqw] font-semibold" style={{ fontSize: '3.2cqw', color: t.accent, lineHeight: 1.15 }}>{big ? `«${c.title}»` : c.title}</span>
        <span className="mt-[0.8cqw]" style={{ fontSize: '2.1cqw' }}>{TYPE_LINE[c.type]}</span>
        {big && (
          <span className="mt-[2cqw] flex items-center gap-[5cqw] border-y py-[1cqw]" style={{ borderColor: t.frame, fontSize: '2.2cqw' }}>
            <span className="inline-flex items-center gap-[1cqw]"><Clock className="size-[3cqw]" /> <b>{c.hours} soat</b></span>
            <span className="inline-flex items-center gap-[1cqw]"><Calendar className="size-[3cqw]" /> <b>{c.date}</b></span>
          </span>
        )}
        <div className="absolute inset-x-[9%] bottom-[8%] flex items-end justify-between" style={{ fontSize: '1.9cqw' }}>
          <span className="text-left">
            <span className="block font-serif italic" style={{ fontSize: '3.4cqw', lineHeight: 1 }}>{c.speaker.replace('Dr. ', '').split(' ')[0]}</span>
            <span className="mt-[0.4cqw] block border-t pt-[0.4cqw]" style={{ borderColor: t.frame }}>{c.speaker}</span>
            {big && <span className="block opacity-70">Ma’ruzachi</span>}
          </span>
          <Seal />
          <span className="text-right">
            <span className="block">{c.place === 'Onlayn' ? 'Toshkent' : c.place}</span>
            <span className="block font-semibold">{c.date}</span>
          </span>
        </div>
      </div>
    </div>
  )
}

function Seal() {
  return (
    <span className="grid size-[11cqw] place-items-center rounded-full" style={{ background: 'radial-gradient(circle at 35% 30%, #fff3b0, #e0b443 45%, #a8781c 100%)', boxShadow: '0 0 0 0.6cqw #f2d27a inset' }}>
      <ToothIcon className="size-[5cqw] text-[#7a5410]" strokeWidth={2} />
    </span>
  )
}

function Stat({ icon: Icon, value, label }) {
  return (
    <span className="flex items-center gap-2 px-4">
      <span className="grid size-9 place-items-center rounded-full bg-white text-sea"><Icon className="size-4" /></span>
      <span>
        <b className="block text-[16px] leading-none">{value}</b>
        <span className="text-[11px] text-muted">{label}</span>
      </span>
    </span>
  )
}

function Info({ label, icon: Icon, children }) {
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] items-start gap-2">
      <dt className="text-muted">{label}</dt>
      <dd className="flex min-w-0 items-start gap-1.5 font-semibold">{Icon && <Icon className="mt-0.5 size-3.5 shrink-0 text-sea" />}<span className="min-w-0">{children}</span></dd>
    </div>
  )
}

export function Qr({ seed, className = 'size-20' }) {
  const n = 21
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  const cells = []
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const finder = (x < 7 && y < 7) || (x > n - 8 && y < 7) || (x < 7 && y > n - 8)
      let on = false
      if (finder) {
        const lx = x > n - 8 ? x - (n - 7) : x
        const ly = y > n - 8 ? y - (n - 7) : y
        on = lx === 0 || ly === 0 || lx === 6 || ly === 6 || (lx > 1 && lx < 5 && ly > 1 && ly < 5)
      } else {
        h = Math.imul(h ^ (x + y * 31), 16777619)
        on = (h & 3) !== 0
      }
      if (on) cells.push(`${x}-${y}`)
    }
  }
  return (
    <svg viewBox={`0 0 ${n} ${n}`} className={className}>
      <rect width={n} height={n} fill="#fff" />
      {cells.map((cell) => {
        const [x, y] = cell.split('-')
        return <rect key={cell} x={x} y={y} width="1" height="1" fill="#0b1f3a" />
      })}
    </svg>
  )
}

export function printCert(c, owner = 'Sizning ismingiz') {
  const t = THEMES[c.theme] || THEMES.teal
  const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]))
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(c.id)}</title>
<style>
@page { size: A4 landscape; margin: 0; }
body { margin: 0; font-family: Georgia, serif; }
.c { position: relative; width: 297mm; height: 210mm; box-sizing: border-box; background: ${t.bg}; color: ${t.ink}; text-align: center; padding: 18mm 30mm; overflow: hidden; }
.f { position: absolute; inset: 9mm; border: 1px solid ${t.frame}; }
.k { position: absolute; width: 80mm; height: 90mm; background: ${t.corner}; transform: rotate(35deg); }
.k1 { left: -30mm; top: -45mm; } .k2 { right: -30mm; bottom: -45mm; }
h1 { font-size: 64px; letter-spacing: 10px; margin: 14px 0 8px; font-weight: 400; }
.n { font-size: 36px; font-weight: 700; margin: 10px 0; }
.t { font-size: 26px; color: ${t.accent}; font-family: Arial, sans-serif; font-weight: 700; }
.s { font-family: Arial, sans-serif; font-size: 15px; }
.b { position: absolute; left: 30mm; right: 30mm; bottom: 22mm; display: flex; justify-content: space-between; font-family: Arial, sans-serif; font-size: 13px; }
</style></head><body><div class="c"><div class="k k1"></div><div class="k k2"></div><div class="f"></div>
<div class="s" style="font-weight:700;color:${t.accent}">StomaHub</div>
<h1>SERTIFIKAT</h1>
<div class="s">Mazkur sertifikat bilan tasdiqlanadiki,</div>
<div class="n">Dr. ${esc(owner)}</div>
<div class="t">«${esc(c.title)}»</div>
<div class="s" style="margin-top:8px">${esc(TYPE_LINE[c.type])}</div>
<div class="s" style="margin-top:16px">${c.hours} soat · ${c.cme} CME · ${esc(c.date)}</div>
<div class="b"><span>${esc(c.speaker)}<br>Ma’ruzachi</span><span>${esc(c.id)}</span><span>StomaHub<br>Ta’lim platformasi</span></div>
</div><script>window.onload = () => { window.print() }</script></body></html>`
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
}
