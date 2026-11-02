-- Local-only e2e for 0043 (run against a throwaway Postgres; never against prod).
\set ON_ERROR_STOP 1
set client_min_messages = warning;
-- fixtures (as postgres)
insert into auth.users (id, email) values
 ('00000000-0000-0000-0000-0000000000a1','s1@t'),('00000000-0000-0000-0000-0000000000a2','s2@t'),
 ('00000000-0000-0000-0000-0000000000ad','ad@t'),('00000000-0000-0000-0000-0000000000b1','b1@t') on conflict do nothing;
insert into public.profiles (id, role, name, shop_name, seller_status) values
 ('00000000-0000-0000-0000-0000000000a1','seller','S1','Dok1','approved'),
 ('00000000-0000-0000-0000-0000000000a2','seller','S2','Dok2','approved'),
 ('00000000-0000-0000-0000-0000000000ad','admin','Ad','','none'),
 ('00000000-0000-0000-0000-0000000000b1','customer','B1','','none')
 on conflict (id) do update set role = excluded.role, seller_status = excluded.seller_status;
insert into public.seller_products (id, seller_id, name, price, status, category) values
 ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', 'Kompozit', 100000, 'active', 'Terapiya')
 on conflict do nothing;
insert into public.seller_products (id, seller_id, name, price, status, category) values
 ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000a1', 'Qoralama', 1000, 'draft', 'Terapiya'),
 ('00000000-0000-0000-0000-0000000000f3', '00000000-0000-0000-0000-0000000000a2', 'Begona', 1000, 'active', 'Terapiya')
 on conflict do nothing;

