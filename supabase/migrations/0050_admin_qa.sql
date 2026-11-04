-- 0050: Admin panel QA tuzatishlari. NOT APPLIED — Supabase SQL editorda qo‘lda ishga tushiriladi.
-- Hech qanday ma’lumot o‘chirilmaydi yoki o‘zgartirilmaydi (faqat funksiyalar, triggerlar va policy).
-- Mavjud buyurtmalar (jumladan STH-00025) tegilmaydi: triggerlar faqat YANGI insert’larda ishlaydi.

-- ---------------------------------------------------------------------------
-- 0. Yordamchilar
-- ---------------------------------------------------------------------------
-- Test akkaunt: is_test bayrog‘i yoki nom/email bo‘yicha (E2E, Audit, Shot User, Bo‘sh Live, live-empty).
create or replace function public.profile_is_test(p_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
     where p.id = p_id and p.role <> 'admin'
       and (coalesce(p.is_test, false)
            or concat_ws(' ', p.name, p.full_name, p.email, p.shop_name)
               ~* '(e2e|\maudit\M|shot user|bo.?sh live|bosh live|live-empty)')
  );
$$;
grant execute on function public.profile_is_test(uuid) to authenticated;

create or replace function public.order_is_test(o public.seller_orders)
returns boolean language sql stable security definer set search_path = public as $$
  select public.profile_is_test(o.buyer_id) or public.profile_is_test(o.seller_id)
      or coalesce(o.customer_name, '') ~* '(e2e|\maudit\M|shot user|bo.?sh live|bosh live)';
$$;
grant execute on function public.order_is_test(public.seller_orders) to authenticated;

-- Viloyat: buyurtma manzilidagi shahar (vergulgacha qism), aks holda null.
create or replace function public.order_region(p_city text)
returns text language sql immutable as $$
  select nullif(trim(split_part(coalesce(p_city, ''), ',', 1)), '');
$$;

-- Admin telefon/emailni to‘liq ko‘radi (QA: admin uchun maskalash kerak emas).
-- Admin bo‘lmagan chaqiruvchi uchun avvalgidek maska qaytariladi.
create or replace function public.admin_mask_phone(p text)
returns text language plpgsql stable security definer set search_path = public as $$
begin
  if coalesce(nullif(trim(p), ''), '') = '' then return null; end if;
  if public.is_admin() then return trim(p); end if;
  return '+998 ** *** ** **';
end $$;

