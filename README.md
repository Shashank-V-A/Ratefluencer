# RankMint

AI-powered **creator intelligence** for **micro UGC & short-form commerce creators**.

All creator data comes from **live APIs** — no mock profiles or demo dataset.

## Live platform APIs

| Platform | API | Env variables |
|----------|-----|----------------|
| **YouTube** | [Data API v3](https://developers.google.com/youtube/v3) | `YOUTUBE_API_KEY` |
| **X** | [API v2](https://developer.x.com/en/docs/twitter-api) | `X_API_BEARER_TOKEN` |
| **Instagram** (optional) | [Graph API Business Discovery](https://developers.facebook.com/docs/instagram-api/guides/business-discovery) | `META_GRAPH_ACCESS_TOKEN`, `INSTAGRAM_BUSINESS_ACCOUNT_ID` |

## Quick start

```bash
cp .env.example .env.local
# Add YOUTUBE_API_KEY and X_API_BEARER_TOKEN to .env.local
npm install
npm run dev
```

Open [http://localhost:3000/analyze](http://localhost:3000/analyze).

## API

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"platform":"youtube","handle":"mkbhd"}'
```

## Stack

Next.js 16 · TypeScript · Tailwind 4 · shadcn/ui · Recharts
