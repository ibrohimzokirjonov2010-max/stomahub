-- 0075 SINOV (test) MA’LUMOTLARI — barcha bo‘limlar uchun, hammaga ko‘rinadi, keyin o‘chiriladi.
-- QO‘LDA QO‘LLANADI — faqat Ibrohim roziligi bilan. Idempotent (qayta ishga tushirsa bo‘ladi).
-- Generatsiya: node scripts/test-seed/build-sql.mjs (manba: scripts/test-seed/data.mjs). Qo‘lda tahrirlamang.
-- O‘chirish: 0076_test_seed_cleanup.sql (faqat seed_batch = 'test-2026-11' qatorlar va 9 ta sinov hisobi).
--
-- Nega is_test emas: 0037 da is_test = «hammadan yashirin» (market_products, seminars_public filtrlaydi).
-- Bu ma’lumot esa KO‘RINISHI kerak, shuning uchun alohida seed_batch text ustuni qo‘shiladi.
--
-- Nima qiladi:
--   1) seed_batch ustuni: profiles, seller_products, seller_promotions, seminars, tickets, courses, course_lessons, catalog_items (default null — haqiqiy qatorlar o‘zgarmaydi).
--      seed_batch_guard: admin/servis bo‘lmagan foydalanuvchi seed_batch ni qo‘ya/olib tashlay olmaydi.
--   2) Xavfsizlik (server): seed_batch li mahsulot — buyurtma (seller_order_items), seminar — ro‘yxatdan o‘tish
--      (registrations), kurs — yozilish (course_enrollments) RAD etiladi: «Hozircha buyurtma qabul qilinmaydi».
--   3) 9 ta sinov hisobi (auth.users): parolsiz, @test.stomahub.invalid — ularga kirib bo‘lmaydi.
--      handle_new_user profil yaratadi; keyin rol/do‘kon nomi/tasdiq (approved) qo‘yiladi.
--   4) Ma’lumotlar (5–10 tadan):
--     Marketplace (stomatologik): 10
--     Forma: 6
--     Jihozlar: 6
--     Aksiyalar: 6
--     Seminarlar: 5
--     Ta’lim kurslari: 5
--     Ustalar: 6
--     Mutaxassislar: 6
--     E’lonlar: 6
--     Vakansiyalar: 6
--     Kitoblar: 5
--     Ortiqcha material: 5
--     Sinov foydalanuvchilari: 9
--      catalog_items: master=6, doctor=6, ad=6, job=6, book=5, surplus=5 (egasi — sinov hisoblari).
--   Telefonlar +998 90 000 00 NN (ulanmaydi), Telegram bo‘sh. Rasmlar — saytning o‘z /images fayllari.
--   ad_guard, surplus_guard, job_guard, seller_promotions_a_guard triggerlari faqat shu tranzaksiya ichida o‘chiriladi
--   (SQL Editor’da auth.uid() yo‘q). Qatorlar ular yozadigan shaklda (status/hidden/payload) beriladi.
--   StomaHub Market mahsulotlari, #STH-00025 / #STH-00029 buyurtmalari va boshqa haqiqiy qatorlarga tegilmaydi:
--   har bir upsert faqat seed_batch = 'test-2026-11' qatorni yangilaydi.

begin;

-- 1) seed_batch ustunlari
alter table public.profiles add column if not exists seed_batch text;
create index if not exists profiles_seed_batch_idx on public.profiles (seed_batch) where seed_batch is not null;
alter table public.seller_products add column if not exists seed_batch text;
create index if not exists seller_products_seed_batch_idx on public.seller_products (seed_batch) where seed_batch is not null;
alter table public.seller_promotions add column if not exists seed_batch text;
create index if not exists seller_promotions_seed_batch_idx on public.seller_promotions (seed_batch) where seed_batch is not null;
alter table public.seminars add column if not exists seed_batch text;
create index if not exists seminars_seed_batch_idx on public.seminars (seed_batch) where seed_batch is not null;
alter table public.tickets add column if not exists seed_batch text;
create index if not exists tickets_seed_batch_idx on public.tickets (seed_batch) where seed_batch is not null;
alter table public.courses add column if not exists seed_batch text;
create index if not exists courses_seed_batch_idx on public.courses (seed_batch) where seed_batch is not null;
alter table public.course_lessons add column if not exists seed_batch text;
create index if not exists course_lessons_seed_batch_idx on public.course_lessons (seed_batch) where seed_batch is not null;
alter table public.catalog_items add column if not exists seed_batch text;
create index if not exists catalog_items_seed_batch_idx on public.catalog_items (seed_batch) where seed_batch is not null;
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
drop trigger if exists profiles_seed_batch_guard on public.profiles;
create trigger profiles_seed_batch_guard before insert or update on public.profiles
  for each row execute function public.seed_batch_guard();
drop trigger if exists seller_products_seed_batch_guard on public.seller_products;
create trigger seller_products_seed_batch_guard before insert or update on public.seller_products
  for each row execute function public.seed_batch_guard();
drop trigger if exists seller_promotions_seed_batch_guard on public.seller_promotions;
create trigger seller_promotions_seed_batch_guard before insert or update on public.seller_promotions
  for each row execute function public.seed_batch_guard();
drop trigger if exists seminars_seed_batch_guard on public.seminars;
create trigger seminars_seed_batch_guard before insert or update on public.seminars
  for each row execute function public.seed_batch_guard();
drop trigger if exists tickets_seed_batch_guard on public.tickets;
create trigger tickets_seed_batch_guard before insert or update on public.tickets
  for each row execute function public.seed_batch_guard();
drop trigger if exists courses_seed_batch_guard on public.courses;
create trigger courses_seed_batch_guard before insert or update on public.courses
  for each row execute function public.seed_batch_guard();
drop trigger if exists course_lessons_seed_batch_guard on public.course_lessons;
create trigger course_lessons_seed_batch_guard before insert or update on public.course_lessons
  for each row execute function public.seed_batch_guard();
drop trigger if exists catalog_items_seed_batch_guard on public.catalog_items;
create trigger catalog_items_seed_batch_guard before insert or update on public.catalog_items
  for each row execute function public.seed_batch_guard();

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
  ('7e57d000-0000-4000-a000-000000000001'::uuid, $ts$seed-01@test.stomahub.invalid$ts$, $ts${"name":"DentaLine Savdo","role":"customer","test_seed":"test-2026-11"}$ts$::jsonb),
  ('7e57d000-0000-4000-a000-000000000002'::uuid, $ts$seed-02@test.stomahub.invalid$ts$, $ts${"name":"Oq Tabassum Market","role":"customer","test_seed":"test-2026-11"}$ts$::jsonb),
  ('7e57d000-0000-4000-a000-000000000003'::uuid, $ts$seed-03@test.stomahub.invalid$ts$, $ts${"name":"MedLibos Atelye","role":"customer","test_seed":"test-2026-11"}$ts$::jsonb),
  ('7e57d000-0000-4000-a000-000000000004'::uuid, $ts$seed-04@test.stomahub.invalid$ts$, $ts${"name":"TexnoDent Uskuna","role":"customer","test_seed":"test-2026-11"}$ts$::jsonb),
  ('7e57d000-0000-4000-a000-000000000005'::uuid, $ts$seed-05@test.stomahub.invalid$ts$, $ts${"name":"Smile Akademiya","role":"organizer","test_seed":"test-2026-11"}$ts$::jsonb),
  ('7e57d000-0000-4000-a000-000000000006'::uuid, $ts$seed-06@test.stomahub.invalid$ts$, $ts${"name":"Servis Usta Markazi","role":"customer","test_seed":"test-2026-11"}$ts$::jsonb),
  ('7e57d000-0000-4000-a000-000000000007'::uuid, $ts$seed-07@test.stomahub.invalid$ts$, $ts${"name":"Dr. Sanjar Olimov","role":"customer","test_seed":"test-2026-11"}$ts$::jsonb),
  ('7e57d000-0000-4000-a000-000000000008'::uuid, $ts$seed-08@test.stomahub.invalid$ts$, $ts${"name":"Nur Dental Klinikasi","role":"customer","test_seed":"test-2026-11"}$ts$::jsonb),
  ('7e57d000-0000-4000-a000-000000000009'::uuid, $ts$seed-09@test.stomahub.invalid$ts$, $ts${"name":"Ilm Kitob Do‘koni","role":"customer","test_seed":"test-2026-11"}$ts$::jsonb)
) as v(id, email, meta)
on conflict (id) do nothing;

-- handle_new_user ishlamagan bo‘lsa ham profil bo‘lsin
insert into public.profiles (id, role, name, email)
select u.id, 'customer', coalesce(u.raw_user_meta_data->>'name', ''), u.email
  from auth.users u where u.id::text like '7e57d000-0000-4000-a000-%'
on conflict (id) do nothing;

update public.profiles set
    name = $ts$DentaLine Savdo$ts$, shop_name = $ts$DentaLine Savdo$ts$, city = $ts$Toshkent$ts$, specialty = $ts$$ts$,
    role = $ts$seller$ts$, seller_status = $ts$approved$ts$, seller_type = $ts$stomatologik$ts$,
    org_status = $ts$none$ts$, blocked = false, is_test = false, seed_batch = $ts$test-2026-11$ts$, updated_at = now()
  where id = '7e57d000-0000-4000-a000-000000000001'::uuid;
update public.profiles set
    name = $ts$Oq Tabassum Market$ts$, shop_name = $ts$Oq Tabassum Market$ts$, city = $ts$Samarqand$ts$, specialty = $ts$$ts$,
    role = $ts$seller$ts$, seller_status = $ts$approved$ts$, seller_type = $ts$stomatologik$ts$,
    org_status = $ts$none$ts$, blocked = false, is_test = false, seed_batch = $ts$test-2026-11$ts$, updated_at = now()
  where id = '7e57d000-0000-4000-a000-000000000002'::uuid;
update public.profiles set
    name = $ts$MedLibos Atelye$ts$, shop_name = $ts$MedLibos Atelye$ts$, city = $ts$Toshkent$ts$, specialty = $ts$$ts$,
    role = $ts$seller$ts$, seller_status = $ts$approved$ts$, seller_type = $ts$forma$ts$,
    org_status = $ts$none$ts$, blocked = false, is_test = false, seed_batch = $ts$test-2026-11$ts$, updated_at = now()
  where id = '7e57d000-0000-4000-a000-000000000003'::uuid;
update public.profiles set
    name = $ts$TexnoDent Uskuna$ts$, shop_name = $ts$TexnoDent Uskuna$ts$, city = $ts$Toshkent$ts$, specialty = $ts$$ts$,
    role = $ts$seller$ts$, seller_status = $ts$approved$ts$, seller_type = $ts$jihozlar$ts$,
    org_status = $ts$none$ts$, blocked = false, is_test = false, seed_batch = $ts$test-2026-11$ts$, updated_at = now()
  where id = '7e57d000-0000-4000-a000-000000000004'::uuid;
update public.profiles set
    name = $ts$Smile Akademiya$ts$, shop_name = $ts$$ts$, city = $ts$Toshkent$ts$, specialty = $ts$O‘quv markazi$ts$,
    role = $ts$organizer$ts$, seller_status = $ts$none$ts$, seller_type = null,
    org_status = $ts$approved$ts$, blocked = false, is_test = false, seed_batch = $ts$test-2026-11$ts$, updated_at = now()
  where id = '7e57d000-0000-4000-a000-000000000005'::uuid;
update public.profiles set
    name = $ts$Servis Usta Markazi$ts$, shop_name = $ts$$ts$, city = $ts$Toshkent$ts$, specialty = $ts$$ts$,
    role = $ts$customer$ts$, seller_status = $ts$none$ts$, seller_type = null,
    org_status = $ts$none$ts$, blocked = false, is_test = false, seed_batch = $ts$test-2026-11$ts$, updated_at = now()
  where id = '7e57d000-0000-4000-a000-000000000006'::uuid;
