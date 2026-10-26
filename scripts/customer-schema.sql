-- Customer account, clinic records, and public catalogs.
-- Idempotent. Run after supabase/migrations/0001_init.sql in the Supabase SQL editor.
-- Does not drop marketplace tables (users, products, orders, reviews, sellers).

alter table public.profiles add column if not exists clinic text not null default '';
alter table public.profiles add column if not exists city text not null default '';
alter table public.profiles add column if not exists district text not null default '';
alter table public.profiles add column if not exists lang text not null default 'uz';
alter table public.profiles add column if not exists avatar_url text not null default '';
alter table public.profiles add column if not exists plus boolean not null default false;
alter table public.profiles add column if not exists bonus integer not null default 0;
alter table public.profiles add column if not exists notif jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists prefs jsonb not null default '{}'::jsonb;

create table if not exists public.customer_addresses (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  payload jsonb not null,
  sort_at integer not null default 0
);
create index if not exists customer_addresses_user_idx on public.customer_addresses (user_id, sort_at);

create table if not exists public.customer_cards (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  brand text not null default '',
  last4 text not null default '',
  exp text not null default '',
  bank text not null default ''
);
create index if not exists customer_cards_user_idx on public.customer_cards (user_id);

create table if not exists public.customer_favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  item_id text not null,
  primary key (user_id, kind, item_id)
);

create table if not exists public.customer_course_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id text not null,
  done integer not null default 0,
  primary key (user_id, course_id)
);

create table if not exists public.shop_orders (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'processing',
  payload jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists shop_orders_user_idx on public.shop_orders (user_id, created_at desc);

create table if not exists public.user_blobs (
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, kind)
);

create table if not exists public.catalog_items (
  kind text not null,
  id text not null,
  payload jsonb not null,
  sort_at integer not null default 0,
  primary key (kind, id)
);
create index if not exists catalog_items_kind_idx on public.catalog_items (kind, sort_at);

alter table public.customer_addresses enable row level security;
alter table public.customer_cards enable row level security;
alter table public.customer_favorites enable row level security;
alter table public.customer_course_progress enable row level security;
alter table public.shop_orders enable row level security;
alter table public.user_blobs enable row level security;
alter table public.catalog_items enable row level security;

drop policy if exists customer_addresses_own on public.customer_addresses;
create policy customer_addresses_own on public.customer_addresses
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists customer_cards_own on public.customer_cards;
create policy customer_cards_own on public.customer_cards
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists customer_favorites_own on public.customer_favorites;
create policy customer_favorites_own on public.customer_favorites
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists customer_progress_own on public.customer_course_progress;
create policy customer_progress_own on public.customer_course_progress
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists shop_orders_own on public.shop_orders;
create policy shop_orders_own on public.shop_orders
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists user_blobs_own on public.user_blobs;
create policy user_blobs_own on public.user_blobs
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists catalog_items_read on public.catalog_items;
create policy catalog_items_read on public.catalog_items
for select to anon, authenticated using (true);

grant select on public.catalog_items to anon, authenticated;
grant select, insert, update, delete on
  public.customer_addresses, public.customer_cards, public.customer_favorites,
  public.customer_course_progress, public.shop_orders, public.user_blobs
to authenticated;

do $storage$
begin
  insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

  execute 'drop policy if exists avatars_public_read on storage.objects';
  execute $pol$create policy avatars_public_read on storage.objects
    for select to anon, authenticated using (bucket_id = 'avatars')$pol$;

  execute 'drop policy if exists avatars_own_insert on storage.objects';
  execute $pol$create policy avatars_own_insert on storage.objects
    for insert to authenticated with check (
      bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
    )$pol$;

  execute 'drop policy if exists avatars_own_update on storage.objects';
  execute $pol$create policy avatars_own_update on storage.objects
    for update to authenticated using (
      bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
    ) with check (
      bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
    )$pol$;

  execute 'drop policy if exists avatars_own_delete on storage.objects';
  execute $pol$create policy avatars_own_delete on storage.objects
    for delete to authenticated using (
      bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
    )$pol$;
exception when undefined_table or invalid_schema_name or insufficient_privilege then
  null;
end $storage$;

do $$
declare
  t text;
begin
  foreach t in array array['profiles', 'shop_orders', 'user_blobs', 'catalog_items', 'customer_favorites']
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when others then
      null;
    end;
    execute format('alter table public.%I replica identity full', t);
  end loop;
end $$;
