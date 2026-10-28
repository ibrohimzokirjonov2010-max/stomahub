-- 0026: two-stage onboarding for seminar organizers (tashkilotchi). NOT APPLIED automatically.
-- Requires 0024 (approval-aware is_organizer, profile_self_guard) and 0025 (seller_applications,
-- role-docs bucket, admin_review_application).
--  Stage 1  register_organizer(...): short form -> role 'organizer', org_status 'registered'.
--           Cabinet opens, only Sozlamalar works (organizer_settings accepts is_organizer_member()).
--           Seminars, tickets, promo codes, payments etc. keep their 0001 policies with is_organizer(),
--           which since 0024 means approved organizers (or admins) only.
--  Stage 2  insert seller_applications row (kind 'organizer', status 'pending') then
--           request_organizer_role(), which now REQUIRES that pending row -> org_status 'pending'.
--           admin_review_application() approves/rejects and notifies.
-- Legacy: unapproved organizers ('pending'/'none' with no application row) become 'registered'
--           (they never sent documents, so they must pass stage 2). See section 5.
-- Idempotent.

-- 0. statuses + helper ---------------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_org_status_check;
alter table public.profiles add constraint profiles_org_status_check
  check (org_status in ('none', 'registered', 'pending', 'approved', 'rejected', 'blocked'));

create or replace function public.is_organizer_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
                 where id = auth.uid()
                   and (role = 'admin' or (role = 'organizer'
                        and org_status in ('registered', 'pending', 'rejected', 'approved')
                        and not blocked)));
$$;
grant execute on function public.is_organizer_member() to authenticated;

-- 1. organizer profile / settings (table exists since 0001: name, email, notes, city, qr_sound, marketing)
alter table public.organizer_settings
  add column if not exists owner_name text not null default '',
  add column if not exists org_name text not null default '',
  add column if not exists phone text not null default '',
  add column if not exists address text not null default '',
  add column if not exists telegram text not null default '',
  add column if not exists instagram text not null default '',
  add column if not exists website text not null default '',
  add column if not exists description text not null default '',
  add column if not exists logo_url text not null default '',
  add column if not exists updated_at timestamptz not null default now();
alter table public.organizer_settings drop constraint if exists organizer_settings_lengths_check;
alter table public.organizer_settings add constraint organizer_settings_lengths_check
  check (length(org_name) <= 80 and length(description) <= 1000);
-- 0001 settings_owner required is_organizer() (approved since 0024); registered organizers may edit too
drop policy if exists settings_owner on public.organizer_settings;
drop policy if exists organizer_settings_admin_read on public.organizer_settings;
create policy settings_owner on public.organizer_settings for all to authenticated
  using (organizer_id = auth.uid() and public.is_organizer_member())
  with check (organizer_id = auth.uid() and public.is_organizer_member());
create policy organizer_settings_admin_read on public.organizer_settings for select to authenticated
  using (public.is_admin());

-- 2. stage 1 -------------------------------------------------------------------------------------
create or replace function public.register_organizer(
  p_owner_name text, p_org_name text, p_address text, p_phone text,
  p_telegram text default '', p_instagram text default '', p_logo_url text default '')
returns jsonb language plpgsql security definer set search_path = public as $$
declare r public.profiles;
begin
  select * into r from public.profiles where id = auth.uid() for update;
  if r.id is null then raise exception 'Avval kiring'; end if;
  if r.blocked or r.org_status = 'blocked' then raise exception 'Hisob bloklangan'; end if;
  -- one business role per account (same rule as 0024 request_organizer_role)
  if r.role = 'seller' then raise exception 'Sotuvchi hisobi tashkilotchi bo‘la olmaydi'; end if;
  if length(trim(coalesce(p_owner_name, ''))) < 3 then raise exception 'Ism-familiyani kiriting'; end if;
  if length(trim(coalesce(p_org_name, ''))) < 2 then raise exception 'Tashkilot nomini kiriting'; end if;
  if length(trim(coalesce(p_org_name, ''))) > 80 then raise exception 'Tashkilot nomi juda uzun'; end if;
  if coalesce(p_phone, '') !~ '^\+998[0-9]{9}$' then raise exception 'Telefon raqam noto‘g‘ri'; end if;
  if coalesce(p_logo_url, '') <> '' and p_logo_url !~ ('^https://[^/]+/storage/v1/object/public/seller-media/' || r.id::text || '/')
    then raise exception 'Logo manzili noto‘g‘ri'; end if;
  update public.profiles set
    role = case when role = 'admin' then role else 'organizer' end,
    org_status = case when org_status in ('approved', 'pending', 'rejected') then org_status else 'registered' end,
    full_name = coalesce(nullif(full_name, ''), trim(p_owner_name)),
    updated_at = now()
  where id = r.id;
  insert into public.organizer_settings (organizer_id, name, owner_name, org_name, phone, address, telegram, instagram, logo_url)
  values (r.id, trim(p_owner_name), trim(p_owner_name), trim(p_org_name), p_phone, coalesce(p_address, ''),
          trim(coalesce(p_telegram, '')), trim(coalesce(p_instagram, '')), coalesce(p_logo_url, ''))
  on conflict (organizer_id) do update set name = excluded.name, owner_name = excluded.owner_name, org_name = excluded.org_name,
    phone = excluded.phone, address = excluded.address, telegram = excluded.telegram, instagram = excluded.instagram,
    logo_url = case when excluded.logo_url <> '' then excluded.logo_url else organizer_settings.logo_url end,
    updated_at = now();
  return jsonb_build_object('ok', true, 'org_status', (select org_status from public.profiles where id = r.id));
