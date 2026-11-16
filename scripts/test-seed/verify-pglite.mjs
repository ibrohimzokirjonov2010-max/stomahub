// 0075/0076 ni lokal PGlite (WASM Postgres) da tekshirish: 0001–0074 + Supabase auth/storage stub, keyin
// seed ×2 (idempotent), soni, ko‘rinish (market_products, seminars_public, course_catalog), server himoyasi,
// cleanup ×2, haqiqiy qatorlar o‘zgarmagani. Haqiqiy bazaga ULANMAYDI.
// Ishga tushirish: npm i --no-save @electric-sql/pglite && node scripts/test-seed/verify-pglite.mjs
import { PGlite } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp'
import { readFileSync } from 'node:fs'
import { readdirSync } from 'node:fs'
const dir = new URL('../../supabase/migrations/', import.meta.url).pathname
const db = new PGlite({ extensions: { pgcrypto, uuid_ossp } })
const stub = `
create role anon nologin; create role authenticated nologin; create role service_role nologin; create role supabase_admin nologin;
create role postgres_x nologin;
create schema auth; create schema storage; create schema extensions;
create table auth.users (id uuid primary key, instance_id uuid, aud text, role text, email text, encrypted_password text,
  raw_app_meta_data jsonb, raw_user_meta_data jsonb, confirmation_token text, recovery_token text, email_change_token_new text,
  email_change text, created_at timestamptz, updated_at timestamptz, email_confirmed_at timestamptz, phone text, last_sign_in_at timestamptz,
  is_sso_user boolean default false, deleted_at timestamptz);
create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create or replace function auth.role() returns text language sql stable as $$ select coalesce(current_setting('request.jwt.claim.role', true), 'anon') $$;
create or replace function auth.jwt() returns jsonb language sql stable as $$ select '{}'::jsonb $$;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[], owner uuid, created_at timestamptz default now(), updated_at timestamptz default now());
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid, metadata jsonb, created_at timestamptz default now(), updated_at timestamptz default now(), last_accessed_at timestamptz);
create or replace function storage.foldername(name text) returns text[] language sql as $$ select string_to_array(name, '/') $$;
create or replace function storage.extension(name text) returns text language sql as $$ select reverse(split_part(reverse(name), '.', 1)) $$;
alter table storage.objects enable row level security;
`
await db.exec(stub)
for (const f of readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()) {
  if (/^007[56]|^0063b/.test(f)) continue
  await db.exec(readFileSync(dir + f, 'utf8'))
}
const q = async (s) => (await db.query(s)).rows
const ok = (c, m) => { console.log(c ? 'PASS' : 'FAIL', m); if (!c) process.exitCode = 1 }
// "haqiqiy" sotuvchi + mahsulot + buyurtma
await db.exec(`
insert into auth.users (id, email, raw_user_meta_data) values ('11111111-1111-4111-8111-111111111111', 'real@x.uz', '{"name":"StomaHub Market"}');
update public.profiles set role='seller', seller_status='approved', shop_name='StomaHub Market' where id='11111111-1111-4111-8111-111111111111';
insert into public.seller_products (id, seller_id, name, category, price, stock, status) values ('22222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111','Real kompozit','Kompozitlar',100000,5,'active');
insert into public.catalog_items (kind,id,payload,sort_at,owner_id,status) values ('master','real-job','{"name":"Real"}',1,'11111111-1111-4111-8111-111111111111','active');
`)
const seed = readFileSync(dir + '0075_test_seed.sql', 'utf8')
const clean = readFileSync(dir + '0076_test_seed_cleanup.sql', 'utf8')
await db.exec(seed); await db.exec(seed) // idempotent
const c = async () => (await q(`select
 (select count(*)::int from public.seller_products where seed_batch='test-2026-11') sp,
 (select count(*)::int from public.catalog_items where seed_batch='test-2026-11') cat,
 (select count(*)::int from public.catalog_items where kind='deal' and id like 'sp-7e57d000%') deals,
 (select count(*)::int from public.seminars where seed_batch='test-2026-11') sem,
 (select count(*)::int from public.tickets where seed_batch='test-2026-11') tix,
 (select count(*)::int from public.courses where seed_batch='test-2026-11') courses,
 (select count(*)::int from public.course_lessons where seed_batch='test-2026-11') lessons,
 (select count(*)::int from public.seller_promotions where seed_batch='test-2026-11') promos,
 (select count(*)::int from public.profiles where seed_batch='test-2026-11') profiles,
 (select count(*)::int from auth.users where id::text like '7e57d000%') users`))[0]