update public.profiles set
    name = $ts$Dr. Sanjar Olimov$ts$, shop_name = $ts$$ts$, city = $ts$Toshkent$ts$, specialty = $ts$Implantolog$ts$,
    role = $ts$customer$ts$, seller_status = $ts$none$ts$, seller_type = null,
    org_status = $ts$none$ts$, blocked = false, is_test = false, seed_batch = $ts$test-2026-11$ts$, updated_at = now()
  where id = '7e57d000-0000-4000-a000-000000000007'::uuid;
update public.profiles set
    name = $ts$Nur Dental Klinikasi$ts$, shop_name = $ts$$ts$, city = $ts$Toshkent$ts$, specialty = $ts$$ts$,
    role = $ts$customer$ts$, seller_status = $ts$none$ts$, seller_type = null,
    org_status = $ts$none$ts$, blocked = false, is_test = false, seed_batch = $ts$test-2026-11$ts$, updated_at = now()
  where id = '7e57d000-0000-4000-a000-000000000008'::uuid;
update public.profiles set
    name = $ts$Ilm Kitob Do‘koni$ts$, shop_name = $ts$$ts$, city = $ts$Toshkent$ts$, specialty = $ts$$ts$,
    role = $ts$customer$ts$, seller_status = $ts$none$ts$, seller_type = null,
    org_status = $ts$none$ts$, blocked = false, is_test = false, seed_batch = $ts$test-2026-11$ts$, updated_at = now()
  where id = '7e57d000-0000-4000-a000-000000000009'::uuid;

-- 4a) Mahsulotlar: Marketplace + Forma + Jihozlar
insert into public.seller_products (id, seller_id, name, sku, category, brand, price, stock, image_url, images, variants,
                                    description, unit, country, specs, forma, jihoz, status, uom, min_qty, seed_batch)
select v.id, v.seller_id, v.name, v.sku, v.category, v.brand, v.price, v.stock, v.image_url, v.images, v.variants,
       v.description, v.unit, v.country, v.specs, v.forma, v.jihoz, 'active', 'dona', 1, $ts$test-2026-11$ts$
