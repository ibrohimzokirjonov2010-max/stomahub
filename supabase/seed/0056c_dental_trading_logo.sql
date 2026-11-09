-- 0056c: Dental Trading logosi. logo.svg avval image/jpeg sifatida yuklangan, CDN eski turini keshlab qolgan,
-- shuning uchun to'g'ri Content-Type (image/svg+xml) bilan yangi kalitga yuklandi. Qayta ishga tushirish xavfsiz.
update public.demo_entities
   set logo_url = 'https://agmkoeuhqrwdvrreamhj.supabase.co/storage/v1/object/public/seller-media/demo/dental-trading/logo-v2.svg'
 where slug = 'dental-trading';
