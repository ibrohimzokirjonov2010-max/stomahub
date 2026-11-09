import { supabase } from './supabaseClient'
import { currentUid } from './recordSync'
import { upsertCatalogItem } from './catalogApi'
import { profileStore } from './profileStore'
import { validateSurplus } from './surplusData'
import { normalizeTelegram } from './elonValidate'

/**
 * Ortiqcha material e’lonini bazaga saqlaydi (catalog_items, kind='surplus').
 * E’lon moderatsiyadan o‘tguncha yashirin (hidden=true) — faqat egasiga ko‘rinadi.
 * Rasm 'avatars' bucket’idagi foydalanuvchi papkasiga yuklanadi (ommaviy o‘qish, faqat egasi yozadi).
 */
export async function postSurplus(data, file) {
  const uid = currentUid()
  if (!supabase) throw new Error('Supabase sozlanmagan')
  if (!uid) throw new Error('E’lon berish uchun hisobingizga kiring')
  const errs = validateSurplus({ ...data, image: file || data.image })
  if (Object.keys(errs).length) throw new Error(Object.values(errs).join(' · '))
  if (file && file.size > 5 * 1024 * 1024) throw new Error('Rasm 5 MB dan katta bo‘lmasin')
  const id = `elon-${uid.slice(0, 8)}-${Date.now()}`
  let image = data.image
  if (file) {
    const ext = /png$/i.test(file.type) ? 'png' : /webp$/i.test(file.type) ? 'webp' : 'jpg'
    const path = `${uid}/surplus/${id}.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { contentType: file.type, upsert: false })
    if (error) throw new Error('Rasmni yuklab bo‘lmadi. Qayta urinib ko‘ring.')
    image = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
  }
  const [y, m] = String(data.expiry).split('-')
  const prof = profileStore.get() || {}
  const item = {
    id,
    name: data.name.trim(),
    brand: (data.brand || '').trim() || 'Boshqa',
    cat: data.cat || 'other',
    type: (data.type || '').trim(),
    price: Number(data.price),
    oldPrice: Number(data.oldPrice) > Number(data.price) ? Number(data.oldPrice) : null,
    discount: Number(data.oldPrice) > Number(data.price) ? `-${Math.round((1 - data.price / data.oldPrice) * 100)}%` : null,
    city: data.city,
    condition: data.condition || 'Yopiq',
    expiry: `${m}/${y}`,
    expiryISO: `${y}-${m}`,
    qty: Math.max(1, Number(data.qty) || 1),
    image,
    images: [image],
    phone: data.phone,
    telegram: normalizeTelegram(data.telegram) || undefined,
    seller: {
      name: prof.name || '',
      avatar: prof.avatar || '',
      phone: data.phone || '',
      telegram: normalizeTelegram(data.telegram) || '',
    },
  }
  await upsertCatalogItem('surplus', item, -Date.now(), { hidden: true, hidden_reason: 'moderatsiya' })
  return item
}
