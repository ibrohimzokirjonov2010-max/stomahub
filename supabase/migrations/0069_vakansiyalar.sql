-- 0069: Vakansiyalar — har qanday kirgan foydalanuvchi (shifokor) o‘zi vakansiya joylaydi. NOT applied automatically.
--   Mavjud catalog_items (kind='job') qayta ishlatiladi — yangi jadval yo‘q, hech qanday qator o‘chirilmaydi
--   (egasiz eski seed/demo vakansiyalar o‘z holicha qoladi; ilova ularni ko‘rsatmaydi).
--   job_guard (BEFORE INSERT/UPDATE, faqat kind='job'):
--     • egasi — auth.uid() (insertda majburan), updateda egasi va hidden o‘zgarmaydi (admin yashirgan bo‘lsa — yashirin qoladi);
--     • status: active | closed (yopish/qayta ochish);
--     • payload serverda QAYTA QURILADI (faqat ruxsat etilgan kalitlar) — begona URL/HTML maydonlar o‘tmaydi;
--       matnlardan <, > va boshqaruv belgilari olib tashlanadi, uzunliklar cheklanadi;
--     • majburiy: lavozim (3–80), klinika/ish beruvchi (2–100), shahar; ish turi ro‘yxatdan;
--       maosh ixtiyoriy (0 ≤ min ≤ max); aloqa: telefon (+998 XX XXX XX XX) va/yoki Telegram username.
--   RLS (0013/0018): insert/update/delete faqat owner_id = auth.uid() yoki admin — o‘zgarmaydi.
-- Takror ishga tushirish xavfsiz (idempotent).

create or replace function public.job_clean(p text, p_max int)
returns text language sql immutable set search_path = public as $$
  select left(trim(regexp_replace(regexp_replace(coalesce(p, ''), '[<>[:cntrl:]]', ' ', 'g'), '[[:space:]]+', ' ', 'g')), p_max)
$$;

-- Ko‘p qatorli matn (talablar/tavsif): qator ko‘chishi saqlanadi, qolgan boshqaruv belgilari va <, > olib tashlanadi
create or replace function public.job_clean_multi(p text, p_max int)
returns text language sql immutable set search_path = public as $$
  select left(trim(regexp_replace(regexp_replace(regexp_replace(coalesce(p, ''), E'\r', '', 'g'), E'[<>\\x01-\\x09\\x0b-\\x1f\\x7f]', ' ', 'g'), E'\n{3,}', E'\n\n', 'g')), p_max)
$$;

create or replace function public.job_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  j jsonb := coalesce(new.payload, '{}'::jsonb);
  v_title text; v_clinic text; v_city text; v_city_label text; v_address text; v_type text; v_spec text; v_exp text;
  v_about text; v_phone text; v_tg text; v_min numeric; v_max numeric; v_reqs jsonb := '[]'::jsonb; v_r text; v_status text;