end $$;
revoke all on function public.register_organizer(text, text, text, text, text, text, text) from public, anon;
grant execute on function public.register_organizer(text, text, text, text, text, text, text) to authenticated;

-- 3. stage 2: 0024 let anyone become 'pending'; now a pending organizer application is required
create or replace function public.request_organizer_role()
returns void language plpgsql security definer set search_path = public as $$
declare r public.profiles;
begin
  select * into r from public.profiles where id = auth.uid() for update;
  if r.id is null then raise exception 'Avval kiring'; end if;
  if r.role in ('admin', 'seller') or r.org_status in ('approved', 'blocked') then return; end if;
  if not exists (select 1 from public.seller_applications
                 where user_id = r.id and kind = 'organizer' and status = 'pending') then
    raise exception 'Avval tasdiqlash arizasini yuboring';
  end if;
  update public.profiles set role = 'organizer', org_status = 'pending', updated_at = now()
  where id = r.id;
end $$;
revoke all on function public.request_organizer_role() from public, anon;
grant execute on function public.request_organizer_role() to authenticated;

-- 4. admin review: organizer branch now fills profile + settings, links to the right pages ---------
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
        org_status = 'approved', verified = true, blocked = false,
        org_type = case a.legal_type when 'yatt' then 'YaTT' else 'MChJ' end, stir = a.stir,
        phone = coalesce(nullif(phone, ''), a.phone), updated_at = now()
      where id = a.user_id;
      insert into public.organizer_settings (organizer_id, owner_name, org_name, phone, email, address, telegram, instagram, website, description)
      values (a.user_id, a.full_name, a.shop_name, a.phone, a.email,
              trim(both ', ' from concat_ws(', ', nullif(a.region, ''), nullif(a.address, ''))),
              a.telegram, a.instagram, a.website, a.description)
      on conflict (organizer_id) do update set org_name = excluded.org_name,
        owner_name = coalesce(nullif(organizer_settings.owner_name, ''), excluded.owner_name),
        email = coalesce(nullif(organizer_settings.email, ''), excluded.email),
        description = coalesce(nullif(organizer_settings.description, ''), excluded.description),
        updated_at = now();
    else
      update public.profiles set org_status = 'rejected', verified = false, updated_at = now()
      where id = a.user_id and org_status <> 'blocked';
    end if;
  end if;

  insert into public.customer_notifications (user_id, kind, title, body, link)
  values (a.user_id, 'info',
    case when p_approve then case a.kind when 'seller' then 'Do‘koningiz tasdiqlandi!' else 'Tashkilotchi sifatida tasdiqlandingiz!' end
         else 'Arizangiz rad etildi' end,
    case when p_approve then case a.kind when 'seller'
           then 'Endi mahsulot qo‘shishingiz mumkin.'
           else 'Barcha bo‘limlar ochildi. Endi seminar qo‘shishingiz mumkin.' end
         else 'Sabab: ' || left(trim(p_reason), 500) || '. Ma’lumotlarni tuzatib, qayta ariza yuborishingiz mumkin.' end,
    case when p_approve then case a.kind when 'seller' then '/sotuvchi' else '/tashkilotchi' end
         else case a.kind when 'seller' then '/sotuvchi/tasdiqlash' else '/tashkilotchi/tasdiqlash' end end);

  return jsonb_build_object('ok', true, 'id', a.id, 'user_id', a.user_id, 'kind', a.kind,
                            'status', case when p_approve then 'approved' else 'rejected' end);
end $$;
revoke all on function public.admin_review_application(uuid, boolean, text) from public, anon;
grant execute on function public.admin_review_application(uuid, boolean, text) to authenticated;

-- 5. legacy unapproved organizers -------------------------------------------------------------------
-- Before 0026 anyone could set themselves 'pending' with no documents (3 such rows + 1 organizer with
-- org_status 'none' at the time of writing). They have no application, so they become 'registered':
-- they keep cabinet access (Sozlamalar) and are asked to pass stage 2 before adding seminars.
update public.profiles p set org_status = 'registered', updated_at = now()
where p.role = 'organizer' and p.org_status in ('pending', 'none')
  and not exists (select 1 from public.seller_applications a
                  where a.user_id = p.id and a.kind = 'organizer' and a.status = 'pending');
