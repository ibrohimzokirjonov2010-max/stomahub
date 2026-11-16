// Generates supabase/migrations/0075_test_seed.sql and 0076_test_seed_cleanup.sql from data.mjs.
// Usage: node scripts/test-seed/build-sql.mjs
import { writeFileSync } from 'node:fs'
import { BATCH, USERS, PRODUCTS, FORMA, JIHOZ, PROMOS, SEMINARS, COURSES, CATALOG, COUNTS } from './data.mjs'
import { TEST_ID_PREFIX } from '../../src/lib/testSeed.js'

const T = '$ts$'
const q = (s) => {
  if (s === null || s === undefined) return 'null'
  if (typeof s === 'number') return String(s)
  if (typeof s === 'boolean') return s ? 'true' : 'false'
  const str = String(s)
  if (str.includes(T)) throw new Error(`value contains ${T}`)
  return `${T}${str}${T}`
}
const j = (v) => `${q(JSON.stringify(v))}::jsonb`
const arr = (list) => `array[${list.map(q).join(', ')}]::text[]`
const B = q(BATCH)
const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']
const dateLabel = (iso) => `${Number(iso.slice(8, 10))}-${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`
const SEED_TABLES = ['profiles', 'seller_products', 'seller_promotions', 'seminars', 'tickets', 'courses', 'course_lessons', 'catalog_items']

const users = USERS.map((u) => `  ('${u.id}'::uuid, ${q(u.email)}, ${j({ name: u.name, role: u.role === 'organizer' ? 'organizer' : 'customer', test_seed: BATCH })})`).join(',\n')
const profileUpdates = USERS.map((u) => `update public.profiles set
    name = ${q(u.name)}, shop_name = ${q(u.role === 'seller' ? u.name : '')}, city = ${q(u.city)}, specialty = ${q(u.specialty || '')},
    role = ${q(u.role)}, seller_status = ${q(u.role === 'seller' ? 'approved' : 'none')}, seller_type = ${u.seller_type ? q(u.seller_type) : 'null'},
    org_status = ${q(u.role === 'organizer' ? 'approved' : 'none')}, blocked = false, is_test = false, seed_batch = ${B}, updated_at = now()
  where id = '${u.id}'::uuid;`).join('\n')

const allProducts = [...PRODUCTS, ...FORMA, ...JIHOZ]
const productRows = allProducts.map((p) => `  ('${p.id}'::uuid, '${p.seller_id}'::uuid, ${q(p.name)}, ${q(p.sku)}, ${q(p.category)}, ${q(p.brand)}, ${p.price}, ${p.stock}, ${q(p.image_url)}, ${j(p.images)}, ${j(p.variants)}, ${q(p.description)}, ${q(p.unit)}, ${q(p.country)}, ${j(p.specs)}, ${j(p.forma)}, ${j(p.jihoz)})`).join(',\n')

const promoRows = PROMOS.map((p) => `  ('${p.id}'::uuid, '${USERS[p.seller - 1].id}'::uuid, '${p.product}'::uuid, ${p.old_price}, ${p.price}, ${q(p.title)})`).join(',\n')

const seminarRows = SEMINARS.map((s, i) => `  (${q(s.id)}, '${s.organizer_id}'::uuid, ${q(s.title)}, ${q(s.speaker)}, ${q(dateLabel(s.start_date))}, ${q(s.city)}, ${q(s.format)}, ${q(s.days)}, ${s.seats}, ${q(s.status)}, ${q(s.badge)}, ${q(s.image)}, ${q(s.topic)}, ${q(s.about)}, ${q(s.category)}, ${arr(s.tags)}, ${q(s.cover)}, ${q(s.start_date)}, ${q(s.start_time)}, ${q(s.end_date)}, ${q(s.end_time)}, ${q(s.place)}, ${q(s.address)}, ${q(s.template)}, ${j([{ id: `sp-${i + 1}`, name: s.speaker, role: s.topic, bio: '', city: s.city, avatar: '', links: [] }])}, ${q(s.contact_phone)}, ${q(s.contact_telegram)}, ${i + 1})`).join(',\n')
const ticketRows = SEMINARS.flatMap((s) => s.tickets.map((t, i) => `  (${q(t.id)}, ${q(s.id)}, '${s.organizer_id}'::uuid, ${q(t.name)}, ${t.price}, ${t.seats}, ${i})`)).join(',\n')

