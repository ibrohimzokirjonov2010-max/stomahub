-- 0068: Sotuvchi aksiyalari — to‘liq boshqaruv (yaratish / tahrirlash / to‘xtatish / o‘chirish). NOT applied automatically.
--   0047 dagi seller_promotions jadvali qayta ishlatiladi (yangi jadval yo‘q, qatorlar o‘chirilmaydi):
--   1) Yangi ustunlar: title, banner_url, scope ('product' — bitta mahsulot, 'all' — barcha mahsulotlar),
--      percent (foiz). product_id / old_price / price endi 'all' uchun bo‘sh bo‘lishi mumkin.
--   2) seller_promotions_guard (BEFORE): sotuvchini almashtirib bo‘lmaydi; sarlavha tozalanadi (<, >, boshqaruv
--      belgilari), banner faqat https://; mahsulot sotuvchiniki bo‘lishi shart; old_price serverda mahsulot
--      narxidan olinadi (soxta «eski narx» qo‘yib bo‘lmaydi); foiz 1–90; sana tekshiruvi (≤ 365 kun).
--      Shu mahsulotning muddati o‘tgan faol aksiyasi avtomatik o‘chiriladi (yangisini qo‘shishga to‘sqinlik qilmaydi).
--   3) DELETE ruxsati (RLS: faqat o‘z aksiyasi — 0047 dagi seller_promotions_own).
--   4) seller_promotion_sync — catalog_items 'deal' ga sarlavha/banner/scope bilan; 'all' aksiya ham chiqadi.
--   5) seller_discount_price — buyurtma narxiga faol aksiya ham qo‘llanadi (chegirma bilan qaysi arzon bo‘lsa).
--      Shunda saytda ko‘rsatilgan aksiya narxi buyurtmada ham aynan shu bo‘ladi.
--   Muddati o‘tgan aksiyalar saytda ko‘rinmaydi (ilova sana bo‘yicha filtrlaydi; narx esa serverda sana bilan).
-- Takror ishga tushirish xavfsiz (idempotent).

-- 1) Ustunlar ---------------------------------------------------------------------------------------
alter table public.seller_promotions add column if not exists title text not null default '';
alter table public.seller_promotions add column if not exists banner_url text not null default '';
alter table public.seller_promotions add column if not exists scope text not null default 'product';
alter table public.seller_promotions add column if not exists percent integer;
alter table public.seller_promotions alter column product_id drop not null;
alter table public.seller_promotions alter column old_price drop not null;
alter table public.seller_promotions alter column price drop not null;

alter table public.seller_promotions drop constraint if exists seller_promotions_price_lt;
alter table public.seller_promotions add constraint seller_promotions_price_lt
  check (scope = 'all' or (price > 0 and old_price > 0 and price < old_price));
alter table public.seller_promotions drop constraint if exists seller_promotions_scope_chk;
alter table public.seller_promotions add constraint seller_promotions_scope_chk
  check ((scope = 'product' and product_id is not null) or (scope = 'all' and percent between 1 and 90));
alter table public.seller_promotions drop constraint if exists seller_promotions_percent_chk;
alter table public.seller_promotions add constraint seller_promotions_percent_chk
  check (percent is null or percent between 1 and 90);

-- 2) Tekshiruv trigger’i --------------------------------------------------------------------------
create or replace function public.seller_promotions_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  p public.seller_products;
  v_today date := public.tashkent_today();
  v_url text;
