import type { BrandProfile, InfluencerProfile } from "@/lib/types";
import { retrieveBrandCandidates } from "@/lib/brands/store";
import {
  creatorEmbedText,
  embedText,
  type EmbeddingProvider,
} from "@/lib/ml/embeddings";
import { extractFeatures } from "./features";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function buildRationale(
  profile: InfluencerProfile,
  brand: BrandProfile,
  semantic: number,
  score: number,
  matchedKeywords: string[]
): string {
  const parts: string[] = [];
  if (semantic > 0.55) {
    parts.push(
      `Embedding similarity (${(semantic * 100).toFixed(0)}%) with ${brand.name} (${brand.category}).`
    );
  }
  if (matchedKeywords.length) {
    parts.push(`Matched terms: ${matchedKeywords.slice(0, 4).join(", ")}.`);
  }
  if (profile.metrics.saves / Math.max(profile.metrics.likes, 1) > 0.08) {
    parts.push("Strong save rate suggests purchase-intent audience.");
  }
  if (score >= 80) {
    parts.push("Recommended for performance-based partnerships.");
  }
  return parts.join(" ") || `Moderate partnership potential with ${brand.name}.`;
}

function matchedKeywords(
  profile: InfluencerProfile,
  brand: BrandProfile
): string[] {
  const hay = `${profile.bio} ${profile.handle}`.toLowerCase();
  return brand.keywords.filter((k) => hay.includes(k.toLowerCase()));
}

export async function matchBrands(
  profile: InfluencerProfile,
  sessionId: string,
  topK = 4
): Promise<{
  recommendations: {
    brand: BrandProfile;
    score: number;
    rationale: string;
  }[];
  embeddingProvider: EmbeddingProvider;
}> {
  const { vector, provider } = await embedText(creatorEmbedText(profile));
  const candidates = await retrieveBrandCandidates(sessionId, vector, 12);
  const f = extractFeatures(profile);

  const ranked = candidates.map(({ brand, similarity }) => {
    const commerceFit =
      f.saveRate * 0.35 + f.shareRate * 0.25 + f.contentCategoryFit * 0.4;
    const raw = similarity * 0.55 + commerceFit * 0.45;
    const score = Math.round(clamp(raw, 0, 1) * 100);
    const rationale = buildRationale(
      profile,
      brand,
      similarity,
      score,
      matchedKeywords(profile, brand)
    );
    return { brand, score, rationale };
  });

  return {
    recommendations: ranked.sort((a, b) => b.score - a.score).slice(0, topK),
    embeddingProvider: provider,
  };
}
