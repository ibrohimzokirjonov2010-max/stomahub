-- 0029: seller product form fields (product page tabs, pricing terms, variants, medical device info),
-- category rename, seller legal requisites, Telegram new-order dedupe, min-qty + tier pricing at checkout.
-- Idempotent. Run after 0028 (0027/0028 come from other branches; this file does not depend on them).
-- Commission logic is NOT touched: seller_orders.commission/payout keep coming from the existing triggers (12%).

-- 1. seller_products: new columns ------------------------------------------------------------
alter table public.seller_products
  add column if not exists clinical_use  text not null default '',
  add column if not exists delivery_info text not null default '',
  add column if not exists reorder       jsonb not null default '{}'::jsonb,       -- {enabled, interval_days}
  add column if not exists variant_type  text not null default '',                -- rang|olcham|endo|implant|custom
  add column if not exists uom           text not null default 'dona',            -- dona|quti|to'plam|ml|g
  add column if not exists min_qty       integer not null default 1,
  add column if not exists price_tiers   jsonb not null default '[]'::jsonb,      -- [{min_qty, price}]
  add column if not exists reg_cert_no   text not null default '',
  add column if not exists lot_no        text not null default '',
  add column if not exists storage_temp  text not null default '';

do $$ begin
  alter table public.seller_products add constraint seller_products_min_qty_chk check (min_qty between 1 and 999);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.seller_products add constraint seller_products_uom_chk check (uom in ('dona','quti','to‘plam','ml','g','shprits','kapsula','juft'));
exception when duplicate_object then null; end $$;

-- 2. Category rename: O'lchov materiallari / Qolip materiallari -> Qolip (ottisk) materiallari
update public.seller_products set category = 'Qolip (ottisk) materiallari'
 where category in ('O‘lchov materiallari', 'O''lchov materiallari', 'Qolip materiallari');

-- 3. market_products(): also return the new public fields + documents ---------------------------
drop function if exists public.market_products();
create function public.market_products()
returns table (id uuid, seller_id uuid, shop_name text, name text, sku text, category text, brand text,
  price numeric, stock integer, image_url text, images jsonb, variants jsonb, description text, unit text,
  created_at timestamptz, specs jsonb, country text, expires_on date, documents jsonb,
  clinical_use text, delivery_info text, reorder jsonb, variant_type text, uom text, min_qty integer,
  price_tiers jsonb, reg_cert_no text, lot_no text, storage_temp text)
language sql stable security definer set search_path = public as $$
  select p.id, p.seller_id, coalesce(nullif(pr.shop_name, ''), pr.name, 'Sotuvchi'), p.name, p.sku, p.category, p.brand,
         p.price, p.stock, p.image_url, p.images, p.variants, p.description, p.unit, p.created_at, p.specs,
         p.country, p.expires_on, p.documents,
         p.clinical_use, p.delivery_info, p.reorder, p.variant_type, p.uom, p.min_qty,
         p.price_tiers, p.reg_cert_no, p.lot_no, p.storage_temp
    from public.seller_products p join public.profiles pr on pr.id = p.seller_id
   where p.status = 'active'
   order by p.created_at desc;
$$;
grant execute on function public.market_products() to anon, authenticated;

-- 4. seller_settings.legal: STIR, bank, MFO, hisob raqam, YaTT/MChJ, farmatsevtik litsenziya --------
-- (RLS on seller_settings is unchanged: a seller reads/writes only their own row.)
alter table public.seller_settings add column if not exists legal jsonb not null default '{}'::jsonb;

-- 5. seller_orders.tg_notified_at: api/notify/new-order sends each order to Telegram once -------
alter table public.seller_orders add column if not exists tg_notified_at timestamptz;

