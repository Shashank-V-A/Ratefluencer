import type { AnalysisResult, InfluencerProfile } from "@/lib/types";
import { MODEL_VERSION } from "@/lib/ml/coefficients";
import { computeAuthenticityScore } from "./authenticity";
import { matchBrands } from "./brand-match";
import { computeGrowthPotential } from "./growth";
import { computeRankMintScore } from "./rank-mint";

export async function analyzeInfluencer(
  profile: InfluencerProfile,
  sessionId: string
): Promise<AnalysisResult> {
  const { score: authenticity, flags } = computeAuthenticityScore(profile);
  const { score: growthPotential, forecast } = computeGrowthPotential(profile);
  const { recommendations: brandRecommendations, embeddingProvider } =
    await matchBrands(profile, sessionId);
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
    embeddingProvider,
  };
}
