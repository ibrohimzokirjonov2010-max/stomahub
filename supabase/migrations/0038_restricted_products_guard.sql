-- 0038: retsept/klinik mahsulotlar — server tomonda himoya. 0031 (rx_only, doctor_verified) va 0037 (is_test) dan keyin.
-- Mahsulot qatorlari o‘zgartirilmaydi: qoida rx_only bayrog‘i YOKI nom bo‘yicha (oqartirish/peroksid ≥ 10%).
create or replace function public.product_is_restricted(p_name text, p_rx boolean)
returns boolean language sql immutable as $$
  select coalesce(p_rx, false) or coalesce(p_name, '') ~* '(oqartir|whiten|peroksid|peroxide)[^%]*?\m[1-9][0-9]\s*%'
$$;

create or replace function public.seller_order_item_gate()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_buyer uuid;
begin
  if new.product_id is not null and exists (
    select 1 from public.seller_products p where p.id = new.product_id and public.product_is_restricted(p.name, p.rx_only)
  ) then
    select buyer_id into v_buyer from public.seller_orders where id = new.order_id;
    if not exists (select 1 from public.profiles where id = v_buyer and (doctor_verified or role = 'admin')) then
      raise exception 'Bu mahsulot faqat tasdiqlangan shifokorlar uchun';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists seller_order_item_gate on public.seller_order_items;
create trigger seller_order_item_gate before insert on public.seller_order_items
  for each row execute function public.seller_order_item_gate();

-- market_products: rx_only ham qaytariladi (UI "Shifokor sifatida tasdiqlang" ko‘rsatishi uchun).
drop function if exists public.market_products();
create function public.market_products()
returns table (id uuid, seller_id uuid, shop_name text, name text, sku text, category text, brand text,
  price numeric, stock integer, image_url text, images jsonb, variants jsonb, description text, unit text,
  created_at timestamptz, specs jsonb, country text, expires_on date, documents jsonb,
  clinical_use text, delivery_info text, reorder jsonb, variant_type text, uom text, min_qty integer,
  price_tiers jsonb, reg_cert_no text, lot_no text, storage_temp text, rx_only boolean)
language sql stable security definer set search_path = public as $$
  select p.id, p.seller_id, coalesce(nullif(pr.shop_name, ''), pr.name, 'Sotuvchi'), p.name, p.sku, p.category, p.brand,
         p.price, p.stock, p.image_url, p.images, p.variants, p.description, p.unit, p.created_at, p.specs,
         p.country, p.expires_on, p.documents,
         p.clinical_use, p.delivery_info, p.reorder, p.variant_type, p.uom, p.min_qty,
         p.price_tiers, p.reg_cert_no, p.lot_no, p.storage_temp,
         public.product_is_restricted(p.name, p.rx_only)
    from public.seller_products p join public.profiles pr on pr.id = p.seller_id
   where p.status = 'active' and not coalesce(p.is_test, false) and not coalesce(pr.is_test, false)
   order by p.created_at desc;
$$;
grant execute on function public.market_products() to anon, authenticated;
