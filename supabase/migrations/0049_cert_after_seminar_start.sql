-- 0049 (QA2 #3): sertifikatni seminar boshlanishidan oldin berib bo‘lmaydi.
-- Mijoz certificates jadvalini to‘g‘ridan-to‘g‘ri yangilaydi (pushCert), shuning uchun cheklov trigger orqali.
-- Seminar boshlanishi: start_date + start_time, Asia/Tashkent vaqti. Sana bo‘lmagan eski yozuvlar tekshirilmaydi.
-- Mavjud qatorlar o‘zgartirilmaydi (trigger faqat yangi 'done' holatiga o‘tishda ishlaydi).

create or replace function public.cert_issue_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_start timestamptz;
  s record;
begin
  if new.state is distinct from 'done' then return new; end if;
  if tg_op = 'UPDATE' and old.state = 'done' then return new; end if;
  if new.seminar_id is null then return new; end if;
  select start_date, start_time into s from public.seminars where id = new.seminar_id;
  if not found or coalesce(s.start_date, '') !~ '^\d{4}-\d{2}-\d{2}' then return new; end if;
  begin
    v_start := ((left(s.start_date, 10) || ' ' ||
      case when coalesce(s.start_time, '') ~ '^\d{1,2}:\d{2}$' then s.start_time else '00:00' end)::timestamp)
      at time zone 'Asia/Tashkent';
  exception when others then
    return new;
  end;
  if now() < v_start then
    raise exception 'Sertifikat seminar boshlangandan keyin beriladi (%)', to_char(v_start at time zone 'Asia/Tashkent', 'DD.MM.YYYY HH24:MI')
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists certificates_issue_guard on public.certificates;
create trigger certificates_issue_guard
  before insert or update of state on public.certificates
  for each row execute function public.cert_issue_guard();

-- QA2 B: tashkilotchi sertifikatni "Berildi" qiladi (certificates.state = 'done'), lekin shifokor profili
-- customer_certificates (user_id bo‘yicha) jadvalini o‘qiydi — ikkalasini hech narsa bog‘lamas edi.
-- certificates.id = 'cert-<registrations.id>'; registrations.customer_id = shifokor. Berilganda nusxa yoziladi.
-- Faqat yangi 'done' o‘tishlarida ishlaydi; mavjud qatorlar o‘zgartirilmaydi (backfill yo‘q).
create or replace function public.cert_to_customer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
begin
  if new.state is distinct from 'done' then return new; end if;
  if tg_op = 'UPDATE' and old.state = 'done' then return new; end if;
  select r.customer_id into v_user from public.registrations r
   where r.id = regexp_replace(new.id, '^cert-', '') and (new.seminar_id is null or r.seminar_id = new.seminar_id);
  if v_user is null then return new; end if;
  insert into public.customer_certificates (user_id, course_id, title, issued_at, file_url)
  values (v_user, 'seminar:' || coalesce(new.seminar_id, new.id), coalesce(nullif(new.seminar_title, ''), 'Seminar sertifikati'),
          public.tashkent_today(), '')
  on conflict (user_id, course_id) do update set title = excluded.title, issued_at = excluded.issued_at;
  return new;
end;
$$;

drop trigger if exists certificates_to_customer on public.certificates;
create trigger certificates_to_customer
  after insert or update of state on public.certificates
  for each row execute function public.cert_to_customer();
