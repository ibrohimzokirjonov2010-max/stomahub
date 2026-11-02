-- 0040: admin_sellers_list / admin_organizers_list (0031) 'query has no destination for result data' xatosini tuzatadi:
-- yakuniy SELECT natijasi v ga yozilmagan edi (INTO v yo'q). Ma'lumot o'zgarmaydi. NOT APPLIED.

-- 6. sellers list: everyone who sells (incl. official StomaHub + customers with an approved shop) --
create or replace function public.admin_sellers_list(p_tab text default 'all', p_q text default '', p_page int default 1, p_page_size int default 10)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_page int := greatest(1, coalesce(p_page, 1));
  v_size int := least(50, greatest(1, coalesce(p_page_size, 10)));
  v_q text := lower(trim(coalesce(p_q, '')));
  v jsonb;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  with s as (
    select p.*, case when p.role = 'admin' then 'approved' else coalesce(p.seller_status, 'none') end as st
      from public.profiles p
     where coalesce(p.seller_status, 'none') <> 'none' or p.role = 'seller'
        or exists (select 1 from public.seller_products sp where sp.seller_id = p.id)
  ), f as (
    select * from s where (p_tab = 'all' or st = p_tab)
      and (v_q = '' or lower(coalesce(name, '')) like '%'||v_q||'%' or lower(coalesce(shop_name, '')) like '%'||v_q||'%'
           or lower(coalesce(city, '')) like '%'||v_q||'%' or coalesce(phone, '') like '%'||v_q||'%')
  )
  select jsonb_build_object(
    'total', (select count(*) from f),
    'counts', (select jsonb_build_object('all', count(*),
        'approved', count(*) filter (where st = 'approved'), 'pending', count(*) filter (where st = 'pending'),
        'registered', count(*) filter (where st = 'registered'), 'rejected', count(*) filter (where st = 'rejected'),
        'blocked', count(*) filter (where st = 'blocked')) from s),
    'page', v_page, 'page_size', v_size,
    'rows', coalesce((select jsonb_agg(row_to_json(x)::jsonb) from (
        select f.id, f.name, f.shop_name, f.avatar, f.city, f.st as seller_status, f.seller_applied_at, f.created_at,
               f.role = 'admin' as official, public.admin_mask_phone(f.phone) as phone,
               coalesce(jsonb_array_length(f.seller_docs), 0) as docs_count,
               (select count(*) from public.seller_products sp where sp.seller_id = f.id) as products_count
          from f order by (f.role = 'admin') desc, coalesce(f.seller_applied_at, f.created_at) desc
         limit v_size offset (v_page - 1) * v_size) x), '[]'::jsonb)) into v;
  return v;
end $$;
grant execute on function public.admin_sellers_list(text, text, int, int) to authenticated;

-- 7. organizers list: counts sum to total (registered/blocked included) -------------------------
create or replace function public.admin_organizers_list(p_tab text default 'all', p_q text default '', p_page int default 1, p_page_size int default 10)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_page int := greatest(1, coalesce(p_page, 1));
  v_size int := least(50, greatest(1, coalesce(p_page_size, 10)));
  v_q text := lower(trim(coalesce(p_q, '')));
  v jsonb;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  with s as (
    select p.*, case when coalesce(p.org_status, 'none') in ('none', '') then 'registered' else p.org_status end as st
      from public.profiles p where p.role = 'organizer' or coalesce(p.org_status, 'none') <> 'none'
  ), f as (
    select * from s where (p_tab = 'all' or st = p_tab)
      and (v_q = '' or lower(coalesce(name, '')) like '%'||v_q||'%' or lower(coalesce(city, '')) like '%'||v_q||'%' or coalesce(phone, '') like '%'||v_q||'%')
  )
  select jsonb_build_object(
    'total', (select count(*) from f),
    'counts', (select jsonb_build_object('all', count(*),
        'approved', count(*) filter (where st = 'approved'), 'pending', count(*) filter (where st = 'pending'),
        'registered', count(*) filter (where st = 'registered'), 'rejected', count(*) filter (where st = 'rejected'),
        'blocked', count(*) filter (where st = 'blocked')) from s),
    'page', v_page, 'page_size', v_size,
    'rows', coalesce((select jsonb_agg(row_to_json(x)::jsonb) from (
        select f.id, f.name, f.avatar, f.city, f.st as org_status, f.created_at, f.verified,
               public.admin_mask_phone(f.phone) as phone,
               (select count(*) from public.seminars sm where sm.organizer_id = f.id) as seminars_count
          from f order by f.created_at desc limit v_size offset (v_page - 1) * v_size) x), '[]'::jsonb)) into v;
  return v;
end $$;
grant execute on function public.admin_organizers_list(text, text, int, int) to authenticated;