create or replace function pg_temp.as_user(u text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', coalesce(u,''), false); end $$;
create or replace function pg_temp.expect_fail(sql text, needle text) returns void language plpgsql as $$
begin
  begin execute sql; exception when others then
    if position(needle in sqlerrm) = 0 then raise exception 'wrong error for %: %', sql, sqlerrm; end if;
    raise notice 'OK fail: %', needle; return; end;
  raise exception 'expected failure: %', sql;
end $$;
grant execute on all functions in schema pg_temp to authenticated, anon;

\echo === seller S1 creates campaigns
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
set role authenticated;
-- own draft / foreign product rejected
select pg_temp.expect_fail($q$insert into public.seller_campaigns (title, kind, product_ids, daily_budget, total_budget, starts_on, ends_on) values ('Test', 'qidiruv', array['00000000-0000-0000-0000-0000000000f2']::uuid[], 20000, 100000, public.ads_today(), public.ads_today()+7)$q$, 'faol) mahsulot');
select pg_temp.expect_fail($q$insert into public.seller_campaigns (title, kind, product_ids, daily_budget, total_budget, starts_on, ends_on) values ('Test', 'qidiruv', array['00000000-0000-0000-0000-0000000000f3']::uuid[], 20000, 100000, public.ads_today(), public.ads_today()+7)$q$, 'faol) mahsulot');
select pg_temp.expect_fail($q$insert into public.seller_campaigns (title, kind, product_ids, daily_budget, total_budget, starts_on, ends_on) values ('Test', 'qidiruv', array['00000000-0000-0000-0000-0000000000f1']::uuid[], 5000, 100000, public.ads_today(), public.ads_today()+7)$q$, 'Kunlik byudjet');
select pg_temp.expect_fail($q$insert into public.seller_campaigns (title, kind, product_ids, daily_budget, total_budget, starts_on, ends_on) values ('Test', 'qidiruv', array['00000000-0000-0000-0000-0000000000f1']::uuid[], 20000, 100000, public.ads_today(), public.ads_today()-1)$q$, 'Tugash sanasi');
select pg_temp.expect_fail($q$insert into public.seller_campaigns (title, kind, product_ids, daily_budget, total_budget, starts_on, ends_on) values ('Test', 'qidiruv', array['00000000-0000-0000-0000-0000000000f1']::uuid[], 20000, 100000, public.ads_today()-3, public.ads_today()+1)$q$, 'bugundan oldin');
select pg_temp.expect_fail($q$insert into public.seller_campaigns (title, kind, product_ids, daily_budget, total_budget, starts_on, ends_on) values ('Banner', 'banner', array['00000000-0000-0000-0000-0000000000f1']::uuid[], 20000, 100000, public.ads_today(), public.ads_today()+7)$q$, 'rasm majburiy');
select pg_temp.expect_fail($q$insert into public.seller_campaigns (title, kind, product_ids, daily_budget, total_budget, starts_on, ends_on, image_url) values ('Banner', 'banner', array['00000000-0000-0000-0000-0000000000f1']::uuid[], 20000, 100000, public.ads_today(), public.ads_today()+7, 'https://x.supabase.co/b.jpg')$q$, 'sarlavha kiriting');
select pg_temp.expect_fail($q$insert into public.seller_campaigns (title, kind, product_ids, daily_budget, total_budget, starts_on, ends_on, image_url, headline, cta_text) values ('Banner', 'banner', array['00000000-0000-0000-0000-0000000000f1']::uuid[], 20000, 100000, public.ads_today(), public.ads_today()+7, 'https://x.supabase.co/b.jpg', 'Implant', 'Bu tugma yozuvi juda ham uzun matn')$q$, 'Tugma yozuvi');
insert into public.seller_campaigns (id, title, kind, product_ids, daily_budget, total_budget, starts_on, ends_on, status, approved_at)
 values ('00000000-0000-0000-0000-0000000000c1', 'Kompozit aksiya', 'qidiruv', array['00000000-0000-0000-0000-0000000000f1']::uuid[], 20000, 100000, public.ads_today(), public.ads_today()+7, 'faol', now());
select status, approved_at is null as not_approved from public.seller_campaigns where id = '00000000-0000-0000-0000-0000000000c1';
-- cannot self-activate / self-approve
select pg_temp.expect_fail($q$update public.seller_campaigns set status='faol' where id='00000000-0000-0000-0000-0000000000c1'$q$, 'holatni');
select pg_temp.expect_fail($q$update public.seller_campaigns set approved_at=now() where id='00000000-0000-0000-0000-0000000000c1'$q$, 'administrator');
-- cannot write stats or legacy topups / requests directly
select pg_temp.expect_fail($q$insert into public.seller_ad_stats (campaign_id, seller_id, spent) values ('00000000-0000-0000-0000-0000000000c1','00000000-0000-0000-0000-0000000000a1',-99999)$q$, 'permission');
select pg_temp.expect_fail($q$insert into public.seller_ad_topups (seller_id, amount) values ('00000000-0000-0000-0000-0000000000a1', 999999)$q$, 'permission');
select pg_temp.expect_fail($q$insert into public.seller_ad_topup_requests (seller_id, amount, method, status) values ('00000000-0000-0000-0000-0000000000a1', 999999, 'naqd', 'tasdiqlandi')$q$, 'permission');
select pg_temp.expect_fail($q$select public.seller_ad_track('00000000-0000-0000-0000-0000000000c1', null, 'click')$q$, 'permission');

\echo === top-up request
select pg_temp.expect_fail($q$select public.seller_ad_topup_request(1000, 'naqd')$q$, '50 000');
select pg_temp.expect_fail($q$select public.seller_ad_topup_request(100000, 'click')$q$, 'usulini');
select pg_temp.expect_fail($q$select public.seller_ad_topup_request(100000, 'bank', 'https://x/storage/v1/object/public/seller-media/someoneelse/a.jpg')$q$, 'Chek');
select status, method from public.seller_ad_topup_request(100000, 'bank', 'https://p.supabase.co/storage/v1/object/public/seller-media/00000000-0000-0000-0000-0000000000a1/ad-receipts/r.jpg', 'Kapitalbank') ;
select public.seller_ad_balance() as bal_pending_only;  -- 0
select pg_temp.expect_fail($q$select public.admin_review_ad_topup((select id from public.seller_ad_topup_requests limit 1), 'confirm')$q$, 'Faqat admin');
select pg_temp.expect_fail($q$select public.admin_review_campaign('00000000-0000-0000-0000-0000000000c1', 'approve')$q$, 'Faqat admin');
reset role;

\echo === admin approves campaign (no balance -> paused Balans tugadi), confirms top-up (-> faol)
select id as topup_id from public.seller_ad_topup_requests limit 1 \gset
select pg_temp.as_user('00000000-0000-0000-0000-0000000000ad');
set role authenticated;
select public.admin_review_campaign('00000000-0000-0000-0000-0000000000c1', 'approve');
select public.admin_review_ad_topup(:'topup_id', 'confirm');
select pg_temp.expect_fail($q$select public.admin_review_ad_topup('$q$ || :'topup_id' || $q$', 'confirm')$q$, 'allaqachon');
select status, pause_reason from public.seller_campaigns where id = '00000000-0000-0000-0000-0000000000c1';
select (public.admin_ad_topups_list('all'))->'counts' as counts;
select (public.admin_campaigns_list('all'))->'counts' as ccounts;
reset role;
select status, pause_reason from public.seller_campaigns where id = '00000000-0000-0000-0000-0000000000c1';

\echo === placements visible to anon
select pg_temp.as_user(null);
set role anon;
select count(*) as placements from public.ads_placements('qidiruv');
select count(*) as wrong_kind from public.ads_placements('banner');
select pg_temp.expect_fail($q$select public.seller_ad_balance('00000000-0000-0000-0000-0000000000a1')$q$, 'permission');

\echo === tracking: views dedupe, clicks dedupe/charge
select public.ad_track('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000f1', 'view', 'sess-aaaaaaaaaaaaaaaa');
select public.ad_track('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000f1', 'view', 'sess-aaaaaaaaaaaaaaaa');
select public.ad_track('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000f1', 'click', 'sess-aaaaaaaaaaaaaaaa');
select public.ad_track('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000f1', 'click', 'sess-aaaaaaaaaaaaaaaa');
select public.ad_track('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000f3', 'click', 'sess-aaaaaaaaaaaaaaaa') as foreign_product;
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
set role authenticated;
select public.ad_track('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000f1', 'click', '') as own_click;
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
set role authenticated;
select public.ad_track('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000f1', 'click', '') as buyer_click;
reset role;
select impressions, clicks, spent from public.seller_ad_stats where campaign_id = '00000000-0000-0000-0000-0000000000c1';
select public.seller_ad_balance('00000000-0000-0000-0000-0000000000a1') as bal_after; -- 98000

\echo === seller toggles, content edit -> moderatsiyada, delete blocked
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
set role authenticated;
update public.seller_campaigns set status = 'toxtatilgan' where id = '00000000-0000-0000-0000-0000000000c1';
update public.seller_campaigns set status = 'faol' where id = '00000000-0000-0000-0000-0000000000c1';
update public.seller_campaigns set daily_budget = 30000 where id = '00000000-0000-0000-0000-0000000000c1';
select status from public.seller_campaigns where id = '00000000-0000-0000-0000-0000000000c1';
update public.seller_campaigns set headline = 'Yangi sarlavha' where id = '00000000-0000-0000-0000-0000000000c1';
select status, approved_at is null as reset from public.seller_campaigns where id = '00000000-0000-0000-0000-0000000000c1';
select pg_temp.expect_fail($q$delete from public.seller_campaigns where id='00000000-0000-0000-0000-0000000000c1'$q$, 'o‘chirib');
reset role;

\echo === reject shows reason; auto-pause on empty balance
select pg_temp.as_user('00000000-0000-0000-0000-0000000000ad');
set role authenticated;
select public.admin_review_campaign('00000000-0000-0000-0000-0000000000c1', 'reject', 'Rasm sifati past');
reset role;
select status, reject_reason from public.seller_campaigns where id = '00000000-0000-0000-0000-0000000000c1';
-- approve again, then drain balance to < 1000 and click
update public.seller_campaigns set status='faol', approved_at=now(), reject_reason='' where id = '00000000-0000-0000-0000-0000000000c1';
update public.seller_ad_stats set spent = spent + 98000 where campaign_id = '00000000-0000-0000-0000-0000000000c1';
select pg_temp.as_user(null);
set role anon;
select count(*) as placements_empty from public.ads_placements('qidiruv');
select public.ad_track('00000000-0000-0000-0000-0000000000c1', null, 'click', 'sess-bbbbbbbbbbbbbbbb');
reset role;
select status, pause_reason from public.seller_campaigns where id = '00000000-0000-0000-0000-0000000000c1';
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
set role authenticated;
select pg_temp.expect_fail($q$update public.seller_campaigns set status='faol' where id='00000000-0000-0000-0000-0000000000c1'$q$, 'balansi');
reset role;
\echo ALL DONE