const a = await c(); console.log(a)
ok(a.sp === 22 && a.cat === 40 && a.deals === 6 && a.sem === 5 && a.tix === 7 && a.lessons === 17 && a.courses === 5 && a.promos === 6 && a.profiles === 9 && a.users === 9, 'seed counts')
const mp = await q(`select category, count(*)::int n from public.market_products() where id::text like '7e57d000%' group by 1 order by 1`)
console.log(mp); ok(mp.reduce((s, r) => s + r.n, 0) === 22, 'market_products shows all test products')
const fp = await q(`select name, stock from public.seller_products where id='7e57d000-0000-4000-b000-000000000021'`); console.log(fp)
const sp = await q(`select count(*)::int n from public.seminars_public where id like '7e57d000%'`); ok(sp[0].n === 5, 'seminars_public shows 5')
const cc = await q(`select jsonb_array_length(public.course_catalog()) n`); ok(cc[0].n === 5, 'course_catalog shows 5 (' + cc[0].n + ')')
const deal = await q(`select payload->>'name' name, (payload->>'off') off from public.catalog_items where kind='deal' and id like 'sp-7e57d000%' order by id limit 2`); console.log(deal)
const job = await q(`select payload->>'phone' phone, hidden, status from public.catalog_items where id='ts26-ish-terapevt'`); console.log(job)
// guards
try {
  await db.exec(`insert into public.seller_orders (id, seller_id, buyer_id) values ('33333333-3333-4333-8333-333333333333','7e57d000-0000-4000-a000-000000000001', null);
  insert into public.seller_order_items (order_id, seller_id, product_id, name, qty, price) values ('33333333-3333-4333-8333-333333333333','7e57d000-0000-4000-a000-000000000001','7e57d000-0000-4000-b000-000000000001','x',1,1);`)
  ok(false, 'order guard')
} catch (e) { ok(/test_seed/.test(e.message), 'order guard: ' + e.message.slice(0, 80)) }
await db.exec(`delete from public.seller_orders where id='33333333-3333-4333-8333-333333333333'`)
try { await db.exec(`insert into public.registrations (id, seminar_id, organizer_id, name) values ('r1','7e57d000-0000-4000-e000-000000000001','7e57d000-0000-4000-a000-000000000005','x')`); ok(false, 'reg guard') }
catch (e) { ok(/test_seed/.test(e.message), 'registration guard: ' + e.message.slice(0, 80)) }
try { await db.exec(`insert into public.course_enrollments (course_id, user_id) values ('7e57d000-0000-4000-c000-000000000001','11111111-1111-4111-8111-111111111111')`); ok(false, 'enroll guard') }
catch (e) { ok(/test_seed/.test(e.message), 'enroll guard: ' + e.message.slice(0, 80)) }
// seed_batch guard: oddiy foydalanuvchi o'z mahsulotiga seed_batch qo'ya olmaydi / sinovdagisini olib tashlay olmaydi
await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111', false);`)
try { await db.exec(`update public.seller_products set seed_batch='x' where id='22222222-2222-4222-8222-222222222222'`) } catch (e) { console.log('upd err', e.message.slice(0,80)) }
await db.exec(`reset role; select set_config('request.jwt.claim.sub','', false);`)
ok((await q(`select seed_batch from public.seller_products where id='22222222-2222-4222-8222-222222222222'`))[0].seed_batch === null, 'user cannot set seed_batch')
// real order still works
await db.exec(`insert into public.seller_orders (id, seller_id) values ('44444444-4444-4444-8444-444444444444','11111111-1111-4111-8111-111111111111');
 insert into public.seller_order_items (order_id, seller_id, product_id, name, qty, price) values ('44444444-4444-4444-8444-444444444444','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','Real',1,100000);`)
ok(true, 'real order item insert allowed')
await db.exec(clean); await db.exec(clean)
const b = await c(); console.log(b); ok(Object.values(b).every((v) => v === 0), 'cleanup removes everything')
const real = await q(`select (select count(*)::int from public.seller_products where id='22222222-2222-4222-8222-222222222222') p,
 (select count(*)::int from public.catalog_items where id='real-job') j, (select count(*)::int from public.seller_order_items where order_id='44444444-4444-4444-8444-444444444444') oi,
 (select count(*)::int from public.profiles where id='11111111-1111-4111-8111-111111111111') pr`)
console.log(real); ok(real[0].p === 1 && real[0].j === 1 && real[0].oi === 1 && real[0].pr === 1, 'real rows untouched')
await db.exec(seed); ok((await c()).sp === 22, 're-seed after cleanup works')
