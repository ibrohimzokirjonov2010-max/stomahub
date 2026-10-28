// Local RLS/RPC check for 0026 (organizers) on a throwaway embedded Postgres (Supabase auth/storage stubbed).
// Applies 0001..0026 and asserts stage-1/stage-2 permissions. Never touches the real project.
// Run: npm i --no-save embedded-postgres pg && node supabase/tests/0026_organizer_applications.test.mjs
import EmbeddedPostgres from 'embedded-postgres'
import pg from 'pg'
import fs from 'fs'
fs.rmSync('/tmp/stomahub-pgtest26',{recursive:true,force:true})
const db = new EmbeddedPostgres({ databaseDir: '/tmp/stomahub-pgtest26', user: 'postgres', password: 'x', port: 54331, persistent: false })
await db.initialise(); await db.start()
const c = new pg.Client({ host: 'localhost', port: 54331, user: 'postgres', password: 'x', database: 'postgres' }); await c.connect()
const stub = `
do $$ begin create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls; exception when others then null; end $$;
create schema if not exists auth; create schema if not exists storage; create schema if not exists extensions;
create extension if not exists pgcrypto;
create table if not exists auth.users (id uuid primary key default gen_random_uuid(), email text, phone text, raw_user_meta_data jsonb default '{}', raw_app_meta_data jsonb default '{}', created_at timestamptz default now());
create or replace function auth.uid() returns uuid language sql stable as $f$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $f$;
create or replace function auth.role() returns text language sql stable as $f$ select coalesce(current_setting('request.jwt.claim.role', true),'anon') $f$;
create or replace function auth.jwt() returns jsonb language sql stable as $f$ select '{}'::jsonb $f$;
create table if not exists storage.buckets (id text primary key, name text, public boolean default false, file_size_limit bigint, allowed_mime_types text[], created_at timestamptz default now());
create table if not exists storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid, created_at timestamptz default now());
alter table storage.objects enable row level security;
create or replace function storage.foldername(name text) returns text[] language sql immutable as $f$ select string_to_array(name,'/') $f$;
grant usage on schema auth, storage, public to anon, authenticated, service_role;
do $$ begin create publication supabase_realtime; exception when others then null; end $$;
`
await c.query(stub)
const dir = new URL('../migrations', import.meta.url).pathname
const A='11111111-1111-1111-1111-111111111111', U='22222222-2222-2222-2222-222222222222', S='33333333-3333-3333-3333-333333333333', L='44444444-4444-4444-4444-444444444444'
const files = fs.readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()
for (const f of files.filter((f) => f < '0026')) await c.query(fs.readFileSync(`${dir}/${f}`, 'utf8'))
await c.query(`insert into auth.users(id,email) values ('${A}','a@x'),('${U}','u@x'),('${S}','s@x'),('${L}','l@x')`)
await c.query(`update public.profiles set role='seller', seller_status='approved' where id='${S}'`)
// legacy: self-made 'pending' organizer from the 0024 era, no application
await c.query(`update public.profiles set role='organizer', org_status='pending' where id='${L}'`)
for (const f of files.filter((f) => f >= '0026')) await c.query(fs.readFileSync(`${dir}/${f}`, 'utf8'))
await c.query(`update public.profiles set role='admin' where id='${A}'`)
let n=0, bad=0
async function as(uid, sql, expectOk, label) {
  await c.query('begin')
  await c.query(`set local role authenticated; select set_config('request.jwt.claim.sub','${uid}',true), set_config('request.jwt.claim.role','authenticated',true)`)
  let ok=true, msg='', rows
  try { rows=(await c.query(sql)).rows } catch(e){ ok=false; msg=e.message }
  if (ok && /^\s*(update|delete)/i.test(sql) && rows && rows.length===0) { /* fine */ }
  await c.query(ok?'commit':'rollback')
  n++; const pass = ok===expectOk; if(!pass) bad++
  console.log(pass?'PASS':'FAIL', label, ok?'(ok)':'(err: '+msg.slice(0,110)+')')
  return rows
}
const st = async(id=U)=> (await c.query(`select role,org_status,verified,org_type,stir from profiles where id='${id}'`)).rows[0]
const sem = (id) => `insert into seminars(id,organizer_id,title) values ('${id}', auth.uid(), 'Endo kurs') returning 1`
const app = (uid, extra='') => `insert into seller_applications(user_id,kind${extra?',status':''},full_name,phone,email,shop_name,category,region,address,legal_type,stir,docs) values ('${uid}','organizer'${extra?`,'${extra}'`:''},'Vali Aliyev','+998901234567','u@test.uz','Dental Academy','Endodontiya','Toshkent shahri','addr','mchj','123456789','[{"key":"certificate","path":"${uid}/b/c.pdf"}]')`
console.log('  legacy pending organizer after 0026', JSON.stringify(await st(L)))
await as(U,`select request_organizer_role()`,false,'client cannot jump to pending without application')
await as(U,`update profiles set role='organizer', org_status='approved' where id='${U}'`,true,'self-assign role update (guard should freeze)'); console.log('  after self-assign attempt', JSON.stringify(await st()))
await as(U,sem('s0'),false,'client cannot add seminar')
await as(U,`insert into organizer_settings(organizer_id,org_name) values ('${U}','X') returning 1`,false,'client cannot write organizer_settings')
await as(U,`select register_organizer('Vali Aliyev','Dental Academy','Toshkent, Yunusobod [geo:41.36,69.29]','+998901234567','@da','da','')`,true,'stage1 register_organizer')
console.log('  profile', JSON.stringify(await st()))
await as(U,`select register_organizer('Vali A','DA','addr','+998901234567','','','https://evil/x.png')`,false,'register_organizer rejects foreign logo')
await as(U,`select register_organizer('Vali A','DA','addr','12345','','','')`,false,'register_organizer rejects bad phone')
await as(S,`select register_organizer('Sotuvchi','Shop','addr','+998901234567','','','')`,false,'seller account cannot register as organizer')
await as(U,sem('s1'),false,'registered cannot add seminar')
await as(U,`insert into promo_codes(code, organizer_id) values ('X', auth.uid())`,false,'registered cannot add promo code')
await as(U,`update organizer_settings set description='Endodontiya kurslari', website='da.uz' where organizer_id='${U}' returning 1`,true,'registered can edit own organizer_settings')
await as(L,`select count(*) from organizer_settings where organizer_id='${U}'`,true,'other user query runs'); console.log('  other user sees U settings rows:', (await c.query(`begin; set local role authenticated; select set_config('request.jwt.claim.sub','${L}',true); select count(*) from organizer_settings where organizer_id='${U}'`))[3].rows[0].count); await c.query('rollback')
await as(L,`update organizer_settings set org_name='hack' where organizer_id='${U}' returning 1`,true,'other user update (should hit 0 rows)'); console.log('  U org_name:', (await c.query(`select org_name from organizer_settings where organizer_id='${U}'`)).rows[0].org_name)
await as(U,`update profiles set org_status='approved', verified=true where id='${U}'`,true,'self-approve update (guard should freeze)'); console.log('  after self-approve attempt', JSON.stringify(await st()))
await as(U,`select request_organizer_role()`,false,'request_organizer_role needs pending application')
await as(U,app(U,'approved'),false,'cannot insert approved app')
await as(U,app(A),false,'cannot insert app for other user')
await as(U,app(U),true,'stage2 insert pending organizer app')
await as(U,app(U),false,'second pending organizer app blocked')
await as(U,`select request_organizer_role()`,true,'request_organizer_role -> pending')
console.log('  profile', JSON.stringify(await st()))
await as(U,sem('s2'),false,'pending cannot add seminar')
await as(L,`select count(*) c from seller_applications where user_id='${U}'`,true,'other user reads apps'); 
await as(U,`update seller_applications set status='approved' where user_id='${U}' returning 1`,false,'applicant cannot update own app')
const id=(await c.query(`select id,status from seller_applications where user_id='${U}'`)).rows[0]; console.log('  app status after applicant update:', id.status)
await as(U,`select admin_review_application('${id.id}',true,'')`,false,'non-admin cannot review')
await as(A,`select admin_review_application('${id.id}',false,'x')`,false,'reject needs reason >=3')
await as(A,`select admin_review_application('${id.id}',false,'STIR hujjati o‘qilmaydi')`,true,'admin rejects with reason')
console.log('  profile', JSON.stringify(await st()))
await as(U,sem('s3'),false,'rejected cannot add seminar')
await as(U,app(U),true,'resubmit after rejection')
await as(U,`select request_organizer_role()`,true,'request_organizer_role again')
const id2=(await c.query(`select id from seller_applications where user_id='${U}' and status='pending'`)).rows[0].id
await as(A,`select admin_review_application('${id2}',true,'')`,true,'admin approves')
console.log('  profile', JSON.stringify(await st()))
console.log('  settings', JSON.stringify((await c.query(`select org_name,owner_name,email,description from organizer_settings where organizer_id='${U}'`)).rows[0]))
console.log('  notif', JSON.stringify((await c.query(`select title,link from customer_notifications where user_id='${U}' order by created_at`)).rows))
await as(U,sem('s4'),true,'approved can add seminar')
await as(A,`select admin_review_application('${id2}',true,'')`,false,'cannot re-review non-pending')
await as(L,sem('s5'),false,'legacy registered organizer cannot add seminar')
console.log(`\n${n-bad}/${n} passed`); process.exitCode = bad ? 1 : 0
await c.end(); await db.stop()
