-- 0035: buyer order reviews (stars + comment after 'yetkazildi'). NOT APPLIED automatically — review first.
-- seller_reviews (0003/0004) and its buyer insert policy already exist. This adds:
--   * one review per (order, product, author) — product_id null = whole order
--   * buyers can read their own reviews (so the UI knows what is already rated)
--   * anyone can read visible reviews (product / seller rating on the storefront)
--   * a guard so buyers cannot set seller-only fields on insert

create unique index if not exists seller_reviews_one_per_item
  on public.seller_reviews (order_id, coalesce(product_id, '00000000-0000-0000-0000-000000000000'::uuid), author_id)
  where order_id is not null and author_id is not null;

create index if not exists seller_reviews_product_idx on public.seller_reviews (product_id, created_at desc) where product_id is not null;

drop policy if exists seller_reviews_author_read on public.seller_reviews;
create policy seller_reviews_author_read on public.seller_reviews
  for select to authenticated using (author_id = auth.uid());

drop policy if exists seller_reviews_public_read on public.seller_reviews;
create policy seller_reviews_public_read on public.seller_reviews
  for select to anon, authenticated using (hidden = false);

-- buyer insert may not pre-fill seller reply / moderation fields
create or replace function public.seller_review_insert_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.author_id is not null and new.author_id = auth.uid() and new.seller_id <> auth.uid() then
    new.reply := '';
    new.replied_at := null;
    new.hidden := false;
    new.reported := false;
    new.report_reason := '';
    new.body := left(coalesce(new.body, ''), 1000);
  end if;
  return new;
end $$;
drop trigger if exists seller_reviews_insert_guard on public.seller_reviews;
create trigger seller_reviews_insert_guard before insert on public.seller_reviews
  for each row execute function public.seller_review_insert_guard();
