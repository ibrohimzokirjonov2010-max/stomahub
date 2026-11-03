-- 0070: Seminarga ro‘yxatdan o‘tish faqat kirgan foydalanuvchi uchun (QA C — auth & privacy).
-- Avval register_sale (security definer) anon roliga ham ochiq edi: mehmon customer_id = null bilan
-- ro‘yxat/to‘lov yozuvini yarata olardi. Endi faqat authenticated chaqira oladi.
-- Funksiya tanasi o‘zgarmaydi (seminar migratsiyalari bilan to‘qnashmaslik uchun) — faqat huquqlar.
-- Eslatma: keyingi migratsiyalarda `create or replace function public.register_sale` huquqlarni saqlaydi,
-- lekin `grant ... to anon` qayta yozilmasligi kerak.

revoke all on function public.register_sale(jsonb) from public;
revoke execute on function public.register_sale(jsonb) from anon;
grant execute on function public.register_sale(jsonb) to authenticated;
