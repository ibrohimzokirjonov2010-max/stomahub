-- 0067: Yetkazib berish — kuzatuv linki va kuryer ma’lumotlari. NOT applied automatically.
--   Sotuvchi (har qanday turdagi: stomatologik, forma, jihozlar) buyurtmani «Yetkazilmoqda» holatiga
--   o‘tkazayotganda yetkazib berish xizmatini tanlaydi (Yandex / boshqa / o‘zim yetkazaman), kuzatuv
--   linkini, ixtiyoriy kuryer ismi, telefoni va taxminiy yetib borish vaqtini kiritadi. Xaridor buyurtma
--   kuzatish sahifasida «Kuryerni kuzatish» tugmasini ko‘radi.
--   Eslatma: Yandex’dan jonli kuryer ma’lumoti avtomatik olinmaydi (ochiq API yo‘q) — kuryer ismi va
--   telefoni sotuvchi kiritgan ma’lumot.
--
--   1) seller_orders: delivery_service, courier_name, courier_phone, delivery_eta, delivery_updated_at.
--      O‘qish — mavjud RLS (xaridor: buyer_id, sotuvchi: seller_id, admin). Bu ustunlar 0042 dagi
--      seller_orders_money_guard ruxsat ro‘yxatida yo‘q → to‘g‘ridan-to‘g‘ri UPDATE bilan o‘zgartirib
--      bo‘lmaydi, faqat seller_set_delivery() orqali.
--   2) delivery_tracking_url_ok(service, url): faqat https; Yandex uchun host allow-list
--      (*.yandex.uz/ru/com/kz/by/com.tr, *.ya.ru, *.ya.cc, *.go.yandex); «boshqa»/«o‘zim» — istalgan
--      https havola. javascript:/data:/http:, login@host, bo‘sh joy va boshqaruv belgilari rad etiladi.
--   3) Trigger seller_orders_c_delivery_check: tracking_url har qanday yo‘l bilan yozilsa (shu jumladan
--      eski seller_set_tracking_url yoki to‘g‘ridan-to‘g‘ri UPDATE) tekshiriladi; sotuvchi buyurtmani
--      «yetkazilmoqda» ga o‘tkazishi uchun xizmat tanlangan va (o‘zim yetkazaman bo‘lmasa) link bo‘lishi shart.
--      Olib ketish (olib_ketish) buyurtmalari va admin bundan mustasno.
--   4) seller_set_delivery(...) — faqat shu buyurtma sotuvchisi yoki admin. Yo‘ldagi buyurtmaning linki
--      keyin o‘zgarsa, xaridorga bildirishnoma.
--   5) seller_set_tracking_url — yangi tekshiruv bilan (https, allow-list).
--   6) seller_order_notify_buyer (0062) — «Yo‘lda» matniga xizmat nomi va kuzatuv haqida eslatma.
-- Takror ishga tushirish xavfsiz (idempotent). Hech qanday qator o‘chirilmaydi yoki o‘zgartirilmaydi.

-- 1) Ustunlar -------------------------------------------------------------------------------------
alter table public.seller_orders add column if not exists delivery_service text not null default '';
alter table public.seller_orders add column if not exists courier_name text not null default '';
alter table public.seller_orders add column if not exists courier_phone text not null default '';
alter table public.seller_orders add column if not exists delivery_eta text not null default '';
alter table public.seller_orders add column if not exists delivery_updated_at timestamptz;

do $c$
begin
  if not exists (select 1 from pg_constraint where conname = 'seller_orders_delivery_service_chk' and conrelid = 'public.seller_orders'::regclass) then
    alter table public.seller_orders add constraint seller_orders_delivery_service_chk
      check (delivery_service in ('', 'yandex', 'boshqa', 'ozim'));
  end if;
end $c$;

-- 2) Havola tekshiruvi ----------------------------------------------------------------------------
create or replace function public.delivery_tracking_url_ok(p_service text, p_url text)
returns boolean language plpgsql immutable set search_path = public as $$
declare
  v text := trim(coalesce(p_url, ''));
  v_low text;
  v_auth text;
  v_host text;
begin
  if v = '' then return true; end if;                       -- majburiylik alohida tekshiriladi
  if length(v) > 500 then return false; end if;
  if v ~ '[[:space:][:cntrl:]<>"''\\`]' then return false; end if;
  v_low := lower(v);
  if v_low !~ '^https://' then return false; end if;       -- javascript:, data:, http: va h.k. rad
  v_auth := substring(v_low from '^https://([^/?#]*)');
  if v_auth is null or v_auth = '' or position('@' in v_auth) > 0 then return false; end if;
  v_host := regexp_replace(v_auth, ':[0-9]{1,5}$', '');
  if v_host !~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$' then return false; end if;
  if v_host ~ '^[0-9.]+$' then return false; end if;         -- IP manzil emas
  if coalesce(p_service, '') = 'yandex' then
    return v_host ~ '^([a-z0-9-]+\.)*(yandex\.(uz|ru|com|kz|by|com\.tr)|ya\.ru|ya\.cc|go\.yandex)$';
  end if;
  return true;                                               -- boshqa / o‘zim: istalgan https
