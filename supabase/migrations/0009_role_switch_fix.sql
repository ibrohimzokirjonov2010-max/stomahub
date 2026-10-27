-- 0009: fix for 0007 profile_self_guard, which froze `role` on every self-update and
-- so broke "Sotuvchi bo'lish" (customer -> seller) and organizer onboarding.
-- Users may switch between customer / organizer / seller themselves; nobody can
-- grant or drop `admin` from the client. bonus and plus stay server-only. Idempotent.
create or replace function public.profile_self_guard()
returns trigger language plpgsql as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') then return new; end if;
  if tg_op = 'UPDATE' then
    if new.role is distinct from old.role and (
         old.role = 'admin' or new.role not in ('customer', 'organizer', 'seller')
       ) then
      new.role := old.role;
    end if;
    new.bonus := old.bonus;
    new.plus := old.plus;
  elsif tg_op = 'INSERT' then
    if new.role not in ('customer', 'organizer', 'seller') then new.role := 'customer'; end if;
    new.bonus := 0;
    new.plus := false;
  end if;
  return new;
end $$;
drop trigger if exists profiles_self_guard on public.profiles;
create trigger profiles_self_guard before insert or update on public.profiles
  for each row execute function public.profile_self_guard();
