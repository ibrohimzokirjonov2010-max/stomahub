-- 0052: Hamjamiyat — yagona umumiy postlar jadvali.
-- Muammo: sayt postlarni har bir foydalanuvchining shaxsiy user_blobs('community') yozuvidan
-- (kompyuterda esa umuman saqlamasdan) o‘qirdi, admin esa catalog_items(kind='post') ni ko‘rardi.
-- Endi barcha postlar, izohlar va shikoyatlar shu jadvallarda; sayt ham, admin ham shu yerdan o‘qiydi.
-- Muallif ismi/rasmi saqlanmaydi — o‘qish paytida profiles dan (full_name, avatar) olinadi.
-- Eski ma'lumotlar NUSXA qilinadi (user_blobs va catalog_items o‘zgarmaydi, o‘chirilmaydi).

create table if not exists public.community_posts (
  id text primary key default gen_random_uuid()::text,
  author_id uuid references public.profiles (id) on delete cascade,
  author_fallback jsonb not null default '{}'::jsonb,       -- faqat profilsiz eski/namunaviy postlar uchun
  kind text not null default 'case' check (kind in ('case', 'savol', 'muhokama', 'maslahat', 'yangilik')),
  topic text not null default '',
  title text not null check (length(trim(title)) between 3 and 200),
  body text not null check (length(trim(body)) between 1 and 10000),
  images jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  meta jsonb not null default '{}'::jsonb,
  consent boolean not null default false,
  hidden boolean not null default false,
  hidden_reason text not null default '',
  legacy_source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  edited_at timestamptz,
  -- rasmli klinik keys bemor roziligisiz e'lon qilinmaydi
  constraint community_posts_consent_chk check (consent or kind <> 'case' or jsonb_array_length(images) = 0 or legacy_source is not null)
);
create index if not exists community_posts_created_idx on public.community_posts (created_at desc);
create index if not exists community_posts_author_idx on public.community_posts (author_id);

create table if not exists public.community_comments (
  id text primary key default gen_random_uuid()::text,
  post_id text not null references public.community_posts (id) on delete cascade,
  parent_id text references public.community_comments (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete cascade,
  author_fallback jsonb not null default '{}'::jsonb,
  text text not null default '',
  image text,
  created_at timestamptz not null default now(),
  constraint community_comments_nonempty check (length(trim(text)) > 0 or image is not null)
);
create index if not exists community_comments_post_idx on public.community_comments (post_id, created_at);

create table if not exists public.community_reports (
  id bigserial primary key,
  post_id text not null references public.community_posts (id) on delete cascade,
  reporter_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  reason text not null default '',
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (post_id, reporter_id)
);
create index if not exists community_reports_open_idx on public.community_reports (post_id) where not resolved;

alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_reports enable row level security;

-- Postlar: hamma ko‘rinadiganini o‘qiydi; muallif o‘zinikini; admin hammasini.
drop policy if exists community_posts_read on public.community_posts;
create policy community_posts_read on public.community_posts for select to anon, authenticated
  using (not hidden or author_id = auth.uid() or public.is_admin());
drop policy if exists community_posts_insert on public.community_posts;
create policy community_posts_insert on public.community_posts for insert to authenticated
  with check (author_id = auth.uid() and not hidden and legacy_source is null);
drop policy if exists community_posts_update on public.community_posts;
create policy community_posts_update on public.community_posts for update to authenticated
  using (author_id = auth.uid() or public.is_admin()) with check (author_id = auth.uid() or public.is_admin());
drop policy if exists community_posts_delete on public.community_posts;
create policy community_posts_delete on public.community_posts for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

-- Muallif yashirish holatini, muallifni va manbani o‘zgartira olmaydi (faqat admin).
create or replace function public.community_posts_guard() returns trigger language plpgsql as $$
begin
  if not public.is_admin() then
    new.hidden := old.hidden; new.hidden_reason := old.hidden_reason;
    new.author_id := old.author_id; new.legacy_source := old.legacy_source; new.created_at := old.created_at;
    if new.title is distinct from old.title or new.body is distinct from old.body or new.images is distinct from old.images then
      new.edited_at := now();
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists community_posts_guard on public.community_posts;
create trigger community_posts_guard before update on public.community_posts for each row execute function public.community_posts_guard();

drop policy if exists community_comments_read on public.community_comments;
create policy community_comments_read on public.community_comments for select to anon, authenticated
  using (exists (select 1 from public.community_posts p where p.id = post_id));   -- post RLS qo‘llanadi
drop policy if exists community_comments_insert on public.community_comments;
create policy community_comments_insert on public.community_comments for insert to authenticated
  with check (author_id = auth.uid() and exists (select 1 from public.community_posts p where p.id = post_id and not p.hidden));
drop policy if exists community_comments_delete on public.community_comments;
create policy community_comments_delete on public.community_comments for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

drop policy if exists community_reports_insert on public.community_reports;
create policy community_reports_insert on public.community_reports for insert to authenticated
  with check (reporter_id = auth.uid() and not resolved
              and exists (select 1 from public.community_posts p where p.id = post_id and p.author_id is distinct from auth.uid()));
drop policy if exists community_reports_read on public.community_reports;
create policy community_reports_read on public.community_reports for select to authenticated
  using (reporter_id = auth.uid() or public.is_admin());
drop policy if exists community_reports_admin on public.community_reports;
create policy community_reports_admin on public.community_reports for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select on public.community_posts, public.community_comments to anon, authenticated;
grant insert, update, delete on public.community_posts, public.community_comments to authenticated;
grant select, insert, update on public.community_reports to authenticated;
grant usage on sequence public.community_reports_id_seq to authenticated;

-- Muallif: har doim joriy profildan (to‘liq ism + rasm).
create or replace function public.community_author(p_id uuid, p_fallback jsonb)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', p_id,
    'name', coalesce(nullif(trim(pr.full_name), ''), nullif(trim(pr.name), ''), nullif(p_fallback->>'name', ''), 'Foydalanuvchi'),
    'avatar', coalesce(nullif(pr.avatar, ''), nullif(p_fallback->>'avatar', ''), ''),
    'role', coalesce(nullif(pr.specialty, ''), nullif(p_fallback->>'role', ''), 'Stomatolog'))
  from (select 1) one left join public.profiles pr on pr.id = p_id;
