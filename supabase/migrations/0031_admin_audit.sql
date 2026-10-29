-- 0031: admin audit (money / approval / moderation / doctor license).
-- NOT APPLIED automatically. Review, then apply manually. Safe to re-run.
-- Wrapping strategy: admin_dashboard / admin_finance / admin_escrow / admin_approvals_list are renamed to *_base
-- once and re-created as wrappers that override only the corrected keys (same signatures -> frontend unchanged).
--
-- WARNING (live data, 28.10.2026): all 12 published seminars belong to organizers whose org_status is
-- 'registered' (not approved). After this migration they are HIDDEN publicly until an admin approves the
-- organizer (e.g. 11111111-… "Ibrohim Karimov", 10 seminars). This migration does NOT auto-approve anyone.
-- Also check overlap with 0030 (organizer audit) if it also redefines seminars_public_read.

-- 0. helpers ---------------------------------------------------------------------------------
create or replace function public.admin_users_total()
returns bigint language sql stable security definer set search_path = public as $$
  select count(*) from public.profiles where coalesce(role, 'customer') <> 'admin';
$$;
revoke all on function public.admin_users_total() from public, anon;
grant execute on function public.admin_users_total() to authenticated;

-- demo payment = non-cash order marked as demo (note tag or demo provider / DEMO- transaction ids)
create or replace function public.order_is_demo(o public.seller_orders)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(o.payment_method, '') not in ('cash', 'naqd') and (
    coalesce(o.note, '') ilike '%[demo:%'
    or coalesce(o.payment_ref, '') ilike 'DEMO-%'
    or exists (select 1 from public.payment_transactions t where t.order_id = o.id
               and (t.provider = 'demo' or coalesce(t.provider_trans_id, '') ilike 'DEMO-%'
                    or coalesce(t.merchant_trans_id, '') ilike 'DEMO-%')));
$$;

-- public visibility: admin (official StomaHub seller) or approved & not blocked
create or replace function public.seller_is_public(p_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = p_id and not coalesce(p.blocked, false)
                 and (p.role = 'admin' or p.seller_status = 'approved'));
$$;
create or replace function public.organizer_is_public(p_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = p_id and not coalesce(p.blocked, false)
                 and (p.role = 'admin' or p.org_status = 'approved'));
$$;
grant execute on function public.seller_is_public(uuid), public.organizer_is_public(uuid) to anon, authenticated;

-- 1. doctor license ---------------------------------------------------------------------------
alter table public.profiles add column if not exists doctor_verified boolean not null default false;
alter table public.profiles add column if not exists license_status text not null default 'none';
alter table public.profiles add column if not exists license_doc text not null default '';
alter table public.profiles add column if not exists license_submitted_at timestamptz;
alter table public.profiles add column if not exists license_reviewed_at timestamptz;
alter table public.profiles add column if not exists license_reject_reason text not null default '';
alter table public.profiles drop constraint if exists profiles_license_status_check;
alter table public.profiles add constraint profiles_license_status_check
  check (license_status in ('none', 'pending', 'approved', 'rejected'));

-- users cannot self-set the doctor flag / status (only definer RPCs below or admin)
create or replace function public.profile_license_guard()
returns trigger language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    new.doctor_verified := old.doctor_verified;
    new.license_status := old.license_status;
    new.license_reviewed_at := old.license_reviewed_at;
    new.license_reject_reason := old.license_reject_reason;
    if new.license is distinct from old.license and old.doctor_verified then
      new.doctor_verified := false; new.license_status := 'none';  -- changed number needs re-check
    end if;
  end if;
  return new;
end $$;
drop trigger if exists profile_license_guard on public.profiles;
create trigger profile_license_guard before update on public.profiles
  for each row execute function public.profile_license_guard();

create or replace function public.submit_doctor_license(p_license text, p_doc text default '')
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Kirish talab qilinadi'; end if;
  if length(trim(coalesce(p_license, ''))) < 3 then raise exception 'Litsenziya raqamini kiriting'; end if;
  update public.profiles set license = trim(p_license), license_doc = coalesce(p_doc, ''),
         license_status = 'pending', doctor_verified = false, license_submitted_at = now(),
         license_reject_reason = '', updated_at = now()
   where id = auth.uid();
  return jsonb_build_object('ok', true, 'license_status', 'pending');
end $$;
grant execute on function public.submit_doctor_license(text, text) to authenticated;

