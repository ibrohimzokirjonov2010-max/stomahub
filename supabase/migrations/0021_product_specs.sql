-- 0021: product characteristics (specs) for marketplace detail pages.
-- specs = JSON array of [label, value] pairs, e.g. [["Hajmi","4 x 4 g"],["Sterillik","Steril"]].
-- Idempotent. Run after 0020.
alter table public.seller_products add column if not exists specs jsonb not null default '[]'::jsonb;

drop function if exists public.market_products();
create function public.market_products()
returns table (id uuid, seller_id uuid, shop_name text, name text, sku text, category text, brand text,
  price numeric, stock integer, image_url text, images jsonb, variants jsonb, description text, unit text,
  created_at timestamptz, specs jsonb)
language sql stable security definer set search_path = public as $$
  select p.id, p.seller_id, coalesce(nullif(pr.shop_name, ''), pr.name, 'Sotuvchi'), p.name, p.sku, p.category, p.brand,
         p.price, p.stock, p.image_url, p.images, p.variants, p.description, p.unit, p.created_at, p.specs
    from public.seller_products p join public.profiles pr on pr.id = p.seller_id
   where p.status = 'active'
   order by p.created_at desc;
$$;
grant execute on function public.market_products() to anon, authenticated;
