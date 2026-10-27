-- full_name mirrors Ism familiya; name kept for backward compatibility
alter table public.profiles
  add column if not exists full_name text not null default '';

update public.profiles
set full_name = name
where (full_name is null or full_name = '') and name is not null and name <> '';
