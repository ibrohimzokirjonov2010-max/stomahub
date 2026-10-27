-- 0012 — Admin panel sections 02–12: schema + SECURITY DEFINER RPCs (is_admin()).
-- Apply via Supabase SQL editor. Do not run from the app.

-- ---------------------------------------------------------------------------
-- Schema extensions
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists user_type text not null default 'shifokor',
  add column if not exists address text not null default '',
  add column if not exists block_reason text not null default '',
  add column if not exists blocked_at timestamptz,
  add column if not exists blocked_by uuid references public.profiles (id) on delete set null,
  add column if not exists org_status text not null default 'none';

alter table public.profiles drop constraint if exists profiles_user_type_check;
alter table public.profiles add constraint profiles_user_type_check
  check (user_type in ('shifokor', 'talaba', 'boshqa'));

alter table public.profiles drop constraint if exists profiles_org_status_check;
alter table public.profiles add constraint profiles_org_status_check
  check (org_status in ('none', 'pending', 'approved', 'rejected', 'blocked'));

-- Backfill user_type: license or specialty → shifokor; else talaba for customers without specialty
update public.profiles
   set user_type = case
     when coalesce(license, '') <> '' or coalesce(specialty, '') <> '' then 'shifokor'
     when role = 'customer' then 'talaba'
     else user_type
   end
 where user_type = 'shifokor' and role = 'customer' and coalesce(specialty,'') = '' and coalesce(license,'') = '';

update public.profiles
   set org_status = case
     when role = 'organizer' and coalesce(verified, false) then 'approved'
     when role = 'organizer' then 'pending'
     else org_status
   end
 where role = 'organizer' and org_status = 'none';

-- Payouts: demo payment methods
alter table public.seller_payouts drop constraint if exists seller_payouts_method_check;
alter table public.seller_payouts add constraint seller_payouts_method_check
  check (method in ('naqd', 'cash', 'uzcard', 'humo', 'click', 'payme', 'card'));

alter table public.seller_payouts
  add column if not exists reject_reason text not null default '',
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references public.profiles (id) on delete set null;

alter table public.seller_campaigns
  add column if not exists reject_reason text not null default '',
  add column if not exists description text not null default '',
  add column if not exists image_url text not null default '',
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references public.profiles (id) on delete set null;

alter table public.admin_complaints
  add column if not exists target_type text not null default '',
  add column if not exists target_id uuid,
  add column if not exists assignee_id uuid references public.profiles (id) on delete set null,
  add column if not exists resolution text not null default '';

create table if not exists public.admin_settings (
  id text primary key default 'main',
  platform_name text not null default 'StomaHub',
  tagline text not null default 'Stomatologlar uchun yagona platforma',
  description text not null default '',
  site_url text not null default 'https://stomahub.uz',
  contact_phone text not null default '',
  contact_email text not null default 'info@stomahub.uz',
  primary_color text not null default '#0F766E',
  commission_pct numeric(5,2) not null default 12,
  payment_methods text[] not null default array['uzcard','humo','click','payme'],
  notify_orders boolean not null default true,
  notify_sellers boolean not null default true,
  notify_organizers boolean not null default true,
  notify_complaints boolean not null default true,
  twofa_required boolean not null default true,
  ip_restrict boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);
insert into public.admin_settings (id) values ('main') on conflict (id) do nothing;
alter table public.admin_settings enable row level security;
drop policy if exists admin_settings_admin_all on public.admin_settings;
create policy admin_settings_admin_all on public.admin_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select, insert, update on public.admin_settings to authenticated;

-- Phone mask helper (never return raw phone from admin RPCs)
create or replace function public.admin_mask_phone(p text)
returns text language sql immutable as $$
  select case when coalesce(nullif(trim(p), ''), '') = '' then null else '+998 ** *** ** **' end;
$$;

