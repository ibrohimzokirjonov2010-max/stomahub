-- 0025: seller (and later organizer) applications. NOT APPLIED automatically. Review first.
-- Requires 0024 (request_seller_role, approval-aware is_seller) and 0007 (customer_notifications).
-- Two-stage flow:
--  Stage 1  register_seller(...): short form, role 'seller', seller_status 'registered'. Cabinet opens,
--           but only Sozlamalar is writable: seller_settings, seller_branches, seller_staff and
--           seller_activity accept is_seller_member(). Every other seller_* table still requires
--           is_seller() (approved), per 0024.
--  Stage 2  The applicant inserts a seller_applications row (status 'pending') and calls request_seller_role().
--           That now REQUIRES a pending application. seller_status becomes 'pending'.
--       An admin calls admin_review_application(id, approve, reason). That updates the application
--       and the profile, and inserts an in-app notification. Telegram goes through /api/notify/role-review.
-- Reusable: column `kind` ('seller' | 'organizer'). The organizer branch is already handled in the RPC.
-- Idempotent.

-- 0. statuses, helpers, extra shop fields -----------------------------------------------------
alter table public.profiles drop constraint if exists profiles_seller_status_check;
alter table public.profiles add constraint profiles_seller_status_check
  check (seller_status in ('none', 'registered', 'pending', 'approved', 'rejected', 'blocked'));

-- registered, or in review, or approved seller (or admin): may edit own shop settings only
create or replace function public.is_seller_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
                 where id = auth.uid()
                   and (role = 'admin' or (role = 'seller'
                        and seller_status in ('registered', 'pending', 'rejected', 'approved')
                        and not blocked)));
$$;
grant execute on function public.is_seller_member() to authenticated;
-- is_seller() (0024) is unchanged: only approved sellers and admins.

alter table public.seller_settings
  add column if not exists owner_name text not null default '',
  add column if not exists telegram text not null default '',
  add column if not exists instagram text not null default '',
  add column if not exists website text not null default '',
  add column if not exists description text not null default '';

