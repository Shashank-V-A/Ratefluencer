-- Remove duplicate brand rows (keep newest per session + name)
delete from public.brands b
using public.brands newer
where b.session_id = newer.session_id
  and lower(trim(b.name)) = lower(trim(newer.name))
  and b.created_at < newer.created_at;

-- One-time removal of legacy auto-seeded catalog (user workspace = own brands only)
delete from public.brands
where name in (
  'dbrand',
  'Notion',
  'Samsung Mobile',
  'Anker',
  'Nothing',
  'Glowlane Skincare',
  'CartDrop',
  'Campus Brew Co.',
  'Threadline',
  'NestBox Home',
  'PulseFit'
);

create unique index if not exists brands_session_name_unique_idx
  on public.brands (session_id, lower(trim(name)));
