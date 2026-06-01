import type { AnalysisResult, BrandProfile, InfluencerProfile } from "@/lib/types";
import { computeAuthenticityScore } from "./authenticity";
import { matchBrands } from "./brand-match";
import { computeGrowthPotential } from "./growth";
import { computeRankMintScore } from "./rank-mint";

const MODEL_VERSION = "rm-ensemble-v1.2-micro-ugc";

export function analyzeInfluencer(
  profile: InfluencerProfile,
  brands: BrandProfile[]
): AnalysisResult {
  const { score: authenticity, flags } = computeAuthenticityScore(profile);
  const { score: growthPotential, forecast } = computeGrowthPotential(profile);
  const brandRecommendations = matchBrands(profile, brands);
  const brandMatch = brandRecommendations[0]?.score ?? 0;
  const {
    score: rankMint,
    campaignSuccessProbability,
    featureImportance,
  } = computeRankMintScore(profile);

  return {
    profile,
    scores: {
      authenticity,
      growthPotential,
      brandMatch,
      rankMint,
      campaignSuccessProbability,
    },
    authenticityFlags: flags,
    growthForecast: forecast,
    brandRecommendations,
    featureImportance,
    modelVersion: MODEL_VERSION,
  };
}
