-- 0045: ishga tushirishdan oldingi QA tuzatishlari (maxfiylik). HECH NARSA O‘CHIRILMAYDI.
--  1) promo_codes: ommaviy SELECT olib tashlanadi; kodni tekshirish faqat check_promo() RPC orqali.
--  2) seminars: anon foydalanuvchi revenue / sold / contact_phone / cancel_reason / checked /
--     hidden_reason ni ko‘rmaydi. Ommaviy katalog seminars_public view orqali o‘qiladi.
--     is_test seminarlar ommaviy o‘qishdan chiqariladi.
--  3) seller_products: is_test mahsulotlar ommaviy o‘qishdan chiqariladi (egasi va admin ko‘radi).
-- Tashkilotchi (o‘z seminarlari: seminars_owner_read) va admin (security definer RPC lar) o‘zgarmaydi.

-- 1) promo_codes ------------------------------------------------------------------------------
drop policy if exists promo_public_read on public.promo_codes;
revoke select on public.promo_codes from anon;
-- authenticated: faqat promo_owner_all (o‘z kodlari) qoladi.

create or replace function public.check_promo(p_seminar_id text, p_code text, p_amount numeric default 0)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_sem public.seminars%rowtype;
  v_promo public.promo_codes%rowtype;
  v_code text := upper(trim(coalesce(p_code, '')));
  v_amount numeric := least(greatest(coalesce(p_amount, 0), 0), 50000000);
  v_discount numeric := 0;
begin
  if v_code = '' then return jsonb_build_object('ok', false, 'error', 'Promokodni kiriting'); end if;
  if length(v_code) > 64 then return jsonb_build_object('ok', false, 'error', 'Promokod topilmadi yoki muddati o‘tgan'); end if;
  select * into v_sem from public.seminars
   where id = p_seminar_id and published and status <> 'qoralama' and not hidden and not coalesce(is_test, false);
  if not found then return jsonb_build_object('ok', false, 'error', 'Seminar topilmadi'); end if;
  -- register_for_seminar (0032) bilan bir xil qoida
  select * into v_promo from public.promo_codes
   where upper(code) = v_code and status = 'faol' and organizer_id = v_sem.organizer_id
     and (seminar_id is null or seminar_id = 'all' or seminar_id = v_sem.id)
     and (limit_n = 0 or used < limit_n)
   order by case when seminar_id = v_sem.id then 0 else 1 end
   limit 1;
  if not found then return jsonb_build_object('ok', false, 'error', 'Promokod topilmadi yoki muddati o‘tgan'); end if;
  if v_promo.kind = 'summa' then v_discount := least(v_amount, v_promo.value);
  else v_discount := round(v_amount * v_promo.value / 100.0); end if;
  -- Faqat natija: kodlar ro‘yxati, limit, ishlatilgan soni qaytarilmaydi
  return jsonb_build_object('ok', true, 'code', v_code, 'kind', v_promo.kind, 'value', v_promo.value, 'discount', v_discount);
end $$;
revoke all on function public.check_promo(text, text, numeric) from public;
grant execute on function public.check_promo(text, text, numeric) to anon, authenticated;

-- 2) seminars ---------------------------------------------------------------------------------
drop policy if exists seminars_public_read on public.seminars;
create policy seminars_public_read on public.seminars
  for select to anon, authenticated
  using (published = true and status <> 'qoralama' and not hidden and not coalesce(is_test, false)
         and public.organizer_is_public(organizer_id));

-- anon jadvalni to‘liq o‘qiy olmaydi; faqat tickets/promo siyosatlari ishlatadigan ustunlar qoladi
revoke select on public.seminars from anon;
grant select (id, organizer_id, published, status, hidden, is_test) on public.seminars to anon;

