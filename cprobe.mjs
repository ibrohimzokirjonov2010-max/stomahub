import {chromium} from 'playwright';
const [P,S,EM,PW]=process.argv.slice(2);const O='/workspace/demo-purge/courses/';const b=await chromium.launch();
for(const [w,h] of [[390,844],[1440,900]]){
const c=await b.newContext({viewport:{width:w,height:h}});const pg=await c.newPage();
await pg.goto(P+'/?_vercel_share='+S);await pg.waitForTimeout(1500);
await pg.goto(P+'/talim');await pg.waitForTimeout(5000);
const t=await pg.locator('body').innerText();
console.log(w,'talim demo',/Abdulayeva|Raximov/.test(t),'empty',t.includes('Hali kurslar qo‘shilmagan'),'tabbar',t.includes('Marketplace')&&t.includes('Profil'),'Daraja visible',t.includes('Daraja:'));
await pg.screenshot({path:O+w+'-talim.png'});
if(w==390){await pg.getByLabel('Filtrlar').click();await pg.waitForTimeout(800);await pg.getByRole('button',{name:'Ekspert'}).click().catch(()=>{});await pg.screenshot({path:O+'390-filter-sheet.png'});await pg.getByRole('button',{name:'Qo‘llash'}).click();await pg.waitForTimeout(500);console.log('badge',await pg.getByLabel('Filtrlar').innerText());await pg.screenshot({path:O+'390-filter-applied.png'});
for(const r of ['/yangiliklar','/aksiyalar','/kanallar']){await pg.goto(P+r);await pg.waitForTimeout(3000);const x=await pg.locator('body').innerText();console.log(r,'tabbar',x.includes('Seminarlar')&&x.includes('Profil'));}}
if(w==1440){await pg.goto(P+'/kirish');await pg.waitForTimeout(2500);await pg.getByText('Email bilan kirish').click();await pg.waitForTimeout(800);
await pg.locator('input[type=email],input[type=tel],input[type=text]').first().fill(EM);await pg.locator('input[type=password]').fill(PW);await pg.locator('button[type=submit]').click();await pg.waitForTimeout(5000);
await pg.goto(P+'/uchrashuvlar');await pg.waitForTimeout(4000);const x=await pg.locator('body').innerText();console.log('week',/Chor\s*28/.test(x));await pg.screenshot({path:O+'1440-uchrashuvlar-week.png'});}
await c.close();}
await b.close();
