-- 0044: seller public profile driven by Sozlamalar. NOT applied automatically.
-- Adds seller-controlled visibility toggles + cover image, and makes seller_public_profile
-- read the Sozlamalar logo/description/hours. Requisites (seller_settings.legal: STIR, bank,
-- MFO, hisob, rahbar), owner_name, notify, tg_chat_id are NEVER returned.
alter table public.seller_settings add column if not exists show_phone boolean not null default false;
alter table public.seller_settings add column if not exists show_address boolean not null default true;
alter table public.seller_settings add column if not exists cover_url text not null default '';

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
      'since', p.created_at,
      'rating', (select round(avg(r.rating)::numeric, 1) from public.seller_reviews r
                 where r.seller_id = p.id and coalesce((to_jsonb(r) ->> 'hidden')::boolean, false) = false),
      'reviews_count', (select count(*) from public.seller_reviews r
                 where r.seller_id = p.id and coalesce((to_jsonb(r) ->> 'hidden')::boolean, false) = false),
      'reviews', coalesce((select jsonb_agg(x) from (
                   select r.rating, r.body, r.reply, r.created_at,
                          split_part(coalesce(nullif(r.author_name, ''), 'Xaridor'), ' ', 1) as author
                   from public.seller_reviews r
                   where r.seller_id = p.id and coalesce((to_jsonb(r) ->> 'hidden')::boolean, false) = false
                   order by r.created_at desc limit 20) x), '[]'::jsonb)
    ) from public.profiles p left join public.seller_settings s on s.seller_id = p.id where p.id = p_id
  ) end;
$$;
revoke all on function public.seller_public_profile(uuid) from public;
grant execute on function public.seller_public_profile(uuid) to anon, authenticated;
