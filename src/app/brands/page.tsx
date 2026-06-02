"use client";

import { useEffect, useState } from "react";
import type { BrandProfile } from "@/lib/types";
import { GlassPanel, PageShell, PageTitle } from "@/components/ui/page-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function BrandsPage() {
  const [brands, setBrands] = useState<BrandProfile[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/brands");
    const data = await res.json();
    setBrands(data.brands ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function addBrand(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          description,
          keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not add brand");
        return;
      }
      setName("");
      setCategory("");
      setDescription("");
      setKeywords("");
      await load();
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    setBrands((prev) => prev.filter((b) => b.id !== id));
    const res = await fetch(`/api/brands?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      await load();
      return;
    }
    await load();
  }

  async function toggleInclude(id: string, includeInAnalysis: boolean) {
    setBrands((prev) =>
      prev.map((b) => (b.id === id ? { ...b, includeInAnalysis } : b))
    );
    const res = await fetch("/api/brands", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, includeInAnalysis }),
    });
    if (!res.ok) await load();
  }

  const analysisCount = brands.filter((b) => b.includeInAnalysis !== false).length;

  return (
    <PageShell>
      <PageTitle subtitle="Add brands you care about. Only checked brands appear with match scores on full creator analysis. Removed brands stay deleted.">
        Brand workspace
      </PageTitle>

      <GlassPanel className="mb-8">
        <form onSubmit={addBrand} className="space-y-4">
          <Input
            placeholder="Brand name (e.g. Duolingo)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="border-border bg-white shadow-sm"
          />
          <Input
            placeholder="Category (e.g. EdTech / App)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border-border bg-white shadow-sm"
          />
          <textarea
            placeholder="Brand brief — who you partner with and why"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-24 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm"
          />
          <Input
            placeholder="Keywords, comma-separated"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="border-border bg-white shadow-sm"
          />
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? "Adding…" : "Add brand"}
          </Button>
        </form>
      </GlassPanel>

      {brands.length === 0 ? (
        <GlassPanel>
          <p className="text-sm text-muted-foreground">
            No brands yet. Add Duolingo, Glossier, or any partner you want scored on
            the Analyze report.
          </p>
        </GlassPanel>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {analysisCount} of {brands.length} brand{brands.length === 1 ? "" : "s"}{" "}
            included in full analysis
          </p>
          {brands.map((b) => (
            <GlassPanel key={b.id} className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{b.name}</p>
                <p className="text-xs text-muted-foreground">{b.category}</p>
                <p className="mt-2 text-sm text-muted-foreground">{b.description}</p>
                <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={b.includeInAnalysis !== false}
                    onChange={(e) => toggleInclude(b.id, e.target.checked)}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  <span className="text-muted-foreground">
                    Include in full analysis
                  </span>
                </label>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => remove(b.id)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                Remove
              </Button>
            </GlassPanel>
          ))}
        </div>
      )}
    </PageShell>
  );
}