-- ---------------------------------------------------------------------------
-- 1. Moliya: yagona manba admin_money(p_from, p_to, p_exclude_test)
--    Aylanma va komissiya = faqat YETKAZILGAN, demo bo‘lmagan, qaytarilmagan buyurtmalar
--    (davr — buyurtma yaratilgan sana). Naqd kutilmoqda = naqd, bekor qilinmagan, hali to‘lanmagan
--    (payment_status 'pending' YOKI 'held' — naqd buyurtmalar amalda 'held' bo‘lib qoladi).
-- ---------------------------------------------------------------------------
drop function if exists public.admin_money(timestamptz, timestamptz);
create or replace function public.admin_money(p_from timestamptz, p_to timestamptz, p_exclude_test boolean default false)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_from timestamptz := coalesce(p_from, date_trunc('month', now()));
  v_to timestamptz := coalesce(p_to, now());
  v_pct numeric := coalesce((select commission_pct from public.admin_settings where id = 'main'), 12);
  v jsonb;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  with allo as (
    select x.*, public.order_is_demo(x) as demo, coalesce(x.payment_method, '') in ('cash', 'naqd') as is_cash,
           greatest(x.subtotal - coalesce(x.discount_amount, 0), 0) as net,
           (x.status = 'yetkazildi' and coalesce(x.payment_status, '') not in ('refunded', 'refund_pending', 'failed')) as earned
      from public.seller_orders x
     where not (coalesce(p_exclude_test, false) and public.order_is_test(x))
  ), o as (select * from allo where created_at between v_from and v_to),
  led as (select l.* from public.seller_payout_ledger l join allo a on a.id = l.order_id and not a.demo),
  sem as (
    select r.id, coalesce(t.price, 0) as price
      from public.registrations r
      left join public.tickets t on t.id = r.ticket_id
        or (r.ticket_id is null and t.seminar_id = r.seminar_id and t.name = r.ticket)
     where r.pay = 'paid' and r.created_at between v_from and v_to
  ),
  cp as (select * from allo where is_cash and not demo and status <> 'bekor_qilindi'
           and coalesce(payment_status, 'pending') not in ('paid', 'released', 'refunded', 'refund_pending'))
  select jsonb_build_object(
    'orders_count', (select count(*) from o),
    'orders_delivered', (select count(*) from o where earned and not demo),
    'orders_in_progress', (select count(*) from o where status not in ('yetkazildi', 'bekor_qilindi') and not demo),
    'orders_cancelled', (select count(*) from o where status = 'bekor_qilindi'),
    'orders_demo', (select count(*) from o where demo),
    'turnover', coalesce((select sum(subtotal) from o where earned and not demo), 0),
    'turnover_delivered', coalesce((select sum(subtotal) from o where earned and not demo), 0),
    'turnover_in_progress', coalesce((select sum(subtotal) from o where status not in ('yetkazildi', 'bekor_qilindi') and not demo), 0),
    'commission', coalesce((select sum(commission) from o where earned and not demo), 0),
    'commission_online', coalesce((select sum(commission) from o where earned and not demo and not is_cash), 0),
    'commission_cash', coalesce((select sum(commission) from o where earned and not demo and is_cash), 0),
    'commission_all', coalesce((select sum(commission) from allo where earned and not demo), 0),
    'net', coalesce((select sum(payout) from o where earned and not demo), 0),
    'demo_sum', coalesce((select sum(subtotal) from o where demo), 0),
    'escrow', coalesce((select sum(net + coalesce(delivery_fee, 0)) from allo where not is_cash and not demo and payment_status in ('paid', 'held')), 0),
    'escrow_orders', (select count(*) from allo where not is_cash and not demo and payment_status in ('paid', 'held')),
    'released', coalesce((select sum(gross) from led), 0),
    'released_orders', (select count(*) from led),
    'refund_pending', coalesce((select sum(net + coalesce(delivery_fee, 0)) from allo where not demo and payment_status = 'refund_pending'), 0),
    'refund_pending_orders', (select count(*) from allo where not demo and payment_status = 'refund_pending'),
    'disputes_open', (select count(*) from allo where not demo and dispute_status = 'open'),
    'online_unpaid_orders', (select count(*) from allo where not is_cash and not demo and payment_status = 'pending' and status <> 'bekor_qilindi'),
    'cash_pending', coalesce((select sum(net + coalesce(delivery_fee, 0)) from cp), 0),
    'cash_pending_orders', (select count(*) from cp),
    'cash_paid', coalesce((select sum(net + coalesce(delivery_fee, 0)) from allo where is_cash and not demo and payment_status in ('paid', 'released')), 0),
    'seller_earned', coalesce((select sum(amount) from led), 0),
    'payouts_paid', coalesce((select sum(paid_amount) from led), 0)
                  + coalesce((select sum(amount) from public.seller_payouts where status = 'tolandi' and not ledger_allocated), 0),
    'payouts_requested', coalesce((select sum(amount) from public.seller_payouts where status = 'kutilmoqda'), 0),
    'seminar_revenue', coalesce((select sum(price) from sem), 0),
    'seminar_paid_count', (select count(*) from sem),
    'seminar_commission', round(coalesce((select sum(price) from sem), 0) * v_pct / 100),
    'commission_pct', v_pct,
    'exclude_test', coalesce(p_exclude_test, false),
    'by_method', coalesce((select jsonb_agg(jsonb_build_object('method', m, 'count', c, 'sum', s, 'cancelled', cc, 'demo', dc) order by c desc)
      from (select coalesce(nullif(payment_method, ''), 'boshqa') m, count(*)::int c,
                   coalesce(sum(subtotal) filter (where earned and not demo), 0) s,
                   count(*) filter (where status = 'bekor_qilindi')::int cc, count(*) filter (where demo)::int dc
              from o group by 1) q), '[]'::jsonb)
  ) into v;
  v := v || jsonb_build_object('seller_payable', greatest(0, coalesce((select sum(amount - paid_amount) from public.seller_payout_ledger where status = 'kutilmoqda'), 0)));
  return v;
end $$;
revoke all on function public.admin_money(timestamptz, timestamptz, boolean) from public, anon;
grant execute on function public.admin_money(timestamptz, timestamptz, boolean) to authenticated;

