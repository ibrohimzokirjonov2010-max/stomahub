-- Optional: lets signup detect an already-registered phone before calling auth.signUp.
-- Returns only a boolean (no profile data). Client works without it (falls back to error mapping).
create or replace function public.phone_registered(p_phone text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where phone = p_phone and coalesce(p_phone,'') <> '');
$$;
revoke all on function public.phone_registered(text) from public;
grant execute on function public.phone_registered(text) to anon, authenticated;
