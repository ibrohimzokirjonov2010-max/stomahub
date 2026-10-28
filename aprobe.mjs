import {chromium} from 'playwright';
const [P,S,EM,PW]=process.argv.slice(2);const O='/workspace/demo-purge/appointments/';
const b=await chromium.launch();
for(const [w,h] of [[1440,900]]){
const c=await b.newContext({viewport:{width:w,height:h}});const pg=await c.newPage();
await pg.goto(P+'/?_vercel_share='+S);await pg.waitForTimeout(1500);
await pg.goto(P+'/kirish');await pg.waitForTimeout(2500);
await pg.getByText('Email bilan kirish').click();await pg.waitForTimeout(800);await pg.locator('input[type=email],input[type=tel],input[type=text]').first().fill(EM);
await pg.locator('input[type=password]').first().fill(PW);
await pg.locator('button[type=submit]').first().click();await pg.waitForTimeout(5000);
await pg.goto(P+'/uchrashuvlar');await pg.waitForTimeout(4000);
const t=await pg.locator('body').innerText();
console.log(w,'url',pg.url(),'empty',/Hali uchrashuvlar yo/.test(t),'demo',/Malika|Karimov Aziz|Tushlik/.test(t));
await pg.screenshot({path:O+w+'-v2-empty.png',fullPage:true});
const nm='Sinov Bemor '+w;
await pg.getByRole('button',{name:/^\s*(\+\s*)?(Yangi )?Uchrashuv( qo‘shish)?\s*$/i}).last().click().catch(e=>console.log('btn',e.message));
await pg.waitForTimeout(2000);
await pg.locator('input[placeholder^="Bemorni qidir"]').first().fill(nm);await pg.waitForTimeout(800);
await pg.getByText('ni qo‘shish').first().click().catch(e=>console.log('add',e.message));
await pg.getByRole('button',{name:'10:00',exact:true}).last().click().catch(e=>console.log('time',e.message));await pg.waitForTimeout(800);await pg.screenshot({path:O+w+'-v2-form.png',fullPage:true});
await pg.getByRole('button',{name:/Saqlash|Qo‘shish|Yaratish/}).last().click().catch(e=>console.log('save',e.message));
await pg.waitForTimeout(3000);await pg.goto(P+'/uchrashuvlar');await pg.waitForTimeout(5000);
const t2=await pg.locator('body').innerText();console.log(w,'after reload shows',t2.includes(nm));
await pg.screenshot({path:O+w+'-v2-added.png',fullPage:true});await c.close();}
await b.close();