const courseRows = COURSES.map((c) => `  ('${c.id}'::uuid, '${c.author_id}'::uuid, ${q(c.title)}, ${q(c.description)}, ${q(c.direction)}, ${q(c.level)}, ${q(c.format)}, ${c.price}, ${q(c.cover_url)})`).join(',\n')
const lessonRows = COURSES.flatMap((c) => c.lessons.map((l) => `  ('${l.id}'::uuid, '${c.id}'::uuid, ${l.position}, ${q(l.title)}, ${q(l.module_title)})`)).join(',\n')

const catalogRows = CATALOG.map((r) => `  (${q(r.kind)}, ${q(r.id)}, ${j(r.payload)}, ${r.sort_at}, '${USERS[r.owner - 1].id}'::uuid)`).join(',\n')
const kindCounts = CATALOG.reduce((m, r) => ({ ...m, [r.kind]: (m[r.kind] || 0) + 1 }), {})

const guardFn = (table) => `drop trigger if exists ${table}_seed_batch_guard on public.${table};
create trigger ${table}_seed_batch_guard before insert or update on public.${table}
  for each row execute function public.seed_batch_guard();`

const countsComment = Object.entries(COUNTS).map(([k, n]) => `--     ${k}: ${n}`).join('\n')

const seed = `-- 0075 SINOV (test) MA’LUMOTLARI — barcha bo‘limlar uchun, hammaga ko‘rinadi, keyin o‘chiriladi.
-- QO‘LDA QO‘LLANADI — faqat Ibrohim roziligi bilan. Idempotent (qayta ishga tushirsa bo‘ladi).
-- Generatsiya: node scripts/test-seed/build-sql.mjs (manba: scripts/test-seed/data.mjs). Qo‘lda tahrirlamang.
-- O‘chirish: 0076_test_seed_cleanup.sql (faqat seed_batch = '${BATCH}' qatorlar va 9 ta sinov hisobi).
--
-- Nega is_test emas: 0037 da is_test = «hammadan yashirin» (market_products, seminars_public filtrlaydi).
-- Bu ma’lumot esa KO‘RINISHI kerak, shuning uchun alohida seed_batch text ustuni qo‘shiladi.
--
-- Nima qiladi:
--   1) seed_batch ustuni: ${SEED_TABLES.join(', ')} (default null — haqiqiy qatorlar o‘zgarmaydi).
--      seed_batch_guard: admin/servis bo‘lmagan foydalanuvchi seed_batch ni qo‘ya/olib tashlay olmaydi.
--   2) Xavfsizlik (server): seed_batch li mahsulot — buyurtma (seller_order_items), seminar — ro‘yxatdan o‘tish
--      (registrations), kurs — yozilish (course_enrollments) RAD etiladi: «Hozircha buyurtma qabul qilinmaydi».
--   3) 9 ta sinov hisobi (auth.users): parolsiz, @test.stomahub.invalid — ularga kirib bo‘lmaydi.
--      handle_new_user profil yaratadi; keyin rol/do‘kon nomi/tasdiq (approved) qo‘yiladi.
--   4) Ma’lumotlar (5–10 tadan):
${countsComment}
--      catalog_items: ${Object.entries(kindCounts).map(([k, n]) => `${k}=${n}`).join(', ')} (egasi — sinov hisoblari).
--   Telefonlar +998 90 000 00 NN (ulanmaydi), Telegram bo‘sh. Rasmlar — saytning o‘z /images fayllari.
--   ad_guard, surplus_guard, job_guard, seller_promotions_a_guard triggerlari faqat shu tranzaksiya ichida o‘chiriladi
--   (SQL Editor’da auth.uid() yo‘q). Qatorlar ular yozadigan shaklda (status/hidden/payload) beriladi.
--   StomaHub Market mahsulotlari, #STH-00025 / #STH-00029 buyurtmalari va boshqa haqiqiy qatorlarga tegilmaydi:
--   har bir upsert faqat seed_batch = '${BATCH}' qatorni yangilaydi.

begin;

-- 1) seed_batch ustunlari
${SEED_TABLES.map((t) => `alter table public.${t} add column if not exists seed_batch text;
create index if not exists ${t}_seed_batch_idx on public.${t} (seed_batch) where seed_batch is not null;`).join('\n')}
comment on column public.catalog_items.seed_batch is 'Sinov ma’lumoti partiyasi (0075). 0076_test_seed_cleanup.sql o‘chiradi.';

-- SECURITY INVOKER ataylab: definer bo‘lsa current_user doim egasi (postgres) bo‘lib, tekshiruv ishlamaydi.
create or replace function public.seed_batch_guard() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') or coalesce(public.is_admin(), false) then
    return new;
  end if;
  if tg_op = 'INSERT' then new.seed_batch := null; else new.seed_batch := old.seed_batch; end if;
  return new;
end $$;
${SEED_TABLES.map(guardFn).join('\n')}

-- 2) Server himoyasi: sinov mahsuloti/seminari/kursiga buyurtma va yozilish yo‘q
create or replace function public.test_seed_order_gate() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.product_id is not null and exists (
    select 1 from public.seller_products p where p.id = new.product_id and p.seed_batch is not null) then
    raise exception 'test_seed: Hozircha buyurtma qabul qilinmaydi';
  end if;
  return new;
end $$;
revoke all on function public.test_seed_order_gate() from public, anon, authenticated;
drop trigger if exists seller_order_items_test_seed_gate on public.seller_order_items;
create trigger seller_order_items_test_seed_gate before insert or update of product_id on public.seller_order_items
  for each row execute function public.test_seed_order_gate();

create or replace function public.test_seed_registration_gate() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.seminars s where s.id = new.seminar_id and s.seed_batch is not null) then
    raise exception 'test_seed: Hozircha ro‘yxatdan o‘tish yopiq';
  end if;
  return new;
end $$;
revoke all on function public.test_seed_registration_gate() from public, anon, authenticated;
drop trigger if exists registrations_test_seed_gate on public.registrations;
create trigger registrations_test_seed_gate before insert on public.registrations
  for each row execute function public.test_seed_registration_gate();

create or replace function public.test_seed_enroll_gate() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.courses c where c.id = new.course_id and c.seed_batch is not null) then
    raise exception 'test_seed: Hozircha kursga yozilish yopiq';
  end if;
  return new;
end $$;
revoke all on function public.test_seed_enroll_gate() from public, anon, authenticated;
drop trigger if exists course_enrollments_test_seed_gate on public.course_enrollments;
create trigger course_enrollments_test_seed_gate before insert on public.course_enrollments
  for each row execute function public.test_seed_enroll_gate();

-- 3) Sinov hisoblari (parolsiz; email domeni .invalid)
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data,
                        confirmation_token, recovery_token, email_change_token_new, email_change, created_at, updated_at)
select v.id, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', v.email, '',
       '{"provider":"email","providers":["email"]}'::jsonb, v.meta, '', '', '', '', now(), now()
from (values
${users}
) as v(id, email, meta)
on conflict (id) do nothing;

-- handle_new_user ishlamagan bo‘lsa ham profil bo‘lsin
insert into public.profiles (id, role, name, email)
select u.id, 'customer', coalesce(u.raw_user_meta_data->>'name', ''), u.email
  from auth.users u where u.id::text like '${TEST_ID_PREFIX}a000-%'
on conflict (id) do nothing;

${profileUpdates}

-- 4a) Mahsulotlar: Marketplace + Forma + Jihozlar
insert into public.seller_products (id, seller_id, name, sku, category, brand, price, stock, image_url, images, variants,
                                    description, unit, country, specs, forma, jihoz, status, uom, min_qty, seed_batch)
select v.id, v.seller_id, v.name, v.sku, v.category, v.brand, v.price, v.stock, v.image_url, v.images, v.variants,
       v.description, v.unit, v.country, v.specs, v.forma, v.jihoz, 'active', 'dona', 1, ${B}
from (values
${productRows}
) as v(id, seller_id, name, sku, category, brand, price, stock, image_url, images, variants, description, unit, country, specs, forma, jihoz)
on conflict (id) do update set
  name = excluded.name, sku = excluded.sku, category = excluded.category, brand = excluded.brand, price = excluded.price,
  stock = excluded.stock, image_url = excluded.image_url, images = excluded.images, variants = excluded.variants,
  description = excluded.description, unit = excluded.unit, country = excluded.country, specs = excluded.specs,
  forma = excluded.forma, jihoz = excluded.jihoz, status = 'active', updated_at = now()
  where public.seller_products.seed_batch = ${B};

-- 4b) Aksiyalar (sinxron trigger catalog_items 'deal' qatorini yaratadi)
alter table public.seller_promotions disable trigger seller_promotions_a_guard;
insert into public.seller_promotions (id, seller_id, product_id, old_price, price, title, scope, starts_on, ends_on, active, seed_batch)
select v.id, v.seller_id, v.product_id, v.old_price, v.price, v.title, 'product', public.tashkent_today(), public.tashkent_today() + 45, true, ${B}
from (values
${promoRows}
) as v(id, seller_id, product_id, old_price, price, title)
on conflict (id) do update set
  old_price = excluded.old_price, price = excluded.price, title = excluded.title,
  starts_on = excluded.starts_on, ends_on = excluded.ends_on, active = true, updated_at = now()
  where public.seller_promotions.seed_batch = ${B};
alter table public.seller_promotions enable trigger seller_promotions_a_guard;
update public.catalog_items set seed_batch = ${B}
 where kind = 'deal' and id like 'sp-${TEST_ID_PREFIX}d000-%' and owner_id::text like '${TEST_ID_PREFIX}a000-%';

-- 4c) Seminarlar + chiptalar (moderatsiyadan o‘tgan holatda)
select set_config('stomahub.trusted', 'on', true);
insert into public.seminars (id, organizer_id, title, speaker, date_label, city, format, days, seats, status, badge, image, topic,
                             about, category, tags, cover, start_date, start_time, end_date, end_time, place, address, template,
                             speakers, contact_phone, contact_telegram, sort_at, published, hidden, hidden_reason, moderated_at, seed_batch)
select v.id, v.organizer_id, v.title, v.speaker, v.date_label, v.city, v.format, v.days, v.seats, v.status, v.badge, v.image, v.topic,
       v.about, v.category, v.tags, v.cover, v.start_date, v.start_time, v.end_date, v.end_time, v.place, v.address, v.template,
       v.speakers, v.contact_phone, v.contact_telegram, v.sort_at, true, false, '', now(), ${B}
from (values
${seminarRows}
) as v(id, organizer_id, title, speaker, date_label, city, format, days, seats, status, badge, image, topic, about, category, tags, cover,
       start_date, start_time, end_date, end_time, place, address, template, speakers, contact_phone, contact_telegram, sort_at)
on conflict (id) do update set
  title = excluded.title, speaker = excluded.speaker, date_label = excluded.date_label, city = excluded.city, seats = excluded.seats,
  status = excluded.status, badge = excluded.badge, image = excluded.image, topic = excluded.topic, about = excluded.about,
  tags = excluded.tags, cover = excluded.cover, start_date = excluded.start_date, end_date = excluded.end_date,
  place = excluded.place, address = excluded.address, speakers = excluded.speakers, published = true, hidden = false, updated_at = now()
  where public.seminars.seed_batch = ${B};

insert into public.tickets (id, seminar_id, organizer_id, name, price, seats, sort_at, active, seed_batch)
select v.id, v.seminar_id, v.organizer_id, v.name, v.price, v.seats, v.sort_at, true, ${B}
from (values
${ticketRows}
) as v(id, seminar_id, organizer_id, name, price, seats, sort_at)
on conflict (id) do update set name = excluded.name, price = excluded.price, seats = excluded.seats, active = true
  where public.tickets.seed_batch = ${B};

-- 4d) Ta’lim kurslari (videosiz tuzilma)
insert into public.courses (id, author_id, title, description, direction, level, format, price, cover_url, status, published_at, seed_batch)
select v.id, v.author_id, v.title, v.description, v.direction, v.level, v.format, v.price, v.cover_url, 'published', now(), ${B}
from (values
${courseRows}
) as v(id, author_id, title, description, direction, level, format, price, cover_url)
on conflict (id) do update set title = excluded.title, description = excluded.description, direction = excluded.direction,
  level = excluded.level, cover_url = excluded.cover_url, status = 'published', updated_at = now()
  where public.courses.seed_batch = ${B};

insert into public.course_lessons (id, course_id, position, title, module_title, seed_batch)
select v.id, v.course_id, v.position, v.title, v.module_title, ${B}
from (values
${lessonRows}
) as v(id, course_id, position, title, module_title)
on conflict (id) do update set title = excluded.title, module_title = excluded.module_title
  where public.course_lessons.seed_batch = ${B};

-- 4e) Katalog: Ustalar, Mutaxassislar, E’lonlar, Vakansiyalar, Kitoblar, Ortiqcha material
alter table public.catalog_items disable trigger catalog_items_ad_guard;
alter table public.catalog_items disable trigger catalog_items_surplus_guard;
alter table public.catalog_items disable trigger catalog_items_job_guard;
insert into public.catalog_items (kind, id, payload, sort_at, owner_id, hidden, hidden_reason, status, is_demo, seed_batch, updated_at)
select v.kind, v.id, v.payload, v.sort_at, v.owner_id, false, '', 'active', false, ${B}, now()
from (values
${catalogRows}
) as v(kind, id, payload, sort_at, owner_id)
on conflict (kind, id) do update set payload = excluded.payload, sort_at = excluded.sort_at, owner_id = excluded.owner_id,
  hidden = false, hidden_reason = '', status = 'active', updated_at = now()
  where public.catalog_items.seed_batch = ${B};
alter table public.catalog_items enable trigger catalog_items_ad_guard;
alter table public.catalog_items enable trigger catalog_items_surplus_guard;
alter table public.catalog_items enable trigger catalog_items_job_guard;

commit;

notify pgrst, 'reload schema';

-- Tekshiruv:
-- select 'products' t, category, count(*) from public.seller_products where seed_batch = ${B} group by category
-- union all select 'catalog', kind, count(*) from public.catalog_items where seed_batch = ${B} group by kind
-- union all select 'seminars', '', count(*) from public.seminars where seed_batch = ${B}
-- union all select 'courses', '', count(*) from public.courses where seed_batch = ${B}
-- union all select 'promos', '', count(*) from public.seller_promotions where seed_batch = ${B};
`