from (values
  ('7e57d000-0000-4000-b000-000000000001'::uuid, '7e57d000-0000-4000-a000-000000000001'::uuid, $ts$Filtek Z250 kompozit, A2 (4 g)$ts$, $ts$TS-001$ts$, $ts$Restavratsion materiallar$ts$, $ts$3M$ts$, 285000, 40, $ts$/images/market/p1.jpg$ts$, $ts$["/images/market/p1.jpg"]$ts$::jsonb, $ts$[]$ts$::jsonb, $ts$Mikrogibrid universal kompozit. Old va orqa tishlar restavratsiyasi uchun, yaxshi pardozlanadi.$ts$, $ts$4 g shprits$ts$, $ts$AQSh$ts$, $ts$[["Rang","A2"],["Hajm","4 g"]]$ts$::jsonb, $ts${}$ts$::jsonb, $ts${}$ts$::jsonb),
  ('7e57d000-0000-4000-b000-000000000002'::uuid, '7e57d000-0000-4000-a000-000000000001'::uuid, $ts$Single Bond Universal adgeziv (5 ml)$ts$, $ts$TS-002$ts$, $ts$Yordamchi materiallar$ts$, $ts$3M$ts$, 520000, 25, $ts$/images/market/p2.jpg$ts$, $ts$["/images/market/p2.jpg"]$ts$::jsonb, $ts$[]$ts$::jsonb, $ts$Universal adgeziv: total-etch, self-etch va selektiv emal etching usullari bilan ishlaydi.$ts$, $ts$5 ml flakon$ts$, $ts$AQSh$ts$, $ts$[["Hajm","5 ml"]]$ts$::jsonb, $ts${}$ts$::jsonb, $ts${}$ts$::jsonb),
  ('7e57d000-0000-4000-b000-000000000003'::uuid, '7e57d000-0000-4000-a000-000000000001'::uuid, $ts$Fuji IX GP shisha-ionomer sement$ts$, $ts$TS-003$ts$, $ts$Restavratsion materiallar$ts$, $ts$GC$ts$, 410000, 18, $ts$/images/market/p3.jpg$ts$, $ts$["/images/market/p3.jpg"]$ts$::jsonb, $ts$[]$ts$::jsonb, $ts$Kondensatsiyalanadigan shisha-ionomer: bolalar stomatologiyasi va vaqtinchalik restavratsiyalar uchun.$ts$, $ts$15 g + 6.4 ml$ts$, $ts$Yaponiya$ts$, $ts$[]$ts$::jsonb, $ts${}$ts$::jsonb, $ts${}$ts$::jsonb),
  ('7e57d000-0000-4000-b000-000000000004'::uuid, '7e57d000-0000-4000-a000-000000000001'::uuid, $ts$Tetric N-Ceram kompozit, A3 (3.5 g)$ts$, $ts$TS-004$ts$, $ts$Restavratsion materiallar$ts$, $ts$Ivoclar$ts$, 330000, 30, $ts$/images/market/p4.jpg$ts$, $ts$["/images/market/p4.jpg"]$ts$::jsonb, $ts$[]$ts$::jsonb, $ts$Nanogibrid kompozit, past cho‘kish va yuqori yaltiroqlik.$ts$, $ts$3.5 g shprits$ts$, $ts$Lixtenshteyn$ts$, $ts$[["Rang","A3"]]$ts$::jsonb, $ts${}$ts$::jsonb, $ts${}$ts$::jsonb),
  ('7e57d000-0000-4000-b000-000000000005'::uuid, '7e57d000-0000-4000-a000-000000000002'::uuid, $ts$ProTaper Gold fayllar F1–F3 (25 mm)$ts$, $ts$TS-005$ts$, $ts$Endodontik asboblar$ts$, $ts$Dentsply$ts$, 390000, 22, $ts$/images/market/p5.jpg$ts$, $ts$["/images/market/p5.jpg"]$ts$::jsonb, $ts$[]$ts$::jsonb, $ts$Mashina endodontiyasi uchun issiqlik bilan ishlangan NiTi fayllar. Egilgan kanallarda ham barqaror.$ts$, $ts$3 dona$ts$, $ts$Shveytsariya$ts$, $ts$[["Uzunlik","25 mm"]]$ts$::jsonb, $ts${}$ts$::jsonb, $ts${}$ts$::jsonb),
  ('7e57d000-0000-4000-b000-000000000006'::uuid, '7e57d000-0000-4000-a000-000000000002'::uuid, $ts$OptiBond Solo Plus (5 ml)$ts$, $ts$TS-006$ts$, $ts$Yordamchi materiallar$ts$, $ts$Kerr$ts$, 450000, 15, $ts$/images/market/p6.jpg$ts$, $ts$["/images/market/p6.jpg"]$ts$::jsonb, $ts$[]$ts$::jsonb, $ts$Bir komponentli, to‘ldirgichli adgeziv. Total-etch texnikasi uchun.$ts$, $ts$5 ml flakon$ts$, $ts$AQSh$ts$, $ts$[]$ts$::jsonb, $ts${}$ts$::jsonb, $ts${}$ts$::jsonb),
  ('7e57d000-0000-4000-b000-000000000007'::uuid, '7e57d000-0000-4000-a000-000000000002'::uuid, $ts$Clearfil SE Bond (2 komponentli)$ts$, $ts$TS-007$ts$, $ts$Yordamchi materiallar$ts$, $ts$Kuraray$ts$, 690000, 12, $ts$/images/market/p7.jpg$ts$, $ts$["/images/market/p7.jpg"]$ts$::jsonb, $ts$[]$ts$::jsonb, $ts$Self-etch adgeziv tizimi: dentinga mustahkam bog‘lanish va past sezuvchanlik.$ts$, $ts$Primer 6 ml + Bond 5 ml$ts$, $ts$Yaponiya$ts$, $ts$[]$ts$::jsonb, $ts${}$ts$::jsonb, $ts${}$ts$::jsonb),
  ('7e57d000-0000-4000-b000-000000000008'::uuid, '7e57d000-0000-4000-a000-000000000002'::uuid, $ts$Hydrorise Putty silikon qolip materiali$ts$, $ts$TS-008$ts$, $ts$Qolip (ottisk) materiallari$ts$, $ts$Zhermack$ts$, 380000, 20, $ts$/images/market/p8.jpg$ts$, $ts$["/images/market/p8.jpg"]$ts$::jsonb, $ts$[]$ts$::jsonb, $ts$A-silikon, aniq va barqaror ottisk. Ortopediya va implant ishlari uchun.$ts$, $ts$2 × 300 ml$ts$, $ts$Italiya$ts$, $ts$[]$ts$::jsonb, $ts${}$ts$::jsonb, $ts${}$ts$::jsonb),
  ('7e57d000-0000-4000-b000-000000000009'::uuid, '7e57d000-0000-4000-a000-000000000001'::uuid, $ts$Pana-Max turbinali uchlik$ts$, $ts$TS-009$ts$, $ts$Instrumentlar$ts$, $ts$NSK$ts$, 1850000, 6, $ts$/images/market/p9.jpg$ts$, $ts$["/images/market/p9.jpg"]$ts$::jsonb, $ts$[]$ts$::jsonb, $ts$Keramik podshipnikli turbinali uchlik, past shovqin, standart Borden ulagich.$ts$, $ts$1 dona$ts$, $ts$Yaponiya$ts$, $ts$[]$ts$::jsonb, $ts${}$ts$::jsonb, $ts${}$ts$::jsonb),
  ('7e57d000-0000-4000-b000-000000000010'::uuid, '7e57d000-0000-4000-a000-000000000002'::uuid, $ts$Gutta-percha shtiftlar ISO 25 (120 dona)$ts$, $ts$TS-010$ts$, $ts$Endodontik asboblar$ts$, $ts$Coltene$ts$, 95000, 50, $ts$/images/market/p10.jpg$ts$, $ts$["/images/market/p10.jpg"]$ts$::jsonb, $ts$[]$ts$::jsonb, $ts$Ildiz kanallarini plombalash uchun standart gutta-percha shtiftlar.$ts$, $ts$120 dona$ts$, $ts$Shveytsariya$ts$, $ts$[]$ts$::jsonb, $ts${}$ts$::jsonb, $ts${}$ts$::jsonb),
  ('7e57d000-0000-4000-b000-000000000021'::uuid, '7e57d000-0000-4000-a000-000000000003'::uuid, $ts$Skrab to‘plam Stretch (ayollar)$ts$, $ts$TS-21$ts$, $ts$Tibbiy forma$ts$, $ts$Cherokee$ts$, 390000, 0, $ts$/images/forma/woman-navy.jpg$ts$, $ts$["/images/forma/woman-navy.jpg"]$ts$::jsonb, $ts$[{"size":"S","color":"teal","price":390000,"stock":5,"sku":"TS-F21-teal-S"},{"size":"M","color":"teal","price":390000,"stock":5,"sku":"TS-F21-teal-M"},{"size":"L","color":"teal","price":390000,"stock":5,"sku":"TS-F21-teal-L"},{"size":"XL","color":"teal","price":390000,"stock":5,"sku":"TS-F21-teal-XL"},{"size":"S","color":"navy","price":390000,"stock":5,"sku":"TS-F21-navy-S"},{"size":"M","color":"navy","price":390000,"stock":5,"sku":"TS-F21-navy-M"},{"size":"L","color":"navy","price":390000,"stock":5,"sku":"TS-F21-navy-L"},{"size":"XL","color":"navy","price":390000,"stock":5,"sku":"TS-F21-navy-XL"},{"size":"S","color":"lilac","price":390000,"stock":5,"sku":"TS-F21-lilac-S"},{"size":"M","color":"lilac","price":390000,"stock":5,"sku":"TS-F21-lilac-M"},{"size":"L","color":"lilac","price":390000,"stock":5,"sku":"TS-F21-lilac-L"},{"size":"XL","color":"lilac","price":390000,"stock":5,"sku":"TS-F21-lilac-XL"}]$ts$::jsonb, $ts$Cho‘ziluvchan mato, 4 ta cho‘ntak, V-yoqa. Uzoq smenalarda qulay, 60°C da yuviladi.$ts$, $ts$1 dona$ts$, $ts$O‘zbekiston$ts$, $ts$[]$ts$::jsonb, $ts${"cat":"scrub","gender":"female","fabric":"stretch","size_type":"clothing","kashta_price":0}$ts$::jsonb, $ts${}$ts$::jsonb),
  ('7e57d000-0000-4000-b000-000000000022'::uuid, '7e57d000-0000-4000-a000-000000000003'::uuid, $ts$Skrab to‘plam Classic (erkaklar)$ts$, $ts$TS-22$ts$, $ts$Tibbiy forma$ts$, $ts$Dickies$ts$, 340000, 0, $ts$/images/forma/man-teal.jpg$ts$, $ts$["/images/forma/man-teal.jpg"]$ts$::jsonb, $ts$[{"size":"S","color":"teal","price":340000,"stock":5,"sku":"TS-F22-teal-S"},{"size":"M","color":"teal","price":340000,"stock":5,"sku":"TS-F22-teal-M"},{"size":"L","color":"teal","price":340000,"stock":5,"sku":"TS-F22-teal-L"},{"size":"XL","color":"teal","price":340000,"stock":5,"sku":"TS-F22-teal-XL"},{"size":"S","color":"blue","price":340000,"stock":5,"sku":"TS-F22-blue-S"},{"size":"M","color":"blue","price":340000,"stock":5,"sku":"TS-F22-blue-M"},{"size":"L","color":"blue","price":340000,"stock":5,"sku":"TS-F22-blue-L"},{"size":"XL","color":"blue","price":340000,"stock":5,"sku":"TS-F22-blue-XL"},{"size":"S","color":"black","price":340000,"stock":5,"sku":"TS-F22-black-S"},{"size":"M","color":"black","price":340000,"stock":5,"sku":"TS-F22-black-M"},{"size":"L","color":"black","price":340000,"stock":5,"sku":"TS-F22-black-L"},{"size":"XL","color":"black","price":340000,"stock":5,"sku":"TS-F22-black-XL"}]$ts$::jsonb, $ts$Paxta-poliester aralashmasi, mustahkam tikuv, keng cho‘ntaklar.$ts$, $ts$1 dona$ts$, $ts$O‘zbekiston$ts$, $ts$[]$ts$::jsonb, $ts${"cat":"scrub","gender":"male","fabric":"cotton","size_type":"clothing","kashta_price":0}$ts$::jsonb, $ts${}$ts$::jsonb),
  ('7e57d000-0000-4000-b000-000000000023'::uuid, '7e57d000-0000-4000-a000-000000000003'::uuid, $ts$Tibbiy xalat Premium (uniseks)$ts$, $ts$TS-23$ts$, $ts$Tibbiy forma$ts$, $ts$HNL$ts$, 450000, 0, $ts$/images/forma/coat.jpg$ts$, $ts$["/images/forma/coat.jpg"]$ts$::jsonb, $ts$[{"size":"S","color":"white","price":450000,"stock":5,"sku":"TS-F23-white-S"},{"size":"M","color":"white","price":450000,"stock":5,"sku":"TS-F23-white-M"},{"size":"L","color":"white","price":450000,"stock":5,"sku":"TS-F23-white-L"},{"size":"XL","color":"white","price":450000,"stock":5,"sku":"TS-F23-white-XL"}]$ts$::jsonb, $ts$Uzun xalat, zich premium mato, ichki cho‘ntak. Klinika logosini tikish mumkin.$ts$, $ts$1 dona$ts$, $ts$O‘zbekiston$ts$, $ts$[]$ts$::jsonb, $ts${"cat":"coat","gender":"uni","fabric":"premium","size_type":"clothing","kashta_price":0}$ts$::jsonb, $ts${}$ts$::jsonb),
  ('7e57d000-0000-4000-b000-000000000024'::uuid, '7e57d000-0000-4000-a000-000000000003'::uuid, $ts$Tibbiy qalpoq (paxta)$ts$, $ts$TS-24$ts$, $ts$Tibbiy forma$ts$, $ts$Mediform$ts$, 65000, 0, $ts$/images/forma/cap.jpg$ts$, $ts$["/images/forma/cap.jpg"]$ts$::jsonb, $ts$[{"size":"Universal","color":"teal","price":65000,"stock":5,"sku":"TS-F24-teal-Universal"},{"size":"Universal","color":"navy","price":65000,"stock":5,"sku":"TS-F24-navy-Universal"},{"size":"Universal","color":"wine","price":65000,"stock":5,"sku":"TS-F24-wine-Universal"}]$ts$::jsonb, $ts$Bog‘ichli paxta qalpoq, o‘lchamga moslashadi.$ts$, $ts$1 dona$ts$, $ts$O‘zbekiston$ts$, $ts$[]$ts$::jsonb, $ts${"cat":"cap","gender":"uni","fabric":"cotton","size_type":"one","kashta_price":0}$ts$::jsonb, $ts${}$ts$::jsonb),
  ('7e57d000-0000-4000-b000-000000000025'::uuid, '7e57d000-0000-4000-a000-000000000003'::uuid, $ts$Tibbiy poyabzal (klog)$ts$, $ts$TS-25$ts$, $ts$Tibbiy forma$ts$, $ts$Crocs$ts$, 280000, 0, $ts$/images/forma/clogs.jpg$ts$, $ts$["/images/forma/clogs.jpg"]$ts$::jsonb, $ts$[{"size":"37","color":"white","price":280000,"stock":5,"sku":"TS-F25-white-37"},{"size":"38","color":"white","price":280000,"stock":5,"sku":"TS-F25-white-38"},{"size":"39","color":"white","price":280000,"stock":5,"sku":"TS-F25-white-39"},{"size":"40","color":"white","price":280000,"stock":5,"sku":"TS-F25-white-40"},{"size":"41","color":"white","price":280000,"stock":5,"sku":"TS-F25-white-41"},{"size":"42","color":"white","price":280000,"stock":5,"sku":"TS-F25-white-42"},{"size":"37","color":"navy","price":280000,"stock":5,"sku":"TS-F25-navy-37"},{"size":"38","color":"navy","price":280000,"stock":5,"sku":"TS-F25-navy-38"},{"size":"39","color":"navy","price":280000,"stock":5,"sku":"TS-F25-navy-39"},{"size":"40","color":"navy","price":280000,"stock":5,"sku":"TS-F25-navy-40"},{"size":"41","color":"navy","price":280000,"stock":5,"sku":"TS-F25-navy-41"},{"size":"42","color":"navy","price":280000,"stock":5,"sku":"TS-F25-navy-42"}]$ts$::jsonb, $ts$Yengil, sirpanmaydigan taglik, oyoq terlamaydi.$ts$, $ts$1 dona$ts$, $ts$O‘zbekiston$ts$, $ts$[]$ts$::jsonb, $ts${"cat":"shoe","gender":"uni","fabric":"premium","size_type":"shoe","kashta_price":0}$ts$::jsonb, $ts${}$ts$::jsonb),
  ('7e57d000-0000-4000-b000-000000000026'::uuid, '7e57d000-0000-4000-a000-000000000003'::uuid, $ts$Himoya fartugi (suv o‘tkazmaydi)$ts$, $ts$TS-26$ts$, $ts$Tibbiy forma$ts$, $ts$Labwear$ts$, 120000, 0, $ts$/images/forma/apron.jpg$ts$, $ts$["/images/forma/apron.jpg"]$ts$::jsonb, $ts$[{"size":"Universal","color":"navy","price":120000,"stock":5,"sku":"TS-F26-navy-Universal"},{"size":"Universal","color":"black","price":120000,"stock":5,"sku":"TS-F26-black-Universal"}]$ts$::jsonb, $ts$Suv o‘tkazmaydigan fartuk, sterilizatsiya va laboratoriya ishlari uchun.$ts$, $ts$1 dona$ts$, $ts$O‘zbekiston$ts$, $ts$[]$ts$::jsonb, $ts${"cat":"apron","gender":"uni","fabric":"anti","size_type":"clothing","kashta_price":0}$ts$::jsonb, $ts${}$ts$::jsonb),
  ('7e57d000-0000-4000-b000-000000000041'::uuid, '7e57d000-0000-4000-a000-000000000004'::uuid, $ts$Stomatologik ustanovka Intego$ts$, $ts$TS-41$ts$, $ts$Stomatologik jihozlar$ts$, $ts$Dentsply Sirona$ts$, 168000000, 2, $ts$/images/jihozlar/sirona.jpg$ts$, $ts$["/images/jihozlar/sirona.jpg"]$ts$::jsonb, $ts$[]$ts$::jsonb, $ts$Nemis sifatidagi ustanovka: LED chiroq, assistent bloki, 5 ta asbob joyi. O‘rnatish va trening narxga kiradi.$ts$, $ts$1 dona$ts$, $ts$$ts$, $ts$[]$ts$::jsonb, $ts${}$ts$::jsonb, $ts${"cat":"unit","model":"Intego Ambition","year":2025,"warranty":24,"city":"Toshkent","install":true}$ts$::jsonb),
  ('7e57d000-0000-4000-b000-000000000042'::uuid, '7e57d000-0000-4000-a000-000000000004'::uuid, $ts$Stomatologik ustanovka Estetica E50$ts$, $ts$TS-42$ts$, $ts$Stomatologik jihozlar$ts$, $ts$KaVo$ts$, 142000000, 2, $ts$/images/jihozlar/kavo.jpg$ts$, $ts$["/images/jihozlar/kavo.jpg"]$ts$::jsonb, $ts$[]$ts$::jsonb, $ts$Ergonomik ustanovka, integratsiyalangan mikromotor va skaler.$ts$, $ts$1 dona$ts$, $ts$$ts$, $ts$[]$ts$::jsonb, $ts${}$ts$::jsonb, $ts${"cat":"unit","model":"Estetica E50 Life","year":2025,"warranty":24,"city":"Toshkent","install":true}$ts$::jsonb),
  ('7e57d000-0000-4000-b000-000000000043'::uuid, '7e57d000-0000-4000-a000-000000000004'::uuid, $ts$Intraoral skaner TRIOS 3$ts$, $ts$TS-43$ts$, $ts$Stomatologik jihozlar$ts$, $ts$3Shape$ts$, 118000000, 2, $ts$/images/jihozlar/trios.jpg$ts$, $ts$["/images/jihozlar/trios.jpg"]$ts$::jsonb, $ts$[]$ts$::jsonb, $ts$Raqamli ottisk: tez skanerlash, rangli tasvir, CAD/CAM bilan ishlaydi.$ts$, $ts$1 dona$ts$, $ts$$ts$, $ts$[]$ts$::jsonb, $ts${}$ts$::jsonb, $ts${"cat":"scan","model":"TRIOS 3 Basic","year":2024,"warranty":12,"city":"Toshkent","install":true}$ts$::jsonb),
  ('7e57d000-0000-4000-b000-000000000044'::uuid, '7e57d000-0000-4000-a000-000000000004'::uuid, $ts$Avtoklav Vacuklav 23 B+$ts$, $ts$TS-44$ts$, $ts$Stomatologik jihozlar$ts$, $ts$Melag$ts$, 29500000, 2, $ts$/images/jihozlar/melag.jpg$ts$, $ts$["/images/jihozlar/melag.jpg"]$ts$::jsonb, $ts$[]$ts$::jsonb, $ts$B-sinf avtoklav, 23 litr, hujjatlashtirish funksiyasi bilan.$ts$, $ts$1 dona$ts$, $ts$$ts$, $ts$[]$ts$::jsonb, $ts${}$ts$::jsonb, $ts${"cat":"autoclave","model":"Vacuklav 23 B+","year":2025,"warranty":24,"city":"Toshkent","install":false}$ts$::jsonb),
  ('7e57d000-0000-4000-b000-000000000045'::uuid, '7e57d000-0000-4000-a000-000000000004'::uuid, $ts$Kompressor Turbo-Jet$ts$, $ts$TS-45$ts$, $ts$Stomatologik jihozlar$ts$, $ts$Cattani$ts$, 18500000, 2, $ts$/images/jihozlar/cattani.jpg$ts$, $ts$["/images/jihozlar/cattani.jpg"]$ts$::jsonb, $ts$[]$ts$::jsonb, $ts$Moysiz kompressor va aspirator, 1–2 ustanovka uchun.$ts$, $ts$1 dona$ts$, $ts$$ts$, $ts$[]$ts$::jsonb, $ts${}$ts$::jsonb, $ts${"cat":"compressor","model":"Turbo-Jet 1","year":2024,"warranty":12,"city":"Toshkent","install":true}$ts$::jsonb),
  ('7e57d000-0000-4000-b000-000000000046'::uuid, '7e57d000-0000-4000-a000-000000000004'::uuid, $ts$Polimerizatsiya lampasi Bluephase G4$ts$, $ts$TS-46$ts$, $ts$Stomatologik jihozlar$ts$, $ts$Ivoclar$ts$, 7400000, 2, $ts$/images/jihozlar/ivoclar.jpg$ts$, $ts$["/images/jihozlar/ivoclar.jpg"]$ts$::jsonb, $ts$[]$ts$::jsonb, $ts$Polywave LED lampa, avtomatik ekspozitsiya nazorati.$ts$, $ts$1 dona$ts$, $ts$$ts$, $ts$[]$ts$::jsonb, $ts${}$ts$::jsonb, $ts${"cat":"lamp","model":"Bluephase G4","year":2025,"warranty":24,"city":"Toshkent","install":false}$ts$::jsonb)
) as v(id, seller_id, name, sku, category, brand, price, stock, image_url, images, variants, description, unit, country, specs, forma, jihoz)
on conflict (id) do update set
  name = excluded.name, sku = excluded.sku, category = excluded.category, brand = excluded.brand, price = excluded.price,
  stock = excluded.stock, image_url = excluded.image_url, images = excluded.images, variants = excluded.variants,
  description = excluded.description, unit = excluded.unit, country = excluded.country, specs = excluded.specs,
  forma = excluded.forma, jihoz = excluded.jihoz, status = 'active', updated_at = now()
  where public.seller_products.seed_batch = $ts$test-2026-11$ts$;

