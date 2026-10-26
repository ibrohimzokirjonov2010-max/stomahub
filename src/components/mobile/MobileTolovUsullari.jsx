import { useCallback, useEffect, useState } from 'react'
import { Check, ChevronRight, CreditCard, Pencil, Plus, ShieldCheck, Trash2, Unlink } from 'lucide-react'
import { profileStore, useProfile } from '../../profileStore'
import { MobileToast } from './parts'
import MobileTabBar from './MobileTabBar'
import { BottomSheet } from './MobileSeminars'
import { PayLogo } from './MobileSeminarReg'
import { SubTopBar } from './MobileManzillar'

const teal = 'text-[#0b6d73]'
const navy = 'text-[#0d2a4a]'
const WALLETS = {
  click: ['Click', 'Click ilovasi orqali to‘lov'],
  payme: ['Payme', 'Payme ilovasi orqali to‘lov'],
  uzum: ['Uzum Bank', 'Uzum ilovasi orqali to‘lov'],
}
const BANKS = ['Aloqabank', 'Kapitalbank', 'Hamkorbank', 'Ipak Yo‘li', 'Asakabank', 'Agrobank', 'TBC Bank', 'Anorbank', 'Boshqa bank']
const fmtPhone = (p) => `+998 ${p.slice(0, 2)} ${p.slice(2, 5)} ${p.slice(5, 7)} ${p.slice(7, 9)}`
export const brandOf = (d) => (d.startsWith('8600') || d.startsWith('5614') ? 'Uzcard' : d.startsWith('9860') ? 'Humo' : d.startsWith('4') ? 'Visa' : d.startsWith('5') || d.startsWith('2') ? 'Mastercard' : 'Karta')

function Chip({ className = 'h-[14px] w-[19px]' }) {
  return (
    <span className={`block rounded-[3px] bg-[linear-gradient(135deg,#e9edf0,#b9c2c9)] ${className}`}>
      <span className="mx-auto block h-full w-px bg-[#9aa5ad]/60" />
    </span>
  )
}

export function CardArt({ brand, last4, exp, large = false }) {
  const box = large ? 'h-[178px] w-full rounded-2xl p-5' : 'h-[58px] w-[100px] rounded-xl p-2'
  const word = large ? 'text-[22px]' : 'text-[13px]'
  const art = {
    Uzcard: (
      <>
        <span className={`flex items-center gap-1 font-bold tracking-[0.18em] text-white ${large ? 'text-[16px]' : 'text-[9px]'}`}>
          <span className={`grid place-items-center rounded-[4px] bg-white/90 font-black text-[#0f6b5f] ${large ? 'size-6 text-[13px]' : 'size-3.5 text-[8px]'}`}>U</span> UZCARD
        </span>
      </>
    ),
    Humo: (
      <>
        <span className="pointer-events-none absolute -right-6 top-0 h-full w-1/2 skew-x-[-24deg] bg-[linear-gradient(180deg,#e7c77d,#b8923f)] opacity-90" />
        <span style={{ backgroundImage: 'linear-gradient(90deg,#f3d58a,#c79a3e)', WebkitBackgroundClip: 'text', backgroundClip: 'text' }} className={`relative inline-block pr-1 font-black italic leading-none tracking-wide text-transparent ${word}`}>HUMO</span>
      </>
    ),
    Visa: <span className={`absolute font-black italic text-white ${large ? 'bottom-5 right-5 text-[26px]' : 'bottom-2 right-2.5 text-[13px]'}`}>VISA</span>,
    Mastercard: (
      <span className={`absolute flex ${large ? 'bottom-5 right-5' : 'bottom-2 right-2'}`}>
        <span className={`rounded-full bg-[#eb001b] ${large ? 'size-9' : 'size-4'}`} />
        <span className={`rounded-full bg-[#f79e1b]/90 ${large ? '-ml-4 size-9' : '-ml-2 size-4'}`} />
      </span>
    ),
    Karta: <CreditCard className={`text-white/80 ${large ? 'size-7' : 'size-4'}`} />,
  }
  const bg = {
    Uzcard: 'bg-[linear-gradient(125deg,#0d5d54,#139080_60%,#1aa391)]',
    Humo: 'bg-[linear-gradient(125deg,#0b2f26,#123f34_60%,#16473b)]',
    Visa: 'bg-[linear-gradient(125deg,#141a5e,#2a3597)]',
    Mastercard: 'bg-[linear-gradient(125deg,#2a2826,#57504a)]',
    Karta: 'bg-[linear-gradient(125deg,#4a5b72,#7d8ea5)]',
  }
  return (
    <span className={`relative flex shrink-0 flex-col justify-between overflow-hidden shadow-[0_4px_10px_rgb(13_42_74/0.18)] ${box} ${bg[brand] || bg.Karta}`}>
      <span className="relative">{art[brand] || art.Karta}</span>
      {large && <span className="relative font-mono text-[19px] tracking-[0.12em] text-white">{last4}</span>}
      <span className="relative flex items-end justify-between">
        <Chip className={large ? 'h-[22px] w-[30px]' : undefined} />
        {large && exp && <span className="mr-auto pl-4 text-[12px] text-white/80">{exp}</span>}
      </span>
    </span>
  )
}

