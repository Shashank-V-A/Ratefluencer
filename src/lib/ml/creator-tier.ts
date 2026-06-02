import type { InfluencerProfile } from "@/lib/types";
import { finiteOr, scorePercent } from "./safe-number";

export type CreatorTier = "micro" | "mid" | "mega";

const MICRO_MAX = 85_000;
const MEGA_MIN = 500_000;

export function getCreatorTier(followers: number): CreatorTier {
  if (followers >= MEGA_MIN) return "mega";
  if (followers > MICRO_MAX) return "mid";
  return "micro";
}

export function tierLabel(tier: CreatorTier): string {
  switch (tier) {
    case "micro":
      return "Micro UGC (3k–85k)";
    case "mid":
      return "Mid-tier (85k–500k)";
    case "mega":
      return "Mega (500k+)";
  }
}

/** Scale dampening for authenticity heuristics at large follower counts */
export function authenticityScaleFactor(followers: number): number {
  if (followers >= 5_000_000) return 0.25;
  if (followers >= MEGA_MIN) return 0.4;
  if (followers >= 200_000) return 0.65;
  return 1;
}

export type CalibratedScores = {
  rankMint: number;
  campaignSuccessProbability: number;
  growthPotential: number;
  calibrationNote?: string;
};

export function applyScaleCalibration(
  profile: InfluencerProfile,
  scores: {
    rankMint: number;
    campaignSuccessProbability: number;
    growthPotential: number;
  }
): CalibratedScores {
  const tier = getCreatorTier(profile.metrics.followers);
  let rankMint = scorePercent(scores.rankMint);
  let campaignSuccessProbability = scorePercent(scores.campaignSuccessProbability);
  let growthPotential = scorePercent(scores.growthPotential);
  let calibrationNote: string | undefined;

  if (tier === "mega") {
    const cap = 82;
    if (rankMint > cap) {
      rankMint = cap;
      campaignSuccessProbability = Math.min(campaignSuccessProbability, cap + 2);
      calibrationNote =
        "RankMint calibrated for mega creators — model is tuned for micro UGC; scores are capped.";
    }
    growthPotential = Math.min(growthPotential, 45);
  } else if (tier === "mid") {
    const cap = 92;
    if (rankMint > cap) {
      rankMint = cap;
      campaignSuccessProbability = Math.min(campaignSuccessProbability, cap + 1);
    }
    const damped = scorePercent(finiteOr(growthPotential) * 0.85);
    growthPotential = Math.min(growthPotential, damped);
  }

  return {
    rankMint,
    campaignSuccessProbability,
    growthPotential,
    calibrationNote,
  };
}