-- 4b) Aksiyalar (sinxron trigger catalog_items 'deal' qatorini yaratadi)
alter table public.seller_promotions disable trigger seller_promotions_a_guard;
insert into public.seller_promotions (id, seller_id, product_id, old_price, price, title, scope, starts_on, ends_on, active, seed_batch)
select v.id, v.seller_id, v.product_id, v.old_price, v.price, v.title, 'product', public.tashkent_today(), public.tashkent_today() + 45, true, $ts$test-2026-11$ts$
from (values
  ('7e57d000-0000-4000-d000-000000000001'::uuid, '7e57d000-0000-4000-a000-000000000001'::uuid, '7e57d000-0000-4000-b000-000000000001'::uuid, 285000, 239000, $ts$Kompozitlar haftaligi$ts$),
  ('7e57d000-0000-4000-d000-000000000002'::uuid, '7e57d000-0000-4000-a000-000000000001'::uuid, '7e57d000-0000-4000-b000-000000000009'::uuid, 1850000, 1590000, $ts$NSK uchliklariga chegirma$ts$),
  ('7e57d000-0000-4000-d000-000000000003'::uuid, '7e57d000-0000-4000-a000-000000000002'::uuid, '7e57d000-0000-4000-b000-000000000005'::uuid, 390000, 329000, $ts$Endo to‘plam aksiyasi$ts$),
  ('7e57d000-0000-4000-d000-000000000004'::uuid, '7e57d000-0000-4000-a000-000000000002'::uuid, '7e57d000-0000-4000-b000-000000000008'::uuid, 380000, 315000, $ts$$ts$),
  ('7e57d000-0000-4000-d000-000000000005'::uuid, '7e57d000-0000-4000-a000-000000000003'::uuid, '7e57d000-0000-4000-b000-000000000021'::uuid, 390000, 330000, $ts$Yangi mavsum formalari$ts$),
  ('7e57d000-0000-4000-d000-000000000006'::uuid, '7e57d000-0000-4000-a000-000000000004'::uuid, '7e57d000-0000-4000-b000-000000000046'::uuid, 7400000, 6650000, $ts$Lampa + kafolat$ts$)
) as v(id, seller_id, product_id, old_price, price, title)
on conflict (id) do update set
  old_price = excluded.old_price, price = excluded.price, title = excluded.title,
  starts_on = excluded.starts_on, ends_on = excluded.ends_on, active = true, updated_at = now()
  where public.seller_promotions.seed_batch = $ts$test-2026-11$ts$;
alter table public.seller_promotions enable trigger seller_promotions_a_guard;
update public.catalog_items set seed_batch = $ts$test-2026-11$ts$
 where kind = 'deal' and id like 'sp-7e57d000-0000-4000-d000-%' and owner_id::text like '7e57d000-0000-4000-a000-%';

-- 4c) Seminarlar + chiptalar (moderatsiyadan o‘tgan holatda)
select set_config('stomahub.trusted', 'on', true);
insert into public.seminars (id, organizer_id, title, speaker, date_label, city, format, days, seats, status, badge, image, topic,
                             about, category, tags, cover, start_date, start_time, end_date, end_time, place, address, template,
                             speakers, contact_phone, contact_telegram, sort_at, published, hidden, hidden_reason, moderated_at, seed_batch)
select v.id, v.organizer_id, v.title, v.speaker, v.date_label, v.city, v.format, v.days, v.seats, v.status, v.badge, v.image, v.topic,
       v.about, v.category, v.tags, v.cover, v.start_date, v.start_time, v.end_date, v.end_time, v.place, v.address, v.template,
       v.speakers, v.contact_phone, v.contact_telegram, v.sort_at, true, false, '', now(), $ts$test-2026-11$ts$
from (values
  ($ts$7e57d000-0000-4000-e000-000000000001$ts$, '7e57d000-0000-4000-a000-000000000005'::uuid, $ts$Zamonaviy implantologiya: rejalashtirishdan protezgacha$ts$, $ts$Dr. Sanjar Olimov$ts$, $ts$12-dekabr 2026$ts$, $ts$Toshkent$ts$, $ts$Oflayn$ts$, $ts$1 kunlik seminar$ts$, 30, $ts$rejalashtirilgan$ts$, $ts$Rejalashtirilgan$ts$, $ts$/images/seminars/surgery.jpg$ts$, $ts$Implantologiya$ts$, $ts$Implant joylashuvini CBCT bo‘yicha rejalashtirish, jarrohlik shabloni va bir bosqichli protokollar. Amaliy qism — modellarda.$ts$, $ts$Tibbiy amaliy seminar$ts$, array[$ts$Implantologiya$ts$]::text[], $ts$/images/seminars/surgery.jpg$ts$, $ts$2026-12-12$ts$, $ts$10:00$ts$, $ts$2026-12-12$ts$, $ts$17:00$ts$, $ts$Smile Akademiya, 2-zal$ts$, $ts$Smile Akademiya, 2-zal$ts$, $ts$teal$ts$, $ts$[{"id":"sp-1","name":"Dr. Sanjar Olimov","role":"Implantologiya","bio":"","city":"Toshkent","avatar":"","links":[]}]$ts$::jsonb, $ts$900000005$ts$, $ts$$ts$, 1),
  ($ts$7e57d000-0000-4000-e000-000000000002$ts$, '7e57d000-0000-4000-a000-000000000005'::uuid, $ts$Mikroskop ostida endodontiya$ts$, $ts$Dr. Lola Hamidova$ts$, $ts$19-dekabr 2026$ts$, $ts$Toshkent$ts$, $ts$Oflayn$ts$, $ts$1 kunlik seminar$ts$, 30, $ts$rejalashtirilgan$ts$, $ts$Rejalashtirilgan$ts$, $ts$/images/seminars/micro.jpg$ts$, $ts$Endodontiya$ts$, $ts$MB2 kanalni topish, qayta davolash va perforatsiyalarni yopish. Har bir ishtirokchiga mikroskop.$ts$, $ts$Tibbiy amaliy seminar$ts$, array[$ts$Endodontiya$ts$]::text[], $ts$/images/seminars/micro.jpg$ts$, $ts$2026-12-19$ts$, $ts$10:00$ts$, $ts$2026-12-19$ts$, $ts$17:00$ts$, $ts$Smile Akademiya, 1-zal$ts$, $ts$Smile Akademiya, 1-zal$ts$, $ts$teal$ts$, $ts$[{"id":"sp-2","name":"Dr. Lola Hamidova","role":"Endodontiya","bio":"","city":"Toshkent","avatar":"","links":[]}]$ts$::jsonb, $ts$900000005$ts$, $ts$$ts$, 2),
  ($ts$7e57d000-0000-4000-e000-000000000003$ts$, '7e57d000-0000-4000-a000-000000000005'::uuid, $ts$Estetik restavratsiya: qatlamli usul$ts$, $ts$Dr. Kamron Yusufov$ts$, $ts$16-yanvar 2027$ts$, $ts$Samarqand$ts$, $ts$Oflayn$ts$, $ts$1 kunlik seminar$ts$, 30, $ts$rejalashtirilgan$ts$, $ts$Rejalashtirilgan$ts$, $ts$/images/seminars/smile.jpg$ts$, $ts$Terapiya$ts$, $ts$Rang tanlash, qatlamlab kompozit qo‘yish va pardozlash. Old tishlar bo‘yicha amaliy mashg‘ulot.$ts$, $ts$Tibbiy amaliy seminar$ts$, array[$ts$Terapiya$ts$]::text[], $ts$/images/seminars/smile.jpg$ts$, $ts$2027-01-16$ts$, $ts$10:00$ts$, $ts$2027-01-16$ts$, $ts$17:00$ts$, $ts$Registon Hotel konferens-zali$ts$, $ts$Registon Hotel konferens-zali$ts$, $ts$teal$ts$, $ts$[{"id":"sp-3","name":"Dr. Kamron Yusufov","role":"Terapiya","bio":"","city":"Samarqand","avatar":"","links":[]}]$ts$::jsonb, $ts$900000005$ts$, $ts$$ts$, 3),
  ($ts$7e57d000-0000-4000-e000-000000000004$ts$, '7e57d000-0000-4000-a000-000000000005'::uuid, $ts$Aligner terapiyasi asoslari$ts$, $ts$Dr. Nigora Aminova$ts$, $ts$23-yanvar 2027$ts$, $ts$Toshkent$ts$, $ts$Oflayn$ts$, $ts$1 kunlik seminar$ts$, 30, $ts$rejalashtirilgan$ts$, $ts$Rejalashtirilgan$ts$, $ts$/images/seminars/aligner.jpg$ts$, $ts$Ortodontiya$ts$, $ts$Aligner bilan davolashga ko‘rsatma, raqamli rejalashtirish va bemorni kuzatish.$ts$, $ts$Tibbiy amaliy seminar$ts$, array[$ts$Ortodontiya$ts$]::text[], $ts$/images/seminars/aligner.jpg$ts$, $ts$2027-01-23$ts$, $ts$10:00$ts$, $ts$2027-01-23$ts$, $ts$17:00$ts$, $ts$Smile Akademiya, 2-zal$ts$, $ts$Smile Akademiya, 2-zal$ts$, $ts$teal$ts$, $ts$[{"id":"sp-4","name":"Dr. Nigora Aminova","role":"Ortodontiya","bio":"","city":"Toshkent","avatar":"","links":[]}]$ts$::jsonb, $ts$900000005$ts$, $ts$$ts$, 4),
  ($ts$7e57d000-0000-4000-e000-000000000005$ts$, '7e57d000-0000-4000-a000-000000000005'::uuid, $ts$Klinika boshqaruvi va bemor servisi$ts$, $ts$Shohrux Tojiyev$ts$, $ts$6-fevral 2027$ts$, $ts$Toshkent$ts$, $ts$Oflayn$ts$, $ts$1 kunlik seminar$ts$, 30, $ts$rejalashtirilgan$ts$, $ts$Rejalashtirilgan$ts$, $ts$/images/seminars/hotel.jpg$ts$, $ts$Menejment$ts$, $ts$Qabulxona standartlari, narx siyosati, bemorni qayta jalb qilish va jamoani boshqarish.$ts$, $ts$Tibbiy amaliy seminar$ts$, array[$ts$Menejment$ts$]::text[], $ts$/images/seminars/hotel.jpg$ts$, $ts$2027-02-06$ts$, $ts$10:00$ts$, $ts$2027-02-06$ts$, $ts$17:00$ts$, $ts$Hyatt Regency, Ipak yo‘li zali$ts$, $ts$Hyatt Regency, Ipak yo‘li zali$ts$, $ts$teal$ts$, $ts$[{"id":"sp-5","name":"Shohrux Tojiyev","role":"Menejment","bio":"","city":"Toshkent","avatar":"","links":[]}]$ts$::jsonb, $ts$900000005$ts$, $ts$$ts$, 5)
) as v(id, organizer_id, title, speaker, date_label, city, format, days, seats, status, badge, image, topic, about, category, tags, cover,
       start_date, start_time, end_date, end_time, place, address, template, speakers, contact_phone, contact_telegram, sort_at)