export default function MobileTolovUsullari() {
  const profile = useProfile()
  const [sheet, setSheet] = useState(null)
  const [toast, setToast] = useState(null)
  const closeToast = useCallback(() => setToast(null), [])
  useEffect(() => { window.scrollTo(0, 0) }, [])

  const wallets = Object.keys(WALLETS).filter((id) => profile.wallets[id])
  const others = Object.keys(WALLETS).filter((id) => !profile.wallets[id])
  const methods = [...wallets.map((id) => ({ id, wallet: true })), ...profile.cards.map((c) => ({ ...c, wallet: false }))]
  const main = methods.some((m) => m.id === profile.defaultPay) ? profile.defaultPay : methods[0]?.id

  const snap = (text) => {
    const s = { wallets: profile.wallets, cards: profile.cards, defaultPay: profile.defaultPay }
    setToast({ text, undo: () => { profileStore.update(s); setToast(null) } })
  }
  const afterRemove = (patch, id) => ({ ...patch, defaultPay: main === id ? methods.find((m) => m.id !== id)?.id || '' : main })

  const actions = {
    setMain: (id) => { if (id !== main) { snap('Asosiy to‘lov usuli o‘zgartirildi'); profileStore.update({ defaultPay: id }) } },
    disconnect: (id) => { snap(`${WALLETS[id][0]} uzildi`); profileStore.update(afterRemove({ wallets: { ...profile.wallets, [id]: false } }, id)); setSheet(null) },
    connect: (id) => { profileStore.update({ wallets: { ...profile.wallets, [id]: true }, defaultPay: main || id }); setToast({ text: `${WALLETS[id][0]} ulandi` }); setSheet(null) },
    removeCard: (id) => { snap('Karta o‘chirildi'); profileStore.update(afterRemove({ cards: profile.cards.filter((c) => c.id !== id) }, id)); setSheet(null) },
    saveCard: (card, makeMain) => {
      const exists = profile.cards.some((c) => c.id === card.id)
      profileStore.update({ cards: exists ? profile.cards.map((c) => (c.id === card.id ? card : c)) : [...profile.cards, card], defaultPay: makeMain || !main ? card.id : main })
      setToast({ text: exists ? 'Karta ma’lumotlari saqlandi' : 'Karta qo‘shildi' })
      setSheet(null)
    },
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef8f7_0%,#f6faf9_28%,#f6faf9_100%)] pb-[150px]">
      <div className="px-4 pt-3">
        <SubTopBar title="To‘lov usullari" subtitle="Saqlangan kartalar va to‘lov usullarini boshqarish" />

        <p className={`mt-5 text-[15px] font-semibold ${navy}`}>Saqlangan to‘lov usullari</p>
        {!methods.length && <p className="mt-2 rounded-2xl border border-dashed border-[#cfe0e3] bg-white p-4 text-center text-[13px] text-muted">Hozircha to‘lov usuli yo‘q. Karta qo‘shing yoki ilovani ulang.</p>}
        <div className="mt-2.5 flex flex-col gap-3">
          {methods.map((m) => {
            const isMain = m.id === main
            return (
              <article key={m.id} onClick={() => actions.setMain(m.id)} className={`relative flex cursor-pointer items-center gap-3.5 rounded-2xl border p-3.5 transition active:scale-[0.995] ${isMain ? 'border-[#cde9e4] bg-[#f0f9f7]' : 'border-[#e5eef0] bg-white'} shadow-[0_1px_6px_rgb(11_31_58/0.04)]`}>
                {m.wallet ? <span className="flex w-[100px] shrink-0 justify-center"><PayLogo id={m.id} size="size-[56px] text-[24px]!" /></span> : <CardArt brand={m.brand} />}
                <div className="min-w-0 flex-1 pr-11">
                  <p className={`flex items-center justify-between gap-2 text-[15.5px] font-bold ${navy}`}>
                    <span className="truncate">{m.wallet ? WALLETS[m.id][0] : m.brand}</span>
                    {isMain && (
                      <span className={`flex shrink-0 items-center gap-1.5 rounded-full bg-[#dcf1ec] px-2.5 py-1 text-[12px] font-semibold ${teal}`}>
                        <span className="grid size-4 place-items-center rounded-full bg-[#0b6d73] text-white"><Check className="size-2.5" strokeWidth={4} /></span> Asosiy
                      </span>
                    )}
                  </p>
                  {m.wallet ? (
                    <>
                      <p className="mt-0.5 text-[12px] leading-snug text-[#6b7b8c]">{WALLETS[m.id][1]}</p>
                      <p className={`mt-1 text-[11.5px] font-medium ${teal}`}>Tez va qulay to‘lov</p>
                    </>
                  ) : (
                    <>
                      <p className={`mt-0.5 font-semibold tracking-wide ${navy} text-[14.5px]`}>•••• {m.last4}</p>
                      <p className="mt-0.5 truncate text-[11.5px] text-[#6b7b8c]">{m.bank}</p>
                    </>
                  )}
                </div>
                <div className="absolute right-3.5 top-3.5">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={(e) => { e.stopPropagation(); setSheet({ type: m.wallet ? 'wallet' : 'card', id: m.id }) }} aria-label={`${m.wallet ? WALLETS[m.id][0] : `${m.brand} ${m.last4}`} sozlamalari`} className={`grid size-10 place-items-center rounded-xl border border-[#e0eaed] bg-white ${teal}`}>
                      <Pencil className="size-[18px]" />
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
        {methods.length > 1 && <p className="mt-2.5 text-center text-[11.5px] text-muted">Asosiy qilish uchun to‘lov usuli ustiga bosing</p>}

        <p className={`mt-5 text-[15px] font-semibold ${navy}`}>Boshqa usullar</p>
        <div className="mt-2.5 flex flex-col gap-2.5">
          <button type="button" onClick={() => setSheet({ type: 'add' })} className="flex w-full items-center gap-3.5 rounded-2xl border border-[#e5eef0] bg-white p-3.5 text-left active:bg-[#f6faf9]">
            <span className={`grid size-12 shrink-0 place-items-center rounded-full bg-[#e3f4f1] ${teal}`}><CreditCard className="size-6" strokeWidth={1.7} /></span>
            <span className="min-w-0 flex-1">
              <span className={`block text-[14.5px] font-bold ${navy}`}>Yangi karta qo‘shish</span>
              <span className="block truncate text-[12px] text-[#6b7b8c]">Uzcard, Humo yoki Visa/MasterCard</span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-[#8a9bab]" />
          </button>
          {others.map((id) => (
            <button key={id} type="button" onClick={() => setSheet({ type: 'connect', id })} className="flex w-full items-center gap-3.5 rounded-2xl border border-[#e5eef0] bg-white p-3.5 text-left active:bg-[#f6faf9]">
              <PayLogo id={id} size="size-12" />
              <span className="min-w-0 flex-1">
                <span className={`block text-[14.5px] font-bold ${navy}`}>{WALLETS[id][0]}ni ulash</span>
                <span className="block truncate text-[12px] text-[#6b7b8c]">{WALLETS[id][1]}</span>
              </span>
              <span className={`rounded-full bg-[#e3f4f1] px-3 py-1 text-[12px] font-semibold ${teal}`}>Ulash</span>
            </button>
          ))}
        </div>
        <p className="mt-4 flex items-center justify-center gap-1.5 text-[11.5px] text-muted"><ShieldCheck className="size-4 text-[#16a34a]" /> Karta ma’lumotlari shifrlangan holda saqlanadi</p>
      </div>

      <div className="fixed inset-x-0 bottom-[62px] z-30 bg-gradient-to-t from-[#f6faf9] via-[#f6faf9] to-[#f6faf9]/0 px-4 pb-2.5 pt-4">
        <button type="button" onClick={() => setSheet({ type: 'add' })} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0b6d73] text-[15px] font-semibold text-white shadow-[0_6px_16px_rgb(11_109_115/0.3)] active:scale-[0.99]">
          <Plus className="size-5" /> Karta qo‘shish
        </button>
      </div>

      {sheet?.type === 'wallet' && <WalletSheet id={sheet.id} phone={profile.phone} isMain={sheet.id === main} onMain={() => { actions.setMain(sheet.id); setSheet(null) }} onDisconnect={() => actions.disconnect(sheet.id)} onClose={() => setSheet(null)} />}
      {sheet?.type === 'connect' && <ConnectSheet id={sheet.id} phone={profile.phone} onDone={() => actions.connect(sheet.id)} onClose={() => setSheet(null)} />}
      {(sheet?.type === 'card' || sheet?.type === 'add') && (
        <CardSheet
          card={sheet.type === 'card' ? profile.cards.find((c) => c.id === sheet.id) : null}
          cards={profile.cards}
          phone={profile.phone}
          isMain={sheet.id === main}
          onSave={actions.saveCard}
          onRemove={actions.removeCard}
          onClose={() => setSheet(null)}
        />
      )}

      <MobileToast
        text={toast?.text}
        onClose={closeToast}
        bottom={136}
        action={toast?.undo && <button type="button" onClick={toast.undo} className="shrink-0 text-[13px] font-semibold text-[#5fe0c8]">Qaytarish</button>}
      />
      <MobileTabBar />
    </div>
  )
}

const input = (bad) => `mt-1 h-11 w-full rounded-xl border bg-white px-3 text-[14px] text-ink outline-none focus:border-[#0b8a7a] ${bad ? 'border-sale' : 'border-[#dfe7ea]'}`

function Field({ label, err, children }) {
  return (
    <label className="mt-3 block">
      <span className="text-[12px] font-medium text-ink-2">{label}</span>
      {children}
      {err && <span className="mt-1 block text-[11.5px] text-sale">{err}</span>}
    </label>
  )
}

function MainSwitch({ on, onChange, disabled }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onChange} disabled={disabled} className="mt-4 flex w-full items-center justify-between rounded-xl bg-[#f3f8f8] px-3 py-3 text-left disabled:opacity-70">
      <span>
        <span className={`block text-[13.5px] font-semibold ${navy}`}>Asosiy to‘lov usuli</span>
        <span className="block text-[11.5px] text-muted">Buyurtmada avtomatik tanlanadi</span>
      </span>
      <span className={`relative h-[26px] w-[46px] shrink-0 rounded-full transition ${on ? 'bg-[#0b6d73]' : 'bg-[#cfd8de]'}`}>
        <span className={`absolute top-[3px] size-5 rounded-full bg-white shadow transition-all ${on ? 'left-[23px]' : 'left-[3px]'}`} />
      </span>
    </button>
  )
}

function CodeStep({ phone, code, setCode, err }) {
  return (
    <>
      <p className="mt-3 text-[13px] text-ink-2">{fmtPhone(phone)} raqamiga SMS kod yuborildi</p>
      <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))} autoFocus inputMode="numeric" placeholder="• • • •" aria-label="SMS kod" className={`mt-2 h-12 w-full rounded-xl border text-center text-[20px] tracking-[0.5em] outline-none ${err ? 'border-sale' : 'border-[#dfe7ea]'}`} />
      <p className={`mt-1.5 text-[11.5px] ${err ? 'text-sale' : 'text-muted'}`}>{err || 'Sinov uchun kod: 1234'}</p>
    </>
  )
}

