import type { FetchedCreatorRaw } from "@/lib/platforms/types";
import { finiteOr } from "@/lib/ml/safe-number";
import { inferSignals, unavailableDemographics } from "@/lib/signals/infer";
import type { InfluencerProfile } from "@/lib/types";

function num(value: number | undefined | null): number {
  return finiteOr(Number(value), 0);
}

function daysAgo(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24);
}

function hashGradient(handle: string): string {
  const gradients = [
    "from-rose-400 via-orange-300 to-amber-200",
    "from-amber-300 via-yellow-200 to-lime-200",
    "from-indigo-400 via-violet-400 to-fuchsia-300",
    "from-emerald-400 via-teal-300 to-cyan-200",
    "from-fuchsia-500 via-pink-400 to-rose-300",
  ];
  let h = 0;
  for (let i = 0; i < handle.length; i++) h += handle.charCodeAt(i);
  return gradients[h % gradients.length]!;
}

function estimatePurchaseIntent(
  saveToLike: number,
  engagementRate: number
): "low" | "medium" | "high" {
  if (saveToLike > 0.12 && engagementRate > 0.02) return "high";
  if (saveToLike > 0.06 || engagementRate > 0.012) return "medium";
  return "low";
}

export function buildProfileFromFetched(
  raw: FetchedCreatorRaw
): InfluencerProfile {
  const media = raw.media;
  let postsLast30Days = media.filter((m) => daysAgo(m.timestamp) <= 30).length;
  let postsLast90Days = media.filter((m) => daysAgo(m.timestamp) <= 90).length;

  let totalLikes = media.reduce((s, m) => s + num(m.likes), 0);
  let totalComments = media.reduce((s, m) => s + num(m.comments), 0);
  let totalShares = media.reduce((s, m) => s + num(m.shares), 0);
  let totalSaves = media.reduce((s, m) => s + num(m.saves), 0);
  let totalViews = media.reduce((s, m) => s + num(m.views), 0);

  if (media.length === 0 && raw.platform === "x" && raw.followers > 0) {
    const estPosts = Math.min(
      30,
      Math.max(1, Math.floor((raw.mediaCount || 100) / 100))
    );
    postsLast30Days = estPosts;
    postsLast90Days = estPosts * 3;
    const estEng = raw.followers * 0.008;
    totalLikes = Math.round(estEng * 0.7);
    totalComments = Math.round(estEng * 0.15);
    totalShares = Math.round(estEng * 0.1);
    totalSaves = Math.round(estEng * 0.05);
    totalViews = Math.round(raw.followers * 0.12);
  }

  const videoItems = media.filter(
    (m) => m.views > 0 || m.mediaType === "video" || m.mediaType === "REEL"
  );
  const avgReelViews =
    videoItems.length > 0
      ? videoItems.reduce((s, m) => s + num(m.views), 0) / videoItems.length
      : raw.followers > 0
        ? totalViews / Math.max(media.length, 1)
        : 0;

  const reach = Math.max(raw.followers, 1);
  const postCount = Math.max(media.length, postsLast30Days > 0 ? 1 : 1);
  const engagementRate =
    (totalLikes + totalComments + totalShares + totalSaves) / reach / postCount;

  const signals = inferSignals(raw, {
    totalLikes,
    totalComments,
    totalShares,
    totalSaves,
    totalViews,
    postsLast30: postsLast30Days,
    postsLast90: postsLast90Days,
    avgViews: avgReelViews,
  });

  const saveToLike = totalSaves / Math.max(totalLikes, 1);
  const purchaseIntent = estimatePurchaseIntent(saveToLike, engagementRate);

  const apiDemographics = raw.meta?.demographics as
    | InfluencerProfile["demographics"]
    | undefined;
  const demographics =
    apiDemographics?.source === "api"
      ? apiDemographics
      : { ...unavailableDemographics(), purchaseIntent };

  const id = `${raw.platform}-${raw.handle}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");

  return {
    id,
    handle: raw.handle,
    displayName: raw.displayName,
    platform: raw.platform,
    bio: raw.bio.slice(0, 500),
    location: raw.location || "—",
    avatarGradient: hashGradient(raw.handle),
    metrics: {
      followers: raw.followers,
      following: raw.following,
      likes: totalLikes,
      comments: totalComments,
      shares: totalShares,
      saves: totalSaves,
      views: totalViews,
      postsLast30Days,
      postsLast90Days,
      avgReelViews: Math.round(avgReelViews),
      avgReelDurationSec:
        typeof raw.meta?.avgDurationSec === "number"
          ? Math.round(raw.meta.avgDurationSec)
          : 30,
    },
    demographics,
    signals,
    pastCampaigns: 0,
    campaignSuccessRate: finiteOr(
      Math.min(0.92, 0.45 + engagementRate * 8 + saveToLike * 0.5),
      0.55
    ),
  };
}
