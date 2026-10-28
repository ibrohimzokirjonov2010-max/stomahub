-- 0024: role gates. NOT APPLIED automatically — review first.
-- Problems found (live, 2026-10-28, probed as a customer JWT):
--  * seller_* tables: policy `<t>_own` is `seller_id = auth.uid()` with no role check, so any
--    signed-in customer can INSERT/UPDATE/DELETE their own seller_products (status 'active' rows
--    are publicly listed), seller_payouts, seller_settings, etc.
--  * profile_self_guard (0010) does not freeze seller_status / org_status / blocked, so a user can
--    self-set seller_status = 'approved'. INSERT also accepts role 'seller'/'organizer'.
--  * is_seller()/is_organizer() check role only, not admin approval.
--  * promo_codes: promo_public_read exposes every active code to anon + authenticated (see end).
-- Idempotent.

-- 1. approval-aware role helpers -------------------------------------------------------------
create or replace function public.is_seller()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
                 where id = auth.uid()
                   and (role = 'admin' or (role = 'seller' and seller_status = 'approved')));
$$;
create or replace function public.is_organizer()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
                 where id = auth.uid()
                   and (role = 'admin' or (role = 'organizer' and org_status = 'approved')));
$$;
grant execute on function public.is_seller() to authenticated;
grant execute on function public.is_organizer() to authenticated;

-- 2. clients can no longer touch role / approval fields ---------------------------------------
create or replace function public.profile_self_guard()
returns trigger language plpgsql as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') then return new; end if;
  if tg_op = 'UPDATE' then
    new.role := old.role;
    new.bonus := old.bonus;
    new.plus := old.plus;
    new.verified := old.verified;
    new.seller_status := old.seller_status;
    new.org_status := old.org_status;
    new.blocked := old.blocked;
  elsif tg_op = 'INSERT' then
    new.role := 'customer';
    new.bonus := 0;
    new.plus := false;
    new.verified := false;
    new.seller_status := 'none';
    new.org_status := 'none';
    new.blocked := false;
  end if;
  return new;
end $$;

-- 3. applying = pending request; admin RPCs (0011/0012) approve and keep role -----------------
create or replace function public.request_seller_role(p_shop_name text default '')
returns void language plpgsql security definer set search_path = public as $$
declare r public.profiles;
begin
  select * into r from public.profiles where id = auth.uid() for update;
  if r.id is null then raise exception 'Avval kiring'; end if;
  if r.role = 'admin' or r.seller_status in ('approved', 'blocked') then return; end if;
  update public.profiles set
    role = 'seller', seller_status = 'pending',
    shop_name = coalesce(nullif(trim(p_shop_name), ''), shop_name),
    updated_at = now()
  where id = r.id;
end $$;
create or replace function public.request_organizer_role()
returns void language plpgsql security definer set search_path = public as $$
declare r public.profiles;
begin
  select * into r from public.profiles where id = auth.uid() for update;
  if r.id is null then raise exception 'Avval kiring'; end if;
  if r.role in ('admin', 'seller') or r.org_status in ('approved', 'blocked') then return; end if;
  update public.profiles set role = 'organizer', org_status = 'pending', updated_at = now()
  where id = r.id;
end $$;
revoke all on function public.request_seller_role(text) from public, anon;
revoke all on function public.request_organizer_role() from public, anon;
grant execute on function public.request_seller_role(text) to authenticated;
grant execute on function public.request_organizer_role() to authenticated;

-- 4. seller_* write policies require an approved seller (owner can still read own rows) --------
do $$
declare t text;
begin
  for t in
    select c.table_name from information_schema.columns c
    join information_schema.tables tb on tb.table_schema = c.table_schema and tb.table_name = c.table_name
    where c.table_schema = 'public' and c.column_name = 'seller_id'
      and c.table_name like 'seller\_%' and tb.table_type = 'BASE TABLE'
  loop
    execute format('drop policy if exists %I on public.%I', t || '_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_own_read', t);
    execute format('drop policy if exists %I on public.%I', t || '_own_write', t);
    execute format('create policy %I on public.%I for select to authenticated using (seller_id = auth.uid())', t || '_own_read', t);
    execute format('create policy %I on public.%I for all to authenticated using (seller_id = auth.uid() and public.is_seller()) with check (seller_id = auth.uid() and public.is_seller())', t || '_own_write', t);
  end loop;
end $$;
-- Buyer-side policies (seller_orders_buyer_read, seller_reviews_buyer_insert,
-- seller_products_public_read) are unchanged. Checkout goes through security-definer RPCs.

-- 5. promo_codes (OPTIONAL, needs app change first) ------------------------------------------
-- promo_public_read lets anyone list every active code. Recommended: drop it and validate codes
-- through a security-definer RPC (e.g. check_promo(seminar_id, code)). Left commented because the
-- current registration flow may read promo_codes directly.
-- drop policy if exists promo_public_read on public.promo_codes;
