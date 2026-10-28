-- 0022: protected book PDFs.
-- Full PDFs live in the PRIVATE bucket `book-files` at <book_id>/<file>.pdf.
-- Only users in book_access for that book (or the book's owner / an admin) can
-- read them, via short-lived signed URLs. Free previews (first pages) are
-- uploaded to the public `catalog` bucket by the seed script.

insert into storage.buckets (id, name, public)
values ('book-files', 'book-files', false)
on conflict (id) do update set public = false;

create table if not exists public.book_access (
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id text not null,
  source text not null default 'purchase' check (source in ('purchase', 'manual', 'gift')),
  order_id uuid,
  granted_by uuid references auth.users (id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, book_id)
);
create index if not exists book_access_book_idx on public.book_access (book_id);
alter table public.book_access enable row level security;

create or replace function public.is_book_manager(p_book text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
      or exists (select 1 from public.catalog_items where kind = 'book' and id = p_book and owner_id = auth.uid())
$$;
revoke all on function public.is_book_manager(text) from public, anon;
grant execute on function public.is_book_manager(text) to authenticated;

-- Buyers see their own rows; the book owner / admin sees and manages all rows of their book.
drop policy if exists book_access_read on public.book_access;
create policy book_access_read on public.book_access for select to authenticated
  using (user_id = auth.uid() or public.is_book_manager(book_id));
drop policy if exists book_access_manage on public.book_access;
create policy book_access_manage on public.book_access for all to authenticated
  using (public.is_book_manager(book_id)) with check (public.is_book_manager(book_id));
grant select, insert, update, delete on public.book_access to authenticated;

-- Storage: read only with access (signed URLs are created through this policy).
drop policy if exists book_files_read on storage.objects;
create policy book_files_read on storage.objects for select to authenticated
  using (
    bucket_id = 'book-files' and (
      exists (select 1 from public.book_access a where a.user_id = auth.uid() and a.book_id = (storage.foldername(name))[1])
      or public.is_book_manager((storage.foldername(name))[1])
    )
  );
drop policy if exists book_files_manage on storage.objects;
create policy book_files_manage on storage.objects for all to authenticated
  using (bucket_id = 'book-files' and public.is_book_manager((storage.foldername(name))[1]))
  with check (bucket_id = 'book-files' and public.is_book_manager((storage.foldername(name))[1]));

-- Small helper for the UI: does the current user own this book's PDF?
create or replace function public.my_book_access(p_book text)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (
    exists (select 1 from public.book_access where user_id = auth.uid() and book_id = p_book)
    or public.is_book_manager(p_book))
$$;
revoke all on function public.my_book_access(text) from public;
grant execute on function public.my_book_access(text) to anon, authenticated;
