import { chromium } from 'playwright-core'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
const BASE='https://stomahub-three.vercel.app', OUT='/workspace/demo-purge/live'
const ANON=fs.readFileSync('.env.local','utf8').match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1].trim()
const WS=class{close(){}send(){}addEventListener(){}removeEventListener(){}}
const sb=createClient('https://agmkoeuhqrwdvrreamhj.supabase.co',ANON,{realtime:{transport:WS},auth:{persistSession:false}})
await sb.auth.signInWithPassword({email:'test-seller-1793046755@example.com',password:'E2eTest!1793046755'})
const {data:rows,error}=await sb.from('seller_products').select('*').ilike('sku','LV-287782')
console.log(error?.message); const row=rows[0]; console.log(JSON.stringify(row).slice(0,600))
const a=await sb.rpc('admin_review_product',{p_id:row.id,p_approve:true,p_reason:''}); console.log('approve',a.error?.message||'ok')
const name=row.name||row.title
const b=await chromium.launch({executablePath:chromium.executablePath()})
for(const [w,h,tag] of [[1440,900,'desktop'],[390,844,'mobile']]){
 const pg=await (await b.newContext({viewport:{width:w,height:h}})).newPage()
 await pg.goto(`${BASE}/marketplace`,{waitUntil:'networkidle'}); await pg.waitForTimeout(5000)
 const n=await pg.getByText(name).count(); await pg.screenshot({path:`${OUT}/12-buyer-market-list-${tag}.png`}); console.log(n>0?'PASS':'FAIL',`buyer_product_list_${tag}`,n)
 await pg.goto(`${BASE}/product/${row.id}`,{waitUntil:'networkidle'}); await pg.waitForTimeout(5000); await pg.screenshot({path:`${OUT}/12-buyer-product-detail-${tag}.png`})
 const t=await pg.locator('body').innerText(); const img=await pg.locator('img[src*="supabase"]').count()
 const c={name:t.includes(name),price:/275[\s\u00a0\u202f]?000/.test(t),desc:t.includes('Live verify yangi mahsulot'),cat:t.includes('Restavratsion'),stock:/18/.test(t),img:img>0}
 console.log(Object.values(c).every(Boolean)?'PASS':'FAIL',`buyer_product_detail_${tag}`,JSON.stringify(c))
}
await b.close()