-- 6. buyer_create_order: same as 0015 + min_qty check + wholesale tier price -------------------
create or replace function public.buyer_create_order(payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid(); v_item jsonb; v_p public.seller_products; v_var jsonb; v_qty int; v_price numeric;
  v_order uuid; v_orders jsonb := '[]'::jsonb; v_seller uuid; v_code text;
  v_name text := trim(coalesce(payload->>'name', '')); v_phone text := regexp_replace(coalesce(payload->>'phone', ''), '\D', '', 'g');
  v_method text := coalesce(nullif(payload->>'delivery_method', ''), 'kuryer');
  v_pay text := lower(coalesce(nullif(trim(payload->>'payment_method'), ''), 'cash'));
  v_demo_ref text := left(coalesce(payload->>'payment_ref', ''), 64);
  v_pay_status text;
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

  v_pay_status := case
    when v_pay = 'cash' then 'held'
    when v_demo_ref <> '' then 'paid'
    else 'pending'
  end;

  for v_seller in
    select distinct p.seller_id from jsonb_array_elements(payload->'items') i
      join public.seller_products p on p.id = (i->>'product_id')::uuid
  loop
    if v_seller = v_uid then raise exception 'O''z mahsulotingizni buyurtma qila olmaysiz'; end if;
    insert into public.seller_orders (
      seller_id, buyer_id, customer_name, customer_phone, city, address, note,
      delivery_method, source, payment_method, payment_ref, payment_status
    )
    values (
      v_seller, v_uid, v_name, '+998' || right(v_phone, 9), coalesce(payload->>'city', ''),
      case when v_method = 'kuryer' then trim(payload->>'address') else 'Sotuvchidan olib ketish' end,
      left(coalesce(payload->>'note', '') || case when v_demo_ref <> '' then E'\n[pay:' || v_demo_ref || ']' else '' end, 500),
      v_method, 'marketplace', v_pay, v_demo_ref, v_pay_status
    )
    returning id, code into v_order, v_code;
    v_orders := v_orders || jsonb_build_object(
      'id', v_order, 'code', v_code, 'seller_id', v_seller,
      'payment_method', v_pay, 'payment_status', v_pay_status
    );
  end loop;

  for v_item in select * from jsonb_array_elements(payload->'items') loop
    select * into v_p from public.seller_products where id = (v_item->>'product_id')::uuid for update;
    if v_p.id is null or v_p.status <> 'active' then raise exception 'Mahsulot sotuvda emas'; end if;
    v_qty := coalesce((v_item->>'qty')::int, 0);
    if v_qty < 1 or v_qty > 999 then raise exception 'Miqdor noto''g''ri: %', v_p.name; end if;
    -- 0029: minimal buyurtma miqdori
    if v_qty < greatest(coalesce(v_p.min_qty, 1), 1) then
      raise exception '% uchun minimal buyurtma: % %', v_p.name, v_p.min_qty, coalesce(nullif(v_p.uom, ''), 'dona');
    end if;
    -- 0029: ulgurji narx (eng katta mos min_qty pog'onasi), faqat asosiy narxga
    v_price := coalesce((
      select (t->>'price')::numeric from jsonb_array_elements(coalesce(v_p.price_tiers, '[]'::jsonb)) t
       where jsonb_typeof(v_p.price_tiers) = 'array'
         and coalesce((t->>'min_qty')::int, 0) > 1 and coalesce((t->>'price')::numeric, 0) > 0
         and (t->>'min_qty')::int <= v_qty
       order by (t->>'min_qty')::int desc limit 1
    ), v_p.price);
    v_var := null;
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

  -- payment ledger rows (one per seller order)
  insert into public.payment_transactions (
    provider, provider_trans_id, merchant_trans_id, order_id, buyer_id, seller_id,
    amount, commission, payout, state, perform_time, meta
  )
  select
    case when v_pay = 'cash' then 'demo' else v_pay end,
    case when v_pay_status = 'paid' then v_demo_ref else '' end,
    coalesce(nullif(v_demo_ref, ''), o.code),
    o.id, v_uid, o.seller_id,
    greatest(o.subtotal - coalesce(o.discount_amount, 0), 0) + coalesce(o.delivery_fee, 0),
    o.commission, o.payout,
    case when v_pay_status = 'paid' then 'paid' when v_pay = 'cash' then 'pending' else 'created' end,
    case when v_pay_status = 'paid' then now() else null end,
    jsonb_build_object('source', 'buyer_create_order')
  from public.seller_orders o
  where o.id in (select (x->>'id')::uuid from jsonb_array_elements(v_orders) x);

  insert into public.customer_notifications (user_id, kind, title, body, link)
  select v_uid, 'order', 'Buyurtma qabul qilindi',
    'Buyurtma ' || (o->>'code') || ' · to''lov: ' || upper(v_pay) || ' · sotuvchiga yuborildi',
    '/profil/buyurtmalar'
    from jsonb_array_elements(v_orders) o;

  insert into public.customer_notifications (user_id, kind, title, body, link)
  select (o->>'seller_id')::uuid, 'order', 'Yangi buyurtma',
    'Buyurtma ' || (o->>'code') || ' qabul qilindi · ' || upper(v_pay),
    '/sotuvchi/buyurtmalar'
    from jsonb_array_elements(v_orders) o;

  return jsonb_build_object(
    'orders', v_orders, 'payment_method', v_pay,
    'payment_ref', v_demo_ref, 'payment_status', v_pay_status
  );
end $$;
revoke all on function public.buyer_create_order(jsonb) from public, anon;
grant execute on function public.buyer_create_order(jsonb) to authenticated;

comment on function public.buyer_create_order(jsonb) is
  'Marketplace checkout. Cash + demo/live card. Enforces min_qty and price_tiers (0029). Writes payment_transactions. Commission 12% (unchanged, via seller_orders triggers).';
