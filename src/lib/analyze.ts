import type { AnalysisResult, Platform } from "@/lib/types";
import { resolveAnalysisBrandIds } from "@/lib/brands/store";
import { getCachedAnalysis, setCachedAnalysis } from "@/lib/cache/analysis-cache";
import { analyzeInfluencer } from "@/lib/ml/engine";
import { getModelMetrics } from "@/lib/ml/model-metrics";
import { fetchCreatorFromPlatform } from "@/lib/platforms";
import { buildProfileFromFetched } from "@/lib/profile/build";
import { MODEL_VERSION } from "@/lib/ml/coefficients";
import { scorePercent } from "@/lib/ml/safe-number";
function sanitizeScores(result: AnalysisResult): AnalysisResult {
  const s = result.scores;
  return {
    ...result,
    scores: {
      authenticity: scorePercent(s.authenticity),
      growthPotential: scorePercent(s.growthPotential),
      brandMatch: scorePercent(s.brandMatch),
      rankMint: scorePercent(s.rankMint),
      campaignSuccessProbability: scorePercent(s.campaignSuccessProbability),
    },
    rawRankMint:
      result.rawRankMint != null ? scorePercent(result.rawRankMint) : undefined,
    brandRecommendations: result.brandRecommendations.map((r) => ({
      ...r,
      score: scorePercent(r.score),
    })),
  };
}

function withMeta(
  result: AnalysisResult,
  meta: AnalysisResult["meta"]
): AnalysisResult {
  return { ...result, meta };
}

export type AnalyzeOptions = {
  sessionId?: string;
  skipCache?: boolean;
  brandIds?: string[];
  brandWeights?: {
    nicheFit: number;
    geographyFit: number;
    engagementQuality: number;
  };
};

async function applyBrandMatches(
  result: AnalysisResult,
  sessionId: string,
  options: AnalyzeOptions
): Promise<AnalysisResult> {
  const { matchBrands } = await import("@/lib/ml/brand-match");
  const { recommendations, embeddingProvider } = await matchBrands(
    result.profile,
    sessionId,
    undefined,
    options.brandWeights,
    options.brandIds
  );
  const brandMatch = scorePercent(recommendations[0]?.score ?? 0);
  const explainability = result.explainability
    ? {
        ...result.explainability,
        brandMatch: {
          ...result.explainability.brandMatch,
          summary:
            brandMatch >= 70
              ? "Strong commercial fit with your selected brands."
              : recommendations.length
                ? "Brand alignment based on your selected workspace brands."
                : "No brands selected — add and check brands on Analyze or Brands.",
          positives: recommendations
            .slice(0, 2)
            .map((r) => `${r.brand.name}: ${r.score}% match`),
        },
      }
    : result.explainability;

  return {
    ...result,
    brandRecommendations: recommendations,
    embeddingProvider,
    scores: { ...result.scores, brandMatch },
    explainability,
  };
}

/** Fetch live data, run ML scoring, optional cache by platform+handle */
export async function analyzeLiveCreator(
  platform: Platform,
  handle: string,
  options: AnalyzeOptions = {}
): Promise<AnalysisResult> {
  const normalized = handle.replace(/^@/, "").trim();
  const modelMetrics = getModelMetrics();
  const sessionId = options.sessionId ?? "anonymous";
  const brandIds = await resolveAnalysisBrandIds(sessionId, options.brandIds);
  const resolvedOptions: AnalyzeOptions = { ...options, sessionId, brandIds };

  if (!resolvedOptions.skipCache) {
    const cached = await getCachedAnalysis(platform, normalized);
    if (cached) {
      const withBrands = await applyBrandMatches(cached, sessionId, resolvedOptions);
      return withMeta(sanitizeScores(withBrands), {
        ...withBrands.meta!,
        cached: true,
        modelVersion: MODEL_VERSION,
        brandIds,
        scoringNotes: [
          ...(withBrands.meta?.scoringNotes ?? []),
          "Creator metrics from cache; brand matches refreshed for your selection.",
        ],
      });
    }
  }

  try {
    const raw = await fetchCreatorFromPlatform(platform, normalized);
    const profile = buildProfileFromFetched(raw);
    const sampleSize = Math.max(1, raw.mediaCount || raw.media.length || 1);
    const confidence = scorePercent(Math.min(96, 55 + Math.log10(sampleSize + 1) * 24));
    const result = await analyzeInfluencer(profile, sessionId, {
      brandWeights: resolvedOptions.brandWeights,
      sampleSize,
      brandIds,
    });

    const warnings: string[] = [];
    if (typeof raw.meta?.xTierNote === "string") {
      warnings.push(raw.meta.xTierNote);
    }
    if (raw.meta?.profileOnly && platform === "x") {
      warnings.push(
        "No recent tweets returned — authenticity and engagement scores use profile-level signals only."
      );
    }

    const final = withMeta(
      {
        ...result,
        modelMetrics: modelMetrics
          ? {
              dataset: modelMetrics.dataset ?? "campaign_labels.csv",
              rows: modelMetrics.rows ?? 0,
              testAccuracy: modelMetrics.testAccuracy ?? 0,
              auc: modelMetrics.auc,
              f1: modelMetrics.f1,
              lastTrainedAt: modelMetrics.trainedAt,
            }
          : undefined,
      },
      {
      source: "live",
      fetchedAt: new Date().toISOString(),
      profileUrl: raw.profileUrl,
      avatarUrl: raw.avatarUrl,
      warnings: warnings.length ? warnings : undefined,
      cached: false,
      modelVersion: MODEL_VERSION,
      embeddingProvider: result.embeddingProvider,
      sampleSize,
      confidence,
      freshnessMinutes: 0,
      brandIds,
    }
    );

    await setCachedAnalysis(platform, normalized, final);
    return final;
  } catch (error) {
    const stale = await getCachedAnalysis(platform, normalized);
    if (stale) {
      const withBrands = await applyBrandMatches(stale, sessionId, resolvedOptions);
      return withMeta(sanitizeScores(withBrands), {
        ...withBrands.meta!,
        cached: true,
        brandIds,
        warnings: [
          ...(withBrands.meta?.warnings ?? []),
          "Live fetch failed, showing last cached snapshot.",
        ],
      });
    }
    throw error;
  }
}

export { encodeLiveReportId, decodeLiveReportId } from "@/lib/report-id";
