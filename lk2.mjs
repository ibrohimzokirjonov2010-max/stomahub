import {chromium} from 'playwright';const b=await chromium.launch();const pg=await b.newPage({viewport:{width:390,height:844}});
const P=process.argv[2];await pg.goto(P+'/?_vercel_share='+process.argv[3]);await pg.waitForTimeout(1500);await pg.goto(P+'/kirish');await pg.waitForTimeout(3000);
await pg.locator('input[type=tel]').fill(process.argv[4]);await pg.locator('input[type=password]').fill(process.argv[5]);await pg.locator('button[type=submit]').click();await pg.waitForTimeout(6000);
console.log(pg.url());console.log((await pg.locator('body').innerText()).slice(0,600));await pg.screenshot({path:'/workspace/demo-purge/appointments/login.png'});await b.close();
