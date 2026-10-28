import {chromium} from 'playwright';
const P=process.argv[2];const b=await chromium.launch();const pg=await b.newPage();
for(const p of ['/maxfiylik','/foydalanish-shartlari']){await pg.goto(P+p);await pg.waitForTimeout(2000);console.log(p,(await pg.locator('h1').first().innerText().catch(()=>'NO H1')));}
await pg.goto(P+'/kirish');await pg.waitForTimeout(2500);
await pg.getByText(/Google/i).first().click();
await pg.waitForURL(/accounts\.google\.com/,{timeout:20000}).catch(()=>{});
const u=new URL(pg.url());console.log(u.host,u.searchParams.get('client_id'));
const st=u.searchParams.get('redirect_uri');console.log('redirect_uri',st);await b.close();
