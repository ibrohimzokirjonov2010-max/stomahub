-- 0005: 0004 dan keyin ishga tushiring. Idempotent.

-- ============ 06. Chegirmalar: qamrov (scope) va 2+1 narxlash =====================
create or replace function public.seller_create_manual_order(payload jsonb)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare
  v_order public.seller_orders; v_item jsonb; v_p public.seller_products; v_qty int; v_price numeric;
  v_var jsonb; v_c public.seller_customers; v_d public.seller_discounts; v_sub numeric := 0; v_disc numeric := 0;
  v_used int; v_elig numeric := 0; v_free numeric := 0;
begin
  if not public.is_seller() then raise exception 'Faqat sotuvchilar uchun'; end if;
  if jsonb_array_length(coalesce(payload->'items', '[]'::jsonb)) = 0 then raise exception 'Kamida bitta mahsulot tanlang'; end if;
  if nullif(payload->>'customer_id', '') is not null then
    select * into v_c from public.seller_customers where id = (payload->>'customer_id')::uuid and seller_id = auth.uid();
    if v_c.id is null then raise exception 'Mijoz topilmadi'; end if;
    if v_c.blocked then raise exception 'Bu mijoz bloklangan'; end if;
  end if;
  insert into public.seller_orders (seller_id, customer_id, customer_name, customer_phone, contact_person, region, city, address, note,
    internal_note, delivery_method, delivery_date, delivery_fee, source)
  values (auth.uid(), v_c.id,
    coalesce(nullif(payload->>'customer_name', ''), v_c.name, ''), coalesce(nullif(payload->>'customer_phone', ''), v_c.phone, ''),
    coalesce(nullif(payload->>'contact_person', ''), v_c.contact_person, ''), coalesce(nullif(payload->>'region', ''), v_c.region, ''),
    coalesce(nullif(payload->>'city', ''), v_c.city, ''), coalesce(nullif(payload->>'address', ''), v_c.address, ''),
    coalesce(payload->>'note', ''), coalesce(payload->>'internal_note', ''), coalesce(nullif(payload->>'delivery_method', ''), 'kuryer'),
    nullif(payload->>'delivery_date', '')::date, greatest(0, coalesce((payload->>'delivery_fee')::numeric, 0)), 'manual')
  returning * into v_order;
  for v_item in select * from jsonb_array_elements(payload->'items') loop
    select * into v_p from public.seller_products where id = (v_item->>'product_id')::uuid and seller_id = auth.uid() for update;
    if v_p.id is null then raise exception 'Mahsulot topilmadi'; end if;
    v_qty := greatest(1, coalesce((v_item->>'qty')::int, 1));
    v_price := v_p.price; v_var := null;
    if nullif(v_item->>'variant', '') is not null then
      select v into v_var from jsonb_array_elements(v_p.variants) v where v->>'sku' = v_item->>'variant' limit 1;
      if v_var is null then raise exception 'Variant topilmadi'; end if;
      if coalesce((v_var->>'stock')::int, 0) < v_qty then raise exception '% (%) zaxirada yetarli emas', v_p.name, v_item->>'variant'; end if;
      v_price := coalesce(nullif(v_var->>'price', '')::numeric, v_p.price);
      update public.seller_products set variants = (select jsonb_agg(case when v->>'sku' = v_item->>'variant'
        then jsonb_set(v, '{stock}', to_jsonb(coalesce((v->>'stock')::int, 0) - v_qty)) else v end) from jsonb_array_elements(variants) v)
      where id = v_p.id;
    else
      if v_p.stock < v_qty then raise exception '% zaxirada yetarli emas (bor: %)', v_p.name, v_p.stock; end if;
      update public.seller_products set stock = stock - v_qty where id = v_p.id;
    end if;
    insert into public.seller_order_items (order_id, seller_id, product_id, name, variant, image_url, qty, price)
    values (v_order.id, auth.uid(), v_p.id, v_p.name, coalesce(v_item->>'variant', ''), v_p.image_url, v_qty, v_price);
    v_sub := v_sub + v_qty * v_price;
  end loop;
  if nullif(payload->>'discount_id', '') is not null then
    select * into v_d from public.seller_discounts where id = (payload->>'discount_id')::uuid and seller_id = auth.uid()
      and active and not is_draft and starts_on <= current_date and (ends_on is null or ends_on >= current_date);
    if v_d.id is null then raise exception 'Chegirma faol emas'; end if;
    select count(*) into v_used from public.seller_orders where discount_id = v_d.id and status <> 'bekor_qilindi';
    if v_d.usage_limit is not null and v_used >= v_d.usage_limit then raise exception 'Chegirma limiti tugagan'; end if;
    if v_sub < v_d.min_order then raise exception 'Chegirma uchun minimal buyurtma: %', v_d.min_order; end if;
    -- chegirma faqat qamrab olingan mahsulotlarga (scope) qo'llanadi
    select coalesce(sum(i.qty * i.price), 0), coalesce(sum(floor(i.qty / 3) * i.price), 0) into v_elig, v_free
      from public.seller_order_items i join public.seller_products p on p.id = i.product_id
      where i.order_id = v_order.id and (v_d.scope = 'all'
        or (v_d.scope = 'products' and (p.id = any(v_d.product_ids) or p.id = v_d.product_id))
        or (v_d.scope = 'category' and p.category = v_d.category));
    if v_elig = 0 then raise exception 'Chegirma tanlangan mahsulotlarga tegishli emas'; end if;
    -- 2+1: har 3 donadan bittasi bepul
    v_disc := case v_d.kind when 'summa' then least(v_d.value, v_elig) when 'bir_bepul' then v_free
      else round(v_elig * coalesce(nullif(v_d.value, 0), v_d.percent) / 100.0) end;
    update public.seller_orders set discount_id = v_d.id, discount_amount = v_disc where id = v_order.id;
  elsif v_c.personal_discount is not null then
    -- mijozning shaxsiy chegirmasi (boshqa chegirma tanlanmagan bo'lsa)
    update public.seller_orders set discount_amount = round(v_sub * v_c.personal_discount / 100.0) where id = v_order.id;
  end if;
  select * into v_order from public.seller_orders where id = v_order.id;
  return jsonb_build_object('id', v_order.id, 'code', v_order.code);
end $$;

-- ============ 07. Reklama: umumiy byudjet va tavsif ===============================
alter table public.seller_campaigns add column if not exists total_budget numeric(14,0) check (total_budget is null or total_budget >= 0);
alter table public.seller_campaigns add column if not exists description text not null default '';
