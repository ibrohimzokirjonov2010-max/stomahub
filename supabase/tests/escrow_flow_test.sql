-- Lokal (bo‘sh) Postgres’da 0001..0042 dan keyin ishga tushiriladigan oqim testi. LIVE bazada ISHLATMANG.
\set ON_ERROR_STOP 1
begin;
insert into auth.users(id) values ('00000000-0000-0000-0000-00000000000a'),('00000000-0000-0000-0000-00000000000b'),('00000000-0000-0000-0000-00000000000c');
insert into public.profiles(id, name, phone) values
 ('00000000-0000-0000-0000-00000000000a','Admin','+998900000001'),
 ('00000000-0000-0000-0000-00000000000b','Seller','+998900000002'),
 ('00000000-0000-0000-0000-00000000000c','Buyer','+998900000003')
on conflict (id) do update set name = excluded.name;
update public.profiles set role='admin' where id='00000000-0000-0000-0000-00000000000a';
update public.profiles set role='seller', seller_status='approved' where id='00000000-0000-0000-0000-00000000000b';
insert into public.seller_products(id, seller_id, name, price, stock) values ('00000000-0000-0000-0000-0000000000f1','00000000-0000-0000-0000-00000000000b','Plomba',100000,50);
update public.seller_products set status='active' where id='00000000-0000-0000-0000-0000000000f1';

create temp table t_ctx(k text primary key, v text);
grant all on t_ctx to authenticated;
-- buyer: cash + click
set local role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000c', true);
insert into t_ctx select 'cash', (buyer_create_order('{"name":"Ali Valiyev","phone":"901234567","address":"Toshkent","payment_method":"cash","payment_ref":"FAKE","items":[{"product_id":"00000000-0000-0000-0000-0000000000f1","qty":2}]}')->'orders'->0->>'id');
insert into t_ctx select 'click', (buyer_create_order('{"name":"Ali Valiyev","phone":"901234567","address":"Toshkent","payment_method":"click","payment_ref":"FAKE-PAID","items":[{"product_id":"00000000-0000-0000-0000-0000000000f1","qty":1}]}')->'orders'->0->>'id');
do $$ begin perform buyer_create_order('{"name":"Ali","phone":"901234567","address":"Toshkent","payment_method":"uzcard","items":[{"product_id":"00000000-0000-0000-0000-0000000000f1","qty":1}]}'); raise exception 'FAIL uzcard allowed'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end $$;
reset role;
select 'T1 all pending', bool_and(payment_status='pending') from seller_orders;

-- seller tries to tamper
set local role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b', true);
do $$ begin update seller_orders set payment_status='released' where id=(select v::uuid from t_ctx where k='click'); raise exception 'FAIL tamper'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; raise notice 'T2 ok: %', sqlerrm; end $$;
do $$ begin update seller_orders set status='qabul_qilindi' where id=(select v::uuid from t_ctx where k='click'); raise exception 'FAIL unpaid advance'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; raise notice 'T3 ok: %', sqlerrm; end $$;
do $$ begin update seller_order_items set price=1 where seller_id='00000000-0000-0000-0000-00000000000b'; if found then raise exception 'FAIL items'; end if; exception when others then if sqlerrm like 'FAIL%' then raise; end if; raise notice 'T4 ok: %', sqlerrm; end $$;
-- cash flow by seller
update seller_orders set status='tasdiqlandi' where id=(select v::uuid from t_ctx where k='cash');
update seller_orders set status='tayyorlanmoqda' where id=(select v::uuid from t_ctx where k='cash');
update seller_orders set status='yetkazilmoqda' where id=(select v::uuid from t_ctx where k='cash');
update seller_orders set status='yetkazildi' where id=(select v::uuid from t_ctx where k='cash');
reset role;
select 'T5 cash paid', payment_status='paid' and delivered_at is not null from seller_orders where id=(select v::uuid from t_ctx where k='cash');

-- gateway marks click paid (service)
select 'T6', payment_mark_paid('click', o.code, '999001', o.subtotal, o.id)->>'state' from seller_orders o where id=(select v::uuid from t_ctx where k='click');
select 'T6 held', payment_status from seller_orders where id=(select v::uuid from t_ctx where k='click');
select 'T6 idempotent', payment_mark_paid('click', o.code, '999001', o.subtotal, o.id)->>'idempotent' from seller_orders o where id=(select v::uuid from t_ctx where k='click');

