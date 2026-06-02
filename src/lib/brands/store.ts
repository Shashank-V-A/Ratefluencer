import type { BrandProfile } from "@/lib/types";
import { brandDefs } from "@/lib/data/brand-seeds";
import {
  brandEmbedText,
  embedText,
  type EmbeddingProvider,
} from "@/lib/ml/embeddings";
import { finiteOr } from "@/lib/ml/safe-number";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export type BrandRecord = BrandProfile & {
  sessionId?: string;
  embeddingProvider?: EmbeddingProvider;
};

export async function seedDefaultBrandsForSession(
  sessionId: string
): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  const { count } = await supabase
    .from("brands")
    .select("*", { count: "exact", head: true })
    .eq("session_id", sessionId);

  if (count && count > 0) return;

  for (const b of brandDefs) {
    const { vector, provider } = await embedText(brandEmbedText(b));
    await supabase.from("brands").insert({
      session_id: sessionId,
      name: b.name,
      category: b.category,
      description: b.description,
      budget_tier: b.budgetTier,
      keywords: b.keywords,
      embedding: vector,
    });
    void provider;
  }
}

export async function listBrands(sessionId: string): Promise<BrandRecord[]> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    await seedDefaultBrandsForSession(sessionId);
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (!error && data?.length) {
      return data.map((row) => ({
        id: row.id,
        name: row.name,
        category: row.category,
        description: row.description,
        budgetTier: row.budget_tier as BrandProfile["budgetTier"],
        keywords: row.keywords ?? [],
        embedding: (row.embedding as number[]) ?? [],
        sessionId,
        embeddingProvider: "openai",
      }));
    }
  }

  const seeded = await Promise.all(
    brandDefs.map(async (b) => {
      const { vector, provider } = await embedText(brandEmbedText(b));
      return {
        ...b,
        embedding: vector,
        embeddingProvider: provider,
      } satisfies BrandRecord;
    })
  );
  return seeded;
}

export async function createBrand(
  sessionId: string,
  input: {
    name: string;
    category: string;
    description: string;
    budgetTier: BrandProfile["budgetTier"];
    keywords: string[];
  }
): Promise<BrandRecord | null> {
  const { vector, provider } = await embedText(brandEmbedText(input));
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { data, error } = await supabase
      .from("brands")
      .insert({
        session_id: sessionId,
        name: input.name,
        category: input.category,
        description: input.description,
        budget_tier: input.budgetTier,
        keywords: input.keywords,
        embedding: vector,
      })
      .select("*")
      .single();

    if (error || !data) return null;
    return {
      id: data.id,
      name: data.name,
      category: data.category,
      description: data.description,
      budgetTier: data.budget_tier,
      keywords: data.keywords ?? [],
      embedding: vector,
      sessionId,
      embeddingProvider: provider,
    };
  }

  return {
    id: `local-${Date.now()}`,
    ...input,
    embedding: vector,
    sessionId,
    embeddingProvider: provider,
  };
}

export async function deleteBrand(
  sessionId: string,
  brandId: string
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;
  const { error } = await supabase
    .from("brands")
    .delete()
    .eq("id", brandId)
    .eq("session_id", sessionId);
  return !error;
}

export async function retrieveBrandCandidates(
  sessionId: string,
  queryEmbedding: number[],
  limit = 12
): Promise<
  {
    brand: BrandRecord;
    similarity: number;
  }[]
> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase.rpc("match_brands_by_embedding", {
      query_embedding: queryEmbedding,
      match_session_id: sessionId,
      match_count: limit,
    });
    if (!error && data?.length) {
      return data.map(
        (row: {
          id: string;
          name: string;
          category: string;
          description: string;
          budget_tier: string;
          keywords: string[];
          similarity: number;
        }) => ({
          brand: {
            id: row.id,
            name: row.name,
            category: row.category,
            description: row.description,
            budgetTier: row.budget_tier as BrandProfile["budgetTier"],
            keywords: row.keywords ?? [],
            embedding: queryEmbedding,
          },
          similarity: finiteOr(Number(row.similarity), 0),
        })
      );
    }
  }

  const brands = await listBrands(sessionId);
  const { cosineSimilarity } = await import("@/lib/ml/embeddings");
  return brands
    .map((brand) => ({
      brand,
      similarity: cosineSimilarity(queryEmbedding, brand.embedding),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}
