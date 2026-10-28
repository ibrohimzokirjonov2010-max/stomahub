// StomaHub official catalog seed: 10 marketplace products + 2 books.
// DRY RUN by default (prints the plan, writes nothing).
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... STOMAHUB_SELLER_EMAIL=... \
//   IMG_DIR=/workspace/mp-out PDF_DIR=/workspace/designs/marketplace-products \
//   node scripts/seed/seed-marketplace.mjs [--apply] [--skip-books]
// Requires migrations 0021_product_specs.sql and 0022_book_files.sql (book PDFs) first.
// Book PDFs: the full file goes to the PRIVATE bucket `book-files/<book_id>/<name>.pdf`
// (buyers only, signed URLs); a short preview (first N pages, needs poppler
// pdftoppm) goes to the public `catalog/books/<book_id>/preview/` as jpeg page images.
// Idempotent: products are matched by (seller_id, sku), books by (kind='book', id).
import { readFileSync, existsSync, mkdtempSync, statSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const APPLY = process.argv.includes('--apply')
const SKIP_BOOKS = process.argv.includes('--skip-books')
const here = dirname(fileURLToPath(import.meta.url))
const seed = JSON.parse(readFileSync(join(here, 'marketplace-seed.json'), 'utf8'))
const IMG_DIR = process.env.IMG_DIR || '/workspace/mp-out'
const PDF_DIR = process.env.PDF_DIR || '/workspace/designs/marketplace-products'
const PDF_BUCKET = 'book-files'
const BUCKET = 'catalog'
const CATALOG_OPTS = { public: true, fileSizeLimit: '5MB', allowedMimeTypes: ['image/webp', 'image/jpeg', 'image/png'] }
// roles that already sell (or rank above seller) and must never be changed by the seed
const KEEP_ROLES = new Set(['seller', 'admin'])
export function sellerProfilePatch(prof, { createdNow, id, seller }) {
  if (!prof) return { op: 'insert', row: { id, ...seller } }
  const keep = KEEP_ROLES.has(prof.role)
  const row = { shop_name: seller.shop_name, seller_status: seller.seller_status, ...(keep ? {} : { role: 'seller' }), ...(createdNow || !prof.name ? { name: seller.name } : {}) }
  return { op: 'update', row, note: `role ${prof.role}${keep ? ' kept' : ' -> seller'}${row.name ? '' : ', name kept'}` }
}
const STOCK = 10 // starting stock, editable later in the seller cabinet

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STOMAHUB_SELLER_EMAIL } = process.env
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !STOMAHUB_SELLER_EMAIL) {
  console.error('Need SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STOMAHUB_SELLER_EMAIL'); process.exit(1)
}
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const log = (...a) => console.log(APPLY ? '[apply]' : '[dry-run]', ...a)
const publicUrl = (path) => sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl

// Real page count of a PDF (pdfinfo), so the card never shows a made-up number.
function pdfPages(f) {
  const m = execFileSync('pdfinfo', [f], { encoding: 'utf8' }).match(/^Pages:\s+(\d+)/m)
  return m ? Number(m[1]) : null
}

