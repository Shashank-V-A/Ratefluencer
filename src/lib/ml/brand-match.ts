import type { BrandProfile, ContentNiche, InfluencerProfile } from "@/lib/types";
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

/** Lightweight embedding from creator bio + tags (RAG retrieval key) */
export function embedCreator(profile: InfluencerProfile): number[] {
  const text = [
    profile.bio,
    profile.nicheLabel,
    ...profile.contentTags,
  ]
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
    const idx = Math.abs(hash) % dims;
    vec[idx] += 1;
  }

  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

function nicheOverlap(
  creatorNiche: ContentNiche,
  brandNiches: ContentNiche[]
): number {
  if (brandNiches.includes(creatorNiche)) return 1;
  const related: Record<ContentNiche, ContentNiche[]> = {
    "skincare-routines": ["product-recommendations", "amazon-finds"],
    "amazon-finds": ["product-recommendations", "budget-fashion"],
    "budget-fashion": ["amazon-finds", "college-lifestyle"],
    "cafe-reels": ["college-lifestyle", "home-decor"],
    "college-lifestyle": ["budget-fashion", "cafe-reels"],
    "product-recommendations": ["amazon-finds", "skincare-routines"],
    "fitness-ugc": ["college-lifestyle", "product-recommendations"],
    "home-decor": ["cafe-reels", "amazon-finds"],
  };
  const relatedSet = related[creatorNiche] ?? [];
  return brandNiches.some((n) => relatedSet.includes(n)) ? 0.65 : 0.35;
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
    const niche = nicheOverlap(profile.niche, brand.targetNiches);
    const commerceFit =
      f.saveRate * 0.35 + f.shareRate * 0.25 + f.contentCategoryFit * 0.4;

    const raw =
      semantic * 0.42 + niche * 0.33 + commerceFit * 0.25;
    const score = Math.round(clamp(raw, 0, 1) * 100);

    const rationale = buildRationale(profile, brand, semantic, niche, score);

    return { brand, score, rationale };
  });

  return ranked
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

function buildRationale(
  profile: InfluencerProfile,
  brand: BrandProfile,
  semantic: number,
  niche: number,
  score: number
): string {
  const parts: string[] = [];
  if (niche >= 0.9) {
    parts.push(
      `${profile.displayName}'s ${profile.nicheLabel} content aligns directly with ${brand.name}'s category.`
    );
  } else if (niche >= 0.6) {
    parts.push(
      `Adjacent niche fit — ${profile.nicheLabel} audiences overlap with ${brand.category} buyers.`
    );
  }
  if (semantic > 0.55) {
    parts.push(
      "Bio and content embeddings show strong semantic overlap (RAG retrieval confidence high)."
    );
  }
  if (profile.metrics.saves / Math.max(profile.metrics.likes, 1) > 0.08) {
    parts.push(
      "High save rate signals purchase-intent content — ideal for short-form commerce."
    );
  }
  if (score >= 80) {
    parts.push("Recommended for performance-based UGC campaigns.");
  }
  return parts.join(" ") || `Moderate partnership potential with ${brand.name}.`;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
