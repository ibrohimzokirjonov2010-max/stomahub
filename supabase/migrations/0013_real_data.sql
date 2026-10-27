-- 0013 — Real-data: demo card checkout, seller/buyer/organizer cross-role notifications,
-- catalog empty-state support, seminar registration buyer notify.
-- Idempotent. DO NOT apply from CI; owner applies in Supabase SQL editor.
-- Run after 0012_admin_sections.sql.

-- 1. buyer_create_order: accept UZCARD / HUMO / Click / Payme / card / cash ------------
create or replace function public.buyer_create_order(payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid(); v_item jsonb; v_p public.seller_products; v_var jsonb; v_qty int; v_price numeric;
  v_order uuid; v_orders jsonb := '[]'::jsonb; v_seller uuid; v_code text;
  v_name text := trim(coalesce(payload->>'name', '')); v_phone text := regexp_replace(coalesce(payload->>'phone', ''), '\D', '', 'g');
  v_method text := coalesce(nullif(payload->>'delivery_method', ''), 'kuryer');
  v_pay text := lower(coalesce(nullif(trim(payload->>'payment_method'), ''), 'cash'));
  v_demo_ref text := left(coalesce(payload->>'payment_ref', ''), 64);
begin
  if v_uid is null then raise exception 'Buyurtma berish uchun hisobingizga kiring'; end if;
  if v_pay in ('naqd') then v_pay := 'cash'; end if;
  if v_pay not in ('cash', 'uzcard', 'humo', 'click', 'payme', 'card') then
    raise exception 'To''lov usuli qo''llab-quvvatlanmaydi';
  end if;
  if length(v_name) < 2 then raise exception 'Ism familiyani kiriting'; end if;
  if length(v_phone) < 9 then raise exception 'Telefon raqam noto''g''ri'; end if;
  if v_method not in ('kuryer', 'olib_ketish') then raise exception 'Yetkazish usuli noto''g''ri'; end if;
  if v_method = 'kuryer' and length(trim(coalesce(payload->>'address', ''))) < 3 then raise exception 'Manzilni kiriting'; end if;
  if jsonb_typeof(payload->'items') <> 'array' or jsonb_array_length(payload->'items') = 0 then raise exception 'Savat bo''sh'; end if;
  if jsonb_array_length(payload->'items') > 50 then raise exception 'Savatda juda ko''p mahsulot'; end if;

  for v_seller in
    select distinct p.seller_id from jsonb_array_elements(payload->'items') i
      join public.seller_products p on p.id = (i->>'product_id')::uuid
  loop
    if v_seller = v_uid then raise exception 'O''z mahsulotingizni buyurtma qila olmaysiz'; end if;
    insert into public.seller_orders (seller_id, buyer_id, customer_name, customer_phone, city, address, note, delivery_method, source, payment_method)
    values (v_seller, v_uid, v_name, '+998' || right(v_phone, 9), coalesce(payload->>'city', ''),
      case when v_method = 'kuryer' then trim(payload->>'address') else 'Sotuvchidan olib ketish' end,
      left(coalesce(payload->>'note', '') || case when v_demo_ref <> '' then E'\n[demo:' || v_demo_ref || ']' else '' end, 500),
      v_method, 'marketplace', v_pay)
    returning id, code into v_order, v_code;
    v_orders := v_orders || jsonb_build_object('id', v_order, 'code', v_code, 'seller_id', v_seller, 'payment_method', v_pay);
  end loop;

  for v_item in select * from jsonb_array_elements(payload->'items') loop
    select * into v_p from public.seller_products where id = (v_item->>'product_id')::uuid for update;
    if v_p.id is null or v_p.status <> 'active' then raise exception 'Mahsulot sotuvda emas'; end if;
    v_qty := coalesce((v_item->>'qty')::int, 0);
    if v_qty < 1 or v_qty > 999 then raise exception 'Miqdor noto''g''ri: %', v_p.name; end if;
    v_price := v_p.price; v_var := null;
    if nullif(v_item->>'variant', '') is not null then
      select v into v_var from jsonb_array_elements(v_p.variants) v where v->>'sku' = v_item->>'variant' limit 1;
      if v_var is null then raise exception 'Variant topilmadi: %', v_p.name; end if;
      if coalesce((v_var->>'stock')::int, 0) < v_qty then raise exception '% zaxirada yetarli emas', v_p.name; end if;
      v_price := coalesce(nullif(v_var->>'price', '')::numeric, v_p.price);
      update public.seller_products set variants = (select jsonb_agg(case when v->>'sku' = v_item->>'variant'
        then jsonb_set(v, '{stock}', to_jsonb(coalesce((v->>'stock')::int, 0) - v_qty)) else v end) from jsonb_array_elements(variants) v)
      where id = v_p.id;
    else
      if jsonb_typeof(v_p.variants) = 'array' and jsonb_array_length(v_p.variants) > 0 then raise exception 'Variantni tanlang: %', v_p.name; end if;
      if v_p.stock < v_qty then raise exception '% zaxirada yetarli emas (bor: %)', v_p.name, v_p.stock; end if;
      update public.seller_products set stock = stock - v_qty where id = v_p.id;
    end if;
    insert into public.seller_order_items (order_id, seller_id, product_id, name, variant, image_url, qty, price)
    select (o->>'id')::uuid, v_p.seller_id, v_p.id, v_p.name, coalesce(v_item->>'variant', ''), v_p.image_url, v_qty, v_price
      from jsonb_array_elements(v_orders) o where (o->>'seller_id')::uuid = v_p.seller_id;
  end loop;

  -- buyer notification
  insert into public.customer_notifications (user_id, kind, title, body, link)
  select v_uid, 'order', 'Buyurtma qabul qilindi',
    'Buyurtma ' || (o->>'code') || ' · to''lov: ' || upper(v_pay) || ' · sotuvchiga yuborildi',
    '/profil/buyurtmalar'
    from jsonb_array_elements(v_orders) o;

  -- seller notification (same table; seller reads own user_id rows)
  insert into public.customer_notifications (user_id, kind, title, body, link)
  select (o->>'seller_id')::uuid, 'order', 'Yangi buyurtma',
    'Buyurtma ' || (o->>'code') || ' qabul qilindi · ' || upper(v_pay),
    '/sotuvchi/buyurtmalar'
    from jsonb_array_elements(v_orders) o;

  return jsonb_build_object('orders', v_orders, 'payment_method', v_pay, 'payment_ref', v_demo_ref);
end $$;
revoke all on function public.buyer_create_order(jsonb) from public, anon;
grant execute on function public.buyer_create_order(jsonb) to authenticated;

-- 2. register_sale: also notify the buyer + organizer inbox after paid registration ------
-- Re-create wrapper that calls original body via replace of full function is large;
-- instead add a companion notify trigger on payments insert.
create or replace function public.notify_seminar_sale()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_net numeric;
begin
  if new.state is distinct from 'ok' then return new; end if;
  v_net := coalesce(new.sum, 0) - round(coalesce(new.sum, 0) * 0.12);
  if new.customer_id is not null then
    insert into public.customer_notifications (user_id, kind, title, body, link)
    values (
      new.customer_id, 'seminar', 'Seminar to''lovi qabul qilindi',
      coalesce(new.seminar_title, 'Seminar') || ' · ' || trim(to_char(coalesce(new.sum, 0), 'FM999 999 999 999')) || ' so''m',
      '/profil/seminarlar'
    );
  end if;
  if new.organizer_id is not null then
    insert into public.customer_notifications (user_id, kind, title, body, link)
    values (
      new.organizer_id, 'seminar', 'Yangi ishtirokchi',
      coalesce(new.who, 'Ishtirokchi') || ' · sof +' || trim(to_char(v_net, 'FM999 999 999 999')) || ' so''m (12% komissiya ayirilgan)',
      '/tashkilotchi/ishtirokchilar'
    );
  end if;
  return new;
end $$;

drop trigger if exists payments_notify_seminar_sale on public.payments;
create trigger payments_notify_seminar_sale
  after insert on public.payments
  for each row execute function public.notify_seminar_sale();

-- 3. catalog_items: allow authenticated upserts for content owners (owner_id optional) ---
alter table public.catalog_items add column if not exists owner_id uuid references auth.users(id) on delete set null;
alter table public.catalog_items add column if not exists updated_at timestamptz not null default now();
create index if not exists catalog_items_owner_idx on public.catalog_items (owner_id);

drop policy if exists catalog_items_insert_own on public.catalog_items;
create policy catalog_items_insert_own on public.catalog_items
for insert to authenticated
with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists catalog_items_update_own on public.catalog_items;
create policy catalog_items_update_own on public.catalog_items
for update to authenticated
using (owner_id = auth.uid() or public.is_admin())
with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists catalog_items_delete_own on public.catalog_items;
create policy catalog_items_delete_own on public.catalog_items
for delete to authenticated
using (owner_id = auth.uid() or public.is_admin());

grant select, insert, update, delete on public.catalog_items to authenticated;

-- 4. helper: clear seeded catalog kinds (owner runs once if needed) ---------------------
-- No destructive wipe here; empty catalog_items + frontend empty arrays = real empty UI.

-- 5. ensure payment_method check allows demo methods (idempotent with 0011) -------------
alter table public.seller_orders drop constraint if exists seller_orders_payment_method_check;
alter table public.seller_orders add constraint seller_orders_payment_method_check
  check (payment_method in ('cash', 'naqd', 'uzcard', 'humo', 'click', 'payme', 'card'));

comment on function public.buyer_create_order(jsonb) is
  'Marketplace checkout. Demo card methods (uzcard/humo/click/payme/card) + cash. Commission 12% via seller_orders.commission generated column. Notifies buyer and seller.';