create or replace view public.seminars_public with (security_barrier = true) as
select s.id, s.organizer_id, s.title, s.speaker, s.date_label, s.city, s.format, s.days, s.seats,
       greatest(s.seats - s.sold, 0) as seats_left,
       s.status, s.badge, s.image, s.topic, s.published, s.held, s.about, s.category, s.tags, s.cover,
       s.start_date, s.start_time, s.end_date, s.end_time, s.place, s.address, s.place_img, s.template,
       case when s.form is null then null
            else s.form - 'promos' - 'contactPhone' - 'cancelReason' - 'revenue' - 'sold' end as form,
       s.speakers, s.sort_at, s.created_at, s.updated_at,
       s.gallery, s.faq, s.venue_notes, s.cert_design, s.contact_telegram
  from public.seminars s
 where s.published = true and s.status <> 'qoralama' and not s.hidden and not coalesce(s.is_test, false)
   and public.organizer_is_public(s.organizer_id);
grant select on public.seminars_public to anon, authenticated;

-- 3) seller_products: test yozuvlar ommaviy emas -------------------------------------------------
drop policy if exists seller_products_public_read on public.seller_products;
create policy seller_products_public_read on public.seller_products
  for select to anon, authenticated
  using (status = 'active' and not coalesce(is_test, false) and public.seller_is_public(seller_id));


