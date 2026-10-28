-- 0030: Tashkilotchi kabineti auditi.
-- DIQQAT: HALI QO'LLANMAGAN. Frontend test seminarlarni allaqachon yashiradi (organizer/reconcile.js isTestSeminar)
-- va o'tgan seminarlarni Toshkent vaqti bo'yicha "Yakunlangan" deb ko'rsatadi (ro'yxat yopiq).
-- Qo'llashdan oldin zaxira oling va quyidagi ID'lar haqiqatan test ekanini tasdiqlang.
-- Sxema o'zgarmaydi: yangi wizard maydonlari seminars.form (jsonb), early-bird tickets/form ichida,
-- yuridik ma'lumotlar va onboarding organizer_settings.marketing (jsonb) ichida saqlanadi.
begin;

-- 1) Test seminarlar va ularga bog'liq yozuvlar
create temporary table _test_sem(id text primary key) on commit drop;
insert into _test_sem(id) values
  ('baza-test-seminari-d20n'),
  ('e2e-sem-1793107044805'),
  ('live-new-seminar-1793123677841-twjp'),
  ('img-check-seminar-1793128555651-rbc0');

delete from public.certificates  where seminar_id in (select id from _test_sem);
delete from public.payments      where seminar_id in (select id from _test_sem);
delete from public.registrations where seminar_id in (select id from _test_sem);
delete from public.promo_codes   where seminar_id in (select id from _test_sem);
delete from public.tickets       where seminar_id in (select id from _test_sem);
delete from public.seminars      where id in (select id from _test_sem);

-- 2) O'tgan seminarlar -> yakunlangan (Toshkent vaqti)
update public.seminars
   set status = 'yakunlangan', badge = 'Yakunlangan', updated_at = now()
 where status in ('faol', 'rejalashtirilgan', 'jarayonda')
   and coalesce(end_date, start_date) is not null
   and coalesce(end_date, start_date)::date < (now() at time zone 'Asia/Tashkent')::date;

-- 3) Saqlangan hisoblagichlarni haqiqiy to'lovlardan qayta hisoblash
--    (frontend reconcile.js allaqachon shunday ko'rsatadi; ixtiyoriy)
update public.seminars s
   set sold = coalesce(r.cnt, 0)
  from (select seminar_id, count(*) cnt from public.registrations
         where coalesce(pay, '') <> 'cancel' group by seminar_id) r
 where r.seminar_id = s.id and s.sold is distinct from r.cnt;

commit;
