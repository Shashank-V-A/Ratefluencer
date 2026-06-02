"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { BrandProfile } from "@/lib/types";

type Props = {
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
  disabled?: boolean;
};

export function BrandAnalysisPicker({
  selectedIds,
  onSelectedIdsChange,
  disabled,
}: Props) {
  const [brands, setBrands] = useState<BrandProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/brands");
      const data = await res.json();
      const list = (data.brands ?? []) as BrandProfile[];
      setBrands(list);
      return list;
    } catch {
      setError("Could not load brands");
      return [] as BrandProfile[];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void load().then((list) => {
      if (cancelled || !list.length) return;
      onSelectedIdsChange(
        list.filter((b) => b.includeInAnalysis !== false).map((b) => b.id)
      );
    });
    return () => {
      cancelled = true;
    };
  }, [load, onSelectedIdsChange]);

  async function toggle(brand: BrandProfile, checked: boolean) {
    const next = checked
      ? [...new Set([...selectedIds, brand.id])]
      : selectedIds.filter((id) => id !== brand.id);
    onSelectedIdsChange(next);

    const res = await fetch("/api/brands", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: brand.id, includeInAnalysis: checked }),
    });
    if (!res.ok) {
      setError("Could not save brand selection — check Supabase migration.");
      await load();
    }
  }

  if (loading) {
    return (
      <p className="text-xs text-muted-foreground">Loading your brands…</p>
    );
  }

  if (brands.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
        No brands in your workspace.{" "}
        <Link href="/brands" className="font-medium text-primary hover:underline">
          Add brands
        </Link>{" "}
        (e.g. Duolingo) to see match scores on the full report.
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Brands for full analysis</p>
        <p className="text-xs text-muted-foreground">
          {selectedIds.length} of {brands.length} selected
        </p>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Check the brands you want scored on the report. Uncheck to hide a brand
        (e.g. only show Duolingo).
      </p>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <ul className="max-h-48 space-y-2 overflow-y-auto pr-1">
        {brands.map((b) => {
          const checked = selectedIds.includes(b.id);
          return (
            <li key={b.id}>
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                  checked
                    ? "border-primary/30 bg-primary/5"
                    : "border-border bg-white"
                } ${disabled ? "pointer-events-none opacity-50" : ""}`}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                  checked={checked}
                  disabled={disabled}
                  onChange={(e) => toggle(b, e.target.checked)}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{b.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {b.category || "Uncategorized"}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <Link
        href="/brands"
        className="inline-block text-xs font-medium text-primary hover:underline"
      >
        Manage brands →
      </Link>
    </div>
  );
}
