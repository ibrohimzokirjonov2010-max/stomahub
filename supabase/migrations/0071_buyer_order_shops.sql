-- 0071: xaridor o‘z buyurtmasidagi do‘kon nomini ko‘radi. NOT applied automatically.
-- profiles RLS faqat o‘z qatorini ochadi, shu sababli shop_name tor security definer
-- funksiya orqali qaytadi: faqat shu xaridorning seller_orders / seller_order_items
-- sotuvchilari. Qaytadigan ustunlar: seller_id va shop_name.
-- Takror ishga tushirish xavfsiz (idempotent). Hech qanday qator o‘chirilmaydi.

create or replace function public.buyer_order_shops()
returns table (seller_id uuid, shop_name text)
language sql
stable
security definer
set search_path = public
as $$
  select s.seller_id,
         coalesce(nullif(btrim(p.shop_name), ''), nullif(btrim(p.name), ''), 'Sotuvchi') as shop_name
    from (
      select o.seller_id
        from public.seller_orders o
       where o.buyer_id = auth.uid()
         and o.seller_id is not null
      union
      select i.seller_id
        from public.seller_order_items i
        join public.seller_orders o on o.id = i.order_id
       where o.buyer_id = auth.uid()
         and i.seller_id is not null
    ) s
    join public.profiles p on p.id = s.seller_id;
$$;

revoke all on function public.buyer_order_shops() from public, anon;
grant execute on function public.buyer_order_shops() to authenticated;

comment on function public.buyer_order_shops() is
  'Xaridor o‘z buyurtmalaridagi do‘kon nomlari (profiles.shop_name). Boshqa profillar ochilmaydi.';
