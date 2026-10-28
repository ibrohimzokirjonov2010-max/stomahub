import {chromium} from 'playwright';const b=await chromium.launch();const pg=await b.newPage();
const P=process.argv[2];await pg.goto(P+'/?_vercel_share='+process.argv[3]);await pg.waitForTimeout(1500);await pg.goto(P+'/kirish');await pg.waitForTimeout(3000);
console.log(pg.url());console.log(await pg.evaluate(()=>[...document.querySelectorAll('input,button')].map(e=>e.tagName+':'+e.type+':'+(e.placeholder||e.innerText)).join('\n')));await b.close();
