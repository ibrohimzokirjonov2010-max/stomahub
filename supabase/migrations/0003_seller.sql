-- StomaHub — Sotuvchi kabineti (seller) schema.
-- Run once in Supabase SQL Editor after 0001_init.sql and 0002_customer.sql.
-- Table names are prefixed with seller_ so they never collide with the older
-- marketplace tables (products, orders, reviews ...).
-- Every row belongs to one seller (seller_id = auth.uid()) and RLS makes sure
-- a seller only ever sees and changes their own rows.

-- 1. allow the 'seller' role on profiles --------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('customer', 'organizer', 'seller'));
alter table public.profiles add column if not exists shop_name text not null default '';

create or replace function public.is_seller()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'seller');
$$;

-- 2. products ------------------------------------------------------------------
create table if not exists public.seller_products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  sku text not null default '',
  category text not null default '',
  price numeric(14,0) not null default 0 check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  image_url text not null default '',
  description text not null default '',
  status text not null default 'active' check (status in ('active', 'draft', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists seller_products_seller_idx on public.seller_products (seller_id, created_at desc);

-- 3. customers (manually added by seller) ---------------------------------------
create table if not exists public.seller_customers (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  phone text not null default '',
  city text not null default '',
  note text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists seller_customers_seller_idx on public.seller_customers (seller_id);

-- 4. orders + items ----------------------------------------------------------------
create sequence if not exists public.seller_order_seq start 1;

create table if not exists public.seller_orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default ('STH-' || lpad(nextval('public.seller_order_seq')::text, 5, '0')),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  buyer_id uuid references public.profiles (id) on delete set null,
  customer_name text not null default '',
  customer_phone text not null default '',
  address text not null default '',
  note text not null default '',
  source text not null default 'marketplace' check (source in ('marketplace', 'manual')),
  payment_method text not null default 'cash' check (payment_method = 'cash'),
  status text not null default 'yangi'
    check (status in ('yangi', 'tasdiqlandi', 'tayyorlanmoqda', 'yetkazilmoqda', 'yetkazildi', 'bekor_qilindi')),
  subtotal numeric(14,0) not null default 0,
  commission_rate numeric(5,4) not null default 0.12 check (commission_rate = 0.12),
  commission numeric(14,0) generated always as (round(subtotal * commission_rate)) stored,
  payout numeric(14,0) generated always as (subtotal - round(subtotal * commission_rate)) stored,
  status_history jsonb not null default '[]'::jsonb,
  cancel_reason text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists seller_orders_seller_idx on public.seller_orders (seller_id, created_at desc);

create table if not exists public.seller_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.seller_orders (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid references public.seller_products (id) on delete set null,
  name text not null default '',
  variant text not null default '',
  image_url text not null default '',
  qty integer not null default 1 check (qty > 0),
  price numeric(14,0) not null default 0 check (price >= 0),
  total numeric(14,0) generated always as (qty * price) stored
);
create index if not exists seller_order_items_order_idx on public.seller_order_items (order_id);
create index if not exists seller_order_items_seller_idx on public.seller_order_items (seller_id);

-- keep subtotal in sync with items
create or replace function public.seller_order_recalc()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_order uuid := coalesce(new.order_id, old.order_id);
begin
  update public.seller_orders
     set subtotal = coalesce((select sum(qty * price) from public.seller_order_items where order_id = v_order), 0),
         updated_at = now()
   where id = v_order;
  return null;
end $$;
drop trigger if exists seller_order_items_recalc on public.seller_order_items;
create trigger seller_order_items_recalc after insert or update or delete on public.seller_order_items
  for each row execute function public.seller_order_recalc();

-- status history + allowed transitions
create or replace function public.seller_order_status_guard()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    new.status_history := jsonb_build_array(jsonb_build_object('status', new.status, 'at', now()));
    return new;
  end if;
  if new.status is distinct from old.status then
    if old.status in ('yetkazildi', 'bekor_qilindi') then
      raise exception 'Yakunlangan buyurtma holatini o''zgartirib bo''lmaydi';
    end if;
    if not (
      (old.status = 'yangi' and new.status in ('tasdiqlandi', 'bekor_qilindi')) or
      (old.status = 'tasdiqlandi' and new.status in ('tayyorlanmoqda', 'bekor_qilindi')) or
      (old.status = 'tayyorlanmoqda' and new.status in ('yetkazilmoqda', 'bekor_qilindi')) or
      (old.status = 'yetkazilmoqda' and new.status in ('yetkazildi', 'bekor_qilindi'))
    ) then
      raise exception 'Holatni % dan % ga o''tkazib bo''lmaydi', old.status, new.status;
    end if;
    new.status_history := old.status_history || jsonb_build_object('status', new.status, 'at', now());
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists seller_orders_status_guard on public.seller_orders;
create trigger seller_orders_status_guard before insert or update on public.seller_orders
  for each row execute function public.seller_order_status_guard();

-- 5. reviews -----------------------------------------------------------------------
create table if not exists public.seller_reviews (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid references public.seller_products (id) on delete set null,
  order_id uuid references public.seller_orders (id) on delete set null,
  author_id uuid references public.profiles (id) on delete set null default auth.uid(),
  author_name text not null default '',
  rating integer not null check (rating between 1 and 5),
  body text not null default '',
  reply text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists seller_reviews_seller_idx on public.seller_reviews (seller_id, created_at desc);

-- 6. discounts, campaigns, payouts -------------------------------------------------
create table if not exists public.seller_discounts (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  percent integer not null check (percent between 1 and 90),
  product_id uuid references public.seller_products (id) on delete cascade,
  starts_on date not null default current_date,
  ends_on date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.seller_campaigns (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  product_id uuid references public.seller_products (id) on delete set null,
  daily_budget numeric(14,0) not null default 0 check (daily_budget >= 0),
  days integer not null default 7 check (days between 1 and 90),
  status text not null default 'moderatsiyada' check (status in ('moderatsiyada', 'faol', 'toxtatilgan', 'yakunlangan')),
  created_at timestamptz not null default now()
);

create table if not exists public.seller_payouts (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  amount numeric(14,0) not null check (amount > 0),
  method text not null default 'naqd' check (method = 'naqd'),
  note text not null default '',
  status text not null default 'kutilmoqda' check (status in ('kutilmoqda', 'tolandi', 'rad_etildi')),
  created_at timestamptz not null default now()
);

-- wallet: delivered orders' payout minus payouts not rejected
create or replace function public.seller_wallet()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'earned', coalesce((select sum(payout) from public.seller_orders where seller_id = auth.uid() and status = 'yetkazildi'), 0),
    'pending', coalesce((select sum(payout) from public.seller_orders where seller_id = auth.uid() and status in ('yangi','tasdiqlandi','tayyorlanmoqda','yetkazilmoqda')), 0),
    'withdrawn', coalesce((select sum(amount) from public.seller_payouts where seller_id = auth.uid() and status <> 'rad_etildi'), 0)
  );
$$;

create or replace function public.seller_payout_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare v jsonb := public.seller_wallet();
begin
  if new.amount > (v->>'earned')::numeric - (v->>'withdrawn')::numeric then
    raise exception 'Hamyonda yetarli mablag'' yo''q';
  end if;
  return new;
end $$;
drop trigger if exists seller_payouts_guard on public.seller_payouts;
create trigger seller_payouts_guard before insert on public.seller_payouts
  for each row execute function public.seller_payout_guard();

-- manual order (Tezkor amal -> Buyurtma qo'lda qo'shish)
create or replace function public.seller_create_manual_order(payload jsonb)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare v_order public.seller_orders; v_item jsonb; v_p public.seller_products;
begin
  if not public.is_seller() then raise exception 'Faqat sotuvchilar uchun'; end if;
  insert into public.seller_orders (seller_id, customer_name, customer_phone, address, note, source)
  values (auth.uid(), coalesce(payload->>'customer_name',''), coalesce(payload->>'customer_phone',''),
          coalesce(payload->>'address',''), coalesce(payload->>'note',''), 'manual')
  returning * into v_order;
  for v_item in select * from jsonb_array_elements(coalesce(payload->'items','[]'::jsonb)) loop
    select * into v_p from public.seller_products where id = (v_item->>'product_id')::uuid and seller_id = auth.uid();
    if v_p.id is null then raise exception 'Mahsulot topilmadi'; end if;
    insert into public.seller_order_items (order_id, seller_id, product_id, name, image_url, qty, price)
    values (v_order.id, auth.uid(), v_p.id, v_p.name, v_p.image_url, greatest(1, coalesce((v_item->>'qty')::int,1)), v_p.price);
    update public.seller_products set stock = greatest(0, stock - greatest(1, coalesce((v_item->>'qty')::int,1))) where id = v_p.id;
  end loop;
  return jsonb_build_object('id', v_order.id, 'code', v_order.code);
end $$;

-- 7. RLS ---------------------------------------------------------------------------
alter table public.seller_products enable row level security;
alter table public.seller_customers enable row level security;
alter table public.seller_orders enable row level security;
alter table public.seller_order_items enable row level security;
alter table public.seller_reviews enable row level security;
alter table public.seller_discounts enable row level security;
alter table public.seller_campaigns enable row level security;
alter table public.seller_payouts enable row level security;

do $$
declare t text;
begin
  foreach t in array array['seller_products','seller_customers','seller_orders','seller_order_items',
                           'seller_reviews','seller_discounts','seller_campaigns','seller_payouts'] loop
    execute format('drop policy if exists %I on public.%I', t || '_own', t);
    execute format('create policy %I on public.%I for all to authenticated using (seller_id = auth.uid()) with check (seller_id = auth.uid())', t || '_own', t);
  end loop;
end $$;

-- buyers can see their own orders and write a review for a delivered order
drop policy if exists seller_orders_buyer_read on public.seller_orders;
create policy seller_orders_buyer_read on public.seller_orders
  for select to authenticated using (buyer_id = auth.uid());
drop policy if exists seller_reviews_buyer_insert on public.seller_reviews;
create policy seller_reviews_buyer_insert on public.seller_reviews
  for insert to authenticated with check (
    author_id = auth.uid() and exists (
      select 1 from public.seller_orders o
      where o.id = order_id and o.buyer_id = auth.uid() and o.seller_id = seller_reviews.seller_id and o.status = 'yetkazildi'));
-- active products are public in the marketplace
drop policy if exists seller_products_public_read on public.seller_products;
create policy seller_products_public_read on public.seller_products
  for select to anon, authenticated using (status = 'active');

grant select, insert, update, delete on
  public.seller_products, public.seller_customers, public.seller_orders, public.seller_order_items,
  public.seller_reviews, public.seller_discounts, public.seller_campaigns, public.seller_payouts
  to authenticated;
grant select on public.seller_products to anon;
grant usage on sequence public.seller_order_seq to authenticated;
grant execute on function public.seller_wallet(), public.is_seller(), public.seller_create_manual_order(jsonb) to authenticated;
