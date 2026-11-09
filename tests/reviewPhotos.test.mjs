import test from 'node:test'
import assert from 'node:assert/strict'
import {
  REVIEW_PHOTO_MAX,
  normalizeReviewPhotoUrls,
  reviewImageList,
  reviewPhotoPath,
} from '../src/lib/reviewPhotos.js'

const UID = '11111111-1111-4111-8111-111111111111'
const base = (path) => `https://agmkoeuhqrwdvrreamhj.supabase.co/storage/v1/object/public/seller-media/${path}`

test('normalizeReviewPhotoUrls keeps only own reviews paths, max 3', () => {
  const ok1 = base(`${UID}/reviews/a.jpg`)
  const ok2 = base(`${UID}/reviews/b.jpg`)
  const ok3 = base(`${UID}/reviews/c.jpg`)
  const ok4 = base(`${UID}/reviews/d.jpg`)
  const other = base(`22222222-2222-4222-8222-222222222222/reviews/x.jpg`)
  const posts = base(`${UID}/posts/y.jpg`)
  const http = `http://evil.example/storage/v1/object/public/seller-media/${UID}/reviews/z.jpg`
  const out = normalizeReviewPhotoUrls([ok1, other, posts, ok2, http, ok3, ok4, ok1], UID)
  assert.deepEqual(out, [ok1, ok2, ok3])
  assert.equal(out.length, REVIEW_PHOTO_MAX)
})

test('normalizeReviewPhotoUrls empty without uid', () => {
  assert.deepEqual(normalizeReviewPhotoUrls([base(`${UID}/reviews/a.jpg`)], ''), [])
  assert.deepEqual(normalizeReviewPhotoUrls(null, UID), [])
})

test('reviewImageList accepts strings and {url} objects', () => {
  assert.deepEqual(reviewImageList(['a', { url: 'b' }, null, { url: '' }, 3]), ['a', 'b'])
  assert.deepEqual(reviewImageList(undefined), [])
})

test('reviewPhotoPath stays under uid/reviews', () => {
  const p = reviewPhotoPath(UID, 'jpeg')
  assert.match(p, new RegExp(`^${UID}/reviews/\\d+-[a-z0-9]+\\.jpeg$`))
})