function WalletSheet({ id, phone, isMain, onMain, onDisconnect, onClose }) {
  return (
    <BottomSheet
      title={WALLETS[id][0]}
      onClose={onClose}
      footer={<button type="button" onClick={onDisconnect} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-[#f3c9c9] text-[14px] font-semibold text-sale"><Unlink className="size-[18px]" /> Hisobni uzish</button>}
    >
      <div className="mt-3 flex items-center gap-3 rounded-2xl bg-[#f3f8f8] p-3">
        <PayLogo id={id} size="size-12" />
        <div>
          <p className={`text-[14px] font-semibold ${navy}`}>Ulangan hisob</p>
          <p className="text-[12.5px] text-ink-2">{fmtPhone(phone)}</p>
        </div>
      </div>
      <MainSwitch on={isMain} onChange={onMain} disabled={isMain} />
    </BottomSheet>
  )
}

function ConnectSheet({ id, phone, onDone, onClose }) {
  const [sent, setSent] = useState(false)
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const submit = () => {
    if (!sent) return setSent(true)
    if (code !== '1234') return setErr('Kod noto‘g‘ri')
    onDone()
  }
  return (
    <BottomSheet title={`${WALLETS[id][0]}ni ulash`} onClose={onClose} footer={<button type="button" onClick={submit} className="h-12 flex-1 rounded-xl bg-[#0b6d73] text-[14.5px] font-semibold text-white">{sent ? 'Tasdiqlash' : 'SMS kod olish'}</button>}>
      <div className="mt-3 flex items-center gap-3">
        <PayLogo id={id} size="size-12" />
        <p className="text-[12.5px] text-ink-2">{WALLETS[id][0]} hisobingiz {fmtPhone(phone)} raqamiga bog‘lanadi. Keyin buyurtmalarni bir bosishda to‘lashingiz mumkin.</p>
      </div>
      {sent && <CodeStep phone={phone} code={code} setCode={(v) => { setCode(v); setErr('') }} err={err} />}
    </BottomSheet>
  )
}

function CardSheet({ card, cards, phone, isMain, onSave, onRemove, onClose }) {
  const [num, setNum] = useState('')
  const [exp, setExp] = useState(card?.exp || '')
  const [bank, setBank] = useState(card?.bank || BANKS[0])
  const [main, setMain] = useState(isMain || !cards.length)
  const [tried, setTried] = useState(false)
  const [step, setStep] = useState('form')
  const [code, setCode] = useState('')
  const [codeErr, setCodeErr] = useState('')
  const digits = num.replace(/\D/g, '').slice(0, 16)
  const brand = card ? card.brand : brandOf(digits)
  const [mm, yy] = exp.split('/').map(Number)
  const now = new Date()
  const expOk = mm >= 1 && mm <= 12 && (2000 + yy > now.getFullYear() || (2000 + yy === now.getFullYear() && mm >= now.getMonth() + 1))
  const dup = !card && digits.length === 16 && cards.some((c) => c.brand === brand && c.last4 === digits.slice(-4))
  const errs = {
    num: !card && (digits.length !== 16 ? '16 ta raqam kiriting' : dup ? 'Bu karta allaqachon qo‘shilgan' : ''),
    exp: !expOk && 'Muddat noto‘g‘ri',
  }
  const finish = () => onSave({ id: card?.id || `c${Date.now()}`, brand, last4: card ? card.last4 : digits.slice(-4), exp, bank }, main)
  const submit = () => {
    if (step === 'code') {
      if (code !== '1234') return setCodeErr('Kod noto‘g‘ri')
      return finish()
    }
    setTried(true)
    if (errs.num || errs.exp) return
    if (card) return finish()
    setStep('code')
  }
  const shown = card ? `•••• •••• •••• ${card.last4}` : (digits.padEnd(16, '•').match(/.{4}/g) || []).join(' ')

  return (
    <BottomSheet
      title={card ? `${card.brand} •••• ${card.last4}` : 'Yangi karta'}
      onClose={onClose}
      footer={
        <>
          {card && <button type="button" onClick={() => onRemove(card.id)} aria-label="Kartani o‘chirish" className="grid size-12 shrink-0 place-items-center rounded-xl border border-[#f3c9c9] text-sale"><Trash2 className="size-5" /></button>}
          <button type="button" onClick={submit} className="h-12 flex-1 rounded-xl bg-[#0b6d73] text-[14.5px] font-semibold text-white">{step === 'code' ? 'Tasdiqlash' : card ? 'Saqlash' : 'Davom etish'}</button>
        </>
      }
    >
      <div className="mt-3"><CardArt brand={brand} last4={shown} exp={exp || 'OO/YY'} large /></div>
      {step === 'code' ? (
        <CodeStep phone={phone} code={code} setCode={(v) => { setCode(v); setCodeErr('') }} err={codeErr} />
      ) : (
        <>
          {!card && (
            <Field label="Karta raqami" err={tried && errs.num}>
              <input value={digits.replace(/(.{4})/g, '$1 ').trim()} onChange={(e) => setNum(e.target.value)} inputMode="numeric" autoComplete="cc-number" placeholder="8600 0000 0000 0000" className={input(tried && errs.num)} />
            </Field>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Field label="Amal qilish muddati" err={tried && errs.exp}>
              <input value={exp} onChange={(e) => { const d = e.target.value.replace(/\D/g, '').slice(0, 4); setExp(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d) }} inputMode="numeric" autoComplete="cc-exp" placeholder="OO/YY" className={input(tried && errs.exp)} />
            </Field>
            <Field label="Bank">
              <select value={bank} onChange={(e) => setBank(e.target.value)} className={input()}>{BANKS.map((b) => <option key={b}>{b}</option>)}</select>
            </Field>
          </div>
          <MainSwitch on={main} onChange={() => setMain((v) => !v)} disabled={isMain} />
        </>
      )}
    </BottomSheet>
  )
}
