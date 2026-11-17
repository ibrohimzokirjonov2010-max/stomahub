-- 0079: Sotuv uchun leads jadvali (SH-009). QO‘LDA QO‘LLANADI — faqat Ibrohim roziligi bilan.
-- Takror ishga tushirish xavfsiz (idempotent). Hech qanday mavjud qator o‘chirilmaydi.
--
-- Nima qiladi:
--   1) public.sales_staff — sotuv xodimlari ro‘yxati (user_id = auth.users).
--      Boshqarish faqat adminlarga: public.is_admin() (0007_profile: profiles.role = 'admin').
--      /admin/kurslar va course_moderate ham shu tekshiruvni ishlatadi (course_is_admin — xuddi shu rol).
--   2) public.sales_leads — sotuv lidlari (ism/kompaniya, kontakt, biznes turi, ehtiyoj,
--      holat, keyingi aloqa, natija, manba va UTM maydonlari).
--   3) public.sales_lead_interactions — muloqot tarixi (lid o‘chirilsa, yozuvlar ham o‘chadi).
--   4) RLS: o‘qish/yozish/yangilash — admin yoki sales_staff; o‘chirish — faqat admin.
--      Oddiy foydalanuvchi hech narsani ko‘rmaydi.
--
-- Bog‘liqlik: 0007_profile.sql (public.is_admin()).

begin;

-- 1) Sotuv xodimlari -------------------------------------------------------
create table if not exists public.sales_staff (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.sales_staff
  add column if not exists created_by uuid references auth.users (id) on delete set null,
  add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'sales_staff_user_id_fkey' and conrelid = 'public.sales_staff'::regclass
  ) then
    alter table public.sales_staff
      add constraint sales_staff_user_id_fkey
      foreign key (user_id) references auth.users (id) on delete cascade;
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'sales_staff_created_by_fkey' and conrelid = 'public.sales_staff'::regclass
  ) then
    begin
      alter table public.sales_staff
        add constraint sales_staff_created_by_fkey
        foreign key (created_by) references auth.users (id) on delete set null;
    exception when duplicate_object then null;
    end;
  end if;
end $$;

create or replace function public.is_sales_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.sales_staff s where s.user_id = auth.uid());
$$;

revoke all on function public.is_sales_staff() from public, anon;
grant execute on function public.is_sales_staff() to authenticated;

alter table public.sales_staff enable row level security;

drop policy if exists sales_staff_select_admin on public.sales_staff;
create policy sales_staff_select_admin on public.sales_staff
  for select to authenticated
  using (public.is_admin());

drop policy if exists sales_staff_insert_admin on public.sales_staff;
create policy sales_staff_insert_admin on public.sales_staff
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists sales_staff_update_admin on public.sales_staff;
create policy sales_staff_update_admin on public.sales_staff
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists sales_staff_delete_admin on public.sales_staff;
create policy sales_staff_delete_admin on public.sales_staff
  for delete to authenticated
  using (public.is_admin());

revoke all on public.sales_staff from public, anon, authenticated;
grant select, insert, update, delete on public.sales_staff to authenticated;

-- 2) Lidlar ----------------------------------------------------------------
create table if not exists public.sales_leads (
  id uuid primary key default gen_random_uuid(),
  name_or_company text not null,
  contact text,
  business_type text,
  need text,
  status text not null default 'new',
  next_contact_at timestamptz,
  outcome text,
  source text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  owner_id uuid references auth.users (id) on delete set null,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sales_leads_name_chk check (length(trim(name_or_company)) > 0),
  constraint sales_leads_business_type_chk
    check (business_type is null or business_type in ('clinic', 'dentist', 'lab', 'seller', 'supplier', 'other')),
  constraint sales_leads_status_chk
    check (status in ('new', 'contacted', 'interested', 'negotiating', 'won', 'lost'))
);

alter table public.sales_leads
  add column if not exists name_or_company text,
  add column if not exists contact text,
  add column if not exists business_type text,
  add column if not exists need text,
  add column if not exists status text not null default 'new',
  add column if not exists next_contact_at timestamptz,
  add column if not exists outcome text,
  add column if not exists source text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content text,
  add column if not exists owner_id uuid,
  add column if not exists created_by uuid default auth.uid(),
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- CREATE TABLE IF NOT EXISTS yuqoridagi cheklovlarni mavjud jadvalga qo‘shmaydi.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'sales_leads' and column_name = 'name_or_company'
  ) then
    update public.sales_leads set name_or_company = 'Noma’lum' where name_or_company is null or length(trim(name_or_company)) = 0;
    begin
      alter table public.sales_leads alter column name_or_company set not null;
    exception when others then null;
    end;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'sales_leads_name_chk') then
    alter table public.sales_leads
      add constraint sales_leads_name_chk check (length(trim(name_or_company)) > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'sales_leads_business_type_chk') then
    alter table public.sales_leads
      add constraint sales_leads_business_type_chk
      check (business_type is null or business_type in ('clinic', 'dentist', 'lab', 'seller', 'supplier', 'other'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'sales_leads_status_chk') then
    alter table public.sales_leads
      add constraint sales_leads_status_chk
      check (status in ('new', 'contacted', 'interested', 'negotiating', 'won', 'lost'));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'sales_leads_owner_id_fkey' and conrelid = 'public.sales_leads'::regclass
  ) then
    alter table public.sales_leads
      add constraint sales_leads_owner_id_fkey
      foreign key (owner_id) references auth.users (id) on delete set null;
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'sales_leads_created_by_fkey' and conrelid = 'public.sales_leads'::regclass
  ) then
    alter table public.sales_leads
      add constraint sales_leads_created_by_fkey
      foreign key (created_by) references auth.users (id) on delete set null;
  end if;
