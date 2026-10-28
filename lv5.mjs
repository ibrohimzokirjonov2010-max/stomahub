import { chromium } from 'playwright-core'; import { createClient } from '@supabase/supabase-js'; import fs from 'fs'
const BASE='https://stomahub-three.vercel.app', OUT='/workspace/demo-purge/live', PNG=`${OUT}/upload.png`
const ANON=fs.readFileSync('.env.local','utf8').match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1].trim()
const WS=class{close(){}send(){}addEventListener(){}removeEventListener(){}}
const ts=Date.now(); const b=await chromium.launch({executablePath:chromium.executablePath()})
// A) duplicate phone
for (const [w,h,tag] of [[1440,900,'desktop'],[390,844,'mobile']]) {
 const p=await (await b.newContext({viewport:{width:w,height:h}})).newPage()
 await p.goto(`${BASE}/royxat`,{waitUntil:'networkidle'})
 await p.getByPlaceholder(/familiya/i).first().fill('Karimov Dilshod').catch(()=>p.locator('form input').first().fill('Karimov Dilshod'))
 await p.locator('input[aria-label="Telefon raqam"], input[inputmode="tel"]').first().fill('901112233')
 await p.locator('form input[type="email"]').first().fill(`stomahub.dupcheck.${ts}${tag}@gmail.com`)
 const sel=p.locator('form select'); if(await sel.count()) await sel.first().selectOption({index:1}).catch(()=>{})
 const pw=p.locator('form input[type="password"]'); await pw.nth(0).fill('DupTest!12345'); await pw.nth(1).fill('DupTest!12345')
 await p.locator('form input[type="checkbox"]').first().check({force:true})
 await p.locator('form button[type="submit"]').click(); await p.waitForTimeout(6000)
 await p.screenshot({path:`${OUT}/15-dup-phone-${tag}.png`})
 const t=await p.locator('form').innerText(); const link=await p.locator('form a[href="/kirish"]').count()
 console.log(t.includes('allaqachon ro‘yxatdan o‘tgan')&&link?'PASS':'FAIL',`dup_phone_message_${tag}`,`link=${link}`, (t.match(/[^\n]*(allaqachon|error|xato)[^\n]*/i)||[''])[0])
}
// B) organizer wizard seminar with image
const d=await (await b.newContext({viewport:{width:1440,height:900}})).newPage()
await d.goto(`${BASE}/kirish`,{waitUntil:'domcontentloaded'}); await d.waitForSelector('form input')
const em=d.getByText(/Email bilan kirish/i).first(); if(await em.count()){await em.click();await d.waitForTimeout(400)}
const ei=d.locator('form input[type="email"]'); if(await ei.count()) await ei.first().fill('organizer@stomahub.uz'); else await d.locator('form input').first().fill('organizer@stomahub.uz')
await d.locator('form input[type="password"]').fill('StomaHub-demo-2026'); await d.locator('form button[type="submit"]').click(); await d.waitForTimeout(5000)
await d.goto(`${BASE}/tashkilotchi/seminarlar/yangi`,{waitUntil:'networkidle'}); await d.waitForTimeout(2500)
const title=`Img Check Seminar ${ts}`
await d.locator('#info input').first().fill(title); await d.locator('#info textarea').first().fill('Rasm tekshiruvi uchun seminar tavsifi.')
await d.locator('#info input[type="file"]').first().setInputFiles(PNG); await d.waitForTimeout(4000)
await d.evaluate(({date})=>{const sN=(i,v)=>{if(!i)return;Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,v);i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}))}
 document.querySelectorAll('#when input[type="date"]').forEach(x=>sN(x,date)); const t=[...document.querySelectorAll('#when input:not([type="date"]):not([type="time"]):not([type="file"])')]; sN(t[0],'Toshkent, Test Hall'); sN(t[1],'Test ko‘chasi 1')},{date:'2026-12-21'})
await d.getByRole('button',{name:/Chipta turi/i}).first().click(); await d.waitForTimeout(500)
await d.evaluate(()=>{const dlg=document.querySelector('[role="dialog"]')||document.body;const ins=[...dlg.querySelectorAll('input')].filter(i=>!['file','checkbox','radio'].includes(i.type));const sN=(i,v)=>{if(!i)return;Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,v);i.dispatchEvent(new Event('input',{bubbles:true}))};sN(ins[0],'Standart');sN(ins[1],'100000');sN(ins[2],'10')})
await d.getByRole('button',{name:/^Saqlash$/i}).last().click(); await d.waitForTimeout(800)
for(let i=0;i<8;i++){const pub=d.getByRole('button',{name:/E’lon qilish/i}); if(await pub.count()&&await pub.first().isVisible()){await pub.first().click();break}; const n=d.getByRole('button',{name:/Keyingi/i}).first(); if(await n.count()) await n.click(); await d.waitForTimeout(400)}
await d.waitForTimeout(5000)
const sb=createClient('https://agmkoeuhqrwdvrreamhj.supabase.co',ANON,{realtime:{transport:WS},auth:{persistSession:false}})
const {data}=await sb.from('seminars').select('id,image,cover,published').eq('title',title)
const s=data?.[0]; console.log('seminar',JSON.stringify(s))
if(s){const r=await fetch(s.image||s.cover); console.log(r.status===200&&/^https:/.test(s.image)?'PASS':'FAIL','seminar_image_public',r.status,r.headers.get('content-type'))
 const g=await (await b.newContext({viewport:{width:1440,height:900}})).newPage(); await g.goto(`${BASE}/seminarlar/${s.id}`,{waitUntil:'networkidle'}); await g.waitForTimeout(5000); await g.screenshot({path:`${OUT}/16-img-seminar-guest.png`})
 const ok=await g.evaluate((src)=>[...document.images].some(i=>i.src===src&&i.naturalWidth>0),s.image); console.log(ok?'PASS':'FAIL','guest_page_image_rendered')}
fs.writeFileSync(`${OUT}/lv5.json`,JSON.stringify({ts,seminar:s}))
await b.close()