// Upload the full PDF (private bucket, original file untouched) and a preview of
// the first N pages rendered as jpeg images (public). Images, not a PDF excerpt:
// some source PDFs carry owner restrictions (no change/copy) we must not strip.
async function uploadPdf(b) {
  const src = join(PDF_DIR, b.pdf.file)
  if (!existsSync(src)) throw new Error(`Missing PDF: ${src}`)
  const pages = pdfPages(src)
  if (b.pdf.pages && pages !== b.pdf.pages) throw new Error(`${b.pdf.file}: ${pages} pages, seed says ${b.pdf.pages}`)
  const n = Math.min(b.pdf.previewPages || 20, pages)
  const tmp = mkdtempSync(join(tmpdir(), 'bookpdf-'))
  execFileSync('pdftoppm', ['-f', '1', '-l', String(n), '-r', '110', '-jpeg', '-jpegopt', 'quality=80,progressive=y', src, join(tmp, 'p')])
  const pngs = readdirSync(tmp).filter((f) => f.endsWith('.jpg')).sort()
  const path = `${b.id}/${b.pdf.name}`
  log(`  pdf ${b.pdf.file} (${pages} bet, ${(statSync(src).size / 1048576).toFixed(1)} MB) -> private ${PDF_BUCKET}/${path}; preview ${pngs.length} bet -> public ${BUCKET}/books/${b.id}/preview/`)
  if (APPLY) {
    const r = await sb.storage.from(PDF_BUCKET).upload(path, readFileSync(src), { contentType: 'application/pdf', upsert: true })
    if (r.error) throw r.error
  }
  const preview = []
  for (const [i, f] of pngs.entries()) {
    const p = `books/${b.id}/preview/p-${String(i + 1).padStart(3, '0')}.jpg`
    if (APPLY) {
      const r = await sb.storage.from(BUCKET).upload(p, readFileSync(join(tmp, f)), { contentType: 'image/jpeg', upsert: true, cacheControl: '31536000' })
      if (r.error) throw r.error
    }
    preview.push(publicUrl(p))
  }
  return { bucket: PDF_BUCKET, path, name: b.pdf.name, pages, size: statSync(src).size, preview, previewPages: preview.length }
}

function files(prefix, count = 4) {
  const out = Array.from({ length: count }, (_, i) => i + 1).map((n) => join(IMG_DIR, `${prefix}-${n}.webp`))
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
    if (APPLY) { const { error } = await sb.storage.createBucket(BUCKET, CATALOG_OPTS); if (error) throw error }
  }
  const pdfBucket = buckets?.find((b) => b.id === PDF_BUCKET)
  if (!SKIP_BOOKS && (!pdfBucket || pdfBucket.public)) throw new Error(`Apply 0022_book_files.sql first: private bucket "${PDF_BUCKET}" ${pdfBucket ? 'is public' : 'missing'}`)

  // 2. official seller account
  let sellerId
  for (let page = 1; !sellerId; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    sellerId = data.users.find((u) => u.email?.toLowerCase() === STOMAHUB_SELLER_EMAIL.toLowerCase())?.id
    if (data.users.length < 1000) break
  }
  const createdNow = !sellerId
  if (!sellerId) {
    log(`create auth user ${STOMAHUB_SELLER_EMAIL} (no password; admin sets it via reset link)`)
    if (APPLY) {
      const { data, error } = await sb.auth.admin.createUser({ email: STOMAHUB_SELLER_EMAIL, email_confirm: true, user_metadata: { name: 'StomaHub' } })
      if (error) throw error
      sellerId = data.user.id
    } else sellerId = '<new-seller-uuid>'
  }
  // Never downgrade or rename an existing account: keep seller/admin (or any role above
  // seller) as is, only promote customer/organizer to seller, and touch only shop fields.
  const { data: prof, error: profErr } = createdNow && !APPLY ? { data: null } : await sb.from('profiles').select('id, role, name').eq('id', sellerId).maybeSingle()
  if (profErr) throw profErr
  const profPatch = sellerProfilePatch(prof, { createdNow, id: sellerId, seller: seed.seller })
  log(`seller profile ${sellerId}: ${profPatch.op}`, profPatch.row, profPatch.note || '')
  if (APPLY) {
    const q = profPatch.op === 'insert' ? sb.from('profiles').insert(profPatch.row) : sb.from('profiles').update(profPatch.row).eq('id', sellerId)
    const { error } = await q; if (error) throw error
  }

  // 3. products
  for (const p of seed.products) {
    const images = await upload(files(p.slug, p.imageCount || 4), 'products', p.slug)
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
      let local
      try { local = files(`book-${b.id}`) } catch (e) { console.warn(`skip book ${b.id}: ${e.message}`); continue }
      const gallery = await upload(local, 'books', b.id)
      const { file, pdf: pdfSrc, ...rest } = b
      const pdf = pdfSrc ? await uploadPdf(b) : undefined
      const payload = { ...rest, ...(pdf ? { pages: pdf.pages, pdf } : {}), cover: gallery[0], gallery, seller: 'StomaHub', sellerId }
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
