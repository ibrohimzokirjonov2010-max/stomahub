-- 0065: Sotuvchi turi (yo‘nalishi). NOT applied automatically. 0064 dan keyin qo‘llanadi (forma ustuni kerak).
--   Tasdiqlangan sotuvchi BITTA yo‘nalish tanlaydi: stomatologik (Marketplace) | forma (Forma) | jihozlar (Jihozlar).
--   1) profiles.seller_type — null = hali tanlanmagan (kabinet bir marta tanlash oynasini ko‘rsatadi).
--      Mahsuloti bor eski sotuvchilar 'stomatologik' bo‘ladi — ular uchun hech narsa o‘zgarmaydi.
--   2) seller_products.jihoz jsonb — Jihozlar bo‘limi ma’lumoti (category = 'Stomatologik jihozlar'):
--        { cat: unit|cbct|scan|autoclave|micro|compressor|handpiece|lamp, model, year, warranty (oy),
--          city, install (bool) }  — Jihozlar bo‘limida faqat YANGI uskunalar (holat maydoni yo‘q).
--   3) seller_category_type(category) — kategoriya qaysi yo‘nalishga tegishli.
--   4) seller_products_type_gate — sotuvchi faqat o‘z yo‘nalishi kategoriyasida mahsulot qo‘sha oladi
--      (insert, kategoriya/egasi/holati o‘zgarganda). Admin va servis (auth.uid() null) — cheklovsiz.
--      Faqat zaxira/narx yangilanishi (masalan buyer_create_order) tekshirilmaydi.
--   5) seller_set_type(p_type) — tur tanlash/almashtirish. Boshqa yo‘nalishdagi faol (arxivlanmagan)
--      mahsulot bo‘lsa — rad etiladi. profiles.seller_type ni to‘g‘ridan-to‘g‘ri o‘zgartirib bo‘lmaydi.
--   6) market_products() — jihoz ustuni qo‘shiladi.
-- Takror ishga tushirish xavfsiz (idempotent). Mahsulot/buyurtma qatorlari o‘chirilmaydi.

alter table public.profiles add column if not exists seller_type text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_seller_type_check') then
    alter table public.profiles add constraint profiles_seller_type_check
      check (seller_type is null or seller_type in ('stomatologik', 'forma', 'jihozlar'));
  end if;
end $$;

-- 1) Mahsuloti bor sotuvchilar — avvalgidek Marketplace (stomatologik)
update public.profiles p set seller_type = 'stomatologik'
 where p.seller_type is null and exists (select 1 from public.seller_products sp where sp.seller_id = p.id);

-- 2) Jihoz ma’lumoti
alter table public.seller_products add column if not exists jihoz jsonb not null default '{}'::jsonb;

-- 3) Kategoriya → yo‘nalish
create or replace function public.seller_category_type(p_category text)
returns text language sql immutable set search_path = public as $$
  select case trim(coalesce(p_category, ''))
    when 'Tibbiy forma' then 'forma'
    when 'Stomatologik jihozlar' then 'jihozlar'
    else 'stomatologik' end;
$$;

-- 4) Mahsulot yo‘nalishi do‘kon turiga mos bo‘lishi shart
create or replace function public.seller_products_type_gate()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_type text; v_role text;
begin
  if auth.uid() is null then return new; end if;
  if tg_op = 'UPDATE' and new.category is not distinct from old.category
     and new.seller_id = old.seller_id and new.status is not distinct from old.status then
    return new;
  end if;
  if tg_op = 'UPDATE' and new.status = 'archived' and new.category is not distinct from old.category then return new; end if;
  if exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then return new; end if;
  select coalesce(seller_type, 'stomatologik'), role into v_type, v_role from public.profiles where id = new.seller_id;
  if v_role = 'admin' then return new; end if;
  if public.seller_category_type(new.category) <> coalesce(v_type, 'stomatologik') then
    raise exception 'Bu kategoriya do''koningiz yo''nalishiga mos emas (%)', case coalesce(v_type, 'stomatologik')
      when 'forma' then 'Tibbiy forma' when 'jihozlar' then 'Jihozlar' else 'Stomatologik mahsulotlar' end;
  end if;
  return new;
