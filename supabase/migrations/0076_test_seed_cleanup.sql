-- 0076 SINOV (test) MA’LUMOTLARINI O‘CHIRISH — 0075_test_seed.sql ni to‘liq bekor qiladi.
-- QO‘LDA QO‘LLANADI — faqat Ibrohim roziligi bilan. Qayta ishga tushirish xavfsiz.
-- Generatsiya: node scripts/test-seed/build-sql.mjs. Qo‘lda tahrirlamang.
-- Faqat seed_batch = 'test-2026-11' qatorlar va id’si '7e57d000-0000-4000-a000-' bilan boshlanadigan 9 ta sinov hisobi o‘chadi.
-- seed_batch IS NULL qatorlarga (haqiqiy mahsulotlar, StomaHub Market, #STH-00025 / #STH-00029) tegilmaydi.
-- Himoya triggerlari (seed_batch_guard, test_seed_*_gate) va seed_batch ustunlari qoladi — zararsiz, keyingi sinovda kerak.

begin;

-- Aksiyalar avval (sinxron trigger 'deal' qatorlarini o‘zi o‘chiradi)
delete from public.seller_promotions where seed_batch = $ts$test-2026-11$ts$;
delete from public.catalog_items where seed_batch = $ts$test-2026-11$ts$;
delete from public.catalog_items where kind = 'deal' and id like 'sp-7e57d000-0000-4000-d000-%';
delete from public.tickets where seed_batch = $ts$test-2026-11$ts$;
delete from public.seminars where seed_batch = $ts$test-2026-11$ts$;
delete from public.course_lessons where seed_batch = $ts$test-2026-11$ts$;
delete from public.courses where seed_batch = $ts$test-2026-11$ts$;
-- Sinov mahsulotlariga buyurtma bo‘lmaydi (0075 gate), lekin baribir: buyurtma qatori bo‘lsa mahsulot o‘chmaydi
delete from public.seller_products sp where sp.seed_batch = $ts$test-2026-11$ts$
  and not exists (select 1 from public.seller_order_items oi where oi.product_id = sp.id);

-- Sinov hisoblari: profil auth.users dan cascade bilan o‘chadi
delete from auth.users u
 where u.id::text like '7e57d000-0000-4000-a000-%'
   and u.email like 'seed-%@test.stomahub.invalid'
   and exists (select 1 from public.profiles p where p.id = u.id and p.seed_batch = $ts$test-2026-11$ts$)
   and not exists (select 1 from public.seller_order_items oi where oi.seller_id = u.id)
   and not exists (select 1 from public.seller_orders o where o.buyer_id = u.id);
delete from public.profiles where seed_batch = $ts$test-2026-11$ts$ and id::text like '7e57d000-0000-4000-a000-%';

commit;

notify pgrst, 'reload schema';

-- Tekshiruv (hammasi 0 bo‘lishi kerak):
-- select (select count(*) from public.catalog_items where seed_batch = $ts$test-2026-11$ts$) catalog,
--        (select count(*) from public.seller_products where seed_batch = $ts$test-2026-11$ts$) products,
--        (select count(*) from public.seminars where seed_batch = $ts$test-2026-11$ts$) seminars,
--        (select count(*) from public.courses where seed_batch = $ts$test-2026-11$ts$) courses,
--        (select count(*) from public.profiles where seed_batch = $ts$test-2026-11$ts$) profiles;
