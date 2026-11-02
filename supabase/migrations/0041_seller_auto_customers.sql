-- 0041: marketplace xaridorlari sotuvchining "Mijozlar" bo'limiga avtomatik tushadi.
-- Sotuvchi faqat O'ZIGA berilgan buyurtmalardagi ma'lumotni (ism, telefon, shahar/manzil) ko'radi.
-- Profil, boshqa sotuvchilardagi xaridlar, seminarlar va h.k. hech qachon nusxalanmaydi.
-- Escrow / to'lov logikasiga tegilmaydi. Qayta ishga tushirish xavfsiz (idempotent).

-- 1. ustunlar --------------------------------------------------------------------
alter table public.seller_customers add column if not exists buyer_id uuid references public.profiles (id) on delete set null;
alter table public.seller_customers add column if not exists source text not null default 'manual';
alter table public.seller_customers drop constraint if exists seller_customers_source_check;
alter table public.seller_customers add constraint seller_customers_source_check check (source in ('manual', 'marketplace'));
alter table public.seller_customers add column if not exists hidden boolean not null default false;
create unique index if not exists seller_customers_seller_buyer_uq
  on public.seller_customers (seller_id, buyer_id) where buyer_id is not null;
-- 0004 da qo'shilgan, lekin xavfsizlik uchun:
alter table public.seller_orders add column if not exists customer_id uuid references public.seller_customers (id) on delete set null;
create index if not exists seller_orders_customer_idx on public.seller_orders (customer_id);

-- 2. yordamchi: telefonni solishtirish uchun oxirgi 9 raqam ------------------------
create or replace function public.phone9(p text) returns text
language sql immutable set search_path = public as $$
  select nullif(right(regexp_replace(coalesce(p, ''), '\D', '', 'g'), 9), '')
$$;

-- 3. bog'lovchi: (seller, buyer) uchun mijoz qatorini topadi/yaratadi -------------
create or replace function public.seller_customer_link(
  p_seller uuid, p_buyer uuid, p_name text, p_phone text, p_city text, p_address text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_p9 text := public.phone9(p_phone);
begin
  if p_seller is null or p_buyer is null then return null; end if;

  select id into v_id from public.seller_customers where seller_id = p_seller and buyer_id = p_buyer;

  -- sotuvchi shu xaridorni avval qo'lda kiritgan bo'lsa (bir xil telefon) — o'sha qatorni bog'laymiz
  if v_id is null and v_p9 is not null then
    select id into v_id from public.seller_customers
     where seller_id = p_seller and buyer_id is null and public.phone9(phone) = v_p9
     order by created_at limit 1 for update;
    if v_id is not null then
      update public.seller_customers
         set buyer_id = p_buyer, hidden = false,
             city = case when city = '' then coalesce(p_city, '') else city end,
             address = case when address = '' then coalesce(p_address, '') else address end
       where id = v_id;
      return v_id;  -- qo'lda kiritilgan nom/izohlar saqlanadi (source = 'manual')
    end if;
  end if;

  insert into public.seller_customers (seller_id, buyer_id, source, name, phone, city, address)
  values (p_seller, p_buyer, 'marketplace',
          coalesce(nullif(trim(p_name), ''), 'Xaridor'), coalesce(p_phone, ''), coalesce(p_city, ''), coalesce(p_address, ''))
  on conflict (seller_id, buyer_id) where buyer_id is not null do update
    set hidden = false,
        -- marketplace mijozida kontakt oxirgi buyurtmadan olinadi
        name    = case when seller_customers.source = 'marketplace' then excluded.name  else seller_customers.name  end,
        phone   = case when seller_customers.source = 'marketplace' and excluded.phone <> '' then excluded.phone else seller_customers.phone end,
        city    = case when excluded.city <> '' then excluded.city else seller_customers.city end,
        address = case when seller_customers.source = 'marketplace' and excluded.address <> '' then excluded.address else seller_customers.address end
  returning id into v_id;
  return v_id;
end $$;
revoke all on function public.seller_customer_link(uuid, uuid, text, text, text, text) from public, anon, authenticated;

-- 4. trigger: marketplace buyurtma (buyer_create_order) yaratilganda -----------------
create or replace function public.seller_orders_auto_customer() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.buyer_id is not null and new.customer_id is null then
    new.customer_id := public.seller_customer_link(new.seller_id, new.buyer_id, new.customer_name, new.customer_phone,
      new.city, case when new.delivery_method = 'kuryer' then new.address else '' end);
  end if;
  return new;
end $$;
revoke all on function public.seller_orders_auto_customer() from public, anon, authenticated;
drop trigger if exists seller_orders_auto_customer on public.seller_orders;
create trigger seller_orders_auto_customer before insert on public.seller_orders
  for each row execute function public.seller_orders_auto_customer();

-- 5. marketplace mijozini o'chirish taqiqlanadi (keyingi buyurtmada qayta paydo bo'lardi) — yashiriladi
create or replace function public.seller_customers_guard_delete() returns trigger
language plpgsql set search_path = public as $$
begin
  if old.source = 'marketplace' and exists (select 1 from public.seller_orders o where o.customer_id = old.id) then
    raise exception 'Marketplace mijozini o‘chirib bo‘lmaydi — uni yashiring';
  end if;
  return old;
end $$;
drop trigger if exists seller_customers_guard_delete on public.seller_customers;
create trigger seller_customers_guard_delete before delete on public.seller_customers
  for each row execute function public.seller_customers_guard_delete();

-- marketplace mijozida ism/telefon/xaridor bog'lanishini sotuvchi o'zgartira olmaydi
create or replace function public.seller_customers_guard_update() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') then
    if new.buyer_id is distinct from old.buyer_id or new.source is distinct from old.source or new.seller_id <> old.seller_id then
      raise exception 'Bu maydonlarni o‘zgartirib bo‘lmaydi';
    end if;
    if old.source = 'marketplace' and (new.name <> old.name or new.phone <> old.phone) then
      raise exception 'Marketplace mijozining ismi va telefoni buyurtmalardan olinadi';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists seller_customers_guard_update on public.seller_customers;
create trigger seller_customers_guard_update before update on public.seller_customers
  for each row execute function public.seller_customers_guard_update();

-- sotuvchi qo'lda qo'shganda buyer_id/source ni soxtalashtira olmaydi
create or replace function public.seller_customers_guard_insert() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') then new.buyer_id := null; new.source := 'manual'; end if;
  return new;
end $$;
drop trigger if exists seller_customers_guard_insert on public.seller_customers;
create trigger seller_customers_guard_insert before insert on public.seller_customers
  for each row execute function public.seller_customers_guard_insert();

-- RLS o'zgarmaydi: seller_customers_own_read / _own_write (seller_id = auth.uid()).
-- Xaridor boshqa sotuvchining mijozlar jadvaliga yoza olmaydi (with check seller_id = auth.uid() and is_seller()).

-- 6. backfill (idempotent): mavjud marketplace buyurtmalari, eng eskisidan boshlab --
do $$
declare r record;
begin
  for r in select id, seller_id, buyer_id, customer_name, customer_phone, city, address, delivery_method
             from public.seller_orders
            where buyer_id is not null and customer_id is null
            order by created_at
  loop
    update public.seller_orders
       set customer_id = public.seller_customer_link(r.seller_id, r.buyer_id, r.customer_name, r.customer_phone,
             r.city, case when r.delivery_method = 'kuryer' then r.address else '' end)
     where id = r.id;
  end loop;
end $$;
