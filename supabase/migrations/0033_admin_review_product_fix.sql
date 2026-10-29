-- 0033: admin_review_product rejected 'review' products whose seller has role 'admin'
-- (official StomaHub account), so they could never leave the queue although the queue
-- and pending counts list them. Allow reviewing any product in 'review' and return
-- specific Uzbek errors.
create or replace function public.admin_review_product(p_id uuid, p_approve boolean, p_reason text default '')
returns void language plpgsql security definer set search_path = public as $$
declare v_status text;
begin
  if not public.is_admin() then raise exception 'Faqat administrator uchun'; end if;
  if not p_approve and length(trim(coalesce(p_reason, ''))) < 3 then raise exception 'Rad etish sababini yozing'; end if;
  select status into v_status from public.seller_products where id = p_id for update;
  if not found then raise exception 'Mahsulot topilmadi'; end if;
  if v_status <> 'review' then
    raise exception 'Mahsulot tekshiruvda emas (holati: %), sahifani yangilang', v_status;
  end if;
  update public.seller_products
     set status = case when p_approve then 'active' else 'rejected' end,
         reject_reason = case when p_approve then '' else trim(p_reason) end, updated_at = now()
   where id = p_id;
end $$;
grant execute on function public.admin_review_product(uuid, boolean, text) to authenticated;