$$;
grant execute on function public.community_author(uuid, jsonb) to anon, authenticated;

-- Lenta: ko‘rinadigan postlar + izohlar, mualliflar jonli profildan.
create or replace function public.community_feed(p_limit int default 200)
returns jsonb language sql stable security invoker set search_path = public as $$
  select coalesce(jsonb_agg(x order by (x->>'created_at') desc), '[]'::jsonb) from (
    select jsonb_build_object(
      'id', p.id, 'kind', p.kind, 'topic', p.topic, 'title', p.title, 'body', p.body, 'images', p.images, 'tags', p.tags,
      'meta', p.meta, 'consent', p.consent, 'hidden', p.hidden, 'created_at', p.created_at, 'edited_at', p.edited_at,
      'author', public.community_author(p.author_id, p.author_fallback),
      'mine', p.author_id is not null and p.author_id = auth.uid(),
      'comments', coalesce((select jsonb_agg(jsonb_build_object(
          'id', c.id, 'parent_id', c.parent_id, 'text', c.text, 'image', c.image, 'created_at', c.created_at,
          'author', public.community_author(c.author_id, c.author_fallback),
          'mine', c.author_id is not null and c.author_id = auth.uid()) order by c.created_at)
        from public.community_comments c where c.post_id = p.id), '[]'::jsonb)) x
    from public.community_posts p
    order by p.created_at desc
    limit least(500, greatest(1, coalesce(p_limit, 200)))
  ) q;
$$;
grant execute on function public.community_feed(int) to anon, authenticated;

-- Admin: Kontent moderatsiyasi → Hamjamiyat postlari endi community_posts dan o‘qiydi.
do $$ begin
  if not exists (select 1 from pg_proc where proname = 'admin_content_list_base') then
    alter function public.admin_content_list(text, text, int, int) rename to admin_content_list_base;
  end if;
  if not exists (select 1 from pg_proc where proname = 'admin_content_moderate_base') then
    alter function public.admin_content_moderate(text, text, text, text) rename to admin_content_moderate_base;
  end if;
end $$;
revoke execute on function public.admin_content_list_base(text, text, int, int) from public, anon;
revoke execute on function public.admin_content_moderate_base(text, text, text, text) from public, anon;