end $$;

create index if not exists sales_leads_status_idx on public.sales_leads (status);
create index if not exists sales_leads_next_contact_at_idx on public.sales_leads (next_contact_at);
create index if not exists sales_leads_owner_id_idx on public.sales_leads (owner_id);

create or replace function public.sales_leads_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.sales_leads_set_updated_at() from public, anon, authenticated;

drop trigger if exists sales_leads_set_updated_at on public.sales_leads;
create trigger sales_leads_set_updated_at
  before update on public.sales_leads
  for each row execute function public.sales_leads_set_updated_at();

alter table public.sales_leads enable row level security;

drop policy if exists sales_leads_select_staff on public.sales_leads;
create policy sales_leads_select_staff on public.sales_leads
  for select to authenticated
  using (public.is_admin() or public.is_sales_staff());

drop policy if exists sales_leads_insert_staff on public.sales_leads;
create policy sales_leads_insert_staff on public.sales_leads
  for insert to authenticated
  with check (public.is_admin() or public.is_sales_staff());

drop policy if exists sales_leads_update_staff on public.sales_leads;
create policy sales_leads_update_staff on public.sales_leads
  for update to authenticated
  using (public.is_admin() or public.is_sales_staff())
  with check (public.is_admin() or public.is_sales_staff());

drop policy if exists sales_leads_delete_admin on public.sales_leads;
create policy sales_leads_delete_admin on public.sales_leads
  for delete to authenticated
  using (public.is_admin());

revoke all on public.sales_leads from public, anon, authenticated;
grant select, insert, update, delete on public.sales_leads to authenticated;

-- 3) Muloqot tarixi --------------------------------------------------------
create table if not exists public.sales_lead_interactions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.sales_leads (id) on delete cascade,
  channel text,
  note text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.sales_lead_interactions
  add column if not exists lead_id uuid,
  add column if not exists channel text,
  add column if not exists note text,
  add column if not exists created_by uuid default auth.uid(),
  add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'sales_lead_interactions_lead_id_fkey'
      and conrelid = 'public.sales_lead_interactions'::regclass
  ) then
    alter table public.sales_lead_interactions
      alter column lead_id set not null;
    alter table public.sales_lead_interactions
      add constraint sales_lead_interactions_lead_id_fkey
      foreign key (lead_id) references public.sales_leads (id) on delete cascade;
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'sales_lead_interactions_created_by_fkey'
      and conrelid = 'public.sales_lead_interactions'::regclass
  ) then
    alter table public.sales_lead_interactions
      add constraint sales_lead_interactions_created_by_fkey
      foreign key (created_by) references auth.users (id) on delete set null;
  end if;
end $$;

create index if not exists sales_lead_interactions_lead_id_idx
  on public.sales_lead_interactions (lead_id, created_at desc);

alter table public.sales_lead_interactions enable row level security;

drop policy if exists sales_lead_interactions_select_staff on public.sales_lead_interactions;
create policy sales_lead_interactions_select_staff on public.sales_lead_interactions
  for select to authenticated
  using (public.is_admin() or public.is_sales_staff());

drop policy if exists sales_lead_interactions_insert_staff on public.sales_lead_interactions;
create policy sales_lead_interactions_insert_staff on public.sales_lead_interactions
  for insert to authenticated
  with check (public.is_admin() or public.is_sales_staff());

drop policy if exists sales_lead_interactions_update_staff on public.sales_lead_interactions;
create policy sales_lead_interactions_update_staff on public.sales_lead_interactions
  for update to authenticated
  using (public.is_admin() or public.is_sales_staff())
  with check (public.is_admin() or public.is_sales_staff());

drop policy if exists sales_lead_interactions_delete_admin on public.sales_lead_interactions;
create policy sales_lead_interactions_delete_admin on public.sales_lead_interactions
  for delete to authenticated
  using (public.is_admin());

revoke all on public.sales_lead_interactions from public, anon, authenticated;
grant select, insert, update, delete on public.sales_lead_interactions to authenticated;

comment on table public.sales_staff is 'Sotuv xodimlari. Faqat admin qo‘shadi/o‘chiradi.';
comment on table public.sales_leads is 'Sotuv lidlari. Kirish: admin yoki sales_staff.';
comment on table public.sales_lead_interactions is 'Lid bo‘yicha muloqot tarixi.';
comment on function public.is_sales_staff() is 'Joriy foydalanuvchi sales_staff jadvalida bormi (RLS dan mustaqil).';

notify pgrst, 'reload schema';

commit;
