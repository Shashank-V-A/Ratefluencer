# RankMint

AI-powered **creator intelligence** for **micro UGC creators** on **YouTube, X, and Instagram**.

All creator profiles come from **live platform APIs** — no demo dataset. **TikTok is not supported** (not in scope for this app).

## Features

- **RankMint™ score** — trained logistic regression (`ml/train_model.py` → `npm run ml:sync`)
- **Brand match** — local semantic embeddings + optional Supabase pgvector RAG + commerce rerank
- **Analysis cache** — Supabase-backed TTL cache (default 6h), optional
- **Brand workspace** — `/brands`
- **Saved shortlist** — `/saved` (optional Supabase)
- **Export** — PDF + share link on reports
- **Methodology** — `/methodology` — live vs modeled transparency

## Environment

Copy `.env.example` → `.env.local`:

| Variable | Required? | Purpose |
|----------|-----------|---------|
| `YOUTUBE_API_KEY` | For YouTube | YouTube Data API |
| `X_API_BEARER_TOKEN` | For X | X API v2 |
| `META_GRAPH_*` | For Instagram only | Instagram Graph API |
| `OPENAI_API_KEY` | **No** | Optional upgrade for brand-match embeddings |
| `NEXT_PUBLIC_SUPABASE_URL` | **No** | Cache, brands, saved reports |
| `SUPABASE_SERVICE_ROLE_KEY` | **No** | Server-side DB |
| `ANALYSIS_CACHE_HOURS` | **No** | Cache TTL (default 6) |

**You do not need OpenAI.** Brand match uses built-in semantic embeddings by default. Add `OPENAI_API_KEY` only if you want cloud embeddings (often slightly better brand brief matching).

### Supabase setup (optional)

1. In Supabase dashboard → **SQL Editor** → **New query**
2. Open **`supabase/setup.sql`** in your project and **copy the entire file contents**
3. Paste into the editor and click **Run** (do not paste the file path)

Or use the migration file: `supabase/migrations/20250601000000_rankmint_schema.sql` — same SQL, copy contents only.

Then add to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

(Service role key: Project Settings → API → `service_role` — never expose in frontend code.)

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
