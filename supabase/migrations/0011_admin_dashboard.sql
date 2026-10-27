-- Admin dashboard aggregates + seller application review.
-- Admin-only SECURITY DEFINER RPCs (is_admin()). Do not expose to anon.
-- Apply via Supabase SQL editor; do not run from the app.

-- ---------------------------------------------------------------------------
-- Schema extensions for seller applications + complaints + payment methods
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists seller_status text not null default 'none',
  add column if not exists org_type text not null default '',
  add column if not exists stir text not null default '',
  add column if not exists shop_address text not null default '',
  add column if not exists shop_type text not null default '',
  add column if not exists shop_categories text[] not null default '{}',
  add column if not exists shop_description text not null default '',
  add column if not exists seller_extra text not null default '',
  add column if not exists seller_docs jsonb not null default '[]'::jsonb,
  add column if not exists seller_applied_at timestamptz,
  add column if not exists seller_reject_reason text not null default '',
  add column if not exists blocked boolean not null default false;

alter table public.profiles drop constraint if exists profiles_seller_status_check;
alter table public.profiles add constraint profiles_seller_status_check
  check (seller_status in ('none', 'pending', 'approved', 'rejected', 'blocked'));

-- Backfill: existing sellers without verified flag → pending; verified → approved
update public.profiles
   set seller_status = case
     when role = 'seller' and coalesce(verified, false) then 'approved'
     when role = 'seller' then 'pending'
     else seller_status
   end
 where role = 'seller' and seller_status = 'none';

update public.profiles
   set seller_applied_at = coalesce(seller_applied_at, created_at)
 where role = 'seller' and seller_applied_at is null;

-- Payments: allow demo card/wallet methods (user decision supersedes cash-only design)
alter table public.seller_orders drop constraint if exists seller_orders_payment_method_check;
alter table public.seller_orders add constraint seller_orders_payment_method_check
  check (payment_method in ('cash', 'naqd', 'uzcard', 'humo', 'click', 'payme', 'card'));

