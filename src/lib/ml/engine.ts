import type { AnalysisResult, InfluencerProfile } from "@/lib/types";
import { MODEL_VERSION } from "@/lib/ml/coefficients";
import { applyScaleCalibration, getCreatorTier } from "./creator-tier";
import { scorePercent } from "./safe-number";
import { computeAuthenticityScore } from "./authenticity";
import { matchBrands } from "./brand-match";
import { computeGrowthPotential } from "./growth";
import { computeRankMintScore } from "./rank-mint";

export async function analyzeInfluencer(
  profile: InfluencerProfile,
  sessionId: string
): Promise<AnalysisResult> {
  const { score: authenticity, flags } = computeAuthenticityScore(profile);
  const growth = computeGrowthPotential(profile);
  const { recommendations: brandRecommendations, embeddingProvider } =
    await matchBrands(profile, sessionId);
  const brandMatch = scorePercent(brandRecommendations[0]?.score ?? 0);
  const rank = computeRankMintScore(profile);

  const calibrated = applyScaleCalibration(profile, {
    rankMint: rank.rawRankMint,
    campaignSuccessProbability: rank.campaignSuccessProbability,
    growthPotential: growth.score,
  });

  return {
    profile,
    scores: {
      authenticity: scorePercent(authenticity),
      growthPotential: scorePercent(calibrated.growthPotential),
      brandMatch,
      rankMint: scorePercent(calibrated.rankMint),
      campaignSuccessProbability: scorePercent(
        calibrated.campaignSuccessProbability
      ),
    },
    rawRankMint: scorePercent(rank.rawRankMint),
    authenticityFlags: flags,
    growthForecast: growth.forecast,
    brandRecommendations,
    featureImportance: rank.featureImportance,
    modelVersion: MODEL_VERSION,
    embeddingProvider,
    creatorTier: getCreatorTier(profile.metrics.followers),
  };
}