end $$;
grant execute on function public.delivery_tracking_url_ok(text, text) to authenticated;

-- 3) Trigger: har qanday yozuvda link tekshiruvi + «yetkazilmoqda» uchun yetkazish ma’lumoti ----------
create or replace function public.seller_orders_delivery_check()
returns trigger language plpgsql set search_path = public as $$
declare
  v_service text := coalesce(nullif(new.delivery_service, ''), 'yandex');
begin
  if (tg_op = 'INSERT' or new.tracking_url is distinct from old.tracking_url or new.delivery_service is distinct from old.delivery_service)
     and coalesce(new.tracking_url, '') <> ''
     and not public.delivery_tracking_url_ok(v_service, new.tracking_url) then
    raise exception '%', case when v_service = 'yandex'
      then 'Faqat Yandex kuzatuv havolasi qabul qilinadi (yandex.uz, yandex.ru, yandex.com, go.yandex, ya.cc). Boshqa xizmat bo‘lsa, «Boshqa» ni tanlang'
      else 'Kuzatuv havolasi https:// bilan boshlanishi kerak' end;
  end if;

  if tg_op = 'UPDATE' and new.status = 'yetkazilmoqda' and old.status is distinct from 'yetkazilmoqda'
     and current_user = 'authenticated' and not public.is_admin()
     and coalesce(new.delivery_method, '') <> 'olib_ketish' then
    -- eski oqim: xizmat tanlanmagan, lekin Yandex linki (seller_set_tracking_url) bor — ruxsat
    if coalesce(new.delivery_service, '') = '' and coalesce(new.tracking_url, '') = '' then
      raise exception 'Yetkazilmoqda holatiga o‘tkazishdan oldin yetkazib berish ma’lumotini kiriting';
    end if;
    if new.delivery_service in ('yandex', 'boshqa') and coalesce(new.tracking_url, '') = '' then
      raise exception 'Kuzatuv linkini kiriting';
    end if;
  end if;
  return new;
end $$;
revoke all on function public.seller_orders_delivery_check() from public, anon, authenticated;

drop trigger if exists seller_orders_c_delivery_check on public.seller_orders;
create trigger seller_orders_c_delivery_check
  before insert or update on public.seller_orders
  for each row execute function public.seller_orders_delivery_check();