-- admin_finance: 3-argumentli (test akkauntlarni chiqarish ixtiyoriy).
drop function if exists public.admin_finance(timestamptz, timestamptz);
create or replace function public.admin_finance(p_from timestamptz default null, p_to timestamptz default null, p_exclude_test boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare m jsonb := public.admin_money(p_from, p_to, p_exclude_test);
begin
  return public.admin_finance_base(p_from, p_to) || m || jsonb_build_object(
    'payout', m->'seller_payable', 'payouts_pending', m->'seller_payable',
    'commission_rate', (m->>'commission_pct')::numeric / 100);
end $$;
revoke all on function public.admin_finance(timestamptz, timestamptz, boolean) from public, anon;
grant execute on function public.admin_finance(timestamptz, timestamptz, boolean) to authenticated;

-- admin_reports: aylanma/komissiya admin_money’dan; grafik, top sotuvchilar va kategoriyalar — faqat yetkazilgan.
drop function if exists public.admin_reports(timestamptz, timestamptz);
create or replace function public.admin_reports(p_from timestamptz default null, p_to timestamptz default null, p_exclude_test boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_from timestamptz := coalesce(p_from, date_trunc('month', now()));
  v_to timestamptz := coalesce(p_to, now());
  v_ex boolean := coalesce(p_exclude_test, false);
  m jsonb;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  m := public.admin_money(v_from, v_to, v_ex);
  return jsonb_build_object(
    'turnover', m->'turnover', 'commission', m->'commission', 'commission_pct', m->'commission_pct',
    'turnover_in_progress', m->'turnover_in_progress',
    'orders', m->'orders_count', 'orders_delivered', m->'orders_delivered',
    'orders_in_progress', m->'orders_in_progress', 'orders_cancelled', m->'orders_cancelled',
    'users_new', (select count(*) from public.profiles p where p.created_at between v_from and v_to and p.role <> 'admin'
                    and not (v_ex and public.profile_is_test(p.id))),
    'sellers_new', (select count(*) from public.profiles p where p.created_at between v_from and v_to and p.role = 'seller'
                    and not (v_ex and public.profile_is_test(p.id))),
    'daily', coalesce((
      select jsonb_agg(jsonb_build_object('day', d, 'sum', s, 'orders', n) order by d) from (
        select extract(day from o.created_at at time zone 'Asia/Tashkent')::int d, sum(o.subtotal) s, count(*)::int n
          from public.seller_orders o
         where o.created_at between v_from and v_to and o.status = 'yetkazildi' and not public.order_is_demo(o)
           and coalesce(o.payment_status, '') not in ('refunded', 'refund_pending', 'failed')
           and not (v_ex and public.order_is_test(o))
         group by 1) x), '[]'::jsonb),
    'top_sellers', coalesce((
      select jsonb_agg(jsonb_build_object('shop', shop, 'sum', s, 'orders', n) order by s desc) from (
        select coalesce(nullif(p.shop_name, ''), nullif(p.name, ''), p.email) shop, sum(o.subtotal) s, count(*)::int n
          from public.seller_orders o join public.profiles p on p.id = o.seller_id
         where o.created_at between v_from and v_to and o.status = 'yetkazildi' and not public.order_is_demo(o)
           and coalesce(o.payment_status, '') not in ('refunded', 'refund_pending', 'failed')
           and not (v_ex and public.order_is_test(o))
         group by 1 order by 2 desc limit 10) t), '[]'::jsonb),
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object('name', category, 'sum', s, 'orders', n) order by s desc) from (
        select coalesce(nullif(pr.category, ''), 'Boshqa') category, sum(i.total) s, count(distinct i.order_id)::int n
          from public.seller_order_items i
          left join public.seller_products pr on pr.id = i.product_id
          join public.seller_orders o on o.id = i.order_id
         where o.created_at between v_from and v_to and o.status = 'yetkazildi' and not public.order_is_demo(o)
           and coalesce(o.payment_status, '') not in ('refunded', 'refund_pending', 'failed')
           and not (v_ex and public.order_is_test(o))
         group by 1 order by 2 desc limit 10) c), '[]'::jsonb),
    -- Test akkauntlar va ehtimoliy dublikatlar (faqat ro‘yxat; hech narsa o‘chirilmaydi)
    'test_accounts', coalesce((
      select jsonb_agg(jsonb_build_object('id', p.id, 'name', coalesce(nullif(p.name, ''), nullif(p.full_name, ''), split_part(p.email, '@', 1)),
                                          'email', p.email, 'role', p.role) order by p.created_at)
        from public.profiles p where public.profile_is_test(p.id)), '[]'::jsonb),
    'duplicates', coalesce((
      select jsonb_agg(jsonb_build_object('name', k, 'count', n, 'emails', emails) order by k) from (
        select lower(trim(coalesce(nullif(p.full_name, ''), p.name))) k, count(*)::int n, jsonb_agg(p.email) emails
          from public.profiles p where coalesce(nullif(p.full_name, ''), p.name, '') <> ''
         group by 1 having count(*) > 1) d), '[]'::jsonb)
  );
end $$;
revoke all on function public.admin_reports(timestamptz, timestamptz, boolean) from public, anon;
grant execute on function public.admin_reports(timestamptz, timestamptz, boolean) to authenticated;

