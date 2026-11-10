import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { ustaTelegram, ustaPhone } from '../ustaContact'

// Sotuvchining ochiq aloqasi (seller_public_profile: telegram va show_phone bo‘lsa telefon). Kesh — sahifalar orasida.
const cache = new Map()

export function useSellerContact(sellerId) {
  const [c, setC] = useState(() => cache.get(sellerId) || null)
  useEffect(() => {
    if (!sellerId || !supabase) return
    if (cache.has(sellerId)) { setC(cache.get(sellerId)); return }
    let off = false
    supabase.rpc('seller_public_profile', { p_id: sellerId }).then(({ data }) => {
      const v = { telegram: ustaTelegram({ telegram: data?.telegram }), phone: ustaPhone({ phone: data?.phone }), shop: data?.shop_name || '' }
      cache.set(sellerId, v)
      if (!off) setC(v)
    }, () => {})
    return () => { off = true }
  }, [sellerId])
  return c
}
