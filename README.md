# RankMint

RankMint scores YouTube and X creators from live API data—no scraped CSVs, no fake demo profiles. Paste a handle on `/analyze` and you get authenticity, growth, brand fit, and a composite RankMint score you can compare side-by-side or save to a shortlist.

Built for people vetting micro UGC creators before a campaign, not for vanity follower counts.

## Tech stack

- **App:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Data:** YouTube Data API v3, X API v2 (Bearer token)
- **ML:** Python training script (`ml/train_model.py`) → logistic regression coefficients synced into the app; heuristic + embedding layers in TypeScript
- **Optional:** Supabase (Postgres + pgvector) for analysis cache, brand workspace, saved reports
- **Export:** PDF via pdf-lib
- **Tests:** Vitest

## Install and run

**Requirements:** Node 20+, npm. For retraining the model: Python 3 with the deps listed in `ml/README.md`.

```bash
git clone <your-repo-url>
cd Ratefluencer  
npm install
npm run env:setup   
```

Edit `.env.local` and add at least one platform key:

| Variable | Needed for |
|----------|------------|
| `YOUTUBE_API_KEY` | YouTube analysis |
| `X_API_BEARER_TOKEN` | X analysis |
| `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | Brand workspace, cache, shortlist (optional) |
| `OPENAI_API_KEY` | Optional; swaps in OpenAI embeddings for brand match instead of the built-in embedder |
| `ANALYSIS_CACHE_HOURS` | Cache TTL (default `6`) |

```bash
npm run dev
```

Open [http://localhost:3000/analyze](http://localhost:3000/analyze).

**Supabase (optional):** Run `supabase/setup.sql` in the Supabase SQL editor, then apply anything in `supabase/migrations/` you have not run yet. Check connectivity with:

```bash
node scripts/verify-supabase.mjs
```

**Production build:**

```bash
npm run build
npm start
```

**Retrain the campaign model:**

```bash
npm run ml:train    # runs Python trainer, then npm run ml:sync
```

## What the app does

| Area | Route | Notes |
|------|-------|--------|
| Analyze | `/analyze` | Single creator; pick which workspace brands to score |
| Full report | `/report/[platform]__[handle]` | Deeper breakdown + PDF export |
| Compare | `/compare` | Two creators, weighted by objective (ROI, brand safety, growth) |
| Brands | `/brands` | Add your own brands; embeddings stored per session |
| Shortlist | `/saved` | Saved reports (needs Supabase) |
| Leaderboard | `/leaderboard` | Batch run over a list of handles |
| Methodology | `/methodology` | Same story as below, in the UI |

---

## Where the numbers come from

Everything starts with a **live fetch**: channel/profile metadata plus recent posts (YouTube uploads or X tweets when the API tier allows). Those posts are turned into an `InfluencerProfile`—metrics, inferred signals, and optional audience demographics. Scores run in `src/lib/ml/`.

### Live vs modeled

**From the APIs:** handle, bio, followers, likes, comments, shares, saves/views where available, post timestamps, avatar.

**Computed in-app:** fraud-risk signals (ghost followers, pod patterns, etc.), growth features, ML scores, demographics (see below), brand similarity.

The report calls this out. If X does not return tweets (credits or tier limits), authenticity and engagement scores lean more on profile-level data.

### Authenticity (0–100)

Heuristic, not a third-party fraud API. We combine:

- Precomputed signals on the profile (`ghostFollowerEstimate`, `podActivityScore`, `botCommentPercent`, growth spikes, engagement variance)
- Feature extraction from recent post metrics (engagement rates, comment quality)

Risks for purchased followers, pods, bots, and artificial spikes are weighted and subtracted from a base authenticity feature. Very large accounts get a slight scale adjustment so mega-creators are not punished by the same raw thresholds as micro creators.

### Growth potential (0–100)

Modeled from posting consistency, recent follower growth, engagement momentum, and reach efficiency derived from the profile’s media history. Output is a single score plus a short forecast block on the report (90-day growth and audience expansion estimates).

Mega-tier creators may be **calibrated** down on growth and RankMint so the model (trained with micro UGC in mind) does not read unnaturally high.

### Brand match (0–100)

You define brands in the workspace (name, category, description, keywords). Each brand gets a text embedding—local by default, OpenAI if `OPENAI_API_KEY` is set.

For a creator we embed bio + handle + content context, cosine-similarity against selected brands, then rerank with weights you set on Analyze (niche fit, geography, engagement quality). Keyword hits in bio/handle add to the written rationale. Only brands you check for that run are scored; duplicates are deduped by name.

With Supabase, brand rows and optional pgvector RPC (`match_brands_by_embedding`) back the workspace.

### Campaign success (0–100%)

A **logistic regression** over engagement and consistency features (see `ml/campaign_labels.csv` and `ml/train_model.py`). Coefficients live in `src/lib/ml/coefficients.ts` after `npm run ml:sync`. The model outputs a probability, shown as a percentage on the report.

### RankMint™ score (0–100)

Same feature vector and trained weights as campaign success, passed through a sigmoid and scaled to 0–100. It is the headline “Ratefluencer” composite—meant to rank business impact, not raw followers. Feature importance bars on the full report show which inputs moved the needle most for that creator.

### Audience demographics

**Inferred**, not from platform audience APIs. We guess age bands, top countries, and gender split from creator location, niche keywords in bio/content, and platform-specific benchmarks. Reports label the source as inferred. Treat these as directional, not ad-platform grade.

### Caching

Repeated analysis of the same `platform + handle` within `ANALYSIS_CACHE_HOURS` reuses stored creator metrics (Supabase `analysis_cache` if configured, otherwise in-memory on the server). Brand matches are refreshed for your current workspace selection. Use “force refresh” on Analyze to bypass cache.

---

## Useful commands

```bash
npm run dev          # local dev
npm run build        # production build
npm run test         # vitest
npm run lint         # eslint
npm run ml:train     # retrain + sync coefficients
npm run env:setup    # ensure .env.local exists
```

More detail on the math and data sources: **[`/methodology`](http://localhost:3000/methodology)** when the app is running, or read `src/app/methodology/page.tsx` and `src/lib/ml/`.
