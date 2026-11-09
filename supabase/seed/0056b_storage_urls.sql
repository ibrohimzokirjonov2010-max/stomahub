-- 0056b: Namuna rasmlari Storage'ga ko'chirilgandan keyin URL'larni yangilash (qayta ishga tushirish xavfsiz).
-- 1) Dentashop: eski kirill nomli storage_path (demo/dentashop/pNN-<nom>.jpg) -> ASCII demo/dentashop/pNN.jpg.
--    Faqat hali eski ko'rinishdagi yozuvlar o'zgaradi; ikkinchi marta ishga tushirilganda hech narsa topilmaydi.
-- 2) image_url / logo_url ni public 'seller-media' bucket URL'iga o'rnatish (idempotent).
begin;

update public.demo_items i
   set extra = jsonb_set(i.extra, '{storage_path}',
                 to_jsonb('demo/dentashop/' || substring(i.extra->>'storage_path' from '^demo/dentashop/(p[0-9]{2})-') || '.jpg'))
  from public.demo_entities e
 where e.id = i.entity_id
   and e.slug = 'dentashop'
   and i.extra->>'storage_path' ~ '^demo/dentashop/p[0-9]{2}-.+[.]jpg$';

update public.demo_items set image_url = 'https://agmkoeuhqrwdvrreamhj.supabase.co/storage/v1/object/public/seller-media/' || (extra->>'storage_path') where extra ? 'storage_path';
update public.demo_entities set logo_url = 'https://agmkoeuhqrwdvrreamhj.supabase.co/storage/v1/object/public/seller-media/' || 'demo/asia-stom-plus/logo.png' where slug = 'asia-stom-plus';
update public.demo_entities set logo_url = 'https://agmkoeuhqrwdvrreamhj.supabase.co/storage/v1/object/public/seller-media/' || 'demo/dental-academy/logo.jpg' where slug = 'dental-academy';
update public.demo_entities set logo_url = 'https://agmkoeuhqrwdvrreamhj.supabase.co/storage/v1/object/public/seller-media/' || 'demo/dental-goods/logo.png' where slug = 'dental-goods';
update public.demo_entities set logo_url = 'https://agmkoeuhqrwdvrreamhj.supabase.co/storage/v1/object/public/seller-media/' || 'demo/dental-trading/logo.svg' where slug = 'dental-trading';
update public.demo_entities set logo_url = 'https://agmkoeuhqrwdvrreamhj.supabase.co/storage/v1/object/public/seller-media/' || 'demo/dentalkorzina/logo.jpg' where slug = 'dentalkorzina';
update public.demo_entities set logo_url = 'https://agmkoeuhqrwdvrreamhj.supabase.co/storage/v1/object/public/seller-media/' || 'demo/dentashop/logo.png' where slug = 'dentashop';
update public.demo_entities set logo_url = 'https://agmkoeuhqrwdvrreamhj.supabase.co/storage/v1/object/public/seller-media/' || 'demo/dentoptics/logo.jpg' where slug = 'dentoptics';
update public.demo_entities set logo_url = 'https://agmkoeuhqrwdvrreamhj.supabase.co/storage/v1/object/public/seller-media/' || 'demo/dentrade/logo.png' where slug = 'dentrade';
update public.demo_entities set logo_url = 'https://agmkoeuhqrwdvrreamhj.supabase.co/storage/v1/object/public/seller-media/' || 'demo/diamond-dental-education/logo.jpg' where slug = 'diamond-dental-education';
update public.demo_entities set logo_url = 'https://agmkoeuhqrwdvrreamhj.supabase.co/storage/v1/object/public/seller-media/' || 'demo/dk-study/logo.jpg' where slug = 'dk-study';
update public.demo_entities set logo_url = 'https://agmkoeuhqrwdvrreamhj.supabase.co/storage/v1/object/public/seller-media/' || 'demo/marva-education/logo.jpg' where slug = 'marva-education';
update public.demo_entities set logo_url = 'https://agmkoeuhqrwdvrreamhj.supabase.co/storage/v1/object/public/seller-media/' || 'demo/med-book/logo.jpg' where slug = 'med-book';
update public.demo_entities set logo_url = 'https://agmkoeuhqrwdvrreamhj.supabase.co/storage/v1/object/public/seller-media/' || 'demo/meed-books/logo.png' where slug = 'meed-books';
update public.demo_entities set logo_url = 'https://agmkoeuhqrwdvrreamhj.supabase.co/storage/v1/object/public/seller-media/' || 'demo/pro-dental-tech/logo.jpg' where slug = 'pro-dental-tech';
update public.demo_entities set logo_url = 'https://agmkoeuhqrwdvrreamhj.supabase.co/storage/v1/object/public/seller-media/' || 'demo/sarus/logo.jpg' where slug = 'sarus';
update public.demo_entities set logo_url = 'https://agmkoeuhqrwdvrreamhj.supabase.co/storage/v1/object/public/seller-media/' || 'demo/stom-books/logo.jpg' where slug = 'stom-books';
update public.demo_entities set logo_url = 'https://agmkoeuhqrwdvrreamhj.supabase.co/storage/v1/object/public/seller-media/' || 'demo/stomatologiya-kitoblar/logo.jpg' where slug = 'stomatologiya-kitoblar';

commit;
