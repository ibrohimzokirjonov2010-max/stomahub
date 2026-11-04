-- 0051: admin buyurtma tafsiloti/amallari + o‘z mahsulotini tasdiqlash. Mavjud qatorlar o‘zgarmaydi.
-- Ilova qilish tartibi: 0050 → 0051 → 0060 → 0070 (0060 erta narxni serverda hisoblaydi).

-- 1. admin_review_product: admin o‘z (rasmiy) mahsulotini ham 'review'dan tasdiqlay oladi.
--    0031 versiyasi seller.role='admin' bo‘lgan mahsulotlarni chiqarib tashlagan (0033 tuzatgan,
--    lekin prod'da qo‘llanmagan bo‘lishi mumkin) — bu yerda qayta aniqlanadi.
create or replace function public.admin_review_product(p_id uuid, p_approve boolean, p_reason text default '')
returns void language plpgsql security definer set search_path = public as $$
declare v_status text;
begin
  if not public.is_admin() then raise exception 'Faqat administrator uchun'; end if;
  if not p_approve and length(trim(coalesce(p_reason, ''))) < 3 then raise exception 'Rad etish sababini yozing'; end if;
  select status into v_status from public.seller_products where id = p_id for update;
  if not found then raise exception 'Mahsulot topilmadi'; end if;
  if v_status <> 'review' then
    raise exception 'Mahsulot tekshiruvda emas (holati: %), sahifani yangilang', v_status;
  end if;
  update public.seller_products
     set status = case when p_approve then 'active' else 'rejected' end,
         reject_reason = case when p_approve then '' else trim(p_reason) end, updated_at = now()
   where id = p_id;
end $$;
revoke all on function public.admin_review_product(uuid, boolean, text) from public, anon;
grant execute on function public.admin_review_product(uuid, boolean, text) to authenticated;

-- 2. Nizo / admin izohi ustuni
alter table public.seller_orders add column if not exists admin_note text not null default '';

-- 3. admin_order_detail: xaridor/sotuvchi nomi va mahsulot nomi bo‘sh bo‘lsa zaxira qiymatlar.
create or replace function public.admin_order_detail(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  select jsonb_build_object(
    'id', o.id, 'code', o.code, 'status', o.status, 'subtotal', o.subtotal,
    'commission', o.commission, 'payout', o.payout, 'commission_rate', o.commission_rate,
    'payment_method', o.payment_method, 'payment_status', o.payment_status, 'payment_ref', o.payment_ref,
    'tracking_url', o.tracking_url, 'city', o.city,
    'created_at', o.created_at, 'address', o.address, 'note', o.note,
    'buyer_id', o.buyer_id,
    'customer_name', coalesce(nullif(trim(o.customer_name), ''), nullif(trim(o.contact_person), ''),
                              nullif(trim(b.name), ''), nullif(trim(b.full_name), ''), 'Xaridor'),
    'customer_phone', coalesce(nullif(o.customer_phone, ''), b.phone),
    'customer_phone_full', true,
    'cancel_reason', o.cancel_reason, 'status_history', o.status_history,
    'escrow_released_at', o.escrow_released_at, 'escrow_refunded_at', o.escrow_refunded_at,
    'dispute_status', o.dispute_status, 'dispute_reason', o.dispute_reason, 'admin_note', o.admin_note,
    'seller', jsonb_build_object('id', o.seller_id,
        'name', coalesce(nullif(trim(s.name), ''), nullif(trim(s.full_name), ''), 'Sotuvchi'),
        'shop_name', coalesce(nullif(trim(s.shop_name), ''), nullif(trim(s.name), ''), nullif(trim(s.full_name), ''), 'Sotuvchi'),
        'city', s.city, 'phone', public.admin_mask_phone(s.phone)),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object('id', i.id,
               'name', coalesce(nullif(trim(i.name), ''), nullif(trim(p.name), ''), 'Mahsulot'),
               'variant', i.variant, 'image_url', coalesce(nullif(i.image_url, ''), p.image_url),
               'qty', i.qty, 'price', i.price, 'total', i.total))
      from public.seller_order_items i
      left join public.seller_products p on p.id = i.product_id
      where i.order_id = o.id
    ), '[]'::jsonb)
  ) into v
  from public.seller_orders o
  left join public.profiles s on s.id = o.seller_id
  left join public.profiles b on b.id = o.buyer_id
  where o.id = p_id;
  if v is null then raise exception 'Buyurtma topilmadi'; end if;
  return v;
