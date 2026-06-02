import type { BrandProfile } from "@/lib/types";
import { legacyDemoBrandNames } from "@/lib/data/brand-seeds";
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
  includeInAnalysis?: boolean;
};

function normalizeBrandName(name: string): string {
  return name.trim().toLowerCase();
}

async function purgeLegacyDemoBrands(sessionId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  for (const name of legacyDemoBrandNames) {
    await supabase
      .from("brands")
      .delete()
      .eq("session_id", sessionId)
      .eq("name", name);
  }
}

/** Keep newest row per brand name; delete duplicate rows in Supabase */
async function deduplicateSessionBrands(sessionId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  const { data, error } = await supabase
    .from("brands")
    .select("id, name, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false });

  if (error || !data?.length) return;

  const keepIds = new Set<string>();
  const deleteIds: string[] = [];

  for (const row of data) {
    const key = normalizeBrandName(row.name);
    if (!key) continue;
    if (keepIds.has(key)) {
      deleteIds.push(row.id);
    } else {
      keepIds.add(key);
    }
  }

  if (deleteIds.length) {
    await supabase.from("brands").delete().in("id", deleteIds);
  }
}

function mapRow(row: {
  id: string;
  name: string;
  category: string;
  description: string;
  budget_tier: string;
  keywords: string[] | null;
  embedding: number[] | null;
  include_in_analysis?: boolean | null;
}): BrandRecord {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    budgetTier: row.budget_tier as BrandProfile["budgetTier"],
    keywords: row.keywords ?? [],
    embedding: (row.embedding as number[]) ?? [],
    includeInAnalysis: row.include_in_analysis ?? true,
  };
}

function dedupeBrandRecords(brands: BrandRecord[]): BrandRecord[] {
  const byName = new Map<string, BrandRecord>();
  for (const b of brands) {
    const key = normalizeBrandName(b.name);
    if (!key) continue;
    if (!byName.has(key)) byName.set(key, b);
  }
  return [...byName.values()];
}

export async function listBrands(sessionId: string): Promise<BrandRecord[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  await purgeLegacyDemoBrands(sessionId);
  await deduplicateSessionBrands(sessionId);

  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) return [];
  return dedupeBrandRecords(
    (data ?? []).map((row) => ({
      ...mapRow(row),
      sessionId,
      embeddingProvider: "openai",
    }))
  );
}

/** Brands flagged for scoring on creator reports */
export async function listBrandsForAnalysis(
  sessionId: string
): Promise<BrandRecord[]> {
  const brands = await listBrands(sessionId);
  return brands.filter((b) => b.includeInAnalysis !== false);
}

/** Resolve which brand IDs to score (explicit selection or all included). */
export async function resolveAnalysisBrandIds(
  sessionId: string,
  brandIds?: string[]
): Promise<string[]> {
  const included = await listBrandsForAnalysis(sessionId);
  const allowed = new Set(included.map((b) => b.id));

  if (brandIds !== undefined && brandIds.length > 0) {
    return brandIds.filter((id) => allowed.has(id));
  }

  return included.map((b) => b.id);
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
  const supabase = getSupabaseAdmin();
  const trimmedName = input.name.trim();
  if (!trimmedName) return null;

  const { vector, provider } = await embedText(brandEmbedText({ ...input, name: trimmedName }));

  if (supabase) {
    await deduplicateSessionBrands(sessionId);

    const { data: existing } = await supabase
      .from("brands")
      .select("id")
      .eq("session_id", sessionId)
      .ilike("name", trimmedName)
      .maybeSingle();

    if (existing?.id) {
      const { data, error } = await supabase
        .from("brands")
        .update({
          category: input.category,
          description: input.description,
          budget_tier: input.budgetTier,
          keywords: input.keywords,
          embedding: vector,
          include_in_analysis: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .eq("session_id", sessionId)
        .select("*")
        .single();

      if (error || !data) return null;
      return {
        ...mapRow(data),
        embedding: vector,
        sessionId,
        embeddingProvider: provider,
      };
    }

    const { data, error } = await supabase
      .from("brands")
      .insert({
        session_id: sessionId,
        name: trimmedName,
        category: input.category,
        description: input.description,
        budget_tier: input.budgetTier,
        keywords: input.keywords,
        embedding: vector,
        include_in_analysis: true,
      })
      .select("*")
      .single();

    if (error || !data) return null;
    return {
      ...mapRow(data),
      embedding: vector,
      sessionId,
      embeddingProvider: provider,
    };
  }

  return {
    id: `local-${Date.now()}`,
    ...input,
    name: trimmedName,
    embedding: vector,
    sessionId,
    embeddingProvider: provider,
    includeInAnalysis: true,
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

export async function setBrandIncludeInAnalysis(
  sessionId: string,
  brandId: string,
  includeInAnalysis: boolean
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;
  const { error } = await supabase
    .from("brands")
    .update({
      include_in_analysis: includeInAnalysis,
      updated_at: new Date().toISOString(),
    })
    .eq("id", brandId)
    .eq("session_id", sessionId);
  return !error;
}

export async function retrieveBrandCandidates(
  sessionId: string,
  queryEmbedding: number[],
  limit = 12,
  brandIds?: string[]
): Promise<
  {
    brand: BrandRecord;
    similarity: number;
  }[]
> {
  const ids = await resolveAnalysisBrandIds(sessionId, brandIds);
  const brands = (await listBrandsForAnalysis(sessionId)).filter((b) =>
    ids.includes(b.id)
  );
  const { cosineSimilarity } = await import("@/lib/ml/embeddings");
  return brands
    .map((brand) => ({
      brand,
      similarity: cosineSimilarity(queryEmbedding, brand.embedding),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}
