-- 0007 — Regular-user profile: admin role, notifications, avatars bucket, buyer read access.
-- Idempotent. Run after 0001–0006 in the Supabase SQL editor.

-- 1. roles: add 'admin' ---------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('customer', 'organizer', 'seller', 'admin'));

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
grant execute on function public.is_admin() to authenticated;

-- Users may edit their own profile but never their role, bonus or plus flag.
create or replace function public.profile_self_guard()
returns trigger language plpgsql as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') then return new; end if;
  if tg_op = 'UPDATE' then
    new.role := old.role;
    new.bonus := old.bonus;
    new.plus := old.plus;
  elsif tg_op = 'INSERT' then
    if new.role not in ('customer', 'organizer', 'seller') then new.role := 'customer'; end if;
    new.bonus := 0;
    new.plus := false;
  end if;
  return new;
end $$;
drop trigger if exists profiles_self_guard on public.profiles;
create trigger profiles_self_guard before insert or update on public.profiles
  for each row execute function public.profile_self_guard();

-- 2. profile field validation ---------------------------------------------------
alter table public.profiles drop constraint if exists profiles_name_len;
alter table public.profiles add constraint profiles_name_len check (length(coalesce(name, '')) <= 120) not valid;
alter table public.profiles drop constraint if exists profiles_clinic_len;
alter table public.profiles add constraint profiles_clinic_len check (length(clinic) <= 160) not valid;

-- 3. timestamps on child tables (for cross-device ordering) -----------------------
alter table public.customer_addresses add column if not exists updated_at timestamptz not null default now();
alter table public.customer_favorites add column if not exists created_at timestamptz not null default now();
alter table public.shop_orders add column if not exists updated_at timestamptz not null default now();

-- 4. notifications ---------------------------------------------------------------
create table if not exists public.customer_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null default 'info' check (kind in ('order', 'seminar', 'bonus', 'promo', 'info')),
  title text not null check (length(trim(title)) > 0),
  body text not null default '',
  link text not null default '',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists customer_notifications_user_idx on public.customer_notifications (user_id, created_at desc);
alter table public.customer_notifications enable row level security;

drop policy if exists customer_notifications_read on public.customer_notifications;
create policy customer_notifications_read on public.customer_notifications
  for select to authenticated using (user_id = auth.uid());
drop policy if exists customer_notifications_mark on public.customer_notifications;
create policy customer_notifications_mark on public.customer_notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists customer_notifications_delete on public.customer_notifications;
create policy customer_notifications_delete on public.customer_notifications
  for delete to authenticated using (user_id = auth.uid());
grant select, update, delete on public.customer_notifications to authenticated;

-- 5. bonus ledger (read-only for the user; written by server functions) ------------
create table if not exists public.customer_bonus_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount integer not null,
  reason text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists customer_bonus_log_user_idx on public.customer_bonus_log (user_id, created_at desc);
alter table public.customer_bonus_log enable row level security;
drop policy if exists customer_bonus_log_read on public.customer_bonus_log;
create policy customer_bonus_log_read on public.customer_bonus_log
  for select to authenticated using (user_id = auth.uid());
grant select on public.customer_bonus_log to authenticated;

-- 6. buyers read the items of their own orders --------------------------------------
drop policy if exists seller_order_items_buyer_read on public.seller_order_items;
create policy seller_order_items_buyer_read on public.seller_order_items
  for select to authenticated using (exists (
    select 1 from public.seller_orders o where o.id = order_id and o.buyer_id = auth.uid()));

-- 7. avatars bucket (re-asserted; 2 MB, images only) ---------------------------------
do $storage$
begin
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
  on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
  execute 'drop policy if exists avatars_public_read on storage.objects';
  execute $p$create policy avatars_public_read on storage.objects for select to anon, authenticated
    using (bucket_id = 'avatars')$p$;
  execute 'drop policy if exists avatars_own_insert on storage.objects';
  execute $p$create policy avatars_own_insert on storage.objects for insert to authenticated
    with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)$p$;
  execute 'drop policy if exists avatars_own_update on storage.objects';
  execute $p$create policy avatars_own_update on storage.objects for update to authenticated
    using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
    with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)$p$;
  execute 'drop policy if exists avatars_own_delete on storage.objects';
  execute $p$create policy avatars_own_delete on storage.objects for delete to authenticated
    using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)$p$;
exception when undefined_table or invalid_schema_name or insufficient_privilege then
  null;
end $storage$;
