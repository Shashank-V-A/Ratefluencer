import type { AnalysisResult, Platform } from "@/lib/types";
import { getCachedAnalysis, setCachedAnalysis } from "@/lib/cache/analysis-cache";
import { analyzeInfluencer } from "@/lib/ml/engine";
import { fetchCreatorFromPlatform } from "@/lib/platforms";
import { buildProfileFromFetched } from "@/lib/profile/build";
import { MODEL_VERSION } from "@/lib/ml/coefficients";

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
      return withMeta(cached, {
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

  const scoringNotes = [
    "RankMint™ uses trained logistic weights on live-extracted features (see /methodology).",
    "Authenticity flags are heuristic signals from public metrics, not third-party fraud APIs.",
    profile.demographics.source === "unavailable"
      ? "Audience demographics are not shown — platforms require OAuth for real breakdowns."
      : "Audience demographics sourced from platform API.",
  ];

  if (result.embeddingProvider === "fallback") {
    scoringNotes.push(
      "Brand match uses built-in semantic embeddings (no OpenAI or other AI API key required)."
    );
  } else {
    scoringNotes.push("Brand match used optional cloud embeddings (OPENAI_API_KEY).");
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
    scoringNotes,
  });

  await setCachedAnalysis(platform, normalized, final);
  return final;
}

export { encodeLiveReportId, decodeLiveReportId } from "@/lib/report-id";