-- 1. table ------------------------------------------------------------------------------------
create table if not exists public.seller_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kind text not null default 'seller' check (kind in ('seller', 'organizer')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  full_name text not null check (length(trim(full_name)) between 3 and 120),
  phone text not null check (phone ~ '^\+998[0-9]{9}$'),
  email text not null default '' check (email = '' or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  shop_name text not null check (length(trim(shop_name)) between 2 and 80),
  category text not null default '',
  description text not null default '' check (length(description) <= 1000),
  region text not null default '',
  address text not null default '',
  lat double precision,
  lng double precision,
  instagram text not null default '',
  telegram text not null default '',
  website text not null default '',
  legal_type text not null check (legal_type in ('yatt', 'mchj')),
  stir text not null check (stir ~ '^[0-9]{9}$'),
  docs jsonb not null default '[]'::jsonb check (jsonb_typeof(docs) = 'array'),
  reject_reason text not null default '',
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists seller_applications_user_idx on public.seller_applications (user_id, kind, created_at desc);
create index if not exists seller_applications_status_idx on public.seller_applications (kind, status, created_at desc);
-- one open application per user and kind
create unique index if not exists seller_applications_one_pending
  on public.seller_applications (user_id, kind) where status = 'pending';

alter table public.seller_applications enable row level security;
drop policy if exists sa_own_read on public.seller_applications;
drop policy if exists sa_own_insert on public.seller_applications;
drop policy if exists sa_admin_all on public.seller_applications;
create policy sa_own_read on public.seller_applications for select to authenticated
  using (user_id = auth.uid());
-- applicants may only create a pending, unreviewed row for themselves (no update/delete)
create policy sa_own_insert on public.seller_applications for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending' and reviewed_by is null
              and reviewed_at is null and reject_reason = '');
create policy sa_admin_all on public.seller_applications for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
grant select, insert on public.seller_applications to authenticated;

-- 1b. stage-1 registration + stage-2 request -----------------------------------------------------
create or replace function public.register_seller(
  p_owner_name text, p_shop_name text, p_address text, p_phone text,
  p_telegram text default '', p_instagram text default '', p_logo_url text default '')
returns jsonb language plpgsql security definer set search_path = public as $$
declare r public.profiles;
begin
  select * into r from public.profiles where id = auth.uid() for update;
  if r.id is null then raise exception 'Avval kiring'; end if;
  if r.blocked or r.seller_status = 'blocked' then raise exception 'Hisob bloklangan'; end if;
  if length(trim(coalesce(p_owner_name, ''))) < 3 then raise exception 'Ism-familiyani kiriting'; end if;
  if length(trim(coalesce(p_shop_name, ''))) < 2 then raise exception 'Do‘kon nomini kiriting'; end if;
  if coalesce(p_phone, '') !~ '^\+998[0-9]{9}$' then raise exception 'Telefon raqam noto‘g‘ri'; end if;
  if coalesce(p_logo_url, '') <> '' and p_logo_url !~ ('^https://[^/]+/storage/v1/object/public/seller-media/' || r.id::text || '/')
    then raise exception 'Logo manzili noto‘g‘ri'; end if;
  update public.profiles set
    role = case when role = 'admin' then role else 'seller' end,
    seller_status = case when seller_status in ('approved', 'pending', 'rejected') then seller_status else 'registered' end,
    shop_name = trim(p_shop_name),
    shop_address = trim(regexp_replace(coalesce(p_address, ''), '\s*\[geo:[^\]]*\]', '')),
    full_name = coalesce(nullif(full_name, ''), trim(p_owner_name)),
    updated_at = now()
  where id = r.id;
  insert into public.seller_settings (seller_id, owner_name, phone, address, telegram, instagram, logo_url)
  values (r.id, trim(p_owner_name), p_phone, coalesce(p_address, ''), trim(coalesce(p_telegram, '')),
          trim(coalesce(p_instagram, '')), coalesce(p_logo_url, ''))
  on conflict (seller_id) do update set owner_name = excluded.owner_name, phone = excluded.phone,
    address = excluded.address, telegram = excluded.telegram, instagram = excluded.instagram,
    logo_url = case when excluded.logo_url <> '' then excluded.logo_url else seller_settings.logo_url end,
    updated_at = now();
  return jsonb_build_object('ok', true, 'seller_status', (select seller_status from public.profiles where id = r.id));
end $$;
revoke all on function public.register_seller(text, text, text, text, text, text, text) from public, anon;
grant execute on function public.register_seller(text, text, text, text, text, text, text) to authenticated;

-- 0024 version let anyone jump to 'pending'; now a pending application (stage 2) is required.
create or replace function public.request_seller_role(p_shop_name text default '')
returns void language plpgsql security definer set search_path = public as $$
declare r public.profiles;
begin
  select * into r from public.profiles where id = auth.uid() for update;
  if r.id is null then raise exception 'Avval kiring'; end if;
  if r.role = 'admin' or r.seller_status in ('approved', 'blocked') then return; end if;
  if not exists (select 1 from public.seller_applications
                 where user_id = r.id and kind = 'seller' and status = 'pending') then
    raise exception 'Avval tasdiqlash arizasini yuboring';
  end if;
  update public.profiles set
    role = 'seller', seller_status = 'pending',
    shop_name = coalesce(nullif(trim(p_shop_name), ''), shop_name),
    seller_applied_at = now(), updated_at = now()
  where id = r.id;
end $$;
revoke all on function public.request_seller_role(text) from public, anon;
grant execute on function public.request_seller_role(text) to authenticated;

-- settings-only tables: owner writes allowed for registered/unverified sellers too
do $$
declare t text;
begin
  foreach t in array array['seller_settings', 'seller_branches', 'seller_staff', 'seller_activity'] loop
    if to_regclass('public.' || t) is null then continue; end if;
    execute format('drop policy if exists %I on public.%I', t || '_own_write', t);
    execute format('create policy %I on public.%I for all to authenticated using (seller_id = auth.uid() and public.is_seller_member()) with check (seller_id = auth.uid() and public.is_seller_member())', t || '_own_write', t);
  end loop;
end $$;
-- seller_products, seller_orders, seller_discounts, seller_campaigns, seller_payouts, seller_ad_*,
-- seller_customers, seller_reviews (seller side) keep the 0024 `_own_write` policy, so approved only.
-- Security-definer seller RPCs (e.g. seller_create_manual_order) must check is_seller(). Audit:
-- see the note at the end.

-- 2. private document bucket: {uid}/{application-key}/file -------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('role-docs', 'role-docs', false, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists role_docs_owner_insert on storage.objects;
drop policy if exists role_docs_owner_read on storage.objects;
drop policy if exists role_docs_owner_delete on storage.objects;
drop policy if exists role_docs_admin_read on storage.objects;
create policy role_docs_owner_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'role-docs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy role_docs_owner_read on storage.objects for select to authenticated
  using (bucket_id = 'role-docs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy role_docs_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'role-docs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy role_docs_admin_read on storage.objects for select to authenticated
  using (bucket_id = 'role-docs' and public.is_admin());

-- 3. admin review RPC ---------------------------------------------------------------------------
create or replace function public.admin_review_application(p_id uuid, p_approve boolean, p_reason text default '')
returns jsonb language plpgsql security definer set search_path = public as $$
declare a public.seller_applications;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  select * into a from public.seller_applications where id = p_id for update;
  if a.id is null then raise exception 'Ariza topilmadi'; end if;
  if a.status <> 'pending' then raise exception 'Ariza allaqachon ko‘rib chiqilgan'; end if;
  if not p_approve and length(trim(coalesce(p_reason, ''))) < 3 then raise exception 'Rad etish sababini yozing'; end if;

  update public.seller_applications set
    status = case when p_approve then 'approved' else 'rejected' end,
    reject_reason = case when p_approve then '' else left(trim(p_reason), 500) end,
    reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
  where id = a.id;

  if a.kind = 'seller' then
    if p_approve then
      update public.profiles set
        role = case when role = 'admin' then role else 'seller' end,
        seller_status = 'approved', verified = true, blocked = false, seller_reject_reason = '',
        shop_name = a.shop_name, shop_type = a.category, shop_description = a.description,
        shop_address = trim(both ', ' from concat_ws(', ', nullif(a.region, ''), nullif(a.address, ''))),
        org_type = case a.legal_type when 'yatt' then 'YaTT' else 'MChJ' end, stir = a.stir,
        phone = coalesce(nullif(phone, ''), a.phone),
        seller_docs = a.docs, seller_applied_at = a.created_at, updated_at = now()
      where id = a.user_id;
    else
      update public.profiles set seller_status = 'rejected', verified = false,
        seller_reject_reason = left(trim(p_reason), 500), updated_at = now()
      where id = a.user_id and seller_status <> 'blocked';
    end if;
  else -- organizer
    if p_approve then
      update public.profiles set role = case when role = 'admin' then role else 'organizer' end,
        org_status = 'approved', updated_at = now() where id = a.user_id;
    else
      update public.profiles set org_status = 'rejected', updated_at = now()
      where id = a.user_id and org_status <> 'blocked';
    end if;
  end if;

  insert into public.customer_notifications (user_id, kind, title, body, link)
  values (a.user_id, 'info',
    case when p_approve then case a.kind when 'seller' then 'Do‘koningiz tasdiqlandi!' else 'Arizangiz tasdiqlandi!' end
         else 'Arizangiz rad etildi' end,
    case when p_approve then case a.kind when 'seller'
           then 'Endi mahsulot qo‘shishingiz mumkin.'
           else 'Tashkilotchi kabinetingiz ochildi. Endi seminar qo‘shishingiz mumkin.' end
         else 'Sabab: ' || left(trim(p_reason), 500) || '. Ma’lumotlarni tuzatib, qayta ariza yuborishingiz mumkin.' end,
    case when p_approve then case a.kind when 'seller' then '/sotuvchi' else '/tashkilotchi' end
         else case a.kind when 'seller' then '/sotuvchi/tasdiqlash' else '/tashkilotchi' end end);

  return jsonb_build_object('ok', true, 'id', a.id, 'user_id', a.user_id, 'kind', a.kind,
                            'status', case when p_approve then 'approved' else 'rejected' end);
end $$;
revoke all on function public.admin_review_application(uuid, boolean, text) from public, anon;
grant execute on function public.admin_review_application(uuid, boolean, text) to authenticated;