create or replace function public.admin_license_queue(p_tab text default 'pending')
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  return jsonb_build_object(
    'counts', (select jsonb_build_object(
        'pending', count(*) filter (where license_status = 'pending'),
        'approved', count(*) filter (where license_status = 'approved'),
        'rejected', count(*) filter (where license_status = 'rejected')) from public.profiles),
    'rows', coalesce((select jsonb_agg(jsonb_build_object(
        'id', p.id, 'name', p.name, 'phone', p.phone, 'specialty', p.specialty, 'city', p.city,
        'license', p.license, 'license_doc', p.license_doc, 'license_status', p.license_status,
        'submitted_at', p.license_submitted_at, 'reject_reason', p.license_reject_reason)
        order by p.license_submitted_at desc nulls last)
      from public.profiles p where p.license_status = coalesce(nullif(p_tab, ''), 'pending')), '[]'::jsonb));
end $$;
grant execute on function public.admin_license_queue(text) to authenticated;

create or replace function public.admin_review_license(p_id uuid, p_approve boolean, p_reason text default '')
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  if not p_approve and length(trim(coalesce(p_reason, ''))) < 3 then raise exception 'Rad etish sababini yozing'; end if;
  update public.profiles set
    license_status = case when p_approve then 'approved' else 'rejected' end,
    doctor_verified = p_approve, license_reviewed_at = now(),
    license_reject_reason = case when p_approve then '' else left(trim(p_reason), 500) end, updated_at = now()
   where id = p_id and license_status in ('pending', 'approved', 'rejected');
  if not found then raise exception 'Ariza topilmadi'; end if;
  return jsonb_build_object('ok', true);
end $$;
grant execute on function public.admin_review_license(uuid, boolean, text) to authenticated;

-- restricted (retsept/shifokor uchun) products: only verified doctors can order
alter table public.seller_products add column if not exists rx_only boolean not null default false;

-- 2. visibility + checkout block for non-approved sellers / organizers -----------------------
drop policy if exists seller_products_public_read on public.seller_products;
create policy seller_products_public_read on public.seller_products
  for select to anon, authenticated using (status = 'active' and public.seller_is_public(seller_id));

alter table public.seminars add column if not exists hidden boolean not null default false;
alter table public.seminars add column if not exists hidden_reason text not null default '';
drop policy if exists seminars_public_read on public.seminars;
create policy seminars_public_read on public.seminars
  for select to anon, authenticated
  using (published = true and status <> 'qoralama' and not hidden and public.organizer_is_public(organizer_id));
-- tickets_public_read already depends on a visible seminar -> follows automatically.

create or replace function public.seller_order_gate()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.seller_is_public(new.seller_id) then
    raise exception 'Bu sotuvchi hali tasdiqlanmagan — buyurtma berib bo‘lmaydi';
  end if;
  return new;
end $$;
drop trigger if exists seller_order_gate on public.seller_orders;
create trigger seller_order_gate before insert on public.seller_orders
  for each row execute function public.seller_order_gate();

create or replace function public.seller_order_item_gate()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_buyer uuid;
begin
  if new.product_id is not null and exists (select 1 from public.seller_products p where p.id = new.product_id and p.rx_only) then
    select buyer_id into v_buyer from public.seller_orders where id = new.order_id;
    if not exists (select 1 from public.profiles where id = v_buyer and (doctor_verified or role = 'admin')) then
      raise exception 'Bu mahsulot faqat tasdiqlangan shifokorlar uchun';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists seller_order_item_gate on public.seller_order_items;
create trigger seller_order_item_gate before insert on public.seller_order_items
  for each row execute function public.seller_order_item_gate();

create or replace function public.registration_gate()
returns trigger language plpgsql security definer set search_path = public as $$
declare s public.seminars;
begin
  select * into s from public.seminars where id = new.seminar_id;
  if s.id is null then return new; end if;
  if public.is_admin() or s.organizer_id = auth.uid() then return new; end if;  -- organizer manual entry
  if s.hidden or not public.organizer_is_public(s.organizer_id) then
    raise exception 'Bu seminar hali tasdiqlanmagan — ro‘yxatdan o‘tib bo‘lmaydi';
  end if;
  return new;
end $$;
drop trigger if exists registration_gate on public.registrations;
create trigger registration_gate before insert on public.registrations
  for each row execute function public.registration_gate();

