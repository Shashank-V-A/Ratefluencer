import type { InfluencerProfile } from "@/lib/types";
import {
  FEATURE_LABELS,
  RANK_MINT_COEFFICIENTS,
} from "./coefficients";
import { extractFeatures, featuresToVector, type MLFeatures } from "./features";
import { finiteOr, scorePercent } from "./safe-number";

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export function computeRankMintScore(profile: InfluencerProfile): {
  score: number;
  rawRankMint: number;
  campaignSuccessProbability: number;
  featureImportance: { feature: string; impact: number }[];
} {
  const features = extractFeatures(profile);
  const z = finiteOr(dotProduct(features));
  const probability = finiteOr(sigmoid(z), 0.5);
  const rawScore = scorePercent(probability * 100);
  const rawCampaign = Math.round(finiteOr(probability * 1000, 500)) / 10;

  const importance = computeFeatureImportance(features);

  return {
    score: rawScore,
    rawRankMint: rawScore,
    campaignSuccessProbability: rawCampaign,
    featureImportance: importance,
  };
}

function dotProduct(f: MLFeatures): number {
  const c = RANK_MINT_COEFFICIENTS;
  return (
    c.intercept +
    c.engagementRate * f.engagementRate +
    c.shareRate * f.shareRate +
    c.saveRate * f.saveRate +
    c.commentRate * f.commentRate +
    c.viewToFollowerRatio * f.viewToFollowerRatio +
    c.postingConsistency * f.postingConsistency +
    c.growthRate30d * f.growthRate30d +
    c.audienceQuality * f.audienceQuality +
    c.commentQuality * f.commentQuality +
    c.contentCategoryFit * f.contentCategoryFit +
    c.demographicMatch * f.demographicMatch +
    c.authenticityRaw * f.authenticityRaw +
    c.microCreatorBonus * f.microCreatorBonus
  );
}

function computeFeatureImportance(f: MLFeatures) {
  const c = RANK_MINT_COEFFICIENTS;
  const keys = Object.keys(c).filter(
    (k) => k !== "intercept"
  ) as (keyof Omit<typeof c, "intercept">)[];

  const impacts = keys.map((key) => {
    const coef = c[key];
    const value = f[key];
    return {
      feature: FEATURE_LABELS[key],
      impact: Math.abs(coef * value),
    };
  });

  const max = Math.max(...impacts.map((i) => i.impact), 0.01);
  return impacts
    .map((i) => ({
      feature: i.feature,
      impact: Math.round((i.impact / max) * 100),
    }))
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 6);
}

export { extractFeatures, featuresToVector };
