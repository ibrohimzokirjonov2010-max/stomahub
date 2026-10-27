-- 0010 — Profile v2: doctor fields, clinic card, payment tokens (demo-ready).
-- Idempotent. Do NOT apply automatically; owner runs in Supabase SQL editor.

-- 1. Doctor profile fields ------------------------------------------------------
alter table public.profiles add column if not exists license text not null default '';
alter table public.profiles add column if not exists experience_years integer not null default 0;
alter table public.profiles add column if not exists about text not null default '';
alter table public.profiles add column if not exists verified boolean not null default false;

alter table public.profiles drop constraint if exists profiles_license_len;
alter table public.profiles add constraint profiles_license_len
  check (length(license) <= 80) not valid;
alter table public.profiles drop constraint if exists profiles_about_len;
alter table public.profiles add constraint profiles_about_len
  check (length(about) <= 2000) not valid;
alter table public.profiles drop constraint if exists profiles_experience_range;
alter table public.profiles add constraint profiles_experience_range
  check (experience_years >= 0 and experience_years <= 60) not valid;

-- Users cannot self-verify or mint bonus/plus/role (extends 0007 guard).
create or replace function public.profile_self_guard()
returns trigger language plpgsql as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') then return new; end if;
  if tg_op = 'UPDATE' then
    new.role := old.role;
    new.bonus := old.bonus;
    new.plus := old.plus;
    new.verified := old.verified;
  elsif tg_op = 'INSERT' then
    if new.role not in ('customer', 'organizer', 'seller') then new.role := 'customer'; end if;
    new.bonus := 0;
    new.plus := false;
    new.verified := false;
  end if;
  return new;
end $$;

-- 2. My clinic card (one row per user) ------------------------------------------
create table if not exists public.customer_clinic (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  name text not null default '',
  address text not null default '',
  hours text not null default '',
  phone text not null default '',
  website text not null default '',
  photo_url text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.customer_clinic enable row level security;
drop policy if exists customer_clinic_own on public.customer_clinic;
create policy customer_clinic_own on public.customer_clinic
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.customer_clinic to authenticated;

-- 3. Card tokens: brand + last4 + exp + default (never PAN/CVV) -----------------
alter table public.customer_cards add column if not exists is_default boolean not null default false;
alter table public.customer_cards drop constraint if exists customer_cards_last4_fmt;
alter table public.customer_cards add constraint customer_cards_last4_fmt
  check (last4 = '' or last4 ~ '^[0-9]{4}$') not valid;
alter table public.customer_cards drop constraint if exists customer_cards_exp_fmt;
alter table public.customer_cards add constraint customer_cards_exp_fmt
  check (exp = '' or exp ~ '^(0[1-9]|1[0-2])/[0-9]{2}$') not valid;
alter table public.customer_cards drop constraint if exists customer_cards_brand_ok;
alter table public.customer_cards add constraint customer_cards_brand_ok
  check (brand in ('', 'UZCARD', 'HUMO', 'VISA', 'MC')) not valid;
comment on table public.customer_cards is
  'Tokenized card labels only (brand, last4, exp, is_default). Never store PAN or CVV. Checkout uses demo payment service until merchant keys arrive.';

-- 4. Linked wallets: Click / Payme (phone or label only) ------------------------
create table if not exists public.customer_wallets (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null check (provider in ('click', 'payme')),
  label text not null default '',
  phone text not null default '',
  is_default boolean not null default false,
  linked_at timestamptz not null default now(),
  unique (user_id, provider)
);
create index if not exists customer_wallets_user_idx on public.customer_wallets (user_id);
alter table public.customer_wallets enable row level security;
drop policy if exists customer_wallets_own on public.customer_wallets;
create policy customer_wallets_own on public.customer_wallets
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.customer_wallets to authenticated;
comment on table public.customer_wallets is
  'Click/Payme link labels (phone or display name). No merchant credentials. Demo mode until gateway keys are configured.';

-- 5. Certificates ledger --------------------------------------------------------
create table if not exists public.customer_certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id text not null default '',
  title text not null,
  issued_at date,
  file_url text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);
create index if not exists customer_certificates_user_idx
  on public.customer_certificates (user_id, created_at desc);
alter table public.customer_certificates enable row level security;
drop policy if exists customer_certificates_own on public.customer_certificates;
create policy customer_certificates_own on public.customer_certificates
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.customer_certificates to authenticated;

-- 6. Clinic photos bucket -------------------------------------------------------
do $storage$
begin
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('clinic', 'clinic', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
  on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
  execute 'drop policy if exists clinic_public_read on storage.objects';
  execute $p$create policy clinic_public_read on storage.objects for select to anon, authenticated
    using (bucket_id = 'clinic')$p$;
  execute 'drop policy if exists clinic_own_insert on storage.objects';
  execute $p$create policy clinic_own_insert on storage.objects for insert to authenticated
    with check (bucket_id = 'clinic' and (storage.foldername(name))[1] = auth.uid()::text)$p$;
  execute 'drop policy if exists clinic_own_update on storage.objects';
  execute $p$create policy clinic_own_update on storage.objects for update to authenticated
    using (bucket_id = 'clinic' and (storage.foldername(name))[1] = auth.uid()::text)
    with check (bucket_id = 'clinic' and (storage.foldername(name))[1] = auth.uid()::text)$p$;
  execute 'drop policy if exists clinic_own_delete on storage.objects';
  execute $p$create policy clinic_own_delete on storage.objects for delete to authenticated
    using (bucket_id = 'clinic' and (storage.foldername(name))[1] = auth.uid()::text)$p$;
exception when undefined_table or invalid_schema_name or insufficient_privilege then
  null;
end $storage$;
