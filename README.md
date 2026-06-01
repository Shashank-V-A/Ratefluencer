# Ratefluencer

AI-powered **Influencer Intelligence Engine** for **micro UGC & short-form commerce creators**.

Rank creators by predicted business impact, not follower count.

## Live platform APIs

| Platform | API | Env variables |
|----------|-----|----------------|
| **Instagram** | [Graph API Business Discovery](https://developers.facebook.com/docs/instagram-api/guides/business-discovery) | `META_GRAPH_ACCESS_TOKEN`, `INSTAGRAM_BUSINESS_ACCOUNT_ID` |
| **YouTube** | [Data API v3](https://developers.google.com/youtube/v3) | `YOUTUBE_API_KEY` |
| **X** | [API v2](https://developer.x.com/en/docs/twitter-api) | `X_API_BEARER_TOKEN` |

### Setup

1. Copy `.env.example` → `.env.local`
2. Follow **[docs/API_KEYS.md](docs/API_KEYS.md)** for step-by-step key instructions (YouTube, Instagram, X)
3. Restart the dev server
4. Open **[/settings](http://localhost:3000/settings)** to confirm which APIs are connected

```bash
cp .env.example .env.local
npm install
npm run dev
```

### Analyze (live)

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"platform":"youtube","handle":"mkbhd","source":"live"}'
```

### Demo dataset (no keys)

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"handle":"priya.glowdiaries","source":"demo"}'
```

## Features

| Engine | Output |
|--------|--------|
| **Data collection** | Live followers, likes, comments, views, posting frequency |
| **Authenticity detection** | Heuristics on real post metrics → **0–100** |
| **Growth prediction** | 90-day forecasts → **0–100** |
| **Brand matching** | Embeddings + RAG-style brand retrieval → **0–100** |
| **Ratefluencer™ ML** | Ensemble campaign-success model → **0–100** |

## API routes

| Route | Description |
|-------|-------------|
| `GET /api/platforms/status` | Which APIs are configured |
| `POST /api/analyze` | `{ platform, handle, source: "live" \| "demo" }` |
| `GET /api/report/[id]` | Full report (`instagram__handle` or demo id) |
| `GET /api/creators` | Demo rankings |

## ML training (offline)

`ml/train_model.py` — train logistic regression and export coefficients.

## Stack

Next.js 16 · TypeScript · Tailwind 4 · shadcn/ui · Recharts
