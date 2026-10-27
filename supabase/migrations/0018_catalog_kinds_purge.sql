-- 0018: ensure catalog kinds for books/courses/labs/consultations/ads use catalog_items
-- (no separate tables needed — frontend registerCatalog binds kind → mutable arrays).
-- Harden RLS and document allowed kinds. Safe to re-run.

-- Allowed public catalog kinds used by the app (reference only)
comment on table public.catalog_items is
  'Public catalog rows. kind ∈ {book,course,article,channel,master,ad,deal,surplus,uniform,device,doctor,job,certificate,post,seminar,consultation,lab}. payload = item JSON.';

-- Ensure owner_id / updated_at exist (also in 0013)
alter table public.catalog_items add column if not exists owner_id uuid references auth.users(id) on delete set null;
alter table public.catalog_items add column if not exists updated_at timestamptz not null default now();

create index if not exists catalog_items_kind_idx on public.catalog_items (kind, sort_at);
create index if not exists catalog_items_owner_idx on public.catalog_items (owner_id);

alter table public.catalog_items enable row level security;

drop policy if exists catalog_items_read on public.catalog_items;
create policy catalog_items_read on public.catalog_items
for select to anon, authenticated using (true);

drop policy if exists catalog_items_insert_own on public.catalog_items;
create policy catalog_items_insert_own on public.catalog_items
for insert to authenticated
with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists catalog_items_update_own on public.catalog_items;
create policy catalog_items_update_own on public.catalog_items
for update to authenticated
using (owner_id = auth.uid() or public.is_admin())
with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists catalog_items_delete_own on public.catalog_items;
create policy catalog_items_delete_own on public.catalog_items
for delete to authenticated
using (owner_id = auth.uid() or public.is_admin());

grant select on public.catalog_items to anon, authenticated;
grant select, insert, update, delete on public.catalog_items to authenticated;

-- Optional dedicated views for clarity (read-only, empty until rows inserted)
create or replace view public.v_books as
  select id, payload, sort_at, owner_id, updated_at from public.catalog_items where kind = 'book';
create or replace view public.v_courses as
  select id, payload, sort_at, owner_id, updated_at from public.catalog_items where kind = 'course';
create or replace view public.v_labs as
  select id, payload, sort_at, owner_id, updated_at from public.catalog_items where kind in ('device', 'lab');
create or replace view public.v_consultations as
  select id, payload, sort_at, owner_id, updated_at from public.catalog_items where kind in ('doctor', 'consultation');
create or replace view public.v_ads as
  select id, payload, sort_at, owner_id, updated_at from public.catalog_items where kind = 'ad';

grant select on public.v_books, public.v_courses, public.v_labs, public.v_consultations, public.v_ads to anon, authenticated;
