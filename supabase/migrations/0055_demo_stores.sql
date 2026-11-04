-- 0055: "Namuna" (demo) sahifalar — do'kon, seminar tashkilotchisi va kitob sotuvchisi uchun.
-- Xavfsizlik g'oyasi: demo ma'lumotlar ALOHIDA jadvallarda saqlanadi (seller_products / seminars /
-- catalog_items ga tushmaydi). Shuning uchun ular hech qanday ommaviy ro'yxat, Marketplace, qidiruv,
-- bosh sahifa bloki yoki sitemap'ga chiqmaydi va buyurtma/ro'yxatdan o'tish jadvallari ularga
-- havola qila olmaydi. anon/authenticated uchun to'g'ridan-to'g'ri SELECT yo'q — faqat aniq token
-- bilan security definer RPC orqali o'qiladi. Real akkauntga o'tkazish — faqat admin.

create extension if not exists pgcrypto;

create table if not exists public.demo_entities (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('shop', 'organizer', 'bookseller')),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,60}$'),
  name text not null check (length(trim(name)) > 0),
  is_demo boolean not null default true,
  demo_token text not null unique default encode(gen_random_bytes(18), 'hex'),
  description text,
  city text,
  address text,
  phone text,
  website text,
  telegram text,
  logo_url text,
  source_urls text[] not null default '{}',
  converted_to uuid references public.profiles (id) on delete set null,
  converted_at timestamptz,
  created_at timestamptz not null default now(),
  check (length(demo_token) >= 32)
);

create table if not exists public.demo_items (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.demo_entities (id) on delete cascade,
  kind text not null check (kind in ('product', 'seminar', 'book')),
  name text not null check (length(trim(name)) > 0),
  price numeric(14,0) check (price is null or price >= 0), -- NULL = manbada narx ko'rsatilmagan
  price_text text,           -- manbadagi narx aynan qanday yozilgan bo'lsa
  currency text,
  image_url text,
  description text,
  source_url text not null,
  extra jsonb not null default '{}'::jsonb, -- seminar: start_date, place, speaker...; kitob: author...
  sort_at integer not null default 0,
  converted_ref text,
  created_at timestamptz not null default now()
);
create index if not exists demo_items_entity_idx on public.demo_items (entity_id, sort_at);

create table if not exists public.demo_visits (
  id bigserial primary key,
  entity_id uuid not null references public.demo_entities (id) on delete cascade,
  src text,
  visited_at timestamptz not null default now()
);

alter table public.demo_entities enable row level security;
alter table public.demo_items    enable row level security;
alter table public.demo_visits   enable row level security;
revoke all on public.demo_entities, public.demo_items, public.demo_visits from anon, authenticated;

-- Faqat admin to'g'ridan-to'g'ri ko'radi/boshqaradi.
drop policy if exists demo_entities_admin on public.demo_entities;
create policy demo_entities_admin on public.demo_entities for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists demo_items_admin on public.demo_items;
create policy demo_items_admin on public.demo_items for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists demo_visits_admin on public.demo_visits;
create policy demo_visits_admin on public.demo_visits for select to authenticated using (public.is_admin());
grant select, insert, update, delete on public.demo_entities, public.demo_items to authenticated;
grant select on public.demo_visits to authenticated;

-- Ommaviy o'qish: faqat aniq token bo'yicha, faqat hali demo bo'lgan yozuv.
create or replace function public.get_demo(p_token text, p_src text default null)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare e public.demo_entities; res jsonb;
begin
  if p_token is null or length(p_token) < 32 then return null; end if;
  select * into e from public.demo_entities where demo_token = p_token and is_demo;
  if not found then return null; end if;
  insert into public.demo_visits (entity_id, src) values (e.id, left(nullif(p_src, ''), 60));
  select jsonb_build_object(
    'entity', jsonb_build_object('kind', e.kind, 'slug', e.slug, 'name', e.name, 'description', e.description,
       'city', e.city, 'address', e.address, 'phone', e.phone, 'website', e.website, 'telegram', e.telegram,
       'logo_url', e.logo_url, 'source_urls', to_jsonb(e.source_urls)),
    'items', coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'kind', i.kind, 'name', i.name,
       'price', i.price, 'price_text', i.price_text, 'currency', i.currency, 'image_url', i.image_url,
       'description', i.description, 'source_url', i.source_url, 'extra', i.extra) order by i.sort_at, i.created_at)
       from public.demo_items i where i.entity_id = e.id), '[]'::jsonb))
  into res;
  return res;
end $$;
revoke all on function public.get_demo(text, text) from public;
grant execute on function public.get_demo(text, text) to anon, authenticated;

-- Admin: demo'ni real akkauntga o'tkazish. Mahsulotlar seller_products ga 'draft' holatida,
-- seminarlar seminars ga published=false holatida ko'chadi; kitoblar avtomatik e'lon qilinmaydi.
-- Egasi o'zi tekshirib, keyin e'lon qiladi.
create or replace function public.admin_convert_demo(p_entity uuid, p_profile uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare e public.demo_entities; i public.demo_items; n integer := 0; new_id text;
begin
  if not public.is_admin() then raise exception 'Faqat administrator uchun'; end if;
  select * into e from public.demo_entities where id = p_entity and is_demo for update;
  if not found then raise exception 'Namuna topilmadi yoki allaqachon o‘tkazilgan'; end if;
  if not exists (select 1 from public.profiles where id = p_profile) then raise exception 'Akkaunt topilmadi'; end if;
  for i in select * from public.demo_items where entity_id = e.id order by sort_at loop
    if i.kind = 'product' then
      insert into public.seller_products (seller_id, name, price, image_url, description, status)
      values (p_profile, i.name, coalesce(i.price, 0), coalesce(i.image_url, ''), coalesce(i.description, ''), 'draft')
      returning id::text into new_id;
    elsif i.kind = 'seminar' then
      new_id := 'demo-' || replace(i.id::text, '-', '');
      insert into public.seminars (id, organizer_id, title, about, image, cover, start_date, place, status, published)
      values (new_id, p_profile, i.name, coalesce(i.description, ''), coalesce(i.image_url, ''), coalesce(i.image_url, ''),
              coalesce(i.extra->>'start_date', ''), coalesce(i.extra->>'place', ''), 'qoralama', false);
    else
      -- Kitoblar katalogida "qoralama" holati yo'q (catalog_items darhol ommaviy) — shuning uchun
      -- avtomatik e'lon qilinmaydi; egasi kabinetdan o'zi qo'shadi. Ma'lumot demo_items da qoladi.
      continue;
    end if;
    update public.demo_items set converted_ref = new_id where id = i.id;
    n := n + 1;
  end loop;
  update public.demo_entities set is_demo = false, converted_to = p_profile, converted_at = now(),
         demo_token = encode(gen_random_bytes(18), 'hex') where id = e.id; -- eski havola ishlamay qoladi
  return n;
end $$;
revoke all on function public.admin_convert_demo(uuid, uuid) from public, anon;
grant execute on function public.admin_convert_demo(uuid, uuid) to authenticated;