create table if not exists public.admin_complaints (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default ('SHK-' || lpad(nextval('public.seller_order_seq')::text, 5, '0')),
  subject text not null default '',
  body text not null default '',
  status text not null default 'yangi' check (status in ('yangi', 'jarayonda', 'yopildi')),
  reporter_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.admin_complaints enable row level security;
drop policy if exists admin_complaints_admin_all on public.admin_complaints;
create policy admin_complaints_admin_all on public.admin_complaints
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.admin_complaints to authenticated;

-- ---------------------------------------------------------------------------
-- admin_dashboard(p_from, p_to) → jsonb
-- ---------------------------------------------------------------------------
create or replace function public.admin_dashboard(p_from timestamptz, p_to timestamptz)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from timestamptz := coalesce(p_from, date_trunc('month', now()));
  v_to   timestamptz := coalesce(p_to, now());
  v_prev_from timestamptz;
  v_prev_to   timestamptz;
  v jsonb;
begin
  if not public.is_admin() then
    raise exception 'Faqat admin';
  end if;

  v_prev_from := v_from - (v_to - v_from);
  v_prev_to := v_from;

  select jsonb_build_object(
    'turnover', coalesce((
      select sum(subtotal) from public.seller_orders
       where created_at >= v_from and created_at <= v_to
         and status <> 'bekor_qilindi'
    ), 0),
    'escrow', coalesce((
      select sum(payout) from public.seller_orders
       where status in ('yangi','tasdiqlandi','tayyorlanmoqda','yetkazilmoqda')
    ), 0),
    'commission', coalesce((
      select sum(commission) from public.seller_orders
       where created_at >= v_from and created_at <= v_to
         and status <> 'bekor_qilindi'
    ), 0),
    'net', coalesce((
      select sum(payout) from public.seller_orders
       where created_at >= v_from and created_at <= v_to
         and status <> 'bekor_qilindi'
    ), 0),
    'orders_count', coalesce((
      select count(*) from public.seller_orders
       where created_at >= v_from and created_at <= v_to
    ), 0),
    'orders_prev', coalesce((
      select count(*) from public.seller_orders
       where created_at >= v_prev_from and created_at < v_prev_to
    ), 0),
    'products_count', coalesce((select count(*) from public.seller_products), 0),
    'users_count', coalesce((select count(*) from public.profiles), 0),
    'active_users', coalesce((
      select count(*) from public.profiles
       where updated_at >= v_from or created_at >= v_from
    ), 0),
    'seminars_count', coalesce((
      select count(*) from public.seminars
       where created_at >= v_from and created_at <= v_to
    ), 0),
    'new_users', jsonb_build_object(
      'total', coalesce((select count(*) from public.profiles where created_at >= v_from and created_at <= v_to), 0),
      'customers', coalesce((select count(*) from public.profiles where role = 'customer' and created_at >= v_from and created_at <= v_to), 0),
      'sellers', coalesce((select count(*) from public.profiles where role = 'seller' and created_at >= v_from and created_at <= v_to), 0),
      'organizers', coalesce((select count(*) from public.profiles where role = 'organizer' and created_at >= v_from and created_at <= v_to), 0)
    ),
    'daily', coalesce((
      select jsonb_agg(jsonb_build_object('day', d, 'sum', s) order by d)
      from (
        select extract(day from created_at)::int as d, coalesce(sum(subtotal), 0) as s
          from public.seller_orders
         where created_at >= v_from and created_at <= v_to
           and status <> 'bekor_qilindi'
         group by 1
      ) x
    ), '[]'::jsonb),
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object('name', name, 'orders', orders, 'sum', sum) order by sum desc)
      from (
        select coalesce(nullif(p.category, ''), 'Boshqa') as name,
               count(distinct i.order_id)::int as orders,
               coalesce(sum(i.total), 0) as sum
          from public.seller_order_items i
          join public.seller_orders o on o.id = i.order_id
          left join public.seller_products p on p.id = i.product_id
         where o.created_at >= v_from and o.created_at <= v_to
           and o.status <> 'bekor_qilindi'
         group by 1
         order by 3 desc
         limit 12
      ) c
    ), '[]'::jsonb),
    'recent_orders', coalesce((
      select jsonb_agg(row_to_json(r)::jsonb)
      from (
        select o.id, o.code, o.created_at, o.customer_phone, o.subtotal, o.status, o.payment_method,
               coalesce(nullif(pr.shop_name, ''), pr.name, '—') as shop_name,
               coalesce((
                 select coalesce(nullif(p.category, ''), i.name)
                   from public.seller_order_items i
                   left join public.seller_products p on p.id = i.product_id
                  where i.order_id = o.id
                  order by i.total desc nulls last
                  limit 1
               ), '—') as category,
               coalesce((
                 select i.image_url from public.seller_order_items i
                  where i.order_id = o.id and i.image_url <> ''
                  limit 1
               ), '') as image_url
          from public.seller_orders o
          left join public.profiles pr on pr.id = o.seller_id
         order by o.created_at desc
         limit 8
      ) r
    ), '[]'::jsonb),
    'pending', jsonb_build_object(
      'sellers', coalesce((select count(*) from public.profiles where role = 'seller' and seller_status = 'pending'), 0),
      'organizers', coalesce((
        select count(*) from public.profiles
         where role = 'organizer' and coalesce(verified, false) = false
      ), 0),
      'ads', coalesce((
        select count(*) from public.seller_campaigns where status = 'moderatsiyada'
      ), 0),
      'products', coalesce((
        select count(*) from public.seller_products where status = 'review'
      ), 0),
      'users', 0
    ),
    'pending_sellers', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id, 'name', name, 'shop_name', shop_name, 'created_at', created_at
      ) order by created_at desc)
      from (
        select id, name, shop_name, created_at
          from public.profiles
         where role = 'seller' and seller_status = 'pending'
         order by created_at desc
         limit 10
      ) s
    ), '[]'::jsonb),
    'complaints', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id, 'code', code, 'subject', subject, 'created_at', created_at, 'status', status
      ) order by created_at desc)
      from (
        select id, code, subject, created_at, status
          from public.admin_complaints
         order by created_at desc
         limit 5
      ) c
    ), '[]'::jsonb),
    'activity', coalesce((
      select jsonb_agg(a order by (a->>'at')::timestamptz desc)
      from (
        (
          select jsonb_build_object(
            'kind', 'order', 'title', 'Yangi buyurtma',
            'detail', '#' || o.code || ' · ' || o.subtotal::text || ' so‘m',
            'at', o.created_at
          ) as a
          from public.seller_orders o
          order by o.created_at desc limit 3
        )
        union all
        (
          select jsonb_build_object(
            'kind', 'user', 'title', 'Yangi foydalanuvchi',
            'detail', '+998 ** *** ** **',
            'at', p.created_at
          )
          from public.profiles p
          where p.role = 'customer'
          order by p.created_at desc limit 2
        )
        union all
        (
          select jsonb_build_object(
            'kind', 'seller', 'title', 'Yangi sotuvchi',
            'detail', coalesce(nullif(p.shop_name, ''), p.name, 'Sotuvchi'),
            'at', coalesce(p.seller_applied_at, p.created_at)
          )
          from public.profiles p
          where p.role = 'seller'
          order by coalesce(p.seller_applied_at, p.created_at) desc limit 2
        )
        union all
        (
          select jsonb_build_object(
            'kind', 'seminar', 'title', 'Yangi seminar',
            'detail', s.title,
            'at', s.created_at
          )
          from public.seminars s
          order by s.created_at desc limit 2
        )
      ) u
    ), '[]'::jsonb)
  ) into v;

  return v;
