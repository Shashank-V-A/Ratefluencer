import type { AnalysisResult, Platform } from "@/lib/types";
import { getCachedAnalysis, setCachedAnalysis } from "@/lib/cache/analysis-cache";
import { analyzeInfluencer } from "@/lib/ml/engine";
import { getModelMetrics } from "@/lib/ml/model-metrics";
import { fetchCreatorFromPlatform } from "@/lib/platforms";
import { buildProfileFromFetched } from "@/lib/profile/build";
import { MODEL_VERSION } from "@/lib/ml/coefficients";
import { scorePercent } from "@/lib/ml/safe-number";
import { getValidYouTubeAccessToken } from "@/lib/youtube-oauth";

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
  brandWeights?: {
    nicheFit: number;
    geographyFit: number;
    engagementQuality: number;
  };
};

/** Fetch live data, run ML scoring, optional cache by platform+handle */
export async function analyzeLiveCreator(
  platform: Platform,
  handle: string,
  options: AnalyzeOptions = {}
): Promise<AnalysisResult> {
  const normalized = handle.replace(/^@/, "").trim();
  const modelMetrics = getModelMetrics();

  if (!options.skipCache) {
    const cached = await getCachedAnalysis(platform, normalized);
    if (cached) {
      if (platform === "youtube" && cached.profile.demographics.source !== "api") {
        const hasYoutubeOAuth = Boolean(await getValidYouTubeAccessToken());
        if (hasYoutubeOAuth) {
          // Re-fetch live once to upgrade demographics from inferred/unavailable to API.
        } else {
          return withMeta(sanitizeScores(cached), {
            ...cached.meta!,
            cached: true,
            modelVersion: MODEL_VERSION,
          });
        }
      } else {
      return withMeta(sanitizeScores(cached), {
        ...cached.meta!,
        cached: true,
        modelVersion: MODEL_VERSION,
      });
      }
    }
  }

  try {
    const raw = await fetchCreatorFromPlatform(platform, normalized);
    const profile = buildProfileFromFetched(raw);
    const sampleSize = Math.max(1, raw.mediaCount || raw.media.length || 1);
    const confidence = scorePercent(Math.min(96, 55 + Math.log10(sampleSize + 1) * 24));
    const result = await analyzeInfluencer(profile, options.sessionId ?? "anonymous", {
      brandWeights: options.brandWeights,
      sampleSize,
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
    }
    );

    await setCachedAnalysis(platform, normalized, final);
    return final;
  } catch (error) {
    const stale = await getCachedAnalysis(platform, normalized);
    if (stale) {
      return withMeta(sanitizeScores(stale), {
        ...stale.meta!,
        cached: true,
        warnings: [
          ...(stale.meta?.warnings ?? []),
          "Live fetch failed, showing last cached snapshot.",
        ],
      });
    }
    throw error;
  }
}

export { encodeLiveReportId, decodeLiveReportId } from "@/lib/report-id";