begin
  if new.kind <> 'job' then return new; end if;

  if not coalesce(public.is_admin(), false) then
    if tg_op = 'INSERT' then
      if auth.uid() is null then raise exception 'job_auth: Vakansiya joylash uchun hisobingizga kiring'; end if;
      new.owner_id := auth.uid();
      new.hidden := false;          -- darhol e’lon qilinadi; admin keyin yashira oladi
      new.hidden_reason := null;
    else
      new.owner_id := old.owner_id;
      new.hidden := old.hidden;
      new.hidden_reason := old.hidden_reason;
      new.id := old.id;
    end if;
  end if;

  v_status := coalesce(nullif(trim(new.status), ''), nullif(j->>'status', ''), 'active');
  if v_status = 'sold' then v_status := 'closed'; end if;
  if v_status not in ('active', 'closed') then v_status := 'active'; end if;
  new.status := v_status;

  -- Faqat insertda yoki payload o‘zgarganda tekshiruv (status’ni yopish — payload’siz ham ishlaydi)
  if tg_op = 'INSERT' or new.payload is distinct from old.payload then
    v_title := public.job_clean(j->>'title', 80);
    v_clinic := public.job_clean(j->>'clinic', 100);
    v_city := lower(public.job_clean(j->>'city', 30));
    v_city_label := public.job_clean(coalesce(nullif(j->>'cityLabel', ''), j->>'city'), 60);
    v_address := public.job_clean(j->>'address', 160);
    v_type := coalesce(nullif(j->>'type', ''), 'full');
    v_spec := public.job_clean(j->>'spec', 30);
    v_exp := public.job_clean(j->>'exp', 10);
    v_about := public.job_clean_multi(j->>'about', 2000);
    v_phone := regexp_replace(coalesce(j->>'phone', ''), '\D', '', 'g');
    v_tg := regexp_replace(trim(coalesce(j->>'telegram', '')), '^(https?://)?(t\.me/|telegram\.me/)?@?', '', 'i');
    begin
      v_min := nullif(regexp_replace(coalesce(j->>'min', ''), '[^0-9]', '', 'g'), '')::numeric;
      v_max := nullif(regexp_replace(coalesce(j->>'max', ''), '[^0-9]', '', 'g'), '')::numeric;
    exception when others then raise exception 'job_salary: Maoshni to‘g‘ri kiriting';
    end;

    if length(v_title) < 3 then raise exception 'job_title: Lavozimni kiriting (kamida 3 belgi)'; end if;
    if length(v_clinic) < 2 then raise exception 'job_clinic: Klinika yoki ish beruvchi nomini kiriting'; end if;
    if v_city = '' or v_city !~ '^[a-z_]+$' then raise exception 'job_city: Shaharni tanlang'; end if;
    if v_type not in ('full', 'part', 'shift', 'remote') then raise exception 'job_type: Ish turini tanlang'; end if;
    if v_spec <> '' and v_spec !~ '^[a-z_]+$' then v_spec := ''; end if;
    if v_exp not in ('', 'none', 'y1', 'y3', 'y5') then v_exp := ''; end if;
    if v_min is not null and v_min > 10000000000 or v_max is not null and v_max > 10000000000 then
      raise exception 'job_salary: Maosh juda katta';
    end if;
    if v_min is not null and v_max is not null and v_min > v_max then
      raise exception 'job_salary: Maoshning «dan» qiymati «gacha» qiymatidan katta bo‘lmasin';
    end if;
    if v_phone <> '' and v_phone !~ '^998[0-9]{9}$' then raise exception 'job_phone: Telefon raqamini to‘liq kiriting (+998 XX XXX XX XX)'; end if;
    if v_tg <> '' and v_tg !~ '^[A-Za-z][A-Za-z0-9_]{4,31}$' then raise exception 'job_telegram: Telegram username noto‘g‘ri (5–32 belgi: harf, raqam, _)'; end if;
    if v_phone = '' and v_tg = '' then raise exception 'job_contact: Telefon yoki Telegram username kiriting'; end if;

    if jsonb_typeof(j->'requirements') = 'array' then
      for v_r in select value from jsonb_array_elements_text(j->'requirements') limit 20 loop
        v_r := public.job_clean(v_r, 200);
        if v_r <> '' then v_reqs := v_reqs || to_jsonb(v_r); end if;
      end loop;
    end if;

    new.payload := jsonb_build_object(
      'id', new.id, 'title', v_title, 'clinic', v_clinic, 'city', v_city, 'cityLabel', v_city_label,
      'address', v_address, 'district', '', 'type', v_type, 'spec', v_spec, 'exp', v_exp,
      'min', v_min, 'max', v_max, 'requirements', v_reqs, 'about', v_about,
      'phone', case when v_phone = '' then '' else '+' || v_phone end, 'telegram', v_tg,
      'posted', public.job_clean(j->>'posted', 30),
      'postedAt', coalesce(case when tg_op = 'UPDATE' then old.payload->>'postedAt' end, to_char(now() at time zone 'Asia/Tashkent', 'YYYY-MM-DD"T"HH24:MI:SS"+05:00"')),
      'ownerId', new.owner_id, 'user', true);
  end if;

  new.payload := jsonb_set(coalesce(new.payload, '{}'::jsonb), '{status}', to_jsonb(new.status), true);
  return new;
end $$;
revoke all on function public.job_guard() from public, anon, authenticated;

drop trigger if exists catalog_items_job_guard on public.catalog_items;
create trigger catalog_items_job_guard
  before insert or update on public.catalog_items
  for each row execute function public.job_guard();

notify pgrst, 'reload schema';