-- 3. product review: only pending ('review') products; never official StomaHub products ------
create or replace function public.admin_review_product(p_id uuid, p_approve boolean, p_reason text default '')
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Faqat administrator uchun'; end if;
  if not p_approve and length(trim(coalesce(p_reason, ''))) < 3 then raise exception 'Rad etish sababini yozing'; end if;
  update public.seller_products p
     set status = case when p_approve then 'active' else 'rejected' end,
         reject_reason = case when p_approve then '' else trim(p_reason) end, updated_at = now()
   where p.id = p_id and p.status = 'review'
     and not exists (select 1 from public.profiles s where s.id = p.seller_id and s.role = 'admin');
  if not found then raise exception 'Faqat tekshiruvdagi mahsulotni tasdiqlash mumkin'; end if;
end $$;

-- 4. pending counts: one source for dashboard + Tasdiqlashlar -------------------------------
create or replace function public.admin_pending_counts()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_s bigint; v_o bigint; v_a bigint; v_p bigint; v_d bigint;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  select count(distinct u) into v_s from (
    select user_id u from public.seller_applications where kind = 'seller' and status = 'pending'
    union select id from public.profiles where seller_status = 'pending') x;
  select count(distinct u) into v_o from (
    select user_id u from public.seller_applications where kind = 'organizer' and status = 'pending'
    union select id from public.profiles where org_status = 'pending') x;
  select count(*) into v_a from public.seller_campaigns where status = 'moderatsiyada';
  select count(*) into v_p from public.seller_products where status = 'review';
  select count(*) into v_d from public.profiles where license_status = 'pending';
  return jsonb_build_object('sellers', v_s, 'organizers', v_o, 'ads', v_a, 'products', v_p,
    'doctors', v_d, 'users', 0, 'seminars', 0, 'total', v_s + v_o + v_a + v_p + v_d);
end $$;
grant execute on function public.admin_pending_counts() to authenticated;

-- 5. money -------------------------------------------------------------------------------------
create or replace function public.admin_money(p_from timestamptz, p_to timestamptz)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_from timestamptz := coalesce(p_from, date_trunc('month', now()));
  v_to timestamptz := coalesce(p_to, now());
  v_pct numeric := coalesce((select commission_pct from public.admin_settings where id = 'main'), 12);
  v jsonb;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  with o as (
    select x.*, public.order_is_demo(x) as demo, coalesce(x.payment_method, '') in ('cash', 'naqd') as is_cash
      from public.seller_orders x where x.created_at between v_from and v_to
  ), allo as (
    select x.*, public.order_is_demo(x) as demo, coalesce(x.payment_method, '') in ('cash', 'naqd') as is_cash
      from public.seller_orders x
  ), sem as (
    select r.id, coalesce(t.price, 0) as price
      from public.registrations r
      left join public.tickets t on t.id = r.ticket_id
        or (r.ticket_id is null and t.seminar_id = r.seminar_id and t.name = r.ticket)
     where r.pay = 'paid' and r.created_at between v_from and v_to
  )
  select jsonb_build_object(
    'orders_count', (select count(*) from o),
    'orders_cancelled', (select count(*) from o where status = 'bekor_qilindi'),
    'orders_demo', (select count(*) from o where demo),
    'turnover', coalesce((select sum(subtotal) from o where status <> 'bekor_qilindi' and not demo), 0),
    'turnover_delivered', coalesce((select sum(subtotal) from o where status = 'yetkazildi' and not demo), 0),
    'commission', coalesce((select sum(commission) from o where status = 'yetkazildi' and not demo), 0),
    'net', coalesce((select sum(payout) from o where status = 'yetkazildi' and not demo), 0),
    'demo_sum', coalesce((select sum(subtotal) from o where demo), 0),
    'escrow', coalesce((select sum(payout) from allo where not is_cash and not demo and payment_status in ('paid', 'held')
                        and status not in ('bekor_qilindi', 'yetkazildi') and escrow_released_at is null and escrow_refunded_at is null), 0),
    'escrow_orders', (select count(*) from allo where not is_cash and not demo and payment_status in ('paid', 'held')
                        and status not in ('bekor_qilindi', 'yetkazildi') and escrow_released_at is null and escrow_refunded_at is null),
    'cash_pending', coalesce((select sum(subtotal) from allo where is_cash and status not in ('bekor_qilindi', 'yetkazildi')), 0),
    'cash_pending_orders', (select count(*) from allo where is_cash and status not in ('bekor_qilindi', 'yetkazildi')),
    'seller_earned', coalesce((select sum(payout) from allo where status = 'yetkazildi' and not demo), 0),
    'payouts_paid', coalesce((select sum(amount) from public.seller_payouts where status = 'tolandi'), 0),
    'payouts_requested', coalesce((select sum(amount) from public.seller_payouts where status = 'kutilmoqda'), 0),
    'seminar_revenue', coalesce((select sum(price) from sem), 0),
    'seminar_paid_count', (select count(*) from sem),
    'seminar_commission', round(coalesce((select sum(price) from sem), 0) * v_pct / 100),
    'commission_pct', v_pct,
    'by_method', coalesce((select jsonb_agg(jsonb_build_object('method', m, 'count', c, 'sum', s, 'cancelled', cc, 'demo', dc) order by c desc)
      from (select coalesce(nullif(payment_method, ''), 'boshqa') m, count(*)::int c,
                   coalesce(sum(subtotal) filter (where status <> 'bekor_qilindi' and not demo), 0) s,
                   count(*) filter (where status = 'bekor_qilindi')::int cc, count(*) filter (where demo)::int dc
              from o group by 1) q), '[]'::jsonb)
  ) into v;
  -- one source for "Sotuvchilarga to'lash kerak" and "Kutilayotgan to'lovlar"
  v := v || jsonb_build_object('seller_payable', greatest(0, (v->>'seller_earned')::numeric - (v->>'payouts_paid')::numeric));
  return v;
