import { getYouTubeStatus } from "@/lib/env";
import { fetchJson } from "./http";
import type { FetchedCreatorRaw, FetchedMediaItem } from "./types";
import { PlatformApiError } from "./types";

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
    },
  };
}
