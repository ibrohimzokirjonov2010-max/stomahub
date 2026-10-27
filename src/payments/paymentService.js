/**
 * StomaHub payment service — DEMO mode.
 * Swap `createCharge` / provider adapters when Click & Payme merchant keys arrive.
 * Never accept or persist full PAN or CVV here.
 */

export const PAYMENT_MODE = 'demo' // 'demo' | 'live'
export const isDemoPayments = () => PAYMENT_MODE !== 'live'

export const CARD_BRANDS = ['UZCARD', 'HUMO']
export const WALLET_PROVIDERS = [
  { id: 'click', label: 'Click', hint: 'Click hisobiga bog‘lash' },
  { id: 'payme', label: 'Payme', hint: 'Payme hisobiga bog‘lash' },
]

/** Mask a typed card number down to last4; rejects non-16-digit input. */
export function tokenizeCardInput({ brand, number, exp, setDefault = false }) {
  const digits = String(number || '').replace(/\D/g, '')
  if (!CARD_BRANDS.includes(brand)) throw new Error('Karta turi noto‘g‘ri')
  if (digits.length !== 16) throw new Error('Karta raqami 16 ta raqam bo‘lishi kerak')
  if (!/^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(String(exp || ''))) throw new Error('Amal qilish muddati MM/YY formatida')
  return {
    id: `c${Date.now().toString(36)}`,
    brand,
    last4: digits.slice(-4),
    exp: String(exp),
    isDefault: !!setDefault,
    // cvv intentionally never accepted or returned
  }
}

export function linkWalletInput({ provider, phone, label = '', setDefault = false }) {
  if (!WALLET_PROVIDERS.some((p) => p.id === provider)) throw new Error('Provayder noto‘g‘ri')
  const digits = String(phone || '').replace(/\D/g, '').slice(-9)
  if (digits.length !== 9 && !String(label || '').trim()) throw new Error('Telefon yoki nom kiriting')
  return {
    id: `${provider}-${digits || 'x'}`,
    provider,
    phone: digits,
    label: String(label || '').trim() || `+998 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`,
    isDefault: !!setDefault,
  }
}

/**
 * Simulated charge. Live adapters will replace this body.
 * @returns {{ ok: true, mode: 'demo', ref: string }}
 */
export async function createCharge({ method, amount, currency = 'UZS', meta = {} }) {
  if (!amount || amount < 0) throw new Error('Summa noto‘g‘ri')
  if (PAYMENT_MODE === 'live') {
    // Future: route to clickAdapter / paymeAdapter / cardAcquirer based on method.type
    throw new Error('Live gateway hali ulanmagan — merchant kalitlari kutilmoqda')
  }
  await new Promise((r) => setTimeout(r, 350))
  return {
    ok: true,
    mode: 'demo',
    ref: `DEMO-${Date.now().toString(36).toUpperCase()}`,
    method: method?.type || 'unknown',
    amount,
    currency,
    meta,
  }
}

export function demoBadgeProps() {
  return { label: 'Demo rejim', title: 'To‘lovlar simulyatsiya qilinadi. Merchant kalitlari keyin ulanadi.' }
}
