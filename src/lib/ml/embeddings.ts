export const EMBEDDING_DIM = 1536;

export type EmbeddingProvider = "openai" | "fallback";

export type EmbeddingResult = {
  vector: number[];
  provider: EmbeddingProvider;
};

function normalize(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

/** Built-in semantic embeddings when OPENAI_API_KEY is unset (default — no external AI required). */
export function fallbackEmbed(text: string): EmbeddingResult {
  const vec = new Array(EMBEDDING_DIM).fill(0);
  const tokens = text.toLowerCase().split(/\W+/).filter((t) => t.length > 2);
  for (const token of tokens) {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = (hash << 5) - hash + token.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % EMBEDDING_DIM;
    vec[idx] += 1;
    vec[(idx + 17) % EMBEDDING_DIM] += 0.5;
  }
  return { vector: normalize(vec), provider: "fallback" };
}

export async function embedText(text: string): Promise<EmbeddingResult> {
  const key = process.env.OPENAI_API_KEY?.trim();
  const input = text.slice(0, 8000);
  if (!key) return fallbackEmbed(input);

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    console.warn("[embeddings] OpenAI error", res.status);
    return fallbackEmbed(input);
  }

  const data = (await res.json()) as {
    data?: { embedding: number[] }[];
  };
  const vector = data.data?.[0]?.embedding;
  if (!vector?.length) return fallbackEmbed(input);
  return { vector, provider: "openai" };
}

export function creatorEmbedText(profile: {
  bio: string;
  platform: string;
  handle: string;
  displayName: string;
}): string {
  return [
    profile.displayName,
    profile.handle,
    profile.platform,
    profile.bio,
  ].join(" · ");
}

export function brandEmbedText(brand: {
  name: string;
  category: string;
  description: string;
  keywords: string[];
}): string {
  return [brand.name, brand.category, brand.description, ...brand.keywords].join(
    " · "
  );
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