on conflict (id) do update set
  title = excluded.title, speaker = excluded.speaker, date_label = excluded.date_label, city = excluded.city, seats = excluded.seats,
  status = excluded.status, badge = excluded.badge, image = excluded.image, topic = excluded.topic, about = excluded.about,
  tags = excluded.tags, cover = excluded.cover, start_date = excluded.start_date, end_date = excluded.end_date,
  place = excluded.place, address = excluded.address, speakers = excluded.speakers, published = true, hidden = false, updated_at = now()
  where public.seminars.seed_batch = $ts$test-2026-11$ts$;

insert into public.tickets (id, seminar_id, organizer_id, name, price, seats, sort_at, active, seed_batch)
select v.id, v.seminar_id, v.organizer_id, v.name, v.price, v.seats, v.sort_at, true, $ts$test-2026-11$ts$
from (values
  ($ts$7e57d000-0000-4000-e100-000000000010$ts$, $ts$7e57d000-0000-4000-e000-000000000001$ts$, '7e57d000-0000-4000-a000-000000000005'::uuid, $ts$Standart$ts$, 1200000, 20, 0),
  ($ts$7e57d000-0000-4000-e100-000000000011$ts$, $ts$7e57d000-0000-4000-e000-000000000001$ts$, '7e57d000-0000-4000-a000-000000000005'::uuid, $ts$VIP (amaliyot bilan)$ts$, 2400000, 10, 1),
  ($ts$7e57d000-0000-4000-e100-000000000020$ts$, $ts$7e57d000-0000-4000-e000-000000000002$ts$, '7e57d000-0000-4000-a000-000000000005'::uuid, $ts$Standart$ts$, 950000, 24, 0),
  ($ts$7e57d000-0000-4000-e100-000000000030$ts$, $ts$7e57d000-0000-4000-e000-000000000003$ts$, '7e57d000-0000-4000-a000-000000000005'::uuid, $ts$Standart$ts$, 800000, 30, 0),
  ($ts$7e57d000-0000-4000-e100-000000000031$ts$, $ts$7e57d000-0000-4000-e000-000000000003$ts$, '7e57d000-0000-4000-a000-000000000005'::uuid, $ts$Talaba$ts$, 400000, 10, 1),
  ($ts$7e57d000-0000-4000-e100-000000000040$ts$, $ts$7e57d000-0000-4000-e000-000000000004$ts$, '7e57d000-0000-4000-a000-000000000005'::uuid, $ts$Standart$ts$, 1100000, 25, 0),
  ($ts$7e57d000-0000-4000-e100-000000000050$ts$, $ts$7e57d000-0000-4000-e000-000000000005$ts$, '7e57d000-0000-4000-a000-000000000005'::uuid, $ts$Standart$ts$, 600000, 40, 0)
) as v(id, seminar_id, organizer_id, name, price, seats, sort_at)
on conflict (id) do update set name = excluded.name, price = excluded.price, seats = excluded.seats, active = true
  where public.tickets.seed_batch = $ts$test-2026-11$ts$;

-- 4d) Ta’lim kurslari (videosiz tuzilma)
insert into public.courses (id, author_id, title, description, direction, level, format, price, cover_url, status, published_at, seed_batch)
select v.id, v.author_id, v.title, v.description, v.direction, v.level, v.format, v.price, v.cover_url, 'published', now(), $ts$test-2026-11$ts$
from (values
  ('7e57d000-0000-4000-c000-000000000001'::uuid, '7e57d000-0000-4000-a000-000000000005'::uuid, $ts$Endodontiya: kanal anatomiyasidan obturatsiyagacha$ts$, $ts$Kanal anatomiyasi, ishchi uzunlik, mashina asboblari va issiq gutta-percha bilan plombalash.$ts$, $ts$endo$ts$, $ts$orta$ts$, $ts$kurs$ts$, 0, $ts$/images/seminars/micro.jpg$ts$),
  ('7e57d000-0000-4000-c000-000000000002'::uuid, '7e57d000-0000-4000-a000-000000000005'::uuid, $ts$Implantologiyaga kirish$ts$, $ts$Bemor tanlash, CBCT tahlili va oddiy holatlarda implant joylashtirish protokoli.$ts$, $ts$impl$ts$, $ts$bosh$ts$, $ts$kurs$ts$, 0, $ts$/images/seminars/surgery.jpg$ts$),
  ('7e57d000-0000-4000-c000-000000000003'::uuid, '7e57d000-0000-4000-a000-000000000005'::uuid, $ts$Kompozit bilan estetik restavratsiya$ts$, $ts$Rang tanlash, izolyatsiya, adgeziv protokol va qatlamli texnika.$ts$, $ts$terapiya$ts$, $ts$bosh$ts$, $ts$kurs$ts$, 0, $ts$/images/seminars/smile.jpg$ts$),
  ('7e57d000-0000-4000-c000-000000000004'::uuid, '7e57d000-0000-4000-a000-000000000005'::uuid, $ts$Parodontologiya: amaliy asoslar$ts$, $ts$Parodont kasalliklari tasnifi, skeling va kyuretaj, uyda parvarish bo‘yicha tavsiyalar.$ts$, $ts$paro$ts$, $ts$orta$ts$, $ts$kurs$ts$, 0, $ts$/images/seminars/teeth.jpg$ts$),
  ('7e57d000-0000-4000-c000-000000000005'::uuid, '7e57d000-0000-4000-a000-000000000005'::uuid, $ts$Raqamli stomatologiya: skanerdan frezagacha$ts$, $ts$Intraoral skaner, CAD dizayn va CAM frezalash ish jarayoni.$ts$, $ts$digital$ts$, $ts$ekspert$ts$, $ts$kurs$ts$, 0, $ts$/images/yangiliklar/yang-scanner.jpg$ts$)
) as v(id, author_id, title, description, direction, level, format, price, cover_url)
on conflict (id) do update set title = excluded.title, description = excluded.description, direction = excluded.direction,
  level = excluded.level, cover_url = excluded.cover_url, status = 'published', updated_at = now()
  where public.courses.seed_batch = $ts$test-2026-11$ts$;

insert into public.course_lessons (id, course_id, position, title, module_title, seed_batch)
select v.id, v.course_id, v.position, v.title, v.module_title, $ts$test-2026-11$ts$
from (values
  ('7e57d000-0000-4000-c100-000000000101'::uuid, '7e57d000-0000-4000-c000-000000000001'::uuid, 1, $ts$Kanal anatomiyasi va kirish$ts$, $ts$1-modul$ts$),
  ('7e57d000-0000-4000-c100-000000000102'::uuid, '7e57d000-0000-4000-c000-000000000001'::uuid, 2, $ts$Ishchi uzunlikni aniqlash$ts$, $ts$1-modul$ts$),
  ('7e57d000-0000-4000-c100-000000000103'::uuid, '7e57d000-0000-4000-c000-000000000001'::uuid, 3, $ts$NiTi fayllar bilan ishlash$ts$, $ts$2-modul$ts$),
  ('7e57d000-0000-4000-c100-000000000104'::uuid, '7e57d000-0000-4000-c000-000000000001'::uuid, 4, $ts$Obturatsiya usullari$ts$, $ts$2-modul$ts$),
  ('7e57d000-0000-4000-c100-000000000201'::uuid, '7e57d000-0000-4000-c000-000000000002'::uuid, 1, $ts$Ko‘rsatma va qarshi ko‘rsatmalar$ts$, $ts$1-modul$ts$),
  ('7e57d000-0000-4000-c100-000000000202'::uuid, '7e57d000-0000-4000-c000-000000000002'::uuid, 2, $ts$CBCT bo‘yicha rejalashtirish$ts$, $ts$1-modul$ts$),
  ('7e57d000-0000-4000-c100-000000000203'::uuid, '7e57d000-0000-4000-c000-000000000002'::uuid, 3, $ts$Jarrohlik bosqichlari$ts$, $ts$2-modul$ts$),
  ('7e57d000-0000-4000-c100-000000000301'::uuid, '7e57d000-0000-4000-c000-000000000003'::uuid, 1, $ts$Rang tanlash$ts$, $ts$1-modul$ts$),
  ('7e57d000-0000-4000-c100-000000000302'::uuid, '7e57d000-0000-4000-c000-000000000003'::uuid, 2, $ts$Izolyatsiya va adgeziya$ts$, $ts$1-modul$ts$),
  ('7e57d000-0000-4000-c100-000000000303'::uuid, '7e57d000-0000-4000-c000-000000000003'::uuid, 3, $ts$Qatlamlab qo‘yish$ts$, $ts$2-modul$ts$),
  ('7e57d000-0000-4000-c100-000000000304'::uuid, '7e57d000-0000-4000-c000-000000000003'::uuid, 4, $ts$Pardozlash$ts$, $ts$2-modul$ts$),
  ('7e57d000-0000-4000-c100-000000000401'::uuid, '7e57d000-0000-4000-c000-000000000004'::uuid, 1, $ts$Tasnif va diagnostika$ts$, $ts$1-modul$ts$),
  ('7e57d000-0000-4000-c100-000000000402'::uuid, '7e57d000-0000-4000-c000-000000000004'::uuid, 2, $ts$Skeling va kyuretaj$ts$, $ts$1-modul$ts$),
  ('7e57d000-0000-4000-c100-000000000403'::uuid, '7e57d000-0000-4000-c000-000000000004'::uuid, 3, $ts$Qo‘llab-quvvatlovchi terapiya$ts$, $ts$2-modul$ts$),
  ('7e57d000-0000-4000-c100-000000000501'::uuid, '7e57d000-0000-4000-c000-000000000005'::uuid, 1, $ts$Intraoral skanerlash$ts$, $ts$1-modul$ts$),
  ('7e57d000-0000-4000-c100-000000000502'::uuid, '7e57d000-0000-4000-c000-000000000005'::uuid, 2, $ts$CAD dizayn$ts$, $ts$1-modul$ts$),
  ('7e57d000-0000-4000-c100-000000000503'::uuid, '7e57d000-0000-4000-c000-000000000005'::uuid, 3, $ts$CAM va materiallar$ts$, $ts$2-modul$ts$)
) as v(id, course_id, position, title, module_title)
on conflict (id) do update set title = excluded.title, module_title = excluded.module_title
  where public.course_lessons.seed_batch = $ts$test-2026-11$ts$;

