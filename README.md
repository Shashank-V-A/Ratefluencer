# RankMint

AI-powered **creator intelligence** for **micro UGC creators** on **YouTube, X, and LinkedIn**.

All creator profiles come from **live platform APIs** — no demo dataset. 

## Features

- **RankMint™ score** — trained logistic regression (`ml/train_model.py` → `npm run ml:sync`)
- **Brand match** — local semantic embeddings + optional Supabase pgvector RAG + commerce rerank
- **Analysis cache** — Supabase-backed TTL cache (default 6h), optional
- **Brand workspace** — `/brands`
- **Saved shortlist** — `/saved` (optional Supabase)
- **Export** — PDF + share link on reports
- **Methodology** — `/methodology` — live vs modeled transparency
- **Audience demographics** — inferred age, country, gender from public signals (Insights OAuth overrides when available)

## Environment

Copy `.env.example` → `.env.local`:

| Variable | Required? | Purpose |
|----------|-----------|---------|
| `YOUTUBE_API_KEY` | For YouTube | YouTube Data API |
| `X_API_BEARER_TOKEN` | For X | X API v2 |
| `LINKEDIN_OAUTH_*` | For LinkedIn | Sign in with LinkedIn (analyze your own profile) |
| `LINKEDIN_ACCESS_TOKEN` | Optional | Static token if you have partner API access |
| `OPENAI_API_KEY` | **No** | Optional upgrade for brand-match embeddings |
| `NEXT_PUBLIC_SUPABASE_URL` | **No** | Cache, brands, saved reports |
| `SUPABASE_SERVICE_ROLE_KEY` | **No** | Server-side DB |
| `ANALYSIS_CACHE_HOURS` | **No** | Cache TTL (default 6) |

**You do not need OpenAI.** Brand match uses built-in semantic embeddings by default. Add `OPENAI_API_KEY` only if you want cloud embeddings (often slightly better brand brief matching).


## Commands

```bash
npm install
npm run dev          # analyze at localhost:3000/analyze
npm run test         # vitest
npm run ml:train     # retrain + sync coefficients
npm run build
```

## Stack

Next.js 16 · TypeScript · Tailwind 4 · Supabase (optional) · pdf-lib · Vitest
