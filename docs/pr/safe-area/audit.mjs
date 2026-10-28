import { chromium } from 'playwright'
const [,, OUT, TAG] = process.argv
const BASE='http://localhost:4173'
const routes=['/','/profil','/profil/kurslar','/profil/seminarlar','/profil/buyurtmalar','/profil/sevimlilar','/profil/manzillar','/profil/tolov-usullari','/sozlamalar','/sertifikatlar','/marketplace','/seminarlar','/kitoblar','/talim','/forma','/jihozlar','/ustalar','/ishlar','/ortiqcha','/mutaxassislar','/elonlar','/kanallar','/yangiliklar','/kategoriyalar','/brendlar','/aksiyalar','/community','/buyurtma','/bemorlar','/uchrashuvlar','/tolovlar','/ombor','/klinika','/xizmatlar','/davolash-rejalari','/kirish',
'/forma/bestex-erkak','/jihozlar/sirona-intego','/ortiqcha/filtek-z350-xt','/ustalar/sardor-rahimov','/ishlar/bolalar-family','/mutaxassislar/azizbek-karimov','/elonlar/unit-kreslo','/kitoblar/terapevtik-stomatologiya-2004','/kitoblar/terapevtik-stomatologiya-2004/oqish','@product','@seminar',
'/sotuvchi','/tashkilotchi','/admin']
const b=await chromium.launch()
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2})
await ctx.addInitScript(()=>{const ap=()=>{const d=document.documentElement;d.style.setProperty('--safe-top-sim','47px','important');d.style.setProperty('--safe-bottom-sim','34px','important')};ap();document.addEventListener('DOMContentLoaded',ap);const m=window.matchMedia;window.matchMedia=q=>/standalone/.test(q)?{matches:true,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}:m.call(window,q);Object.defineProperty(navigator,'standalone',{get:()=>true})})
const p=await ctx.newPage(); const out=[]
const pick=async(list,re)=>{await p.goto(BASE+list,{waitUntil:'networkidle'});await p.waitForTimeout(800);return await p.locator(`a[href^="${re}"]`).first().getAttribute('href')}
for (let r of routes){
  if(r==='@product') r=await pick('/marketplace','/product/'); if(r==='@seminar') r=await pick('/seminarlar','/seminarlar/')
  if(!r) continue
  await p.goto(BASE+r,{waitUntil:'networkidle'}).catch(()=>{}); await p.addStyleTag({content:':root{--safe-top-sim:47px!important;--safe-bottom-sim:34px!important}'}); await p.waitForTimeout(900); if(!(await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--safe-top-sim').trim()==='47px'))) console.log('SIM FAIL',r)
  const res=await p.evaluate(()=>{
    const SAFE=47, issues=[]
    const vis=e=>{const r=e.getBoundingClientRect();const cs=getComputedStyle(e);return r.width>0&&r.height>0&&cs.visibility!=='hidden'&&cs.display!=='none'}
    for(const e of document.querySelectorAll('button,a,h1,h2,img[alt="StomaHub"]')){ if(!vis(e))continue; const r=e.getBoundingClientRect(); if(r.bottom>2&&r.top<SAFE-2&&r.top>-200){ // in status bar zone
        const top=document.elementFromPoint(r.left+r.width/2,Math.max(1,r.top+2)); if(top&&(e===top||e.contains(top))) {issues.push('statusbar:'+(e.getAttribute('aria-label')||e.innerText||e.tagName).slice(0,20)); }}}
    const h=[...document.querySelectorAll('h1,h2')].find(vis)
    if(h){const r=h.getBoundingClientRect(); const t=document.elementFromPoint(r.left+Math.min(20,r.width/2),r.top+r.height/2); if(t&&!(h===t||h.contains(t))) issues.push('title-covered:'+h.innerText.slice(0,20)+' by '+(t.className||t.tagName).toString().slice(0,40))
      // fade: any ancestor/overlay with opacity
      let o=1; for(let e=h;e;e=e.parentElement) o*=+getComputedStyle(e).opacity; if(o<0.95) issues.push('title-faded')}
    return {issues:[...new Set(issues)].slice(0,4), h:h?.innerText.slice(0,25)}
  })
  const name=r.replace(/^\//,'').replace(/\//g,'_')||'home'
  await p.screenshot({path:`${OUT}/${TAG}-${name}.png`})
  out.push([r,res.h,res.issues.join(' | ')])
}
await b.close(); for(const o of out) console.log(o.join('  ::  '))
