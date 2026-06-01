import type { AnalysisResult, BrandProfile, InfluencerProfile } from "@/lib/types";
import { computeAuthenticityScore } from "./authenticity";
import { matchBrands } from "./brand-match";
import { computeGrowthPotential } from "./growth";
import { computeRatefluencerScore } from "./ratefluencer";

const MODEL_VERSION = "rf-ensemble-v1.2-micro-ugc";

export function analyzeInfluencer(
  profile: InfluencerProfile,
  brands: BrandProfile[]
): AnalysisResult {
  const { score: authenticity, flags } = computeAuthenticityScore(profile);
  const { score: growthPotential, forecast } = computeGrowthPotential(profile);
  const brandRecommendations = matchBrands(profile, brands);
  const brandMatch = brandRecommendations[0]?.score ?? 0;
  const {
    score: ratefluencer,
    campaignSuccessProbability,
    featureImportance,
  } = computeRatefluencerScore(profile);

  return {
    profile,
    scores: {
      authenticity,
      growthPotential,
      brandMatch,
      ratefluencer,
      campaignSuccessProbability,
    },
    authenticityFlags: flags,
    growthForecast: forecast,
    brandRecommendations,
    featureImportance,
    modelVersion: MODEL_VERSION,
  };
}