-- admin_escrow: komissiya — admin_money’dagi yagona ta’rif (barcha davr).
create or replace function public.admin_escrow(p_page int default 1, p_page_size int default 10, p_q text default '', p_tab text default 'all')
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_page int := greatest(1, coalesce(p_page, 1));
  v_size int := least(50, greatest(1, coalesce(p_page_size, 10)));
  v_q text := lower(trim(coalesce(p_q, '')));
  v_days int := 3;
  m jsonb; v_total bigint; v_rows jsonb;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  m := public.admin_money(null, null);
  with f as (
    select o.*, coalesce(nullif(s.shop_name, ''), s.name) as shop_name
      from public.seller_orders o join public.profiles s on s.id = o.seller_id
     where not public.order_is_demo(o)
       and (case coalesce(p_tab, 'all')
              when 'held' then o.payment_status in ('held', 'paid') and coalesce(o.payment_method, 'cash') not in ('cash', 'naqd')
              when 'dispute' then o.dispute_status = 'open'
              when 'refund' then o.payment_status = 'refund_pending'
              when 'released' then o.payment_status = 'released'
              when 'cash' then coalesce(o.payment_method, 'cash') in ('cash', 'naqd') and o.status <> 'bekor_qilindi'
              else (o.status <> 'bekor_qilindi' or o.payment_status in ('refund_pending', 'refunded'))
            end)
       and (v_q = '' or lower(o.code) like '%' || v_q || '%' or lower(coalesce(s.shop_name, s.name, '')) like '%' || v_q || '%')
  )
  select count(*), coalesce((select jsonb_agg(row_to_json(x)::jsonb) from (
      select f.id, f.code, f.status, f.subtotal, f.discount_amount, f.delivery_fee, f.payment_method, f.payment_status, f.payment_ref,
             greatest(f.subtotal - coalesce(f.discount_amount, 0), 0) + coalesce(f.delivery_fee, 0) as amount,
             f.commission, f.payout,
             f.tracking_url, f.customer_name, f.address, f.city, f.created_at, f.delivered_at,
             f.escrow_released_at, f.escrow_refund_reason, f.dispute_status, f.dispute_reason, f.dispute_opened_at,
             f.buyer_confirmed_at, f.refund_method,
             case when f.payment_status = 'held' and f.delivered_at is not null and f.dispute_status <> 'open'
                  then f.delivered_at + make_interval(days => v_days) end as auto_release_at,
             f.shop_name, public.admin_mask_phone(f.customer_phone) as customer_phone
        from f order by (f.dispute_status = 'open') desc, (f.payment_status = 'refund_pending') desc, f.created_at desc
       limit v_size offset (v_page - 1) * v_size) x), '[]'::jsonb)
    into v_total, v_rows from f;

  return jsonb_build_object(
    'summary', jsonb_build_object(
      'held', m->'escrow', 'orders_held', m->'escrow_orders',
      'released', m->'released', 'released_orders', m->'released_orders',
      'commission', m->'commission_all',
      'cash_pending', m->'cash_pending', 'cash_pending_orders', m->'cash_pending_orders',
      'refund_pending', m->'refund_pending', 'refund_pending_orders', m->'refund_pending_orders',
      'disputes_open', m->'disputes_open', 'seller_payable', m->'seller_payable'),
    'total', v_total, 'page', v_page, 'page_size', v_size, 'rows', v_rows);
