-- 0048 QA part A (QO‘LDA QO‘LLANADI — avtomatik emas)
-- 1) Ortiqcha (catalog_items kind='surplus'): admin bo‘lmagan foydalanuvchi e’loni moderatsiyagacha yashirin + server validatsiyasi.
-- 2) Egasi yo‘q demo Ortiqcha yozuvlari yashiriladi (o‘chirilmaydi).
-- 3) Sotuvchi chegirmalari (seller_discounts) xaridor narxiga: market_discounts() RPC + buyer_create_order ichida.
--    Sana — Asia/Tashkent bo‘yicha.

create or replace function public.tashkent_today() returns date
language sql stable as $$ select (now() at time zone 'Asia/Tashkent')::date $$;
grant execute on function public.tashkent_today() to anon, authenticated;

-- ---------------------------------------------------------------- 1. Ortiqcha moderatsiya
create or replace function public.surplus_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_price numeric; v_old numeric; v_exp text; v_img text;
begin
  if new.kind <> 'surplus' or coalesce(public.is_admin(), false) then return new; end if;
  if tg_op = 'UPDATE' and new.payload is not distinct from old.payload then return new; end if;
  v_price := nullif(regexp_replace(coalesce(new.payload->>'price', ''), '[^0-9.]', '', 'g'), '')::numeric;
  v_old := nullif(regexp_replace(coalesce(new.payload->>'oldPrice', ''), '[^0-9.]', '', 'g'), '')::numeric;
  v_exp := coalesce(new.payload->>'expiryISO', '');
  v_img := coalesce(nullif(new.payload->>'image', ''), new.payload->'images'->>0, '');
  if v_price is null or v_price <= 0 then raise exception 'surplus_price: Narxni kiriting'; end if;
  if v_old is not null and v_old > 0 and v_price >= v_old then raise exception 'surplus_price: Narx asl narxdan past bo''lishi kerak'; end if;
  if v_exp = '' or left(v_exp, 7) < to_char(public.tashkent_today(), 'YYYY-MM') then raise exception 'surplus_expiry: Yaroqlilik muddati o''tgan'; end if;
  if v_img = '' then raise exception 'surplus_image: Rasm yuklang'; end if;
  new.hidden := true;
  new.hidden_reason := 'moderatsiya';
  return new;
end $$;
drop trigger if exists catalog_items_surplus_guard on public.catalog_items;
create trigger catalog_items_surplus_guard before insert or update on public.catalog_items
  for each row execute function public.surplus_guard();

-- ---------------------------------------------------------------- 2. Demo Ortiqcha yashirish (DELETE emas)
update public.catalog_items set hidden = true, hidden_reason = 'demo'
 where kind = 'surplus' and owner_id is null and not hidden;

-- ---------------------------------------------------------------- 3. Chegirmalar
create or replace function public.seller_discount_price(p public.seller_products, p_price numeric)
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce(min(case when coalesce(d.kind, 'foiz') = 'summa' then greatest(p_price - coalesce(d.value, 0), 0)
                           else round(p_price * (1 - coalesce(nullif(d.value, 0), d.percent)::numeric / 100)) end), p_price)
    from public.seller_discounts d
   where d.seller_id = p.seller_id and d.active and not coalesce(d.is_draft, false)
     and coalesce(trim(d.promo_code), '') = '' and coalesce(d.min_order, 0) = 0
     and coalesce(d.kind, 'foiz') in ('foiz', 'summa')
     and (coalesce(d.kind, 'foiz') = 'summa' or coalesce(nullif(d.value, 0), d.percent) between 1 and 90)
     and (d.starts_on is null or d.starts_on <= public.tashkent_today())
     and (d.ends_on is null or d.ends_on >= public.tashkent_today())
     and case coalesce(d.scope, 'all')
           when 'products' then p.id = any(coalesce(d.product_ids, '{}')) or d.product_id = p.id
           when 'category' then d.category <> '' and d.category = p.category
           else d.product_id is null or d.product_id = p.id end
$$;
revoke all on function public.seller_discount_price(public.seller_products, numeric) from public, anon, authenticated;

-- Xaridor (anon ham) faqat hozir amaldagi avtomatik chegirmalarni ko‘radi; promokod/limit maydonlari berilmaydi.
create or replace function public.market_discounts()
returns table (id uuid, seller_id uuid, title text, kind text, value numeric, percent integer, scope text,
               product_id uuid, product_ids uuid[], category text, starts_on date, ends_on date, active boolean)
language sql stable security definer set search_path = public as $$
  select d.id, d.seller_id, d.title, coalesce(d.kind, 'foiz'), d.value::numeric, d.percent, coalesce(d.scope, 'all'),
         d.product_id, d.product_ids, d.category, d.starts_on, d.ends_on, d.active
    from public.seller_discounts d
   where d.active and not coalesce(d.is_draft, false) and coalesce(trim(d.promo_code), '') = ''
     and coalesce(d.min_order, 0) = 0 and coalesce(d.kind, 'foiz') in ('foiz', 'summa')
     and (d.starts_on is null or d.starts_on <= public.tashkent_today())
     and (d.ends_on is null or d.ends_on >= public.tashkent_today())
