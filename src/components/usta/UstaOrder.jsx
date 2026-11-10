import { useState } from 'react'
import { Check, Phone, Send, Info } from 'lucide-react'
import { BottomSheet } from '../mobile/MobileSeminars'
import PhoneInput from '../PhoneInput'
import { copyTextSync } from '../../lib/telegramShare'
import {
  ustaTelegram, ustaPhone, phoneLabel, telegramChatUrl, buildUstaOrderMessage, buildUstaGreeting, listingUrl, openExternal,
} from '../../ustaContact'

export const TG_OPENED = 'Telegram ochildi — xabarni yuboring'
const TIMES = ['09:00', '11:00', '14:00', '16:00', '18:00']
const DAYS = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh']
const field = (bad) => `h-11 w-full rounded-xl border px-3 text-[14px] outline-none focus:border-sea ${bad ? 'border-sale' : 'border-line'}`
const chipCls = (on) => `flex h-9 items-center gap-1 rounded-xl border px-3 text-[12.5px] font-medium ${on ? 'border-sea bg-sea-50 text-sea' : 'border-line text-ink'}`
const phoneOk = (p) => {
  const d = String(p || '').replace(/\D/g, '')
  return d.length === 12 && d.startsWith('998')
}
const priceText = (p) => (typeof p === 'number' ? `${p.toLocaleString('ru-RU').replace(/\u00a0/g, ' ')} so‘m` : String(p || ''))

/** Telegram’ni salom matni bilan ochadi (bosish ichida chaqiring). */
export function openUstaChat(m, onToast) {
  const tg = ustaTelegram(m)
  if (!tg) return false
  const text = buildUstaGreeting({ m, url: listingUrl(m.id) })
  copyTextSync(text)
  openExternal(telegramChatUrl(tg, text))
  onToast?.(TG_OPENED)
  return true
}

