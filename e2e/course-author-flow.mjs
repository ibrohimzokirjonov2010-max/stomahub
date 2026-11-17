#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright-core'
import { sessionPayload, USERS } from '../scripts/author-e2e-server.mjs'

const APP = process.env.E2E_APP_URL || 'http://127.0.0.1:43378'
const SHOT = '/workspace/author-shots/e2e'
const results = []
let TITLE = ''
fs.mkdirSync(SHOT, { recursive: true })

const FAKE_PLAYER = `<!doctype html><meta charset="utf-8"><title>e2e</title>
<script>
  // First progress report may credit at most 20s. Emit ended at 20s so a short lesson unlocks on the first report.
  const emit=(event,current)=>parent.postMessage(JSON.stringify({event,currentTime:current,duration:20}),'*');
  emit('ready',0);
  let n=0;
  const id=setInterval(()=>{emit('ended',20); if(++n>=40) clearInterval(id)},500);
</script>`

const keyOf = () => `sb-${new URL(process.env.E2E_SUPABASE_URL || 'http://127.0.0.1:5544').hostname.split('.')[0]}-auth-token`
const vis = (loc) => loc.locator('visible=true').first()

async function newPage(browser, who, size) {
  const mobile = size.width < 768
  const context = await browser.newContext({ viewport: size, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile, locale: 'uz-UZ' })
  const session = sessionPayload(USERS[who])
  await context.addInitScript(({ session, key }) => { localStorage.setItem(key, JSON.stringify(session)) }, { session, key: keyOf() })
  await context.route('https://iframe.mediadelivery.net/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: FAKE_PLAYER }))
  const page = await context.newPage()
  page.setDefaultTimeout(25000)
  return { context, page }
}

async function shot(page, name) {
  const file = path.join(SHOT, `${name}.png`)
  await page.waitForTimeout(350)
  await page.screenshot({ path: file, fullPage: false })
  return file
}

async function step(name, fn) {
  const t0 = Date.now()
  try {
    const out = await fn()
    results.push({ name, ok: true, ms: Date.now() - t0 })
    console.log('PASS', name)
    return out
  } catch (e) {
    results.push({ name, ok: false, ms: Date.now() - t0, error: String(e.message || e).slice(0, 600) })
    console.log('FAIL', name, String(e.message || e).slice(0, 300))
    throw e
  }
}

async function addQuestions(page, questions) {
  const prompts = () => page.getByPlaceholder('Savol matni').locator('visible=true')
  while (await prompts().count() < questions.length) {
    await vis(page.getByRole('button', { name: /Savol qo/ })).click()
  }
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    const prompt = prompts().nth(i)
    await prompt.fill(q.prompt)
    const card = prompt.locator('xpath=ancestor::li')
    for (let j = 0; j < q.options.length; j++) {
      let opt = card.getByPlaceholder(/variant/i).nth(j)
      if (await opt.count() === 0) {
        await vis(card.getByRole('button', { name: /^Variant$/ })).click()
        opt = card.getByPlaceholder(/variant/i).nth(j)
      }
      await opt.fill(q.options[j])
    }
    if (q.correct != null) {
      await card.getByRole('radio', { name: new RegExp(`${q.correct + 1}-variant`) }).click()
    }
  }
}

async function fillLesson(page, title, videoId, questions) {
  await vis(page.getByLabel('Dars nomi')).fill(title)
  await vis(page.getByLabel('Video ID yoki havola')).fill(videoId)
  await vis(page.getByLabel('Davomiyligi (daqiqa)')).fill('0.25')
  await vis(page.getByRole('button', { name: 'Biriktirish' })).click()
  await vis(page.getByText('Video tayyor')).waitFor({ timeout: 20000 })
  await addQuestions(page, questions)
}

