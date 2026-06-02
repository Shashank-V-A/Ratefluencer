import type { AnalysisResult, Platform } from "@/lib/types";
import { getCachedAnalysis, setCachedAnalysis } from "@/lib/cache/analysis-cache";
import { analyzeInfluencer } from "@/lib/ml/engine";
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
};

/** Fetch live data, run ML scoring, optional cache by platform+handle */
export async function analyzeLiveCreator(
  platform: Platform,
  handle: string,
  options: AnalyzeOptions = {}
): Promise<AnalysisResult> {
  const normalized = handle.replace(/^@/, "").trim();

  if (!options.skipCache) {
    const cached = await getCachedAnalysis(platform, normalized);
    if (cached) {
      return withMeta(sanitizeScores(cached), {
        ...cached.meta!,
        cached: true,
        modelVersion: MODEL_VERSION,
      });
    }
  }

  const raw = await fetchCreatorFromPlatform(platform, normalized);
  const profile = buildProfileFromFetched(raw);
  const result = await analyzeInfluencer(
    profile,
    options.sessionId ?? "anonymous"
  );

  const warnings: string[] = [];
  if (typeof raw.meta?.xTierNote === "string") {
    warnings.push(raw.meta.xTierNote);
  }
  if (raw.meta?.profileOnly && platform === "x") {
    warnings.push(
      "No recent tweets returned — authenticity and engagement scores use profile-level signals only."
    );
  }

  const final = withMeta(result, {
      source: "live",
      fetchedAt: new Date().toISOString(),
      profileUrl: raw.profileUrl,
      avatarUrl: raw.avatarUrl,
      warnings: warnings.length ? warnings : undefined,
      cached: false,
      modelVersion: MODEL_VERSION,
      embeddingProvider: result.embeddingProvider,
    });

  await setCachedAnalysis(platform, normalized, final);
  return final;
}

export { encodeLiveReportId, decodeLiveReportId } from "@/lib/report-id";
