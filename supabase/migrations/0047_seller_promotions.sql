-- 0047: Sotuvchi Marketing — Aksiyalar (seller_promotions).
-- Sotuvchi o‘z mahsulotini saytning /aksiyalar bo‘limiga qo‘yadi. Har bir faol aksiya
-- catalog_items (kind='deal', owner_id = sotuvchi) qatoriga trigger orqali sinxronlanadi.
-- Promokodlar uchun yangi jadval kerak emas: mavjud seller_discounts (promo_code, usage_limit,
-- starts_on/ends_on, active) ishlatiladi. Ma'lumot o‘chirilmaydi, faqat yangi jadval/trigger.

create table if not exists public.seller_promotions (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  product_id uuid not null references public.seller_products (id) on delete cascade,
  old_price numeric(14,0) not null check (old_price > 0),
  price numeric(14,0) not null check (price > 0),
  starts_on date not null default current_date,
  ends_on date not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seller_promotions_price_lt check (price < old_price),
  constraint seller_promotions_dates check (ends_on >= starts_on)
);
create index if not exists seller_promotions_seller_idx on public.seller_promotions (seller_id, created_at desc);
create unique index if not exists seller_promotions_one_active on public.seller_promotions (product_id) where active;

alter table public.seller_promotions enable row level security;
drop policy if exists seller_promotions_own on public.seller_promotions;
create policy seller_promotions_own on public.seller_promotions
  for all to authenticated
  using (seller_id = auth.uid())
  with check (seller_id = auth.uid()
    and exists (select 1 from public.seller_products p where p.id = product_id and p.seller_id = auth.uid()));
grant select, insert, update on public.seller_promotions to authenticated;

-- Faol aksiyani public catalog_items 'deal' ga chiqarish / olib tashlash
create or replace function public.seller_promotion_sync()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  r public.seller_promotions;
  p public.seller_products;
  v_shop text;
  v_id text;
begin
  r := coalesce(new, old);
  v_id := 'sp-' || r.id::text;
  select * into p from public.seller_products where id = r.product_id;
  if tg_op = 'DELETE' or not r.active or r.ends_on < current_date or p.id is null or p.status <> 'active' then
    delete from public.catalog_items where kind = 'deal' and id = v_id and owner_id = r.seller_id;
    return coalesce(new, old);
  end if;
  select coalesce(nullif(shop_name, ''), nullif(name, ''), 'Sotuvchi') into v_shop from public.profiles where id = r.seller_id;
  insert into public.catalog_items (kind, id, payload, sort_at, owner_id)
  values ('deal', v_id, jsonb_build_object(
      'id', v_id, 'name', p.name, 'brand', p.brand,
      'off', round((1 - r.price / r.old_price) * 100)::int,
      'price', r.price, 'oldPrice', r.old_price, 'stock', p.stock,
      'productId', p.id, 'sellerId', r.seller_id,
      'startsOn', r.starts_on, 'endsOn', r.ends_on,
      'left', greatest(0, extract(epoch from (r.ends_on + 1)::timestamptz - now())::bigint),
      'image', p.image_url,
      'images', case when jsonb_typeof(p.images) = 'array' and jsonb_array_length(p.images) > 0 then p.images else jsonb_build_array(p.image_url) end,
      'about', p.description,
      'seller', jsonb_build_object('name', v_shop, 'role', 'Sotuvchi')),
    0, r.seller_id)
  on conflict (kind, id) do update set payload = excluded.payload, owner_id = excluded.owner_id;
  return coalesce(new, old);
end $$;

drop trigger if exists seller_promotions_sync on public.seller_promotions;
create trigger seller_promotions_sync after insert or update or delete on public.seller_promotions
  for each row execute function public.seller_promotion_sync();