begin
  -- egasi: insertda — o‘zi, updateda — o‘zgarmaydi (admin bundan mustasno)
  if not coalesce(public.is_admin(), false) then
    if tg_op = 'INSERT' then
      if auth.uid() is null then raise exception 'Aksiya qo‘shish uchun hisobingizga kiring'; end if;
      new.seller_id := auth.uid();
    else
      new.seller_id := old.seller_id;
    end if;
  end if;

  new.title := left(trim(regexp_replace(regexp_replace(coalesce(new.title, ''), '[[:cntrl:]<>]', ' ', 'g'), '\s+', ' ', 'g')), 80);
  v_url := trim(coalesce(new.banner_url, ''));
  if v_url <> '' and (length(v_url) > 500 or v_url !~ '^https://[^[:space:]"''<>\\`]+$') then
    raise exception 'Banner havolasi https:// bilan boshlanishi kerak';
  end if;
  new.banner_url := v_url;
  new.scope := coalesce(nullif(new.scope, ''), 'product');
  if new.scope not in ('product', 'all') then raise exception 'Aksiya turi noto‘g‘ri'; end if;
  if new.percent is not null and (new.percent < 1 or new.percent > 90) then
    raise exception 'Chegirma 1%% dan 90%% gacha bo‘lsin';
  end if;

  if new.scope = 'all' then
    if new.percent is null then raise exception 'Chegirma foizini kiriting'; end if;
    if new.title = '' then raise exception 'Aksiya nomini kiriting'; end if;
    new.product_id := null; new.price := null; new.old_price := null;
  else
    if new.product_id is null then raise exception 'Mahsulotni tanlang'; end if;
    select * into p from public.seller_products where id = new.product_id and seller_id = new.seller_id;
    if not found then raise exception 'Mahsulot topilmadi'; end if;
    if tg_op = 'INSERT' or new.product_id is distinct from old.product_id
       or new.percent is distinct from old.percent or new.price is distinct from old.price then
      if coalesce(p.price, 0) <= 0 then raise exception 'Mahsulot narxi kiritilmagan'; end if;
      new.old_price := p.price;   -- eski narx — mahsulotning haqiqiy narxi
      if new.percent is not null then
        new.price := round(p.price * (1 - new.percent::numeric / 100));
      end if;
      if new.price is null or new.price <= 0 or new.price >= new.old_price then
        raise exception 'Aksiya narxi hozirgi narxdan (% so‘m) past bo‘lsin', p.price;
      end if;
    end if;
  end if;

  if new.ends_on is null then raise exception 'Tugash sanasini kiriting'; end if;
  new.starts_on := coalesce(new.starts_on, v_today);
  if new.ends_on < new.starts_on then raise exception 'Tugash sanasi boshlanishdan oldin bo‘lmasin'; end if;
  if new.ends_on > new.starts_on + 365 then raise exception 'Aksiya muddati 1 yildan oshmasin'; end if;
  if (tg_op = 'INSERT' or new.ends_on is distinct from old.ends_on) and new.ends_on < v_today then
    raise exception 'Tugash sanasi o‘tgan kun bo‘lmasin';
  end if;
  new.updated_at := now();

  -- Shu mahsulotning muddati o‘tgan «faol» aksiyasi yangisiga to‘sqinlik qilmasin
  if new.active and new.scope = 'product' then
    update public.seller_promotions set active = false
     where product_id = new.product_id and id <> new.id and active and ends_on < v_today;
  end if;
  return new;
end $$;
revoke all on function public.seller_promotions_guard() from public, anon, authenticated;

drop trigger if exists seller_promotions_a_guard on public.seller_promotions;
create trigger seller_promotions_a_guard before insert or update on public.seller_promotions
  for each row execute function public.seller_promotions_guard();

-- 3) RLS: faqat o‘z aksiyasi; mahsulotli aksiya — faqat o‘z mahsuloti; 'all' — mahsulotsiz. O‘chirish ruxsati.
drop policy if exists seller_promotions_own on public.seller_promotions;
create policy seller_promotions_own on public.seller_promotions
  for all to authenticated
  using (seller_id = auth.uid())
  with check (seller_id = auth.uid()
    and (product_id is null
         or exists (select 1 from public.seller_products p where p.id = product_id and p.seller_id = auth.uid())));
grant select, insert, update, delete on public.seller_promotions to authenticated;

-- 4) Public katalogga sinxronlash ----------------------------------------------------------------------
create or replace function public.seller_promotion_sync()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  r public.seller_promotions;
  p public.seller_products;
  v_shop text;
  v_id text;
  v_title text;
