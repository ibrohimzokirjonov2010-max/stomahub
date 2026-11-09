import test from 'node:test'
import assert from 'node:assert/strict'
import { buildListingTelegramMessage, formatListingPrice } from '../src/lib/telegramShare.js'
import { escapeHtml, renderOgHtml, listingMetaFromRow } from '../api/_lib/ogListing.js'

test('telegram message template', () => {
  const msg = buildListingTelegramMessage({
    title: 'Endomotor',
    price: 4200000,
    url: 'https://stomahub-three.vercel.app/elonlar/ad-1',
  })
  assert.match(msg, /Assalomu alaykum! StomaHub'dagi e'loningiz bo'yicha yozyapman: Endomotor — 4 200 000 so'm/)
  assert.match(msg, /https:\/\/stomahub-three\.vercel\.app\/elonlar\/ad-1/)
  assert.equal(formatListingPrice(2100000), '2 100 000')
})

test('og html escapes and includes tags', () => {
  const html = renderOgHtml({
    title: 'A <B> & "C"',
    description: 'desc',
    url: 'https://example.com/elonlar/x',
    image: 'https://example.com/img.jpg',
  })
  assert.match(html, /property="og:title" content="A &lt;B&gt; &amp; &quot;C&quot;"/)
  assert.match(html, /property="og:image" content="https:\/\/example.com\/img.jpg"/)
  assert.equal(escapeHtml('<x>'), '&lt;x&gt;')
})

test('listingMetaFromRow builds absolute image', () => {
  const meta = listingMetaFromRow('surplus', {
    id: 's1',
    payload: { name: 'Filtek', price: 850000, city: 'Toshkent', images: ['https://cdn.example/a.jpg'] },
  }, 'https://stomahub-three.vercel.app')
  assert.equal(meta.title, 'Filtek')
  assert.match(meta.description, /850 000/)
  assert.equal(meta.image, 'https://cdn.example/a.jpg')
  assert.equal(meta.url, 'https://stomahub-three.vercel.app/ortiqcha/s1')
})
