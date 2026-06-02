-- Drop linkedin from platform enum (YouTube + X only)
alter table public.analysis_cache
  drop constraint if exists analysis_cache_platform_check;

alter table public.analysis_cache
  add constraint analysis_cache_platform_check
  check (platform in ('youtube', 'x'));

delete from public.analysis_cache
  where platform not in ('youtube', 'x');
