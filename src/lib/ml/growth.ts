import type { InfluencerProfile } from "@/lib/types";
import { extractFeatures } from "./features";

export function computeGrowthPotential(profile: InfluencerProfile): {
  score: number;
  forecast: {
    followerGrowth90d: number;
    engagementGrowth90d: number;
    audienceExpansion: number;
  };
} {
  const f = extractFeatures(profile);
  const s = profile.signals;
  const m = profile.metrics;

  const momentum =
    f.growthRate30d * 0.35 +
    f.postingConsistency * 0.25 +
    f.viewToFollowerRatio * 0.15 +
    f.saveRate * 0.15 +
    (1 - s.engagementVariance) * 0.1;

  const microMultiplier =
    m.followers < 50_000 ? 1.08 : m.followers < 120_000 ? 1 : 0.92;

  const score = Math.round(
    clamp(momentum * microMultiplier, 0, 1) * 100
  );

  const baseFollowerGrowth =
    (s.followerGrowthSpike30d * 0.6 + f.postingConsistency * 0.25) * 100;
  const followerGrowth90d = Math.round(
    baseFollowerGrowth * (score / 100) * 1.4
  );

  const engagementGrowth90d = Math.round(
    (f.engagementRate * 400 + f.saveRate * 35 + f.shareRate * 28) *
      (score / 85)
  );

  const audienceExpansion = Math.round(
    (profile.demographics.source === "api"
      ? (profile.demographics.topCountries?.[0]?.percent ?? 40)
      : 40) *
      0.35 *
      (score / 100)
  );

  return {
    score,
    forecast: {
      followerGrowth90d: clampNum(followerGrowth90d, 2, 48),
      engagementGrowth90d: clampNum(engagementGrowth90d, 5, 62),
      audienceExpansion: clampNum(audienceExpansion, 8, 35),
    },
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function clampNum(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
