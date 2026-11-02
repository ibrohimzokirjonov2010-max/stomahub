-- 0037: avtomatik test (E2E) yozuvlarini YASHIRISH uchun is_test bayrog‘i. Hech narsa o‘chirilmaydi.
-- Faqat quyidagi aniq id lar belgilanadi. StomaHub rasmiy hisobi (142df471-...) mahsulotlari tegilmaydi.
alter table public.seller_products add column if not exists is_test boolean not null default false;
alter table public.profiles        add column if not exists is_test boolean not null default false;
alter table public.seminars        add column if not exists is_test boolean not null default false;

update public.seller_products set is_test = true where id in (
  '27b4a812-a98e-4aa2-94f8-2310c706470b', -- E2E Test Kompozit (sotilmaydi)
  '99a3d6a6-5daa-4b3c-80a3-45559dc741a4', -- Live New Product 1793124287782
  '929223a9-9670-4f7f-a3e5-354c3bd78748', -- E2E Alginat 1793046755
  '9a2a9348-cb67-4366-909a-f92d70ca8808', -- E2E Bonding Agent 1793046755
  '7ebc241c-8c81-457d-8f3b-31d92eca6874', -- E2E Kompozit UI 012932
  '8541e38c-9e48-44c0-93c0-851572364b1c'  -- E2E Kompozit A3 1793046755
);
update public.profiles set is_test = true where id in (
  '51a6e013-0e13-4959-8564-dec78c077d23', -- E2E Test Do‘kon
  '8efe0684-f01a-49be-8dc8-855f5d38a65f', -- E2E Dental Shop
  'b5fe098a-c909-47c7-8b48-b8cb386644b1'  -- E2E Shop 1793046755
);
update public.seminars set is_test = true where id in (
  'live-new-seminar-1793123677841-twjp',
  'e2e-test-seminar-sinov-ro-yxatdan-o--4rtb',
  'img-check-seminar-1793128555651-rbc0'
);

-- Ommaviy katalog test yozuvlarini qaytarmaydi (ustunlar 0029 bilan bir xil).
create or replace function public.market_products()
returns table (id uuid, seller_id uuid, shop_name text, name text, sku text, category text, brand text,
  price numeric, stock integer, image_url text, images jsonb, variants jsonb, description text, unit text,
  created_at timestamptz, specs jsonb, country text, expires_on date, documents jsonb,
  clinical_use text, delivery_info text, reorder jsonb, variant_type text, uom text, min_qty integer,
  price_tiers jsonb, reg_cert_no text, lot_no text, storage_temp text)
language sql stable security definer set search_path = public as $$
  select p.id, p.seller_id, coalesce(nullif(pr.shop_name, ''), pr.name, 'Sotuvchi'), p.name, p.sku, p.category, p.brand,
         p.price, p.stock, p.image_url, p.images, p.variants, p.description, p.unit, p.created_at, p.specs,
         p.country, p.expires_on, p.documents,
         p.clinical_use, p.delivery_info, p.reorder, p.variant_type, p.uom, p.min_qty,
         p.price_tiers, p.reg_cert_no, p.lot_no, p.storage_temp
    from public.seller_products p join public.profiles pr on pr.id = p.seller_id
   where p.status = 'active' and not p.is_test and not pr.is_test
   order by p.created_at desc;
$$;
grant execute on function public.market_products() to anon, authenticated;
