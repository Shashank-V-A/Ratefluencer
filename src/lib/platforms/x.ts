import { getXBearerToken, getXStatus } from "@/lib/env";
import { fetchJson } from "./http";
import type { FetchedCreatorRaw, FetchedMediaItem } from "./types";
import { PlatformApiError } from "./types";

const X_API = "https://api.twitter.com/2";

interface XUserResponse {
  data?: {
    id: string;
    name: string;
    username: string;
    description?: string;
    location?: string;
    profile_image_url?: string;
    public_metrics?: {
      followers_count?: number;
      following_count?: number;
      tweet_count?: number;
      listed_count?: number;
    };
  };
  errors?: { detail?: string; title?: string }[];
}

interface XTweetsResponse {
  data?: {
    id: string;
    text?: string;
    created_at?: string;
    public_metrics?: {
      retweet_count?: number;
      reply_count?: number;
      like_count?: number;
      quote_count?: number;
      impression_count?: number;
      bookmark_count?: number;
    };
  }[];
  meta?: { result_count?: number };
  errors?: { detail?: string }[];
}

function normalizeHandle(handle: string): string {
  return handle.replace(/^@/, "").trim();
}

function mapTweets(data: XTweetsResponse["data"]): FetchedMediaItem[] {
  const media: FetchedMediaItem[] = [];
  for (const t of data ?? []) {
    const pm = t.public_metrics;
    media.push({
      id: t.id,
      caption: t.text ?? "",
      likes: pm?.like_count ?? 0,
      comments: pm?.reply_count ?? 0,
      views: pm?.impression_count ?? 0,
      shares: (pm?.retweet_count ?? 0) + (pm?.quote_count ?? 0),
      saves: pm?.bookmark_count ?? 0,
      timestamp: t.created_at ?? new Date().toISOString(),
      mediaType: "tweet",
    });
  }
  return media.sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export async function fetchXCreator(handle: string): Promise<FetchedCreatorRaw> {
  const status = getXStatus();
  if (!status.configured) {
    throw new PlatformApiError(
      "X API is not configured",
      "NOT_CONFIGURED",
      503,
      `Add X_API_BEARER_TOKEN to .env.local (see docs/API_KEYS.md).`
    );
  }

  const token = getXBearerToken()!;
  const username = normalizeHandle(handle);

  const userRes = await fetchJson<XUserResponse>(
    `${X_API}/users/by/username/${encodeURIComponent(username)}?user.fields=public_metrics,description,location,profile_image_url`,
    { bearerToken: token }
  );

  if (userRes.errors?.length || !userRes.data) {
    throw new PlatformApiError(
      userRes.errors?.[0]?.detail ?? `X user @${username} not found`,
      "NOT_FOUND",
      404
    );
  }

  const user = userRes.data;
  let media: FetchedMediaItem[] = [];
  let xTierNote: string | undefined;

  // Free / pay-as-you-go: try a small batch first (lower cost)
  const tweetAttempts = [10, 5];

  for (const maxResults of tweetAttempts) {
    try {
      const tweetsRes = await fetchJson<XTweetsResponse>(
        `${X_API}/users/${user.id}/tweets?max_results=${maxResults}&tweet.fields=public_metrics,created_at&exclude=retweets,replies`,
        { bearerToken: token }
      );
      media = mapTweets(tweetsRes.data);
      if (media.length > 0) break;
    } catch (e) {
      const isTierLimit =
        e instanceof PlatformApiError &&
        (e.status === 403 || e.status === 429);
      if (!isTierLimit) throw e;
      xTierNote =
        "X free/pay-as-you-go tier: tweet timeline not available. Scores use public profile metrics only — less accurate than YouTube.";
      break;
    }
  }

  const pm = user.public_metrics;

  return {
    platform: "x",
    handle: user.username,
    displayName: user.name,
    bio: user.description ?? "",
    location: user.location ?? "",
    profileUrl: `https://x.com/${user.username}`,
    avatarUrl: user.profile_image_url,
    followers: pm?.followers_count ?? 0,
    following: pm?.following_count ?? 0,
    mediaCount: pm?.tweet_count ?? media.length,
    media,
    meta: {
      listedCount: pm?.listed_count,
      xTierNote,
      profileOnly: media.length === 0,
    },
  };
}