begin
  r := coalesce(new, old);
  v_id := 'sp-' || r.id::text;
  if r.scope = 'product' or r.scope is null then
    select * into p from public.seller_products where id = r.product_id;
  end if;
  if tg_op = 'DELETE' or not r.active or r.ends_on < public.tashkent_today()
     or (coalesce(r.scope, 'product') = 'product' and (p.id is null or p.status <> 'active')) then
    delete from public.catalog_items where kind = 'deal' and id = v_id and owner_id = r.seller_id;
    return coalesce(new, old);
  end if;
  select coalesce(nullif(shop_name, ''), nullif(name, ''), 'Sotuvchi') into v_shop from public.profiles where id = r.seller_id;
  v_title := nullif(r.title, '');
  if r.scope = 'all' then
    insert into public.catalog_items (kind, id, payload, sort_at, owner_id)
    values ('deal', v_id, jsonb_build_object(
        'id', v_id, 'scope', 'all', 'title', v_title, 'name', coalesce(v_title, 'Aksiya'), 'banner', nullif(r.banner_url, ''),
        'off', r.percent, 'percent', r.percent, 'sellerId', r.seller_id,
        'startsOn', r.starts_on, 'endsOn', r.ends_on,
        'image', nullif(r.banner_url, ''),
        'seller', jsonb_build_object('name', v_shop, 'role', 'Sotuvchi')),
      0, r.seller_id)
    on conflict (kind, id) do update set payload = excluded.payload, owner_id = excluded.owner_id;
  else
    insert into public.catalog_items (kind, id, payload, sort_at, owner_id)
    values ('deal', v_id, jsonb_build_object(
        'id', v_id, 'scope', 'product', 'title', v_title, 'name', p.name, 'brand', p.brand, 'banner', nullif(r.banner_url, ''),
        'off', round((1 - r.price / r.old_price) * 100)::int,
        'price', r.price, 'oldPrice', r.old_price, 'stock', p.stock,
        'productId', p.id, 'sellerId', r.seller_id,
        'startsOn', r.starts_on, 'endsOn', r.ends_on,
        'image', p.image_url,
        'images', case when jsonb_typeof(p.images) = 'array' and jsonb_array_length(p.images) > 0 then p.images else jsonb_build_array(p.image_url) end,
        'about', p.description,
        'seller', jsonb_build_object('name', v_shop, 'role', 'Sotuvchi')),
      0, r.seller_id)
    on conflict (kind, id) do update set payload = excluded.payload, owner_id = excluded.owner_id;
  end if;
  return coalesce(new, old);
end $$;

drop trigger if exists seller_promotions_sync on public.seller_promotions;
create trigger seller_promotions_sync after insert or update or delete on public.seller_promotions
  for each row execute function public.seller_promotion_sync();

-- Mavjud aksiyalar yangi payload (scope/title) bilan qayta sinxronlanadi — qatorlar o‘zgarmaydi
update public.seller_promotions set updated_at = updated_at where active;

-- 5) Buyurtma narxi: chegirma (0048) va faol aksiya — qaysi arzon bo‘lsa ---------------------------------
create or replace function public.seller_discount_price(p public.seller_products, p_price numeric)
returns numeric language sql stable security definer set search_path = public as $$
  select least(
    coalesce((
      select min(case when coalesce(d.kind, 'foiz') = 'summa' then greatest(p_price - coalesce(d.value, 0), 0)
                      else round(p_price * (1 - coalesce(nullif(d.value, 0), d.percent)::numeric / 100)) end)
        from public.seller_discounts d
       where d.seller_id = p.seller_id and d.active and not coalesce(d.is_draft, false)
         and coalesce(trim(d.promo_code), '') = '' and coalesce(d.min_order, 0) = 0
         and coalesce(d.kind, 'foiz') in ('foiz', 'summa')
         and (coalesce(d.kind, 'foiz') = 'summa' or coalesce(nullif(d.value, 0), d.percent) between 1 and 90)
         and (d.starts_on is null or d.starts_on <= public.tashkent_today())
         and (d.ends_on is null or d.ends_on >= public.tashkent_today())
         and case coalesce(d.scope, 'all')
               when 'products' then p.id = any(coalesce(d.product_ids, '{}')) or d.product_id = p.id
               when 'category' then d.category <> '' and d.category = p.category
               else d.product_id is null or d.product_id = p.id end), p_price),
    coalesce((
      select min(case when s.scope = 'all' then round(p_price * (1 - s.percent::numeric / 100))
                      else round(p_price * s.price / s.old_price) end)
        from public.seller_promotions s
       where s.seller_id = p.seller_id and s.active
         and s.starts_on <= public.tashkent_today() and s.ends_on >= public.tashkent_today()
         and ((s.scope = 'all' and s.percent between 1 and 90)
              or (s.scope = 'product' and s.product_id = p.id and s.old_price > 0 and s.price > 0))), p_price));
$$;
revoke all on function public.seller_discount_price(public.seller_products, numeric) from public, anon, authenticated;

notify pgrst, 'reload schema';
