-- 0046: Admin Kontent moderatsiyasi — Muallif ustuni.
-- 0045 dagi admin_content_list owner uchun payload->>'author' / ->>'seller' ishlatardi; postlarda va ortiqcha
-- materiallarda bu maydon JSON obyekt ({"name","avatar"}) bo‘lgani uchun admin jadvalida xom JSON chiqardi.
-- Endi obyekt bo‘lsa ->>'name' olinadi, avatar alohida 'owner_avatar' sifatida qaytadi, har bir qatorda 'kind' bor.
-- Ma'lumotlar o‘zgarmaydi (faqat funksiya qayta yaratiladi).
create or replace function public.admin_content_owner_text(v jsonb)
returns text language sql immutable as $$
  select case jsonb_typeof(v)
    when 'object' then nullif(coalesce(v->>'name', v->>'full_name', v->>'title'), '')
    when 'string' then nullif(v #>> '{}', '')
    else null end;
$$;

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
        select jsonb_build_object('kind', 'seminar', 'id', s.id, 'title', s.title, 'owner', coalesce(p.name, '—'), 'hidden', s.hidden,
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
      select jsonb_build_object('kind', c.kind, 'id', c.id,
             'title', coalesce(c.payload->>'title', c.payload->>'name', c.payload->>'t', c.id::text),
             'owner', coalesce(nullif(p.name, ''),
                               public.admin_content_owner_text(c.payload->'author'),
                               public.admin_content_owner_text(c.payload->'doctor'),
                               public.admin_content_owner_text(c.payload->'company'),
                               public.admin_content_owner_text(c.payload->'clinic'),
                               public.admin_content_owner_text(c.payload->'seller'), '—'),
             'owner_avatar', coalesce(c.payload->'author'->>'avatar', c.payload->'seller'->>'avatar'),
             'hidden', c.hidden, 'at', c.updated_at) x
        from public.catalog_items c left join public.profiles p on p.id = c.owner_id
       where c.kind = p_kind and (v_q = '' or lower(c.payload::text) like '%'||v_q||'%')
       order by c.sort_at desc nulls last limit v_size offset v_off) q), '[]'::jsonb));
end $$;
grant execute on function public.admin_content_list(text, text, int, int) to authenticated;
