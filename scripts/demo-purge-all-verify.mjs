import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const OUT = '/workspace/demo-purge/all'
fs.mkdirSync(OUT, { recursive: true })
const BASE = 'http://127.0.0.1:4173'
const URL = 'https://agmkoeuhqrwdvrreamhj.supabase.co'
const ANON = fs.readFileSync('/workspace/stomahub/.env.local','utf8').match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1].trim()
const AUTH_KEY = 'sb-agmkoeuhqrwdvrreamhj-auth-token'

const DEMO_HITS = [
  'Aliyeva Malika','Karimov Akmal','Tursunova Nilufar','Qodirov Bekzod',
  'Dr. Ibrohim','28 450 000','28450000','5000+','10 000+','10000+',
]

const ROUTES = [
  ['home', '/'],
  ['marketplace', '/marketplace'],
  ['kitoblar', '/kitoblar'],
  ['talim', '/talim'],
  ['seminarlar', '/seminarlar'],
  ['ustalar', '/ustalar'],
  ['elonlar', '/elonlar'],
  ['ortiqcha', '/ortiqcha'],
  ['forma', '/forma'],
  ['jihozlar', '/jihozlar'],
  ['kategoriyalar', '/kategoriyalar'],
  ['brendlar', '/brendlar'],
  ['aksiyalar', '/aksiyalar'],
  ['community', '/community'],
  ['sertifikatlar', '/sertifikatlar'],
  ['buyurtma', '/buyurtma'],
  ['profil', '/profil'],
  ['profil-sevimlilar', '/profil/sevimlilar'],
  ['profil-buyurtmalar', '/profil/buyurtmalar'],
  ['profil-kurslar', '/profil/kurslar'],
  ['profil-seminarlar', '/profil/seminarlar'],
  ['klinika', '/klinika'],
  ['bemorlar', '/bemorlar'],
  ['uchrashuvlar', '/uchrashuvlar'],
  ['tolovlar', '/tolovlar'],
  ['ombor', '/ombor'],
  ['yangiliklar', '/yangiliklar'],
  ['kanallar', '/kanallar'],
  ['ishlar', '/ishlar'],
  ['mutaxassislar', '/mutaxassislar'],
  ['tashkilotchi', '/tashkilotchi'],
]

const ts = Date.now()
const email = `purge.empty.${ts}@stomahub.test`
const pass = `Purge!${ts}`
const sb = createClient(URL, ANON, { auth: { persistSession: false }, realtime: { transport: class { constructor(){} close(){} send(){} addEventListener(){} removeEventListener(){} } } })
const { data: sign, error: signErr } = await sb.auth.signUp({
  email, password: pass,
  options: { data: { name: 'Ibragimov Shavkat', full_name: 'Ibragimov Shavkat', role: 'customer' } },
})
if (signErr) console.error('signup', signErr.message)
const userId = sign?.user?.id
let session = sign?.session
if (!session && userId) {
  const { data: sin } = await sb.auth.signInWithPassword({ email, password: pass })
  session = sin?.session || null
}
if (userId) {
  await sb.from('profiles').upsert({
    id: userId, email, role: 'customer',
    name: 'Ibragimov Shavkat', full_name: 'Ibragimov Shavkat',
  })
}
console.log(JSON.stringify({ email, userId, hasSession: !!session, signErr: signErr?.message || null }))

const browser = await chromium.launch({ headless: true })
const report = { email, userId, routes: {} }

async function runViewport(vpName, viewport) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: viewport.width < 500 ? 2 : 1 })
  const page = await ctx.newPage()
  await page.addInitScript(({ AUTH_KEY, session, profile }) => {
    try { for (const k of Object.keys(localStorage)) localStorage.removeItem(k) } catch {}
    if (session) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(session))
    }
    localStorage.setItem('stomahub-profile', JSON.stringify(profile))
  }, {
    AUTH_KEY,
    session,
    profile: {
      accountLive: true, loggedOut: false,
      name: 'Ibragimov Shavkat', role: 'Stomatolog', avatar: '',
      clinic: '', city: 'Toshkent', notif: {}, readNotifs: [],
      courseDone: {}, orders: [],
    },
  })

  for (const [name, route] of ROUTES) {
    const key = `${name}-${vpName}`
    try {
      await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {})
      await page.waitForTimeout(2000)
      const file = path.join(OUT, `${key}.png`)
      await page.screenshot({ path: file, fullPage: false })
      const text = await page.evaluate(() => document.body?.innerText || '')
      const hits = DEMO_HITS.filter((n) => text.includes(n))
      const fakeCounts = [...text.matchAll(/(\d{2,})\s*mahsulot/gi)].map((m) => m[0])
      const greeting = (text.match(/Salom,\s*([^\n!]+)/) || [])[1] || null
      report.routes[key] = {
        file, route, hits, greeting,
        fakeCounts: fakeCounts.slice(0, 8),
        sample: text.replace(/\s+/g, ' ').slice(0, 420),
        ok: hits.length === 0,
      }
      console.log(key, hits.length ? 'HITS:'+hits.join(',') : 'ok', greeting || '', fakeCounts.slice(0,3).join('|'))
    } catch (e) {
      report.routes[key] = { route, error: String(e.message || e), ok: false }
      console.log(key, 'ERR', e.message)
    }
  }
  await ctx.close()
}

await runViewport('d1440', { width: 1440, height: 900 })
await runViewport('m390', { width: 390, height: 844 })

fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2))
const bad = Object.entries(report.routes).filter(([, v]) => !v.ok || (v.hits && v.hits.length))
console.log('\nSUMMARY bad=', bad.length, 'total=', Object.keys(report.routes).length)
console.log('greeting home m390:', report.routes['home-m390']?.greeting)
console.log('greeting home d1440:', report.routes['home-d1440']?.greeting)
await browser.close()
