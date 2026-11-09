-- 0057: seller public profile v2 (yangi "Sotuvchi profili" dizayni). NOT applied automatically.
-- Sxema o‘zgarmaydi — faqat seller_public_profile RPC'ga 3 ta ochiq maydon qo‘shiladi:
--   verified     — profiles.seller_status = 'approved' ("Tasdiqlangan" belgisi uchun)
--   sales_count  — yetkazilgan (status = 'yetkazildi') Marketplace buyurtmalari soni; qo‘lda kiritilgan
--                  (source = 'manual') va bekor qilinganlar hisoblanmaydi. Faqat son — buyurtma tafsiloti chiqmaydi.
--   reviews[].product_id — sharh qaysi mahsulotga yozilganini ko‘rsatish uchun.
-- Qolgan hammasi 0044 bilan bir xil. Rekvizitlar (legal, STIR, bank, MFO, hisob), owner_name, notify,
-- tg_chat_id hech qachon qaytarilmaydi. Telefon faqat show_phone = true bo‘lsa.
create or replace function public.seller_public_profile(p_id uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select case when not public.seller_is_public(p_id) then null else (
    select jsonb_build_object(
      'id', p.id,
      'shop_name', coalesce(nullif(p.shop_name, ''), 'Sotuvchi'),
      'description', coalesce(nullif(s.description, ''), p.shop_description, ''),
      'shop_type', coalesce(p.shop_type, ''),
      'categories', coalesce(to_jsonb(p.shop_categories), '[]'::jsonb),
      'city', coalesce(p.city, ''),
      'avatar_url', coalesce(nullif(s.logo_url, ''), p.avatar_url, ''),
      'cover_url', coalesce(s.cover_url, ''),
      'work_days', coalesce(s.work_days, ''),
      'work_hours', coalesce(s.work_hours, ''),
      'phone', case when coalesce(s.show_phone, false) then coalesce(s.phone, '') else '' end,
      'address', case when coalesce(s.show_address, true) then coalesce(s.address, '') else '' end,
      'telegram', coalesce(s.telegram, ''),
      'instagram', coalesce(s.instagram, ''),
      'website', coalesce(s.website, ''),
      'featured_ids', coalesce((select jsonb_agg(f.id order by f.ord) from unnest(s.featured_product_ids) with ordinality f(id, ord)
                   join public.seller_products sp on sp.id = f.id and sp.seller_id = p.id and sp.status = 'active'), '[]'::jsonb),
      'since', p.created_at,
      'verified', coalesce(p.seller_status, '') = 'approved',
      'sales_count', (select count(*) from public.seller_orders o
                 where o.seller_id = p.id and o.status = 'yetkazildi' and coalesce(o.source, 'marketplace') = 'marketplace'),
      'rating', (select round(avg(r.rating)::numeric, 1) from public.seller_reviews r
                 where r.seller_id = p.id and coalesce((to_jsonb(r) ->> 'hidden')::boolean, false) = false),
      'reviews_count', (select count(*) from public.seller_reviews r
                 where r.seller_id = p.id and coalesce((to_jsonb(r) ->> 'hidden')::boolean, false) = false),
      'reviews', coalesce((select jsonb_agg(x) from (
                   select r.rating, r.body, r.reply, r.created_at, r.product_id,
                          split_part(coalesce(nullif(r.author_name, ''), 'Xaridor'), ' ', 1) as author
                   from public.seller_reviews r
                   where r.seller_id = p.id and coalesce((to_jsonb(r) ->> 'hidden')::boolean, false) = false
                   order by r.created_at desc limit 20) x), '[]'::jsonb)
    ) from public.profiles p left join public.seller_settings s on s.seller_id = p.id where p.id = p_id
  ) end;
$$;
revoke all on function public.seller_public_profile(uuid) from public;
grant execute on function public.seller_public_profile(uuid) to anon, authenticated;
