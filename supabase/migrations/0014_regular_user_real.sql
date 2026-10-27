-- 0014_regular_user_real.sql
-- Regular-user real-data: clinic columns + seller_wallet earned/pending fix.
-- DO NOT auto-apply from the app; report for manual apply.

-- 1) customer_clinic: structured city / hours for Mening klinikam create/edit
alter table public.customer_clinic
  add column if not exists city text not null default '';
alter table public.customer_clinic
  add column if not exists open_time text not null default '09:00';
alter table public.customer_clinic
  add column if not exists close_time text not null default '18:00';

update public.customer_clinic
set city = coalesce(nullif(city, ''), nullif(address, ''), '')
where coalesce(city, '') = '';

update public.customer_clinic
set
  open_time = coalesce(nullif(substring(hours from '([0-9]{1,2}:[0-9]{2})'), ''), open_time),
  close_time = coalesce(
    nullif(substring(hours from '[0-9]{1,2}:[0-9]{2}\s*[–\-—]\s*([0-9]{1,2}:[0-9]{2})'), ''),
    close_time
  )
where hours ~ '[0-9]{1,2}:[0-9]{2}';

-- 2) seller_wallet: earned = all non-cancelled order payouts (so earned >= pending).
--    withdrawn keeps payouts + ad top-ups (same as 0006).
create or replace function public.seller_wallet()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'earned', coalesce((
      select sum(payout) from public.seller_orders
      where seller_id = auth.uid() and status <> 'bekor_qilindi'
    ), 0),
    'pending', coalesce((
      select sum(payout) from public.seller_orders
      where seller_id = auth.uid()
        and status in ('yangi', 'tasdiqlandi', 'tayyorlanmoqda', 'yetkazilmoqda')
    ), 0),
    'withdrawn', coalesce((
      select sum(amount) from public.seller_payouts
      where seller_id = auth.uid() and status <> 'rad_etildi'
    ), 0)
    + coalesce((
      select sum(amount) from public.seller_ad_topups
      where seller_id = auth.uid()
    ), 0)
  );
$$;

grant execute on function public.seller_wallet() to authenticated;