end;
$$;

revoke all on function public.admin_dashboard(timestamptz, timestamptz) from public, anon;
grant execute on function public.admin_dashboard(timestamptz, timestamptz) to authenticated;

-- ---------------------------------------------------------------------------
-- admin_seller_application(p_id)
-- ---------------------------------------------------------------------------
create or replace function public.admin_seller_application(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare r public.profiles%rowtype;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  select * into r from public.profiles where id = p_id;
  if r.id is null then raise exception 'Sotuvchi topilmadi'; end if;
  return jsonb_build_object(
    'id', r.id,
    'name', r.name,
    'phone', r.phone,
    'email', r.email,
    'shop_name', r.shop_name,
    'shop_type', nullif(r.shop_type, ''),
    'address', coalesce(nullif(r.shop_address, ''), nullif(r.clinic, ''), ''),
    'shop_address', r.shop_address,
    'org_type', r.org_type,
    'stir', r.stir,
    'extra', r.seller_extra,
    'shop_description', r.shop_description,
    'categories', to_jsonb(r.shop_categories),
    'docs', r.seller_docs,
    'seller_status', r.seller_status,
    'verified', r.verified,
    'created_at', r.created_at,
    'applied_at', coalesce(r.seller_applied_at, r.created_at)
  );
end;
$$;

revoke all on function public.admin_seller_application(uuid) from public, anon;
grant execute on function public.admin_seller_application(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- admin_review_seller(p_id, p_action, p_reason)
-- ---------------------------------------------------------------------------
create or replace function public.admin_review_seller(p_id uuid, p_action text, p_reason text default '')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare r public.profiles%rowtype;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  select * into r from public.profiles where id = p_id for update;
  if r.id is null then raise exception 'Sotuvchi topilmadi'; end if;

  if p_action = 'approve' then
    update public.profiles set
      role = 'seller',
      seller_status = 'approved',
      verified = true,
      blocked = false,
      seller_reject_reason = '',
      updated_at = now()
    where id = p_id;
  elsif p_action = 'reject' then
    update public.profiles set
      seller_status = 'rejected',
      verified = false,
      seller_reject_reason = left(coalesce(p_reason, ''), 500),
      updated_at = now()
    where id = p_id;
  elsif p_action = 'block' then
    update public.profiles set
      seller_status = 'blocked',
      blocked = true,
      verified = false,
      seller_reject_reason = left(coalesce(p_reason, ''), 500),
      updated_at = now()
    where id = p_id;
  else
    raise exception 'Noma''lum amal: %', p_action;
  end if;

  return jsonb_build_object('ok', true, 'id', p_id, 'action', p_action);
end;
$$;

revoke all on function public.admin_review_seller(uuid, text, text) from public, anon;
grant execute on function public.admin_review_seller(uuid, text, text) to authenticated;
