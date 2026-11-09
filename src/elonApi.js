import { supabase, friendlySupabaseError } from './supabaseClient'
import { currentUid, loadCatalog } from './recordSync'
import { upsertCatalogItem } from './catalogApi'
import { profileStore } from './profileStore'
import { dealName } from './elonlarData'
import { normalizeTelegram, validateAd, telegramUrl } from './elonValidate'

const MONTHS = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek']

function dateLabel(d = new Date()) {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

async function uploadAdImages(uid, adId, files) {
  const urls = []
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (!file) continue
    const ext = /png$/i.test(file.type) ? 'png' : /webp$/i.test(file.type) ? 'webp' : 'jpg'
    const path = `${uid}/ads/${adId}-${i}.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false })
    if (error) throw new Error('Rasmni yuklab bo‘lmadi. Qayta urinib ko‘ring.')
    urls.push(supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl)
  }
  return urls
}

/**
 * E'lonni catalog_items (kind=ad) ga yozadi — hidden=true, moderatsiya.
 * Rasmlar Storage'ga (avatars bucket), blob URL emas.
 */
export async function postAd(data, files = []) {
  const uid = currentUid()
  if (!supabase) throw new Error('Supabase sozlanmagan')
  if (!uid) throw new Error('E’lon berish uchun hisobingizga kiring')
  const errs = validateAd({ ...data, files })
  if (Object.keys(errs).length) throw new Error(Object.values(errs)[0])

  const list = (Array.isArray(files) ? files : []).filter(Boolean).slice(0, 6)
  if (!list.length) throw new Error('Kamida bitta rasm yuklang')

  const id = `ad-${uid.slice(0, 8)}-${Date.now()}`
  const images = await uploadAdImages(uid, id, list)
  const isJob = data.deal === 'job'
  const price = Number(String(data.price).replace(/\D/g, '')) || 0
  const priceMax = isJob ? (Number(String(data.priceMax || '').replace(/\D/g, '')) || undefined) : undefined
  const tg = normalizeTelegram(data.telegram)
  const prof = profileStore.get() || {}
  const d = new Date()
  const item = {
    id,
    deal: data.deal || 'sale',
    cat: isJob ? 'ish' : (data.cat || 'material'),
    title: String(data.title).trim(),
    sub: String(data.sub || '').trim() || 'Yangi e’lon',
    price,
    priceMax,
    city: data.city || 'Toshkent',
    date: dateLabel(d),
    cond: isJob ? 'To‘liq stavka' : (data.cond || 'Yangi'),
    expires: data.expires || undefined,
    original: false,
    views: 0,
    images,
    specs: [
      ['cat', 'Turi', dealName[data.deal] || 'Sotiladi'],
      ['place', 'Shahar', data.city || 'Toshkent'],
      ['cond', isJob ? 'Bandlik' : 'Holati', isJob ? 'To‘liq stavka' : (data.cond || 'Yangi')],
    ],
    about: String(data.sub || '').trim() || 'Batafsil ma’lumot uchun qo‘ng‘iroq qiling.',
    features: [],
    status: 'active',
    telegram: tg || undefined,
    seller: '',
    sellerInfo: {
      id: uid,
      name: prof.name || 'Sotuvchi',
      type: 'Xususiy shaxs',
      phone: data.phone,
      telegram: tg || undefined,
      rating: null,
      since: String(d.getFullYear()),
      avatar: prof.avatar || '',
    },
  }

  await upsertCatalogItem('ad', item, -Date.now(), {
    hidden: true,
    hidden_reason: 'moderatsiya',
    status: 'active',
  })
  return item
}

export async function setAdStatus(id, status) {
  const uid = currentUid()
  if (!supabase) throw new Error('Supabase sozlanmagan')
  if (!uid) throw new Error('Hisobga kiring')
  if (!['active', 'sold', 'closed'].includes(status)) throw new Error('Noma’lum holat')

  const { data, error } = await supabase
    .from('catalog_items')
    .select('payload, status, owner_id')
    .eq('kind', 'ad')
    .eq('id', String(id))
    .maybeSingle()
  if (error) throw new Error(friendlySupabaseError(error))
  if (!data || data.owner_id !== uid) throw new Error('Faqat o‘z e’loningizni o‘zgartira olasiz')

  const payload = { ...(data.payload || {}), status }
  // status ustuni 0059 dan keyin; migratsiyadan oldin faqat payload
  let { error: upErr } = await supabase
    .from('catalog_items')
    .update({ payload, status, updated_at: new Date().toISOString() })
    .eq('kind', 'ad')
    .eq('id', String(id))
    .eq('owner_id', uid)
  if (upErr && /status/i.test(upErr.message || '')) {
    ;({ error: upErr } = await supabase
      .from('catalog_items')
      .update({ payload, updated_at: new Date().toISOString() })
      .eq('kind', 'ad')
      .eq('id', String(id))
      .eq('owner_id', uid))
  }
  if (upErr) throw new Error(friendlySupabaseError(upErr))
  await loadCatalog()
  return { ok: true }
}

export { telegramUrl, normalizeTelegram }