-- KRITIK: admin Kontent moderatsiyasi (seminar'dan boshqa barcha tablar) —
-- coalesce(updated_at timestamptz, sort_at integer) xatosi. updated_at NOT NULL (0013), shuning uchun to‘g‘ridan-to‘g‘ri.
create or replace function public.admin_content_list(p_kind text, p_q text default '', p_page int default 1, p_page_size int default 20)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_size int := least(50, greatest(1, coalesce(p_page_size, 20)));
  v_off int := (greatest(1, coalesce(p_page, 1)) - 1) * v_size;
  v_q text := lower(trim(coalesce(p_q, '')));
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  if p_kind = 'seminar' then
    return jsonb_build_object(
      'total', (select count(*) from public.seminars s where v_q = '' or lower(s.title) like '%'||v_q||'%'),
      'rows', coalesce((select jsonb_agg(x) from (
        select jsonb_build_object('id', s.id, 'title', s.title, 'owner', coalesce(p.name, '—'), 'hidden', s.hidden,
               'status', s.status, 'published', s.published, 'at', s.created_at) x
          from public.seminars s left join public.profiles p on p.id = s.organizer_id
         where v_q = '' or lower(s.title) like '%'||v_q||'%'
         order by s.created_at desc limit v_size offset v_off) q), '[]'::jsonb));
  end if;
  if p_kind not in ('ad', 'surplus', 'post', 'master', 'book', 'course', 'job', 'channel') then
    raise exception 'Bu bo‘lim moderatsiya qilinmaydi';
  end if;
  return jsonb_build_object(
    'total', (select count(*) from public.catalog_items c where c.kind = p_kind
               and (v_q = '' or lower(c.payload::text) like '%'||v_q||'%')),
    'rows', coalesce((select jsonb_agg(x) from (
      select jsonb_build_object('id', c.id, 'title', coalesce(c.payload->>'title', c.payload->>'name', c.payload->>'t', c.id::text),
             'owner', coalesce(p.name, c.payload->>'author', c.payload->>'company', c.payload->>'seller', '—'),
             'hidden', c.hidden, 'at', c.updated_at) x
        from public.catalog_items c left join public.profiles p on p.id = c.owner_id
       where c.kind = p_kind and (v_q = '' or lower(c.payload::text) like '%'||v_q||'%')
       order by c.sort_at desc nulls last limit v_size offset v_off) q), '[]'::jsonb));
end $$;
grant execute on function public.admin_content_list(text, text, int, int) to authenticated;

-- ===== Admin Tasdiqlashlar: hisoblagichlar va qatorlar Sotuvchilar 'Kutilmoqda' bilan bir xil =====
create or replace function public.admin_approvals_list_base(
  p_type text default 'all',
  p_q text default '',
  p_page int default 1,
  p_page_size int default 10
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_page int := greatest(1, coalesce(p_page, 1));
  v_size int := least(50, greatest(1, coalesce(p_page_size, 10)));
  v_off int := (v_page - 1) * v_size;
  v_q text := lower(trim(coalesce(p_q, '')));
  v_all jsonb; v_total bigint; v_rows jsonb; v_counts jsonb;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;

  select jsonb_build_object(
    'sellers', (select count(*) from public.profiles where coalesce(role,'')<>'admin' and seller_status='pending'),
    'organizers', (select count(*) from public.profiles where coalesce(role,'')<>'admin' and org_status='pending'),
    'ads', (select count(*) from public.seller_campaigns where status='moderatsiyada'),
    'products', (select count(*) from public.seller_products where status='review'),
    'seminars', (select count(*) from public.seminars where held = false and published = true and status = 'yakunlangan')
  ) into v_counts;

  with items as (
    select 'seller'::text as kind, p.id::text as id, coalesce(nullif(p.shop_name,''), p.name) as title,
           'Sotuvchi arizasi' as subtitle, p.name as sender, public.admin_mask_phone(p.phone) as phone,
           p.city, coalesce(p.seller_applied_at, p.created_at) as sent_at,
           coalesce(jsonb_array_length(p.seller_docs), 0) as docs, p.avatar as thumb
    from public.profiles p where coalesce(p.role,'')<>'admin' and p.seller_status='pending'
    union all
    select 'organizer', p.id::text, p.name, 'Tashkilotchi arizasi', p.name, public.admin_mask_phone(p.phone),
           p.city, p.created_at, 0, p.avatar
    from public.profiles p where coalesce(p.role,'')<>'admin' and p.org_status='pending'
    union all
    select 'ad', c.id::text, c.title, 'E’lon moderatsiyasi', coalesce(nullif(s.shop_name,''), s.name),
           public.admin_mask_phone(s.phone), s.city, c.created_at, 0, c.image_url
    from public.seller_campaigns c join public.profiles s on s.id=c.seller_id
    where c.status='moderatsiyada'
    union all
    select 'product', pr.id::text, pr.name, 'Mahsulot moderatsiyasi', coalesce(nullif(s.shop_name,''), s.name),
           public.admin_mask_phone(s.phone), s.city, pr.created_at,
           coalesce(jsonb_array_length(pr.documents), 0), pr.image_url
    from public.seller_products pr join public.profiles s on s.id=pr.seller_id
    where pr.status='review'
  )
  select coalesce(jsonb_agg(to_jsonb(i) order by i.sent_at desc), '[]'::jsonb) into v_all from items i
  where (p_type = 'all' or i.kind = p_type)
    and (v_q = '' or lower(i.title) like '%'||v_q||'%' or lower(i.sender) like '%'||v_q||'%' or lower(coalesce(i.city,'')) like '%'||v_q||'%');

  v_total := jsonb_array_length(v_all);
  select coalesce(jsonb_agg(e), '[]'::jsonb) into v_rows
  from jsonb_array_elements(v_all) with ordinality as t(e, ord)
  where ord > v_off and ord <= v_off + v_size;

  return jsonb_build_object('total', v_total, 'counts', v_counts, 'page', v_page, 'page_size', v_size, 'rows', coalesce(v_rows,'[]'::jsonb));
end $$;
revoke all on function public.admin_approvals_list_base(text, text, int, int) from public, anon;

create or replace function public.admin_pending_counts()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_s bigint; v_o bigint; v_a bigint; v_p bigint; v_d bigint;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  -- Sotuvchilar/Tashkilotchilar ro‘yxatidagi "Kutilmoqda" bilan bir xil manba: profiles holati
  select count(*) into v_s from public.profiles where coalesce(role,'')<>'admin' and seller_status = 'pending';
  select count(*) into v_o from public.profiles where coalesce(role,'')<>'admin' and org_status = 'pending';
  select count(*) into v_a from public.seller_campaigns where status = 'moderatsiyada';
  select count(*) into v_p from public.seller_products where status = 'review';
  select count(*) into v_d from public.profiles where license_status = 'pending';
  return jsonb_build_object('sellers', v_s, 'organizers', v_o, 'ads', v_a, 'products', v_p,
    'doctors', v_d, 'users', 0, 'seminars', 0, 'total', v_s + v_o + v_a + v_p + v_d);
end $$;
grant execute on function public.admin_pending_counts() to authenticated;
