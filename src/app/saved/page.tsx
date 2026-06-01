"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GlassPanel, PageShell, PageTitle } from "@/components/ui/page-shell";
import { encodeLiveReportId } from "@/lib/report-id";
import type { Platform } from "@/lib/types";

type SavedRow = {
  id: string;
  platform: string;
  handle: string;
  display_name: string;
  rank_mint_score: number;
  created_at: string;
};

export default function SavedPage() {
  const [reports, setReports] = useState<SavedRow[]>([]);
  const [needsSupabase, setNeedsSupabase] = useState(false);

  async function load() {
    const res = await fetch("/api/reports/saved");
    const data = await res.json();
    setReports(data.reports ?? []);
    setNeedsSupabase(data.supabase === false);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    await fetch(`/api/reports/saved?id=${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <PageShell>
      <PageTitle subtitle="Saved creator reports for your session (Supabase-backed).">
        Shortlist
      </PageTitle>

      {needsSupabase && (
        <p className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-sm text-amber-100/90">
          Configure Supabase in <code className="rounded bg-black/20 px-1">.env.local</code> to
          persist saved reports.
        </p>
      )}

      <div className="space-y-3">
        {reports.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No saved reports yet. Analyze a creator and click Save on the report.
          </p>
        )}
        {reports.map((r) => (
          <GlassPanel
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-4"
          >
            <div>
              <p className="font-medium">{r.display_name}</p>
              <p className="text-sm text-muted-foreground">
                @{r.handle} · {r.platform} · RankMint {r.rank_mint_score}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/report/${encodeLiveReportId(r.platform as Platform, r.handle)}`}
                className="text-sm text-primary hover:underline"
              >
                Open
              </Link>
              <button
                type="button"
                onClick={() => remove(r.id)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Remove
              </button>
            </div>
          </GlassPanel>
        ))}
      </div>
    </PageShell>
  );
}
