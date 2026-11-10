-- 0063b NAMUNA (demo) kontentni olib tashlash.
-- QO‘LDA QO‘LLANADI — faqat Ibrohim roziligi bilan. Faqat is_demo = true va egasi yo‘q qatorlarni o‘chiradi.
-- Haqiqiy e’lonlar, StomaHub Market mahsulotlari va buyurtmalarga tegmaydi. Qayta ishga tushirish xavfsiz.

delete from public.catalog_items
 where is_demo = true
   and owner_id is null
   and kind in ('uniform', 'master', 'surplus', 'ad');

-- is_demo ustuni va catalog_items_demo_guard qoldiriladi (zararsiz; keyingi namunalar uchun ham kerak).
-- Tekshiruv (kutilgan: 0 qator):
-- select kind, count(*) from public.catalog_items where is_demo group by kind;
