import { chromium } from 'playwright-core'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
const BASE='https://stomahub-three.vercel.app', OUT='/workspace/demo-purge/live'
const URL='https://agmkoeuhqrwdvrreamhj.supabase.co'
const ANON=fs.readFileSync('.env.local','utf8').match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1].trim()
const WS=class{close(){}send(){}addEventListener(){}removeEventListener(){}}
const sbc=()=>createClient(URL,ANON,{realtime:{transport:WS},auth:{persistSession:false}})
const ts=Date.now(); const R={}
const mark=(k,ok,d='')=>{R[k]={ok,d};console.log(ok?'PASS':'FAIL',k,'—',d)}
const SELLER={email:'test-seller-1793046755@example.com',pass:'E2eTest!1793046755'}
const P={name:`Live New Product ${ts}`,price:'275000',stock:'18',sku:`LV-${String(ts).slice(-6)}`,cat:'Restavratsion materiallar',desc:'Live verify yangi mahsulot — tavsif, kategoriya va stok bilan.'}
const b=await chromium.launch({executablePath:chromium.executablePath()})
const ctx=async(w,h)=>(await b.newContext({viewport:{width:w,height:h}})).newPage()
async function login(page,email,pass,next='/'){
  await page.goto(`${BASE}/kirish?next=${encodeURIComponent(next)}`,{waitUntil:'domcontentloaded'})
  await page.waitForSelector('form input')
  const em=page.getByText(/Email bilan kirish/i).first(); if(await em.count()){await em.click();await page.waitForTimeout(400)}
  const ei=page.locator('form input[type="email"]'); if(await ei.count()) await ei.first().fill(email); else await page.locator('form input').first().fill(email)
  await page.locator('form input[type="password"]').fill(pass)
  await page.locator('form button[type="submit"]').click()
  await page.waitForFunction(()=>!location.pathname.startsWith('/kirish'),{timeout:60000}).catch(()=>{})
  await page.waitForTimeout(3000)
}
const shot=(p,n)=>p.screenshot({path:`${OUT}/${n}.png`})
// 1) empty account via API (UI blocks test domains by design)
const email=`live-empty-${ts}@example.com`, pass=`LiveTest!${ts}`
{const sb=sbc(); const {data,error}=await sb.auth.signUp({email,password:pass,options:{data:{full_name:'Karimov Dilshod',name:'Karimov Dilshod',phone:'+9989'+String(ts).slice(-8),specialty:'Stomatolog'}}})
 mark('empty_account_register_api',!error&&!!data.user,error?.message||`session=${!!data.session}`)}
const d=await ctx(1440,900); await login(d,email,pass,'/'); await d.goto(BASE,{waitUntil:'networkidle'}); await d.waitForTimeout(3000); await shot(d,'10-empty-home-desktop')
const dt=await d.locator('body').innerText(); mark('header_registered_name',/Karimov Dilshod|Dilshod/.test(dt),d.url())
const m=await ctx(390,844); await login(m,email,pass,'/'); await m.goto(BASE,{waitUntil:'networkidle'}); await m.waitForTimeout(3000); await shot(m,'10-empty-home-mobile')
const mt=await m.locator('body').innerText(); mark('mobile_salom_first_name',/Salom,\s*Dilshod/.test(mt),(mt.match(/Salom[^\n]*/)||[''])[0])
// 2) seller product via UI
const s=await ctx(1440,900); await login(s,SELLER.email,SELLER.pass,'/sotuvchi/mahsulotlar')
await s.goto(`${BASE}/sotuvchi/mahsulotlar`,{waitUntil:'networkidle'}); await s.waitForTimeout(2000)
await s.getByRole('button',{name:/Mahsulot qo‘shish/}).first().click(); await s.waitForTimeout(1000)
await s.locator('input[type="file"]').first().setInputFiles(`${OUT}/upload.png`).catch(e=>console.log('file',e.message))
await s.getByPlaceholder(/Mahsulot nomini/).fill(P.name)
await s.locator('select').filter({has:s.locator('option',{hasText:'Implantlar'})}).last().selectOption(P.cat)
await s.getByPlaceholder(/Mahsulot haqida/).fill(P.desc)
await s.getByPlaceholder('250 000').fill(P.price); await s.getByPlaceholder('15',{exact:true}).fill(P.stock); await s.getByPlaceholder('CMP-A3-001').fill(P.sku)
await shot(s,'11-seller-product-form-filled')
await s.getByRole('button',{name:/Tekshiruvga yuborish/}).click(); await s.waitForTimeout(5000); await shot(s,'11-seller-product-after-submit')
const sb=sbc(); await sb.auth.signInWithPassword(SELLER)
const {data:row}=await sb.from('seller_products').select('*').eq('name',P.name).maybeSingle()
mark('seller_create_product',!!row,row?`id=${row.id} status=${row.status} price=${row.price} stock=${row.stock} cat=${row.category} img=${JSON.stringify(row.images||row.image||'').slice(0,80)}`:'not found')
if(row&&row.status!=='active'){const {error}=await sb.rpc('admin_review_product',{p_id:row.id,p_approve:true,p_reason:''});console.log('approve',error?.message||'ok')}
// buyer checks
for(const [pg,tag] of [[d,'desktop'],[m,'mobile']]){
  await pg.goto(`${BASE}/marketplace`,{waitUntil:'networkidle'}); await pg.waitForTimeout(4000)
  const inList=await pg.getByText(P.name).count(); await shot(pg,`12-buyer-market-list-${tag}`)
  mark(`buyer_product_list_${tag}`,inList>0)
  if(row){await pg.goto(`${BASE}/product/${row.id}`,{waitUntil:'networkidle'}); await pg.waitForTimeout(4000); await shot(pg,`12-buyer-product-detail-${tag}`)
   const t=await pg.locator('body').innerText(); const imgOk=await pg.locator('img[src*="supabase"]').count()
   const chk={name:t.includes(P.name),price:/275[\s\u00a0 ]?000/.test(t),desc:t.includes('Live verify yangi mahsulot'),cat:t.includes(P.cat),stock:/18/.test(t),img:imgOk>0}
   mark(`buyer_product_detail_${tag}`,Object.values(chk).every(Boolean),JSON.stringify(chk))}
}
// 3) seminar detail screenshots (seminar created earlier)
const sid='live-new-seminar-1793123677841-twjp'
for(const [pg,tag] of [[d,'desktop'],[m,'mobile']]){await pg.goto(`${BASE}/seminarlar/${sid}`,{waitUntil:'networkidle'}); await pg.waitForTimeout(6000); await shot(pg,`13-seminar-detail-${tag}`)
 const t=await pg.locator('body').innerText(); const chk={title:t.includes('Live New Seminar 1793123677841'),place:/Hilton/.test(t),about:t.includes('Live verify uchun'),price:/450[\s\u00a0 ]?000/.test(t),date:/20/.test(t)}
 mark(`buyer_seminar_detail_${tag}`,chk.title&&chk.place&&chk.about,JSON.stringify(chk))}
fs.writeFileSync(`${OUT}/live-verify-report-2.json`,JSON.stringify({ts,email,product:row?.id,R},null,2))
await b.close()
