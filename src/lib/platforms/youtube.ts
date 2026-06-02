import { getYouTubeStatus } from "@/lib/env";
import { fetchJson } from "./http";
import type { FetchedCreatorRaw, FetchedMediaItem } from "./types";
import { PlatformApiError } from "./types";
import { getValidYouTubeAccessToken } from "@/lib/youtube-oauth";

const YT_BASE = "https://www.googleapis.com/youtube/v3";

interface YtChannelResponse {
  items?: {
    id: string;
    snippet?: {
      title?: string;
      description?: string;
      customUrl?: string;
      country?: string;
      thumbnails?: { high?: { url?: string } };
    };
    statistics?: {
      subscriberCount?: string;
      videoCount?: string;
      viewCount?: string;
    };
    contentDetails?: { relatedPlaylists?: { uploads?: string } };
  }[];
}

interface YtPlaylistResponse {
  items?: {
    contentDetails?: { videoId?: string };
    snippet?: { publishedAt?: string; title?: string; description?: string };
  }[];
  nextPageToken?: string;
}

interface YtVideosResponse {
  items?: {
    id: string;
    snippet?: { publishedAt?: string; title?: string; description?: string };
    statistics?: {
      viewCount?: string;
      likeCount?: string;
      commentCount?: string;
      favoriteCount?: string;
    };
    contentDetails?: { duration?: string };
  }[];
}

interface YtAnalyticsResponse {
  columnHeaders?: { name: string }[];
  rows?: (string | number)[][];
}

function hasRealDemographicsData(input: {
  ageGroups?: { range: string; percent: number }[];
  topCountries?: { country: string; percent: number }[];
  genderSplit?: { female: number; male: number; other: number };
}): boolean {
  const ageSum = (input.ageGroups ?? []).reduce((s, r) => s + (r.percent || 0), 0);
  const countrySum = (input.topCountries ?? []).reduce(
    (s, r) => s + (r.percent || 0),
    0
  );
  const gender =
    (input.genderSplit?.female ?? 0) +
    (input.genderSplit?.male ?? 0) +
    (input.genderSplit?.other ?? 0);
  return ageSum > 0 || countrySum > 0 || gender > 0;
}

function normalizeHandle(handle: string): string {
  return handle.replace(/^@/, "").trim();
}

function parseDuration(iso?: string): number {
  if (!iso) return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (
    parseInt(m[1] || "0", 10) * 3600 +
    parseInt(m[2] || "0", 10) * 60 +
    parseInt(m[3] || "0", 10)
  );
}

