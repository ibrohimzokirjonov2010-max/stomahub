-- 0058: Shaxsiy tavsiyalar uchun qiziqish hodisalari (qidiruv, ko‘rish, savatcha).
-- HOLAT: QO‘LLANMAGAN. Ilova bu migratsiyasiz ham ishlaydi (signallar brauzerda saqlanadi).
-- Xaridlar bu jadvalga yozilmaydi — ular seller_orders / seller_order_items dan (bekor qilinmagan buyurtmalar) olinadi.
-- Maxfiylik: hodisalar faqat egasiga (o‘qish) va adminga (admin_interest_summary) ko‘rinadi; sotuvchilarga berilmaydi.

create table if not exists public.user_interest_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('search', 'view', 'cart', 'purchase')),
  product_id uuid null,
  category text null check (category is null or length(category) <= 80),
  query text null check (query is null or length(query) <= 100),
  results_count integer null check (results_count is null or results_count >= 0),
  created_at timestamptz not null default now()
);

create index if not exists user_interest_events_user_idx on public.user_interest_events (user_id, created_at desc);
create index if not exists user_interest_events_product_idx on public.user_interest_events (product_id, created_at desc) where product_id is not null;
create index if not exists user_interest_events_zero_search_idx on public.user_interest_events (created_at desc) where kind = 'search' and results_count = 0;

alter table public.user_interest_events enable row level security;
revoke all on table public.user_interest_events from public, anon;
grant select, insert on table public.user_interest_events to authenticated;

drop policy if exists user_interest_events_insert_own on public.user_interest_events;
create policy user_interest_events_insert_own on public.user_interest_events
  for insert to authenticated
  with check (user_id = auth.uid() and kind <> 'purchase');

drop policy if exists user_interest_events_select_own on public.user_interest_events;
create policy user_interest_events_select_own on public.user_interest_events
  for select to authenticated
  using (user_id = auth.uid());
-- update / delete siyosati yo‘q: foydalanuvchi o‘zgartira olmaydi. Hisob o‘chirilsa — cascade.

-- Normallashtirish va oddiy suiiste’moldan himoya: daqiqasiga 60 tadan ortiq yoki 10 s ichida aynan takror — jimgina o‘tkazib yuboriladi.
create or replace function public.user_interest_events_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.user_id := auth.uid();
  if new.user_id is null then return null; end if;
  new.query := nullif(left(btrim(coalesce(new.query, '')), 100), '');
  new.category := nullif(left(btrim(coalesce(new.category, '')), 80), '');
  if new.kind = 'search' and new.query is null then return null; end if;
  if new.kind in ('view', 'cart') and new.product_id is null and new.category is null then return null; end if;
  if (select count(*) from public.user_interest_events e
       where e.user_id = new.user_id and e.created_at > now() - interval '1 minute') >= 60 then
    return null;
  end if;
  if exists (select 1 from public.user_interest_events e
       where e.user_id = new.user_id and e.kind = new.kind
         and e.product_id is not distinct from new.product_id
         and e.category is not distinct from new.category
         and lower(coalesce(e.query, '')) = lower(coalesce(new.query, ''))
         and e.created_at > now() - interval '10 seconds') then
    return null;
  end if;
  new.created_at := now();
  return new;
end $$;

drop trigger if exists user_interest_events_guard on public.user_interest_events;
create trigger user_interest_events_guard before insert on public.user_interest_events
  for each row execute function public.user_interest_events_guard();

-- Chaqiruvchining o‘z qiziqish profili (agregat). Xaridlar — haqiqiy buyurtmalardan.
create or replace function public.my_interest_profile()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  res jsonb;
begin
  if uid is null then return '{}'::jsonb; end if;
  with ev as (
    select * from public.user_interest_events
    where user_id = uid and created_at > now() - interval '90 days'
  ),
  pv as (
    select product_id,
      count(*) filter (where kind = 'view') as views, max(created_at) filter (where kind = 'view') as view_at,
      count(*) filter (where kind = 'cart') as carts, max(created_at) filter (where kind = 'cart') as cart_at
    from ev where product_id is not null group by product_id
  ),
  pu as (
    select i.product_id, count(*) as purchases, max(o.created_at) as purchase_at
    from public.seller_orders o join public.seller_order_items i on i.order_id = o.id
    where o.buyer_id = uid and o.status <> 'bekor_qilindi' and i.product_id is not null
      and o.created_at > now() - interval '365 days'
    group by i.product_id
  ),
  pr as (
    select coalesce(pv.product_id, pu.product_id) as product_id,
      coalesce(pv.views, 0) as views, pv.view_at, coalesce(pv.carts, 0) as carts, pv.cart_at,
      coalesce(pu.purchases, 0) as purchases, pu.purchase_at, sp.category
    from pv full join pu on pu.product_id = pv.product_id
    left join public.seller_products sp on sp.id = coalesce(pv.product_id, pu.product_id)
  ),
  ca as (
    select category, count(*) as views, max(created_at) as at
    from ev where kind = 'view' and product_id is null and category is not null group by category
  ),
  qu as (
    select lower(query) as query, count(*) as n, max(created_at) as at
    from ev where kind = 'search' and created_at > now() - interval '60 days' group by lower(query)
    order by max(created_at) desc limit 20
  ),
  pop as (
    select e.product_id, count(distinct e.user_id) as u
    from public.user_interest_events e join public.seller_products sp on sp.id = e.product_id and sp.status = 'active'
    where e.kind in ('view', 'cart') and e.created_at > now() - interval '30 days'
    group by e.product_id order by count(distinct e.user_id) desc, max(e.created_at) desc limit 20
  )
  select jsonb_build_object(
    'products', coalesce((select jsonb_agg(to_jsonb(pr)) from pr), '[]'::jsonb),
    'categories', coalesce((select jsonb_agg(to_jsonb(ca)) from ca), '[]'::jsonb),
    'queries', coalesce((select jsonb_agg(to_jsonb(qu)) from qu), '[]'::jsonb),
    'popular', coalesce((select jsonb_agg(product_id) from pop), '[]'::jsonb)
  ) into res;
  return res;