async function runWizard(page, w) {
  await page.goto(`${APP}/kurs-muallifi/kurslar/yangi`, { waitUntil: 'networkidle' })
  await vis(page.getByRole('heading', { name: /Asosiy ma/ })).waitFor()
  await shot(page, `${w}-01-qadam-1`)
  await page.locator('input[maxlength="140"]').first().fill(TITLE)
  await page.locator('input[maxlength="220"]').first().fill('Rotatsion fayllar va irrigatsiya — klinik holatlar bilan')
  await page.locator('textarea').first().fill('Rotatsion fayllar, irrigatsiya va obturatsiya protokollari. Klinik holatlar, rentgen belgilari va xavfsiz ishchi uzunlik. Kurs amaliyotchi shifokorlar uchun tuzilgan.')
  await page.locator('select').first().selectOption('endo')
  await vis(page.getByRole('radio', { name: /O.?rta/ })).click()
  await vis(page.getByRole('button', { name: /Keyingi: Auditoriya/ })).click()
  await vis(page.getByRole('heading', { name: /Nimalarni o.?rganadi va kimlar/ })).waitFor()
  await shot(page, `${w}-02-qadam-2`)
  const learn = page.locator('input[maxlength="160"]')
  await learn.nth(0).fill('Kanal anatomiyasini rentgenda o‘qish')
  await learn.nth(1).fill('Crown-down protokolini xavfsiz qo‘llash')
  await learn.nth(2).fill('Irrigatsiya ketma-ketligini tanlash')
  await learn.nth(3).fill('Endodontiyani o‘zlashtirayotgan terapevtlar')
  await learn.nth(4).fill('Ordinatorlar va yosh shifokorlar')
  await vis(page.getByRole('button', { name: /Keyingi: Dastur/ })).click()
  await vis(page.getByRole('heading', { name: /Modullar va darslar/ })).waitFor()
  await shot(page, `${w}-03-qadam-3`)
  // On phone the lesson editor is a sheet; open first lesson if needed
  if (await vis(page.getByLabel('Dars nomi')).count() === 0) {
    await vis(page.getByRole('button', { name: /Nomsiz dars|1/ })).click()
  }
  await fillLesson(page, 'Kanal anatomiyasi va diagnostika', 'e2e-ui-video-1', [
    { prompt: 'NaOCl qaysi konsentratsiyada eng ko‘p ishlatiladi?', options: ['0,5%', '2,5–5,25%', '10%'], correct: 1 },
    { prompt: 'Ishchi uzunlikni aniqlashning eng aniq usuli?', options: ['Faqat rentgen', 'Apeks lokator + rentgen'], correct: 1 },
  ])
  if (await page.getByRole('button', { name: 'Tayyor' }).locator('visible=true').count()) {
    await vis(page.getByRole('button', { name: 'Tayyor' })).click()
  }
  await vis(page.getByRole('button', { name: /Dars qo/ })).click()
  if (await vis(page.getByLabel('Dars nomi')).count() === 0) {
    await vis(page.getByRole('button', { name: /Nomsiz dars/ })).click()
  }
  await fillLesson(page, 'Irrigatsiya protokollari', 'e2e-ui-video-2', [
    { prompt: 'Crown-down nima?', options: ['Tojdan apeksga', 'Apeksdan tojga'], correct: 0 },
  ])
  if (await page.getByRole('button', { name: 'Tayyor' }).locator('visible=true').count()) {
    await vis(page.getByRole('button', { name: 'Tayyor' })).click()
  }
  await shot(page, `${w}-04-qadam-3-dars`)
  await vis(page.getByRole('button', { name: /Keyingi: Narx/ })).click()
  await vis(page.getByRole('heading', { name: /Narx va chegirma/ })).waitFor()
  await vis(page.getByRole('radio', { name: /Pullik/ })).click()
  await page.getByPlaceholder('450000').fill('450000')
  await vis(page.getByRole('switch', { name: /Chegirma/ })).click()
  await page.getByPlaceholder('360000').fill('360000')
  await shot(page, `${w}-05-qadam-4`)
  await vis(page.getByRole('button', { name: /Keyingi: Sertifikat/ })).click()
  await vis(page.getByRole('heading', { name: 'Sertifikat', exact: true })).waitFor()
  await vis(page.getByRole('radio', { name: '80%' })).click()
  await shot(page, `${w}-06-qadam-5`)
  await vis(page.getByRole('button', { name: /Keyingi: Yuborish/ })).click()
  await vis(page.getByRole('heading', { name: /Ko.?rib chiqish va yuborish/ })).waitFor()
  await shot(page, `${w}-07-qadam-6`)
  await vis(page.getByRole('button', { name: /Moderatsiyaga yuborish/ })).click()
  await vis(page.getByText(/moderatsiyaga yuborildi|Kurslarim/i)).waitFor({ timeout: 20000 })
  await shot(page, `${w}-08-kurslar-review`)
}

async function adminApprove(page, w) {
  await page.goto(`${APP}/admin/kurslar`, { waitUntil: 'networkidle' })
  await vis(page.getByText(TITLE)).waitFor({ timeout: 20000 })
  await shot(page, `${w}-09-admin-navbat`)
  const row = page.locator('tr', { hasText: TITLE }).locator('visible=true')
  const approve = (await row.count()) ? row.getByRole('button', { name: /Tasdiqlash/ }) : vis(page.getByRole('button', { name: /Tasdiqlash/ }))
  await approve.click()
  await vis(page.getByText(/nashr qilindi/i)).waitFor({ timeout: 15000 })
  await shot(page, `${w}-10-admin-tasdiqlangan`)
}