end $$;
grant execute on function public.admin_money(timestamptz, timestamptz) to authenticated;

do $$ begin
  if not exists (select 1 from pg_proc where proname = 'admin_dashboard_base') then
    alter function public.admin_dashboard(timestamptz, timestamptz) rename to admin_dashboard_base;
  end if;
  if not exists (select 1 from pg_proc where proname = 'admin_finance_base') then
    alter function public.admin_finance(timestamptz, timestamptz) rename to admin_finance_base;
  end if;
  if not exists (select 1 from pg_proc where proname = 'admin_escrow_base') then
    alter function public.admin_escrow(int, int, text) rename to admin_escrow_base;
  end if;
  if not exists (select 1 from pg_proc where proname = 'admin_approvals_list_base') then
    alter function public.admin_approvals_list(text, text, int, int) rename to admin_approvals_list_base;
  end if;
end $$;

create or replace function public.admin_dashboard(p_from timestamptz, p_to timestamptz)
returns jsonb language plpgsql security definer set search_path = public as $$
declare b jsonb := public.admin_dashboard_base(p_from, p_to); m jsonb := public.admin_money(p_from, p_to);
begin
  return b || jsonb_build_object(
    'turnover', m->'turnover', 'commission', m->'commission', 'net', m->'net',
    'escrow', m->'escrow', 'cash_pending', m->'cash_pending', 'orders_count', m->'orders_count',
    'users_count', public.admin_users_total(), 'pending', public.admin_pending_counts(),
    'seminar_revenue', m->'seminar_revenue', 'seminar_commission', m->'seminar_commission');
end $$;
revoke all on function public.admin_dashboard(timestamptz, timestamptz) from public, anon;
grant execute on function public.admin_dashboard(timestamptz, timestamptz) to authenticated;

