alter table public.brands
  add column if not exists include_in_analysis boolean not null default true;
