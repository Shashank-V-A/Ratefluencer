-- Replace instagram platform with linkedin in cache constraint
alter table public.analysis_cache
  drop constraint if exists analysis_cache_platform_check;

alter table public.analysis_cache
  add constraint analysis_cache_platform_check
  check (platform in ('youtube', 'x', 'linkedin'));

update public.analysis_cache
  set platform = 'linkedin'
  where platform = 'instagram';
