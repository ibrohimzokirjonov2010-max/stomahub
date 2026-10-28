// Write the real table of contents (read from each book's own contents page) into the
// two seeded books' payload: payload.contents [{ title, page (PDF page), printed?, level }]
// and payload.toc (chapter titles). Touches only those two keys; nothing else, no uploads.
// DRY RUN by default.
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed/book-contents.mjs [--apply]
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const APPLY = process.argv.includes('--apply')
const here = dirname(fileURLToPath(import.meta.url))
const seed = JSON.parse(readFileSync(join(here, 'marketplace-seed.json'), 'utf8'))
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) { console.error('Need SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY'); process.exit(1) }
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

for (const b of seed.books) {
  const { data: row, error } = await sb.from('catalog_items').select('id,payload').eq('kind', 'book').eq('id', b.id).maybeSingle()
  if (error) throw error
  if (!row) { console.log(`skip ${b.id}: not in catalog_items (run seed-marketplace first)`); continue }
  const pages = row.payload?.pdf?.pages || row.payload?.pages
  const bad = b.contents.filter((r) => !(r.page >= 1 && r.page <= pages))
  if (bad.length) throw new Error(`${b.id}: ${bad.length} entries outside 1..${pages}`)
  console.log(`${APPLY ? '[apply]' : '[dry-run]'} ${b.id}: contents ${row.payload?.contents?.length || 0} -> ${b.contents.length}, toc ${row.payload?.toc?.length || 0} -> ${b.toc.length}`)
  if (!APPLY) continue
  const { error: e } = await sb.from('catalog_items').update({ payload: { ...row.payload, contents: b.contents, toc: b.toc } }).eq('kind', 'book').eq('id', b.id)
  if (e) throw e
}