create or replace function public.admin_finance(p_from timestamptz default null, p_to timestamptz default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare m jsonb := public.admin_money(p_from, p_to);
begin
  return public.admin_finance_base(p_from, p_to) || m || jsonb_build_object(
    'payout', m->'seller_payable', 'payouts_pending', m->'seller_payable',
    'commission_rate', (m->>'commission_pct')::numeric / 100);
end $$;
grant execute on function public.admin_finance(timestamptz, timestamptz) to authenticated;

create or replace function public.admin_escrow(p_page int default 1, p_page_size int default 10, p_q text default '')
returns jsonb language plpgsql security definer set search_path = public as $$
declare b jsonb := public.admin_escrow_base(p_page, p_page_size, p_q); m jsonb := public.admin_money(null, null);
begin
  return b || jsonb_build_object('summary', (b->'summary') || jsonb_build_object(
    'held', m->'escrow', 'orders_held', m->'escrow_orders', 'cash_pending', m->'cash_pending',
    'cash_pending_orders', m->'cash_pending_orders',
    'commission', (select coalesce(sum(commission), 0) from public.seller_orders o
                    where o.status = 'yetkazildi' and not public.order_is_demo(o))));
end $$;
grant execute on function public.admin_escrow(int, int, text) to authenticated;

create or replace function public.admin_approvals_list(p_type text default 'all', p_q text default '', p_page int default 1, p_page_size int default 10)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  return public.admin_approvals_list_base(p_type, p_q, p_page, p_page_size)
         || jsonb_build_object('counts', public.admin_pending_counts());
end $$;
grant execute on function public.admin_approvals_list(text, text, int, int) to authenticated;

-- 6. sellers list: everyone who sells (incl. official StomaHub + customers with an approved shop) --
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
    select p.*, case when p.role = 'admin' then 'approved' else coalesce(p.seller_status, 'none') end as st
      from public.profiles p
     where coalesce(p.seller_status, 'none') <> 'none' or p.role = 'seller'
        or exists (select 1 from public.seller_products sp where sp.seller_id = p.id)
  ), f as (
    select * from s where (p_tab = 'all' or st = p_tab)
      and (v_q = '' or lower(coalesce(name, '')) like '%'||v_q||'%' or lower(coalesce(shop_name, '')) like '%'||v_q||'%'
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
        select f.id, f.name, f.shop_name, f.avatar, f.city, f.st as seller_status, f.seller_applied_at, f.created_at,
               f.role = 'admin' as official, public.admin_mask_phone(f.phone) as phone,
               coalesce(jsonb_array_length(f.seller_docs), 0) as docs_count,
               (select count(*) from public.seller_products sp where sp.seller_id = f.id) as products_count
          from f order by (f.role = 'admin') desc, coalesce(f.seller_applied_at, f.created_at) desc
         limit v_size offset (v_page - 1) * v_size) x), '[]'::jsonb));
  return v;
end $$;
grant execute on function public.admin_sellers_list(text, text, int, int) to authenticated;

-- 7. organizers list: counts sum to total (registered/blocked included) -------------------------
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
    select p.*, case when coalesce(p.org_status, 'none') in ('none', '') then 'registered' else p.org_status end as st
      from public.profiles p where p.role = 'organizer' or coalesce(p.org_status, 'none') <> 'none'
  ), f as (
    select * from s where (p_tab = 'all' or st = p_tab)
      and (v_q = '' or lower(coalesce(name, '')) like '%'||v_q||'%' or lower(coalesce(city, '')) like '%'||v_q||'%' or coalesce(phone, '') like '%'||v_q||'%')
  )
  select jsonb_build_object(
    'total', (select count(*) from f),
    'counts', (select jsonb_build_object('all', count(*),
        'approved', count(*) filter (where st = 'approved'), 'pending', count(*) filter (where st = 'pending'),
        'registered', count(*) filter (where st = 'registered'), 'rejected', count(*) filter (where st = 'rejected'),
        'blocked', count(*) filter (where st = 'blocked')) from s),
    'page', v_page, 'page_size', v_size,
    'rows', coalesce((select jsonb_agg(row_to_json(x)::jsonb) from (
        select f.id, f.name, f.avatar, f.city, f.st as org_status, f.created_at, f.verified,
               public.admin_mask_phone(f.phone) as phone,
               (select count(*) from public.seminars sm where sm.organizer_id = f.id) as seminars_count
          from f order by f.created_at desc limit v_size offset (v_page - 1) * v_size) x), '[]'::jsonb));
  return v;
end $$;
grant execute on function public.admin_organizers_list(text, text, int, int) to authenticated;

-- 8. content moderation -------------------------------------------------------------------------
alter table public.catalog_items add column if not exists hidden boolean not null default false;
alter table public.catalog_items add column if not exists hidden_reason text not null default '';
drop policy if exists catalog_items_read on public.catalog_items;
create policy catalog_items_read on public.catalog_items
  for select to anon, authenticated using (not hidden or owner_id = auth.uid() or public.is_admin());

