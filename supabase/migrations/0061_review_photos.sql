-- 0061: baholash rasmlari (seller_reviews.images). Qo‘llanmagan — avval ko‘rib chiqing.
-- Ustun allaqachon 0004 da (images jsonb default '[]'). Bu migratsiya:
--   1) insert guard: faqat o‘z uid /reviews/ pathidagi seller-media URL lari (max 3)
--   2) seller_public_profile: sharhlarga images maydonini qo‘shadi
-- Idempotent. Hech narsa o‘chirilmaydi.

alter table public.seller_reviews add column if not exists images jsonb not null default '[]'::jsonb;

create or replace function public.seller_review_insert_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_uid text := auth.uid()::text;
  v_clean jsonb := '[]'::jsonb;
begin
  if new.author_id is not null and new.author_id = auth.uid() and new.seller_id <> auth.uid() then
    new.reply := '';
    new.replied_at := null;
    new.hidden := false;
    new.reported := false;
    new.report_reason := '';
    new.body := left(coalesce(new.body, ''), 1000);
    -- Rasmlar: faqat https://…/storage/v1/object/public/seller-media/{uid}/reviews/…
    select coalesce(jsonb_agg(to_jsonb(u) order by ord), '[]'::jsonb) into v_clean
    from (
      select trim(both '"' from x.elem::text) as u, x.ord
      from jsonb_array_elements(coalesce(new.images, '[]'::jsonb)) with ordinality as x(elem, ord)
      where jsonb_typeof(x.elem) = 'string'
        and trim(both '"' from x.elem::text) ~ ('^https://[^[:space:]]+/storage/v1/object/public/seller-media/' || v_uid || '/reviews/')
      order by x.ord
      limit 3
    ) s;
    new.images := v_clean;
  end if;
  return new;
end $$;

drop trigger if exists seller_reviews_insert_guard on public.seller_reviews;
create trigger seller_reviews_insert_guard before insert on public.seller_reviews
  for each row execute function public.seller_review_insert_guard();

-- Sotuvchi public profilidagi sharhlarga images qo‘shiladi (0057 asosi).
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
                          split_part(coalesce(nullif(r.author_name, ''), 'Xaridor'), ' ', 1) as author,
                          coalesce(r.images, '[]'::jsonb) as images
                   from public.seller_reviews r
                   where r.seller_id = p.id and coalesce((to_jsonb(r) ->> 'hidden')::boolean, false) = false
                   order by r.created_at desc limit 20) x), '[]'::jsonb)
    ) from public.profiles p left join public.seller_settings s on s.seller_id = p.id where p.id = p_id
  ) end;
$$;
revoke all on function public.seller_public_profile(uuid) from public;
grant execute on function public.seller_public_profile(uuid) to anon, authenticated;
