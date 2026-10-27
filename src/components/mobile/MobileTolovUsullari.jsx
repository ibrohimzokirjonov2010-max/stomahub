import { useEffect, useState } from 'react'
import { CreditCard, Plus, Trash2, Wallet } from 'lucide-react'
import { flushProfile, profileStore, useProfile } from '../../profileStore'
import {
  CARD_BRANDS,
  demoBadgeProps,
  isDemoPayments,
  linkWalletInput,
  tokenizeCardInput,
  WALLET_PROVIDERS,
} from '../../payments/paymentService'
import MobileTabBar from './MobileTabBar'
import { SubTopBar } from './MobileManzillar'
import { MobileToast } from './parts'

const navy = 'text-[#0d2a4a]'
const field = 'mt-1.5 h-11 w-full rounded-xl border border-[#d7e5e3] bg-white px-3 text-[14px] text-[#1a2b3c] outline-none focus:border-[#0F766E]'

export default function MobileTolovUsullari() {
  const profile = useProfile()
  const [cardForm, setCardForm] = useState(null)
  const [walletForm, setWalletForm] = useState(null)
  const [toast, setToast] = useState('')
  const [err, setErr] = useState('')
  const demo = isDemoPayments()
  const badge = demoBadgeProps()
  const cards = profile.cards || []
  const wallets = profile.linkedWallets || []

  useEffect(() => { window.scrollTo(0, 0) }, [])
  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(''), 2500)
    return () => clearTimeout(t)
  }, [toast])

  const saveCard = async () => {
    try {
      setErr('')
      const token = tokenizeCardInput(cardForm)
      let next = [...cards.filter((c) => c.id !== token.id), token]
      if (token.isDefault || !cards.length) next = next.map((c) => ({ ...c, isDefault: c.id === token.id }))
      profileStore.update({ cards: next, defaultPay: token.isDefault ? `card:${token.id}` : profile.defaultPay })
      await flushProfile()
      setCardForm(null)
      setToast('Karta qo‘shildi (faqat oxirgi 4 raqam)')
    } catch (e) {
      setErr(e.message || 'Saqlanmadi')
    }
  }

  const saveWallet = async () => {
    try {
      setErr('')
      const row = linkWalletInput(walletForm)
      const rest = wallets.filter((w) => w.provider !== row.provider)
      const next = [...(row.isDefault ? rest.map((w) => ({ ...w, isDefault: false })) : rest), row]
      profileStore.update({ linkedWallets: next, defaultPay: row.isDefault ? `wallet:${row.provider}` : profile.defaultPay })
      await flushProfile()
      setWalletForm(null)
      setToast(`${row.provider === 'click' ? 'Click' : 'Payme'} bog‘landi`)
    } catch (e) {
      setErr(e.message || 'Bog‘lanmadi')
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef8f7_0%,#f6faf9_28%,#f6faf9_100%)] pb-[86px]">
      <div className="px-3 pt-3">
        <SubTopBar title="To‘lov usullari" subtitle="Kartalar va hamyonlar" />
        <div className="mt-3 flex items-center gap-2">
          {demo && (
            <span title={badge.title} className="rounded-full bg-[#fff4d6] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#b45309]">{badge.label}</span>
          )}
        </div>
        <p className="mt-2 text-[12.5px] text-[#6b7c8f]">
          UZCARD/HUMO — faqat turi, oxirgi 4 raqam va muddat. Click/Payme — telefon yoki nom. PAN/CVV saqlanmaydi.
          {demo ? ' To‘lovlar demo rejimida.' : ''}
        </p>
        {(toast || err) && (
          <p className={`mt-2 rounded-xl px-3 py-2 text-[13px] ${err ? 'bg-[#fff4f4] text-[#b42318]' : 'bg-[#e7f8ee] text-[#15803d]'}`}>{err || toast}</p>
        )}

        <div className="mt-3 grid gap-2.5">
          {cards.map((c) => (
            <article key={c.id} className={`rounded-2xl p-4 text-white ${c.brand === 'HUMO' ? 'bg-gradient-to-br from-[#0b4f8a] to-[#1d7ad6]' : 'bg-gradient-to-br from-[#0F766E] to-[#14b8a6]'}`}>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold">{c.brand}</span>
                {c.isDefault && <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10.5px]">Asosiy</span>}
              </div>
              <p className="mt-5 text-[18px] font-bold tracking-[0.2em]">•••• {c.last4}</p>
              <div className="mt-3 flex items-center justify-between text-[12px]">
                <span>{c.exp}</span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-0.5"
                  onClick={async () => {
                    profileStore.update({ cards: cards.filter((x) => x.id !== c.id) })
                    await flushProfile()
                    setToast('Karta olib tashlandi')
                  }}
                >
                  <Trash2 className="size-3.5" /> O‘chirish
                </button>
              </div>
            </article>
          ))}

          {wallets.map((w) => (
            <article key={w.id} className="rounded-2xl border border-[#e7eef2] bg-white p-4 shadow-[0_1px_4px_rgb(11_31_58/0.06)]">
              <div className="flex items-center gap-2">
                <Wallet className="size-5 text-[#0F766E]" />
                <span className={`text-[14px] font-bold ${navy}`}>{w.provider === 'click' ? 'Click' : 'Payme'}</span>
                {demo && <span className="rounded-full bg-[#fff4d6] px-1.5 py-0.5 text-[10px] font-bold text-[#b45309]">Demo</span>}
              </div>
              <p className="mt-2 text-[13px] text-[#5b6b7d]">{w.label || w.phone}</p>
              <button
                type="button"
                className="mt-2 text-[12px] font-semibold text-[#d14343]"
                onClick={async () => {
                  profileStore.update({ linkedWallets: wallets.filter((x) => x.id !== w.id) })
                  await flushProfile()
                  setToast('Uzildi')
                }}
              >
                Uzish
              </button>
            </article>
          ))}

          {!cardForm && (
            <button
              type="button"
              onClick={() => setCardForm({ brand: 'UZCARD', number: '', exp: '', setDefault: !cards.length })}
              className="flex min-h-[88px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-[#0F766E]/45 bg-white text-[13px] font-semibold text-[#0F766E]"
            >
              <CreditCard className="size-5" /> Yangi karta qo‘shish
            </button>
          )}
        </div>

        {cardForm && (
          <div className="mt-3 grid gap-2 rounded-2xl border border-[#d7e5e3] bg-white p-3">
            <select className={field} value={cardForm.brand} onChange={(e) => setCardForm({ ...cardForm, brand: e.target.value })}>
              {CARD_BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <input className={field} inputMode="numeric" placeholder="Karta raqami (saqlanmaydi)" value={cardForm.number} onChange={(e) => setCardForm({ ...cardForm, number: e.target.value.replace(/\D/g, '').slice(0, 16) })} />
            <input
              className={field}
              placeholder="MM/YY"
              value={cardForm.exp}
              onChange={(e) => {
                const d = e.target.value.replace(/\D/g, '').slice(0, 4)
                const v = d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
                setCardForm({ ...cardForm, exp: v })
              }}
            />
            <label className="flex items-center gap-2 text-[13px]">
              <input type="checkbox" checked={!!cardForm.setDefault} onChange={(e) => setCardForm({ ...cardForm, setDefault: e.target.checked })} /> Asosiy qilish
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={saveCard} className="h-10 flex-1 rounded-xl bg-[#0F766E] text-[13px] font-semibold text-white">Saqlash</button>
              <button type="button" onClick={() => setCardForm(null)} className="h-10 flex-1 rounded-xl border text-[13px] font-semibold">Bekor</button>
            </div>
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {WALLET_PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setWalletForm({ provider: p.id, phone: profile.phone || '', label: '', setDefault: false })}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[#0F766E]/30 bg-white px-3 text-[12.5px] font-semibold text-[#0F766E]"
            >
              <Plus className="size-3.5" /> {p.label} bog‘lash
            </button>
          ))}
        </div>

        {walletForm && (
          <div className="mt-3 grid gap-2 rounded-2xl border border-[#d7e5e3] bg-white p-3">
            <p className={`text-[13px] font-semibold ${navy}`}>{walletForm.provider === 'click' ? 'Click' : 'Payme'} — demo bog‘lash</p>
            <input className={field} placeholder="Telefon (9 raqam)" value={walletForm.phone} onChange={(e) => setWalletForm({ ...walletForm, phone: e.target.value.replace(/\D/g, '').slice(0, 9) })} />
            <input className={field} placeholder="Nom (ixtiyoriy)" value={walletForm.label} onChange={(e) => setWalletForm({ ...walletForm, label: e.target.value })} />
            <div className="flex gap-2">
              <button type="button" onClick={saveWallet} className="h-10 flex-1 rounded-xl bg-[#0F766E] text-[13px] font-semibold text-white">Bog‘lash</button>
              <button type="button" onClick={() => setWalletForm(null)} className="h-10 flex-1 rounded-xl border text-[13px] font-semibold">Bekor</button>
            </div>
          </div>
        )}
      </div>
      {toast ? <MobileToast>{toast}</MobileToast> : null}
      <MobileTabBar />
    </div>
  )
}