async function studentBuy(page, w) {
  await page.goto(`${APP}/talim`, { waitUntil: 'networkidle' })
  await vis(page.getByText(TITLE)).waitFor({ timeout: 20000 })
  await shot(page, `${w}-11-katalog`)
  await vis(page.getByText(TITLE)).click()
  await vis(page.getByRole('button', { name: 'Sotib olish' })).waitFor({ timeout: 20000 })
  await shot(page, `${w}-12-detail-sotib`)
  await vis(page.getByRole('button', { name: 'Sotib olish' })).click()
  await vis(page.getByText(/Yozuv saqlandi|To‘lov kutilmoqda|To‘lov ulanmaguncha/i)).waitFor({ timeout: 15000 })
  await shot(page, `${w}-13-unpaid`)
}

async function authorMarkPaid(page, w) {
  await page.goto(`${APP}/kurs-muallifi/tolovlar`, { waitUntil: 'networkidle' })
  await vis(page.getByText(/Aziza Rahimova|Kutilmoqda/i)).waitFor({ timeout: 20000 })
  await shot(page, `${w}-14-tolovlar-unpaid`)
  await vis(page.getByRole('button', { name: /To‘landi/ })).click()
  await vis(page.getByRole('button', { name: 'Naqd' })).click()
  await vis(page.getByRole('button', { name: 'Tasdiqlash' })).click()
  await vis(page.getByText(/belgilandi|To‘langan|To‘landi/i)).waitFor({ timeout: 15000 }).catch(() => {})
  await shot(page, `${w}-15-tolovlar-paid`)
}

async function studentWatch(page, w) {
  await page.goto(`${APP}/talim`, { waitUntil: 'networkidle' })
  await vis(page.getByText(TITLE)).click()
  const watch = vis(page.getByRole('button', { name: /Tomosha qilish|Davom ettirish/ }))
  await watch.waitFor({ timeout: 20000 })
  await shot(page, `${w}-16-detail-tomosha`)
  await watch.click()
  await page.waitForURL(/\/dars/, { timeout: 20000 })
  await shot(page, `${w}-17-dars-1`)
  await page.waitForSelector('iframe', { timeout: 15000 }).catch(() => {})
  for (let i = 0; i < 15; i++) {
    for (const frame of page.frames()) {
      if (!/mediadelivery/.test(frame.url())) continue
      await frame.evaluate(() => {
        parent.postMessage(JSON.stringify({ event: 'ended', currentTime: 20, duration: 20 }), '*')
      }).catch(() => {})
    }
    if (await page.getByRole('button', { name: /Testni boshlash|Yakunlash|Keyingi savol/ }).locator('visible=true').count()) break
    await page.waitForTimeout(400)
  }
  async function awaitQuiz() {
    const ready = page.getByRole('button', { name: /Testni boshlash|Yakunlash|Keyingi savol/ }).locator('visible=true').first()
    await ready.waitFor({ timeout: 25000 })
    const start = vis(page.getByRole('button', { name: 'Testni boshlash' }))
    if (await start.count()) await start.click()
    await vis(page.getByRole('button', { name: /Yakunlash|Keyingi savol/ })).waitFor({ timeout: 15000 })
  }
  async function takeQuiz(corrects) {
    for (let i = 0; i < corrects.length; i++) {
      await vis(page.getByRole('button', { name: corrects[i] })).click()
      if (i < corrects.length - 1) await vis(page.getByRole('button', { name: 'Keyingi savol' })).click()
      else await vis(page.getByRole('button', { name: 'Yakunlash' })).click()
    }
  }
  await awaitQuiz()
  await shot(page, `${w}-17-dars-1-test`)
  await takeQuiz(['2,5–5,25%', 'Apeks lokator + rentgen'])
  await vis(page.getByText(/o‘tdingiz|Yaxshi|Ball|100|sertifikat/i)).waitFor({ timeout: 15000 }).catch(() => {})
  await shot(page, `${w}-18-dars-1-natija`)
  const lesson2 = vis(page.getByRole('button', { name: /Irrigatsiya/ }))
  if (await lesson2.count()) await lesson2.click()
  await awaitQuiz()
  await shot(page, `${w}-19-dars-2-test`)
  await takeQuiz(['Tojdan apeksga'])
  await vis(page.getByText(/sertifikat|o‘tdingiz|Yaxshi|Ball|100/i)).waitFor({ timeout: 15000 }).catch(() => {})
  await shot(page, `${w}-20-sertifikat`)
}

