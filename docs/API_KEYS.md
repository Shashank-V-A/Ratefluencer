# API keys setup (step by step)

Copy `.env.example` to `.env.local` in the project root, then follow the sections below.
Restart `npm run dev` after saving keys.

```bash
cp .env.example .env.local
```

---

## 1. YouTube — `YOUTUBE_API_KEY`

**What it is:** A Google Cloud API key for [YouTube Data API v3](https://developers.google.com/youtube/v3).

### Steps

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project (top bar → **Select project** → **New project**), or pick an existing one.
3. Enable the API:
   - Go to **APIs & Services** → **Library**.
   - Search **YouTube Data API v3** → open it → click **Enable**.
4. Create a key:
   - **APIs & Services** → **Credentials** → **+ Create credentials** → **API key**.
   - Copy the key shown in the dialog.
5. (Recommended) Restrict the key:
   - Click the key name → **API restrictions** → **Restrict key** → select **YouTube Data API v3** only.
   - For local dev you can leave unrestricted; for production add **Application restrictions** (HTTP referrers for your domain).
6. Paste into `.env.local`:
   ```env
   YOUTUBE_API_KEY=AIzaSy...
   ```

### Test in Ratefluencer

- **Analyze** → **Live APIs** → **YouTube** → handle `mkbhd`

### Quota note

Default quota is ~10,000 units/day. Each channel lookup uses several units. [Quota calculator](https://developers.google.com/youtube/v3/determine_quota_cost).

---

## 2. Instagram — `META_GRAPH_ACCESS_TOKEN` + `INSTAGRAM_BUSINESS_ACCOUNT_ID`

**What it is:** Meta’s official [Instagram Graph API](https://developers.facebook.com/docs/instagram-api/) **Business Discovery** — lookup *other* Instagram **Business** or **Creator** accounts (not personal profiles).

You need **your own** Instagram Professional account linked to a Facebook Page. That account’s ID and Page token are used to query others.

### Prerequisites (do this first)

1. Convert your Instagram account to **Professional** (Business or Creator):
   - Instagram app → **Profile** → **Menu** → **Account type and tools** → **Switch to professional account**.
2. Link Instagram to a **Facebook Page**:
   - Instagram → **Edit profile** → **Page** → connect/create a Facebook Page  
   - Or [Meta Business Suite](https://business.facebook.com/) → connect assets.
3. You must be **admin** of that Facebook Page.

### A. Create a Meta app

1. Go to [Meta for Developers](https://developers.facebook.com/).
2. **My Apps** → **Create App**.
3. Use case: **Other** → Next → type **Business** → Next.
4. App name (e.g. `Ratefluencer`) + contact email → **Create app**.
5. On the app dashboard, click **Add products** (or **Use cases**).
6. Add **Instagram** / **Manage messaging & content on Instagram** / **API setup with Instagram login** (wording varies; you need **Instagram Graph API**, not “Basic Display” — that product is deprecated).

### B. Configure permissions

In **App Dashboard** → **App settings** → **Basic**, note:

- **App ID**
- **App secret** (click **Show**)

For Graph API Explorer / token generation you typically need:

- `instagram_basic`
- `pages_show_list`
- `pages_read_engagement`
- `instagram_manage_insights` (helpful for media insights)

Business Discovery is documented under the Instagram Graph API; your app must be able to call `business_discovery` on your IG user node.

> **App mode:** In **Development**, only Instagram accounts added as **Instagram Testers** (Roles → Instagram Testers) can be used as *your* connected account. For production, submit **App Review** for required permissions.

### C. Get a short-lived User access token (Graph API Explorer)

1. Open [Graph API Explorer](https://developers.facebook.com/tools/explorer/).
2. **Meta App:** select your app.
3. **User or Page:** User Token.
4. **Permissions:** add the permissions listed above → **Generate Access Token**.
5. Log in with Facebook and approve.
6. Copy the token (starts with `EAA...`) — this is **short-lived** (~1–2 hours).

### D. Get your Page access token + Instagram Business Account ID

In Graph API Explorer, with your User token:

**Step 1 — List Facebook Pages you manage**

```
GET /me/accounts?fields=name,access_token,instagram_business_account
```

Click **Submit**. In the response, find the Page linked to your Instagram. You need:

| Field | Goes in `.env.local` |
|--------|----------------------|
| `access_token` (on that Page object) | `META_GRAPH_ACCESS_TOKEN` (intermediate; extend in step E) |
| `instagram_business_account.id` | `INSTAGRAM_BUSINESS_ACCOUNT_ID` |

Example response snippet:

```json
{
  "data": [
    {
      "name": "My Brand Page",
      "access_token": "EAAxxxxx",
      "instagram_business_account": { "id": "17841405793087218" }
    }
  ]
}
```

If `instagram_business_account` is missing, your Page is not linked to an Instagram Professional account — go back to Prerequisites.

**Step 2 — (Optional) Verify Business Discovery**

Replace `YOUR_IG_USER_ID` and `TARGET_USERNAME`:

```
GET /YOUR_IG_USER_ID?fields=business_discovery.username(TARGET_USERNAME){username,followers_count,media_count}
```

Use the same token. If this works, your setup is correct.

### E. Exchange for a long-lived Page token (recommended)

Page tokens from `/me/accounts` can be long-lived when derived from a long-lived user token.

**Extend user token to long-lived** (browser or curl):

```
GET https://graph.facebook.com/v21.0/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id=YOUR_APP_ID
  &client_secret=YOUR_APP_SECRET
  &fb_exchange_token=YOUR_SHORT_USER_TOKEN
```

Response includes `access_token` (long-lived user token, ~60 days).

**Get Page token again** with the long-lived user token:

```
GET /me/accounts?fields=access_token,instagram_business_account
```

Use the Page `access_token` as `META_GRAPH_ACCESS_TOKEN`.

> Meta also documents [refreshing long-lived tokens](https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived) before they expire.

### F. Add to `.env.local`

```env
META_GRAPH_ACCESS_TOKEN=EAAxxxxxxxx...
INSTAGRAM_BUSINESS_ACCOUNT_ID=17841405793087218
```

### Test in Ratefluencer

- **Analyze** → **Live APIs** → **Instagram** → a **Business/Creator** username (e.g. a brand), not a personal account.

### Common errors

| Error | Fix |
|--------|-----|
| `(#10) Application does not have permission` | Add permissions in Explorer; add yourself as tester; complete App Review for production |
| `business_discovery` empty / not found | Target must be IG Business/Creator; typo in username |
| No `instagram_business_account` on Page | Link IG Professional account to Facebook Page |

---

## 3. X (Twitter) — `X_API_BEARER_TOKEN`

**What it is:** [X API v2](https://developer.x.com/en/docs/twitter-api) **Bearer Token** (app-only auth) for reading public user profiles and tweets.

### App info (required to save settings)

When X asks for URLs, use (local dev):

| Field | Value |
|--------|--------|
| **Callback URI** | `http://127.0.0.1:3000/callback` |
| **Website URL** | `http://127.0.0.1:3000` |
| **Organization name** | `Ratefluencer` (or your name) |
| **Terms of Service** | `http://127.0.0.1:3000/terms` |
| **Privacy Policy** | `http://127.0.0.1:3000/privacy` |

After deploy, replace `127.0.0.1:3000` with your real domain (must be `https://` in production).

### Steps

1. Go to [developer.x.com](https://developer.x.com/) and sign in.
2. **Developer Portal** → **Projects & Apps** → **+ Create Project**.
3. Name the project → select use case (e.g. “Exploring the API”) → create an **App** under the project.
4. Open the app → **Keys and tokens** tab.
5. Under **Bearer Token**, click **Generate** (or **Regenerate**) → copy the token.  
   - If you only see API Key / Secret, you may need to enable **OAuth 2.0** or use the **Bearer Token** section in the app’s **User authentication settings** — for app-only reads, Bearer Token is standard on v2 apps.
6. **App permissions** (Settings → **User authentication settings** or app permissions):
   - Enable **Read** for users and tweets (`users.read`, `tweet.read` in OAuth 2.0 scopes).
7. Paste into `.env.local`:
   ```env
   X_API_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAA...
   ```

### Access tiers (important)

| Tier | Tweet history | Notes |
|------|----------------|-------|
| **Free** | Very limited | Often cannot read full user tweet timelines |
| **Basic** (~$100/mo) | Up to recent tweets | Suitable for Ratefluencer-style analysis |
| **Pro** | Higher volume | For production scale |

If Analyze returns **403** on tweets, your tier likely blocks `GET /2/users/:id/tweets` — upgrade or enable the right product on the developer portal.

### Test in Ratefluencer

- **Analyze** → **Live APIs** → **X** → handle `naval` or `OpenAI`

### Optional alias

```env
TWITTER_BEARER_TOKEN=same_as_above
```

Either variable name works in this project.

---

## 4. Verify everything

1. Save `.env.local` (never commit it — it should be in `.gitignore`).
2. Restart the dev server: `Ctrl+C` then `npm run dev`.
3. Open [http://localhost:3000/settings](http://localhost:3000/settings) — each platform should show **Connected**.
4. Or call:
   ```bash
   curl http://localhost:3000/api/platforms/status
   ```

---

## Security checklist

- Do **not** commit `.env.local` or paste keys in chat/screenshots.
- Restrict YouTube keys by API + referrer in production.
- Rotate X Bearer Token if exposed.
- Meta tokens expire — calendar a refresh before 60 days for long-lived user tokens.

---

## Quick reference

| Variable | Where to get it |
|----------|------------------|
| `YOUTUBE_API_KEY` | Google Cloud Console → Credentials → API key |
| `META_GRAPH_ACCESS_TOKEN` | Graph API Explorer → `/me/accounts` → Page `access_token` (long-lived) |
| `INSTAGRAM_BUSINESS_ACCOUNT_ID` | Same response → `instagram_business_account.id` |
| `X_API_BEARER_TOKEN` | developer.x.com → Your app → Keys and tokens → Bearer Token |
