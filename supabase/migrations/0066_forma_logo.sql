-- 0066: Forma — logo tikish uchun xaridor logo faylini yuklaydi. NOT applied automatically. 0064 dan keyin.
--   1) storage bucket 'forma-logos' (yopiq): 5 MB gacha, faqat PNG/JPG/WEBP/SVG.
--      Yo‘l: <xaridor uid>/<id>.<ext>.
--      RLS: yuklash — faqat o‘z papkasiga; o‘qish — fayl egasi (xaridor), shu logo biriktirilgan buyurtma
--      qatorining sotuvchisi va admin; o‘chirish — faqat egasi va faqat buyurtmaga biriktirilmagan bo‘lsa.
--   2) seller_order_items.logo_path — buyurtma qatoriga biriktirilgan logo fayli.
--   3) buyer_create_order(payload) — 0064 nusxasi + items[].logo_path: yo‘l xaridorning o‘z papkasida va
--      bucketda mavjud bo‘lishi shart; logo/izoh bo‘lsa narxga kashta_price qo‘shiladi.
-- Takror ishga tushirish xavfsiz (idempotent). Hech qanday qator o‘chirilmaydi.

-- 1) Bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('forma-logos', 'forma-logos', false, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- 2) Buyurtma qatori ustuni (policy undan foydalanadi — avval ustun)
alter table public.seller_order_items add column if not exists logo_path text;
create index if not exists seller_order_items_logo_path_idx on public.seller_order_items (logo_path) where logo_path is not null;

-- Sotuvchi shu logoni ko‘ra oladimi (security definer: seller_order_items RLS’ga bog‘liq emas)
create or replace function public.forma_logo_seller_can_read(p_name text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.seller_order_items i where i.logo_path = p_name and i.seller_id = auth.uid());
$$;
revoke all on function public.forma_logo_seller_can_read(text) from public, anon;
grant execute on function public.forma_logo_seller_can_read(text) to authenticated;

create or replace function public.forma_logo_in_use(p_name text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.seller_order_items i where i.logo_path = p_name);
$$;
revoke all on function public.forma_logo_in_use(text) from public, anon;
grant execute on function public.forma_logo_in_use(text) to authenticated;

drop policy if exists forma_logos_insert_own on storage.objects;
create policy forma_logos_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'forma-logos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists forma_logos_read on storage.objects;
create policy forma_logos_read on storage.objects for select to authenticated
  using (bucket_id = 'forma-logos' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.forma_logo_seller_can_read(name)
    or public.is_admin()
  ));

drop policy if exists forma_logos_delete_own on storage.objects;
create policy forma_logos_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'forma-logos' and (storage.foldername(name))[1] = auth.uid()::text
         and not public.forma_logo_in_use(name));

-- update (upsert/almashtirish) ruxsat etilmaydi: yangi fayl — yangi yo‘l.

-- 3) buyer_create_order (0064 nusxasi + logo_path)
create or replace function public.buyer_create_order(payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid(); v_item jsonb; v_p public.seller_products; v_var jsonb; v_qty int; v_price numeric;
  v_order uuid; v_orders jsonb := '[]'::jsonb; v_seller uuid; v_code text;
  v_kashta text; v_kashta_fee numeric; v_note text; v_logo text;
  v_name text := trim(coalesce(payload->>'name', '')); v_phone text := regexp_replace(coalesce(payload->>'phone', ''), '\D', '', 'g');
  v_method text := coalesce(nullif(payload->>'delivery_method', ''), 'kuryer');
  v_pay text := lower(coalesce(nullif(trim(payload->>'payment_method'), ''), 'cash'));
  v_pay_status text := 'pending';
begin
  if v_uid is null then raise exception 'Buyurtma berish uchun hisobingizga kiring'; end if;
  if v_pay in ('naqd') then v_pay := 'cash'; end if;
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
    v_price := public.seller_discount_price(v_p, v_price);
    -- 0064/0066: logo tikish / kashta (Forma) — narx sotuvchi belgilagan kashta_price dan;
    -- izoh matni note ga, logo fayli (forma-logos bucket, xaridorning o‘z papkasi) logo_path ga yoziladi
    v_kashta := left(regexp_replace(trim(coalesce(v_item->>'kashta', '')), '\s+', ' ', 'g'), 60);
    v_logo := trim(coalesce(v_item->>'logo_path', ''));
    v_note := '';
    if v_logo <> '' then
      if v_logo !~ ('^' || v_uid::text || '/[A-Za-z0-9_-]+\.(png|jpg|jpeg|webp|svg)$') then
        raise exception 'Logo fayli noto''g''ri: %', v_p.name;
      end if;
      if not exists (select 1 from storage.objects where bucket_id = 'forma-logos' and name = v_logo) then
        raise exception 'Logo fayli topilmadi — qayta yuklang: %', v_p.name;
      end if;
    end if;
    if v_kashta <> '' or v_logo <> '' then
      v_kashta_fee := coalesce(nullif(v_p.forma->>'kashta_price', '')::numeric, 0);
      if v_kashta_fee <= 0 then raise exception '% uchun logo tikish xizmati yo''q', v_p.name; end if;
      v_price := v_price + v_kashta_fee;
      v_note := case when v_logo <> '' then 'Logo tikish' || case when v_kashta <> '' then ': ' || v_kashta else '' end
                     else 'Kashta: ' || v_kashta end;
    end if;
    insert into public.seller_order_items (order_id, seller_id, product_id, name, variant, image_url, qty, price, note, logo_path)
    select (o->>'id')::uuid, v_p.seller_id, v_p.id, v_p.name, coalesce(v_item->>'variant', ''), v_p.image_url, v_qty, v_price, v_note, nullif(v_logo, '')
      from jsonb_array_elements(v_orders) o where (o->>'seller_id')::uuid = v_p.seller_id;
  end loop;

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

  select coalesce(jsonb_agg(x || jsonb_build_object('amount',
           (select greatest(o.subtotal - coalesce(o.discount_amount, 0), 0) + coalesce(o.delivery_fee, 0)
              from public.seller_orders o where o.id = (x->>'id')::uuid))), '[]'::jsonb)
    into v_orders from jsonb_array_elements(v_orders) x;
  return jsonb_build_object('orders', v_orders, 'payment_method', v_pay, 'payment_ref', '', 'payment_status', v_pay_status);
end $$;
revoke all on function public.buyer_create_order(jsonb) from public, anon;
grant execute on function public.buyer_create_order(jsonb) to authenticated;

notify pgrst, 'reload schema';
