import type { AnalysisResult, Platform } from "@/lib/types";
import { MODEL_VERSION } from "@/lib/ml/coefficients";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const memory = new Map<string, { result: AnalysisResult; expiresAt: number }>();

function cacheKey(platform: Platform, handle: string) {
  return `${platform}:${handle.toLowerCase()}`;
}

function ttlMs(): number {
  const hours = Number(process.env.ANALYSIS_CACHE_HOURS ?? 6);
  return (Number.isFinite(hours) && hours > 0 ? hours : 6) * 60 * 60 * 1000;
}

export async function getCachedAnalysis(
  platform: Platform,
  handle: string
): Promise<AnalysisResult | null> {
  const key = cacheKey(platform, handle);
  const now = Date.now();

  const mem = memory.get(key);
  if (mem && mem.expiresAt > now) return mem.result;
  if (mem) memory.delete(key);

  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("analysis_cache")
    .select("result, expires_at, model_version")
    .eq("platform", platform)
    .eq("handle", handle.toLowerCase())
    .maybeSingle();

  if (error || !data) return null;
  if (new Date(data.expires_at).getTime() <= now) {
    await supabase
      .from("analysis_cache")
      .delete()
      .eq("platform", platform)
      .eq("handle", handle.toLowerCase());
    return null;
  }

  const result = data.result as AnalysisResult;
  if (data.model_version !== MODEL_VERSION) return null;

  memory.set(key, {
    result,
    expiresAt: new Date(data.expires_at).getTime(),
  });
  return result;
}

export async function setCachedAnalysis(
  platform: Platform,
  handle: string,
  result: AnalysisResult
): Promise<void> {
  const key = cacheKey(platform, handle);
  const expiresAt = new Date(Date.now() + ttlMs());

  memory.set(key, { result, expiresAt: expiresAt.getTime() });

  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  await supabase.from("analysis_cache").upsert(
    {
      platform,
      handle: handle.toLowerCase(),
      result,
      model_version: MODEL_VERSION,
      expires_at: expiresAt.toISOString(),
    },
    { onConflict: "platform,handle" }
  );
}

