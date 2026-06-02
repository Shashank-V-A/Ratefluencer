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
    try {
      await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          description,
          keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
        }),
      });
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
    await fetch(`/api/brands?id=${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <PageShell>
      <PageTitle subtitle="Add real brand briefs for embedding + RAG retrieval during analysis. Legacy demo catalog entries are removed automatically.">
        Brand workspace
      </PageTitle>

      <GlassPanel className="mb-8">
        <form onSubmit={addBrand} className="space-y-4">
          <Input
            placeholder="Brand name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="border-primary/15 bg-primary/[0.04]"
          />
          <Input
            placeholder="Category (e.g. D2C Beauty)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border-primary/15 bg-primary/[0.04]"
          />
          <textarea
            placeholder="Brand brief — who you partner with and why"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-24 w-full rounded-lg border border-primary/15 bg-primary/[0.04] px-3 py-2 text-sm"
          />
          <Input
            placeholder="Keywords, comma-separated"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="border-primary/15 bg-primary/[0.04]"
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Adding…" : "Add brand"}
          </Button>
        </form>
      </GlassPanel>

      <div className="space-y-3">
        {brands.map((b) => (
          <GlassPanel key={b.id} className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium">{b.name}</p>
              <p className="text-xs text-muted-foreground">{b.category}</p>
              <p className="mt-2 text-sm text-muted-foreground">{b.description}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => remove(b.id)}
              className="shrink-0 text-muted-foreground"
            >
              Remove
            </Button>
          </GlassPanel>
        ))}
      </div>
    </PageShell>
  );
}
