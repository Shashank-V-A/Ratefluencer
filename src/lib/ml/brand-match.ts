import type {
  BrandPriorityWeights,
  BrandProfile,
  InfluencerProfile,
} from "@/lib/types";
import { retrieveBrandCandidates } from "@/lib/brands/store";
import {
  creatorEmbedText,
  embedText,
  type EmbeddingProvider,
} from "@/lib/ml/embeddings";
import { extractFeatures } from "./features";
import { clampFinite, finiteOr, scorePercent } from "./safe-number";

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
  topK = 4,
  weights?: BrandPriorityWeights
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
  const resolved = weights ?? {
    nicheFit: 0.5,
    geographyFit: 0.15,
    engagementQuality: 0.35,
  };
  const total = Math.max(
    resolved.nicheFit + resolved.geographyFit + resolved.engagementQuality,
    0.0001
  );
  const nicheW = resolved.nicheFit / total;
  const geoW = resolved.geographyFit / total;
  const engageW = resolved.engagementQuality / total;

  const ranked = candidates.map(({ brand, similarity }) => {
    const engagementQuality =
      f.saveRate * 0.45 + f.shareRate * 0.3 + f.commentQuality * 0.25;
    const geographyFit =
      profile.demographics.source === "unavailable"
        ? 0.55
        : f.demographicMatch;
    const commerceFit =
      finiteOr(similarity) * nicheW +
      finiteOr(geographyFit) * geoW +
      finiteOr(engagementQuality) * engageW;
    const raw = finiteOr(commerceFit);
    const score = scorePercent(clampFinite(raw, 0, 1) * 100);
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