-- moderated kinds only; official StomaHub Market kinds (uniform=Forma, device=Jihozlar, product=Marketplace) are excluded
create or replace function public.admin_content_list(p_kind text, p_q text default '', p_page int default 1, p_page_size int default 20)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_size int := least(50, greatest(1, coalesce(p_page_size, 20)));
  v_off int := (greatest(1, coalesce(p_page, 1)) - 1) * v_size;
  v_q text := lower(trim(coalesce(p_q, '')));
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  if p_kind = 'seminar' then
    return jsonb_build_object(
      'total', (select count(*) from public.seminars s where v_q = '' or lower(s.title) like '%'||v_q||'%'),
      'rows', coalesce((select jsonb_agg(x) from (
        select jsonb_build_object('id', s.id, 'title', s.title, 'owner', coalesce(p.name, '—'), 'hidden', s.hidden,
               'status', s.status, 'published', s.published, 'at', s.created_at) x
          from public.seminars s left join public.profiles p on p.id = s.organizer_id
         where v_q = '' or lower(s.title) like '%'||v_q||'%'
         order by s.created_at desc limit v_size offset v_off) q), '[]'::jsonb));
  end if;
  if p_kind not in ('ad', 'surplus', 'post', 'master', 'book', 'course', 'job', 'channel') then
    raise exception 'Bu bo‘lim moderatsiya qilinmaydi';
  end if;
  return jsonb_build_object(
    'total', (select count(*) from public.catalog_items c where c.kind = p_kind
               and (v_q = '' or lower(c.payload::text) like '%'||v_q||'%')),
    'rows', coalesce((select jsonb_agg(x) from (
      select jsonb_build_object('id', c.id, 'title', coalesce(c.payload->>'title', c.payload->>'name', c.payload->>'t', c.id::text),
             'owner', coalesce(p.name, c.payload->>'author', c.payload->>'company', c.payload->>'seller', '—'),
             'hidden', c.hidden, 'at', coalesce(c.updated_at, c.sort_at)) x
        from public.catalog_items c left join public.profiles p on p.id = c.owner_id
       where c.kind = p_kind and (v_q = '' or lower(c.payload::text) like '%'||v_q||'%')
       order by c.sort_at desc nulls last limit v_size offset v_off) q), '[]'::jsonb));
end $$;
grant execute on function public.admin_content_list(text, text, int, int) to authenticated;

create or replace function public.admin_content_moderate(p_kind text, p_id text, p_action text, p_reason text default '')
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  if p_action not in ('hide', 'unhide', 'delete') then raise exception 'Noma’lum amal'; end if;
  if p_action <> 'unhide' and length(trim(coalesce(p_reason, ''))) < 3 then raise exception 'Sababini yozing'; end if;
  if p_kind = 'seminar' then
    if p_action = 'delete' then
      if exists (select 1 from public.registrations where seminar_id = p_id) then
        raise exception 'Seminarda ro‘yxatdan o‘tganlar bor — o‘chirish o‘rniga yashiring';
      end if;
      delete from public.seminars where id = p_id;
    else
      update public.seminars set hidden = (p_action = 'hide'), hidden_reason = case when p_action = 'hide' then trim(p_reason) else '' end
       where id = p_id;
    end if;
  else
    if p_kind not in ('ad', 'surplus', 'post', 'master', 'book', 'course', 'job', 'channel') then
      raise exception 'Bu bo‘lim moderatsiya qilinmaydi';
    end if;
    if p_action = 'delete' then
      delete from public.catalog_items where kind = p_kind and id::text = p_id;
    else
      update public.catalog_items set hidden = (p_action = 'hide'),
             hidden_reason = case when p_action = 'hide' then trim(p_reason) else '' end, updated_at = now()
       where kind = p_kind and id::text = p_id;
    end if;
  end if;
  if not found then raise exception 'Yozuv topilmadi'; end if;
  return jsonb_build_object('ok', true);
end $$;
grant execute on function public.admin_content_moderate(text, text, text, text) to authenticated;

-- 9. admin sees full customer phone in order detail ------------------------------------------
-- lists stay masked; only the detail view (one order, admin only) returns the raw number.
do $$ begin
  if not exists (select 1 from pg_proc where proname = 'admin_order_detail_base') then
    alter function public.admin_order_detail(uuid) rename to admin_order_detail_base;
  end if;
end $$;
create or replace function public.admin_order_detail(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare b jsonb := public.admin_order_detail_base(p_id);
begin
  return b || jsonb_build_object('customer_phone', (select customer_phone from public.seller_orders where id = p_id),
                                 'customer_phone_full', true);
end $$;
grant execute on function public.admin_order_detail(uuid) to authenticated;