async function authorStats(page, w) {
  await page.goto(`${APP}/kurs-muallifi`, { waitUntil: 'networkidle' })
  await vis(page.getByText('Boshqaruv paneli')).waitFor()
  await shot(page, `${w}-21-panel`)
  await page.goto(`${APP}/kurs-muallifi/oquvchilar`, { waitUntil: 'networkidle' })
  await vis(page.getByText('Aziza Rahimova')).waitFor({ timeout: 20000 })
  await shot(page, `${w}-22-oquvchilar`)
  await page.goto(`${APP}/kurs-muallifi/tolovlar`, { waitUntil: 'networkidle' })
  await shot(page, `${w}-23-tolovlar`)
}

const API = process.env.E2E_SUPABASE_URL || 'http://127.0.0.1:5544'

async function httpRpc(who, name, args = {}) {
  const token = sessionPayload(USERS[who]).access_token
  const res = await fetch(`${API}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { apikey: 'e2e-anon-key', Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok || body?.ok === false) throw new Error(`${name}: ${res.status} ${JSON.stringify(body).slice(0, 300)}`)
  return body
}

async function publishFreeCourse(title) {
  const saved = await httpRpc('author', 'course_save', {
    p_payload: {
      title,
      description: 'Qisqa bepul dars. Yozilgan har kim darhol ko‘radi va test topshiradi.',
      direction: 'terapiya',
      level: 'bosh',
      format: 'kurs',
      price: 0,
      coverUrl: '',
      status: 'draft',
      lessons: [{ title: 'Kirish', moduleTitle: 'Start', passThreshold: 70, maxMistakes: 0, points: 10, questions: [{ prompt: '2+2?', options: ['3', '4'], correctIndex: 1 }] }],
    },
  })
  await httpRpc('author', 'course_author_attach_video', { p_lesson_id: saved.lessons[0].id, p_video_id: 'e2e-free-ui', p_duration: 10 })
  await httpRpc('author', 'course_author_set_status', { p_course_id: saved.id, p_action: 'submit' })
  await httpRpc('admin', 'course_moderate', { p_course_id: saved.id, p_action: 'approve', p_note: '' })
  return saved
}

async function freeBoshlash(page, w) {
  const freeTitle = `E2E Bepul ${w} ${Date.now()}`
  await publishFreeCourse(freeTitle)
  await page.goto(`${APP}/talim`, { waitUntil: 'networkidle' })
  const card = vis(page.getByText(freeTitle))
  await card.waitFor({ timeout: 20000 })
  await card.click()
  await vis(page.getByRole('button', { name: 'Boshlash' })).waitFor({ timeout: 20000 })
  await shot(page, `${w}-24-bepul-boshlash`)
  await vis(page.getByRole('button', { name: 'Boshlash' })).click()
  await vis(page.getByRole('button', { name: /Tomosha qilish|Davom ettirish/ })).waitFor({ timeout: 20000 })
  await shot(page, `${w}-25-bepul-tomosha`)
}

const allSizes = [['1280', { width: 1280, height: 800 }], ['390', { width: 390, height: 844 }]]
const sizes = allSizes.filter(([k]) => (process.env.E2E_SIZES || '1280,390').split(',').includes(k))

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
try {
  for (const [w, size] of sizes) {
    TITLE = `E2E Endodontiya ${w} ${Date.now()}`
    const run = async (who, fn) => {
      const { context, page } = await newPage(browser, who, size)
      try { await fn(page, w) } finally { await context.close() }
    }
    await step(`${w}-wizard`, () => run('author', runWizard))
    await step(`${w}-admin`, () => run('admin', adminApprove))
    await step(`${w}-sotib`, () => run('student', studentBuy))
    await step(`${w}-mark-paid`, () => run('author', authorMarkPaid))
    await step(`${w}-watch`, () => run('student', studentWatch))
    await step(`${w}-stats`, () => run('author', authorStats))
    await step(`${w}-free`, () => run('student', freeBoshlash))
  }
} catch (e) {
  console.error('E2E aborted:', e.message)
} finally {
  await browser.close()
}

const report = { ok: results.every((r) => r.ok), results, title: TITLE, shot: SHOT }
fs.mkdirSync('/tmp/stomahub-author-e2e', { recursive: true })
fs.writeFileSync('/tmp/stomahub-author-e2e/playwright.json', JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
if (!report.ok) process.exitCode = 1
