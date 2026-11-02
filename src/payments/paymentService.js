/**
 * StomaHub payment service.
 * Demo mode when Click/Payme env vars are absent on the server.
 * Never accept or persist full PAN or CVV here.
 */

import { useEffect, useState } from 'react'

let cachedMode = null
let cachedConfig = null
let configPromise = null

/** Server Click/Payme sozlanganmi — faqat shunda onlayn to‘lov ko‘rsatiladi. */
export function fetchPaymentConfig() {
  if (cachedConfig) return Promise.resolve(cachedConfig)
  if (!configPromise) {
    const get = (u) => fetch(u).then((r) => (r.ok ? r.json() : {})).catch(() => ({}))
    configPromise = Promise.all([get('/api/click'), get('/api/payme')]).then(([click, payme]) => {
      cachedConfig = {
        click: { configured: !!click.configured, serviceId: click.service_id || '', merchantId: click.merchant_id || '', reversal: !!click.reversal },
        payme: { configured: !!payme.configured, merchantId: payme.merchant_id || '', test: !!payme.test },
      }
      cachedMode = cachedConfig.click.configured || cachedConfig.payme.configured ? 'live' : 'demo'
      return cachedConfig
    })
  }
  return configPromise
}

export function usePaymentConfig() {
  const [cfg, setCfg] = useState(cachedConfig)
  useEffect(() => { let on = true; fetchPaymentConfig().then((c) => on && setCfg(c)); return () => { on = false } }, [])
  return cfg
}

/** Onlayn usullar ro‘yxati (faqat sozlanganlar). */
export const onlineMethods = (cfg) => ['click', 'payme'].filter((id) => cfg?.[id]?.configured)

const b64 = (str) => btoa(unescape(encodeURIComponent(str)))

/** Buyurtma uchun to‘lov havolasi. amount — so‘mda (server qaytargan summa). */
export function payUrlFor(provider, { code, amount }, cfg, returnUrl = `${location.origin}/profil?tab=buyurtmalar`) {
  const sum = Math.round(Number(amount) || 0)
  if (!code || sum <= 0) return ''
  if (provider === 'click' && cfg?.click?.configured) {
    const q = new URLSearchParams({ service_id: cfg.click.serviceId, merchant_id: cfg.click.merchantId, amount: String(sum), transaction_param: code, return_url: returnUrl })
    return `https://my.click.uz/services/pay?${q}`
  }
  if (provider === 'payme' && cfg?.payme?.configured) {
    const host = cfg.payme.test ? 'https://checkout.test.paycom.uz/' : 'https://checkout.paycom.uz/'
    return host + b64(`m=${cfg.payme.merchantId};ac.order_id=${code};a=${sum * 100};c=${returnUrl}`)
  }
  return ''
}

export async function detectPaymentMode() {
  if (cachedMode) return cachedMode
  await fetchPaymentConfig()
  return cachedMode
}

export const isDemoPayments = () => (cachedMode || 'demo') !== 'live'
/** Click/Payme nomlari reklama matnlarida faqat haqiqiy (live) rejimda ko‘rsatiladi. */
export const payPromo = (live, demo = 'Naqd to‘lov (yetkazilganda)') => (isDemoPayments() ? demo : live)

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
