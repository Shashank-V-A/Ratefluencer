import { brands } from "@/lib/data/brands";
import { analyzeInfluencer } from "@/lib/ml/engine";
import { fetchCreatorFromPlatform } from "@/lib/platforms";
import { buildProfileFromFetched } from "@/lib/profile/build";
import type { AnalysisResult, Platform } from "@/lib/types";

function withMeta(
  result: ReturnType<typeof analyzeInfluencer>,
  meta: AnalysisResult["meta"]
): AnalysisResult {
  return { ...result, meta };
}

/** Fetch live data from Instagram, YouTube, or X and run ML scoring */
export async function analyzeLiveCreator(
  platform: Platform,
  handle: string
): Promise<AnalysisResult> {
  const raw = await fetchCreatorFromPlatform(platform, handle);
  const profile = buildProfileFromFetched(raw);
  const result = analyzeInfluencer(profile, brands);
  const warnings: string[] = [];
  if (typeof raw.meta?.xTierNote === "string") {
    warnings.push(raw.meta.xTierNote);
  }
  if (raw.meta?.profileOnly && platform === "x") {
    warnings.push(
      "No recent tweets returned — authenticity and engagement scores use profile-level signals only."
    );
  }
  return withMeta(result, {
    source: "live",
    fetchedAt: new Date().toISOString(),
    profileUrl: raw.profileUrl,
    avatarUrl: raw.avatarUrl,
    warnings: warnings.length ? warnings : undefined,
  });
}

export { encodeLiveReportId, decodeLiveReportId } from "@/lib/report-id";