end $$;

revoke all on function public.my_interest_profile() from public, anon;
grant execute on function public.my_interest_profile() to authenticated;

-- Sotuv jamoasi uchun (faqat admin): har bir mijozning qiziqishlari va topilmagan qidiruvlar.
create or replace function public.admin_interest_summary(p_days integer default 30)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  d integer := greatest(1, least(coalesce(p_days, 30), 365));
  res jsonb;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  with ev as (
    select e.*, coalesce(e.category, sp.category) as cat, sp.name as product_name
    from public.user_interest_events e
    left join public.seller_products sp on sp.id = e.product_id
    where e.created_at > now() - make_interval(days => d)
  ),
  buys as (
    select o.buyer_id as user_id, i.product_id, i.name, sp.category, o.created_at
    from public.seller_orders o join public.seller_order_items i on i.order_id = o.id
    left join public.seller_products sp on sp.id = i.product_id
    where o.buyer_id is not null and o.status <> 'bekor_qilindi' and o.created_at > now() - make_interval(days => d)
  ),
  users as (
    select user_id from ev union select user_id from buys
  ),
  per as (
    select u.user_id,
      coalesce(nullif(btrim(p.name), ''), nullif(btrim(p.full_name), ''), '') as name,
      coalesce(p.phone, '') as phone, coalesce(p.specialty, '') as specialty,
      (select count(*) from ev where ev.user_id = u.user_id) as events,
      (select count(*) from buys b where b.user_id = u.user_id) as purchases,
      greatest((select max(created_at) from ev where ev.user_id = u.user_id), (select max(created_at) from buys b where b.user_id = u.user_id)) as last_at,
      (select coalesce(jsonb_agg(c.cat), '[]'::jsonb) from (
         select cat from (
           select cat, case kind when 'cart' then 4 when 'view' then 1 else 0 end as w from ev where ev.user_id = u.user_id and cat is not null
           union all select category, 6 from buys b where b.user_id = u.user_id and category is not null
         ) x group by cat order by sum(w) desc limit 3) c) as top_categories,
      (select coalesce(jsonb_agg(jsonb_build_object('product_id', t.product_id, 'name', t.product_name, 'views', t.views, 'carts', t.carts)), '[]'::jsonb) from (
         select product_id, max(product_name) as product_name,
           count(*) filter (where kind = 'view') as views, count(*) filter (where kind = 'cart') as carts
         from ev where ev.user_id = u.user_id and product_id is not null
         group by product_id order by count(*) filter (where kind = 'cart') * 3 + count(*) desc limit 5) t) as top_products,
      (select coalesce(jsonb_agg(s.q), '[]'::jsonb) from (
         select lower(query) as q from ev where ev.user_id = u.user_id and kind = 'search'
         group by lower(query) order by count(*) desc, max(created_at) desc limit 5) s) as top_searches
    from users u left join public.profiles p on p.id = u.user_id
  ),
  zero as (
    select lower(btrim(query)) as term, count(*) as count, count(distinct user_id) as users, max(created_at) as last_at
    from ev where kind = 'search' and results_count = 0 and query is not null
    group by lower(btrim(query)) order by count(*) desc, max(created_at) desc limit 100
  )
  select jsonb_build_object(
    'days', d,
    'users', coalesce((select jsonb_agg(to_jsonb(per) order by per.last_at desc nulls last) from (select * from per order by last_at desc nulls last limit 300) per), '[]'::jsonb),
    'zero_searches', coalesce((select jsonb_agg(to_jsonb(zero)) from zero), '[]'::jsonb)
  ) into res;
  return res;
end $$;

revoke all on function public.admin_interest_summary(integer) from public, anon;
grant execute on function public.admin_interest_summary(integer) to authenticated;