-- ---------------------------------------------------------------------------
-- 02 Users
-- ---------------------------------------------------------------------------
create or replace function public.admin_users_list(
  p_tab text default 'all',
  p_q text default '',
  p_page int default 1,
  p_page_size int default 10
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_page int := greatest(1, coalesce(p_page, 1));
  v_size int := least(50, greatest(1, coalesce(p_page_size, 10)));
  v_off int := (v_page - 1) * v_size;
  v_q text := lower(trim(coalesce(p_q, '')));
  v_total bigint;
  v_counts jsonb;
  v_rows jsonb;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;

  select jsonb_build_object(
    'all', count(*) filter (where role in ('customer','seller','organizer')),
    'shifokor', count(*) filter (where role in ('customer','seller','organizer') and user_type = 'shifokor'),
    'talaba', count(*) filter (where role in ('customer','seller','organizer') and user_type = 'talaba')
  ) into v_counts from public.profiles;

  select count(*) into v_total
  from public.profiles p
  where p.role in ('customer','seller','organizer')
    and (p_tab = 'all' or (p_tab = 'shifokor' and p.user_type = 'shifokor') or (p_tab = 'talaba' and p.user_type = 'talaba'))
    and (v_q = '' or lower(p.name) like '%'||v_q||'%' or lower(coalesce(p.city,'')) like '%'||v_q||'%' or coalesce(p.phone,'') like '%'||v_q||'%');

  select coalesce(jsonb_agg(row_to_json(x)::jsonb), '[]'::jsonb) into v_rows
  from (
    select p.id, p.name, p.avatar, p.user_type, p.city, p.specialty, p.created_at,
           public.admin_mask_phone(p.phone) as phone,
           p.blocked, p.block_reason, p.blocked_at
    from public.profiles p
    where p.role in ('customer','seller','organizer')
      and (p_tab = 'all' or (p_tab = 'shifokor' and p.user_type = 'shifokor') or (p_tab = 'talaba' and p.user_type = 'talaba'))
      and (v_q = '' or lower(p.name) like '%'||v_q||'%' or lower(coalesce(p.city,'')) like '%'||v_q||'%' or coalesce(p.phone,'') like '%'||v_q||'%')
    order by p.created_at desc
    limit v_size offset v_off
  ) x;

  return jsonb_build_object('total', v_total, 'counts', v_counts, 'page', v_page, 'page_size', v_size, 'rows', v_rows);
end $$;
grant execute on function public.admin_users_list(text, text, int, int) to authenticated;

create or replace function public.admin_user_detail(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; v_orders int; v_ads int;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  select count(*) into v_orders from public.seller_orders where buyer_id = p_id;
  select count(*) into v_ads from public.seller_campaigns c join public.profiles s on s.id = c.seller_id where s.id = p_id;
  select jsonb_build_object(
    'id', p.id, 'name', p.name, 'avatar', p.avatar, 'user_type', p.user_type,
    'specialty', p.specialty, 'clinic', p.clinic, 'city', p.city, 'address', p.address,
    'about', p.about, 'license', p.license, 'created_at', p.created_at,
    'phone', public.admin_mask_phone(p.phone),
    'blocked', p.blocked, 'block_reason', p.block_reason, 'blocked_at', p.blocked_at,
    'blocked_by_name', (select name from public.profiles b where b.id = p.blocked_by),
    'orders_count', v_orders, 'ads_count', v_ads,
    'code', 'USR-' || lpad((abs(hashtext(p.id::text)) % 1000000)::text, 6, '0')
  ) into v from public.profiles p where p.id = p_id;
  if v is null then raise exception 'Foydalanuvchi topilmadi'; end if;
  return v;
end $$;
grant execute on function public.admin_user_detail(uuid) to authenticated;

create or replace function public.admin_user_block(p_id uuid, p_block boolean, p_reason text default '')
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  if p_block and length(trim(coalesce(p_reason,''))) < 3 then
    raise exception 'Bloklash sababini yozing';
  end if;
  update public.profiles set
    blocked = p_block,
    block_reason = case when p_block then trim(p_reason) else '' end,
    blocked_at = case when p_block then now() else null end,
    blocked_by = case when p_block then auth.uid() else null end,
    updated_at = now()
  where id = p_id and role <> 'admin';
  if not found then raise exception 'Foydalanuvchi topilmadi'; end if;
  return jsonb_build_object('ok', true, 'blocked', p_block);
end $$;
grant execute on function public.admin_user_block(uuid, boolean, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 03 Sellers
-- ---------------------------------------------------------------------------
create or replace function public.admin_sellers_list(
  p_tab text default 'all',
  p_q text default '',
  p_page int default 1,
  p_page_size int default 10
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_page int := greatest(1, coalesce(p_page, 1));
  v_size int := least(50, greatest(1, coalesce(p_page_size, 10)));
  v_off int := (v_page - 1) * v_size;
  v_q text := lower(trim(coalesce(p_q, '')));
  v_total bigint; v_counts jsonb; v_rows jsonb;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  select jsonb_build_object(
    'all', count(*),
    'approved', count(*) filter (where seller_status = 'approved'),
    'pending', count(*) filter (where seller_status = 'pending'),
    'rejected', count(*) filter (where seller_status = 'rejected')
  ) into v_counts from public.profiles where role = 'seller';

  select count(*) into v_total from public.profiles p
  where p.role = 'seller'
    and (p_tab = 'all' or p.seller_status = p_tab)
    and (v_q = '' or lower(p.name) like '%'||v_q||'%' or lower(coalesce(p.shop_name,'')) like '%'||v_q||'%'
         or lower(coalesce(p.city,'')) like '%'||v_q||'%' or coalesce(p.phone,'') like '%'||v_q||'%');

  select coalesce(jsonb_agg(row_to_json(x)::jsonb), '[]'::jsonb) into v_rows from (
    select p.id, p.name, p.shop_name, p.avatar, p.city, p.seller_status, p.seller_applied_at, p.created_at,
           public.admin_mask_phone(p.phone) as phone,
           coalesce(jsonb_array_length(p.seller_docs), 0) as docs_count,
           (select count(*) from public.seller_products sp where sp.seller_id = p.id) as products_count
    from public.profiles p
    where p.role = 'seller'
      and (p_tab = 'all' or p.seller_status = p_tab)
      and (v_q = '' or lower(p.name) like '%'||v_q||'%' or lower(coalesce(p.shop_name,'')) like '%'||v_q||'%'
           or lower(coalesce(p.city,'')) like '%'||v_q||'%' or coalesce(p.phone,'') like '%'||v_q||'%')
    order by coalesce(p.seller_applied_at, p.created_at) desc
    limit v_size offset v_off
  ) x;

  return jsonb_build_object('total', v_total, 'counts', v_counts, 'page', v_page, 'page_size', v_size, 'rows', v_rows);
end $$;
grant execute on function public.admin_sellers_list(text, text, int, int) to authenticated;

-- ---------------------------------------------------------------------------
-- 04 Organizers
-- ---------------------------------------------------------------------------
create or replace function public.admin_organizers_list(
  p_tab text default 'all',
  p_q text default '',
  p_page int default 1,
  p_page_size int default 10
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_page int := greatest(1, coalesce(p_page, 1));
  v_size int := least(50, greatest(1, coalesce(p_page_size, 10)));
  v_off int := (v_page - 1) * v_size;
  v_q text := lower(trim(coalesce(p_q, '')));
  v_total bigint; v_counts jsonb; v_rows jsonb;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  select jsonb_build_object(
    'all', count(*),
    'approved', count(*) filter (where org_status = 'approved'),
    'pending', count(*) filter (where org_status = 'pending'),
    'rejected', count(*) filter (where org_status = 'rejected')
  ) into v_counts from public.profiles where role = 'organizer';

  select count(*) into v_total from public.profiles p
  where p.role = 'organizer'
    and (p_tab = 'all' or p.org_status = p_tab)
    and (v_q = '' or lower(p.name) like '%'||v_q||'%' or lower(coalesce(p.city,'')) like '%'||v_q||'%' or coalesce(p.phone,'') like '%'||v_q||'%');

  select coalesce(jsonb_agg(row_to_json(x)::jsonb), '[]'::jsonb) into v_rows from (
    select p.id, p.name, p.avatar, p.city, p.org_status, p.created_at, p.verified,
           public.admin_mask_phone(p.phone) as phone,
           (select count(*) from public.seminars s where s.organizer_id = p.id) as seminars_count
    from public.profiles p
    where p.role = 'organizer'
      and (p_tab = 'all' or p.org_status = p_tab)
      and (v_q = '' or lower(p.name) like '%'||v_q||'%' or lower(coalesce(p.city,'')) like '%'||v_q||'%' or coalesce(p.phone,'') like '%'||v_q||'%')
    order by p.created_at desc
    limit v_size offset v_off
  ) x;

  return jsonb_build_object('total', v_total, 'counts', v_counts, 'page', v_page, 'page_size', v_size, 'rows', v_rows);
end $$;
grant execute on function public.admin_organizers_list(text, text, int, int) to authenticated;

create or replace function public.admin_organizer_detail(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  select jsonb_build_object(
    'id', p.id, 'name', p.name, 'avatar', p.avatar, 'city', p.city, 'clinic', p.clinic,
    'about', p.about, 'org_status', p.org_status, 'verified', p.verified, 'created_at', p.created_at,
    'phone', public.admin_mask_phone(p.phone),
    'seminars', coalesce((
      select jsonb_agg(jsonb_build_object('id', s.id, 'title', s.title, 'city', s.city, 'status', s.status, 'sold', s.sold, 'seats', s.seats, 'start_date', s.start_date) order by s.sort_at)
      from public.seminars s where s.organizer_id = p.id
    ), '[]'::jsonb)
  ) into v from public.profiles p where p.id = p_id and p.role = 'organizer';
  if v is null then raise exception 'Tashkilotchi topilmadi'; end if;
  return v;
end $$;
grant execute on function public.admin_organizer_detail(uuid) to authenticated;

create or replace function public.admin_review_organizer(p_id uuid, p_action text, p_reason text default '')
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  if p_action not in ('approve','reject','block') then raise exception 'Noto‘g‘ri amal'; end if;
  if p_action = 'reject' and length(trim(coalesce(p_reason,''))) < 3 then raise exception 'Rad etish sababini yozing'; end if;
  update public.profiles set
    org_status = case p_action when 'approve' then 'approved' when 'reject' then 'rejected' else 'blocked' end,
    verified = (p_action = 'approve'),
    blocked = (p_action = 'block'),
    block_reason = case when p_action = 'block' then trim(p_reason) else block_reason end,
    blocked_at = case when p_action = 'block' then now() else blocked_at end,
    blocked_by = case when p_action = 'block' then auth.uid() else blocked_by end,
    updated_at = now()
  where id = p_id and role = 'organizer';
  if not found then raise exception 'Tashkilotchi topilmadi'; end if;
  return jsonb_build_object('ok', true, 'action', p_action);
end $$;
grant execute on function public.admin_review_organizer(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 05 Campaigns (E'lonlar)
-- ---------------------------------------------------------------------------
create or replace function public.admin_campaigns_list(
  p_tab text default 'all',
  p_q text default '',
  p_page int default 1,
  p_page_size int default 10
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_page int := greatest(1, coalesce(p_page, 1));
  v_size int := least(50, greatest(1, coalesce(p_page_size, 10)));
  v_off int := (v_page - 1) * v_size;
  v_q text := lower(trim(coalesce(p_q, '')));
  v_total bigint; v_counts jsonb; v_rows jsonb;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  select jsonb_build_object(
    'all', count(*),
    'moderatsiyada', count(*) filter (where status = 'moderatsiyada'),
    'faol', count(*) filter (where status = 'faol'),
    'toxtatilgan', count(*) filter (where status = 'toxtatilgan'),
    'yakunlangan', count(*) filter (where status = 'yakunlangan')
  ) into v_counts from public.seller_campaigns;

  select count(*) into v_total
  from public.seller_campaigns c
  join public.profiles s on s.id = c.seller_id
  where (p_tab = 'all' or c.status = p_tab)
    and (v_q = '' or lower(c.title) like '%'||v_q||'%' or lower(coalesce(s.shop_name,s.name,'')) like '%'||v_q||'%');

  select coalesce(jsonb_agg(row_to_json(x)::jsonb), '[]'::jsonb) into v_rows from (
    select c.id, c.title, c.status, c.daily_budget, c.days, c.created_at, c.image_url,
           s.id as seller_id, coalesce(nullif(s.shop_name,''), s.name) as shop_name,
           s.city, public.admin_mask_phone(s.phone) as phone
    from public.seller_campaigns c
    join public.profiles s on s.id = c.seller_id
    where (p_tab = 'all' or c.status = p_tab)
      and (v_q = '' or lower(c.title) like '%'||v_q||'%' or lower(coalesce(s.shop_name,s.name,'')) like '%'||v_q||'%')
    order by c.created_at desc
    limit v_size offset v_off
  ) x;

  return jsonb_build_object('total', v_total, 'counts', v_counts, 'page', v_page, 'page_size', v_size, 'rows', v_rows);
end $$;
grant execute on function public.admin_campaigns_list(text, text, int, int) to authenticated;

create or replace function public.admin_campaign_detail(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  select jsonb_build_object(
    'id', c.id, 'title', c.title, 'status', c.status, 'daily_budget', c.daily_budget, 'days', c.days,
    'description', c.description, 'image_url', c.image_url, 'reject_reason', c.reject_reason,
    'created_at', c.created_at, 'product_id', c.product_id,
    'seller', jsonb_build_object(
      'id', s.id, 'name', s.name, 'shop_name', s.shop_name, 'city', s.city,
      'phone', public.admin_mask_phone(s.phone), 'avatar', s.avatar
    ),
    'product', (select jsonb_build_object('id', pr.id, 'name', pr.name, 'image_url', pr.image_url, 'price', pr.price)
                from public.seller_products pr where pr.id = c.product_id)
  ) into v
  from public.seller_campaigns c
  join public.profiles s on s.id = c.seller_id
  where c.id = p_id;
  if v is null then raise exception 'E’lon topilmadi'; end if;
  return v;
end $$;
grant execute on function public.admin_campaign_detail(uuid) to authenticated;

create or replace function public.admin_review_campaign(p_id uuid, p_action text, p_reason text default '')
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  if p_action not in ('approve','reject','pause') then raise exception 'Noto‘g‘ri amal'; end if;
  if p_action = 'reject' and length(trim(coalesce(p_reason,''))) < 3 then raise exception 'Rad etish sababini yozing'; end if;
  update public.seller_campaigns set
    status = case p_action when 'approve' then 'faol' when 'reject' then 'toxtatilgan' else 'toxtatilgan' end,
    reject_reason = case when p_action = 'reject' then trim(p_reason) else reject_reason end,
    reviewed_at = now(),
    reviewed_by = auth.uid()
  where id = p_id;
  if not found then raise exception 'E’lon topilmadi'; end if;
  return jsonb_build_object('ok', true, 'action', p_action);
end $$;
grant execute on function public.admin_review_campaign(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 06 Orders
-- ---------------------------------------------------------------------------
create or replace function public.admin_orders_list(
  p_tab text default 'all',
  p_q text default '',
  p_page int default 1,
  p_page_size int default 10
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_page int := greatest(1, coalesce(p_page, 1));
  v_size int := least(50, greatest(1, coalesce(p_page_size, 10)));
  v_off int := (v_page - 1) * v_size;
  v_q text := lower(trim(coalesce(p_q, '')));
  v_total bigint; v_counts jsonb; v_rows jsonb; v_regions jsonb;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;

  select jsonb_build_object(
    'all', count(*),
    'kutilmoqda', count(*) filter (where status in ('yangi','tasdiqlandi','tayyorlanmoqda')),
    'yuborilgan', count(*) filter (where status = 'yetkazilmoqda'),
    'yetkazilgan', count(*) filter (where status = 'yetkazildi'),
    'bekor', count(*) filter (where status = 'bekor_qilindi')
  ) into v_counts from public.seller_orders;

  select count(*) into v_total from public.seller_orders o
  join public.profiles s on s.id = o.seller_id
  where (
      p_tab = 'all'
      or (p_tab = 'kutilmoqda' and o.status in ('yangi','tasdiqlandi','tayyorlanmoqda'))
      or (p_tab = 'yuborilgan' and o.status = 'yetkazilmoqda')
      or (p_tab = 'yetkazilgan' and o.status = 'yetkazildi')
      or (p_tab = 'bekor' and o.status = 'bekor_qilindi')
    )
    and (v_q = '' or lower(o.code) like '%'||v_q||'%' or lower(o.customer_name) like '%'||v_q||'%'
         or lower(coalesce(s.shop_name,s.name,'')) like '%'||v_q||'%');

  select coalesce(jsonb_agg(row_to_json(x)::jsonb), '[]'::jsonb) into v_rows from (
    select o.id, o.code, o.status, o.subtotal, o.commission, o.payout, o.payment_method, o.created_at,
           o.customer_name, public.admin_mask_phone(o.customer_phone) as customer_phone,
           o.address, coalesce(nullif(s.shop_name,''), s.name) as shop_name, s.city,
           (select jsonb_build_object('name', i.name, 'image_url', i.image_url, 'qty', i.qty)
              from public.seller_order_items i where i.order_id = o.id order by i.id limit 1) as first_item
    from public.seller_orders o
    join public.profiles s on s.id = o.seller_id
    where (
        p_tab = 'all'
        or (p_tab = 'kutilmoqda' and o.status in ('yangi','tasdiqlandi','tayyorlanmoqda'))
        or (p_tab = 'yuborilgan' and o.status = 'yetkazilmoqda')
        or (p_tab = 'yetkazilgan' and o.status = 'yetkazildi')
        or (p_tab = 'bekor' and o.status = 'bekor_qilindi')
      )
      and (v_q = '' or lower(o.code) like '%'||v_q||'%' or lower(o.customer_name) like '%'||v_q||'%'
           or lower(coalesce(s.shop_name,s.name,'')) like '%'||v_q||'%')
    order by o.created_at desc
    limit v_size offset v_off
  ) x;

  select coalesce(jsonb_agg(jsonb_build_object('city', city, 'count', cnt) order by cnt desc), '[]'::jsonb)
    into v_regions
  from (
    select coalesce(nullif(s.city,''), 'Noma’lum') as city, count(*)::int as cnt
    from public.seller_orders o join public.profiles s on s.id = o.seller_id
    group by 1 order by 2 desc limit 12
  ) r;

  return jsonb_build_object('total', v_total, 'counts', v_counts, 'page', v_page, 'page_size', v_size, 'rows', v_rows, 'regions', v_regions);
end $$;
grant execute on function public.admin_orders_list(text, text, int, int) to authenticated;

create or replace function public.admin_order_detail(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  select jsonb_build_object(
    'id', o.id, 'code', o.code, 'status', o.status, 'subtotal', o.subtotal,
    'commission', o.commission, 'payout', o.payout, 'commission_rate', o.commission_rate,
    'payment_method', o.payment_method, 'created_at', o.created_at, 'address', o.address, 'note', o.note,
    'customer_name', o.customer_name, 'customer_phone', public.admin_mask_phone(o.customer_phone),
    'cancel_reason', o.cancel_reason, 'status_history', o.status_history,
    'seller', jsonb_build_object('id', s.id, 'name', s.name, 'shop_name', s.shop_name, 'city', s.city, 'phone', public.admin_mask_phone(s.phone)),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object('id', i.id, 'name', i.name, 'variant', i.variant, 'image_url', i.image_url, 'qty', i.qty, 'price', i.price, 'total', i.total))
      from public.seller_order_items i where i.order_id = o.id
    ), '[]'::jsonb)
  ) into v
  from public.seller_orders o
  join public.profiles s on s.id = o.seller_id
  where o.id = p_id;
  if v is null then raise exception 'Buyurtma topilmadi'; end if;
  return v;
end $$;
grant execute on function public.admin_order_detail(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 07 Escrow
-- ---------------------------------------------------------------------------
create or replace function public.admin_escrow(p_page int default 1, p_page_size int default 10, p_q text default '')
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_page int := greatest(1, coalesce(p_page, 1));
  v_size int := least(50, greatest(1, coalesce(p_page_size, 10)));
  v_off int := (v_page - 1) * v_size;
  v_q text := lower(trim(coalesce(p_q, '')));
  v_total bigint; v_rows jsonb; v_sum jsonb;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  select jsonb_build_object(
    'held', coalesce((select sum(payout) from public.seller_orders where status in ('yangi','tasdiqlandi','tayyorlanmoqda','yetkazilmoqda')), 0),
    'released', coalesce((select sum(payout) from public.seller_orders where status = 'yetkazildi'), 0),
    'commission', coalesce((select sum(commission) from public.seller_orders where status <> 'bekor_qilindi'), 0),
    'orders_held', coalesce((select count(*) from public.seller_orders where status in ('yangi','tasdiqlandi','tayyorlanmoqda','yetkazilmoqda')), 0)
  ) into v_sum;

  select count(*) into v_total from public.seller_orders o
  where o.status in ('yangi','tasdiqlandi','tayyorlanmoqda','yetkazilmoqda')
    and (v_q = '' or lower(o.code) like '%'||v_q||'%');

  select coalesce(jsonb_agg(row_to_json(x)::jsonb), '[]'::jsonb) into v_rows from (
    select o.id, o.code, o.status, o.subtotal, o.commission, o.payout, o.payment_method, o.created_at,
           coalesce(nullif(s.shop_name,''), s.name) as shop_name,
           public.admin_mask_phone(o.customer_phone) as customer_phone
    from public.seller_orders o
    join public.profiles s on s.id = o.seller_id
    where o.status in ('yangi','tasdiqlandi','tayyorlanmoqda','yetkazilmoqda')
      and (v_q = '' or lower(o.code) like '%'||v_q||'%' or lower(coalesce(s.shop_name,s.name,'')) like '%'||v_q||'%')
    order by o.created_at desc
    limit v_size offset v_off
  ) x;

  return jsonb_build_object('summary', v_sum, 'total', v_total, 'page', v_page, 'page_size', v_size, 'rows', v_rows);
end $$;
grant execute on function public.admin_escrow(int, int, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 08 Approvals (unified queue)
-- ---------------------------------------------------------------------------
create or replace function public.admin_approvals_list(
  p_type text default 'all',
  p_q text default '',
  p_page int default 1,
  p_page_size int default 10
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_page int := greatest(1, coalesce(p_page, 1));
  v_size int := least(50, greatest(1, coalesce(p_page_size, 10)));
  v_off int := (v_page - 1) * v_size;
  v_q text := lower(trim(coalesce(p_q, '')));
  v_all jsonb; v_total bigint; v_rows jsonb; v_counts jsonb;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;

  select jsonb_build_object(
    'sellers', (select count(*) from public.profiles where role='seller' and seller_status='pending'),
    'organizers', (select count(*) from public.profiles where role='organizer' and org_status='pending'),
    'ads', (select count(*) from public.seller_campaigns where status='moderatsiyada'),
    'products', (select count(*) from public.seller_products where status='review'),
    'seminars', (select count(*) from public.seminars where held = false and published = true and status = 'yakunlangan')
  ) into v_counts;

  with items as (
    select 'seller'::text as kind, p.id::text as id, coalesce(nullif(p.shop_name,''), p.name) as title,
           'Sotuvchi arizasi' as subtitle, p.name as sender, public.admin_mask_phone(p.phone) as phone,
           p.city, coalesce(p.seller_applied_at, p.created_at) as sent_at,
           coalesce(jsonb_array_length(p.seller_docs), 0) as docs, p.avatar as thumb
    from public.profiles p where p.role='seller' and p.seller_status='pending'
    union all
    select 'organizer', p.id::text, p.name, 'Tashkilotchi arizasi', p.name, public.admin_mask_phone(p.phone),
           p.city, p.created_at, 0, p.avatar
    from public.profiles p where p.role='organizer' and p.org_status='pending'
    union all
    select 'ad', c.id::text, c.title, 'E’lon moderatsiyasi', coalesce(nullif(s.shop_name,''), s.name),
           public.admin_mask_phone(s.phone), s.city, c.created_at, 0, c.image_url
    from public.seller_campaigns c join public.profiles s on s.id=c.seller_id
    where c.status='moderatsiyada'
    union all
    select 'product', pr.id::text, pr.name, 'Mahsulot moderatsiyasi', coalesce(nullif(s.shop_name,''), s.name),
           public.admin_mask_phone(s.phone), s.city, pr.created_at,
           coalesce(jsonb_array_length(pr.documents), 0), pr.image_url
    from public.seller_products pr join public.profiles s on s.id=pr.seller_id
    where pr.status='review'
  )
  select coalesce(jsonb_agg(to_jsonb(i) order by i.sent_at desc), '[]'::jsonb) into v_all from items i
  where (p_type = 'all' or i.kind = p_type)
    and (v_q = '' or lower(i.title) like '%'||v_q||'%' or lower(i.sender) like '%'||v_q||'%' or lower(coalesce(i.city,'')) like '%'||v_q||'%');

  v_total := jsonb_array_length(v_all);
  select coalesce(jsonb_agg(e), '[]'::jsonb) into v_rows
  from jsonb_array_elements(v_all) with ordinality as t(e, ord)
  where ord > v_off and ord <= v_off + v_size;

  return jsonb_build_object('total', v_total, 'counts', v_counts, 'page', v_page, 'page_size', v_size, 'rows', coalesce(v_rows,'[]'::jsonb));
end $$;
grant execute on function public.admin_approvals_list(text, text, int, int) to authenticated;

-- ---------------------------------------------------------------------------
-- 09 Finance + payouts
-- ---------------------------------------------------------------------------
create or replace function public.admin_finance(p_from timestamptz default null, p_to timestamptz default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_from timestamptz := coalesce(p_from, date_trunc('month', now()));
        v_to timestamptz := coalesce(p_to, now());
        v jsonb;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  select jsonb_build_object(
    'turnover', coalesce((select sum(subtotal) from public.seller_orders where created_at between v_from and v_to and status <> 'bekor_qilindi'), 0),
    'commission', coalesce((select sum(commission) from public.seller_orders where created_at between v_from and v_to and status <> 'bekor_qilindi'), 0),
    'payout', coalesce((select sum(payout) from public.seller_orders where created_at between v_from and v_to and status <> 'bekor_qilindi'), 0),
    'commission_rate', 0.12,
    'payouts_pending', coalesce((select sum(amount) from public.seller_payouts where status = 'kutilmoqda'), 0),
    'payouts_paid', coalesce((select sum(amount) from public.seller_payouts where status = 'tolandi'), 0),
    'by_method', coalesce((
      select jsonb_agg(jsonb_build_object('method', payment_method, 'sum', s, 'count', c))
      from (
        select payment_method, sum(subtotal) s, count(*)::int c
        from public.seller_orders
        where created_at between v_from and v_to and status <> 'bekor_qilindi'
        group by payment_method
      ) m
    ), '[]'::jsonb)
  ) into v;
  return v;
end $$;
grant execute on function public.admin_finance(timestamptz, timestamptz) to authenticated;

create or replace function public.admin_payouts_list(
  p_tab text default 'all',
  p_q text default '',
  p_page int default 1,
  p_page_size int default 10
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_page int := greatest(1, coalesce(p_page, 1));
  v_size int := least(50, greatest(1, coalesce(p_page_size, 10)));
  v_off int := (v_page - 1) * v_size;
  v_q text := lower(trim(coalesce(p_q, '')));
  v_total bigint; v_counts jsonb; v_rows jsonb;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  select jsonb_build_object(
    'all', count(*),
    'kutilmoqda', count(*) filter (where status='kutilmoqda'),
    'tolandi', count(*) filter (where status='tolandi'),
    'rad_etildi', count(*) filter (where status='rad_etildi')
  ) into v_counts from public.seller_payouts;

  select count(*) into v_total
  from public.seller_payouts po join public.profiles s on s.id = po.seller_id
  where (p_tab = 'all' or po.status = p_tab)
    and (v_q = '' or lower(coalesce(s.shop_name,s.name,'')) like '%'||v_q||'%');

  select coalesce(jsonb_agg(row_to_json(x)::jsonb), '[]'::jsonb) into v_rows from (
    select po.id, po.amount, po.method, po.status, po.note, po.created_at, po.reject_reason,
           s.id as seller_id, coalesce(nullif(s.shop_name,''), s.name) as shop_name,
           public.admin_mask_phone(s.phone) as phone
    from public.seller_payouts po
    join public.profiles s on s.id = po.seller_id
    where (p_tab = 'all' or po.status = p_tab)
      and (v_q = '' or lower(coalesce(s.shop_name,s.name,'')) like '%'||v_q||'%')
    order by po.created_at desc
    limit v_size offset v_off
  ) x;

  return jsonb_build_object('total', v_total, 'counts', v_counts, 'page', v_page, 'page_size', v_size, 'rows', v_rows);
end $$;
grant execute on function public.admin_payouts_list(text, text, int, int) to authenticated;

create or replace function public.admin_review_payout(p_id uuid, p_action text, p_reason text default '')
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  if p_action not in ('approve','reject') then raise exception 'Noto‘g‘ri amal'; end if;
  if p_action = 'reject' and length(trim(coalesce(p_reason,''))) < 3 then raise exception 'Rad etish sababini yozing'; end if;
  update public.seller_payouts set
    status = case when p_action = 'approve' then 'tolandi' else 'rad_etildi' end,
    reject_reason = case when p_action = 'reject' then trim(p_reason) else reject_reason end,
    reviewed_at = now(),
    reviewed_by = auth.uid()
  where id = p_id and status = 'kutilmoqda';
  if not found then raise exception 'To‘lov so‘rovi topilmadi yoki allaqachon ko‘rib chiqilgan'; end if;
  return jsonb_build_object('ok', true, 'action', p_action);
end $$;
grant execute on function public.admin_review_payout(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 10 Complaints
-- ---------------------------------------------------------------------------
create or replace function public.admin_complaints_list(
  p_tab text default 'all',
  p_q text default '',
  p_page int default 1,
  p_page_size int default 10
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_page int := greatest(1, coalesce(p_page, 1));
  v_size int := least(50, greatest(1, coalesce(p_page_size, 10)));
  v_off int := (v_page - 1) * v_size;
  v_q text := lower(trim(coalesce(p_q, '')));
  v_total bigint; v_counts jsonb; v_rows jsonb;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  select jsonb_build_object(
    'all', count(*),
    'yangi', count(*) filter (where status='yangi'),
    'jarayonda', count(*) filter (where status='jarayonda'),
    'yopildi', count(*) filter (where status='yopildi')
  ) into v_counts from public.admin_complaints;

  select count(*) into v_total from public.admin_complaints c
  where (p_tab = 'all' or c.status = p_tab)
    and (v_q = '' or lower(c.subject) like '%'||v_q||'%' or lower(c.code) like '%'||v_q||'%');

  select coalesce(jsonb_agg(row_to_json(x)::jsonb), '[]'::jsonb) into v_rows from (
    select c.id, c.code, c.subject, c.body, c.status, c.created_at, c.updated_at, c.resolution,
           r.name as reporter_name, public.admin_mask_phone(r.phone) as reporter_phone
    from public.admin_complaints c
    left join public.profiles r on r.id = c.reporter_id
    where (p_tab = 'all' or c.status = p_tab)
      and (v_q = '' or lower(c.subject) like '%'||v_q||'%' or lower(c.code) like '%'||v_q||'%')
    order by c.created_at desc
    limit v_size offset v_off
  ) x;

  return jsonb_build_object('total', v_total, 'counts', v_counts, 'page', v_page, 'page_size', v_size, 'rows', v_rows);
end $$;
grant execute on function public.admin_complaints_list(text, text, int, int) to authenticated;

create or replace function public.admin_complaint_update(p_id uuid, p_status text, p_resolution text default '')
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  if p_status not in ('yangi','jarayonda','yopildi') then raise exception 'Noto‘g‘ri holat'; end if;
  update public.admin_complaints set
    status = p_status,
    resolution = coalesce(nullif(trim(p_resolution), ''), resolution),
    updated_at = now(),
    assignee_id = auth.uid()
  where id = p_id;
  if not found then raise exception 'Shikoyat topilmadi'; end if;
  return jsonb_build_object('ok', true);
end $$;
grant execute on function public.admin_complaint_update(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 11 Reports
-- ---------------------------------------------------------------------------
create or replace function public.admin_reports(p_from timestamptz default null, p_to timestamptz default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_from timestamptz := coalesce(p_from, date_trunc('month', now()));
        v_to timestamptz := coalesce(p_to, now());
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  return jsonb_build_object(
    'turnover', coalesce((select sum(subtotal) from public.seller_orders where created_at between v_from and v_to and status <> 'bekor_qilindi'), 0),
    'commission', coalesce((select sum(commission) from public.seller_orders where created_at between v_from and v_to and status <> 'bekor_qilindi'), 0),
    'orders', coalesce((select count(*) from public.seller_orders where created_at between v_from and v_to), 0),
    'users_new', coalesce((select count(*) from public.profiles where created_at between v_from and v_to and role <> 'admin'), 0),
    'sellers_new', coalesce((select count(*) from public.profiles where created_at between v_from and v_to and role = 'seller'), 0),
    'daily', coalesce((
      select jsonb_agg(jsonb_build_object('day', d, 'sum', s, 'orders', o) order by d)
      from (
        select extract(day from created_at)::int d, sum(subtotal) s, count(*)::int o
        from public.seller_orders
        where created_at between v_from and v_to and status <> 'bekor_qilindi'
        group by 1
      ) x
    ), '[]'::jsonb),
    'top_sellers', coalesce((
      select jsonb_agg(jsonb_build_object('shop', shop, 'sum', s, 'orders', o) order by s desc)
      from (
        select coalesce(nullif(p.shop_name,''), p.name) shop, sum(o.subtotal) s, count(*)::int o
        from public.seller_orders o join public.profiles p on p.id = o.seller_id
        where o.created_at between v_from and v_to and o.status <> 'bekor_qilindi'
        group by 1 order by 2 desc limit 10
      ) t
    ), '[]'::jsonb),
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object('name', category, 'sum', s, 'orders', o) order by s desc)
      from (
        select coalesce(nullif(pr.category,''), 'Boshqa') category, sum(i.total) s, count(distinct i.order_id)::int o
        from public.seller_order_items i
        left join public.seller_products pr on pr.id = i.product_id
        join public.seller_orders o on o.id = i.order_id
        where o.created_at between v_from and v_to and o.status <> 'bekor_qilindi'
        group by 1 order by 2 desc limit 10
      ) c
    ), '[]'::jsonb)
  );
end $$;
grant execute on function public.admin_reports(timestamptz, timestamptz) to authenticated;

-- ---------------------------------------------------------------------------
-- 12 Settings
-- ---------------------------------------------------------------------------
create or replace function public.admin_settings_get()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  select to_jsonb(s) into v from public.admin_settings s where id = 'main';
  return coalesce(v, '{}'::jsonb);
end $$;
grant execute on function public.admin_settings_get() to authenticated;

create or replace function public.admin_settings_set(p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  update public.admin_settings set
    platform_name = coalesce(p->>'platform_name', platform_name),
    tagline = coalesce(p->>'tagline', tagline),
    description = coalesce(p->>'description', description),
    site_url = coalesce(p->>'site_url', site_url),
    contact_phone = coalesce(p->>'contact_phone', contact_phone),
    contact_email = coalesce(p->>'contact_email', contact_email),
    primary_color = coalesce(p->>'primary_color', primary_color),
    commission_pct = coalesce((p->>'commission_pct')::numeric, commission_pct),
    payment_methods = case when p ? 'payment_methods' then (
      select array_agg(x) from jsonb_array_elements_text(p->'payment_methods') x
    ) else payment_methods end,
    notify_orders = coalesce((p->>'notify_orders')::boolean, notify_orders),
    notify_sellers = coalesce((p->>'notify_sellers')::boolean, notify_sellers),
    notify_organizers = coalesce((p->>'notify_organizers')::boolean, notify_organizers),
    notify_complaints = coalesce((p->>'notify_complaints')::boolean, notify_complaints),
    twofa_required = coalesce((p->>'twofa_required')::boolean, twofa_required),
    ip_restrict = coalesce((p->>'ip_restrict')::boolean, ip_restrict),
    updated_at = now(),
    updated_by = auth.uid()
  where id = 'main';
  select to_jsonb(s) into v from public.admin_settings s where id = 'main';
  return v;
end $$;
grant execute on function public.admin_settings_set(jsonb) to authenticated;