export function OrderSheet({ m, service, onClose, onDone, centered = false }) {
  const tg = ustaTelegram(m)
  const tel = ustaPhone(m)
  const days = Array.from({ length: 6 }, (_, i) => {
    const x = new Date()
    x.setHours(12, 0, 0, 0)
    x.setDate(x.getDate() + i)
    return x
  })
  const [svc, setSvc] = useState(service?.id || m.services[0]?.id)
  const [model, setModel] = useState('')
  const [problem, setProblem] = useState('')
  const [day, setDay] = useState(0)
  const [time, setTime] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('+998 ')
  const [tried, setTried] = useState(false)
  const picked = m.services.find((s) => s.id === svc) || m.services[0]
  const errs = { problem: problem.trim().length < 5, time: !time, address: address.trim().length < 3, phone: !phoneOk(phone) }
  const ok = !Object.values(errs).some(Boolean)

  const submit = () => {
    setTried(true)
    if (!ok || !tg) return
    const text = buildUstaOrderMessage({ m, service: picked, model, problem, date: days[day], time, address, phone, url: listingUrl(m.id) })
    copyTextSync(text)
    openExternal(telegramChatUrl(tg, text))
    onDone(TG_OPENED)
  }

  const head = (
    <div className="mt-2 flex items-center gap-2.5 rounded-2xl bg-[#f2f8f8] p-2.5">
      <span className="size-11 shrink-0 overflow-hidden rounded-full bg-white"><img src={m.photo} alt="" className="size-full object-cover" /></span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-bold text-ink">{m.name}</p>
        <p className="truncate text-[11.5px] text-muted">{m.role}</p>
      </div>
    </div>
  )

  if (!tg) {
    return (
      <BottomSheet title="Buyurtma berish" centered={centered} onClose={onClose} footer={tel
        ? <a href={`tel:${tel}`} data-testid="usta-call" className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0b8a95] text-[14px] font-semibold text-white"><Phone className="size-5" /> Qo‘ng‘iroq qilish · {phoneLabel(tel)}</a>
        : <button type="button" onClick={onClose} className="h-12 flex-1 rounded-xl border border-line text-[14px] font-semibold text-ink">Yopish</button>}>
        {head}
        <p data-testid="usta-no-tg" className="mt-3 flex gap-2 rounded-xl bg-[#fff6e5] px-3 py-2.5 text-[12.5px] leading-snug text-[#8a5300]">
          <Info className="mt-0.5 size-4 shrink-0" />
          {tel ? 'Bu usta Telegram ko‘rsatmagan. Buyurtmani qo‘ng‘iroq orqali kelishib oling.' : 'Bu usta hali aloqa ma’lumotini kiritmagan.'}
        </p>
        <p className="mt-3 text-[13px] font-semibold text-ink">Xizmatlar</p>
        <div className="mt-1.5 flex flex-col divide-y divide-line/60 rounded-xl border border-line/70">
          {m.services.map((s) => <p key={s.id} className="flex justify-between gap-2 px-3 py-2 text-[12.5px]"><span className="text-ink">{s.name}</span><b className="shrink-0 text-[#0b8a95]">{s.priceText || priceText(s.price)}</b></p>)}
        </div>
        <div className="h-2" />
      </BottomSheet>
    )
  }

  return (
    <BottomSheet title="Buyurtma berish" centered={centered} onClose={onClose} footer={<button type="button" onClick={submit} data-testid="usta-order-submit" className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#229ed9] text-[14px] font-semibold text-white"><Send className="size-[18px]" /> Telegram’da yuborish</button>}>
      {head}
      <p className="mt-2 text-[11.5px] leading-snug text-muted">Ma’lumotlar Telegram’da tayyor xabar bo‘lib ochiladi — uni ustaga o‘zingiz yuborasiz. Narx va vaqtni usta bilan kelishasiz.</p>
      <p className="mt-3 text-[13px] font-semibold text-ink">Xizmat</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {m.services.map((s) => <button key={s.id} type="button" aria-pressed={svc === s.id} onClick={() => setSvc(s.id)} className={chipCls(svc === s.id)}>{svc === s.id && <Check className="size-3.5" />}{s.name}</button>)}
      </div>
      {(picked?.priceText || picked?.price) && <p className="mt-1.5 text-[12px] text-muted">Narx: <b className="text-[#0b8a95]">{picked.priceText || priceText(picked.price)}</b></p>}
      <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Jihoz modeli (masalan, NSK Pana-Max)" className={`mt-3 ${field(false)}`} />
      <textarea value={problem} onChange={(e) => setProblem(e.target.value)} rows={2} placeholder="Muammoni qisqacha yozing..." className={`mt-2 w-full resize-none rounded-xl border px-3 py-2.5 text-[13.5px] outline-none focus:border-sea ${tried && errs.problem ? 'border-sale' : 'border-line'}`} />
      <p className="mt-3 text-[13px] font-semibold text-ink">Qachon qulay?</p>
      <div className="mt-2 grid grid-cols-6 gap-1.5">
        {days.map((x, i) => (
          <button key={i} type="button" aria-pressed={day === i} onClick={() => setDay(i)} className={`flex h-14 flex-col items-center justify-center rounded-xl border text-[11px] ${day === i ? 'border-[#0b8a95] bg-[#0b8a95] text-white' : 'border-line text-ink-2'}`}>
            {i === 0 ? 'Bugun' : DAYS[x.getDay()]}<b className="text-[15px]">{x.getDate()}</b>
          </button>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-5 gap-1.5">
        {TIMES.map((t) => <button key={t} type="button" aria-pressed={time === t} onClick={() => setTime(t)} className={`h-10 rounded-xl border text-[12.5px] font-semibold ${time === t ? 'border-[#0b8a95] bg-[#e6f4f3] text-[#0b6d73]' : 'border-line text-ink'}`}>{t}</button>)}
      </div>
      {tried && errs.time && <p className="mt-1 text-[11.5px] text-sale">Vaqtni tanlang</p>}
      <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Klinika manzili" className={`mt-3 ${field(tried && errs.address)}`} />
      <PhoneInput value={phone} onChange={setPhone} valueMode="e164" className={`mt-2 ${field(tried && errs.phone)}`} invalid={tried && errs.phone} placeholder="+998 90 123 45 67" />
      {tried && !ok && <p className="mt-1 text-[11.5px] text-sale">Qizil maydonlarni to‘ldiring</p>}
      <div className="h-2" />
    </BottomSheet>
  )
}