set local role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b', true);
update seller_orders set status='tasdiqlandi' where id=(select v::uuid from t_ctx where k='click');
update seller_orders set status='tayyorlanmoqda' where id=(select v::uuid from t_ctx where k='click');
update seller_orders set status='yetkazilmoqda' where id=(select v::uuid from t_ctx where k='click');
update seller_orders set status='yetkazildi' where id=(select v::uuid from t_ctx where k='click');
select 'T7 wallet held', seller_wallet();
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000c', true);
select 'T8 dispute', buyer_open_dispute((select v::uuid from t_ctx where k='click'), 'Mahsulot singan keldi');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b', true);
do $$ begin update seller_orders set internal_note='x', status='bekor_qilindi' where id=(select v::uuid from t_ctx where k='click'); raise exception 'FAIL dispute'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; raise notice 'T9 ok: %', sqlerrm; end $$;
reset role;
update seller_orders set delivered_at = now() - interval '5 days' where id=(select v::uuid from t_ctx where k='click');
select 'T10 auto skips dispute', escrow_auto_release(3)->>'released';
set local role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a', true);
select 'T11 admin release', admin_escrow_release((select v::uuid from t_ctx where k='click'))->>'amount';
select 'T12 escrow', admin_escrow(1,10,'','all')->'summary';
select 'T13 payouts', admin_seller_payouts('kutilmoqda','',1,10)->'summary';
select 'T14 pay', admin_mark_seller_paid('00000000-0000-0000-0000-00000000000b','PP-123');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b', true);
select 'T15 wallet', seller_wallet();
select 'T16 ledger visible', count(*) from seller_payout_ledger;
reset role;
select 'T17 dispute', dispute_status, payment_status from seller_orders where id=(select v::uuid from t_ctx where k='click');

-- 2-ssenariy: avto-chiqarish, summa nomuvofiq, bekor → refund_pending → refunded
set local role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000c', true);
insert into t_ctx select 'p2', (buyer_create_order('{"name":"Ali Valiyev","phone":"901234567","address":"Toshkent","payment_method":"payme","items":[{"product_id":"00000000-0000-0000-0000-0000000000f1","qty":1}]}')->'orders'->0->>'id');
insert into t_ctx select 'p3', (buyer_create_order('{"name":"Ali Valiyev","phone":"901234567","address":"Toshkent","payment_method":"payme","items":[{"product_id":"00000000-0000-0000-0000-0000000000f1","qty":1}]}')->'orders'->0->>'id');
reset role;
do $$ begin perform payment_mark_paid('payme', o.code, 'x', 5, o.id) from seller_orders o where id=(select v::uuid from t_ctx where k='p2'); raise exception 'FAIL amount'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; raise notice 'T20 ok: %', sqlerrm; end $$;
select 'T21', payment_mark_paid('payme', o.code, 'pm-'||o.code, o.subtotal, o.id)->>'state' from seller_orders o where id in (select v::uuid from t_ctx where k in ('p2','p3'));
set local role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b', true);
update seller_orders set status='tasdiqlandi' where id in (select v::uuid from t_ctx where k in ('p2','p3'));
update seller_orders set status='tayyorlanmoqda' where id=(select v::uuid from t_ctx where k='p2');
update seller_orders set status='yetkazilmoqda' where id=(select v::uuid from t_ctx where k='p2');
update seller_orders set status='yetkazildi' where id=(select v::uuid from t_ctx where k='p2');
update seller_orders set status='bekor_qilindi', cancel_reason='Zaxira tugadi' where id=(select v::uuid from t_ctx where k='p3');
reset role;
select 'T22 cancel held', payment_status from seller_orders where id=(select v::uuid from t_ctx where k='p3');
update seller_orders set delivered_at = now() - interval '4 days' where id=(select v::uuid from t_ctx where k='p2');
select 'T23 auto', escrow_auto_release(3)->>'released';
set local role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a', true);
select 'T24 manual refund', admin_escrow_mark_refunded((select v::uuid from t_ctx where k='p3'), 'Bank orqali qaytarildi')->>'payment_status';
reset role;
set local role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b', true);
select 'T26 manual order', (public.seller_create_manual_order('{"customer_name":"Ali","items":[{"product_id":"00000000-0000-0000-0000-0000000000f1","qty":1}]}'::jsonb)) ? 'code';
reset role;
select 'T25 final', string_agg(payment_status, ',' order by payment_status) from seller_orders;
rollback;