end $$;
drop trigger if exists seller_products_type_gate on public.seller_products;
create trigger seller_products_type_gate before insert or update on public.seller_products
  for each row execute function public.seller_products_type_gate();

-- 5) Turni faqat RPC orqali o‘zgartirish
create or replace function public.profiles_seller_type_guard()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.seller_type is distinct from old.seller_type
     and auth.uid() is not null
     and coalesce(current_setting('stomahub.seller_type_rpc', true), '') <> '1'
     and not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Do''kon yo''nalishini sozlamalar orqali o''zgartiring';
  end if;
  return new;
end $$;
drop trigger if exists profiles_seller_type_guard on public.profiles;
create trigger profiles_seller_type_guard before update of seller_type on public.profiles
  for each row execute function public.profiles_seller_type_guard();

create or replace function public.seller_set_type(p_type text)
returns text language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_role text; v_status text; v_n int;
begin
  if v_uid is null then raise exception 'Avval hisobingizga kiring'; end if;
  if p_type is null or p_type not in ('stomatologik', 'forma', 'jihozlar') then raise exception 'Yo''nalish noto''g''ri'; end if;
  select role, seller_status into v_role, v_status from public.profiles where id = v_uid;
  if coalesce(v_role, '') <> 'admin' and coalesce(v_status, '') <> 'approved' then
    raise exception 'Do''koningiz hali tasdiqlanmagan';
  end if;
  select count(*) into v_n from public.seller_products
   where seller_id = v_uid and status <> 'archived' and public.seller_category_type(category) <> p_type;
  if v_n > 0 then
    raise exception 'Avval boshqa yo''nalishdagi % ta mahsulotni arxivlang yoki o''chiring', v_n;
  end if;
  perform set_config('stomahub.seller_type_rpc', '1', true);
  update public.profiles set seller_type = p_type, updated_at = now() where id = v_uid;
  perform set_config('stomahub.seller_type_rpc', '', true);
  return p_type;
end $$;
revoke all on function public.seller_set_type(text) from public, anon;
grant execute on function public.seller_set_type(text) to authenticated;

-- 6) market_products (0064 nusxasi + jihoz)
drop function if exists public.market_products();
create function public.market_products()
returns table (id uuid, seller_id uuid, shop_name text, name text, sku text, category text, brand text,
  price numeric, stock integer, image_url text, images jsonb, variants jsonb, description text, unit text,
  created_at timestamptz, specs jsonb, country text, expires_on date, documents jsonb,
  clinical_use text, delivery_info text, reorder jsonb, variant_type text, uom text, min_qty integer,
  price_tiers jsonb, reg_cert_no text, lot_no text, storage_temp text, rx_only boolean, forma jsonb, jihoz jsonb)
language sql stable security definer set search_path = public as $$
  select p.id, p.seller_id, coalesce(nullif(pr.shop_name, ''), pr.name, 'Sotuvchi'), p.name, p.sku, p.category, p.brand,
         p.price, p.stock, p.image_url, p.images, p.variants, p.description, p.unit, p.created_at, p.specs,
         p.country, p.expires_on, p.documents,
         p.clinical_use, p.delivery_info, p.reorder, p.variant_type, p.uom, p.min_qty,
         p.price_tiers, p.reg_cert_no, p.lot_no, p.storage_temp,
         public.product_is_restricted(p.name, p.rx_only),
         coalesce(p.forma, '{}'::jsonb), coalesce(p.jihoz, '{}'::jsonb)
    from public.seller_products p join public.profiles pr on pr.id = p.seller_id
   where p.status = 'active' and not coalesce(p.is_test, false) and not coalesce(pr.is_test, false)
     and not coalesce(pr.blocked, false) and (pr.role = 'admin' or pr.seller_status = 'approved')
   order by p.created_at desc;
$$;
grant execute on function public.market_products() to anon, authenticated;

notify pgrst, 'reload schema';