const cleanup = `-- 0076 SINOV (test) MA’LUMOTLARINI O‘CHIRISH — 0075_test_seed.sql ni to‘liq bekor qiladi.
-- QO‘LDA QO‘LLANADI — faqat Ibrohim roziligi bilan. Qayta ishga tushirish xavfsiz.
-- Generatsiya: node scripts/test-seed/build-sql.mjs. Qo‘lda tahrirlamang.
-- Faqat seed_batch = '${BATCH}' qatorlar va id’si '${TEST_ID_PREFIX}a000-' bilan boshlanadigan 9 ta sinov hisobi o‘chadi.
-- seed_batch IS NULL qatorlarga (haqiqiy mahsulotlar, StomaHub Market, #STH-00025 / #STH-00029) tegilmaydi.
-- Himoya triggerlari (seed_batch_guard, test_seed_*_gate) va seed_batch ustunlari qoladi — zararsiz, keyingi sinovda kerak.

begin;

-- Aksiyalar avval (sinxron trigger 'deal' qatorlarini o‘zi o‘chiradi)
delete from public.seller_promotions where seed_batch = ${B};
delete from public.catalog_items where seed_batch = ${B};
delete from public.catalog_items where kind = 'deal' and id like 'sp-${TEST_ID_PREFIX}d000-%';
delete from public.tickets where seed_batch = ${B};
delete from public.seminars where seed_batch = ${B};
delete from public.course_lessons where seed_batch = ${B};
delete from public.courses where seed_batch = ${B};
-- Sinov mahsulotlariga buyurtma bo‘lmaydi (0075 gate), lekin baribir: buyurtma qatori bo‘lsa mahsulot o‘chmaydi
delete from public.seller_products sp where sp.seed_batch = ${B}
  and not exists (select 1 from public.seller_order_items oi where oi.product_id = sp.id);

-- Sinov hisoblari: profil auth.users dan cascade bilan o‘chadi
delete from auth.users u
 where u.id::text like '${TEST_ID_PREFIX}a000-%'
   and u.email like 'seed-%@test.stomahub.invalid'
   and exists (select 1 from public.profiles p where p.id = u.id and p.seed_batch = ${B})
   and not exists (select 1 from public.seller_order_items oi where oi.seller_id = u.id)
   and not exists (select 1 from public.seller_orders o where o.buyer_id = u.id);
delete from public.profiles where seed_batch = ${B} and id::text like '${TEST_ID_PREFIX}a000-%';

commit;

notify pgrst, 'reload schema';

-- Tekshiruv (hammasi 0 bo‘lishi kerak):
-- select (select count(*) from public.catalog_items where seed_batch = ${B}) catalog,
--        (select count(*) from public.seller_products where seed_batch = ${B}) products,
--        (select count(*) from public.seminars where seed_batch = ${B}) seminars,
--        (select count(*) from public.courses where seed_batch = ${B}) courses,
--        (select count(*) from public.profiles where seed_batch = ${B}) profiles;
`

writeFileSync(new URL('../../supabase/migrations/0075_test_seed.sql', import.meta.url), seed)
writeFileSync(new URL('../../supabase/migrations/0076_test_seed_cleanup.sql', import.meta.url), cleanup)
console.log('ok', COUNTS, kindCounts)