create or replace function public.admin_content_list(p_kind text, p_q text default '', p_page int default 1, p_page_size int default 20)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_size int := least(50, greatest(1, coalesce(p_page_size, 20)));
  v_off int := (greatest(1, coalesce(p_page, 1)) - 1) * v_size;
  v_q text := lower(trim(coalesce(p_q, '')));
  v_reported boolean := p_kind = 'post_reported';
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  if p_kind not in ('post', 'post_reported') then return public.admin_content_list_base(p_kind, p_q, p_page, p_page_size); end if;
  return (
    with base as (
      select p.*, public.community_author(p.author_id, p.author_fallback) a,
             (select count(*) from public.community_reports r where r.post_id = p.id and not r.resolved) rc
        from public.community_posts p
    ), f as (
      select * from base where (not v_reported or rc > 0)
        and (v_q = '' or lower(title || ' ' || body || ' ' || (a->>'name')) like '%'||v_q||'%')
    )
    select jsonb_build_object(
      'total', (select count(*) from f),
      'open_reports', (select count(*) from public.community_reports where not resolved),
      'rows', coalesce((select jsonb_agg(x) from (
        select jsonb_build_object('kind', 'post', 'id', id, 'title', title, 'body', left(body, 300), 'images', images,
               'owner', a->>'name', 'owner_avatar', a->>'avatar', 'hidden', hidden, 'hidden_reason', hidden_reason,
               'report_count', rc,
               'reports', (select coalesce(jsonb_agg(jsonb_build_object('reason', r.reason, 'at', r.created_at,
                              'by', public.community_author(r.reporter_id, '{}'::jsonb)->>'name') order by r.created_at desc), '[]'::jsonb)
                             from public.community_reports r where r.post_id = f.id and not r.resolved),
               'at', created_at) x
          from f order by rc desc, created_at desc limit v_size offset v_off) q), '[]'::jsonb)));
end $$;
grant execute on function public.admin_content_list(text, text, int, int) to authenticated;

create or replace function public.admin_content_moderate(p_kind text, p_id text, p_action text, p_reason text default '')
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  if p_kind not in ('post', 'post_reported') then return public.admin_content_moderate_base(p_kind, p_id, p_action, p_reason); end if;
  if p_action not in ('hide', 'unhide', 'delete', 'dismiss') then raise exception 'Noma’lum amal'; end if;
  if p_action in ('hide', 'delete') and length(trim(coalesce(p_reason, ''))) < 3 then raise exception 'Sababini yozing'; end if;
  if not exists (select 1 from public.community_posts where id = p_id) then raise exception 'Post topilmadi'; end if;
  if p_action = 'delete' then
    delete from public.community_posts where id = p_id;
  elsif p_action = 'dismiss' then
    update public.community_reports set resolved = true where post_id = p_id and not resolved;
  else
    update public.community_posts set hidden = (p_action = 'hide'),
           hidden_reason = case when p_action = 'hide' then trim(p_reason) else '' end where id = p_id;
    if p_action = 'hide' then update public.community_reports set resolved = true where post_id = p_id and not resolved; end if;
  end if;
  return jsonb_build_object('ok', true);
end $$;
grant execute on function public.admin_content_moderate(text, text, text, text) to authenticated;

create or replace function public.admin_community_open_reports()
returns int language sql stable security definer set search_path = public as $$
  select case when public.is_admin() then (select count(distinct post_id)::int from public.community_reports where not resolved) else 0 end;
$$;
grant execute on function public.admin_community_open_reports() to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Ko‘chirish (nusxa, buzmaydi). Takror ishga tushirilsa ham xavfsiz (on conflict do nothing).
create or replace function pg_temp.c_kind(k text) returns text language sql immutable as $$
  select case lower(coalesce(k, '')) when 'keys' then 'case' when 'case' then 'case' when 'savol' then 'savol'
    when 'muhokama' then 'muhokama' when 'maslahat' then 'maslahat' when 'yangilik' then 'yangilik' else 'case' end;
$$;
create or replace function pg_temp.c_ts(id text, fb timestamptz) returns timestamptz language sql immutable as $$
  select coalesce((select to_timestamp(m[1]::bigint / 1000.0) from regexp_match(coalesce(id, ''), '(1[5-9]\d{11})') m), fb);
$$;

