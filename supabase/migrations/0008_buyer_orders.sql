-- 0008 — Buyer flow: public marketplace feed, cash-only checkout RPC, buyer cancel,
-- admin product moderation, order-status notifications.
-- Idempotent. Run after 0007_profile.sql.

-- 1. public marketplace feed (active products + shop name) --------------------------
create or replace function public.market_products()
returns table (id uuid, seller_id uuid, shop_name text, name text, sku text, category text, brand text,
  price numeric, stock integer, image_url text, images jsonb, variants jsonb, description text, unit text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, p.seller_id, coalesce(nullif(pr.shop_name, ''), pr.name, 'Sotuvchi'), p.name, p.sku, p.category, p.brand,
         p.price, p.stock, p.image_url, p.images, p.variants, p.description, p.unit, p.created_at
    from public.seller_products p join public.profiles pr on pr.id = p.seller_id
   where p.status = 'active'
   order by p.created_at desc;
$$;
grant execute on function public.market_products() to anon, authenticated;

-- 2. checkout: one order per seller, server-side price + stock, cash only -------------
-- payload: { name, phone, city, address, note, delivery_method: 'kuryer'|'olib_ketish',
--            items: [{ product_id, qty, variant? }] }
create or replace function public.buyer_create_order(payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid(); v_item jsonb; v_p public.seller_products; v_var jsonb; v_qty int; v_price numeric;
  v_order uuid; v_orders jsonb := '[]'::jsonb; v_seller uuid; v_code text;
  v_name text := trim(coalesce(payload->>'name', '')); v_phone text := regexp_replace(coalesce(payload->>'phone', ''), '\D', '', 'g');
  v_method text := coalesce(nullif(payload->>'delivery_method', ''), 'kuryer');
begin
  if v_uid is null then raise exception 'Buyurtma berish uchun hisobingizga kiring'; end if;
  if coalesce(payload->>'payment_method', 'cash') <> 'cash' then raise exception 'Faqat naqd to''lov qabul qilinadi'; end if;
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
      left(coalesce(payload->>'note', ''), 500), v_method, 'marketplace', 'cash')
    returning id, code into v_order, v_code;
    v_orders := v_orders || jsonb_build_object('id', v_order, 'code', v_code, 'seller_id', v_seller);
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
    -- client price is ignored; if it differs the buyer is told on the confirmation
    insert into public.seller_order_items (order_id, seller_id, product_id, name, variant, image_url, qty, price)
    select (o->>'id')::uuid, v_p.seller_id, v_p.id, v_p.name, coalesce(v_item->>'variant', ''), v_p.image_url, v_qty, v_price
      from jsonb_array_elements(v_orders) o where (o->>'seller_id')::uuid = v_p.seller_id;
  end loop;

  insert into public.customer_notifications (user_id, kind, title, body, link)
  select v_uid, 'order', 'Buyurtma qabul qilindi', 'Buyurtma ' || (o->>'code') || ' sotuvchiga yuborildi', '/profil/buyurtmalar'
    from jsonb_array_elements(v_orders) o;
  return jsonb_build_object('orders', v_orders);
end $$;
revoke all on function public.buyer_create_order(jsonb) from public, anon;
grant execute on function public.buyer_create_order(jsonb) to authenticated;

-- 3. buyer cancels a new order (stock is returned by seller_orders_restock) -------------
create or replace function public.buyer_cancel_order(p_order uuid, p_reason text default '')
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.seller_orders set status = 'bekor_qilindi', cancel_reason = left(coalesce(nullif(p_reason, ''), 'Xaridor bekor qildi'), 300)
   where id = p_order and buyer_id = auth.uid() and status = 'yangi';
  if not found then raise exception 'Buyurtmani bekor qilib bo''lmaydi'; end if;
end $$;
revoke all on function public.buyer_cancel_order(uuid, text) from public, anon;
grant execute on function public.buyer_cancel_order(uuid, text) to authenticated;

-- 4. admin moderation --------------------------------------------------------------
create or replace function public.admin_review_queue()
returns table (id uuid, seller_id uuid, shop_name text, name text, category text, brand text, price numeric,
  stock integer, image_url text, description text, status text, reject_reason text, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Faqat administrator uchun'; end if;
  return query select p.id, p.seller_id, coalesce(nullif(pr.shop_name, ''), pr.name, ''), p.name, p.category, p.brand, p.price,
    p.stock, p.image_url, p.description, p.status, p.reject_reason, p.created_at
    from public.seller_products p join public.profiles pr on pr.id = p.seller_id
   where p.status in ('review', 'rejected', 'active') order by (p.status = 'review') desc, p.created_at desc limit 500;
end $$;
grant execute on function public.admin_review_queue() to authenticated;

create or replace function public.admin_review_product(p_id uuid, p_approve boolean, p_reason text default '')
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Faqat administrator uchun'; end if;
  if not p_approve and length(trim(coalesce(p_reason, ''))) < 3 then raise exception 'Rad etish sababini yozing'; end if;
  update public.seller_products
     set status = case when p_approve then 'active' else 'rejected' end,
         reject_reason = case when p_approve then '' else trim(p_reason) end, updated_at = now()
   where id = p_id and status in ('review', 'active', 'rejected');
  if not found then raise exception 'Mahsulot topilmadi'; end if;
end $$;
grant execute on function public.admin_review_product(uuid, boolean, text) to authenticated;

-- 5. notify the buyer when the seller changes the status -----------------------------
create or replace function public.seller_order_notify_buyer()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.buyer_id is not null and new.status is distinct from old.status then
    insert into public.customer_notifications (user_id, kind, title, body, link)
    values (new.buyer_id, 'order', 'Buyurtma ' || new.code,
      case new.status when 'tasdiqlandi' then 'Sotuvchi buyurtmani tasdiqladi'
        when 'tayyorlanmoqda' then 'Buyurtma tayyorlanmoqda' when 'yetkazilmoqda' then 'Buyurtma yo''lda'
        when 'yetkazildi' then 'Buyurtma yetkazildi' when 'bekor_qilindi' then 'Buyurtma bekor qilindi' else new.status end,
      '/profil/buyurtmalar');
  end if;
  return null;
end $$;
drop trigger if exists seller_orders_notify_buyer on public.seller_orders;
create trigger seller_orders_notify_buyer after update of status on public.seller_orders
  for each row execute function public.seller_order_notify_buyer();
