import type { AuthenticityFlags, InfluencerProfile } from "@/lib/types";
import { extractFeatures } from "./features";

export function computeAuthenticityScore(profile: InfluencerProfile): {
  score: number;
  flags: AuthenticityFlags;
} {
  const s = profile.signals;
  const f = extractFeatures(profile);

  const purchasedRisk =
    s.ghostFollowerEstimate * 0.5 +
    (s.followingFollowerRatio > 0.08 ? 0.35 : 0) +
    (s.followerGrowthSpike30d > 0.35 ? 0.25 : 0);

  const podRisk =
    s.podActivityScore * 0.7 + (s.duplicateCommentRate > 0.12 ? 0.25 : 0);

  const botRisk =
    s.botCommentPercent * 0.85 +
    (s.commentToLikeRatio < 0.008 ? 0.2 : 0);

  const spikeRisk =
    s.followerGrowthSpike30d > 0.4 && s.engagementVariance > 0.35
      ? 0.65
      : s.engagementVariance * 0.4;

  const raw =
    f.authenticityRaw * 0.55 +
    (1 - purchasedRisk) * 0.15 +
    (1 - podRisk) * 0.15 +
    (1 - botRisk) * 0.1 +
    (1 - spikeRisk) * 0.05;

  const score = Math.round(clamp(raw, 0, 1) * 100);

  return {
    score,
    flags: {
      purchasedFollowers: riskLevel(purchasedRisk),
      engagementPods: riskLevel(podRisk),
      botActivity: riskLevel(botRisk),
      artificialSpikes: riskLevel(spikeRisk),
    },
  };
}

function riskLevel(v: number): "low" | "medium" | "high" {
  if (v < 0.28) return "low";
  if (v < 0.55) return "medium";
  return "high";
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
