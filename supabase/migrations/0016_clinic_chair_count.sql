-- 0016_clinic_chair_count.sql
-- customer_clinic.chair_count for Mening klinikam schedule (Kreslo 1..N).
-- DO NOT auto-apply from the app; report for manual apply.

alter table public.customer_clinic
  add column if not exists chair_count integer not null default 0;

comment on column public.customer_clinic.chair_count is
  'Number of dental chairs (0 = schedule empty state until clinic configures).';

-- Clamp existing rows if any out-of-range values appear later via app.
-- App also clamps 0..12 on write.