-- 4) Sotuvchi yetkazish ma’lumotini saqlaydi --------------------------------------------------------
create or replace function public.seller_set_delivery(
  p_order uuid,
  p_service text,
  p_url text default '',
  p_courier_name text default '',
  p_courier_phone text default '',
  p_eta text default ''
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_order public.seller_orders;
  v_service text := lower(trim(coalesce(p_service, '')));
  v_url text := trim(coalesce(p_url, ''));
  v_name text := left(regexp_replace(trim(coalesce(p_courier_name, '')), '[[:cntrl:]]', '', 'g'), 80);
  v_phone text := trim(coalesce(p_courier_phone, ''));
  v_eta text := left(regexp_replace(trim(coalesce(p_eta, '')), '[[:cntrl:]]', '', 'g'), 60);
  v_digits int;
  v_code text;
begin
  if auth.uid() is null then raise exception 'Avtorizatsiya kerak'; end if;
  select * into v_order from public.seller_orders
   where id = p_order and (seller_id = auth.uid() or public.is_admin());
  if not found then raise exception 'Buyurtma topilmadi'; end if;
  if v_order.status in ('bekor_qilindi', 'yetkazildi') then
    raise exception 'Yopilgan buyurtmaning yetkazish ma’lumotini o‘zgartirib bo‘lmaydi';
  end if;
  if v_service not in ('yandex', 'boshqa', 'ozim') then
    raise exception 'Yetkazib berish xizmatini tanlang';
  end if;
  if v_url = '' and v_service <> 'ozim' then
    raise exception 'Kuzatuv linkini kiriting';
  end if;
  if not public.delivery_tracking_url_ok(v_service, v_url) then
    raise exception '%', case when v_service = 'yandex'
      then 'Faqat Yandex kuzatuv havolasi qabul qilinadi (yandex.uz, yandex.ru, yandex.com, go.yandex, ya.cc). Boshqa xizmat bo‘lsa, «Boshqa» ni tanlang'
      else 'Kuzatuv havolasi https:// bilan boshlanishi kerak' end;
  end if;
  if v_phone <> '' then
    v_digits := length(regexp_replace(v_phone, '\D', '', 'g'));
    if v_phone !~ '^\+?[0-9 ()-]{7,20}$' or v_digits < 7 or v_digits > 15 then
      raise exception 'Kuryer telefoni noto‘g‘ri';
    end if;
  end if;

  update public.seller_orders
     set delivery_service = v_service, tracking_url = v_url, courier_name = v_name,
         courier_phone = v_phone, delivery_eta = v_eta, delivery_updated_at = now(), updated_at = now()
   where id = p_order;

  -- Yo‘ldagi buyurtmaning linki keyin qo‘shilsa/o‘zgarsa — xaridorga xabar
  if v_order.status = 'yetkazilmoqda' and v_order.buyer_id is not null and v_url <> ''
     and v_url is distinct from coalesce(v_order.tracking_url, '') then
    v_code := coalesce(nullif(trim(v_order.code), ''), left(v_order.id::text, 8));
    insert into public.customer_notifications (user_id, kind, title, body, link)
    values (v_order.buyer_id, 'order', 'Buyurtma #' || v_code || ': Kuzatuv havolasi',
      'Sotuvchi kuryerni kuzatish havolasini yubordi. Buyurtma sahifasida «Kuryerni kuzatish» tugmasini bosing.',
      '/buyurtma/kuzatish/' || v_code);
  end if;

  return jsonb_build_object('ok', true, 'id', p_order, 'delivery_service', v_service, 'tracking_url', v_url,
    'courier_name', v_name, 'courier_phone', v_phone, 'delivery_eta', v_eta);
end $$;
revoke all on function public.seller_set_delivery(uuid, text, text, text, text, text) from public, anon;
grant execute on function public.seller_set_delivery(uuid, text, text, text, text, text) to authenticated;

-- 5) Eski RPC — yangi tekshiruv bilan (0015 o‘rniga) -----------------------------------------------
create or replace function public.seller_set_tracking_url(p_order uuid, p_url text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_order public.seller_orders;
  v_url text := trim(coalesce(p_url, ''));
  v_service text;
begin
  if auth.uid() is null then raise exception 'Avtorizatsiya kerak'; end if;
  select * into v_order from public.seller_orders where id = p_order and (seller_id = auth.uid() or public.is_admin());
  if not found then raise exception 'Buyurtma topilmadi'; end if;
  if v_order.status in ('bekor_qilindi', 'yetkazildi') then
    raise exception 'Yopilgan buyurtmaga kuzatuv havolasi qo‘yib bo‘lmaydi';
  end if;
  v_service := coalesce(nullif(v_order.delivery_service, ''), 'yandex');
  if not public.delivery_tracking_url_ok(v_service, v_url) then
    raise exception 'Faqat https:// bilan boshlanadigan Yandex kuzatuv havolasi qabul qilinadi';
  end if;
  update public.seller_orders set tracking_url = v_url, delivery_updated_at = now(), updated_at = now() where id = p_order;
  return jsonb_build_object('ok', true, 'tracking_url', v_url, 'id', p_order);
end $$;
revoke all on function public.seller_set_tracking_url(uuid, text) from public, anon;
grant execute on function public.seller_set_tracking_url(uuid, text) to authenticated;

-- 6) Xaridor bildirishnomasi (0062 nusxasi; faqat «yetkazilmoqda» matni boyitildi) -----------------
create or replace function public.seller_order_notify_buyer()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_label text;
  v_body text;
  v_code text := coalesce(nullif(trim(new.code), ''), left(new.id::text, 8));
  v_service text := case new.delivery_service when 'yandex' then 'Yandex' when 'ozim' then 'sotuvchining o‘z kuryeri' else '' end;
begin
  if new.buyer_id is null or new.status is not distinct from old.status then
    return null;
  end if;
  if new.status = 'bekor_qilindi' and auth.uid() is not distinct from new.buyer_id then
    return null;
  end if;

  v_label := case new.status
    when 'tasdiqlandi' then 'Qabul qilindi'
    when 'tayyorlanmoqda' then 'Tayyorlanmoqda'
    when 'yetkazilmoqda' then 'Yo‘lda'
    when 'yetkazildi' then 'Yetkazildi'
    when 'bekor_qilindi' then 'Bekor qilindi'
    else null end;
  if v_label is null then
    return null;
  end if;

  v_body := case new.status
    when 'tasdiqlandi' then 'Sotuvchi buyurtmangizni qabul qildi.'
    when 'tayyorlanmoqda' then 'Sotuvchi buyurtmangizni tayyorlayapti.'
    when 'yetkazilmoqda' then 'Buyurtmangiz yo‘lga chiqdi'
      || case when v_service <> '' then ' (' || v_service || ')' else '' end || '.'
      || case when coalesce(new.tracking_url, '') <> '' then ' Kuryerni kuzatish havolasi buyurtma sahifasida.' else '' end
      || case when coalesce(new.delivery_eta, '') <> '' then ' Taxminiy vaqt: ' || new.delivery_eta || '.' else '' end
    when 'yetkazildi' then 'Buyurtmangiz yetkazib berildi.'
    when 'bekor_qilindi' then 'Buyurtma bekor qilindi'
      || coalesce(': ' || nullif(trim(new.cancel_reason), ''), '') || '.'
    end;

  insert into public.customer_notifications (user_id, kind, title, body, link)
  values (new.buyer_id, 'order', 'Buyurtma #' || v_code || ': ' || v_label, left(v_body, 500),
    '/buyurtma/kuzatish/' || v_code);
  return null;
end $$;
revoke all on function public.seller_order_notify_buyer() from public, anon, authenticated;

drop trigger if exists seller_orders_notify_buyer on public.seller_orders;
create trigger seller_orders_notify_buyer after update of status on public.seller_orders
  for each row execute function public.seller_order_notify_buyer();

notify pgrst, 'reload schema';
