-- 0062 — Buyurtma holati o‘zgarganda xaridorga darhol bildirishnoma.
--
-- Mavjud holat: 0008 da public.seller_order_notify_buyer() triggeri bor edi, lekin matn umumiy edi
-- ("Buyurtma STH-00028" / "Buyurtma yo'lda") va havola faqat /profil/buyurtmalar ro‘yxatiga olib borardi.
-- Bundan tashqari customer_notifications jadvali Supabase Realtime nashriga qo‘shilmagan edi, shuning
-- uchun ilova yangi bildirishnomani faqat sahifa qayta yuklanganda ko‘rardi.
--
-- Bu migratsiya:
--   1. Trigger funksiyasini yangilaydi: sarlavha "Buyurtma #STH-00028: Yo‘lda", tushunarli matn,
--      havola /buyurtma/kuzatish/<kod> (aynan shu buyurtmaning kuzatish sahifasi).
--      Xaridor buyurtmani o‘zi bekor qilsa, o‘ziga bildirishnoma yuborilmaydi.
--   2. Triggerni qayta yaratadi (AFTER UPDATE OF status, SECURITY DEFINER funksiya).
--   3. customer_notifications ni supabase_realtime nashriga qo‘shadi (agar hali qo‘shilmagan bo‘lsa).
--   4. RLS siyosatlarini qayta tasdiqlaydi: har kim faqat o‘z bildirishnomalarini o‘qiydi/belgilaydi.
--
-- Idempotent: qayta ishga tushirsa ham xato bermaydi. Hech qanday ma’lumot o‘chirilmaydi yoki
-- o‘zgartirilmaydi (mavjud buyurtmalar, jumladan #STH-00025, tegilmaydi).

-- 1. Trigger funksiyasi ----------------------------------------------------------------------
create or replace function public.seller_order_notify_buyer()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_label text;
  v_body text;
  v_code text := coalesce(nullif(trim(new.code), ''), left(new.id::text, 8));
begin
  if new.buyer_id is null or new.status is not distinct from old.status then
    return null;
  end if;
  -- Xaridor o‘zi bekor qilgan bo‘lsa (buyer_cancel_order), o‘ziga xabar yubormaymiz
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
    return null; -- noma’lum holat (masalan, 'yangi') — bildirishnoma kerak emas
  end if;

  v_body := case new.status
    when 'tasdiqlandi' then 'Sotuvchi buyurtmangizni qabul qildi.'
    when 'tayyorlanmoqda' then 'Sotuvchi buyurtmangizni tayyorlayapti.'
    when 'yetkazilmoqda' then 'Buyurtmangiz yo‘lga chiqdi.'
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

-- 2. Trigger ------------------------------------------------------------------------------------
drop trigger if exists seller_orders_notify_buyer on public.seller_orders;
create trigger seller_orders_notify_buyer after update of status on public.seller_orders
  for each row execute function public.seller_order_notify_buyer();

-- 3. Realtime: yangi bildirishnoma ilovaga darhol yetib borsin -----------------------------------
do $rt$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables
                      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'customer_notifications') then
    execute 'alter publication supabase_realtime add table public.customer_notifications';
  end if;
end $rt$;

-- 4. RLS (0007 dagi siyosatlar qayta tasdiqlanadi) -------------------------------------------------
alter table public.customer_notifications enable row level security;
drop policy if exists customer_notifications_read on public.customer_notifications;
create policy customer_notifications_read on public.customer_notifications
  for select to authenticated using (user_id = auth.uid());
drop policy if exists customer_notifications_mark on public.customer_notifications;
create policy customer_notifications_mark on public.customer_notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, update on public.customer_notifications to authenticated;
-- Mijoz o‘zi bildirishnoma yaratolmaydi: faqat SECURITY DEFINER funksiyalar yozadi
revoke insert on public.customer_notifications from anon, authenticated;
create index if not exists customer_notifications_unread_idx
  on public.customer_notifications (user_id, created_at desc) where read_at is null;
