-- 09 Hamyon: wallet also subtracts ad top-ups, so payout guard matches the UI balance. Idempotent.
create or replace function public.seller_wallet()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'earned', coalesce((select sum(payout) from public.seller_orders where seller_id = auth.uid() and status = 'yetkazildi'), 0),
    'pending', coalesce((select sum(payout) from public.seller_orders where seller_id = auth.uid() and status in ('yangi','tasdiqlandi','tayyorlanmoqda','yetkazilmoqda')), 0),
    'withdrawn', coalesce((select sum(amount) from public.seller_payouts where seller_id = auth.uid() and status <> 'rad_etildi'), 0)
               + coalesce((select sum(amount) from public.seller_ad_topups where seller_id = auth.uid()), 0)
  );
$$;
