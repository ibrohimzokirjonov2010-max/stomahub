// Local RLS/RPC check for 0025 on a throwaway embedded Postgres (Supabase auth/storage stubbed).
// Applies 0001..0025 and asserts stage-1/stage-2 permissions. Never touches the real project.
// Run: npm i --no-save embedded-postgres pg && node supabase/tests/0025_seller_applications.test.mjs
import EmbeddedPostgres from 'embedded-postgres'
import pg from 'pg'
import fs from 'fs'
fs.rmSync('/tmp/stomahub-pgtest',{recursive:true,force:true})
const db = new EmbeddedPostgres({ databaseDir: '/tmp/stomahub-pgtest', user: 'postgres', password: 'x', port: 54330, persistent: false })
await db.initialise(); await db.start()
const c = new pg.Client({ host: 'localhost', port: 54330, user: 'postgres', password: 'x', database: 'postgres' }); await c.connect()
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
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()) await c.query(fs.readFileSync(`${dir}/${f}`, 'utf8'))
const A='11111111-1111-1111-1111-111111111111', U='22222222-2222-2222-2222-222222222222'
await c.query(`insert into auth.users(id,email) values ('${A}','a@x'),('${U}','u@x')`)
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
const st = async()=> (await c.query(`select role,seller_status,verified,shop_name,shop_address from profiles where id='${U}'`)).rows[0]
await as(U,`insert into seller_products(name) values ('x')`,false,'client cannot add product')
await as(U,`select register_seller('Vali Aliyev','Test Dent','Toshkent, Chilonzor [geo:41.28,69.2]','+998901234567','@td','td','')`,true,'stage1 register_seller')
console.log('  profile', JSON.stringify(await st()))
await as(U,`select register_seller('Vali A','Test2','addr','+998901234567','','','https://evil/x.png')`,false,'register_seller rejects foreign logo')
await as(U,`insert into seller_products(name) values ('x')`,false,'registered cannot add product')
await as(U,`update seller_settings set work_hours='10:00 - 19:00', instagram='td2' where seller_id='${U}' returning 1`,true,'registered can edit own settings')
await as(U,`update profiles set seller_status='approved', verified=true where id='${U}'`,true,'self-approve update (guard should freeze)'); console.log('  after self-approve attempt', JSON.stringify(await st()))
await as(U,`select request_seller_role('Test Dent')`,false,'request_seller_role needs pending application')
await as(U,`insert into seller_applications(user_id,kind,status,full_name,phone,email,shop_name,category,region,address,legal_type,stir,docs) values ('${U}','seller','approved','V A','+998901234567','u@test.uz','Test Dent','Implantlar','Toshkent sh.','addr','yatt','123456789','[]')`,false,'cannot insert approved app')
await as(U,`insert into seller_applications(user_id,kind,full_name,phone,email,shop_name,category,region,address,legal_type,stir,docs) values ('${A}','seller','V A','+998901234567','u@test.uz','Test Dent','Implantlar','Toshkent sh.','addr','yatt','123456789','[]')`,false,'cannot insert app for other user')
await as(U,`insert into seller_applications(user_id,kind,full_name,phone,email,shop_name,category,region,address,legal_type,stir,docs) values ('${U}','seller','V A','+998901234567','u@test.uz','Test Dent','Implantlar','Toshkent sh.','addr','yatt','123456789','[{"key":"license","path":"${U}/b/license.pdf"}]')`,true,'stage2 insert pending app')
await as(U,`insert into seller_applications(user_id,kind,full_name,phone,email,shop_name,category,region,address,legal_type,stir,docs) values ('${U}','seller','V A','+998901234567','u@test.uz','Test Dent','Implantlar','Toshkent sh.','addr','yatt','123456789','[]')`,false,'second pending app blocked')
await as(U,`select request_seller_role('Test Dent')`,true,'request_seller_role -> pending')
console.log('  profile', JSON.stringify(await st()))
await as(U,`update seller_applications set status='approved' where user_id='${U}' returning 1`,false,'applicant cannot update own app')
const id=(await c.query(`select id,status from seller_applications where user_id='${U}'`)).rows[0]; console.log('  app status after applicant update:', id.status)
await as(U,`select admin_review_application('${id.id}',true,'')`,false,'non-admin cannot review')
await as(A,`select count(*) from seller_applications`,true,'admin reads all')
await as(A,`select admin_review_application('${id.id}',false,'x')`,false,'reject needs reason >=3')
await as(A,`select admin_review_application('${id.id}',true,'')`,true,'admin approves')
console.log('  profile', JSON.stringify(await st()))
console.log('  notif', JSON.stringify((await c.query(`select title,body,link from customer_notifications where user_id='${U}'`)).rows))
await as(U,`insert into seller_products(name) values ('x') returning 1`,true,'approved can add product')
await as(A,`select admin_review_application('${id.id}',true,'')`,false,'cannot re-review non-pending')
console.log(`\n${n-bad}/${n} passed`); process.exitCode = bad ? 1 : 0
await c.end(); await db.stop()