-- 1) Foydalanuvchilarning shaxsiy bloblaridagi o‘z postlari (muallif = blob egasi).
insert into public.community_posts (id, author_id, kind, topic, title, body, images, tags, consent, legacy_source, created_at)
select 'u-' || b.user_id::text || '-' || (p->>'id'),
       b.user_id, pg_temp.c_kind(p->>'kind'), coalesce(p->>'topic', ''),
       left(coalesce(nullif(trim(p->>'title'), ''), 'Post'), 200),
       coalesce(nullif(trim(p->>'body'), ''), coalesce(nullif(trim(p->>'title'), ''), '—')),
       case when jsonb_typeof(p->'images') = 'array' then p->'images' else '[]'::jsonb end,
       case when jsonb_typeof(p->'tags') = 'array' then p->'tags' else '[]'::jsonb end,
       true, 'user_blobs', pg_temp.c_ts(p->>'id', b.updated_at)
  from public.user_blobs b
  cross join lateral jsonb_array_elements(case when jsonb_typeof(b.payload->'posts') = 'array' then b.payload->'posts' else '[]'::jsonb end) p
 where b.kind = 'community' and p ? 'id'
   and coalesce((p->>'mine')::boolean, true)
   and length(trim(coalesce(p->>'title', ''))) >= 3
   and exists (select 1 from public.profiles pr where pr.id = b.user_id)
on conflict (id) do nothing;

-- Shu postlardagi izohlar (o‘zi yozgan -> blob egasi; boshqalari -> eski ism sifatida)
insert into public.community_comments (id, post_id, parent_id, author_id, author_fallback, text, image, created_at)
select 'u-' || b.user_id::text || '-' || (c->>'id'), 'u-' || b.user_id::text || '-' || (p->>'id'), null,
       case when coalesce((c->>'mine')::boolean, false) then b.user_id end,
       case when coalesce((c->>'mine')::boolean, false) then '{}'::jsonb else jsonb_build_object('name', c->>'name', 'avatar', c->>'avatar') end,
       coalesce(c->>'text', ''), nullif(c->>'image', ''), pg_temp.c_ts(c->>'id', b.updated_at)
  from public.user_blobs b
  cross join lateral jsonb_array_elements(case when jsonb_typeof(b.payload->'posts') = 'array' then b.payload->'posts' else '[]'::jsonb end) p
  cross join lateral jsonb_array_elements(case when jsonb_typeof(p->'comments') = 'array' then p->'comments' else '[]'::jsonb end) c
 where b.kind = 'community' and c ? 'id'
   and exists (select 1 from public.community_posts cp where cp.id = 'u-' || b.user_id::text || '-' || (p->>'id'))
   and (length(trim(coalesce(c->>'text', ''))) > 0 or nullif(c->>'image', '') is not null)
on conflict (id) do nothing;

-- 2) Admin ko‘rgan catalog_items(kind='post') namunalari — yashirish holati saqlanadi.
insert into public.community_posts (id, author_id, author_fallback, kind, topic, title, body, images, tags, consent, hidden, hidden_reason, legacy_source, created_at)
select 'cat-' || c.id,
       (select pr.id from public.profiles pr where pr.id = c.owner_id),
       case jsonb_typeof(c.payload->'author') when 'object' then c.payload->'author'
            when 'string' then jsonb_build_object('name', c.payload->>'author', 'avatar', c.payload->>'avatar', 'role', c.payload->>'role')
            else '{}'::jsonb end,
       pg_temp.c_kind(c.payload->>'kind'), coalesce(c.payload->>'topic', ''),
       left(coalesce(nullif(trim(c.payload->>'title'), ''), 'Post'), 200),
       coalesce(nullif(trim(c.payload->>'body'), ''), nullif(trim(c.payload->>'text'), ''), coalesce(nullif(trim(c.payload->>'title'), ''), '—')),
       case when jsonb_typeof(c.payload->'images') = 'array' then c.payload->'images' else '[]'::jsonb end,
       case when jsonb_typeof(c.payload->'tags') = 'array' then c.payload->'tags' else '[]'::jsonb end,
       true, c.hidden, coalesce(c.hidden_reason, ''), 'catalog_items', c.updated_at
  from public.catalog_items c
 where c.kind = 'post'
on conflict (id) do nothing;
