-- 0036: public seller (shop) profile for /dokon/:id. NOT applied automatically.
-- profiles has only own-row select RLS, so expose a narrow, read-only definer RPC
-- that returns public shop fields + review summary for approved, non-blocked sellers only.
create or replace function public.seller_public_profile(p_id uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select case when not public.seller_is_public(p_id) then null else (
    select jsonb_build_object(
      'id', p.id,
      'shop_name', coalesce(nullif(p.shop_name, ''), 'Sotuvchi'),
      'description', coalesce(p.shop_description, ''),
      'shop_type', coalesce(p.shop_type, ''),
      'categories', coalesce(to_jsonb(p.shop_categories), '[]'::jsonb),
      'city', coalesce(p.city, ''),
      'avatar_url', coalesce(p.avatar_url, ''),
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
    ) from public.profiles p where p.id = p_id
  ) end;
$$;
revoke all on function public.seller_public_profile(uuid) from public;
grant execute on function public.seller_public_profile(uuid) to anon, authenticated;
