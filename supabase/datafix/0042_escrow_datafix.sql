-- 0042_escrow_datafix.sql — IXTIYORIY ma’lumot tuzatish. Migratsiya EMAS, avtomatik ishlamaydi.
-- 0042_real_escrow.sql qo‘llangandan KEYIN, Supabase SQL Editor’da (postgres roli) qo‘lda ishga tushiring.
-- Avval 1-qismni (faqat SELECT) ishga tushirib sonlarni tekshiring; keyin 2-qismni.
-- Holat 2026-11-02 (read-only so‘rov): A=2, B=0, C=0, D=4, E=1, F=6.

-- 1. Ta’sirlanadigan qatorlar (faqat o‘qish)
select
  count(*) filter (where public.order_is_demo(o) and o.payment_status in ('paid','held','released'))                     as a_demo_online_paid,
  count(*) filter (where not public.order_is_demo(o) and o.payment_method in ('uzcard','humo','card')
                     and o.payment_status in ('paid','held','released'))                                                 as b_card_paid_unverified,
  count(*) filter (where o.payment_method in ('click','payme') and o.payment_status in ('paid','held','released')
                     and not exists (select 1 from public.payment_transactions t where t.order_id = o.id
                                      and t.provider = o.payment_method and t.state = 'paid'))                          as c_online_paid_no_callback,
  count(*) filter (where coalesce(o.payment_method,'cash') in ('cash','naqd') and o.status = 'yetkazildi' and o.payment_status <> 'paid')       as d_cash_delivered,
  count(*) filter (where coalesce(o.payment_method,'cash') in ('cash','naqd') and o.status = 'bekor_qilindi' and o.payment_status <> 'failed') as e_cash_cancelled,
  count(*) filter (where coalesce(o.payment_method,'cash') in ('cash','naqd') and o.status not in ('yetkazildi','bekor_qilindi')
                     and o.payment_status <> 'pending')                                                                   as f_cash_open
from public.seller_orders o;

-- 2. Tuzatish (bitta tranzaksiya). Sotuvchiga to‘lov reestriga (ledger) HECH NARSA yozilmaydi.
begin;
-- A/B/C: tasdiqlanmagan onlayn "to‘lovlar" (demo kartalar) — haqiqiy pul yo‘q.
update public.seller_orders o set payment_status = case when o.status = 'bekor_qilindi' then 'failed' else 'pending' end,
       note = left(coalesce(o.note,'') || ' [0042: tasdiqlanmagan to‘lov bekor]', 1000)
 where o.payment_status in ('paid','held','released')
   and coalesce(o.payment_method,'cash') not in ('cash','naqd')
   and (public.order_is_demo(o)
        or o.payment_method in ('uzcard','humo','card')
        or not exists (select 1 from public.payment_transactions t where t.order_id = o.id and t.provider = o.payment_method and t.state = 'paid'));
-- D: naqd yetkazilgan → to‘langan (komissiya qarzi hisoblanadi)
update public.seller_orders set payment_status = 'paid'
 where coalesce(payment_method,'cash') in ('cash','naqd') and status = 'yetkazildi' and payment_status <> 'paid';
-- E: naqd bekor → failed
update public.seller_orders set payment_status = 'failed'
 where coalesce(payment_method,'cash') in ('cash','naqd') and status = 'bekor_qilindi' and payment_status <> 'failed';
-- F: naqd ochiq buyurtma → Kutilmoqda (naqd hech qachon escrow emas)
update public.seller_orders set payment_status = 'pending'
 where coalesce(payment_method,'cash') in ('cash','naqd') and status not in ('yetkazildi','bekor_qilindi') and payment_status <> 'pending';
commit;
