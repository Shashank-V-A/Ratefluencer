import type {
  AnalysisResult,
  BrandPriorityWeights,
  InfluencerProfile,
} from "@/lib/types";
import { MODEL_VERSION } from "@/lib/ml/coefficients";
import { applyScaleCalibration, getCreatorTier } from "./creator-tier";
import { scorePercent } from "./safe-number";
import { computeAuthenticityScore } from "./authenticity";
import { matchBrands } from "./brand-match";
import { computeGrowthPotential } from "./growth";
import { computeRankMintScore } from "./rank-mint";

export async function analyzeInfluencer(
  profile: InfluencerProfile,
  sessionId: string,
  options?: {
    brandWeights?: BrandPriorityWeights;
    sampleSize?: number;
    brandIds?: string[];
  }
): Promise<AnalysisResult> {
  const { score: authenticity, flags } = computeAuthenticityScore(profile);
  const growth = computeGrowthPotential(profile);
  const { recommendations: brandRecommendations, embeddingProvider } =
    await matchBrands(
      profile,
      sessionId,
      undefined,
      options?.brandWeights,
      options?.brandIds
    );
  const brandMatch = scorePercent(brandRecommendations[0]?.score ?? 0);
  const rank = computeRankMintScore(profile);

  const calibrated = applyScaleCalibration(profile, {
    rankMint: rank.rawRankMint,
    campaignSuccessProbability: rank.campaignSuccessProbability,
    growthPotential: growth.score,
  });

  const sampleSize = Math.max(
    1,
    options?.sampleSize ?? profile.metrics.postsLast30Days ?? 1
  );
  const confidence = scorePercent(
    Math.min(96, 55 + Math.log10(sampleSize + 1) * 24)
  );

  const explainability: NonNullable<AnalysisResult["explainability"]> = {
    authenticity: {
      summary:
        authenticity >= 80
          ? "High authenticity: low fraud-risk patterns across engagement signals."
          : "Authenticity risk detected from follower-quality and interaction patterns.",
      positives: [
        flags.purchasedFollowers === "low"
          ? "Low purchased-follower risk"
          : "Purchased-follower risk is not low",
        flags.botActivity === "low"
          ? "Comment patterns look human"
          : "Bot-like comment behavior present",
      ],
      negatives: [
        flags.engagementPods !== "low"
          ? "Pod-like interaction clusters detected"
          : "Limited pod-like activity",
        flags.artificialSpikes !== "low"
          ? "Artificial growth spikes detected"
          : "No major artificial spike indicators",
      ],
      confidence,
      sampleSize,
    },
    growthPotential: {
      summary:
        calibrated.growthPotential >= 70
          ? "Strong growth momentum from consistency and reach efficiency."
          : "Growth potential is moderate due to weaker momentum signals.",
      positives: [
        `90-day follower growth forecast: +${growth.forecast.followerGrowth90d}%`,
        `Engagement growth forecast: +${growth.forecast.engagementGrowth90d}%`,
      ],
      negatives: [
        profile.metrics.postsLast30Days < 8
          ? "Low posting cadence in last 30 days"
          : "Posting cadence is healthy",
        profile.metrics.avgReelViews < profile.metrics.followers * 0.08
          ? "Views-to-follower ratio is below benchmark"
          : "Views-to-follower ratio is competitive",
      ],
      confidence,
      sampleSize,
    },
    brandMatch: {
      summary:
        brandMatch >= 70
          ? "Strong commercial fit with top catalog brands."
          : "Brand alignment is moderate; refine brand briefs for tighter fit.",
      positives: brandRecommendations
        .slice(0, 2)
        .map((r) => `${r.brand.name}: ${r.score}% match`),
      negatives: [
        "Lower-ranked candidates show weaker semantic alignment",
        "Commerce fit may improve with more specific brand keywords",
      ],
      confidence,
      sampleSize,
    },
    campaignSuccessProbability: {
      summary:
        calibrated.campaignSuccessProbability >= 60
          ? "Model estimates strong campaign conversion potential."
          : "Model indicates conservative campaign success probability.",
      positives: rank.featureImportance
        .slice(0, 2)
        .map((f) => `High driver: ${f.feature}`),
      negatives: rank.featureImportance
        .slice(-2)
        .map((f) => `Weak driver: ${f.feature}`),
      confidence,
      sampleSize,
    },
    rankMint: {
      summary:
        calibrated.rankMint >= 75
          ? "Creator is a strong candidate for performance-led partnerships."
          : "Creator needs stronger growth or brand-fit signals for top-tier ranking.",
      positives: [
        `Authenticity ${scorePercent(authenticity)}`,
        `Brand match ${scorePercent(brandMatch)}`,
      ],
      negatives: [
        `Growth potential ${scorePercent(calibrated.growthPotential)}`,
        `Campaign success ${scorePercent(calibrated.campaignSuccessProbability)}%`,
      ],
      confidence,
      sampleSize,
    },
  };

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
    explainability,
  };
}