export async function fetchYouTubeCreator(
  handle: string
): Promise<FetchedCreatorRaw> {
  const status = getYouTubeStatus();
  if (!status.configured) {
    throw new PlatformApiError(
      "YouTube API is not configured",
      "NOT_CONFIGURED",
      503,
      `Add to .env.local: ${status.missing.join(", ")}`
    );
  }

  const key = process.env.YOUTUBE_API_KEY!.trim();
  const username = normalizeHandle(handle);

  let channelRes = await fetchJson<YtChannelResponse>(
    `${YT_BASE}/channels?part=snippet,statistics,contentDetails&forHandle=${encodeURIComponent(username)}&key=${key}`
  );

  if (!channelRes.items?.length) {
    channelRes = await fetchJson<YtChannelResponse>(
      `${YT_BASE}/search?part=snippet&type=channel&q=${encodeURIComponent(username)}&maxResults=1&key=${key}`
    ).then(async (search) => {
      const channelId = (search as { items?: { id?: { channelId?: string } }[] })
        .items?.[0]?.id?.channelId;
      if (!channelId) return { items: [] };
      return fetchJson<YtChannelResponse>(
        `${YT_BASE}/channels?part=snippet,statistics,contentDetails&id=${channelId}&key=${key}`
      );
    });
  }

  const channel = channelRes.items?.[0];
  if (!channel) {
    throw new PlatformApiError(
      `YouTube channel not found for @${username}`,
      "NOT_FOUND",
      404,
      "Check the handle matches the channel custom URL (e.g. @mkbhd)."
    );
  }

  const uploadsPlaylist = channel.contentDetails?.relatedPlaylists?.uploads;
  const media: FetchedMediaItem[] = [];
  let avgDurationSec = 0;

  if (uploadsPlaylist) {
    const playlist = await fetchJson<YtPlaylistResponse>(
      `${YT_BASE}/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylist}&maxResults=25&key=${key}`
    );
    const videoIds = playlist.items
      ?.map((i) => i.contentDetails?.videoId)
      .filter(Boolean) as string[];

    if (videoIds.length) {
      const videos = await fetchJson<YtVideosResponse>(
        `${YT_BASE}/videos?part=snippet,statistics,contentDetails&id=${videoIds.join(",")}&key=${key}`
      );
      let durationSum = 0;
      for (const v of videos.items ?? []) {
        const dur = parseDuration(v.contentDetails?.duration);
        durationSum += dur;
        media.push({
          id: v.id,
          caption: [v.snippet?.title, v.snippet?.description]
            .filter(Boolean)
            .join(" ")
            .slice(0, 500),
          likes: Number(v.statistics?.likeCount) || 0,
          comments: Number(v.statistics?.commentCount) || 0,
          views: Number(v.statistics?.viewCount) || 0,
          shares: 0,
          saves: Number(v.statistics?.favoriteCount) || 0,
          timestamp: v.snippet?.publishedAt ?? new Date().toISOString(),
          mediaType: "video",
        });
      }
      if (media.length) avgDurationSec = durationSum / media.length;
      media.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    }
  }

  const stats = channel.statistics;
  const snippet = channel.snippet;
  const oauthToken = await getValidYouTubeAccessToken();
  let demographics:
    | {
        source: "api";
        ageGroups?: { range: string; percent: number }[];
        topCountries?: { country: string; percent: number }[];
        genderSplit?: { female: number; male: number; other: number };
      }
    | undefined;

  if (oauthToken) {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 30);
      const fmt = (d: Date) => d.toISOString().slice(0, 10);

      const byAgeGender = await fetchJson<YtAnalyticsResponse>(
        `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=${fmt(startDate)}&endDate=${fmt(endDate)}&metrics=viewerPercentage&dimensions=ageGroup,gender`,
        { bearerToken: oauthToken, platform: "youtube" }
      );

      const byCountry = await fetchJson<YtAnalyticsResponse>(
        `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=${fmt(startDate)}&endDate=${fmt(endDate)}&metrics=views&dimensions=country&sort=-views&maxResults=5`,
        { bearerToken: oauthToken, platform: "youtube" }
      );

      const ageMap = new Map<string, number>();
      let female = 0;
      let male = 0;
      let other = 0;
      for (const row of byAgeGender.rows ?? []) {
        const age = String(row[0] ?? "");
        const gender = String(row[1] ?? "").toLowerCase();
        const pct = Number(row[2] ?? 0);
        ageMap.set(age, (ageMap.get(age) ?? 0) + pct);
        if (gender.includes("female")) female += pct;
        else if (gender.includes("male")) male += pct;
        else other += pct;
      }

      const countriesRaw = (byCountry.rows ?? [])
        .map((r) => ({ country: String(r[0] ?? ""), views: Number(r[1] ?? 0) }))
        .filter((r) => r.country && Number.isFinite(r.views) && r.views > 0);
      const totalViews = countriesRaw.reduce((s, r) => s + r.views, 0) || 1;

      const candidate: NonNullable<typeof demographics> = {
        source: "api",
        ageGroups: [...ageMap.entries()]
          .map(([range, percent]) => ({
            range,
            percent: Math.round(percent * 10) / 10,
          }))
          .slice(0, 6),
        topCountries: countriesRaw.map((r) => ({
          country: r.country,
          percent: Math.round((r.views / totalViews) * 1000) / 10,
        })),
        genderSplit: {
          female: Math.round(female * 10) / 10,
          male: Math.round(male * 10) / 10,
          other: Math.max(0, Math.round(other * 10) / 10),
        },
      };
      if (hasRealDemographicsData(candidate)) {
        demographics = candidate;
      }
    } catch {
      // Keep core flow resilient; demographics fall back to inferred later.
    }
  }

  return {
    platform: "youtube",
    handle: snippet?.customUrl?.replace(/^@/, "") || username,
    displayName: snippet?.title ?? username,
    bio: snippet?.description ?? "",
    location: snippet?.country ?? "",
    profileUrl: `https://www.youtube.com/@${username}`,
    avatarUrl: snippet?.thumbnails?.high?.url,
    followers: parseInt(stats?.subscriberCount ?? "0", 10),
    following: 0,
    mediaCount: parseInt(stats?.videoCount ?? "0", 10),
    media,
    meta: {
      totalChannelViews: parseInt(stats?.viewCount ?? "0", 10),
      avgDurationSec,
      channelCountry: snippet?.country ?? "",
      demographics,
    },
  };
}
