-- 0039: Hamyon — naqd buyurtmalar pulini sotuvchi o‘zi oladi, shuning uchun ular
-- yechib olinadigan balansga qo‘shilmaydi. Naqd yetkazilgan buyurtmalardan 12% komissiya
-- sotuvchining platformaga qarzi sifatida ko‘rsatiladi. Hech qanday qator o‘zgartirilmaydi.
-- NOT APPLIED. Faqat funksiyalar qayta yaratiladi.

create or replace function public.seller_wallet()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'earned', coalesce((select sum(payout) from public.seller_orders
               where seller_id = auth.uid() and status = 'yetkazildi' and coalesce(payment_method, 'cash') <> 'cash'), 0),
    'pending', coalesce((select sum(payout) from public.seller_orders
               where seller_id = auth.uid() and status in ('yangi','tasdiqlandi','tayyorlanmoqda','yetkazilmoqda')
                 and coalesce(payment_method, 'cash') <> 'cash'), 0),
    'commission_owed', coalesce((select sum(commission) from public.seller_orders
               where seller_id = auth.uid() and status = 'yetkazildi' and coalesce(payment_method, 'cash') = 'cash'), 0),
    'withdrawn', coalesce((select sum(amount) from public.seller_payouts where seller_id = auth.uid() and status <> 'rad_etildi'), 0)
               + coalesce((select sum(amount) from public.seller_ad_topups where seller_id = auth.uid()), 0)
  );
$$;
-- seller_payout_guard() (0003) earned - withdrawn ni tekshiradi — endi naqd tushum hisobga kirmaydi.