-- 4e) Katalog: Ustalar, Mutaxassislar, E’lonlar, Vakansiyalar, Kitoblar, Ortiqcha material
alter table public.catalog_items disable trigger catalog_items_ad_guard;
alter table public.catalog_items disable trigger catalog_items_surplus_guard;
alter table public.catalog_items disable trigger catalog_items_job_guard;
insert into public.catalog_items (kind, id, payload, sort_at, owner_id, hidden, hidden_reason, status, is_demo, seed_batch, updated_at)
select v.kind, v.id, v.payload, v.sort_at, v.owner_id, false, '', 'active', false, $ts$test-2026-11$ts$, now()
from (values
  ($ts$master$ts$, $ts$ts26-usta-ustanovka-servis$ts$, $ts${"id":"ts26-usta-ustanovka-servis","name":"Ustanovka Servis","role":"Stomatologik ustanovkalar ta’miri","cats":["unit","install"],"tags":["Ustanovka","Gidravlika","Elektronika"],"brands":["Sirona","KaVo","Fengdan"],"years":9,"jobs":210,"city":"Toshkent","district":"Chilonzor","photo":"/images/ustalar/usta-azamat.jpg","works":["/images/ustalar/usta-work-chair.jpg","/images/ustalar/usta-work-wire.jpg"],"services":[{"name":"Chaqiruv va diagnostika","price":"150 000 so‘m","meta":"Toshkent bo‘ylab"},{"name":"Gidravlika ta’miri","price":"dan 400 000 so‘m","meta":"Ehtiyot qism alohida"}],"about":"Ustanovkalarni o‘rnatish, gidravlika va plata ta’miri, profilaktik servis.","phone":"+998 90 000 00 11","telegram":"","reply":"~30 daqiqa","status":"online","rating":0,"reviews":0}$ts$::jsonb, 500, '7e57d000-0000-4000-a000-000000000006'::uuid),
  ($ts$master$ts$, $ts$ts26-usta-turbina-pro$ts$, $ts${"id":"ts26-usta-turbina-pro","name":"Turbina Pro","role":"Uchlik va turbinalar ta’miri","cats":["handpiece"],"tags":["Turbina","Mikromotor","Podshipnik"],"brands":["NSK","W&H","Bien-Air"],"years":7,"jobs":640,"city":"Toshkent","district":"Yunusobod","photo":"/images/ustalar/usta-bobur.jpg","works":["/images/ustalar/usta-work-hands.jpg"],"services":[{"name":"Turbina podshipnik almashtirish","price":"dan 350 000 so‘m","meta":"Kafolat: 3 oy"},{"name":"Diagnostika","price":"Bepul","meta":"1 kun ichida"}],"about":"Turbinali va burchakli uchliklarni ta’mirlash, original podshipniklar bilan.","phone":"+998 90 000 00 12","telegram":"","reply":"~30 daqiqa","status":"online","rating":0,"reviews":0}$ts$::jsonb, 501, '7e57d000-0000-4000-a000-000000000006'::uuid),
  ($ts$master$ts$, $ts$ts26-usta-kompressor-24$ts$, $ts${"id":"ts26-usta-kompressor-24","name":"Kompressor 24","role":"Kompressor va aspirator servisi","cats":["compressor"],"tags":["Kompressor","Aspirator","Filtrlar"],"brands":["Cattani","Durr"],"years":11,"jobs":380,"city":"Toshkent","district":"Sergeli","photo":"/images/ustalar/usta-dilshod.jpg","works":["/images/ustalar/usta-work-auto.jpg"],"services":[{"name":"Yillik servis","price":"500 000 so‘m","meta":"1 ta kompressor"},{"name":"Filtr almashtirish","price":"180 000 so‘m","meta":"Material bilan"}],"about":"Moysiz kompressorlar va aspiratsiya tizimlarini servis qilish.","phone":"+998 90 000 00 13","telegram":"","reply":"~30 daqiqa","status":"online","rating":0,"reviews":0}$ts$::jsonb, 502, '7e57d000-0000-4000-a000-000000000006'::uuid),
  ($ts$master$ts$, $ts$ts26-usta-steril-texnik$ts$, $ts${"id":"ts26-usta-steril-texnik","name":"Steril Texnik","role":"Avtoklav va sterilizatorlar","cats":["autoclave"],"tags":["Avtoklav","Validatsiya"],"brands":["Melag","W&H","Euronda"],"years":6,"jobs":150,"city":"Toshkent","district":"Mirobod","photo":"/images/ustalar/usta-jasur.jpg","works":["/images/ustalar/usta-work-wire.jpg"],"services":[{"name":"Avtoklav diagnostikasi","price":"200 000 so‘m","meta":"Joyida"},{"name":"Germetik almashtirish","price":"dan 250 000 so‘m","meta":"Kafolat: 6 oy"}],"about":"B-sinf avtoklavlarni ta’mirlash va sozlash.","phone":"+998 90 000 00 14","telegram":"","reply":"~30 daqiqa","status":"online","rating":0,"reviews":0}$ts$::jsonb, 503, '7e57d000-0000-4000-a000-000000000006'::uuid),
  ($ts$master$ts$, $ts$ts26-usta-rentgen-servis$ts$, $ts${"id":"ts26-usta-rentgen-servis","name":"Rentgen Servis","role":"Rentgen va CBCT xizmati","cats":["cbct"],"tags":["Rentgen","CBCT","Sensor"],"brands":["Planmeca","Vatech"],"years":12,"jobs":95,"city":"Toshkent","district":"Mirzo Ulug‘bek","photo":"/images/ustalar/usta-sardor.jpg","works":["/images/ustalar/usta-work-xray.jpg"],"services":[{"name":"Kalibrlash","price":"600 000 so‘m","meta":"Hujjat bilan"},{"name":"Sensor ta’miri","price":"Kelishilgan","meta":"Diagnostikadan keyin"}],"about":"Rentgen apparatlari va CBCT tizimlarini o‘rnatish, kalibrlash va servis.","phone":"+998 90 000 00 15","telegram":"","reply":"~30 daqiqa","status":"online","rating":0,"reviews":0}$ts$::jsonb, 504, '7e57d000-0000-4000-a000-000000000006'::uuid),
  ($ts$master$ts$, $ts$ts26-usta-cadcam-lab$ts$, $ts${"id":"ts26-usta-cadcam-lab","name":"CAD/CAM Lab Servis","role":"Skaner va frezalash uskunalari","cats":["scan"],"tags":["Skaner","Frezer","Dasturiy ta’minot"],"brands":["3Shape","Medit","Roland"],"years":5,"jobs":120,"city":"Toshkent","district":"Yakkasaroy","photo":"/images/ustalar/usta-azamat.jpg","works":["/images/ustalar/usta-work-chair.jpg"],"services":[{"name":"Skanerni sozlash","price":"300 000 so‘m","meta":"Masofadan ham"},{"name":"Frezer servisi","price":"dan 450 000 so‘m","meta":"Joyida"}],"about":"Intraoral skaner va frezalash stanoklarini sozlash, dasturiy yordam.","phone":"+998 90 000 00 16","telegram":"","reply":"~30 daqiqa","status":"online","rating":0,"reviews":0}$ts$::jsonb, 505, '7e57d000-0000-4000-a000-000000000006'::uuid),
  ($ts$doctor$ts$, $ts$ts26-dr-sanjar-olimov$ts$, $ts${"id":"ts26-dr-sanjar-olimov","name":"Dr. Sanjar Olimov","role":"Implantolog, jarroh","focus":"Implantologiya","specs":["implantolog","jarroh"],"tags":["Implantatsiya","Sinus lift"],"exp":10,"clinic":"Nur Dental","city":"Toshkent","district":"Chilonzor","photo":"/images/bemorlar/bemor-sardor.jpg","about":"Murakkab implant holatlari bo‘yicha konsultatsiya va ikkinchi fikr.","services":[{"name":"Onlayn konsultatsiya","note":"30 daqiqa, video","price":150000,"img":"/images/kategoriyalar/kat-implant.jpg"}],"phone":"+998 90 000 00 21","cert":true,"online":true,"rating":0,"reviews":0,"patients":"","works":["/images/bemorlar/bemor-rvg.jpg","/images/bemorlar/bemor-opg.jpg"],"reviewsList":[]}$ts$::jsonb, 506, '7e57d000-0000-4000-a000-000000000007'::uuid),
  ($ts$doctor$ts$, $ts$ts26-dr-lola-hamidova$ts$, $ts${"id":"ts26-dr-lola-hamidova","name":"Dr. Lola Hamidova","role":"Endodontist","focus":"Endodontiya","specs":["endodont"],"tags":["Mikroskop","Qayta davolash"],"exp":8,"clinic":"Endo Plus","city":"Toshkent","district":"Yunusobod","photo":"/images/bemorlar/bemor-malika.jpg","about":"Murakkab kanallar va qayta davolash bo‘yicha maslahat.","services":[{"name":"Keys tahlili","note":"Rentgen bo‘yicha","price":120000,"img":"/images/kategoriyalar/kat-endo.jpg"}],"phone":"+998 90 000 00 22","cert":true,"online":true,"rating":0,"reviews":0,"patients":"","works":["/images/bemorlar/bemor-rvg.jpg","/images/bemorlar/bemor-opg.jpg"],"reviewsList":[]}$ts$::jsonb, 507, '7e57d000-0000-4000-a000-000000000007'::uuid),
  ($ts$doctor$ts$, $ts$ts26-dr-kamron-yusufov$ts$, $ts${"id":"ts26-dr-kamron-yusufov","name":"Dr. Kamron Yusufov","role":"Estetik stomatolog","focus":"Estetik restavratsiya","specs":["terapevt"],"tags":["Kompozit","Vinir"],"exp":7,"clinic":"Smile Studio","city":"Toshkent","district":"Mirobod","photo":"/images/bemorlar/bemor-bobur.jpg","about":"Old tishlar estetikasi va tabassum dizayni bo‘yicha konsultatsiya.","services":[{"name":"Tabassum dizayni","note":"Foto tahlil bilan","price":200000,"img":"/images/kategoriyalar/kat-terapiya.jpg"}],"phone":"+998 90 000 00 23","cert":true,"online":true,"rating":0,"reviews":0,"patients":"","works":["/images/bemorlar/bemor-rvg.jpg","/images/bemorlar/bemor-opg.jpg"],"reviewsList":[]}$ts$::jsonb, 508, '7e57d000-0000-4000-a000-000000000007'::uuid),
  ($ts$doctor$ts$, $ts$ts26-dr-nigora-aminova$ts$, $ts${"id":"ts26-dr-nigora-aminova","name":"Dr. Nigora Aminova","role":"Ortodont","focus":"Aligner va breketlar","specs":["ortodont"],"tags":["Aligner","Breket"],"exp":9,"clinic":"Orto Line","city":"Toshkent","district":"Mirzo Ulug‘bek","photo":"/images/bemorlar/bemor-sevara.jpg","about":"Ortodontik davolash rejasi va aligner bo‘yicha maslahat.","services":[{"name":"Ortodontik konsultatsiya","note":"Rejasi bilan","price":180000,"img":"/images/kategoriyalar/kat-orto.jpg"}],"phone":"+998 90 000 00 24","cert":true,"online":true,"rating":0,"reviews":0,"patients":"","works":["/images/bemorlar/bemor-rvg.jpg","/images/bemorlar/bemor-opg.jpg"],"reviewsList":[]}$ts$::jsonb, 509, '7e57d000-0000-4000-a000-000000000007'::uuid),
  ($ts$doctor$ts$, $ts$ts26-dr-javlon-rahimov$ts$, $ts${"id":"ts26-dr-javlon-rahimov","name":"Dr. Javlon Rahimov","role":"Ortoped","focus":"Protezlash","specs":["ortoped"],"tags":["Zirkoniy","Implant ustida protez"],"exp":12,"clinic":"Proteks Klinika","city":"Toshkent","district":"Sergeli","photo":"/images/bemorlar/bemor-davron.jpg","about":"Ortopedik reabilitatsiya va protez tanlash bo‘yicha konsultatsiya.","services":[{"name":"Protezlash rejasi","note":"KT/OPG bo‘yicha","price":150000,"img":"/images/kategoriyalar/kat-ortopediya.jpg"}],"phone":"+998 90 000 00 25","cert":true,"online":true,"rating":0,"reviews":0,"patients":"","works":["/images/bemorlar/bemor-rvg.jpg","/images/bemorlar/bemor-opg.jpg"],"reviewsList":[]}$ts$::jsonb, 510, '7e57d000-0000-4000-a000-000000000007'::uuid),
  ($ts$doctor$ts$, $ts$ts26-dr-madina-saidova$ts$, $ts${"id":"ts26-dr-madina-saidova","name":"Dr. Madina Saidova","role":"Bolalar stomatologi","focus":"Bolalar stomatologiyasi","specs":["bolalar"],"tags":["Profilaktika","Germetizatsiya"],"exp":6,"clinic":"Kids Dental","city":"Toshkent","district":"Yakkasaroy","photo":"/images/bemorlar/bemor-madina.jpg","about":"Bolalar tishlari parvarishi va profilaktika bo‘yicha maslahat.","services":[{"name":"Ota-onalar uchun konsultatsiya","note":"20 daqiqa","price":100000,"img":"/images/kategoriyalar/kat-gigiyena.jpg"}],"phone":"+998 90 000 00 26","cert":true,"online":true,"rating":0,"reviews":0,"patients":"","works":["/images/bemorlar/bemor-rvg.jpg","/images/bemorlar/bemor-opg.jpg"],"reviewsList":[]}$ts$::jsonb, 511, '7e57d000-0000-4000-a000-000000000007'::uuid),
  ($ts$ad$ts$, $ts$ts26-elon-ustanovka-2022$ts$, $ts${"id":"ts26-elon-ustanovka-2022","title":"Stomatologik ustanovka, 2022-yil","cat":"uskuna","deal":"sale","price":52000000,"cond":"Ishlatilgan","sub":"Yaxshi holatda, servis hujjatlari bor","about":"Klinika yangi jihozga o‘tgani uchun sotiladi. LED chiroq, assistent bloki, muntazam servis qilingan.","images":["/images/demo/elonlar/e1.webp"],"features":["LED chiroq","Assistent bloki"],"city":"Toshkent","original":true,"views":0,"status":"active","date":"16 noy 2026","specs":[["place","Shahar","Toshkent"],["cond","Holati","Ishlatilgan"]],"seller":"Nur Dental Klinikasi","sellerInfo":{"name":"Nur Dental Klinikasi","type":"Klinika","since":"2026","avatar":"","rating":null,"phone":"+998 90 000 00 31","telegram":""}}$ts$::jsonb, 512, '7e57d000-0000-4000-a000-000000000008'::uuid),
  ($ts$ad$ts$, $ts$ts26-elon-avtoklav$ts$, $ts${"id":"ts26-elon-avtoklav","title":"Avtoklav 18 litr, B-sinf","cat":"uskuna","deal":"sale","price":14500000,"cond":"Ishlatilgan","sub":"2 yil ishlatilgan","about":"Ishlashi a’lo, germetik yangi almashtirilgan.","images":["/images/demo/elonlar/e2.webp"],"features":["B-sinf","18 litr"],"city":"Toshkent","original":true,"views":0,"status":"active","date":"16 noy 2026","specs":[["place","Shahar","Toshkent"],["cond","Holati","Ishlatilgan"]],"seller":"Nur Dental Klinikasi","sellerInfo":{"name":"Nur Dental Klinikasi","type":"Klinika","since":"2026","avatar":"","rating":null,"phone":"+998 90 000 00 32","telegram":""}}$ts$::jsonb, 513, '7e57d000-0000-4000-a000-000000000008'::uuid),
  ($ts$ad$ts$, $ts$ts26-elon-kabinet-ijara$ts$, $ts${"id":"ts26-elon-kabinet-ijara","title":"Jihozlangan stomatologik kabinet ijarasi","cat":"klinika","deal":"rent","price":6000000,"cond":"Yaxshi","sub":"Oylik, Chilonzor","about":"Bitta kreslo, sterilizatsiya xonasi va qabulxona umumiy.","images":["/images/ishlar/ish-chair.jpg"],"features":["1 kreslo","Sterilizatsiya xonasi"],"city":"Toshkent","original":true,"views":0,"status":"active","date":"16 noy 2026","specs":[["place","Shahar","Toshkent"],["cond","Holati","Yaxshi"]],"seller":"Nur Dental Klinikasi","sellerInfo":{"name":"Nur Dental Klinikasi","type":"Klinika","since":"2026","avatar":"","rating":null,"phone":"+998 90 000 00 33","telegram":""}}$ts$::jsonb, 514, '7e57d000-0000-4000-a000-000000000008'::uuid),
  ($ts$ad$ts$, $ts$ts26-elon-mikromotor$ts$, $ts${"id":"ts26-elon-mikromotor","title":"Mikromotor to‘plami (yangi, qutida)","cat":"asbob","deal":"sale","price":3900000,"cond":"Yangi","sub":"Ortiqcha buyurtma","about":"Ochilmagan qutida, kafolat taloni bilan.","images":["/images/demo/elonlar/e4.webp"],"features":["Yangi","Kafolat"],"city":"Toshkent","original":true,"views":0,"status":"active","date":"16 noy 2026","specs":[["place","Shahar","Toshkent"],["cond","Holati","Yangi"]],"seller":"Nur Dental Klinikasi","sellerInfo":{"name":"Nur Dental Klinikasi","type":"Klinika","since":"2026","avatar":"","rating":null,"phone":"+998 90 000 00 34","telegram":""}}$ts$::jsonb, 515, '7e57d000-0000-4000-a000-000000000008'::uuid),
  ($ts$ad$ts$, $ts$ts26-elon-rvg-sensor$ts$, $ts${"id":"ts26-elon-rvg-sensor","title":"RVG sensor, 1-o‘lcham","cat":"uskuna","deal":"sale","price":8200000,"cond":"Ishlatilgan","sub":"Kam ishlatilgan","about":"Dasturi bilan, kompyuterga USB orqali ulanadi.","images":["/images/demo/elonlar/e5.webp"],"features":["USB","Dastur bilan"],"city":"Toshkent","original":true,"views":0,"status":"active","date":"16 noy 2026","specs":[["place","Shahar","Toshkent"],["cond","Holati","Ishlatilgan"]],"seller":"Nur Dental Klinikasi","sellerInfo":{"name":"Nur Dental Klinikasi","type":"Klinika","since":"2026","avatar":"","rating":null,"phone":"+998 90 000 00 35","telegram":""}}$ts$::jsonb, 516, '7e57d000-0000-4000-a000-000000000008'::uuid),
  ($ts$ad$ts$, $ts$ts26-elon-kreslo-assistent$ts$, $ts${"id":"ts26-elon-kreslo-assistent","title":"Assistent kreslosi","cat":"uskuna","deal":"sale","price":1600000,"cond":"Ishlatilgan","sub":"Yaxshi holatda","about":"Balandligi sozlanadi, g‘ildiraklari butun.","images":["/images/demo/elonlar/e6.webp"],"features":["Sozlanadi"],"city":"Toshkent","original":true,"views":0,"status":"active","date":"16 noy 2026","specs":[["place","Shahar","Toshkent"],["cond","Holati","Ishlatilgan"]],"seller":"Nur Dental Klinikasi","sellerInfo":{"name":"Nur Dental Klinikasi","type":"Klinika","since":"2026","avatar":"","rating":null,"phone":"+998 90 000 00 36","telegram":""}}$ts$::jsonb, 517, '7e57d000-0000-4000-a000-000000000008'::uuid),
  ($ts$job$ts$, $ts$ts26-ish-terapevt$ts$, $ts${"id":"ts26-ish-terapevt","title":"Stomatolog-terapevt","clinic":"Nur Dental Klinikasi","city":"toshkent","cityLabel":"Toshkent","address":"Chilonzor tumani","district":"","type":"full","spec":"terapevt","exp":"y1","min":8000000,"max":14000000,"requirements":["Diplom va litsenziya","1 yildan ortiq tajriba"],"about":"Kunlik 8–10 bemor, zamonaviy jihozlar, foiz + oklad.","phone":"+998900000041","telegram":"","posted":"","postedAt":"2026-11-16T10:00:00+05:00","ownerId":"7e57d000-0000-4000-a000-000000000008","user":true,"image":"/images/ishlar/ish-hall.jpg","status":"active"}$ts$::jsonb, 518, '7e57d000-0000-4000-a000-000000000008'::uuid),
  ($ts$job$ts$, $ts$ts26-ish-ortoped$ts$, $ts${"id":"ts26-ish-ortoped","title":"Stomatolog-ortoped","clinic":"Nur Dental Klinikasi","city":"toshkent","cityLabel":"Toshkent","address":"Chilonzor tumani","district":"","type":"full","spec":"ortoped","exp":"y3","min":12000000,"max":20000000,"requirements":["3+ yil tajriba","Raqamli ottisk bilan ishlay olish"],"about":"Zirkoniy va implant ustida protezlash, o‘z laboratoriyamiz bor.","phone":"+998900000042","telegram":"","posted":"","postedAt":"2026-11-16T10:00:00+05:00","ownerId":"7e57d000-0000-4000-a000-000000000008","user":true,"image":"/images/ishlar/ish-implant.jpg","status":"active"}$ts$::jsonb, 519, '7e57d000-0000-4000-a000-000000000008'::uuid),
  ($ts$job$ts$, $ts$ts26-ish-assistent$ts$, $ts${"id":"ts26-ish-assistent","title":"Stomatolog assistenti","clinic":"Nur Dental Klinikasi","city":"toshkent","cityLabel":"Toshkent","address":"Chilonzor tumani","district":"","type":"shift","spec":"assistent","exp":"none","min":4000000,"max":5500000,"requirements":["Mas’uliyat","Tibbiy kollej (afzallik)"],"about":"Smenali ish, o‘qitamiz.","phone":"+998900000043","telegram":"","posted":"","postedAt":"2026-11-16T10:00:00+05:00","ownerId":"7e57d000-0000-4000-a000-000000000008","user":true,"image":"/images/ishlar/ish-assistant.jpg","status":"active"}$ts$::jsonb, 520, '7e57d000-0000-4000-a000-000000000008'::uuid),
  ($ts$job$ts$, $ts$ts26-ish-administrator$ts$, $ts${"id":"ts26-ish-administrator","title":"Qabulxona administratori","clinic":"Nur Dental Klinikasi","city":"toshkent","cityLabel":"Toshkent","address":"Chilonzor tumani","district":"","type":"full","spec":"admin","exp":"y1","min":4500000,"max":6000000,"requirements":["Rus va o‘zbek tillari","Kompyuter savodxonligi"],"about":"Bemorlarni yozish, qo‘ng‘iroqlar va CRM bilan ishlash.","phone":"+998900000044","telegram":"","posted":"","postedAt":"2026-11-16T10:00:00+05:00","ownerId":"7e57d000-0000-4000-a000-000000000008","user":true,"image":"/images/ishlar/ish-reception.jpg","status":"active"}$ts$::jsonb, 521, '7e57d000-0000-4000-a000-000000000008'::uuid),
  ($ts$job$ts$, $ts$ts26-ish-bolalar$ts$, $ts${"id":"ts26-ish-bolalar","title":"Bolalar stomatologi","clinic":"Nur Dental Klinikasi","city":"toshkent","cityLabel":"Toshkent","address":"Chilonzor tumani","district":"","type":"part","spec":"bolalar","exp":"y3","min":7000000,"max":11000000,"requirements":["Bolalar bilan ishlash tajribasi"],"about":"Haftada 3 kun, bolalar kabineti alohida.","phone":"+998900000045","telegram":"","posted":"","postedAt":"2026-11-16T10:00:00+05:00","ownerId":"7e57d000-0000-4000-a000-000000000008","user":true,"image":"/images/ishlar/ish-family.jpg","status":"active"}$ts$::jsonb, 522, '7e57d000-0000-4000-a000-000000000008'::uuid),
  ($ts$job$ts$, $ts$ts26-ish-texnik$ts$, $ts${"id":"ts26-ish-texnik","title":"Tish texnigi (CAD/CAM)","clinic":"Nur Dental Klinikasi","city":"toshkent","cityLabel":"Toshkent","address":"Chilonzor tumani","district":"","type":"full","spec":"texnik","exp":"y3","min":9000000,"max":15000000,"requirements":["Exocad bilimi","3+ yil tajriba"],"about":"Exocad va frezer bilan ishlash, zirkoniy konstruksiyalar.","phone":"+998900000046","telegram":"","posted":"","postedAt":"2026-11-16T10:00:00+05:00","ownerId":"7e57d000-0000-4000-a000-000000000008","user":true,"image":"/images/ishlar/ish-dentacare.jpg","status":"active"}$ts$::jsonb, 523, '7e57d000-0000-4000-a000-000000000008'::uuid),
  ($ts$book$ts$, $ts$ts26-kitob-endo-amaliyot$ts$, $ts${"id":"ts26-kitob-endo-amaliyot","title":"Endodontiya amaliyoti","author":"R. Karimov","cats":["endo"],"year":2023,"pages":240,"lang":"uz","cover":"/images/books/book-endo.jpg","gallery":["/images/books/book-endo.jpg"],"blurb":"Kanal anatomiyasi, asboblar va obturatsiya bo‘yicha amaliy qo‘llanma.","about":"Amaliyotchi shifokorlar uchun endodontik davolash bosqichlari, klinik misollar bilan.","category":"Endodontiya","price":null,"stock":"stock","formats":["print"],"rating":0,"reviews":0,"isbn":"","place":"Toshkent","script":"Lotin","seller":"Ilm Kitob Do‘koni","sellerId":"7e57d000-0000-4000-a000-000000000009","publisher":"other","publisherName":""}$ts$::jsonb, 524, '7e57d000-0000-4000-a000-000000000009'::uuid),
  ($ts$book$ts$, $ts$ts26-kitob-kariyes$ts$, $ts${"id":"ts26-kitob-kariyes","title":"Kariyes va uning profilaktikasi","author":"N. Tursunova","cats":["terapiya"],"year":2022,"pages":180,"lang":"uz","cover":"/images/books/book-caries.jpg","gallery":["/images/books/book-caries.jpg"],"blurb":"Kariyes etiologiyasi, tashxisi va oldini olish.","about":"Talabalar va yosh shifokorlar uchun o‘quv qo‘llanma.","category":"Terapevtik stomatologiya","price":null,"stock":"stock","formats":["print"],"rating":0,"reviews":0,"isbn":"","place":"Toshkent","script":"Lotin","seller":"Ilm Kitob Do‘koni","sellerId":"7e57d000-0000-4000-a000-000000000009","publisher":"other","publisherName":""}$ts$::jsonb, 525, '7e57d000-0000-4000-a000-000000000009'::uuid),
  ($ts$book$ts$, $ts$ts26-kitob-parodont$ts$, $ts${"id":"ts26-kitob-parodont","title":"Parodontologiya asoslari","author":"D. Rasulov","cats":["paro"],"year":2021,"pages":210,"lang":"uz","cover":"/images/books/book-perio.jpg","gallery":["/images/books/book-perio.jpg"],"blurb":"Parodont kasalliklari tasnifi va davolash usullari.","about":"Klinik holatlar va davolash rejalari bilan.","category":"Parodontologiya","price":null,"stock":"stock","formats":["print"],"rating":0,"reviews":0,"isbn":"","place":"Toshkent","script":"Lotin","seller":"Ilm Kitob Do‘koni","sellerId":"7e57d000-0000-4000-a000-000000000009","publisher":"other","publisherName":""}$ts$::jsonb, 526, '7e57d000-0000-4000-a000-000000000009'::uuid),
  ($ts$book$ts$, $ts$ts26-kitob-estetika$ts$, $ts${"id":"ts26-kitob-estetika","title":"Estetik stomatologiya","author":"S. Alimova","cats":["terapiya"],"year":2024,"pages":260,"lang":"uz","cover":"/images/books/book-esthetic.jpg","gallery":["/images/books/book-esthetic.jpg"],"blurb":"Rang, shakl va tabassum dizayni.","about":"Kompozit va keramik restavratsiyalarda estetika tamoyillari.","category":"Estetik stomatologiya","price":null,"stock":"stock","formats":["print"],"rating":0,"reviews":0,"isbn":"","place":"Toshkent","script":"Lotin","seller":"Ilm Kitob Do‘koni","sellerId":"7e57d000-0000-4000-a000-000000000009","publisher":"other","publisherName":""}$ts$::jsonb, 527, '7e57d000-0000-4000-a000-000000000009'::uuid),
  ($ts$book$ts$, $ts$ts26-kitob-anatomiya$ts$, $ts${"id":"ts26-kitob-anatomiya","title":"Tish anatomiyasi atlasi","author":"B. Qodirov","cats":["terapiya"],"year":2020,"pages":150,"lang":"uz","cover":"/images/books/book-anatomy.jpg","gallery":["/images/books/book-anatomy.jpg"],"blurb":"Doimiy va sut tishlari anatomiyasi rasmlarda.","about":"Har bir tish uchun tavsif va sxemalar.","category":"Anatomiya","price":null,"stock":"stock","formats":["print"],"rating":0,"reviews":0,"isbn":"","place":"Toshkent","script":"Lotin","seller":"Ilm Kitob Do‘koni","sellerId":"7e57d000-0000-4000-a000-000000000009","publisher":"other","publisherName":""}$ts$::jsonb, 528, '7e57d000-0000-4000-a000-000000000009'::uuid),
  ($ts$surplus$ts$, $ts$ts26-ortiqcha-filtek$ts$, $ts${"id":"ts26-ortiqcha-filtek","name":"Filtek Z550 kompozit, A3","type":"Kompozit (4 g)","brand":"3M","cat":"komp","price":240000,"oldPrice":330000,"expiryISO":"2027-09","expiry":"09/2027","image":"/images/demo/ortiqcha/s1.webp","images":["/images/demo/ortiqcha/s1.webp"],"note":"Ortiqcha buyurtma, 3 ta shprits ochilmagan.","qty":3,"city":"Toshkent","condition":"Yopiq","rating":0,"reviews":0,"discount":"-27%","seller":{"name":"Nur Dental Klinikasi","avatar":"","phone":"+998 90 000 00 51","telegram":""}}$ts$::jsonb, 529, '7e57d000-0000-4000-a000-000000000008'::uuid),
  ($ts$surplus$ts$, $ts$ts26-ortiqcha-bond$ts$, $ts${"id":"ts26-ortiqcha-bond","name":"Adper Single Bond 2","type":"Bond (6 ml)","brand":"3M","cat":"bond","price":300000,"oldPrice":420000,"expiryISO":"2027-06","expiry":"06/2027","image":"/images/demo/ortiqcha/s2.webp","images":["/images/demo/ortiqcha/s2.webp"],"note":"Muzlatkichda saqlangan, ochilmagan.","qty":2,"city":"Toshkent","condition":"Yopiq","rating":0,"reviews":0,"discount":"-29%","seller":{"name":"Nur Dental Klinikasi","avatar":"","phone":"+998 90 000 00 51","telegram":""}}$ts$::jsonb, 530, '7e57d000-0000-4000-a000-000000000008'::uuid),
  ($ts$surplus$ts$, $ts$ts26-ortiqcha-sement$ts$, $ts${"id":"ts26-ortiqcha-sement","name":"RelyX Luting 2 sement","type":"Sement","brand":"3M","cat":"sement","price":520000,"oldPrice":690000,"expiryISO":"2027-04","expiry":"04/2027","image":"/images/demo/ortiqcha/s3.webp","images":["/images/demo/ortiqcha/s3.webp"],"note":"Bitta to‘plam ortiqcha.","qty":1,"city":"Toshkent","condition":"Yopiq","rating":0,"reviews":0,"discount":"-25%","seller":{"name":"Nur Dental Klinikasi","avatar":"","phone":"+998 90 000 00 51","telegram":""}}$ts$::jsonb, 531, '7e57d000-0000-4000-a000-000000000008'::uuid),
  ($ts$surplus$ts$, $ts$ts26-ortiqcha-gc-fuji$ts$, $ts${"id":"ts26-ortiqcha-gc-fuji","name":"GC Fuji II LC","type":"Shisha-ionomer","brand":"GC","cat":"other","price":380000,"oldPrice":520000,"expiryISO":"2027-08","expiry":"08/2027","image":"/images/demo/ortiqcha/s4.webp","images":["/images/demo/ortiqcha/s4.webp"],"note":"Yopiq qutida.","qty":2,"city":"Toshkent","condition":"Yopiq","rating":0,"reviews":0,"discount":"-27%","seller":{"name":"Nur Dental Klinikasi","avatar":"","phone":"+998 90 000 00 51","telegram":""}}$ts$::jsonb, 532, '7e57d000-0000-4000-a000-000000000008'::uuid),
  ($ts$surplus$ts$, $ts$ts26-ortiqcha-endo-fayl$ts$, $ts${"id":"ts26-ortiqcha-endo-fayl","name":"ProTaper Next fayllar X1–X3","type":"Endo fayllar","brand":"Dentsply","cat":"instr","price":260000,"oldPrice":360000,"expiryISO":"2028-01","expiry":"01/2028","image":"/images/demo/ortiqcha/s5.webp","images":["/images/demo/ortiqcha/s5.webp"],"note":"Ikki to‘plam, ochilmagan.","qty":2,"city":"Toshkent","condition":"Yopiq","rating":0,"reviews":0,"discount":"-28%","seller":{"name":"Nur Dental Klinikasi","avatar":"","phone":"+998 90 000 00 51","telegram":""}}$ts$::jsonb, 533, '7e57d000-0000-4000-a000-000000000008'::uuid)
) as v(kind, id, payload, sort_at, owner_id)
on conflict (kind, id) do update set payload = excluded.payload, sort_at = excluded.sort_at, owner_id = excluded.owner_id,
  hidden = false, hidden_reason = '', status = 'active', updated_at = now()
  where public.catalog_items.seed_batch = $ts$test-2026-11$ts$;
alter table public.catalog_items enable trigger catalog_items_ad_guard;
alter table public.catalog_items enable trigger catalog_items_surplus_guard;
alter table public.catalog_items enable trigger catalog_items_job_guard;

commit;

notify pgrst, 'reload schema';

-- Tekshiruv:
-- select 'products' t, category, count(*) from public.seller_products where seed_batch = $ts$test-2026-11$ts$ group by category
-- union all select 'catalog', kind, count(*) from public.catalog_items where seed_batch = $ts$test-2026-11$ts$ group by kind
-- union all select 'seminars', '', count(*) from public.seminars where seed_batch = $ts$test-2026-11$ts$
-- union all select 'courses', '', count(*) from public.courses where seed_batch = $ts$test-2026-11$ts$
-- union all select 'promos', '', count(*) from public.seller_promotions where seed_batch = $ts$test-2026-11$ts$;
