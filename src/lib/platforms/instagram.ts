import { getInstagramStatus } from "@/lib/env";
import { fetchJson } from "./http";
import type { FetchedCreatorRaw, FetchedMediaItem } from "./types";
import { PlatformApiError } from "./types";

const GRAPH = "https://graph.facebook.com/v21.0";

interface IgBusinessDiscoveryResponse {
  business_discovery?: {
    username?: string;
    name?: string;
    biography?: string;
    website?: string;
    followers_count?: number;
    follows_count?: number;
    media_count?: number;
    profile_picture_url?: string;
    media?: {
      data?: {
        id?: string;
        caption?: string;
        like_count?: number;
        comments_count?: number;
        view_count?: number;
        media_type?: string;
        timestamp?: string;
      }[];
    };
  };
  error?: { message?: string; code?: number; error_subcode?: number };
}

function normalizeHandle(handle: string): string {
  return handle.replace(/^@/, "").trim().toLowerCase();
}

export async function fetchInstagramCreator(
  handle: string
): Promise<FetchedCreatorRaw> {
  const status = getInstagramStatus();
  if (!status.configured) {
    throw new PlatformApiError(
      "Instagram Graph API is not configured",
      "NOT_CONFIGURED",
      503,
      `Add to .env.local: ${status.missing.join(", ")}. Requires a Meta app, Instagram Business/Creator account linked to a Facebook Page, and Business Discovery permission.`
    );
  }

  const token = process.env.META_GRAPH_ACCESS_TOKEN!.trim();
  const igUserId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID!.trim();
  const username = normalizeHandle(handle);

  const fields = [
    `business_discovery.username(${username}){`,
    "username,name,biography,website,",
    "followers_count,follows_count,media_count,profile_picture_url,",
    "media.limit(25){id,caption,like_count,comments_count,view_count,media_type,timestamp}",
    "}",
  ].join("");

  const url = `${GRAPH}/${igUserId}?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(token)}`;

  const data = await fetchJson<IgBusinessDiscoveryResponse>(url);

  if (data.error) {
    const msg = data.error.message ?? "Instagram API error";
    if (msg.includes("username") || data.error.error_subcode === 2207013) {
      throw new PlatformApiError(
        `Instagram account @${username} not found or not a Business/Creator account`,
        "NOT_FOUND",
        404,
        "Business Discovery only works for Instagram Business or Creator accounts."
      );
    }
    throw new PlatformApiError(msg, "IG_API_ERROR", 502);
  }

  const bd = data.business_discovery;
  if (!bd?.username) {
    throw new PlatformApiError(
      `Could not load @${username} via Business Discovery`,
      "NOT_FOUND",
      404
    );
  }

  const media: FetchedMediaItem[] = (bd.media?.data ?? []).map((m) => ({
    id: m.id ?? "",
    caption: m.caption ?? "",
    likes: m.like_count ?? 0,
    comments: m.comments_count ?? 0,
    views: m.view_count ?? 0,
    shares: 0,
    saves: 0,
    timestamp: m.timestamp ?? new Date().toISOString(),
    mediaType: m.media_type,
  }));

  return {
    platform: "instagram",
    handle: bd.username,
    displayName: bd.name ?? bd.username,
    bio: bd.biography ?? "",
    location: "",
    profileUrl: `https://www.instagram.com/${bd.username}/`,
    avatarUrl: bd.profile_picture_url,
    followers: bd.followers_count ?? 0,
    following: bd.follows_count ?? 0,
    mediaCount: bd.media_count ?? media.length,
    media,
    meta: { website: bd.website },
  };
}