end $$;
revoke all on function public.admin_order_detail(uuid) from public, anon;
grant execute on function public.admin_order_detail(uuid) to authenticated;

-- 4. admin_order_action: holat o‘zgartirish, bekor qilish, pul qaytarildi deb belgilash, nizo izohi.
--    Holat o‘tishlari seller_orders_status_guard tomonidan tekshiriladi (faqat oldinga).
create or replace function public.admin_order_action(p_id uuid, p_action text, p_status text default '', p_note text default '')
returns jsonb language plpgsql security definer set search_path = public as $$
declare v public.seller_orders; v_note text := left(trim(coalesce(p_note, '')), 1000);
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  select * into v from public.seller_orders where id = p_id for update;
  if not found then raise exception 'Buyurtma topilmadi'; end if;

  if p_action = 'status' then
    if p_status not in ('tasdiqlandi', 'tayyorlanmoqda', 'yetkazilmoqda', 'yetkazildi') then
      raise exception 'Noto‘g‘ri holat';
    end if;
    update public.seller_orders set status = p_status, updated_at = now() where id = p_id;
  elsif p_action = 'cancel' then
    if length(v_note) < 3 then raise exception 'Bekor qilish sababini yozing'; end if;
    if v.payment_status = 'released' then raise exception 'Sotuvchiga chiqarilgan to‘lovli buyurtmani bekor qilib bo‘lmaydi'; end if;
    update public.seller_orders set status = 'bekor_qilindi', cancel_reason = 'Admin: ' || v_note, updated_at = now() where id = p_id;
  elsif p_action = 'refund' then
    if length(v_note) < 3 then raise exception 'Qaytarish izohini yozing'; end if;
    perform public.payment_mark_refunded(p_id, 'admin', 'Admin: ' || v_note);
  elsif p_action = 'note' then
    update public.seller_orders set admin_note = v_note, updated_at = now() where id = p_id;
  else
    raise exception 'Noma’lum amal';
  end if;

  update public.seller_orders
     set admin_note = trim(both E'\n' from admin_note || E'\n' || to_char(now() at time zone 'Asia/Tashkent', 'DD.MM.YYYY HH24:MI')
                      || ' — ' || p_action || coalesce(nullif(' ' || p_status, ' '), '') || coalesce(nullif(': ' || v_note, ': '), ''))
   where id = p_id and p_action <> 'note';
  return public.admin_order_detail(p_id);
end $$;
revoke all on function public.admin_order_action(uuid, text, text, text) from public, anon;
grant execute on function public.admin_order_action(uuid, text, text, text) to authenticated;

-- 5. Xavfsizlik auditi natijasi: is_admin tekshiruvisiz admin_* funksiyalarini yopish.
--    admin_dashboard/admin_finance/admin_approvals_list — base funksiyalar va admin_money orqali
--    is_admin tekshiriladi (himoyalangan). admin_users_total va admin_user_roles esa har qanday
--    authenticated foydalanuvchiga ochiq edi (foydalanuvchilar soni / rol ma’lumoti sizishi).
create or replace function public.admin_users_total()
returns bigint language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  return (select count(*) from public.profiles where coalesce(role, 'customer') <> 'admin');
end $$;
revoke all on function public.admin_users_total() from public, anon;
grant execute on function public.admin_users_total() to authenticated;
-- faqat boshqa SECURITY DEFINER admin funksiyalari ichida ishlatiladi (egasi sifatida chaqiriladi)
revoke all on function public.admin_user_roles(public.profiles) from public, anon, authenticated;
