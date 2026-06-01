import { brands } from "@/lib/data/brands";
import { creators, getCreatorByHandle, getCreatorById } from "@/lib/data/creators";
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

export function analyzeAllCreators(): AnalysisResult[] {
  return creators
    .map((c) =>
      withMeta(analyzeInfluencer(c, brands), {
        source: "demo",
        fetchedAt: new Date().toISOString(),
      })
    )
    .sort((a, b) => b.scores.ratefluencer - a.scores.ratefluencer);
}

export function analyzeCreatorById(id: string): AnalysisResult | null {
  const profile = getCreatorById(id);
  if (!profile) return null;
  return withMeta(analyzeInfluencer(profile, brands), {
    source: "demo",
    fetchedAt: new Date().toISOString(),
  });
}

export function analyzeCreatorByHandle(
  handle: string,
  platform?: Platform
): AnalysisResult | null {
  const profile = getCreatorByHandle(handle);
  if (profile) {
    if (platform && profile.platform !== platform) return null;
    return withMeta(analyzeInfluencer(profile, brands), {
      source: "demo",
      fetchedAt: new Date().toISOString(),
    });
  }
  return null;
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
      "No recent tweets returned — authenticity and engagement scores are estimates from follower/following ratios."
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
