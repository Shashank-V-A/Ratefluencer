import type { BrandProfile, InfluencerProfile } from "@/lib/types";
import { extractFeatures } from "./features";

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export function embedCreator(profile: InfluencerProfile): number[] {
  const text = [profile.bio, profile.platform, profile.handle]
    .join(" ")
    .toLowerCase();

  const dims = 32;
  const vec = new Array(dims).fill(0);
  const tokens = text.split(/\W+/).filter((t) => t.length > 2);

  for (const token of tokens) {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = (hash << 5) - hash + token.charCodeAt(i);
      hash |= 0;
    }
    vec[Math.abs(hash) % dims] += 1;
  }

  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

export function matchBrands(
  profile: InfluencerProfile,
  brands: BrandProfile[],
  topK = 4
): { brand: BrandProfile; score: number; rationale: string }[] {
  const creatorVec = embedCreator(profile);
  const f = extractFeatures(profile);

  const ranked = brands.map((brand) => {
    const semantic = cosineSimilarity(creatorVec, brand.embedding);
    const commerceFit =
      f.saveRate * 0.35 + f.shareRate * 0.25 + f.contentCategoryFit * 0.4;

    const raw = semantic * 0.55 + commerceFit * 0.45;
    const score = Math.round(clamp(raw, 0, 1) * 100);
    const rationale = buildRationale(profile, brand, semantic, score);

    return { brand, score, rationale };
  });

  return ranked.sort((a, b) => b.score - a.score).slice(0, topK);
}

function buildRationale(
  profile: InfluencerProfile,
  brand: BrandProfile,
  semantic: number,
  score: number
): string {
  const parts: string[] = [];
  if (semantic > 0.55) {
    parts.push(
      `Bio and content align with ${brand.name}'s category (${brand.category}).`
    );
  }
  if (profile.metrics.saves / Math.max(profile.metrics.likes, 1) > 0.08) {
    parts.push("Strong save rate suggests purchase-intent audience.");
  }
  if (score >= 80) {
    parts.push("Recommended for performance-based partnerships.");
  }
  return parts.join(" ") || `Moderate partnership potential with ${brand.name}.`;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
