import { readFileSync, writeFileSync } from 'node:fs'
import { marketProducts } from '../src/marketData.js'
import { books } from '../src/booksData.js'
import { courses } from '../src/educationData.js'
import { articles } from '../src/yangiliklarData.js'
import { channels } from '../src/channelsData.js'
import { masters } from '../src/ustalarData.js'
import { ADS } from '../src/elonlarData.js'
import { deals } from '../src/aksiyaData.js'
import { surplusItems } from '../src/surplusData.js'
import { products as uniforms } from '../src/formaData.js'
import { products as devices } from '../src/jihozData.js'
import { DOCTORS } from '../src/mutaxassislarData.js'
import { jobs } from '../src/ishlarData.js'
import { certs } from '../src/sertifikatData.js'
import { seedPosts } from '../src/communityData.js'

const groups = [
  ['product', marketProducts],
  ['book', books],
  ['course', courses],
  ['article', articles],
  ['channel', channels],
  ['master', masters],
  ['ad', ADS],
  ['deal', deals],
  ['surplus', surplusItems],
  ['uniform', uniforms],
  ['device', devices],
  ['doctor', DOCTORS],
  ['job', jobs],
  ['certificate', certs],
  ['post', seedPosts],
]

function sqlJson(value) {
  return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`
}

function rowId(kind, item, index) {
  const raw = item?.id ?? item?.key ?? `${kind}-${index + 1}`
  return String(raw).replace(/'/g, "''")
}

const header = readFileSync(new URL('./customer-schema.sql', import.meta.url), 'utf8')
const chunks = [header.trim(), '', '-- Public catalog seed. Pages read these rows and fall back to the bundled copy until the migration runs.', '']
let count = 0
for (const [kind, list] of groups) {
  if (!Array.isArray(list) || !list.length) continue
  const values = list.map((item, index) => `  ('${kind}', '${rowId(kind, item, index)}', ${sqlJson(item)}, ${index})`)
  for (let i = 0; i < values.length; i += 40) {
    const slice = values.slice(i, i + 40)
    chunks.push(`insert into public.catalog_items (kind, id, payload, sort_at) values\n${slice.join(',\n')}\non conflict (kind, id) do update set payload = excluded.payload, sort_at = excluded.sort_at;`)
    chunks.push('')
  }
  count += list.length
}
writeFileSync(new URL('../supabase/migrations/0002_customer.sql', import.meta.url), `${chunks.join('\n')}\n`)
console.log(`catalog rows ${count}`)
