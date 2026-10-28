import { chromium } from 'playwright-core'; import fs from 'fs'
const BASE='https://stomahub-three.vercel.app', OUT='/workspace/demo-purge/live'
const rep=JSON.parse(fs.readFileSync(`${OUT}/live-verify-report-2.json`)); const email=rep.email, pass=`LiveTest!${rep.ts}`
const b=await chromium.launch({executablePath:chromium.executablePath()})
for (const [w,h,tag] of [[1440,900,'desktop'],[390,844,'mobile']]) {
const p=await (await b.newContext({viewport:{width:w,height:h}})).newPage()
await p.goto(`${BASE}/kirish`,{waitUntil:'domcontentloaded'}); await p.waitForSelector('form input')
const em=p.getByText(/Email bilan kirish/i).first(); if(await em.count()){await em.click();await p.waitForTimeout(400)}
const ei=p.locator('form input[type="email"]'); if(await ei.count()) await ei.first().fill(email); else await p.locator('form input').first().fill(email)
await p.locator('form input[type="password"]').fill(pass); await p.locator('form button[type="submit"]').click(); await p.waitForTimeout(5000)
await p.goto(`${BASE}/seminarlar/live-new-seminar-1793123677841-twjp/royxat`,{waitUntil:'networkidle'}); await p.waitForTimeout(5000)
const fillIf=async(loc,v)=>{if(await loc.count()&&!(await loc.first().inputValue()).replace(/\+998\s*/,'')) await loc.first().fill(v)}
await fillIf(p.getByPlaceholder(/Ism Familiya/),'Karimov Dilshod')
await fillIf(p.getByPlaceholder('+998 90 123 45 67'),'931234567')
await fillIf(p.getByPlaceholder('example@email.com'),email)
for (const s of await p.locator('select').all()) { if(!(await s.inputValue())) await s.selectOption({index:1}).catch(()=>{}) }
await p.screenshot({path:`${OUT}/14-seminar-reg-filled-${tag}.png`})
await p.getByRole('button',{name:/Davom etish/}).first().click(); await p.waitForTimeout(2000)
await p.getByText('Click',{exact:true}).first().click().catch(e=>console.log('click',e.message.slice(0,80))); await p.waitForTimeout(1500)
await p.getByRole('button',{name:/To‘lovni tekshirish/}).first().click().catch(e=>console.log('pay',e.message.slice(0,80))); await p.waitForTimeout(6000)
await p.screenshot({path:`${OUT}/14-seminar-reg-done-${tag}.png`})
const t=await p.locator('body').innerText()
console.log(/ro‘yxatdan o‘tdingiz|Tasdiqlandi|Chiptani yuklab/.test(t)?'PASS':'FAIL',`buyer_seminar_registration_${tag}`,(t.match(/[^\n]*(o‘tdingiz|Tasdiqlandi|majburiy|xato)[^\n]*/)||[''])[0])
}
await b.close()
