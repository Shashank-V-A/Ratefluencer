-- =============================================================================
-- RankMint — paste ALL of this into Supabase → SQL Editor → Run
-- Do NOT paste the file path (supabase/migrations/...) — paste this SQL only
-- =============================================================================

create extension if not exists vector;

create table if not exists public.analysis_cache (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('youtube', 'x')),
  handle text not null,
  result jsonb not null,
  model_version text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (platform, handle)
);

create index if not exists analysis_cache_expires_idx on public.analysis_cache (expires_at);

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  name text not null,
  category text not null default '',
  description text not null default '',
  budget_tier text not null default 'growth' check (budget_tier in ('startup', 'growth', 'enterprise')),
  keywords text[] not null default '{}',
  embedding vector(1536),
  include_in_analysis boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists brands_session_idx on public.brands (session_id);

create table if not exists public.saved_reports (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  platform text not null,
  handle text not null,
  display_name text not null default '',
  rank_mint_score int not null default 0,
  analysis jsonb not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists saved_reports_session_idx on public.saved_reports (session_id, created_at desc);

create table if not exists public.shortlists (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  name text not null,
  report_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists shortlists_session_idx on public.shortlists (session_id);

alter table public.analysis_cache enable row level security;
alter table public.brands enable row level security;
alter table public.saved_reports enable row level security;
alter table public.shortlists enable row level security;

create index if not exists brands_embedding_hnsw_idx
  on public.brands using hnsw (embedding vector_cosine_ops);

create or replace function public.match_brands_by_embedding(
  query_embedding vector(1536),
  match_session_id text,
  match_count int default 12
)
returns table (
  id uuid,
  name text,
  category text,
  description text,
  budget_tier text,
  keywords text[],
  similarity float
)
language sql stable
as $$
  select
    b.id,
    b.name,
    b.category,
    b.description,
    b.budget_tier,
    b.keywords,
    1 - (b.embedding <=> query_embedding) as similarity
  from public.brands b
  where b.embedding is not null
    and b.session_id = match_session_id
  order by b.embedding <=> query_embedding
  limit match_count;
$$;
