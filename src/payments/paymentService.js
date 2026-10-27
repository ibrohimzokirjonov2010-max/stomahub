/**
 * StomaHub payment service.
 * Demo mode when Click/Payme env vars are absent on the server.
 * Never accept or persist full PAN or CVV here.
 */

let cachedMode = null

export async function detectPaymentMode() {
  if (cachedMode) return cachedMode
  try {
    const [click, payme] = await Promise.all([
      fetch('/api/click').then((r) => r.json()).catch(() => ({ configured: false })),
      fetch('/api/payme').then((r) => r.json()).catch(() => ({ configured: false })),
    ])
    cachedMode = click.configured || payme.configured ? 'live' : 'demo'
  } catch {
    cachedMode = 'demo'
  }
  return cachedMode
}

export const isDemoPayments = () => (cachedMode || 'demo') !== 'live'

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
  const expDigits = String(exp || '').replace(/\D/g, '').slice(0, 4)
  const expNorm = expDigits.length === 4 ? `${expDigits.slice(0, 2)}/${expDigits.slice(2)}` : String(exp || '')
  if (!/^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(expNorm)) throw new Error('Amal qilish muddati MM/YY formatida')
  return {
    id: `c${Date.now().toString(36)}`,
    brand,
    last4: digits.slice(-4),
    exp: expNorm,
    isDefault: !!setDefault,
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
 * Create a charge.
 * - demo: local simulated success (used when Click/Payme keys absent)
 * - click/payme live: returns redirect/invoice refs; actual confirm is via merchant callbacks
 */
export async function createCharge({ method, amount, currency = 'UZS', meta = {} }) {
  if (!amount || amount < 0) throw new Error('Summa noto‘g‘ri')
  const type = method?.type || method || 'unknown'
  const mode = await detectPaymentMode()

  if (mode === 'live' && (type === 'click' || type === 'payme')) {
    // Invoice is finalized after Click/Payme callback writes payment_transactions.
    // Frontend still places the order with payment_ref; provider confirms later.
    return {
      ok: true,
      mode: 'live',
      pending: true,
      ref: `${type.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
      method: type,
      amount,
      currency,
      meta,
      hint: type === 'click'
        ? 'Click callback /api/click/complete to‘lovni tasdiqlaydi'
        : 'Payme PerformTransaction /api/payme to‘lovni tasdiqlaydi',
    }
  }

  // Demo card / cash-style simulation
  await new Promise((r) => setTimeout(r, 350))
  return {
    ok: true,
    mode: 'demo',
    ref: `DEMO-${Date.now().toString(36).toUpperCase()}`,
    method: type,
    amount,
    currency,
    meta,
  }
}

export function demoBadgeProps() {
  return { label: 'Demo rejim', title: 'To‘lovlar simulyatsiya qilinadi. Merchant kalitlari ulansa Click/Payme avtomatik ishlaydi.' }
}
