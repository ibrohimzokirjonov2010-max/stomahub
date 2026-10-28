-- 0023: an admin may also run a shop (e.g. the official StomaHub seller on the owner's account).
-- The app's SellerGate already admits role 'admin'; the seller RPCs (seller_create_manual_order,
-- 0004/0005 seller RPCs) check is_seller(), which only accepted role = 'seller'. Row-level policies
-- on seller_* tables are owner-based (seller_id = auth.uid()) and need no change. Idempotent.
create or replace function public.is_seller()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('seller', 'admin'));
$$;
grant execute on function public.is_seller() to authenticated;
