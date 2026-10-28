// StomaHub official catalog seed: 10 marketplace products + 2 books.
// DRY RUN by default (prints the plan, writes nothing).
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... STOMAHUB_SELLER_EMAIL=... \
//   IMG_DIR=/workspace/mp-out node scripts/seed/seed-marketplace.mjs [--apply] [--skip-books]
// Requires migration 0021_product_specs.sql to be applied first.
// Idempotent: products are matched by (seller_id, sku), books by (kind='book', id).
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const APPLY = process.argv.includes('--apply')
const SKIP_BOOKS = process.argv.includes('--skip-books')
const here = dirname(fileURLToPath(import.meta.url))
const seed = JSON.parse(readFileSync(join(here, 'marketplace-seed.json'), 'utf8'))
const IMG_DIR = process.env.IMG_DIR || '/workspace/mp-out'
const BUCKET = 'catalog'
const STOCK = 10 // starting stock, editable later in the seller cabinet

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STOMAHUB_SELLER_EMAIL } = process.env
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !STOMAHUB_SELLER_EMAIL) {
  console.error('Need SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STOMAHUB_SELLER_EMAIL'); process.exit(1)
}
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const log = (...a) => console.log(APPLY ? '[apply]' : '[dry-run]', ...a)
const publicUrl = (path) => sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl

function files(prefix) {
  const out = [1, 2, 3, 4].map((n) => join(IMG_DIR, `${prefix}-${n}.webp`))
  const missing = out.filter((f) => !existsSync(f))
  if (missing.length) throw new Error(`Missing images: ${missing.join(', ')}`)
  return out
}

async function upload(localFiles, folder, prefix) {
  const urls = []
  for (const [i, f] of localFiles.entries()) {
    const path = `${folder}/${prefix}-${i + 1}.webp`
    if (APPLY) {
      const { error } = await sb.storage.from(BUCKET).upload(path, readFileSync(f), { contentType: 'image/webp', upsert: true, cacheControl: '31536000' })
      if (error) throw error
    }
    urls.push(publicUrl(path))
  }
  return urls
}

async function main() {
  // 0. schema check
  const chk = await sb.from('seller_products').select('specs').limit(1)
  if (chk.error) throw new Error(`Apply 0021_product_specs.sql first: ${chk.error.message}`)

  // 1. public bucket
  const { data: buckets } = await sb.storage.listBuckets()
  if (!buckets?.some((b) => b.id === BUCKET)) {
    log(`create public bucket "${BUCKET}"`)
    if (APPLY) { const { error } = await sb.storage.createBucket(BUCKET, { public: true, fileSizeLimit: '5MB', allowedMimeTypes: ['image/webp', 'image/jpeg', 'image/png'] }); if (error) throw error }
  }

  // 2. official seller account
  let sellerId
  for (let page = 1; !sellerId; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    sellerId = data.users.find((u) => u.email?.toLowerCase() === STOMAHUB_SELLER_EMAIL.toLowerCase())?.id
    if (data.users.length < 1000) break
  }
  if (!sellerId) {
    log(`create auth user ${STOMAHUB_SELLER_EMAIL} (no password; admin sets it via reset link)`)
    if (APPLY) {
      const { data, error } = await sb.auth.admin.createUser({ email: STOMAHUB_SELLER_EMAIL, email_confirm: true, user_metadata: { name: 'StomaHub' } })
      if (error) throw error
      sellerId = data.user.id
    } else sellerId = '<new-seller-uuid>'
  }
  log(`seller profile ${sellerId}:`, seed.seller)
  if (APPLY) { const { error } = await sb.from('profiles').upsert({ id: sellerId, ...seed.seller }, { onConflict: 'id' }); if (error) throw error }

  // 3. products
  for (const p of seed.products) {
    const images = await upload(files(p.slug), 'products', p.slug)
    const row = { seller_id: sellerId, sku: p.sku, name: p.name, category: p.category, unit: p.unit, price: p.price, stock: STOCK,
      description: p.description, specs: p.specs, images, image_url: images[0], brand: '', status: 'active' }
    const { data: ex } = APPLY ? await sb.from('seller_products').select('id').eq('seller_id', sellerId).eq('sku', p.sku).maybeSingle() : { data: null }
    log(`${ex ? 'update' : 'insert'} product ${p.sku} — ${p.name} — ${p.price} so‘m`)
    if (APPLY) {
      const q = ex ? sb.from('seller_products').update(row).eq('id', ex.id) : sb.from('seller_products').insert(row)
      const { error } = await q; if (error) throw error
    }
  }

  // 4. books (Kitoblar)
  if (!SKIP_BOOKS) {
    for (const [i, b] of seed.books.entries()) {
      const gallery = await upload(files(`book-${b.id}`), 'books', b.id)
      const { file, ...rest } = b
      const payload = { ...rest, cover: gallery[0], gallery, seller: 'StomaHub', sellerId }
      log(`upsert book ${b.id} — ${b.title} (price ${b.price ?? 'Narxi kelishiladi'})`)
      if (APPLY) {
        const { error } = await sb.from('catalog_items').upsert({ kind: 'book', id: b.id, payload, sort_at: i, owner_id: sellerId }, { onConflict: 'kind,id' })
        if (error) throw error
      }
    }
  }
  log('done')
}
main().catch((e) => { console.error(e.message || e); process.exit(1) })
