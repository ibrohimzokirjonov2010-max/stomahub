import {chromium} from 'playwright';const [P,S]=process.argv.slice(2);const b=await chromium.launch();const pg=await b.newPage({viewport:{width:390,height:844}});
await pg.goto(P+'/?_vercel_share='+S);await pg.waitForTimeout(1500);pg.on('pageerror',e=>console.log('ERR',e.message));pg.on('console',m=>m.type()==='error'&&console.log('CE',m.text().slice(0,200)));await pg.goto(P+'/kanallar');await pg.waitForTimeout(5000);
console.log(await pg.locator('nav').last().innerText().catch(()=>'none'));await pg.screenshot({path:'/workspace/demo-purge/courses/390-kanallar.png'});await b.close();