end $$;
revoke all on function public.admin_escrow(int, int, text, text) from public, anon;
grant execute on function public.admin_escrow(int, int, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Foydalanuvchilar: haqiqiy rollar + rol filtri + buyurtmadan ism/telefon/shahar
-- ---------------------------------------------------------------------------
create or replace function public.admin_user_roles(p public.profiles)
returns text[] language sql stable security definer set search_path = public as $$
  select array_remove(array[
    case when p.role = 'admin' then 'admin' end,
    case when p.role = 'seller' or coalesce(p.seller_status, 'none') not in ('none', '')
              or exists (select 1 from public.seller_products sp where sp.seller_id = p.id) then 'seller' end,
    case when p.role = 'organizer' or coalesce(p.org_status, 'none') not in ('none', '')
              or exists (select 1 from public.seminars sm where sm.organizer_id = p.id) then 'organizer' end,
    case when p.role = 'clinic' or coalesce(p.user_type, '') in ('klinika', 'clinic') then 'clinic' end,
    case when coalesce(p.user_type, '') = 'shifokor' then 'shifokor' end,
    case when coalesce(p.user_type, '') = 'talaba' then 'talaba' end
  ], null);
$$;

create or replace function public.admin_users_list(p_tab text default 'all', p_q text default '', p_page int default 1, p_page_size int default 10)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_page int := greatest(1, coalesce(p_page, 1));
  v_size int := least(50, greatest(1, coalesce(p_page_size, 10)));
  v_q text := lower(trim(coalesce(p_q, '')));
  v jsonb;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  with base as (
    select p.*, public.admin_user_roles(p) as roles, public.profile_is_test(p.id) as is_test_acc,
           lo.customer_name as o_name, lo.customer_phone as o_phone, lo.city as o_city
      from public.profiles p
      left join lateral (select o.customer_name, o.customer_phone, o.city from public.seller_orders o
                          where o.buyer_id = p.id order by o.created_at desc limit 1) lo on true
  ), s as (
    select b.*,
           coalesce(nullif(b.name, ''), nullif(b.full_name, ''), nullif(b.o_name, ''), nullif(split_part(b.email, '@', 1), ''), '—') as d_name,
           coalesce(nullif(b.phone, ''), nullif(b.o_phone, '')) as d_phone,
           coalesce(nullif(b.city, ''), public.order_region(b.o_city)) as d_city
      from base b
  ), f as (
    select * from s
     where (coalesce(p_tab, 'all') = 'all' or (p_tab = 'test' and is_test_acc) or p_tab = any(roles))
       and (v_q = '' or lower(d_name) like '%'||v_q||'%' or lower(coalesce(email, '')) like '%'||v_q||'%'
            or lower(coalesce(d_city, '')) like '%'||v_q||'%' or coalesce(d_phone, '') like '%'||v_q||'%')
  )
  select jsonb_build_object(
    'total', (select count(*) from f),
    'counts', (select jsonb_build_object('all', count(*),
        'shifokor', count(*) filter (where 'shifokor' = any(roles)), 'talaba', count(*) filter (where 'talaba' = any(roles)),
        'seller', count(*) filter (where 'seller' = any(roles)), 'organizer', count(*) filter (where 'organizer' = any(roles)),
        'clinic', count(*) filter (where 'clinic' = any(roles)), 'admin', count(*) filter (where 'admin' = any(roles)),
        'test', count(*) filter (where is_test_acc)) from s),
    'page', v_page, 'page_size', v_size,
    'rows', coalesce((select jsonb_agg(row_to_json(x)::jsonb) from (
        select f.id, f.d_name as name, f.email, f.avatar, f.user_type, f.role, f.roles, f.d_city as city, f.specialty, f.created_at,
               f.d_phone as phone, f.blocked, f.block_reason, f.blocked_at, f.is_test_acc as is_test
          from f order by f.created_at desc limit v_size offset (v_page - 1) * v_size) x), '[]'::jsonb)) into v;
  return v;
end $$;
grant execute on function public.admin_users_list(text, text, int, int) to authenticated;

create or replace function public.admin_user_detail(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; p public.profiles; lo public.seller_orders;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  select * into p from public.profiles where id = p_id;
  if p.id is null then raise exception 'Foydalanuvchi topilmadi'; end if;
  select * into lo from public.seller_orders where buyer_id = p_id order by created_at desc limit 1;
  v := jsonb_build_object(
    'id', p.id, 'name', coalesce(nullif(p.name, ''), nullif(p.full_name, ''), nullif(lo.customer_name, ''), split_part(p.email, '@', 1)),
    'email', p.email, 'avatar', p.avatar, 'user_type', p.user_type, 'role', p.role, 'roles', public.admin_user_roles(p),
    'specialty', p.specialty, 'clinic', p.clinic,
    'city', coalesce(nullif(p.city, ''), public.order_region(lo.city)),
    'address', coalesce(nullif(p.address, ''), lo.address),
    'about', p.about, 'license', p.license, 'created_at', p.created_at,
    'phone', coalesce(nullif(p.phone, ''), nullif(lo.customer_phone, '')),
    'contact_from_order', (coalesce(p.phone, '') = '' and coalesce(lo.customer_phone, '') <> ''),
    'blocked', p.blocked, 'block_reason', p.block_reason, 'blocked_at', p.blocked_at,
    'blocked_by_name', (select name from public.profiles b where b.id = p.blocked_by),
    'orders_count', (select count(*) from public.seller_orders where buyer_id = p_id),
    'ads_count', (select count(*) from public.seller_campaigns c where c.seller_id = p_id),
    'is_test', public.profile_is_test(p_id),
    'code', 'USR-' || lpad((abs(hashtext(p.id::text)) % 1000000)::text, 6, '0'));
  return v;
end $$;
grant execute on function public.admin_user_detail(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Sotuvchilar: seller_status null/'none' -> 'registered' (tablar yig‘indisi = jami)
-- ---------------------------------------------------------------------------
create or replace function public.admin_sellers_list(p_tab text default 'all', p_q text default '', p_page int default 1, p_page_size int default 10)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_page int := greatest(1, coalesce(p_page, 1));
  v_size int := least(50, greatest(1, coalesce(p_page_size, 10)));
  v_q text := lower(trim(coalesce(p_q, '')));
  v jsonb;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  with s as (
    select p.*,
           case when p.role = 'admin' then 'approved'
                when coalesce(p.blocked, false) then 'blocked'
                when coalesce(p.seller_status, 'none') in ('none', '') then 'registered'
                when p.seller_status in ('approved', 'pending', 'registered', 'rejected', 'blocked') then p.seller_status
                else 'registered' end as st,
           coalesce(nullif(p.name, ''), nullif(p.full_name, ''), split_part(p.email, '@', 1)) as d_name
      from public.profiles p
     where coalesce(p.seller_status, 'none') not in ('none', '') or p.role = 'seller'
        or exists (select 1 from public.seller_products sp where sp.seller_id = p.id)
  ), f as (
    select * from s where (p_tab = 'all' or st = p_tab)
      and (v_q = '' or lower(d_name) like '%'||v_q||'%' or lower(coalesce(shop_name, '')) like '%'||v_q||'%'
           or lower(coalesce(email, '')) like '%'||v_q||'%'
           or lower(coalesce(city, '')) like '%'||v_q||'%' or coalesce(phone, '') like '%'||v_q||'%')
  )
  select jsonb_build_object(
    'total', (select count(*) from f),
    'counts', (select jsonb_build_object('all', count(*),
        'approved', count(*) filter (where st = 'approved'), 'pending', count(*) filter (where st = 'pending'),
        'registered', count(*) filter (where st = 'registered'), 'rejected', count(*) filter (where st = 'rejected'),
        'blocked', count(*) filter (where st = 'blocked')) from s),
    'page', v_page, 'page_size', v_size,
    'rows', coalesce((select jsonb_agg(row_to_json(x)::jsonb) from (
        select f.id, f.d_name as name, f.email, f.shop_name, f.avatar, f.city, f.st as seller_status, f.seller_applied_at, f.created_at,
               f.role = 'admin' as official, public.admin_mask_phone(f.phone) as phone,
               coalesce(jsonb_array_length(f.seller_docs), 0) as docs_count,
               (select count(*) from public.seller_products sp where sp.seller_id = f.id) as products_count,
               (select count(*) from public.seller_products sp where sp.seller_id = f.id and sp.status = 'active') as products_active
          from f order by (f.role = 'admin') desc, coalesce(f.seller_applied_at, f.created_at) desc
         limit v_size offset (v_page - 1) * v_size) x), '[]'::jsonb)) into v;
  return v;
end $$;
grant execute on function public.admin_sellers_list(text, text, int, int) to authenticated;

-- Rasmiy do‘kon kartasi uchun real ma’lumot: official, mahsulot/buyurtma soni, organizer_settings nomi.
create or replace function public.admin_seller_application(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r public.profiles%rowtype;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  select * into r from public.profiles where id = p_id;
  if r.id is null then raise exception 'Sotuvchi topilmadi'; end if;
  return jsonb_build_object(
    'id', r.id, 'name', coalesce(nullif(r.name, ''), nullif(r.full_name, ''), split_part(r.email, '@', 1)),
    'phone', r.phone, 'email', r.email, 'shop_name', r.shop_name, 'shop_type', nullif(r.shop_type, ''),
    'address', coalesce(nullif(r.shop_address, ''), nullif(r.clinic, ''), ''),
    'shop_address', r.shop_address, 'org_type', r.org_type, 'stir', r.stir, 'extra', r.seller_extra,
    'shop_description', r.shop_description, 'categories', to_jsonb(r.shop_categories), 'docs', r.seller_docs,
    'seller_status', case when r.role = 'admin' then 'approved'
                          when coalesce(r.seller_status, 'none') in ('none', '') then 'registered' else r.seller_status end,
    'official', r.role = 'admin', 'blocked', coalesce(r.blocked, false),
    'verified', r.verified, 'created_at', r.created_at,
    'applied_at', coalesce(r.seller_applied_at, r.created_at),
    'products_count', (select count(*) from public.seller_products sp where sp.seller_id = r.id),
    'products_active', (select count(*) from public.seller_products sp where sp.seller_id = r.id and sp.status = 'active'),
    'orders_count', (select count(*) from public.seller_orders o where o.seller_id = r.id),
    'orders_delivered', (select count(*) from public.seller_orders o where o.seller_id = r.id and o.status = 'yetkazildi')
  );
end $$;
revoke all on function public.admin_seller_application(uuid) from public, anon;
grant execute on function public.admin_seller_application(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Tashkilotchilar: seminar egalari ham (QA Test Akademiya), nom organizer_settings’dan,
--    seminar soni haqiqiy.
-- ---------------------------------------------------------------------------
create or replace function public.admin_organizers_list(p_tab text default 'all', p_q text default '', p_page int default 1, p_page_size int default 10)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_page int := greatest(1, coalesce(p_page, 1));
  v_size int := least(50, greatest(1, coalesce(p_page_size, 10)));
  v_q text := lower(trim(coalesce(p_q, '')));
  v jsonb;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  with s as (
    select p.id, p.avatar, p.created_at, p.verified, p.phone, p.email, p.role,
           coalesce(nullif(p.city, ''), nullif(os.city, '')) as city,
           case when p.role = 'admin' then 'approved'
                when coalesce(p.blocked, false) then 'blocked'
                when coalesce(p.org_status, 'none') in ('none', '') then 'registered' else p.org_status end as st,
           coalesce(nullif(os.org_name, ''), nullif(p.name, ''), nullif(p.full_name, ''), nullif(os.name, ''),
                    nullif(split_part(p.email, '@', 1), ''), '—') as d_name,
           (select count(*) from public.seminars sm where sm.organizer_id = p.id)::int as seminars_count,
           (select count(*) from public.seminars sm where sm.organizer_id = p.id and sm.published)::int as seminars_published
      from public.profiles p
      left join public.organizer_settings os on os.organizer_id = p.id
     where p.role = 'organizer' or coalesce(p.org_status, 'none') not in ('none', '')
        or exists (select 1 from public.seminars sm where sm.organizer_id = p.id)
  ), f as (
    select * from s where (p_tab = 'all' or st = p_tab)
      and (v_q = '' or lower(d_name) like '%'||v_q||'%' or lower(coalesce(city, '')) like '%'||v_q||'%'
           or lower(coalesce(email, '')) like '%'||v_q||'%' or coalesce(phone, '') like '%'||v_q||'%')
  )
  select jsonb_build_object(
    'total', (select count(*) from f),
    'counts', (select jsonb_build_object('all', count(*),
        'approved', count(*) filter (where st = 'approved'), 'pending', count(*) filter (where st = 'pending'),
        'registered', count(*) filter (where st = 'registered'), 'rejected', count(*) filter (where st = 'rejected'),
        'blocked', count(*) filter (where st = 'blocked')) from s),
    'page', v_page, 'page_size', v_size,
    'rows', coalesce((select jsonb_agg(row_to_json(x)::jsonb) from (
        select f.id, f.d_name as name, f.email, f.avatar, f.city, f.st as org_status, f.created_at, f.verified,
               f.role = 'admin' as official, public.admin_mask_phone(f.phone) as phone,
               f.seminars_count, f.seminars_published
          from f order by f.seminars_count desc, f.created_at desc limit v_size offset (v_page - 1) * v_size) x), '[]'::jsonb)) into v;
  return v;
end $$;
grant execute on function public.admin_organizers_list(text, text, int, int) to authenticated;

create or replace function public.admin_organizer_detail(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  select jsonb_build_object(
    'id', p.id,
    'name', coalesce(nullif(os.org_name, ''), nullif(p.name, ''), nullif(p.full_name, ''), nullif(os.name, ''), split_part(p.email, '@', 1)),
    'email', p.email, 'avatar', p.avatar, 'city', coalesce(nullif(p.city, ''), os.city), 'clinic', p.clinic,
    'about', coalesce(nullif(p.about, ''), os.description), 'verified', p.verified, 'created_at', p.created_at,
    'org_status', case when p.role = 'admin' then 'approved' when coalesce(p.org_status, 'none') in ('none', '') then 'registered' else p.org_status end,
    'official', p.role = 'admin',
    'phone', coalesce(nullif(p.phone, ''), nullif(os.phone, '')),
    'seminars', coalesce((
      select jsonb_agg(jsonb_build_object('id', s.id, 'title', s.title, 'city', s.city, 'status', s.status, 'sold', s.sold, 'seats', s.seats, 'start_date', s.start_date) order by s.sort_at)
        from public.seminars s where s.organizer_id = p.id), '[]'::jsonb)
  ) into v
  from public.profiles p left join public.organizer_settings os on os.organizer_id = p.id
  where p.id = p_id;
  if v is null then raise exception 'Tashkilotchi topilmadi'; end if;
  return v;
end $$;
grant execute on function public.admin_organizer_detail(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Buyurtmalar: viloyat buyurtma manzilidan, 48 soatdan ortiq "Yangi" — kechikkan
-- ---------------------------------------------------------------------------
create or replace function public.admin_orders_list(p_tab text default 'all', p_q text default '', p_page int default 1, p_page_size int default 10)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_page int := greatest(1, coalesce(p_page, 1));
  v_size int := least(50, greatest(1, coalesce(p_page_size, 10)));
  v_q text := lower(trim(coalesce(p_q, '')));
  v jsonb;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  with s as (
    select o.*, coalesce(nullif(sp.shop_name, ''), sp.name) as shop_name,
           (o.status = 'yangi' and o.created_at < now() - interval '48 hours') as stale
      from public.seller_orders o join public.profiles sp on sp.id = o.seller_id
  ), f as (
    select * from s
     where (p_tab = 'all'
            or (p_tab = 'kutilmoqda' and status in ('yangi', 'tasdiqlandi', 'tayyorlanmoqda'))
            or (p_tab = 'yuborilgan' and status = 'yetkazilmoqda')
            or (p_tab = 'yetkazilgan' and status = 'yetkazildi')
            or (p_tab = 'bekor' and status = 'bekor_qilindi')
            or (p_tab = 'kechikkan' and stale))
       and (v_q = '' or lower(code) like '%'||v_q||'%' or lower(coalesce(customer_name, '')) like '%'||v_q||'%'
            or lower(coalesce(shop_name, '')) like '%'||v_q||'%' or coalesce(customer_phone, '') like '%'||v_q||'%')
  )
  select jsonb_build_object(
    'total', (select count(*) from f),
    'counts', (select jsonb_build_object('all', count(*),
        'kutilmoqda', count(*) filter (where status in ('yangi', 'tasdiqlandi', 'tayyorlanmoqda')),
        'yuborilgan', count(*) filter (where status = 'yetkazilmoqda'),
        'yetkazilgan', count(*) filter (where status = 'yetkazildi'),
        'bekor', count(*) filter (where status = 'bekor_qilindi'),
        'kechikkan', count(*) filter (where stale)) from s),
    'page', v_page, 'page_size', v_size,
    'rows', coalesce((select jsonb_agg(row_to_json(x)::jsonb) from (
        select f.id, f.code, f.status, f.subtotal, f.commission, f.payout, f.payment_method, f.payment_status, f.created_at,
               f.customer_name, public.admin_mask_phone(f.customer_phone) as customer_phone,
               f.address, f.shop_name, coalesce(public.order_region(f.city), '') as city, f.stale,
               (select jsonb_build_object('name', i.name, 'image_url', i.image_url, 'qty', i.qty)
                  from public.seller_order_items i where i.order_id = f.id order by i.id limit 1) as first_item,
               (select count(*) from public.seller_order_items i where i.order_id = f.id)::int as items_count
          from f order by f.created_at desc limit v_size offset (v_page - 1) * v_size) x), '[]'::jsonb),
    'regions', coalesce((select jsonb_agg(jsonb_build_object('city', city, 'count', cnt) order by cnt desc) from (
        select coalesce(public.order_region(o.city), 'Noma’lum') as city, count(*)::int as cnt
          from public.seller_orders o group by 1 order by 2 desc limit 12) r), '[]'::jsonb)
  ) into v;
  return v;
end $$;
grant execute on function public.admin_orders_list(text, text, int, int) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Mahsulotlar navbati: barcha holatlar (jumladan 'inactive') — dashboard soni bilan teng.
-- ---------------------------------------------------------------------------
create or replace function public.admin_review_queue()
returns table (id uuid, seller_id uuid, shop_name text, name text, category text, brand text, price numeric,
  stock integer, image_url text, description text, status text, reject_reason text, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Faqat administrator uchun'; end if;
  return query select p.id, p.seller_id, coalesce(nullif(pr.shop_name, ''), pr.name, ''), p.name, p.category, p.brand, p.price,
    p.stock, p.image_url, p.description, p.status, p.reject_reason, p.created_at
    from public.seller_products p join public.profiles pr on pr.id = p.seller_id
   order by (p.status = 'review') desc, p.created_at desc limit 500;
end $$;
grant execute on function public.admin_review_queue() to authenticated;

-- ---------------------------------------------------------------------------
-- 7. Tasdiqlanmagan sotuvchi mahsulotlari: vitrinada ko‘rinmaydi va buyurtma qilinmaydi.
--    market_products SECURITY DEFINER bo‘lgani uchun RLS (0045) ni chetlab o‘tardi — shu tuzatiladi.
-- ---------------------------------------------------------------------------
drop function if exists public.market_products();
create function public.market_products()
returns table (id uuid, seller_id uuid, shop_name text, name text, sku text, category text, brand text,
  price numeric, stock integer, image_url text, images jsonb, variants jsonb, description text, unit text,
  created_at timestamptz, specs jsonb, country text, expires_on date, documents jsonb,
  clinical_use text, delivery_info text, reorder jsonb, variant_type text, uom text, min_qty integer,
  price_tiers jsonb, reg_cert_no text, lot_no text, storage_temp text, rx_only boolean)
language sql stable security definer set search_path = public as $$
  select p.id, p.seller_id, coalesce(nullif(pr.shop_name, ''), pr.name, 'Sotuvchi'), p.name, p.sku, p.category, p.brand,
         p.price, p.stock, p.image_url, p.images, p.variants, p.description, p.unit, p.created_at, p.specs,
         p.country, p.expires_on, p.documents,
         p.clinical_use, p.delivery_info, p.reorder, p.variant_type, p.uom, p.min_qty,
         p.price_tiers, p.reg_cert_no, p.lot_no, p.storage_temp,
         public.product_is_restricted(p.name, p.rx_only)
    from public.seller_products p join public.profiles pr on pr.id = p.seller_id
   where p.status = 'active' and not coalesce(p.is_test, false) and not coalesce(pr.is_test, false)
     and not coalesce(pr.blocked, false) and (pr.role = 'admin' or pr.seller_status = 'approved')
   order by p.created_at desc;
$$;
grant execute on function public.market_products() to anon, authenticated;

-- Server himoyasi: yangi buyurtma — sotuvchi tasdiqlangan bo‘lishi va xaridor sotuvchining o‘zi bo‘lmasligi kerak.
create or replace function public.seller_order_gate()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.seller_is_public(new.seller_id) then
    raise exception 'Bu sotuvchi hali tasdiqlanmagan — buyurtma berib bo‘lmaydi';
  end if;
  if new.buyer_id is not null and new.buyer_id = new.seller_id then
    raise exception 'O‘z mahsulotingizni buyurtma qila olmaysiz';
  end if;
  return new;
end $$;
drop trigger if exists seller_order_gate on public.seller_orders;
create trigger seller_order_gate before insert on public.seller_orders
  for each row execute function public.seller_order_gate();

-- Buyurtma qatori: mahsulot faol bo‘lishi kerak (rx tekshiruvi 0038 dagidek saqlanadi).
create or replace function public.seller_order_item_gate()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_buyer uuid;
begin
  if new.product_id is not null then
    if exists (select 1 from public.seller_products p where p.id = new.product_id
                and (p.status <> 'active' or not public.seller_is_public(p.seller_id))) then
      raise exception 'Bu mahsulot hozir sotuvda emas';
    end if;
    if exists (select 1 from public.seller_products p where p.id = new.product_id and public.product_is_restricted(p.name, p.rx_only)) then
      select buyer_id into v_buyer from public.seller_orders where id = new.order_id;
      if not exists (select 1 from public.profiles where id = v_buyer and (doctor_verified or role = 'admin')) then
        raise exception 'Bu mahsulot faqat tasdiqlangan shifokorlar uchun';
      end if;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists seller_order_item_gate on public.seller_order_items;
create trigger seller_order_item_gate before insert on public.seller_order_items
  for each row execute function public.seller_order_item_gate();