$$;
grant execute on function public.market_discounts() to anon, authenticated;

-- buyer_create_order (0042 nusxasi + chegirma qatori)
create or replace function public.buyer_create_order(payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid(); v_item jsonb; v_p public.seller_products; v_var jsonb; v_qty int; v_price numeric;
  v_order uuid; v_orders jsonb := '[]'::jsonb; v_seller uuid; v_code text;
  v_name text := trim(coalesce(payload->>'name', '')); v_phone text := regexp_replace(coalesce(payload->>'phone', ''), '\D', '', 'g');
  v_method text := coalesce(nullif(payload->>'delivery_method', ''), 'kuryer');
  v_pay text := lower(coalesce(nullif(trim(payload->>'payment_method'), ''), 'cash'));
  v_pay_status text := 'pending';
begin
  if v_uid is null then raise exception 'Buyurtma berish uchun hisobingizga kiring'; end if;
  if v_pay in ('naqd') then v_pay := 'cash'; end if;
  -- 0042: faqat naqd, Click, Payme. Karta (demo) yo‘q. payment_ref mijozdan qabul qilinmaydi.
  if v_pay not in ('cash', 'click', 'payme') then
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
    insert into public.seller_orders (
      seller_id, buyer_id, customer_name, customer_phone, city, address, note,
      delivery_method, source, payment_method, payment_ref, payment_status
    )
    values (
      v_seller, v_uid, v_name, '+998' || right(v_phone, 9), coalesce(payload->>'city', ''),
      case when v_method = 'kuryer' then trim(payload->>'address') else 'Sotuvchidan olib ketish' end,
      left(coalesce(payload->>'note', ''), 500),
      v_method, 'marketplace', v_pay, '', v_pay_status
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
    if v_qty < greatest(coalesce(v_p.min_qty, 1), 1) then
      raise exception '% uchun minimal buyurtma: % %', v_p.name, v_p.min_qty, coalesce(nullif(v_p.uom, ''), 'dona');
    end if;
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
    -- 0048: sotuvchining faol avtomatik chegirmasi (mijoz ko‘rgan narx bilan bir xil qoida)
    v_price := public.seller_discount_price(v_p, v_price);
    insert into public.seller_order_items (order_id, seller_id, product_id, name, variant, image_url, qty, price)
    select (o->>'id')::uuid, v_p.seller_id, v_p.id, v_p.name, coalesce(v_item->>'variant', ''), v_p.image_url, v_qty, v_price
      from jsonb_array_elements(v_orders) o where (o->>'seller_id')::uuid = v_p.seller_id;
  end loop;

  -- Onlayn: 'created' tranzaksiya (Click Prepare / Payme CreateTransaction uni 'pending' qiladi). Naqd: yozuv yo‘q.
  if v_pay in ('click', 'payme') then
    insert into public.payment_transactions (provider, merchant_trans_id, order_id, buyer_id, seller_id, amount, state, meta)
    select v_pay, o.code, o.id, v_uid, o.seller_id,
           greatest(o.subtotal - coalesce(o.discount_amount, 0), 0) + coalesce(o.delivery_fee, 0),
           'created', jsonb_build_object('source', 'buyer_create_order')
      from public.seller_orders o
     where o.id in (select (x->>'id')::uuid from jsonb_array_elements(v_orders) x);
  end if;

  insert into public.customer_notifications (user_id, kind, title, body, link)
  select v_uid, 'order', 'Buyurtma qabul qilindi',
    'Buyurtma ' || (o->>'code') || case when v_pay = 'cash' then ' · naqd, yetkazilganda to''lanadi' else ' · onlayn to''lov kutilmoqda' end,
    '/profil/buyurtmalar'
    from jsonb_array_elements(v_orders) o;

  insert into public.customer_notifications (user_id, kind, title, body, link)
  select (o->>'seller_id')::uuid, 'order', 'Yangi buyurtma',
    'Buyurtma ' || (o->>'code') || case when v_pay = 'cash' then ' · naqd' else ' · onlayn to''lov kutilmoqda' end,
    '/sotuvchi/buyurtmalar'
    from jsonb_array_elements(v_orders) o;

  -- to‘lov havolasi uchun aniq summa (server hisoblagan)
  select coalesce(jsonb_agg(x || jsonb_build_object('amount',
           (select greatest(o.subtotal - coalesce(o.discount_amount, 0), 0) + coalesce(o.delivery_fee, 0)
              from public.seller_orders o where o.id = (x->>'id')::uuid))), '[]'::jsonb)
    into v_orders from jsonb_array_elements(v_orders) x;
  return jsonb_build_object('orders', v_orders, 'payment_method', v_pay, 'payment_ref', '', 'payment_status', v_pay_status);
end $$;
revoke all on function public.buyer_create_order(jsonb) from public, anon;
grant execute on function public.buyer_create_order(jsonb) to authenticated;
